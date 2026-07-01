# Changelog

## 2.4.0 — 2026-07-01

### 全仓命名统一为 `t-` 前缀（agent + skill + command + 插件名 + mcp 包名）

延续 2.3.0（仅 agent 改名）的简化方向，把**所有** `tsb-` 前缀统一为 `t-`，与 agent 对齐。这是破坏性大改：已安装用户需重装插件（插件名变了）。

**插件 / mcp / rule 重命名**

| 旧名                                    | 新名                   |
| --------------------------------------- | ---------------------- |
| 插件 `tsb-erp-page`                     | `t-erp-page`           |
| Marketplace `tsb-erp-marketplace`       | `t-erp-marketplace`    |
| mcp 包 `tsb-browser-mcp`                | `t-browser-mcp`        |
| rule 文件 `tsb-page-agent-guidance.mdc` | `t-agent-guidance.mdc` |

**Skill 目录重命名（14 个）**

| 旧名                       | 新名          |
| -------------------------- | ------------- |
| `tsb-page`                 | `t-page`      |
| `tsb-page-workflow`        | `t-workflow`  |
| `tsb-page-list`            | `t-list`      |
| `tsb-page-detail`          | `t-detail`    |
| `tsb-page-dialog`          | `t-dialog`    |
| `tsb-page-module`          | `t-module`    |
| `tsb-page-standards`       | `t-standards` |
| `tsb-page-auth`            | `t-auth`      |
| `tsb-page-operation-log`   | `t-oplog`     |
| `tsb-page-registry`        | `t-registry`  |
| `tsb-page-field-setting`   | `t-field`     |
| `tsb-page-tab-editability` | `t-tab`       |
| `tsb-zentao-automation`    | `t-zentao`    |

> 注：`t-auth`/`t-dialog`/`t-oplog`/`t-registry` 这 4 个 skill 与同名 agent 共享标识（agent 在 `agents/`，skill 在 `skills/`）。AI 通过上下文区分（"派 agent" vs "读 skill 规范"），不产生功能冲突。

**Command 重命名（4 个）**

| 旧名                   | 新名                |
| ---------------------- | ------------------- |
| `/tsb-page-start`      | `/t-start`          |
| `/tsb-page-new-module` | `/t-new-module`     |
| `/tsb-page-review`     | `/t-review`         |
| `/tsb-zentao-collect`  | `/t-zentao-collect` |

**内容引用同步**：agents / skills / commands / rules / scripts / mcp / README / PUBLISH / plugin.json / marketplace.json 共 56 文件 480 处引用一次性同步；install-local.ps1 安装路径、rule glob 引用、orchestration 调度矩阵全部跟进。

**未改（刻意保留）**：

- `skills/t-page/profiles.md` 画像表里的 ERP 项目自身 package.json name（`tsb-erp` / `tsb-hall-user`）——这是插件探测 ERP 项目的对照值，属 ERP 项目自身标识，不归插件命名范围
- `mcp/package-lock.json`（npm 自动管理）
- 本文件 2.0.0–2.3.0 历史条目（保留历史脉络）
- `docs/superpowers/*` 历史快照

**功能完全保持**：mcp 测试 42 全绿；agent / skill / command / rule 数量、职责划分、编排逻辑、glob 匹配、调度矩阵均未变。

**迁移方式**：

1. 卸载旧插件：`.\scripts\install-local.ps1 -Uninstall`
2. pull 最新代码
3. 重装：`.\scripts\install-local.ps1`
4. 重启 Cursor
5. 命令改用新名（`/t-start`、`/t-new-module`、`/t-review`、`/t-zentao-collect`）

## 2.3.0 — 2026-07-01

### Agent 文件名缩短（`tsb-` → `t-`，提升可调用性）

为降低主 Agent 手输/调度 agent 时的名字长度，21 个 subagent 的**文件名与调用名**统一从 `tsb-*` 缩短为 `t-*`。**Skill 名（`tsb-page-*`）、Command 名（`/tsb-page-*`）、插件名（`tsb-erp-page`）不变**（它们靠 Read / glob 触发，不靠手输）。

**完整映射表（旧名 → 新名）**

| 旧名                    | 新名         |
| ----------------------- | ------------ |
| tsb-page-scout          | t-scout      |
| tsb-page-surveyor       | t-survey     |
| tsb-module-agent        | t-mod        |
| tsb-scaffolder          | t-scaffold   |
| tsb-api-builder         | t-api        |
| tsb-column-crafter      | t-col        |
| tsb-type-author         | t-type       |
| tsb-view-assembler      | t-view       |
| tsb-dialog-builder      | t-dialog     |
| tsb-stylist             | t-style      |
| tsb-route-registrar     | t-route      |
| tsb-auth-registrar      | t-auth       |
| tsb-spec-reviewer       | t-spec       |
| tsb-code-reviewer       | t-code       |
| tsb-i18n-author         | t-i18n       |
| tsb-i18n-checker        | t-i18n-check |
| tsb-shared-comp-surgeon | t-shared     |
| tsb-build-validator     | t-build      |
| tsb-impact-surveyor     | t-impact     |
| tsb-registry-updater    | t-registry   |
| tsb-oplog-registrar     | t-oplog      |

