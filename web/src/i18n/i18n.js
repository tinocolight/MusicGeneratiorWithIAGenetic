// Languages of the page. Every text lives in ONE central file, src/i18n/texts.js, with one entry per
// text and one field per language; the page only has placeholders:
//   <h3 data-i18n="piece.title"></h3>            text
//   <p data-i18n-html="lily.note"></p>            text with markup (<code>, <a>...)
//   <button data-i18n-title="quick.auto.title">   attribute (also data-i18n-aria-label, -placeholder)
// and the scripts ask for texts with t('key', {name: value}) ("{name}" inside a text is replaced).
// To add a language: add it to LANGUAGES in texts.js and a field with its code to the entries;
// a text not yet translated falls back to Portuguese.

import { TEXTS, LANGUAGES } from './texts.js';

export { LANGUAGES };
export const FALLBACK = 'pt';
const STORAGE_KEY = 'ondas-lang';
let lang = FALLBACK;
const listeners = new Set();

export const getLang = () => lang;
/** Locale for numbers and dates. */
export const locale = () => LANGUAGES.find((l) => l.id === lang)?.locale ?? 'pt-PT';

/** The text of `key` in the current language, with {placeholders} filled from `params`. */
export function t(key, params = null) {
  const e = TEXTS[key];
  let s = e === undefined ? key : e[lang] ?? e[FALLBACK] ?? key;
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] === undefined || params[k] === null ? m : String(params[k])));
  return s;
}

/** Singular or plural: the entry `${key}.one` when n is 1, `${key}.other` otherwise ({n} is filled). */
export const tn = (key, n, params = {}) => t(`${key}.${n === 1 ? 'one' : 'other'}`, { n, ...params });

/** Is there a text for this key? */
export const has = (key) => TEXTS[key] !== undefined;

/** Fill every placeholder under `root` with the texts of the current language. */
export function applyTexts(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  for (const attr of ['title', 'aria-label', 'placeholder']) {
    root.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`))));
  }
  if (root === document) {
    document.documentElement.lang = lang;
    document.title = t('app.title');
  }
}

/** Change the language (remembered in this browser); listeners re-render what scripts wrote. */
export function setLang(id, { remember = true } = {}) {
  if (!LANGUAGES.some((l) => l.id === id) || id === lang) return;
  lang = id;
  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* storage unavailable: the choice lasts until the page is closed */
    }
  }
  for (const fn of listeners) fn(lang);
}

export const onLangChange = (fn) => listeners.add(fn);

/** Language to start with: the one chosen before in this browser, else the browser's, else Portuguese. */
export function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.id === saved)) return saved;
  } catch (e) {
    /* storage unavailable */
  }
  const prefs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const p of prefs) {
    const id = String(p || '').slice(0, 2).toLowerCase();
    if (LANGUAGES.some((l) => l.id === id)) return id;
  }
  return FALLBACK;
}

/** Start in a language without remembering it (used once, when the page opens). */
export function startLang(id) {
  if (LANGUAGES.some((l) => l.id === id)) lang = id;
}

/**
 * A table id -> text, read in the current language when used: labelTable(['sine', 'arch'], 'wtype')
 * behaves like {sine: t('wtype.sine'), arch: t('wtype.arch')} (Object.entries works on it).
 */
export function labelTable(ids, prefix) {
  const table = {};
  for (const id of ids) Object.defineProperty(table, id, { get: () => t(`${prefix}.${id}`), enumerable: true });
  return table;
}

/**
 * Give the entries of a table a `label` (and other fields) read from the texts in the current
 * language: withLabels(INSTRUMENTS, 'instrument') makes INSTRUMENTS.violin.label = t('instrument.violin').
 */
export function withLabels(table, prefix, fields = { label: '' }) {
  for (const [id, entry] of Object.entries(table)) {
    for (const [field, suffix] of Object.entries(fields)) {
      Object.defineProperty(entry, field, { get: () => t(`${prefix}.${id}${suffix}`), enumerable: true, configurable: true });
    }
  }
  return table;
}
