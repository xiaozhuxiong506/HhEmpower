export const DEVELOPER_TABLE_COLUMNS = Object.freeze([
  "场景",
  "所属项目",
  "所属产品",
  "ID/链接",
  "标题",
  "创建者",
  "当前处理人",
  "截止日期",
  "代码模块",
  "共享影响",
  "待确认项",
  "详细处理方案与对应位置"
]);

function cell(value, fallback = "未设置") {
  const text = Array.isArray(value) ? value.filter(Boolean).join("、") : String(value || "");
  return (text || fallback).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function workItemLink(workItem) {
  if (!workItem.id) return cell(workItem.url, "待确认");
  if (!workItem.url) return `#${cell(workItem.id)}`;
  return `[${cell(workItem.id)}](${String(workItem.url).replace(/\)/g, "%29")})`;
}

function summaryCounts(result, scene, system) {
  return (result.systemGroups || [])
    .filter(group => group.system === system)
    .flatMap(group => group.modules || [])
    .flatMap(group => group.workItems || [])
    .filter(item => item.scene === scene).length;
}

function appendSummary(lines, result) {
  lines.push("## 禅道工作项摘要", "");
  lines.push("| 场景 | 贸易系统 | 展厅系统 | 待确认 | 合计 |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const scene of ["禅道需求", "禅道Bug"]) {
    const trade = summaryCounts(result, scene, "贸易系统");
    const hall = summaryCounts(result, scene, "展厅系统");
    const unknown = summaryCounts(result, scene, "待确认");
    lines.push(`| ${scene} | ${trade} | ${hall} | ${unknown} | ${trade + hall + unknown} |`);
  }
  lines.push("");
}

function appendDeveloperTable(lines, system, moduleGroup) {
  lines.push(`## ${system} · ${moduleGroup.module}`, "");
  lines.push(`| ${DEVELOPER_TABLE_COLUMNS.join(" | ")} |`);
  lines.push(`|${DEVELOPER_TABLE_COLUMNS.map(() => "---").join("|")}|`);

  for (const workItem of moduleGroup.workItems || []) {
    const row = [
      cell(workItem.scene, "待确认"),
      cell(workItem.project),
      cell(workItem.product),
      workItemLink(workItem),
      cell(workItem.title, "待确认"),
      cell(workItem.creator),
      cell(workItem.assignee),
      cell(workItem.deadline),
      cell(workItem.module, "待分析"),
      cell(workItem.sharedImpact, "无"),
      cell(workItem.pendingQuestions, "无"),
      cell(workItem.handlingPlan, "待分析")
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }
  lines.push("");
}

function formatLegacyAnalysis(result) {
  const groups = result.groups || [];
  const lines = [
    "# 禅道指派给我工作项分析",
    "",
    `- 工作项数：${result.workItemCount || 0}`,
    `- 任务数：${result.taskCount || 0}`,
    `- Bug 数：${result.bugCount || 0}`,
    `- 分组数：${groups.length}`,
    ""
  ];

  for (const group of groups) {
    const workItems = group.workItems || group.tasks || [];
    lines.push(`## ${group.module}（${group.workItemCount ?? workItems.length}）`);
    for (const workItem of workItems) {
      const label = workItem.kind === "bug" ? "Bug" : "任务";
      lines.push(`- ${label}：${workItem.title}${workItem.id ? `（#${workItem.id}）` : ""}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function formatZentaoWorkItemAnalysisMarkdown(result = {}) {
  if (!Array.isArray(result.systemGroups)) return formatLegacyAnalysis(result);
  const lines = ["# 禅道指派给我工作项分析", ""];
  appendSummary(lines, result);

  for (const systemGroup of result.systemGroups || []) {
    for (const moduleGroup of systemGroup.modules || []) {
      appendDeveloperTable(lines, systemGroup.system, moduleGroup);
    }
  }

  return lines.join("\n").trim();
}
