import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync, readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {createCanvas} from '@napi-rs/canvas';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import {generateExercise, gradeAnswer, scopeExercise} from '../pages/inferencia/exercises.js';
import {getPdfExercises, PDF_EXERCISE_CATALOGUE} from '../pages/inferencia/pdf-exercises.js';
import {createTutorFrames, drawTutorFigure} from '../pages/inferencia/exercise-tutor.js';
import {mountAula, readParagraphs} from '../pages/inferencia/app.js';
import {createLessonAnimation} from '../pages/inferencia/animations.js';
import {freshProgress, loadProgress, progressSummary, STORAGE_KEY} from '../pages/inferencia/progress.js';
import {notationHtml} from '../pages/inferencia/teaching.js';

const require = createRequire(import.meta.url);
const jStat = require('jstat').jStat;
const katex = require('katex');
const expectedCounts = {
  'pdf-u1-1':5, 'pdf-u1-2':4, 'pdf-u1-3':3, 'pdf-u1-4':4, 'pdf-u1-5':2,
  'pdf-u2-2.1':3, 'pdf-u2-2.2':6, 'pdf-u2-2.3':22, 'pdf-u2-2.4':1,
  'pdf-u2-2.5':3, 'pdf-u2-2.6':4, 'pdf-u2-2.7':3, 'pdf-u2-2.8':4, 'pdf-u2-2.9':1,
  'pdf-u3-1':2, 'pdf-u3-2':2, 'pdf-u3-3':2, 'pdf-u3-4':2,
  'pdf-u3-5':2, 'pdf-u3-6':2, 'pdf-u3-7':4, 'pdf-u3-8':6
};

function withStatistics(action) {
  const previous = globalThis.jStat;
  globalThis.jStat = jStat;
  try {return action();}
  finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
}

function close(actual, expected, context, tolerance = 1e-9) {
  assert.ok(Number.isFinite(actual),context);
  assert.ok(Math.abs(actual-expected) <= tolerance,`${context}: ${actual} != ${expected}`);
}

function binomialMass(total, probability, selected) {
  let value = (1-probability)**total;
  for (let index = 0; index < selected; index++) value *= (total-index)/(index+1)*probability/(1-probability);
  return value;
}

function poissonMass(rate, selected) {
  let value = Math.exp(-rate);
  for (let index = 1; index <= selected; index++) value *= rate/index;
  return value;
}

function poissonCdf(rate, selected) {
  let mass = Math.exp(-rate);
  let total = mass;
  for (let index = 1; index <= selected; index++) {
    mass *= rate/index;
    total += mass;
  }
  return total;
}

function standardNormalCdf(value) {
  const end = Math.abs(value);
  const subdivisions = 2048;
  const width = end/subdivisions;
  const density = position => Math.exp(-(position**2)/2)/Math.sqrt(2*Math.PI);
  let sum = density(0)+density(end);
  for (let index = 1; index < subdivisions; index++) sum += (index % 2 ? 4:2)*density(index*width);
  return 0.5+Math.sign(value)*sum*width/3;
}

function standardNormalQuantile(probability) {
  let lower = -8;
  let upper = 8;
  for (let iteration = 0; iteration < 70; iteration++) {
    const middle = (lower+upper)/2;
    if (standardNormalCdf(middle) < probability) lower = middle;
    else upper = middle;
  }
  return (lower+upper)/2;
}

function checkDiagram(diagram) {
  assert.ok(diagram && typeof diagram === 'object');
  assert.ok(['bars','matrix','region','normal','curve'].includes(diagram.kind));
  if (diagram.kind === 'bars') {
    assert.ok(diagram.labels.length > 0);
    assert.equal(diagram.labels.length,diagram.values.length);
    assert.ok(diagram.values.every(Number.isFinite));
    for (const index of diagram.highlight) assert.ok(Number.isInteger(index) && index >= 0 && index < diagram.labels.length);
  } else if (diagram.kind === 'matrix') {
    assert.equal(diagram.values.length,diagram.rows.length);
    assert.ok(diagram.rows.length > 0 && diagram.columns.length > 0);
    for (const row of diagram.values) {
      assert.equal(row.length,diagram.columns.length);
      assert.ok(row.every(Number.isFinite));
    }
    for (const [row,column] of diagram.highlight) {
      assert.ok(Number.isInteger(row) && row >= 0 && row < diagram.rows.length);
      assert.ok(Number.isInteger(column) && column >= 0 && column < diagram.columns.length);
    }
  } else if (diagram.kind === 'region') {
    assert.ok(diagram.points.length >= 3);
    for (const point of [...diagram.points,...(diagram.cut || [])]) {
      assert.equal(point.length,2);
      assert.ok(point.every(Number.isFinite));
    }
  } else if (diagram.kind === 'curve') {
    assert.ok(diagram.label);
    assert.ok(diagram.domain.every(Number.isFinite) && diagram.domain[0] < diagram.domain[1]);
    assert.ok(diagram.range.every(Number.isFinite) && diagram.range[0] < diagram.range[1]);
    assert.ok(diagram.points.length > 100);
    for (const [index,point] of diagram.points.entries()) {
      assert.equal(point.length,2);
      assert.ok(point.every(Number.isFinite));
      assert.ok(point[0] >= diagram.domain[0] && point[0] <= diagram.domain[1]);
      assert.ok(point[1] >= diagram.range[0] && point[1] <= diagram.range[1]);
      if (index) assert.ok(point[0] > diagram.points[index-1][0]);
    }
    for (const tick of diagram.ticks) assert.ok(Number.isFinite(tick) && tick >= diagram.domain[0] && tick <= diagram.domain[1]);
  } else {
    assert.ok(Number.isFinite(diagram.mean) && Number.isFinite(diagram.sd) && diagram.sd > 0);
    if (diagram.lower !== undefined) assert.ok(Number.isFinite(diagram.lower));
    if (diagram.upper !== undefined) assert.ok(Number.isFinite(diagram.upper));
    if (diagram.lower !== undefined && diagram.upper !== undefined) assert.ok(diagram.lower <= diagram.upper);
  }
}

test('catalogue imports without jStat and distribution construction is lazy', async () => {
  const previous = globalThis.jStat;
  delete globalThis.jStat;
  try {
    const module = await import('../pages/inferencia/pdf-exercises.js?lazy-contract');
    assert.equal(module.PDF_EXERCISE_CATALOGUE.length,22);
    assert.deepEqual(module.getPdfExercises('not-a-lesson'),[]);
    assert.ok(module.getPdfExercises('sucesos').length > 0);
    assert.throws(() => module.getPdfExercises('normal'),/globalThis\.jStat/);
  } finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
});

