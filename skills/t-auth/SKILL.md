---
name: t-auth
description: >-
  Tsb ERP（ts*/th*）按钮权限：auth.ts + hasAuth，标准页按当前项目（ts=tsMaterialOrdering / th=thCustomerInfo）。
  Use when 权限, auth, hasAuth, 按钮权限, AUTH_CODES, visible, v-auth.
---

# 页面权限（Tsb ERP 通用）

标准：照抄 [anchors.md](../t-page/anchors.md) 中当前项目标准页的 `auth.ts`（ts→tsMaterialOrdering；th→thCustomerInfo）

编码规范 → [t-standards](../t-standards/SKILL.md)

- 文件名固定 `auth.ts`，与列表页同级（th 部分页放 `constants/`，以标准页为准）
- **只写权限**：`AUTH_CODES` 及后端权限码，不写列配置、类型、API、业务函数
- 键名 `AUTH_CODES.ADD` 等大写常量
- 值为后端权限码，原样照抄，不是自由命名
- 用法 `hasAuth(AUTH_CODES.EDIT)`，禁止魔法字符串 `"edit"`；也可用 `v-auth` 指令

**列表页**

```typescript
import { hasAuth } from "@/router/utils";
import { AUTH_CODES } from "./auth";

visible: () => hasAuth(AUTH_CODES.ADD);
utils.msg("error", t("g.g640")); // 无权限
```

**详情页（复用列表 auth，不单独建文件）**

```typescript
import { AUTH_CODES } from "../${views前缀}Xxx/auth";
// 详情按钮用 AUTH_CODES.DETAIL_*
```

## 新增权限码（必问单选题）

新增 `AUTH_CODES` 时，**必须先 AskQuestion 单选**（总表 #10），未问不得写权限码：

> 本次权限码怎么处理？

- **A. 我已提供后端权限码** — 按给定字符串写入 `auth.ts`
- **B. 后续处理** — 值写 `"需要后台配置！"`（待后台补全）

**禁止**：自造权限码、从别的页面抄码凑数、未问就写 auth.ts

提问格式统一 → [t-workflow/reference.md#必问单选题总表](../t-workflow/reference.md#必问单选题总表)

## 对照源码

- 列表 auth：当前项目 `${标准页}/auth.ts`
- 详情 import：当前项目详情模板

同类权限码原样照抄，不要自行改名。

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md)
