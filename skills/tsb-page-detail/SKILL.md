---
name: tsb-page-detail
description: >-
  Tsb ERP（ts*/th*）详情页：ThDetailHeadInfo、明细 grid，标准页按当前项目（ts=tsMaterialOrderingDetail / th=内嵌 Detail.vue）。
  Use when 详情页, 明细页, xxxDetail, Detail.vue, openStaticPage, 详情头, ThDetailFooterTotalInfo.
---

# 详情页（Tsb ERP 通用）

标准页（按当前项目探测，见 [profiles.md](../tsb-page/profiles.md)）→ [anchors.md](../tsb-page/anchors.md#标准源码)

文件命名与编码规范 → [tsb-page-standards](../tsb-page-standards/SKILL.md) · [naming.md](../tsb-page/naming.md)

列表跳转：`${标准页}/index.vue` → `utils.openStaticPage(..., "query")`

**改动范围** → [anchors.md](../tsb-page/anchors.md#主单--详情映射)

> **ts 项目**：详情多为独立目录 `${views前缀}XxxDetail`（注意 legacy：采购订货详情是 `tsProcOrderDetails` 非 `Detail` 后缀）。
> **th 项目**：详情多为内嵌 `components/Detail.vue` / `MaiDetail.vue`；少数独立 `thXxxDetail` 目录。改前先探测。

**Tab/弹窗可编辑**：详情内弹窗 footer、domData 按钮须接 `isEdit` / `*OpsHidden` / `*SaveHidden` → [tsb-page-tab-editability](../tsb-page-tab-editability/SKILL.md)

## 布局

`ThDetailHeadInfo` → `vxe-grid` + `ThToolbar` → `ThDetailFooterTotalInfo` → Modal/Drawer

## 与列表页差异（通用）

- 详情独立目录（ts）或内嵌 Detail.vue（th）
- OP_HEADERS 单独注册一组详情 → [tsb-page-operation-log](../tsb-page-operation-log/SKILL.md)
- 列常量 `DEFAULT_COLUMNS_INDEX`（非 DEFAULT_COLUMNS）
- sysRoleFiledCode 独立
- 列 API 照抄模板（`GetXxxDetailColumns` · `UpdateXxxDetailConfig`）
- auth 复用列表页，不单独建 auth.ts

```typescript
import { AUTH_CODES } from "../${views前缀}Xxx/auth";
// 详情按钮用 AUTH_CODES.DETAIL_*
```

## route.query

- `id` 拉主单
- 业务编号拉明细
- `t` 可选，审批入口 `sourceType = +route.query.t || 0`

## 路由

独立详情目录只放 `staticRoutes.ts`，不进菜单模块：

```typescript
meta: { pagePath: "/${views前缀}Xxx", showLink: false, keepAlive: true }
```

> th 内嵌详情（Detail.vue）不单独注册路由，挂在主单 index.vue 内。

## ThDetailHeadInfo

- prop 拼写 `:cloumns`（项目历史拼写，照抄勿改）
- sysRoleFiledCode 用列表页 code
- tableHeight 读 `ThDetailHeadInfoRef.isShow`

## onMounted

```typescript
await getXxxInfo();
searchDetailXxx();
restoreUserPreferences();
```

## 虚拟滚动

明细 grid 同样必配 `virtualYConfig` + `rowConfig.keyField: "id"` + `:height="tableHeight"`

## 列宽（新需求明细 grid，按主单规则）

业务列 < 9 → 不设 width；>= 9 → 按 tsb-page-standards 通用值。
禁止 `minWidth`。规则同列表页 → [tsb-page-standards/reference.md](../tsb-page-standards/reference.md#列宽与-minwidth)

## 禁止

- 独立详情路由进菜单模块
- 主单引用本详情目录（应详情引用主单，不能反过来）
- 漏注册 OP_HEADERS 或单独建 auth.ts
- 用户说主单却改详情，或范围模糊未问单选题（总表 #2）
- 不用 openStaticPage 跳转（独立详情场景）
- 新需求明细 grid 不足 9 业务列却写 width / minWidth
- 新增详情头/grid 字段未问字段设置（总表 #13）→ [tsb-page-field-setting](../tsb-page-field-setting/SKILL.md)

必问单选题 → [tsb-page-workflow/reference.md](../tsb-page-workflow/reference.md#必问单选题总表)

关联：[tsb-page-list](../tsb-page-list/SKILL.md) · [tsb-page-auth](../tsb-page-auth/SKILL.md) · [tsb-page-workflow](../tsb-page-workflow/SKILL.md)
