import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {MODEL, VOICE, STYLE, ENDPOINT, buildCatalogue, canonicalAnimation, catalogueSummary, loadBatch,
  prepareBatch, speechRequest, validateWav, generateBatch, generateProjects, PROJECT_KEYS,
  batchStatus, publishBatch, main, assembleItem} from '../scripts/tts/gemini-course.mjs';
import {retainedSection} from '../scripts/tts/prepare-sections.mjs';
import {publicProvenance} from '../scripts/prepare-media.mjs';

test('freezes the full course and preserves original visuals, sources and cues', async () => {
  const catalogue = await buildCatalogue();
  const summary = catalogueSummary(catalogue);
  assert.deepEqual(summary.counts, {section: 118, recap: 36, exercise: 387});
  assert.equal(summary.exercises, 157);
  assert.equal(summary.cues, 17872);
  assert.deepEqual(summary.cueCounts, {section: 2069, recap: 4051, exercise: 11752});
  assert.ok(catalogue.items.every(item => item.animation.steps.every(step => step.visual || step.story)));
  assert.ok(catalogue.items.some(item => item.exerciseId?.startsWith('pdf-')));
  assert.ok(catalogue.items.some(item => item.exerciseId?.startsWith('capstone-')));
  assert.ok(catalogue.items.some(item => item.exerciseId?.startsWith('practica-')));
  assert.ok(catalogue.items.some(item => item.exerciseId?.startsWith('ejemplo-')));
  assert.equal(Object.hasOwn(catalogue.sourceFiles, 'scripts/tts/gemini-course.mjs'), false);
  assert.equal(globalThis.jStat, undefined);
});

test('preparation resumes without reading live sources and rejects changed snapshots', async () => {
  const batch = mkdtempSync(join(tmpdir(), 'gemini-course-'));
  try {
    const summary = await prepareBatch(batch);
    const before = readFileSync(join(batch, 'catalogue.json'));
    assert.deepEqual(await prepareBatch(batch, {source: '/missing/course'}), summary);
    assert.deepEqual(readFileSync(join(batch, 'catalogue.json')), before);
    assert.equal(loadBatch(batch).state.status, 'pending');
    writeFileSync(join(batch, 'catalogue.json'), `${before}\n`);
    assert.throws(() => loadBatch(batch), /Immutable catalogue changed/);
  } finally {
    rmSync(batch, {recursive: true, force: true});
  }
});

const sha = value => createHash('sha256').update(value).digest('hex');
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value));

function sampleWav(frames = 2400) {
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(24000, 24); bytes.writeUInt32LE(48000, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36);
  bytes.writeUInt32LE(frames * 2, 40);
  for (let frame = 0; frame < frames; frame++) bytes.writeInt16LE(Math.round(1000 * Math.sin(frame / 10)), 44 + frame * 2);
  return bytes;
}

function fixtureBatch(context, {scenes = 1, items = [{id: 'lesson--section', kind: 'section'}]} = {}) {
  const batch = mkdtempSync(join(tmpdir(), 'gemini-cues-'));
  context.after(() => rmSync(batch, {recursive: true, force: true}));
  const animation = {id: 'lesson--section', title: 'Original title', source: {document: 'Original PDF'},
    steps: Array.from({length: scenes}, () => ({title: 'Scene', caption: 'Original math: x + 1.', kind: 'story',
      visual: {lines: [{tex: 'x+1'}]}, cues: [{text: 'Primera frase.'}, {text: 'Segunda frase.'}]}))};
  const catalogue = {version: 1, model: MODEL, voice: VOICE, style: STYLE, sourceFiles: {}, inputSha256: sha('{}'),
    items: items.map(({id, kind}) => {
      const frozen = {...animation, id};
      return {id, kind, title: frozen.title, source: frozen.source,
        canonicalSha256: sha(JSON.stringify(canonicalAnimation(frozen))), animation: frozen};
    })};
  writeJson(join(batch, 'catalogue.json'), catalogue);
  writeJson(join(batch, 'progress.json'), {version: 1, catalogueSha256: sha(readFileSync(join(batch, 'catalogue.json'))),
    requests: 0, status: 'pending', items: {}});
  return batch;
}

function audioResponse(bytes = sampleWav()) {
  return {ok: true, status: 200, json: async () => ({
    steps: [{type: 'model_output', content: [{type: 'audio', data: bytes.toString('base64')}]}],
    usage: {total_tokens: 123, total_input_tokens: 100, total_output_tokens: 23, input_tokens: -1,
      output_tokens: '23', secret: 'MUST-NOT-BE-SAVED'}
  })};
}

function fakeClock(start = Date.parse('2026-11-10T12:10:00.000Z')) {
  let time = start;
  const waits = [];
  return {now: () => time, advance: milliseconds => { time += milliseconds; }, waits,
    scheduler: async milliseconds => { waits.push(milliseconds); time += milliseconds; }};
}

const options = {maxRequests: 1, freeTierConfirmed: true, readKey: () => 'test-only-key', ...fakeClock()};

