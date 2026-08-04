import type { CrawlItem, CrawlResult } from "../utils/types";
import { appendFailedLog, makeId } from "../utils/io";
import { cleanText, extractTags, summarize } from "../utils/summarize";
import { daysAgoISO } from "../utils/time";
import { GITHUB } from "../config";

const API = "https://api.github.com";

interface GhRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  owner: { login: string } | null;
  stargazers_count: number;
  created_at: string;
  language: string | null;
  topics: string[];
}

async function searchRepos(
  query: string,
  token: string | undefined,
  since: string,
): Promise<CrawlItem[]> {
  const url =
    `${API}/search/repositories?q=${encodeURIComponent(`${query} created:>${since}`)}` +
    `&sort=stars&order=desc&per_page=${GITHUB.perQuery}`;
  const headers: Record<string, string> = {
    "User-Agent": "ai-radar-crawler",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining") ?? "0";
    throw new Error(`GitHub rate limited (status=${res.status}, remaining=${remaining})`);
  }
  if (res.status === 422) return []; // 查询被拒，静默跳过
  if (res.status !== 200) throw new Error(`GitHub HTTP ${res.status}`);

  const body = (await res.json()) as { items?: GhRepo[] };
  const items: CrawlItem[] = [];
  for (const r of body.items ?? []) {
    const desc = cleanText(r.description);
    if ((r.stargazers_count ?? 0) < GITHUB.minStars || !desc) continue;
    const tags = extractTags(desc, (r.topics ?? []).join(" "), r.language);
    items.push({
      id: makeId("github", r.html_url),
      source: "github",
      url: r.html_url,
      title: r.full_name,
      summary: summarize(desc),
      author: r.owner?.login ?? "",
      postedAt: r.created_at ?? new Date().toISOString(),
      tags,
      score: r.stargazers_count ?? 0,
      lang: r.language ?? undefined,
    });
  }
  return items;
}

export async function crawlGithub(): Promise<CrawlResult> {
  const token = process.env.GH_TOKEN;
  const since = daysAgoISO(GITHUB.createdDays);
  try {
    const perQuery: CrawlItem[][] = [];
    for (const q of GITHUB.queries) {
      // 单个查询失败不阻塞其余查询
      perQuery.push(await searchRepos(q, token, since).catch(() => []));
    }
    // 跨查询按 url 去重（同一仓库可能命中多个关键词）
    const seen = new Set<string>();
    const items = perQuery.flat().filter((it) => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });
    return { source: "github", items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendFailedLog("github", msg);
    return { source: "github", items: [], error: msg };
  }
}
