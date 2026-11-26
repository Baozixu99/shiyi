/* ============================================================
 * 拾忆 · 高保真原型 — mock.js
 * 单一数据源（DB）。所有视图从 DB 读取，禁止散落硬编码。
 * 实体：Capture（收藏内容）→ Card（知识卡片）→ 复习计划（内嵌于 Card.stage）
 * Capture.status: processing 处理中 | analyzed 已转化 | awaiting 待确认
 *                 | failed 待重试 | restricted 抓取受限 | dropped 已丢弃
 * Card.status:    learning 学习中 | mastered 已巩固 | archived 已归档
 * Card.stage:     0..5 对应艾宾浩斯间隔 D0/1/3/7/14/30；6 = 已巩固
 * 共享规则 R1（唯一权威定义，见 PRD）：忘记→回 D0；模糊→保持；记住→下一间隔
 * ============================================================ */

const STAGE_LABELS = ['D0 · 今天', 'D1 · 明天', 'D3', 'D7', 'D14', 'D30'];
const STAGE_SHORT  = ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'];

function seedDB() {
return {
  profile: { name: '阿拾', streakDays: 12 },

  /* ---------------- 收藏内容 ---------------- */
  captures: [
    {
      id: 'cap-01', type: 'link',
      title: '深入浅出一致性哈希：为什么仅 1/N 的数据需要迁移',
      sourceName: '技术weekly', sourceUrl: 'https://tech-weekly.example.com/consistent-hashing',
      collectedAt: '今天 09:12', cover: 'assets/cover-hashring.jpg',
      status: 'analyzed', snapshot: true,
      verdict: { value: 'worth', contentType: '技术解读',
        reason: '含可复用的算法原理与图解推导，观点有数据支撑，属于高信息密度的技术内容。' },
      cardId: 'card-01'
    },
    {
      id: 'cap-02', type: 'link',
      title: '震惊！99% 的人都不知道的效率神器',
      sourceName: '效率工具铺', sourceUrl: 'https://mp.weixin.qq.com/s/abc123',
      collectedAt: '今天 10:47', cover: null,
      status: 'awaiting', snapshot: true,
      verdict: { value: 'not', contentType: '营销推广',
        reason: '全文围绕一款课程的限时优惠展开，缺乏可提炼的方法或事实，核心诉求是引导购买。' },
      cardId: null
    },
    {
      id: 'cap-03', type: 'text',
      title: '检索练习：为什么「测试自己」比「重复阅读」更有效',
      sourceName: '粘贴文本', sourceUrl: null,
      collectedAt: '昨天 21:30', cover: 'assets/cover-memory.jpg',
      status: 'analyzed', snapshot: true,
      verdict: { value: 'worth', contentType: '研究解读',
        reason: '引用了认知科学领域的对照实验数据，结论可直接用于改进学习方法，信息密度高。' },
      cardId: 'card-02'
    },
    {
      /* 演示示例：没营养的文章被 AI 检测为「不推荐阅读」，进入待确认（取代旧的抓取失败示例） */
      id: 'cap-04', type: 'text',
      title: 'AI 时代你必须养成的十个习惯',
      sourceName: '粘贴文本', sourceUrl: null,
      collectedAt: '昨天 20:15', cover: null,
      status: 'awaiting', snapshot: false,
      verdict: { value: 'not', contentType: 'AI 水文',
        reason: '全文为 AI 生成的泛化清单，无具体案例、数据或个人经验，信息密度低，要点彼此重复。' },
      cardId: null
    },
    {
      id: 'cap-05', type: 'link',
      title: '万字长文：Netflix 微服务演进史（付费专栏）',
      sourceName: 'InfoQ 付费专栏', sourceUrl: 'https://www.infoq.example.com/paid/netflix-history',
      collectedAt: '昨天 11:20', cover: null,
      status: 'restricted', snapshot: false,
      verdict: null, cardId: null
    },
    {
      id: 'cap-06', type: 'link',
      title: '我把「复习」搬进了每天通勤的 40 分钟里',
      sourceName: '小红书 · 一颗计划表', sourceUrl: 'https://www.xiaohongshu.example.com/explore/6f2a',
      collectedAt: '今天 08:40', cover: 'assets/cover-desk.jpg',
      status: 'analyzed', snapshot: true,
      verdict: { value: 'worth', contentType: '经验分享',
        reason: '来自真实使用者的完整方法复盘，含可复制的执行步骤与踩坑总结，有个人实践细节支撑。' },
      cardId: 'card-09',
      scenario: {
        value: 'worth', contentType: '经验分享',
        reason: '来自真实使用者的完整方法复盘，含可复制的执行步骤与踩坑总结，有个人实践细节支撑。',
        title: '把复习搬进通勤的 40 分钟：一套可复制的碎片时间学习法',
        points: [
          '把「待复习卡片」绑定到固定通勤时段，用场景触发代替意志力',
          '复习队列控制在 15 张以内，超出的顺延，避免当日过载',
          '「模糊」的卡片单独标记，周末集中做一次二次加工（改写要点）',
          '连续打卡不是目的：漏掉一天后允许「顺延」而非重新开始，中断率反而下降'
        ],
        excerpt: '「记住」就前进一天，「模糊」就原地停一天，「忘记」就回到当天——规则简单到不会中途放弃。'
      }
    }
  ],

  /* ---------------- 知识卡片 ---------------- */
  cards: [
    {
      id: 'card-01', captureId: 'cap-01',
      title: '一致性哈希如何将节点增减的数据迁移量从「全量」降到「1/N」',
      points: [
        '哈希环：节点与数据映射到同一 [0, 2^32) 环上，顺时针归属第一个节点',
        '节点上下线只影响环上相邻区间的数据，迁移量从全量降为 1/N',
        '虚拟节点（每物理节点 100~200 个）打散热点，解决数据倾斜',
        '代价：全局有序遍历困难，需要额外维护路由表'
      ],
      excerpt: '「仅 1/N 的数据需要迁移」——这是缓冲层、分库分表、CDN 调度共用的同一把钥匙。',
      sourceName: '技术weekly', sourceUrl: 'https://tech-weekly.example.com/consistent-hashing',
      tags: ['分布式', '后端'], status: 'learning', stage: 2,
      reviews: 2, due: true, shared: false, cover: 'assets/cover-hashring.jpg',
      createdAt: '今天 09:12'
    },
    {
      id: 'card-02', captureId: 'cap-03',
      title: '检索练习为什么比重复阅读更能形成长期记忆',
      points: [
        '「提取」本身就是一次记忆强化，效果远优于再次输入',
        '对照实验：测试组的周后留存率约为重复阅读组的 2 倍',
        '提取难度越高（合上书回忆 vs 看着笔记读），记忆增益越大',
        '落地形式：自问自答、空白页默写、间隔重复测试'
      ],
      excerpt: 'R = Retrieval。记忆的强度不取决于输入次数，而取决于提取次数。',
      sourceName: '粘贴文本', sourceUrl: null,
      tags: ['认知科学', '学习方法'], status: 'learning', stage: 0,
      reviews: 0, due: true, shared: false, cover: 'assets/cover-memory.jpg',
      createdAt: '昨天 21:30'
    },
    {
      id: 'card-03', captureId: null,
      title: '费曼技巧的完整闭环：以教代学，暴露理解缺口',
      points: [
        '第一步：用一张白纸把概念讲给「想象中的外行」听',
        '卡壳的地方 = 理解缺口，回到原始材料定点补齐',
        '简化与类比是检验：说不出类比，说明只背住了术语',
        '完整闭环：讲授 → 缺口 → 回源 → 再简化'
      ],
      excerpt: '如果你不能用简单的语言解释它，说明你还没有真正理解它。',
      sourceName: '收藏补充', sourceUrl: null,
      tags: ['学习方法'], status: 'learning', stage: 3,
      reviews: 3, due: true, shared: false, cover: 'assets/cover-desk.jpg',
      createdAt: '3 天前'
    },
    {
      id: 'card-04', captureId: null,
      title: 'TCP 三次握手：每一步各自确认了什么',
      points: [
        'SYN：客户端确认「自己能发」，等待对方确认收',
        'SYN + ACK：服务端确认「自己能收也能发」',
        'ACK：客户端确认「服务端能收能发」，双方信道全部打通',
        '为什么要三次而不是两次：防止历史失效连接请求突然到达造成资源浪费'
      ],
      excerpt: '两次握手的缺陷：服务端无法确认「自己发的包对方收到了」。',
      sourceName: '面试八股文合集', sourceUrl: null,
      tags: ['网络', '后端'], status: 'learning', stage: 4,
      reviews: 4, due: false, nextLabel: '明天到期', shared: false, cover: null,
      createdAt: '5 天前'
    },
    {
      id: 'card-05', captureId: null,
      title: '番茄工作法的实证边界：它对哪类任务有效',
      points: [
        '对启动困难型任务有效：25 分钟承诺降低了进入门槛',
        '对深度创作型任务有干扰：固定中断会打断心流',
        '改进变体：以「任务块」为单位，番茄钟只做提醒不做强制中断',
        '关键不是 25 分钟，而是「开始」与「记录」两个动作'
      ],
      excerpt: '番茄钟的本质是一个「启动装置」，而不是计时器。',
      sourceName: '效率手册', sourceUrl: null,
      tags: ['效率方法'], status: 'mastered', stage: 6,
      reviews: 6, due: false, shared: false, cover: null,
      createdAt: '2 周前'
    },
    {
      id: 'card-06', captureId: null,
      title: '二叉树的四种遍历：一个统一递归框架',
      points: [
        '前/中/后序只是「访问根」的时机不同：前-根、中-根、后-根',
        '统一框架：递归函数里三个位置放 print，即为三种遍历',
        '迭代实现统一用栈，中序需要「一路向左压栈」',
        '层序是 BFS，用队列而非栈'
      ],
      excerpt: '别背三种遍历，记住「根在哪个位置被访问」就够了。',
      sourceName: '算法图解', sourceUrl: null,
      tags: ['算法'], status: 'archived', stage: 1,
      reviews: 1, due: false, shared: false, cover: null,
      createdAt: '1 周前'
    },
    {
      id: 'card-07', captureId: null,
      title: '间隔重复的实证效果：复习间隔应该如何递增',
      points: [
        '遗忘在最初 24 小时内最快，首次复习应安排在 1 天内',
        '间隔按 1 → 3 → 7 → 14 → 30 天递增，复习次数最少、留存最高',
        '每次成功提取都会拉长下一次的「遗忘临界点」',
        '「模糊」比「忘记」更适合安排在间隔中段，反馈信息更细'
      ],
      excerpt: '复习不是重复输入，而是在遗忘临界点附近的一次精准提取。',
      sourceName: '认知科学笔记', sourceUrl: null,
      tags: ['认知科学', '学习方法'], status: 'learning', stage: 1,
      reviews: 1, due: true, shared: false, cover: 'assets/cover-memory.jpg',
      createdAt: '昨天 08:00'
    },
    {
      id: 'card-08', captureId: null,
      title: '复利思维的三个被误解的边界条件',
      points: [
        '复利成立的前提是「本金不回撤」：中断一次即按新起点计算',
        '个人成长中的复利来自可积累的资产（技能/信誉），而非重复劳动',
        '收益率比本金重要：选「坡道长」的领域比「起点高」更重要',
        '时间维度上，复利曲线前期平坦——大多数放弃发生在拐点之前'
      ],
      excerpt: '复利的前半段是「看不到的」，这正是它被低估的原因。',
      sourceName: '思维模型集', sourceUrl: null,
      tags: ['思维模型'], status: 'learning', stage: 5,
      reviews: 5, due: false, nextLabel: '3 天后到期', shared: false, cover: null,
      createdAt: '2 周前'
    },
    {
      id: 'card-09', captureId: 'cap-06',
      title: '把复习搬进通勤的 40 分钟：一套可复制的碎片时间学习法',
      points: [
        '把「待复习卡片」绑定到固定通勤时段，用场景触发代替意志力',
        '复习队列控制在 15 张以内，超出的顺延，避免当日过载',
        '「模糊」的卡片单独标记，周末集中做一次二次加工（改写要点）',
        '连续打卡不是目的：漏掉一天后允许「顺延」而非重新开始，中断率反而下降'
      ],
      excerpt: '「记住」就前进一天，「模糊」就原地停一天，「忘记」就回到当天——规则简单到不会中途放弃。',
      sourceName: '小红书 · 一颗计划表', sourceUrl: 'https://www.xiaohongshu.example.com/explore/6f2a',
      tags: ['经验分享'], status: 'learning', stage: 0,
      reviews: 0, due: true, shared: false, cover: 'assets/cover-desk.jpg',
      createdAt: '今天 08:40'
    }
  ],

  /* 用户提交新内容时的 canned 分析结果（仅作旧数据兼容，正式链路不再使用演示兜底） */
  canned: {
    lowA: {
      value: 'not', contentType: 'AI 水文',
      reason: '全文为 AI 生成的泛化清单，无具体案例、数据或个人经验，信息密度低，要点彼此重复。',
      title: 'AI 时代你必须养成的十个习惯',
      points: [], excerpt: ''
    },
    lowB: {
      value: 'not', contentType: '营销推广',
      reason: '核心诉求是引导购买付费课程，正文为卖点罗列，缺乏可提炼的方法或事实。',
      title: '这篇公众号文章里藏着一个「限时优惠」',
      points: [], excerpt: ''
    },
    highA: {
      value: 'worth', contentType: '研究解读',
      reason: '引用认知科学对照实验数据，结论可直接用于改进学习与工作方式，信息密度高。',
      title: '为什么「收藏了」不等于「学会了」：检索练习的实证研究',
      points: [
        '「提取」（合上书回忆）本身是一次记忆强化，效果优于重复输入',
        '对照实验：测试组一周后留存率约为重复阅读组的 2 倍',
        '提取难度越高，记忆增益越大——难度是特性而非缺陷',
        '落地：自问自答、空白页默写、在遗忘临界点安排复习'
      ],
      excerpt: '记忆强度不取决于输入次数，而取决于提取次数。'
    },
    highB: {
      value: 'worth', contentType: '方法论',
      reason: '给出了完整可执行的方法闭环与反例边界，属于高信息密度的实践内容。',
      title: '费曼技巧不是「讲一遍」：完整闭环的四个步骤',
      points: [
        '讲授：用一张白纸把概念讲给「想象中的外行」',
        '暴露：卡壳处即理解缺口，逐一记录',
        '回源：只针对缺口回到原始材料定点补齐',
        '简化：能产出类比才算真正理解'
      ],
      excerpt: '说不出类比，说明只背住了术语。'
    }
  }
};
}

