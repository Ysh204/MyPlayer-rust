import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import type { TrackInfo } from '../../core/types';
import { PlayerButton } from './PlayerButton';

export function PlayerPanel({ title, actions, children, onClose }: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <aside className="player-panel" aria-label={title}>
      <div className="panel-heading">
        <h2>{title}</h2>
        <div className="panel-actions">
          {actions}
          <PlayerButton label={`Close ${title.toLowerCase()}`} onClick={onClose}><X size={17} /></PlayerButton>
        </div>
      </div>
      <div className="panel-content">{children}</div>
    </aside>
  );
}

export function TrackList({ tracks, selected, onSelect, label }: {
  label: string;
  tracks: TrackInfo[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const trackList = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const list = trackList.current;
    const row = list?.querySelector('[aria-pressed="true"]');
    if (!list || !row) return;
    const bounds = list.getBoundingClientRect();
    const active = row.getBoundingClientRect();
    if (active.bottom > bounds.bottom) list.scrollTop += active.bottom - bounds.bottom;
    else if (active.top < bounds.top) list.scrollTop += active.top - bounds.top;
  }, [selected, tracks]);
  return (
    <div className="track-list track-scroll" ref={trackList} role="group" aria-label={label}>
      {tracks.map((track) => {
        const label = track.title || track.language || track.id;
        return (
          <button type="button" key={track.id} className="track-row"
            aria-pressed={track.id === selected} onClick={() => onSelect(track.id)} title={label}>
            <span>{label}</span>
            {track.id === selected && <Check size={15} />}
          </button>
        );
      })}
    </div>
  );
}
