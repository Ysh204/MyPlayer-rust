import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import tauri from '@tauri-apps/cli';

const root = new URL('../', import.meta.url);
const path = (relative) => fileURLToPath(new URL(relative, root));

await tauri.run([
  'icon', path('public/myplayer-pro.svg'),
  '--output', path('src-tauri/icons'), '--ios-color', '#25231F',
]);
await copyFile(path('src-tauri/icons/icon.png'), path('app-icon.png'));
