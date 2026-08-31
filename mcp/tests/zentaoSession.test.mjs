import assert from "node:assert/strict";
import test from "node:test";
import {
  closeAllZentaoSessions,
  getZentaoSessionKey,
  runZentaoExclusive,
  runZentaoSingleFlight
} from "../src/zentaoSession.mjs";

function createFakeContext(onClose) {
  const closeHandlers = [];
  return {
    on(event, handler) {
      if (event === "close") closeHandlers.push(handler);
    },
    async close() {
      onClose();
      for (const handler of closeHandlers) handler();
    }
  };
}

test.afterEach(async () => {
  await closeAllZentaoSessions();
});

test("session key distinguishes browser channel and headless mode", () => {
  const base = getZentaoSessionKey({
    profileDir: "D:/profiles/zentao",
    browserChannel: "chrome",
    headless: false
  });
  assert.equal(base, getZentaoSessionKey({
    profileDir: "D:\\profiles\\zentao",
    browserChannel: "CHROME",
    headless: false
  }));
  assert.notEqual(base, getZentaoSessionKey({
    profileDir: "D:/profiles/zentao",
    browserChannel: "chrome",
    headless: true
  }));
});

test("identical concurrent calls share one context and one operation", async () => {
  let creates = 0;
  let runs = 0;
  let closes = 0;
  const entered = Promise.withResolvers();
  const gate = Promise.withResolvers();
  const options = {
    sessionKey: "same-profile",
    keepBrowserOpen: true,
    contextFactory: async () => {
      creates += 1;
      return createFakeContext(() => { closes += 1; });
    }
  };
  const operation = async context => {
    assert.ok(context);
    runs += 1;
    entered.resolve();
    await gate.promise;
    return { ok: true };
  };

  const first = runZentaoSingleFlight(options, "collect", operation);
  await entered.promise;
  const second = runZentaoSingleFlight(options, "collect", operation);
  gate.resolve();

  assert.deepEqual(await Promise.all([first, second]), [{ ok: true }, { ok: true }]);
  assert.equal(creates, 1);
  assert.equal(runs, 1);
  assert.equal(closes, 0);
});

test("different operations using one profile never overlap", async () => {
  let active = 0;
  let maximumActive = 0;
  let creates = 0;
  const firstEntered = Promise.withResolvers();
  const firstGate = Promise.withResolvers();
  const options = {
    sessionKey: "serialized-profile",
    keepBrowserOpen: true,
    contextFactory: async () => {
      creates += 1;
      return createFakeContext(() => {});
    }
  };

  const first = runZentaoExclusive(options, async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    firstEntered.resolve();
    await firstGate.promise;
    active -= 1;
    return "first";
  });
  await firstEntered.promise;
  const second = runZentaoExclusive(options, async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    active -= 1;
    return "second";
  });

  await new Promise(resolve => setImmediate(resolve));
  assert.equal(maximumActive, 1);
  firstGate.resolve();
  assert.deepEqual(await Promise.all([first, second]), ["first", "second"]);
  assert.equal(creates, 1);
});

test("keepBrowserOpen false closes and removes the context", async () => {
  let creates = 0;
  let closes = 0;
  const options = {
    sessionKey: "short-lived-profile",
    keepBrowserOpen: false,
    contextFactory: async () => {
      creates += 1;
      return createFakeContext(() => { closes += 1; });
    }
  };

  assert.equal(await runZentaoExclusive(options, async () => "first"), "first");
  assert.equal(await runZentaoExclusive(options, async () => "second"), "second");
  assert.equal(creates, 2);
  assert.equal(closes, 2);
});
