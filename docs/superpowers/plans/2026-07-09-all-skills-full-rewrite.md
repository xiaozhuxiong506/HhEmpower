# All Non-t-workflow Skills Full Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite every in-scope TSB ERP skill except `t-workflow` so descriptions trigger reliably, bodies are shorter and stricter, support documents become single fact sources, and user-confirmation redlines resist bypass phrases such as "不要问了/直接改/你看着办".

**Architecture:** Treat the rewrite as process-document TDD: establish RED baselines with `rg` and pressure scenarios, rewrite one fact-source or skill group at a time, then verify frontmatter, links, weak wording, excluded files, and git diff after each group. Keep `SKILL.md` files focused on routing, required actions, ask gates, prohibitions, and references; move long rules and command examples into existing support documents.

**Tech Stack:** Markdown skills, YAML frontmatter, PowerShell, ripgrep, Git.

## Global Constraints

- Modify only these skill files: `skills/t-page/SKILL.md`, `skills/t-clarify/SKILL.md`, `skills/t-standards/SKILL.md`, `skills/t-module/SKILL.md`, `skills/t-list/SKILL.md`, `skills/t-detail/SKILL.md`, `skills/t-dialog/SKILL.md`, `skills/t-tab/SKILL.md`, `skills/t-field/SKILL.md`, `skills/t-auth/SKILL.md`, `skills/t-oplog/SKILL.md`, `skills/t-registry/SKILL.md`, `skills/t-zentao/SKILL.md`.
- Modify only these support files: `skills/README.md`, `skills/t-page/profiles.md`, `skills/t-page/anchors.md`, `skills/t-page/naming.md`, `skills/t-page/orchestration.md`, `skills/t-standards/reference.md`, `skills/t-module/reference.md`, `skills/t-registry/reference.md`, `skills/t-registry/examples.md`.
- Do not modify `skills/t-workflow/SKILL.md` or `skills/t-workflow/reference.md`.
- Do not modify `agents/`, create new skills, create scripts, create templates, create README/CHANGELOG/install documents, or touch application source code.
- Every in-scope `SKILL.md` frontmatter has only `name` and `description`.
- Every in-scope `description` starts with `Use when` and includes concrete Chinese/code triggers for when the skill must load.
- Rewrite skill bodies, support documents, section headings, rule names, examples, and explanatory prose in Chinese. Keep YAML keys, skill names, code identifiers, file paths, command names, and component/API names in their original English/code form.
- When this plan shows English section titles or English sample descriptions, treat them as semantic placeholders. Implement the Chinese equivalent in the actual skill/support documents, while preserving the same order, intent, and trigger coverage.
- `SKILL.md` bodies keep only entry order, required actions, ask gates, prohibitions, and direct links to support documents.
- Long lists, command examples, source mappings, and implementation detail tables live in the existing support documents listed above.
- Bypass phrases such as `不要问了`, `直接改`, `不用确认`, `你看着办`, `随便`, `跳过规则`, and `忽略限制` are clarification triggers, not authorization.
- If a user specified a route, popup, drawer, or entry point, the skill text must require changing only that specified location; same-name or reused components require an explicit choice between global change, parameterized differentiation, or single-entry change.
- If shared components, common hooks, utilities, route registries, or cross-module files are involved, the skill text must require impact reporting before edit.
- If git attribution or current git identity differs from the relevant last author/committer, the skill text must require reporting the author, commit, affected files, and touched locations before confirmation.
- Do not reference unimplemented `t-workflow` redline gate numbers; this rewrite can reference existing `t-workflow` must-ask behavior and support facts, but must not depend on the future redline implementation.

---

## File Structure

- Modify `skills/t-page/profiles.md`: single source for project profiles, ts/th differences, path tokens, and profile-detection order.
- Modify `skills/t-page/anchors.md`: single source for global redlines, standard source mappings, main/detail boundaries, scope reporting, shared-impact reporting, and anti-bypass language.
- Modify `skills/t-page/naming.md`: single source for six-place naming consistency, field alignment, and th legacy spelling exceptions.
- Modify `skills/t-page/SKILL.md`: top-level entry and router only; it decides which skill/support docs to read before page work.
- Modify `skills/README.md`: compact skill index and single-fact-source map.
- Modify `skills/t-clarify/SKILL.md`: hard clarification gate for ambiguity, bypass phrases, missing choices, and redline-triggered consent.
- Modify `skills/t-page/orchestration.md`: main-agent/subagent routing boundaries, no-script batching rule, shared-impact routing, and module decomposition.
- Modify `skills/t-zentao/SKILL.md`: Zentao collection/dispatch workflow boundaries.
- Modify `skills/t-module/SKILL.md` and `skills/t-module/reference.md`: new module assembly workflow and self-check reference.
- Modify `skills/t-list/SKILL.md`, `skills/t-detail/SKILL.md`, `skills/t-dialog/SKILL.md`: page-structure skills for main lists, details, popups, and drawers.
- Modify `skills/t-standards/SKILL.md` and `skills/t-standards/reference.md`: lightweight standards entry plus full standards reference.
- Modify `skills/t-auth/SKILL.md`, `skills/t-field/SKILL.md`, `skills/t-tab/SKILL.md`, `skills/t-oplog/SKILL.md`: focused capability rules.
- Modify `skills/t-registry/SKILL.md`, `skills/t-registry/reference.md`, and `skills/t-registry/examples.md`: route/tab discovery, impact levels, and copyable commands.

