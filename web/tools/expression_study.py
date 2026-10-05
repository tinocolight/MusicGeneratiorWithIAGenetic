"""Timing and dynamics of real performances, to set the profiles of src/core/expression.js
(results/expressao.md).

The ASAP dataset (Foscarin et al., ISMIR 2020; https://github.com/fosfrancesco/asap-dataset,
CC BY-NC-SA 4.0) has about 1000 piano performances (MIDI from the Maestro competition recordings)
with the beats and downbeats annotated in the performance and in the score. From the beats, the
local tempo of every beat (score time over performance time, divided by the median of the piece);
from the MIDI, the velocity of every note and where it falls in the bar. Only numbers are kept;
the dataset is not copied.

Measures, for each performance, grouped by period (baroque: Bach; classical: Haydn, Mozart,
Beethoven; romantic: the others) and for the dances (Chopin's polonaises, Liszt's Mephisto waltz):
  final ritardando   tempo of the last beat and of the last bar against the median; how many
                     beats from the end the slowing starts (the trailing beats below 0.93); the
                     curvature q of Friberg & Sundberg (1999) that fits it best, v(x) = (1 + (w^q - 1) x)^(1/q)
  phrase end         the last beat of every 4-bar group against the other beats (lengthening)
  phrase arch        tempo and loudness of the top voice along 4-bar groups, in 8 parts
  downbeat accent    velocity of the notes on the downbeat, on the other beats and off the beat
  high-loud          correlation of pitch and velocity of the top voice within 4-bar groups
  last bars          loudness of the last 2 bars and of the last note against the piece

Usage:
  python3 web/tools/expression_study.py ASAP_DIR [--csv results/expressao/asap.csv]
Needs: pip install mido numpy
"""
import ast
import csv
import json
import os
import sys
from collections import defaultdict

import numpy as np

try:
    import mido
except ImportError:  # pragma: no cover
    sys.exit('pip install mido')

PERIOD = {'Bach': 'baroque', 'Haydn': 'classical', 'Mozart': 'classical', 'Beethoven': 'classical'}
DANCES = ('Polonaises', 'Mephisto_Waltz')


def notes_of(path):
    """[(onset s, pitch, velocity)] of a MIDI performance."""
    mid = mido.MidiFile(path)
    out = []
    t = 0.0
    for msg in mid:  # merged tracks, delta times in seconds
        t += msg.time
        if msg.type == 'note_on' and msg.velocity > 0:
            out.append((t, msg.note, msg.velocity))
    return out


def fs_curve(x, w, q):
    return (1 + (w ** q - 1) * x) ** (1 / q)


def fit_ritard(v):
    """Best (q, w, error) of v(x) on the trailing ritardando v (tempo of each beat, normalised)."""
    n = len(v)
    x = (np.arange(n) + 0.5) / n
    best = None
    for q in (1, 2, 3, 4, 5):
        for w in np.linspace(0.2, 1.0, 81):
            err = float(np.mean((fs_curve(x, w, q) - v) ** 2))
            if best is None or err < best[2]:
                best = (q, float(w), err)
    return best


