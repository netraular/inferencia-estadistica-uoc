import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseHTML} from 'linkedom';
import {COURSE} from '../pages/inferencia/course.js';
import {generateExercise, scopeExercise} from '../pages/inferencia/exercises.js';
import {mountAula} from '../pages/inferencia/app.js';
import {inlineMathToMdx} from '../src/lib/inline-math.js';
import {CAPSTONE} from '../pages/inferencia/capstone.js';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const preset = require.resolve('@docusaurus/core/lib/babel/preset');
globalThis.jStat = require('jstat').jStat;

function loadCompiled(relative, imports = {}, globals = {}) {
  const filename = new URL(relative, import.meta.url);
  const localRequire = createRequire(filename);
  const {code} = babel.transformFileSync(filename.pathname, {
    presets:[preset], plugins:['@babel/plugin-transform-modules-commonjs'], babelrc:false, configFile:false
  });
  const module = {exports:{}};
  runInNewContext(code, {module, exports:module.exports, URLSearchParams,
    require:specifier => Object.hasOwn(imports, specifier) ? imports[specifier] : localRequire(specifier), ...globals});
  return module.exports;
}

function elements(element) {
  if (!React.isValidElement(element)) return [];
  return [element, ...React.Children.toArray(element.props.children).flatMap(elements)];
}

test('three Docusaurus tabs keep the journey and optional notes without progress, and preserve old queries', () => {
  const effects = [];
  const replacements = [];
  const location = {pathname:'/inferencia/lecciones/sucesos/', search:'?actividad=theory&origen=temario', hash:'#ejemplo', state:{kept:true}};
  const {default:LessonContent} = loadCompiled('../src/components/LessonContent.jsx', {
    react:{...React, useEffect:effect => effects.push(effect), useRef:() => ({current:null})},
    '@docusaurus/router':{useHistory:() => ({replace:value => replacements.push(value)}), useLocation:() => location},
    '@theme/Tabs':({values, children}) => React.createElement('div', {'data-tabs':values.map(value => value.value).join(',')}, children),
    '@theme/TabItem':({value, children}) => React.createElement('section', {'data-view':value}, children),
    './InteractiveLesson':({view}) => React.createElement('div', {'data-interactive':view}),
    './LessonJourney':({lessonId}) => React.createElement('div', {'data-journey':lessonId}),
    './LessonSource':({lesson}) => React.createElement('p', {'data-source':lesson.id}),
    '../../pages/inferencia/course.js':{COURSE}
  });
  const element = LessonContent({lessonId:'sucesos', children:React.createElement('p', null, 'Contenido conservado')});
  const {document} = parseHTML(renderToStaticMarkup(element));
  assert.equal(document.querySelector('[data-tabs]').getAttribute('data-tabs'), 'lesson,practice,animation');
  const lesson = document.querySelector('[data-view="lesson"]');
  assert.match(lesson.textContent, /Contenido conservado/);
  assert.ok(lesson.querySelector('[data-journey="sucesos"]'));
  assert.ok(document.querySelector('[data-source="sucesos"]'));
  assert.equal(document.querySelector('[data-source]').closest('[data-view]'), null);
  assert.ok(lesson.querySelector('[data-interactive="theory"]'));
  assert.equal(lesson.querySelector('input[type="checkbox"]'), null);
  assert.equal(lesson.querySelector('[role="status"]'), null);
  assert.equal(document.querySelectorAll('input[type="checkbox"]').length, 0);
  assert.equal(document.querySelectorAll('[data-view]:not([data-view="lesson"]) input').length, 0);
  const tabs = elements(element).find(node => node.props.queryString === 'actividad');
  assert.equal(tabs.props.lazy, true);
  assert.equal(tabs.props.defaultValue, 'lesson');
  effects[0]();
  assert.equal(replacements[0].search, '?actividad=lesson&origen=temario');
  assert.equal(replacements[0].pathname, location.pathname);
  assert.equal(replacements[0].hash, location.hash);
  assert.equal(replacements[0].state, location.state);
  location.search = '?actividad=practice';
  effects[0]();
  assert.equal(replacements.length, 1);
  location.search = '?actividad=lab&origen=temario';
  effects[0]();
  assert.equal(replacements[1].search, '?actividad=lesson&origen=temario');
});

