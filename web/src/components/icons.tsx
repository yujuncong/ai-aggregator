import type { SourceId } from "@/lib/items";

/** 雷达标记（品牌图形） */
export function RadarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <circle
        cx="12"
        cy="12"
        r="5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.6"
      />
      <path
        d="M12 12 L20 5.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** 来源字形（用于徽章内） */
export function SourceGlyph({ source }: { source: SourceId }) {
  if (source === "x") return <span className="leading-none">𝕏</span>;
  if (source === "ecommerce") return <span className="leading-none">▲</span>;
  if (source === "hf") {
    // 圆角方块 + 小写 h（Hugging Face 语义）
    return (
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <rect x="1.6" y="1.6" width="12.8" height="12.8" rx="3.2" />
        <path d="M5.6 11V5 M10.4 11V5 M5.6 8h4.8" />
      </svg>
    );
  }
  if (source === "hf-video") {
    // 圆环 + 播放三角（视频）
    return (
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" />
        <path d="M6.6 5.4v5.2l4.6-2.6z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (source === "discover") {
    // 四角星光（技能榜 / 星标语义）
    return (
      <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" aria-hidden="true">
        <path d="M8 2 L9.2 6.8 L14 8 L9.2 9.2 L8 14 L6.8 9.2 L2 8 L6.8 6.8 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 1l1.96 4.35 4.79.4-3.63 3.15 1.09 4.68L8 11.62l-4.21 2.56 1.09-4.68L1.25 5.75l4.79-.4L8 1z" />
    </svg>
  );
}

export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 0s1.2 2.3.4 4c-.7 1.5-2.6 1.9-2.6 4.1 0 .9.4 1.7 1 2.2-1.6-.4-2.8-1.9-2.8-3.7 0-.6.1-1.1.3-1.6C3.1 5.8 2.4 7 2.4 8.6 2.4 12 5 16 8 16s5.6-3.1 5.6-6.5C13.6 5.4 9.8 3.7 8 0z" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6.8" cy="6.8" r="4.8" />
      <path d="M10.6 10.6 L14 14" />
    </svg>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
