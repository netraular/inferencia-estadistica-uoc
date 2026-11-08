import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync, readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseHTML} from 'linkedom';
import {CAPSTONE, getCapstoneExercises} from '../pages/inferencia/capstone.js';
import {COURSE} from '../pages/inferencia/course.js';
import {gradeAnswer} from '../pages/inferencia/exercises.js';
import {createTutorFrames, drawTutorFigure, mountExerciseTutor} from '../pages/inferencia/exercise-tutor.js';
import {drawContextDiagram} from '../pages/inferencia/context-diagram.js';
import * as solutions from '../pages/inferencia/exercise-solutions.js';
import * as generators from '../pages/inferencia/exercises.js';
import {getPdfExercises} from '../pages/inferencia/pdf-exercises.js';

const require = createRequire(import.meta.url);
const jStat = require('jstat').jStat;
const katex = require('katex');

function withStatistics(action) {
  const previous = globalThis.jStat;
  globalThis.jStat = jStat;
  try {return action();}
  finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
}

function close(actual, expected, context, tolerance = 1e-10) {
  assert.ok(Number.isFinite(actual),`${context}: nonfinite value`);
  assert.ok(Math.abs(actual-expected) <= tolerance,`${context}: ${actual} != ${expected}`);
}

function selectedQuestion(exercises, number, id) {
  const question = exercises[number-1].questions.find(item => item.id === id);
  assert.ok(question,`${number}/${id}`);
  return question;
}

function poissonMass(rate, count) {
  let mass = Math.exp(-rate);
  for (let index = 1; index <= count; index++) mass *= rate/index;
  return mass;
}

function poissonCdf(rate, count) {
  let mass = Math.exp(-rate);
  let sum = mass;
  for (let index = 1; index <= count; index++) {
    mass *= rate/index;
    sum += mass;
  }
  return sum;
}

function standardNormalCdf(value) {
  const end = Math.abs(value);
  const subdivisions = 4096;
  const width = end/subdivisions;
  const density = position => Math.exp(-(position**2)/2)/Math.sqrt(2*Math.PI);
  let sum = density(0)+density(end);
  for (let index = 1; index < subdivisions; index++) sum += (index % 2 ? 4 : 2)*density(index*width);
  return 0.5+Math.sign(value)*sum*width/3;
}

function binomialTail(total, probability, minimum) {
  let mass = (1-probability)**total;
  let tail = minimum === 0 ? mass : 0;
  for (let count = 1; count <= total; count++) {
    mass *= (total-count+1)/count*probability/(1-probability);
    if (count >= minimum) tail += mass;
  }
  return tail;
}

function factorial(value) {
  let result = 1;
  for (let factor = 2; factor <= value; factor++) result *= factor;
  return result;
}

function topLevelEqualities(tex) {
  let count = 0;
  let depth = 0;
  const environments = [];
  for (let index = 0; index < tex.length; index++) {
    const character = tex[index];
    if (character === '\\') {
      const environment = /^\\(begin|end)\s*\{([^{}]+)\}/.exec(tex.slice(index));
      if (environment) {
        if (environment[1] === 'begin') environments.push(environment[2]);
        else assert.equal(environments.pop(),environment[2]);
        index += environment[0].length-1;
      } else if (/[\\{}=]/.test(tex[index+1] || '')) index++;
      continue;
    }
    if (character === '{') depth++;
    if (character === '}') depth--;
    if (character === '=' && depth === 0 && environments.length === 0) count++;
  }
  assert.equal(depth,0,tex);
  assert.equal(environments.length,0,tex);
  return count;
}

function checkDiagram(diagram) {
  assert.ok(['matrix','bars','normal','region'].includes(diagram.kind));
  if (diagram.kind === 'matrix') {
    assert.ok(diagram.rows.length > 0 && diagram.columns.length > 0);
    assert.equal(diagram.values.length,diagram.rows.length);
    for (const row of diagram.values) {
      assert.equal(row.length,diagram.columns.length);
      assert.ok(row.every(value => value === null || Number.isFinite(value)));
    }
    for (const [row,column] of diagram.highlight) {
      assert.ok(Number.isInteger(row) && row >= 0 && row < diagram.rows.length);
      assert.ok(Number.isInteger(column) && column >= 0 && column < diagram.columns.length);
    }
  } else if (diagram.kind === 'bars') {
    assert.ok(diagram.labels.length > 0);
    assert.equal(diagram.values.length,diagram.labels.length);
    assert.ok(diagram.values.every(Number.isFinite));
    for (const index of diagram.highlight) assert.ok(Number.isInteger(index) && index >= 0 && index < diagram.values.length);
  } else if (diagram.kind === 'normal') {
    assert.ok(Number.isFinite(diagram.mean));
    assert.ok(Number.isFinite(diagram.sd) && diagram.sd > 0);
    for (const bound of ['lower','upper']) if (diagram[bound] !== undefined) assert.ok(Number.isFinite(diagram[bound]));
    if (diagram.lower !== undefined && diagram.upper !== undefined) assert.ok(diagram.lower <= diagram.upper);
  } else {
    assert.ok(diagram.points.length >= 3);
    for (const point of [...diagram.points,...(diagram.cut || [])]) assert.ok(point.length === 2 && point.every(Number.isFinite));
  }
}

function assertFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value));
  Object.values(value).forEach(assertFrozen);
}

test('capstone imports without jStat, exports metadata eagerly and constructs distributions lazily', async () => {
  const previous = globalThis.jStat;
  delete globalThis.jStat;
  try {
    const module = await import('../pages/inferencia/capstone.js?capstone-lazy-contract');
    assert.deepEqual(Object.keys(module).sort(),['CAPSTONE','getCapstoneExercises']);
    assert.equal(module.CAPSTONE.number,5);
    assert.equal(module.CAPSTONE.sections.length,3);
    assert.throws(() => module.getCapstoneExercises(),/globalThis\.jStat/);
    globalThis.jStat = jStat;
    assert.equal(module.getCapstoneExercises().length,3);
  } finally {
    if (previous === undefined) delete globalThis.jStat;
    else globalThis.jStat = previous;
  }
});

