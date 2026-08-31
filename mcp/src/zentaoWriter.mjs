import {
  extractWorkItemDetail,
  findZentaoContentFrame,
  openAssignedWorkItemList,
  setZentaoPageSize
} from "./zentaoCollector.mjs";
import { runZentaoExclusive } from "./zentaoSession.mjs";

const DEFAULT_ZENTAO_URL = "http://hallzd.internal.tsb.com/zentao/my.html";

function requireIsoDate(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new TypeError("Zentao schedule deadline must use YYYY-MM-DD");
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new TypeError("Zentao schedule deadline must be a valid YYYY-MM-DD date");
  }
  return text;
}

export function normalizeScheduleGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new TypeError("Zentao schedule requires at least one Task group");
  }

  const seenIds = new Set();
  const batches = new Map();
  for (const group of groups) {
    const module = String(group?.module || "").trim();
    if (!module) throw new TypeError("Zentao schedule group requires a module");
    const deadline = requireIsoDate(group?.deadline);
    if (!Array.isArray(group?.tasks) || group.tasks.length === 0) {
      throw new TypeError(`Zentao schedule group ${module} requires Tasks`);
    }

    for (const task of group.tasks) {
      if (task?.kind && task.kind !== "task") {
        throw new TypeError("Zentao scheduling only accepts Zentao Tasks");
      }
      const id = String(task?.id || "").trim();
      if (!/^\d+$/.test(id)) throw new TypeError("Zentao schedule requires numeric Task IDs");
      if (seenIds.has(id)) throw new TypeError(`Zentao schedule contains duplicate Task ID ${id}`);
      seenIds.add(id);
      const hours = Number(task?.hours);
      if (hours !== 1 && hours !== 2) {
        throw new TypeError("Zentao schedule hours must be 1 or 2");
      }

      const key = `${module}\u0000${deadline}\u0000${hours}`;
      if (!batches.has(key)) batches.set(key, { module, deadline, hours, ids: [] });
      batches.get(key).ids.push(id);
    }
  }
  return Array.from(batches.values());
}

export async function selectExactWorkItemIds(scope, ids) {
  const requested = ids.map(String);
  return scope.evaluate(requestedIds => {
    const rowSelectors = "tbody tr,[role='row'][data-id],.dtable-row";
    const rows = Array.from(document.querySelectorAll(rowSelectors));
    const rowId = row => {
      for (const name of ["data-id", "data-row-id", "data-key"]) {
        const value = String(row.getAttribute(name) || "").trim();
        if (/^\d+$/.test(value)) return value;
      }
      const checkboxValue = String(row.querySelector("input[type='checkbox']")?.value || "").trim();
      if (/^\d+$/.test(checkboxValue)) return checkboxValue;
      const cells = Array.from(row.querySelectorAll("td,[role='cell']"));
      for (const cell of cells) {
        const value = String(cell.textContent || "").trim();
        if (/^\d+$/.test(value)) return value;
      }
      return "";
    };

    const found = new Set();
    for (const row of rows) {
      const id = rowId(row);
      if (!requestedIds.includes(id)) continue;
      const checkbox = row.querySelector("input[type='checkbox']:not([disabled])");
      if (!checkbox) throw new Error(`Task ${id} has no selectable checkbox`);
      if (!checkbox.checked) checkbox.click();
      found.add(id);
    }

    const selected = rows
      .filter(row => row.querySelector("input[type='checkbox']:checked"))
      .map(rowId)
      .filter(Boolean)
      .sort();
    const expected = [...requestedIds].sort();
    if (found.size !== expected.length || selected.join(",") !== expected.join(",")) {
      throw new Error(`Selected Task IDs do not match request: expected ${expected}, got ${selected}`);
    }
    return requestedIds;
  }, requested);
}

async function requireFields(scope, selector, fieldName) {
  const locator = scope.locator(selector);
  const count = await locator.count();
  if (count === 0) throw new Error(`Zentao batch edit field not found: ${fieldName}`);
  return Array.from({ length: count }, (_, index) => locator.nth(index));
}

