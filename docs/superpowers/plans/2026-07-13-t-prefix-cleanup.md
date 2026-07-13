# t 前缀清理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清除插件遗留的旧技术前缀，将 MCP 运行时、配置、文档和发布元数据统一到 `t-*` 命名，同时保留真实 TSB 品牌、域名、ERP 项目名和项目探测值。

**Architecture:** 在现有 Cursor 分发测试中加入 Git 跟踪文本扫描，先让测试准确列出遗留标识，再做最小范围迁移。运行时只接受新的环境变量和 profile 目录，不保留兼容别名；构建后由同一测试校验源码、文档、分发产物和独立启动能力。

**Tech Stack:** Node.js ESM、Node test runner、MCP stdio、Cursor plugin JSON、PowerShell、Git。

## Global Constraints

- 保留 `TSB ERP`、`Tsb ERP`、`TSB Soft` 等品牌表述。
- 保留 `tsbsoft.com`、`internal.tsb.com` 及其子域名。
- 保留 `Tsb.TradeErp.PC`、`Tsb.HallErp.PC` 等真实项目名和路径。
- 仅允许 `skills/t-page/profiles.md` 中的项目探测值 `tsb-erp`、`tsb-hall-user` 继续使用历史小写前缀。
- MCP 统一使用 `T_MCP_BROWSER_CHANNEL`、`T_MCP_PROFILE_DIR` 和 `TBrowserMcp`。
- 不兼容旧环境变量或旧 profile 目录；首次使用新目录时允许用户重新登录。
- 不改变 Torna/禅道工具名、入参、出参、登录规则、权限边界或业务行为。
- 不重构无关代码，不修改 ERP 项目代码，不新增依赖。
- 插件与 marketplace 版本统一提升到 `2.7.1`。

---

### Task 1: 建立旧技术标识回归门禁

**Files:**
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Consumes: `git ls-files -z` 返回的仓库跟踪文件。
- Produces: `findLegacyTechnicalIdentifiers(): Array<{ file: string, line: number, value: string }>`，只报告非白名单技术标识。

- [ ] **Step 1: 写入失败测试**

新增仓库文本扫描函数。旧前缀、旧环境变量前缀和旧 profile 名在测试中通过字符数组动态拼接，避免测试源码本身成为命中项；跳过二进制文件、`mcp/dist/` 和两个项目探测白名单。

```js
test("tracked source and docs contain no legacy plugin identifiers", () => {
  const matches = findLegacyTechnicalIdentifiers();
  assert.deepEqual(matches, [], matches.map(item => `${item.file}:${item.line} ${item.value}`).join("\n"));
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs --test-name-pattern "legacy plugin identifiers"`

Expected: FAIL，错误中至少包含 `mcp.json`、`mcp/src/zentaoCollector.mjs`、`README.md` 或 `CHANGELOG.md` 的旧技术标识位置。

- [ ] **Step 3: 单独提交回归测试**

```powershell
git add -- mcp/tests/cursorPluginDistribution.test.mjs
git commit -m "test: reject legacy plugin identifiers"
```

---

### Task 2: 迁移 MCP 运行时与配置

**Files:**
- Modify: `mcp.json`
- Modify: `mcp/src/tornaClient.mjs`
- Modify: `mcp/src/zentaoCollector.mjs`
- Modify: `scripts/install-mcp.ps1`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Consumes: `T_MCP_BROWSER_CHANNEL` 和 `T_MCP_PROFILE_DIR`。
- Produces: 默认 profile 路径 `%LOCALAPPDATA%/TBrowserMcp/playwright-profile`，浏览器默认 channel 仍为 `chrome`。

- [ ] **Step 1: 修改分发契约断言**

将 MCP 配置断言改为：

```js
assert.equal(server?.env?.T_MCP_BROWSER_CHANNEL, "chrome");
```

- [ ] **Step 2: 最小迁移运行时读取点**

仅替换三个读取点和一个默认目录：Torna 读取 `process.env.T_MCP_BROWSER_CHANNEL`；禅道读取 `process.env.T_MCP_PROFILE_DIR`、`process.env.T_MCP_BROWSER_CHANNEL`；默认目录使用 `TBrowserMcp`。

- [ ] **Step 3: 同步根配置和开发安装脚本**

`mcp.json` 与 `scripts/install-mcp.ps1` 只写 `T_MCP_BROWSER_CHANNEL = "chrome"`，不增加旧变量回退。

