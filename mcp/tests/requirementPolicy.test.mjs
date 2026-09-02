import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("t-requirement exists as a read-only frontend requirement analysis skill", () => {
  const skillPath = path.join(repoRoot, "skills/t-requirement/SKILL.md");

  assert.equal(fs.existsSync(skillPath), true, "skills/t-requirement/SKILL.md must exist");

  const skill = read("skills/t-requirement/SKILL.md");
  assert.match(skill, /只读/);
  assert.match(skill, /不得(?:修改|写入)代码/);
  assert.match(skill, /产品文档/);
  assert.match(skill, /前端源码/);
  assert.match(skill, /Torna/);
});

test("t-requirement separates responsibilities and evidence before clarification", () => {
  const skill = read("skills/t-requirement/SKILL.md");

  for (const responsibility of ["前端负责", "后端负责", "前后端联调", "待确认", "非前端范围"]) {
    assert.match(skill, new RegExp(responsibility));
  }

  assert.match(skill, /先分析[^\n]*再(?:澄清|提问)/);
  assert.match(skill, /t-clarify/);
  assert.match(skill, /不得猜测/);
  assert.match(skill, /文档初判版/);
});

test("t-requirement publishes the fixed ten-section frontend report", () => {
  const reference = read("skills/t-requirement/reference.md");

  for (const heading of [
    "## 1. 需求结论",
    "## 2. 业务流程",
    "## 3. 原始需求拆解",
    "## 4. 前后端责任拆分",
    "## 5. 前端改动点",
    "## 6. 后端与联调依赖",
    "## 7. 不属于前端的事项",
    "## 8. 待确认问题",
    "## 9. 前端验收标准",
    "## 10. 最终前端任务清单",
  ]) {
    assert.match(reference, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const evidenceState of [
    "产品文档已确认",
    "前端源码已确认",
    "接口文档已确认",
    "多来源一致",
    "合理推断，待确认",
    "来源冲突",
    "资料缺失",
  ]) {
    assert.match(reference, new RegExp(evidenceState));
  }
});

test("ERP entry points route mixed product documents to t-requirement before t-clarify", () => {
  for (const entryPath of [
    "skills/t-page/SKILL.md",
    "skills/t-workflow/SKILL.md",
    "commands/t-start.md",
    "rules/t-agent-guidance.mdc",
  ]) {
    const entry = read(entryPath);
    const requirementIndex = entry.indexOf("t-requirement");
    const clarifyIndex = entry.indexOf("t-clarify");

    assert.ok(requirementIndex >= 0, `${entryPath} must route to t-requirement`);
    assert.ok(clarifyIndex >= 0, `${entryPath} must retain t-clarify`);
    assert.ok(requirementIndex < clarifyIndex, `${entryPath} must analyze before clarifying`);
  }

  assert.match(read("skills/README.md"), /t-requirement/);
  assert.match(read("README.md"), /\| Skills \| 18 \|/);
  assert.match(read("README.md"), /t-requirement/);
});
