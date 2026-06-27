import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { analyzeZentaoTasks, normalizeTaskText } from "./zentaoAnalyzer.mjs";

const DEFAULT_ZENTAO_URL = "http://hallzd.internal.tsb.com/zentao/my.html";
const DEFAULT_MAX_TASKS = 2000;
const DEFAULT_LOGIN_WAIT_MS = 120000;

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

async function openAssignedTaskList(page, startUrl) {
  await waitForPageReady(page);
  const contentFrame = await findZentaoContentFrame(page);

  const clicked = await clickFirstVisible(contentFrame, [
    contentFrame.locator("a[href*='my-work-task-assignedTo']"),
    contentFrame.getByRole("link", { name: /指派给我|指派给我的任务|我的任务|待处理任务|任务数/ }),
    contentFrame.locator("a").filter({ hasText: /指派给我|指派给我的任务|我的任务|待处理/ }),
    contentFrame.locator("a[href*='my-task'],a[href*='task']").filter({ hasText: /任务|指派|待处理/ })
  ]);

  if (clicked) {
    await waitForPageReady(page);
    return findZentaoContentFrame(page);
  }

  const fallbackUrls = [
    "/zentao/my-work-task-assignedTo.html",
    "/zentao/my-task.html",
    "/zentao/my-task-assignedTo.html",
    "/zentao/task-browse.html"
  ].map(item => toAbsoluteUrl(startUrl, item));

  for (const url of fallbackUrls) {
    await page.goto(url).catch(() => null);
    await waitForPageReady(page);
    const frame = await findZentaoContentFrame(page);
    const foundLinks = await countTaskLinks(frame);
    if (foundLinks > 0) return frame;
  }

  return contentFrame;
}

async function countTaskLinks(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]")).filter(anchor =>
      /task-(view|edit)|\/task\/view|taskID=|task-view/i.test(anchor.href || "")
    ).length;
  });
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

export async function extractTaskLinks(page, maxTasks = DEFAULT_MAX_TASKS) {
  const links = await page.evaluate(limit => {
    const seen = new Set();
    const result = [];
    const normalize = value => String(value || "").replace(/\s+/g, " ").trim();
    const pushLink = (item) => {
      const id = normalize(item.id);
      const title = normalize(item.title);
      const url = normalize(item.url);
      if (!title || !url) return false;
      const key = id ? `task:${id}` : url.replace(/#.*$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      result.push({ id, title, url });
      return result.length >= limit;
    };

    const dtableRows = [];
    try {
      const candidates = [
        "#table-my-work",
        ...Array.from(document.querySelectorAll("[id]"))
          .map(element => `#${CSS.escape(element.id)}`)
          .filter(selector => /table|task|work/i.test(selector))
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
      const id = normalize(data.id || data.taskID || data.taskId);
      const title = normalize(data.name || data.title);
      if (!/^\d+$/.test(id) || !title) continue;
      if (pushLink({
        id,
        title,
        url: new URL(`/zentao/task-view-${id}.html`, location.href).href
      })) return result;
    }

    const anchors = Array.from(document.querySelectorAll("a[href]"));
    for (const anchor of anchors) {
      const href = anchor.href || "";
      const text = normalize(anchor.innerText || anchor.textContent);
      if (!text) continue;
      if (!/task-(view|edit)|\/task\/view|taskID=|task-view/i.test(href)) continue;
      const idMatch = href.match(/task-(?:view|edit)-(\d+)|taskID=(\d+)|\/task\/view\/(\d+)/i);
      if (pushLink({
        id: idMatch ? idMatch.slice(1).find(Boolean) || "" : "",
        title: text,
        url: href
      })) break;
    }

    return result;
  }, maxTasks);

  return links.map(item => ({
    ...item,
    url: toAbsoluteUrl(page.url(), item.url)
  }));
}

async function findNextTaskListPageUrl(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    const next = links.find(anchor => {
      const title = anchor.getAttribute("title") || "";
      const className = String(anchor.className || "");
      return title.includes("下一页") && !className.includes("disabled");
    });
    return next?.href || "";
  });
}

