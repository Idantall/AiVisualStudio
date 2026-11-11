"""Synthesizes the 5-second audio sting for the intro (riser -> impact -> chord).

Usage: python3 make-audio.py out.wav
Timings mirror the animation in index.html (impact at 1.05s).
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 5.0
IMPACT = 1.05

t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(7)


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be a scalar or per-sample array (Hz)."""
    a = 1 - np.exp(-2 * np.pi * np.broadcast_to(cutoff, x.shape) / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def env_after(start, decay):
    return np.where(t >= start, np.exp(-(t - start) / decay), 0.0)


# Riser: noise that opens up and swells into the impact.
rp = np.clip(t / IMPACT, 0, 1)
riser = lowpass(rng.standard_normal(len(t)), 300 + 5000 * rp**2) * rp**2.5
riser *= (t < IMPACT) * 0.5

# Impact: pitched-down sub kick plus a short noise crack.
ti = np.clip(t - IMPACT, 0, None)
kick_phase = 2 * np.pi * (45 * ti + (150 - 45) * 0.06 * (1 - np.exp(-ti / 0.06)))
kick = np.sin(kick_phase) * env_after(IMPACT, 0.38) * 0.95
crack = lowpass(rng.standard_normal(len(t)), 2500) * env_after(IMPACT, 0.05) * 0.6

# Chord: A power chord with slow decay, slightly detuned saws for width.
def saw(freq, detune):
    return 2 * ((t * freq * detune) % 1) - 1

chord_l = sum(saw(f, 1.003) for f in (110.0, 164.81, 220.0))
chord_r = sum(saw(f, 0.997) for f in (110.0, 164.81, 220.0))
chord_env = env_after(IMPACT, 1.6) * (1 - np.exp(-ti / 0.01))
cut = 400 + 2600 * env_after(IMPACT, 0.9)
chord_l = lowpass(chord_l, cut) * chord_env * 0.16
chord_r = lowpass(chord_r, cut) * chord_env * 0.16

# Light ticks on the two title words and the name slab.
ticks = np.zeros_like(t)
for when, freq in ((1.2, 880.0), (1.36, 880.0), (1.9, 1318.5)):
    ticks += np.sin(2 * np.pi * freq * (t - when)) * env_after(when, 0.045) * 0.10

mono = riser + kick + crack + ticks
left = mono + chord_l
right = mono + chord_r

fade = np.clip((DUR - t) / 0.7, 0, 1) * np.clip(t / 0.02, 0, 1)
stereo = np.stack([left, right], axis=1) * fade[:, None]
stereo = np.tanh(stereo * 1.2)
stereo *= 0.89 / np.max(np.abs(stereo))

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
