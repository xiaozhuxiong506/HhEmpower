import AdmZip from "adm-zip";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ncc from "@vercel/ncc";
import { x as extractTar } from "tar";

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPath = path.join(mcpRoot, "src/server.mjs");
const distDir = path.join(mcpRoot, "dist");
const outputPath = path.join(distDir, "server.mjs");
const dwsPackageRoot = path.join(mcpRoot, "node_modules", "dingtalk-workspace-cli");

const dwsPlatforms = {
  "darwin-x64": { archive: "dws-darwin-amd64.tar.gz", binary: "dws" },
  "darwin-arm64": { archive: "dws-darwin-arm64.tar.gz", binary: "dws" },
  "linux-x64": { archive: "dws-linux-amd64.tar.gz", binary: "dws" },
  "linux-arm64": { archive: "dws-linux-arm64.tar.gz", binary: "dws" },
  "win32-x64": { archive: "dws-windows-amd64.zip", binary: "dws.exe" },
  "win32-arm64": { archive: "dws-windows-arm64.zip", binary: "dws.exe" }
};

async function findFile(root, fileName) {
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFile(entryPath, fileName);
      if (nested) return nested;
    } else if (entry.name === fileName) {
      return entryPath;
    }
  }
  return "";
}

// 只提取插件需要的官方二进制，避免执行 DWS install.js 写入用户级 Skills。
async function bundleDwsRuntime() {
  const vendorRoot = path.join(distDir, "vendor", "dws");
  const assetsRoot = path.join(dwsPackageRoot, "assets");

  for (const [platform, config] of Object.entries(dwsPlatforms)) {
    const archivePath = path.join(assetsRoot, config.archive);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "t-dws-build-"));
    try {
      if (config.archive.endsWith(".zip")) {
        new AdmZip(archivePath).extractAllTo(tempDir, true);
      } else {
        await extractTar({ file: archivePath, cwd: tempDir });
      }

      const sourceBinary = await findFile(tempDir, config.binary);
      if (!sourceBinary) {
        throw new Error(`DWS archive missing ${config.binary}: ${config.archive}`);
      }

      const targetDir = path.join(vendorRoot, platform);
      const targetBinary = path.join(targetDir, config.binary);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(sourceBinary, targetBinary);
      if (!config.binary.endsWith(".exe")) await fs.chmod(targetBinary, 0o755);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  const skillsArchive = new AdmZip(path.join(assetsRoot, "dws-skills.zip"));
  for (const fileName of ["LICENSE", "NOTICE"]) {
    const entry = skillsArchive.getEntry(fileName);
    if (!entry) throw new Error(`DWS skills archive missing ${fileName}`);
    await fs.writeFile(path.join(vendorRoot, fileName), entry.getData());
  }
  await fs.copyFile(path.join(dwsPackageRoot, "package.json"), path.join(vendorRoot, "package.json"));
}

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

await bundleDwsRuntime();

console.log(`Built bundled MCP: ${outputPath}`);
