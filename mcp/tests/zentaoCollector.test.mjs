import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import {
  collectAssignedZentaoWorkItems,
  extractPaginatedWorkItemLinks,
  extractPaginatedTaskLinks,
  extractWorkItemDetail,
  extractWorkItemLinks,
  extractTaskDetail,
  extractTaskLinks,
  findZentaoContentFrame,
  formatZentaoWorkItemAnalysisMarkdown,
  openAssignedWorkItemList
} from "../src/zentaoCollector.mjs";

async function createCollectorFixture({ failBugDetail = false } = {}) {
  const browser = await chromium.launch({ headless: true });
  const playwrightContext = await browser.newContext();
  const startUrl = "http://collector.test/zentao/my.html";
  let contextFactoryCalls = 0;
  let contextCloseCalls = 0;
  let startPageRequests = 0;

  const pages = {
    "/zentao/my.html": () => {
      startPageRequests += 1;
      return `
        <html><body>
          <a href="/zentao/my-work-task-assignedTo.html">指派给我的任务</a>
          <a href="/zentao/my-work-bug-assignedTo.html">指派给我的 Bug</a>
        </body></html>
      `;
    },
    "/zentao/my-work-task-assignedTo.html": () => `
      <html><body>
        <a href="/zentao/task-view-501.html">采购订单增加审批详情</a>
      </body></html>
    `,
    "/zentao/my-work-bug-assignedTo.html": () => `
      <html><body>
        <a href="/zentao/bug-view-601.html">销售出货生成应收单报错</a>
      </body></html>
    `,
    "/zentao/task-view-501.html": () => `
      <html><head><title>TASK#501</title></head><body>
        <div id="mainContent">
          <h1>TASK#501</h1>
          <div class="article">增加采购订单审批详情</div>
        </div>
      </body></html>
    `,
    "/zentao/bug-view-601.html": () => `
      <html><head><title>BUG#601</title></head><body>
        <div id="mainContent">
          <h1>BUG#601</h1>
          <table>
            <tr><th>重现步骤</th><td>保存销售出货单</td></tr>
            <tr><th>描述</th><td>未生成应收单</td></tr>
          </table>
        </div>
      </body></html>
    `
  };

  await playwrightContext.route("http://collector.test/**", route => {
    const pathname = new URL(route.request().url()).pathname;
    if (failBugDetail && pathname === "/zentao/bug-view-601.html") {
      return route.abort("failed");
    }
    const render = pages[pathname];
    if (!render) return route.fulfill({ status: 404, body: "Not found" });
    return route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: render()
    });
  });

  const instrumentedContext = {
    pages: () => playwrightContext.pages(),
    newPage: (...args) => playwrightContext.newPage(...args),
    close: async () => {
      contextCloseCalls += 1;
      await playwrightContext.close();
    }
  };

  return {
    browser,
    playwrightContext,
    startUrl,
    contextFactory: async () => {
      contextFactoryCalls += 1;
      return instrumentedContext;
    },
    stats: () => ({ contextFactoryCalls, contextCloseCalls, startPageRequests })
  };
}

test("finds task links inside Zentao app iframe", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(`
      <html>
        <body>
          <nav><a href="/zentao/my.html">地盘</a></nav>
          <iframe
            name="app-my"
            srcdoc="
              <div>指派给我 <a href='http://hallzd.internal.tsb.com/zentao/my-work-task-assignedTo.html'>28</a> 任务数</div>
              <a href='http://hallzd.internal.tsb.com/zentao/task-view-4661.html'>展厅综合设置-国家资料</a>
            "
          ></iframe>
        </body>
      </html>
    `);

    const frame = await findZentaoContentFrame(page);
    assert.equal(frame.name(), "app-my");

    const links = await extractTaskLinks(frame, 10);
    assert.deepEqual(links, [
      {
        id: "4661",
        title: "展厅综合设置-国家资料",
        url: "http://hallzd.internal.tsb.com/zentao/task-view-4661.html"
      }
    ]);
  } finally {
    await browser.close();
  }
});

