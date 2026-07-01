---
name: t-oplog
description: >-
  Tsb ERP（ts*/th*）操作日志 OP_HEADERS：关键字查询才传SEARCH，写操作必传，pageId须问后台。ts/th 形态不同见 profiles。
  Use when 操作日志, OP_HEADERS, operationLog, pageId, 关键字查询, SEARCH, 增删改.
---

# 操作日志（Tsb ERP 通用）

配置中心：`src/utils/operationLog.ts` → 导出 `OP_HEADERS`（两项目都有）

HTTP 拦截器 `src/utils/http/index.ts` 把 `pageTitle` / `useTitle` 转成请求头 `PageTitle` / `UseTitle`，后端据此记日志。

管理端查看：操作日志页（ts→`src/views/tsSystemAdmin/tsOperationLog/`；th→对应系统管理页）

## ⚠ ts / th 形态差异 + 混合格式警告（必看）

**核心规则：新增 OP 时先读同模块现有写法，不机械套规则。** 两项目的 operationLog.ts 均有混合格式（ts 项目约 100 个页名 key + 4 处 PAGE；th 项目 59 个 PAGE + 少量页名 key）。

**主流形态参考**（详看 [profiles.md](../t-page/profiles.md) OP形态列）：

| 项目 | 主流 OP_HEADERS 形态 | key 命名 |
|------|----------------|---------|
| **ts（TradeErp）** | `OP_HEADERS[页名][动作]={headers:{pageTitle,useTitle,pageId}}` | key = 页面文件夹名（六处一致） |
| **th（HallErp）** | `OP_HEADERS[PAGE{N}][AUTH{N}].headers={pageTitle,useTitle,pageId}` | key = `PAGE{N}`（页）+ `AUTH{N}`（动作），N 由现有最大值递增 |

ts 形态（按页名取）：
```typescript
tsMaterialOrdering: {
  SEARCH: { headers: { pageTitle: "物料订货", useTitle: "查询", pageId: 859 } },
  ADD:    { headers: { pageTitle: "物料订货", useTitle: "新增", pageId: 860 } }
}
// 用法：OP_HEADERS.tsMaterialOrdering.SEARCH
```

th 形态（按 PAGE/AUTH 序号取，注释标明页名）：
```typescript
PAGE1: {
  AUTH1: { headers: { pageTitle: "摊位租用", useTitle: "查询", pageId: 1 } },
  AUTH2: { headers: { pageTitle: "摊位租用", useTitle: "新增", pageId: 2 } }
}
// 用法：OP_HEADERS.PAGE1.AUTH1
```

> th 项目 key 不与文件夹同名，**必须注释标明该 PAGE 属于哪个页面**，便于维护。

## 何时传 OP_HEADERS

**两类，规则相同（ts/th 通用）：**

### 1. 关键字查询（条件传）

分页 / 明细列表接口，**只有携带关键字查询时才传** `SEARCH`；普通翻页、Tab 切换、筛选刷新 **不传**（第二参 `{}`）。

```typescript
// ts：按页名取
await GetXxxPage(fd, keyWord ? OP_HEADERS.${views前缀}Xxx.SEARCH : {});
// th：按 PAGE/AUTH 取
await GetXxxPage(fd, keyWord ? OP_HEADERS.PAGE{N}.AUTH{搜} : {});
```

关键字变量名因页而异，常见：`keyWord` · `keyword` · `searchOption.keyWord` · `searchOption.form.keyWord`。判断「有值」即可，空串不传。

### 2. 写操作（必传）

增删改、批量删、状态变更、提交审核等**改变数据**的接口，**每次调用都传**对应操作项：

```typescript
await BatchDeleteXxx({ ids }, OP_HEADERS.${views前缀}Xxx.BDEL);  // ts
await url(fd, ruleForm.id ? OP_HEADERS.${views前缀}Xxx.EDIT : OP_HEADERS.${views前缀}Xxx.ADD);
```

### 3. 打印 / 导出（注册 pageId）

列表 `ThToolbar` 传 `:pageIds`，取 `EXPORT` / `PRINT` 的 `pageId`；组件内部调日志记录，页面无需再包一层。

