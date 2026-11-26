/* ============================================================
 * 拾忆 · 高保真原型 — app.js
 * 视图路由（hash）+ 状态 + 交互。事件用 data-act 委托分发。
 * 视图：inbox 收件箱 | confirm 待确认 | library 卡片库
 *       review 今日复习 | palace 记忆宫殿(P1) | report/:id 分析报告
 * ============================================================ */

/* ---------------- 图标（Lucide 风格内联 SVG，离线可用） ---------------- */
const ICONS = {
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  calcheck: '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/>',
  landmark: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  filetext: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
  checkc: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  extlink: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  chevr: '<path d="m9 18 6-6-6-6"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  spark: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  rotl: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  minus: '<circle cx="12" cy="12" r="10"/><line x1="8" x2="16" y1="12" y2="12"/>',
  arrowl: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'
};
function ic(name, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

/* ---------------- 全局状态 ---------------- */
const S = {
  route: 'home', reportId: null,
  review: { queue: [], idx: 0, flipped: false, total: 0, answers: 0, done: 0, forgot: 0, finished: false },
  batch: new Set(),
  libFilter: 'all', libQuery: '',
  heroFile: '', labResult: null, labPrev: null, labPending: false,
  replenishFor: null, palaceRoom: 'study',
  submitting: false, lastFocus: null,
  toastTimer: null, deleteArmed: false
};

const ANALYSIS_STEPS = ['抓取原文', '通读全文', '价值判定', '要点提炼'];
const APP_VERSION = 'v1.6.3';
const TYPE_ICON = { link: 'link', text: 'type', image: 'image', doc: 'filetext' };

/* ---------------- 工具 ---------------- */
function $(sel) { return document.querySelector(sel); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

function toast(msg, ok) {
  let t = $('#toast');
  t.className = 'toast show' + (ok === false ? ' err' : ok === true ? ' ok' : '');
  t.innerHTML = (ok === false ? ic('alert') : ok === true ? ic('checkc') : ic('zap')) + '<span>' + esc(msg) + '</span>';
  clearTimeout(S.toastTimer);
  S.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------------- Hero 打字机引导（仅空输入时循环，用户打字即停） ---------------- */
const HERO_HINTS = [
  '粘贴一篇公众号文章链接，AI 先替你判断值不值得读',
  '丢进课堂笔记或会议记录，沉淀成记忆卡片',
  '写上「我想知道什么」，报告首屏直接给你答案',
  '一次性通知会自动提取时间地点，扫一眼就够'
];
let heroTyperTimer = null;
let heroTyperSeq = 0;
function stopHeroTyper() { heroTyperSeq += 1; if (heroTyperTimer) { clearTimeout(heroTyperTimer); heroTyperTimer = null; } }
function startHeroTyper() {
  stopHeroTyper();
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hint = $('#heroHint'); const ta = $('#heroInput');
  if (!hint || !ta) return;
  if (ta.value.trim() || S.heroFile || S.replenishFor) return;
  const seq = heroTyperSeq;
  let i = 0;
  const type = () => {
    if (seq !== heroTyperSeq) return;
    const phrase = HERO_HINTS[i % HERO_HINTS.length];
    let pos = 0;
    hint.innerHTML = ic('spark') + '<span class="typer"></span><span class="typer-caret"></span>';
    const span = hint.querySelector('.typer');
    const tick = () => {
      if (seq !== heroTyperSeq || !span || !document.body.contains(span) || ta.value.trim() || S.heroFile || S.replenishFor) return;
      if (pos <= phrase.length) { span.textContent = phrase.slice(0, pos); pos += 1; heroTyperTimer = setTimeout(tick, 58); }
      else heroTyperTimer = setTimeout(() => { i += 1; type(); }, 2600);
    };
    tick();
  };
  type();
}

/* ---------------- 路由 ---------------- */
const ROUTES = ['home', 'inbox', 'confirm', 'library', 'review', 'palace', 'lab', 'report'];
function go(route, id) { location.hash = '#/' + route + (id ? '/' + id : ''); }
function parseHash() {
  const h = (location.hash || '#/home').replace(/^#\//, '');
  const parts = h.split('/');
  return { route: ROUTES.includes(parts[0]) ? parts[0] : 'home', id: parts[1] || null };
}
window.addEventListener('hashchange', () => {
  const r = parseHash();
  if (r.route === 'report' && r.id) { S.route = 'report'; S.reportId = r.id; }
  else S.route = r.route;
  if (r.route === 'review' && !S.review.finished && !S.review.queue.length) {
    if (!restoreReviewRound()) initReview();   // R2-06：有未完成轮次则续轮
  }
  render();
});

/* ---------------- 事件委托 ---------------- */
const ACTIONS = {
  nav(el) { go(el.dataset.nav); },
  addOpen() { focusHero(); },
  overlayClose(el, id, e) {
    /* 工单15：来自关闭按钮 → 一定关闭；来自背景遮罩 → 只有点到遮罩本身才关闭 */
    if (el && el.id === 'overlay' && e && e.target !== el) return;
    closeOverlay();
  },
  openLink(el, id) {
    const c = DB.captureById(id);
    if (c && c.sourceUrl) window.open(c.sourceUrl, '_blank', 'noopener');
    else toast('没有可打开的原始链接', false);
  },
  /* 特性①：目标结论的原文入口——打开该收藏的快照并定位到答案句 */
  capSnap(el, id) {
    const c = DB.captureById(id);
    if (!c || !Array.isArray(c.blocks) || !c.blocks.length) { toast('快照不可用', false); return; }
    openSnapshotView(c.title || c.sourceName, c.blocks, {
      blockId: el.dataset.block || '',
      endBlockId: el.dataset.end || '',
      quote: el.dataset.quote || '',
      question: el.dataset.question || '',
      label: el.dataset.label || '查看原文快照',
      showIds: false
    });
  },
  restoreCap(el, id) {
    api.restoreCapture(id).then(() => { toast('已恢复 · 回到收件箱', true); render(); });
  },
  /* R2-03：为失败/受限的收藏补录正文——提交后附到原收藏，保留来源与报告地址 */
  replenish(el, id) {
    const c = DB.captureById(id);
    if (!c) return;
    S.replenishFor = id;
    focusHero();
    setTimeout(updateHeroHint, 120);
  },
  replenishCancel() {
    S.replenishFor = null;
    updateHeroHint();
    toast('已取消补录');
  },
  heroFilePick() { S.heroFile = '大语言模型推理优化综述.pdf'; updateHeroHint(); toast('已选择文件（原型模拟）'); },
  labRun() { labRunFlow(); },
  heroFileClear() { S.heroFile = ''; updateHeroHint(); },
  heroSubmit() { submitHeroFlow(); },
  viewReport(el, id) { go('report', id); },
  openCard(el, id) { openCardModal(id); },
  decide(el, id) { decideFlow(id, el.dataset.action, el); },
  retry(el, id) { retryFlow(id, el); },
  openSnapshot(el, id) {
    const c = DB.captureById(id);
    if (c && Array.isArray(c.blocks) && c.blocks.length) openSnapshotView(c.title || c.sourceName, c.blocks, { label: '原文快照溯源', showIds: false });
    else toast('该内容未留存分段快照（早期演示数据）');
  },
  labSnap(el) {
    const r = S.labResult;
    if (!r || !Array.isArray(r.blocks) || !r.blocks.length) { toast('快照不可用', false); return; }
    openSnapshotView(r.pageTitle || r.sourceName, r.blocks, {
      blockId: el.dataset.block || '',
      endBlockId: el.dataset.end || '',
      quote: el.dataset.quote || '',
      question: el.dataset.question || '',
      label: el.dataset.label || '查看原文快照',
      showIds: true
    });
  },
  batchToggle(el, id) {
    S.batch.has(id) ? S.batch.delete(id) : S.batch.add(id);
    render();
  },
  batchAll() {
    const pend = DB.pendingCaptures().map(c => c.id);
    if (S.batch.size === pend.length) S.batch.clear();
    else pend.forEach(id => S.batch.add(id));
    render();
  },
  batchDecide(el) { batchDecideFlow(el.dataset.action); },
  goReview() { go('review'); },
  libFilter(el) { S.libFilter = el.dataset.f; render(); },
  /* 卡片详情弹窗 */
  cardEdit() { renderCardModalBody(true); },
  cardCancelEdit() { renderCardModalBody(false); },
  cardSave() { saveCardFlow(); },
  cardShare() { shareFlow(); },
  cardReextract(el, id) { reextractFlow(el); },
  cardArchive(el, id) {
    const c = DB.cardById(id);
    const wasArchived = c.status === 'archived';
    api.setCardStatus(id, wasArchived ? 'learning' : 'archived').then(() => {
      toast(wasArchived ? '已恢复到学习中' : '已归档 · 暂停复习');
      closeOverlay(); render();
    });
  },
  cardDelete(el, id) {
    if (!S.deleteArmed) { S.deleteArmed = true; el.classList.add('armed'); el.textContent = '再次点击确认删除'; return; }
    api.deleteCard(id).then(() => { S.deleteArmed = false; toast('已删除该卡片'); closeOverlay(); render(); });
  },
  /* 工单07：卡片详情「原文溯源」真实打开对应材料——纯文本/已留存快照打开快照定位，
     链接卡打开原始链接，都没有时明确提示 */
  cardTrace() {
    const c = DB.cardById(modalCardId);
    if (!c) return;
    const cap = c.captureId ? DB.captureById(c.captureId) : null;
    if (cap && Array.isArray(cap.blocks) && cap.blocks.length) {
      const hit = c.excerpt ? findBlockForQuote(cap.blocks, c.excerpt) : null;
      openSnapshotView(cap.title || cap.sourceName, cap.blocks, {
        label: '卡片原文溯源', showIds: false,
        blockId: hit ? hit.id : '',
        quote: hit && hit.quote ? hit.quote : ''
      });
    } else if (c.sourceUrl && !/example\.(com|invalid)/.test(c.sourceUrl)) {
      window.open(c.sourceUrl, '_blank', 'noopener');
    } else {
      toast('这张卡片没有留存可用的原文来源（演示数据）', false);
    }
  },
  /* 复习 */
  reviewStart() { initReview(); render(); },
  flip() { S.review.flipped = true; render(); },
  feedback(el) { feedbackFlow(el.dataset.f); },
  reviewAgain() { initReview(); render(); },
  /* 记忆宫殿交互预览：切换房间 */
  palaceRoom(el) { S.palaceRoom = el.dataset.room || 'study'; render(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el, el.dataset.id, e);
});
document.addEventListener('input', e => {
  if (e.target.id === 'libSearch') { S.libQuery = e.target.value; renderLibGrid(); }
  if (e.target.id === 'heroInput') updateHeroHint();
  /* R2-05：编辑实验材料/目标时，立即把旧结果标为「上次」 */
  if (e.target.id === 'labInput' || e.target.id === 'labGoal') updateLabDirty();
});
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'heroInput' && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); submitHeroFlow();
    return;
  }
  /* 工单15：弹窗打开时 Esc 关闭、Tab 在弹窗内循环 */
  const ov = $('#overlay');
  if (ov && ov.classList.contains('open')) {
    if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
    if (e.key === 'Tab') {
      const f = ov.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!ov.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
});

/* ---------------- 布局骨架（所有视图共用） ---------------- */
function shell(title, body) {
  const due = DB.dueCards().length;
  const pending = DB.pendingCaptures().length;
  const nav = [
    ['home', 'home', '主页', ''],
    ['inbox', 'inbox', '收件箱', ''],
    ['confirm', 'flag', '待确认', pending ? '<b class="nav-badge">' + pending + '</b>' : ''],
    ['library', 'layers', '卡片库', ''],
    ['review', 'calcheck', '今日复习', due ? '<b class="nav-badge due">' + due + '</b>' : ''],
    ['palace', 'landmark', '记忆宫殿', '<i class="nav-p1">P1</i>'],
    ['lab', 'eye', '对比实验', '<i class="nav-p1">LAB</i>']
  ].map(n =>
    /* 工单16：导航用真实锚点，Tab 可达、Enter 切页、aria-current 标识当前页 */
    '<a href="#/' + n[0] + '" class="nav-item' + (S.route === n[0] ? ' active' : '') + '"' +
    (S.route === n[0] ? ' aria-current="page"' : '') + '>' +
    ic(n[1]) + '<span>' + n[2] + '</span>' + n[3] + '</a>'
  ).join('');

  const banner = (due && S.route !== 'review' && S.route !== 'home')
    ? '<div class="banner reveal">' + ic('bell') +
      '<span>今日有 <b>' + due + '</b> 张卡片到期，连续学习 <b>' + DB.profile.streakDays + '</b> 天</span>' +
      '<button class="btn sm" data-act="goReview">开始复习 ' + ic('chevr') + '</button></div>'
    : '';

  return (
    '<aside class="sidebar">' +
      '<div class="logo"><span class="logo-mark">' + ic('spark') + '</span><div><b>拾忆</b><i>收藏 ≠ 掌握</i></div></div>' +
      '<div class="nav">' + nav + '</div>' +
      '<button class="btn primary block" data-act="addOpen">' + ic('plus') + '丢入内容</button>' +
      '<div class="sidebar-foot">' + ic('flame') + '连续学习 ' + DB.profile.streakDays + ' 天</div>' +
    '</aside>' +
    '<main class="main">' +
      '<header class="topbar"><h1>' + title + '</h1><button class="icon-btn" onclick="toast(\'原型演示：提醒将发送浏览器通知\')">' + ic('bell') + (due ? '<i class="dot"></i>' : '') + '</button></header>' +
      banner +
      '<div class="view">' + body + '</div>' +
    '</main>'
  );
}

/* ---------------- Hero 丢入区（agent 式主入口） ---------------- */
function detectKind(v) {
  return /https?:\/\/|^www\./i.test(v.trim()) ? 'link' : 'text';
}
function updateHeroHint() {
  const hint = $('#heroHint');
  if (!hint) return;
  /* R2-03：补录模式提示 */
  if (S.replenishFor) {
    const c = DB.captureById(S.replenishFor);
    if (c) {
      hint.innerHTML = ic('type') + '正在为「' + esc((c.title || '原收藏').slice(0, 22)) + '」补充正文 · 提交后附到原收藏 · <button class="link-btn" data-act="replenishCancel">取消补录</button>';
      return;
    }
    S.replenishFor = null;
  }
  if (S.heroFile) {
    hint.innerHTML = ic('filetext') + '已选 <b>' + esc(S.heroFile) + '</b> · <button class="link-btn" data-act="heroFileClear">移除</button>';
    return;
  }
  const ta = $('#heroInput');
  const v = ta ? ta.value.trim() : '';
  if (!v) { hint.innerHTML = ic('spark') + '粘贴链接、输入文字或添加文档 — AI 自动识别'; return; }
  if (detectKind(v) === 'link') {
    let host = '网页链接';
    try { host = new URL(v.startsWith('http') ? v : 'https://' + v).hostname.replace(/^www\./, ''); } catch (e) {}
    hint.innerHTML = ic('link') + '识别为链接 · <b>' + esc(host) + '</b> · Enter 开始分析';
  } else {
    hint.innerHTML = ic('type') + '识别为文本 · ' + v.length + ' 字 · Enter 开始分析';
  }
}
function focusHero() {
  const jump = () => { const ta = $('#heroInput'); if (ta) ta.focus(); };
  if (S.route !== 'home') { go('home'); setTimeout(jump, 80); } else jump();
}
async function submitHeroFlow() {
  /* 工单04：一次提交意图只创建一个任务——提交中按钮禁用 + 状态锁，双击/连按/Enter 复用不会重复提交 */
  if (S.submitting) return;
  const ta = $('#heroInput');
  const v = ta ? ta.value.trim() : '';
  const goalInput = $('#heroGoal');
  const goal = goalInput ? goalInput.value.trim() : '';
  let kind, value, filename;
  if (S.heroFile) { kind = 'file'; value = S.heroFile; filename = S.heroFile; }
  else if (!v) { toast('先粘贴一条链接，或直接输入想留下的内容', false); if (ta) ta.focus(); return; }
  else { kind = detectKind(v); value = v; }
  S.submitting = true;
  const btn = document.querySelector('[data-act="heroSubmit"]');
  if (btn) { btn.disabled = true; btn.classList.add('busy'); }
  S.heroFile = '';
  if (ta) { ta.value = ''; updateHeroHint(); }
  if (goalInput) goalInput.value = '';
  try {
    /* R2-03：补录正文 → 附到发起补录的原收藏，保留来源与报告地址 */
    if (S.replenishFor && kind === 'text') {
      const target = DB.captureById(S.replenishFor);
      S.replenishFor = null;
      if (target) {
        target.raw = String(value).slice(0, 12000);
        target.replenished = true;
        if (goal) target.goal = goal.slice(0, 60);   // 补录时也可带目标
        target.status = 'processing'; target.step = 0;
        target.failReason = null; target.fetchError = null;
        DB.save();
        toast('正文已附到原收藏 · AI 重新分析');
        render();
        const res = await api.analyzeCapture(target.id, () => updateCapSteps(target.id));
        if (res && res.restricted) toast('仍是抓取受限：' + (target.failReason || '该页面需要登录或付费'), false);
        else if (res && res.failed) toast('未能生成分析：' + (target.failReason || '未知原因'), false);
        else if (res && res.card) toast('分析完成 · 判定为值得读，卡片已生成', true);
        else if (res) toast('分析完成 · 判定为无阅读价值，待你确认', false);
        if (S.route === 'report' && S.reportId === target.id) render();
        else go('report', target.id);
        return;
      }
    }
    if (S.replenishFor && kind === 'link') {
      S.replenishFor = null;
      updateHeroHint();
      toast('补录请直接粘贴正文文字，本次按普通提交处理', false);
    }
    const cap = await api.submitCapture({ kind, value, filename, goal });
    toast('已加入收件箱 · AI 开始分析');
    render();
    const res = await api.analyzeCapture(cap.id, () => updateCapSteps(cap.id));
    if (res && res.restricted) toast('抓取受限：该页面需要登录或付费，可选中正文粘贴后再分析', false);
    else if (res && res.failed) toast('未能生成分析：' + (cap.failReason || '未知原因'), false);
    else if (res && res.card) toast('分析完成 · 判定为值得读，卡片已生成', true);
    else if (res) toast('分析完成 · 判定为无阅读价值，待你确认', false);
    if (S.route === 'report' && S.reportId === cap.id) render();
    else go('report', cap.id);
  } finally {
    S.submitting = false;
    if (btn) { btn.disabled = false; btn.classList.remove('busy'); }
  }
}

/* ---------------- 主页 ---------------- */
function greeting() {
  const h = new Date().getHours();
  const g = h < 5 ? '夜深了' : h < 9 ? '早上好' : h < 12 ? '上午好' : h < 14 ? '中午好' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了';
  return g + '，' + DB.profile.name;
}
function renderHome() {
  const due = DB.dueCards().length;
  const pending = DB.pendingCaptures().length;
  const recent = DB.captures.filter(c => c.status !== 'dropped').slice(0, 3);
  const body =
    heroHTML() +
    '<div class="ov-row reveal">' +
      '<div class="ov-card">' +
        '<span class="ov-num">' + due + '</span>' +
        '<div class="ov-main"><b>今日待复习</b><span>' + (due ? '按遗忘曲线，今天有 ' + due + ' 张卡片到期' : '今日无到期 · 全部完成') + '</span></div>' +
        (due ? '<button class="btn sm" data-act="goReview">' + ic('calcheck') + '开始复习</button>'
             : '<button class="btn sm ghost" data-act="nav" data-nav="library">去卡片库</button>') +
      '</div>' +
      '<div class="ov-card">' +
        '<span class="ov-num' + (pending ? ' warn' : '') + '">' + pending + '</span>' +
        '<div class="ov-main"><b>待确认</b><span>' + (pending ? 'AI 判定无阅读价值，等你裁决' : '没有需要裁决的内容') + '</span></div>' +
        (pending ? '<button class="btn sm ghost" data-act="nav" data-nav="confirm">去处理</button>' : '') +
      '</div>' +
    '</div>' +
    (recent.length ? '<div class="home-sec reveal"><h3>最近收藏</h3><button class="link-btn" data-act="nav" data-nav="inbox">查看收件箱 ' + ic('chevr') + '</button></div>' +
      '<div class="home-recent">' + recent.map(captureCard).join('') + '</div>' : '');
  return shell(greeting(), body);
}

/* ---------------- 收件箱 ---------------- */
function statusChip(c) {
  if (c.status === 'processing') return '<span class="chip proc">' + ic('loader') + 'AI 分析中</span>';
  if (c.status === 'analyzed') return c.userDecision === 'keep'
    ? '<span class="chip ok">' + ic('checkc') + '已保留 · 用户决定</span>'
    : '<span class="chip ok">' + ic('checkc') + '已转化 · 值得读</span>';
  if (c.status === 'awaiting') return (c.scenario && c.scenario.action)
    ? '<span class="chip ok">' + ic('zap') + '扫一眼即可</span>'
    : '<span class="chip warn">' + ic('flag') + '待确认 · 无阅读价值</span>';
  if (c.status === 'failed') return '<span class="chip err">' + ic('alert') + '处理失败</span>';
  if (c.status === 'restricted') return '<span class="chip mute">' + ic('lock') + '抓取受限</span>';
  return '<span class="chip mute">已丢弃</span>';
}
function processSteps(c) {
  /* 分析动画：进行中加 live 类（步骤脉冲 + 完成弹入 + 进度扫描条） */
  const live = c.status === 'processing' || (typeof c.step === 'number' && c.step < ANALYSIS_STEPS.length);
  const pct = Math.min(100, Math.round(((c.step || 0) / ANALYSIS_STEPS.length) * 100));
  return '<div class="steps' + (live ? ' live' : '') + '">' + ANALYSIS_STEPS.map((s, i) => {
    const done = c.step > i, cur = c.step === i;
    return '<span class="step' + (done ? ' done' : cur ? ' cur' : '') + '">' + (done ? ic('check') : cur ? ic('loader') : '<i class="step-dot"></i>') + s + '</span>';
  }).join('') +
    '<span class="steps-track"><i style="width:' + pct + '%"></i></span>' +
  '</div>';
}
function heroHTML() {
  return '<div class="hero reveal">' +
    '<div class="hero-head">' +
      '<span class="hero-badge">' + ic('spark') + '丢给拾忆 AI</span>' +
      '<span class="hero-sub">链接 / 文字 / 文档 · 自动判定价值 · 沉淀成记忆卡片</span>' +
    '</div>' +
    '<textarea id="heroInput" rows="3" placeholder="粘贴一条链接，或直接丢进想留下的内容 — AI 会替你判断它值不值得读"></textarea>' +
    '<div class="hero-goal-row">' + ic('search') + '<input id="heroGoal" placeholder="我想知道什么？（可留空）">' + '</div>' +
    '<div class="hero-foot">' +
      '<div class="hero-hint" id="heroHint">' + ic('spark') + '粘贴链接、输入文字或添加文档 — AI 自动识别</div>' +
      '<div class="hero-actions">' +
        '<button class="icon-btn" data-act="heroFilePick" title="添加图片 / 文档（模拟）">' + ic('upload') + '</button>' +
        '<button class="btn primary" data-act="heroSubmit">' + ic('spark') + '丢给 AI 分析</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function captureCard(c) {
  return '<div class="capture card reveal' + (c.status === 'processing' ? ' processing' : '') + '" data-cap="' + c.id + '">' +
    (c.cover ? '<img class="cover" src="' + c.cover + '" alt="">' : '<span class="cover ph">' + ic('book') + '</span>') +
    '<div class="cap-main">' +
      '<div class="cap-top">' + statusChip(c) + (c.replenished ? '<span class="chip mute">' + ic('type') + '用户补充正文</span>' : '') + '<span class="meta">' + ic(TYPE_ICON[c.type]) + ' ' + esc(c.sourceName) + ' · ' + esc(c.collectedAt) + '</span></div>' +
      '<h3 class="cap-title">' + esc(c.title) + '</h3>' +
      (c.status === 'processing' ? processSteps(c) : '') +
      (c.status === 'failed' ? '<p class="warn-line">' + ic('alert') + esc(c.failReason || '处理失败') + '</p>' +
        '<div class="row-actions"><button class="btn sm ghost" data-act="retry" data-id="' + c.id + '">' + ic('refresh') + '重试</button>' +
        (c.sourceUrl ? '<button class="btn sm ghost" data-act="openLink" data-id="' + c.id + '">' + ic('extlink') + '打开原链接</button>' : '') +
        '<button class="btn sm ghost" data-act="replenish" data-id="' + c.id + '">' + ic('type') + '粘贴正文重新分析</button></div>' : '') +
      (c.status === 'restricted' ? '<p class="warn-line">' + ic('lock') + '该页面需要登录或付费，无法抓取全文。</p>' +
        '<div class="row-actions"><button class="btn sm ghost" data-act="replenish" data-id="' + c.id + '">' + ic('type') + '选中正文文字再收藏</button></div>' : '') +
      (c.status === 'awaiting' ? ((c.scenario && c.scenario.action) ?
        '<div class="notice-box">' + ic('zap') + esc(c.scenario.action) + '</div>' +
        '<p class="sub-line">一次性通知 · 扫一眼即可，默认不加入复习。</p>'
        : '<p class="sub-line">AI 判定无阅读价值，等你裁决 — 可在「待确认」中处理。</p>') : '') +
    '</div>' +
    '<div class="cap-side">' +
      (c.status === 'analyzed' ? '<button class="btn sm ghost" data-act="viewReport" data-id="' + c.id + '">分析报告 ' + ic('chevr') + '</button><button class="btn sm" data-act="openCard" data-id="' + c.cardId + '">' + ic('layers') + '查看卡片</button>' : '') +
      (c.status === 'awaiting' ? '<button class="btn sm ghost" data-act="viewReport" data-id="' + c.id + '">查看报告 ' + ic('chevr') + '</button>' : '') +
    '</div>' +
  '</div>';
}
function renderInbox() {
  const caps = DB.captures.filter(c => c.status !== 'dropped');
  const dropped = DB.captures.filter(c => c.status === 'dropped');
  /* 工单09：回收站入口固定在收件箱底部，可发现、可恢复 */
  const trash = dropped.length
    ? '<div class="trash-sec reveal"><h3>' + ic('trash') + '回收站 · ' + dropped.length + ' 条（30 天内可恢复）</h3>' +
      dropped.map(c =>
        '<div class="card capture trash-row">' +
          '<div class="cap-main">' +
            '<div class="cap-top"><span class="chip mute">已丢弃</span><span class="meta">' + ic(TYPE_ICON[c.type]) + ' ' + esc(c.sourceName) + ' · ' + esc(c.collectedAt) + '</span></div>' +
            '<h3 class="cap-title">' + esc(c.title) + '</h3>' +
            '<p class="sub-line">恢复后回到' + (c.prevStatus === 'analyzed' ? '「已转化」状态' : '「待确认」列表') + '，原判定与卡片随之恢复。</p>' +
          '</div>' +
          '<div class="cap-side"><button class="btn sm" data-act="restoreCap" data-id="' + c.id + '">' + ic('rotl') + '恢复</button></div>' +
        '</div>'
      ).join('') + '</div>'
    : '';
  const body = caps.length === 0 && !dropped.length
    ? '<div class="empty">' + ic('inbox', 'big') + '<h3>收件箱是空的</h3><p>回到「主页」，把链接或文字丢进丢入区，AI 会替你判断这条内容值不值得读，并沉淀成知识卡片。</p></div>'
    : caps.map(captureCard).join('') + trash;
  return shell('收件箱', body);
}

/* ---------------- 待确认 ---------------- */
function renderConfirm() {
  const list = DB.pendingCaptures();
  const body = list.length === 0
    ? '<div class="empty">' + ic('flag', 'big') + '<h3>没有待确认的内容</h3><p>AI 判定为「无阅读价值」的内容会先到这里，由你裁决 — AI 永远不会自动删除你的收藏。</p></div>'
    : '<div class="batch-bar reveal"><span>已选 ' + S.batch.size + ' / ' + list.length + '</span>' +
      '<button class="btn sm ghost" data-act="batchAll">' + (S.batch.size === list.length ? '取消全选' : '全选') + '</button>' +
      '<button class="btn sm danger" data-act="batchDecide" data-action="drop">' + ic('trash') + '批量丢弃</button>' +
      '<button class="btn sm" data-act="batchDecide" data-action="keep">' + ic('check') + '批量保留</button></div>' +
      list.map(c =>
        '<div class="card await reveal' + (S.batch.has(c.id) ? ' sel' : '') + '">' +
          '<label class="cb" data-act="batchToggle" data-id="' + c.id + '"><input type="checkbox" ' + (S.batch.has(c.id) ? 'checked' : '') + ' tabindex="-1"><i>' + ic('check') + '</i></label>' +
          '<div class="cap-main">' +
            '<div class="cap-top">' + (c.scenario && c.scenario.action ? '<span class="chip ok">扫一眼即可</span>' : '<span class="chip warn">无阅读价值</span>') + '<span class="chip mute">' + esc(c.verdict.contentType) + '</span><span class="meta">' + esc(c.sourceName) + ' · ' + esc(c.collectedAt) + '</span></div>' +
            '<h3 class="cap-title">' + esc(c.title) + '</h3>' +
            (c.scenario && c.scenario.action ? '<div class="notice-box">' + ic('zap') + esc(c.scenario.action) + '</div>' : '') +
            '<p class="verdict-reason"><b>AI 判定理由：</b>' + esc(c.verdict.reason) + '</p>' +
            '<p class="hint-line">忽略的内容保留 7 天后自动移入回收站，可恢复。</p>' +
          '</div>' +
          '<div class="cap-side col">' +
            '<button class="btn sm" data-act="decide" data-id="' + c.id + '" data-action="keep">' + ic('check') + '保留生成卡片</button>' +
            '<button class="btn sm danger" data-act="decide" data-id="' + c.id + '" data-action="drop">' + ic('trash') + '丢弃</button>' +
          '</div>' +
        '</div>'
      ).join('');
  return shell('待确认', body);
}

/* ---------------- 卡片库 ---------------- */
const LIB_FILTERS = [['all', '全部'], ['learning', '学习中'], ['due', '今日待复习'], ['mastered', '已巩固'], ['archived', '已归档']];
function libCounts(f) {
  const c = DB.cards;
  return { all: c.length, learning: c.filter(x => x.status === 'learning').length, due: DB.dueCards().length, mastered: c.filter(x => x.status === 'mastered').length, archived: c.filter(x => x.status === 'archived').length }[f];
}
function renderLibrary() {
  const due = DB.dueCards().length;
  const chips = LIB_FILTERS.map(f =>
    '<button class="fchip' + (S.libFilter === f[0] ? ' on' : '') + '" data-act="libFilter" data-f="' + f[0] + '">' + f[1] + ' <b>' + libCounts(f[0]) + '</b></button>').join('');
  const body =
    '<div class="lib-top reveal">' + '<div class="search">' + ic('search') + '<input id="libSearch" placeholder="搜索卡片内容与原文…" value="' + esc(S.libQuery) + '"></div>' + '<div class="fchips">' + chips + '</div></div>' +
    '<div id="libGrid"></div>' +
    (due ? '<div class="lib-due reveal">' + ic('calcheck') + '<span>另有 <b>' + due + '</b> 张卡片今日到期</span><button class="btn sm" data-act="goReview">开始复习</button></div>' : '');
  return shell('卡片库', body);
}
/* 卡片封面（卡片库）：无封面卡按卡 ID 稳定随机分配一张——同一张卡恒定同一封面 */
const COVER_POOL = [
  'assets/cover-hashring.jpg', 'assets/cover-memory.jpg', 'assets/cover-desk.jpg',
  'assets/cover-labyrinth.jpg', 'assets/cover-constellation.jpg', 'assets/cover-gears.jpg',
  'assets/cover-waves.jpg', 'assets/cover-library.jpg'
];
function cardCover(c) {
  if (c.cover) return c.cover;
  let h = 0;
  const s = String(c.id || c.title || 'shiyi');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COVER_POOL[h % COVER_POOL.length];
}
/* 工单13：搜索覆盖标题、要点、摘录、标签与关联快照原文 */
function cardSearchText(c) {
  let t = ' ' + c.title + ' ' + c.points.join(' ') + ' ' + (c.excerpt || '') + ' ' + c.tags.join(' ') + ' ';
  const cap = c.captureId ? DB.captureById(c.captureId) : null;
  if (cap && Array.isArray(cap.blocks)) t += cap.blocks.map(b => b.text).join(' ') + ' ';
  return t.toLowerCase();
}
/* 工单06：摘录/摘要来源标注 */
function excerptTag(card) {
  if (!card || !card.excerpt) return '';
  if (card.excerptVerbatim === true) return '<span class="chip mute">摘录 · 已核对原文</span>';
  if (card.excerptVerbatim === false) return '<span class="chip warn">摘要 · 非逐字原文</span>';
  return '';
}
/* 工单07：在快照分段中定位摘录所在段 */
function findBlockForQuote(blocks, quote) {
  for (const b of blocks) {
    const hit = findQuoteInText(b.text, quote);
    if (hit) return { id: b.id, quote: hit };
  }
  return null;
}
function renderLibGrid() {
  const q = S.libQuery.trim().toLowerCase();
  let list = DB.cards;
  if (S.libFilter === 'due') list = DB.dueCards();
  else if (S.libFilter !== 'all') list = list.filter(c => c.status === S.libFilter);
  if (q) list = list.filter(c => cardSearchText(c).includes(q));
  const el = $('#libGrid');
  if (!el) return;
  el.innerHTML = list.length === 0
    ? '<div class="empty">' + ic('search', 'big') + '<h3>没有匹配的卡片</h3><p>换个关键词，或清空筛选条件试试。</p></div>'
    : '<div class="grid">' + list.map(c => {
        const stageTxt = c.status === 'mastered' ? '已巩固' : c.status === 'archived' ? '已归档' : '间隔 ' + STAGE_SHORT[c.stage];
        const nextTxt = c.status === 'learning' ? (c.due ? '今日到期' : (c.nextLabel || '未到期')) : '';
        return '<button class="kcard reveal' + (c.due && c.status === 'learning' ? ' due' : '') + '" data-act="openCard" data-id="' + c.id + '">' +
          '<img src="' + cardCover(c) + '" alt="">' +
          (c.status === 'mastered' ? '<i class="ribbon">已巩固</i>' : c.due && c.status === 'learning' ? '<i class="ribbon due">今日到期</i>' : '') +
          (c.shared ? '<i class="shared-tag">' + ic('share') + '已分享</i>' : '') +
          '<div class="kbody"><h3>' + esc(c.title) + '</h3><p class="kpts">' + c.points.length + ' 条要点 · ' + esc(c.tags.join(' / ')) + '</p>' +
          '<div class="kfoot"><span>' + ic('clock') + stageTxt + (nextTxt ? ' · ' + nextTxt : '') + '</span></div></div></button>';
      }).join('') + '</div>';
}

/* ---------------- 今日复习 ---------------- */
/* R2-06：本轮进度随写随存（localStorage），刷新/重开可继续同一轮 */
const REVIEW_KEY = 'shiyi-review-v1';
function saveReviewRound() {
  const r = S.review;
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify({
    queue: r.queue, idx: r.idx, answers: r.answers, done: r.done,
    forgot: r.forgot, total: r.total, finished: r.finished
  })); } catch (e) {}
}
function clearReviewRound() { try { localStorage.removeItem(REVIEW_KEY); } catch (e) {} }
function restoreReviewRound() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(REVIEW_KEY) || 'null'); } catch (e) {}
  if (!d || !Array.isArray(d.queue) || !d.queue.length || d.finished) return false;
  const queue = d.queue.filter(id => DB.cardById(id));
  if (!queue.length) return false;
  S.review = {
    queue, idx: Math.min(d.idx || 0, queue.length - 1), flipped: false,
    total: d.total || queue.length, answers: d.answers || 0,
    done: Math.min(d.done || 0, d.total || queue.length),
    forgot: d.forgot || 0, finished: false, resumed: true
  };
  return true;
}
function initReview() {
  const due = DB.dueCards();
  /* 工单11：total=本轮不同卡片数（固定）；answers=作答次数；done=已完成的不同卡片数 */
  S.review = { queue: due.map(c => c.id), idx: 0, flipped: false, total: due.length, answers: 0, done: 0, forgot: 0, finished: false };
  saveReviewRound();
}
function renderReview() {
  const r = S.review;
  /* 安全护栏：队列中的卡若已被删除则跳过 */
  if (!r.finished && r.queue.length) {
    while (r.idx < r.queue.length && !DB.cardById(r.queue[r.idx])) r.queue.splice(r.idx, 1);
    if (r.idx >= r.queue.length) { r.finished = true; clearReviewRound(); }
  }
  let body;
  if (!r.queue.length && !r.finished) {
    body = '<div class="empty">' + ic('checkc', 'big') + '<h3>今日复习已完成</h3><p>队列里没有到期的卡片。按遗忘曲线，下一批卡片会在 1 天后出现。</p><button class="btn ghost" data-act="nav" data-nav="library">去卡片库看看</button></div>';
  } else if (r.finished) {
    body = '<div class="review-wrap"><div class="done-card reveal">' + ic('checkc', 'big') +
      '<h2>今日复习完成</h2>' +
      '<p>本轮共 <b>' + r.total + '</b> 张卡片 · 作答 <b>' + r.answers + '</b> 次' +
      (r.forgot ? ' · 其中 <b>' + r.forgot + '</b> 次忘记回到 D0' : '') + '。明天将按新间隔继续。</p>' +
      '<div class="done-stages">' + STAGE_SHORT.slice(0, 6).map(s => '<span class="pill">' + s + '</span>').join('') + '</div>' +
      '<button class="btn ghost" data-act="reviewAgain">再演示一轮</button></div></div>';
  } else {
    const card = DB.cardById(r.queue[r.idx]);
    const stageTxt = STAGE_SHORT[card.stage];
    body = '<div class="review-wrap">' +
      '<div class="review-head reveal"><span class="meta">已完成 ' + r.done + ' / ' + r.total + ' 张 · 作答 ' + r.answers + ' 次' + (r.resumed ? ' · 已续接上次进度' : '') + ' · 当前间隔</span><span class="stage-pill">' + stageTxt + '</span></div>' +
      '<div class="flash' + (r.flipped ? ' flipped' : '') + '">' +
        '<div class="flash-inner">' +
          '<div class="face front">' +
            '<div class="ktag">' + card.tags.map(t => '<span class="chip mute">' + esc(t) + '</span>').join('') + '</div>' +
            '<h2>' + esc(card.title) + '</h2>' +
            '<p class="hint-line">先在脑中回忆要点，再翻面核对</p>' +
            (!r.flipped ? '<button class="btn primary" data-act="flip">' + ic('eye') + '翻面核对</button>' : '') +
          '</div>' +
          (r.flipped ?
          '<div class="face back">' +
            '<ol class="pts">' + card.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol>' +
            (card.excerpt ? '<blockquote>' + esc(card.excerpt) + excerptTag(card) + '</blockquote>' : '') +
            '<p class="meta">' + (card.sourceUrl ? ic('link') + ' ' : '') + esc(card.sourceName) + '</p>' +
            '<div class="fb-row">' +
              '<button class="fb forgot" data-act="feedback" data-f="forgot">' + ic('rotl') + '<b>忘记</b><i>回到 D0</i></button>' +
              '<button class="fb vague" data-act="feedback" data-f="vague">' + ic('minus') + '<b>模糊</b><i>保持间隔</i></button>' +
              '<button class="fb good" data-act="feedback" data-f="good">' + ic('check') + '<b>记住</b><i>进入下一间隔</i></button>' +
            '</div>' +
          '</div>' : '') +
        '</div>' +
      '</div></div>';
  }
  return shell('今日复习', body);
}

