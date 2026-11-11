use crate::data::models::eq_state::EqState;
use crate::data::models::subtitle_style::SubtitleConfig;
use crate::services::audio_filter_builder::build_audio_filter;
use crate::services::subtitle_service::SubtitleService;

#[derive(Debug, Default)]
pub struct PlayerService {
    pub current_file: Option<String>,
    pub hardware_decoding: bool,
    pub audio_filter_chain: String,
    pub subtitle_service: SubtitleService,
}

impl PlayerService {
    pub fn new() -> Self {
        Self {
            current_file: None,
            hardware_decoding: true,
            audio_filter_chain: String::new(),
            subtitle_service: SubtitleService::new(),
        }
    }

    pub fn open_file(&mut self, path: &str) {
        self.current_file = Some(path.to_string());
    }

    pub fn apply_audio_settings(&mut self, eq: &EqState) {
        self.audio_filter_chain = build_audio_filter(eq);
    }

    pub fn apply_subtitle_settings(&mut self, config: &SubtitleConfig) {
        self.subtitle_service.apply_subtitle_framing(config);
    }

    pub fn set_hardware_decoding(&mut self, enabled: bool) {
        self.hardware_decoding = enabled;
    }
}

