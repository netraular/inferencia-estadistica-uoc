import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {VIDEO} from './course-frame.mjs';
import {enrichLessonAnimation, enrichGlobalAnimation} from '../../pages/inferencia/lesson-visuals.js';

export {VIDEO, courseFrame, sampleFrames} from './course-frame.mjs';
export const MODEL = 'gemini-3.8-flash-tts';
export const VOICE = 'Puck';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

export function selectItems(catalogue, {ids, limit} = {}) {
  assert.equal(catalogue.version, 1, 'Unsupported catalogue version');
  assert.equal(catalogue.model, MODEL, 'Incompatible catalogue model');
  assert.equal(catalogue.voice, VOICE, 'Incompatible catalogue voice');
  assert.ok(Array.isArray(catalogue.items) && catalogue.items.length, 'Empty catalogue');
  const known = new Set();
  for (const item of catalogue.items) {
    assert.ok(typeof item.id === 'string' && /^[a-z0-9]+(?:(?:-{1,2}|\.)[a-z0-9]+)*$/.test(item.id), 'Unsafe item id');
    assert.ok(!known.has(item.id), `Duplicate item ${item.id}`);
    known.add(item.id);
  }
  if (ids) for (const id of ids) assert.ok(known.has(id), `Unknown item ${id}`);
  if (limit !== undefined) assert.ok(Number.isInteger(limit) && limit > 0, 'Invalid limit');
  const selected = ids ? catalogue.items.filter(item => ids.includes(item.id)) : catalogue.items;
  return selected.slice(0, limit ?? selected.length);
}

export function validateCourseAudio(item, audio, {aligned = false} = {}) {
  assert.ok(['section', 'recap', 'exercise'].includes(item.kind), 'Unsupported item kind');
  assert.ok(item.title && item.animation?.steps?.length, 'Missing frozen animation');
  assert.ok(digest(item.canonicalSha256), 'Missing canonical hash');
  assert.equal(audio.id, item.id, 'Audio id mismatch');
  assert.equal(audio.model, MODEL, 'Incompatible audio model');
  assert.equal(audio.voice, VOICE, 'Incompatible audio voice');
  assert.equal(audio.cueTiming, aligned ? 'forced-aligned' : 'measured', aligned ? 'Aligned audio cues must be forced-aligned' : 'Audio cues must be measured');
  if (aligned) {
    assert.equal(audio.temporary, true, 'Aligned audio must remain provisional');
    assert.equal(audio.listened, false, 'Automatic alignment is not listening review');
    assert.equal(typeof audio.needsReview, 'boolean', 'Missing alignment review status');
    assert.ok(digest(audio.alignmentSha256), 'Missing alignment provenance');
  }
  assert.equal(audio.canonicalSha256, item.canonicalSha256, 'Stale canonical audio');
  assert.ok(digest(audio.mp3Sha256), 'Missing audio MP3 hash');
  assert.ok(Number.isInteger(audio.mp3Bytes) && audio.mp3Bytes > 0, 'Invalid audio MP3 size');
  assert.ok(finite(audio.duration) && audio.duration > 0, 'Invalid audio duration');
  assert.equal(audio.scenes?.length, item.animation.steps.length, 'Scene count mismatch');
  let previousEnd = 0;
  for (const [index, scene] of audio.scenes.entries()) {
    const step = item.animation.steps[index];
    assert.ok(finite(scene.start) && finite(scene.end) && scene.start >= previousEnd && scene.end > scene.start && scene.end <= audio.duration + 0.001, `Invalid scene ${index} timing`);
    assert.ok(Array.isArray(step.cues) && step.cues.length > 0, `Missing original cues ${index}`);
    assert.equal(scene.cues?.length, step.cues.length, `Cue count mismatch ${index}`);
    let cueEnd = scene.start;
    for (const [cueIndex, cue] of scene.cues.entries()) {
      assert.equal(cue.text, step.cues[cueIndex].text ?? step.cues[cueIndex], `Stale cue ${index}/${cueIndex}`);
      assert.ok(finite(cue.start) && finite(cue.end) && cue.start >= cueEnd && cue.end > cue.start && cue.start >= scene.start && cue.end <= scene.end + 0.001, `Invalid cue ${index}/${cueIndex} timing`);
      cueEnd = cue.end;
    }
    previousEnd = scene.end;
  }
}

