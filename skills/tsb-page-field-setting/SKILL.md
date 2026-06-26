---
name: tsb-page-field-setting
description: >-
  Tsb ERP（ts*/th*）角色字段设置：settingList、utils.setField，编辑可见/详情可见/列表可见。
  Use when 字段设置, 编辑可见, 详情可见, 列表可见, setField, settingList, sysRoleFiledCode.
---

# 字段设置（角色字段权限，Tsb ERP 通用）

配置入口：系统管理 → 角色管理 → 字段设置（`FieldSetupDrawer.vue`，两项目都有）

类型定义：系统管理角色管理页的 `type.ts`（ts→`src/views/tsSystemAdmin/tsRoleManagement/type.ts`）

运行时：`utils.returnFieldList(sysRoleFiledCode)` 拉取 `settingList`，`utils.setField` 控制显隐/禁用。

## 八个维度（`fieldSettingTable`，ts/th 通用）

每项取值：**0=不设置 · 1=设置不显示 · 2=设置显示**

- **showList** — 列表可见（主单 grid 列）
- **showDetail** — 详情可见（详情头 `ThDetailHeadInfo`、详情主单信息区）
- **isVisible** — 编辑可见（弹窗/抽屉表单项 `v-if`）
- **isEdit** — 可编辑（弹窗/抽屉 `:disabled`，逻辑取反）
- **isBatch** — 批量编辑可见
- **datchEdit** — 批量编辑可编辑（详情 grid 单元格 `:disabled`，逻辑取反）
- **audit** — 审核
- **trace** — 留痕

页面启用哪些列，由后端 `fieldRoleRecord` 的 `isList` / `isDetail` / `isVisible` 等开关决定（`FieldSetupDrawer` 动态列）。

## `utils.setField` 对照（写页面时用，ts/th 通用）

`fieldName` 与列 `field`、表单 prop **小驼峰一致**（如 `purchaseDate`、`manufacturerCode`）。

```typescript
utils.setField(settingList, "purchaseDate", type);
```

- **type 0** — 列表列是否可见 → `showList === 2`
- **type 1** — 详情头是否可见 → `showDetail === 2`
- **type 2** — 编辑是否**禁用** → `isEdit !== 2`（用于 `:disabled`）
- **type 3** — 批量编辑是否**禁用** → `datchEdit !== 2`
- **type 4** — 编辑是否可见 → `isVisible === 2`（用于 `v-if`）
- **type 5** — 批量编辑是否可见 → `isBatch === 2`

`settingList` 为空或找不到字段 → 返回 `true`（默认显示/不禁用）。

列表列权限另用 `utils.showField(item)`：`showList === 1` 时列 `isNoShow`（见 `GridPreferences`）。

## 页面接入方式

**列表页** — `useGridPreferences` 的 `sysRoleFiledCode` + 自动 `returnFieldList`；`columns.ts` 的 `field` 与 `fieldName` 一致。

**弹窗/抽屉** — 父页传 `:settingList="settingList"`；表单项照抄标准页 AEDrawer：

```vue
<el-col v-if="utils.setField(props.settingList, 'paymentDays', 4)" :span="12">
  <el-input :disabled="utils.setField(props.settingList, 'paymentDays', 2)" />
</el-col>
```

**详情头** — `ThDetailHeadInfo` 传 `sysRoleFiledCode`，`cloumns[].key` 对应 `fieldName`，内部 `setField(..., 1)`。

**详情 grid 行内编辑** — `:disabled="setField(settingList, 'xxxField', 3)"`。

标准参照：当前项目 `${标准页}/components/AEDrawer.vue`、复杂参考页 `components/AEDialog.vue`

## 新增字段必问（AskQuestion）

在弹窗/抽屉/详情表单/详情 grid **新增表单项或列**时，**必须先问你**（可多选），选定后再写 `setField` 与后端字段名：

> 新字段 `xxx` 要接入哪些字段设置？

- **A. 编辑可见** — `setField(..., 4)` 包 `v-if`
- **B. 可编辑** — `setField(..., 2)` 包 `:disabled`
- **C. 详情可见** — 详情头 `setField(..., 1)` 或详情信息区
- **D. 列表可见** — 列表 `columns` + `showList` / `showField`
- **E. 批量编辑可见** — `setField(..., 5)`
- **F. 批量编辑可编辑** — `setField(..., 3)` 于 grid 单元格
- **G. 暂不接字段设置** — 须你明确同意，并说明例外原因

**默认照抄**：同页、同容器内**相邻已有字段**的维度组合。

**禁止**：

- 未问就写字段且不包 `setField`
- `fieldName` 与 `field` / prop 不一致
- 只写 `v-if` 不写 `:disabled`（或反之），与同页其它字段风格不一致
- 自造 `sysRoleFiledCode`（须与五处 name 一致）

**后端**：新 `fieldName` 通常需后台在角色字段配置中登记；前端先按选定维度写好 `setField`，`fieldName` 用最终 prop 名。若后台尚未配置，`settingList` 无该项时前端默认显示。

提问格式 → [tsb-page-workflow 必问单选题总表](../tsb-page-workflow/reference.md#必问单选题总表) **#13**

关联：[tsb-page-dialog](../tsb-page-dialog/SKILL.md) · [tsb-page-list](../tsb-page-list/SKILL.md) · [tsb-page-detail](../tsb-page-detail/SKILL.md) · [tsb-page-standards](../tsb-page-standards/SKILL.md)