test("opens the assigned Bug list from the Zentao work page", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route("http://example.test/zentao/my.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html><body>
            <a href="/zentao/my-work-bug-assignedTo.html">指派给我的 Bug</a>
          </body></html>
        `
      });
    });
    await page.route("http://example.test/zentao/my-work-bug-assignedTo.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><a href="/zentao/bug-view-31.html">采购保存失败</a></body></html>`
      });
    });

    const startUrl = "http://example.test/zentao/my.html";
    await page.goto(startUrl);
    const scope = await openAssignedWorkItemList(page, startUrl, "bug");

    assert.equal(page.url(), "http://example.test/zentao/my-work-bug-assignedTo.html");
    assert.equal(scope.url(), "http://example.test/zentao/my-work-bug-assignedTo.html");
  } finally {
    await browser.close();
  }
});

test("extracts complete Zentao task rows from DTable state", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route("http://example.test/list.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: "<html><body><div id='table-my-work'></div></body></html>"
      });
    });
    await page.goto("http://example.test/list.html");
    await page.evaluate(() => {
      window.zui = {
        DTable: {
          query: () => ({
            $: {
              state: {
                data: [
                  { id: "4641", name: "展厅管理 / 产品出展-删除" },
                  { id: "4640", name: "展厅管理 / 产品出展-通用按钮" }
                ]
              }
            }
          })
        }
      };
    });

    const links = await extractTaskLinks(page, 10);
    assert.deepEqual(links, [
      {
        id: "4641",
        title: "展厅管理 / 产品出展-删除",
        url: "http://example.test/zentao/task-view-4641.html"
      },
      {
        id: "4640",
        title: "展厅管理 / 产品出展-通用按钮",
        url: "http://example.test/zentao/task-view-4640.html"
      }
    ]);
  } finally {
    await browser.close();
  }
});

test("merges DTable and DOM work item links without duplicates", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route("http://example.test/mixed-bugs.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html><body>
            <div id="table-my-work"></div>
            <a href="/zentao/bug-view-71.html">重复的 DOM Bug</a>
            <a href="/zentao/bug-view-73.html">仅存在于 DOM 的 Bug</a>
            <script>
              window.zui = {DTable: {query: () => ({$: {state: {data: [
                {bugID: "71", title: "来自 DTable 的 Bug"}
              ]}}})}};
            </script>
          </body></html>
        `
      });
    });

    await page.goto("http://example.test/mixed-bugs.html");
    const links = await extractWorkItemLinks(page, "bug", 10);

    assert.deepEqual(links.map(link => [link.id, link.title]), [
      ["71", "来自 DTable 的 Bug"],
      ["73", "仅存在于 DOM 的 Bug"]
    ]);

    const limitedLinks = await extractWorkItemLinks(page, "bug", 1);
    assert.equal(limitedLinks.length, 1);
  } finally {
    await browser.close();
  }
});

test("follows Zentao task list pagination", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route("http://example.test/page1.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html>
            <body>
              <div id="table-my-work"></div>
              <a class="pager-link" title="下一页" href="http://example.test/page2.html">下一页</a>
              <script>
                window.zui = {DTable: {query: () => ({$: {state: {data: [
                  {id: "1", name: "第一页任务"}
                ]}}})}};
              </script>
            </body>
          </html>
        `
      });
    });
    await page.route("http://example.test/page2.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html>
            <body>
              <div id="table-my-work"></div>
              <script>
                window.zui = {DTable: {query: () => ({$: {state: {data: [
                  {id: "2", name: "第二页任务"}
                ]}}})}};
              </script>
            </body>
          </html>
        `
      });
    });

    await page.goto("http://example.test/page1.html");
    const result = await extractPaginatedTaskLinks(page, page, 10);
    assert.deepEqual(result.links.map(link => link.title), ["第一页任务", "第二页任务"]);
    assert.ok(result.links.every(link => !("kind" in link)));
    assert.equal(result.pagesVisited.length, 2);
  } finally {
    await browser.close();
  }
});

test("extracts task detail from Zentao execution iframe", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.route("**/task-view-999.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html>
            <body>
              <nav>执行</nav>
              <iframe
                name="app-execution"
                srcdoc="
                  <div id='mainContent'>
                    <div>999</div>
                    <div>任务描述</div>
                    <div class='article'>修复采购订单字段权限</div>
                    <div class='history-panel'>
                      <div class='comment'>备注：需要同步打印导出字段</div>
                    </div>
                  </div>
                "
              ></iframe>
            </body>
          </html>
        `
      });
    });

    const task = await extractTaskDetail(context, {
      id: "999",
      title: "采购订单-字段权限",
      url: "http://example.test/zentao/task-view-999.html"
    });

    assert.equal(task.title, "采购订单-字段权限");
    assert.equal(task.description, "修复采购订单字段权限");
    assert.equal(task.remarks, "需要同步打印导出字段");
  } finally {
    await context.close();
    await browser.close();
  }
});

