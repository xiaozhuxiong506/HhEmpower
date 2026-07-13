# Changelog

## 2.8.0 — 2026-07-13

### 钉钉聊天记录只读接入

- 新增 `t-dingtalk` Skill、`/t-dingtalk-read` 命令、`t-dingtalk` Agent 和聊天隐私 Rule。
- `t-browser-mcp` 新增 OAuth 状态/登录、群聊检索、关键词消息检索、指定会话和全部会话读取六个工具。
- 插件内置钉钉官方 DWS `v1.0.51` 的 Windows、macOS、Linux x64/arm64 二进制与许可证，无需全局安装。
- DWS 调用使用固定参数数组和 `shell: false`，不开放发送、回复、撤回、转发、群管理或任意命令。
- 只读取当前 OAuth 用户有权访问的会话；多候选必须确认，聊天记录不落盘，禁止索取密码、Cookie 或 Token。
- 构建设置 `ignore-scripts=true`，不执行官方 npm 安装脚本，不向用户级 Skills 目录写入额外内容。

## 2.7.1 — 2026-07-13

### 插件技术标识统一

- MCP 环境变量统一为 `T_MCP_BROWSER_CHANNEL` 与 `T_MCP_PROFILE_DIR`。
- 禅道 Playwright profile 根目录统一为 `TBrowserMcp`；首次使用新目录时需要重新登录。
- README、Skill、历史设计和发布记录统一使用当前 `t-*` 技术名称。
- 新增命名回归测试，防止废弃技术前缀再次进入源码或文档。
- TSB 品牌、真实域名、ERP 项目名，以及项目探测值 `tsb-erp`、`tsb-hall-user` 保持不变。

## 2.7.0 — 2026-07-13

### Cursor 插件内置 Torna + 禅道 MCP

- 新增根 `mcp.json`，由插件 manifest 原生声明 `t-browser-mcp`。
- MCP 使用 `${CURSOR_PLUGIN_ROOT}` 从插件安装目录启动，不再依赖开发者本机路径。
- 新增可分发运行产物，内置 MCP SDK 与 Playwright 运行依赖；安装用户无需运行 `npm install`。
- Marketplace 导出前自动构建 MCP，包含运行产物并排除开发 `mcp/node_modules`。
- `install-mcp.ps1` 降级为开发兼容工具；正式用户只安装 `t-erp-page` 插件。
- Torna 与禅道工具名称、参数、登录方式、权限边界和业务行为保持不变。

## 2.6.0 — 2026-07-01

### 新增第五条红线「最小改动原则」—— 防范围外顺手改

填补了"明确点哪里只改哪里"这条边界真空。此前插件有"选定前不写代码"（第 4 条，管"什么时候开始写"），但缺"开始后改多少"的红线——AI 在改 A 时发现 B 有独立 bug/不规范/TODO，容易顺手一起改，导致 diff 膨胀、回归风险难定位。

**新增红线 #5**：最小改动原则（[anchors.md](skills/t-page/anchors.md) 五条红线）

核心规则：
- 用户指定的范围**只改指定范围**
- 发现的"顺手问题"（独立 bug / 不规范 / 可优化 / TODO）**禁止顺手改**，改列入「范围外发现」报告
- **例外**：改 A 导致 B 的 import/类型/调用断裂（编译不过）属本次范围，必须一并修（由 `t-impact` 管）

| 情形 | 是否允许改 | 处理方式 |
|------|-----------|---------|
| 改 A 导致 B 编译断裂 | ✅ 必须改 | 属本次范围 |
| 发现 B 有独立 bug / 不规范 / TODO | ❌ 禁止改 | 列入「范围外发现」报告 |

**实现 agent 完工时附「范围外发现」报告**：

```
【范围外发现】（本次未改，供你决策）
- src/views/.../xxx.vue:L45  存在独立 bug：空数组时 reduce 报错
- src/views/.../yyy.ts:L12   TS any 未收窄（规范问题）
```

**同步更新**：
- [anchors.md](skills/t-page/anchors.md) 四→五条红线 + 第 5 条执行细则表 + 报告格式
- [rules/t-agent-guidance.mdc](rules/t-agent-guidance.mdc) 红线清单加第 5 条
- [agents/t-spec.md](agents/t-spec.md) 范围审查加「范围外顺手改」检查项 + Critical 严重度增加违反最小改动
- 5 处"四条红线"→"五条红线"引用同步（t-page/SKILL、skills/README、profiles、t-spec、t-i18n-check）

