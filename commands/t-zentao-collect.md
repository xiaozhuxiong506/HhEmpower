---
description: 单会话采集禅道“指派给我”的 Task 与 Bug，按系统和代码模块分析、规范输出，并支持确认后的 Task 排期与 Bug 解决
---

请先提醒用户当前分支，然后调用一次 MCP 工具 `zentao_collect_assigned_work_items`。同一次工作流不得按 Task、Bug 或模块重复采集、重复登录；后续分析和模块执行全部复用本次结果。

默认参数：

```json
{
  "url": "http://hallzd.internal.tsb.com/zentao/my.html",
  "pageSize": 2000,
  "maxTasks": 2000,
  "maxBugs": 2000,
  "keepBrowserOpen": true,
  "headless": false
}
```

采集后执行以下链路：

1. Task 标记 `[禅道需求]`，Bug 标记 `[禅道Bug]`；不采集 Story。
2. 从所属项目/产品识别系统：`TSBERP*` 为贸易系统，`HALLERP*` 为展厅系统，冲突或未知为待确认。
3. 使用 `zentao_analyze_work_items`，结合仓库代码分析代码模块、共享组件、精确位置、处理方案和验证方式。
4. 按“系统 -> 代码模块”分组，以固定标准表格输出全部工作项；最后一列为“详细处理方案与对应位置”。不要固定输出仓库、HEAD、工作区状态或 Git 最近修改者。
5. 共用组件同时影响多个模块时，询问用户是全部修改还是只改其中一个模块；确认前不实现。
6. 用户要求 Task 排期时，按模块询问相对/具体日期和每项 `1h` 或 `2h`；按 `Asia/Shanghai` 转为绝对日期后调用 `zentao_schedule_tasks`。它会按精确 ID 勾选、设置 `pageSize=2000`、打开左下角“编辑”，将状态设为进行中，并设置截止日期、预计、消耗、剩余。
7. 实现后给出逐项完成与验证结论。仅对已完成且验证通过的 Bug 询问一次是否解决；确认后调用 `zentao_resolve_bugs`，只设置解决版本=主干、解决日期=执行时当前时间前 30 分钟，其他字段不变。

首次运行若出现登录页，请让用户在打开的浏览器中登录，然后重试同一个工具。未登录或采集失败时禁止伪造、派发或批量操作。
