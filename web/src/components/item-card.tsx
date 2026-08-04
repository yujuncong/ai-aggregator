import type { CrawlItem } from "@/lib/items";
import { SOURCE_META } from "@/lib/items";

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
  return (
    <li className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className={`rounded px-1.5 py-0.5 font-medium ${meta.badge}`}>
            {meta.label}
          </span>
          <span className="truncate text-muted-foreground">{item.author}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{relativeTime(item.postedAt)}</span>
          {dom && (
            <span className="ml-auto hidden truncate text-muted-foreground sm:inline">
              {dom}
            </span>
          )}
        </div>
        <h2 className="font-medium leading-snug text-foreground">{item.title}</h2>
        {item.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.summary}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
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
