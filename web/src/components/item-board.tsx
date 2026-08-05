"use client";

import { useMemo, useState } from "react";
import { useNowMs } from "@/hooks/use-clock";
import type { CrawlItem, SourceId } from "@/lib/items";
import { SOURCE_META, SOURCE_ORDER } from "@/lib/items";
import { ItemCard } from "./item-card";
import { SearchIcon } from "./icons";

/** 顶级 tab：每个源是一个父 tab，点开后展开各自的子榜（含独立「本周最热」） */
type TopTab = "all" | "github" | "ecommerce" | "x" | "hf";
type Sort = "hot" | "latest";

/** 一周毫秒数 */
const WEEK_MS = 7 * 864e5;

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "github", label: "GitHub" },
  { id: "ecommerce", label: "电商" },
  { id: "x", label: "X" },
  { id: "hf", label: "Hugging Face" },
];

interface SubTab {
  id: string;
  label: string;
  countKey: string;
}

/**
 * 每个源的子榜。
 * -xxx-week  = 本周最热（近 7 天按热度排序）
 * -xxx-skill = Skill（AI 可复用专项能力：SKILL.md / 技能包），仅 GitHub 保留
 * 各子榜与综合榜数据不混、各自独立。HF 的「本周最热」跨通用 + 视频两个子榜。
 */
const SUB_TABS: Record<Exclude<TopTab, "all">, SubTab[]> = {
  github: [
    { id: "github", label: "综合榜", countKey: "github" },
    { id: "github-week", label: "本周最热", countKey: "githubWeek" },
    { id: "github-skill", label: "Skill", countKey: "githubSkill" },
  ],
  ecommerce: [
    { id: "ecommerce", label: "综合榜", countKey: "ecommerce" },
    { id: "ecommerce-week", label: "本周最热", countKey: "ecommerceWeek" },
  ],
  x: [
    { id: "x", label: "综合榜", countKey: "x" },
    { id: "x-week", label: "本周最热", countKey: "xWeek" },
  ],
  hf: [
    { id: "hf", label: "通用模型", countKey: "hfModel" },
    { id: "hf-video", label: "视频模型", countKey: "hfVideo" },
    { id: "hf-week", label: "本周最热", countKey: "hfWeek" },
  ],
};

const DEFAULT_SUB: Record<Exclude<TopTab, "all">, string> = {
  github: "github",
  ecommerce: "ecommerce",
  x: "x",
  hf: "hf",
};

/** 时间窗过滤；now=0 表示尚未水合，跳过时间过滤保证首屏与 SSR 一致 */
function withinWindow(iso: string, now: number, ms: number): boolean {
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && now - t <= ms;
}

/** 是否 Skill 类内容（AI 可复用专项能力：SKILL.md / 技能包 / prompt 包） */
function isSkill(it: CrawlItem): boolean {
  return /skill/i.test(
    `${it.title} ${it.summary} ${it.tags.join(" ")} ${it.zh ?? ""}`,
  );
}

/** 子 tab 的 -week / -skill 后缀对应的源过滤 */
function baseSource(sub: string, it: CrawlItem): boolean {
  const base = sub.endsWith("-skill")
    ? sub.slice(0, -6)
    : sub.endsWith("-week")
      ? sub.slice(0, -5)
      : sub;
  return base === "hf"
    ? it.source === "hf" || it.source === "hf-video"
    : it.source === base;
}

/** 当前 tab + 子 tab 是否命中该条 */
function sourceMatches(it: CrawlItem, tab: TopTab, sub: string, now: number): boolean {
  if (tab === "all") return true;
  if (sub.endsWith("-skill")) return baseSource(sub, it) && isSkill(it);
  if (sub.endsWith("-week")) {
    if (!baseSource(sub, it)) return false;
    return now ? withinWindow(it.postedAt, now, WEEK_MS) : true;
  }
  if (sub === "hf") return it.source === "hf";
  if (sub === "hf-video") return it.source === "hf-video";
  return it.source === sub;
}

