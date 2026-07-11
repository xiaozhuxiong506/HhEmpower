import assert from "node:assert/strict";
import test from "node:test";
import {
  findTornaApiCandidates,
  formatTornaDetailMarkdown,
  formatTornaSearchMarkdown,
  prepareTornaCandidates,
  validateTornaOptions,
  resolveTornaProject
} from "../src/tornaClient.mjs";

test("resolves all supported TSB systems to their Torna projects", () => {
  assert.equal(resolveTornaProject("贸易系统").projectId, "RqXBwzEl");
  assert.equal(resolveTornaProject("展厅").projectId, "kpX9MXr1");
  assert.equal(resolveTornaProject("商城系统").projectId, "57zLZ8Qw");
  assert.equal(resolveTornaProject("小竹熊平台-平台系统").projectId, "m32QA20r");
  assert.throws(() => resolveTornaProject("小竹熊平台"), /无法确定 Torna 项目/);
  assert.throws(() => resolveTornaProject("未知系统"), /无法确定 Torna 项目/);
});

test("keeps duplicate API names and includes their business folders", () => {
  const candidates = findTornaApiCandidates({
    query: "获取采购单详情",
    modules: [
      {
        id: "procurement",
        name: "Tsb.TradeErp.Procurement.API",
        documents: [
          { id: "follow-folder", name: "跟单管理-订单跟踪", isFolder: 1, parentId: "" },
          {
            id: "follow-detail",
            name: "获取采购单详情",
            url: "/api/FollowOrder/GetPurchaseDetail",
            httpMethod: "POST",
            isFolder: 0,
            parentId: "follow-folder"
          },
          { id: "purchase-folder", name: "采购管理-产品采购", isFolder: 1, parentId: "" },
          {
            id: "purchase-detail",
            name: "获取采购单详情",
            url: "/api/Purchase/Get",
            httpMethod: "POST",
            isFolder: 0,
            parentId: "purchase-folder"
          }
        ]
      }
    ]
  });

  assert.equal(candidates.length, 2);
  assert.deepEqual(
    candidates.map(item => [item.folderPath, item.url]),
    [
      ["跟单管理-订单跟踪", "/api/FollowOrder/GetPurchaseDetail"],
      ["采购管理-产品采购", "/api/Purchase/Get"]
    ]
  );
});

test("filters candidates by module and HTTP method without guessing", () => {
  const candidates = findTornaApiCandidates({
    query: "/api/Purchase/Get",
    moduleName: "Procurement",
    method: "post",
    modules: [
      {
        id: "basic",
        name: "Tsb.TradeErp.Basic.API",
        documents: [{ id: "wrong", name: "同名", url: "/api/Purchase/Get", httpMethod: "GET" }]
      },
      {
        id: "procurement",
        name: "Tsb.TradeErp.Procurement.API",
        documents: [
          { id: "right", name: "获取采购单详情", url: "/api/Purchase/Get", httpMethod: "POST" },
          { id: "prefix-only", name: "获取采购单分页", url: "/api/Purchase/GetPage", httpMethod: "POST" }
        ]
      }
    ]
  });

  assert.deepEqual(candidates.map(item => item.id), ["right"]);
});

test("formats candidate APIs as a compact Markdown table and asks on ambiguity", () => {
  const markdown = formatTornaSearchMarkdown({
    project: resolveTornaProject("贸易"),
    query: "获取采购单详情",
    candidates: [
      {
        id: "follow-detail",
        moduleName: "Tsb.TradeErp.Procurement.API",
        folderPath: "跟单管理-订单跟踪",
        name: "获取采购单详情",
        httpMethod: "POST",
        url: "/api/FollowOrder/GetPurchaseDetail"
      },
      {
        id: "purchase-detail",
        moduleName: "Tsb.TradeErp.Procurement.API",
        folderPath: "采购管理-产品采购",
        name: "获取采购单详情",
        httpMethod: "POST",
        url: "/api/Purchase/Get"
      }
    ]
  });

  assert.match(markdown, /\| 序号 \| 应用 \| 业务目录 \| 接口名称 \| 方法 \| 路径 \| 文档 ID \|/);
  assert.match(markdown, /跟单管理-订单跟踪/);
  assert.match(markdown, /采购管理-产品采购/);
  assert.match(markdown, /存在 2 个合理候选，请先确认/);
});

