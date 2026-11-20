import type { SubtitleCue } from './types';

function seconds(time: string) {
  const parts = time.replace(',', '.').split(':');
  if (parts.length < 2 || !parts.every((part) => /^\d+(?:\.\d+)?$/.test(part))) return NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

export function plainSubtitle(text: string) {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/\{\\[^}]*\}/g, '').replace(/\\[Nn]/g, '\n').replace(/\\h/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_match, name: string) => entities[name])
    .trim();
}

export function parseSubtitles(source: string): SubtitleCue[] {
  const raw = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const cues: SubtitleCue[] = [];
  const add = (start: number, end: number, payload: string) => {
    const text = plainSubtitle(payload);
    if (text && Number.isFinite(start) && Number.isFinite(end) && end > start) cues.push({ start, end, text });
  };

  if (/^\[Events\]/im.test(raw)) {
    for (const line of raw.slice(raw.search(/^\[Events\]/im)).split('\n')) {
      const match = /^Dialogue:\s*((?:[^,]*,){9})(.*)$/i.exec(line);
      if (!match) continue;
      const [, start, end] = match[1].split(',');
      add(seconds(start.trim()), seconds(end.trim()), match[2]);
    }
  } else if (/^\{\d+\}\{\d*\}/m.test(raw)) {
    let fps = 25;
    for (const line of raw.split('\n')) {
      const match = /^\{(\d+)\}\{(\d*)\}(.*)$/.exec(line);
      if (!match) continue;
      const [, start, end, payload] = match;
      const rate = Number(payload);
      if (start === end && Number(start) <= 1 && rate > 0) {
        fps = rate;
      } else {
        add(Number(start) / fps, end ? Number(end) / fps : Number(start) / fps + 3, payload.replace(/\|/g, '\n'));
      }
    }
  } else {
    for (const block of raw.trim().split(/\n[ \t]*\n/)) {
      const lines = block.split('\n');
      if (/^(NOTE|STYLE|REGION)(\s|$)/.test(lines[0])) continue;
      const index = lines.findIndex((line) => line.includes('-->'));
      if (index < 0) continue;
      const match = /^\s*(\S+)\s*-->\s*(\S+)/.exec(lines[index]);
      if (match) add(seconds(match[1]), seconds(match[2]), lines.slice(index + 1).join('\n'));
    }
  }

  return cues.sort((first, second) => first.start - second.start);
}
