import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "../src/server.mjs");

test("MCP server exposes Zentao, Torna, and read-only DingTalk tools", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath]
  });
  const client = new Client(
    {
      name: "t-browser-mcp-smoke",
      version: "0.1.0"
    },
    {
      capabilities: {}
    }
  );

  try {
    await client.connect(transport);
    const result = await client.listTools();
    const names = result.tools.map(tool => tool.name);

    assert.ok(names.includes("zentao_collect_assigned_tasks"));
    assert.ok(names.includes("zentao_analyze_tasks"));
    assert.ok(names.includes("zentao_collect_assigned_work_items"));
    assert.ok(names.includes("zentao_analyze_work_items"));
    assert.ok(names.includes("zentao_schedule_tasks"));
    assert.ok(names.includes("zentao_resolve_bugs"));
    assert.ok(names.includes("torna_search_api"));
    assert.ok(names.includes("torna_get_api_detail"));

    for (const name of [
      "dingtalk_auth_status",
      "dingtalk_auth_login",
      "dingtalk_search_groups",
      "dingtalk_search_messages",
      "dingtalk_list_messages",
      "dingtalk_list_all_messages"
    ]) {
      assert.ok(names.includes(name), `missing DingTalk MCP tool: ${name}`);
    }

    const searchTool = result.tools.find(tool => tool.name === "dingtalk_search_messages");
    assert.deepEqual(searchTool.inputSchema.required, ["query", "start", "end"]);
    assert.equal(searchTool.inputSchema.properties.limit.maximum, 100);

    const callResult = await client.callTool({
      name: "zentao_analyze_tasks",
      arguments: {
        tasks: [
          {
            id: "201",
            title: "采购订单产品资料字段错误",
            description: "供应商选择后采购单字段未刷新"
          }
        ]
      }
    });
    const text = callResult.content.map(item => item.text || "").join("\n");
    assert.match(text, /采购模块/);
    assert.match(text, /t-mod-采购模块/);

    const workItemResult = await client.callTool({
      name: "zentao_analyze_work_items",
      arguments: {
        workItems: [
          {
            id: "9328",
            kind: "bug",
            title: "订单出库打印导出资料",
            creator: "林彦林",
            product: "TSBERP1.0",
            deadline: "2026-09-02",
            description: "查询模板没有传 pageId"
          }
        ]
      }
    });
    const workItemText = workItemResult.content.map(item => item.text || "").join("\n");
    assert.match(workItemText, /禅道Bug/);
    assert.match(workItemText, /贸易系统/);
    assert.match(workItemText, /详细处理方案与对应位置/);
  } finally {
    await client.close();
  }
});
