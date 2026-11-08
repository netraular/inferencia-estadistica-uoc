test('La resolución revela cada operación sin perder la interpretación ni registrar ayuda', () => {
  const {document, aula, click, change} = harness();
  try {
    aula.setView('practice');
    document.getElementById('exerciseSource').value = 'synthetic';
    change(document.getElementById('exerciseSource'));
    assert.equal(document.getElementById('practiceMode').value, 'observe');
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
    assert.equal(aula.progress, undefined);
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
import {getPdfExercises} from '../../pages/inferencia/pdf-exercises.js';
import {createTutorFrames} from '../../pages/inferencia/exercise-tutor.js';
import {LESSONS, VIEWS, LESSON_LAB_PRESETS, parseRoute, escapeHtml, mountAula} from '../../pages/inferencia/app.js';

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
  const saved = new Map(raw ? [['aula-inferencia:v1', raw]] : []);
  const storage = {getItem:key => saved.get(key), setItem:(key, value) => saved.set(key, value)};
  const location = {hash};
  const history = {replaceState(state, title, hash){location.hash = hash;}};
  const aula = mountAula(document, {storage, location, history});
  const click = target => target.dispatchEvent(new window.Event('click', {bubbles:true}));
  const change = target => target.dispatchEvent(new window.Event('change', {bubbles:true}));
  const submit = target => target.dispatchEvent(new window.Event('submit', {bubbles:true,cancelable:true}));
  return {document, window, aula, saved, click, change, submit};
}

test('El tutor visual se abre antes del intento y mantiene los apuntes opcionales', () => {
  const {document,aula,click,change} = harness();
  try {
    aula.navigate('normal','practice');
    assert.equal(document.getElementById('practiceMode').value,'observe');
    const tutor = document.querySelector('[data-exercise-tutor]');
    assert.ok(tutor);
    assert.ok(tutor.querySelector('canvas'));
    assert.ok(tutor.querySelector('.tutor-data').textContent.length>0);
    assert.equal(document.getElementById('practiceAttempt').hidden,true);
    assert.equal(tutor.querySelector('[data-tutor-notes]').hasAttribute('open'),false);
    const initial = tutor.querySelector('[data-tutor-position]').textContent;
    click(tutor.querySelector('[data-tutor-next]'));
    assert.notEqual(tutor.querySelector('[data-tutor-position]').textContent,initial);
    document.getElementById('practiceMode').value = 'practice';
    change(document.getElementById('practiceMode'));
    assert.equal(document.getElementById('practiceAttempt').hidden,false);
    assert.equal(document.querySelector('[data-exercise-tutor]'),null);
    aula.navigate('densidad','practice');
    assert.equal(document.getElementById('practiceMode').value,'observe');
  } finally {aula.dispose();}
});

test('El tutor conserva operaciones validas y deja el resultado para el ultimo paso', () => {
  for (const type of EXERCISE_TYPES) for (const seed of [1,2,17]) {
    const exercise = generateExercise(type.id,seed);
    for (const question of exercise.questions) {
      const frames = createTutorFrames(exercise,question);
      assert.ok(frames.length>=3,`${type.id}/${question.id}`);
      assert.equal(frames[0].tex,'');
      assert.equal(frames.at(-1).result,true);
      assert.equal(frames.filter(frame=>frame.result).length,1);
      for (const frame of frames) if (frame.tex) assert.doesNotThrow(()=>katex.renderToString(frame.tex,{throwOnError:true,trust:false,strict:'ignore'}),`${type.id}/${question.id}: ${frame.tex}`);
    }
  }
});

test('El tutor retrocede, cambia de apartado y libera la reproduccion al salir', () => {
  const {document,window,aula,click,change} = harness();
  const originalInterval=window.setInterval;
  const originalClear=window.clearInterval;
  const timers=new Map();
  let nextTimer=0;
  window.setInterval=callback=>{const id=++nextTimer;timers.set(id,callback);return id;};
  window.clearInterval=id=>timers.delete(id);
  try {
    aula.navigate('normal','practice');
    const tutor=document.querySelector('[data-exercise-tutor]');
    click(tutor.querySelector('[data-tutor-next]'));
    click(tutor.querySelector('[data-tutor-next]'));
    assert.equal(tutor.querySelectorAll('.tutor-equation').length,2);
    click(tutor.querySelector('[data-tutor-previous]'));
    assert.equal(tutor.querySelectorAll('.tutor-equation').length,1);
    click(tutor.querySelector('[data-tutor-play]'));
    assert.equal(timers.size,1);
    timers.values().next().value();
    assert.equal(tutor.querySelectorAll('.tutor-equation').length,2);
    const question=tutor.querySelector('[data-tutor-question]');
    question.value='1';change(question);
    assert.equal(timers.size,0);
    assert.equal(tutor.querySelectorAll('.tutor-equation').length,0);
    click(tutor.querySelector('[data-tutor-play]'));
    aula.setView('theory');
    assert.equal(timers.size,0);
    assert.equal(tutor.innerHTML,'');
    aula.setView('practice');
    const old=aula.exercise.id;
    const oldData=JSON.stringify(aula.exercise.given);
    click(document.querySelector('[data-tutor-practice]'));
    assert.notEqual(aula.exercise.id,old);
    assert.notEqual(JSON.stringify(aula.exercise.given),oldData);
    assert.equal(document.getElementById('practiceMode').value,'practice');
    assert.equal(document.getElementById('practiceAttempt').hidden,false);
  } finally {aula.dispose();window.setInterval=originalInterval;window.clearInterval=originalClear;}
});

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
    assert.equal(lesson.sections.filter(section=>section.introductory).length,2,lesson.id);
    assert.ok(basic.length>2,lesson.id);
    assert.equal(lesson.sections.some(section=>section.optional),lesson.id==='momentos-transformaciones',lesson.id);
    for (const section of lesson.sections.filter(section=>section.introductory)) assert.doesNotMatch(section.body,/en la profundización/,lesson.id);
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
  const {document,aula,change} = harness();
  try {
    assert.ok(document.querySelector('.lesson-notation'));
    assert.equal(document.querySelector('.lesson-depth'),null);
    for (const lesson of LESSONS) {
      aula.navigate(lesson.id,'theory');
      const headings = Array.from(document.querySelectorAll('.theory-article h2'));
      for (const section of lesson.sections.filter(section=>!section.optional)) {
        const heading = headings.find(node=>node.textContent===section.title);
        assert.ok(heading,`${lesson.id}: ${section.title}`);
        assert.equal(heading.closest('details'),null,lesson.id);
      }
    }
    aula.navigate('momentos-transformaciones','theory');
    assert.match(document.querySelector('.lesson-depth').textContent,/Ampliación opcional/);
    aula.navigate('masa','practice');
    document.getElementById('exerciseSource').value = 'synthetic';
    change(document.getElementById('exerciseSource'));
    assert.deepEqual(aula.exercise.questions.map(question=>question.id),['normalizer']);
    assert.match(document.querySelector('.exercise-notation').textContent,/Se lee:/);
  } finally {aula.dispose();}
});

