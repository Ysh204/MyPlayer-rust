use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SubtitleConfig {
    pub vertical_position: f64,
    pub scale: f64,
    pub delay_seconds: f64,
    pub font_size: f64,
    pub background_opacity: f64,
    pub external_file_path: Option<String>,
}

impl Default for SubtitleConfig {
    fn default() -> Self {
        Self {
            vertical_position: 92.0,
            scale: 1.0,
            delay_seconds: 0.0,
            font_size: 24.0,
            background_opacity: 0.65,
            external_file_path: None,
        }
    }
}

