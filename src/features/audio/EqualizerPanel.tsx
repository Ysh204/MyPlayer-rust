import type { CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import type { EqPreset, EqState, TrackInfo } from '../../core/types';
import { PlayerButton } from '../player/PlayerButton';
import { PlayerPanel, TrackList } from '../player/PlayerPanel';

interface Props {
  eq: EqState;
  presets: EqPreset[];
  audioTracks: TrackInfo[];
  selectedTrack: string;
  onSelectTrack: (id: string) => void;
  onChange: (eq: EqState) => void;
  onReset: () => void;
  onClose: () => void;
}

export function EqualizerPanel({ eq, presets, audioTracks, selectedTrack, onSelectTrack, onChange, onReset, onClose }: Props) {
  const delay = Math.round(eq.audio_delay_sec * 1000);
  return (
    <PlayerPanel title="Audio" onClose={onClose}
      actions={<PlayerButton label="Reset audio settings" onClick={onReset}><RotateCcw size={15} /></PlayerButton>}>
      <div className="panel-stack">
        <section className="panel-section">
          <h3 className="panel-label">Audio track</h3>
          {audioTracks.length ? <TrackList tracks={audioTracks} selected={selectedTrack} onSelect={onSelectTrack} /> :
            <p className="help-text">The player selects the default audio track.</p>}
        </section>

        <label className="panel-section">
          <span className="panel-label">Equalizer preset</span>
          <select className="field-select" value={eq.active_preset} onChange={(event) => {
            const preset = presets.find(({ name }) => name === event.currentTarget.value);
            if (preset) onChange({ ...eq, gains: [...preset.gains], active_preset: preset.name });
          }}>
            {presets.map(({ name }) => <option key={name}>{name}</option>)}
            {eq.active_preset === 'Custom' && <option>Custom</option>}
          </select>
        </label>

        <div className="eq-bands" aria-label="Five-band equalizer">
          {eq.frequencies.map((frequency, index) => (
            <label className="eq-band" key={frequency}>
              <span>{eq.gains[index] > 0 ? '+' : ''}{eq.gains[index]}</span>
              <input type="range" className="player-range" aria-label={`${frequency} Hz`} min={-12} max={12} step={0.5}
                value={eq.gains[index]} onChange={(event) => {
                  const gains = [...eq.gains] as EqState['gains'];
                  gains[index] = event.currentTarget.valueAsNumber;
                  onChange({ ...eq, gains, active_preset: 'Custom' });
                }} />
              <span>{frequency >= 1000 ? `${frequency / 1000}k` : frequency}</span>
            </label>
          ))}
        </div>

        <label className="panel-section">
          <span className="field-label">
            <span className="panel-label">Preamp</span>
            <span className="field-value">{eq.preamp_db > 0 ? '+' : ''}{eq.preamp_db.toFixed(1)} dB</span>
          </span>
          <input type="range" className="player-range" aria-label="Preamp" min={-12} max={12} step={0.5} value={eq.preamp_db}
            style={{ '--progress': `${(eq.preamp_db + 12) / 24 * 100}%` } as CSSProperties}
            onChange={(event) => onChange({ ...eq, preamp_db: event.currentTarget.valueAsNumber })} />
        </label>

        <label className="toggle-field">
          <span><span className="panel-label">Night mode</span><small className="help-text block">Reduce loud peaks</small></span>
          <input type="checkbox" checked={eq.compressor} onChange={(event) => onChange({ ...eq, compressor: event.currentTarget.checked })} />
        </label>

        <section className="panel-section">
          <div className="field-label"><h3 className="panel-label">Audio delay</h3><span className="field-value">{delay} ms</span></div>
          <div className="step-buttons">
            {[-50, 0, 50].map((step) => (
              <button type="button" className="secondary-button" key={step} disabled={(step < 0 && delay <= 0) || (step > 0 && delay >= 5000)}
                onClick={() => onChange({ ...eq, audio_delay_sec: step ? (delay + step) / 1000 : 0 })}>
                {step === 0 ? 'Reset' : `${step > 0 ? '+' : '−'}${Math.abs(step)} ms`}
              </button>
            ))}
          </div>
        </section>
      </div>
    </PlayerPanel>
  );
}
