import { XMLParser } from "fast-xml-parser";
import type { CrawlItem, CrawlResult } from "../utils/types";
import { appendFailedLog, makeId } from "../utils/io";
import { cleanText, extractTags, summarize } from "../utils/summarize";
import { X } from "../config";

const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

/** 识别 Anubis/Cloudflare 等人机验证墙页面 */
function isBotWall(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("not a bot") ||
    t.includes("anubis") ||
    t.includes("proof of work") ||
    t.includes("just a moment")
  );
}

interface Tweet {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
}

function parseRssEntries(entries: unknown, author: string): CrawlItem[] {
  const arr = Array.isArray(entries)
    ? entries
    : entries
      ? [entries]
      : [];
  return arr
    .map((e) => e as Record<string, unknown>)
    .map((e) => {
      const title = cleanText(e.title);
      const url = typeof e.link === "string" ? e.link : "";
      if (!title || !url) return null;
      const postedAt = new Date((e.pubDate ?? e.published) as string);
      return {
        id: makeId("x", url),
        source: "x",
        url,
        title: summarize(title, 120),
        summary: summarize(title),
        author,
        postedAt: postedAt.toISOString(),
        tags: extractTags(title),
      } as CrawlItem;
    })
    .filter((x): x is CrawlItem => x !== null);
}

/** 策略 1：官方 API v2（需 X_API_BEARER secret） */
async function viaBearer(): Promise<CrawlItem[]> {
  const bearer = process.env.X_API_BEARER;
  if (!bearer) return [];
  const query = encodeURIComponent(
    '(AI OR "artificial intelligence" OR agent OR LLM) -is:retweet lang:en',
  );
  const url =
    `https://api.twitter.com/2/tweets/search/recent?query=${query}` +
    "&max_results=100&tweet.fields=created_at,author_id";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer}`, "User-Agent": "ai-radar" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`X API HTTP ${res.status}`);
  const body = (await res.json()) as {
    data?: Tweet[];
    includes?: { users?: { id: string; username: string }[] };
  };
  const users = new Map(
    (body.includes?.users ?? []).map((u) => [u.id, u.username]),
  );
  return (body.data ?? [])
    .map((t) => {
      const author = users.get(t.author_id) ?? t.author_id;
      const text = cleanText(t.text);
      return {
        id: makeId("x", `https://x.com/${author}/status/${t.id}`),
        source: "x",
        url: `https://x.com/${author}/status/${t.id}`,
        title: summarize(text, 120),
        summary: summarize(text),
        author,
        postedAt: t.created_at ?? new Date().toISOString(),
        tags: extractTags(text),
      } as CrawlItem;
    });
}

/**
 * 策略 1b：用户时间线（Free 计划通常可用，替代付费的 search/recent）。
 * 轮询关注账号的最新推文，聚合为资讯。
 */
async function viaTimeline(bearer: string): Promise<CrawlItem[]> {
  const headers = { Authorization: `Bearer ${bearer}`, "User-Agent": "ai-radar" };
  const items: CrawlItem[] = [];
  for (const account of X.accounts) {
    try {
      const lookup = await fetch(
        `https://api.twitter.com/2/users/by/username/${account}`,
        { headers, signal: AbortSignal.timeout(20_000) },
      );
      // 402/401/403 = 计划或权限不含该接口，整个时间线方案不可用，提前放弃
      if (lookup.status === 402 || lookup.status === 401 || lookup.status === 403) {
        return items;
      }
      if (!lookup.ok) continue;
      const uid = ((await lookup.json()) as { data?: { id: string } })?.data?.id;
      if (!uid) continue;

      const turl =
        `https://api.twitter.com/2/users/${uid}/tweets` +
        `?max_results=100&exclude=retweets&tweet.fields=created_at`;
      const tres = await fetch(turl, { headers, signal: AbortSignal.timeout(20_000) });
      if (tres.status === 402 || tres.status === 401 || tres.status === 403) {
        return items;
      }
      if (!tres.ok) continue;
      const body = (await tres.json()) as { data?: { id: string; text: string; created_at: string }[] };

      for (const t of body.data ?? []) {
        const text = cleanText(t.text);
        if (!text) continue;
        items.push({
          id: makeId("x", `https://x.com/${account}/status/${t.id}`),
          source: "x",
          url: `https://x.com/${account}/status/${t.id}`,
          title: summarize(text, 120),
          summary: summarize(text),
          author: account,
          postedAt: t.created_at ?? new Date().toISOString(),
          tags: extractTags(text),
        } as CrawlItem);
      }
    } catch {
      /* 单个账号失败不阻塞 */
    }
    if (items.length >= X.maxItems) break;
  }
  return items;
}

/** 策略 2：RSSHub 公共实例 twitter/user/<账号> */
async function viaRsshub(account: string): Promise<CrawlItem[]> {
  for (const inst of X.rsshubInstances) {
    try {
      const res = await fetch(`https://${inst}/twitter/user/${account}`, {
        headers: UA,
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (isBotWall(xml) || !xml.trim().startsWith("<")) continue;
      const doc = new XMLParser({ ignoreAttributes: false }).parse(xml);
      const items = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
      const parsed = parseRssEntries(items, account);
      if (parsed.length) return parsed;
    } catch {
      /* 换下一个实例 */
    }
  }
  return [];
}

/** 策略 3：Nitter 镜像 /<账号>/rss（已实测多数被人机验证墙拦住） */
async function viaNitter(account: string): Promise<CrawlItem[]> {
  for (const mirror of X.nitterMirrors) {
    try {
      const res = await fetch(`https://${mirror}/${account}/rss`, {
        headers: UA,
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (isBotWall(xml) || !xml.trim().startsWith("<")) continue;
      const doc = new XMLParser({ ignoreAttributes: false }).parse(xml);
      const items = doc?.rss?.channel?.item ?? [];
      const parsed = parseRssEntries(items, account);
      if (parsed.length) return parsed;
    } catch {
      /* 换下一个镜像 */
    }
  }
  return [];
}

export async function crawlX(): Promise<CrawlResult> {
  try {
    const bearer = process.env.X_API_BEARER;
    if (bearer) {
      // 策略 1：官方 search/recent（需付费计划，返回 402 时自动降级）
      try {
        const items = await viaBearer();
        if (items.length) return { source: "x", items };
      } catch (searchErr) {
        console.error(
          `[x] search/recent 不可用（${searchErr instanceof Error ? searchErr.message : searchErr}），尝试用户时间线`,
        );
      }
      // 策略 1b：用户时间线（Free 计划可能可用）
      const timeline = await viaTimeline(bearer);
      if (timeline.length) return { source: "x", items: timeline };
    }

    // 策略 2/3：RSSHub / Nitter（无 token 或官方 API 全不可用时兜底）
    const items: CrawlItem[] = [];
    for (const account of X.accounts) {
      let got = await viaRsshub(account);
      if (!got.length) got = await viaNitter(account);
      items.push(...got);
      if (items.length >= X.maxItems) break;
    }
    if (!items.length) {
      throw new Error(
        bearer
          ? "X 官方 API 不可用（search/recent 需付费，用户时间线亦失败）"
          : "无可用 X 通道（无 X_API_BEARER，RSSHub/Nitter 均不可达或被墙）",
      );
    }
    return { source: "x", items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendFailedLog("x", msg);
    return { source: "x", items: [], error: msg };
  }
}