/* ---------------- 记忆宫殿（P1 · 交互式预览） ----------------
 * 用真实的卡片数据做房间分布预览：点房间看哪些卡将来住在这里，
 * 点卡片直接打开详情；漫游复习上线后仍回写同一套艾宾浩斯计划（规则 R1）。 */
const PALACE_ROOMS = [
  { id: 'study', name: '书房', icon: 'book', match: ['分布式', '后端', '算法', '网络', '技术解读'] },
  { id: 'living', name: '客厅', icon: 'home', match: ['思维模型', '效率方法', '经验分享'] },
  { id: 'commute', name: '通勤路线', icon: 'zap', match: ['认知科学', '学习方法', '研究解读'] },
  { id: 'atelier', name: '工作台', icon: 'edit', match: [] }
];
function palaceAssign() {
  const map = {};
  PALACE_ROOMS.forEach(r => { map[r.id] = []; });
  DB.cards.forEach(c => {
    const room = PALACE_ROOMS.find(r => r.match.length && c.tags.some(t => r.match.includes(t)));
    map[room ? room.id : 'atelier'].push(c);
  });
  return map;
}
function renderPalace() {
  const assigned = palaceAssign();
  const rooms = PALACE_ROOMS.map(r => ({ ...r, cards: assigned[r.id] || [] }));
  const cur = rooms.find(r => r.id === S.palaceRoom) || rooms[0];
  const mapHtml = rooms.map(r =>
    '<button class="palace-room' + (r.id === cur.id ? ' on' : '') + '" data-act="palaceRoom" data-room="' + r.id + '">' +
      '<div class="pr-head">' + ic(r.icon) + '<span>' + r.name + '</span><span class="pr-count">' + r.cards.length + ' 张</span></div>' +
      '<p class="pr-sub">' + (r.cards.length ? '点开看哪些卡将来住在这里' : '暂时空着') + '</p>' +
    '</button>').join('');
  const panel =
    '<div class="palace-panel reveal">' +
      '<h3 class="pp-head">' + ic('landmark') + '漫步' + esc(cur.name) + ' · ' + cur.cards.length + ' 张卡片</h3>' +
      (cur.cards.length
        ? cur.cards.map(c =>
            '<button class="palace-card" data-act="openCard" data-id="' + c.id + '">' +
              '<span class="pp-title">' + esc(c.title) + '</span>' +
              '<span class="pill">' + (c.status === 'mastered' ? '已巩固' : c.status === 'archived' ? '已归档' : STAGE_SHORT[c.stage]) + '</span>' +
            '</button>').join('')
        : '<p class="hint-line">这个房间还没有卡片，去卡片库丢点内容进来。</p>') +
    '</div>';
  const body =
    '<div class="empty" style="border:none;padding-bottom:6px">' + ic('landmark', 'big') +
      '<h3>记忆宫殿 · P1 即将上线</h3>' +
      '<p>下面是用你<b>真实的卡片数据</b>生成的房间分布预览：点房间，看哪些卡片将来会住进这里；漫游复习上线后，结果仍回写同一套艾宾浩斯计划（规则 R1）。</p>' +
    '</div>' +
    '<div class="palace-map reveal">' + mapHtml + '</div>' + panel +
    '<div class="palace-foot"><button class="btn ghost" data-act="nav" data-nav="library">先去卡片库</button></div>';
  return shell('记忆宫殿', body);
}

