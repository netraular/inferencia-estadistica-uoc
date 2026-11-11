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

test('density openings retain curve and axes before any area has accumulated', () => {
  const scene = {
    family:'uniform',data:{exerciseId:'probe',questionId:'interval',sceneIndex:0,source:[{title:'Objective'}],model:{},density:{domain:[0,2],lower:0,upper:2,points:[[0,0.5],[2,0.5]]}},
    cues:[{text:'Interval'}],sourceLines:[]
  };
  const markup = render(scene,0,0);
  assert.match(markup,/<g data-native-mark="true" data-native-bound="true"><g stroke="#253330"/u);
  assert.match(markup,/<path data-native-bound="true" d="M65,105L715,105"/u);
  assert.match(markup,/<text[^>]*y="427"[^>]*><tspan[^>]*>x<\/tspan>/u);
  assert.match(markup,/<text[^>]*y="395"[^>]*><tspan[^>]*>2<\/tspan>/u);
});

test('source diagrams retain all supported kinds, axes and authored coordinates', () => {
  const diagrams = [
    {kind:'bars',labels:['A','B'],values:[0.3,0.7]},
    {kind:'matrix',rows:['R1','R2'],columns:['C1','C2'],values:[[0.1,null],[0.2,0.7]]},
    {kind:'trials',outcomes:['AA','AB','BA','BB'],groups:[{label:'A',indices:[0,1]}]},
    {kind:'tree',nodes:[{label:'A',children:[{label:'B',weight:0.3},{label:'C',weight:0.7}]}]},
    {kind:'number-line',min:-1,max:4,points:[0,2],intervals:[{from:0,to:2,closed:[true,false],label:'I'}]},
    {kind:'scatter',points:[[0,1],[2,3]],line:{slope:1,intercept:1}},
    {kind:'region',points:[[0,0],[0,1],[2,0]],xLabel:'Tiempo',yLabel:'f(x)'},
    {kind:'joint-normal',meanX:1,meanY:2,sdX:2,sdY:3,rho:0.5,cutX:2},
    {kind:'curve',domain:[-1,4],range:[0,1],ticks:[-1,0,1,2,3,4],points:[[-1,0],[0,0],[2,1],[4,1]],label:'F(x)'},
    {kind:'normal',mean:106,sd:8,lower:90,upper:120}
  ];
  for (const context of diagrams) {
    const scene = {family:'events',data:{context,sceneIndex:0,source:[]},sourceLines:[],cues:[{text:'Source'}]};
    const before = JSON.stringify(scene);
    const markup = render(scene,0,0);
    assert.ok(markup.includes(`data-native-source-diagram="${context.kind}"`),context.kind);
    assert.ok(markup.includes('data-native-mark'),context.kind);
    assert.ok(!/(?:="[^"]*\b(?:NaN|Infinity|undefined)\b)/u.test(markup),context.kind);
    if (['bars','scatter','region','joint-normal','curve','normal'].includes(context.kind)) {
      assert.match(markup,/M85,95V350H715/u);
      assert.match(markup,/<text[^>]*y="451"/u);
    }
    if (context.kind === 'curve') {
      assert.ok(markup.includes('M85,350L211,350L463,95L715,95'));
      for (const tick of context.ticks) assert.ok(markup.includes(`>${tick}</tspan>`));
    }
    assert.equal(JSON.stringify(scene),before);
  }
});

test('greetings and reverse seeks never reveal future model data or source cues', () => {
  const scene = {
    family:'normal',data:{sceneIndex:0,source:[{title:'Qué vamos a resolver'},{title:'Datos del enunciado'}],model:{mean:12345,sd:6789}},
    cues:[{text:'Greeting'},{text:'Later'}],sourceLines:[{value:'Calcula la probabilidad solicitada.',cue:0},{tex:'FUTURE=12345',cue:1}]
  };
  const before = JSON.stringify(scene);
  const opening = render(scene,0,0);
  assert.ok(opening.includes('Calcula la probabilidad solicitada.'));
  assert.ok(!opening.includes('<svg'));
  assert.ok(!opening.includes('12345'));
  assert.ok(render(scene,1,1).includes('data-native-math="FUTURE=12345"'));
  assert.equal(render(scene,0,0),opening);
  assert.ok(!render(scene,-1,0).includes('Calcula la probabilidad solicitada.'));
  const context = {kind:'curve',domain:[0,1],range:[0,1],points:[[0,0],[1,1]]};
  scene.data.phases = [{},{context}];
  assert.ok(render(scene,1,0).includes('data-native-source-diagram="curve"'));
  assert.equal(render(scene,0,0),opening);
  delete scene.data.phases;
  assert.equal(JSON.stringify(scene),before);
});

