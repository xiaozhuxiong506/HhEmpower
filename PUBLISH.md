# 只推插件到 GitHub（不含 ERP 业务代码）

业务仓库继续走公司内网 Git；**仅插件**可单独建 GitHub 私有仓，给 Team Marketplace 用。

## 1. 导出插件

```powershell
cd D:\company\HhEmpower
.\scripts\export-github-repo.ps1
```

默认导出到 `D:\company\tsb-erp-page-plugin/`（不含 ERP 源码）。

自定义导出目录：

```powershell
.\scripts\export-github-repo.ps1 -ExportDir "D:\export\my-plugin"
```

## 2. 推到 GitHub

在 GitHub 新建**私有**仓库，例如 `tsb-erp-page-plugin`：

```powershell
cd D:\company\tsb-erp-page-plugin
git init
git add .
git commit -m "feat: tsb-erp-page cursor plugin v2.0.0"
git branch -M main
git remote add origin https://github.com/<你的账号>/tsb-erp-page-plugin.git
git push -u origin main
```

## 3. 挂到 Team Marketplace

1. [cursor.com/dashboard](https://cursor.com/dashboard) → **Settings** → **Plugins**
2. **Team Marketplaces** → **Add Marketplace** → **Import from Repo**
3. 选 GitHub 私有仓 → **Add to Marketplace** → 选 `tsb-erp-page`
4. 设 Team Access → Save

## 4. 以后更新

1. 改 `HhEmpower/skills/` 或 `rules/`、`commands/`、`agents/`
2. 若从 ERP 主仓同步：`.\scripts\sync-skills.ps1`
3. `.\scripts\export-github-repo.ps1` → 导出目录 `git push`
4. Dashboard **Refresh**（或开 Auto Refresh）

## 注意

- GitHub 仓里**不要**放 `src/`、`.env` 等业务代码
- 私有仓即可，不必公开
- 插件名现为 `tsb-erp-page`（原 `trade-erp-ts-page`，v2.0.0 更名）
