# Changelog

## 2.0.0 — 2026-06-26

### 重大变更（不向后兼容）

- 插件名 `trade-erp-ts-page` → **`tsb-erp-page`**
- 所有 Skill/Command/Agent 前缀 `ts-page-*` → **`tsb-page-*`**
- 命令 `/ts-page-*` → **`/tsb-page-*`**（旧名移除，见 README 迁移说明）
- Rule glob `src/views/ts*/**` → **`src/views/{ts,th}*/**/**`**

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
