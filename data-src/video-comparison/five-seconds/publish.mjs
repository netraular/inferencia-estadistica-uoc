import {readFile, writeFile, copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {summarizeTiming} from './clock.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const comparison = path.dirname(directory);
const output = path.resolve(comparison, '../../static/comparativa-videos/cinco-segundos');
const results = [];
for (const id of ['manim', 'remotion']) {
  const timing = JSON.parse(await readFile(path.join(comparison, id, 'five-seconds/timing.json'), 'utf8'));
  const renderEnds = timing.events.filter(event => event.type === 'render-end');
  const renderStarts = timing.events.filter(event => event.type === 'render-start');
  const movie = await readFile(path.join(output, id, 'video.mp4'));
  results.push({id, ...summarizeTiming(timing), startedAtMs: timing.startedAtMs, finishedAtMs: timing.finishedAtMs,
    startedAt: timing.startedAt, finishedAt: timing.finishedAt, validation: timing.validation,
    renderAttempts: renderStarts.length,
    finalRenderMs: renderEnds.at(-1).atMs - renderStarts.at(-1).atMs,
    sha256: createHash('sha256').update(movie).digest('hex'), bytes: movie.length});
  await copyFile(path.join(comparison, id, 'five-seconds/timing.json'), path.join(output, id, 'timing.json'));
  await copyFile(path.join(comparison, id, 'five-seconds/REPORT.md'), path.join(output, id, 'REPORT.md'));
}
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify({winner: results.toSorted((left, right) => left.finishedAtMs - right.finishedAtMs)[0].id, results}, null, 2));