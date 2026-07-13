import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TIMEOUT_MS = 60_000;
const LOGIN_TIMEOUT_MS = 180_000;

function resolveDwsCommand() {
  const platformDir = `${process.platform}-${process.arch}`;
  const binaryName = process.platform === "win32" ? "dws.exe" : "dws";
  const candidates = [
    path.join(moduleDir, "vendor", "dws", platformDir, binaryName),
    path.join(moduleDir, "..", "dist", "vendor", "dws", platformDir, binaryName),
    path.join(moduleDir, "..", "node_modules", "dingtalk-workspace-cli", "vendor", binaryName),
    path.join(process.cwd(), "node_modules", "dingtalk-workspace-cli", "vendor", binaryName)
  ];
  const binary = candidates.find(candidate => fs.existsSync(candidate));
  if (binary) {
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(binary, 0o755);
      } catch (error) {
        throw new Error(`无法设置钉钉 DWS 执行权限：${error.message}`);
      }
    }
    return binary;
  }

  throw new Error(
    `插件内未找到当前平台的钉钉 DWS 运行时（${platformDir}）。请重新构建或重新安装 t-erp-page 插件。`
  );
}

function dwsEnvironment() {
  const allowedNames = new Set([
    "APPDATA",
    "COMSPEC",
    "DBUS_SESSION_BUS_ADDRESS",
    "DISPLAY",
    "HOME",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "LOCALAPPDATA",
    "NO_PROXY",
    "PATH",
    "PATHEXT",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
    "TZ",
    "USERPROFILE",
    "WAYLAND_DISPLAY",
    "WINDIR",
    "XDG_CACHE_HOME",
    "XDG_CONFIG_HOME",
    "XDG_DATA_HOME",
    "XDG_RUNTIME_DIR"
  ]);
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) => allowedNames.has(name.toUpperCase()))
  );
}

function parseJsonOutput(stdout) {
  const text = stdout.trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`钉钉 DWS 返回了无法解析的结果：${text.slice(0, 500)}`);
  }
}

