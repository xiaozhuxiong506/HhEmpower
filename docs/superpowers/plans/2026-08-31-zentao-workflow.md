# Zentao Single-Session Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-login Zentao workflow that collects assigned Tasks and Bugs together, emits normalized developer-facing tables, supports direct task scheduling and post-completion closing, and teaches `t-zentao` to analyze code modules while only reminding the user of the current Git branch.

**Architecture:** A process-local session manager owns one persistent Playwright context per normalized profile/channel/headless key and serializes browser work; identical concurrent collection calls share one promise. The collector extracts unified facts, the analyzer/reporter groups by scene/system/module, and a dedicated writer performs exact-ID scheduling and closing through the same context. MCP schemas expose four new tools while legacy task-only tools delegate to the new path.

**Tech Stack:** Node.js ESM, Playwright 1.61, MCP SDK 1.17, `node:test`, `@vercel/ncc`, Markdown skill/command contracts.

**Spec:** `docs/superpowers/specs/2026-08-31-zentao-workflow-design.md`

## Global Constraints

- 【禅道需求】means assigned Task; 【禅道Bug】means assigned Bug.
- One normalized browser profile has one live context; concurrent collection must not open multiple login windows.
- Task and Bug lists request `pageSize=2000`; `maxTasks` and `maxBugs` default to `2000`.
- Preserve `project` and `product`; map `TSBERP*` to `贸易系统`, `HALLERP*` to `展厅系统`, conflicts/unknowns to `待确认`.
- Group output by system and code module; `详细处理方案与对应位置` is always the final table column.
- Before analysis output only `当前开发分支：<branch>`; do not require repository, HEAD, worktree, or Git-author tables.
- Shared components used by two or more modules require a user scope question before implementation.
- Scheduling accepts Tasks only. Once dates are supplied, execute without a second confirmation and set status, deadline, estimate, consumed, and remaining.
- Convert relative dates such as `后天` using `Asia/Shanghai`, show the resolved `YYYY-MM-DD`, then execute directly.
- After verified implementation, ask once which work items to close, then execute the selected exact IDs without a second confirmation.
- Keep `zentao_collect_assigned_tasks` and `zentao_analyze_tasks` backward compatible.

## File Map

- Create `mcp/src/zentaoSession.mjs`: context keying, lifecycle, exclusive queue, collection single-flight.
- Create `mcp/src/zentaoReporter.mjs`: normalized summary and developer-table Markdown.
- Create `mcp/src/zentaoWriter.mjs`: exact-ID scheduling and closing UI operations.
- Create `mcp/tests/zentaoSession.test.mjs`, `mcp/tests/zentaoWriter.test.mjs`, `mcp/tests/zentaoWorkflowPolicy.test.mjs`.
- Modify `mcp/src/zentaoAnalyzer.mjs`, `mcp/src/zentaoCollector.mjs`, `mcp/src/server.mjs`.
- Modify Zentao analyzer/collector/server/distribution tests.
- Modify `skills/t-zentao/SKILL.md`, `commands/t-zentao-collect.md`, `mcp/README.md`.
- Regenerate `mcp/dist/server.mjs`; bundled runtime dependencies must not drift.

---

### Task 1: Unified work-item model and reporter

**Files:**
- Modify: `mcp/src/zentaoAnalyzer.mjs`
- Create: `mcp/src/zentaoReporter.mjs`
- Modify: `mcp/src/zentaoCollector.mjs`
- Modify: `mcp/tests/zentaoAnalyzer.test.mjs`
- Create: `mcp/tests/zentaoWorkflowPolicy.test.mjs`

**Interfaces:**
- Produces: `mapZentaoSystem({ project, product })`.
- Produces: `normalizeWorkItem(item)` with scene/system/fact/analysis fields.
- Produces: `groupWorkItemsBySystemAndModule(items)` while preserving legacy `groups`.
- Produces: `formatZentaoWorkItemAnalysisMarkdown(result)`; collector re-exports it.

- [ ] **Step 1: Add failing analyzer tests**

