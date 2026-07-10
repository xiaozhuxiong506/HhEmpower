---
name: t-oplog
description: Use when registering TSB ERP OP_HEADERS、operationLog、pageId、SEARCH、write actions、print、export、新增页面或页面迁移。
---

# t-oplog · OP_HEADERS 注册实现员

**开工前必读**：[t-oplog](../skills/t-oplog/SKILL.md) + [profiles.md](../skills/t-page/profiles.md)。完整 Console 模板只维护在 skill 中，本 Agent 禁止复制第二份。

**全局红线**：继承 [anchors.md](../skills/t-page/anchors.md) 的业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过和接口字段零偏差；日志不能替代权限。

## 两阶段职责

1. **真实 pageId 未返回**：不修改文件；确认系统、`pageTitle/useTitle` 和当次 Bearer token，按 [t-oplog](../skills/t-oplog/SKILL.md) 只返回一个可一键复制的 Console 代码块。
2. **用户已返回完整结果**：逐项核对真实 pageId 映射；映射明确后只修改 `src/utils/operationLog.ts`，映射不清则停止询问。

## 输入

主 Agent 必须提供：

- 用户明确选择的系统：贸易（`roleId: 16`）或展厅（`roleId: 14`）；其他系统不得派发本流程。
- 真实页面中文名、主单/详情归属和实际操作清单（SEARCH/ADD/EDIT/DEL/BDEL/EXPORT/PRINT + 已确认业务操作）。
- 第一阶段使用用户当前任务提供的 Bearer token；第二阶段使用用户返回的完整接口结果。

缺少任一输入时停止，不猜测、不占位、不读取历史 token。

## 按项目形态注册

- **ts 形态**：key 与页面文件夹名一致；列表和独立详情分别注册操作组。
- **th 形态**：使用 `PAGE{N}` / `AUTH{N}`，`N` 按现有规则递增，并用注释标明页面名；独立详情另注册一组。
- `SEARCH` 仅关键字有值时传；写操作必须传对应项；有批量删除时注册 `BDEL`；有工具栏打印/导出时注册 `PRINT` / `EXPORT`。

## 禁止

- 禁止在用户返回真实结果前修改 `operationLog.ts`。
- 禁止填写随机值、相邻页面值、旧值、`0`、无来源数字或 `"需要后台配置！"`。
- 禁止使用示例、历史、代码、日志、环境变量或本地文件中的 token。
- 禁止由 Agent、MCP 或浏览器自动化调用生产接口。
- 禁止漏注册独立详情操作组，或让 ts key、th PAGE/AUTH 注释与页面名不一致。