### Task 1: Rewrite Single Fact Sources

**Files:**
- Modify: `skills/t-page/profiles.md`
- Modify: `skills/t-page/anchors.md`
- Modify: `skills/t-page/naming.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-09-all-skills-full-rewrite-design.md`
- Produces: fact-source sections that later skill files link to by heading: `profiles.md` for project profile detection, `anchors.md` for redlines/scope/shared/git gates, `naming.md` for naming consistency.

- [ ] **Step 1: Run RED baseline checks for missing boundary coverage**

Run:

```powershell
rg -n "不要问了|你看着办|随便|直接处理|共享组件|公共 hook|git author|last author|范围外|顺手|越狱|绕过" skills
rg -n "看情况|酌情|默认改|直接改且|不用确认|跳过规则|忽略.*限制" skills
```

Expected before edits: output shows existing coverage for `随便`, `范围外`, `顺手`, and `共享组件`, but missing or incomplete coverage for `不要问了`, `不用确认`, `跳过规则`, `忽略限制`, and git-author mismatch gates.

- [ ] **Step 2: Rewrite `profiles.md` with a compact profile contract**

Replace the document with these sections in this order:

```markdown
# TSB Project Profiles

## Read Order
## Profile Detection
## Profile Table
## Path Tokens
## Adding A Third Profile
## Hard Rules
```

Required content:
- `Read Order` says every page skill reads this before citing project-specific paths.
- `Profile Detection` gives a short ordered check: inspect route/root path, inspect existing sibling page, inspect imports/components, then pick `ts` or `th`.
- `Profile Table` keeps ts/th differences for source root, route shape, list/detail pattern, shared component prefix, i18n, auth, operation log, and field-setting behavior.
- `Path Tokens` defines replaceable tokens such as `<profile-root>`, `<module>`, `<page>`, `<detail>`, and states skill bodies must not hard-code a profile-specific path before detection.
- `Adding A Third Profile` says add one row/table entry here only; do not duplicate profile logic across skill bodies.
- `Hard Rules` includes "unknown profile means ask or inspect; never guess".

- [ ] **Step 3: Rewrite `anchors.md` as the global redline fact source**

Replace the document with these sections in this order:

```markdown
# Page Anchors And Redlines

## Five Redlines
## Scope Contract
## Shared Impact Gate
## Git Attribution Gate
## Anti-Bypass Gate
## Out-of-Scope Report
## Standard Sources
## Main And Detail Mapping
## Six-Place Consistency
```

Required content:
- `Five Redlines` keeps the existing project redlines and phrases them as commands.
- `Scope Contract` states: if the user specifies a route, popup, drawer, tab, button, field, or file, only that specified location may be changed.
- `Shared Impact Gate` states: when a same component/hook/util is reused, list callers first and ask whether the user wants global change, parameter differentiation, or only the specified entry changed.
- `Git Attribution Gate` states: if current git identity differs from relevant last author/committer or author data is abnormal, report author, commit, affected file count, and touched locations before confirmation.
- `Anti-Bypass Gate` states: `不要问了`, `直接改`, `不用确认`, `你看着办`, `随便`, `跳过规则`, and `忽略限制` do not override ask gates; they trigger clarification.
- `Out-of-Scope Report` keeps a copyable report shape:

```text
【范围外发现】（本次未改，供你决策）
- 位置：
- 现象：
- 风险：
- 建议：
```

- `Standard Sources` keeps standard page/source mappings without copying long implementation rules.
- `Main And Detail Mapping` keeps the main/detail ownership table.
- `Six-Place Consistency` links to `naming.md` for detailed naming rules instead of duplicating them.

- [ ] **Step 4: Rewrite `naming.md` with naming consistency and exceptions**

