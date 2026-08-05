import type { CrawlItem, SourceId } from "@/lib/items";
import { SOURCE_META, SOURCE_ORDER, compact } from "@/lib/items";
import { ArrowIcon } from "./icons";
import { UpdatedBadge } from "./updated-badge";

const REPO = "https://github.com/yujuncong/ai-aggregator";

/**
 * 首屏：文案 + 巨号统计。
 * 数字全部来自真实数据，不做任何虚构。
 */
export function Hero({
  items,
  generatedAt,
  archiveDays,
}: {
  items: CrawlItem[];
  generatedAt: string;
  archiveDays: number;
}) {
  const counts = SOURCE_ORDER.reduce<Record<SourceId, number>>(
    (acc, s) => {
      acc[s] = items.filter((i) => i.source === s).length;
      return acc;
    },
    Object.fromEntries(SOURCE_ORDER.map((s) => [s, 0])) as Record<SourceId, number>,
  );

  const totalStars = items
    .filter((i) => i.source === "github")
    .reduce((sum, i) => sum + (i.score ?? 0), 0);

  const zhRate = items.length
    ? Math.round((items.filter((i) => i.zh).length / items.length) * 100)
    : 0;

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container py-14 lg:py-24">
        <div>
          <p className="eyebrow rise d1">
            <span className="live-dot" aria-hidden="true" />
            自动聚合 · 每天 2 次
          </p>

          <h1 className="headline rise d2 mt-4">
            AI 圈今天
            <br />
            发生了<span className="grad-text">什么</span>。
          </h1>

          <p className="rise d3 mt-5 max-w-[52ch] text-[var(--step-1)] leading-relaxed text-[var(--ink-muted)]">
            GitHub 新星、Hugging Face 热门模型、AI 产品上新、X 讨论热点、AI 技能榜（DiscoverAISkills）——
            多源抓取、去重、生成中文摘要，按热度排好序，一屏读完。
          </p>

          {/* 巨号统计条 */}
          <div className="rise d4 mt-10 flex flex-wrap items-end gap-x-12 gap-y-6">
            <Stat value={String(items.length)} label="条在榜情报" />
            <Stat value={String(SOURCE_ORDER.length)} label="个榜单" />
            <Stat value={compact(totalStars)} label="累计 star 覆盖" />
            <Stat value={`${zhRate}%`} label="中文摘要率" />
          </div>

          <div className="rise d5 mt-10 flex flex-wrap items-center gap-3">
            <a href="#feed" className="btn btn--primary">
              查看今日情报 <ArrowIcon />
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--outline"
            >
              开源仓库
            </a>
            <UpdatedBadge generatedAt={generatedAt} archiveDays={archiveDays} />
          </div>
        </div>
      </div>

      {/* 来源跑马灯 */}
      <SourceMarquee counts={counts} />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="giant">{value}</div>
      <div className="mt-1 text-[var(--step--1)] font-semibold text-[var(--ink-muted)]">
        {label}
      </div>
    </div>
  );
}

function SourceMarquee({ counts }: { counts: Record<SourceId, number> }) {
  const cells = [
    ...SOURCE_ORDER.map((s) => `${SOURCE_META[s].label} · ${counts[s]} 条`),
    "去重合并 · sha1(source+url)",
    "抓取节律 · 北京 09:00 / 21:00",
    "归档格式 · JSON",
    "部署 · GitHub Pages 静态",
    "中文摘要 · 规则生成，无 LLM",
  ];
  const group = (
    <ul className="m-0 flex list-none items-center gap-10 px-6 py-3">
      {cells.map((c) => (
        <li
          key={c}
          className="mono whitespace-nowrap text-[var(--step--1)] font-semibold text-[var(--ink-muted)]"
        >
          {c}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className="marquee border-y"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      aria-hidden="true"
    >
      <div className="marquee__track">
        {group}
        {group}
      </div>
    </div>
  );
}