function aiSourceChip(c) {
  return c.realAI
    ? '<span class="chip ai">' + ic('zap') + 'DeepSeek 实时分析</span>'
    : '<span class="chip mute">' + ic('book') + '演示数据 · AI 未接通</span>';
}

/* ---------------- 提示词 A/B 对比实验室 ---------------- */
const LEVEL_BADGE = { read_full: ['ok', '通读全文'], read_parts: ['ai', '只读部分'], skim: ['mute', '快速略读'], skip: ['warn', '建议跳过'], insufficient: ['err', '材料不足'] };
function renderLab() {
  const body =
    '<div class="hero reveal">' +
      '<div class="hero-head">' +
        '<span class="hero-badge">' + ic('eye') + '提示词 A/B 对比实验室</span>' +
        '<span class="hero-sub">同一材料 · V1/V4 并行 · V4 = 要点摘要 + 可点击的「去读哪段」 · 构建 ' + APP_VERSION + '</span>' +
      '</div>' +
      '<div class="lab-inputs">' +
        /* 工单10：多行正文控件，保留换行 */
        '<textarea id="labInput" class="input" rows="5" placeholder="粘贴文章链接，或直接粘贴正文（保留换行与空行）…"></textarea>' +
        '<input id="labGoal" class="input" placeholder="本次阅读目标（可留空，V4 专用）：如 想搞懂这个方法怎么落地">' +
      '</div>' +
      '<div class="hero-foot">' +
        '<div class="hero-hint">' + ic('spark') + '设计标准：界面上说「值得读这一段」，用户就应该能点一下，读到那一段</div>' +
        '<div class="hero-actions"><button class="btn primary" data-act="labRun">' + ic('zap') + '并行对比</button></div>' +
      '</div>' +
    '</div>' +
    '<div id="labBody">' + (S.labResult ? labResultHTML(S.labResult) : S.labPending ? labPendingHTML(S.labPrev) : '') + '</div>';
  return shell('提示词实验室', body);
}
/* 工单14：新请求进行中时展示本轮状态，上次结果折叠标注为「上次」 */
function labPendingHTML(prev) {
  return '<div class="lab-meta reveal">' + ic('loader') +
    '<span>新请求进行中 · 两次模型调用约 10-30 秒…（下方结果属于上一次提交）</span></div>' +
    (prev ? '<details class="lab-prev reveal"><summary>' + ic('clock') + '上次结果 · ' + esc(prev.inputPreview || '') + '</summary>' +
      '<div class="lab-prev-body">' + labResultHTML(prev, true) + '</div></details>' : '');
}
/* R2-05：结果保留提交时的材料与目标标识；任一项编辑后立即提示「输入已修改」，
   撤回修改则提示自动消失 */
