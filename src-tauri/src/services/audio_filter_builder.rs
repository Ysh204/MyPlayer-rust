use crate::data::models::eq_state::EqState;

/// Builds one FFmpeg libavfilter graph for mpv's `af` property.
///
/// The graph is empty when there are no active effects, which clears the
/// existing audio filter chain when applied to the player.
pub fn build_audio_filter(eq: &EqState) -> String {
    let mut filters = Vec::new();

    if eq.preamp_db.abs() >= 0.05 {
        filters.push(format!("volume={:.1}dB", eq.preamp_db));
    }

    for (freq, gain) in eq.frequencies.iter().zip(eq.gains.iter()) {
        if gain.abs() >= 0.05 {
            filters.push(format!("equalizer=f={}:width_type=o:w=1:g={:.1}", freq, gain));
        }
    }

    if eq.compressor {
        filters.push("acompressor".to_string());
    }

    if filters.is_empty() {
        String::new()
    } else {
        format!("lavfi=[{}]", filters.join(","))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_filter() {
        let eq = EqState::default();
        assert_eq!(build_audio_filter(&eq), "");
    }

    #[test]
    fn test_preamp_and_band() {
        let mut eq = EqState::default();
        eq.preamp_db = 3.5;
        eq.gains[0] = 5.0;
        let result = build_audio_filter(&eq);
        assert_eq!(result, "lavfi=[volume=3.5dB,equalizer=f=60:width_type=o:w=1:g=5.0]");
    }

    #[test]
    fn test_compressor() {
        let mut eq = EqState::default();
        eq.compressor = true;
        let result = build_audio_filter(&eq);
        assert_eq!(result, "lavfi=[acompressor]");
    }
}