test('all 22 numbered problems retain provenance and map only to existing lessons', () => withStatistics(() => {
  const lessonIds = new Set(COURSE.units.flatMap(unit => unit.lessons.map(lesson => lesson.id)));
  const exercises = getPdfExercises();
  assert.deepEqual(exercises.map(exercise => exercise.id).sort(),Object.keys(expectedCounts).sort());
  assert.equal(new Set(exercises.map(exercise => exercise.id)).size,22);
  assert.equal(exercises.reduce((total,exercise) => total+exercise.questions.length,0),87);
  const files = [
    ['Ejercicios_Unidad_1-Soluciones.pdf',5,7,['1','2','3','4','5']],
    ['Ejercicios_Unidad_2-Soluciones.pdf',9,25,Array.from({length:9},(_,index) => `2.${index+1}`)],
    ['Ejercicios_U3-Distribuciones_multivariantes-SOLUCIONES.pdf',8,18,Array.from({length:8},(_,index) => String(index+1))]
  ];
  for (const [file,count,pages,numbers] of files) {
    const selected = exercises.filter(exercise => exercise.source.file === file);
    assert.equal(selected.length,count);
    assert.deepEqual(selected.map(exercise => exercise.source.number),numbers);
    assert.ok(existsSync(new URL(`../static/materiales/${file}`,import.meta.url)));
    for (const exercise of selected) assert.ok(Number.isInteger(exercise.source.page) && exercise.source.page >= 1 && exercise.source.page <= pages);
  }
  for (const exercise of exercises) {
    assert.equal(exercise.questions.length,expectedCounts[exercise.id]);
    assert.equal(exercise.type,'pdf');
    assert.ok(exercise.title && exercise.prompt);
    assert.ok(exercise.given.length > 0 && Array.isArray(exercise.assumptions));
    assert.ok(exercise.lessonIds.length > 0);
    assert.equal(new Set(exercise.questions.map(question => question.id)).size,exercise.questions.length);
    for (const lessonId of exercise.lessonIds) {
      assert.ok(lessonIds.has(lessonId),lessonId);
      assert.ok(getPdfExercises(lessonId).some(selected => selected.id === exercise.id));
    }
    assert.doesNotMatch(exercise.source.file,/PEC/i);
  }
  for (const lessonId of lessonIds) {
    assert.deepEqual(getPdfExercises(lessonId).map(exercise => exercise.id),exercises.filter(exercise => exercise.lessonIds.includes(lessonId)).map(exercise => exercise.id));
  }
}));

test('every question has finite grading, ordered whiteboard computations and valid domain diagrams', () => withStatistics(() => {
  for (const exercise of getPdfExercises()) {
    checkDiagram(exercise.visual.params.diagram);
    assert.ok(exercise.questions.some(question => question.tutorSteps.some(step => step.diagram)),exercise.id);
    for (const question of exercise.questions) {
      const context = `${exercise.id}/${question.id}`;
      assert.ok(question.prompt && question.unit && question.hint && question.interpretation,context);
      assert.ok(Number.isFinite(question.answer) && Number.isFinite(question.tolerance) && question.tolerance >= 0,context);
      assert.ok(question.tutorSteps.length > 0,context);
      assert.equal(question.steps.length,question.tutorSteps.length);
      assert.ok(gradeAnswer(question,String(question.answer)).correct,context);
      if (question.unit === 'probabilidad entre 0 y 1') {
        assert.ok(question.answer >= 0 && question.answer <= 1,context);
        assert.ok(gradeAnswer(question,`${100*question.answer}%`).correct,context);
      }
      for (const [index,step] of question.tutorSteps.entries()) {
        assert.ok(step.title && step.comment,context);
        assert.equal(question.steps[index].explanation,step.comment);
        if (step.tex) assert.doesNotThrow(() => katex.renderToString(step.tex,{throwOnError:true,strict:'error'}),`${context}: ${step.tex}`);
        if (step.diagram) checkDiagram(step.diagram);
      }
    }
  }
}));

test('all 87 numerical answers match independent arithmetic or distribution references', () => withStatistics(() => {
  const exactRadiation = binomialMass(150,0.1,10);
  const approximateRadiation = poissonMass(15,10);
  const cutoff = 160+31.4*standardNormalQuantile(0.02);
  const falsePositive = 1-standardNormalCdf((cutoff-80)/10);
  const expected = {
    'pdf-u1-1':{a:4/5,b:7/10,c:1/2,d:1/5,e:1/5},
    'pdf-u1-2':{a:41/100,b:12/100,c:11/100,d:89/100},
    'pdf-u1-3':{a:63/100,'b-A':33/37,'b-B':4/37},
    'pdf-u1-4':{'vpp-20':190/390,'vpn-20':600/610,'vpp-80':760/810,'vpn-80':150/190},
    'pdf-u1-5':{vpp:1428/181050,vpn:818278/818950},
    'pdf-u2-2.1':{pmf:1/2,mean:6/5,variance:19/25},
    'pdf-u2-2.2':{constant:140/223,mean:394/223,variance:137340/49729,'exact-three':28/223,'at-least-one':153/223,'at-most-two':455/669},
    'pdf-u2-2.3':{
      'a-area':1,'b-cdf':3/4,'c-ge':1/4,'c-gt':1/4,'c-point':0,'c-height':1/2,
      'd-under-six':7/16,'d-six-to-twelve':5/16,'d-over-two':0,'e-mean':2/3,'e-variance':2/9,
      'f-constant':1,'f-cdf':1-Math.exp(-1),'f-ge':Math.exp(-1),'f-gt':Math.exp(-1),
      'f-point':0,'f-height':Math.exp(-1),'f-under-six':1-Math.exp(-0.5),
      'f-six-to-twelve':Math.exp(-0.5)-Math.exp(-1),'f-over-two':Math.exp(-2),'f-mean':1,'f-variance':1
    },
    'pdf-u2-2.4':{survivors:[8,9,10].reduce((total,selected) => total+binomialMass(10,0.8,selected),0)},
    'pdf-u2-2.5':{'exact-ten':poissonMass(12,10),'at-least-fifteen':1-poissonCdf(12,14),'at-most-ten':poissonCdf(12,10)},
    'pdf-u2-2.6':{mean:15,'exact-ten':exactRadiation,'approximate-ten':approximateRadiation,'approximation-error':Math.abs(approximateRadiation-exactRadiation)},
    'pdf-u2-2.7':{'under-120':standardNormalCdf(7/4),'90-to-120':standardNormalCdf(7/4)-standardNormalCdf(-2),p25:106+8*standardNormalQuantile(0.25)},
    'pdf-u2-2.8':{cutoff,'false-positive':falsePositive,'healthy-count-factor':falsePositive,posterior:98/(98+900*falsePositive)},
    'pdf-u2-2.9':{'six-and-six':44100/125970},
    'pdf-u3-1':{joint:2/9,cdf:1/3},
    'pdf-u3-2':{joint:1/4,cdf:1/2},
    'pdf-u3-3':{marginal:4/9,'binomial-check':0},
    'pdf-u3-4':{constant:1,reduction:2/3},
    'pdf-u3-5':{'marginal-tail':1/4,'conditional-tail':1/2},
    'pdf-u3-6':{covariance:-2/9,'independence-check':-1/81},
    'pdf-u3-7':{self:2,'impossible-rho':7/4,maximum:4,'perfect-relation':-9},
    'pdf-u3-8':{joint:20/243,mean:2,variance:4/3,covariance:-2/3,'difference-mean':0,'difference-variance':4}
  };
  for (const exercise of getPdfExercises()) {
    assert.deepEqual(exercise.questions.map(question => question.id).sort(),Object.keys(expected[exercise.id]).sort());
    for (const question of exercise.questions) close(question.answer,expected[exercise.id][question.id],`${exercise.id}/${question.id}`);
  }
}));

