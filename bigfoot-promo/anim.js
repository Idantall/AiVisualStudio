// Bigfoot Academy — BJJ & MMA adult team promo (1080x1920, 2D motion graphics)
// Deterministic: renderFrame(t) draws the frame at time t (seconds).
const W = 1080, H = 1920, DUR = 20;
// Brand palette: black & white only (accents are white, outline type, or grey)
const GOLD = '#FFFFFF', GOLD2 = '#FFFFFF', GOLD3 = '#5A5A5A', BG = '#060606', PAPER = '#F2F1ED';
const PHONE = '052-308-3330';

const main = document.getElementById('c');
const mainCtx = main.getContext('2d');
let ctx = mainCtx;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  lin: t => t,
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inQuart: t => t * t * t * t,
  inOutQuart: t => t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
const prog = (t, a, b, e = E.lin) => e(clamp((t - a) / (b - a)));
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- assets ----------
const A = {};
const tintCache = {};
async function prep() {
  await Promise.all(['400 40px Heebo', '800 40px Heebo', '900 40px Heebo', '40px Bebas']
    .map(f => document.fonts.load(f, 'אבג ABC 0123')));
  const img = await new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'assets/logo.jpg';
  });
  // Upscale 4x, soften JPEG noise, then threshold luminance into a crisp white-on-alpha mask.
  const S = 4, N = 500 * S;
  const c = mk(N, N), g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.filter = 'blur(4px)';
  g.drawImage(img, 0, 0, N, N);
  g.filter = 'none';
  const d = g.getImageData(0, 0, N, N), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const l = (p[i] + p[i + 1] + p[i + 2]) / 765;
    p[i] = p[i + 1] = p[i + 2] = 255;
    p[i + 3] = clamp((0.62 - l) * 6 + 0.5) * 255;
  }
  g.putImageData(d, 0, 0);
  const box = (y0, y1) => {
    let x0 = N, x1 = 0, a0 = N, a1 = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
      if (p[(y * N + x) * 4 + 3] > 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < a0) a0 = y; if (y > a1) a1 = y; }
    }
    return [x0, a0, x1, a1];
  };
  const crop = ([x0, y0, x1, y1], pad = 12) => {
    const w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2, o = mk(w, h);
    o.getContext('2d').drawImage(c, x0 - pad, y0 - pad, w, h, 0, 0, w, h);
    return o;
  };
  A.foot = crop(box(40 * S, 285 * S));
  A.text = crop(box(285 * S, 400 * S));
  // grain tile
  const gr = mk(256, 256), gg = gr.getContext('2d'), gd = gg.createImageData(256, 256), R = rng(7);
  for (let i = 0; i < gd.data.length; i += 4) { const v = R() * 255; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v; gd.data[i + 3] = 255; }
  gg.putImageData(gd, 0, 0);
  A.grain = gr;
  A.bufA = mk(W, H); A.bufB = mk(W, H);
}
function tint(src, color) {
  const key = (src === A.foot ? 'f' : 't') + color;
  if (tintCache[key]) return tintCache[key];
  const o = mk(src.width, src.height), g = o.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, o.width, o.height);
  return (tintCache[key] = o);
}

