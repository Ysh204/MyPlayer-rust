import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { EqPreset, EqState, SubtitleConfig, TrackInfo } from './types';

const isTauri = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

const FALLBACK_PRESETS: EqPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [7.5, 5.0, 0.0, -1.0, 1.5] },
  { name: 'Vocal Clarity', gains: [-3.0, -1.5, 5.5, 4.5, 1.0] },
  { name: 'Cinema / Action', gains: [6.0, 3.5, -1.0, 3.0, 5.5] },
  { name: 'Rock', gains: [5.0, 3.0, -2.5, 3.5, 6.0] },
];

export interface OpenMediaResult {
  rawPath: string;
  assetUrl: string;
  cleanTitle: string;
  audioTracks?: TrackInfo[];
  subtitleTracks?: TrackInfo[];
}

export const tauriClient = {
  async pickAndOpenVideo(): Promise<OpenMediaResult | null> {
    if (!isTauri) {
      return {
        rawPath: 'sample.mp4',
        assetUrl: '/sample_frame.jpg',
        cleanTitle: 'Dark Matter (2024)',
        audioTracks: [
          { id: 'audio-0', title: 'English [Dolby 5.1 Surround]', language: 'en', isDefault: true },
          { id: 'audio-1', title: 'English [Stereo 2.0]', language: 'en' },
          { id: 'audio-2', title: 'Director’s Commentary', language: 'en' },
        ],
        subtitleTracks: [
          { id: 'sub-0', title: 'English [CC] (Full Dialogue)', language: 'en', isDefault: true },
          { id: 'sub-1', title: 'Spanish (Español Latino)', language: 'es' },
          { id: 'sub-2', title: 'French (Français)', language: 'fr' },
        ],
      };
    }
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Media', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flac', 'mp3'] }],
    });
    if (!selected || typeof selected !== 'string') return null;

    return this.openFilePath(selected);
  },

  async openFilePath(path: string): Promise<OpenMediaResult | null> {
    if (!isTauri) return null;
    const res = await invoke<{
      rawPath: string;
      cleanTitle: string;
      audioTracks: TrackInfo[];
      subtitleTracks: TrackInfo[];
    }>('open_media_file', {
      path,
    });
    return {
      rawPath: res.rawPath,
      assetUrl: convertFileSrc(res.rawPath),
      cleanTitle: res.cleanTitle,
      audioTracks: res.audioTracks,
      subtitleTracks: res.subtitleTracks,
    };
  },

  async loadSubtitleFile(filePath: string): Promise<string> {
    if (!isTauri) return '';
    return invoke<string>('load_subtitle_file', { path: filePath });
  },

  async syncAudioEq(eq: EqState): Promise<string> {
    if (!isTauri) {
      const parts: string[] = [];
      if (Math.abs(eq.preamp_db) >= 0.05) parts.push(`volume=${eq.preamp_db.toFixed(1)}dB`);
      eq.frequencies.forEach((f, i) => {
        if (Math.abs(eq.gains[i]) >= 0.05) {
          parts.push(`equalizer=f=${f}:width_type=o:w=1:g=${eq.gains[i].toFixed(1)}`);
        }
      });
      if (eq.compressor) parts.push('acompressor');
      return parts.length ? `lavfi=[${parts.join(',')}]` : '';
    }
    return invoke<string>('update_audio_eq', { eq });
  },

  async syncSubtitleConfig(config: SubtitleConfig): Promise<void> {
    if (!isTauri) return;
    return invoke('update_subtitle_config', { config });
  },

  async getEqPresets(): Promise<EqPreset[]> {
    if (!isTauri) return FALLBACK_PRESETS;
    return invoke<EqPreset[]>('get_eq_presets');
  },

  async syncPlaybackSettings(hardwareDecoding: boolean, autoResume: boolean): Promise<void> {
    if (!isTauri) return;
    return invoke('update_playback_settings', { hardwareDecoding, autoResume });
  },
};

