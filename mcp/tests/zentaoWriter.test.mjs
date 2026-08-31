import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { closeAllZentaoSessions } from "../src/zentaoSession.mjs";
import {
  fillTaskBatchEdit,
  normalizeScheduleGroups,
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
