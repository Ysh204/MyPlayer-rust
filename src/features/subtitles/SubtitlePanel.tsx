import React from 'react';
import type { SubtitleConfig } from '../../core/types';
import { Subtitles, Upload, RotateCcw } from 'lucide-react';

interface SubtitlePanelProps {
  config: SubtitleConfig;
  onChange: (updated: SubtitleConfig, toastMsg?: string) => void;
  onLoadSrtFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({
  config,
  onChange,
  onLoadSrtFile,
}) => {
  return (
    <aside className="w-80 bg-[#090A0E]/95 backdrop-blur-xl border-l border-white/[0.08] p-4 flex flex-col gap-4 text-zinc-100 select-none z-30 shadow-2xl overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Subtitles size={13} className="text-amber-400" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Subtitle Framing
          </h2>
        </div>
        <button
          onClick={() =>
            onChange(
              {
                vertical_position: 92,
                scale: 1,
                delay_seconds: 0,
                font_size: 24,
                background_opacity: 0.65,
                external_file_path: null,
              },
              'Subtitles Reset'
            )
          }
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-amber-400 transition"
          title="Reset Subtitle Settings"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      {/* External Subtitle Loader Card */}
      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white font-medium text-xs cursor-pointer transition border border-white/[0.06] group">
        <Upload size={13} className="text-amber-400" />
        <span>Load External .SRT / .VTT</span>
        <input type="file" accept=".srt,.vtt,.ass" onChange={onLoadSrtFile} className="hidden" />
      </label>

      {/* Vertical Position */}
      <div className="space-y-1 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 text-[11px]">Vertical Placement</span>
          <span className="font-mono text-amber-400 text-[10.5px] font-semibold bg-amber-500/10 px-1.5 py-0.5">
            {Math.round(config.vertical_position)}%
          </span>
        </div>
        <p className="text-[9.5px] text-zinc-500">
          Push &gt;100% to drop subtitles into bottom black letterbox
        </p>
        <input
          type="range"
          min={10}
          max={105}
          value={config.vertical_position}
          onChange={(e) =>
            onChange({ ...config, vertical_position: parseFloat(e.target.value) })
          }
          className="w-full sharp-slider"
        />
      </div>

      {/* Font Size & Scale */}
      <div className="space-y-1 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 text-[11px]">Font Size</span>
          <span className="font-mono text-amber-400 text-[10.5px] font-semibold bg-amber-500/10 px-1.5 py-0.5">
            {Math.round(config.font_size)} px
          </span>
        </div>
        <input
          type="range"
          min={14}
          max={54}
          value={config.font_size}
          onChange={(e) => {
            const size = parseFloat(e.target.value);
            onChange({ ...config, font_size: size, scale: size / 24.0 });
          }}
          className="w-full sharp-slider"
        />
      </div>

      {/* Background Opacity */}
      <div className="space-y-1 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 text-[11px]">Backdrop Box Opacity</span>
          <span className="font-mono text-amber-400 text-[10.5px] font-semibold bg-amber-500/10 px-1.5 py-0.5">
            {Math.round(config.background_opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.background_opacity}
          onChange={(e) =>
            onChange({ ...config, background_opacity: parseFloat(e.target.value) })
          }
          className="w-full sharp-slider"
        />
      </div>

      {/* Subtitle Delay Sync */}
      <div className="space-y-1.5 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 text-[11px]">Sync Delay Offset</span>
          <span className="font-mono text-amber-400 text-[10.5px] font-semibold bg-amber-500/10 px-1.5 py-0.5">
            {Math.round(config.delay_seconds * 1000)} ms
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() =>
              onChange(
                { ...config, delay_seconds: config.delay_seconds - 0.1 },
                `Sub Delay: ${Math.round((config.delay_seconds - 0.1) * 1000)} ms`
              )
            }
            className="py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-mono transition text-zinc-300 border border-white/[0.06]"
          >
            -100ms
          </button>
          <button
            onClick={() => onChange({ ...config, delay_seconds: 0 }, 'Sub Delay: 0 ms')}
            className="py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-mono transition text-zinc-400 border border-white/[0.06]"
          >
            0ms
          </button>
          <button
            onClick={() =>
              onChange(
                { ...config, delay_seconds: config.delay_seconds + 0.1 },
                `Sub Delay: ${Math.round((config.delay_seconds + 0.1) * 1000)} ms`
              )
            }
            className="py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-mono transition text-zinc-300 border border-white/[0.06]"
          >
            +100ms
          </button>
        </div>
      </div>
    </aside>
  );
};