test('chapter five has provenance, valid prerequisites and every requested subpart without changing COURSE', () => withStatistics(() => {
  const courseBefore = structuredClone(COURSE);
  const knownLessons = new Set(COURSE.units.flatMap(unit => unit.lessons.map(lesson => lesson.id)));
  const exercises = getCapstoneExercises();
  assert.equal(CAPSTONE.number,5);
  assert.equal(CAPSTONE.source.file,'UOC-MU-IE-2026-27-S1-PEC1-enunciado-1.pdf');
  assert.equal(CAPSTONE.source.kind,'statement');
  assert.equal(CAPSTONE.source.url,`/materiales/${CAPSTONE.source.file}`);
  assert.ok(existsSync(new URL(`../static/materiales/${CAPSTONE.source.file}`,import.meta.url)));
  assert.equal(new Set(CAPSTONE.prerequisiteLessonIds).size,CAPSTONE.prerequisiteLessonIds.length);
  for (const id of CAPSTONE.prerequisiteLessonIds) assert.ok(knownLessons.has(id),id);
  assert.deepEqual(exercises.map(exercise => exercise.questions.map(question => question.id)),[
    ['a','b','c'],['a','a-tail','b','c.i','c.ii'],
    ['a-distribution','a','b','c-covariance','c','c-reason','d','e']
  ]);
  assert.equal(exercises.flatMap(exercise => exercise.questions).length,16);
  for (const [index,exercise] of exercises.entries()) {
    assert.equal(exercise.type,'pdf');
    assert.equal(exercise.chapterId,CAPSTONE.id);
    assert.equal(exercise.source.file,CAPSTONE.source.file);
    assert.equal(exercise.source.number,String(index+1));
    assert.equal(exercise.id,CAPSTONE.sections[index].exerciseId);
    assert.equal(exercise.title,CAPSTONE.sections[index].title);
    assert.ok(exercise.prompt && exercise.given.length > 0 && exercise.assumptions.length > 0);
    assert.deepEqual(exercise.lessonIds,CAPSTONE.sections[index].lessonIds);
    for (const id of exercise.lessonIds) assert.ok(knownLessons.has(id),id);
    assert.deepEqual(exercise.visual,{type:'pdf',params:{}});
  }
  assert.deepEqual(COURSE,courseBefore);
}));

test('the 100 and 200 elementary states independently reproduce both observation mechanisms', () => withStatistics(() => {
  const exercise = getCapstoneExercises()[0];
  const independent = {existential:[],selected:[]};
  for (let genotype1 = 0; genotype1 < 2; genotype1++) for (let day1 = 0; day1 < 5; day1++) {
    for (let genotype2 = 0; genotype2 < 2; genotype2++) for (let day2 = 0; day2 < 5; day2++) {
      const qualifying = [genotype1 === 1 && day1 === 0,genotype2 === 1 && day2 === 0];
      const both = genotype1 === 1 && genotype2 === 1;
      independent.existential.push({observed:qualifying.some(Boolean),both});
      for (let selected = 0; selected < 2; selected++) independent.selected.push({observed:qualifying[selected],both});
    }
  }
  for (const [name,total,eventCount,jointCount] of [['existential',100,19,9],['selected',200,20,10]]) {
    const sample = exercise.sampleSpaces[name];
    const enumeration = independent[name];
    const observed = enumeration.filter(state => state.observed);
    const joint = observed.filter(state => state.both);
    assert.equal(enumeration.length,total);
    assert.equal(observed.length,eventCount);
    assert.equal(joint.length,jointCount);
    assert.equal(sample.denominator,total);
    assert.equal(sample.states.length,total);
    assert.equal(new Set(sample.states.map(state => state.id)).size,total);
    assert.equal(sample.eventCount,eventCount);
    assert.equal(sample.jointCount,jointCount);
    assert.equal(sample.table.values.flat().length,total);
    assert.ok(sample.table.values.flat().every(value => value === 1));
    checkDiagram(sample.table);
    const positions = new Set();
    for (const state of sample.states) {
      const position = `${state.row}/${state.column}`;
      assert.ok(!positions.has(position));
      positions.add(position);
      assert.equal(sample.table.values[state.row][state.column],1);
      close(state.probability,1/total,`${name}/${state.id}`);
      const qualifying = state.offspring.map(child => child.carrier && child.weekday === 'L');
      assert.equal(state.bothCarriers,state.offspring.every(child => child.carrier));
      assert.equal(state.observed,name === 'existential' ? qualifying.some(Boolean) : qualifying[state.selected]);
      assert.equal(sample.table.rows[state.row],`${state.offspring[0].carrier ? 'C' : 'N'}-${state.offspring[0].weekday}`);
      const secondLabel = `${state.offspring[1].carrier ? 'C' : 'N'}-${state.offspring[1].weekday}`;
      assert.equal(sample.table.columns[state.column],name === 'existential' ? secondLabel : `S${state.selected+1}:${secondLabel}`);
    }
    assert.equal(sample.states.filter(state => state.observed).length,eventCount);
    assert.equal(sample.states.filter(state => state.observed && state.bothCarriers).length,jointCount);
    close(sample.states.reduce((sum,state) => sum+state.probability,0),1,`${name} normalization`);
    const question = exercise.questions.find(item => item.id === (name === 'existential' ? 'a' : 'b'));
    close(question.answer,joint.length/observed.length,`${name} posterior`);
    const tables = question.tutorSteps.filter(step => step.diagram?.kind === 'matrix').map(step => step.diagram);
    assert.deepEqual(tables.map(table => table.highlight.length),[0,eventCount,jointCount]);
    assert.deepEqual(new Set(tables[1].highlight.map(position => position.join('/'))),new Set(sample.states.filter(state => state.observed).map(state => `${state.row}/${state.column}`)));
    assert.deepEqual(new Set(tables[2].highlight.map(position => position.join('/'))),new Set(sample.states.filter(state => state.observed && state.bothCarriers).map(state => `${state.row}/${state.column}`)));
  }
  assert.equal(exercise.sampleSpaces.existential.states.filter(state => state.offspring.every(child => child.carrier && child.weekday === 'L')).length,1);
  assert.equal(exercise.sampleSpaces.selected.states.filter(state => state.offspring.every(child => child.carrier && child.weekday === 'L')).length,2);
  const weights = exercise.questions.find(question => question.id === 'c').tutorSteps.find(step => step.evidence)?.evidence;
  assert.deepEqual(weights.qualifyingOffspring,[0,1,2]);
  assert.deepEqual(weights.existentialWeights,[0,1,1]);
  assert.deepEqual(weights.selectedWeights,[0,0.5,1]);
}));

