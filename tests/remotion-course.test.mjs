import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {prepareCourseItem, courseFrame, selectItems, sha256, MODEL, VOICE} from '../data-src/course-videos/course-contract.mjs';
import {parseOptions, prepareBatchInputs, rendererInputs, rendererWebpack} from '../data-src/course-videos/render-course.mjs';
import {partialPreviewItem} from '../data-src/course-videos/preview-course.mjs';
import {canonicalAnimation} from '../scripts/tts/gemini-course.mjs';
import {representativeFrame, authoredSceneContent} from '../data-src/course-videos/course-frame.mjs';

function fixture() {
  const mp3 = Buffer.from('Temporary contract fixture, not narration');
  const item = {id:'fixture--equation', kind:'section', title:'Temporary fixture', canonicalSha256:sha256('canonical'), animation:{id:'fixture', source:'fixture', steps:[{title:'Equation', story:true, cues:['First', 'Second'], visual:{context:{kind:'bars', values:[2, 4]}, phases:[{cue:1}], lines:[{tex:'p=2/4', cue:1}]}}]}};
  const audio = {id:item.id, title:item.title, model:MODEL, voice:VOICE, duration:2, cueTiming:'measured', canonicalSha256:item.canonicalSha256, mp3Sha256:sha256(mp3), mp3Bytes:mp3.length, scenes:[{start:0, end:2, cues:[{text:'First', start:0, end:1}, {text:'Second', start:1, end:2}]}]};
  return {item, audio, mp3};
}

test('frozen frames preserve complete visuals and support deterministic reverse seeks', () => {
  const {item, audio, mp3} = fixture();
  for (const kind of ['section', 'recap', 'exercise']) {
    const storyboard = prepareCourseItem({...item, kind}, audio, mp3);
    const initial = courseFrame(storyboard, 0);
    assert.equal(courseFrame(storyboard, 45).cueIndex, 1);
    assert.deepEqual(courseFrame(storyboard, 0), initial);
    assert.equal(initial.step, item.animation.steps[0]);
    assert.equal(storyboard.frames, 60);
    assert.equal(courseFrame(storyboard, 12).progress > 0, true);
    assert.equal(courseFrame(storyboard, 30).progress, 0);
  }
});

test('rejects missing, stale, unmeasured, incompatible or unordered narration', () => {
  const {item, audio, mp3} = fixture();
  for (const patch of [{cueTiming:'estimated'}, {voice:'Kore'}, {model:'other'}, {canonicalSha256:sha256('stale')}, {mp3Sha256:sha256('stale')}, {mp3Bytes:1}, {scenes:[]}, {duration:NaN}]) {
    assert.throws(() => prepareCourseItem(item, {...audio, ...patch}, mp3));
  }
  const stale = structuredClone(audio);
  stale.scenes[0].cues[0].text = 'Changed';
  assert.throws(() => prepareCourseItem(item, stale, mp3), /Stale cue/);
  stale.scenes[0].cues[0].text = 'First';
  stale.scenes[0].cues[1].start = 0.5;
  assert.throws(() => prepareCourseItem(item, stale, mp3), /Invalid cue/);
});

test('native measured scenes retain raw frozen visuals and all measured-audio guards', () => {
  const {item,audio,mp3} = fixture();
  delete item.animation.steps[0].visual.context;
  const original = JSON.stringify(item);
  const storyboard = prepareCourseItem(item,audio,mp3,{native:true});
  assert.equal(storyboard.animation,item.animation);
  assert.equal(storyboard.audio,audio);
  assert.equal(storyboard.frames,60);
  assert.equal(JSON.stringify(item),original);
  assert.throws(() => prepareCourseItem(item,{...audio,cueTiming:'estimated'},mp3,{native:true}),/must be measured/);
  assert.throws(() => prepareCourseItem(item,audio,Buffer.from('changed'),{native:true}),/MP3 hash mismatch/);
});

test('native renderer has a separate guarded dependency graph and no legacy webpack adapter', () => {
  const renderer = rendererInputs({native:true});
  assert.equal(renderer.native,true);
  assert.equal(renderer.mathSource,undefined);
  for (const name of ['NativeCourse.jsx','native-scenes.mjs','native-layout.mjs','native-plan.mjs','native-primitives.jsx','package-lock.json']) assert.match(renderer.sourceHashes[name],/^[a-f0-9]{64}$/);
  for (const domain of ['foundations','univariate','multivariate','exercises']) {
    for (const extension of ['mjs','jsx']) assert.ok(renderer.sourceHashes[`native-${domain}.${extension}`]);
  }
  assert.ok(!Object.keys(renderer.sourceHashes).some(name=>/whiteboard|context-diagram|lesson-visuals|stageEquations/.test(name)));
  const configuration = {resolve:{alias:{}},plugins:[]};
  assert.equal(rendererWebpack(configuration,'unused',{native:true}),configuration);
  assert.deepEqual(parseOptions(['--batch','/tmp/native-batch','--native','--transcript']),{batch:'/tmp/native-batch',native:true,transcript:true});
});

test('catalogue selection is bounded and rejects unknown, duplicate and unsafe ids', () => {
  const {item} = fixture();
  const catalogue = {version:1, model:MODEL, voice:VOICE, items:[item, {...item, id:'second'}]};
  assert.deepEqual(selectItems(catalogue, {ids:['second'], limit:1}).map(entry => entry.id), ['second']);
  assert.equal(selectItems(catalogue, {limit:1}).length, 1);
  assert.throws(() => selectItems(catalogue, {ids:['missing']}), /Unknown/);
  assert.throws(() => selectItems({...catalogue, items:[item, item]}), /Duplicate/);
  assert.throws(() => selectItems({...catalogue, items:[{...item, id:'../outside'}]}), /Unsafe/);
});

