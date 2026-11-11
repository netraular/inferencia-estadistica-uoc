import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {closeSync, existsSync, fchmodSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseEnv} from 'node:util';
import {canonicalContent, publicProvenance, validateTimeline} from '../prepare-media.mjs';

export const MODEL = 'gemini-3.8-flash-tts';
export const VOICE = 'Puck';
export const STYLE = 'A calm, engaging statistics teacher speaking clear Spanish from Spain. Natural phrasing, a measured classroom pace, and brief pauses between sentences.';
export const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const PROJECT_KEYS = Object.freeze(Array.from({length: 6}, (_, index) => `GEMINI_API_KEY_${index + 1}`));
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const RATE = 24000;
const MIN_INTERVAL_MS = 15000;
const MAX_INTERVAL_MS = 2147483647;
const hash = value => createHash('sha256').update(value).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const safeId = id => typeof id === 'string' && /^[a-z0-9]+(?:(?:-{1,2}|\.)[a-z0-9]+)*$/.test(id);

function directory(path, mode = 0o700) {
  mkdirSync(path, {recursive: true, mode});
  assert.equal(realpathSync(path), resolve(path), 'Symlink directories are not allowed');
}

function safeFile(path) {
  assert.equal(realpathSync(dirname(path)), dirname(resolve(path)), 'Symlink file directory');
  if (existsSync(path)) assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'Unsafe file');
  return path;
}

function save(path, value, options) {
  saveBytes(path, Buffer.from(`${JSON.stringify(value, null, 2)}\n`), options);
}

function locked(batch, operation) {
  directory(batch);
  const lock = join(batch, '.lock');
  writeFileSync(lock, `${process.pid}\n`, {flag: 'wx', mode: 0o600});
  return Promise.resolve().then(operation).finally(() => rmSync(lock));
}

