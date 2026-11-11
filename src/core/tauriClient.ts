import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { EqPreset, EqState, SubtitleConfig } from './types';

export const tauriClient = {
  async pickAndOpenVideo(): Promise<{ rawPath: string; assetUrl: string; cleanTitle: string } | null> {
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
    return invoke<string>('update_audio_eq', { eq });
  },

  async syncSubtitleConfig(config: SubtitleConfig): Promise<void> {
    return invoke('update_subtitle_config', { config });
  },

  async getEqPresets(): Promise<EqPreset[]> {
    return invoke<EqPreset[]>('get_eq_presets');
  },

  async syncPlaybackSettings(hardwareDecoding: boolean, autoResume: boolean): Promise<void> {
    return invoke('update_playback_settings', { hardwareDecoding, autoResume });
  },
};

