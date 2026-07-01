# 主 Agent 调度手册（多 Subagent 编排）

> 本文件教主 Agent **何时、按什么顺序、派哪些 subagent**。
> 编排模式：**skill 指引 + 主 Agent 调度**——主 Agent 读本文，用 Task/Agent 工具按需派发，不引入额外 orchestrator。

## 全景：21 个 Subagent 六组

| 组 | Agent | 何时用 |
|----|-------|--------|
| **侦察** | `t-scout` · `t-survey` | 任务前置，只读不写 |
| **模块并行** | `t-mod`（模板，运行时实例化） | 批量/跨模块同类任务：按大菜单扫描，每模块派一个实例并行，禁脚本 |
| **实现** | `t-api` · `t-col` · `t-type` · `t-view` · `t-dialog` · `t-style` · `t-route` · `t-oplog` · `t-auth` · `t-scaffold` · `t-i18n` | 写对应代码层，各写各文件可并行 |
| **共享/修复** | `t-shared` | 改跨模块共享组件/utils/hook 时单点手术 + 同步所有引用方 |
| **审查** | `t-spec` · `t-i18n-check` · `t-code` | 实现后两阶段守门（规范符合 → 代码质量） |
| **验证** | `t-impact` · `t-registry` · `t-build` | Bug 后查漏 / 新模块登记 / 实跑构建 |

详见各 agent 定义：[../../agents/](../../agents/)

## 责任边界速查（防重叠）

| 维度 | 归属 agent |
|------|-----------|
| 探测 ts/th 项目 | 每个 agent 开工自读 profiles（不归 scout 独家） |
| 改哪里（主单/详情范围） | `t-scout`（**只定范围**） |
| 波及哪里（兄弟页/Tab/共享件引用） | `t-impact`（**唯一影响扫描者**） |
| 写 locales（zh/en） | `t-i18n`（**唯一写入者**，其他人只 `t('key')` 引用） |
| 改跨模块共享组件 | `t-shared`（**唯一共享件写入者**） |
| 实跑 vue-tsc/eslint/build | `t-build`（**唯一真跑者**） |
| 审范围/六处命名/职责串味 | `t-spec`（第一阶段） |
| 审 virtualYConfig/列宽/import/lint | `t-code`（第二阶段，不重复第一阶段） |

## 调度矩阵（任务类型 → 派谁）

### 典型场景 1：小改（改列宽 / 改文案 / 改样式）

```
scout（定范围）→ impact-surveyor（拉影响）→ 对应 1 个实现 agent → spec-reviewer（第1阶段）
```
例：改列宽 = `scout` + `impact-surveyor` + `column-crafter` + `spec-reviewer`
例：改文案 = `scout` + `impact-surveyor` + `i18n-author` + `i18n-checker`

### 典型场景 2：新建模块（最大链路）

```
scout（定范围） → surveyor（测绘标准页）
  → impact-surveyor（拉影响：同模块兄弟页/共享件引用）
  → scaffolder（总装，内部调度实现 agent：api/column/type/view/dialog/style/route/oplog/auth/i18n-author）
  → spec-reviewer（第1阶段，含六处一致） ∥ i18n-checker（第1阶段并行）
  → code-reviewer（第2阶段+终审）
  → registry-updater（登记）
  → build-validator（实跑 vue-tsc/eslint/冒烟）
```
注：`∥` 表示可并行。scaffolder 是实现组的"总装"，其余实现 agent 受它或主 Agent 调度。

### 典型场景 3：修 Bug

```
scout（定位根因范围）→ impact-surveyor（拉影响 + Bug 后查漏）
  → 对应实现 agent（修）
  → impact-surveyor（改完查兄弟页/Tab 漏改、columns↔type 字段、zh/en 同步）
  → code-reviewer
```

### 典型场景 4：全模块同类任务（批量）

```
扫菜单(ls src/views/) → 确定涉及 N 个模块
  → 并行派 N 个 t-mod 实例（采购/销售/跟单/客户…各一）
      每个实例：锁自己模块目录 → AI 逐文件读改 → 汇报
      新模块任务：实例内部调 t-scaffold 做总装
      共享组件跨模块：实例不自改，报告主 Agent
  → 收齐 → t-spec（规范）+ t-impact（跨模块漏改/共享组件）
  → t-build（实跑全量构建验证）
```

