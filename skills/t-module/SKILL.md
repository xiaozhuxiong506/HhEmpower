---
name: t-module
description: >-
  Tsb ERP（ts*/th*）新页面模块：复制标准页、API、路由、OP_HEADERS、auth、i18n 全流程。
  Use when 新页面, 新模块, 新菜单, 注册路由, scaffold, 复制页面.
---

# 新页面模块（Tsb ERP 通用）

模板（按当前项目探测，见 [profiles.md](../t-page/profiles.md)）→ [anchors.md](../t-page/anchors.md#标准源码)（复制 `${标准页}` + 可选详情模板）

文件命名规范 → [naming.md](../t-page/naming.md) · [t-standards](../t-standards/SKILL.md)

## 顺序

1. API `${api目录}/${api文件}` — 照抄模板函数名（如 `GetXxxPage` 三件套 + CRUD）
2. OP_HEADERS `src/utils/operationLog.ts` — 列表 + 详情各注册一组；**pageId 必问一次**（见 [t-oplog](../t-oplog/SKILL.md#pageid-必问新增页面--新接口必做)）。**注意 ts/th 形态差异**（见 profiles OP形态列）
3. 路由 — 列表进菜单模块，详情进 `staticRoutes.ts`（th 内嵌详情免）
4. 列表页 → t-list
5. 详情页 → t-detail（如需要）
6. i18n — 新增 key 前 **AskQuestion**（总表 #4 → #5，见 [reference.md#必问单选题总表](../t-workflow/reference.md#必问单选题总表)）
7. 新模块未说明是否做详情 — **AskQuestion**（总表 #9）
8. 新增弹窗/列表/详情字段 — **AskQuestion** 字段设置维度（总表 #13，见 [t-field](../t-field/SKILL.md)）
9. 自检六处一致、hasAuth、能跑
10. 登记检测范围 → [t-registry](../t-registry/SKILL.md)

> 可派 `t-scaffold` agent 总装本流程，分头调度 api/column/type/view/dialog/route/oplog 实现 agent → 见 [../t-page/orchestration.md](../t-page/orchestration.md)

## 命名替换（标准页 → 新页）

**列表**
- 文件夹 `${标准页}` → `${views前缀}Xxx`
- path `/${标准页}` → `/${views前缀}Xxx`
- name `${标准页大写}` → `${Views大写}Xxx`
- OP_HEADERS `${标准页}` → `${views前缀}Xxx`（th 为 `PAGE{N}`）

**详情**
- 文件夹 `${标准页}Detail` → `${views前缀}XxxDetail`（ts；th 视情况内嵌）
- path / name / OP_HEADERS / sysRoleFiledCode 同步替换

六处一致：path · name · defineOptions.name · OP_HEADERS · sysRoleFiledCode · columns.field↔type 字段

## API

全部 POST：`http.request<Result>("post", \`${baseURL}/${prefix}/{Controller}/{Action}\`, { data }, headers)`

函数名照抄模板页，全局替换业务前缀（如 `MaterialInfo` → 新业务名；th 项目 `hall*` 域前缀）

## i18n

`menus.` · `l.`/`g.`/`label.` · `buttons.`（th 项目另含 `cm`/`tg`/`psv` 等命名空间）— 新增 key 前 **AskQuestion**（总表 #4 → #5）：

→ [reference.md#必问单选题总表](../t-workflow/reference.md#必问单选题总表)

选定后按已有 yaml 格式同步追加 key，不擅自改已有翻译。

**参考他模块**：沿用 `t('key')` 前必查 locales → [reference.md#参考他模块时的-i18n](../t-workflow/reference.md#参考他模块时的-i18n)

## 必问单选题（新模块）

未说明时 **AskQuestion**，选定前不建详情路由、不写 locales/pageId：

- **是否做详情** — 总表 #9：A 仅列表 · B 列表+详情（th 注意详情多内嵌）
- **pageId** — 总表 #6（注册 OP_HEADERS 时）
- **i18n** — 总表 #4 → #5（新增 key 时）
- **权限码** — 总表 #10（新增 AUTH_CODES 时）
- **字段设置** — 总表 #13（新增表单/列字段时）

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-registry](../t-registry/SKILL.md)

细节 → [reference.md](reference.md)
