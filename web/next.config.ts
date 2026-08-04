import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 静态导出：GitHub Pages 需要纯静态 out/ */
  output: "export",
  /* GitHub Pages 项目页挂在 /ai-aggregator 子路径下，basePath 让所有静态资源前缀对齐 */
  basePath: "/ai-aggregator",
  images: { unoptimized: true },
};

export default nextConfig;
