---
name: tsb-page
description: >-
  Tsb ERP（TradeErp ts* / HallErp th*）业务页 Skill 总入口。改页面、列表、详情、弹窗、规范前先读，再分发子 Skill / 调度 subagent。
  Use when 改页面, 新页面, 页面规范, tsMaterialOrdering, tsProcurementOrdering, thCustomerInfo,
  列表, 详情, 弹窗, 不确定用哪个skill, 多agent, subagent.
---

# tsb-page 总入口（Tsb ERP 通用）

本插件同时服务 **Tsb.TradeErp.PC（ts*）** 与 **Tsb.HallErpTenant.PC（th*）**。

改 **`src/views/${views前缀}*/**`** 业务页时，按下方顺序读。

## 第 0 步：探测项目（必做）

先读 [profiles.md](profiles.md) → 判定当前是 ts 还是 th → 后续所有 `${占位符}` 套用对应列。

## 内核文件（先读）

1. **[profiles.md](profiles.md)** — 项目画像表（ts/th 自动探测 + 占位符替换）
2. **[anchors.md](anchors.md)** — 四条红线（含禁脚本）、标准源码(ts/th双列)、主单/详情映射
3. **[naming.md](naming.md)** — 五处命名一致、tsb 命名规则
4. **[orchestration.md](orchestration.md)** — 主 Agent 调度手册（18 subagent + 模块并行拆解）

## Skill 路由表

| 你在做什么 | Read 这个 Skill |
|------------|-----------------|
| **任何改代码前** | [tsb-page-workflow](../tsb-page-workflow/SKILL.md) |
| 列表页 / vxe-grid | [tsb-page-list](../tsb-page-list/SKILL.md) |
| 详情页 / 明细 | [tsb-page-detail](../tsb-page-detail/SKILL.md) |
| 弹窗 / Drawer | [tsb-page-dialog](../tsb-page-dialog/SKILL.md) |
| 新页面模块 | [tsb-page-module](../tsb-page-module/SKILL.md) |
| 命名 / 列宽 / import | [tsb-page-standards](../tsb-page-standards/SKILL.md) |
| 按钮权限 auth | [tsb-page-auth](../tsb-page-auth/SKILL.md) |
| OP_HEADERS 操作日志 | [tsb-page-operation-log](../tsb-page-operation-log/SKILL.md) |
| 字段设置 setField | [tsb-page-field-setting](../tsb-page-field-setting/SKILL.md) |
| Tab 只读 / 保存 | [tsb-page-tab-editability](../tsb-page-tab-editability/SKILL.md) |
| 路由 / Tab 影响范围 | [tsb-page-registry](../tsb-page-registry/SKILL.md) |

## Subagent 编排

要派 subagent 分头干活 → 读 [orchestration.md](orchestration.md)。18 个 agent 定义见 [../../agents/](../../agents/)。

## 快捷命令

- `/tsb-page-start` — 启动改页工作流
- `/tsb-page-new-module` — 新建页面模块
- `/tsb-page-review` — 改完专项审查

索引 → [../README.md](../README.md)
