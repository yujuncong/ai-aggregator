import { XMLParser } from "fast-xml-parser";
import type { CrawlItem, CrawlResult } from "../utils/types";
import { appendFailedLog, makeId } from "../utils/io";
import { cleanText, extractTags, stripHtml, summarize } from "../utils/summarize";
import { ECOMMERCE } from "../config";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; ai-radar-crawler)" };

async function fetchAtomEntries(url: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const xml = await res.text();
  const doc = new XMLParser({ ignoreAttributes: false }).parse(xml);
  const feed = (doc?.feed ?? doc?.rss?.channel ?? {}) as Record<string, unknown>;
  const entries = (feed.entry ?? feed.item ?? []) as
    | Record<string, unknown>[]
    | Record<string, unknown>;
  return Array.isArray(entries) ? entries : entries ? [entries] : [];
}

/** 从 Atom/RSS entry 里解析出外链 */
function linkOf(e: Record<string, unknown>): string {
  const l = e.link;
  if (typeof l === "string") return l;
  if (Array.isArray(l)) {
    const first = l[0] as Record<string, unknown>;
    const href = first?.["@_href"];
    if (typeof href === "string") return href;
    const linkText = first?.__text ?? first?.["#text"];
    return typeof linkText === "string" ? linkText : "";
  }
  const href = (l as Record<string, unknown>)?.["@_href"];
  return typeof href === "string" ? href : "";
}

/** PH 的 content 常带 "Vote | Discussion | Link" 导航，截掉以保留干净 tagline */
function cleanProductText(raw: unknown): string {
  let t = stripHtml(cleanText(raw));
  const m = t.match(/^(.*?)(?:\s+(?:Vote|Discussion|Link)\s*\|)/i);
  if (m) t = m[1];
  return t.trim();
}

/** 从 Atom/RSS 的 author 节点提取名字 */
function authorOf(e: Record<string, unknown>): string {
  const a = e.author;
  if (typeof a === "string") return a;
  const name = (a as Record<string, unknown> | undefined)?.name;
  return typeof name === "string" ? name : "Product Hunt";
}

export async function crawlEcommerce(): Promise<CrawlResult> {
  try {
    let entries: Record<string, unknown>[];
    try {
      entries = await fetchAtomEntries(ECOMMERCE.feed);
    } catch {
      // 主 feed 失败 → AI 专题 feed 兜底
      entries = await fetchAtomEntries(ECOMMERCE.topicFeed);
    }

    const kwRe = new RegExp(ECOMMERCE.keywords.join("|"), "i");
    const cutoff = Date.now() - ECOMMERCE.maxAgeDays * 864e5;
    const items: CrawlItem[] = [];

    for (const e of entries) {
      const title = cleanText(e.title);
      const content = cleanProductText(e.summary ?? e.content);
      if (!title || (!kwRe.test(title) && !kwRe.test(content))) continue;
      const url = linkOf(e);
      if (!url) continue;

      const postedAt = new Date(
        (e.published ?? e.updated) as string,
      ).toISOString();
      if (new Date(postedAt).getTime() < cutoff) continue;

      items.push({
        id: makeId("ecommerce", url),
        source: "ecommerce",
        url,
        title,
        summary: summarize(content),
        author: authorOf(e),
        postedAt,
        tags: extractTags(title, content),
      });
    }
    return { source: "ecommerce", items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendFailedLog("ecommerce", msg);
    return { source: "ecommerce", items: [], error: msg };
  }
}
