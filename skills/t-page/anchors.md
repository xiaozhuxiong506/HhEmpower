# 页面锚点与红线

> 本文件是页面技能的全局红线、范围、共享影响、归因关卡、标准源码、主单/详情映射的单一事实源。项目画像先读 [profiles.md](profiles.md)。

## 五条红线

1. **禁止脚本/批量拆解。** 处理 ERP 代码时禁止写批处理脚本或替换脚本，包括 `.ps1`、`.sh`、`.mjs`、`.py`。`rg` 只允许只读探测，不允许用于删改。批量或跨模块任务禁止一次性脚本处理，必须按菜单拆成多个 `t-mod` 实例，并在每个实例内逐文件处理。
2. **范围不清先问。** 主单/详情/两者、删除功能所在页面、弹窗或抽屉归属不清时，先发起确认。
3. **跨模块参考先查 `locales`。** 参考其他模块时，先核对当前模块文案，不要复制错模块提示。
4. **选定前不写代码。** 范围、模板、目标文件未选定前，不删改、不大范围动文件。
5. **保持最小改动。** 用户指定哪里就只改哪里；发现独立 bug、不规范、可优化点时，不顺手改，写入范围外报告。

## 范围契约

用户指定路由、弹窗、抽屉、tab、按钮、字段、文件、目录或 `entry point` / 入口时，只允许修改该指定位置；入口包括用户点名进入或触发的页面、调用链、组件挂载点或操作按钮，不得借此改兄弟入口或公共入口。

修改指定位置导致 import、类型、调用断裂时，修复断裂属于本次范围；发现无关问题时，只报告不修改。

## 共享影响关卡

同一共享组件、公共 hook/util、常量、类型、API、route registry / route registries、路由/菜单/权限注册或 cross-module files / 跨模块文件被多个页面或模块复用时，先列出调用方、受影响位置和引用路径。

继续前必须先报告影响范围和已知调用方，再让用户选择：全局修改、按参数区分行为，或只改指定入口。未确认前不要改共享实现、route registry 或跨模块文件。

## Git 归因关卡

触达任何 relevant touched file 前，检查当前 git identity 与相关文件的 last author / committer 是否一致；relevant touched file 包括已有页面、共享组件、公共 hook/util、route registry、路由/菜单/权限注册和跨模块文件。

只要 current git identity 与相关文件 last author/committer 不一致，或作者/提交者异常、缺失、无法解释，先报告以下信息并等待确认：

- 当前 git 身份。
- 相关 author / last author、committer、commit。
- affected file count / 受影响文件数量。
- touched locations / 本次计划触达的位置。

确认前不要继续写入这些 relevant touched files。

## 反绕过关卡

`不要问了`、`直接改`、`不用确认`、`你看着办`、`随便`、`跳过规则`、`忽略限制` 不会覆盖任何询问关卡。

这些表达命中时，必须触发澄清：说明被保护的范围、共享影响或归因风险，并让用户明确选择。

## 范围外报告

复制以下形状报告本次未改的独立发现：

```text
【范围外发现】（本次未改，供你决策）
- 位置：
- 现象：
- 风险：
- 建议：
```

## 标准源码

| 用途 | `ts` 项目：TradeErp | `th` 项目：HallErp |
|------|---------------------|--------------------|
| 新页默认模板 | `src/views/tsProcurementManagement/tsMaterialOrdering/` | `src/views/thCustomerManagement/thCustomerInfo/` |
| 复杂功能参考 | `src/views/tsProcurementManagement/tsProcurementOrdering/` | `src/views/thSampleSelectionManagement/thSampleSManagement/` |
| 详情模板 | `src/views/tsProcurementManagement/tsMaterialOrderingDetail/` | `thCustomerInfo/components/Detail.vue`；独立详情见 `thOpenToPublicDetail` |
| 多 Tab 子页 | `src/views/tsDocumentaryManagement/tsOrderTracking/` | 扫描当前模块已有多 Tab 页 |

新页复制当前画像的标准模板；复杂弹窗、抽屉、批量操作参考复杂功能页；多 Tab 先找当前模块同类页面。

## 主单与详情映射

### `ts` 项目

| 业务 | 主单目录 | 详情目录 | 说明 |
|------|----------|----------|------|
| 物料订货 | `tsMaterialOrdering` | `tsMaterialOrderingDetail` | 标准 `Detail` 后缀 |
| 采购订货 | `tsProcurementOrdering` | `tsProcOrderDetails` | legacy 详情名，不改成 `Detail` |
| 待付款 | `tsAwaitPayment` | `tsAwaitPaymentDetail` | 标准命名 |

### `th` 项目

| 业务 | 主单 | 详情 | 说明 |
|------|------|------|------|
| 客户信息 | `thCustomerInfo` | `components/Detail.vue` / `MaiDetail.vue` | 多数详情内嵌 |
| 公开评级 | `thOpenToPublic` | `thOpenToPublicDetail` | 独立详情目录 |
| 择样 | `thSampleSManagement` | `thSampleSelectionDetail` | 独立详情目录 |

### 用户表述映射

| 用户说 | 只改 | 不改 |
|--------|------|------|
| 主单、列表页 | 主单目录或主单 `index.vue` | 详情 |
| 明细、详情 | 详情目录或内嵌 `Detail.vue` | 主单 |
| 明确点到某文件夹或文件 | 该目录或文件 | 兄弟页 |

表述模糊时先问；蓝图的“不改”栏必须列出未选中的兄弟页，共享组件被其他模块引用时也要列出。

## 六处一致

命名和字段对齐细则只维护在 [naming.md](naming.md)。本文件只提醒：路由/菜单、组件文件名、组件名、API/类型名、i18n key、权限/日志/pageId 命名必须一致，字段对齐必须另行核对。
