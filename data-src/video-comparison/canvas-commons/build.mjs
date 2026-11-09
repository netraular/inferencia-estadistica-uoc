import {build} from 'esbuild';
import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const storyboard = JSON.parse(await readFile(new URL('../../../static/comparativa-videos/shared/script.json', import.meta.url), 'utf8'));
await mkdir(new URL('dist/', import.meta.url), {recursive: true});
for (const weight of [400, 600]) {
  await copyFile(new URL(`node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${weight}-normal.woff2`, import.meta.url),
    new URL(`dist/font-${weight}.woff2`, import.meta.url));
}
await build({
  absWorkingDir: root,
  entryPoints: ['src/project.ts'],
  outfile: 'dist/project.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  define: {PACKAGE_VERSION: '"3.2.2"', FROZEN_STORYBOARD: JSON.stringify(storyboard)},
  loader: {'.wasm': 'file'},
});
await writeFile(new URL('dist/index.html', import.meta.url),
  '<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Plex;src:url(/font-400.woff2);font-weight:400}@font-face{font-family:Plex;src:url(/font-600.woff2);font-weight:600}body{font-family:Plex}</style></head><body><script type="module" src="/project.js"></script></body></html>');