export async function extractPaginatedTaskLinks(page, initialScope, maxTasks = DEFAULT_MAX_TASKS) {
  const links = [];
  const seen = new Set();
  const pagesVisited = [];
  let scope = initialScope;

  for (let pageIndex = 0; pageIndex < 50 && links.length < maxTasks; pageIndex += 1) {
    pagesVisited.push(scope.url());
    const pageLinks = await extractTaskLinks(scope, maxTasks);
    for (const link of pageLinks) {
      const key = link.id ? `task:${link.id}` : link.url.replace(/#.*$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(link);
      if (links.length >= maxTasks) break;
    }
    if (links.length >= maxTasks) break;

    const nextUrl = await findNextTaskListPageUrl(scope).catch(() => "");
    if (!nextUrl || pagesVisited.includes(nextUrl)) break;

    await page.goto(nextUrl, { waitUntil: "domcontentloaded" }).catch(() => null);
    await waitForPageReady(page);
    scope = await findZentaoContentFrame(page);
  }

  return { links, pagesVisited };
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

function normalizeRemarkCandidate(value) {
  const text = normalizeTaskText(String(value || "").replace(/^备注[:：]?\s*/, ""));
  if (/^(添加|添加备注|暂无备注|无备注)$/i.test(text)) return "";
  return text;
}

export async function extractTaskDetail(context, taskLink) {
  const page = await context.newPage();
  try {
    await page.goto(taskLink.url, { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    const detailFrame = await findZentaoContentFrame(page);

    const detail = await detailFrame.evaluate(() => {
      const visibleText = (element) => (element?.innerText || element?.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      const firstText = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          const text = visibleText(element);
          if (text) return text;
        }
        return "";
      };
      const bodyText = document.body?.innerText || "";
      const articleText = firstText([".article", ".detail-content", ".desc", ".content"]);
      const commentText = firstText([
        ".comment",
        ".history-panel .comment",
        ".history-panel-comment",
        ".remark",
        ".remarks"
      ]);
      const tablePairs = {};
      for (const row of Array.from(document.querySelectorAll("tr"))) {
        const cells = Array.from(row.children).map(cell => visibleText(cell)).filter(Boolean);
        if (cells.length >= 2 && cells[0].length <= 20) tablePairs[cells[0].replace(/[:：]$/, "")] = cells.slice(1).join(" ");
      }
      for (const item of Array.from(document.querySelectorAll("dt"))) {
        const key = visibleText(item).replace(/[:：]$/, "");
        const value = visibleText(item.nextElementSibling);
        if (key && value) tablePairs[key] = value;
      }

      return {
        title: firstText(["h1", ".heading h1", ".main-title", ".task-title", "#mainContent h1"]) || document.title,
        articleText,
        commentText,
        bodyText,
        tablePairs
      };
    });

    const pairs = detail.tablePairs || {};
    const bodyText = detail.bodyText || "";
    const description = normalizeTaskText(
      pairs["任务描述"] ||
      pairs["描述"] ||
      pairs["需求描述"] ||
      detail.articleText ||
      extractLabelValueFromText(bodyText, ["任务描述", "需求描述", "描述"])
    );
    const remarks =
      normalizeRemarkCandidate(pairs["备注"]) ||
      normalizeRemarkCandidate(pairs["备注信息"]) ||
      normalizeRemarkCandidate(pairs["说明"]) ||
      normalizeRemarkCandidate(detail.commentText);
    const content = normalizeTaskText(
      pairs["内容"] ||
      pairs["任务内容"]
    );

    const detailTitle = normalizeTaskText(detail.title);
    const title = detailTitle && !/^TASK#\d+/i.test(detailTitle)
      ? detailTitle
      : normalizeTaskText(taskLink.title);

    return {
      id: taskLink.id,
      url: taskLink.url,
      title,
      content,
      remarks,
      description
    };
  } finally {
    await page.close().catch(() => {});
  }
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