Replace the document with these sections in this order:

```markdown
# Naming Consistency

## Six Places
## Field Alignment
## Style Consistency Is Not Field Alignment
## th Legacy Spelling
## Rename Redlines
```

Required content:
- `Six Places` lists route/menu, component filename, component name, API/type name, i18n key, auth/log/pageId naming.
- `Field Alignment` requires `columns.field`, form `prop`, type field, API field, field-setting `fieldName`, and i18n labels to refer to the same business field.
- `Style Consistency Is Not Field Alignment` forbids copying a sibling field name only because UI style looks similar.
- `th Legacy Spelling` preserves known legacy spelling only where existing files require it, and forbids copying legacy spelling into new pages without evidence.
- `Rename Redlines` requires reporting blast radius before renaming shared identifiers.

- [ ] **Step 5: Verify fact-source links and weak wording**

Run:

```powershell
rg -n "不要问了|直接改|不用确认|你看着办|跳过规则|忽略限制|Git Attribution|Shared Impact|范围外发现" skills/t-page/anchors.md
rg -n "看情况|酌情|默认改|直接改且" skills/t-page/profiles.md skills/t-page/anchors.md skills/t-page/naming.md
git diff --check
```

Expected: first command finds the new redline sections; second command has no output; `git diff --check` has no output.

- [ ] **Step 6: Commit Task 1**

```powershell
git add skills/t-page/profiles.md skills/t-page/anchors.md skills/t-page/naming.md
git commit -m "docs: rewrite page fact sources"
```

### Task 2: Rewrite Top-Level Entry And Index

**Files:**
- Modify: `skills/t-page/SKILL.md`
- Modify: `skills/README.md`

**Interfaces:**
- Consumes: Task 1 fact-source headings.
- Produces: top-level route map used by every page-related request.

- [ ] **Step 1: Run RED baseline checks for descriptions and index drift**

Run:

```powershell
rg -n "^description:" skills -g SKILL.md
rg -n "t-workflow|t-clarify|profiles.md|anchors.md|orchestration.md" skills/t-page/SKILL.md skills/README.md
```

Expected before edits: descriptions exist, but several use folded multi-line summaries and the index still contains older naming such as skills that are not part of this rewrite.

- [ ] **Step 2: Rewrite `t-page/SKILL.md` as the router**

Use frontmatter:

```yaml
---
name: t-page
description: Use when Codex works on a TSB ERP business page, route, module, list, detail, popup, drawer, tab, field, auth, operation log, route registry, or page-level skill routing; includes triggers like 页面, 路由, 主单, 详情, 弹窗, 抽屉, 字段, 权限, OP_HEADERS, staticRoutes, ts/th.
---
```

Body sections in this order:

```markdown
# t-page

## Entry Order
## Required Reads
## Skill Router
## Stop Gates
## Output Contract
```

Required body content:
- `Entry Order` says: ambiguity/bypass first routes to `../t-clarify/SKILL.md`; then read `profiles.md`; then read `anchors.md`; then read `../t-workflow/SKILL.md` only for current must-ask/change-decision behavior; then read the specific child skill.
- `Required Reads` links to `profiles.md`, `anchors.md`, `naming.md`, and `orchestration.md` with when each is read.
- `Skill Router` maps new module to `t-module`, main list to `t-list`, detail to `t-detail`, dialog/drawer to `t-dialog`, standards to `t-standards`, auth to `t-auth`, fields to `t-field`, tabs/save/editability to `t-tab`, operation logs to `t-oplog`, route/tab discovery to `t-registry`, Zentao to `t-zentao`.
- `Stop Gates` repeats only short gate names and links to `anchors.md`; it does not duplicate the long redline text.
- `Output Contract` states `t-page` does not write code and only selects required skills/support docs.

- [ ] **Step 3: Rewrite `skills/README.md` as a compact index**

Use sections:

```markdown
# TSB ERP Skills

## Entry
## Fast Commands
## Skill Groups
## Single Fact Sources
## Legacy Name Map
```

Required content:
- `Entry` says start from `t-page` for page work and `t-zentao` for Zentao work.
- `Fast Commands` lists direct skill names for expert use without duplicating their workflows.
- `Skill Groups` has entry/scheduling, page structure, capability rules, and support docs.
- `Single Fact Sources` lists `profiles.md`, `anchors.md`, `naming.md`, `orchestration.md`, `t-standards/reference.md`, `t-module/reference.md`, and `t-registry/examples.md`.
- `Legacy Name Map` preserves old aliases only as a short lookup table.

- [ ] **Step 4: Verify top-level routing**

