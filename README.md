# AI Radar · AI 资讯聚合站

每天 2 次自动从 **X（Twitter）/ AI 电商（Product Hunt）/ GitHub / Hugging Face / Skill 榜（DiscoverAISkills）** 多源抓取 AI 相关资讯，
落地为纯静态 JSON + 静态站点，自动部署到 **GitHub Pages**。

- 调度：GitHub Actions `cron 0 1,13 * * *`（UTC）= 北京时间 **9:00 / 21:00**
- 站点：Next.js 16 静态导出（`web/out/`），HN 风格卡片，暗色跟随系统
- 数据：`data/latest.json`（最近 7 天合并去重）+ `data/YYYY-MM-DD.json`（每日归档）
- 各源独立抓取，**任一源失败不阻塞其他源**，失败记录写 `crawlers/logs/*.failed`
- Hugging Face 分为**两个独立子榜**（通用模型 / 视频模型），互不合并
- 每个源父 tab 下都有独立的「本周最热」（近 7 天按热度降序）子榜；GitHub 子榜另有「Skill」子榜（AI 可复用专项能力），独立顶栏「Skill 榜」按 GitHub star 收录 DiscoverAISkills 热门技能，均为前端过滤

## 目录结构

```
ai-aggregator/
├── crawlers/                  # 纯 TS 抓取器（Node 24 内置 fetch）
│   ├── sources/{github,discover,ecommerce,x,huggingface}.ts   # 多源适配器（HF 含通用+视频两榜）
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
  "source": "x | ecommerce | github | hf | hf-video | discover",
  "url": "原始链接",
  "title": "标题",
  "summary": "1-2 行摘要（无 LLM，规则截断）",
  "author": "作者 / 产品名",
  "postedAt": "ISO 8601",
  "tags": ["ai", "agent", "..."]
}
```

## 数据筛选规则

| 源 | 规则（crawlers/config.ts 可调） |
|---|---|
| GitHub | **两档混合**：档1「本周质量榜」近 7 天创建且 star ≥ 100；档2「今日创新榜」当天创建且 star ≥ 10（带「今日创新」标签）。合并按 star 降序，每天封顶 30 条 |
| 电商 | 用 feed 的 `updated`（最近投票/评论活跃）算热度分 0-14，按热度降序 |
| X | 官方 search/recent（付费）→ 用户时间线 → RSSHub → Nitter，全失败则空 |
| HF 通用 | **双榜之一**：官方 `sort=trendingScore` 最热榜（trendingScore 已加权近期热度），取前 30 条，点赞数为热度分 |
| HF 视频 | **双榜之一**：8 类视频 pipeline（文生/图生/视频问答/视频编辑等）逐类抓 Trending 再合并，封顶 20 条。与通用榜**数据独立、互不合并**（同一模型可同时出现在两榜） |
| Skill 榜 | DiscoverAISkills `sort=stars` 按 GitHub star 降序取 Top 30（1 页），基础校验 name / 描述 / star > 0。卡片外链指向其详情页，star 数为热度分 |

> 说明：HF 的 `sort=createdAt` 纯最新榜前 100 名几乎全是 0 赞/0 下载的裸上传，故「最新最热」以官方 Trending 为准。

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
