---
name: t-standards
description: >-
  Tsb ERP（ts*/th*）页面编码规范：命名、列宽、解耦、import顺序、禁止下划线、写法克制。
  Use when 命名, 列宽, minWidth, 耦合, import顺序, 代码规范, columns, auth职责, 泛型.
---

# 页面编码规范（Tsb ERP 通用）

标准页与主单/详情映射 → [../t-page/anchors.md](../t-page/anchors.md)
命名细则（六处一致 + tsb 规则）→ [../t-page/naming.md](../t-page/naming.md)

遵循 Rule `page-tailwind-and-utils`（项目内 tailwind/utils 规范，两项目通用）。

## 文件与模块命名

→ 见 [../t-page/naming.md](../t-page/naming.md)（六处一致、固定文件名、组件/API 命名、命名红线）

## 模块耦合

主单与详情各管各的。**允许**详情引用主单 auth/组件；**禁止**主单引用详情目录。

范围规则 → [../t-page/anchors.md](../t-page/anchors.md#主单--详情映射)

## 文件职责（单一职责）

| 文件 | 只写 |
|------|------|
| `columns.ts` | 列定义、formatter |
| `auth.ts` | AUTH_CODES |
| `type.ts` | 类型、枚举 |
| `index.vue` | 组装、事件、取数 |
| `components/` | 弹窗、Drawer |

## 写法克制

最简可用 · 照抄标准页 · 禁止过度泛型/封装/设计 · 抽离须用户确认（workflow 总表 #7）

## 命名红线

禁止下划线（`xxx_yyy`），一律小驼峰。例外：`DEFAULT_COLUMNS`、`AUTH_CODES` 后端码。

函数前缀：`get` · `handle` · `to` · `open` · `refresh` · `guard`

## 列宽（新需求页）

- **禁止** `minWidth`（含 columnConfig.minWidth）
- 主单 grid：业务列 < 9 不设 width；>= 9 用通用值
- 弹窗 grid：业务列 < 7 不设 width；>= 7 用通用值

通用 width、columns 属性顺序、import 顺序、virtualYConfig、select empty-values → [reference.md](reference.md)

## 虚拟列表（必配）

```typescript
rowConfig: { keyField: "id", isHover: true },
virtualYConfig: { enabled: true, gt: 10, oSize: 5 }
```

模板须 `:height="tableHeight"` 或弹窗固定 height。对照 → [reference.md#虚拟列表-virtualyconfig](reference.md#虚拟列表-virtualyconfig)

## 禁止（摘要）

**写脚本处理 ERP 代码**（sed/awk/grep 替换、批处理）—— 批量任务按菜单拆 subagent 并行 ·
下划线命名 · 主单引用详情 · 文件职责串味 · path/name/OP_HEADERS 不一致 · 详情漏 OP_HEADERS 或单独 auth.ts · 范围模糊未问 · 新需求乱设 minWidth/width · grid 不配 virtualYConfig · select null 未设 empty-values · 参考他模块不查 locales

完整清单 → [reference.md](reference.md)

关联：[t-list](../t-list/SKILL.md) · [t-workflow](../t-workflow/SKILL.md)
