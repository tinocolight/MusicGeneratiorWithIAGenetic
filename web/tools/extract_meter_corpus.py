"""Corpus of real melodies BY METER, for the rhythm/melody analysis (tools/build_meters.mjs).

Unlike tools/extract_large_corpus.py (simple quarter-beat meters only, meter reduced to the bar
length), this keeps the time signature of every melody, so that 3/4 (three quarter beats, each
split in two) and 6/8 (two dotted-quarter beats, each split in three) are never mixed although
both bars last 12 sixteenths. Meters kept: 2/4, 3/4, 4/4, 2/2 (simple) and 3/8, 6/8, 9/8, 12/8
(compound: every beat is three eighths).

Sources (music21 corpus): Essen Folksong Collection, O'Neill's Music of Ireland (1850), Ryan's
Mammoth Collection (1883), Aird's Airs, the Nottingham dataset, J.S. Bach chorales (soprano).
The 480 melodies used to train the critic (data/corpus.json) are left out, so that the critic
stays an independent judge of what is learned here.

Output: web/data/corpus-meters.json
  { "melodies": [ { "id", "source", "title", "num", "den", "barLen", "pickup", "tonic", "mode",
                    "events": [[midi | -1, dur16], ...] } ],
    "rejected": { "<meter>": { "<reason>": count } } }
The rejection counts are kept so that the corpus can be audited (e.g. how many hornpipes were
left out because of triplets, which the 16th-note grid of the program cannot write).

Run:  python3 web/tools/extract_meter_corpus.py   (pip install music21; ~15 min with 4 processes)
"""
import json
import os
import sys
from multiprocessing import Pool

from music21 import converter, corpus, note, chord, meter

METERS = {'2/4', '3/4', '4/4', '2/2', '3/8', '6/8', '9/8', '12/8'}
MAX_STEPS = 64 * 16
MIN_NOTES = 12


def melody_from_part(part, source, title):
    """(melody | None, meter string, reason)"""
    flat = part.flatten()
    tss = flat.getElementsByClass(meter.TimeSignature)
    if not tss:
        return None, '?', 'no time signature'
    ts = tss[0]
    ratio = f'{ts.numerator}/{ts.denominator}'
    if ratio not in METERS:
        return None, ratio, 'other meter'
    if len(tss) > 1 and any(f'{t.numerator}/{t.denominator}' != ratio for t in tss):
        return None, ratio, 'meter changes'
    bar_len = ts.numerator * 16 // ts.denominator
    try:
        part = part.stripTies()
    except Exception:
        return None, ratio, 'unreadable ties'
    flat = part.flatten()
    events, pos = [], 0
    for el in flat.notesAndRests:
        if el.duration.isGrace:
            continue
        off = float(el.offset) * 4
        dur = float(el.quarterLength) * 4
        if abs(off - round(off)) > 1e-6 or abs(dur - round(dur)) > 1e-6 or dur < 1:
            return None, ratio, 'off the 16th grid (triplets, 32nds)'
        off, dur = int(round(off)), int(round(dur))
        if off < pos:
            continue
        if off > pos:
            events.append([-1, off - pos])
        if isinstance(el, note.Note):
            events.append([el.pitch.midi, dur])
        elif isinstance(el, chord.Chord):
            events.append([max(p.midi for p in el.pitches), dur])
        else:
            events.append([-1, dur])
        pos = off + dur
    merged = []
    for p, d in events:
        if merged and p == -1 and merged[-1][0] == -1:
            merged[-1][1] += d
        else:
            merged.append([p, d])
    while merged and merged[0][0] == -1:
        merged.pop(0)
    while merged and merged[-1][0] == -1:
        merged.pop()
    total = sum(d for _, d in merged)
    if total > MAX_STEPS:
        return None, ratio, 'longer than 1024 sixteenths'
    if total < 4 * bar_len or sum(1 for p, _ in merged if p >= 0) < MIN_NOTES:
        return None, ratio, 'shorter than 4 bars or 12 notes'
    pickup = 0
    measures = part.getElementsByClass('Measure')
    if measures:
        pad = float(getattr(measures[0], 'paddingLeft', 0) or 0)
        if pad > 0:
            pickup = int(round(bar_len - pad * 4)) % bar_len
    try:
        k = part.analyze('key')
        tonic, mode = k.tonic.pitchClass, k.mode
    except Exception:
        return None, ratio, 'key not found'
    return ({'source': source, 'title': title, 'num': ts.numerator, 'den': ts.denominator,
             'barLen': bar_len, 'pickup': pickup, 'tonic': int(tonic), 'mode': mode,
             'events': merged}, ratio, 'kept')


