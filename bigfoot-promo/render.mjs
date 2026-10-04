// Usage:
//   node render.mjs                 -> out/frames.mp4 (silent video, 30fps)
//   node render.mjs --stills 1,4.5  -> out/still-<t>.png for review
import { createRequire } from 'module';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.error('[pageerror]', e));
await page.goto(`http://localhost:${port}/index.html?render`);
await page.evaluate(() => window.ready);

const grab = t => page.evaluate(t => {
  window.renderFrame(t);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
}, t);

const si = process.argv.indexOf('--stills');
if (si > -1) {
  for (const t of process.argv[si + 1].split(',').map(Number)) {
    fs.writeFileSync(path.join(dir, 'out', `still-${t}.png`), Buffer.from(await grab(t), 'base64'));
  }
} else {
  const dur = await page.evaluate(() => window.DUR);
  const n = Math.round(dur * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', path.join(dir, 'out', 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from(await grab(i / FPS), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
server.close();
