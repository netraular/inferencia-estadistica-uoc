import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire, Module} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {planExercise, exerciseFamily, selectedCount, layoutExerciseExplanation} from './native-exercises.mjs';
import {validateNativePlan} from './native-plan.mjs';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = new URL('./',import.meta.url);
const cataloguePath = process.env.COURSE_VIDEO_CATALOGUE;
const catalogue = cataloguePath ? JSON.parse(fs.readFileSync(cataloguePath,'utf8')) : null;

function compile(name) {
  const filename = fileURLToPath(new URL(name,root));
  const result = babel.transformFileSync(filename,{
    babelrc:false,configFile:false,
    presets:[[require.resolve('@babel/preset-react'),{runtime:'classic'}]],
    plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')]
  });
  const loaded = new Module(filename);
  const localRequire = createRequire(filename);
  loaded.filename = filename;
  loaded.require = name => name.endsWith('.css') ? {} : name === './native-primitives.jsx' ? compile('native-primitives.jsx') : localRequire(name);
  loaded._compile(result.code,filename);
  return loaded.exports;
}

const {ExerciseScene} = compile('native-exercises.jsx');
const render = (scene,cueIndex,progress) => renderToStaticMarkup(React.createElement(ExerciseScene,{
  plan:scene,state:{index:scene.data.sceneIndex,cueIndex,progress,seconds:0,cueElapsed:progress,cueDuration:1,sceneElapsed:progress,step:{}}
}));

test('native exercise JSX compiles without a frozen catalogue', () => {
  assert.equal(typeof ExerciseScene,'function');
});

test('explanation containers expose real text bounds without hidden SVG clipping', () => {
  const text = 'P de A es la probabilidad del primer suceso; P de B, la del segundo. Empiezo sumándolas.';
  const future = 'La intersección se descuenta después.';
  const scene = {
    family:'events',
    data:{exerciseId:'probe',questionId:'a',sceneIndex:0,source:[{title:'Sumar los dos sucesos'}],model:{labels:['Solo A','Solo B','Ambos','Ninguno'],values:[0.2,0.5,0.1,0.2]}},
    cues:[{text:'Primero las probabilidades'},{text:'Empiezo sumando'},{text:future}],
    sourceLines:[{tex:'0.3+0.6=0.9',cue:0},{value:text,cue:0},{value:future,cue:2}]
  };
  const before = JSON.stringify(scene);
  const markup = render(scene,1,0.5);
  assert.ok(!/<svg[^>]*left:805[^>]*overflow:hidden/u.test(markup), 'explanation is clipped by its fixed-height SVG');
  assert.ok(markup.includes('data-native-zone="exercise-explanation"'));
  assert.ok(markup.includes('data-native-text'));
  assert.ok(markup.includes(text));
  assert.ok(!markup.includes(future));
  assert.ok(render(scene,2,0.5).includes(future));
  const element = ExerciseScene({plan:scene,state:{cueIndex:1,progress:0.5}});
  const column = React.Children.toArray(element.props.children).find(child => child.props['data-native-zone'] === 'exercise-explanation');
  const paragraph = React.Children.toArray(column.props.children).find(child => Object.hasOwn(child.props,'data-native-text'));
  assert.equal(paragraph.props.children,text);
  assert.equal(column.props.style.left,805);
  assert.equal(column.props.style.width,375);
  assert.equal(column.props.style.top+column.props.style.height,450);
  assert.equal(paragraph.props.style.fontSize,23);
  assert.equal(paragraph.props.style.flexShrink,0);
  for (const style of [column.props.style,paragraph.props.style]) {
    assert.ok(!['hidden','clip','scroll','auto'].includes(style.overflow));
    assert.equal(style.textOverflow,undefined);
    assert.equal(style.WebkitLineClamp,undefined);
  }
  assert.equal(paragraph.props.style.height,undefined);
  assert.equal(paragraph.props.style.maxHeight,undefined);
  const layout = layoutExerciseExplanation(scene.sourceLines,1);
  assert.ok(layout.estimatedHeight > layout.mathHeight+98, 'text must not reuse the original clipped 98px allocation');
  assert.ok(layout.estimatedHeight <= layout.height);
  assert.equal(JSON.stringify(scene),before);
});

test('explanation sizing wraps long tokens and rejects overflow instead of truncating', () => {
  const text = 'ABCDEFGHIJ'.repeat(30);
  const lines = [{value:text}];
  const layout = layoutExerciseExplanation(lines,0);
  assert.equal(layout.lines[0],lines[0]);
  assert.ok(layout.fontSize >= 14);
  assert.ok(layout.estimatedHeight <= layout.height);
  assert.throws(() => layoutExerciseExplanation([{value:'Full source explanation '.repeat(400)}],0),/author explicit pages/u);
});