function labKey() {
  const i = document.querySelector('#labInput');
  const g = document.querySelector('#labGoal');
  return JSON.stringify([i ? i.value : '', g ? g.value : '']);
}
function updateLabDirty() {
  const body = $('#labBody');
  if (!body) return;
  const dirty = !!(S.labResult && !S.labPending && S.labResult.inputKey !== undefined && labKey() !== S.labResult.inputKey);
  const b = body.querySelector('.lab-dirty');
  if (dirty && !b) {
    body.insertAdjacentHTML('afterbegin', '<div class="lab-dirty reveal">' + ic('alert') + '输入已修改 · 下方结果属于上次提交' +
      (S.labResult.goalPreview ? '（原目标：「' + esc(S.labResult.goalPreview) + '」）' : '（原目标未填）') + '</div>');
  } else if (!dirty && b) {
    b.remove();
  }
}
function labResultHTML(r, isPrev) {
  const covTxt = { full: 'full · 完整正文', partial: 'partial · 可能截断', none: 'none · 未取得正文' }[r.coverage] || r.coverage;
  const meta =
    '<div class="lab-meta reveal">' + ic('filetext') +
    '<span>' + (isPrev ? '上次提交' : '本轮提交') + '：<b>' + esc(r.pageTitle || r.sourceName) + '</b>' + (r.inputPreview ? ' · 输入「' + esc(r.inputPreview) + '…」' : '') +
    (r.goalPreview ? ' · 目标「' + esc(r.goalPreview) + '」' : ' · 目标未填') +
    ' · ' + covTxt + ' · ' + r.blockCount + ' 段 / ' + r.chars + ' 字 · 并行 ' + (r.totalMs / 1000).toFixed(1) + 's</span></div>';
  let c1;
  if (r.v1.ok) {
    c1 =
      '<div class="lab-v"><span class="chip ' + (r.v1.value === 'worth' ? 'ok' : 'warn') + '">' + (r.v1.value === 'worth' ? '值得读' : '不建议读') + '</span>' +
      '<span class="chip mute">' + esc(r.v1.contentType) + '</span></div>' +
      '<p class="v-reason"><b>理由：</b>' + esc(r.v1.reason) + '</p>' +
      (r.v1.excerpt ? '<blockquote>' + esc(r.v1.excerpt) + (r.v1.excerptVerbatim === false ? '<br><span class="chip warn">摘要 · 未逐字命中原文</span>' : '<br><span class="chip mute">摘录 · 已核对原文</span>') + '</blockquote>' : '') +
      '<ol class="pts">' + r.v1.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol>';
  } else {
    c1 = '<p class="warn-line">' + ic('alert') + '失败：' + esc(r.v1.error || '未知') + '</p>' + (r.v1.raw ? '<pre class="lab-raw">' + esc(r.v1.raw) + '</pre>' : '');
  }
  let c2;
  if (r.v4.ok) {
    const b = LEVEL_BADGE[r.v4.verdict] || ['mute', r.v4.verdict];
    c2 =
      '<div class="lab-v"><span class="chip ' + b[0] + '">' + b[1] + '</span></div>' +
      (r.v4.lead ? '<p class="lab-lead">' + esc(r.v4.lead) + '</p>' : '') +
      (r.v4.points.length
        ? '<div class="lab-pts">' + r.v4.points.map(p => {
            const hit = resolveLanding(r.blocks, p);
            const label = hit ? p.linkLabel : '查看原文快照';
            return '<div class="lab-pt">' +
              '<div class="g">' + esc(p.gist) + '</div>' +
              (p.why ? '<div class="w">' + esc(p.why) + '</div>' : '') +
              (r.blocks && r.blocks.length
                ? '<div class="lnk"><button class="link-btn" data-act="labSnap" data-block="' + esc(hit ? hit.blockId : '') + '" data-end="' + esc(hit && hit.endBlockId ? hit.endBlockId : '') + '" data-quote="' + esc(hit ? hit.quote : '') + '" data-question="' + esc(p.question || '') + '" data-label="' + esc(label) + '">' + esc(label) + ' ' + ic('chevr') + '</button></div>'
                : '') +
            '</div>';
          }).join('') + '</div>'
        : '<p class="hint-line">没有值得单独点开的内容。</p>') +
      (r.v4.limitation ? '<p class="hint-line"><b>局限：</b>' + esc(r.v4.limitation) + '</p>' : '');
  } else {
    c2 = '<p class="warn-line">' + ic('alert') + '失败：' + esc(r.v4.error || '未知') + '</p>' + (r.v4.raw ? '<pre class="lab-raw">' + esc(r.v4.raw) + '</pre>' : '');
  }
  return meta +
    '<div class="lab-grid">' +
      '<div class="lab-col reveal"><h3>' + ic('book') + 'V1 · 线上单段提示词</h3>' + c1 + '</div>' +
      '<div class="lab-col reveal"><h3>' + ic('zap') + 'V4 · 要点式读前筛选</h3>' + c2 + '</div>' +
    '</div>';
}
/* 落点解析：blockId 有效即定位到推荐段；quote 命中时追加句级高亮。
   quote 提供但找不到 → null（通用降级，不用不相关段落冒充）；quote 缺失 → 仅段级定位。 */
