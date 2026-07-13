import { chromium } from "playwright";

const DEFAULT_BASE_URL = "http://docs.internal.tsb.com";
const DEFAULT_LOGIN_WAIT_MS = 120000;
let inMemoryTornaToken = "";

export const TORNA_PROJECTS = Object.freeze([
  Object.freeze({
    key: "trade",
    name: "贸易系统",
    projectId: "RqXBwzEl",
    url: `${DEFAULT_BASE_URL}/#/project/doc/RqXBwzEl`,
    aliases: ["贸易", "贸易系统", "小竹熊贸易", "trade", "tradeerp", "ts"]
  }),
  Object.freeze({
    key: "hall",
    name: "展厅系统",
    projectId: "kpX9MXr1",
    url: `${DEFAULT_BASE_URL}/#/project/doc/kpX9MXr1`,
    aliases: ["展厅", "展厅系统", "小竹熊展厅", "hall", "hallerp", "th"]
  }),
  Object.freeze({
    key: "mall",
    name: "小竹熊平台-商城系统",
    projectId: "57zLZ8Qw",
    url: `${DEFAULT_BASE_URL}/#/project/doc/57zLZ8Qw`,
    aliases: ["商城", "商城系统", "小竹熊商城", "小竹熊平台-商城系统", "mall"]
  }),
  Object.freeze({
    key: "platform",
    name: "小竹熊平台-平台系统",
    projectId: "m32QA20r",
    url: `${DEFAULT_BASE_URL}/#/project/doc/m32QA20r`,
    aliases: ["平台", "平台系统", "小竹熊平台-平台系统", "platform"]
  })
]);

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function validateTornaOptions(options = {}, mode = "search") {
  const common = ["context", "headless", "loginWaitMs"];
  const allowed = new Set(mode === "detail"
    ? [...common, "docId"]
    : [...common, "system", "query", "moduleName", "method", "includeDetail", "limit"]);
  const unknown = Object.keys(options).filter(key => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`不支持的 Torna 参数：${unknown.sort().join(", ")}`);
  return options;
}

function markdownText(value) {
  const text = String(value ?? "").trim();
  return text ? text.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>") : "-";
}

function markdownCode(value) {
  const text = String(value ?? "").trim();
  return text ? `\`${text.replace(/`/g, "\\`")}\`` : "-";
}

function formatJsonExample(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  const text = String(value).trim();
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function resolveTornaProject(system) {
  const input = normalize(system);
  const project = TORNA_PROJECTS.find(item =>
    [item.key, item.name, item.projectId, ...item.aliases].some(alias => normalize(alias) === input)
  );
  if (!project) {
    throw new Error(`无法确定 Torna 项目：${system || "未提供系统"}。请明确选择贸易、展厅、商城或平台系统。`);
  }
  return project;
}

function buildFolderPath(document, documentMap) {
  const names = [];
  const visited = new Set();
  let parentId = document.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = documentMap.get(parentId);
    if (!parent) break;
    if (parent.name) names.unshift(parent.name);
    parentId = parent.parentId;
  }
  return names.join(" / ");
}

function candidateRank(document, query) {
  const normalizedQuery = normalize(query);
  const id = normalize(document.id);
  const name = normalize(document.name);
  const url = normalize(document.url);
  if (id === normalizedQuery || url === normalizedQuery) return 0;
  if (name === normalizedQuery) return 1;
  if (url.startsWith(normalizedQuery) || name.startsWith(normalizedQuery)) return 2;
  return 3;
}

