"""Synthesize the music bed and sound effects for the clay story video.
Everything is generated from scratch (no samples), so it is royalty-free.
Timings (seconds) match src/ClayStory.tsx.
Usage: python3 scripts/make_clay_audio.py  -> public/clay/music.wav, public/clay/sfx.wav
"""
import numpy as np, wave, os

SR = 44100
DUR = 22.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'clay')

def t_(d): return np.arange(int(SR * d)) / SR
def note(n): return 440.0 * 2 ** ((n - 69) / 12)          # MIDI -> Hz
def place(buf, at, sig, gain=1.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if i < len(buf): buf[i:j] += sig[: j - i] * gain
def lowpass(x, a):                                          # one-pole, a in (0,1]
    y = np.empty_like(x); acc = 0.0
    for k, v in enumerate(x):
        acc += a * (v - acc); y[k] = acc
    return y
def env(n, a=0.005, d=0.3, total=None):
    tt = t_(total) if total else t_(n)
    e = np.minimum(1, tt / a) * np.exp(-tt / d)
    return e

# ---------------- instruments ----------------
def marimba(f, d=0.45, vib=0.0):
    tt = t_(d); ph = 2*np.pi*f*tt + vib*np.sin(2*np.pi*5.5*tt)
    s = np.sin(ph) + 0.35*np.sin(4*ph)*np.exp(-tt*30) + 0.12*np.sin(10*ph)*np.exp(-tt*60)
    return s * np.minimum(1, tt/0.003) * np.exp(-tt*7)
def bass(f, d=0.4):
    tt = t_(d); tri = 2*np.abs(2*((f*tt) % 1) - 1) - 1
    return (0.8*tri + 0.4*np.sin(2*np.pi*f*tt)) * np.minimum(1, tt/0.01) * np.exp(-tt*4)
def kick():
    tt = t_(0.35); f = 45 + 95*np.exp(-tt*28)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-tt*9)
def snare():
    tt = t_(0.22); n = rng.uniform(-1, 1, len(tt))
    return (0.7*n*np.exp(-tt*22) + 0.4*np.sin(2*np.pi*190*tt)*np.exp(-tt*30))
def hat(d=0.05):
    tt = t_(d); n = rng.uniform(-1, 1, len(tt)); n = n - lowpass(n, 0.35)
    return n * np.exp(-tt*70)
def clap():
    s = np.zeros(int(SR*0.25))
    for k, off in enumerate([0, 0.012, 0.024]):
        place(s, off, snare()[:int(SR*0.2)] * (0.6 if k < 2 else 1))
    return s
def trombone(f0, f1, d, vib=0.0):
    tt = t_(d); f = np.linspace(f0, f1, len(tt)) * (1 + vib*np.sin(2*np.pi*6*tt)*np.minimum(1, tt/0.4))
    ph = 2*np.pi*np.cumsum(f)/SR; saw = 2*((ph/(2*np.pi)) % 1) - 1
    s = lowpass(saw, 0.08) * 2.2
    return s * np.minimum(1, tt/0.04) * np.minimum(1, (d - tt)/0.08)

music = np.zeros(N)
CHORDS = {'C': [48, 60, 64, 67], 'Am': [45, 57, 60, 64], 'F': [41, 53, 57, 60], 'G': [43, 55, 59, 62]}

# 0.0-4.0  lazy, heat-hazy groove (half-time, wobbly pitch)
beat = 60/92
lazy_mel = [72, None, 76, 74, None, 72, 69, None, 67, None, 69, 72, None, 71, None, None]
for i, n in enumerate(lazy_mel):
    at = i * beat/2
    if at > 4.0: break
    if n: place(music, at, marimba(note(n), 0.6, vib=0.9), 0.32)
for i, ch in enumerate(['C', 'Am', 'F']):
    at = i * beat*2
    if at < 4.0:
        place(music, at, bass(note(CHORDS[ch][0]), 1.0), 0.45)
        place(music, at + beat, bass(note(CHORDS[ch][0] + 7), 0.5), 0.3)
# tape-stop at 4.0: resample the last 0.6s with falling speed
i0 = int(3.6*SR); seg = music[i0:int(4.2*SR)].copy()
spd = np.linspace(1.0, 0.05, len(seg)); idx = np.clip(np.cumsum(spd).astype(int), 0, len(seg)-1)
music[i0:int(4.2*SR)] = seg[idx] * np.linspace(1, 0, len(seg))
music[int(4.2*SR):int(5.0*SR)] = 0

