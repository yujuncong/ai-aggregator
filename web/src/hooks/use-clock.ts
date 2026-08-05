"use client";

import { useSyncExternalStore } from "react";

/* ══════════════════════════════════════════════════════════════
   分钟级时钟
   相对时间需要 Date.now()，但在 render 中直接调用是不纯的。
   这里把它建模为外部数据源：快照按分钟量化，跨分钟才产生新值，
   既避免无限重渲染，也满足 React 的纯度约束。
   服务端 / 水合前返回 0，调用方据此渲染占位。
   ══════════════════════════════════════════════════════════════ */

const TICK_MS = 30_000;

const tickListeners = new Set<() => void>();
let tickTimer: ReturnType<typeof setInterval> | null = null;

function subscribeTick(onChange: () => void): () => void {
  tickListeners.add(onChange);
  if (!tickTimer) {
    tickTimer = setInterval(() => {
      for (const l of tickListeners) l();
    }, TICK_MS);
  }
  return () => {
    tickListeners.delete(onChange);
    if (tickListeners.size === 0 && tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

/** 当前时间（毫秒，按分钟量化）。0 表示尚未水合。 */
export function useNowMs(): number {
  return useSyncExternalStore(
    subscribeTick,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0,
  );
}

/* ══════════════════════════════════════════════════════════════
   主题存储
   真源是 <html data-theme>，由 layout.tsx 的引导脚本在首屏前落定。
   这里把 DOM 属性当作外部存储读写，避免在 effect 里 setState。
   ══════════════════════════════════════════════════════════════ */

export type Theme = "light" | "dark";

const themeListeners = new Set<() => void>();

function subscribeTheme(onChange: () => void): () => void {
  themeListeners.add(onChange);
  return () => themeListeners.delete(onChange);
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

/** 当前主题；服务端渲染时按暗色默认。 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, readTheme, () => "dark");
}

/** 写入主题：落 DOM + localStorage，并通知订阅者。 */
export function setTheme(next: Theme): void {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("radar-theme", next);
  } catch {
    /* 隐私模式下忽略 */
  }
  for (const l of themeListeners) l();
}
