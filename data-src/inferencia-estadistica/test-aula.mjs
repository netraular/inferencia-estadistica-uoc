test('La resolución revela cada operación sin perder la interpretación ni el registro de ayuda', () => {
  const {document, aula, click} = harness();
  try {
    aula.setView('practice');
    const solution = document.querySelector('[data-solution]');
    solution.open = true;
    const steps = Array.from(solution.querySelectorAll('[data-worked-step]'));
    assert.ok(steps.length > 1);
    assert.equal(steps.filter(step => !step.hidden).length, 1);
    const forward = solution.querySelector('[data-solution-step="1"]');
    for (let index = 1; index < steps.length; index++) {
      click(forward);
      assert.equal(steps.filter(step => !step.hidden).length, index + 1);
      assert.equal(steps[index].getAttribute('aria-current'), 'step');
    }
    assert.equal(solution.querySelector('.interpretation').hidden, false);
    assert.equal(forward.disabled, true);
    click(solution.querySelector('[data-solution-step="-1"]'));
    assert.equal(solution.querySelector('.interpretation').hidden, true);
    assert.ok(Object.values(aula.progress.attempts).some(attempt => attempt.assisted));
  } finally {aula.dispose();}
});
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync, cpSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseHTML} from 'linkedom';
import * as cssTree from 'css-tree';
import {assetVersion, versionAssets} from './version-assets.mjs';
import {COURSE} from '../../pages/inferencia/course.js';
import {ANIMATIONS} from '../../pages/inferencia/animations.js';
import {LAB_IDS} from '../../pages/inferencia/labs.js';
import {EXERCISE_TYPES, generateExercise, scopeExercise} from '../../pages/inferencia/exercises.js';
import {LESSONS, VIEWS, LESSON_LAB_PRESETS, parseRoute, escapeHtml, mountAula} from '../../pages/inferencia/app.js';
import {STORAGE_KEY, freshProgress, progressSummary} from '../../pages/inferencia/progress.js';

const require = createRequire(import.meta.url);
const katex = require('../../pages/inferencia/vendor/katex/katex.min.js');
const lucide = require('../../pages/inferencia/vendor/lucide.min.js');
globalThis.jStat = require('../../pages/inferencia/vendor/jstat.min.js').jStat;
const html = readFileSync(new URL('../../pages/inferencia-estadistica.html', import.meta.url), 'utf8');

function harness(raw, hash = '#proporciones/theory') {
  const {document, window} = parseHTML(html);
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable:true,
    get(){return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
    set(value){for (const option of this.querySelectorAll('option')) { if (option.value === String(value)) option.setAttribute('selected', ''); else option.removeAttribute('selected'); }}
  });
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.focus = function(){};
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640, height:360});
  window.katex = katex;
  window.lucide = {createIcons(){}};
  window.matchMedia = () => ({matches:false});
  const saved = new Map(raw ? [[STORAGE_KEY, raw]] : []);
  const storage = {getItem:key => saved.get(key), setItem:(key, value) => saved.set(key, value)};
  const location = {hash};
  const history = {replaceState(state, title, hash){location.hash = hash;}};
  const aula = mountAula(document, {storage, location, history});
  const click = target => target.dispatchEvent(new window.Event('click', {bubbles:true}));
  const change = target => target.dispatchEvent(new window.Event('change', {bubbles:true}));
  const submit = target => target.dispatchEvent(new window.Event('submit', {bubbles:true,cancelable:true}));
  return {document, window, aula, saved, click, change, submit};
}

