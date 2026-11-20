import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { EqState, TrackInfo } from '../../core/types';
import { createAudioOutput } from '../../core/audioOutput';

interface AudioTrack { enabled: boolean; label: string; language: string }
type TrackCollection = EventTarget & ArrayLike<AudioTrack>;

export function audioTrackList(video: HTMLVideoElement): TrackCollection | undefined {
  return (video as HTMLVideoElement & { audioTracks?: TrackCollection }).audioTracks;
}

export function readAudioTracks(video: HTMLVideoElement, inspected: TrackInfo[]) {
  const tracks = Array.from(audioTrackList(video) ?? []);
  return tracks.map((track, index) => ({
    id: `audio:${index}`,
    title: track.label || inspected[index]?.title || track.language || `Track ${index + 1}`,
    isDefault: track.enabled,
  }));
}

export function usePlayerAudio(videoRef: RefObject<HTMLVideoElement>, eq: EqState, volume: number, nativeAudio: boolean) {
  const context = useRef<AudioContext>();
  const output = useRef<ReturnType<typeof createAudioOutput>>();
  const latest = useRef({ eq, volume, nativeAudio });
  latest.current = { eq, volume, nativeAudio };

  const update = () => {
    const video = videoRef.current;
    if (!video) return;
    if (output.current) {
      output.current.update(latest.current.eq, latest.current.nativeAudio ? 0 : latest.current.volume);
    } else {
      video.volume = latest.current.nativeAudio ? 0 : Math.min(latest.current.volume / 100, 1);
    }
  };

  useEffect(update, [eq, volume, nativeAudio, videoRef]);

  useEffect(() => () => {
    const active = context.current;
    context.current = undefined;
    output.current = undefined;
    if (active) void active.close();
  }, []);

  return function prepareAudio() {
    const video = videoRef.current;
    if (!video || typeof AudioContext === 'undefined') return;
    try {
      const active = context.current ?? new AudioContext();
      context.current = active;
      const connect = () => {
        if (context.current !== active) return;
        output.current ??= createAudioOutput(active, video);
        update();
      };
      if (active.state === 'running') connect();
      else void active.resume().then(connect).catch(() => {});
    } catch {
      // Keep native output if Web Audio cannot initialize.
    }
  };
}
