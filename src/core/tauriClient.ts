import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { EqPreset, EqState, SubtitleConfig } from './types';

const isTauri = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

const FALLBACK_PRESETS: EqPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [7.5, 5.0, 0.0, -1.0, 1.5] },
  { name: 'Vocal Clarity', gains: [-3.0, -1.5, 5.5, 4.5, 1.0] },
  { name: 'Cinema / Action', gains: [6.0, 3.5, -1.0, 3.0, 5.5] },
  { name: 'Rock', gains: [5.0, 3.0, -2.5, 3.5, 6.0] },
];

export const tauriClient = {
  async pickAndOpenVideo(): Promise<{ rawPath: string; assetUrl: string; cleanTitle: string } | null> {
    if (!isTauri) {
      return {
        rawPath: 'sample.mp4',
        assetUrl: '/sample_frame.jpg',
        cleanTitle: 'Dark Matter (2024)',
      };
    }
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Media', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flac', 'mp3'] }],
    });
    if (!selected || typeof selected !== 'string') return null;

    const res = await invoke<{ rawPath: string; cleanTitle: string }>('open_media_file', {
      path: selected,
    });
    return {
      rawPath: res.rawPath,
      assetUrl: convertFileSrc(res.rawPath),
      cleanTitle: res.cleanTitle,
    };
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

