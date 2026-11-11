use std::fs::File;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MediaTrack {
    pub id: String,
    pub title: String,
    pub language: Option<String>,
    pub codec: Option<String>,
    pub is_default: bool,
    pub file_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MediaTracksResult {
    pub audio_tracks: Vec<MediaTrack>,
    pub subtitle_tracks: Vec<MediaTrack>,
}

fn format_language_name(lang: Option<&str>) -> String {
    match lang.map(|s| s.to_lowercase()).as_deref() {
        Some("eng") | Some("en") => "English".to_string(),
        Some("spa") | Some("es") => "Spanish".to_string(),
        Some("fre") | Some("fra") | Some("fr") => "French".to_string(),
        Some("ger") | Some("deu") | Some("de") => "German".to_string(),
        Some("hin") | Some("hi") => "Hindi".to_string(),
        Some("jpn") | Some("ja") => "Japanese".to_string(),
        Some("ita") | Some("it") => "Italian".to_string(),
        Some("rus") | Some("ru") => "Russian".to_string(),
        Some("chi") | Some("zho") | Some("zh") => "Chinese".to_string(),
        Some("por") | Some("pt") => "Portuguese".to_string(),
        Some("kor") | Some("ko") => "Korean".to_string(),
        Some(code) if !code.trim().is_empty() => code.to_uppercase(),
        _ => "Track".to_string(),
    }
}

fn format_codec_name(codec_id: &str) -> &'static str {
    let c = codec_id.to_uppercase();
    if c.contains("EAC3") || c.contains("E_AC3") {
        "E-AC3 / DDP"
    } else if c.contains("AC3") {
        "AC3 Dolby Digital"
    } else if c.contains("AAC") {
        "AAC"
    } else if c.contains("DTS") {
        "DTS"
    } else if c.contains("TRUEHD") {
        "Dolby TrueHD"
    } else if c.contains("FLAC") {
        "FLAC"
    } else if c.contains("OPUS") {
        "Opus"
    } else if c.contains("VORBIS") {
        "Vorbis"
    } else if c.contains("UTF8") {
        "SRT"
    } else if c.contains("ASS") {
        "ASS"
    } else if c.contains("SSA") {
        "SSA"
    } else if c.contains("PGS") || c.contains("HDMV") {
        "PGS"
    } else if c.contains("VOBSUB") {
        "VobSub"
    } else {
        ""
    }
}

