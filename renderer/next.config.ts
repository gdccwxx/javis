import type { NextConfig } from "next";

/**
 * FirstMate renderer 使用静态导出：
 * 页面层以纯静态资源形式被 Electron renderer 加载，
 * 运行时不依赖 Next.js Node server，本地能力一律走 preload IPC。
 */
const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: "./",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
