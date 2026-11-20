use std::sync::Mutex;
use serde::Serialize;
use tauri::State;

use crate::core::title_cleaner::clean_media_title;
use crate::data::models::eq_state::{EqPreset, EqState};
use crate::data::models::subtitle_style::SubtitleConfig;
use crate::services::audio_filter_builder::build_audio_filter;
use crate::services::media_inspector::{extract_embedded_subtitles, inspect_media_file, MediaTrack, SubtitleCueItem};
use crate::services::player_service::PlayerService;
use crate::services::native_audio::{AudioSync, NativeAudioBridge, NativeAudioStatus};

#[tauri::command]
pub fn get_launch_files() -> Vec<String> {
    std::env::args_os()
        .skip(1)
        .filter_map(|argument| std::path::absolute(argument).ok())
        .filter(|path| path.is_file())
        .filter_map(|path| path.into_os_string().into_string().ok())
        .collect()
}

#[tauri::command]
pub fn sync_native_audio(
    bridge: State<'_, NativeAudioBridge>, path: String, position: f64,
    playing: bool, volume: f64, eq: EqState,
) -> Result<NativeAudioStatus, String> {
    bridge.sync(AudioSync { path, position, playing, volume, eq })
}

#[tauri::command]
pub fn stop_native_audio(bridge: State<'_, NativeAudioBridge>, path: String) {
    bridge.stop(path);
}

pub struct AppState {
    pub player: PlayerService,
    pub eq: EqState,
    pub subtitles: SubtitleConfig,
    pub hardware_decoding: bool,
    pub auto_resume: bool,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            player: PlayerService::default(),
            eq: EqState::default(),
            subtitles: SubtitleConfig::default(),
            hardware_decoding: true,
            auto_resume: true,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaOpenResponse {
    pub raw_path: String,
    pub clean_title: String,
    pub audio_tracks: Vec<MediaTrack>,
    pub subtitle_tracks: Vec<MediaTrack>,
}

/// Legacy synchronous open: inspects before returning (kept for compatibility).
/// The frontend no longer awaits this on the critical path — it uses `open_media_file_fast`
/// for instant playback and `inspect_media_tracks` in the background.
#[tauri::command]
pub fn open_media_file(state: State<'_, Mutex<AppState>>, path: String) -> MediaOpenResponse {
    let mut app = state.lock().unwrap();
    app.player.open_file(&path);
    let inspected = inspect_media_file(&path);
    MediaOpenResponse {
        clean_title: clean_media_title(&path),
        raw_path: path,
        audio_tracks: inspected.audio_tracks,
        subtitle_tracks: inspected.subtitle_tracks,
    }
}

/// Fast path: register the file and return immediately so the video starts at once.
/// Thread inspection is done via `inspect_media_tracks` after playback begins.
#[tauri::command]
pub fn open_media_file_fast(state: State<'_, Mutex<AppState>>, path: String) -> MediaOpenResponse {
    {
        let mut app = state.lock().unwrap();
        app.player.open_file(&path);
    }
    MediaOpenResponse {
        clean_title: clean_media_title(&path),
        raw_path: path,
        audio_tracks: Vec::new(),
        subtitle_tracks: Vec::new(),
    }
}

/// Background inspection: parses container headers + sidecars (can be slow) — call
/// *after* the video element has already started playing.
#[tauri::command]
pub async fn inspect_media_tracks(path: String) -> Result<MediaOpenResponse, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let inspected = inspect_media_file(&path);
        MediaOpenResponse {
            clean_title: clean_media_title(&path),
            raw_path: path,
            audio_tracks: inspected.audio_tracks,
            subtitle_tracks: inspected.subtitle_tracks,
        }
    }).await.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_subtitle_file(path: String) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|error| error.to_string())?;
    if bytes.starts_with(&[0xff, 0xfe]) || bytes.starts_with(&[0xfe, 0xff]) {
        let units = bytes[2..].chunks_exact(2).map(|pair| {
            if bytes[0] == 0xff { u16::from_le_bytes([pair[0], pair[1]]) }
            else { u16::from_be_bytes([pair[0], pair[1]]) }
        }).collect::<Vec<_>>();
        return String::from_utf16(&units).map_err(|error| error.to_string());
    }
    String::from_utf8(bytes).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn extract_subtitles_for_track(path: String, track_num: u64) -> Result<Vec<SubtitleCueItem>, String> {
    tauri::async_runtime::spawn_blocking(move || extract_embedded_subtitles(&path, track_num))
        .await.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_hardware_decoding(state: State<'_, Mutex<AppState>>) -> Option<bool> {
    cfg!(windows).then(|| state.lock().unwrap().hardware_decoding)
}

#[tauri::command]
pub fn set_hardware_decoding(app: tauri::AppHandle, state: State<'_, Mutex<AppState>>, enabled: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        let path = crate::hardware_preference_path(&app).map_err(|error| error.to_string())?;
        let mut app_state = state.lock().unwrap();
        if let Some(directory) = path.parent() {
            std::fs::create_dir_all(directory).map_err(|error| error.to_string())?;
        }
        std::fs::write(&path, if enabled { "on" } else { "off" }).map_err(|error| error.to_string())?;
        app_state.hardware_decoding = enabled;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = (app, state, enabled);
        Err("Hardware decoding is managed by the system renderer".into())
    }
}

#[tauri::command]
pub fn get_eq_presets() -> Vec<EqPreset> {
    EqPreset::built_in_presets()
}

#[tauri::command]
pub fn update_audio_eq(state: State<'_, Mutex<AppState>>, eq: EqState) -> String {
    let mut app = state.lock().unwrap();
    let af_chain = build_audio_filter(&eq);
    app.player.apply_audio_settings(&eq);
    app.eq = eq;
    af_chain
}

#[tauri::command]
pub fn update_subtitle_config(state: State<'_, Mutex<AppState>>, config: SubtitleConfig) {
    let mut app = state.lock().unwrap();
    app.player.apply_subtitle_settings(&config);
    app.subtitles = config;
}

#[tauri::command]
pub fn update_playback_settings(
    state: State<'_, Mutex<AppState>>,
    hardware_decoding: bool,
    auto_resume: bool,
) {
    let mut app = state.lock().unwrap();
    app.hardware_decoding = hardware_decoding;
    app.auto_resume = auto_resume;
    app.player.set_hardware_decoding(hardware_decoding);
}
