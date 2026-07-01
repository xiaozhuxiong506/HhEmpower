# 本地安装 t-erp-page 插件到 Cursor（完整三步：放目录 + 注册 + 启用）
#
# 依据：Cursor 本地插件需通过 ~/.claude/ 共享配置面注册（与 Claude Code 共用）。
# 仅放目录不够，还必须在 installed_plugins.json 登记 + settings.json 启用，否则命令/技能不加载。
# 参考：https://medium.com/@v.tajzich/how-to-write-and-test-cursor-plugins-locally-...
#
# 用法：
#   .\scripts\install-local.ps1              # 默认安装（符号链接）
#   .\scripts\install-local.ps1 -Copy        # 改用复制（无需管理员权限）
#   .\scripts\install-local.ps1 -Uninstall   # 卸载
param(
    [string]$PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [switch]$Copy,        # 用复制代替符号链接（规避权限问题）
    [switch]$Uninstall    # 卸载并清理
)

$ErrorActionPreference = "Stop"
$PluginName = "t-erp-page"
$PluginId = "$PluginName@local"

# --- 路径定义 ---
$CursorPluginsDir = Join-Path $env:USERPROFILE ".cursor\plugins"
$TargetDir = Join-Path $CursorPluginsDir $PluginName   # 注意：直接放 plugins/ 下，不放 local/ 子目录
$ClaudeDir = Join-Path $env:USERPROFILE ".claude"
$ClaudePluginsDir = Join-Path $ClaudeDir "plugins"
$InstalledPluginsJson = Join-Path $ClaudePluginsDir "installed_plugins.json"
$SettingsJson = Join-Path $ClaudeDir "settings.json"

# --- 卸载分支 ---
if ($Uninstall) {
    Write-Host "卸载 $PluginName ..." -ForegroundColor Yellow
    # 清理目标目录（无论是链接还是复制）
    if (Test-Path $TargetDir) {
        # 符号链接需用 Remove-Item -Force（不能 -Recurse，否则跟随链接删源）
        $item = Get-Item $TargetDir -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            Remove-Item $TargetDir -Force
        } else {
            Remove-Item $TargetDir -Recurse -Force
        }
        Write-Host "  已删除目录/链接: $TargetDir"
    }
    # 从 installed_plugins.json 移除
    if (Test-Path $InstalledPluginsJson) {
        $data = Get-Content $InstalledPluginsJson -Raw | ConvertFrom-Json
        if ($data.plugins.PSObject.Properties.Name -contains $PluginId) {
            $data.plugins.PSObject.Properties.Remove($PluginId)
            if ($data.plugins.PSObject.Properties.Count -eq 0) {
                $data.plugins = @{}
            }
            $data | ConvertTo-Json -Depth 10 | Set-Content $InstalledPluginsJson -Encoding UTF8
            Write-Host "  已从 installed_plugins.json 移除"
        }
    }
    # 从 settings.json 移除
    if (Test-Path $SettingsJson) {
        $s = Get-Content $SettingsJson -Raw | ConvertFrom-Json
        if ($s.enabledPlugins -and $s.enabledPlugins.PSObject.Properties.Name -contains $PluginId) {
            $s.enabledPlugins.PSObject.Properties.Remove($PluginId)
            $s | ConvertTo-Json -Depth 10 | Set-Content $SettingsJson -Encoding UTF8
            Write-Host "  已从 settings.json 移除"
        }
    }
    Write-Host "卸载完成。请重启 Cursor。" -ForegroundColor Green
    return
}

# --- 安装分支 ---
Write-Host "安装 $PluginName 到 Cursor ..." -ForegroundColor Cyan
Write-Host "插件源: $PluginRoot"
Write-Host ""

# 确保 ~/.cursor/plugins 和 ~/.claude/plugins 目录存在
New-Item -ItemType Directory -Force -Path $CursorPluginsDir | Out-Null
New-Item -ItemType Directory -Force -Path $ClaudePluginsDir | Out-Null

# 第 1 步：放置插件（符号链接 或 复制）
# 先清理旧目标（无论链接还是目录）
if (Test-Path $TargetDir) {
    $old = Get-Item $TargetDir -Force
    if ($old.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        Remove-Item $TargetDir -Force
    } else {
        Remove-Item $TargetDir -Recurse -Force
    }
}

