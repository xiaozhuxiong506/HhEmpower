import assert from "node:assert/strict";
import test from "node:test";
import { generateZentaoDailyLog } from "../src/zentaoDailyLog.mjs";

const beijingBoundary = new Date("2026-06-26T16:30:00.000Z");

test("uses only completed and verified items and totals exactly 8.5h", () => {
  const result = generateZentaoDailyLog([
    {
      id: "TASK-101",
      kind: "task",
      module: "  财务模块 \n",
      title: "厂商付款审批详情",
      completionSummary: " 完成厂商付款审批详情页面 \n",
      completed: true,
      verified: true
    },
    {
      id: "BUG-202",
      kind: "bug",
      module: "销售模块",
      title: "出货生成应收单报错",
      completionSummary: "修复客户出货单生成应收单规则问题",
      completed: true,
      verified: true
    },
    {
      id: "BUG-303",
      kind: "bug",
      module: "采购模块",
      title: "未完成事项",
      completionSummary: "未完成事项不应出现",
      completed: false,
      verified: true
    }
  ], { now: beijingBoundary });

  assert.equal(result.canGenerate, true);
  assert.equal(result.date, "2026-06-27");
  assert.equal(result.sourceItemCount, 2);
  assert.equal(result.totalHours, 8.5);
  assert.ok(result.entries.every(entry => Number.isInteger(entry.hours * 2)));
  assert.ok(result.entries.every(entry => entry.hours >= 0.5));
  assert.deepEqual(
    result.entries.map(entry => entry.description),
    [
      "财务模块：完成厂商付款审批详情页面",
      "销售模块：修复客户出货单生成应收单规则问题"
    ]
  );
  assert.match(result.markdown, /^2026-06-27 完成事项\n1\.财务模块：完成厂商付款审批详情页面 \d+(?:\.5)?h/m);
  assert.match(result.markdown, /总结：日常任务及Bug开发$/);
  assert.doesNotMatch(result.markdown, /未完成|TASK-101|BUG-202|BUG-303/);
});

test("assigns all 8.5 hours to one verified item", () => {
  const result = generateZentaoDailyLog([
    {
      kind: "task",
      module: "采购模块",
      title: "新增供应商接口",
      completionSummary: "",
      completed: true,
      verified: true
    }
  ], { now: beijingBoundary });

  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].hours, 8.5);
  assert.equal(result.totalHours, 8.5);
  assert.equal(
    result.markdown,
    "2026-06-27 完成事项\n1.采购模块：新增供应商接口 8.5h\n总结：日常任务开发"
  );
});

test("consolidates more than 17 related inputs and preserves their kinds", () => {
  const items = Array.from({ length: 24 }, (_, index) => ({
    kind: index % 2 === 0 ? "task" : "bug",
    module: "财务模块",
    title: `付款审批详情-字段${index + 1}`,
    completionSummary: `${index % 2 === 0 ? "新增" : "修复"}付款审批详情字段${index + 1}`,
    completed: true,
    verified: true
  }));

  const result = generateZentaoDailyLog(items, { now: beijingBoundary });

  assert.equal(result.sourceItemCount, 24);
  assert.ok(result.entries.length > 0 && result.entries.length <= 17);
  assert.equal(result.totalHours, 8.5);
  assert.ok(result.entries.every(entry => Number.isInteger(entry.hours * 2)));
  assert.ok(result.entries.some(entry => entry.kinds.includes("task") && entry.kinds.includes("bug")));
  assert.match(result.markdown, /总结：日常任务及Bug开发$/);
});

test("returns no generated log when no item is both completed and verified", () => {
  for (const items of [
    [],
    [
      { title: "仅完成", completed: true, verified: false },
      { title: "仅验证", completed: false, verified: true }
    ]
  ]) {
    assert.deepEqual(generateZentaoDailyLog(items, { now: beijingBoundary }), {
      canGenerate: false,
      sourceItemCount: 0,
      entries: [],
      totalHours: 0,
      markdown: ""
    });
  }
});

test("treats null options as default options", () => {
  const result = generateZentaoDailyLog([
    {
      module: "财务模块",
      title: "付款审批",
      completed: true,
      verified: true
    }
  ], null);

  assert.equal(result.canGenerate, true);
  assert.equal(result.totalHours, 8.5);
  assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
});

test("rejects an invalid injected date with a clear TypeError", () => {
  assert.throws(
    () => generateZentaoDailyLog([
      {
        module: "财务模块",
        title: "付款审批",
        completed: true,
        verified: true
      }
    ], { now: new Date("invalid") }),
    error => error instanceof TypeError && /options\.now must be a valid date/i.test(error.message)
  );
});

test("excludes verified items without a title or completion summary", () => {
  assert.deepEqual(generateZentaoDailyLog([
    {
      module: "财务模块",
      title: " \n ",
      completionSummary: "\t",
      completed: true,
      verified: true
    }
  ], { now: beijingBoundary }), {
    canGenerate: false,
    sourceItemCount: 0,
    entries: [],
    totalHours: 0,
    markdown: ""
  });
});

test("normalizes every kind except explicit lowercase bug to task", () => {
  const result = generateZentaoDailyLog([
    {
      kind: "Bug",
      module: "销售模块",
      title: "应收单检查",
      completed: true,
      verified: true
    }
  ], { now: beijingBoundary });

  assert.deepEqual(result.entries[0].kinds, ["task"]);
  assert.match(result.markdown, /总结：日常任务开发$/);
});