test('catalogue selection matches audio-generator safe IDs without allowing traversal', () => {
  const {item} = fixture();
  const catalogue = id => ({version:1, model:MODEL, voice:VOICE, items:[{...item, id}]});
  for (const id of ['a', '0', 'a-b', 'a--b', 'question--c.i', 'question--c.ii', 'a.b-c--d.2']) {
    assert.equal(selectItems(catalogue(id), {ids:[id]})[0].id, id);
  }
  for (const id of ['', '.', '..', '../outside', 'a/../b', 'a\\b', '/absolute', 'a..b', '.a', 'a.', '-a', 'a-', 'a---b', 'a.-b', 'a_.b', 'UPPER', 'a_b', 'a b', 'a%2eb', null, 123]) {
    assert.throws(() => selectItems(catalogue(id)), /Unsafe/, String(id));
  }
});

test('catalogue selection accepts every dotted ID in the actual 541-item buildCatalogue', async () => {
  const {buildCatalogue} = await import('../scripts/tts/gemini-course.mjs');
  const catalogue = await buildCatalogue();
  const frozen = JSON.stringify(catalogue);
  assert.equal(catalogue.items.length, 541);
  assert.equal(selectItems(catalogue).length, 541);
  const dotted = catalogue.items.filter(item => item.id.includes('.'));
  assert.ok(dotted.length > 0);
  assert.ok(dotted.every(item => item.kind === 'exercise'));
  assert.deepEqual(selectItems(catalogue, {ids:dotted.map(item => item.id)}), dotted);
  assert.equal(JSON.stringify(catalogue), frozen);
});

test('CLI only accepts explicit frozen batches and bounded selections', () => {
  assert.deepEqual(parseOptions(['--batch', '/tmp/batch', '--ids', 'a,b', '--limit', '2']), {batch:'/tmp/batch', ids:['a', 'b'], limit:2});
  assert.deepEqual(parseOptions(['--batch', '/tmp/batch', '--ready']), {batch:'/tmp/batch', ready:true});
  assert.throws(() => parseOptions(['--batch', 'relative']), /absolute/);
  assert.throws(() => parseOptions(['--batch']), /Missing value/);
  assert.throws(() => parseOptions(['--unexpected']), /Unknown/);
});

function withInputBatch(operation) {
  const batch = fs.mkdtempSync(path.join(tmpdir(), 'remotion-course-inputs-'));
  const {item, audio, mp3} = fixture();
  const catalogue = {version:1, model:MODEL, voice:VOICE, items:[{...item, id:'pending--c.i'}, item]};
  const put = (id, name, value) => {
    const directory = path.join(batch, 'items', id);
    fs.mkdirSync(directory, {recursive:true});
    fs.writeFileSync(path.join(directory, name), value);
  };
  fs.writeFileSync(path.join(batch, 'catalogue.json'), JSON.stringify(catalogue));
  try {return operation({batch, catalogue, item, audio, mp3, put});}
  finally {fs.rmSync(batch, {recursive:true, force:true});}
}

test('partial previews freeze an exact spoken prefix without moving visual reveals or changing the original', () => {
  const {item} = fixture();
  item.animation.id = item.id;
  item.animation.title = item.title;
  item.animation.steps[0].cues = [{text:'First', start:0, end:1}, {text:'Second', start:1, end:2}, {text:'Future', start:2, end:3}];
  item.animation.steps[0].visual.lines.push({tex:'future=3', cue:2});
  item.animation.steps[0].visual.phases = [{cue:0}, {cue:1}, {cue:2}];
  item.animation.steps.push({title:'Future scene', cues:[{text:'Later', start:0, end:1}], visual:{context:{kind:'bars', values:[3, 5]}}});
  const frozen = structuredClone(item);
  const preview = partialPreviewItem(item, 2);
  assert.deepEqual(item, frozen);
  assert.equal(preview.preview, true);
  assert.equal(preview.id, preview.animation.id);
  assert.equal(preview.originalId, item.id);
  assert.match(preview.title, /^Avance parcial:/);
  assert.deepEqual(preview.source, item.source);
  assert.deepEqual(preview.partialCoverage, {includedCues:2, originalTotalCues:4, firstCue:0, lastCue:1});
  assert.equal(preview.animation.steps.length, 1);
  assert.deepEqual(preview.animation.steps[0].cues, item.animation.steps[0].cues.slice(0, 2));
  assert.equal(preview.animation.steps[0].caption, 'First Second');
  assert.deepEqual(preview.animation.steps[0].visual.lines, item.animation.steps[0].visual.lines.slice(0, 1));
  assert.deepEqual(preview.animation.steps[0].visual.phases, [{cue:0}, {cue:1}]);
  assert.equal(preview.canonicalSha256, sha256(JSON.stringify(canonicalAnimation(preview.animation))));
  for (const count of [0, 4, 5, 1.5]) assert.throws(() => partialPreviewItem(item, count), /strict spoken prefix/);
});

test('partial previews render locally but cannot publish from either catalogue or audio metadata', () => withInputBatch(({batch, catalogue, item, audio, mp3, put}) => {
  const dependencies = {probe:() => ({duration:audio.duration}), diagnose:() => {}};
  put(item.id, 'audio.mp3', mp3);
  put(item.id, 'audio.json', JSON.stringify({...audio, preview:true}));
  const options = {ids:[item.id]};
  assert.equal(prepareBatchInputs(batch, {...catalogue, preview:true}, options, dependencies).prepared.length, 1);
  assert.throws(() => prepareBatchInputs(batch, {...catalogue, preview:true}, {...options, publish:true}, dependencies), /Cannot publish partial preview/);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {...options, publish:true}, dependencies), /Cannot publish partial preview/);
  put(item.id, 'audio.json', JSON.stringify(audio));
  assert.throws(() => prepareBatchInputs(batch, {...catalogue, preview:true}, {...options, publish:true}, dependencies), /Cannot publish partial preview/);
  assert.equal(prepareBatchInputs(batch, catalogue, {...options, publish:true}, dependencies).prepared.length, 1);
}));

