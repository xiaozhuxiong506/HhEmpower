# 发现命令示例（Tsb ERP 通用）

> 新增路由/页面后，跑这些命令确认 grep 能扫到（registry-updater agent 用）。

## 1. 路由可扫描

```bash
# ts 项目
rg "name: \"TsXxx\"" src/router/modules/
# th 项目
rg "name: \"ThXxx\"" src/router/modules/
```

## 2. defineOptions 可扫描

```bash
rg "defineOptions.*${Views大写}Xxx" src/views/
```

## 3. OP_HEADERS 可扫描

```bash
# ts 形态（按页名）
rg "${views前缀}Xxx" src/utils/operationLog.ts
# th 形态（PAGE 注释含页名）
rg "${views前缀}Xxx" src/utils/operationLog.ts  # 应命中注释
```

## 4. 五处一致性自检

```bash
name="${views前缀}Xxx"     # 小写
NAME="${Views大写}Xxx"      # PascalCase
echo "path / $name / defineOptions $NAME / OP_HEADERS $name / sysRoleFiledCode $NAME"
rg "$name|/$name" src/router/modules/ src/utils/operationLog.ts
rg "$NAME" src/views/{模块}/$name/index.vue
```

## 5. 兄弟页影响扫描

```bash
# 改某功能后查同模块是否需同步
rg "改动字段|改动函数" src/views/{模块}/
```

> 命令中 `${views前缀}` = ts 或 th，`${Views大写}` = Ts 或 Th，按 profiles 探测结果替换。
