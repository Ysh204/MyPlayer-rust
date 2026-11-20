import { invoke, convertFileSrc, isTauri } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { EqPreset, PlaylistItem, SubtitleCue, TrackInfo } from './types';

export const isDesktop = isTauri();
export const videoExtensions = ['mp4', 'm4v', 'mkv', 'webm', 'mov', 'avi', 'ogv', 'flac', 'mp3', 'm4a', 'wav', 'ogg', 'opus'];
export const subtitleExtensions = ['srt', 'vtt', 'ass', 'ssa', 'sub'];

export function isSubtitleFile(path: string) {
  return subtitleExtensions.includes(path.split('.').pop()?.toLowerCase() ?? '');
}

export const tauriClient = {
  async pickMedia(): Promise<string[]> {
    const selected = await open({ multiple: true, filters: [{ name: 'Media', extensions: videoExtensions }] });
    return Array.isArray(selected) ? selected : selected ? [selected] : [];
  },

  async pickSubtitle(): Promise<string | null> {
    return open({ filters: [{ name: 'Subtitles', extensions: subtitleExtensions }] });
  },

  localMedia(path: string): PlaylistItem {
    return {
      id: path,
      path,
      uri: convertFileSrc(path),
      title: path.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'Untitled video',
    };
  },

  inspectMedia(path: string) {
    return invoke<{ audioTracks: TrackInfo[]; subtitleTracks: TrackInfo[] }>('inspect_media_tracks', { path });
  },

  loadSubtitle(path: string) {
    return invoke<string>('load_subtitle_file', { path });
  },

  extractSubtitles(path: string, trackNum: number) {
    return invoke<SubtitleCue[]>('extract_subtitles_for_track', { path, trackNum });
  },

  async getEqPresets(): Promise<EqPreset[]> {
    if (isDesktop) return invoke<EqPreset[]>('get_eq_presets');
    return [
      { name: 'Flat', gains: [0, 0, 0, 0, 0] },
      { name: 'Bass Boost', gains: [7.5, 5, 0, -1, 1.5] },
      { name: 'Vocal Clarity', gains: [-3, -1.5, 5.5, 4.5, 1] },
      { name: 'Cinema / Action', gains: [6, 3.5, -1, 3, 5.5] },
      { name: 'Rock', gains: [5, 3, -2.5, 3.5, 6] },
    ];
  },

  getHardwareDecoding() {
    return invoke<boolean | null>('get_hardware_decoding');
  },

  setHardwareDecoding(enabled: boolean) {
    return invoke<void>('set_hardware_decoding', { enabled });
  },

  async saveFrame(name: string, blob: Blob) {
    const path = await save({ defaultPath: name, filters: [{ name: 'PNG image', extensions: ['png'] }] });
    if (!path) return false;
    await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    return true;
  },
};