test('Currículo completo, IDs y asociaciones de cada lección', () => {
  assert.equal(COURSE.units.length, 5);
  assert.equal(LESSONS.length, 36);
  assert.equal(new Set(LESSONS.map(item => item.id)).size, LESSONS.length);
  assert.deepEqual(COURSE.units.map(unit => unit.number), [0,1,2,3,4]);
  const types = new Set(EXERCISE_TYPES.map(item => item.id));
  const animations = new Set(ANIMATIONS.map(item => item.id));
  for (const lesson of LESSONS) {
    assert.match(lesson.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(lesson.sections.length >= 2);
    assert.ok(lesson.sections.every(section => section.body.length > 200));
    assert.ok(lesson.formulas.length > 0);
    assert.ok(lesson.method.length === 3 && lesson.method.every(text => text.length > 70), lesson.id);
    assert.ok(lesson.check.answer >= 0 && lesson.check.answer < lesson.check.options.length);
    assert.ok(LAB_IDS.includes(lesson.visual), lesson.id);
    assert.ok(animations.has(lesson.animation), lesson.id);
    assert.ok(lesson.exerciseTypes.length > 0 && lesson.exerciseTypes.every(type => types.has(type)), lesson.id);
    assert.ok(lesson.source.document && lesson.source.section);
    for (const section of lesson.sections) assert.doesNotMatch(section.body, /<script|on\w+\s*=|javascript:/i);
  }
});

test('Las 36 lecciones explican su notación y gradúan la práctica sin eliminar la profundización', () => {
  for (const lesson of LESSONS) {
    const basic = lesson.sections.filter(section=>!section.optional);
    assert.equal(basic.length,2,lesson.id);
    assert.ok(lesson.sections.some(section=>section.optional),lesson.id);
    assert.ok(lesson.notation.length>=3,lesson.id);
    for (const item of lesson.notation) for (const key of ['symbol','term','reading','definition','example']) assert.ok(item[key]?.length>0,`${lesson.id}: ${key}`);
    for (const formula of lesson.formulas) assert.ok(formula.reading.length>20,lesson.id);
    for (const type of lesson.exerciseTypes) for (const seed of [1,17,68]) {
      const generated = generateExercise(type,seed);
      const scoped = scopeExercise(lesson,generated);
      const ids = scoped.questions.map(question=>question.id);
      assert.deepEqual(ids,lesson.exerciseQuestions?.[type] || generated.questions.map(question=>question.id),lesson.id);
      assert.ok(ids.length>0,lesson.id);
    }
  }
  const {document,aula} = harness();
  try {
    assert.ok(document.querySelector('.lesson-notation'));
    assert.ok(document.querySelector('.lesson-depth'));
    aula.navigate('masa','practice');
    assert.deepEqual(aula.exercise.questions.map(question=>question.id),['normalizer']);
    assert.match(document.querySelector('.exercise-notation').textContent,/Se lee:/);
  } finally {aula.dispose();}
});

test('El inicio distingue cuatro PDF y apoyo opcional sin registrar estudio ni dejar gráficos activos', () => {
  const {document, aula, click} = harness(undefined, '');
  try {
    assert.equal(document.getElementById('courseOverview').hidden, false);
    assert.equal(document.getElementById('lessonContent').hidden, true);
    assert.equal(document.querySelectorAll('canvas').length, 0);
    assert.equal(document.querySelectorAll('.curriculum-unit').length, 5);
    assert.match(document.getElementById('courseOverview').textContent, /apoyo opcional/);
    assert.match(document.getElementById('courseOverview').textContent, /no página por página/);
    assert.deepEqual(aula.progress.studied, []);
    click(document.querySelector('#courseOverview [data-lesson="sucesos"]'));
    assert.equal(aula.route.lessonId, 'sucesos');
    assert.equal(document.getElementById('courseOverview').hidden, true);
    assert.equal(document.getElementById('lessonContent').hidden, false);
    aula.setView('animation');
    click(document.getElementById('overviewToggle'));
    assert.equal(document.querySelectorAll('canvas').length, 0);
    assert.deepEqual(aula.progress.studied, []);
  } finally { aula.dispose(); }
});

test('KaTeX representa todas las fórmulas del temario y las escenas', () => {
  const formulas = [...LESSONS.flatMap(lesson => lesson.formulas.map(formula => formula.tex)), ...ANIMATIONS.flatMap(animation => animation.steps.filter(step => step.tex).map(step => step.tex))];
  for (const tex of formulas) assert.doesNotThrow(() => katex.renderToString(tex, {throwOnError:true, trust:false, strict:'ignore'}), tex);
});

test('CSS válido y recursos locales existentes, sin PDF ni dependencias remotas', () => {
  const css = readFileSync(new URL('../../pages/inferencia/aula.css', import.meta.url), 'utf8');
  const errors = [];
  cssTree.parse(css, {onParseError:error => errors.push(error.message)});
  assert.deepEqual(errors, []);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width:480px/);
  assert.match(css, /\[hidden\]/);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const path = match[1];
    if (path.startsWith('#') || path === '../') continue;
    assert.doesNotMatch(path, /https?:|\.pdf$/i);
    assert.ok(existsSync(new URL(`../../pages/${path}`, import.meta.url)), path);
  }
  for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) assert.ok(existsSync(new URL(`../../pages/inferencia/${match[1]}`, import.meta.url)), match[1]);
  const katexCss = readFileSync(new URL('../../pages/inferencia/vendor/katex/katex.min.css', import.meta.url), 'utf8');
  for (const match of katexCss.matchAll(/url\(([^)]+)\)/g)) assert.ok(existsSync(new URL(`../../pages/inferencia/vendor/katex/${match[1]}`, import.meta.url)), match[1]);
  for (const file of ['jstat.LICENSE','lucide.LICENSE','atkinson.LICENSE','katex/LICENSE']) assert.ok(existsSync(new URL(`../../pages/inferencia/vendor/${file}`, import.meta.url)), file);
});

