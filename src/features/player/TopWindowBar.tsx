import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, SlidersHorizontal } from 'lucide-react';

interface TopWindowBarProps {
  title: string;
  visible: boolean;
  onOpenSettings: () => void;
}

export const TopWindowBar: React.FC<TopWindowBarProps> = ({ title, visible, onOpenSettings }) => {
  const getAppWindow = () => {
    try {
      if (typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
        return getCurrentWindow();
      }
    } catch (_) {}
    return null;
  };

  return (
    <header
      data-tauri-drag-region
      className={`fixed top-0 left-0 right-0 z-40 h-8 px-3 flex items-center justify-between
        bg-[#090A0E]/90 backdrop-blur-md border-b border-white/[0.08] transition-opacity duration-200 select-none ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      {/* Title & Amber Brand Dot */}
      <div className="flex items-center gap-2 pointer-events-none truncate max-w-lg">
        <span className="w-1.5 h-1.5 bg-amber-500 shadow-[0_0_6px_#f59e0b] shrink-0" />
        <span className="text-[11px] font-medium tracking-tight text-zinc-300 truncate">
          {title}
        </span>
      </div>

      {/* Sharp Right-Angled Window Controls */}
      <div className="flex items-center">
        <button
          onClick={onOpenSettings}
          className="h-8 px-2 flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition"
          title="Playback Settings"
        >
          <SlidersHorizontal size={12} className="text-zinc-400" />
          <span>Settings</span>
        </button>

        <div className="w-px h-3 bg-white/10 mx-1" />

        <button
          onClick={() => getAppWindow()?.minimize()}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          title="Minimize"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => getAppWindow()?.toggleMaximize()}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          title="Maximize"
        >
          <Square size={10} />
        </button>
        <button
          onClick={() => getAppWindow()?.close()}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 transition"
          title="Close"
        >
          <X size={12} />
        </button>
      </div>
    </header>
  );
};
