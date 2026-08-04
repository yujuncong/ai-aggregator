import path from "node:path";

/** 仓库根目录（crawler 从根目录用 tsx 运行，cwd = repo root） */
export const REPO_ROOT = process.cwd();
export const DATA_DIR = path.join(REPO_ROOT, "data");

/** latest.json 合并最近多少天的每日归档 */
export const MERGE_DAYS = 7;

export const GITHUB = {
  /** 搜索关键词（每个占一次 search API 调用） */
  queries: ["ai agent", "llm", "claude"],
  /** 创建时间窗口（天）：当日新仓库 star 普遍偏低，放宽到 7 天更有内容 */
  createdDays: 7,
  /** 低于该 stars 数的仓库过滤掉 */
  minStars: 10,
  perQuery: 30,
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
