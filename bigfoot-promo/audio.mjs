// Synthesizes the soundtrack (out/audio.wav), synced to the visual hits in anim.js.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SR = 44100, DUR = 20, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 1;
// Events are written on the 35s story timeline and mapped onto the 20s cut (same table as anim.js).
const CUT = [[0, 0], [2.2, 3.8], [4.6, 8.2], [7.2, 13.35], [10.5, 18.8], [13.0, 22.4], [13.0, 24.6], [15.2, 28.2], [20.0, 33.0]];
function M(st) {
  for (let i = 1; i < CUT.length; i++) {
    const [v0, s0] = CUT[i - 1], [v1, s1] = CUT[i];
    if (st <= s1 || i === CUT.length - 1) return v0 + (st - s0) * (v1 - v0) / (s1 - s0);
  }
}
let MAP = true; // false = times are already in video seconds
const at = t => MAP ? M(t) : t;
const span = (t, len) => MAP ? M(t + len) - M(t) : len;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;

function add(t0, len, fn, gain = 1, pan = 0) {
  const s0 = Math.round(at(t0) * SR), n = Math.round(len * SR);
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < n; i++) {
    const j = s0 + i; if (j < 0 || j >= N) continue;
    const v = fn(i / SR, i);
    L[j] += v * gl; R[j] += v * gr;
  }
}
const kick = (t0, g = 1, decay = 7, f0 = 140, f1 = 42) => {
  let ph = 0;
  add(t0, 0.6, t => {
    const f = f1 + (f0 - f1) * Math.exp(-t * 28);
    ph += 2 * Math.PI * f / SR;
    return Math.tanh(Math.sin(ph) * Math.exp(-t * decay) * 1.6) + (t < .004 ? rnd() * .4 : 0);
  }, g);
};
const snare = (t0, g = .5) => {
  let lp = 0;
  add(t0, .35, t => {
    const n = rnd(); lp += (n - lp) * .25;
    return ((n - lp) * Math.exp(-t * 16) + Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30) * .6);
  }, g);
};
const hat = (t0, g = .12, pan = 0) => {
  let lp = 0;
  add(t0, .08, t => { const n = rnd(); lp += (n - lp) * .5; return (n - lp) * Math.exp(-t * 55); }, g, pan);
};
const boom = (t0, g = 1.2) => {
  kick(t0, g, 2.2, 90, 30);
  let lp = 0;
  add(t0, 1.6, t => { lp += (rnd() - lp) * .03; return lp * 4 * Math.exp(-t * 3); }, g * .8);
};
const whoosh = (t0, len, g = .5, pan = 0) => {
  len = Math.max(.2, span(t0, len));
  let lp = 0;
  add(t0, len, t => {
    const x = t / len, c = .02 + .25 * Math.sin(Math.PI * x) ** 2;
    lp += (rnd() - lp) * c;
    return lp * Math.sin(Math.PI * x) ** 2 * 2.2;
  }, g, pan);
};
const riser = (t0, len, g = .4) => {
  len = span(t0, len);
  let lp = 0, ph = 0;
  add(t0, len, t => {
    const x = t / len; lp += (rnd() - lp) * (.03 + .4 * x * x);
    ph += 2 * Math.PI * (110 + 660 * x * x) / SR;
    return (lp * 1.8 + ((ph / Math.PI) % 2 - 1) * .25) * x * x;
  }, g);
};
const tick = (t0, f = 1760, g = .25) => add(t0, .4, t => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) + Math.sin(2 * Math.PI * f * 1.5 * t) * Math.exp(-t * 14) * .4, g);
const saw = (ph) => (ph / Math.PI) % 2 - 1;
function pad(t0, len, freqs, g = .12, cutoff = .04) {
  const phs = freqs.flatMap(f => [0, 0, 0].map(() => Math.random() * 6));
  let lpL = 0, lpR = 0;
  len = span(t0, len);
  const s0 = Math.round(at(t0) * SR), n = Math.round(len * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / .8) * Math.min(1, (len - t) / 1.5);
    let a = 0, b = 0;
    freqs.forEach((f, k) => [-.08, 0, .08].forEach((d, m) => {
      const idx = k * 3 + m; phs[idx] += 2 * Math.PI * f * (1 + d / 100) / SR;
      const v = saw(phs[idx] % (2 * Math.PI)); if (m !== 2) a += v; if (m !== 0) b += v;
    }));
    lpL += (a - lpL) * cutoff; lpR += (b - lpR) * cutoff;
    const j = s0 + i; if (j < N) { L[j] += lpL * env * g; R[j] += lpR * env * g; }
  }
}

