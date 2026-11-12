import React, { useEffect, useRef, useState, useCallback } from 'react';
import { tauriClient } from '../../core/tauriClient';
import type { DrawerPanel, EqPreset, EqState, PlaylistItem, SubtitleConfig, SubtitleCue, TrackInfo } from '../../core/types';
import { TopWindowBar } from './TopWindowBar';
import { BottomControlsBar } from './BottomControlsBar';
import { OsdOverlay } from './OsdOverlay';
import { EqualizerPanel } from '../audio/EqualizerPanel';
import { SubtitlePanel } from '../subtitles/SubtitlePanel';
import { PlaylistPanel } from '../playlist/PlaylistPanel';
import { PlaybackSettingsModal } from '../settings/PlaybackSettingsModal';
import { PlayerContextMenu } from './PlayerContextMenu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Film, FolderOpen, ListMusic, Play } from 'lucide-react';

const INITIAL_EQ: EqState = {
  frequencies: [60, 230, 910, 3600, 14000],
  gains: [0, 0, 0, 0, 0],
  preamp_db: 0,
  audio_delay_sec: 0,
  compressor: false,
  active_preset: 'Flat',
};

const INITIAL_SUB: SubtitleConfig = {
  vertical_position: 92,
  scale: 1,
  delay_seconds: 0,
  font_size: 24,
  background_opacity: 0.65,
};

