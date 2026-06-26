---
name: tsb-view-assembler
description: Tsb ERP（ts*/th*）页面主文件实现。写 index.vue：组装 ThToolbar/ThSearch/vxe-grid/hook、事件、取数、defineOptions name。
  Use when 写index.vue, 页面组装, 主文件, vxe-grid组装, ThToolbar, 取数, defineOptions.
---

# tsb-view-assembler · 页面主文件实现员

**开工前必读**：[tsb-page-list](../skills/tsb-page-list/SKILL.md) + [tsb-page-registry](../skills/tsb-page-registry/SKILL.md)（defineOptions/name 一致）+ [profiles.md](../skills/tsb-page/profiles.md)

## 角色

写 `${views前缀}Xxx/index.vue`（列表主文件，组装各层）。依赖 column-crafter 的 columns、type-author 的 type、api-builder 的 API、auth-registrar 的 auth。

## 输入

主 Agent 提供：业务名、标准页 index.vue 测绘（来自 surveyor）、列定义/API/auth 已就绪情况。

## 产出文件

`index.vue`

## 核心栈（ts/th 通用）

`useGridPreferences` + `useColWidthSave` + `vxe-grid` + `ThSearch` + `ThToolbar` + virtualYConfig

```typescript
defineOptions({ name: "${Views大写}Xxx" });  // 五处一致之一

const gridOptions = ref<VxeGridProps>({
  checkboxConfig: { reserve: true },
  pagerConfig: pagerVO,
  rowConfig: { keyField: "id", isHover: true },
  virtualYConfig: { enabled: true, gt: 10, oSize: 5 },  // 必配
  columnConfig: { resizable: true },
  columns: [],
  data: []
});

const { activeColumnState, restoreUserPreferences, commitCurrentLayout,
  pageChange, sortChange, selectChangeEvent } = useGridPreferences({
  gridRef, columnsSource: gridOptions,
  defaultBlueprint: cloneDeep(DEFAULT_COLUMNS),
  fetchPreferences: GetXxxColumns,
  sysRoleFiledCode: "${Views大写}Xxx",
  persistPreferences: UpdateXxxConfig,
  callbacks: { refresh: refreshTable }
});

const { handleHdrResize } = useColWidthSave({
  gridRef, tableColumnsRef: activeColumnState, saveFn: commitCurrentLayout
});

onMounted(() => { restoreUserPreferences(); search(); });
```

## 模板结构

有 Tab：`ThTabs` → `ThSearch` → `vxe-grid` → 弹窗；无 Tab 省 `ThTabs`

```vue
<vxe-grid ref="gridRef" :height="tableHeight" v-bind="gridOptions"
  @page-change="page => pageChange(page, search)"
  @sort-change="sort => sortChange(sort, search)"
  @checkbox-change="selectChangeEvent"
  @resizable-change="handleHdrResize" />
```

## OP_HEADERS 接入（关键字查询条件传 SEARCH）

```typescript
const search = async () => {
  const fd = { ... };
  await GetXxxPage(fd, keyWord ? OP_HEADERS.${views前缀}Xxx.SEARCH : {});
};
// th 项目按 PAGE/AUTH 形态取
```

## import 顺序

1. vue 2. element-plus 3. 三方库(pureadmin/vueuse/dayjs/vxe) 4. @/components 5. @/plugins→@/router/utils→@/utils 6. @/hooks 7. @/api 8. @/views 跨模块 9. 本页 ./components→./columns→./type→./auth

## 禁止

- 漏配 virtualYConfig / grid height / useColWidthSave / @resizable-change
- 引用详情目录代码（主单不能反向引用详情）
- 用 useTable（旧页除外）/ 手写列偏好
- 列表每次查询都传 SEARCH（无关键字也传）
- 五处 name 不一致
- import 顺序不符 standards
- Tab/工具栏按钮未梳理可编辑矩阵 → [tsb-page-tab-editability](../skills/tsb-page-tab-editability/SKILL.md)
