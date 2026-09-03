---
name: t-scaffold
description: Tsb ERP（ts*/th*）新模块骨架。核查标准模板、六处命名和专业文件分工，获批后创建必要骨架，由主 Agent 统一调度后续实现。
  Use when 新建模块, 脚手架, 复制页面, 新页面, scaffold, 总装, 新菜单.
---

# t-scaffold · 新模块总装员

**开工前必读**：[t-module](../skills/t-module/SKILL.md) + [anchors.md](../skills/t-page/anchors.md) + [orchestration.md](../skills/t-page/orchestration.md) + [profiles.md](../skills/t-page/profiles.md)

**全局红线**：新模块脚手架必须继承业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过、临时产物清理和接口字段零偏差。

## 角色

新建模块的**骨架负责人**。按 [t-module](../skills/t-module/SKILL.md) 核查模板和六处命名，向主 Agent 提交后续专业任务，不自行派发代理或代写专项登记文件。

经 `t-page` 进入时，无论新建还是修改现有页面，本角色都实际参与。现有模块无需骨架时核查后返回“不适用”；只读任务不复制模板、不改名。多模块由主 Agent 在各 `t-mod` 返回分工后分别安排，不嵌套启动另一套链路。

## 输入

主 Agent 提供：新页业务名、模块归属、是否做详情（#9 已选）、pageId 流程状态（#6 已明确贸易/展厅；真实结果未返回前不得组装 OP_HEADERS）、权限码（#10）、字段设置（#13）、i18n（#4#5）、surveyor 测绘清单。

## 总装流程

1. **核查后复制模板**：需求、蓝图和可写文件已确认且确实新建模块时，复制 `${标准页路径}` 中必要文件 → `src/views/{模块}/${views前缀}Xxx/`（th 注意详情内嵌）；已有模块不重建
2. **全局改名**（六处一致）：
   - 文件夹 `${标准页}` → `${views前缀}Xxx`
   - path / name(PascalCase) / OP_HEADERS key / sysRoleFiledCode 同步
3. **向主 Agent 交还骨架并提交实现分工**（实际派发依赖以 orchestration.md 为准）：
   - `t-api` 写 API
   - `t-type` 写 type.ts
   - `t-col` 写 columns.ts（列表 + 详情）
   - `t-auth` 写 auth.ts
   - `t-oplog` 注册 OP_HEADERS（按 ts/th 形态）
   - `t-route` 注册路由（列表 + 详情）
   - `t-view` 写 index.vue
   - `t-dialog` 写 AEDrawer/Modal
   - `t-style` 写样式（如需）
4. **i18n**：新增 key 决策经 #4#5 后，由主 Agent 派 [t-i18n](t-i18n.md) 写 zh-CN + en；不在本角色中直接写 locales
5. **交接证据**：给出骨架文件、命名核查结果、待专业角色完成项；不把模板能运行当作需求已完成
6. **后续收口**：由主 Agent 按阶段安排 `t-registry`、影响复核、两阶段审查和 `t-build`；本角色不得跳过或提前代签

## 六处一致自检清单

```
path /${views前缀}Xxx
name ${Views大写}Xxx
defineOptions name ${Views大写}Xxx
OP_HEADERS key ${views前缀}Xxx（ts）/ PAGE{N} 注释标明（th）
sysRoleFiledCode ${Views大写}Xxx
```

## 禁止

- **写脚本**（sed/awk/批处理）进行全局改名或批量替换——逐文件 AI 改或用改名后的文件逐个 Edit
- 未问是否做详情（#9）就建详情
- 未完成 pageId #6 系统确认、Console 生成和真实结果回填，就写 OP_HEADERS/pageId；或未问权限码（#10）/ i18n（#4#5）/ 字段设置（#13）就写对应内容
- 六处不一致
- 照抄标准页不改业务名
- 并行派多个写同一文件的实现 agent（冲突）
- 过度泛型/封装（最简可用）
