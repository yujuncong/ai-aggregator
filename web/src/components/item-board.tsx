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
  const [sort, setSort] = useState<Sort>("latest");
  const [recentOnly, setRecentOnly] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, x: 0, ecommerce: 0, github: 0 };
    for (const it of items) c[it.source] = (c[it.source] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const now = Date.now();
    const list = items
      .filter((it) => tab === "all" || it.source === tab)
      .filter((it) => {
        if (!query) return true;
        const hay =
          `${it.title} ${it.summary} ${it.author} ${it.tags.join(" ")}`.toLowerCase();
        return hay.includes(query);
      })
      .filter((it) => {
        if (!recentOnly) return true;
        const t = new Date(it.postedAt).getTime();
        return !Number.isNaN(t) && now - t <= 24 * 3600 * 1000;
      });
    return list.sort((a, b) => {
      if (sort === "hot") {
        const sa = a.score ?? 0;
        const sb = b.score ?? 0;
        if (sa !== sb) return sb - sa;
      }
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [items, tab, q, sort, recentOnly]);

  return (
    <div>
      {/* 工具栏 */}
      <div className="sticky top-0 z-10 -mx-4 mb-5 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="ml-1 text-xs opacity-60">{counts[t.id] ?? 0}</span>
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
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题 / 摘要 / 标签…"
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm outline-none focus:border-ring"
          aria-label="排序方式"
        >
          <option value="latest">最新</option>
          <option value="hot">最热</option>
        </select>

        <label className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={recentOnly}
            onChange={(e) => setRecentOnly(e.target.checked)}
            className="accent-foreground"
          />
          仅看 24h
        </label>
      </div>

      {/* 结果数 */}
      <p className="mb-3 text-xs text-muted-foreground">
        共 {filtered.length} 条
        {tab !== "all" && ` · ${SOURCE_META[tab].label}`}
        {q.trim() && ` · 匹配「${q.trim()}」`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState tab={tab} q={q} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab, q }: { tab: Tab; q: string }) {
  if (tab === "x") {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-3xl">𝕏</p>
        <p className="mt-3 text-sm text-muted-foreground">
          X 源暂未启用 —— 在 GitHub Secrets 添加{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">X_API_BEARER</code>{" "}
          后即可开启官方 API 抓取（见 README）。
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-3xl">🔭</p>
      <p className="mt-3 text-sm text-muted-foreground">
        {q ? `没有匹配「${q}」的结果` : "暂无数据，等待下一次抓取…"}
      </p>
    </div>
  );
}
