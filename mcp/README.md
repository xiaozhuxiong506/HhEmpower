# t-browser-mcp

`t-erp-page` 插件内置 MCP server：Torna 接口文档、禅道任务、钉钉聊天记录，全部只读。

MCP 只提供事实源与执行包，不做业务、权限或上线批准。采集到的任务内容必须以原文传递，摘要不能替代原文。

## 安装

随插件自动安装，开箱即用：无需 `install-mcp.ps1`、无需 `npm install`、无需修改 `~/.cursor/mcp.json`。安装或更新后重启 Cursor，在 **Settings → Tools & MCP** 确认只存在一个启用的 `t-browser-mcp`。

内置 Playwright 运行库与钉钉官方 DWS `v1.0.51` 多平台二进制；浏览器复用本机 Chrome，不额外下载 Chromium。

> `scripts/install-mcp.ps1` 仅用于源码开发与旧版兼容调试。它会写入全局 MCP 配置，不能与插件内置 MCP 同时启用，否则出现重复工具与进程。

## 工具

### Torna · 接口文档

| 工具 | 说明 |
| --- | --- |
| `torna_search_api` | 按系统、名称/路径、模块、HTTP 方法检索 `docs.internal.tsb.com`；唯一命中时附请求/响应参数与格式化示例。默认走 Torna，仅用户明确指定 Swagger/OpenAPI 时不调用 |
| `torna_get_api_detail` | 按文档 ID 读取接口详情。只读，不调试、不编辑、不导入导出，不输出 Cookie、token 与敏感请求头 |

### 禅道 · 任务采集

| 工具 | 说明 |
| --- | --- |
| `zentao_collect_assigned_work_items` | 统一采集"指派给我"的 Task 与 Bug，一次登录会话内完成并复用。`TSBERP*` 归贸易系统，`HALLERP*` 归展厅系统；Task 标记 `[禅道需求]`，Bug 标记 `[禅道Bug]`，按系统和模块输出紧凑总览表 + 逐条处理方案（方案在对应代码上方） |
| `zentao_collect_assigned_tasks` | 兼容入口：采集任务 ID、URL、标题、内容、备注，按模块分类并生成 `agentPlan`，要求后续 agent 从 `t-page` 进入并继承全部红线关卡 |
| `zentao_analyze_work_items` | 不开浏览器，对已有 Task/Bug JSON 按系统与模块分组，输出创建者、截止日期、共享影响与处理方案 |
| `zentao_analyze_tasks` | 不开浏览器，对已有任务 JSON 做模块分类与多 agent 执行包生成。输入必须保留原始字段，不能只有摘要 |
| `zentao_schedule_tasks` | 仅排期 Task：用户确认模块日期与工时（`1h`/`2h`）后按精确 ID 批量设置状态、截止日期、预计/消耗/剩余；拒绝 Bug 与不完整指令 |
| `zentao_resolve_bugs` | 仅解决已确认且验证通过的 Bug：解决版本=主干、解决日期=当前时间前 30 分钟，其余字段不改，不执行关闭 |

### 钉钉 · 聊天只读

| 工具 | 说明 |
| --- | --- |
| `dingtalk_auth_status` / `dingtalk_auth_login` | 检查 DWS 与 OAuth 状态，未登录时走官方授权流程。不接收密码、Cookie 或固定 Token |
| `dingtalk_search_groups` | 按群名关键词检索当前用户可访问的群聊，多候选交用户确认 |
| `dingtalk_search_messages` | 按关键词、ISO-8601 时间范围与可选 `openConversationId` 搜索消息 |
| `dingtalk_list_messages` / `dingtalk_list_all_messages` | 读取指定会话或授权时间范围内的全部会话，返回分页游标与边界时间 |

## 首次登录

- **禅道** —— 持久化浏览器 profile。首次弹出登录页时在浏览器中登录后重跑同一工具；采集、排期、解决复用同一会话并串行执行
- **Torna** —— 非持久化 context。token 只存于当前 MCP 进程内存，浏览器关闭即失效，不落盘、不保存账号密码
- **钉钉** —— 需企业管理员为组织开启 CLI 访问。聊天记录只在当前响应中返回，禁止落盘；发送、回复、撤回、转发与群管理未开放
