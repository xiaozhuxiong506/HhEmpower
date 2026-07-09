# 路由发现参考

本文件只记录查找方法和规范分档；可复制命令见 [examples.md](examples.md)。

## L1 静态搜索（L1 Static Search）

菜单页通常位于：

- `src/router/modules/*.ts`
- ts 项目常见：`ts{模块}Management.ts`
- th 项目常见：`th{模块}.ts`

检查内容：

- `path`
- `name`
- `component`
- `meta.title`
- `showLink`

新增菜单页必须保证 route name、目录名、`defineOptions.name`、OP_HEADERS、auth/log/pageId 命名一致。

## L2 运行时搜索（L2 Runtime Search）

静态/隐藏页通常位于：

- `src/router/modules/staticRoutes.ts`
- `src/router/modules/remaining.ts`

常见用途：详情页、导入页、工具页、隐藏跳转页。业务新增优先检查 `staticRoutes.ts`，`remaining.ts` 一般不新增业务页。

## L3 全模块扫描（L3 Full Module Scan）

全模块扫描用于发现影响范围，不直接批量修改。

扫描对象：

- 同模块兄弟页目录
- route name / path
- `defineOptions.name`
- `OP_HEADERS`
- `sysRoleFiledCode`
- `AUTH_CODES`
- `TABS` / `tabList` / `<component :is>`

发现同类问题时，输出影响报告并等待用户决定是否扩大范围。

## 路由影响级别（Route Impact Levels）

| 级别 | 含义 | 处理 |
| --- | --- | --- |
| L1 | 指定菜单路由本身 | 可按用户范围处理 |
| L2 | 详情/隐藏/导入等关联路由 | 先报告关联，再确认是否纳入 |
| L3 | Tab 子组件或弹窗 Tab | 按组件归属和复用情况确认 |
| Shared | 共享组件、公共 hook、route registry、跨模块文件 | 走共享影响门禁 |

## Tab 发现（Tab Discovery）

查找关键词：

- `activeTab`
- `TABS`
- `tabList`
- `ThTabs`
- `ThTabs2`
- `<component :is`
- `shallowRef`

component 模式 Tab 的子 `.vue` 必须单独检查列表栈、auth、OP_HEADERS、字段设置和可编辑矩阵。

## 规范分档

| 档位 | 识别特征 | 处理 |
| --- | --- | --- |
| A | 新页面、核心业务列表、完整 vxe 栈 | 强制标准栈 |
| B | 有 grid 但结构不同 | 修 bug 对齐同模块，大改前问 |
| C | 设置/工具/系统管理 | 检 auth、路由、必要 grid |
| D | 独立子系统、登录、redirect | 不套本组页面技能 |

分档不是写死清单；以当前项目结构和用户范围为准。
