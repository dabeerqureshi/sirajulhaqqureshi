$ErrorActionPreference = 'Continue'
Set-Location 'd:\sirajulhaqqureshi'
function Log([string]$m) { Add-Content -Path 'push.log' -Value $m }
Remove-Item 'push.log' -ErrorAction SilentlyContinue
$env:GCM_INTERACTIVE = 'Never'

$lines = @("protocol=https", "host=github.com", "") -join "`n"
$resp = $lines | git credential fill 2>&1
$user = $null; $pass = $null
foreach ($l in $resp) {
  if ($l -like 'username=*') { $user = $l.Substring(9) }
  elseif ($l -like 'password=*') { $pass = $l.Substring(9) }
}
if (-not $pass) {
  Log "NO_CREDS (username: $user)"
  Log ($resp -join ' | ')
  Log 'PUSH_DONE_MARKER'
  exit 1
}
Log "credential loaded for user: $user"

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8("${user}:${pass}"))
try {
  $r = Invoke-RestMethod -Headers @{ Authorization = "Basic $b64" } -Uri 'https://api.github.com/user' -TimeoutSec 20
  Log "TOKEN_VALID for: $($r.login)"
} catch {
  Log "TOKEN_INVALID: $($_.Exception.Message)"
  Log 'PUSH_DONE_MARKER'
  exit 1
}

git -c credential.helper= -c "http.extraheader=AUTHORIZATION: basic $b64" push origin main 2>&1 |
  ForEach-Object { Log $_ }
Log "PUSH_EXIT=$LASTEXITCODE"
Log 'PUSH_DONE_MARKER'
