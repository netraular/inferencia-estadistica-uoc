import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {buildCatalogue} from './tts/gemini-course.mjs';
import {compatibleCourseVideo} from '../pages/inferencia/exercise-solutions.js';
import {prepareTranscriptItem, sampleFrames, sha256} from '../data-src/course-videos/course-contract.mjs';
import {verifyMedia} from '../data-src/course-videos/course-media.mjs';
import {courseTimeline} from '../data-src/course-videos/course-frame.mjs';
import {validateFrozenCatalogue} from '../data-src/course-videos/transcript-batch.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const json = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const save = (filename, value) => {
  const temporary = `${filename}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, filename);
};

export function silentEntry(item, metadata, transcript) {
  assert.equal(metadata.id, item.id);
  assert.equal(metadata.complete, true);
  assert.equal(metadata.sceneEngine, 'native-svg');
  assert.equal(metadata.silent, true);
  assert.equal(metadata.temporary, true);
  assert.equal(metadata.canonicalSha256, item.canonicalSha256);
  assert.equal(metadata.transcriptSha256, sha256(JSON.stringify(transcript)));
  assert.equal(metadata.sourceSnapshot.itemSha256, sha256(JSON.stringify(item)));
  assert.ok(metadata.evidence?.layout?.length);
  assert.ok(metadata.evidence.layout.every(frame => frame.errors.length === 0));
  const {evidence, ...entry} = metadata;
  Object.assign(entry, {transcript, publication:'silent-transcript'});
  assert.ok(compatibleCourseVideo(item.animation, undefined, entry), `${item.id}: incompatible silent video`);
  return entry;
}

export async function publishCompleted({batch, root = ROOT, verify} = {}) {
  assert.ok(path.isAbsolute(batch), 'An absolute batch path is required');
  const catalogueBytes = fs.readFileSync(path.join(batch, 'catalogue.json'));
  const catalogue = validateFrozenCatalogue(JSON.parse(catalogueBytes));
  const selection = json(path.join(batch, 'selection.json'));
  assert.equal(sha256(JSON.stringify(selection)), json(path.join(batch, 'selection.sha256.json')).sha256);
  assert.equal(selection.catalogueSha256, sha256(catalogueBytes));
  const progress = json(path.join(batch, 'progress.json'));
  const current = new Map((await buildCatalogue({source:root})).items.map(item => [item.id, item]));
  const manifestPath = path.join(root, 'static/videos/manifest.json');
  const manifest = json(manifestPath);
  const audio = json(path.join(root, 'static/audio/manifest.json'));
  const require = createRequire(path.join(root, 'data-src/course-videos/package.json'));
  const bundledFfmpeg = require('ffmpeg-static');
  const bundledFfprobe = require('ffprobe-static').path;
  const ffmpeg = fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : '/usr/bin/ffmpeg';
  const ffprobe = fs.existsSync(bundledFfprobe) ? bundledFfprobe : '/usr/bin/ffprobe';
  const updated = [];
  for (const item of catalogue.items) {
    if (progress.items[item.id]?.state !== 'complete') continue;
    const live = current.get(item.id);
    assert.equal(live?.canonicalSha256, item.canonicalSha256, `${item.id}: live lesson differs from frozen video`);
    const directory = path.join(batch, 'videos', item.id);
    const metadata = json(path.join(directory, 'metadata.json'));
    const existing = manifest.lessons[item.id];
    if (existing && !existing.silent && compatibleCourseVideo(live.animation, audio.lessons[item.id], existing)) continue;
    if (existing?.videoSha256 === metadata.videoSha256 && existing?.silent === true) continue;
    const transcript = json(path.join(directory, 'transcript.json'));
    const entry = silentEntry(item, metadata, transcript);
    const storyboard = prepareTranscriptItem(item, selection.timing, {native:true});
    assert.deepEqual(transcript, courseTimeline(storyboard));
    const video = path.join(directory, 'video.mp4');
    const poster = path.join(directory, 'poster.jpg');
    const verification = (verify || verifyMedia)({ffmpeg, ffprobe, video, poster, storyboard, frames:sampleFrames(storyboard)});
    assert.equal(verification.videoSha256, entry.videoSha256);
    assert.equal(verification.posterSha256, entry.posterSha256);
    assert.equal(sha256(fs.readFileSync(video)), entry.videoSha256);
    assert.equal(sha256(fs.readFileSync(poster)), entry.posterSha256);
    const destination = path.join(root, 'static/videos', item.id);
    fs.mkdirSync(destination, {recursive:true});
    for (const name of ['video.mp4', 'poster.jpg']) {
      const temporary = path.join(destination, `.${name}.${process.pid}.tmp`);
      fs.copyFileSync(path.join(directory, name), temporary);
      fs.renameSync(temporary, path.join(destination, name));
    }
    save(path.join(destination, 'metadata.json'), entry);
    manifest.lessons[item.id] = entry;
    updated.push(item.id);
  }
  if (updated.length) save(manifestPath, manifest);
  const coverage = {total:current.size, published:Object.values(manifest.lessons).filter(entry => compatibleCourseVideo(current.get(entry.id)?.animation, audio.lessons[entry.id], entry)).length, updated};
  console.log(`VIDEO_PUBLICATION ${JSON.stringify(coverage)}`);
  return coverage;
}

async function main() {
  const args = process.argv.slice(2);
  assert.ok(args[0] === '--batch' && args[1] && args.length === 2, 'Usage: node scripts/publish-course-videos.mjs --batch /absolute/batch');
  await publishCompleted({batch:args[1]});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {console.error(error); process.exitCode = 1;});