export function findTornaApiCandidates({ modules = [], query, moduleName, method } = {}) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) throw new Error("Torna 接口检索必须提供名称、路径或文档 ID。");

  const normalizedModule = normalize(moduleName);
  const normalizedMethod = normalize(method);
  const candidates = [];

  for (const module of modules) {
    if (normalizedModule && !normalize(module.name).includes(normalizedModule)) continue;
    const documents = Array.isArray(module.documents) ? module.documents : [];
    const documentMap = new Map(documents.map(document => [document.id, document]));

    documents.forEach((document, index) => {
      if (Number(document.isFolder) === 1) return;
      if (normalizedMethod && normalize(document.httpMethod) !== normalizedMethod) return;
      const searchable = [document.id, document.name, document.url].map(normalize);
      if (!searchable.some(value => value.includes(normalizedQuery))) return;
      candidates.push({
        id: document.id,
        moduleId: module.id,
        moduleName: module.name,
        folderPath: buildFolderPath(document, documentMap),
        name: document.name,
        httpMethod: String(document.httpMethod || "").toUpperCase(),
        url: document.url,
        rank: candidateRank(document, query),
        sourceIndex: index
      });
    });
  }

  const sorted = candidates.sort((left, right) => left.rank - right.rank || left.sourceIndex - right.sourceIndex);
  const bestRank = sorted[0]?.rank;
  const precise = bestRank !== undefined && bestRank <= 1
    ? sorted.filter(candidate => candidate.rank === bestRank)
    : sorted;

  return precise
    .map(({ rank: _rank, sourceIndex: _sourceIndex, ...candidate }) => candidate);
}

export function prepareTornaCandidates(allCandidates = [], limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit || 20), 100));
  return {
    candidates: allCandidates.slice(0, safeLimit),
    totalCount: allCandidates.length,
    truncated: allCandidates.length > safeLimit,
    isUnique: allCandidates.length === 1
  };
}

export function formatTornaSearchMarkdown({ project, query, candidates = [], totalCount = candidates.length }) {
  const lines = [
    "# Torna 接口检索结果",
    "",
    `| 项目 | 检索条件 | 命中数量 |`,
    `| --- | --- | ---: |`,
    `| ${markdownText(project.name)} | ${markdownCode(query)} | ${totalCount} |`,
    ""
  ];

  if (candidates.length === 0) {
    lines.push("未找到匹配接口。请补充业务模块、接口路径或更精确的功能名称。");
    return lines.join("\n");
  }

  lines.push(
    "| 序号 | 应用 | 业务目录 | 接口名称 | 方法 | 路径 | 文档 ID |",
    "| ---: | --- | --- | --- | --- | --- | --- |"
  );
  candidates.forEach((candidate, index) => {
    lines.push(
      `| ${index + 1} | ${markdownText(candidate.moduleName)} | ${markdownText(candidate.folderPath)} | ${markdownText(candidate.name)} | ${markdownCode(candidate.httpMethod)} | ${markdownCode(candidate.url)} | ${markdownCode(candidate.id)} |`
    );
  });

  if (totalCount > 1) {
    const displayNote = totalCount > candidates.length ? `，当前显示前 ${candidates.length} 个` : "";
    lines.push("", `> 存在 ${totalCount} 个合理候选${displayNote}，请先确认业务目录或接口路径；不得自行选择。`);
  }
  return lines.join("\n");
}

function parameterPath(parameter, parameterMap) {
  const names = [parameter.name].filter(Boolean);
  const visited = new Set();
  let parentId = parameter.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = parameterMap.get(parentId);
    if (!parent) break;
    if (parent.name) names.unshift(parent.name);
    parentId = parent.parentId;
  }
  return names.join(".");
}

function formatParameterTable(parameters, kind) {
  if (!Array.isArray(parameters) || parameters.length === 0) return "无";
  const parameterMap = new Map(parameters.map(parameter => [parameter.id, parameter]));
  const isRequest = kind === "request";
  const lines = isRequest
    ? ["| 字段路径 | 类型 | 必填 | 最大长度 | 说明 |", "| --- | --- | :---: | ---: | --- |"]
    : ["| 字段路径 | 类型 | 说明 |", "| --- | --- | --- |"];

  for (const parameter of parameters) {
    const fieldPath = markdownCode(parameterPath(parameter, parameterMap));
    const type = markdownCode(parameter.type);
    const description = markdownText(parameter.description);
    if (isRequest) {
      const required = Number(parameter.required ?? parameter.require) === 1 ? "是" : "否";
      const maxLength = markdownText(parameter.maxLength);
      lines.push(`| ${fieldPath} | ${type} | ${required} | ${maxLength} | ${description} |`);
    } else {
      lines.push(`| ${fieldPath} | ${type} | ${description} |`);
    }
  }
  return lines.join("\n");
}

