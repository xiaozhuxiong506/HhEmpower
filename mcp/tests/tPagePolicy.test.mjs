import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const skill = fs.readFileSync(path.join(repoRoot, "skills/t-page/SKILL.md"), "utf8");
const outputContract = skill.split(/^## 输出契约\r?$/m)[1]?.split(/^## /m)[0];
const overviewTemplate = outputContract?.match(/```markdown\r?\n([\s\S]*?)\r?\n```/)?.[1];

test("t-page overview template contains the required Markdown list fields", () => {
  assert.ok(overviewTemplate, "Markdown overview template must exist");
  const fields = overviewTemplate
    .split(/\r?\n/)
    .filter(line => line.startsWith("- "))
    .map(line => line.slice(2).split("：")[0]);

  assert.deepEqual(fields, [
    "【理解用户需求】",
    "归属系统",
    "归属模块",
    "参与当前模块 Git 修改人",
    "预计改动文件/行数",
    "现成可复用能力"
  ]);
  assert.match(overviewTemplate, /归属系统.*贸易系统.*展厅系统/);
  assert.match(overviewTemplate, /^  - utils：/m);
  assert.match(overviewTemplate, /^  - hook：/m);
  assert.match(overviewTemplate, /^  - fieldMapping(?:（[^）]*）)?：/m);
});

test("t-page overview is evidence-based and scoped to the current module", () => {
  assert.match(skill, /先读.*profiles\.md.*anchors\.md.*再输出/s);
  assert.match(skill, /当前模块.*Git|Git.*当前模块/s);
  assert.match(skill, /无法确认.*待确认|待确认.*无法确认/s);
  assert.match(skill, /不得猜测|不能猜测/);
  assert.match(skill, /只.*当前模块|仅.*当前模块/s);
  assert.ok(overviewTemplate, "overview template must exist before checking its fields");
  assert.doesNotMatch(overviewTemplate, /HEAD|工作区状态/);
});