# 5.0-7.6 sad trombone "wah wah wah waaah"
for at, a, b, d, v in [(5.0, 196, 194, 0.42, 0), (5.5, 185, 183, 0.42, 0), (6.0, 175, 173, 0.42, 0), (6.5, 165, 160, 1.1, 0.035)]:
    place(music, at, trombone(a, b, d, v), 0.24)

# 8.0-10.5 tension: soft ticking hats + pizzicato
for k in range(12):
    at = 8.0 + k*0.21
    place(music, at, hat(0.04), 0.22 if k % 2 else 0.12)
for k, n in enumerate([60, 62, 63, 65, 67]):
    place(music, 8.6 + k*0.38, marimba(note(n), 0.3), 0.18)

# 10.6-19.3 the upbeat rescue groove (116 bpm, C-Am-F-G)
bpm = 116; b = 60/bpm; start = 10.6; end = 19.3
mel = [79, 76, 79, 81, 79, 76, 74, 76,  76, 72, 76, 77, 76, 72, 69, 72,
       77, 74, 77, 79, 77, 74, 72, 74,  74, 71, 74, 76, 79, 77, 76, 74]
step = 0; at = start
while at < end - 0.05:
    bar = int((at - start) // (4*b)); ch = ['C', 'Am', 'F', 'G'][bar % 4]
    beat_in_bar = ((at - start) / b) % 4
    eighth = step % 2 == 0
    if eighth:
        bi = int(round(beat_in_bar)) % 4
        if bi in (0, 2): place(music, at, kick(), 0.85)
        if bi in (1, 3): place(music, at, clap(), 0.35); place(music, at, snare(), 0.25)
        if bi in (0, 2): place(music, at, bass(note(CHORDS[ch][0]), b*0.9), 0.5)
        if bi in (1, 3): place(music, at + b/2, bass(note(CHORDS[ch][0] + 12), b*0.4), 0.3)
    place(music, at, hat(), 0.16 if eighth else 0.1)
    n = mel[step % len(mel)]
    place(music, at, marimba(note(n), 0.35), 0.3)
    if eighth and int(round(beat_in_bar)) % 2 == 0:
        for cn in CHORDS[ch][1:]:
            place(music, at, marimba(note(cn), 0.5), 0.07)
    step += 1; at = start + step * b/2
# little fill into the end card
for k, n in enumerate([72, 74, 76, 79]):
    place(music, 18.9 + k*0.1, marimba(note(n), 0.25), 0.3)

# 19.3-22 end sting: big C chord + bell sparkle
for n in [48, 60, 64, 67, 72, 76]:
    place(music, 19.35, marimba(note(n), 2.4) * np.exp(t_(2.4)*5.5), 0.16)  # undo marimba's fast decay -> ~1.5s ring
place(music, 19.35, kick(), 0.9)
for k, n in enumerate([84, 88, 91, 96]):
    place(music, 19.45 + k*0.07, marimba(note(n), 0.8), 0.12)

# ---------------- sound effects ----------------
sfx = np.zeros(N)
def sweep(f0, f1, d, shape='sine', decay=3.0):
    tt = t_(d); f = f0 * (f1/f0) ** (tt/d)
    ph = 2*np.pi*np.cumsum(f)/SR
    s = np.sin(ph) if shape == 'sine' else np.sign(np.sin(ph))*0.5
    return s * np.minimum(1, tt/0.005) * np.exp(-tt*decay)
def boing(f=220, d=0.5):
    tt = t_(d); f_ = f*(1 + 0.6*np.exp(-tt*6)*np.sin(2*np.pi*14*tt))
    return np.sin(2*np.pi*np.cumsum(f_)/SR) * np.exp(-tt*5)
def noise_burst(d, a, decay):
    tt = t_(d); n = rng.uniform(-1, 1, len(tt))
    return lowpass(n, a) * np.minimum(1, tt/0.01) * np.exp(-tt*decay)
def whoosh(d=0.8):
    tt = t_(d); n = rng.uniform(-1, 1, len(tt)); out = np.zeros_like(n); acc = 0
    for k in range(len(n)):
        a = 0.02 + 0.25*np.sin(np.pi*k/len(n)); acc += a*(n[k]-acc); out[k] = acc
    return out * np.sin(np.pi*tt/d) * 2.2
def ring():
    tt = t_(0.7); s = (np.sin(2*np.pi*440*tt) + np.sin(2*np.pi*480*tt)) * (np.sin(2*np.pi*20*tt) > 0)
    return s * 0.5 * np.minimum(1, (0.7-tt)/0.02)
def ding(f=1318.5):
    tt = t_(1.2); return (np.sin(2*np.pi*f*tt) + 0.4*np.sin(2*np.pi*2.76*f*tt)*np.exp(-tt*6)) * np.exp(-tt*3)
def horn():
    tt = t_(0.16); s = np.sign(np.sin(2*np.pi*392*tt)) + np.sign(np.sin(2*np.pi*494*tt))
    return lowpass(s*0.4, 0.3) * np.minimum(1, (0.16-tt)/0.02)
def click():
    tt = t_(0.03); return rng.uniform(-1, 1, len(tt)) * np.exp(-tt*200)
def squeak(): return sweep(900, 1700, 0.18, decay=4) * 0.8

place(sfx, 0.25, boing(330, 0.6), 0.35)                     # sun pops in
place(sfx, 0.9, sweep(300, 1400, 1.9, decay=0.4), 0.18)       # thermometer rising
place(sfx, 2.85, sweep(180, 60, 0.9, decay=2.5), 0.5)         # melting "bloooop"
place(sfx, 3.2, noise_burst(0.35, 0.05, 9), 0.6)             # squish
for at in (4.2, 4.55, 4.9):                                   # AC coughs
    place(sfx, at, noise_burst(0.22, 0.12, 14), 0.75); place(sfx, at, sweep(140, 90, 0.2, decay=10), 0.4)
place(sfx, 5.15, noise_burst(0.9, 0.03, 2.5), 0.45)          # pfffff deflate
place(sfx, 5.3, sweep(600, 150, 0.8, decay=2), 0.18)
place(sfx, 6.15, noise_burst(1.2, 0.5, 2.0) * 0.6, 0.25)       # ice cube sizzle
place(sfx, 6.2, sweep(1400, 500, 0.12, decay=20), 0.35)       # plip
place(sfx, 7.0, sweep(1300, 450, 0.12, decay=20), 0.3)
place(sfx, 8.1, ring(), 0.32); place(sfx, 8.95, ring(), 0.32)  # phone
place(sfx, 9.75, ding(), 0.35)                                 # number pops
place(sfx, 10.55, whoosh(0.9), 0.75)                           # van zooms in
place(sfx, 11.45, horn(), 0.45); place(sfx, 11.68, horn(), 0.45)
place(sfx, 11.85, boing(260, 0.45), 0.4)                       # technician pops out
place(sfx, 12.35, sweep(200, 50, 0.3, decay=9)*1.5, 0.5)       # old AC thud
place(sfx, 12.4, noise_burst(0.2, 0.08, 18), 0.6)
for k in range(9): place(sfx, 12.8 + k*0.11, click(), 0.5)     # ratchet
place(sfx, 13.9, sweep(500, 900, 0.15, decay=8), 0.25)
for k, f in enumerate([1568, 1976, 2349, 3136]):               # sparkle
    place(sfx, 14.2 + k*0.06, ding(f), 0.14)
place(sfx, 14.9, whoosh(1.6) * 0.6, 0.6)                       # cool breeze
place(sfx, 15.4, sweep(150, 520, 0.35, decay=3), 0.45)         # reform boing
place(sfx, 15.7, boing(392, 0.4), 0.35)
place(sfx, 16.6, squeak(), 0.35); place(sfx, 17.0, squeak(), 0.3)  # penguin
place(sfx, 17.6, sweep(500, 380, 0.5, decay=2), 0.2)           # sun "hmph"
place(sfx, 19.3, whoosh(0.6), 0.5)                             # plaque drops
place(sfx, 19.75, boing(196, 0.5), 0.35)

def write(name, x, peak):
    x = np.tanh(x * 1.1); x = x / max(1e-9, np.max(np.abs(x))) * peak
    fade = int(0.6*SR); x[-fade:] *= np.linspace(1, 0, fade)
    pcm = (x * 32767).astype('<i2')
    with wave.open(os.path.join(out_dir, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

os.makedirs(out_dir, exist_ok=True)
write('music.wav', music, 0.8)
write('sfx.wav', sfx, 0.9)
print('ok', N / SR, 's')
