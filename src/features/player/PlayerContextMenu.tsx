import React, { useEffect, useRef, useState } from 'react';
import type { DrawerPanel, TrackInfo } from '../../core/types';
import {
  FolderOpen,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Captions,
  ListMusic,
  Maximize,
  Minimize,
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

const Item: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { hint?: string }> = ({
  hint,
  className,
  children,
  ...props
}) => (
  <button
    className={`w-full h-8 px-3 flex items-center justify-between rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-30 text-[12.5px] ${className ?? ''}`}
    {...props}
  >
    <span className="flex items-center gap-2.5">{children}</span>
    {hint && <span className="text-[11px] text-zinc-500 font-mono">{hint}</span>}
  </button>
);

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

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
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

  const menuStyle: React.CSSProperties = {
    background: 'rgba(12,12,18,0.88)',
    backdropFilter: 'blur(24px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 20px 56px rgba(0,0,0,0.6)',
  };

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedPos.x, top: adjustedPos.y, ...menuStyle }}
      className="fixed z-50 w-60 rounded-[20px] p-1.5 text-zinc-200 select-none animate-fade-in"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Item onClick={() => { onOpenFile(); onClose(); }} hint="Ctrl+O">
        <FolderOpen size={14} className="text-zinc-400" /> Open file…
      </Item>
      {hasMedia && (
        <Item onClick={() => { onCloseMedia(); onClose(); }}>
          <X size={14} className="text-zinc-400" /> Close media
        </Item>
      )}

      <div className="mx-2 my-1.5 h-px bg-white/[0.08]" />

      <Item onClick={() => { onTogglePlay(); onClose(); }} disabled={!hasMedia} hint="Space">
        {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
      </Item>
      <Item onClick={() => { onSeekDelta(-5); onClose(); }} disabled={!hasMedia} hint="←">
        <RotateCcw size={14} className="text-zinc-400" /> Back 5s
      </Item>
      <Item onClick={() => { onSeekDelta(5); onClose(); }} disabled={!hasMedia} hint="→">
        <RotateCw size={14} className="text-zinc-400" /> Forward 5s
      </Item>

      <div className="relative" onMouseEnter={() => setActiveSubmenu('speed')} onMouseLeave={() => setActiveSubmenu(null)}>
        <div className="w-full h-8 px-3 flex items-center justify-between rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition text-[12.5px]">
          <span className="flex items-center gap-2.5">
            <Gauge size={14} className="text-zinc-400" /> Speed · {speed}x
          </span>
          <ChevronRight size={13} className="text-zinc-500" />
        </div>
        {activeSubmenu === 'speed' && (
          <div className="absolute left-full top-0 w-36 rounded-[20px] p-1.5 ml-1" style={menuStyle}>
            {speedOptions.map((rate) => (
              <button
                key={rate}
                onClick={() => { onSetSpeed(rate); onClose(); }}
                className={`w-full h-7 px-3 rounded-xl flex items-center justify-between text-[12px] transition hover:bg-white/[0.08] ${
                  speed === rate ? 'text-white font-medium' : 'text-zinc-400'
                }`}
              >
                <span>{rate}x{rate === 1 ? ' · Normal' : ''}</span>
                {speed === rate && <Check size={12} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <Item onClick={() => { onToggleLoop(); onClose(); }}>
        <Repeat size={14} className={loop ? 'text-accent-300' : 'text-zinc-400'} />
        Loop <span className={`text-[11px] font-mono ${loop ? 'text-accent-300' : 'text-zinc-500'}`}>{loop ? 'ON' : 'OFF'}</span>
      </Item>

      <div className="mx-2 my-1.5 h-px bg-white/[0.08]" />

      <Item onClick={() => { onToggleMute(); onClose(); }} hint="M">
        {volume === 0 ? <VolumeX size={14} className="text-zinc-400" /> : <Volume2 size={14} className="text-zinc-400" />}
        {volume === 0 ? 'Unmute' : 'Mute'}
      </Item>
      <Item onClick={() => { onOpenDrawer('audio'); onClose(); }}>
        <SlidersHorizontal size={14} className="text-zinc-400" /> Audio & EQ…
      </Item>
      <Item onClick={() => { onOpenDrawer('subtitles'); onClose(); }}>
        <Captions size={14} className="text-zinc-400" /> Subtitles…
      </Item>

      {hasMedia && (
        <div className="relative" onMouseEnter={() => setActiveSubmenu('audio-track')} onMouseLeave={() => setActiveSubmenu(null)}>
          <div className="w-full h-8 px-3 flex items-center justify-between rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition text-[12.5px]">
            <span className="flex items-center gap-2.5">
              <Volume2 size={14} className="text-zinc-400" /> Audio track
            </span>
            <ChevronRight size={13} className="text-zinc-500" />
          </div>
          {activeSubmenu === 'audio-track' && (
            <div className="absolute left-full top-0 w-56 rounded-[20px] p-1.5 ml-1 max-h-64 overflow-y-auto" style={menuStyle}>
              {(audioTracks.length === 0 ? [{ id: 'default', title: 'Default' }] : audioTracks).map((track) => {
                const isSelected = track.id === selectedAudioTrack;
                return (
                  <button
                    key={track.id}
                    onClick={() => { onSelectAudioTrack?.(track.id); onClose(); }}
                    className={`w-full h-7 px-3 rounded-xl flex items-center justify-between text-[12px] transition hover:bg-white/[0.08] ${
                      isSelected ? 'text-white font-medium' : 'text-zinc-400'
                    }`}
                  >
                    <span className="truncate">{track.title || track.language || `Track ${track.id}`}</span>
                    {isSelected && <Check size={12} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="relative" onMouseEnter={() => setActiveSubmenu('subtitle-track')} onMouseLeave={() => setActiveSubmenu(null)}>
        <div className="w-full h-8 px-3 flex items-center justify-between rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition text-[12.5px]">
          <span className="flex items-center gap-2.5">
            <Captions size={14} className="text-zinc-400" /> Subtitle track
          </span>
          <ChevronRight size={13} className="text-zinc-500" />
        </div>
        {activeSubmenu === 'subtitle-track' && (
          <div className="absolute left-full top-0 w-52 rounded-[20px] p-1.5 ml-1 max-h-64 overflow-y-auto" style={menuStyle}>
            <button
              onClick={() => { onSelectSubtitleTrack?.('off'); onClose(); }}
              className={`w-full h-7 px-3 rounded-xl flex items-center justify-between text-[12px] transition hover:bg-white/[0.08] ${
                selectedSubtitleTrack === 'off' ? 'text-white font-medium' : 'text-zinc-400'
              }`}
            >
              <span>Off</span>
              {selectedSubtitleTrack === 'off' && <Check size={12} />}
            </button>
            {subtitleTracks.map((track) => {
              const isSelected = track.id === selectedSubtitleTrack;
              return (
                <button
                  key={track.id}
                  onClick={() => { onSelectSubtitleTrack?.(track.id); onClose(); }}
                  className={`w-full h-7 px-3 rounded-xl flex items-center justify-between text-[12px] transition hover:bg-white/[0.08] ${
                    isSelected ? 'text-white font-medium' : 'text-zinc-400'
                  }`}
                >
                  <span className="truncate">{track.title || track.language || track.id}</span>
                  {isSelected && <Check size={12} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Item onClick={() => { onOpenDrawer('playlist'); onClose(); }}>
        <ListMusic size={14} className="text-zinc-400" /> Queue…
      </Item>

      <div className="mx-2 my-1.5 h-px bg-white/[0.08]" />

      <Item onClick={() => { onTakeScreenshot(); onClose(); }} disabled={!hasMedia}>
        <Camera size={14} className="text-zinc-400" /> Save frame…
      </Item>
      <Item onClick={() => { onToggleFullscreen(); onClose(); }} hint="F">
        {isFullScreen ? <Minimize size={14} className="text-zinc-400" /> : <Maximize size={14} className="text-zinc-400" />}
        {isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
      </Item>

      <div className="mx-2 my-1.5 h-px bg-white/[0.08]" />

      <Item onClick={() => { onOpenSettings(); onClose(); }}>
        <SlidersHorizontal size={14} className="text-zinc-400" /> Settings…
      </Item>
    </div>
  );
};
