import React from 'react';
import { Settings2, X, Cpu, History, Crosshair, FastForward, Volume2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-md bg-[#090A0E] border border-white/[0.1] shadow-[0_24px_64px_rgba(0,0,0,0.9)] p-5 flex flex-col gap-4 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Settings2 size={15} className="text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-100">Playback Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X size={13} />
          </button>
        </div>

        {/* Settings List */}
        <div className="space-y-2 text-xs">
          {/* Hardware Decoding */}
          <label className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-center gap-2.5">
              <Cpu size={14} className="text-amber-400" />
              <div>
                <div className="font-medium text-zinc-200 text-[11px]">Hardware Acceleration</div>
                <div className="text-[10px] text-zinc-500">Auto-safe GPU decoding (D3D11VA / NVDEC)</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hardwareDecoding}
              onChange={(e) => onUpdateHardwareDecoding(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
            />
          </label>

          {/* Auto Resume */}
          <label className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-center gap-2.5">
              <History size={14} className="text-amber-400" />
              <div>
                <div className="font-medium text-zinc-200 text-[11px]">Auto-Resume Playback</div>
                <div className="text-[10px] text-zinc-500">Remembers timestamp when reopening files</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoResume}
              onChange={(e) => onUpdateAutoResume(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
            />
          </label>

          {/* Frame-accurate Seeking */}
          <label className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-center gap-2.5">
              <Crosshair size={14} className="text-amber-400" />
              <div>
                <div className="font-medium text-zinc-200 text-[11px]">Frame-Accurate Seeking</div>
                <div className="text-[10px] text-zinc-500">Seek to precise frames rather than keyframes</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={precisionSeeking}
              onChange={(e) => onUpdatePrecisionSeeking(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
            />
          </label>

          {/* Seek Jump Amount */}
          <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <FastForward size={14} className="text-amber-400" />
              <div>
                <div className="font-medium text-zinc-200 text-[11px]">Seek Jump Amount</div>
                <div className="text-[10px] text-zinc-500">Arrow Left / Right skip distance</div>
              </div>
            </div>
            <select
              value={seekStepSeconds}
              onChange={(e) => onUpdateSeekStep(Number(e.target.value))}
              className="bg-black border border-white/10 px-2 py-0.5 text-[11px] text-amber-400 font-mono focus:outline-none cursor-pointer"
            >
              {[2, 3, 5, 10, 15, 30].map((s) => (
                <option key={s} value={s}>
                  {s}s
                </option>
              ))}
            </select>
          </div>

          {/* Volume Step */}
          <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Volume2 size={14} className="text-amber-400" />
              <div>
                <div className="font-medium text-zinc-200 text-[11px]">Volume Step Amount</div>
                <div className="text-[10px] text-zinc-500">Arrow Up / Down percentage change</div>
              </div>
            </div>
            <select
              value={volumeStepPercent}
              onChange={(e) => onUpdateVolumeStep(Number(e.target.value))}
              className="bg-black border border-white/10 px-2 py-0.5 text-[11px] text-amber-400 font-mono focus:outline-none cursor-pointer"
            >
              {[1, 2, 5, 10].map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
