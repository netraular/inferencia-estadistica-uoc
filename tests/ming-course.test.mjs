import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {canonicalContent, probeAudio} from '../scripts/prepare-media.mjs';
import {retainedSection} from '../scripts/tts/prepare-sections.mjs';
import {main, prepareMingCourse} from '../scripts/tts/prepare-ming-course.mjs';

const IDENTITY = {model: 'Ming-3.0-tts-0.5B', voice: 'Ming-Spanish-temporary', provider: 'ming-local', temporary: true};
const hash = value => createHash('sha256').update(value).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, JSON.stringify(value));

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), 'ming-publisher-synthetic-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const batch = join(root, 'batch');
  const out = join(root, 'public');
  mkdirSync(batch);
  const tone = join(root, 'synthetic.mp3');
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-threads', '1', '-filter_threads', '1', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=1.5', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', tone], {stdio: ['ignore', 'pipe', 'pipe']});
  const bytes = readFileSync(tone);
  const duration = probeAudio(tone).duration;
  const catalogue = {version: 1, sourceFiles: {'synthetic.js': hash('synthetic')}, items: ['section', 'recap', 'exercise', 'section'].map((kind, index) => {
    const id = ['lesson--section', 'lesson', 'exercise--question', 'lesson--pending'][index];
    const animation = {id, title: 'Synthetic only', source: {document: 'synthetic.pdf'}, steps: [
      {title: 'First', caption: 'Uno.', kind: 'story', cues: [{text: 'Uno.'}, {text: 'Dos.'}]},
      {title: 'Second', caption: 'Tres.', kind: 'story', cues: [{text: 'Tres.'}]}
    ]};
    return {id, title: animation.title, kind, source: animation.source, parentLesson: 'lesson', parentTitle: 'Synthetic parent',
      ...(kind === 'section' ? {sectionId: index ? 'pending' : 'section', sourceSections: ['synthetic'], optional: false} : {}),
      canonicalSha256: hash(JSON.stringify(canonicalContent({...animation, scenes: animation.steps}))), animation};
  })};
  save(join(batch, 'catalogue.json'), catalogue);
  const catalogueSha256 = hash(readFileSync(join(batch, 'catalogue.json')));
  const selection = {version: 1, ...IDENTITY, catalogueSha256, targetIds: catalogue.items.map(item => item.id), excludeIds: []};
  save(join(batch, 'selection.json'), selection);
  const exported = {version: 1, ...IDENTITY, catalogueSha256, items: catalogue.items.slice(0, 3).map(item => {
    const {animation, ...metadata} = item;
    const directory = join(batch, 'items', item.id);
    mkdirSync(directory, {recursive: true});
    writeFileSync(join(directory, 'audio.mp3'), bytes);
    return {...metadata, ...IDENTITY, catalogueSha256, sourceSignature: hash('synthetic-cues'), wavSha256: hash('synthetic-wav'),
      mp3Sha256: hash(bytes), mp3Bytes: bytes.length, duration: 1.5, sourceDuration: 1.5, mp3Duration: duration, frames: 66150,
      sampleRate: 44100, silenceMs: 300, cueTiming: 'measured', listened: false,
      scenes: [{start: 0, end: 0.9, cues: [{text: 'Uno.', start: 0, end: 0.3}, {text: 'Dos.', start: 0.6, end: 0.9}]},
        {start: 1.2, end: 1.5, cues: [{text: 'Tres.', start: 1.2, end: 1.5}]}],
      encoding: {codec: 'mp3', channels: 1, bitrate: 48000}, privatePath: '/private/host/model', reference: '/private/host/reference.wav'};
  })};
  const options = {currentCatalogue: async () => structuredClone(catalogue), verify: async () => structuredClone(exported)};
  return {root, batch, out, catalogue, selection, exported, options, publish: () => prepareMingCourse(batch, out, options)};
}

