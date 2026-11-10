import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {canonicalContent, canonicalLectures, documentMetadata, encodeMp3, estimateSceneCues, inside, prepareAudio, prepareDocuments, probeAudio, publicProvenance, safeName, sceneSubtitles, validateLesson, validateTimeline} from '../scripts/prepare-media.mjs';
import {exportNarration} from '../scripts/tts/export-narration.mjs';
import {canonicalSections, prepareSections, retainedSection} from '../scripts/tts/prepare-sections.mjs';

const pdf = Buffer.from('%PDF-1.7\n1 0 obj <<>> endobj\n%%EOF\n');

test('PDF metadata keeps original filenames and classifies all document groups', () => {
  for (const [filename, category] of [
    ['FundamentosInferencia_Tema1.pdf', 'temario'],
    ['Ejercicios_Unidad_1-Soluciones.pdf', 'ejercicios'],
    ['Ejercicios_U3-Distribuciones_multivariantes-SOLUCIONES.pdf', 'ejercicios'],
    ['UOC-MU-IE-2026-27-S1-PEC1-enunciado-1.pdf', 'evaluacion']
  ]) {
    const metadata = documentMetadata(filename, pdf);
    assert.equal(metadata.filename, filename);
    assert.equal(metadata.category, category);
    assert.equal(metadata.size, pdf.length);
    assert.ok(metadata.title.length > 10);
  }
  assert.throws(() => documentMetadata('FundamentosInferencia_Tema1.pdf', Buffer.from('not a PDF')));
  assert.throws(() => documentMetadata('FundamentosInferencia_Tema1.pdf', pdf.subarray(0, -8)));
});

