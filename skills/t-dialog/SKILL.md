---
name: t-dialog
description: Use when 新建或修改 TSB ERP 弹窗、抽屉（AEDrawer、AEDialog、XxxModal、el-dialog、el-drawer、modal forms）的容器选型、结构与调用接线，或处理 popup/drawer field settings。保存/确认按钮与可编辑性规则归 t-tab；字段设置维度归 t-field。
---

# t-dialog

## 容器选择

- 弹窗/抽屉内的保存、确认、删除、审核、提交、状态流转或批量操作先按 [anchors.md#erp-闭环感知关卡](../t-page/anchors.md#erp-闭环感知关卡) 判断业务闭环、责任和权限边界。
- 用户明确指定 popup、dialog、drawer、route 或组件名时，按指定位置处理，不重新选型。
- 改造既有弹窗/抽屉时沿用现状形态，不擅自切换 Dialog/Drawer。
- 新建且用户未明确形态时，先按复杂度给推荐并走 [t-clarify](../t-clarify/SKILL.md) 单选确认：复杂表单、步骤多、内容动态或需要较大操作区推荐 `AEDrawer`、`el-drawer`、`XxxDrawer`；选择型、小表单、确认型或轻量内容推荐 `AEDialog`、`el-dialog`、`XxxModal`。确认前不新建组件。
- 当前页面已有同类 `AEDrawer`、`AEDialog`、`XxxModal` 时，先照同目录兄弟组件，不跨项目套模板。

## 指定位置边界

- 用户指定 popup、drawer、route 或组件时，只改该指定组件以及必要的调用接线。
- 不因为看到相似弹窗就顺手改其他弹窗、其他抽屉、详情组件或主单列表。
- 父组件只做必要的 `ref`、props、emit、刷新和打开参数接线；大表单逻辑放回弹窗/抽屉组件内部。
- 如果指定位置属于详情组件，保存、确认、只读和可编辑性仍交给 [t-tab](../t-tab/SKILL.md) 判断，不在主单里替详情实现。

## 字段与保存转交

- 新字段、字段显隐、表单可见可编辑、`setField` 和字段设置维度交给 [t-field](../t-field/SKILL.md)；未确认维度前不写字段代码。
- 输入框数字范围、小数位、禁止中文、编码格式等限制，先读 [t-standards/reference.md#输入限制与自定义指令](../t-standards/reference.md#输入限制与自定义指令)，优先复用项目自定义指令或 `utils`。
- 保存、确认、取消、只读、可编辑性、footer 按钮显隐、`isEdit`、`editable`、`*SaveHidden` 和 `*OpsHidden` 交给 [t-tab](../t-tab/SKILL.md)。
- 写操作日志、`OP_HEADERS`、`pageId` 和 headers 交给 [t-oplog](../t-oplog/SKILL.md)。
- 弹窗内 grid 如果项目模式要求虚拟滚动，必须配置 `virtualYConfig` 和稳定 `height`。
- 保存成功后的刷新沿用项目事件，例如 `emit("refreshTable")` 或调用方现有刷新函数，不另造刷新协议。

## 共享组件影响

- 修改前用组件名、import 路径、标签名和路由入口检查调用方，确认该弹窗/抽屉是否被复用。
- 发现复用时，先报告调用方，并要求用户选择：`global` 全局修改、`parameterized` 参数化修改、`specified-only` 仅指定位置修改。
- 选择 `global` 时，所有调用方都要纳入验证范围。
- 选择 `parameterized` 时，用明确 prop、入参或模式字段控制差异，不能让默认行为破坏既有调用方。
- 选择 `specified-only` 时，优先在调用方包一层、拆出新组件或用指定 route 接线，避免影响共享组件全局行为。

## 禁止事项

- 禁止 popup/drawer/route 已指定时修改未指定组件。
- 禁止发现共享组件后静默做全局行为变更。
- 禁止新增字段时跳过 [t-field](../t-field/SKILL.md) 的字段设置维度确认。
- 禁止为单个输入框复制大段数字/小数/中文限制逻辑，未查自定义指令和 `utils` 就直接手写。
- 禁止把保存、确认或可编辑性规则写散在弹窗内，必须转交 [t-tab](../t-tab/SKILL.md)。
- 禁止在弹窗技能内猜 `OP_HEADERS`、`pageId` 或日志 headers，必须转交 [t-oplog](../t-oplog/SKILL.md)。
- 禁止把弹窗保存或确认当成局部表单问题，跳过闭环、权限和责任判断。
- 禁止父组件 inline 大表单，禁止提交成功后漏刷新调用方。
- 禁止弹窗内 grid 在项目模式要求时漏掉 `virtualYConfig` 或稳定 `height`。
