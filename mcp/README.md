# t-browser-mcp

本目录提供 Cursor 插件内置 MCP server，包含 Torna API 文档只读检索、禅道任务自动化和钉钉聊天记录只读工具。

MCP 只提供事实来源和执行包，不提供业务批准、权限批准或上线批准。采集到的任务 ID、URL、标题、内容、备注、描述和日志必须作为原文事实源传递给后续 agent；摘要不能替代原文。

## 安装

MCP 随 `t-erp-page` 插件自动安装。普通用户无需运行 `install-mcp.ps1`、无需执行 `npm install`，也不需要修改 `~/.cursor/mcp.json`。安装或更新插件后重启 Cursor，在 **Settings -> Tools & MCP** 中确认只存在一个已启用的 `t-browser-mcp`。

插件已包含 MCP、Playwright 运行库和钉钉官方 DWS `v1.0.51` 多平台二进制。浏览器自动化直接使用目标电脑已安装的 Google Chrome，不会在插件安装后下载额外 Chromium；钉钉 DWS 不需要全局安装。

`scripts/install-mcp.ps1` 仅保留给源码开发和旧版本兼容调试。它会写入全局 Cursor MCP 配置，不能与插件内置 MCP 同时启用，否则会出现重复工具或重复进程。

## 工具

- `torna_search_api`

  按系统、名称/路径、应用模块和 HTTP 方法检索 `http://docs.internal.tsb.com`。候选以 Markdown 表格返回；唯一命中时默认追加请求参数、响应参数和格式化示例。普通接口/API 文档查询使用 Torna；只有用户明确指定 Swagger/OpenAPI 时才不调用本工具。

- `torna_get_api_detail`

  按真实 Torna 文档 ID 读取接口详情，输出基本信息、请求参数、响应参数、请求示例和响应示例。工具只调用 Torna 只读接口，不执行调试、Mock、编辑、导入或删除，也不输出 Cookie、token 和敏感请求头。

- `zentao_collect_assigned_tasks`

  打开 `http://hallzd.internal.tsb.com/zentao/my.html`，进入“指派给我”任务列表，尝试将分页改为 `2000`，逐个打开任务并采集任务 ID、URL、标题、内容、备注、任务描述，然后按模块分类并生成 `agentPlan`。执行包要求后续 agent 从 `t-page` 开始，并继承业务闭环、责任审计、权限等同用户、共享影响和反绕过关卡。

- `zentao_analyze_tasks`

  对已有任务 JSON 做模块分类和多 agent 执行包生成，不打开浏览器。输入 JSON 必须保留原始任务字段；不能只给压缩摘要。

- `zentao_collect_assigned_work_items`

  统一采集“指派给我”的 Task 与 Bug。同一次工作流只采集一次并复用一个持久化浏览器登录会话；Task 标记为 `[禅道需求]`，Bug 标记为 `[禅道Bug]`，`TSBERP*` 归贸易系统，`HALLERP*` 归展厅系统。列表固定尝试 `pageSize=2000`，结果按系统和代码模块输出开发者标准表格。

- `zentao_analyze_work_items`

  不打开浏览器，对已有 Task/Bug JSON 按系统和代码模块分组，输出创建者、截止日期、共享影响、待确认项，以及最后一列“详细处理方案与对应位置”。

- `zentao_schedule_tasks`

  仅排期 Task。用户明确模块日期和每项 `1h`/`2h` 后，工具按精确 ID 批量编辑，设置状态=进行中，并设置截止日期、预计、消耗、剩余；拒绝 Bug 和不完整指令。

- `zentao_resolve_bugs`

  仅处理用户已确认、且已完成并验证通过的 Bug。点击“解决”后，只设置解决版本=主干、解决日期=`Asia/Shanghai` 执行时当前时间前 30 分钟，其他字段不改；不执行关闭操作。

- `dingtalk_auth_status` / `dingtalk_auth_login`

  检查官方 DWS 与 OAuth 状态；未登录时打开钉钉官方授权流程。禁止传入密码、Cookie 或固定 Token。

- `dingtalk_search_groups`

  按连续群名关键词检索当前用户可访问的群聊。多候选必须交给用户确认。

- `dingtalk_search_messages`

  按关键词、ISO-8601 时间范围和可选 `openConversationId` 搜索消息。

- `dingtalk_list_messages` / `dingtalk_list_all_messages`

  读取一个明确群聊/单聊，或在用户明确授权的时间范围内读取全部可访问会话。输出包含时间、发送人、会话、消息 ID、`hasMore`，以及下一页 `nextCursor` 或边界 `time`。

## 首次登录

`zentao_collect_assigned_work_items`（以及兼容入口 `zentao_collect_assigned_tasks`）默认使用持久化浏览器 profile。同一 profile 的采集、排期和解决操作复用一个登录会话并串行执行。首次运行如果出现禅道登录页，请在弹出的浏览器中登录，然后重新运行同一个工具。

Torna 工具使用非持久化浏览器 context。MCP 进程首次查询或 token 失效时，请在弹出的浏览器中完成登录；token 只保留在当前 MCP 进程内存中，浏览器关闭后不落盘。工具不保存账号密码，不生成 Torna/Swagger JSON 文件。

钉钉首次使用调用 `dingtalk_auth_login`，由 DWS 打开官方 OAuth。企业管理员必须为组织开启 CLI 访问权限；工具只能读取当前授权用户有权访问的会话。聊天记录只在当前 MCP 响应中返回，禁止落盘；发送、回复、撤回、转发和群管理未开放。
