import React from 'react';
import type { TrackInfo } from '../../core/types';

interface TrackPickerPopoverProps {
  label: string;
  tracks: TrackInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const TrackPickerPopover: React.FC<TrackPickerPopoverProps> = ({
  label,
  tracks,
  selectedId,
  onSelect,
  onClose,
}) => {
  return (
    <div className="absolute bottom-20 right-24 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 z-30 select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-semibold text-zinc-300">
        <span>{label}</span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="text-xs text-zinc-500 py-2 text-center">No tracks available</div>
        ) : (
          tracks.map((track) => {
            const isSelected = track.id === selectedId;
            return (
              <button
                key={track.id}
                onClick={() => {
                  onSelect(track.id);
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition ${
                  isSelected
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="truncate">{track.title || track.language || track.id}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

