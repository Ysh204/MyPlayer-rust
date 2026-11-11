use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EqPreset {
    pub name: String,
    pub gains: [f64; 5],
}

impl EqPreset {
    pub fn built_in_presets() -> Vec<Self> {
        vec![
            Self {
                name: "Flat".to_string(),
                gains: [0.0, 0.0, 0.0, 0.0, 0.0],
            },
            Self {
                name: "Bass Boost".to_string(),
                gains: [7.5, 5.0, 0.0, -1.0, 1.5],
            },
            Self {
                name: "Vocal Clarity".to_string(),
                gains: [-3.0, -1.5, 5.5, 4.5, 1.0],
            },
            Self {
                name: "Cinema / Action".to_string(),
                gains: [6.0, 3.5, -1.0, 3.0, 5.5],
            },
            Self {
                name: "Rock".to_string(),
                gains: [5.0, 3.0, -2.5, 3.5, 6.0],
            },
        ]
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EqState {
    pub frequencies: [u32; 5],
    pub gains: [f64; 5],
    pub preamp_db: f64,
    pub audio_delay_sec: f64,
    pub compressor: bool,
    pub active_preset: String,
}

impl Default for EqState {
    fn default() -> Self {
        Self {
            frequencies: [60, 230, 910, 3600, 14000],
            gains: [0.0, 0.0, 0.0, 0.0, 0.0],
            preamp_db: 0.0,
            audio_delay_sec: 0.0,
            compressor: false,
            active_preset: "Flat".to_string(),
        }
    }
}

