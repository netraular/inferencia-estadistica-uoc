import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync, readFileSync, readdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import {lessonStory, storyScene, storyLines} from '../pages/inferencia/lecture-story.js';
import {generateExercise} from '../pages/inferencia/exercises.js';
import {exportNarration} from '../scripts/tts/export-narration.mjs';
import {exportLectures} from '../data-src/inferencia-estadistica/export-lecturas.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const lessons = COURSE.units.flatMap(unit => unit.lessons);

test('opt-in TTS export uses all 118 stable section animation IDs and exact natural cues', async context => {
  const root = mkdtempSync(join(tmpdir(), 'section-narration-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const original = structuredClone(COURSE);
  const result = await exportNarration(root, {sections: true});
  const exported = JSON.parse(readFileSync(join(root, 'lecturas.json'), 'utf8'));
  assert.equal(result.mode, 'sections');
  assert.equal(result.parent_lesson_count, 36);
  assert.equal(result.lectures, 118);
  assert.equal(result.scenes, 118);
  assert.equal(new Set(exported.map(lecture => lecture.id)).size, 118);
  assert.equal(result.cues, exported.reduce((total, lecture) => total + lecture.scenes[0].cues.length, 0));
  assert.deepEqual(result.course.units.flatMap(unit => unit.lessons).map(lesson => lesson.id), exported.map(lecture => lecture.id));
  for (const lesson of lessons) for (const section of createLessonSections(lesson)) {
    const lecture = exported.find(entry => entry.id === section.animation.id);
    assert.equal(lecture.id, `${lesson.id}--${section.id}`);
    assert.equal(lecture.parentLesson, lesson.id);
    assert.equal(lecture.parentTitle, lesson.title);
    assert.equal(lecture.sectionId, section.id);
    assert.equal(lecture.title, section.title);
    assert.equal(lecture.optional, section.optional);
    assert.deepEqual(lecture.source, lesson.source);
    assert.deepEqual(lecture.sourceSections, section.sourceSections);
    assert.equal(lecture.scenes.length, 1);
    assert.equal(lecture.scenes[0].story, true);
    assert.equal(lecture.scenes[0].caption, section.animation.steps[0].caption);
    assert.deepEqual(lecture.scenes[0].cues, section.animation.steps[0].cues);
    assert.equal(readFileSync(join(root, lecture.transcript), 'utf8'), section.animation.steps[0].caption);
    assert.ok(!/[\\{}=^_]/.test(lecture.scenes[0].caption), lecture.id);
  }
  assert.deepEqual(COURSE, original);
  const repeated = join(root, 'repeated');
  await exportNarration(repeated, {sections: true});
  assert.deepEqual(readFileSync(join(repeated, 'lecturas.json')), readFileSync(join(root, 'lecturas.json')));
});

test('default TTS exporter leaves the full 36-lesson global reading export byte-identical', async context => {
  const root = mkdtempSync(join(tmpdir(), 'global-narration-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const previous = join(root, 'previous');
  const current = join(root, 'current');
  const expected = exportLectures(previous);
  const {course, ...actual} = await exportNarration(current);
  assert.equal(actual.lectures, 36);
  assert.deepEqual({...actual, destination: previous}, expected);
  assert.equal(course.units.flatMap(unit => unit.lessons).length, 36);
  assert.deepEqual(readdirSync(current), readdirSync(previous));
  for (const filename of readdirSync(previous)) {
    assert.deepEqual(readFileSync(join(current, filename)), readFileSync(join(previous, filename)), filename);
  }
});

function withStatistics(callback) {
  const previous = globalThis.jStat;
  try {
    globalThis.jStat = require('jstat').jStat;
    return callback();
  } finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
}

function trapezoidArea(points) {
  return points.slice(1).reduce((area, point, index) => {
    const previous = points[index];
    return area + (point[0] - previous[0]) * (point[1] + previous[1]) / 2;
  }, 0);
}

function topLevelEqualityCount(tex) {
  let depth = 0;
  let count = 0;
  for (let index = 0; index < tex.length; index++) {
    const character = tex[index];
    if (character === '\\') index++;
    else if (character === '{') depth++;
    else if (character === '}') depth--;
    else if (character === '=' && depth === 0) count++;
  }
  return count;
}

test('all 36 lessons cover every original title and preserve optional sections separately', () => {
  assert.equal(lessons.length, 36);
  let sectionCount = 0;
  let sceneCount = 0;
  const animationIds = new Set();
  for (const lesson of lessons) {
    const sections = createLessonSections(lesson);
    assert.ok(sections.length >= 3, lesson.id);
    const covered = new Set();
    const localIds = new Set();
    for (const section of sections) {
      assert.match(section.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(!localIds.has(section.id), `${lesson.id}: ${section.id}`);
      localIds.add(section.id);
      assert.ok(section.title.trim());
      assert.ok(section.sourceSections.length > 0, `${lesson.id}: ${section.id}`);
      const sources = section.sourceSections.map(title => {
        const source = lesson.sections.find(entry => entry.title === title);
        assert.ok(source, `${lesson.id}: ${title}`);
        covered.add(title);
        return source;
      });
      assert.equal(section.optional, sources.every(source => Boolean(source.optional)));
      assert.ok(sources.every(source => Boolean(source.optional) === section.optional));
      assert.equal(section.animation.id, `${lesson.id}--${section.id}`);
      assert.ok(!animationIds.has(section.animation.id));
      animationIds.add(section.animation.id);
      assert.equal(section.animation.kind, 'lecture');
      assert.equal(section.animation.title, section.title);
      assert.deepEqual(section.animation.source, lesson.source);
      assert.ok(section.animation.steps.length > 0);
      sceneCount += section.animation.steps.length;
    }
    for (const source of lesson.sections) assert.ok(covered.has(source.title), `${lesson.id}: ${source.title}`);
    sectionCount += sections.length;
  }
  assert.equal(sectionCount, 118);
  assert.equal(sceneCount, 118);
  const optional = createLessonSections(lessons.find(lesson => lesson.id === 'momentos-transformaciones')).filter(section => section.optional);
  assert.equal(optional.length, 1);
  assert.deepEqual(optional[0].sourceSections, ['Cambiar la variable cambia su distribución']);
  assert.equal(optional[0].exercise, null);
});

test('sections are deterministic, do not require a statistics global and do not mutate COURSE', () => {
  const previous = globalThis.jStat;
  const snapshot = structuredClone(COURSE);
  try {
    delete globalThis.jStat;
    for (const lesson of lessons) assert.deepEqual(createLessonSections(lesson), createLessonSections(lesson), lesson.id);
    assert.deepEqual(COURSE, snapshot);
  } finally {
    if (previous !== undefined) globalThis.jStat = previous;
  }
});

test('each whiteboard reveals meaningful visual content sequentially after spoken introductions', () => {
  for (const lesson of lessons) for (const section of createLessonSections(lesson)) for (const scene of section.animation.steps) {
    const context = `${lesson.id}: ${section.id}`;
    assert.equal(scene.kind, 'lesson', context);
    assert.equal(scene.story, true, context);
    assert.ok(scene.caption.trim(), context);
    assert.ok(scene.cues.length >= 4, context);
    assert.ok(scene.visual.lines.length >= 2, context);
    assert.deepEqual(storyLines(scene, 0), [], context);
    const revealCues = new Set(scene.visual.lines.map(line => line.cue));
    assert.ok(revealCues.size >= 2, context);
    let previousEnd = 0;
    let previousLines = [];
    for (const [index, cue] of scene.cues.entries()) {
      assert.ok(cue.text.trim(), context);
      assert.equal(cue.start, previousEnd, context);
      assert.ok(Number.isFinite(cue.end) && cue.end > cue.start, context);
      assert.ok(cue.end - cue.start >= 3 - 1e-9, context);
      previousEnd = cue.end;
      const visible = storyLines(scene, index);
      assert.deepEqual(visible.slice(0, previousLines.length), previousLines, context);
      previousLines = visible;
    }
    assert.equal(scene.duration, previousEnd, context);
    assert.deepEqual(previousLines, scene.visual.lines, context);
    for (const line of scene.visual.lines) {
      assert.ok(Number.isInteger(line.cue) && line.cue > 0 && line.cue < scene.cues.length, context);
      assert.ok(line.tex?.trim() || line.value?.trim() || line.plot, context);
    }
  }
});

test('standardized moments reveal concrete calculations after their spoken introductions', () => {
  const lesson = lessons.find(entry => entry.id === 'momentos-transformaciones');
  const section = createLessonSections(lesson).find(entry => entry.id === 'estandarizacion-y-existencia');
  assert.equal(section.animation.steps.length, 1);
  const scene = section.animation.steps[0];
  const calculations = [
    [String.raw`\frac{\mu_k}{\sigma^k}`, /Mu sub ka nombra el momento central/],
    [String.raw`\frac{(-2)^3+2^3}{2}=0`, /tercer momento central promediamos los cubos/],
    [String.raw`\frac{\mu_3}{\sigma^3}=\frac0{2^3}`, /tercer momento cero entre sigma al cubo/],
    [String.raw`\frac{(-2)^4+2^4}{2}=16`, /cuarto momento central usamos las cuartas potencias/],
    [String.raw`\frac{\mu_4}{\sigma^4}=\frac{16}{2^4}`, /cuarto momento dieciséis entre sigma a la cuarta/],
    [String.raw`16/16=1`, /Dieciséis dividido entre dieciséis da uno/]
  ];
  let previousCue = 0;
  for (const [tex, spoken] of calculations) {
    const line = scene.visual.lines.find(entry => entry.tex === tex);
    assert.ok(line, tex);
    assert.ok(line.cue > previousCue, tex);
    assert.match(scene.cues.slice(previousCue, line.cue).map(cue => cue.text).join(' '), spoken, tex);
    assert.ok(!storyLines(scene, line.cue - 1).some(entry => entry.tex === tex), tex);
    assert.ok(storyLines(scene, line.cue).some(entry => entry.tex === tex), tex);
    previousCue = line.cue;
  }
  const example = scene.visual.lines.find(line => line.label === 'Ejemplo equiprobable');
  assert.ok(example.cue > scene.visual.lines[0].cue && example.cue < scene.visual.lines[2].cue);
  assert.equal(example.value, 'X: 0 o 4; media: 2; desviaciones: -2 y 2; sigma: 2');
  const zeroDeviation = scene.visual.lines.find(line => line.label === 'Desviación nula');
  assert.ok(zeroDeviation.cue > previousCue);
  assert.match(zeroDeviation.value, /sigma: 0; estandarización no definida/);
});

test('equality counting ignores braced indices and escaped signs but rejects actual chains', () => {
  const cases = [
    [String.raw`\sum_{i=1}^{3}a_i=a_1+a_2+a_3`, 1],
    [String.raw`\sum_{i=1}^{3}a_i=a_1+a_2+a_3=9`, 2],
    [String.raw`\widehat p_n=\frac1n\sum_{i=1}^n I_A^{(i)}`, 1],
    [String.raw`a_{i={j=1}}=b`, 1],
    [String.raw`\frac{a=b}{c=d}=e`, 1],
    [String.raw`a\=b=c`, 1],
    [String.raw`a\\=b=c`, 2],
    [String.raw`\{a=b\}=c`, 2],
    [String.raw`a=b=c`, 2],
    [String.raw`a=(b=c)`, 2],
    [String.raw`a=[b=c]`, 2],
    [String.raw`E[X]=np=3\cdot\tfrac12`, 2]
  ];
  for (const [tex, expected] of cases) assert.equal(topLevelEqualityCount(tex), expected, tex);
});

test('every formula renders and no reveal contains chained equalities', () => {
  let formulaCount = 0;
  for (const lesson of lessons) for (const section of createLessonSections(lesson)) for (const scene of section.animation.steps) {
    for (const line of scene.visual.lines) {
      if (!line.tex) continue;
      assert.ok(topLevelEqualityCount(line.tex) <= 1, `${lesson.id}: ${line.tex}`);
      assert.doesNotThrow(() => katex.renderToString(line.tex, {throwOnError:true}), `${lesson.id}: ${line.tex}`);
      formulaCount++;
    }
  }
  assert.ok(formulaCount > 250);
});

test('plot coordinates, bars and shaded regions are finite and consistent with the shown examples', () => {
  let plotCount = 0;
  for (const lesson of lessons) for (const section of createLessonSections(lesson)) for (const scene of section.animation.steps) {
    for (const line of scene.visual.lines) {
      const context = `${lesson.id}: ${section.id}`;
      if (line.bar) {
        assert.ok(Number.isFinite(line.bar.total) && line.bar.total > 0, context);
        assert.ok(Number.isFinite(line.bar.part) && line.bar.part >= 0 && line.bar.part <= line.bar.total, context);
      }
      if (!line.plot) continue;
      const graphic = line.plot;
      plotCount++;
      assert.ok(graphic.xLabel.trim() && graphic.yLabel.trim(), context);
      assert.ok(graphic.points.length >= 2, context);
      assert.ok(graphic.points.at(-1)[0] > graphic.points[0][0], context);
      assert.ok(graphic.points.some(point => point[1] > 0), context);
      graphic.points.forEach((point, index) => {
        assert.equal(point.length, 2, context);
        assert.ok(point.every(Number.isFinite), context);
        assert.ok(point[1] >= 0, context);
        if (index) assert.ok(point[0] >= graphic.points[index - 1][0], context);
      });
      if (graphic.shade) {
        assert.ok(graphic.shade.every(Number.isFinite), context);
        assert.ok(graphic.shade[0] >= graphic.points[0][0], context);
        assert.ok(graphic.shade[1] <= graphic.points.at(-1)[0], context);
        assert.ok(graphic.shade[1] > graphic.shade[0], context);
      }
      if (graphic.cut !== undefined) {
        assert.ok(graphic.cut >= 0 && graphic.cut <= graphic.points.at(-1)[0], context);
        assert.equal(graphic.points[0][1], graphic.points.at(-1)[0], context);
        assert.equal(graphic.points.at(-1)[1], 0, context);
      }
    }
  }
  assert.ok(plotCount >= 20);
  const calculus = createLessonSections(lessons.find(lesson => lesson.id === 'calculo'));
  const constant = calculus[0].animation.steps[0].visual.lines.find(line => line.plot).plot;
  assert.equal(trapezoidArea(constant.points), 1);
  const conditional = createLessonSections(lessons.find(lesson => lesson.id === 'conjunta-condicional'));
  const cut = conditional[2].animation.steps[0].visual.lines.find(line => line.plot).plot;
  assert.equal(trapezoidArea(cut.points), 1);
  assert.equal((cut.shade[1] - cut.shade[0]) * cut.points[0][1], 0.5);
});

test('practice descriptors use existing seed-one questions within the lesson scope', () => withStatistics(() => {
  const generated = new Map();
  for (const lesson of lessons) for (const section of createLessonSections(lesson)) {
    if (!section.exercise) continue;
    const activity = section.exercise;
    assert.equal(activity.type, lesson.exerciseTypes[0], lesson.id);
    assert.equal(activity.seed, 1, lesson.id);
    assert.ok(activity.questionIds.length > 0);
    assert.equal(new Set(activity.questionIds).size, activity.questionIds.length);
    if (!generated.has(activity.type)) generated.set(activity.type, generateExercise(activity.type, 1));
    const ids = new Set(generated.get(activity.type).questions.map(question => question.id));
    for (const id of activity.questionIds) {
      assert.ok(ids.has(id), `${lesson.id}: ${activity.type}/${id}`);
      const scoped = lesson.exerciseQuestions?.[activity.type];
      if (scoped) assert.ok(scoped.includes(id), `${lesson.id}: ${id}`);
    }
  }
  const proportions = createLessonSections(lessons.find(lesson => lesson.id === 'proporciones'));
  assert.deepEqual(proportions[0].exercise.questionIds, ['proportion']);
  assert.deepEqual(proportions.at(-1).exercise.questionIds, ['micrograms']);
  const bivariate = createLessonSections(lessons.find(lesson => lesson.id === 'normal-bivariante'));
  assert.equal(bivariate[0].exercise, null);
  assert.deepEqual(bivariate[2].exercise.questionIds, ['conditional-mean','conditional-sd']);
  assert.deepEqual(bivariate[3].exercise.questionIds, ['conditional-tail']);
}));

test('new section timing does not change the global story contract or its output', () => withStatistics(() => {
  for (const lesson of lessons) {
    const before = lessonStory(lesson);
    const sections = createLessonSections(lesson);
    assert.deepEqual(lessonStory(lesson), before, lesson.id);
    assert.ok(sections.every(section => !before.some(scene => scene.caption === section.animation.steps[0].caption)), lesson.id);
  }
  const beats = [{say:'Nombramos la cantidad antes de calcular.'}, {say:'Ahora multiplicamos dos por tres.', show:[{tex:'2\\cdot3=6'}]}];
  const ordinary = storyScene('Ejemplo', 'Ejemplo', beats);
  assert.equal(ordinary.visual.lines[0].cue, 1);
  assert.equal(ordinary.cues[0].end, 3);
}));

test('changing returned visual data cannot modify a later section or call', () => {
  const lesson = lessons.find(entry => entry.id === 'calculo');
  const expected = createLessonSections(lesson);
  const changed = createLessonSections(lesson);
  const line = changed[0].animation.steps[0].visual.lines.find(entry => entry.plot);
  line.plot.points[0][1] = 999;
  changed[0].animation.steps[0].cues[0].text = 'Otra frase';
  changed[0].sourceSections[0] = 'Otro origen';
  changed[1].exercise.questionIds.push('otra-pregunta');
  assert.deepEqual(createLessonSections(lesson), expected);
  const proportions = lessons.find(entry => entry.id === 'proporciones');
  const baseline = createLessonSections(proportions);
  createLessonSections(proportions)[0].animation.steps[0].visual.lines.find(entry => entry.bar).bar.part = 999;
  assert.deepEqual(createLessonSections(proportions), baseline);
});

test('unknown lessons and uncovered source sections fail explicitly', () => {
  assert.throws(() => createLessonSections(null), TypeError);
  assert.throws(() => createLessonSections({...lessons[0], id:'unknown'}), RangeError);
  assert.throws(() => createLessonSections({...lessons[0], sections:[...lessons[0].sections, {title:'Nueva teoría requerida', body:'<p>Contenido nuevo.</p>'}]}), /Sección sin guion/);
});