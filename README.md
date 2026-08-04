# AI Radar · AI 资讯聚合站

每天 2 次自动从 **X（Twitter）/ AI 电商（Product Hunt）/ GitHub** 三大源抓取 AI 相关资讯，
落地为纯静态 JSON + 静态站点，自动部署到 **GitHub Pages**。

- 调度：GitHub Actions `cron 0 1,13 * * *`（UTC）= 北京时间 **9:00 / 21:00**
- 站点：Next.js 16 静态导出（`web/out/`），HN 风格卡片，暗色跟随系统
- 数据：`data/latest.json`（最近 7 天合并去重）+ `data/YYYY-MM-DD.json`（每日归档）
- 三源独立抓取，**任一源失败不阻塞其他源**，失败记录写 `crawlers/logs/*.failed`

## 目录结构

```
ai-aggregator/
├── crawlers/                  # 纯 TS 抓取器（Node 24 内置 fetch）
│   ├── sources/{github,ecommerce,x}.ts   # 三源适配器
│   ├── utils/                 # 去重 / 摘要 / IO / 时间
│   └── index.ts               # 编排入口
├── web/                       # Next.js 16 静态站
│   └── src/app + components   # 首页 / 卡片 / tab 筛选 / 暗色
├── data/                      # 生成的 JSON（提交进 git）
└── .github/workflows/crawl.yml
```

## 本地运行

```bash
npm install            # 根依赖
npm --prefix web install

npm run crawl:dry      # 抓取（dry 模式，会写 data/）
npm run build          # 构建静态站到 web/out/
npm run preview        # 本地预览 http://localhost:4173
```

## 数据契约

每条记录：

```json
{
  "id": "sha1(source+url) 前 12 位",
  "source": "x | ecommerce | github",
  "url": "原始链接",
  "title": "标题",
  "summary": "1-2 行摘要（无 LLM，规则截断）",
  "author": "作者 / 产品名",
  "postedAt": "ISO 8601",
  "tags": ["ai", "agent", "..."]
}
```

## 配置

**线上（GitHub Actions）**通过仓库 Secrets 注入，可用 `gh secret set <NAME> -R yujuncong/ai-aggregator` 配置：

| Secret | 必填 | 说明 |
|---|---|---|
| `GH_TOKEN` | 建议 | GitHub PAT，搜索 API 限额 60/h → 5000/h；不填也能跑 |
| `X_API_BEARER` | 可选 | X 官方 API Bearer Token；**不填则 X 源自动跳过**，站点 X tab 显示空态提示 |

**本地开发**：把 `.env.example` 复制为 `.env` 填写即可（`.env` 已在 .gitignore，不会提交；crawler 启动时自动读取）：

## X 源说明（重要）

2026 年起 X 的免费抓取路径已全部被墙（Nitter 人机验证、syndication 空返回、RSSHub 公共实例不可用）。
本项目对 X 源采用**尽力而为 + 优雅降级**策略：

1. 有 `X_API_BEARER` → 官方 API v2 搜索（唯一可靠路径）；
2. 否则依次尝试 RSSHub 公共实例 → Nitter 镜像（自动识别并跳过人机验证墙）；
3. 全部失败 → 写 `crawlers/logs/x.failed`，返回空，**不阻塞其他源**。

站点始终保留 X tab 与黑底徽章样式，数据为空时展示启用提示。

## 部署

1. 推送代码到 GitHub 仓库
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**
3. 添加上述 Secrets
4. Actions 里手动触发 `Crawl & Build` 一次，之后每天 2 次自动跑
