import React, { useState, useRef } from 'react';
import type { DrawerPanel } from '../../core/types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  FolderOpen,
  ListMusic,
  Sliders,
  Subtitles,
  Maximize,
  Minimize,
} from 'lucide-react';

interface BottomControlsBarProps {
  currentTime: number;
  duration: number;
  playing: boolean;
  volume: number;
  drawer: DrawerPanel;
  hudVisible: boolean;
  isFullScreen?: boolean;
  onSeek: (time: number) => void;
  onSeekDelta: (seconds: number) => void;
  onTogglePlay: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenFile: () => void;
  onToggleDrawer: (panel: DrawerPanel) => void;
  onToggleFullscreen?: () => void;
  formatTime: (sec: number) => string;
}

export const BottomControlsBar: React.FC<BottomControlsBarProps> = ({
  currentTime,
  duration,
  playing,
  volume,
  drawer,
  hudVisible,
  isFullScreen = false,
  onSeek,
  onSeekDelta,
  onTogglePlay,
  onVolumeChange,
  onOpenFile,
  onToggleDrawer,
  onToggleFullscreen,
  formatTime,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      setIsMuted(false);
      onVolumeChange(prevVolume > 0 ? prevVolume : 100);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-40 transition-opacity duration-200 select-none ${
        hudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Sharp Right-Angled Obsidian Bar - Vertically Small & Sleek (No Curvy Angles) */}
      <div className="rounded-none bg-[#090A0E]/92 backdrop-blur-xl border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.9)] px-3 py-2 flex flex-col gap-1.5">
        
        {/* Row 1: Compact Transport Controls & Tools */}
        <div className="flex items-center justify-between h-7 text-xs">
          
          {/* Left: Volume & Open File */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition"
              title={volume === 0 || isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {volume === 0 || isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>

            <input
              type="range"
              min={0}
              max={150}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                onVolumeChange(parseInt(e.target.value, 10));
              }}
              className="w-14 sharp-slider"
              title={`Volume: ${volume}%`}
            />

            <span className="text-[10px] font-mono text-zinc-400 w-6 text-right tabular-nums">
              {isMuted ? '0%' : `${volume}%`}
            </span>

            <div className="w-px h-3 bg-white/10 mx-1" />

            <button
              onClick={onOpenFile}
              className="h-6 px-2 flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
              title="Open Video File (Ctrl+O)"
            >
              <FolderOpen size={12} className="text-amber-400" />
              <span>Open</span>
            </button>
          </div>

          {/* Center: Play/Pause, Fast Forward & Rewind */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSeekDelta(-5)}
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition active:scale-90"
              title="Rewind 5s (←)"
            >
              <RotateCcw size={13} />
            </button>

            {/* Sharp Right-Angled Play/Pause Button */}
            <button
              onClick={onTogglePlay}
              className="w-7 h-7 bg-white/[0.1] hover:bg-white/[0.18] border border-white/15 text-amber-400 flex items-center justify-center transition active:scale-95"
              title={playing ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playing ? (
                <Pause size={13} className="fill-current text-amber-400" />
              ) : (
                <Play size={13} className="fill-current text-amber-400 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onSeekDelta(5)}
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition active:scale-90"
              title="Fast Forward 5s (→)"
            >
              <RotateCw size={13} />
            </button>
          </div>

          {/* Right: Feature Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleDrawer(drawer === 'playlist' ? 'none' : 'playlist')}
              className={`h-6 px-2 text-[10.5px] font-medium flex items-center gap-1 transition ${
                drawer === 'playlist'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Playlist Queue"
            >
              <ListMusic size={12} />
              <span>Queue</span>
            </button>

            <button
              onClick={() => onToggleDrawer(drawer === 'audio' ? 'none' : 'audio')}
              className={`h-6 px-2 text-[10.5px] font-medium flex items-center gap-1 transition ${
                drawer === 'audio'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Audio Equalizer"
            >
              <Sliders size={12} />
              <span>EQ</span>
            </button>

            <button
              onClick={() => onToggleDrawer(drawer === 'subtitles' ? 'none' : 'subtitles')}
              className={`h-6 px-2 text-[10.5px] font-medium flex items-center gap-1 transition ${
                drawer === 'subtitles'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Subtitles"
            >
              <Subtitles size={12} />
              <span>Subs</span>
            </button>

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition ml-0.5"
                title="Fullscreen (F)"
              >
                {isFullScreen ? <Minimize size={12} /> : <Maximize size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Smooth 60fps Razor-Thin Timeline */}
        <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-zinc-400 select-none">
          <span className="w-10 text-left tabular-nums shrink-0">{formatTime(currentTime)}</span>

          <div
            ref={trackRef}
            onClick={handleTrackClick}
            onMouseMove={(e) => {
              if (!trackRef.current || duration <= 0) return;
              const rect = trackRef.current.getBoundingClientRect();
              setHoverPosition(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }}
            onMouseLeave={() => setHoverPosition(null)}
            className="relative flex-1 h-3 flex items-center cursor-pointer group"
          >
            {/* Base Track */}
            <div className="w-full h-[2px] group-hover:h-[3px] bg-white/[0.15] relative transition-all duration-100">
              {/* Played Progress Bar */}
              <div
                className="h-full bg-amber-400 relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Tiny Square Playhead */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-white shadow-[0_0_6px_#f59e0b] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Hover Position Ghost Bar */}
              {hoverPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-white/20 pointer-events-none"
                  style={{ width: `${hoverPosition * 100}%` }}
                />
              )}
            </div>
          </div>

          <span className="w-10 text-right tabular-nums shrink-0">{formatTime(duration)}</span>
        </div>

      </div>
    </div>
  );
};
