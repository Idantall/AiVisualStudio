import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const dir = process.argv[2], out = process.argv[3];
const times = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + dir + '/index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
console.log(await p.evaluate(() => [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+f.weight).join(',')));
const FPS = 30, N = 15 * FPS;
const list = times ? times.map(t => Math.round(t * FPS)) : [...Array(N).keys()];
for (const f of list) {
  await p.evaluate(t => window.seek(t), f / FPS);
  await p.screenshot({ path: `${out}/f${String(f).padStart(4, '0')}.png` });
}
await b.close();
