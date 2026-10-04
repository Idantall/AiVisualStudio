// Synthesizes the 25s soundtrack (out/audio.wav): an original 120 bpm A-minor track plus sound
// effects synced to the visual hits in anim.js. All times are video seconds.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SR = 44100, DUR = 25, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);    // dry bus (drums, bass, sfx)
const ML = new Float32Array(N), MR = new Float32Array(N);  // music bus (gets the echo)
let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const saw = ph => (ph / Math.PI) % 2 - 1;

// Story-time → video-time map (same table as anim.js), for effects tied to scene animations.
const CUT = [[0, 0], [2.5, 3.8], [5.5, 8.2], [8.5, 13.35], [13.7, 18.8], [17.2, 24.15], [17.5, 24.6], [20.0, 28.2], [25.0, 33.2]];
function M(st) {
  for (let i = 1; i < CUT.length; i++) {
    const [v0, s0] = CUT[i - 1], [v1, s1] = CUT[i];
    if (st <= s1 || i === CUT.length - 1) return v0 + (st - s0) * (v1 - v0) / (s1 - s0);
  }
}

function add(t0, len, fn, gain = 1, pan = 0, music = false) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  const bl = music ? ML : L, br = music ? MR : R;
  for (let i = 0; i < n; i++) {
    const j = s0 + i; if (j < 0 || j >= N) continue;
    const v = fn(i / SR, i);
    bl[j] += v * gl; br[j] += v * gr;
  }
}

// ---------- drums & effects ----------
const kick = (t0, g = 1, decay = 7, f0 = 140, f1 = 42) => {
  let ph = 0;
  add(t0, 0.6, t => {
    const f = f1 + (f0 - f1) * Math.exp(-t * 28);
    ph += 2 * Math.PI * f / SR;
    return Math.tanh(Math.sin(ph) * Math.exp(-t * decay) * 1.6) + (t < .004 ? rnd() * .4 : 0);
  }, g);
};
const snare = (t0, g = .5, pan = 0) => {
  let lp = 0;
  add(t0, .35, t => {
    const n = rnd(); lp += (n - lp) * .25;
    return ((n - lp) * Math.exp(-t * 16) + Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30) * .6);
  }, g, pan);
};
const clap = (t0, g = .45) => {
  let lp = 0;
  add(t0, .3, t => {
    const n = rnd(); lp += (n - lp) * .35;
    const e = [0, .011, .022].reduce((s, d) => s + (t >= d ? Math.exp(-(t - d) * (d === .022 ? 18 : 120)) : 0), 0);
    return (n - lp) * e;
  }, g);
};
const hat = (t0, g = .12, pan = 0, open = false) => {
  let lp = 0;
  add(t0, open ? .3 : .08, t => { const n = rnd(); lp += (n - lp) * .5; return (n - lp) * Math.exp(-t * (open ? 12 : 55)); }, g, pan);
};
const boom = (t0, g = 1.2) => {
  kick(t0, g, 2.2, 90, 30);
  let lp = 0;
  add(t0, 1.6, t => { lp += (rnd() - lp) * .03; return lp * 4 * Math.exp(-t * 3); }, g * .8);
};
const whoosh = (t0, len, g = .5, pan = 0) => {
  let lp = 0;
  add(t0, len, t => {
    const x = t / len, c = .02 + .25 * Math.sin(Math.PI * x) ** 2;
    lp += (rnd() - lp) * c;
    return lp * Math.sin(Math.PI * x) ** 2 * 2.2;
  }, g, pan);
};
const riser = (t0, len, g = .4) => {
  let lp = 0, ph = 0;
  add(t0, len, t => {
    const x = t / len; lp += (rnd() - lp) * (.03 + .4 * x * x);
    ph += 2 * Math.PI * (110 + 660 * x * x) / SR;
    return (lp * 1.8 + saw(ph) * .25) * x * x;
  }, g);
};
const tick = (t0, f = 1760, g = .25) => add(t0, .4, t => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) + Math.sin(2 * Math.PI * f * 1.5 * t) * Math.exp(-t * 14) * .4, g);