test('ready batches skip pending audio and limit completed compatible inputs, not catalogue positions', () => withInputBatch(({batch, catalogue, item, audio, mp3, put}) => {
  put(item.id, 'audio.mp3', mp3);
  put(item.id, 'audio.json', JSON.stringify(audio));
  const diagnostics = [];
  const dependencies = {probe:() => ({duration:audio.duration}), diagnose:line => diagnostics.push(line)};
  const original = JSON.stringify(catalogue);
  const result = prepareBatchInputs(batch, catalogue, {ready:true, limit:1}, dependencies);
  assert.deepEqual(result.prepared.map(entry => entry.item.id), [item.id]);
  assert.deepEqual(result.pending, [{id:'pending--c.i', missing:['audio.json', 'audio.mp3']}]);
  assert.match(diagnostics[0], /COURSE_PENDING pending--c.i/);
  assert.match(diagnostics[1], /"ready":1,"pending":1,"rendering":1/);
  assert.equal(JSON.stringify(catalogue), original);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {}, dependencies), /pending--c.i: Missing/);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true, ids:['pending--c.i']}, dependencies), /pending--c.i: Missing/);
  assert.deepEqual(prepareBatchInputs(batch, catalogue, {ready:true, ids:[item.id]}, dependencies).prepared.map(entry => entry.item.id), [item.id]);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true, limit:0}, dependencies), /Invalid limit/);
}));

test('ready batches validate present files even while the other audio input is pending', () => withInputBatch(({batch, catalogue, item, audio, mp3, put}) => {
  const dependencies = {probe:() => ({duration:audio.duration}), diagnose:() => {}};
  put(item.id, 'audio.json', JSON.stringify(audio));
  assert.equal(prepareBatchInputs(batch, catalogue, {ready:true}, dependencies).pending.length, 2);
  put(item.id, 'audio.json', '{broken');
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, dependencies), /fixture--equation:/);
  for (const patch of [{canonicalSha256:sha256('stale')}, {voice:'Kore'}, {model:'other'}, {cueTiming:'estimated'}, {mp3Bytes:0}, {scenes:[]}]) {
    put(item.id, 'audio.json', JSON.stringify({...audio, ...patch}));
    assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, dependencies), /fixture--equation:/);
  }
  put(item.id, 'audio.json', JSON.stringify(audio));
  put(item.id, 'audio.mp3', Buffer.from('Corrupt bytes'));
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, dependencies), /MP3 hash mismatch/);
  put(item.id, 'audio.mp3', mp3);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, {...dependencies, probe:() => ({duration:10})}), /duration incompatible/);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, {...dependencies, probe:() => undefined}), /Invalid MP3/);
  fs.unlinkSync(path.join(batch, 'items', item.id, 'audio.json'));
  assert.equal(prepareBatchInputs(batch, catalogue, {ready:true}, dependencies).pending.length, 2);
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, {...dependencies, probe:() => {throw new Error('Invalid MP3 bytes');}}), /Invalid MP3 bytes/);
  fs.unlinkSync(path.join(batch, 'items', item.id, 'audio.mp3'));
  fs.symlinkSync('absent.mp3', path.join(batch, 'items', item.id, 'audio.mp3'));
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ready:true}, dependencies), /Not a regular input/);
}));

test('ready CLI succeeds with pending audio, keeps explicit IDs strict and rejects stale present metadata', () => withInputBatch(({batch, catalogue, item, audio, put}) => {
  const runner = fileURLToPath(new URL('../data-src/course-videos/render-course.mjs', import.meta.url));
  const run = extra => {
    const result = spawnSync(process.execPath, [runner, '--batch', batch, ...extra], {encoding:'utf8'});
    const worker = /^COURSE_WORKER (.+)$/m.exec(result.stdout);
    if (worker) {
      const {log} = JSON.parse(worker[1]);
      const logs = fileURLToPath(new URL('../data-src/course-videos/.cache/course-jobs/', import.meta.url));
      assert.equal(path.dirname(log), path.resolve(logs));
      fs.unlinkSync(log);
    }
    return result;
  };
  const ready = run(['--ready', '--limit', '1']);
  assert.equal(ready.status, 0, ready.stdout + ready.stderr);
  assert.match(ready.stdout, /COURSE_PENDING pending--c.i/);
  assert.match(ready.stdout, /"ready":0,"pending":2,"rendering":0/);
  assert.equal(fs.existsSync(path.join(batch, 'videos')), false);
  const strict = run(['--ready', '--ids', item.id]);
  assert.equal(strict.status, 1);
  assert.match(strict.stdout + strict.stderr, /fixture--equation: Missing/);
  const defaultRun = run([]);
  assert.equal(defaultRun.status, 1);
  assert.match(defaultRun.stdout + defaultRun.stderr, /pending--c.i: Missing/);
  put(item.id, 'audio.json', JSON.stringify({...audio, canonicalSha256:sha256('stale')}));
  const stale = run(['--ready']);
  assert.equal(stale.status, 1);
  assert.match(stale.stdout + stale.stderr, /Stale canonical audio/);
  put(item.id, 'audio.json', '{broken');
  assert.equal(run(['--ready']).status, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(batch, 'catalogue.json'))), catalogue);
  assert.equal(fs.existsSync(path.join(batch, 'videos')), false);
}));

