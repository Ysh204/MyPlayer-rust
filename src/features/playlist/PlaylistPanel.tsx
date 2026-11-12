import React from 'react';
import type { PlaylistItem } from '../../core/types';
import { Plus, Trash2, X, Play } from 'lucide-react';

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
    <aside
      className="w-[320px] shrink-0 glass-deep animate-fade-in"
      style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
    >
      <div className="h-full flex flex-col gap-3 p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-display font-semibold tracking-tight text-white">
            Queue <span className="text-zinc-500 font-normal">{items.length}</span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onAddFiles}
              title="Add files"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onClear}
              disabled={items.length === 0}
              title="Clear queue"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition disabled:opacity-20"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-16">
              <div className="w-11 h-11 rounded-full accent-gradient-soft flex items-center justify-center mb-1 shadow-lg">
                <Play size={16} className="text-white fill-white ml-0.5" />
              </div>
              <div className="text-[13px] font-display font-medium text-zinc-200">Queue empty</div>
              <p className="text-[11.5px] text-zinc-500 max-w-[200px]">Drop videos here or add files</p>
              <button
                onClick={onAddFiles}
                className="mt-2 px-4 py-2 rounded-full accent-gradient-soft text-white text-[12px] font-medium hover:brightness-110 active:scale-95 transition shadow-lg"
              >
                Add files
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={item.id || idx}
                  onClick={() => onSelect(idx)}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'accent-gradient-soft text-white shadow-lg'
                      : 'hover:bg-white/[0.06] text-zinc-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono ${
                      isCurrent ? 'bg-white/20 text-white' : 'bg-white/[0.07] text-zinc-400'
                    }`}
                  >
                    {isCurrent ? <Play size={9} className="fill-white ml-px" /> : idx + 1}
                  </div>
                  <span className="text-[12.5px] truncate flex-1 font-medium tracking-tight">{item.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(idx);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition ${
                      isCurrent ? 'hover:bg-white/20' : 'text-zinc-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
