import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 静态导出：GitHub Pages 需要纯静态 out/ */
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
