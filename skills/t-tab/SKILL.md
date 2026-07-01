---
name: t-tab
description: >-
  Tsb ERP（ts*/th*）Tab/弹窗可编辑性：activeTab、isEdit、SaveHidden，只读Tab隐藏确认保存。
  Use when Tab, 标签页, 只读, 预览, 保存, 确认, activeTab, isEdit, SaveHidden, 不可编辑.
---

# Tab / 弹窗 可编辑性与保存（Tsb ERP 通用）

## 你在说什么（规范表述）

每个 **Tab** 或 **弹窗场景** 都有两层逻辑，改代码前必须先理清：

1. **显隐** — 这个 Tab / 按钮要不要出现（权限、`visible`、`isHidden`、流程状态）
2. **可编辑性** — 当前流程是否允许改数据、点保存/确认

部分 Tab 或业务状态下页面是 **只读 / 预览态**：流程已定稿、审批中、已完结等，**不支持保存**。
在此类 Tab 里新增按钮时，**保存 / 确认 / 提交类操作**必须与同 Tab 已有按钮一致 — **隐藏或禁用**，不能只加按钮不管状态。

## 三种常见层级

**① 列表页 ThTabs（`activeTab`）**

- Tab 切换改查询条件，同时限制工具栏按钮
- 例（ts）：采购订货 `activeTab === 2`（采购中）→ 新增/换采购员等 `disabled`

**② 详情页整页可编辑（`isEdit` / `isProcess`）**

- 由主单状态决定明细区能否改
- 例（ts）：采购详情 `purchaseStatus === 2` → `isEdit = false`，工具栏 `isDisabled: () => !isEdit.value`

**③ 弹窗/抽屉内保存（`*SaveHidden` / `isDetailOpsHidden` / `editable`）**

- 与 **打开弹窗时的行数据 + 当前 Tab** 挂钩
- 例（ts）：销售详情 `isDetailOpsHidden` → 弹窗 footer 不显示确认；`AEDialog` 的 `isEditSaveHidden` → 隐藏保存

## 项目里的命名模式（优先抽 hook，ts/th 通用）

| 含义 | 常见命名 | 典型用法 |
|------|----------|----------|
| 隐藏保存/确认 | `isXxxSaveHidden` | 抽屉 footer `v-if="!isEditSaveHidden"` |
| 隐藏弹窗内操作 | `isDetailOpsHidden` | dialog footer 确认按钮 |
| 整页不可编辑 | `isEdit` / `!isProcess` | 工具栏 `isDisabled` |
| 子组件只读 | `editable` / `hideSubmit` | `MarkInfoModal`、OEM drawer |
| Tab 限制按钮 | `activeTab` + `disabled` | 列表 `toolbarButtons` |

**标准 hook 参照**（ts 项目示例，th 项目对照各自复杂参考页的 hook）：

- 采购主单编辑保存：`tsProcurementOrdering/hook.ts` → `isProcOrderEditSaveHidden(row, activeTab)`
- 销售主单编辑保存：`tsSalesOrder/hook.ts` → `isOrderFormSaveHidden` 等
- 销售详情弹窗操作：`tsSalesOrderDetails/hook.ts` → `isOrderDetailOpsHidden`

新增判断逻辑时：**优先扩展现有 hook**，与列表「编辑」按钮 disabled 条件 **保持一致**（见 AEDialog 注释）。

## 改 Tab / 弹窗前必做

1. **梳理矩阵** — 每个 Tab（或 `dialogType`）写清：显隐条件、可否编辑、可否保存
2. **找已有 guard** — Grep `SaveHidden` · `isEdit` · `activeTab` · `isDisabled` · `editable`
3. **新增按钮** — 接同一套 guard，不单独立一套
4. **弹窗 footer** — 只读态只保留「关闭」；可编辑态才显示「确认/保存」

## 新增 Tab 内按钮必问（AskQuestion）

在 Tab 工具栏、详情 domData、弹窗 footer **新增会改数据或需确认的按钮**时，**必须先问你**（可多选）：

> 当前 Tab/弹窗是否支持编辑保存？新按钮怎么处理？

- **A. 可编辑** — 显示按钮；保存/确认接现有 `isEdit` / `*SaveHidden`
- **B. 只读/预览** — 隐藏确认/保存；编辑类按钮 `disabled` 或 `isHidden`
- **C. 照抄同 Tab 相邻按钮** — 复用其 `visible` / `disabled` / `isEditSaveHidden`（默认）
- **D. 部分 Tab 可编辑** — 说明哪些 Tab id / `dialogType` 可保存（Agent 写入蓝图矩阵）

未梳理清楚前不写代码。提问格式 → [t-workflow 总表 #14](../t-workflow/reference.md#必问单选题总表)

## 禁止

- 只读 Tab/弹窗仍显示「确认/保存」
- 新增按钮不接 `isEdit` / `SaveHidden` / `activeTab` guard
- 各弹窗各写一套互不一致的保存隐藏条件（应抽 hook 或与编辑按钮对齐）
- 未梳理 Tab 矩阵就加功能

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md) · [t-registry](../t-registry/SKILL.md)（见 Tab 四种模式节）
