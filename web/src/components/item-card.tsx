import type { CrawlItem, SourceId } from "@/lib/items";
import { SOURCE_META } from "@/lib/items";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Rust: "#dea584",
  Go: "#00add8",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Ruby: "#701516",
  PHP: "#4f5d95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  "Jupyter Notebook": "#da5b0b",
  Dart: "#00b4ab",
  Elixir: "#6e4a7e",
  Zig: "#ec915c",
  Scala: "#c22d40",
  Lua: "#000080",
};

function SourceGlyph({ source }: { source: SourceId }) {
  switch (source) {
    case "x":
      return <span className="leading-none">𝕏</span>;
    case "ecommerce":
      return <span className="leading-none">▲</span>;
    case "github":
      return (
        <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
      );
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536e6],
    ["month", 2592e6],
    ["day", 864e5],
    ["hour", 36e5],
    ["minute", 6e4],
    ["second", 1e3],
  ];
  const rtf = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return rtf.format(-Math.round(diff / ms), unit);
    }
  }
  return "";
}

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ItemCard({ item }: { item: CrawlItem }) {
  const meta = SOURCE_META[item.source];
  const dom = domain(item.url);
  const langColor = item.lang ? LANG_COLORS[item.lang] : undefined;
  return (
    <li className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-md">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* 元信息行 */}
        <div className="mb-1.5 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${meta.badge}`}
          >
            <SourceGlyph source={item.source} />
            {meta.label}
          </span>
          <span className="truncate text-muted-foreground">{item.author}</span>
          {typeof item.score === "number" && item.score > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-amber-500 dark:text-amber-400">
              <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M8 1l1.96 4.35 4.79.4-3.63 3.15 1.09 4.68L8 11.62l-4.21 2.56 1.09-4.68L1.25 5.75l4.79-.4L8 1z" />
              </svg>
              {item.score.toLocaleString()}
            </span>
          )}
          {item.lang && (
            <span className="hidden items-center gap-1 text-muted-foreground sm:inline-flex">
              {langColor && (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: langColor }} />
              )}
              {item.lang}
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{relativeTime(item.postedAt)}</span>
          {dom && (
            <span className="ml-auto hidden truncate font-mono text-muted-foreground sm:inline">
              {dom}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h2 className="font-semibold leading-snug text-foreground group-hover:underline">
          {item.title}
        </h2>

        {/* 中文解释说明（主） */}
        {item.zh && (
          <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">{item.zh}</p>
        )}
        {/* 原文摘要（辅） */}
        {item.summary && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {item.summary}
          </p>
        )}

        {/* 标签 */}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground transition-colors group-hover:bg-secondary/70"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </a>
    </li>
  );
}