```js
test("normalizes scene and ERP system", () => {
  const task = normalizeWorkItem({
    kind: "task", title: "采购单调整", project: "TSBERP一期",
    product: "TSBERP1.0", creator: "林彦林", deadline: "2026-09-02"
  });
  assert.equal(task.scene, "禅道需求");
  assert.equal(task.system, "贸易系统");
  assert.equal(task.creator, "林彦林");
  assert.equal(normalizeWorkItem({ kind: "bug", title: "错误", project: "HALLERP" }).scene, "禅道Bug");
  assert.equal(mapZentaoSystem({ project: "HALLERP", product: "TSBERP1.0" }), "待确认");
});
```

- [ ] **Step 2: Run `node --test mcp/tests/zentaoAnalyzer.test.mjs`**

Expected: FAIL because the mapping and normalized fields do not exist.

- [ ] **Step 3: Implement exact mapping and normalization**

```js
function systemFromName(value) {
  const name = normalizeTaskText(value).toUpperCase();
  if (name.startsWith("TSBERP")) return "贸易系统";
  if (name.startsWith("HALLERP")) return "展厅系统";
  return "";
}

export function mapZentaoSystem({ project, product } = {}) {
  const fromProduct = systemFromName(product);
  const fromProject = systemFromName(project);
  if (fromProduct && fromProject && fromProduct !== fromProject) return "待确认";
  return fromProduct || fromProject || "待确认";
}
```

`normalizeWorkItem` preserves current fields and adds `scene`, `project`, `product`, `system`, `creator`, `assignee`, `deadline`, `status`, `priority`, `severity`, `moduleEvidence`, `codeLocations`, `sharedImpact`, `pendingQuestions`, and `handlingPlan`.

- [ ] **Step 4: Add failing reporter test**

```js
test("report groups by system/module and leaves plan last", () => {
  const markdown = formatZentaoWorkItemAnalysisMarkdown(analyzeZentaoWorkItems([{
    kind: "bug", id: "9328", title: "打印错误", product: "TSBERP1.0",
    module: "库存仓储模块", handlingPlan: "修改 example.vue:20；验证打印"
  }]));
  assert.match(markdown, /## 贸易系统 · 库存仓储模块/);
  const header = markdown.split("\n").find(line => line.startsWith("| 场景 |"));
  assert.ok(header.endsWith("| 详细处理方案与对应位置 |"));
  assert.doesNotMatch(header, /HEAD|工作区|Git 最近修改者/);
});
```

- [ ] **Step 5: Run `node --test mcp/tests/zentaoWorkflowPolicy.test.mjs`**

Expected: FAIL because the reporter does not exist.

- [ ] **Step 6: Implement reporter with fixed columns**

```js
export const DEVELOPER_TABLE_COLUMNS = Object.freeze([
  "场景", "所属项目", "所属产品", "ID/链接", "标题", "创建者", "当前处理人",
  "截止日期", "代码模块", "共享影响", "待确认项", "详细处理方案与对应位置"
]);
```

Escape Markdown pipes/newlines, print the scene/system summary, group as `## <system> · <module>`, and use `未设置`, `待分析`, or `待确认` for missing display values. Import and re-export the formatter from the collector.

- [ ] **Step 7: Run focused tests**

Run: `node --test mcp/tests/zentaoAnalyzer.test.mjs mcp/tests/zentaoWorkflowPolicy.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add -- mcp/src/zentaoAnalyzer.mjs mcp/src/zentaoReporter.mjs mcp/src/zentaoCollector.mjs mcp/tests/zentaoAnalyzer.test.mjs mcp/tests/zentaoWorkflowPolicy.test.mjs
git commit -m "feat: normalize zentao work item reports"
```

---

### Task 2: Complete Task and Bug fact extraction

**Files:**
- Modify: `mcp/src/zentaoCollector.mjs`
- Modify: `mcp/tests/zentaoCollector.test.mjs`

**Interfaces:**
- Produces list/detail facts for `project`, `product`, `creator`, `assignee`, `deadline`, `status`, `priority`, `severity`.
- Produces exported `setZentaoPageSize(scope, pageSize)` for writer use.

