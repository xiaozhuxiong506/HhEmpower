---
name: t-module
description: Use when creating 新建或组装 TSB ERP 页面/模块/菜单/脚手架，涉及 route registration、API wiring、OP_HEADERS、auth、i18n、field settings、business closed loop、accountability、permission boundary、list/detail composition 或新页面自检。
---

# t-module

## 入口检查清单

0. 先读 [anchors.md](../t-page/anchors.md)，确认范围、业务闭环、责任审计、权限等同用户、共享影响和反绕过关卡。
1. 检测项目画像：先读 [profiles.md](../t-page/profiles.md)，确认当前是 `ts*` 还是 `th*`，再按画像定位标准页、API、路由、i18n 和 OP 形态。
2. 决定详情形态：先判断是仅主单、主单加独立详情目录，还是主单加内嵌 `Detail.vue`；未确认前不建详情目录、不注册详情路由。
3. 检查 API：沿用当前项目的 `${api目录}/${api文件}`、`baseURL`、`prefix`、headers 和函数命名，不凭业务名猜接口。
4. 确认 `pageId` 与 `OP_HEADERS`：新增写操作或新页面操作日志时转交 [t-oplog](../t-oplog/SKILL.md)，确认后再注册。
5. 注册路由：主单进菜单路由；独立详情进 `staticRoutes.ts`；内嵌详情不单独注册路由；登记和发现范围交给 [t-registry](../t-registry/SKILL.md)。
6. 组装主单：主单列表、查询、工具栏、列配置和主单字段显隐交给 [t-list](../t-list/SKILL.md)。
7. 组装详情：只有详情形态确认后才进入 [t-detail](../t-detail/SKILL.md)。
8. 配置权限：新增 `AUTH_CODES` 或 `hasAuth` 前必须确认权限码，并复用标准页的权限组织方式。
9. 配置 i18n：新增 locale key 或 `t('key')` 前必须确认 i18n namespace 和 key 所属位置。
10. 配置字段设置：新增主单列、查询项、表单项、详情字段或弹窗字段前，先确认字段设置维度并转交 [t-field](../t-field/SKILL.md)。
11. 完成登记检查：路由、菜单、静态页、组件引用和检测范围统一交给 [t-registry](../t-registry/SKILL.md) 复核。

## 必用子技能

- [t-list](../t-list/SKILL.md)：主单列表、`vxe-grid`、`useGridPreferences`、`ThToolbar`、查询表单和主单字段显隐。
- [t-detail](../t-detail/SKILL.md)：独立详情、内嵌 `Detail.vue`、`openStaticPage`、`route.query`、`ThDetailHeadInfo` 和详情归属逻辑。
- [t-dialog](../t-dialog/SKILL.md)：弹窗、抽屉、`AEDrawer`、`AEDialog`、`XxxModal`、保存确认流和弹窗字段。
- [t-field](../t-field/SKILL.md)：新增字段、字段设置维度、`setField`、列显隐和表单可见可编辑。
- [t-tab](../t-tab/SKILL.md)：保存、确认、只读、可编辑性、Tab 状态和按钮显隐。
- [t-oplog](../t-oplog/SKILL.md)：`OP_HEADERS`、`pageId`、操作日志 headers 和列表/详情操作日志归属。
- [t-registry](../t-registry/SKILL.md)：路由发现、菜单登记、静态路由、组件引用和检测范围。
- [t-standards](../t-standards/SKILL.md)：命名、import 顺序、列顺序、列宽和虚拟滚动等通用标准。

## 必问门禁

- 未确认 `pageId` 前，不写 `OP_HEADERS`、操作日志 headers 或任何依赖 `pageId` 的代码。
- 未确认 i18n namespace 前，不新增 locale key，不沿用其他模块的 `t('key')`。
- 未确认权限码前，不新增 `AUTH_CODES`，不新增 `hasAuth` 判断。
- 未确认字段设置维度前，不写新增字段的 `setField`、列显隐、表单可见性或可编辑性。
- 未确认详情形态前，不创建详情目录，不写 `Detail.vue`，不注册详情路由，不补详情专用 locale 或 `pageId`。
- 未确认新模块写操作的业务闭环、责任归属和权限边界前，不写保存、审核、删除、导出、批量操作或状态流转代码。

## 禁止事项

- 禁止猜测 `pageId`、权限码、i18n namespace、字段设置维度或详情形态。
- 禁止把新模块当成孤立页面，跳过采购/厂商/跟单/仓库/财务/综合设置等闭环影响判断。
- 禁止在读取 [profiles.md](../t-page/profiles.md) 前硬编码标准页路径、API 文件、路由文件或详情形态。
- 禁止绕过 [t-registry](../t-registry/SKILL.md) 直接改菜单登记、静态路由登记或检测范围。
- 禁止让主单为了省事引用详情目录；主单和详情的 columns、auth、type、组件归属必须清楚。
- 禁止把保存、确认、只读、可编辑性规则写在本技能内展开；这些规则转交 [t-tab](../t-tab/SKILL.md)。
- 禁止把新增字段和字段设置规则写散在主单、详情、弹窗中；这些规则转交 [t-field](../t-field/SKILL.md)。

## 最终自检

- 画像已确认：标准页、API、路由、i18n、OP 形态均来自 [profiles.md](../t-page/profiles.md) 或当前项目证据。
- 六处命名一致：以 [naming.md](../t-page/naming.md) 定义的六处为准（路由/菜单、组件文件名、组件名、API/类型名、i18n key、权限/日志/pageId）；字段对齐（`columns.field` ↔ `type` ↔ 接口字段）另行核对。
- 主单和详情边界清楚：主单不越界改详情，详情不反向要求主单 shortcut import 详情目录。
- `pageId`、i18n namespace、权限码、字段设置维度和详情形态都已确认后才写对应代码。
- 新字段已路由到 [t-field](../t-field/SKILL.md)，保存/确认/可编辑性已路由到 [t-tab](../t-tab/SKILL.md)，日志已路由到 [t-oplog](../t-oplog/SKILL.md)。
- 路由、菜单、静态页和检测范围已由 [t-registry](../t-registry/SKILL.md) 复核。
- 列宽已强制核对：新页全部 columns（主单与明细）每列 `width` 已按 [t-standards/reference.md](../t-standards/reference.md) 速查表逐列归类核对——编号/日期 160、金额 120（采购主金额 130）、状态/数量 120、图片 80、操作 150；按字段语义智能归类（如 `field` 含 `code`/`no` 即编号类），未凭印象、未照抄其他页面、未取速查表以外的相近值。

细化自检见 [reference.md](reference.md)。
