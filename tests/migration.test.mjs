import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import {COURSE} from '../pages/inferencia/course.js';
import {mountEmbeddedClassroom, renderScopedIcons} from '../src/classroom/embed.mjs';
import {STORAGE_KEY, PROGRESS_EVENT, freshProgress, loadProgress, saveProgress, progressSummary} from '../pages/inferencia/progress.js';

const require = createRequire(import.meta.url);
globalThis.jStat = require('jstat').jStat;
const shell = readFileSync(new URL('../pages/inferencia-estadistica.html', import.meta.url), 'utf8');
const lessons = COURSE.units.flatMap(unit => unit.lessons);

test('Lucide renders controls inside the shadow root without touching document icons', () => {
  const {document} = parseHTML('<html><body><i data-lucide="play" id="outside"></i><div id="host"></div></body></html>');
  const root = document.getElementById('host').attachShadow({mode:'open'});
  root.innerHTML = '<button aria-label="Reproducir"><i data-lucide="play" aria-hidden="true"></i></button><button aria-label="Reiniciar"><i data-lucide="rotate-ccw" aria-hidden="true"></i></button>';
  const previous = globalThis.document;
  globalThis.document = document;
  try {
    renderScopedIcons(root, require('../pages/inferencia/vendor/lucide.min.js'));
    assert.equal(root.querySelectorAll('i[data-lucide]').length, 0);
    assert.equal(root.querySelectorAll('svg.lucide').length, 2);
    assert.equal(root.querySelector('svg').getAttribute('aria-hidden'), 'true');
    assert.ok(root.querySelector('svg').childNodes.length > 0);
    assert.equal(document.getElementById('outside').tagName, 'I');
    renderScopedIcons(root, require('../pages/inferencia/vendor/lucide.min.js'));
    assert.equal(root.querySelectorAll('svg.lucide').length, 2);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test('production Babel compilation preserves every HTML paragraph instead of a NodeList with undefined text', () => {
  const babel = require('@babel/core');
  const source = readFileSync(new URL('../pages/inferencia/app.js', import.meta.url), 'utf8');
  const ast = babel.parseSync(source, {sourceType:'module', babelrc:false, configFile:false});
  const declaration = ast.program.body.find(node => node.type === 'ExportNamedDeclaration' && node.declaration?.id?.name === 'readParagraphs');
  assert.ok(declaration);
  ast.program.body = [declaration.declaration];
  const compiled = babel.transformFromAstSync(ast, source, {
    filename:'app.js',
    babelrc:false,
    configFile:false,
    presets:[require.resolve('@docusaurus/core/lib/babel/preset')]
  }).code;
  const {document} = parseHTML('<html><body></body></html>');
  const browserDocument = {createElement(tag) {
    const node = document.createElement(tag);
    return {
      set innerHTML(html) {node.innerHTML = html;},
      querySelectorAll(selector) {
        const nodes = node.querySelectorAll(selector);
        const list = {length:nodes.length, [Symbol.iterator]:() => nodes[Symbol.iterator]()};
        for (let index = 0; index < nodes.length; index++) list[index] = nodes[index];
        return list;
      }
    };
  }};
  for (const lesson of lessons) for (const section of [...lesson.sections, lesson.example]) {
    const content = document.createElement('div');
    content.innerHTML = section.body;
    const expected = Array.from(content.querySelectorAll('p'), paragraph => paragraph.textContent);
    const actual = runInNewContext(`${compiled}; readParagraphs(document, html)`, {document:browserDocument, html:section.body});
    assert.deepEqual(Array.from(actual), expected, lesson.id);
    assert.ok(actual.every(text => typeof text === 'string' && text.length > 0), lesson.id);
  }
});

test('36 MDX pages preserve theory, formulas, method, solved examples and interactive lesson IDs', () => {
  for (const unit of COURSE.units) for (const lesson of unit.lessons) {
    const text = readFileSync(new URL(`../docs/${unit.id}/${lesson.id}.mdx`, import.meta.url), 'utf8');
    for (const section of lesson.sections) assert.ok(text.includes(section.body), lesson.id);
    for (const step of lesson.method) assert.ok(text.includes(step), lesson.id);
    for (const formula of lesson.formulas) assert.ok(text.includes(JSON.stringify(formula.tex)), lesson.id);
    assert.ok(text.includes(`<LessonContent lessonId="${lesson.id}">`), lesson.id);
    assert.ok(text.indexOf('<LessonContent ') < text.indexOf('## Al terminar esta leccion'), lesson.id);
    assert.ok(text.trimEnd().endsWith('</LessonContent>'), lesson.id);
    assert.equal(text.includes('<InteractiveLesson '),Boolean(lesson.illustration),lesson.id);
    if (lesson.illustration) {
      assert.ok(text.includes(`<InteractiveLesson lessonId="${lesson.id}" view="figure" />`),lesson.id);
      assert.ok(text.includes(`## ${lesson.illustration.title}`),lesson.id);
      assert.ok(text.indexOf('view="figure"')<text.indexOf('## Palabras y símbolos'),lesson.id);
    }
    assert.ok(text.includes('Ejemplo resuelto con el metodo'), lesson.id);
  }
  assert.equal(lessons.length, 36);
});

test('embedded classroom keeps routing and titles isolated and retains progress and exercise grading', () => {
  const {document, window} = parseHTML('<html><head><title>Docusaurus lesson</title></head><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  window.HTMLElement.prototype.focus = () => {};
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable:true,
    get() {return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
    set(value) {for (const option of this.querySelectorAll('option')) {if (option.value === String(value)) option.setAttribute('selected', ''); else option.removeAttribute('selected');}}
  });
  window.matchMedia = () => ({matches:false});
  window.katex = require('katex');
  window.lucide = {createIcons() {}};
  const previous = freshProgress(COURSE);
  previous.studied = ['sucesos'];
  const values = new Map([[STORAGE_KEY, JSON.stringify(previous)]]);
  const storage = {getItem: key => values.get(key), setItem: (key, value) => values.set(key, value)};
  const mounted = mountEmbeddedClassroom(document.getElementById('host'), {shell, baseUrl:'/inferencia/', lessonId:'bayes-diagnostico', storage});
  try {
    assert.equal(document.title, 'Docusaurus lesson');
    assert.equal(document.getElementById('courseNav'), null);
    assert.deepEqual(mounted.aula.progress.studied, ['sucesos']);
    mounted.root.getElementById('glossaryToggle').dispatchEvent(new window.Event('click', {bubbles:true}));
    const dialog = mounted.root.getElementById('utilityDialog');
    assert.equal(dialog.hasAttribute('open'), true);
    mounted.root.getElementById('dialogContent').dispatchEvent(new window.Event('click', {bubbles:true}));
    assert.equal(dialog.hasAttribute('open'), true);
    dialog.dispatchEvent(new window.Event('click', {bubbles:true}));
    assert.equal(dialog.hasAttribute('open'), false);
    for (const view of ['theory', 'lab', 'practice', 'animation']) {
      assert.equal(mounted.aula.setView(view), true);
      assert.equal(mounted.root.getElementById(`panel-${view}`).hidden, false);
    }
    mounted.aula.setView('practice');
    const question = mounted.aula.exercise.questions[0];
    mounted.root.getElementById(`answer-${question.id}`).value = String(question.answer);
    mounted.root.querySelector(`[data-grade-form="${question.id}"]`).dispatchEvent(new window.Event('submit', {bubbles:true, cancelable:true}));
    assert.ok(mounted.root.getElementById(`feedback-${question.id}`).classList.contains('correct'));
    const updated = JSON.parse(values.get(STORAGE_KEY));
    updated.studied.push('bayes-diagnostico');
    saveProgress(storage, updated);
    window.dispatchEvent(new window.Event(PROGRESS_EVENT));
    assert.ok(mounted.aula.progress.studied.includes('bayes-diagnostico'));
    mounted.root.querySelector(`[data-grade-form="${question.id}"]`).dispatchEvent(new window.Event('submit', {bubbles:true, cancelable:true}));
    assert.ok(JSON.parse(values.get(STORAGE_KEY)).studied.includes('bayes-diagnostico'));
    assert.equal(document.title, 'Docusaurus lesson');
    assert.equal(JSON.parse(values.get(STORAGE_KEY)).lastLesson, 'bayes-diagnostico');
  } finally {mounted.dispose();}
  assert.equal(document.getElementById('host').shadowRoot.childNodes.length, 0);
  for (const view of ['theory', 'lab', 'practice', 'animation']) {
    const selected = mountEmbeddedClassroom(document.getElementById('host'), {shell, baseUrl:'/inferencia/', lessonId:'bayes-diagnostico', storage, view, showNavigation:false});
    try {
      assert.equal(selected.root.getElementById(`panel-${view}`).hidden, false, view);
      assert.equal(selected.root.getElementById('lessonTabs').style.display, 'none');
      assert.equal(document.title, 'Docusaurus lesson');
    } finally {selected.dispose();}
  }
});

test('embedded whiteboard follows seeking and resizing and is disposed with its player', () => {
  const {document, window} = parseHTML('<html><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  window.matchMedia = () => ({matches:false});
  window.katex = require('katex');
  const frames = [];
  const sizes = [];
  let destroyed = 0;
  const mounted = mountEmbeddedClassroom(document.getElementById('host'), {
    shell, baseUrl:'/inferencia/', lessonId:'proporciones', view:'animation', showNavigation:false,
    storage:{getItem:()=>null,setItem() {}},
    createWhiteboard(host, {animation}) {
      assert.equal(animation.id, 'proporciones');
      assert.equal(host.getAttribute('role'), 'img');
      return {render:frame=>frames.push(frame), resize:(...size)=>sizes.push(size), dispose:()=>destroyed++};
    }
  });
  try {
    assert.ok(mounted.root.querySelector('.has-whiteboard .animated-whiteboard'));
    assert.equal(mounted.root.querySelector('.slide-board').hidden, true);
    assert.ok(sizes.some(([width])=>width===640));
    const seek = mounted.root.querySelector('[aria-label="Tiempo de reproducción"]');
    for (const seconds of [10, 0, 60]) {
      seek.value = String(seconds);
      seek.dispatchEvent(new window.Event('input', {bubbles:true}));
      assert.equal(frames.at(-1).time, seconds);
      assert.ok(frames.at(-1).progress >= 0 && frames.at(-1).progress <= 1);
    }
    assert.ok(mounted.root.querySelector('.animated-whiteboard').getAttribute('aria-label').length > 20);
  } finally {mounted.dispose();}
  assert.equal(destroyed, 1);
});

test('public assets exclude original PDFs and executable vendor copies', () => {
  assert.deepEqual(readdirSync(new URL('../static/vendor/', import.meta.url)).sort(), ['atkinson-latin-400.woff2', 'atkinson-latin-700.woff2']);
});

test('the curriculum has its own route and numbers every topic and lesson from zero', () => {
  const map = readFileSync(new URL('../docs/index.mdx', import.meta.url), 'utf8');
  assert.ok(map.includes('slug: /temario\n'));
  assert.ok(!map.includes('slug: /\n'));
  for (const [index, unit] of COURSE.units.entries()) {
    assert.equal(unit.number, index);
    const category = JSON.parse(readFileSync(new URL(`../docs/${unit.id}/_category_.json`, import.meta.url), 'utf8'));
    assert.ok(category.label.startsWith(`Tema ${index}: `));
    for (const [lessonIndex, lesson] of unit.lessons.entries()) {
      const number = `${index}.${lessonIndex + 1}`;
      assert.ok(map.includes(`[${number} ${lesson.title}]`));
      const text = readFileSync(new URL(`../docs/${unit.id}/${lesson.id}.mdx`, import.meta.url), 'utf8');
      assert.ok(text.includes(`sidebar_label: ${JSON.stringify(`${number} ${lesson.title}`)}`));
    }
  }
});

test('lesson and home progress preserve activity results and follow saves across views', () => {
  const babel = require('@babel/core');
  const source = readFileSync(new URL('../src/classroom/useCourseProgress.js', import.meta.url), 'utf8');
  const ast = babel.parseSync(source, {sourceType:'module', babelrc:false, configFile:false});
  ast.program.body = ast.program.body.flatMap(node => node.type === 'ImportDeclaration' ? [] : node.type === 'ExportDefaultDeclaration' ? [node.declaration] : [node]);
  const compiled = babel.transformFromAstSync(ast, source, {
    filename:'useCourseProgress.js',
    babelrc:false,
    configFile:false,
    presets:[require.resolve('@docusaurus/core/lib/babel/preset')]
  }).code;
  const values = new Map();
  let writes = 0;
  const storage = {getItem:key => values.get(key), setItem:(key, value) => {writes++; values.set(key, value);}};
  const window = new EventTarget();
  window.Event = Event;
  window.localStorage = storage;
  const previous = globalThis.window;
  globalThis.window = window;
  let states = [];
  let cursor = 0;
  let cleanup;
  const useCourseProgress = runInNewContext(`${compiled}; useCourseProgress`, {
    window, COURSE, STORAGE_KEY, PROGRESS_EVENT, freshProgress, loadProgress, saveProgress,
    useState(initial) {const index = cursor++; states[index] = initial; return [initial, value => {states[index] = value;}];},
    useEffect(effect) {cleanup = effect();}
  });
  try {
    const saved = freshProgress(COURSE);
    saved.studied = ['sucesos'];
    saved.attempts = {'events-1/union':{count:1, solved:true, assisted:false}};
    saveProgress(storage, saved);
    const lesson = useCourseProgress('bayes-diagnostico');
    assert.equal(loadProgress(storage, COURSE).progress.lastLesson, 'bayes-diagnostico');
    lesson.setStudied(true);
    assert.deepEqual(Array.from(states[0].studied), ['sucesos', 'bayes-diagnostico']);
    const activity = loadProgress(storage, COURSE).progress;
    activity.checks['bayes-diagnostico'] = true;
    saveProgress(storage, activity);
    assert.equal(states[0].checks['bayes-diagnostico'], true);
    lesson.setStudied(false);
    assert.deepEqual(Array.from(states[0].studied), ['sucesos']);
    assert.equal(states[0].checks['bayes-diagnostico'], true);
    assert.equal(progressSummary(states[0]).independent, 1);
    const otherTab = loadProgress(storage, COURSE).progress;
    otherTab.studied.push('proporciones');
    storage.setItem(STORAGE_KEY, JSON.stringify(otherTab));
    window.dispatchEvent(Object.assign(new Event('storage'), {key:STORAGE_KEY}));
    assert.ok(states[0].studied.includes('proporciones'));
    cleanup();
    cursor = 0;
    states = [];
    const beforeHome = writes;
    useCourseProgress();
    assert.equal(writes, beforeHome);
    assert.ok(states[0].studied.includes('proporciones'));
    assert.equal(states[0].lastLesson, 'bayes-diagnostico');
    cleanup();
    for (const current of lessons) {
      cursor = 0;
      states = [];
      const selected = useCourseProgress(current.id);
      selected.setStudied(true);
      selected.setStudied(true);
      assert.equal(states[0].studied.filter(id=>id===current.id).length,1,current.id);
      assert.equal(progressSummary(states[0]).checks,1,current.id);
      assert.equal(progressSummary(states[0]).independent,1,current.id);
      assert.equal(loadProgress(storage,COURSE).progress.lastLesson,current.id);
      cleanup();
    }
    assert.equal(loadProgress(storage,COURSE).progress.studied.length,36);
    cursor = 0;
    states = [];
    useCourseProgress();
    assert.equal(progressSummary(states[0]).studied,36);
    cleanup();
    Object.defineProperty(window, 'localStorage', {configurable:true,get() {throw new Error('Blocked');}});
    cursor = 0;
    states = [];
    let blocked;
    assert.doesNotThrow(() => {blocked = useCourseProgress('proporciones');});
    assert.match(states[1], /no permite guardar/);
    const beforeMark = states[0];
    blocked.setStudied(false);
    assert.notEqual(states[0],beforeMark,'React necesita un estado nuevo para actualizar la marca');
    assert.ok(beforeMark.studied.includes('proporciones'),'El estado anterior no debe mutarse');
    window.dispatchEvent(new Event('focus'));
    assert.equal(states[0].studied.includes('proporciones'),false);
    assert.equal(progressSummary(states[0]).studied,35);
    blocked.setStudied(true);
    assert.ok(states[0].studied.includes('proporciones'));
    window.dispatchEvent(new Event('focus'));
    assert.ok(states[0].studied.includes('proporciones'), 'El foco no debe borrar una marca que sigue en la sesión');
    assert.match(states[1], /no permite guardar/);
    cleanup();
    cursor = 0;
    states = [];
    useCourseProgress();
    assert.equal(progressSummary(states[0]).studied,36,'El inicio debe conservar las marcas de sesión');
    cleanup();
    cursor = 0;
    states = [];
    const blockedLesson = useCourseProgress('sucesos');
    blockedLesson.setStudied(false);
    assert.equal(progressSummary(states[0]).studied,35);
    cleanup();
    const quotaStorage = {getItem:key=>values.get(key),setItem(){throw new Error('QuotaExceededError');}};
    Object.defineProperty(window,'localStorage',{configurable:true,value:quotaStorage});
    cursor = 0;
    states = [];
    const quotaLesson = useCourseProgress('normal');
    assert.equal(states[0].studied.includes('sucesos'),false,'Una escritura fallida no debe recuperar datos antiguos');
    quotaLesson.setStudied(false);
    window.dispatchEvent(new Event('focus'));
    assert.equal(progressSummary(states[0]).studied,34);
    assert.match(states[1],/no permite guardar/);
    const newerActivity = loadProgress(storage,COURSE).progress;
    newerActivity.checks.normal = true;
    newerActivity.attempts['events-1/union'].count = 2;
    newerActivity.studied = newerActivity.studied.filter(id=>id!=='algebra');
    saveProgress(storage,newerActivity);
    assert.equal(progressSummary(states[0]).checks,2,'Las marcas pendientes no deben ocultar comprobaciones nuevas');
    assert.equal(progressSummary(states[0]).attempts,2);
    assert.equal(states[0].studied.includes('sucesos'),false,'Se conserva la marca pendiente');
    assert.equal(states[0].studied.includes('algebra'),false,'Se conserva la modificación de la otra vista');
    Object.defineProperty(window,'localStorage',{configurable:true,value:storage});
    quotaLesson.setStudied(true);
    const recovered = loadProgress(storage,COURSE).progress;
    assert.equal(recovered.studied.length,34);
    assert.equal(recovered.studied.includes('sucesos'),false);
    assert.equal(recovered.studied.includes('algebra'),false);
    assert.equal(progressSummary(recovered).checks,2);
    assert.equal(progressSummary(recovered).attempts,2);
    assert.equal(progressSummary(recovered).independent,1);
    assert.equal(states[1],'');
  } finally {
    cleanup?.();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});