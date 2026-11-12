import React from 'react';
import { X, Cpu, History, Crosshair, FastForward, Volume2 } from 'lucide-react';

interface PlaybackSettingsModalProps {
  visible: boolean;
  hardwareDecoding: boolean;
  autoResume: boolean;
  seekStepSeconds: number;
  volumeStepPercent: number;
  precisionSeeking: boolean;
  onUpdateHardwareDecoding: (val: boolean) => void;
  onUpdateAutoResume: (val: boolean) => void;
  onUpdateSeekStep: (val: number) => void;
  onUpdateVolumeStep: (val: number) => void;
  onUpdatePrecisionSeeking: (val: boolean) => void;
  onClose: () => void;
}

const ToggleRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ icon, title, desc, checked, onChange }) => (
  <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] cursor-pointer hover:bg-white/[0.06] transition">
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-xl accent-gradient-soft flex items-center justify-center">{icon}</span>
      <div>
        <div className="font-medium text-white text-[13px]">{title}</div>
        <div className="text-[11.5px] text-zinc-500">{desc}</div>
      </div>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-indigo-400 cursor-pointer shrink-0"
    />
  </label>
);

const SelectRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  value: number;
  options: number[];
  suffix: string;
  onChange: (v: number) => void;
}> = ({ icon, title, desc, value, options, suffix, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-xl accent-gradient-soft flex items-center justify-center">{icon}</span>
      <div>
        <div className="font-medium text-white text-[13px]">{title}</div>
        <div className="text-[11.5px] text-zinc-500">{desc}</div>
      </div>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-[12px] text-accent-300 font-mono focus:outline-none cursor-pointer"
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
          {suffix}
        </option>
      ))}
    </select>
  </div>
);

export const PlaybackSettingsModal: React.FC<PlaybackSettingsModalProps> = ({
  visible,
  hardwareDecoding,
  autoResume,
  seekStepSeconds,
  volumeStepPercent,
  precisionSeeking,
  onUpdateHardwareDecoding,
  onUpdateAutoResume,
  onUpdateSeekStep,
  onUpdateVolumeStep,
  onUpdatePrecisionSeeking,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="glass-deep w-full max-w-md rounded-[24px] p-6 flex flex-col gap-4 text-zinc-100 animate-rise-in">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-display font-semibold tracking-tight text-white">Playback settings</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <ToggleRow
            icon={<Cpu size={14} className="text-white" />}
            title="Hardware acceleration"
            desc="GPU decoding (D3D11VA / NVDEC)"
            checked={hardwareDecoding}
            onChange={onUpdateHardwareDecoding}
          />
          <ToggleRow
            icon={<History size={14} className="text-white" />}
            title="Resume position"
            desc="Remember timestamp when reopening"
            checked={autoResume}
            onChange={onUpdateAutoResume}
          />
          <ToggleRow
            icon={<Crosshair size={14} className="text-white" />}
            title="Frame-accurate seeking"
            desc="Seek to precise frames"
            checked={precisionSeeking}
            onChange={onUpdatePrecisionSeeking}
          />
          <SelectRow
            icon={<FastForward size={14} className="text-white" />}
            title="Seek step"
            desc="Arrow left / right distance"
            value={seekStepSeconds}
            options={[2, 3, 5, 10, 15, 30]}
            suffix="s"
            onChange={onUpdateSeekStep}
          />
          <SelectRow
            icon={<Volume2 size={14} className="text-white" />}
            title="Volume step"
            desc="Arrow up / down change"
            value={volumeStepPercent}
            options={[1, 2, 5, 10]}
            suffix="%"
            onChange={onUpdateVolumeStep}
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full accent-gradient-soft text-white font-medium text-[13px] hover:brightness-110 active:scale-95 transition shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
