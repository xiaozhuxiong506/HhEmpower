# Tsb ERP · 页面开发（Cursor Plugin）

Tsb ERP 业务页 Agent 开发规范插件。**同时覆盖两个项目**：

- **Tsb.TradeErp.PC**（`src/views/ts*` — 采购/物料/跟单等）
- **Tsb.HallErpTenant.PC**（`src/views/th*` — 客户/择样/摊位/CRM 等）

插件目录：`D:\company\HhEmpower`（Marketplace 名：`tsb-erp-page`）

## 内容

- **12 个 Skills** — `tsb-page` 内核（profiles/anchors/orchestration/naming）+ workflow + 列表/详情/弹窗等子 Skill
- **18 个 Subagent** — 侦察(2) + 模块并行(1模板) + 实现(10) + 审查(3) + 验证(2)，多 agent 并行编排，**禁脚本**
- **1 条 Rule** — 编辑 `src/views/{ts,th}*/**` 时自动应用指引（自动探测 ts/th）
- **3 个 Command** — `/tsb-page-start` · `/tsb-page-new-module` · `/tsb-page-review`

## 核心特性

### 双项目自动适配

插件不硬编码任何项目特定路径。Agent 进入任务时**自动探测**当前项目（读 package.json / 扫 views 前缀），按 [skills/tsb-page/profiles.md](skills/tsb-page/profiles.md) 的画像表套用对应列（标准页、OP_HEADERS 形态、API 文件、locales 命名空间）。

- TradeErp：标准页 `tsMaterialOrdering`，OP_HEADERS 形态 `OP_HEADERS[页名][动作]`
- HallErp：标准页 `thCustomerInfo`，OP_HEADERS 形态 `OP_HEADERS[PAGE{N}][AUTH{N}]`

### 多 Subagent 编排

主 Agent 读 [skills/tsb-page/orchestration.md](skills/tsb-page/orchestration.md) 学会调度，按任务类型选 subagent 子集（非每次全用 17 个）：

| 组 | Agent | 职责 |
|----|-------|------|
| 侦察 | `tsb-page-scout` · `tsb-page-surveyor` | 探测项目、定位范围、测绘标准页（只读） |
| 模块并行 | `tsb-module-agent`（模板，运行时实例化） | 批量/跨模块任务：按大菜单扫描，每模块派一个实例并行，禁脚本 |
| 实现 | `tsb-api-builder` · `tsb-column-crafter` · `tsb-type-author` · `tsb-view-assembler` · `tsb-dialog-builder` · `tsb-stylist` · `tsb-route-registrar` · `tsb-oplog-registrar` · `tsb-auth-registrar` · `tsb-scaffolder` | 按代码层并行写（各写各文件） |
| 审查 | `tsb-spec-reviewer` · `tsb-i18n-checker` · `tsb-code-reviewer` | 两阶段守门（规范符合 → 代码质量） |
| 验证 | `tsb-impact-surveyor` · `tsb-registry-updater` | Bug 后查漏改 / 新模块后登记 |

## 本地安装

```powershell
cd D:\company\HhEmpower
.\scripts\install-local.ps1
```

脚本会在 `%USERPROFILE%\.cursor\plugins\local\tsb-erp-page` 创建符号链接。完成后：

1. 重启 Cursor（或重新打开窗口）
2. **Settings → Customize → Plugins**，确认 **tsb-erp-page** 已启用
3. 输入 `/tsb-page-start` 测试

### 手动安装

```powershell
$target = "D:\company\HhEmpower"
$link   = "$env:USERPROFILE\.cursor\plugins\local\tsb-erp-page"
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

源文件可在 `Tsb.TradeErp.PC\.cursor\skills\tsb-page*`，改完后：

```powershell
.\scripts\sync-skills.ps1 -SourceRoot "D:\company\Tsb.TradeErp.PC\.cursor\skills"
```

## 插件结构

```
HhEmpower/
├── .cursor-plugin/plugin.json
├── agents/                  ← 18 个 subagent（侦察/模块并行/实现/审查/验证五组）
├── commands/                ← /tsb-page-start · /tsb-page-new-module · /tsb-page-review
├── rules/tsb-page-agent-guidance.mdc   ← glob 匹配 src/views/{ts,th}*/**/**
├── scripts/                 ← install-local · sync-skills · export-github-repo
├── skills/
│   ├── tsb-page/            ← 内核（SKILL + anchors + profiles + orchestration + naming）
│   ├── tsb-page-workflow/   ← 改动工作流 + 必问单选题
│   ├── tsb-page-{list,detail,dialog,module,standards}/
│   ├── tsb-page-{auth,operation-log,field-setting,tab-editability,registry}/
│   └── README.md
├── CHANGELOG.md
└── README.md
```

## 与项目 `.cursor/skills` 的关系

| 位置 | 用途 |
|------|------|
| `Tsb.TradeErp.PC\.cursor\skills\` 或 `Tsb.HallErpTenant.PC\.cursor\skills\` | 可选：项目内 Skill 源 |
| `HhEmpower\skills\` | 插件分发副本（本目录） |
| `rules/tsb-page-agent-guidance.mdc` | 编辑 ts/th 页时自动加载 |

启用插件后 Skills 随 Cursor 用户级加载；Rule 仅在匹配 `src/views/{ts,th}*/**` 时生效。

## 从 1.x 迁移（v2.0.0）

- 插件名 `trade-erp-ts-page` → **`tsb-erp-page`**
- 命令 `/ts-page-*` → **`/tsb-page-*`**
- Skill `ts-page-*` → **`tsb-page-*`**
- 现在同时支持 **TradeErp(ts*)** 和 **HallErp(th*)**，自动探测
- 新增 **18 个 subagent** 多 agent 编排 + 模块并行拆解（详见 [skills/tsb-page/orchestration.md](skills/tsb-page/orchestration.md)）

## 版本

见 [CHANGELOG.md](CHANGELOG.md) — 当前 **2.0.0**
