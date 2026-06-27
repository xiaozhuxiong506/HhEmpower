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

export function normalizeTask(task) {
  return {
    id: normalizeTaskText(task?.id),
    url: normalizeTaskText(task?.url),
    title: normalizeTaskText(task?.title),
    content: normalizeTaskText(task?.content),
    remarks: normalizeTaskText(task?.remarks),
    description: normalizeTaskText(task?.description),
    module: task?.module || classifyTaskModule(task)
  };
}

export function groupTasksByModule(tasks) {
  const groupsByModule = new Map();

  for (const item of tasks || []) {
    const task = normalizeTask(item);
    if (!task.title) continue;
    const module = task.module || "公共基础模块";
    if (!groupsByModule.has(module)) {
      groupsByModule.set(module, {
        module,
        taskCount: 0,
        tasks: []
      });
    }
    const group = groupsByModule.get(module);
    group.tasks.push(task);
    group.taskCount = group.tasks.length;
  }

  return Array.from(groupsByModule.values()).sort((a, b) => {
    if (b.taskCount !== a.taskCount) return b.taskCount - a.taskCount;
    return a.module.localeCompare(b.module, "zh-Hans-CN");
  });
}

function formatTaskForPrompt(task, index) {
  const lines = [
    `${index + 1}. ${task.title}`,
    task.id ? `   - 禅道ID：${task.id}` : "",
    task.url ? `   - 链接：${task.url}` : "",
    task.content ? `   - 内容：${task.content}` : "",
    task.remarks ? `   - 备注：${task.remarks}` : "",
    task.description ? `   - 任务描述：${task.description}` : ""
  ].filter(Boolean);
  return lines.join("\n");
}

export function toAgentExecutionPlan(groups) {
  return (groups || []).map(group => {
    const moduleName = group.module || "公共基础模块";
    const tasks = group.tasks || [];
    return {
      module: moduleName,
      agentName: `tsb-module-agent-${moduleName}`,
      taskCount: tasks.length,
      prompt: [
        `你是 ${moduleName} 的执行 agent。`,
        "请按下面禅道任务逐项定位代码、修改、验证，并在完成后给出任务级总结。",
        "",
        ...tasks.map(formatTaskForPrompt)
      ].join("\n")
    };
  });
}

export function analyzeZentaoTasks(tasks) {
  const normalizedTasks = (tasks || []).map(normalizeTask).filter(task => task.title);
  const groups = groupTasksByModule(normalizedTasks);
  return {
    taskCount: normalizedTasks.length,
    groups,
    agentPlan: toAgentExecutionPlan(groups)
  };
}
