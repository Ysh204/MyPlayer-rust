import { Bookmark, Plus, X } from 'lucide-react';
import { formatTime } from '../player/BottomControlsBar';
import { PlayerButton } from '../player/PlayerButton';
import { PlayerPanel } from '../player/PlayerPanel';
import type { usePlaybackMarks } from './usePlaybackMarks';
import './playbackMarks.css';

function timestamp(seconds: number) {
  return formatTime(seconds) + '.' + Math.floor(seconds * 10) % 10;
}

export function PlaybackMarksPanel({ marks, onClose }: { marks: ReturnType<typeof usePlaybackMarks>; onClose: () => void }) {
  const { bookmarks, start, end, available } = marks;
  return (
    <PlayerPanel title="Bookmarks & loop" onClose={onClose}>
      <div className="panel-stack marks-stack">
        <section className="panel-section" aria-labelledby="bookmarks-heading">
          <div className="field-label">
            <h3 className="panel-label" id="bookmarks-heading">Bookmarks</h3>
            <button type="button" className="mark-action" title="Add bookmark (B)" aria-label="Add bookmark"
              aria-keyshortcuts="B" disabled={!available} onClick={marks.addBookmark}><Plus size={14} /> Add</button>
          </div>
          {bookmarks.length ? (
            <ul className="marks-list">
              {bookmarks.map((time) => (
                <li key={time}>
                  <button type="button" className="mark-jump" disabled={!available} aria-label={'Go to ' + timestamp(time)}
                    onClick={() => marks.jumpTo(time)}><Bookmark size={13} />{timestamp(time)}</button>
                  <PlayerButton label={'Remove bookmark at ' + timestamp(time)} onClick={() => marks.removeBookmark(time)}><X size={13} /></PlayerButton>
                </li>
              ))}
            </ul>
          ) : <p className="help-text">Press <kbd>B</kbd> to save the current position.</p>}
        </section>
        <section className="panel-section loop-section" aria-labelledby="loop-heading">
          <div className="field-label">
            <h3 className="panel-label" id="loop-heading">A–B loop</h3>
            {start !== null && <button type="button" className="mark-action" aria-label="Clear section loop" onClick={marks.clearLoop}>Clear</button>}
          </div>
          <div className="loop-points">
            <button type="button" aria-label="Set loop start at current position" disabled={!available} onClick={marks.setStart}>
              <span>Set start</span><strong>{start === null ? 'A' : timestamp(start)}</strong>
            </button>
            <button type="button" aria-label="Set loop end at current position" disabled={!available || start === null} onClick={marks.setEnd}>
              <span>Set end</span><strong>{end === null ? 'B' : timestamp(end)}</strong>
            </button>
          </div>
          <p className="help-text" role="status">{end !== null ? 'Repeating this section.' : start !== null ? 'Choose the end while playing or seeking.' : 'Set two points to repeat a section.'}</p>
        </section>
      </div>
    </PlayerPanel>
  );
}
