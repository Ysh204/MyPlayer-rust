import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Settings2, Play } from 'lucide-react';

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
      className={`fixed top-0 left-0 right-0 z-40 h-11 px-4 flex items-center justify-between transition-all duration-300 select-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{
        background: 'linear-gradient(to bottom, rgba(5,5,7,0.65), rgba(5,5,7,0.25) 70%, transparent)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div className="flex items-center gap-2.5 pointer-events-none min-w-0">
        <span className="w-6 h-6 rounded-lg accent-gradient-soft flex items-center justify-center shrink-0 shadow-lg">
          <Play size={11} className="text-white fill-white ml-px" />
        </span>
        <span className="text-[13px] font-display font-600 tracking-tight text-zinc-100 truncate">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Settings"
        >
          <Settings2 size={13} />
          <span className="hidden sm:inline">Settings</span>
        </button>
        <div className="w-px h-4 bg-white/10 mx-1.5" />
        <button
          onClick={() => getAppWindow()?.minimize()}
          className="w-8 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={() => getAppWindow()?.toggleMaximize()}
          className="w-8 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Maximize"
        >
          <Square size={10} />
        </button>
        <button
          onClick={() => getAppWindow()?.close()}
          className="w-8 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
