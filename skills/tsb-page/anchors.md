# Tsb ERP 页面公共锚点（各 Skill / Agent 引用此处，勿重复粘贴）

> 本文件是**全插件单一事实源**。四条红线、标准页、主单/详情映射以 ts/th 双列表达。
> 项目特定值的判定 → 先读 [profiles.md](profiles.md)。

## 四条红线（tsb-page 全栈通用，不随项目变）

1. **禁脚本**（绝对红线）—— 处理 ERP 代码禁止写任何批处理脚本（sed/awk/grep 替换、.ps1/.sh/.mjs/.py）；批量/跨模块任务一律按菜单拆 `tsb-module-agent` 实例并行，AI 逐文件读改。Grep 仅限只读探测（扫描/查影响），**不得用于删改**。
2. **范围不清必 AskQuestion**（主单 / 详情 / 两者；删功能未指明页面）
3. **参考他模块必查 locales**（禁止错模块提示文案）
4. **选定前不写代码**（范围未定前不删改、不大范围动文件；定了之后逐文件改）

必问规则 → [../tsb-page-workflow/reference.md](../tsb-page-workflow/reference.md#必问单选题总表)

## 标准源码（ts / th 双列）

| 用途 | TradeErp（ts*） | HallErp（th*） |
|------|----------------|----------------|
| 新页默认模板 | `src/views/tsProcurementManagement/tsMaterialOrdering/` | `src/views/thCustomerManagement/thCustomerInfo/` |
| 复杂功能参考 | `src/views/tsProcurementManagement/tsProcurementOrdering/` | `src/views/thSampleSelectionManagement/thSampleSManagement/` |
| 详情模板 | `src/views/tsProcurementManagement/tsMaterialOrderingDetail/` | 内嵌 `thCustomerInfo/components/Detail.vue`（独立详情见 `thOpenToPublicDetail`） |
| 多 Tab 子页 | `src/views/tsDocumentaryManagement/tsOrderTracking/` | 按需扫描当前模块 |

**选型规则**（通用）：新页复制本项目的 `${标准页}`；复杂弹窗/Drawer 对照 `${复杂参考页}`；多 Tab 对照当前模块已有的多 Tab 页。

## 主单 / 详情映射

### TradeErp（ts*）

| 业务 | 主单目录 | 详情目录 | 说明 |
|------|----------|----------|------|
| 物料订货 | `tsMaterialOrdering` | `tsMaterialOrderingDetail` | 标准 `Detail` 后缀 |
| 采购订货 | `tsProcurementOrdering` | `tsProcOrderDetails` | 详情 legacy，**不是** `Detail` 后缀 |
| 待付款 | `tsAwaitPayment` | `tsAwaitPaymentDetail` | 标准命名 |

### HallErp（th*）

| 业务 | 主单 | 详情 | 说明 |
|------|------|------|------|
| 客户信息 | `thCustomerInfo` | 内嵌 `components/Detail.vue`/`MaiDetail.vue` | 多数详情内嵌组件 |
| 公开评级 | `thOpenToPublic` | `thOpenToPublicDetail` 目录 | 用 `Detail` 后缀 |
| 择样 | `thSampleSManagement` | `thSampleSelectionDetail` 目录 | 用 `Detail` 后缀 |

> **th* 项目详情多内嵌为主**；独立详情目录少见。改详情前先探测：有 `thXxxDetail` 目录则改目录，否则改主单 `components/Detail.vue`。

### 用户表述 → 只改哪里（通用）

| 用户说 | 只改 | 不改 |
|--------|------|------|
| 主单 / 列表页 | 主单目录（或主单 index.vue） | 详情 |
| 明细 / 详情 | 详情目录（或内嵌 Detail.vue） | 主单 |
| 明确点到某文件夹 | 该目录 | 兄弟页 |

表述模糊（如「采购订货页面」「客户信息那个」）→ **必问** 总表 #2。细则 → [../tsb-page-workflow/reference.md](../tsb-page-workflow/reference.md#主单-vs-详情--范围模糊时必问)

蓝图「不改」栏须列出未选中的兄弟页；共享组件被其他模块引用时一并列出。

## 五处命名一致

列表：文件夹 · path · name · OP_HEADERS key · sysRoleFiledCode

详情：文件夹 + `Detail`（th 内嵌则组件名）· 独立 OP_HEADERS · auth 从列表 import

细则 → [naming.md](naming.md) · [../tsb-page-standards/SKILL.md](../tsb-page-standards/SKILL.md)
