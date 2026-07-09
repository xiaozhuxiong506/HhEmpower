# 全部非 t-workflow Skills 全方面重写设计

## 背景

当前 skills 已覆盖 Tsb ERP 页面开发的主要场景：入口路由、需求澄清、页面结构、规范、权限、字段设置、Tab 可编辑性、操作日志、路由注册和禅道任务收集。现有内容能用，但存在三类问题：

- `description` 触发词不够系统，容易漏触发或误触发。
- 各 skill 的硬门禁表达不统一，部分规则散落在正文和 reference 中。
- 支撑文档存在重复说明，主文件与 reference 的边界还可以更清楚。

本次重写采用“专业化改写 + 行为边界强化”：不仅润色文字，也重新梳理每个 skill 的触发条件、执行顺序、必问卡停、禁止项和跨 skill 路由。

## 范围

### 纳入重写

重写以下 13 个 skill：

- `skills/t-page/SKILL.md`
- `skills/t-clarify/SKILL.md`
- `skills/t-standards/SKILL.md`
- `skills/t-module/SKILL.md`
- `skills/t-list/SKILL.md`
- `skills/t-detail/SKILL.md`
- `skills/t-dialog/SKILL.md`
- `skills/t-tab/SKILL.md`
- `skills/t-field/SKILL.md`
- `skills/t-auth/SKILL.md`
- `skills/t-oplog/SKILL.md`
- `skills/t-registry/SKILL.md`
- `skills/t-zentao/SKILL.md`

允许同步重写支撑文档：

- `skills/README.md`
- `skills/t-page/profiles.md`
- `skills/t-page/anchors.md`
- `skills/t-page/naming.md`
- `skills/t-page/orchestration.md`
- `skills/t-standards/reference.md`
- `skills/t-module/reference.md`
- `skills/t-registry/reference.md`
- `skills/t-registry/examples.md`

### 暂不纳入

- 不修改 `skills/t-workflow/SKILL.md`。
- 不修改 `skills/t-workflow/reference.md`。
- 不修改 `agents/`。
- 不创建新的 skill。
- 不新增脚本、模板、README、CHANGELOG 或安装文档。

## 重写原则

### 触发层

每个 `description` 都必须包含两部分：

1. 这个 skill 解决什么问题。
2. 什么时候必须使用它，包括中英文/代码关键词触发词。

`description` 中放“何时使用”，正文不再依赖“何时使用本 skill”章节来补救触发。

### 正文层

`SKILL.md` 只保留：

- 入口顺序
- 必做动作
- 必问卡停
- 禁止项
- 路由到其他 skill/reference 的链接

长表格、命令示例、详细解释放入 reference 或 examples。

### 边界层

全部 skill 统一硬门禁风格：

- 命中必问场景时，选定前不写代码。
- 用户给出明确范围时，只改明确范围。
- 发现范围外问题时报告，不顺手改。
- 引用项目特定路径前先读 `profiles.md`。
- 跨模块/批量任务禁脚本，走模块拆解。
- 共享组件、公共 hook、跨模块影响由调度/影响扫描统一处理，不让页面 skill 自行扩散。

### 单一事实源

避免把同一规则复制到多个地方：

- 项目画像、ts/th 差异：`t-page/profiles.md`
- 五条红线、标准页、主单/详情映射：`t-page/anchors.md`
- 命名一致：`t-page/naming.md`
- 调度与 subagent 边界：`t-page/orchestration.md`
- 列宽、import、virtualYConfig、columns 顺序：`t-standards/reference.md`
- 路由发现命令：`t-registry/examples.md`

各 `SKILL.md` 引用这些文档，不重复粘贴长规则。

## 分组设计

### 入口与调度组

#### `t-page`

目标：成为真正的总入口，不承载过多细节。

改写方向：

- `description` 强化“业务页总入口、skill 路由、ts/th 探测、任何改页前先读”。
- 正文顺序固定为：模糊需求先 `t-clarify` → 读 `profiles` → 读 `anchors` → 读 `t-workflow` → 按路由表读子 skill。
- 路由表保留，但用更短、更可执行的描述。
- 明确 `t-page` 不写代码，只决定读哪些 skill 和支撑文档。

#### `t-clarify`

目标：成为真正的前置澄清卡停。

改写方向：

- `description` 加强模糊词和绕过词触发：`不要问了`、`你看着办`、`随便`、`直接处理` 等。
- 保留信号词表，但压缩解释。
- 明确触发后唯一动作是 AskQuestion，禁止读下游 skill、派 agent、出蓝图、取 diff。
- 去掉“3 秒内无异议即视为认可”这类弱确认，改成需要用户明确确认或自然语言明确答复。
- 把候选项生成规则写得更硬：能从代码/git 推断的候选必须列出。

