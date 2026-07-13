# 钉钉聊天只读接入设计

## 目标

`t-erp-page` 安装后直接提供钉钉聊天记录读取能力。插件使用钉钉官方 `dingtalk-workspace-cli`（DWS）完成 OAuth、权限校验和消息查询，使用者不需要下载 `HhEmpower` 源码，也不需要手工配置独立 MCP。

本次只实现当前登录用户权限范围内的只读查询：登录状态、OAuth 登录、群聊检索、关键词消息检索、指定会话消息和时间范围内全部消息。发送、回复、撤回、转发、群管理及其他写操作不进入本次范围。

## 运行结构

现有 `t-browser-mcp` 继续作为唯一 MCP 入口。构建时从官方 DWS npm 包精准提取 Windows、macOS、Linux 的 x64/arm64 二进制与许可证到 `mcp/dist/vendor/dws/`，不执行会写入用户级 Skills 的官方安装脚本。插件运行时从自身目录定位 DWS，不依赖 `CURSOR_PLUGIN_ROOT` 之外的开发者路径，也不要求目标电脑预装全局 `dws`。

```text
t-erp-page/
├── mcp.json
├── mcp/dist/server.mjs
├── mcp/dist/vendor/dws/<platform>-<arch>/dws[.exe]
├── skills/t-dingtalk/SKILL.md
└── commands/t-dingtalk-read.md
```

MCP 通过固定参数映射调用 DWS，不接收原始命令行字符串，防止调用者借只读工具执行未授权的 DWS 子命令。DWS 凭证由官方 OAuth 流程保存在用户目录，插件不保存钉钉密码、Cookie、Access Token 或聊天记录副本。

## MCP 工具

| 工具 | 功能 | 权限性质 |
|---|---|---|
| `dingtalk_auth_status` | 检查 DWS 版本和当前登录状态 | 只读 |
| `dingtalk_auth_login` | 启动官方浏览器 OAuth 登录 | 仅建立本机授权 |
| `dingtalk_search_groups` | 按群名关键词查找群聊 | 只读 |
| `dingtalk_search_messages` | 按关键词、时间范围和可选群 ID 搜索消息 | 只读 |
| `dingtalk_list_messages` | 读取指定群聊或单聊的历史消息 | 只读 |
| `dingtalk_list_all_messages` | 按时间范围读取当前用户全部可访问会话 | 只读 |

工具参数严格映射 DWS 官方字段。群聊、`userId`、`openDingTalkId` 三种会话定位只能选择一个；时间格式、分页数量和游标在调用前校验。多群命中时只返回候选，禁止自行选择。

## 输出

每次查询输出：

1. 查询条件和权限范围摘要；
2. 整洁 Markdown 表格，优先展示时间、发送人、会话、消息内容和消息 ID；
3. `hasMore` 与分页信息：搜索/全部会话返回 `nextCursor`，指定会话返回下一页边界 `time`；
4. 必要时附结构化 JSON，保证字段不因表格裁剪而丢失。

消息内容只在本次 MCP 响应中返回，不写入项目目录、插件目录或临时 JSON。输出不展示 OAuth 凭证及内部鉴权头。

## Skill 与命令

新增 `t-dingtalk` Skill，负责把“钉钉、群聊、聊天记录、消息搜索、@我、项目群”等意图路由到上述 MCP。新增 `/t-dingtalk-read` 命令，提供登录、查群、查消息的统一入口。

硬边界：

- 默认只读；用户要求写操作时明确说明本插件未开放，不能用通用命令绕过。
- 未登录时只允许查询状态或启动官方 OAuth。
- 只能读取当前授权用户有权访问的会话，不能读取其他员工私人聊天。
- 查询范围模糊、多群命中或时间范围缺失时先询问用户。
- 不把聊天记录自动写入代码、文档、日志或长期记忆。

## 测试与验收

1. 单元测试用伪 DWS 进程验证参数映射、互斥校验、错误处理、分页和 Markdown 输出。
2. MCP smoke test确认六个钉钉工具可被发现。
3. 分发测试确认导出插件包含 DWS 包、启动入口和多平台资源，不依赖仓库 `node_modules`。
4. 使用插件内 DWS 执行 `--version`、`auth status` 和 `--mock` 查询，验证运行链路。
5. 尝试官方 OAuth 登录；若企业管理员尚未授权，准确报告钉钉返回的阻塞原因，不伪称聊天读取成功。
6. 运行完整 MCP 测试、Skill 校验、`git diff --check` 和敏感信息扫描。

## 不在范围内

- 不修改 ERP 项目代码。
- 不实现钉钉消息发送、撤回、回复、转发或群成员管理。
- 不通过桌面自动化、Cookie 抓取或密码登录绕过 DWS OAuth。
- 不顺手重构 Torna、禅道或现有 MCP 模块。
