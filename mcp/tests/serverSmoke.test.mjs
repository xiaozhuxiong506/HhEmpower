import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "../src/server.mjs");

test("MCP server exposes Zentao browser automation tools", async () => {
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
  } finally {
    await client.close();
  }
});
