import React, { useEffect, useRef, useState } from 'react';
import type { DrawerPanel, TrackInfo } from '../../core/types';
import {
  FolderOpen,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sliders,
  Subtitles,
  ListMusic,
  Maximize,
  Minimize,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Gauge,
  Repeat,
  Camera,
  X,
  ChevronRight,
  Check,
} from 'lucide-react';

interface PlayerContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  playing: boolean;
  onTogglePlay: () => void;
  onSeekDelta: (seconds: number) => void;
  onOpenFile: () => void;
  onOpenDrawer: (panel: DrawerPanel) => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  isFullScreen: boolean;
  speed: number;
  onSetSpeed: (speed: number) => void;
  loop: boolean;
  onToggleLoop: () => void;
  onTakeScreenshot: () => void;
  onCloseMedia: () => void;
  volume: number;
  onToggleMute: () => void;
  hasMedia: boolean;
  audioTracks?: TrackInfo[];
  selectedAudioTrack?: string;
  onSelectAudioTrack?: (id: string) => void;
  subtitleTracks?: TrackInfo[];
  selectedSubtitleTrack?: string;
  onSelectSubtitleTrack?: (id: string) => void;
}

export const PlayerContextMenu: React.FC<PlayerContextMenuProps> = ({
  x,
  y,
  onClose,
  playing,
  onTogglePlay,
  onSeekDelta,
  onOpenFile,
  onOpenDrawer,
  onOpenSettings,
  onToggleFullscreen,
  isFullScreen,
  speed,
  onSetSpeed,
  loop,
  onToggleLoop,
  onTakeScreenshot,
  onCloseMedia,
  volume,
  onToggleMute,
  hasMedia,
  audioTracks = [],
  selectedAudioTrack = 'default',
  onSelectAudioTrack,
  subtitleTracks = [],
  selectedSubtitleTrack = 'off',
  onSelectSubtitleTrack,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number }>({ x, y });

  // Clamp context menu inside the viewport so it never clips off-screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 8;
      const maxY = window.innerHeight - rect.height - 8;
      setAdjustedPos({
        x: Math.max(8, Math.min(x, maxX)),
        y: Math.max(8, Math.min(y, maxY)),
      });
    }
  }, [x, y]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      className="fixed z-50 w-56 bg-[#0D0E15]/95 backdrop-blur-xl border border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.85)] py-1 text-zinc-200 select-none text-[11.5px] font-sans"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* File Menu Section */}
      <button
        onClick={() => {
          onOpenFile();
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <div className="flex items-center gap-2.5">
          <FolderOpen size={13} className="text-amber-400" />
          <span>Open Media File…</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">Ctrl+O</span>
      </button>

      {hasMedia && (
        <button
          onClick={() => {
            onCloseMedia();
            onClose();
          }}
          className="w-full h-7 px-3 flex items-center gap-2.5 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
        >
          <X size={13} className="text-zinc-400" />
          <span>Close Media</span>
        </button>
      )}

      <div className="w-full h-px bg-white/[0.08] my-1" />

      {/* Playback Controls */}
      <button
        onClick={() => {
          onTogglePlay();
          onClose();
        }}
        disabled={!hasMedia}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition disabled:opacity-30"
      >
        <div className="flex items-center gap-2.5">
          {playing ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-amber-400" />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">Space</span>
      </button>

      <button
        onClick={() => {
          onSeekDelta(-5);
          onClose();
        }}
        disabled={!hasMedia}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition disabled:opacity-30"
      >
        <div className="flex items-center gap-2.5">
          <RotateCcw size={13} className="text-zinc-400" />
          <span>Seek Backward 5s</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">←</span>
      </button>

      <button
        onClick={() => {
          onSeekDelta(5);
          onClose();
        }}
        disabled={!hasMedia}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition disabled:opacity-30"
      >
        <div className="flex items-center gap-2.5">
          <RotateCw size={13} className="text-zinc-400" />
          <span>Seek Forward 5s</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">→</span>
      </button>

      {/* Playback Speed Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('speed')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white cursor-pointer transition">
          <div className="flex items-center gap-2.5">
            <Gauge size={13} className="text-zinc-400" />
            <span>Playback Speed ({speed}x)</span>
          </div>
          <ChevronRight size={12} className="text-zinc-500" />
        </div>

        {activeSubmenu === 'speed' && (
          <div className="absolute left-full top-0 w-32 bg-[#0D0E15]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl py-1 text-zinc-200">
            {speedOptions.map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  onSetSpeed(rate);
                  onClose();
                }}
                className={`w-full h-6 px-3 flex items-center justify-between hover:bg-white/[0.08] text-[11px] transition ${
                  speed === rate ? 'text-amber-400 font-semibold' : 'text-zinc-300'
                }`}
              >
                <span>{rate}x{rate === 1.0 ? ' (Normal)' : ''}</span>
                {speed === rate && <Check size={11} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loop Toggle */}
      <button
        onClick={() => {
          onToggleLoop();
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <div className="flex items-center gap-2.5">
          <Repeat size={13} className={loop ? 'text-amber-400' : 'text-zinc-400'} />
          <span>Loop Video</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono">{loop ? 'ON' : 'OFF'}</span>
      </button>

      <div className="w-full h-px bg-white/[0.08] my-1" />

      {/* Audio & Equalizer */}
      <button
        onClick={() => {
          onToggleMute();
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <div className="flex items-center gap-2.5">
          {volume === 0 ? <VolumeX size={13} className="text-zinc-400" /> : <Volume2 size={13} className="text-zinc-400" />}
          <span>{volume === 0 ? 'Unmute Audio' : 'Mute Audio'}</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">M</span>
      </button>

      <button
        onClick={() => {
          onOpenDrawer('audio');
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center gap-2.5 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <Sliders size={13} className="text-amber-400" />
        <span>Audio Equalizer & DSP…</span>
      </button>

      {/* Subtitles */}
      <button
        onClick={() => {
          onOpenDrawer('subtitles');
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center gap-2.5 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <Subtitles size={13} className="text-amber-400" />
        <span>Subtitle Framing & Sync…</span>
      </button>

      {/* Audio Track Flyout */}
      {hasMedia && (
        <div
          className="relative"
          onMouseEnter={() => setActiveSubmenu('audio-track')}
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          <div className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white cursor-pointer transition">
            <div className="flex items-center gap-2.5">
              <Volume2 size={13} className="text-zinc-400" />
              <span>Audio Track</span>
            </div>
            <ChevronRight size={12} className="text-zinc-500" />
          </div>

          {activeSubmenu === 'audio-track' && (
            <div className="absolute left-full top-0 w-52 bg-[#0D0E15]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl py-1 text-zinc-200">
              {audioTracks.length === 0 ? (
                <div className="w-full h-6 px-3 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="truncate">Primary Audio (Default)</span>
                  <Check size={11} className="text-amber-400" />
                </div>
              ) : (
                audioTracks.map((track) => {
                  const isSelected = track.id === selectedAudioTrack;
                  return (
                    <button
                      key={track.id}
                      onClick={() => {
                        onSelectAudioTrack?.(track.id);
                        onClose();
                      }}
                      className={`w-full h-6 px-3 flex items-center justify-between hover:bg-white/[0.08] text-[11px] transition ${
                        isSelected ? 'text-amber-400 font-semibold' : 'text-zinc-300'
                      }`}
                    >
                      <span className="truncate">{track.title || track.language || `Track ${track.id}`}</span>
                      {isSelected && <Check size={11} />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtitle Track Flyout */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('subtitle-track')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white cursor-pointer transition">
          <div className="flex items-center gap-2.5">
            <Subtitles size={13} className="text-zinc-400" />
            <span>Subtitle Track</span>
          </div>
          <ChevronRight size={12} className="text-zinc-500" />
        </div>

        {activeSubmenu === 'subtitle-track' && (
          <div className="absolute left-full top-0 w-48 bg-[#0D0E15]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl py-1 text-zinc-200">
            <button
              onClick={() => {
                onSelectSubtitleTrack?.('off');
                onClose();
              }}
              className={`w-full h-6 px-3 flex items-center justify-between hover:bg-white/[0.08] text-[11px] transition ${
                selectedSubtitleTrack === 'off' ? 'text-amber-400 font-semibold' : 'text-zinc-300'
              }`}
            >
              <span>None / Off</span>
              {selectedSubtitleTrack === 'off' && <Check size={11} />}
            </button>
            {subtitleTracks.map((track) => {
              const isSelected = track.id === selectedSubtitleTrack;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    onSelectSubtitleTrack?.(track.id);
                    onClose();
                  }}
                  className={`w-full h-6 px-3 flex items-center justify-between hover:bg-white/[0.08] text-[11px] transition ${
                    isSelected ? 'text-amber-400 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <span className="truncate">{track.title || track.language || track.id}</span>
                  {isSelected && <Check size={11} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Playlist Queue */}
      <button
        onClick={() => {
          onOpenDrawer('playlist');
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center gap-2.5 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <ListMusic size={13} className="text-zinc-400" />
        <span>Playlist Queue…</span>
      </button>

      <div className="w-full h-px bg-white/[0.08] my-1" />

      {/* Video & Frame Capture */}
      <button
        onClick={() => {
          onTakeScreenshot();
          onClose();
        }}
        disabled={!hasMedia}
        className="w-full h-7 px-3 flex items-center gap-2.5 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition disabled:opacity-30"
      >
        <Camera size={13} className="text-zinc-400" />
        <span>Save Current Frame…</span>
      </button>

      <button
        onClick={() => {
          onToggleFullscreen();
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center justify-between hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <div className="flex items-center gap-2.5">
          {isFullScreen ? <Minimize size={13} className="text-zinc-400" /> : <Maximize size={13} className="text-zinc-400" />}
          <span>{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">F</span>
      </button>

      <div className="w-full h-px bg-white/[0.08] my-1" />

      {/* Settings Modal */}
      <button
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
        className="w-full h-7 px-3 flex items-center gap-2.5 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
      >
        <SlidersHorizontal size={13} className="text-zinc-400" />
        <span>Playback Settings…</span>
      </button>
    </div>
  );
};

