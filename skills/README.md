# TSB ERP 技能索引

35 个 Skills，包含 19 个 ERP 工作流技能和 16 个钉钉专用技能。日常页面任务使用 `/t-page + 任务描述`，主 Agent 按需分工；需要全部 22 个角色时使用 `/t-page-max + 任务描述`。新贸易项目由入口读取项目根目录 `docs/` 规范。单独查询规范、接口、禅道或钉钉时可直达对应 Skill。

## 技能总览

| 任务 | Skill |
| --- | --- |
| 产品需求分析 · 前后端责任拆分 | [t-requirement](t-requirement/SKILL.md) |
| 页面按需入口 | [t-page](t-page/SKILL.md) |
| 页面全量入口 | [t-page-max](t-page-max/SKILL.md) |
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
| 防御性编程 · 边界校验 · 吞异常 | [t-defense](t-defense/SKILL.md) |
| 禅道任务收集与分析 | [t-zentao](t-zentao/SKILL.md) |
| 钉钉聊天只读查询 | [t-dingtalk](t-dingtalk/SKILL.md) |

## 钉钉专用技能

| 任务 | Skill |
| --- | --- |
| 跨产品入口与共享约定 | [dingtalk-shared](dingtalk-shared/SKILL.md) |
| AI 卡片 | [dingtalk-aicard](dingtalk-aicard/SKILL.md) |
| AI 搜问 | [dingtalk-aisearch](dingtalk-aisearch/SKILL.md) |
| AI 表格 | [dingtalk-aitable](dingtalk-aitable/SKILL.md) |
| 日历与会议室 | [dingtalk-calendar](dingtalk-calendar/SKILL.md) |
| 群聊与消息 | [dingtalk-chat](dingtalk-chat/SKILL.md) |
| 通讯录 | [dingtalk-contact](dingtalk-contact/SKILL.md) |
| 在线文档 | [dingtalk-doc](dingtalk-doc/SKILL.md) |
| 文件与钉盘 | [dingtalk-drive](dingtalk-drive/SKILL.md) |
| 事件监听 | [dingtalk-event](dingtalk-event/SKILL.md) |
| 邮箱 | [dingtalk-mail](dingtalk-mail/SKILL.md) |
| AI 听记 | [dingtalk-minutes](dingtalk-minutes/SKILL.md) |
| 审批、考勤等其他产品 | [dingtalk-misc](dingtalk-misc/SKILL.md) |
| 数字员工 | [dingtalk-tag](dingtalk-tag/SKILL.md) |
| 待办 | [dingtalk-todo](dingtalk-todo/SKILL.md) |
| 知识库 | [dingtalk-wiki](dingtalk-wiki/SKILL.md) |

## 全局红线

所有页面类 skill 默认继承 [t-page/anchors.md](t-page/anchors.md)：范围、脚本禁令、业务闭环、责任审计、共享影响、Git 归因、权限等同用户、反绕过与临时产物清理。子 skill 未重复写明时，仍以 anchors 为准。

## 分组

| 分组 | Skills |
| --- | --- |
| 入口与调度 | `t-requirement` `t-page` `t-page-max` `t-clarify` `t-workflow` `t-zentao` `t-dingtalk` |
| 页面结构 | `t-module` `t-list` `t-detail` `t-dialog` `t-registry` |
| 能力规则 | `t-standards` `t-auth` `t-field` `t-tab` `t-oplog` `t-api-docs` `t-defense` |

## 单一事实源

[profiles](t-page/profiles.md) · [anchors](t-page/anchors.md) · [naming](t-page/naming.md) · [orchestration](t-page/orchestration.md) · [t-requirement/reference](t-requirement/reference.md) · [t-standards/reference](t-standards/reference.md) · [t-module/reference](t-module/reference.md) · [t-registry/examples](t-registry/examples.md)
