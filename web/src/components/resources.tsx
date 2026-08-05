/** 资源推荐：Skill / MCP / Agent 生态的优质外部目录与官方仓库（静态列表，无需抓取） */
const RESOURCES: { name: string; url: string; badge: string; desc: string; stat: string }[] = [
  {
    name: "AgentSkillsHub",
    url: "https://agentskillshub.top",
    badge: "目录站",
    desc: "Skill / MCP / Agent 工具目录：117k+ 项目，质量评分 + 安全分级，每 8 小时刷新",
    stat: "117k+ 项目",
  },
  {
    name: "DiscoverAISkills",
    url: "https://discoveraiskills.com",
    badge: "数据源",
    desc: "按 GitHub star 排序的 AI Skill 榜单，本站「Skill 榜」数据来源",
    stat: "43k+ skills",
  },
  {
    name: "Anthropic Skills",
    url: "https://github.com/anthropics/skills",
    badge: "官方",
    desc: "Anthropic 官方生产级 Skill 集（docx / pdf / xlsx / MCP builder），Apache 2.0",
    stat: "官方仓库",
  },
  {
    name: "Awesome Claude Skills",
    url: "https://github.com/ComposioHQ/awesome-claude-skills",
    badge: "社区",
    desc: "社区引用最多的 Claude Skills 大目录，按分类整理，适合入门浏览",
    stat: "53k★",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="border-t" style={{ borderColor: "var(--line)" }}>
      <div className="container py-14 lg:py-20">
        <p className="eyebrow">资源推荐</p>
        <h2 className="headline mt-3 text-[var(--step-3)]">
          找 Skill、MCP、Agent 工具，<span className="grad-text">一站直达</span>。
        </h2>
        <p className="mt-4 max-w-[58ch] text-[var(--step-1)] leading-relaxed text-[var(--ink-muted)]">
          本站之外，这些社区目录与官方仓库值得收藏——都是人工核实过的优质来源，
          安装第三方 Skill 前请先阅读 <code className="mono text-[var(--accent-3)]">SKILL.md</code>。
        </p>

        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {RESOURCES.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex flex-col gap-3.5 p-6 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
            >
              <span
                className="mono w-fit rounded-[5px] border px-2 py-0.5 text-[0.78rem] font-bold"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent-3) 40%, transparent)",
                  background: "color-mix(in srgb, var(--accent-3) 13%, transparent)",
                  color: "var(--accent-3)",
                }}
              >
                {r.badge}
              </span>

              <h3 className="text-[var(--step-2)] font-bold tracking-tight text-[var(--ink)]">
                {r.name}
              </h3>

              <p className="text-[var(--step-0)] leading-relaxed text-[var(--ink-muted)]">
                {r.desc}
              </p>

              <p className="mono mt-auto pt-2 text-[0.82rem] font-bold text-[var(--ink-dim)]">
                <span className="grad-text text-[1.05rem]">{r.stat}</span>
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
