# 从 Tsb.TradeErp.PC 项目 .cursor/skills/t-page* 同步到本插件 skills/
param(
    [string]$SourceRoot = (Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "Tsb.TradeErp.PC\.cursor\skills"),
    [string]$TargetRoot = (Join-Path (Split-Path $PSScriptRoot -Parent) "skills")
)

if (-not (Test-Path $SourceRoot)) {
    Write-Warning "源目录不存在: $SourceRoot"
    Write-Host "用法: .\sync-skills.ps1 -SourceRoot 'D:\company\Tsb.TradeErp.PC\.cursor\skills'"
    exit 1
}

$patterns = @("t-page", "t-page-*")
$copied = 0

foreach ($pattern in $patterns) {
    Get-ChildItem -Path $SourceRoot -Directory -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        $dest = Join-Path $TargetRoot $_.Name
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        Copy-Item $_.FullName $dest -Recurse -Force
        $copied++
        Write-Host "Synced: $($_.Name)"
    }
}

# 同步 skills/README.md（若存在）
$readmeSrc = Join-Path $SourceRoot "..\README.md"
$readmeSrc2 = Join-Path (Split-Path $SourceRoot -Parent) "skills\README.md"
if (Test-Path $readmeSrc2) {
    Copy-Item $readmeSrc2 (Join-Path $TargetRoot "README.md") -Force
    Write-Host "Synced: README.md"
}

Write-Host "完成，共同步 $copied 个 Skill 目录。"