export function prepareCourseItem(item, audio, mp3, {native = false, aligned = false} = {}) {
  validateCourseAudio(item, audio, {aligned});
  assert.equal(audio.mp3Sha256, sha256(mp3), 'Audio MP3 hash mismatch');
  assert.equal(audio.mp3Bytes, mp3.length, 'Audio MP3 size mismatch');
  return {...VIDEO, frames:Math.ceil(audio.duration * VIDEO.fps), duration:audio.duration, item, animation:native ? item.animation : withCourseVisuals(item).animation, audio,
    ...(aligned ? {narrationMode:'forced-aligned'} : {})};
}

export const TRANSCRIPT_TIMING = Object.freeze({wordsPerMinute:140, pauseSeconds:0.3, minimumCueSeconds:1.2});

export function prepareTranscriptItem(item, timing = TRANSCRIPT_TIMING, {native = false} = {}) {
  assert.ok(['section', 'recap', 'exercise'].includes(item.kind), 'Unsupported item kind');
  assert.ok(item.title && item.animation?.steps?.length, 'Missing frozen animation');
  assert.ok(digest(item.canonicalSha256), 'Missing canonical hash');
  assert.deepEqual(timing, TRANSCRIPT_TIMING, 'Unsupported transcript timing policy');
  let cursor = 0;
  const pauseFrames = Math.round(timing.pauseSeconds * VIDEO.fps);
  const scenes = item.animation.steps.map((step, sceneIndex) => {
    assert.ok(step.cues?.length, `Missing original cues ${sceneIndex}`);
    const sceneStart = cursor;
    const cues = step.cues.map((original, cueIndex) => {
      const text = original.text ?? original;
      assert.ok(typeof text === 'string' && text.trim(), 'Missing original cue text');
      const words = text.trim().split(/\s+/u).length;
      const startFrame = cursor;
      const speechFrames = Math.ceil(Math.max(timing.minimumCueSeconds, words * 60 / timing.wordsPerMinute) * VIDEO.fps);
      cursor += speechFrames + pauseFrames;
      return {text, start:startFrame / VIDEO.fps, end:(startFrame + speechFrames) / VIDEO.fps,
        startFrame, endFrame:startFrame + speechFrames, words, sceneIndex, cueIndex,
        sourceCueSha256:sha256(JSON.stringify(original))};
    });
    return {start:sceneStart / VIDEO.fps, end:cursor / VIDEO.fps, cues};
  });
  const transcript = {id:item.id, narrationMode:'transcript', cueTiming:'estimated', temporary:true, silent:true,
    canonicalSha256:item.canonicalSha256, timing:{...timing}, duration:cursor / VIDEO.fps, scenes};
  return {...VIDEO, frames:cursor, duration:transcript.duration, item, animation:native ? item.animation : withCourseVisuals(item).animation,
    narrationMode:'transcript', transcript};
}

export function withCourseVisuals(item) {
  if (item.kind === 'exercise' || item.animation.steps.every(step => step.visual?.context)) return item;
  const animation = item.kind === 'section' ? enrichLessonAnimation(item.animation) : enrichGlobalAnimation(item.animation);
  const withoutAddedContexts = {...animation, steps:animation.steps.map((step, index) => {
    if (item.animation.steps[index].visual?.context) return step;
    const {context, phases, ...visual} = step.visual || {};
    return {...step, ...(item.animation.steps[index].visual ? {visual} : {})};
  })};
  assert.deepEqual(withoutAddedContexts, item.animation, `${item.id}: visual enrichment changed frozen content`);
  assert.ok(animation.steps.every(step => step.visual?.context), `${item.id}: missing authored initial diagram`);
  return {...item, animation};
}
