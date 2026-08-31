import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const sessions = new Map();
const contextFactoryIds = new WeakMap();
let nextContextFactoryId = 1;

export function defaultZentaoProfileDir() {
  const base = process.env.LOCALAPPDATA || os.tmpdir();
  return path.join(base, "TBrowserMcp", "playwright-profile");
}

export function getZentaoSessionKey(options = {}) {
  if (options.sessionKey) return String(options.sessionKey);
  const profileDir = options.profileDir || process.env.T_MCP_PROFILE_DIR || defaultZentaoProfileDir();
  const normalizedProfile = path.resolve(profileDir).replace(/\\/g, "/").toLowerCase();
  const channel = String(
    options.browserChannel || process.env.T_MCP_BROWSER_CHANNEL || "chrome"
  ).toLowerCase();
  let key = `${normalizedProfile}\u0000${channel}\u0000${Boolean(options.headless)}`;
  if (typeof options.contextFactory === "function") {
    if (!contextFactoryIds.has(options.contextFactory)) {
      contextFactoryIds.set(options.contextFactory, nextContextFactoryId);
      nextContextFactoryId += 1;
    }
    key += `\u0000factory:${contextFactoryIds.get(options.contextFactory)}`;
  }
  return key;
}

export async function launchPersistentChrome(options = {}) {
  const profileDir = options.profileDir || process.env.T_MCP_PROFILE_DIR || defaultZentaoProfileDir();
  const channel = options.browserChannel || process.env.T_MCP_BROWSER_CHANNEL || "chrome";
  return chromium.launchPersistentContext(profileDir, {
    headless: Boolean(options.headless),
    viewport: null,
    ignoreHTTPSErrors: true,
    args: ["--start-maximized"],
    channel
  });
}

function getSessionEntry(options) {
  const key = getZentaoSessionKey(options);
  if (!sessions.has(key)) {
    sessions.set(key, {
      key,
      contextPromise: null,
      tail: Promise.resolve(),
      inflight: new Map()
    });
  }
  return sessions.get(key);
}

function getContext(entry, options) {
  if (entry.contextPromise) return entry.contextPromise;
  const contextFactory = options.contextFactory || launchPersistentChrome;
  const contextPromise = Promise.resolve().then(() => contextFactory(options));
  entry.contextPromise = contextPromise;

  contextPromise.then(context => {
    context.on?.("close", () => {
      if (entry.contextPromise === contextPromise) entry.contextPromise = null;
    });
  }).catch(() => {
    if (entry.contextPromise === contextPromise) entry.contextPromise = null;
  });

  return contextPromise;
}

export function runZentaoExclusive(options = {}, operation) {
  if (typeof operation !== "function") throw new TypeError("Zentao operation must be a function");
  const entry = getSessionEntry(options);

  const run = async () => {
    const context = await getContext(entry, options);
    try {
      return await operation(context);
    } finally {
      if (options.keepBrowserOpen === false && entry.contextPromise) {
        entry.contextPromise = null;
        await context.close().catch(() => {});
      }
    }
  };

  const pending = entry.tail.then(run, run);
  entry.tail = pending.then(() => undefined, () => undefined);
  return pending;
}

export function runZentaoSingleFlight(options = {}, flightKey, operation) {
  const entry = getSessionEntry(options);
  const key = String(flightKey || "default");
  const current = entry.inflight.get(key);
  if (current) return current;

  const pending = runZentaoExclusive(options, operation);
  entry.inflight.set(key, pending);
  pending.finally(() => {
    if (entry.inflight.get(key) === pending) entry.inflight.delete(key);
  }).catch(() => {});
  return pending;
}

export async function closeAllZentaoSessions() {
  const entries = Array.from(sessions.values());
  sessions.clear();
  await Promise.all(entries.map(async entry => {
    await entry.tail.catch(() => {});
    const contextPromise = entry.contextPromise;
    entry.contextPromise = null;
    if (!contextPromise) return;
    const context = await contextPromise.catch(() => null);
    await context?.close().catch(() => {});
  }));
}