test("does not treat a limit-truncated ambiguous result as unique", () => {
  const prepared = prepareTornaCandidates(
    [{ id: "first" }, { id: "second" }],
    1
  );
  assert.deepEqual(prepared.candidates.map(item => item.id), ["first"]);
  assert.equal(prepared.truncated, true);
  assert.equal(prepared.isUnique, false);
});

test("rejects hidden Torna options that could override the fixed origin", () => {
  assert.throws(
    () => validateTornaOptions({ system: "贸易", query: "Get", baseUrl: "https://example.test" }, "search"),
    /不支持的 Torna 参数：baseUrl/
  );
});

test("formats request and response parameters with complete nested field paths", () => {
  const markdown = formatTornaDetailMarkdown({
    id: "P81O4gzq",
    projectName: "贸易系统",
    moduleName: "Tsb.TradeErp.Procurement.API",
    folderPath: "采购管理-产品采购",
    name: "获取采购单详情",
    httpMethod: "POST",
    url: "/api/Purchase/Get",
    contentType: "application/json",
    requestParams: [
      { id: "request-id", parentId: "", name: "id", type: "int64", required: 1, maxLength: "-", description: "主键ID" }
    ],
    pathParams: [
      { id: "tenant-id", parentId: "", name: "tenantId", type: "int64", required: 1, description: "租户ID" }
    ],
    queryParams: [
      { id: "include-detail", parentId: "", name: "includeDetail", type: "boolean", required: 0, description: "是否包含明细" }
    ],
    headerParams: [
      { id: "request-id-header", parentId: "", name: "x-request-id", type: "string", required: 0, description: "请求标识" }
    ],
    responseParams: [
      { id: "data", parentId: "", name: "data", type: "object", description: "采购单输出DTO" },
      { id: "purchase-code", parentId: "data", name: "purchaseCode", type: "string", description: "采购编号" }
    ],
    requestExample: '{"id": 1}',
    responseExample: '{"data":{"purchaseCode":"CG001"}}'
  });

  assert.match(markdown, /## 基本信息/);
  assert.match(markdown, /## 请求参数/);
  assert.match(markdown, /\| Path \| `tenantId` \| `int64` \| 是 \| - \| 租户ID \|/);
  assert.match(markdown, /\| Query \| `includeDetail` \| `boolean` \| 否 \| - \| 是否包含明细 \|/);
  assert.match(markdown, /\| Header \| `x-request-id` \| `string` \| 否 \| - \| 请求标识 \|/);
  assert.match(markdown, /\| Body \| `id` \| `int64` \| 是 \| - \| 主键ID \|/);
  assert.match(markdown, /## 响应参数/);
  assert.match(markdown, /\| `data\.purchaseCode` \| `string` \| 采购编号 \|/);
  assert.match(markdown, /```json\n\{\n  \"id\": 1\n\}\n```/);
});

test("generates tidy request and response examples when Torna omits example fields", () => {
  const markdown = formatTornaDetailMarkdown({
    id: "generated-example",
    name: "示例接口",
    httpMethod: "POST",
    url: "/api/Example/Get",
    requestParams: [
      { id: "request-id", parentId: "", name: "id", type: "int64" },
      { id: "request-code", parentId: "", name: "code", type: "string" }
    ],
    responseParams: [
      { id: "data", parentId: "", name: "data", type: "object" },
      { id: "purchase-code", parentId: "data", name: "purchaseCode", type: "string" },
      { id: "success", parentId: "", name: "success", type: "boolean" }
    ]
  });

  assert.match(markdown, /## 请求示例/);
  assert.match(markdown, /\"id\": 0/);
  assert.match(markdown, /\"code\": \"string\"/);
  assert.match(markdown, /## 响应示例/);
  assert.match(markdown, /根据字段结构生成，非文档原值/);
  assert.match(markdown, /\"purchaseCode\": \"string\"/);
  assert.match(markdown, /\"success\": false/);
});
