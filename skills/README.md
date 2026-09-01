# TSB ERP 技能索引

17 个 Skills，按任务直达。任务类型明确时直接读对应 skill，不经过索引。

## 技能总览

| 任务 | Skill |
| --- | --- |
| 产品需求分析 · 前后端责任拆分 | [t-requirement](t-requirement/SKILL.md) |
| 页面级入口路由 | [t-page](t-page/SKILL.md) |
| 需求澄清 | [t-clarify](t-clarify/SKILL.md) |
| 改动决策 · 必问单选 | [t-workflow](t-workflow/SKILL.md) |
| 新建模块 | [t-module](t-module/SKILL.md) |
| 主单列表 | [t-list](t-list/SKILL.md) |
| 详情明细 | [t-detail](t-detail/SKILL.md) |
| 弹窗抽屉 | [t-dialog](t-dialog/SKILL.md) |
| 页面标准 · 复杂度门禁 | [t-standards](t-standards/SKILL.md) |
| 权限边界 | [t-auth](t-auth/SKILL.md) |
| 字段设置 | [t-field](t-field/SKILL.md) |
| Tab 与保存编辑态 | [t-tab](t-tab/SKILL.md) |
| 操作日志 | [t-oplog](t-oplog/SKILL.md) |
| 路由与 Tab 发现 | [t-registry](t-registry/SKILL.md) |
| API 文档 · Torna/Swagger 分流 | [t-api-docs](t-api-docs/SKILL.md) |
| 禅道任务收集与分析 | [t-zentao](t-zentao/SKILL.md) |
| 钉钉聊天只读查询 | [t-dingtalk](t-dingtalk/SKILL.md) |

## 全局红线

所有页面类 skill 默认继承 [t-page/anchors.md](t-page/anchors.md)：范围、脚本禁令、业务闭环、责任审计、共享影响、Git 归因、权限等同用户、反绕过与临时产物清理。子 skill 未重复写明时，仍以 anchors 为准。

## 分组

| 分组 | Skills |
| --- | --- |
| 入口与调度 | `t-requirement` `t-page` `t-clarify` `t-workflow` `t-zentao` `t-dingtalk` |
| 页面结构 | `t-module` `t-list` `t-detail` `t-dialog` `t-registry` |
| 能力规则 | `t-standards` `t-auth` `t-field` `t-tab` `t-oplog` `t-api-docs` |

## 单一事实源

[profiles](t-page/profiles.md) · [anchors](t-page/anchors.md) · [naming](t-page/naming.md) · [orchestration](t-page/orchestration.md) · [t-requirement/reference](t-requirement/reference.md) · [t-standards/reference](t-standards/reference.md) · [t-module/reference](t-module/reference.md) · [t-registry/examples](t-registry/examples.md)

## 旧名映射

`ts-page-X → t-X`、`/ts-page-X → /t-X`（如 `ts-page-list` → `t-list`）；`trade-erp-ts-page` → `t-erp-page`。