function externalBatch(batch, source = ROOT) {
  batch = resolve(batch);
  for (const root of [ROOT, source]) {
    const path = relative(resolve(root), batch);
    assert.ok(path.startsWith('../') || isAbsolute(path), 'Keep batches outside the source checkout');
  }
  let parent = batch;
  while (!existsSync(parent)) parent = dirname(parent);
  let inGit = false;
  try {
    inGit = execFileSync('git', ['-C', parent, 'rev-parse', '--is-inside-work-tree'],
      {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim() === 'true';
  } catch (error) {
    assert.ok(error.status === 128, 'Unable to verify that the batch is outside Git');
  }
  assert.equal(inGit, false, 'Keep batches outside Git repositories');
  return batch;
}

export function canonicalAnimation(animation) {
  return canonicalContent({
    ...animation,
    scenes: animation.steps.map(step => ({...step, chapter: step.data?.chapter}))
  });
}

function itemFor(kind, animation, metadata = {}) {
  assert.ok(safeId(animation.id), 'Unsafe animation ID');
  assert.ok(animation.steps?.length, 'Animation has no scenes');
  for (const step of animation.steps) {
    assert.ok(step.cues?.length && step.cues.every(cue => typeof cue.text === 'string' && cue.text.trim()), 'Animation has no spoken cues');
  }
  const frozen = JSON.parse(JSON.stringify(animation));
  return {...metadata, id: frozen.id, kind, title: frozen.title, source: frozen.source,
    canonicalSha256: hash(JSON.stringify(canonicalAnimation(frozen))), animation: frozen};
}

function sourceFiles(source) {
  const files = [];
  const visit = folder => {
    for (const entry of readdirSync(join(source, folder), {withFileTypes: true})) {
      const path = `${folder}/${entry.name}`;
      if (entry.isDirectory()) visit(path);
      else if (entry.name.endsWith('.js')) files.push(path);
    }
  };
  visit('pages/inferencia');
  files.push('package-lock.json', 'scripts/tts/export-narration.mjs', 'data-src/inferencia-estadistica/export-lecturas.mjs');
  return Object.fromEntries(files.sort().map(path => [path, hash(readFileSync(join(source, path)))]));
}

export async function buildCatalogue({source = ROOT, sourceRevision = process.env.COURSE_SOURCE_REVISION} = {}) {
  source = resolve(source);
  if (sourceRevision !== undefined) assert.match(sourceRevision, /^[0-9a-f]{40}$/, 'Expected a full Git source revision');
  const inputs = sourceFiles(source);
  const require = createRequire(join(source, 'package.json'));
  const {jStat} = require('jstat');
  assert.equal(typeof jStat.normal.cdf, 'function', 'Root jstat dependency unavailable');
  const previous = globalThis.jStat;
  globalThis.jStat = jStat;
  try {
    const load = path => import(pathToFileURL(join(source, path)).href);
    const [{COURSE}, {createLessonSections}, {createLessonAnimation}, {generateExercise}, {exerciseCatalogue, exerciseAnimation}] = await Promise.all([
      load('pages/inferencia/course.js'), load('pages/inferencia/lesson-sections.js'),
      load('pages/inferencia/animations.js'), load('pages/inferencia/exercises.js'), load('pages/inferencia/exercise-solutions.js')
    ]);
    const {parseHTML} = require('linkedom');
    const paragraphs = html => Array.from(parseHTML(`<div>${html}</div>`).document.querySelectorAll('p'), node => node.textContent);
    const items = [];
    for (const unit of COURSE.units) for (const lesson of unit.lessons) {
      for (const section of createLessonSections(lesson)) {
        const {id, title, sourceSections, optional} = section;
        items.push(itemFor('section', section.animation, {
          parentLesson: lesson.id, parentTitle: lesson.title, sectionId: id, title, sourceSections, optional
        }));
      }
      items.push(itemFor('recap', createLessonAnimation(lesson, generateExercise, paragraphs), {parentLesson: lesson.id}));
    }
    const exercises = exerciseCatalogue();
    for (const exercise of exercises) for (const question of exercise.questions) {
      const animation = exerciseAnimation(exercise, question);
      items.push(itemFor('exercise', animation, {
        parentLesson: animation.parentLesson, parentTitle: animation.parentTitle, sectionId: animation.sectionId,
        sourceSections: animation.sourceSections, optional: animation.optional,
        exerciseId: exercise.id, questionId: question.id, lessonIds: exercise.lessonIds
      }));
    }
    assert.equal(new Set(items.map(item => item.id)).size, items.length, 'Duplicate animation IDs');
    assert.deepEqual(sourceFiles(source), inputs, 'Source changed during preparation; use a new process');
    const revision = sourceRevision ?? execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
    return {version: 1, model: MODEL, voice: VOICE, style: STYLE, sourceRevision: revision,
      sourceFiles: inputs, inputSha256: hash(JSON.stringify(inputs)), exerciseCount: exercises.length, items};
  } finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
}

export function catalogueSummary(catalogue) {
  const counts = {section: 0, recap: 0, exercise: 0};
  const cueCounts = {section: 0, recap: 0, exercise: 0};
  let cues = 0;
  let words = 0;
  for (const item of catalogue.items) {
    counts[item.kind]++;
    for (const step of item.animation.steps) for (const cue of step.cues) {
      cues++;
      cueCounts[item.kind]++;
      words += cue.text.trim().split(/\s+/u).length;
    }
  }
  return {items: catalogue.items.length, counts, exercises: catalogue.exerciseCount, cues, cueCounts, words,
    estimatedMinutes: Math.round(words / 140 + Math.max(0, cues - catalogue.items.length) * 0.3 / 60),
    estimatedWordsPerMinute: 140, estimateOnly: true, measuredMinutes: null};
}

export function loadBatch(batch) {
  batch = externalBatch(batch);
  assert.equal(realpathSync(batch), batch, 'Symlink batch');
  const bytes = readFileSync(safeFile(join(batch, 'catalogue.json')));
  const state = json(safeFile(join(batch, 'progress.json')));
  assert.equal(hash(bytes), state.catalogueSha256, 'Immutable catalogue changed');
  const catalogue = JSON.parse(bytes);
  assert.equal(catalogue.version, 1);
  assert.equal(catalogue.model, MODEL);
  assert.equal(catalogue.voice, VOICE);
  assert.equal(catalogue.style, STYLE);
  assert.equal(catalogue.inputSha256, hash(JSON.stringify(catalogue.sourceFiles)), 'Input hashes changed');
  assert.equal(state.version, 1);
  assert.ok(Number.isSafeInteger(state.requests) && state.requests >= 0, 'Invalid request ledger');
  assert.equal(new Set(catalogue.items.map(item => item.id)).size, catalogue.items.length);
  for (const item of catalogue.items) {
    assert.ok(safeId(item.id) && item.id === item.animation.id);
    assert.ok(['section', 'recap', 'exercise'].includes(item.kind), 'Unknown item kind');
    assert.equal(item.title, item.animation.title);
    assert.deepEqual(item.source, item.animation.source);
    assert.equal(item.canonicalSha256, hash(JSON.stringify(canonicalAnimation(item.animation))), 'Canonical content changed');
  }
  const attempts = Object.entries(state.items).reduce((total, [id, itemState]) => {
    const item = catalogue.items.find(item => item.id === id);
    assert.ok(item, 'Unknown item in request ledger');
    const count = spokenCues(item).length;
    for (const [index, record] of Object.entries(itemState.cues)) {
      assert.ok(/^(0|[1-9][0-9]*)$/.test(index) && Number(index) < count, 'Unknown cue in request ledger');
      const history = record.attemptHistory === undefined ? [] : record.attemptHistory;
      assert.ok(Array.isArray(history), 'Invalid attempt history');
      assert.ok(Number.isSafeInteger(record.attempts) && record.attempts > 0, 'Invalid attempt count');
      assert.equal(record.attempts, history.length + 1, 'Attempt history count changed');
      for (const [attemptIndex, previous] of history.entries()) {
        assert.ok(quotaRejected(previous), 'Only known HTTP 429 rejections may be resumed');
        assert.equal(previous.attempts, attemptIndex + 1, 'Attempt history order changed');
        assert.equal(previous.signature, record.signature, 'Attempt history signature changed');
        assert.equal(previous.attemptHistory, undefined, 'Nested attempt history is forbidden');
      }
      for (const attempt of [...history, record]) {
        if (attempt.keyVariable !== undefined) assert.ok(PROJECT_KEYS.includes(attempt.keyVariable), 'Unknown recorded project');
      }
      assert.ok(['started', 'received', 'complete', 'network-error', 'quota-limit', 'api-error', 'response-error'].includes(record.status), 'Unknown cue status');
      if (record.status === 'quota-limit') assert.ok(quotaRejected(record), 'Quota rejection must record HTTP 429');
    }
    return total + Object.values(itemState.cues).reduce((sum, record) => sum + record.attempts, 0);
  }, 0);
  assert.equal(state.requests, attempts, 'Request ledger count changed');
  return {batch, catalogue, state};
}

export async function prepareBatch(output, options = {}) {
  const batch = externalBatch(output, options.source);
  return locked(batch, async () => {
    if (existsSync(join(batch, 'catalogue.json'))) return catalogueSummary(loadBatch(batch).catalogue);
    assert.ok(!existsSync(join(batch, 'progress.json')), 'Incomplete preparation; use a new directory');
    const catalogue = await buildCatalogue(options);
    save(join(batch, 'catalogue.json'), catalogue);
    save(join(batch, 'progress.json'), {version: 1, catalogueSha256: hash(readFileSync(join(batch, 'catalogue.json'))),
      status: 'pending', requests: 0, items: {}});
    return catalogueSummary(catalogue);
  });
}

export function speechRequest(text) {
  return {model: MODEL, input: [{type: 'user_input', content: [{type: 'text', text,
    annotations: [{type: 'speech_metadata', style: STYLE}]}]}],
  response_format: {type: 'audio', mime_type: 'audio/wav', sample_rate: RATE},
  generation_config: {speech_config: [{voice: VOICE}]}, store: false};
}

function selectedKey(keyVariable = 'GEMINI_API_KEY_1') {
  assert.match(keyVariable, /^GEMINI_API_KEY_[1-6]$/, 'Unknown project credential variable');
  try {
    const key = parseEnv(readFileSync(join(homedir(), '.config/inferencia-tts/gemini.env'), 'utf8'))[keyVariable];
    if (typeof key === 'string' && key.trim()) return key.trim();
  } catch {}
  throw new Error(`Selected ${keyVariable} is unavailable; no request sent`);
}

export function validateWav(bytes) {
  assert.ok(bytes.length >= 44 && bytes.length < 100_000_000, 'Invalid WAV length');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', 'Expected complete RIFF WAV');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'Incomplete WAV');
  let pcm;
  let format = false;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const name = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    assert.ok(start + size <= bytes.length, 'Truncated WAV chunk');
    if (name === 'fmt ') {
      assert.ok(!format && size >= 16, 'Invalid WAV format');
      assert.equal(bytes.readUInt16LE(start), 1, 'Expected PCM WAV');
      assert.equal(bytes.readUInt16LE(start + 2), 1, 'Expected mono WAV');
      assert.equal(bytes.readUInt32LE(start + 4), RATE, 'Expected 24 kHz WAV');
      assert.equal(bytes.readUInt32LE(start + 8), RATE * 2);
      assert.equal(bytes.readUInt16LE(start + 12), 2);
      assert.equal(bytes.readUInt16LE(start + 14), 16, 'Expected PCM16 WAV');
      format = true;
    }
    if (name === 'data') {
      assert.ok(!pcm, 'Multiple WAV data chunks');
      pcm = bytes.subarray(start, start + size);
    }
    offset = start + size + size % 2;
  }
  assert.equal(offset, bytes.length, 'Incomplete WAV padding');
  assert.ok(format && pcm?.length > 0 && pcm.length % 2 === 0, 'Missing WAV samples');
  assert.ok(pcm.some(value => value !== 0), 'Silent WAV');
  return {pcm, frames: pcm.length / 2, sampleRate: RATE, duration: pcm.length / 2 / RATE};
}

function wavBytes(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function saveBytes(path, bytes, {mode = 0o600} = {}) {
  safeFile(path);
  const temporary = `${path}.${process.pid}.tmp`;
  const descriptor = openSync(temporary, 'wx', mode);
  try {
    try {
      writeFileSync(descriptor, bytes);
      fchmodSync(descriptor, mode);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    renameSync(temporary, path);
    const parent = openSync(dirname(path), 'r');
    try { fsyncSync(parent); } finally { closeSync(parent); }
  } finally {
    rmSync(temporary, {force: true});
  }
}

export function probeAudio(path, run = execFileSync) {
  const result = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries',
    'stream=codec_name,channels,sample_rate:format=duration', '-of', 'json', path],
  {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1024 * 1024}));
  assert.equal(result.streams?.length, 1, 'Expected one audio stream');
  const stream = result.streams[0];
  assert.equal(stream.channels, 1);
  assert.equal(Number(stream.sample_rate), RATE);
  const duration = Number(result.format.duration);
  assert.ok(Number.isFinite(duration) && duration > 0, 'Invalid ffprobe duration');
  return {duration, codec: stream.codec_name};
}

