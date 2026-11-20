pub mod commands;
pub mod core;
pub mod data;
pub mod services;

use std::sync::Mutex;
use commands::AppState;

#[cfg(windows)]
fn hardware_preference_path(app: &tauri::AppHandle) -> tauri::Result<std::path::PathBuf> {
    use tauri::Manager;
    Ok(app.path().app_config_dir()?.join("hardware-decoding"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            use tauri::Manager;
            let state = AppState::default();
            let config = &app.config().app.windows[0];
            let builder = tauri::WebviewWindowBuilder::from_config(app, config)?;
            #[cfg(windows)]
            let (state, builder) = {
                let mut state = state;
                state.hardware_decoding = hardware_preference_path(app.handle())
                    .ok()
                    .and_then(|path| std::fs::read_to_string(path).ok())
                    .as_deref() != Some("off");
                let mut args = String::from(
                    "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --autoplay-policy=no-user-gesture-required --enable-blink-features=AudioVideoTracks",
                );
                if !state.hardware_decoding {
                    args.push_str(" --disable-accelerated-video-decode");
                }
                (state, builder.additional_browser_args(&args))
            };
            app.manage(Mutex::new(state));
            let decoder_path = app.path().resource_dir()?.join("bin/libmpv-2.dll");
            app.manage(services::native_audio::NativeAudioBridge::new(decoder_path));
            builder.build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_launch_files,
            commands::sync_native_audio,
            commands::stop_native_audio,
            commands::open_media_file,
            commands::open_media_file_fast,
            commands::inspect_media_tracks,
            commands::load_subtitle_file,
            commands::extract_subtitles_for_track,
            commands::get_eq_presets,
            commands::update_audio_eq,
            commands::update_subtitle_config,
            commands::update_playback_settings,
            commands::get_hardware_decoding,
            commands::set_hardware_decoding,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MyPlayer Tauri application");
}

