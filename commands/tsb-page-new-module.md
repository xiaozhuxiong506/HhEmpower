---
name: tsb-page-new-module
description: 新建 Tsb ERP（ts*/th*）业务页模块：探测项目、复制标准页、走命名/API/路由/OP_HEADERS/auth/i18n 全流程，可调度 subagent
---

# 新建 tsb 页面模块

按以下顺序执行，**必问项选定前不写代码**：

1. **探测项目** — 读 [skills/tsb-page/profiles.md](../skills/tsb-page/profiles.md)，判定 ts/th，确定标准页
2. Read Skill `tsb-page-module` + `tsb-page/anchors.md`
3. **AskQuestion** 是否做详情页（总表 #9，th 注意详情多内嵌）
4. 复制当前项目 `${标准页}`（+ 可选详情模板）
5. 输出蓝图：要改文件清单 / 不改范围 / 五处命名对照
6. 依次：API → OP_HEADERS（pageId 必问 #6，按 ts/th 形态）→ 路由 → 列表/详情 → i18n（#4→#5）→ auth（#10）→ registry 登记
7. 用户确认蓝图后再动手

可派 `tsb-scaffolder` 总装 + 实现 subagent 分头施工 → 读 [skills/tsb-page/orchestration.md](../skills/tsb-page/orchestration.md)

标准模板：按当前项目（ts→`tsMaterialOrdering`；th→`thCustomerInfo`）
