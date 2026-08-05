import type { CrawlItem, CrawlResult } from "../utils/types";
import { appendFailedLog, makeId } from "../utils/io";
import { cleanText, summarize } from "../utils/summarize";
import { DISCOVERAISKILLS } from "../config";

/** DiscoverAISkills API 返回的 skill 条目（只取本源用到的字段） */
interface DiscoverSkill {
  name: string | null;
  nameCn: string | null;
  slug: string;
  description: string | null;
  starCount: number;
  updatedAt: string | null;
  category: { name: string } | null;
  tags: { tag: { name: string } }[];
}

/** 抓取第 page 页，返回该页 skill 列表 */
async function fetchPage(page: number): Promise<DiscoverSkill[]> {
  const params = new URLSearchParams({ sort: DISCOVERAISKILLS.sort });
  if (page > 1) params.set("page", String(page));
  const url = `${DISCOVERAISKILLS.api}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-radar-crawler)" },
    signal: AbortSignal.timeout(30_000),
  });

  if (res.status === 403 || res.status === 429 || res.status === 503) {
    throw new Error(`DiscoverAISkills rate limited (status=${res.status})`);
  }
  if (res.status !== 200) throw new Error(`DiscoverAISkills HTTP ${res.status}`);

  const body = (await res.json()) as { skills?: DiscoverSkill[] };
  return body.skills ?? [];
}

function toItem(s: DiscoverSkill): CrawlItem | null {
  const name = (s.nameCn || s.name || "").trim();
  const desc = cleanText(s.description);
  // 基础校验：有名称、有描述、star 数 > 0
  if (!name || !desc || (s.starCount ?? 0) <= 0) return null;
  const slug = s.slug;
  if (!slug) return null;

  const url = `https://discoveraiskills.com/skills/${encodeURIComponent(slug)}`;

  // 时间：API 无真实发布时间，用 updatedAt（入库/更新），解析失败回退当前时间
  const updated = new Date(s.updatedAt ?? "");
  const postedAt = Number.isNaN(updated.getTime())
    ? new Date().toISOString()
    : updated.toISOString();

  const category = s.category?.name;
  const tags = new Set<string>();
  for (const t of s.tags ?? []) {
    const n = t.tag?.name;
    if (n) tags.add(n.toLowerCase());
  }
  if (category) tags.add(category.toLowerCase());
  const tagArr = [...tags].slice(0, 5);

  return {
    id: makeId("discover", url),
    source: "discover",
    url,
    title: name,
    summary: summarize(desc),
    author: category ?? "",
    postedAt,
    tags: tagArr,
    score: s.starCount,
  };
}

export async function crawlDiscoverAiSkills(): Promise<CrawlResult> {
  try {
    const pages = Math.max(1, DISCOVERAISKILLS.pages);
    const all: CrawlItem[] = [];
    for (let p = 1; p <= pages; p++) {
      // 首页失败直接抛出（触发外层 catch 记录失败日志）；后续页失败静默跳过
      const skills = await fetchPage(p).catch((e) => {
        if (p === 1) throw e;
        return [] as DiscoverSkill[];
      });
      for (const s of skills) {
        const it = toItem(s);
        if (it) all.push(it);
      }
    }

    // 源内按 url 去重，按 star 降序，封顶
    const seen = new Set<string>();
    const items = all.filter((it) => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });
    items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return {
      source: "discover",
      items: items.slice(0, DISCOVERAISKILLS.maxItems),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendFailedLog("discover", msg);
    return { source: "discover", items: [], error: msg };
  }
}
