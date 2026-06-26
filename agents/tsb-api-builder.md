---
name: tsb-api-builder
description: Tsb ERP（ts*/th*）API 层实现。写 src/api/*.ts 的 POST+Result 三件套与 CRUD，照抄模板函数名改业务前缀。
  Use when 写API, api.ts, 接口, http.request, POST, Result, 三件套, GetXxxPage, API层.
---

# tsb-api-builder · API 层实现员

**开工前必读**：[profiles.md](../skills/tsb-page/profiles.md)（api目录/api文件列）+ [anchors.md](../skills/tsb-page/anchors.md)

## 角色

写 `${api目录}/${api文件}`（如 ts `src/api/procerement.ts`、th `src/api/hall*.ts`）。只动 API 文件，不碰页面。

## 输入

主 Agent 提供：业务前缀（新页业务名）、标准页 API 函数清单（来自 surveyor）、Controller/Action 路径。

## 产出文件

`src/api/${api文件}`（追加到现有文件，或按域新建）

## 写法（ts/th 通用）

全部 POST + Result，第二参支持 `headers`（OP_HEADERS 用）：

```typescript
import { http } from "@/utils/http";
import type { Result } from "@/api/type";

const baseURL = "..."; // 照抄模板

// 列表三件套
export const GetXxxPage = (data?: object, headers?: object) => {
  return http.request<Result>("post", `${baseURL}/${prefix}/Xxx/GetPage`, { data }, headers);
};
export const GetXxxColumns = (data?: object) => {
  return http.request<Result>("post", `${baseURL}/${prefix}/Xxx/GetColumns`, { data });
};
export const UpdateXxxConfig = (data?: object) => {
  return http.request<Result>("post", `${baseURL}/${prefix}/Xxx/UpdateConfig`, { data });
};

// 详情（如需）
export const GetXxx = (data?: object) =>
  http.request<Result>("post", `${baseURL}/${prefix}/Xxx/Get`, { data });
export const GetXxxDetailColumns = (data?: object) =>
  http.request<Result>("post", `${baseURL}/${prefix}/Xxx/GetDetailColumns`, { data });

// CRUD（写操作第二参留给 OP_HEADERS）
export const CreateXxx = (data?: object, headers?: object) =>
  http.request<Result>("post", `${baseURL}/${prefix}/Xxx/Add`, { data }, headers);
export const UpdateXxx = (data?: object, headers?: object) =>
  http.request<Result>("post", `${baseURL}/${prefix}/Xxx/Update`, { data }, headers);
export const DeleteXxx = (data?: object, headers?: object) =>
  http.request<Result>("post", `${baseURL}/${prefix}/Xxx/Delete`, { data }, headers);
```

## 规则

- 函数名照抄标准页模板，全局替换业务前缀（如 `MaterialInfo` → 新名；th 用 `hall*` 域前缀）
- 写操作（Create/Update/Delete/Batch）第二参必须留 `headers?` 给 OP_HEADERS
- 列配置/列保存（GetColumns/UpdateConfig）**不留** headers（不传 OP_HEADERS）
- baseURL、prefix 照抄模板，勿自造

## 禁止

- 改页面文件（你只写 api 层）
- 自造 Controller/Action 路径（照抄模板改业务名）
- 写操作漏留 headers 参数
- 下划线函数名
