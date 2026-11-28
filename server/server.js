/* ============================================================
 * 拾忆 · 部署版服务（Node.js 20，零依赖）
 * 静态托管 public/ + 加固版 AI 通道：
 *  - /api/llm  ：提示词白名单（仅拾忆自有模板）、请求体上限、限流、密钥仅服务端
 *  - /api/fetch：SSRF 防护（私网 IP/重定向校验）、超时与体积上限
 * 密钥经运行时环境变量注入，绝不进入前端代码。
 * ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const net = require('net');
const { TOOLS, CARD_TAIL } = require('./toolbox.js');

const PORT = parseInt(process.env.PORT || '8000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const API_KEY = process.env.SHIYI_API_KEY || '';
const MODEL = process.env.SHIYI_MODEL || 'deepseek-v4.1-flash';
const BASE_URL = (process.env.SHIYI_BASE_URL || 'https://ws-87k3b558xqetd2mn.cn-beijing.maas.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '');

/* ---------------- 限流（内存实现，重启即清零） ---------------- */
const buckets = new Map();          // ip -> { llm: [ts], fetch: [ts], tb: [ts] }
const LLM_PER_HOUR_IP = 20;
const FETCH_PER_HOUR_IP = 60;
const TOOLBOX_PER_HOUR_IP = 40;     // 工具箱独立小时额度（多轮对话消耗大）
const LLM_DAY_GLOBAL = 400;
let llmDay = [];                    // 全局 24h 滚动计数（主线 + 工具箱共享）

function prune(arr, now, span) { return arr.filter(t => now - t < span); }
function rateLimit(ip, kind) {
  const now = Date.now();
  const b = buckets.get(ip) || { llm: [], fetch: [], tb: [] };
  b.llm = prune(b.llm, now, 3600000);
  b.fetch = prune(b.fetch, now, 3600000);
  b.tb = prune(b.tb, now, 3600000);
  llmDay = prune(llmDay, now, 86400000);
  let ok = true;
  if (kind === 'llm') {
    ok = b.llm.length < LLM_PER_HOUR_IP && llmDay.length < LLM_DAY_GLOBAL;
    if (ok) { b.llm.push(now); llmDay.push(now); }
  } else if (kind === 'tb') {
    ok = b.tb.length < TOOLBOX_PER_HOUR_IP && llmDay.length < LLM_DAY_GLOBAL;
    if (ok) { b.tb.push(now); llmDay.push(now); }   // 计入共享日上限
  } else {
    ok = b.fetch.length < FETCH_PER_HOUR_IP;
    if (ok) b.fetch.push(now);
  }
  buckets.set(ip, b);
  return ok;
}
function clientIp(req) {
  const raw = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  return raw || 'unknown';
}

/* ---------------- 工具 ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp'
};
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
/* 长请求保活：部署网关约 30s 无响应字节即断（504 request_timeout）。
   立即写响应头，等待上游期间每 10s 写一个换行——JSON.parse 容忍前导空白，
   客户端 r.json() 不受影响。上游完成后一次性写完整 JSON。 */
function sendJsonKeepalive(res, workPromise) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  const ping = setInterval(() => { try { res.write('\n'); } catch (e) {} }, 10000);
  workPromise.then(obj => {
    clearInterval(ping);
    try { res.end(JSON.stringify(obj)); } catch (e) {}
  }).catch(e => {
    clearInterval(ping);
    try { res.end(JSON.stringify({ ok: false, error: String(e.message || e).slice(0, 300) })); } catch (_) {}
  });
}
function readBody(req, cap) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > cap) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function stripHtml(raw) {
  raw = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');
  raw = raw.replace(/<[^>]+>/g, ' ');
  raw = raw.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return raw.replace(/\s+/g, ' ').trim();
}

/* ---------------- SSRF 防护 ---------------- */
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 127 || p[0] === 10 || p[0] === 0 || p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    return false;
  }
  const low = ip.toLowerCase();
  if (low === '::1' || low === '::') return true;
  if (/^f[cd]/.test(low)) return true;              // fc00::/7 unique local
  if (/^fe[89ab]/.test(low)) return true;           // fe80::/10 link local
  return false;
}
const netMod = { isIPv4: s => net.isIP(s) === 4 };
function unsafeHost(hostname, ip) {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || !h.includes('.')) return true;
  if (netMod.isIPv4(h)) return isPrivateIp(h);
  if (ip) return isPrivateIp(ip);
  return false;
}
function lookupIp(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true }, (err, addrs) => {
      if (err) return reject(err);
      resolve(addrs.map(a => a.address));
    });
  });
}
async function assertSafeUrl(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch (e) { throw new Error('invalid url'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid protocol');
  if (unsafeHost(u.hostname, null)) throw new Error('blocked host');
  try {
    const ips = await lookupIp(u.hostname);
    if (ips.some(ip => isPrivateIp(ip))) throw new Error('blocked address');
  } catch (e) {
    if (String(e.message || e).startsWith('blocked')) throw e;
    throw new Error('dns failed');
  }
  return u;
}

/* ---------------- 上游 AI 调用 ---------------- */
const LLM_TIMEOUT = 120000;
const FETCH_TIMEOUT = 25000;
async function callUpstream(messages) {
  if (!API_KEY) throw new Error('server missing SHIYI_API_KEY');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT);
  try {
    const r = await fetch(BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.4, stream: false }),
      signal: ctrl.signal
    });
    const text = await r.text();
    if (!r.ok) throw new Error('upstream HTTP ' + r.status + ': ' + text.slice(0, 200));
    const j = JSON.parse(text);
    return { ok: true, content: j.choices[0].message.content };
  } finally { clearTimeout(timer); }
}

