import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir, readFile, copyFile} from 'node:fs/promises';
import {openSync, closeSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const comparison = path.dirname(directory);
const repository = path.resolve(comparison, '../..');
const engine = process.argv[2];
assert(['manim','remotion'].includes(engine), 'Expected: node render.mjs manim|remotion [--probe]');
const probe = process.argv.includes('--probe');
const cache = path.join(directory, '.cache', engine);
const output = path.join(repository, 'static/comparativa-videos/normal', engine);
const story = JSON.parse(await readFile(path.join(directory, 'storyboard.json'), 'utf8'));
const requireEngine = createRequire(path.join(comparison, 'remotion/package.json'));
await mkdir(cache, {recursive: true});
await mkdir(output, {recursive: true});

if (engine === 'manim') {
  const log = openSync(path.join(cache, 'render.log'), 'w');
  const image = 'manimcommunity/manim@sha256:ab5ad56cf685d89da96e5d459e0cde3743fbdf2141be4dcff6c26566b5ca3191';
  try {
    execFileSync('docker', ['run', '--rm', '--network', 'none', '--cpus=1', '--memory=2g',
      '--user', `${process.getuid()}:${process.getgid()}`, '-e', 'HOME=/cache', '-e', 'PYTHONDONTWRITEBYTECODE=1',
      '--mount', `type=bind,src=${comparison},dst=/work,readonly`,
      '--mount', `type=bind,src=${cache},dst=/cache`, '--entrypoint', 'python', image,
      '-m', 'manim', '--renderer', 'cairo', '--disable_caching', '--media_dir', '/cache/media',
      ...(probe ? ['--save_last_frame'] : []), '/work/manim/normal.py', 'NormalStandardization'], {stdio: ['ignore', log, log]});
  } catch (error) {
    console.error((await readFile(path.join(cache, 'render.log'), 'utf8')).split('\n').slice(-45).join('\n'));
    throw new Error(`Manim render failed: ${error.status}`);
  } finally {closeSync(log);}
  if (!probe) await copyFile(path.join(cache, 'media/videos/normal/720p30/NormalStandardization.mp4'), path.join(output, 'video.mp4'));
  console.log(`Manim ${probe ? 'composition probe' : 'video'} complete; log: ${path.join(cache, 'render.log')}`);
} else {
  const {bundle} = requireEngine('@remotion/bundler');
  const {ensureBrowser, openBrowser, selectComposition, renderMedia, renderStill} = requireEngine('@remotion/renderer');
  const root = path.join(comparison, 'remotion');
  process.chdir(root);
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/normal.jsx'), outDir: path.join(cache, 'bundle'), rootDir: root, gitSource: null});
  const available = await ensureBrowser({chromeMode: 'headless-shell'});
  const browser = await openBrowser('chrome', {browserExecutable: available.path, chromeMode: 'headless-shell', logLevel: 'error'});
  try {
    const composition = await selectComposition({serveUrl, id: 'NormalStandardization', puppeteerInstance: browser, logLevel: 'error'});
    assert.equal(composition.durationInFrames, story.frames);
    if (probe) {
      for (const phase of story.phases) {
        const frame = Math.round((phase.start + phase.end) / 2 * story.fps);
        await renderStill({composition, serveUrl, puppeteerInstance: browser, frame, imageFormat: 'png',
          output: path.join(cache, `${phase.id}.png`), logLevel: 'error'});
        console.log(`Remotion probe: ${phase.id}`);
      }
    } else {
      let next = 0;
      await renderMedia({composition, serveUrl, puppeteerInstance: browser, codec: 'h264',
        outputLocation: path.join(output, 'video.mp4'), concurrency: 1, crf: 18, x264Preset: 'medium',
        pixelFormat: 'yuv420p', logLevel: 'error', disallowParallelEncoding: true,
        onProgress: ({progress}) => {
          const percent = Math.floor(progress * 100);
          if (percent >= next) {console.log(`Remotion: ${percent}%`); next = percent + 10;}
        }});
    }
  } finally {await browser.close({silent: true});}
}

if (!probe) {
  const ffmpeg = requireEngine('ffmpeg-static');
  const ffprobe = requireEngine('ffprobe-static').path;
  const metadata = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', path.join(output, 'video.mp4')], {encoding: 'utf8'}));
  const video = metadata.streams.find(stream => stream.codec_type === 'video');
  assert.equal(Number(video.nb_read_frames), story.frames);
  assert.equal(video.avg_frame_rate, '30/1');
  assert.equal(video.width, story.width);
  assert.equal(video.height, story.height);
  assert(Math.abs(Number(video.duration) - story.duration) < 0.04);
  assert(!metadata.streams.some(stream => stream.codec_type === 'audio'));
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', '38', '-i', path.join(output, 'video.mp4'), '-frames:v', '1', '-q:v', '2', path.join(output, 'poster.jpg')]);
  for (const phase of story.phases) {
    const time = (phase.start + phase.end) / 2;
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(time), '-i', path.join(output, 'video.mp4'), '-frames:v', '1', path.join(cache, `${phase.id}.png`)]);
  }
  console.log(JSON.stringify({engine, frames: Number(video.nb_read_frames), width: video.width, height: video.height, duration: video.duration}));
}