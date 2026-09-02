---
name: t-zentao-collect
description: 单会话采集禅道“指派给我”的 Task 与 Bug，并进入 t-zentao 工作流
---

读取并严格执行 [../skills/t-zentao/SKILL.md](../skills/t-zentao/SKILL.md)，完成禅道“指派给我”工作项的采集、分析、规范输出，以及确认后的 Task 排期与 Bug 解决。

- 先提醒用户当前分支，再调用一次 MCP 工具 `zentao_collect_assigned_work_items`（列表参数固定 `pageSize: 2000`）；同一次工作流不重复采集、不重复登录。
- 首次出现登录页时，让用户在打开的浏览器中登录后重试同一工具；未登录或采集失败时禁止伪造、派发或批量操作。
- 排期仅限 Task（`zentao_schedule_tasks`），解决仅限已完成且验证通过的 Bug（`zentao_resolve_bugs`）；链路口径以 t-zentao/SKILL.md 为唯一标准，本命令不重复展开。