**定位边界（防重叠）**：
- 第 4 条（选定前不写代码）= 管"什么时候开始写"
- 第 5 条（最小改动原则）= 管"开始后改多少"
- 二者配对，覆盖"范围确定前 → 确定 → 执行"全链路

**功能完全保持**：21 agent / skill / command / 编排逻辑均未变（非破坏性更新，无需重装插件）。

## 2.5.0 — 2026-07-01

### 新增 `t-clarify` Skill — 需求澄清前置关卡（硬卡停）

填补了「需求层模糊」这一真空。此前插件只在「范围不清」时有 `t-start` 的 AskUserQuestion 兜底，但对「那个页面优化下」「按上次那样改」这类**意图不清**的需求没有守门机制，AI 容易按自己解读一路跑到底、做完才发现方向错。

**新增 Skill**：[skills/t-clarify/SKILL.md](skills/t-clarify/SKILL.md)

核心机制：
- **信号词 → 澄清方向表（9 类）**：指代不明(那个) / 目标不明(优化下) / 参照不明(按上次) / 范围不明(加个查询) / 标准不明(随便) / 动作不明(处理一下) / 类比不明(像XX那样) / 现象不明(卡) / 故障不明(报错了)
- **澄清三问**：AskUserQuestion 一次发 1–3 个单选题，候选项必须具体（不敷衍"其他"），第一选项放 AI 最可能的解读（标注推荐）
- **硬卡停**：触发后用户答完前，禁止 Read 下游 Skill、禁止派 subagent、禁止出蓝图/写码/取 diff、禁止「我先按理解做」
- **放行条件**：主 Agent 用一句话复述确认，用户认可后把【已澄清需求】写入 context 头

**接入点（4 处 command 流程统一改造）**：

| Command | 插入位置 |
|---------|---------|
| `/t-start` | 探测项目之后、读 workflow 之前（第 2 步） |
| `/t-new-module` | 探测项目之后、读 module Skill 之前（第 2 步） |
| `/t-review` | 取 diff 之后、探测项目之前（第 2 步） |
| `/t-zentao-collect` | 禅道任务分组之后、派 `t-mod` 之前（command 第 7 步） |

**同步更新**：
- [t-page/SKILL.md](skills/t-page/SKILL.md) 路由表置顶新增 t-clarify 行（标为「最先读」）
- [t-page/orchestration.md](skills/t-page/orchestration.md) 头部新增「⚠️ 前置关卡」章节
- [rules/t-agent-guidance.mdc](rules/t-agent-guidance.mdc) 强制顺序加第 2 步
- [README.md](README.md) Skills 计数 13→14
- [skills/README.md](skills/README.md) 入口列表 + Skill 索引同步

**定位边界（防重叠）**：
- `t-clarify` 处理「意图不清=想达到什么效果」
- `t-start` 的 AskUserQuestion 处理「范围不清=改哪个文件」
- 二者不冲突，可串联使用

**功能完全保持**：21 agent / 六组职责划分 / 编排逻辑 / mcp 工具行为均未变（无需重装插件，非破坏性更新）。

## 2.4.0 — 2026-07-01

### 全仓技术命名统一为 `t-` 前缀

- 插件、Marketplace、MCP、Rule、14 个 Skill、4 个 Command 与 21 个 Agent 统一使用当前 `t-*` 名称。
- agents、skills、commands、rules、scripts、MCP、README、PUBLISH 和插件元数据中的引用同步更新。
- `t-auth`、`t-dialog`、`t-oplog`、`t-registry` 的同名 Skill 与 Agent 继续按目录和上下文区分。
- `skills/t-page/profiles.md` 中的 `tsb-erp` 与 `tsb-hall-user` 仍作为 ERP 项目自身探测值保留。
- 功能、职责划分、编排逻辑、glob 匹配和 MCP 工具行为保持不变；已安装用户需要重新安装插件。

## 2.3.0 — 2026-07-01

### Agent 文件名缩短，提升可调用性

