# TSB 规范参考

项目画像、标准页和 ts/th 差异先读 [../t-page/profiles.md](../t-page/profiles.md)；全局红线读 [../t-page/anchors.md](../t-page/anchors.md)；命名细则读 [../t-page/naming.md](../t-page/naming.md)。

## 命名

- 新页以当前项目标准页为模板，不从另一个项目照搬。
- 路由 path、route name、`defineOptions.name`、目录名、API/type、i18n、auth/log/pageId 命名必须成组替换。
- 禁止业务字段使用下划线命名；后端码、`AUTH_CODES`、`DEFAULT_COLUMNS` 等已有常量名保持原样。
- 函数名前缀优先用 `get`、`handle`、`to`、`open`、`refresh`、`guard`。

## 主单与详情

- 主单负责列表、查询、工具栏、进入详情入口。
- 详情负责详情头、明细、详情弹窗、详情自己的 OP_HEADERS。
- 详情可以引用主单 auth；主单不得引用详情目录。
- `ts` 常见独立详情目录；`th` 常见内嵌 `Detail.vue`，以 [../t-page/profiles.md](../t-page/profiles.md) 和同模块现有页面为准。

## API

- 新页 API 名照当前项目标准页整体替换业务前缀。
- 列表常见：`GetXxxPage`、`GetXxxColumns`、`UpdateXxxConfig`。
- 详情常见：`GetXxx`、`SearchDetailXxx`、`GetXxxDetailColumns`、`UpdateXxxDetailConfig`。
- 业务 API 第二参若承接日志 headers，形态照当前项目 API 文件，不自行发明包装。

## 模块解耦

- 页面只引用自己模块、公共组件、公共 hook、明确允许的主单 auth。
- 共享组件/common hook/util 改动前先查调用方，按 [../t-page/anchors.md](../t-page/anchors.md) 的共享影响门禁确认。
- 发现兄弟页也有类似问题时，列入范围外报告，不直接扩散修改。

## 文件职责

| 文件 | 只承载 |
| --- | --- |
| `columns.ts` | 列定义、formatter、列可见性配置 |
| `auth.ts` | `AUTH_CODES` 和后端权限码 |
| `type.ts` | 类型、枚举、页面内数据结构 |
| `index.vue` | 组装、事件、查询、状态流转 |
| `components/` | 弹窗、抽屉、局部子组件 |

禁止把 API、路由、权限判断、日志注册塞进定义文件。

## import 顺序

新页照当前项目标准页；legacy 旧页不作为新规范来源。

常用顺序：

1. `vue`
2. `element-plus`
3. 三方库：`pureadmin`、`vueuse`、`dayjs`、`vxe-table`
4. `@/components`
5. `@/plugins`、`@/router/utils`、`@/utils`
6. `@/hooks`、`@/utils/hooks`
7. `@/api`
8. 跨模块 `@/views/.../components`
9. 本页：`./components`、`./columns`、`./type`、`./auth`

`columns.ts` 常见顺序：`i18n`、`filedMap`、`utils`。

## virtualYConfig

vxe-grid 页面默认配置：

```typescript
rowConfig: { keyField: "id", isHover: true },
virtualYConfig: { enabled: true, gt: 10, oSize: 5 }
```

- 必须配合 `:height="tableHeight"` 或弹窗固定 height。
- `gt: 10` 是页面级触发阈值；不要照全局插件默认值覆盖页面标准。
- `virtualXConfig` 一般走全局插件，不在页面单独配置。
- 弹窗/抽屉内 grid 也按同一规则处理。

## 列宽与 minWidth

- 新需求页禁止使用列 `minWidth` 或 `columnConfig.minWidth`。
- 主单/详情明细：业务列少于 9 列时不设业务列 width；9 列及以上才按通用 width 处理。
- 弹窗 grid：业务列少于 7 列时不设业务列 width；7 列及以上才按通用 width 处理。
- 业务列数不含 `seq`、`checkBox`、operation 操作列。

通用 width：`seq` 50、`checkBox` 50（跟踪 60）、图片 80、编号 160、状态/数量 120、金额 120（采购主金额 130）、日期 160、操作 150。

搜索项宽度：`productKey` 220px、`codeKey` 160~180px、select 140px。

## columns 属性顺序（Columns Property Order）

普通列按此顺序组织：

```typescript
{
  // 中文注释
  field,
  title: t("..."),
  width,
  className?,
  align: "center",
  sortable: true,
  visible: true,
  type?,
  formatter?,
  fixed: "",
  slots?
}
```

- 金额列：`className: "text-right"`、`align: "right"`、`headerAlign: "center"`、`utils.formatWithCommas`。
- 操作列：`field: "operation"`、`fixed: "right"`、`width: 150`。
- 枚举 formatter 用 `filedMapping`；状态色块用 `type: "html"` + `spanHtml`；日期用 `utils.filterDateTime`。

## select null

值可能是 `null` 的 `el-select` 必须保留空值配置：

```vue
<el-select v-model="form.xxx" :empty-values="[null, undefined]" />
```

如果数值 `0` 是合法选项，先查当前项目标准页同类写法，不自行改变空值语义。

## 源码对照

- 列表与虚拟滚动：当前项目标准页 `index.vue`。
- 列定义与列宽：当前项目标准页 `columns.ts`。
- 详情：当前项目详情模板。
- 弹窗 grid：当前项目详情弹窗 `components/*Modal.vue`。
- 全局 vxe 默认：`src/plugins/vxe-table/index.ts`。
- 复杂功能：同项目同模块兄弟页优先于跨模块页面。
