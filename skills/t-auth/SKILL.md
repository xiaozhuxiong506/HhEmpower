---
name: t-auth
description: Use when adding or changing TSB ERP 按钮权限、权限码、AUTH_CODES、auth.ts、hasAuth、v-auth、visible/showBtnFn 按钮显隐、工具栏按钮权限、行操作权限、Tab 显隐、详情页/弹窗复用主单权限、AI 权限边界、人类用户等同权限控制。
---

# t-auth

只处理按钮/操作权限。字段权限读 [../t-field/SKILL.md](../t-field/SKILL.md)，页面规范读 [../t-standards/SKILL.md](../t-standards/SKILL.md)，责任审计与反绕过关卡继承 [../t-page/anchors.md](../t-page/anchors.md)。

## 权限机制（先懂再写）

`hasAuth(value: string | Array<string>, path?: string)` 来自 `@/router/utils`：

- 权限码来自后端菜单接口的 `pList[].code`，登录后被注入路由 `meta.auths`；`hasAuth` 默认查当前路由。
- `"*"` 通配放行；传数组要求全部命中；**传第二参数 `path` 可查其他页面的权限**——这是弹窗/详情复用主单权限的官方通道。
- `v-auth` 指令：code 含英文字母且无权限时**删除 DOM**；中文 code 永远不删（等于没鉴权）。

## 三项目模式（写错项目等于白写）

| 项目 | 模式 | 新增按钮时 |
| --- | --- | --- |
| 贸易 `ts*`（Tsb.TradeErp.PC） | 每页 `auth.ts` 导出 `AUTH_CODES` | 必须走 `AUTH_CODES.Xxx` 常量，禁止内联字符串 |
| 展厅 `th*`（Tsb.HallErpTenant.PC） | 多数页面内联 `hasAuth("add")`，仅个别页有 auth.ts | 跟同模块兄弟页现状：兄弟页有 `AUTH_CODES` 就跟随；主流内联则内联；跨页/弹窗用 `hasAuth("add", "/thXxx")` |
| 大屏 `dp*`（Tsb.HallErp.PC.Device） | **无权限体系**（`initRouter` 未接通，`meta.auths` 恒空） | 禁止新增 `v-auth` / `hasAuth` 判断：英文 code 一律按无权限删 DOM，中文 code 无效装饰 |

大屏端现有的 `ThPermission` 组件是 PC 端拷贝残留的死代码（依赖不存在的 `@/api/apis`），不要模仿也不要顺手修复，除非用户明确要求。

## 权限码来源（Permission Source）