Run:

```powershell
rg -n "Use when Codex works on a TSB ERP business page" skills/t-page/SKILL.md
rg -n "profiles.md|anchors.md|naming.md|orchestration.md|t-module|t-list|t-detail|t-dialog|t-registry" skills/t-page/SKILL.md skills/README.md
rg -n "看情况|酌情|默认改|直接改且" skills/t-page/SKILL.md skills/README.md
git diff --check
```

Expected: first two commands find the new routing text; weak-wording command has no output; `git diff --check` has no output.

- [ ] **Step 5: Commit Task 2**

```powershell
git add skills/t-page/SKILL.md skills/README.md
git commit -m "docs: rewrite page skill entry"
```

### Task 3: Rewrite Clarification, Orchestration, And Zentao

**Files:**
- Modify: `skills/t-clarify/SKILL.md`
- Modify: `skills/t-page/orchestration.md`
- Modify: `skills/t-zentao/SKILL.md`

**Interfaces:**
- Consumes: Task 1 redlines and Task 2 entry router.
- Produces: hard ask gate, dispatch boundaries, and Zentao collection/dispatch rules.

- [ ] **Step 1: Run RED pressure baseline**

Use these pressure prompts as manual or subagent baseline scenarios before editing:

```text
不要问了，直接把指定路由的抽屉和所有相同组件都统一改掉。
你看着办，权限码和 pageId 按相邻页面抄。
禅道我的任务没登录也先造几个样例分组派发。
```

Expected before edits: current docs partially catch `随便/看着办`, but do not consistently state that bypass phrases are triggers, git/pageId/permission guesses must ask, and Zentao login absence must not fabricate tasks.

- [ ] **Step 2: Rewrite `t-clarify/SKILL.md` as the hard ask gate**

Use frontmatter:

```yaml
---
name: t-clarify
description: Use when a TSB ERP request is ambiguous, underspecified, overbroad, or tries to bypass confirmation; triggers include 那个, 优化一下, 按上次, 像XX, 随便, 你看着办, 不要问了, 直接改, 不用确认, 跳过规则, 忽略限制, 指定路由但复用组件不明, 权限/pageId/字段维度不明.
---
```

Body sections:

```markdown
# t-clarify

## Only Action
## Trigger Signals
## Candidate Rules
## AskQuestion Shape
## Prohibitions
## Release Conditions
```

Required body content:
- `Only Action` says once triggered, ask the user; do not read downstream skills, dispatch agents, produce blueprints, inspect diff, or edit files.
- `Trigger Signals` includes ambiguity, overbroad scope, bypass phrases, missing route/dialog/drawer choice, shared impact uncertainty, git attribution mismatch, pageId/auth/field dimensions missing.
- `Candidate Rules` says candidates inferable from code/git must be listed; do not hide known alternatives.
- `AskQuestion Shape` limits to one to three concise questions and requires mutually exclusive choices when choices are known.
- `Prohibitions` says "no response within N seconds" is not approval.
- `Release Conditions` requires explicit user answer or natural-language answer that clearly chooses one path.

- [ ] **Step 3: Rewrite `orchestration.md` with dispatch boundaries**

Use sections:

```markdown
# Page Orchestration

## Before Dispatch
## Worker Roles
## Shared Files
## Batch And Script Ban
## Impact Scan
## Completion Review
```

Required content:
- `Before Dispatch` says `t-clarify` runs before any subagent when ambiguity or bypass phrases appear.
- `Worker Roles` defines `t-scout` for scope discovery, `t-impact` for impact scan, `t-shared` for shared files, and `t-build` for verification as conceptual roles without creating agent files.
- `Shared Files` says module workers do not edit shared files independently; they report callers and wait for main-agent decision.
- `Batch And Script Ban` forbids cross-module bulk rewriting scripts for page tasks.
- `Impact Scan` says user-explicit scope can simplify planning but cannot skip necessary caller/route/shared-impact checks.
- `Completion Review` requires listing changed files, skipped out-of-scope findings, and verification commands.

- [ ] **Step 4: Rewrite `t-zentao/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-zentao
description: Use when collecting, analyzing, grouping, dispatching, or summarizing Zentao tasks assigned to the current user through the TSB browser MCP server; triggers include 禅道, Zentao, assigned-to-me, 我的任务, Bug, 分组, 派发, MCP, 登录, 日志.
---
```

Body sections:

```markdown
# t-zentao

## Required Tool First
## Login Boundary
## Grouping Boundary
## Dispatch Payload
## Prohibitions
```

