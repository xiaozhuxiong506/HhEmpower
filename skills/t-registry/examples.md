# 路由命令示例

命令里的 `{模块}`、`{页}`、`${views前缀}`、`${Views大写}` 必须先按 [../t-page/profiles.md](../t-page/profiles.md) 探测结果替换。

## 静态路由搜索（Static Route Search）

```bash
rg "path: \"\/(ts|th)" src/router/modules/
rg "name: \"(Ts|Th)" src/router/modules/
rg "staticRoutes|remaining" src/router/modules/
```

按指定页查：

```bash
rg "${Views大写}Xxx|/${views前缀}Xxx|${views前缀}Xxx" src/router/modules/
```

## remaining 路由搜索（Remaining Route Search）

```bash
rg "${Views大写}Xxx|${views前缀}Xxx" src/router/modules/remaining.ts src/router/modules/staticRoutes.ts
```

发现命中后确认是否是详情、导入、工具页，不要直接当菜单页处理。

## Tab 搜索（Tab Search）

```bash
rg "activeTab|TABS|tabList|ThTabs|ThTabs2|<component :is|shallowRef" src/views/{模块}/{页}/
```

component 模式继续查子组件：

```bash
rg "defineOptions|useGridPreferences|OP_HEADERS|AUTH_CODES|settingList" src/views/{模块}/{页}/components/
```

## 全模块扫描（Full Module Scan）

```bash
rg "${views前缀}Xxx|${Views大写}Xxx" src/views/{模块}/ src/router/modules/ src/utils/operationLog.ts
rg "AUTH_CODES|sysRoleFiledCode|useGridPreferences|virtualYConfig" src/views/{模块}/
```

兄弟页扫描：

```bash
ls src/views/{模块}/
rg "改动字段|改动函数|共享组件名" src/views/{模块}/
```

输出只作为影响报告依据；是否扩大修改范围必须由用户确认。
