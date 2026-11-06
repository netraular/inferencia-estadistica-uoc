import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {canonicalContent, encodeMp3, inside, publicProvenance, safeName, sceneSubtitles, validateLesson, validateTimeline} from '../prepare-media.mjs';
import {exportNarration} from './export-narration.mjs';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const json = (root, name) => JSON.parse(readFileSync(inside(root, name), 'utf8'));
const signature = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const sectionId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const close = (left, right) => Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 0.000001;
const metadata = lesson => Object.fromEntries(['title', 'parentLesson', 'parentTitle', 'sectionId', 'sourceSections', 'optional'].map(key => [key, lesson[key]]));

function outputFile(directory, name) {
  const path = join(directory, safeName(name));
  if (existsSync(path)) assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'Unsafe output file');
  return path;
}

function writeJson(directory, name, value) {
  const target = outputFile(directory, name);
  const temporary = outputFile(directory, `.${name}.${process.pid}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, {force: true});
  }
}

export async function canonicalSections(destination) {
  const temporary = mkdtempSync(join(destination, '.canonical-sections-'));
  try {
    await exportNarration(temporary, {sections: true});
    return json(temporary, 'lecturas.json');
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
}

function validateSnapshot(course, frozen, canonical) {
  assert.equal(course.mode, 'sections', 'Use a separate --sections batch; global batches cannot be published as sections');
  const ids = canonical.map(lesson => lesson.id).sort();
  assert.deepEqual(course.lessons.map(lesson => lesson.id).sort(), ids, 'Section snapshot count or IDs do not match');
  assert.deepEqual(frozen.map(lesson => lesson.id).sort(), ids, 'Frozen section export count or IDs do not match');
  assert.equal(course.lesson_count, canonical.length, 'Section lesson count does not match');
  assert.equal(course.scene_count, frozen.reduce((count, lesson) => count + lesson.scenes.length, 0), 'Section scene count does not match');
  assert.equal(course.cue_count, frozen.reduce((count, lesson) => count + lesson.scenes.reduce((total, scene) => total + scene.cues.length, 0), 0), 'Section cue count does not match');
  assert.equal(course.scene_count, canonical.reduce((count, lesson) => count + lesson.scenes.length, 0), 'Current section scene count does not match');
  assert.equal(course.cue_count, canonical.reduce((count, lesson) => count + lesson.scenes.reduce((total, scene) => total + scene.cues.length, 0), 0), 'Current section cue count does not match');
  assert.equal(course.parent_lesson_count, new Set(canonical.map(lesson => lesson.parentLesson)).size, 'Parent lesson count does not match');
}

export function validateSectionSource(audioRoot, snapshot, report) {
  const prefix = snapshot.directory;
  const wav = inside(audioRoot, `${prefix}/audio.wav`);
  assert.equal(hash(readFileSync(wav)), report.sha256, 'Section WAV checksum changed');
  const sceneSignatures = report.scenes.map((scene, index) => {
    const partName = `${prefix}/${scene.audio}`;
    const part = json(audioRoot, partName.replace(/\.wav$/, '.json'));
    assert.equal(hash(readFileSync(inside(audioRoot, partName))), part.sha256, 'Scene fragment checksum changed');
    assert.ok(signature(part.signature), 'Invalid scene signature');
    assert.equal(part.text, snapshot.scenes[index].spoken_text, 'Scene speech differs from the snapshot');
    assert.equal(part.sample_rate, report.sample_rate, 'Scene sample rate differs');
    assert.ok(Number.isInteger(part.frames) && part.frames > 0 && close(part.frames / part.sample_rate, scene.end - scene.start), 'Scene frames differ from the measured timeline');
    assert.equal(part.cue_timing, 'measured', 'Scene cues must be measured');
    assert.equal(part.cues.length, snapshot.scenes[index].cues.length, 'Cue fragments are incomplete');
    const cueSignatures = part.cues.map((cue, cueIndex) => {
      const expected = snapshot.scenes[index].cues[cueIndex];
      assert.equal(cue.text, expected.text, 'Cue text differs');
      assert.deepEqual(scene.cues[cueIndex], {text: cue.text, start: scene.start + cue.start, end: scene.start + cue.end}, 'Scene cues differ from measured fragments');
      const cueName = `${dirname(partName)}/${cue.audio}`;
      const fragment = json(audioRoot, cueName.replace(/\.wav$/, '.json'));
      assert.equal(hash(readFileSync(inside(audioRoot, cueName))), fragment.sha256, 'Cue fragment checksum changed');
      assert.ok(signature(fragment.signature), 'Invalid cue signature');
      assert.equal(fragment.text, expected.spoken_text, 'Cue speech differs from the snapshot');
      assert.equal(expected.spoken_text, expected.text, 'Section cue speech must stay natural');
      assert.equal(fragment.sample_rate, report.sample_rate, 'Cue sample rate differs');
      assert.ok(Number.isInteger(fragment.frames) && fragment.frames > 0 && close(fragment.frames / fragment.sample_rate, cue.end - cue.start), 'Cue frames differ from measured boundaries');
      return fragment.signature;
    });
    assert.equal(hash(`section-cues-v1:${cueSignatures.join('')}`), part.signature, 'Scene cue signature differs');
    return part.signature;
  });
  assert.equal(hash(sceneSignatures.join('')), report.signature, 'Section aggregate signature differs');
  const subtitles = sceneSubtitles(readFileSync(inside(audioRoot, `${prefix}/audio.vtt`), 'utf8'));
  assert.equal(subtitles.length, report.scenes.length, 'Scene VTT is incomplete');
  subtitles.forEach((cue, index) => {
    const scene = report.scenes[index];
    assert.equal(cue.text, scene.text, 'Scene VTT speech differs');
    assert.ok(Math.abs(cue.start - scene.start) <= 0.000501 && Math.abs(cue.end - scene.end) <= 0.000501, 'Scene VTT boundaries differ');
  });
  return wav;
}

export function retainedSection(destination, canonical, entry, origin, contentHash = hash(JSON.stringify(canonicalContent(canonical)))) {
  assert.ok(sectionId(canonical.id) && canonical.id === `${canonical.parentLesson}--${canonical.sectionId}`, 'Invalid canonical section ID');
  assert.ok(entry && origin, 'Section manifest or provenance is missing');
  assert.equal(entry.src, `audio/${canonical.id}.mp3`);
  assert.deepEqual(metadata(entry), metadata(canonical));
  assert.equal(entry.cueTiming, 'measured');
  assert.equal(origin.timing, 'measured');
  origin = publicProvenance(origin);
  assert.equal(origin.canonicalSha256, contentHash);
  const bytes = readFileSync(inside(destination, `${canonical.id}.mp3`));
  assert.ok(bytes.length > 0 && bytes.length < 100_000_000);
  assert.equal(bytes.length, origin.mp3Bytes);
  assert.equal(hash(bytes), origin.mp3Sha256);
  assert.ok(Number.isFinite(entry.duration) && Math.abs(entry.duration - origin.sourceDuration) < 0.15);
  assert.ok(entry.duration >= origin.sourceDuration, 'Encoded audio ends before the measured timeline');
  const scenes = validateTimeline(entry.scenes, canonical, origin.sourceDuration);
  return {entry: {...metadata(canonical), src: entry.src, duration: entry.duration, cueTiming: 'measured', scenes}, origin};
}

export async function prepareSections(audioRoot, destination = join(projectRoot, 'static/audio'), {encode = encodeMp3} = {}) {
  destination = resolve(destination);
  mkdirSync(destination, {recursive: true});
  assert.equal(realpathSync(destination), destination, 'Output directory cannot contain symlinks');
  const canonical = await canonicalSections(destination);
  const previous = existsSync(join(destination, 'manifest.json')) ? json(destination, 'manifest.json') : {version: 1, lessons: {}};
  const previousProvenance = existsSync(join(destination, 'provenance.json')) ? json(destination, 'provenance.json') : {version: 1, lessons: {}};
  assert.equal(previous.version, 1, 'Unknown public manifest version');
  assert.equal(previousProvenance.version, 1, 'Unknown provenance version');
  const manifest = {...previous, lessons: {...previous.lessons}};
  const provenance = {...previousProvenance, sectionExporter: 'scripts/tts/export-narration.mjs', lessons: {...previousProvenance.lessons}};
  const report = {version: 1, mode: 'sections', published: [], retained: [], skipped: []};
  let course;
  let frozen;
  if (existsSync(join(audioRoot, 'curso.json'))) {
    course = json(audioRoot, 'curso.json');
    frozen = json(audioRoot, 'fuente/lecturas.json');
    validateSnapshot(course, frozen, canonical);
  }
  for (const lecture of canonical) {
    assert.ok(sectionId(lecture.id), 'Unsafe section animation ID');
    const contentHash = hash(JSON.stringify(canonicalContent(lecture)));
    const old = previous.lessons[lecture.id];
    const oldOrigin = previousProvenance.lessons[lecture.id];
    if (old && oldOrigin) {
      try {
        const {entry, origin} = retainedSection(destination, lecture, old, oldOrigin, contentHash);
        manifest.lessons[lecture.id] = entry;
        provenance.lessons[lecture.id] = origin;
        report.retained.push(lecture.id);
        continue;
      } catch {}
    }
    delete manifest.lessons[lecture.id];
    delete provenance.lessons[lecture.id];
    try {
      const snapshot = course?.lessons.find(lesson => lesson.id === lecture.id);
      const exported = frozen?.find(lesson => lesson.id === lecture.id);
      assert.ok(snapshot && exported, 'Section snapshot is absent');
      assert.equal(snapshot.status, 'complete', 'Section audio is not complete');
      assert.equal(snapshot.audio, `${snapshot.directory}/audio.wav`, 'Section audio path differs');
      assert.deepEqual(metadata(snapshot), metadata(lecture), 'Section metadata differs from the current source');
      assert.deepEqual(metadata(exported), metadata(lecture), 'Frozen section metadata differs');
      const aggregate = json(audioRoot, `${snapshot.directory}/audio.json`);
      assert.deepEqual(metadata(aggregate), metadata(lecture), 'Audio section metadata differs');
      const scenes = validateLesson(aggregate, snapshot, exported, lecture);
      const source = validateSectionSource(audioRoot, snapshot, aggregate);
      const target = outputFile(destination, `${lecture.id}.mp3`);
      const duration = encode(source, target, aggregate.duration_seconds);
      assert.ok(Number.isFinite(duration) && duration > 0 && Math.abs(duration - aggregate.duration_seconds) < 0.15, 'Encoded duration differs');
      assert.ok(duration >= aggregate.duration_seconds, 'Encoded audio ends before the measured timeline');
      assert.equal(hash(readFileSync(source)), aggregate.sha256, 'Section source changed during encoding');
      const bytes = readFileSync(target);
      assert.ok(bytes.length > 0 && bytes.length < 100_000_000, 'Encoded MP3 is empty or too large');
      manifest.lessons[lecture.id] = {...metadata(lecture), src: `audio/${lecture.id}.mp3`, duration, cueTiming: 'measured', scenes};
      provenance.lessons[lecture.id] = {
        sourceSignature: aggregate.signature, wavSha256: aggregate.sha256, canonicalSha256: contentHash,
        mp3Sha256: hash(bytes), mp3Bytes: statSync(target).size, sourceDuration: aggregate.duration_seconds,
        timing: 'measured', encoding: {codec: 'mp3', channels: 1, bitrate: 48000}
      };
      report.published.push(lecture.id);
    } catch (error) {
      const reason = error.code === 'ERR_ASSERTION' ? error.message.split('\n')[0] : 'Section audio files are unavailable or encoding failed';
      rmSync(outputFile(destination, `${lecture.id}.mp3`), {force: true});
      report.skipped.push({id: lecture.id, reason});
    }
  }
  writeJson(destination, 'manifest.json', manifest);
  writeJson(destination, 'provenance.json', provenance);
  writeJson(destination, 'prepare-sections-report.json', report);
  return {manifest, provenance, report};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2);
    let audioRoot;
    let destination;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (!['--audio-root', '--out'].includes(arg) || !args[index + 1] || args[index + 1].startsWith('--')) {
        throw new TypeError('Usage: node scripts/tts/prepare-sections.mjs --audio-root section-batch [--out public-audio-directory]');
      }
      const value = args[++index];
      if (arg === '--audio-root') audioRoot = resolve(value);
      else destination = resolve(value);
    }
    assert.ok(audioRoot, '--audio-root is required');
    const {report} = await prepareSections(audioRoot, destination);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}