/* ---------------- /api/fetch ---------------- */
const WX_VERIFY_RE = /环境异常|请完成验证|操作存在异常|访问过于频繁|去验证|异常访问/;
async function handleFetch(req, res, body) {
  /* 抓取最长 3 跳 × 25s，可能超过网关 30s 无字节窗口 → 立即写头 + 心跳保活 */
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  const ping = setInterval(() => { try { res.write('\n'); } catch (e) {} }, 10000);
  const finish = obj => { clearInterval(ping); try { res.end(JSON.stringify(obj)); } catch (e) {} };
  let input;
  try { input = JSON.parse(body || '{}'); } catch (e) { return finish({ ok: false, error: 'bad json' }); }
  const urlStr = String(input.url || '').trim();
  let url;
  try { url = await assertSafeUrl(urlStr); } catch (e) { return finish({ ok: false, error: String(e.message || e) }); }
  let current = url;
  let html = '';
  try {
    for (let hop = 0; hop < 3; hop++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
      const r = await fetch(current, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if ([301, 302, 303, 307, 308].includes(r.status)) {
        const loc = r.headers.get('location');
        if (!loc) break;
        current = new URL(loc, current);
        await assertSafeUrl(current.href);        // 每一跳重新校验
        continue;
      }
      if (!r.ok && r.status >= 400) return finish({ ok: false, error: 'HTTP ' + r.status });
      const buf = await r.arrayBuffer();
      html = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, 3000000));
      break;
    }
    if (!html) return finish({ ok: false, error: 'no content (redirect loop?)' });
  } catch (e) {
    return finish({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
  const tm = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let title = tm ? stripHtml(tm[1]).slice(0, 200) : '';
  /* 微信文章 <title> 常为空，真标题在 msg_title 变量或 og:title（调试会话结论） */
  if (!title) {
    const mm = html.match(/msg_title\s*=\s*['"]([^'"]{1,300})['"]/)
      || html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{1,300})["'][^>]+property=["']og:title["']/i);
    if (mm) title = stripHtml(mm[1]).slice(0, 200);
  }
  const text = stripHtml(html).slice(0, 30000);
  /* 反爬挑战页检测：微信对数据中心 IP 的间歇性验证页（调试会话 weixin-fetch-verify-page 结论）。
     命中时返回结构化错误，不把验证页文案冒充正文。 */
  if (WX_VERIFY_RE.test(html) || (text.length < 400 && /验证/.test(text) && !/。/.test(text))) {
    return finish({ ok: false, error: 'wx-verify' });
  }
  const paras = [];
  for (const p of html.split(/<\/(?:p|div|section|article|h[1-6]|li|blockquote|td)>/i)) {
    const t = stripHtml(p);
    if (t.length >= 15) paras.push(t.slice(0, 800));
    if (paras.length >= 120) break;
  }
  finish({ ok: true, title, text, paragraphs: paras });
}

/* ---------------- /api/llm ---------------- */
async function handleLlm(req, res, body) {
  let input;
  try { input = JSON.parse(body || '{}'); } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
  const msgs = Array.isArray(input.messages) ? input.messages : null;
  if (!msgs || msgs.length !== 2) return sendJson(res, 400, { ok: false, error: 'bad messages' });
  const sys = String(msgs[0].content || '');
  const user = String(msgs[1].content || '');
  if (msgs[0].role !== 'system' || msgs[1].role !== 'user') return sendJson(res, 400, { ok: false, error: 'bad roles' });
  if (!sys.startsWith('你是「拾忆」')) return sendJson(res, 403, { ok: false, error: 'prompt not allowed' });  // 白名单：仅拾忆自有模板
  if (user.length > 28000) return sendJson(res, 400, { ok: false, error: 'content too large' });
  sendJsonKeepalive(res, callUpstream([
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ]));
}

/* ---------------- /api/llm-toolbox ----------------
   工具箱专用通道：prompt 模板全部保存在服务端（toolbox.js），
   前端只传工具 id + 填空值 +（多轮对话时的）历史消息。
   不接受任意 system prompt，与主线一样无法被当作开放代理使用。 */
