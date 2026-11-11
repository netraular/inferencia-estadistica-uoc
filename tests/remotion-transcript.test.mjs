import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareTranscriptItem, prepareCourseItem, sha256, TRANSCRIPT_TIMING} from '../data-src/course-videos/course-contract.mjs';
import {courseFrame, sampleFrames} from '../data-src/course-videos/course-frame.mjs';
import {parseOptions, prepareBatchInputs, rendererInputs, worker} from '../data-src/course-videos/render-course.mjs';
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
    value.animation.id = id;
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

test('native transcript batches include every frozen item without enriching or changing original visuals', () => withTranscriptBatch(({catalogue, bytes, source, renderer, batch}) => {
  const nativeRenderer = {...renderer,native:true};
  const selection = prepareTranscriptBatch(source,batch,nativeRenderer);
  assert.equal(selection.targetIds.length,541);
  assert.deepEqual(selection.excludedIds,[]);
  assert.deepEqual(selection.counts,{section:118,recap:36,exercise:387});
  assert.deepEqual(loadTranscriptBatch(batch,bytes,nativeRenderer),selection);
  assert.throws(() => loadTranscriptBatch(batch,bytes,renderer),/snapshot or renderer changed/);
  const prepared = prepareTranscriptInputs(catalogue,selection,{native:true});
  for (const {item,storyboard} of prepared) {
    assert.equal(storyboard.animation,item.animation);
    assert.equal(storyboard.transcript.cueTiming,'estimated');
    assert.equal(storyboard.audio,undefined);
  }
  assert.deepEqual(prepareTranscriptInputs(catalogue,selection,{native:true,ids:PUBLISHED_PUCK_IDS}).map(({item})=>item.id),PUBLISHED_PUCK_IDS);
  assert.deepEqual(fs.readFileSync(source),bytes);
  assert.throws(() => parseOptions(['--batch',batch,'--native','--transcript','--publish']),/Cannot publish transcript/);
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

function workerFixture(context, hooks = {}, {native = false, catalogue = catalogueFixture(), ids = ['section-0', 'section-1']} = {}) {
  const directory = fs.mkdtempSync(path.join(tmpdir(), 'remotion-transcript-worker-'));
  context.after(() => fs.rmSync(directory, {recursive:true, force:true}));
  const source = path.join(directory, 'original.json');
  const batch = path.join(directory, 'batch');
  fs.writeFileSync(source, JSON.stringify(catalogue));
  prepareTranscriptBatch(source, batch, rendererInputs({native}));
  const calls = [];
  const browsers = [];
  let active;
  const runtime = {
    ensureBrowser:async () => ({path:'mock-browser'}),
    openBrowser:async () => {
      const browser = {closed:false, close:async () => {browser.closed = true;}};
      browsers.push(browser);
      return browser;
    },
    selectComposition:async ({inputProps}) => {
      active = inputProps.storyboard;
      calls.push(active.animation.id);
      await hooks.select?.(active);
      return {id:'Course'};
    },
    renderStill:async ({frame, output, onBrowserLog}) => {
      await hooks.still?.(active, frame);
      fs.writeFileSync(output, 'mock still');
      onBrowserLog({text:`${native ? 'REMOTION_NATIVE_LAYOUT ' : 'REMOTION_COURSE_LAYOUT '}${JSON.stringify({frame, cue:0, diagram:'bars', errors:hooks.layout?.(active, frame) ?? [], marks:1, canvasSha256:sha256(String(frame))})}`});
    },
    renderMedia:async ({outputLocation}) => {
      await hooks.media?.(active);
      fs.writeFileSync(outputLocation, 'mock video');
    }
  };
  const dependencies = {
    getRenderer:options => {
      const renderer = rendererInputs(options);
      return hooks.renderer?.(renderer) ?? renderer;
    },
    loadRuntime:async () => ({runtime, bundle:async () => {await hooks.bundle?.(); return 'mock-bundle';}}),
    runFfmpeg:(_executable, args) => {
      hooks.ffmpeg?.(active);
      fs.copyFileSync(args[args.indexOf('-i') + 1], args.at(-1));
    },
    verify:args => {
      hooks.verify?.(args.storyboard);
      return {videoSha256:sha256(fs.readFileSync(args.video)), posterSha256:sha256(fs.readFileSync(args.poster)), pixels:[], streams:[]};
    }
  };
  const run = (options = {}) => worker({batch, transcript:true, native, ids, ...options}, dependencies);
  const progress = () => JSON.parse(fs.readFileSync(path.join(batch, 'progress.json')));
  const report = () => JSON.parse(fs.readFileSync(path.join(batch, 'videos/remotion-run.json')));
  return {batch, source, calls, browsers, dependencies, run, progress, report};
}

test('continue-on-error is opt-in and restricted to transcript drafts', () => {
  assert.equal(parseOptions(['--batch', '/tmp/batch', '--transcript', '--continue-on-error'])['continue-on-error'], true);
  for (const extra of [[], ['--native'], ['--ready'], ['--publish']]) {
    assert.throws(() => parseOptions(['--batch', '/tmp/batch', '--continue-on-error', ...extra]), /requires --transcript/);
  }
  for (const extra of ['--publish', '--ready']) {
    assert.throws(() => parseOptions(['--batch', '/tmp/batch', '--transcript', '--continue-on-error', extra]), /Cannot publish|reserved for measured/);
  }
});

test('transcript worker continues once after a failed layout, preserves real counts and rejects overall success', async context => {
  const fixture = workerFixture(context, {layout:board => board.animation.id === 'section-0' ? ['fixture overlap'] : []});
  await assert.rejects(fixture.run({'continue-on-error':true}), /1 transcript item\(s\) failed/);
  assert.deepEqual(fixture.calls, ['section-0', 'section-1']);
  const progress = fixture.progress();
  assert.equal(progress.state, 'failed');
  assert.deepEqual(progress.counts, {pending:536, rendering:0, complete:1, failed:1});
  assert.match(progress.items['section-0'].error, /layout errors/);
  assert.ok(progress.items['section-0'].frames > 0);
  assert.ok(progress.items['section-0'].elapsedSeconds >= 0);
  assert.equal(progress.items['section-1'].state, 'complete');
  const report = fixture.report();
  assert.equal(report.failedCount, 1);
  assert.deepEqual(report.counts, progress.counts);
  assert.deepEqual(report.failures.map(entry => entry.id), ['section-0']);
  assert.deepEqual(report.results.map(entry => entry.id), ['section-1']);
  assert.equal(report.browserClosed, true);
  assert.equal(fixture.browsers.length, 2);
  assert.ok(fixture.browsers.every(browser => browser.closed));
  assert.equal(fs.existsSync(path.join(fixture.batch, 'videos/.remotion.lock')), false);
  assert.deepEqual(fs.readdirSync(path.join(fixture.batch, 'videos/.remotion-cache')), []);
  assert.equal(fs.existsSync(path.join(fixture.batch, 'videos/section-0/metadata.json')), false);
});

test('transcript worker still aborts on the first individual failure by default', async context => {
  const fixture = workerFixture(context, {still:() => {throw new Error('fixture fail-fast');}});
  await assert.rejects(fixture.run(), /fixture fail-fast/);
  assert.deepEqual(fixture.calls, ['section-0']);
  assert.deepEqual(fixture.progress().counts, {pending:537, rendering:0, complete:0, failed:1});
  assert.equal(fixture.report().browserClosed, true);
  assert.ok(fixture.browsers.every(browser => browser.closed));
});

test('transcript worker recovers once from composition, still, encoding, ffmpeg and decode failures', async context => {
  for (const stage of ['select', 'still', 'media', 'ffmpeg', 'verify']) await context.test(stage, async child => {
    let fixture;
    const hooks = {select:board => {
      if (board.animation.id === 'section-1') {
        assert.ok(fixture.browsers[0].closed, 'Failed item browser must close before the next item');
        const caches = path.join(fixture.batch, 'videos/.remotion-cache');
        for (const directory of fs.readdirSync(caches)) assert.equal(fs.existsSync(path.join(caches, directory, 'section-0')), false);
      }
    }};
    const select = hooks.select;
    hooks[stage] = board => {
      if (stage === 'select') select(board);
      if (board.animation.id === 'section-0') throw new Error(`fixture ${stage} failure`);
    };
    fixture = workerFixture(child, hooks);
    await assert.rejects(fixture.run({'continue-on-error':true}), /1 transcript item\(s\) failed/);
    assert.deepEqual(fixture.calls, ['section-0', 'section-1']);
    assert.deepEqual(fixture.progress().counts, {pending:536, rendering:0, complete:1, failed:1});
    assert.match(fixture.progress().items['section-0'].error, new RegExp(`fixture ${stage} failure`));
    assert.equal(fixture.report().failedCount, 1);
    assert.ok(fixture.browsers.every(browser => browser.closed));
    assert.equal(fs.existsSync(path.join(fixture.batch, 'videos/.remotion.lock')), false);
  });
});

test('transcript worker reuses compatible complete output without rendering or changing fingerprints', async context => {
  const verified = [];
  const fixture = workerFixture(context, {verify:board => verified.push(board.animation.id)});
  await fixture.run();
  const directory = path.join(fixture.batch, 'videos/section-1');
  const originals = Object.fromEntries(['metadata.json', 'video.mp4', 'poster.jpg', 'transcript.json'].map(name => [name, fs.readFileSync(path.join(directory, name))]));
  await fixture.run({'continue-on-error':true});
  assert.deepEqual(fixture.calls, ['section-0', 'section-1']);
  assert.deepEqual(verified, ['section-0', 'section-1', 'section-0', 'section-1']);
  for (const [name, bytes] of Object.entries(originals)) assert.deepEqual(fs.readFileSync(path.join(directory, name)), bytes);
  assert.deepEqual(fixture.progress().counts, {pending:536, rendering:0, complete:2, failed:0});
  assert.equal(fixture.progress().state, 'paused');
  assert.equal(fixture.report().failedCount, 0);
  assert.equal(fs.existsSync(path.join(fixture.batch, 'items')), false);
  const metadataPath = path.join(fixture.batch, 'videos/section-0/metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath));
  for (const patch of [{inputHash:sha256('stale')}, {rendererSha256:sha256('stale')}, {sourceSnapshot:{}}, {complete:false}, {voice:'Puck'}]) {
    fs.writeFileSync(metadataPath, JSON.stringify({...metadata, ...patch}));
    await assert.rejects(fixture.run({'continue-on-error':true}), /Stale transcript|Incomplete transcript|Phantom transcript/);
    assert.deepEqual(fixture.calls, ['section-0', 'section-1']);
    assert.equal(verified.length, 4, 'Resume hashes and completeness must be checked before decoding');
  }
  assert.throws(() => assertPublishable({...metadata, complete:false}), /Cannot publish transcript/);
});

test('transcript worker never treats a stale resumed cue timeline as an individual media failure', async context => {
  const fixture = workerFixture(context);
  await fixture.run();
  const filename = path.join(fixture.batch, 'videos/section-0/transcript.json');
  const timeline = JSON.parse(fs.readFileSync(filename));
  timeline.scenes[0].cues[0].text = 'Changed frozen timeline';
  fs.writeFileSync(filename, JSON.stringify(timeline));
  await assert.rejects(fixture.run({'continue-on-error':true}), /Stale transcript cue plan/);
  assert.deepEqual(fixture.calls, ['section-0', 'section-1']);
  assert.deepEqual(fixture.report().results, []);
});

test('transcript worker keeps catalogue, source, selection, renderer, canonical and timing preflight guards fatal', async context => {
  for (const guard of ['catalogue', 'source', 'selection', 'renderer', 'canonical', 'timing']) await context.test(guard, async child => {
    const fixture = workerFixture(child);
    const cataloguePath = path.join(fixture.batch, 'catalogue.json');
    const selectionPath = path.join(fixture.batch, 'selection.json');
    const selection = JSON.parse(fs.readFileSync(selectionPath));
    if (guard === 'catalogue') fs.writeFileSync(cataloguePath, '{}');
    if (guard === 'source') fs.writeFileSync(fixture.source, '{}');
    if (guard === 'selection') selection.targetIds.pop();
    if (guard === 'renderer') selection.rendererSha256 = sha256('stale renderer');
    if (guard === 'timing') selection.timing = {...selection.timing, wordsPerMinute:200};
    if (guard === 'canonical') {
      const catalogue = JSON.parse(fs.readFileSync(cataloguePath));
      catalogue.items[0].animation.steps[0].cues[0].text = 'Changed canonical content';
      const bytes = JSON.stringify(catalogue);
      fs.writeFileSync(cataloguePath, bytes);
      fs.writeFileSync(fixture.source, bytes);
      selection.catalogueSha256 = sha256(bytes);
    }
    fs.writeFileSync(selectionPath, JSON.stringify(selection));
    if (guard !== 'selection') fs.writeFileSync(path.join(fixture.batch, 'selection.sha256.json'), JSON.stringify({sha256:sha256(JSON.stringify(selection))}));
    await assert.rejects(fixture.run({'continue-on-error':true}), /catalogue changed|selection hash|snapshot or renderer changed|canonical content changed/);
    assert.deepEqual(fixture.calls, []);
    assert.equal(fs.existsSync(path.join(fixture.batch, 'videos/.remotion.lock')), false);
    const runner = fileURLToPath(new URL('../data-src/course-videos/render-course.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [runner, '--batch', fixture.batch, '--transcript', '--continue-on-error', '--worker'], {encoding:'utf8'});
    assert.equal(result.status, 1, result.stdout + result.stderr);
  });
});

test('transcript worker rechecks global integrity on recovery rather than hiding a changed frozen source', async context => {
  for (const guard of ['source', 'catalogue', 'selection']) await context.test(guard, async child => {
    let fixture;
    fixture = workerFixture(child, {still:() => {
      const filename = guard === 'source' ? fixture.source : path.join(fixture.batch, guard === 'catalogue' ? 'catalogue.json' : 'selection.json');
      fs.writeFileSync(filename, '{}');
      throw new Error('individual failure must not mask global corruption');
    }});
    await assert.rejects(fixture.run({'continue-on-error':true}), /catalogue changed|selection hash/);
    assert.deepEqual(fixture.calls, ['section-0']);
    assert.deepEqual(fixture.report().failures, []);
    assert.equal(fixture.progress().items['section-1'].state, 'pending');
    assert.ok(fixture.browsers.every(browser => browser.closed));
  });
});

test('transcript worker treats bundling failures as global even with continuation enabled', async context => {
  const fixture = workerFixture(context, {bundle:() => {throw new Error('fixture bundle failure');}});
  await assert.rejects(fixture.run({'continue-on-error':true}), /fixture bundle failure/);
  assert.deepEqual(fixture.calls, []);
  assert.equal(fixture.progress().items['section-1'].state, 'pending');
  assert.equal(fixture.report().failedCount, 1);
});

test('native transcript worker continues after one layout failure but aborts if a native plan fingerprint becomes stale', async context => {
  const {buildCatalogue} = await import('../scripts/tts/gemini-course.mjs');
  const catalogue = await buildCatalogue();
  const ids = PUBLISHED_PUCK_IDS.slice(0, 2);
  await context.test('isolated native layout failure', async child => {
    let selected = 0;
    const fixture = workerFixture(child, {select:() => {selected++;}, layout:() => selected === 1 ? ['fixture native overlap'] : []}, {native:true, catalogue, ids});
    await assert.rejects(fixture.run({'continue-on-error':true}), /1 transcript item\(s\) failed/);
    assert.equal(fixture.calls.length, 2);
    assert.deepEqual(fixture.progress().counts, {pending:539, rendering:0, complete:1, failed:1});
    assert.equal(fixture.progress().items[ids[1]].state, 'complete');
    assert.equal(fixture.report().failedCount, 1);
    assert.ok(fixture.browsers.every(browser => browser.closed));
  });
  await context.test('renderer drift during native failure is fatal', async child => {
    let stale = false;
    const fixture = workerFixture(child, {
      renderer:renderer => stale ? {...renderer, rendererSha256:sha256('changed native renderer')} : renderer,
      still:() => {stale = true; throw new Error('individual native layout failure');}
    }, {native:true, catalogue, ids});
    await assert.rejects(fixture.run({'continue-on-error':true}), /snapshot or renderer changed/);
    assert.equal(fixture.calls.length, 1);
    assert.equal(fixture.progress().items[ids[1]].state, 'pending');
    assert.deepEqual(fixture.report().failures, []);
    assert.ok(fixture.browsers.every(browser => browser.closed));
  });
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