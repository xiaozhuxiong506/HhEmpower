---
name: t-start
description: 开始改业务页前先走工作流：探测项目、分析产品需求与前端改动点、扫描剩余模糊/绕过信号词、读 Skill/MCP/rules、承接业务闭环/责任审计/权限边界、出蓝图、必问单选题
---

# t-page 开发启动

按以下顺序执行，**选定前不写代码**：

1. **探测项目** — 读 [skills/t-page/profiles.md](../skills/t-page/profiles.md)，判定当前是贸易系统还是展厅系统
2. **前端需求分析** — 输入为产品需求、需求文档、原型说明或前后端混写描述时，先 Read [skills/t-requirement/SKILL.md](../skills/t-requirement/SKILL.md)，结合产品文档、前端源码和必要的 Torna 事实输出十节《前端需求分析报告》；仅有文档时输出“文档初判版”
3. **剩余需求澄清（硬卡停关卡）** — 分析后仍有会改变前端方案的模糊项，或命中反绕过信号词 → Read [skills/t-clarify/SKILL.md](../skills/t-clarify/SKILL.md) 按其规则发起澄清三问，**用户答完前不得进入下一步**
4. Read Skill `t-workflow` + `t-page/anchors.md`，必须承接范围、业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过和临时产物清理关卡
5. 根据任务类型 Read 对应子 Skill（见 `t-page` 路由表）；涉及接口/API 文档时必须 Read [t-api-docs](../skills/t-api-docs/SKILL.md)，普通接口文档默认 Torna，明确指定 Swagger/OpenAPI 才走 Swagger
6. 输出：问题详述 → 总结说明 → 蓝图（复杂度预算 / 要改 / 不改）；复杂度预算必须写明档位、最小方案、预计修改现有文件，以及预计新增文件、新增依赖、新增抽象或层级。小型改动四项结构成本默认均为“无”；任一非“无”必须说明必要性，存在同样满足需求的更简单方案时采用简单方案；业务/复杂函数必须规划意图型注释
7. 范围、业务闭环、责任归属、权限边界或字段契约不清时用 **AskQuestion** 单选确认（主单 / 详情 / 两者 / 仅指定入口 / 连同校验一起改 / 先做影响分析）
8. 用户确认蓝图后再动手改代码

大改/新模块/批量任务可派 subagent 分头干 → 读 [skills/t-page/orchestration.md](../skills/t-page/orchestration.md)

标准参考页见 `t-page/anchors.md`（按当前项目选对应系统）
