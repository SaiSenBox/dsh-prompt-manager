# dsh-prompt-manager uninstaller
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Remove-EmptyInsertRows([string[]]$Lines) {
  $result = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i] -notmatch '^- insert:\s*$') {
      $result.Add($Lines[$i])
      continue
    }
    $j = $i + 1
    $hasContent = $false
    while ($j -lt $Lines.Count -and $Lines[$j] -notmatch '^-\s') {
      if ($Lines[$j].Trim() -and $Lines[$j] -notmatch '^\s*#') { $hasContent = $true }
      $j++
    }
    if ($hasContent) { $result.Add($Lines[$i]) }
  }
  return $result.ToArray()
}

$DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$ProfileDir = Join-Path $DshHome 'profiles\web'
$PkgPath = Join-Path $ProfileDir 'package.json'
$PatchPath = Join-Path $ProfileDir 'cordis.patch.yml'

if (-not (Test-Path -LiteralPath $ProfileDir -PathType Container)) {
  throw "DSH web profile was not found: $ProfileDir"
}

if (Test-Path -LiteralPath $PatchPath -PathType Leaf) {
  $lines = [System.IO.File]::ReadAllLines($PatchPath)
  $filtered = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s{4}- id:\s*prompt-manager\s*$' -and $i + 1 -lt $lines.Count -and $lines[$i + 1] -match '^\s{6}name:\s*dsh-prompt-manager\s*$') {
      $i++
      continue
    }
    $filtered.Add($lines[$i])
  }
  $clean = Remove-EmptyInsertRows $filtered.ToArray()
  $content = ($clean -join [Environment]::NewLine).TrimEnd() + [Environment]::NewLine
  Write-Utf8NoBom $PatchPath $content
  Write-Host '[1/2] Removed the complete prompt-manager registration block.'
}

$pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpm) { $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue }
if (-not $pnpm) { throw 'pnpm is unavailable; dependencies and lockfile cannot be updated safely.' }

$installed = $false
if (Test-Path -LiteralPath $PkgPath -PathType Leaf) {
  $dependencies = (Get-Content -Raw -Encoding UTF8 -LiteralPath $PkgPath | ConvertFrom-Json).dependencies
  $installed = $dependencies -and $dependencies.PSObject.Properties['dsh-prompt-manager']
}
if ($installed) {
  Push-Location $ProfileDir
  try {
    & $pnpm.Source remove dsh-prompt-manager
    if ($LASTEXITCODE -ne 0) { throw 'pnpm remove dsh-prompt-manager failed.' }
  } finally {
    Pop-Location
  }
}
Write-Host '[2/2] Removed dependency and updated lockfile.'
Write-Host 'Uninstall complete. Browser-local prompt data are preserved.'
