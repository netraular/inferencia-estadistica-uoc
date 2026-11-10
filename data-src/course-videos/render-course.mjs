import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {MODEL, VOICE, prepareCourseItem, validateCourseAudio, sampleFrames, selectItems, sha256} from './course-contract.mjs';
import {probeMedia, verifyMedia} from './course-media.mjs';
import {representativeFrame, courseTimeline} from './course-frame.mjs';
import {prepareTranscriptBatch, loadTranscriptBatch, prepareTranscriptInputs, assertPublishable, assertTranscriptResume, writeProgress} from './transcript-batch.mjs';

const owned = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(owned, '../..');
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const atomicJson = (filename, value) => {
  const temporary = `${filename}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, filename);
};

export function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (['--ready', '--publish', '--worker', '--help', '--transcript', '--prepare', '--status'].includes(flag)) options[flag.slice(2)] = true;
    else if (['--batch', '--ids', '--limit', '--source'].includes(flag)) {
      assert.ok(args[index + 1] && !args[index + 1].startsWith('--'), `Missing value for ${flag}`);
      const value = args[++index];
      options[flag.slice(2)] = flag === '--limit' ? Number(value) : flag === '--ids' ? value.split(',') : value;
    } else throw new Error(`Unknown option ${flag}`);
  }
  if (!options.help) assert.ok(options.batch && path.isAbsolute(options.batch), '--batch must be absolute');
  if (options.transcript) {
    assert.ok(!options.publish, 'Cannot publish transcript drafts as Puck videos');
    assert.ok(!options.ready, '--ready is reserved for measured audio');
  } else assert.ok(!options.prepare && !options.source && !options.status, 'Transcript options require --transcript');
  if (options.prepare) assert.ok(options.source && path.isAbsolute(options.source), '--prepare requires absolute --source');
  return options;
}

function optionalBytes(filename) {
  try {
    assert.ok(fs.lstatSync(filename).isFile(), `Not a regular input file: ${filename}`);
    return fs.readFileSync(filename);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function probeAudio(filename) {
  const require = createRequire(import.meta.url);
  const bundled = require('ffprobe-static').path;
  return probeMedia(fs.existsSync(bundled) ? bundled : '/usr/bin/ffprobe', filename).streams.find(stream => stream.codec_type === 'audio');
}

export function prepareBatchInputs(batch, catalogue, options = {}, {probe = probeAudio, diagnose = console.log} = {}) {
  assert.ok(!options.transcript, 'Use explicit transcript batch inputs');
  assertPublishable(catalogue);
  const bounded = selectItems(catalogue, options);
  const items = options.ready ? selectItems(catalogue, {ids:options.ids}) : bounded;
  if (options.publish) {
    assert.ok(!catalogue.preview, 'Cannot publish partial preview narration');
    assert.ok(!catalogue.testFixture, 'Cannot publish fixture narration');
  }
  const prepared = [];
  const pending = [];
  for (const item of items) {
    try {
      const directory = path.join(batch, 'items', item.id);
      const mp3Path = path.join(directory, 'audio.mp3');
      const audioPath = path.join(directory, 'audio.json');
      const mp3 = optionalBytes(mp3Path);
      const audioBytes = optionalBytes(audioPath);
      const audio = audioBytes === undefined ? undefined : JSON.parse(audioBytes);
      if (audioBytes !== undefined) {
        assertPublishable(audio);
        validateCourseAudio(item, audio);
        if (options.publish) {
          assert.ok(!audio.preview, 'Cannot publish partial preview narration');
          assert.ok(!audio.testFixture, 'Cannot publish fixture narration');
        }
      }
      const storyboard = audioBytes !== undefined && mp3 !== undefined ? prepareCourseItem(item, audio, mp3) : undefined;
      if (mp3 !== undefined) {
        const sound = probe(mp3Path);
        assert.ok(sound && Number.isFinite(Number(sound.duration)) && Number(sound.duration) > 0, 'Invalid MP3 audio stream');
        if (storyboard) assert.ok(Math.abs(Number(sound.duration) - audio.duration) < 0.15, 'MP3 duration incompatible with measured cues');
      }
      const missing = [audioBytes === undefined && 'audio.json', mp3 === undefined && 'audio.mp3'].filter(Boolean);
      if (missing.length) {
        assert.ok(options.ready && !options.ids, `Missing ${missing.join(', ')}`);
        pending.push({id:item.id, missing});
        diagnose(`COURSE_PENDING ${item.id} missing ${missing.join(', ')}`);
      } else prepared.push({item, storyboard, mp3Path, audioPath});
    } catch (error) {
      throw new Error(`${item.id}: ${error.message}`, {cause:error});
    }
  }
  const selected = prepared.slice(0, options.limit ?? prepared.length);
  diagnose(`COURSE_READY ${JSON.stringify({selected:items.length, ready:prepared.length, pending:pending.length, rendering:selected.length})}`);
  return {prepared:selected, pending};
}

export function rendererInputs({source = root} = {}) {
  const require = createRequire(import.meta.url);
  const {parse} = require('acorn');
  const tutor = fs.readFileSync(path.join(source, 'pages/inferencia/exercise-tutor.js'), 'utf8');
  const syntax = {ecmaVersion:'latest', sourceType:'module', ranges:true};
  const declarations = parse(tutor, syntax).body.filter(node => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration' && node.declaration.id?.name === 'stageEquations');
  assert.equal(declarations.length, 1, 'Expected one exported stageEquations math dependency');
  const mathSource = tutor.slice(declarations[0].start, declarations[0].end);
  const scopes = require('eslint-scope').analyze(parse(mathSource, syntax), {ecmaVersion:2022, sourceType:'module'});
  assert.deepEqual(scopes.globalScope.through.map(reference => reference.identifier.name).filter(name => name !== 'undefined'), [], 'stageEquations must remain self-contained');
  const files = ['Course.jsx', 'course-frame.mjs', 'course-contract.mjs', 'course-media.mjs', 'render-course.mjs', 'transcript-batch.mjs', 'package-lock.json'].map(name => [name, path.join(owned, name)]).concat([
    ...['src/classroom/whiteboard.mjs', 'pages/inferencia/context-diagram.js', 'pages/inferencia/lesson-visuals.js', ...[400, 700].map(weight => `pages/inferencia/vendor/atkinson-latin-${weight}.woff2`)].map(name => [name, path.join(source, name)])
  ]);
  const hashes = files.map(([name, filename]) => [name, sha256(fs.readFileSync(filename))]);
  hashes.push(['stageEquations', sha256(mathSource)]);
  return {rendererSha256:sha256(JSON.stringify(hashes)), mathSource, sourceHashes:Object.fromEntries(hashes)};
}

export function rendererWebpack(configuration, mathModule) {
  const require = createRequire(import.meta.url);
  return {...configuration, resolve:{...configuration.resolve, alias:{...configuration.resolve?.alias,
    konva:path.join(owned, 'node_modules/konva'), gsap:path.join(owned, 'node_modules/gsap'), 'mathjax-full':path.join(owned, 'node_modules/mathjax-full'),
    '../../pages/inferencia/exercise-tutor.js$':mathModule
  }}, plugins:[...configuration.plugins, new (require('webpack').DefinePlugin)({PACKAGE_VERSION:JSON.stringify(require('mathjax-full/package.json').version)})]};
}

async function worker(options) {
  const batch = fs.realpathSync(options.batch);
  const cataloguePath = path.join(batch, 'catalogue.json');
  const catalogueBytes = fs.readFileSync(cataloguePath);
  const catalogue = JSON.parse(catalogueBytes);
  const catalogueSha256 = sha256(catalogueBytes);
  const renderer = rendererInputs();
  const selection = options.transcript ? loadTranscriptBatch(batch, catalogueBytes, renderer) : undefined;
  const {prepared, pending} = options.transcript ? {prepared:prepareTranscriptInputs(catalogue, selection, options), pending:[]} : prepareBatchInputs(batch, catalogue, options);
  if (!prepared.length) return;
  const require = createRequire(import.meta.url);
  const ffmpegStatic = require('ffmpeg-static');
  const ffmpeg = fs.existsSync(ffmpegStatic) ? ffmpegStatic : '/usr/bin/ffmpeg';
  const ffprobeStatic = require('ffprobe-static').path;
  const ffprobe = fs.existsSync(ffprobeStatic) ? ffprobeStatic : '/usr/bin/ffprobe';
  const {rendererSha256, mathSource, sourceHashes} = renderer;
  const hashRenderer = () => rendererInputs().rendererSha256;
  const outputRoot = path.join(batch, 'videos');
  fs.mkdirSync(outputRoot, {recursive:true});
  const lockPath = path.join(outputRoot, '.remotion.lock');
  try {fs.writeFileSync(lockPath, JSON.stringify({pid:process.pid, started:new Date().toISOString()}), {flag:'wx'});}
  catch {throw new Error(`Batch already locked: ${lockPath}. Inspect the recorded worker before removing an abandoned lock.`);}
  let browser;
  let browserClosed = true;
  let bundleUrl;
  let runtime;
  const cache = path.join(outputRoot, '.remotion-cache', `${rendererSha256.slice(0, 16)}-${process.pid}`);
  const results = [];
  let progress;
  let current;
  try {
    if (selection) {
      progress = readJson(path.join(batch, 'progress.json'));
      assert.deepEqual(Object.keys(progress.items), selection.targetIds, 'Invalid progress selection');
      for (const entry of Object.values(progress.items)) if (entry.state === 'rendering') entry.state = 'pending';
      Object.assign(progress, {state:'running', pid:process.pid, startedAt:new Date().toISOString(), rendererSha256});
      writeProgress(batch, progress);
    }
    for (const {item, storyboard, mp3Path, audioPath} of prepared) {
      current = item.id;
      const transcript = storyboard.narrationMode === 'transcript';
      const timeline = courseTimeline(storyboard);
      const inputHash = sha256(JSON.stringify({version:1, rendererSha256, item, ...(transcript ? {transcript:timeline} : {audio:timeline}), style:catalogue.style}));
      const sourceSnapshot = {catalogueSha256, itemSha256:sha256(JSON.stringify(item)), canonicalSha256:item.canonicalSha256, source:item.source ?? null, provenance:catalogue.provenance ?? null, renderedAnimationSha256:sha256(JSON.stringify(storyboard.animation)),
        ...(transcript ? {transcriptSha256:sha256(JSON.stringify(timeline)), sourceFiles:selection.sourceFiles, sourceInputSha256:selection.sourceInputSha256, sourceCatalogue:selection.sourceCatalogue, sourceRevision:selection.sourceRevision} : {audioMetadataSha256:sha256(JSON.stringify(timeline))}), rendererSources:sourceHashes};
      const started = Date.now();
      const destination = path.join(outputRoot, item.id);
      const metadataPath = path.join(destination, 'metadata.json');
      const video = path.join(destination, 'video.mp4');
      const poster = path.join(destination, 'poster.jpg');
      const frames = sampleFrames(storyboard);
      const verifyInputs = () => {
        assert.equal(sha256(fs.readFileSync(cataloguePath)), catalogueSha256, 'Frozen catalogue changed during render');
        if (transcript) loadTranscriptBatch(batch, fs.readFileSync(cataloguePath), rendererInputs());
        else {
          assert.equal(sha256(fs.readFileSync(mp3Path)), storyboard.audio.mp3Sha256, 'Audio changed during render');
          assert.deepEqual(readJson(audioPath), storyboard.audio, 'Measured timing changed during render');
        }
        assert.equal(hashRenderer(), rendererSha256, 'Renderer changed during render');
      };
      if (progress) {
        progress.current = item.id;
        progress.items[item.id] = {state:'rendering', startedAt:new Date().toISOString()};
        writeProgress(batch, progress);
      }
      let metadata;
      if (fs.existsSync(metadataPath)) {
        metadata = readJson(metadataPath);
        if (transcript) {
          assertTranscriptResume(metadata, {inputHash, rendererSha256, sourceSnapshot});
          assert.deepEqual(readJson(path.join(destination, 'transcript.json')), timeline, 'Stale transcript cue plan');
        } else assertPublishable(metadata);
        assert.equal(metadata.inputHash, inputHash, `${item.id}: stale render; use a new batch or explicitly remove that item's old outputs`);
        assert.equal(metadata.complete, true, 'Incomplete render metadata');
        assert.equal(metadata.rendererSha256, rendererSha256, 'Incompatible renderer');
        assert.deepEqual(metadata.sourceSnapshot, sourceSnapshot, 'Stale source snapshot');
        const verification = verifyMedia({ffmpeg, ffprobe, video, poster, storyboard, frames});
        assert.equal(verification.videoSha256, metadata.videoSha256, 'Corrupt resumed video');
        assert.equal(verification.posterSha256, metadata.posterSha256, 'Corrupt resumed poster');
        console.log(`COURSE_REUSED ${item.id}`);
      } else {
        if (!runtime) {
          runtime = await import('@remotion/renderer');
          const {bundle} = await import('@remotion/bundler');
          const publicDir = path.join(cache, 'public');
          fs.mkdirSync(publicDir, {recursive:true});
          const mathModule = path.join(cache, 'stage-equations.mjs');
          fs.writeFileSync(mathModule, mathSource);
          for (const weight of [400, 700]) fs.copyFileSync(path.join(root, `pages/inferencia/vendor/atkinson-latin-${weight}.woff2`), path.join(publicDir, `atkinson-latin-${weight}.woff2`));
          bundleUrl = await bundle({entryPoint:path.join(owned, 'Course.jsx'), outDir:path.join(cache, 'bundle'), rootDir:owned, publicDir, enableCaching:false, gitSource:null,
            webpackOverride:configuration => rendererWebpack(configuration, mathModule)});
          assert.equal(hashRenderer(), rendererSha256, 'Renderer changed during bundling');
          const ensured = await runtime.ensureBrowser();
          browser = await runtime.openBrowser('chrome', {browserExecutable:ensured.path, logLevel:'error'});
          browserClosed = false;
        }
        const work = path.join(cache, item.id);
        fs.mkdirSync(work, {recursive:true});
        const inputProps = {storyboard};
        const composition = await runtime.selectComposition({serveUrl:bundleUrl, id:'Course', inputProps, puppeteerInstance:browser, logLevel:'error'});
        const layout = [];
        for (const frame of frames) {
          const output = path.join(work, `frame-${frame}.jpg`);
          await runtime.renderStill({serveUrl:bundleUrl, composition:{...composition, props:{...inputProps, audit:true}}, inputProps:{...inputProps, audit:true}, puppeteerInstance:browser, output, frame, imageFormat:'jpeg', logLevel:'error',
            onBrowserLog:log => {if (log.text?.startsWith('REMOTION_COURSE_LAYOUT ')) layout.push(JSON.parse(log.text.slice('REMOTION_COURSE_LAYOUT '.length)));}});
          const evidence = layout.find(entry => entry.frame === frame);
          assert.ok(evidence, `${item.id}/${frame}: no layout evidence`);
          assert.deepEqual(evidence.errors, [], `${item.id}/${frame}: layout errors`);
        }
        if (timeline.scenes.reduce((count, scene) => count + scene.cues.length, 0) > 1) assert.ok(new Set(layout.map(entry => entry.canvasSha256)).size > 1, `${item.id}: static whiteboard pixels`);
        const silent = path.join(work, 'silent.mp4');
        await runtime.renderMedia({serveUrl:bundleUrl, composition, inputProps, puppeteerInstance:browser, outputLocation:silent, codec:'h264', pixelFormat:'yuv420p', crf:20, x264Preset:'fast', concurrency:transcript || catalogue.preview || timeline.preview ? 1 : 2, muted:true, overwrite:true, logLevel:'error'});
        const temporaryVideo = path.join(work, 'video.mp4');
        const temporaryPoster = path.join(work, 'poster.jpg');
        if (transcript) execFileSync(ffmpeg, ['-v', 'error', '-y', '-threads', '1', '-i', silent, '-map', '0:v:0', '-c:v', 'copy', '-an', '-movflags', '+faststart', temporaryVideo]);
        else execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', silent, '-i', mp3Path, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-af', 'apad', '-t', String(storyboard.frames / storyboard.fps), '-movflags', '+faststart', temporaryVideo]);
        const posterFrame = representativeFrame(layout);
        fs.copyFileSync(path.join(work, `frame-${posterFrame}.jpg`), temporaryPoster);
        const verification = verifyMedia({ffmpeg, ffprobe, video:temporaryVideo, poster:temporaryPoster, storyboard, frames});
        verifyInputs();
        metadata = {version:1, complete:true, engine:'remotion', id:item.id, kind:item.kind, title:item.title,
          src:`videos/${item.id}/video.mp4`, poster:`videos/${item.id}/poster.jpg`, duration:storyboard.duration, frames:storyboard.frames,
          fps:storyboard.fps, width:storyboard.width, height:storyboard.height,
          ...(transcript ? {narrationMode:'transcript', cueTiming:'estimated', temporary:true, silent:true, timing:timeline.timing, transcriptSha256:sha256(JSON.stringify(timeline))} : {audioSource:`audio/${item.id}.mp3`, audioSha256:timeline.mp3Sha256, voice:VOICE, model:MODEL, cueTiming:'measured'}),
          videoSha256:verification.videoSha256, posterSha256:verification.posterSha256, canonicalSha256:item.canonicalSha256,
          inputHash, rendererSha256, sourceSnapshot, testFixture:Boolean(catalogue.testFixture || timeline.testFixture),
          ...(catalogue.preview || timeline.preview ? {preview:true, originalId:item.originalId, partialCoverage:item.partialCoverage, provenance:catalogue.provenance ?? timeline.provenance} : {}),
          ...(item.parentLesson ? {parentLesson:item.parentLesson} : {}),
          evidence:{posterFrame, layout, pixels:verification.pixels, streams:verification.streams, elapsedSeconds:(Date.now() - started) / 1000}};
        fs.mkdirSync(destination, {recursive:true});
        fs.copyFileSync(temporaryVideo, video);
        fs.copyFileSync(temporaryPoster, poster);
        if (transcript) atomicJson(path.join(destination, 'transcript.json'), timeline);
        atomicJson(metadataPath, metadata);
        fs.rmSync(work, {recursive:true, force:true});
        console.log(`COURSE_RENDERED ${item.id} ${storyboard.frames} frames ${(Date.now() - started) / 1000}s`);
      }
      verifyInputs();
      if (options.publish) {
        assertPublishable(metadata);
        assert.ok(!metadata.preview, 'Cannot publish partial preview narration');
        assert.ok(!metadata.testFixture, 'Cannot publish fixture narration');
        const publishedAudio = path.join(root, 'static', metadata.audioSource);
        assert.equal(sha256(fs.readFileSync(publishedAudio)), metadata.audioSha256, 'Publish matching audio first');
        const publishDirectory = path.join(root, 'static/videos', item.id);
        fs.mkdirSync(publishDirectory, {recursive:true});
        for (const name of ['video.mp4', 'poster.jpg', 'metadata.json']) fs.copyFileSync(path.join(destination, name), path.join(publishDirectory, name));
        const manifestPath = path.join(root, 'static/videos/manifest.json');
        const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {version:1, lessons:{}};
        assert.equal(manifest.version, 1, 'Unsupported published manifest');
        const {evidence, ...entry} = metadata;
        manifest.lessons[item.id] = entry;
        atomicJson(manifestPath, manifest);
      }
      results.push({id:item.id, inputHash, videoSha256:metadata.videoSha256});
      if (progress) {
        progress.items[item.id] = {state:'complete', inputHash, videoSha256:metadata.videoSha256, frames:metadata.frames, duration:metadata.duration, elapsedSeconds:metadata.evidence.elapsedSeconds, verifiedAt:new Date().toISOString()};
        writeProgress(batch, progress);
      }
    }
    if (progress) {progress.state = Object.values(progress.items).every(item => item.state === 'complete') ? 'complete' : 'paused'; delete progress.current; writeProgress(batch, progress);}
  } catch (error) {
    if (progress) {
      progress.state = 'failed';
      progress.error = error.message;
      if (current) progress.items[current] = {state:'failed', error:error.message};
      writeProgress(batch, progress);
    }
    throw error;
  } finally {
    try {if (browser) {await browser.close({silent:true}); browserClosed = true;}}
    finally {
      fs.rmSync(cache, {recursive:true, force:true});
      fs.rmSync(lockPath, {force:true});
      atomicJson(path.join(outputRoot, 'remotion-run.json'), {version:1, browserClosed, rendererSha256, pending, results});
    }
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log('node /absolute/path/render-course.mjs --batch /absolute/batch [--ready] [--ids id1,id2] [--limit N] [--publish]\n--ready skips pending audio; --ids always requires complete compatible audio. --limit counts ready items.\n--transcript --prepare --source /absolute/catalogue.json freezes the separate silent 538-item batch. --transcript --worker renders/resumes it. --transcript --status reports persistent counts. Transcript drafts cannot --publish or --ready.');
    return;
  }
  if (options.prepare) {
    assert.ok(!path.resolve(options.batch).startsWith(`${root}${path.sep}`), 'Transcript batch must be external to source checkout');
    const selection = prepareTranscriptBatch(options.source, options.batch, rendererInputs());
    console.log(`TRANSCRIPT_PREPARED ${JSON.stringify({total:selection.targetIds.length, counts:selection.counts, catalogueSha256:selection.catalogueSha256})}`);
    return;
  }
  if (options.status) {
    const progress = readJson(path.join(options.batch, 'progress.json'));
    let processAlive = false;
    if (progress.pid) try {process.kill(progress.pid, 0); processAlive = true;} catch {}
    console.log(JSON.stringify({batch:options.batch, ...progress, items:undefined, processAlive}, null, 2));
    return;
  }
  if (options.worker) return worker(options);
  const logs = path.join(owned, '.cache/course-jobs');
  fs.mkdirSync(logs, {recursive:true});
  const logPath = path.join(logs, `${randomUUID()}.log`);
  const log = fs.openSync(logPath, 'wx');
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2), '--worker'], {detached:true, stdio:['ignore', log, log]});
  fs.closeSync(log);
  console.log(`COURSE_WORKER ${JSON.stringify({pid:child.pid, log:logPath})}`);
  const code = await new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', status => resolve(status ?? 1));});
  console.log(fs.readFileSync(logPath, 'utf8'));
  process.exitCode = code;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {console.error(error); process.exitCode = 1;});