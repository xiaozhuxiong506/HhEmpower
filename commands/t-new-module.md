---
name: t-new-module
description: 新建 Tsb ERP（ts*/th*）业务页模块：探测项目、复制标准页、走命名/API/路由/OP_HEADERS/auth/i18n 全流程，可调度 subagent
---

# 新建 tsb 页面模块

按以下顺序执行，**必问项选定前不写代码**：

1. **探测项目** — 读 [skills/t-page/profiles.md](../skills/t-page/profiles.md)，判定 ts/th，确定标准页
2. **需求澄清（硬卡停关卡）** — 扫描用户原始需求，命中模糊信号词（那个/优化下/按上次/加个查询/随便/处理一下/像XX那样 等）→ Read [skills/t-clarify/SKILL.md](../skills/t-clarify/SKILL.md) 按其规则发起澄清三问，**用户答完前不得进入下一步**
3. Read Skill `t-module` + `t-page/anchors.md`
4. **AskQuestion** 是否做详情页（总表 #9，th 注意详情多内嵌）
5. 复制当前项目 `${标准页}`（+ 可选详情模板）
6. 输出蓝图：要改文件清单 / 不改范围 / 六处命名对照
7. 依次：API → OP_HEADERS（pageId 必问 #6，按 ts/th 形态）→ 路由 → 列表/详情 → i18n（#4→#5）→ auth（#10）→ registry 登记
8. 用户确认蓝图后再动手

可派 `t-scaffold` 总装 + 实现 subagent 分头施工 → 读 [skills/t-page/orchestration.md](../skills/t-page/orchestration.md)

标准模板：按当前项目（ts→`tsMaterialOrdering`；th→`thCustomerInfo`）
