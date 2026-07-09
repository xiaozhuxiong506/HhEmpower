---
name: t-oplog
description: Use when adding or changing TSB ERP 操作日志、OP_HEADERS、operationLog、pageId、SEARCH 日志、写操作、打印、导出、关键字查询、ts/th 日志形态差异。
---

# t-oplog

操作日志由 `src/utils/operationLog.ts` 的 `OP_HEADERS` 驱动。新增页面或新增操作项前，先读 [../t-page/profiles.md](../t-page/profiles.md) 判断 ts/th 形态。

新增写操作日志项前，同时读 [../t-page/anchors.md#责任与审计关卡](../t-page/anchors.md#责任与审计关卡) 和 [../t-page/anchors.md#权限等同用户关卡](../t-page/anchors.md#权限等同用户关卡)；日志不能替代权限，权限也不能替代日志。

## ts/th 形态（ts/th Shape）

- **ts 主流形态**：`OP_HEADERS[页面名][动作] = { headers: { pageTitle, useTitle, pageId } }`。
- **th 主流形态**：`OP_HEADERS[PAGE{N}][AUTH{N}] = { headers: { pageTitle, useTitle, pageId } }`，并用注释标明页面名。
- 两项目都有少量混合历史写法；新增前先查同模块现有页面，不机械套另一个项目。

## 何时传 OP_HEADERS（When To Pass OP_HEADERS）

- **关键字查询**：只有关键字有值时传 `SEARCH`；普通翻页、Tab 切换、无关键字刷新不传。
- **写操作**：新增、编辑、删除、批量删除、状态变更、提交审核等改变数据的接口必须传对应操作项。
- **打印/导出**：`ThToolbar` 使用 `pageIds`，取 `EXPORT` / `PRINT` 的 `pageId`。
- **不传**：列配置读取/保存、纯读下拉、按 id 拉详情、无关键字的列表刷新。

## pageId 询问门禁（pageId Ask Gate）

`pageId` 只能来自后台配置或用户明确提供。新增页面、新增 OP_HEADERS 操作项时，必须先问：

> 本次各操作的 pageId 怎么处理？

- **A. 已提供 pageId**：按用户给出的数字逐项写入。
- **B. 后续配置**：先写 `"需要后台配置！"`，待后台补齐。

未得到明确选择前，不写新的 `pageId`。禁止填写假数字、随机数字、无来源数字，禁止从其他页面拿值充数。

## 最小示例（Minimal Examples）

ts 形态：

```typescript
tsXxxPage: {
  SEARCH: { headers: { pageTitle: "页面名", useTitle: "查询", pageId: "需要后台配置！" } },
  ADD: { headers: { pageTitle: "页面名", useTitle: "新增", pageId: "需要后台配置！" } }
}
```

th 形态：

```typescript
// 页面名
PAGE12: {
  AUTH1: { headers: { pageTitle: "页面名", useTitle: "查询", pageId: "需要后台配置！" } },
  AUTH2: { headers: { pageTitle: "页面名", useTitle: "新增", pageId: "需要后台配置！" } }
}
```

## 禁止项（Prohibitions）

- 禁止无关键字查询也传 `SEARCH`。
- 禁止写操作漏传 OP_HEADERS。
- 禁止未问用户就写 `pageId`。
- 禁止填写无来源的 `pageId`。
- 禁止 ts key 与页面命名六处不一致。
- 禁止 th PAGE/AUTH 缺少页面注释。
- 禁止业务代码直接调用日志记录 API；打印/导出由组件处理。
- 禁止新增写操作时只补日志，不检查业务闭环、权限边界和责任归属。

关联：[t-module](../t-module/SKILL.md) · [t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
