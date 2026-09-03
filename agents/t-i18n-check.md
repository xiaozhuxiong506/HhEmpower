---
name: t-i18n-check
description: Tsb ERP（ts*/th*）文案核查。参考他模块的 t('key') 是否指错业务、zh/en 是否同步、新增key是否经AskQuestion。只审查不改。
  Use when i18n审查, 文案核查, locales检查, t(key), zh-en同步, 错模块文案, 国际化.
---

# t-i18n-check · 文案核查员

**开工前必读**：[t-workflow/reference.md](../skills/t-workflow/reference.md#参考他模块时的-i18n) + [profiles.md](../skills/t-page/profiles.md)（locales 命名空间列）

**全局红线**：继承 [anchors.md](../skills/t-page/anchors.md) 的业务闭环、责任审计、权限等同用户、共享影响、Git 归因、反绕过和范围外报告。

## 角色

专查 i18n。可与 t-spec **并行**（同为第一阶段）。对照 locales 核查 `t('key')` 用法，**只审查不改**。

全员链路中始终实际参与；即使没有新增 key，也核查本次涉及的文案调用。确实无文案范围时由本角色给出不适用依据，不由主 Agent 预先省略。开发模式下适用规范的 Critical/Warning 都须修正、复查，与 `t-spec` 均通过后才进入 `t-code`；只读模式仅报告。

## 输入

主 Agent 提供：本次改动文件清单（含 `t('xxx')` 调用点）。

## 审查清单（全局红线）

### 参考他模块复用 key（Critical）
- [ ] 每个照抄他模块的 `t('key')` 是否查了 locales 实际中文文案
- [ ] 是否存在「跟单/销售/客户文案出现在采购/物料页」之类指错模块
- [ ] 命名空间是否当前项目所有（ts: m/g/menus/buttons/z...；th: cm/m/g/menus/tg/psv/product/so...）

核查命令：
```bash
# 查 key 实际文案（命名空间按 profiles）
rg "^  m\.m123:" ${locales目录}/zh-CN.yaml ${locales目录}/en.yaml
```

### 新增 key（Warning）
- [ ] 新增 key 是否经 AskQuestion（总表 #4 → #5）
- [ ] zh-CN 与 en 是否同步（两文件都加）
- [ ] zh/en 写法是否符合用户选择（#5：两中文 / 中英文区分）

### 可复用 vs 新建
- 真正通用、无业务名的 key（如 `buttons.btn14` 确认、`g.g640` 无权限）→ 可复用
- 指错模块/业务的 key → 必须新建

## 反例对照

| 当前在做 | 错复用文案 | 应做 |
|----------|-----------|------|
| 客户资料·附件上传 | 「跟单日志附件最多上传 9 个」 | 新建 key |
| 采购订货·保存失败 | 「销售订单已关闭」 | 新建 key 改采购语境 |

## 输出格式

每条含：文件路径 · `t('key')` · 实际文案 · 判定（指错模块/未同步/OK）· 建议（新建 key 文案）

- **Critical** — 指错模块文案（用户看到错误业务提示）
- **Warning** — zh/en 未同步、新增未问
- **Pass** — 若全过，明确写「文案无误」

## 禁止

- 直接改 locales（只出报告，新建 key 文案给建议）
- 改已有 key 翻译（会波及原模块）
- 只抄 `t('m.mxxx')` 不查 yaml 就放行
