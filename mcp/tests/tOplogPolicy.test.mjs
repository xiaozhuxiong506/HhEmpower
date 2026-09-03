import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
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

test("t-oplog requires current real inputs and successful global case-insensitive regex testing before save", () => {
  const skill = readRepoFile("skills/t-oplog/SKILL.md");

  assert.match(skill, /旧.*正则|既有.*正则/s);
  assert.match(skill, /当前系统.*(?:真实|实际).*入参/s);
  assert.match(skill, /忽略大小写/);
  assert.match(skill, /全局/);
  assert.match(skill, /[`\"](?:ig|gi)[`\"]/);
  assert.match(skill, /匹配测试.*(?:命中|匹配成功)|(?:命中|匹配成功).*匹配测试/s);
  assert.match(skill, /(?:未命中|不能匹配).*(?:不得|禁止).*保存/s);
});

test("page and workflow entry points route log synonyms to t-oplog", () => {
  const page = readRepoFile("skills/t-page/SKILL.md");
  const workflow = readRepoFile("skills/t-workflow/SKILL.md");

  assert.match(page, /埋点日志|日志词库|日志核对/);
  assert.match(workflow, /后台.*操作日志|操作日志.*后台/);
});

async function runConsole(system, token = "Bearer test-only-token") {
  const skill = readRepoFile("skills/t-oplog/SKILL.md");
  const section = skill.split(/^## 唯一渲染模板\r?$/m)[1]?.split(/^## /m)[0];
  const template = section?.match(/```javascript\r?\n([\s\S]*?)\r?\n```/)?.[1];
  assert.ok(template, "Console template must exist");
  const code = template
    .replaceAll("__TOKEN_JSON__", JSON.stringify(token))
    .replaceAll("__SYSTEM_JSON__", JSON.stringify(system))
    .replaceAll("__DATA_JSON__", JSON.stringify([{ pageTitle: "销售报价", useTitle: "新增" }]));
  const requests = [];
  const result = vm.runInNewContext(code, {
    console: { log() {}, error() {}, table() {} },
    setTimeout(callback) { callback(); },
    async fetch(url, options) {
      requests.push({ url, ...options, body: JSON.parse(options.body) });
      return {
        ok: true,
        status: 200,
        async text() { return JSON.stringify({ code: 200, data: { pageId: 7351 } }); }
      };
    }
  });
  return { requests, result };
}

for (const [system, expectedRole] of [["TSBERP", 16], ["HALLERP", 14]]) {
  test(`Console sends ${system} logs to its own PC application`, async () => {
    const { requests, result } = await runConsole(system);
    await result;
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.tsbsoft.com/admin/Application/AddBeHaviorLogRegex");
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].headers.Authorization, "Bearer test-only-token");
    assert.equal(requests[0].headers.pageTitle, encodeURIComponent("销售报价"));
    assert.equal(requests[0].headers.useTitle, encodeURIComponent("新增"));
    assert.deepEqual(requests[0].body, {
      roleId: expectedRole,
      pageTitle: "销售报价",
      useTitle: "新增",
      isSplit: false,
      isRepeat: false,
      isMany: false,
      isKeyWord: false,
      platform: 0
    });
  });

  test(`Console keeps ${system} request context with returned pageId evidence`, async () => {
    const { result } = await runConsole(system);
    const rows = await result;
    assert.equal(rows[0].system, system);
    assert.equal(rows[0].roleId, expectedRole);
    assert.equal(rows[0].platform, 0);
    assert.equal(rows[0].pageTitle, "销售报价");
    assert.equal(rows[0].useTitle, "新增");
    assert.equal(rows[0].ok, true);
    assert.equal(rows[0].result.data.pageId, 7351);
  });
}

test("Console rejects an unrecognized system before sending a request", async () => {
  for (const system of ["", "other", "toString", null]) {
    const { requests, result } = await runConsole(system);
    await assert.rejects(result);
    assert.equal(requests.length, 0);
  }
});

test("Console rejects an empty token before sending a request", async () => {
  const { requests, result } = await runConsole("TSBERP", "");
  await assert.rejects(result);
  assert.equal(requests.length, 0);
});
