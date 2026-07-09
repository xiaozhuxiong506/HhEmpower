---
name: t-auth
description: Use when adding or changing TSB ERP 权限码、AUTH_CODES、auth.ts、hasAuth、v-auth、visible guard、工具栏按钮权限、行操作权限、详情页复用列表 auth。
---

# t-auth

本 skill 只处理按钮/操作权限。字段权限读 [../t-field/SKILL.md](../t-field/SKILL.md)，页面规范读 [../t-standards/SKILL.md](../t-standards/SKILL.md)。

## 权限来源（Permission Source）

- `auth.ts` 只写 `AUTH_CODES` 和后端权限码。
- 权限码值来自后端或用户明确提供；不是 AI 自由命名。
- 用法优先 `hasAuth(AUTH_CODES.Xxx)`；已有页面使用 `v-auth` 时按同页模式。
- 工具栏按钮、行操作、详情按钮都必须接入同一套权限来源。

## 必问门禁（Ask Gates）

新增权限码前必须问用户：

> 本次权限码怎么处理？

- **A. 已提供后端权限码**：按用户给出的字符串写入。
- **B. 后续配置**：先写 `"需要后台配置！"`，待后端补齐。

未得到明确选择前，不写新的 `AUTH_CODES`。禁止从相邻页面拿一个看似相近的权限码充数。

## 详情复用（Detail Reuse）

- 详情页默认复用列表页 `auth.ts`。
- 详情按钮使用列表 auth 中的详情相关 code；没有 code 时先问，不单独新建详情 `auth.ts`。
- 只有当前项目已有同类详情独立 auth 证据时，才按项目证据处理，并在交付说明里写明证据位置。

## 禁止项（Prohibitions）

- 禁止 `auth.ts` 写列配置、API、类型、业务函数。
- 禁止魔法字符串权限判断，例如直接写 `"edit"`。
- 禁止未问就新增后端权限码。
- 禁止详情页绕开列表 auth 单独发明权限文件。
- 禁止把字段设置的 `setField` 当按钮权限使用。

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