> `t-mod` 是模板：1 个文件，运行时按模块名实例化。模块增删不用改文件。

### 典型场景 5：改共享组件（跨模块影响）

```
触发：module-agent / impact-surveyor 报告"共享件被多模块引用"，或用户明确说改公共组件
  → impact-surveyor（先扫全引用）
  → t-shared（单点改 + 同步所有调用方）
  → impact-surveyor（改完复核所有引用点）
  → code-reviewer + build-validator（破坏性改动必跑实跑验证）
```

## 任务规模 → 默认 agent 套餐（速查）

| 规模 | 场景 | 套餐 | 数量 |
|------|------|------|------|
| **小** | 改列宽/文案/单字段 | scout + impact + 1 实现 + spec | 3-4 |
| **中** | 改弹窗加字段/补 OP_HEADERS/改 hook | scout + impact + surveyor + 1-2 实现 + spec + i18n-checker + code | 6-7 |
| **大** | 新模块 | 全链路（除 module-agent） | 11-12 |
| **批量** | 全模块同类/多模块新页 | 上述 + N 个 module-agent 实例 | 12+ |
| **共享件** | 改 Th*/utils/hook | impact + surgeon + code + build | 4 |

## 派发规则

1. **侦察先行**：任何写操作前先派 `t-scout`（定范围）+ `t-impact`（拉影响）
2. **实现可并行**：实现组各 agent 写不同文件，无冲突时可并行派发（api/column/type 互不依赖）
3. **审查两阶段不跳**：spec-reviewer 先（规范符合+六处一致），通过后 code-reviewer（运行时质量）。i18n-checker 可与 spec 并行
4. **机器验证收尾**：code-reviewer 通过后派 build-validator 实跑 vue-tsc/eslint（终审必跑）
5. **影响核查按需**：Bug 必跑 `impact-surveyor`；新模块必跑 `registry-updater`；共享件改动 surgeon 前后各跑 `impact-surveyor`
6. **不每次全用 21 个**：按任务规模选子集，小改 3-4 个，大改全链路 11-12 个

## 模块并行拆解（批量任务 / 全模块任务 / 同类多模块任务）

**核心原则：禁脚本。任何跨多模块的批量/同类任务，一律按业务模块拆成多个 `t-mod` 实例并行处理，AI 逐文件读着改，绝不写脚本批量替换。**

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
3. **每模块派一个 `t-mod` 实例**并行，各锁自己目录：
   - 采购模块实例 → 只动 `src/views/tsProcurementManagement/`
   - 销售模块实例 → 只动 `src/views/tsSalesManagement/`
   - 跟单模块实例 → 只动 `src/views/tsDocumentaryManagement/`
   - ……（按实际模块派）
4. **收齐结果**：各实例只改自己模块、互不干扰；遇共享组件被多模块引用 → 实例报告，主 Agent 改派 `t-shared` 统一裁决
5. **统一审查**：模块实例产出后，主 Agent 跑 t-spec + t-impact（跨模块审查者）+ t-build（实跑全量构建）

## 禁止（红线）

- ❌ **写任何脚本处理 ERP 代码**（sed/awk/grep 批量替换、.ps1/.sh/.mjs/.py 批处理）—— 跨多文件任务一律按模块拆 subagent 并行，AI 逐文件读改
- ❌ **为了"省事"写一次性脚本**（哪怕说"就这一次"）—— 禁令无例外
- 跳过侦察直接写（除非用户说"直接改"且范围已明确）
- 跳过审查阶段（spec → code 两阶段不可跳）
- 跳过 build-validator（终审必实跑，不凭 code-reviewer 静态判断"应该没问题"）
- 并行派多个写同一文件的 agent（冲突）
- 让多个 agent 抢写 locales（只 `t-i18n` 写）
- 让多个 module-agent 实例各改共享组件（只 `t-shared` 改）
- 用 subagent 做 AskQuestion 决策（决策归主 Agent，subagent 只执行明确任务）

## subagent 上下文供给

派发 subagent 时，主 Agent 须提供（subagent-driven-development 模式）：
- 当前项目画像（从 [profiles.md](profiles.md) 探测结果）
- 任务完整文本（不让 subagent 自己猜）
- 约束（只改哪些文件、不改什么）
- 期望输出格式

每个 subagent 开工前自读 [anchors.md](anchors.md) + [profiles.md](profiles.md)，主 Agent 不必重复粘贴全文。
