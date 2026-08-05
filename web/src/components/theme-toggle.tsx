"use client";

import { setTheme, useTheme } from "@/hooks/use-clock";

/**
 * 主题切换：真源是 <html data-theme>，由 layout.tsx 引导脚本在首屏前落定，
 * 这里只做读取与写入，不在 effect 中同步 state。
 */
export function ThemeToggle() {
  const theme = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme(light ? "dark" : "light")}
      aria-label={light ? "切换到暗色主题" : "切换到浅色主题"}
      title={light ? "暗色" : "浅色"}
    >
      <span aria-hidden="true">{light ? "☾" : "☀"}</span>
    </button>
  );
}
