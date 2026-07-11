# TSB Browser MCP

本目录提供 Cursor 可用的本地 MCP server，包含 Torna API 文档只读检索和禅道任务自动化工具。

MCP 只提供事实来源和执行包，不提供业务批准、权限批准或上线批准。采集到的任务 ID、URL、标题、内容、备注、描述和日志必须作为原文事实源传递给后续 agent；摘要不能替代原文。

## 安装

```powershell
cd D:\company\HhEmpower
.\scripts\install-mcp.ps1
```

安装后重启 Cursor，在 **Settings -> Tools & MCP** 中确认 `t-browser-mcp` 已启用。

## 工具

- `torna_search_api`

  按系统、名称/路径、应用模块和 HTTP 方法检索 `http://docs.internal.tsb.com`。候选以 Markdown 表格返回；唯一命中时默认追加请求参数、响应参数和格式化示例。普通接口/API 文档查询使用 Torna；只有用户明确指定 Swagger/OpenAPI 时才不调用本工具。

- `torna_get_api_detail`

  按真实 Torna 文档 ID 读取接口详情，输出基本信息、请求参数、响应参数、请求示例和响应示例。工具只调用 Torna 只读接口，不执行调试、Mock、编辑、导入或删除，也不输出 Cookie、token 和敏感请求头。

- `zentao_collect_assigned_tasks`

  打开 `http://hallzd.internal.tsb.com/zentao/my.html`，进入“指派给我”任务列表，尝试将分页改为 `2000`，逐个打开任务并采集任务 ID、URL、标题、内容、备注、任务描述，然后按模块分类并生成 `agentPlan`。执行包要求后续 agent 从 `t-page` 开始，并继承业务闭环、责任审计、权限等同用户、共享影响和反绕过关卡。

- `zentao_analyze_tasks`

  对已有任务 JSON 做模块分类和多 agent 执行包生成，不打开浏览器。输入 JSON 必须保留原始任务字段；不能只给压缩摘要。

## 首次登录

`zentao_collect_assigned_tasks` 默认使用持久化浏览器 profile。首次运行如果出现禅道登录页，请在弹出的浏览器中登录，然后重新运行同一个工具。

Torna 工具使用非持久化浏览器 context。MCP 进程首次查询或 token 失效时，请在弹出的浏览器中完成登录；token 只保留在当前 MCP 进程内存中，浏览器关闭后不落盘。工具不保存账号密码，不生成 Torna/Swagger JSON 文件。
