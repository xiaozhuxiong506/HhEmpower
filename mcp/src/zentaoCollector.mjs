import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import {
  analyzeZentaoTasks,
  analyzeZentaoWorkItems,
  normalizeTaskText
} from "./zentaoAnalyzer.mjs";

const DEFAULT_ZENTAO_URL = "http://hallzd.internal.tsb.com/zentao/my.html";
const DEFAULT_MAX_TASKS = 2000;
const DEFAULT_LOGIN_WAIT_MS = 120000;

const WORK_ITEM_CONFIG = Object.freeze({
  task: Object.freeze({
    kind: "task",
    listPath: "/zentao/my-work-task-assignedTo.html",
    fallbackListPaths: [
      "/zentao/my-work-task-assignedTo.html",
      "/zentao/my-task.html",
      "/zentao/my-task-assignedTo.html",
      "/zentao/task-browse.html"
    ],
    listHrefFragment: "my-work-task-assignedTo",
    viewPath: id => `/zentao/task-view-${id}.html`,
    hrefPattern: /task-(view|edit)|\/task\/view|taskID=|task-view/i,
    idPattern: /task-(?:view|edit)-(\d+)|taskID=(\d+)|\/task\/view\/(\d+)/i
  }),
  bug: Object.freeze({
    kind: "bug",
    listPath: "/zentao/my-work-bug-assignedTo.html",
    fallbackListPaths: [
      "/zentao/my-work-bug-assignedTo.html",
      "/zentao/my-bug.html",
      "/zentao/bug-browse.html"
    ],
    listHrefFragment: "my-work-bug-assignedTo",
    viewPath: id => `/zentao/bug-view-${id}.html`,
    hrefPattern: /bug-(view|edit)|\/bug\/view|bugID=|bug-view/i,
    idPattern: /bug-(?:view|edit)-(\d+)|bugID=(\d+)|\/bug\/view\/(\d+)/i
  })
});

function getWorkItemConfig(kind) {
  const config = WORK_ITEM_CONFIG[kind];
  if (!config) throw new Error(`Unsupported Zentao work item kind: ${kind}`);
  return config;
}

function stripKind(item) {
  const { kind: _kind, ...legacyItem } = item;
  return legacyItem;
}

function defaultProfileDir() {
  const base = process.env.LOCALAPPDATA || os.tmpdir();
  return path.join(base, "TsbBrowserMcp", "playwright-profile");
}

function toAbsoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href || "";
  }
}

async function launchPersistentChrome(options = {}) {
  const profileDir = options.profileDir || process.env.TSB_MCP_PROFILE_DIR || defaultProfileDir();
  const headless = Boolean(options.headless);
  const channel = options.browserChannel || process.env.TSB_MCP_BROWSER_CHANNEL || "chrome";
  const launchOptions = {
    headless,
    viewport: null,
    ignoreHTTPSErrors: true,
    args: ["--start-maximized"]
  };

  try {
    return await chromium.launchPersistentContext(profileDir, {
      ...launchOptions,
      channel
    });
  } catch (error) {
    if (channel !== "chrome") throw error;
    return chromium.launchPersistentContext(profileDir, launchOptions);
  }
}

async function waitForPageReady(page) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
}

async function waitForScopeReady(scope) {
  await scope.waitForLoadState?.("domcontentloaded").catch(() => {});
  await scope.waitForLoadState?.("networkidle", { timeout: 5000 }).catch(() => {});
}

export async function findZentaoContentFrame(page) {
  await waitForPageReady(page);

  const frames = page.frames();
  const scoredFrames = [];
  for (const frame of frames) {
    let text = "";
    try {
      text = await frame.locator("body").innerText({ timeout: 1000 });
    } catch {
      text = "";
    }

    let score = 0;
    if (frame === page.mainFrame()) score += 1;
    if (/^app-/i.test(frame.name())) score += 10;
    if (/指派给我|任务数|我的待处理|最新动态/.test(text)) score += 20;
    if (/xuanxuan|聊天|最近聊天/.test(frame.url()) || /最近聊天|请选择一个聊天/.test(text)) score -= 20;
    scoredFrames.push({ frame, score });
  }

  scoredFrames.sort((a, b) => b.score - a.score);
  return scoredFrames[0]?.frame || page.mainFrame();
}

