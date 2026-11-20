param(
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (!$Version) {
    $config = Get-Content -LiteralPath (Join-Path $root 'src-tauri/tauri.conf.json') -Raw | ConvertFrom-Json
    $Version = $config.version
}

$buildDir = Join-Path $root 'src-tauri/target/release'
$releaseDir = Join-Path $root 'releases/windows-x64'
$executable = Get-Item -LiteralPath (Join-Path $buildDir 'myplayer_pro_rust.exe')
if ($executable.VersionInfo.ProductVersion -ne $Version) {
    throw "The executable is version $($executable.VersionInfo.ProductVersion). Build version $Version before packaging."
}

$installerStem = "MyPlayer Pro_${Version}_x64"
$outputStem = "MyPlayer-Pro_${Version}_x64"
$installers = @(
    @{ Source = "bundle/nsis/$installerStem-setup.exe"; Name = "$outputStem-setup.exe" }
    @{ Source = "bundle/msi/${installerStem}_en-US.msi"; Name = "${outputStem}_en-US.msi" }
) | Where-Object { Test-Path -LiteralPath (Join-Path $buildDir $_.Source) -PathType Leaf }
if (!$installers) {
    throw "Build the NSIS or MSI installer for version $Version before packaging."
}

$portableFiles = [ordered]@{
    'MyPlayer-Pro.exe' = $executable.FullName
    'bin/libmpv-2.dll' = Join-Path $buildDir 'bin/libmpv-2.dll'
    'bin/README.md' = Join-Path $buildDir 'bin/README.md'
    'bin/LICENSE.LGPL' = Join-Path $buildDir 'bin/LICENSE.LGPL'
}
foreach ($source in $portableFiles.Values) {
    if (!(Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Missing build resource $source. Prepare the decoder and rebuild the app before packaging."
    }
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = Join-Path $releaseDir "${outputStem}_portable.zip"
$tempZip = "$zipPath.$([guid]::NewGuid()).tmp"
try {
    $archive = [System.IO.Compression.ZipFile]::Open($tempZip, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($entry in $portableFiles.GetEnumerator()) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $entry.Value, $entry.Key) | Out-Null
        }
    } finally {
        $archive.Dispose()
    }
    Move-Item -LiteralPath $tempZip -Destination $zipPath -Force
} finally {
    if (Test-Path -LiteralPath $tempZip) {
        Remove-Item -LiteralPath $tempZip
    }
}

foreach ($installer in $installers) {
    Copy-Item -LiteralPath (Join-Path $buildDir $installer.Source) -Destination (Join-Path $releaseDir $installer.Name) -Force
}
Write-Host "Packaged version $Version in $releaseDir"
