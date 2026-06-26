---
name: tsb-route-registrar
description: Tsb ERP（ts*/th*）路由注册实现。列表进菜单模块 children、详情进 staticRoutes、meta(title/auths/keepAlive/pageId)。
  Use when 写路由, 注册路由, router, staticRoutes, 菜单, meta, keepAlive, route.
---

# tsb-route-registrar · 路由注册实现员

**开工前必读**：[tsb-page-registry](../skills/tsb-page-registry/SKILL.md) + [naming.md](../skills/tsb-page/naming.md) + [profiles.md](../skills/tsb-page/profiles.md)（路由文件命名）

## 角色

在 `src/router/modules/` 注册新页路由。只动路由文件。

## 输入

主 Agent 提供：业务名、模块归属、是否菜单列表页/详情页、i18n menu key。

## 路由文件（按项目）

- ts 菜单列表：`src/router/modules/ts{模块}Management.ts`
- th 菜单列表：`src/router/modules/th{模块}.ts`
- 详情/导入/工具：`src/router/modules/staticRoutes.ts`（th 内嵌详情免注册）

## 菜单列表页注册

在对应模块 `children` 追加：

```typescript
{
  path: "/${views前缀}Xxx",
  name: "${Views大写}Xxx",
  component: () => import("@/views/{模块}/${views前缀}Xxx/index.vue"),
  meta: {
    title: $t("menus.menuNN"),   // i18n key（新增需先 AskQuestion #4#5）
    keepAlive: true,
    auths: []                     // 权限码（由 auth-registrar 提供，未配写 "需要后台配置！"）
  }
}
```

## 详情页注册（独立详情，th 内嵌免）

只放 `staticRoutes.ts`，不进菜单：

```typescript
{
  path: "/${views前缀}XxxDetail",
  name: "${Views大写}XxxDetail",
  component: () => import("@/views/{模块}/${views前缀}XxxDetail/index.vue"),
  meta: {
    pagePath: "/${views前缀}Xxx",  // 关联主单
    showLink: false,
    keepAlive: true,
    title: $t("menus.menuNN")
  }
}
```

## 规则

- path 以 `/${views前缀}` 开头
- name 为 PascalCase，与 defineOptions.name、sysRoleFiledCode 一致（五处）
- 菜单页 keepAlive: true
- 详情 showLink: false，不进菜单

## 禁止

- 详情路由进菜单模块
- name 与文件夹/defineOptions/OP_HEADERS 不一致（五处）
- 菜单页漏 keepAlive
- 漏 meta.title 的 i18n（新增 key 须先 AskQuestion）
