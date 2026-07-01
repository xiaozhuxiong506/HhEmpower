---
name: t-workflow
description: >-
  Tsb ERP（ts*/th*）改代码工作流：蓝图、必问单选题、主单/详情范围、最简代码、参考模块必查locales、pageId必问。
  Use when 改代码, 修bug, 新需求, 删功能, 改页面, 蓝图, 主单, 详情, 参考模块, 国际化,
  单选题, 最小改动, pageId, 操作日志, 任何对话开始写代码前.
---

# 改动工作流（Tsb ERP 通用）

> 总入口：[t-page](../t-page/SKILL.md) · 画像：[profiles.md](../t-page/profiles.md) · 锚点：[anchors.md](../t-page/anchors.md) · 细则：[reference.md](reference.md)

## 第 0 步：探测项目

任何工作流开始前先读 [profiles.md](../t-page/profiles.md)，判定当前是 ts（TradeErp）还是 th（HallErp），后续 `${占位符}` 套用对应列。

## 对话蓝图（先于写代码）

用户说「直接改/不用蓝图」时可省略。否则每次回复按序：

1. **问题详述** — 现象、根因、涉及模块
2. **总结说明** — 结论与处理方向
3. **蓝图** — **要改 / 不改**（清单）

模板 → [reference.md#对话蓝图模板](reference.md#对话蓝图模板)

## 疑问与歧义（必用 AskQuestion）

以下情况**必须先单选**，选定前 **不写代码、不 Grep 删改、不大范围动文件**：

- 意图不清、需求多义、技术方案多条路径
- **主单 vs 详情范围不清** → [anchors.md#主单--详情映射](../t-page/anchors.md#主单--详情映射)
- 删/改/加功能，且主单与详情（或同页多入口）均可能存在
- 弹窗/抽屉/表单**新增字段** → [t-field](../t-field/SKILL.md)
- Tab/弹窗**新增改数据或确认按钮** → [t-tab](../t-tab/SKILL.md)

**提问规则**：AskQuestion 单选 · 每题 2~4 项 · 一题一事 · 禁止默认主单 · 禁止开放式糊问

**全 Skill 必问题目** → [reference.md#必问单选题总表](reference.md#必问单选题总表)

## 改代码前（用户已说明则跳过）

> 这次是 **Bug 修复** 还是 **新需求**？→ 总表 #1

## Bug 修复

1. 找根因，不只改表象
2. Grep 同函数/字段/API/**兄弟页与 Tab 子组件**（见 t-registry）
3. 对照标准页同位置写法（见 anchors，按当前项目 ts/th 选标准页）
4. **最简代码** — 最小改动，不顺手重构
5. 改完：原问题 OK、关联已同步、无新 lint/类型错误

**必查关联**：API · type.ts · columns · auth · i18n(zh+en) · OP_HEADERS · 列表+详情+Tab

## 新需求

1. 确认范围，以本项目标准页为模板抄结构（ts→tsMaterialOrdering；th→thCustomerInfo）
2. 按场景读子 Skill（module / list / detail / auth / dialog）
3. 六处 name 一致（含 columns↔type 字段）· OP_HEADERS · hasAuth · virtualYConfig
4. **非必须不改 locales**；新增 key → 总表 #4 → #5 → **改派 [t-i18n](../../agents/t-i18n.md) 写**（不要散在 view-assembler/dialog-builder 多手写）

## i18n

- **新增 key** → 总表 #5，选定前不得写 locales
- **参考他模块** → 用 `t('key')` 前必查 yaml 实际文案；指错模块则新增 key

细则与反例 → [reference.md#参考他模块时的-i18n](reference.md#参考他模块时的-i18n)

## pageId / 抽离 / 批量

| 场景 | 处理 |
|------|------|
| 新增 OP_HEADERS | 总表 #6 → [t-oplog](../t-oplog/SKILL.md) |
| 多文件可复用写法 | 总表 #7 问是否抽离；默认 **不抽离** |
| 多文件同类修改 | **禁止脚本**：跨模块按菜单拆 `t-mod` 实例并行；单模块逐文件 AI 改 |

## 最简代码（必守）

只改当前问题所需 · 照抄标准页一小段 · 不新造 hook/工具层 · 冲突时 **以更简单为准**

编码克制 → [t-standards](../t-standards/SKILL.md) · 命名红线：禁止下划线，一律小驼峰
