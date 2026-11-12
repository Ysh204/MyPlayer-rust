import React from 'react';
import type { SubtitleConfig, TrackInfo } from '../../core/types';
import { Upload, RotateCcw } from 'lucide-react';

interface SubtitlePanelProps {
  config: SubtitleConfig;
  subtitleTracks?: TrackInfo[];
  selectedSubtitleTrackId?: string;
  onSelectSubtitleTrack?: (id: string) => void;
  onChange: (updated: SubtitleConfig, toastMsg?: string) => void;
  onLoadSrtFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-[0.1em] font-semibold text-zinc-500">{children}</div>
);

const SliderRow: React.FC<{
  label: string;
  valueLabel: string;
  children: React.ReactNode;
}> = ({ label, valueLabel, children }) => (
  <div className="space-y-2.5">
    <div className="flex justify-between items-center">
      <Label>{label}</Label>
      <span className="text-[11.5px] font-mono text-accent-300">{valueLabel}</span>
    </div>
    {children}
  </div>
);

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({
  config,
  subtitleTracks = [],
  selectedSubtitleTrackId = 'off',
  onSelectSubtitleTrack,
  onChange,
  onLoadSrtFile,
}) => {
  return (
    <aside
      className="w-[320px] shrink-0 glass-deep animate-fade-in"
      style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}
    >
      <div className="h-full flex flex-col gap-5 p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-display font-semibold tracking-tight text-white">Subtitles</h2>
          <button
            onClick={() =>
              onChange(
                { vertical_position: 92, scale: 1, delay_seconds: 0, font_size: 24, background_opacity: 0.65, external_file_path: null },
                'Subtitles reset'
              )
            }
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11.5px] text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        <div className="space-y-2">
          <Label>Track</Label>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onSelectSubtitleTrack?.('off')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] text-left transition-all ${
                selectedSubtitleTrackId === 'off'
                  ? 'accent-gradient-soft text-white font-medium shadow-lg'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <span>Off</span>
              {selectedSubtitleTrackId === 'off' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
            {subtitleTracks.map((track) => {
              const isSelected = track.id === selectedSubtitleTrackId;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectSubtitleTrack?.(track.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] text-left transition-all ${
                    isSelected
                      ? 'accent-gradient-soft text-white font-medium shadow-lg'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="truncate pr-2">{track.title || track.language || track.id}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-full accent-gradient-soft text-white font-medium text-[12.5px] cursor-pointer hover:brightness-110 active:scale-[0.98] transition shadow-lg">
          <Upload size={13} />
          <span>Load .srt / .vtt</span>
          <input type="file" accept=".srt,.vtt,.ass" onChange={onLoadSrtFile} className="hidden" />
        </label>

        <SliderRow label="Position" valueLabel={`${Math.round(config.vertical_position)}%`}>
          <input
            type="range"
            min={10}
            max={105}
            value={config.vertical_position}
            onChange={(e) => onChange({ ...config, vertical_position: parseFloat(e.target.value) })}
            className="w-full min-slider"
            style={{ ['--progress' as any]: `${((config.vertical_position - 10) / 95) * 100}%` }}
          />
          <p className="text-[11px] text-zinc-500">Above 100% drops into letterbox</p>
        </SliderRow>

        <SliderRow label="Font size" valueLabel={`${Math.round(config.font_size)} px`}>
          <input
            type="range"
            min={14}
            max={54}
            value={config.font_size}
            onChange={(e) => {
              const size = parseFloat(e.target.value);
              onChange({ ...config, font_size: size, scale: size / 24 });
            }}
            className="w-full min-slider"
            style={{ ['--progress' as any]: `${((config.font_size - 14) / 40) * 100}%` }}
          />
        </SliderRow>

        <SliderRow label="Background" valueLabel={`${Math.round(config.background_opacity * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.background_opacity}
            onChange={(e) => onChange({ ...config, background_opacity: parseFloat(e.target.value) })}
            className="w-full min-slider"
            style={{ ['--progress' as any]: `${config.background_opacity * 100}%` }}
          />
        </SliderRow>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Sync offset</Label>
            <span className="text-[11.5px] font-mono text-accent-300">{Math.round(config.delay_seconds * 1000)} ms</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '-100ms', delta: -0.1 },
              { label: 'Reset', value: 0 },
              { label: '+100ms', delta: 0.1 },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => {
                  const next = b.value !== undefined ? b.value : config.delay_seconds + (b.delta ?? 0);
                  onChange({ ...config, delay_seconds: next }, `Delay ${Math.round(next * 1000)} ms`);
                }}
                className="py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11.5px] font-mono transition text-zinc-300"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
