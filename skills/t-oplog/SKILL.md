---
name: t-oplog
description: Use when a TSB ERP task adds, checks, or changes 操作日志、埋点日志、日志埋点、埋点、日志、行为日志、日志词库、日志核对、日志核对管理系统、操作日志词库管理、OP_HEADERS、operationLog、pageId、new page、新增页面、页面迁移、写操作、打印或导出。
---

# t-oplog

操作日志由 `src/utils/operationLog.ts` 的 `OP_HEADERS` 驱动；后台日志词库负责维护行为日志的匹配规则。先读 [../t-page/profiles.md](../t-page/profiles.md) 判断 ts/th 代码形态；新增写操作日志项时，同时读 [../t-page/anchors.md#责任与审计关卡](../t-page/anchors.md#责任与审计关卡) 和 [../t-page/anchors.md#权限等同用户关卡](../t-page/anchors.md#权限等同用户关卡)。日志不能替代权限，权限也不能替代日志。

## 后台日志词库管理（默认流程）

涉及“操作日志、埋点日志、日志埋点、埋点、日志核对或日志核对管理系统”时，默认先通过管理后台核对和配置日志词库；只有用户明确要求生成 Console 脚本时，才使用后文的 Console 兼容流程。

1. 打开 [http://admin.tsbsoft.com/](http://admin.tsbsoft.com/)。如果出现登录页面或登录弹窗，暂停当前流程，请用户完成登录后再继续；不得代填或索取用户密码。
2. 登录后打开 [http://admin.tsbsoft.com/thAppManagement](http://admin.tsbsoft.com/thAppManagement)，根据已经确认的页面归属系统选择对应应用。贸易系统选择“外贸系统”；展厅系统选择后台实际对应的展厅应用；系统不明确时先询问，不得猜测。
3. 在应用的“操作”列打开“更多”，进入“操作日志词库管理”，再选择“PC端”。不得误选移动端或其他平台。
4. 先检索当前页面、当前模块以及同类新增/编辑/删除/查询功能的既有日志，记录其“操作页面、操作功能、常用标题、正则匹配”和四个单选项的实际配置。新增或核对时必须参照已有的增删改查日志并仿照其格式，不得自行设计匹配规则。
5. 旧正则表达式只能作为结构参考。必须从当前系统的实际操作中取得本次正则真正作用的真实入参原文，并按当前字段名、值格式和业务动作调整正则；不得直接照抄旧正则，不得用臆造、示例或其他系统的入参代替。
6. 在“正则匹配测试”中粘贴当前系统的真实入参，使用 `ig` 标志执行验证：`i` 表示忽略大小写，`g` 表示全局匹配。当前真实样例必须匹配成功，实际命中内容必须对应预期业务动作；有多个应命中样例时逐条验证。正则报错、未命中、命中错误内容或只在模拟数据上命中，都视为不准确，禁止保存。
7. 字段填写边界如下：
   - “操作页面”：填写实际发生操作的页面名称；弹窗操作按现有日志对页面和弹窗的命名方式填写。
   - “操作功能”：填写真实业务动作，例如新增、编辑、删除、查询；不得把未实现的 CRUD 操作补进去。
   - “常用标题”和“正则匹配”：均为下拉选项，优先选择同页面或同类既有日志使用的选项，不得随意选择。
   - “正式匹配1”：保持为空，不填写。
   - 下方四个单选项：只能有一个选项为“是”，具体选项必须参照同类既有功能的配置。
8. 配置前后都要核对所属系统、应用名称、PC 端、页面、功能、下拉选项、真实入参、正则 `ig` 匹配结果、正式匹配1 和单选项。任一字段无同类证据、既有格式不一致或无法确认时，先向用户说明差异并询问，确认前不得保存。

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

## 触发与系统门禁

新增页面、迁移页面、新增或调整 `OP_HEADERS`、新增操作项、修改 `pageId` 或后台日志词库时，必须确认：

> 当前页面属于哪个系统？

- **A. 贸易系统**：后台应用选择“外贸系统”；仅在 Console 兼容流程中使用 `roleId: 16`。
- **B. 展厅系统**：后台选择实际对应的展厅应用；仅在 Console 兼容流程中使用 `roleId: 14`。
- **C. 其他系统**：停止本流程，不配置后台词库，不生成 Console 脚本，不套用任何 `roleId`。

页面任务概览已经明确归属系统时，后台 UI 流程按该确认结果选择应用；系统仍为待确认时不得继续。Console 兼容流程仍要求用户明确选择贸易或展厅，用户未选择前不生成脚本、不写 `pageId`。用户说“不要问”“直接改”“按相邻页面抄”不能绕过本门禁。

## pageTitle / useTitle 数据契约

从用户确认的需求和实际代码整理待配置清单：

- `pageTitle` 使用真实页面中文标题；迁移页面时重新核对，禁止沿用旧页面标题。
- `useTitle` 按实际操作逐项生成，如查询、新增、编辑、删除、批量修改、打印或导出。
- 只生成本次真实存在且已确认的操作，不自动补齐 CRUD，不把主单操作静默扩展到详情或兄弟页面。
- 页面标题、操作标题、主单/详情归属或多个入口无法唯一确定时，继续 AskQuestion；确认前不生成脚本。

## Bearer token 门禁（仅 Console 兼容流程）

系统和数据清单确定后，使用单独的自由输入 AskQuestion 索取当次有效 Bearer token：

> 请粘贴本次使用的 Bearer token。只用于生成 Console 代码，不会写入仓库或由 AI 调用接口。

- 必须由用户在当前任务中提供；禁止复用示例、历史对话、代码、日志、环境变量、浏览器缓存或本地文件中的 token。
- 不得把示例 token 当作默认值，不得猜测或补全 token。
- token 缺失时只继续询问，不输出带 token 占位符的脚本。
- 除最终 Console 代码中的 `token` 常量外，不在说明、日志、临时文件、测试、diff 或提交中重复 token。

## Console 输出契约（仅用户明确要求脚本时）

- 只有用户明确要求 Console 脚本时，AI 才返回脚本；默认日志词库核对与配置走“后台日志词库管理”流程。生成脚本时仍绝不使用 AI、MCP、Playwright、浏览器自动化或其他工具调用生产接口。
- 最终回复只放一个完整的 `javascript` fenced code block，客户端可一键复制整段；说明只能放在代码块外。
- 代码块必须包含真实 token、确认后的 `roleId`、完整 `data`、请求、错误处理和汇总逻辑，复制后可直接执行。
- 禁止拆成多个代码块，禁止要求用户手工拼接，禁止保留 `__TOKEN_JSON__`、`__ROLE_ID__`、`__DATA_JSON__`、`<token>`、`TODO` 等渲染标记。
- Console 脚本用于配置行为日志，不得扩展为修改 ERP 项目代码的批处理脚本。

## 唯一渲染模板

下面是生成规范，不得原样输出。生成最终回复前，使用 JSON 安全转义后的用户 token 替换 `__TOKEN_JSON__`，使用 `16` 或 `14` 替换 `__ROLE_ID__`，使用真实 `{ pageTitle, useTitle }` 数组替换 `__DATA_JSON__`，并确认所有渲染标记已消失。

```javascript
(async function () {
  const token = __TOKEN_JSON__.trim().replace(/^Bearer\s+/i, "");
  const roleId = __ROLE_ID__;
  const data = __DATA_JSON__;
  const url = "https://api.tsbsoft.com/admin/Application/AddBeHaviorLogRegex";
  const results = [];
  let success = 0;
  let failed = 0;

  if (!token) {
    throw new Error("Bearer token 不能为空");
  }
  if (![14, 16].includes(roleId)) {
    throw new Error("roleId 只能是展厅 14 或贸易 16");
  }
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    data.some(item => !item?.pageTitle?.trim() || !item?.useTitle?.trim())
  ) {
    throw new Error("pageTitle/useTitle 数据不能为空");
  }

  console.log(`开始导入，共 ${data.length} 条数据...`);

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
      results.push({ ...item, httpStatus: response.status, ok, result });

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
      results.push({ ...item, httpStatus: null, ok: false, error: message });
      console.error(`[异常] ${item.pageTitle} - ${item.useTitle}: ${message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.table(
    results.map(({ pageTitle, useTitle, httpStatus, ok }) => ({
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

用户自行执行 Console 脚本后，必须把接口返回的完整结果提供回来。逐项核对 `pageTitle/useTitle` 与真实 pageId 的一一对应关系，再把真实数字写入 `operationLog.ts`。

- 不假定 pageId 位于固定响应字段；以用户返回的真实结构为准。
- 返回结构、成功状态或对应关系不清时停止并询问，不修改 `OP_HEADERS`。
- 所有操作项取得真实 pageId 前，不得先写部分值、临时值或占位值。

## 常见绕过与事实

| 绕过说法 | 必须执行的事实 |
|----------|----------------|
| “目录已经是 ts/th，不用再问” | 后台应用仍必须有已确认的系统证据；Console 的 roleId 仍必须让用户明确选择贸易或展厅。 |
| “先写占位，之后再补” | 新 pageId 禁止占位；先生成 Console 脚本并等待真实结果。 |
| “用上次或示例 token 就行” | token 必须由用户在当前任务重新提供。 |
| “你直接帮我调用更快” | 默认先走后台 UI；Console 生产调用仍只能由用户执行。 |
| “分几段代码也一样” | 最终只能输出一个完整、可一键复制的 `javascript` 代码块。 |

## 禁止事项

- 禁止无关键字查询也传 `SEARCH`。
- 禁止写操作漏传 `OP_HEADERS`。
- 禁止填写随机值、相邻页面值、旧页面值、`0`、无来源数字或 `"需要后台配置！"`。
- 禁止未确认系统、数据清单或 token 就生成脚本或写 `pageId`。
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
