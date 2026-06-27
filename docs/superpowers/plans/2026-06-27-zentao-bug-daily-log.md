# Zentao Bug and Daily Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect assigned Zentao tasks and bugs, dispatch them as unified work items, and generate an optional Beijing-date daily log from verified completions with exactly 8.5 hours.

**Architecture:** Keep the current task APIs compatible while introducing a `kind`-aware work-item analyzer and browser collector. Put deterministic daily-log filtering, grouping, half-hour allocation, and formatting in a separate pure module so the MCP layer and Cursor workflow remain thin and testable.

**Tech Stack:** Node.js ESM, Playwright, Model Context Protocol SDK, Node test runner, Cursor plugin commands/skills/agents.

---

## File Structure

- Create `mcp/src/zentaoDailyLog.mjs`: filter verified completions, consolidate entries, allocate 17 half-hour units, and format the Beijing-date log.
- Create `mcp/tests/zentaoDailyLog.test.mjs`: deterministic tests for filtering, grouping, time allocation, date, and summary text.
- Modify `mcp/src/zentaoAnalyzer.mjs`: preserve `kind`, expose unified work-item analysis, and generate task/Bug-aware agent prompts.
- Modify `mcp/tests/zentaoAnalyzer.test.mjs`: cover mixed task/Bug grouping and prompts.
- Modify `mcp/src/zentaoCollector.mjs`: add kind-aware list navigation, link extraction, detail extraction, and combined collection while preserving task-only exports.
- Modify `mcp/tests/zentaoCollector.test.mjs`: cover Bug DTable, pagination, details, and combined collection helpers.
- Modify `mcp/src/server.mjs`: expose `zentao_collect_assigned_work_items`, `zentao_analyze_work_items`, and `zentao_generate_daily_log`; retain old tool names.
- Modify `mcp/tests/serverSmoke.test.mjs`: verify new MCP tools and daily-log output.
- Modify `commands/tsb-zentao-collect.md`: use the combined tool, dispatch all modules, collect completion reports, and force the final single-choice question.
- Modify `skills/tsb-zentao-automation/SKILL.md`: document Bug collection and the mandatory post-execution confirmation.
- Modify `agents/tsb-module-agent.md`: require structured completion reports with `completed`, `verified`, and `completionSummary`.
- Modify `mcp/README.md`, `.cursor-plugin/plugin.json`, and `.cursor-plugin/marketplace.json`: document capabilities and bump the plugin version.

### Task 1: Unified Work-Item Analysis

**Files:**
- Modify: `mcp/src/zentaoAnalyzer.mjs`
- Test: `mcp/tests/zentaoAnalyzer.test.mjs`

- [ ] **Step 1: Write the failing mixed-work-item tests**

Add tests that call the desired API:

```js
import { analyzeZentaoWorkItems, normalizeWorkItem } from "../src/zentaoAnalyzer.mjs";

test("preserves task and bug kinds in unified analysis", () => {
  const result = analyzeZentaoWorkItems([
    { id: "1", kind: "task", title: "采购订单增加审批详情" },
    { id: "2", kind: "bug", title: "销售出货生成应收单报错" }
  ]);

  assert.equal(result.workItemCount, 2);
  assert.deepEqual(result.groups.flatMap(group => group.workItems).map(item => item.kind), [
    "task",
    "bug"
  ]);
  assert.match(result.agentPlan.map(item => item.prompt).join("\n"), /类型：Bug/);
});

test("normalizes unknown work-item kinds to task", () => {
  assert.equal(normalizeWorkItem({ title: "标题", kind: "other" }).kind, "task");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --test-name-pattern="work-item|kinds"`

Expected: FAIL because `analyzeZentaoWorkItems` and `normalizeWorkItem` are not exported.

- [ ] **Step 3: Implement the unified analyzer and compatibility wrapper**

Implement these public contracts:

```js
export function normalizeWorkItem(item) {
  const kind = item?.kind === "bug" ? "bug" : "task";
  return {
    id: normalizeTaskText(item?.id),
    kind,
    url: normalizeTaskText(item?.url),
    title: normalizeTaskText(item?.title),
    content: normalizeTaskText(item?.content),
    remarks: normalizeTaskText(item?.remarks),
    description: normalizeTaskText(item?.description),
    module: item?.module || classifyTaskModule(item)
  };
}

export function analyzeZentaoWorkItems(items) {
  const normalized = (items || []).map(normalizeWorkItem).filter(item => item.title);
  const groups = groupWorkItemsByModule(normalized);
  return {
    workItemCount: normalized.length,
    taskCount: normalized.filter(item => item.kind === "task").length,
    bugCount: normalized.filter(item => item.kind === "bug").length,
    groups,
    agentPlan: toAgentExecutionPlan(groups)
  };
}

export function analyzeZentaoTasks(tasks) {
  const result = analyzeZentaoWorkItems((tasks || []).map(task => ({ ...task, kind: "task" })));
  return { taskCount: result.taskCount, groups: result.groups, agentPlan: result.agentPlan };
}
```