test('input paths reject traversal, control characters and escaping symlinks', context => {
  const root = mkdtempSync(join(tmpdir(), 'media-paths-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  mkdirSync(join(root, 'input'));
  writeFileSync(join(root, 'outside.pdf'), pdf);
  symlinkSync(join(root, 'outside.pdf'), join(root, 'input', 'escape.pdf'));
  for (const name of ['../file.pdf', '/file.pdf', 'a\\b.pdf', '.', '..', 'a\n.pdf']) assert.throws(() => safeName(name));
  assert.throws(() => inside(join(root, 'input'), 'escape.pdf'));
});

test('PDF preparation copies bytes, emits public metadata and preserves previous assets', context => {
  const root = mkdtempSync(join(tmpdir(), 'media-pdf-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const input = join(root, 'input');
  const output = join(root, 'output');
  mkdirSync(input);
  mkdirSync(output);
  writeFileSync(join(input, 'FundamentosInferencia_Tema1.pdf'), pdf);
  writeFileSync(join(output, 'previous.pdf'), pdf);
  const result = prepareDocuments(input, output);
  assert.deepEqual(readFileSync(join(output, result.documents[0].filename)), pdf);
  assert.deepEqual(JSON.parse(readFileSync(join(output, 'manifest.json'))), result);
  assert.deepEqual(readFileSync(join(output, 'previous.pdf')), pdf);
  assert.ok(!JSON.stringify(result).includes(root));
  assert.deepEqual(prepareDocuments(input, output), result);
});

const canonical = {
  id: 'example', title: 'Example', source: {document: 'Example'},
  scenes: [
    {title: 'First', caption: 'First caption.', chapter: 'Theory', kind: 'lesson', cues: [{text: 'First caption.', start: 0, end: 2}]},
    {title: 'Second', caption: 'Second caption.', chapter: 'Theory', kind: 'lesson', cues: [{text: 'Second caption.', start: 2, end: 4}]}
  ]
};
const measured = () => [
  {start: 0, end: 3, cues: [{text: 'First caption.', start: 0.2, end: 2.8}]},
  {start: 3.3, end: 6, cues: [{text: 'Second caption.', start: 3.5, end: 5.9}]}
];

test('canonical comparison ignores estimates but never captions, scene order or cue texts', () => {
  const same = structuredClone(canonical);
  same.scenes[0].cues[0].start = 88;
  assert.deepEqual(canonicalContent(same), canonicalContent(canonical));
  same.scenes[0].caption += ' Changed';
  assert.notDeepEqual(canonicalContent(same), canonicalContent(canonical));
  const reordered = structuredClone(canonical);
  reordered.scenes.reverse();
  assert.notDeepEqual(canonicalContent(reordered), canonicalContent(canonical));
});

test('measured cues must be canonical, global, ordered and inside complete scenes', () => {
  assert.deepEqual(validateTimeline(measured(), canonical, 6), measured());
  for (const mutate of [
    scenes => { delete scenes[0].cues; },
    scenes => { scenes[1].cues[0].start = 0; },
    scenes => { scenes[1].cues[0].end = 6.1; },
    scenes => { scenes[0].cues[0].text = 'Changed'; },
    scenes => { scenes[1].start = 2.9; },
    scenes => { scenes.pop(); }
  ]) {
    const scenes = measured();
    mutate(scenes);
    assert.throws(() => validateTimeline(scenes, canonical, 6));
  }
  assert.throws(() => validateTimeline(measured(), canonical, 7));
});

test('lesson validation rejects scene-only subtitles instead of inventing cue timings', () => {
  const snapshot = structuredClone(canonical);
  snapshot.scenes.forEach(scene => { scene.spoken_text = scene.caption; });
  const report = {
    id: canonical.id, title: canonical.title, source: canonical.source,
    signature: 'a'.repeat(64), sha256: 'b'.repeat(64), frames: 6 * 44100,
    sample_rate: 44100, duration_seconds: 6, scene_count: 2, cue_timing: 'measured',
    scenes: measured().map((scene, index) => ({...scene, title: snapshot.scenes[index].title, chapter: 'Theory', text: snapshot.scenes[index].spoken_text}))
  };
  assert.deepEqual(validateLesson(report, snapshot, canonical, canonical), measured());
  const sceneOnly = structuredClone(report);
  sceneOnly.scenes.forEach(scene => { delete scene.cues; });
  assert.throws(() => validateLesson(sceneOnly, snapshot, canonical, canonical), /Faltan cues medidas/);
  const estimated = validateLesson(sceneOnly, snapshot, canonical, canonical, {allowEstimatedCues:true});
  assert.deepEqual(estimated, estimateSceneCues(sceneOnly.scenes, canonical).map(scene => ({start:scene.start, end:scene.end, cues:scene.cues})));
  assert.equal(estimated[1].cues[0].start, sceneOnly.scenes[1].start);
  assert.equal(estimated[1].cues[0].end, sceneOnly.scenes[1].end);
  const estimates = structuredClone(report);
  estimates.cue_timing = 'estimated';
  assert.throws(() => validateLesson(estimates, snapshot, canonical, canonical), /alineacion medida/);
  const changed = structuredClone(snapshot);
  changed.scenes[0].caption = 'Changed';
  assert.throws(() => validateLesson(report, changed, canonical, canonical), /Guion congelado/);
  assert.throws(() => validateLesson({...report, scene_count: 1}, snapshot, canonical, canonical), /Agregado incompleto/);
});

test('original scene VTT parser preserves measured global timestamps and text', () => {
  assert.deepEqual(sceneSubtitles('WEBVTT\n\n1\n00:00:00.000 --> 00:00:03.250\nFirst\n\n2\n00:00:03.550 --> 00:01:01.100\nSecond\n'), [
    {start: 0, end: 3.25, text: 'First'}, {start: 3.55, end: 61.1, text: 'Second'}
  ]);
  assert.throws(() => sceneSubtitles('not VTT'));
  assert.throws(() => sceneSubtitles('WEBVTT\n\n1\n00:90:00.000 --> 00:00:03.000\nInvalid'));
});

const root = fileURLToPath(new URL('../', import.meta.url));

test('all eight versioned PDFs have exact original names, valid headers and manifest sizes', () => {
  const directory = join(root, 'static/materiales');
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json')));
  const expected = [
    'Ejercicios_U3-Distribuciones_multivariantes-SOLUCIONES.pdf',
    'Ejercicios_Unidad_1-Soluciones.pdf',
    'Ejercicios_Unidad_2-Soluciones.pdf',
    'FundamentosInferencia_Tema1.pdf',
    'FundamentosInferencia_Tema2.pdf',
    'FundamentosInferencia_Tema3.pdf',
    'FundamentosInferencia_Tema4.pdf',
    'UOC-MU-IE-2026-27-S1-PEC1-enunciado-1.pdf'
  ];
  assert.deepEqual(manifest.documents.map(item => item.filename).sort(), expected);
  for (const item of manifest.documents) {
    const bytes = readFileSync(inside(directory, item.filename));
    assert.deepEqual(documentMetadata(item.filename, bytes), item);
    assert.equal(statSync(join(directory, item.filename)).size, item.size);
  }
});

function validateVersionedAudio(directory, lectures, sections) {
  assert.equal(lectures.length, 36);
  assert.equal(sections.length, 118);
  const globals = new Map(lectures.map(lesson => [lesson.id, lesson]));
  const sectionMap = new Map(sections.map(lesson => [lesson.id, lesson]));
  const canonicalById = new Map([...globals, ...sectionMap]);
  assert.equal(canonicalById.size, 154, 'Canonical audio IDs must be unique');
  for (const section of sections) {
    assert.ok(globals.has(section.parentLesson), 'Unknown parent lesson');
    assert.equal(section.id, `${section.parentLesson}--${section.sectionId}`);
  }
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json')));
  const provenance = JSON.parse(readFileSync(join(directory, 'provenance.json')));
  assert.equal(manifest.version, 1);
  assert.equal(provenance.version, 1);
  assert.equal(provenance.exporter, 'data-src/inferencia-estadistica/export-lecturas.mjs');
  assert.deepEqual(Object.keys(provenance.lessons).sort(), Object.keys(manifest.lessons).sort(), 'Manifest and provenance IDs differ');
  for (const id of Object.keys(manifest.lessons)) assert.ok(canonicalById.has(id), `Unknown audio ID: ${id}`);
  assert.deepEqual(
    readdirSync(directory).filter(name => name.toLowerCase().endsWith('.mp3')).sort(),
    Object.keys(manifest.lessons).map(id => `${id}.mp3`).sort(),
    'Published MP3 files must belong to the current playback manifest'
  );
  for (const [id, lesson] of Object.entries(manifest.lessons)) {
    const current = canonicalById.get(id);
    assert.equal(lesson.src, `audio/${id}.mp3`);
    if (sectionMap.has(id)) {
      assert.equal(provenance.sectionExporter, 'scripts/tts/export-narration.mjs');
      const frozen = {...current, scenes:lesson.scenes.map((scene, index) => ({
        ...current.scenes[index],
        caption:scene.cues.map(cue => cue.text).join(' '),
        cues:scene.cues
      }))};
      retainedSection(directory, frozen, lesson, provenance.lessons[id]);
      const currentHash = createHash('sha256').update(JSON.stringify(canonicalContent(current))).digest('hex');
      if (currentHash === provenance.lessons[id].canonicalSha256) {
        retainedSection(directory, current, lesson, provenance.lessons[id]);
      } else {
        assert.throws(() => retainedSection(directory, current, lesson, provenance.lessons[id]), {code:'ERR_ASSERTION'});
        assert.throws(() => validateTimeline(lesson.scenes, current, provenance.lessons[id].sourceDuration), {code:'ERR_ASSERTION'});
      }
      continue;
    }
    const origin = publicProvenance(provenance.lessons[id]);
    assert.equal(lesson.cueTiming, origin.timing);
    assert.equal(origin.canonicalSha256, createHash('sha256').update(JSON.stringify(canonicalContent(current))).digest('hex'));
    const bytes = readFileSync(inside(directory, `${id}.mp3`));
    assert.equal(origin.mp3Bytes, bytes.length);
    assert.equal(origin.mp3Sha256, createHash('sha256').update(bytes).digest('hex'));
    validateTimeline(lesson.scenes, current, origin.sourceDuration);
    assert.ok(Number.isFinite(lesson.duration) && lesson.duration > 0 && Math.abs(lesson.duration - origin.sourceDuration) < 0.15);
  }
  for (const name of ['manifest.json', 'provenance.json', 'prepare-report.json', 'prepare-sections-report.json'].filter(name => existsSync(join(directory, name)))) {
    const text = readFileSync(join(directory, name), 'utf8');
    assert.ok(!/(?:\/home\/|\/mnt\/|file:\/\/|[A-Za-z]:\\|spoken_text|reference_text|prompt_wav|model_path)/.test(text), `${name} leaks private inputs`);
  }
}

test('published audio validates signed recordings and permits an empty catalogue without orphaned MP3s', async context => {
  const temporary = mkdtempSync(join(tmpdir(), 'media-canonical-'));
  context.after(() => rmSync(temporary, {recursive: true, force: true}));
  const lectures = await canonicalLectures(temporary);
  const sections = await canonicalSections(temporary);
  assert.deepEqual(readdirSync(temporary), []);
  validateVersionedAudio(join(root, 'static/audio'), lectures, sections);
  const empty = join(temporary, 'empty');
  mkdirSync(empty);
  writeFileSync(join(empty, 'manifest.json'), JSON.stringify({version: 1, lessons: {}}));
  writeFileSync(join(empty, 'provenance.json'), JSON.stringify({version: 1, exporter: 'data-src/inferencia-estadistica/export-lecturas.mjs', lessons: {}}));
  validateVersionedAudio(empty, lectures, sections);
  writeFileSync(join(empty, 'orphan.mp3'), 'retired recording');
  assert.throws(() => validateVersionedAudio(empty, lectures, sections), /Published MP3 files must belong to the current playback manifest/);
});

test('audio preparation needs no external source to run and publishes no partial scenes', async context => {
  const temporary = mkdtempSync(join(tmpdir(), 'media-absent-'));
  context.after(() => rmSync(temporary, {recursive: true, force: true}));
  const destination = join(temporary, 'public');
  mkdirSync(destination);
  writeFileSync(join(destination, 'unrelated.mp3'), 'previous bytes');
  const result = await prepareAudio(join(temporary, 'missing-input'), destination);
  assert.deepEqual(result.manifest, {version: 1, lessons: {}});
  assert.equal(result.report.skipped.length, 36);
  assert.equal(readFileSync(join(destination, 'unrelated.mp3'), 'utf8'), 'previous bytes');
  assert.ok(!JSON.stringify(result).includes(temporary));
  assert.ok(!readdirSync(destination).some(name => name.startsWith('.canonical-')));
});

async function sectionAudioFixture(context) {
  const root = mkdtempSync(join(tmpdir(), 'section-publication-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const input = join(root, 'batch');
  const output = join(root, 'public');
  mkdirSync(output);
  const summary = await exportNarration(join(input, 'fuente'), {sections: true});
  const exported = JSON.parse(readFileSync(join(input, 'fuente/lecturas.json'), 'utf8'));
  const lessons = structuredClone(exported).map(lesson => ({...lesson, directory: lesson.id, unit: 'Test', status: 'prepared'}));
  for (const lesson of lessons) for (const scene of lesson.scenes) {
    scene.spoken_text = scene.caption;
    scene.cues.forEach(cue => { cue.spoken_text = cue.text; });
  }
  const lesson = lessons[0];
  const scene = lesson.scenes[0];
  const directory = join(input, lesson.directory);
  mkdirSync(join(directory, 'fragmentos/001'), {recursive: true});
  const hash = value => createHash('sha256').update(value).digest('hex');
  const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value)}\n`);
  const partSignatures = [];
  let frames = 0;
  const cues = scene.cues.map((cue, index) => {
    const start = frames / 44100;
    const cueFrames = 4410 * (1 + index % 3);
    frames += cueFrames;
    const end = frames / 44100;
    const audio = `001/${String(index + 1).padStart(3, '0')}.wav`;
    const bytes = Buffer.from(`CPU fixture for cue ${index}`);
    const signature = hash(`cue signature ${index}`);
    partSignatures.push(signature);
    writeFileSync(join(directory, 'fragmentos', audio), bytes);
    writeJson(join(directory, 'fragmentos', audio.replace('.wav', '.json')), {
      text: cue.spoken_text, signature, sha256: hash(bytes), sample_rate: 44100,
      frames: cueFrames, duration_seconds: cueFrames / 44100
    });
    if (index < scene.cues.length - 1) frames += 13230;
    return {text: cue.text, start, end, audio};
  });
  const bytes = Buffer.from('CPU fixture for assembled section audio');
  const duration = frames / 44100;
  const sceneSignature = hash(`section-cues-v1:${partSignatures.join('')}`);
  writeFileSync(join(directory, 'fragmentos/001.wav'), bytes);
  writeJson(join(directory, 'fragmentos/001.json'), {
    text: scene.spoken_text, signature: sceneSignature, sha256: hash(bytes), sample_rate: 44100,
    frames, duration_seconds: duration, cue_timing: 'measured', cues
  });
  writeFileSync(join(directory, 'audio.wav'), bytes);
  const aggregate = {
    id: lesson.id, title: lesson.title, source: lesson.source, parentLesson: lesson.parentLesson,
    parentTitle: lesson.parentTitle, sectionId: lesson.sectionId, sourceSections: lesson.sourceSections, optional: lesson.optional,
    signature: hash(sceneSignature), sha256: hash(bytes), sample_rate: 44100, frames, duration_seconds: duration,
    scene_count: 1, cue_timing: 'measured', scenes: [{
      title: scene.title, chapter: scene.chapter, text: scene.spoken_text, start: 0, end: duration,
      audio: 'fragmentos/001.wav', cues: cues.map(({text, start, end}) => ({text, start, end}))
    }]
  };
  writeJson(join(directory, 'audio.json'), aggregate);
  writeFileSync(join(directory, 'audio.vtt'), `WEBVTT\n\n1\n00:00:00.000 --> 00:00:${duration.toFixed(3).padStart(6, '0')}\n${scene.spoken_text}\n`);
  lesson.status = 'complete';
  lesson.audio = `${lesson.directory}/audio.wav`;
  const course = {mode: 'sections', normalizer_version: 1, parent_lesson_count: summary.parent_lesson_count,
    lesson_count: lessons.length, scene_count: summary.scenes, cue_count: summary.cues, lessons};
  writeJson(join(input, 'curso.json'), course);
  const lectures = await canonicalLectures(output);
  const global = lectures.find(lecture => lecture.id === 'proporciones');
  const globalScenes = estimateSceneCues(global.scenes.map((scene, index) => ({start: 6 * index / global.scenes.length, end: 6 * (index + 1) / global.scenes.length})), global);
  const globalEntry = {src: 'audio/proporciones.mp3', duration: 6, cueTiming: 'scene-measured-cues-estimated', scenes: validateTimeline(globalScenes, global, 6)};
  const globalBytes = Buffer.from('Existing global reading');
  const globalOrigin = {
    sourceSignature: 'a'.repeat(64), wavSha256: 'b'.repeat(64), canonicalSha256: hash(JSON.stringify(canonicalContent(global))),
    mp3Sha256: hash(globalBytes), mp3Bytes: globalBytes.length, sourceDuration: 6,
    timing: 'scene-measured-cues-estimated', encoding: {codec: 'mp3', channels: 1, bitrate: 48000}
  };
  writeFileSync(join(output, 'proporciones.mp3'), globalBytes);
  writeJson(join(output, 'manifest.json'), {version: 1, lessons: {proporciones: globalEntry}});
  writeJson(join(output, 'provenance.json'), {version: 1, exporter: 'data-src/inferencia-estadistica/export-lecturas.mjs', lessons: {proporciones: globalOrigin}});
  return {root, input, output, directory, lesson, aggregate, course, globalEntry, globalOrigin, lectures, sections: exported};
}

test('section publication merges measured section keys, retains global audio and never refreshes its input', async context => {
  const fixture = await sectionAudioFixture(context);
  const frozen = readFileSync(join(fixture.input, 'curso.json'));
  let encodes = 0;
  const encode = (source, target, duration) => {
    encodes++;
    writeFileSync(target, Buffer.concat([Buffer.from('Encoded fixture: '), readFileSync(source)]));
    return duration + 0.025;
  };
  const result = await prepareSections(fixture.input, fixture.output, {encode});
  assert.equal(encodes, 1);
  assert.deepEqual(result.report.published, [fixture.lesson.id]);
  assert.equal(result.report.skipped.length, 117);
  const published = result.manifest.lessons[fixture.lesson.id];
  assert.equal(published.src, `audio/${fixture.lesson.id}.mp3`);
  assert.equal(published.parentLesson, fixture.lesson.parentLesson);
  assert.equal(published.sectionId, fixture.lesson.sectionId);
  assert.equal(published.title, fixture.lesson.title);
  assert.equal(published.cueTiming, 'measured');
  assert.deepEqual(published.scenes, validateTimeline(fixture.aggregate.scenes, fixture.lesson, fixture.aggregate.duration_seconds));
  assert.deepEqual(result.manifest.lessons.proporciones, fixture.globalEntry);
  assert.deepEqual(result.provenance.lessons.proporciones, fixture.globalOrigin);
  assert.deepEqual(readFileSync(join(fixture.input, 'curso.json')), frozen);
  assert.equal(readFileSync(join(fixture.output, 'proporciones.mp3'), 'utf8'), 'Existing global reading');
  assert.ok(!JSON.stringify(result).includes(fixture.root));
  const audio = join(fixture.output, `${fixture.lesson.id}.mp3`);
  const previous = statSync(audio).mtimeMs;
  const retained = await prepareSections(join(fixture.root, 'missing-source'), fixture.output, {encode});
  assert.deepEqual(retained.report.retained, [fixture.lesson.id]);
  assert.deepEqual(retained.manifest.lessons.proporciones, fixture.globalEntry);
  assert.equal(encodes, 1);
  assert.equal(statSync(audio).mtimeMs, previous);
  assert.ok(!readdirSync(fixture.output).some(name => name.startsWith('.canonical-')));
});

test('global publication after sections and the no-input versioned gate preserve both audio modes', async context => {
  const fixture = await sectionAudioFixture(context);
  const globalInput = join(fixture.root, 'global-batch');
  mkdirSync(join(globalInput, 'fuente'), {recursive: true});
  writeFileSync(join(globalInput, 'curso.json'), JSON.stringify({lesson_count: 36, lessons: fixture.lectures}));
  writeFileSync(join(globalInput, 'fuente/lecturas.json'), JSON.stringify(fixture.lectures));
  writeFileSync(join(globalInput, 'progreso.json'), JSON.stringify({status: 'complete', completed_lessons: 1}));
  const snapshots = [join(fixture.input, 'curso.json'), join(fixture.input, 'fuente/lecturas.json'), join(globalInput, 'curso.json'), join(globalInput, 'fuente/lecturas.json')];
  const frozen = snapshots.map(path => readFileSync(path));
  let encodes = 0;
  const published = await prepareSections(fixture.input, fixture.output, {encode: (source, target, duration) => {
    encodes++;
    writeFileSync(target, Buffer.concat([Buffer.from('Encoded fixture: '), readFileSync(source)]));
    return duration + 0.025;
  }});
  const assets = ['proporciones.mp3', `${fixture.lesson.id}.mp3`].map(name => join(fixture.output, name));
  const bytes = assets.map(path => readFileSync(path));
  const mtimes = assets.map(path => statSync(path).mtimeMs);
  const globalResult = await prepareAudio(globalInput, fixture.output);
  assert.deepEqual(globalResult.report.retained.sort(), ['proporciones', fixture.lesson.id].sort());
  assert.deepEqual(globalResult.manifest, published.manifest);
  assert.deepEqual(JSON.parse(readFileSync(join(fixture.output, 'provenance.json'))), published.provenance);
  snapshots.forEach((path, index) => assert.deepEqual(readFileSync(path), frozen[index]));
  rmSync(globalInput, {recursive: true});
  const withoutInput = await prepareAudio(globalInput, fixture.output);
  assert.deepEqual(withoutInput.manifest, published.manifest);
  assert.deepEqual(withoutInput.report.retained.sort(), ['proporciones', fixture.lesson.id].sort());
  assert.deepEqual(JSON.parse(readFileSync(join(fixture.output, 'provenance.json'))), published.provenance);
  const publicFiles = ['manifest.json', 'provenance.json'].map(name => join(fixture.output, name));
  const publicBytes = publicFiles.map(path => readFileSync(path));
  validateVersionedAudio(fixture.output, fixture.lectures, fixture.sections);
  publicFiles.forEach((path, index) => assert.deepEqual(readFileSync(path), publicBytes[index]));
  assets.forEach((path, index) => {
    assert.deepEqual(readFileSync(path), bytes[index]);
    assert.equal(statSync(path).mtimeMs, mtimes[index]);
  });
  snapshots.slice(0, 2).forEach((path, index) => assert.deepEqual(readFileSync(path), frozen[index]));
  assert.equal(encodes, 1);
  assert.ok(!readdirSync(fixture.output).some(name => name.startsWith('.canonical-')));
});

test('global publication and versioned gate reject corrupt retained sections and unknown IDs', async context => {
  const fixture = await sectionAudioFixture(context);
  const published = await prepareSections(fixture.input, fixture.output, {encode: (source, target, duration) => {
    writeFileSync(target, Buffer.concat([Buffer.from('Encoded fixture: '), readFileSync(source)]));
    return duration + 0.025;
  }});
  const audio = join(fixture.output, `${fixture.lesson.id}.mp3`);
  const bytes = readFileSync(audio);
  const mutations = [
    ['filename', entry => { entry.src = 'audio/proporciones.mp3'; }],
    ['title', entry => { entry.title += ' changed'; }],
    ['parent lesson', entry => { entry.parentLesson = 'unknown'; }],
    ['parent title', entry => { entry.parentTitle += ' changed'; }],
    ['section ID', entry => { entry.sectionId = 'unknown'; }],
    ['source sections', entry => { entry.sourceSections = ['unknown']; }],
    ['optional metadata', entry => { entry.optional = !entry.optional; }],
    ['estimated cues', entry => { entry.cueTiming = 'scene-measured-cues-estimated'; }],
    ['estimated provenance', (entry, origin) => { origin.timing = 'scene-measured-cues-estimated'; }],
    ['source signature', (entry, origin) => { delete origin.sourceSignature; }],
    ['WAV checksum', (entry, origin) => { origin.wavSha256 = 'invalid'; }],
    ['canonical source', (entry, origin) => { origin.canonicalSha256 = '0'.repeat(64); }],
    ['MP3 checksum', (entry, origin) => { origin.mp3Sha256 = '0'.repeat(64); }],
    ['MP3 size', (entry, origin) => { origin.mp3Bytes += 0.5; }],
    ['encoding', (entry, origin) => { origin.encoding.channels = 2; }],
    ['source duration', (entry, origin) => { origin.sourceDuration = 0; }],
    ['short MP3', (entry, origin) => { entry.duration = origin.sourceDuration - 0.025; }],
    ['non-finite duration', entry => { entry.duration = null; }],
    ['incomplete scenes', entry => { entry.scenes = []; }],
    ['missing cues', entry => { delete entry.scenes[0].cues; }],
    ['cue text', entry => { entry.scenes[0].cues[0].text += ' changed'; }],
    ['cue boundary', entry => { entry.scenes[0].cues[0].start = -1; }],
    ['scene boundary', entry => { entry.scenes[0].end -= 0.01; }],
    ['missing manifest entry', (entry, origin, manifest) => { delete manifest.lessons[fixture.lesson.id]; }],
    ['missing provenance entry', (entry, origin, manifest, provenance) => { delete provenance.lessons[fixture.lesson.id]; }],
    ['null section entries', (entry, origin, manifest, provenance) => {
      manifest.lessons[fixture.lesson.id] = null;
      provenance.lessons[fixture.lesson.id] = null;
    }],
    ['manifest version', (entry, origin, manifest) => { manifest.version = 2; }],
    ['provenance version', (entry, origin, manifest, provenance) => { provenance.version = 2; }],
    ['section exporter', (entry, origin, manifest, provenance) => { provenance.sectionExporter = 'unknown'; }],
    ['corrupt bytes', () => { writeFileSync(audio, 'Corrupt published section'); }]
  ];
  for (const [name, mutate] of mutations) {
    const manifest = structuredClone(published.manifest);
    const provenance = structuredClone(published.provenance);
    writeFileSync(audio, bytes);
    mutate(manifest.lessons[fixture.lesson.id], provenance.lessons[fixture.lesson.id], manifest, provenance);
    writeFileSync(join(fixture.output, 'manifest.json'), JSON.stringify(manifest));
    writeFileSync(join(fixture.output, 'provenance.json'), JSON.stringify(provenance));
    assert.throws(() => validateVersionedAudio(fixture.output, fixture.lectures, fixture.sections), undefined, name);
    const result = await prepareAudio(join(fixture.root, 'absent'), fixture.output);
    assert.equal(result.manifest.lessons[fixture.lesson.id], undefined, name);
    assert.equal(JSON.parse(readFileSync(join(fixture.output, 'provenance.json'))).lessons[fixture.lesson.id], undefined, name);
    assert.ok(result.report.skipped.some(entry => entry.id === fixture.lesson.id), name);
    assert.ok(!existsSync(audio), name);
    assert.deepEqual(result.manifest.lessons.proporciones, fixture.globalEntry, name);
    validateVersionedAudio(fixture.output, fixture.lectures, fixture.sections);
  }
  for (const id of ['unknown-global', 'proporciones--unknown-section']) {
    const manifest = structuredClone(published.manifest);
    const provenance = structuredClone(published.provenance);
    manifest.lessons[id] = structuredClone(manifest.lessons[fixture.lesson.id]);
    provenance.lessons[id] = structuredClone(provenance.lessons[fixture.lesson.id]);
    writeFileSync(audio, bytes);
    writeFileSync(join(fixture.output, 'manifest.json'), JSON.stringify(manifest));
    writeFileSync(join(fixture.output, 'provenance.json'), JSON.stringify(provenance));
    assert.throws(() => validateVersionedAudio(fixture.output, fixture.lectures, fixture.sections), /Unknown audio ID/);
    const result = await prepareAudio(join(fixture.root, 'absent'), fixture.output);
    assert.equal(result.manifest.lessons[id], undefined);
    assert.equal(JSON.parse(readFileSync(join(fixture.output, 'provenance.json'))).lessons[id], undefined);
    assert.ok(result.manifest.lessons[fixture.lesson.id]);
    validateVersionedAudio(fixture.output, fixture.lectures, fixture.sections);
  }
});

test('section publication rejects corrupt cue fragments and never encodes incomplete audio', async context => {
  const fixture = await sectionAudioFixture(context);
  writeFileSync(join(fixture.directory, 'fragmentos/001/001.wav'), 'Corrupt cue');
  let encodes = 0;
  const result = await prepareSections(fixture.input, fixture.output, {encode: () => { encodes++; }});
  assert.equal(encodes, 0);
  assert.equal(result.report.published.length, 0);
  assert.match(result.report.skipped.find(entry => entry.id === fixture.lesson.id).reason, /Cue fragment checksum changed/);
  assert.equal(result.manifest.lessons[fixture.lesson.id], undefined);
  assert.deepEqual(result.manifest.lessons.proporciones, fixture.globalEntry);
});

test('section publication refuses global snapshots and inconsistent mode-specific counts before writing manifests', async context => {
  const fixture = await sectionAudioFixture(context);
  const previous = readFileSync(join(fixture.output, 'manifest.json'));
  delete fixture.course.mode;
  writeFileSync(join(fixture.input, 'curso.json'), JSON.stringify(fixture.course));
  await assert.rejects(prepareSections(fixture.input, fixture.output), /global batches cannot be published as sections/);
  fixture.course.mode = 'sections';
  fixture.course.lesson_count = 36;
  writeFileSync(join(fixture.input, 'curso.json'), JSON.stringify(fixture.course));
  await assert.rejects(prepareSections(fixture.input, fixture.output), /Section lesson count does not match/);
  assert.deepEqual(readFileSync(join(fixture.output, 'manifest.json')), previous);
});

test('section publication requires measured cues and refuses MP3s shorter than the measured scene', async context => {
  const fixture = await sectionAudioFixture(context);
  const metadata = join(fixture.directory, 'audio.json');
  const missing = structuredClone(fixture.aggregate);
  delete missing.scenes[0].cues;
  writeFileSync(metadata, JSON.stringify(missing));
  let encodes = 0;
  const encode = (source, target, duration) => {
    encodes++;
    writeFileSync(target, 'Rejected short MP3');
    return duration - 0.05;
  };
  const missingResult = await prepareSections(fixture.input, fixture.output, {encode});
  assert.equal(encodes, 0);
  assert.equal(missingResult.manifest.lessons[fixture.lesson.id], undefined);
  writeFileSync(metadata, JSON.stringify(fixture.aggregate));
  const shortResult = await prepareSections(fixture.input, fixture.output, {encode});
  assert.equal(encodes, 1);
  assert.equal(shortResult.manifest.lessons[fixture.lesson.id], undefined);
  assert.match(shortResult.report.skipped.find(entry => entry.id === fixture.lesson.id).reason, /Encoded audio ends before/);
  assert.ok(!existsSync(join(fixture.output, `${fixture.lesson.id}.mp3`)));
  assert.deepEqual(shortResult.manifest.lessons.proporciones, fixture.globalEntry);
});

test('CPU-only mono MP3 encoding is measured by ffprobe and cleans temporary files', context => {
  for (const name of ['ffmpeg', 'ffprobe']) {
    const available = [name, `${name}.exe`].some(command => {
      try { execFileSync(command, ['-version'], {stdio: 'ignore'}); return true; } catch { return false; }
    });
    if (!available) { context.skip(`${name} unavailable; offline encoding only`); return; }
  }
  const temporary = mkdtempSync(join(tmpdir(), 'media-encoding-'));
  context.after(() => rmSync(temporary, {recursive: true, force: true}));
  const sampleRate = 44100;
  const samples = sampleRate;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let frame = 0; frame < samples; frame++) wav.writeInt16LE(Math.round(1000 * Math.sin(2 * Math.PI * 440 * frame / sampleRate)), 44 + frame * 2);
  const source = join(temporary, 'input.wav');
  const target = join(temporary, 'output.mp3');
  writeFileSync(source, wav);
  const duration = encodeMp3(source, target, 1);
  const probe = probeAudio(target);
  assert.equal(probe.codec_name, 'mp3');
  assert.equal(probe.channels, 1);
  assert.equal(typeof probe.duration, 'number');
  assert.equal(probe.duration, duration);
  assert.ok(Math.abs(duration - 1) < 0.15);
  assert.ok(probe.size < 10000);
  assert.ok(existsSync(source));
  assert.deepEqual(readdirSync(temporary).sort(), ['input.wav', 'output.mp3']);
});