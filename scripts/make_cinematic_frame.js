import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;overflow:hidden;background:#000;">
        <canvas id="c" width="1920" height="1080"></canvas>
        <script>
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');

          // 1. Deep Obsidian / Twilight sky gradient
          const bg = ctx.createLinearGradient(0, 0, 1920, 1080);
          bg.addColorStop(0, '#10131a');
          bg.addColorStop(0.4, '#1b1a1f');
          bg.addColorStop(0.75, '#3d2516');
          bg.addColorStop(1, '#0e0b09');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, 1920, 1080);

          // 2. Volumetric cinematic amber sun shaft
          const sun = ctx.createRadialGradient(1400, 240, 10, 1400, 350, 900);
          sun.addColorStop(0, 'rgba(255, 175, 75, 0.85)');
          sun.addColorStop(0.2, 'rgba(245, 135, 45, 0.45)');
          sun.addColorStop(0.5, 'rgba(180, 80, 25, 0.2)');
          sun.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = sun;
          ctx.fillRect(0, 0, 1920, 1080);

          // 3. Monolithic architectural wall silhouettes
          ctx.fillStyle = '#08090c';
          ctx.beginPath();
          ctx.moveTo(0, 720);
          ctx.lineTo(820, 720);
          ctx.lineTo(820, 1080);
          ctx.lineTo(0, 1080);
          ctx.fill();

          // Monolith highlight rim
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 720);
          ctx.lineTo(820, 720);
          ctx.stroke();

          // Right towering brutalist column
          const colGrad = ctx.createLinearGradient(960, 0, 1500, 1080);
          colGrad.addColorStop(0, '#161314');
          colGrad.addColorStop(0.4, '#09080a');
          colGrad.addColorStop(1, '#050406');
          ctx.fillStyle = colGrad;
          ctx.beginPath();
          ctx.moveTo(960, 0);
          ctx.lineTo(1350, 0);
          ctx.lineTo(1240, 1080);
          ctx.lineTo(880, 1080);
          ctx.closePath();
          ctx.fill();

          // Backlit solitary figure silhouette
          ctx.fillStyle = '#050506';
          // Head
          ctx.beginPath();
          ctx.arc(740, 646, 7.5, 0, Math.PI * 2);
          ctx.fill();
          // Torso & legs
          ctx.beginPath();
          ctx.moveTo(736, 654);
          ctx.lineTo(744, 654);
          ctx.lineTo(745, 686);
          ctx.lineTo(747, 720);
          ctx.lineTo(742, 720);
          ctx.lineTo(740, 688);
          ctx.lineTo(737, 720);
          ctx.lineTo(732, 720);
          ctx.lineTo(734, 686);
          ctx.closePath();
          ctx.fill();

          // 4. Subtle anamorphic cinema lens flare
          const flare = ctx.createLinearGradient(0, 420, 1920, 420);
          flare.addColorStop(0, 'rgba(0,0,0,0)');
          flare.addColorStop(0.45, 'rgba(245, 158, 11, 0.08)');
          flare.addColorStop(0.5, 'rgba(255, 230, 180, 0.25)');
          flare.addColorStop(0.55, 'rgba(245, 158, 11, 0.08)');
          flare.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = flare;
          ctx.fillRect(0, 418, 1920, 4);

          window.done = true;
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction('window.done === true');
  const canvasData = await page.evaluate(() => {
    return document.getElementById('c').toDataURL('image/jpeg', 0.96);
  });

  const base64Data = canvasData.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFileSync('public/sample_frame.jpg', Buffer.from(base64Data, 'base64'));
  fs.writeFileSync('dist/sample_frame.jpg', Buffer.from(base64Data, 'base64'));
  console.log('Generated flawless 1080p cinematic frame!');
  await browser.close();
})();

