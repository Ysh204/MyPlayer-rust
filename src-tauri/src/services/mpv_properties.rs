pub const PROP_AUDIO_FILTER: &str = "af";
pub const PROP_AUDIO_DELAY: &str = "audio-delay";
pub const PROP_SUB_POS: &str = "sub-pos";
pub const PROP_SUB_SCALE: &str = "sub-scale";
pub const PROP_SUB_DELAY: &str = "sub-delay";
pub const PROP_HWDEC: &str = "hwdec";
pub const PROP_HR_SEEK: &str = "hr-seek";

pub struct MpvProperties;

impl MpvProperties {
    pub fn hwdec_value(enabled: bool) -> &'static str {
        if enabled { "auto-safe" } else { "no" }
    }

    pub fn hr_seek_value(precision: bool) -> &'static str {
        if precision { "yes" } else { "no" }
    }
}

