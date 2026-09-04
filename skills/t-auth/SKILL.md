---
name: t-auth
description: Use when adding or changing TSB ERP 权限码、AUTH_CODES、auth.ts、hasAuth、v-auth、visible guard、工具栏按钮权限、行操作权限、详情页复用列表 auth、严格权限、AI 权限边界、人类用户等同权限控制。
---

# t-auth

本 skill 只处理按钮/操作权限。字段权限读 [../t-field/SKILL.md](../t-field/SKILL.md)，页面规范读 [../t-standards/SKILL.md](../t-standards/SKILL.md)。

权限变化同时继承 [../t-page/anchors.md](../t-page/anchors.md) 的责任审计、权限等同用户、业务闭环和反绕过关卡。

## 权限来源（Permission Source）

- `auth.ts` 本次新增或整体重写的权限码必须在 `AUTH_CODES` 中逐项直接声明，禁止抽象；局部改动保持原范围。已提供的后端码完整写入，后续配置沿用下方必问门禁。细则见 [定义文件直接声明](../t-standards/reference.md#定义文件直接声明)。
- 权限码值来自后端或用户明确提供；不是 AI 自由命名。
- 用法优先 `hasAuth(AUTH_CODES.Xxx)`；已有页面使用 `v-auth` 时按同页模式。
- 工具栏按钮、行操作、详情按钮都必须接入同一套权限来源。

## AI 权限边界（Human-Equivalent Permissions）

AI 只能在与人类用户同等的权限边界内辅助修改和验证，不得创造、模拟或绕过权限。

- 前端按钮隐藏不等于授权；保存、审核、删除、导出、批量操作等关键操作必须保留后端权限码和接口鉴权。
- 不得硬编码 `hasAuth` 结果、删除 guard、伪造超级用户、绕过菜单/路由权限、跳过字段权限或屏蔽鉴权失败。
- 使用浏览器、MCP、Swagger/OpenAPI、接口平台或调试账号时，也必须遵守合法账号权限；需要更高权限时让用户走正式授权流程。
- 权限会影响操作日志、字段配置、数据范围和跨模块业务闭环；权限事实源不清时先问，不继续改。

## 必问门禁（Ask Gates）

新增权限码前必须问用户：

> 本次权限码怎么处理？

- **A. 已提供后端权限码**：按用户给出的字符串写入。
- **B. 后续配置**：先写 `"需要后台配置！"`，待后端补齐。

未得到明确选择前，不写新的 `AUTH_CODES`；用户坚持不选时，按 [t-clarify](../t-clarify/SKILL.md) 的拒绝升级规则提供“补权限码 / 先写需要后台配置 / 取消”二选一。禁止从相邻页面拿一个看似相近的权限码充数。

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
- 禁止把 AI、调试账号、接口工具或脚本当成绕过人类用户权限的理由。

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
