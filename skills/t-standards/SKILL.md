---
name: t-standards
description: Use when applying TSB ERP 代码规范，或评估小功能是否过度工程、是否不必要地新增文件、依赖、抽象、hook/service/manager 与调用层级；也覆盖状态矩阵、边界归一化、适度重复、常量命名、语法简写、接口字段、业务注释、文件职责和模块解耦。
---

# t-standards

本 skill 只负责规范入口和门禁判断。具体写法读 [reference.md](reference.md)；命名一致读 [../t-page/naming.md](../t-page/naming.md)；范围和主单/详情边界读 [../t-page/anchors.md](../t-page/anchors.md)。

## 标准分类（Standard Categories）

- **命名一致**：路由、目录、组件名、API/type、i18n、auth/log/pageId 必须对齐。
- **字段/规则契约**：接口字段、值域、长度、小数位、必填、枚举、禁止中文等规则必须与事实源精确一致。
- **主单/详情边界**：详情可复用主单 auth/公共组件；主单不得引用详情目录。
- **文件职责**：`columns.ts` 只写列，`auth.ts` 只写权限码，`type.ts` 只写类型/枚举。
- **import 顺序**：新页照当前项目标准页，不以 legacy 旧页为准。
- **现成能力优先**：防抖、节流、日期、金额格式化、表格 formatter、输入限制先查项目 `utils` / hooks / directives。
- **复杂度预算**：需求、Bug、方案优先最小充分实现；新文件、新依赖、新抽象、新调用层级分别通过必要性门禁，禁止为局部问题造轮子或预建通用层。
- **常量适度**：只提取确有业务含义、真实复用或消除魔法值的常量；名称采用当前上下文中最短且无歧义的表达，不堆叠文件名、模块名和重复语义。
- **语法清晰**：简单单行的提前退出允许适度简写；条件或语句过长、格式化后换行、带副作用、属于关键业务判断或带 `else` 时使用花括号。
- **业务规则直接**：多状态规则按业务优先级早返回；存在真实差异的相似函数允许保留独立实现，不为消除重复强行引入状态机、策略表或跨文件抽象。
- **边界统一**：外部数据在 API mapper、适配层或页面入口归一化一次；业务函数使用稳定的领域类型，不散落 `Number`、`String`、`Boolean` 或 `as` 转换。
- **矩阵验收**：工作流、角色、业务类型、状态等维度共同决定行为时，用行为矩阵和重叠条件用例固定规则顺序与默认行为。
- **业务注释**：业务函数、复杂函数、难懂条件必须注释稳定的业务目的、关键规则和功能作用；不记录本轮对话、已撤销尝试或被否决方案。
- **grid 基线**：`useGridPreferences`、列宽、`virtualYConfig`、height、columns 属性顺序保持项目标准。
- **select null**：值可能为 `null` 的 `el-select` 必须处理空值。
- **源码对照**：新增或改动前先找同项目标准页和同模块兄弟页。

## 何时读参考（Read Reference When）

- 改列宽、`minWidth`、`columns` 属性顺序、formatter、金额/日期列时读 [reference.md#列宽与-minwidth](reference.md#列宽与-minwidth) 和 [reference.md#columns-属性顺序](reference.md#columns-属性顺序)。
- 改接口字段、表单 `prop`、`columns.field`、请求/保存 payload、字段长度、值域或校验规则时读 [reference.md#接口字段与输入规则契约](reference.md#接口字段与输入规则契约) 和 [../t-field/SKILL.md](../t-field/SKILL.md)。
- 改防抖、节流、日期、金额、表格 formatter 或通用转换时读 [reference.md#现成能力优先](reference.md#现成能力优先)。
- 改输入框数字范围、小数位、禁止中文、字符限制时读 [reference.md#输入限制与自定义指令](reference.md#输入限制与自定义指令)。
- 改 `virtualYConfig`、表格 height、弹窗 grid 时读 [reference.md#virtualyconfig](reference.md#virtualyconfig)。
- 改 import、文件职责、模块耦合、API 命名时读 [reference.md](reference.md) 对应章节。
- 方案准备新增文件、依赖、hook/service/manager、公共组件、包装层或调用中间层时，必须读 [reference.md#最小充分实现与四道结构成本门禁](reference.md#最小充分实现与四道结构成本门禁)。
- 准备提取常量、常量名明显过长，或选择单行 `if` 简写时，必须读 [reference.md#常量提取与命名](reference.md#常量提取与命名) 和 [reference.md#语法规范与适度简写](reference.md#语法规范与适度简写)。
- 修改多状态按钮、权限显隐、审核流、状态映射，或准备合并相似业务函数时，必须读 [reference.md#业务规则函数与状态矩阵](reference.md#业务规则函数与状态矩阵)。
- 改命名、字段对齐、legacy 拼写时读 [../t-page/naming.md](../t-page/naming.md)。
- 发现范围外规范问题时只报告，按 [../t-page/anchors.md](../t-page/anchors.md) 的范围外格式处理。

## 禁止项（Prohibitions）

- 禁止为了“顺手规范化”改用户未指定范围。
- 禁止小型改动在没有必要性证据时新增文件、第三方依赖、公共抽象或只做转发的调用层。
- 禁止只为满足 DRY 合并存在真实业务差异的函数，或把直接条件判断改成不必要的状态机、策略模式、运行时配置表。
- 禁止在业务分支中散落 `Number`、`String`、`Boolean` 或 `as` 来迁就外部脏数据；先在现有边界统一归一化。
- 禁止把 AI 自行引入后被用户否决的内容写成“不要 X”“不支持 X”“已移除 X”等注释、命名、测试或文档；按 [纠错复原协议](../t-page/anchors.md#纠错复原协议) 恢复需求基线。
- 禁止主单文件引用详情目录。
- 禁止 `auth.ts` 写权限码以外内容。
- 禁止用脚本批量改 ERP 页面；批量/跨模块任务按菜单拆成 `t-mod` 实例，逐文件处理。
- 禁止新增页面未查 `profiles.md` 就写项目路径、OP_HEADERS 形态、auth 或 i18n。
- 禁止将接口字段、输入值域、长度、小数位、必填、枚举或禁止中文规则做任何近似、放宽、收紧或自定义偏差。
- 禁止重复手写项目已有的防抖、节流、日期、金额格式化、表格 formatter、输入限制逻辑。
- 禁止新增 grid 缺 `virtualYConfig`/height，除非当前项目同类标准页明确不是 vxe-grid 栈。
- 禁止新增需求页使用 `minWidth`；列宽规则读 [reference.md](reference.md)。

关联：[t-page](../t-page/SKILL.md) · [t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
