# pageId Console Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace guessed or placeholder pageIds with a Trade/Hall-gated workflow that returns one complete, copyable Console script and waits for real API results before editing `OP_HEADERS`.

**Architecture:** `skills/t-oplog/SKILL.md` is the only source for the complete workflow, parameter contract, security rules, and Console template. Workflow, agent, command, and rule files contain only trigger gates and a direct reference to `t-oplog`, preventing duplicated templates from drifting.

**Tech Stack:** Cursor plugin Markdown skills, YAML frontmatter, JavaScript Console IIFE, PowerShell verification, `skill-creator/scripts/quick_validate.py`.

## Global Constraints

- Ask the user to choose Trade (`roleId: 16`), Hall (`roleId: 14`), or another system before generating the Console script.
- Do not apply this workflow to systems other than Trade or Hall.
- Collect a fresh Bearer token through a dedicated free-text AskQuestion; never reuse example, historical, file, log, environment, or cached credentials.
- AI returns but never executes the production request.
- The response contains exactly one complete `javascript` fenced code block, with no unresolved render markers and no manual assembly.
- Only `pageTitle`, `useTitle`, the user token, and the confirmed roleId vary. `isSplit`, `isRepeat`, `isMany`, and `isKeyWord` are `false`; `platform` is `0`.
- Do not write any pageId until the user returns an unambiguous real API result.
- Do not modify MCP, installation scripts, unrelated skills, permissions, API docs, or ERP source code.

---

### Task 1: RED Baseline for Existing pageId Rules

**Files:**
- Read: `skills/t-oplog/SKILL.md`
- Read: `skills/t-workflow/reference.md`
- Read: `agents/t-oplog.md`

**Interfaces:**
- Consumes: Approved design in `docs/superpowers/specs/2026-07-10-pageid-console-script-design.md`.
- Produces: A baseline list of old behaviors that must disappear.

- [ ] **Step 1: Run the old-rule scan**

Run:

```powershell
rg -n "已提供 pageId|后续配置|需要后台配置|pageId 怎么处理" skills/t-oplog/SKILL.md skills/t-workflow/reference.md agents/t-oplog.md
```

Expected: matches prove the current rules still allow supplied numbers or placeholder pageIds.

- [ ] **Step 2: Check missing required contract terms**

Run:

```powershell
rg -n "roleId: 16|roleId: 14|AddBeHaviorLogRegex|Bearer token|javascript.*代码块|AI.*不.*调用" skills/t-oplog/SKILL.md
```

Expected: no complete contract is present, so the baseline fails the approved design.

### Task 2: GREEN Authoritative t-oplog Workflow

**Files:**
- Modify: `skills/t-oplog/SKILL.md`

**Interfaces:**
- Consumes: Confirmed project choice, exact `pageTitle/useTitle` list, and fresh Bearer token.
- Produces: One complete Console IIFE for the user to execute and a gate that waits for returned real pageIds.

- [ ] **Step 1: Replace the old pageId gate**

Write sections for:

```markdown
## 触发与系统门禁
## pageTitle / useTitle 数据契约
## Bearer token 门禁
## Console 输出契约
## 唯一渲染模板
## 真实 pageId 回填门禁
## 禁止事项
```

The system question has exactly three choices: Trade (`16`), Hall (`14`), and another system (stop).

- [ ] **Step 2: Add the complete render contract**

The canonical IIFE must define token, roleId, data, URL, result collection, sequential `fetch`, raw response parsing, success/failure counts, `100ms` pacing, `console.table`, and a returned results array. Its request body must contain all eight fields from the approved design.

- [ ] **Step 3: Tighten discovery metadata**

Set the description to trigger on new/migrated pages, `OP_HEADERS`, `pageId`, operation items, Console generation, and behavior-log registration without summarizing the workflow.

### Task 3: Sync Entry-Point Gates

**Files:**
- Modify: `skills/t-workflow/reference.md`
- Modify: `agents/t-oplog.md`
- Modify: `agents/t-scaffold.md`
- Modify: `commands/t-new-module.md`
- Modify: `rules/t-agent-guidance.mdc`

**Interfaces:**
- Consumes: Authoritative workflow from `t-oplog`.
- Produces: Consistent triggers without duplicating the full Console template.

- [ ] **Step 1: Replace workflow question #6**

Question #6 must ask for the current system and route Trade/Hall to `t-oplog`; another system stops this workflow. Remove supplied-number and placeholder options.

- [ ] **Step 2: Update the t-oplog agent contract**

The agent input must require a confirmed system, exact page/operation list, and a fresh token. The agent must return the script only and wait for real results before editing `operationLog.ts`.

- [ ] **Step 3: Update command and rule gates**

`t-scaffold`, `t-new-module`, and the global rule must state that new/migrated pages and changed operation items use the Trade/Hall Console workflow and cannot use guessed, copied, zero, old, or placeholder pageIds.

### Task 4: GREEN Verification and Review

**Files:**
- Validate: all files modified by Tasks 2 and 3.

**Interfaces:**
- Consumes: Updated skill and synchronized entry points.
- Produces: Evidence that the approved contract is complete and no credential entered the repository.

- [ ] **Step 1: Validate the skill**

Run:

```powershell
$env:PYTHONUTF8='1'
python C:\Users\huanghe\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills\t-oplog
```

Expected: `Skill is valid!`

- [ ] **Step 2: Prove stale pageId choices are gone**

Run:

```powershell
rg -n "已提供 pageId|pageId.*后续|pageId.*需要后台配置|pageId 选 B" skills agents commands rules
```

Expected: no pageId placeholder workflow remains. Permission-code placeholders are outside scope.

- [ ] **Step 3: Prove the exact contract exists**

Run searches for role IDs `16/14`, endpoint `AddBeHaviorLogRegex`, all fixed body fields, Bearer handling, one-code-block output, no-direct-call rule, and real-result gate.

- [ ] **Step 4: Scan for credentials and formatting errors**

Run:

```powershell
rg -n "eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+" skills agents commands rules docs
git diff --check
```

Expected: no JWT-like credential and no whitespace errors.

- [ ] **Step 5: Review and commit**

Review only the planned files, confirm the working tree contains no unrelated edits, then commit with:

```powershell
git add skills/t-oplog/SKILL.md skills/t-workflow/SKILL.md skills/t-workflow/reference.md agents/t-oplog.md agents/t-scaffold.md commands/t-new-module.md rules/t-agent-guidance.mdc docs/superpowers/plans/2026-07-10-pageid-console-workflow.md
git commit -m "docs: enforce pageId console workflow"
```