test('legacy lesson links preserve every activity and normalize theory to lesson under baseUrl', () => {
  const redirects = [];
  const window = {location:{hash:'', replace:value => redirects.push(value)}};
  const {default:LegacyRoute} = loadCompiled('../src/components/LegacyRoute.jsx', {
    react:{useEffect:effect => effect()},
    '@docusaurus/useBaseUrl':() => '/curso/',
    '../../pages/inferencia/course.js':{COURSE}
  }, {window});
  for (const [view, expected] of [['theory','lesson'], ['lab','lab'], ['practice','practice'], ['animation','animation'], ['lesson','lesson']]) {
    window.location.hash = `#/sucesos/${view}`;
    LegacyRoute();
    assert.equal(redirects.at(-1), `/curso/lecciones/sucesos/?actividad=${expected}`);
  }
  window.location.hash = '#sucesos';
  LegacyRoute();
  assert.equal(redirects.at(-1), '/curso/lecciones/sucesos/');
  window.location.hash = '#not-a-lesson/theory';
  LegacyRoute();
  assert.equal(redirects.length, 6);
});

function renderSymbols(query = '') {
  const effects = [];
  const changes = [];
  const focus = [];
  let closed = 0;
  const dialog = {
    ownerDocument:{activeElement:{isConnected:true, focus:() => focus.push('trigger')}},
    showModal:() => focus.push('modal'), close:() => focus.push('closed'),
    querySelector:() => ({focus:() => focus.push('search')}),
    getBoundingClientRect:() => ({left:100, right:600, top:100, bottom:700})
  };
  const components = loadCompiled('../src/components/SymbolsNavbarItem.jsx', {
    react:{...React, useEffect:effect => effects.push(effect), useRef:() => ({current:dialog}), useId:() => 'symbols-test', useState:() => [query, value => changes.push(value)]},
    '../../pages/inferencia/course.js':{COURSE}
  });
  const element = components.SymbolsDialog({id:'symbols-test', onClose:() => closed++});
  return {element, components, dialog, effects, changes, focus, closed:() => closed};
}

test('native symbols modal preserves the glossary, labels, search, focus, X and Escape', () => {
  const result = renderSymbols();
  const {document} = parseHTML(renderToStaticMarkup(result.element));
  assert.equal(document.querySelectorAll('dt').length, COURSE.glossary.length);
  assert.equal(result.element.type, 'dialog');
  assert.equal(result.element.props['aria-modal'], 'true');
  assert.ok(document.getElementById(result.element.props['aria-labelledby']));
  assert.ok(document.querySelector('label[for="symbols-test-search"]'));
  const cleanup = result.effects[0]();
  assert.deepEqual(result.focus, ['modal', 'search']);
  elements(result.element).find(node => node.type === 'input').props.onChange({target:{value:'distribucion'}});
  assert.deepEqual(result.changes, ['distribucion']);
  let prevented = false;
  result.element.props.onCancel({preventDefault() {prevented = true;}});
  assert.equal(prevented, true);
  elements(result.element).find(node => node.type === 'button').props.onClick();
  assert.equal(result.closed(), 2);
  cleanup();
  assert.deepEqual(result.focus, ['modal', 'search', 'closed', 'trigger']);
  const filtered = parseHTML(renderToStaticMarkup(renderSymbols('distribucion').element)).document;
  assert.ok(filtered.querySelectorAll('dt').length > 0);
  assert.ok(filtered.querySelectorAll('dt').length < COURSE.glossary.length);
  assert.match(filtered.textContent || filtered.toString(), /distribuci/);
  const symbol = parseHTML(renderToStaticMarkup(renderSymbols('\u03a9').element)).document;
  assert.match(symbol.toString(), /Espacio muestral/);
  const empty = parseHTML(renderToStaticMarkup(renderSymbols('no-such-symbol').element)).document;
  assert.equal(empty.querySelectorAll('dt').length, 0);
  assert.match(empty.toString(), /No hay coincidencias/);
  const trigger = result.components.default({mobile:true, label:'Simbolos'});
  assert.equal(trigger.type, 'li');
  assert.equal(trigger.props.className, 'menu__list-item');
  const button = elements(trigger).find(node => node.type === 'button');
  assert.equal(button.props['aria-haspopup'], 'dialog');
  assert.match(button.props.className, /menu__link/);
  button.props.onClick();
  assert.equal(result.changes.at(-1), true);
});