// ---------- drawing helpers ----------
// TikTok safe area: scene content is laid out on the full 1080x1920 grid, then scaled into the
// region TikTok's UI leaves clear (top tabs, right-hand buttons, bottom caption). FRAME is the
// un-scaled transform, used for anything that must cover the whole screen.
const SAFE = { x: 510, y: 800, s: .8 };
let FRAME = new DOMMatrix();
function safe(fn) {
  ctx.save(); FRAME = ctx.getTransform();
  ctx.translate(SAFE.x, SAFE.y); ctx.scale(SAFE.s, SAFE.s); ctx.translate(-W / 2, -1000);
  fn(); ctx.restore();
}
function full(color) { ctx.save(); ctx.setTransform(FRAME); ctx.fillStyle = color; ctx.fillRect(-120, -120, W + 240, H + 240); ctx.restore(); }
function bg(color) { full(color); }
function foot(x, y, h, o = {}) {
  const img = tint(A.foot, o.color || '#fff');
  const w = h * img.width / img.height;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(o.rot || 0); if (o.flip) ctx.scale(-1, 1);
  ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  if (o.glow) { ctx.shadowColor = o.glowColor || 'rgba(255,255,255,.6)'; ctx.shadowBlur = o.glow; }
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function T(str, x, y, o = {}) {
  ctx.save();
  const bebas = o.font === 'B';
  ctx.font = bebas ? `${o.size || 100}px Bebas` : `${o.w || 900} ${o.size || 100}px Heebo`;
  ctx.direction = bebas ? 'ltr' : 'rtl';
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = (o.ls || 0) + 'px';
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.scale != null && o.scale !== 1) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); ctx.translate(-x, -y); }
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 30; }
  if (o.hl) { // caption box: dark text on a solid block
    const s = o.size || 100, w = ctx.measureText(str).width, pad = s * .3;
    rrect(x - w / 2 - pad, y - s * .6, w + pad * 2, s * 1.2, s * .12); ctx.fillStyle = o.hl; ctx.fill();
  }
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 3; ctx.strokeText(str, x, y); }
  else { ctx.fillStyle = o.color || '#fff'; ctx.fillText(str, x, y); }
  ctx.restore();
}
function measure(str, o = {}) {
  ctx.save();
  const bebas = o.font === 'B';
  ctx.font = bebas ? `${o.size || 100}px Bebas` : `${o.w || 900} ${o.size || 100}px Heebo`;
  ctx.letterSpacing = (o.ls || 0) + 'px';
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}
// Masked slide-up reveal (p: 0→1 in, q: 0→1 out upward)
function reveal(str, x, y, o, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const s = o.size || 100;
  ctx.save();
  ctx.beginPath(); ctx.rect(-50, y - s * .8, W + 100, s * 1.6); ctx.clip();
  T(str, x, y + (1 - p) * s * 1.3 - q * s * 1.3, o);
  ctx.restore();
}
function ring(x, y, t0, t, maxR, color, w, dur = .75) {
  if (t < t0 || t > t0 + dur) return;
  const p = prog(t, t0, t0 + dur, E.outExpo);
  ctx.save();
  ctx.strokeStyle = color; ctx.globalAlpha *= 1 - prog(t, t0, t0 + dur);
  ctx.lineWidth = Math.max(.5, w * (1 - p));
  ctx.beginPath(); ctx.arc(x, y, p * maxR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function burst(x, y, t0, t, n, seed, color, spd = 900, dur = .9, size = 6) {
  if (t < t0 || t > t0 + dur) return;
  const R = rng(seed), dt = t - t0, life = 1 - dt / dur;
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, v = spd * (.35 + R() * .65), k = 4 + R() * 3;
    const d = v / k * (1 - Math.exp(-k * dt));
    const s = size * (.4 + R()) * life;
    ctx.globalAlpha = life * (.5 + R() * .5);
    ctx.fillRect(x + Math.cos(a) * d - s / 2, y + Math.sin(a) * d + dt * dt * 120 - s / 2, s, s);
  }
  ctx.restore();
}
function circle(x, y, r, color) { if (r <= 0) return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

const IMPACTS = [[.35, 7], [.85, 7], [1.35, 7], [1.85, 7], [2.35, 9], [4.15, 26], [4.65, 26], [12.1, 14],
  [20.3, 10], [20.7, 10], [21.1, 16], [27.1, 5], [27.35, 5], [27.6, 6], [27.85, 7], [28.2, 34]];
function shake(t) {
  let x = 0, y = 0;
  for (const [t0, a] of IMPACTS) {
    const d = t - t0; if (d < 0 || d > .6) continue;
    const k = a * Math.exp(-d * 9);
    x += k * Math.sin(d * 71 + t0 * 3); y += k * Math.cos(d * 59 + t0 * 5);
  }
  return { x, y };
}

// ---------- scenes ----------
// S1 0–3.8: footsteps — "every champion started with one step"
const STEPS = [.35, .85, 1.35, 1.85, 2.35];
function S1(t) {
  bg(BG);
  const glow = ctx.createRadialGradient(W / 2, 1150, 0, W / 2, 1150, 900);
  glow.addColorStop(0, 'rgba(255,255,255,.07)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(-W, -H, W * 3, H * 3);
  const camY = lerp(0, 970, prog(t, .3, 2.7, E.inOutCubic));
  ctx.save(); ctx.translate(0, camY);
  STEPS.forEach((ts, i) => {
    if (t < ts - .22) return;
    const x = W / 2 + (i % 2 ? 95 : -95), y = 1500 - i * 330, rot = i % 2 ? .14 : -.14;
    const pin = prog(t, ts - .22, ts, E.inCubic);
    let sc = lerp(1.9, 1, pin), al = pin;
    const nx = STEPS[i + 1];
    if (nx !== undefined) al *= lerp(1, .22, prog(t, nx, nx + .6, E.outCubic));
    if (i === 4) sc *= 1 + 5 * prog(t, 3.0, 3.8, E.inExpo);
    ring(x, y, ts, t, 360, '#fff', 12);
    burst(x, y + 60, ts, t, 22, 10 + i, 'rgba(255,255,255,.9)', 700, .8, 7);
    foot(x, y, 300 * sc, { rot, alpha: al, flip: i % 2 === 0, glow: i === 4 ? 40 : 0 });
  });
  ctx.restore();
  const out = prog(t, 2.95, 3.35, E.inCubic);
  reveal('כל אלוף', W / 2, 300, { size: 170 }, prog(t, .55, 1.05, E.outExpo), out);
  reveal('התחיל', W / 2, 480, { size: 170 }, prog(t, 1.15, 1.65, E.outExpo), out);
  reveal('בצעד הראשון.', W / 2, 650, { size: 116, hl: '#fff', color: '#000' }, prog(t, 1.75, 2.25, E.outExpo), out);
  // iris into white
  circle(W / 2 - 95, 1150, prog(t, 3.25, 3.8, E.inExpo) * 2300, PAPER);
}

// S2 3.8–8.2: BJJ & MMA / adult team / 17+
function S2(t) {
  bg(PAPER);
  foot(W / 2 + 220, 980, 1700, { color: '#000', alpha: .045, rot: .32 + t * .02 });
  // BJJ from left, MMA from right
  const pB = prog(t, 3.85, 4.15, E.outExpo), pM = prog(t, 4.35, 4.65, E.outExpo);
  const xb = lerp(-700, W / 2, pB), xm = lerp(W + 700, W / 2, pM);
  for (let k = 1; k <= 4 && pB < 1; k++) T('BJJ', xb - k * 70 * (1 - pB), 520, { font: 'B', size: 400, color: '#0a0a0a', alpha: .12 });
  for (let k = 1; k <= 4 && pM < 1; k++) T('MMA', xm + k * 70 * (1 - pM), 950, { font: 'B', size: 400, color: '#0a0a0a', alpha: .12 });
  if (t > 3.85) T('BJJ', xb, 520, { font: 'B', size: 400, color: '#0a0a0a' });
  if (t > 4.35) T('MMA', xm, 950, { font: 'B', size: 400, color: '#0a0a0a' });
  const pA = prog(t, 4.75, 5.1, E.outBack);
  if (pA > 0) {
    ctx.save(); ctx.translate(W / 2, 735); ctx.rotate((1 - pA) * -1.2); ctx.translate(-W / 2, -735);
    T('&', W / 2, 735, { font: 'B', size: 160, color: '#0a0a0a', scale: pA });
    ctx.restore();
  }
  // diagonal band
  const pBand = prog(t, 5.15, 5.6, E.outExpo);
  if (pBand > 0) {
    ctx.save(); ctx.translate(lerp(W * 1.4, 0, pBand), 0);
    ctx.translate(W / 2, 1270); ctx.rotate(-.085);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-W, -100, W * 2, 200);
    ctx.fillStyle = PAPER; ctx.fillRect(-W, -84, W * 2, 4); ctx.fillRect(-W, 80, W * 2, 4);
    T('קבוצת בוגרים', 0, 4, { size: 118 });
    ctx.restore();
  }
  // 17+
  const p17 = prog(t, 5.85, 6.25, E.outBack);
  if (p17 > 0) {
    const echo = prog(t, 5.95, 6.9, E.outCubic);
    T('17+', W / 2, 1585, { font: 'B', size: 380, stroke: '#0a0a0a', lw: 3, alpha: .25 * (1 - echo), scale: 1 + echo * .5 });
    T('17+', W / 2, 1585, { font: 'B', size: 380, color: '#0a0a0a', scale: p17, alpha: clamp(p17 * 2) });
  }
  reveal('לגילאי 17 ומעלה', W / 2, 1790, { size: 64, w: 800, color: '#1a1a1a' }, prog(t, 6.3, 6.7, E.outExpo));
  circle(W / 2, 1585, prog(t, 7.6, 8.2, E.inExpo) * 2400, BG);
}

// S3 8.2–13.8: belt journey white → black
const BELTS = [
  { c: '#EDEDE8', bar: '#111', he: 'לבנה', en: 'WHITE BELT', t: 8.5 },
  { c: '#1F5FD6', bar: '#111', he: 'כחולה', en: 'BLUE BELT', t: 9.4 },
  { c: '#6E30B8', bar: '#111', he: 'סגולה', en: 'PURPLE BELT', t: 10.3 },
  { c: '#7A4722', bar: '#111', he: 'חומה', en: 'BROWN BELT', t: 11.2 },
  { c: '#141414', bar: '#C8102E', he: 'שחורה', en: 'BLACK BELT', t: 12.1 },
];
function drawBelt(x0, y0, bw, bh, b, stripes) {
  ctx.save();
  rrect(x0, y0, bw, bh, 16); ctx.fillStyle = b.c; ctx.fill();
  ctx.clip();
  // rank bar on the right-to-left start side
  const rx = x0 + bw * .1, rw = bw * .17;
  ctx.fillStyle = b.bar; ctx.fillRect(rx, y0, rw, bh);
  ctx.fillStyle = '#f4f4f4';
  for (let i = 0; i < stripes; i++) ctx.fillRect(rx + rw - 22 - i * 26, y0, 12, bh);
  // stitching
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2; ctx.setLineDash([14, 10]);
  for (let i = 1; i <= 5; i++) { const y = y0 + bh * i / 6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + bw, y); ctx.stroke(); }
  ctx.setLineDash([]);
  const sh = ctx.createLinearGradient(0, y0, 0, y0 + bh);
  sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = sh; ctx.fillRect(x0, y0, bw, bh);
  ctx.restore();
}
function S3(t) {
  bg(BG);
  let k = 0; BELTS.forEach((b, i) => { if (t >= b.t) k = i; });
  const cur = BELTS[k];
  const g = ctx.createRadialGradient(W / 2, 960, 0, W / 2, 960, 900);
  const gc = k === 4 ? 'rgba(255,255,255,.14)' : hexA(cur.c, .18);
  g.addColorStop(0, gc); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);

  const swap = prog(t, 11.95, 12.3, E.inOutCubic);
  reveal('מהחגורה הלבנה', W / 2, 400, { size: 120 }, prog(t, 8.35, 8.85, E.outExpo), swap);
  reveal('עד החגורה השחורה', W / 2, 400, { size: 100, hl: '#fff', color: '#000' }, prog(t, 12.2, 12.7, E.outExpo));

  // belt
  const bw = 860, bh = 124, x0 = (W - bw) / 2, by = 960 + Math.sin(t * 2.2) * 6;
  let pop = 0; BELTS.forEach(b => { const d = t - b.t; if (d >= 0 && d < .6) pop += .06 * Math.exp(-d * 7) * Math.sin(d * 18 + 1.6); });
  ctx.save();
  ctx.translate(W / 2, by); ctx.scale(prog(t, 8.5, 8.95, E.outExpo) * (1 + pop), 1 + pop); ctx.translate(-W / 2, -by);
  if (k === 4) { ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.55)'; ctx.shadowBlur = 50 * prog(t, 12.1, 12.6); rrect(x0, by - bh / 2, bw, bh, 16); ctx.fillStyle = '#141414'; ctx.fill(); ctx.restore(); }
  BELTS.forEach((b, i) => {
    if (t < b.t) return;
    const w = i === 0 ? 1 : prog(t, b.t, b.t + .42, E.inOutCubic);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0 + bw * (1 - w) - 2, by - bh, bw * w + 4, bh * 2); ctx.clip(); // wipe right → left
    drawBelt(x0, by - bh / 2, bw, bh, b, i === 4 ? 3 : Math.min(4, Math.floor(prog(t, b.t + .3, b.t + .75) * 5)));
    if (i === 4) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; rrect(x0, by - bh / 2, bw, bh, 16); ctx.stroke(); }
    ctx.restore();
    // sheen
    const s = prog(t, b.t + .25, b.t + .85, E.inOutCubic);
    if (s > 0 && s < 1) {
      ctx.save(); rrect(x0, by - bh / 2, bw, bh, 16); ctx.clip();
      const sx = lerp(x0 + bw + 200, x0 - 200, s);
      const sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(x0, by - bh, bw, bh * 2);
      ctx.restore();
    }
  });
  ctx.restore();
  ring(W / 2, by, 12.1, t, 900, GOLD2, 14, .9);
  burst(W / 2, by, 12.1, t, 40, 77, GOLD2, 1200, 1.1, 8);

  // label swap
  BELTS.forEach((b, i) => {
    const d = i ? .2 : 0;
    const pin = prog(t, b.t + d, b.t + d + .4, E.outExpo);
    const nx = BELTS[i + 1], q = nx ? prog(t, nx.t, nx.t + .2, E.inCubic) : 0;
    reveal(b.he, W / 2, 1150, { size: 104, color: i === 4 ? GOLD2 : '#fff' }, pin, q);
    reveal(b.en, W / 2, 1245, { font: 'B', size: 56, ls: 12, color: '#b8b8b8' }, prog(t, b.t + d + .06, b.t + d + .46, E.outExpo), q);
  });

  // progress dots (right → left)
  const dy = 1390, sp = 170, dx = i => W / 2 + (2 - i) * sp;
  const appear = prog(t, 8.7, 9.1, E.outCubic);
  ctx.save(); ctx.globalAlpha = appear;
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx(0), dy); ctx.lineTo(dx(4), dy); ctx.stroke();
  let reach = 0; BELTS.forEach((b, i) => { if (i > 0) reach += prog(t, b.t, b.t + .42, E.inOutCubic); });
  ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.moveTo(dx(0), dy); ctx.lineTo(dx(0) - reach * sp, dy); ctx.stroke();
  BELTS.forEach((b, i) => {
    const on = prog(t, b.t + (i ? .3 : 0), b.t + (i ? .5 : .3), E.outBack);
    circle(dx(i), dy, 20, '#1b1b1b');
    ctx.strokeStyle = on > 0 ? GOLD : '#3a3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx(i), dy, 20, 0, Math.PI * 2); ctx.stroke();
    if (on > 0) circle(dx(i), dy, 14 * on, b.c === '#141414' ? '#000' : b.c);
    if (on > 0 && i === 4) { ctx.strokeStyle = GOLD2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx(i), dy, 14 * on, 0, Math.PI * 2); ctx.stroke(); }
  });
  ctx.restore();
  reveal('שיטה. משמעת. התמדה.', W / 2, 1620, { size: 74, w: 800, color: '#cfcfcf' }, prog(t, 12.55, 13.0, E.outExpo));
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}

