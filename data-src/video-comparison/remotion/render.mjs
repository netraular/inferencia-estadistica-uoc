import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {copyFile, mkdir, readFile, rm} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {ensureBrowser, openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import ffmpeg from 'ffmpeg-static';

const root = path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const shared = path.resolve(root, '../../../static/comparativa-videos/shared');
const output = path.resolve(root, '../../../static/comparativa-videos/remotion');
const cache = path.join(root, '.cache');
const publicDir = path.join(root, 'public');
const script = JSON.parse(await readFile(path.join(shared, 'script.json'), 'utf8'));
assert.equal(createHash('sha256').update(await readFile(path.join(shared, script.audio))).digest('hex'), script.audioSha256);
await mkdir(publicDir, {recursive: true});
await mkdir(cache, {recursive: true});
await mkdir(output, {recursive: true});
await copyFile(path.join(shared, 'script.json'), path.join(publicDir, 'script.json'));
await copyFile(path.join(shared, script.audio), path.join(publicDir, script.audio));

const bundlePath = await bundle({entryPoint: path.join(root, 'src/composition.jsx'), outDir: path.join(cache, 'bundle'), publicDir, rootDir: root, gitSource: null, enableCaching: true});
const contentTypes = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.json': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2'};
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const target = path.resolve(bundlePath, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!target.startsWith(`${bundlePath}${path.sep}`)) {response.writeHead(403).end(); return;}
  const stream = createReadStream(target);
  stream.once('error', () => {if (!response.headersSent) response.writeHead(404); response.end();});
  response.setHeader('Content-Type', contentTypes[path.extname(target)] ?? 'application/octet-stream');
  stream.pipe(response);
});
let browser;
let nextProgress = 0;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(41743, '127.0.0.1', resolve);
  });
  const available = await ensureBrowser({chromeMode: 'headless-shell'});
  assert.ok(available.type !== 'no-browser' && available.type !== 'version-mismatch');
  browser = await openBrowser('chrome', {browserExecutable: available.path, chromeMode: 'headless-shell', logLevel: 'error'});
  const serveUrl = 'http://127.0.0.1:41743';
  const composition = await selectComposition({serveUrl, id: 'ProbabilityArea', puppeteerInstance: browser, logLevel: 'error'});
  assert.equal(composition.durationInFrames, script.frames);
  const sample = process.argv.includes('--sample');
  const sampleFrames = [0, 156, 279, 387, 510, 600, 711, 825, 990, 1140, 1184];
  const ranges = sample ? sampleFrames.map(frame => [frame, frame]) : [null];
  for (const frameRange of ranges) {
    const movie = path.join(cache, sample ? `sample-${frameRange[0]}.mp4` : 'silent.mp4');
    await renderMedia({composition, serveUrl, puppeteerInstance: browser, codec: 'h264', outputLocation: movie, concurrency: 1, frameRange,
      muted: true, pixelFormat: 'yuv420p', crf: 18, x264Preset: 'medium', overwrite: true, logLevel: 'error', disallowParallelEncoding: true,
      onProgress: state => {
        const percent = Math.floor(state.progress*100);
        if (percent >= nextProgress || sample) {console.log(`${sample ? `sample ${frameRange[0]}` : 'video'}: ${percent}% (${state.renderedFrames} frames)`); nextProgress=percent+10;}
      }});
  }
  if (!sample) {
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(cache, 'silent.mp4'), '-i', path.join(shared, script.audio),
      '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-movflags', '+faststart', path.join(output, 'video.mp4')], {cwd: root, stdio: 'inherit'});
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(output, 'video.mp4'), '-vf', 'select=eq(n\\,510)', '-frames:v', '1', '-q:v', '2', path.join(output, 'poster.jpg')], {cwd: root, stdio: 'inherit'});
    await rm(path.join(cache, 'probe.mp4'), {force: true});
    for (const frame of sampleFrames) await rm(path.join(cache, `sample-${frame}.mp4`), {force: true});
    console.log(`Exported ${script.frames} frames with original unedited MP3 packets.`);
  }
} finally {
  try {if (browser) await browser.close({silent: true});}
  finally {
    if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    console.log('Own Chromium and loopback render server closed.');
  }
}