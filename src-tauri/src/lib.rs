pub mod commands;
pub mod core;
pub mod data;
pub mod services;

use std::sync::Mutex;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::open_media_file,
            commands::get_eq_presets,
            commands::update_audio_eq,
            commands::update_subtitle_config,
            commands::update_playback_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MyPlayer Tauri application");
}

