"use client";

import { useCallback, useState } from "react";
import type { CrawlItem } from "@/lib/items";
import { ItemBoard } from "./item-board";

/**
 * 归档切换：默认展示今天（构建时烧入的 latest），
 * 选历史日期则从 data/YYYY-MM-DD.json 拉取当日快照。
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
  const [date, setDate] = useState(""); // "" = 今天
  const [items, setItems] = useState<CrawlItem[]>(todayItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const select = useCallback(
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
      {/* 归档头 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">情报流</p>
          <h2 className="headline mt-2 text-[var(--step-2)]">
            {date ? (
              <>
                <span className="mono grad-text">{date}</span> 归档快照
              </>
            ) : (
              <>
                今日榜单 · <span className="mono grad-text">{today}</span>
              </>
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--ink-dim)]"
            htmlFor="archive-date"
          >
            归档
          </label>
          <select
            id="archive-date"
            value={date}
            onChange={(e) => select(e.target.value)}
            className="select"
          >
            <option value="">今天（{today}）</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {date && (
            <button type="button" onClick={() => select("")} className="icon-btn px-3">
              返回今天
            </button>
          )}
          {loading && (
            <span className="mono text-[0.72rem] text-[var(--ink-dim)]">载入中…</span>
          )}
        </div>
      </div>

      {error && (
        <p
          className="mono mb-4 rounded-[var(--r-sm)] border px-3 py-2 text-[0.75rem]"
          style={{
            borderColor: "color-mix(in srgb, var(--err) 35%, transparent)",
            background: "color-mix(in srgb, var(--err) 10%, transparent)",
            color: "var(--err)",
          }}
        >
          {error}
        </p>
      )}

      <ItemBoard items={items} />
    </div>
  );
}
