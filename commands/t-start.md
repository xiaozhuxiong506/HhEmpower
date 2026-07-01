---
name: t-start
description: 开始改业务页前先走工作流：探测项目、扫描模糊信号词（命中则读 t-clarify 硬卡停澄清三问）、读 Skill、读MCP、读rules、出蓝图、必问单选题、遇到范围不清时用 AskQuestion 确认
---

# t-page 开发启动

按以下顺序执行，**选定前不写代码**：

1. **探测项目** — 读 [skills/t-page/profiles.md](../skills/t-page/profiles.md)，判定当前是贸易系统还是展厅系统
2. **需求澄清（硬卡停关卡）** — 扫描用户原始需求，命中模糊信号词（那个/优化下/按上次/加个查询/随便/处理一下/像XX那样 等）→ Read [skills/t-clarify/SKILL.md](../skills/t-clarify/SKILL.md) 按其规则发起澄清三问，**用户答完前不得进入下一步**
3. Read Skill `t-workflow` + `t-page/anchors.md`
4. 根据任务类型 Read 对应子 Skill（见 `t-page` 路由表）
5. 输出：问题详述 → 总结说明 → 蓝图（要改 / 不改）
6. 范围不清时用 **AskQuestion** 单选确认（主单 / 详情 / 两者）
7. 用户确认蓝图后再动手改代码

大改/新模块/批量任务可派 subagent 分头干 → 读 [skills/t-page/orchestration.md](../skills/t-page/orchestration.md)

标准参考页见 `t-page/anchors.md`（按当前项目选对应系统）
