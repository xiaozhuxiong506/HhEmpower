---
name: t-start
description: 开始改业务页前先走工作流：探测项目、扫描模糊/绕过信号词、读 Skill/MCP/rules、承接业务闭环/责任审计/权限边界、出蓝图、必问单选题
---

# t-page 开发启动

按以下顺序执行，**选定前不写代码**：

1. **探测项目** — 读 [skills/t-page/profiles.md](../skills/t-page/profiles.md)，判定当前是贸易系统还是展厅系统
2. **需求澄清（硬卡停关卡）** — 扫描用户原始需求，命中模糊信号词（那个/优化下/按上次/加个查询/随便/处理一下/像XX那样 等）→ Read [skills/t-clarify/SKILL.md](../skills/t-clarify/SKILL.md) 按其规则发起澄清三问，**用户答完前不得进入下一步**
3. Read Skill `t-workflow` + `t-page/anchors.md`，必须承接范围、业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过和临时产物清理关卡
4. 根据任务类型 Read 对应子 Skill（见 `t-page` 路由表）
5. 输出：问题详述 → 总结说明 → 蓝图（要改 / 不改）
6. 范围、业务闭环、责任归属、权限边界或字段契约不清时用 **AskQuestion** 单选确认（主单 / 详情 / 两者 / 仅指定入口 / 连同校验一起改 / 先做影响分析）
7. 用户确认蓝图后再动手改代码

大改/新模块/批量任务可派 subagent 分头干 → 读 [skills/t-page/orchestration.md](../skills/t-page/orchestration.md)

标准参考页见 `t-page/anchors.md`（按当前项目选对应系统）
