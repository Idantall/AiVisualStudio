"""Generates out/music.wav: a calm 25s piano-arpeggio + pad bed in D major, 72 BPM.

Usage: python3 music.py
"""
import wave
import numpy as np

SR = 44100
T = 25.0
BPM = 72
BEAT = 60 / BPM
BAR = 4 * BEAT
t = np.arange(int(SR * T)) / SR


def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


# one chord per bar: Dmaj9, Bm9, Gmaj7, A6sus, Dmaj9, Bm9, Gmaj7, D (final, rings out)
CHORDS = [
    [38, 62, 66, 69, 73, 76],
    [35, 59, 62, 66, 69, 73],
    [31, 59, 62, 66, 67, 71],
    [33, 57, 62, 64, 66, 69],
    [38, 62, 66, 69, 73, 76],
    [35, 59, 62, 66, 69, 73],
    [31, 59, 62, 66, 67, 71],
    [38, 62, 66, 69, 74, 78],
]
# eighth-note arpeggio pattern (indices into chord[1:])
PATTERN = [0, 2, 4, 3, 1, 3, 2, 4]


def piano(f, dur, vel):
    """Soft felt-piano tone: few harmonics, quick attack, two-stage decay."""
    n = int(SR * dur)
    x = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * f * x)
            + 0.35 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 3)
            + 0.12 * np.sin(2 * np.pi * 3 * f * x) * np.exp(-x * 5))
    env = (1 - np.exp(-x * 220)) * (0.55 * np.exp(-x * 1.2) + 0.45 * np.exp(-x * 4))
    env *= np.clip((dur - x) / 0.25, 0, 1)  # release, avoids a click when the note is cut
    return vel * tone * env


def add(buf, start, sig):
    i = int(start * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


keys = np.zeros_like(t)
pad = np.zeros_like(t)
bass = np.zeros_like(t)

for b, ch in enumerate(CHORDS):
    t0 = b * BAR
    last = b == len(CHORDS) - 1
    # bass note, held for the bar
    add(bass, t0, piano(hz(ch[0] + 12), BAR * 1.4, 0.55))
    # arpeggio (final bar: a single gentle rolled chord)
    if last:
        for k, n in enumerate(ch[1:]):
            add(keys, t0 + k * 0.09, piano(hz(n), 5.0, 0.32))
    else:
        for s, idx in enumerate(PATTERN):
            vel = 0.30 if s % 2 == 0 else 0.22
            add(keys, t0 + s * BEAT / 2, piano(hz(ch[1:][idx]), 2.2, vel))
    # warm pad: detuned sines with slow swell, crossfading between bars
    a, z = t0 - 0.8, t0 + BAR + 1.2
    env = np.clip((t - a) / 1.6, 0, 1) * np.clip((z - t) / 1.6, 0, 1)
    env = np.sin(env * np.pi / 2) ** 2
    for k, n in enumerate(ch[1:4]):
        f = hz(n - 12)
        pad += 0.06 * env * (np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.004 * t + k))

# airy shimmer on the logo reveal and the end card
for st, n in [(0.4, 86), (22.4, 86)]:
    add(keys, st, 0.18 * piano(hz(n), 4.0, 1.0))

mix = keys + 0.8 * pad + 0.5 * bass


def reverb(x):
    """Small Schroeder-style reverb: parallel feedback combs + allpass."""
    out = np.zeros_like(x)
    for d, g in [(0.0297, .80), (0.0371, .78), (0.0411, .76), (0.0437, .74)]:
        k = int(d * SR)
        y = x.copy()
        for i in range(k, len(y), k):  # block feedback, vectorised per delay length
            y[i:i + k] += g * y[i - k:i - k + len(y[i:i + k])]
        out += y
    out /= 4
    k = int(0.005 * SR)
    ap = out.copy()
    ap[k:] += -0.5 * out[:-k]
    return ap


wet = reverb(mix)
left = 0.65 * mix + 0.45 * wet
right = 0.65 * mix + 0.45 * np.roll(wet, int(0.011 * SR))

fade = np.clip(t / 1.0, 0, 1) * np.clip((T - t) / 2.5, 0, 1)
st = np.stack([left * fade, right * fade], 1)
st /= np.abs(st).max() / 0.7

with wave.open('out/music.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('wrote out/music.wav')