test('independent projects preserve exhausted legacy quota and distribute requests without repeating audio', async context => {
  const batch = fixtureBatch(context, {scenes: 2});
  const clock = fakeClock();
  await assert.rejects(generateBatch(batch, {...options, ...clock,
    fetchImpl: async () => ({ok: false, status: 429, headers: new Headers({'retry-after': '86400'}), json: async () => ({})})}), /HTTP 429/);
  const used = [];
  const result = await generateProjects(batch, {...options, ...clock, maxRequests: 4, independentProjectsConfirmed: true,
    readKey: name => `offline-${name}`, fetchImpl: async (url, request) => {
      used.push(request.headers['x-goog-api-key']);
      return audioResponse();
    }});
  assert.equal(result.completedItems, 1);
  assert.equal(result.requests, 5);
  assert.deepEqual(used, PROJECT_KEYS.slice(1, 5).map(name => `offline-${name}`));
  assert.deepEqual(clock.waits, []);
  const {state} = loadBatch(batch);
  assert.equal(state.items['lesson--section'].cues[0].attemptHistory[0].httpStatus, 429);
  assert.equal(state.projectPacing.GEMINI_API_KEY_1.nextRequestAt, '2026-11-11T12:10:00.000Z');
});

test('independent projects stop each exhausted project and retain every rejected attempt', async context => {
  const batch = fixtureBatch(context);
  const clock = fakeClock();
  let calls = 0;
  const result = await generateProjects(batch, {...options, ...clock, maxRequests: 20,
    independentProjectsConfirmed: true, readKey: name => `offline-${name}`,
    fetchImpl: async () => { calls++; return {ok: false, status: 429, json: async () => ({})}; }});
  assert.equal(calls, 6);
  assert.equal(result.status, 'projects-quota-limit');
  assert.equal(result.requests, 6);
  assert.ok(result.projects.every(project => project.quotaRejections === 1));
  assert.equal(loadBatch(batch).state.items['lesson--section'].cues[0].attemptHistory.length, 5);
});

test('independent projects require confirmation and unique credentials, and never retry ambiguous failures elsewhere', async context => {
  const batch = fixtureBatch(context);
  await assert.rejects(generateProjects(batch, {...options}), /Distinct projects/);
  await assert.rejects(generateProjects(batch, {...options, independentProjectsConfirmed: true}), /Repeated credential/);
  let calls = 0;
  await assert.rejects(generateProjects(batch, {...options, independentProjectsConfirmed: true,
    readKey: name => `offline-${name}`, fetchImpl: async () => {calls++; throw Error('offline');}}), /Network request/);
  assert.equal(calls, 1);
  assert.equal(loadBatch(batch).state.requests, 1);
});

test('independent projects retain per-project pacing across invocations and validate before reading credentials', async context => {
  const batch = fixtureBatch(context, {scenes: 7});
  const clock = fakeClock();
  const starts = new Map();
  const pool = {...options, ...clock, independentProjectsConfirmed: true, readKey: name => `offline-${name}`,
    fetchImpl: async (url, request) => {
      const key = request.headers['x-goog-api-key'];
      const times = starts.get(key) ?? [];
      times.push(clock.now());
      starts.set(key, times);
      return audioResponse();
    }};
  for (const minIntervalMs of [0, 14999, 15000.5, 2147483648]) {
    await assert.rejects(generateProjects(batch, {...pool, minIntervalMs,
      readKey: () => {throw Error('must not read credentials');}}), /min-interval-ms/);
  }
  await generateProjects(batch, {...pool, maxRequests: 7});
  const result = await generateProjects(batch, {...pool, maxRequests: 7});
  assert.equal(result.requests, 14);
  assert.equal(result.completedItems, 1);
  assert.equal(starts.size, 6);
  for (const times of starts.values()) {
    for (let index = 1; index < times.length; index++) assert.ok(times[index] - times[index - 1] >= 15000);
  }
  assert.deepEqual(clock.waits, [15000, 15000]);
  assert.equal(readFileSync(join(batch, 'progress.json'), 'utf8').includes('offline-'), false);
});

test('paces network starts at 4 RPM across calls and items, excluding completed WAVs', async context => {
  const batch = fixtureBatch(context, {items: [
    {id: 'lesson--section', kind: 'section'}, {id: 'exercise--question', kind: 'exercise'}
  ]});
  const clock = fakeClock();
  const starts = [];
  const fetchImpl = async () => {
    const {state} = loadBatch(batch);
    assert.equal(Date.parse(state.pacing.nextRequestAt), clock.now() + 15000);
    starts.push(clock.now());
    clock.advance(4000);
    return audioResponse();
  };
  await generateBatch(batch, {...options, ...clock, fetchImpl});
  const completed = readFileSync(join(batch, 'items/lesson--section/cues/000000.wav'));
  await generateBatch(batch, {...options, ...clock, maxRequests: 2, fetchImpl});
  assert.deepEqual(starts, [0, 15000, 30000].map(offset => Date.parse('2026-11-10T12:10:00.000Z') + offset));
  assert.deepEqual(clock.waits, [11000, 11000]);
  assert.deepEqual(readFileSync(join(batch, 'items/lesson--section/cues/000000.wav')), completed);
  assert.equal(loadBatch(batch).state.pacing.minIntervalMs, 15000);
  assert.equal(loadBatch(batch).state.pacing.nextRequestAt, '2026-11-10T12:10:45.000Z');
});

test('persists the next planned call before waiting without inventing a network attempt', async context => {
  const batch = fixtureBatch(context);
  const clock = fakeClock();
  const fetchImpl = async () => audioResponse();
  await generateBatch(batch, {...options, ...clock, fetchImpl});
  const scheduler = async milliseconds => {
    assert.equal(milliseconds, 15000);
    const {state} = loadBatch(batch);
    assert.equal(state.requests, 1);
    assert.equal(state.items['lesson--section'].cues[1], undefined);
    assert.equal(state.pacing.nextRequestAt, '2026-11-10T12:10:15.000Z');
    throw new Error('Offline scheduler interrupted');
  };
  await assert.rejects(generateBatch(batch, {...options, ...clock, scheduler, fetchImpl}), /scheduler interrupted/);
  const {state} = loadBatch(batch);
  assert.equal(state.requests, 1);
  assert.equal(state.items['lesson--section'].cues[1], undefined);
  await generateBatch(batch, {...options, ...clock, fetchImpl});
  assert.deepEqual(clock.waits, [15000]);
  assert.equal(loadBatch(batch).state.requests, 2);
});

