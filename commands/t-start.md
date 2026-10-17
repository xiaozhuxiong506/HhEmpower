---
name: t-start
description: 经 t-page 启动 Tsb ERP 页面开发，按当前调度模式完成需求分析、规范取证、实施、审查与验证。
---

# t-page 开发启动

先执行 [t-page 的项目分流](../skills/t-page/SKILL.md#项目分流)。命中新贸易时按项目 `docs/` 完成开发任务；其他项目继续执行下文流程。

读取 [t-page](../skills/t-page/SKILL.md) 和 [调度约定](../skills/t-page/orchestration.md)，按开发/修复权限执行。默认按需；同一任务已选择 [t-page-max](../skills/t-page-max/SKILL.md) 时保留全量模式。本命令不自行升级或重置模式。

1. 按入口完成前端需求分析、剩余澄清、系统画像和页面任务概览。产品文档先读 [t-requirement](../skills/t-requirement/SKILL.md)，仍有影响方案的歧义再读 [t-clarify](../skills/t-clarify/SKILL.md)。继承 [anchors.md](../skills/t-page/anchors.md) 的范围、业务闭环、责任、权限、共享影响和事实源边界。
2. 必读 [t-workflow](../skills/t-workflow/SKILL.md)、[t-standards](../skills/t-standards/SKILL.md) 及其 [reference.md](../skills/t-standards/reference.md)，再按实际任务读取专业 Skill。涉及接口文档时读 [t-api-docs](../skills/t-api-docs/SKILL.md)，普通接口查询默认 Torna，用户明确指定时才用 Swagger/OpenAPI。蓝图包含正向需求、要改/不改和复杂度预算；已有确认沿用，不重复询问。
3. 主 Agent 按当前模式确定所需角色。实现前由主 Agent 或已派发的 `t-survey` 给出适用的 import、公共表格 Hook 和现成能力复用证据；范围或事实阻塞时不开始写入。
4. 按依赖实现并完成对应模式的审查与验证。简单任务直接自检，非简单任务独立审查；适用规范未通过须修正、复查。最终报告实际参与者、结果和未执行项。

按需模式不派无关角色；全量模式由每个角色自行核查适用性。均不额外新增文件、依赖、功能或外部访问，不能用自检冒充独立代理回执。
