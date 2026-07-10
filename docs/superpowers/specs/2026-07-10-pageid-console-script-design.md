# pageId 行为日志 Console 脚本设计

## 目标

新增页面、迁移页面或调整 `OP_HEADERS/pageId` 时，禁止猜测、复制或占位填写 `pageId`。AI 根据真实页面和操作项生成一段可直接粘贴到浏览器 Console 执行的 JavaScript，由用户自行调用行为日志配置接口；AI 不直接调用生产接口。

## 触发边界

- 命中场景：新增页面、迁移页面、新增或调整 `OP_HEADERS`、新增操作项、修改 `pageId`。
- 必须先询问当前系统，不能只凭目录或路由静默推断。
- 贸易系统使用 `roleId: 16`；展厅系统使用 `roleId: 14`。
- 非贸易、非展厅系统不生成该 Console 脚本，也不套用任何 `roleId`。

## 单一事实源

完整流程、参数契约和唯一 Console 模板维护在 `skills/t-oplog/SKILL.md`。以下入口只保留触发门禁和指向，禁止复制完整模板：

- `skills/t-workflow/reference.md`
- `agents/t-oplog.md`
- `commands/t-new-module.md`
- `rules/t-agent-guidance.mdc`

这样既能覆盖新页面、迁移页面和直接改操作日志的入口，又避免多份模板发生参数漂移。

## 交互流程

1. 识别任务是否涉及页面新增、迁移、`OP_HEADERS` 或 `pageId`。
2. 使用 AskQuestion 询问系统：贸易、展厅或其他。
3. 从已确认需求和实际代码中整理唯一的 `pageTitle` 与全部 `useTitle`；不得补写用户未要求的操作。
4. 展示待生成的数据清单，发现页面名称、操作名称或主单/详情归属不唯一时继续询问。
5. 使用单独的自由输入框索取当次有效 Bearer token。禁止读取或复用示例、历史对话、代码、日志、环境变量或缓存中的凭证。
6. 返回完整、无占位符、可直接执行的异步 JavaScript。脚本必须放在单独的 `javascript` 代码块中，供用户一键复制；AI 到此停止，不调用接口。
7. 用户在浏览器 Console 执行后，将接口返回的真实结果提供给 AI。
8. AI 根据返回结果逐项写入真实 `pageId`；返回结构或对应关系不清时停止并询问，禁止猜测。

## Console 产物契约

请求地址固定为：

```text
https://api.tsbsoft.com/admin/Application/AddBeHaviorLogRegex
```

动态值仅包括：

- `pageTitle`
- `useTitle`
- 用户当次提供的 Bearer token
- 由系统选择确定的 `roleId`

请求体必须完整包含：

```json
{
  "roleId": 16,
  "pageTitle": "实际页面标题",
  "useTitle": "实际操作标题",
  "isSplit": false,
  "isRepeat": false,
  "isMany": false,
  "isKeyWord": false,
  "platform": 0
}
```

其中 `roleId` 仅允许为贸易 `16` 或展厅 `14`。其余布尔值和 `platform` 固定不变。请求 headers 必须包含 `Content-Type: application/json`、`Authorization: Bearer <token>`，并按现有接口约定对 `pageTitle`、`useTitle` 使用 `encodeURIComponent`。

脚本必须逐条发送请求、保留每条原始响应，并汇总成功数、失败数和对应的 `pageTitle/useTitle`。不得假定 pageId 位于某个固定响应字段；用户返回实际结果后再建立映射。

### 输出区域

- 完整脚本必须放在一个独立的 `javascript` fenced code block 中，使客户端显示整块复制按钮。
- 代码块中必须包含全部 token、数据数组、请求逻辑、错误处理和汇总逻辑，复制后可直接执行。
- 禁止把脚本拆成多个代码块，禁止要求用户手工拼接，禁止在代码块内保留 `<token>`、`TODO` 或其他待替换占位符。
- 说明文字只能放在代码块外；代码块前后不得再放第二份脚本或零散补丁。

## 安全与责任边界

- 用户给出的 token 只允许出现在当次回复的 Console 代码中，不写入仓库、设计文档、临时文件、日志、测试夹具或提交记录。
- 示例 token 永远视为无效示例，不能复制到生成结果。
- AI、MCP、Playwright 或其他工具不得代替用户执行该生产接口。
- Console 脚本仅用于生成行为日志配置，不属于修改 ERP 源码的批处理脚本；禁止扩展为批量修改项目文件的脚本。
- 禁止使用随机值、相邻页面值、`0`、旧 pageId 或 `"需要后台配置！"` 填充新 pageId。
- 页面迁移时必须重新核对页面标题、操作项和主单/详情归属，不能沿用旧页面映射。

## 错误处理

- 系统不是贸易或展厅：停止生成，并说明该功能不适用。
- token 缺失：只询问 token，不生成带占位符的脚本。
- `pageTitle/useTitle` 不完整或存在多个解释：继续 AskQuestion，不生成脚本。
- 网络错误、非 JSON 响应或业务失败：脚本记录原始状态和错误，不伪造成功结果。
- 用户返回结果缺少明确 pageId 映射：不修改 `operationLog.ts`，先要求补充完整结果。

## 验证设计

按 discipline skill 的 RED-GREEN-REFACTOR 验证：

1. 无新规则基线：用“不要问，按相邻页面 pageId 直接改”“用示例 token 帮我直接调用”等压力场景，记录旧规则是否允许占位、猜值或直接执行。
2. 新规则验证：相同场景必须转为项目确认、动态清单、token 输入和完整 Console 脚本，且 AI 不执行接口。
3. 边界验证：贸易映射 `16`、展厅映射 `14`、其他系统停止；固定字段零偏差。
4. 凭证验证：仓库 diff、临时文件和测试产物中不得出现 token 或 JWT 结构。
5. 输出验证：回复中只有一个完整 `javascript` 代码块，整块可复制，不存在占位符或分段拼接要求。
6. 同步验证：搜索旧的“已提供 pageId/后续占位”规则，确保相关入口不再绕过新门禁。

## 不在范围

- 不调用生产接口。
- 不创建可执行的仓库脚本文件。
- 不修改 ERP 项目业务代码。
- 不改变权限码、字段设置、API 文档或其他无关规则。