function formatRequestParameterTable(detail) {
  const groups = [
    ["Path", detail.pathParams],
    ["Query", detail.queryParams],
    ["Header", detail.headerParams],
    ["Body", detail.requestParams]
  ];
  if (groups.every(([, parameters]) => !Array.isArray(parameters) || parameters.length === 0)) return "无";

  const lines = [
    "| 位置 | 字段路径 | 类型 | 必填 | 最大长度 | 说明 |",
    "| --- | --- | --- | :---: | ---: | --- |"
  ];
  for (const [location, parameters] of groups) {
    if (!Array.isArray(parameters)) continue;
    const parameterMap = new Map(parameters.map(parameter => [parameter.id, parameter]));
    for (const parameter of parameters) {
      const required = Number(parameter.required ?? parameter.require) === 1 ? "是" : "否";
      lines.push(
        `| ${location} | ${markdownCode(parameterPath(parameter, parameterMap))} | ${markdownCode(parameter.type)} | ${required} | ${markdownText(parameter.maxLength)} | ${markdownText(parameter.description)} |`
      );
    }
  }
  return lines.join("\n");
}

function parameterExampleValue(parameter, children) {
  const type = String(parameter.type || "").toLowerCase();
  if (children.length > 0) {
    const value = Object.fromEntries(children.map(child => [child.name, parameterExampleValue(child, child.children)]));
    return type.includes("array") || type.endsWith("[]") ? [value] : value;
  }
  if (parameter.example !== undefined && parameter.example !== null && parameter.example !== "") {
    if (type.includes("string") || type.includes("date") || type.includes("time")) return String(parameter.example);
    try {
      return JSON.parse(String(parameter.example));
    } catch {
      return parameter.example;
    }
  }
  if (type.includes("array") || type.endsWith("[]")) return [];
  if (type.includes("object")) return {};
  if (type.includes("bool")) return false;
  if (/int|long|double|float|decimal|number/.test(type)) return 0;
  if (type.includes("date") || type.includes("time")) return "";
  return "string";
}

