import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {canonicalContent, inside, publicProvenance, validateTimeline} from '../prepare-media.mjs';
import {buildCatalogue} from './gemini-course.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const IDENTITY = {model: 'Ming-3.0-tts-0.5B', voice: 'Ming-Spanish-temporary', provider: 'ming-local', temporary: true};
const PYTHON = '/home/aquiluer/Scripts/TTS/.venv/bin/python';
const hash = value => createHash('sha256').update(value).digest('hex');
const safeId = id => typeof id === 'string' && /^[a-z0-9]+(?:(?:-{1,2}|\.)[a-z0-9]+)*$/.test(id);
const close = (left, right) => Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 0.000001;
const identity = value => Object.entries(IDENTITY).forEach(([key, expected]) => assert.equal(value[key], expected, 'Invalid Ming identity'));

function safePath(path, directory = false) {
  assert.ok(isAbsolute(path), 'Absolute paths required');
  path = resolve(path);
  for (let current = path; ; current = dirname(current)) {
    let stat;
    try { stat = lstatSync(current); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) assert.ok(!stat.isSymbolicLink() && (current === path && !directory ? stat.isFile() : stat.isDirectory()), 'Unsafe filesystem path');
    if (dirname(current) === current) break;
  }
  return path;
}

function sourceFile(batch, name) {
  safePath(join(batch, name));
  return inside(batch, name);
}