function findQuoteInText(text, quote) {
  if (!quote) return null;
  if (text.includes(quote)) return quote;
  const escRe = c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = text.match(new RegExp(quote.split('').map(escRe).join('\\s*')));
  return m ? m[0] : null;
}
function resolveLanding(blocks, p) {
  if (!Array.isArray(blocks) || !blocks.length || !p.blockId) return null;
  const byId = {};
  blocks.forEach(b => { byId[b.id] = b; });
  const start = byId[p.blockId];
  if (!start) return null;
  const endOk = p.endBlockId && byId[p.endBlockId] ? p.endBlockId : null;
  const actual = findQuoteInText(start.text, p.quote);
  return { blockId: start.id, quote: actual || '', endBlockId: endOk };
}
function openSnapshotView(title, blocks, opts) {
  opts = opts || {};
  let target = null, markQuote = '';
  if (opts.blockId) {
    const b = blocks.find(x => x.id === opts.blockId);
    if (b) {
      target = { block: b };
      markQuote = opts.quote ? (findQuoteInText(b.text, opts.quote) || '') : '';
    }
  }
  let rangeIds = [];
  if (target && opts.endBlockId) {
    const si = blocks.findIndex(b => b.id === target.block.id);
    const ei = blocks.findIndex(b => b.id === opts.endBlockId);
    if (ei >= si) rangeIds = blocks.slice(si, ei + 1).map(b => b.id);
  }
  const list = blocks.map(b => {
    let html = esc(b.text);
    if (target && b.id === target.block.id && markQuote) {
      html = html.split(esc(markQuote)).join('<mark class="q">' + esc(markQuote) + '</mark>');
    } else if (rangeIds.indexOf(b.id) > -1) {
      const m = html.match(/^([^<：:]{1,24}[：:])/);          // 清单项「短标题：」加粗
      if (m) html = '<strong>' + m[1] + '</strong>' + html.slice(m[1].length);
    }
    const cls = 'snap-b'
      + (target && b.id === target.block.id ? ' hit' : '')
      + (rangeIds.indexOf(b.id) > -1 ? ' range' : '')
      + (opts.showIds ? '' : ' no-ids');
    return '<div class="' + cls + '" data-snap="' + b.id + '"><b>' + esc(b.id) + '</b>' + html + '</div>';
  }).join('');
  const entry = opts.question
    ? '<div class="snap-entry">' + ic('search') + '正在核对：' + esc(opts.question) + '</div>'
    : '<div class="snap-entry">' + ic('zap') + esc(opts.label || '原文快照') + '</div>';
  openOverlay(
    '<div class="modal-head"><h3>' + ic('eye') + '原文快照 · ' + esc(title || '') + '</h3><button class="icon-btn" aria-label="关闭快照" data-act="overlayClose">' + ic('x') + '</button></div>' +
    entry +
    '<div class="snap-list">' + list + '</div>',
    true
  );
  const listEl = document.querySelector('.snap-list');
  const hitEl = target ? listEl.querySelector('.snap-b.hit') : null;
  listEl.scrollTop = hitEl ? Math.max(0, hitEl.offsetTop - 24) : 0;   // 落点靠上，上方保留少量上下文
}
async function labRunFlow() {
  const inp = $('#labInput');
  const v = inp ? inp.value.trim() : '';
  if (!v) { toast('先粘贴链接或正文', false); if (inp) inp.focus(); return; }
  const btn = document.querySelector('[data-act="labRun"]');
  if (btn) { btn.disabled = true; btn.classList.add('busy'); }
  const goal = ($('#labGoal') && $('#labGoal').value.trim()) || '';
  /* 工单14：结果绑定本次提交——开跑即切到「本轮进行中」状态，旧结果折叠为「上次结果」 */
  S.labPrev = S.labResult || null;
  S.labResult = null; S.labPending = true;
  const body = $('#labBody');
  if (body) body.innerHTML = labPendingHTML(S.labPrev);
  toast('并行对比中 · 两次模型调用约 10-30 秒');
  try {
    const raw = inp ? inp.value : v;
    const r = await api.abTest({ kind: detectKind(v), value: raw, goal });
    const firstLine = String(raw).split(/\r?\n/).map(s => s.trim()).find(Boolean) || v;
    r.inputPreview = (detectKind(v) === 'link' ? v : firstLine).slice(0, 24);
    r.goalPreview = goal;
    r.inputKey = JSON.stringify([String(raw), goal]);
    S.labResult = r; S.labPending = false;
    if (body) body.innerHTML = labResultHTML(r);
    updateLabDirty();
    toast('对比完成', true);
  } catch (e) {
    S.labPending = false;
    if (body) body.innerHTML = labPendingHTML(S.labPrev) +
      '<p class="warn-line">' + ic('alert') + '本轮对比失败：' + esc(e && e.message ? e.message : '未知错误') + '</p>';
    toast('对比失败：' + (e && e.message ? e.message : '未知错误'), false);
  }
  if (btn) { btn.disabled = false; btn.classList.remove('busy'); }
}

