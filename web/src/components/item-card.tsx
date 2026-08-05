"use client";

import { useNowMs } from "@/hooks/use-clock";
import type { CrawlItem } from "@/lib/items";
import {
  LANG_COLORS,
  SOURCE_META,
  compact,
  hostOf,
  relTime,
} from "@/lib/items";
import { FlameIcon, SourceGlyph, StarIcon } from "./icons";

export function ItemCard({ item, rank }: { item: CrawlItem; rank: number }) {
  // 相对时间取自分钟级时钟；水合前 now=0 → 显示占位，规避水合不一致
  const now = useNowMs();
  const posted = relTime(item.postedAt, now);

  const meta = SOURCE_META[item.source];
  const host = hostOf(item.url);
  const langColor = item.lang ? LANG_COLORS[item.lang] : undefined;
  const isTop = rank <= 3;

  return (
    <li style={{ ["--src-color" as string]: meta.color }}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="feed-item group"
      >
        {/* ── 元信息行 ── */}
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className={`rank ${isTop ? "rank--top" : "rank--rest"}`}>
            {rank}
          </span>
          <span className="badge-src">
            <SourceGlyph source={item.source} />
            {meta.code}
          </span>
          <span className="mono truncate text-[0.72rem] text-[var(--ink-muted)]">
            {item.author}
          </span>
          <span className="text-[var(--ink-dim)]">·</span>
          <span className="mono text-[0.72rem] text-[var(--ink-muted)]">
            {posted || "—"}
          </span>
          {host && (
            <span className="mono ml-auto hidden truncate text-[0.7rem] text-[var(--ink-dim)] sm:inline">
              {host}
            </span>
          )}
        </div>

        {/* ── 标题 ── */}
        <h3 className="feed-item__title">{item.title}</h3>

        {/* ── 中文解读（主） ── */}
        {item.zh && (
          <p className="feed-item__zh clamp-2 mt-1.5 text-[var(--step-0)] leading-relaxed">
            {item.zh}
          </p>
        )}

        {/* ── 英文原文摘要（辅） ── */}
        {item.summary && (
          <p className="clamp-1 mono mt-1.5 text-[0.72rem] text-[var(--ink-dim)]">
            {item.summary}
          </p>
        )}

        {/* ── 指标 + 标签 ── */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {typeof item.score === "number" && item.score > 0 && (
            <span
              className="mono inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-bold"
              style={{
                borderColor: "color-mix(in srgb, var(--warn) 32%, transparent)",
                background: "color-mix(in srgb, var(--warn) 11%, transparent)",
                color: "var(--warn)",
              }}
            >
              {item.source === "ecommerce" ? <FlameIcon /> : <StarIcon />}
              {compact(item.score)}
              <span className="font-medium opacity-70">{meta.unit}</span>
            </span>
          )}

          {item.lang && (
            <span className="mono inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-alt)] px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--ink-muted)]">
              {langColor && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: langColor }}
                />
              )}
              {item.lang}
            </span>
          )}

          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      </a>
    </li>
  );
}
