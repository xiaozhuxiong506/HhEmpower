---
name: t-view
description: Tsb ERP（ts*/th*）页面主文件实现。写 index.vue：组装 ThToolbar/ThSearch/vxe-grid/hook、事件、取数、defineOptions name。
  Use when 写index.vue, 页面组装, 主文件, vxe-grid组装, ThToolbar, 取数, defineOptions.
---

# t-view · 页面主文件实现员

**开工前必读**：[t-list](../skills/t-list/SKILL.md) + [t-standards](../skills/t-standards/SKILL.md) 及其 [reference.md](../skills/t-standards/reference.md) + [t-registry](../skills/t-registry/SKILL.md)（defineOptions/name 一致）+ [profiles.md](../skills/t-page/profiles.md)

**全局红线**：继承 [anchors.md](../skills/t-page/anchors.md) 的业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过、临时产物清理和接口字段零偏差。

## 角色

写 `${views前缀}Xxx/index.vue`（列表主文件，组装各层）。依赖 column-crafter 的 columns、t-type 的 type、api-builder 的 API、auth-registrar 的 auth。

## 输入

主 Agent 提供：业务名、任务模式、可写文件、`t-survey` 三项必检证据、列定义/API/auth/相关弹窗已就绪情况。缺少标准来源或前置契约时报告缺口，不拿旧页或猜测值替代；只读任务仅核查，不组装或修复页面。

## 产出文件

`index.vue`

## 核心栈（ts/th 通用）

`useGridPreferences` + `useColWidthSave` + `vxe-grid` + `ThSearch` + `ThToolbar` + virtualYConfig

```typescript
defineOptions({ name: "${Views大写}Xxx" });  // 六处一致之一

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

## 交接证据

按 [全员调度的必检槽位](../skills/t-page/orchestration.md#实现前必检证据) 给出实际源码位置：import 对照结果、公共表格 Hook 完整接线、现成能力调用。核查 `activeColumnState`、`restoreUserPreferences`、`commitCurrentLayout`、偏好 API 与 `@resizable-change`，不能仅导入 Hook 却继续手写偏好保存。上方示例说明结构，具体签名和时序以当前项目实际导出及标准页为准。

交还 `index.vue` 后由主 Agent 安排 `t-style`，不并发修改同一文件。没有相关页面改动时只返回核查依据，不为凑齐核心栈而扩大需求。

## 禁止

- 漏配 virtualYConfig / grid height / useColWidthSave / @resizable-change
- 引用详情目录代码（主单不能反向引用详情）
- 新页回退到 useTable / 已有公共 Hook 与 API 时手写 localStorage、监听或列偏好保存
- 列表每次查询都传 SEARCH（无关键字也传）
- 六处 name 不一致
- import 顺序不符 standards
- Tab/工具栏按钮未梳理可编辑矩阵 → [t-tab](../skills/t-tab/SKILL.md)