async function waitForLoginIfNeeded(page, loginWaitMs = DEFAULT_LOGIN_WAIT_MS) {
  const looksLoggedOut = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const hasPassword = Boolean(document.querySelector("input[type='password']"));
    return hasPassword || /登录|登陆|用户名|密码|login/i.test(text.slice(0, 2000));
  });

  if (!looksLoggedOut) return false;

  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        const hasPassword = Boolean(document.querySelector("input[type='password']"));
        return !hasPassword && !/用户名|密码|登录|登陆/i.test(text.slice(0, 2000));
      },
      { timeout: loginWaitMs }
    )
    .catch(() => {
      throw new Error("禅道需要登录：浏览器已打开，请登录后重新调用 MCP 工具。");
    });
  await waitForPageReady(page);
  return true;
}

async function clickFirstVisible(page, locators) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < Math.min(count, 5); index += 1) {
      const item = locator.nth(index);
      if (!(await item.isVisible().catch(() => false))) continue;
      await item.click({ timeout: 3000 }).catch(() => null);
      await waitForScopeReady(page);
      return true;
    }
  }
  return false;
}

async function openAssignedTaskListLegacy(page, startUrl) {
  await waitForPageReady(page);

  const clicked = await clickFirstVisible(page, [
    page.getByRole("link", { name: /指派给我|指派给我的任务|我的任务|待处理任务|任务数/ }),
    page.locator("a").filter({ hasText: /指派给我|指派给我的任务|我的任务|待处理任务/ }),
    page.locator("a[href*='my-task'],a[href*='task']").filter({ hasText: /任务|指派|待处理/ })
  ]);

  if (clicked) return;

  const fallbackUrls = [
    "/zentao/my-task.html",
    "/zentao/my-task-assignedTo.html",
    "/zentao/task-browse.html"
  ].map(item => toAbsoluteUrl(startUrl, item));

  for (const url of fallbackUrls) {
    await page.goto(url).catch(() => null);
    await waitForPageReady(page);
    const foundLinks = await countTaskLinks(page);
    if (foundLinks > 0) return;
  }
}

export async function openAssignedWorkItemList(page, startUrl, kind) {
  const config = getWorkItemConfig(kind);
  await waitForPageReady(page);
  const contentFrame = await findZentaoContentFrame(page);
  const assignedText = kind === "bug"
    ? /指派给我.*(?:Bug|缺陷)|(?:Bug|缺陷).*指派给我/i
    : /指派给我|指派给我的任务|我的任务|待处理任务|任务数/;

  const clicked = await clickFirstVisible(contentFrame, [
    contentFrame.locator(`a[href*='${config.listHrefFragment}']`),
    contentFrame.getByRole("link", { name: assignedText }),
    contentFrame.locator("a").filter({ hasText: assignedText })
  ]);

  if (clicked) {
    await waitForPageReady(page);
    return findZentaoContentFrame(page);
  }

  const fallbackUrls = config.fallbackListPaths.map(item => toAbsoluteUrl(startUrl, item));

  for (const url of fallbackUrls) {
    const response = await page.goto(url).catch(() => null);
    if (!response) continue;
    await waitForPageReady(page);
    const frame = await findZentaoContentFrame(page);
    const foundLinks = await countWorkItemLinks(frame, kind);
    if (url === toAbsoluteUrl(startUrl, config.listPath) || foundLinks > 0) return frame;
  }

  return contentFrame;
}

async function openAssignedTaskList(page, startUrl) {
  return openAssignedWorkItemList(page, startUrl, "task");
}

async function countWorkItemLinks(page, kind) {
  const config = getWorkItemConfig(kind);
  return page.evaluate(patternSource => {
    const pattern = new RegExp(patternSource, "i");
    return Array.from(document.querySelectorAll("a[href]")).filter(anchor =>
      pattern.test(anchor.href || "")
    ).length;
  }, config.hrefPattern.source);
}

