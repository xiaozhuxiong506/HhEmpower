# 从 Tsb.TradeErp.PC 项目 .cursor 同步插件资料到本仓库。
# 只同步插件资料：skills / commands / rules / agents / mcp / scripts。
# 禁止用于修改 ERP 业务源码。
param(
    [string]$SourceRoot = (Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "Tsb.TradeErp.PC\.cursor"),
    [string]$TargetRoot = (Split-Path $PSScriptRoot -Parent)
)

if (-not (Test-Path $SourceRoot)) {
    Write-Warning "源目录不存在: $SourceRoot"
    Write-Host "用法: .\sync-skills.ps1 -SourceRoot 'D:\company\Tsb.TradeErp.PC\.cursor'"
    exit 1
}

$sourceItem = Get-Item $SourceRoot
$sourceCursorRoot = if ($sourceItem.Name -eq "skills") { Split-Path $SourceRoot -Parent } else { $SourceRoot }
$copied = @()

function Sync-DirectoryContents {
    param(
        [string]$Area,
        [string[]]$DirectoryPatterns = @("*"),
        [switch]$IncludeFiles
    )

    $sourceArea = Join-Path $sourceCursorRoot $Area
    $targetArea = Join-Path $TargetRoot $Area
    if (-not (Test-Path $sourceArea)) {
        Write-Host "Skipped missing area: $Area"
        return
    }

    New-Item -ItemType Directory -Force -Path $targetArea | Out-Null

    foreach ($pattern in $DirectoryPatterns) {
        Get-ChildItem -Path $sourceArea -Directory -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            $dest = Join-Path $targetArea $_.Name
            if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
            Copy-Item $_.FullName $dest -Recurse -Force
            $script:copied += "$Area/$($_.Name)"
            Write-Host "Synced: $Area/$($_.Name)"
        }
    }

    if ($IncludeFiles) {
        Get-ChildItem -Path $sourceArea -File -ErrorAction SilentlyContinue | ForEach-Object {
            Copy-Item $_.FullName (Join-Path $targetArea $_.Name) -Force
            $script:copied += "$Area/$($_.Name)"
            Write-Host "Synced: $Area/$($_.Name)"
        }
    }
}

Sync-DirectoryContents -Area "skills" -DirectoryPatterns @("t-*") -IncludeFiles
Sync-DirectoryContents -Area "commands" -IncludeFiles
Sync-DirectoryContents -Area "rules" -IncludeFiles
Sync-DirectoryContents -Area "agents" -IncludeFiles
Sync-DirectoryContents -Area "mcp" -IncludeFiles
Sync-DirectoryContents -Area "scripts" -IncludeFiles

Write-Host "完成，共同步 $($copied.Count) 个插件条目。"