- [ ] **Step 4: 运行聚焦测试**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs --test-name-pattern "declares its bundled MCP"`

Expected: PASS。

- [ ] **Step 5: 提交运行时迁移**

```powershell
git add -- mcp.json mcp/src/tornaClient.mjs mcp/src/zentaoCollector.mjs scripts/install-mcp.ps1 mcp/tests/cursorPluginDistribution.test.mjs
git commit -m "refactor: rename MCP runtime identifiers"
```

---

### Task 3: 清理文档历史并发布 2.7.1

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `mcp/package.json`
- Modify: `skills/t-zentao/SKILL.md`
- Modify: `docs/superpowers/specs/2026-06-27-zentao-bug-daily-log-design.md`
- Modify: `docs/superpowers/plans/2026-06-27-zentao-bug-daily-log.md`
- Modify: `docs/superpowers/plans/2026-07-13-cursor-bundled-mcp.md`
- Modify: `docs/superpowers/specs/2026-07-13-t-prefix-cleanup-design.md`
- Modify: `.cursor-plugin/plugin.json`
- Modify: `.cursor-plugin/marketplace.json`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Produces: 面向当前 `t-*` 结构的用户文档、无废弃迁移名的历史说明、版本 `2.7.1`。

- [ ] **Step 1: 删除 README 中已失效的旧名迁移段落**

保留当前安装、卸载和项目探测说明；把卸载注释改为当前插件名，不保留旧插件名示例。

- [ ] **Step 2: 压缩 CHANGELOG 的废弃命名表**

新增 `2.7.1` 条目，说明技术标识统一、旧 profile 需要重新登录及事实标识保留边界。旧版本记录保留功能事实，但使用当前 `t-*` 文件名、Skill、Command、Agent 名，不再列出废弃名称。

- [ ] **Step 3: 更新现行说明和历史设计路径**

`mcp/package.json` 与 `skills/t-zentao/SKILL.md` 使用 `t-browser-mcp`；旧设计/计划引用改为当前 `t-*` 路径和名称。清理设计稿本身使用“旧技术标识”描述，不逐字保留废弃标识。

- [ ] **Step 4: 更新版本断言和双份元数据**

```js
assert.equal(manifest.version, "2.7.1");
assert.equal(marketplace.metadata?.version, manifest.version);
```

`.cursor-plugin/plugin.json` 与 `.cursor-plugin/marketplace.json` 同步设为 `2.7.1`。

- [ ] **Step 5: 运行命名测试并确认 GREEN**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs --test-name-pattern "legacy plugin identifiers|release metadata"`

Expected: PASS，零命中。

- [ ] **Step 6: 提交文档与版本迁移**

```powershell
git add -- README.md CHANGELOG.md mcp/package.json skills/t-zentao/SKILL.md docs/superpowers .cursor-plugin/plugin.json .cursor-plugin/marketplace.json mcp/tests/cursorPluginDistribution.test.mjs
git commit -m "docs: complete t prefix migration"
```

---

### Task 4: 重建分发并完成验证

**Files:**
- Regenerate: `mcp/dist/server.mjs`
- Regenerate: `mcp/dist/node_modules/playwright/**`
- Regenerate: `mcp/dist/node_modules/playwright-core/**`

**Interfaces:**
- Validates: 源码命名、Cursor schema、Git 导出、仓库外 MCP 启动和完整非浏览器测试集。

- [ ] **Step 1: 重建 MCP 分发**

Run: `npm run build`（cwd: `mcp`）

Expected: exit 0，并输出 `Built bundled MCP`。

- [ ] **Step 2: 运行聚焦分发测试**

Run: `node --test tests/cursorPluginDistribution.test.mjs`（cwd: `mcp`）

Expected: 全部 PASS；导出包可在仓库外列出 Torna 与禅道四个工具。

- [ ] **Step 3: 运行非浏览器测试集**

Run: `node --test tests/apiDocsPolicy.test.mjs tests/cursorPluginDistribution.test.mjs tests/minimalCodePolicy.test.mjs tests/serverSmoke.test.mjs tests/tornaClient.test.mjs tests/zentaoAnalyzer.test.mjs tests/zentaoDailyLog.test.mjs`（cwd: `mcp`）

Expected: 45 tests、0 fail。

- [ ] **Step 4: 校验 Cursor 官方 schema**

使用本机只读 Cursor plugin schema 和 Ajv 校验 `.cursor-plugin/plugin.json` 与 `.cursor-plugin/marketplace.json`。

Expected: 两份 JSON 均通过 schema。

- [ ] **Step 5: 完成静态审计**

Run: `git diff --check`

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs --test-name-pattern "legacy plugin identifiers"`

Expected: `git diff --check` 无输出；旧技术标识仅允许两个项目探测值。

- [ ] **Step 6: 审查、提交并推送**

检查完整 diff 只包含本计划范围，提交重建产物和剩余变更，随后执行 `git push origin main`。