def work(job):
    path, source = job
    out, reasons = [], []
    try:
        parsed = converter.parse(path)
    except Exception as exc:
        print('skip', path, exc, file=sys.stderr)
        return out, reasons
    scores = list(parsed.scores) if hasattr(parsed, 'scores') else [parsed]
    for s in scores:
        try:
            part = s.parts[0] if s.parts else s
            title = s.metadata.title if s.metadata and s.metadata.title else os.path.basename(str(path))
            m, ratio, why = melody_from_part(part, source, title)
        except Exception:
            m, ratio, why = None, '?', 'unreadable'
        reasons.append((ratio, why))
        if m:
            out.append(m)
    return out, reasons


def main():
    jobs = []
    for p in corpus.getPaths():
        s = str(p)
        if '/essenFolksong/' in s and '/test' not in s:
            jobs.append((s, 'essen'))
        elif '/oneills1850/' in s:
            jobs.append((s, 'oneills'))
        elif '/ryansMammoth/' in s:
            jobs.append((s, 'ryans'))
        elif '/airdsAirs/' in s:
            jobs.append((s, 'airds'))
        elif '/nottingham-dataset/' in s:
            jobs.append((s, 'nottingham'))
    for p in corpus.getComposer('bach'):
        jobs.append((str(p), 'bach-chorale'))
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, '..', 'data', 'corpus.json')) as fh:
        critic_set = {(m['source'], m['title'], json.dumps(m['events'][:12])) for m in json.load(fh)['melodies']}
    melodies, seen, rejected = [], set(), {}

    def reject(ratio, why):
        rejected.setdefault(ratio, {})
        rejected[ratio][why] = rejected[ratio].get(why, 0) + 1

    with Pool(4) as pool:
        for i, (res, reasons) in enumerate(pool.imap_unordered(work, jobs, chunksize=4)):
            for ratio, why in reasons:
                if why != 'kept':
                    reject(ratio, why)
            for m in res:
                key = (m['source'], m['title'], json.dumps(m['events'][:12]))
                ratio = f"{m['num']}/{m['den']}"
                if key in critic_set:
                    reject(ratio, 'in the critic corpus')
                    continue
                if key in seen:
                    reject(ratio, 'duplicate')
                    continue
                seen.add(key)
                melodies.append(m)
            if i % 50 == 0:
                print(i, '/', len(jobs), len(melodies), file=sys.stderr)
    melodies.sort(key=lambda m: (m['source'], m['num'], m['den'], m['title']))
    for i, m in enumerate(melodies):
        m['id'] = i
    out = os.path.join(here, '..', 'data', 'corpus-meters.json')
    with open(out, 'w') as fh:
        json.dump({'description': 'Real melodies from the music21 corpus (Essen, O\'Neill, Ryan\'s Mammoth, '
                                  'Aird\'s Airs, Nottingham, Bach chorale sopranos) with their time signature '
                                  '(2/4, 3/4, 4/4, 2/2, 3/8, 6/8, 9/8, 12/8), 16th-note grid, without the 480 '
                                  'melodies of corpus.json. events: [midi or -1 for a rest, duration in 16ths].',
                   'melodies': melodies, 'rejected': rejected}, fh, separators=(',', ':'))
    counts = {}
    for m in melodies:
        k = f"{m['num']}/{m['den']}"
        counts[k] = counts.get(k, 0) + 1
    print('wrote', len(melodies), 'melodies', counts, file=sys.stderr)


if __name__ == '__main__':
    main()
