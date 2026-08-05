"use client";

import { useNowMs } from "@/hooks/use-clock";
import { relTime } from "@/lib/items";

/**
 * 更新时间徽章：相对时间来自分钟级时钟外部存储，
 * 水合前显示占位，避免 SSR / 浏览器结果不一致。
 */
export function UpdatedBadge({
  generatedAt,
  archiveDays,
}: {
  generatedAt: string;
  archiveDays: number;
}) {
  const now = useNowMs();
  const label = generatedAt ? relTime(generatedAt, now) : "";

  return (
    <span className="chip">
      <span className="live-dot" aria-hidden="true" />
      {generatedAt ? (label ? `更新于 ${label}` : "读取更新时间…") : "等待首次抓取"}
      <span className="text-[var(--ink-dim)]">·</span>
      <span className="mono">归档 {archiveDays} 天</span>
    </span>
  );
}