Groups expose `workItems` and retain `tasks` as a compatibility alias. Agent prompts label each item as `任务` or `Bug` and require a structured completion result.

- [ ] **Step 4: Run analyzer tests and verify GREEN**

Run: `node --test tests/zentaoAnalyzer.test.mjs`

Expected: all analyzer tests PASS.

- [ ] **Step 5: Commit the analyzer change**

```powershell
git add mcp/src/zentaoAnalyzer.mjs mcp/tests/zentaoAnalyzer.test.mjs
git commit -m "feat: analyze zentao tasks and bugs as work items"
```

### Task 2: Deterministic 8.5h Daily Log Generator

**Files:**
- Create: `mcp/src/zentaoDailyLog.mjs`
- Create: `mcp/tests/zentaoDailyLog.test.mjs`

- [ ] **Step 1: Write failing daily-log tests**

Cover filtering and exact totals:

```js
import { generateZentaoDailyLog } from "../src/zentaoDailyLog.mjs";

test("uses only completed and verified items and totals exactly 8.5h", () => {
  const result = generateZentaoDailyLog([
    {
      kind: "task",
      module: "财务模块",
      title: "厂商付款审批详情",
      completionSummary: "完成厂商付款审批详情页面",
      completed: true,
      verified: true
    },
    {
      kind: "bug",
      module: "销售模块",
      title: "出货生成应收单报错",
      completionSummary: "修复客户出货单生成应收单规则问题",
      completed: true,
      verified: true
    },
    { kind: "bug", module: "采购模块", title: "未完成", completed: false, verified: false }
  ], { now: new Date("2026-06-26T16:30:00.000Z") });

  assert.equal(result.date, "2026-06-27");
  assert.equal(result.sourceItemCount, 2);
  assert.equal(result.totalHours, 8.5);
  assert.ok(result.entries.every(entry => Number.isInteger(entry.hours * 2)));
  assert.match(result.markdown, /^2026-06-27 完成事项/);
  assert.match(result.markdown, /总结：日常任务及Bug开发$/);
  assert.doesNotMatch(result.markdown, /未完成/);
});
```

Add tests for one item receiving 8.5h, more than 17 related items being consolidated to at most 17 entries, and empty verified input returning `canGenerate: false` without fabricated entries.

- [ ] **Step 2: Run the daily-log tests and verify RED**

Run: `node --test tests/zentaoDailyLog.test.mjs`

Expected: FAIL with module-not-found for `zentaoDailyLog.mjs`.

- [ ] **Step 3: Implement filtering, consolidation, weighting, and formatting**

Export this stable entry point:

```js
export function generateZentaoDailyLog(items, options = {}) {
  const completedItems = normalizeCompletedItems(items);
  if (completedItems.length === 0) {
    return { canGenerate: false, sourceItemCount: 0, entries: [], totalHours: 0, markdown: "" };
  }

  const consolidated = consolidateItems(completedItems, 17);
  const units = allocateHalfHourUnits(consolidated, 17);
  const entries = consolidated.map((item, index) => ({ ...item, hours: units[index] / 2 }));
  const date = beijingDate(options.now || new Date());
  const summary = summaryForKinds(new Set(completedItems.map(item => item.kind)));
  return {
    canGenerate: true,
    date,
    sourceItemCount: completedItems.length,
    entries,
    totalHours: entries.reduce((sum, entry) => sum + entry.hours, 0),
    markdown: formatDailyLog(date, entries, summary)
  };
}
```

Use `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" })` for the date. Give every entry one unit first, then distribute the remaining units by a deterministic complexity score based on completion-summary length and keywords such as `新增`, `重构`, `流程`, `接口`, and `修复`.

- [ ] **Step 4: Run daily-log tests and verify GREEN**

Run: `node --test tests/zentaoDailyLog.test.mjs`

Expected: all daily-log tests PASS and `totalHours` equals `8.5` in every generated case.

- [ ] **Step 5: Commit the daily-log module**

