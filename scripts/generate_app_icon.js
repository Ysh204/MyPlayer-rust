import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512 });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;overflow:hidden;background:transparent;">
        <canvas id="c" width="512" height="512"></canvas>
        <script>
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');

          // Rounded obsidian box
          const r = 90;
          ctx.beginPath();
          ctx.roundRect(16, 16, 480, 480, r);
          
          const bg = ctx.createLinearGradient(0, 0, 512, 512);
          bg.addColorStop(0, '#151722');
          bg.addColorStop(0.5, '#0B0C11');
          bg.addColorStop(1, '#050608');
          ctx.fillStyle = bg;
          ctx.fill();

          // Hairline amber/gold border
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Ambient radial glow behind play icon
          const glow = ctx.createRadialGradient(270, 256, 10, 270, 256, 220);
          glow.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
          glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(16, 16, 480, 480);

          // Sleek Amber Play Triangle
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(200, 155);
          ctx.lineTo(370, 256);
          ctx.lineTo(200, 357);
          ctx.closePath();
          ctx.fill();

          // Crisp light highlight edge
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 3;
          ctx.stroke();

          window.done = true;
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction('window.done === true');
  const canvasData = await page.evaluate(() => {
    return document.getElementById('c').toDataURL('image/png');
  });

  const base64Data = canvasData.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('app-icon.png', Buffer.from(base64Data, 'base64'));
  console.log('Generated 512x512 app-icon.png!');
  await browser.close();
})();

