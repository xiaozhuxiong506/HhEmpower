# t 前缀清理设计

## 目标

清除 `t-erp-page` 插件中遗留的旧 `tsb-*` 技术标识，使插件名、Skill、Agent、Command、MCP、环境变量、运行目录和当前文档统一使用 `t-*` 命名。清理不得改写 TSB 公司/业务品牌、真实域名、ERP 项目路径或项目自身的探测指纹。

## 保留边界

以下内容是真实事实，必须保留：

- `Tsb ERP`、`TSB ERP`、`TSB Soft` 等品牌表述。
- `tsbsoft.com`、`internal.tsb.com` 及其子域名。
- `Tsb.TradeErp.PC`、`Tsb.HallErp.PC` 等真实项目名/路径。
- `skills/t-page/profiles.md` 中 ERP 项目自身的 `package.json` 探测值 `tsb-erp` 和 `tsb-hall-user`。
- 历史事实中必须描述 TSB 业务的普通大写/首字母大写品牌文案。

## 必须移除的旧标识

- 旧插件、Skill、Agent、Command、Rule 和 MCP 前缀：`tsb-*`、`/tsb-*`。
- MCP 环境变量：`TSB_MCP_BROWSER_CHANNEL` 和 `TSB_MCP_PROFILE_DIR`。
- MCP 持久化目录：`TsbBrowserMcp`。
- README、CHANGELOG 和历史设计/计划中仅用于迁移说明的旧技术名。
- 构建产物 `mcp/dist` 中由源码带入的旧标识。

## 目标命名

| 旧标识 | 目标标识 |
|---|---|
| `TSB_MCP_BROWSER_CHANNEL` | `T_MCP_BROWSER_CHANNEL` |
| `TSB_MCP_PROFILE_DIR` | `T_MCP_PROFILE_DIR` |
| `TsbBrowserMcp` | `TBrowserMcp` |
| 文档中的 `TSB browser MCP` | `t-browser-mcp` |

不保留旧环境变量别名，否则旧命名仍会存在。禅道的旧 Playwright profile 不做隐式迁移；首次使用新目录时需重新登录，避免在代码中保留旧目录名。

## 实现范围

1. 先增加命名回归测试，扫描受控文本，只允许两个 ERP 探测值使用小写 `tsb-` 前缀。
2. 同步修改 `mcp.json`、MCP 源码、安装脚本、测试和用户文档。
3. 清理废弃命名迁移表和旧路径示例，但不改动真实域名、品牌和项目指纹。
4. 将插件版本提升到 `2.7.1`，重新构建并提交 `mcp/dist`。

## 验证标准

- 命名测试在实施前因旧标识失败，实施后通过。
- `git grep` 不再命中任何非允许的 `tsb-*`、`TSB_MCP_*` 或 `TsbBrowserMcp`。
- 官方 Cursor plugin 与 marketplace schema 校验通过。
- 真实导出包在 Git 跟踪后可从仓库外启动，并列出 Torna 与禅道全部工具。
- 非浏览器全套测试通过，工作区在重建后保持干净。

## 非目标

- 不重命名 TSB 品牌、真实域名或 ERP 仓库。
- 不改 Torna/禅道工具名、入参、出参、登录规则或权限边界。
- 不趁机重构 MCP 或其他插件代码。
