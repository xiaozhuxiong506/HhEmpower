---
name: t-field
description: Use when adding or changing TSB ERP 字段设置、setField、settingList、列表可见、详情可见、编辑可见、可编辑、批量编辑、fieldName 对齐、接口字段精确匹配、字段设置维度。
---

# t-field

字段设置控制角色字段权限，不等于按钮权限。按钮权限读 [../t-auth/SKILL.md](../t-auth/SKILL.md)；命名对齐读 [../t-page/naming.md](../t-page/naming.md)。

字段显隐、可编辑性和接口字段会影响权限、保存、日志和业务闭环；涉及写操作或跨模块字段时读 [../t-page/anchors.md](../t-page/anchors.md) 的全局关卡。

## 八个维度（Eight Dimensions）

每个维度取值遵循后端字段配置：`0=不设置`、`1=设置不显示`、`2=设置显示`。

| 维度 | 含义 | 页面常见用途 |
| --- | --- | --- |
| `showList` | 列表可见 | 主单 grid 列 |
| `showDetail` | 详情可见 | 详情头、详情信息区 |
| `isVisible` | 编辑可见 | 弹窗/抽屉表单项 `v-if` |
| `isEdit` | 可编辑 | 表单项 `:disabled`，逻辑取反 |
| `isBatch` | 批量编辑可见 | 批量编辑入口/列 |
| `datchEdit` | 批量编辑可编辑 | grid 单元格 `:disabled`，逻辑取反 |
| `audit` | 审核 | 审核相关字段 |
| `trace` | 留痕 | 留痕相关字段 |

## fieldName 对齐（FieldName Alignment）

`fieldName` 必须与以下位置指向同一个业务字段：

- `columns.field`
- 表单 `prop`
- `type.ts` 字段
- API 入参/返回字段
- 字段设置配置名
- i18n label

只因为 UI 样式相似而照搬兄弟字段名，属于命名错误。

## 接口字段精确匹配（Exact Field Contract）

接口字段名是数据绑定事实源。物料编号、采购编号、客户编码等业务字段必须与接口入参/返回字段完全一致，禁止用相似中文含义、兄弟页面字段名或个人推断替代。

- 先查接口定义、请求/响应类型、Swagger/OpenAPI 或当前模块已验证调用，再写 `columns.field`、表单 `prop`、`type.ts` 和 `fieldName`。
- 存在多个候选字段、接口与页面文案冲突、或接口未给出字段时，先问用户/后端确认；确认前不写近似字段。
- 若页面模型必须与接口字段做显式映射，必须已有 mapper/转换证据，并说明映射位置；禁止静默把 `xxxCode`、`xxxNo`、`xxxId` 混用。
- 接口约束包含值域、长度、小数位、必填、枚举、正则、禁止中文等规则时，转交 [../t-standards/reference.md#接口字段与输入规则契约](../t-standards/reference.md#接口字段与输入规则契约)。

## 必问门禁（Ask Gates）

新增表单项、详情字段、详情 grid 列或批量编辑字段时，必须先问字段设置维度：

> 新字段 `xxx` 要接入哪些字段设置？

- **A. 编辑可见**：`setField(..., 4)` 控制 `v-if`。
- **B. 可编辑**：`setField(..., 2)` 控制 `:disabled`。
- **C. 详情可见**：详情头或详情信息区使用 `setField(..., 1)`。
- **D. 列表可见**：列表列接 `showList` / `showField`。
- **E. 批量编辑可见**：`setField(..., 5)`。
- **F. 批量编辑可编辑**：`setField(..., 3)`。
- **G. 暂不接字段设置**：必须由用户明确选择，并记录原因。

用户未选定前，不写对应字段设置代码。

## 证据规则（Evidence Rules）

- 若用户选择“照同页相邻字段”，必须写明相邻字段名和相同维度证据。
- `settingList` 来源照当前页面已有模式；父组件传入或 `returnFieldList(sysRoleFiledCode)` 不混用。
- `sysRoleFiledCode` 与页面命名六处一致；禁止临时自造。
- 后端尚未登记新字段时，前端仍按最终 `fieldName` 写，交付中说明需后台登记。

## 禁止项（Prohibitions）

- 禁止新增字段不问维度。
- 禁止 `fieldName` 与 `columns.field` / form prop / type 字段不一致。
- 禁止把物料编号、采购编号等字段按中文含义近似匹配；必须完全等于接口字段或有明确映射证据。
- 禁止只写 `v-if` 或只写 `:disabled`，却与同容器字段风格不一致。
- 禁止把按钮权限 `AUTH_CODES` 当字段设置。
- 禁止把字段设置当成纯 UI 显隐，跳过接口契约、权限边界和业务闭环影响。

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
