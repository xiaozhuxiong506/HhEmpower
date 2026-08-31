import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { closeAllZentaoSessions } from "../src/zentaoSession.mjs";
import {
  fillBugResolution,
  fillTaskBatchEdit,
  formatZentaoResolvedAt,
  normalizeResolveBugs,
  normalizeScheduleGroups,
  resolveZentaoBugs,
  scheduleZentaoTasks,
  selectExactWorkItemIds
} from "../src/zentaoWriter.mjs";

test.afterEach(async () => {
  await closeAllZentaoSessions();
});

test("normalizes Task schedules into module date and hour batches", () => {
  assert.deepEqual(normalizeScheduleGroups([
    {
      module: "采购模块",
      deadline: "2026-09-02",
      tasks: [
        { id: "100", kind: "task", hours: 1 },
        { id: "101", kind: "task", hours: 1 },
        { id: "102", kind: "task", hours: 2 }
      ]
    }
  ]), [
    { module: "采购模块", deadline: "2026-09-02", hours: 1, ids: ["100", "101"] },
    { module: "采购模块", deadline: "2026-09-02", hours: 2, ids: ["102"] }
  ]);
});

test("rejects Bugs duplicate IDs invalid dates and unsupported hours", () => {
  assert.throws(() => normalizeScheduleGroups([{
    module: "采购模块",
    deadline: "2026-09-02",
    tasks: [{ id: "9328", kind: "bug", hours: 1 }]
  }]), /only accepts Zentao Tasks/);
  assert.throws(() => normalizeScheduleGroups([{
    module: "采购模块",
    deadline: "后天",
    tasks: [{ id: "100", kind: "task", hours: 1 }]
  }]), /YYYY-MM-DD/);
  assert.throws(() => normalizeScheduleGroups([{
    module: "采购模块",
    deadline: "2026-09-02",
    tasks: [{ id: "100", kind: "task", hours: 3 }]
  }]), /1 or 2/);
  assert.throws(() => normalizeScheduleGroups([{
    module: "采购模块",
    deadline: "2026-09-02",
    tasks: [
      { id: "100", kind: "task", hours: 1 },
      { id: "100", kind: "task", hours: 1 }
    ]
  }]), /duplicate Task ID 100/);
});

test("schedules complete instructions directly in the required UI order", async () => {
  const log = [];
  const adapter = {
    async openTaskList() { log.push("open-task-list"); },
    async setPageSize(size) { log.push(`set-page-size:${size}`); },
    async selectIds(ids) { log.push(`select:${ids.join(",")}`); return ids; },
    async openBatchEdit() { log.push("click-edit"); },
    async fillTaskFields(values) {
      log.push("status:doing");
      log.push(`deadline:${values.deadline}`);
      log.push(`estimate:${values.hours}`);
      log.push(`consumed:${values.hours}`);
      log.push(`left:${values.hours}`);
    },
    async save() { log.push("save"); },
    async verifyTasks(ids) { log.push(`verify:${ids.join(",")}`); return ids; }
  };
  const result = await scheduleZentaoTasks({
    sessionKey: "schedule-order",
    keepBrowserOpen: false,
    contextFactory: async () => ({ close: async () => {}, on: () => {} }),
    writerAdapter: adapter,
    groups: [{
      module: "采购模块",
      deadline: "2026-09-02",
      tasks: [
        { id: "100", kind: "task", hours: 2 },
        { id: "101", kind: "task", hours: 2 }
      ]
    }]
  });

  assert.deepEqual(log, [
    "open-task-list",
    "set-page-size:2000",
    "select:100,101",
    "click-edit",
    "status:doing",
    "deadline:2026-09-02",
    "estimate:2",
    "consumed:2",
    "left:2",
    "save",
    "verify:100,101"
  ]);
  assert.deepEqual(result.succeeded, ["100", "101"]);
  assert.deepEqual(result.failed, []);
});

test("selects only exact Task row checkboxes", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <table>
        <thead><tr><th><input id="select-all" type="checkbox"></th><th>ID</th></tr></thead>
        <tbody>
          <tr data-id="100"><td><input type="checkbox"></td><td>100</td></tr>
          <tr data-id="101"><td><input type="checkbox"></td><td>101</td></tr>
          <tr data-id="1100"><td><input type="checkbox"></td><td>1100</td></tr>
        </tbody>
      </table>
    `);

    assert.deepEqual(await selectExactWorkItemIds(page, ["100", "101"]), ["100", "101"]);
    assert.equal(await page.locator("#select-all").isChecked(), false);
    assert.equal(await page.locator("tr[data-id='1100'] input").isChecked(), false);
  } finally {
    await browser.close();
  }
});

test("fills only the five Task scheduling fields", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <select name="status"><option value="wait">未开始</option><option value="doing">进行中</option></select>
      <input name="deadline" value="">
      <input name="estimate" value="">
      <input name="consumed" value="">
      <input name="left" value="">
      <input name="assignedTo" value="原处理人">
    `);

    await fillTaskBatchEdit(page, { deadline: "2026-09-02", hours: 2 });
    assert.equal(await page.locator("select[name='status']").inputValue(), "doing");
    for (const name of ["estimate", "consumed", "left"]) {
      assert.equal(await page.locator(`input[name='${name}']`).inputValue(), "2");
    }
    assert.equal(await page.locator("input[name='deadline']").inputValue(), "2026-09-02");
    assert.equal(await page.locator("input[name='assignedTo']").inputValue(), "原处理人");
  } finally {
    await browser.close();
  }
});

