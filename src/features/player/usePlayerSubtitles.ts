import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { parseSubtitles, plainSubtitle } from '../../core/subtitleParser';
import { tauriClient } from '../../core/tauriClient';
import type { SubtitleCue, TrackInfo } from '../../core/types';
import { labelTracks } from '../../core/trackLabels';

const OFF = { id: 'off', title: 'Off' };

export function usePlayerSubtitles(videoRef: RefObject<HTMLVideoElement>, showStatus: (message: string) => void) {
  const [tracks, setTracks] = useState<TrackInfo[]>([OFF]);
  const [selected, setSelected] = useState(OFF.id);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  // Tracks are sorted by start time. A running end time also indexes
  // overlapping captions whose individual end times can be out of order.
  const endTimes = useMemo(() => {
    let lastEnd = -Infinity;
    return cues.map(({ end }) => (lastEnd = Math.max(lastEnd, end)));
  }, [cues]);
  const selectedRef = useRef(OFF.id);
  const autoSelect = useRef(true);
  const request = useRef(0);
  const mediaPath = useRef<string>();
  const imported = useRef(new Map<string, SubtitleCue[]>());

  const select = useCallback(async (id: string, options: TrackInfo[]) => {
    const track = options.find((item) => item.id === id);
    if (!track) return;
    autoSelect.current = false;
    if (selectedRef.current === id) return;
    const generation = ++request.current;
    selectedRef.current = id;
    setSelected(id);
    setCues([]);
    const native = videoRef.current?.textTracks;
    const nativeIndex = id.startsWith('native:') ? Number(id.slice(7)) : -1;
    if (native) {
      for (let index = 0; index < native.length; index++) native[index].mode = index === nativeIndex ? 'hidden' : 'disabled';
    }
    try {
      const path = mediaPath.current;
      const next = imported.current.get(id)
        ?? (track.filePath ? parseSubtitles(await tauriClient.loadSubtitle(track.filePath))
          : path && id.startsWith('sub-') ? await tauriClient.extractSubtitles(path, Number(id.slice(4))) : null);
      if (request.current !== generation) return;
      if (next?.length) setCues(
        id.startsWith('sub-') ? next.map((cue) => ({ ...cue, text: plainSubtitle(cue.text) })) : next,
      );
      if (next && !next.length) {
        selectedRef.current = OFF.id;
        setSelected(OFF.id);
        showStatus('This subtitle track has no supported text cues');
      }
    } catch {
      if (request.current !== generation) return;
      selectedRef.current = OFF.id;
      setSelected(OFF.id);
      showStatus('Could not load the subtitle track');
    }
  }, [showStatus, videoRef]);

  const reset = useCallback((path?: string) => {
    ++request.current;
    mediaPath.current = path;
    imported.current.clear();
    selectedRef.current = OFF.id;
    autoSelect.current = true;
    setSelected(OFF.id);
    setTracks([OFF]);
    setCues([]);
    for (const track of Array.from(videoRef.current?.textTracks ?? [])) track.mode = 'disabled';
  }, [videoRef]);

  const register = useCallback((options: TrackInfo[]) => {
    setTracks((previous) => [...previous, ...options.filter((item) => !previous.some(({ id }) => id === item.id))]);
    const defaultTrack = options.find((item) => item.isDefault);
    if (defaultTrack && autoSelect.current && selectedRef.current === OFF.id) void select(defaultTrack.id, options);
  }, [select]);

  const load = useCallback(async (name: string, read: () => Promise<string>, stillActive: () => boolean) => {
    try {
      const parsed = parseSubtitles(await read());
      if (!stillActive()) return;
      if (!parsed.length) {
        showStatus('This file has no supported subtitle cues');
        return;
      }
      const track = { id: `external:${crypto.randomUUID()}`, title: name };
      imported.current.set(track.id, parsed);
      setTracks((previous) => [...previous, track]);
      await select(track.id, [track]);
      if (stillActive()) showStatus(`Loaded ${name}`);
    } catch {
      if (stillActive()) showStatus('Could not read the subtitle file');
    }
  }, [select, showStatus]);

  useEffect(() => {
    const native = videoRef.current?.textTracks;
    if (!native) return;
    const discover = () => {
      const options = Array.from(native).flatMap((track, index) => {
        if (track.kind !== 'captions' && track.kind !== 'subtitles') return [];
        const isDefault = track.mode === 'showing';
        if (isDefault) track.mode = 'hidden';
        return [{ id: `native:${index}`, title: track.label, language: track.language, isDefault }];
      });
      if (options.length) register(options);
    };
    native.addEventListener('addtrack', discover);
    native.addEventListener('change', discover);
    return () => {
      native.removeEventListener('addtrack', discover);
      native.removeEventListener('change', discover);
    };
  }, [register, videoRef]);

  function cueText(clock: number, delay: number) {
    if (selected === OFF.id) return '';
    const time = clock - delay;
    const nativeIndex = selected.startsWith('native:') ? Number(selected.slice(7)) : -1;
    const native = videoRef.current?.textTracks[nativeIndex];
    if (native) {
      const active = delay === 0 ? Array.from(native.activeCues ?? [])
        : Array.from(native.cues ?? []).filter((cue) => time >= cue.startTime && time < cue.endTime);
      return active
        .map((cue) => plainSubtitle((cue as VTTCue).text ?? '')).join('\n');
    }
    let low = 0;
    let high = endTimes.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (endTimes[mid] <= time) low = mid + 1;
      else high = mid;
    }
    const lines = [];
    for (let i = low; i < cues.length && cues[i].start <= time; i++) {
      if (time < cues[i].end) lines.push(cues[i].text);
    }
    return lines.join('\n');
  }

  const labelled = useMemo(() => labelTracks(tracks, 0), [tracks]);
  return { tracks: labelled, selected, reset, register, load, cueText, select: (id: string) => select(id, tracks) };
}
