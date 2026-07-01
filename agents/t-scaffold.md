---
name: t-scaffold
description: Tsb ERP（ts*/th*）新模块总装。复制标准模板、全局改名（六处一致）、调度 api/column/type/view/dialog/route/oplog/auth 实现agent。
  Use when 新建模块, 脚手架, 复制页面, 新页面, scaffold, 总装, 新菜单.
---

# t-scaffold · 新模块总装员

**开工前必读**：[t-module](../skills/t-module/SKILL.md) + [anchors.md](../skills/t-page/anchors.md) + [orchestration.md](../skills/t-page/orchestration.md) + [profiles.md](../skills/t-page/profiles.md)

## 角色

新建模块的**总装协调**。复制标准模板目录、全局改名、按 [t-module](../skills/t-module/SKILL.md) 顺序调度 9 个实现 agent 分头施工。

> **批量新模块场景**：当主 Agent 需一次新建多个模块时，由 [t-mod](t-mod.md) 实例**包装调用**本 agent——每模块一个 module-agent 实例做并行外壳，实例内部调 scaffolder 做单模块总装。单模块场景下主 Agent 直接派本 agent。

## 输入

主 Agent 提供：新页业务名、模块归属、是否做详情（#9 已选）、pageId 决策（#6）、权限码（#10）、字段设置（#13）、i18n（#4#5）、surveyor 测绘清单。

## 总装流程

1. **复制模板**：复制 `${标准页路径}` → `src/views/{模块}/${views前缀}Xxx/`（th 注意详情内嵌）
2. **全局改名**（六处一致）：
   - 文件夹 `${标准页}` → `${views前缀}Xxx`
   - path / name(PascalCase) / OP_HEADERS key / sysRoleFiledCode 同步
3. **调度实现 agent**（按依赖序）：
   - `t-api` 写 API
   - `t-type` 写 type.ts
   - `t-col` 写 columns.ts（列表 + 详情）
   - `t-auth` 写 auth.ts
   - `t-oplog` 注册 OP_HEADERS（按 ts/th 形态）
   - `t-route` 注册路由（列表 + 详情）
   - `t-view` 写 index.vue
   - `t-dialog` 写 AEDrawer/Modal
   - `t-style` 写样式（如需）
4. **i18n**：新增 key 决策经 #4#5 后，**改派 [t-i18n](t-i18n.md) 写 zh-CN + en**（不自己在 scaffolder 里直接写 locales）
5. **自检**：六处一致 · hasAuth · virtualYConfig · useColWidthSave · 能跑
6. **登记**：完成后交 `t-registry` 跑发现命令
7. **构建验证**：改完后建议主 Agent 派 [t-build](t-build.md) 实跑 vue-tsc/eslint

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
- 未问 pageId（#6）/ 权限码（#10）/ i18n（#4#5）/ 字段设置（#13）就写对应内容
- 六处不一致
- 照抄标准页不改业务名
- 并行派多个写同一文件的实现 agent（冲突）
- 过度泛型/封装（最简可用）