function spokenCues(item) {
  let index = 0;
  return item.animation.steps.flatMap((step, sceneIndex) => step.cues.map((cue, cueIndex) => ({
    text: cue.text, sceneIndex, cueIndex, index: index++
  })));
}

function cuePath(batch, item, cue) {
  return join(batch, 'items', item.id, 'cues', `${String(cue.index).padStart(6, '0')}.wav`);
}

function cueSignature(catalogueSha256, item, cue) {
  return hash(JSON.stringify({version: 1, catalogueSha256, id: item.id, ...cue}));
}

function fragment(batch, item, cue, record, catalogueSha256, run) {
  assert.equal(record.signature, cueSignature(catalogueSha256, item, cue), 'Fragment input signature changed');
  const bytes = readFileSync(safeFile(cuePath(batch, item, cue)));
  const wav = validateWav(bytes);
  const sha256 = hash(bytes);
  if (record.wavSha256) assert.equal(sha256, record.wavSha256, 'Fragment WAV checksum changed');
  if (record.status === 'complete') {
    assert.equal(record.wavSha256, sha256, 'Missing completed fragment checksum');
    assert.equal(record.measuredBy, 'ffprobe', 'Fragment was not measured');
    assert.equal(record.frames, wav.frames, 'Fragment frame count changed');
    assert.equal(record.duration, wav.duration, 'Fragment duration changed');
  } else {
    const measured = probeAudio(cuePath(batch, item, cue), run);
    assert.equal(measured.codec, 'pcm_s16le');
    assert.ok(Math.abs(measured.duration - wav.duration) <= 1 / RATE, 'ffprobe disagrees with WAV frames');
    Object.assign(record, {status: 'complete', wavSha256: sha256, frames: wav.frames,
      duration: wav.duration, sampleRate: RATE, measuredBy: 'ffprobe'});
  }
  return wav;
}

function usageNumbers(usage) {
  return Object.fromEntries(['total_tokens', 'total_input_tokens', 'total_output_tokens', 'input_tokens', 'output_tokens', 'totalTokens', 'inputTokens', 'outputTokens']
    .filter(key => Number.isSafeInteger(usage?.[key]) && usage[key] >= 0).map(key => [key, usage[key]]));
}

function quotaRejected(record) {
  return record?.status === 'quota-limit' && record.httpStatus === 429;
}

