import { RadarMark } from "./icons";
import { ThemeToggle } from "./theme-toggle";

const REPO = "https://github.com/yujuncong/ai-aggregator";

const LINKS = [
  { href: "#feed", label: "情报流" },
  { href: "#sources", label: "抓取规则" },
  { href: "#about", label: "关于" },
];

export function SiteNav() {
  return (
    <nav className="nav" aria-label="主导航">
      <div className="nav__inner container flex w-full items-center justify-between gap-4">
        <a
          href="#top"
          className="inline-flex shrink-0 items-center gap-2 text-[var(--step-1)] font-bold tracking-tight"
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-[8px] text-white"
            style={{ background: "var(--grad-brand)" }}
          >
            <RadarMark className="h-4 w-4" />
          </span>
          <span>
            AI<span className="grad-text"> Radar</span>
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[var(--step--1)] font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            aria-label="GitHub 仓库"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