test('La lectura usa una columna y frases inline sin tarjetas ni filas separadas',()=>{
  const css=cssTree.parse(readFileSync(new URL('../../pages/inferencia/aula.css',import.meta.url),'utf8'));
  const rule=selector=>{
    const node=css.children.toArray().find(item=>item.type==='Rule' && cssTree.generate(item.prelude)===selector);
    assert.ok(node,selector);
    return new Map(node.block.children.toArray().filter(item=>item.type==='Declaration').map(item=>[item.property,cssTree.generate(item.value)]));
  };
  assert.equal(rule('.lecture-layout').get('grid-template-columns'),'minmax(0,1fr)');
  assert.equal(rule('.narration-cue').get('display'),'inline');
  assert.equal(rule('.animation-cues .cue-jump').get('display'),'inline');
  assert.equal(rule('.animation-cues .cue-jump').get('box-decoration-break'),'clone');
  assert.equal(rule('.animation-controls .animation-primary').get('width'),'48px');
  assert.equal(rule('.animation-player.is-focused .lecture-media').get('flex-direction'),'column');
  const {document,aula}=harness();
  try{
    aula.navigate('proporciones','animation');
    const media=document.querySelector('.lecture-media');
    assert.equal(media.children[0].className,'animation-stage');
    assert.equal(media.children[1].className,'animation-controls');
    assert.equal(media.nextElementSibling.className,'lecture-narration');
    assert.equal(document.querySelectorAll('p.animation-cues').length,1);
    assert.equal(document.querySelectorAll('.animation-cues li,.animation-cues button').length,0);
  }finally{aula.dispose();}
});

