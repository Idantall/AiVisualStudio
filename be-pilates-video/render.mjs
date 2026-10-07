// Usage: node render.mjs [fps] [--stills t1,t2,...]
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const fps = Number(process.argv[2]) || 30;
const stillsArg = process.argv.indexOf('--stills');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + dir + '/index.html?render=1');
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every(i => i.complete));
if (stillsArg > 0) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    await page.evaluate(t => renderAt(t), t);
    await page.screenshot({ path: `${dir}/stills/t${t}.jpg`, type: 'jpeg', quality: 80 });
  }
} else {
  const total = Math.round(25 * fps);
  const ff = spawn('ffmpeg', ['-y','-f','image2pipe','-framerate',String(fps),'-i','-',
    '-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',
    `${dir}/out/be-pilates-silent.mp4`], { stdio: ['pipe','inherit','inherit'] });
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => renderAt(t), f / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 75 === 0) console.log('frame', f, '/', total);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