async function countTaskLinks(page) {
  return countWorkItemLinks(page, "task");
}

async function setPageSize(page, pageSize = DEFAULT_MAX_TASKS) {
  const changedSelect = await page.evaluate(size => {
    const selects = Array.from(document.querySelectorAll("select"));
    for (const select of selects) {
      const options = Array.from(select.options || []);
      let option = options.find(item => item.value === String(size) || item.textContent?.includes(String(size)));
      if (!option && /(每页|条|分页|recPerPage)/i.test(select.outerHTML)) {
        option = document.createElement("option");
        option.value = String(size);
        option.textContent = String(size);
        select.appendChild(option);
      }
      if (!option) continue;
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  }, pageSize);

  if (changedSelect) {
    await waitForScopeReady(page);
    return true;
  }

  const clickedPager = await clickFirstVisible(page, [
    page.locator("button,a,span").filter({ hasText: /每页|条\/页|20\/页|50\/页|100\/页|200\/页/ })
  ]);

  if (clickedPager) {
    const clickedSize = await clickFirstVisible(page, [
      page.locator("a,button,li,span").filter({ hasText: new RegExp(String(pageSize)) })
    ]);
    if (clickedSize) return true;
  }

  return false;
}

export async function extractWorkItemLinks(page, kind, maxItems = DEFAULT_MAX_TASKS) {
  const config = getWorkItemConfig(kind);
  const links = await page.evaluate(({ itemKind, limit, hrefPatternSource, idPatternSource }) => {
    const seen = new Set();
    const result = [];
    const hrefPattern = new RegExp(hrefPatternSource, "i");
    const idPattern = new RegExp(idPatternSource, "i");
    const normalize = value => String(value || "").replace(/\s+/g, " ").trim();
    const pushLink = (item) => {
      if (result.length >= limit) return true;
      const id = normalize(item.id);
      const title = normalize(item.title);
      const url = normalize(item.url);
      if (!title || (!url && !item.useViewPath)) return false;
      const key = id ? `${itemKind}:${id}` : `${itemKind}:${url.replace(/#.*$/, "")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      result.push({ id, kind: itemKind, title, url, useViewPath: Boolean(item.useViewPath) });
      return result.length >= limit;
    };

    const dtableRows = [];
    try {
      const candidates = [
        "#table-my-work",
        ...Array.from(document.querySelectorAll("[id]"))
          .map(element => `#${CSS.escape(element.id)}`)
          .filter(selector => /table|task|bug|work/i.test(selector))
      ];
      for (const candidate of candidates) {
        const table = window.zui?.DTable?.query?.(candidate) ||
          window.zui?.DTable?.query?.(document.querySelector(candidate));
        const rows = table?.$?.state?.data || table?.options?.data || table?.$.state?.rows || [];
        if (Array.isArray(rows) && rows.length) dtableRows.push(...rows);
      }
    } catch {
      // Fall back to DOM links below.
    }

    for (const row of dtableRows) {
      const data = row?.data || row || {};
      const id = normalize(data.id || data.bugID || data.bugId || data.taskID || data.taskId);
      const title = normalize(data.name || data.title);
      if (!/^\d+$/.test(id) || !title) continue;
      if (pushLink({
        id,
        title,
        url: "",
        useViewPath: true
      })) break;
    }

    const anchors = Array.from(document.querySelectorAll("a[href]"));
    for (const anchor of anchors) {
      const href = anchor.href || "";
      const text = normalize(anchor.innerText || anchor.textContent);
      if (!text) continue;
      if (!hrefPattern.test(href)) continue;
      const idMatch = href.match(idPattern);
      if (pushLink({
        id: idMatch ? idMatch.slice(1).find(Boolean) || "" : "",
        title: text,
        url: href
      })) break;
    }

    return result;
  }, {
    itemKind: kind,
    limit: maxItems,
    hrefPatternSource: config.hrefPattern.source,
    idPatternSource: config.idPattern.source
  });

  return links.map(item => {
    const { useViewPath, ...link } = item;
    return {
      ...link,
      url: toAbsoluteUrl(page.url(), useViewPath ? config.viewPath(item.id) : item.url)
    };
  });
}