test('renderer hashes only the isolated tutor math dependency, retaining guards for math, geometry and fonts', () => withInputBatch(({batch}) => {
  const source = path.join(batch, 'source');
  const put = (name, value) => {
    const filename = path.join(source, name);
    fs.mkdirSync(path.dirname(filename), {recursive:true});
    fs.writeFileSync(filename, value);
  };
  const math = 'export function stageEquations(step) { return [{...step}]; }';
  const tutor = 'pages/inferencia/exercise-tutor.js';
  const dependencies = ['src/classroom/whiteboard.mjs', 'pages/inferencia/context-diagram.js', 'pages/inferencia/lesson-visuals.js', 'pages/inferencia/vendor/atkinson-latin-400.woff2', 'pages/inferencia/vendor/atkinson-latin-700.woff2'];
  for (const name of dependencies) put(name, 'Original rendering dependency');
  put(tutor, math);
  const original = rendererInputs({source});
  put(tutor, `import {unrelated} from './narration.js?v=changed';\n${math}\nexport function unrelatedTutor() { return 'Edited by the parent'; }`);
  assert.deepEqual(rendererInputs({source}), original);
  put(tutor, math.replace('return [{...step}]', 'return [{...step, tex:"changed"}]'));
  assert.notEqual(rendererInputs({source}).rendererSha256, original.rendererSha256);
  put(tutor, math);
  for (const name of dependencies) {
    put(name, 'Changed rendering dependency');
    assert.notEqual(rendererInputs({source}).rendererSha256, original.rendererSha256, name);
    put(name, 'Original rendering dependency');
  }
  put(tutor, 'export function stageEquations(step) { return externalHelper(step); }');
  assert.throws(() => rendererInputs({source}), /must remain self-contained/);
}));

test('renderer bundles the isolated original equation math without importing unrelated live tutor code', async () => {
  const {stageEquations} = await import('../pages/inferencia/exercise-tutor.js');
  const {mathSource} = rendererInputs();
  const isolated = await import(`data:text/javascript,${encodeURIComponent(mathSource)}`);
  const steps = [{}, {tex:'a=b=c', diagram:{kind:'bars'}}, {tex:String.raw`a=\frac{x=y}{z}=c`}, {tex:String.raw`a=\begin{aligned}x&=y\\z&=w\end{aligned}=c`}, {tex:String.raw`a\=b=c=d`}];
  for (const step of steps) assert.deepEqual(isolated.stageEquations(step), stageEquations(step));
  const temporary = fs.mkdtempSync(path.join(tmpdir(), 'remotion-course-math-'));
  const require = createRequire(new URL('../data-src/course-videos/package.json', import.meta.url));
  try {
    const mathModule = path.join(temporary, 'stage-equations.mjs');
    const entry = path.join(temporary, 'entry.mjs');
    fs.writeFileSync(mathModule, mathSource);
    fs.writeFileSync(entry, "export {stageEquations} from '../../pages/inferencia/exercise-tutor.js';");
    const compiler = require('webpack')(rendererWebpack({mode:'production', target:'node', entry, output:{path:temporary, filename:'math.cjs', library:{type:'commonjs2'}}, plugins:[]}, mathModule));
    const statistics = await new Promise((resolve, reject) => compiler.run((error, result) => compiler.close(closeError => error || closeError ? reject(error || closeError) : resolve(result))));
    assert.equal(statistics.hasErrors(), false, statistics.toString({all:false, errors:true}));
    const bundled = require(path.join(temporary, 'math.cjs'));
    for (const step of steps) assert.deepEqual(bundled.stageEquations(step), stageEquations(step));
    assert.ok(!fs.readFileSync(path.join(temporary, 'math.cjs'), 'utf8').includes('mountExerciseTutor'));
  } finally {fs.rmSync(temporary, {recursive:true, force:true});}
});

test('fixture publication is refused independently for catalogue and measured audio provenance', () => withInputBatch(({batch, catalogue, item, audio, mp3, put}) => {
  const dependencies = {probe:() => ({duration:audio.duration}), diagnose:() => {}};
  put(item.id, 'audio.mp3', mp3);
  put(item.id, 'audio.json', JSON.stringify({...audio, testFixture:true}));
  assert.throws(() => prepareBatchInputs(batch, catalogue, {ids:[item.id], publish:true}, dependencies), /Cannot publish fixture/);
  put(item.id, 'audio.json', JSON.stringify(audio));
  assert.throws(() => prepareBatchInputs(batch, {...catalogue, testFixture:true}, {ids:[item.id], publish:true}, dependencies), /Cannot publish fixture/);
}));

async function courseItems() {
  const require = createRequire(import.meta.url);
  globalThis.jStat = require('jstat').jStat;
  const {COURSE} = await import('../pages/inferencia/course.js');
  const {createLessonSections} = await import('../pages/inferencia/lesson-sections.js');
  const {createLessonAnimation} = await import('../pages/inferencia/animations.js');
  const {enrichLessonAnimation, enrichGlobalAnimation} = await import('../pages/inferencia/lesson-visuals.js');
  const {generateExercise} = await import('../pages/inferencia/exercises.js');
  const {exerciseCatalogue, exerciseAnimation} = await import('../pages/inferencia/exercise-solutions.js');
  const {parseHTML} = await import('linkedom');
  const {document} = parseHTML('<html><body></body></html>');
  const paragraphs = html => {const element = document.createElement('div'); element.innerHTML = html; return Array.from(element.querySelectorAll('p'), paragraph => paragraph.textContent);};
  const lessons = COURSE.units.flatMap(unit => unit.lessons);
  const make = (kind, animation) => ({id:animation.id, kind, title:animation.title, canonicalSha256:sha256(JSON.stringify(animation)), animation});
  return [
    ...lessons.flatMap(lesson => createLessonSections(lesson).map(section => make('section', enrichLessonAnimation(section.animation)))),
    ...lessons.map(lesson => make('recap', enrichGlobalAnimation(createLessonAnimation(lesson, generateExercise, paragraphs)))),
    ...exerciseCatalogue().flatMap(exercise => exercise.questions.map(question => make('exercise', exerciseAnimation(exercise, question))))
  ];
}