test("ignores Zentao navigation and add-remark controls in empty task details", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.route("**/task-view-1000.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html>
            <body>
              <iframe
                name="app-execution"
                srcdoc="
                  <nav>需求 测试 文档 构建 动态 设置 更多</nav>
                  <div id='mainContent'>
                    <div>1000</div>
                    <div>任务描述</div>
                    <div class='article'>暂无描述</div>
                    <div class='history-panel'>
                      <button>添加备注</button>
                      <div>1 2026-06-25 15:13:41, 由 陈永康 创建。</div>
                    </div>
                  </div>
                "
              ></iframe>
            </body>
          </html>
        `
      });
    });

    const task = await extractTaskDetail(context, {
      id: "1000",
      title: "展厅管理 / 展厅综合设置-国家资料",
      url: "http://example.test/zentao/task-view-1000.html"
    });

    assert.equal(task.content, "");
    assert.equal(task.remarks, "");
    assert.equal(task.description, "");
  } finally {
    await context.close();
    await browser.close();
  }
});

test("extracts Zentao Bug rows from DTable state with Bug detail URLs", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route("http://example.test/bugs.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: "<html><body><div id='table-my-work'></div></body></html>"
      });
    });
    await page.goto("http://example.test/bugs.html");
    await page.evaluate(() => {
      window.zui = {
        DTable: {
          query: () => ({
            $: {
              state: {
                data: [
                  { bugID: "71", title: "采购订单保存时报错" },
                  { bugId: "72", name: "销售出货无法生成应收单" }
                ]
              }
            }
          })
        }
      };
    });

    const links = await extractWorkItemLinks(page, "bug", 10);
    assert.deepEqual(links, [
      {
        id: "71",
        kind: "bug",
        title: "采购订单保存时报错",
        url: "http://example.test/zentao/bug-view-71.html"
      },
      {
        id: "72",
        kind: "bug",
        title: "销售出货无法生成应收单",
        url: "http://example.test/zentao/bug-view-72.html"
      }
    ]);
  } finally {
    await browser.close();
  }
});

test("falls back to Zentao Bug DOM links", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(`
      <a href="http://example.test/zentao/bug-view-81.html">采购订单审批页空白</a>
      <a href="http://example.test/zentao/task-view-82.html">不应收集的任务</a>
    `);

    const links = await extractWorkItemLinks(page, "bug", 10);
    assert.deepEqual(links, [{
      id: "81",
      kind: "bug",
      title: "采购订单审批页空白",
      url: "http://example.test/zentao/bug-view-81.html"
    }]);
  } finally {
    await browser.close();
  }
});

test("follows Zentao Bug pagination and preserves kind", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.route("http://example.test/bug-page1.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html><body>
            <div id="table-my-work"></div>
            <a title="下一页" href="http://example.test/bug-page2.html">下一页</a>
            <script>
              window.zui = {DTable: {query: () => ({$: {state: {data: [
                {bugID: "91", title: "第一页 Bug"}
              ]}}})}};
            </script>
          </body></html>
        `
      });
    });
    await page.route("http://example.test/bug-page2.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html><body>
            <div id="table-my-work"></div>
            <script>
              window.zui = {DTable: {query: () => ({$: {state: {data: [
                {bugId: "92", name: "第二页 Bug"}
              ]}}})}};
            </script>
          </body></html>
        `
      });
    });

    await page.goto("http://example.test/bug-page1.html");
    const result = await extractPaginatedWorkItemLinks(page, page, "bug", 10);
    assert.deepEqual(result.links.map(link => [link.kind, link.title]), [
      ["bug", "第一页 Bug"],
      ["bug", "第二页 Bug"]
    ]);
    assert.equal(result.pagesVisited.length, 2);
  } finally {
    await browser.close();
  }
});

test("extracts and cleans Bug detail fields from the Zentao app iframe", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.route("**/bug-view-88.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html>
            <head><title>BUG#88</title></head>
            <body>
              <nav>地盘 产品 测试 文档</nav>
              <iframe
                name="app-bug"
                srcdoc="
                  <div id='mainContent'>
                    <h1>BUG#88</h1>
                    <table>
                      <tr><th>重现步骤</th><td><div class='steps'>打开采购订单并点击保存</div></td></tr>
                      <tr><th>描述</th><td><div class='description'>保存失败且页面没有错误提示</div></td></tr>
                      <tr><th>备注</th><td><div class='remarks'><button>添加备注</button><p>仅在审批开启时复现</p><p>暂无描述</p></div></td></tr>
                    </table>
                  </div>
                "
              ></iframe>
            </body>
          </html>
        `
      });
    });

    const bug = await extractWorkItemDetail(context, {
      id: "88",
      kind: "bug",
      title: "采购订单保存失败",
      url: "http://example.test/zentao/bug-view-88.html"
    });

    assert.deepEqual(bug, {
      id: "88",
      kind: "bug",
      url: "http://example.test/zentao/bug-view-88.html",
      title: "采购订单保存失败",
      content: "打开采购订单并点击保存",
      remarks: "仅在审批开启时复现",
      description: "保存失败且页面没有错误提示"
    });
  } finally {
    await context.close();
    await browser.close();
  }
});

