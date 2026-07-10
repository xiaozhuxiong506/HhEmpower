# TSB Browser MCP

本目录提供 Cursor 可用的本地 MCP server，当前包含禅道任务自动化工具。

MCP 只提供事实来源和执行包，不提供业务批准、权限批准或上线批准。采集到的任务 ID、URL、标题、内容、备注、描述和日志必须作为原文事实源传递给后续 agent；摘要不能替代原文。

## 安装

```powershell
cd D:\company\HhEmpower
.\scripts\install-mcp.ps1
```

安装后重启 Cursor，在 **Settings -> Tools & MCP** 中确认 `t-browser-mcp` 已启用。

## 工具

- `zentao_collect_assigned_tasks`

  打开 `http://hallzd.internal.tsb.com/zentao/my.html`，进入“指派给我”任务列表，尝试将分页改为 `2000`，逐个打开任务并采集任务 ID、URL、标题、内容、备注、任务描述，然后按模块分类并生成 `agentPlan`。执行包要求后续 agent 从 `t-page` 开始，并继承业务闭环、责任审计、权限等同用户、共享影响和反绕过关卡。

- `zentao_analyze_tasks`

  对已有任务 JSON 做模块分类和多 agent 执行包生成，不打开浏览器。输入 JSON 必须保留原始任务字段；不能只给压缩摘要。

## 首次登录

`zentao_collect_assigned_tasks` 默认使用持久化浏览器 profile。首次运行如果出现禅道登录页，请在弹出的浏览器中登录，然后重新运行同一个工具。