test('symbols modal closes only on a real click outside, never on content or dialog padding', () => {
  const result = renderSymbols();
  const click = result.element.props.onClick;
  click({target:{}, currentTarget:result.dialog, clientX:0, clientY:0});
  click({target:result.dialog, currentTarget:result.dialog, clientX:110, clientY:110});
  assert.equal(result.closed(), 0);
  click({target:result.dialog, currentTarget:result.dialog, clientX:90, clientY:110});
  assert.equal(result.closed(), 1);
  click({target:result.dialog, currentTarget:result.dialog, clientX:110, clientY:710});
  assert.equal(result.closed(), 2);
});

test('materials group the manifest inventory and encode original download filenames under baseUrl', () => {
  const documents = [
    {title:'Documento de prueba', filename:'Tema con espacios + \u03a9 #?.pdf', size:2048, category:'temario'},
    {title:'Segundo documento', filename:'otra prueba.pdf', size:2097152, category:'ejercicios'}
  ];
  const {default:MaterialsPage} = loadCompiled('../src/pages/materiales.jsx', {
    '@theme/Layout':({children}) => React.createElement('div', null, children),
    '@docusaurus/useBaseUrl':value => {assert.equal(value, '/materiales/'); return '/curso/pruebas/materiales/';},
    '@site/static/materiales/manifest.json':{documents},
    '../components/SymbolsNavbarItem':loadCompiled('../src/components/SymbolsNavbarItem.jsx', {'../../pages/inferencia/course.js':{COURSE}}).default
  });
  const {document} = parseHTML(renderToStaticMarkup(React.createElement(MaterialsPage)));
  assert.equal(document.querySelectorAll('main section').length, 2);
  const symbols = document.querySelector('[aria-haspopup="dialog"]');
  assert.equal(symbols.closest('section').querySelector('h2').textContent, 'Apuntes');
  assert.match(symbols.textContent, /Símbolos y notación/);
  assert.equal(document.querySelectorAll('[aria-haspopup="dialog"]').length, 1);
  const links = Array.from(document.querySelectorAll('a[download]'));
  assert.equal(links.length, documents.length);
  for (const [index, item] of documents.entries()) {
    assert.equal(links[index].getAttribute('href'), `/curso/pruebas/materiales/${encodeURIComponent(item.filename)}`);
    assert.equal(links[index].getAttribute('download'), item.filename);
    assert.ok(links[index].getAttribute('aria-label').includes(item.title));
  }
  assert.match(document.toString(), /2 KiB/);
  assert.match(document.toString(), /2 MiB/);
});

test('navbar keeps only curriculum and materials, with home accessible through the brand', () => {
  const config = loadCompiled('../docusaurus.config.js').default;
  assert.equal(config.themeConfig.footer, undefined);
  assert.equal(config.themeConfig.navbar.items.filter(item => item.type === 'custom-symbols').length, 0);
  assert.equal(config.themeConfig.navbar.items.filter(item => item.to === '/').length, 0);
  assert.equal(config.themeConfig.navbar.items.filter(item => item.to === '/materiales/').length, 1);
});