export function ItemBoard({ items }: { items: CrawlItem[] }) {
  const [tab, setTab] = useState<TopTab>("all");
  const [subSel, setSubSel] = useState<Record<string, string>>(DEFAULT_SUB);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("hot");
  const [recentOnly, setRecentOnly] = useState(false);
  const now = useNowMs();

  const activeSub = tab === "all" ? "" : subSel[tab] ?? DEFAULT_SUB[tab];

  const counts = useMemo(() => {
    const per: Record<string, number> = {};
    for (const it of items) per[it.source] = (per[it.source] ?? 0) + 1;
    const c: Record<string, number> = {
      all: items.length,
      github: per.github ?? 0,
      ecommerce: per.ecommerce ?? 0,
      x: per.x ?? 0,
      /** 父 tab 计数 = 通用 + 视频 */
      hf: (per.hf ?? 0) + (per["hf-video"] ?? 0),
      /** HF 子榜计数（各自独立） */
      hfModel: per.hf ?? 0,
      hfVideo: per["hf-video"] ?? 0,
    };
    // 各源「本周最热」计数 = 近 7 天
    const weekPreds: [string, (s: SourceId) => boolean][] = [
      ["githubWeek", (s) => s === "github"],
      ["ecommerceWeek", (s) => s === "ecommerce"],
      ["xWeek", (s) => s === "x"],
      ["hfWeek", (s) => s === "hf" || s === "hf-video"],
    ];
    for (const [key, pred] of weekPreds) {
      c[key] = items.filter(
        (it) => pred(it.source) && (now ? withinWindow(it.postedAt, now, WEEK_MS) : true),
      ).length;
    }
    // 「Skill」计数 = 内容含 skill，仅 GitHub 子榜使用
    c.githubSkill = items.filter((it) => it.source === "github" && isSkill(it)).length;
    return c;
  }, [items, now]);

  // 各源分数量纲不同（GitHub=stars，电商=热度 0-14，HF=likes），按源归一后再混排
  const maxBySource = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const cur = m.get(it.source) ?? 0;
      if ((it.score ?? 0) > cur) m.set(it.source, it.score ?? 0);
    }
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = items
      .filter((it) => sourceMatches(it, tab, activeSub, now))
      .filter((it) => {
        if (!query) return true;
        const hay = `${it.title} ${it.summary} ${it.author} ${it.tags.join(" ")} ${
          it.zh ?? ""
        }`.toLowerCase();
        return hay.includes(query);
      })
      .filter((it) => {
        // now=0 表示尚未水合，此时不做时间过滤，保证首屏与 SSR 一致
        if (!recentOnly || !now) return true;
        return withinWindow(it.postedAt, now, 24 * 3600 * 1000);
      });

    return list.sort((a, b) => {
      if (sort === "hot") {
        const na = (a.score ?? 0) / (maxBySource.get(a.source) || 1);
        const nb = (b.score ?? 0) / (maxBySource.get(b.source) || 1);
        if (na !== nb) return nb - na;
      }
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [items, tab, activeSub, q, sort, recentOnly, maxBySource, now]);

  const topTags = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of filtered) {
      for (const t of it.tags) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [filtered]);

  const parentLabel =
    tab === "all" ? "" : tab === "hf" ? "Hugging Face" : SOURCE_META[tab].label;
  const subLabel =
    tab === "all"
      ? ""
      : (SUB_TABS[tab].find((t) => t.id === activeSub)?.label ?? "");

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
      {/* ══════════ 主列 ══════════ */}
      <div className="min-w-0">
        {/* 工具栏（吸顶） */}
        <div
          className="sticky z-20 -mx-1 mb-5 flex flex-wrap items-center gap-2 rounded-[var(--r)] border border-[var(--line)] px-2.5 py-2.5"
          style={{
            top: "calc(var(--nav-h) + 8px)",
            background: "color-mix(in srgb, var(--bg) 82%, transparent)",
            backdropFilter: "saturate(180%) blur(14px)",
            WebkitBackdropFilter: "saturate(180%) blur(14px)",
          }}
        >
          <div className="seg">
            {TOP_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`seg__btn ${tab === t.id ? "is-active" : ""}`}
                aria-pressed={tab === t.id}
              >
                {t.label}
                <span className="mono opacity-60">{counts[t.id] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* 每源子榜：综合榜 / 通用模型等 + 独立「本周最热」，数据互不合并 */}
          {tab !== "all" && (
            <div
              className="seg seg--sub"
              role="tablist"
              aria-label={`${parentLabel} 子榜切换`}
              style={{ ["--src-color" as string]: SOURCE_META[tab].color }}
            >
              {SUB_TABS[tab].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubSel((s) => ({ ...s, [tab]: t.id }))}
                  className={`seg__btn ${activeSub === t.id ? "is-active" : ""}`}
                  aria-pressed={activeSub === t.id}
                >
                  {t.label}
                  <span className="mono opacity-60">{counts[t.countKey] ?? 0}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative min-w-[140px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-dim)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索标题 / 摘要 / 标签…"
              className="field"
              aria-label="搜索资讯"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="select"
            aria-label="排序方式"
          >
            <option value="hot">按热度</option>
            <option value="latest">按时间</option>
          </select>

          <button
            type="button"
            onClick={() => setRecentOnly((v) => !v)}
            className={`seg__btn ${recentOnly ? "is-active" : ""}`}
            style={{ border: "1px solid var(--line)" }}
            aria-pressed={recentOnly}
          >
            仅 24h
          </button>
        </div>

        {/* 结果计数 */}
        <p className="mono mb-3 px-1 text-[0.72rem] text-[var(--ink-dim)]">
          {`> ${filtered.length} 条结果`}
          {parentLabel && ` · ${parentLabel}`}
          {subLabel && ` · ${subLabel}`}
          {q.trim() && ` · 匹配「${q.trim()}」`}
          {recentOnly && " · 24h 内"}
          {` · ${sort === "hot" ? "热度降序" : "时间降序"}`}
        </p>

        {filtered.length === 0 ? (
          <EmptyState tab={tab} q={q} sub={activeSub} />
        ) : (
          <ul className="grid list-none gap-2.5 p-0">
            {filtered.map((it, i) => (
              <ItemCard key={it.id} item={it} rank={i + 1} />
            ))}
          </ul>
        )}
      </div>

      {/* ══════════ 侧栏 ══════════ */}
      <aside
        className="grid gap-3 lg:sticky"
        style={{ top: "calc(var(--nav-h) + 76px)" }}
      >
        {/* 来源分布 */}
        <section className="card p-4">
          <h4 className="mono mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--ink-dim)]">
            来源分布
          </h4>
          <ul className="grid list-none gap-3 p-0">
            {SOURCE_ORDER.map((s) => {
              const n = counts[s] ?? 0;
              const pct = items.length ? Math.round((n / items.length) * 100) : 0;
              return (
                <li key={s}>
                  <div className="mb-1.5 flex items-center justify-between text-[0.75rem]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink-muted)]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: SOURCE_META[s].color }}
                      />
                      {SOURCE_META[s].label}
                    </span>
                    <span className="mono font-bold text-[var(--ink)]">
                      {n}
                      <span className="ml-1 font-normal text-[var(--ink-dim)]">
                        {pct}%
                      </span>
                    </span>
                  </div>
                  <span className="bar">
                    <span
                      className="bar__fill"
                      style={{
                        width: `${pct}%`,
                        background: SOURCE_META[s].color,
                      }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 热门标签 */}
        {topTags.length > 0 && (
          <section className="card p-4">
            <h4 className="mono mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--ink-dim)]">
              热门标签
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map(([tag, n]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQ(q.trim() === tag ? "" : tag)}
                  className={`tag ${q.trim() === tag ? "is-active" : ""}`}
                >
                  #{tag} <span className="opacity-55">{n}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 榜首速览 */}
        {filtered.length > 0 && <TopPeek items={filtered.slice(0, 3)} />}
      </aside>
    </div>
  );
}

function TopPeek({ items }: { items: CrawlItem[] }) {
  return (
    <section className="card p-4">
      <h4 className="mono mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--ink-dim)]">
        榜首速览
      </h4>
      <ol className="grid list-none gap-2.5 p-0">
        {items.map((it, i) => (
          <li key={it.id} className="flex gap-2">
            <span
              className="mono mt-0.5 shrink-0 text-[0.7rem] font-bold"
              style={{ color: SOURCE_META[it.source].color }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <a
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="clamp-2 text-[0.78rem] font-semibold leading-snug text-[var(--ink-muted)] transition-colors hover:text-[var(--brand)]"
            >
              {it.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EmptyState({ tab, q, sub }: { tab: TopTab; q: string; sub: string }) {
  if (sub.endsWith("-skill")) {
    return (
      <div
        className="grid place-items-center gap-3 rounded-[var(--r)] border border-dashed px-6 py-16 text-center"
        style={{ borderColor: "var(--line-strong)" }}
      >
        <span className="text-4xl opacity-40" aria-hidden="true">
          ✦
        </span>
        <p className="max-w-[42ch] text-[var(--step--1)] leading-relaxed text-[var(--ink-muted)]">
          该源暂无 Skill 类内容（AI 技能包 / SKILL.md / prompt 包）。
          这类内容目前主要集中在 GitHub，可到 <code className="mono rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--accent-3)]">GitHub</code> 的 Skill 子榜查看。
        </p>
      </div>
    );
  }
  if (tab === "x") {
    return (
      <div
        className="grid place-items-center gap-3 rounded-[var(--r)] border border-dashed px-6 py-16 text-center"
        style={{ borderColor: "var(--line-strong)" }}
      >
        <span className="text-4xl opacity-40" aria-hidden="true">
          𝕏
        </span>
        <p className="max-w-[42ch] text-[var(--step--1)] leading-relaxed text-[var(--ink-muted)]">
          X 源尚未启用。在仓库 Secrets 添加{" "}
          <code className="mono rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--accent-3)]">
            X_API_BEARER
          </code>{" "}
          即可开启官方 API 抓取；缺失时该源自动跳过，不阻塞其他源。
        </p>
      </div>
    );
  }
  return (
    <div
      className="grid place-items-center gap-3 rounded-[var(--r)] border border-dashed px-6 py-16 text-center"
      style={{ borderColor: "var(--line-strong)" }}
    >
      <span className="text-4xl opacity-40" aria-hidden="true">
        ⌖
      </span>
      <p className="text-[var(--step--1)] text-[var(--ink-muted)]">
        {q ? `没有匹配「${q}」的结果，换个关键词试试。` : "暂无数据，等待下一次抓取…"}
      </p>
    </div>
  );
}
