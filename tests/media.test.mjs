import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {canonicalContent, canonicalLectures, documentMetadata, encodeMp3, estimateSceneCues, inside, prepareAudio, prepareDocuments, probeAudio, safeName, sceneSubtitles, validateLesson, validateTimeline} from '../scripts/prepare-media.mjs';

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

test('versioned audio references only canonical complete timelines, valid provenance and public paths', async context => {
  const temporary = mkdtempSync(join(tmpdir(), 'media-canonical-'));
  context.after(() => rmSync(temporary, {recursive: true, force: true}));
  const lectures = await canonicalLectures(temporary);
  assert.equal(lectures.length, 36);
  assert.deepEqual(readdirSync(temporary), []);
  const directory = join(root, 'static/audio');
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json')));
  const provenance = JSON.parse(readFileSync(join(directory, 'provenance.json')));
  assert.equal(manifest.version, 1);
  assert.deepEqual(
    readdirSync(directory).filter(name => name.toLowerCase().endsWith('.mp3')).sort(),
    Object.keys(manifest.lessons).map(id => `${id}.mp3`).sort(),
    'Published MP3 files must belong to the current playback manifest'
  );
  for (const [id, lesson] of Object.entries(manifest.lessons)) {
    const current = lectures.find(item => item.id === id);
    assert.ok(current);
    assert.equal(lesson.src, `audio/${id}.mp3`);
    const origin = provenance.lessons[id];
    assert.ok(['measured', 'scene-measured-cues-estimated'].includes(origin.timing));
    assert.equal(lesson.cueTiming, origin.timing);
    assert.equal(origin.canonicalSha256, createHash('sha256').update(JSON.stringify(canonicalContent(current))).digest('hex'));
    const bytes = readFileSync(inside(directory, `${id}.mp3`));
    assert.equal(origin.mp3Bytes, bytes.length);
    assert.equal(origin.mp3Sha256, createHash('sha256').update(bytes).digest('hex'));
    validateTimeline(lesson.scenes, current, origin.sourceDuration);
    assert.ok(Math.abs(lesson.duration - origin.sourceDuration) < 0.15);
  }
  for (const name of ['manifest.json', 'provenance.json', 'prepare-report.json']) {
    const text = readFileSync(join(directory, name), 'utf8');
    assert.ok(!/(?:\/home\/|\/mnt\/|file:\/\/|[A-Za-z]:\\|spoken_text|reference_text|prompt_wav|model_path)/.test(text), `${name} leaks private inputs`);
  }
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