export async function extractTaskLinks(page, maxTasks = DEFAULT_MAX_TASKS) {
  const links = await extractWorkItemLinks(page, "task", maxTasks);
  return links.map(stripKind);
}

async function findNextWorkItemListPageUrl(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    const next = links.find(anchor => {
      const title = anchor.getAttribute("title") || "";
      const label = `${title} ${anchor.getAttribute("aria-label") || ""} ${anchor.textContent || ""}`;
      const disabledContainer = anchor.closest(".disabled,[aria-disabled='true']");
      const style = window.getComputedStyle(anchor);
      const visible = style.display !== "none" && style.visibility !== "hidden" &&
        Boolean(anchor.offsetWidth || anchor.offsetHeight || anchor.getClientRects().length);
      return label.includes("下一页") && visible && !disabledContainer &&
        !anchor.hasAttribute("disabled");
    });
    return next?.href || "";
  });
}

export async function extractPaginatedWorkItemLinks(
  page,
  initialScope,
  kind,
  maxItems = DEFAULT_MAX_TASKS
) {
  getWorkItemConfig(kind);
  const links = [];
  const seen = new Set();
  const pagesVisited = [];
  let scope = initialScope;

  for (let pageIndex = 0; pageIndex < 50 && links.length < maxItems; pageIndex += 1) {
    pagesVisited.push(scope.url());
    const pageLinks = await extractWorkItemLinks(scope, kind, maxItems);
    for (const link of pageLinks) {
      const key = link.id ? `${kind}:${link.id}` : `${kind}:${link.url.replace(/#.*$/, "")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(link);
      if (links.length >= maxItems) break;
    }
    if (links.length >= maxItems) break;

    const nextUrl = await findNextWorkItemListPageUrl(scope).catch(() => "");
    if (!nextUrl || pagesVisited.includes(nextUrl)) break;

    const response = await page.goto(nextUrl, { waitUntil: "domcontentloaded" }).catch(() => null);
    if (!response) break;
    await waitForPageReady(page);
    scope = await findZentaoContentFrame(page);
  }

  return { links, pagesVisited };
}

export async function extractPaginatedTaskLinks(page, initialScope, maxTasks = DEFAULT_MAX_TASKS) {
  const result = await extractPaginatedWorkItemLinks(page, initialScope, "task", maxTasks);
  return {
    ...result,
    links: result.links.map(stripKind)
  };
}

function extractLabelValueFromText(text, labels) {
  if (!text) return "";
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  for (const label of labels) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.includes(label)) continue;
      const inline = line.replace(label, "").replace(/^[:：\s-]+/, "").trim();
      if (inline && inline !== label) return inline;
      return lines[index + 1] || "";
    }
  }
  return "";
}

const DETAIL_CONTROL_LABELS = new Set([
  "返回",
  "编辑",
  "添加",
  "添加备注",
  "保存",
  "关闭",
  "取消",
  "删除",
  "提交",
  "确认",
  "确定",
  "更多",
  "重现步骤",
  "复现步骤",
  "步骤",
  "描述",
  "Bug描述",
  "问题描述",
  "任务描述",
  "需求描述",
  "备注",
  "备注信息",
  "说明",
  "内容",
  "Bug内容",
  "任务内容"
]);

function normalizeDetailCandidate(value) {
  const text = normalizeTaskText(value);
  if (/^(暂无描述|无描述|添加备注)$/i.test(text)) return "";
  const tokens = text.split(/[\s/|,，、]+/).filter(Boolean);
  if (tokens.length && tokens.every(token => DETAIL_CONTROL_LABELS.has(token))) return "";
  return text;
}

function normalizeRemarkCandidate(value) {
  return normalizeDetailCandidate(String(value || "").replace(/^备注[:：]?\s*/, ""));
}

function firstNormalizedDetailCandidate(candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeDetailCandidate(candidate);
    if (normalized) return normalized;
  }
  return "";
}

export async function extractWorkItemDetail(context, workItemLink) {
  const config = getWorkItemConfig(workItemLink?.kind);
  const page = await context.newPage();
  try {
    await page.goto(workItemLink.url, { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    const detailFrame = await findZentaoContentFrame(page);

    const detail = await detailFrame.evaluate(() => {
      const ignoredText = /^(返回|编辑|添加|添加备注|保存|关闭|取消|删除|提交|确认|确定|更多|暂无备注|无备注|暂无描述|无描述)$/i;
      const detailRoot = document.querySelector(
        "#mainContent,.main-content,.detail-view,.detail-container,main,.article"
      ) || document.body;
      const visibleText = (element) => {
        if (!element) return "";
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const parts = [];
        let node = walker.nextNode();
        while (node) {
          const parent = node.parentElement;
          const ignoredControl = parent?.closest(
            "button,input,textarea,select,[role='button'],.btn,.toolbar,.actions,.add-remark,.add-comment"
          );
          const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
          if (!ignoredControl && text && !ignoredText.test(text)) parts.push(text);
          node = walker.nextNode();
        }
        return parts.join(" ").replace(/\s+/g, " ").trim();
      };
      const firstText = (selectors) => {
        for (const selector of selectors) {
          const element = detailRoot.querySelector(selector);
          const text = visibleText(element);
          if (text) return text;
        }
        return "";
      };
      const detailText = detailRoot.innerText || "";
      const articleText = firstText([".article", ".detail-content", ".desc"]);
      const descriptionText = firstText([
        ".description",
        ".bug-description",
        ".task-description",
        "[data-field='description']"
      ]);
      const contentText = firstText([
        ".steps",
        ".reproduce-steps",
        ".bug-steps",
        ".content",
        "[data-field='steps']",
        "[data-field='content']"
      ]);
      const commentText = firstText([
        ".comment",
        ".history-panel .comment",
        ".history-panel-comment",
        ".remark",
        ".remarks"
      ]);
      const tablePairs = {};
      for (const row of Array.from(detailRoot.querySelectorAll("tr"))) {
        const cells = Array.from(row.children).map(cell => visibleText(cell)).filter(Boolean);
        if (cells.length >= 2 && cells[0].length <= 20) tablePairs[cells[0].replace(/[:：]$/, "")] = cells.slice(1).join(" ");
      }
      for (const item of Array.from(detailRoot.querySelectorAll("dt"))) {
        const key = visibleText(item).replace(/[:：]$/, "");
        const value = visibleText(item.nextElementSibling);
        if (key && value) tablePairs[key] = value;
      }

      return {
        title: firstText([
          "#mainContent h1",
          ".heading h1",
          ".main-title",
          ".task-title",
          ".bug-title",
          "h1"
        ]) || document.title,
        articleText,
        descriptionText,
        contentText,
        commentText,
        detailText,
        tablePairs
      };
    });

    const pairs = detail.tablePairs || {};
    const detailText = detail.detailText || "";
    const descriptionLabels = config.kind === "bug"
      ? ["Bug描述", "问题描述", "描述"]
      : ["任务描述", "需求描述", "描述"];
    const contentLabels = config.kind === "bug"
      ? ["重现步骤", "复现步骤", "步骤", "Bug内容", "内容"]
      : ["任务内容", "内容"];
    const titleLabels = config.kind === "bug"
      ? ["Bug标题", "标题"]
      : ["任务名称", "任务标题", "标题"];
    const description = firstNormalizedDetailCandidate([
      ...descriptionLabels.map(label => pairs[label]),
      detail.descriptionText,
      detail.articleText,
      extractLabelValueFromText(detailText, descriptionLabels)
    ]);
    const remarks =
      normalizeRemarkCandidate(pairs["备注"]) ||
      normalizeRemarkCandidate(pairs["备注信息"]) ||
      normalizeRemarkCandidate(pairs["说明"]) ||
      normalizeRemarkCandidate(detail.commentText);
    const content = firstNormalizedDetailCandidate([
      ...contentLabels.map(label => pairs[label]),
      detail.contentText,
      extractLabelValueFromText(detailText, contentLabels)
    ]);

    const detailTitle = normalizeTaskText(
      titleLabels.map(label => pairs[label]).find(Boolean) || detail.title
    );
    const browserTitlePattern = new RegExp(`^${config.kind.toUpperCase()}#\\d+`, "i");
    const title = detailTitle && !browserTitlePattern.test(detailTitle)
      ? detailTitle
      : normalizeTaskText(workItemLink.title);

    return {
      id: workItemLink.id,
      kind: config.kind,
      url: workItemLink.url,
      title,
      content,
      remarks,
      description
    };
  } finally {
    await page.close().catch(() => {});
  }
}

export async function extractTaskDetail(context, taskLink) {
  const detail = await extractWorkItemDetail(context, { ...taskLink, kind: "task" });
  return stripKind(detail);
}

export function formatZentaoAnalysisMarkdown(result) {
  const lines = [
    `# 禅道指派给我任务分析`,
    "",
    `- 任务数：${result.taskCount}`,
    `- 分组数：${result.groups.length}`,
    ""
  ];

  for (const group of result.groups) {
    lines.push(`## ${group.module}（${group.taskCount}）`);
    for (const task of group.tasks) {
      lines.push(`- ${task.title}${task.id ? `（#${task.id}）` : ""}`);
      if (task.url) lines.push(`  - 链接：${task.url}`);
      if (task.content) lines.push(`  - 内容：${task.content}`);
      if (task.remarks) lines.push(`  - 备注：${task.remarks}`);
      if (task.description) lines.push(`  - 任务描述：${task.description}`);
    }
    lines.push("");
  }

  lines.push("## 多 Agent 执行包");
  for (const item of result.agentPlan) {
    lines.push(`- ${item.agentName}：${item.taskCount} 个任务`);
  }

  return lines.join("\n").trim();
}

export function formatZentaoWorkItemAnalysisMarkdown(result) {
  const groups = result.groups || [];
  const lines = [
    "# 禅道指派给我工作项分析",
    "",
    `- 工作项数：${result.workItemCount}`,
    `- 任务数：${result.taskCount}`,
    `- Bug 数：${result.bugCount}`,
    `- 分组数：${groups.length}`,
    ""
  ];

  for (const group of groups) {
    const workItems = group.workItems || group.tasks || [];
    const workItemCount = group.workItemCount ?? workItems.length;
    lines.push(`## ${group.module}（${workItemCount}）`);
    for (const workItem of workItems) {
      const kindLabel = workItem.kind === "bug" ? "Bug" : "任务";
      lines.push(`- ${kindLabel}：${workItem.title}${workItem.id ? `（#${workItem.id}）` : ""}`);
      if (workItem.url) lines.push(`  - 链接：${workItem.url}`);
      if (workItem.content) lines.push(`  - 内容：${workItem.content}`);
      if (workItem.remarks) lines.push(`  - 备注：${workItem.remarks}`);
      if (workItem.description) lines.push(`  - ${kindLabel}描述：${workItem.description}`);
    }
    lines.push("");
  }

  lines.push("## 多 Agent 执行包");
  for (const item of result.agentPlan || []) {
    lines.push(
      `- ${item.agentName}：${item.workItemCount} 个工作项` +
      `（任务 ${item.taskCount}，Bug ${item.bugCount}）`
    );
  }

  return lines.join("\n").trim();
}

export async function collectAssignedZentaoWorkItems(options = {}) {
  const startUrl = options.url || DEFAULT_ZENTAO_URL;
  const maxTasks = Number(options.maxTasks || DEFAULT_MAX_TASKS);
  const maxBugs = Number(options.maxBugs || maxTasks);
  const pageSize = Number(options.pageSize || DEFAULT_MAX_TASKS);
  const loginWaitMs = Number(options.loginWaitMs || DEFAULT_LOGIN_WAIT_MS);
  const keepBrowserOpen = options.keepBrowserOpen !== false;
  const includeRawText = Boolean(options.includeRawText);

  const contextFactory = options.contextFactory || launchPersistentChrome;
  const context = await contextFactory(options);
  const page = context.pages()[0] || await context.newPage();

  const state = {
    task: { listUrl: "", pagesVisited: [], linksFound: 0, workItems: [] },
    bug: { listUrl: "", pagesVisited: [], linksFound: 0, workItems: [] }
  };
  const collectionErrors = [];

  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await waitForLoginIfNeeded(page, loginWaitMs);

    for (const [kind, maxItems] of [["task", maxTasks], ["bug", maxBugs]]) {
      const kindState = state[kind];
      try {
        if (kind === "bug") {
          await page.goto(startUrl, { waitUntil: "domcontentloaded" });
          await waitForPageReady(page);
        }

        const listScope = await openAssignedWorkItemList(page, startUrl, kind);
        kindState.listUrl = listScope.url();
        await setPageSize(listScope, pageSize);

        const linkResult = await extractPaginatedWorkItemLinks(
          page,
          listScope,
          kind,
          maxItems
        );
        kindState.pagesVisited = linkResult.pagesVisited;
        kindState.linksFound = linkResult.links.length;

        for (const link of linkResult.links.slice(0, maxItems)) {
          try {
            const workItem = await extractWorkItemDetail(context, link);
            if (!includeRawText) delete workItem.rawText;
            kindState.workItems.push(workItem);
          } catch (error) {
            collectionErrors.push({
              kind,
              message: error instanceof Error ? error.message : String(error)
            });
          }
        }
      } catch (error) {
        collectionErrors.push({
          kind,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const analysis = analyzeZentaoWorkItems([
      ...state.task.workItems,
      ...state.bug.workItems
    ]);
    const result = {
      sourceUrl: startUrl,
      collectedAt: new Date().toISOString(),
      pageSizeRequested: pageSize,
      taskListUrl: state.task.listUrl,
      bugListUrl: state.bug.listUrl,
      taskPagesVisited: state.task.pagesVisited,
      bugPagesVisited: state.bug.pagesVisited,
      taskLinksFound: state.task.linksFound,
      bugLinksFound: state.bug.linksFound,
      ...analysis,
      collectionErrors
    };

    return {
      ...result,
      markdown: formatZentaoWorkItemAnalysisMarkdown(result)
    };
  } finally {
    if (!keepBrowserOpen) await context.close().catch(() => {});
  }
}

export async function collectAssignedZentaoTasks(options = {}) {
  const startUrl = options.url || DEFAULT_ZENTAO_URL;
  const maxTasks = Number(options.maxTasks || DEFAULT_MAX_TASKS);
  const pageSize = Number(options.pageSize || DEFAULT_MAX_TASKS);
  const loginWaitMs = Number(options.loginWaitMs || DEFAULT_LOGIN_WAIT_MS);
  const keepBrowserOpen = options.keepBrowserOpen !== false;
  const includeRawText = Boolean(options.includeRawText);

  const context = await launchPersistentChrome(options);
  let page = context.pages()[0] || await context.newPage();

  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await waitForLoginIfNeeded(page, loginWaitMs);
    const taskListScope = await openAssignedTaskList(page, startUrl);
    await setPageSize(taskListScope, pageSize);

    const taskLinkResult = await extractPaginatedTaskLinks(page, taskListScope, maxTasks);
    const taskLinks = taskLinkResult.links;
    const tasks = [];
    for (const taskLink of taskLinks.slice(0, maxTasks)) {
      const task = await extractTaskDetail(context, taskLink);
      if (!includeRawText) delete task.rawText;
      tasks.push(task);
    }

    const analysis = analyzeZentaoTasks(tasks);
    const result = {
      sourceUrl: startUrl,
      listUrl: taskListScope.url(),
      listPagesVisited: taskLinkResult.pagesVisited,
      collectedAt: new Date().toISOString(),
      pageSizeRequested: pageSize,
      taskLinksFound: taskLinks.length,
      ...analysis
    };

    return {
      ...result,
      markdown: formatZentaoAnalysisMarkdown(result)
    };
  } finally {
    if (!keepBrowserOpen) await context.close().catch(() => {});
  }
}
