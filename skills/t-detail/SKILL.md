---
name: t-detail
description: Use when building or changing 构建或修改 TSB ERP 详情页、Detail.vue、detail drawer/page、明细、independent detail route、openStaticPage flow、route.query usage、ThDetailHeadInfo 或 detail-owned operation/log/auth behavior。
---

# t-detail

## 先定详情形态

- 先读 [profiles.md](../t-page/profiles.md)，再检查主单兄弟文件和已存在详情实现，判断详情是 `ts` 独立详情目录、`th` 内嵌 `Detail.vue`，还是当前项目的例外形态。
- `ts` 项目常见形态是独立 `${views前缀}XxxDetail` 目录，并由主单通过 `openStaticPage` 或项目既有方式打开。
- `th` 项目常见形态是主单 `components/Detail.vue`、`MaiDetail.vue` 或同类内嵌组件；少数独立详情以现有兄弟文件为准。
- 未确认详情形态前，不创建目录、不注册路由、不补详情 `pageId`、不补详情 i18n、不写详情字段设置。

## 归属边界

- 详情归属文件包括独立详情目录、内嵌 `Detail.vue`、详情明细 columns、详情头、详情 footer、详情弹窗入口、详情 `route.query` 和详情内操作。
- 主单只负责打开详情或传递必要参数；详情不得要求主单 shortcut import 详情目录，主单也不得 import 详情目录来绕过正常路由或组件边界。
- 用户只要求主单时，不改详情归属文件；用户只要求详情时，不顺手重构主单列表。
- 详情权限默认复用主单 `auth.ts`，除非当前项目已有证据显示详情使用独立权限文件或独立权限码。

## 必用模式

- 独立详情路由只进 `staticRoutes.ts`，不进菜单模块；`meta.pagePath` 指回主单路径，`showLink` 通常为 `false`，具体照兄弟文件。
- 内嵌详情不新增独立路由，挂在主单组件树内，按现有 props、emit、ref 和刷新方式接线。
- `route.query` 用于接收主单 `id`、业务编号、来源类型等参数；新增参数前先查打开方和既有详情写法。
- `ThDetailHeadInfo`、详情 grid、`ThToolbar`、`ThDetailFooterTotalInfo` 等布局沿用标准详情；历史拼写如 `:cloumns` 以项目现状为准，不擅自“修正”。
- 详情明细 grid 需要虚拟滚动时，和主单一样配置 `virtualYConfig`、`rowConfig.keyField` 和稳定 `height`。
- 详情专用 `OP_HEADERS`、详情 `pageId` 和详情日志 headers 交给 [t-oplog](../t-oplog/SKILL.md)；本技能不猜。

## 必问门禁

- 未确认详情形态前，不写详情目录、详情路由、详情 locale、详情 `pageId` 或详情字段设置。
- 未确认 `pageId` 前，不注册详情 `OP_HEADERS` 或详情写操作日志。
- 未确认字段设置维度前，不新增详情头字段、明细列、详情表单项或详情弹窗字段。
- 未确认 i18n namespace 前，不新增详情标题、详情按钮、明细列标题或详情提示文案。
- 未确认保存/确认/可编辑性规则前，不改详情 footer、详情弹窗确认按钮或 `isEdit` 相关逻辑；转交 [t-tab](../t-tab/SKILL.md)。

## 禁止事项

- 禁止独立详情路由进入菜单模块。
- 禁止主单文件 import 详情目录作为 shortcut；详情需要主单权限时从主单 `auth.ts` 复用。
- 禁止无项目证据时为详情单独新建 `auth.ts`。
- 禁止猜测详情 `OP_HEADERS`、`pageId`、权限码、i18n namespace 或字段设置维度。
- 禁止用户只要求详情时顺手改主单列表列宽、查询或工具栏。
- 禁止详情明细 grid 在项目模式要求时漏掉 `virtualYConfig` 或稳定 `height`。
