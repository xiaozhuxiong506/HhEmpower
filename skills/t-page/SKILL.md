---
name: t-page
description: Use when Codex works on a TSB ERP business page, route, module, list, detail, popup, drawer, tab, field, auth, operation log, route registry, business closed loop, cross-module impact, accountability, or page-level skill routing；触发词包括 页面、路由、主单、详情、明细、弹窗、抽屉、字段、权限、业务闭环、全局感知、责任归属、vxe-grid、hasAuth、AUTH_CODES、OP_HEADERS、staticRoutes、setField、sysRoleFiledCode、ts/th。
---

# t-page

## 入口顺序

1. 如果需求含模糊信号、反绕过表达，或要求跳过确认，先读 [t-clarify](../t-clarify/SKILL.md)，由澄清结果决定是否继续。
2. 读 [profiles.md](profiles.md)，确认当前页面画像是 `ts`、`th`，或仍需继续探测。
3. 读 [anchors.md](anchors.md)，只引用其中的全局关卡、范围、共享影响、归因和标准源。
4. 只有当前任务涉及必问单选、改动决策或“是否可以直接改”的判断时，才读 [t-workflow](../t-workflow/SKILL.md)。
5. 按下方路由表读取具体子 skill；`t-page` 本身不进入代码实现步骤。

## 必读材料

| 文档 | 读取时机 |
|------|----------|
| [profiles.md](profiles.md) | 每个页面相关任务先读，用于判定 `ts` / `th` 画像和路径令牌。 |
| [anchors.md](anchors.md) | 画像判定后读，用于范围、红线、共享影响、Git 归因、反绕过和标准源。 |
| [naming.md](naming.md) | 涉及路由、菜单、组件、API、类型、i18n、权限、日志、`pageId` 或字段对齐时读。 |
| [orchestration.md](orchestration.md) | 需要 subagent、跨模块拆解、批量任务或调度边界时读；只用于编排选择。 |

## 技能路由

| 任务信号 | 读取 skill |
|----------|------------|
| 新建模块、新页面骨架、模块级补齐 | [t-module](../t-module/SKILL.md) |
| 主单、列表页、查询区、表格、`vxe-grid` | [t-list](../t-list/SKILL.md) |
| 详情、明细、主单详情映射 | [t-detail](../t-detail/SKILL.md) |
| 弹窗、抽屉、对话框、批量操作面板 | [t-dialog](../t-dialog/SKILL.md) |
| 命名、列宽、import、通用页面标准 | [t-standards](../t-standards/SKILL.md) |
| 权限按钮、`hasAuth`、`v-auth`、`AUTH_CODES` | [t-auth](../t-auth/SKILL.md) |
| 字段设置、字段对齐、`setField`、`sysRoleFiledCode` | [t-field](../t-field/SKILL.md) |
| Tab、保存、编辑态、只读态 | [t-tab](../t-tab/SKILL.md) |
| 操作日志、`OP_HEADERS`、`pageId` | [t-oplog](../t-oplog/SKILL.md) |
| 路由、菜单、Tab 发现、`staticRoutes`、route registry | [t-registry](../t-registry/SKILL.md) |
| Zentao 任务收集、分析、分组、派发 | [t-zentao](../t-zentao/SKILL.md) |

## 停止关卡

以下只列关卡名；具体规则以 [anchors.md](anchors.md) 为准。

- [五条红线](anchors.md#五条红线)
- [范围契约](anchors.md#范围契约)
- [ERP 闭环感知关卡](anchors.md#erp-闭环感知关卡)
- [责任与审计关卡](anchors.md#责任与审计关卡)
- [共享影响关卡](anchors.md#共享影响关卡)
- [Git 归因关卡](anchors.md#git-归因关卡)
- [权限等同用户关卡](anchors.md#权限等同用户关卡)
- [反绕过关卡](anchors.md#反绕过关卡)
- [临时产物清理](anchors.md#临时产物清理)
- [范围外报告](anchors.md#范围外报告)

## 输出契约

`t-page` 只负责选择需要读取的 skill 和 support docs，并说明读取顺序。它不写代码、不生成实现方案、不替代子 skill 的规则，也不复制 support docs 的长规则正文。