function sequences(alphabet, length) {
  let values = [''];
  for (let index = 0; index < length; index++) values = values.flatMap(value => alphabet.map(symbol => value+symbol));
  return values;
}

test('joint diagrams aggregate the actual laboratory and coin experiments, including repeated cells', () => withStatistics(() => {
  const exercises = getPdfExercises();
  const laboratories = [[0,0,0],[0,0,0],[0,0,0]];
  for (const sequence of sequences(['A','B','C'],2)) {
    const assignedA = sequence.split('A').length-1;
    const assignedB = sequence.split('B').length-1;
    laboratories[assignedA][assignedB] += 1/9;
  }
  const coins = Array.from({length:4},() => [0,0,0,0]);
  for (const sequence of sequences(['C','X'],3)) {
    const heads = sequence.split('C').length-1;
    const first = sequence.indexOf('C');
    const gain = first < 0 ? -1:first+1;
    coins[heads][[-1,1,2,3].indexOf(gain)] += 1/8;
  }
  for (const [id,expected] of [['pdf-u3-1',laboratories],['pdf-u3-2',coins]]) {
    const exercise = exercises.find(item => item.id === id);
    assert.deepEqual(exercise.visual.params.diagram.values,expected);
    const finalTable = exercise.questions.find(question => question.id === 'joint').tutorSteps.find(step => step.title === 'La tabla conjunta completa');
    assert.deepEqual(finalTable.diagram.values,expected);
    close(expected.flat().reduce((total,mass) => total+mass,0),1,id);
  }
  close(laboratories[0][1],2/9,'BC and CB assign no studies to A');
  close(coins[2][1],1/4,'CCX and CXC share the same pair');
}));

test('the corrected PDF errors are not accepted by the answer contract', () => withStatistics(() => {
  const exercises = getPdfExercises();
  const selected = (exerciseId,questionId) => exercises.find(exercise => exercise.id === exerciseId).questions.find(question => question.id === questionId);
  assert.equal(gradeAnswer(selected('pdf-u2-2.3','d-under-six'),'0.375').correct,false);
  assert.equal(gradeAnswer(selected('pdf-u2-2.3','d-six-to-twelve'),'0.375').correct,false);
  assert.equal(gradeAnswer(selected('pdf-u2-2.7','90-to-120'),'0.9575').correct,false);
  assert.equal(gradeAnswer(selected('pdf-u2-2.7','90-to-120'),'93.71907%').correct,true);
  assert.equal(gradeAnswer(selected('pdf-u2-2.8','posterior'),'0.1038555').correct,false);
  assert.equal(gradeAnswer(selected('pdf-u3-2','joint'),'1/8').correct,false);
}));

test('PDF explanations retain graphical reasoning and both readings of the contradictory reduction', () => withStatistics(() => {
  const exercises = getPdfExercises();
  const survival = exercises.find(exercise => exercise.id === 'pdf-u2-2.3');
  for (const id of ['b-cdf','f-cdf']) {
    const graph = survival.questions.find(question => question.id === id).tutorSteps.find(step => step.title === 'Trazar la acumulada');
    assert.ok(graph,id);
    assert.match(graph.comment,/curva continua/);
    assert.match(graph.comment,/no masas/);
    assert.equal(graph.diagram.kind,'curve');
  }
  const reduction = exercises.find(exercise => exercise.id === 'pdf-u3-4').questions.find(question => question.id === 'reduction');
  close(reduction.answer,2/3,'explicit inequality');
  assert.equal(gradeAnswer(reduction,'1').correct,false);
  const verbal = reduction.tutorSteps.find(step => step.title === 'Resolver la lectura verbal');
  assert.match(verbal.tex,/P\(Y_2\\leq2Y_1\/3\)=1/);
  assert.deepEqual(verbal.diagram.points,[[0,0],[2,0],[2,1]]);
  assert.ok(verbal.diagram.points.every(([initial,final]) => final <= initial/2 && final <= 2*initial/3));
  assert.deepEqual(reduction.tutorSteps.at(-1).diagram.points,[[0,0],[2,0],[2,2/3]]);
}));

test('survival CDFs draw continuous curves at their piecewise coordinates and preserve reverse seek', () => withStatistics(() => {
  const exercise = getPdfExercises().find(item => item.id === 'pdf-u2-2.3');
  for (const id of ['b-cdf','f-cdf']) {
    const question = exercise.questions.find(item => item.id === id);
    const frames = createTutorFrames(exercise,question);
    const position = frames.findIndex(step => step.title === 'Trazar la acumulada');
    const graph = frames[position].diagram;
    const cdf = value => value < 0 ? 0 : id === 'b-cdf' ? value <= 2 ? value-value**2/4 : 1 : 1-Math.exp(-value);
    for (const [value,probability] of graph.points) close(probability,cdf(value),`${id} at ${value}`);
    for (const width of [320,640]) {
      const height = 180;
      const canvas = createCanvas(width,height);
      const context = canvas.getContext('2d');
      drawTutorFigure(context,exercise,question,position,width,height);
      const original = Buffer.from(context.getImageData(0,0,width,height).data);
      for (const value of [-0.5,0.5,1,1.5,2,3.5]) {
        const horizontal = Math.round(45+(value+1)/5*(width-70));
        const vertical = Math.round(height-40-cdf(value)*(height-65));
        const pixels = context.getImageData(horizontal-2,vertical-2,5,5).data;
        assert.ok(Array.from({length:25},(_,index) => index*4).some(index => pixels[index] === 20 && pixels[index+1] === 125 && pixels[index+2] === 104),`${id}: curve at ${value}, width ${width}`);
      }
      drawTutorFigure(context,exercise,question,0,width,height);
      assert.notDeepEqual(Buffer.from(context.getImageData(0,0,width,height).data),original);
      drawTutorFigure(context,exercise,question,position,width,height);
      assert.deepEqual(Buffer.from(context.getImageData(0,0,width,height).data),original);
    }
  }
}));

