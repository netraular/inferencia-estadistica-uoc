import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseHTML} from 'linkedom';
import katex from 'katex';
import {COURSE} from '../pages/inferencia/course.js';
import {PDF_PAGES, pdfReference} from '../src/lib/pdf-pages.js';
import {inlineMathToMdx, inlineMathSegments} from '../src/lib/inline-math.js';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const preset = require.resolve('@docusaurus/core/lib/babel/preset');
const lessons = COURSE.units.flatMap(unit => unit.lessons);
const manifest = JSON.parse(readFileSync(new URL('../static/materiales/manifest.json', import.meta.url), 'utf8'));

function loadCompiled(relative, imports = {}) {
  const filename = new URL(relative, import.meta.url);
  const localRequire = createRequire(filename);
  const {code} = babel.transformFileSync(filename.pathname, {
    presets:[preset], plugins:['@babel/plugin-transform-modules-commonjs'], babelrc:false, configFile:false
  });
  const module = {exports:{}};
  runInNewContext(code, {module, exports:module.exports, document:{getElementById:() => null},
    require:specifier => Object.hasOwn(imports, specifier) ? imports[specifier] : localRequire(specifier)});
  return module.exports;
}

test('every lesson of topics 1 to 4 points to a published PDF and a page', () => {
  const published = new Set(manifest.documents.map(document => document.filename));
  const referenced = new Set();
  for (const unit of COURSE.units) for (const lesson of unit.lessons) {
    const reference = pdfReference(lesson);
    if (unit.number === 0) {
      assert.equal(reference, null, lesson.id);
      continue;
    }
    assert.ok(reference, lesson.id);
    assert.equal(reference.topic, unit.number, lesson.id);
    assert.ok(published.has(reference.file), lesson.id);
    assert.ok(Number.isInteger(reference.page) && reference.page > 0 && reference.page <= 30, lesson.id);
    referenced.add(lesson.id);
  }
  assert.deepEqual(Object.keys(PDF_PAGES).sort(), [...referenced].sort());
});

test('the lesson source line links to the PDF page under baseUrl', () => {
  const {default:LessonSource} = loadCompiled('../src/components/LessonSource.jsx', {
    '@docusaurus/useBaseUrl':value => `/curso${value}`
  });
  const poisson = lessons.find(lesson => lesson.id === 'poisson');
  const {document} = parseHTML(renderToStaticMarkup(React.createElement(LessonSource, {lesson:poisson})));
  const link = document.querySelector('a');
  assert.equal(link.getAttribute('href'), '/curso/materiales/FundamentosInferencia_Tema3.pdf#page=6');
  assert.match(document.toString(), /Apuntes, tema <!-- -->3|Apuntes, tema 3/);
  assert.match(document.toString(), /3\.1\.3/);
  const bridge = parseHTML(renderToStaticMarkup(React.createElement(LessonSource, {lesson:lessons[0]}))).document;
  assert.equal(bridge.querySelector('a'), null);
  assert.match(bridge.toString(), /Repaso previo/);
});

test('section notes stay scoped and optional notes stay collapsed', () => {
  const {LessonNotes, LessonSummary, LessonSectionNotes} = loadCompiled('../src/components/LessonNotes.jsx', {
    react:{...React, useEffect:() => {}, useRef:() => ({current:null})},
    '@docusaurus/router':{useLocation:() => ({hash:''})}
  });
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(LessonSummary, null, React.createElement('p', null, 'Resumen')),
    React.createElement(LessonSectionNotes, {sectionId:'parte-y-total'}, React.createElement('p', null, 'Notas')),
    React.createElement(LessonNotes, {title:'Ampliación opcional'}, React.createElement('p', null, 'Opcional'))));
  const {document} = parseHTML(`<div>${html}</div>`);
  assert.equal(document.querySelector('.lesson-summary').getAttribute('aria-label'), 'Resumen de la lección');
  assert.equal(document.querySelector('[data-section-notes]').getAttribute('data-section-notes'), 'parte-y-total');
  assert.equal(document.querySelector('[data-section-notes]').textContent, 'Notas');
  const notes = document.querySelector('details.lesson-reference-notes');
  assert.equal(notes.hasAttribute('open'), false);
  assert.equal(notes.querySelector('summary').textContent, 'Ampliación opcional');
});