test('dense source matrices retain every full label and unknown value', () => {
  const context = {
    kind:'matrix',rows:Array.from({length:10},(_,index) => `row-${index}`),
    columns:Array.from({length:20},(_,index) => `S${index}:N-Ma`),
    values:Array.from({length:10},() => Array(20).fill(null))
  };
  const scene = {family:'selection',data:{context,sceneIndex:0,source:[]},sourceLines:[],cues:[{text:'Source'}]};
  const markup = render(scene,0,0);
  for (const label of [...context.rows,...context.columns]) assert.ok(markup.includes(`>${label}</tspan>`),label);
  assert.equal((markup.match(/rotate\(-90 /gu) || []).length,20);
  assert.equal((markup.match(/>\?<\/tspan>/gu) || []).length,200);
  assert.ok(markup.includes('stroke-width="3"'));
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

test('every frozen exercise exposes only exact cue-visible formulas and deterministic seeks', {skip:!catalogue}, () => {
  let cues = 0;
  for (const item of catalogue.items.filter(item => item.kind === 'exercise')) {
    const plan = planExercise(item);
    for (const scene of plan.scenes) {
      const before = JSON.stringify(scene);
      const opening = render(scene,0,0);
      for (let cueIndex=0;cueIndex<scene.cues.length;cueIndex++) {
        const markup = render(scene,cueIndex,0);
        const actual = Array.from(markup.matchAll(/data-native-math="([^"]*)"/gu),match => match[1]);
        const expected = scene.sourceLines.filter(line => line.tex && (line.cue ?? 0) <= cueIndex).map(line =>
          renderToStaticMarkup(React.createElement('div',{'data-native-math':line.tex})).match(/data-native-math="([^"]*)"/u)[1]);
        assert.deepEqual(actual,expected,`${item.id}/${scene.data.sceneIndex}/${cueIndex}: future or changed formula`);
        cues++;
      }
      assert.equal(render(scene,0,0),opening,`${item.id}/${scene.data.sceneIndex}: reverse seek changed opening`);
      assert.equal(JSON.stringify(scene),before);
    }
  }
  assert.equal(cues,11752);
});

test('each family responds to its narrated source and equations wait for their own cue', {skip:!catalogue}, () => {
  const families = new Set();
  for (const item of catalogue.items.filter(item => item.kind === 'exercise')) {
    const plan = planExercise(item);
    if (families.has(plan.scenes[0].family)) continue;
    families.add(plan.scenes[0].family);
    const scene = plan.scenes.find(scene => scene.data.source[scene.data.sceneIndex].title === 'Resultado e interpretación') || plan.scenes.at(-1);
    const early = render(scene,0,0.1);
    const late = render(scene,0,0.9);
    assert.notEqual(early,late,`${scene.family}: static narration reveal`);
    assert.equal(render(scene,0,0.1),early,`${scene.family}: nondeterministic reverse seek`);
  }
  const scene = {family:'continuous',data:{exerciseId:'probe',sceneIndex:0,source:[{title:'Objective'}],model:{upper:1},density:{domain:[0,1],lower:0,upper:1,points:[[0,0],[1,2]]}},cues:[{text:'Objective'},{text:'Equation'}],sourceLines:[{tex:'p=1',cue:1}]};
  assert.ok(!render(scene,0,0.5).includes('data-native-math'));
  assert.ok(render(scene,1,0.5).includes('data-native-math'));
  assert.equal(selectedCount('strict',2,2),false);
  assert.equal(selectedCount('at-most',2,2),true);
  assert.equal(selectedCount('strict-tail',2,2),false);
  assert.equal(selectedCount('at-least',2,2),true);
});