- [ ] **Step 1: Extend DTable and detail fixtures with complete fields**

Use a DTable row containing `projectName`, `productName`, `openedBy`, `assignedTo`, `deadline`, `status`, `pri`, and `severity`. Add detail rows labelled `所属项目`, `所属产品`, `创建者`, `指派给`, `截止日期`, `状态`, `优先级`, `严重程度`. Assert exact final values.

- [ ] **Step 2: Run `node --test mcp/tests/zentaoCollector.test.mjs`**

Expected: FAIL because metadata is currently dropped.

- [ ] **Step 3: Preserve list metadata**

```js
project: data.projectName || data.project || "",
product: data.productName || data.product || "",
creator: data.openedBy || data.createdBy || data.creator || "",
assignee: data.assignedTo || data.assignee || "",
deadline: data.deadline || data.end || "",
status: data.statusName || data.status || "",
priority: data.pri || data.priority || "",
severity: data.severity || ""
```

Merge matching detail labels before the list values, normalize each, and rename/export `setPageSize` as `setZentaoPageSize`.

- [ ] **Step 4: Run collector and analyzer tests**

Run: `node --test mcp/tests/zentaoCollector.test.mjs mcp/tests/zentaoAnalyzer.test.mjs`

Expected: PASS, including legacy wrapper-shape tests.

- [ ] **Step 5: Commit**

```powershell
git add -- mcp/src/zentaoCollector.mjs mcp/tests/zentaoCollector.test.mjs
git commit -m "feat: collect complete zentao work item facts"
```

---

### Task 3: Single-context session manager

**Files:**
- Create: `mcp/src/zentaoSession.mjs`
- Create: `mcp/tests/zentaoSession.test.mjs`
- Modify: `mcp/src/zentaoCollector.mjs`
- Modify: `mcp/tests/zentaoCollector.test.mjs`

**Interfaces:**
- Produces: `getZentaoSessionKey(options)` from absolute profile/channel/headless.
- Produces: `runZentaoExclusive(options, operation)`.
- Produces: `runZentaoSingleFlight(options, flightKey, operation)`.
- Produces: `closeAllZentaoSessions()`.
- Owns: `defaultProfileDir()` and `launchPersistentChrome(options)`, moved from the collector so collector and writer cannot create separate contexts.
- `contextFactory` and `sessionKey` are test-only injection fields, not public schemas.

- [ ] **Step 1: Add failing single-flight test**

```js
test("concurrent identical calls create one context and run once", async () => {
  let creates = 0;
  let runs = 0;
  const gate = Promise.withResolvers();
  const options = {
    sessionKey: "same-profile", keepBrowserOpen: true,
    contextFactory: async () => { creates += 1; return { close: async () => {}, on: () => {} }; }
  };
  const operation = async () => { runs += 1; await gate.promise; return "done"; };
  const first = runZentaoSingleFlight(options, "collect", operation);
  const second = runZentaoSingleFlight(options, "collect", operation);
  gate.resolve();
  assert.deepEqual(await Promise.all([first, second]), ["done", "done"]);
  assert.equal(creates, 1);
  assert.equal(runs, 1);
});
```

Also prove different operation keys never overlap and `keepBrowserOpen:false` closes/removes the context.

- [ ] **Step 2: Run `node --test mcp/tests/zentaoSession.test.mjs`**

Expected: FAIL because the session module does not exist.

- [ ] **Step 3: Implement keyed entries**

```js
{
  contextPromise: null,
  tail: Promise.resolve(),
  inflight: new Map(),
  closed: false
}
```

Move `defaultProfileDir` and `launchPersistentChrome` from the collector into this module. Chain exclusive work with `entry.tail.then(run, run)`, create context lazily, invalidate on `context.on?.("close")`, and delete only the matching in-flight promise in `finally`.

- [ ] **Step 4: Route collection through single-flight**