function fixtureAudio(item, mp3, duration) {
  const count = item.animation.steps.reduce((sum, step) => sum + step.cues.length, 0);
  let position = 0;
  const scenes = item.animation.steps.map(step => {
    const start = position / count * duration;
    const cues = step.cues.map(cue => ({text:cue.text ?? cue, start:position++ / count * duration, end:position / count * duration}));
    return {start, end:position / count * duration, cues};
  });
  return {id:item.id, title:item.title, model:MODEL, voice:VOICE, duration, cueTiming:'measured', canonicalSha256:item.canonicalSha256, mp3Sha256:sha256(mp3), mp3Bytes:mp3.length, scenes, testFixture:true};
}

test('all 118 sections, 36 recaps and 387 question explanations retain every frozen visual and cue', async () => {
  const items = await courseItems();
  assert.deepEqual(['section', 'recap', 'exercise'].map(kind => items.filter(item => item.kind === kind).length), [118, 36, 387]);
  const mp3 = Buffer.from('Temporary contract fixture only');
  const contexts = new Set();
  for (const item of items) {
    const original = JSON.stringify(item.animation);
    const storyboard = prepareCourseItem(item, fixtureAudio(item, mp3, item.animation.steps.reduce((sum, step) => sum + step.cues.length, 0)), mp3);
    for (const [index, scene] of storyboard.audio.scenes.entries()) {
      for (const [cueIndex, cue] of scene.cues.entries()) {
        const state = courseFrame(storyboard, Math.ceil(cue.start * 30));
        assert.equal(state.index, index, item.id);
        assert.equal(state.cueIndex, cueIndex, item.id);
        assert.equal(state.step, item.animation.steps[index]);
        if (state.step.visual?.context) contexts.add(state.step.visual.context.kind);
      }
    }
    assert.equal(JSON.stringify(item.animation), original);
  }
  assert.ok(contexts.has('joint-normal') && contexts.has('matrix') && contexts.has('tree'));
});

test('frozen catalogue sections reach the renderer with authored initial diagrams', async () => {
  const {buildCatalogue} = await import('../scripts/tts/gemini-course.mjs');
  const {selectContextDiagram} = await import('../pages/inferencia/context-diagram.js');
  const catalogue = await buildCatalogue();
  const sections = catalogue.items.filter(item => item.kind === 'section');
  const recaps = catalogue.items.filter(item => item.kind === 'recap');
  assert.equal(sections.length, 118);
  assert.equal(recaps.length, 36);
  const mp3 = Buffer.from('Temporary contract fixture only');
  for (const item of [...sections, ...recaps]) {
    const frozen = JSON.stringify(item);
    const storyboard = prepareCourseItem(item, fixtureAudio(item, mp3, 60), mp3);
    const initial = courseFrame(storyboard, 0);
    assert.ok(selectContextDiagram(initial.step.visual, -1).diagram, `${item.id}: missing initial diagram`);
    assert.equal(JSON.stringify(item), frozen);
  }
});

test('six-cue previews preserve original authored figures from the first frame through cues five and six', async () => {
  const {buildCatalogue} = await import('../scripts/tts/gemini-course.mjs');
  const {selectContextDiagram} = await import('../pages/inferencia/context-diagram.js');
  const original = (await buildCatalogue()).items.find(item => item.id === 'proporciones--parte-y-total');
  const frozen = JSON.stringify(original);
  const mp3 = Buffer.from('Temporary contract fixture only');
  const full = prepareCourseItem(original, fixtureAudio(original, mp3, 32), mp3);
  const preview = partialPreviewItem(original, 6);
  const storyboard = prepareCourseItem(preview, fixtureAudio(preview, mp3, 12), mp3);
  for (const [cueIndex, cue] of storyboard.audio.scenes[0].cues.entries()) {
    const state = courseFrame(storyboard, Math.ceil(cue.start * 30));
    const expected = selectContextDiagram(full.animation.steps[0].visual, cueIndex);
    assert.deepEqual(selectContextDiagram(state.step.visual, state.cueIndex), expected);
  }
  const before = selectContextDiagram(storyboard.animation.steps[0].visual, -1).diagram;
  assert.ok(before.kind && before.label);
  const question = selectContextDiagram(storyboard.animation.steps[0].visual, 3).diagram;
  assert.deepEqual(question.values, [18, 30]);
  for (const cueIndex of [4, 5]) {
    const diagram = selectContextDiagram(storyboard.animation.steps[0].visual, cueIndex).diagram;
    assert.deepEqual(diagram.values, [18, 54]);
    assert.equal(diagram.total, 72);
  }
  const initial = courseFrame(storyboard, 0);
  courseFrame(storyboard, storyboard.frames - 1);
  assert.deepEqual(courseFrame(storyboard, 0), initial);
  assert.equal(JSON.stringify(original), frozen);
  const broken = structuredClone(original);
  broken.animation.steps[0].cues[1].text = 'Changed frozen anchor';
  assert.throws(() => partialPreviewItem(broken, 6), /visual anchor must match exactly once/);
});

test('authored context requires visible problem text or TeX, with only a cue-bounded exercise greeting exception', () => {
  const prompt = {label:'Objetivo', value:'Original problem', cue:1};
  const answer = {tex:'original=answer', cue:2};
  const step = {cues:['Vamos a resolver este apartado juntos.', 'Original problem', 'Original answer'], visual:{lines:[prompt, answer]}};
  const state = {index:0, cueIndex:0, step};
  assert.deepEqual(authoredSceneContent(state), {lines:[], opening:true});
  assert.deepEqual(authoredSceneContent({...state, cueIndex:1}), {lines:[prompt], opening:false});
  assert.deepEqual(authoredSceneContent({...state, cueIndex:2}), {lines:[prompt, answer], opening:false});
  assert.equal(authoredSceneContent({...state, index:1}).opening, false);
  assert.equal(authoredSceneContent({...state, step:{...step, cues:['Unrelated introduction', 'Original problem']}}).opening, false);
  assert.deepEqual(authoredSceneContent({...state, cueIndex:1}, [{label:'Heading only'}, {value:' '}, {tex:''}, answer]), {lines:[], opening:false});
  assert.equal(authoredSceneContent({...state, step:{...step, visual:{lines:[answer]}}}).opening, false);
  assert.equal(authoredSceneContent({...state, cueIndex:-1, step:{...step, visual:{lines:[{...prompt, cue:0}]}}}).opening, true);
});

