import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import {COURSE} from '../pages/inferencia/course.js';
import {mountEmbeddedClassroom, renderScopedIcons} from '../src/classroom/embed.mjs';
import {STORAGE_KEY, freshProgress} from '../pages/inferencia/progress.js';

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
    assert.ok(!text.includes('<InteractiveLesson '), lesson.id);
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
    for (const view of ['theory', 'lab', 'practice', 'animation']) {
      assert.equal(mounted.aula.setView(view), true);
      assert.equal(mounted.root.getElementById(`panel-${view}`).hidden, false);
    }
    mounted.aula.setView('practice');
    const question = mounted.aula.exercise.questions[0];
    mounted.root.getElementById(`answer-${question.id}`).value = String(question.answer);
    mounted.root.querySelector(`[data-grade-form="${question.id}"]`).dispatchEvent(new window.Event('submit', {bubbles:true, cancelable:true}));
    assert.ok(mounted.root.getElementById(`feedback-${question.id}`).classList.contains('correct'));
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

test('public assets exclude original PDFs and executable vendor copies', () => {
  assert.deepEqual(readdirSync(new URL('../static/vendor/', import.meta.url)).sort(), ['atkinson-latin-400.woff2', 'atkinson-latin-700.woff2']);
});