// S5 18.8–24.6: champions
const CHAMPS = 'עידן אטלי • ארז מלכה • נאור מלכה • עדן פונג • נועם אבוחצירה • עידו גייץ • עמית יונסי • בן רביבו • יונתן אוטמזגין • ';
function S5(t) {
  bg(BG);
  const g = ctx.createRadialGradient(W / 2, 700, 0, W / 2, 700, 1100);
  g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(.5, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
  const zoomOut = prog(t, 24.15, 24.6, E.inCubic);
  ctx.save();
  ctx.translate(W / 2, 700); ctx.scale(1 + zoomOut * .5, 1 + zoomOut * .5); ctx.translate(-W / 2, -700);
  const mx = W / 2, my = 700, r = 210;
  // rays
  const pr = prog(t, 19.4, 20.0);
  if (pr > 0) {
    ctx.save(); ctx.translate(mx, my); ctx.rotate(t * .25); ctx.fillStyle = `rgba(255,255,255,${.07 * pr})`;
    for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI * 2 / 14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1700); ctx.lineTo(90, -1700); ctx.fill(); }
    ctx.restore();
  }
  // ribbon
  const pRib = prog(t, 18.9, 19.3, E.outCubic);
  ctx.save(); ctx.beginPath(); ctx.rect(0, -20, W, lerp(0, my - r + 30, pRib) + 20); ctx.clip();
  [[-1], [1]].forEach(([s]) => {
    ctx.beginPath();
    ctx.moveTo(mx + s * 230, -20); ctx.lineTo(mx + s * 110, -20); ctx.lineTo(mx - s * 15, my - r + 20); ctx.lineTo(mx + s * 75, my - r + 20); ctx.closePath();
    ctx.fillStyle = '#121212'; ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.stroke();
  });
  ctx.restore();
  // medal
  let pulse = 0; [20.3, 20.7, 21.1].forEach(h => { const d = t - h; if (d >= 0 && d < .5) pulse += .07 * Math.exp(-d * 8); });
  ctx.save(); ctx.translate(mx, my); ctx.scale(1 + pulse, 1 + pulse); ctx.translate(-mx, -my);
  const pf = prog(t, 19.45, 19.8, E.outCubic);
  if (pf > 0) {
    const mg = ctx.createRadialGradient(mx - 70, my - 80, 20, mx, my, r);
    mg.addColorStop(0, '#FFFFFF'); mg.addColorStop(.55, '#D2D2D2'); mg.addColorStop(1, '#6A6A6A');
    ctx.save(); ctx.globalAlpha = pf; ctx.shadowColor = 'rgba(255,255,255,.35)'; ctx.shadowBlur = 70; circle(mx, my, r, mg); ctx.restore();
    ctx.save(); ctx.globalAlpha = pf; ctx.strokeStyle = GOLD3; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(mx, my, r - 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  const pa = prog(t, 19.1, 19.6, E.inOutCubic);
  if (pa > 0) { ctx.strokeStyle = GOLD2; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(mx, my, r, -Math.PI / 2, -Math.PI / 2 + pa * Math.PI * 2); ctx.stroke(); }
  const pFoot = prog(t, 19.65, 20.05, E.outBack);
  if (pFoot > 0) foot(mx, my + 4, 250 * pFoot, { color: '#111', alpha: clamp(pFoot * 2) });
  // shine
  const sh = ((t - 20) % 2.2) / .7;
  if (t > 20 && sh < 1) {
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.clip();
    const sx = lerp(mx - r - 100, mx + r + 100, sh);
    ctx.translate(sx, my); ctx.rotate(.5);
    const sg = ctx.createLinearGradient(-60, 0, 60, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(-60, -400, 120, 800);
    ctx.restore();
  }
  ctx.restore();
  reveal('האלופים שלנו', W / 2, 1060, { size: 124 }, prog(t, 19.8, 20.3, E.outExpo));
  [['אלוף ישראל', 20.3, '#fff'], ['אלוף אירופה', 20.7, '#fff'], ['אלוף עולם', 21.1, 'outline']].forEach(([s, h, c], i) => {
    const p = prog(t, h - .12, h + .15, E.outExpo);
    if (p <= 0) return;
    T(s, W / 2, 1225 + i * 118, { size: 94, ...(c === 'outline' ? { hl: '#fff', color: '#000' } : { color: c }), scale: lerp(1.7, 1, p), alpha: clamp(p * 1.4) });
  });
  ring(W / 2, 1461, 21.1, t, 600, GOLD2, 10);
  ctx.restore();
  // confetti
  if (t > 20.3) {
    const R = rng(99);
    for (let i = 0; i < 90; i++) {
      const t0 = 20.3 + R() * 1.4, x = R() * W, sp = 380 + R() * 420, rot = R() * 6, w = 10 + R() * 10, col = R() < .6 ? '#fff' : '#7a7a7a';
      const d = t - t0; if (d < 0) continue;
      const y = -40 + d * sp, xx = x + Math.sin(d * 3 + i) * 40;
      if (y > H + 40) continue;
      ctx.save(); ctx.translate(xx, y); ctx.rotate(rot + d * 4); ctx.scale(1, Math.cos(d * 9 + i));
      ctx.fillStyle = col; ctx.globalAlpha = .85; ctx.fillRect(-w / 2, -w * .8, w, w * 1.6); ctx.restore();
    }
  }
  // crossing marquee bands
  const pm = prog(t, 21.55, 22.0, E.outExpo);
  if (pm > 0) {
    ctx.save(); ctx.translate(0, (1 - pm) * 400);
    ctx.save(); ctx.translate(W / 2, 1745); ctx.rotate(.05);
    ctx.fillStyle = '#111'; ctx.fillRect(-W, -55, W * 2, 110);
    marquee('CHAMPIONS • CHAMPIONS • CHAMPIONS • ', -(t - 21.5) * 180, { font: 'B', size: 74, ls: 8, stroke: GOLD, lw: 2 });
    ctx.restore();
    ctx.save(); ctx.translate(W / 2, 1740); ctx.rotate(-.06);
    ctx.fillStyle = GOLD; ctx.fillRect(-W, -62, W * 2, 124);
    marquee(CHAMPS, (t - 21.5) * 260, { size: 60, w: 800, color: '#111' });
    ctx.restore();
    ctx.restore();
  }
  full(`rgba(0,0,0,${zoomOut})`);
}
function marquee(str, off, o) {
  const w = measure(str, o);
  let x = ((off % w) + w) % w - w * 2;
  for (; x < W * 1.5; x += w) T(str, x, 4, { ...o, align: 'left' });
}

// S6 24.6–28.2: "the next champion starts here"
function S6(t) {
  bg(BG);
  let beat = 0; [24.9, 25.45, 26.0, 26.55].forEach(h => { const d = t - h; if (d >= 0 && d < .5) beat += .05 * Math.exp(-d * 7); });
  foot(W / 2, 960, 1150 * (1 + beat), { alpha: .055 + beat * .6 });
  const out = prog(t, 26.9, 27.2, E.inCubic);
  ctx.save(); ctx.globalAlpha = 1 - out;
  ctx.translate(W / 2, 1000); ctx.scale(1 - out * .08, 1 - out * .08); ctx.translate(-W / 2, -1000);
  reveal('האלוף הבא', W / 2, 800, { size: 176 }, prog(t, 24.8, 25.3, E.outExpo));
  reveal('מתחיל כאן.', W / 2, 990, { size: 156, hl: '#fff', color: '#000' }, prog(t, 25.3, 25.8, E.outExpo));
  const pl = prog(t, 25.75, 26.2, E.inOutCubic);
  ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 260 * pl, 1110, 520 * pl, 6);
  reveal('הצטרפו לקבוצת הבוגרים', W / 2, 1210, { size: 68, w: 800 }, prog(t, 26.0, 26.4, E.outExpo));
  reveal('BJJ • MMA • 17+', W / 2, 1300, { font: 'B', size: 66, ls: 12, color: '#c4c4c4' }, prog(t, 26.25, 26.65, E.outExpo));
  ctx.restore();
  // converging speed lines
  const pz = prog(t, 27.1, 28.2, E.inCubic);
  if (pz > 0) {
    const R = rng(5);
    ctx.save(); ctx.strokeStyle = '#fff';
    for (let i = 0; i < 70; i++) {
      const a = R() * Math.PI * 2, r0 = 300 + R() * 600, ph = (R() + t * (1.2 + R())) % 1;
      const r1 = lerp(1400, r0 * .3, ph), len = 120 + 220 * pz;
      ctx.globalAlpha = pz * .55 * (1 - ph); ctx.lineWidth = 2 + R() * 3;
      ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, 960 + Math.sin(a) * r1);
      ctx.lineTo(W / 2 + Math.cos(a) * (r1 + len), 960 + Math.sin(a) * (r1 + len)); ctx.stroke();
    }
    ctx.restore();
  }
  // final footsteps marching to center
  [27.1, 27.35, 27.6, 27.85].forEach((ts, i) => {
    if (t < ts - .15) return;
    const x = W / 2 + (i % 2 ? 85 : -85), y = 1700 - i * 250;
    const pin = prog(t, ts - .15, ts, E.inCubic);
    ring(x, y, ts, t, 260, '#fff', 8, .5);
    foot(x, y, 220 * lerp(1.6, 1, pin), { alpha: pin * (1 - prog(t, ts + .2, ts + .5)), flip: i % 2 === 0, rot: i % 2 ? .12 : -.12 });
  });
  full(`rgba(255,255,255,${prog(t, 27.9, 28.2, E.inQuart)})`);
}

