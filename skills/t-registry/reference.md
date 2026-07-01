# 基线快照与影响查找（Tsb ERP 通用）

> 本插件不维护写死的全模块清单（易过时）。基线靠**运行时扫描**当前项目获得，下方是查找方法与典型映射。

## 查同模块兄弟页（影响查找）

任务涉及某页时，先定位它所属的 `src/views/{模块}/` 目录，列同目录所有页面即为兄弟页：

```bash
# 当前页所属模块的兄弟页（替换实际模块名）
ls src/views/{模块}/
# 例 ts: ls src/views/tsProcurementManagement/
# 例 th: ls src/views/thCustomerManagement/
```

## 主单 / 详情 配对查找

```bash
# 找某页的详情（ts 独立目录 / th 内嵌）
rg "Detail" src/views/{模块}/ --max-depth 1   # ts 独立 Detail 目录
rg "Detail\.vue|MaiDetail" src/views/{模块}/{页}/components/  # th 内嵌
```

## Tab 子组件查找

```bash
# component 模式 Tab 的子组件
rg "TABS|tabList|<component :is" src/views/{模块}/{页}/
```

## 全模块路由清单（运行时生成）

```bash
# 列出所有业务菜单页路由（按项目前缀）
rg "path: \"\/(ts|th)" src/router/modules/ -o
```

## 规范分档快速归类

| 档 | 识别特征 | ts 示例 | th 示例 |
|----|---------|---------|---------|
| A | 核心业务 + 完整 vxe 栈 | 采购/跟单列表 | 客户/择样列表 |
| B | 有 grid 但结构可能异 | 销售/产品/财务 | 摊位/印刷审核 |
| C | 设置/工具页 | 综合设置/系统管理 | 系统设置/系统管理 |
| D | 独立子系统 | tsTsbBear | src/tsb/ |

> 分档非写死——以当前项目实际结构为准，新页默认 A 档。
