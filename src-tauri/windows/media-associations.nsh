!define MYPLAYER_CAPABILITIES "Software\com.yash.myplayer\Capabilities"
!define MYPLAYER_APP_NAME "${PRODUCTNAME} (Rust)"
!define MYPLAYER_APPLICATION "Software\Classes\Applications\${MAINBINARYNAME}.exe"
!define MYPLAYER_AUDIO_PROGID "MyPlayerPro.Audio"
!define MYPLAYER_VIDEO_PROGID "MyPlayerPro.Video"

!macro MyPlayerRegisterMedia EXT PROGID
  WriteRegStr HKCU "${MYPLAYER_CAPABILITIES}\FileAssociations" ".${EXT}" "${PROGID}"
  WriteRegStr HKCU "Software\Classes\.${EXT}\OpenWithProgids" "${PROGID}" ""
  WriteRegStr HKCU "${MYPLAYER_APPLICATION}\SupportedTypes" ".${EXT}" ""
!macroend

!macro MyPlayerUnregisterMedia EXT PROGID
  DeleteRegValue HKCU "Software\Classes\.${EXT}\OpenWithProgids" "${PROGID}"
!macroend

!macro MyPlayerRegisterClass PROGID DESCRIPTION
  WriteRegStr HKCU "Software\Classes\${PROGID}" "" "${DESCRIPTION}"
  WriteRegStr HKCU "Software\Classes\${PROGID}\Application" "ApplicationName" "${MYPLAYER_APP_NAME}"
  WriteRegStr HKCU "Software\Classes\${PROGID}\DefaultIcon" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr HKCU "Software\Classes\${PROGID}\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ReadRegStr $0 HKCU "Software\RegisteredApplications" "${PRODUCTNAME}"
  ${If} $0 == "${MYPLAYER_CAPABILITIES}"
    DeleteRegValue HKCU "Software\RegisteredApplications" "${PRODUCTNAME}"
  ${EndIf}
  WriteRegStr HKCU "${MYPLAYER_CAPABILITIES}" "ApplicationName" "${MYPLAYER_APP_NAME}"
  WriteRegStr HKCU "${MYPLAYER_CAPABILITIES}" "ApplicationDescription" "Plays local music and video files."
  WriteRegStr HKCU "Software\RegisteredApplications" "${MYPLAYER_APP_NAME}" "${MYPLAYER_CAPABILITIES}"
  WriteRegStr HKCU "${MYPLAYER_APPLICATION}" "FriendlyAppName" "${MYPLAYER_APP_NAME}"
  WriteRegStr HKCU "${MYPLAYER_APPLICATION}\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
  !insertmacro MyPlayerRegisterClass "${MYPLAYER_AUDIO_PROGID}" "MyPlayer Pro audio file"
  !insertmacro MyPlayerRegisterClass "${MYPLAYER_VIDEO_PROGID}" "MyPlayer Pro video file"
  !insertmacro MyPlayerRegisterMedia "mp3" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerRegisterMedia "m4a" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerRegisterMedia "flac" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerRegisterMedia "wav" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerRegisterMedia "ogg" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerRegisterMedia "opus" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerRegisterMedia "mkv" "${MYPLAYER_VIDEO_PROGID}"
  !insertmacro UPDATEFILEASSOC
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegValue HKCU "Software\RegisteredApplications" "${MYPLAYER_APP_NAME}"
  DeleteRegKey HKCU "${MYPLAYER_CAPABILITIES}"
  DeleteRegKey HKCU "${MYPLAYER_APPLICATION}"
  DeleteRegKey HKCU "Software\Classes\${MYPLAYER_AUDIO_PROGID}"
  DeleteRegKey HKCU "Software\Classes\${MYPLAYER_VIDEO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "mp3" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "m4a" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "flac" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "wav" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "ogg" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "opus" "${MYPLAYER_AUDIO_PROGID}"
  !insertmacro MyPlayerUnregisterMedia "mkv" "${MYPLAYER_VIDEO_PROGID}"
  !insertmacro UPDATEFILEASSOC
!macroend
