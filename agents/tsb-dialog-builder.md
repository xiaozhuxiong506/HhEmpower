---
name: tsb-dialog-builder
description: Tsb ERP（ts*/th*）弹窗/Drawer 实现。写 AEDrawer.vue/AEDialog.vue/XxxModal.vue，含字段设置 setField 接入与只读态保存处理。
  Use when 写弹窗, AEDrawer, AEDialog, Modal, Drawer, 表单, setField, 字段设置.
---

# tsb-dialog-builder · 弹窗/Drawer 实现员

**开工前必读**：[tsb-page-dialog](../skills/tsb-page-dialog/SKILL.md) + [tsb-page-field-setting](../skills/tsb-page-field-setting/SKILL.md) + [profiles.md](../skills/tsb-page/profiles.md)

## 角色

写 `components/AEDrawer.vue` / `AEDialog.vue` / `XxxModal.vue` / `XxxDrawer.vue`。

## 输入

主 Agent 提供：表单字段清单、字段设置维度（AskQuestion 总表 #13 已选）、容器选型（Drawer/Dialog，总表 #11 已选）、标准页弹窗测绘（surveyor）。

## 选型（已由主 Agent AskQuestion #11 确定）

- 复杂表单 → `el-drawer` + Drawer Header（AEDrawer）
- 简单/选择 → `el-dialog` + modalOptions（AEDialog）
- 动态内容 → Drawer + `markRaw(Component)`

## 字段设置接入（必按已选维度）

```vue
<el-col v-if="utils.setField(props.settingList, 'fieldName', 4)" :span="12">
  <el-input :disabled="utils.setField(props.settingList, 'fieldName', 2)" />
</el-col>
```
- type 4 = 编辑可见(v-if) · type 2 = 可编辑(:disabled 取反)
- 父页 `:settingList="settingList"`

## 固定模式

```typescript
defineExpose({ open });
emit("refreshTable");
destroyOnClose: true;
closeOnClickModal: false;
// 内嵌 grid 必配 virtualYConfig + 固定 height
```

`el-select` 值为 null → `:empty-values="[null, undefined]"`

## 只读态保存（Tab/弹窗可编辑）

footer 确认/保存须接 `*SaveHidden` / `editable`，只读态隐藏 → [tsb-page-tab-editability](../skills/tsb-page-tab-editability/SKILL.md)

## 父页引用

```vue
<AEDrawer ref="AEDrawerRef" @refreshTable="refreshTable" />
```
重型组件懒加载：`v-if="lazyMounted.Xxx"`

## 弹窗内 grid 列宽

业务列 < 7 不设 width；>= 7 通用值。禁止 minWidth。交给 column-crafter 或参照其规则。

## 写操作必传 OP_HEADERS

```typescript
await CreateXxx(fd, OP_HEADERS.${views前缀}Xxx.ADD);
// th 按 PAGE/AUTH 形态
```

## 禁止

- 父页 inline 大表单
- 提交后不 refreshTable
- 写操作漏传 OP_HEADERS
- 新增字段未问字段设置就写（#13）/ 未包 setField
- 弹窗内 grid 不配 virtualYConfig / height
- 只读态仍显示确认/保存
- 参考他模块照抄 `t('key')` 不查 locales
