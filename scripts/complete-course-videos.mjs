import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compatibleCourseVideo} from '../pages/inferencia/exercise-solutions.js';
import {sha256} from '../data-src/course-videos/course-contract.mjs';
import {validateFrozenCatalogue, writeJson} from '../data-src/course-videos/transcript-batch.mjs';
import {publishCompleted} from './publish-course-videos.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const json = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));

export function remainingVideoIds(items, lessons, audio, assetsReady = () => true) {
  return items.filter(item => {
    const video = lessons[item.id];
    return !video || video.canonicalSha256 !== item.canonicalSha256 || !compatibleCourseVideo(item.animation, audio[item.id], video) || !assetsReady(video);
  }).map(item => item.id);
}

export function parseOptions(args) {
  const options = {previous:[]};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index+1];
    assert.ok(['--batch', '--previous'].includes(flag) && value && path.isAbsolute(value), 'Usage: complete-course-videos.mjs --batch /new/batch [--previous /completed/batch]');
    if (flag === '--previous') options.previous.push(fs.realpathSync(value));
    else {
      assert.ok(!options.batch, 'Duplicate --batch');
      options.batch = fs.realpathSync(value);
    }
  }
  assert.ok(options.batch, 'Missing --batch');
  assert.equal(new Set([options.batch, ...options.previous]).size, options.previous.length+1, 'Duplicate batch');
  return options;
}

export function pushPublication(root, published, total, {check = () => execFileSync(process.execPath, ['--test', 'tests/course-videos.test.mjs', 'tests/pdf-exercises.test.mjs'], {cwd:root, stdio:'inherit'})} = {}) {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], {encoding:'utf8', stdio:['ignore', 'pipe', 'pipe']}).trimEnd();
  const branch = git('symbolic-ref', '--short', 'HEAD');
  assert.ok(branch !== 'main' && branch !== 'master', 'Publication requires a task branch');
  const dirty = git('status', '--porcelain', '--untracked-files=all');
  assert.ok(!dirty || dirty.split('\n').every(line => line.slice(3).startsWith('static/videos/')), 'Unrelated worktree changes: publication stopped');
  const staged = git('diff', '--cached', '--name-only');
  assert.ok(!staged || staged.split('\n').every(filename => filename.startsWith('static/videos/')), 'Unrelated staged changes: publication stopped');
  git('diff', '--check');
  if (dirty) {
    check();
    git('add', '--', 'static/videos');
    git('-c', 'user.name=raular250', '-c', 'user.email=raular250@gmail.com', 'commit', '-m', `feat(videos): publish ${published} of ${total} course videos`);
  }
  git('fetch', 'origin', 'main');
  git('merge-base', '--is-ancestor', 'origin/main', 'HEAD');
  git('push', '--atomic', 'origin', `HEAD:refs/heads/${branch}`, 'HEAD:refs/heads/main');
  return git('rev-parse', 'HEAD');
}

export async function completeCourseVideos({batch, previous = [], root = ROOT}) {
  const catalogue = validateFrozenCatalogue(json(path.join(batch, 'catalogue.json')));
  assert.equal(catalogue.items.length, 541, 'Expected the complete course');
  const batches = [...previous, batch];
  for (const source of previous) assert.deepEqual(json(path.join(source, 'catalogue.json')), catalogue, 'Cannot combine different frozen catalogues');
  const statusPath = path.join(batch, 'publication-progress.json');
  const status = {version:1, pid:process.pid, startedAt:new Date().toISOString(), state:'starting', total:catalogue.items.length, batches};
  const saveStatus = () => writeJson(statusPath, {...status, updatedAt:new Date().toISOString()});
  const coverage = () => {
    const manifest = json(path.join(root, 'static/videos/manifest.json'));
    const audio = json(path.join(root, 'static/audio/manifest.json'));
    const missing = remainingVideoIds(catalogue.items, manifest.lessons, audio.lessons, video => [video.src, video.poster].every(src => fs.existsSync(path.join(root, 'static', src))));
    return {manifest, missing, published:catalogue.items.length-missing.length};
  };
  let lastCompleted = -1;
  const publish = async () => {
    const completed = batches.reduce((count, source) => count+json(path.join(source, 'progress.json')).counts.complete, 0);
    if (completed === lastCompleted) return;
    for (const source of batches) await publishCompleted({batch:source, root});
    const current = coverage();
    status.revision = pushPublication(root, current.published, catalogue.items.length);
    status.published = current.published;
    status.remaining = current.missing.length;
    delete status.publicationError;
    lastCompleted = completed;
    saveStatus();
    console.log(`COURSE_VIDEO_MAIN ${JSON.stringify(status)}`);
  };
  let renderer;
  let publication = Promise.resolve();
  let publicationError;
  let requested = false;
  let busy = false;
  const watchers = [];
  const schedule = () => {
    requested = true;
    if (busy) return;
    busy = true;
    publication = (async () => {
      try {
        while (requested) {
          requested = false;
          try {await publish(); publicationError = undefined;}
          catch (error) {
            publicationError = error;
            status.publicationError = error.message;
            saveStatus();
            console.error('COURSE_VIDEO_PUBLICATION_BLOCKED', error);
          }
        }
      } finally {busy = false;}
    })();
  };
  saveStatus();
  try {
    await publish();
    const {missing} = coverage();
    if (missing.length) {
      status.state = 'rendering';
      saveStatus();
      for (const source of batches) watchers.push(fs.watch(source, (_event, filename) => {
        if (String(filename) === 'progress.json') schedule();
      }));
      renderer = spawn(process.execPath, [path.join(root, 'data-src/course-videos/render-course.mjs'), '--native', '--transcript', '--continue-on-error', '--batch', batch, '--ids', missing.join(','), '--worker'], {cwd:root, stdio:'inherit'});
      const result = await new Promise((resolve, reject) => {
        renderer.once('error', reject);
        renderer.once('exit', (code, signal) => resolve({code, signal}));
      });
      status.renderer = result;
      for (const watcher of watchers) watcher.close();
      schedule();
      await publication;
      if (publicationError) throw publicationError;
      assert.equal(result.code, 0, `Renderer failed: ${JSON.stringify(result)}`);
    }
    const current = coverage();
    assert.deepEqual(current.missing, [], 'The complete course has not been published');
    for (const item of catalogue.items) {
      const entry = current.manifest.lessons[item.id];
      for (const [src, hash] of [[entry.src, entry.videoSha256], [entry.poster, entry.posterSha256]]) assert.equal(sha256(fs.readFileSync(path.join(root, 'static', src))), hash, `${item.id}: published asset changed`);
    }
    status.state = 'complete';
    saveStatus();
    console.log(`COURSE_VIDEO_COMPLETE ${JSON.stringify(status)}`);
    return status;
  } catch (error) {
    status.state = 'failed';
    status.error = error.message;
    status.failedItems = Object.entries(json(path.join(batch, 'progress.json')).items).filter(([,item]) => item.state === 'failed').map(([id,item]) => ({id, error:item.error}));
    saveStatus();
    throw error;
  } finally {
    for (const watcher of watchers) watcher.close();
    if (renderer && renderer.exitCode === null && renderer.signalCode === null) renderer.kill('SIGTERM');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) completeCourseVideos(parseOptions(process.argv.slice(2))).catch(error => {console.error(error); process.exitCode = 1;});