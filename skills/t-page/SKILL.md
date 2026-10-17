---
name: t-page
description: TSB ERP 页面任务统一入口与路由器。Use when 不确定用哪个 TSB ERP skill、任务涉及 ts*/th* 业务页面、或需要页面级责任归属与全局边界；触发词：页面、路由、模块、业务闭环、全局感知、责任归属、vxe-grid、OP_HEADERS。不适用于：非 TSB ERP 仓库、纯后端接口开发、禅道/钉钉独立查询（直达对应 skill）。
---

# t-page

## 项目分流

先读取目标项目根目录 `package.json` 的 `name`。值为 `tsb-new-trade-erp-pc` 时，读取该项目根目录 `docs/` 中的规范，按文档完成当前任务，到此结束分流。其他项目继续执行下文原流程。

`/t-page + 任务` 是页面工作的按需入口。简单任务由主 Agent 直接处理，复杂任务按实际职责选择子代理；专业规范自动匹配，不要求用户逐个点名。

需要全部 22 个角色参与时，使用 [t-page-max](../t-page-max/SKILL.md)。用户直接调用的入口决定模式；同一任务内部从 max 转读本文件时保留全量模式，不重复启动。普通任务不读取全量阶段表。模式只在当前任务内沿用，新任务默认按需；用户后续直接调用 `/t-page` 时切换为按需。

主 Agent 统一调度，接单的子代理只执行获派职责，不重新启动入口。规范读取、主 Agent 自检与独立代理执行分别如实记录。

## 入口顺序

1. 先区分开发/修复与只读分析/审查，保留用户给定范围。产品需求、需求文档、原型说明或前后端混写描述先读 [t-requirement](../t-requirement/SKILL.md)，完成规范化《前端需求分析报告》，不得直接把原文当作前端任务。用户只要求分析或审查时，整条链路只读，不因发现问题转为实现。
2. 报告完成后，如果仍含会改变前端方案的歧义、反绕过表达，或要求跳过确认，再读 [t-clarify](../t-clarify/SKILL.md)，由澄清结果决定是否继续。
3. 读 [profiles.md](profiles.md)，确认当前页面画像是 `ts`、`th`，或仍需继续探测。
4. 读 [anchors.md](anchors.md)，只引用其中的全局关卡、范围、共享影响、归因和标准源。
5. 必读 [t-standards](../t-standards/SKILL.md) 和 [规范参考](../t-standards/reference.md)，不等待用户提到 import、Hook 或“规范化”。改代码任务另读 [t-workflow](../t-workflow/SKILL.md)，完成蓝图、必要确认、复杂度预算和纠错复原；只读任务不发起写入蓝图。
6. 输出下方“页面任务概览”，按 [orchestration.md](orchestration.md) 确定所需工作和负责人。普通模式仅要求需求分析时，以规范化报告和必要事实核查、澄清为交付；代码开发/审查任务继续完成相应取证、实现或核查、审查和验证，不在概览后直接交付。全量模式仍收齐完整链路回执；事实、权限、范围或必需执行能力存在缺口时说明阻塞。

## 必读材料

| 文档 | 读取时机 |
|------|----------|
| [profiles.md](profiles.md) | 每个页面相关任务先读，用于判定 `ts` / `th` 画像和路径令牌。 |
| [anchors.md](anchors.md) | 画像判定后读，用于范围、红线、共享影响、Git 归因、反绕过和标准源。 |
| [naming.md](naming.md) | 涉及路由、菜单、组件、API、类型、i18n、权限、日志、`pageId` 或字段对齐时读。 |
| [orchestration.md](orchestration.md) | 每次进入页面任务时读；确定按需分工、文件归属、必检证据与交付门禁。 |

下表按实际需求和源码选择专业规范，与是否派发子代理无关。实现者与审查者须读取命中的 Skill 及其必要参考文件；不能只看 description，也不能因用户未提及而省略适用规范。

## 技能路由

| 任务信号 | 读取 skill |
|----------|------------|
| 产品需求、需求文档、原型说明、前后端混写、分析前端改动点 | [t-requirement](../t-requirement/SKILL.md) |
| 新建模块、新页面骨架、模块级补齐 | [t-module](../t-module/SKILL.md) |
| 主单、列表页、查询区、表格、`vxe-grid` | [t-list](../t-list/SKILL.md) |
| 详情、明细、主单详情映射 | [t-detail](../t-detail/SKILL.md) |
| 弹窗、抽屉、对话框、批量操作面板 | [t-dialog](../t-dialog/SKILL.md) |
| 列宽、import、编码克制、通用页面标准（命名红线读 naming.md） | [t-standards](../t-standards/SKILL.md) |
| 校验、判空、类型判断、异常兜底、接口边界与过度防御 | [t-defense](../t-defense/SKILL.md) |
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

概览必须用 Markdown 列表逐行输出，每个字段独占一行；禁止把多个字段写在同一段落里（单个换行在聊天渲染时会被吞掉，导致全部挤成一段）。

```markdown
- 【理解用户需求】：<用一句话复述用户要解决的问题、目标和边界>
- 归属系统：<贸易系统 / 展厅系统 / 待确认；写明 TSBERP 或 HALLERP 证据>
- 归属模块：<一级菜单-具体业务模块，例如 采购管理-采购订货模块>
- 参与当前模块 Git 修改人：<当前 git identity；相关模块文件的 author/committer；无法确认则写待确认>
- 预计改动文件/行数：<预计文件数；约 +N/-M 行，未开始实现时为估算>
- 现成可复用能力：
  - utils：<文件/导出名，或无>
  - hook：<文件/导出名，或无>
  - fieldMapping（项目现有命名可能为 filedMapping）：<文件/导出名，或无>
```

概览字段必须基于证据填写：先读 `profiles.md` 和 `anchors.md`，再检查当前模块的路径、同模块页面、相关 imports/调用方以及 Git 归因，然后再输出。系统、模块、Git 修改人、改动范围或可复用能力无法唯一确定时明确写“待确认”，不得猜测。预计行数是实现前估算，完成后由实际 diff 校正。

“参与当前模块 Git 修改人”只包含与本次页面改动直接相关的当前模块文件及其必要共享文件的 author/committer；不固定输出仓库路径、HEAD、工作区状态或文件级 Git 最近修改者清单。若触达共享组件、公共 hook/util、字段映射或跨模块文件，仍须遵守 `anchors.md` 的共享影响和 Git 归因关卡，并在概览中注明其复用位置。

现成能力检查必须先搜索并列出可直接复用的 `utils`、`hook`、`fieldMapping/filedMapping`；存在可复用项时优先复用，只有确认不存在或不适配时才提出新增。概览完成后，继续执行对应子 skill 的规则；概览不替代子 skill 的蓝图、权限、字段、日志或验证要求。

交付遵守 [交付门禁](orchestration.md#交付门禁)：按需模式只报告实际参与者与相关检查，全量模式另附 22 角色清单。应执行但未执行、回执缺失或检查未运行须如实标记，不能记为通过或“不适用”。
