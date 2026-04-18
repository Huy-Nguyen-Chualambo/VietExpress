$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -Path $projectRoot

Write-Host '[dev:safe] Project root:' $projectRoot

# Free port 3000 if another process is listening.
$port = 3000
$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    try {
      $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
      if ($proc) {
        Write-Host "[dev:safe] Stopping process on port ${port}: PID ${pid} ($($proc.ProcessName))"
        Stop-Process -Id $pid -Force
      }
    } catch {
      Write-Host "[dev:safe] Could not stop PID ${pid}: $($_.Exception.Message)"
    }
  }
}

# Clean Next.js dev cache to avoid stale runtime artifacts.
if (Test-Path '.next') {
  Write-Host '[dev:safe] Removing .next cache'
  Remove-Item -Recurse -Force '.next'
}

# Generate Prisma client with engine; do not use --no-engine in local dev.
Write-Host '[dev:safe] Generating Prisma Client'
npx prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host '[dev:safe] prisma generate failed'
  exit $LASTEXITCODE
}

Write-Host '[dev:safe] Starting Next dev server'
npm run dev
exit $LASTEXITCODE
