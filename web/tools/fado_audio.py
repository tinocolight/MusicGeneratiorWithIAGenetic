"""Dynamics of the voice in fado recordings: what the dynamics of src/core/expression.js should
copy (results/fado.md, "Dinâmica").

A fado is usually one voice with a Portuguese guitar and a classical guitar (viola). The guitars
are plucked: each note starts loud and dies away (tens of dB per second), and they fill the
breaths between the verses. The voice sustains. So the voice is followed by its pitch (pYIN,
librosa), its loudness is measured as the energy of the harmonics of that pitch (partials 1 to 8,
±40 cents), and a sound of continuous pitch counts as voice only if that energy does not die
away like a plucked string (faster than 25 dB/s over the sound) and it lasts 0.1 s or more. This is the
compromise the accompaniment forces: where a guitar doubles the voice, it adds to it, and a
note the singer lets die quickly may be taken for a guitar.

Measures, for each verse (a voiced stretch between two breaths of 0.3 s or more, at least 1 s):
  start_db, end_db   loudness of the first and the last 30 % of the verse
  slope_db_s         linear trend of the loudness over the verse (dB per second)
  apex_db            loudness at the highest note, relative to the verse median
  held_s, fade_db    the held note that ends the verse (pitch steady within ±0.8 semitone for
                     0.4 s or more) and how much it fades, first quarter against last quarter
  vib_hz, vib_st     vibrato of the notes held 0.8 s or more: rate and extent (half the 5–95 %
                     spread of the pitch around its own slow trend, in semitones)
  accents            moments 4 dB or more above the verse's trend
and for the whole recording, the loudness of each verse in order (does the last part grow?).

Usage:
  python3 web/tools/fado_audio.py FILE [FILE ...] [--start S] [--dur D] [--csv results/fado/audio.csv]
      any format ffmpeg reads (the ffmpeg binary of the imageio-ffmpeg package)
  python3 web/tools/fado_audio.py --selftest
      a synthetic voice (with known dynamics and vibrato) over plucked strings, to check that
      the measures find what was put in
Needs: pip install librosa soundfile imageio-ffmpeg
"""
import csv
import os
import subprocess
import sys

import numpy as np

SR = 22050
HOP = 256
NFFT = 2048