def study(perf, ann):
    pb = np.array(ann['performance_beats'])
    sb = np.array(ann['midi_score_beats'])
    if len(pb) != len(sb) or len(pb) < 24:
        return None
    pdb = set(np.round(ann['performance_downbeats'], 6))
    is_down = np.array([round(b, 6) in pdb for b in pb])
    ts = ast.literal_eval(ann['perf_time_signatures']) if isinstance(ann['perf_time_signatures'], str) else ann['perf_time_signatures']
    beats_per_bar = list(ts.values())[0][1] if ts else 4
    ioi_p = np.diff(pb)
    ioi_s = np.diff(sb)
    ok = (ioi_p > 0.05) & (ioi_s > 0)
    tempo = np.where(ok, ioi_s / np.maximum(ioi_p, 1e-6), np.nan)
    med = np.nanmedian(tempo)
    v = tempo / med  # one per beat (from beat i to i+1)
    res = {}
    # ---- final ritardando
    tail = v[-beats_per_bar:]
    res['last_beat_v'] = float(v[-1])
    res['last_bar_v'] = float(np.nanmean(tail))
    k = 0
    while k < len(v) and v[-1 - k] < 0.93:
        k += 1
    res['rit_beats'] = k
    res['rit_bars'] = k / beats_per_bar
    if k >= 3:
        q, w, err = fit_ritard(v[-k:])
        res['fs_q'] = q
        res['fs_w'] = w
    # ---- phrase end: the last beat of every 4-bar group (counted from the first downbeat)
    down_idx = np.flatnonzero(is_down)
    if len(down_idx) >= 9:
        ends = []
        for g in range(4, len(down_idx), 4):
            if down_idx[g] - 1 < len(v) - beats_per_bar:  # leave the final ritardando out
                ends.append(down_idx[g] - 1)
        ends = [e for e in ends if e >= 0 and not np.isnan(v[e])]
        rest = np.ones(len(v), bool)
        rest[ends] = False
        rest[-beats_per_bar:] = False
        if ends:
            res['phrase_end_ioi'] = float(np.nanmean(1 / v[ends]) / np.nanmean(1 / v[rest]))
        # tempo arch in 4-bar groups (8 parts)
        prof = np.zeros(8)
        cnt = np.zeros(8)
        for g in range(0, len(down_idx) - 4, 4):
            a, b = down_idx[g], down_idx[g + 4]
            if b > len(v) - beats_per_bar:
                break
            for i in range(a, b):
                if not np.isnan(v[i]):
                    j = min(7, int(8 * (i - a) / (b - a)))
                    prof[j] += v[i]
                    cnt[j] += 1
        if cnt.min() > 0:
            res['tempo_arch'] = (prof / cnt).tolist()
    # ---- dynamics
    notes = notes_of(perf)
    if len(notes) < 50:
        return res
    on = np.array([n[0] for n in notes])
    pitch = np.array([n[1] for n in notes])
    vel = np.array([n[2] for n in notes], float)
    inside = (on >= pb[0] - 0.05) & (on <= pb[-1] + 2)
    beatpos = np.interp(on, pb, np.arange(len(pb)))  # fractional beat index
    frac = beatpos - np.round(beatpos)
    near = np.abs(frac) < 0.08
    nearest = np.clip(np.round(beatpos).astype(int), 0, len(pb) - 1)
    down = near & is_down[nearest]
    beat = near & ~is_down[nearest]
    off = ~near
    vz = (vel - vel[inside].mean()) / (vel[inside].std() + 1e-9)
    res['vel_down'] = float(vz[inside & down].mean())
    res['vel_beat'] = float(vz[inside & beat].mean())
    res['vel_off'] = float(vz[inside & off].mean())
    res['vel_std'] = float(vel[inside].std())
    # top voice: the highest note of every onset (notes within 40 ms)
    order = np.argsort(on)
    top = []
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and on[order[j + 1]] - on[order[i]] < 0.04:
            j += 1
        grp = order[i:j + 1]
        top.append(grp[np.argmax(pitch[grp])])
        i = j + 1
    top = np.array([t for t in top if inside[t]])
    if len(top) < 30:
        return res
    # high-loud and the dynamic arch, in 4-bar groups
    corr = []
    arch = np.zeros(8)
    acnt = np.zeros(8)
    if len(down_idx) >= 9:
        for g in range(0, len(down_idx) - 4, 4):
            a, b = pb[down_idx[g]], pb[down_idx[g + 4]]
            sel = top[(on[top] >= a) & (on[top] < b)]
            if len(sel) >= 6 and pitch[sel].std() > 0 and vel[sel].std() > 0:
                corr.append(np.corrcoef(pitch[sel], vel[sel])[0, 1])
            if len(sel) >= 6:
                z = (vel[sel] - vel[sel].mean()) / (vel[sel].std() + 1e-9)
                for s, zz in zip(sel, z):
                    j = min(7, int(8 * (on[s] - a) / (b - a)))
                    arch[j] += zz
                    acnt[j] += 1
    if corr:
        res['high_loud_r'] = float(np.mean(corr))
    if acnt.min() > 0:
        res['vel_arch'] = (arch / acnt).tolist()
    # last bars and last note, against the piece (in velocity units)
    if len(down_idx) >= 3:
        last2 = top[on[top] >= pb[down_idx[-2]]]
        if len(last2):
            res['last2_vel'] = float(vel[last2].mean() - vel[top].mean())
        res['last_note_vel'] = float(vel[top[-1]] - vel[top].mean())
    # loudest stretch of the piece (8-bar windows, centre), as a fraction of the piece
    if len(down_idx) >= 16:
        cs = []
        for g in range(0, len(down_idx) - 8, 2):
            a, b = pb[down_idx[g]], pb[down_idx[g + 8]]
            sel = top[(on[top] >= a) & (on[top] < b)]
            if len(sel):
                cs.append(((a + b) / 2, vel[sel].mean()))
        if cs:
            t_max = max(cs, key=lambda c: c[1])[0]
            res['climax_at'] = float((t_max - pb[0]) / (pb[-1] - pb[0]))
    return res


