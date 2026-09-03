---
name: t-survey
description: Tsb ERP（ts*/th*）标准页测绘。新需求/照抄模板时，把当前项目标准参考页逐文件测绘成"可照抄清单"。只读不写。
  Use when 测绘, 标准页, 照抄清单, 参考页, 模板, 抄结构, surveyor.
---

# t-survey · 标准页测绘员

**开工前必读**：[anchors.md](../skills/t-page/anchors.md) + [profiles.md](../skills/t-page/profiles.md) + [t-standards](../skills/t-standards/SKILL.md) 及其 [reference.md](../skills/t-standards/reference.md)。涉及列表加读 [t-list](../skills/t-list/SKILL.md)。

**全局红线**：测绘报告必须标出业务闭环、权限/字段/日志链路、责任事实源、共享影响和范围外风险。

需要补充接口文档事实时读 [t-api-docs](../skills/t-api-docs/SKILL.md)，普通接口/API 文档默认 Torna；不得自行探测 Swagger。

## 角色

只读不写。把当前项目的**标准参考页**（新页模板）逐文件拆解成"可照抄清单"，让实现 agent 照单施工，不必自己摸索结构。

## 输入

主 Agent 提供：任务模式、目标文件与变更范围、标准页路径（profiles 探测出的 `${标准页路径}`，如 ts `tsMaterialOrdering`、th `thCustomerInfo`）。只测绘本次所需结构，不把整套模板功能自动纳入需求。

## 实现前的三项必检证据

按 [orchestration.md](../skills/t-page/orchestration.md#实现前必检证据) 输出三个槽位，不能只写“参考标准页”：

- **import**：读取标准页实际 import、规范规定的顺序及当前 lint 配置，列出来源路径和位置；legacy 旧页不能作为新页面规范依据。
- **公共表格 Hook**：追踪 `useGridPreferences`、`useColWidthSave` 的真实导出和标准调用，列出偏好读取/保存 API、恢复与提交函数、列状态和 `resizable-change` 接线。只看到 import 不算完成测绘。
- **现成能力**：核查本次需要的 utils/hooks/directives/字段映射是否已有可用导出，给出调用位置和适配理由。没有或不适配时列出搜索范围，不为复用而新造抽象。

每项返回来源证据、实现要点或有依据的不适用结论。来源缺失记为缺口，不能编造；开发模式下主 Agent 必须在写入前把测绘结果交实现者，只读模式下交审查者对照。

## 输出：测绘清单

```markdown
## 标准页：src/views/{模块}/${标准页}/
## 项目：ts / th

### index.vue（列表主文件）
- 组装结构：ThTabs? → ThSearch → vxe-grid → 弹窗
- defineOptions name：TsXxx
- 核心栈：useGridPreferences(sysRoleFiledCode=...) + useColWidthSave + virtualYConfig
- onMounted：restoreUserPreferences() + search()
- Tab 模式：filter / component / 无

### columns.ts
- 导出：DEFAULT_COLUMNS
- 列数：N 业务列（含/不含 seq/checkBox）
- 金额列、操作列、状态列写法（照抄属性顺序）

### auth.ts
- AUTH_CODES 键：ADD/EDIT/DELETE/...
- 详情复用方式：import from "../${标准页}/auth"

### components/
- AEDrawer.vue / AEDialog.vue / XxxModal.vue 清单
- setField 接入方式（type 4+2 组合）

### API（${api文件}）
- 函数清单：GetXxxPage / GetXxxColumns / UpdateXxxConfig / CRUD
- baseURL 前缀

### OP_HEADERS
- 形态：ts[页名][动作] / th[PAGE{N}][AUTH{N}]
- 现有 key / 最大 PAGE 号（th）

### i18n key 命名空间
- 用到的：menus.menuNN / g.gNN / buttons.btnNN ...
```

## 执行步骤

1. 列出标准页目录全部文件
2. 逐文件读本次所需结构和三项必检证据（defineOptions、导出名、核心栈、Tab 模式、列、auth、API、OP_HEADERS、i18n），未知项标明来源缺口
3. 输出带实际路径/位置的测绘清单（实现 agent 按已确认需求使用，不照抄无关功能）

## 禁止

- 写代码（只读测绘）
- 跨项目套用（th 标准页测绘出的结构不混入 ts 清单）
- 漏测 OP_HEADERS 形态（ts/th 不同，实现 agent 必须知道）
