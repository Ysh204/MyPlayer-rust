import type { CSSProperties } from 'react';
import { FolderOpen, RotateCcw } from 'lucide-react';
import type { SubtitleConfig, TrackInfo } from '../../core/types';
import { PlayerButton } from '../player/PlayerButton';
import { PlayerPanel, TrackList } from '../player/PlayerPanel';

interface Props {
  config: SubtitleConfig;
  tracks: TrackInfo[];
  selected: string;
  hasMedia: boolean;
  onSelect: (id: string) => void;
  onChange: (config: SubtitleConfig) => void;
  onLoad: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function SubtitlePanel({ config, tracks, selected, hasMedia, onSelect, onChange, onLoad, onReset, onClose }: Props) {
  const delay = Math.round(config.delay_seconds * 1000);
  const fields = [
    { key: 'vertical_position', label: 'Vertical position', min: 10, max: 105, step: 1, text: `${config.vertical_position}%` },
    { key: 'font_size', label: 'Font size', min: 14, max: 54, step: 1, text: `${config.font_size} px` },
    { key: 'background_opacity', label: 'Background opacity', min: 0, max: 1, step: 0.05, text: `${Math.round(config.background_opacity * 100)}%` },
  ] as const;
  return (
    <PlayerPanel title="Subtitles" onClose={onClose}
      actions={<PlayerButton label="Reset subtitle appearance" onClick={onReset}><RotateCcw size={15} /></PlayerButton>}>
      <div className="panel-stack">
        <section className="panel-section">
          <h3 className="panel-label">Subtitle track</h3>
          <TrackList label="Subtitle tracks" tracks={tracks} selected={selected} onSelect={onSelect} />
          <button type="button" className="secondary-button" onClick={onLoad} disabled={!hasMedia}>
            <FolderOpen size={14} /> Load subtitle file…
          </button>
          {!hasMedia && <p className="help-text">Open a video to load a subtitle file.</p>}
        </section>

        {fields.map(({ key, label, min, max, step, text }) => (
          <label className="panel-section" key={key}>
            <span className="field-label"><span className="panel-label">{label}</span><span className="field-value">{text}</span></span>
            <input type="range" className="player-range" aria-label={label} min={min} max={max} step={step} value={config[key]}
              style={{ '--progress': `${(config[key] - min) / (max - min) * 100}%` } as CSSProperties}
              onChange={(event) => {
                const value = event.currentTarget.valueAsNumber;
                onChange({ ...config, [key]: value, scale: key === 'font_size' ? value / 24 : config.scale });
              }} />
          </label>
        ))}

        <section className="panel-section">
          <div className="field-label"><h3 className="panel-label">Subtitle delay</h3><span className="field-value">{delay} ms</span></div>
          <div className="step-buttons">
            {[-100, 0, 100].map((step) => (
              <button type="button" className="secondary-button" key={step}
                onClick={() => onChange({ ...config, delay_seconds: step ? (delay + step) / 1000 : 0 })}>
                {step === 0 ? 'Reset' : `${step > 0 ? '+' : '−'}${Math.abs(step)} ms`}
              </button>
            ))}
          </div>
        </section>
      </div>
    </PlayerPanel>
  );
}