async function providerRateLimit(response, key) {
  const evidence = {};
  const seconds = value => {
    if (typeof value !== 'string' || !/^\d{1,8}(?:\.\d{1,9})?$/.test(value)) return undefined;
    const number = Number(value);
    return Number.isFinite(number) && number <= 31536000 ? number : undefined;
  };
  const identifier = value => typeof value === 'string' && value.length <= 256 &&
    /^[A-Za-z0-9][A-Za-z0-9._/{}-]*$/.test(value) && !value.includes(key) &&
    !/AIza[A-Za-z0-9_-]{20,}/.test(value) ? value : undefined;
  try {
    const retryAfterSeconds = seconds(response.headers?.get('retry-after'));
    if (retryAfterSeconds !== undefined) evidence.retryAfterSeconds = retryAfterSeconds;
  } catch {}
  try {
    const body = await response.json();
    if (Array.isArray(body?.error?.details)) for (const detail of body.error.details.slice(0, 32)) {
      if (['type.googleapis.com/google.rpc.RetryInfo', 'google.rpc.RetryInfo'].includes(detail?.['@type'])) {
        const retryDelaySeconds = typeof detail.retryDelay === 'string' && detail.retryDelay.endsWith('s')
          ? seconds(detail.retryDelay.slice(0, -1)) : undefined;
        if (retryDelaySeconds !== undefined) {
          evidence.retryDelaySeconds = Math.max(evidence.retryDelaySeconds ?? 0, retryDelaySeconds);
        }
      } else if (['type.googleapis.com/google.rpc.QuotaFailure', 'google.rpc.QuotaFailure'].includes(detail?.['@type']) &&
        Array.isArray(detail.violations)) {
        for (const violation of detail.violations.slice(0, 32)) {
          if ((evidence.violations?.length ?? 0) >= 32) break;
          const quota = {};
          for (const field of ['quotaMetric', 'quotaId']) {
            const value = identifier(violation?.[field]);
            if (value !== undefined) quota[field] = value;
          }
          const dimensions = {};
          for (const field of ['model', 'location', 'quota_limit', 'unit']) {
            const value = identifier(violation?.quotaDimensions?.[field]);
            if (value !== undefined) dimensions[field] = value;
          }
          if (Object.keys(dimensions).length) quota.quotaDimensions = dimensions;
          const period = /(?:^|[/_])requests(?:_per_model)?_per_(minute|day)$/i.exec(quota.quotaMetric ?? '');
          if (period) quota.requestLimit = period[1].toLowerCase() === 'day' ? 'RPD' : 'RPM';
          if (Object.keys(quota).length) (evidence.violations ??= []).push(quota);
        }
      }
    }
  } catch {}
  return Object.keys(evidence).length ? evidence : undefined;
}

function sourceSignature(state, item) {
  return hash(JSON.stringify({version: 1, provider: 'gemini', catalogueSha256: state.catalogueSha256,
    model: MODEL, voice: VOICE, style: STYLE, id: item.id, silenceFrames: 7200,
    fragments: spokenCues(item).map(cue => {
      const record = state.items[item.id].cues[cue.index];
      return {signature: record.signature, wavSha256: record.wavSha256, frames: record.frames};
    })}));
}

function measuredScenes(item, state) {
  let frames = 0;
  return item.animation.steps.map((step, sceneIndex) => {
    const scene = {start: frames / RATE, end: 0, cues: []};
    for (const cue of spokenCues(item).filter(cue => cue.sceneIndex === sceneIndex)) {
      if (cue.index > 0) frames += 7200;
      const start = frames / RATE;
      frames += state.items[item.id].cues[cue.index].frames;
      scene.cues.push({text: cue.text, start, end: frames / RATE});
    }
    scene.end = frames / RATE;
    return scene;
  });
}

export function assembleItem(batch, item, state, {run = execFileSync} = {}) {
  const parts = [];
  const scenes = item.animation.steps.map(() => ({start: 0, end: 0, cues: []}));
  let frames = 0;
  for (const cue of spokenCues(item)) {
    const record = state.items[item.id].cues[cue.index];
    assert.equal(record.status, 'complete', 'Incomplete cue');
    const wav = fragment(batch, item, cue, record, state.catalogueSha256, run);
    const scene = scenes[cue.sceneIndex];
    if (cue.cueIndex === 0) scene.start = frames / RATE;
    if (cue.index > 0) {
      parts.push(Buffer.alloc(7200 * 2));
      frames += 7200;
    }
    const start = frames / RATE;
    parts.push(wav.pcm);
    frames += wav.frames;
    scene.cues.push({text: cue.text, start, end: frames / RATE});
    scene.end = frames / RATE;
    assert.ok(frames * 2 < 100_000_000, 'Item exceeds the audio size limit');
  }
  const duration = frames / RATE;
  validateTimeline(scenes, {scenes: item.animation.steps}, duration);
  const target = join(batch, 'items', item.id);
  const wav = wavBytes(Buffer.concat(parts));
  saveBytes(join(target, 'audio.wav'), wav);
  const measured = probeAudio(join(target, 'audio.wav'), run);
  assert.equal(measured.codec, 'pcm_s16le');
  assert.ok(Math.abs(measured.duration - duration) <= 1 / RATE, 'Assembled WAV duration differs');
  const temporary = join(target, `audio.${process.pid}.tmp.mp3`);
  try {
    run('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-n', '-threads', '1', '-filter_threads', '1',
      '-i', join(target, 'audio.wav'), '-map', '0:a:0', '-map_metadata', '-1', '-vn', '-ac', '1',
      '-ar', String(RATE), '-c:a', 'libmp3lame', '-b:a', '48k', '-threads', '1', temporary],
    {stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1024 * 1024});
    const encoded = probeAudio(temporary, run);
    assert.equal(encoded.codec, 'mp3');
    assert.ok(encoded.duration >= duration && encoded.duration - duration < 0.15, 'MP3 truncates or shifts the measured timeline');
    const mp3 = readFileSync(safeFile(temporary));
    assert.ok(mp3.length > 0 && mp3.length < 100_000_000);
    safeFile(join(target, 'audio.mp3'));
    renameSync(temporary, join(target, 'audio.mp3'));
    const {animation, ...metadata} = item;
    const report = {...metadata, model: MODEL, voice: VOICE, duration, mp3Duration: encoded.duration,
      cueTiming: 'measured', scenes, frames, sampleRate: RATE, silenceMs: 300,
      catalogueSha256: state.catalogueSha256, sourceSignature: sourceSignature(state, item),
      wavSha256: hash(wav), mp3Sha256: hash(mp3), mp3Bytes: mp3.length,
      encoding: {codec: 'mp3', channels: 1, bitrate: 48000}, listened: false};
    save(join(target, 'audio.json'), report);
    return report;
  } finally {
    rmSync(temporary, {force: true});
  }
}

