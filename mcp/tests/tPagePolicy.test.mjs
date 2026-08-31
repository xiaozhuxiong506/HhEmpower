import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const skill = fs.readFileSync(path.join(repoRoot, "skills/t-page/SKILL.md"), "utf8");

test("t-page requires a fixed page task overview before routing", () => {
  assert.match(skill, /输出下方.*页面任务概览.*概览完成后再.*路由/s);
  assert.match(skill, /页面任务概览/);
  assert.match(skill, /【理解用户需求】/);
  assert.match(skill, /归属系统.*贸易系统.*展厅系统/s);
  assert.match(skill, /归属模块/);
  assert.match(skill, /参与当前模块 Git 修改人/);
  assert.match(skill, /预计改动文件.*行数/s);
  assert.match(skill, /utils.*hook.*fieldMapping/s);
});

test("t-page overview is evidence-based and scoped to the current module", () => {
  assert.match(skill, /先读.*profiles\.md.*anchors\.md.*再输出/s);
  assert.match(skill, /当前模块.*Git|Git.*当前模块/s);
  assert.match(skill, /无法确认.*待确认|待确认.*无法确认/s);
  assert.match(skill, /不得猜测|不能猜测/);
  assert.match(skill, /只.*当前模块|仅.*当前模块/s);
  const template = skill.match(/```text\r?\n([\s\S]*?)\r?\n```/)?.[1] || "";
  assert.doesNotMatch(template, /HEAD|工作区状态/);
});
