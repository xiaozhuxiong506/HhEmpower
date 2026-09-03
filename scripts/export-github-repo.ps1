# Export the Cursor plugin without ERP application source code.
param(
    [string]$PluginRoot = "",
    [string]$ExportDir = ""
)

$ErrorActionPreference = "Stop"

function Get-NormalizedFullPath([string]$Path) {
    $FullPath = [IO.Path]::GetFullPath($Path)
    $RootPath = [IO.Path]::GetPathRoot($FullPath)
    if ($FullPath.Length -eq $RootPath.Length) { return $FullPath }
    return $FullPath.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
}

if ([string]::IsNullOrWhiteSpace($PluginRoot)) {
    $PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
$PluginRoot = Get-NormalizedFullPath $PluginRoot
if ([string]::IsNullOrWhiteSpace($ExportDir)) {
    $ExportDir = Join-Path (Split-Path $PluginRoot -Parent) "t-erp-page-plugin"
}
$ExportDir = Get-NormalizedFullPath $ExportDir
$ExportRoot = [IO.Path]::GetPathRoot($ExportDir)
$PathComparison = [StringComparison]::OrdinalIgnoreCase
$PathSeparator = [IO.Path]::DirectorySeparatorChar

if (
    $ExportDir.Equals($ExportRoot, $PathComparison) -or
    $ExportDir.Equals($PluginRoot, $PathComparison) -or
    $PluginRoot.StartsWith($ExportDir + $PathSeparator, $PathComparison) -or
    $ExportDir.StartsWith($PluginRoot + $PathSeparator, $PathComparison)
) {
    throw "Unsafe export directory: $ExportDir"
}

$include = @(
    ".gitattributes",
    ".cursor-plugin",
    "mcp.json",
    "assets",
    "agents",
    "commands",
    "rules",
    "skills",
    "tests",
    "mcp",
    "scripts",
    "LICENSE",
    "README.md",
    "PUBLISH.md",
    "CHANGELOG.md"
)

$McpRoot = Join-Path $PluginRoot "mcp"
Push-Location $McpRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "MCP build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

if (Test-Path $ExportDir) { Remove-Item $ExportDir -Recurse -Force }
New-Item -ItemType Directory -Path $ExportDir | Out-Null

foreach ($item in $include) {
    $src = Join-Path $PluginRoot $item
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $ExportDir $item) -Recurse -Force
        Write-Host "Exported: $item"
    }
}

$ExportMcpNodeModules = [IO.Path]::GetFullPath((Join-Path $ExportDir "mcp\node_modules"))
if (!$ExportMcpNodeModules.StartsWith($ExportDir + $PathSeparator, $PathComparison)) {
    throw "Unsafe exported node_modules path: $ExportMcpNodeModules"
}
if (Test-Path $ExportMcpNodeModules) {
    Remove-Item $ExportMcpNodeModules -Recurse -Force
}

Write-Host "Export complete: $ExportDir"
Write-Host "Next: cd $ExportDir && git init && git add . && git commit"