Extract `collectAssignedZentaoWorkItemsInContext(context, options)`. Build a flight key from URL, maxTasks, maxBugs, pageSize, and includeRawText. Make legacy task collection call the unified collector, filter `kind === "task"`, run `analyzeZentaoTasks` on that filtered set, and return the existing legacy fields/Markdown without launching another context.

- [ ] **Step 5: Add collector concurrency regression**

Start two collection calls against one delayed fixture and assert one `contextFactory` call, one login/navigation path, and deeply equal results.

- [ ] **Step 6: Run tests**

Run: `node --test mcp/tests/zentaoSession.test.mjs mcp/tests/zentaoCollector.test.mjs`

Expected: PASS without real Chrome.

- [ ] **Step 7: Commit**

```powershell
git add -- mcp/src/zentaoSession.mjs mcp/src/zentaoCollector.mjs mcp/tests/zentaoSession.test.mjs mcp/tests/zentaoCollector.test.mjs
git commit -m "feat: serialize zentao browser sessions"
```

---

### Task 4: Direct Task scheduling

**Files:**
- Create: `mcp/src/zentaoWriter.mjs`
- Create: `mcp/tests/zentaoWriter.test.mjs`
- Modify: `mcp/src/zentaoCollector.mjs`

**Interfaces:**
- Produces: `normalizeScheduleGroups(groups)`.
- Produces: `selectExactWorkItemIds(scope, ids)`.
- Produces: `fillTaskBatchEdit(scope, { deadline, hours })`.
- Produces: `scheduleZentaoTasks(options)` returning requested/succeeded/failed/groups.

- [ ] **Step 1: Add failing schedule validation tests**

```js
assert.deepEqual(normalizeScheduleGroups([
  { module: "采购模块", deadline: "2026-09-02", tasks: [{ id: "100", hours: 1 }] }
]), [{ module: "采购模块", deadline: "2026-09-02", hours: 1, ids: ["100"] }]);
assert.throws(() => normalizeScheduleGroups([
  { module: "采购模块", deadline: "2026-09-02", tasks: [{ id: "9328", kind: "bug", hours: 1 }] }
]), /only accepts Zentao Tasks/);
```

Also reject duplicate/empty IDs, non-ISO dates, and hours outside `1|2`; split different hours into separate batches.

- [ ] **Step 2: Run `node --test mcp/tests/zentaoWriter.test.mjs`**

Expected: FAIL because the writer does not exist.

- [ ] **Step 3: Implement validation and exact row selection**

Use only scoped `tr,[role='row'],.dtable-row` rows and `input[type='checkbox']:not([disabled])`. Match an exact ID token, never click the header select-all checkbox, then re-read selected row IDs and require exact sorted equality.

- [ ] **Step 4: Add failing UI-order test**

Assert the adapter/fixture log equals:

```js
["set-page-size:2000", "select:100,101", "click-edit", "status:doing",
 "deadline:2026-09-02", "estimate:2", "consumed:2", "left:2", "save", "verify:100,101"]
```

- [ ] **Step 5: Implement scheduling execution**

For each module/date/hour batch: reopen assigned Task list, call `setZentaoPageSize(..., 2000)`, select exact IDs, click visible bottom-left `编辑`, choose `doing|进行中`, fill deadline, and fill the same `1` or `2` into estimate/consumed/remaining. Save and re-read details. Stop a mismatched batch before save; never accept Bugs.

