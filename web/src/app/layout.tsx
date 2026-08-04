import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Radar · AI 资讯聚合站",
  description:
    "每天 2 次自动聚合 X / AI 电商 / GitHub 三大源的 AI 资讯 · 纯静态 · 自动部署",
};

const themeScript = `
  (function () {
    try {
      var m = window.matchMedia('(prefers-color-scheme: dark)');
      var set = function (dark) { document.documentElement.classList.toggle('dark', dark); };
      set(m.matches);
      m.addEventListener('change', function (e) { set(e.matches); });
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