test('production interval validation precedes credentials, requests and ledger changes', async context => {
  const batch = fixtureBatch(context);
  const before = readFileSync(join(batch, 'progress.json'));
  for (const minIntervalMs of [0, -1, 1, 14999, 15000.5, '15000', NaN, Infinity, 2147483648]) {
    await assert.rejects(generateBatch(batch, {...options, minIntervalMs,
      readKey: () => assert.fail('No key read'), fetchImpl: () => assert.fail('No request')}), /min-interval-ms/);
  }
  for (const value of ['1', '14999', '2147483648', '9007199254740993']) {
    await assert.rejects(main(['--generate', batch, '--max-requests', '1', '--free-tier-confirmed',
      '--min-interval-ms', value]), /min-interval-ms/);
  }
  for (const value of ['0', '-1', '15000.5', 'Infinity', '']) {
    await assert.rejects(main(['--generate', batch, '--max-requests', '1', '--free-tier-confirmed',
      '--min-interval-ms', value]), /Usage/);
  }
  await assert.rejects(main(['--status', batch, '--min-interval-ms', '15000']), /Usage/);
  await assert.rejects(main(['--generate', batch, '--min-interval-ms', '15000', '--min-interval-ms', '15000']), /Duplicate option/);
  assert.deepEqual(readFileSync(join(batch, 'progress.json')), before);
});

test('custom pacing rechecks early wakes and does not add a delay after a slow request', async context => {
  const batch = fixtureBatch(context, {scenes: 2});
  const clock = fakeClock();
  const starts = [];
  const scheduler = async milliseconds => {
    clock.waits.push(milliseconds);
    clock.advance(clock.waits.length === 1 ? milliseconds - 1000 : milliseconds);
  };
  const fetchImpl = async () => {
    starts.push(clock.now());
    if (starts.length === 2) clock.advance(40000);
    return audioResponse();
  };
  await generateBatch(batch, {...options, ...clock, scheduler, minIntervalMs: 30000, maxRequests: 3, fetchImpl});
  assert.deepEqual(starts.map(start => start - starts[0]), [0, 30000, 70000]);
  assert.deepEqual(clock.waits, [30000, 1000]);
});

test('legacy partial ledgers derive pacing from prior starts without requiring migration', async context => {
  const batch = fixtureBatch(context);
  const clock = fakeClock();
  await generateBatch(batch, {...options, ...clock, fetchImpl: async () => audioResponse()});
  const path = join(batch, 'progress.json');
  const state = readJson(path);
  delete state.pacing;
  writeJson(path, state);
  clock.advance(5000);
  await generateBatch(batch, {...options, ...clock, fetchImpl: async () => audioResponse()});
  assert.deepEqual(clock.waits, [10000]);
  assert.equal(loadBatch(batch).state.requests, 2);
});

test('partial completed WAV checksums are verified before credentials, scheduling or new calls', async context => {
  const batch = fixtureBatch(context);
  await generateBatch(batch, {...options, fetchImpl: async () => audioResponse()});
  const path = join(batch, 'items/lesson--section/cues/000000.wav');
  const bytes = readFileSync(path);
  bytes[bytes.length - 1] ^= 1;
  writeFileSync(path, bytes);
  const before = readFileSync(join(batch, 'progress.json'));
  await assert.rejects(generateBatch(batch, {...options, readKey: () => assert.fail('No key read'),
    scheduler: () => assert.fail('No wait'), fetchImpl: () => assert.fail('No request')}), /checksum changed/);
  assert.deepEqual(readFileSync(join(batch, 'progress.json')), before);
});

test('429 stores only safe structured provider evidence and manual resumption respects its cooldown', async context => {
  const batch = fixtureBatch(context);
  const clock = fakeClock();
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return {ok: false, status: 429, headers: new Headers({'retry-after': '90'}), json: async () => {
      assert.equal(loadBatch(batch).state.status, 'quota-limit');
      return {error: {message: 'test-only-key MUST-NOT-BE-SAVED', details: [
        {'@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '60.5s', message: 'MUST-NOT-BE-SAVED'},
        {'@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [
          {quotaMetric: 'generativelanguage.googleapis.com/generate_requests_per_model_per_day',
            quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', description: 'test-only-key MUST-NOT-BE-SAVED',
            quotaDimensions: {model: MODEL, location: 'global', quota_limit: '250', unit: '1/d/{project}/{model}',
              project: 'MUST-NOT-BE-SAVED', key: 'test-only-key'}},
          {quotaMetric: 'generativelanguage.googleapis.com/generate_requests_per_model_per_minute', quotaId: 'RequestsPerMinute'},
          {quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'RequestsPerDay',
            quotaDimensions: {model: 'test-only-key', location: 'global?key=test-only-key', quota_limit: '999\nsecret',
              unit: `AIza${'x'.repeat(35)}`}},
          {quotaMetric: 'test-only-key', quotaId: 'unsafe value MUST-NOT-BE-SAVED'}
        ]},
        {'@type': 'unexpected', quotaMetric: 'MUST-NOT-BE-SAVED'}
      ]}};
    }};
  };
  await assert.rejects(generateBatch(batch, {...options, ...clock, maxRequests: 10, fetchImpl}), /HTTP 429; stopped/);
  assert.equal(calls, 1);
  assert.deepEqual(clock.waits, []);
  const rejected = loadBatch(batch).state.items['lesson--section'].cues[0];
  assert.deepEqual(rejected.providerRateLimit, {retryAfterSeconds: 90, retryDelaySeconds: 60.5, violations: [
    {quotaMetric: 'generativelanguage.googleapis.com/generate_requests_per_model_per_day',
      quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
      quotaDimensions: {model: MODEL, location: 'global', quota_limit: '250', unit: '1/d/{project}/{model}'}, requestLimit: 'RPD'},
    {quotaMetric: 'generativelanguage.googleapis.com/generate_requests_per_model_per_minute', quotaId: 'RequestsPerMinute', requestLimit: 'RPM'},
    {quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'RequestsPerDay'}
  ]});
  assert.equal(batchStatus(batch).billingTierVerified, false);
  assert.equal(batchStatus(batch).nextRequestAt, '2026-11-10T12:11:30.000Z');
  const progress = readFileSync(join(batch, 'progress.json'), 'utf8');
  for (const secret of ['test-only-key', 'MUST-NOT-BE-SAVED', 'AIza', 'description', 'message']) assert.ok(!progress.includes(secret));
  await assert.rejects(generateBatch(batch, {...options, ...clock, fetchImpl,
    readKey: () => assert.fail('No key read')}), /unresolved/);
  assert.equal(calls, 1);
  clock.advance(8000);
  await generateBatch(batch, {...options, ...clock, resumeQuota: true, fetchImpl: async () => { calls++; return audioResponse(); }});
  assert.deepEqual(clock.waits, [82000]);
  assert.equal(calls, 2);
  assert.deepEqual(loadBatch(batch).state.items['lesson--section'].cues[0].attemptHistory[0], rejected);
});

