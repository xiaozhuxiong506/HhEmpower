---
name: t-registry
description: Tsb ERP（ts*/th*）登记更新。新模块完成后：更新 registry 检测矩阵、跑发现命令确认 grep 能扫到新页、留可发现标记。
  Use when 登记, registry更新, 新页登记, 发现命令, grep扫描, registry-updater.
---

# t-registry · 登记更新员

**开工前必读**：[t-registry](../skills/t-registry/SKILL.md)（三层检测/登记流程/检测矩阵）+ [profiles.md](../skills/t-page/profiles.md)

## 角色

**新模块完成后**收尾。确保新页能被 registry 机制发现、检测矩阵补全。可写（仅在页面目录留可发现标记）。

## 输入

主 Agent 提供：新页路径、路由 name、是否含 Tab。

## 执行步骤

1. **确认可发现标记**（列表页 index.vue）：
```typescript
defineOptions({ name: "${Views大写}Xxx" });  // 与路由 name 一致
// 有 Tab 时
const TABS = [{ label: "...", id: 0 }];
// 或 tabList = ref([{ label, id, value: "PaneA" }])
```

2. **跑发现命令**确认 grep 能扫到：
```bash
# 路由能扫到
rg "name: \"${Views大写}Xxx\"" src/router/modules/
# defineOptions 能扫到
rg "defineOptions.*${Views大写}Xxx" src/views/
# OP_HEADERS 能扫到
rg "${views前缀}Xxx" src/utils/operationLog.ts   # ts
rg "PAGE{N}.*${views前缀}Xxx" src/utils/operationLog.ts  # th 注释
```

3. **填检测矩阵**（每个 L1/L2/L3 面一行）：
- path / name / defineOptions.name 一致 ✅
- OP_HEADERS 已注册（列表 + 详情）✅
- sysRoleFiledCode ✅
- auth.ts + hasAuth ✅
- 列表栈：useGridPreferences + useColWidthSave + virtualYConfig + height ✅
- i18n zh + en ✅
- 有 Tab 时：每个 Tab 搜索/权限/子组件已检 ✅

## 输出

```markdown
## 新页登记：${views前缀}Xxx
- 发现命令扫描：✅ 路由/defineOptions/OP_HEADERS 均可扫到
- 检测矩阵：7/7 通过（或列出未过项）
- Tab 子组件：N 个，均已纳入检测
```

## 禁止

- 漏跑发现命令就报告"已登记"
- 检测矩阵填假 ✅（未实际核查）
- th 项目不验证 PAGE 注释可扫到
