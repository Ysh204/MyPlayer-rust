use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PlaybackPreferences {
    pub seek_step_seconds: u32,
    pub volume_step_percent: f64,
    pub precision_seeking: bool,
    pub hardware_decoding: bool,
    pub auto_resume: bool,
}

impl Default for PlaybackPreferences {
    fn default() -> Self {
        Self {
            seek_step_seconds: 5,
            volume_step_percent: 5.0,
            precision_seeking: true,
            hardware_decoding: true,
            auto_resume: true,
        }
    }
}