- 21 个 subagent 使用 `t-scout`、`t-survey`、`t-mod`、`t-scaffold`、`t-api`、`t-col`、`t-type`、`t-view`、`t-dialog`、`t-style`、`t-route`、`t-auth`、`t-spec`、`t-code`、`t-i18n`、`t-i18n-check`、`t-shared`、`t-build`、`t-impact`、`t-registry`、`t-oplog`。
- Agent frontmatter、正文标题、Skill/Command/Rule 引用及禅道模块实例名同步更新，功能保持不变。

## 2.2.0 — 2026-07-01

### 责任划分精细化（21 subagent 六组）

**新增 3 个 agent（填真空）**

- `t-i18n` — locales 唯一写入者，与 `t-i18n-check` 构成一写一审。
- `t-shared` — 跨模块共享组件、utils、hook 的单点修改责任人。
- `t-build` — 实跑 vue-tsc、eslint 与冒烟验证并输出报告。

**调整 4 个 agent（修重叠 + 填真空）**

- `t-scout` 只负责确定修改范围，引用与波及扫描交给 `t-impact`。
- `t-impact` 统一负责任务前影响、Bug 后查漏和共享件改前引用扫描，并核查 `columns.field ↔ type.ts`。
- `t-code` 只审运行时正确性；`t-spec` 负责范围、命名、职责与六处一致性。

**明确 2 个 agent 嵌套关系**

- `t-mod` ↔ `t-scaffold`：批量新模块由模块实例并行，单模块总装交给 `t-scaffold`。

### 文档同步

- [orchestration.md](skills/t-page/orchestration.md) 全面重写：21 agent 六组、责任边界、任务规模套餐与共享组件调度场景。
- 五处扩展为六处一致：[anchors.md](skills/t-page/anchors.md)、[naming.md](skills/t-page/naming.md)、[t-workflow](skills/t-workflow/SKILL.md)、`t-spec`。
- README / skills/README / rule / plugin.json / marketplace.json 计数全部同步（18→21、五组→六组）
- 新建模块链路增加 `t-build` 收尾；`t-scaffold` 的 i18n 步骤改派 `t-i18n`。

## 2.1.0 — 2026-06-28

- 新增 `skills/t-zentao/`（禅道自动化）与 `commands/t-zentao-collect.md`
- 新增 `mcp/`（browser-automation 配置）
- README 补充双项目分发说明

## 2.0.0 — 2026-06-26

### 重大变更（不向后兼容）

- 插件技术命名完成第一次统一，并在后续版本收敛为当前 `t-*` 结构。
- Rule glob `src/views/ts*/**` → **`src/views/{ts,th}\*/**/**`**

### 新增

- **双项目支持**：同时覆盖 Tsb.TradeErp.PC（ts*）与 Tsb.HallErpTenant.PC（th*）
- **自动项目探测**：[skills/t-page/profiles.md](skills/t-page/profiles.md) 画像表 + 占位符替换，去全部硬编码
- **18 个 Subagent** 多 agent 编排 + 模块并行拆解（禁脚本）：
  - 侦察组：`t-scout` · `t-survey`
  - 模块并行组：`t-mod`
  - 实现组：`t-api` · `t-col` · `t-type` · `t-view` · `t-dialog` · `t-style` · `t-route` · `t-oplog` · `t-auth` · `t-scaffold`
  - 审查组：`t-spec` · `t-i18n-check` · `t-code`
  - 验证组：`t-impact` · `t-registry`
- **共享内核** `skills/t-page/`：profiles、anchors、orchestration、naming 与 SKILL 总入口。
- OP_HEADERS 区分 ts/th 形态（ts `[页名][动作]` / th `[PAGE{N}][AUTH{N}]`）

### 优化

- 全部 Skill 正文去硬编码：`tsMaterialOrdering` → `${标准页}`、`src/api/procerement.ts` → `${api文件}` 等
- HallErp 标准页 `thCustomerInfo` 写入 anchors（实测选定）
- 命名规则抽到内核 naming.md，改规范只改一处

## 1.1.0 — 2026-06-26

- 补全 `scripts/`（install-local、sync-skills、export-github-repo）
- 新增 `skills/ts-page/anchors.md`
- 新增 Agent `ts-page-code-reviewer`、Commands `/ts-page-new-module` `/ts-page-review`

## 1.0.0 — 初始版本

- 12 Skills + Rule + Command `/ts-page-start`（仅服务 Tsb.TradeErp.PC）