#### `t-zentao`

目标：规范禅道任务收集与派发边界。

改写方向：

- `description` 加入禅道、assigned-to-me、分组、派发、MCP、登录等触发词。
- 明确必须优先用 `zentao_collect_assigned_tasks`。
- 登录缺失时只提示用户登录，不伪造任务。
- 派发时保留任务 ID、URL、标题、原始描述，不让 agent 只看摘要。
- 任务分组后若模块不清，先交给 `t-clarify` 或用户确认，不强行派发。

### 页面结构组

#### `t-module`

目标：新模块总装流程更硬。

改写方向：

- `description` 覆盖新页面、新菜单、scaffold、路由、OP_HEADERS、auth、i18n、详情。
- 主流程改成检查清单：探测项目 → 是否做详情 → API → OP_HEADERS → 路由 → 列表 → 详情 → auth → i18n → 字段设置 → registry。
- 详细命名替换和自检留在 `reference.md`。
- 明确未确认 pageId、i18n、权限码、字段设置前不得写对应代码。

#### `t-list`

目标：主单列表页规范更清晰。

改写方向：

- `description` 加入主单、列表、vxe-grid、columns、useGridPreferences、ThToolbar、virtualYConfig。
- 正文突出文件结构、核心栈、必问字段设置、Tab 按钮要转 `t-tab`。
- 列宽/虚拟滚动只保留摘要，详细规则转 `t-standards/reference.md`。
- 禁止项统一成“不得主单改详情、不得手写列偏好、不得缺 virtualYConfig/height”。

#### `t-detail`

目标：详情页和主单边界更硬。

改写方向：

- `description` 覆盖详情、明细、Detail.vue、独立详情、openStaticPage、详情头。
- 第一屏强调 ts 独立详情与 th 内嵌详情的探测。
- 保留详情独有规则：独立 OP_HEADERS、auth 复用主单、route.query、ThDetailHeadInfo 历史拼写。
- 禁止主单引用详情目录，范围不清转 `t-workflow` 总表 #2。

#### `t-dialog`

目标：弹窗/抽屉的容器选择、字段设置、保存态更明确。

改写方向：

- `description` 加入 AEDrawer、AEDialog、XxxModal、el-dialog、el-drawer、保存、字段设置。
- 容器选择不清时必须 AskQuestion。
- 新字段转 `t-field`，保存/确认态转 `t-tab`，写操作日志转 `t-oplog`。
- 明确用户指定弹窗/抽屉时只改指定组件，发现复用时报告影响。

### 能力规则组

#### `t-standards`

目标：规范入口轻量化，细节全部下沉 reference。

改写方向：

- `description` 增强命名、列宽、minWidth、import、职责、解耦、virtualYConfig 触发。
- 主文件只保留：命名、模块耦合、文件职责、写法克制、列宽摘要、虚拟滚动摘要、禁止摘要。
- `reference.md` 增加清晰目录，统一承载 import 顺序、列宽、columns 属性顺序、select null、对照源码。

#### `t-auth`

目标：权限码新增不再由 AI 猜。

改写方向：

- `description` 覆盖 `AUTH_CODES`、`hasAuth`、`v-auth`、visible、按钮权限。
- 明确 `auth.ts` 只写权限码。
- 新增权限码前必须 AskQuestion，总表 #10。
- 详情页必须复用列表 auth，不单独建 auth.ts。

#### `t-field`

目标：字段设置维度统一、字段名一致。

改写方向：

- `description` 覆盖 setField、settingList、列表可见、详情可见、编辑可见、可编辑、批量编辑。
- 保留八个维度，但压缩解释。
- 新增字段必须问维度，默认照抄相邻字段也要写清证据。
- 明确 `fieldName` 必须与 columns.field / form prop / type 字段一致。

#### `t-tab`

目标：只读态、保存态、按钮 guard 统一。

改写方向：

- `description` 加入 activeTab、isEdit、SaveHidden、只读、预览、保存、确认、footer。
- 主文件先定义“显隐”和“可编辑性”两层逻辑。
- 新增会改数据的按钮必须问可编辑矩阵。
- 复杂 hook 细节保留为参照，不让每个弹窗各自发明保存规则。

#### `t-oplog`

目标：OP_HEADERS 和 pageId 规则不被误用。

改写方向：

- `description` 覆盖 OP_HEADERS、operationLog、pageId、SEARCH、写操作、打印、导出、关键字查询。
- 主文件保留 ts/th 形态差异、何时传/不传、pageId 必问、禁止项。
- 长示例压缩，保留最小 ts/th 示例。
- 强化“新增页面/新增操作项必须问 pageId，不得抄/造/填 0”。

