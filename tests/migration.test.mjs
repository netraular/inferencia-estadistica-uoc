import {mountEmbeddedClassroom, mountSectionExample, renderScopedIcons} from '../src/classroom/embed.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {inlineMathToMdx} from '../src/lib/inline-math.js';

test('lesson entry uses scoped notes and keeps summaries and practice out of the journey', () => {
  const source=readFileSync(new URL('../src/components/LessonContent.jsx',import.meta.url),'utf8');
  assert.match(source,/<LessonJourney lessonId=\{lessonId\}/);
  assert.match(source,/<LessonSource lesson=\{lesson\}/);
  assert.match(source,/\{notes\}/);
  const notes=readFileSync(new URL('../src/components/LessonNotes.jsx',import.meta.url),'utf8');
  assert.match(notes,/<details ref=\{notes\} className="lesson-reference-notes">/);
  assert.doesNotMatch(source,/value:'lab'/);
  assert.match(source,/\['theory', 'lab', 'animation'\]/);
  const journey=readFileSync(new URL('../src/components/LessonJourney.jsx',import.meta.url),'utf8');
  assert.match(journey,/createLessonSections/);
  assert.match(journey,/data-lesson-section/);
  assert.ok(journey.indexOf('React.Children.toArray(children)') < journey.indexOf('className="lesson-section-transport"'));
  assert.doesNotMatch(source,/lesson-knowledge-check/);
  assert.ok(source.indexOf('className="lesson-practice"') > source.indexOf('</LessonJourney>'));
  assert.ok(source.indexOf('{summary}') > source.indexOf('<TabItem value="summary">'));
  assert.doesNotMatch(journey,/<InteractiveLesson lessonId=\{lessonId\} view="animation"/);
});
import {parseHTML} from 'linkedom';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import {enrichLessonAnimation} from '../pages/inferencia/lesson-visuals.js';

const require = createRequire(import.meta.url);
globalThis.jStat = require('jstat').jStat;
const shell = readFileSync(new URL('../pages/inferencia-estadistica.html', import.meta.url), 'utf8');
const lessons = COURSE.units.flatMap(unit => unit.lessons);

test('section examples contain only their selected questions and reveal no answer on mount', () => {
  const {document, window} = parseHTML('<html><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  window.katex = require('katex');
  const descriptor = createLessonSections(lessons.find(lesson => lesson.id === 'proporciones'))[0].exercise;
  const mounted = mountSectionExample(document.getElementById('host'), {descriptor, baseUrl:'/inferencia/'});
  try {
    assert.deepEqual(mounted.exercise.questions.map(question => question.id), descriptor.questionIds);
    assert.ok(mounted.root.querySelector('[data-exercise-tutor]'));
    assert.equal(mounted.root.querySelector('[data-tutor-practice]'), null);
    assert.equal(mounted.root.querySelector('[data-grade-form]'), null);
    assert.equal(mounted.root.querySelectorAll('link[rel="stylesheet"]').length, 2);
    assert.equal(mounted.root.querySelector('details').hasAttribute('open'), false);
    assert.doesNotThrow(() => {
      for (let position = 0; position < 8; position++) mounted.root.querySelector('[data-tutor-next]').click();
      mounted.root.querySelector('details').dispatchEvent(new window.Event('toggle'));
    });
  } finally {mounted.dispose();}
  assert.equal(document.getElementById('host').shadowRoot.childNodes.length, 0);
});

test('embedded section playback mounts only the selected whiteboard and leaves subsequent symbols hidden', () => {
  const {document, window} = parseHTML('<html><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable:true,
    get() {return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
    set(value) {for (const option of this.querySelectorAll('option')) {if (option.value === String(value)) option.setAttribute('selected', ''); else option.removeAttribute('selected');}}
  });
  window.matchMedia = () => ({matches:false});
  window.katex = require('katex');
  const lesson = lessons.find(item => item.id === 'proporciones');
  for (const section of createLessonSections(lesson)) {
    let received;
    const mounted = mountEmbeddedClassroom(document.getElementById('host'), {
      shell, baseUrl:'/inferencia/', lessonId:lesson.id, view:'animation', showNavigation:false,
      storage:{getItem:()=>null,setItem() {}}, animation:section.animation,
      createWhiteboard(_host, {animation}) {
        received = animation;
        return {render() {}, resize() {}, dispose() {}};
      }
    });
    try {
      assert.deepEqual(received, enrichLessonAnimation(section.animation));
      assert.equal(received.id, section.animation.id);
      assert.deepEqual(received.steps[0].cues, section.animation.steps[0].cues);
      assert.deepEqual(received.steps[0].visual.lines, section.animation.steps[0].visual.lines);
      assert.ok(received.steps[0].visual.context);
      assert.equal(received.steps[0].visual.phases.length, received.steps[0].cues.length);
      assert.equal(received.steps.length, 1);
    } finally {mounted.dispose();}
    const fallback = mountEmbeddedClassroom(document.getElementById('host'), {
      shell, baseUrl:'/inferencia/', lessonId:lesson.id, view:'animation', showNavigation:false,
      storage:{getItem:()=>null,setItem() {}}, animation:section.animation
    });
    try {
      const rows = fallback.root.querySelectorAll('.board-line');
      assert.ok(rows.length > 0);
      assert.ok(Array.from(rows).every(row => row.hidden));
      const graph = fallback.root.querySelector('.context-diagram');
      assert.equal(graph.hidden, false);
      assert.equal(graph.getAttribute('aria-label'), enrichLessonAnimation(section.animation).steps[0].visual.context.caption);
      assert.equal(fallback.root.querySelectorAll('.story-plot').length, 0);
    } finally {fallback.dispose();}
  }
});

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
    for (const section of lesson.sections) assert.ok(text.includes(inlineMathToMdx(section.body)), lesson.id);
    for (const step of lesson.method) assert.ok(text.includes(step), lesson.id);
    for (const formula of lesson.formulas) assert.ok(text.includes(JSON.stringify(formula.tex)), lesson.id);
    assert.ok(text.includes(`<LessonContent lessonId="${lesson.id}">`), lesson.id);
    assert.ok(!text.includes('Al terminar esta lección'), lesson.id);
    assert.ok(text.trimEnd().endsWith('</LessonContent>'), lesson.id);
    assert.equal(text.includes('<InteractiveLesson '),Boolean(lesson.illustration),lesson.id);
    if (lesson.illustration) {
      assert.ok(text.includes(`<InteractiveLesson lessonId="${lesson.id}" view="figure" />`),lesson.id);
      assert.ok(text.includes(`### ${lesson.illustration.title}`),lesson.id);
      assert.ok(text.indexOf('view="figure"')<text.indexOf('### Palabras y símbolos'),lesson.id);
    }
    assert.ok(text.includes('Desarrollo escrito del ejemplo'), lesson.id);
    assert.ok(text.indexOf('<LessonSummary>') < text.indexOf('<h3 id="fórmulas-clave">'), lesson.id);
    assert.ok(text.indexOf('</LessonSummary>') < text.indexOf('<LessonSectionNotes '), lesson.id);
    const blocks = [...text.matchAll(/<LessonSectionNotes sectionId="([^"]+)">([\s\S]*?)<\/LessonSectionNotes>/g)];
    const sections = createLessonSections(lesson);
    assert.deepEqual(blocks.map(match => match[1]), sections.map(item => item.id), lesson.id);
    for (const [index, item] of sections.entries()) {
      for (const title of item.sourceSections) {
        const source = lesson.sections.find(entry => entry.title === title);
        assert.ok(blocks[index][2].includes(inlineMathToMdx(source.body)), `${lesson.id}/${item.id}: ${title}`);
      }
      assert.equal(blocks[index][2].includes('title="Ampliación opcional"'), item.optional, `${lesson.id}/${item.id}`);
      assert.equal(blocks[index][2].includes('Desarrollo escrito del ejemplo'), Boolean(item.exercise), `${lesson.id}/${item.id}`);
    }
    assert.equal(blocks.filter(match => match[2].includes(inlineMathToMdx(lesson.example.body))).length, 1, lesson.id);
    for (const formula of lesson.formulas) {
      const destinations = blocks.filter(match => match[2].includes(JSON.stringify(formula.tex)));
      assert.ok(destinations.length > 0, `${lesson.id}: ${formula.tex} belongs inside a section`);
      if (formula.optional) assert.ok(destinations.every(match => match[2].includes('title="Ampliación opcional"')), lesson.id);
    }
    assert.ok(!/\bleccion\b|\bmetodo\b|\bsimbolos\b|Como razonar/.test(text), lesson.id);
  }
  assert.equal(lessons.length, 36);
});

