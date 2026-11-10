import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {canonicalContent} from '../../scripts/prepare-media.mjs';
import {selectItems, sha256, prepareTranscriptItem, TRANSCRIPT_TIMING} from './course-contract.mjs';

export const PUBLISHED_PUCK_IDS = Object.freeze(['proporciones--parte-y-total', 'proporciones--porcentaje-y-exposicion', 'ejercicio-pdf-u1-1--a']);
export const json = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
export function writeJson(filename, value) {
  const temporary = `${filename}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, filename);
}

export function validateFrozenCatalogue(catalogue) {
  selectItems(catalogue);
  assert.ok(catalogue.sourceFiles && Object.keys(catalogue.sourceFiles).length, 'Missing frozen source hashes');
  for (const hash of Object.values(catalogue.sourceFiles)) assert.match(hash, /^[a-f0-9]{64}$/, 'Invalid frozen source hash');
  assert.equal(sha256(JSON.stringify(catalogue.sourceFiles)), catalogue.inputSha256, 'Frozen source hash mismatch');
  for (const item of catalogue.items) {
    const canonical = canonicalContent({...item.animation, scenes:item.animation.steps.map(step => ({...step, chapter:step.data?.chapter}))});
    assert.equal(sha256(JSON.stringify(canonical)), item.canonicalSha256, `${item.id}: canonical content changed`);
  }
  return catalogue;
}

export function transcriptSelection(catalogue, catalogueBytes, sourceCatalogue, renderer) {
  validateFrozenCatalogue(catalogue);
  assert.equal(catalogue.items.length, 541, 'Expected complete 541-item source catalogue');
  for (const id of PUBLISHED_PUCK_IDS) assert.ok(catalogue.items.some(item => item.id === id), `Missing published Puck item ${id}`);
  const targets = catalogue.items.filter(item => !PUBLISHED_PUCK_IDS.includes(item.id));
  const counts = Object.fromEntries(['section', 'recap', 'exercise'].map(kind => [kind, targets.filter(item => item.kind === kind).length]));
  assert.deepEqual(counts, {section:116, recap:36, exercise:386}, 'Unexpected transcript production coverage');
  return {version:1, narrationMode:'transcript', cueTiming:'estimated', temporary:true, silent:true,
    sourceCatalogue, catalogueSha256:sha256(catalogueBytes), sourceFiles:catalogue.sourceFiles,
    sourceInputSha256:catalogue.inputSha256, sourceRevision:catalogue.sourceRevision,
    timing:TRANSCRIPT_TIMING, excludedIds:[...PUBLISHED_PUCK_IDS], targetIds:targets.map(item => item.id), counts,
    itemHashes:Object.fromEntries(catalogue.items.map(item => [item.id, sha256(JSON.stringify(item))])),
    rendererSha256:renderer.rendererSha256, rendererSources:renderer.sourceHashes};
}

export function prepareTranscriptBatch(sourceCatalogue, batch, renderer) {
  assert.ok(path.isAbsolute(batch) && path.isAbsolute(sourceCatalogue), 'Transcript paths must be absolute');
  assert.ok(!fs.existsSync(batch), 'Transcript batch already exists; resume without --prepare');
  const source = fs.realpathSync(sourceCatalogue);
  const bytes = fs.readFileSync(source);
  const selection = transcriptSelection(JSON.parse(bytes), bytes, source, renderer);
  fs.mkdirSync(batch, {recursive:true});
  assert.equal(fs.realpathSync(batch), path.resolve(batch), 'Symlink transcript batch');
  assert.ok(!source.startsWith(`${fs.realpathSync(batch)}${path.sep}`), 'Source must be outside transcript batch');
  fs.writeFileSync(path.join(batch, 'catalogue.json'), bytes, {flag:'wx'});
  writeJson(path.join(batch, 'selection.json'), selection);
  writeJson(path.join(batch, 'selection.sha256.json'), {sha256:sha256(JSON.stringify(selection))});
  const items = Object.fromEntries(selection.targetIds.map(id => [id, {state:'pending'}]));
  writeProgress(batch, {version:1, total:selection.targetIds.length, state:'prepared', items});
  return selection;
}

export function loadTranscriptBatch(batch, catalogueBytes, renderer) {
  const selection = json(path.join(batch, 'selection.json'));
  assert.equal(sha256(JSON.stringify(selection)), json(path.join(batch, 'selection.sha256.json')).sha256, 'Transcript selection hash mismatch');
  assert.equal(sha256(catalogueBytes), selection.catalogueSha256, 'Frozen catalogue changed');
  assert.equal(sha256(fs.readFileSync(selection.sourceCatalogue)), selection.catalogueSha256, 'Original frozen catalogue changed');
  const catalogue = JSON.parse(catalogueBytes);
  assert.deepEqual(selection, transcriptSelection(catalogue, catalogueBytes, selection.sourceCatalogue, renderer), 'Transcript snapshot or renderer changed; use a new batch');
  return selection;
}

export function prepareTranscriptInputs(catalogue, selection, options = {}) {
  assert.ok(!options.publish, 'Cannot publish transcript drafts as Puck videos');
  assert.ok(!options.ready, '--ready is reserved for measured audio');
  const targets = new Set(selection.targetIds);
  if (options.ids) for (const id of options.ids) assert.ok(targets.has(id), `Excluded published Puck item ${id}`);
  const selected = selectItems({...catalogue, items:catalogue.items.filter(item => targets.has(item.id))}, options);
  return selected.map(item => ({item, storyboard:prepareTranscriptItem(item, selection.timing)}));
}

export function assertPublishable(metadata) {
  assert.ok(metadata.narrationMode !== 'transcript' && !metadata.temporary && !metadata.silent && metadata.cueTiming !== 'estimated', 'Cannot publish transcript drafts as Puck videos');
}

export function assertTranscriptResume(metadata, expected) {
  for (const key of ['inputHash', 'rendererSha256', 'sourceSnapshot']) assert.deepEqual(metadata[key], expected[key], `Stale transcript ${key}`);
  assert.equal(metadata.complete, true, 'Incomplete transcript render');
  for (const [key, value] of Object.entries({narrationMode:'transcript', cueTiming:'estimated', temporary:true, silent:true})) assert.equal(metadata[key], value, `Invalid transcript ${key}`);
  for (const key of ['model', 'voice', 'audioSource', 'audioSha256', 'measured']) assert.ok(!(key in metadata), `Phantom transcript ${key}`);
}

export function writeProgress(batch, progress) {
  const counts = {pending:0, rendering:0, complete:0, failed:0};
  for (const item of Object.values(progress.items)) {
    assert.ok(item.state in counts, 'Unknown production state');
    counts[item.state]++;
  }
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), progress.total, 'Progress total mismatch');
  progress.counts = counts;
  progress.updatedAt = new Date().toISOString();
  writeJson(path.join(batch, 'progress.json'), progress);
  console.log(`TRANSCRIPT_PROGRESS ${JSON.stringify({state:progress.state, total:progress.total, ...counts, current:progress.current ?? null})}`);
}