/* ---------------- 分析报告（产品入口的 hero 时刻） ---------------- */
/* 工单12：卡片「是否参与复习」按当前状态展示，人工保留/归档不再被自动判定文案覆盖 */
function cardPlanText(card) {
  if (!card) return '';
  if (card.status === 'archived') return '已归档 · 暂停复习';
  if (card.status === 'mastered') return '已巩固 · 不再出现在复习队列';
  if (card.due) return '今日到期（间隔 ' + STAGE_SHORT[card.stage] + '）';
  return '未到期 · ' + (card.nextLabel || '按间隔顺延');
}
function reportCardHTML(card) {
  return '<div class="report-card reveal">' +
    '<div class="rc-head">' + ic('layers') + '<b>知识卡片</b><span class="meta">' + cardPlanText(card) + '</span></div>' +
    '<h3>' + esc(card.title) + '</h3>' +
    '<ol class="pts">' + card.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol>' +
    (card.excerpt ? '<blockquote>' + esc(card.excerpt) + excerptTag(card) + '</blockquote>' : '') +
    '<div class="row-actions"><button class="btn" data-act="openCard" data-id="' + card.id + '">' + ic('edit') + '查看 / 编辑卡片</button>' +
    '<button class="btn primary" data-act="goReview">' + ic('calcheck') + '开始今日复习</button></div>' +
  '</div>';
}
/* 特性①：目标结论——有「我想知道什么」时，报告首屏优先回答该问题。
   lead 永远展示（模型对目标的直接回应，含「原文没提」的诚实回答）；
   verdict 非跳过且给出落点时，才把第一条要点作为大字答案 + 原文入口。 */
