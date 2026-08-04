import fs from "node:fs/promises";
import path from "node:path";
import type { CrawlItem } from "./types";

/** 按 url 去重，保留先出现的 */
export function dedupeByUrl(items: CrawlItem[]): CrawlItem[] {
  const seen = new Set<string>();
  const out: CrawlItem[] = [];
  for (const it of items) {
    if (!it.url || seen.has(it.url)) continue;
    seen.add(it.url);
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
  return dedupeByUrl(items);
}
