import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import {
  extractPaginatedWorkItemLinks,
  extractPaginatedTaskLinks,
  extractWorkItemDetail,
  extractWorkItemLinks,
  extractTaskDetail,
  extractTaskLinks,
  findZentaoContentFrame,
  formatZentaoWorkItemAnalysisMarkdown
} from "../src/zentaoCollector.mjs";

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
