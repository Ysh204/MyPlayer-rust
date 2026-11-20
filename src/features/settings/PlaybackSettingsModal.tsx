import { useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { PlayerButton } from '../player/PlayerButton';

export interface PlaybackSettings {
  autoResume: boolean;
  seekStep: number;
  volumeStep: number;
  precisionSeeking: boolean;
}

interface Props {
  settings: PlaybackSettings;
  hardwareDecoding: boolean | null;
  onHardwareDecoding: (enabled: boolean) => void;
  onChange: (settings: PlaybackSettings) => void;
  onClose: () => void;
}

export function PlaybackSettingsModal({ settings, hardwareDecoding, onHardwareDecoding, onChange, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog className="settings-dialog" ref={dialog} aria-labelledby="settings-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
        }
      }}>
      <div className="settings-heading">
        <h2 id="settings-title">Playback settings</h2>
        <PlayerButton label="Close settings" onClick={onClose}><X size={17} /></PlayerButton>
      </div>
      <div className="settings-fields">
        {hardwareDecoding !== null && <label className="settings-field toggle-field">
          <span><span className="panel-label">Hardware decoding</span><small className="help-text">Allow GPU decoding after restarting the player.</small></span>
          <input type="checkbox" checked={hardwareDecoding} onChange={(event) => onHardwareDecoding(event.currentTarget.checked)} />
        </label>}
        <label className="settings-field toggle-field">
          <span><span className="panel-label">Resume playback</span><small className="help-text">Remember where you left off in local files.</small></span>
          <input type="checkbox" checked={settings.autoResume} onChange={(event) => onChange({ ...settings, autoResume: event.currentTarget.checked })} />
        </label>
        <label className="settings-field toggle-field">
          <span><span className="panel-label">Precise seeking</span><small className="help-text">Use exact timestamps when scrubbing.</small></span>
          <input type="checkbox" checked={settings.precisionSeeking} onChange={(event) => onChange({ ...settings, precisionSeeking: event.currentTarget.checked })} />
        </label>
        <label className="settings-field">
          <span><span className="panel-label">Seek step</span><small className="help-text">Skip with the left and right arrow keys.</small></span>
          <select className="field-select" aria-label="Seek step" value={settings.seekStep}
            onChange={(event) => onChange({ ...settings, seekStep: Number(event.currentTarget.value) })}>
            {[2, 3, 5, 10, 15, 30].map((step) => <option key={step} value={step}>{step} s</option>)}
          </select>
        </label>
        <label className="settings-field">
          <span><span className="panel-label">Volume step</span><small className="help-text">Adjust with the up and down arrow keys.</small></span>
          <select className="field-select" aria-label="Volume step" value={settings.volumeStep}
            onChange={(event) => onChange({ ...settings, volumeStep: Number(event.currentTarget.value) })}>
            {[1, 2, 5, 10].map((step) => <option key={step} value={step}>{step}%</option>)}
          </select>
        </label>
      </div>
      <div className="settings-footer"><button className="primary-button" type="button" onClick={onClose}>Done</button></div>
    </dialog>
  );
}
