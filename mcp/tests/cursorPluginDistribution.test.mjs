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

function findLegacyTechnicalIdentifiers() {
  const legacyLower = String.fromCharCode(116, 115, 98);
  const legacyUpper = legacyLower.toUpperCase();
  const legacyTitle = `${legacyUpper[0]}${legacyLower.slice(1)}`;
  const allowedDashedNames = new Set(["tsb-erp", "tsb-hall-user"]);
  const allowedLowercaseFragments = [
    `${legacyLower}soft.com`,
    `internal.${legacyLower}.com`,
    `internal\\.${legacyLower}\\.com`
  ];
  const patterns = [
    new RegExp(`\\b${legacyLower}-[a-z0-9-]+\\b`, "gi"),
    new RegExp(`\\b${legacyLower}_[a-z0-9_]+\\b`, "gi"),
    new RegExp(`\\b${legacyLower}\\b(?![-_])`, "g"),
    new RegExp(`\\b${legacyUpper}_MCP_[A-Z0-9_]+\\b`, "g"),
    new RegExp(`\\b${legacyTitle}BrowserMcp\\b`, "g"),
    new RegExp(`\\b${legacyUpper}\\s+Browser\\s+MCP\\b`, "g")
  ];
  const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8"
  }).split("\0").filter(Boolean);
  const matches = [];
  const seen = new Set();

  for (const file of trackedFiles) {
    if (file.startsWith("mcp/dist/")) continue;

    const content = fs.readFileSync(path.join(repoRoot, file));
    if (content.includes(0)) continue;

    for (const [index, line] of content.toString("utf8").split(/\r?\n/).entries()) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          const normalized = match[0].toLowerCase();
          if (allowedDashedNames.has(normalized)) continue;
          if (
            normalized === legacyLower &&
            allowedLowercaseFragments.some(fragment => line.includes(fragment))
          ) continue;
          const key = `${file}:${index + 1}:${match.index}:${normalized}`;
          if (seen.has(key)) continue;
          seen.add(key);
          matches.push({ file, line: index + 1, value: match[0] });
        }
      }
    }
  }

  return matches;
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

test("tracked source and docs contain no legacy plugin identifiers", () => {
  const matches = findLegacyTechnicalIdentifiers();
  const details = matches.map(item => `${item.file}:${item.line} ${item.value}`).join("\n");

  assert.equal(matches.length, 0, details);
});

test("Cursor plugin declares its bundled MCP without developer-specific paths", () => {
  const manifest = readJson(".cursor-plugin/plugin.json");
  const marketplace = readJson(".cursor-plugin/marketplace.json");
  const mcpConfig = readJson("mcp.json");
  const server = mcpConfig.mcpServers?.["t-browser-mcp"];

  assert.equal(manifest.mcpServers, "./mcp.json");
  assert.equal(server?.command, "node");
  assert.deepEqual(server?.args, ["${CURSOR_PLUGIN_ROOT}/mcp/dist/server.mjs"]);
  assert.equal(server?.env?.T_MCP_BROWSER_CHANNEL, "chrome");
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
    "mcp/dist/node_modules/playwright-core/package.json",
    "mcp/dist/vendor/dws/LICENSE",
    "mcp/dist/vendor/dws/NOTICE",
    "mcp/dist/vendor/dws/package.json",
    "mcp/dist/vendor/dws/darwin-x64/dws",
    "mcp/dist/vendor/dws/darwin-arm64/dws",
    "mcp/dist/vendor/dws/linux-x64/dws",
    "mcp/dist/vendor/dws/linux-arm64/dws",
    "mcp/dist/vendor/dws/win32-x64/dws.exe",
    "mcp/dist/vendor/dws/win32-arm64/dws.exe"
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
      "zentao_analyze_tasks",
      "dingtalk_auth_status",
      "dingtalk_auth_login",
      "dingtalk_search_groups",
      "dingtalk_search_messages",
      "dingtalk_list_messages",
      "dingtalk_list_all_messages"
    ]) {
      assert.ok(names.includes(name), `missing bundled MCP tool: ${name}`);
    }

    const platformDir = `${process.platform}-${process.arch}`;
    const binaryName = process.platform === "win32" ? "dws.exe" : "dws";
    const dwsBinary = path.join(exportDir, "mcp/dist/vendor/dws", platformDir, binaryName);
    const version = execFileSync(dwsBinary, ["--version"], { encoding: "utf8" });
    assert.match(version, /dws version v1\.0\.51/);

    const mockOutput = execFileSync(
      dwsBinary,
      ["--mock", "-f", "json", "chat", "search", "--query", "项目", "--limit", "1"],
      { encoding: "utf8" }
    );
    assert.equal(JSON.parse(mockOutput).success, true);

    const authResult = await client.callTool({
      name: "dingtalk_auth_status",
      arguments: {}
    });
    const authText = authResult.content.map(item => item.text || "").join("\n");
    assert.match(authText, /dws version v1\.0\.51/);
    assert.match(authText, /OAuth/);
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

  assert.equal(manifest.version, "2.8.0");
  assert.equal(marketplace.metadata?.version, manifest.version);
  assert.match(docs, /插件内置 MCP/);
  assert.match(docs, /无需.*install-mcp\.ps1/);
  assert.match(legacyInstaller, /development|legacy/i);
  assert.match(legacyInstaller, /duplicate|同时启用/i);
  assert.deepEqual([...localInstaller.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});