// S7 28.2–35: logo end card + phone
function S7(t) {
  bg(BG);
  const g = ctx.createRadialGradient(W / 2, 640, 0, W / 2, 640, 900);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
  // embers
  const R = rng(31);
  for (let i = 0; i < 46; i++) {
    const x = R() * W, sp = 30 + R() * 70, ph = R() * H, s = 2 + R() * 4, c = R() < .5 ? '#8a8a8a' : '#fff';
    const y = H - ((ph + (t - 28.2) * sp) % H);
    ctx.globalAlpha = .12 + .25 * Math.abs(Math.sin(t * 1.3 + i)); ctx.fillStyle = c; ctx.fillRect(x + Math.sin(t + i) * 12, y, s, s);
  }
  ctx.globalAlpha = 1;
  // footprint stamp
  const ps = prog(t, 28.2, 28.7, E.outExpo);
  ring(W / 2, 600, 28.2, t, 1000, '#fff', 24, 1.0);
  ring(W / 2, 600, 28.32, t, 760, GOLD2, 10, .9);
  burst(W / 2, 640, 28.2, t, 60, 123, '#fff', 1500, 1.2, 9);
  const breathe = .5 + .5 * Math.sin((t - 28.2) * 2.2);
  foot(W / 2, 600, 560 * lerp(1.35, 1, ps) * (1 + .012 * breathe), { glow: 30 + 30 * breathe, glowColor: 'rgba(255,255,255,.35)' });
  // logo wordmark (from the original logo)
  const pt = prog(t, 28.75, 29.4, E.inOutCubic);
  if (pt > 0) {
    const img = A.text, tw = 900, th = tw * img.height / img.width, ty = 1010 + (1 - pt) * 20;
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - tw / 2 * pt - 4, ty - th, tw * pt + 8, th * 2); ctx.clip();
    ctx.globalAlpha = clamp(pt * 1.5);
    ctx.drawImage(img, W / 2 - tw / 2, ty - th / 2, tw, th);
    ctx.restore();
  }
  const pl = prog(t, 29.25, 29.7, E.inOutCubic);
  ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 260 * pl, 1150, 520 * pl, 5);
  const pc = prog(t, 29.45, 29.85, E.outCubic);
  T('BJJ  •  MMA  •  ADULTS 17+', W / 2, 1222 + (1 - pc) * 20, { font: 'B', size: 60, ls: 10, color: '#c8c8c8', alpha: pc });
  // CTA pill
  const pp = prog(t, 29.8, 30.25, E.outBack);
  if (pp > 0) {
    ctx.save(); ctx.translate(W / 2, 1390); ctx.scale(pp, pp);
    ctx.shadowColor = 'rgba(255,255,255,.25)'; ctx.shadowBlur = 40;
    rrect(-390, -68, 780, 136, 68); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
    const s = ((t - 31.2) % 2.4) / .8;
    if (t > 31.2 && s < 1) {
      ctx.save(); rrect(-390, -68, 780, 136, 68); ctx.clip();
      const sx = lerp(-520, 520, s); const sg = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0);
      sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(.5, 'rgba(0,0,0,.16)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(-400, -80, 800, 160); ctx.restore();
    }
    T('לאימון ניסיון בוואטסאפ', 0, 3, { size: 62, color: '#000' });
    ctx.restore();
  }
  // phone number, character stagger
  const o = { font: 'B', size: 176, ls: 6 };
  const total = measure(PHONE, o);
  let x = W / 2 - total / 2;
  const pulse = 1 + .015 * Math.sin((t - 31) * 3) * prog(t, 31, 31.5);
  ctx.save(); ctx.translate(W / 2, 1600); ctx.scale(pulse, pulse); ctx.translate(-W / 2, -1600);
  [...PHONE].forEach((ch, i) => {
    const cw = measure(ch, o);
    const p = prog(t, 30.15 + i * .05, 30.55 + i * .05, E.outBack);
    if (p > 0) T(ch, x + cw / 2, 1600 - (1 - p) * 80, { ...o, ls: 0, color: '#fff', alpha: clamp(p * 1.5) });
    x += cw;
  });
  ctx.restore();
  reveal('דרך יחיעם 1, נהריה', W / 2, 1770, { size: 54, w: 400, color: '#d0d0d0' }, prog(t, 30.9, 31.35, E.outExpo));
  // white flash from the slam
  full(`rgba(255,255,255,${1 - prog(t, 28.2, 28.8, E.outCubic)})`);
}

