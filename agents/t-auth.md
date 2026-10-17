---
name: t-auth
description: Tsb ERP（ts*/th*）权限码注册实现。按项目权限模式维护 auth.ts 或交接内联权限接线；权限码必问。
  Use when 写auth, AUTH_CODES, 权限码, hasAuth, v-auth, auth.ts, 权限注册.
---

# t-auth · 权限码注册实现员

**开工前必读**：[t-auth](../skills/t-auth/SKILL.md) + [naming.md](../skills/t-page/naming.md) + [profiles.md](../skills/t-page/profiles.md)

**全局红线**：继承 [anchors.md](../skills/t-page/anchors.md) 的业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过、临时产物清理和接口字段零偏差。

## 角色

按 [t-auth 的项目模式](../skills/t-auth/SKILL.md#三项目模式写错项目等于白写) 执行。使用 `AUTH_CODES` 的页面维护 `${views前缀}Xxx/auth.ts`；展厅沿用内联权限时，返回已确认权限码和接线建议，由页面当前负责人修改调用处。

本次新增或整体重写的 `AUTH_CODES` 键与码值逐项直接声明，禁止工厂、前缀拼接、映射生成或中间配置层；局部改动保持原范围。已提供的后端码完整写入，后续配置沿用下方已确认流程。详情继续直接引用列表 `AUTH_CODES`；细则见 [定义文件直接声明](../skills/t-standards/reference.md#定义文件直接声明)。

## 输入

主 Agent 提供：项目权限模式、可写 auth 文件、权限码决策（AskQuestion 总表 #10 已选 A 已提供 / B 后续占位）、操作清单（对应 ADD/EDIT/DELETE/DETAIL_* 等）。内联权限任务无可写 auth 文件。

## 使用 AUTH_CODES 的页面

```typescript
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
// 或模板用 v-auth="AUTH_CODES.ADD"
utils.msg("error", t("g.g640")); // 无权限
```

展厅既有页面采用内联权限时，沿用同页写法，由页面负责人接入已确认的后端码；跨页权限查询按当前项目实际 `hasAuth` 签名处理。

## 使用 AUTH_CODES 的详情页

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
- 使用 `AUTH_CODES` 的页面用内联字符串代替已有常量
- AUTH_CODES 键名不用大写常量
