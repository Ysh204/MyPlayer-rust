import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Settings2, Square, X } from 'lucide-react';
import { isDesktop } from '../../core/tauriClient';
import { PlayerButton } from './PlayerButton';
import { PlayerLogo } from './PlayerLogo';

interface Props {
  title: string;
  onOpenSettings: () => void;
}

export function TopWindowBar({ title, onOpenSettings }: Props) {
  const appWindow = isDesktop ? getCurrentWindow() : null;

  return (
    <header className="window-bar" data-tauri-drag-region>
      <div data-tauri-drag-region className="window-title" title={title}>
        {title && <><PlayerLogo /><span data-tauri-drag-region>{title}</span></>}
      </div>
      <div className="window-actions">
        <PlayerButton label="Playback settings" onClick={onOpenSettings}><Settings2 size={14} /></PlayerButton>
        {appWindow && (
          <div className="window-buttons">
            <PlayerButton label="Minimize window" onClick={() => void appWindow.minimize()}><Minus size={14} /></PlayerButton>
            <PlayerButton label="Maximize or restore window" onClick={() => void appWindow.toggleMaximize()}><Square size={11} /></PlayerButton>
            <PlayerButton className="close-window" label="Close window" onClick={() => void appWindow.close()}><X size={14} /></PlayerButton>
          </div>
        )}
      </div>
    </header>
  );
}
