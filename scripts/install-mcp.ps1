# Install or remove the local TSB browser MCP server for Cursor.
#
# Usage:
#   .\scripts\install-mcp.ps1
#   .\scripts\install-mcp.ps1 -SkipNpmInstall
#   .\scripts\install-mcp.ps1 -Uninstall
param(
    [string]$PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [switch]$SkipNpmInstall,
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$ServerName = "tsb-browser-mcp"
$McpRoot = Join-Path $PluginRoot "mcp"
$ServerPath = Join-Path $McpRoot "src\server.mjs"
$CursorDir = Join-Path $env:USERPROFILE ".cursor"
$McpJson = Join-Path $CursorDir "mcp.json"
$ProfileDir = Join-Path $env:LOCALAPPDATA "TsbBrowserMcp\playwright-profile"

function Convert-ObjectToOrderedMap($Object) {
    $map = [ordered]@{}
    if ($null -eq $Object) { return $map }
    foreach ($prop in $Object.PSObject.Properties) {
        $map[$prop.Name] = $prop.Value
    }
    return $map
}

function Convert-ServersToOrderedMap($Object) {
    $map = [ordered]@{}
    if ($null -eq $Object) { return $map }
    foreach ($prop in $Object.PSObject.Properties) {
        $map[$prop.Name] = $prop.Value
    }
    return $map
}

function Write-JsonNoBom($Path, $Value) {
    $json = $Value | ConvertTo-Json -Depth 20
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $json, $encoding)
}

New-Item -ItemType Directory -Force -Path $CursorDir | Out-Null

$config = [ordered]@{}
if (Test-Path $McpJson) {
    try {
        $existing = Get-Content $McpJson -Raw | ConvertFrom-Json
        $config = Convert-ObjectToOrderedMap $existing
    } catch {
        Write-Host "Existing mcp.json is invalid JSON. A backup will be created." -ForegroundColor Yellow
        Copy-Item $McpJson "$McpJson.bak" -Force
    }
}

$servers = Convert-ServersToOrderedMap $config["mcpServers"]

if ($Uninstall) {
    if ($servers.Contains($ServerName)) {
        $servers.Remove($ServerName)
    }
    $config["mcpServers"] = $servers
    Write-JsonNoBom $McpJson $config
    Write-Host "Removed $ServerName from $McpJson" -ForegroundColor Green
    return
}

if (!(Test-Path $ServerPath)) {
    throw "MCP server not found: $ServerPath"
}

if (!$SkipNpmInstall) {
    Push-Location $McpRoot
    try {
        npm install
    } finally {
        Pop-Location
    }
}

New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

$servers[$ServerName] = [ordered]@{
    command = "node"
    args = @($ServerPath)
    env = [ordered]@{
        TSB_MCP_PROFILE_DIR = $ProfileDir
        TSB_MCP_BROWSER_CHANNEL = "chrome"
    }
}

$config["mcpServers"] = $servers
Write-JsonNoBom $McpJson $config

Write-Host "Installed $ServerName into $McpJson" -ForegroundColor Green
Write-Host "Restart Cursor, then enable the server in Settings -> Tools & MCP if it is disabled." -ForegroundColor Cyan