test('publishes synthetic section, recap and exercise with exact measured cues, public provenance and idempotence', async context => {
  const data = fixture(context);
  const before = readFileSync(join(data.batch, 'selection.json'));
  assert.deepEqual(await data.publish(), {published: data.exported.items.map(item => item.id), retained: [], skippedIncomplete: 1});
  for (const report of data.exported.items) {
    const prefix = report.kind === 'exercise' ? 'exercises-' : '';
    const manifest = json(join(data.out, `${prefix}manifest.json`));
    const provenance = json(join(data.out, `${prefix}provenance.json`));
    const entry = manifest.lessons[report.id];
    assert.deepEqual(entry.scenes, report.scenes);
    assert.equal(entry.duration, report.mp3Duration);
    assert.equal(entry.sourceDuration, 1.5);
    assert.equal(entry.cueTiming, 'measured');
    for (const [key, value] of Object.entries(IDENTITY)) assert.equal(entry[key], value);
    assert.equal(entry.animation, undefined);
    assert.equal(provenance.lessons[report.id].timing, 'measured');
    assert.equal(provenance.lessons[report.id].catalogueSha256, data.exported.catalogueSha256);
    assert.equal(provenance.mingExporter, 'scripts/tts/prepare-ming-course.mjs');
    if (!prefix) {
      assert.equal(provenance.exporter, 'data-src/inferencia-estadistica/export-lecturas.mjs');
      assert.equal(provenance.sectionExporter, 'scripts/tts/export-narration.mjs');
    }
    assert.equal(hash(readFileSync(join(data.out, `${report.id}.mp3`))), report.mp3Sha256);
    assert.ok(!JSON.stringify({manifest, provenance}).includes('/private/'));
    if (report.kind === 'section') {
      const item = data.catalogue.items.find(item => item.id === report.id);
      const canonical = {...item, scenes: item.animation.steps};
      assert.deepEqual(retainedSection(data.out, canonical, entry, provenance.lessons[report.id]).entry.scenes, report.scenes);
    }
  }
  const snapshot = readdirSync(data.out).map(name => [name, readFileSync(join(data.out, name))]);
  assert.deepEqual(await data.publish(), {published: [], retained: data.exported.items.map(item => item.id), skippedIncomplete: 1});
  for (const [name, bytes] of snapshot) assert.deepEqual(readFileSync(join(data.out, name)), bytes);
  assert.deepEqual(readFileSync(join(data.batch, 'selection.json')), before);
  assert.equal(existsSync(join(data.batch, '.lock')), false);
});

test('preserves Puck seats and MP3 bytes, including when a Ming report has the same ID', async context => {
  const data = fixture(context);
  mkdirSync(data.out);
  const puck = {title: 'Existing Puck', model: 'gemini-3.8-flash-tts', voice: 'Puck', src: 'audio/lesson--section.mp3', untouched: true};
  const provenance = {provider: 'gemini', model: puck.model, voice: 'Puck', arbitraryExistingField: true};
  const puckBytes = Buffer.from('synthetic-existing-puck-bytes');
  writeFileSync(join(data.out, 'lesson--section.mp3'), puckBytes);
  save(join(data.out, 'manifest.json'), {version: 1, preserved: true, lessons: {'lesson--section': puck, 'other-puck': puck}});
  save(join(data.out, 'provenance.json'), {version: 1, exporter: 'original-exporter', geminiExporter: 'original-gemini', lessons: {'lesson--section': provenance}});
  const result = await data.publish();
  assert.deepEqual(result, {published: ['lesson', 'exercise--question'], retained: ['lesson--section'], skippedIncomplete: 1});
  assert.deepEqual(readFileSync(join(data.out, 'lesson--section.mp3')), puckBytes);
  const manifest = json(join(data.out, 'manifest.json'));
  const origins = json(join(data.out, 'provenance.json'));
  assert.deepEqual(manifest.lessons['lesson--section'], puck);
  assert.deepEqual(manifest.lessons['other-puck'], puck);
  assert.equal(manifest.preserved, true);
  assert.deepEqual(origins.lessons['lesson--section'], provenance);
  assert.equal(origins.exporter, 'original-exporter');
  assert.equal(origins.geminiExporter, 'original-gemini');
});

