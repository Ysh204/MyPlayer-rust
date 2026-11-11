use std::time::Duration;

/// Formats a `Duration` into a human-readable timestamp (e.g. `01:23` or `1:02:03`).
pub fn format_duration(duration: Duration) -> String {
    let total_secs = duration.as_secs();
    let hours = total_secs / 3600;
    let minutes = (total_secs % 3600) / 60;
    let seconds = total_secs % 60;

    if hours > 0 {
        format!("{}:{:02}:{:02}", hours, minutes, seconds)
    } else {
        format!("{:02}:{:02}", minutes, seconds)
    }
}

/// Formats raw seconds (floating-point) into a human-readable timestamp.
pub fn format_seconds(seconds: f64) -> String {
    if !seconds.is_finite() || seconds < 0.0 {
        return "00:00".to_string();
    }
    format_duration(Duration::from_secs(seconds as u64))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_duration_short() {
        assert_eq!(format_duration(Duration::from_secs(65)), "01:05");
    }

    #[test]
    fn test_format_duration_long() {
        assert_eq!(format_duration(Duration::from_secs(3665)), "1:01:05");
    }

    #[test]
    fn test_format_seconds_zero() {
        assert_eq!(format_seconds(0.0), "00:00");
    }
}