test('all 13 numerical answers match independent enumeration, recurrences or integrated normal CDFs', () => withStatistics(() => {
  const exercises = getCapstoneExercises();
  const likelihood1 = poissonMass(1.5,4);
  const likelihood2 = poissonMass(3,4);
  const posterior = 0.4*likelihood2/(0.6*likelihood1+0.4*likelihood2);
  const high = 1-standardNormalCdf(1);
  const middle = standardNormalCdf(1)-standardNormalCdf(-1);
  const countMean = 400*high;
  const countSd = Math.sqrt(400*high*(1-high));
  const multinomialCoefficient = factorial(10)/(factorial(2)*factorial(6)*factorial(2));
  assert.equal(multinomialCoefficient,1260);
  const expected = [
    {a:9/19,b:1/2},
    {a:poissonMass(1.5,0),'a-tail':1-poissonCdf(1.5,2),b:poissonCdf(7.5,5),'c.i':posterior,'c.ii':(1-posterior)*Math.exp(-1.5)+posterior*Math.exp(-3)},
    {a:1-standardNormalCdf(0.75),b:standardNormalCdf(20/Math.sqrt(265)),
      'c-covariance':180,c:4/5,d:multinomialCoefficient*high**4*middle**6,
      e:1-standardNormalCdf((74.5-countMean)/countSd)}
  ];
  let checked = 0;
  for (const [index,exercise] of exercises.entries()) for (const question of exercise.questions) {
    if (question.grading.kind !== 'numeric') continue;
    assert.ok(Object.hasOwn(expected[index],question.id),question.id);
    close(question.answer,expected[index][question.id],`${index+1}/${question.id}`);
    checked++;
  }
  assert.equal(checked,13);
  close(selectedQuestion(exercises,2,'a').answer,0.22313016014842982,'fixed Poisson zero');
  close(selectedQuestion(exercises,2,'a-tail').answer,0.19115316946194194,'fixed Poisson upper tail');
  close(selectedQuestion(exercises,3,'a').answer,0.2266273523768682,'fixed conditional normal');
  close(high,0.15865525393145707,'fixed marginal normal');
  close(posterior,32/(32+3*Math.exp(1.5)),'simplified Bayes expression');
}));

test('Bayes visual evidence preserves route weights and predicts the same unknown incubator', () => withStatistics(() => {
  const exercises = getCapstoneExercises();
  const posteriorQuestion = selectedQuestion(exercises,2,'c.i');
  const tree = posteriorQuestion.tutorSteps.find(step => step.evidence?.kind === 'bayes-tree').evidence;
  assert.equal(tree.observedCount,4);
  assert.deepEqual(tree.branches.map(branch => branch.prior),[0.6,0.4]);
  assert.deepEqual(tree.branches.map(branch => branch.rate),[1.5,3]);
  for (const branch of tree.branches) {
    close(branch.likelihood,poissonMass(branch.rate,4),`${branch.incubator} likelihood`);
    close(branch.joint,branch.prior*poissonMass(branch.rate,4),`${branch.incubator} joint`);
  }
  const evidence = tree.branches.reduce((sum,branch) => sum+branch.joint,0);
  const weights = tree.branches.map(branch => branch.joint/evidence);
  close(weights[1],posteriorQuestion.answer,'Bayes tree posterior');
  const posteriorBars = posteriorQuestion.tutorSteps.at(-1).diagram;
  weights.forEach((weight,index) => close(posteriorBars.values[index],weight,'posterior bar'));
  const predictionQuestion = selectedQuestion(exercises,2,'c.ii');
  const predictive = weights.reduce((sum,weight,index) => sum+weight*Math.exp(-tree.branches[index].rate),0);
  close(predictionQuestion.answer,predictive,'same-incubator prediction');
  const priorPrediction = 0.6*Math.exp(-1.5)+0.4*Math.exp(-3);
  assert.ok(Math.abs(predictionQuestion.answer-priorPrediction) > 0.01);
  assert.ok(predictionQuestion.answer > Math.exp(-3) && predictionQuestion.answer < Math.exp(-1.5));
  const jointZero = 0.6*Math.exp(-3)+0.4*Math.exp(-6);
  assert.ok(jointZero > priorPrediction**2,'shared incubator creates positive marginal dependence');
  close(0.6*0.4*(3-1.5)**2,0.54,'marginal covariance of plate counts');
}));

