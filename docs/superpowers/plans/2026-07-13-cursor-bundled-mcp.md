# Cursor Bundled MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `t-erp-page` install `t-browser-mcp` with Torna and Zentao tools as a native Cursor plugin capability without repository paths or post-install dependency setup.

**Architecture:** Cursor discovers a root `mcp.json` referenced by the plugin manifest. The repository keeps editable MCP sources; `@vercel/ncc` bundles the application and MCP SDK into `mcp/dist/server.mjs`, while Playwright's package metadata and runtime resources are copied into `mcp/dist/node_modules` so the directory can start from any plugin cache location.

**Tech Stack:** Cursor plugin manifest, MCP stdio, Node.js ESM, `@modelcontextprotocol/sdk`, Playwright, `@vercel/ncc`, Node test runner, PowerShell export tooling.

## Global Constraints

- The bundled MCP contains both Torna and Zentao capabilities under the existing `t-browser-mcp` name.
- Plugin users do not run `npm install`, `install-mcp.ps1`, or edit global `~/.cursor/mcp.json`.
- Runtime configuration uses `${CURSOR_PLUGIN_ROOT}` and contains no developer-specific absolute path.
- Do not change Torna/Zentao tool names, schemas, authentication, permission boundaries, or business behavior.
- Do not modify ERP project code or refactor unrelated plugin code.
- Generated runtime must start after `mcp/dist` is copied outside the repository and without resolving the development `mcp/node_modules` directory.

---

### Task 1: Add the Cursor plugin MCP distribution contract

**Files:**
- Create: `mcp/tests/cursorPluginDistribution.test.mjs`
- Create: `mcp.json`
- Modify: `.cursor-plugin/plugin.json`

**Interfaces:**
- Produces: root `mcp.json` server entry `mcpServers.t-browser-mcp` and manifest path `mcpServers: "./mcp.json"`.

- [ ] **Step 1: Write the failing configuration test**

The test reads the root manifest and MCP config, asserting the native component declaration, `${CURSOR_PLUGIN_ROOT}/mcp/dist/server.mjs`, Chrome channel, and absence of Windows absolute paths.

- [ ] **Step 2: Run the test and verify it fails because `mcp.json` and `mcpServers` are missing**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs`

- [ ] **Step 3: Add the minimal plugin-native MCP config**

Create:

```json
{
  "mcpServers": {
    "t-browser-mcp": {
      "command": "node",
      "args": ["${CURSOR_PLUGIN_ROOT}/mcp/dist/server.mjs"],
      "env": { "TSB_MCP_BROWSER_CHANNEL": "chrome" }
    }
  }
}
```

Add `"mcpServers": "./mcp.json"` to `.cursor-plugin/plugin.json`.

- [ ] **Step 4: Run the configuration test and verify it now only fails for the missing bundle**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs`

---

### Task 2: Build and prove an isolated MCP runtime

**Files:**
- Modify: `mcp/package.json`
- Modify: `mcp/package-lock.json`
- Create: `mcp/scripts/build.mjs`
- Create: `mcp/dist/server.mjs`
- Modify: `mcp/tests/serverSmoke.test.mjs`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Consumes: `mcp/src/server.mjs`.
- Produces: `npm run build` and self-contained `mcp/dist` containing `server.mjs` plus Playwright runtime packages.

- [ ] **Step 1: Extend the failing test to copy `mcp/dist` to a temporary directory and list MCP tools**

Use `StdioClientTransport` with the copied temp file and assert these names:

```text
torna_search_api
torna_get_api_detail
zentao_collect_assigned_tasks
zentao_analyze_tasks
```

- [ ] **Step 2: Run the test and verify it fails because the distribution bundle does not exist**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs`

- [ ] **Step 3: Add the minimal ncc build**

Add `@vercel/ncc` as a development dependency and a `build` script. `mcp/scripts/build.mjs` invokes ncc on `src/server.mjs`, keeps `playwright` external, writes the bundled application to `dist/server.mjs`, and copies `playwright` plus `playwright-core` into `dist/node_modules`.

- [ ] **Step 4: Generate the runtime and rerun isolated tests**

Run: `npm run build` from `mcp`.

Run: `node --test tests/cursorPluginDistribution.test.mjs tests/serverSmoke.test.mjs` from `mcp`.

- [ ] **Step 5: Run the entire MCP suite**

Run: `npm test` from `mcp`.

---

### Task 3: Make Marketplace export include and validate the bundled MCP

**Files:**
- Modify: `scripts/export-github-repo.ps1`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Consumes: root `mcp.json`, `mcp/dist/server.mjs`.
- Produces: exported plugin containing both files and excluding `mcp/node_modules`.

- [ ] **Step 1: Add a failing export contract test**

The test checks that the export script includes root `mcp.json`, runs the MCP build before copying, and excludes `mcp/node_modules` from distribution.

- [ ] **Step 2: Run the focused test and observe the missing export behavior**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs`

- [ ] **Step 3: Update the export script minimally**

Invoke `npm run build` in `mcp`, add `mcp.json` to `$include`, and remove only the resolved `<ExportDir>\mcp\node_modules` after verifying it is inside the resolved export directory.

- [ ] **Step 4: Export to a temporary directory and assert files**

Run `scripts/export-github-repo.ps1` with a temporary `-ExportDir`; assert `mcp.json` and `mcp/dist/server.mjs` exist and `mcp/node_modules` does not.

---

### Task 4: Update plugin installation guidance and release metadata

**Files:**
- Modify: `.cursor-plugin/plugin.json`
- Modify: `.cursor-plugin/marketplace.json`
- Modify: `README.md`
- Modify: `mcp/README.md`
- Modify: `PUBLISH.md`
- Modify: `CHANGELOG.md`
- Modify: `scripts/install-mcp.ps1`

**Interfaces:**
- Produces: version `2.7.0` and one-install guidance.

- [ ] **Step 1: Add documentation assertions to the distribution test**

Assert version parity, plugin-native installation guidance, and a duplicate-registration warning for legacy global MCP users.

- [ ] **Step 2: Run the test and verify the current documentation fails the new contract**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs`

- [ ] **Step 3: Update only MCP distribution documentation and metadata**

Set both plugin metadata versions to `2.7.0`. Document that normal users only install the plugin, while `install-mcp.ps1` is a legacy development helper that must not be used alongside the bundled MCP.

- [ ] **Step 4: Run focused and full verification**

Run: `npm run build && npm test` from `mcp`.

Run: `git diff --check` from the repository root.

---

### Task 5: Validate the installed plugin outside the source repository

**Files:**
- No production file changes unless verification exposes a defect.

**Interfaces:**
- Validates: actual local Cursor plugin package and isolated MCP startup.

- [ ] **Step 1: Run the export to a fresh temporary directory**

Use a checked absolute path under the current user's temp directory.

- [ ] **Step 2: Start the exported `mcp/dist/server.mjs` through an MCP client and list all tools**

The launch working directory must be the temporary export, not `D:\company\HhEmpower`.

- [ ] **Step 3: Install or refresh the local Cursor plugin from the source repository**

Use the existing local plugin installation flow. Do not modify unrelated global Cursor settings. Report the existing global `t-browser-mcp` duplicate separately instead of silently deleting it.

- [ ] **Step 4: Run final review and complete verification**

Review the complete diff against `docs/superpowers/specs/2026-07-13-cursor-bundled-mcp-design.md`, rerun the full suite, and inspect `git status` before reporting completion.