- [ ] **Step 6: Run `node --test mcp/tests/zentaoWriter.test.mjs`**

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- mcp/src/zentaoWriter.mjs mcp/src/zentaoCollector.mjs mcp/tests/zentaoWriter.test.mjs
git commit -m "feat: schedule zentao tasks by exact ids"
```

---

### Task 5: Verified work-item closing

**Files:**
- Modify: `mcp/src/zentaoWriter.mjs`
- Modify: `mcp/tests/zentaoWriter.test.mjs`

**Interfaces:**
- Produces: `normalizeCloseItems(items)`.
- Produces: `closeZentaoWorkItems(options)` returning requested/succeeded/blocked/failed.
- No preview/apply/confirmed mode exists.

- [ ] **Step 1: Add failing close tests**

```js
assert.deepEqual(normalizeCloseItems([{
  kind: "bug", id: "9328", title: "打印错误", completed: true, verified: true
}]), [{ kind: "bug", id: "9328", url: "", title: "打印错误" }]);
assert.throws(() => normalizeCloseItems([{
  kind: "task", id: "100", completed: true, verified: false
}]), /completed and verified/);
```

Also reject duplicate IDs and kinds outside `task|bug`.

- [ ] **Step 2: Run close-pattern writer tests**

Run: `node --test --test-name-pattern="close" mcp/tests/zentaoWriter.test.mjs`

Expected: FAIL because close functions are absent.

- [ ] **Step 3: Implement close navigation**

Inside the shared exclusive session, open each detail URL, click exact visible `关闭`, inspect required controls, and submit only if all visible required fields already have values. Reopen the detail and require `已关闭|closed` status.

For an empty required Bug field, return exactly:

```js
{ kind: "bug", id: "9328", status: "blocked", missingFields: ["解决方案"], message: "关闭页面需要额外字段，未自动编造值" }
```

Process items independently into `succeeded`, `blocked`, and `failed`.

- [ ] **Step 4: Add DOM tests**

The Task fixture records `close -> submit -> verify`. The Bug fixture has an empty required `解决方案` select; assert submit never fires and the item is blocked.

- [ ] **Step 5: Run `node --test mcp/tests/zentaoWriter.test.mjs`**

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- mcp/src/zentaoWriter.mjs mcp/tests/zentaoWriter.test.mjs
git commit -m "feat: close verified zentao work items"
```

---

### Task 6: Expose unified MCP tools

**Files:**
- Modify: `mcp/src/server.mjs`
- Modify: `mcp/tests/serverSmoke.test.mjs`
- Modify: `mcp/tests/cursorPluginDistribution.test.mjs`

**Interfaces:**
- Adds `zentao_collect_assigned_work_items`, `zentao_analyze_work_items`, `zentao_schedule_tasks`, `zentao_close_work_items`.
- Preserves both legacy tool names.

- [ ] **Step 1: Extend smoke test to expect all six tools**

Call `zentao_analyze_work_items` with one Task and one Bug; require `禅道需求`, `禅道Bug`, `贸易系统`, and the final plan header.

- [ ] **Step 2: Run `node --test mcp/tests/serverSmoke.test.mjs`**

Expected: FAIL because four tools are not registered.

- [ ] **Step 3: Add exact schemas**

Collect accepts browser options plus `maxTasks|maxBugs|pageSize`. Analyze accepts complete `workItems[]`. Schedule requires grouped module/deadline/tasks with `id`, `kind`, and `hours`. Close requires items with `kind`, `id`, `completed`, `verified`, plus optional URL/title. Do not add preview/apply/confirmed fields.

- [ ] **Step 4: Route calls and return Markdown plus JSON**

Use the existing two-content-block convention for collect/analyze. Schedule/close return a readable result Markdown block plus the exact JSON result.

- [ ] **Step 5: Run source tests**

Run: `node --test mcp/tests/serverSmoke.test.mjs mcp/tests/zentaoAnalyzer.test.mjs mcp/tests/zentaoCollector.test.mjs mcp/tests/zentaoWriter.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- mcp/src/server.mjs mcp/tests/serverSmoke.test.mjs mcp/tests/cursorPluginDistribution.test.mjs
git commit -m "feat: expose unified zentao workflow tools"
```

---

### Task 7: Update skill, command, and docs

**Files:**
- Modify: `skills/t-zentao/SKILL.md`
- Modify: `commands/t-zentao-collect.md`
- Modify: `mcp/README.md`
- Modify: `mcp/tests/zentaoWorkflowPolicy.test.mjs`

**Interfaces:**
- The main agent collects once, prints current branch, performs module analysis, asks only shared scope questions, directly schedules complete instructions, and asks once before closing.

- [ ] **Step 1: Add failing policy assertions**

