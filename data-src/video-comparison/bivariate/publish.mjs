import assert from 'node:assert/strict';
import {readFile, writeFile, readdir, copyFile, stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(directory, '../../..');
const output = path.join(repository, 'static/comparativa-videos/bivariante');
const runtime = createRequire(path.join(directory, '../remotion/package.json'));
const ffmpeg = runtime('ffmpeg-static');
const ffprobe = runtime('ffprobe-static').path;
const script = JSON.parse(await readFile(path.join(output, 'shared/script.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const payload = file => execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-map', '0:a:0', '-c:a', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], {encoding: 'utf8'}).trim();
const originalPayload = payload(path.join(output, 'shared/audio.m4a'));
assert.equal(hash(await readFile(path.join(output, 'shared/audio.m4a'))), script.audioSha256);
const results = [];
const sources = {};
for (const id of ['manim', 'remotion']) {
  const folder = path.join(output, id);
  const video = path.join(folder, 'video.mp4');
  const metadata = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', video], {encoding: 'utf8'}));
  const stream = metadata.streams.find(item=>item.codec_type === 'video');
  const audio = metadata.streams.find(item=>item.codec_type === 'audio');
  assert.equal(stream.codec_name, 'h264');
  assert.equal(stream.width, script.width);
  assert.equal(stream.height, script.height);
  assert.equal(stream.avg_frame_rate, `${script.fps}/1`);
  assert.equal(Number(stream.nb_read_frames), script.frames);
  assert(Math.abs(Number(stream.duration) - script.duration) < 0.001);
  assert.equal(audio.codec_name, 'aac');
  assert.equal(payload(video), originalPayload);
  execFileSync(ffmpeg, ['-v', 'error', '-xerror', '-i', video, '-f', 'null', '-']);
  const sourceFolder = path.join(repository, 'data-src/video-comparison', id, 'bivariate');
  const sceneName = id === 'manim' ? 'scene.py' : 'scene.jsx';
  const files = (await readdir(sourceFolder)).filter(name=>/\.(py|jsx|mjs|css)$/.test(name));
  files.sort((left,right)=>left === sceneName ? -1 : right === sceneName ? 1 : left.localeCompare(right));
  sources[id] = await Promise.all(files.map(async name => {
    const content = await readFile(path.join(sourceFolder, name), 'utf8');
    const lines = content.split('\n').length - Number(content.endsWith('\n'));
    const role = name === sceneName ? 'scene' : name === 'style.css' ? 'style' : /^(render|worker|math)\.mjs$/.test(name) ? 'export-and-validation' : 'scene-helper';
    return {name, role, language: name.endsWith('.py') ? 'python' : name.endsWith('.css') ? 'css' : 'jsx', lines, sha256: hash(Buffer.from(content)), content};
  }));
  await copyFile(path.join(sourceFolder, 'REPORT.md'), path.join(folder, 'REPORT.md'));
  execFileSync('tar', ['-czf', path.join(folder, 'source.tar.gz'), '--exclude=.cache', '-C', repository,
    `data-src/video-comparison/${id}/bivariate`, 'data-src/video-comparison/bivariate/BRIEF.md',
    'data-src/video-comparison/remotion/package.json', 'data-src/video-comparison/remotion/package-lock.json',
    'static/comparativa-videos/bivariante/shared/script.json', 'static/comparativa-videos/bivariante/shared/audio.m4a']);
  results.push({id, width: stream.width, height: stream.height, fps: script.fps, frames: Number(stream.nb_read_frames), duration: Number(stream.duration),
    bytes: (await stat(video)).size, sha256: hash(await readFile(video)), audioPayloadSha256: originalPayload.split('=')[1], audioSourceSha256: script.audioSha256,
    sceneLines: sources[id].find(file=>file.role === 'scene').lines,
    sceneAndHelperLines: sources[id].filter(file=>['scene','scene-helper'].includes(file.role)).reduce((sum,file)=>sum+file.lines,0),
    allCodeLines: sources[id].reduce((sum,file)=>sum+file.lines,0), fullDecodePassed: true});
}
await copyFile(path.join(directory, 'BRIEF.md'), path.join(output, 'shared/BRIEF.md'));
await copyFile(path.join(directory, 'README.md'), path.join(output, 'README.md'));
await writeFile(path.join(output, 'sources.json'), JSON.stringify(sources, null, 2));
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));