test('normal figures use the conditional, difference and marginal distributions only when introduced', () => withStatistics(() => {
  const exercises = getCapstoneExercises();
  const conditional = selectedQuestion(exercises,3,'a').tutorSteps.filter(step => step.diagram).map(step => step.diagram);
  assert.deepEqual(conditional,[{kind:'normal',mean:128,sd:16},{kind:'normal',mean:128,sd:16,lower:140}]);
  const difference = selectedQuestion(exercises,3,'b').tutorSteps.filter(step => step.diagram).map(step => step.diagram);
  assert.deepEqual(difference,[{kind:'normal',mean:20,sd:Math.sqrt(265)},{kind:'normal',mean:20,sd:Math.sqrt(265),lower:0}]);
  const categories = selectedQuestion(exercises,3,'d').tutorSteps.filter(step => step.diagram).map(step => step.diagram);
  assert.deepEqual(categories.slice(0,3),[
    {kind:'normal',mean:120,sd:20},{kind:'normal',mean:120,sd:20,upper:100},{kind:'normal',mean:120,sd:20,lower:140}
  ]);
  const categoryBars = categories.at(-1);
  assert.deepEqual(categoryBars.labels,['Y<100','100 a 140','Y>140']);
  close(categoryBars.values[0],standardNormalCdf(-1),'low category');
  close(categoryBars.values[1],standardNormalCdf(1)-standardNormalCdf(-1),'central category');
  close(categoryBars.values[2],1-standardNormalCdf(1),'high category');
  close(categoryBars.values.reduce((sum,value) => sum+value,0),1,'exhaustive categories');
  const reason = selectedQuestion(exercises,3,'c-reason');
  assert.deepEqual(reason.tutorSteps.at(-1).diagram,{kind:'normal',mean:40,sd:16});
  close(120-0.8*100,40,'residual mean');
  close(400+0.8**2*225-2*0.8*180,256,'residual variance');
  close(180-0.8*225,0,'residual covariance');
}));

test('3e grades the continuity-corrected approximation and keeps the exact binomial reference separate', () => withStatistics(() => {
  const question = selectedQuestion(getCapstoneExercises(),3,'e');
  const probability = 1-standardNormalCdf(1);
  const mean = 400*probability;
  const sd = Math.sqrt(400*probability*(1-probability));
  const expected = 1-standardNormalCdf((74.5-mean)/sd);
  assert.equal(question.grading.mode,'approximate');
  assert.equal(question.grading.method,'normal-with-continuity-correction');
  assert.ok(mean > 10 && 400*(1-probability) > 10);
  close(question.answer,expected,'continuity-corrected answer');
  const correction = question.tutorSteps.find(step => step.evidence?.kind === 'continuity-correction').evidence;
  assert.equal(correction.discrete.minimum,75);
  assert.equal(correction.continuous.lower,74.5);
  assert.equal(correction.discrete.n,400);
  close(correction.discrete.p,probability,'binomial success probability');
  close(correction.continuous.mean,mean,'count normal mean');
  close(correction.continuous.sd,sd,'count normal sd');
  assert.equal(question.reference.method,'exact-binomial');
  close(question.reference.answer,binomialTail(400,probability,75),'independent exact binomial tail');
  for (const wrong of [
    1-standardNormalCdf((75-mean)/sd),
    1-standardNormalCdf((75.5-mean)/sd),
    question.reference.answer
  ]) assert.equal(gradeAnswer(question,String(wrong)).correct,false);
  assert.ok(gradeAnswer(question,String(expected)).correct);
}));

test('all quantitative questions retain the existing fraction, decimal and percent grading contract', () => withStatistics(() => {
  const exercises = getCapstoneExercises();
  for (const exercise of exercises) for (const question of exercise.questions) {
    if (question.grading.kind !== 'numeric') continue;
    assert.ok(Number.isFinite(question.answer) && Number.isFinite(question.tolerance) && question.tolerance >= 0);
    assert.ok(gradeAnswer(question,String(question.answer)).correct,question.id);
    assert.equal(gradeAnswer(question,'not a number').correct,false);
    assert.equal(gradeAnswer(question,String(question.answer+Math.max(0.01,10*question.tolerance))).correct,false,question.id);
    if (question.unit === 'probabilidad entre 0 y 1') {
      assert.ok(question.answer >= 0 && question.answer <= 1);
      assert.ok(gradeAnswer(question,`${100*question.answer}%`).correct,question.id);
    }
  }
  assert.ok(gradeAnswer(selectedQuestion(exercises,1,'a'),'9/19').correct);
  assert.ok(gradeAnswer(selectedQuestion(exercises,1,'b'),'1/2').correct);
  assert.ok(gradeAnswer(selectedQuestion(exercises,3,'c'),'0,8').correct);
  assert.equal(gradeAnswer(selectedQuestion(exercises,1,'a'),'1/2').correct,false);
  assert.equal(gradeAnswer(selectedQuestion(exercises,1,'b'),'9/19').correct,false);
  assert.equal(gradeAnswer(selectedQuestion(exercises,3,'a'),'15.865525393145707%').correct,false);
}));

test('qualitative solutions are explicit ungraded reasoning, not fabricated numeric checkpoints', () => withStatistics(() => {
  const exercises = getCapstoneExercises();
  const qualitative = exercises.flatMap(exercise => exercise.questions.filter(question => question.grading.kind === 'qualitative').map(question => ({exercise,question})));
  assert.deepEqual(qualitative.map(({exercise,question}) => `${exercise.source.number}/${question.id}`),['1/c','3/a-distribution','3/c-reason']);
  for (const {question} of qualitative) {
    assert.equal(question.answer,null);
    assert.equal(question.tolerance,null);
    assert.equal(question.grading.mode,'review');
    assert.equal(question.unit,'respuesta razonada');
    assert.ok(question.answerTex && question.answerText.length > 80);
    assert.ok(question.tutorSteps.length >= 5);
    assert.throws(() => gradeAnswer(question,'0'),TypeError);
  }
  const selection = selectedQuestion(exercises,1,'c');
  assert.match(selection.answerText,/multiplicidad dos/);
  const distribution = selectedQuestion(exercises,3,'a-distribution');
  assert.match(distribution.answerTex,/120\+0\.8\(x-100\),256/);
  assert.match(distribution.answerText,/desviación típica es 16/);
  const independence = selectedQuestion(exercises,3,'c-reason');
  assert.match(independence.tutorSteps.map(step => step.comment).join(' '),/conjuntamente normal/);
  assert.match(independence.answerTex,/40,256/);
}));