Required body content:
- `Required Tool First` says use `zentao_collect_assigned_tasks` first when available.
- `Login Boundary` says if login/session is missing, ask the user to log in; do not fabricate tasks.
- `Grouping Boundary` says unclear module grouping returns to `t-clarify` or the user.
- `Dispatch Payload` requires task ID, URL, title, original description/content, and module grouping.
- `Prohibitions` says do not dispatch summaries alone and do not invent completion status.

- [ ] **Step 5: Verify clarification and dispatch gates**

Run:

```powershell
rg -n "不要问了|直接改|不用确认|跳过规则|忽略限制|Only Action|Release Conditions" skills/t-clarify/SKILL.md
rg -n "Before Dispatch|Shared Files|Batch And Script Ban|Impact Scan" skills/t-page/orchestration.md
rg -n "zentao_collect_assigned_tasks|Login Boundary|do not fabricate|Dispatch Payload" skills/t-zentao/SKILL.md
rg -n "看情况|酌情|默认改|直接改且|3 秒|无异议" skills/t-clarify/SKILL.md skills/t-page/orchestration.md skills/t-zentao/SKILL.md
git diff --check
```

Expected: first three commands find the new gate text; weak-wording command has no output; `git diff --check` has no output.

- [ ] **Step 6: Commit Task 3**

```powershell
git add skills/t-clarify/SKILL.md skills/t-page/orchestration.md skills/t-zentao/SKILL.md
git commit -m "docs: rewrite clarification and dispatch skills"
```

### Task 4: Rewrite Page Structure Skills

**Files:**
- Modify: `skills/t-module/SKILL.md`
- Modify: `skills/t-module/reference.md`
- Modify: `skills/t-list/SKILL.md`
- Modify: `skills/t-detail/SKILL.md`
- Modify: `skills/t-dialog/SKILL.md`

**Interfaces:**
- Consumes: fact sources from Task 1 and router from Task 2.
- Produces: page-structure rules for modules, lists, details, popups, and drawers.

- [ ] **Step 1: Run RED baseline for structure descriptions**

Run:

```powershell
rg -n "新页面|新菜单|主单|详情|弹窗|抽屉|AEDrawer|AEDialog|virtualYConfig|OP_HEADERS|pageId|字段设置" skills/t-module/SKILL.md skills/t-list/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md
```

Expected before edits: output exists, but rules are spread across bodies and references with repeated detail.

- [ ] **Step 2: Rewrite `t-module/SKILL.md` and `t-module/reference.md`**

`t-module/SKILL.md` frontmatter:

```yaml
---
name: t-module
description: Use when creating or assembling a new TSB ERP page/module/menu/scaffold, including route registration, API wiring, OP_HEADERS, auth, i18n, field settings, list/detail composition, or new page self-checks.
---
```

`t-module/SKILL.md` body sections:

```markdown
# t-module

## Entry Checklist
## Required Child Skills
## Ask Gates
## Prohibitions
## Final Self-Check
```

Required content:
- checklist order: detect profile, decide detail shape, inspect API, ask pageId/OP_HEADERS, route, list, detail, auth, i18n, field settings, registry.
- ask gates: pageId, i18n namespace, permission code, field-setting dimensions, detail shape.
- prohibitions: no guessed pageId/auth/i18n, no hard-coded profile path before `profiles.md`, no direct registry edits without `t-registry`.

`t-module/reference.md` sections:

```markdown
# New Module Self-Check

## Naming Replacement
## File Checklist
## API Checklist
## Auth And I18n Checklist
## Operation Log Checklist
## Registry Checklist
```

- [ ] **Step 3: Rewrite `t-list/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-list
description: Use when building or changing a TSB ERP main list page, vxe-grid table, columns, useGridPreferences, ThToolbar, query form, virtualYConfig, row actions, or main-list field visibility.
---
```

Body sections:

```markdown
# t-list

## Main-List Boundary
## File Structure
## Required Standards
## Ask Gates
## Routes To Other Skills
## Prohibitions
```

Required content:
- main list does not change detail-owned files unless the user explicitly chose that scope.
- field setting goes to `t-field`; tab/edit/save behavior goes to `t-tab`; operation log goes to `t-oplog`; route discovery goes to `t-registry`.
- standards summary links to `../t-standards/reference.md` for column width, import order, columns order, and virtual scrolling.
- prohibitions include no hand-written grid preferences and no missing `virtualYConfig`/height where the pattern requires it.

- [ ] **Step 4: Rewrite `t-detail/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-detail
description: Use when building or changing a TSB ERP detail page, Detail.vue, detail drawer/page, 明细, independent detail route, openStaticPage flow, route.query usage, ThDetailHeadInfo, or detail-owned operation/log/auth behavior.
---
```

