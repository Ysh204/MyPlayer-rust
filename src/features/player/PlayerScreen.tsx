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
  const [audioTracks, setAudioTracks] = useState<TrackInfo[]>([
    { id: 'default', title: 'Primary Audio (Default / Stereo / 5.1)', isDefault: true },
  ]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>('default');
  const [subtitleTracks, setSubtitleTracks] = useState<TrackInfo[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<string>('default');

  const osdTimerRef = useRef<number | null>(null);
  const hudTimerRef = useRef<number | null>(null);

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

  // Open Media File by OS file path (from Native Drag & Drop, File Dialog, or Playlist)
  const handleOpenFilePath = useCallback(
    async (filePath: string) => {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';

      // If user dropped an external subtitle file:
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

      try {
        const media = await tauriClient.openFilePath(filePath);
        if (media) {
          setVideoSrc(media.assetUrl);
          setTitle(media.cleanTitle);
          showOsd(`Playing: ${media.cleanTitle}`);
          const newItem: PlaylistItem = {
            id: media.rawPath,
            uri: media.assetUrl,
            title: media.cleanTitle,
          };
          setPlaylist((prev) => {
            if (prev.some((p) => p.id === media.rawPath)) return prev;
            return [...prev, newItem];
          });
          setPlaylistIndex(playlist.length);

          // Populate audio tracks discovered by Rust container inspection
          if (media.audioTracks && media.audioTracks.length > 0) {
            setAudioTracks(media.audioTracks);
            const activeAudio = media.audioTracks.find((a) => a.isDefault) || media.audioTracks[0];
            setSelectedAudioTrack(activeAudio.id);
          } else {
            setAudioTracks([
              { id: 'default', title: 'Primary Audio (Default / Stereo / 5.1)', isDefault: true },
            ]);
            setSelectedAudioTrack('default');
          }

          // Populate subtitle tracks (embedded MKV tracks + sidecar .srt files)
          if (media.subtitleTracks && media.subtitleTracks.length > 0) {
            setSubtitleTracks(media.subtitleTracks);
            const activeSub = media.subtitleTracks.find((s) => s.isDefault);
            if (activeSub) {
              setSelectedSubtitleTrack(activeSub.id);
              if (activeSub.filePath) {
                loadExternalSubtitleFile(activeSub.filePath, activeSub.title);
              }
            } else {
              setSelectedSubtitleTrack('off');
            }
          } else {
            setSubtitleTracks([]);
            setSelectedSubtitleTrack('off');
          }

          if (videoRef.current) {
            videoRef.current.src = media.assetUrl;
            videoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to open media by path:', err);
      }
    },
    [loadExternalSubtitleFile, playlist.length, showOsd]
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
    setVideoSrc('');
    setTitle('MyPlayer Pro');
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
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
    if (v && v.audioTracks && v.audioTracks.length > 0) {
      for (let i = 0; i < v.audioTracks.length; i++) {
        v.audioTracks[i].enabled = (v.audioTracks[i].id === id || `audio-${i}` === id);
      }
    }
    const track = audioTracks.find((t) => t.id === id);
    showOsd(`Audio: ${track?.title || id}`);
  };

  const handleSelectSubtitleTrack = async (id: string) => {
    setSelectedSubtitleTrack(id);
    if (id === 'off') {
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
    if (track?.filePath) {
      await loadExternalSubtitleFile(track.filePath, track.title);
    } else if (videoRef.current && videoRef.current.textTracks) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = (id === `embedded-${i}`) ? 'showing' : 'disabled';
      }
    }
    showOsd(`Subtitles: ${track?.title || id}`);
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
      className={`relative w-screen h-screen bg-black text-white overflow-hidden flex flex-col select-none ${
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
          {/* Video Element with Autoplay */}
          {videoSrc ? (
            videoSrc === 'sample://preview' ? (
              <img
                src="/sample_frame.jpg"
                alt="Sample Video Playback"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop={loop}
                onPlay={() => {
                  setPlaying(true);
                  bumpHud();
                }}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  detectTracks();
                  e.currentTarget.play().catch(() => {});
                }}
                onCanPlay={(e) => {
                  e.currentTarget.play().catch(() => {});
                }}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            /* Minimalist Sharp Empty State (Right-Angled, Clean, No Bloat) */
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 max-w-sm animate-in fade-in duration-200">
              <div
                className="w-12 h-12 bg-white/[0.05] border border-white/10 flex items-center justify-center mb-4 group cursor-pointer hover:border-amber-400 transition"
                onClick={handleOpenFile}
              >
                <Play size={18} className="fill-amber-400 text-amber-400 ml-0.5" />
              </div>

              <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-200 mb-1">
                No Media Loaded
              </h2>
              <p className="text-[11px] text-zinc-500 mb-5 leading-normal">
                Drop any video file here or select one from disk
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenFile}
                  className="px-3.5 py-1.5 bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition"
                >
                  <FolderOpen size={13} className="text-zinc-950" />
                  <span>Open Video</span>
                </button>

                <button
                  onClick={() => setDrawer('playlist')}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition border border-white/[0.08]"
                >
                  <ListMusic size={13} />
                  <span>Queue</span>
                </button>
              </div>

              <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span>Space: Play</span>
                <span>•</span>
                <span>←/→: Seek</span>
                <span>•</span>
                <span>Right-Click: Menu</span>
              </div>
            </div>
          )}

          {/* Drag Overlay Hint */}
          {isDraggingFile && (
            <div className="absolute inset-2 border border-dashed border-amber-400/80 bg-black/80 flex flex-col items-center justify-center gap-2 z-50 pointer-events-none animate-in fade-in">
              <Film size={28} className="text-amber-400" />
              <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Drop video to play</div>
            </div>
          )}

          {/* OSD Toast Notification */}
          <OsdOverlay message={osdMessage} />

          {/* Framed Subtitle Display */}
          {(activeCueText || drawer === 'subtitles') && (
            <div
              style={{
                top: `${Math.min(Math.max(subConfig.vertical_position, 10), 96)}%`,
                transform: 'translateY(-100%)',
                fontSize: `${subConfig.font_size}px`,
                backgroundColor: `rgba(0, 0, 0, ${subConfig.background_opacity})`,
              }}
              className="absolute px-4 py-1.5 text-center whitespace-pre-line pointer-events-none border border-white/10 shadow-2xl transition-all duration-75 text-zinc-100 font-medium tracking-wide max-w-2xl"
            >
              {activeCueText || 'Subtitle Framing Preview — Drag slider to adjust'}
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
