<div align="center">
  <img src="assets/logo.png" alt="TSB ERP" width="96">
  <h1>TSB ERP 页面开发规范插件</h1>
  <p>需求分析 · 前端拆分 · 页面实现 · 交付审查，一条可追溯链路走完。</p>
  <p><code>t-erp-page</code> · <code>Cursor Plugin</code> · <code>v2.8.0</code> · <code>MIT</code></p>
</div>

## 项目定位

面向 TSB ERP 业务页面的 Cursor 插件，把页面开发中最容易失控的环节固化为可执行规则：

- **先分析后动手** —— 从前后端混写文档中拆出前端改动点，才进入实现
- **事实优先** —— 字段、类型、值域以接口与现有代码为准，不凭命名猜测
- **最小充分实现** —— 不为小功能引入多余文件、依赖和抽象
- **交付可对账** —— 需求、代码、权限、业务闭环与验证结果构成完整记录

## 能力版图

| 能力 | 数量 | 说明 |
| --- | ---: | --- |
| Skills | 18 | 需求分析、页面开发、接口核验、权限、字段、弹窗、列表、详情、防御性编程 |
| Subagents | 22 | 侦察、实现、审查、影响分析与验证，按任务规模编排 |
| Rules | 2 | 页面开发通用指引与钉钉聊天隐私边界 |
| Commands | 5 | `/t-start` `/t-new-module` `/t-review` `/t-zentao-collect` `/t-dingtalk-read` |
| 内置 MCP | 1 | Torna 接口文档、禅道任务、钉钉聊天记录只读能力 |

## 工作流

| 阶段 | 入口 | 交付 |
| --- | --- | --- |
| 需求分析 | `t-requirement` | 从混写文档拆出前端责任、改动点与阻塞项，输出十节规范化报告 |
| 页面规划 | `t-page` · `t-workflow` | 确认项目画像、主单与详情边界、权限、字段、路由与复杂度预算 |
| 局部实现 | `t-list` · `t-detail` · `t-dialog` · `t-auth` 等 | 沿用既有结构，优先复用，只改已确认范围 |
| 审查验证 | `t-review` · `t-code` · `t-build` | 对账需求与 diff，清理纠错残留，验证闭环、契约与构建 |

需求分析只理解、不写码。用户纠正 AI 时，流程恢复到正向需求基线，不把被否决内容写进注释、命名、测试或 PR 文案。

## 工程原则

**需求范围可对账** —— diff 的每一处修改，都对应已确认需求或其直接依赖。范围外问题只记录，不扩散修改。

**复杂度匹配问题规模** —— 小改动在现有职责内完成；只有真实复用点才新增文件、依赖或抽象。存在更简单方案时，采用更简单方案。允许局部完整的适度重复，不为 DRY 强行引入状态机、策略表或转发层。

**事实优先于猜测** —— 字段与规则取自用户确认、Torna 文档、接口类型和现有模块代码，事实冲突时暂停确认。外部数据只在边界归一化一次，业务分支直接使用领域类型。

**权限与责任不可绕过** —— AI 不代做业务、权限、数据或上线批准；工具与脚本遵守当前用户权限。

**规则可被验证** —— 多条件共同决定行为时，先整理行为矩阵，再用重叠条件、未知状态与返回顺序测试固定规则。

## 双项目自适应

不写死项目路径。进入任务后读取 `package.json`、扫描 `src/views` 前缀，按[项目画像](skills/t-page/profiles.md)选择标准页、API 文件、`OP_HEADERS` 形态与 locales 命名空间。

| 项目 | 页面目录 | 标准页 | `OP_HEADERS` 形态 |
| --- | --- | --- | --- |
| TradeErp | `src/views/ts*` | `tsMaterialOrdering` | `OP_HEADERS[页名][动作]` |
| HallErp | `src/views/th*` | `thCustomerInfo` | `OP_HEADERS[PAGE{N}][AUTH{N}]` |

## 快速开始

```powershell
cd D:\company\HhEmpower
.\scripts\install-local.ps1
```

默认符号链接模式，源码改动即时生效；无符号链接权限时使用 `-Copy`。卸载：`.\scripts\install-local.ps1 -Uninstall`。

安装后三步启用：

1. 重启 Cursor
2. **Settings → Customize → Plugins** 确认 `t-erp-page` 已启用
3. 输入 `/t-start` 验证响应

内置 MCP `t-browser-mcp` 随插件自动安装，开箱即用，详见 [mcp/README.md](mcp/README.md)。

## 团队分发

| 方式 | 适用场景 | 操作 |
| --- | --- | --- |
| 本地开发机 | 个人开发调试 | Clone 后运行 `install-local.ps1` |
| Team Marketplace | 团队统一安装 | `export-github-repo.ps1` 导出后导入私有仓库 |
| ERP 主仓维护 | 规范与业务仓同步 | 从 ERP 主仓 `.cursor` 目录运行 `sync-skills.ps1` |

导出与发布详见 [PUBLISH.md](PUBLISH.md)。插件仓库只分发 Skills、Commands、Rules、Agents 与 MCP，不含 ERP 业务代码。

## 仓库结构

```text
HhEmpower/
├── .cursor-plugin/plugin.json       插件清单
├── agents/                          22 个专业 subagent
├── commands/                        5 个快捷命令
├── mcp/                             内置只读 MCP 与构建产物
├── rules/                           页面指引与隐私边界
├── scripts/                         安装、同步、导出脚本
├── skills/                          18 个专业 skill（见 skills/README.md）
├── assets/logo.png                  插件图标
├── CHANGELOG.md                     版本记录
└── PUBLISH.md                       发布说明
```

## 与 ERP 项目的关系

| 位置 | 用途 |
| --- | --- |
| ERP 项目内 `.cursor\` | 可选的项目级 Skills、Commands、Rules、Agents 源 |
| `D:\company\HhEmpower\` | 插件源码与分发仓库 |
| `rules/t-agent-guidance.mdc` | 编辑 `src/views/{ts,th}*/**` 时自动加载的全局规则 |

## 命名规范

技术标识统一使用 `t-*`；`tsb-erp` 与 `tsb-hall-user` 是 ERP 项目的探测值，不属于插件命名。

## 延伸阅读

[技能索引](skills/README.md) · [项目画像](skills/t-page/profiles.md) · [全局边界与红线](skills/t-page/anchors.md) · [多 Agent 编排](skills/t-page/orchestration.md) · [发布指南](PUBLISH.md) · [版本记录](CHANGELOG.md)

---

v2.8.0 · [MIT License](LICENSE) · [CHANGELOG](CHANGELOG.md)