test('every narrated operation and answer renders in KaTeX without a top-level equality chain', () => withStatistics(() => {
  for (const exercise of getCapstoneExercises()) for (const question of exercise.questions) {
    const context = `${exercise.id}/${question.id}`;
    assert.ok(question.prompt && question.hint && question.unit && question.interpretation && question.answerText,context);
    assert.ok(question.tutorSteps.length > 0,context);
    assert.equal(question.steps.length,question.tutorSteps.length,context);
    assert.equal(question.hint,question.tutorSteps[0].comment,context);
    assert.doesNotThrow(() => katex.renderToString(question.answerTex,{throwOnError:true,strict:'error'}),context);
    for (const [index,step] of question.tutorSteps.entries()) {
      assert.ok(step.title && step.comment.length >= 25,`${context}/${index}`);
      assert.equal(question.steps[index].title,step.title);
      assert.equal(question.steps[index].explanation,step.comment);
      assert.equal(question.steps[index].tex,step.tex);
      if (step.tex) {
        assert.ok(topLevelEqualities(step.tex) <= 1,`${context}/${index}: ${step.tex}`);
        assert.doesNotThrow(() => katex.renderToString(step.tex,{throwOnError:true,strict:'error'}),`${context}/${index}: ${step.tex}`);
      }
      if (step.diagram) checkDiagram(step.diagram);
    }
    if (question.reference?.tex) assert.doesNotThrow(() => katex.renderToString(question.reference.tex,{throwOnError:true,strict:'error'}),context);
  }
}));

test('numeric tutor frames reveal only current evidence, retain each beat and do not mutate questions', () => withStatistics(() => {
  for (const exercise of getCapstoneExercises()) for (const question of exercise.questions) {
    if (question.grading.kind !== 'numeric') continue;
    const before = structuredClone({exercise,question});
    const frames = createTutorFrames(exercise,question);
    assert.equal(frames.length,question.tutorSteps.length+2,`${exercise.id}/${question.id}`);
    assert.equal(frames[0].tex,'');
    assert.equal(frames[0].diagram,undefined,'no future result at the question prompt');
    assert.equal(frames[0].comment,question.prompt);
    let diagram;
    for (const [index,step] of question.tutorSteps.entries()) {
      const frame = frames[index+1];
      assert.equal(frame.title,step.title);
      assert.equal(frame.tex,step.tex || '');
      assert.equal(frame.comment,step.comment);
      diagram = step.diagram ?? diagram;
      assert.deepEqual(frame.diagram,diagram);
      if (frame.tex) assert.doesNotThrow(() => katex.renderToString(frame.tex,{throwOnError:true,strict:'error'}),frame.tex);
    }
    assert.equal(frames.at(-1).result,true);
    assert.ok(frames.slice(0,-1).every(frame => !frame.result));
    assert.deepEqual(frames.at(-1).diagram,diagram);
    assert.doesNotThrow(() => katex.renderToString(frames.at(-1).tex,{throwOnError:true,strict:'error'}));
    assert.deepEqual({exercise,question},before);
  }
}));

test('metadata is deeply immutable and fresh construction isolates every nested solution and state table', () => withStatistics(() => {
  assertFrozen(CAPSTONE);
  assert.throws(() => CAPSTONE.sections.push({}),TypeError);
  assert.throws(() => {CAPSTONE.sections[0].lessonIds[0] = 'changed';},TypeError);
  const first = getCapstoneExercises();
  const second = getCapstoneExercises();
  const baseline = structuredClone(second);
  assert.notEqual(first,second);
  first[0].source.title = 'changed';
  first[0].lessonIds[0] = 'changed';
  first[0].sampleSpaces.existential.states[0].offspring[0].carrier = true;
  first[0].sampleSpaces.selected.table.values[0][0] = 999;
  first[0].sampleSpaces.existential.table.rows[0] = 'changed';
  const matrixStep = first[0].questions[0].tutorSteps.find(step => step.diagram?.kind === 'matrix');
  matrixStep.diagram.values[0][0] = 999;
  first[0].questions[0].steps[0].explanation = 'changed';
  const tree = first[1].questions.find(question => question.id === 'c.i').tutorSteps.find(step => step.evidence?.kind === 'bayes-tree').evidence;
  tree.branches[0].prior = 999;
  first[2].questions.find(question => question.id === 'e').reference.answer = 999;
  assert.deepEqual(second,baseline);
  assert.deepEqual(getCapstoneExercises(),baseline);
  assert.equal(CAPSTONE.sections[0].lessonIds[0],'sucesos');
  assert.equal(CAPSTONE.source.title,'UOC MU IE 2026-27 S1: PEC 1, enunciado');
}));

const babel = require('@babel/core');
const componentUrl = new URL('../src/components/CapstoneExercises.jsx',import.meta.url);
const componentSource = readFileSync(componentUrl,'utf8');
function compileComponent(url) {
  return babel.transformSync(readFileSync(url,'utf8'),{
  filename:url.pathname,babelrc:false,configFile:false,
  presets:[require.resolve('@docusaurus/core/lib/babel/preset')],
  plugins:[require.resolve('@babel/plugin-transform-modules-commonjs'),({types}) => ({visitor:{CallExpression(path) {
    if (path.node.callee.type !== 'Import') return;
    const load = types.arrowFunctionExpression([],types.callExpression(types.identifier('require'),path.node.arguments));
    path.replaceWith(types.callExpression(types.memberExpression(types.callExpression(types.memberExpression(types.identifier('Promise'),types.identifier('resolve')),[]),types.identifier('then')),[load]));
  }}})]
}).code;
}
const componentCode=compileComponent(componentUrl);