#### `t-registry`

目标：影响范围与路由/Tab 发现更专业。

改写方向：

- `description` 覆盖路由、Tab、staticRoutes、remaining、兄弟页、影响范围、全模块扫描。
- 主文件保留 L1/L2/L3、Tab 四模式、规范分档、改动时查影响。
- `reference.md` 写运行时扫描方法。
- `examples.md` 写命令示例。
- 明确本 skill 只发现/登记/检测，不替代 `t-workflow` 的改前决策。

### 索引与支撑文档

#### `skills/README.md`

改写成更短的入口索引：

- 入口读法
- 快捷命令
- skill 分组
- 支撑文档单一事实源
- 旧名映射保留但压缩

#### `t-page/profiles.md`

保留画像表，但优化：

- 自动探测流程更短。
- 占位符替换规则更清晰。
- 明确新增第三项目只改画像表，不改各 skill 正文。

#### `t-page/anchors.md`

保留五条红线、标准源码、主单/详情映射、六处一致。

改写方向：

- 红线更命令式。
- “范围外发现”保留为报告格式。
- 标准源码和映射表保持双列事实源。

#### `t-page/naming.md`

保留六处一致和命名红线。

改写方向：

- 统一“样式一致”和“字段对齐”的区别。
- 保留 th 历史拼写不照抄到新页。

#### `t-page/orchestration.md`

改写调度边界：

- 前置澄清必须早于派 agent。
- `t-scout` 定范围，`t-impact` 查影响，`t-shared` 改共享件，`t-build` 真跑验证。
- 删除“直接改且范围明确可跳过侦察”这种容易被误用的表达，改成“用户明确且无红线时可简化蓝图，但不能跳过必要影响判断”。
- 保持禁脚本和模块拆解。

#### `t-standards/reference.md`

增加目录，保留：

- 命名对照
- 主单/详情
- API
- 模块耦合
- 文件职责
- import 顺序
- virtualYConfig
- 列宽/minWidth
- columns 属性顺序
- select null
- 对照源码

#### `t-module/reference.md`

改为新模块自检清单，减少和 `SKILL.md` 重复。

#### `t-registry/reference.md` / `examples.md`

分别负责：

- `reference.md`：查找方法和规范分档。
- `examples.md`：可复制命令。

## 执行顺序

1. 先重写单一事实源：`profiles.md`、`anchors.md`、`naming.md`。
2. 重写总入口：`t-page/SKILL.md`、`skills/README.md`。
3. 重写前置与调度：`t-clarify/SKILL.md`、`orchestration.md`、`t-zentao/SKILL.md`。
4. 重写页面结构组：`t-module`、`t-list`、`t-detail`、`t-dialog`。
5. 重写能力规则组：`t-standards`、`t-auth`、`t-field`、`t-tab`、`t-oplog`、`t-registry`。
6. 统一检查所有链接、heading anchor、重复规则和触发词。

## 验证方式

- 检查所有 `SKILL.md` frontmatter 只有 `name` 和 `description`。
- 检查每个 `description` 包含“做什么 + 什么时候用”。
- 检查所有相对链接存在。
- 检查没有把 `t-workflow` 红线设计写入 `t-workflow` 本体。
- 检查没有新增无关文档、脚本或 agents。
- 用 `rg` 扫描弱表达：`看情况`、`酌情`、`随便`、`默认改`、`直接改且`，逐个确认是否应改成硬规则。
- 用 `git diff --check` 检查空白问题。

## 风险与缓解

- **风险：全方面重写影响面大。**
  缓解：先写计划，按分组提交；每组改完检查链接和 diff。

- **风险：规则重复后产生冲突。**
  缓解：把事实源收敛到 `profiles`、`anchors`、`naming`、`orchestration`、`reference`，SKILL 主文件只引用。

- **风险：未实现 `t-workflow` 红线门禁导致引用落空。**
  缓解：本轮不新增对 `t-workflow` 未实现 #15-#18 的依赖；只引用当前已存在的必问总表与红线事实源。未来实现红线门禁时再接入。

- **风险：过度精简导致执行细节丢失。**
  缓解：长细节不删除，迁移到 reference；删除前确认已有唯一落点。

## 成功标准

- 13 个 skill 的触发描述更完整、专业、可触发。
- 每个 skill 的正文更短、更硬、更可执行。
- 支撑文档成为单一事实源，重复解释减少。
- 现有业务规则不丢失。
- `t-workflow` 本体保持未修改。
- 工作区最终只包含计划范围内的 skill/support 文档改动。