// SM: MMA scene, local time tau (0–2.4s): octagon, rapid strike words, MMA slam
const MMA_HITS = [.4, .65, .9, 1.15, 1.4];
const MMA_WORDS = ['אגרופים', 'בעיטות', 'הפלות', 'קרקע'];
function octagon(cx, cy, r, p) {
  const pt = i => { const a = -Math.PI / 2 + Math.PI / 8 + i * Math.PI / 4; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const n = p * 8;
  ctx.beginPath(); ctx.moveTo(...pt(0));
  for (let i = 1; i <= 8; i++) {
    if (i <= n) { ctx.lineTo(...pt(i)); continue; }
    const f = n - (i - 1), a = pt(i - 1), b = pt(i);
    if (f > 0) ctx.lineTo(lerp(a[0], b[0], f), lerp(a[1], b[1], f));
    break;
  }
  ctx.stroke();
}
function SM(tau) {
  bg('#070707');
  let sx = 0, sy = 0;
  MMA_HITS.forEach((h, i) => {
    const d = tau - h; if (d < 0 || d > .5) return;
    const k = (i === 4 ? 30 : 12) * Math.exp(-d * 10); sx += k * Math.sin(d * 70 + i); sy += k * Math.cos(d * 61 + i);
  });
  ctx.save(); ctx.translate(sx, sy);
  const cy = 900, r = 440;
  // chain-link cage
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 3;
  const z = 1 + Math.max(0, tau) * .05; ctx.translate(W / 2, cy); ctx.scale(z, z); ctx.translate(-W / 2, -cy);
  for (let x = -2 * H; x < W + 2 * H; x += 70) {
    ctx.beginPath(); ctx.moveTo(x, -600); ctx.lineTo(x + H + 1200, H + 600); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, -600); ctx.lineTo(x - H - 1200, H + 600); ctx.stroke();
  }
  ctx.restore();
  const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, 700);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
  const po = prog(tau, 0, .45, E.inOutCubic);
  if (po > 0) {
    ctx.save(); ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(255,255,255,.5)'; ctx.shadowBlur = 30; octagon(W / 2, cy, r, po);
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; octagon(W / 2, cy, r - 38, po);
    ctx.restore();
  }
  reveal('אומנויות לחימה משולבות', W / 2, 300, { size: 70, w: 800 }, prog(tau, .05, .45, E.outExpo));
  // impact lines on each hit
  MMA_HITS.forEach((h, i) => {
    const d = tau - h; if (d < 0 || d > .3) return;
    const R = rng(200 + i), q = d / .3;
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.globalAlpha = 1 - q;
    for (let k = 0; k < 16; k++) {
      const a = R() * Math.PI * 2, r0 = 200 + q * 260 + R() * 60, len = 70 + R() * 90;
      ctx.lineWidth = 3 + R() * 4;
      ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); ctx.stroke();
    }
    ctx.restore();
    ring(W / 2, cy, h, tau, i === 4 ? 900 : 480, '#fff', i === 4 ? 18 : 8, .6);
  });
  MMA_WORDS.forEach((w, i) => {
    const h = MMA_HITS[i]; if (tau < h - .08 || tau >= MMA_HITS[i + 1] - .02) return;
    const p = prog(tau, h - .08, h + .05, E.outExpo);
    T(w, W / 2, cy, { size: 150, scale: lerp(1.8, 1, p), alpha: clamp(p * 1.5) });
  });
  const pm = prog(tau, 1.32, 1.48, E.outExpo);
  if (pm > 0) T('MMA', W / 2, cy + 12, { font: 'B', size: 330, scale: lerp(2.2, 1, pm), alpha: clamp(pm * 1.5) });
  burst(W / 2, cy, 1.4, tau, 50, 321, '#fff', 1400, 1, 8);
  reveal('בהדרכת גבע בריטש', W / 2, 1480, { size: 74, w: 900, hl: '#fff', color: '#000' }, prog(tau, 1.6, 1.95, E.outExpo));
  reveal('מאמן MMA · חגורה חומה ב-BJJ', W / 2, 1590, { size: 50, w: 400, color: '#cfcfcf' }, prog(tau, 1.75, 2.1, E.outExpo));
  ctx.restore();
  MMA_HITS.forEach((h, i) => { const d = tau - h; if (d >= 0 && d < .15) full(`rgba(255,255,255,${(i === 4 ? .5 : .16) * (1 - d / .15)})`); });
}

