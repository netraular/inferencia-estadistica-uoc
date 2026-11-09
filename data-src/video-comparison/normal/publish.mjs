import assert from 'node:assert/strict';
import {readFile, writeFile, copyFile, mkdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const comparison = path.dirname(directory);
const repository = path.resolve(comparison, '../..');
const output = path.join(repository, 'static/comparativa-videos/normal');
const story = JSON.parse(await readFile(path.join(directory, 'storyboard.json'), 'utf8'));
const engine = createRequire(path.join(comparison, 'remotion/package.json'));
const ffprobe = engine('ffprobe-static').path;
const sourcePaths = {
  manim: ['manim/normal.py'],
  remotion: ['remotion/src/normal.jsx', 'remotion/src/normal-chart.jsx', 'remotion/src/normal-formula.jsx'],
  shared: ['normal/storyboard.json', 'normal/render.mjs'],
};
const sources = {};
const results = [];
await mkdir(output, {recursive: true});
for (const [technology, files] of Object.entries(sourcePaths)) {
  sources[technology] = [];
  for (const file of files) {
    const content = await readFile(path.join(comparison, file), 'utf8');
    sources[technology].push({name: file, content, lines: content.trimEnd().split('\n').length,
      language: file.endsWith('.py') ? 'python' : file.endsWith('.json') ? 'json' : file.endsWith('.jsx') ? 'jsx' : 'javascript'});
  }
  if (technology === 'shared') continue;
  const movie = path.join(output, technology, 'video.mp4');
  const metadata = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', movie], {encoding: 'utf8'}));
  const video = metadata.streams.find(stream => stream.codec_type === 'video');
  assert.equal(Number(video.nb_read_frames), story.frames);
  assert.equal(video.width, story.width);
  assert.equal(video.height, story.height);
  assert.equal(video.avg_frame_rate, '30/1');
  assert(Math.abs(Number(video.duration) - story.duration) < 0.04);
  assert(!metadata.streams.some(stream => stream.codec_type === 'audio'));
  await stat(path.join(output, technology, 'poster.jpg'));
  const bytes = await readFile(movie);
  results.push({id: technology, frames: story.frames, fps: story.fps, width: video.width, height: video.height,
    duration: Number(video.duration), audio: false, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sceneLines: sources[technology][0].lines, sourceLines: sources[technology].reduce((sum, file) => sum + file.lines, 0)});
}
await writeFile(path.join(output, 'sources.json'), JSON.stringify(sources, null, 2));
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
await copyFile(path.join(directory, 'storyboard.json'), path.join(output, 'storyboard.json'));
await copyFile(path.join(directory, 'README.md'), path.join(output, 'README.md'));
const archivePaths = [...Object.values(sourcePaths).flat(), 'normal/README.md', 'normal/publish.mjs',
  'remotion/src/style.css', 'remotion/package.json', 'remotion/package-lock.json'];
execFileSync('tar', ['-czf', path.join(output, 'source.tar.gz'), '-C', repository,
  ...archivePaths.map(file => `data-src/video-comparison/${file}`)]);
console.log(JSON.stringify(results, null, 2));