const invalidReports = {
  model: report => { report.model = 'gemini-3.8-flash-tts'; },
  voice: report => { report.voice = 'Puck'; },
  provider: report => { report.provider = 'gemini'; },
  temporary: report => { report.temporary = false; },
  canonical: report => { report.canonicalSha256 = hash('changed'); },
  catalogue: report => { report.catalogueSha256 = hash('changed'); },
  text: report => { report.scenes[0].cues[0].text = 'Changed narration.'; },
  timing: report => { report.scenes[0].cues[1].start = 0.61; },
  overlap: report => { report.scenes[1].start = 0.8; },
  end: report => { report.scenes[1].end = 1.4; },
  estimated: report => { report.cueTiming = 'estimated'; },
  silent: report => { report.silent = true; },
  preview: report => { report.preview = true; },
  draft: report => { report.draft = true; },
  frames: report => { report.frames++; },
  sampleRate: report => { report.sampleRate = 24000; },
  silence: report => { report.silenceMs = 0; },
  truncated: report => { report.mp3Duration = 1.4; },
  probeDuration: report => { report.mp3Duration += 0.01; },
  hash: report => { report.mp3Sha256 = hash('corrupt'); },
  size: report => { report.mp3Bytes++; },
  signature: report => { report.sourceSignature = 'invalid'; },
  encoding: report => { report.encoding.channels = 2; },
  metadata: report => { report.parentLesson = 'different'; },
  unsafeId: report => { report.id = '../escape'; }
};

for (const [name, invalidate] of Object.entries(invalidReports)) {
  test(`rejects ${name} in the last report before any destination write`, async context => {
    const data = fixture(context);
    invalidate(data.exported.items.at(-1));
    await assert.rejects(data.publish());
    assert.equal(existsSync(data.out), false);
    assert.equal(existsSync(join(data.batch, '.lock')), false);
  });
}

test('rejects corrupt MP3 even when its size and checksum match the report', async context => {
  const data = fixture(context);
  const report = data.exported.items.at(-1);
  const broken = Buffer.from('synthetic non-audio data');
  writeFileSync(join(data.batch, 'items', report.id, 'audio.mp3'), broken);
  report.mp3Bytes = broken.length;
  report.mp3Sha256 = hash(broken);
  await assert.rejects(data.publish());
  assert.equal(existsSync(data.out), false);
});

test('validates selection, export identity, canonical inputs and duplicate reports before writing', async context => {
  const data = fixture(context);
  const original = structuredClone(data.exported);
  for (const field of Object.keys(IDENTITY)) {
    data.exported[field] = field === 'temporary' ? false : 'wrong';
    await assert.rejects(data.publish());
    data.exported[field] = original[field];
  }
  data.exported.catalogueSha256 = hash('wrong');
  await assert.rejects(data.publish());
  data.exported.catalogueSha256 = original.catalogueSha256;
  data.exported.items.push(data.exported.items[0]);
  await assert.rejects(data.publish());
  data.exported.items.pop();
  for (const change of [
    selection => { selection.catalogueSha256 = hash('wrong'); },
    selection => { selection.targetIds[0] = '../escape'; },
    selection => { selection.excludeIds.push(selection.targetIds[0]); },
    selection => { selection.voice = 'Puck'; }
  ]) {
    const selection = structuredClone(data.selection);
    change(selection);
    save(join(data.batch, 'selection.json'), selection);
    await assert.rejects(data.publish());
  }
  save(join(data.batch, 'selection.json'), data.selection);
  data.options.currentCatalogue = async () => ({...data.catalogue, sourceFiles: {changed: hash('wrong')}});
  await assert.rejects(data.publish(), /Live source hashes/);
  data.options.currentCatalogue = async () => ({...data.catalogue, items: []});
  await assert.rejects(data.publish(), /Live catalogue/);
  assert.equal(existsSync(data.out), false);
});

test('retains existing unowned audio and makes no writes for an empty complete export', async context => {
  const data = fixture(context);
  const completed = data.exported.items;
  data.exported.items = [];
  assert.deepEqual(await data.publish(), {published: [], retained: [], skippedIncomplete: 4});
  assert.equal(existsSync(data.out), false);
  mkdirSync(data.out);
  const report = data.catalogue.items[0];
  writeFileSync(join(data.out, `${report.id}.mp3`), 'unowned');
  data.exported.items = completed.slice(0, 1);
  assert.deepEqual(await data.publish(), {published: [], retained: [report.id], skippedIncomplete: 3});
  assert.deepEqual(readdirSync(data.out), [`${report.id}.mp3`]);
  assert.equal(readFileSync(join(data.out, `${report.id}.mp3`), 'utf8'), 'unowned');
});

