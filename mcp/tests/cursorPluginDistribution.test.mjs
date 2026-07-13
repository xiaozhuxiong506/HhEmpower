import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function runExport(exportDir, pluginRoot = repoRoot) {
  return spawnSync(
    process.platform === "win32" ? "powershell.exe" : "pwsh",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(repoRoot, "scripts/export-github-repo.ps1"),
      "-PluginRoot",
      pluginRoot,
      "-ExportDir",
      exportDir
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );
}

test("Cursor plugin declares its bundled MCP without developer-specific paths", () => {
  const manifest = readJson(".cursor-plugin/plugin.json");
  const marketplace = readJson(".cursor-plugin/marketplace.json");
  const mcpConfig = readJson("mcp.json");
  const server = mcpConfig.mcpServers?.["t-browser-mcp"];

  assert.equal(manifest.mcpServers, "./mcp.json");
  assert.equal(server?.command, "node");
  assert.deepEqual(server?.args, ["${CURSOR_PLUGIN_ROOT}/mcp/dist/server.mjs"]);
  assert.equal(server?.env?.TSB_MCP_BROWSER_CHANNEL, "chrome");
  assert.equal(Object.hasOwn(marketplace, "displayName"), false);
  assert.equal(Object.hasOwn(marketplace.plugins[0], "logo"), false);

  const serialized = JSON.stringify({ manifest, mcpConfig });
  assert.doesNotMatch(serialized, /[A-Za-z]:\\/);
  assert.doesNotMatch(serialized, /D:\\company\\HhEmpower/i);
});

test("exported and Git-tracked MCP starts outside the repository", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "t-browser-mcp-plugin-"));
  const exportDir = path.join(tempRoot, "plugin");
  const exportResult = runExport(exportDir);

  assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);

  execFileSync("git", ["init", "--quiet"], { cwd: exportDir });
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "."], { cwd: exportDir });
  const trackedFiles = execFileSync("git", ["ls-files"], {
    cwd: exportDir,
    encoding: "utf8"
  }).split(/\r?\n/);

  for (const requiredFile of [
    ".gitattributes",
    "mcp.json",
    "mcp/dist/server.mjs",
    "mcp/dist/node_modules/playwright/package.json",
    "mcp/dist/node_modules/playwright-core/package.json"
  ]) {
    assert.ok(trackedFiles.includes(requiredFile), `untracked distribution file: ${requiredFile}`);
  }
  assert.equal(trackedFiles.some(file => file.startsWith("mcp/node_modules/")), false);

  const isolatedServer = path.join(exportDir, "mcp/dist/server.mjs");

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [isolatedServer],
    cwd: tempRoot
  });
  const client = new Client(
    { name: "t-browser-mcp-distribution-test", version: "0.1.0" },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    const result = await client.listTools();
    const names = result.tools.map(tool => tool.name);

    for (const name of [
      "torna_search_api",
      "torna_get_api_detail",
      "zentao_collect_assigned_tasks",
      "zentao_analyze_tasks"
    ]) {
      assert.ok(names.includes(name), `missing bundled MCP tool: ${name}`);
    }
  } finally {
    await client.close().catch(() => {});
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("Marketplace export rejects a target inside the plugin source", () => {
  const unsafeTarget = path.join(repoRoot, "unsafe-export-target");
  const exportResult = runExport(unsafeTarget);

  assert.notEqual(exportResult.status, 0);
  assert.match(`${exportResult.stdout}\n${exportResult.stderr}`, /Unsafe export directory/);
  assert.equal(fs.existsSync(unsafeTarget), false);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "t-browser-mcp-safety-"));
  const fakePluginRoot = path.join(tempRoot, "plugin");
  fs.mkdirSync(fakePluginRoot);
  try {
    const parentResult = runExport(`${tempRoot}${path.sep}`, fakePluginRoot);
    assert.notEqual(parentResult.status, 0);
    assert.match(`${parentResult.stdout}\n${parentResult.stderr}`, /Unsafe export directory/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("release metadata and docs describe one-install bundled MCP behavior", () => {
  const manifest = readJson(".cursor-plugin/plugin.json");
  const marketplace = readJson(".cursor-plugin/marketplace.json");
  const docs = [readText("README.md"), readText("mcp/README.md"), readText("PUBLISH.md")].join("\n");
  const legacyInstaller = readText("scripts/install-mcp.ps1");
  const localInstaller = fs.readFileSync(path.join(repoRoot, "scripts/install-local.ps1"));

  assert.equal(manifest.version, "2.7.0");
  assert.equal(marketplace.metadata?.version, manifest.version);
  assert.match(docs, /插件内置 MCP/);
  assert.match(docs, /无需.*install-mcp\.ps1/);
  assert.match(legacyInstaller, /development|legacy/i);
  assert.match(legacyInstaller, /duplicate|同时启用/i);
  assert.deepEqual([...localInstaller.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});