// ---------- compositor ----------
function into(buf, fn) {
  const prev = ctx, pf = FRAME; ctx = buf.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  safe(fn); ctx = prev; FRAME = pf;
}
function slats(t, from, to, t0) {
  into(A.bufA, from); into(A.bufB, to);
  const n = 8, sh = H / n;
  for (let i = 0; i < n; i++) {
    const s = t0 + i * .035, x = lerp(W, -W, prog(t, s, s + .75, E.inOutCubic));
    const y = i * sh;
    if (x > 0) ctx.drawImage(A.bufA, 0, y, x, sh, 0, y, x, sh);
    const nx = Math.max(0, x + W);
    if (nx < W) ctx.drawImage(A.bufB, nx, y, W - nx, sh, nx, y, W - nx, sh);
    ctx.fillStyle = i % 2 ? PAPER : '#1c1c1c'; ctx.fillRect(x, y, W, sh + 1);
  }
}
function whip(t, from, to, a, b) {
  into(A.bufA, from); into(A.bufB, to);
  const p = prog(t, a, b, E.inOutQuart);
  const v = Math.abs(prog(t + 1 / 60, a, b, E.inOutQuart) - prog(t - 1 / 60, a, b, E.inOutQuart)) * W;
  const N = 16;
  for (let k = 0; k < N; k++) {
    const o = (k / (N - 1) - .5) * v;
    ctx.globalAlpha = 1 / (k + 1);
    ctx.drawImage(A.bufA, -p * W + o, 0);
    ctx.drawImage(A.bufB, (1 - p) * W + o, 0);
  }
  ctx.globalAlpha = 1;
}
// 20s TikTok cut: piecewise-linear map from video time to the story timeline the scenes are written in.
// Story 13.35–18.8 (video 7.2–10.5) is replaced by the MMA scene; 22.4–24.6 is skipped.
const CUT = [ // [video, story]
  [0, 0], [2.2, 3.8], [4.6, 8.2], [7.2, 13.35], [10.5, 18.8], [13.0, 22.4], [13.0, 24.6], [15.2, 28.2], [20.0, 33.0]];
