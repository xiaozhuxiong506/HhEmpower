# Tsb ERP · 页面开发（Cursor Plugin）

Tsb ERP 业务页 Agent 开发规范插件。**同时覆盖两个项目**：

- **Tsb.TradeErp.PC**（`src/views/ts*` — 采购/物料/跟单等）
- **Tsb.HallErpTenant.PC**（`src/views/th*` — 客户/择样/摊位/CRM 等）

插件目录：`D:\company\HhEmpower`（Marketplace 名：`t-erp-page`）

## 内容

- **14 个 Skills** — `t-page` 内核（profiles/anchors/orchestration/naming）+ `t-clarify`（需求澄清关卡）+ workflow + 列表/详情/弹窗等子 Skill
- **21 个 Subagent** — 侦察(2) + 模块并行(1模板) + 实现(11) + 共享/修复(1) + 审查(3) + 验证(3)，多 agent 并行编排，**禁脚本**
- **1 条 Rule** — 编辑 `src/views/{ts,th}*/**` 时自动应用指引（自动探测 ts/th）
- **3 个 Command** — `/t-start` · `/t-new-module` · `/t-review`

## 核心特性

### 双项目自动适配

插件不硬编码任何项目特定路径。Agent 进入任务时**自动探测**当前项目（读 package.json / 扫 views 前缀），按 [skills/t-page/profiles.md](skills/t-page/profiles.md) 的画像表套用对应列（标准页、OP_HEADERS 形态、API 文件、locales 命名空间）。

- TradeErp：标准页 `tsMaterialOrdering`，OP_HEADERS 形态 `OP_HEADERS[页名][动作]`
- HallErp：标准页 `thCustomerInfo`，OP_HEADERS 形态 `OP_HEADERS[PAGE{N}][AUTH{N}]`

### 多 Subagent 编排

主 Agent 读 [skills/t-page/orchestration.md](skills/t-page/orchestration.md) 学会调度，按任务规模选 subagent 子集（小改 3-4 个、大改全链路 11-12 个，非每次全用 21 个）：

| 组 | Agent | 职责 |
|----|-------|------|
| 侦察 | `t-scout` · `t-survey` | 探测项目、定位范围、测绘标准页（只读） |
| 模块并行 | `t-mod`（模板，运行时实例化） | 批量/跨模块任务：按大菜单扫描，每模块派一个实例并行，禁脚本 |
| 实现 | `t-api` · `t-col` · `t-type` · `t-view` · `t-dialog` · `t-style` · `t-route` · `t-oplog` · `t-auth` · `t-scaffold` · `t-i18n` | 按代码层并行写（各写各文件）；i18n-author 是 locales 唯一写入者 |
| 共享/修复 | `t-shared` | 改跨模块共享组件/utils/hook 时单点手术 + 同步所有引用方 |
| 审查 | `t-spec` · `t-i18n-check` · `t-code` | 两阶段守门（规范符合含六处一致 → 代码质量） |
| 验证 | `t-impact` · `t-registry` · `t-build` | Bug 后查漏改 / 新模块后登记 / 实跑 vue-tsc+eslint+冒烟 |

## 本地安装

```powershell
cd D:\company\HhEmpower
.\scripts\install-local.ps1
```

脚本会在 `%USERPROFILE%\.cursor\plugins\local\t-erp-page` 创建符号链接。完成后：

1. 重启 Cursor（或重新打开窗口）
2. **Settings → Customize → Plugins**，确认 **t-erp-page** 已启用
3. 输入 `/t-start` 测试

### 手动安装

```powershell
$target = "D:\company\HhEmpower"
$link   = "$env:USERPROFILE\.cursor\plugins\local\t-erp-page"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\plugins\local" | Out-Null
if (Test-Path $link) { Remove-Item $link -Force -Recurse }
New-Item -ItemType SymbolicLink -Path $link -Target $target
```

## 团队分发

### 方式 A：符号链接（开发机）

每人 clone 本仓库后执行一次 `install-local.ps1`。

### 方式 B：独立 Git + Team Marketplace

```powershell
.\scripts\export-github-repo.ps1
# 在导出目录 push 到 GitHub 私有仓，挂到 Cursor Team Marketplace
```

详见 [PUBLISH.md](PUBLISH.md)。

### 方式 C：随 ERP 主仓维护

