import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function summarizeTiming(timing) {
  assert(timing.finishedAtMs >= timing.startedAtMs);
  let started = null;
  let renderMs = 0;
  for (const event of timing.events) {
    assert(event.atMs >= timing.startedAtMs && event.atMs <= timing.finishedAtMs);
    if (event.type === 'render-start') {
      assert.equal(started, null);
      started = event.atMs;
    } else if (event.type === 'render-end') {
      assert.notEqual(started, null);
      assert(event.atMs >= started);
      renderMs += event.atMs - started;
      started = null;
    }
  }
  assert.equal(started, null, 'Unfinished render interval');
  const totalMs = timing.finishedAtMs - timing.startedAtMs;
  assert(renderMs <= totalMs);
  return {totalMs, renderMs, preparationAndChecksMs: totalMs - renderMs};
}

async function record() {
  const [command, technology] = process.argv.slice(2);
  assert(['start', 'render-start', 'render-end', 'finish'].includes(command));
  assert(['manim', 'remotion'].includes(technology));
  const directory = path.dirname(fileURLToPath(import.meta.url));
  const comparison = path.dirname(directory);
  const owned = path.join(comparison, technology, 'five-seconds');
  const file = path.join(owned, 'timing.json');
  await mkdir(owned, {recursive: true});
  if (command === 'start') {
    const startedAtMs = Date.now();
    const timing = {technology, startedAtMs, startedAt: new Date(startedAtMs).toISOString(), events: []};
    await writeFile(file, JSON.stringify(timing, null, 2), {flag: 'wx'});
    console.log(JSON.stringify(timing));
    return;
  }
  const timing = JSON.parse(await readFile(file, 'utf8'));
  assert(!timing.finishedAtMs, 'Delivery already completed');
  if (command === 'finish') {
    const engine = createRequire(path.join(comparison, 'remotion/package.json'));
    const movie = path.resolve(comparison, '../../static/comparativa-videos/cinco-segundos', technology, 'video.mp4');
    const metadata = JSON.parse(execFileSync(engine('ffprobe-static').path,
      ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', movie], {encoding: 'utf8'}));
    const video = metadata.streams.find(stream => stream.codec_type === 'video');
    assert.equal(Number(video.nb_read_frames), 150);
    assert.equal(video.width, 1280);
    assert.equal(video.height, 720);
    assert.equal(video.avg_frame_rate, '30/1');
    assert(Math.abs(Number(video.duration) - 5) < 0.04);
    assert(!metadata.streams.some(stream => stream.codec_type === 'audio'));
    timing.finishedAtMs = Date.now();
    timing.finishedAt = new Date(timing.finishedAtMs).toISOString();
    timing.measurements = summarizeTiming(timing);
    timing.validation = {frames: 150, width: 1280, height: 720, duration: Number(video.duration), audio: false};
  } else {
    timing.events.push({type: command, atMs: Date.now()});
  }
  await writeFile(file, JSON.stringify(timing, null, 2));
  console.log(JSON.stringify(timing));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await record();