import type { TrackInfo } from './types';

const languages = new Intl.DisplayNames(['en'], { type: 'language' });

function languageName(value?: string) {
  const code = value?.trim().replace(/_/g, '-');
  if (!code || code.toLowerCase() === 'und') return '';
  try {
    return languages.of(code) || code;
  } catch {
    return code;
  }
}

export function labelTracks(tracks: TrackInfo[], firstNumber = 1): TrackInfo[] {
  const counts = new Map<string, number>();
  const labels = tracks.map((track, index) => {
    const name = track.title?.trim();
    const language = languageName(track.language);
    const label = name && language && name.toLowerCase() !== language.toLowerCase() && name !== track.language
      ? `${name} – [${language}]` : language || name || `Track ${index + firstNumber}`;
    counts.set(label, (counts.get(label) ?? 0) + 1);
    return label;
  });
  return tracks.map((track, index) => {
    const label = labels[index];
    const number = track.id.match(/^(?:sub|audio)-(\d+)$/)?.[1] ?? (index + firstNumber);
    const title = track.id !== 'off' && counts.get(label)! > 1 ? `${label} (Track ${number})` : label;
    return { ...track, title };
  });
}