export async function generateBatch(output, {maxRequests, ids, resumeQuota = false, freeTierConfirmed = false,
  keyVariable = 'GEMINI_API_KEY_1',
  minIntervalMs = MIN_INTERVAL_MS, now = Date.now, scheduler = delay,
  fetchImpl = globalThis.fetch, readKey = selectedKey, run = execFileSync} = {}) {
  assert.ok(Number.isSafeInteger(maxRequests) && maxRequests > 0, '--max-requests must be a positive integer');
  assert.equal(freeTierConfirmed, true, '--free-tier-confirmed is required; API quotas and billing are not verified');
  assert.equal(typeof resumeQuota, 'boolean', '--resume-quota must be an explicit boolean');
  assert.match(keyVariable, /^GEMINI_API_KEY_[1-6]$/, 'Unknown project credential variable');
  assert.ok(Number.isSafeInteger(minIntervalMs) && minIntervalMs >= MIN_INTERVAL_MS && minIntervalMs <= MAX_INTERVAL_MS,
    '--min-interval-ms must be an integer from 15000 to 2147483647');
  assert.ok(typeof now === 'function' && typeof scheduler === 'function', 'Clock and scheduler must be functions');
  const batch = externalBatch(output);
  return locked(batch, async () => {
    const {catalogue, state} = loadBatch(batch);
    if (ids !== undefined) {
      assert.ok(Array.isArray(ids) && ids.length > 0 && ids.every(safeId), '--ids must contain known unique IDs');
      assert.equal(new Set(ids).size, ids.length, '--ids must contain known unique IDs');
      assert.ok(ids.every(id => catalogue.items.some(item => item.id === id)), '--ids must contain known unique IDs');
    }
    const selected = ids === undefined ? catalogue.items : catalogue.items.filter(item => ids.includes(item.id));
    const persist = () => save(join(batch, 'progress.json'), state);
    for (const item of catalogue.items) for (const cue of spokenCues(item)) {
      const record = state.items[item.id]?.cues?.[cue.index];
      if (quotaRejected(record)) {
        assert.equal(record.signature, cueSignature(state.catalogueSha256, item, cue), 'Quota fragment input signature changed');
        assert.ok(!existsSync(cuePath(batch, item, cue)), 'Quota rejection has an unexpected WAV; manual reconciliation required');
        if (resumeQuota && selected.includes(item)) continue;
      }
      if (record && record.status !== 'complete' && !existsSync(cuePath(batch, item, cue))) {
        state.status = record.status;
        persist();
        throw new Error('An attempted request is unresolved; automatic retries are forbidden. Only a selected known HTTP 429 rejection permits --resume-quota; all other failures require manual reconciliation.');
      }
    }
    run('ffmpeg', ['-version'], {stdio: 'ignore'});
    run('ffprobe', ['-version'], {stdio: 'ignore'});
    let sent = 0;
    let key;
    let lastRequestStartedAt = 0;
    for (const itemState of Object.values(state.items)) for (const record of Object.values(itemState.cues)) {
      for (const attempt of [...(record.attemptHistory ?? []), record]) {
        if ((attempt.keyVariable ?? 'GEMINI_API_KEY_1') !== keyVariable) continue;
        if (attempt.startedAt !== undefined) {
          const startedAt = Date.parse(attempt.startedAt);
          assert.ok(Number.isFinite(startedAt), 'Invalid request start timestamp');
          lastRequestStartedAt = Math.max(lastRequestStartedAt, startedAt);
        }
      }
    }
    let nextRequestAt = 0;
    state.projectPacing ??= {};
    if (state.pacing !== undefined && !state.projectPacing[state.keyVariable ?? 'GEMINI_API_KEY_1']) {
      state.projectPacing[state.keyVariable ?? 'GEMINI_API_KEY_1'] = {...state.pacing};
    }
    state.keyVariable = keyVariable;
    const projectPacing = state.projectPacing[keyVariable];
    if (projectPacing !== undefined) {
      nextRequestAt = Date.parse(projectPacing.nextRequestAt);
      assert.ok(Number.isFinite(nextRequestAt), 'Invalid planned request timestamp');
    }
    for (const item of selected) {
      const itemState = state.items[item.id] ??= {status: 'pending', cues: {}};
      directory(join(batch, 'items', item.id, 'cues'));
      for (const cue of spokenCues(item)) {
        let record = itemState.cues[cue.index];
        const path = cuePath(batch, item, cue);
        if (record && !(resumeQuota && quotaRejected(record))) {
          const wasComplete = record.status === 'complete';
          fragment(batch, item, cue, record, state.catalogueSha256, run);
          if (!wasComplete) persist();
          continue;
        }
        assert.ok(!existsSync(path), 'Orphan fragment; refusing an untracked request');
        if (sent >= maxRequests) {
          state.status = 'request-limit';
          persist();
          return batchStatus(batch);
        }
        if (key === undefined) {
          try { key = readKey(keyVariable); } catch { throw new Error(`Selected ${keyVariable} is unavailable; no request sent`); }
          assert.ok(typeof key === 'string' && key.trim(), 'Selected credential is empty');
        }
        const plannedAt = Math.max(now(), nextRequestAt, lastRequestStartedAt ? lastRequestStartedAt + minIntervalMs : 0);
        state.pacing = {minIntervalMs, nextRequestAt: new Date(plannedAt).toISOString()};
        state.projectPacing[keyVariable] = state.pacing;
        if (lastRequestStartedAt) state.pacing.lastRequestStartedAt = new Date(lastRequestStartedAt).toISOString();
        persist();
        while (now() < plannedAt) await scheduler(Math.min(plannedAt - now(), MAX_INTERVAL_MS));
        const previous = record;
        record = itemState.cues[cue.index] = {status: 'started', attempts: (previous?.attempts ?? 0) + 1,
          signature: cueSignature(state.catalogueSha256, item, cue), startedAt: new Date(now()).toISOString(), keyVariable};
        if (previous) {
          const {attemptHistory = [], ...attempt} = previous;
          record.attemptHistory = [...attemptHistory, attempt];
        }
        itemState.status = state.status = 'started';
        state.requests++;
        sent++;
        state.pacing.lastRequestStartedAt = record.startedAt;
        state.pacing.nextRequestAt = new Date(Date.parse(record.startedAt) + minIntervalMs).toISOString();
        persist();
        lastRequestStartedAt = now();
        nextRequestAt = lastRequestStartedAt + minIntervalMs;
        record.startedAt = state.pacing.lastRequestStartedAt = new Date(lastRequestStartedAt).toISOString();
        state.pacing.nextRequestAt = new Date(nextRequestAt).toISOString();
        let response;
        try {
          response = await fetchImpl(ENDPOINT, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
            body: JSON.stringify(speechRequest(cue.text)), signal: AbortSignal.timeout(120000), redirect: 'error'});
        } catch {
          record.status = itemState.status = state.status = 'network-error';
          persist();
          throw new Error('Network request interrupted; stopped without retries or key rotation');
        }
        record.httpStatus = response.status;
        if (!response.ok) {
          record.status = itemState.status = state.status = response.status === 429 ? 'quota-limit' : 'api-error';
          persist();
          if (response.status === 429) {
            const evidence = await providerRateLimit(response, key);
            if (evidence) {
              record.providerRateLimit = evidence;
              const retrySeconds = Math.max(evidence.retryAfterSeconds ?? 0, evidence.retryDelaySeconds ?? 0);
              nextRequestAt = Math.max(nextRequestAt, now() + retrySeconds * 1000);
              state.pacing.nextRequestAt = new Date(nextRequestAt).toISOString();
              persist();
            }
          }
          throw new Error(`HTTP ${response.status}; stopped without retries or key rotation`);
        }
        try {
          const result = await response.json();
          const audio = (result.steps ?? []).filter(step => step.type === 'model_output')
            .flatMap(step => step.content ?? []).filter(content => content.type === 'audio').at(-1);
          assert.ok(typeof audio?.data === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(audio.data), 'Missing audio');
          const bytes = Buffer.from(audio.data, 'base64');
          validateWav(bytes);
          saveBytes(path, bytes);
          Object.assign(record, {status: 'received', wavSha256: hash(bytes), usage: usageNumbers(result.usage)});
          persist();
        } catch {
          record.status = itemState.status = state.status = 'response-error';
          persist();
          throw new Error('Invalid or interrupted audio response; stopped without saving the response or retrying');
        }
        fragment(batch, item, cue, record, state.catalogueSha256, run);
        persist();
      }
      if (itemState.status === 'complete') verifyItem(batch, item, state);
      else {
        assembleItem(batch, item, state, {run});
        itemState.status = 'complete';
        persist();
      }
    }
    state.status = catalogue.items.every(item => state.items[item.id]?.status === 'complete') ? 'complete' : 'pending';
    persist();
    return batchStatus(batch);
  });
}