test('required PDF concepts stay in existing nonoptional course sections', () => {
  const lessons = COURSE.units.flatMap(unit => unit.lessons);
  assert.equal(lessons.length,36);
  for (const [lessonId,title,phrases] of [
    ['axiomas','Reglas que cualquier modelo debe respetar',[/inclusión-exclusión continúa alternando/,/cota de Bonferroni/,/sin suponer independencia/]],
    ['independencia-sucesos','No coexistir y no informar son ideas distintas',[/La independencia se conserva/,/por sus complementos/]],
    ['variable-cdf','La acumulada como lenguaje común',[/variable mixta/,/0,3/,/0,7/,/No basta una densidad ordinaria/]],
    ['masa','Indicadores y frases de recuento',[/indicador del complemento/,/indicador del espacio completo/,/del vacío/]],
    ['esperanza','Un centro de equilibrio, no una promesa',[/Sin especificar una familia/,/no determina la distribución/]],
    ['geometrica-negativa','La condición de parada define la variable',[/mayor que cero y como máximo uno/,/r real positivo/]],
    ['cauchy-weibull','Cauchy: un centro sin media',[/arco tangente de x dividida entre pi/,/probabilidad es un medio/]],
    ['multinomial','Independencia entre ensayos, no entre categorías',[/condición tiene probabilidad positiva/,/n menos m/,/5\/8/,/125\/512/]]
  ]) {
    const section = lessons.find(lesson => lesson.id === lessonId).sections.find(item => item.title === title);
    assert.ok(section,`${lessonId}: ${title}`);
    assert.equal(section.optional,false);
    for (const phrase of phrases) assert.match(section.body,phrase);
  }
  close(1-3*(1-0.9),7/10,'Bonferroni example');
  close(0.3+0.7*(1-Math.exp(0)),3/10,'mixed CDF jump');
  close(0.3+0.7,1,'mixed total probability');
  close((0.5/(1-0.2))**3,125/512,'conditional trinomial example');
  close((Math.atan(1)-Math.atan(-1))/Math.PI,1/2,'Cauchy interval example');
});

function requiredCourseSection(lessonId,title) {
  const lesson = COURSE.units.flatMap(unit => unit.lessons).find(lesson => lesson.id === lessonId);
  const section = lesson.sections.find(section => section.title === title);
  assert.ok(section,`${lessonId}: ${title}`);
  assert.equal(section.optional,false);
  return parseHTML(`<main>${section.body}</main>`).document.querySelector('main');
}

test('dice examples retain the full pair space, both distributions and strict interval endpoints', () => {
  const pairs = Array.from({length:6},(_,first) => Array.from({length:6},(_,second) => [first+1,second+1])).flat();
  assert.equal(pairs.length,36);
  const sumCounts = Array.from({length:11},(_,index) => pairs.filter(([first,second]) => first+second === index+2).length);
  const minimumCounts = Array.from({length:6},(_,index) => pairs.filter(([first,second]) => Math.min(first,second) === index+1).length);
  assert.deepEqual(sumCounts,[1,2,3,4,5,6,5,4,3,2,1]);
  assert.deepEqual(minimumCounts,[11,9,7,5,3,1]);
  const space = requiredCourseSection('variable-cdf','Una regla antes de observar, un valor después').textContent;
  for (const phrase of [/36 pares/,/regulares e independientes/,/\(1,2\) y \(2,1\)/,/1\/6/,/1\/12/,/M = min\(a,b\)/,/recorrido infinito/]) assert.match(space,phrase);
  close(pairs.filter(([first,second]) => first === second).length/36,1/6,'doubles');
  close(pairs.filter(([first,second]) => first+second === 10).length/36,1/12,'sum ten');
  const mass = requiredCourseSection('masa','La probabilidad que vive en puntos').textContent;
  for (const phrase of [/\(s−1\)\/36/,/\(13−s\)\/36/,/no enteros/,/\(1,2,3,4,5,6,5,4,3,2,1\)\/36/,/\(13−2k\)\/36/,/\(11,9,7,5,3,1\)\/36/]) assert.match(mass,phrase);
  for (let index = 0; index < sumCounts.length; index++) assert.equal(sumCounts[index],index <= 5 ? index+1 : 11-index);
  for (let index = 0; index < minimumCounts.length; index++) assert.equal(minimumCounts[index],(6-index)**2-(5-index)**2);
  const cdf = requiredCourseSection('variable-cdf','La acumulada como lenguaje común');
  const rows = Array.from(cdf.querySelectorAll('tbody tr'),row => Array.from(row.querySelectorAll('td'),cell => cell.textContent));
  assert.deepEqual(rows,[['t < 2','0'],...sumCounts.slice(0,-1).map((count,index) => [`${index+2} ≤ t < ${index+3}`,`${sumCounts.slice(0,index+1).reduce((total,value) => total+value,0)}/36`]),['t ≥ 12','1']]);
  const probability = predicate => pairs.filter(([first,second]) => predicate(first+second)).length/36;
  for (const [threshold,numerator] of [[1,0],[2,1],[3.5,3],[6,15],[8.2,26],[12,36],[20,36]]) close(probability(sum => sum <= threshold),numerator/36,`CDF at ${threshold}`);
  close(probability(sum => sum > 2.2 && sum <= 7),20/36,'noninteger lower endpoint');
  close(probability(sum => sum < 6),10/36,'strict upper endpoint');
  close(probability(sum => sum > 2 && sum < 7),14/36,'both strict endpoints');
  for (const phrase of [/P\(X≤8,2\)=26\/36/,/20\/36/,/10\/36/,/14\/36/,/11\/36, 20\/36, 27\/36, 32\/36 y 35\/36/]) assert.match(cdf.textContent,phrase);
  for (let threshold = 0; threshold <= 7; threshold += 0.25) {
    const integer = Math.floor(threshold);
    const expected = threshold < 1 ? 0 : threshold >= 6 ? 1 : 1-(6-integer)**2/36;
    close(pairs.filter(([first,second]) => Math.min(first,second) <= threshold).length/36,expected,`minimum CDF at ${threshold}`);
  }
});

test('dice moments and the source game derive their results independently of the exercise bank', () => {
  const pairs = Array.from({length:6},(_,first) => Array.from({length:6},(_,second) => [first+1,second+1])).flat();
  const average = transform => pairs.reduce((total,[first,second]) => total+transform(first,second),0)/36;
  close(average((first,second) => first+second),7,'sum mean');
  close(average((first,second) => (first+second)**2),329/6,'sum second moment');
  close(average((first,second) => (first+second-7)**2),35/6,'centered sum variance');
  close(average(first => first**2),91/6,'one die second moment');
  close(average(first => (first-3.5)**2),35/12,'one die variance');
  close(average((first,second) => Math.min(first,second)),91/36,'minimum mean');
  close(average((first,second) => Math.min(first,second)**2),301/36,'minimum second moment');
  close(average((first,second) => (Math.min(first,second)-91/36)**2),2555/1296,'minimum variance');
  close(average((first,second) => first+second <= 6 ? 100 : -100),-100/6,'source game expectation');
  close(average((first,second) => first+second <= 6 ? 140 : -100),0,'fair adjusted prize');
  const expectation = requiredCourseSection('esperanza','Transformar antes de promediar').textContent;
  for (const phrase of [/252\/36=7/,/91\/36/,/\+100 €/,/−100 €/,/15\/36/,/21\/36/,/−100\/6/,/140/,/entrada adicional/,/sum\(\(1:6\) \* probabilidades\)/,/strict=True/]) assert.match(expectation,phrase);
  const variance = requiredCourseSection('varianza','Distancias al centro').textContent;
  for (const phrase of [/1974\/36=329\/6/,/35\/6/,/35\/12/,/301\/36/,/2555\/1296/,/puntos cuadrados/,/suficiente, no necesaria/]) assert.match(variance,phrase);
});

