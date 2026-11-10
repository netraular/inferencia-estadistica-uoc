import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import {createStoryboard, VIDEO_ID, trays} from '../data-src/course-videos/storyboard.mjs';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import * as solutions from '../pages/inferencia/exercise-solutions.js';
import {createLessonAnimation} from '../pages/inferencia/animations.js';
import {generateExercise} from '../pages/inferencia/exercises.js';
import {enrichGlobalAnimation} from '../pages/inferencia/lesson-visuals.js';

const root = new URL('../', import.meta.url);
const recording = {
  title: 'Comparar semillas, no solo recuentos', parentLesson: 'proporciones',
  src: `audio/${VIDEO_ID}.mp3`, duration: 45.4, cueTiming: 'measured',
  scenes: [{start: 0, end: 45.4, cues: [
    [0, 3.5, 'En una bandeja germinan dieciocho semillas y en otra treinta.'],
    [3.8, 5.4, '¿Cuál ha germinado mejor?'],
    [5.7, 7.6, 'Todavía no podemos contestar.'],
    [7.9, 10.1, 'En la primera sembramos setenta y dos.'],
    [10.4, 15.5, 'La parte son las dieciocho germinadas; el total son todas las sembradas en esa misma bandeja.'],
    [15.8, 18.6, 'Una proporción divide la parte entre su propio total.'],
    [18.9, 21.4, 'Aquí dividimos dieciocho entre setenta y dos.'],
    [21.7, 23.9, 'El cociente es cero coma veinticinco.'],
    [24.2, 27.6, 'Esa proporción representa una de cada cuatro semillas.'],
    [27.9, 30.4, 'En la segunda bandeja sembramos doscientas.'],
    [30.7, 33.2, 'Treinta entre doscientas da cero coma quince.'],
    [33.5, 36.3, 'Hay más germinaciones, pero una proporción menor.'],
    [36.6, 39.4, 'No hemos supuesto que las semillas sean independientes.'],
    [39.7, 45.4, 'Estamos describiendo las dos bandejas observadas, no ajustando todavía un modelo de germinación.'],
  ].map(([start, end, text]) => ({start, end, text}))}],
};
const require = createRequire(import.meta.url);

function generatedMedia(animation) {
  let offset = 0;
  const scenes = animation.steps.map(step => {
    const start = offset;
    offset += step.duration;
    return {start, end:offset, cues:(step.cues || [{text:step.caption, start:0, end:step.duration}]).map(cue => ({...cue, start:start+cue.start, end:start+cue.end}))};
  });
  const track = {src:`audio/${animation.id}.mp3`, duration:offset, cueTiming:'measured', scenes, voice:'Puck', model:'gemini-3.8-flash-tts', audioSha256:'a'.repeat(64), canonicalSha256:'b'.repeat(64)};
  return {track, video:{engine:'remotion', title:animation.title, src:`videos/${animation.id}/video.mp4`, poster:`videos/${animation.id}/poster.jpg`, audioSource:track.src, audioSha256:track.audioSha256, canonicalSha256:track.canonicalSha256, voice:track.voice, model:track.model, duration:offset, frames:Math.ceil(offset*30), fps:30, width:1280, height:720}};
}

function loadComponent(path, mocks) {
  const compiled = require('@babel/core').transformSync(readFileSync(new URL(path, root), 'utf8'), {
    filename:path, babelrc:false, configFile:false,
    presets:[require.resolve('@docusaurus/core/lib/babel/preset')],
    plugins:[require.resolve('@babel/plugin-transform-dynamic-import'), require.resolve('@babel/plugin-transform-modules-commonjs')],
  }).code;
  const module = {exports:{}};
  runInNewContext(compiled, {module, exports:module.exports, globalThis, document:globalThis.document, window:globalThis.window, require:name => name in mocks ? mocks[name] : require(name)});
  return module.exports.default;
}

