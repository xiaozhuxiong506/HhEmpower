# 主 Agent 调度手册（多 Subagent 编排）

> 本文件教主 Agent **何时、按什么顺序、派哪些 subagent**。
> 编排模式：**skill 指引 + 主 Agent 调度**——主 Agent 读本文，用 Task/Agent 工具按需派发，不引入额外 orchestrator。

## 全景：18 个 Subagent 五组

| 组 | Agent | 何时用 |
|----|-------|--------|
| **侦察** | `tsb-page-scout` · `tsb-page-surveyor` | 任务前置，只读不写 |
| **模块并行** | `tsb-module-agent`（模板，运行时实例化） | 批量/跨模块同类任务：按大菜单扫描，每模块派一个实例并行，禁脚本 |
| **实现** | `tsb-api-builder` · `tsb-column-crafter` · `tsb-type-author` · `tsb-view-assembler` · `tsb-dialog-builder` · `tsb-stylist` · `tsb-route-registrar` · `tsb-oplog-registrar` · `tsb-auth-registrar` · `tsb-scaffolder` | 写对应代码层，各写各文件可并行 |
| **审查** | `tsb-spec-reviewer` · `tsb-i18n-checker` · `tsb-code-reviewer` | 实现后两阶段守门 |
| **验证** | `tsb-impact-surveyor` · `tsb-registry-updater` | Bug 后 / 新模块后收尾 |

详见各 agent 定义：[../../agents/](../../agents/)

## 调度矩阵（任务类型 → 派谁）

### 典型场景 1：小改（改列宽 / 改文案 / 改样式）

```
scout（侦察范围）→ 对应 1 个实现 agent → spec-reviewer（第1阶段审查）
```
例：改列宽 = `scout` + `column-crafter` + `spec-reviewer`

### 典型场景 2：新建模块（最大链路）

```
scout → surveyor（测绘标准页）
  → scaffolder（总装，内部可调度 9 个实现 agent：api/column/type/view/dialog/style/route/oplog/auth）
  → spec-reviewer（第1阶段） ∥ i18n-checker（第1阶段并行）
  → code-reviewer（第2阶段+终审）
  → registry-updater（登记）
```
注：`∥` 表示可并行。scaffolder 是实现组的"总装"，其余 9 个实现 agent 受它或主 Agent 调度。

### 典型场景 3：修 Bug

```
scout（定位根因+影响范围）→ 对应实现 agent（修）→ impact-surveyor（查兄弟页/Tab漏改）→ code-reviewer
```

## 派发规则

1. **侦察先行**：任何写操作前先派 `tsb-page-scout`（探测项目、定范围、拉影响清单）
2. **实现可并行**：实现组各 agent 写不同文件，无冲突时可并行派发（api/column/type 互不依赖）
3. **审查两阶段不跳**：spec-reviewer 先（规范符合），通过后 code-reviewer（质量）。i18n-checker 可与 spec 并行
4. **验证按需**：Bug 必跑 `impact-surveyor`；新模块必跑 `registry-updater`
5. **不每次全用 18 个**：按任务规模选子集，小改 3 个，大改全链路

## 模块并行拆解（批量任务 / 全模块任务 / 同类多模块任务）

**核心原则：禁脚本。任何跨多模块的批量/同类任务，一律按业务模块拆成多个 `tsb-module-agent` 实例并行处理，AI 逐文件读着改，绝不写脚本批量替换。**

### 何时必须模块拆解

| 任务特征 | 例 | 做法 |
|---------|----|------|
| 跨多模块同类改动 | "所有列表页补 OP_HEADERS" | 扫菜单 → 每个有列表页的模块派一个实例 |
| 全模块规范升级 | "采购+销售+跟单都加某功能" | 每个点名模块派一个实例 |
| Bug 散布多模块 | "这个 bug 各模块同位置都有" | 每个可能有该 Bug 的模块派一个实例 |
| 大菜单级重构 | "统一所有模块导出写法" | 每模块一个实例 |

### 拆解流程（主 Agent 必做）

1. **扫描大菜单**：`ls src/views/` 列出所有业务模块（一级目录 = 模块）
2. **判定涉及哪些模块**：按任务范围圈定（点名模块照办；"所有"则全扫）
3. **每模块派一个 `tsb-module-agent` 实例**并行，各锁自己目录：
   - 采购模块实例 → 只动 `src/views/tsProcurementManagement/`
   - 销售模块实例 → 只动 `src/views/tsSalesManagement/`
   - 跟单模块实例 → 只动 `src/views/tsDocumentaryManagement/`
   - ……（按实际模块派）
4. **收齐结果**：各实例只改自己模块、互不干扰；遇共享组件被多模块引用 → 实例报告，主 Agent 统一裁决
5. **统一审查**：模块实例产出后，主 Agent 跑 tsb-spec-reviewer + tsb-impact-surveyor（跨模块审查者）

### 典型场景 4：全模块同类任务

```
扫菜单(ls src/views/) → 确定涉及 N 个模块
  → 并行派 N 个 tsb-module-agent 实例（采购/销售/跟单/客户…各一）
      每个实例：锁自己模块目录 → AI 逐文件读改 → 汇报
  → 收齐 → tsb-spec-reviewer（规范）+ tsb-impact-surveyor（跨模块漏改/共享组件）
```

> `tsb-module-agent` 是模板：1 个文件，运行时按模块名实例化。模块增删不用改文件。

## 禁止（红线）

- ❌ **写任何脚本处理 ERP 代码**（sed/awk/grep 批量替换、.ps1/.sh/.mjs/.py 批处理）—— 跨多文件任务一律按模块拆 subagent 并行，AI 逐文件读改
- ❌ **为了"省事"写一次性脚本**（哪怕说"就这一次"）—— 禁令无例外
- 跳过侦察直接写（除非用户说"直接改"且范围已明确）
- 跳过审查阶段
- 并行派多个写同一文件的 agent（冲突）
- 用 subagent 做 AskQuestion 决策（决策归主 Agent，subagent 只执行明确任务）

## subagent 上下文供给

派发 subagent 时，主 Agent 须提供（subagent-driven-development 模式）：
- 当前项目画像（从 [profiles.md](profiles.md) 探测结果）
- 任务完整文本（不让 subagent 自己猜）
- 约束（只改哪些文件、不改什么）
- 期望输出格式

每个 subagent 开工前自读 [anchors.md](anchors.md) + [profiles.md](profiles.md)，主 Agent 不必重复粘贴全文。