test('infinite support separates finite mean, positive infinite mean and undefined Cauchy expectation', () => {
  const body = requiredCourseSection('esperanza','Un centro de equilibrio, no una promesa').textContent;
  for (const phrase of [/2\.15\.10/,/2\.15\.11/,/p=1\/36/,/q=35\/36/,/P\(T=k\)=qk−1p/,/Σk≥1qk=q\/\(1−q\)/,/derivar término a término/,/Σk≥1kqk−1=1\/\(1−q\)2/,/E\[T\]=p\/\(1−q\)2=1\/p=36/,/P\(G=2n\)=2−n/,/E\[G\]=Σn≥12n2−n=Σn≥11=\+∞/,/E\[min\(G,2m\)\]=m\+1/,/X\+=max\(X,0\)/,/X−=max\(−X,0\)/,/ni como \+∞ ni como −∞/,/valor principal simétrico cero/,/log\(1\+A2\)\/\(2π\)/]) assert.match(body,phrase);
  const probability = 1/36;
  let mass = probability;
  let totalMass = 0;
  let mean = 0;
  for (let trial = 1; trial <= 2000; trial++) {
    totalMass += mass;
    mean += trial*mass;
    mass *= 1-probability;
  }
  close(totalMass,1,'waiting distribution normalizes');
  close(mean,36,'waiting mean from direct summation');
  for (const limit of [1,2,4,8,16]) {
    const partialMass = Array.from({length:limit},(_,index) => 2**(-index-1)).reduce((total,value) => total+value,0);
    const partialMean = Array.from({length:limit},(_,index) => 2**(index+1)*2**(-index-1)).reduce((total,value) => total+value,0);
    close(partialMass,1-2**(-limit),'prize probabilities');
    close(partialMean,limit,'unbounded partial expectation');
    close(partialMean+2**limit*(1-partialMass),limit+1,'capped prize including tail');
  }
  const positiveCauchyIntegral = bound => Math.log1p(bound**2)/(2*Math.PI);
  for (const bound of [1,10,100]) {
    assert.ok(positiveCauchyIntegral(bound*10) > positiveCauchyIntegral(bound));
    close(2*positiveCauchyIntegral(bound),Math.log1p(bound**2)/Math.PI,'absolute truncated Cauchy mean');
  }
});

