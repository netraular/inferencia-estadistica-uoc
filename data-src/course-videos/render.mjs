import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {ensureBrowser, openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import ffmpeg from 'ffmpeg-static';
import ffprobePackage from 'ffprobe-static';
import {createStoryboard, VIDEO_ID} from './storyboard.mjs';

const owned = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(owned, '../..');
const cache = path.join(owned, '.cache');
fs.mkdirSync(cache, {recursive: true});
if (!process.argv.includes('--worker')) {
  const logPath = path.join(cache, 'render.log');
  const log = fs.openSync(logPath, 'w');
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2), '--worker'], {cwd: owned, detached: true, stdio: ['ignore', log, log]});
  fs.closeSync(log);
  fs.writeFileSync(path.join(cache, 'process.json'), JSON.stringify({pid: child.pid, started: new Date().toISOString()}));
  const code = await new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', status => resolve(status ?? 1));});
  console.log(fs.readFileSync(logPath, 'utf8'));
  process.exit(code);
}

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const audioManifest = readJson(path.join(root, 'static/audio/manifest.json'));
const track = audioManifest.lessons[VIDEO_ID];
const storyboard = createStoryboard(track);
const audioPath = path.join(root, 'static', track.src);
const audioHash = sha(fs.readFileSync(audioPath));
const output = path.join(root, 'static/videos', VIDEO_ID);
const videoPath = path.join(output, 'video.mp4');
const posterPath = path.join(output, 'poster.jpg');
const probe = filename => JSON.parse(execFileSync(ffprobePackage.path, ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', filename], {encoding: 'utf8'}));
const verify = () => {
  const {streams} = probe(videoPath);
  const video = streams.find(stream => stream.codec_type === 'video');
  const audio = streams.find(stream => stream.codec_type === 'audio');
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.width, storyboard.width);
  assert.equal(video.height, storyboard.height);
  assert.equal(video.avg_frame_rate, `${storyboard.fps}/1`);
  assert.equal(Number(video.nb_read_frames), storyboard.frames);
  assert.ok(Math.abs(Number(video.duration) - storyboard.duration) < 1 / storyboard.fps);
  assert.equal(audio.codec_name, 'aac');
  assert.ok(Math.abs(Number(audio.duration) - storyboard.duration) < 0.05);
  execFileSync(ffmpeg, ['-v', 'error', '-i', videoPath, '-f', 'null', '-'], {stdio: ['ignore', 'pipe', 'pipe']});
  assert.equal(sha(fs.readFileSync(audioPath)), audioHash);
  const metadata = {engine: 'remotion', title: storyboard.title, src: `videos/${VIDEO_ID}/video.mp4`, poster: `videos/${VIDEO_ID}/poster.jpg`, duration: storyboard.duration, frames: storyboard.frames, fps: storyboard.fps, width: storyboard.width, height: storyboard.height, audioSource: track.src, audioSha256: audioHash, videoSha256: sha(fs.readFileSync(videoPath)), posterSha256: sha(fs.readFileSync(posterPath))};
  console.log(`VIDEO_OK ${JSON.stringify(metadata)}`);
  return metadata;
};

if (process.argv.includes('--verify')) {
  const metadata = verify();
  assert.deepEqual(readJson(path.join(root, 'static/videos/manifest.json')).lessons[VIDEO_ID], metadata);
  process.exit(0);
}

const publicDir = path.join(cache, 'public');
fs.mkdirSync(publicDir, {recursive: true});
fs.mkdirSync(output, {recursive: true});
for (const weight of [400, 700]) fs.copyFileSync(path.join(root, `pages/inferencia/vendor/atkinson-latin-${weight}.woff2`), path.join(publicDir, `atkinson-latin-${weight}.woff2`));
const evidence = {audioSha256: audioHash, layout: [], browserClosed: false};
let browser;
try {
  const serveUrl = await bundle({entryPoint: path.join(owned, 'Proportions.jsx'), outDir: path.join(cache, 'bundle'), rootDir: owned, publicDir, enableCaching: false, gitSource: null});
  const ensured = await ensureBrowser();
  browser = await openBrowser('chrome', {browserExecutable: ensured.path, logLevel: 'error'});
  const inputProps = {storyboard};
  const composition = await selectComposition({serveUrl, id: 'Proportions', inputProps, puppeteerInstance: browser, logLevel: 'error'});
  const frames = [...new Set([0, ...storyboard.cues.map(cue => Math.min(storyboard.frames - 1, Math.round((cue.start + cue.end) / 2 * storyboard.fps))), storyboard.frames - 1])];
  for (const frame of frames) {
    await renderStill({serveUrl, composition: {...composition, props: {...inputProps, audit: true}}, inputProps: {...inputProps, audit: true}, puppeteerInstance: browser, output: path.join(cache, `frame-${frame}.jpg`), frame, imageFormat: 'jpeg', jpegQuality: 90, logLevel: 'error', onBrowserLog: log => {
      if (log.text?.startsWith('COURSE_VIDEO_LAYOUT ')) evidence.layout.push(JSON.parse(log.text.slice('COURSE_VIDEO_LAYOUT '.length)));
    }});
  }
  for (const frame of frames) {
    const entry = evidence.layout.find(item => item.frame === frame);
    assert.ok(entry, `No layout audit for frame ${frame}`);
    for (const box of entry.boxes) {
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1280.1 && box.y + box.height <= 720.1, `${frame}: ${box.name} outside viewport`);
      assert.ok(box.scrollWidth <= box.width + 1 && box.scrollHeight <= box.height + 1, `${frame}: ${box.name} overflows`);
    }
  }
  console.log(`LAYOUT_OK ${frames.length} frames`);
  if (!process.argv.includes('--stills')) {
    const silent = path.join(cache, 'silent.mp4');
    await renderMedia({serveUrl, composition, inputProps, puppeteerInstance: browser, outputLocation: silent, codec: 'h264', pixelFormat: 'yuv420p', crf: 18, x264Preset: 'medium', concurrency: 2, muted: true, overwrite: true, logLevel: 'error'});
    execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', silent, '-i', audioPath, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', String(storyboard.duration), '-movflags', '+faststart', videoPath]);
    await renderStill({serveUrl, composition, inputProps, puppeteerInstance: browser, output: posterPath, frame: Math.round(storyboard.events.comparison * storyboard.fps + 30), imageFormat: 'jpeg', jpegQuality: 94, logLevel: 'error'});
    const manifestPath = path.join(root, 'static/videos/manifest.json');
    const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {version: 1, lessons: {}};
    manifest.lessons[VIDEO_ID] = verify();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
} finally {
  if (browser) {await browser.close({silent: true}); evidence.browserClosed = true;}
  fs.writeFileSync(path.join(cache, 'validation.json'), JSON.stringify(evidence, null, 2) + '\n');
}