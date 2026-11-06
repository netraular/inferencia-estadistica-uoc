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

test('full notes stay collapsed and the summary is a labelled section', () => {
  const {LessonNotes, LessonSummary} = loadCompiled('../src/components/LessonNotes.jsx', {
    react:{...React, useEffect:() => {}, useRef:() => ({current:null})},
    '@docusaurus/router':{useLocation:() => ({hash:''})}
  });
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(LessonSummary, null, React.createElement('p', null, 'Resumen')),
    React.createElement(LessonNotes, null, React.createElement('p', null, 'Notas'))));
  const {document} = parseHTML(`<div>${html}</div>`);
  assert.equal(document.querySelector('.lesson-summary').getAttribute('aria-label'), 'Resumen de la lección');
  const notes = document.querySelector('details.lesson-reference-notes');
  assert.equal(notes.hasAttribute('open'), false);
  assert.match(notes.querySelector('summary').textContent, /Apuntes completos/);
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