function goalConclusionHTML(c) {
  const v4 = c.v4;
  if (!v4 || !v4.ok) return '';
  const head = '<div class="goal-head">' + ic('search') + '正在核对：' + esc(c.goal || '') + '</div>';
  const pts = Array.isArray(v4.points) ? v4.points : [];
  /* 仅「值得读/只读部分」才把首条要点当答案；skim/skip/insufficient 以 lead 为准
     （lead 是模型对目标的直接回应，含「原文没提」的诚实回答） */
  const answerable = pts.length > 0 && (v4.verdict === 'read_full' || v4.verdict === 'read_parts');
  let body = (v4.lead ? '<p class="goal-lead">' + esc(v4.lead) + '</p>' : '');
  if (answerable) {
    const p0 = pts[0];
    const hit = resolveLanding(c.blocks || [], p0);
    const label = hit ? (p0.linkLabel || '看原文') : '查看原文快照';
    body += '<p class="goal-answer">' + esc(p0.gist) + '</p>' +
      (p0.why ? '<p class="goal-why">' + esc(p0.why) + '</p>' : '') +
      ((c.blocks && c.blocks.length) ? '<div class="row-actions"><button class="btn" data-act="capSnap" data-id="' + c.id + '" data-block="' + esc(hit ? hit.blockId : '') + '" data-end="' + esc(hit && hit.endBlockId ? hit.endBlockId : '') + '" data-quote="' + esc(hit ? hit.quote : '') + '" data-question="' + esc(c.goal || '') + '" data-label="' + esc(label) + '">' + ic('eye') + esc(label) + '</button></div>' : '');
  }
  return '<div class="verdict goal reveal">' + head + body +
    (v4.limitation ? '<p class="hint-line"><b>局限：</b>' + esc(v4.limitation) + '</p>' : '') +
    '<p class="hint-line">结论来自 AI 目标核对，点入口可在原文中核对。</p>' +
  '</div>';
}
function renderReport() {
  const c = DB.captureById(S.reportId);
  if (!c) return shell('分析报告', '<div class="empty">' + ic('alert', 'big') + '<h3>内容不存在</h3><p>这条报告地址没有对应的收藏内容，可能已被删除或来自旧版本数据。</p><button class="btn ghost" data-act="nav" data-nav="inbox">返回收件箱</button></div>');
  const v = c.verdict;
  const worth = v && v.value === 'worth';
  const kept = c.userDecision === 'keep';
  const card = c.cardId ? DB.cardById(c.cardId) : null;
  const domain = c.sourceUrl ? esc(c.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]) : esc(c.sourceName);

  const stepsAll = '<div class="steps big reveal">' + ANALYSIS_STEPS.map(s =>
    '<span class="step done">' + ic('check') + s + '</span>').join('') + '</div>';
  const stepsFailed = '<div class="steps big reveal">' + ANALYSIS_STEPS.map((s, i) =>
    '<span class="step ' + (i < 1 ? 'done' : i === 1 ? 'cur' : '') + '">' + (i < 1 ? ic('check') : i === 1 ? ic('loader') : '<i class="step-dot"></i>') + s + '</span>').join('') + '</div>';

  let verdictBlock;
  if (c.status === 'restricted') {
    /* 抓取受限：页面需要登录或付费（HTTP 401/402/403），保留链接并给补正文入口 */
    verdictBlock =
      '<div class="verdict notworth reveal"><div class="v-badge">' + ic('lock') + '抓取受限</div>' +
      '<span class="chip mute">' + ic('lock') + '需要登录或付费</span>' +
      '<p class="v-reason">该页面需要登录或付费，暂时抓取不到正文。可以打开原链接阅读，或选中正文复制后回首页粘贴分析。</p>' +
      (c.sourceUrl ? '<p class="v-reason"><b>提交的链接：</b>' + esc(c.sourceUrl) + '</p>' : '') +
      '<p class="hint-line">本次没有生成知识卡片，也没有加入复习计划（新增待复习数为 0）。</p>' +
      '<div class="row-actions">' +
        (c.sourceUrl ? '<button class="btn" data-act="openLink" data-id="' + c.id + '">' + ic('extlink') + '打开原链接</button>' : '') +
        '<button class="btn ghost" data-act="replenish" data-id="' + c.id + '">' + ic('type') + '选中正文文字再收藏</button>' +
      '</div></div>';
  } else if (c.status === 'failed') {
    /* 工单02：失败有明确状态与原因，保留用户提交的链接，提供重试与补正文入口 */
    verdictBlock =
      '<div class="verdict notworth reveal"><div class="v-badge">' + ic('alert') + '未能获取可分析的正文</div>' +
      '<span class="chip err">处理失败</span>' +
      '<p class="v-reason"><b>失败原因：</b>' + esc(c.failReason || '未知原因') + '</p>' +
      (c.sourceUrl ? '<p class="v-reason"><b>提交的链接：</b>' + esc(c.sourceUrl) + '</p>' : '') +
      '<p class="hint-line">本次没有生成知识卡片，也没有加入复习计划（新增待复习数为 0）。</p>' +
      '<div class="row-actions">' +
        '<button class="btn" data-act="retry" data-id="' + c.id + '">' + ic('refresh') + '重试</button>' +
        (c.sourceUrl ? '<button class="btn ghost" data-act="openLink" data-id="' + c.id + '">' + ic('extlink') + '打开原链接</button>' : '') +
        '<button class="btn ghost" data-act="replenish" data-id="' + c.id + '">' + ic('type') + '粘贴正文重新分析</button>' +
      '</div></div>';
  } else if (!v) {
    verdictBlock = '<div class="verdict pending reveal">' + ic('loader') + '<p>AI 正在分析这条内容<span class="think-dots"><i></i><i></i><i></i></span></p>' + processSteps(c) + '</div>';
  } else if (worth) {
    verdictBlock =
      '<div class="verdict worth reveal"><div class="v-badge">' + ic('checkc') + '值得读</div>' +
      '<span class="chip mute">' + esc(v.contentType) + '</span>' + aiSourceChip(c) +
      '<p class="v-reason"><b>判定理由：</b>' + esc(v.reason) + '</p></div>' +
      (card ? reportCardHTML(card) : '');
  } else if (kept) {
    /* 工单12：AI 判定与用户决定分层展示，原判定与理由可追溯 */
    verdictBlock =
      '<div class="verdict notworth reveal"><div class="v-badge">' + ic('alert') + 'AI 判定 · 不建议读</div>' +
      '<span class="chip warn">' + esc(v.contentType) + '</span>' + aiSourceChip(c) +
      '<p class="v-reason"><b>判定理由：</b>' + esc(v.reason) + '</p></div>' +
      '<div class="verdict worth reveal"><div class="v-badge">' + ic('checkc') + '你的决定 · 保留</div>' +
      '<span class="chip ok">用户手动保留</span>' +
      '<p class="v-reason">已按你的决定生成知识卡片；卡片当前是否参与复习见下方状态。</p></div>' +
      (card ? reportCardHTML(card) : '');
  } else {
    /* 特性②：一次性通知 → 「扫一眼即可」+ 行动信息上首屏，默认不加复习 */
    const notice = c.scenario && c.scenario.action;
    verdictBlock = notice ?
      '<div class="verdict notworth reveal"><div class="v-badge">' + ic('zap') + '扫一眼即可</div>' +
      '<span class="chip ok">一次性通知</span>' + aiSourceChip(c) +
      '<div class="notice-box big">' + ic('bell') + esc(c.scenario.action) + '</div>' +
      '<p class="v-reason"><b>判定理由：</b>' + esc(v.reason) + '</p>' +
      '<p class="hint-line">一次性通知已保留原文，默认不加入复习计划；去留由你决定。</p>' +
      '<div class="row-actions">' +
        '<button class="btn" data-act="decide" data-id="' + c.id + '" data-action="keep">' + ic('check') + '保留</button>' +
        '<button class="btn danger" data-act="decide" data-id="' + c.id + '" data-action="drop">' + ic('trash') + '丢弃</button>' +
        '<button class="btn ghost" data-act="nav" data-nav="confirm">前往待确认 ' + ic('chevr') + '</button>' +
      '</div></div>'
      :
      '<div class="verdict notworth reveal"><div class="v-badge">' + ic('alert') + '不建议读</div>' +
      '<span class="chip warn">' + esc(v.contentType) + '</span>' + aiSourceChip(c) +
      '<p class="v-reason"><b>判定理由：</b>' + esc(v.reason) + '</p>' +
      '<p class="hint-line">这条内容已放入「待确认」，去留由你决定 — AI 不会自动删除任何收藏。</p>' +
      '<div class="row-actions">' +
        '<button class="btn" data-act="decide" data-id="' + c.id + '" data-action="keep">' + ic('check') + '强制保留（仍生成卡片）</button>' +
        '<button class="btn danger" data-act="decide" data-id="' + c.id + '" data-action="drop">' + ic('trash') + '丢弃</button>' +
        '<button class="btn ghost" data-act="nav" data-nav="confirm">前往待确认 ' + ic('chevr') + '</button>' +
      '</div></div>';
  }

  const goalBlock = (c.goal && c.v4 && c.v4.ok && c.status !== 'failed' && c.status !== 'restricted') ? goalConclusionHTML(c) : '';
  const body =
    '<div class="report">' +
      '<div class="rep-head reveal">' +
        '<button class="btn sm ghost back" data-act="nav" data-nav="inbox">' + ic('arrowl') + '收件箱</button>' +
        (c.cover ? '<img class="rep-cover" src="' + c.cover + '" alt="">' : '') +
        '<h2>' + esc(c.title) + '</h2>' +
        '<p class="meta">' + (c.replenished ? '<span class="chip mute">' + ic('type') + '用户补充正文</span> · ' : '') +
        (c.sourceUrl ? ic('link') + ' ' + domain + ' · ' : ic(TYPE_ICON[c.type]) + ' ') + esc(c.collectedAt) + ' · ' +
        (c.snapshot && Array.isArray(c.blocks) && c.blocks.length
          ? '<button class="link-btn" data-act="openSnapshot" data-id="' + c.id + '">' + ic('eye') + '原文快照已留存 · 点击溯源</button>'
          : '快照未留存') + '</p>' +
      '</div>' +
      (goalBlock ? goalBlock : '') +
      (c.status === 'failed' ? stepsFailed : stepsAll) + verdictBlock +
    '</div>';
  return shell('AI 分析报告', body);
}

/* ---------------- 判定 / 重试流程 ---------------- */
async function decideFlow(id, action, el) {
  if (action === 'drop' && !confirmDrop(1)) return;
  if (el) { el.disabled = true; el.classList.add('busy'); }
  const res = await api.decideCapture(id, action);
  if (!res) return;
  if (action === 'drop') {
    toast('已丢弃 · 进入回收站（30 天内可恢复）', false);
    if (S.route === 'report') go('inbox');
  } else {
    toast('已保留 · 知识卡片已生成并进入复习计划', true);
  }
  render();
}
async function retryFlow(id, el) {
  if (el) el.disabled = true;
  await api.retryCapture(id);
  render();
  const res = await api.analyzeCapture(id, () => updateCapSteps(id));
  if (res && res.restricted) toast('仍是抓取受限：该页面需要登录或付费', false);
  else if (res && res.failed) toast('重试仍失败：' + (res.cap.failReason || '未知原因'), false);
  else if (res && res.card) toast('重试成功 · 判定为值得读，卡片已生成', true);
  else toast('重试成功 · 分析完成', true);
  go('report', id);
}
async function batchDecideFlow(action) {
  if (!S.batch.size) { toast('请先勾选内容', false); return; }
  const ids = Array.from(S.batch);
  if (action === 'drop' && !confirmDrop(ids.length)) return;
  for (const id of ids) await api.decideCapture(id, action);
  S.batch.clear();
  toast(action === 'drop' ? '已批量丢弃 ' + ids.length + ' 条' : '已批量保留 ' + ids.length + ' 条，卡片已生成', action !== 'drop');
  render();
}
let dropArm = null;
function confirmDrop(n) {
  const now = Date.now();
  if (dropArm && now - dropArm < 3000) { dropArm = null; return true; }
  dropArm = now;
  toast('将丢弃 ' + n + ' 条内容 — 3 秒内再次点击「丢弃」确认', false);
  return false;
}

