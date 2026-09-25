"""Extract a small reference corpus of real melodies for the evaluation module.

Uses the public-domain melodies bundled with music21 (pip install music21):
  * Essen Folksong Collection (European folk songs)
  * O'Neill's Music of Ireland (1850 collection, Irish dance tunes)
  * J.S. Bach chorales (soprano line)

Every melody is quantised to a 16th-note grid (the same grid used by the genetic
algorithm) and truncated to its first 128 steps (= 8 bars of 4/4), so that it can
be compared with generated pieces of the same length.

Output: web/data/corpus.json
  { "melodies": [ { "id", "source", "title", "barLen", "pickup", "tonic", "mode",
                    "events": [[midi | -1, dur16], ...] } ] }

Run:  python3 web/tools/extract_corpus.py
"""
import json
import os
import random
import sys

from music21 import converter, corpus, note, chord, meter

MAX_STEPS = 128
MIN_STEPS = 64
MIN_NOTES = 16
random.seed(1)


def steps_per_quarter(ts):
    # Normalise the notated beat: a half-note beat (x/2) counts as a quarter.
    return 2 if ts.denominator == 2 else 4


def melody_from_part(part, source, title):
    flat = part.flatten()
    tss = flat.getElementsByClass(meter.TimeSignature)
    if not tss:
        return None
    ts = tss[0]
    spq = steps_per_quarter(ts)
    bar_len = ts.barDuration.quarterLength * spq
    if bar_len not in (8, 12, 16):
        return None
    if len(tss) > 1 and any(t.ratioString != ts.ratioString for t in tss):
        return None

    try:
        part = part.stripTies()
    except Exception:
        return None
    flat = part.flatten()

    events = []
    pos = 0.0
    for el in flat.notesAndRests:
        if el.duration.isGrace:
            continue
        off = float(el.offset) * spq
        dur = float(el.quarterLength) * spq
        if abs(off - round(off)) > 1e-6 or abs(dur - round(dur)) > 1e-6 or dur < 1:
            return None  # tuplets or sub-16th values: not representable on the grid
        off, dur = int(round(off)), int(round(dur))
        if off < pos:
            continue  # overlapping voices
        if off > pos:
            events.append([-1, off - pos])
        if isinstance(el, note.Note):
            events.append([el.pitch.midi, dur])
        elif isinstance(el, chord.Chord):
            events.append([max(p.midi for p in el.pitches), dur])
        else:
            events.append([-1, dur])
        pos = off + dur

    # Merge consecutive rests, drop leading rests, truncate to MAX_STEPS
    merged = []
    for p, d in events:
        if merged and p == -1 and merged[-1][0] == -1:
            merged[-1][1] += d
        else:
            merged.append([p, d])
    while merged and merged[0][0] == -1:
        merged.pop(0)
    out, total = [], 0
    for p, d in merged:
        if total >= MAX_STEPS:
            break
        d = min(d, MAX_STEPS - total)
        out.append([p, d])
        total += d
    notes = [e for e in out if e[0] >= 0]
    if total < MIN_STEPS or len(notes) < MIN_NOTES:
        return None

    # Anacrusis: offset of the first full bar (music21 pads pickups via paddingLeft)
    measures = part.getElementsByClass('Measure')
    pickup = 0
    if measures:
        m0 = measures[0]
        pad = float(getattr(m0, 'paddingLeft', 0) or 0)
        if pad > 0:
            pickup = int(round(bar_len - pad * spq)) % int(bar_len)
    try:
        k = part.analyze('key')
        tonic, mode = k.tonic.pitchClass, k.mode
    except Exception:
        return None

    return {
        'source': source,
        'title': title,
        'barLen': int(bar_len),
        'pickup': int(pickup),
        'tonic': int(tonic),
        'mode': mode,
        'events': out,
    }


def iter_opus(work_names, source, limit):
    got = []
    for name in work_names:
        try:
            op = converter.parse(corpus.getWork(name))
        except Exception as exc:  # pragma: no cover
            print('skip', name, exc, file=sys.stderr)
            continue
        scores = list(op.scores) if hasattr(op, 'scores') else [op]
        random.shuffle(scores)
        for s in scores:
            if len(got) >= limit:
                return got
            try:
                part = s.parts[0] if s.parts else s
                title = (s.metadata.title if s.metadata and s.metadata.title else name)
                m = melody_from_part(part, source, title)
            except Exception:
                m = None
            if m:
                got.append(m)
        print(source, name, len(got), file=sys.stderr)
    return got


def bach(limit):
    got = []
    for path in corpus.getComposer('bach'):
        if len(got) >= limit:
            break
        try:
            s = converter.parse(path)
            sop = s.parts[0]
            m = melody_from_part(sop, 'bach-chorale', os.path.basename(str(path)))
        except Exception:
            m = None
        if m:
            got.append(m)
    print('bach', len(got), file=sys.stderr)
    return got


def main():
    essen = iter_opus(['essenFolksong/altdeu10', 'essenFolksong/altdeu20',
                       'essenFolksong/ballad10', 'essenFolksong/kinder0',
                       'essenFolksong/erk10', 'essenFolksong/boehme10',
                       'essenFolksong/han1', 'essenFolksong/lux'], 'essen', 240)
    oneill = iter_opus(['oneills1850/0001-0050', 'oneills1850/0051-0100',
                        'oneills1850/0101-0200', 'oneills1850/0201-0300',
                        'oneills1850/0301-0350'], 'oneills', 120)
    chorales = bach(120)
    melodies = essen + oneill + chorales
    for i, m in enumerate(melodies):
        m['id'] = i
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, '..', 'data', 'corpus.json')
    with open(out, 'w') as fh:
        json.dump({'description': 'Reference melodies (music21 corpus: Essen folksongs, '
                                  "O'Neill 1850, Bach chorale sopranos), 16th-note grid, "
                                  'first 128 steps.',
                   'melodies': melodies}, fh, separators=(',', ':'))
    print('wrote', len(melodies), 'melodies to', out, file=sys.stderr)


if __name__ == '__main__':
    main()
