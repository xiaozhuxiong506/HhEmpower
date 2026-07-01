---
name: t-page
description: >-
  Tsb ERP 业务页 Skill 总入口。改页面、列表、详情、弹窗、规范前先读，再分发子 Skill / 调度 subagent。
  Use when 改页面, 新页面, 页面规范, tsMaterialOrdering, tsProcurementOrdering, thCustomerInfo,
  列表, 详情, 弹窗, 不确定用哪个skill, 多agent, subagent.
---

# t-page 总入口（Tsb ERP 通用）

本插件同时服务 **Tsb.TradeErp.PC（ts*）** 与 **Tsb.HallErpTenant.PC（th*）**。

改 **`src/views/${views前缀}*/**`** 业务页时，按下方顺序读。

> **前置关卡**：若用户需求含模糊词（那个/优化下/按上次/加个查询/随便/处理一下/像XX那样），**最先读 [t-clarify](../t-clarify/SKILL.md)** 发起澄清三问，答完再进入下方流程。

## 第 0 步：探测项目（必做）

先读 [profiles.md](profiles.md) → 判定当前是 ts 还是 th → 后续所有 `${占位符}` 套用对应列。

## 内核文件（先读）

1. **[profiles.md](profiles.md)** — 项目画像表（ts/th 自动探测 + 占位符替换）
2. **[anchors.md](anchors.md)** — 五条红线（含禁脚本 + 最小改动原则）、标准源码(ts/th双列)、主单/详情映射
3. **[naming.md](naming.md)** — 六处命名一致（含 columns↔type 字段对齐）、tsb 命名规则
4. **[orchestration.md](orchestration.md)** — 主 Agent 调度手册（21 subagent 六组 + 模块并行拆解）

## Skill 路由表

| 你在做什么 | Read 这个 Skill |
|------------|-----------------|
| **需求含模糊词（那个/优化下/按上次/随便/加个查询）** | [t-clarify](../t-clarify/SKILL.md) — 硬卡停澄清三问，**最先读** |
| **任何改代码前** | [t-workflow](../t-workflow/SKILL.md) |
| 列表页 / vxe-grid | [t-list](../t-list/SKILL.md) |
| 详情页 / 明细 | [t-detail](../t-detail/SKILL.md) |
| 弹窗 / Drawer | [t-dialog](../t-dialog/SKILL.md) |
| 新页面模块 | [t-module](../t-module/SKILL.md) |
| 命名 / 列宽 / import | [t-standards](../t-standards/SKILL.md) |
| 按钮权限 auth | [t-auth](../t-auth/SKILL.md) |
| OP_HEADERS 操作日志 | [t-oplog](../t-oplog/SKILL.md) |
| 字段设置 setField | [t-field](../t-field/SKILL.md) |
| Tab 只读 / 保存 | [t-tab](../t-tab/SKILL.md) |
| 路由 / Tab 影响范围 | [t-registry](../t-registry/SKILL.md) |

## Subagent 编排

要派 subagent 分头干活 → 读 [orchestration.md](orchestration.md)。21 个 agent 定义见 [../../agents/](../../agents/)。

## 快捷命令

- `/t-start` — 启动改页工作流
- `/t-new-module` — 新建页面模块
- `/t-review` — 改完专项审查

索引 → [../README.md](../README.md)