test('Gaussian square completion, marginals and the PDF conditional example keep scales and units', () => {
  const marginal = requiredCourseSection('normal-bivariante','Una campana sobre dos ejes').textContent;
  const conditionalBody = requiredCourseSection('normal-bivariante','Conocer una medida cambia la otra').textContent;
  for (const phrase of [/Completar el cuadrado/,/\(zy−ρzx\)2\+\(1−ρ2\)zx2/,/dy=σY√\(1−ρ2\) du/,/I2=∫02π∫0∞/,/I=√\(2π\)/,/dx=σX√\(1−ρ2\) dv/,/X∼N\(100,225\)/,/Y∼N\(50,100\)/,/0,2419707/,/todavía no es independencia/]) assert.match(marginal,phrase);
  for (const phrase of [/fY\|X\(y\|x\)=f\(x,y\)\/fX\(x\)/,/4\.6\.4/,/Y=60/,/E\[X\|Y=60\]=100\+0,5·\(15\/10\)·\(60−50\)=107,5/,/168,75/,/12,99038/,/unidades de X por unidad de Y/,/unidades de X al cuadrado/,/pnorm\(120/,/norm\.sf\(120/,/0,16796/]) assert.match(conditionalBody,phrase);
  const integrate = (integrand,lower,upper) => {
    const subdivisions = 4096;
    const width = (upper-lower)/subdivisions;
    let total = integrand(lower)+integrand(upper);
    for (let index = 1; index < subdivisions; index++) total += (index % 2 ? 4:2)*integrand(lower+index*width);
    return total*width/3;
  };
  close(integrate(value => Math.exp(-(value**2)/2),-10,10),Math.sqrt(2*Math.PI),'Gaussian integral');
  const joint = (first,second,rho) => Math.exp(-(first**2-2*rho*first*second+second**2)/(2*(1-rho**2)))/(2*Math.PI*Math.sqrt(1-rho**2));
  for (const rho of [-0.5,0,0.5]) for (const first of [-1,0,1]) for (const second of [-2,0,2]) {
    close(first**2-2*rho*first*second+second**2,(second-rho*first)**2+(1-rho**2)*first**2,'square completion');
  }
  for (const rho of [-0.5,0,0.5]) for (const coordinate of [-1,0,1,2]) {
    const density = Math.exp(-(coordinate**2)/2)/Math.sqrt(2*Math.PI);
    close(integrate(value => joint(coordinate,value,rho),-12,12),density,'integrated X marginal');
    close(integrate(value => joint(value,coordinate,rho),-12,12),density,'integrated Y marginal');
  }
  close(integrate(value => joint(1,value,0.5),-12,12),0.2419707,'PDF standard density',5e-8);
  const mean = 100+0.5*(15/10)*(60-50);
  const variance = (1-0.5**2)*15**2;
  close(mean,107.5,'conditional mean');
  close(variance,168.75,'conditional variance');
  close(Math.sqrt(variance),12.99038,'conditional standard deviation',5e-6);
  close(1-standardNormalCdf((120-mean)/Math.sqrt(variance)),0.16796,'conditional upper tail',5e-6);
  const rawJoint = (first,second) => joint((first-100)/15,(second-50)/10,0.5)/(15*10);
  const marginalY = Math.exp(-0.5)/(10*Math.sqrt(2*Math.PI));
  const conditional = value => rawJoint(value,60)/marginalY;
  close(integrate(conditional,-100,300),1,'conditional normalization');
  close(integrate(value => value*conditional(value),-100,300),mean,'conditional first moment');
  close(integrate(value => (value-mean)**2*conditional(value),-100,300),variance,'conditional centered second moment');
});

test('model selection keeps all seven discrete and six continuous families in a required existing body', () => {
  const main = requiredCourseSection('calculo-modelos','Un itinerario para elegir');
  const rows = Array.from(main.querySelectorAll('tbody tr'));
  assert.equal(rows.length,13);
  assert.deepEqual(rows.map(row => row.querySelector('td').textContent.split(':')[0]),['Bernoulli','Binomial','Poisson','Uniforme discreta','Hipergeométrica','Geométrica','Binomial negativa','Uniforme continua','Exponencial','Normal','Gamma','Cauchy estándar','Weibull']);
  for (const phrase of [/sin reemplazo/,/ensayos independientes/,/0<p≤1/,/N=1/,/varianza/,/no una decimocuarta distribución/,/normalidad conjunta/,/categorías excluyentes/,/No existe; no definida/]) assert.match(main.textContent,phrase);
  assert.ok(rows.every(row => row.querySelectorAll('td').length === 3));
});

test('content expansions preserve the 36 lesson IDs and the 118 existing spoken sections', () => {
  const lessons = COURSE.units.flatMap(unit => unit.lessons);
  assert.deepEqual(lessons.map(lesson => lesson.id),['proporciones','algebra','funciones','calculo','regiones-matrices','sucesos','axiomas','combinatoria','condicionada','independencia-sucesos','bayes-diagnostico','variable-cdf','masa','densidad','esperanza','varianza','momentos-transformaciones','bernoulli-binomial','poisson','hipergeometrica','geometrica-negativa','uniforme-montecarlo','exponencial','normal','gamma','cauchy-weibull','calculo-modelos','familia-exponencial','conjunta-discreta','multinomial','marginales','conjunta-condicional','normal-bivariante','independencia-variables','covarianza-matrices','combinaciones-incorrelacion']);
  const sections = lessons.flatMap(lesson => createLessonSections(lesson).map(section => `${lesson.id}--${section.id}`));
  assert.equal(sections.length,118);
  assert.equal(new Set(sections).size,118);
});

test('fresh construction does not accumulate probabilities or reuse mutable question diagrams', () => withStatistics(() => {
  const first = getPdfExercises('conjunta-discreta');
  const expected = structuredClone(first);
  first[0].questions[0].tutorSteps[3].diagram.values[0][0] = 999;
  first[0].visual.params.diagram.values[0][0] = 999;
  assert.deepEqual(getPdfExercises('conjunta-discreta'),expected);
}));

test('PDF frames retain every catalogue beat, the latest diagram and a final boxed result without mutating the source', () => withStatistics(() => {
  for (const exercise of getPdfExercises()) for (const question of exercise.questions) {
    const before = structuredClone(question);
    const frames = createTutorFrames(exercise,question);
    assert.equal(frames[0].tex,'');
    assert.equal(frames[0].comment,question.prompt);
    let previous = 0;
    for (const step of question.tutorSteps) {
      const index = frames.findIndex((item,position) => position > previous && item.title === step.title && item.tex === (step.tex || ''));
      assert.ok(index > previous,`${exercise.id}/${question.id}: ${step.title}`);
      assert.equal(frames[index].comment,step.comment);
      if (step.diagram) assert.deepEqual(frames[index].diagram,step.diagram);
      previous = index;
    }
    for (let index = 1; index < frames.length; index++) {
      if (!question.tutorSteps.some(step => step.title === frames[index].title && step.diagram && (step.tex || '') === frames[index].tex)) assert.deepEqual(frames[index].diagram,frames[index-1].diagram);
      if (frames[index].tex) assert.doesNotThrow(() => katex.renderToString(frames[index].tex,{throwOnError:true}),frames[index].tex);
    }
    assert.equal(frames.at(-1).result,true);
    assert.equal(frames.at(-1).tex,String.raw`\boxed{${Number(question.answer.toPrecision(7)).toString()}}`);
    assert.ok(frames.slice(0,-1).every(step => !step.result));
    assert.deepEqual(question,before);
  }
}));

test('equation chains reveal one top-level equality at a time and never split indexed equalities in braces', () => {
  const tex = String.raw`p_{X=1}=\frac{1+3}{8}=\frac{1}{2}=0.5`;
  const question = {prompt:'Masa',answer:0.5,interpretation:'Una mitad',tutorSteps:[{title:'Simplificar',comment:'Reducir una operacion cada vez.',tex}]};
  const exercise = {type:'pdf',visual:{params:{}}};
  const frames = createTutorFrames(exercise,question);
  assert.deepEqual(frames.slice(1,-1).map(step => step.tex),[
    String.raw`p_{X=1}=\frac{1+3}{8}`,
    String.raw`p_{X=1}=\frac{1+3}{8}=\frac{1}{2}`,
    tex
  ]);
  assert.ok(!frames[1].tex.includes('0.5'));
  const indexed = String.raw`\sum_{i=1}^{n}p_i=1`;
  assert.deepEqual(createTutorFrames(exercise,{...question,tutorSteps:[{title:'Sumar',comment:'Todo el soporte',tex:indexed}]}).slice(1,-1).map(step => step.tex),[indexed]);
  for (const expression of [
    String.raw`\begin{cases}0.30&x=0\\0.70&x=1\end{cases}`,
    String.raw`\begin{pmatrix}x=0&y=1\\x=1&y=0\end{pmatrix}`,
    String.raw`\begin{aligned}A&=\begin{matrix}x=0&y=1\\x=1&y=0\end{matrix}\\B&=1\end{aligned}`
  ]) {
    const equation = String.raw`p_X(x)=${expression}`;
    const chain = String.raw`${equation}=p_Y(x)=p_Z(x)`;
    for (const [source,expected] of [[equation,[equation]],[chain,[equation,String.raw`${equation}=p_Y(x)`,chain]]]) {
      const sourceQuestion = {...question,tutorSteps:[{...question.tutorSteps[0],tex:source}]};
      const before = structuredClone(sourceQuestion);
      const staged = createTutorFrames(exercise,sourceQuestion).slice(1,-1);
      assert.deepEqual(staged.map(step => step.tex),expected);
      for (const step of staged) assert.doesNotThrow(() => katex.renderToString(step.tex,{throwOnError:true}),step.tex);
      assert.deepEqual(sourceQuestion,before);
    }
  }
  const escaped = String.raw`a\=b=c=d`;
  assert.deepEqual(createTutorFrames(exercise,{...question,tutorSteps:[{...question.tutorSteps[0],tex:escaped}]}).slice(1,-1).map(step => step.tex),[String.raw`a\=b=c`,escaped]);
});

test('constructed joint tables start empty and display only the current partial table, including on reverse seek', () => withStatistics(() => {
  for (const id of ['pdf-u3-1','pdf-u3-2']) {
    const exercise = getPdfExercises().find(item => item.id === id);
    const question = exercise.questions.find(item => item.id === 'joint');
    const frames = createTutorFrames(exercise,question);
    assert.ok(frames[0].diagram.values.flat().every(value => value === null));
    const first = frames.findIndex(step => step.title.startsWith('Acumular') && step.tex === question.tutorSteps.find(item => item.title === step.title).tex);
    assert.ok(first > 0);
    assert.notDeepEqual(frames[first].diagram.values,exercise.visual.params.diagram.values);
    const following = frames[first+1];
    assert.deepEqual(following.diagram,frames[first].diagram);
    const canvas = createCanvas(360,150);
    const context = canvas.getContext('2d');
    const pixels = position => {drawTutorFigure(context,exercise,question,position,360,150);return Buffer.from(context.getImageData(0,0,360,150).data);};
    const initial = pixels(0);
    const partial = pixels(first);
    assert.notDeepEqual(initial,partial);
    assert.deepEqual(pixels(first+1),partial);
    assert.notDeepEqual(pixels(frames.length-1),partial);
    assert.deepEqual(pixels(first),partial);
    assert.deepEqual(pixels(0),initial);
  }
}));

test('bars, rectangular matrices, exact polygons with cuts and normal tails draw their catalogue coordinates and highlights', () => withStatistics(() => {
  const draw = diagram => {
    const question = {prompt:'Diagrama',answer:0.5,interpretation:'Resultado',tutorSteps:[{title:'Seleccionar',comment:'Region actual',diagram}]};
    const exercise = {type:'pdf',visual:{params:{diagram}}};
    const canvas = createCanvas(360,150);
    const context = canvas.getContext('2d');
    drawTutorFigure(context,exercise,question,1,360,150);
    return (horizontal,vertical) => Array.from(context.getImageData(Math.floor(horizontal),Math.floor(vertical),1,1).data);
  };
  const bars = draw({kind:'bars',labels:['A','B','C'],values:[2,5,1],highlight:[1]});
  assert.deepEqual(bars(190,105),[189,72,100,255]);
  assert.deepEqual(bars(90,105),[20,125,104,255]);
  const matrix = draw({kind:'matrix',rows:['0','1','2'],columns:['A','B'],values:[[0,1],[2,3],[4,5]],highlight:[[2,1]]});
  assert.deepEqual(matrix(200,90),[187,223,208,255]);
  assert.deepEqual(matrix(60,35),[237,241,239,255]);
  const region = draw({kind:'region',points:[[0,0],[4,0],[4,2],[0,2]],cut:[[1,0],[1,2]]});
  assert.deepEqual(region(320,40),[215,233,226,255]);
  assert.deepEqual(region(117,65),[189,72,100,255]);
  const normal = draw({kind:'normal',mean:10,sd:2,upper:10});
  assert.deepEqual(normal(172,100),[187,223,208,255]);
  assert.deepEqual(normal(225,100),[248,250,249,255]);
}));

function classroom(lessonId = 'sucesos', environment = {}) {
  const shell = readFileSync(new URL('../pages/inferencia-estadistica.html',import.meta.url),'utf8');
  const {document,window} = parseHTML(shell);
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:640,height:360});
  window.HTMLElement.prototype.focus = () => {};
  window.matchMedia = () => ({matches:false});
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
    configurable:true,
    get() {return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
    set(value) {for (const option of this.querySelectorAll('option')) {if (option.value === String(value)) option.setAttribute('selected','');else option.removeAttribute('selected');}}
  });
  const stored = new Map();
  const storage = {getItem:key => stored.get(key) ?? null,setItem:(key,value) => stored.set(key,String(value))};
  const initial = freshProgress(COURSE);
  initial.studied = ['sucesos'];
  initial.checks.sucesos = true;
  initial.attempts['events-99/union'] = {count:1,solved:true,assisted:false};
  storage.setItem(STORAGE_KEY,JSON.stringify(initial));
  const app = mountAula(document,{storage,location:{hash:`#${lessonId}/practice`},history:{replaceState() {}},manageHistory:false,...environment});
  const change = (id,value) => {const target = document.getElementById(id);if (target.type === 'checkbox') target.checked = value;else target.value = value;target.dispatchEvent(new window.Event('change',{bubbles:true}));};
  const submit = question => {
    const form = document.querySelector(`[data-grade-form="${question.id}"]`);
    document.getElementById(`answer-${question.id}`).value = String(question.answer);
    form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  };
  return {document,window,storage,app,change,submit};
}

