import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareTranscriptItem, prepareCourseItem, sha256, TRANSCRIPT_TIMING} from '../data-src/course-videos/course-contract.mjs';
import {courseFrame, sampleFrames} from '../data-src/course-videos/course-frame.mjs';
import {parseOptions, prepareBatchInputs, rendererInputs} from '../data-src/course-videos/render-course.mjs';
import {PUBLISHED_PUCK_IDS, transcriptSelection, prepareTranscriptBatch, loadTranscriptBatch, prepareTranscriptInputs, assertTranscriptResume, assertPublishable, validateFrozenCatalogue, writeProgress} from '../data-src/course-videos/transcript-batch.mjs';
import {canonicalContent} from '../scripts/prepare-media.mjs';

const item = () => ({id:'exercise--c.i', kind:'exercise', title:'Frozen exercise', canonicalSha256:sha256('canonical'),
  animation:{id:'exercise--c.i', steps:[{title:'Original', cues:[{text:'Texto exacto: 2 + 2 = 4.'}, 'Segundo paso.'],
    visual:{lines:[{value:'2 + 2 = 4', cue:0}]}}]}});

test('transcript needs no audio, preserves exact frozen content and estimates consistent frame-quantized timing', () => {
  const source = item();
  const frozen = JSON.stringify(source);
  const board = prepareTranscriptItem(source);
  assert.equal(JSON.stringify(source), frozen);
  assert.deepEqual(board, prepareTranscriptItem(source));
  assert.equal(board.audio, undefined);
  assert.equal(board.transcript.cueTiming, 'estimated');
  assert.equal(board.transcript.narrationMode, 'transcript');
  assert.equal(board.transcript.temporary, true);
  assert.equal(board.transcript.silent, true);
  for (const key of ['voice', 'model', 'measured', 'audioSource', 'audioSha256', 'mp3Sha256']) assert.equal(key in board.transcript, false);
  const cues = board.transcript.scenes[0].cues;
  assert.equal(cues[0].text, source.animation.steps[0].cues[0].text);
  assert.equal(cues[1].text, source.animation.steps[0].cues[1]);
  assert.equal(cues[1].startFrame - cues[0].endFrame, TRANSCRIPT_TIMING.pauseSeconds * board.fps);
  assert.equal(cues[0].endFrame, Math.ceil(cues[0].words * 60 / 140 * board.fps));
  assert.equal(board.frames, cues[1].endFrame + 9);
  assert.equal(cues[0].sourceCueSha256, sha256(JSON.stringify(source.animation.steps[0].cues[0])));
  const initial = courseFrame(board, 0);
  assert.equal(courseFrame(board, cues[1].startFrame).cueIndex, 1);
  assert.deepEqual(courseFrame(board, 0), initial);
  assert.equal(courseFrame(board, cues[0].endFrame + 1).caption, '');
  assert.ok(sampleFrames(board).length >= 4);
  assert.throws(() => prepareCourseItem(source, board.transcript, Buffer.alloc(0)), /model/);
  assert.throws(() => prepareTranscriptItem(source, {...TRANSCRIPT_TIMING, wordsPerMinute:200}), /timing policy/);
});

function catalogueFixture() {
  const sourceFiles = {'frozen-source.js':sha256('frozen source')};
  const make = (id, kind) => {
    const value = {...item(), id, kind};
    value.animation.steps[0].visual.context = {kind:'bars', values:[2, 4]};
    const canonical = canonicalContent({...value.animation, scenes:value.animation.steps.map(step => ({...step, chapter:step.data?.chapter}))});
    value.canonicalSha256 = sha256(JSON.stringify(canonical));
    return value;
  };
  return {version:1, model:'gemini-3.8-flash-tts', voice:'Puck', sourceFiles, inputSha256:sha256(JSON.stringify(sourceFiles)),
    sourceRevision:'fixture', testFixture:true, items:[
      ...PUBLISHED_PUCK_IDS.map((id, index) => make(id, index === 2 ? 'exercise' : 'section')),
      ...Array.from({length:116}, (_, index) => make(`section-${index}`, 'section')),
      ...Array.from({length:36}, (_, index) => make(`recap-${index}`, 'recap')),
      ...Array.from({length:386}, (_, index) => make(`exercise-${index}--c.i`, 'exercise'))]};
}

function withTranscriptBatch(operation) {
  const directory = fs.mkdtempSync(path.join(tmpdir(), 'remotion-transcripts-'));
  const catalogue = catalogueFixture();
  const bytes = Buffer.from(JSON.stringify(catalogue));
  const source = path.join(directory, 'original.json');
  const batch = path.join(directory, 'batch');
  const renderer = {rendererSha256:sha256('renderer'), sourceHashes:{'Course.jsx':sha256('composition')}};
  fs.writeFileSync(source, bytes);
  try {return operation({directory, source, batch, catalogue, bytes, renderer});}
  finally {fs.rmSync(directory, {recursive:true, force:true});}
}

