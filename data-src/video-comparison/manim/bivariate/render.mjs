import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const cache = path.join(here, '.cache');
const shared = path.join(root, 'static/comparativa-videos/bivariante/shared');
const output = path.join(root, 'static/comparativa-videos/bivariante/manim');
const image = 'manimcommunity/manim@sha256:ab5ad56cf685d89da96e5d459e0cde3743fbdf2141be4dcff6c26566b5ca3191';
const statePath = path.join(cache, 'state.json');
const args = process.argv.slice(2);
const mode = args.find(value => ['--probe', '--preview', '--render', '--verify'].includes(value)) || '--probe';
const require = createRequire(path.join(root, 'data-src/video-comparison/remotion/package.json'));
const ffmpeg = require('ffmpeg-static');
const ffprobe = require('ffprobe-static').path;

function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

async function execute(command, commandArgs, logName) {
  const log = fs.openSync(path.join(cache, logName), 'w');
  const started = performance.now();
  const child = spawn(command, commandArgs, {detached: true, stdio: ['ignore', log, log]});
  fs.closeSync(log);
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (exitCode, signal) => signal ? reject(new Error(`${command}: ${signal}`)) : resolve(exitCode));
  });
  if (code !== 0) throw new Error(`${command} exited ${code}; see ${logName}`);
  return {seconds: (performance.now() - started) / 1000, exitCode: code};
}

function dockerArgs() {
  return [
    'run', '--rm', '--network', 'none', '--cpus=1', '--memory=2g',
    '--user', `${process.getuid()}:${process.getgid()}`,
    '--mount', `type=bind,src=${here},dst=/src,readonly`,
    '--mount', `type=bind,src=${shared},dst=/shared,readonly`,
    '--mount', `type=bind,src=${cache},dst=/cache`,
    '--env', 'HOME=/cache/home', '--env', 'TEX_DIR=/cache/tex',
    '--env', 'MPLCONFIGDIR=/cache/matplotlib', '--env', 'PYTHONDONTWRITEBYTECODE=1',
    '--workdir', '/cache', '--entrypoint', 'python', image,
  ];
}

function findMedia(directory, basename) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = findMedia(filename, basename);
      if (found) return found;
    } else if (entry.name === basename) return filename;
  }
  return undefined;
}

