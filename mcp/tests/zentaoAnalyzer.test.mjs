import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTaskModule,
  groupTasksByModule,
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