test('complete source snapshot keeps 541 exact items and explicitly excludes only three published Puck videos', () => withTranscriptBatch(({catalogue, bytes, source, renderer}) => {
  const selection = transcriptSelection(catalogue, bytes, source, renderer);
  assert.equal(selection.targetIds.length, 538);
  assert.deepEqual(selection.excludedIds, PUBLISHED_PUCK_IDS);
  assert.deepEqual(selection.counts, {section:116, recap:36, exercise:386});
  assert.deepEqual(selection.sourceFiles, catalogue.sourceFiles);
  assert.equal(selection.catalogueSha256, sha256(bytes));
  const first = prepareTranscriptInputs(catalogue, selection, {limit:1});
  assert.equal(first.length, 1);
  assert.equal(first[0].item.id, 'section-0');
  const dotted = selection.targetIds.find(id => id.includes('.'));
  assert.equal(prepareTranscriptInputs(catalogue, selection, {ids:[dotted]})[0].item.id, dotted);
  for (const id of PUBLISHED_PUCK_IDS) assert.throws(() => prepareTranscriptInputs(catalogue, selection, {ids:[id]}), /Excluded/);
  for (const id of ['../outside', '/tmp/bad', 'a..b', 'a/b', 'UPPER']) {
    assert.throws(() => validateFrozenCatalogue({...catalogue, items:[{...item(), id}]}), /Unsafe/);
  }
  const changed = structuredClone(catalogue);
  changed.items[0].animation.steps[0].cues[0].text = 'Changed original';
  assert.throws(() => validateFrozenCatalogue(changed), /canonical content/);
  assert.throws(() => validateFrozenCatalogue({...catalogue, inputSha256:sha256('changed')}), /source hash/);
}));

test('external snapshot preparation and resume reject changed catalogue, source, selection and renderer without audio', () => withTranscriptBatch(({source, batch, bytes, renderer}) => {
  const selection = prepareTranscriptBatch(source, batch, renderer);
  assert.deepEqual(fs.readFileSync(path.join(batch, 'catalogue.json')), bytes);
  assert.deepEqual(fs.readFileSync(source), bytes);
  assert.equal(fs.existsSync(path.join(batch, 'items')), false);
  assert.deepEqual(loadTranscriptBatch(batch, bytes, renderer), selection);
  assert.throws(() => prepareTranscriptBatch(source, batch, renderer), /already exists/);
  assert.throws(() => loadTranscriptBatch(batch, Buffer.from('{}'), renderer), /catalogue changed/);
  assert.throws(() => loadTranscriptBatch(batch, bytes, {...renderer, rendererSha256:sha256('changed')}), /snapshot or renderer/);
  fs.writeFileSync(source, '{}');
  assert.throws(() => loadTranscriptBatch(batch, bytes, renderer), /Original frozen catalogue changed/);
  fs.writeFileSync(source, bytes);
  fs.writeFileSync(path.join(batch, 'selection.json'), JSON.stringify({...selection, targetIds:selection.targetIds.slice(1)}));
  assert.throws(() => loadTranscriptBatch(batch, bytes, renderer), /selection hash/);
}));

test('stale completed transcript outputs and phantom measured voice fields cannot resume or publish', () => {
  const expected = {inputHash:sha256('input'), rendererSha256:sha256('renderer'), sourceSnapshot:{canonicalSha256:sha256('canonical')}};
  const metadata = {...expected, complete:true, narrationMode:'transcript', cueTiming:'estimated', temporary:true, silent:true};
  assert.doesNotThrow(() => assertTranscriptResume(metadata, expected));
  for (const key of ['inputHash', 'rendererSha256', 'sourceSnapshot']) assert.throws(() => assertTranscriptResume({...metadata, [key]:'changed'}, expected), /Stale transcript/);
  for (const key of ['voice', 'model', 'audioSource', 'audioSha256', 'measured']) assert.throws(() => assertTranscriptResume({...metadata, [key]:'Puck'}, expected), /Phantom/);
  assert.throws(() => assertTranscriptResume({...metadata, cueTiming:'measured'}, expected), /Invalid transcript/);
  assert.throws(() => assertPublishable(metadata), /Cannot publish transcript/);
  assert.throws(() => prepareBatchInputs('/missing', {version:1, ...metadata}, {publish:true}), /Cannot publish transcript/);
  assert.throws(() => parseOptions(['--batch', '/tmp/batch', '--transcript', '--publish']), /Cannot publish transcript/);
  assert.throws(() => parseOptions(['--batch', '/tmp/batch', '--transcript', '--ready']), /reserved for measured/);
});

test('progress reports real state totals and rejects inconsistent counts', () => withTranscriptBatch(({batch, source, renderer}) => {
  const selection = prepareTranscriptBatch(source, batch, renderer);
  const progress = JSON.parse(fs.readFileSync(path.join(batch, 'progress.json')));
  assert.deepEqual(progress.counts, {pending:538, rendering:0, complete:0, failed:0});
  progress.items[selection.targetIds[0]] = {state:'rendering'};
  writeProgress(batch, progress);
  assert.equal(progress.counts.rendering, 1);
  progress.items[selection.targetIds[0]] = {state:'failed'};
  writeProgress(batch, progress);
  assert.equal(progress.counts.failed, 1);
  assert.equal(progress.counts.complete, 0);
  assert.throws(() => writeProgress(batch, {...progress, total:537}), /total mismatch/);
}));

