"use client";

import { useMemo, useState } from "react";
import type { CrawlItem, SourceId } from "@/lib/items";
import { SOURCE_META } from "@/lib/items";
import { ItemCard } from "./item-card";

type Tab = "all" | SourceId;
type Sort = "latest" | "hot";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "x", label: "X" },
  { id: "ecommerce", label: "电商" },
  { id: "github", label: "GitHub" },
];

export function ItemBoard({ items }: { items: CrawlItem[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("hot");
  const [recentOnly, setRecentOnly] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, x: 0, ecommerce: 0, github: 0 };
    for (const it of items) c[it.source] = (c[it.source] ?? 0) + 1;
    return c;
  }, [items]);

  // 每个来源的分数量纲不同（GitHub=stars，电商=热度），按来源归一化到 0-1 再混排
  const maxScoreBySource = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const cur = m.get(it.source) ?? 0;
      if ((it.score ?? 0) > cur) m.set(it.source, it.score ?? 0);
    }
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const now = Date.now();
    const list = items
      .filter((it) => tab === "all" || it.source === tab)
      .filter((it) => {
        if (!query) return true;
        const hay =
          `${it.title} ${it.summary} ${it.author} ${it.tags.join(" ")} ${it.zh ?? ""}`.toLowerCase();
        return hay.includes(query);
      })
      .filter((it) => {
        if (!recentOnly) return true;
        const t = new Date(it.postedAt).getTime();
        return !Number.isNaN(t) && now - t <= 24 * 3600 * 1000;
      });
    return list.sort((a, b) => {
      if (sort === "hot") {
        const na = (a.score ?? 0) / (maxScoreBySource.get(a.source) ?? 1);
        const nb = (b.score ?? 0) / (maxScoreBySource.get(b.source) ?? 1);
        if (na !== nb) return nb - na;
      }
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [items, tab, q, sort, recentOnly, maxScoreBySource]);

  // 侧栏：当前筛选下的热门标签
  const topTags = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of filtered) {
      for (const t of it.tags) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
      {/* ============ 主列 ============ */}
      <div>
        {/* 工具栏（吸顶） */}
        <div className="sticky top-0 z-10 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <div className="flex gap-0.5 rounded-xl border border-border bg-card p-1 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  tab === t.id
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t.label}
                <span
                  className={`ml-1 text-xs ${tab === t.id ? "opacity-80" : "opacity-50"}`}
                >
                  {counts[t.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索标题 / 摘要 / 标签…"
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-xl border border-border bg-card px-2 py-2 text-sm outline-none focus:border-indigo-500/60"
            aria-label="排序方式"
          >
            <option value="hot">🔥 最热</option>
            <option value="latest">最新</option>
          </select>

          <label className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={recentOnly}
              onChange={(e) => setRecentOnly(e.target.checked)}
              className="accent-indigo-600"
            />
            仅看 24h
          </label>
        </div>

        {/* 结果数 */}
        <p className="mb-3 px-1 text-xs text-muted-foreground">
          共 {filtered.length} 条
          {tab !== "all" && ` · ${SOURCE_META[tab].label}`}
          {q.trim() && ` · 匹配「${q.trim()}」`}
          {recentOnly && " · 仅 24h"}
        </p>

        {filtered.length === 0 ? (
          <EmptyState tab={tab} q={q} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((it, i) => (
              <ItemCard key={it.id} item={it} rank={i + 1} />
            ))}
          </ul>
        )}
      </div>

      {/* ============ 侧栏 ============ */}
      <aside className="space-y-4 lg:sticky lg:top-20">
        {/* 来源分布 */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            来源分布
          </h3>
          <ul className="space-y-2.5">
            {(["github", "ecommerce", "x"] as const).map((s) => {
              const n = counts[s];
              const pct = items.length ? Math.round((n / items.length) * 100) : 0;
              return (
                <li key={s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${SOURCE_META[s].dot}`} />
                      {SOURCE_META[s].label}
                    </span>
                    <span className="font-medium text-foreground">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${SOURCE_META[s].dot} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 热门标签 */}
        {topTags.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              热门标签
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map(([tag, n]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQ(tag)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-all hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    q.trim() === tag
                      ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  #{tag} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 关于 */}
        <section className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">关于</h3>
          <p>每天 2 次（北京 9:00 / 21:00）自动聚合 X、AI 电商、GitHub 三大源的 AI 资讯。</p>
          <p className="mt-2">
            纯静态站点 · 数据以 JSON 归档于
            <a
              href="https://github.com/yujuncong/ai-aggregator"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
            >
              GitHub 仓库
            </a>
          </p>
        </section>
      </aside>
    </div>
  );
}

function EmptyState({ tab, q }: { tab: Tab; q: string }) {
  if (tab === "x") {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <p className="text-4xl opacity-60">𝕏</p>
        <p className="mt-3 text-sm text-muted-foreground">
          X 源暂未启用 —— 在 GitHub Secrets 添加{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">X_API_BEARER</code>{" "}
          后即可开启官方 API 抓取（见 README）。
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <p className="text-4xl opacity-60">🔭</p>
      <p className="mt-3 text-sm text-muted-foreground">
        {q ? `没有匹配「${q}」的结果` : "暂无数据，等待下一次抓取…"}
      </p>
    </div>
  );
}