function compiledCollection(fixture,effects,updates) {
  const module={exports:{}};
  const replacements={
    react:{...React,useRef:()=>({current:fixture.host}),useEffect:effect=>effects.push(effect),useState:initial=>[initial,value=>updates.push(value)]},
    '@docusaurus/useBaseUrl':()=>'/inferencia/',
    '../../pages/inferencia/course.js':{COURSE},
    '../../static/audio/exercises-manifest.json':{lessons:{}},
    '../../pages/inferencia/exercise-solutions.js':solutions,
    '../../pages/inferencia/exercises.js':generators,
    '../../pages/inferencia/pdf-exercises.js':{getPdfExercises},
    '../../pages/inferencia/capstone.js':{getCapstoneExercises},
    '../classroom/embed.mjs':{renderScopedIcons() {}},
    '../classroom/whiteboard.mjs':{createWhiteboard() {return null;}},
    jstat:{jStat},katex,'../../pages/inferencia/vendor/lucide.min.js':{}
  };
  runInNewContext(compileComponent(new URL('../src/components/ExerciseCollection.jsx',import.meta.url)),{module,exports:module.exports,globalThis,require:specifier=>replacements[specifier] || require(specifier)});
  return module.exports.default;
}

function compiledCapstone(imports = {}) {
  const module = {exports:{}};
  const replacements = {
    react:React,
    '@docusaurus/useBaseUrl':() => '/inferencia/',
    '../../pages/inferencia/capstone.js':{CAPSTONE,getCapstoneExercises},
    './ExerciseCollection':() => React.createElement('p',{role:'status'},'Cargando ejercicios...'),
    '../../pages/inferencia/exercise-tutor.js':{mountExerciseTutor},
    '../../pages/inferencia/context-diagram.js':{drawContextDiagram},
    jstat:{jStat},katex,
    '../../pages/inferencia/vendor/lucide.min.js':{},
    ...imports
  };
  runInNewContext(componentCode,{module,exports:module.exports,globalThis,Intl,
    require:specifier => Object.hasOwn(replacements,specifier) ? replacements[specifier] : require(specifier)});
  return module.exports;
}

function tutorDocument() {
  const {document,window} = parseHTML('<html><body><div id="host"></div></body></html>');
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLElement.prototype.getBoundingClientRect = () => ({width:320,height:280});
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
    configurable:true,
    get() {return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
    set(value) {for (const option of Array.from(this.querySelectorAll('option'))) {
      if (option.value === String(value)) option.setAttribute('selected','');
      else option.removeAttribute('selected');
    }}
  });
  return {document,window,host:document.getElementById('host')};
}

function mountCapstoneFixture(exerciseId) {
  const fixture = tutorDocument();
  const {mountCapstoneExercise} = compiledCapstone();
  let storageAccesses = 0;
  const storage = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get() {storageAccesses++;throw new Error('Review must not access progress');}});
  try {
    const mounted = mountCapstoneExercise(fixture.host,{exerciseId,baseUrl:'/inferencia/',mountTutor:mountExerciseTutor,
      drawDiagram:drawContextDiagram,math:{renderToString:tex => katex.renderToString(tex,{displayMode:true,throwOnError:true,strict:'error'})},
      icons:{icons:{StepBack:[],StepForward:[],Play:[],Pause:[],Maximize:[]},createElement() {return fixture.document.createElementNS('http://www.w3.org/2000/svg','svg');}}});
    return {...fixture,...mounted,storageAccesses:() => storageAccesses,dispose() {
      try {mounted.dispose();}
      finally {if (storage) Object.defineProperty(globalThis,'localStorage',storage);else delete globalThis.localStorage;}
    }};
  } catch (failure) {
    if (storage) Object.defineProperty(globalThis,'localStorage',storage);else delete globalThis.localStorage;
    throw failure;
  }
}

function openDetails(details, window) {
  details.setAttribute('open','');
  details.dispatchEvent(new window.Event('toggle'));
}

function recordingContext() {
  const labels = [];
  const calls = [];
  const context = new Proxy({measureText:value => ({width:String(value).length*6})},{get(target,key) {
    if (key in target) return target[key];
    return (...args) => {
      assert.ok(args.filter(value => typeof value === 'number').every(Number.isFinite),`${String(key)}: nonfinite coordinate`);
      calls.push(key);
      if (key === 'fillText') labels.push(String(args[0]));
    };
  }});
  return {context,labels,calls};
}

test('all 16 tutor questions render every frame with KaTeX and qualitative finals never coerce null', () => withStatistics(() => {
  let checked = 0;
  for (const exercise of getCapstoneExercises()) for (const question of exercise.questions) {
    const frames = createTutorFrames(exercise,question);
    assert.equal(frames[0].tex,'');
    assert.equal(frames[0].answerText,undefined);
    assert.equal(frames[0].diagram,undefined);
    assert.ok(frames.slice(0,-1).every(frame => !frame.result && !frame.answerText));
    for (const frame of frames) {
      assert.doesNotMatch(frame.tex || '',/NaN|undefined|\\boxed\{null\}/);
      if (frame.tex) assert.doesNotThrow(() => katex.renderToString(frame.tex,{throwOnError:true,strict:'error'}));
    }
    if (question.grading.kind === 'qualitative') {
      assert.equal(frames.at(-1).tex,String.raw`\boxed{${question.answerTex}}`);
      assert.equal(frames.at(-1).answerText,question.answerText);
      assert.notEqual(frames.at(-1).tex,String.raw`\boxed{0}`);
    }
    checked++;
  }
  assert.equal(checked,16);
}));

test('qualitative text-only fallback is escaped, while a genuine numerical zero is preserved', () => withStatistics(() => {
  const exercise = getCapstoneExercises()[0];
  const qualitative = {...exercise.questions[2],answerTex:undefined,answerText:'Criterio <img src=x onerror=alert(1)> & razonamiento'};
  for (const answer of [null,NaN,undefined]) {
    const question = {...qualitative,answer};
    const {host} = tutorDocument();
    const dispose = mountExerciseTutor(host,{...exercise,questions:[question]},{formatMath:tex => katex.renderToString(tex,{throwOnError:true}),onHelp() {}});
    try {
      assert.equal(host.querySelector('[data-tutor-practice]'),null);
      assert.equal(host.querySelector('[data-tutor-lines]').textContent,'');
      for (let index = 1; index < createTutorFrames(exercise,question).length; index++) host.querySelector('[data-tutor-next]').click();
      const result = host.querySelector('.is-result');
      assert.ok(result);
      assert.ok(result.textContent.includes(question.answerText));
      assert.equal(result.querySelector('img'),null);
      assert.equal(result.querySelector('.katex'),null);
      assert.equal(createTutorFrames(exercise,question).at(-1).tex,'');
    } finally {dispose();}
  }
  const zero = {...exercise.questions[0],answer:0};
  assert.equal(createTutorFrames(exercise,zero).at(-1).tex,String.raw`\boxed{0}`);
}));