test("rejects Bug detail controls and navigation text as field values", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.route("**/bug-view-89.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html><body>
            <iframe
              name="app-bug"
              srcdoc="
                <nav>重现步骤 返回 描述 编辑 添加 保存 关闭</nav>
                <div id='mainContent'>
                  <h1>BUG#89</h1>
                  <div>重现步骤</div><button>返回</button>
                  <div>描述</div><button>编辑</button>
                  <div class='remarks'>
                    <button>添加</button><button>保存</button>
                    <a href='#'>关闭</a>
                  </div>
                </div>
              "
            ></iframe>
          </body></html>
        `
      });
    });

    const bug = await extractWorkItemDetail(context, {
      id: "89",
      kind: "bug",
      title: "采购订单按钮泄漏",
      url: "http://example.test/zentao/bug-view-89.html"
    });

    assert.equal(bug.content, "");
    assert.equal(bug.description, "");
    assert.equal(bug.remarks, "");
  } finally {
    await context.close();
    await browser.close();
  }
});

test("skips control-only Bug fields and preserves later scoped prose", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.route("**/bug-view-90.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `
          <html><body><div id="mainContent">
            <h1>BUG#90</h1>
            <table>
              <tr><th>重现步骤</th><td><span>返回 保存</span></td></tr>
              <tr><th>描述</th><td><span>编辑 关闭</span></td></tr>
              <tr><th>备注</th><td><span>添加 保存</span></td></tr>
            </table>
            <div data-field="steps">打开采购订单后点击保存</div>
            <div class="description">保存失败且保留用户输入</div>
            <div class="comment">仅在审批开启时复现</div>
          </div></body></html>
        `
      });
    });

    const bug = await extractWorkItemDetail(context, {
      id: "90",
      kind: "bug",
      title: "采购保存失败",
      url: "http://example.test/zentao/bug-view-90.html"
    });

    assert.equal(bug.content, "打开采购订单后点击保存");
    assert.equal(bug.description, "保存失败且保留用户输入");
    assert.equal(bug.remarks, "仅在审批开启时复现");
  } finally {
    await context.close();
    await browser.close();
  }
});

test("task wrappers preserve their legacy object shape", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.setContent(`<a href="http://example.test/zentao/task-view-101.html">采购任务</a>`);
    const [taskLink] = await extractTaskLinks(page, 10);
    assert.equal("kind" in taskLink, false);

    await context.route("**/task-view-101.html", route => {
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><h1>TASK#101</h1><div class="article">任务描述</div></body></html>`
      });
    });
    const task = await extractTaskDetail(context, taskLink);
    assert.equal("kind" in task, false);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("formats mixed task and Bug counts and labels", () => {
  const markdown = formatZentaoWorkItemAnalysisMarkdown({
    workItemCount: 2,
    taskCount: 1,
    bugCount: 1,
    groups: [{
      module: "采购模块",
      workItemCount: 2,
      workItems: [
        { id: "1", kind: "task", title: "采购订单增加审批详情" },
        { id: "2", kind: "bug", title: "采购订单保存时报错" }
      ]
    }],
    agentPlan: []
  });

  assert.match(markdown, /工作项数：2/);
  assert.match(markdown, /任务数：1/);
  assert.match(markdown, /Bug 数：1/);
  assert.match(markdown, /任务：采购订单增加审批详情/);
  assert.match(markdown, /Bug：采购订单保存时报错/);
});

