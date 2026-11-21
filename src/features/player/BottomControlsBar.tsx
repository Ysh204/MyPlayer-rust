import { memo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import {
  Captions, Ellipsis, ListMusic, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw,
  SkipBack, SkipForward, Volume2, VolumeX,
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
  bookmarks: number[];
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (time: number) => void;
  onSeekComplete: () => void;
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

const TimelineMarks = memo(function TimelineMarks({ bookmarks, duration, start, end }: {
  bookmarks: number[]; duration: number; start: number | null; end: number | null;
}) {
  if (!duration) return null;
  return <div aria-hidden="true" className="timeline-marks">
    {start !== null && end !== null && <span className="loop-span" style={{ left: start / duration * 100 + '%', width: (end - start) / duration * 100 + '%' }} />}
    {bookmarks.filter((time) => time <= duration).map((time) => <i key={time} style={{ left: time / duration * 100 + '%' }} />)}
  </div>;
});

export function BottomControlsBar({
  currentTime, duration, playing, canPlay, volume, drawer, isFullScreen, seekStep, hasPrevious, hasNext,
  menuOpen, bookmarks, loopStart, loopEnd, onSeek, onSeekDelta, onSeekComplete, onTogglePlay, onVolumeChange, onToggleMute, onPrevious, onNext,
  onToggleDrawer, onToggleFullscreen, onOpenMenu,
}: Props) {
  const scrubbing = useRef(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const position = Math.min(scrubTime ?? currentTime, duration);
  function finishDrag(input: HTMLInputElement, commit: boolean) {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    if (commit) {
      onSeek(input.valueAsNumber);
      onSeekComplete();
    }
    setScrubTime(null);
  }
  const [remaining, setRemaining] = useState(false);
  const preview = useRef<HTMLOutputElement>(null);
  function previewTime(event: PointerEvent<HTMLInputElement>) {
    if (!duration || !preview.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // The range thumb stops half a thumb-width inside either end of the track.
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left - 4) / Math.max(1, rect.width - 8)));
    preview.current.style.left = (4 + fraction * (rect.width - 8)) + 'px';
    preview.current.textContent = formatTime(fraction * duration);
  }
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
        <span className="time-elapsed">{formatTime(position)}</span>
        <div className="timeline-scrubber">
        <TimelineMarks bookmarks={bookmarks} duration={duration} start={loopStart} end={loopEnd} />
        <input
          type="range" className="player-range timeline-range" aria-label="Playback position"
          aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`} min={0} max={duration || 1}
          step="any" value={position} disabled={!duration}
          style={{ '--progress': `${duration ? position / duration * 100 : 0}%` } as CSSProperties}
          onPointerDown={(event) => {
            if (event.button !== 0 || !event.isPrimary) return;
            scrubbing.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setScrubTime(event.currentTarget.valueAsNumber);
          }}
          onChange={(event) => {
            if (scrubbing.current) setScrubTime(event.currentTarget.valueAsNumber);
            else onSeek(event.currentTarget.valueAsNumber);
          }}
          onPointerUp={(event) => finishDrag(event.currentTarget, true)}
          onPointerCancel={(event) => finishDrag(event.currentTarget, false)}
          onLostPointerCapture={(event) => finishDrag(event.currentTarget, true)}
          onBlur={(event) => { finishDrag(event.currentTarget, true); onSeekComplete(); }}
          onPointerEnter={previewTime} onPointerMove={previewTime}
          onKeyDown={(event) => {
            const direction = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
            if (direction) {
              event.preventDefault();
              onSeekDelta(direction * seekStep);
            }
          }}
        />
        <output aria-hidden="true" className="time-preview" ref={preview} />
        </div>
        <button type="button" className="timeline-duration" aria-pressed={remaining}
          aria-label={remaining ? 'Show total duration' : 'Show remaining time'}
          title={remaining ? 'Show total duration' : 'Show remaining time'} onClick={() => setRemaining(!remaining)}>
          {remaining ? '−' + formatTime(duration - position) : formatTime(duration)}
        </button>
      </div>
      <div className="transport-group transport-tools">
        <div className="volume-group">
          <PlayerButton label={volume ? 'Mute (M)' : 'Unmute (M)'} onClick={onToggleMute}>
            {volume ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </PlayerButton>
          <div className="volume-popup"><div><output aria-hidden="true">{volume}%</output><input
            type="range" className="player-range volume-range" aria-label="Volume" min={0} max={150}
            value={volume} aria-valuetext={`${volume}%`}
            style={{ '--progress': `${volume / 1.5}%` } as CSSProperties}
            onChange={(event) => onVolumeChange(event.currentTarget.valueAsNumber)}
          /></div></div>
        </div>
        <PlayerButton label="Subtitles" aria-pressed={drawer === 'subtitles'} onClick={() => onToggleDrawer('subtitles')}><Captions size={15} /></PlayerButton>
        <PlayerButton label="Queue" aria-pressed={drawer === 'playlist'} onClick={() => onToggleDrawer('playlist')}><ListMusic size={16} /></PlayerButton>
        <PlayerButton label="More actions" aria-expanded={menuOpen} onClick={onOpenMenu}><Ellipsis size={16} /></PlayerButton>
        <PlayerButton label={isFullScreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'} onClick={onToggleFullscreen}>
          {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </PlayerButton>
      </div>
    </footer>
  );
}
