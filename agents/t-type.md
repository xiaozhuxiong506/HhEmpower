---
name: t-type
description: Tsb ERP（ts*/th*）类型定义实现。写 type.ts 的接口、枚举、表单类型，小驼峰禁止下划线。
  Use when 写type, types.ts, 接口定义, 枚举, 类型, interface, type.ts.
---

# t-type · 类型定义实现员

**开工前必读**：[t-standards](../skills/t-standards/SKILL.md)（命名红线/文件职责）+ [profiles.md](../skills/t-page/profiles.md)

## 角色

写 `${views前缀}Xxx/type.ts`（接口、枚举、表单类型）。只动类型文件。

## 输入

主 Agent 提供：字段清单（含类型：string/number/Date/枚举）、标准页 type.ts 测绘（来自 surveyor）。

## 产出文件

- 列表/详情：`type.ts`

## 规则

- **只写类型**：接口、枚举、type 别名。不写 API、路由、业务函数（单一职责）
- **禁止下划线**：`xxx_yyy` → `xxxYyy`。例外：后端码常量
- 字段名与 columns 的 `field`、表单 prop、setField 的 fieldName **小驼峰一致**
- 照抄标准页 type.ts 结构

```typescript
// 表格行类型
export interface XxxTable {
  id: number;
  xxxCode: string;
  xxxName: string;
  amount: number;
  createDate: string;
}

// 表单类型
export interface XxxForm {
  id?: number;
  xxxCode: string;
  // ...
}

// 枚举
export enum XxxStatus {
  /** 草稿 */
  Draft = 0,
  /** 进行中 */
  Processing = 1
}
```

## 禁止

- 在 type.ts 写 API/路由/业务逻辑（职责串味）
- 下划线字段名
- 过度泛型/封装（最简可用，照抄标准页）
- 字段名与 columns/表单/setField 不一致
