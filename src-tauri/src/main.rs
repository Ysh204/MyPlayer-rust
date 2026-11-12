#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(windows)]
    {
        // Enable Chromium experimental media features for multiple audio tracks in WebView2
        let current_args = std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
        let new_args = if current_args.is_empty() {
            "--enable-experimental-web-platform-features --enable-features=AudioVideoTracks".to_string()
        } else {
            format!("{} --enable-experimental-web-platform-features --enable-features=AudioVideoTracks", current_args)
        };
        std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", new_args);
    }

    my_player_lib::run();
}
