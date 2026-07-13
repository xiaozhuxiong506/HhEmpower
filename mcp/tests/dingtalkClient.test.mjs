import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getDingTalkAuthStatus,
  listAllDingTalkMessages,
  listDingTalkMessages,
  searchDingTalkGroups,
  searchDingTalkMessages
} from "../src/dingtalkClient.mjs";

const realSpawn = childProcess.spawn.bind(childProcess);

function createFakeDws(mock) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "t-dingtalk-test-"));
  const entryPath = path.join(tempDir, "fake-dws.mjs");
  const capturePath = path.join(tempDir, "args.json");

  fs.writeFileSync(
    entryPath,
    `import fs from "node:fs";
const args = process.argv.slice(2);
fs.writeFileSync(process.env.T_DWS_CAPTURE_PATH, JSON.stringify(args), "utf8");
if (args.includes("--version")) {
  console.log("dws version v1.0.51");
  process.exit(0);
}
if (args[0] === "auth" && args[1] === "status") {
  console.log(JSON.stringify({ success: true, authenticated: true, profile: "TSB" }));
  process.exit(0);
}
if (args[0] === "chat" && args[1] === "search") {
  console.log(JSON.stringify({
    success: true,
    result: {
      items: [{ name: "贸易ERP开发群", openConversationId: "cid-1", memberCount: 28 }],
      hasMore: false,
      nextCursor: ""
    }
  }));
  process.exit(0);
}
if (args[0] === "chat" && args[1] === "message" && args[2] === "search") {
  if (args.includes("fail")) {
    console.error("DWS_PERMISSION_DENIED: 当前组织未授权读取聊天记录");
    process.exit(2);
  }
  console.log(JSON.stringify({
    success: true,
    result: {
      items: [{
        createTime: "2026-07-13T10:30:00+08:00",
        senderName: "张三",
        conversationTitle: "贸易ERP开发群",
        content: "采购明细字段需要与接口一致",
        messageId: "msg-1"
      }],
      hasMore: true,
      nextCursor: "cursor-2"
    }
  }));
  process.exit(0);
}
if (args[0] === "chat" && args[1] === "message" && args[2] === "list") {
  console.log(JSON.stringify({
    success: true,
    result: {
      items: [
        { createTime: "2026-07-13 10:30:00", senderName: "张三", content: "较新消息" },
        { createTime: "2026-07-13 09:15:00", senderName: "李四", content: "边界消息" }
      ],
      hasMore: true
    }
  }));
  process.exit(0);
}
console.error("unexpected args: " + args.join(" "));
process.exit(3);
`,
    "utf8"
  );

  const spawnEnvironments = [];
  mock.method(childProcess, "spawn", (_command, args, options) => {
    spawnEnvironments.push(options.env);
    return realSpawn(process.execPath, [entryPath, ...args], {
      ...options,
      env: { ...options.env, T_DWS_CAPTURE_PATH: capturePath }
    });
  });

  return {
    capturePath,
    spawnEnvironments,
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

test("auth status uses the bundled DWS contract and returns readable Markdown", async context => {
  const blockedEnvironment = {
    DWS_CLIENT_ID: "forbidden-client",
    DWS_CLIENT_SECRET: "forbidden-secret",
    DWS_CONFIG_DIR: "forbidden-config",
    LD_PRELOAD: "forbidden-library",
    NODE_OPTIONS: "--require forbidden-module"
  };
  const previousEnvironment = Object.fromEntries(
    Object.keys(blockedEnvironment).map(name => [name, process.env[name]])
  );
  Object.assign(process.env, blockedEnvironment);
  const fake = createFakeDws(context.mock);
  try {
    const result = await getDingTalkAuthStatus();

    assert.equal(result.data.authenticated, true);
    assert.match(result.markdown, /已登录/);
    assert.match(result.markdown, /v1\.0\.51/);
    for (const environment of fake.spawnEnvironments) {
      for (const name of Object.keys(blockedEnvironment)) {
        assert.equal(environment[name], undefined, `${name} leaked to DWS`);
      }
    }
    assert.deepEqual(JSON.parse(fs.readFileSync(fake.capturePath, "utf8")), [
      "auth",
      "status",
      "-f",
      "json"
    ]);
  } finally {
    for (const [name, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    fake.cleanup();
  }
});

test("group search maps only supported arguments and formats candidates", async context => {
  const fake = createFakeDws(context.mock);
  try {
    const result = await searchDingTalkGroups({
      query: "贸易ERP",
      limit: 10,
      cursor: "0"
    });

    assert.match(result.markdown, /贸易ERP开发群/);
    assert.match(result.markdown, /cid-1/);
    assert.deepEqual(JSON.parse(fs.readFileSync(fake.capturePath, "utf8")), [
      "chat",
      "search",
      "--query",
      "贸易ERP",
      "--limit",
      "10",
      "--cursor",
      "0",
      "-f",
      "json"
    ]);
  } finally {
    fake.cleanup();
  }
});

test("message search preserves pagination and renders core message fields", async context => {
  const fake = createFakeDws(context.mock);
  try {
    const result = await searchDingTalkMessages({
      query: "采购",
      start: "2026-07-01T00:00:00+08:00",
      end: "2026-07-13T23:59:59+08:00",
      group: "cid-1",
      limit: 50,
      cursor: "0"
    });

    assert.equal(result.pagination.hasMore, true);
    assert.equal(result.pagination.nextCursor, "cursor-2");
    assert.match(result.markdown, /张三/);
    assert.match(result.markdown, /采购明细字段需要与接口一致/);
    assert.match(result.markdown, /cursor-2/);
  } finally {
    fake.cleanup();
  }
});

test("conversation message listing returns createTime as the next page boundary", async context => {
  const fake = createFakeDws(context.mock);
  try {
    const result = await listDingTalkMessages({
      group: "cid-1",
      time: "2026-07-13 11:00:00",
      direction: "older",
      limit: 2
    });

    assert.equal(result.pagination.hasMore, true);
    assert.equal(result.pagination.nextCursor, "");
    assert.equal(result.pagination.nextTime, "2026-07-13 09:15:00");
    assert.match(result.markdown, /下一页时间 `2026-07-13 09:15:00`/);
    assert.deepEqual(JSON.parse(fs.readFileSync(fake.capturePath, "utf8")), [
      "chat",
      "message",
      "list",
      "--group",
      "cid-1",
      "--time",
      "2026-07-13 11:00:00",
      "--direction",
      "older",
      "--limit",
      "2",
      "-f",
      "json"
    ]);
  } finally {
    fake.cleanup();
  }
});

test("conversation message listing rejects ambiguous conversation selectors", async () => {
  await assert.rejects(
    () =>
      listDingTalkMessages({
        group: "cid-1",
        user: "user-1",
        time: "2026-07-13 00:00:00"
      }),
    /group、user、openDingTalkId 只能提供一个/
  );
});

test("message tools reject timestamp formats that do not match the DWS contract", async () => {
  await assert.rejects(
    () =>
      searchDingTalkMessages({
        query: "采购",
        start: "2026-02-30T00:00:00+08:00",
        end: "2026-03-01T23:59:59+08:00"
      }),
    /start 必须使用有效的 ISO-8601/
  );

  await assert.rejects(
    () =>
      searchDingTalkMessages({
        query: "采购",
        start: "2026-07-01 00:00:00",
        end: "2026-07-13T23:59:59+08:00"
      }),
    /start 必须使用 ISO-8601/
  );

  await assert.rejects(
    () =>
      listDingTalkMessages({
        group: "cid-1",
        time: "2026-07-13T00:00:00+08:00"
      }),
    /time 必须使用 yyyy-MM-dd HH:mm:ss/
  );

  await assert.rejects(
    () =>
      listAllDingTalkMessages({
        start: "2026-07-14 00:00:00",
        end: "2026-07-13 23:59:59"
      }),
    /start 不能晚于 end/
  );
});

test("DWS errors keep the actionable reason without exposing a shell", async context => {
  const fake = createFakeDws(context.mock);
  try {
    await assert.rejects(
      () =>
        searchDingTalkMessages({
          query: "fail",
          start: "2026-07-01T00:00:00+08:00",
          end: "2026-07-13T23:59:59+08:00"
        }),
      /当前组织未授权读取聊天记录/
    );
  } finally {
    fake.cleanup();
  }
});