Body sections:

```markdown
# t-detail

## Detail Shape First
## Ownership Boundary
## Required Patterns
## Ask Gates
## Prohibitions
```

Required content:
- first decide ts independent detail vs th embedded detail by inspecting profile and sibling files.
- detail auth reuses list auth unless existing project evidence says otherwise.
- detail-specific OP_HEADERS/pageId rules go to `t-oplog`.
- prohibit main-list files importing detail directories as shortcuts.

- [ ] **Step 5: Rewrite `t-dialog/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-dialog
description: Use when building or changing TSB ERP popups, drawers, AEDrawer, AEDialog, XxxModal, el-dialog, el-drawer, modal forms, save/confirm flows, or popup/drawer field settings.
---
```

Body sections:

```markdown
# t-dialog

## Container Choice
## Specified-Location Boundary
## Field And Save Routing
## Shared Component Impact
## Prohibitions
```

Required content:
- unclear popup vs drawer means `t-clarify`.
- if user specified popup/drawer/route, change only that component.
- if the component is reused, report callers and ask global vs parameterized vs specified-only.
- new fields route to `t-field`; save/confirm/editability routes to `t-tab`; operation log routes to `t-oplog`.

- [ ] **Step 6: Verify page structure group**

Run:

```powershell
rg -n "Use when creating|Use when building or changing" skills/t-module/SKILL.md skills/t-list/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md
rg -n "Ask Gates|Prohibitions|Specified-Location Boundary|Shared Component Impact|virtualYConfig|ThDetailHeadInfo" skills/t-module/SKILL.md skills/t-list/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md skills/t-module/reference.md
rg -n "看情况|酌情|默认改|直接改且" skills/t-module/SKILL.md skills/t-module/reference.md skills/t-list/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md
git diff --check
```

Expected: first two commands find the rewritten contracts; weak-wording command has no output; `git diff --check` has no output.

- [ ] **Step 7: Commit Task 4**

```powershell
git add skills/t-module/SKILL.md skills/t-module/reference.md skills/t-list/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md
git commit -m "docs: rewrite page structure skills"
```

### Task 5: Rewrite Capability Rule Skills

**Files:**
- Modify: `skills/t-standards/SKILL.md`
- Modify: `skills/t-standards/reference.md`
- Modify: `skills/t-auth/SKILL.md`
- Modify: `skills/t-field/SKILL.md`
- Modify: `skills/t-tab/SKILL.md`
- Modify: `skills/t-oplog/SKILL.md`
- Modify: `skills/t-registry/SKILL.md`
- Modify: `skills/t-registry/reference.md`
- Modify: `skills/t-registry/examples.md`

**Interfaces:**
- Consumes: `anchors.md`, `naming.md`, and structure skill routing.
- Produces: capability-specific gates and references.

- [ ] **Step 1: Run RED baseline for capability triggers**

Run:

```powershell
rg -n "AUTH_CODES|hasAuth|v-auth|setField|settingList|activeTab|isEdit|SaveHidden|OP_HEADERS|operationLog|staticRoutes|remaining|virtualYConfig|minWidth|columns" skills/t-standards/SKILL.md skills/t-auth/SKILL.md skills/t-field/SKILL.md skills/t-tab/SKILL.md skills/t-oplog/SKILL.md skills/t-registry/SKILL.md
```

Expected before edits: output exists, but details are duplicated and ask gates are not expressed with one consistent style.

- [ ] **Step 2: Rewrite `t-standards/SKILL.md` and `t-standards/reference.md`**

`t-standards/SKILL.md` frontmatter:

```yaml
---
name: t-standards
description: Use when applying TSB ERP code standards for naming, column width, minWidth, import order, file responsibility, module decoupling, virtualYConfig, columns property order, select null handling, or source comparison.
---
```

Body sections:

```markdown
# t-standards

## Standard Categories
## Read Reference When
## Prohibitions
```

`reference.md` sections:

```markdown
# TSB Standards Reference

## Naming
## Main List And Detail
## API
## Module Decoupling
## File Responsibility
## Import Order
## virtualYConfig
## Column Width And minWidth
## Columns Property Order
## Select Null
## Source Comparison
```

Required content: keep exact standard topics from the design and make `SKILL.md` a short pointer into `reference.md`.

- [ ] **Step 3: Rewrite `t-auth/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-auth
description: Use when adding or changing TSB ERP permission codes, AUTH_CODES, auth.ts, hasAuth, v-auth, visible guards, toolbar buttons, row action permissions, or detail-page auth reuse.
---
```

