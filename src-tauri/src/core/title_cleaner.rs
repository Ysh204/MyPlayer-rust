use std::path::Path;
use regex::Regex;

/// Cleans raw video filenames by stripping scene tags, hashes, and codec labels
/// into a clean, human-readable title.
pub fn clean_media_title(raw: &str) -> String {
    let raw_trimmed = raw.trim();
    if raw_trimmed.is_empty() {
        return String::new();
    }

    let path = Path::new(raw_trimmed);
    let file_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(raw_trimmed);

    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(file_name);

    let mut base = stem.to_string();

    // Common scene cutoff tags
    let cutoff_pattern = r"(?i)[\.\s_\-\[(]+(?:1080p|720p|480p|2160p|4k|uhd|web-?dl|webrip|bluray|bdrip|brrip|dvdrip|h\.?264|h\.?265|hevc|x264|x265|aac|dts|ddp5\.1|ac3|atmos|hdr\b|10bit|remux|proper|repack)";
    if let Ok(cutoff_regex) = Regex::new(cutoff_pattern) {
        if let Some(m) = cutoff_regex.find(&base) {
            base = base[..m.start()].to_string();
        }
    }

    // Replace dots and underscores with spaces
    let dots_regex = Regex::new(r"[\._]+").unwrap();
    let mut clean_part = dots_regex.replace_all(&base, " ").to_string();

    let hyphen_regex = Regex::new(r"\s+-\s+").unwrap();
    clean_part = hyphen_regex.replace_all(&clean_part, " - ").to_string();

    let spaces_regex = Regex::new(r"\s+").unwrap();
    clean_part = spaces_regex.replace_all(&clean_part, " ").trim().to_string();

    // If title has a 4-digit release year at the end, format as (YYYY)
    let year_regex = Regex::new(r"^(.*?)\s+(19\d\d|20\d\d)$").unwrap();
    if let Some(caps) = year_regex.captures(&clean_part) {
        if let (Some(title), Some(year)) = (caps.get(1), caps.get(2)) {
            clean_part = format!("{} ({})", title.as_str(), year.as_str());
        }
    }

    // Format S01E01 nicely: e.g. "War S01E01 It's Done" -> "War S01E01 - It's Done"
    let se_regex = Regex::new(r"^(.*?)\s+([sS]\d{1,2}[eE]\d{1,2})\s+(.+)$").unwrap();
    if let Some(caps) = se_regex.captures(&clean_part) {
        let ep_title = caps.get(3).map(|m| m.as_str()).unwrap_or("");
        if !ep_title.starts_with('-') {
            clean_part = format!(
                "{} {} - {}",
                caps.get(1).map(|m| m.as_str()).unwrap_or(""),
                caps.get(2).map(|m| m.as_str()).unwrap_or("").to_uppercase(),
                ep_title
            );
        }
    }

    // Strip leading/trailing hyphens or brackets
    let trim_regex = Regex::new(r"^[\s\-–—]+|[\s\-–—]+$").unwrap();
    clean_part = trim_regex.replace_all(&clean_part, "").trim().to_string();

    if !clean_part.is_empty() {
        clean_part
    } else {
        stem.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_media_title_movie() {
        let raw = "The.Matrix.1999.1080p.BluRay.x264.mp4";
        assert_eq!(clean_media_title(raw), "The Matrix (1999)");
    }

    #[test]
    fn test_clean_media_title_series() {
        let raw = "Breaking.Bad.S01E01.Pilot.720p.WEB-DL.mkv";
        assert_eq!(clean_media_title(raw), "Breaking Bad S01E01 - Pilot");
    }
}