test('refuses changed existing Ming invariants without changing destination bytes', async context => {
  const data = fixture(context);
  await data.publish();
  const manifestPath = join(data.out, 'manifest.json');
  const manifest = json(manifestPath);
  manifest.lessons.lesson.scenes[0].cues[0].text = 'Changed existing narration.';
  save(manifestPath, manifest);
  const before = readdirSync(data.out).map(name => [name, readFileSync(join(data.out, name))]);
  await assert.rejects(data.publish(), /Existing Ming invariant/);
  for (const [name, bytes] of before) assert.deepEqual(readFileSync(join(data.out, name)), bytes);
});

test('rejects concurrent manifest edits, including creation of an initially absent manifest', async context => {
  const data = fixture(context);
  mkdirSync(data.out);
  const concurrent = Buffer.from('{"version":1,"lessons":{},"concurrent":true}');
  data.options.verify = async () => {
    writeFileSync(join(data.out, 'manifest.json'), concurrent);
    return structuredClone(data.exported);
  };
  await assert.rejects(data.publish(), /changed concurrently/);
  assert.deepEqual(readdirSync(data.out), ['manifest.json']);
  assert.deepEqual(readFileSync(join(data.out, 'manifest.json')), concurrent);
  data.options.verify = async () => {
    writeFileSync(join(data.out, 'manifest.json'), `${concurrent}\n`);
    return structuredClone(data.exported);
  };
  await assert.rejects(data.publish(), /changed concurrently/);
  assert.deepEqual(readdirSync(data.out), ['manifest.json']);
});

test('rejects symlink destinations, manifests, audio and batch inputs without following them', async context => {
  const data = fixture(context);
  const outside = join(data.root, 'outside');
  mkdirSync(outside);
  symlinkSync(outside, data.out);
  await assert.rejects(data.publish(), /Unsafe filesystem/);
  rmSync(data.out);
  mkdirSync(data.out);
  symlinkSync(join(outside, 'missing'), join(data.out, 'manifest.json'));
  await assert.rejects(data.publish(), /Unsafe filesystem/);
  rmSync(join(data.out, 'manifest.json'));
  symlinkSync(join(outside, 'missing'), join(data.out, 'exercise--question.mp3'));
  await assert.rejects(data.publish(), /Unsafe filesystem/);
  rmSync(join(data.out, 'exercise--question.mp3'));
  const audio = join(data.batch, 'items', 'exercise--question', 'audio.mp3');
  writeFileSync(join(outside, 'audio.mp3'), readFileSync(audio));
  rmSync(audio);
  symlinkSync(join(outside, 'audio.mp3'), audio);
  await assert.rejects(data.publish(), /Unsafe filesystem/);
  assert.deepEqual(readdirSync(data.out), []);
  assert.deepEqual(readdirSync(outside), ['audio.mp3']);
});

test('CLI validates absolute, unique options and invokes only the read-only export contract', async context => {
  const data = fixture(context);
  for (const args of [[], ['--batch', 'relative'], ['--batch', data.batch, '--batch', data.batch], ['--batch', data.batch, '--verify'], ['--batch', data.batch, '--python', 'python']]) {
    await assert.rejects(main(args, data.options), /Usage:/);
  }
  const interpreter = join(data.root, 'synthetic-interpreter');
  const reports = join(data.root, 'synthetic-reports.json');
  save(reports, {...data.exported, privatePadding: '/private/'.repeat(150000)});
  writeFileSync(interpreter, `#!${process.execPath}\nimport assert from 'node:assert/strict';\nimport {readFileSync} from 'node:fs';\nassert.deepEqual(process.argv.slice(2), [${JSON.stringify(join(import.meta.dirname, '../scripts/tts/generate-ming-course.py'))}, '--batch', ${JSON.stringify(data.batch)}, '--export-complete']);\nprocess.stdout.write(readFileSync(${JSON.stringify(reports)}));\n`, {mode: 0o700});
  const result = await main(['--batch', data.batch, '--out', data.out, '--python', interpreter], {currentCatalogue: data.options.currentCatalogue});
  assert.deepEqual(result, {published: data.exported.items.map(report => report.id), retained: [], skippedIncomplete: 1});
  assert.ok(JSON.stringify(result).length < 300);
});