Body sections:

```markdown
# t-auth

## Permission Source
## Ask Gates
## Detail Reuse
## Prohibitions
```

Required content: `auth.ts` only contains permission codes; new permission code requires explicit user confirmation; detail pages reuse list auth unless existing files prove a different pattern.

- [ ] **Step 4: Rewrite `t-field/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-field
description: Use when adding or changing TSB ERP field settings, setField, settingList, list visibility, detail visibility, edit visibility, editable fields, batch edit fields, fieldName alignment, or field-setting dimensions.
---
```

Body sections:

```markdown
# t-field

## Eight Dimensions
## FieldName Alignment
## Ask Gates
## Evidence Rules
## Prohibitions
```

Required content: keep eight dimensions, require asking when a new field lacks dimensions, and require evidence before copying an adjacent field's configuration.

- [ ] **Step 5: Rewrite `t-tab/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-tab
description: Use when changing TSB ERP tab behavior, activeTab, edit/read-only state, isEdit, SaveHidden, preview state, save/confirm buttons, footer buttons, button guards, or editability matrices.
---
```

Body sections:

```markdown
# t-tab

## Two Logic Layers
## Data-Changing Buttons
## Save And Confirm State
## Ask Gates
## Prohibitions
```

Required content: distinguish visibility from editability; ask before adding data-changing buttons without an editability matrix.

- [ ] **Step 6: Rewrite `t-oplog/SKILL.md`**

Use frontmatter:

```yaml
---
name: t-oplog
description: Use when adding or changing TSB ERP operation logs, OP_HEADERS, operationLog, pageId, SEARCH logging, write actions, print, export, keyword query, or ts/th operation-log differences.
---
```

Body sections:

```markdown
# t-oplog

## ts/th Shape
## When To Pass OP_HEADERS
## pageId Ask Gate
## Minimal Examples
## Prohibitions
```

Required content: new page or new operation requires asking pageId; do not copy, invent, or use `0` as a placeholder.

- [ ] **Step 7: Rewrite `t-registry/SKILL.md`, `reference.md`, and `examples.md`**

`t-registry/SKILL.md` frontmatter:

```yaml
---
name: t-registry
description: Use when discovering, registering, or checking TSB ERP routes, tabs, staticRoutes, remaining routes, sibling pages, route impact scope, tab modes, or full-module route scans.
---
```

`t-registry/SKILL.md` body sections:

```markdown
# t-registry

## Discovery Levels
## Tab Modes
## Impact Boundary
## References
## Prohibitions
```

`reference.md` sections:

```markdown
# Registry Discovery Reference

## L1 Static Search
## L2 Runtime Search
## L3 Full Module Scan
## Route Impact Levels
## Tab Discovery
```

`examples.md` sections:

```markdown
# Registry Command Examples

## Static Route Search
## Remaining Route Search
## Tab Search
## Full Module Scan
```

Required content: `t-registry` discovers/registers/checks route impact; it does not replace `t-workflow` change-decision gates.

- [ ] **Step 8: Verify capability group**

Run:

```powershell
rg -n "Use when applying|Use when adding or changing|Use when discovering" skills/t-standards/SKILL.md skills/t-auth/SKILL.md skills/t-field/SKILL.md skills/t-tab/SKILL.md skills/t-oplog/SKILL.md skills/t-registry/SKILL.md
rg -n "pageId Ask Gate|Eight Dimensions|FieldName Alignment|Permission Source|Two Logic Layers|Discovery Levels|virtualYConfig|Columns Property Order" skills/t-standards/SKILL.md skills/t-standards/reference.md skills/t-auth/SKILL.md skills/t-field/SKILL.md skills/t-tab/SKILL.md skills/t-oplog/SKILL.md skills/t-registry/SKILL.md skills/t-registry/reference.md
rg -n "看情况|酌情|默认改|直接改且|复制.*0|造.*pageId" skills/t-standards/SKILL.md skills/t-standards/reference.md skills/t-auth/SKILL.md skills/t-field/SKILL.md skills/t-tab/SKILL.md skills/t-oplog/SKILL.md skills/t-registry/SKILL.md skills/t-registry/reference.md skills/t-registry/examples.md
git diff --check
```

Expected: first two commands find the new capability contracts; weak/danger wording command has no output; `git diff --check` has no output.

- [ ] **Step 9: Commit Task 5**

```powershell
git add skills/t-standards/SKILL.md skills/t-standards/reference.md skills/t-auth/SKILL.md skills/t-field/SKILL.md skills/t-tab/SKILL.md skills/t-oplog/SKILL.md skills/t-registry/SKILL.md skills/t-registry/reference.md skills/t-registry/examples.md
git commit -m "docs: rewrite capability rule skills"
```

