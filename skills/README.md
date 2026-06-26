# Tsb ERP 页面 Skills

Tsb ERP 业务页（TradeErp ts* / HallErp th*）的 Agent 编码规范。

## 入口（Agent 先读）

1. **[tsb-page](tsb-page/SKILL.md)** — 总入口与 Skill 路由表
2. **[tsb-page/profiles.md](tsb-page/profiles.md)** — 项目画像表（ts/th 自动探测、占位符替换）
3. **[tsb-page/anchors.md](tsb-page/anchors.md)** — 标准页(ts/th双列)、主单/详情映射、**四条红线（含禁脚本）**
4. **[tsb-page/orchestration.md](tsb-page/orchestration.md)** — 18 subagent + 模块并行拆解 调度矩阵
5. **[tsb-page-workflow](tsb-page-workflow/SKILL.md)** — 任何改代码前必读
6. **Rule** `tsb-page-agent-guidance` — 编辑 `src/views/{ts,th}*/**` 时自动加载

## 快捷命令

| 命令 | 用途 |
|------|------|
| `/tsb-page-start` | 启动改页工作流（先探测 ts/th） |
| `/tsb-page-new-module` | 新建页面模块 |
| `/tsb-page-review` | 改完专项审查 |

## 必问单选题

凡需用户做选择时，按 [tsb-page-workflow/reference.md#必问单选题总表](tsb-page-workflow/reference.md#必问单选题总表) 处理：**AskQuestion** 单选 · 选定前不写代码

## Skill 索引

- `tsb-page` — 内核 · 路由表 + profiles/anchors/orchestration/naming
- `tsb-page-workflow` — 蓝图 · 必问 · 最简代码
- `tsb-page-registry` — 全模块路由与 Tab 检测
- `tsb-page-standards` — 命名、解耦、import、列宽
- `tsb-page-list` / `tsb-page-detail` / `tsb-page-dialog` / `tsb-page-module`
- `tsb-page-auth` / `tsb-page-operation-log` / `tsb-page-field-setting` / `tsb-page-tab-editability`

## Subagent（18 个）

详见 [tsb-page/orchestration.md](tsb-page/orchestration.md)。五组（新增「模块并行」）：

- **侦察**：`tsb-page-scout` · `tsb-page-surveyor`
- **模块并行**：`tsb-module-agent`（模板，运行时按大菜单实例化：每模块派一个，锁目录逐文件改，禁脚本）
- **实现**：`tsb-api-builder` · `tsb-column-crafter` · `tsb-type-author` · `tsb-view-assembler` · `tsb-dialog-builder` · `tsb-stylist` · `tsb-route-registrar` · `tsb-oplog-registrar` · `tsb-auth-registrar` · `tsb-scaffolder`
- **审查**：`tsb-spec-reviewer` · `tsb-i18n-checker` · `tsb-code-reviewer`
- **验证**：`tsb-impact-surveyor` · `tsb-registry-updater`

> 批量/跨模块任务不走实现组串行，改走**模块并行拆解**——`tsb-module-agent` 多实例并行，禁脚本。

## 旧名映射（已废弃）

| 旧名（1.x） | 新名（2.0.0） |
|------|------|
| `trade-erp-ts-page`（插件） | `tsb-erp-page` |
| `ts-page` | `tsb-page` |
| `ts-page-workflow` | `tsb-page-workflow` |
| `ts-page-standards` | `tsb-page-standards` |
| `ts-page-list` | `tsb-page-list` |
| `ts-page-detail` | `tsb-page-detail` |
| `ts-page-dialog` | `tsb-page-dialog` |
| `ts-page-module` | `tsb-page-module` |
| `ts-page-auth` | `tsb-page-auth` |
| `ts-page-operation-log` | `tsb-page-operation-log` |
| `ts-page-field-setting` | `tsb-page-field-setting` |
| `ts-page-tab-editability` | `tsb-page-tab-editability` |
| `ts-page-registry` | `tsb-page-registry` |
| `ts-page-code-reviewer`（agent） | `tsb-code-reviewer` |
| `/ts-page-start` | `/tsb-page-start` |
| `/ts-page-new-module` | `/tsb-page-new-module` |
| `/ts-page-review` | `/tsb-page-review` |
