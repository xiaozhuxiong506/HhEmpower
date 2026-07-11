# TSB 项目画像

> 本文件是页面技能识别 `ts` / `th` 项目画像的单一事实源。

## 读取顺序

每个页面 skill 在引用项目特定路径、标准页、路由、API、权限、操作日志、字段设置前，先读本文件。

先完成画像探测，再替换路径令牌；探测完成前不得硬编码 `ts` 或 `th` 专属路径。

## 画像探测

1. 检查用户给出的路由、根目录、文件路径：`src/views/ts*` 选 `ts`，`src/views/th*` 选 `th`。
2. 检查同级现有页面：目录前缀、路由模块、列表页、详情页归属必须同画像。
3. 检查 imports、组件、API、权限、操作日志、`locales`：用现有同模块写法校准画像。
4. 命中唯一画像后，整条链路只使用该画像；证据冲突或未知时继续只读探测或询问。

## 画像表

| 项 | `ts` 项目：TradeErp | `th` 项目：HallErp |
|----|---------------------|--------------------|
| 源码根 | `src/views/ts*/**` | `src/views/th*/**` |
| 标准列表页 | `src/views/tsProcurementManagement/tsMaterialOrdering/` | `src/views/thCustomerManagement/thCustomerInfo/` |
| 复杂参考页 | `src/views/tsProcurementManagement/tsProcurementOrdering/` | `src/views/thSampleSelectionManagement/thSampleSManagement/` |
| 路由形态 | `src/router/modules/ts{模块}Management.ts`；详情/静态页进 `src/router/modules/staticRoutes.ts` | `src/router/modules/th{模块}.ts`；详情/静态页进 `src/router/modules/staticRoutes.ts` |
| 列表/详情模式 | 列表与详情常分目录；新详情优先用单数 `Detail`，保留既有 legacy 目录名 | 详情多数内嵌在主单 `components/Detail.vue` 或 `MaiDetail.vue`；仅有证据时使用独立详情目录 |
| 详情模板 | `src/views/tsProcurementManagement/tsMaterialOrderingDetail/` | `thCustomerInfo/components/Detail.vue`；独立详情参考 `thOpenToPublicDetail` / `thSampleSelectionDetail` |
| 共享组件前缀 | `Th*`、`Re*` | `Th*`、`Re*` |
| i18n | `locales/zh-CN.yaml`、`locales/en.yaml`；常见命名空间含 `projectTitle`、`m`、`z`、`buttons`、`search`、`panel`、`menus`、`form`、`placeholder`、`label` | 同目录；额外常见命名空间含 `cm`、`tg`、`psv`、`product`、`so` |
| 权限 | `hasAuth(value, path?)`、`v-auth`、页内 `auth.ts` 导出 `AUTH_CODES` | `hasAuth(value, path?)`、`v-auth`、页内 `auth.ts` 或 `constants/` 导出权限码 |
| 操作日志 | `src/utils/operationLog.ts`；主流为 `OP_HEADERS[页名][动作].headers`，但存在混合写法，新增前先读同模块 | `src/utils/operationLog.ts`；主流为 `OP_HEADERS[PAGE{N}][AUTH{N}].headers`，但存在混合写法，新增前先读同模块 |
| API | `src/api/`；按域分文件，如 `procerement.ts`；POST + `Result` | `src/api/`；按域用 `hall*` 文件，如 `hallbasic.ts`、`hallnegotia.ts`、`hallquote.ts`、`hallroom.ts`；POST + `Result` |
| 字段设置 | `columns.field`、表单 `prop`、类型字段、API 字段、`fieldName`、i18n 标签必须指向同一业务字段；`sysRoleFiledCode` 跟随页面名 | 同左；遇 legacy 字段或文件名只在现有文件要求时保留 |

## 路径令牌

页面 skill 正文使用令牌描述画像差异，探测完成后再替换：

| 令牌 | 含义 | 示例 |
|------|------|------|
| `<profile-root>` | 当前画像的页面根范围 | `src/views/ts*/**` 或 `src/views/th*/**` |
| `<module>` | 当前业务模块目录 | `tsProcurementManagement`、`thCustomerManagement` |
| `<page>` | 列表页目录或页面名 | `tsMaterialOrdering`、`thCustomerInfo` |
| `<detail>` | 详情目录或内嵌详情组件 | `tsMaterialOrderingDetail`、`components/Detail.vue` |
| `<route-module>` | 路由模块文件 | `src/router/modules/tsXxxManagement.ts`、`src/router/modules/thXxx.ts` |
| `<api-file>` | 当前域 API 文件 | `src/api/procerement.ts`、`src/api/hallbasic.ts` |
| `<locale-file>` | 当前语言文件 | `locales/zh-CN.yaml`、`locales/en.yaml` |

不得在画像探测前把令牌替换成项目专属路径。

## API 文档画像

接口文档来源和检索规则统一读取 [t-api-docs](../t-api-docs/SKILL.md)。源码画像唯一命中 `ts` 时对应 Torna 贸易系统，唯一命中 `th` 时对应 Torna 展厅系统；商城与平台系统必须有用户明确指定或仓库唯一证据。普通“接口/API 文档”默认 Torna，不能仅因代码中存在 Swagger 配置就改走 Swagger。

## 新增第三画像

新增同模板项目时，只在本文件补一列或一组表项：源码根、路由形态、列表/详情模式、共享组件前缀、i18n、权限、操作日志、API、字段设置。

不要把第三画像判断复制到各 skill 正文；skill 继续读取本文件并替换路径令牌。

## 硬规则

- 未知画像时先询问或继续只读探测；永远不要猜。
- 同一任务只允许使用一个已确认画像；证据冲突时停下确认。
- `Th*`、`Re*` 是两项目共享前缀，不能单独作为画像证据。
- 操作日志和权限写法以同模块现有文件为准；不要机械套用另一项目。