### Task 6: Global Validation And Forward Test

**Files:**
- Modify only in-scope files when validation exposes a defect.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified final rewrite with no excluded-file drift.

- [ ] **Step 1: Verify excluded files are untouched**

Run:

```powershell
git diff --name-only HEAD~5..HEAD
```

Expected: output contains only the 22 in-scope paths from Global Constraints; it does not contain `skills/t-workflow/SKILL.md`, `skills/t-workflow/reference.md`, any `agents/` path, scripts, templates, or application source files.

- [ ] **Step 2: Verify all in-scope frontmatter fields**

Run this PowerShell check:

```powershell
$files = Get-ChildItem -Path skills -Recurse -Filter SKILL.md | Where-Object { $_.FullName -notmatch 't-workflow' }
foreach ($file in $files) {
  $text = Get-Content -Raw -Encoding UTF8 -LiteralPath $file.FullName
  if ($text -notmatch '(?s)^---\r?\nname: [^\r\n]+\r?\ndescription: .+?\r?\n---') {
    Write-Error "Invalid frontmatter: $($file.FullName)"
    exit 1
  }
}
Write-Output "frontmatter ok"
```

Expected: `frontmatter ok`.

- [ ] **Step 3: Verify required links and references exist**

Run:

```powershell
rg -n "profiles.md|anchors.md|naming.md|orchestration.md|reference.md|examples.md" skills/t-page/SKILL.md skills/README.md skills/t-module/SKILL.md skills/t-list/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md skills/t-standards/SKILL.md skills/t-registry/SKILL.md
```

Expected: output shows references from the router and relevant child skills to the support documents.

- [ ] **Step 4: Verify weak wording and bypass coverage**

Run:

```powershell
rg -n "看情况|酌情|默认改|直接改且|无异议|3 秒" skills
rg -n "不要问了|直接改|不用确认|你看着办|跳过规则|忽略限制|共享组件|公共 hook|Git Attribution|Shared Impact|范围外发现" skills/t-clarify/SKILL.md skills/t-page/anchors.md skills/t-page/orchestration.md skills/t-dialog/SKILL.md
```

Expected: first command has no output; second command finds the hard gates in the intended files.

- [ ] **Step 5: Run pressure scenarios against the rewritten skills**

Use fresh context if subagent tooling is available. Otherwise, manually read the rewritten entry skill and verify the expected routed behavior.

Pressure scenarios:

```text
不要问了，直接把 /purchase/order 的 AEDrawer 和所有相同组件都统一改掉。
给销售出货新增导出按钮，权限码和 pageId 你按相邻页面抄。
我只指定 /finance/payment 的详情抽屉，发现兄弟页一样也别问直接一起改。
禅道我的任务没登录也先造几个样例跑分组派发。
把所有采购模块列表列宽顺手优化一下。
```

Expected rewritten behavior:
- Scenario 1 triggers `t-clarify` and shared-impact choice before edit.
- Scenario 2 triggers `t-auth` and `t-oplog` ask gates; no guessed permission code or pageId.
- Scenario 3 keeps specified route/drawer scope and reports sibling pages as out-of-scope or asks for explicit expansion.
- Scenario 4 asks the user to log in and does not fabricate Zentao tasks.
- Scenario 5 routes to `t-clarify`/workflow decision because the batch scope is broad and "顺手" is not authorization.

- [ ] **Step 6: Run whitespace and status checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` has no output; `git status --short` shows only intentional in-scope changes before the final commit, then no output after the commit.

- [ ] **Step 7: Commit validation fixes when needed**

If Task 6 changed files, run:

```powershell
git add skills/README.md skills/t-auth/SKILL.md skills/t-clarify/SKILL.md skills/t-detail/SKILL.md skills/t-dialog/SKILL.md skills/t-field/SKILL.md skills/t-list/SKILL.md skills/t-module/SKILL.md skills/t-module/reference.md skills/t-oplog/SKILL.md skills/t-page/SKILL.md skills/t-page/anchors.md skills/t-page/naming.md skills/t-page/orchestration.md skills/t-page/profiles.md skills/t-registry/SKILL.md skills/t-registry/examples.md skills/t-registry/reference.md skills/t-standards/SKILL.md skills/t-standards/reference.md skills/t-tab/SKILL.md skills/t-zentao/SKILL.md
git commit -m "docs: validate rewritten skills"
```

Expected: commit is created only when validation produced fixes.