def load(path, start=0.0, dur=None):
    import imageio_ffmpeg
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'quiet', '-ss', str(start)]
    if dur:
        cmd += ['-t', str(dur)]
    cmd += ['-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def voice_track(y):
    """Per frame: f0 (Hz, nan where it is not the voice), the unsmoothed YIN pitch there, and the
    loudness of the f0's harmonics (dB)."""
    import librosa
    f0, voiced, prob = librosa.pyin(y, fmin=70, fmax=900, sr=SR, frame_length=NFFT, hop_length=HOP)
    # octave errors: when the voice fades, the tracker may jump an octave (or two) away from the
    # note it was following; bring such frames back next to the previous ones
    prev = None
    for t in range(len(f0)):
        if not voiced[t] or np.isnan(f0[t]):
            continue
        if prev is not None:
            d = 12 * np.log2(f0[t] / prev)
            k = round(d / 12)
            if k and abs(d - 12 * k) < 0.8:
                f0[t] = f0[t] / 2 ** k
        prev = f0[t]
    S = np.abs(librosa.stft(y, n_fft=NFFT, hop_length=HOP))
    freqs = librosa.fft_frequencies(sr=SR, n_fft=NFFT)
    n = min(S.shape[1], len(f0))
    loud = np.full(n, np.nan)
    for t in range(n):
        if not voiced[t] or np.isnan(f0[t]):
            continue
        e = 0.0
        for h in range(1, 9):
            fc = h * f0[t]
            if fc > SR / 2 - 100:
                break
            lo, hi = fc * 2 ** (-40 / 1200), fc * 2 ** (40 / 1200)
            band = S[(freqs >= lo) & (freqs <= hi), t]
            # what sounds around the harmonic (the guitars' partials and their leakage) is taken off
            ring = S[((freqs >= fc * 2 ** (-200 / 1200)) & (freqs < fc * 2 ** (-60 / 1200))) | ((freqs > fc * 2 ** (60 / 1200)) & (freqs <= fc * 2 ** (200 / 1200))), t]
            if band.size:
                bg = float(np.median(ring)) if ring.size else 0.0
                e += max(0.0, float(band.max()) ** 2 - bg ** 2)
        loud[t] = 10 * np.log10(e + 1e-12)
    f0 = f0[:n].copy()
    f0[~voiced[:n]] = np.nan
    # ignore the faint voiced frames (reverberation, a guitar note mistaken for the voice)
    if np.isfinite(loud).any():
        floor = np.nanpercentile(loud, 90) - 35
        weak = ~(loud > floor)
        loud[weak] = np.nan
        f0[weak] = np.nan
    # a plucked string dies away fast; the voice sustains. Each sound of continuous pitch (no
    # jump of more than 0.6 semitone between frames) is judged as a whole: it is a guitar note if
    # its harmonic energy falls faster than 25 dB/s over its length, or if it lasts under 0.1 s
    fps = SR / HOP
    midi = 69 + 12 * np.log2(np.where(np.isfinite(f0), f0, 1.0) / 440.0)
    ok = np.isfinite(loud) & np.isfinite(f0)
    keep = np.zeros(n, dtype=bool)
    t = 0
    while t < n:
        if not ok[t]:
            t += 1
            continue
        u = t + 1
        while u < n and ok[u] and abs(midi[u] - midi[u - 1]) <= 0.6:
            u += 1
        if (u - t) / fps >= 0.1:
            # the trend of the middle of the sound: the attack and the release of a sung note are
            # steep too, a plucked note decays all along
            m = u - t
            a0, a1 = t + m // 5, u - m // 5
            tt = np.arange(a1 - a0) / fps
            slope = np.polyfit(tt, loud[a0:a1], 1)[0] if a1 - a0 >= 3 else 0.0
            if slope >= -25:
                keep[t:u] = True
        t = u
    # what is left in the breaths are guitar notes that ring on (or are plucked again at the same
    # pitch): in a mix they sit well below the voice, so a sound whose median level is 15 dB
    # under the voice's usual level (P75 of what is kept) is not the voice
    if keep.any():
        ref = np.nanpercentile(loud[keep], 75)
        t = 0
        while t < n:
            if not keep[t]:
                t += 1
                continue
            u = t + 1
            while u < n and keep[u] and abs(midi[u] - midi[u - 1]) <= 0.6:
                u += 1
            if np.nanmedian(loud[t:u]) < ref - 15:
                keep[t:u] = False
            t = u
    loud[~keep] = np.nan
    f0[~keep] = np.nan
    # pYIN smooths the pitch (its HMM), which flattens the vibrato: the vibrato is measured on
    # the frame-by-frame YIN pitch instead
    # (with a 46 ms window: the 93 ms of the other analyses is half a vibrato cycle and blurs it)
    raw = librosa.yin(y, fmin=70, fmax=900, sr=SR, frame_length=1024, hop_length=HOP, center=True)[:n]
    raw = np.where(np.isfinite(f0), raw, np.nan)
    return f0, raw, smooth(loud, 5)


def smooth(x, k):
    out = x.copy()
    for i in range(len(x)):
        w = x[max(0, i - k // 2): i + k // 2 + 1]
        w = w[np.isfinite(w)]
        if np.isfinite(x[i]) and w.size:
            out[i] = w.mean()
    return out


def segments(mask, gap, min_len):
    """Runs of True frames, merged across gaps shorter than `gap` frames, at least `min_len` long."""
    runs = []
    i = 0
    n = len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            runs.append([i, j])
            i = j
        else:
            i += 1
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < gap:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [r for r in merged if r[1] - r[0] >= min_len]


def held_notes(midi, a, b, fps):
    """Stretches of the verse [a, b) where the pitch stays within ±0.8 semitone for 0.4 s or more."""
    out = []
    i = a
    while i < b:
        if not np.isfinite(midi[i]):
            i += 1
            continue
        j = i
        ref = midi[i]
        vals = []
        last = i
        # a gap of up to 4 frames (a frame the tracker missed) does not end the note
        while j < b and (not np.isfinite(midi[j]) and j - last <= 4 or np.isfinite(midi[j]) and abs(midi[j] - np.median(vals or [ref])) <= 0.8):
            if np.isfinite(midi[j]):
                vals.append(midi[j])
                last = j
            j += 1
        j = last + 1
        if (j - i) / fps >= 0.4:
            out.append((i, j))
            i = j
        else:
            i += 1
    return out


def vibrato(midi, a, b, fps):
    """Rate (Hz) and extent (semitones) of the pitch around its slow trend, or (nan, nan)."""
    x = midi[a:b].copy()
    if len(x) < int(0.4 * fps) or np.isnan(x).mean() > 0.2:
        return np.nan, np.nan
    bad = np.isnan(x)
    if bad.any():
        x[bad] = np.interp(np.flatnonzero(bad), np.flatnonzero(~bad), x[~bad])
    k = max(3, int(0.25 * fps))
    trend = np.convolve(x, np.ones(k) / k, mode='same')
    d = (x - trend)[k // 2: len(x) - k // 2]
    if len(d) < 8:
        return np.nan, np.nan
    d = d - d.mean()
    ac = np.correlate(d, d, mode='full')[len(d) - 1:]
    lags = np.arange(len(ac)) / fps
    ok = (lags >= 1 / 9) & (lags <= 1 / 3.5)
    if not ok.any() or ac[0] <= 0:
        return np.nan, np.nan
    lag = lags[ok][np.argmax(ac[ok])]
    rate = 1 / lag if ac[ok].max() > 0.2 * ac[0] else np.nan
    extent = (np.percentile(d, 95) - np.percentile(d, 5)) / 2
    return rate, extent


def analyse(y, name):
    f0, raw, loud = voice_track(y)
    fps = SR / HOP
    midi = 69 + 12 * np.log2(f0 / 440.0)
    rawm = 69 + 12 * np.log2(raw / 440.0)
    rawm = np.where(np.abs(rawm - midi) < 0.8, rawm, midi)  # YIN's own octave slips: keep pYIN there
    voiced = np.isfinite(loud)
    verses = segments(voiced, gap=int(0.3 * fps), min_len=int(1.0 * fps))
    rows = []
    for k, (a, b) in enumerate(verses):
        L = loud[a:b]
        t = np.arange(b - a) / fps
        ok = np.isfinite(L)
        if ok.sum() < 10:
            continue
        slope, icpt = np.polyfit(t[ok], L[ok], 1)
        m30 = max(1, int(0.3 * (b - a)))
        start_db = np.nanmean(L[:m30])
        end_db = np.nanmean(L[-m30:])
        med = np.nanmedian(L)
        mm = midi[a:b]
        apex = int(np.nanargmax(np.where(np.isfinite(mm), mm, -np.inf)))
        apex_db = np.nanmean(L[max(0, apex - 3): apex + 4]) - med
        notes = held_notes(midi, a, b, fps)
        held_s = fade_db = np.nan
        if notes and b - notes[-1][1] <= int(0.25 * fps):
            ha, hb = notes[-1]
            q = max(1, (hb - ha) // 4)
            held_s = (hb - ha) / fps
            fade_db = np.nanmean(loud[ha: ha + q]) - np.nanmean(loud[hb - q: hb])
        # vibrato on the long notes only (0.8 s or more): short notes have little time for it
        vibs = [vibrato(rawm, ha, hb, fps) for ha, hb in notes if (hb - ha) / fps >= 0.8]
        rates = [r for r, e in vibs if np.isfinite(r)]
        exts = [e for r, e in vibs if np.isfinite(e)]
        resid = L - (slope * t + icpt)
        acc = segments(np.nan_to_num(resid, nan=-99) >= 4, gap=int(0.1 * fps), min_len=2)
        rows.append({
            'file': name, 'verse': k + 1, 'start_s': round(a / fps, 2), 'dur_s': round((b - a) / fps, 2),
            'level_db': round(float(med), 2), 'start_db': round(float(start_db - med), 2), 'end_db': round(float(end_db - med), 2),
            'slope_db_s': round(float(slope), 3), 'apex_db': round(float(apex_db), 2),
            'held_s': round(float(held_s), 2) if np.isfinite(held_s) else '', 'fade_db': round(float(fade_db), 2) if np.isfinite(fade_db) else '',
            'vib_hz': round(float(np.median(rates)), 2) if rates else '', 'vib_st': round(float(np.median(exts)), 3) if exts else '',
            'accents': len(acc),
        })
    return rows


def summary(rows):
    def col(k):
        v = [r[k] for r in rows if r[k] != '']
        return np.array(v, dtype=float)
    out = {}
    for k in ['dur_s', 'start_db', 'end_db', 'slope_db_s', 'apex_db', 'held_s', 'fade_db', 'vib_hz', 'vib_st', 'accents']:
        v = col(k)
        out[k] = (float(np.median(v)) if v.size else np.nan, int(v.size))
    lv = col('level_db')
    if lv.size >= 4:
        q = max(1, lv.size // 4)
        out['last_part_db'] = (float(lv[-q:].mean() - lv[:-q].mean()), int(lv.size))
    out['start_minus_end_db'] = (float(np.median(col('start_db') - col('end_db'))) if rows else np.nan, len(rows))
    return out


def selftest(guitar=0.12):
    """A voice with known dynamics over plucked strings; the measures should find them."""
    rng = np.random.default_rng(3)
    y = np.zeros(int(SR * 40), dtype=np.float64)
    t0 = 0.5
    truth = []
    for verse in range(6):
        notes = [(64, 0.35), (67, 0.35), (69, 0.5), (71, 0.35), (69, 0.35), (67, 1.6)]
        if verse == 4:
            notes[3] = (76, 0.6)  # the apex
        dur = sum(d for _, d in notes)
        t = t0
        for i, (p, d) in enumerate(notes):
            n = int(d * SR)
            tt = np.arange(n) / SR
            held = i == len(notes) - 1
            vib = 0.35 * np.sin(2 * np.pi * 5.6 * tt) * np.minimum(1, tt / 0.25) if held else 0
            f = 440 * 2 ** ((p - 69 + vib) / 12) * np.ones(n)
            ph = 2 * np.pi * np.cumsum(f) / SR
            # the verse starts strong and dies away: -8 dB over it, and the held note fades 9 dB more
            pos = (t - t0 + tt) / dur
            db = -8 * pos - (9 * tt / d if held else 0) + (6 if (verse == 4 and i == 3) else 0)
            amp = 10 ** (db / 20)
            env = np.minimum(1, tt / 0.03) * np.minimum(1, (d - tt) / 0.03)
            tone = sum(np.sin(h * ph) / h for h in range(1, 9))
            s = int(t * SR)
            y[s: s + n] += 0.25 * amp * env * tone
            t += d
        truth.append(dur)
        t0 = t + 0.6
    # the guitars: plucked notes (fast decay) all along, louder in the breaths
    y = y[: int((t0 + 0.5) * SR)]
    for k in range(int(len(y) / SR / 0.25)):
        s = int(k * 0.25 * SR)
        n = int(0.6 * SR)
        tt = np.arange(n) / SR
        p = rng.choice([52, 55, 59, 64, 47])
        f = 440 * 2 ** ((p - 69) / 12)
        pluck = guitar * np.exp(-tt / 0.15) * sum(np.sin(2 * np.pi * h * f * tt) / h ** 1.5 for h in range(1, 6))
        m = min(n, len(y) - s)
        y[s: s + m] += pluck[:m]
    rows = analyse(y.astype(np.float32), 'selftest')
    s = summary(rows)
    print(f'guitar at {guitar} (voice peak 0.25): verses found:', len(rows), '(6 sung)')
    for k, (v, n) in s.items():
        print(f'  {k:20s} {v:7.2f}  (n={n})')
    print('put in: verses of 3.5 s (the 5th 3.75 s) falling 8 dB, a held note of 1.6 s fading 9 dB more'
          ' (start - end about 10 dB, slope about -4 dB/s), vibrato 5.6 Hz of 0.35 semitone, an apex 6 dB'
          ' louder in one verse')
    return rows


def main():
    args = sys.argv[1:]
    if '--selftest' in args:
        for g in (0.04, 0.12):
            selftest(g)
        return
    start = float(args[args.index('--start') + 1]) if '--start' in args else 0.0
    dur = float(args[args.index('--dur') + 1]) if '--dur' in args else None
    out = args[args.index('--csv') + 1] if '--csv' in args else os.path.join(os.path.dirname(__file__), '..', 'results', 'fado', 'audio.csv')
    files = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--start', '--dur', '--csv'))]
    rows = []
    for f in files:
        r = analyse(load(f, start, dur), os.path.basename(f))
        rows += r
        print(f'== {os.path.basename(f)}: {len(r)} verses')
        for k, (v, n) in summary(r).items():
            print(f'  {k:20s} {v:7.2f}  (n={n})')
    if rows:
        with open(out, 'w', newline='', encoding='utf-8-sig') as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        print(out)


if __name__ == '__main__':
    main()
