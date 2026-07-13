# 钉钉聊天只读接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `t-erp-page` 插件增加基于钉钉官方 DWS 的 OAuth 登录、群聊检索和聊天记录只读查询能力，并验证插件独立分发后可运行。

**Architecture:** 现有 `t-browser-mcp` 继续作为唯一 MCP 入口，新建独立 `dingtalkClient.mjs`，只允许固定的 DWS 只读命令映射。构建时从 `dingtalk-workspace-cli` npm 包精准提取各平台官方二进制与许可证到 `mcp/dist/vendor/dws`，不执行其用户级 Skill 安装逻辑；运行时从插件自身目录定位，不依赖全局安装或开发者仓库路径。

**Tech Stack:** Node.js ESM、`@modelcontextprotocol/sdk`、`node:child_process`、钉钉官方 `dingtalk-workspace-cli`、Node test runner、Cursor Plugin MCP。

## Global Constraints

- 默认只读，不开放发送、回复、撤回、转发或群管理。
- 登录只走钉钉官方 OAuth，不接收密码、Cookie、Access Token 或固定凭证。
- 只能读取当前登录用户被授权访问的会话。
- MCP 不接受任意 DWS 命令字符串，只接受强类型参数并映射到固定命令。
- 查询结果不落盘，不写项目文件、临时 JSON 或长期记忆。
- 不修改 ERP 项目代码，不重构 Torna、禅道及其他现有能力。

---

### Task 1: DWS 运行器与只读查询客户端

**Files:**
- Create: `mcp/src/dingtalkClient.mjs`
- Create: `mcp/tests/dingtalkClient.test.mjs`
- Modify: `mcp/package.json`
- Modify: `mcp/package-lock.json`

**Interfaces:**
- Produces: `getDingTalkAuthStatus(options)`、`loginDingTalk(options)`、`searchDingTalkGroups(options)`、`searchDingTalkMessages(options)`、`listDingTalkMessages(options)`、`listAllDingTalkMessages(options)`。
- Produces: `formatDingTalkResult(title, result, context)`，返回 `{ data, markdown }`。
- Consumes: 插件内官方 DWS 二进制；测试通过 Node `child_process.spawn` mock 注入伪运行器，生产代码不保留运行时替换入口。

- [ ] **Step 1: 写参数映射、互斥条件、分页和错误处理的失败测试**
- [ ] **Step 2: 运行 `node --test tests/dingtalkClient.test.mjs`，确认因客户端不存在而失败**
- [ ] **Step 3: 实现插件内 DWS 定位、受控子进程执行、JSON 解析和 Markdown 表格输出**
- [ ] **Step 4: 添加 `dingtalk-workspace-cli@1.0.51` 精确依赖并更新锁文件**
- [ ] **Step 5: 重跑客户端测试，确认全部通过**

### Task 2: MCP 工具注册与协议验证

**Files:**
- Modify: `mcp/src/server.mjs`
- Modify: `mcp/tests/serverSmoke.test.mjs`

**Interfaces:**
- Consumes: Task 1 的六个公开客户端函数。
- Produces: `dingtalk_auth_status`、`dingtalk_auth_login`、`dingtalk_search_groups`、`dingtalk_search_messages`、`dingtalk_list_messages`、`dingtalk_list_all_messages` MCP 工具。

- [ ] **Step 1: 扩展 smoke test，要求六个工具名称、描述和关键 schema 可发现**
- [ ] **Step 2: 运行 smoke test，确认缺少工具时失败**
- [ ] **Step 3: 在 `server.mjs` 注册工具并把调用路由到 Task 1 客户端**
- [ ] **Step 4: 运行 smoke test，确认 MCP 协议发现通过**

### Task 3: 插件独立分发 DWS 运行时

**Files:**
- Modify: `mcp/scripts/build.mjs`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`
- Regenerate: `mcp/dist/server.mjs`
- Regenerate: `mcp/dist/node_modules/dingtalk-workspace-cli/**`

**Interfaces:**
- Consumes: `mcp/node_modules/dingtalk-workspace-cli`。
- Produces: 可从任意导出目录运行的插件内 DWS 多平台二进制、许可证和 MCP bundle。

- [ ] **Step 1: 扩展分发测试，要求导出包包含 DWS 各平台二进制和许可证**
- [ ] **Step 2: 运行分发测试，确认当前构建缺少 DWS 时失败**
- [ ] **Step 3: 修改构建脚本精准提取官方 DWS 多平台二进制和许可证，同时保留 Playwright 复制逻辑**
- [ ] **Step 4: 执行 `npm run build` 生成新的 `mcp/dist`**
- [ ] **Step 5: 从临时导出目录启动 MCP，执行工具发现和内置 DWS `--version`/`--mock` 链路测试**

### Task 4: Skill、命令与安全文案

**Files:**
- Create: `skills/t-dingtalk/SKILL.md`
- Create: `commands/t-dingtalk-read.md`
- Modify: `skills/README.md`
- Modify: `README.md`
- Modify: `mcp/README.md`

**Interfaces:**
- Produces: 钉钉意图触发、登录门禁、只读边界、多候选确认和标准输出流程。
- Consumes: Task 2 的六个 MCP 工具。

- [ ] **Step 1: 编写 `t-dingtalk` Skill，覆盖钉钉、聊天记录、群聊、消息搜索等触发词**
- [ ] **Step 2: 编写 `/t-dingtalk-read` 命令，按状态检查、OAuth、查群、查消息顺序执行**
- [ ] **Step 3: 更新插件与 MCP 文档，明确企业管理员授权和只读限制**
- [ ] **Step 4: 运行 Skill 快速校验，确认 frontmatter、命名和引用有效**

### Task 5: 版本、实机授权与总回归

**Files:**
- Modify: `.cursor-plugin/plugin.json`
- Modify: `.cursor-plugin/marketplace.json`
- Modify: `CHANGELOG.md`
- Modify: `PUBLISH.md`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Produces: 版本一致的可发布插件及实测结果。

- [ ] **Step 1: 将插件版本同步提升为 `2.8.0` 并记录钉钉只读能力**
- [ ] **Step 2: 使用插件内 DWS 执行版本、认证状态和 mock 查询**
- [ ] **Step 3: 启动 OAuth 登录并按钉钉返回结果验证真实只读查询；权限不足时记录准确阻塞原因**
- [ ] **Step 4: 运行 `npm test`、Skill 校验、`git diff --check`、旧标识扫描和敏感信息扫描**
- [ ] **Step 5: 检查 `git diff --stat` 与改动文件，确认没有 ERP 代码和范围外重构**
