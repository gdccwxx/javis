/**
 * Electron 主进程 + preload 打包脚本。
 * 用 esbuild 把 TS 打成 CommonJS，输出到 dist/。
 */
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const outdir = resolve(root, "dist");
mkdirSync(outdir, { recursive: true });

const shared = {
  platform: "node",
  target: "node22",
  bundle: true,
  sourcemap: true,
  external: ["electron"],
  logLevel: "info",
};

await build({
  ...shared,
  entryPoints: [resolve(root, "src/main.ts")],
  outfile: resolve(outdir, "main.cjs"),
  format: "cjs",
});

await build({
  ...shared,
  entryPoints: [resolve(root, "src/preload.ts")],
  outfile: resolve(outdir, "preload.cjs"),
  format: "cjs",
});

console.log("electron build done ->", outdir);
