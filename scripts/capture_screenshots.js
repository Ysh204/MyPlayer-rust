import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const PORT = 8085;
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple MIME map
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// Start static HTTP server for dist/
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });

    const screenshots = [
      {
        name: '00_open_player.png',
        url: `http://localhost:${PORT}/`,
      },
      {
        name: '01_main_player.png',
        url: `http://localhost:${PORT}/?sample=true`,
      },
      {
        name: '02_context_menu.png',
        url: `http://localhost:${PORT}/?sample=true&menu=true`,
      },
      {
        name: '03_equalizer_panel.png',
        url: `http://localhost:${PORT}/?sample=true&drawer=audio`,
      },
      {
        name: '04_subtitle_panel.png',
        url: `http://localhost:${PORT}/?sample=true&drawer=subtitles`,
      },
      {
        name: '05_playlist_queue.png',
        url: `http://localhost:${PORT}/?sample=true&drawer=playlist`,
      },
      {
        name: '06_playback_settings.png',
        url: `http://localhost:${PORT}/?sample=true&settings=true`,
      },
      {
        name: '07_bookmarks.png',
        url: `http://localhost:${PORT}/?sample=true&drawer=marks`,
        async prepare() {
          await page.keyboard.press('b');
          await page.click('[aria-label="Set loop start at current position"]');
          await page.click('[aria-label="Forward 5 seconds"]');
          await page.click('[aria-label="Set loop end at current position"]');
          await page.mouse.move(15, 90);
          await page.waitForSelector('.status-message', { hidden: true });
        },
      },
    ];

    for (const item of screenshots) {
      console.log(`Navigating to ${item.name}...`);
      await page.goto(item.url, { waitUntil: 'networkidle0' });
      await item.prepare?.();
      await new Promise((r) => setTimeout(r, 600)); // wait for transitions
      const outPath = path.join(OUTPUT_DIR, item.name);
      await page.screenshot({ path: outPath, type: 'png' });
      console.log(`Saved: ${outPath}`);
    }

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Failed to capture screenshots:', err);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    server.close();
  }
});

