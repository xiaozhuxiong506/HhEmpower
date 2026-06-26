# 项目画像表（去硬编码的核心）

> 本插件同时服务 **Tsb.TradeErp.PC（ts*）** 与 **Tsb.HallErpTenant.PC（th*）**。
> 两项目同构（electron-pure-admin 孪生：Vue3 + Vite + element-plus + vxe-table + pinia + electron + vue-i18n），差异仅在业务前缀与少量约定。
> **任何 skill / agent 引用项目特定路径前，必须先按本文探测当前项目，套用对应列。**

## 自动探测流程（每个任务第一棒必做）

```
1. 读 package.json 的 name 字段 → 匹配下方画像表
2. 兜底：扫 src/views/ 一级目录，前缀 ts* 即 TradeErp，前缀 th* 即 HallErp
3. 探测命中后，整条链路用对应列的值替换 ${占位符}
```

## 画像表

| 探测字段 | 探测方法 | TradeErp | HallErp |
|---------|---------|----------|---------|
| **package.json name** | 读 name | `tsb-erp` | `tsb-hall-user` |
| **项目别名（本文简称）** | — | ts 项目 | th 项目 |
| **views 前缀（`${views前缀}`）** | 扫 src/views | `ts` | `th` |
| **业务页 glob** | `${views前缀}*` | `src/views/ts*/**` | `src/views/th*/**` |
| **标准模板页（`${标准页}`）** | 结构最全的列表页 | `tsMaterialOrdering` | `thCustomerInfo` |
| **标准页完整路径** | — | `src/views/tsProcurementManagement/tsMaterialOrdering/` | `src/views/thCustomerManagement/thCustomerInfo/` |
| **复杂参考页** | 弹窗/Drawer 最多 | `tsProcurementOrdering` | `thSampleSManagement` |
| **详情模板** | — | `tsMaterialOrderingDetail` | 内嵌 `components/Detail.vue`（少数用 `thXxxDetail` 目录） |
| **详情后缀约定** | 扫后缀 | 混用 `Detail`/`Details`（新页用单数 `Detail`） | 多数内嵌；独立目录仅 `thOpenToPublicDetail`/`thSampleSelectionDetail` |
| **OP_HEADERS 形态** | 读 `src/utils/operationLog.ts`（⚠ 两项目均有混合格式——ts 项目约 100 个页名 key + 4 处 PAGE；th 项目 59 个 PAGE + 少量页名 key。新增时**先读同模块现有写法**，不机械套规则） | 主流 `OP_HEADERS[页名][动作]={headers:{pageTitle,useTitle,pageId}}` | 主流 `OP_HEADERS[PAGE{N}][AUTH{N}].headers={pageTitle,useTitle,pageId}` |
| **OP_HEADERS 文件** | — | `src/utils/operationLog.ts` | `src/utils/operationLog.ts` |
| **API 目录（`${api目录}`）** | src/api | `src/api/` | `src/api/` |
| **API 文件命名** | — | 按域分文件，如 `procerement.ts` | 按域 `hall*` 前缀，如 `hallbasic.ts`/`hallnegotia.ts`/`hallquote.ts`/`hallroom.ts` |
| **API 函数约定** | POST + Result | `http.request<Result>("post", \`${baseURL}/tpr/{Controller}/{Action}\`, {data}, headers)` | 同（POST + Result，前缀按域替换） |
| **locales 目录** | 根目录 | `locales/zh-CN.yaml` + `locales/en.yaml` | `locales/zh-CN.yaml` + `locales/en.yaml` |
| **locales 顶层命名空间** | 读 yaml 顶层 key | `projectTitle`/`m`/`z`/`buttons`/`search`/`panel`/`menus`/`status`/`login`/`home`/`form`/`placeholder`/`label`/`result`/`g`/`l`/`tsb`/`fm` | `projectTitle`/`cm`/`m`/`z`/`buttons`/`search`/`panel`/`menus`/`status`/`login`/`home`/`form`/`placeholder`/`label`/`result`/`g`/`l`/`tsb`/`fm`/`tg`/`psv`/`product`/`so` |
| **权限：hasAuth** | src/router/utils.ts | `hasAuth(value, path?)` | `hasAuth(value, path?)`（同） |
| **权限：v-auth 指令** | src/directives/auth/ | ✅ | ✅ |
| **权限：AUTH_CODES** | 页内 auth.ts | 页 `auth.ts` 导 `AUTH_CODES` | 多数页 `auth.ts`/`constants/` 内（同思路） |
| **路由模块文件** | src/router/modules/ | `ts{模块}Management.ts` 等 | `th{模块}.ts` 等 |
| **菜单页注册** | 路由 children | `src/router/modules/ts*.ts` | `src/router/modules/th*.ts` |
| **静态/详情页注册** | showLink:false | `src/router/modules/staticRoutes.ts` | `src/router/modules/staticRoutes.ts` |
| **共享组件前缀** | src/components | `Th*` + `Re*` | `Th*` + `Re*`（同） |
| **独有子系统** | — | — | `src/tsb/`（小竹熊子应用，不走标准页栈，D 档） |

## 占位符替换规则

skill / agent 正文里凡见 `${...}`，一律按当前探测结果替换：

| 占位符 | 含义 | 示例(TradeErp) |
|--------|------|---------------|
| `${views前缀}` | ts 或 th | `ts` |
| `${标准页}` | 标准模板页目录名 | `tsMaterialOrdering` |
| `${标准页路径}` | 完整路径 | `src/views/tsProcurementManagement/tsMaterialOrdering/` |
| `${api目录}` | API 所在目录 | `src/api/` |
| `${api文件}` | 该域 API 文件 | `procerement.ts` |
| `${OP形态}` | OP_HEADERS 写法形态 | `[页名][动作]` |
| `${locales目录}` | locales 目录 | `locales/` |

## 新增第三个项目时（扩展指引）

本文以两项目为基线。若未来加入同模板第三 ERP：
1. 先跑「自动探测流程」确认无法命中现有两列
2. 在画像表新增一列，填齐探测字段
3. 选定其标准模板页（结构最全、含完整 vxe + ThToolbar + OP_HEADERS 栈）
4. 无需改任何 skill / agent 正文（它们都引用占位符）

> 四条红线、命名规则、OP_HEADERS/pageId 必问等**方法论不随项目变**，仅"具体值"按列替换。
