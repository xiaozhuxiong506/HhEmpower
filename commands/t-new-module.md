---
name: t-new-module
description: 经 t-page 新建 Tsb ERP 页面模块，取证标准页并确认范围后，按当前调度模式完成骨架、契约、页面、登记、独立审查与验证。
---

# 新建 Tsb ERP 页面模块

读取 [t-page](../skills/t-page/SKILL.md)、[调度约定](../skills/t-page/orchestration.md) 和 [t-module](../skills/t-module/SKILL.md)，按开发权限执行。默认按需选择角色；同一任务已选 [t-page-max](../skills/t-page-max/SKILL.md) 时保留全量模式，不另起链路。

1. 按入口分析前端需求、探测 ts/th 画像，确认模块归属、主单/详情范围、业务闭环和权限边界。新增文件、依赖、抽象与调用层级写入复杂度预算。
2. 由 `t-survey` 读取当前项目标准页，给出 import 顺序、公共表格 Hook、API 和复用能力的实际证据。蓝图及必要决策确认前不复制模板或写代码。
3. 主 Agent 按当前模式分工，由 `t-scaffold` 准备必要骨架，再交各专项负责人实现；多模块任务安排 `t-mod` 分工。全量模式遵守全量阶段表；同一文件只有一个当前写入者。
4. 命名、API、OP_HEADERS、auth、i18n、字段、路由和详情按对应 Skill 的现行事实源与确认要求处理；不编造接口、pageId 或权限码，不把别的模块值当占位值。
5. 完成登记和影响复核后，依次收齐 `t-spec`、`t-code`、`t-build` 回执；涉及文案时加 `t-i18n-check` 与 t-spec 同阶段核查，全量模式始终保留。所有适用规范及最终版本验证通过后，主 Agent 才能判定可交付。

按需模式不派无关角色，全量模式由角色核查后说明不适用；不存在的详情、弹窗或共享改动不为凑齐角色而创建。
