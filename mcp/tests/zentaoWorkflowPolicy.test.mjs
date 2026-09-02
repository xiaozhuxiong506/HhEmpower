import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { analyzeZentaoWorkItems } from "../src/zentaoAnalyzer.mjs";
import {
  DEVELOPER_TABLE_COLUMNS,
  formatZentaoWorkItemAnalysisMarkdown
} from "../src/zentaoReporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

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
    "ID/链接",
    "标题",
    "场景",
    "代码模块",
    "共享影响",
    "处理人/截止"
  ]);
  assert.match(markdown, /\| 禅道需求 \| 1 \| 0 \| 0 \| 1 \|/);
  assert.match(markdown, /\| 禅道Bug \| 1 \| 0 \| 0 \| 1 \|/);
  assert.match(markdown, /## 贸易系统 · 采购模块/);
  assert.match(markdown, /## 贸易系统 · 库存仓储模块/);
  assert.match(markdown, /\[9328\]\(http:\/\/example\/bug-view-9328\.html\)/);
  const header = markdown.split("\n").find(line => line.includes("| 标题 |"));
  assert.ok(header.endsWith("| 处理人/截止 |"));
  assert.doesNotMatch(header, /HEAD|工作区|Git 最近修改者|详细处理方案/);
  assert.match(markdown, /### #9328 .*（禅道Bug）/);
  assert.match(markdown, /- 详细处理方案与对应位置：/);
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

test("t-zentao requires one unified collection and normalized developer output", () => {
  const skill = readRepoFile("skills/t-zentao/SKILL.md");

  assert.match(skill, /zentao_collect_assigned_work_items/);
  assert.match(skill, /同一次工作流只调用一次统一采集/);
  assert.match(skill, /模块执行者.*不得.*重新采集|不得.*模块执行者.*重新采集/s);
  assert.match(skill, /\[禅道需求\].*\[禅道Bug\]/s);
  assert.match(skill, /TSBERP.*贸易系统/s);
  assert.match(skill, /HALLERP.*展厅系统/s);
  assert.match(skill, /当前分支/);
  assert.match(skill, /不要固定输出仓库路径、HEAD、工作区状态、文件级 Git 最近修改者/);
  assert.match(skill, /详细处理方案与对应位置/);
});

test("t-zentao hard-gates shared components scheduling and Bug resolution", () => {
  const skill = readRepoFile("skills/t-zentao/SKILL.md");

  assert.match(skill, /共享组件/);
  assert.match(skill, /都改.*只改其中一个|只改其中一个.*都改/s);
  assert.match(skill, /用户确认前不得修改/);
  assert.match(skill, /排期仅允许 Task/);
  assert.match(skill, /Asia\/Shanghai/);
  assert.match(skill, /1h.*2h|2h.*1h/s);
  assert.match(skill, /设置为进行中/);
  assert.match(skill, /zentao_schedule_tasks/);
  assert.match(skill, /完成且验证通过/);
  assert.match(skill, /询问一次.*是否解决/s);
  assert.match(skill, /zentao_resolve_bugs/);
  assert.match(skill, /解决版本.*主干/s);
  assert.match(skill, /解决日期.*前 30 分钟/s);
  assert.match(skill, /其他字段.*不改/s);
  assert.doesNotMatch(skill, /批量关单|关闭工单/);
});

test("slash command and MCP README advertise the unified workflow", () => {
  const command = readRepoFile("commands/t-zentao-collect.md");
  const readme = readRepoFile("mcp/README.md");

  for (const text of [command, readme]) {
    assert.match(text, /zentao_collect_assigned_work_items/);
    assert.match(text, /zentao_schedule_tasks/);
    assert.match(text, /zentao_resolve_bugs/);
  }
  assert.match(command, /pageSize.*2000/s);
  assert.match(command, /当前分支/);
});
