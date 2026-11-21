import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEvent, MouseEvent } from 'react';
import { Disc3, FileVideo, FolderOpen, LoaderCircle } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isDesktop, isSubtitleFile, subtitleExtensions, tauriClient, videoExtensions } from '../../core/tauriClient';
import { readStorage, savedPositions, settingsKey, writeStorage } from '../../core/playbackStorage';
import type { DrawerPanel, EqPreset, EqState, PlaylistItem, SubtitleConfig, TrackInfo } from '../../core/types';
import { EqualizerPanel } from '../audio/EqualizerPanel';
import { SubtitlePanel } from '../subtitles/SubtitlePanel';
import { PlaylistPanel } from '../playlist/PlaylistPanel';
import { PlaybackMarksPanel } from '../marks/PlaybackMarksPanel';
import { usePlaybackMarks } from '../marks/usePlaybackMarks';
import { PlayerHome, useRecentFiles } from './PlayerHome';
import { PlaybackSettingsModal } from '../settings/PlaybackSettingsModal';
import type { PlaybackSettings } from '../settings/PlaybackSettingsModal';
import { BottomControlsBar } from './BottomControlsBar';
import { OsdOverlay } from './OsdOverlay';
import { PlayerContextMenu } from './PlayerContextMenu';
import type { MenuAnchor } from './PlayerContextMenu';
import { TopWindowBar } from './TopWindowBar';
import { audioTrackList, readAudioTracks, usePlayerAudio } from './usePlayerAudio';
import { usePlayerSubtitles } from './usePlayerSubtitles';
import { usePlaybackClock } from './usePlaybackClock';

const INITIAL_EQ: EqState = {
  frequencies: [60, 230, 910, 3600, 14000], gains: [0, 0, 0, 0, 0],
  preamp_db: 0, audio_delay_sec: 0, compressor: false, active_preset: 'Flat',
};
const INITIAL_SUB: SubtitleConfig = {
  vertical_position: 92, scale: 1, delay_seconds: 0, font_size: 24, background_opacity: 0.65,
};
const INITIAL_SETTINGS: PlaybackSettings = { autoResume: true, seekStep: 5, volumeStep: 5, precisionSeeking: true };
const MEDIA_ACCEPT = videoExtensions.map((extension) => '.' + extension).join(',');
const SUBTITLE_ACCEPT = subtitleExtensions.map((extension) => '.' + extension).join(',');
const nativeAudioCodecs: Record<string, string> = {
  A_EAC3: 'audio/mp4; codecs="ec-3"',
  A_AC3: 'audio/mp4; codecs="ac-3"',
  A_DTS: 'audio/mp4; codecs="dtsc"',
  A_TRUEHD: 'audio/mp4; codecs="mlpa"',
};
const SAMPLE: PlaylistItem[] = ['Are You Happy in Your Life', 'Trip of a Lifetime', 'The Box', 'The Corridor']
  .map((title, index) => ({ id: 'sample-' + index, uri: '/sample_frame.jpg', title: 'Dark Matter · ' + title }));
const preview = isDesktop ? new URLSearchParams() : new URLSearchParams(location.search);
const sampleEnabled = preview.get('sample') === 'true';
const initialDrawer = preview.get('drawer');
const isSample = (item: PlaylistItem | null) => item?.id.startsWith('sample-');

