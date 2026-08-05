import { SOURCE_META } from "@/lib/items";

const REPO = "https://github.com/yujuncong/ai-aggregator";

/** 抓取规则：真实筛选阈值卡片 */
export function SourcesSection() {
  const rules = [
    {
      id: "github" as const,
      title: "两档混合榜",
      lines: [
        "档 1「本周质量榜」：近 7 天创建且 star ≥ 100",
        "档 2「今日创新榜」：当天创建且 star ≥ 10",
        "合并后按 star 降序，每天封顶 30 条",
      ],
      stat: "阈值 100 / 10",
    },
    {
      id: "ecommerce" as const,
      title: "活跃度热度分",
      lines: [
        "数据源 Product Hunt feed",
        "取 feed 的 updated 字段（最近投票 / 评论活跃）",
        "换算 0-14 热度分，按降序排列",
      ],
      stat: "热度 0-14",
    },
    {
      id: "x" as const,
      title: "尽力而为 + 优雅降级",
      lines: [
        "① 官方 API v2 search/recent（需 Bearer，唯一可靠路径）",
        "② 回退 RSSHub 公共实例 → Nitter 镜像",
        "③ 全失败则写 x.failed 并返回空，不阻塞其他源",
      ],
      stat: "3 级回退",
    },
    {
      id: "hf" as const,
      title: "双榜并行 · 各自独立",
      lines: [
        "榜① 通用模型：HF 官方 Trending 最热榜（trendingScore 已加权近期热度）",
        "榜② 视频模型：8 类视频 pipeline 单独抓取再合并",
        "两榜数据独立、互不合并，卡片用 HF / HF·V 徽章区分",
      ],
      stat: "Top 30 / 8 类",
    },
  ];

  return (
    <section id="sources" className="border-t" style={{ borderColor: "var(--line)" }}>
      <div className="container py-14 lg:py-20">
        <p className="eyebrow">抓取规则</p>
        <h2 className="headline mt-3 text-[var(--step-3)]">
          筛什么、怎么排，<span className="grad-text">全部公开</span>。
        </h2>
        <p className="mt-4 max-w-[58ch] text-[var(--step-1)] leading-relaxed text-[var(--ink-muted)]">
          阈值都写在 <code className="mono text-[var(--accent-3)]">crawlers/config.ts</code>{" "}
          里，可自行调整后重跑。每个源的子榜里都有独立的「本周最热」（近 7 天按热度降序）；
          「Skill」（AI 可复用专项能力）目前集中在 GitHub 子榜——都是前端过滤，不重复抓取。
        </p>

        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {rules.map((r) => {
            const meta = SOURCE_META[r.id];
            return (
              <article
                key={r.id}
                className="card flex flex-col gap-3.5 p-6"
                style={{ ["--src-color" as string]: meta.color }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="mono rounded-[5px] border px-2 py-0.5 text-[0.78rem] font-bold"
                    style={{
                      borderColor: "color-mix(in srgb, var(--src-color) 40%, transparent)",
                      background: "color-mix(in srgb, var(--src-color) 13%, transparent)",
                      color: "var(--src-color)",
                    }}
                  >
                    {meta.code}
                  </span>
                  <span className="text-[0.88rem] font-semibold text-[var(--ink-muted)]">
                    {meta.label}
                  </span>
                </div>

                <h3 className="text-[var(--step-2)] font-bold tracking-tight">
                  {r.title}
                </h3>

                <ul className="grid list-none gap-2.5 p-0">
                  {r.lines.map((l) => (
                    <li
                      key={l}
                      className="relative pl-5 text-[var(--step-0)] leading-relaxed text-[var(--ink-muted)]"
                    >
                      <span
                        className="absolute left-0 font-bold"
                        style={{ color: "var(--src-color)" }}
                        aria-hidden="true"
                      >
                        →
                      </span>
                      {l}
                    </li>
                  ))}
                </ul>

                <p className="mono mt-auto pt-2 text-[0.82rem] font-bold text-[var(--ink-dim)]">
                  <span className="grad-text text-[1.05rem]">{r.stat}</span>
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** 页脚：CTA 横幅 + 链接列 */
export function SiteFooter() {
  return (
    <footer
      id="about"
      className="mt-auto border-t"
      style={{ borderColor: "var(--line)", background: "var(--section-alt)" }}
    >
      <div className="container py-14 lg:py-16">
        {/* CTA */}
        <div
          className="overflow-hidden rounded-[var(--r)] px-6 py-12 text-center sm:px-10"
          style={{
            background: "var(--grad-brand)",
            boxShadow:
              "0 30px 80px -30px color-mix(in srgb, var(--brand) 70%, transparent)",
          }}
        >
          <h2
            className="headline text-[var(--step-3)]"
            style={{ color: "#fff" }}
          >
            自己部署一份，只要 fork。
          </h2>
          <p
            className="mx-auto mt-3 max-w-[48ch] text-[var(--step-0)] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Fork 仓库 → Pages 选 GitHub Actions → 手动触发一次，之后每天自动跑两轮。
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: "#fff", color: "var(--brand)" }}
            >
              前往仓库
            </a>
            <a
              href={`${REPO}#readme`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                background: "rgba(255,255,255,0.14)",
                borderColor: "rgba(255,255,255,0.5)",
                color: "#fff",
              }}
            >
              阅读文档
            </a>
          </div>
        </div>

        {/* 链接列 */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="text-[var(--step-1)] font-bold tracking-tight">
              AI<span className="grad-text"> Radar</span>
            </p>
            <p className="mt-2 max-w-[32ch] text-[var(--step--1)] leading-relaxed text-[var(--ink-muted)]">
              每天 2 次自动聚合 GitHub、Hugging Face、AI 电商、X 多源的 AI 资讯。纯静态、无追踪、开源可自建。
            </p>
          </div>

          <FooterCol
            title="站内"
            links={[
              { label: "情报流", href: "#feed" },
              { label: "抓取规则", href: "#sources" },
            ]}
          />
          <FooterCol
            title="项目"
            links={[
              { label: "GitHub 仓库", href: REPO },
              { label: "README", href: `${REPO}#readme` },
              { label: "Actions 工作流", href: `${REPO}/actions` },
            ]}
          />
          <FooterCol
            title="数据"
            links={[
              { label: "latest.json", href: `${REPO}/blob/main/data/latest.json` },
              { label: "每日归档", href: `${REPO}/tree/main/data` },
            ]}
          />
        </div>

        <div
          className="mt-10 flex flex-wrap items-center gap-2 border-t pt-6 text-[var(--step--1)] text-[var(--ink-muted)]"
          style={{ borderColor: "var(--line)" }}
        >
          <span className="mono">© {new Date().getFullYear()} AI Radar</span>
          <span className="text-[var(--ink-dim)]">·</span>
          <span>卡片为外链摘要，点击前往原文</span>
          <span className="text-[var(--ink-dim)]">·</span>
          <span>数据仅供学习交流</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="mono mb-0.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
        {title}
      </p>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target={l.href.startsWith("#") ? undefined : "_blank"}
          rel={l.href.startsWith("#") ? undefined : "noopener noreferrer"}
          className="text-[var(--step--1)] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