function verifyComplete(batch, {python}) {
  assert.ok(isAbsolute(python), 'Python path must be absolute');
  try {
    return JSON.parse(execFileSync(python, [join(ROOT, 'scripts/tts/generate-ming-course.py'), '--batch', batch, '--export-complete'],
      {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']}));
  } catch {
    throw new Error('Read-only Ming export validation failed');
  }
}

function quietProbe(path) {
  try {
    const result = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries',
      'format=duration,size:stream=codec_name,codec_type,channels,sample_rate', '-of', 'json', path],
    {encoding: 'utf8', maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']}));
    assert.equal(result.streams.length, 1);
    assert.equal(result.streams[0].codec_type, 'audio');
    return {...result.streams[0], duration: Number(result.format.duration), size: Number(result.format.size)};
  } catch {
    throw new Error('MP3 probe validation failed');
  }
}

function atomicWrite(destination, name, bytes) {
  const target = safePath(join(destination, name));
  const staging = mkdtempSync(join(destination, '.ming-'));
  try {
    const temporary = join(staging, 'pending');
    writeFileSync(temporary, bytes, {flag: 'wx', mode: 0o644});
    safePath(target);
    renameSync(temporary, target);
  } finally {
    rmSync(staging, {recursive: true, force: true});
  }
}

export async function prepareMingCourse(batch, destination = join(ROOT, 'static/audio'),
  {verify = verifyComplete, currentCatalogue = buildCatalogue, python = PYTHON, probe = quietProbe} = {}) {
  batch = safePath(batch, true);
  destination = safePath(destination, true);
  for (const [base, target] of [[batch, destination], [destination, batch]]) {
    const path = relative(base, target);
    assert.ok(path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path), 'Batch and destination must be separate');
  }
  const catalogueBytes = readFileSync(sourceFile(batch, 'catalogue.json'));
  const selectionBytes = readFileSync(sourceFile(batch, 'selection.json'));
  const catalogue = JSON.parse(catalogueBytes);
  const selection = JSON.parse(selectionBytes);
  identity(selection);
  assert.equal(selection.version, 1);
  assert.equal(catalogue.version, 1);
  const catalogueSha256 = hash(catalogueBytes);
  assert.equal(selection.catalogueSha256, catalogueSha256, 'Frozen catalogue hash changed');
  assert.ok(Array.isArray(selection.targetIds) && Array.isArray(selection.excludeIds));
  const allIds = [...selection.targetIds, ...selection.excludeIds];
  assert.ok(allIds.every(safeId) && new Set(allIds).size === allIds.length, 'Unsafe or duplicate selection IDs');
  assert.deepEqual([...allIds].sort(), catalogue.items.map(item => item.id).sort(), 'Selection differs from catalogue');
  const files = new Map(['manifest.json', 'provenance.json', 'exercises-manifest.json', 'exercises-provenance.json'].map(name => {
    const path = safePath(join(destination, name));
    const bytes = existsSync(path) ? readFileSync(path) : null;
    const data = bytes ? JSON.parse(bytes) : {version: 1, lessons: {}};
    assert.equal(data.version, 1, 'Unknown public manifest version');
    assert.ok(data.lessons && typeof data.lessons === 'object' && !Array.isArray(data.lessons));
    return [name, {bytes, data, changed: false}];
  }));
  const live = await currentCatalogue();
  assert.deepEqual(Object.keys(live.sourceFiles).sort(), Object.keys(catalogue.sourceFiles).sort(), 'Live source files differ');
  assert.equal(hash(JSON.stringify(live.items)), hash(JSON.stringify(catalogue.items)), 'Live catalogue differs');
  const exported = await verify(batch, {python});
  identity(exported);
  assert.equal(exported.version, 1);
  assert.equal(exported.catalogueSha256, catalogueSha256, 'Export catalogue hash changed');
  assert.ok(Array.isArray(exported.items));
  assert.equal(new Set(exported.items.map(report => report.id)).size, exported.items.length, 'Duplicate reports');
  const items = new Map(catalogue.items.map(item => [item.id, item]));
  const pending = [];
  const retained = [];
  for (const report of exported.items) {
    assert.ok(safeId(report.id) && selection.targetIds.includes(report.id), 'Unsafe or unselected report ID');
    identity(report);
    assert.ok(!report.silent && !report.preview && !report.draft, 'Draft or silent audio cannot be published');
    assert.equal(report.catalogueSha256, catalogueSha256);
    const item = items.get(report.id);
    assert.ok(['section', 'recap', 'exercise'].includes(item.kind), 'Unknown item kind');
    const {animation, canonicalSha256, ...metadata} = item;
    const canonical = {...animation, scenes: animation.steps.map(step => ({...step, chapter: step.data?.chapter}))};
    assert.equal(item.id, animation.id);
    assert.equal(canonicalSha256, hash(JSON.stringify(canonicalContent(canonical))), 'Canonical content changed');
    assert.equal(report.canonicalSha256, canonicalSha256, 'Report canonical hash changed');
    for (const [key, value] of Object.entries(metadata)) assert.deepEqual(report[key], value, 'Report metadata differs');
    assert.equal(report.cueTiming, 'measured', 'Measured timing required');
    assert.equal(report.sampleRate, 44100);
    assert.equal(report.silenceMs, 300);
    assert.ok(Number.isSafeInteger(report.frames) && report.frames > 0);
    assert.ok(close(report.duration, report.sourceDuration) && close(report.frames / 44100, report.sourceDuration), 'PCM duration differs');
    assert.ok(Number.isFinite(report.mp3Duration) && report.mp3Duration >= report.sourceDuration && report.mp3Duration - report.sourceDuration < 0.15, 'Encoded duration differs');
    const scenes = validateTimeline(report.scenes, canonical, report.sourceDuration);
    let previousEnd;
    for (const scene of scenes) {
      assert.equal(scene.start, scene.cues[0].start, 'Scene start differs');
      assert.equal(scene.end, scene.cues.at(-1).end, 'Scene end differs');
      for (const cue of scene.cues) {
        assert.ok(close(cue.start * 44100, Math.round(cue.start * 44100)) && close(cue.end * 44100, Math.round(cue.end * 44100)), 'Non-PCM cue boundary');
        assert.ok(previousEnd === undefined ? cue.start === 0 : close(cue.start - previousEnd, 0.3), 'Measured pause differs');
        previousEnd = cue.end;
      }
    }
    const origin = {...publicProvenance({...report, timing: 'measured'}), ...IDENTITY, catalogueSha256};
    const entry = {...metadata, ...IDENTITY, canonicalSha256, mp3Sha256: report.mp3Sha256,
      src: `audio/${item.id}.mp3`, duration: report.mp3Duration, sourceDuration: report.sourceDuration, cueTiming: 'measured', scenes};
    const source = sourceFile(batch, `items/${item.id}/audio.mp3`);
    const bytes = readFileSync(source);
    assert.equal(bytes.length, origin.mp3Bytes, 'MP3 size differs');
    assert.equal(hash(bytes), origin.mp3Sha256, 'MP3 checksum differs');
    const audio = probe(source);
    assert.ok(audio.codec_name === 'mp3' && audio.channels === 1 && Number(audio.sample_rate) === 44100, 'Invalid MP3 format');
    assert.ok(audio.size === bytes.length && close(audio.duration, report.mp3Duration), 'MP3 measurement differs');
    const exercise = item.kind === 'exercise';
    const manifest = files.get(exercise ? 'exercises-manifest.json' : 'manifest.json');
    const provenance = files.get(exercise ? 'exercises-provenance.json' : 'provenance.json');
    const old = manifest.data.lessons[item.id];
    const oldOrigin = provenance.data.lessons[item.id];
    const target = safePath(join(destination, `${item.id}.mp3`));
    if (old?.provider === IDENTITY.provider || oldOrigin?.provider === IDENTITY.provider) {
      assert.ok(old && oldOrigin, 'Incomplete existing Ming publication');
      identity(old);
      identity(oldOrigin);
      assert.deepEqual(old, entry, 'Existing Ming invariant changed');
      assert.deepEqual(oldOrigin, origin, 'Existing Ming provenance changed');
      const previous = readFileSync(inside(destination, `${item.id}.mp3`));
      assert.ok(previous.length === origin.mp3Bytes && hash(previous) === origin.mp3Sha256, 'Existing Ming MP3 changed');
      retained.push(item.id);
    } else if (old || oldOrigin || existsSync(target) || [...files.values()].some(file => file.data.lessons[item.id])) {
      retained.push(item.id);
    } else {
      manifest.data.lessons[item.id] = entry;
      provenance.data.lessons[item.id] = origin;
      provenance.data.mingExporter = 'scripts/tts/prepare-ming-course.mjs';
      if (item.kind === 'section') provenance.data.sectionExporter = 'scripts/tts/export-narration.mjs';
      if (!exercise) provenance.data.exporter ??= 'data-src/inferencia-estadistica/export-lecturas.mjs';
      manifest.changed = provenance.changed = true;
      pending.push({id: item.id, source, origin});
    }
  }
  assert.ok(catalogueBytes.equals(readFileSync(sourceFile(batch, 'catalogue.json'))) && selectionBytes.equals(readFileSync(sourceFile(batch, 'selection.json'))), 'Frozen inputs changed concurrently');
  const unchanged = () => {
    for (const [name, {bytes}] of files) {
      const path = safePath(join(destination, name));
      assert.ok(bytes ? existsSync(path) && bytes.equals(readFileSync(path)) : !existsSync(path), 'Public manifest changed concurrently');
    }
  };
  unchanged();
  if (pending.length) {
    safePath(destination, true);
    mkdirSync(destination, {recursive: true});
    for (const {id, source, origin} of pending) {
      const bytes = readFileSync(sourceFile(batch, relative(batch, source).split(sep).join('/')));
      assert.ok(bytes.length === origin.mp3Bytes && hash(bytes) === origin.mp3Sha256, 'MP3 changed before copying');
      assert.ok(!existsSync(safePath(join(destination, `${id}.mp3`))), 'Audio appeared concurrently');
      atomicWrite(destination, `${id}.mp3`, bytes);
    }
    unchanged();
    for (const [name, {data, changed}] of files) if (changed) atomicWrite(destination, name, Buffer.from(`${JSON.stringify(data, null, 2)}\n`));
  }
  return {published: pending.map(item => item.id), retained, skippedIncomplete: selection.targetIds.length - exported.items.length};
}

export async function main(args = process.argv.slice(2), options = {}) {
  const usage = 'Usage: prepare-ming-course.mjs --batch /absolute/batch [--out /absolute/audio] [--python /absolute/python]';
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    assert.ok(['--batch', '--out', '--python'].includes(args[index]) && !flags.has(args[index]) && args[index + 1] && isAbsolute(args[index + 1]), usage);
    flags.set(args[index], args[index + 1]);
  }
  assert.ok(flags.has('--batch'), usage);
  return prepareMingCourse(flags.get('--batch'), flags.get('--out'), {...options, python: flags.get('--python') ?? PYTHON});
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { console.log(JSON.stringify(await main())); }
  catch { console.error('Ming publication refused: check CLI arguments, verified reports, canon and destination.'); process.exitCode = 1; }
}