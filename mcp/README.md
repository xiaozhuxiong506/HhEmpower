# TSB Browser MCP

本目录提供 Cursor 可用的本地 MCP server，当前包含禅道任务自动化工具。

## 安装

```powershell
cd D:\company\HhEmpower
.\scripts\install-mcp.ps1
```

安装后重启 Cursor，在 **Settings -> Tools & MCP** 中确认 `t-browser-mcp` 已启用。

## 工具

- `zentao_collect_assigned_tasks`

  打开 `http://hallzd.internal.tsb.com/zentao/my.html`，进入“指派给我”任务列表，尝试将分页改为 `2000`，逐个打开任务并采集标题、内容、备注、任务描述，然后按模块分类并生成 `agentPlan`。

- `zentao_analyze_tasks`

  对已有任务 JSON 做模块分类和多 agent 执行包生成，不打开浏览器。

## 首次登录

`zentao_collect_assigned_tasks` 默认使用持久化浏览器 profile。首次运行如果出现禅道登录页，请在弹出的浏览器中登录，然后重新运行同一个工具。