test('mounted capstones retain every question, reveal no future solution and never touch progress', () => withStatistics(() => {
  let checked = 0;
  for (const section of CAPSTONE.sections) {
    const mounted = mountCapstoneFixture(section.exerciseId);
    const {root,window,exercise} = mounted;
    try {
      assert.deepEqual(Array.from(root.querySelectorAll('link[rel="stylesheet"]'),link => link.getAttribute('href')),['/inferencia/aula.css','/inferencia/katex/katex.min.css']);
      assert.equal(root.querySelectorAll('[data-tutor-question] option').length,exercise.questions.length);
      assert.equal(root.querySelector('[data-tutor-practice]'),null);
      assert.equal(root.querySelector('[data-grade-form],form,input[type="number"]'),null);
      assert.equal(root.querySelector('i[data-lucide]'),null);
      assert.equal(root.querySelectorAll('svg.lucide').length,5);
      const statement = root.querySelector('.capstone-statement').textContent;
      for (const text of [exercise.prompt,...exercise.given,...exercise.assumptions]) assert.ok(statement.includes(text));
      for (const [index,question] of exercise.questions.entries()) {
        const select = root.querySelector('[data-tutor-question]');
        select.value = String(index);
        select.dispatchEvent(new window.Event('change'));
        assert.equal(root.querySelector('[data-tutor-lines]').childNodes.length,0);
        assert.equal(root.querySelector('[data-tutor-note-content]').childNodes.length,0);
        assert.equal(root.querySelector('[data-tutor-notes]').hasAttribute('open'),false);
        assert.equal(root.querySelector('[data-tutor-comment]').textContent,question.prompt);
        assert.equal(root.querySelector('.is-result'),null);
        assert.equal(root.querySelector('.capstone-solution-content .katex'),null);
        for (let position = 1; position < createTutorFrames(exercise,question).length; position++) root.querySelector('[data-tutor-next]').click();
        assert.ok(root.querySelector('.is-result .katex'));
        assert.equal(root.querySelector('[data-tutor-next]').disabled,true);
        if (question.grading.kind === 'qualitative') assert.ok(root.querySelector('.is-result').textContent.includes(question.answerText));
        root.querySelector('[data-tutor-previous]').click();
        assert.equal(root.querySelector('.is-result'),null);
        checked++;
      }
      assert.equal(mounted.storageAccesses(),0);
      const retainedNext = root.querySelector('[data-tutor-next]');
      mounted.dispose();
      assert.equal(root.childNodes.length,0);
      assert.doesNotThrow(() => retainedNext.click());
    } finally {mounted.dispose();}
  }
  assert.equal(checked,16);
}));

test('full written reasoning, sample spaces and PDF page footnotes remain optional and accurate', () => withStatistics(() => {
  for (const [sectionIndex,section] of CAPSTONE.sections.entries()) {
    const mounted = mountCapstoneFixture(section.exerciseId);
    try {
      const {root,exercise,window} = mounted;
      assert.equal(root.querySelector('.capstone-solution[open]'),null);
      for (const [index,question] of exercise.questions.entries()) {
        const details = root.querySelector(`[data-capstone-question="${index}"]`);
        assert.equal(details.querySelector('.capstone-solution-content').hasChildNodes(),false);
        openDetails(details,window);
        for (const step of question.steps) {
          assert.ok(details.textContent.includes(step.title));
          assert.ok(details.textContent.includes(step.explanation));
        }
        assert.ok(details.textContent.includes(question.answerText));
        assert.equal(details.querySelector('.katex-error'),null);
        const pages = Array.from(details.querySelectorAll('.capstone-source a'),link => link.getAttribute('href'));
        assert.deepEqual(pages,[[1],[1,2],[2]][sectionIndex].map(page => `/inferencia/materiales/${CAPSTONE.source.file}#page=${page}`));
        const table = details.querySelector('.capstone-table');
        if (table) {
          const sample = exercise.sampleSpaces[question.id === 'a' ? 'existential' : 'selected'];
          assert.equal(table.querySelectorAll('tbody td').length,sample.denominator);
          assert.equal(table.querySelectorAll('th[scope="row"]').length,10);
          assert.equal(table.querySelectorAll('td[data-observed="true"]').length,sample.eventCount);
          assert.equal(table.querySelectorAll('td[data-joint="true"]').length,sample.jointCount);
          assert.match(table.querySelector('caption').textContent,/filas.*descendiente 1.*columnas.*descendiente 2/);
          assert.equal(table.closest('[role="region"]').getAttribute('tabindex'),'0');
          assert.equal(table.closest('details').hasAttribute('open'),false);
          if (question.id === 'b') assert.match(table.textContent,/Selección del descendiente 2/);
        }
        if (question.id === 'c.i') {
          const meters = Array.from(details.querySelectorAll('meter'),meter => Number(meter.getAttribute('value')));
          assert.equal(meters.length,4);
          assert.equal(meters[0],0.6);
          assert.equal(meters[2],0.4);
          close(meters[1]+meters[3],1,'posterior comparison sums to one');
          close(meters[3],question.answer,'posterior I2 meter');
        }
        if (question.id === 'c.ii') {
          assert.equal(details.querySelectorAll('.capstone-tree>li').length,2);
          assert.match(details.textContent,/misma incubadora|se conserva la incubadora/);
          assert.match(details.textContent,/No se vuelve a sortear la incubadora/);
        }
        if (question.reference) {
          assert.match(details.querySelector('.capstone-reference').textContent,/exacta.*aproximacion normal|exacta.*aproximación normal/s);
          assert.match(details.querySelector('.capstone-reference').textContent,/74,5/);
        }
      }
      assert.equal(mounted.storageAccesses(),0);
    } finally {mounted.dispose();}
  }
}));