test('429 remains durable when structured JSON fails and Retry-After accepts only bounded numeric seconds', async context => {
  for (const retryAfter of ['45.25', '0', '-1', 'Infinity', '1e3', '31536001', 'Tue, 10 Nov 2026 12:20:00 GMT', 'test-only-key']) {
    const batch = fixtureBatch(context);
    const clock = fakeClock();
    let calls = 0;
    await assert.rejects(generateBatch(batch, {...options, ...clock, maxRequests: 10, fetchImpl: async () => {
      calls++;
      return {ok: false, status: 429, headers: new Headers({'retry-after': retryAfter}), json: async () => {
        throw new Error('test-only-key MUST-NOT-BE-SAVED');
      }};
    }}), /HTTP 429; stopped/);
    const {state} = loadBatch(batch);
    const record = state.items['lesson--section'].cues[0];
    assert.equal(record.httpStatus, 429);
    assert.equal(state.status, 'quota-limit');
    assert.equal(state.requests, 1);
    assert.equal(calls, 1);
    assert.deepEqual(clock.waits, []);
    assert.deepEqual(record.providerRateLimit, ['45.25', '0'].includes(retryAfter) ? {retryAfterSeconds: Number(retryAfter)} : undefined);
    assert.ok(!readFileSync(join(batch, 'progress.json'), 'utf8').includes('MUST-NOT-BE-SAVED'));
  }
});

