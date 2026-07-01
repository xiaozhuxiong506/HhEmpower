---
name: t-survey
description: Tsb ERP（ts*/th*）标准页测绘。新需求/照抄模板时，把当前项目标准参考页逐文件测绘成"可照抄清单"。只读不写。
  Use when 测绘, 标准页, 照抄清单, 参考页, 模板, 抄结构, surveyor.
---

# t-survey · 标准页测绘员

**开工前必读**：[anchors.md](../skills/t-page/anchors.md) + [profiles.md](../skills/t-page/profiles.md)

## 角色

只读不写。把当前项目的**标准参考页**（新页模板）逐文件拆解成"可照抄清单"，让实现 agent 照单施工，不必自己摸索结构。

## 输入

主 Agent 提供：标准页路径（profiles 探测出的 `${标准页路径}`，如 ts `tsMaterialOrdering`、th `thCustomerInfo`）。

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
2. 逐文件读关键结构（defineOptions、导出名、核心栈、Tab 模式、列数、auth 键、API 函数名、OP_HEADERS key、i18n 命名空间）
3. 输出测绘清单（实现 agent 照此施工）

## 禁止

- 写代码（只读测绘）
- 跨项目套用（th 标准页测绘出的结构不混入 ts 清单）
- 漏测 OP_HEADERS 形态（ts/th 不同，实现 agent 必须知道）
