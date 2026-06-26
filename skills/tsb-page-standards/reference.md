# 补充参考（Tsb ERP 通用）

> 项目特定值（标准页/前缀）→ 先读 [../tsb-page/profiles.md](../tsb-page/profiles.md)。

## 命名对照

以当前项目标准页为模板，新页类推。命名五处一致细则 → [../tsb-page/naming.md](../tsb-page/naming.md)

**列表**（`${views前缀}` = ts 或 th）

- 文件夹 `${views前缀}Xxx`
- path `/${views前缀}Xxx`
- name / defineOptions / sysRoleFiledCode `${Views大写}Xxx`
- OP_HEADERS `${views前缀}Xxx`（th 项目为 `PAGE{N}` 形态，见 profiles）

**详情**

- 文件夹 `${views前缀}XxxDetail`（ts；th 视情况内嵌 Detail.vue）
- path / name / OP_HEADERS / sysRoleFiledCode 同步替换
- auth import `import { AUTH_CODES } from "../${views前缀}Xxx/auth"`

## 主单 / 详情 对照

通用映射见 [../tsb-page/anchors.md](../tsb-page/anchors.md#主单--详情映射)。

> legacy 命名注意（ts 项目）：采购订货详情是 `tsProcOrderDetails`（非 `Detail` 后缀）；新页一律用单数 `Detail`。

## API 对照

新页照抄当前项目标准页的 API 函数名，全局替换业务前缀。例如标准页有：

- 列表：`GetXxxPage` · `GetXxxColumns` · `UpdateXxxConfig`
- 详情：`GetXxx` · `SearchDetailXxx` · `GetXxxDetailColumns` · `UpdateXxxDetailConfig`

变量/函数：禁止 `purchase_code`、`get_data`；必须 `purchaseCode`、`getData`
例外：`DEFAULT_COLUMNS`、`AUTH_CODES` 后端码

## 模块耦合

- 详情可引用主单 auth、共用组件；主单禁止引用详情目录
- 主单没有的功能，不在主单里为详情预留逻辑

## 文件职责

- columns.ts → 仅列配置
- auth.ts → 仅权限码
- type.ts → 仅类型
- 不在定义文件里塞 API、路由、hasAuth 等业务

## 写法

- 最简可用：照抄标准页，禁止过度泛型、过度封装、堆砌冗余代码

## import 顺序

新页照抄当前项目标准页（ts→tsMaterialOrdering；th→thCustomerInfo）；legacy 旧页顺序不作标准。

**index.vue / 弹窗**（组间空一行）：

1. vue
2. element-plus
3. 三方库（pureadmin · vueuse · dayjs · vxe-table）
4. @/components
5. @/plugins → @/router/utils → @/utils（同组不空行）
6. @/hooks · @/utils/hooks
7. @/api
8. @/views 跨模块 components
9. 本页：`./components` → `./columns` → `./type` → `./auth`

**columns.ts**：`i18n` → `filedMap` → `utils`

## 虚拟列表 virtualYConfig

```typescript
rowConfig: { keyField: "id", isHover: true },
virtualYConfig: { enabled: true, gt: 10, oSize: 5 }
```

- `enabled` 开启纵向虚拟滚动
- `gt: 10` 超过 10 行触发（页面级标准，全局默认 20）
- `oSize: 5` 缓冲区行数
- 必须配合 `:height="tableHeight"` 或弹窗固定 height
- `virtualXConfig` 页面一般不配，走全局插件

对照文件（ts 项目示例，th 项目对照各自标准页）：

- `${标准页路径}index.vue`
- `${标准页}Detail/index.vue`（ts）或内嵌 Detail.vue（th）
- `${标准页}Detail/components/*Modal.vue`（弹窗 grid）
- `src/plugins/vxe-table/index.ts`（全局默认）

## 列宽与 minWidth

禁止：columnConfig.minWidth · 列上 minWidth

主单（列表/详情明细）：业务列 < 9 不设 width；>= 9 可用通用 width
弹窗内 grid：业务列 < 7 不设 width；>= 7 可用通用 width
列数不含 seq、checkBox；operation 操作列 width 150 仍可用

通用 width：seq 50 · checkBox 50（跟踪 60）· 图片 80 · 编号 160 · 状态/数量 120 · 金额 120（采购主金额 130）· 日期 160 · 操作 150

搜索：productKey 220px · codeKey 160~180px · select 140px

select 值为 null：`:empty-values="[null, undefined]"`

## 常用函数名

getData · search · refreshTable · toDetailPage · toQueryNumber · openLazy · guardAllNoDone · handleMouseEnter · changeTab

## columns 属性顺序

普通列：

```typescript
{
  // 中文注释
  field,
  title: t("..."),
  width,
  className?,       // text-link 或 text-right
  align: "center",
  sortable: true,
  visible: true,
  type?,            // 状态色块用 "html"
  formatter?,
  fixed: "",
  slots?
}
```

金额列：`className: "text-right"` · `align: "right"` · `headerAlign: "center"` · `utils.formatWithCommas`

操作列：`field: "operation"` · `fixed: "right"` · `width: 150`

formatter：枚举 → `filedMapping` · 状态 → `type: "html"` + `spanHtml` · 日期 → `utils.filterDateTime` · 金额 → `utils.formatWithCommas`

## 表单 select（值为 null 时）

```vue
<el-select v-model="form.xxx" :empty-values="[null, undefined]" ... />
```

数值 0 为合法选项时，参考当前项目标准页同类写法。

## 对照源码

- 列表 + 虚拟滚动：当前项目 `${标准页}/index.vue`
- 列定义 + 列宽：当前项目 `${标准页}/columns.ts`
- 复杂功能：当前项目 `${复杂参考页}/index.vue`
- 详情 + 虚拟滚动：当前项目详情模板
- 弹窗 grid：当前项目详情弹窗 `components/*Modal.vue`
- 全局 vxe 默认：`src/plugins/vxe-table/index.ts`

新增列或字段：先找标准页同类项，复制属性顺序和 width，只改 field 和 title。
