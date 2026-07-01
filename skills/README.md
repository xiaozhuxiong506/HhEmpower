# Tsb ERP 页面 Skills

Tsb ERP  Agent 编码规范。

## 入口（Agent 先读）

1. **[t-page](t-page/SKILL.md)** — 总入口与 Skill 路由表
2. **[t-page/profiles.md](t-page/profiles.md)** — 项目画像表（ts/th 自动探测、占位符替换）
3. **[t-page/anchors.md](t-page/anchors.md)** — 标准页(ts/th双列)、主单/详情映射、**五条红线（含禁脚本 + 最小改动原则）**
4. **[t-page/orchestration.md](t-page/orchestration.md)** — 21 subagent 六组 + 模块并行拆解 调度矩阵
5. **[t-workflow](t-workflow/SKILL.md)** — 任何改代码前必读
6. **Rule** `t-agent-guidance` — 编辑 `src/views/{ts,th}*/**` 时自动加载

## 快捷命令

| 命令 | 用途 |
|------|------|
| `/t-start` | 启动改页工作流（先探测 ts/th） |
| `/t-new-module` | 新建页面模块 |
| `/t-review` | 改完专项审查 |

## 必问单选题

凡需用户做选择时，按 [t-workflow/reference.md#必问单选题总表](t-workflow/reference.md#必问单选题总表) 处理：**AskQuestion** 单选 · 选定前不写代码

## Skill 索引

- `t-page` — 内核 · 路由表 + profiles/anchors/orchestration/naming
- `t-clarify` — 需求澄清（模糊信号词 → 澄清三问 → 硬卡停放行）
- `t-workflow` — 蓝图 · 必问 · 最简代码
- `t-registry` — 全模块路由与 Tab 检测
- `t-standards` — 命名、解耦、import、列宽
- `t-list` / `t-detail` / `t-dialog` / `t-module`
- `t-auth` / `t-oplog` / `t-field` / `t-tab`

## Subagent（21 个）

详见 [t-page/orchestration.md](t-page/orchestration.md)。六组：

- **侦察**：`t-scout`（只定范围）· `t-survey`
- **模块并行**：`t-mod`（模板，运行时按大菜单实例化：每模块派一个，锁目录逐文件改，禁脚本）
- **实现**：`t-api` · `t-col` · `t-type` · `t-view` · `t-dialog` · `t-style` · `t-route` · `t-oplog` · `t-auth` · `t-scaffold` · `t-i18n`（locales 唯一写入者）
- **共享/修复**：`t-shared`（跨模块共享组件/utils/hook 单点手术）
- **审查**：`t-spec`（第一阶段·六处一致）· `t-i18n-check` · `t-code`（第二阶段）
- **验证**：`t-impact`（影响核查）· `t-registry` · `t-build`（实跑 vue-tsc/eslint）

> 批量/跨模块任务不走实现组串行，改走**模块并行拆解**——`t-mod` 多实例并行，禁脚本。

## 旧名映射（已废弃）

| 旧名（1.x） | 新名（2.0.0） |
|------|------|
| `trade-erp-ts-page`（插件） | `t-erp-page` |
| `ts-page` | `t-page` |
| `ts-page-workflow` | `t-workflow` |
| `ts-page-standards` | `t-standards` |
| `ts-page-list` | `t-list` |
| `ts-page-detail` | `t-detail` |
| `ts-page-dialog` | `t-dialog` |
| `ts-page-module` | `t-module` |
| `ts-page-auth` | `t-auth` |
| `ts-page-operation-log` | `t-oplog` |
| `ts-page-field-setting` | `t-field` |
| `ts-page-tab-editability` | `t-tab` |
| `ts-page-registry` | `t-registry` |
| `ts-page-code-reviewer`（agent） | `t-code` |
| `/ts-page-start` | `/t-start` |
| `/ts-page-new-module` | `/t-new-module` |
| `/ts-page-review` | `/t-review` |
