# Tsb ERP（Cursor Plugin）

Tsb ERP 业务页 Agent 开发规范插件。**同时覆盖两个项目**，并统一约束业务闭环、责任审计、权限等同用户、接口字段零偏差和禁脚本红线：

- **Tsb.TradeErp.PC**（`src/views/ts*` — 采购/物料/跟单等）
- **Tsb.HallErpTenant.PC**（`src/views/th*` — 客户/择样/摊位/CRM 等）

插件目录：`D:\company\HhEmpower`（Marketplace 名：`t-erp-page`）

## 内容

- **14 个 Skills** — `t-page` 内核（profiles/anchors/orchestration/naming）+ `t-clarify`（需求澄清关卡）+ workflow + 列表/详情/弹窗等子 Skill
- **21 个 Subagent** — 侦察(2) + 模块并行(1模板) + 实现(11) + 共享/修复(1) + 审查(3) + 验证(3)，多 agent 并行编排，**禁脚本**
- **1 条 Rule** — 编辑 `src/views/{ts,th}*/**` 时自动应用指引（自动探测 ts/th）
- **4 个 Command** — `/t-start` · `/t-new-module` · `/t-review` · `/t-zentao-collect`
- **1 个插件内置 MCP** — Torna 接口文档只读检索 + 禅道任务采集和分组，保留原文事实源并生成带治理边界的 agentPlan

## 核心特性

### 双项目自动适配

插件不硬编码任何项目特定路径。Agent 进入任务时**自动探测**当前项目（读 package.json / 扫 views 前缀），按 [skills/t-page/profiles.md](skills/t-page/profiles.md) 的画像表套用对应列（标准页、OP_HEADERS 形态、API 文件、locales 命名空间）。

- TradeErp：标准页 `tsMaterialOrdering`，OP_HEADERS 形态 `OP_HEADERS[页名][动作]`
- HallErp：标准页 `thCustomerInfo`，OP_HEADERS 形态 `OP_HEADERS[PAGE{N}][AUTH{N}]`

### ERP 治理红线

所有 Skills、Commands、Rules、MCP、Scripts、Agents 统一继承 [skills/t-page/anchors.md](skills/t-page/anchors.md)：业务操作按存在跨模块闭环风险处理；AI 不替用户做业务/权限/上线批准；AI、MCP、接口工具和调试账号不得绕过人类用户权限；接口字段、输入值域和长度规则零偏差；禁止脚本批量改 ERP 业务代码。

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

### 插件内置 MCP

`t-browser-mcp` 随 `t-erp-page` 一起安装，自动提供 Torna 和禅道工具。普通用户无需拥有 `D:\company\HhEmpower`，无需运行 `install-mcp.ps1`，也无需修改用户级 `~/.cursor/mcp.json` 或执行 `npm install`。

从旧版本升级且曾运行过 `install-mcp.ps1` 时，应先删除全局 `t-browser-mcp` 注册，避免与插件内置 MCP 重复启动。插件安装后在 **Settings -> Tools & MCP** 中确认只存在一个 `t-browser-mcp`。

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

源文件可在 `Tsb.TradeErp.PC\.cursor\` 或 `Tsb.HallErpTenant.PC\.cursor\`，改完后同步插件资料：

```powershell
.\scripts\sync-skills.ps1 -SourceRoot "D:\company\Tsb.TradeErp.PC\.cursor"
```

## 插件结构

```
HhEmpower/
├── .cursor-plugin/plugin.json
├── agents/                  ← 21 个 subagent（侦察/模块并行/实现/共享/审查/验证六组）
├── commands/                ← /t-start · /t-new-module · /t-review · /t-zentao-collect
├── mcp/                     ← Torna 接口文档 + 禅道任务的插件内置 MCP
├── rules/t-agent-guidance.mdc   ← glob 匹配 src/views/{ts,th}*/**/**
├── scripts/                 ← install-local · sync-skills · export-github-repo
├── skills/
│   ├── t-page/            ← 内核（SKILL + anchors + profiles + orchestration + naming）
│   ├── t-workflow/   ← 改动工作流 + 必问单选题
│   ├── t-{list,detail,dialog,module,standards}/
│   ├── t-{auth,oplog,field,tab,registry}/
│   └── README.md
├── CHANGELOG.md
└── README.md
```

## 与项目 `.cursor` 的关系

| 位置 | 用途 |
|------|------|
| `Tsb.TradeErp.PC\.cursor\` 或 `Tsb.HallErpTenant.PC\.cursor\` | 可选：项目内 Skills/Commands/Rules/Agents/MCP/Scripts 源 |
| `HhEmpower\` | 插件分发副本（本仓库） |
| `rules/t-agent-guidance.mdc` | 编辑 ts/th 页时自动加载 |

启用插件后 Skills 随 Cursor 用户级加载；Rule 仅在匹配 `src/views/{ts,th}*/**` 时生效。

## 命名与项目探测

- 插件、Skill、Command、Agent、Rule 与 MCP 技术标识统一使用 `t-*`。
- 插件同时支持 **TradeErp(ts*)** 和 **HallErp(th*)**，按 [profiles.md](skills/t-page/profiles.md) 自动探测。
- `tsb-erp` 与 `tsb-hall-user` 是 ERP 项目自身的 `package.json` 探测值，不属于插件技术命名。
- 旧版本安装可先运行 `.\scripts\install-local.ps1 -Uninstall`，再运行 `.\scripts\install-local.ps1` 安装当前插件。

## 版本

见 [CHANGELOG.md](CHANGELOG.md) — 当前 **2.7.1**
