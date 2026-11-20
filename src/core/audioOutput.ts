import type { EqState } from './types';

export function createAudioOutput(context: AudioContext, video: HTMLVideoElement) {
  const preamp = context.createGain();
  const volumeNode = context.createGain();
  const delay = context.createDelay(5);
  const wet = context.createGain();
  const dry = context.createGain();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.18;

  const filters = Array.from({ length: 5 }, () => {
    const filter = context.createBiquadFilter();
    filter.type = 'peaking';
    filter.Q.value = 1.4;
    return filter;
  });
  const source = context.createMediaElementSource(video);
  const chain = [source, preamp, ...filters, delay];
  chain.slice(1).forEach((node, index) => chain[index].connect(node));
  delay.connect(compressor).connect(wet).connect(volumeNode);
  delay.connect(dry).connect(volumeNode);
  volumeNode.connect(context.destination);

  return {
    update(eq: EqState, volume: number) {
      video.volume = 1;
      const now = context.currentTime;
      filters.forEach((filter, index) => {
        filter.frequency.setTargetAtTime(eq.frequencies[index], now, 0.015);
        filter.gain.setTargetAtTime(eq.gains[index], now, 0.015);
      });
      preamp.gain.setTargetAtTime(10 ** (eq.preamp_db / 20), now, 0.015);
      volumeNode.gain.setTargetAtTime(volume / 100, now, 0.015);
      delay.delayTime.setTargetAtTime(eq.audio_delay_sec, now, 0.015);
      wet.gain.setTargetAtTime(eq.compressor ? 1 : 0, now, 0.015);
      dry.gain.setTargetAtTime(eq.compressor ? 0 : 1, now, 0.015);
    },
  };
}
