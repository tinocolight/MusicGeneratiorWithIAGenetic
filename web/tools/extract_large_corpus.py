"""Large corpus of real melodies for the building-block model (tools/build_blocks.mjs).

All monophonic melodies in simple quarter-beat meters (2/4, 3/4, 4/4) found in the
music21 corpus collections of Western tonal melody:
  * Essen Folksong Collection (all 31 files bundled with music21)
  * O'Neill's Music of Ireland (1850)
  * Ryan's Mammoth Collection (1883)
  * Aird's Airs, Nottingham dataset (reels)
  * J.S. Bach chorales (soprano line)

The 480 melodies used to train the critic (data/corpus.json) are left out, so that the
critic stays an independent judge of anything learned from this corpus.

Output: web/data/corpus-large.json
  { "melodies": [ { "source", "title", "barLen", "pickup", "tonic", "mode",
                    "events": [[midi | -1, dur16], ...] } ] }

Run:  python3 web/tools/extract_large_corpus.py   (pip install music21; ~10 min, 4 processes)
"""
import json
import os
import sys
from multiprocessing import Pool

from music21 import converter, corpus, note, chord, meter

MAX_STEPS = 64 * 16
MIN_NOTES = 12


def melody_from_part(part, source, title):
    flat = part.flatten()
    tss = flat.getElementsByClass(meter.TimeSignature)
    if not tss:
        return None
    ts = tss[0]
    if ts.denominator != 4 or ts.numerator not in (2, 3, 4):
        return None  # simple quarter-beat meters only
    if len(tss) > 1 and any(t.ratioString != ts.ratioString for t in tss):
        return None
    bar_len = ts.numerator * 4
    try:
        part = part.stripTies()
    except Exception:
        return None
    flat = part.flatten()
    events, pos = [], 0
    for el in flat.notesAndRests:
        if el.duration.isGrace:
            continue
        off = float(el.offset) * 4
        dur = float(el.quarterLength) * 4
        if abs(off - round(off)) > 1e-6 or abs(dur - round(dur)) > 1e-6 or dur < 1:
            return None
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
    if total > MAX_STEPS or total < 4 * bar_len:
        return None
    if sum(1 for p, _ in merged if p >= 0) < MIN_NOTES:
        return None
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
        return None
    return {'source': source, 'title': title, 'barLen': bar_len, 'pickup': pickup,
            'tonic': int(tonic), 'mode': mode, 'events': merged}


def work(job):
    path, source = job
    out = []
    try:
        parsed = converter.parse(path)
    except Exception as exc:
        print('skip', path, exc, file=sys.stderr)
        return out
    scores = list(parsed.scores) if hasattr(parsed, 'scores') else [parsed]
    for s in scores:
        try:
            part = s.parts[0] if s.parts else s
            title = s.metadata.title if s.metadata and s.metadata.title else os.path.basename(str(path))
            m = melody_from_part(part, source, title)
        except Exception:
            m = None
        if m:
            out.append(m)
    return out


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
    melodies, seen = [], set()
    with Pool(4) as pool:
        for i, res in enumerate(pool.imap_unordered(work, jobs, chunksize=4)):
            for m in res:
                key = (m['source'], m['title'], json.dumps(m['events'][:12]))
                if key in critic_set or key in seen:
                    continue  # the critic's melodies, or a duplicate
                seen.add(key)
                melodies.append(m)
            if i % 50 == 0:
                print(i, '/', len(jobs), len(melodies), file=sys.stderr)
    melodies.sort(key=lambda m: (m['source'], m['title']))
    for i, m in enumerate(melodies):
        m['id'] = i
    out = os.path.join(here, '..', 'data', 'corpus-large.json')
    with open(out, 'w') as fh:
        json.dump({'description': 'Real melodies in 2/4, 3/4 and 4/4 from the music21 corpus (Essen, '
                                  "O'Neill, Ryan's Mammoth, Aird's Airs, Nottingham, Bach chorale sopranos), "
                                  '16th-note grid, without the 480 melodies of corpus.json.',
                   'melodies': melodies}, fh, separators=(',', ':'))
    counts = {}
    for m in melodies:
        counts[m['source']] = counts.get(m['source'], 0) + 1
    print('wrote', len(melodies), 'melodies', counts, file=sys.stderr)


if __name__ == '__main__':
    main()