// ---------- melodic instruments (music bus) ----------
function pad(t0, len, notes, g = .1, cutoff = .03) {
  const fs_ = notes.map(mf), phs = fs_.flatMap(() => [0, 0, 0].map(() => rnd() * 3 + 3));
  let lpL = 0, lpR = 0;
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / .4) * Math.min(1, (len - t) / .6);
    let a = 0, b = 0;
    fs_.forEach((f, k) => [-.1, 0, .1].forEach((d, m) => {
      const idx = k * 3 + m; phs[idx] += 2 * Math.PI * f * (1 + d / 100) / SR;
      const v = saw(phs[idx]); if (m !== 2) a += v; if (m !== 0) b += v;
    }));
    lpL += (a - lpL) * cutoff; lpR += (b - lpR) * cutoff;
    const j = s0 + i; if (j >= 0 && j < N) { ML[j] += lpL * env * g; MR[j] += lpR * env * g; }
  }
}
const pluck = (t0, m, len, g = .2, bright = .35, pan = 0) => {
  const f = mf(m); let p1 = 0, p2 = 0, lp = 0;
  add(t0, len + .25, t => {
    p1 += 2 * Math.PI * f / SR; p2 += 2 * Math.PI * f * 1.007 / SR;
    lp += (saw(p1) + saw(p2) - lp) * (bright * Math.exp(-t * 7) + .015);
    return lp * Math.exp(-t * 3.5) * (t < len ? 1 : Math.exp(-(t - len) * 25));
  }, g, pan, true);
};
const lead = (t0, m, len, g = .16) => {
  const f = mf(m); let p1 = 0, p2 = 0, p3 = 0, lp = 0;
  add(t0, len + .3, t => {
    const vib = 1 + (t > .18 ? .006 * Math.sin(2 * Math.PI * 5.5 * t) : 0);
    p1 += 2 * Math.PI * f * vib / SR; p2 += 2 * Math.PI * f * vib * 1.004 / SR; p3 += 2 * Math.PI * f * vib * .5 / SR;
    lp += (saw(p1) + saw(p2) + .5 * Math.sign(Math.sin(p3)) - lp) * .12;
    const env = Math.min(1, t / .012) * (t < len ? .85 + .15 * Math.exp(-t * 6) : Math.exp(-(t - len) * 14));
    return lp * env;
  }, g, 0, true);
};
const bassNote = (t0, m, len, g = .5) => {
  const f = mf(m); let p = 0, lp = 0;
  add(t0, len, t => {
    p += 2 * Math.PI * f / SR;
    lp += (saw(p) - lp) * .045;
    const env = Math.min(1, t / .005) * Math.exp(-t * 2.5) * Math.min(1, (len - t) / .02);
    return (lp * .9 + Math.sin(p) * .9) * env;
  }, g);
};

// ---------- the track ----------
const BEAT = .5, BAR = 2; // downbeats on every even second
const CH = { // [pad/arp voicing], bass root
  Am: [[57, 60, 64], 33], F: [[57, 60, 65], 29], C: [[55, 60, 64], 36], G: [[55, 59, 62], 31], E: [[56, 59, 64], 28],
};
const ARP = [0, 1, 2, 3, 2, 1, 3, 1]; // index 3 = root an octave up
function arpBar(t0, chord, beats, bright, g) {
  const [v] = CH[chord];
  for (let k = 0; k < beats * 2; k++) {
    const i = ARP[k % 8], m = i === 3 ? v[0] + 12 : v[i];
    pluck(t0 + k * BEAT / 2, m + 12, .2, g, bright, k % 2 ? .35 : -.35);
  }
}
function bassBar(t0, chord, beats, g = .5) {
  const r = CH[chord][1];
  for (let k = 0; k < beats * 2; k++) bassNote(t0 + k * BEAT / 2, r + (k % 4 === 3 ? 12 : 0), .22, g);
}
function drums(t0, beats, style) {
  for (let q = 0; q < beats; q++) {
    const t = t0 + q * BEAT;
    if (style === 'groove') {
      if (q % 4 === 0 || (q % 4 === 2 && q % 8 !== 2)) kick(t, .85);
      if (q % 8 === 2) kick(t + .25, .55);
      if (q % 2 === 1) { snare(t, .32); clap(t, .2); }
      hat(t + .25, .1, .2); hat(t, .05, -.2);
    } else if (style === 'mma') {
      if (q % 2 === 0) kick(t, .8);
      if (q % 2 === 1) snare(t, .34);
      for (let s = 0; s < 4; s++) hat(t + s * BEAT / 4, s % 2 ? .07 : .1, s % 2 ? .3 : -.3);
    } else if (style === 'chorus') {
      kick(t, .9);
      if (q % 2 === 1) { clap(t, .4); snare(t, .2); }
      hat(t + .25, .14, .25, true); hat(t, .05, -.2);
    } else if (style === 'half') {
      if (q % 4 === 0) kick(t, .6, 5);
      if (q % 4 === 2) clap(t, .2);
      hat(t + .25, .05, .3);
    }
  }
}
// intro (0–2): dark pad, soft closed arp, footsteps
pad(0, 2.1, [45, 52, 57], .07, .015);
arpBar(0, 'Am', 4, .1, .08);
// verse (2–10): Am F C G — gym, belts, coach Almog
['Am', 'F', 'C', 'G'].forEach((c, i) => {
  const t = 2 + BAR * i;
  arpBar(t, c, 4, .2 + i * .05, .14); bassBar(t, c, 4); pad(t, BAR + .05, CH[c][0], .035, .02); drums(t, 4, 'groove');
});
// MMA (10–12) on E, aggressive; the MMA slam lands on the 12.0 downbeat
arpBar(10, 'E', 4, .4, .14); bassBar(10, 'E', 4, .55); pad(10, 2.05, CH.E[0], .04, .03); drums(10, 4, 'mma');
// 12–14 Am, groove back in (coach Geva)
arpBar(12, 'Am', 4, .35, .14); bassBar(12, 'Am', 4); pad(12, 2.05, CH.Am[0], .04, .03); drums(12, 4, 'groove');
// chorus (14–18): F G Am E with the lead hook — champions
[['F', 14], ['G', 15], ['Am', 16], ['E', 17]].forEach(([c, t]) => {
  arpBar(t, c, 2, .5, .15); bassBar(t, c, 2, .55); pad(t, 1.05, CH[c][0].map(m => m + 12), .04, .04);
});
drums(14, 8, 'chorus');
[[0, 72, 1], [1, 77, 1], [2, 74, 1], [3, 79, 1], [4, 76, 1], [5, 81, .5], [5.5, 79, .5], [6, 76, 1], [7, 80, 1]]
  .forEach(([b, m, l]) => lead(14 + b * BEAT, m, l * BEAT * .92));
