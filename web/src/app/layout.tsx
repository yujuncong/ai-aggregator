import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Space_Mono } from "next/font/google";
import "./globals.css";

/* 自托管字体（构建期下载并内联，无外部请求、无 FOUT） */
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-loaded",
  display: "swap",
});

const display = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Radar · 每日 AI 情报聚合",
  description:
    "三源自动聚合 · GitHub / AI 电商 / X · 每天 2 次抓取，纯静态部署，中文摘要即时可读。",
  keywords: ["AI 资讯", "AI Radar", "GitHub trending", "Product Hunt", "AI 情报"],
  openGraph: {
    title: "AI Radar · 每日 AI 情报聚合",
    description: "三源自动聚合 · 每天 2 次 · 纯静态 · 中文摘要",
    type: "website",
  },
};

/**
 * 主题引导：在首屏绘制前同步落定 data-theme，避免闪白。
 * 优先级：localStorage 显式选择 > 系统偏好 > 暗色默认。
 * 该属性即主题真源，客户端组件通过 hooks/use-clock 读写。
 */
const themeBoot = `
(function () {
  try {
    var saved = localStorage.getItem('radar-theme');
    var light = saved
      ? saved === 'light'
      : window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      data-theme="dark"
      className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0b0e14" />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a className="skip-link" href="#feed">
          跳至资讯列表
        </a>
        {children}
      </body>
    </html>
  );
}
