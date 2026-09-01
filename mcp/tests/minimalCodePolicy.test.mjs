import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function markdownSection(content, heading) {
  const level = heading.match(/^#+/)?.[0].length;
  assert.ok(level, `invalid Markdown heading: ${heading}`);

  const start = content.indexOf(heading);
  assert.notEqual(start, -1, `missing Markdown heading: ${heading}`);

  const bodyStart = start + heading.length;
  const rest = content.slice(bodyStart);
  const nextHeading = rest.search(new RegExp(`\\r?\\n#{1,${level}} `));
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
}

test("workflow applies a complexity budget to requirements bugs and plans", () => {
  const workflow = read("skills/t-workflow/SKILL.md");
  assert.match(workflow, /复杂度预算/);
  assert.match(workflow, /需求、Bug、方案/);
  assert.match(workflow, /问题规模.*实现复杂度/);
  assert.match(workflow, /禁止.*局部问题.*hook.*service.*manager/);
});

test("standards define reuse and abstraction thresholds", () => {
  const standards = read("skills/t-standards/reference.md");
  assert.match(standards, /最小充分实现/);
  assert.match(standards, /抽象门槛/);
  assert.match(standards, /至少两个.*调用点/);
  assert.match(standards, /现有能力.*框架\/库.*局部实现/);
});

test("small changes default to a local implementation with an explicit complexity grade", () => {
  const workflow = read("skills/t-workflow/SKILL.md");
  const reference = read("skills/t-workflow/reference.md");

  assert.match(workflow, /小型改动.*默认.*局部实现/s);
  assert.match(workflow, /功能正确.*不等于.*实现合格/s);
  assert.match(reference, /小型.*中型.*大型/s);
  assert.match(reference, /复杂度档位/);
  assert.match(reference, /最小方案/);
});

test("new files dependencies abstractions and call layers each have a necessity gate", () => {
  const standards = read("skills/t-standards/reference.md");

  for (const gate of ["新文件门禁", "新依赖门禁", "新抽象门禁", "新层级门禁"]) {
    assert.match(standards, new RegExp(gate));
  }

  assert.match(standards, /新文件.*现有文件职责.*项目既有结构/s);
  assert.match(standards, /第三方依赖.*用户确认/s);
  assert.match(standards, /至少两个.*已确认.*调用点/s);
  assert.match(standards, /只转发.*空壳/s);
});

test("planning and review expose structural cost and reject a simpler-equivalent heavy solution", () => {
  const workflowReference = read("skills/t-workflow/reference.md");
  const requirementReference = read("skills/t-requirement/reference.md");
  const reviewers = read("agents/t-spec.md") + read("commands/t-review.md");

  for (const field of ["预计修改现有文件", "预计新增文件", "新增依赖", "新增抽象或层级"]) {
    assert.match(workflowReference, new RegExp(field));
    assert.match(requirementReference, new RegExp(field));
  }

  assert.match(reviewers, /更简单方案.*同样.*满足需求/s);
  assert.match(reviewers, /新增文件.*新增依赖.*新增抽象.*调用层级/s);
});

test("global rules and review entry points reject wheel-building", () => {
  const files = [
    "rules/t-agent-guidance.mdc",
    "agents/t-spec.md",
    "agents/t-code.md",
    "commands/t-start.md",
    "commands/t-review.md"
  ];
  for (const file of files) {
    const content = read(file);
    assert.match(content, /复杂度|造轮子|过度封装/, `${file} must enforce proportional complexity`);
  }
});

test("business and complex functions require intent-focused comments", () => {
  const workflow = read("skills/t-workflow/SKILL.md");
  const standards = read("skills/t-standards/reference.md");
  const rule = read("rules/t-agent-guidance.mdc");
  const reviewers = read("agents/t-spec.md") + read("agents/t-code.md") + read("commands/t-review.md");

  assert.match(workflow, /业务函数注释门禁/);
  assert.match(standards, /注释门禁/);
  assert.match(standards, /业务目的.*关键规则.*功能作用/);
  assert.doesNotMatch(standards, /注释至少覆盖适用项[^\n]*副作用/);
  assert.match(standards, /禁止.*逐行翻译/);
  assert.match(rule, /业务\/复杂函数注释/);
  assert.match(reviewers, /业务注释|复杂函数注释/);
});

test("user corrections restore the positive requirement baseline", () => {
  const anchors = read("skills/t-page/anchors.md");
  const workflow = read("skills/t-workflow/SKILL.md");
  const workflowReference = read("skills/t-workflow/reference.md");

  assert.match(anchors, /纠错.*默认目标.*恢复.*正向需求基线/s);
  assert.match(anchors, /最终 diff 的每处修改.*正向需求/s);
  assert.match(anchors, /越界尝试不得进入.*PR 标题\/正文/s);
  assert.match(workflow, /用户纠错与范围收敛/);
  assert.match(workflow, /不得把被否决内容.*负向需求/s);
  assert.match(workflowReference, /被用户否决.*不列入.*范围外报告/s);
});

test("durable comments describe current business facts instead of correction history", () => {
  const standards = read("skills/t-standards/reference.md");

  assert.match(standards, /持久化注释只描述.*业务事实/);
  assert.match(standards, /本轮对话.*已撤销方案不属于业务事实/s);
  assert.match(standards, /长期业务、安全或合规规则.*稳定的不变量/s);
});

test("review gates reconcile requirements with the final diff and persistent artifacts", () => {
  const spec = read("agents/t-spec.md");
  const review = read("commands/t-review.md");

  assert.match(spec, /最终 diff 的每处修改.*正向需求/s);
  assert.match(spec, /纠错残留/);
  assert.match(review, /原始需求.*后续纠正.*git diff/s);
  assert.match(review, /需求-diff 对账/);
  assert.match(review, /提交和 PR 文案.*纠错残留/s);
});

test("syntax rules allow only genuinely simple single-line branches", () => {
  const standards = read("skills/t-standards/reference.md");

  assert.match(standards, /简单.*单行.*return.*continue.*break/s);
  assert.match(standards, /无花括号.*允许|允许.*无花括号/s);
  assert.match(standards, /格式化后.*换行.*花括号/s);
  assert.match(standards, /副作用.*花括号/s);
  assert.match(standards, /关键业务.*花括号/s);
  assert.match(standards, /else.*花括号/s);
});

test("constant rules prefer short unambiguous names without mechanical extraction", () => {
  const standards = read("skills/t-standards/reference.md");

  assert.match(standards, /最短.*无歧义|最短.*不产生歧义/s);
  assert.match(standards, /不重复.*上下文/s);
  assert.match(standards, /禁止.*机械.*提取.*常量/s);
  assert.match(standards, /命名空间.*简短.*成员名/s);
});

test("global entry and reviewers enforce proportional syntax and constant names", () => {
  const entry = read("rules/t-agent-guidance.mdc");
  const reviewers = read("agents/t-spec.md") + read("agents/t-code.md") + read("commands/t-review.md");

  assert.match(entry, /简单单行.*允许.*简写/s);
  assert.match(entry, /过长.*换行|换行.*过长/s);
  assert.match(reviewers, /常量.*过长|过长.*常量/s);
  assert.match(reviewers, /无花括号.*简单|简单.*无花括号/s);
});

test("business rules preserve meaningful duplication instead of hiding real differences", () => {
  const standards = read("skills/t-standards/reference.md");
  const decisionRules = markdownSection(standards, "### 决策顺序与适度重复");

  assert.match(decisionRules, /真实业务差异.*保留各自局部完整的独立实现/s);
  assert.match(decisionRules, /局部完整.*表面 DRY.*跨文件跳转/s);
  assert.match(decisionRules, /只为消除重复.*状态机.*策略模式.*配置表.*执行器/s);
  assert.match(decisionRules, /共享规则同时减少代码重复和认知成本.*小型纯函数/s);
});

test("external values normalize once at the system boundary", () => {
  const standards = read("skills/t-standards/reference.md");
  const entry = read("skills/t-standards/SKILL.md");
  const boundaryRules = markdownSection(standards, "### 边界归一化与语义类型");

  assert.match(boundaryRules, /外部数据.*边界.*归一化一次/s);
  assert.match(boundaryRules, /API mapper.*适配层.*query transform.*页面数据入口/s);
  assert.match(boundaryRules, /业务判断.*禁止.*散落.*Number.*String.*Boolean.*`as`/s);
  assert.match(entry, /Number.*String.*Boolean.*`as`/s);
  assert.match(boundaryRules, /传输类型.*领域类型/s);
  assert.match(boundaryRules, /已有 mapper.*适配层.*不新增.*一次性文件.*schema 依赖/s);
  assert.match(boundaryRules, /没有现成边界.*单一入口.*业务分支/s);
});

test("multi-dimensional business decisions keep priority order and use matrix tests", () => {
  const standards = read("skills/t-standards/reference.md");
  const decisionRules = markdownSection(standards, "### 决策顺序与适度重复");
  const matrixRules = markdownSection(standards, "### 行为矩阵与一致性");

  assert.match(decisionRules, /业务优先级.*早返回/s);
  assert.match(matrixRules, /工作流.*角色.*单据类型.*状态.*行为矩阵/s);
  assert.match(matrixRules, /重叠条件.*冲突用例.*优先级/s);
  assert.match(matrixRules, /未知状态.*默认行为.*明确/s);
  assert.match(matrixRules, /返回数组.*成员与顺序/s);
});

test("semantic types comments and review gates stay aligned", () => {
  const standards = read("skills/t-standards/reference.md");
  const specReview = read("agents/t-spec.md");
  const codeReview = read("agents/t-code.md");
  const commandReview = read("commands/t-review.md");

  assert.match(standards, /不同业务概念.*数值相同.*不得.*复用/s);
  assert.match(standards, /as const.*推导.*字面量联合类型/s);
  assert.match(standards, /注释.*常量.*术语.*一致/s);
  assert.match(specReview, /真实业务差异.*强行合并.*状态机.*策略模式/s);
  assert.match(codeReview, /边界归一化.*Number.*String.*Boolean.*`as`/s);
  assert.match(codeReview, /不同业务概念.*数值相同.*同一常量/s);
  assert.match(codeReview, /有限常量集合.*字段类型.*漂移/s);
  assert.match(codeReview, /行为矩阵.*重叠条件优先级.*未知状态默认行为.*返回顺序/s);
  assert.match(commandReview, /两个阶段必做.*第二阶段.*t-code/s);
  assert.match(commandReview, /业务规则清晰度.*真实业务差异.*边界归一化.*行为矩阵/s);
});
