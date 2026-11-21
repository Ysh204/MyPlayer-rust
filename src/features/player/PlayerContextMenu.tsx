import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, Bookmark, Camera, Captions, Check, ChevronRight, FolderOpen, Gauge, ListMusic, Maximize,
  Minimize, Pause, Play, Repeat, Settings2, SlidersHorizontal, Volume2, X,
} from 'lucide-react';
import type { DrawerPanel, TrackInfo } from '../../core/types';

export interface MenuAnchor { x: number; y: number; above?: boolean; trigger?: HTMLElement }

interface Props {
  anchor: MenuAnchor;
  onClose: (restoreFocus?: boolean) => void;
  hasMedia: boolean;
  canSnapshot: boolean;
  playing: boolean;
  fullscreen: boolean;
  speed: number;
  loop: boolean;
  audioTracks: TrackInfo[];
  selectedAudio: string;
  onSelectAudio: (id: string) => void;
  subtitleTracks: TrackInfo[];
  selectedSubtitle: string;
  onSelectSubtitle: (id: string) => void;
  onPlay: () => void;
  onOpen: () => void;
  onDrawer: (panel: DrawerPanel) => void;
  onSettings: () => void;
  onFullscreen: () => void;
  onSpeed: (speed: number) => void;
  onLoop: () => void;
  onSnapshot: () => void;
  onCloseMedia: () => void;
}

function MenuItem({ icon, children, hint, end, disabled, onClick }: {
  icon?: ReactNode; children: ReactNode; hint?: string; end?: ReactNode; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" className="menu-item" disabled={disabled} onClick={onClick}>
      {icon && <span className="menu-icon">{icon}</span>}
      <span className="menu-label">{children}</span>
      {hint && <span className="menu-hint">{hint}</span>}
      {end}
    </button>
  );
}

export function PlayerContextMenu(props: Props) {
  const { anchor, onClose } = props;
  const [page, setPage] = useState<'main' | 'speed' | 'audio' | 'subtitles'>('main');
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = menu.current;
    if (!element) return;
    const place = () => {
      const { offsetWidth: width, offsetHeight: height } = element;
      const left = anchor.above ? anchor.x - width : anchor.x;
      const top = anchor.above ? anchor.y - height : anchor.y;
      element.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener('resize', place);
    element.scrollTop = 0;
    element.querySelector('button')?.focus({ preventScroll: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [anchor, page]);

  useLayoutEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !anchor.trigger?.contains(target)) onClose();
    };
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, [anchor, onClose]);

  const run = (action: () => void) => {
    onClose(true);
    action();
  };
  const tracks = page === 'audio' ? props.audioTracks : props.subtitleTracks;
  const selected = page === 'audio' ? props.selectedAudio : props.selectedSubtitle;
  const select = page === 'audio' ? props.onSelectAudio : props.onSelectSubtitle;

  return (
    <div className="player-menu" ref={menu} role="group" aria-label="Playback actions"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }}>
      {page === 'main' ? (
        <>
          <MenuItem icon={<FolderOpen size={15} />} hint="Ctrl+O" onClick={() => run(props.onOpen)}>Open file…</MenuItem>
          <MenuItem icon={props.playing ? <Pause size={15} /> : <Play size={15} />} hint="Space" disabled={!props.hasMedia} onClick={() => run(props.onPlay)}>
            {props.playing ? 'Pause' : 'Play'}
          </MenuItem>
          <MenuItem icon={<Gauge size={15} />} hint={`${props.speed}×`} end={<ChevronRight size={14} />} onClick={() => setPage('speed')}>Playback speed</MenuItem>
          <MenuItem icon={<Repeat size={15} />} end={props.loop && <Check size={15} />} onClick={() => run(props.onLoop)}>Loop video</MenuItem>
          <MenuItem icon={<Bookmark size={15} />} disabled={!props.hasMedia} onClick={() => run(() => props.onDrawer('marks'))}>Bookmarks &amp; loop</MenuItem>
          <hr />
          {props.audioTracks.length > 1 && <MenuItem icon={<Volume2 size={15} />} end={<ChevronRight size={14} />} onClick={() => setPage('audio')}>Audio track</MenuItem>}
          {props.subtitleTracks.length > 1 && <MenuItem icon={<Captions size={15} />} end={<ChevronRight size={14} />} onClick={() => setPage('subtitles')}>Subtitle track</MenuItem>}
          <MenuItem icon={<SlidersHorizontal size={15} />} onClick={() => run(() => props.onDrawer('audio'))}>Audio and equalizer</MenuItem>
          <MenuItem icon={<Captions size={15} />} onClick={() => run(() => props.onDrawer('subtitles'))}>Subtitles</MenuItem>
          <MenuItem icon={<ListMusic size={15} />} onClick={() => run(() => props.onDrawer('playlist'))}>Queue</MenuItem>
          <MenuItem icon={<Settings2 size={15} />} onClick={() => run(props.onSettings)}>Playback settings</MenuItem>
          <hr />
          <MenuItem icon={<Camera size={15} />} disabled={!props.canSnapshot} onClick={() => run(props.onSnapshot)}>Save frame…</MenuItem>
          <MenuItem icon={props.fullscreen ? <Minimize size={15} /> : <Maximize size={15} />} hint="F" onClick={() => run(props.onFullscreen)}>
            {props.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </MenuItem>
          {props.hasMedia && <MenuItem icon={<X size={15} />} onClick={() => run(props.onCloseMedia)}>Close media</MenuItem>}
        </>
      ) : (
        <>
          <MenuItem icon={<ArrowLeft size={15} />} onClick={() => setPage('main')}>Playback actions</MenuItem>
          <hr />
          {page === 'speed' ? [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
            <MenuItem key={speed} end={speed === props.speed && <Check size={15} />} onClick={() => run(() => props.onSpeed(speed))}>
              {speed}×{speed === 1 ? ' (normal)' : ''}
            </MenuItem>
          )) : tracks.map((track) => (
            <MenuItem key={track.id} end={track.id === selected && <Check size={15} />} onClick={() => run(() => select(track.id))}>
              {track.title || track.language || track.id}
            </MenuItem>
          ))}
        </>
      )}
    </div>
  );
}
