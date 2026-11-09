import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const root = fileURLToPath(new URL('.', import.meta.url));
const work = new URL('work/', import.meta.url);
const probe = process.argv.includes('--probe');
const sharedAudio = fileURLToPath(new URL('../../../static/comparativa-videos/shared/audio.mp3', import.meta.url));
const storyboard = JSON.parse(await readFile(new URL('../../../static/comparativa-videos/shared/script.json', import.meta.url), 'utf8'));
const audioSha256 = createHash('sha256').update(await readFile(sharedAudio)).digest('hex');
if (audioSha256 !== storyboard.audioSha256) throw new Error('Frozen audio hash mismatch');
const output = fileURLToPath(new URL(probe ? 'work/probe.mp4' : '../../../static/comparativa-videos/canvas-commons/video.mp4', import.meta.url));
await mkdir(work, {recursive: true});
await mkdir(new URL('../../../static/comparativa-videos/canvas-commons/', import.meta.url), {recursive: true});
const server = createServer(async (request, response) => {
  const path = request.url === '/' ? 'index.html' : request.url?.slice(1);
  if (!path || !/^[a-zA-Z0-9_.-]+$/.test(path)) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(new URL(`dist/${path}`, import.meta.url));
    response.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.wasm') ? 'application/wasm' : 'text/html');
    response.end(content);
  } catch { response.writeHead(404).end(); }
});
let browser;
let encoder;
let encoderClosed;
let stderr = '';
try {
  server.listen(41744, '127.0.0.1');
  await once(server, 'listening');
  browser = await chromium.launch({headless: true, args: ['--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport: {width: 1280, height: 720}});
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('console', message => console.log('BROWSER:', message.text()));
  page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure()));
  encoder = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '30', '-i', 'pipe:0',
    ...(probe ? ['-an'] : ['-i', sharedAudio, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-t', '39.5']),
    '-c:v', 'libx264', '-threads', '1', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output], {cwd: root, stdio: ['pipe', 'ignore', 'pipe']});
  encoderClosed = once(encoder, 'close');
  encoder.stderr.on('data', chunk => { stderr += chunk; });
  await page.exposeFunction('captureFrame', async (frame, png) => {
    if (encoder.exitCode !== null || encoder.signalCode !== null) throw new Error(`Encoder stopped: ${stderr}`);
    const buffer = Buffer.from(png.split(',')[1], 'base64');
    if (probe && frame === 15) await writeFile(new URL('probe.png', work), buffer);
    if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain');
    if (frame % 150 === 0) console.log(`Captured ${frame + 1} frames`);
  });
  await page.goto('http://127.0.0.1:41744/');
  await page.waitForFunction(() => typeof window.renderClip === 'function');
  console.log('Canvas Commons project loaded');
  const result = await Promise.race([
    page.evaluate(probe => window.renderClip(probe), probe),
    new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error('Render timed out')), probe ? 30000 : 600000);
      timer.unref();
    }),
  ]);
  if (result.result !== 0 || result.count !== (probe ? 30 : 1185)) throw new Error(JSON.stringify(result));
  encoder.stdin.end();
  const [code] = await encoderClosed;
  if (code !== 0) throw new Error(stderr);
  await writeFile(new URL(probe ? 'probe-checks.json' : 'render-checks.json', work), JSON.stringify({...result, audioSha256}, null, 2));
  console.log(JSON.stringify({result: result.result, count: result.count, logs: result.logs, captions: result.checks.captions.length, formulas: result.checks.formulas.length, audioSha256}));
} finally {
  if (encoder && encoder.exitCode === null) { encoder.kill('SIGTERM'); await encoderClosed; }
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}