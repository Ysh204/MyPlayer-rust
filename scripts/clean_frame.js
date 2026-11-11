import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
  });
  const page = await browser.newPage();
  const imgData = fs.readFileSync('public/sample_frame.jpg').toString('base64');

  await page.setContent(`
    <html><body style="margin:0;overflow:hidden;">
      <canvas id="c"></canvas>
      <script>
        const img = new Image();
        img.onload = () => {
          const c = document.getElementById('c');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // The snipping tool popup is roughly at bottom-right
          const sx = Math.floor(img.width * 0.79);
          const sy = Math.floor(img.height * 0.58);
          const sw = img.width - sx;
          const sh = Math.floor(img.height * 0.14);

          // Copy texture from upper wall down over the toast
          for (let y = Math.floor(img.height * 0.67); y < img.height; y += sh) {
            ctx.drawImage(c, sx, sy, sw, sh, sx, y, sw, sh);
          }
          window.done = true;
        };
        img.src = "data:image/jpeg;base64,${imgData}";
      </script>
    </body></html>
  `);

  await page.waitForFunction('window.done === true');
  const canvasData = await page.evaluate(() => {
    return document.getElementById('c').toDataURL('image/jpeg', 0.95);
  });

  const base64Data = canvasData.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFileSync('public/sample_frame.jpg', Buffer.from(base64Data, 'base64'));
  fs.writeFileSync('dist/sample_frame.jpg', Buffer.from(base64Data, 'base64'));
  console.log('Cleaned sample_frame.jpg successfully!');
  await browser.close();
})();

