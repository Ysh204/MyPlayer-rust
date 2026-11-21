import { useState } from 'react';
import { ArrowUpRight, FilePlay, FolderOpen } from 'lucide-react';
import { readStorage, writeStorage } from '../../core/playbackStorage';
import { PlayerLogo } from './PlayerLogo';

const recentKey = 'myplayer.recentFiles';
const limit = 3;

function readRecent(): string[] {
  const paths = readStorage<unknown>(recentKey, []);
  return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === 'string' && path.length > 0).slice(0, limit) : [];
}

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState(readRecent);
  function update(paths: string[]) {
    writeStorage(recentKey, paths);
    setRecentFiles(paths);
  }
  function rememberFile(path: string) {
    const paths = readRecent();
    if (paths[0] === path) return;
    update([path, ...paths.filter((previous) => previous.toLowerCase() !== path.toLowerCase())].slice(0, limit));
  }
  return { recentFiles, rememberFile, clearRecent: () => update([]) };
}

export function PlayerHome({ recentFiles, onOpen, onSelect, onClear }: {
  recentFiles: string[];
  onOpen: () => void;
  onSelect: (path: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="player-home">
      <div className="home-hero">
        <div className="home-intro">
          <h1><PlayerLogo className="home-logo" />MyPlayer <i>Pro</i></h1>
          <p>Drop a video or audio file here to play.</p>
          <button type="button" className="open-file" onClick={onOpen}>
            <FolderOpen size={16} aria-hidden="true" />Open file <kbd>Ctrl O</kbd>
          </button>
        </div>
      </div>
      {recentFiles.length > 0 && <section className="recent-files" aria-labelledby="recent-title">
        <div className="recent-heading"><h2 id="recent-title">Recently played</h2>
          <button type="button" onClick={onClear} aria-label="Clear recently played files">Clear</button>
        </div>
        <ul>{recentFiles.map((path) => {
          const name = path.split(/[\\/]/).pop() || path;
          return <li key={path}><button type="button" onClick={() => onSelect(path)} title={path}>
            <FilePlay size={16} aria-hidden="true" /><span>{name}</span><ArrowUpRight size={14} aria-hidden="true" />
          </button></li>;
        })}</ul>
      </section>}
    </div>
  );
}