export function PlayerScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const subtitleInput = useRef<HTMLInputElement>(null);
  const addOnly = useRef(false);
  const [media, setMedia] = useState<PlaylistItem | null>(sampleEnabled ? SAMPLE[0] : null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(sampleEnabled ? SAMPLE : []);
  const [duration, setDuration] = useState(sampleEnabled ? 3245 : 0);
  const [playing, setPlaying] = useState(sampleEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSnapshot, setCanSnapshot] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(sampleEnabled ? 16 / 9 : 0);
  const [volume, setVolume] = useState(100);
  const previousVolume = useRef(100);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [drawer, setDrawer] = useState<DrawerPanel>(initialDrawer === 'audio' || initialDrawer === 'subtitles' || initialDrawer === 'playlist' || initialDrawer === 'marks' ? initialDrawer : 'none');
  const [menu, setMenu] = useState<MenuAnchor | null>(preview.get('menu') === 'true' ? { x: 430, y: 165 } : null);
  const [settingsOpen, setSettingsOpen] = useState(preview.get('settings') === 'true');
  const [settings, setSettings] = useState(() => ({ ...INITIAL_SETTINGS, ...readStorage<Partial<PlaybackSettings>>(settingsKey, {}) }));
  const [hardwareDecoding, setHardwareDecoding] = useState<boolean | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<number>();
  const hudTimer = useRef<number>();
  const bufferingTimer = useRef<number>();
  const resumeClock = useRef(0);
  const mediaGeneration = useRef(0);
  const blobUrls = useRef(new Set<string>());
  const [eq, setEq] = useState(INITIAL_EQ);
  const [presets, setPresets] = useState<EqPreset[]>([]);
  const inspectedAudio = useRef<TrackInfo[]>([]);
  const [audioTracks, setAudioTracks] = useState<TrackInfo[]>([]);
  const [selectedAudio, setSelectedAudio] = useState('');
  const [nativeAudioPath, setNativeAudioPath] = useState<string | null>(null);
  const nativeAudioErrorShown = useRef(false);
  const [subtitleConfig, setSubtitleConfig] = useState(INITIAL_SUB);

  const showStatus = useCallback((message: string) => {
    setStatus(message);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(null), 2300);
  }, []);
  const { tracks: subtitleTracks, selected: selectedSubtitle, reset: resetSubtitles, register: registerSubtitles,
    load: loadSubtitles, select: selectSubtitle, cueText } = usePlayerSubtitles(videoRef, showStatus);
  const nativeAudio = Boolean(media?.path && nativeAudioPath === media.path);
  const prepareAudio = usePlayerAudio(videoRef, eq, volume, nativeAudio);

  const sample = Boolean(isSample(media));
  const { currentTime, seek, seekExact, seekBy, getPosition, finishSeek, readClock, resetClock } = usePlaybackClock(
    videoRef, duration, playing, sample, settings.precisionSeeking, sampleEnabled ? 1482 : 0,
  );
  const index = playlist.findIndex(({ id }) => id === media?.id);
  const previous = index > 0 ? playlist[index - 1] : undefined;
  const next = index >= 0 ? playlist[index + 1] : undefined;
  const openingMedia = loading && duration === 0;
  const canHide = Boolean(media && !openingMedia && !error && drawer === 'none' && !menu && !settingsOpen);
  const hudHidden = canHide && !controlsVisible;
  const hasTransport = Boolean(media);
  const marks = usePlaybackMarks({ media, videoRef, getPosition, duration, onStatus: showStatus, onSeek: seekExact });
  const { recentFiles, rememberFile, clearRecent } = useRecentFiles();
  const showControls = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hudTimer.current);
    if (canHide) hudTimer.current = window.setTimeout(() => {
      if (!rootRef.current?.querySelector('.transport-zone:hover, .window-bar:hover, .transport :focus-visible, .window-bar :focus-visible')) {
        setControlsVisible(false);
      }
    }, 2100);
  }, [canHide]);

  useEffect(() => {
    showControls();
    return () => window.clearTimeout(hudTimer.current);
  }, [showControls]);

  useEffect(() => {
    const urls = blobUrls.current;
    void tauriClient.getEqPresets().then(setPresets).catch(() => showStatus('Could not load equalizer presets'));
    if (isDesktop) void tauriClient.getHardwareDecoding().then(setHardwareDecoding).catch(() => {});
    return () => {
      window.clearTimeout(statusTimer.current);
      window.clearTimeout(bufferingTimer.current);
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, [showStatus]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([{ contentRect }]) => setSize({ width: contentRect.width, height: contentRect.height }));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const updateTracks = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = readAudioTracks(video, inspectedAudio.current);
    setAudioTracks(tracks);
    setSelectedAudio(tracks.find((track) => track.isDefault)?.id ?? '');
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const tracks = video && audioTrackList(video);
    tracks?.addEventListener('addtrack', updateTracks);
    tracks?.addEventListener('removetrack', updateTracks);
    tracks?.addEventListener('change', updateTracks);
    return () => {
      tracks?.removeEventListener('addtrack', updateTracks);
      tracks?.removeEventListener('removetrack', updateTracks);
      tracks?.removeEventListener('change', updateTracks);
    };
  }, [updateTracks]);

  useEffect(() => {
    if (!media?.path) return;
    const path = media.path;
    let active = true;
    void tauriClient.inspectMedia(path).then((tracks) => {
      if (!active) return;
      inspectedAudio.current = tracks.audioTracks;
      updateTracks();
      registerSubtitles(tracks.subtitleTracks);
      const audioCodec = tracks.audioTracks.find((track) => track.isDefault)?.codec ?? tracks.audioTracks[0]?.codec;
      if (audioCodec && nativeAudioCodecs[audioCodec] &&
        !videoRef.current?.canPlayType(nativeAudioCodecs[audioCodec])) {
        setNativeAudioPath(path);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [media, registerSubtitles, updateTracks]);

  useEffect(() => {
    if (!nativeAudioPath) return;
    return () => { void tauriClient.stopNativeAudio(nativeAudioPath); };
  }, [nativeAudioPath]);

  useEffect(() => {
    if (!nativeAudio || !media?.path) return;
    const path = media.path;
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    const sync = () => {
      const audioPlaying = !video.paused && !video.ended && !video.seeking && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
      void tauriClient.syncNativeAudio(path, video.currentTime, audioPlaying, volume, eq, video.playbackRate, video.seeking).then((state) => {
        if (active && state.error && !nativeAudioErrorShown.current) {
          nativeAudioErrorShown.current = true;
          showStatus(state.error);
        }
      }).catch((reason) => {
        if (active && !nativeAudioErrorShown.current) {
          nativeAudioErrorShown.current = true;
          showStatus(String(reason));
        }
      });
    };
    const events = ['seeking', 'seeked', 'playing', 'waiting', 'pause', 'ratechange', 'ended'];
    events.forEach((event) => video.addEventListener(event, sync));
    sync();
    const timer = window.setInterval(sync, 250);
    return () => {
      active = false;
      window.clearInterval(timer);
      events.forEach((event) => video.removeEventListener(event, sync));
    };
  }, [media?.path, nativeAudio, volume, eq, showStatus]);

  const savePosition = useCallback(() => {
    const video = videoRef.current;
    if (settings.autoResume && media?.path && video?.readyState && !video.error) {
      savedPositions.save(media.path, getPosition(), video.duration);
    }
  }, [media, settings.autoResume, getPosition]);

  useEffect(() => {
    const saveOnHide = () => { if (document.visibilityState === 'hidden') savePosition(); };
    window.addEventListener('pagehide', savePosition);
    document.addEventListener('visibilitychange', saveOnHide);
    return () => {
      window.removeEventListener('pagehide', savePosition);
      document.removeEventListener('visibilitychange', saveOnHide);
    };
  }, [savePosition]);

  function selectMedia(item: PlaylistItem | null) {
    if (item === media && !error) {
      if (item && !playing) togglePlay();
      return;
    }
    savePosition();
    ++mediaGeneration.current;
    videoRef.current?.pause();
    resetSubtitles(item?.path);
    inspectedAudio.current = [];
    setNativeAudioPath(null);
    nativeAudioErrorShown.current = false;
    setAudioTracks([]);
    setSelectedAudio('');
    resetClock(0);
    window.clearTimeout(bufferingTimer.current);
    setDuration(isSample(item) ? 3245 : 0);
    setAspectRatio(isSample(item) ? 16 / 9 : 0);
    setCanSnapshot(false);
    setError(null);
    setLoading(Boolean(item && !isSample(item)));
    setPlaying(Boolean(isSample(item)));
    setMedia(item);
    resumeClock.current = 0;
    if (item && item.uri === media?.uri && !isSample(item)) videoRef.current?.load();
  }

  function openItems(items: PlaylistItem[], append: boolean) {
    if (!items.length) return;
    prepareAudio();
    setPlaylist((queue) => [...new Map([...queue, ...items].map((item) => [item.id, item])).values()]);
    if (!append || !media) selectMedia(items[0]);
  }

  function createBrowserMedia(file: File) {
    const id = 'file:' + file.name + ':' + file.size + ':' + file.lastModified;
    const queued = playlist.find((item) => item.id === id);
    if (queued) return queued;
    const uri = URL.createObjectURL(file);
    blobUrls.current.add(uri);
    return { id, uri, title: file.name.replace(/\.[^/.]+$/, '') || file.name };
  }

  async function openFile(append = false) {
    prepareAudio();
    if (!isDesktop) {
      addOnly.current = append;
      mediaInput.current?.click();
      return;
    }
    try {
      openItems((await tauriClient.pickMedia()).map(tauriClient.localMedia), append);
    } catch {
      showStatus('Could not open the file picker');
    }
  }

  async function openSubtitle() {
    if (!media) return;
    const generation = mediaGeneration.current;
    if (!isDesktop) {
      subtitleInput.current?.click();
      return;
    }
    try {
      const path = await tauriClient.pickSubtitle();
      if (path) await loadSubtitles(path.split(/[\\/]/).pop() || path, () => tauriClient.loadSubtitle(path), () => mediaGeneration.current === generation);
    } catch {
      showStatus('Could not open the subtitle picker');
    }
  }

  const nativeDrop = useRef<(paths: string[]) => void>(() => {});
  nativeDrop.current = (paths) => {
    const videos = paths.filter((path) => !isSubtitleFile(path)).map(tauriClient.localMedia);
    openItems(videos, drawer === 'playlist');
    const generation = mediaGeneration.current;
    const subtitles = paths.filter(isSubtitleFile);
    if (subtitles.length && !media && !videos.length) showStatus('Open a video before adding subtitles');
    else for (const path of subtitles) {
      void loadSubtitles(path.split(/[\\/]/).pop() || path, () => tauriClient.loadSubtitle(path), () => mediaGeneration.current === generation);
    }
  };

  useEffect(() => {
    if (!isDesktop) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void tauriClient.getLaunchFiles().then((paths) => {
      if (!disposed && paths.length) nativeDrop.current(paths);
    }).catch(() => {});
    void getCurrentWindow().onDragDropEvent(({ payload }) => {
      if (payload.type === 'enter') setDragging(true);
      if (payload.type === 'leave' || payload.type === 'drop') setDragging(false);
      if (payload.type === 'drop') nativeDrop.current(payload.paths);
    }).then((stop) => { if (disposed) stop(); else unlisten = stop; }).catch(() => {});
    return () => { disposed = true; unlisten?.(); };
  }, []);

  function dropFiles(event: DragEvent) {
    if (isDesktop || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    const videos = files.filter((file) => !isSubtitleFile(file.name)).map(createBrowserMedia);
    openItems(videos, drawer === 'playlist');
    const generation = mediaGeneration.current;
    const subtitles = files.filter((file) => isSubtitleFile(file.name));
    if (subtitles.length && !media && !videos.length) showStatus('Open a video before adding subtitles');
    else for (const file of subtitles) void loadSubtitles(file.name, () => file.text(), () => mediaGeneration.current === generation);
  }

  function forgetItem(item: PlaylistItem) {
    if (blobUrls.current.delete(item.uri)) URL.revokeObjectURL(item.uri);
  }

  function removeItem(id: string) {
    const at = playlist.findIndex((item) => item.id === id);
    if (at < 0) return;
    if (media?.id === id) selectMedia(playlist[at + 1] ?? playlist[at - 1] ?? null);
    forgetItem(playlist[at]);
    setPlaylist((queue) => queue.filter((item) => item.id !== id));
  }

  function moveItem(id: string, before: string | null) {
    if (id === before) return;
    setPlaylist((queue) => {
      const item = queue.find((entry) => entry.id === id);
      if (!item) return queue;
      const reordered = queue.filter((entry) => entry.id !== id);
      const at = reordered.findIndex((entry) => entry.id === before);
      reordered.splice(at < 0 ? reordered.length : at, 0, item);
      return reordered;
    });
  }

  function playVideo() {
    const video = videoRef.current;
    if (!video) return;
    prepareAudio();
    const generation = mediaGeneration.current;
    void video.play().catch((reason: DOMException) => {
      if (mediaGeneration.current !== generation || reason.name === 'AbortError') return;
      setLoading(false);
      if (reason.name === 'NotAllowedError') showStatus('Press Play to start');
    });
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!media || error || !video) return;
    if (sample) setPlaying((value) => !value);
    else if (video.paused) playVideo();
    else video.pause();
  }

  function finishBuffering() {
    window.clearTimeout(bufferingTimer.current);
    setLoading(false);
  }

  function changeVolume(value: number) {
    prepareAudio();
    const nextVolume = Math.max(0, Math.min(150, value));
    if (nextVolume > 0) previousVolume.current = nextVolume;
    setVolume(nextVolume);
  }

  function mute() {
    changeVolume(volume ? 0 : previousVolume.current);
  }

  function selectAudio(id: string) {
    const video = videoRef.current;
    const tracks = video && audioTrackList(video);
    const index = Number(id.split(':')[1]);
    if (!tracks?.[index]) return;
    tracks[index].enabled = true;
    for (let i = 0; i < tracks.length; i++) if (i !== index) tracks[i].enabled = false;
    updateTracks();
  }

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  async function changeFullscreen(enabled: boolean) {
    try {
      if (isDesktop) {
        await getCurrentWindow().setFullscreen(enabled);
        setFullscreen(enabled);
      } else if (enabled) {
        await rootRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showStatus('Fullscreen is unavailable');
    }
  }

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    if (menu?.trigger) { setMenu(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({ x: rect.right, y: rect.top - 6, above: true, trigger: event.currentTarget });
  }

  const closeMenu = useCallback((restoreFocus?: boolean) => {
    if (restoreFocus) menu?.trigger?.focus();
    setMenu(null);
  }, [menu]);

  async function saveFrame() {
    const video = videoRef.current;
    if (!video || !media || !canSnapshot) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
      if (!blob) throw new Error('No frame');
      const name = media.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') + ' - ' + Math.floor(video.currentTime) + 's.png';
      if (isDesktop) {
        if (!(await tauriClient.saveFrame(name, blob))) return;
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = name;
        link.href = url;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      showStatus('Frame saved');
    } catch {
      showStatus('Could not save the current frame');
    }
  }

  const shortcuts = useRef<(event: KeyboardEvent) => void>(() => {});
  shortcuts.current = (event) => {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
      if (settingsOpen) return;
      if (menu) closeMenu(true);
      else if (drawer !== 'none') setDrawer('none');
      else if (fullscreen && isDesktop) void changeFullscreen(false);
      return;
    }
    if (settingsOpen || menu || event.altKey || event.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyO') {
      event.preventDefault();
      if (!event.repeat) void openFile();
      return;
    }
    const target = event.target;
    if (event.ctrlKey || event.metaKey || (target instanceof HTMLElement &&
      target.closest('input, select, textarea, [contenteditable="true"]'))) return;
    switch (event.code) {
      case 'Space':
        if (event.repeat || (target instanceof Element && target.closest('button'))) return;
        togglePlay();
        break;
      case 'ArrowLeft': case 'KeyJ':
      case 'ArrowRight': case 'KeyL': {
        event.preventDefault();
        const direction = event.code === 'ArrowLeft' || event.code === 'KeyJ' ? -1 : 1;
        seekBy(direction * settings.seekStep);
        return;
      }
      case 'ArrowUp': changeVolume(volume + settings.volumeStep); break;
      case 'KeyB':
        if (!event.repeat) marks.addBookmark();
        event.preventDefault();
        return;
      case 'ArrowDown': changeVolume(volume - settings.volumeStep); break;
      case 'KeyM': if (!event.repeat) mute(); break;
      case 'KeyF': case 'F11': if (!event.repeat) void changeFullscreen(!fullscreen); break;
      default: return;
    }
    event.preventDefault();
    showControls();
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => shortcuts.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const pictureHeight = aspectRatio ? Math.min(size.height, size.width / aspectRatio) : size.height;
  // Keep the same caption position while the transport fades in and out.
  const subtitleTop = Math.min(size.height - (hasTransport ? 53 : 8),
    (size.height - pictureHeight) / 2 + pictureHeight * subtitleConfig.vertical_position / 100);
  const subtitle = error ? '' : selectedSubtitle === 'off' && drawer === 'subtitles' && aspectRatio > 0
    ? 'Subtitle preview'
    : cueText(currentTime, subtitleConfig.delay_seconds);
  const toggleDrawer = (panel: DrawerPanel) => setDrawer((active) => active === panel ? 'none' : panel);
  const dismissDrawer = () => setDrawer('none');

  return (
    <div ref={rootRef} className={['player-shell', fullscreen && 'is-fullscreen', hudHidden && 'hud-hidden'].filter(Boolean).join(' ')}
      onPointerEnter={showControls} onPointerMove={showControls}
      onPointerDown={showControls} onPointerLeave={() => { if (!hudHidden) showControls(); }}
      onFocus={showControls} onBlur={showControls}
      onDragOver={(event) => {
        if (!isDesktop && event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          if (!dragging) setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!isDesktop && !event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={dropFiles}>
      <TopWindowBar title={media?.title ?? ''} onOpenSettings={() => setSettingsOpen(true)} />
      <div className="player-frame">
        <div className="player-body">
          <main ref={viewportRef} aria-label="Video viewport"
            className="viewport"
            onDoubleClick={(event) => {
              if (!(event.target as Element).closest('button, .transport')) void changeFullscreen(!fullscreen);
            }}
            onClick={(event) => {
              if (drawer !== 'none' && !(event.target as Element).closest('button, .transport')) dismissDrawer();
            }}
            onContextMenu={(event) => {
              if ((event.target as Element).closest('.transport')) return;
              event.preventDefault();
              setMenu({ x: event.clientX, y: event.clientY });
            }}>
            <video ref={videoRef} src={sample ? undefined : media?.uri} hidden={!media || Boolean(sample) || Boolean(error)}
              muted={nativeAudio}
              preload="auto" playsInline loop={loop && marks.end === null} crossOrigin="anonymous"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                const length = Number.isFinite(video.duration) ? video.duration : 0;
                if (media?.path) rememberFile(media.path);
                setDuration(length);
                video.playbackRate = speed;
                if (video.videoHeight) setAspectRatio(video.videoWidth / video.videoHeight);
                const saved = settings.autoResume && media?.path ? savedPositions.get(media.path) : undefined;
                if (saved && saved < length - 0.5) {
                  video.currentTime = saved;
                  resetClock(saved);
                }
                updateTracks();
                playVideo();
              }}
              onDurationChange={(event) => {
                const length = event.currentTarget.duration;
                if (media && !sample && Number.isFinite(length)) setDuration(length);
              }}
              onLoadedData={({ currentTarget }) => setCanSnapshot(currentTarget.videoWidth > 0)}
              onPlaying={() => { setPlaying(true); finishBuffering(); }}
              onCanPlay={finishBuffering}
              onWaiting={({ currentTarget }) => {
                if (currentTarget.paused) return;
                window.clearTimeout(bufferingTimer.current);
                bufferingTimer.current = window.setTimeout(() => {
                  if (!currentTarget.paused && currentTarget.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) setLoading(true);
                }, 300);
              }}
              onPause={() => { finishBuffering(); setPlaying(false); savePosition(); }}
              onTimeUpdate={() => {
                readClock();
                if (performance.now() - resumeClock.current > 2000) {
                  resumeClock.current = performance.now();
                  savePosition();
                }
              }}
              onEnded={() => {
                if (marks.repeatAtEnd()) return;
                setPlaying(false);
                savePosition();
                if (next) selectMedia(next);
              }}
              onError={() => {
                if (!media || sample) return;
                setPlaying(false);
                setLoading(false);
                setCanSnapshot(false);
                setDuration(0);
                setError('This file is unreadable or uses a codec your player cannot decode.');
              }}
            />
            {sample && <img className="sample-frame" src={media?.uri} alt="Sample playback still" />}
            {!media && <PlayerHome recentFiles={recentFiles} onOpen={() => void openFile()}
              onSelect={(path) => openItems([tauriClient.localMedia(path)], false)} onClear={clearRecent} />}
            {error && (
              <div className="empty-state">
                <h1>Unable to play this file</h1>
                <div className="error-actions">
                  <button className="primary-button" type="button" onClick={() => void openFile()}>
                    <FolderOpen size={14} />Open another file
                  </button>
                  <button className="secondary-button" type="button" onClick={() => selectMedia(null)}>Close media</button>
                </div>
                <p>{error}</p>
              </div>
            )}
            {media && !sample && !error && !loading && aspectRatio === 0 &&
              <div className="media-placeholder"><Disc3 aria-hidden="true" size={54} strokeWidth={1} /><h1>{media.title}</h1></div>}
            {loading && !error && <div className="loading-mark" role="status"><LoaderCircle size={21} /> Loading media</div>}
            <div className="subtitle-layer" aria-hidden={!subtitle}>
              <div className="subtitle-overlay" style={{
                fontSize: subtitleConfig.font_size,
                background: 'rgba(0, 0, 0, ' + subtitleConfig.background_opacity + ')',
                top: subtitleTop,
              }}>{subtitle}</div>
            </div>
            {dragging && <div className="drop-overlay"><FileVideo size={24} /> {drawer === 'playlist' ? 'Drop files to add to queue' : 'Drop files to open'}</div>}
            <OsdOverlay message={status} />
            {hasTransport && <div className="transport-zone" onPointerEnter={showControls} onPointerLeave={showControls}>
              <BottomControlsBar key={media?.id} currentTime={currentTime} duration={duration} playing={playing} canPlay={Boolean(media && !error)}
                volume={volume} drawer={drawer} isFullScreen={fullscreen} seekStep={settings.seekStep} hasPrevious={Boolean(previous)} hasNext={Boolean(next)}
                bookmarks={marks.bookmarks} loopStart={marks.start} loopEnd={marks.end}
                menuOpen={Boolean(menu?.trigger)} onSeek={seek} onSeekDelta={seekBy} onSeekComplete={finishSeek} onTogglePlay={togglePlay} onVolumeChange={changeVolume}
                onToggleMute={mute} onPrevious={() => previous && selectMedia(previous)} onNext={() => next && selectMedia(next)}
                onToggleDrawer={toggleDrawer} onToggleFullscreen={() => void changeFullscreen(!fullscreen)} onOpenMenu={openMenu} />
            </div>}
          </main>

          {drawer === 'marks' && <PlaybackMarksPanel marks={marks} onClose={dismissDrawer} />}
          {drawer === 'playlist' && <PlaylistPanel items={playlist} activeId={media?.id} onSelect={selectMedia} onRemove={removeItem}
            onMove={moveItem} onAdd={() => void openFile(true)} onClose={dismissDrawer}
            onClear={() => { selectMedia(null); playlist.forEach(forgetItem); setPlaylist([]); }} />}
          {drawer === 'audio' && <EqualizerPanel eq={eq} presets={presets} audioTracks={audioTracks} selectedTrack={selectedAudio}
            onSelectTrack={selectAudio} onChange={(value) => { prepareAudio(); setEq(value); }}
            onReset={() => setEq(INITIAL_EQ)} onClose={dismissDrawer} />}
          {drawer === 'subtitles' && <SubtitlePanel config={subtitleConfig} tracks={subtitleTracks} selected={selectedSubtitle}
            hasMedia={Boolean(media && !error)} onSelect={selectSubtitle} onChange={setSubtitleConfig} onReset={() => setSubtitleConfig(INITIAL_SUB)}
            onLoad={() => void openSubtitle()} onClose={dismissDrawer} />}
        </div>

      </div>
      {menu && <PlayerContextMenu anchor={menu} onClose={closeMenu} hasMedia={Boolean(media)} canSnapshot={canSnapshot}
        playing={playing} fullscreen={fullscreen} speed={speed} loop={loop} audioTracks={audioTracks}
        selectedAudio={selectedAudio} onSelectAudio={selectAudio} subtitleTracks={subtitleTracks}
        selectedSubtitle={selectedSubtitle} onSelectSubtitle={selectSubtitle} onPlay={togglePlay} onOpen={() => void openFile()}
        onDrawer={setDrawer} onSettings={() => setSettingsOpen(true)} onFullscreen={() => void changeFullscreen(!fullscreen)}
        onSpeed={(value) => { setSpeed(value); if (videoRef.current) videoRef.current.playbackRate = value; }}
        onLoop={() => { setLoop(!loop); showStatus(loop ? 'Loop off' : 'Loop on'); }}
        onSnapshot={() => void saveFrame()} onCloseMedia={() => selectMedia(null)} />}
      {settingsOpen && <PlaybackSettingsModal settings={settings} hardwareDecoding={hardwareDecoding}
        onHardwareDecoding={async (value) => {
          try { await tauriClient.setHardwareDecoding(value); setHardwareDecoding(value); }
          catch { showStatus('Could not save the hardware decoding preference'); }
        }}
        onChange={(value) => { setSettings(value); writeStorage(settingsKey, value); }} onClose={() => setSettingsOpen(false)} />}
      {!isDesktop && <>
        <input type="file" ref={mediaInput} hidden multiple accept={MEDIA_ACCEPT} onChange={(event) => {
          openItems(Array.from(event.currentTarget.files ?? [], createBrowserMedia), addOnly.current);
          event.currentTarget.value = '';
        }} />
        <input type="file" ref={subtitleInput} hidden accept={SUBTITLE_ACCEPT} onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          const generation = mediaGeneration.current;
          if (file) void loadSubtitles(file.name, () => file.text(), () => mediaGeneration.current === generation);
          event.currentTarget.value = '';
        }} />
      </>}
    </div>
  );
}