```js
for (const text of [skill, command]) {
  assert.match(text, /zentao_collect_assigned_work_items/);
  assert.match(text, /pageSize.*2000/s);
  assert.match(text, /禅道需求/);
  assert.match(text, /禅道Bug/);
  assert.match(text, /当前开发分支/);
  assert.match(text, /详细处理方案与对应位置/);
  assert.match(text, /共享组件/);
  assert.doesNotMatch(text, /HEAD|Git 最近修改者|工作区状态/);
}
```

Also require that module execution never recollects/logs in, Bugs never enter scheduling, complete schedules execute without a second confirmation, and closing asks once.

- [ ] **Step 2: Run `node --test mcp/tests/zentaoWorkflowPolicy.test.mjs`**

Expected: FAIL against task-only docs.

- [ ] **Step 3: Rewrite `t-zentao` in eight phases**

Use sections: single login/collection; scene/system; current branch; code module analysis; normalized output; shared component question; Task scheduling; completion conclusion and closing. Include the exact 12-column table and keep the detailed plan last. In scheduling, resolve `后天`, `大后天`, and other relative dates against `Asia/Shanghai`, show the resulting `YYYY-MM-DD`, and call the writer immediately once every module has a date.

- [ ] **Step 4: Update command and README**

Default the command to the unified tool with `maxTasks`, `maxBugs`, and `pageSize` equal to `2000`. Document four new and two legacy tools, single-session behavior, direct scheduling, and one-question closing.

- [ ] **Step 5: Validate**

```powershell
python "C:\Users\huanghe\.codex\skills\.system\skill-creator\scripts\quick_validate.py" skills/t-zentao
node --test mcp/tests/zentaoWorkflowPolicy.test.mjs
```

Expected: skill valid; tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- skills/t-zentao/SKILL.md commands/t-zentao-collect.md mcp/README.md mcp/tests/zentaoWorkflowPolicy.test.mjs
git commit -m "docs: standardize the zentao developer workflow"
```

---

### Task 8: Bundle and verify

**Files:**
- Regenerate: `mcp/dist/server.mjs`
- Verify: all prior source/test/docs files.

**Interfaces:**
- Produces a distributable MCP exposing all six Zentao tools.

- [ ] **Step 1: Build**

Run from `mcp`: `npm run build`

Expected: bundled server path printed and exit code `0`.

- [ ] **Step 2: Test bundled distribution**

Run: `node --test mcp/tests/cursorPluginDistribution.test.mjs`

Expected: PASS; isolated bundled server lists all six tools.

- [ ] **Step 3: Run full suite**

Run from `mcp`: `npm test`

Expected: all tests PASS; tests do not mutate real Zentao.

- [ ] **Step 4: Inspect changes**

```powershell
git status --short
git diff --check
git diff --stat
git diff -- mcp/src mcp/tests skills/t-zentao commands/t-zentao-collect.md mcp/README.md
```

Expected: no whitespace error, dependency/vendor drift, or unplanned file.

- [ ] **Step 5: Run bounded real read-only collection**

From `mcp`, run:

```powershell
node --input-type=module -e "import { collectAssignedZentaoWorkItems } from './src/zentaoCollector.mjs'; const result=await collectAssignedZentaoWorkItems({maxTasks:1,maxBugs:1,pageSize:2000,keepBrowserOpen:false,headless:false,loginWaitMs:120000}); console.log(JSON.stringify({taskCount:result.taskCount,bugCount:result.bugCount,scenes:result.workItems.map(x=>x.scene),systems:result.workItems.map(x=>x.system),errors:result.collectionErrors},null,2));"
```

Expected: at most one visible login window; Task and Bug lists attempted; no write operation. If login is unavailable, record the exact login-needed result and do not run writer tools.

- [ ] **Step 6: Commit generated bundle**

```powershell
git add -- mcp/dist/server.mjs
git commit -m "build: bundle unified zentao workflow"
```

- [ ] **Step 7: Final verification**

Run `git status --short` and `git log -8 --oneline`.

Expected: clean worktree and focused implementation commits after the approved design commits.