源文件可在 `Tsb.TradeErp.PC\.cursor\skills\t-page*`，改完后：

```powershell
.\scripts\sync-skills.ps1 -SourceRoot "D:\company\Tsb.TradeErp.PC\.cursor\skills"
```

## 插件结构

```
HhEmpower/
├── .cursor-plugin/plugin.json
├── agents/                  ← 21 个 subagent（侦察/模块并行/实现/共享/审查/验证六组）
├── commands/                ← /t-start · /t-new-module · /t-review
├── rules/t-agent-guidance.mdc   ← glob 匹配 src/views/{ts,th}*/**/**
├── scripts/                 ← install-local · sync-skills · export-github-repo
├── skills/
│   ├── t-page/            ← 内核（SKILL + anchors + profiles + orchestration + naming）
│   ├── t-workflow/   ← 改动工作流 + 必问单选题
│   ├── t-page-{list,detail,dialog,module,standards}/
│   ├── t-page-{auth,operation-log,field-setting,tab-editability,registry}/
│   └── README.md
├── CHANGELOG.md
└── README.md
```

## 与项目 `.cursor/skills` 的关系

| 位置 | 用途 |
|------|------|
| `Tsb.TradeErp.PC\.cursor\skills\` 或 `Tsb.HallErpTenant.PC\.cursor\skills\` | 可选：项目内 Skill 源 |
| `HhEmpower\skills\` | 插件分发副本（本目录） |
| `rules/t-agent-guidance.mdc` | 编辑 ts/th 页时自动加载 |

启用插件后 Skills 随 Cursor 用户级加载；Rule 仅在匹配 `src/views/{ts,th}*/**` 时生效。

## 从 1.x 迁移（v2.0.0）

- 插件名 `trade-erp-ts-page` → **`tsb-erp-page`**（2.4.0 起再改为 `t-erp-page`，见下）
- 命令 `/ts-page-*` → **`/tsb-page-*`**（2.4.0 起再改为 `/t-*`，见下）
- Skill `ts-page-*` → **`tsb-page-*`**（2.4.0 起再改为 `t-*`，见下）
- 现在同时支持 **TradeErp(ts*)** 和 **HallErp(th*)**，自动探测
- 新增 **18 个 subagent** 多 agent 编排 + 模块并行拆解（详见 [skills/t-page/orchestration.md](skills/t-page/orchestration.md)）

## 从 2.3.0 迁移（v2.4.0）

延续 2.3.0（仅 agent 改名）的简化方向，把**全仓所有** `tsb-` 前缀统一为 `t-`：

- **插件名** `tsb-erp-page` → **`t-erp-page`**（marketplace 标识 `tsb-erp-marketplace` → `t-erp-marketplace`）
- **Command** `/tsb-page-start` → **`/t-start`** · `/tsb-page-new-module` → **`/t-new-module`** · `/tsb-page-review` → **`/t-review`** · `/tsb-zentao-collect` → **`/t-zentao-collect`**
- **Skill 目录** `tsb-page-*` → `t-*`（如 `tsb-page-workflow` → `t-workflow`、`tsb-page-auth` → `t-auth`、`tsb-page` 内核 → `t-page`）；`tsb-zentao-automation` → `t-zentao`
- **rule 文件** `tsb-page-agent-guidance.mdc` → `t-agent-guidance.mdc`
- **mcp 包** `tsb-browser-mcp` → `t-browser-mcp`

**已安装用户需重装**（插件名变了）：

```powershell
.\scripts\install-local.ps1 -Uninstall   # 卸载旧的 tsb-erp-page
git pull                                  # 拉取最新代码
.\scripts\install-local.ps1              # 装 t-erp-page
```

完整旧名→新名映射表见 [CHANGELOG.md 2.4.0](CHANGELOG.md#240--2026-07-01)。功能完全保持：21 agent / 14 skill / 4 command / 职责划分 / 编排逻辑 / glob 匹配 / mcp 工具行为均未变（mcp 测试 42 全绿）。

**未改**：`skills/t-page/profiles.md` 画像表里的 ERP 项目自身 package.json name（`tsb-erp`/`tsb-hall-user`）——这是探测 ERP 项目的对照值，属 ERP 项目自身标识。

## 版本

见 [CHANGELOG.md](CHANGELOG.md) — 当前 **2.4.0**
