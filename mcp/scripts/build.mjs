import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ncc from "@vercel/ncc";

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPath = path.join(mcpRoot, "src/server.mjs");
const distDir = path.join(mcpRoot, "dist");
const outputPath = path.join(distDir, "server.mjs");

const { code, assets } = await ncc(entryPath, {
  externals: ["playwright"],
  minify: true,
  sourceMap: false,
  target: "es2022"
});

const assetNames = Object.keys(assets);
if (assetNames.length > 0) {
  throw new Error(`MCP bundle emitted unsupported runtime assets: ${assetNames.join(", ")}`);
}

// Playwright includes CommonJS dependencies that still read these globals after ESM bundling.
const esmRuntimePrelude = [
  'import { dirname as __bundleDirname } from "node:path";',
  'import { fileURLToPath as __bundleFileURLToPath } from "node:url";',
  "globalThis.__filename = __bundleFileURLToPath(import.meta.url);",
  "globalThis.__dirname = __bundleDirname(globalThis.__filename);",
  ""
].join("\n");

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(distDir, { recursive: true });
await fs.writeFile(outputPath, esmRuntimePrelude + code, "utf8");

for (const packageName of ["playwright", "playwright-core"]) {
  const sourceDir = path.join(mcpRoot, "node_modules", packageName);
  const targetDir = path.join(distDir, "node_modules", packageName);
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

console.log(`Built bundled MCP: ${outputPath}`);
