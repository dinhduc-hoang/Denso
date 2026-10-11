param([int]$Port = 33316)
$ErrorActionPreference = 'Stop'
$beRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$dataDirectory = Join-Path $beRoot '.local\mysql'
if (-not (Test-Path -LiteralPath (Join-Path $dataDirectory 'auto.cnf'))) {
  throw 'Local MySQL has not been initialized. Use the configured MySQL server or Docker Compose.'
}
$portConnection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($portConnection) {
  Push-Location $beRoot
  try {
    node scripts/local-mysql.js status
    if ($LASTEXITCODE -ne 0) { throw "Port $Port belongs to another service or credentials do not match." }
  } finally { Pop-Location }
  exit 0
}
$linuxDirectory = (& wsl.exe -d Ubuntu --exec wslpath -a $dataDirectory).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Ubuntu/WSL is not available.' }
$arguments = @('-d','Ubuntu','--exec','/usr/sbin/mysqld','--no-defaults','--lower-case-table-names=1',"--datadir=$linuxDirectory", "--port=$Port", '--bind-address=127.0.0.1','--socket=/tmp/denso-shopfloor-local.sock',"--pid-file=$linuxDirectory/../mysql.pid",'--mysqlx=0')
$quotedArguments = $arguments | ForEach-Object { if ($_ -match '\s') { '"' + $_.Replace('"','\"') + '"' } else { $_ } }
Start-Process -FilePath 'wsl.exe' -ArgumentList $quotedArguments -WindowStyle Hidden -RedirectStandardOutput (Join-Path $beRoot '.local\mysql.stdout.log') -RedirectStandardError (Join-Path $beRoot '.local\mysql.stderr.log') | Out-Null
Write-Output "Local MySQL starting at 127.0.0.1:$Port. Data remains in BE/.local/mysql."
