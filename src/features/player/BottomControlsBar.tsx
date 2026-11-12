import React, { useState, useRef } from 'react';
import type { DrawerPanel } from '../../core/types';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  FolderOpen,
  ListMusic,
  SlidersHorizontal,
  Captions,
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

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({
  active,
  className,
  children,
  ...props
}) => (
  <button
    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 ${
      active
        ? 'accent-gradient-soft text-white shadow-lg'
        : 'text-zinc-300 hover:text-white hover:bg-white/10'
    } ${className ?? ''}`}
    {...props}
  >
    {children}
  </button>
);

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

  const volPct = isMuted ? 0 : Math.min(volume, 100);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(94vw,880px)] z-40 select-none transition-all duration-300 ${
        hudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="glass rounded-[22px] px-4 pt-3.5 pb-3.5 flex flex-col gap-3">
        {/* Transport row */}
        <div className="flex items-center gap-2">
          {/* Volume */}
          <div className="flex items-center gap-2 shrink-0">
            <IconButton onClick={toggleMute} title={volume === 0 || isMuted ? 'Unmute (M)' : 'Mute (M)'}>
              {volume === 0 || isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </IconButton>
            <input
              type="range"
              min={0}
              max={100}
              value={volPct}
              onChange={(e) => {
                setIsMuted(false);
                onVolumeChange(parseInt(e.target.value, 10));
              }}
              className="hidden sm:block w-24 min-slider"
              style={{ ['--progress' as any]: `${volPct}%` }}
              title={`Volume: ${volume}%`}
            />
            <span className="hidden sm:block text-[11px] text-zinc-400 tabular-nums w-8 font-mono">
              {isMuted ? '0' : volume}
            </span>
          </div>

          {/* Center: playback */}
          <div className="flex items-center gap-1.5 mx-auto">
            <IconButton onClick={() => onSeekDelta(-5)} title="Rewind 5s (←)">
              <Rewind size={17} />
            </IconButton>
            <button
              onClick={onTogglePlay}
              className="w-12 h-12 rounded-full accent-gradient-soft text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-[0_8px_28px_rgba(99,102,241,0.45)] shrink-0"
              title={playing ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playing ? (
                <Pause size={20} className="fill-white" />
              ) : (
                <Play size={20} className="fill-white ml-0.5" />
              )}
            </button>
            <IconButton onClick={() => onSeekDelta(5)} title="Forward 5s (→)">
              <FastForward size={17} />
            </IconButton>
          </div>

          {/* Right: tools */}
          <div className="flex items-center gap-1 shrink-0">
            <IconButton onClick={onOpenFile} title="Open (Ctrl+O)">
              <FolderOpen size={17} />
            </IconButton>
            <IconButton
              onClick={() => onToggleDrawer(drawer === 'playlist' ? 'none' : 'playlist')}
              active={drawer === 'playlist'}
              title="Queue"
            >
              <ListMusic size={17} />
            </IconButton>
            <IconButton
              onClick={() => onToggleDrawer(drawer === 'audio' ? 'none' : 'audio')}
              active={drawer === 'audio'}
              title="Audio & EQ"
            >
              <SlidersHorizontal size={17} />
            </IconButton>
            <IconButton
              onClick={() => onToggleDrawer(drawer === 'subtitles' ? 'none' : 'subtitles')}
              active={drawer === 'subtitles'}
              title="Subtitles"
            >
              <Captions size={17} />
            </IconButton>
            {onToggleFullscreen && (
              <IconButton onClick={onToggleFullscreen} title="Fullscreen (F)">
                {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </IconButton>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] font-mono text-zinc-300 tabular-nums shrink-0 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            onMouseMove={(e) => {
              if (!trackRef.current || duration <= 0) return;
              const rect = trackRef.current.getBoundingClientRect();
              setHoverPosition(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }}
            onMouseLeave={() => setHoverPosition(null)}
            className="relative flex-1 h-6 flex items-center cursor-pointer group"
          >
            <div className="relative w-full h-[5px] group-hover:h-[7px] rounded-full bg-white/[0.13] transition-all duration-150 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full accent-gradient"
                style={{ width: `${progressPercent}%` }}
              />
              {hoverPosition !== null && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none"
                  style={{ width: `${hoverPosition * 100}%` }}
                />
              )}
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_2px_10px_rgba(99,102,241,0.6)] opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11.5px] font-mono text-zinc-500 tabular-nums shrink-0 w-12">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
