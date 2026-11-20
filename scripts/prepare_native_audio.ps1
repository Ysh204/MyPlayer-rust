$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root 'src-tauri\bin'
$archive = Join-Path $env:TEMP 'myplayer-libmpv-v0.42.0-lgpl.zip'
$extracted = Join-Path $env:TEMP 'myplayer-libmpv-v0.42.0-lgpl'
$url = 'https://github.com/mpv-player/mpv/releases/download/v0.42.0/libmpv-v0.42.0-x86_64-w64-mingw32-lgpl.zip'
$archiveHash = '8E5F77430EFC53EF175804BA6618527E3AF0448A0DCABF04D3CC72659D1A6FCE'
$dllHash = '94FB87247732C59915CD59808BC582E843A71C22214B7B6C1E5563AA8149CEF4'
$dll = Join-Path $destination 'libmpv-2.dll'

New-Item -ItemType Directory -Path $destination -Force | Out-Null
if ((Test-Path -LiteralPath $dll) -and
    (Get-FileHash -LiteralPath $dll -Algorithm SHA256).Hash -eq $dllHash -and
    (Test-Path -LiteralPath (Join-Path $destination 'LICENSE.LGPL'))) {
    Write-Host 'Native audio decoder is ready.'
    return
}

if (!(Test-Path -LiteralPath $archive) -or
    (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $archiveHash) {
    Invoke-WebRequest -Uri $url -OutFile $archive
}
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $archiveHash) {
    throw 'Downloaded libmpv archive failed SHA-256 verification.'
}

Expand-Archive -LiteralPath $archive -DestinationPath $extracted -Force
Copy-Item -LiteralPath (Join-Path $extracted 'libmpv-2.dll') -Destination $dll -Force
Copy-Item -LiteralPath (Join-Path $extracted 'LICENSE.LGPL') -Destination (Join-Path $destination 'LICENSE.LGPL') -Force
if ((Get-FileHash -LiteralPath $dll -Algorithm SHA256).Hash -ne $dllHash) {
    throw 'Extracted libmpv library failed SHA-256 verification.'
}
Write-Host 'Native audio decoder is ready.'
