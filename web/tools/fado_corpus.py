"""Real fado melodies for the fado study (tools/fado_study.mjs), read from the LilyPond lead sheets of
https://github.com/fadado/fado-scores (Joan Josep Ordinas Rosa, released into the public domain).

The repository has five melodies (Fado Adiça, Fado Alberto, Coimbra, Fado do Marujo, Fado Pagem)
and, for Coimbra, also a transcription of how a fadista sings it (rubato, anticipations and
delays written out), next to the plain melody. Nine other fados there have only their chords;
their harmonic schemes are summarised by hand in results/fado/harmonias.csv.

Only the statistics are kept in the repository (results/fado/): the notes are read from a local
clone each time, so the melodies are not redistributed here.

Each melody keeps its real durations on a grid of 24 ticks per quarter note (so triplets and
32nd notes are exact; the program's own grid is the 16th = 6 ticks), its meter, key and the
position of its first downbeat.

Run:
  git clone https://github.com/fadado/fado-scores /tmp/fado-scores
  python3 web/tools/fado_corpus.py /tmp/fado-scores      -> web/data/fado-corpus.json (git-ignored)
"""
import json
import os
import re
import sys
from fractions import Fraction

TPQ = 24  # ticks per quarter note
LETTERS = {'do': 0, 're': 1, 'mi': 2, 'fa': 3, 'sol': 4, 'la': 5, 'si': 6}
SEMIS = [0, 2, 4, 5, 7, 9, 11]
ACC = {'': 0, 's': 1, 'ss': 2, 'b': -1, 'bb': -2}

# file, music variable, title, meter, tonic (pitch class), mode, written tempo (quarters per minute), kind
SOURCES = [
    ('Adiça/melody.ily', 'MːMelody', 'Fado Adiça', '4/4', 0, 'major', None, 'lead sheet'),
    ('Alberto/melody.ily', 'MːMelody', 'Fado Alberto', '4/4', 5, 'minor', None, 'lead sheet'),
    ('@LEGACY/coimbra/musica/melodia.ily', 'Melodia', 'Coimbra (Raul Ferrão)', '2/2', 4, 'minor', 100, 'lead sheet'),
    ('@LEGACY/coimbra/musica/melodia.ily', 'Transcriçao', 'Coimbra, as sung', '2/2', 4, 'minor', 100, 'performance'),
    ('@LEGACY/marujo/musica/melodia.ily', 'Melodia', 'Fado do Marujo', '2/4', 5, 'minor', 50, 'lead sheet'),
    ('@LEGACY/pagem/musica/melodia.ily', 'Melodia', 'Fado Pagem', '4/4', 7, 'minor', 80, 'lead sheet'),
]


def music_block(text, name):
    """The braced expression assigned to `name` (comments removed)."""
    text = re.sub(r'%\{.*?%\}', ' ', text, flags=re.S)
    text = re.sub(r'%[^\n]*', ' ', text)
    m = re.search(re.escape(name) + r'\s*=\s*(\\relative\s+[a-z]+[\',]*\s*)?\{', text)
    if not m:
        raise ValueError(f'no {name}')
    i = m.end()
    depth = 1
    while depth:
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
        i += 1
    rel = m.group(1)
    return (rel.split()[1] if rel else None), text[m.end():i - 1]


def clean(body):
    """Drop what has no notes: \\set/\\unset/\\override lines, marks with markup, bar lines, scheme."""
    body = re.sub(r'\\(?:once\s+)?\\?(?:set|unset|override)\b[^\n]*', ' ', body)
    body = re.sub(r'\\mark\s*\\markup\s*\{[^{}]*\}', ' ', body)
    body = re.sub(r'\\bar\s*"[^"]*"', ' ', body)
    body = re.sub(r'#\'?\([^)]*\)', ' ', body)
    return body


TOKEN = re.compile(r"""
    (?P<times>\\times\s+(?P<tn>\d+)/(?P<td>\d+)\s*\{)
  | (?P<tuplet>\\tuplet\s+(?P<un>\d+)/(?P<ud>\d+)\s*\{)
  | (?P<key>\\key\s+(?P<kt>[a-z]+)\s*\\(?P<km>major|minor))
  | (?P<partial>\\partial\s+(?P<pd>\d+)(?P<pdots>\.*))
  | (?P<cmd>\\[A-Za-z]+)
  | (?P<open>\{) | (?P<close>\})
  | (?P<note>(?P<n>do|re|mi|fa|sol|la|si)(?P<acc>ss|s|bb|b)?(?P<oct>[',]*)[!?]?(?P<dur>\d+)?(?P<dots>\.*))
  | (?P<rest>(?P<rk>[rRs])(?P<rdur>\d+)?(?P<rdots>\.*)(?:\*(?P<rmul>\d+))?)
  | (?P<tie>~)
  | (?P<skip>[\[\]()|]|\\\(|\\\)|\S)
""", re.X)


