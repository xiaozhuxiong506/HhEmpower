---
name: tsb-page-review
description: 审查刚改完的 Tsb ERP（ts*/th*）业务页：规范符合、文案核查、代码质量，可调度审查 subagent 组
---

# tsb 页面改动审查

1. 获取本次改动的 `git diff` 或用户指定的文件列表
2. **探测项目** — 读 [skills/tsb-page/profiles.md](../skills/tsb-page/profiles.md)
3. 两阶段审查（可派 subagent）：
   - 第一阶段：`tsb-spec-reviewer`（规范符合）∥ `tsb-i18n-checker`（文案核查）
   - 第二阶段：`tsb-code-reviewer`（代码质量+终审）
4. Read 相关 Skill：`tsb-page/anchors.md` + 改动涉及的子 Skill
5. **只输出审查报告**，不直接改代码（除非用户明确要求修复）

调度矩阵 → [skills/tsb-page/orchestration.md](../skills/tsb-page/orchestration.md)

重点：主单/详情是否改错 · 五处命名一致 · locales 是否指错模块 · OP_HEADERS 是否漏传 · virtualYConfig · 字段设置
