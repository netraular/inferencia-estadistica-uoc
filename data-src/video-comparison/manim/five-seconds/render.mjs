import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const shared = path.resolve(source, '../../five-seconds');
const cache = path.join(source, '.cache');
const output = path.resolve(source, '../../../../static/comparativa-videos/cinco-segundos/manim');
const image = 'manimcommunity/manim@sha256:ab5ad56cf685d89da96e5d459e0cde3743fbdf2141be4dcff6c26566b5ca3191';
const brief = JSON.parse(readFileSync(path.join(shared, 'brief.json'), 'utf8'));
for (const directory of [cache, path.join(cache, 'home'), path.join(cache, 'media'), output]) {
  mkdirSync(directory, {recursive: true});
}
const docker = [
  'run', '--rm', '--pull', 'never', '--network', 'none', '--cpus', '1', '--memory', '2g',
  '--user', `${process.getuid()}:${process.getgid()}`, '--workdir', '/source',
  '--env', 'HOME=/cache/home', '--env', 'XDG_CACHE_HOME=/cache/home',
  '--env', 'MPLCONFIGDIR=/cache/home/matplotlib', '--env', 'PYTHONDONTWRITEBYTECODE=1',
  '--volume', `${source}:/source:ro`, '--volume', `${shared}:/brief:ro`,
  '--volume', `${cache}:/cache:rw`,
];
const run = (binary, args, options = {}) => execFileSync(binary, args, {stdio: 'inherit', ...options});
const clock = command => run(process.execPath, [path.join(shared, 'clock.mjs'), command, 'manim']);

if (process.argv.includes('--check')) {
  const check = [
    'import ast, inspect, runpy, manim',
    'from pathlib import Path',
    "ast.parse(Path('/source/scene.py').read_text())",
    "scene = runpy.run_path('/source/scene.py')",
    "assert issubclass(scene['ComplementScene'], manim.Scene)",
    "assert 'run_time' in inspect.signature(manim.Animation.__init__).parameters",
    "assert abs(manim.config.frame_width / manim.config.frame_height - 1280 / 720) < 1e-12",
    "print('Syntax/API OK; Manim', manim.__version__)",
  ].join('\n');
  run('docker', [...docker, '--entrypoint', 'python', image, '-c', check]);
} else {
  clock('render-start');
  try {
    run('docker', [...docker, '--entrypoint', 'manim', image,
      '--resolution', `${brief.width},${brief.height}`, '--fps', String(brief.fps),
      '--renderer', 'cairo', '--disable_caching', '--media_dir', '/cache/media',
      '--format', 'mp4', '-o', 'video', '/source/scene.py', 'ComplementScene']);
  } finally {
    clock('render-end');
  }
  const movie = path.join(output, 'video.mp4');
  copyFileSync(path.join(cache, 'media/videos/scene/720p30/video.mp4'), movie);
  const runtime = createRequire(path.resolve(source, '../../remotion/package.json'));
  const ffmpeg = runtime('ffmpeg-static');
  const metadata = JSON.parse(run(runtime('ffprobe-static').path,
    ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', movie],
    {stdio: 'pipe', encoding: 'utf8'}));
  const video = metadata.streams.find(stream => stream.codec_type === 'video');
  assert.equal(Number(video.nb_read_frames), brief.frames);
  assert.equal(video.width, brief.width);
  assert.equal(video.height, brief.height);
  assert.equal(video.avg_frame_rate, `${brief.fps}/1`);
  assert.equal(Number(video.duration), brief.duration);
  assert(!metadata.streams.some(stream => stream.codec_type === 'audio'));
  run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '4.2', '-i', movie,
    '-frames:v', '1', '-q:v', '2', path.join(output, 'poster.jpg')]);
  const samples = [0.5, 1.5, 3.5].map(time => run(ffmpeg,
    ['-v', 'error', '-ss', String(time), '-i', movie, '-frames:v', '1',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'],
    {stdio: 'pipe', maxBuffer: brief.width * brief.height * 3 + 1024}));
  const pixel = (frame, horizontal, vertical) => Array.from(frame.subarray(
    (vertical * brief.width + horizontal) * 3, (vertical * brief.width + horizontal) * 3 + 3));
  const rgb = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  for (const frame of samples) {
    assert.equal(frame.length, brief.width * brief.height * 3);
    for (const [horizontal, color] of [[180, brief.green], [1100, brief.coral]]) {
      assert(pixel(frame, horizontal, 410).every((value, index) => Math.abs(value - rgb(color)[index]) < 12));
    }
  }
  const formulaRegion = frame => {
    const rows = [];
    for (let vertical = 210; vertical < 285; vertical++) {
      rows.push(frame.subarray((vertical * brief.width + 200) * 3, (vertical * brief.width + 1080) * 3));
    }
    return Buffer.concat(rows);
  };
  assert(!formulaRegion(samples[0]).equals(formulaRegion(samples[1])));
  assert(!formulaRegion(samples[1]).equals(formulaRegion(samples[2])));
  const validation = {
    frames: Number(video.nb_read_frames), width: video.width, height: video.height,
    fps: video.avg_frame_rate, duration: Number(video.duration), audio: false,
    sampledPhaseTimes: [0.5, 1.5, 3.5], barColors: 'passed', distinctFormulas: 'passed',
  };
  writeFileSync(path.join(cache, 'validation.json'), JSON.stringify(validation, null, 2));
  console.log(JSON.stringify(validation));
}