def parse(rel_start, body, bar_ticks):
    """Notes and rests in written order: [{'p': midi | None, 'd': ticks, 'tie': bool}]."""
    out = []
    if rel_start:
        m = re.match(r'(do|re|mi|fa|sol|la|si)(?:ss|s|bb|b)?([\',]*)', rel_start)
        prev_step = LETTERS[m.group(1)] + 7 * (3 + m.group(2).count("'") - m.group(2).count(','))
    else:
        prev_step = 7 * 4  # absolute mode would need its own octave rule; not used here
    last_dur = Fraction(TPQ)
    scale = [Fraction(1)]
    stack = []
    partial = None
    for t in TOKEN.finditer(clean(body)):
        g = t.lastgroup
        if g in ('times', 'tuplet'):
            f = Fraction(int(t.group('tn')), int(t.group('td'))) if g == 'times' else Fraction(int(t.group('ud')), int(t.group('un')))
            stack.append(('tuplet', f))
            scale.append(scale[-1] * f)
        elif g == 'open':
            stack.append(('group', None))
        elif g == 'close':
            if stack and stack.pop()[0] == 'tuplet':
                scale.pop()
        elif g == 'partial':
            d = Fraction(4 * TPQ, int(t.group('pd')))
            for k in range(len(t.group('pdots'))):
                d += Fraction(4 * TPQ, int(t.group('pd')) * 2 ** (k + 1))
            partial = d
        elif g == 'key':
            out.append({'key': (t.group('kt'), t.group('km'))})
        elif g == 'note' or g == 'rest':
            dur_s = t.group('dur' if g == 'note' else 'rdur')
            dots = len(t.group('dots' if g == 'note' else 'rdots'))
            if dur_s:
                base = Fraction(4 * TPQ, int(dur_s))
                d = base
                for k in range(dots):
                    d += base / 2 ** (k + 1)
                last_dur = d
            else:
                d = last_dur
            d *= scale[-1]
            if g == 'rest':
                if t.group('rk') == 'R':
                    d = Fraction(bar_ticks) * int(t.group('rmul') or 1) if not dur_s else d * int(t.group('rmul') or 1)
                out.append({'p': None, 'd': d, 'tie': False, 'spacer': t.group('rk') == 's'})
                continue
            letter = LETTERS[t.group('n')]
            # relative mode: the octave that puts the note within a fourth of the previous one
            cands = [letter + 7 * o for o in range(0, 10)]
            step = min(cands, key=lambda s: abs(s - prev_step))
            octs = t.group('oct')
            step += 7 * (octs.count("'") - octs.count(','))
            prev_step = step
            midi = 12 * (step // 7 + 1) + SEMIS[step % 7] + ACC[t.group('acc') or '']
            out.append({'p': midi, 'd': d, 'tie': False})
        elif g == 'tie':
            for e in reversed(out):
                if 'p' in e:
                    e['tie'] = True
                    break
    return out, partial


def to_events(items, partial, bar_ticks):
    """Merge tied notes; drop leading/trailing spacers and rests; time of the first downbeat."""
    evs = []
    t = Fraction(0)
    key_changes = []
    pending_tie = False
    for it in items:
        if 'key' in it:
            key_changes.append((t, it['key']))
            continue
        if it['p'] is not None and pending_tie and evs and evs[-1]['p'] == it['p']:
            evs[-1]['d'] += it['d']
        elif it['p'] is None and evs and evs[-1]['p'] is None:
            evs[-1]['d'] += it['d']
            evs[-1]['spacer'] = evs[-1].get('spacer', False) and it.get('spacer', False)
        else:
            evs.append({'p': it['p'], 'd': it['d'], 'start': t, 'spacer': it.get('spacer', False)})
        pending_tie = it['tie'] if it['p'] is not None else False
        t += it['d']
    # the music starts on a bar line, unless it starts with an anacrusis (\partial)
    first_down = partial if partial is not None else Fraction(0)
    while evs and evs[0]['p'] is None:
        evs.pop(0)
    while evs and evs[-1]['p'] is None:
        evs.pop()
    t0 = evs[0]['start']
    for e in evs:
        if e['d'].denominator != 1 or e['start'].denominator != 1:
            raise ValueError('not on the tick grid')
    pickup = int(first_down - t0) % bar_ticks
    return [[e['p'] if e['p'] is not None else -1, int(e['d'])] for e in evs], pickup, [[int(k[0] - t0), k[1][1]] for k in key_changes]


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '/tmp/fado-scores'
    melodies = []
    for path, var, title, meter, tonic, mode, bpm, kind in SOURCES:
        with open(os.path.join(root, path), encoding='utf-8') as f:
            text = f.read()
        num, den = map(int, meter.split('/'))
        bar_ticks = num * 4 * TPQ // den
        rel, body = music_block(text, var)
        items, partial = parse(rel, body, bar_ticks)
        events, pickup, keys = to_events(items, partial, bar_ticks)
        melodies.append({'id': len(melodies), 'title': title, 'kind': kind, 'source': f'fadado/fado-scores: {path} ({var})',
                         'meter': meter, 'num': num, 'den': den, 'tpq': TPQ, 'barTicks': bar_ticks, 'pickup': pickup,
                         'tonic': tonic, 'mode': mode, 'keyChanges': keys, 'bpm': bpm, 'events': events})
        notes = [p for p, d in events if p >= 0]
        print(f'{title:28s} {meter} {len(notes):4d} notes, {sum(d for _, d in events) / bar_ticks:5.1f} bars, '
              f'range {min(notes)}-{max(notes)}, pickup {pickup} ticks', file=sys.stderr)
    out = os.path.join(os.path.dirname(__file__), '..', 'data', 'fado-corpus.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'tpq': TPQ, 'melodies': melodies}, f, ensure_ascii=False)
    print(out, file=sys.stderr)


if __name__ == '__main__':
    main()
