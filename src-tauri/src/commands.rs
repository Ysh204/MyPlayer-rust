use std::sync::Mutex;
use serde::Serialize;
use tauri::State;

use crate::core::title_cleaner::clean_media_title;
use crate::data::models::eq_state::{EqPreset, EqState};
use crate::data::models::subtitle_style::SubtitleConfig;
use crate::services::audio_filter_builder::build_audio_filter;
use crate::services::player_service::PlayerService;

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
}

#[tauri::command]
pub fn open_media_file(state: State<'_, Mutex<AppState>>, path: String) -> MediaOpenResponse {
    let mut app = state.lock().unwrap();
    app.player.open_file(&path);
    MediaOpenResponse {
        clean_title: clean_media_title(&path),
        raw_path: path,
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