if ($Copy) {
    Write-Host "[1/3] 复制插件到 $TargetDir ..."
    Copy-Item -Path $PluginRoot -Destination $TargetDir -Recurse -Force
    # 排除不必要的文件（node_modules 等）
    $exclude = @("node_modules", ".git")
    foreach ($ex in $exclude) {
        $exPath = Join-Path $TargetDir $ex
        if (Test-Path $exPath) { Remove-Item $exPath -Recurse -Force }
    }
    Write-Host "     ✅ 已复制（-Copy 模式，改源码后需重跑脚本）" -ForegroundColor Green
} else {
    Write-Host "[1/3] 创建符号链接 $TargetDir -> $PluginRoot ..."
    try {
        New-Item -ItemType SymbolicLink -Path $TargetDir -Target $PluginRoot | Out-Null
        Write-Host "     ✅ 符号链接已建（源码改动即时生效）" -ForegroundColor Green
    } catch {
        Write-Host "     ⚠️ 符号链接失败（需管理员权限或开发者模式）。改用复制模式..." -ForegroundColor Yellow
        Write-Host "     提示：以管理员运行 PowerShell，或系统开启「开发者模式」可用符号链接" -ForegroundColor Yellow
        Copy-Item -Path $PluginRoot -Destination $TargetDir -Recurse -Force
        $exclude = @("node_modules", ".git")
        foreach ($ex in $exclude) {
            $exPath = Join-Path $TargetDir $ex
            if (Test-Path $exPath) { Remove-Item $exPath -Recurse -Force }
        }
        Write-Host "     ✅ 已改用复制模式" -ForegroundColor Green
    }
}

# 第 2 步：注册到 ~/.claude/plugins/installed_plugins.json（upsert，不覆盖其它插件）
Write-Host "[2/3] 注册到 installed_plugins.json ..."
$entry = @{
    scope = "user"
    installPath = $TargetDir
}
# 读取现有（若存在）
$pluginsObj = [ordered]@{}
if (Test-Path $InstalledPluginsJson) {
    try {
        $existing = Get-Content $InstalledPluginsJson -Raw | ConvertFrom-Json
        if ($existing.plugins) {
            foreach ($prop in $existing.plugins.PSObject.Properties) {
                $pluginsObj[$prop.Name] = $prop.Value
            }
        }
    } catch {
        Write-Host "     ⚠️ installed_plugins.json 解析失败，将重建" -ForegroundColor Yellow
    }
}
# 用绝对路径（文章指出相对路径不可靠）
$pluginsObj[$PluginId] = @($entry)
$installed = [ordered]@{ plugins = $pluginsObj }
$installed | ConvertTo-Json -Depth 10 | Set-Content $InstalledPluginsJson -Encoding UTF8
Write-Host "     ✅ 已注册 $PluginId -> $TargetDir" -ForegroundColor Green

# 第 3 步：在 ~/.claude/settings.json 启用（upsert，不覆盖其它设置）
# 用 PSCustomObject 重建（避免 ordered dict 嵌套时 ConvertTo-Json 序列化出 Count/Keys 等内置属性）
Write-Host "[3/3] 启用 settings.json ..."
$existingSet = $null
if (Test-Path $SettingsJson) {
    try {
        $existingSet = Get-Content $SettingsJson -Raw | ConvertFrom-Json
    } catch {
        Write-Host "     ⚠️ settings.json 解析失败，将重建" -ForegroundColor Yellow
    }
}
# 收集已有 enabledPlugins 到普通 hashtable（仅键值，不带内置属性）
$enabledHash = @{}
if ($existingSet -and $existingSet.enabledPlugins) {
    foreach ($prop in $existingSet.enabledPlugins.PSObject.Properties) {
        if ($prop.Name -notmatch '^(Count|Keys|Values|IsReadOnly|IsFixedSize|IsSynchronized|SyncRoot)$') {
            $enabledHash[$prop.Name] = $prop.Value
        }
    }
}
$enabledHash[$PluginId] = $true
# 把 enabledPlugins hashtable 转成 PSCustomObject（JSON 干净）
$enabledPsc = [PSCustomObject]$enabledHash
# 重建 settings：保留原有顶层字段 + 替换 enabledPlugins
$newSettings = [PSCustomObject]@{}
if ($existingSet) {
    foreach ($prop in $existingSet.PSObject.Properties) {
        if ($prop.Name -ne 'enabledPlugins') {
            $newSettings | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value
        }
    }
}
$newSettings | Add-Member -MemberType NoteProperty -Name 'enabledPlugins' -Value $enabledPsc
$newSettings | ConvertTo-Json -Depth 10 | Set-Content $SettingsJson -Encoding UTF8
Write-Host "     ✅ 已在 enabledPlugins 启用 $PluginId" -ForegroundColor Green

Write-Host ""
Write-Host "=== 安装完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "  1. 完全退出并重启 Cursor（不是 Reload Window，是退出重开）"
Write-Host "  2. Settings → Features → 确认「Include third-party Plugins/Skills」已开（若无此选项跳过）"
Write-Host "  3. 输入 /t-start 测试命令是否出现"
Write-Host ""
Write-Host "验证文件：" -ForegroundColor Cyan
Write-Host "  - $InstalledPluginsJson"
Write-Host "  - $SettingsJson"
Write-Host ""
Write-Host "卸载：.\scripts\install-local.ps1 -Uninstall"
Write-Host "复制模式（无管理员权限时）：.\scripts\install-local.ps1 -Copy"