test("normalizes only completed and verified Bug resolution inputs", () => {
  assert.deepEqual(normalizeResolveBugs([{
    kind: "bug",
    id: "9328",
    url: "http://example.test/zentao/bug-view-9328.html",
    title: "打印错误",
    completed: true,
    verified: true
  }]), [{
    kind: "bug",
    id: "9328",
    url: "http://example.test/zentao/bug-view-9328.html",
    title: "打印错误"
  }]);

  assert.throws(() => normalizeResolveBugs([{
    kind: "task", id: "100", completed: true, verified: true
  }]), /only accepts Zentao Bugs/);
  assert.throws(() => normalizeResolveBugs([{
    kind: "bug", id: "9328", completed: true, verified: false
  }]), /completed and verified/);
  assert.throws(() => normalizeResolveBugs([
    { kind: "bug", id: "9328", completed: true, verified: true },
    { kind: "bug", id: "9328", completed: true, verified: true }
  ]), /duplicate Bug ID 9328/);
});

test("formats the Bug resolution date as Asia Shanghai now minus thirty minutes", () => {
  assert.equal(
    formatZentaoResolvedAt(new Date("2026-08-31T02:00:00.000Z")),
    "2026-08-31 09:30"
  );
  assert.equal(
    formatZentaoResolvedAt(new Date("2026-08-30T16:15:00.000Z")),
    "2026-08-30 23:45"
  );
});

test("fills only resolved build and resolved date on the Bug form", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <select name="resolvedBuild"><option value="release">发布版</option><option value="trunk">主干</option></select>
      <input name="resolvedDate" value="2026-08-01 08:00">
      <select name="resolution"><option value="fixed" selected>已解决</option></select>
      <input name="assignedTo" value="原处理人">
      <textarea name="comment">原备注</textarea>
    `);
    const before = await page.locator("select[name='resolution'],input[name='assignedTo'],textarea[name='comment']")
      .evaluateAll(elements => elements.map(element => element.value));

    await fillBugResolution(page, { resolvedAt: "2026-08-31 09:30" });

    assert.equal(await page.locator("select[name='resolvedBuild']").inputValue(), "trunk");
    assert.equal(await page.locator("input[name='resolvedDate']").inputValue(), "2026-08-31 09:30");
    assert.deepEqual(
      await page.locator("select[name='resolution'],input[name='assignedTo'],textarea[name='comment']")
        .evaluateAll(elements => elements.map(element => element.value)),
      before
    );
  } finally {
    await browser.close();
  }
});

test("resolves Bugs directly with trunk and now minus thirty minutes", async () => {
  const log = [];
  const adapter = {
    async openBug(item) { log.push(`open:${item.id}`); },
    async clickResolve() { log.push("click-resolve"); },
    async fillResolution(values) {
      log.push(`resolved-build:${values.resolvedBuild}`);
      log.push(`resolved-date:${values.resolvedAt}`);
    },
    async submit() { log.push("submit"); },
    async verifyResolved(item) { log.push(`verify:${item.id}`); return true; }
  };
  const result = await resolveZentaoBugs({
    sessionKey: "resolve-order",
    keepBrowserOpen: false,
    now: new Date("2026-08-31T02:00:00.000Z"),
    contextFactory: async () => ({ close: async () => {}, on: () => {} }),
    writerAdapter: adapter,
    items: [{
      kind: "bug",
      id: "9328",
      title: "打印错误",
      completed: true,
      verified: true
    }]
  });

  assert.deepEqual(log, [
    "open:9328",
    "click-resolve",
    "resolved-build:主干",
    "resolved-date:2026-08-31 09:30",
    "submit",
    "verify:9328"
  ]);
  assert.deepEqual(result.succeeded, [{
    kind: "bug",
    id: "9328",
    status: "resolved",
    resolvedBuild: "主干",
    resolvedAt: "2026-08-31 09:30"
  }]);
  assert.deepEqual(result.failed, []);
});
