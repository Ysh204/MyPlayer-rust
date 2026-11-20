import { useState } from 'react';
import { GripVertical, Play, Plus, Trash2, X } from 'lucide-react';
import type { PlaylistItem } from '../../core/types';
import { PlayerButton } from '../player/PlayerButton';
import { PlayerPanel } from '../player/PlayerPanel';

interface Props {
  items: PlaylistItem[];
  activeId?: string;
  onSelect: (item: PlaylistItem) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, before: string | null) => void;
  onClear: () => void;
  onAdd: () => void;
  onClose: () => void;
}

export function PlaylistPanel({ items, activeId, onSelect, onRemove, onMove, onClear, onAdd, onClose }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; before: boolean } | null>(null);

  return (
    <PlayerPanel title="Queue" onClose={onClose} actions={
      <>
        <PlayerButton label="Add files" onClick={onAdd}><Plus size={17} /></PlayerButton>
        <PlayerButton label="Clear queue" onClick={onClear} disabled={!items.length}><Trash2 size={15} /></PlayerButton>
      </>
    }>
      {items.length === 0 ? (
        <div className="queue-empty">
          <p className="help-text">Videos you open will appear here.</p>
          <button type="button" className="secondary-button" onClick={onAdd}><Plus size={14} /> Add files</button>
        </div>
      ) : (
        <ol className="queue-list">
          {items.map((item, index) => {
            const active = item.id === activeId;
            const target = dropTarget?.id === item.id ? dropTarget : null;
            return (
              <li key={item.id} aria-current={active}
                className={`queue-row ${target ? (target.before ? 'drop-before' : 'drop-after') : ''}`}
                onDragOver={(event) => {
                  if (!dragging || dragging === item.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  const rect = event.currentTarget.getBoundingClientRect();
                  setDropTarget({ id: item.id, before: event.clientY < rect.top + rect.height / 2 });
                }}
                onDrop={(event) => {
                  if (!dragging || !target) return;
                  event.preventDefault();
                  onMove(dragging, target.before ? item.id : (items[index + 1]?.id ?? null));
                  setDropTarget(null);
                  setDragging(null);
                }}>
                <span className="queue-grip" draggable title="Drag to reorder"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', item.id);
                    setDragging(item.id);
                  }}
                  onDragEnd={() => { setDragging(null); setDropTarget(null); }}>
                  <GripVertical size={13} />
                </span>
                <button type="button" className="queue-item" onClick={() => onSelect(item)} title={item.title}
                  onKeyDown={(event) => {
                    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                    event.preventDefault();
                    const down = event.key === 'ArrowDown';
                    if (down ? index < items.length - 1 : index > 0) {
                      onMove(item.id, down ? (items[index + 2]?.id ?? null) : items[index - 1].id);
                    }
                  }}>
                  <span className="queue-number">{active ? <Play size={12} fill="currentColor" /> : index + 1}</span>
                  <span>{item.title}</span>
                </button>
                <PlayerButton label={`Remove ${item.title}`} onClick={() => onRemove(item.id)}><X size={14} /></PlayerButton>
              </li>
            );
          })}
        </ol>
      )}
    </PlayerPanel>
  );
}
