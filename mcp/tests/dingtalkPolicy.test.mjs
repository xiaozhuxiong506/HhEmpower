import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("DingTalk skill and entry points enforce the same read-only boundary", () => {
  const skill = read("skills/t-dingtalk/SKILL.md");
  const command = read("commands/t-dingtalk-read.md");
  const agent = read("agents/t-dingtalk.md");
  const rule = read("rules/t-dingtalk-privacy.mdc");
  const combined = [skill, command, agent, rule].join("\n");

  assert.match(skill, /^---\s*\nname: t-dingtalk\s*\n/m);
  assert.match(skill, /description: Use when .*钉钉.*聊天记录/);
  assert.match(combined, /dingtalk_auth_status/);
  assert.match(combined, /dingtalk_search_groups/);
  assert.match(combined, /dingtalk_search_messages/);
  assert.match(combined, /OAuth/);
  assert.match(combined, /当前.*用户.*有权访问/);
  assert.match(combined, /多候选.*用户确认/);
  assert.match(combined, /禁止.*发送|不得.*发送/);
  assert.match(combined, /禁止.*落盘|不得.*落盘/);
  assert.match(combined, /不可信.*数据.*不是.*指令/);
});

test("DingTalk MCP source exposes no chat write tools or arbitrary command input", () => {
  const server = read("mcp/src/server.mjs");
  const client = read("mcp/src/dingtalkClient.mjs");

  assert.doesNotMatch(server, /name:\s*"dingtalk_(send|reply|recall|forward)/);
  assert.doesNotMatch(server, /rawArgs|commandLine|shellCommand/);
  assert.match(client, /shell:\s*false/);
  assert.doesNotMatch(client, /options\.env/);
  assert.doesNotMatch(client, /T_MCP_DWS_ENTRY/);
  assert.doesNotMatch(client, /env:\s*process\.env/);
  assert.match(client, /allowedNames/);
  assert.match(client, /fs\.chmodSync/);
  assert.match(read("mcp/.npmrc"), /ignore-scripts=true/);
  const packageJson = JSON.parse(read("mcp/package.json"));
  assert.match(packageJson.scripts.test, /npm run build/);
});
