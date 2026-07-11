import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { analyzeZentaoTasks } from "./zentaoAnalyzer.mjs";
import {
  collectAssignedZentaoTasks,
  formatZentaoAnalysisMarkdown
} from "./zentaoCollector.mjs";
import { getTornaApiDetail, searchTornaApi } from "./tornaClient.mjs";

const server = new Server(
  {
    name: "t-browser-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

const tools = [
  {
    name: "torna_search_api",
    description:
      "只读检索 TSB Torna API 文档。普通接口/API 文档查询优先使用此工具；仅当用户明确指定 Swagger/OpenAPI 时不要使用。返回整洁的候选表格，唯一命中时默认附带入参与出参详情。",
    inputSchema: {
      type: "object",
      properties: {
        system: {
          type: "string",
          description: "目标系统：贸易、展厅、商城或平台。无法从当前项目唯一判断时必须先询问用户。"
        },
        query: {
          type: "string",
          description: "接口名称、接口路径或 Torna 文档 ID。"
        },
        moduleName: {
          type: "string",
          description: "可选的 Torna 应用模块名称，例如 Procurement、Finance。"
        },
        method: {
          type: "string",
          description: "可选 HTTP 方法，例如 GET、POST。"
        },
        includeDetail: {
          type: "boolean",
          description: "唯一命中时是否附带完整详情，默认 true。"
        },
        limit: {
          type: "number",
          description: "最多返回多少个候选，默认 20，最大 100。"
        },
        loginWaitMs: {
          type: "number",
          description: "检测到登录页时等待人工登录的毫秒数，默认 120000。"
        },
        headless: {
          type: "boolean",
          description: "是否无头运行，默认 false；首次登录必须为 false。"
        }
      },
      required: ["system", "query"]
    }
  },
  {
    name: "torna_get_api_detail",
    description:
      "按 Torna 文档 ID 只读获取 TSB API 详情，以整洁表格返回基本信息、请求参数、响应参数和示例。不得用于 Swagger/OpenAPI 查询。",
    inputSchema: {
      type: "object",
      properties: {
        docId: {
          type: "string",
          description: "Torna 文档 ID。"
        },
        loginWaitMs: {
          type: "number",
          description: "检测到登录页时等待人工登录的毫秒数，默认 120000。"
        },
        headless: {
          type: "boolean",
          description: "是否无头运行，默认 false；首次登录必须为 false。"
        }
      },
      required: ["docId"]
    }
  },
  {
    name: "zentao_collect_assigned_tasks",
    description:
      "自动打开禅道，进入仪表盘/指派给我任务列表，将分页尝试改为 2000，逐个打开任务并提取任务 ID、URL、标题、内容、备注、任务描述，然后按采购/销售等模块分类并生成保留原文事实源、业务闭环、责任审计和权限边界的多 agent 执行包。",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "禅道入口 URL，默认 http://hallzd.internal.tsb.com/zentao/my.html"
        },
        maxTasks: {
          type: "number",
          description: "最多采集多少个任务，默认 2000"
        },
        pageSize: {
          type: "number",
          description: "列表每页条数，默认 2000"
        },
        loginWaitMs: {
          type: "number",
          description: "检测到登录页时等待人工登录的毫秒数，默认 120000"
        },
        keepBrowserOpen: {
          type: "boolean",
          description: "采集后是否保持浏览器打开，默认 true"
        },
        headless: {
          type: "boolean",
          description: "是否无头运行，默认 false。首次登录建议 false"
        },
        profileDir: {
          type: "string",
          description: "Playwright 持久化浏览器 profile 目录，用于保存禅道登录态"
        },
        browserChannel: {
          type: "string",
          description: "浏览器 channel，默认 chrome；失败时自动回退到 Playwright chromium"
        }
      }
    }
  },
  {
    name: "zentao_analyze_tasks",
    description:
      "对已采集的禅道任务 JSON 做模块分类并生成保留原文事实源、业务闭环、责任审计和权限边界的多 agent 执行包，不打开浏览器。",
    inputSchema: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          description: "任务列表，每项可包含 id/url/title/content/remarks/description",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              url: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              remarks: { type: "string" },
              description: { type: "string" }
            },
            required: ["title"]
          }
        }
      },
      required: ["tasks"]
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async request => {
  const name = request.params.name;
  const args = request.params.arguments || {};

  if (name === "torna_search_api") {
    const result = await searchTornaApi(args);
    return { content: [{ type: "text", text: result.markdown }] };
  }

  if (name === "torna_get_api_detail") {
    const result = await getTornaApiDetail(args);
    return { content: [{ type: "text", text: result.markdown }] };
  }

  if (name === "zentao_collect_assigned_tasks") {
    const result = await collectAssignedZentaoTasks(args);
    return {
      content: [
        {
          type: "text",
          text: result.markdown
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  if (name === "zentao_analyze_tasks") {
    const analysis = analyzeZentaoTasks(args.tasks || []);
    const result = {
      ...analysis,
      markdown: formatZentaoAnalysisMarkdown(analysis)
    };
    return {
      content: [
        {
          type: "text",
          text: result.markdown
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
