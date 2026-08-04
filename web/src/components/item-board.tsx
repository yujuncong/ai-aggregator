"use client";

import { useMemo, useState } from "react";
import type { CrawlItem, SourceId } from "@/lib/items";
import { ItemCard } from "./item-card";

type Tab = "all" | SourceId;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "x", label: "X" },
  { id: "ecommerce", label: "电商" },
  { id: "github", label: "GitHub" },
];

export function ItemBoard({ items }: { items: CrawlItem[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: items.length,
      x: 0,
      ecommerce: 0,
      github: 0,
    };
    for (const it of items) c[it.source] = (c[it.source] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const now = Date.now();
    return items
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
      })
      .sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
  }, [items, tab, q, recentOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                tab === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
              <span className="ml-1 text-xs opacity-60">{counts[t.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题 / 摘要 / 标签…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={recentOnly}
            onChange={(e) => setRecentOnly(e.target.checked)}
            className="accent-foreground"
          />
          仅看 24h
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState tab={tab} q={q} />
      ) : (
        <ul className="space-y-2">
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
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        X 源暂未启用 —— 在 GitHub Secrets 添加{" "}
        <code className="font-mono">X_API_BEARER</code> 后即可开启官方 API 抓取（见
        README）。
      </p>
    );
  }
  return (
    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {q ? `没有匹配「${q}」的结果` : "暂无数据，等待下一次抓取…"}
    </p>
  );
}
