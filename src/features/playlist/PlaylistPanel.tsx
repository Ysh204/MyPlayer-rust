import React from 'react';
import type { PlaylistItem } from '../../core/types';
import { ListMusic, Plus, Trash2, X, Play, Film } from 'lucide-react';

interface PlaylistPanelProps {
  items: PlaylistItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onAddFiles: () => void;
  onClose: () => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  items,
  currentIndex,
  onSelect,
  onRemove,
  onClear,
  onAddFiles,
  onClose,
}) => {
  return (
    <aside className="w-80 bg-[#090A0E]/95 backdrop-blur-xl border-l border-white/[0.08] p-4 flex flex-col gap-3 text-zinc-100 select-none z-30 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <ListMusic size={13} className="text-amber-400" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Queue ({items.length})
          </h2>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onAddFiles}
            title="Add media files"
            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={onClear}
            disabled={items.length === 0}
            title="Clear playlist"
            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-white/[0.08] transition disabled:opacity-20"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
        {items.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center gap-2 text-zinc-500">
            <Film size={24} className="text-zinc-600" />
            <div className="text-[11px] font-medium text-zinc-400">Queue is empty</div>
            <p className="text-[10px] text-zinc-500 max-w-[180px]">
              Add videos to create a seamless playback queue
            </p>
            <button
              onClick={onAddFiles}
              className="mt-2 px-3 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-[11px] text-zinc-200 transition border border-white/[0.08]"
            >
              Add Files
            </button>
          </div>
        ) : (
          items.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={item.id || idx}
                onClick={() => onSelect(idx)}
                className={`group flex items-center justify-between p-2 cursor-pointer transition border ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/[0.06] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-4 flex items-center justify-center font-mono text-[9.5px] text-zinc-500">
                    {isCurrent ? <Play size={9} className="fill-current text-amber-400" /> : idx + 1}
                  </div>
                  <span className="text-[11px] truncate max-w-[190px] font-medium tracking-tight">
                    {item.title}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 p-0.5 transition"
                  title="Remove from queue"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
