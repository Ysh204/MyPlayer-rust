import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { readStorage, writeStorage } from '../../core/playbackStorage';
import type { PlaylistItem } from '../../core/types';

interface FileMarks {
  key: string;
  bookmarks: number[];
  start: number | null;
  end: number | null;
}

function loadFileMarks(key: string): FileMarks {
  const saved = key ? readStorage<unknown>(key, []) : [];
  const bookmarks = Array.isArray(saved)
    ? [...new Set<number>(saved.filter((time) => typeof time === 'number' && Number.isFinite(time) && time >= 0))].sort((a, b) => a - b)
    : [];
  return { key, bookmarks, start: null, end: null };
}

interface Options {
  media: PlaylistItem | null;
  videoRef: RefObject<HTMLVideoElement>;
  getPosition: () => number;
  duration: number;
  onStatus: (message: string) => void;
  onSeek: (seconds: number) => void;
}

export function usePlaybackMarks({ media, videoRef, getPosition, duration, onStatus, onSeek }: Options) {
  const id = media?.path ? media.path.replace(/\//g, '\\').toLowerCase() : media?.id;
  const key = id ? 'myplayer.bookmarks.' + id : '';
  const [marks, setMarks] = useState(() => loadFileMarks(key));
  if (marks.key !== key) setMarks(loadFileMarks(key));

  const seek = useRef(onSeek);
  seek.current = onSeek;
  const { start, end } = marks;
  const available = Boolean(key && Number.isFinite(duration) && duration > 0);
  const position = () => Math.max(0, Math.min(duration, getPosition()));

  function saveBookmarks(bookmarks: number[]) {
    writeStorage(key, bookmarks);
    setMarks({ ...marks, bookmarks });
  }

  function addBookmark() {
    if (!available) return;
    const time = position();
    if (marks.bookmarks.some((saved) => Math.floor(saved * 10) === Math.floor(time * 10))) {
      onStatus('Already bookmarked');
      return;
    }
    saveBookmarks([...marks.bookmarks, time].sort((a, b) => a - b));
    onStatus('Bookmark added');
  }

  function setStart() {
    if (!available) return;
    const time = position();
    if (time >= duration) {
      onStatus('Choose a start before the end of the file');
      return;
    }
    setMarks({ ...marks, start: time, end: null });
  }

  function setEnd() {
    if (!available || start === null) return;
    const time = position();
    if (time <= start) {
      onStatus('Choose an end after the loop start');
      return;
    }
    setMarks({ ...marks, end: time });
  }

  function clearLoop() {
    setMarks({ ...marks, start: null, end: null });
  }

  function jumpTo(time: number) {
    if (!available) return;
    if (start !== null && end !== null && (time < start || time >= end)) clearLoop();
    onSeek(Math.min(duration, time));
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!available || !video || start === null || end === null || marks.key !== key) return;

    let timer: number;
    const stop = () => window.clearTimeout(timer);
    const checkBoundary = () => {
      stop();
      if (video.paused || video.seeking || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
      if (video.currentTime >= end || video.currentTime < start - 0.001) {
        seek.current(start);
      } else {
        // Recalculate from the media clock after buffering, seeking, or changing speed.
        timer = window.setTimeout(checkBoundary, Math.max(8, (end - video.currentTime) * 1000 / video.playbackRate));
      }
    };
    const resumeEvents = ['playing', 'seeked', 'ratechange', 'timeupdate'];
    const stopEvents = ['pause', 'waiting', 'seeking', 'emptied'];
    resumeEvents.forEach((event) => video.addEventListener(event, checkBoundary));
    stopEvents.forEach((event) => video.addEventListener(event, stop));
    checkBoundary();
    return () => {
      stop();
      resumeEvents.forEach((event) => video.removeEventListener(event, checkBoundary));
      stopEvents.forEach((event) => video.removeEventListener(event, stop));
    };
  }, [available, start, end, key, marks.key, videoRef]);

  function repeatAtEnd() {
    const video = videoRef.current;
    if (!available || !video || start === null || end === null) return false;
    onSeek(start);
    void video.play().catch(() => onStatus('Press Play to resume the loop'));
    return true;
  }

  return {
    available, bookmarks: marks.bookmarks, start, end, addBookmark, clearLoop, jumpTo, setStart, setEnd, repeatAtEnd,
    removeBookmark: (time: number) => saveBookmarks(marks.bookmarks.filter((mark) => mark !== time)),
  };
}
