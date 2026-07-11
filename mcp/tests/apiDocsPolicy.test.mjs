import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("t-api-docs makes Torna the default and Swagger explicit-only", () => {
  const skill = read("skills/t-api-docs/SKILL.md");
  assert.match(skill, /默认.*Torna/);
  assert.match(skill, /明确.*Swagger\/OpenAPI/);
  assert.match(skill, /不得.*Swagger/);
  assert.match(skill, /多个.*候选.*确认/);
  assert.match(skill, /请求参数/);
  assert.match(skill, /响应参数/);
});

test("t-api-docs contains all four verified Torna project mappings", () => {
  const skill = read("skills/t-api-docs/SKILL.md");
  for (const projectId of ["RqXBwzEl", "kpX9MXr1", "57zLZ8Qw", "m32QA20r"]) {
    assert.match(skill, new RegExp(projectId));
  }
});

test("all API-document entry points route through t-api-docs", () => {
  const entryFiles = [
    "skills/t-page/SKILL.md",
    "skills/t-workflow/SKILL.md",
    "skills/t-field/SKILL.md",
    "skills/t-standards/reference.md",
    "agents/t-api.md",
    "commands/t-start.md",
    "commands/t-review.md",
    "rules/t-agent-guidance.mdc"
  ];

  for (const file of entryFiles) {
    assert.match(read(file), /t-api-docs/, `${file} must route API docs through t-api-docs`);
  }
});

test("Torna client fixes the origin and does not persist browser authentication", () => {
  const client = read("mcp/src/tornaClient.mjs");
  assert.doesNotMatch(client, /options\.baseUrl/);
  assert.doesNotMatch(client, /launchPersistentContext/);
  assert.match(client, /http:\/\/docs\.internal\.tsb\.com/);
});
