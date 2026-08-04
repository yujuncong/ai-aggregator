import type { CrawlItem } from "@/lib/items";
import { ItemBoard } from "./item-board";

export function Site({ items }: { items: CrawlItem[] }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight">AI Radar</h1>
          <p className="text-sm text-muted-foreground">
            每天 2 次 · 自动聚合 X / AI 电商 / GitHub 三大源
          </p>
        </div>
      </header>

      <ItemBoard items={items} />

      <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} AI Radar · 卡片为外链摘要，点击前往原文 ·
          数据仅供学习交流
        </p>
      </footer>
    </main>
  );
}
