import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { TEXTS, LANGUAGES } from '../src/i18n/texts.js';
import { t, tn, startLang, getLang } from '../src/i18n/i18n.js';
import { DEFAULT_WEIGHTS } from '../src/fitness/attractor.js';
import { CLASSIC_DEFAULTS } from '../src/fitness/classic.js';
import { STYLE_IDS, STYLE_FAMILIES } from '../src/fitness/styles.js';
import { INSTRUMENTS, ENSEMBLES } from '../src/core/instruments.js';
import { INTERVALS } from '../src/fitness/canon.js';
import { WAVE_PRESETS } from '../src/fitness/presets.js';
import { METER_IDS } from '../src/core/meter.js';
import { DESCRIPTORS } from '../src/ga/mapelites.js';
import { CLASSIC_PRESETS } from '../src/ui/config.js';

const here = new URL('.', import.meta.url).pathname;

test('every text exists in every language', () => {
  for (const [key, e] of Object.entries(TEXTS)) {
    for (const l of LANGUAGES) assert.equal(typeof e[l.id], 'string', `${key} in ${l.id}`);
    // placeholders are the same in every language
    const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    for (const l of LANGUAGES) assert.equal(ph(e[l.id]), ph(e.pt), `${key}: placeholders in ${l.id}`);
  }
});

test('the page only has placeholders, and each one has a text', () => {
  const html = readFileSync(`${here}../index.html`, 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-html|-title|-aria-label|-placeholder)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 150);
  for (const k of keys) assert.ok(TEXTS[k], `index.html uses ${k}`);
  // no visible text left inside the elements that have a placeholder
  for (const m of html.matchAll(/<(\w+)[^>]*data-i18n(?:-html)?="[^"]+"[^>]*>([^<]*)</g)) assert.equal(m[2].trim(), '', `text left in <${m[1]}>: ${m[2]}`);
});

test('the texts asked for by the scripts exist', () => {
  const files = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walk(`${dir}/${f.name}`);
      else if (f.name.endsWith('.js') && !dir.includes('/data') && !dir.includes('/i18n')) files.push(`${dir}/${f.name}`);
    }
  };
  walk(`${here}../src`);
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\('([^'`${}]+)'/g)) assert.ok(TEXTS[m[1]], `${f.split('/src/')[1]}: t('${m[1]}')`);
    for (const m of src.matchAll(/\btn\('([^']+)'/g)) assert.ok(TEXTS[`${m[1]}.one`] && TEXTS[`${m[1]}.other`], `${m[1]}.one/.other`);
  }
  // keys built from tables
  const need = [
    ...Object.keys(DEFAULT_WEIGHTS).flatMap((k) => [`weight.${k}`, `weight.${k}.desc`]),
    ...Object.keys(CLASSIC_DEFAULTS.g1).flatMap((k) => [`classic.${k}`, `classic.${k}.desc`]),
    ...STYLE_IDS.flatMap((id) => [`style.${id}`, `style.${id}.desc`]),
    ...STYLE_FAMILIES.map((f) => `style.family.${f}`),
    ...Object.keys(INSTRUMENTS).map((k) => `instrument.${k}`),
    ...[...new Set(Object.values(INSTRUMENTS).map((i) => i.family))].map((f) => `family.${f}`),
    ...Object.keys(ENSEMBLES).map((k) => `ensemble.${k}`),
    ...Object.keys(INTERVALS).map((k) => `interval.${k}`),
    ...Object.keys(WAVE_PRESETS).map((k) => `wpre.${k}`),
    ...METER_IDS.map((k) => `meter.${k}`),
    ...Object.keys(DESCRIPTORS).map((k) => `descriptor.${k}`),
    ...CLASSIC_PRESETS.flatMap((p) => [`cpreset.${p.id}`, `cpreset.${p.id}.hint`]),
    ...Array.from({ length: 12 }, (_, i) => `note.${i}`),
  ];
  for (const k of need) assert.ok(TEXTS[k], k);
});

test('t fills placeholders, falls back to Portuguese, and switches language', () => {
  assert.equal(getLang(), 'pt');
  assert.equal(t('voice.n', { n: 2 }), 'Voz 2');
  assert.equal(tn('pdf.pages', 1), '1 página');
  assert.equal(tn('pdf.pages', 3), '3 páginas');
  assert.equal(t('no.such.key'), 'no.such.key');
  startLang('en');
  assert.equal(t('voice.n', { n: 2 }), 'Voice 2');
  assert.equal(INSTRUMENTS.cello.label, 'Cello');
  startLang('pt');
  assert.equal(INSTRUMENTS.cello.label, 'Violoncelo');
});