test('embedded classroom keeps routing and titles isolated and corrects exercises without progress', () => {
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
  const storage = {getItem() {throw new Error('Storage is blocked');}, setItem() {throw new Error('Storage is blocked');}};
  const mounted = mountEmbeddedClassroom(document.getElementById('host'), {shell, baseUrl:'/inferencia/', lessonId:'bayes-diagnostico', storage});
  try {
    assert.equal(document.title, 'Docusaurus lesson');
    assert.equal(document.getElementById('courseNav'), null);
    assert.equal(mounted.aula.progress, undefined);
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
    mounted.root.getElementById('practiceMode').value = 'practice';
    mounted.root.getElementById('practiceMode').dispatchEvent(new window.Event('change', {bubbles:true}));
    const question = mounted.aula.exercise.questions[0];
    mounted.root.getElementById(`answer-${question.id}`).value = String(question.answer);
    mounted.root.querySelector(`[data-grade-form="${question.id}"]`).dispatchEvent(new window.Event('submit', {bubbles:true, cancelable:true}));
    assert.ok(mounted.root.getElementById(`feedback-${question.id}`).classList.contains('correct'));
    window.dispatchEvent(new window.Event('storage'));
    mounted.root.querySelector(`[data-grade-form="${question.id}"]`).dispatchEvent(new window.Event('submit', {bubbles:true, cancelable:true}));
    assert.equal(mounted.root.getElementById('appStatus').textContent, '');
    assert.equal(document.title, 'Docusaurus lesson');
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
  assert.doesNotMatch(map, /<details\b[^>]*\bopen\b/);
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

test('the classroom never reads browser storage and exposes no progress controls', () => {
  const {document, window} = parseHTML('<html><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  window.matchMedia = () => ({matches:false});
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  let accesses = 0;
  Object.defineProperty(window, 'localStorage', {configurable:true, get() {accesses++; throw new Error('Blocked');}});
  try {
    const mounted = mountEmbeddedClassroom(document.getElementById('host'), {shell, baseUrl:'/inferencia/', lessonId:'normal', view:'animation', showNavigation:false});
    try {
      for (const view of ['theory', 'practice', 'animation']) mounted.aula.setView(view);
      assert.equal(accesses, 0);
      assert.equal(mounted.aula.progress, undefined);
      assert.equal(mounted.root.getElementById('lessonStudied'), null);
      assert.equal(mounted.root.getElementById('settingsToggle'), null);
      assert.equal(mounted.root.getElementById('practiceScore'), null);
      assert.equal(mounted.root.getElementById('appStatus').textContent, '');
    } finally {mounted.dispose();}
  } finally {
    if (original) Object.defineProperty(window, 'localStorage', original);
    else delete window.localStorage;
  }
});