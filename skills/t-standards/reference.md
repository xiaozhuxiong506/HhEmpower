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

## 接口字段与输入规则契约

接口字段和输入规则是零容忍契约，不允许“差不多”。物料编号、采购编号、客户编码、数量、金额、比例等字段必须以事实源为准，不得按中文含义或相邻页面自行猜字段。

事实源优先级：

1. 用户明确给出的接口字段、值域、长度、规则。
2. Swagger/OpenAPI、MCP 接口 schema、后端类型、实际请求/响应样例。
3. 当前模块已验证 API 类型、保存 payload、回显字段和标准页同类实现。

字段匹配规则：

- `columns.field`、表单 `prop`、`type.ts`、请求参数、保存 payload、字段设置 `fieldName` 必须指向同一接口字段。
- `xxxCode`、`xxxNo`、`xxxId`、`xxxKey`、`productCode`、`materialCode` 等相似字段不得互换；若存在多个候选，先问，不猜。
- 只有已有 mapper、接口适配层或后端明确说明时，才允许页面字段名与接口字段不同；必须说明转换位置。
- 接口字段缺失、文案与接口冲突、或 swagger/schema 与现有代码冲突时，暂停并让用户确认事实源。

输入规则匹配规则：

- `maxlength` / `minlength`、最小值/最大值、是否允许 0、是否允许负数、整数/小数、小数位、必填、枚举、正则、禁止中文、去空格、粘贴行为必须与事实源完全一致。
- 禁止为了“更保险”自行收紧规则，也禁止为了“体验好”放宽规则；任何偏差都视为未完成。
- 格式化只能影响展示，不得改变提交值语义；金额、数量、日期在保存前必须保持接口要求的类型和精度。
- 复用自定义指令或 utils 前，先确认其行为与事实源一致；不一致时不能直接套用，必须问用户是改公共能力、加参数区分，还是只在指定入口处理。

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

## 现成能力优先

遇到通用方法时，按以下顺序找现成能力，不要重新写一坨重复代码：

1. **项目现有能力**：先查 `@/utils`、`@/utils/hooks`、`@/hooks`、`@/directives`、当前模块 `hook.ts`、同模块兄弟页。
2. **框架/库能力**：项目没有时，再考虑 Vue、Element Plus、VXE、dayjs、lodash-es 等已在项目中使用的库。
3. **最小本地实现**：前两者都没有，且需求确实独特时，才写局部最小实现，并在交付中说明为什么不能复用。

必须优先查现成能力的典型场景：

- 防抖、节流、loading guard、重复提交防护。
- 日期格式化、时间范围处理、时区/日期展示。
- 金额格式化、千分位、保留小数、负数展示。
- 表格 formatter、枚举映射、状态色块、空值展示。
- 字符串清洗、空值判断、数字转换。

表格 formatter 优先使用 `utils`、`filedMapping`、同模块 columns 既有 formatter。禁止在每个 columns 里复制一份相同格式化函数。

## 输入限制与自定义指令

遇到输入框限制时，先查项目是否已有自定义指令或通用工具，再决定写法。

常见限制包括：

- 数字范围：最小值、最大值、非负、正整数。
- 小数位数：金额、数量、比例、折扣。
- 字符限制：禁止中文、只能英文/数字、编码格式。
- 粘贴限制：粘贴时也要生效，不只处理键盘输入。
- IME 输入：中文输入法组合态不能误删或造成光标异常。

处理顺序：

1. 查 `@/directives`、全局 directive 注册、标准页同类 `v-*` 指令。
2. 验证现有指令是否完整覆盖事实源规则：长度、值域、是否允许 0/负数、小数位、必填、输入、粘贴、清空、边界值、中文输入法。
3. 若现有指令准确，直接复用，不再写 `oninput` / 正则清洗。
4. 若现有指令不完整，优先查 `utils` 或表单 validator 是否已有组合方案。
5. 仍无现成能力时，只在当前组件写最小逻辑，并报告“未找到可复用指令/工具”的证据。

禁止为了一个输入框临时复制大段正则、监听器或 formatter。若多个页面需要同一限制，先按共享影响关卡确认是否应补公共指令或公共工具。

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
