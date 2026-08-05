import type { CrawlItem } from "@/lib/items";
import { SOURCE_META } from "@/lib/items";
import { ArchiveNav } from "./archive-nav";

function updatedLabel(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.round(diff / 60000));
  if (min < 60) return `${min} 分钟前`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} 小时前` : `${Math.round(h / 24)} 天前`;
}

export function Site({
  items,
  generatedAt,
  today,
  dates,
}: {
  items: CrawlItem[];
  generatedAt: string;
  today: string;
  dates: string[];
}) {
  const counts: Record<string, number> = { x: 0, ecommerce: 0, github: 0 };
  for (const it of items) counts[it.source]++;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      {/* 品牌页头 */}
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 via-zinc-900 to-black text-white shadow-md">
            <span className="text-base font-black tracking-tight">AI</span>
          </div>
          <div className="min-w-0">
            <h1 className="bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 bg-clip-text text-2xl font-black tracking-tight text-transparent dark:from-white dark:via-zinc-400 dark:to-white">
              AI Radar
            </h1>
            <p className="text-sm text-muted-foreground">
              每天 2 次 · 自动聚合 X / AI 电商 / GitHub 三大源
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right text-xs text-muted-foreground">
            {generatedAt && <p>更新于 {updatedLabel(generatedAt)}</p>}
            <p>{items.length} 条资讯</p>
          </div>
        </div>

        {/* 来源统计 */}
        <div className="mt-5 flex gap-2">
          {(["x", "ecommerce", "github"] as const).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
            >
              <span className={`h-2 w-2 rounded-full ${SOURCE_META[s].dot}`} />
              {SOURCE_META[s].label}
              <span className="font-medium text-foreground">{counts[s]}</span>
            </span>
          ))}
        </div>
      </header>

      <ArchiveNav today={today} dates={dates} todayItems={items} />

      <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} AI Radar · 卡片为外链摘要，点击前往原文 ·
          <a
            href="https://github.com/yujuncong/ai-aggregator"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline underline-offset-2 hover:text-foreground"
          >
            源码
          </a>
        </p>
      </footer>
    </main>
  );
}
