import React from 'react';
import type { EqPreset, EqState, TrackInfo } from '../../core/types';
import { RotateCcw, Moon } from 'lucide-react';

interface EqualizerPanelProps {
  eq: EqState;
  presets: EqPreset[];
  afFilterPreview: string;
  audioTracks?: TrackInfo[];
  selectedAudioTrackId?: string;
  onSelectAudioTrack?: (id: string) => void;
  onChange: (updated: EqState, toastMsg?: string) => void;
  onReset: () => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-zinc-500">{children}</div>
);

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  eq,
  presets,
  afFilterPreview,
  audioTracks = [],
  selectedAudioTrackId = 'default',
  onSelectAudioTrack,
  onChange,
  onReset,
}) => {
  const handleBandChange = (idx: number, val: number) => {
    const nextGains = [...eq.gains] as [number, number, number, number, number];
    nextGains[idx] = val;
    onChange({ ...eq, gains: nextGains, active_preset: 'Custom' });
  };

  return (
    <aside
      className="w-[320px] shrink-0 glass-deep animate-fade-in"
      style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
    >
      <div className="h-full flex flex-col gap-5 p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-display font-semibold tracking-tight text-white">Audio</h2>
          <button
            onClick={onReset}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11.5px] text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        <div className="space-y-2">
          <Label>Track</Label>
          <div className="flex flex-col gap-1">
            {audioTracks.map((track) => {
              const isSelected = track.id === selectedAudioTrackId;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectAudioTrack?.(track.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] text-left transition-all ${
                    isSelected
                      ? 'accent-gradient-soft text-white font-medium shadow-lg'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="truncate pr-2">{track.title || track.language || `Track ${track.id}`}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = eq.active_preset === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() =>
                    onChange({ ...eq, gains: [...p.gains] as EqState['gains'], active_preset: p.name }, `Preset: ${p.name}`)
                  }
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                    active
                      ? 'accent-gradient-soft text-white shadow-lg'
                      : 'bg-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.1]'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Preamp</Label>
            <span className="text-[11.5px] font-mono text-accent-300">
              {eq.preamp_db >= 0 ? `+${eq.preamp_db.toFixed(1)}` : eq.preamp_db.toFixed(1)} dB
            </span>
          </div>
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={eq.preamp_db}
            onChange={(e) => onChange({ ...eq, preamp_db: parseFloat(e.target.value) })}
            className="w-full min-slider"
            style={{ ['--progress' as any]: `${((eq.preamp_db + 12) / 24) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          <Label>Equalizer</Label>
          <div className="grid grid-cols-5 gap-2 px-1 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
            {eq.frequencies.map((freq, idx) => (
              <div key={freq} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400">
                  {eq.gains[idx] > 0 ? `+${eq.gains[idx]}` : eq.gains[idx]}
                </span>
                <div className="h-28 flex items-center justify-center w-6">
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

        <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] cursor-pointer hover:bg-white/[0.06] transition">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl accent-gradient-soft flex items-center justify-center">
              <Moon size={14} className="text-white" />
            </span>
            <div>
              <div className="text-[12.5px] font-medium text-white">Night Mode</div>
              <div className="text-[11px] text-zinc-500">Soften loud peaks</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={eq.compressor}
            onChange={(e) => onChange({ ...eq, compressor: e.target.checked }, `Night Mode: ${e.target.checked ? 'ON' : 'OFF'}`)}
            className="w-4 h-4 accent-indigo-400 cursor-pointer shrink-0"
          />
        </label>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Delay</Label>
            <span className="text-[11.5px] font-mono text-accent-300">{Math.round(eq.audio_delay_sec * 1000)} ms</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '-50ms', delta: -0.05 },
              { label: 'Reset', value: 0 },
              { label: '+50ms', delta: 0.05 },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => {
                  const next = b.value !== undefined ? b.value : eq.audio_delay_sec + (b.delta ?? 0);
                  onChange({ ...eq, audio_delay_sec: next }, `Delay: ${Math.round(next * 1000)} ms`);
                }}
                className="py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11.5px] font-mono transition text-zinc-300"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {afFilterPreview && (
          <div className="mt-auto pt-3 border-t border-white/[0.07]">
            <Label>Filter</Label>
            <div className="mt-1.5 p-2.5 rounded-xl bg-black/50 border border-white/[0.07] text-[10.5px] text-zinc-500 font-mono break-all leading-relaxed">
              {afFilterPreview}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