test('La práctica inicial no repite el ejemplo resuelto y conserva variantes al cambiar de vista', () => {
  const {document,aula,click,change} = harness();
  const content = exercise=>({prompt:exercise.prompt,given:exercise.given,questions:exercise.questions.map(question=>question.prompt)});
  try {
    for (const lesson of LESSONS) {
      aula.navigate(lesson.id,'practice');
      document.getElementById('exerciseSource').value = 'synthetic';
      change(document.getElementById('exerciseSource'));
      const type = lesson.exerciseTypes[0];
      const worked = scopeExercise(lesson,generateExercise(type,1));
      const initial = aula.exercise;
      assert.notDeepEqual(content(initial),content(worked),lesson.id);
      click(document.getElementById('newExercise'));
      const variant = aula.exercise;
      aula.setView('theory');
      aula.setView('practice');
      assert.deepEqual(aula.exercise,variant,lesson.id);
      if (lesson.exerciseTypes.length>1) {
        const select = document.getElementById('exerciseType');
        select.value = lesson.exerciseTypes[1];
        change(select);
        assert.equal(aula.exercise.type,lesson.exerciseTypes[1],lesson.id);
        assert.notDeepEqual(content(aula.exercise),content(scopeExercise(lesson,generateExercise(lesson.exerciseTypes[1],1))),lesson.id);
      }
    }
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
    assert.equal(aula.progress, undefined);
    click(document.querySelector('#courseOverview [data-lesson="sucesos"]'));
    assert.equal(aula.route.lessonId, 'sucesos');
    assert.equal(document.getElementById('courseOverview').hidden, true);
    assert.equal(document.getElementById('lessonContent').hidden, false);
    aula.setView('animation');
    click(document.getElementById('overviewToggle'));
    assert.equal(document.querySelectorAll('canvas').length, 0);
    assert.equal(aula.progress, undefined);
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

test('La lectura usa una columna, subtítulo visible y controles compactos',()=>{
  const css=cssTree.parse(readFileSync(new URL('../../pages/inferencia/aula.css',import.meta.url),'utf8'));
  const rule=selector=>{
    const node=css.children.toArray().findLast(item=>item.type==='Rule' && cssTree.generate(item.prelude)===selector);
    assert.ok(node,selector);
    return new Map(node.block.children.toArray().filter(item=>item.type==='Declaration').map(item=>[item.property,cssTree.generate(item.value)]));
  };
  assert.equal(rule('.lecture-layout').get('grid-template-columns'),'minmax(0,1fr)');
  assert.equal(rule('.animation-player .animation-caption').get('position'),'static');
  assert.equal(rule('.animation-player .animation-caption').get('clip-path'),'none');
  assert.equal(rule('.animation-player .animation-caption').get('white-space'),'normal');
  assert.equal(rule('.animation-player .animation-caption').get('width'),'100%');
  assert.equal(rule('.animation-position.sr-only').get('position'),'absolute');
  assert.equal(rule('.animation-position.sr-only').get('clip-path'),'inset(50%)');
  assert.equal(rule('.animation-controls .animation-primary').get('width'),'48px');
  assert.equal(rule('.animation-player.is-focused .lecture-media').get('display'),'block');
  const {document,aula}=harness();
  try{
    aula.navigate('proporciones','animation');
    const media=document.querySelector('.lecture-media');
    assert.ok(media.children[0].classList.contains('animation-stage'));
    assert.equal(media.children[1].className,'animation-controls');
    assert.equal(media.children[2].className,'animation-caption');
    assert.equal(media.nextElementSibling,null);
    assert.equal(document.querySelectorAll('.animation-cues,.animation-options').length,0);
  }finally{aula.dispose();}
});

test('La pizarra fija conserva 16:9 y contiene fórmulas y diagramas sin ampliar el reproductor', () => {
  const css = cssTree.parse(readFileSync(new URL('../../pages/inferencia/aula.css', import.meta.url), 'utf8'));
  const rule = selector => {
    const node = css.children.toArray().find(item => item.type === 'Rule' && cssTree.generate(item.prelude) === selector);
    assert.ok(node, selector);
    return new Map(node.block.children.toArray().filter(item => item.type === 'Declaration').map(item => [item.property, cssTree.generate(item.value)]));
  };
  assert.equal(rule('.animation-stage').get('aspect-ratio'), '16/9');
  assert.equal(rule('.animation-stage').get('contain'), 'layout');
  assert.equal(rule('.animation-stage>canvas,.animation-stage>.animated-whiteboard,.animation-stage>.slide-board,.animation-stage>.animation-math').get('position'), 'absolute');
  assert.equal(rule('.animation-stage.has-context>.slide-board').get('height'), '38%');
  assert.equal(rule('.animation-stage.has-context>.context-diagram,.animation-stage.has-context>.animated-whiteboard').get('height'), '62%');
  const {document, aula} = harness();
  try {
    aula.navigate('normal', 'animation');
    const stage = document.querySelector('.animation-stage');
    const board = stage.querySelector('.slide-board');
    assert.equal(board.style.height || '', '');
    assert.equal(board.style.maxHeight || '', '');
    assert.equal(stage.querySelector('.animated-whiteboard'), null);
  } finally {aula.dispose();}
});

test('Published modules and imports use existing .js paths', () => {
  const directory = new URL('../../pages/inferencia/', import.meta.url);
  const files = readdirSync(directory).filter(file => /\.(?:mjs|js)$/.test(file)).sort();
  assert.deepEqual(files, ['animations.js','app.js','capstone.js','context-diagram.js','course.js','exercise-tutor.js','exercises.js','labs.js','lecture-story.js','lesson-sections.js','lesson-visuals.js','pdf-exercises.js','teaching.js']);
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
  const modules = ['app.js','animations.js','labs.js','exercise-tutor.js'].map(file => readFileSync(new URL(`../../pages/inferencia/${file}`, import.meta.url), 'utf8')).join('\n');
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
        assert.equal(document.querySelectorAll('canvas:not(.story-plot):not(.context-diagram)').length, 1);
        assert.equal(document.querySelectorAll('canvas.context-diagram').length, view === 'animation' ? 1 : 0);
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

test('Navegación siguiente/anterior sin marcas ni escrituras de progreso', () => {
  const {document, aula, saved, click} = harness();
  try {
    assert.equal(document.getElementById('previousLesson').disabled, true);
    assert.equal(document.getElementById('lessonStudied'), null);
    click(document.getElementById('nextLesson'));
    assert.equal(aula.route.lessonId, 'algebra');
    click(document.getElementById('previousLesson'));
    assert.equal(aula.route.lessonId, 'proporciones');
    assert.equal(aula.progress, undefined);
    assert.equal(saved.size, 0);
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
    assert.match(document.getElementById('knowledgeFeedback').textContent, /Correcto/);
    assert.equal(aula.progress, undefined);
  } finally { aula.dispose(); }
});

test('Práctica corrige respuestas y entradas inválidas sin guardar resultados', () => {
  const {document, aula, saved, click, change, submit} = harness();
  try {
    aula.navigate('sucesos', 'practice');
    document.getElementById('practiceMode').value = 'practice';
    change(document.getElementById('practiceMode'));
    const question = aula.exercise.questions[0];
    const input = document.getElementById(`answer-${question.id}`);
    const form = document.querySelector(`[data-grade-form="${question.id}"]`);
    input.value = 'not-a-number';
    submit(form);
    assert.ok(document.getElementById(`feedback-${question.id}`).classList.contains('incorrect'));
    click(document.querySelector(`[data-hint="${question.id}"]`));
    assert.equal(document.getElementById(`hint-${question.id}`).hidden, false);
    input.value = `${question.answer * 100}%`;
    submit(form);
    assert.match(document.getElementById(`feedback-${question.id}`).textContent, /Correcto/);
    const second = aula.exercise.questions[1];
    document.getElementById(`answer-${second.id}`).value = String(second.answer);
    submit(document.querySelector(`[data-grade-form="${second.id}"]`));
    assert.match(document.getElementById(`feedback-${second.id}`).textContent, /Correcto/);
    assert.equal(saved.size, 0);
    assert.equal(document.getElementById('practiceScore'), null);
    const oldId = aula.exercise.id;
    click(document.getElementById('newExercise'));
    assert.notEqual(aula.exercise.id, oldId);
  } finally { aula.dispose(); }
});

test('Banco completo y modo guiado funcionan sin preferencias de progreso', () => {
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
    assert.equal(document.getElementById('settingsToggle'), null);
    assert.equal(document.querySelector('[data-action="export"]'), null);
    assert.equal(document.querySelector('[data-action="import"]'), null);
    assert.equal(document.querySelector('[data-action="reset"]'), null);
    assert.equal(document.getElementById('progressFile'), null);
    assert.equal(aula.route.view, 'practice');
    click(document.getElementById('dialogClose'));
    assert.equal(document.getElementById('utilityDialog').hasAttribute('open'), false);
  } finally { aula.dispose(); }
});

test('El aula ignora el progreso antiguo sin intentar recuperarlo', () => {
  const raw = JSON.stringify({courseId:'otro', studied:['normal']});
  const {document, aula, saved} = harness(raw);
  try {
    assert.ok(document.querySelector('canvas'));
    assert.equal(document.getElementById('appStatus').textContent, '');
    assert.equal(aula.progress, undefined);
    assert.deepEqual(Array.from(saved.values()), [raw]);
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

test('Consultar la solución permite responder sin registrar ayuda ni puntuación', () => {
  const {document, aula, saved, change, submit} = harness();
  try {
    aula.navigate('sucesos', 'practice');
    document.getElementById('practiceMode').value = 'practice';
    change(document.getElementById('practiceMode'));
    const question = aula.exercise.questions[0];
    document.querySelector(`[data-solution="${question.id}"]`).open = true;
    document.getElementById(`answer-${question.id}`).value = String(question.answer);
    submit(document.querySelector(`[data-grade-form="${question.id}"]`));
    assert.match(document.getElementById(`feedback-${question.id}`).textContent, /Correcto/);
    assert.equal(saved.size, 0);
  } finally { aula.dispose(); }
});

test('Cada lección abre primero su ejercicio principal y conserva el orden pedagógico', () => {
  const {document, aula, change} = harness();
  try {
    for (const lesson of LESSONS) {
      aula.navigate(lesson.id, 'practice');
      const pdfExercises = getPdfExercises(lesson.id);
      assert.equal(document.getElementById('practiceMode').value, 'observe', lesson.id);
      assert.equal(aula.exercise.type, pdfExercises.length ? 'pdf' : lesson.exerciseTypes[0], lesson.id);
      assert.equal(document.getElementById('exerciseSource').value, pdfExercises.length ? 'pdf' : 'synthetic', lesson.id);
      if (pdfExercises.length) assert.equal(aula.exercise.id, pdfExercises[0].id, lesson.id);
      document.getElementById('exerciseSource').value = 'synthetic';
      change(document.getElementById('exerciseSource'));
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
    assert.equal(Object.keys(first.versions).length, 16);
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
  assert.equal(imports.length, 8);
  for (const match of imports) {
    const url = new URL(match[1], appUrl);
    assert.equal(url.searchParams.get('v'), assetVersion(readFileSync(url)), `${url.pathname}: ejecuta node version-assets.mjs`);
  }
  for (const [file, count] of [['animations.js', 2], ['exercise-tutor.js', 1]]) {
    const moduleUrl = new URL(`../../pages/inferencia/${file}`, import.meta.url);
    const imports = [...readFileSync(moduleUrl,'utf8').matchAll(/from ['"]([^'"]+\.js\?v=[a-f0-9]+)['"]/g)];
    assert.equal(imports.length,count);
    for (const match of imports) {
      const url = new URL(match[1],moduleUrl);
      assert.equal(url.searchParams.get('v'),assetVersion(readFileSync(url)));
    }
  }
});

test('Cambiar el guion o los diagramas renueva sus URLs y el HTML',()=>{
  const root=versionFixture();
  try{
    for (const dependency of ['lecture-story.js','context-diagram.js','lesson-visuals.js']) {
      const before=versionAssets(root);
      const file=join(root,'pages','inferencia',dependency);
      writeFileSync(file,readFileSync(file,'utf8')+'\n');
      const after=versionAssets(root);
      const owners=dependency === 'lesson-visuals.js' ? [] : ['animations.js', ...(dependency === 'context-diagram.js' ? ['exercise-tutor.js'] : [])];
      const assets=[dependency,...owners,'app.js'];
      for(const asset of assets) assert.notEqual(after.versions[`inferencia/${asset}`],before.versions[`inferencia/${asset}`]);
      assert.deepEqual(after.changed,[...owners.map(file=>`pages/inferencia/${file}`),'pages/inferencia/app.js','pages/inferencia-estadistica.html']);
      assert.deepEqual(versionAssets(root).changed,[]);
    }
  }finally{rmSync(root,{recursive:true,force:true});}
});