function storyTime(t) {
  for (let i = 1; i < CUT.length; i++) {
    const [v0, s0] = CUT[i - 1], [v1, s1] = CUT[i];
    if (v1 === v0) continue;
    if (t <= v1 || i === CUT.length - 1) return s0 + (t - v0) * (s1 - s0) / (v1 - v0);
  }
}
function renderFrame(t) {
  ctx = mainCtx; FRAME = new DOMMatrix();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const st = storyTime(t);
  const s = shake(st);
  ctx.save(); ctx.translate(s.x, s.y);
  if (t < 7.2) safe(() => t < 2.2 ? S1(st) : t < 4.6 ? S2(st) : S3(st));
  else if (t < 7.8) { // slat wipe belts → MMA
    const tau = 13.35 + (t - 7.2) * 1.67;
    slats(tau, () => S3(Math.min(tau, 13.8)), () => SM(t - 7.8), 13.35);
  }
  else if (t < 10.2) safe(() => SM(t - 7.8));
  else if (t < 10.5) whip(t, () => SM(t - 7.8), () => S5(18.8), 10.2, 10.5);
  else if (t < 13.0) safe(() => { S5(st); full(`rgba(0,0,0,${prog(t, 12.75, 13.0, E.inCubic)})`); });
  else if (t < 15.2) safe(() => S6(st));
  else safe(() => S7(st));
  ctx.restore();
  // vignette + grain
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'overlay';
  const f = Math.floor(t * 30), ox = (f * 97) % 256, oy = (f * 61) % 256;
  ctx.fillStyle = ctx.createPattern(A.grain, 'repeat');
  ctx.translate(-ox, -oy); ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

window.ready = prep().then(() => {
  window.renderFrame = renderFrame;
  window.DUR = DUR;
  if (!/render/.test(location.search)) {
    const start = performance.now();
    const loop = now => { renderFrame(((now - start) / 1000) % DUR); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
});
