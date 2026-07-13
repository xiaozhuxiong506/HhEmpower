# Tsb ERP（Cursor Plugin）

Tsb ERP 业务页 Agent 开发规范插件。**同时覆盖两个项目**，并统一约束业务闭环、责任审计、权限等同用户、接口字段零偏差和禁脚本红线：

- **Tsb.TradeErp.PC**（`src/views/ts*` — 采购/物料/跟单等）
- **Tsb.HallErpTenant.PC**（`src/views/th*` — 客户/择样/摊位/CRM 等）

插件目录：`D:\company\HhEmpower`（Marketplace 名：`t-erp-page`）

## 内容

- **16 个 Skills** — `t-page` 内核（profiles/anchors/orchestration/naming）+ `t-clarify`（需求澄清关卡）+ workflow + 列表/详情/弹窗等子 Skill + `t-api-docs` + `t-dingtalk`（钉钉聊天只读查询）
- **22 个 Subagent** — 原 ERP 侦察/实现/审查/验证体系 + `t-dingtalk` 只读检索员，多 agent 编排继续遵守**禁脚本**
- **2 条 Rule** — ERP 页面改动指引 + 钉钉聊天隐私边界
- **5 个 Command** — `/t-start` · `/t-new-module` · `/t-review` · `/t-zentao-collect` · `/t-dingtalk-read`
- **1 个插件内置 MCP** — Torna 接口文档、禅道任务和钉钉聊天记录只读能力

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

`t-browser-mcp` 随 `t-erp-page` 一起安装，自动提供 Torna、禅道和钉钉只读工具。普通用户无需拥有 `D:\company\HhEmpower`，无需运行 `install-mcp.ps1`，也无需修改用户级 `~/.cursor/mcp.json` 或执行 `npm install`。

钉钉能力内置官方 DWS `v1.0.51` 的 Windows/macOS/Linux 运行时。首次使用先调用 `dingtalk_auth_status`，未登录时调用 `dingtalk_auth_login` 并在钉钉官方页面完成 OAuth；企业管理员需要开启对应 CLI 访问权限。插件不接收密码、Cookie 或 Token，只读取当前授权用户有权访问的会话，且不把聊天记录写入项目或临时文件。

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
├── agents/                  ← 22 个 subagent（ERP 六组 + 钉钉只读检索）
├── commands/                ← /t-start · /t-new-module · /t-review · /t-zentao-collect · /t-dingtalk-read
├── mcp/                     ← Torna + 禅道 + 钉钉只读能力的插件内置 MCP
├── rules/                   ← ERP 页面指引 + 钉钉聊天隐私边界
├── scripts/                 ← install-local · sync-skills · export-github-repo
├── skills/
│   ├── t-page/            ← 内核（SKILL + anchors + profiles + orchestration + naming）
│   ├── t-workflow/   ← 改动工作流 + 必问单选题
│   ├── t-dingtalk/   ← 钉钉聊天记录只读查询
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

见 [CHANGELOG.md](CHANGELOG.md) — 当前 **2.8.0**