function generateParameterExample(parameters, isArray) {
  if (!Array.isArray(parameters) || parameters.length === 0) return "";
  const nodes = new Map(parameters.map(parameter => [parameter.id, { ...parameter, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parentId && nodes.get(node.parentId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const value = Object.fromEntries(roots.map(root => [root.name, parameterExampleValue(root, root.children)]));
  return isArray ? [value] : value;
}

function detailExample(detail, kind) {
  const keys = kind === "request"
    ? ["requestExample", "requestExampleRaw", "requestBody"]
    : ["responseExample", "responseExampleRaw", "responseBody"];
  for (const key of keys) {
    if (detail[key] !== undefined && detail[key] !== null && detail[key] !== "") {
      return { value: detail[key], generated: false };
    }
  }
  const parameters = kind === "request" ? detail.requestParams : detail.responseParams;
  const isArray = Number(kind === "request" ? detail.isRequestArray : detail.isResponseArray) === 1;
  return { value: generateParameterExample(parameters, isArray), generated: true };
}

export function formatTornaDetailMarkdown(detail) {
  const requestExampleSource = detailExample(detail, "request");
  const responseExampleSource = detailExample(detail, "response");
  const requestExample = formatJsonExample(requestExampleSource.value);
  const responseExample = formatJsonExample(responseExampleSource.value);
  const lines = [
    `# ${markdownText(detail.name || detail.docName || "Torna 接口详情")}`,
    "",
    "## 基本信息",
    "",
    "| 项目 | 应用 | 业务目录 | 方法 | 路径 | Content-Type | 文档 ID |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    `| ${markdownText(detail.projectName)} | ${markdownText(detail.moduleName)} | ${markdownText(detail.folderPath)} | ${markdownCode(detail.httpMethod)} | ${markdownCode(detail.url)} | ${markdownCode(detail.contentType)} | ${markdownCode(detail.id)} |`,
    "",
    "## 请求参数",
    "",
    formatRequestParameterTable(detail),
    "",
    "## 响应参数",
    "",
    formatParameterTable(detail.responseParams, "response")
  ];

  if (requestExample) {
    lines.push("", "## 请求示例", "");
    if (requestExampleSource.generated) lines.push("> 根据字段结构生成，非文档原值。", "");
    lines.push("```json", requestExample, "```");
  }
  if (responseExample) {
    lines.push("", "## 响应示例", "");
    if (responseExampleSource.generated) lines.push("> 根据字段结构生成，非文档原值。", "");
    lines.push("```json", responseExample, "```");
  }
  return lines.join("\n");
}

async function launchBrowserContext(options = {}) {
  const channel = process.env.TSB_MCP_BROWSER_CHANNEL || "chrome";
  const launchOptions = {
    headless: Boolean(options.headless),
    args: ["--start-maximized"]
  };
  const browser = await chromium.launch({ ...launchOptions, channel });
  const context = await browser.newContext({ viewport: null, ignoreHTTPSErrors: true });
  return { browser, context };
}

async function readJson(response, label) {
  const status = response.status();
  if (status === 401 || status === 403) inMemoryTornaToken = "";
  if (!response.ok()) throw new Error(`${label}失败：HTTP ${status}`);
  const payload = await response.json();
  if (String(payload.code) !== "0") {
    const message = payload.msg || payload.message || "Torna 返回异常";
    if (/login error/i.test(message)) inMemoryTornaToken = "";
    throw new Error(`${label}失败：${message}`);
  }
  return payload.data;
}

async function ensureTornaSession(context, options = {}) {
  if (inMemoryTornaToken) return { authHeaders: { token: inMemoryTornaToken } };

  const page = context.pages()[0] || await context.newPage();
  const loginWaitMs = Number(options.loginWaitMs || DEFAULT_LOGIN_WAIT_MS);
  const loginResponsePromise = page.waitForResponse(
    response => response.url().includes("/system/login") && response.request().method() === "POST",
    { timeout: loginWaitMs }
  );
  await page.goto(`${DEFAULT_BASE_URL}/#/dashboard`, { waitUntil: "domcontentloaded" });
  const isLogin = () => page.url().includes("#/login");
  if (!isLogin()) {
    await page.waitForURL(url => url.toString().includes("#/login"), { timeout: 5000 }).catch(() => {});
  }
  if (isLogin()) {
    if (options.headless) {
      void loginResponsePromise.catch(() => {});
      throw new Error("Torna 尚未登录。请使用可见浏览器完成一次登录后重试。");
    }
    await page.waitForURL(url => !url.toString().includes("#/login"), {
      timeout: loginWaitMs
    }).catch(() => {
      throw new Error("等待 Torna 登录超时。请在打开的浏览器中完成登录后重试。");
    });
    const loginPayload = await (await loginResponsePromise).json();
    if (String(loginPayload.code) !== "0" || !loginPayload.data?.token) {
      throw new Error(`Torna 登录失败：${loginPayload.msg || "未返回登录 token"}`);
    }
    inMemoryTornaToken = loginPayload.data.token;
  } else {
    void loginResponsePromise.catch(() => {});
    throw new Error("未捕获 Torna 登录凭据。请退出 Torna 后重新运行工具并完成一次登录。");
  }
  return { authHeaders: { token: inMemoryTornaToken } };
}

async function withTornaContext(options, task) {
  const launched = options.context ? null : await launchBrowserContext(options);
  const context = options.context || launched.context;
  try {
    const session = await ensureTornaSession(context, options);
    return await task(context, session);
  } finally {
    if (launched) {
      await context.close().catch(() => {});
      await launched.browser.close().catch(() => {});
    }
  }
}

async function getProjects(context, authHeaders) {
  return readJson(
    await context.request.get(`${DEFAULT_BASE_URL}/doc/view/projects`, { headers: authHeaders }),
    "读取 Torna 项目"
  );
}

async function getModules(context, projectId, authHeaders) {
  return readJson(
    await context.request.get(`${DEFAULT_BASE_URL}/module/list`, { params: { projectId }, headers: authHeaders }),
    "读取 Torna 应用模块"
  );
}

async function getDocuments(context, moduleId, authHeaders) {
  return readJson(
    await context.request.post(`${DEFAULT_BASE_URL}/doc/list-v2`, {
      headers: authHeaders,
      data: { moduleId, status: null, filterEmptyFolder: 1 }
    }),
    "读取 Torna 接口列表"
  );
}

async function getDetail(context, docId, authHeaders) {
  return readJson(
    await context.request.get(`${DEFAULT_BASE_URL}/doc/view/detail`, { params: { id: docId }, headers: authHeaders }),
    "读取 Torna 接口详情"
  );
}

function findProjectInTree(projectTree, projectId) {
  for (const space of projectTree || []) {
    const project = (space.projects || []).find(item => item.id === projectId);
    if (project) return { ...project, spaceName: space.name };
  }
  return null;
}

function enrichDetail(detail, project, module, documents) {
  const documentMap = new Map((documents || []).map(document => [document.id, document]));
  return {
    ...detail,
    projectName: project.name,
    moduleName: module.name,
    folderPath: buildFolderPath(detail, documentMap)
  };
}

export async function searchTornaApi(options = {}) {
  validateTornaOptions(options, "search");
  const project = resolveTornaProject(options.system);
  return withTornaContext(options, async (context, { authHeaders }) => {
    const projectTree = await getProjects(context, authHeaders);
    if (!findProjectInTree(projectTree, project.projectId)) {
      throw new Error(`当前 Torna 账号无权读取${project.name}（${project.projectId}）。`);
    }

    const allModules = await getModules(context, project.projectId, authHeaders);
    const moduleFilter = normalize(options.moduleName);
    const selectedModules = moduleFilter
      ? allModules.filter(module => normalize(module.name).includes(moduleFilter))
      : allModules;
    if (selectedModules.length === 0) {
      throw new Error(`未找到应用模块：${options.moduleName}。请核对 Torna 项目和应用名称。`);
    }

    const modules = await Promise.all(selectedModules.map(async module => ({
      ...module,
      documents: await getDocuments(context, module.id, authHeaders)
    })));
    const allCandidates = findTornaApiCandidates({
      modules,
      query: options.query,
      moduleName: options.moduleName,
      method: options.method
    });
    const prepared = prepareTornaCandidates(allCandidates, options.limit);
    const { candidates } = prepared;
    let markdown = formatTornaSearchMarkdown({
      project,
      query: options.query,
      candidates,
      totalCount: prepared.totalCount
    });
    let detail = null;

    if (prepared.isUnique && options.includeDetail !== false) {
      const candidate = candidates[0];
      const module = modules.find(item => item.id === candidate.moduleId);
      const rawDetail = await getDetail(context, candidate.id, authHeaders);
      detail = enrichDetail(rawDetail, project, module, module.documents);
      markdown += `\n\n---\n\n${formatTornaDetailMarkdown(detail)}`;
    }

    return { project, candidates, truncated: prepared.truncated, detail, markdown };
  });
}

export async function getTornaApiDetail(options = {}) {
  validateTornaOptions(options, "detail");
  if (!String(options.docId || "").trim()) throw new Error("读取 Torna 接口详情必须提供文档 ID。");
  return withTornaContext(options, async (context, { authHeaders }) => {
    const detail = await getDetail(context, options.docId, authHeaders);
    const projectTree = await getProjects(context, authHeaders);
    const projectRecord = findProjectInTree(projectTree, detail.projectId);
    if (!projectRecord) throw new Error(`当前 Torna 账号无权读取项目：${detail.projectId}。`);
    const project = resolveTornaProject(detail.projectId);
    const modules = await getModules(context, detail.projectId, authHeaders);
    const module = modules.find(item => item.id === detail.moduleId);
    if (!module) throw new Error(`未找到接口所属应用模块：${detail.moduleId}。`);
    const documents = await getDocuments(context, detail.moduleId, authHeaders);
    const enriched = enrichDetail(detail, project, module, documents);
    return { project, detail: enriched, markdown: formatTornaDetailMarkdown(enriched) };
  });
}