/* ---------------- 持久化（工单01）----------------
 * localStorage 单一存档：captures / cards / profile / ID 计数器全部随存档恢复。
 * 仅在没有任何存档（新用户）时初始化演示种子；已有记录则原样载入。
 * 任何 DB 变更后调用 DB.save() 落盘（api.js 各写操作与 app.js 编辑流程均会触发）。 */
const STORE_KEY = 'shiyi-db-v1';
function persistDB(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} }
function readRaw() {
  try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function loadDB() {
  const d = readRaw();
  if (d && Array.isArray(d.captures) && Array.isArray(d.cards) && d.canned) {
    if (!d.meta || typeof d.meta.idSeq !== 'number') d.meta = { idSeq: 100 };
    if (!d.profile) d.profile = { name: '阿拾', streakDays: 12 };
    return d;
  }
  const seed = seedDB();
  persistDB(seed);
  return seed;
}

const DB = loadDB();

/* ---------------- R2-01：多标签并发写入合并 ----------------
 * 旧实现整库 last-writer-wins：两个标签都开着首页时，后保存的标签会用
 * 自己的旧快照覆盖另一标签刚写入的收藏/卡片（QA 第二轮 P0）。
 * 现在每次保存前先与存储做按条目合并：
 *   · 本标签改过的条目 → 用本标签版本
 *   · 本标签没动、但存储里被别的标签改过的条目 → 用存储版本（评分不丢）
 *   · 快照里有、内存里没有的条目 → 本标签已删除 → 保持删除
 *   · 只有存储里有的新条目 → 其他标签新建 → 并入
 * ID 计数器始终取全局最大值，两个标签不会分出同一个 ID。 */
DB._snapC = {}; DB._snapK = {};
(function initSnap() {
  DB.captures.forEach(x => { DB._snapC[x.id] = JSON.stringify(x); });
  DB.cards.forEach(x => { DB._snapK[x.id] = JSON.stringify(x); });
})();
function reconcile(stored) {
  if (!stored || !Array.isArray(stored.captures) || !Array.isArray(stored.cards)) return false;
  let changed = false;
  const mergeCol = (memArr, storedArr, snap) => {
    const memById = {}; memArr.forEach(x => { memById[x.id] = x; });
    const finalById = {}; const out = [];
    storedArr.forEach(s => {
      const m = memById[s.id];
      if (m) {
        const iChanged = snap[m.id] !== JSON.stringify(m);
        const sChanged = snap[m.id] !== JSON.stringify(s);
        finalById[s.id] = (iChanged || !sChanged) ? m : s;
      } else {
        finalById[s.id] = snap[s.id] ? null : s;
      }
    });
    memArr.forEach(m => { if (!finalById.hasOwnProperty(m.id)) finalById[m.id] = m; });
    memArr.forEach(m => { const v = finalById[m.id]; if (v) out.push(v); });
    storedArr.forEach(s => { const v = finalById[s.id]; if (v && !memById[s.id]) out.push(v); });
    out.forEach(x => { snap[x.id] = JSON.stringify(x); });
    Object.keys(finalById).forEach(id => {
      if (!finalById[id]) delete snap[id];
    });
    if (out.length !== memArr.length || out.some((x, i) => memArr[i] !== x)) changed = true;
    return out;
  };
  const nc = mergeCol(DB.captures, stored.captures, DB._snapC);
  const nk = mergeCol(DB.cards, stored.cards, DB._snapK);
  if (stored.meta && typeof stored.meta.idSeq === 'number' && stored.meta.idSeq > DB.meta.idSeq) {
    DB.meta.idSeq = stored.meta.idSeq; changed = true;
  }
  if (changed) { DB.captures = nc; DB.cards = nk; }
  return changed;
}
DB.save = function () {
  let stored = null;
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) stored = JSON.parse(raw); } catch (e) {}
  reconcile(stored);
  persistDB({ profile: DB.profile, captures: DB.captures, cards: DB.cards, canned: DB.canned, meta: DB.meta });
};
window.addEventListener('storage', function (e) {
  if (e.key !== STORE_KEY || !e.newValue) return;
  let stored = null; try { stored = JSON.parse(e.newValue); } catch (err) { return; }
  if (reconcile(stored) && typeof render === 'function') { try { render(); } catch (err) {} }
});

/* 供 app.js 使用的公共查询 */
DB.dueCards = function () {
  return this.cards.filter(c => c.status === 'learning' && c.stage <= 5 && c.due);
};
DB.pendingCaptures = function () {
  return this.captures.filter(c => c.status === 'awaiting');
};
DB.cardById = function (id) { return this.cards.find(c => c.id === id); };
DB.captureById = function (id) { return this.captures.find(c => c.id === id); };
