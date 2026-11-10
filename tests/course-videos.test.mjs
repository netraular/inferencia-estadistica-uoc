import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import {createStoryboard, VIDEO_ID, trays} from '../data-src/course-videos/storyboard.mjs';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';

const root = new URL('../', import.meta.url);
const audio = JSON.parse(readFileSync(new URL('static/audio/manifest.json', root)));
const require = createRequire(import.meta.url);

test('the first Remotion storyboard uses measured cues and correct proportions', () => {
  const track = audio.lessons[VIDEO_ID];
  const storyboard = createStoryboard(track);
  assert.equal(storyboard.frames, 1362);
  assert.equal(storyboard.duration, 45.4);
  assert.deepEqual(storyboard.cues, track.scenes.flatMap(scene => scene.cues));
  assert.equal(storyboard.events.firstTotal, 7.9);
  assert.equal(storyboard.events.secondTotal, 27.9);
  assert.equal(storyboard.events.comparison, 33.5);
  assert.deepEqual(trays.map(tray => tray.germinated / tray.total), [0.25, 0.15]);
  assert.ok(trays[0].germinated < trays[1].germinated);
  assert.ok(trays[0].germinated / trays[0].total > trays[1].germinated / trays[1].total);
  assert.throws(() => createStoryboard({...track, cueTiming: 'estimated'}));
});

test('comparison routes and published examples have been retired', () => {
  for (const path of ['src/pages/comparativa-videos', 'static/comparativa-videos', 'data-src/video-comparison', 'experiments/manim-proporciones']) {
    assert.equal(existsSync(new URL(path, root)), false, path);
  }
  assert.doesNotMatch(readFileSync(new URL('docusaurus.config.js', root), 'utf8'), /comparativa-videos/);
});

test('published Remotion media matches the measured narration and recorded hashes', () => {
  const videos = JSON.parse(readFileSync(new URL('static/videos/manifest.json', root)));
  assert.deepEqual(Object.keys(videos.lessons), [VIDEO_ID]);
  const video = videos.lessons[VIDEO_ID];
  assert.equal(video.engine, 'remotion');
  assert.equal(video.duration, audio.lessons[VIDEO_ID].duration);
  assert.equal(video.frames, 1362);
  assert.equal(video.fps, 30);
  for (const [file, hash] of [[video.src, video.videoSha256], [video.poster, video.posterSha256], [video.audioSource, video.audioSha256]]) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(`static/${file}`, root))).digest('hex'), hash);
  }
});

test('lesson videos use base-aware native playback and preserve fallback for other sections', () => {
  const React = require('react');
  const {renderToStaticMarkup} = require('react-dom/server');
  const source = readFileSync(new URL('src/components/LessonVideo.jsx', root), 'utf8');
  const compiled = require('@babel/core').transformSync(source, {
    filename: 'LessonVideo.jsx', babelrc: false, configFile: false,
    presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  }).code;
  const module = {exports: {}};
  const mocks = {
    '@docusaurus/useBaseUrl': () => '/inferencia/',
    '../../static/videos/manifest.json': JSON.parse(readFileSync(new URL('static/videos/manifest.json', root))),
    '../../static/audio/manifest.json': audio,
    './LessonVideo.module.css': {lesson: 'lesson', player: 'player', transcript: 'transcript'},
  };
  runInNewContext(compiled, {module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name)});
  const fallback = React.createElement('div', {'data-fallback': true}, 'Original animation');
  const render = (id, steps = audio.lessons[id]?.scenes.map(scene => ({cues:scene.cues}))) => renderToStaticMarkup(React.createElement(module.exports.default, {animation: {id, steps}, fallback}));
  const {document} = parseHTML(render(VIDEO_ID));
  const video = document.querySelector('video');
  assert.ok(video.hasAttribute('controls'));
  assert.ok(video.getAttributeNames().some(name => name.toLowerCase() === 'playsinline'));
  assert.equal(video.hasAttribute('autoplay'), false);
  assert.equal(video.querySelector('source').getAttribute('src'), `/inferencia/videos/${VIDEO_ID}/video.mp4`);
  assert.equal(video.getAttribute('poster'), `/inferencia/videos/${VIDEO_ID}/poster.jpg`);
  assert.equal(document.querySelector('details').hasAttribute('open'), false);
  assert.equal(document.querySelector('summary').textContent, 'Transcripci\u00f3n');
  assert.equal(document.querySelectorAll('details p').length, 14);
  assert.equal(document.querySelector('[data-fallback]'), null);
  assert.match(render('proporciones--porcentaje-y-exposicion'), /data-fallback/);
  assert.match(render('sin-grabacion'), /data-fallback/);
  assert.match(render(VIDEO_ID, []), /data-fallback/);
  const revised = createLessonSections(COURSE.units[0].lessons[0])[0].animation;
  assert.match(render(VIDEO_ID, revised.steps), /data-fallback/);
  const changed = structuredClone(audio.lessons[VIDEO_ID].scenes);
  changed[0].cues[0].text = 'Esta frase se ha revisado sin cambiar el identificador.';
  assert.match(render(VIDEO_ID, changed), /data-fallback/);
  const player = readFileSync(new URL('src/components/LessonSectionPlayer.jsx', root), 'utf8');
  assert.match(player, /<LessonVideo animation=\{section.animation\} fallback=\{<InteractiveLesson/);
});