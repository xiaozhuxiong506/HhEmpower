---
name: t-oplog
description: Use when a TSB ERP task adds, checks, or changes 操作日志、埋点日志、日志埋点、埋点、行为日志、日志词库、日志核对、日志核对管理系统、操作日志词库管理、OP_HEADERS、operationLog、pageId、新增页面、页面迁移、写操作、打印或导出。不适用于控制台日志、接口调试日志等运行日志（直接看代码/浏览器即可）。
---

# t-oplog

操作日志由 `src/utils/operationLog.ts` 的 `OP_HEADERS` 驱动；后台日志词库负责维护行为日志的匹配规则。先读 [../t-page/profiles.md](../t-page/profiles.md) 判断 ts/th 代码形态；新增写操作日志项时，同时读 [../t-page/anchors.md#责任与审计关卡](../t-page/anchors.md#责任与审计关卡) 和 [../t-page/anchors.md#权限等同用户关卡](../t-page/anchors.md#权限等同用户关卡)。日志不能替代权限，权限也不能替代日志。

本技能是日志流程的唯一入口，角色文件和全局规则只负责转交。相对链接从当前插件文件所在目录解析，不从 ERP 业务仓库猜 `skills/` 路径。使用宿主实际提供的浏览器能力操作后台；本插件没有操作日志专用 MCP 工具，不编造工具名。找不到技能文件、浏览器能力或后台入口时，报告实际路径、已尝试步骤与缺口。

## 触发与系统门禁

新增/迁移页面、调整 `OP_HEADERS/pageId` 或后台日志词库前，先确定目标业务系统。页面任务概览已有明确系统和源码证据时直接沿用；独立任务先读画像并确认系统。证据冲突或未知时停下核对，不从后台当前打开的应用反推业务系统。

| 业务系统 | 代码画像 | 后台应用 | 日志 `roleId` | 平台 |
| --- | --- | --- | --- | --- |
| 贸易系统 `TSBERP` | `ts` | 外贸系统 | `16` | PC端，`platform: 0` |
| 展厅系统 `HALLERP` | `th` | 后台实际对应的展厅应用，名称须现场核对 | `14` | PC端，`platform: 0` |

其他系统停止本流程。`roleId` 是日志接口的目标标识，不把其他字段名下的应用 ID、用户角色 ID 或列表序号当成它。后台 UI 和 Console 共用这份系统映射。

`admin.tsbsoft.com/thAppManagement` 是共用的后台应用列表入口，路径中的 `th` 不代表展厅；`Th*` 共享组件也不能作为系统归属证据。贸易任务仍在该入口选择“外贸系统”。

## 日志目标与来源核对

主 Agent 派发、日志角色执行和终审传递同一份目标记录，只记录证据，不生成额外业务配置文件：

- 系统与源码：已确认的 `TSBERP/HALLERP`、业务仓库/页面路径和确认依据。
- 后台目标：实际应用名称、日志 `roleId`、PC 平台，以及当前标签页/应用行或可读响应中的来源。
- 操作清单：本次真实 `pageTitle/useTitle`，主单/详情归属；不自动补齐未实现的 CRUD。
- 逐项结果：`pageId`、成功状态、同系统同平台的读取或执行来源。尚未取得的字段记待核验，不能用推导值冒充已观察到的值。

进入词库和每次保存前，都重新核对当前应用及日志目标与这份记录一致。可读取现有 UI、当前应用数据或浏览器已收到的响应核对 `roleId/platform`；无法观察实际目标就停止保存，不发送写请求来试探。切换应用、标签页或交接浏览器后，旧快照失效，重新核对。只读任务不保存，代码修改授权不自动扩展为后台配置授权。

系统不一致时退出当前配置步骤，回到目标应用只读核查；不得改任务系统来迎合当前弹窗。找不到目标应用、PC 入口或同名日志时，报告查找范围、筛选条件与权限缺口，不换系统、不复制另一系统的 pageId。发现已有误写只报告具体记录与归属，不擅自删除或迁移线上数据。

## 后台日志词库管理（默认流程）

涉及“操作日志、埋点日志、日志埋点、埋点、日志核对或日志核对管理系统”时，默认先通过管理后台核对和配置日志词库；只有用户明确要求生成 Console 脚本时，才使用后文的 Console 兼容流程。

1. 打开 [http://admin.tsbsoft.com/](http://admin.tsbsoft.com/)。如果出现登录页面或登录弹窗，暂停当前流程，请用户完成登录后再继续；不得代填或索取用户密码。后台站点或浏览器工具不可用时，停止本流程并向用户说明，不得凭记忆生成词库配置。
2. 登录后打开 [http://admin.tsbsoft.com/thAppManagement](http://admin.tsbsoft.com/thAppManagement)，按已确认系统精确定位应用行。贸易系统选择“外贸系统”；展厅系统选择有现场证据的展厅应用。多个候选或系统不明确时先询问，不按第一行、记忆或上次选中项操作。
3. 在该应用行的“操作”列打开“更多”，进入“操作日志词库管理”，再选择“PC端”。按上方目标记录核对实际应用、`roleId` 和 `platform`，一致后才检索或配置；不得误选移动端或其他平台。
4. 先检索当前页面、当前模块以及同类新增/编辑/删除/查询功能的既有日志，记录其“操作页面、操作功能、常用标题、正则匹配”和四个单选项的实际配置。新增或核对时必须参照已有的增删改查日志并仿照其格式，不得自行设计匹配规则。
5. 旧正则表达式只能作为结构参考。必须从当前系统的实际操作中取得本次正则真正作用的真实入参原文，并按当前字段名、值格式和业务动作调整正则；不得直接照抄旧正则，不得用臆造、示例或其他系统的入参代替。
6. 在“正则匹配测试”中粘贴当前系统的真实入参，使用 `ig` 标志执行验证：`i` 表示忽略大小写，`g` 表示全局匹配。当前真实样例必须匹配成功，实际命中内容必须对应预期业务动作；有多个应命中样例时逐条验证。正则报错、未命中、命中错误内容或只在模拟数据上命中，都视为不准确，禁止保存。
7. 字段填写边界如下：
   - “操作页面”：填写实际发生操作的页面名称；弹窗操作按现有日志对页面和弹窗的命名方式填写。
   - “操作功能”：填写真实业务动作，例如新增、编辑、删除、查询；不得把未实现的 CRUD 操作补进去。
   - “常用标题”和“正则匹配”：均为下拉选项，优先选择同页面或同类既有日志使用的选项，不得随意选择。
   - “正式匹配1”：保持为空，不填写。
   - 下方四个单选项：只能有一个选项为“是”，具体选项必须参照同类既有功能的配置。
8. 配置前后都要核对所属系统、应用名称、实际 `roleId/platform`、页面、功能、下拉选项、真实入参、正则 `ig` 匹配结果、正式匹配1 和单选项。任一字段无同类证据、既有格式不一致或无法确认时，先向用户说明差异并询问，确认前不得保存。保存后在同一应用 PC 词库重新检索，确认记录及真实 pageId；成功提示本身不足以证明目标正确。

后台词库配置完成后，代码侧仍需按本技能的 `OP_HEADERS`、`pageTitle`、`useTitle`、`pageId` 规则核对；后台规则不能替代前端操作日志接线，前端接线也不能替代后台词库核对。

## ts/th 形态

- **ts 主流形态**：`OP_HEADERS[页面名][动作] = { headers: { pageTitle, useTitle, pageId } }`。
- **th 主流形态**：`OP_HEADERS[PAGE{N}][AUTH{N}] = { headers: { pageTitle, useTitle, pageId } }`，并用注释标明页面名。
- 两项目都有少量混合历史写法；新增前先查同模块现有页面，不机械套用另一个项目。

## 何时传 OP_HEADERS

- **关键字查询**：只有关键字有值时传 `SEARCH`；普通翻页、Tab 切换、无关键字刷新不传。
- **写操作**：新增、编辑、删除、批量删除、状态变更、提交审核等改变数据的接口必须传对应操作项。
- **打印/导出**：`ThToolbar` 使用 `pageIds`，取 `EXPORT` / `PRINT` 的 `pageId`。
- **不传**：列配置读取/保存、纯读下拉、按 id 拉详情、无关键字的列表刷新。

## pageTitle / useTitle 数据契约

从用户确认的需求和实际代码整理待配置清单：

- `pageTitle` 使用真实页面中文标题；迁移页面时重新核对，禁止沿用旧页面标题。
- `useTitle` 按实际操作逐项生成，如查询、新增、编辑、删除、批量修改、打印或导出。
- 只生成本次真实存在且已确认的操作，不自动补齐 CRUD，不把主单操作静默扩展到详情或兄弟页面。
- 页面标题、操作标题、主单/详情归属或多个入口无法唯一确定时，继续 AskQuestion；确认前不生成脚本。

## Bearer token 门禁（仅 Console 兼容流程）

用户明确要求 Console 脚本、已明确选择贸易或展厅且数据清单确定后，使用单独的自由输入 AskQuestion 索取当次有效 Bearer token。用户已有明确选择时直接沿用；后台 UI 流程不索取 token：

> 请粘贴本次使用的 Bearer token。只用于生成 Console 代码，不会写入仓库或由 AI 调用接口。

- 必须由用户在当前任务中提供；禁止复用示例、历史对话、代码、日志、环境变量、浏览器缓存或本地文件中的 token。
- 不得把示例 token 当作默认值，不得猜测或补全 token。
- token 缺失时只继续询问一次，不输出带 token 占位符的脚本；用户再次拒绝提供时，停止 Console 流程，只输出后台词库核对结论，不得反复索取。
- 除最终 Console 代码中的 `token` 常量外，不在说明、日志、临时文件、测试、diff 或提交中重复 token。

## Console 输出契约（仅用户明确要求脚本时）

- 只有用户明确要求 Console 脚本时，AI 才返回脚本；默认日志词库核对与配置走“后台日志词库管理”流程。生成脚本时仍绝不使用 AI、MCP、Playwright、浏览器自动化或其他工具调用生产接口。
- 最终回复只放一个完整的 `javascript` fenced code block，客户端可一键复制整段；说明只能放在代码块外。
- 代码块必须包含真实 token、确认后的 `system`、由系统推导的 `roleId`、完整 `data`、请求、错误处理和汇总逻辑，复制后可直接执行。系统只替换一处，不另行手填目标数字。
- 禁止拆成多个代码块，禁止要求用户手工拼接，禁止保留 `__TOKEN_JSON__`、`__SYSTEM_JSON__`、`__DATA_JSON__`、`<token>`、`TODO` 等渲染标记。
- Console 脚本用于配置行为日志，不得扩展为修改 ERP 项目代码的批处理脚本。

## 唯一渲染模板

下面是生成规范，不得原样输出。使用 JSON 安全转义后的用户 token 替换 `__TOKEN_JSON__`，使用已确认的 `"TSBERP"` 或 `"HALLERP"` 替换 `__SYSTEM_JSON__`，使用真实 `{ pageTitle, useTitle }` 数组替换 `__DATA_JSON__`。系统到 roleId 的映射保持原样，并确认所有渲染标记已消失。

```javascript
(async function () {
  const token = __TOKEN_JSON__.trim().replace(/^Bearer\s+/i, "");
  const system = __SYSTEM_JSON__;
  const roleId = { TSBERP: 16, HALLERP: 14 }[system];
  const data = __DATA_JSON__;
  const url = "https://api.tsbsoft.com/admin/Application/AddBeHaviorLogRegex";
  const results = [];
  let success = 0;
  let failed = 0;

  if (!token) {
    throw new Error("Bearer token 不能为空");
  }
  if (!["TSBERP", "HALLERP"].includes(system)) {
    throw new Error("必须明确选择贸易 TSBERP 或展厅 HALLERP");
  }
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    data.some(item => !item?.pageTitle?.trim() || !item?.useTitle?.trim())
  ) {
    throw new Error("pageTitle/useTitle 数据不能为空");
  }

  const target = { system, roleId, platform: 0 };
  console.log(`开始导入 ${system} / roleId=${roleId} / PC，共 ${data.length} 条数据...`);

  for (const item of data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          pageTitle: encodeURIComponent(item.pageTitle),
          useTitle: encodeURIComponent(item.useTitle)
        },
        body: JSON.stringify({
          roleId,
          pageTitle: item.pageTitle,
          useTitle: item.useTitle,
          isSplit: false,
          isRepeat: false,
          isMany: false,
          isKeyWord: false,
          platform: 0
        })
      });

      const raw = await response.text();
      let result = raw;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        // 保留非 JSON 原始响应，禁止伪造结构。
      }

      const ok = Boolean(response.ok && result && typeof result === "object" && result.code === 200);
      results.push({ ...item, ...target, httpStatus: response.status, ok, result });

      if (ok) {
        success++;
        console.log(`[成功] ${item.pageTitle} - ${item.useTitle}`, result);
      } else {
        failed++;
        console.error(`[失败] ${item.pageTitle} - ${item.useTitle}`, result);
      }
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      results.push({ ...item, ...target, httpStatus: null, ok: false, error: message });
      console.error(`[异常] ${item.pageTitle} - ${item.useTitle}: ${message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.table(
    results.map(({ system, roleId, platform, pageTitle, useTitle, httpStatus, ok }) => ({
      system,
      roleId,
      platform,
      pageTitle,
      useTitle,
      httpStatus,
      ok
    }))
  );
  console.log(`导入完成！成功: ${success}, 失败: ${failed}`);
  return results;
})();
```

## 真实 pageId 回填门禁

后台 UI 流程使用同一应用 PC 词库中实际读取的记录；Console 流程由用户自行执行后提供完整结果及本次请求来源。两条路径都先核对 [日志目标与来源核对](#日志目标与来源核对)，再把真实数字写入 `operationLog.ts`。

- 每项必须同时对应已确认系统、后台应用/日志 `roleId`、PC 平台及 `pageTitle/useTitle`。同名页面和动作、`code: 200`、单独的数字都不能证明系统归属。
- 响应本身未返回系统/平台时，结合本任务可追溯的请求与同应用词库读取证据核验；仅有第三方转交结果、历史结果或未知来源时停止回填，先补齐来源。不要求后端增加字段，也不把手写的系统标签当成证明。
- 模板结果中的 `system/roleId/platform` 记录的是本次请求目标，不是后端确认；与后台真实归属冲突时停止。请求、应用和结果必须连成同一条可追溯链路。

- 不假定 pageId 位于固定响应字段；以用户返回的真实结构为准。
- 返回结构、成功状态或对应关系不清时停止并询问，不修改 `OP_HEADERS`。
- 所有操作项取得真实 pageId 前，不得先写部分值、临时值或占位值。

## 常见绕过与事实

| 绕过说法 | 必须执行的事实 |
|----------|----------------|
| “目录已经是 ts/th，不用再问” | 已确认系统直接沿用；保存与回填仍须核验实际后台应用、日志 roleId 和 PC 平台。 |
| “先写占位，之后再补” | 先从目标系统 PC 词库取得可追溯的真实 pageId；用户明确要求时才进入 Console。 |
| “用上次或示例 token 就行” | token 必须由用户在当前任务重新提供。 |
| “你直接帮我调用更快” | 默认先走后台 UI；Console 生产调用仍只能由用户执行。 |
| “分几段代码也一样” | 最终只能输出一个完整、可一键复制的 `javascript` 代码块。 |

## 禁止事项

- 禁止无关键字查询也传 `SEARCH`。
- 禁止写操作漏传 `OP_HEADERS`。
- 禁止填写随机值、相邻页面值、旧页面值、`0`、无来源数字或 `"需要后台配置！"`。
- 禁止未确认系统、数据清单或当次 token 就生成 Console 脚本；后台 UI 不以提供 token 为前提。
- 禁止系统、后台应用、PC 平台或真实来源未核验就保存词库或回填 `pageId`。
- 禁止 AI 直接调用 `AddBeHaviorLogRegex`。
- 禁止未登录或未确认应用时进入后台日志词库配置。
- 禁止跳过既有日志比对，随意选择“常用标题”“正则匹配”或四个单选项。
- 禁止直接照抄旧正则而不结合当前系统的真实入参；禁止未使用 `ig` 完成匹配测试或当前真实样例未命中就保存。
- 禁止填写“正式匹配1”；禁止把四个单选项同时设为“是”。
- 禁止 ts key 与页面命名六处不一致。
- 禁止 th PAGE/AUTH 缺少页面注释。
- 禁止业务代码直接调用日志记录 API；打印/导出由组件处理。
- 禁止新增写操作时只补日志，不检查业务闭环、权限边界和责任归属。

关联：[t-module](../t-module/SKILL.md) · [t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-dialog](../t-dialog/SKILL.md)
