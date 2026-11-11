use crate::data::models::subtitle_style::SubtitleConfig;

#[derive(Debug, Default)]
pub struct SubtitleService {
    pub current_config: SubtitleConfig,
}

impl SubtitleService {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn apply_subtitle_framing(&mut self, config: &SubtitleConfig) {
        self.current_config = config.clone();
    }

    pub fn load_external_subtitle(&mut self, path: &str) {
        self.current_config.external_file_path = Some(path.to_string());
    }
}

