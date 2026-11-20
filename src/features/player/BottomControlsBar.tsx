import type { CSSProperties, MouseEvent } from 'react';
import {
  Captions, Ellipsis, ListMusic, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw,
  SkipBack, SkipForward, SlidersHorizontal, Volume2, VolumeX,
} from 'lucide-react';
import type { DrawerPanel } from '../../core/types';
import { PlayerButton } from './PlayerButton';

interface Props {
  currentTime: number;
  duration: number;
  playing: boolean;
  canPlay: boolean;
  volume: number;
  drawer: DrawerPanel;
  isFullScreen: boolean;
  seekStep: number;
  hasPrevious: boolean;
  hasNext: boolean;
  menuOpen: boolean;
  onSeek: (time: number) => void;
  onSeekDelta: (seconds: number) => void;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleDrawer: (panel: DrawerPanel) => void;
  onToggleFullscreen: () => void;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

export function BottomControlsBar({
  currentTime, duration, playing, canPlay, volume, drawer, isFullScreen, seekStep, hasPrevious, hasNext,
  menuOpen, onSeek, onSeekDelta, onTogglePlay, onVolumeChange, onToggleMute, onPrevious, onNext,
  onToggleDrawer, onToggleFullscreen, onOpenMenu,
}: Props) {
  const position = Math.min(currentTime, duration);
  return (
    <footer className="transport" aria-label="Playback controls">
      <div className="transport-group transport-playback">
        <PlayerButton className="play-button" label={playing ? 'Pause (Space)' : 'Play (Space)'} disabled={!canPlay} onClick={onTogglePlay}>
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </PlayerButton>
        <PlayerButton className="queue-skip" label="Previous in queue" disabled={!hasPrevious} onClick={onPrevious}><SkipBack size={14} /></PlayerButton>
        <PlayerButton label={`Back ${seekStep} seconds`} disabled={!duration} onClick={() => onSeekDelta(-seekStep)}><RotateCcw size={14} /></PlayerButton>
        <PlayerButton label={`Forward ${seekStep} seconds`} disabled={!duration} onClick={() => onSeekDelta(seekStep)}><RotateCw size={14} /></PlayerButton>
        <PlayerButton className="queue-skip" label="Next in queue" disabled={!hasNext} onClick={onNext}><SkipForward size={14} /></PlayerButton>
      </div>
      <div className="timeline">
        <span>{formatTime(position)}</span>
        <input
          type="range" className="player-range timeline-range" aria-label="Playback position"
          aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`} min={0} max={duration || 1}
          step="any" value={position} disabled={!duration}
          style={{ '--progress': `${duration ? position / duration * 100 : 0}%` } as CSSProperties}
          onChange={(event) => onSeek(event.currentTarget.valueAsNumber)}
          onKeyDown={(event) => {
            const direction = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
            if (direction) {
              event.preventDefault();
              onSeekDelta(direction * seekStep);
            }
          }}
        />
        <span className="timeline-duration">{formatTime(duration)}</span>
      </div>
      <div className="transport-group transport-tools">
        <div className="volume-group">
          <PlayerButton label={volume ? 'Mute (M)' : 'Unmute (M)'} onClick={onToggleMute}>
            {volume ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </PlayerButton>
          <input
            type="range" className="player-range volume-range" aria-label="Volume" min={0} max={150}
            value={volume} aria-valuetext={`${volume}%`}
            style={{ '--progress': `${volume / 1.5}%` } as CSSProperties}
            onChange={(event) => onVolumeChange(event.currentTarget.valueAsNumber)}
          />
        </div>
        <PlayerButton label="Subtitles" aria-pressed={drawer === 'subtitles'} onClick={() => onToggleDrawer('subtitles')}><Captions size={15} /></PlayerButton>
        <PlayerButton className="audio-tool" label="Audio and equalizer" aria-pressed={drawer === 'audio'} onClick={() => onToggleDrawer('audio')}><SlidersHorizontal size={14} /></PlayerButton>
        <PlayerButton label="Queue" aria-pressed={drawer === 'playlist'} onClick={() => onToggleDrawer('playlist')}><ListMusic size={16} /></PlayerButton>
        <PlayerButton label="More actions" aria-expanded={menuOpen} onClick={onOpenMenu}><Ellipsis size={16} /></PlayerButton>
        <PlayerButton label={isFullScreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'} onClick={onToggleFullscreen}>
          {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </PlayerButton>
      </div>
    </footer>
  );
}
