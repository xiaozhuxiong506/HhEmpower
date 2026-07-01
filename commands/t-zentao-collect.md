---
description: 采集禅道“指派给我”任务，按业务模块分组并生成多 agent 执行包
---

请使用 MCP 工具 `zentao_collect_assigned_tasks` 自动处理禅道任务：

1. 打开 `http://hallzd.internal.tsb.com/zentao/my.html`。
2. 在仪表盘找到“指派给我”的任务入口并进入。
3. 将分页每页条数尝试改为 `2000`。
4. 逐个打开任务标题，提取：
   - 标题
   - 内容
   - 备注
   - 任务描述
5. 如果任务描述为“暂无描述”或空值，不要保留。
6. 采集完成后按模块分类，例如采购模块、销售模块、库存仓储模块、财务模块、公共基础模块。
7. 根据 `agentPlan` 将任务分模块交给对应 `t-mod-*` 执行。

默认工具参数：

```json
{
  "url": "http://hallzd.internal.tsb.com/zentao/my.html",
  "pageSize": 2000,
  "maxTasks": 2000,
  "keepBrowserOpen": true,
  "headless": false
}
```

首次运行如果出现登录页，请在弹出的浏览器里登录禅道，然后重新运行本命令。
