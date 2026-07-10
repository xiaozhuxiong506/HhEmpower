---
description: 采集禅道“指派给我”任务，按业务模块分组并生成保留原文、业务闭环、权限责任边界的多 agent 执行包
---

请使用 MCP 工具 `zentao_collect_assigned_tasks` 自动处理禅道任务：

1. 打开 `http://hallzd.internal.tsb.com/zentao/my.html`。
2. 在仪表盘找到“指派给我”的任务入口并进入。
3. 将分页每页条数尝试改为 `2000`。
4. 逐个打开任务标题，提取：
   - 任务 ID 和 URL
   - 标题
   - 内容
   - 备注
   - 任务描述
5. 如果任务描述为“暂无描述”或空值，不要保留。
6. 采集完成后按模块分类，例如采购模块、销售模块、库存仓储模块、财务模块、公共基础模块。
7. 任务原文是事实源；摘要不能替代任务 ID、URL、标题、内容、备注、描述、日志和复现信息。
8. **需求澄清（硬卡停关卡）** — 禅道任务标题常含糊（如"XX-优化"、"XX-处理"），分组后扫描各任务标题，命中模糊信号词、业务闭环不明、权限边界不明、责任归属不明 → Read [skills/t-clarify/SKILL.md](../skills/t-clarify/SKILL.md) 让用户确认模块归属与动作类型，**用户确认前不得派 `t-mod`**
9. 根据 `agentPlan` 将任务分模块交给对应 `t-mod-*` 执行；执行者必须从 [skills/t-page/SKILL.md](../skills/t-page/SKILL.md) 开始，并继承 [skills/t-page/anchors.md](../skills/t-page/anchors.md) 的业务闭环、责任审计、权限等同用户、共享影响和反绕过关卡。

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