test('home offers large curriculum and materials access and all six topics without progress', () => {
  const {default:HomePage} = loadCompiled('../src/pages/index.jsx', {
    '@theme/Layout':({children}) => React.createElement('div', null, children),
    '@docusaurus/Link':({to, children, ...props}) => React.createElement('a', {...props, href:to}, children),
    '../../pages/inferencia/course.js':{COURSE},
    '../../pages/inferencia/capstone.js':{CAPSTONE},
    '../components/LegacyRoute':() => null
  });
  const {document} = parseHTML(renderToStaticMarkup(React.createElement(HomePage)));
  assert.equal(document.querySelector('h1').textContent, 'Inferencia estadística');
  assert.deepEqual(Array.from(document.querySelectorAll('.course-home-access'), link => link.getAttribute('href')), ['/temario/', '/materiales/']);
  assert.equal(document.querySelectorAll('.course-topic').length, 6);
  assert.equal(document.querySelector('.progress-page,input,progress,[role="status"]'), null);
  assert.doesNotMatch(document.toString(), /Mi progreso|Guardado|Estudiada|Pendiente/);
});

test('production-compiled embed hides utilities without navigation and retains them for standalone use', () => {
  const {document, window} = parseHTML('<html><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  window.HTMLElement.prototype.focus = () => {};
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable:true,
    get() {return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
    set(value) {for (const option of this.querySelectorAll('option')) {if (option.value === String(value)) option.setAttribute('selected', ''); else option.removeAttribute('selected');}}
  });
  window.matchMedia = () => ({matches:false});
  const Parser = window.DOMParser;
  window.DOMParser = class {
    parseFromString(...args) {
      const parsed = new Parser().parseFromString(...args);
      const nodes = parsed.body.childNodes;
      return {body:{childNodes:{length:nodes.length, [Symbol.iterator]:() => nodes[Symbol.iterator]()}}};
    }
  };
  const {mountEmbeddedClassroom} = loadCompiled('../src/classroom/embed.mjs', {'../../pages/inferencia/app.js':{mountAula}});
  const shell = readFileSync(new URL('../pages/inferencia-estadistica.html', import.meta.url), 'utf8');
  const values = new Map();
  const storage = {getItem:key => values.get(key), setItem:(key, value) => values.set(key, value)};
  try {
    for (const showNavigation of [false, true]) {
      const mounted = mountEmbeddedClassroom(document.getElementById('host'), {shell, baseUrl:'/inferencia/', lessonId:'sucesos', view:'theory', storage, showNavigation});
      try {
        assert.ok(mounted.root.querySelector('.knowledge-check'));
        assert.equal(mounted.root.querySelectorAll('.embedded-utilities button').length, showNavigation ? 2 : 0);
        if (!showNavigation) {
          assert.equal(mounted.root.getElementById('lessonTabs').style.display, 'none');
          assert.equal(mounted.root.querySelector('.lesson-heading').style.display, 'none');
          assert.ok(mounted.root.getElementById('glossaryToggle').closest('.sidebar'));
          assert.ok(mounted.root.getElementById('sourcesToggle').closest('.sidebar'));
          assert.equal(mounted.root.getElementById('settingsToggle'), null);
        }
      } finally {mounted.dispose();}
    }
  } finally {window.DOMParser = Parser;}
});

