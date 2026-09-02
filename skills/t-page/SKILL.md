---
name: t-page
description: TSB ERP 页面任务统一入口与路由器。Use when 不确定用哪个 TSB ERP skill、任务涉及 ts*/th* 业务页面、或需要页面级责任归属与全局边界；触发词：页面、路由、模块、业务闭环、全局感知、责任归属、vxe-grid、OP_HEADERS。不适用于：非 TSB ERP 仓库、纯后端接口开发、禅道/钉钉独立查询（直达对应 skill）。
---

# t-page

## 入口顺序

1. 如果输入是产品需求、需求文档、原型说明或前后端混写描述，先读 [t-requirement](../t-requirement/SKILL.md)，完成规范化《前端需求分析报告》，不得直接把原文当作前端任务。
2. 报告完成后，如果仍含会改变前端方案的歧义、反绕过表达，或要求跳过确认，再读 [t-clarify](../t-clarify/SKILL.md)，由澄清结果决定是否继续。
3. 读 [profiles.md](profiles.md)，确认当前页面画像是 `ts`、`th`，或仍需继续探测。
4. 读 [anchors.md](anchors.md)，只引用其中的全局关卡、范围、共享影响、归因和标准源。
5. 改代码任务读 [t-workflow](../t-workflow/SKILL.md)（蓝图、必问单选、最简代码、纠错复原）；纯分析、查询类任务可跳过。非页面类改代码也可直接使用 t-workflow。
6. 输出下方“页面任务概览”；概览完成后再按下方路由表读取具体子 skill。`t-page` 本身不进入代码实现步骤。

## 必读材料

| 文档 | 读取时机 |
|------|----------|
| [profiles.md](profiles.md) | 每个页面相关任务先读，用于判定 `ts` / `th` 画像和路径令牌。 |
| [anchors.md](anchors.md) | 画像判定后读，用于范围、红线、共享影响、Git 归因、反绕过和标准源。 |
| [naming.md](naming.md) | 涉及路由、菜单、组件、API、类型、i18n、权限、日志、`pageId` 或字段对齐时读。 |
| [orchestration.md](orchestration.md) | 需要 subagent、跨模块拆解、批量任务或调度边界时读；只用于编排选择。 |

## 技能路由

| 任务信号 | 读取 skill |
|----------|------------|
| 产品需求、需求文档、原型说明、前后端混写、分析前端改动点 | [t-requirement](../t-requirement/SKILL.md) |
| 新建模块、新页面骨架、模块级补齐 | [t-module](../t-module/SKILL.md) |
| 主单、列表页、查询区、表格、`vxe-grid` | [t-list](../t-list/SKILL.md) |
| 详情、明细、主单详情映射 | [t-detail](../t-detail/SKILL.md) |
| 弹窗、抽屉、对话框、批量操作面板 | [t-dialog](../t-dialog/SKILL.md) |
| 列宽、import、编码克制、通用页面标准（命名红线读 naming.md） | [t-standards](../t-standards/SKILL.md) |
| 权限按钮、`hasAuth`、`v-auth`、`AUTH_CODES` | [t-auth](../t-auth/SKILL.md) |
| 字段设置、字段对齐、`setField`、`sysRoleFiledCode` | [t-field](../t-field/SKILL.md) |
| Tab、保存、编辑态、只读态 | [t-tab](../t-tab/SKILL.md) |
| 操作日志、埋点日志、日志词库、日志核对、`OP_HEADERS`、`pageId` | [t-oplog](../t-oplog/SKILL.md) |
| 路由、菜单、Tab 发现、`staticRoutes`、route registry | [t-registry](../t-registry/SKILL.md) |
| 接口文档、API 文档、Torna、Swagger/OpenAPI、请求/响应参数 | [t-api-docs](../t-api-docs/SKILL.md) |
| Zentao 任务收集、分析、分组、派发 | [t-zentao](../t-zentao/SKILL.md) |

## 停止关卡

以下只列关卡名；具体规则以 [anchors.md](anchors.md) 为准。

- [五条红线](anchors.md#五条红线)
- [范围契约](anchors.md#范围契约)
- [ERP 闭环感知关卡](anchors.md#erp-闭环感知关卡)
- [责任与审计关卡](anchors.md#责任与审计关卡)
- [共享影响关卡](anchors.md#共享影响关卡)
- [Git 归因关卡](anchors.md#git-归因关卡)
- [权限等同用户关卡](anchors.md#权限等同用户关卡)
- [反绕过关卡](anchors.md#反绕过关卡)
- [临时产物清理](anchors.md#临时产物清理)
- [范围外报告](anchors.md#范围外报告)

## 输出契约

任何触发 `t-page` 的页面、路由、模块、列表、详情、弹窗、字段、权限或操作日志请求，都必须先输出一次固定的“页面任务概览”，再进入子 skill 路由。概览只报告当前页面/业务模块范围，不扩展为仓库级状态报告。

```text
【理解用户需求】：<用一句话复述用户要解决的问题、目标和边界>
归属系统：<贸易系统 / 展厅系统 / 待确认；写明 TSBERP 或 HALLERP 证据>
归属模块：<一级菜单-具体业务模块，例如 采购管理-采购订货模块>
参与当前模块 Git 修改人：<当前 git identity；相关模块文件的 author/committer；无法确认则写待确认>
预计改动文件/行数：<预计文件数；约 +N/-M 行，未开始实现时为估算>
现成可复用能力：
  - utils：<文件/导出名，或无>
  - hook：<文件/导出名，或无>
  - fieldMapping（项目现有命名可能为 filedMapping）：<文件/导出名，或无>
```

概览字段必须基于证据填写：先读 `profiles.md` 和 `anchors.md`，再检查当前模块的路径、同模块页面、相关 imports/调用方以及 Git 归因，然后再输出。系统、模块、Git 修改人、改动范围或可复用能力无法唯一确定时明确写“待确认”，不得猜测。预计行数是实现前估算，完成后由实际 diff 校正。

“参与当前模块 Git 修改人”只包含与本次页面改动直接相关的当前模块文件及其必要共享文件的 author/committer；不固定输出仓库路径、HEAD、工作区状态或文件级 Git 最近修改者清单。若触达共享组件、公共 hook/util、字段映射或跨模块文件，仍须遵守 `anchors.md` 的共享影响和 Git 归因关卡，并在概览中注明其复用位置。

现成能力检查必须先搜索并列出可直接复用的 `utils`、`hook`、`fieldMapping/filedMapping`；存在可复用项时优先复用，只有确认不存在或不适配时才提出新增。概览完成后，继续执行对应子 skill 的规则；概览不替代子 skill 的蓝图、权限、字段、日志或验证要求。