// build (18–20): F → G, snare roll, riser, a beat of air before the drop
[['F', 18], ['G', 19]].forEach(([c, t]) => { arpBar(t, c, 2, .3 + (t - 18) * .3, .12); pad(t, 1.05, CH[c][0], .05, .02 + (t - 18) * .03); });
bassNote(18, 29, 1, .45); bassNote(19, 31, .8, .45);
{ let t = 18, step = .25, i = 0; while (t < 19.8) { snare(t, .12 + .28 * (t - 18) / 1.8, i++ % 2 ? .2 : -.2); t += step; step = t > 19.25 ? .0625 : t > 18.75 ? .125 : .25; } }
riser(18.1, 1.75, .55);
// drop (20–25): logo slam
boom(20, 1.5); whoosh(19.95, 1.2, .35);
pad(20, 5, [45, 57, 60, 64, 69], .07, .03);
lead(20, 81, 2.2, .15); lead(22.25, 76, .4, .1); lead(22.75, 79, .4, .1); lead(23.25, 81, 1.4, .12);
bassNote(20, 33, 2, .6); bassNote(22, 33, 2, .45);
for (let b = 0; b < 2; b++) arpBar(22 + b * 2, 'Am', 4, .25 - b * .08, .11 - b * .03);
drums(22, 4, 'half');

// ---------- sound effects synced to the picture ----------
[.35, .85, 1.35, 1.85, 2.35].forEach((st, i) => { const t = M(st); kick(t, .8, 6, 110, 38); whoosh(t - .15, .18, .15, i % 2 ? .3 : -.3); });
riser(1.6, .9, .3); whoosh(2.15, .45, .45);
boom(M(4.15), .8); boom(M(4.65), .8); whoosh(M(4.15) - .3, .32, .4, -.5); whoosh(M(4.65) - .3, .32, .4, .5);
whoosh(M(5.1), .4, .3, .6); tick(M(5.9), 880, .25);
whoosh(M(7.6), .5, .4);
[9.4, 10.3, 11.2].forEach(st => tick(M(st), 1760, .15)); boom(M(12.1), .7); tick(M(12.1), 2637, .2);
// coach Almog
whoosh(8.45, .55, .5, .7); tick(9.25, 1318, .12); tick(9.35, 1760, .1);
whoosh(10.3, .35, .55, -.7);
// MMA + coach Geva
[11.0, 11.25, 11.5, 11.75].forEach((t, i) => { kick(t, .75, 9, 150, 45); snare(t, .35); whoosh(t - .12, .14, .18, i % 2 ? .4 : -.4); });
boom(12.0, 1.1); whoosh(12.3, .4, .35, .5); tick(12.6, 1318, .12);
whoosh(13.4, .35, .55, -.7);
// champions
tick(M(19.1), 1046, .18); tick(M(19.6), 1568, .2);
[20.3, 20.7].forEach(st => kick(M(st), .7, 5, 120, 40)); boom(M(21.1), .8); tick(M(21.1), 2093, .18);
whoosh(M(21.5), .4, .25, .5);
whoosh(17.1, .45, .45);
// next champion + end card
[27.1, 27.35, 27.6, 27.85].forEach(st => kick(M(st), .45, 8, 120, 40));
tick(M(29.8), 1318, .15);
for (let i = 0; i < 12; i++) tick(M(30.15 + i * .05), 2200 + i * 60, .04);

// ---------- echo on the music bus (ping-pong, dotted 8th) ----------
{
  const d = Math.round(.375 * SR), fb = .32, wet = .28;
  const eL = new Float32Array(N), eR = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const inL = ML[i], inR = MR[i];
    const dl = i >= d ? eR[i - d] : 0, dr = i >= d ? eL[i - d] : 0;
    eL[i] = inL * .5 + dl * fb; eR[i] = inR * .5 + dr * fb;
    L[i] = L[i] * .75 + (inL + eL[i] * wet) * 3.2; R[i] = R[i] * .75 + (inR + eR[i] * wet) * 3.2;
  }
}

// ---------- master: soft clip, normalize, fade, write WAV ----------
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * .85); R[i] = Math.tanh(R[i] * .85); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const gain = .89 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const f = Math.min(1, (N - i) / (SR * 1.5));
  buf.writeInt16LE(Math.round(L[i] * gain * f * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * gain * f * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(dir, 'out', 'audio.wav'), buf);
console.log('audio.wav written, peak', peak.toFixed(3));
