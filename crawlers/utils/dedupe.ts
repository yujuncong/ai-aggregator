import fs from "node:fs/promises";
import path from "node:path";
import type { CrawlItem } from "./types";

/**
 * 按 source+url 去重，保留先出现的。
 * 键含 source：同一模型若同时出现在 HF 通用榜与视频榜，两榜互不合并（要求独立展示）。
 */
export function dedupeByUrl(items: CrawlItem[]): CrawlItem[] {
  const seen = new Set<string>();
  const out: CrawlItem[] = [];
  for (const it of items) {
    const key = `${it.source}|${it.url}`;
    if (!it.url || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/** 读取最近 days 天的每日归档（含今天），跨日期按 url 合并去重 */
export async function loadRecentEnvelopes(
  dataDir: string,
  days: number,
): Promise<CrawlItem[]> {
  const items: CrawlItem[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const file = path.join(dataDir, `${d}.json`);
    try {
      const env = JSON.parse(await fs.readFile(file, "utf-8")) as {
        items?: CrawlItem[];
      };
      if (Array.isArray(env.items)) items.push(...env.items);
    } catch {
      /* 当日无文件则跳过 */
    }
  }
  // 合并后统一按发布时间倒序（最新在前）
  return dedupeByUrl(items).sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  );
}
