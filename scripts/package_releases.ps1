$releaseDir = "d:\projects\my_player_rust\releases"
if (!(Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
}

$nsisSource = "d:\projects\my_player_rust\src-tauri\target\release\bundle\nsis\MyPlayer Pro_1.0.0_x64-setup.exe"
$msiSource = "d:\projects\my_player_rust\src-tauri\target\release\bundle\msi\MyPlayer Pro_1.0.0_x64_en-US.msi"
$exeSource = "d:\projects\my_player_rust\src-tauri\target\release\my_player.exe"

Copy-Item $nsisSource "$releaseDir\MyPlayer-Pro_1.0.0_x64-setup.exe" -Force
Copy-Item $msiSource "$releaseDir\MyPlayer-Pro_1.0.0_x64_en-US.msi" -Force

# Create portable standalone zip
$portableFolder = "$env:TEMP\myplayer_portable"
if (Test-Path $portableFolder) { Remove-Item -Recurse -Force $portableFolder }
New-Item -ItemType Directory -Path $portableFolder | Out-Null
Copy-Item $exeSource "$portableFolder\MyPlayer-Pro.exe" -Force

$zipPath = "$releaseDir\MyPlayer-Pro_1.0.0_x64_portable.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$portableFolder\*" -DestinationPath $zipPath -Force
Remove-Item -Recurse -Force $portableFolder

Get-ChildItem $releaseDir | Select-Object Name, Length, LastWriteTime

