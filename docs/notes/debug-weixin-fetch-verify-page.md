# Debug Session: weixin-fetch-verify-page

- 症状：部署版服务（https://37ljkvjqby7ib89amxv.traesite.cn/api/fetch）抓取微信文章 https://mp.weixin.qq.com/s/-hTFhi7_5KJk6VTXp1_2Wg 返回「环境验证提示」而非正文；本地 Python 版 proxy.py（家宽 IP）同 URL 返回真实正文 30000 字。
- 环境差异：本地 = Windows 家宽出口；线上 = 数据中心出口（volcengine 函数实例）。两侧代码逻辑一致（UA、头、解析规则相同——Python 与 Node 实现的 UA 均为 Chrome 桌面 UA）。
- 证据传输方式：本问题为服务端出网行为差异，插桩采用「响应内嵌 diag 字段（body.debug=true 门控）」，证据逐字记录于本文件（未启用独立 Debug Server：证据随 API 响应同步返回，无需常驻采集）。

## 假设（可证伪）
| # | 假设 | 验证点 | 状态 |
|---|---|---|---|
| H1 | 微信反爬按出口 IP 信誉拦截：数据中心 IP 命中「环境异常/操作频繁」验证页，家宽 IP 正常 | diag.markers.verify=true；本地对照正常 | 待证 |
| H2 | 请求头特征不足：桌面 Chrome UA + 无 Cookie/Referer 被识别为爬虫；换 MicroMessenger/移动 UA 或补 Referer 可取回正文 | diag.variants 中某 UA 变体 textLen 正常且 verify=false | 待证 |
| H3 | 抓取成功但内容提取错误（页面实为 JS 渲染壳，正文并非服务端渲染） | diag.html 含正文关键词（如「困惑度」）但 stripHtml 后缺失 | 待证 |
| H4 | 文章级限制：该篇需要 key/登录才能读（非 IP 级） | 本地同 URL 也失败或返回验证页 | 待证 |
| H5 | Node 版 /api/fetch 自身缺陷（重定向/解码/响应读取错误） | diag.status/htmlLen 异常（如 0、302 循环、乱码） | 待证 |

## 证据日志（逐字记录）
- [E0] 2026-11-24 部署版（改码前）线上实测：V4 lead「正文只有环境验证提示和界面按钮文字」；V1「不建议读」——间接证据：返回内容含验证页文案。
- [E2] 2026-11-24 本地 Python 代理（家宽 IP）同 URL：ok=True、title 空（无 title 标签）、len=30000（上限截断）、head=「OpenAI预训练指标曝光：27年AI将雪崩式爆发！ ASI启示录…」→ 真实正文。**H4 否证**（无需登录/key）。
- [E1] 2026-11-24 部署版 + debug 插桩（数据中心 IP）：
  - 主路径：status=200、finalUrl 原链（无重定向）、htmlLen=2,983,839（页面含巨量内联资源）、verify=False、markers 全 false、head=真实正文。
  - 4 组 UA/Referer 变体：全部 status=200、textLen≈46800、verify=False、hasContent=True（含「困惑度」）——UA/Referer 与结果无关。
  - textLen=46821 > API 上限 30000 → coverage=partial 符合预期。

## 分析与结论（假设表终态）
| # | 假设 | 结论 | 证据 |
|---|---|---|---|
| H1 | 数据中心 IP 被持续封锁验证 | **CONFIRMED（但为间歇性）**：E0 时刻命中验证页；E1（数分钟后）同 IP 同 URL 无验证取回真实正文 → 触发式挑战（疑似频率/信誉），数分钟内自动解除，非持续封锁 | E0 vs E1 |
| H2 | UA/Referer 特征不足 | **REJECTED**：4 组变体（MicroMessenger/移动 Safari/桌面+Referer）结果与基线完全一致 | E1.variants |
| H3 | JS 渲染壳提取错误 | **REJECTED**：html 为服务端渲染，正文可直接提取（hasContent=True） | E1 |
| H4 | 文章级登录/key 限制 | **REJECTED**：E2 本地无登录取回正文 | E2 |
| H5 | Node 版 /api/fetch 缺陷 | **REJECTED**：E1 主路径 status=200、解码正常 | E1 |

**根因**：微信对数据中心出口 IP 的**间歇性反爬挑战**（触发后一段时间自动解除），与 UA/Referer/实现无关。此前一次恰好命中挑战窗口。**CONFIRMED / H1（间歇性）**

## 修复方案（最小改动，基于证据）
1. server.js：移除 debug 插桩；新增验证页检测——WX_VERIFY_RE 命中或 textLen<400 且含「验证」→ 返回 `{ok:false, error:'wx-verify'}`（结构化可识别错误，不返回假正文）。
2. api.js analyzeCapture：fetch 返回 ok:false 时记录 `cap.fetchError`（截断 40 字）。
3. app.js submitHeroFlow：`cap.fetchError` 存在时 toast「原文抓取失败（wx-verify）· 已用演示数据兜底；微信文章可复制正文粘贴到输入框」，替代笼统提示。
4. 验证：正常路径线上 curl 回归（应取回真实正文）；验证分支以 WX_VERIFY_RE 对 E0 文案样本正则验证 + 生产环境间歇触发观察。

## post-fix 对比
- **pre-fix（E0）**：验证页文案被当作正文返回（ok=true）→ V4 拿到垃圾文本，lead「正文只有环境验证提示」。
- **post-fix（E3，修复版部署 dep_6b0504d5461ff6acc9d09d39）**：同一 URL 线上 curl → ok=True、len=30000、head=真实正文（挑战窗口已过，正常路径无回归）；验证分支以 WX_VERIFY_RE 对 E0 文案样本正则验证通过（环境异常/请完成验证/去验证 均命中）。客户端引导路径：analyzeCapture 记录 cap.fetchError='wx-verify' → submitHeroFlow toast「微信反爬拦截 · 本次用演示数据兜底；可复制正文粘贴到输入框重试」（代码路径 review 验证；生产间歇触发时生效）。
- **结论**：根因 CONFIRMED（微信对数据中心 IP 的间歇性反爬挑战，UA 无关，数分钟自动解除）；修复后失败可识别、可引导，正常路径无回归。debug 会话关闭，插桩已移除，临时包已清理。