test('PDF observation is the lesson default, offers source and problem selectors, uses lesson notation and preserves saved progress', () => withStatistics(() => {
  const fixture = classroom();
  const {document,app,change,submit,storage} = fixture;
  try {
    assert.equal(app.exercise.type,'pdf');
    assert.equal(document.getElementById('practiceMode').value,'observe');
    assert.equal(document.getElementById('exerciseSource').value,'pdf');
    assert.ok(document.getElementById('practiceAttempt').hidden);
    assert.ok(document.getElementById('exerciseType').closest('label').hidden);
    assert.deepEqual(Array.from(document.getElementById('pdfExercise').querySelectorAll('option'),option => option.value),getPdfExercises('sucesos').map(exercise => exercise.id));
    const source = document.querySelector('[data-tutor-source]').textContent;
    assert.ok(source.includes(app.exercise.source.file));
    assert.ok(source.includes(`Problema ${app.exercise.source.number}`));
    assert.ok(source.includes(`Página ${app.exercise.source.page}`));
    const expected = document.createElement('div');expected.innerHTML = notationHtml('sucesos');
    assert.ok(document.querySelector('[data-exercise-tutor] .exercise-notation').textContent.includes(expected.textContent));
    assert.equal(document.querySelector('[data-tutor-speed]').value,'6000');
    const before = structuredClone(app.progress);
    const question = app.exercise.questions[0];
    document.querySelector('[data-tutor-next]').click();
    submit(question);
    const solution = document.querySelector(`[data-solution="${question.id}"]`);
    solution.open = true;solution.dispatchEvent(new fixture.window.Event('toggle'));
    assert.deepEqual(app.progress,before);
    assert.deepEqual(loadProgress(storage,COURSE).progress,app.progress);
    change('pdfExercise','pdf-u1-2');
    assert.equal(app.exercise.id,'pdf-u1-2');
    assert.equal(document.querySelector('[data-tutor-position]').textContent.startsWith('Paso 1 '),true);
    document.getElementById('newExercise').click();
    assert.equal(app.exercise.id,'pdf-u3-1');
    assert.deepEqual(app.progress,before);
  } finally {app.dispose();}
}));