test('RetryInfo without headers accepts only safe protobuf durations, never text or alternate detail types', async context => {
  for (const retryDelay of ['75.125s', '0s', '-1s', 'NaNs', '1e3s', '31536001s', '60', {seconds: 60}, 'test-only-key']) {
    const batch = fixtureBatch(context);
    const clock = fakeClock();
    await assert.rejects(generateBatch(batch, {...options, ...clock, fetchImpl: async () => ({ok: false, status: 429,
      json: async () => ({error: {details: [null,
        {'@type': 'not-google.rpc.RetryInfo', retryDelay: '999s'},
        {'@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay}
      ]}})
    })}), /HTTP 429; stopped/);
    const {state} = loadBatch(batch);
    const valid = ['75.125s', '0s'].includes(retryDelay);
    assert.deepEqual(state.items['lesson--section'].cues[0].providerRateLimit,
      valid ? {retryDelaySeconds: Number(retryDelay.slice(0, -1))} : undefined);
    assert.equal(Date.parse(state.pacing.nextRequestAt) - clock.now(), retryDelay === '75.125s' ? 75125 : 15000);
    assert.equal(state.requests, 1);
    assert.deepEqual(clock.waits, []);
  }
});

test('ID filtering skips earlier recaps, shares one request bound and preserves whole-batch completion', async context => {
  const batch = fixtureBatch(context, {items: [
    {id: 'lesson--section', kind: 'section'}, {id: 'lesson', kind: 'recap'}, {id: 'exercise--question', kind: 'exercise'}
  ]});
  let calls = 0;
  const fetchImpl = async () => { calls++; return audioResponse(); };
  const ids = ['lesson--section', 'exercise--question'];
  const first = await generateBatch(batch, {...options, ids, maxRequests: 3, fetchImpl});
  assert.equal(first.status, 'request-limit');
  assert.equal(first.requests, 3);
  assert.equal(first.completedItems, 1);
  let {state} = loadBatch(batch);
  assert.equal(state.items.lesson, undefined);
  assert.equal(state.items['exercise--question'].cues[0].status, 'complete');
  assert.equal(state.items['exercise--question'].cues[1], undefined);
  const second = await generateBatch(batch, {...options, ids: ['exercise--question'], fetchImpl});
  assert.equal(second.status, 'pending');
  assert.equal(second.requests, 4);
  assert.equal(second.completedItems, 2);
  ({state} = loadBatch(batch));
  assert.equal(state.items.lesson, undefined);
  assert.equal(calls, 4);
  const noOp = await main(['--generate', batch, '--ids', ids.join(','), '--max-requests', '1', '--free-tier-confirmed']);
  assert.equal(noOp.status, 'pending');
  assert.equal(noOp.requests, 4);
  const final = await generateBatch(batch, {...options, ids: ['lesson'], maxRequests: 2, fetchImpl});
  assert.equal(final.status, 'complete');
  assert.equal(final.completedItems, 3);
  assert.equal(final.requests, 6);
});

test('invalid ID filters fail before credentials, calls or ledger changes', async context => {
  const batch = fixtureBatch(context);
  const before = readFileSync(join(batch, 'progress.json'));
  for (const ids of [[], ['missing'], ['lesson--section', 'lesson--section'], [''], ['lesson--section', ''], 'lesson--section']) {
    await assert.rejects(generateBatch(batch, {...options, ids, readKey: () => assert.fail('No credential reads'),
      fetchImpl: () => assert.fail('No requests')}), /known unique IDs/);
    assert.deepEqual(readFileSync(join(batch, 'progress.json')), before);
  }
  for (const value of ['missing', 'lesson--section,lesson--section', 'lesson--section,']) {
    await assert.rejects(main(['--generate', batch, '--ids', value, '--max-requests', '1', '--free-tier-confirmed']), /known unique IDs/);
  }
  await assert.rejects(main(['--status', batch, '--ids', 'lesson--section']), /Usage/);
  await assert.rejects(main(['--generate', batch, '--ids', 'lesson--section', '--ids', 'lesson--section']), /Duplicate option/);
  assert.deepEqual(readFileSync(join(batch, 'progress.json')), before);
});

test('requires explicit free-tier confirmation and a bounded request count before reading a key', async context => {
  const batch = fixtureBatch(context);
  const readKey = () => { throw new Error('Must not read credentials'); };
  await assert.rejects(generateBatch(batch, {maxRequests: 1, readKey}), /free-tier-confirmed/);
  await assert.rejects(generateBatch(batch, {freeTierConfirmed: true, readKey}), /max-requests/);
  assert.equal(batchStatus(batch).requests, 0);
});

test('REST body preserves exact text and requests only Puck, WAV and store:false', () => {
  const text = 'Texto original: x², P(A|B) y cero coma cinco.';
  const request = speechRequest(text);
  assert.equal(request.model, MODEL);
  assert.equal(request.input[0].content[0].text, text);
  assert.equal(request.input[0].content[0].annotations[0].style, STYLE);
  assert.deepEqual(request.generation_config.speech_config, [{voice: 'Puck'}]);
  assert.deepEqual(request.response_format, {type: 'audio', mime_type: 'audio/wav', sample_rate: 24000});
  assert.equal(request.store, false);
});

test('real CPU ffprobe/ffmpeg assembly measures cues, inserts 300ms silence and resumes without calls', async context => {
  const batch = fixtureBatch(context, {scenes: 2});
  let calls = 0;
  const fetchImpl = async (url, request) => {
    assert.equal(url, ENDPOINT);
    assert.equal(request.redirect, 'error');
    assert.equal(request.headers['x-goog-api-key'], 'test-only-key');
    calls++;
    return audioResponse(sampleWav(calls % 2 ? 2400 : 4800));
  };
  const first = await generateBatch(batch, {...options, fetchImpl});
  assert.equal(calls, 1);
  assert.equal(first.status, 'request-limit');
  const final = await generateBatch(batch, {...options, maxRequests: 3, fetchImpl});
  assert.equal(calls, 4);
  assert.equal(final.completedItems, 1);
  const report = readJson(join(batch, 'items/lesson--section/audio.json'));
  assert.ok(Math.abs(report.duration - 1.5) < 1e-10);
  assert.deepEqual(report.scenes, [
    {start: 0, end: 0.6, cues: [{text: 'Primera frase.', start: 0, end: 0.1}, {text: 'Segunda frase.', start: 0.4, end: 0.6}]},
    {start: 0.6, end: 1.5, cues: [{text: 'Primera frase.', start: 0.9, end: 1}, {text: 'Segunda frase.', start: 1.3, end: 1.5}]}
  ]);
  const pcm = validateWav(readFileSync(join(batch, 'items/lesson--section/audio.wav'))).pcm;
  assert.ok(pcm.subarray(2400 * 2, 9600 * 2).every(byte => byte === 0));
  await generateBatch(batch, {...options, fetchImpl: () => assert.fail('No repeat requests'), readKey: () => assert.fail('No credential reads')});
  const progress = readFileSync(join(batch, 'progress.json'), 'utf8');
  assert.ok(!progress.includes('test-only-key') && !progress.includes('MUST-NOT-BE-SAVED'));
  assert.deepEqual(readJson(join(batch, 'progress.json')).items['lesson--section'].cues[0].usage,
    {total_tokens: 123, total_input_tokens: 100, total_output_tokens: 23});
});

for (const failure of ['quota-limit', 'network-error', 'response-error', 'api-error']) {
  test(`${failure} persists and blocks every later automatic attempt`, async context => {
    const batch = fixtureBatch(context);
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      if (failure === 'network-error') throw new Error('secret in transport error MUST-NOT-BE-SAVED');
      if (failure === 'response-error') return {ok: true, status: 200, json: async () => { throw new Error('raw response secret'); }};
      return {ok: false, status: failure === 'quota-limit' ? 429 : 503, json: () => {
        if (failure === 'quota-limit') throw new SyntaxError('Unreadable provider JSON MUST-NOT-BE-SAVED');
        assert.fail('Do not read other API error bodies');
      }};
    };
    await assert.rejects(generateBatch(batch, {...options, fetchImpl}), /stopped/);
    assert.equal(readJson(join(batch, 'progress.json')).status, failure);
    await assert.rejects(generateBatch(batch, {...options, fetchImpl, readKey: () => assert.fail('No key read')}), /unresolved/);
    if (failure !== 'quota-limit') {
      await assert.rejects(generateBatch(batch, {...options, resumeQuota: true, fetchImpl,
        readKey: () => assert.fail('No key read')}), /unresolved/);
    }
    assert.equal(calls, 1);
    assert.ok(!readFileSync(join(batch, 'progress.json'), 'utf8').includes('MUST-NOT-BE-SAVED'));
  });
}

