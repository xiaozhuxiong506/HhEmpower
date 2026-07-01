const EMPTY_TEXT_PATTERNS = new Set([
  "",
  "暂无",
  "暂无描述",
  "无",
  "无描述",
  "没有描述",
  "none",
  "null"
]);

const MODULE_RULES = [
  {
    module: "采购模块",
    keywords: [
      "采购",
      "供应商",
      "供货",
      "询价",
      "采购单",
      "采购订单",
      "下单",
      "物料",
      "产品资料",
      "货号",
      "tsProduct",
      "purchase",
      "supplier"
    ]
  },
  {
    module: "销售模块",
    keywords: [
      "销售",
      "销售单",
      "销售订单",
      "客户",
      "报价",
      "合同",
      "出货",
      "发货",
      "收款",
      "sale",
      "customer",
      "quote"
    ]
  },
  {
    module: "库存仓储模块",
    keywords: [
      "库存",
      "仓库",
      "入库",
      "出库",
      "盘点",
      "调拨",
      "库存流水",
      "库位",
      "warehouse",
      "stock"
    ]
  },
  {
    module: "财务模块",
    keywords: ["财务", "付款", "收款", "发票", "对账", "费用", "账单", "finance", "invoice"]
  },
  {
    module: "生产模块",
    keywords: ["生产", "工单", "排产", "加工", "BOM", "工序", "production"]
  },
  {
    module: "CRM模块",
    keywords: ["CRM", "跟进", "商机", "线索", "拜访", "客户池"]
  },
  {
    module: "权限菜单模块",
    keywords: ["权限", "角色", "按钮权限", "授权", "账号", "用户"]
  },
  {
    module: "公共基础模块",
    keywords: [
      "公共",
      "基础资料",
      "字典",
      "枚举",
      "列表",
      "弹窗",
      "菜单",
      "导入",
      "导出",
      "分页",
      "查询"
    ]
  }
];

export function normalizeTaskText(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  if (EMPTY_TEXT_PATTERNS.has(text.toLowerCase()) || EMPTY_TEXT_PATTERNS.has(text)) return "";
  return text;
}

export function taskSearchText(task) {
  return [
    task?.title,
    task?.content,
    task?.remarks,
    task?.description,
    task?.url,
    task?.id
  ]
    .map(normalizeTaskText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifyTaskModule(task) {
  const text = taskSearchText(task);
  let businessBest = { module: "", score: 0 };
  let fallbackBest = { module: "公共基础模块", score: 0 };

  for (const rule of MODULE_RULES) {
    const score = rule.keywords.reduce((total, keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      return text.includes(normalizedKeyword) ? total + 1 : total;
    }, 0);
    if (rule.module === "公共基础模块") {
      if (score > fallbackBest.score) fallbackBest = { module: rule.module, score };
      continue;
    }
    if (score > businessBest.score) businessBest = { module: rule.module, score };
  }

  return businessBest.score > 0 ? businessBest.module : fallbackBest.module;
}

export function normalizeWorkItem(item) {
  const workItem = {
    id: normalizeTaskText(item?.id),
    url: normalizeTaskText(item?.url),
    title: normalizeTaskText(item?.title),
    content: normalizeTaskText(item?.content),
    remarks: normalizeTaskText(item?.remarks),
    description: normalizeTaskText(item?.description),
    kind: item?.kind === "bug" ? "bug" : "task"
  };
  workItem.module = item?.module || classifyTaskModule(item);
  return workItem;
}

export function normalizeTask(task) {
  const { kind: _kind, ...normalizedTask } = normalizeWorkItem(task);
  return normalizedTask;
}

export function groupWorkItemsByModule(workItems) {
  const groupsByModule = new Map();

  for (const item of workItems || []) {
    const workItem = normalizeWorkItem(item);
    if (!workItem.title) continue;
    const module = workItem.module || "公共基础模块";
    if (!groupsByModule.has(module)) {
      const group = {
        module,
        workItems: []
      };
      Object.defineProperties(group, {
        workItemCount: {
          enumerable: true,
          get() {
            return this.workItems.length;
          }
        },
        taskCount: {
          enumerable: true,
          get() {
            return this.workItems.filter(item => item.kind !== "bug").length;
          }
        },
        bugCount: {
          enumerable: true,
          get() {
            return this.workItems.filter(item => item.kind === "bug").length;
          }
        },
        tasks: {
          enumerable: true,
          get() {
            return this.workItems;
          },
          set(tasks) {
            this.workItems = tasks;
          }
        }
      });
      groupsByModule.set(module, group);
    }
    const group = groupsByModule.get(module);
    group.workItems.push(workItem);
  }

  return Array.from(groupsByModule.values()).sort((a, b) => {
    if (b.workItemCount !== a.workItemCount) return b.workItemCount - a.workItemCount;
    return a.module.localeCompare(b.module, "zh-Hans-CN");
  });
}

export function groupTasksByModule(tasks) {
  return groupWorkItemsByModule(tasks);
}

function formatWorkItemForPrompt(workItem, index) {
  const typeLabel = workItem.kind === "bug" ? "Bug" : "任务";
  const lines = [
    `${index + 1}. ${workItem.title}`,
    `   - 类型：${typeLabel}`,
    workItem.id ? `   - 禅道ID：${workItem.id}` : "",
    workItem.url ? `   - 链接：${workItem.url}` : "",
    workItem.content ? `   - 内容：${workItem.content}` : "",
    workItem.remarks ? `   - 备注：${workItem.remarks}` : "",
    workItem.description ? `   - ${typeLabel}描述：${workItem.description}` : ""
  ].filter(Boolean);
  return lines.join("\n");
}

export function toAgentExecutionPlan(groups) {
  return (groups || []).map(group => {
    const moduleName = group.module || "公共基础模块";
    const workItems = group.workItems || group.tasks || [];
    const taskCount = workItems.filter(item => item.kind !== "bug").length;
    const bugCount = workItems.filter(item => item.kind === "bug").length;
    return {
      module: moduleName,
      agentName: `t-mod-${moduleName}`,
      workItemCount: workItems.length,
      taskCount,
      bugCount,
      prompt: [
        `你是 ${moduleName} 的执行 agent。`,
        "请按下面禅道任务或 Bug 逐项定位代码、修改、验证，并在完成后给出工作项级总结。",
        '每个工作项必须返回结构化完成结果：{"completed": boolean, "verified": boolean, "completionSummary": string}。',
        "",
        ...workItems.map(formatWorkItemForPrompt)
      ].join("\n")
    };
  });
}

export function analyzeZentaoWorkItems(workItems) {
  const normalizedWorkItems = (workItems || [])
    .map(normalizeWorkItem)
    .filter(workItem => workItem.title);
  const groups = groupWorkItemsByModule(normalizedWorkItems);
  return {
    workItemCount: normalizedWorkItems.length,
    taskCount: normalizedWorkItems.filter(item => item.kind === "task").length,
    bugCount: normalizedWorkItems.filter(item => item.kind === "bug").length,
    groups,
    agentPlan: toAgentExecutionPlan(groups)
  };
}

export function analyzeZentaoTasks(tasks) {
  const taskWorkItems = (tasks || []).map(task => ({ ...task, kind: "task" }));
  const analysis = analyzeZentaoWorkItems(taskWorkItems);
  return {
    taskCount: analysis.workItemCount,
    groups: analysis.groups,
    agentPlan: analysis.agentPlan
  };
}