test("normalizes full-width and ASCII topic text with Unicode NFKC", () => {
  const result = generateZentaoDailyLog([
    {
      module: "公共基础模块",
      title: "ＡＢＣ接口",
      completionSummary: "完成全角主题结果",
      completed: true,
      verified: true
    },
    {
      module: "公共基础模块",
      title: "ABC接口",
      completionSummary: "完成半角主题结果",
      completed: true,
      verified: true
    }
  ], { now: beijingBoundary });

  assert.equal(result.entries.length, 1);
  assert.match(result.markdown, /完成全角主题结果/);
  assert.match(result.markdown, /完成半角主题结果/);
});

test("retains every module and summary when 18 unrelated outcomes are compressed", () => {
  const items = Array.from({ length: 18 }, (_, index) => {
    const token = String(index).padStart(2, "0");
    return {
      module: `模块${token}`,
      title: `独立主题${token}`,
      completionSummary: `完成唯一结果<${token}>`,
      completed: true,
      verified: true
    };
  });

  const result = generateZentaoDailyLog(items, { now: beijingBoundary });

  assert.equal(result.entries.length, 17);
  assert.equal(result.totalHours, 8.5);
  for (const item of items) {
    assert.ok(
      result.markdown.includes(`${item.module}：${item.completionSummary}`),
      `missing outcome ${item.module}：${item.completionSummary}`
    );
  }
});

test("produces identical consolidation and allocation for bridge-topic permutations", () => {
  const paymentApi = {
    kind: "task",
    module: "财务模块",
    title: "paymentapi",
    completionSummary: "完成付款接口",
    completed: true,
    verified: true
  };
  const paymentApiFlow = {
    kind: "task",
    module: "财务模块",
    title: "paymentapiflow",
    completionSummary: "新增付款接口流程",
    completed: true,
    verified: true
  };
  const apiFlow = {
    kind: "task",
    module: "财务模块",
    title: "apiflow",
    completionSummary: "重构付款流程",
    completed: true,
    verified: true
  };
  const unrelatedBug = {
    kind: "bug",
    module: "销售模块",
    title: "receivables",
    completionSummary: "修复应收单接口问题",
    completed: true,
    verified: true
  };
  const permutations = [
    [paymentApi, apiFlow, paymentApiFlow, unrelatedBug],
    [unrelatedBug, paymentApiFlow, paymentApi, apiFlow],
    [apiFlow, unrelatedBug, paymentApiFlow, paymentApi]
  ];
  const results = permutations.map(items =>
    generateZentaoDailyLog(items, { now: beijingBoundary })
  );

  assert.equal(results[0].entries.length, 2);
  for (const result of results.slice(1)) {
    assert.deepEqual(result.entries, results[0].entries);
    assert.equal(result.markdown, results[0].markdown);
  }
  for (const summary of [
    "完成付款接口",
    "新增付款接口流程",
    "重构付款流程",
    "修复应收单接口问题"
  ]) {
    assert.match(results[0].markdown, new RegExp(summary));
  }
});

test("compresses 400 distinct outcomes without loss within two seconds", () => {
  const items = Array.from({ length: 400 }, (_, index) => {
    const token = String(index).padStart(3, "0");
    return {
      module: `性能模块${token}`,
      title: `独立性能主题${token}`,
      completionSummary: `完成性能结果<${token}>`,
      completed: true,
      verified: true
    };
  });

  const startedAt = performance.now();
  const result = generateZentaoDailyLog(items, { now: beijingBoundary });
  const elapsedMs = performance.now() - startedAt;

  assert.ok(elapsedMs < 2000, `generation took ${elapsedMs.toFixed(1)}ms`);
  assert.equal(result.sourceItemCount, 400);
  assert.equal(result.entries.length, 17);
  assert.equal(result.totalHours, 8.5);
  for (const item of items) {
    assert.ok(
      result.markdown.includes(`${item.module}：${item.completionSummary}`),
      `missing outcome ${item.module}：${item.completionSummary}`
    );
  }
});

test("uses task-only and bug-only summary labels", () => {
  const taskOnly = generateZentaoDailyLog([
    {
      kind: "BUG",
      module: " 公共基础模块 ",
      title: " 重构  查询   流程 ",
      completed: true,
      verified: true
    }
  ], { now: beijingBoundary });
  const bugOnly = generateZentaoDailyLog([
    {
      kind: "bug",
      module: "销售模块",
      title: "应收单报错",
      completionSummary: "修复应收单接口",
      completed: true,
      verified: true
    }
  ], { now: beijingBoundary });

  assert.equal(taskOnly.entries[0].description, "公共基础模块：重构 查询 流程");
  assert.match(taskOnly.markdown, /总结：日常任务开发$/);
  assert.match(bugOnly.markdown, /总结：日常Bug修复$/);
});

test("returns identical output for repeated calls", () => {
  const items = [
    {
      kind: "task",
      module: "财务模块",
      title: "付款审批",
      completionSummary: "新增付款审批流程",
      completed: true,
      verified: true
    },
    {
      kind: "bug",
      module: "销售模块",
      title: "应收单报错",
      completionSummary: "修复应收单接口问题",
      completed: true,
      verified: true
    },
    {
      kind: "task",
      module: "采购模块",
      title: "供应商资料",
      completionSummary: "重构供应商资料页面",
      completed: true,
      verified: true
    }
  ];

  assert.deepEqual(
    generateZentaoDailyLog(items, { now: beijingBoundary }),
    generateZentaoDailyLog(items, { now: beijingBoundary })
  );
});
