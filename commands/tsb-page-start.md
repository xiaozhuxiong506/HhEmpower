---
name: tsb-page-start
description: 开始改 Tsb ERP（ts*/th*）业务页前先走工作流：探测项目、读 Skill、出蓝图、必问单选题
---

# tsb-page 开发启动

按以下顺序执行，**选定前不写代码**：

1. **探测项目** — 读 [skills/tsb-page/profiles.md](../skills/tsb-page/profiles.md)，判定当前是 TradeErp(ts) 还是 HallErp(th)
2. Read Skill `tsb-page-workflow` + `tsb-page/anchors.md`
3. 根据任务类型 Read 对应子 Skill（见 `tsb-page` 路由表）
4. 输出：问题详述 → 总结说明 → 蓝图（要改 / 不改）
5. 范围不清时用 **AskQuestion** 单选确认（主单 / 详情 / 两者）
6. 用户确认蓝图后再动手改代码

大改/新模块可派 subagent 分头干 → 读 [skills/tsb-page/orchestration.md](../skills/tsb-page/orchestration.md)

标准参考页见 `tsb-page/anchors.md`（按当前项目 ts/th 选）
