import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type SeekRequest = { time: number; exact: boolean };

function dispatch(video: HTMLVideoElement, request: SeekRequest) {
  if (!request.exact && typeof video.fastSeek === 'function') video.fastSeek(request.time);
  else video.currentTime = request.time;
}

export function usePlaybackClock(
  videoRef: RefObject<HTMLVideoElement>,
  duration: number,
  playing: boolean,
  sample: boolean,
  precisionSeeking: boolean,
  initialTime: number,
) {
  const [currentTime, setCurrentTime] = useState(initialTime);
  const displayed = useRef(initialTime);
  const requested = useRef<number | null>(null);
  const queued = useRef<SeekRequest | null>(null);
  const scheduled = useRef(false);

  const display = useCallback((time: number) => {
    if (displayed.current === time) return;
    displayed.current = time;
    setCurrentTime(time);
  }, []);

  const resetClock = useCallback((time: number) => {
    requested.current = null;
    queued.current = null;
    display(time);
  }, [display]);

  const readClock = useCallback(() => {
    const video = videoRef.current;
    if (video && requested.current === null) display(video.currentTime);
  }, [display, videoRef]);

  const flush = useCallback((final: boolean) => {
    const video = videoRef.current;
    const next = queued.current;
    if (!video || !next || (video.seeking && !final)) return;
    queued.current = null;
    if (Math.abs(next.time - video.currentTime) > 0.001) dispatch(video, next);
    else if (!video.seeking) resetClock(video.currentTime);
  }, [resetClock, videoRef]);

  const finishSeek = useCallback(() => flush(true), [flush]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const settled = () => {
      if (video.seeking) return;
      flush(false);
      if (!video.seeking) resetClock(video.currentTime);
    };
    const keyReleased = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyJ', 'KeyL'].includes(event.code)) finishSeek();
    };
    video.addEventListener('seeked', settled);
    window.addEventListener('keyup', keyReleased);
    return () => {
      video.removeEventListener('seeked', settled);
      window.removeEventListener('keyup', keyReleased);
    };
  }, [finishSeek, flush, resetClock, videoRef]);

  useEffect(() => {
    if (!playing || sample) return;
    // Caption timing needs finer updates than timeupdate; the UI doesn't need
    // to render at the monitor's refresh rate to track a media clock.
    const timer = window.setInterval(() => { if (!document.hidden) readClock(); }, 40);
    return () => window.clearInterval(timer);
  }, [playing, sample, readClock]);

  function requestSeek(time: number, exact: boolean) {
    if (!duration || !Number.isFinite(time)) return;
    const target = Math.max(0, Math.min(time, duration));
    if (sample) {
      display(target);
      return;
    }
    const video = videoRef.current;
    if (!video?.readyState) return;
    const destination = !exact && typeof video.fastSeek !== 'function' ? Math.min(Math.round(target), duration) : target;
    display(destination);
    requested.current = destination;
    queued.current = { time: destination, exact };
    // Input bursts share one decoder request. While a frame is decoding we
    // keep only the newest preview; releasing the control commits it at once.
    if (!scheduled.current) {
      scheduled.current = true;
      queueMicrotask(() => {
        scheduled.current = false;
        flush(false);
      });
    }
  }

  const getPosition = useCallback(() => {
    const video = videoRef.current;
    return requested.current ?? (!sample && video?.readyState ? video.currentTime : displayed.current);
  }, [sample, videoRef]);

  return {
    currentTime, readClock, resetClock, getPosition, finishSeek,
    seekBy: (delta: number) => requestSeek(getPosition() + delta, precisionSeeking),
    seek: (time: number) => requestSeek(time, precisionSeeking),
    seekExact: (time: number) => requestSeek(time, true),
  };
}
