# Torna API Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 TSB ERP 增加默认 Torna、显式 Swagger 的 API 文档检索能力，并以整洁 Markdown 表格返回接口、入参和出参。

**Architecture:** 在现有 `t-browser-mcp` 中增加独立 Torna 只读客户端，使用非持久化浏览器登录并只在 MCP 进程内存中保留 token。新增 `t-api-docs` 作为文档来源分流和检索规则的单一事实源，其他入口仅引用并执行该规则。

**Tech Stack:** Node.js ESM、Playwright、Model Context Protocol、Node test runner、Markdown skills/rules/agents。

## Global Constraints

- 普通“接口/API 文档”默认 Torna；只有明确说 Swagger/OpenAPI 才走 Swagger。
- Torna 只读，不保存凭据、Cookie、token 或临时 JSON。
- 多个合理候选必须向用户确认。
- 不修改 ERP 项目源码，不顺手重构现有 Zentao MCP。
- 保留用户现有暂存文件，不处理 `.playwright-cli` 暂存内容。

---

### Task 1: Torna 领域逻辑与格式化

**Files:**
- Create: `mcp/src/tornaClient.mjs`
- Create: `mcp/tests/tornaClient.test.mjs`

- [ ] 写项目映射、候选筛选、重复候选和 Markdown 表格的失败测试。
- [ ] 运行 `node --test tests/tornaClient.test.mjs`，确认因模块缺失失败。
- [ ] 实现最小纯函数与格式化逻辑。
- [ ] 再次运行测试并确认通过。

### Task 2: Torna 浏览器只读访问与 MCP 工具

**Files:**
- Modify: `mcp/src/tornaClient.mjs`
- Modify: `mcp/src/server.mjs`
- Modify: `mcp/tests/serverSmoke.test.mjs`

- [ ] 先扩展 smoke test，要求暴露 `torna_search_api` 和 `torna_get_api_detail`。
- [ ] 实现持久化登录态、只读请求和清晰错误信息。
- [ ] 运行 MCP 全部测试。

### Task 3: Skill 与入口同步

**Files:**
- Create: `skills/t-api-docs/SKILL.md`
- Modify: `skills/t-page/SKILL.md`
- Modify: `skills/t-page/profiles.md`
- Modify: `skills/t-workflow/SKILL.md`
- Modify: `skills/t-field/SKILL.md`
- Modify: `skills/t-standards/reference.md`
- Modify: `agents/t-api.md`
- Modify: `commands/t-start.md`
- Modify: `commands/t-review.md`
- Modify: `rules/t-agent-guidance.mdc`
- Modify: `mcp/README.md`
- Modify: `mcp/package.json`

- [ ] 增加来源分流压力测试/静态断言，确认现状未规定默认 Torna。
- [ ] 写 `t-api-docs` 单一事实源并让其他入口引用。
- [ ] 验证四个项目映射、默认 Torna、显式 Swagger、重复候选停问和临时文件清理规则均存在。

### Task 4: 完整验证

- [ ] 运行 `npm test`。
- [ ] 扫描所有 Swagger/Torna 文案，确认没有普通 API 文档误路由到 Swagger。
- [ ] 检查 `git diff` 和 `git status`，确认没有触碰用户暂存文件或范围外内容。
