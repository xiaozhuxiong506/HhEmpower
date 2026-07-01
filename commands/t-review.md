---
name: t-review
description: 审查刚改完的所有代码：代码规范、文案核查、代码质量，可调度审查 subagent 组
---

# tsb 页面改动审查

1. 获取本次改动的 `git diff` 或用户指定的文件列表
2. **需求澄清（硬卡停关卡）** — 扫描用户原始需求，命中模糊信号词（那个改动/那次/那个模块/处理一下 等）→ Read [skills/t-clarify/SKILL.md](../skills/t-clarify/SKILL.md) 按其规则发起澄清三问，**用户答完前不得进入下一步**
3. **探测项目** — 读 [skills/t-page/profiles.md](../skills/t-page/profiles.md)
4. 两阶段审查（可派 subagent）：
   - 第一阶段：`t-spec`（规范符合）∥ `t-i18n-check`（文案核查）
   - 第二阶段：`t-code`（代码质量+终审）
5. Read 相关 Skill：`t-page/anchors.md` + 改动涉及的子 Skill
6. **只输出审查报告**，不直接改代码（除非用户明确要求修复）

调度矩阵 → [skills/t-page/orchestration.md](../skills/t-page/orchestration.md)

重点：主单/详情是否改错 · 六处命名一致 · locales 是否指错模块 · OP_HEADERS 是否漏传 · virtualYConfig · 字段设置
