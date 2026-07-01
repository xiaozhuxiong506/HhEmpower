# 导出插件到独立 Git 仓库目录（不含 ERP 业务代码）
param(
    [string]$PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$ExportDir = (Join-Path (Split-Path $PluginRoot -Parent) "t-erp-page-plugin")
)

$include = @(
    ".cursor-plugin",
    "assets",
    "agents",
    "commands",
    "rules",
    "skills",
    "mcp",
    "scripts",
    "LICENSE",
    "README.md",
    "PUBLISH.md",
    "CHANGELOG.md"
)

if (Test-Path $ExportDir) { Remove-Item $ExportDir -Recurse -Force }
New-Item -ItemType Directory -Path $ExportDir | Out-Null

foreach ($item in $include) {
    $src = Join-Path $PluginRoot $item
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $ExportDir $item) -Recurse -Force
        Write-Host "Exported: $item"
    }
}

Write-Host "导出完成: $ExportDir"
Write-Host "下一步: cd $ExportDir && git init && git add . && git commit"
