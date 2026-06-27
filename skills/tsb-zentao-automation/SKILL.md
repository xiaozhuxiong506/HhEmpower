---
name: tsb-zentao-automation
description: Use when collecting, analyzing, grouping, or dispatching Zentao tasks assigned to the current user through the TSB browser MCP server.
---

# TSB Zentao Automation

Use this skill when the user asks to collect Zentao tasks, analyze assigned tasks, group tasks by module, or dispatch tasks to module agents.

## Required MCP Tool

Prefer the MCP tool `zentao_collect_assigned_tasks`.

Default input:

```json
{
  "url": "http://hallzd.internal.tsb.com/zentao/my.html",
  "pageSize": 2000,
  "maxTasks": 2000,
  "keepBrowserOpen": true,
  "headless": false
}
```

The tool opens Zentao, enters the assigned-to-me task list, attempts to set page size to 2000, opens each task, extracts title/content/remarks/description, omits empty or placeholder descriptions, classifies tasks by ERP module, and returns `agentPlan`.

## Dispatch Rules

After collection:

1. Read `groups` and `agentPlan`.
2. Dispatch each module group to a matching `tsb-module-agent-*`.
3. Keep unrelated modules separate.
4. Preserve the Zentao task ID and URL in each agent prompt.
5. Ask the agent to modify code and verify per task.

If the tool reports that Zentao requires login, tell the user to log in in the opened browser and rerun the same MCP tool.