test('curriculum generation retains all lessons and adds the solved PEC as chapter five with valid prerequisites', async () => {
  const source = readFileSync(new URL('../scripts/generate-docs.mjs', import.meta.url), 'utf8');
  const ast = babel.parseSync(source, {sourceType:'module', babelrc:false, configFile:false});
  ast.program.body = ast.program.body.filter(node => node.type !== 'ImportDeclaration' && !(node.type === 'VariableDeclaration' && node.declarations.some(declaration => ['root','require'].includes(declaration.id.name))));
  const {code} = babel.transformFromAstSync(ast, source, {babelrc:false, configFile:false});
  const writes = new Map();
  await runInNewContext(`(async () => {${code}})()`, {
    root:'/fixture', path, COURSE, CAPSTONE, generateExercise, scopeExercise, inlineMathToMdx, require,
    mkdir:async () => {}, rm:async () => {}, cp:async () => {},
    readFile:async () => '<html></html>', writeFile:async (filename, content) => writes.set(filename, content),
    console:{log() {}}
  });
  const curriculum = writes.get('/fixture/docs/index.mdx');
  const {compile} = await import('@mdx-js/mdx');
  await compile(curriculum);
  assert.match(curriculum, /slug: \/temario\n/);
  assert.equal(Array.from(curriculum.matchAll(/<details className="curriculum-topic"/g)).length, 6);
  assert.equal(Array.from(curriculum.matchAll(/<\/details>/g)).length, 6);
  assert.doesNotMatch(curriculum, /No se incluyen las respuestas/);
  assert.match(curriculum, /tema 5 desarrolla todos los apartados de la PEC 1/);
  const category = JSON.parse(writes.get(`/fixture/docs/${CAPSTONE.id}/_category_.json`));
  assert.equal(category.position, 6);
  assert.equal(category.label, `Tema 5: ${CAPSTONE.title}`);
  for (const [index, section] of CAPSTONE.sections.entries()) {
    assert.ok(curriculum.includes(`](./${CAPSTONE.id}/${section.id}.mdx)`));
    const mdx = writes.get(`/fixture/docs/${CAPSTONE.id}/${section.id}.mdx`);
    await compile(mdx);
    assert.ok(mdx.includes(`slug: /lecciones/${section.id}`));
    assert.ok(mdx.includes(`sidebar_position: ${index + 1}`));
    assert.ok(mdx.includes(`<CapstoneExercises exerciseId="${section.exerciseId}" />`));
    for (const id of section.lessonIds) assert.ok(mdx.includes(`](/lecciones/${id})`));
  }
  assert.ok(!/independiente|afiliada|no oficial|No se publican los PDF/.test(curriculum));
  assert.match(curriculum, /Los ejemplos no son resultados experimentales ni recomendaciones clínicas/);
  let count = 0;
  for (const unit of COURSE.units) {
    assert.ok(curriculum.includes(`<summary>Tema ${unit.number}: ${unit.title}`));
    assert.ok(curriculum.includes(unit.description));
    for (const [index, lesson] of unit.lessons.entries()) {
      assert.ok(curriculum.includes(`[${unit.number}.${index + 1} ${lesson.title}](./${unit.id}/${lesson.id}.mdx)`));
      const mdx = writes.get(`/fixture/docs/${unit.id}/${lesson.id}.mdx`);
      await compile(mdx);
      assert.ok(mdx.includes(`slug: /lecciones/${lesson.id}`));
      assert.ok(mdx.includes(`<LessonContent lessonId="${lesson.id}">`));
      assert.ok(mdx.includes(`<Notation topic="${lesson.id}" />`),lesson.id);
      const hasOptional = lesson.sections.some(section=>section.optional) || lesson.formulas.some(formula=>formula.optional);
      assert.equal(mdx.includes('<details className="lesson-depth">'),hasOptional,lesson.id);
      assert.equal(mdx.includes('Ampliación opcional'),hasOptional,lesson.id);
      const required = mdx.split('<details className="lesson-depth">')[0];
      for (const section of lesson.sections.filter(section=>!section.optional)) assert.ok(required.includes(inlineMathToMdx(section.body)),`${lesson.id}: ${section.title}`);
      for (const formula of lesson.formulas.filter(formula=>!formula.optional)) assert.ok(required.includes(JSON.stringify(formula.tex)),`${lesson.id}: ${formula.tex}`);
      for (const section of lesson.sections) assert.ok(mdx.includes(inlineMathToMdx(section.body)), lesson.id);
      for (const formula of lesson.formulas) {
        assert.ok(mdx.includes(JSON.stringify(formula.tex)), lesson.id);
        assert.ok(mdx.includes(`reading={${JSON.stringify(formula.reading)}}`),lesson.id);
      }
      for (const step of lesson.method) assert.ok(mdx.includes(step), lesson.id);
      assert.ok(mdx.includes(inlineMathToMdx(lesson.example.body)), lesson.id);
      for (const pitfall of lesson.pitfalls) assert.ok(mdx.includes(pitfall), lesson.id);
      assert.ok(mdx.includes('Ejemplo resuelto con el método'), lesson.id);
      await compile(mdx);
      count++;
    }
  }
  assert.equal(count, 36);
});