test('all 387 frozen exercises have supported authored problem context at every substantive cue without invented diagrams', async () => {
  const {buildCatalogue} = await import('../scripts/tts/gemini-course.mjs');
  const {selectContextDiagram, drawContextDiagram} = await import('../pages/inferencia/context-diagram.js');
  const {planWhiteboardScene, whiteboardFrameLines} = await import('../src/classroom/whiteboard.mjs');
  const {createCanvas, GlobalFonts} = createRequire(import.meta.url)('@napi-rs/canvas');
  for (const weight of [400, 700]) GlobalFonts.registerFromPath(fileURLToPath(new URL(`../pages/inferencia/vendor/atkinson-latin-${weight}.woff2`, import.meta.url)), 'Atkinson');
  const drawing = createCanvas(520, 300).getContext('2d');
  const diagramVariants = new Set();
  const diagramKinds = new Set();
  const catalogue = process.env.REMOTION_FROZEN_CATALOGUE ? JSON.parse(fs.readFileSync(process.env.REMOTION_FROZEN_CATALOGUE, 'utf8')) : await buildCatalogue();
  assert.equal(catalogue.items.length, 541);
  assert.deepEqual(['section', 'recap', 'exercise'].map(kind => catalogue.items.filter(item => item.kind === kind).length), [118, 36, 387]);
  const exercises = catalogue.items.filter(item => item.kind === 'exercise');
  assert.equal(exercises.length, 387);
  const mp3 = Buffer.from('Temporary contract fixture only');
  for (const item of catalogue.items) {
    const frozen = JSON.stringify(item);
    prepareCourseItem(item, fixtureAudio(item, mp3, 60), mp3);
    assert.equal(JSON.stringify(item), frozen);
  }
  let textOnly = 0;
  for (const item of exercises) {
    const frozen = JSON.stringify(item);
    const storyboard = prepareCourseItem(item, fixtureAudio(item, mp3, 60), mp3);
    assert.deepEqual(storyboard.animation, item.animation);
    let meaningfulCues = 0;
    for (const [index, step] of storyboard.animation.steps.entries()) {
      const plan = planWhiteboardScene(storyboard.animation.id, step);
      assert.equal(plan.kind, 'story', `${item.id}/${index}: unsupported exercise scene`);
      for (let cueIndex = 0; cueIndex < step.cues.length; cueIndex++) {
        const content = authoredSceneContent({index, step, cueIndex}, whiteboardFrameLines(plan, cueIndex));
        const {diagram, phase} = selectContextDiagram(plan, cueIndex);
        assert.ok(diagram || content.lines.length || content.opening, `${item.id}/${index}/${cueIndex}: empty problem context`);
        if (diagram) {
          const variant = JSON.stringify({diagram, phase});
          if (!diagramVariants.has(variant)) {
            drawing.clearRect(0, 0, 520, 300);
            const geometry = drawContextDiagram(drawing, diagram, 520, 300, {phase, compact:true});
            assert.ok(geometry?.marks > 0, `${item.id}/${index}/${cueIndex}: unsupported diagram ${diagram.kind}`);
            diagramVariants.add(variant);
            diagramKinds.add(geometry.kind);
          }
        }
        if (cueIndex >= 0 && (diagram || content.lines.length)) meaningfulCues++;
      }
    }
    if (!item.animation.steps.some(step => step.visual?.context)) textOnly++;
    assert.ok(meaningfulCues > 0, `${item.id}: heading-only exercise`);
    assert.equal(JSON.stringify(item), frozen);
  }
  assert.ok(textOnly > 0, 'Actual text-and-equation exercises were not covered');
  console.log(`REMOTION_EXERCISE_CONTRACT ${JSON.stringify({items:catalogue.items.length, exercises:exercises.length, textOnly, diagramVariants:diagramVariants.size, diagramKinds:[...diagramKinds].sort()})}`);
});

test('posters use the last visible representative cue, never a blank median or trailing hold', () => {
  const sample = (frame, cue, marks = 20) => ({frame, scene:0, cue, diagram:'bars', marks, errors:[]});
  assert.equal(representativeFrame([sample(0, 0), sample(401, 3, 0), sample(514, 4), sample(620, 5), sample(727, 5)]), 620);
  assert.throws(() => representativeFrame([sample(401, 3, 0)]), /No representative cue/);
  const problem = {frame:40, scene:1, cue:0, errors:[], authored:[{value:'Original problem', inkPixels:30, equationPaths:0}]};
  const equation = {frame:70, scene:2, cue:1, errors:[], authored:[{tex:'a=b', inkPixels:20, equationPaths:2}]};
  assert.equal(representativeFrame([problem, equation]), 70);
  assert.throws(() => representativeFrame([{...problem, authored:[{value:'Heading only', inkPixels:0}]}]), /No representative cue/);
  assert.throws(() => representativeFrame([{...equation, authored:[{tex:'a=b', inkPixels:20, equationPaths:0}]}]), /No representative cue/);
});

