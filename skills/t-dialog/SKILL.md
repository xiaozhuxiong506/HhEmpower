---
name: t-dialog
description: >-
  Tsb ERP（ts*/th*）弹窗/抽屉：AEDrawer、AEDialog、XxxModal，新增字段必问字段设置。
  Use when 弹窗, Drawer, Dialog, Modal, 抽屉, 新增, 编辑, el-dialog, el-drawer.
---

# 弹窗 / Drawer（Tsb ERP 通用）

标准页（按当前项目探测，见 [profiles.md](../t-page/profiles.md)）→ [anchors.md](../t-page/anchors.md#标准源码)

- Drawer 模板：当前项目标准页的 `components/AEDrawer.vue`
- Dialog 模板：当前项目复杂参考页的 `components/AEDialog.vue`
- 详情弹窗：标准页详情的 `components/*Modal.vue`

编码规范 → [t-standards](../t-standards/SKILL.md)

## 组件命名

- 增删改 → `AEDrawer.vue` / `AEDialog.vue`
- 业务弹窗 → `XxxModal.vue`（PascalCase）
- 业务 Drawer → `XxxDrawer.vue`

## 选型

- 复杂表单 → `el-drawer` + Drawer Header
- 选择/简单表单 → `el-dialog` + modalOptions
- 动态内容 → Drawer + `markRaw(Component)`

Drawer / Dialog 均可且用户未指定时 → **AskQuestion**（总表 #11），选定前不新建组件。格式 → [t-workflow/reference.md](../t-workflow/reference.md#必问单选题总表)

## 字段设置（新增表单项必问）

弹窗/抽屉**新增字段** → **AskQuestion**（总表 #13，可多选 A~G），选定后再写 `setField`。

标配写法（编辑可见 + 可编辑）：

```vue
<el-col v-if="utils.setField(props.settingList, 'fieldName', 4)" :span="12">
  <el-input :disabled="utils.setField(props.settingList, 'fieldName', 2)" />
</el-col>
```

父页 `:settingList="settingList"`（来自 `useGridPreferences`）。细则 → [t-field](../t-field/SKILL.md)

## Tab / 弹窗保存（只读态）

弹窗 footer 的确认/保存须与当前流程一致：只读/预览 → 隐藏或禁用；可编辑 → 接 `*SaveHidden` / `editable` → [t-tab](../t-tab/SKILL.md)

## 固定模式

```typescript
defineExpose({ open });
emit("refreshTable");
destroyOnClose: true;
closeOnClickModal: false;
// 内嵌 grid 必配 virtualYConfig + 固定 height
```

表单内 `el-select` 遇 null 显示异常 → `:empty-values="[null, undefined]"`（见 t-standards）

## 父页

```vue
<AEDrawer ref="AEDrawerRef" @refreshTable="refreshTable" />
```

重型组件懒加载：`v-if="lazyMounted.Xxx"`

## 弹窗内 grid 列宽（新需求）

业务列 < 7 → 不设 width；>= 7 → 按 t-standards 通用值。
禁止 `minWidth`。详见 [t-standards/reference.md](../t-standards/reference.md#列宽与-minwidth)

## 禁止

- 父页 inline 大表单
- 提交后不 refreshTable
- 写操作不传 OP_HEADERS → 见 [t-oplog](../t-oplog/SKILL.md)
- 参考他模块照抄 `t('key')` 不查 locales，提示指错模块
- 弹窗内 grid 不配 virtualYConfig / height
- 新需求弹窗 grid 不足 7 业务列却写 width / minWidth

关联：[t-list](../t-list/SKILL.md) · [t-detail](../t-detail/SKILL.md) · [t-oplog](../t-oplog/SKILL.md)