async function withReactDom(action) {
  const React = require('react');
  const {document, window} = parseHTML('<html><body><main></main></body></html>');
  const previous = {window:globalThis.window, document:globalThis.document, jStat:globalThis.jStat, IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis, {window, document, IS_REACT_ACT_ENVIRONMENT:true});
  const createElement = document.createElement.bind(document);
  const stopped = [];
  document.createElement = (tag, ...options) => {
    const element = createElement(tag, ...options);
    if (tag === 'video') {
      element.pause = () => stopped.push(element);
      element.load = () => {};
    }
    return element;
  };
  const container = document.querySelector('main');
  const renderer = require('react-dom/client').createRoot(container);
  try {await action({React, document, window, container, renderer, stopped});}
  finally {
    await React.act(async () => renderer.unmount());
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
}

test('native compatibility rejects missing, stale, malformed and conflicting media metadata', () => {
  const original = createLessonSections(COURSE.units[0].lessons[0])[0].animation;
  const changes = [
    ['missing track', media => {media.track = undefined;}],
    ['missing video', media => {media.video = undefined;}],
    ['old engine', media => {media.video.engine = 'canvas';}],
    ['old voice', media => {media.video.voice = 'Kore';}],
    ['old model', media => {media.video.model = 'old-model';}],
    ['missing voice', media => {delete media.video.voice;}],
    ['different audio', media => {media.video.audioSource = 'audio/other.mp3';}],
    ['different recording', media => {media.track.src = 'audio/other.mp3';}],
    ['audio hash', media => {media.track.audioSha256 = 'c'.repeat(64);}],
    ['alias audio hash', media => {media.track.sha256 = 'c'.repeat(64);}],
    ['canonical hash', media => {media.track.canonicalSha256 = 'c'.repeat(64);}],
    ['recorded voice', media => {media.track.voice = 'Kore';}],
    ['recorded model', media => {media.track.model = 'old-model';}],
    ['unmeasured', media => {media.track.cueTiming = 'estimated';}],
    ['empty scenes', media => {media.track.scenes = [];}],
    ['missing scenes', media => {delete media.track.scenes;}],
    ['null scene', media => {media.track.scenes[0] = null;}],
    ['empty cues', media => {media.track.scenes[0].cues = [];}],
    ['null cue', media => {media.track.scenes[0].cues[0] = null;}],
    ['revised cues', media => {media.animation.steps[0].cues[0].text += ' Revised.';}],
    ['revised caption', media => {media.animation.steps[0].caption += ' Revised.';}],
    ['scene bounds', media => {media.track.scenes[0].start = -1;}],
    ['cue bounds', media => {media.track.scenes[0].cues[0].end = media.track.duration+1;}],
    ['missing duration', media => {delete media.track.duration;}],
    ['unsafe path', media => {media.video.src = '../videos/other.mp4';}],
    ['wrong poster', media => {media.video.poster = 'videos/other/poster.jpg';}],
    ['wrong duration', media => {media.video.duration += 10;}],
    ['wrong frames', media => {media.video.frames += 300;}],
  ];
  for (const [label, change] of changes) {
    const media = {...generatedMedia(original), animation:structuredClone(original)};
    change(media);
    assert.equal(solutions.compatibleCourseVideo(media.animation, media.track, media.video), false, label);
  }
  const {track, video} = generatedMedia(original);
  for (const key of ['voice', 'model', 'audioSha256', 'canonicalSha256']) delete track[key];
  assert.equal(solutions.compatibleCourseVideo(original, track, video), true, 'optional recording metadata');
  assert.equal(solutions.compatibleCourseVideo({...original, steps:[]}, track, video), false);
});

test('native lesson source failures dispose playback and a different media identity recovers', () => withReactDom(async ({React, container, renderer, window, stopped}) => {
  let baseUrl = '/inferencia/';
  const animation = createLessonSections(COURSE.units[0].lessons[0])[0].animation;
  const {track, video} = generatedMedia(animation);
  const audio = {lessons:{[animation.id]:track}};
  const videos = {lessons:{[animation.id]:video}};
  const LessonVideo = loadComponent('src/components/LessonVideo.jsx', {
    '@docusaurus/useBaseUrl':() => baseUrl,
    '../../static/videos/manifest.json':videos,
    '../../static/audio/manifest.json':audio,
    '../../pages/inferencia/exercise-solutions.js':solutions,
    './LessonVideo.module.css':{},
  });
  const render = async selected => React.act(async () => renderer.render(React.createElement(React.StrictMode, null, React.createElement(LessonVideo, {animation:selected, fallback:React.createElement('p', {'data-fallback':true}, 'Fallback')}))));
  await render(animation);
  const failed = container.querySelector('video');
  const source = failed.querySelector('source');
  assert.equal(source.getAttribute('src'), `/inferencia/videos/${animation.id}/video.mp4`, 'Strict Mode effect re-entry retains the source');
  await React.act(async () => source.dispatchEvent(new window.Event('error')));
  assert.ok(container.querySelector('[data-fallback]'));
  assert.equal(container.querySelector('video'), null);
  assert.ok(stopped.includes(failed));
  assert.equal(source.hasAttribute('src'), false);
  await render({...animation});
  assert.ok(container.querySelector('[data-fallback]'), 'same failed identity does not retry');
  video.audioSha256 = track.audioSha256 = 'd'.repeat(64);
  await render(animation);
  assert.ok(container.querySelector('video'), 'replacement media recovers at the same ID');
  const beforeBaseChange = container.querySelector('video');
  baseUrl = '/';
  await render(animation);
  assert.ok(stopped.includes(beforeBaseChange));
  assert.equal(container.querySelector('source').getAttribute('src'), `/videos/${animation.id}/video.mp4`);
  const changed = structuredClone(animation);
  changed.steps[0].cues[0].text += ' Revised.';
  await render(changed);
  assert.ok(container.querySelector('[data-fallback]'));
  assert.equal(container.querySelector('video'), null);
}));

test('InteractiveLesson selects the active recap and falls back without retrying section videos', () => withReactDom(async ({React, container, renderer, document, window}) => {
  globalThis.jStat = require('jstat').jStat;
  const lessons = COURSE.units.flatMap(unit => unit.lessons).slice(0, 2);
  const recaps = lessons.map(lesson => enrichGlobalAnimation(createLessonAnimation(lesson, generateExercise, () => [])));
  const audio = {lessons:{}};
  const videos = {lessons:{}};
  for (const animation of recaps) {
    const {track, video} = generatedMedia(animation);
    audio.lessons[animation.id] = track;
    videos.lessons[animation.id] = video;
  }
  let mounted = 0, disposed = 0;
  const mocks = {
    '@docusaurus/useBaseUrl':() => '/inferencia/',
    '../../static/videos/manifest.json':videos,
    '../../static/audio/manifest.json':audio,
    '../../pages/inferencia/exercise-solutions.js':solutions,
    './LessonVideo.module.css':{},
    '../generated/aula-shell.json':{},
    '../../pages/inferencia/course.js':{COURSE},
    '../../pages/inferencia/animations.js':{createLessonAnimation},
    '../../pages/inferencia/exercises.js':{generateExercise},
    '../../pages/inferencia/lesson-visuals.js':{enrichGlobalAnimation},
    '../../pages/inferencia/app.js':{readParagraphs:html => {
      const element = document.createElement('div');element.innerHTML = html;
      return Array.from(element.querySelectorAll('p'), paragraph => paragraph.textContent);
    }},
    '../classroom/embed.mjs':{mountEmbeddedClassroom:() => {mounted++;return {dispose:() => disposed++};}},
    '../classroom/whiteboard.mjs':{createWhiteboard:() => {}},
    '../../pages/inferencia/vendor/lucide.min.js':{},
  };
  mocks['./LessonVideo'] = loadComponent('src/components/LessonVideo.jsx', mocks);
  const InteractiveLesson = loadComponent('src/components/InteractiveLesson.jsx', mocks);
  const render = async (lessonId, animation) => React.act(async () => renderer.render(React.createElement(InteractiveLesson, {lessonId, view:'animation', animation})));
  await render(lessons[0].id);
  assert.equal(container.querySelector('source').getAttribute('src'), `/inferencia/videos/${recaps[0].id}/video.mp4`);
  assert.equal(mounted, 0, 'native recaps do not mount animation clocks');
  await React.act(async () => container.querySelector('video').dispatchEvent(new window.Event('error')));
  assert.equal(container.querySelector('video'), null);
  assert.ok(container.querySelector('.course-activities'));
  assert.equal(mounted, 1);
  await render(lessons[1].id);
  assert.equal(disposed, 1);
  assert.equal(container.querySelector('source').getAttribute('src'), `/inferencia/videos/${recaps[1].id}/video.mp4`);
  delete audio.lessons[recaps[1].id];
  await render(lessons[1].id);
  assert.equal(container.querySelector('video'), null);
  assert.equal(mounted, 2, 'empty audio manifests select the animated fallback');
  const section = createLessonSections(lessons[0])[0].animation;
  const media = generatedMedia(section);
  audio.lessons[section.id] = media.track;videos.lessons[section.id] = media.video;
  await render(lessons[0].id, section);
  assert.equal(container.querySelector('video'), null, 'the section wrapper alone owns native selection');
  assert.equal(mounted, 3);
}));

test('all 36 global recaps and representative sections accept only their own generated Puck media', () => {
  const previous = globalThis.jStat;
  globalThis.jStat = require('jstat').jStat;
  try {
    const lessons = COURSE.units.flatMap(unit => unit.lessons);
    assert.equal(lessons.length, 36);
    for (const lesson of lessons) {
      const animations = [enrichGlobalAnimation(createLessonAnimation(lesson, generateExercise, () => [])), createLessonSections(lesson)[0].animation];
      for (const animation of animations) {
        const {track, video} = generatedMedia(animation);
        assert.equal(solutions.compatibleCourseVideo(animation, track, video), true, animation.id);
        assert.equal(solutions.compatibleCourseVideo({...animation, id:`${animation.id}-other`}, track, video), false);
      }
    }
    const source = readFileSync(new URL('src/components/InteractiveLesson.jsx', root), 'utf8');
    assert.doesNotThrow(() => require('@babel/core').transformSync(source, {
      filename:'InteractiveLesson.jsx', babelrc:false, configFile:false,
      presets:[require.resolve('@docusaurus/core/lib/babel/preset')],
    }));
    assert.match(source, /props\.view === 'animation' && !props\.animation/);
    assert.match(source, /<LessonVideo animation=\{recap\.animation\} fallback=\{fallback\}/);
  } finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
});

test('the first Remotion storyboard uses measured cues and correct proportions', () => {
  const track = recording;
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

test('lesson videos use base-aware native playback and preserve fallback for other sections', () => {
  const audio = {version: 1, lessons: {[VIDEO_ID]: recording}};
  const videos = {lessons: {[VIDEO_ID]: {
    engine: 'remotion', title: recording.title, src: `videos/${VIDEO_ID}/video.mp4`, poster: `videos/${VIDEO_ID}/poster.jpg`,
    audioSource: recording.src, audioSha256: 'a'.repeat(64), voice: 'Puck', model: 'gemini-3.8-flash-tts',
    duration: recording.duration, frames: 1362, fps: 30, width: 1280, height: 720,
  }}};
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
    '../../static/videos/manifest.json': videos,
    '../../static/audio/manifest.json': audio,
    '../../pages/inferencia/exercise-solutions.js': solutions,
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
  delete audio.lessons[VIDEO_ID];
  assert.match(render(VIDEO_ID, recording.scenes), /data-fallback/);
  const player = readFileSync(new URL('src/components/LessonSectionPlayer.jsx', root), 'utf8');
  assert.match(player, /<LessonVideo animation=\{section.animation\} fallback=\{<InteractiveLesson/);
});