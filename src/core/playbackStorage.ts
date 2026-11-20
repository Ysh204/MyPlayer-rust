const settingsKey = 'myplayer.settings';
const positionsKey = 'myplayer.positions';

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing and storage quotas can prevent persistence.
  }
}

export { settingsKey };

export const savedPositions = {
  get(id: string) {
    return readStorage<Record<string, number>>(positionsKey, {})[id];
  },
  save(id: string, currentTime: number, duration: number) {
    if (!Number.isFinite(duration) || duration <= 0) return;
    const positions = new Map(Object.entries(readStorage<Record<string, number>>(positionsKey, {})));
    positions.delete(id);
    if (currentTime > 0 && currentTime < duration - 0.5) positions.set(id, currentTime);
    writeStorage(positionsKey, Object.fromEntries(Array.from(positions).slice(-100)));
  },
};