function fillTemplate(tpl, values) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => {
    const v = values && values[k] !== undefined ? String(values[k]).trim() : '';
    return v;
  }).replace(/^\s+/, '').replace(/\n{3,}/g, '\n\n');
}
/* 必填字段（与服务端模板占位符一致；talent/lifedesign 无必填） */
const TOOL_REQUIRED = {
  duallayer: ['topic'], reverse: ['example', 'goal'], socratic: ['confusion'],
  crossaxis: ['subject'], factcheck: ['claim'], panel: ['problem'],
  firstprinciple: ['problem'], crossdomain: ['confusion'], steelman: ['decision'],
  mvp: ['idea'], talent: [], lifedesign: []
};
async function handleToolbox(req, res, body) {
  let input;
  try { input = JSON.parse(body || '{}'); } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
  const tool = TOOLS[String(input.tool || '')];
  if (!tool) return sendJson(res, 400, { ok: false, error: 'unknown tool' });
  const values = (input.values && typeof input.values === 'object' && !Array.isArray(input.values)) ? input.values : {};
  /* 必填校验只在「提交起点」执行：single 总是；chat 仅首轮（history 为空）。
     对话续轮不回传填空值是正常行为，不应 400。 */
  const isFirstTurn = !(tool.mode === 'chat' && Array.isArray(input.history) && input.history.length > 0);
  if (isFirstTurn) {
    for (const k of (TOOL_REQUIRED[input.tool] || [])) {
      const v = String(values[k] === undefined ? '' : values[k]).trim();
      if (!v) return sendJson(res, 400, { ok: false, error: 'missing field: ' + k });
      if (v.length > 12000) return sendJson(res, 400, { ok: false, error: 'field too large: ' + k });
    }
  }

  let messages;
  if (tool.mode === 'single') {
    /* 必填校验 + 长度上限 */
    const user = fillTemplate(tool.user, values);
    if (/\{\w+\}/.test(user)) return sendJson(res, 400, { ok: false, error: 'missing field' });
    if (user.length > 28000) return sendJson(res, 400, { ok: false, error: 'content too large' });
    messages = [
      { role: 'system', content: tool.system + CARD_TAIL },
      { role: 'user', content: user }
    ];
  } else {
    /* chat：首轮由 first 模板 + 填空值生成，之后回传对话历史 */
    const history = Array.isArray(input.history) ? input.history : [];
    if (history.length > 40) return sendJson(res, 400, { ok: false, error: 'history too long' });
    const hmsgs = [];
    for (const h of history) {
      const role = h && h.role;
      const content = h && typeof h.content === 'string' ? h.content : '';
      if ((role !== 'user' && role !== 'assistant') || !content || content.length > 8000) {
        return sendJson(res, 400, { ok: false, error: 'bad history' });
      }
      hmsgs.push({ role, content });
    }
    const turn = history.length === 0 ? fillTemplate(tool.first, values) : String(input.input || '').slice(0, 8000);
    if (!turn) return sendJson(res, 400, { ok: false, error: 'empty input' });
    messages = [{ role: 'system', content: tool.system }, ...hmsgs, { role: 'user', content: turn }];
  }

  sendJsonKeepalive(res, callUpstream(messages).then(out => ({
    ok: true,
    content: out.content,
    /* chat 模式回传 turn：前端把首轮 user 内容补进对话历史，保证后续轮次历史完整 */
    turn: tool.mode === 'chat' ? messages[messages.length - 1].content : undefined
  })));
}

/* ---------------- 静态文件 ---------------- */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep) && file !== path.join(PUBLIC_DIR, 'index.html')) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('not found'); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

/* ---------------- 服务入口 ---------------- */
const server = http.createServer(async (req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  try {
    if (req.method === 'POST' && pathname === '/api/fetch') {
      if (!rateLimit(clientIp(req), 'fetch')) return sendJson(res, 429, { ok: false, error: 'rate limited, try later' });
      const body = await readBody(req, 8192);
      return await handleFetch(req, res, body);
    }
    if (req.method === 'POST' && pathname === '/api/llm') {
      if (!rateLimit(clientIp(req), 'llm')) return sendJson(res, 429, { ok: false, error: 'rate limited, try later' });
      const body = await readBody(req, 131072);
      return await handleLlm(req, res, body);
    }
    if (req.method === 'POST' && pathname === '/api/llm-toolbox') {
      if (!rateLimit(clientIp(req), 'tb')) return sendJson(res, 429, { ok: false, error: 'rate limited, try later' });
      const body = await readBody(req, 131072);
      return await handleToolbox(req, res, body);
    }
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, pathname);
    res.writeHead(405); res.end('method not allowed');
  } catch (e) {
    try { sendJson(res, 500, { ok: false, error: String(e.message || e).slice(0, 200) }); } catch (_) {}
  }
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('ShiYi server listening on 0.0.0.0:' + PORT + ' (model: ' + MODEL + ', key: ' + (API_KEY ? 'loaded' : 'MISSING') + ')');
});
process.on('uncaughtException', err => { console.error('uncaught: ' + (err && err.message)); });
