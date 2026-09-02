---
name: t-api-docs
description: Use when TSB ERP work needs 接口文档、API 文档、查接口、接口路径、请求参数、响应参数、字段类型、必填、长度、Torna、Swagger 或 OpenAPI 事实源。
---

# t-api-docs

## 来源门禁

| 用户表达 | 文档来源 |
| --- | --- |
| 接口、API、接口文档、API 文档、查接口 | **默认 Torna** |
| 明确说 Torna | Torna |
| 明确说 Swagger/OpenAPI | 现有 Swagger/OpenAPI 流程 |
| 同时指定 Torna 与 Swagger，或来源互相冲突 | 先询问用户 |

普通“接口/API 文档”不得解释成 Swagger，不得主动探测 Swagger URL、端口或 JSON。只有用户明确指定 Swagger/OpenAPI，才允许使用现有 Swagger 流程。

## Torna 项目

入口：[Torna Dashboard](http://docs.internal.tsb.com/#/dashboard)

| 系统 | `projectId` | 项目文档 |
| --- | --- | --- |
| 贸易系统 | `RqXBwzEl` | `http://docs.internal.tsb.com/#/project/doc/RqXBwzEl` |
| 展厅系统 | `kpX9MXr1` | `http://docs.internal.tsb.com/#/project/doc/kpX9MXr1` |
| 小竹熊平台-商城系统 | `57zLZ8Qw` | `http://docs.internal.tsb.com/#/project/doc/57zLZ8Qw` |
| 小竹熊平台-平台系统 | `m32QA20r` | `http://docs.internal.tsb.com/#/project/doc/m32QA20r` |

项目判定顺序：用户明确指定 > [t-page/profiles.md](../t-page/profiles.md) 的源码画像证据 > 当前仓库唯一证据。无法唯一确定时先问，不得猜。

## Torna 检索

优先调用 `torna_search_api`，入参必须包含 `system` 和 `query`；已知应用或方法时同时传 `moduleName`、`method`。唯一命中会返回详情；多个合理候选必须展示候选表并让用户确认业务目录或路径，不得自行选择。

需要指定文档详情时调用 `torna_get_api_detail`，传入真实 `docId`。MCP 不可用时，使用 Playwright 打开对应项目，在“过滤：支持ID、名称、路径”中检索并打开“预览”；Playwright 也不可用时，请用户自行打开文档链接粘贴字段信息，或把接口契约标记为“待确认”，不得凭记忆补全。

接口选择必须同时核对：系统、应用模块、业务目录、当前页面/API 调用、HTTP 方法和路径。中文名称相同不代表同一接口。

## 输出契约

候选接口使用 Markdown 表格：应用、业务目录、接口名称、方法、路径、文档 ID。详情按以下顺序输出：

1. 基本信息表。
2. 请求参数表：位置（Path/Query/Header/Body）、完整字段路径、类型、必填、最大长度、说明；Header 只展示字段契约，不展示值。
3. 响应参数表：完整字段路径、类型、说明。
4. 请求与响应示例：格式化 JSON 代码块；文档未提供示例时可按字段结构生成，但必须明确标注“根据字段结构生成，非文档原值”。

字段名、层级、类型、必填、长度、值域和说明必须原样来自文档；禁止按中文含义近似改名。

## 安全与清理

- Torna 工具只读；禁止调用调试、Mock、编辑、导入或删除接口。
- 不保存账号密码，不输出 Cookie、模块 token、Authorization 或文档中的敏感请求头。
- Torna 数据只在内存中处理，不落地 JSON。
- 用户明确要求 Swagger 且临时获取 Swagger JSON 时，用完立即删除，不占项目空间。
