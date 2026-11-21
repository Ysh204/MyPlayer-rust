import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  Bookmark, Camera, Captions, Check, ChevronRight, FolderOpen, Gauge, ListMusic, Maximize,
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

type Submenu = 'speed' | 'audio' | 'subtitles';

function MenuItem({ icon, children, hint, end, disabled, onClick, submenu, expanded, selected }: {
  submenu?: Submenu; expanded?: boolean; selected?: boolean;
  icon?: ReactNode; children: ReactNode; hint?: string; end?: ReactNode; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" className="menu-item" disabled={disabled} data-submenu={submenu} aria-expanded={expanded} aria-pressed={selected} onClick={onClick}>
      {icon && <span className="menu-icon">{icon}</span>}
      <span className="menu-label">{children}</span>
      {hint && <span className="menu-hint">{hint}</span>}
      {end}
    </button>
  );
}

export function PlayerContextMenu(props: Props) {
  const { anchor, onClose } = props;
  const [page, setPage] = useState<Submenu | null>(null);
  const menu = useRef<HTMLDivElement>(null);
  const flyout = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number>();
  const focusOnOpen = useRef(false);

  function cancelHover() { window.clearTimeout(hoverTimer.current); }
  function openPage(next: Submenu | null, focus = false) {
    cancelHover();
    focusOnOpen.current = focus;
    if (focus && next === page) focusChoice();
    setPage(next);
  }
  function hoverPage(next: Submenu | null) {
    cancelHover();
    if (next === page) return;
    if (!page) openPage(next);
    else hoverTimer.current = window.setTimeout(() => openPage(next), 180);
  }
  function focusChoice() {
    const current = flyout.current;
    (current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ?? current?.querySelector('button'))?.focus();
  }

  useLayoutEffect(() => {
    const element = menu.current;
    if (!element) return;
    const place = () => {
      const gap = 8;
      const width = element.offsetWidth;
      const maxLeft = window.innerWidth - width - gap;
      const left = Math.max(gap, Math.min(anchor.above ? anchor.x - width : anchor.x, maxLeft));
      // Reserve enough space on one side, including in a compact window.
      const room = Math.min(180, Math.max(0, maxLeft - gap));
      const x = left - gap >= maxLeft - left ? Math.max(left, gap + room) : Math.min(left, maxLeft - room);
      element.style.left = x + 'px';
      const top = anchor.above ? anchor.y - element.offsetHeight : anchor.y;
      element.style.top = Math.max(gap, Math.min(top, window.innerHeight - element.offsetHeight - gap)) + 'px';
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener('resize', place);
    element.querySelector('button')?.focus({ preventScroll: true });
    return () => {
      cancelHover();
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [anchor]);

  useLayoutEffect(() => {
    const parent = menu.current;
    const child = flyout.current;
    const trigger = parent?.querySelector<HTMLButtonElement>('[data-submenu="' + page + '"]');
    if (!parent || !child || !trigger) return;
    const place = () => {
      const rect = parent.getBoundingClientRect();
      const row = trigger.getBoundingClientRect();
      const right = window.innerWidth - rect.right - 8;
      const left = rect.left - 8;
      const toRight = right >= 290 || right >= left;
      child.style.width = Math.min(290, toRight ? right : left) + 'px';
      child.style.left = (toRight ? rect.right : rect.left - child.offsetWidth) + 'px';
      child.style.top = Math.max(8, Math.min(row.top - 5, window.innerHeight - child.offsetHeight - 8)) + 'px';
    };
    place();
    if (focusOnOpen.current) focusChoice();
    else child.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
    const observer = new ResizeObserver(place);
    observer.observe(parent);
    observer.observe(child);
    parent.addEventListener('scroll', place);
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      parent.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, [anchor, page]);

  useLayoutEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !flyout.current?.contains(target) && !anchor.trigger?.contains(target)) onClose();
    };
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, [anchor, onClose]);

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const inFlyout = event.currentTarget === flyout.current;
    const target = event.target as HTMLButtonElement;
    if (page && (event.key === 'Escape' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      menu.current?.querySelector<HTMLButtonElement>('[data-submenu="' + page + '"]')?.focus();
      openPage(null);
      return;
    }
    if (!inFlyout && event.key === 'ArrowRight' && target.dataset.submenu) {
      event.preventDefault();
      openPage(target.dataset.submenu as Submenu, true);
      return;
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    if (!inFlyout) openPage(null);
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const index = buttons.indexOf(target);
    buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  }
  const run = (action: () => void) => {
    onClose(true);
    action();
  };
  const tracks = page === 'audio' ? props.audioTracks : props.subtitleTracks;
  const selected = page === 'audio' ? props.selectedAudio : props.selectedSubtitle;
  const select = page === 'audio' ? props.onSelectAudio : props.onSelectSubtitle;

  return (
    <div onContextMenu={(event) => event.preventDefault()}
      onPointerLeave={() => hoverPage(null)}>
      <div className="player-menu" ref={menu} role="group" aria-label="Playback actions" onKeyDown={navigate}
        onPointerOver={(event) => {
          if (event.pointerType !== 'mouse') return;
          const button = (event.target as Element).closest('button');
          if (button) hoverPage((button.dataset.submenu as Submenu | undefined) ?? null);
        }}>
        <MenuItem icon={<FolderOpen size={15} />} hint="Ctrl+O" onClick={() => run(props.onOpen)}>Open file…</MenuItem>
        <MenuItem icon={props.playing ? <Pause size={15} /> : <Play size={15} />} hint="Space" disabled={!props.hasMedia} onClick={() => run(props.onPlay)}>
          {props.playing ? 'Pause' : 'Play'}
        </MenuItem>
        <MenuItem icon={<Gauge size={15} />} hint={`${props.speed}×`} end={<ChevronRight size={14} />} submenu="speed" expanded={page === 'speed'} onClick={() => openPage('speed', true)}>Playback speed</MenuItem>
        <MenuItem icon={<Repeat size={15} />} end={props.loop && <Check size={15} />} onClick={() => run(props.onLoop)}>Loop video</MenuItem>
        <MenuItem icon={<Bookmark size={15} />} disabled={!props.hasMedia} onClick={() => run(() => props.onDrawer('marks'))}>Bookmarks &amp; loop</MenuItem>
        <hr />
        {props.audioTracks.length > 0 && <MenuItem icon={<Volume2 size={15} />} end={<ChevronRight size={14} />} submenu="audio" expanded={page === 'audio'} onClick={() => openPage('audio', true)}>Audio track</MenuItem>}
        {props.subtitleTracks.length > 1 && <MenuItem icon={<Captions size={15} />} end={<ChevronRight size={14} />} submenu="subtitles" expanded={page === 'subtitles'} onClick={() => openPage('subtitles', true)}>Subtitle track</MenuItem>}
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
      </div>
      {page && <div key={page} ref={flyout} className="player-menu track-flyout" role="group"
        aria-label={page === 'subtitles' ? 'Subtitle tracks' : page === 'audio' ? 'Audio tracks' : 'Playback speeds'}
        onPointerEnter={cancelHover} onKeyDown={navigate}>
        {page === 'speed' ? [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
          <MenuItem key={speed} selected={speed === props.speed} end={speed === props.speed && <Check size={15} />} onClick={() => run(() => props.onSpeed(speed))}>
            {speed}×{speed === 1 ? ' (normal)' : ''}
          </MenuItem>
        )) : tracks.map((track) => (
          <MenuItem key={track.id} selected={track.id === selected} end={track.id === selected && <Check size={15} />} onClick={() => run(() => select(track.id))}>
            {track.title || track.language || track.id}
          </MenuItem>
        ))}
      </div>}
    </div>
  );
}