test('opt-in temporary Remotion MP4: diagrams plus complete first frozen exercise, decode, resume and source guards', {skip:process.env.REMOTION_SMOKE !== '1', timeout:600000}, async () => {
  const batch = fs.mkdtempSync(path.join(tmpdir(), 'remotion-course-fixture-'));
  const runner = fileURLToPath(new URL('../data-src/course-videos/render-course.mjs', import.meta.url));
  try {
    const items = await courseItems();
    const normal = items.find(item => item.kind === 'section' && item.animation.steps.some(step => step.visual?.context?.kind === 'joint-normal'));
    const matrix = items.find(item => item.kind === 'exercise' && item.animation.steps.some(step => step.visual?.context?.kind === 'matrix'));
    const steps = [normal, matrix].map(item => item.animation.steps.find(step => step.visual?.context?.kind === (item === normal ? 'joint-normal' : 'matrix')));
    const item = {id:'temporary-fixture--math-context', kind:'section', title:'TEMPORARY FIXTURE - tone audio, not narration', canonicalSha256:sha256(JSON.stringify(steps)), animation:{id:'temporary-fixture', source:'Temporary verification only', steps}};
    const {buildCatalogue} = await import('../scripts/tts/gemini-course.mjs');
    const frozenBytes = process.env.REMOTION_FROZEN_CATALOGUE ? fs.readFileSync(process.env.REMOTION_FROZEN_CATALOGUE) : Buffer.from(JSON.stringify(await buildCatalogue()));
    const frozenExercises = JSON.parse(frozenBytes).items.filter(entry => entry.kind === 'exercise');
    const firstExercise = frozenExercises[0];
    const exercise = frozenExercises.find(entry => entry.animation.steps.every(step => !step.visual?.context));
    const frozenExercise = JSON.stringify(exercise);
    const selected = [item, firstExercise, exercise];
    const cueFile = path.join(batch, 'measured-synthetic-cue.wav');
    execFileSync('/usr/bin/ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.4:sample_rate=24000', cueFile]);
    const cueDuration = Number(JSON.parse(execFileSync('/usr/bin/ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', cueFile], {encoding:'utf8'})).format.duration);
    assert.equal(cueDuration, 0.4);
    for (const selectedItem of selected) {
      const directory = path.join(batch, 'items', selectedItem.id);
      fs.mkdirSync(directory, {recursive:true});
      const count = selectedItem.animation.steps.reduce((sum, step) => sum + step.cues.length, 0);
      execFileSync('/usr/bin/ffmpeg', ['-v', 'error', '-stream_loop', String(count - 1), '-i', cueFile, '-c:a', 'libmp3lame', path.join(directory, 'audio.mp3')]);
      const audio = {...fixtureAudio(selectedItem, fs.readFileSync(path.join(directory, 'audio.mp3')), count * cueDuration), fixtureProvenance:{kind:'synthetic-tone-not-speech', measuredBy:'ffprobe', cueDuration, cueSha256:sha256(fs.readFileSync(cueFile))}};
      fs.writeFileSync(path.join(directory, 'audio.json'), JSON.stringify(audio));
    }
    const provenance = {testFixture:true, sourceCatalogueSha256:sha256(frozenBytes), originalExerciseIds:[firstExercise.id, exercise.id]};
    const catalogueBytes = JSON.stringify({version:1, model:MODEL, voice:VOICE, style:'Temporary measured synthetic fixture, not speech', testFixture:true, provenance, items:selected});
    fs.writeFileSync(path.join(batch, 'catalogue.json'), catalogueBytes);
    const run = extra => execFileSync(process.execPath, [runner, '--batch', batch, '--worker', ...(extra || [])], {encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'], maxBuffer:4 * 1024 * 1024});
    assert.match(run(), /COURSE_RENDERED/);
    const records = selected.map(selectedItem => JSON.parse(fs.readFileSync(path.join(batch, 'videos', selectedItem.id, 'metadata.json'))));
    const diagrams = new Set(records[0].evidence.layout.map(entry => entry.diagram));
    assert.ok(diagrams.has('joint-normal') && diagrams.has('matrix'));
    for (const [index, metadata] of records.entries()) {
      assert.equal(metadata.testFixture, true);
      assert.ok(metadata.evidence.layout.every(entry => !entry.errors.length));
      assert.equal(metadata.sourceSnapshot.catalogueSha256, sha256(catalogueBytes));
      assert.equal(metadata.sourceSnapshot.itemSha256, sha256(JSON.stringify(selected[index])));
      assert.equal(metadata.sourceSnapshot.canonicalSha256, selected[index].canonicalSha256);
      assert.deepEqual(metadata.sourceSnapshot.provenance, provenance);
      assert.deepEqual(metadata.sourceSnapshot.rendererSources, rendererInputs().sourceHashes);
      assert.ok(metadata.evidence.layout.some(entry => entry.authored?.some(line => line.tex && line.equationPaths > 0 && line.inkPixels > 0)));
    }
    for (const [selectedIndex, selectedExercise] of selected.entries()) if (selectedExercise.kind === 'exercise') {
      for (const [index, step] of selectedExercise.animation.steps.entries()) for (let cue = 0; cue < step.cues.length; cue++) {
        assert.ok(records[selectedIndex].evidence.layout.some(entry => entry.scene === index && entry.cue === cue), `${selectedExercise.id}/${index}/${cue}: missing actual layout evidence`);
      }
    }
    const exerciseLayout = records[2].evidence.layout;
    assert.ok(exerciseLayout.some(entry => !entry.diagram && entry.authored.some(line => line.value && line.inkPixels > 0)));
    assert.equal(JSON.stringify(exercise), frozenExercise);
    const problemLine = exercise.animation.steps[0].visual.lines.find(line => line.value);
    assert.ok(exerciseLayout.some(entry => entry.scene === 0 && entry.authored.some(line => line.value === problemLine.value && line.inkPixels > 0)));
    assert.match(run(), /COURSE_REUSED/);
    assert.throws(() => run(['--publish']), error => error.status === 1 && /Cannot publish fixture/.test(String(error.stdout) + String(error.stderr)));
    const metadataPath = path.join(batch, 'videos', item.id, 'metadata.json');
    const metadataBytes = fs.readFileSync(metadataPath);
    const changedSnapshot = structuredClone(records[0]);
    changedSnapshot.sourceSnapshot.catalogueSha256 = sha256('Changed snapshot');
    fs.writeFileSync(metadataPath, JSON.stringify(changedSnapshot));
    assert.throws(() => run(), error => error.status === 1 && /Stale source snapshot/.test(String(error.stdout) + String(error.stderr)));
    fs.writeFileSync(metadataPath, metadataBytes);
    const audioPath = path.join(batch, 'items', item.id, 'audio.json');
    const audio = JSON.parse(fs.readFileSync(audioPath));
    audio.title = 'Changed frozen input';
    fs.writeFileSync(audioPath, JSON.stringify(audio));
    assert.throws(() => run(), error => error.status === 1 && /stale render/.test(String(error.stdout) + String(error.stderr)));
    if (process.env.REMOTION_FROZEN_CATALOGUE) assert.equal(sha256(fs.readFileSync(process.env.REMOTION_FROZEN_CATALOGUE)), sha256(frozenBytes));
    console.log(`REMOTION_FIXTURE_PROOF ${JSON.stringify({testFixture:true, provenance, records:records.map(metadata => ({id:metadata.id, frames:metadata.frames, layoutFrames:metadata.evidence.layout.length, scenes:new Set(metadata.evidence.layout.map(entry => entry.scene)).size, pixelSamples:metadata.evidence.pixels.length, nonblank:metadata.evidence.pixels.every(entry => entry.ink > 0), elapsedSeconds:metadata.evidence.elapsedSeconds})), browserClosed:JSON.parse(fs.readFileSync(path.join(batch, 'videos/remotion-run.json'))).browserClosed})}`);
    if (process.env.REMOTION_KEEP_FIXTURE === '1') console.log(`REMOTION_TEMPORARY_BATCH ${batch}`);
  } finally {
    if (process.env.REMOTION_KEEP_FIXTURE !== '1') fs.rmSync(batch, {recursive:true, force:true});
  }
});