pub fn inspect_media_file(file_path: &str) -> MediaTracksResult {
    let mut result = MediaTracksResult::default();
    let path = Path::new(file_path);

    // 1. Try parsing Matroska (.mkv, .webm)
    if let Ok(file) = File::open(path) {
        if let Ok(mkv) = matroska::Matroska::open(file) {
            for track in mkv.tracks {
                let track_num = track.number;
                let lang_str = track.language.map(|l| format!("{}", l));
                let lang_name = format_language_name(lang_str.as_deref());
                let codec_short = format_codec_name(&track.codec_id);
                let codec = Some(track.codec_id.clone());
                let is_default = track.default;

                match track.tracktype {
                    matroska::Tracktype::Audio => {
                        let channels_str = match &track.settings {
                            matroska::Settings::Audio(a) => match a.channels {
                                1 => " [Mono]",
                                2 => " [Stereo 2.0]",
                                6 => " [5.1 Surround]",
                                8 => " [7.1 Surround]",
                                _ => "",
                            },
                            _ => "",
                        };

                        let title = if let Some(ref name) = track.name {
                            if !name.trim().is_empty() {
                                format!("{}{}", name.trim(), channels_str)
                            } else {
                                format!("{}{} (Track {})", lang_name, channels_str, track_num)
                            }
                        } else {
                            let codec_label = if !codec_short.is_empty() {
                                format!(" - {}", codec_short)
                            } else {
                                "".to_string()
                            };
                            format!("{}{}{} (Track {})", lang_name, codec_label, channels_str, track_num)
                        };

                        result.audio_tracks.push(MediaTrack {
                            id: format!("audio-{}", track_num),
                            title,
                            language: lang_str,
                            codec,
                            is_default,
                            file_path: None,
                        });
                    }
                    matroska::Tracktype::Subtitle => {
                        let title = if let Some(ref name) = track.name {
                            if !name.trim().is_empty() {
                                name.trim().to_string()
                            } else {
                                format!("{} [Embedded] (Track {})", lang_name, track_num)
                            }
                        } else {
                            let codec_label = if !codec_short.is_empty() {
                                format!(" [{}]", codec_short)
                            } else {
                                "".to_string()
                            };
                            format!("{}{} (Track {})", lang_name, codec_label, track_num)
                        };

                        result.subtitle_tracks.push(MediaTrack {
                            id: format!("sub-{}", track_num),
                            title,
                            language: lang_str,
                            codec,
                            is_default,
                            file_path: None,
                        });
                    }
                    _ => {}
                }
            }
        }
    }

    // 2. Fallback: If no audio tracks detected, provide primary stream
    if result.audio_tracks.is_empty() {
        result.audio_tracks.push(MediaTrack {
            id: "audio-default".to_string(),
            title: "Primary Audio (Default / Stereo / 5.1)".to_string(),
            language: Some("en".to_string()),
            codec: None,
            is_default: true,
            file_path: None,
        });
    }

    // 3. Scan directory for matching external sidecar subtitle files
    if let Some(parent) = path.parent() {
        let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        scan_sidecar_subtitles(parent, stem, &mut result.subtitle_tracks);

        // Also check "subtitles", "Subs", or "Sub" subdirectory if present
        for sub_dir_name in &["subtitles", "Subtitles", "subs", "Subs", "sub", "Sub"] {
            let sub_dir = parent.join(sub_dir_name);
            if sub_dir.is_dir() {
                scan_sidecar_subtitles(&sub_dir, "", &mut result.subtitle_tracks);
            }
        }
    }

    result
}

fn scan_sidecar_subtitles(dir: &Path, stem: &str, out: &mut Vec<MediaTrack>) {
    let sub_exts = ["srt", "vtt", "ass", "ssa", "sub"];
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                    if sub_exts.contains(&ext.to_lowercase().as_str()) {
                        let file_name = p.file_name().and_then(|f| f.to_str()).unwrap_or("");
                        if stem.is_empty() || file_name.to_lowercase().contains(&stem.to_lowercase()) {
                            let full_path_str = p.to_string_lossy().to_string();
                            if !out.iter().any(|t| t.file_path.as_deref() == Some(&full_path_str)) {
                                let lang = detect_language_from_name(file_name);
                                out.push(MediaTrack {
                                    id: format!("ext-{}", out.len() + 1),
                                    title: file_name.to_string(),
                                    language: lang,
                                    codec: Some(ext.to_uppercase()),
                                    is_default: false,
                                    file_path: Some(full_path_str),
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}

fn detect_language_from_name(name: &str) -> Option<String> {
    let lower = name.to_lowercase();
    if lower.contains(".en.") || lower.contains(".eng.") || lower.contains("english") {
        Some("en".to_string())
    } else if lower.contains(".es.") || lower.contains(".spa.") || lower.contains("spanish") {
        Some("es".to_string())
    } else if lower.contains(".fr.") || lower.contains(".fre.") || lower.contains("french") {
        Some("fr".to_string())
    } else if lower.contains(".hi.") || lower.contains(".hin.") || lower.contains("hindi") {
        Some("hi".to_string())
    } else if lower.contains(".de.") || lower.contains(".ger.") || lower.contains("german") {
        Some("de".to_string())
    } else if lower.contains(".ja.") || lower.contains(".jpn.") || lower.contains("japanese") {
        Some("ja".to_string())
    } else {
        None
    }
}
