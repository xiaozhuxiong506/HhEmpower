---
name: t-list
description: >-
  Tsb ERP（ts*/th*）列表页：vxe-grid、useGridPreferences、virtualYConfig，标准页按当前项目（ts=tsMaterialOrdering / th=thCustomerInfo）。
  Use when 列表页, 表格页, vxe-grid, index.vue, useGridPreferences, 主单列表, ThToolbar.
---

# 列表页（Tsb ERP 通用）

标准页（按当前项目探测，见 [profiles.md](../t-page/profiles.md)）→ [anchors.md](../t-page/anchors.md#标准源码)

文件命名与编码规范 → [t-standards](../t-standards/SKILL.md) · [naming.md](../t-page/naming.md)

## 文件结构

```
${views前缀}Xxx/
├── index.vue
├── columns.ts        (*Columns.ts，th 项目部分页用此命名)
├── auth.ts
├── type.ts
└── components/
```

## 核心栈（ts/th 通用）

`useGridPreferences` + `useColWidthSave` + `vxe-grid` + `ThSearch` + `ThToolbar` + virtualYConfig

```typescript
const gridOptions = ref<VxeGridProps>({
  checkboxConfig: { reserve: true },
  pagerConfig: pagerVO,
  rowConfig: { keyField: "id", isHover: true },
  virtualYConfig: { enabled: true, gt: 10, oSize: 5 },
  columnConfig: { resizable: true },
  columns: [],
  data: []
});

const {
  activeColumnState,
  restoreUserPreferences,
  commitCurrentLayout,
  pageChange,
  sortChange,
  selectChangeEvent
} = useGridPreferences({
  gridRef,
  columnsSource: gridOptions,
  defaultBlueprint: cloneDeep(DEFAULT_COLUMNS),
  fetchPreferences: GetXxxColumns,       // 照抄模板 API 名（按当前项目域前缀）
  sysRoleFiledCode: "${Views大写}Xxx",   // 六处一致之一
  persistPreferences: UpdateXxxConfig,
  callbacks: { refresh: refreshTable }
});

const { handleHdrResize } = useColWidthSave({
  gridRef,
  tableColumnsRef: activeColumnState,
  saveFn: commitCurrentLayout
});

onMounted(() => {
  restoreUserPreferences();
  search();
});
```

## 模板

有 Tab 时：`ThTabs` → `ThSearch` → `vxe-grid` → 弹窗；无 Tab 可省略 `ThTabs`

**Tab 可编辑性**：改 Tab 或工具栏按钮前，梳理各 `activeTab` 的显隐与 `disabled`；只读 Tab 不加保存类操作 → [t-tab](../t-tab/SKILL.md)

```vue
<vxe-grid
  ref="gridRef"
  :height="tableHeight"
  v-bind="gridOptions"
  @page-change="page => pageChange(page, search)"
  @sort-change="sort => sortChange(sort, search)"
  @checkbox-change="selectChangeEvent"
  @resizable-change="handleHdrResize"
/>
```

## 列宽（新需求主单 grid）

业务列 < 9 → 不设 width；>= 9 → 按 t-standards 通用值设 width。
禁止 `minWidth`（含 columnConfig.minWidth）。详见 [t-standards/reference.md](../t-standards/reference.md#列宽与-minwidth)。

## 禁止

- 下划线命名
- 引用详情目录代码；详情逻辑写进主单
- columns.ts 写非表格内容；auth/type 职责串味
- 用 useTable（旧页除外）
- 手写列偏好
- 漏配 useColWidthSave 或 `@resizable-change`
- 不配 virtualYConfig / 不设 grid height
- 新需求主单不足 9 业务列却写 width / minWidth
- import 顺序不符 t-standards
- 新增列表列未问字段设置（总表 #13 含 D 列表可见）→ [t-field](../t-field/SKILL.md)
- 参考他模块复用 `t('key')` 不查 locales → [t-workflow/reference.md](../t-workflow/reference.md#参考他模块时的-i18n)
- 用户说主单却改详情，或范围模糊未问单选题（总表 #2）→ [anchors.md](../t-page/anchors.md)

必问单选题统一规则 → [t-workflow/reference.md](../t-workflow/reference.md#必问单选题总表)

关联：[t-workflow](../t-workflow/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-auth](../t-auth/SKILL.md) · [t-oplog](../t-oplog/SKILL.md)
