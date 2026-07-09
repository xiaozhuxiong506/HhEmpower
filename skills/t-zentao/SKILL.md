---
name: t-zentao
description: Use when collecting, analyzing, grouping, dispatching, or summarizing Zentao tasks assigned to the current user through the TSB browser MCP server; triggers include 禅道, Zentao, assigned-to-me, 我的任务, Bug, 分组, 派发, MCP, 登录, 日志.
---

# t-zentao

## 必先使用工具（Required Tool First）

当可用工具中存在 `zentao_collect_assigned_tasks` 时，收集当前用户的禅道任务必须先调用它。不要手写浏览器抓取流程，也不要用记忆中的任务列表替代工具结果。

工具返回后，以原始任务数据为事实源，包括任务 ID、URL、标题、描述、备注、日志、状态和工具给出的模块识别结果。

## 登录边界（Login Boundary）

如果 `zentao_collect_assigned_tasks` 报告登录缺失、会话失效或页面要求重新登录，主 Agent 必须要求用户在打开的浏览器中登录，然后重新运行同一工具。

禅道未登录时不得伪造任务、不得创建样例任务、不得编造分组，也不得继续派发。规则标签：`do not fabricate`。

## 分组边界（Grouping Boundary）

模块分组必须来自工具结果、任务原文或用户明确说明。任务标题含糊、模块无法唯一确定、同一任务可能跨多个模块时，回到 `t-clarify` 或直接询问用户。

不要把“看起来像某模块”当成可派发结论。分组不清楚时，只能收集问题并等待澄清。

## 派发载荷（Dispatch Payload）

每个可派发任务必须携带完整载荷：

- 任务 ID。
- 禅道 URL。
- 标题。
- 原始描述或原始正文内容。
- 备注、日志或复现信息中与实现相关的原文。
- 模块分组和分组依据。

派发给执行者的内容必须保留原文，不得只给压缩摘要。摘要可以附在后面帮助阅读，但不能替代原始任务内容。

## 禁止事项（Prohibitions）

- 不得在未登录、工具失败或没有任务原文时派发。
- 不得只派发摘要，不附任务 ID、URL 和原始内容。
- 不得发明完成状态、处理人、优先级、复现步骤或验收结论。
- 不得把未分组任务强行派给某个模块执行者。
- 不得让执行者根据不完整禅道信息直接改文件；缺少关键上下文时先澄清。