export function verifyItem(batch, item, state) {
  const root = join(batch, 'items', item.id);
  const report = json(safeFile(join(root, 'audio.json')));
  const {animation, ...metadata} = item;
  for (const [key, value] of Object.entries(metadata)) assert.deepEqual(report[key], value, 'Audio metadata changed');
  assert.equal(report.model, MODEL);
  assert.equal(report.voice, VOICE);
  assert.equal(report.cueTiming, 'measured');
  assert.equal(report.catalogueSha256, state.catalogueSha256);
  assert.equal(report.sourceSignature, sourceSignature(state, item));
  const expectedPcm = [];
  for (const cue of spokenCues(item)) {
    const record = state.items[item.id].cues[cue.index];
    assert.equal(record.status, 'complete');
    const wav = fragment(batch, item, cue, record, state.catalogueSha256);
    if (cue.index > 0) expectedPcm.push(Buffer.alloc(7200 * 2));
    expectedPcm.push(wav.pcm);
  }
  const wav = readFileSync(safeFile(join(root, 'audio.wav')));
  const measured = validateWav(wav);
  assert.equal(report.wavSha256, hash(wav), 'Assembled WAV changed');
  assert.equal(report.frames, measured.frames);
  assert.equal(report.duration, measured.duration);
  assert.ok(measured.pcm.equals(Buffer.concat(expectedPcm)), 'Assembled audio differs from measured cue fragments');
  assert.deepEqual(report.scenes, measuredScenes(item, state), 'Cue boundaries differ from measured fragments');
  assert.equal(report.sampleRate, RATE);
  assert.equal(report.silenceMs, 300);
  assert.ok(report.mp3Duration >= report.duration && report.mp3Duration - report.duration < 0.15);
  assert.deepEqual(report.encoding, {codec: 'mp3', channels: 1, bitrate: 48000});
  const mp3 = readFileSync(safeFile(join(root, 'audio.mp3')));
  assert.equal(report.mp3Sha256, hash(mp3), 'MP3 checksum changed');
  assert.equal(report.mp3Bytes, mp3.length);
  validateTimeline(report.scenes, {scenes: item.animation.steps}, report.duration);
  return report;
}

