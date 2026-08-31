import assert from "node:assert/strict";
import test from "node:test";
import { analyzeZentaoWorkItems } from "../src/zentaoAnalyzer.mjs";
import {
  DEVELOPER_TABLE_COLUMNS,
  formatZentaoWorkItemAnalysisMarkdown
} from "../src/zentaoReporter.mjs";

test("developer report groups by system and module with handling plan last", () => {
  const analysis = analyzeZentaoWorkItems([
    {
      kind: "task",
      id: "100",
      title: "采购单新增字段",
      project: "TSBERP一期",
      product: "TSBERP1.0",
      creator: "张三",
      assignee: "黄河",
      deadline: "2026-09-02",
      module: "采购模块",
      handlingPlan: "修改 D:/company/Tsb.TradeErp.PC/src/procurement.vue:20；验证保存"
    },
    {
      kind: "bug",
      id: "9328",
      url: "http://example/bug-view-9328.html",
      title: "订单出库打印缺少参数",
      product: "TSBERP1.0",
      creator: "林彦林",
      module: "库存仓储模块",
      sharedImpact: ["出库模块", "调拨模块"]
    }
  ]);

  const markdown = formatZentaoWorkItemAnalysisMarkdown(analysis);

  assert.deepEqual(DEVELOPER_TABLE_COLUMNS, [
    "场景",
    "所属项目",
    "所属产品",
    "ID/链接",
    "标题",
    "创建者",
    "当前处理人",
    "截止日期",
    "代码模块",
    "共享影响",
    "待确认项",
    "详细处理方案与对应位置"
  ]);
  assert.match(markdown, /\| 禅道需求 \| 1 \| 0 \| 0 \| 1 \|/);
  assert.match(markdown, /\| 禅道Bug \| 1 \| 0 \| 0 \| 1 \|/);
  assert.match(markdown, /## 贸易系统 · 采购模块/);
  assert.match(markdown, /## 贸易系统 · 库存仓储模块/);
  assert.match(markdown, /\[9328\]\(http:\/\/example\/bug-view-9328\.html\)/);
  const header = markdown.split("\n").find(line => line.includes("| 所属项目 |"));
  assert.ok(header.endsWith("| 详细处理方案与对应位置 |"));
  assert.doesNotMatch(header, /HEAD|工作区|Git 最近修改者/);
});

test("developer report escapes table-breaking source text", () => {
  const markdown = formatZentaoWorkItemAnalysisMarkdown(analyzeZentaoWorkItems([
    {
      kind: "bug",
      id: "2",
      title: "A | B\n第二行",
      product: "HALLERP",
      module: "销售模块"
    }
  ]));

  assert.match(markdown, /A \\\| B 第二行/);
});