test('explicit quota resumption preserves every rejected attempt and stops on each new 429', async context => {
  const batch = fixtureBatch(context);
  let calls = 0;
  const rejectQuota = async () => {
    calls++;
    const record = loadBatch(batch).state.items['lesson--section'].cues[0];
    assert.equal(record.status, 'started');
    assert.equal(record.attempts, calls);
    assert.equal(record.attemptHistory?.length ?? 0, calls - 1);
    return {ok: false, status: 429, json: async () => ({error: {message: 'MUST-NOT-BE-SAVED'}})};
  };
  await assert.rejects(generateBatch(batch, {...options, maxRequests: 10, fetchImpl: rejectQuota}), /HTTP 429; stopped/);
  await assert.rejects(generateBatch(batch, {...options, maxRequests: 10, resumeQuota: true, fetchImpl: rejectQuota}), /HTTP 429; stopped/);
  assert.equal(calls, 2);
  let {state} = loadBatch(batch);
  assert.equal(state.requests, 2);
  assert.equal(state.status, 'quota-limit');
  assert.equal(state.items['lesson--section'].cues[1], undefined);
  const rejected = structuredClone(state.items['lesson--section'].cues[0]);
  assert.equal(rejected.attemptHistory[0].httpStatus, 429);
  assert.equal(rejected.attemptHistory[0].status, 'quota-limit');
  await assert.rejects(generateBatch(batch, {...options, fetchImpl: () => assert.fail('No automatic retry'),
    readKey: () => assert.fail('No key read')}), /unresolved/);
  const fetchImpl = async () => { calls++; return audioResponse(); };
  const resumed = await generateBatch(batch, {...options, resumeQuota: true, fetchImpl});
  assert.equal(resumed.status, 'request-limit');
  assert.equal(resumed.requests, 3);
  ({state} = loadBatch(batch));
  const recovered = state.items['lesson--section'].cues[0];
  assert.equal(recovered.attempts, 3);
  const {attemptHistory, ...lastRejected} = rejected;
  assert.deepEqual(recovered.attemptHistory, [...attemptHistory, lastRejected]);
  assert.equal(recovered.status, 'complete');
  assert.deepEqual(recovered.usage, {total_tokens: 123, total_input_tokens: 100, total_output_tokens: 23});
  const complete = await generateBatch(batch, {...options, fetchImpl});
  assert.equal(complete.status, 'complete');
  assert.equal(complete.requests, 4);
  assert.equal(calls, 4);
  const noOp = await main(['--generate', batch, '--ids', 'lesson--section', '--resume-quota', '--max-requests', '1', '--free-tier-confirmed']);
  assert.equal(noOp.requests, 4);
});

test('quota resumption refuses unselected rejections, unexpected audio and corrupted attempt histories', async context => {
  const batch = fixtureBatch(context, {items: [
    {id: 'lesson--section', kind: 'section'}, {id: 'exercise--question', kind: 'exercise'}
  ]});
  const fetchImpl = async () => ({ok: false, status: 429});
  await assert.rejects(generateBatch(batch, {...options, fetchImpl}), /HTTP 429/);
  await assert.rejects(generateBatch(batch, {...options, resumeQuota: true, ids: ['exercise--question'],
    readKey: () => assert.fail('No key read'), fetchImpl: () => assert.fail('No request')}), /unresolved/);
  const cuePath = join(batch, 'items/lesson--section/cues/000000.wav');
  writeFileSync(cuePath, sampleWav());
  await assert.rejects(generateBatch(batch, {...options, resumeQuota: true, readKey: () => assert.fail('No key read')}), /unexpected WAV/);
  rmSync(cuePath);
  await assert.rejects(generateBatch(batch, {...options, resumeQuota: true, fetchImpl}), /HTTP 429/);
  const progressPath = join(batch, 'progress.json');
  const original = readJson(progressPath);
  const corruptions = [
    state => state.requests--,
    state => state.items['lesson--section'].cues[0].attempts--,
    state => delete state.items['lesson--section'].cues[0].attemptHistory,
    state => state.items['lesson--section'].cues[0].attemptHistory[0].status = 'network-error',
    state => state.items['lesson--section'].cues[0].attemptHistory[0].httpStatus = 503,
    state => state.items['lesson--section'].cues[0].attemptHistory[0].signature = 'changed',
    state => state.items['lesson--section'].cues[0].attemptHistory[0].attempts = 2,
    state => state.items['lesson--section'].cues[0].attemptHistory[0].attemptHistory = [],
    state => state.items['lesson--section'].cues[0].httpStatus = 503
  ];
  for (const corrupt of corruptions) {
    const state = structuredClone(original);
    corrupt(state);
    writeJson(progressPath, state);
    await assert.rejects(generateBatch(batch, {...options, resumeQuota: true,
      readKey: () => assert.fail('No key read'), fetchImpl: () => assert.fail('No request')}), /history|ledger|Quota rejection|HTTP 429/);
  }
});

