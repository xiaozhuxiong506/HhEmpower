import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("t-oplog discovers Chinese log and instrumentation synonyms", () => {
  const skill = readRepoFile("skills/t-oplog/SKILL.md");

  for (const term of [
    "操作日志",
    "埋点日志",
    "日志埋点",
    "埋点",
    "日志",
    "行为日志",
    "日志词库",
    "日志核对",
    "日志核对管理系统"
  ]) {
    assert.match(skill, new RegExp(term));
  }
});

test("t-oplog defines the admin UI dictionary workflow and field boundaries", () => {
  const skill = readRepoFile("skills/t-oplog/SKILL.md");

  assert.match(skill, /http:\/\/admin\.tsbsoft\.com\//);
  assert.match(skill, /thAppManagement/);
  assert.match(skill, /登录.*用户.*登录|用户.*登录.*登录/s);
  assert.match(skill, /贸易系统.*外贸系统/s);
  assert.match(skill, /操作.*更多.*操作日志词库管理/s);
  assert.match(skill, /PC端/);
  assert.match(skill, /参照.*已有.*增删改查|已有.*增删改查.*参照/s);
  assert.match(skill, /操作页面/);
  assert.match(skill, /操作功能/);
  assert.match(skill, /常用标题/);
  assert.match(skill, /正则匹配/);
  assert.match(skill, /正式匹配1.*不.*填写/s);
  assert.match(skill, /四个单选.*只能.*一个.*是/s);
  assert.match(skill, /不得.*随意|不能.*随意/);
  assert.match(skill, /无法.*确认.*询问|不清楚.*询问/s);
});

test("t-oplog makes admin configuration primary and keeps Console conditional", () => {
  const skill = readRepoFile("skills/t-oplog/SKILL.md");

  assert.match(skill, /默认.*后台|后台.*默认/s);
  assert.match(skill, /只有.*明确.*脚本|明确要求.*Console|Console.*明确要求/s);
  assert.match(skill, /保存.*确认|确认.*保存/s);
});

test("page and workflow entry points route log synonyms to t-oplog", () => {
  const page = readRepoFile("skills/t-page/SKILL.md");
  const workflow = readRepoFile("skills/t-workflow/SKILL.md");

  assert.match(page, /埋点日志|日志词库|日志核对/);
  assert.match(workflow, /后台.*操作日志|操作日志.*后台/);
});
