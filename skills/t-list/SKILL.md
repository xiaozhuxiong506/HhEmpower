---
name: t-list
description: Use when building or changing 构建或修改 TSB ERP 主单列表页、vxe-grid table、columns、useGridPreferences、ThToolbar、query form、virtualYConfig、row actions 或 main-list field visibility。
---

# t-list

## 主单边界

- 主单只负责列表入口：`index.vue`、查询表单、`vxe-grid`、主单 columns、`ThToolbar`、行操作入口、列表级字段显隐和打开弹窗/详情的接线。
- 主单不修改详情归属文件，除非用户明确选择本次范围包含详情；详情目录、`Detail.vue`、详情 columns、详情保存和详情日志交给 [t-detail](../t-detail/SKILL.md)。
- 主单不得为了调用方便 shortcut import 详情目录；如果需要打开独立详情，使用项目既有 `openStaticPage` 或路由接线模式。
- 用户只说“主单”“列表”“列表页”时，默认不改详情、弹窗内部保存逻辑或详情字段设置；范围含糊时先走 [t-clarify](../t-clarify/SKILL.md)。

## 文件结构

```text
${views前缀}Xxx/
|-- index.vue
|-- columns.ts 或项目约定的 *Columns.ts
|-- auth.ts
|-- type.ts
`-- components/
```

- `index.vue` 放查询、表格、分页、工具栏、打开弹窗/详情的入口和刷新列表逻辑。
- `columns.ts` 只放主单表格列；不要放查询、权限、详情或弹窗逻辑。
- `auth.ts` 只放主单权限码；详情默认从主单复用，是否例外交给 [t-detail](../t-detail/SKILL.md) 判断。
- `type.ts` 只放主单数据类型、查询类型和 API 入参出参类型。

## 必守标准

- 主单标准组合是 `useGridPreferences`、`useColWidthSave`、`vxe-grid`、`ThSearch`、`ThToolbar`、`pagerConfig`、`rowConfig.keyField` 和 `virtualYConfig`。
- 项目模式要求虚拟滚动时，必须同时有 `virtualYConfig` 和稳定的 grid `height`，避免只配其一。
- 列偏好必须走 `useGridPreferences` 和项目 API，不手写本地列偏好、不绕过 `restoreUserPreferences` 和 `commitCurrentLayout`。
- 列宽、import 顺序、columns 顺序和虚拟滚动细节统一看 [t-standards/reference.md](../t-standards/reference.md)；其中列宽规则、`minWidth` 禁用、业务列顺序和虚拟滚动阈值以该文件为准。
- 新增主单业务列时，先确认字段设置维度并交给 [t-field](../t-field/SKILL.md)，再写 columns、`setField` 或可见性。

## 必问门禁

- 未确认字段设置维度前，不新增主单列、查询项或主单字段显隐。
- 未确认权限码前，不新增主单按钮权限或 `hasAuth`。
- 未确认 i18n namespace 前，不新增列表标题、按钮、查询项或列标题 locale key。
- 未确认“只改主单”还是“主单加详情/弹窗”前，不越界改详情、弹窗或保存流。

## 转交其他技能

- 新字段、列显隐、表单可见可编辑：交给 [t-field](../t-field/SKILL.md)。
- 保存、确认、只读、可编辑性、Tab 状态和按钮显隐：交给 [t-tab](../t-tab/SKILL.md)。
- 操作日志、`OP_HEADERS`、`pageId` 和写操作 headers：交给 [t-oplog](../t-oplog/SKILL.md)。
- 路由发现、菜单登记、静态路由和组件引用检测：交给 [t-registry](../t-registry/SKILL.md)。
- 详情页、详情明细、`ThDetailHeadInfo`、`route.query` 和详情 auth 行为：交给 [t-detail](../t-detail/SKILL.md)。

## 禁止事项

- 禁止手写 grid preferences，禁止绕开 `useGridPreferences`、`useColWidthSave` 或项目列偏好 API。
- 禁止在项目模式要求时漏掉 `virtualYConfig` 或 grid `height`。
- 禁止主单文件 import 详情目录作为 shortcut，也禁止把详情 columns、详情 type 或详情保存逻辑塞进主单。
- 禁止 `columns.ts`、`auth.ts`、`type.ts` 职责串味。
- 禁止新增主单列时跳过字段设置维度确认。
- 禁止新需求主单业务列少于 9 列却主动写 `width`，或使用 `minWidth`；列宽规则以 [t-standards/reference.md](../t-standards/reference.md) 为准。
- 禁止复制其他模块 `t('key')` 而不查 locales。
