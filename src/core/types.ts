export interface EqPreset {
  name: string;
  gains: [number, number, number, number, number];
}

export interface EqState {
  frequencies: [number, number, number, number, number];
  gains: [number, number, number, number, number];
  preamp_db: number;
  audio_delay_sec: number;
  compressor: boolean;
  active_preset: string;
}

export interface SubtitleConfig {
  vertical_position: number; // 10% to 105% (letterbox bottom)
  scale: number;
  delay_seconds: number;
  font_size: number;
  background_opacity: number;
  external_file_path?: string | null;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface PlaylistItem {
  id: string;
  uri: string;
  title: string;
}

export interface TrackInfo {
  id: string;
  title?: string;
  language?: string;
  codec?: string;
  isDefault?: boolean;
  filePath?: string;
}

export type DrawerPanel = 'none' | 'audio' | 'subtitles' | 'playlist';