export const PlayerScreen: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback & Window State
  const [title, setTitle] = useState<string>('MyPlayer Pro');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [playing, setPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [speed, setSpeed] = useState<number>(1.0);
  const [loop, setLoop] = useState<boolean>(false);
  const [drawer, setDrawer] = useState<DrawerPanel>('none');
  const [hudVisible, setHudVisible] = useState<boolean>(true);
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Playlist state
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playlistIndex, setPlaylistIndex] = useState<number>(-1);

  // Preferences
  const [hardwareDecoding, setHardwareDecoding] = useState<boolean>(true);
  const [autoResume, setAutoResume] = useState<boolean>(true);
  const [seekStepSeconds, setSeekStepSeconds] = useState<number>(5);
  const [volumeStepPercent, setVolumeStepPercent] = useState<number>(5);
  const [precisionSeeking, setPrecisionSeeking] = useState<boolean>(true);

  // Audio DSP & Subtitle Framing State (Synced with Rust Backend)
  const [eq, setEq] = useState<EqState>(INITIAL_EQ);
  const [presets, setPresets] = useState<EqPreset[]>([]);
  const [afString, setAfString] = useState<string>('');
  const [subConfig, setSubConfig] = useState<SubtitleConfig>(INITIAL_SUB);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [activeCueText, setActiveCueText] = useState<string>('');

  // Audio & Subtitle Stream Tracks
  const [activeMediaRawPath, setActiveMediaRawPath] = useState<string>('');
  const [audioTracks, setAudioTracks] = useState<TrackInfo[]>([
    { id: 'default', title: 'Primary Audio (Default / Stereo / 5.1)', isDefault: true },
  ]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>('default');
  const [subtitleTracks, setSubtitleTracks] = useState<TrackInfo[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<string>('off');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const osdTimerRef = useRef<number | null>(null);
  const hudTimerRef = useRef<number | null>(null);
  const openSeqRef = useRef(0);
  // Refs for values used inside async callbacks without re-creating them
  const playlistRef = useRef<PlaylistItem[]>([]);
  playlistRef.current = playlist;

  const showOsd = useCallback((msg: string) => {
    setOsdMessage(msg);
    if (osdTimerRef.current) window.clearTimeout(osdTimerRef.current);
    osdTimerRef.current = window.setTimeout(() => setOsdMessage(null), 1800);
  }, []);

  const bumpHud = useCallback(() => {
    setHudVisible(true);
    if (hudTimerRef.current) window.clearTimeout(hudTimerRef.current);
    hudTimerRef.current = window.setTimeout(() => {
      if (drawer === 'none' && !settingsOpen && !contextMenu && videoSrc) {
        setHudVisible(false);
      }
    }, 2800);
  }, [drawer, settingsOpen, contextMenu, videoSrc]);

  useEffect(() => {
    tauriClient.getEqPresets().then(setPresets).catch(() => {});

    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const d = p.get('drawer') as DrawerPanel;
      if (d) setDrawer(d);
      if (p.get('menu') === 'true') setContextMenu({ x: 440, y: 180 });
      if (p.get('settings') === 'true') setSettingsOpen(true);
      if (p.get('sample') === 'true') {
        setTitle('Dark Matter (2024) - S01E01 - Are You Happy in Your Life');
        setVideoSrc('sample://preview');
        setPlaying(true);
        setCurrentTime(1482);
        setDuration(3245);
        setPlaylist([
          { id: '1', title: 'Dark Matter - S01E01 - Are You Happy in Your Life', uri: 'sample://1' },
          { id: '2', title: 'Dark Matter - S01E02 - Trip of a Lifetime', uri: 'sample://2' },
          { id: '3', title: 'Dark Matter - S01E03 - The Box', uri: 'sample://3' },
          { id: '4', title: 'Dark Matter - S01E04 - The Corridor', uri: 'sample://4' },
        ]);
        setPlaylistIndex(0);
        setActiveCueText('Jason: "Are you happy in your life?"\nDaniela: "More than you know."');

        setAudioTracks([
          { id: 'audio-0', title: 'English [Dolby 5.1 Surround]', language: 'en', isDefault: true },
          { id: 'audio-1', title: 'English [Stereo 2.0]', language: 'en' },
          { id: 'audio-2', title: 'Director’s Commentary', language: 'en' },
        ]);
        setSelectedAudioTrack('audio-0');

        setSubtitleTracks([
          { id: 'sub-0', title: 'English [CC] (Full Dialogue)', language: 'en', isDefault: true },
          { id: 'sub-1', title: 'Spanish (Español Latino)', language: 'es' },
          { id: 'sub-2', title: 'French (Français)', language: 'fr' },
        ]);
        setSelectedSubtitleTrack('sub-0');
      }
    }
  }, []);

  // Smooth 60fps continuous timeline playback clock via requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animId = requestAnimationFrame(updateLoop);
    };
    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Direct synchronous seeking for instant responsive Rewind / Fast Forward
  const handleSeekDelta = useCallback((delta: number) => {
    if (!videoRef.current) return;
    const next = Math.max(0, Math.min(videoRef.current.currentTime + delta, videoRef.current.duration || Infinity));
    videoRef.current.currentTime = next;
    setCurrentTime(next);
    showOsd(`${delta > 0 ? '+' : ''}${delta}s`);
  }, [showOsd]);

  // Sync EQ State to Rust Backend
  const handleEqChange = async (nextEq: EqState, toast?: string) => {
    setEq(nextEq);
    if (toast) showOsd(toast);
    try {
      const af = await tauriClient.syncAudioEq(nextEq);
      setAfString(af);
    } catch {
      // Fallback
    }
  };

  // Sync Subtitle Framing State to Rust Backend
  const handleSubChange = async (nextSub: SubtitleConfig, toast?: string) => {
    setSubConfig(nextSub);
    if (toast) showOsd(toast);
    try {
      await tauriClient.syncSubtitleConfig(nextSub);
    } catch {}
  };

  // Parse & Set Subtitle Cues from Raw Text
  const parseAndSetSubtitleCues = useCallback((raw: string, filename?: string) => {
    const parsed: SubtitleCue[] = [];
    const toSec = (t: string) => {
      const [h, m, s] = t.replace(',', '.').split(':').map(Number);
      return h * 3600 + m * 60 + s;
    };

    for (const block of raw.trim().split(/\n\s*\n/)) {
      const lines = block.split('\n');
      const idx = lines.findIndex((l) => l.includes('-->'));
      if (idx === -1) continue;
      const [start, end] = lines[idx].split('-->').map((s) => toSec(s.trim()));
      const text = lines.slice(idx + 1).join('\n');
      parsed.push({ start, end, text });
    }
    setCues(parsed);
    if (filename) showOsd(`Subtitles: ${filename}`);
  }, [showOsd]);

  // Load Subtitle File from Disk via Rust backend
  const loadExternalSubtitleFile = useCallback(async (filePath: string, title?: string) => {
    try {
      const content = await tauriClient.loadSubtitleFile(filePath);
      if (content) {
        parseAndSetSubtitleCues(content, title || filePath.split(/[\\/]/).pop());
      }
    } catch (err) {
      console.error('Failed to load subtitle file:', err);
    }
  }, [parseAndSetSubtitleCues]);

  // Open media: start playback IMMEDIATELY, inspect tracks in background.
  // The old path awaited full MKV parsing + embedded-subtitle extraction *before*
  // setting the video src — that blocked the UI for seconds on large files.
  const handleOpenFilePath = useCallback(
    async (filePath: string) => {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';

      if (ext === 'srt' || ext === 'vtt' || ext === 'ass' || ext === 'ssa' || ext === 'sub') {
        const fileName = filePath.split(/[\\/]/).pop() || 'Subtitle';
        await loadExternalSubtitleFile(filePath, fileName);
        const newTrack: TrackInfo = {
          id: `ext-${Date.now()}`,
          title: fileName,
          language: 'External',
          isDefault: true,
          filePath: filePath,
        };
        setSubtitleTracks((prev) => [newTrack, ...prev.filter((t) => !t.id.startsWith('ext-'))]);
        setSelectedSubtitleTrack(newTrack.id);
        showOsd(`Subtitles: ${fileName}`);
        return;
      }

      const seq = ++openSeqRef.current;
      // 1) Instant title + URL (synchronous, no IPC round-trip)
      const instant = tauriClient.openFilePathInstant(filePath);
      setIsLoading(true);
      setActiveMediaRawPath(instant.rawPath);
      setVideoSrc(instant.assetUrl);
      setTitle(instant.cleanTitle);
      setCurrentTime(0);
      setDuration(0);
      setCues([]);
      setActiveCueText('');
      setAudioTracks([{ id: 'default', title: 'Primary Audio (Default)', isDefault: true }]);
      setSelectedAudioTrack('default');
      setSubtitleTracks([]);
      setSelectedSubtitleTrack('off');
      showOsd(`Opening ${instant.cleanTitle}…`);
      setPlaylist((prev) => {
        if (prev.some((p) => p.id === instant.rawPath)) return prev;
        setPlaylistIndex(prev.length);
        return [...prev, { id: instant.rawPath, uri: instant.assetUrl, title: instant.cleanTitle }];
      });

      // 2) Kick the video element right away (persistent element, no remount)
      const v = videoRef.current;
      if (v) {
        v.src = instant.assetUrl;
        v.load();
        v.play().catch(() => {});
      }

      // 3) Heavy container inspection in the background — does not block playback
      tauriClient.inspectMediaTracks(instant.rawPath).then(({ audioTracks, subtitleTracks }) => {
        if (openSeqRef.current !== seq) return; // superseded by a newer open
        if (audioTracks && audioTracks.length > 0) {
          setAudioTracks(audioTracks);
          const active = audioTracks.find((a) => a.isDefault) || audioTracks[0];
          setSelectedAudioTrack(active.id);
        }
        if (subtitleTracks && subtitleTracks.length > 0) {
          setSubtitleTracks(subtitleTracks);
          const activeSub = subtitleTracks.find((s) => s.isDefault);
          if (activeSub) {
            setSelectedSubtitleTrack(activeSub.id);
            if (activeSub.filePath) {
              loadExternalSubtitleFile(activeSub.filePath, activeSub.title);
            } else if (activeSub.id.startsWith('sub-')) {
              const trackNum = parseInt(activeSub.id.replace('sub-', ''), 10);
              if (!Number.isNaN(trackNum)) {
                tauriClient.extractEmbeddedSubtitles(instant.rawPath, trackNum)
                  .then((extracted) => {
                    if (openSeqRef.current === seq && extracted && extracted.length > 0) setCues(extracted);
                  })
                  .catch(() => {});
              }
            }
          }
        }
        showOsd(`Playing: ${instant.cleanTitle}`);
      }).catch((err) => {
        console.error('Background inspection failed:', err);
        if (openSeqRef.current === seq) showOsd(`Playing: ${instant.cleanTitle}`);
      }).finally(() => {
        if (openSeqRef.current === seq) setIsLoading(false);
      });
    },
    [loadExternalSubtitleFile, showOsd]
  );

  // Open Media File with IMMEDIATE AUTOPLAY & Full Stream Track Discovery
  const handleOpenFile = async () => {
    try {
      const media = await tauriClient.pickAndOpenVideo();
      if (media && media.rawPath) {
        if (media.rawPath === 'sample.mp4') {
          // Browser mock mode
          setVideoSrc(media.assetUrl);
          setTitle(media.cleanTitle);
          setAudioTracks(media.audioTracks || []);
          setSelectedAudioTrack(media.audioTracks?.[0]?.id || 'default');
          setSubtitleTracks(media.subtitleTracks || []);
          setSelectedSubtitleTrack(media.subtitleTracks?.[0]?.id || 'off');
          showOsd(`Playing: ${media.cleanTitle}`);
          return;
        }
        await handleOpenFilePath(media.rawPath);
      }
    } catch (err) {
      console.error('Failed to open media:', err);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = async () => {
    try {
      const appWindow = getCurrentWindow();
      const current = await appWindow.isFullscreen();
      await appWindow.setFullscreen(!current);
      setIsFullScreen(!current);
      showOsd(!current ? 'Fullscreen' : 'Exit Fullscreen');
    } catch (_) {
      setIsFullScreen((prev) => !prev);
    }
  };

  // Change Playback Speed
  const handleSetSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
    showOsd(`Speed: ${newSpeed}x`);
  };

  // Take Screenshot of Current Frame
  const handleTakeScreenshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1920;
      canvas.height = videoRef.current.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.download = `${title}_${Math.round(currentTime)}s.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        showOsd('Saved Frame Screenshot');
      }
    } catch (_) {
      showOsd('Snapshot failed (CORS/Format)');
    }
  };

  // Close Active Media
  const handleCloseMedia = () => {
    setActiveMediaRawPath('');
    setVideoSrc('');
    setTitle('MyPlayer Pro');
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCues([]);
    setActiveCueText('');
    setAudioTracks([{ id: 'default', title: 'Primary Audio (Default / Stereo / 5.1)', isDefault: true }]);
    setSelectedAudioTrack('default');
    setSubtitleTracks([]);
    setSelectedSubtitleTrack('off');
    showOsd('Closed Media');
  };

  // Parse External .SRT File
  const handleLoadSrt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    parseAndSetSubtitleCues(raw, file.name);

    const newTrack: TrackInfo = {
      id: `external-${Date.now()}`,
      title: file.name,
      language: 'External',
      isDefault: true,
    };
    setSubtitleTracks((prev) => [newTrack, ...prev.filter((t) => !t.id.startsWith('external'))]);
    setSelectedSubtitleTrack(newTrack.id);
  };

  // Detect Audio and Subtitle Tracks from the HTML5 media element (Fallback if container inspection has none)
  const detectTracks = useCallback(() => {
    if (!videoRef.current) return;

    // 1. Audio Tracks (Chromium / WebView2 audioTracks API)
    const v = videoRef.current as any;
    if (v && v.audioTracks && v.audioTracks.length > 1) {
      const detectedAudio: TrackInfo[] = [];
      for (let i = 0; i < v.audioTracks.length; i++) {
        const at = v.audioTracks[i];
        detectedAudio.push({
          id: at.id || `audio-${i}`,
          title: at.label || `Audio Track ${i + 1} (${at.language || 'Stereo'})`,
          language: at.language,
          isDefault: at.enabled || i === 0,
        });
      }
      setAudioTracks(detectedAudio);
      const activeAudio = detectedAudio.find((a) => a.isDefault) || detectedAudio[0];
      if (activeAudio) setSelectedAudioTrack(activeAudio.id);
    }

    // 2. Subtitle Tracks (video.textTracks)
    if (videoRef.current.textTracks && videoRef.current.textTracks.length > 0) {
      const tt = videoRef.current.textTracks;
      const detectedSubs: TrackInfo[] = [];
      for (let i = 0; i < tt.length; i++) {
        const t = tt[i];
        detectedSubs.push({
          id: `embedded-${i}`,
          title: t.label || `Track ${i + 1} (${t.language || 'Embedded'})`,
          language: t.language,
          isDefault: t.mode === 'showing' || i === 0,
        });
      }
      if (detectedSubs.length > 0) {
        setSubtitleTracks((prev) => {
          const combined = [...prev];
          detectedSubs.forEach((ds) => {
            if (!combined.some((c) => c.id === ds.id)) combined.push(ds);
          });
          return combined;
        });
      }
    }
  }, []);

  const handleSelectAudioTrack = (id: string) => {
    setSelectedAudioTrack(id);
    const v = videoRef.current as any;
    const trackIndex = audioTracks.findIndex((t) => t.id === id);
    if (v && v.audioTracks && v.audioTracks.length > 0 && trackIndex !== -1) {
      for (let i = 0; i < v.audioTracks.length; i++) {
        v.audioTracks[i].enabled = (i === trackIndex);
      }
    }
    const track = audioTracks.find((t) => t.id === id);
    showOsd(`Audio: ${track?.title || id}`);
  };

  const handleSelectSubtitleTrack = async (id: string) => {
    setSelectedSubtitleTrack(id);
    if (id === 'off') {
      setCues([]);
      setActiveCueText('');
      if (videoRef.current && videoRef.current.textTracks) {
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          videoRef.current.textTracks[i].mode = 'disabled';
        }
      }
      showOsd('Subtitles: Off');
      return;
    }

    const track = subtitleTracks.find((t) => t.id === id);
    if (!track) return;

    // 1. If sidecar / external subtitle file
    if (track.filePath) {
      await loadExternalSubtitleFile(track.filePath, track.title);
      showOsd(`Subtitles: ${track.title || id}`);
      return;
    }

    // 2. If embedded MKV subtitle stream
    if (activeMediaRawPath && track.id.startsWith('sub-')) {
      const trackNum = parseInt(track.id.replace('sub-', ''), 10);
      showOsd(`Extracting: ${track.title || track.language}...`);
      try {
        const extracted = await tauriClient.extractEmbeddedSubtitles(activeMediaRawPath, trackNum);
        if (extracted && extracted.length > 0) {
          setCues(extracted);
          showOsd(`Subtitles: ${track.title || track.language} (${extracted.length} cues)`);
        } else {
          setCues([]);
          showOsd(`Subtitles: ${track.title || track.language} (No cues)`);
        }
      } catch (err) {
        console.error('Failed to extract embedded subtitles:', err);
        showOsd('Failed to extract subtitles');
      }
      return;
    }

    showOsd(`Subtitles: ${track.title || id}`);
  };

  // Match Subtitle Cue Against Video Clock + Delay Offset
  useEffect(() => {
    if (selectedSubtitleTrack === 'off') {
      setActiveCueText('');
      return;
    }
    const adjusted = currentTime - subConfig.delay_seconds;
    const match = cues.find((c) => adjusted >= c.start && adjusted <= c.end);
    setActiveCueText(match ? match.text : '');
  }, [currentTime, cues, subConfig.delay_seconds, selectedSubtitleTrack]);

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return '00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // Global Keyboard shortcuts (does NOT pop up HUD bars on seek / volume)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
            showOsd('Play');
          } else {
            videoRef.current.pause();
            showOsd('Pause');
          }
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
        e.preventDefault();
        handleSeekDelta(-seekStepSeconds);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        handleSeekDelta(seekStepSeconds);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const nextVol = Math.min(volume + volumeStepPercent, 150);
        setVolume(nextVol);
        if (videoRef.current) videoRef.current.volume = Math.min(nextVol / 100, 1);
        showOsd(`Volume: ${nextVol}%`);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const nextVol = Math.max(volume - volumeStepPercent, 0);
        setVolume(nextVol);
        if (videoRef.current) videoRef.current.volume = Math.min(nextVol / 100, 1);
        showOsd(`Volume: ${nextVol}%`);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (volume > 0) {
          setVolume(0);
          if (videoRef.current) videoRef.current.volume = 0;
          showOsd('Muted');
        } else {
          setVolume(100);
          if (videoRef.current) videoRef.current.volume = 1;
          showOsd('Volume: 100%');
        }
      } else if (e.code === 'KeyF' || e.code === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyO' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleOpenFile();
      } else if (e.code === 'Escape') {
        if (contextMenu) setContextMenu(null);
        if (drawer !== 'none') setDrawer('none');
        if (settingsOpen) setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOsd, volume, seekStepSeconds, volumeStepPercent, drawer, settingsOpen, handleSeekDelta, contextMenu]);

  // Native Tauri window drag-and-drop listener (provides OS file paths)
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    try {
      getCurrentWindow()
        .onDragDropEvent(async (event) => {
          if (event.payload.type === 'drop') {
            setIsDraggingFile(false);
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
              await handleOpenFilePath(paths[0]);
            }
          } else if (event.payload.type === 'enter') {
            setIsDraggingFile(true);
          } else if (event.payload.type === 'leave') {
            setIsDraggingFile(false);
          }
        })
        .then((fn) => {
          unlisten = fn;
        })
        .catch(() => {});
    } catch (_) {}

    return () => {
      if (unlisten) unlisten();
    };
  }, [handleOpenFilePath]);

  // Drag and drop handling with AUTOPLAY
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };
  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // 1. If user drops a subtitle file directly onto the screen
    const nameLower = file.name.toLowerCase();
    if (
      nameLower.endsWith('.srt') ||
      nameLower.endsWith('.vtt') ||
      nameLower.endsWith('.ass') ||
      nameLower.endsWith('.ssa')
    ) {
      const text = await file.text();
      parseAndSetSubtitleCues(text, file.name);
      const newTrack: TrackInfo = {
        id: `ext-${Date.now()}`,
        title: file.name,
        language: 'External',
        isDefault: true,
      };
      setSubtitleTracks((prev) => [newTrack, ...prev.filter((t) => !t.id.startsWith('ext-'))]);
      setSelectedSubtitleTrack(newTrack.id);
      return;
    }

    // 2. If user drops a video file with accessible OS file path
    const filePath = (file as unknown as { path?: string }).path;
    if (filePath) {
      await handleOpenFilePath(filePath);
      return;
    }

    // 3. Fallback for browser drag-drop
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    showOsd(`Playing: ${file.name}`);
    setAudioTracks([{ id: 'default', title: 'Primary Audio (Stereo / 5.1)', isDefault: true }]);
    setSelectedAudioTrack('default');
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div
      onMouseMove={bumpHud}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-screen h-screen bg-[#050507] text-white overflow-hidden flex flex-col select-none ${
        !hudVisible && Boolean(videoSrc) && drawer === 'none' && !settingsOpen && !contextMenu ? 'cursor-none' : ''
      }`}
    >
      {/* 1. Custom Minimalist Frameless Top Window Bar */}
      <TopWindowBar
        title={title}
        visible={hudVisible || !videoSrc || drawer !== 'none'}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 2. Main Viewport & Ambient Background */}
      <div className="relative flex-1 flex overflow-hidden">
        <main
          onClick={() => {
            if (contextMenu) setContextMenu(null);
            if (drawer !== 'none') setDrawer('none');
          }}
          onDoubleClick={toggleFullscreen}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
          className="relative flex-1 flex items-center justify-center bg-black overflow-hidden"
        >
          {/* Video Element — always mounted so src swaps are instant (no remount freeze).
              Sample-preview mode is a dev-only mock. */}
          {videoSrc === 'sample://preview' ? (
            <img
              src="/sample_frame.jpg"
              alt="Sample Video Playback"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={videoSrc || undefined}
              autoPlay
              loop={loop}
              preload="auto"
              onPlay={() => {
                setPlaying(true);
                setIsLoading(false);
                bumpHud();
              }}
              onPause={() => setPlaying(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onLoadedMetadata={(e) => {
                setDuration(e.currentTarget.duration);
                detectTracks();
                e.currentTarget.play().catch(() => {});
              }}
              onCanPlay={() => {}}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                videoSrc ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          )}
          {/* Loading shimmer while opening */}
          {isLoading && videoSrc && videoSrc !== 'sample://preview' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#spinGrad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="spinGrad" x1="0" y1="0" x2="24" y2="24">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-[12px] text-zinc-400 font-display">Loading…</span>
              </div>
            </div>
          )}
          {!videoSrc ? (
            <div className="aurora absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6">
              <div className="max-w-md w-full animate-fade-in flex flex-col items-center">
                <div className="animate-rise-in flex flex-col items-center" style={{ animationDelay: '0ms' }}>
                  <button
                    onClick={handleOpenFile}
                    className="w-24 h-24 rounded-full accent-gradient-soft text-white flex items-center justify-center mb-7 hover:scale-105 active:scale-95 transition-all duration-200 shadow-[0_16px_56px_rgba(99,102,241,0.5)] animate-ring animate-float"
                    title="Open video"
                  >
                    <Play size={34} className="fill-white ml-1.5" />
                  </button>
                </div>

                <h1 className="animate-rise-in font-display text-[34px] leading-[1.05] font-bold tracking-tight mb-3" style={{ animationDelay: '60ms' }}>
                  <span className="text-gradient">Watch anything.</span>
                  <br />
                  <span className="text-white">Beautifully fast.</span>
                </h1>
                <p className="animate-rise-in text-[13.5px] text-zinc-400 mb-8 leading-relaxed max-w-xs" style={{ animationDelay: '120ms' }}>
                  Drop a video anywhere, or browse your device. Plays instantly — audio & subtitle tracks load in the background.
                </p>

                <div className="animate-rise-in flex items-center gap-2.5" style={{ animationDelay: '180ms' }}>
                  <button
                    onClick={handleOpenFile}
                    className="px-6 py-3 rounded-full accent-gradient-soft text-white font-semibold text-[13.5px] flex items-center gap-2 hover:brightness-110 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_10px_36px_rgba(99,102,241,0.45)]"
                  >
                    <FolderOpen size={15} />
                    <span>Browse files</span>
                  </button>
                  <button
                    onClick={() => setDrawer('playlist')}
                    className="px-6 py-3 rounded-full glass text-zinc-100 text-[13.5px] font-medium flex items-center gap-2 hover:bg-white/[0.12] hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    <ListMusic size={15} />
                    <span>Queue</span>
                  </button>
                </div>

                <div className="animate-rise-in mt-10 flex items-center gap-4 text-[11px] text-zinc-500 font-mono" style={{ animationDelay: '240ms' }}>
                  <span className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]">Space — Play</span>
                  <span className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]">← → — Seek</span>
                  <span className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]">Right-click — Menu</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Drag Overlay */}
          {isDraggingFile && (
            <div className="absolute inset-4 rounded-[28px] border-2 border-dashed border-indigo-400/60 bg-indigo-500/[0.08] backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50 pointer-events-none animate-fade-in">
              <div className="w-16 h-16 rounded-full accent-gradient-soft text-white flex items-center justify-center shadow-[0_12px_44px_rgba(99,102,241,0.5)]">
                <Film size={26} />
              </div>
              <div className="font-display text-[16px] font-semibold text-white">Drop to play</div>
              <div className="text-[12px] text-zinc-400">Video starts instantly</div>
            </div>
          )}

          {/* OSD Toast Notification */}
          <OsdOverlay message={osdMessage} />

          {/* Subtitle Display */}
          {(activeCueText || drawer === 'subtitles') && (
            <div
              style={{
                top: `${Math.min(Math.max(subConfig.vertical_position, 10), 96)}%`,
                transform: 'translateY(-100%)',
                fontSize: `${subConfig.font_size}px`,
                backgroundColor: `rgba(0, 0, 0, ${subConfig.background_opacity})`,
              }}
              className={`absolute left-1/2 -translate-x-1/2 px-4 py-1.5 text-center whitespace-pre-line pointer-events-none rounded-lg transition-all duration-75 text-white font-medium tracking-tight max-w-2xl ${drawer === 'subtitles' ? '' : ''}`}
            >
              {activeCueText || 'Preview — adjust position in panel'}
            </div>
          )}

          {/* Custom Right-Click Context Menu */}
          {contextMenu && (
            <PlayerContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              playing={playing}
              onTogglePlay={() => {
                if (!videoRef.current) return;
                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
              }}
              onSeekDelta={handleSeekDelta}
              onOpenFile={handleOpenFile}
              onOpenDrawer={(panel) => setDrawer(panel)}
              onOpenSettings={() => setSettingsOpen(true)}
              onToggleFullscreen={toggleFullscreen}
              isFullScreen={isFullScreen}
              speed={speed}
              onSetSpeed={handleSetSpeed}
              loop={loop}
              onToggleLoop={() => {
                setLoop((prev) => !prev);
                showOsd(!loop ? 'Loop: ON' : 'Loop: OFF');
              }}
              onTakeScreenshot={handleTakeScreenshot}
              onCloseMedia={handleCloseMedia}
              volume={volume}
              onToggleMute={() => {
                if (volume > 0) {
                  setVolume(0);
                  if (videoRef.current) videoRef.current.volume = 0;
                  showOsd('Muted');
                } else {
                  setVolume(100);
                  if (videoRef.current) videoRef.current.volume = 1;
                  showOsd('Volume: 100%');
                }
              }}
              hasMedia={Boolean(videoSrc)}
              audioTracks={audioTracks}
              selectedAudioTrack={selectedAudioTrack}
              onSelectAudioTrack={handleSelectAudioTrack}
              subtitleTracks={subtitleTracks}
              selectedSubtitleTrack={selectedSubtitleTrack}
              onSelectSubtitleTrack={handleSelectSubtitleTrack}
            />
          )}
        </main>

        {/* 3. Slide-Out Modern Feature Drawers */}
        {drawer === 'playlist' && (
          <PlaylistPanel
            items={playlist}
            currentIndex={playlistIndex}
            onSelect={(idx) => {
              setPlaylistIndex(idx);
              const item = playlist[idx];
              if (item) {
                if (item.id && !item.id.startsWith('blob:') && !item.id.startsWith('http')) {
                  handleOpenFilePath(item.id);
                } else {
                  setVideoSrc(item.uri);
                  setTitle(item.title);
                  showOsd(`Playing: ${item.title}`);
                  if (videoRef.current) {
                    videoRef.current.src = item.uri;
                    videoRef.current.play().catch(() => {});
                  }
                }
              }
            }}
            onRemove={(idx) => {
              setPlaylist((prev) => prev.filter((_, i) => i !== idx));
              if (playlistIndex === idx) {
                setVideoSrc('');
                setTitle('MyPlayer Pro');
              }
            }}
            onClear={() => {
              setPlaylist([]);
              setPlaylistIndex(-1);
              setVideoSrc('');
              setTitle('MyPlayer Pro');
            }}
            onAddFiles={handleOpenFile}
            onClose={() => setDrawer('none')}
          />
        )}

        {drawer === 'audio' && (
          <EqualizerPanel
            eq={eq}
            presets={presets}
            afFilterPreview={afString}
            audioTracks={audioTracks}
            selectedAudioTrackId={selectedAudioTrack}
            onSelectAudioTrack={handleSelectAudioTrack}
            onChange={handleEqChange}
            onReset={() => handleEqChange(INITIAL_EQ, 'Equalizer Reset')}
          />
        )}

        {drawer === 'subtitles' && (
          <SubtitlePanel
            config={subConfig}
            subtitleTracks={subtitleTracks}
            selectedSubtitleTrackId={selectedSubtitleTrack}
            onSelectSubtitleTrack={handleSelectSubtitleTrack}
            onChange={handleSubChange}
            onLoadSrtFile={handleLoadSrt}
          />
        )}
      </div>

      {/* 4. Sleek Right-Angled Vertically Small Bottom Controls */}
      <BottomControlsBar
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        volume={volume}
        drawer={drawer}
        hudVisible={hudVisible || !videoSrc || drawer !== 'none'}
        isFullScreen={isFullScreen}
        onSeek={(t) => {
          setCurrentTime(t);
          if (videoRef.current) videoRef.current.currentTime = t;
        }}
        onSeekDelta={handleSeekDelta}
        onTogglePlay={() => {
          if (!videoRef.current) return;
          videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }}
        onVolumeChange={(v) => {
          setVolume(v);
          if (videoRef.current) videoRef.current.volume = Math.min(v / 100, 1);
          showOsd(`Volume: ${v}%`);
        }}
        onOpenFile={handleOpenFile}
        onToggleDrawer={(panel) => setDrawer(drawer === panel ? 'none' : panel)}
        onToggleFullscreen={toggleFullscreen}
        formatTime={formatTime}
      />

      {/* 5. Minimal Playback & Hardware Settings Modal */}
      <PlaybackSettingsModal
        visible={settingsOpen}
        hardwareDecoding={hardwareDecoding}
        autoResume={autoResume}
        seekStepSeconds={seekStepSeconds}
        volumeStepPercent={volumeStepPercent}
        precisionSeeking={precisionSeeking}
        onUpdateHardwareDecoding={(val) => {
          setHardwareDecoding(val);
          tauriClient.syncPlaybackSettings(val, autoResume);
          showOsd(`Hardware Decoding: ${val ? 'ON' : 'OFF'}`);
        }}
        onUpdateAutoResume={(val) => {
          setAutoResume(val);
          tauriClient.syncPlaybackSettings(hardwareDecoding, val);
          showOsd(`Auto-Resume: ${val ? 'ON' : 'OFF'}`);
        }}
        onUpdateSeekStep={(val) => {
          setSeekStepSeconds(val);
          showOsd(`Seek Step: ${val}s`);
        }}
        onUpdateVolumeStep={(val) => {
          setVolumeStepPercent(val);
          showOsd(`Volume Step: ${val}%`);
        }}
        onUpdatePrecisionSeeking={(val) => {
          setPrecisionSeeking(val);
          showOsd(`Precision Seek: ${val ? 'ON' : 'OFF'}`);
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
