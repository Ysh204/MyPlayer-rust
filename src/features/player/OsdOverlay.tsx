import React from 'react';

interface OsdOverlayProps {
  message: string | null;
  progress?: number; // 0.0 to 1.0 optional
}

export const OsdOverlay: React.FC<OsdOverlayProps> = ({ message, progress }) => {
  if (!message) return null;

  return (
    <div className="absolute top-12 right-4 pointer-events-none z-50 transition-opacity duration-150 animate-in fade-in">
      <div className="px-3 py-1.5 bg-[#090A0E]/95 border border-white/[0.1] shadow-2xl flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
        <span className="text-[11px] font-medium text-zinc-200 tracking-wide font-mono">{message}</span>
        {progress !== undefined && (
          <div className="w-14 bg-white/10 h-1 overflow-hidden ml-1">
            <div
              className="bg-amber-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