test('every lesson omits knowledge checks and preserves its other content and views', () => {
  const wrapper = ({children}) => React.createElement('div', null, children);
  const LessonSummary = ({children}) => React.createElement('section', {'data-summary':true}, children);
  const LessonSectionNotes = ({sectionId, children}) => React.createElement('section', {'data-section-notes':sectionId}, children);
  const {default:LessonContent} = loadCompiled('../src/components/LessonContent.jsx', {
    react:{...React, useEffect:() => {}},
    '@theme/Tabs':wrapper,
    '@theme/TabItem':({value, children}) => React.createElement('div', {'data-view':value}, children),
    '@docusaurus/router':{useHistory:() => ({}), useLocation:() => ({search:''})},
    '../../pages/inferencia/course.js':{COURSE},
    './LessonSource':({lesson}) => React.createElement('div', {'data-source':lesson.id}),
    './LessonJourney':wrapper,
    './LessonNotes':{LessonSummary, LessonSectionNotes},
    './InteractiveLesson':({view}) => React.createElement('div', {'data-interactive-view':view}),
    './ExerciseCollection':({mode = 'collection'}) => React.createElement('div', {'data-exercises':mode})
  });
  for (const lesson of lessons) {
    const {document} = parseHTML(renderToStaticMarkup(React.createElement(LessonContent,
      {lessonId:lesson.id},
      React.createElement(LessonSectionNotes, {sectionId:'first'}, React.createElement('p', {'data-notes':true}, 'Lesson notes')),
      React.createElement(LessonSummary, null, 'Lesson summary'))));
    assert.equal(document.querySelector('.lesson-knowledge-check'), null, lesson.id);
    assert.ok(!document.toString().includes('Comprueba la idea'), lesson.id);
    assert.equal(document.querySelector('[data-interactive-view="theory"]'), null, lesson.id);
    assert.equal(document.querySelector('[data-source]').getAttribute('data-source'), lesson.id);
    assert.ok(document.querySelector('[data-notes]'), lesson.id);
    assert.ok(document.querySelector('[data-view="lesson"] [data-notes]'), lesson.id);
    assert.equal(document.querySelector('[data-view="lesson"] [data-summary]'), null, lesson.id);
    assert.equal(document.querySelector('[data-view="lesson"] [data-exercises]'), null, lesson.id);
    assert.equal(document.querySelectorAll('.lesson-objectives').length, 1, lesson.id);
    assert.ok(document.querySelector('[data-view="practice"] [data-exercises="practice"]'), lesson.id);
    assert.ok(document.querySelector('[data-exercises="collection"]'), lesson.id);
    assert.ok(document.querySelector('[data-view="summary"] [data-summary]'), lesson.id);
    assert.ok(document.querySelector('[data-view="summary"] [data-interactive-view="animation"]'), lesson.id);
  }
});

test('inline formulas in the notes are valid TeX and become safe MDX components', () => {
  let count = 0;
  for (const lesson of lessons) {
    for (const item of [...lesson.sections, lesson.example]) {
      for (const tex of inlineMathSegments(item.body)) {
        katex.renderToString(tex, {throwOnError:true});
        count++;
      }
      assert.ok(!inlineMathToMdx(item.body).includes('$'), lesson.id);
    }
    const spoken = JSON.stringify([lesson.method, lesson.pitfalls, lesson.formulas, lesson.objectives]);
    assert.ok(!spoken.includes('$'), `${lesson.id}: inline TeX only belongs to written notes`);
  }
  assert.ok(count >= 40);
  assert.equal(inlineMathToMdx('<p>Vale $\\frac{1}{2}$.</p>'), '<p>Vale <InlineFormula tex={"\\\\frac{1}{2}"} />.</p>');
});