test('every mapped lesson displays all its PDF problems with complete written solutions and no scored attempts', () => withStatistics(() => {
  for (const lesson of COURSE.units.flatMap(unit => unit.lessons)) {
    const exercises = getPdfExercises(lesson.id);
    if (!exercises.length) continue;
    const {document,app,change} = classroom(lesson.id);
    try {
      const before = structuredClone(app.progress);
      const section = document.querySelector('[data-pdf-solutions]');
      assert.ok(section,lesson.id);
      assert.deepEqual(Array.from(section.querySelectorAll('[data-pdf-exercise]'),node => node.dataset.pdfExercise),exercises.map(exercise => exercise.id));
      for (const exercise of exercises) {
        const solved = section.querySelector(`[data-pdf-exercise="${exercise.id}"]`);
        assert.ok(solved.textContent.includes(exercise.source.file));
        assert.ok(solved.textContent.includes(exercise.prompt));
        for (const question of exercise.questions) {
          const answer = solved.querySelector(`[data-pdf-question="${question.id}"]`);
          assert.ok(answer.textContent.includes(question.prompt));
          assert.ok(answer.textContent.includes(question.interpretation));
          assert.equal(answer.querySelectorAll('li').length,question.steps.length);
          assert.equal(answer.querySelectorAll('[hidden]').length,0);
          assert.ok(answer.textContent.includes(Number(question.answer.toPrecision(9)).toString()));
          for (const step of question.steps) assert.ok(answer.textContent.includes(step.explanation));
        }
      }
      assert.deepEqual(app.progress,before);
      change('exerciseSource','synthetic');
      assert.equal(document.querySelector('[data-pdf-solutions]'),null);
      assert.notEqual(app.exercise.type,'pdf');
      assert.equal(document.querySelector('#exerciseSource option[value="synthetic"]').textContent,'Práctica extra');
      change('exerciseSource','pdf');
      assert.ok(document.querySelector('[data-pdf-solutions]'));
      assert.deepEqual(app.progress,before);
    } finally {app.dispose();}
  }
}));

test('another variant switches PDF observation to a distinct scoped synthetic task with independent grading', () => withStatistics(() => {
  const {document,app,submit} = classroom();
  try {
    const before = progressSummary(app.progress);
    const observed = JSON.stringify([app.exercise.prompt,app.exercise.given,app.exercise.questions.map(question => question.prompt)]);
    document.querySelector('[data-tutor-practice]').click();
    const exercise = app.exercise;
    const lesson = COURSE.units.flatMap(unit => unit.lessons).find(item => item.id === 'sucesos');
    const content = task => JSON.stringify([task.prompt,task.given,task.questions.map(question => question.prompt)]);
    assert.notEqual(exercise.type,'pdf');
    assert.ok(lesson.exerciseTypes.includes(exercise.type));
    assert.notEqual(content(exercise),observed);
    assert.notEqual(content(exercise),content(scopeExercise(lesson,generateExercise(exercise.type,1))));
    assert.equal(document.getElementById('practiceMode').value,'practice');
    assert.equal(document.getElementById('exerciseSource').value,'synthetic');
    assert.equal(document.querySelector('[data-exercise-tutor]'),null);
    assert.equal(document.getElementById('practiceAttempt').hidden,false);
    assert.deepEqual(progressSummary(app.progress),before);
    submit(exercise.questions[0]);
    const entry = app.progress.attempts[`${exercise.id}/${exercise.questions[0].id}`];
    assert.deepEqual(entry,{count:1,solved:true,assisted:false});
    assert.equal(progressSummary(app.progress).independent,before.independent+1);
    assert.ok(!Object.keys(app.progress.attempts).some(key => key.startsWith('pdf-')));
  } finally {app.dispose();}
}));

test('synthetic observation keeps its existing assistance marker when the same task is later answered', () => withStatistics(() => {
  const {document,app,change,submit,storage} = classroom();
  try {
    change('exerciseSource','synthetic');
    const exercise = app.exercise;
    const question = exercise.questions[0];
    const key = `${exercise.id}/${question.id}`;
    document.querySelector('[data-tutor-next]').click();
    assert.deepEqual(app.progress.attempts[key],{count:0,solved:false,assisted:true});
    change('practiceMode','practice');
    assert.equal(app.exercise.id,exercise.id);
    submit(question);
    assert.deepEqual(app.progress.attempts[key],{count:1,solved:true,assisted:true});
    assert.deepEqual(loadProgress(storage,COURSE).progress,app.progress);
  } finally {app.dispose();}
}));

test('PDF source returns to observation, guided synthetic answers retain assistance and lessons without PDFs retain scoped observation', () => withStatistics(() => {
  const {document,app,change,submit,storage} = classroom('normal');
  try {
    change('practiceMode','guided');
    assert.notEqual(app.exercise.type,'pdf');
    const exercise = app.exercise;
    submit(exercise.questions[0]);
    assert.equal(app.progress.attempts[`${exercise.id}/${exercise.questions[0].id}`].assisted,true);
    assert.equal(app.progress.attempts[`${exercise.id}/${exercise.questions[0].id}`].solved,true);
    change('exerciseSource','pdf');
    assert.equal(app.exercise.type,'pdf');
    assert.equal(document.getElementById('practiceMode').value,'observe');
    const before = structuredClone(app.progress);
    document.querySelector('[data-tutor-next]').click();
    submit(app.exercise.questions[0]);
    assert.deepEqual(app.progress,before);
    assert.deepEqual(loadProgress(storage,COURSE).progress,app.progress);
    app.navigate('funciones','practice',false);
    assert.deepEqual(getPdfExercises('funciones'),[]);
    assert.notEqual(app.exercise.type,'pdf');
    assert.equal(document.getElementById('practiceMode').value,'observe');
    assert.equal(document.getElementById('exerciseSource').value,'synthetic');
    assert.ok(document.querySelector('[data-exercise-tutor]'));
    submit(app.exercise.questions[0]);
    const solution = document.querySelector(`[data-solution="${app.exercise.questions[0].id}"]`);
    assert.equal(solution.localName,'details');
    assert.equal(solution.hasAttribute('open'),false);
    assert.deepEqual(app.progress.attempts,before.attempts);
    app.navigate('sucesos','practice',false);
    assert.equal(app.exercise.type,'pdf');
    change('entireBank',true);
    assert.notEqual(app.exercise.type,'pdf');
    document.querySelector('[data-tutor-practice]').click();
    assert.equal(Boolean(document.getElementById('entireBank').checked),false);
    const lesson = COURSE.units.flatMap(unit => unit.lessons).find(item => item.id === 'sucesos');
    assert.ok(lesson.exerciseTypes.includes(app.exercise.type));
  } finally {app.dispose();}
}));

test('section animation injection is used verbatim and a null injection preserves the global recap', () => withStatistics(() => {
  let selected;
  const calls = [];
  const mounted = [];
  const fixture = classroom('sucesos',{
    getAnimation:lessonId => {calls.push(lessonId);return selected;},
    createWhiteboard:(_host,{animation}) => {mounted.push(animation);return {render() {},resize() {},dispose() {}};}
  });
  try {
    const lesson = COURSE.units.flatMap(unit => unit.lessons).find(item => item.id === 'sucesos');
    const recap = createLessonAnimation(lesson,generateExercise,html => readParagraphs(fixture.document,html));
    selected = {...recap,id:'selected-section',title:'Seccion seleccionada',steps:recap.steps.slice(0,1)};
    fixture.app.setView('animation');
    assert.deepEqual(calls,['sucesos']);
    assert.equal(mounted.at(-1),selected);
    selected = null;
    fixture.app.setView('animation');
    assert.deepEqual(calls,['sucesos','sucesos']);
    assert.equal(mounted.at(-1).id,recap.id);
    assert.equal(mounted.at(-1).steps.length,recap.steps.length);
  } finally {fixture.app.dispose();}
}));