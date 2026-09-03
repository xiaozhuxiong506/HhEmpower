---
name: t-start
description: 经 t-page 启动 Tsb ERP 页面开发，完成需求分析、规范取证和蓝图后，由全部 22 个角色分阶段实施、审查与验证。
---

# t-page 开发启动

读取 [t-page](../skills/t-page/SKILL.md) 和 [全员调度](../skills/t-page/orchestration.md)，按开发/修复模式执行完整链路。本命令不维护另一套可选调度流程。

1. 按入口完成前端需求分析、剩余澄清、系统画像和页面任务概览。产品文档先读 [t-requirement](../skills/t-requirement/SKILL.md)，仍有影响方案的歧义再读 [t-clarify](../skills/t-clarify/SKILL.md)。继承 [anchors.md](../skills/t-page/anchors.md) 的范围、业务闭环、责任、权限、共享影响和事实源边界。
2. 必读 [t-workflow](../skills/t-workflow/SKILL.md)、[t-standards](../skills/t-standards/SKILL.md) 及其 [reference.md](../skills/t-standards/reference.md)，再按实际任务读取专业 Skill。涉及接口文档时读 [t-api-docs](../skills/t-api-docs/SKILL.md)，普通接口查询默认 Torna，用户明确指定时才用 Swagger/OpenAPI。蓝图包含正向需求、要改/不改和复杂度预算；已有确认沿用，不重复询问。
3. 主 Agent 实际派发全部 22 个角色。实现前由 `t-survey` 给出 import、公共表格 Hook 和现成能力复用证据；范围或事实阻塞时不开始写入。
4. 按依赖实现，随后完成 `t-spec` + `t-i18n-check` → `t-code` → `t-build`。适用规范未通过须修正、复查，最终报告包含逐角色真实回执和未执行项。

无关角色自行核查后返回不适用；不为全员参与新增文件、依赖、功能或外部访问。没有子代理能力时明确报告阻塞，不能用主 Agent 自检冒充全员执行。