test('a started request with a durable WAV is recovered without another API call', async context => {
  const batch = fixtureBatch(context);
  await generateBatch(batch, {...options, fetchImpl: async () => audioResponse()});
  const progress = readJson(join(batch, 'progress.json'));
  progress.items['lesson--section'].cues[0].status = 'started';
  delete progress.items['lesson--section'].cues[0].wavSha256;
  writeJson(join(batch, 'progress.json'), progress);
  let calls = 0;
  const result = await generateBatch(batch, {...options, fetchImpl: async () => { calls++; return audioResponse(); }});
  assert.equal(calls, 1);
  assert.equal(result.status, 'complete');
});

test('completed metadata cannot claim invented cue timings or modified audio', async context => {
  const batch = fixtureBatch(context);
  await generateBatch(batch, {...options, maxRequests: 2, fetchImpl: async () => audioResponse()});
  const path = join(batch, 'items/lesson--section/audio.json');
  const report = readJson(path);
  report.scenes[0].cues[1].start -= 0.1;
  writeJson(path, report);
  assert.throws(() => batchStatus(batch), /Cue boundaries differ/);
});

test('CLI validates modes and refuses unbounded or unconfirmed generation', async context => {
  const batch = fixtureBatch(context);
  await assert.rejects(main(['--generate', batch, '--max-requests', '1']), /free-tier-confirmed/);
  await assert.rejects(main(['--generate', batch, '--free-tier-confirmed']), /max-requests/);
  await assert.rejects(main(['--prepare', batch, '--refresh']), /Usage/);
  await assert.rejects(main(['--status', batch, '--free-tier-confirmed']), /Usage/);
  await assert.rejects(main(['--status', batch, '--resume-quota']), /Usage/);
  await assert.rejects(main(['--generate', batch, '--resume-quota', '--resume-quota']), /Duplicate option/);
  await assert.rejects(generateBatch(batch, {...options, resumeQuota: 'true'}), /explicit boolean/);
  assert.equal((await main(['--status', batch])).requests, 0);
});

test('a local ffmpeg failure resumes completed cues without reading credentials or repeating synthesis', async context => {
  const batch = fixtureBatch(context);
  let calls = 0;
  const fetchImpl = async () => { calls++; return audioResponse(); };
  const run = (command, args, settings) => {
    if (command === 'ffmpeg' && args.includes('-i')) throw new Error('Local encoding failure');
    return execFileSync(command, args, settings);
  };
  await assert.rejects(generateBatch(batch, {...options, maxRequests: 2, fetchImpl, run}), /Local encoding failure/);
  const result = await generateBatch(batch, {...options, fetchImpl: () => assert.fail('No synthesis retry'),
    readKey: () => assert.fail('No credential reads')});
  assert.equal(calls, 2);
  assert.equal(result.status, 'complete');
});

test('started requests without durable WAVs and locked outputs are never retried', async context => {
  const batch = fixtureBatch(context);
  await generateBatch(batch, {...options, fetchImpl: async () => audioResponse()});
  const path = join(batch, 'progress.json');
  const progress = readJson(path);
  progress.items['lesson--section'].cues[0].status = 'started';
  writeJson(path, progress);
  rmSync(join(batch, 'items/lesson--section/cues/000000.wav'));
  await assert.rejects(generateBatch(batch, {...options, fetchImpl: () => assert.fail('No request'),
    readKey: () => assert.fail('No credential reads')}), /unresolved/);
  await assert.rejects(generateBatch(batch, {...options, resumeQuota: true, fetchImpl: () => assert.fail('No request'),
    readKey: () => assert.fail('No credential reads')}), /unresolved/);
  writeFileSync(join(batch, '.lock'), 'other writer');
  await assert.rejects(generateBatch(batch, {...options}), /EEXIST/);
  assert.equal(readFileSync(join(batch, '.lock'), 'utf8'), 'other writer');
});

test('WAV validation rejects truncation, non-PCM formats, bad rates and silent responses', () => {
  assert.throws(() => validateWav(sampleWav().subarray(0, -2)), /Incomplete WAV/);
  const badRate = sampleWav(); badRate.writeUInt32LE(44100, 24);
  assert.throws(() => validateWav(badRate), /24 kHz/);
  const badFormat = sampleWav(); badFormat.writeUInt16LE(3, 20);
  assert.throws(() => validateWav(badFormat), /PCM WAV/);
  const silent = sampleWav(); silent.fill(0, 44);
  assert.throws(() => validateWav(silent), /Silent WAV/);
});

