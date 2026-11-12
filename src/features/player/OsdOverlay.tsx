import React from 'react';

interface OsdOverlayProps {
  message: string | null;
}

export const OsdOverlay: React.FC<OsdOverlayProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-fade-in">
      <div className="glass-deep rounded-full px-4 py-2 text-[12.5px] font-display font-medium text-zinc-100 tracking-tight flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full accent-gradient" />
        {message}
      </div>
    </div>
  );
};