async function probeFile(filename, logName) {
  await execute(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', filename], logName);
  return JSON.parse(fs.readFileSync(path.join(cache, logName), 'utf8'));
}

async function verify(script, audioHash) {
  const video = path.join(output, 'video.mp4');
  const result = await probeFile(video, 'ffprobe-final.json');
  const videoStream = result.streams.find(stream => stream.codec_type === 'video');
  const audioStream = result.streams.find(stream => stream.codec_type === 'audio');
  for (const [actual, expected, name] of [
    [videoStream?.codec_name, 'h264', 'codec'], [videoStream?.width, script.width, 'width'],
    [videoStream?.height, script.height, 'height'], [videoStream?.avg_frame_rate, '30/1', 'fps'],
    [Number(videoStream?.nb_read_frames), script.frames, 'frames'], [audioStream?.codec_name, 'aac', 'audio'],
  ]) if (actual !== expected) throw new Error(`${name}: got ${actual}, expected ${expected}`);
  if (Math.abs(Number(videoStream.duration) - script.duration) > 0.0001) throw new Error('Video stream duration mismatch');
  await execute(ffmpeg, ['-y', '-v', 'error', '-i', path.join(shared, script.audio), '-map', '0:a:0', '-c:a', 'copy', '-f', 'adts', path.join(cache, 'source.aac')], 'extract-source.log');
  await execute(ffmpeg, ['-y', '-v', 'error', '-i', video, '-map', '0:a:0', '-c:a', 'copy', '-f', 'adts', path.join(cache, 'export.aac')], 'extract-export.log');
  const hash = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
  const sourceAacHash = hash(path.join(cache, 'source.aac'));
  const exportAacHash = hash(path.join(cache, 'export.aac'));
  if (sourceAacHash !== exportAacHash) throw new Error('AAC packet payload differs from source');
  const reviewTimes = [0, 3.1, 15.8, 20.8, 23.5, 28, 33.5, 42.8, 47.2, 55.5, 59, 65.4, 73.8];
  const reviewDirectory = path.join(cache, 'review');
  fs.mkdirSync(reviewDirectory, {recursive: true});
  for (const seconds of reviewTimes) {
    await execute(ffmpeg, ['-y', '-v', 'error', '-ss', String(seconds), '-i', video, '-frames:v', '1', '-q:v', '2', path.join(reviewDirectory, `${seconds.toFixed(1)}.jpg`)], `still-${seconds}.log`);
  }
  await execute(ffmpeg, ['-y', '-v', 'error', '-ss', '47.2', '-i', video, '-frames:v', '1', '-q:v', '2', path.join(output, 'poster.jpg')], 'poster.log');
  const verification = {
    audioHash, sourceAacHash, exportAacHash,
    video: {
      codec: videoStream.codec_name, width: videoStream.width, height: videoStream.height,
      fps: videoStream.avg_frame_rate, frames: Number(videoStream.nb_read_frames),
      duration: Number(videoStream.duration), pixelFormat: videoStream.pix_fmt,
    },
    audio: {codec: audioStream.codec_name, sampleRate: audioStream.sample_rate, channels: audioStream.channels, duration: audioStream.duration},
    formatDuration: result.format.duration,
    videoSha256: hash(video), posterSha256: hash(path.join(output, 'poster.jpg')),
    reviewTimes,
  };
  fs.writeFileSync(path.join(cache, 'validation.json'), JSON.stringify(verification, null, 2));
  return verification;
}

async function worker() {
  const startedAt = new Date().toISOString();
  saveState({status: 'running', mode, pid: process.pid, startedAt});
  try {
    const script = JSON.parse(fs.readFileSync(path.join(shared, 'script.json')));
    const audioHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(shared, script.audio))).digest('hex');
    if (audioHash !== script.audioSha256) throw new Error('Common audio hash mismatch');
    let execution;
    let verification;
    if (mode === '--probe') {
      execution = await execute('docker', [...dockerArgs(), '/src/scene.py', '--probe'], 'probe.log');
    } else if (mode === '--verify') {
      verification = await verify(script, audioHash);
    } else {
      const renderArgs = ['-m', 'manim', '--renderer=cairo', '--fps', '30', '-r', '1280,720',
        '--media_dir', '/cache/media', '--disable_caching',
        '--progress_bar', 'none', '--verbosity', 'WARNING'];
      if (mode === '--preview') renderArgs.push('-s', '-o', 'preview');
      else renderArgs.push('--format', 'mp4', '-o', 'silent');
      execution = await execute('docker', [...dockerArgs(), ...renderArgs, '/src/scene.py', 'BivariateScene'], mode === '--preview' ? 'preview.log' : 'render.log');
      if (mode === '--render') {
        const silent = findMedia(path.join(cache, 'media'), 'silent.mp4');
        if (!silent) throw new Error('Manim silent export not found');
        const native = await probeFile(silent, 'ffprobe-native.json');
        const nativeVideo = native.streams.find(stream => stream.codec_type === 'video');
        if (Number(nativeVideo.nb_read_frames) !== script.frames) throw new Error(`Native frame count ${nativeVideo.nb_read_frames} != ${script.frames}`);
        fs.mkdirSync(output, {recursive: true});
        await execute(ffmpeg, ['-y', '-v', 'error', '-i', silent, '-i', path.join(shared, script.audio),
          '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', path.join(output, 'video.mp4')], 'mux.log');
        verification = await verify(script, audioHash);
      }
    }
    saveState({status: 'complete', mode, startedAt, finishedAt: new Date().toISOString(), audioHash, execution, verification});
  } catch (error) {
    saveState({status: 'failed', mode, startedAt, finishedAt: new Date().toISOString(), error: error.message});
    throw error;
  }
}

for (const directory of [cache, path.join(cache, 'home'), path.join(cache, 'tex'), path.join(cache, 'media')]) {
  fs.mkdirSync(directory, {recursive: true});
}

if (args.includes('--status')) {
  console.log(fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : 'No run recorded');
} else if (args.includes('--wait')) {
  const result = await new Promise((resolve, reject) => {
    let watcher;
    const inspect = () => {
      try {
        if (!fs.existsSync(statePath)) return;
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        if (state.status !== 'running') {
          watcher?.close();
          resolve(state);
        }
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          watcher?.close();
          reject(error);
        }
      }
    };
    watcher = fs.watch(cache, (_event, filename) => {
      if (filename === 'state.json') inspect();
    });
    inspect();
  });
  console.log(`MANIM_RESULT ${JSON.stringify(result, null, 2)}`);
  if (result.status !== 'complete') process.exitCode = 1;
} else if (args.includes('--worker')) {
  await worker();
} else {
  if (fs.existsSync(statePath) && JSON.parse(fs.readFileSync(statePath, 'utf8')).status === 'running') {
    throw new Error('Own worker is already running; use --wait or --status instead of starting another export');
  }
  const log = fs.openSync(path.join(cache, 'worker.log'), 'a');
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--worker', mode], {
    detached: true,
    stdio: ['ignore', log, log],
  });
  fs.closeSync(log);
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  console.log(fs.readFileSync(statePath, 'utf8'));
  if (code !== 0) process.exitCode = 1;
}