test("collects task and Bug metadata through one context and closes it", async () => {
  const fixture = await createCollectorFixture();

  try {
    const result = await collectAssignedZentaoWorkItems({
      url: fixture.startUrl,
      maxTasks: 10,
      maxBugs: 10,
      pageSize: 100,
      keepBrowserOpen: false,
      contextFactory: fixture.contextFactory
    });

    assert.deepEqual(fixture.stats(), {
      contextFactoryCalls: 1,
      contextCloseCalls: 1,
      startPageRequests: 2
    });
    assert.equal(result.sourceUrl, fixture.startUrl);
    assert.equal(result.pageSizeRequested, 100);
    assert.equal(result.taskListUrl, "http://collector.test/zentao/my-work-task-assignedTo.html");
    assert.equal(result.bugListUrl, "http://collector.test/zentao/my-work-bug-assignedTo.html");
    assert.deepEqual(result.taskPagesVisited, [result.taskListUrl]);
    assert.deepEqual(result.bugPagesVisited, [result.bugListUrl]);
    assert.equal(result.taskLinksFound, 1);
    assert.equal(result.bugLinksFound, 1);
    assert.equal(result.taskCount, 1);
    assert.equal(result.bugCount, 1);
    assert.equal(result.workItemCount, 2);
    assert.deepEqual(result.collectionErrors, []);
  } finally {
    await fixture.browser.close();
  }
});

test("retains task results when Bug detail collection fails", async () => {
  const fixture = await createCollectorFixture({ failBugDetail: true });

  try {
    const result = await collectAssignedZentaoWorkItems({
      url: fixture.startUrl,
      maxTasks: 10,
      maxBugs: 10,
      keepBrowserOpen: true,
      contextFactory: fixture.contextFactory
    });

    assert.equal(result.taskCount, 1);
    assert.equal(result.bugCount, 0);
    assert.equal(result.workItemCount, 1);
    assert.equal(result.taskLinksFound, 1);
    assert.equal(result.bugLinksFound, 1);
    assert.ok(result.collectionErrors.some(error => error.kind === "bug"));
    assert.equal(fixture.stats().contextCloseCalls, 0);
  } finally {
    await fixture.playwrightContext.close().catch(() => {});
    await fixture.browser.close();
  }
});

test("rejects unsupported generic work item kinds clearly", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await assert.rejects(
      extractWorkItemLinks(page, "story", 10),
      /Unsupported Zentao work item kind: story/
    );
  } finally {
    await browser.close();
  }
});
