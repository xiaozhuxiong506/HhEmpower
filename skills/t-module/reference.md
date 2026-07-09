# 新模块自检

> 项目特定值必须来自 [../t-page/profiles.md](../t-page/profiles.md) 和当前项目源码证据。不要在确认画像前套用其他项目路径。

## 命名替换

- 主单目录：`${标准页}` -> `${views前缀}Xxx`。
- 主单路由：`/${标准页}` -> `/${views前缀}Xxx`。
- 主单路由名与组件名：`${标准页大写}` -> `${Views大写}Xxx`。
- 主单 `OP_HEADERS` key：`${标准页}` -> `${views前缀}Xxx`；`th` 项目如果使用 `PAGE{N}`，按现有注释和 [t-oplog](../t-oplog/SKILL.md) 规则确认。
- 独立详情目录：`${标准页}Detail` -> `${views前缀}XxxDetail`；`th` 内嵌详情通常是 `components/Detail.vue`，以画像和兄弟文件为准。
- 详情路由、详情 `OP_HEADERS`、详情 `sysRoleFiledCode` 只在详情形态确认后替换。
- 自检六处一致：`path`、`name`、`defineOptions.name`、`OP_HEADERS` key、`sysRoleFiledCode`、`columns.field` 与 `type` 字段。

## 文件清单

- 主单目录包含 `index.vue`、`columns.ts` 或项目约定的 `*Columns.ts`、`auth.ts`、`type.ts`、`components/`。
- 独立详情只在确认需要时创建独立目录；内嵌详情只改所在主单的 `components/Detail.vue` 或项目已有同类组件。
- API 文件使用当前项目的 `${api目录}/${api文件}`，不要新建临近但不符合画像的 API 文件。
- 主单路由进入当前模块路由文件；独立详情进入 `staticRoutes.ts`；内嵌详情不新增独立路由。
- 组件、路由、菜单、静态页登记和检测范围统一交给 [t-registry](../t-registry/SKILL.md) 复核。

## API 清单

- 请求写法沿用标准页，例如 `http.request<Result>("post", url, { data }, headers)`；不要把现有 POST 改成其他方式。
- 函数名按标准页成组替换，如分页、列偏好、更新配置、增删改查保持同一业务前缀。
- headers、`baseURL`、`prefix`、controller 和 action 来自现有 API 文件或接口文档；缺失时先澄清。
- 主单 API 与详情 API 分开检查，详情 API 只有详情形态确认后才新增或替换。
- 写操作需要操作日志时转交 [t-oplog](../t-oplog/SKILL.md)，不要在模块技能里直接猜 headers。

## 权限与 i18n 清单

- 新增 `AUTH_CODES` 前先确认权限码；详情默认复用主单 `auth.ts`，除非当前项目证据显示详情有独立权限文件。
- 所有按钮显隐、`hasAuth` 和工具栏操作使用当前项目已有模式，不引入另一套权限结构。
- 新增 locale key 前先确认 i18n namespace；常见命名空间包括 `menus.`、`l.`、`g.`、`label.`、`buttons.`，`th` 项目还可能有 `cm`、`tg`、`psv` 等。
- 参考其他模块的 `t('key')` 前必须查 locales，不能只复制调用点。
- 已有翻译不因新模块顺手改写；只追加本次需要的 key。

## 操作日志清单

- 新页面、新接口或新增写操作涉及日志时，先通过 [t-oplog](../t-oplog/SKILL.md) 确认 `pageId` 和 `OP_HEADERS`。
- 主单和独立详情是否各有一组 `OP_HEADERS`，以 `t-oplog` 和项目现有形态为准。
- `th` 项目的 `PAGE{N}` 形态、注释格式和 page 映射不可猜测。
- 弹窗、抽屉、详情里的保存或确认操作需要日志时，只做调用方接线，日志规则仍归 [t-oplog](../t-oplog/SKILL.md)。

## 登记清单

- 主单菜单路由、独立详情静态路由、内嵌详情免路由三种形态必须区分。
- 新路由的 `path`、`name`、`meta.pagePath`、`showLink`、`keepAlive` 按兄弟文件和 [t-registry](../t-registry/SKILL.md) 规则复核。
- 不直接手写登记检测范围，不跳过 [t-registry](../t-registry/SKILL.md)。
- 提交前检查主单、详情、弹窗、字段设置、操作日志是否分别落在对应技能责任边界内。
