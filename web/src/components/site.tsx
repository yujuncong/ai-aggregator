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

function RadarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" opacity="0.45" />
      <circle cx="12" cy="12" r="4.5" opacity="0.75" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <path d="M12 12l6.5-6.5" />
    </svg>
  );
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      {/* ============ 品牌页头 ============ */}
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/25">
            <RadarIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight">
              AI{" "}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                Radar
              </span>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              每天 2 次 · 自动聚合 X / AI 电商 / GitHub 三大源
            </p>
          </div>
          <div className="ml-auto hidden shrink-0 text-right sm:block">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {generatedAt ? `更新于 ${updatedLabel(generatedAt)}` : "等待首次抓取"}
            </span>
            <p className="mt-1.5 text-xs text-muted-foreground">
              共 {items.length} 条资讯 · 归档 {dates.length + 1} 天
            </p>
          </div>
        </div>

        {/* 来源统计 */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(["github", "ecommerce", "x"] as const).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm"
            >
              <span className={`h-2 w-2 rounded-full ${SOURCE_META[s].dot}`} />
              {SOURCE_META[s].label}
              <span className="font-semibold text-foreground">{counts[s]}</span>
            </span>
          ))}
        </div>
      </header>

      {/* ============ 归档切换 + 列表 ============ */}
      <ArchiveNav today={today} dates={dates} todayItems={items} />

      {/* ============ 页脚 ============ */}
      <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <RadarIcon className="h-4 w-4 opacity-60" />
          <span className="font-semibold text-foreground/80">AI Radar</span>
        </div>
        <p>
          © {new Date().getFullYear()} · 卡片为外链摘要，点击前往原文 · 数据仅供学习交流 ·
          <a
            href="https://github.com/yujuncong/ai-aggregator"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
          >
            开源项目
          </a>
        </p>
      </footer>
    </main>
  );
}
