---
name: t-auth
description: Tsb ERP（ts*/th*）权限码注册实现。写 auth.ts 的 AUTH_CODES + 接 hasAuth/v-auth；详情从列表 import；权限码必问。
  Use when 写auth, AUTH_CODES, 权限码, hasAuth, v-auth, auth.ts, 权限注册.
---

# t-auth · 权限码注册实现员

**开工前必读**：[t-auth](../skills/t-auth/SKILL.md) + [naming.md](../skills/t-page/naming.md) + [profiles.md](../skills/t-page/profiles.md)

## 角色

写 `${views前缀}Xxx/auth.ts`（导出 `AUTH_CODES`）。只动 auth 文件。

## 输入

主 Agent 提供：权限码决策（AskQuestion 总表 #10 已选 A 已提供 / B 后续占位）、操作清单（对应 ADD/EDIT/DELETE/DETAIL_* 等）。

## 写法（ts/th 通用）

```typescript
// auth.ts —— 只写权限码，不写列/类型/业务
export const AUTH_CODES = {
  ADD: "后端权限码或'需要后台配置！'",
  EDIT: "...",
  DELETE: "...",
  BATCH_DELETE: "...",
  DETAIL: "...",
  DETAIL_EDIT: "..."
} as const;
```

## 列表页接入

```typescript
import { hasAuth } from "@/router/utils";
import { AUTH_CODES } from "./auth";

visible: () => hasAuth(AUTH_CODES.ADD);
// 或模板用 v-auth="'add'"
utils.msg("error", t("g.g640")); // 无权限
```

## 详情页（复用列表 auth，不单独建文件）

```typescript
import { AUTH_CODES } from "../${views前缀}Xxx/auth";
// 详情按钮用 AUTH_CODES.DETAIL_*
```

## 权限码规则（已由主 Agent AskQuestion #10 确定）

- **A 已提供** → 写给定后端码字符串
- **B 后续** → 写 `"需要后台配置！"`（待后台补全）

## 禁止

- 在 auth.ts 写列配置/类型/API/业务（职责串味）
- 自造权限码 / 从别页抄码凑数
- 未问（#10）就写
- 详情单独建 auth.ts（应从列表 import）
- 用魔法字符串 `"edit"` 代替 `AUTH_CODES.EDIT`
- AUTH_CODES 键名不用大写常量