```powershell
git add mcp/src/zentaoDailyLog.mjs mcp/tests/zentaoDailyLog.test.mjs
git commit -m "feat: generate verified 8.5 hour daily logs"
```

### Task 3: Kind-Aware Task and Bug Browser Collection

**Files:**
- Modify: `mcp/src/zentaoCollector.mjs`
- Modify: `mcp/tests/zentaoCollector.test.mjs`

- [ ] **Step 1: Write failing Bug extraction tests**

Add a DTable test using rows such as `{ id: "701", title: "客户出货生成应收单报错" }` and assert:

```js
const links = await extractWorkItemLinks(page, "bug", 10);
assert.deepEqual(links, [{
  id: "701",
  kind: "bug",
  title: "客户出货生成应收单报错",
  url: "http://example.test/zentao/bug-view-701.html"
}]);
```

Add a Bug detail iframe fixture and assert `extractWorkItemDetail(context, link)` returns `kind: "bug"`, a cleaned title, steps/content, and remarks without “添加备注”. Add a navigation fixture for `/zentao/my-work-bug-assignedTo.html`.

- [ ] **Step 2: Run collector tests and verify RED**

Run: `node --test tests/zentaoCollector.test.mjs`

Expected: FAIL because the work-item exports do not exist.

- [ ] **Step 3: Generalize collection without breaking task exports**

Introduce kind configuration:

```js
const WORK_ITEM_CONFIG = {
  task: {
    listPath: "/zentao/my-work-task-assignedTo.html",
    viewPath: id => `/zentao/task-view-${id}.html`,
    hrefPattern: /task-(view|edit)|taskID=|task-view/i
  },
  bug: {
    listPath: "/zentao/my-work-bug-assignedTo.html",
    viewPath: id => `/zentao/bug-view-${id}.html`,
    hrefPattern: /bug-(view|edit)|bugID=|bug-view/i
  }
};
```

Expose `openAssignedWorkItemList`, `extractWorkItemLinks`, `extractPaginatedWorkItemLinks`, and `extractWorkItemDetail`. Keep `extractTaskLinks`, `extractPaginatedTaskLinks`, and `extractTaskDetail` as wrappers passing `"task"`.

- [ ] **Step 4: Add the combined collector**

Implement:

```js
export async function collectAssignedZentaoWorkItems(options = {}) {
  // Open one persistent context, collect tasks, return to the start URL,
  // collect bugs, merge the results, then call analyzeZentaoWorkItems.
}
```

Return `taskCount`, `bugCount`, `workItemCount`, `taskLinksFound`, `bugLinksFound`, per-kind list URLs/pages, `groups`, `agentPlan`, and a Markdown summary. Catch per-kind collection failures into `collectionErrors` while retaining the successful kind. Preserve `collectAssignedZentaoTasks` unchanged at its public boundary.

- [ ] **Step 5: Run collector tests and verify GREEN**

Run: `node --test tests/zentaoCollector.test.mjs`

Expected: all task regression tests and new Bug tests PASS.

- [ ] **Step 6: Commit browser collection**

```powershell
git add mcp/src/zentaoCollector.mjs mcp/tests/zentaoCollector.test.mjs
git commit -m "feat: collect assigned zentao bugs"
```

### Task 4: MCP Tool Surface

**Files:**
- Modify: `mcp/src/server.mjs`
- Modify: `mcp/tests/serverSmoke.test.mjs`

- [ ] **Step 1: Write failing MCP smoke tests**

Assert the tool list includes:

```js
assert.ok(names.includes("zentao_collect_assigned_work_items"));
assert.ok(names.includes("zentao_analyze_work_items"));
assert.ok(names.includes("zentao_generate_daily_log"));
```

Call `zentao_generate_daily_log` with one verified task and assert the returned text contains the Beijing date, `8.5h`, and `总结：日常任务开发`.

- [ ] **Step 2: Run smoke tests and verify RED**

Run: `node --test tests/serverSmoke.test.mjs`

Expected: FAIL because the three new MCP tools are absent.

- [ ] **Step 3: Register schemas and handlers**

Add the combined collector with the existing browser options plus `maxBugs`. Add a unified analyzer accepting `workItems`. Add the log tool accepting `completedItems` with required `title`, `kind`, `completed`, and `verified` fields.

Handlers call `collectAssignedZentaoWorkItems`, `analyzeZentaoWorkItems`, and `generateZentaoDailyLog`, returning Markdown followed by JSON. When `canGenerate` is false, return a clear message that no completed and verified items are available.