test('CLI transcript publication guard fails before reading or creating files', () => {
  const runner = fileURLToPath(new URL('../data-src/course-videos/render-course.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [runner, '--batch', '/nonexistent-transcript-fixture', '--transcript', '--publish', '--worker'], {encoding:'utf8'});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot publish transcript drafts/);
});

test('immutable real catalogue supports all 538 transcript targets with exact canonical cues and authored visuals', {skip:!process.env.REMOTION_FROZEN_CATALOGUE}, () => {
  const source = process.env.REMOTION_FROZEN_CATALOGUE;
  const bytes = fs.readFileSync(source);
  const catalogue = JSON.parse(bytes);
  const selection = transcriptSelection(catalogue, bytes, source, rendererInputs());
  const prepared = prepareTranscriptInputs(catalogue, selection);
  assert.equal(prepared.length, 538);
  for (const {item:original, storyboard} of prepared) {
    assert.deepEqual(storyboard.transcript.scenes.flatMap(scene => scene.cues.map(cue => cue.text)), original.animation.steps.flatMap(step => step.cues.map(cue => cue.text ?? cue)));
    assert.equal(storyboard.audio, undefined);
    if (original.kind !== 'exercise') assert.ok(storyboard.animation.steps.every(step => step.visual.context));
  }
  assert.deepEqual(fs.readFileSync(source), bytes);
});

test('opt-in completed transcript pilot resumes without audio and refuses stale output, cue plan and source snapshots', {skip:!process.env.REMOTION_TRANSCRIPT_PILOT}, () => {
  const original = process.env.REMOTION_TRANSCRIPT_PILOT;
  const batch = fs.mkdtempSync(path.join(tmpdir(), 'remotion-transcript-resume-'));
  const id = 'proporciones--unidades-y-cotas';
  const directory = path.join(batch, 'videos', id);
  const runner = fileURLToPath(new URL('../data-src/course-videos/render-course.mjs', import.meta.url));
  const run = () => spawnSync(process.execPath, [runner, '--batch', batch, '--transcript', '--ids', id, '--worker'], {encoding:'utf8'});
  try {
    for (const name of ['catalogue.json', 'selection.json', 'selection.sha256.json', 'progress.json']) fs.copyFileSync(path.join(original, name), path.join(batch, name));
    fs.mkdirSync(directory, {recursive:true});
    for (const name of ['video.mp4', 'poster.jpg', 'metadata.json', 'transcript.json']) fs.copyFileSync(path.join(original, 'videos', id, name), path.join(directory, name));
    const metadataPath = path.join(directory, 'metadata.json');
    const metadataBytes = fs.readFileSync(metadataPath);
    const metadata = JSON.parse(metadataBytes);
    const resumed = run();
    assert.equal(resumed.status, 0, resumed.stdout + resumed.stderr);
    assert.match(resumed.stdout, /COURSE_REUSED proporciones--unidades-y-cotas/);
    assert.ok(!resumed.stdout.includes('COURSE_RENDERED'));
    assert.deepEqual(fs.readFileSync(metadataPath), metadataBytes);
    assert.equal(fs.existsSync(path.join(batch, 'items')), false);
    for (const changed of [{...metadata, inputHash:sha256('stale')}, {...metadata, sourceSnapshot:{...metadata.sourceSnapshot, canonicalSha256:sha256('stale')}}, {...metadata, voice:'Puck'}]) {
      fs.writeFileSync(metadataPath, JSON.stringify(changed));
      const stale = run();
      assert.equal(stale.status, 1);
      assert.match(stale.stderr, /Stale transcript|Phantom transcript/);
    }
    fs.writeFileSync(metadataPath, metadataBytes);
    const transcriptPath = path.join(directory, 'transcript.json');
    const transcriptBytes = fs.readFileSync(transcriptPath);
    const transcript = JSON.parse(transcriptBytes);
    transcript.scenes[0].cues[0].text = 'Changed frozen text';
    fs.writeFileSync(transcriptPath, JSON.stringify(transcript));
    const staleCue = run();
    assert.equal(staleCue.status, 1);
    assert.match(staleCue.stderr, /Stale transcript cue plan/);
    fs.writeFileSync(transcriptPath, transcriptBytes);
    fs.writeFileSync(path.join(batch, 'catalogue.json'), '{}');
    const staleSource = run();
    assert.equal(staleSource.status, 1);
    assert.match(staleSource.stderr, /Frozen catalogue changed/);
    assert.deepEqual(fs.readFileSync(path.join(original, 'videos', id, 'metadata.json')), metadataBytes);
  } finally {fs.rmSync(batch, {recursive:true, force:true});}
});