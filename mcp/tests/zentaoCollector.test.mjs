import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import {
  extractPaginatedTaskLinks,
  extractTaskDetail,
  extractTaskLinks,
  findZentaoContentFrame
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
