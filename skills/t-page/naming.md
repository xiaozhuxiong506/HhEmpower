# 命名规则（从 t-standards 抽出的公共部分）

> 项目特定值（前缀 ts/th）→ 先读 [profiles.md](profiles.md) 探测。

## 六处保持一致

新增页面 **六处** 用同一名字（细则 → [../t-standards/SKILL.md](../t-standards/SKILL.md#命名对照)）：

**列表**（`${views前缀}` = ts 或 th）：

| 处 | 值 |
|----|----|
| 文件夹 | `${views前缀}Xxx`（如 `tsMaterialOrdering` / `thCustomerInfo`） |
| path | `/${views前缀}Xxx` |
| name（PascalCase） | `${Views大写}Xxx`（如 `TsMaterialOrdering` / `ThCustomerInfo`） |
| OP_HEADERS key | `${views前缀}Xxx`（th 项目为 `PAGE{N}` 形态，见 profiles OP形态） |
| sysRoleFiledCode | `${Views大写}Xxx` |
| **columns.field ↔ type 字段** | 每个 `field`（业务列）在 `type.ts` 有同名字段，小驼峰一致（seq/checkBox/operation 元列除外） |

> 前 5 处是"命名样式一致"，第 6 处是"字段对齐"——后者由 [t-spec](../../agents/t-spec.md) 第一阶段静态审，不用等 Bug 后查。

**详情**：

- 独立目录：文件夹 `${views前缀}XxxDetail` · 独立 OP_HEADERS · auth 从列表 import
- th 内嵌详情：`components/Detail.vue` / `MaiDetail.vue`，OP_HEADERS 仍独立一组

```typescript
// 详情引用列表 auth（两项目通用）
import { AUTH_CODES } from "../${views前缀}Xxx/auth";
```

## 固定文件名

| 页类型 | 固定文件 |
|--------|---------|
| 列表 | `index.vue` · `columns.ts`（`DEFAULT_COLUMNS`）· `auth.ts` · `type.ts` · `components/` |
| 详情 | `index.vue` · `columns.ts`（`DEFAULT_COLUMNS_INDEX`）· `components/` |

> th 项目部分页用 `*Columns.ts`（如 `customerColumns.ts`）、`hook/`、`constants/` 组织——以当前模块实际结构为准，新页优先照抄本项目 `${标准页}` 的文件组织。

## 组件命名

`AEDrawer` · `AEDialog` · `XxxModal.vue` · `XxxDrawer.vue` · `XxxDetail.vue`

## API 命名

`${api目录}/${api文件}`（如 `src/api/procerement.ts` / `src/api/hallbasic.ts`）：照抄模板函数名，全局替换业务前缀，勿自造。

## 命名红线

- 禁止下划线（`xxx_yyy`），一律小驼峰。例外：`DEFAULT_COLUMNS`、`AUTH_CODES` 等后端码常量
- 函数前缀：`get` · `handle` · `to` · `open` · `refresh` · `guard`
- th 项目已有的拼写遗留（如 `exportCloumns.ts`、`typs.d.ts`）**不照抄到新页**，新页用正确拼写