test('Published modules and imports use existing .js paths', () => {
  const directory = new URL('../../pages/inferencia/', import.meta.url);
  const files = readdirSync(directory).filter(file => /\.(?:mjs|js)$/.test(file)).sort();
  assert.deepEqual(files, ['animations.js','app.js','course.js','exercises.js','labs.js','lecture-story.js','progress.js','teaching.js']);
  const {document} = parseHTML(html);
  const scripts = [...document.querySelectorAll('script[type="module"]')];
  assert.ok(scripts.length > 0);
  for (const script of scripts) {
    const path = script.getAttribute('src');
    assert.match(new URL(path, 'https://example.test/').pathname, /\.js$/);
    assert.ok(existsSync(new URL(path, new URL('../../pages/inferencia-estadistica.html', import.meta.url))), path);
  }
  for (const file of files) {
    const url = new URL(file, directory);
    assert.match(file, /\.js$/);
    assert.ok(existsSync(url), file);
    const source = readFileSync(url, 'utf8');
    for (const match of source.matchAll(/(?:^\s*(?:import|export)\s+(?:[^'"\n]*?\sfrom\s*)?|\bimport\s*\(\s*)['"]([^'"]+)['"]/gm)) {
      assert.match(new URL(match[1], url).pathname, /\.js$/, `${file}: ${match[1]}`);
      assert.ok(existsSync(new URL(match[1], url)), `${file}: ${match[1]}`);
    }
  }
});

test('Las rutas y el texto externo se validan', () => {
  assert.deepEqual(parseRoute('#bayes-diagnostico/practice'), {lessonId:'bayes-diagnostico',view:'practice'});
  assert.deepEqual(parseRoute('#unknown/invalid'), {lessonId:'proporciones',view:'theory'});
  assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});

test('La portada registra el curso y todos los controles tienen iconos disponibles', () => {
  const config = readFileSync(new URL('../../docusaurus.config.js', import.meta.url), 'utf8');
  assert.match(config, /title: 'Inferencia/);
  const modules = ['app.js','animations.js','labs.js'].map(file => readFileSync(new URL(`../../pages/inferencia/${file}`, import.meta.url), 'utf8')).join('\n');
  const names = new Set([...`${html}\n${modules}`.matchAll(/data-lucide=["']([^"']+)["']|button\('([^']+)'/g)].map(match => match[1] || match[2]));
  const iconNames = new Set(Object.keys(lucide.icons).map(name => name.replace(/-/g, '').toLowerCase()));
  for (const name of names) assert.ok(iconNames.has(name.replace(/-/g, '').toLowerCase()), name);
});

test('Cada lección monta sus cuatro vistas y limpia los gráficos anteriores', () => {
  const {document, aula} = harness();
  try {
    for (const lesson of LESSONS) {
      for (const view of VIEWS) {
        assert.equal(aula.navigate(lesson.id, view, false), true);
        assert.equal(document.getElementById('lessonTitle').textContent, lesson.title);
        assert.ok(document.getElementById('lessonReference').textContent.includes(lesson.source.section));
        assert.equal(document.querySelectorAll('.lesson-panel:not([hidden])').length, 1);
        assert.equal(document.querySelectorAll('canvas:not(.story-plot)').length, view === 'practice' ? 0 : 1);
        for(const plot of document.querySelectorAll('.story-plot')) assert.ok(plot.closest('.slide-board'));
        assert.equal(document.getElementById(`tab-${view}`).getAttribute('aria-selected'), 'true');
        if (view === 'theory') {
          assert.equal(document.querySelectorAll('.lesson-method li').length, 3);
          const worked = scopeExercise(lesson,generateExercise(lesson.exerciseTypes[0],1));
          assert.equal(document.querySelectorAll('.worked-example .solution[open]').length,worked.questions.length);
        }
        const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
        assert.equal(new Set(ids).size, ids.length, `${lesson.id}/${view}`);
      }
    }
  } finally { aula.dispose(); }
  assert.equal(document.querySelectorAll('canvas').length, 0);
});

test('Navegación siguiente/anterior y progreso explícito restaurable', () => {
  const {document, aula, saved, click, change} = harness();
  try {
    assert.equal(document.getElementById('previousLesson').disabled, true);
    assert.equal(aula.progress.studied.length, 0);
    const studied = document.getElementById('lessonStudied');
    studied.checked = true;
    change(studied);
    assert.deepEqual(aula.progress.studied, ['proporciones']);
    click(document.getElementById('nextLesson'));
    assert.equal(aula.route.lessonId, 'algebra');
    assert.equal(document.getElementById('lessonStudied').checked, false);
    click(document.getElementById('previousLesson'));
    assert.equal(aula.route.lessonId, 'proporciones');
    assert.equal(document.getElementById('lessonStudied').checked, true);
    const restored = harness(saved.get(STORAGE_KEY));
    assert.equal(restored.aula.progress.studied.length, 1);
    restored.aula.dispose();
  } finally { aula.dispose(); }
});

test('Búsqueda sin acentos y comprobación conceptual', () => {
  const {document, window, aula, submit} = harness();
  try {
    const search = document.getElementById('courseSearch');
    search.value = 'distribucion';
    search.dispatchEvent(new window.Event('input'));
    assert.ok(document.querySelectorAll('.lesson-link').length > 0);
    search.value = 'xxxxxxxxxxx';
    search.dispatchEvent(new window.Event('input'));
    assert.equal(document.querySelectorAll('.lesson-link').length, 0);
    const correct = document.querySelector('#knowledgeForm input[value="1"]');
    correct.checked = true;
    correct.setAttribute('checked', '');
    submit(document.getElementById('knowledgeForm'));
    assert.equal(aula.progress.checks.proporciones, true);
    assert.match(document.getElementById('knowledgeFeedback').textContent, /Correcto/);
    assert.equal(aula.progress.studied.length, 0);
  } finally { aula.dispose(); }
});

test('Práctica acepta fracciones, registra ayuda y no puntúa entradas inválidas', () => {
  const {document, aula, click, submit} = harness();
  try {
    aula.navigate('sucesos', 'practice');
    const question = aula.exercise.questions[0];
    const input = document.getElementById(`answer-${question.id}`);
    const form = document.querySelector(`[data-grade-form="${question.id}"]`);
    input.value = 'not-a-number';
    submit(form);
    assert.equal(progressSummary(aula.progress).attempts, 0);
    click(document.querySelector(`[data-hint="${question.id}"]`));
    assert.equal(document.getElementById(`hint-${question.id}`).hidden, false);
    input.value = `${question.answer * 100}%`;
    submit(form);
    assert.equal(progressSummary(aula.progress).assisted, 1);
    assert.match(document.getElementById(`feedback-${question.id}`).textContent, /Correcto/);
    const second = aula.exercise.questions[1];
    document.getElementById(`answer-${second.id}`).value = String(second.answer);
    submit(document.querySelector(`[data-grade-form="${second.id}"]`));
    assert.equal(progressSummary(aula.progress).independent, 1);
    const oldId = aula.exercise.id;
    click(document.getElementById('newExercise'));
    assert.notEqual(aula.exercise.id, oldId);
  } finally { aula.dispose(); }
});

test('Banco completo, modo guiado y preferencias funcionan', () => {
  const {document, aula, click, change} = harness();
  try {
    aula.setView('practice');
    document.getElementById('entireBank').checked = true;
    change(document.getElementById('entireBank'));
    assert.equal(document.querySelectorAll('#exerciseType option').length, EXERCISE_TYPES.length);
    document.getElementById('exerciseType').value = 'gamma';
    change(document.getElementById('exerciseType'));
    assert.equal(aula.exercise.type, 'gamma');
    document.getElementById('practiceMode').value = 'guided';
    change(document.getElementById('practiceMode'));
    assert.equal(document.querySelectorAll('.solution[open]').length, aula.exercise.questions.length);
    click(document.getElementById('settingsToggle'));
    assert.match(document.getElementById('dialogContent').textContent, /este navegador/);
    assert.equal(document.querySelector('[data-action="export"]'), null);
    assert.equal(document.querySelector('[data-action="import"]'), null);
    assert.equal(document.querySelector('[data-action="reset"]'), null);
    assert.equal(document.getElementById('progressFile'), null);
    assert.equal(aula.route.view, 'practice');
    click(document.getElementById('dialogClose'));
    assert.equal(document.getElementById('utilityDialog').hasAttribute('open'), false);
  } finally { aula.dispose(); }
});

test('Copias ajenas y almacenamiento bloqueado no rompen el aula', () => {
  const data = {...freshProgress(COURSE), courseId:'otro'};
  const {document, aula} = harness(JSON.stringify(data));
  try {
    assert.ok(document.querySelector('canvas'));
    assert.match(document.getElementById('appStatus').textContent, /recuperar/);
    assert.deepEqual(aula.progress.studied, []);
  } finally { aula.dispose(); }
});

test('Los modelos iniciales corresponden al tema y no al laboratorio genérico', () => {
  const {document, aula} = harness();
  try {
    for (const id of ['hipergeometrica','geometrica-negativa','exponencial','gamma','cauchy-weibull','familia-exponencial']) {
      aula.navigate(id, 'lab');
      assert.equal(document.querySelector('#lessonLab select').value, LESSON_LAB_PRESETS[id].family);
    }
  } finally { aula.dispose(); }
});

test('Consultar la solución justo antes de responder cuenta como ayuda', () => {
  const {document, aula, submit} = harness();
  try {
    aula.navigate('sucesos', 'practice');
    const question = aula.exercise.questions[0];
    document.querySelector(`[data-solution="${question.id}"]`).open = true;
    document.getElementById(`answer-${question.id}`).value = String(question.answer);
    submit(document.querySelector(`[data-grade-form="${question.id}"]`));
    assert.equal(progressSummary(aula.progress).assisted, 1);
    assert.equal(progressSummary(aula.progress).independent, 0);
  } finally { aula.dispose(); }
});

test('Cada lección abre primero su ejercicio principal y conserva el orden pedagógico', () => {
  const {document, aula} = harness();
  try {
    for (const lesson of LESSONS) {
      aula.navigate(lesson.id, 'practice');
      assert.equal(aula.exercise.type, lesson.exerciseTypes[0], lesson.id);
      assert.deepEqual([...document.querySelectorAll('#exerciseType option')].map(option => option.value), lesson.exerciseTypes);
    }
  } finally { aula.dispose(); }
});

function versionFixture() {
  const root = mkdtempSync(join(tmpdir(), 'inferencia-assets-'));
  cpSync(new URL('../../pages/inferencia/', import.meta.url), join(root, 'pages', 'inferencia'), {recursive:true});
  cpSync(new URL('../../pages/inferencia-estadistica.html', import.meta.url), join(root, 'pages', 'inferencia-estadistica.html'));
  return root;
}

test('El versionado de recursos es determinista e idempotente', () => {
  const root = versionFixture();
  try {
    const first = versionAssets(root);
    assert.equal(Object.keys(first.versions).length, 13);
    assert.deepEqual(versionAssets(root).changed, []);
    const generated = readFileSync(join(root, 'pages', 'inferencia-estadistica.html'), 'utf8');
    for (const match of generated.matchAll(/(?:src|href)="(inferencia\/[^"?]+\.(?:js|css))\?v=([a-f0-9]+)"/g)) {
      assert.equal(match[2], assetVersion(readFileSync(join(root, 'pages', match[1]))));
    }
  } finally { rmSync(root, {recursive:true,force:true}); }
});

test('El versionado propaga cambios del temario al módulo y al HTML', () => {
  const root = versionFixture();
  try {
    const first = versionAssets(root);
    const courseFile = join(root, 'pages', 'inferencia', 'course.js');
    writeFileSync(courseFile, readFileSync(courseFile, 'utf8') + '\n');
    const second = versionAssets(root);
    assert.notEqual(first.versions['inferencia/course.js'], second.versions['inferencia/course.js']);
    assert.notEqual(first.versions['inferencia/app.js'], second.versions['inferencia/app.js']);
    assert.deepEqual(second.changed, ['pages/inferencia/app.js', 'pages/inferencia-estadistica.html']);
    assert.deepEqual(versionAssets(root).changed, []);
  } finally { rmSync(root, {recursive:true,force:true}); }
});

test('Las URLs publicadas llevan la huella actual de todos sus recursos', () => {
  const entry = new URL('../../pages/inferencia-estadistica.html', import.meta.url);
  const {document} = parseHTML(html);
  const assets = [...document.querySelectorAll('script[src],link[rel="stylesheet"]')];
  assert.equal(assets.length, 6);
  for (const element of assets) {
    const url = new URL(element.getAttribute('src') || element.getAttribute('href'), entry);
    assert.equal(url.searchParams.get('v'), assetVersion(readFileSync(url)), `${url.pathname}: ejecuta node version-assets.mjs`);
  }
  const appUrl = new URL('../../pages/inferencia/app.js', import.meta.url);
  const imports = [...readFileSync(appUrl, 'utf8').matchAll(/from ['"]([^'"]+\.js\?v=[a-f0-9]+)['"]/g)];
  assert.equal(imports.length, 6);
  for (const match of imports) {
    const url = new URL(match[1], appUrl);
    assert.equal(url.searchParams.get('v'), assetVersion(readFileSync(url)), `${url.pathname}: ejecuta node version-assets.mjs`);
  }
  const animationUrl = new URL('../../pages/inferencia/animations.js', import.meta.url);
  const storyPath = readFileSync(animationUrl,'utf8').match(/from ['"]([^'"]*lecture-story\.js\?v=[a-f0-9]+)['"]/)[1];
  const storyUrl = new URL(storyPath,animationUrl);
  assert.equal(storyUrl.searchParams.get('v'),assetVersion(readFileSync(storyUrl)));
});

test('Cambiar el guion hablado renueva su URL, el reproductor y el HTML',()=>{
  const root=versionFixture();
  try{
    const before=versionAssets(root);
    const file=join(root,'pages','inferencia','lecture-story.js');
    writeFileSync(file,readFileSync(file,'utf8')+'\n');
    const after=versionAssets(root);
    for(const asset of ['lecture-story.js','animations.js','app.js']) assert.notEqual(after.versions[`inferencia/${asset}`],before.versions[`inferencia/${asset}`]);
    assert.deepEqual(after.changed,['pages/inferencia/animations.js','pages/inferencia/app.js','pages/inferencia-estadistica.html']);
    assert.deepEqual(versionAssets(root).changed,[]);
  }finally{rmSync(root,{recursive:true,force:true});}
});