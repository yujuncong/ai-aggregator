"use client";

import { useCallback, useState } from "react";
import type { CrawlItem } from "@/lib/items";
import { ItemBoard } from "./item-board";

/**
 * 历史归档切换：默认展示今天（构建时烧入的 latest 数据），
 * 选择历史日期后从 data/YYYY-MM-DD.json 拉取当日归档。
 */
export function ArchiveNav({
  today,
  dates,
  todayItems,
}: {
  today: string;
  dates: string[];
  todayItems: CrawlItem[];
}) {
  const [date, setDate] = useState<string>(""); // "" = 今天
  const [items, setItems] = useState<CrawlItem[]>(todayItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectDate = useCallback(
    async (d: string) => {
      setDate(d);
      setError("");
      if (!d) {
        setItems(todayItems);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`data/${d}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const env = (await res.json()) as { items?: CrawlItem[] };
        setItems(Array.isArray(env.items) ? env.items : []);
      } catch {
        setError(`读取 ${d} 的归档失败`);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [todayItems],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">历史归档</span>
        <select
          value={date}
          onChange={(e) => selectDate(e.target.value)}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm outline-none focus:border-ring"
          aria-label="选择归档日期"
        >
          <option value="">今天（{today}）</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {date && (
          <button
            type="button"
            onClick={() => selectDate("")}
            className="rounded-lg border border-border px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            返回今天
          </button>
        )}
        {loading && <span className="text-xs text-muted-foreground">加载中…</span>}
      </div>

      {date && !loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          正在查看 {date} 的归档（{items.length} 条）
        </p>
      )}
      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <ItemBoard items={items} />
    </div>
  );
}