- 权限码值只能来自后端或用户明确提供；AI 不自造，不从相邻页面抄"看起来像"的码。
- 本次新增或整体重写的 `auth.ts` 必须在 `AUTH_CODES` 中逐项直接声明、`as const`、每项带中文 JSDoc 注释；局部改动保持原范围。细则见 [定义文件直接声明](../t-standards/reference.md#定义文件直接声明)。
- 工具栏按钮、行操作、Tab 显隐、详情/弹窗按钮必须接同一套权限来源，不混用两套判断。

### 命名风格（真实样例，跟随所属页面既有风格）

- ts 通用动作：`ADD: "add"`、`EDIT: "edit"`、`BATCH_DELETE: "batchDelete"`——成员大写下划线，码小驼峰。
- ts 详情动作：`ADD_PRODUCT: "detail_addProduct"`——`detail_` 前缀表达"详情页内动作"。
- ts 多 Tab 页：`AlreadyOrderPlaced_EDIT: "AlreadyOrderPlaced_edit"`——模块 PascalCase 前缀。
- th：短驼峰动作词（`add`/`edit`/`complete`）；详情按钮 `D` 前缀（`DCallNumber`）；工具栏导出/打印 `T` 前缀（`TExport`/`TPrint`）；Tab 用 `tab1`/`tabCreated`；标志位 `is` 前缀（`isAdmin`）。

## 标准写法（照抄这些形态）

**ts：auth.ts 定义**

```ts
/** 部门管理权限码 */
export const AUTH_CODES = {
  /** 新增 */
  ADD: "add",
  /** 编辑 */
  EDIT: "edit"
} as const;
```

**工具栏按钮（按钮数据里用 `visible` 函数，ThToolbar 本身无权限 props）**

```ts
{
  type: "primary",
  visible: () => hasAuth(AUTH_CODES.ADD),
  handler: () => openDialog()
}
```

**行操作（vxe 列配置 / ThActionBtns actions）**

```ts
// ts：操作列按钮数组
{
  key: "delete",
  visible: () => hasAuth(AUTH_CODES.DELETE),
  handler: row => del(row)
}

// th：ThActionBtns 的 actions
{
  text: t("buttons.btn37"),
  showBtnFn: () => hasAuth("edit"),
  methods: row => openForm(row)
}
```

**模板按钮与弹窗挂载**

```html
<el-button v-if="hasAuth(AUTH_CODES.EDIT)" @click="edit(row)">…</el-button>
<AEDialog v-if="(hasAuth(AUTH_CODES.ADD) || hasAuth(AUTH_CODES.EDIT)) && mounted" />
```

**跳转/操作守卫（函数内判断，不靠按钮隐藏兜底）**

```ts
const toDetail = (row: Row) => {
  if (!hasAuth(AUTH_CODES.VIEW_DETAIL)) return;
  openStaticPage(/* … */);
};
```

**详情/弹窗复用主单权限（两种官方形态）**

```ts
// ts：详情目录直接引主单 auth.ts
import { AUTH_CODES } from "../auth";

// th：hasAuth 第二参数传主单路由 path（详情路由是 /thXxxDetail，权限挂在主单）
const canAdd = hasAuth("add", "/thCustomerManage");
```

## 禁止写法（反面教材，出现即错）

**❌ 1. ts 页面内联字符串替代 AUTH_CODES**

```ts
if (!hasAuth("edit")) return; // ts 页面：码漂移无追踪，拼错编译不报
```

真实翻车样例：`hasAuth("DPriductDetails")`（拼错 Product）、`hasAuth('improt')`（拼错 import）。存量写死字符串 40+ 处，拼错即静默失权，新代码禁止再产生。

**❌ 2. `v-auth` 中文 code**

```html
<el-button v-auth="'确定'">…</el-button>
```

指令只对含英文字母的 code 删 DOM，中文 code **永远不拦截**，纯属装饰。存量约 10 个弹窗这样写、全部无效——新代码禁止模仿。

**❌ 3. 大屏端（dp*）加权限判断**

```html
<el-button v-auth="'export'">…</el-button>
```

大屏未接通 `initRouter`，`meta.auths` 恒空 → 英文 code 一律被当无权限删 DOM，按钮直接消失。

**❌ 4. 抄相邻页面的"相近码"**

```ts
// 想加"导出"，看隔壁写了 exportLogo 就抄：
EXPORT: "exportLogo" // 语义不同：后台没给本页配这个码，按钮永不显示或越权
```

**❌ 5. AI 自造权限码**

```ts
DELETE: "tsProduct:delete" // 后端码是纯英文小驼峰/下划线，无冒号、无模块前缀
```

**❌ 6. 权限判断被绕过**

```ts
const canEdit = true; // 硬编码 hasAuth 结果
```

以及：删除 `v-if`/`visible` 守卫"先跑通再说"、伪造超级用户、自造 `isAdmin2` 角色标志替代权限码、屏蔽鉴权失败提示。

**❌ 7. `auth.ts` 职责串味**

```ts
// auth.ts 里出现以下任一项即错：
export const columns = [];       // 列配置
export function getXxxPage() {}  // API
export type Row = {};            // 类型（归 type.ts）
```

**❌ 8. 字段权限当按钮权限**

```ts
setField("edit", visible); // setField 管字段可见/可编辑，不管按钮；按钮显隐用 hasAuth
```

## 必问门禁（Ask Gates）

新增权限码前必须问用户：

> 本次权限码怎么处理？

- **A. 已提供后端权限码**：按用户给出的字符串原样写入。
- **B. 后续配置**：先写 `"需要后台配置！"` 占位，待后端补齐。（本插件约定：两个 PC 项目现状均无此字符串，它是显式的待补齐标记，不是既有惯例。）

未选定前不写新的 `AUTH_CODES`；用户拒选时按 [t-clarify](../t-clarify/SKILL.md) 的拒绝升级规则提供"补权限码 / 占位 / 取消"三选一。

## AI 权限边界

AI 只在与人类用户同等的权限边界内辅助修改和验证，不得创造、模拟或绕过权限。前端按钮隐藏不等于后端授权；保存、审核、删除、导出、批量操作必须保留后端权限码和接口鉴权。硬编码 `hasAuth`、伪造超权、调试账号、浏览器/MCP 合法账号等细则见 [../t-page/anchors.md](../t-page/anchors.md) 权限等同用户关卡；权限事实源不清时先问，不继续改。

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