export function batchStatus(output) {
  const {batch, catalogue, state} = loadBatch(output);
  const completed = catalogue.items.filter(item => state.items[item.id]?.status === 'complete');
  let duration = 0;
  for (const item of completed) duration += verifyItem(batch, item, state).duration;
  return {...catalogueSummary(catalogue), status: state.status, requests: state.requests,
    completedItems: completed.length,
    completedCues: Object.values(state.items).reduce((total, item) => total + Object.values(item.cues).filter(cue => cue.status === 'complete').length, 0),
    measuredMinutes: duration / 60, keyVariable: state.keyVariable ?? 'GEMINI_API_KEY_1', keyRotation: Boolean(state.independentProjects),
    independentProjects: state.independentProjects ?? null,
    projects: PROJECT_KEYS.map(keyVariable => {
      const attempts = Object.values(state.items).flatMap(item => Object.values(item.cues))
        .flatMap(record => [...(record.attemptHistory ?? []), record])
        .filter(attempt => (attempt.keyVariable ?? 'GEMINI_API_KEY_1') === keyVariable);
      const pacing = state.projectPacing?.[keyVariable] ?? (keyVariable === (state.keyVariable ?? 'GEMINI_API_KEY_1') ? state.pacing : undefined);
      return {keyVariable, requests: attempts.length, completedCues: attempts.filter(attempt => attempt.status === 'complete').length,
        quotaRejections: attempts.filter(quotaRejected).length, nextRequestAt: pacing?.nextRequestAt ?? null};
    }),
    automaticRetries: state.independentProjects ? 'known-http-429-only' : 0, uncertainRequestRetries: 0,
    billingTierVerified: false, minIntervalMs: state.pacing?.minIntervalMs ?? MIN_INTERVAL_MS,
    nextRequestAt: state.pacing?.nextRequestAt ?? null};
}

export async function generateProjects(output, {independentProjectsConfirmed = false,
  keyVariables = PROJECT_KEYS, readKey = selectedKey, now = Date.now, ...options} = {}) {
  assert.equal(independentProjectsConfirmed, true, 'Distinct projects must be explicitly confirmed');
  assert.equal(options.freeTierConfirmed, true, '--free-tier-confirmed is required');
  assert.ok(Number.isSafeInteger(options.maxRequests) && options.maxRequests > 0, '--max-requests must be a positive integer');
  const minIntervalMs = options.minIntervalMs ?? MIN_INTERVAL_MS;
  assert.ok(Number.isSafeInteger(minIntervalMs) && minIntervalMs >= MIN_INTERVAL_MS && minIntervalMs <= MAX_INTERVAL_MS,
    '--min-interval-ms must be an integer from 15000 to 2147483647');
  assert.ok(Array.isArray(keyVariables) && keyVariables.length > 1 && keyVariables.every(name => PROJECT_KEYS.includes(name)), 'Invalid independent project selection');
  assert.equal(new Set(keyVariables).size, keyVariables.length, 'Duplicate independent project');
  const {batch, catalogue, state: initial} = loadBatch(output);
  if (options.ids !== undefined) {
    assert.ok(Array.isArray(options.ids) && options.ids.length && options.ids.every(safeId), '--ids must contain known unique IDs');
    assert.equal(new Set(options.ids).size, options.ids.length, '--ids must contain known unique IDs');
    assert.ok(options.ids.every(id => catalogue.items.some(item => item.id === id)), '--ids must contain known unique IDs');
  }
  const selected = catalogue.items.filter(item => options.ids === undefined || options.ids.includes(item.id));
  const keys = new Map(keyVariables.map(name => [name, readKey(name)]));
  assert.ok([...keys.values()].every(value => typeof value === 'string' && value.trim()), 'A configured project credential is missing');
  assert.equal(new Set(keys.values()).size, keys.size, 'Repeated credential values cannot represent independent projects');
  const blocked = new Set();
  const initialRequests = initial.requests;
  await locked(batch, () => {
    const {state} = loadBatch(batch);
    state.independentProjects = [...keyVariables];
    save(join(batch, 'progress.json'), state);
  });
  while (true) {
    const {state} = loadBatch(batch);
    if (selected.every(item => state.items[item.id]?.status === 'complete')) return batchStatus(batch);
    if (state.requests - initialRequests >= options.maxRequests) return batchStatus(batch);
    const available = keyVariables.filter(name => !blocked.has(name)).map(name => {
      const pacing = state.projectPacing?.[name] ?? (name === (state.keyVariable ?? 'GEMINI_API_KEY_1') ? state.pacing : undefined);
      const next = pacing ? Date.parse(pacing.nextRequestAt) : 0;
      assert.ok(Number.isFinite(next), 'Invalid project pacing');
      return {name, next};
    }).filter(project => project.next <= now() || project.next - now() <= minIntervalMs);
    available.sort((first, second) => first.next - second.next || keyVariables.indexOf(first.name) - keyVariables.indexOf(second.name));
    if (!available.length) {
      await locked(batch, () => {
        const {state: latest} = loadBatch(batch);
        latest.status = 'projects-quota-limit';
        save(join(batch, 'progress.json'), latest);
      });
      return batchStatus(batch);
    }
    const keyVariable = available[0].name;
    const before = state.requests;
    try {
      await generateBatch(batch, {...options, now, maxRequests: 1, resumeQuota: true,
        keyVariable, readKey: () => keys.get(keyVariable)});
    } catch (error) {
      const {state: after} = loadBatch(batch);
      if (after.status !== 'quota-limit' || after.requests !== before + 1) throw error;
      blocked.add(keyVariable);
    }
  }
}

