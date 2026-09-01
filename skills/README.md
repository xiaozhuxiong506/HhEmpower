# TSB ERP 技能

## 入口

- 产品需求、需求文档、原型说明、前后端混写或前端改动点分析，从 [t-requirement](t-requirement/SKILL.md) 开始；先输出规范化报告，再澄清剩余问题。
- 页面、路由、主单、详情、弹窗、抽屉、字段、权限、操作日志、业务闭环、责任归属或页面级路由工作，从 [t-page](t-page/SKILL.md) 开始。
- 接口文档、API 文档、Torna 或 Swagger/OpenAPI 来源判定，从 [t-api-docs](t-api-docs/SKILL.md) 开始。
- Zentao 任务收集、分析、分组或派发，从 [t-zentao](t-zentao/SKILL.md) 开始。
- 钉钉群聊、单聊、聊天记录或关键词消息只读查询，从 [t-dingtalk](t-dingtalk/SKILL.md) 开始。

## 快捷命令

专家已明确任务类型时，可以直接读对应 skill；不要在索引里复制它们的工作流。

| 任务 | Skill |
|------|-------|
| 产品需求分析与前后端责任拆分 | `t-requirement` |
| 需求澄清 | `t-clarify` |
| 页面级入口路由 | `t-page` |
| 改动决策、必问单选 | `t-workflow` |
| 新建模块 | `t-module` |
| 主单列表 | `t-list` |
| 详情明细 | `t-detail` |
| 弹窗抽屉 | `t-dialog` |
| 页面标准 | `t-standards` |
| 权限 | `t-auth` |
| 字段设置 | `t-field` |
| Tab 与保存编辑态 | `t-tab` |
| 操作日志 | `t-oplog` |
| 路由与 Tab 发现 | `t-registry` |
| API 文档与 Torna/Swagger 分流 | `t-api-docs` |
| Zentao | `t-zentao` |
| 钉钉聊天只读查询 | `t-dingtalk` |

## 全局红线

所有页面类 skill 默认继承 [t-page/anchors.md](t-page/anchors.md)：范围、脚本禁令、业务闭环、责任审计、共享影响、Git 归因、权限等同用户、反绕过和临时产物清理。子 skill 没有重复写明时，仍以 anchors 为准。

## 技能分组

| 分组 | 内容 |
|------|------|
| 入口与调度 | `t-requirement`、`t-page`、`t-clarify`、`t-workflow`、`t-zentao`、`t-dingtalk`、`t-page/orchestration.md` |
| 页面结构 | `t-module`、`t-list`、`t-detail`、`t-dialog`、`t-registry` |
| 能力规则 | `t-standards`、`t-auth`、`t-field`、`t-tab`、`t-oplog`、`t-api-docs` |
| 支持文档 | `t-page/profiles.md`、`t-page/anchors.md`、`t-page/naming.md`、各 skill 的 `reference.md` 或 `examples.md` |

## 单一事实源

- [t-page/profiles.md](t-page/profiles.md)
- [t-page/anchors.md](t-page/anchors.md)
- [t-page/naming.md](t-page/naming.md)
- [t-page/orchestration.md](t-page/orchestration.md)
- [t-requirement/reference.md](t-requirement/reference.md)
- [t-standards/reference.md](t-standards/reference.md)
- [t-module/reference.md](t-module/reference.md)
- [t-registry/examples.md](t-registry/examples.md)

## 旧名映射

| 旧名 | 新名 |
|------|------|
| `trade-erp-ts-page` | `t-erp-page` |
| `ts-page` | `t-page` |
| `ts-page-workflow` | `t-workflow` |
| `ts-page-standards` | `t-standards` |
| `ts-page-list` | `t-list` |
| `ts-page-detail` | `t-detail` |
| `ts-page-dialog` | `t-dialog` |
| `ts-page-module` | `t-module` |
| `ts-page-auth` | `t-auth` |
| `ts-page-operation-log` | `t-oplog` |
| `ts-page-field-setting` | `t-field` |
| `ts-page-tab-editability` | `t-tab` |
| `ts-page-registry` | `t-registry` |
| `/ts-page-start` | `/t-start` |
| `/ts-page-new-module` | `/t-new-module` |
| `/ts-page-review` | `/t-review` |
