import assert from 'node:assert/strict';
import {execFileSync, spawn} from 'node:child_process';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

const owned = path.dirname(fileURLToPath(import.meta.url));
const shared = path.resolve(owned, '../../five-seconds');
const cache = path.join(owned, '.cache');
const outputs = path.resolve(owned, '../../../../static/comparativa-videos/cinco-segundos/remotion');
const source = path.join(owned, 'scene.jsx');
const brief = JSON.parse(await readFile(path.join(shared, 'brief.json'), 'utf8'));
const clock = command => execFileSync(process.execPath, [path.join(shared, 'clock.mjs'), command, 'remotion'], {encoding: 'utf8'});
const require = createRequire(import.meta.url);

async function check() {
  const bundlerRequire = createRequire(require.resolve('@remotion/bundler'));
  const {transformSync} = bundlerRequire('esbuild');
  transformSync(await readFile(source, 'utf8'), {loader: 'jsx', jsx: 'automatic'});
  for (const api of [bundle, openBrowser, renderMedia, selectComposition]) assert.equal(typeof api, 'function');
  const remotion = require('remotion');
  for (const api of ['registerRoot', 'Composition', 'delayRender', 'continueRender', 'cancelRender', 'interpolate']) assert.equal(typeof remotion[api], 'function');
  for (const phase of brief.phases) require('katex').renderToString(phase.formula, {throwOnError: true});
  assert.equal(brief.frames, brief.duration * brief.fps);
  console.log('PASS: JSX, installed Remotion APIs, KaTeX formulas and frame contract');
}

async function render() {
  let browser;
  const attempt = {startedAt: new Date().toISOString(), success: false};
  console.log(clock('render-start'));
  try {
    await rm(cache, {recursive: true, force: true});
    await mkdir(cache, {recursive: true});
    await mkdir(outputs, {recursive: true});
    const serveUrl = await bundle({entryPoint: source, outDir: path.join(cache, 'bundle'), enableCaching: false});
    console.log('REMOTION: fresh bundle complete');
    browser = await openBrowser('chrome');
    const composition = await selectComposition({serveUrl, id: 'Complement', puppeteerInstance: browser});
    assert.equal(composition.durationInFrames, 150);
    assert.equal(composition.width, 1280);
    assert.equal(composition.height, 720);
    assert.equal(composition.fps, 30);
    console.log('REMOTION: browser and composition ready');
    await renderMedia({composition, serveUrl, puppeteerInstance: browser, outputLocation: path.join(outputs, 'video.mp4'), codec: 'h264', pixelFormat: 'yuv420p', crf: 18, muted: true, concurrency: 1, overwrite: true});
    attempt.success = true;
  } catch (error) {
    attempt.error = String(error.stack || error);
    throw error;
  } finally {
    try {
      if (browser) await browser.close({silent: true});
    } finally {
      console.log(clock('render-end'));
      attempt.endedAt = new Date().toISOString();
      await writeFile(path.join(owned, 'render-attempt.json'), JSON.stringify(attempt, null, 2));
    }
  }
  const movie = path.join(outputs, 'video.mp4');
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '4', '-i', movie, '-frames:v', '1', '-q:v', '2', path.join(outputs, 'poster.jpg')]);
  const metadata = JSON.parse(execFileSync(ffprobe.path, ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', movie], {encoding: 'utf8'}));
  const video = metadata.streams.find(stream => stream.codec_type === 'video');
  assert.equal(Number(video.nb_read_frames), 150);
  assert.equal(video.width, 1280);
  assert.equal(video.height, 720);
  assert.equal(video.avg_frame_rate, '30/1');
  assert.equal(Number(video.duration), 5);
  assert(!metadata.streams.some(stream => stream.codec_type === 'audio'));
  const hashes = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', movie, '-vf', 'select=eq(n\\,0)+eq(n\\,30)+eq(n\\,90)+eq(n\\,102)', '-fps_mode', 'passthrough', '-f', 'framemd5', '-'], {encoding: 'utf8'});
  const frames = hashes.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(',').at(-1).trim());
  assert.equal(frames.length, 4);
  assert.equal(new Set(frames).size, 4, 'Formula phases and transition must change decoded pixels');
  await writeFile(path.join(cache, 'validation.json'), JSON.stringify({video, audio: false, sampleFrames: [0, 30, 90, 102], uniqueDecodedHashes: frames.length}, null, 2));
  console.log('PASS: MP4 is 150 frames, 1280x720, 30 fps, exactly 5 seconds, silent; distinct phase/transition frames; poster exported');
}

if (process.argv.includes('--check')) await check();
else if (process.argv.includes('--worker')) await render();
else {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--worker'], {detached: true, stdio: 'inherit'});
  await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Export exited: ${code ?? signal}`)));
  });
}