/* ---------------- 复习反馈 ---------------- */
async function feedbackFlow(f) {
  const r = S.review;
  const cardId = r.queue[r.idx];
  const res = await api.reviewFeedback(cardId, f);
  r.answers += 1;
  if (f === 'forgot') { r.forgot += 1; r.queue.push(cardId); }   // 重练卡稍后再次出现，不重复计入已完成张数
  else r.done += 1;
  toast('间隔 ' + res.from + ' → ' + res.to + ' · ' + res.nextLabel, f === 'good');
  r.idx += 1;
  /* 工单08：每次切换卡片（含重练卡）都重置翻面状态——新卡先只显示题面 */
  r.flipped = false;
  if (r.idx >= r.queue.length) { r.finished = true; clearReviewRound(); }
  else saveReviewRound();
  render();
}

/* ---------------- 卡片详情弹窗 ---------------- */
let modalCardId = null;
function openCardModal(id) {
  const c = DB.cardById(id);
  if (!c) { toast('卡片不存在', false); return; }
  modalCardId = id; S.deleteArmed = false;
  openOverlay('<div id="cardModal"></div>');
  renderCardModalBody(false);
}
function renderCardModalBody(edit) {
  const c = DB.cardById(modalCardId);
  if (!c) return;
  const shareUrl = 'https://shiyi.app/s/' + c.id.replace(/^card-/, 'c');
  let inner;
  if (edit) {
    inner =
    '<div class="modal-head"><h3>' + ic('edit') + '编辑卡片</h3><button class="icon-btn" aria-label="关闭编辑" data-act="overlayClose">' + ic('x') + '</button></div>' +
    '<label class="fl">一句话总结</label><input id="eTitle" class="input" value="' + esc(c.title) + '">' +
    '<label class="fl">核心要点（每行一条）</label><textarea id="ePoints" class="input" rows="5">' + esc(c.points.join('\n')) + '</textarea>' +
    '<label class="fl">关键摘录</label><textarea id="eExcerpt" class="input" rows="2">' + esc(c.excerpt) + '</textarea>' +
    '<label class="fl">标签（逗号分隔）</label><input id="eTags" class="input" value="' + esc(c.tags.join(', ')) + '">' +
    '<p class="hint-line">编辑不会重置复习进度（间隔 ' + (c.stage <= 5 ? STAGE_SHORT[c.stage] : '已完成') + ' 保持不变）。</p>' +
    '<div class="modal-foot"><button class="btn ghost" data-act="cardCancelEdit">取消</button><button class="btn primary" data-act="cardSave">' + ic('check') + '保存</button></div>';
  } else {
    inner =
    '<div class="modal-head"><h3>' + ic('layers') + '知识卡片</h3><button class="icon-btn" aria-label="关闭卡片详情" data-act="overlayClose">' + ic('x') + '</button></div>' +
    '<div class="cm-status"><span class="chip ' + (c.status === 'mastered' ? 'ok' : c.status === 'archived' ? 'mute' : 'proc') + '">' +
      (c.status === 'mastered' ? '已巩固' : c.status === 'archived' ? '已归档 · 暂停复习' : '学习中 · 间隔 ' + STAGE_SHORT[c.stage]) + '</span>' +
      '<span class="meta">' + ic('clock') + ' 已复习 ' + c.reviews + ' 次 · 创建于 ' + esc(c.createdAt) + '</span></div>' +
    '<h3 class="cm-title">' + esc(c.title) + '</h3>' +
    '<ol class="pts">' + c.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol>' +
    (c.excerpt ? '<blockquote>' + esc(c.excerpt) + excerptTag(c) + '</blockquote>' : '') +
    '<div class="ktag">' + c.tags.map(t => '<span class="chip mute">' + esc(t) + '</span>').join('') + '</div>' +
    '<div class="cm-source"><button class="link-btn" data-act="cardTrace">' + (c.sourceUrl ? ic('link') + esc(c.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]) : ic('filetext') + esc(c.sourceName)) + ' · 原文溯源</button></div>' +
    (c.shared ? '<div class="share-box on">' + ic('share') + '<code>' + shareUrl + '</code><button class="btn sm ghost" data-act="cardShare">关闭分享</button></div>'
              : '<div class="share-box">' + ic('lock') + '此卡片未分享<button class="btn sm ghost" data-act="cardShare">' + ic('share') + '生成公开链接</button></div>') +
    '<div class="modal-foot spread">' +
      '<div class="left"><button class="btn sm ghost" data-act="cardEdit">' + ic('edit') + '编辑</button>' +
      '<button class="btn sm ghost" data-act="cardReextract">' + ic('refresh') + '重新提炼</button>' +
      '<button class="btn sm ghost" data-act="cardArchive" data-id="' + modalCardId + '">' + ic('archive') + (c.status === 'archived' ? '恢复' : '归档') + '</button></div>' +
      '<button class="btn sm danger" data-act="cardDelete" data-id="' + modalCardId + '">' + ic('trash') + '删除</button></div>';
  }
  $('#cardModal').innerHTML = inner;
}
async function saveCardFlow() {
  const title = $('#eTitle').value.trim();
  if (!title) { toast('一句话总结不能为空', false); return; }
  const points = $('#ePoints').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!points.length) { toast('至少保留一条要点', false); return; }
  const tags = $('#eTags').value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  await api.updateCard(modalCardId, { title, points, excerpt: $('#eExcerpt').value.trim(), tags });
  toast('卡片已保存 · 复习进度不变', true);
  renderCardModalBody(false); render();
}
async function shareFlow() {
  const c = DB.cardById(modalCardId);
  const res = await api.toggleShare(modalCardId, !c.shared);
  if (res.card.shared) { toast('公开链接已生成 · 仅分享这一张卡片', true); }
  else toast('分享已关闭 · 链接立即失效');
  renderCardModalBody(false); render();
}
async function reextractFlow(el) {
  el.disabled = true; el.classList.add('busy');
  await api.reextractCard(modalCardId);
  el.disabled = false; el.classList.remove('busy');
  toast('已重新提炼 · 不影响你手动编辑过的内容', true);
  renderCardModalBody(false); render();
}

/* ---------------- 弹窗容器 ---------------- */
function openOverlay(html, wide) {
  const ov = $('#overlay');
  S.lastFocus = document.activeElement;                    // 工单15：记住触发入口
  ov.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  ov.classList.add('open');
  const f = ov.querySelector('.modal-head .icon-btn') || ov.querySelector('button,[href],input,textarea');
  if (f) f.focus();                                        // 打开后焦点进入弹窗
}
function closeOverlay() {
  const ov = $('#overlay');
  ov.classList.remove('open');
  ov.innerHTML = '';
  S.deleteArmed = false;
  if (S.lastFocus && document.contains(S.lastFocus)) {     // 关闭后焦点回到触发入口
    try { S.lastFocus.focus(); } catch (e) {}
  }
  S.lastFocus = null;
}

/* ---------------- 渲染入口 ---------------- */
let lastRoute = null;
function render() {
  const sameRoute = lastRoute === S.route;   // 同视图内刷新：不重播入场动画（防黑闪）
  lastRoute = S.route;
  const app = $('#app');
  const draft = (S.route === 'home' && document.querySelector('#heroInput'))
    ? { v: document.querySelector('#heroInput').value, focused: document.activeElement === document.querySelector('#heroInput') }
    : null;
  const v = {
    home: renderHome, inbox: renderInbox, confirm: renderConfirm, library: renderLibrary,
    review: renderReview, palace: renderPalace, lab: renderLab, report: renderReport
  }[S.route];
  app.innerHTML = v();
  if (sameRoute) app.classList.add('silent');
  if (S.submitting) {          // 分析进行中：重建后的提交按钮保持忙碌态（工单04 + 分析动画）
    const b = app.querySelector('[data-act="heroSubmit"]');
    if (b) { b.disabled = true; b.classList.add('busy'); }
  }
  if (draft) {
    const ta = document.querySelector('#heroInput');
    if (ta && draft.v) { ta.value = draft.v; updateHeroHint(); if (draft.focused) ta.focus(); }
  }
  if (S.route === 'library') renderLibGrid();
  /* hero 打字机引导：仅主页且输入为空时循环 */
  if (S.route === 'home') setTimeout(startHeroTyper, 500);
  else stopHeroTyper();
}

/* 分析步进的局部刷新：只更新对应卡片上的步骤条，不重建整个视图 */
function updateCapSteps(capId) {
  const c = DB.captureById(capId);
  const el = document.querySelector('.capture[data-cap="' + capId + '"]');
  if (!c || !el) return;
  const stepsEl = el.querySelector('.steps');
  if (stepsEl) stepsEl.outerHTML = processSteps(c);
}

/* 首次加载：只渲染用户选择的页面。演示任务不再自动运行、不强制导航（工单05）；
   演示种子（cap-06 等）已在数据初始化时定格为已完成状态。 */
(function boot() {
  const r = parseHash();
  S.route = r.route === 'report' ? 'report' : r.route;
  S.reportId = r.id;
  if (S.route === 'review') { if (!restoreReviewRound()) initReview(); }
  render();
})();