export async function publishBatch(output, destination = join(ROOT, 'static/audio'), {source = ROOT} = {}) {
  const batch = externalBatch(output, source);
  destination = resolve(destination);
  const path = relative(batch, destination);
  assert.ok(path.startsWith('../') || isAbsolute(path), 'Do not publish inside the frozen batch');
  return locked(batch, async () => {
    const {catalogue, state} = loadBatch(batch);
    assert.deepEqual(sourceFiles(resolve(source)), catalogue.sourceFiles, 'Live source hashes differ; publication refused');
    const live = await buildCatalogue({source});
    assert.equal(hash(JSON.stringify(live.items)), hash(JSON.stringify(catalogue.items)), 'Live animations differ; publication refused');
    const completed = catalogue.items.filter(item => state.items[item.id]?.status === 'complete');
    assert.ok(completed.length, 'No complete items to publish');
    const reports = completed.map(item => ({item, report: verifyItem(batch, item, state)}));
    directory(destination, 0o755);
    const files = new Map();
    const document = name => {
      if (!files.has(name)) {
        const path = safeFile(join(destination, name));
        const bytes = existsSync(path) ? readFileSync(path) : null;
        const data = bytes ? JSON.parse(bytes) : {version: 1, lessons: {}};
        assert.equal(data.version, 1, 'Unknown public manifest version');
        assert.ok(data.lessons && typeof data.lessons === 'object' && !Array.isArray(data.lessons));
        files.set(name, {bytes, data});
      }
      return files.get(name).data;
    };
    for (const {item, report} of reports) {
      const exercise = item.kind === 'exercise';
      const manifest = document(exercise ? 'exercises-manifest.json' : 'manifest.json');
      const provenance = document(exercise ? 'exercises-provenance.json' : 'provenance.json');
      const {animation, canonicalSha256, ...metadata} = item;
      manifest.lessons[item.id] = {...metadata, model: MODEL, voice: VOICE, canonicalSha256,
        mp3Sha256: report.mp3Sha256, src: `audio/${item.id}.mp3`, duration: report.mp3Duration,
        sourceDuration: report.duration, cueTiming: 'measured', scenes: report.scenes};
      const origin = {sourceSignature: report.sourceSignature, wavSha256: report.wavSha256, canonicalSha256,
        mp3Sha256: report.mp3Sha256, mp3Bytes: report.mp3Bytes, sourceDuration: report.duration,
        timing: 'measured', encoding: report.encoding};
      publicProvenance(origin);
      provenance.lessons[item.id] = {...origin, provider: 'gemini', model: MODEL, voice: VOICE,
        catalogueSha256: state.catalogueSha256};
      provenance.geminiExporter = 'scripts/tts/gemini-course.mjs';
      if (item.kind === 'section') provenance.sectionExporter = 'scripts/tts/export-narration.mjs';
      if (!exercise) provenance.exporter ??= 'data-src/inferencia-estadistica/export-lecturas.mjs';
    }
    for (const [name, {bytes}] of files) {
      const path = safeFile(join(destination, name));
      assert.ok(bytes ? existsSync(path) && bytes.equals(readFileSync(path)) : !existsSync(path), 'Public manifest changed concurrently; publication refused');
    }
    for (const {item, report} of reports) {
      const bytes = readFileSync(safeFile(join(batch, 'items', item.id, 'audio.mp3')));
      assert.equal(hash(bytes), report.mp3Sha256);
      saveBytes(join(destination, `${item.id}.mp3`), bytes, {mode: 0o644});
    }
    for (const [name, {data}] of files) save(join(destination, name), data, {mode: 0o644});
    return {published: completed.map(item => item.id), skippedIncomplete: catalogue.items.length - completed.length};
  });
}

export async function main(args = process.argv.slice(2)) {
  const usage = 'Usage: gemini-course.mjs --prepare|--status|--generate|--publish /absolute/batch [--source directory] [--out public-audio-directory] [--max-requests N --free-tier-confirmed [--independent-projects] [--ids id1,id2] [--resume-quota] [--min-interval-ms 15000..2147483647]]';
  const [mode, batch, ...flags] = args;
  assert.ok(['--prepare', '--status', '--generate', '--publish'].includes(mode) && batch && isAbsolute(batch), usage);
  const options = {};
  let destination;
  const seen = new Set();
  for (let index = 0; index < flags.length; index++) {
    const flag = flags[index];
    assert.ok(!seen.has(flag), 'Duplicate option');
    seen.add(flag);
    if (flag === '--free-tier-confirmed' && mode === '--generate') options.freeTierConfirmed = true;
    else if (flag === '--independent-projects' && mode === '--generate') options.independentProjectsConfirmed = true;
    else if (flag === '--resume-quota' && mode === '--generate') options.resumeQuota = true;
    else {
      const value = flags[++index];
      assert.ok(value && !value.startsWith('--'), usage);
      if (flag === '--source' && ['--prepare', '--publish'].includes(mode)) {
        assert.ok(isAbsolute(value), 'Source must be absolute');
        options.source = value;
      } else if (flag === '--out' && mode === '--publish') {
        assert.ok(isAbsolute(value), 'Destination must be absolute');
        destination = value;
      } else if (flag === '--max-requests' && mode === '--generate' && /^[1-9][0-9]*$/.test(value)) options.maxRequests = Number(value);
      else if (flag === '--min-interval-ms' && mode === '--generate' && /^[1-9][0-9]*$/.test(value)) options.minIntervalMs = Number(value);
      else if (flag === '--ids' && mode === '--generate') options.ids = value.split(',');
      else throw new Error(usage);
    }
  }
  if (mode === '--prepare') return prepareBatch(batch, options);
  if (mode === '--status') return batchStatus(batch);
  if (mode === '--generate') return options.independentProjectsConfirmed ? generateProjects(batch, options) : generateBatch(batch, options);
  return publishBatch(batch, destination, options);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(await main(), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}