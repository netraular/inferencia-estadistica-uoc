import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {verifyMath} from './math.mjs';

const owned = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(owned, '.cache');
const output = '/home/aquiluer/Scripts/inferencia-estadistica-uoc/static/comparativa-videos/bivariante/remotion';
const common = '/home/aquiluer/Scripts/inferencia-estadistica-uoc/static/comparativa-videos/bivariante/shared';
const requireRuntime = createRequire('/home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion/package.json');
const {bundle} = requireRuntime('@remotion/bundler');
const {ensureBrowser, openBrowser, selectComposition, renderStill, renderMedia} = requireRuntime('@remotion/renderer');
const ffmpeg = requireRuntime('ffmpeg-static');
const ffprobe = requireRuntime('ffprobe-static').path;
const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const scriptBytes = fs.readFileSync(path.join(common, 'script.json'));
const script = JSON.parse(scriptBytes);
const audioPath = path.join(common, 'audio.m4a');
const audioHash = sha(fs.readFileSync(audioPath));
const mathematical = verifyMath();
assert.equal(audioHash, script.audioSha256);
assert.equal(script.frames, 2253);
assert.equal(script.fps, 30);
assert.equal(script.cues.length, 22);
assert.deepEqual(script.parameters, {meanX: 30, meanY: 70, sigmaX: 5, sigmaY: 8, rho: 0.25, observedX: 40, thresholdY: 82});
fs.mkdirSync(path.join(cache, 'public'), {recursive: true});
fs.mkdirSync(output, {recursive: true});
const evidence = {scriptSha256: sha(scriptBytes), audioSha256: audioHash, mathematical, cues: script.cues, process: {pid: process.pid, parent: process.ppid}, layout: [], stills: [], browserClosed: false};
const save = () => fs.writeFileSync(path.join(cache, 'validation.json'), JSON.stringify(evidence, null, 2));
save();
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {cwd: owned, stdio: ['ignore', 'inherit', 'inherit']});
  child.once('error', reject);
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exit ${code}`)));
});
const probe = (file) => JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8', maxBuffer: 1024 * 1024}));
const checkLayout = (entry) => {
  assert.equal(entry.fonts, 'loaded');
  for (const box of entry.boxes) {
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1280.1 && box.y + box.height <= 720.1, `${entry.frame}: ${box.name} outside viewport`);
    assert.ok(box.mathWidth <= box.width + 1, `${entry.frame}: ${box.name} formula too wide (${box.mathWidth}/${box.width})`);
  }
  for (const [index, box] of entry.boxes.entries()) for (const other of entry.boxes.slice(index + 1)) {
    const overlapX = Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x);
    const overlapY = Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y);
    assert.ok(overlapX <= 0.5 || overlapY <= 0.5, `${entry.frame}: overlap ${box.name}/${other.name}`);
  }
};
let browser;
try {
  console.log('Bundle independiente: scene.jsx');
  const serveUrl = await bundle({entryPoint: path.join(owned, 'scene.jsx'), outDir: path.join(cache, 'bundle'), rootDir: owned, publicDir: path.join(cache, 'public'), enableCaching: false, gitSource: null});
  const ensured = await ensureBrowser();
  evidence.browser = ensured;
  browser = await openBrowser('chrome', {browserExecutable: ensured.path, logLevel: 'error'});
  const composition = await selectComposition({serveUrl, id: 'BivariateRemotion', inputProps: {script}, puppeteerInstance: browser, logLevel: 'error'});
  assert.equal(composition.durationInFrames, 2253);
  assert.equal(composition.width, 1280);
  assert.equal(composition.height, 720);
  evidence.composition = {width: composition.width, height: composition.height, fps: composition.fps, frames: composition.durationInFrames};
  const quick = process.argv.includes('--stills');
  const frames = quick ? [0, 570, 765, 1140, 1290, 1640, 1887, 2249] : [...new Set([0, ...script.cues.map((cue) => Math.min(2252, Math.round((cue.start + cue.end) / 2 * 30))), 590, 797, 1305, 1650, 2252])].sort((first, second) => first - second);
  for (const frame of frames) {
    const image = path.join(cache, `frame-${String(frame).padStart(4, '0')}.jpg`);
    await renderStill({serveUrl, composition: {...composition, props: {...composition.props, script, audit: true}}, inputProps: {script, audit: true}, puppeteerInstance: browser, output: image, frame, imageFormat: 'jpeg', jpegQuality: 92, logLevel: 'error', onBrowserLog: (log) => {
      if (log.text?.startsWith('BIVARIATE_LAYOUT ')) {
        const entry = JSON.parse(log.text.slice('BIVARIATE_LAYOUT '.length));
        evidence.layout.push(entry);
      }
    }});
    evidence.stills.push({frame, path: image, sha256: sha(fs.readFileSync(image))});
    save();
  }
  for (const entry of evidence.layout) checkLayout(entry);
  for (const frame of frames) assert.ok(evidence.layout.some((entry) => entry.frame === frame), `Layout audit missing frame ${frame}`);
  console.log(`STILLS_OK ${frames.length}; LAYOUT_OK ${evidence.layout.length}`);
  if (!quick) {
    const silent = path.join(cache, 'silent.mp4');
    const started = Date.now();
    let lastLogged = -1;
    await renderMedia({serveUrl, composition, inputProps: {script}, puppeteerInstance: browser, outputLocation: silent, codec: 'h264', pixelFormat: 'yuv420p', crf: 18, x264Preset: 'medium', concurrency: 2, muted: true, overwrite: true, logLevel: 'error', onProgress: (state) => {
      const percent = Math.floor(state.progress * 20) * 5;
      if (percent > lastLogged) {lastLogged = percent; evidence.progress = {percent, renderedFrames: state.renderedFrames, encodedFrames: state.encodedFrames}; save(); console.log(`RENDER ${percent}%`);}
    }});
    evidence.renderDurationSeconds = (Date.now() - started) / 1000;
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-i', audioPath, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', path.join(output, 'video.mp4')]);
    await renderStill({serveUrl, composition, inputProps: {script}, puppeteerInstance: browser, output: path.join(output, 'poster.jpg'), frame: 2249, imageFormat: 'jpeg', jpegQuality: 94, logLevel: 'error'});
    const final = probe(path.join(output, 'video.mp4'));
    const video = final.streams.find((stream) => stream.codec_type === 'video');
    const audio = final.streams.find((stream) => stream.codec_type === 'audio');
    assert.equal(video.codec_name, 'h264');
    assert.equal(video.width, 1280);
    assert.equal(video.height, 720);
    assert.equal(video.avg_frame_rate, '30/1');
    assert.equal(Number(video.nb_read_frames), 2253);
    assert.equal(Number(video.duration), 75.1);
    assert.equal(audio.codec_name, 'aac');
    const sourceAudio = probe(audioPath).streams.find((stream) => stream.codec_type === 'audio');
    for (const key of ['sample_rate', 'channels', 'duration', 'nb_read_frames']) assert.equal(audio[key], sourceAudio[key]);
    const sourceHash = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', audioPath, '-map', '0:a:0', '-c:a', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], {encoding: 'utf8'}).trim();
    const exportedHash = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', path.join(output, 'video.mp4'), '-map', '0:a:0', '-c:a', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], {encoding: 'utf8'}).trim();
    assert.equal(sourceHash, exportedHash);
    assert.equal(sha(fs.readFileSync(audioPath)), audioHash);
    assert.equal(sha(fs.readFileSync(path.join(common, 'script.json'))), evidence.scriptSha256);
    evidence.final = final;
    evidence.aacPacketHash = exportedHash;
    evidence.outputs = ['video.mp4', 'poster.jpg'].map((name) => ({name, bytes: fs.statSync(path.join(output, name)).size, sha256: sha(fs.readFileSync(path.join(output, name)))}));
    evidence.success = true;
    console.log(`FINAL_OK ${JSON.stringify({frames: video.nb_read_frames, fps: video.avg_frame_rate, duration: video.duration, width: video.width, height: video.height, audio: audio.codec_name, aacPacketHash: exportedHash})}`);
  } else evidence.probeSuccess = true;
} catch (error) {
  evidence.success = false;
  evidence.error = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) {await browser.close({silent: true}); evidence.browserClosed = true;}
  save();
}