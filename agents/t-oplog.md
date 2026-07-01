---
name: t-oplog
description: Tsb ERP（ts*/th*）OP_HEADERS 注册实现。ts/th 形态不同：列写 operationLog.ts 操作日志，pageId 必问，列表+详情各一组。
  Use when 注册OP_HEADERS, operationLog, 操作日志, pageId, SEARCH, ADD, EDIT, oplog.
---

# t-oplog · OP_HEADERS 注册实现员

**开工前必读**：[t-oplog](../skills/t-oplog/SKILL.md) + [profiles.md](../skills/t-page/profiles.md)（OP形态列，**ts/th 不同**）

## 角色

在 `src/utils/operationLog.ts` 注册新页 OP_HEADERS。只动该文件。

## 输入

主 Agent 提供：页面中文名、pageId 决策（AskQuestion 总表 #6 已选 A 已提供 / B 后续占位）、操作清单（SEARCH/ADD/EDIT/DEL/BDEL/EXPORT/PRINT + 业务专用）。

## ⚠ 按当前项目形态注册（必看 profiles）

**ts 形态**（key = 页面文件夹名）：
```typescript
${views前缀}Xxx: {
  SEARCH: { headers: { pageTitle: "新页名", useTitle: "查询", pageId: <数字或"需要后台配置！"> } },
  ADD:    { headers: { pageTitle: "新页名", useTitle: "新增", pageId: ... } },
  EDIT:   { headers: { pageTitle: "新页名", useTitle: "编辑", pageId: ... } },
  DEL:    { headers: { pageTitle: "新页名", useTitle: "删除", pageId: ... } }
  // BDEL · EXPORT · PRINT · 业务专用...
}
// 详情另注册一组 ${views前缀}XxxDetail
```

**th 形态**（key = PAGE{N}，N 取现有最大值 +1）：
```typescript
/* 新页名（${views前缀}Xxx）*/
PAGE{新N}: {
  AUTH1: { headers: { pageTitle: "新页名", useTitle: "查询", pageId: ... } },
  AUTH2: { headers: { pageTitle: "新页名", useTitle: "新增", pageId: ... } },
  AUTH3: { headers: { pageTitle: "新页名", useTitle: "编辑", pageId: ... } },
  AUTH4: { headers: { pageTitle: "新页名", useTitle: "删除", pageId: ... } }
}
// 详情另注册一组 PAGE{再+1}，注释标明详情
```

## pageId 规则（已由主 Agent AskQuestion #6 确定）

- **A 已提供** → 写给定数字
- **B 后续** → 统一写 `"需要后台配置！"`（字符串占位）

## 必备操作项

- `SEARCH`（关键字查询条件传）
- `ADD` / `EDIT` / `DEL`（写操作必传）
- 有批量删 → `BDEL`
- 有 ThToolbar 打印导出 → `EXPORT` + `PRINT`

## 禁止

- **未问 pageId 就写**（#6）/ 自造数字 / 写 0 占位
- ts 形态 key 与文件夹名不一致
- th 形态不加页名注释（无法维护）
- 漏注册详情一组（独立详情场景）
- pageId 选 B 却写数字
