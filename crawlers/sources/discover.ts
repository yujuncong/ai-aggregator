import type { CrawlItem, CrawlResult } from "../utils/types";
import { appendFailedLog, makeId } from "../utils/io";
import { cleanText, extractTags, summarize } from "../utils/summarize";
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

/** 浏览器 UA：DiscoverAISkills 的 Cloudflare 对非浏览器 UA / 数据中心 IP 更严格 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** 抓取第 page 页；403/429/503 时重试（间隔 2s，最多 3 次） */
async function fetchPage(page: number): Promise<DiscoverSkill[]> {
  const params = new URLSearchParams({ sort: DISCOVERAISKILLS.sort });
  if (page > 1) params.set("page", String(page));
  const url = `${DISCOVERAISKILLS.api}?${params.toString()}`;
  const headers = {
    "User-Agent": BROWSER_UA,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    Referer: "https://discoveraiskills.com/",
  };
  const signal = AbortSignal.timeout(30_000);

  let last: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(url, { headers, signal });
      if (res.status === 403 || res.status === 429 || res.status === 503) {
        last = new Error(`DiscoverAISkills rate limited (status=${res.status})`);
        continue;
      }
      if (res.status !== 200) throw new Error(`DiscoverAISkills HTTP ${res.status}`);
      const body = (await res.json()) as { skills?: DiscoverSkill[] };
      return body.skills ?? [];
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
      if (attempt >= 2) break;
    }
  }
  throw last ?? new Error("DiscoverAISkills fetch failed");
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

  return {
    id: makeId("discover", url),
    source: "discover",
    url,
    title: name,
    summary: summarize(desc),
    author: category ?? "",
    postedAt,
    tags: [...tags].slice(0, 5),
    score: s.starCount,
  };
}

/**
 * 回退：主 API 在数据中心 IP（如 GitHub Actions）可能被 Cloudflare 拦（403）。
 * 改用 GitHub 官方 search API 按 claude-skills / agent-skills topic 按 star 排序，
 * 数据口径更真实，且在 Actions 有 GH_TOKEN 不受限流。
 * 注：GitHub search 不支持 topic 限定符之间的 OR，需逐个 topic 查询再合并。
 */
async function fetchGithubFallback(): Promise<CrawlItem[]> {
  const token = process.env.GH_TOKEN;
  const headers: Record<string, string> = {
    "User-Agent": "ai-radar-crawler",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const topics = ["claude-skills", "agent-skills"];
  const seen = new Set<string>();
  const items: CrawlItem[] = [];
  for (const topic of topics) {
    const url =
      `https://api.github.com/search/repositories?q=topic:${topic}` +
      `&sort=stars&order=desc&per_page=20`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    if (res.status === 403 || res.status === 429) {
      throw new Error(`GitHub fallback rate limited (status=${res.status})`);
    }
    if (res.status === 422) continue; // topic 不存在，跳过
    if (res.status !== 200) throw new Error(`GitHub fallback HTTP ${res.status}`);

    const body = (await res.json()) as {
      items?: {
        full_name: string;
        html_url: string;
        description: string | null;
        stargazers_count: number;
        created_at: string;
        topics: string[];
      }[];
    };
    for (const r of body.items ?? []) {
      if (seen.has(r.html_url)) continue;
      seen.add(r.html_url);
      const desc = cleanText(r.description);
      if (!desc) continue;
      const tags = extractTags(desc, (r.topics ?? []).join(" ")).slice(0, 5);
      items.push({
        id: makeId("discover", r.html_url),
        source: "discover",
        url: r.html_url,
        title: r.full_name,
        summary: summarize(desc),
        author: r.full_name.split("/")[0] ?? "",
        postedAt: r.created_at ?? new Date().toISOString(),
        tags,
        score: r.stargazers_count ?? 0,
      });
    }
  }
  items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return items.slice(0, DISCOVERAISKILLS.maxItems);
}

export async function crawlDiscoverAiSkills(): Promise<CrawlResult> {
  try {
    const pages = Math.max(1, DISCOVERAISKILLS.pages);
    const all: CrawlItem[] = [];
    for (let p = 1; p <= pages; p++) {
      // 首页失败直接抛出（触发回退）；后续页失败静默跳过
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
    // 主 API 失败（典型：Actions 数据中心 IP 被 Cloudflare 403）→ 回退 GitHub topic 搜索
    try {
      const fb = await fetchGithubFallback();
      if (fb.length) {
        console.log(`[discover] 主 API 失败（${msg}），已回退 GitHub topic 搜索（${fb.length} 条）`);
        return { source: "discover", items: fb };
      }
    } catch (fe) {
      const m2 = fe instanceof Error ? fe.message : String(fe);
      await appendFailedLog("discover", `${msg}; fallback: ${m2}`);
    }
    return { source: "discover", items: [], error: msg };
  }
}
