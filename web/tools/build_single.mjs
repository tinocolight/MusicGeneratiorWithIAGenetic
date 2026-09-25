// Builds a single self-contained HTML file (all modules, data and CSS inlined), which opens
// directly from disk (file://) without a local server.
//   node tools/build_single.mjs            -> dist/ondas-atratoras.html
//   node tools/build_single.mjs --fragment -> page body only (for hosts that add <html>/<head>)
// Needs esbuild (fetched on demand with npx).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const fragment = process.argv.includes('--fragment');
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? `${root}dist/ondas-atratoras${fragment ? '.fragment' : ''}.html`;

const js = execFileSync('npx', ['--yes', 'esbuild@0.24.0', `${root}src/ui/app.js`, '--bundle', '--format=iife', '--minify', '--target=es2020'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const css = readFileSync(`${root}styles.css`, 'utf8');
const html = readFileSync(`${root}index.html`, 'utf8');

const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = [...html.matchAll(/<link rel="(?:preconnect|stylesheet)" href="https:\/\/fonts[^>]*>/g)].map((m) => m[0]).join('\n');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script type="module"[^>]*><\/script>/, '');
const safeJs = js.replace(/<\/script/gi, '<\\/script');
// the score engine (VexFlow + Gonville, MIT) is inlined too, so the single file works offline
const vex = readFileSync(`${root}vendor/vexflow-gonville.js`, 'utf8').replace(/<\/script/gi, '<\\/script');
const content = `${title}\n${fonts}\n<style>\n${css}\n</style>\n${body}\n<script>\n${vex}\n</script>\n<script>\n${safeJs}\n</script>\n`;
const page = fragment
  ? content
  : `<!doctype html>\n<html lang="pt">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${title}\n${fonts}\n<style>\n${css}\n</style>\n</head>\n<body>\n${body}\n<script>\n${vex}\n</script>\n<script>\n${safeJs}\n</script>\n</body>\n</html>\n`;
mkdirSync(out.slice(0, out.lastIndexOf('/')), { recursive: true });
writeFileSync(out, page);
console.log(`wrote ${out} (${(page.length / 1024).toFixed(0)} KB)`);
