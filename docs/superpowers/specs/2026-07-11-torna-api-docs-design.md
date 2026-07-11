# Torna API 文档检索设计

## 目标

TSB ERP 中，用户只说“接口”“API 文档”或“查接口”时，默认读取 Torna；只有用户明确指定 Swagger/OpenAPI 时才进入现有 Swagger 流程。

## Torna 事实链路

1. `GET /doc/view/projects` 获取空间与项目。
2. `GET /module/list?projectId=...` 获取应用模块。
3. `POST /doc/list-v2`，请求体为 `moduleId/status/filterEmptyFolder`，获取接口候选。
4. `GET /doc/view/detail?id=...` 获取请求参数、响应参数和示例。

## 项目映射

| 系统 | projectId | 文档地址 |
| --- | --- | --- |
| 贸易系统 | `RqXBwzEl` | `http://docs.internal.tsb.com/#/project/doc/RqXBwzEl` |
| 展厅系统 | `kpX9MXr1` | `http://docs.internal.tsb.com/#/project/doc/kpX9MXr1` |
| 小竹熊平台-商城系统 | `57zLZ8Qw` | `http://docs.internal.tsb.com/#/project/doc/57zLZ8Qw` |
| 小竹熊平台-平台系统 | `m32QA20r` | `http://docs.internal.tsb.com/#/project/doc/m32QA20r` |

## MCP

- `torna_search_api`：按系统、名称/路径、应用模块、HTTP 方法检索候选。
- `torna_get_api_detail`：按文档 ID 读取详情。
- 使用非持久化 Playwright context；登录 token 只保留在 MCP 进程内存中，不保存账号密码、Cookie、模块 token 或敏感请求头。
- 只调用 Torna 只读接口，不调用调试、Mock、编辑或导入接口。
- 响应数据只在内存中处理，不生成 Swagger/Torna JSON 临时文件。

## 输出契约

候选结果使用 Markdown 表格展示系统、应用、目录、名称、方法、路径和文档 ID。详情按基本信息、请求参数、响应参数、请求示例、响应示例分区；参数表展示完整字段路径、类型、必填、最大长度和说明。文档未提供示例时可按字段结构生成，但必须标注“非文档原值”。多个候选同样合理时只返回候选并要求用户确认，不擅自选择。

## 同步入口

新增 `t-api-docs` 作为单一事实源，并让 `t-page`、`t-workflow`、`t-field`、`t-standards`、`t-api` agent、commands 和 rules 引用它。Swagger 原流程保持不变，只收紧触发条件。