test('every frozen exercise explanation fits its column at every cue without changing source', {skip:!catalogue}, () => {
  let checked = 0;
  for (const item of catalogue.items.filter(item => item.kind === 'exercise')) {
    const plan = planExercise(item);
    for (const scene of plan.scenes) {
      const before = JSON.stringify(scene.sourceLines);
      for (let cueIndex = 0; cueIndex < scene.cues.length; cueIndex++) {
        const layout = layoutExerciseExplanation(scene.sourceLines,cueIndex);
        assert.deepEqual(layout.lines,scene.sourceLines.filter(line => (line.cue ?? 0) <= cueIndex));
        assert.ok(layout.estimatedHeight <= layout.height,`${item.id}/${scene.data.sceneIndex}/${cueIndex}: column overflow`);
        assert.ok(layout.fontSize >= 14);
        checked++;
      }
      assert.equal(JSON.stringify(scene.sourceLines),before);
    }
  }
  assert.equal(checked,11752);
});

test('all frozen exercises preserve every original cue and reject unknown input', {skip:!catalogue}, () => {
  let exercises = 0;
  let scenes = 0;
  let cues = 0;
  const families = new Set();
  for (const item of catalogue.items) {
    const before = JSON.stringify(item);
    const plan = planExercise(item);
    assert.equal(JSON.stringify(item),before,`${item.id}: mutated frozen input`);
    if (item.kind !== 'exercise') {assert.equal(plan,null); continue;}
    validateNativePlan(item,plan);
    exercises++;
    scenes += plan.scenes.length;
    for (const scene of plan.scenes) {
      families.add(scene.family);
      cues += scene.cues.length;
      if (scene.data.mass) assert.ok(scene.data.mass.probabilities.every(value => Number.isFinite(value) && value >= 0));
      if (scene.data.density) assert.ok(scene.data.density.points.every(point => point.every(Number.isFinite)));
    }
  }
  assert.equal(exercises,387);
  assert.equal(scenes,5384);
  assert.equal(cues,11752);
  assert.equal(families.size,38);
  assert.throws(() => exerciseFamily({id:'unknown',exerciseId:'unknown',questionId:'unknown'}),/unsupported/);
  const changed = structuredClone(catalogue.items.find(item => item.exerciseId === 'practica-proporciones-proportions'));
  changed.animation.steps.find(step => step.title === 'Datos del enunciado').visual.lines[0].value = 'Different data';
  assert.throws(() => planExercise(changed),/unrecognized frozen parameters/);
});

test('every native scene produces finite SVG geometry without a video render', {skip:!catalogue}, () => {
  const errors = [];
  let checked = 0;
  for (const item of catalogue.items.filter(item => item.kind === 'exercise')) {
    const plan = planExercise(item);
    for (const [index,scene] of plan.scenes.entries()) {
      try {
        const markup = render(scene,scene.cues.length-1,0.65);
        assert.ok(markup.includes('data-native-mark'), 'missing animated mathematical mark');
        assert.ok(markup.includes('data-native-bound'), 'missing data-bound foreground');
        assert.ok(!/(?:="[^"]*\b(?:NaN|Infinity|undefined)\b)/u.test(markup), 'invalid SVG/CSS coordinate');
        assert.ok(!/<svg[^>]*left:805[^>]*overflow:hidden/u.test(markup), 'explanation has hidden SVG overflow');
        for (const line of scene.sourceLines.filter(line => !line.tex && (line.cue ?? 0) < scene.cues.length)) {
          const text = renderToStaticMarkup(React.createElement(React.Fragment,null,line.value || line.label || ''));
          assert.ok(markup.includes(text),'missing full source explanation');
        }
        checked++;
      } catch (error) {errors.push(`${item.id}/${index}: ${error.message}`);}
    }
  }
  assert.deepEqual([...new Set(errors.map(error => error.replace(/\/\d+:/u,':')))].slice(0,20),[]);
  assert.equal(checked,5384);
});

test('each family animates geometric marks and source equations wait for their own cue', {skip:!catalogue}, () => {
  const families = new Set();
  for (const item of catalogue.items.filter(item => item.kind === 'exercise')) {
    const plan = planExercise(item);
    if (families.has(plan.scenes[0].family)) continue;
    families.add(plan.scenes[0].family);
    const scene = plan.scenes.find(scene => scene.data.source[scene.data.sceneIndex].title === 'Resultado e interpretación') || plan.scenes.at(-1);
    const early = render(scene,0,0.1).match(/<svg[\s\S]*?<\/svg>/u)?.[0];
    const late = render(scene,0,0.9).match(/<svg[\s\S]*?<\/svg>/u)?.[0];
    assert.notEqual(early,late,`${scene.family}: static geometry`);
  }
  const scene = {family:'continuous',data:{exerciseId:'probe',sceneIndex:0,source:[{title:'Objective'}],model:{upper:1},density:{domain:[0,1],lower:0,upper:1,points:[[0,0],[1,2]]}},cues:[{text:'Objective'},{text:'Equation'}],sourceLines:[{tex:'p=1',cue:1}]};
  assert.ok(!render(scene,0,0.5).includes('data-native-math'));
  assert.ok(render(scene,1,0.5).includes('data-native-math'));
  assert.equal(selectedCount('strict',2,2),false);
  assert.equal(selectedCount('at-most',2,2),true);
  assert.equal(selectedCount('strict-tail',2,2),false);
  assert.equal(selectedCount('at-least',2,2),true);
});