```vue
:pageIds="[
  OP_HEADERS.${views前缀}Xxx.EXPORT.headers.pageId,   // ts
  OP_HEADERS.${views前缀}Xxx.PRINT.headers.pageId
]"
```

### 4. 不传 OP_HEADERS

- 列配置 `GetXxxColumns` · 列保存 `UpdateXxxConfig`
- 进详情 `GetXxx`（按 id 拉主单）
- 纯读接口、下拉选项、无关键字的列表刷新

## OP_HEADERS 字段（ts/th 通用）

- `pageTitle` — 中文菜单/页面名
- `useTitle` — 中文操作动词（查询、新增、编辑、删除…）
- `pageId` — **后台配置**，由后端分配；见下文「pageId 必问」

详情页单独注册一组（ts→`${views前缀}XxxDetail`；th→新 `PAGE{N}`），不共用列表 key。

## pageId 必问（新增页面 / 新接口必做）

`pageId` **只能由后台配置**。提问格式与选项 → [t-workflow 必问单选题总表](../t-workflow/reference.md#必问单选题总表) **#6**。

新增页面、新增 OP_HEADERS 操作项时，**必须先 AskQuestion 单选**，未问不得写入 `operationLog.ts`：

> 本次各操作的 pageId 怎么处理？

- **A. 我已提供 pageId** — 按你给出的数字写入每个操作项
- **B. 后续处理** — 先注册结构，`pageId` 统一写 `"需要后台配置！"`（字符串占位，待后台补全后再改回数字）

**禁止**：

- 未问就写 pageId
- 自填 `0`、`-1`、随机数等假 pageId
- 从其他页面抄 pageId 凑数

选定 **B** 时，每个操作项示例：

```typescript
SEARCH: { headers: { pageTitle: "新页名", useTitle: "查询", pageId: "需要后台配置！" } }
```

后续你或后台提供真实 pageId 后，再逐条替换为数字。

## API 层要求

业务 API 第二参支持 `headers?: object`，照抄当前项目 `${api文件}`：

```typescript
export const GetXxxPage = (data?: object, headers?: object) => {
  return http.request<Result>("post", `${baseURL}/${prefix}/Xxx/GetPage`, { data }, headers);
};
```

调用时整项传入（含外层 `headers` 键）：

```typescript
await CreateXxx(fd, OP_HEADERS.${views前缀}Xxx.ADD);
// ts: OP_HEADERS.${views前缀}Xxx.ADD === { headers: { pageTitle, useTitle, pageId } }
```

日志记录 API（ts `statistical.ts` 的 `AddBehaviorLog`；th 对应）由打印导出组件内部使用，新页**不要**在业务代码里直接调。

## 新页 checklist

1. **pageId 必问** — AskQuestion 一次（见上节），再写 `operationLog.ts`
2. `operationLog.ts` 注册列表 + 有详情则详情各一组（按 ts/th 形态）
3. 至少：`SEARCH` · `ADD` · `EDIT` · `DEL` · 有批量删则 `BDEL` · 有 ThToolbar 则 `EXPORT` + `PRINT`
4. 列表 `search` 里关键字条件传 `SEARCH`
5. 弹窗/Drawer 提交传 `ADD` / `EDIT`
6. 删除/批量删传 `DEL` / `BDEL`
7. import：`import { OP_HEADERS } from "@/utils/operationLog"`

## 禁止

- 列表每次查询都传 `SEARCH`（无关键字也传）
- 写操作漏传 OP_HEADERS
- **未问用户就写 pageId**，或自造 / 写 `0` 占位
- ts 项目 OP_HEADERS key 与文件夹名不一致
- th 项目 PAGE/AUTH 不加页名注释
- 在业务里直接调日志记录 API（打印导出除外，已由 ThToolbar 处理）

关联：[t-standards](../t-standards/SKILL.md) · [t-list](../t-list/SKILL.md) · [t-dialog](../t-dialog/SKILL.md) · [t-module](../t-module/SKILL.md)
