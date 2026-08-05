import path from "node:path";

/** 仓库根目录（crawler 从根目录用 tsx 运行，cwd = repo root） */
export const REPO_ROOT = process.cwd();
export const DATA_DIR = path.join(REPO_ROOT, "data");

/** latest.json 合并最近多少天的每日归档 */
export const MERGE_DAYS = 7;

export const GITHUB = {
  /** 搜索关键词（每个占一次 search API 调用）；claude skill 专门捞 AI 技能仓库 */
  queries: ["ai agent", "llm", "claude", "claude skill"],
  /** 档1「本周质量榜」：近 N 天内创建 */
  createdDays: 7,
  /** 档1 最低 star（已获认可的质量门槛） */
  minStars: 100,
  perQuery: 30,
  /** 档2「今日创新榜」：当天创建的最低 star（新仓库 star 普遍偏低） */
  todayMinStars: 10,
  /** 每天总封顶条数 */
  maxItems: 30,
};

export const ECOMMERCE = {
  /** 主 feed（实测可用） */
  feed: "https://www.producthunt.com/feed",
  /** AI 专题 feed 兜底（实测被 Cloudflare 拦截，仅作 fallback） */
  topicFeed: "https://www.producthunt.com/topics/artificial-intelligence/feed",
  /** 命中任一关键词即视为 AI 相关 */
  keywords: [
    "ai", "gpt", "claude", "agent", "llm", "copilot", "chatbot",
    "machine learning", "artificial intelligence",
  ],
  /** 发布时间超过该天数则丢弃，保持列表新鲜 */
  maxAgeDays: 30,
};

export const X = {
  /** 关注的高频 AI 账号（无 token 的 RSSHub/Nitter 轮询目标） */
  accounts: [
    "OpenAI", "AnthropicAI", "GoogleDeepMind", "huggingface",
    "mistralai", "karpathy", "sama", "levelsio",
  ],
  rsshubInstances: ["rsshub.app", "rsshub.rssforever.com"],
  nitterMirrors: ["nitter.privacyredirect.com", "nitter.net"],
  maxItems: 20,
};

/**
 * Hugging Face：两块独立榜单，互不合并。
 * 榜①通用模型：HF 官方 Trending（trendingScore 已加权近期热度 = 最热最新）。
 * 榜②视频模型：按视频 pipeline 逐个抓 Trending 再合并（HF API 多个 filter 是 AND，无法一次取并集）。
 * 注：sort=createdAt 前 100 名几乎全是 0 赞/0 下载的裸上传，不直接用作「最新」来源。
 */
export const HUGGINGFACE = {
  api: "https://huggingface.co/api/models",
  /** 通用榜：Trending 取多少条 */
  trendingLimit: 30,
  /** 通用榜封顶 */
  maxItems: 30,
  /** 视频相关 pipeline（命中任一即算视频，逐类抓取） */
  videoPipelines: [
    "text-to-video",
    "image-to-video",
    "image-text-to-video",
    "video-to-video",
    "video-editing",
    "video-text-to-text",
    "video-to-text",
    "video-classification",
  ],
  /** 每类视频 pipeline 各取 Trending 前多少条 */
  perPipelineLimit: 8,
  /** 视频榜封顶 */
  videoMaxItems: 20,
};

/**
 * DiscoverAISkills：AI 技能榜（按 GitHub star 排序）。
 * 注：robots.txt 禁止 /api/，但每天 2 次 × 1 页低频抓取，可接受。
 */
export const DISCOVERAISKILLS = {
  /** 技能列表 API */
  api: "https://discoveraiskills.com/api/skills",
  /** 按 GitHub star 降序 */
  sort: "stars",
  /** 每页固定 30 条（limit 参数被忽略，不传） */
  pageSize: 30,
  /** 取前几页；默认 1 = Top-30，与 GitHub/HF 通用榜量级一致，最小化 /api/ 请求 */
  pages: 1,
  /** 封顶条数 */
  maxItems: 30,
};
