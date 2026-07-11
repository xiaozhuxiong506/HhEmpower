import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
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
