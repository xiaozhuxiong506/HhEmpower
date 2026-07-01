# 新模块补充（Tsb ERP 通用）

> 项目特定值（标准页/前缀/路由文件/API文件）→ 先读 [../t-page/profiles.md](../t-page/profiles.md)。

## 对照源码

1. 复制当前项目 `${标准页路径}` → `${views前缀}YourFeature/`
2. 全局替换标准页的业务名 / 大写名 / 目录名
3. 改 API、OP_HEADERS（列表 + 详情）、路由、i18n
4. 有详情则复制详情模板（ts→`${标准页}Detail`；th→内嵌 Detail.vue），同步注册详情 OP_HEADERS

路由文件（按项目）：
- ts：`src/router/modules/ts{模块}Management.ts`
- th：`src/router/modules/th{模块}.ts`

详情路由 `src/router/modules/staticRoutes.ts`（独立详情；th 内嵌免）
API 文件：当前项目 `${api目录}/${api文件}`（如 ts `procerement.ts`；th `hall*.ts`）

自检：
- 六处名的样式一致（非字符串相等）：
  - path: `/${views前缀}Xxx`（全小写+驼峰）
  - name / defineOptions.name / sysRoleFiledCode: `${Views大写}Xxx`（PascalCase）
  - OP_HEADERS key: `${views前缀}Xxx`（全小写）—— ts 按页名；th 按 PAGE{N} 注释标明
- 有详情时 OP_HEADERS 再注册详情一组
- 有 Tab 时按 t-registry 判断 filter/component 模式并检子组件
- 详情 auth 从列表 import，不单独建 auth.ts
- auth + hasAuth
- i18n 新增 key → AskQuestion 总表 #4 → #5
- pageId → AskQuestion 总表 #6
- 新模块是否做详情 → AskQuestion 总表 #9
- 权限码 → AskQuestion 总表 #10
- 新增表单/列字段 → AskQuestion 总表 #13 → [t-field](../t-field/SKILL.md)
- virtualYConfig + grid height + useColWidthSave
- 列宽：禁止 minWidth；主单 < 9 业务列不设 width；弹窗 < 7 不设 width
- 主单/详情解耦：主单不引用详情；columns/auth/type 单一职责
- 照抄标准页写法，禁止过度泛型与过度封装
- 结构像当前项目标准页
