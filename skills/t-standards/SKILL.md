---
name: t-standards
description: Use when applying TSB ERP 代码规范：命名、列宽、minWidth、import 顺序、文件职责、模块解耦、virtualYConfig、columns 属性顺序、formatter、utils 复用、防抖/节流、日期/金额格式化、输入限制、自定义指令、select null、源码对照。
---

# t-standards

本 skill 只负责规范入口和门禁判断。具体写法读 [reference.md](reference.md)；命名一致读 [../t-page/naming.md](../t-page/naming.md)；范围和主单/详情边界读 [../t-page/anchors.md](../t-page/anchors.md)。

## 标准分类（Standard Categories）

- **命名一致**：路由、目录、组件名、API/type、i18n、auth/log/pageId 必须对齐。
- **主单/详情边界**：详情可复用主单 auth/公共组件；主单不得引用详情目录。
- **文件职责**：`columns.ts` 只写列，`auth.ts` 只写权限码，`type.ts` 只写类型/枚举。
- **import 顺序**：新页照当前项目标准页，不以 legacy 旧页为准。
- **现成能力优先**：防抖、节流、日期、金额格式化、表格 formatter、输入限制先查项目 `utils` / hooks / directives。
- **grid 基线**：`useGridPreferences`、列宽、`virtualYConfig`、height、columns 属性顺序保持项目标准。
- **select null**：值可能为 `null` 的 `el-select` 必须处理空值。
- **源码对照**：新增或改动前先找同项目标准页和同模块兄弟页。

## 何时读参考（Read Reference When）

- 改列宽、`minWidth`、`columns` 属性顺序、formatter、金额/日期列时读 [reference.md#列宽与-minwidth](reference.md#列宽与-minwidth) 和 [reference.md#columns-属性顺序](reference.md#columns-属性顺序)。
- 改防抖、节流、日期、金额、表格 formatter 或通用转换时读 [reference.md#现成能力优先](reference.md#现成能力优先)。
- 改输入框数字范围、小数位、禁止中文、字符限制时读 [reference.md#输入限制与自定义指令](reference.md#输入限制与自定义指令)。
- 改 `virtualYConfig`、表格 height、弹窗 grid 时读 [reference.md#virtualyconfig](reference.md#virtualyconfig)。
- 改 import、文件职责、模块耦合、API 命名时读 [reference.md](reference.md) 对应章节。
- 改命名、字段对齐、legacy 拼写时读 [../t-page/naming.md](../t-page/naming.md)。
- 发现范围外规范问题时只报告，按 [../t-page/anchors.md](../t-page/anchors.md) 的范围外格式处理。

## 禁止项（Prohibitions）

- 禁止为了“顺手规范化”改用户未指定范围。
- 禁止主单文件引用详情目录。
- 禁止 `auth.ts` 写权限码以外内容。
- 禁止用脚本批量改 ERP 页面；批量/跨模块任务按菜单拆成 `t-mod` 实例，逐文件处理。
- 禁止新增页面未查 `profiles.md` 就写项目路径、OP_HEADERS 形态、auth 或 i18n。
- 禁止重复手写项目已有的防抖、节流、日期、金额格式化、表格 formatter、输入限制逻辑。
- 禁止新增 grid 缺 `virtualYConfig`/height，除非当前项目同类标准页明确不是 vxe-grid 栈。
- 禁止新增需求页使用 `minWidth`；列宽规则读 [reference.md](reference.md)。

关联：[t-page](../t-page/SKILL.md) · [t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
