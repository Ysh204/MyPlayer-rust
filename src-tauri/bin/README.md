# Native audio decoder

`libmpv-2.dll` is the replaceable Windows audio decoder used when WebView2
cannot decode a media file's audio track. MyPlayer Pro uses the audio-only
libmpv client API for these tracks and keeps video in its existing window.

The bundled x64 library is from the official mpv v0.42.0 LGPL release:

https://github.com/mpv-player/mpv/releases/download/v0.42.0/libmpv-v0.42.0-x86_64-w64-mingw32-lgpl.zip

Release archive SHA-256:
`8e5f77430efc53ef175804ba6618527e3af0448a0dcabf04d3cc72659d1a6fce`

The mpv source and licensing details are at
https://github.com/mpv-player/mpv/tree/v0.42.0 and
https://github.com/mpv-player/mpv/blob/v0.42.0/Copyright.
The installers and portable ZIP include the separate DLL and `LICENSE.LGPL` in
the application's `bin` folder. From the repository root, run
`.\scripts\prepare_native_audio.ps1` before building a fresh checkout. The script
verifies both the archive and the extracted DLL. Git tracks this README and
`LICENSE.LGPL` and ignores the downloaded DLL.