test('publishes only complete compatible items with genuine Gemini provenance accepted by retainedSection', async context => {
  const batch = mkdtempSync(join(tmpdir(), 'gemini-publish-batch-'));
  const destination = mkdtempSync(join(tmpdir(), 'gemini-public-'));
  context.after(() => { rmSync(batch, {recursive: true, force: true}); rmSync(destination, {recursive: true, force: true}); });
  await prepareBatch(batch);
  const {catalogue} = loadBatch(batch);
  const first = catalogue.items[0];
  const count = first.animation.steps.reduce((total, step) => total + step.cues.length, 0);
  await generateBatch(batch, {...options, maxRequests: count, fetchImpl: async () => audioResponse()});
  writeJson(join(destination, 'manifest.json'), {version: 1, lessons: {existing: {untouched: true}}});
  const result = await publishBatch(batch, destination);
  assert.deepEqual(result.published, [first.id]);
  const manifest = readJson(join(destination, 'manifest.json'));
  const provenance = readJson(join(destination, 'provenance.json'));
  assert.deepEqual(manifest.lessons.existing, {untouched: true});
  const track = manifest.lessons[first.id];
  const origin = provenance.lessons[first.id];
  assert.equal(track.model, MODEL);
  assert.equal(track.voice, VOICE);
  assert.equal(track.canonicalSha256, first.canonicalSha256);
  assert.equal(track.mp3Sha256, sha(readFileSync(join(destination, `${first.id}.mp3`))));
  assert.equal(track.mp3Sha256, origin.mp3Sha256);
  assert.equal(track.canonicalSha256, origin.canonicalSha256);
  assert.equal(track.sourceDuration, origin.sourceDuration);
  assert.equal(track.sourceDuration, track.scenes.at(-1).end);
  assert.ok(track.duration >= track.sourceDuration && track.duration - track.sourceDuration < 0.15);
  assert.equal(origin.provider, 'gemini');
  assert.equal(origin.model, MODEL);
  assert.equal(origin.voice, VOICE);
  assert.equal(statSync(join(destination, `${first.id}.mp3`)).mode & 0o777, 0o644);
  assert.equal(statSync(join(destination, 'manifest.json')).mode & 0o777, 0o644);
  assert.equal(statSync(join(batch, 'catalogue.json')).mode & 0o777, 0o600);
  assert.equal(statSync(join(batch, 'progress.json')).mode & 0o777, 0o600);
  assert.doesNotThrow(() => publicProvenance(origin));
  const canonical = {...first, scenes: first.animation.steps.map(step => ({...step, chapter: step.data?.chapter}))};
  assert.doesNotThrow(() => retainedSection(destination, canonical, manifest.lessons[first.id], origin));
  const reportPath = join(batch, 'items', first.id, 'audio.json');
  const report = readJson(reportPath);
  report.canonicalSha256 = '0'.repeat(64);
  writeJson(reportPath, report);
  const before = readFileSync(join(destination, 'manifest.json'));
  await assert.rejects(publishBatch(batch, destination), /metadata changed/);
  assert.deepEqual(readFileSync(join(destination, 'manifest.json')), before);
});

test('recaps and PDF question IDs publish to their separate manifests without truncating metadata', async context => {
  const batch = mkdtempSync(join(tmpdir(), 'gemini-more-batch-'));
  const destination = mkdtempSync(join(tmpdir(), 'gemini-more-public-'));
  context.after(() => { rmSync(batch, {recursive: true, force: true}); rmSync(destination, {recursive: true, force: true}); });
  await prepareBatch(batch);
  const {catalogue, state} = loadBatch(batch);
  const selected = [catalogue.items.find(item => item.kind === 'recap'),
    catalogue.items.find(item => item.kind === 'exercise' && item.id.includes('pdf-u2-2.1'))];
  for (const item of selected) {
    const root = join(batch, 'items', item.id, 'cues');
    mkdirSync(root, {recursive: true});
    const itemState = state.items[item.id] = {status: 'pending', cues: {}};
    let index = 0;
    item.animation.steps.forEach((step, sceneIndex) => step.cues.forEach((original, cueIndex) => {
      const cue = {text: original.text, sceneIndex, cueIndex, index};
      const bytes = sampleWav();
      writeFileSync(join(root, `${String(index).padStart(6, '0')}.wav`), bytes);
      itemState.cues[index] = {status: 'complete', attempts: 1, measuredBy: 'ffprobe',
        signature: sha(JSON.stringify({version: 1, catalogueSha256: state.catalogueSha256, id: item.id, ...cue})),
        wavSha256: sha(bytes), frames: 2400, duration: 0.1};
      state.requests++;
      index++;
    }));
    assembleItem(batch, item, state);
    itemState.status = 'complete';
  }
  writeJson(join(batch, 'progress.json'), state);
  const published = await publishBatch(batch, destination);
  assert.equal(published.compatibilityWarning, undefined);
  const recap = readJson(join(destination, 'manifest.json')).lessons[selected[0].id];
  const exercise = readJson(join(destination, 'exercises-manifest.json')).lessons[selected[1].id];
  assert.equal(recap.kind, 'recap');
  assert.equal(exercise.exerciseId, selected[1].exerciseId);
  assert.equal(exercise.questionId, selected[1].questionId);
  assert.deepEqual(exercise.source, selected[1].source);
  for (const [index, track] of [recap, exercise].entries()) {
    assert.equal(track.model, MODEL);
    assert.equal(track.voice, VOICE);
    assert.equal(track.canonicalSha256, selected[index].canonicalSha256);
    assert.equal(track.mp3Sha256, sha(readFileSync(join(destination, `${selected[index].id}.mp3`))));
    assert.equal(track.sourceDuration, track.scenes.at(-1).end);
    assert.ok(track.duration >= track.sourceDuration && track.duration - track.sourceDuration < 0.15);
  }
  assert.ok(readFileSync(join(destination, `${selected[1].id}.mp3`)).length > 0);
  assert.doesNotThrow(() => publicProvenance(readJson(join(destination, 'exercises-provenance.json')).lessons[selected[1].id]));
  const frozen = readJson(join(batch, 'catalogue.json'));
  frozen.sourceFiles['pages/inferencia/course.js'] = '0'.repeat(64);
  frozen.inputSha256 = sha(JSON.stringify(frozen.sourceFiles));
  writeJson(join(batch, 'catalogue.json'), frozen);
  state.catalogueSha256 = sha(readFileSync(join(batch, 'catalogue.json')));
  writeJson(join(batch, 'progress.json'), state);
  const before = readFileSync(join(destination, 'exercises-manifest.json'));
  await assert.rejects(publishBatch(batch, destination), /Live source hashes differ/);
  assert.deepEqual(readFileSync(join(destination, 'exercises-manifest.json')), before);
});