// --- intro: footsteps + drone ---
pad(0, 3.9, [55, 82.4], .09, .02);
[.35, .85, 1.35, 1.85, 2.35].forEach((t, i) => { kick(t, .9, 6, 110, 38); whoosh(t - .2, .22, .15, i % 2 ? .3 : -.3); });
riser(2.6, 1.2, .35);
whoosh(3.1, .7, .5);

// --- main groove: steady 120 bpm in video time, 2.5s → 14.25s ---
MAP = false;
const beat = .5, GEND = 14.45;
const bass = [55, 43.65, 65.41, 49.0]; // A F C G
const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
for (let bar = 0; bar < 8; bar++) {
  const b0 = 2.2 + bar * 4 * beat; if (b0 >= GEND) break;
  const ci = bar % 4;
  const f = bass[ci]; let ph = 0;
  add(b0, Math.min(2, GEND - b0), t => {
    ph += 2 * Math.PI * f / SR;
    const sc = 1 - .85 * Math.exp(-((t % beat) * 14));
    return (Math.sin(ph) + .25 * Math.sin(2 * ph)) * sc * .55;
  }, 1);
  pad(b0, Math.min(2.05, GEND - b0), chords[ci], .028, .03);
  for (let q = 0; q < 4; q++) {
    const tq = b0 + q * beat; if (tq >= GEND) break;
    if (q === 0 || (q === 2 && bar % 2 === 1)) kick(tq, .85);
    if (q === 2 && bar % 2 === 0) kick(tq + .25, .55);
    if (q === 1 || q === 3) snare(tq, .38);
    hat(tq + .25, .1, .2); hat(tq, .05, -.2);
  }
}
MAP = true;
// hits & transitions
boom(4.15, .9); boom(4.65, .9); whoosh(3.75, .45, .45, -.5); whoosh(4.25, .45, .45, .5);
tick(5.0, 1320, .2); whoosh(5.05, .5, .35, .6); tick(5.9, 880, .3);
whoosh(7.5, .75, .45); kick(8.2, .8, 4, 100, 35);
[9.4, 10.3, 11.2].forEach(t => { tick(t, 1760, .18); whoosh(t - .05, .45, .25, -.4); });
boom(12.1, .9); tick(12.1, 2637, .22);
tick(19.1, 1046, .2); tick(19.6, 1568, .22);
[20.3, 20.7].forEach(t => kick(t, .9, 5, 120, 40)); boom(21.1, 1);
tick(21.1, 2093, .2); whoosh(21.5, .5, .3, .5);
// --- MMA scene (video time) ---
MAP = false;
whoosh(7.1, .65, .55, .7);
[8.2, 8.45, 8.7, 8.95].forEach((t, i) => { kick(t, .8, 9, 150, 45); snare(t, .45); whoosh(t - .12, .14, .2, i % 2 ? .4 : -.4); });
boom(9.2, 1.2); tick(9.4, 1318, .16);
whoosh(10.1, .45, .6, -.7);
whoosh(12.7, .35, .45);
MAP = true;
// --- build to the logo ---
pad(24.6, 3.6, [55, 82.4, 110], .07, .025);
[24.9, 25.45, 26.0, 26.55].forEach(t => { kick(t, .8, 7, 90, 35); kick(t + .16, .45, 9, 90, 35); });
[27.1, 27.35, 27.6, 27.85].forEach(t => kick(t, .7, 8, 120, 40));
riser(26.9, 1.3, .5);
// --- logo slam + end card ---
boom(28.2, 1.4); whoosh(28.15, 1.2, .35);
pad(28.2, 4.8, [110, 164.8, 220, 261.6], .05, .02);
pad(28.2, 4.8, [55], .1, .05);
[29.8].forEach(t => tick(t, 1318, .18));
for (let i = 0; i < 12; i++) tick(30.15 + i * .05, 2200 + i * 60, .05);

// --- master: soft clip, normalize, fade, write WAV ---
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * .9); R[i] = Math.tanh(R[i] * .9); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = .89 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const f = Math.min(1, (N - i) / (SR * 1.2));
  buf.writeInt16LE(Math.round(L[i] * g * f * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * g * f * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(dir, 'out', 'audio.wav'), buf);
console.log('audio.wav written, peak', peak.toFixed(3));