export async function fillTaskBatchEdit(scope, { deadline, hours }) {
  const statusFields = await requireFields(
    scope,
    "select[name='status'],select[name$='[status]'],select[id='status'],select[id*='status']",
    "status"
  );
  for (const field of statusFields) {
    await field.selectOption({ value: "doing" }).catch(() => field.selectOption({ label: "进行中" }));
  }

  const fieldSpecs = [
    ["input[name='deadline'],input[name$='[deadline]'],input[id='deadline'],input[id*='deadline']", "deadline", deadline],
    ["input[name='estimate'],input[name$='[estimate]'],input[id='estimate'],input[id*='estimate']", "estimate", String(hours)],
    ["input[name='consumed'],input[name$='[consumed]'],input[id='consumed'],input[id*='consumed']", "consumed", String(hours)],
    ["input[name='left'],input[name$='[left]'],input[name*='remain'],input[id='left'],input[id*='left']", "left", String(hours)]
  ];
  for (const [selector, name, value] of fieldSpecs) {
    for (const field of await requireFields(scope, selector, name)) await field.fill(value);
  }
}

async function clickVisible(scope, role, name, fallbackSelector) {
  const roleLocator = scope.getByRole?.(role, { name, exact: true });
  if (roleLocator && await roleLocator.count()) {
    await roleLocator.last().click();
    return;
  }
  const fallback = scope.locator(fallbackSelector).filter({ hasText: name });
  if (await fallback.count()) {
    await fallback.last().click();
    return;
  }
  throw new Error(`Zentao action not found: ${name}`);
}

function taskUrl(startUrl, id) {
  return new URL(`/zentao/task-view-${id}.html`, startUrl).toString();
}

function createPlaywrightScheduleAdapter(context, options) {
  const startUrl = options.url || DEFAULT_ZENTAO_URL;
  let page;
  let scope;
  return {
    async openTaskList() {
      page = context.pages()[0] || await context.newPage();
      await page.goto(startUrl, { waitUntil: "domcontentloaded" });
      scope = await openAssignedWorkItemList(page, startUrl, "task");
    },
    async setPageSize(size) {
      const changed = await setZentaoPageSize(scope, size);
      if (!changed) throw new Error(`Unable to set Zentao page size to ${size}`);
    },
    async selectIds(ids) {
      return selectExactWorkItemIds(scope, ids);
    },
    async openBatchEdit() {
      await clickVisible(scope, "link", "编辑", "a,button");
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      scope = await findZentaoContentFrame(page);
    },
    async fillTaskFields(values) {
      await fillTaskBatchEdit(scope, values);
    },
    async save() {
      await clickVisible(scope, "button", "保存", "button,a,input[type='submit']");
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    },
    async verifyTasks(ids) {
      const verified = [];
      for (const id of ids) {
        const detail = await extractWorkItemDetail(context, {
          id,
          kind: "task",
          title: `Task ${id}`,
          url: taskUrl(startUrl, id)
        });
        if (!/doing|进行中/i.test(detail.status || "")) {
          throw new Error(`Task ${id} did not enter 进行中 status`);
        }
        verified.push(id);
      }
      return verified;
    }
  };
}

export async function scheduleZentaoTasks(options = {}) {
  const groups = normalizeScheduleGroups(options.groups);
  const requested = groups.flatMap(group => group.ids);
  return runZentaoExclusive(options, async context => {
    const adapter = options.writerAdapter || createPlaywrightScheduleAdapter(context, options);
    const succeeded = [];
    const failed = [];

    for (const group of groups) {
      try {
        await adapter.openTaskList();
        await adapter.setPageSize(2000);
        const selected = await adapter.selectIds(group.ids);
        if ([...selected].sort().join(",") !== [...group.ids].sort().join(",")) {
          throw new Error("Selected Task IDs do not match the schedule batch");
        }
        await adapter.openBatchEdit();
        await adapter.fillTaskFields({ deadline: group.deadline, hours: group.hours });
        await adapter.save();
        const verified = await adapter.verifyTasks(group.ids);
        succeeded.push(...verified);
      } catch (error) {
        failed.push({
          module: group.module,
          deadline: group.deadline,
          hours: group.hours,
          ids: group.ids,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { requested, succeeded, failed, groups };
  });
}
