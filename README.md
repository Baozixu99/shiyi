# 拾忆（ShiYi）· 收藏 ≠ 掌握

一个「丢入内容 → AI 判定价值 → 沉淀记忆卡片 → 间隔复习」的个人知识工具。
纯静态前端（vanilla JS）+ 零依赖 Node 服务（静态托管 + 加固 AI 通道）。

- **线上地址**：https://37ljkvjqby7ib89amxv.traesite.cn
- **当前版本**：v1.6.3（版本历史见 `docs/拾忆-测试报告.html` 的 changelog）

## 目录结构

```
├── app/                  # 前端源码（index.html / styles.css / mock.js / api.js / app.js / assets/）
├── server/               # 部署服务（server.js 零依赖：静态托管 + /api/fetch + /api/llm；public/ 为 app 的构建拷贝）
├── build/                # 部署打包暂存区（每次部署自动重建，勿手工改）
├── docs/
│   ├── 拾忆-PRD.html          # 产品需求文档
│   ├── 拾忆-测试报告.html      # 测试报告 + 全量 changelog（每轮迭代更新）
│   ├── 拾忆-V2报告预览.html    # 历史预览页
│   ├── qa/第一轮交接包/        # 第一轮 QA 清单 + 截图证据（16 项工单）
│   ├── qa/第二轮交接包/        # 第二轮复测清单 + 截图证据（R2-01~06）
│   └── notes/                 # 排查记录（微信反爬诊断等）
├── tools/
│   ├── proxy.py               # 本地开发代理（静态 + /api 转发，备用）
│   └── v4-debug.py            # 提示词调试脚本
├── secrets.local.json          # ⚠️ 模型密钥（敏感：勿提交、勿外传、勿放入 app/）
└── README.md
```

## 本地运行

方式一（推荐，与线上同构）：

```powershell
cd server
$env:PORT='8745'
$env:SHIYI_API_KEY='<secrets.local.json 中的 apiKey>'
$env:SHIYI_MODEL='deepseek-v4.1-flash'
$env:SHIYI_BASE_URL='<secrets.local.json 中的 baseUrl>'
node server.js
# 打开 http://localhost:8745
```

方式二（备用）：`python tools/proxy.py 8743`，改用 `server/public` 以外的源码目录时需自行同步静态文件。

> 修改 `app/` 后需同步到 `server/public/` 再刷新页面（本地服务托管的是 public 拷贝）。

## 部署

打包暂存区 `build/`（server.js + package.json + build.sh + run.sh + exec-config.json + public/），
通过 trae-deploy CLI 部署到 FunctionWeb 站点 `37ljkvjqby7ib89amxv`（site-id）。
密钥经 exec-config 的 runtime.environment 注入，绝不进入前端代码。

## 数据与持久化

- 用户数据存于浏览器 `localStorage`（`shiyi-db-v1`：收藏/卡片/ID 计数器；`shiyi-review-v1`：复习轮次）。
- 多标签并发写入按条目合并（见 mock.js 的 reconcile），ID 计数器全局同步。
- 服务端不落盘、无账号体系。

## 测试与回归

每轮迭代的验收标准、样本材料与截图证据见 `docs/qa/`；整体回归口径与版本历史见 `docs/拾忆-测试报告.html`。
实验室页（导航「对比实验」）右下显示当前构建号，用于对应每次发布。