def summary(rows, key):
    vals = [r[key] for r in rows if key in r and r[key] is not None and not (isinstance(r[key], float) and np.isnan(r[key]))]
    if not vals:
        return None
    a = np.array(vals, float)
    return {'n': len(a), 'p10': float(np.percentile(a, 10)), 'p50': float(np.median(a)), 'p90': float(np.percentile(a, 90)), 'mean': float(a.mean())}


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    root = args[0]
    out_csv = args[args.index('--csv') + 1] if '--csv' in args else None
    anns = json.load(open(os.path.join(root, 'asap_annotations.json')))
    groups = defaultdict(list)
    rows = []
    with open(os.path.join(root, 'metadata.csv')) as f:
        for m in csv.DictReader(f):
            key = m['midi_performance']
            ann = anns.get(key)
            if not ann or str(ann.get('score_and_performance_aligned')) != 'True':
                continue
            for k in ('performance_beats', 'midi_score_beats', 'performance_downbeats'):
                if isinstance(ann[k], str):
                    ann[k] = json.loads(ann[k])
            try:
                r = study(os.path.join(root, key), ann)
            except Exception as e:  # a broken file: skip it
                print('skip', key, e, file=sys.stderr)
                continue
            if not r:
                continue
            period = PERIOD.get(m['composer'], 'romantic')
            r.update(composer=m['composer'], piece=m['title'], period=period)
            rows.append(r)
            groups[period].append(r)
            groups['all'].append(r)
            if any(d in m['folder'] for d in DANCES):
                groups['dance'].append(r)
    keys = ['last_beat_v', 'last_bar_v', 'rit_beats', 'rit_bars', 'fs_q', 'fs_w', 'phrase_end_ioi', 'vel_down', 'vel_beat', 'vel_off', 'vel_std', 'high_loud_r', 'last2_vel', 'last_note_vel', 'climax_at']
    table = []
    for g in ('baroque', 'classical', 'romantic', 'dance', 'all'):
        rs = groups[g]
        print(f'\n== {g}: {len(rs)} performances')
        for k in keys:
            s = summary(rs, k)
            if s:
                print(f'  {k:16s} n={s["n"]:4d}  P10={s["p10"]:7.3f}  P50={s["p50"]:7.3f}  P90={s["p90"]:7.3f}  mean={s["mean"]:7.3f}')
                table.append({'group': g, 'measure': k, **{x: round(s[x], 4) for x in ('n', 'p10', 'p50', 'p90', 'mean')}})
        qs = [r['fs_q'] for r in rs if 'fs_q' in r]
        if qs:
            print('  fs_q counts', {q: qs.count(q) for q in sorted(set(qs))})
            table.append({'group': g, 'measure': 'fs_q_mode', 'n': len(qs), 'p50': max(set(qs), key=qs.count)})
        for k in ('tempo_arch', 'vel_arch'):
            arr = [r[k] for r in rs if k in r]
            if arr:
                prof = np.mean(arr, axis=0)
                print(f'  {k:16s} ' + ' '.join(f'{x:6.3f}' for x in prof))
                for j, x in enumerate(prof):
                    table.append({'group': g, 'measure': f'{k}_{j + 1}of8', 'n': len(arr), 'mean': round(float(x), 4)})
    if out_csv:
        os.makedirs(os.path.dirname(out_csv), exist_ok=True)
        with open(out_csv, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=['group', 'measure', 'n', 'p10', 'p50', 'p90', 'mean'])
            w.writeheader()
            w.writerows(table)
        print('wrote', out_csv)


if __name__ == '__main__':
    main()
