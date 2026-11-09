import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(directory, '../../..');
const shared = path.join(repository, 'static/comparativa-videos/bivariante/shared');
const runtime = createRequire(path.join(directory, '../remotion/package.json'));
const statistics = runtime('jstat');
const manifest = JSON.parse(await readFile(path.join(repository, 'static/audio/manifest.json'), 'utf8'));
const sections = [
  {id: 'normal-bivariante--media-y-varianza-condicional', duration: 41.4},
  {id: 'normal-bivariante--cola-condicional', duration: 33.7},
];
let offset = 0;
const cues = [];
const sources = [];
for (const section of sections) {
  const entry = manifest.lessons[section.id];
  assert(entry && section.duration <= entry.duration);
  const audio = path.join(repository, 'static', entry.src);
  sources.push({id: section.id, src: entry.src, selectedDuration: section.duration,
    originalSha256: createHash('sha256').update(await readFile(audio)).digest('hex')});
  for (const cue of entry.scenes[0].cues) {
    if (cue.end <= section.duration + 0.001) cues.push({...cue, start: cue.start + offset, end: cue.end + offset, sectionId: section.id});
  }
  offset += section.duration;
}
assert(Math.abs(offset - 75.1) < 1e-8);
const parameters = {meanX: 30, meanY: 70, sigmaX: 5, sigmaY: 8, rho: 0.25, observedX: 40, thresholdY: 82};
const mean = parameters.meanY + parameters.rho * parameters.sigmaY / parameters.sigmaX * (parameters.observedX - parameters.meanX);
const variance = parameters.sigmaY ** 2 * (1 - parameters.rho ** 2);
const standardDeviation = Math.sqrt(variance);
const z = (parameters.thresholdY - mean) / standardDeviation;
const tail = 1 - statistics.normal.cdf(z, 0, 1);
assert.equal(mean, 74);
assert.equal(variance, 60);
await mkdir(shared, {recursive: true});
execFileSync(runtime('ffmpeg-static'), ['-y', '-v', 'error',
  '-i', path.join(repository, 'static', sources[0].src), '-i', path.join(repository, 'static', sources[1].src),
  '-filter_complex', '[0:a]atrim=0:41.4,asetpts=PTS-STARTPTS[a0];[1:a]atrim=0:33.7,asetpts=PTS-STARTPTS[a1];[a0][a1]concat=n=2:v=0:a=1[out]',
  '-map', '[out]', '-ar', '48000', '-ac', '1', '-c:a', 'aac', '-b:a', '128k', path.join(shared, 'audio.m4a')]);
const script = {id: 'bivariate-conditional', title: 'De la normal conjunta al corte condicional', width: 1280, height: 720, fps: 30,
  duration: 75.1, frames: 2253, audio: 'audio.m4a',
  audioSha256: createHash('sha256').update(await readFile(path.join(shared, 'audio.m4a'))).digest('hex'),
  sources, parameters, expected: {mean, variance, standardDeviation, z, tail}, cues,
  selection: {lessonId: 'normal-bivariante', sections: sections.map(section=>section.id),
    reason: 'Coordinate joint contours or surface, an exact X cut, conditional normalization, moving mean, reduced variance, standardization and shaded tail.'}};
await writeFile(path.join(shared, 'script.json'), JSON.stringify(script, null, 2));
console.log(JSON.stringify({duration: script.duration, frames: script.frames, cues: cues.length, expected: script.expected, audioSha256: script.audioSha256}, null, 2));