test('capstone diagrams draw finite geometry at mobile and desktop widths without leaking future evidence', () => withStatistics(() => {
  for (const exercise of getCapstoneExercises()) for (const question of exercise.questions) {
    const frames = createTutorFrames(exercise,question);
    for (const width of [320,720]) for (const [position,frame] of frames.entries()) {
      const {context,labels,calls} = recordingContext();
      drawTutorFigure(context,exercise,question,position,width,320);
      assert.ok(calls.includes('fillRect'));
      assert.ok(labels.every(label => !/NaN|undefined|null/.test(label)));
      if (position === 0) assert.ok(!labels.some(label => /0: E|0: F|19|74\.5/.test(label)));
      if (frame.diagram?.kind === 'matrix') assert.ok(calls.filter(method => method === 'fillRect').length <= 10,'draw a readable extract, not 100 or 200 tiny cells');
      if (frame.diagram?.capstoneEvidence) {
        assert.deepEqual(frame.diagram.values,[0,0,1,0.5,1,1]);
        assert.ok(labels.some(label => label.includes('E: aviso existencial')));
        assert.ok(labels.includes('0: E'));
        assert.ok(labels.includes('2: F'));
      }
    }
  }
}));

test('the mounted same-incubator predictive tree draws on disclosure and resize and stops after disposal', () => withStatistics(() => {
  const mounted = mountCapstoneFixture('capstone-pec1-2');
  const prototype = mounted.window.HTMLCanvasElement.prototype;
  const original = prototype.getContext;
  const records = new Map();
  prototype.getContext = function() {
    if (!records.has(this)) records.set(this,recordingContext());
    return records.get(this).context;
  };
  try {
    const details = mounted.root.querySelector('[data-capstone-question="4"]');
    openDetails(details,mounted.window);
    const canvas = details.querySelector('canvas');
    const record = records.get(canvas);
    assert.ok(record);
    const posterior = mounted.exercise.questions.find(question => question.id === 'c.i').answer;
    const format = value => new Intl.NumberFormat('es',{maximumSignificantDigits:4}).format(value);
    assert.ok(record.labels.includes(`I1; p = ${format(1-posterior)}`));
    assert.ok(record.labels.includes(`I2; p = ${format(posterior)}`));
    assert.ok(record.labels.some(label => label.includes('N₂=0; aporte')));
    assert.equal(canvas.width,320);
    canvas.getBoundingClientRect = () => ({width:720,height:360});
    mounted.window.dispatchEvent(new mounted.window.Event('resize'));
    assert.equal(canvas.width,720);
    const calls = record.calls.length;
    mounted.dispose();
    mounted.window.dispatchEvent(new mounted.window.Event('resize'));
    assert.equal(record.calls.length,calls);
  } finally {prototype.getContext = original;mounted.dispose();}
}));

test('the compiled React component has SSR-safe sources and the real collection mounts closed solutions and cleans up', async () => {
  const previous = globalThis.jStat;
  delete globalThis.jStat;
  try {
    const {default:ServerCapstone} = compiledCapstone();
    for (const [index,section] of CAPSTONE.sections.entries()) {
      const html = renderToStaticMarkup(React.createElement(ServerCapstone,{exerciseId:section.exerciseId}));
      const {document} = parseHTML(html);
      assert.ok(document.querySelector('[role="status"]'));
      assert.equal(document.querySelector('.katex,.is-result,form'),null);
      assert.deepEqual(Array.from(document.querySelectorAll('a'),link => link.getAttribute('href')),[[1],[1,2],[2]][index].map(page => `/inferencia/materiales/${CAPSTONE.source.file}#page=${page}`));
    }
    assert.equal(globalThis.jStat,undefined,'SSR must not require jStat');
    const effects = [];
    const updates = [];
    const fixture = tutorDocument();
    const Collection=compiledCollection(fixture,effects,updates);
    for(const section of CAPSTONE.sections){
      const props=ServerCapstone({exerciseId:section.exerciseId}).props.children[1].props;
      Collection(props);
      const cleanup=effects.at(-1)();
      try {
        await new Promise(resolve=>setImmediate(resolve));
        const root=fixture.host.shadowRoot;
        const exercise=getCapstoneExercises().find(item=>item.id===section.exerciseId);
        assert.equal(root.querySelectorAll('[data-exercise-question]').length,exercise.questions.length);
        assert.equal(root.querySelectorAll('details[open],select,[data-tutor-practice]').length,0);
        assert.equal(root.querySelectorAll('[data-exercise-answer]').length,exercise.questions.filter(question=>Number.isFinite(question.answer)).length);
        for(const question of Array.from(root.querySelectorAll('[data-exercise-question]'))) {
          assert.ok(question.querySelector('[data-animated-solution]'));
          assert.ok(question.querySelector('[data-written-solution]'));
        }
        if(exercise.sampleSpaces)assert.equal(root.querySelectorAll('.capstone-table tbody td').length,300);
        if(exercise.questions.some(question=>question.reference))assert.ok(root.querySelector('.capstone-reference .katex'));
        assert.ok(updates.includes(true));
      } finally {cleanup();}
      assert.equal(fixture.host.shadowRoot.childNodes.length,0);
    }
    Collection({exerciseId:'capstone-pec1-2',lessonId:'sucesos'});
    effects.at(-1)()();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(fixture.host.shadowRoot.childNodes.length,0,'an unmounted effect must ignore pending runtime imports');
    const unknown = renderToStaticMarkup(React.createElement(ServerCapstone,{exerciseId:'missing'}));
    assert.match(unknown,/role="alert"/);
  } finally {if (previous === undefined) delete globalThis.jStat;else globalThis.jStat = previous;}
});