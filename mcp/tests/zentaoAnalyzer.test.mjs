import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeZentaoTasks,
  analyzeZentaoWorkItems,
  classifyTaskModule,
  groupTasksByModule,
  groupWorkItemsByModule,
  normalizeWorkItem,
  normalizeTaskText,
  toAgentExecutionPlan
} from "../src/zentaoAnalyzer.mjs";

test("classifies common ERP module keywords", () => {
  assert.equal(
    classifyTaskModule({
      title: "采购模块-复制产品后供应商价格未带出",
      description: "采购单新增时产品资料字段异常"
    }),
    "采购模块"
  );

  assert.equal(
    classifyTaskModule({
      title: "销售订单详情页按钮权限异常",
      description: "客户报价后生成销售订单失败"
    }),
    "销售模块"
  );

  assert.equal(
    classifyTaskModule({
      title: "仓库入库单列表查询字段缺失",
      description: "库存流水筛选条件不完整"
    }),
    "库存仓储模块"
  );

  assert.equal(
    classifyTaskModule({
      title: "登录后菜单折叠状态不正确",
      description: "没有明显业务关键词"
    }),
    "公共基础模块"
  );
});

test("normalizes empty Zentao description placeholders", () => {
  assert.equal(normalizeTaskText("暂无描述"), "");
  assert.equal(normalizeTaskText(" 暂无描述\n"), "");
  assert.equal(normalizeTaskText("暂无"), "");
  assert.equal(normalizeTaskText("  修复列表字段  "), "修复列表字段");
});

test("groups tasks by module and emits multi-agent execution prompts", () => {
  const tasks = [
    {
      id: "101",
      url: "http://hallzd.internal.tsb.com/zentao/task-view-101.html",
      title: "采购订单复制产品失败",
      description: "产品资料复制后采购价格字段为空",
      remarks: "复现环境 trade.tsbsoft.com"
    },
    {
      id: "102",
      url: "http://hallzd.internal.tsb.com/zentao/task-view-102.html",
      title: "销售订单导出缺少客户字段",
      description: "销售列表导出字段不全",
      remarks: ""
    },
    {
      id: "103",
      url: "http://hallzd.internal.tsb.com/zentao/task-view-103.html",
      title: "采购供应商选择弹窗分页错误",
      description: "供应商列表分页切换后未刷新",
      remarks: ""
    }
  ];

  const groups = groupTasksByModule(tasks);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map(group => group.module), ["采购模块", "销售模块"]);
  assert.equal(groups[0].tasks.length, 2);
  assert.equal(groups[1].tasks.length, 1);

  const plan = toAgentExecutionPlan(groups);
  assert.equal(plan.length, 2);
  assert.equal(plan[0].agentName, "tsb-module-agent-采购模块");
  assert.match(plan[0].prompt, /采购订单复制产品失败/);
  assert.match(plan[0].prompt, /供应商选择弹窗分页错误/);
  assert.match(plan[1].prompt, /销售订单导出缺少客户字段/);
});

test("analyzes mixed Zentao tasks and bugs as work items", () => {
  const analysis = analyzeZentaoWorkItems([
    { id: "1", kind: "task", title: "采购订单增加审批详情" },
    { id: "2", kind: "bug", title: "销售出货生成应收单报错" }
  ]);

  assert.equal(analysis.workItemCount, 2);
  assert.equal(analysis.taskCount, 1);
  assert.equal(analysis.bugCount, 1);
  assert.deepEqual(
    analysis.groups.flatMap(group => group.workItems.map(item => item.kind)),
    ["task", "bug"]
  );
  assert.match(
    analysis.agentPlan.find(plan => plan.module === "销售模块").prompt,
    /类型：Bug/
  );
  assert.match(analysis.agentPlan[0].prompt, /completed/);
  assert.match(analysis.agentPlan[0].prompt, /verified/);
  assert.match(analysis.agentPlan[0].prompt, /completionSummary/);
});

test("normalizes unknown work item kinds to task", () => {
  assert.equal(normalizeWorkItem({ kind: "story", title: "新增报表" }).kind, "task");
});

test("preserves explicit module values without normalization", () => {
  assert.equal(
    normalizeWorkItem({ module: "  自定义模块  ", title: "新增报表" }).module,
    "  自定义模块  "
  );
  assert.equal(normalizeWorkItem({ module: 42, title: "新增报表" }).module, 42);
});

test("keeps tasks synchronized with workItems through mutation and reassignment", () => {
  const [group] = groupWorkItemsByModule([
    { kind: "task", title: "采购订单增加审批详情" }
  ]);

  assert.ok(Object.keys(group).includes("tasks"));
  assert.strictEqual(group.tasks, group.workItems);

  group.tasks.push({ kind: "bug", title: "采购订单审批报错" });
  assert.equal(group.workItems.length, 2);
  assert.equal(group.workItemCount, 2);
  assert.equal(group.taskCount, 1);
  assert.equal(group.bugCount, 1);

  const tasksReplacement = [{ kind: "task", title: "采购订单修改" }];
  group.tasks = tasksReplacement;
  assert.strictEqual(group.workItems, tasksReplacement);
  assert.strictEqual(group.tasks, tasksReplacement);
  assert.equal(group.workItemCount, 1);
  assert.equal(group.taskCount, 1);
  assert.equal(group.bugCount, 0);

  const workItemsReplacement = [{ kind: "bug", title: "采购订单保存报错" }];
  group.workItems = workItemsReplacement;
  assert.strictEqual(group.tasks, workItemsReplacement);
  assert.equal(group.workItemCount, 1);
  assert.equal(group.taskCount, 0);
  assert.equal(group.bugCount, 1);

  const serializedGroup = JSON.parse(JSON.stringify(group));
  assert.equal(serializedGroup.workItemCount, 1);
  assert.equal(serializedGroup.taskCount, 0);
  assert.equal(serializedGroup.bugCount, 1);
});

test("counts mixed same-module work items and sorts groups by work item count", () => {
  const analysis = analyzeZentaoWorkItems([
    { kind: "task", title: "销售订单增加审批详情" },
    { kind: "bug", title: "销售出货生成应收单报错" },
    { kind: "task", title: "采购订单增加审批详情" }
  ]);

  assert.deepEqual(analysis.groups.map(group => group.module), ["销售模块", "采购模块"]);

  const salesGroup = analysis.groups[0];
  assert.equal(salesGroup.workItemCount, 2);
  assert.equal(salesGroup.taskCount, 1);
  assert.equal(salesGroup.bugCount, 1);

  const salesPlan = analysis.agentPlan[0];
  assert.equal(salesPlan.workItemCount, 2);
  assert.equal(salesPlan.taskCount, 1);
  assert.equal(salesPlan.bugCount, 1);
});

test("analyzeZentaoTasks treats inputs carrying bug kinds as tasks", () => {
  const analysis = analyzeZentaoTasks([
    { kind: "bug", title: "销售出货生成应收单报错" }
  ]);

  assert.equal(analysis.taskCount, 1);
  assert.equal(analysis.groups[0].taskCount, 1);
  assert.equal(analysis.agentPlan[0].taskCount, 1);
  assert.equal(analysis.groups[0].workItems[0].kind, "task");
  assert.match(analysis.agentPlan[0].prompt, /类型：任务/);
});
