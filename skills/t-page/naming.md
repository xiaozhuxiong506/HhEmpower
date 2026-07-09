# 命名一致性

> 项目画像先读 [profiles.md](profiles.md)；命名规则在确认 `ts` / `th` 后执行。

## 六处命名

新增或调整页面时，以下六处必须表达同一个页面或业务对象：

| 位置 | 要求 |
|------|------|
| 路由/菜单 | `path`、`name`、菜单 key 与页面目录保持同源命名 |
| 组件文件名 | 列表固定 `index.vue`；详情按画像使用独立详情目录或内嵌 `Detail.vue` / `MaiDetail.vue` |
| 组件名 | 使用 PascalCase，并与路由 `name`、目录名同源 |
| API/类型名 | API 函数、请求/响应类型、页面类型字段使用同一业务词 |
| i18n key | `locales/zh-CN.yaml` 与 `locales/en.yaml` 使用同一业务层级和 key |
| 权限/日志/pageId | `AUTH_CODES`、`hasAuth`、`OP_HEADERS`、`pageId`、`sysRoleFiledCode` 与页面名同源 |

详情页独立成目录时，权限可从列表页 `auth.ts` 引入；内嵌详情时，仍要保留独立的日志和 pageId 语义。

## 字段对齐

同一业务字段必须在以下位置对齐：

- `columns.field`
- 表单 `prop`
- `type.ts` 类型字段
- API 请求/响应字段
- 字段设置 `fieldName`
- i18n 标签

`seq`、`checkBox`、`operation` 等元列不参与业务字段对齐。

新增字段时，先确认后端字段和现有同模块命名，再同步列、表单、类型、API、字段设置和文案。

接口字段是事实源。物料编号、采购编号等业务字段必须精确匹配接口入参/返回字段；禁止按中文含义、相似字段、兄弟页面或个人习惯推断字段名。存在 `xxxCode` / `xxxNo` / `xxxId` / `xxxKey` 等多个候选时，先问清楚再写。

## 样式一致不等于字段对齐

不要因为兄弟字段的 UI 样式相似，就复制它的字段名、类型名、API 字段或 i18n key。

样式只能作为组件结构参考；字段名必须来自业务含义、后端字段、现有类型和页面文案。

## `th` 历史拼写

`th` 项目已有 legacy 拼写只在现有文件要求时保留，例如 `exportCloumns.ts`、`typs.d.ts`。

新页面、新文件、新字段使用正确拼写；没有现有证据时，不把 legacy 拼写复制到新页面。

## 重命名红线

重命名共享标识符前，先报告影响范围，再等待确认。

影响范围至少覆盖：路由/菜单、文件名、组件名、imports、API/类型、i18n、`AUTH_CODES`、`OP_HEADERS`、`pageId`、`sysRoleFiledCode`、字段设置、所有调用方。

未完成影响范围报告前，不要静默重命名共享组件、hook、util、类型、API 函数或业务字段。