// 所有钉钉调用都经过固定参数数组执行，禁止 shell 和任意命令字符串绕过只读边界。
function runDws(args, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const command = resolveDwsCommand();

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, {
      env: dwsEnvironment(),
      shell: false,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error(`钉钉 DWS 调用超时（${timeoutMs}ms）。`));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`无法启动钉钉 DWS：${error.message}`));
    });
    child.on("close", code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        const reason = stderr.trim() || stdout.trim() || `退出码 ${code}`;
        reject(new Error(`钉钉 DWS 调用失败：${reason}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function requiredText(value, label) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${label}不能为空。`);
  return text;
}

function isoDateTime(value, label) {
  const text = requiredText(value, label);
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(?:Z|([+-])(\d{2}):(\d{2}))$/
  );
  if (!match) {
    throw new Error(`${label} 必须使用 ISO-8601，例如 2026-07-01T00:00:00+08:00。`);
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = "0"] = match;
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText
  ].map(Number);
  const millisecond = Number(fraction.padEnd(3, "0"));
  const offsetHour = Number(match[9] || 0);
  const offsetMinute = Number(match[10] || 0);
  const calendar = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const validCalendar =
    calendar.getUTCFullYear() === year &&
    calendar.getUTCMonth() === month - 1 &&
    calendar.getUTCDate() === day &&
    calendar.getUTCHours() === hour &&
    calendar.getUTCMinutes() === minute &&
    calendar.getUTCSeconds() === second &&
    calendar.getUTCMilliseconds() === millisecond;
  const validOffset = offsetHour < 14 || (offsetHour === 14 && offsetMinute === 0);
  if (!validCalendar || !validOffset || Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} 必须使用有效的 ISO-8601 日期时间。`);
  }
  return text;
}

function localDateTime(value, label) {
  const text = requiredText(value, label);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`${label} 必须使用 yyyy-MM-dd HH:mm:ss。`);
  }
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    throw new Error(`${label} 必须使用有效的 yyyy-MM-dd HH:mm:ss。`);
  }
  return text;
}

function normalizedLimit(value, fallback) {
  const limit = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("limit 必须是 1 到 100 之间的整数。");
  }
  return limit;
}

function addProfile(args, profile) {
  if (profile) args.push("--profile", requiredText(profile, "profile"));
  return args;
}

function escapeCell(value) {
  if (value === undefined || value === null || value === "") return "-";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return text.replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

function firstValue(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return "";
}

function resultContainer(data) {
  return data?.result ?? data?.data ?? data ?? {};
}

function resultItems(data) {
  const container = resultContainer(data);
  if (Array.isArray(container)) return container;
  for (const key of ["items", "list", "messages", "records", "result"]) {
    if (Array.isArray(container?.[key])) return container[key];
  }
  return [];
}

function formatLocalDateTime(date) {
  const twoDigits = value => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
    `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`
  ].join(" ");
}

function messageBoundaryTime(items, direction) {
  const candidates = items
    .map(item => firstValue(item, ["createTime", "sendTime", "time", "timestamp"]))
    .map(value => {
      const numeric = typeof value === "number" || /^\d{10,13}$/.test(String(value));
      const timestamp = numeric
        ? Number(value) * (String(value).length === 10 ? 1000 : 1)
        : Date.parse(String(value).replace(" ", "T"));
      return { timestamp, value };
    })
    .filter(item => Number.isFinite(item.timestamp));
  if (!candidates.length) return "";
  const boundary = candidates.reduce((selected, candidate) => {
    if (direction === "older") {
      return candidate.timestamp < selected.timestamp ? candidate : selected;
    }
    return candidate.timestamp > selected.timestamp ? candidate : selected;
  });
  const direct = String(boundary.value).match(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/)?.[0];
  return direct ? direct.replace("T", " ") : formatLocalDateTime(new Date(boundary.timestamp));
}

function resultPagination(data, items, context) {
  const container = resultContainer(data);
  const hasMore = Boolean(container?.hasMore ?? data?.hasMore);
  return {
    hasMore,
    nextCursor: String(container?.nextCursor ?? data?.nextCursor ?? ""),
    nextTime:
      hasMore && context.paginationMode === "time"
        ? messageBoundaryTime(items, context.direction)
        : ""
  };
}

function groupTable(items) {
  const rows = items.map(item => [
    firstValue(item, ["name", "title", "conversationTitle"]),
    firstValue(item, ["openConversationId", "openconversationId", "conversationId", "id"]),
    firstValue(item, ["memberCount", "memberTotal", "members"])
  ]);
  return [
    "| 群名称 | openConversationId | 成员数 |",
    "|---|---|---:|",
    ...rows.map(row => `| ${row.map(escapeCell).join(" | ")} |`)
  ].join("\n");
}

function messageTable(items) {
  const rows = items.map(item => [
    firstValue(item, ["createTime", "sendTime", "time", "timestamp"]),
    firstValue(item, ["senderName", "senderNick", "sender", "fromName", "userName"]),
    firstValue(item, ["conversationTitle", "conversationName", "groupName", "title"]),
    firstValue(item, ["content", "text", "message", "msgContent"]),
    firstValue(item, ["messageId", "msgId", "id"])
  ]);
  return [
    "| 时间 | 发送人 | 会话 | 消息内容 | 消息 ID |",
    "|---|---|---|---|---|",
    ...rows.map(row => `| ${row.map(escapeCell).join(" | ")} |`)
  ].join("\n");
}

// 查询结果同时保留可扫描表格和原始结构，避免消息字段被展示层裁剪后失真。
export function formatDingTalkResult(title, data, context = {}) {
  const items = resultItems(data);
  const pagination = resultPagination(data, items, context);
  const table = context.kind === "groups" ? groupTable(items) : messageTable(items);
  const queryLines = Object.entries(context.query || {})
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `- ${key}: ${escapeCell(value)}`);
  const pageLine = !pagination.hasMore
    ? "- 更多结果：否"
    : pagination.nextTime
      ? `- 更多结果：是，下一页时间 \`${escapeCell(pagination.nextTime)}\``
      : pagination.nextCursor
        ? `- 更多结果：是，下一页游标 \`${escapeCell(pagination.nextCursor)}\``
        : "- 更多结果：是，但 DWS 未返回可用的分页边界";
  const markdown = [
    `# ${title}`,
    "",
    "## 查询范围",
    ...(queryLines.length ? queryLines : ["- 当前钉钉授权用户"]),
    `- 返回数量：${items.length}`,
    pageLine,
    "",
    "## 结果",
    items.length ? table : "未找到符合条件的结果。",
    "",
    "## 结构化数据",
    "```json",
    JSON.stringify(data, null, 2),
    "```"
  ].join("\n");

  return { data, items, pagination, markdown };
}

async function runJson(args) {
  const result = await runDws([...args, "-f", "json"]);
  return parseJsonOutput(result.stdout);
}

