import React from 'react';
import type { TrackInfo } from '../../core/types';
import { X, Check } from 'lucide-react';

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
    <div
      className="absolute bottom-28 right-4 w-64 rounded-[20px] p-1.5 z-30 select-none animate-fade-in glass-deep"
    >
      <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
        <span>{label}</span>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition p-0.5">
          <X size={13} />
        </button>
      </div>
      <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="text-[12px] text-zinc-500 py-3 text-center">No tracks</div>
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
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] text-left transition-all ${
                  isSelected ? 'accent-gradient-soft text-white font-medium' : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="truncate pr-2">{track.title || track.language || track.id}</span>
                {isSelected && <Check size={13} className="shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
