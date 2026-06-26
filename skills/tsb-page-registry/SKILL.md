---
name: tsb-page-registry
description: >-
  Tsb ERP（ts*/th*）全模块路由与 Tab 注册表、发现命令、改动影响范围检测。
  Use when 路由, Tab, staticRoutes, 新增路由, 全模块, 兄弟页, ThTabs, 影响范围.
---

# 路由与 Tab 注册表（Tsb ERP 通用）

本 Skill 定义**如何发现、登记、检测**项目内所有页面，不依赖写死的完整清单。
当前基线快照见 [reference.md](reference.md)；新增路由按本文流程自动兼容。

编码规范 → [tsb-page-standards](../tsb-page-standards/SKILL.md) · [naming.md](../tsb-page/naming.md)

## 第 0 步：探测项目

先读 [profiles.md](../tsb-page/profiles.md)，判定 ts/th，路由文件命名按对应列（ts→`ts{模块}Management.ts`；th→`th{模块}.ts`）。

## 三层检测范围

**L1 菜单页** — `src/router/modules/*.ts` 中各模块 `children`（不含 remaining 登录/redirect）

**L2 静态/隐藏页** — `src/router/modules/staticRoutes.ts` + `remaining.ts` 中非登录项

**L3 页内 Tab 面** — 同一菜单路由下，Tab 切换到的**子组件 .vue** 或**弹窗内 Tab**，视为独立检测单元

```
菜单路由 index.vue
├── Tab A → 同页 grid 筛选（模式 filter）
├── Tab B → 子组件 XxxPane.vue（模式 component，要单独检）
└── 弹窗 AddProduct.vue 内 Tab（模式 dialog，改功能时顺带检）
```

## 路由来源约定（新路由自动归类，ts/th 通用）

- `src/router/modules/` 下按项目命名（ts 为 `ts{模块}Management.ts`，th 为 `th{模块}.ts`）— 侧边栏菜单列表页，新页加在对应模块 children
- `src/router/modules/staticRoutes.ts` — 详情/导入/工具页，`showLink: false`
- `src/router/modules/remaining.ts` — 外链/登录，一般不增业务页
- `src/router/modules/home.ts` — 首页，极少变动
- ts 项目 `src/router/modules/tsTsbBear.ts` / th 项目 `src/tsb/` — 小竹熊子系统，不走标准页栈（D 档）

确切项目命名见 [profiles.md](../tsb-page/profiles.md) 路由模块文件列。

识别规则：path 以 `/${views前缀}` 开头；name 为 PascalCase；视图目录 `src/views/{模块}/${views前缀}Xxx/`。

## Tab 四种模式（检测项不同，ts/th 通用）

**filter** — 同页 grid，`activeTab` 改查询参数
- 检：每个 Tab 搜索参数、按钮 guard（`disabled`/`visible`）、列是否共用
- 检：**Tab 可编辑矩阵** — 哪些 Tab 不可保存/不可新增 → [tsb-page-tab-editability](../tsb-page-tab-editability/SKILL.md)

**component** — `shallowRef` + `<component :is>` 切子页面
- 检：**每个子 .vue 单独**走列表规范（grid、auth、OP_HEADERS）

**auth** — Tab 带 `isShow: hasAuth(...)`，需默认 Tab 逻辑
- 检：无权限时隐藏、首个可见 Tab 是否正确

**settings** — 综合设置类，Tab = 配置子模块，通常无 vxe 列表
- 检：auth 子码、组件 lazy；**不强制** virtualYConfig

**dialog** — 弹窗/Drawer 内 Tab
- 检：改该功能时顺带；内嵌 grid 仍要 virtualYConfig

Tab 变量名可能是 `TABS`、`tabList`；组件可能是 `ThTabs` 或 `ThTabs2` — 都算 Tab 页。

## 新增路由登记流程（必须做）

1. 在对应 `src/router/modules/*.ts` 或 `staticRoutes.ts` 注册 path + name
2. 五处一致 → [tsb-page-standards](../tsb-page-standards/SKILL.md) · [naming.md](../tsb-page/naming.md)
3. 若菜单列表页 → [tsb-page-module](../tsb-page-module/SKILL.md) 全流程
4. **本注册表**：在页面目录留可发现标记（见下）
5. 跑发现命令确认 grep 能扫到 → [examples.md](examples.md)

**页面目录内标记（供后续 grep，不强制单独 registry 文件）**

```typescript
// 列表页 index.vue 顶部或 defineOptions 附近
defineOptions({ name: "${Views大写}Xxx" });  // 与路由 name 一致

// 有 Tab 时二选一即可
const TABS = [{ label: "...", id: 0 }];
const tabList = ref([{ label: "...", id: 0, value: "PaneA" }]);
```

有 component 模式 Tab 时，子组件与 `tabList[].value` 同名或同目录，便于扫描关联。

## 检测矩阵（每个 L1/L2/L3 面填一行）

- path / name / defineOptions.name 一致
- OP_HEADERS 已注册（详情另注册一组；th 按形态另注册 PAGE）
- sysRoleFiledCode（有 grid 列配置时）
- auth.ts + hasAuth
- 列表栈：useGridPreferences + useColWidthSave + virtualYConfig + height
- i18n zh + en
- 有 Tab 时：每个 Tab 搜索/权限/子组件已检

## 规范分档（全模块检测时用，避免一刀切，ts/th 通用）

**A 档 — 强制标准栈**
- 核心业务列表及 Tab 子组件（ts 采购/跟单、th 客户/择样等）
- 新做的菜单列表页

**B 档 — 有 grid，结构可能不同**
- 销售、产品、财务、仓库等大部分列表页
- 修 bug 对齐同模块写法；**大改结构前 AskQuestion**（总表 #12）

**C 档 — 设置/工具页**
- 综合设置、系统管理、导入页、审批
- 检 auth 和路由；grid 规范按需

**D 档 — 独立子系统**
- ts `tsTsbBear`、th `src/tsb/`、静态页、登录 redirect
- 不在本 Skills 范围

## 改动时查影响

Bug/新需求涉及某路由 → 先 [reference.md](reference.md) 查同模块兄弟页 → Grep 同 Tab 模式 → 列表+详情+Tab 子组件一并查。

关联：[tsb-page-workflow](../tsb-page-workflow/SKILL.md) · [tsb-page-module](../tsb-page-module/SKILL.md)

发现命令 → [examples.md](examples.md) · 当前基线 → [reference.md](reference.md)
