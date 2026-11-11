import React from 'react';
import type { EqPreset, EqState } from '../../core/types';
import { Sliders, RotateCcw, Moon } from 'lucide-react';

interface EqualizerPanelProps {
  eq: EqState;
  presets: EqPreset[];
  afFilterPreview: string;
  onChange: (updated: EqState, toastMsg?: string) => void;
  onReset: () => void;
}

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  eq,
  presets,
  afFilterPreview,
  onChange,
  onReset,
}) => {
  const handleBandChange = (idx: number, val: number) => {
    const nextGains = [...eq.gains] as [number, number, number, number, number];
    nextGains[idx] = val;
    onChange({ ...eq, gains: nextGains, active_preset: 'Custom' });
  };

  return (
    <aside className="w-80 bg-[#090A0E]/95 backdrop-blur-xl border-l border-white/[0.08] p-4 flex flex-col gap-4 text-zinc-100 select-none z-30 shadow-2xl overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Sliders size={13} className="text-amber-400" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Audio Equalizer
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-amber-400 transition"
          title="Reset Equalizer"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase font-semibold text-zinc-500 tracking-wider">Presets</span>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => {
            const active = eq.active_preset === p.name;
            return (
              <button
                key={p.name}
                onClick={() =>
                  onChange(
                    { ...eq, gains: [...p.gains] as EqState['gains'], active_preset: p.name },
                    `Preset: ${p.name}`
                  )
                }
                className={`px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.06]'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preamp Boost Slider */}
      <div className="space-y-1 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 text-[11px]">Preamp Gain</span>
          <span className="font-mono text-amber-400 text-[10.5px] font-semibold bg-amber-500/10 px-1.5 py-0.5">
            {eq.preamp_db >= 0 ? `+${eq.preamp_db.toFixed(1)}` : eq.preamp_db.toFixed(1)} dB
          </span>
        </div>
        <input
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={eq.preamp_db}
          onChange={(e) =>
            onChange(
              { ...eq, preamp_db: parseFloat(e.target.value) },
              `Preamp: ${parseFloat(e.target.value).toFixed(1)} dB`
            )
          }
          className="w-full sharp-slider"
        />
      </div>

      {/* 5-Band Vertical Equalizer Section */}
      <div className="space-y-1.5 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <span className="text-[9px] uppercase font-semibold text-zinc-500 tracking-wider">5-Band Parametric</span>
        <div className="grid grid-cols-5 gap-1 pt-1 pb-1">
          {eq.frequencies.map((freq, idx) => (
            <div key={freq} className="flex flex-col items-center gap-1.5">
              <span className="text-[9.5px] font-mono text-zinc-400">
                {eq.gains[idx] > 0 ? `+${eq.gains[idx]}` : eq.gains[idx]}
              </span>
              <div className="h-28 flex items-center justify-center relative w-7">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-px bg-white/20 pointer-events-none" />
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={eq.gains[idx]}
                  onChange={(e) => handleBandChange(idx, parseFloat(e.target.value))}
                  className="vertical-fader"
                />
              </div>
              <span className="text-[9.5px] font-mono text-zinc-500">
                {freq >= 1000 ? `${freq / 1000}k` : `${freq}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Night Mode Compressor */}
      <label className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition">
        <div className="flex items-center gap-2">
          <Moon size={13} className="text-amber-400" />
          <div>
            <div className="text-[11px] font-medium text-zinc-200">Night Mode</div>
            <div className="text-[9.5px] text-zinc-500">Compresses loud audio peaks</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={eq.compressor}
          onChange={(e) =>
            onChange(
              { ...eq, compressor: e.target.checked },
              `Night Mode: ${e.target.checked ? 'ON' : 'OFF'}`
            )
          }
          className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
        />
      </label>

      {/* Audio Sync Delay */}
      <div className="space-y-1.5 bg-white/[0.02] p-2.5 border border-white/[0.06]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 text-[11px]">Audio Delay</span>
          <span className="font-mono text-amber-400 text-[10.5px] font-semibold bg-amber-500/10 px-1.5 py-0.5">
            {Math.round(eq.audio_delay_sec * 1000)} ms
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() =>
              onChange(
                { ...eq, audio_delay_sec: eq.audio_delay_sec - 0.05 },
                `Delay: ${Math.round((eq.audio_delay_sec - 0.05) * 1000)} ms`
              )
            }
            className="py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-mono transition text-zinc-300 border border-white/[0.06]"
          >
            -50ms
          </button>
          <button
            onClick={() => onChange({ ...eq, audio_delay_sec: 0 }, 'Delay: 0 ms')}
            className="py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-mono transition text-zinc-400 border border-white/[0.06]"
          >
            0ms
          </button>
          <button
            onClick={() =>
              onChange(
                { ...eq, audio_delay_sec: eq.audio_delay_sec + 0.05 },
                `Delay: ${Math.round((eq.audio_delay_sec + 0.05) * 1000)} ms`
              )
            }
            className="py-1 bg-white/[0.05] hover:bg-white/[0.1] text-[10.5px] font-mono transition text-zinc-300 border border-white/[0.06]"
          >
            +50ms
          </button>
        </div>
      </div>

      {/* Live Filter String Output */}
      <div className="mt-auto pt-2 border-t border-white/[0.08]">
        <div className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">
          Active Filter String
        </div>
        <div className="p-2 bg-black/80 border border-white/[0.06] text-[9.5px] text-zinc-400 font-mono break-all leading-tight">
          {afFilterPreview || 'flat (bypass)'}
        </div>
      </div>
    </aside>
  );
};