**功能完全保持**：plugin.json 按目录注册 agent（`"agents": "./agents/"`），重命名不影响加载；agent frontmatter `name`、正文标题、skills/commands/rules 引用、mcp 代码（zentaoAnalyzer 派发的实例名 `t-mod-${模块}`）全部同步。mcp 测试 42 个全绿。

**迁移方式**：调用 agent 一律改用新名（如 `t-scout`、`t-mod`、`t-i18n`）。旧调用名不再生效。

## 2.2.0 — 2026-07-01

### 责任划分精细化（21 subagent 六组）

**新增 3 个 agent（填真空）**

- `tsb-i18n-author` — locales 唯一写入者。原 zh/en 散落在 view-assembler / dialog-builder / scaffolder 多手写，现统一集中。与 `tsb-i18n-checker`（审）构成"一写一审"对称
- `tsb-shared-comp-surgeon` — 跨模块共享组件/utils/hook 的单点手术师。原 module-agent 实例发现共享件被多模块引用后"报告主 Agent"即止，无人接手；现由本 agent 单点改 + 同步所有引用方
- `tsb-build-validator` — 实跑 vue-tsc / eslint / 冒烟。原 code-reviewer 只"建议跑"，现终审环节真跑出报告

**调整 4 个 agent（修重叠 + 填真空）**

- `tsb-page-scout` — 减负。原身兼"扫兄弟页/Tab/共享件引用"与"定范围"两职，与 `tsb-impact-surveyor` 重叠。现**只定范围**（改哪里），影响扫描全移交 impact-surveyor（波及哪里）
- `tsb-impact-surveyor` — 强化。统一接管"任务前定影响 / Bug 后查漏 / 共享件改前扫引用"三时机；补 columns↔type 字段一致性核查
- `tsb-code-reviewer` — 删重复。原审查清单含"职责串味/详情 auth 从列表 import"，已被 `tsb-spec-reviewer` 覆盖，自相矛盾。现只审运行时正确性（virtualYConfig/列宽/import/lint），不碰范围/命名/职责
- `tsb-spec-reviewer` — 扩"六处一致"。原"五处命名一致"补第 6 处：`columns.field ↔ type.ts` 字段对齐（新需求高发，静态可审）

**明确 2 个 agent 嵌套关系**

- `tsb-module-agent` ↔ `tsb-scaffolder`：批量新模块场景下，module-agent 实例做并行外壳、实例内部调 scaffolder 做单模块总装（原两 agent 都声称负责、无优先级）

### 文档同步

- [orchestration.md](skills/tsb-page/orchestration.md) 全面重写：21 agent 六组 + 责任边界速查表（防重叠）+ 任务规模→默认套餐速查 + 新增"改共享组件"调度场景
- 五处→六处一致：[anchors.md](skills/tsb-page/anchors.md) · [naming.md](skills/tsb-page/naming.md) · [tsb-page-workflow](skills/tsb-page-workflow/SKILL.md) · spec-reviewer
- README / skills/README / rule / plugin.json / marketplace.json 计数全部同步（18→21、五组→六组）
- 新建模块链路补充 build-validator 收尾环节；scaffolder 的 i18n 步骤改为改派 i18n-author

## 2.1.0 — 2026-06-28

- 新增 `skills/tsb-zentao-automation/`（禅道自动化）与 `commands/tsb-zentao-collect.md`
- 新增 `mcp/`（browser-automation 配置）
- README 补充双项目分发说明

## 2.0.0 — 2026-06-26

### 重大变更（不向后兼容）

- 插件名 `trade-erp-ts-page` → **`tsb-erp-page`**
- 所有 Skill/Command/Agent 前缀 `ts-page-*` → **`tsb-page-*`**
- 命令 `/ts-page-*` → **`/tsb-page-*`**（旧名移除，见 README 迁移说明）
- Rule glob `src/views/ts*/**` → **`src/views/{ts,th}\*/**/**`**

### 新增

- **双项目支持**：同时覆盖 Tsb.TradeErp.PC（ts*）与 Tsb.HallErpTenant.PC（th*）
- **自动项目探测**：[skills/tsb-page/profiles.md](skills/tsb-page/profiles.md) 画像表 + 占位符替换，去全部硬编码
- **18 个 Subagent** 多 agent 编排 + 模块并行拆解（禁脚本）：
  - 侦察组：`tsb-page-scout` · `tsb-page-surveyor`
  - 模块并行组：`tsb-module-agent`（模板，运行时按大菜单实例化，每模块派一个并行，禁脚本）
  - 实现组：`tsb-api-builder` · `tsb-column-crafter` · `tsb-type-author` · `tsb-view-assembler` · `tsb-dialog-builder` · `tsb-stylist` · `tsb-route-registrar` · `tsb-oplog-registrar` · `tsb-auth-registrar` · `tsb-scaffolder`
  - 审查组：`tsb-spec-reviewer` · `tsb-i18n-checker` · `tsb-code-reviewer`（由旧 ts-page-code-reviewer 升级）
  - 验证组：`tsb-impact-surveyor` · `tsb-registry-updater`
- **共享内核** `skills/tsb-page/`：profiles（画像表）、anchors（ts/th 双列）、orchestration（调度矩阵）、naming（命名规则）、SKILL（总入口）
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
