---
name: t-tab
description: Use when adding or changing TSB ERP Tab 行为、activeTab、只读/编辑态、isEdit、SaveHidden、预览态、保存/确认按钮、footer 按钮、按钮 guard、可编辑矩阵；tab visibility, read-only state, save button, footer buttons。Tab 发现与影响面归 t-registry；字段设置归 t-field。
---

# t-tab

本 skill 处理 Tab、弹窗、抽屉内的显隐和可编辑性。字段设置读 [../t-field/SKILL.md](../t-field/SKILL.md)，权限显隐读 [../t-auth/SKILL.md](../t-auth/SKILL.md)。

涉及保存、确认、删除、审核、反审、作废、关闭、提交或状态流转时，先读 [../t-page/anchors.md#erp-闭环感知关卡](../t-page/anchors.md#erp-闭环感知关卡)，确认业务闭环、责任归属、权限边界和日志链路。

## 两层逻辑（Two Logic Layers）

1. **显隐**：Tab、按钮、footer 是否出现，通常由权限、流程状态、`visible`、`isHidden` 控制。
2. **可编辑性**：出现后是否允许改数据、保存、确认，通常由 `isEdit`、`SaveHidden`、`activeTab`、`editable` 控制。

两层必须分别判断。只让按钮显示，不代表允许保存。

## 改数据按钮（Data-Changing Buttons）

新增会改变数据的按钮前，先建立矩阵：

- 哪些 `activeTab` / `dialogType` / 流程状态可编辑？
- 哪些状态只读或预览？
- 保存/确认按钮复用哪个已有 guard？
- footer 在只读态是否只保留关闭？

没有矩阵时先问用户，不写代码。

## 保存与确认状态（Save And Confirm State）

- 只读/预览态隐藏或禁用保存、确认、提交、删除等按钮。
- 可编辑态复用同页已有 `isEdit`、`isXxxSaveHidden`、`isDetailOpsHidden`、`editable`。
- 弹窗 footer 与列表编辑按钮 disabled 条件保持一致。
- 复杂判断优先扩展已有 hook，不在每个弹窗内重写一套。

## 必问门禁（Ask Gates）

新增 Tab 工具栏按钮、详情 domData 按钮、弹窗 footer 按钮，且会改数据或需要确认时，必须先问：

> 当前 Tab/弹窗是否支持编辑保存？新按钮怎么处理？

- **A. 可编辑**：显示按钮，保存/确认接现有 guard。
- **B. 只读/预览**：隐藏确认/保存，编辑类按钮 disabled 或 hidden。
- **C. 照同 Tab 相邻按钮**：复用其 `visible` / `disabled` / `SaveHidden`，并写明证据。
- **D. 部分 Tab 可编辑**：用户提供 Tab id / `dialogType` 矩阵后再写。

## 禁止项（Prohibitions）

- 禁止只读 Tab/弹窗仍显示保存或确认。
- 禁止新增改数据按钮不接 `isEdit` / `SaveHidden` / `activeTab` guard。
- 禁止每个弹窗各自发明保存隐藏规则。
- 禁止未梳理矩阵就新增功能。
- 禁止只按按钮显隐判断可操作性，跳过后端权限、字段权限、日志和业务闭环。

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md) · [t-registry](../t-registry/SKILL.md)
