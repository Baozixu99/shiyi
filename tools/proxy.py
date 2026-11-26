# -*- coding: utf-8 -*-
# 拾忆 · 本地开发代理：静态文件 + 真实 AI 通道
# 用法：python proxy.py [port]   （默认 8743，静态根目录 = shiyi-prototype/）
# 密钥从上级 secrets.local.json 读取，绝不进入前端源码；此文件勿提交/外传。

import html as html_mod
import json
import re
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "shiyi-prototype"
SECRETS = json.loads((ROOT / "secrets.local.json").read_text(encoding="utf-8"))
API_KEY = SECRETS["apiKey"]
BASE = SECRETS["baseUrl"].rstrip("/")
MODEL = SECRETS.get("model", "deepseek-v4.1-flash")


def post_json(url, payload, headers, timeout=120):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def strip_html(raw):
    raw = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", raw, flags=re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    raw = html_mod.unescape(raw)
    raw = re.sub(r"\s+", " ", raw)
    return raw.strip()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def log_message(self, fmt, *args):
        pass  # 安静模式：避免日志里出现任何正文内容

    def reply_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0) or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.reply_json({"ok": False, "error": "bad json"}, 400)

        if self.path == "/api/fetch":
            url = str(body.get("url") or "").strip()
            if not url.lower().startswith(("http://", "https://")):
                return self.reply_json({"ok": False, "error": "invalid url"})
            try:
                req = urllib.request.Request(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                })
                with urllib.request.urlopen(req, timeout=25) as r:
                    raw = r.read(3_000_000).decode("utf-8", "ignore")
                m = re.search(r"<title[^>]*>([\s\S]*?)</title>", raw, re.I)
                title = strip_html(m.group(1))[:200] if m else ""
                text = strip_html(raw)[:30000]
                # 段落结构（供 V2 结构化提示词的 blocks 输入）
                parts = re.split(r"</(?:p|div|section|article|h[1-6]|li|blockquote|td)>", raw, flags=re.I)
                paras = []
                for p in parts:
                    t = strip_html(p)
                    if len(t) >= 15:
                        paras.append(t[:800])
                    if len(paras) >= 120:
                        break
                return self.reply_json({"ok": True, "title": title, "text": text, "paragraphs": paras})
            except Exception as e:
                return self.reply_json({"ok": False, "error": str(e)[:200]})

        if self.path == "/api/llm":
            try:
                resp = post_json(
                    BASE + "/chat/completions",
                    {
                        "model": MODEL,
                        "messages": body.get("messages", []),
                        "temperature": body.get("temperature", 0.4),
                        "stream": False,
                    },
                    headers={"Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"},
                )
                content = resp["choices"][0]["message"]["content"]
                return self.reply_json({"ok": True, "content": content})
            except urllib.error.HTTPError as e:
                detail = e.read().decode("utf-8", "ignore")[:300]
                return self.reply_json({"ok": False, "error": "HTTP %d: %s" % (e.code, detail)})
            except Exception as e:
                return self.reply_json({"ok": False, "error": str(e)[:300]})

        return self.reply_json({"ok": False, "error": "not found"}, 404)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8743
    print("ShiYi local proxy: http://127.0.0.1:%d  (static=%s, model=%s)" % (port, STATIC_DIR.name, MODEL))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
