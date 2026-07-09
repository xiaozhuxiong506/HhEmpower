---
name: t-registry
description: Use when discovering, registering, or checking TSB ERP 路由、Tab、staticRoutes、remaining、兄弟页、路由影响范围、Tab 模式、全模块路由扫描。
---

# t-registry

本 skill 负责发现、登记和检查路由/Tab 影响范围；不替代 [t-workflow](../t-workflow/SKILL.md) 的改前决策，也不授权扩大修改范围。

路由、菜单、隐藏路由、route registry 和 Tab 登记会影响权限入口、日志入口和业务闭环；修改前同时遵守 [../t-page/anchors.md](../t-page/anchors.md)。

## 发现层级（Discovery Levels）

- **L1 菜单路由**：`src/router/modules/*.ts` 的业务菜单 children。
- **L2 静态/隐藏路由**：`staticRoutes.ts`、`remaining.ts` 中业务详情、导入、工具页。
- **L3 页内 Tab 面**：同一路由下由 Tab 切出的子组件、弹窗 Tab、抽屉 Tab。

每次查找前先读 [../t-page/profiles.md](../t-page/profiles.md)，确认 ts/th 路由文件和路径前缀。

## Tab 模式（Tab Modes）

- **filter**：同页 grid，`activeTab` 改查询条件。检查搜索参数、按钮 guard、列是否共用。
- **component**：`<component :is>` 或 `shallowRef` 切子页面。每个子 `.vue` 单独按列表规范检查。
- **auth**：Tab 带 `hasAuth` / `isShow`。检查无权限隐藏和默认 Tab。
- **settings**：配置类 Tab。检查 auth、lazy、路由，不强制套业务列表栈。
- **dialog**：弹窗/抽屉内 Tab。改相关功能时一并检查；内嵌 grid 仍按 standards。

## 影响边界（Impact Boundary）

- 用户指定单一路由、Tab、弹窗、抽屉或入口时，只查并报告影响，不自动扩大修改。
- 发现兄弟页、共享 Tab 子组件、route registry、cross-module file 可能受影响时，先列影响范围，再回到 [../t-page/anchors.md](../t-page/anchors.md) 的共享影响门禁。
- 全模块扫描只用于发现和报告，不等于批量修改许可。

## 参考资料（References）

- 查找方法和分档读 [reference.md](reference.md)。
- 可复制命令读 [examples.md](examples.md)。
- 命名一致读 [../t-page/naming.md](../t-page/naming.md)。
- 新模块登记读 [../t-module/SKILL.md](../t-module/SKILL.md)。

## 禁止项（Prohibitions）

- 禁止把发现到的兄弟页直接纳入修改范围。
- 禁止改 route registry 前不查路由影响。
- 禁止用本 skill 绕过 `t-clarify` / `t-workflow` 的改前确认。
- 禁止维护写死的全模块清单；以运行时扫描为准。
- 禁止把路由登记视为纯配置改动，跳过权限、日志、闭环和责任归属判断。

关联：[t-page](../t-page/SKILL.md) · [t-tab](../t-tab/SKILL.md) · [t-standards](../t-standards/SKILL.md)
