import path from "node:path";
import { crawlEcommerce } from "./sources/ecommerce";
import { crawlGithub } from "./sources/github";
import { crawlX } from "./sources/x";
import { DATA_DIR, MERGE_DAYS } from "./config";
import { loadRecentEnvelopes, dedupeByUrl } from "./utils/dedupe";
import { appendFailedLog, writeJson } from "./utils/io";
import { todayISO } from "./utils/time";
import type { CrawlItem } from "./utils/types";

const dry = process.argv.includes("--dry");

async function main(): Promise<void> {
  // 三源并行，单源失败不阻塞其他源
  const results = await Promise.allSettled([
    crawlGithub(),
    crawlEcommerce(),
    crawlX(),
  ]);

  const perSource: { source: string; count: number; error?: string }[] = [];
  const all: CrawlItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      perSource.push({
        source: r.value.source,
        count: r.value.items.length,
        error: r.value.error,
      });
      all.push(...r.value.items);
    } else {
      perSource.push({ source: "unknown", count: 0 });
    }
  }

  // 按 url 去重（含跨源），保证契约字段兜底
  const items = dedupeByUrl(all);
  for (const it of items) {
    if (!it.tags.length) it.tags = ["ai"];
    if (!it.summary) it.summary = "…";
  }

  const generatedAt = new Date().toISOString();
  const date = todayISO();
  const daily = { generatedAt, count: items.length, items };

  // 1) 当日归档
  await writeJson(path.join(DATA_DIR, `${date}.json`), daily);
  // 2) latest.json = 最近 N 天跨日期合并去重
  const recent = await loadRecentEnvelopes(DATA_DIR, MERGE_DAYS);
  const latest = { generatedAt, count: recent.length, items: recent };
  await writeJson(path.join(DATA_DIR, "latest.json"), latest);

  // 汇总输出
  console.log(`[crawl] ${generatedAt}`);
  for (const s of perSource) {
    console.log(
      `  ${s.source}: ${s.count} 条${s.error ? `（降级: ${s.error}）` : ""}`,
    );
  }
  console.log(`  今日去重后 ${items.length} 条 → data/${date}.json`);
  console.log(`  合并近 ${MERGE_DAYS} 天 ${latest.count} 条 → data/latest.json`);

  if (dry) {
    console.log("\n[--dry] 样本（最多 3 条）:");
    for (const it of items.slice(0, 3)) {
      console.log(`  [${it.source}] ${it.title} — ${it.url}`);
    }
  }
}

main().catch(async (e) => {
  const msg = e instanceof Error ? e.stack ?? e.message : String(e);
  console.error("[crawl] 致命错误:", msg);
  await appendFailedLog("index", msg);
  process.exit(1);
});
