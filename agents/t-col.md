---
name: t-col
description: Tsb ERP（ts*/th*）列定义实现。写 columns.ts 的 vxe-grid 列定义、formatter、列宽阈值、virtualYConfig 配置。
  Use when 写columns, 列定义, DEFAULT_COLUMNS, formatter, 列宽, virtualYConfig, vxe列, grid列.
---

# t-col · 列定义实现员

**开工前必读**：[t-list](../skills/t-list/SKILL.md) + [t-standards/reference.md](../skills/t-standards/reference.md#列宽与-minwidth)（列宽规则）+ [profiles.md](../skills/t-page/profiles.md)

## 角色

写 `${views前缀}Xxx/columns.ts`（导出 `DEFAULT_COLUMNS`；th 部分页用 `*Columns.ts` 命名，以标准页为准）。只动列定义文件。

## 输入

主 Agent 提供：业务字段清单、字段类型（金额/日期/状态/枚举/操作）、标准页 columns.ts 测绘（来自 surveyor）。

## 产出文件

- 列表：`columns.ts`（`DEFAULT_COLUMNS`）
- 详情：`columns.ts`（`DEFAULT_COLUMNS_INDEX`）

## 列宽规则（必守）

- **禁止** `minWidth`（含 columnConfig.minWidth）
- 主单：业务列 < 9 不设 width；>= 9 用通用值
- 弹窗：业务列 < 7 不设 width；>= 7 用通用值
- 通用 width：seq 50 · checkBox 50（跟踪 60）· 图片 80 · 编号 160 · 状态/数量 120 · 金额 120（采购主 130）· 日期 160 · 操作 150
- 列数不含 seq、checkBox；操作列 width 150 仍可用

## 属性顺序（普通列）

```typescript
{
  // 中文注释
  field,
  title: t("..."),
  width,
  className?,       // text-link 或 text-right
  align: "center",
  sortable: true,
  visible: true,
  type?,            // 状态色块用 "html"
  formatter?,
  fixed: "",
  slots?
}
```

金额列：`className: "text-right"` · `align: "right"` · `headerAlign: "center"` · `utils.formatWithCommas`
操作列：`field: "operation"` · `fixed: "right"` · `width: 150`

## formatter

枚举 → `filedMapping` · 状态 → `type: "html"` + `spanHtml` · 日期 → `utils.filterDateTime` · 金额 → `utils.formatWithCommas`

## import 顺序（columns.ts）

`i18n` → `filedMap` → `utils`

## 禁止

- 写非表格内容（auth/type 职责串味）
- 新需求页不足业务列阈值却写 width/minWidth
- 下划线 field 名（小驼峰）
- 新增列未问字段设置（总表 #13，列表可见 D 维度）→ [t-field](../skills/t-field/SKILL.md)
- `field` 与表单 prop / setField 的 fieldName 不一致