export async function getDingTalkAuthStatus(options = {}) {
  const versionResult = await runDws(["--version"]);
  const data = await runJson(addProfile(["auth", "status"], options.profile));
  const authenticated = Boolean(data.authenticated);
  const version = versionResult.stdout.trim();
  return {
    data: { ...data, version },
    markdown: [
      "# 钉钉授权状态",
      "",
      "| 项目 | 状态 |",
      "|---|---|",
      `| DWS | ${escapeCell(version)} |`,
      `| OAuth | ${authenticated ? "已登录" : "未登录"} |`,
      `| 组织/Profile | ${escapeCell(data.profile || data.corpName || options.profile)} |`,
      "",
      authenticated
        ? "当前工具仅能读取该授权用户有权访问的会话。"
        : "请先调用 `dingtalk_auth_login` 完成钉钉官方 OAuth 登录。"
    ].join("\n")
  };
}

export async function loginDingTalk(options = {}) {
  const args = addProfile(["auth", "login"], options.profile);
  const result = await runDws(args, LOGIN_TIMEOUT_MS);
  const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
  return {
    data: { success: true, output },
    markdown: `# 钉钉 OAuth 登录\n\n${output || "登录流程已完成。"}`
  };
}

export async function searchDingTalkGroups(options = {}) {
  const query = requiredText(options.query, "query");
  const limit = normalizedLimit(options.limit, 20);
  const cursor = String(options.cursor ?? "0");
  const args = [
    "chat",
    "search",
    "--query",
    query,
    "--limit",
    String(limit),
    "--cursor",
    cursor
  ];
  if (options.excludeMuted) args.push("--exclude-muted");
  const data = await runJson(addProfile(args, options.profile));
  return formatDingTalkResult("钉钉群聊候选", data, {
    kind: "groups",
    query: { 关键词: query, 游标: cursor }
  });
}

export async function searchDingTalkMessages(options = {}) {
  const query = requiredText(options.query, "query");
  const start = isoDateTime(options.start, "start");
  const end = isoDateTime(options.end, "end");
  if (Date.parse(start) > Date.parse(end)) throw new Error("start 不能晚于 end。");
  const limit = normalizedLimit(options.limit, 100);
  const cursor = String(options.cursor ?? "0");
  const args = [
    "chat",
    "message",
    "search",
    "--query",
    query,
    "--start",
    start,
    "--end",
    end,
    "--limit",
    String(limit),
    "--cursor",
    cursor
  ];
  if (options.group) args.push("--group", requiredText(options.group, "group"));
  const data = await runJson(addProfile(args, options.profile));
  return formatDingTalkResult("钉钉消息搜索", data, {
    kind: "messages",
    query: { 关键词: query, 开始时间: start, 结束时间: end, 群聊: options.group, 游标: cursor }
  });
}

function conversationSelector(options) {
  const selectors = [
    ["group", options.group],
    ["user", options.user],
    ["open-dingtalk-id", options.openDingTalkId]
  ].filter(([, value]) => String(value || "").trim());
  if (selectors.length !== 1) {
    throw new Error("group、user、openDingTalkId 只能提供一个，且必须提供一个。");
  }
  return selectors[0];
}

export async function listDingTalkMessages(options = {}) {
  const [selector, selectorValue] = conversationSelector(options);
  const time = localDateTime(options.time, "time");
  const limit = normalizedLimit(options.limit, 50);
  const direction = options.direction || "newer";
  if (!new Set(["newer", "older"]).has(direction)) {
    throw new Error("direction 只能是 newer 或 older。");
  }
  const args = [
    "chat",
    "message",
    "list",
    `--${selector}`,
    requiredText(selectorValue, selector),
    "--time",
    time,
    "--direction",
    direction,
    "--limit",
    String(limit)
  ];
  const data = await runJson(addProfile(args, options.profile));
  return formatDingTalkResult("钉钉会话消息", data, {
    kind: "messages",
    paginationMode: "time",
    direction,
    query: { 会话类型: selector, 会话标识: selectorValue, 起点时间: time, 方向: direction }
  });
}

export async function listAllDingTalkMessages(options = {}) {
  const start = localDateTime(options.start, "start");
  const end = localDateTime(options.end, "end");
  if (start > end) throw new Error("start 不能晚于 end。");
  const limit = normalizedLimit(options.limit, 50);
  const cursor = String(options.cursor ?? "0");
  const args = [
    "chat",
    "message",
    "list-all",
    "--start",
    start,
    "--end",
    end,
    "--limit",
    String(limit),
    "--cursor",
    cursor
  ];
  const data = await runJson(addProfile(args, options.profile));
  return formatDingTalkResult("钉钉全部会话消息", data, {
    kind: "messages",
    query: { 开始时间: start, 结束时间: end, 游标: cursor }
  });
}
