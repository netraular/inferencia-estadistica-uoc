import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assembleItem, canonicalAnimation, probeAudio} from '../../scripts/tts/gemini-course.mjs';
import {selectItems, sha256, withCourseVisuals} from './course-contract.mjs';

export function partialPreviewItem(original, includedCues) {
  const total = original.animation.steps.reduce((count, step) => count + step.cues.length, 0);
  assert.ok(Number.isInteger(includedCues) && includedCues > 0 && includedCues < total, 'Preview must be a strict spoken prefix');
  const item = structuredClone(withCourseVisuals(original));
  item.id = `${original.id}--avance`;
  item.title = `Avance parcial: ${original.title}`;
  item.preview = true;
  item.originalId = original.id;
  item.originalCanonicalSha256 = original.canonicalSha256;
  item.partialCoverage = {includedCues, originalTotalCues:total, firstCue:0, lastCue:includedCues - 1};
  item.animation.id = item.id;
  item.animation.title = item.title;
  let remaining = includedCues;
  item.animation.steps = item.animation.steps.flatMap(step => {
    if (!remaining) return [];
    step.cues = step.cues.slice(0, remaining);
    remaining -= step.cues.length;
    step.caption = step.cues.map(cue => cue.text).join(' ');
    step.duration = step.cues.at(-1).end - step.cues[0].start;
    if (step.visual?.lines) step.visual.lines = step.visual.lines.filter(line => !Number.isInteger(line.cue) || line.cue < step.cues.length);
    if (step.visual?.phases) step.visual.phases = step.visual.phases.slice(0, step.cues.length);
    return [step];
  });
  item.canonicalSha256 = sha256(JSON.stringify(canonicalAnimation(item.animation)));
  return item;
}

export function assemblePreviewBatch(sourceBatch, outputBatch, {id = 'proporciones--parte-y-total', includedCues = 6} = {}) {
  assert.ok(path.isAbsolute(sourceBatch) && path.isAbsolute(outputBatch), 'Batch paths must be absolute');
  sourceBatch = fs.realpathSync(sourceBatch);
  outputBatch = path.resolve(outputBatch);
  const relative = path.relative(path.join(sourceBatch, 'previews'), outputBatch);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Output must be a new batch under source previews/');
  assert.ok(!fs.existsSync(outputBatch), 'Use a fresh preview batch');
  const catalogueBytes = fs.readFileSync(path.join(sourceBatch, 'catalogue.json'));
  const originalCatalogue = JSON.parse(catalogueBytes);
  const sourceState = JSON.parse(fs.readFileSync(path.join(sourceBatch, 'progress.json'), 'utf8'));
  const sourceCatalogueSha256 = sha256(catalogueBytes);
  assert.equal(sourceState.catalogueSha256, sourceCatalogueSha256, 'Original catalogue changed');
  const original = selectItems(originalCatalogue, {ids:[id]})[0];
  assert.equal(original.canonicalSha256, sha256(JSON.stringify(canonicalAnimation(original.animation))), 'Original canonical content changed');
  const item = partialPreviewItem(original, includedCues);
  const fragments = [];
  let index = 0;
  for (const [sceneIndex, step] of item.animation.steps.entries()) for (const [cueIndex, cue] of step.cues.entries()) {
    const record = sourceState.items[id]?.cues[index];
    assert.equal(record?.status, 'complete', `Cue ${index} is not complete`);
    const signature = {version:1, catalogueSha256:sourceCatalogueSha256, id, text:cue.text, sceneIndex, cueIndex, index};
    assert.equal(record.signature, sha256(JSON.stringify(signature)), `Cue ${index} source signature changed`);
    const filename = path.join(sourceBatch, 'items', id, 'cues', `${String(index).padStart(6, '0')}.wav`);
    assert.ok(fs.lstatSync(filename).isFile(), 'Cue must be a regular WAV file');
    const bytes = fs.readFileSync(filename);
    assert.equal(sha256(bytes), record.wavSha256, `Cue ${index} checksum changed`);
    const measured = probeAudio(filename);
    assert.equal(measured.codec, 'pcm_s16le');
    assert.equal(record.measuredBy, 'ffprobe');
    assert.equal(record.sampleRate, 24000);
    assert.ok(Math.abs(measured.duration - record.frames / 24000) <= 1 / 24000, 'Cue duration changed');
    fragments.push({index, sceneIndex, cueIndex, text:cue.text, bytes, record:structuredClone(record)});
    index++;
  }
  const provenance = {sourceBatch, sourceCatalogueSha256, originalId:id, originalCanonicalSha256:original.canonicalSha256,
    partialCoverage:item.partialCoverage, fragments:fragments.map(({index, record}) => ({index, signature:record.signature, wavSha256:record.wavSha256, frames:record.frames}))};
  const catalogue = {...originalCatalogue, preview:true, exerciseCount:0, provenance, items:[item]};
  const frozen = JSON.stringify(catalogue, null, 2) + '\n';
  const state = {version:1, preview:true, catalogueSha256:sha256(frozen), items:{[item.id]:{status:'complete', cues:{}}}};
  fs.mkdirSync(path.join(outputBatch, 'items', item.id, 'cues'), {recursive:true, mode:0o700});
  assert.equal(fs.realpathSync(outputBatch), outputBatch, 'Preview output must not use symlinks');
  fs.writeFileSync(path.join(outputBatch, 'catalogue.json'), frozen, {flag:'wx', mode:0o600});
  for (const {index, sceneIndex, cueIndex, text, bytes, record} of fragments) {
    fs.writeFileSync(path.join(outputBatch, 'items', item.id, 'cues', `${String(index).padStart(6, '0')}.wav`), bytes, {flag:'wx', mode:0o600});
    state.items[item.id].cues[index] = {...record, signature:sha256(JSON.stringify({version:1, catalogueSha256:state.catalogueSha256, id:item.id, text, sceneIndex, cueIndex, index}))};
  }
  const audio = assembleItem(outputBatch, item, state);
  const metadata = {...audio, preview:true, provenance};
  fs.writeFileSync(path.join(outputBatch, 'items', item.id, 'audio.json'), JSON.stringify(metadata, null, 2) + '\n', {mode:0o600});
  return {batch:outputBatch, id:item.id, preview:true, duration:audio.duration, partialCoverage:item.partialCoverage, phrases:fragments.map(fragment => fragment.text)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 4, 'Usage: node preview-course.mjs /absolute/source-batch /absolute/source-batch/previews/new-batch');
    console.log(JSON.stringify(assemblePreviewBatch(process.argv[2], process.argv[3]), null, 2));
  } catch (error) {console.error(error); process.exitCode = 1;}
}