test('opt-in real six-cue preview renders only from a temporary copy and preserves all source bytes', {skip:!process.env.REMOTION_REAL_PREVIEW, timeout:600000}, () => {
  const original = fs.realpathSync(process.env.REMOTION_REAL_PREVIEW);
  const catalogueBytes = fs.readFileSync(path.join(original, 'catalogue.json'));
  const catalogue = JSON.parse(catalogueBytes);
  assert.equal(catalogue.preview, true);
  assert.equal(catalogue.items.length, 1);
  const item = catalogue.items[0];
  assert.equal(item.partialCoverage.includedCues, 6);
  const sourceBatch = catalogue.provenance.sourceBatch;
  assert.ok(path.isAbsolute(sourceBatch));
  const files = directory => fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  const publication = ['static/audio/manifest.json', 'static/videos/manifest.json'].map(name => fileURLToPath(new URL(`../${name}`, import.meta.url))).filter(filename => fs.existsSync(filename));
  const originals = [...files(original), path.join(sourceBatch, 'catalogue.json'), path.join(sourceBatch, 'progress.json'), ...files(path.join(sourceBatch, 'items')), ...publication];
  const snapshot = () => originals.map(filename => [filename, sha256(fs.readFileSync(filename))]);
  const before = snapshot();
  const rendererBefore = rendererInputs();
  const batch = fs.mkdtempSync(path.join(tmpdir(), 'remotion-course-real-preview-'));
  try {
    fs.writeFileSync(path.join(batch, 'catalogue.json'), catalogueBytes);
    fs.cpSync(path.join(original, 'items'), path.join(batch, 'items'), {recursive:true});
    const runner = fileURLToPath(new URL('../data-src/course-videos/render-course.mjs', import.meta.url));
    const run = extra => execFileSync(process.execPath, [runner, '--batch', batch, '--worker', ...(extra || [])], {encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'], maxBuffer:4 * 1024 * 1024});
    assert.match(run(), /COURSE_RENDERED/);
    const metadata = JSON.parse(fs.readFileSync(path.join(batch, 'videos', item.id, 'metadata.json')));
    const audio = JSON.parse(fs.readFileSync(path.join(batch, 'items', item.id, 'audio.json')));
    assert.equal(metadata.preview, true);
    assert.equal(metadata.testFixture, false);
    assert.equal(metadata.frames, Math.ceil(audio.duration * 30));
    assert.equal(metadata.audioSha256, audio.mp3Sha256);
    assert.deepEqual(metadata.provenance, catalogue.provenance);
    assert.equal(metadata.sourceSnapshot.catalogueSha256, sha256(catalogueBytes));
    assert.deepEqual(metadata.sourceSnapshot.provenance, catalogue.provenance);
    assert.ok(metadata.evidence.layout.every(entry => !entry.errors.length && entry.diagram && entry.marks > 0));
    for (let cue = 0; cue < 6; cue++) assert.ok(metadata.evidence.layout.some(entry => entry.scene === 0 && entry.cue === cue));
    assert.ok(new Set(metadata.evidence.layout.map(entry => entry.canvasSha256)).size > 1);
    assert.equal(JSON.parse(fs.readFileSync(path.join(batch, 'videos/remotion-run.json'))).browserClosed, true);
    assert.throws(() => run(['--publish']), error => error.status === 1 && /Cannot publish partial preview/.test(String(error.stdout) + String(error.stderr)));
    console.log(`REMOTION_REAL_PREVIEW_PROOF ${JSON.stringify({id:item.id, preview:true, testFixture:false, cues:6, frames:metadata.frames, layoutFrames:metadata.evidence.layout.length, sourceCatalogueSha256:catalogue.provenance.sourceCatalogueSha256, previewCatalogueSha256:metadata.sourceSnapshot.catalogueSha256, rendererSha256:metadata.rendererSha256, audioSha256:metadata.audioSha256, sourceFilesChecked:originals.length, browserClosed:true})}`);
  } finally {
    fs.rmSync(batch, {recursive:true, force:true});
    assert.deepEqual(snapshot(), before, 'Original batch, real preview or publication bytes changed');
    assert.deepEqual(rendererInputs(), rendererBefore, 'Renderer source changed');
  }
});