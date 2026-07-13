# Cursor 插件内置 MCP 设计

## 目标

`t-erp-page` 安装后自动提供 `t-browser-mcp`，同时包含 Torna API 文档检索和禅道任务能力。使用者不需要 `D:\company\HhEmpower` 源码目录，不执行 `install-mcp.ps1`，不修改用户级 `~/.cursor/mcp.json`，也不在插件安装后执行 `npm install`。

## 分发结构

插件根目录新增 Cursor 原生 `mcp.json`，`.cursor-plugin/plugin.json` 通过 `mcpServers` 指向该配置。MCP 的可执行入口放在 `mcp/dist/`，并随插件版本一起发布：

```text
t-erp-page/
├── .cursor-plugin/plugin.json
├── mcp.json
├── mcp/dist/server.mjs
├── mcp/dist/node_modules/
│   ├── playwright/
│   └── playwright-core/
├── skills/
├── agents/
├── commands/
└── rules/
```

`mcp.json` 只能使用 `${CURSOR_PLUGIN_ROOT}` 定位 `mcp/dist/server.mjs`，禁止写入用户名、盘符、仓库目录或插件缓存哈希。Cursor 从任意本地插件目录或 Marketplace 缓存目录安装后，都应启动同一份插件内 MCP。

## 构建方式

保留 `mcp/src/` 作为源码。通过仓库构建命令生成统一可分发运行目录：业务代码和 MCP SDK 打包到 `server.mjs`，Playwright 因依赖自身包元数据与运行资源而保留在 `dist/node_modules`；普通插件使用者不需要安装 npm 依赖。构建产物提交到仓库并进入 Marketplace 导出包。

构建仅解决运行依赖和模块装载，不修改现有工具名称、入参、出参、登录行为和权限边界。目标电脑仍需具备 Cursor 支持的 Node 运行环境和可用 Chrome；Torna 与禅道继续使用本机浏览器完成各自登录。

## 运行与安全

- MCP 名称保持 `t-browser-mcp`。
- Torna 工具保持非持久化浏览器 context；token 只保留在 MCP 进程内存，不保存账号密码、Cookie、Swagger JSON 或 Torna JSON。
- 禅道继续使用现有浏览器登录与采集流程，不新增绕过权限的认证方式。
- 插件 MCP 不写入用户全局配置，不依赖开发者本机路径。
- 已通过旧脚本注册的全局 `t-browser-mcp` 可能与插件实例重复；文档必须要求旧用户删除旧全局项后再验证插件版本。

## 安装与兼容

正式用户只安装或更新 `t-erp-page`。`scripts/install-mcp.ps1` 不再作为正式安装步骤，只保留为源码开发时的兼容调试入口，并明确提示它会产生全局注册，不能与插件内 MCP 同时启用。

本次只保证 Cursor 插件的一体化分发。Codex 当前用户级 MCP 注册保持独立，不修改 `C:\Users\huanghe\.codex\config.toml`。

## 测试与验收

1. 配置测试验证根目录存在 `mcp.json`，插件 manifest 声明 `mcpServers`，启动参数使用 `${CURSOR_PLUGIN_ROOT}`，且不存在本机绝对路径。
2. 构建测试从干净依赖状态生成 `mcp/dist/server.mjs`。
3. 隔离启动测试把 `mcp/dist` 复制到临时目录，不引用开发目录 `mcp/node_modules`，启动 MCP 并确认能够列出全部 Torna 与禅道工具。
4. 导出测试确认 Marketplace 分发包包含 `mcp.json` 和 `mcp/dist/server.mjs`。
5. 完整 MCP 测试继续通过，工具名称、参数和输出格式不回归。
6. 本机 Cursor 通过本地插件安装验证：插件详情显示 MCP，`Settings -> Tools & MCP` 中只有一个 `t-browser-mcp`，Torna 搜索与禅道工具均可被发现。

## 不在范围内

- 不部署远程 HTTP MCP 服务。
- 不发布公共或内部 npm 包。
- 不改 Torna、Swagger、禅道的业务路由与权限规则。
- 不修改 ERP 项目代码。
- 不顺手重构 MCP 业务模块或其他插件能力。