- [ ] **Step 4: Run MCP tests and verify GREEN**

Run: `node --test tests/serverSmoke.test.mjs`

Expected: all smoke tests PASS and the server closes cleanly.

- [ ] **Step 5: Commit MCP tools**

```powershell
git add mcp/src/server.mjs mcp/tests/serverSmoke.test.mjs
git commit -m "feat: expose zentao work item and daily log tools"
```

### Task 5: Cursor Execution and Mandatory Single Choice

**Files:**
- Modify: `commands/tsb-zentao-collect.md`
- Modify: `skills/tsb-zentao-automation/SKILL.md`
- Modify: `agents/tsb-module-agent.md`
- Modify: `mcp/README.md`
- Modify: `.cursor-plugin/plugin.json`
- Modify: `.cursor-plugin/marketplace.json`
- Test: `mcp/tests/workflowDocs.test.mjs`

- [ ] **Step 1: Write failing workflow-document tests**

Create `mcp/tests/workflowDocs.test.mjs` to read the three workflow files and assert they contain `zentao_collect_assigned_work_items`, `completed`, `verified`, `completionSummary`, `生成今日日志（推荐）`, `暂不生成`, and `zentao_generate_daily_log`.

- [ ] **Step 2: Run the workflow test and verify RED**

Run: `node --test tests/workflowDocs.test.mjs`

Expected: FAIL because the current command and skill only mention assigned tasks.

- [ ] **Step 3: Update the Cursor workflow**

Make the command sequence explicit:

```text
1. 调用 zentao_collect_assigned_work_items。
2. 按 agentPlan 分模块执行任务和 Bug。
3. 汇总 completed=true 且 verified=true 的结果。
4. 每次执行结束后必须发起单选：生成今日日志（推荐）/暂不生成。
5. 只有选择生成时调用 zentao_generate_daily_log；不得自行替用户选择。
```

Require each module Agent to return a JSON-compatible `completedItems` list and a separate blocked/failed list. Update README usage and examples. Bump plugin and marketplace metadata from `2.1.0` to `2.2.0`.

- [ ] **Step 4: Run workflow tests and verify GREEN**

Run: `node --test tests/workflowDocs.test.mjs`

Expected: PASS with all mandatory workflow phrases present.

- [ ] **Step 5: Commit Cursor workflow changes**

```powershell
git add commands/tsb-zentao-collect.md skills/tsb-zentao-automation/SKILL.md agents/tsb-module-agent.md mcp/README.md .cursor-plugin/plugin.json .cursor-plugin/marketplace.json mcp/tests/workflowDocs.test.mjs
git commit -m "feat: orchestrate bugs and optional daily logs"
```

### Task 6: Full Verification and Local Plugin Refresh

**Files:**
- Modify only if verification exposes a defect in files listed above.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all tests PASS with no warnings or unhandled browser processes.

- [ ] **Step 2: Validate plugin metadata**

Run:

```powershell
node -e "const fs=require('fs'); const plugin=JSON.parse(fs.readFileSync('.cursor-plugin/plugin.json','utf8')); const market=JSON.parse(fs.readFileSync('.cursor-plugin/marketplace.json','utf8')); if(plugin.version!=='2.2.0'||market.metadata?.version!=='2.2.0') process.exit(1); console.log('plugin metadata 2.2.0 valid')"
```

Expected: `plugin metadata 2.2.0 valid`.

- [ ] **Step 3: Refresh the local MCP registration**

Run: `powershell -ExecutionPolicy Bypass -File scripts/install-mcp.ps1 -SkipNpmInstall`

Expected: `tsb-browser-mcp` points to `D:\company\HhEmpower\mcp\src\server.mjs` in the Cursor MCP configuration.

- [ ] **Step 4: Perform real Zentao browser verification**

Call `zentao_collect_assigned_work_items` against `http://hallzd.internal.tsb.com/zentao/my.html` with visible Chrome. Verify that at least the task and Bug list navigation attempts are reported, collected links have the correct `kind`, and successfully opened detail pages return titles without placeholder descriptions.

- [ ] **Step 5: Verify a real daily-log sample**

Pass a mixed set of completed and verified sample results to `zentao_generate_daily_log`. Check the Beijing date, numbered descriptions, half-hour increments, exact 8.5h sum, and mixed summary line.

- [ ] **Step 6: Review final diff and status**

Run: `git diff --check HEAD~5..HEAD` and `git status --short`.

Expected: no whitespace errors; only intentionally uncommitted verification artifacts, if any, remain.
