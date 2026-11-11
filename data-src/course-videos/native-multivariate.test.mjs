import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {courseFrame, MODEL, VOICE, prepareCourseItem, sha256} from './course-contract.mjs';
import {planMultivariate} from './native-multivariate.mjs';
import {validateNativePlan} from './native-plan.mjs';

const cataloguePath = process.env.COURSE_VIDEO_CATALOGUE;
const catalogue = cataloguePath ? JSON.parse(fs.readFileSync(cataloguePath, 'utf8')) : null;
const localRequire = createRequire(new URL('./package.json', import.meta.url));
const rootRequire = createRequire(new URL('../../package.json', import.meta.url));
const babel = rootRequire('@babel/core');
const React = localRequire('react');
const {renderToStaticMarkup} = localRequire('react-dom/server');
const {parseHTML} = rootRequire('linkedom');
const compiled = new Map();

function compileJsx(filename) {
  if (compiled.has(filename)) return compiled.get(filename);
  const requireFromFile = createRequire(filename);
  const output = babel.transformFileSync(filename, {babelrc:false, configFile:false,
    presets:[rootRequire.resolve('@babel/preset-react')],
    plugins:[rootRequire.resolve('@babel/plugin-transform-modules-commonjs')]});
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(fileURLToPath(new URL('.', import.meta.url)));
  loaded.require = name => name.endsWith('.css') ? {} : name === './native-primitives.jsx'
    ? compileJsx(fileURLToPath(new URL(name, import.meta.url))) : requireFromFile(name);
  loaded._compile(output.code, filename);
  compiled.set(filename, loaded.exports);
  return loaded.exports;
}

const {MultivariateScene} = compileJsx(fileURLToPath(new URL('./native-multivariate.jsx', import.meta.url)));
const owned = catalogue?.items.flatMap(item => {
  const plan = planMultivariate(item);
  return plan ? [{item, plan}] : [];
}) || [];

function render(scene, step, index, cueIndex, progress) {
  return renderToStaticMarkup(React.createElement(MultivariateScene, {plan:scene,
    state:{step, index, cueIndex, progress, seconds:progress * 2, cueElapsed:progress * 2, cueDuration:2, sceneElapsed:cueIndex * 2 + progress * 2}}));
}

test('all owned frozen sections and recaps preserve cue identity and source gates', {skip:!catalogue}, () => {
  assert.equal(owned.length, 33);
  const before = JSON.stringify(catalogue);
  let cueCount = 0;
  for (const {item, plan} of owned) {
    validateNativePlan(item, plan);
    for (const [index, scene] of plan.scenes.entries()) {
      assert.equal(scene.data.sourceIdentity, `${item.id}/${index}`);
      for (const [cueIndex, cue] of scene.cues.entries()) {
        assert.equal(cue.anchor, cue.text);
        assert.equal(cue.sourceCue, cueIndex);
        assert.deepEqual(cue.sourceLineIndices, scene.sourceLines.flatMap((line, lineIndex) => (line.cue ?? 0) <= cueIndex ? [lineIndex] : []));
        cueCount++;
      }
    }
  }
  assert.equal(cueCount, 1365);
  assert.equal(JSON.stringify(catalogue), before);
});

test('unowned entries return null and unsupported owned sections fail explicitly', () => {
  assert.equal(planMultivariate({id:'another-topic', kind:'section'}), null);
  assert.equal(planMultivariate({id:'exercise', parentLesson:'multinomial', kind:'exercise'}), null);
  assert.throws(() => planMultivariate({id:'multinomial--unknown', parentLesson:'multinomial', kind:'section', canonicalSha256:'test', animation:{steps:[{title:'unknown', cues:[{text:'unknown'}]}]}}), /Unsupported multivariate section/);
  assert.throws(() => renderToStaticMarkup(React.createElement(MultivariateScene, {plan:{family:'unknown', data:{}, cues:[{action:'unknown'}], sourceLines:[]}, state:{cueIndex:0}})), /Unsupported multivariate visual family/);
});

test('recaps retain their own capacities, cuts and Gaussian model instead of section values', {skip:!catalogue}, () => {
  const findPlan = id => owned.find(entry => entry.item.id === id).plan;
  const section = findPlan('normal-bivariante--cola-condicional').scenes[0].data.geometry.gaussian;
  assert.deepEqual([section.meanX, section.meanY, section.sdX, section.sdY, section.rho, section.threshold], [30, 70, 5, 8, 0.25, 82]);
  const recap = findPlan('normal-bivariante').scenes[1].data.geometry.gaussian;
  assert.deepEqual([recap.meanX, recap.meanY, recap.sdX, recap.sdY, recap.rho, recap.threshold], [12, 30, 2, 4, 0.6, 35.6]);
  assert.equal(findPlan('marginales').scenes[1].data.geometry.capacity, 2);
  const conditional = findPlan('conjunta-condicional');
  assert.equal(conditional.scenes[0].family, 'discrete-conditional');
  assert.equal(conditional.scenes[1].data.geometry.capacity, 2);
  assert.equal(conditional.scenes[1].data.geometry.cut, 0.5);
});

test('all cue frames render native marks and only originally revealed mathematics', {skip:!catalogue}, () => {
  for (const {item, plan} of owned) for (const [index, scene] of plan.scenes.entries()) {
    for (const [cueIndex] of scene.cues.entries()) {
      const markup = render(scene, item.animation.steps[index], index, cueIndex, 0.5);
      const {document} = parseHTML(markup);
      assert.ok(document.querySelector('[data-native-mark]'), `${item.id}/${index}/${cueIndex}: no mathematical marks`);
      const allowed = new Set(scene.sourceLines.filter(line => (line.cue ?? 0) <= cueIndex).map(line => line.tex).filter(Boolean));
      for (const formula of document.querySelectorAll('[data-native-math]')) assert.ok(allowed.has(formula.getAttribute('data-native-math')), `${item.id}/${index}/${cueIndex}: early formula`);
      assert.ok(!/NaN|Infinity|undefined/.test(markup), `${item.id}/${index}/${cueIndex}: invalid geometry`);
    }
  }
});

test('six real preflight table openings retain a dark reference grid without revealing future content', {skip:!catalogue}, () => {
  const fixtures = [
    ['conjunta-discreta--parejas', 0],
    ['conjunta-discreta--rectangulo-acumulado', 0],
    ['marginales--proyeccion-y-corte', 0],
    ['conjunta-discreta', 1],
    ['conjunta-discreta', 2],
    ['marginales', 2],
  ];
  for (const [id, index] of fixtures) {
    const {item, plan} = owned.find(entry => entry.item.id === id);
    const scene = plan.scenes[index], step = item.animation.steps[index];
    const original = JSON.stringify({item, plan});
    let reference;
    for (const [cueIndex, progress] of [[-1, 0], [-1, 0.8], [0, 0], [0, 0.8]]) {
      const context = `${id}/${index}/${cueIndex}/${progress}`;
      const {document} = parseHTML(render(scene, step, index, cueIndex, progress));
      const grid = document.querySelector('[data-native-table-frame]');
      assert.ok(grid, `${context}: missing persistent table context`);
      assert.ok(grid.hasAttribute('data-native-bound') && grid.hasAttribute('data-native-mark'), `${context}: unaudited reference`);
      assert.equal(grid.getAttribute('fill'), 'none');
      assert.equal(grid.getAttribute('stroke'), '#253330');
      assert.equal(Number(grid.getAttribute('stroke-width')), 4);
      assert.equal(grid.getAttribute('d'), 'M170,70H520V300H170ZM170,185H520M345,70V300');
      reference ??= grid.outerHTML;
      assert.equal(grid.outerHTML, reference, `${context}: reference collapses with progress`);
      const cells = Array.from(document.querySelectorAll('[data-cell]'));
      assert.equal(cells.length, 4);
      const masses = scene.data.table.find(entry => entry.cue <= cueIndex)?.masses;
      const values = cells.flatMap(cell => Array.from(cell.parentNode.querySelectorAll('text'), text => text.textContent));
      assert.deepEqual(values, masses ? masses.map(value => String(value).replace('.', ',')) : [], `${context}: future cell mass`);
      const allowed = scene.sourceLines.filter(line => (line.cue ?? 0) <= cueIndex && line.tex).map(line => line.tex).slice(-2);
      assert.deepEqual(Array.from(document.querySelectorAll('[data-native-math]'), formula => formula.getAttribute('data-native-math')), allowed, `${context}: future formula`);
      if (cueIndex === -1) assert.equal(document.querySelector('[data-native-notes]').textContent, '');
    }
    assert.equal(JSON.stringify({item, plan}), original);
  }
});

test('frozen multivariate source notes retain full text without stage or formula overflow', {skip:!catalogue}, () => {
  const regression=owned.find(entry=>entry.item.id==='multinomial').plan.scenes[10];
  assert.equal(regression.sourceLines[0].value.length,404);
  let longNotes=0;
  for (const {item,plan} of owned) for (const [index,scene] of plan.scenes.entries()) {
    for (const [cueIndex] of scene.cues.entries()) {
      const notes=scene.sourceLines.filter(line=>(line.cue ?? 0)<=cueIndex && !line.tex && (line.value || line.label)).slice(-2);
      if (!notes.length) continue;
      const context=`${item.id}/${index}/${cueIndex}`;
      const {document}=parseHTML(render(scene,item.animation.steps[index],index,cueIndex,.5));
      const fields=notes.flatMap(line=>[line.label,line.value].filter(Boolean));
      const texts=Array.from(document.querySelectorAll('[data-native-notes] > text'));
      assert.deepEqual(texts.map(node=>Array.from(node.children,span=>span.textContent).join(' ')),fields,`${context}: source note omitted`);
      let previousBottom=0;
      for (const text of texts) {
        const fontSize=Number(text.getAttribute('font-size'));
        const x=Number(text.getAttribute('x'));
        let baseline=Number(text.getAttribute('y'));
        assert.ok(x>=820,`${context}: note overlaps diagram`);
        assert.ok(baseline-fontSize>=previousBottom,`${context}: notes overlap`);
        for (const span of text.children) {
          baseline+=Number(span.getAttribute('dy') || 0);
          assert.ok(x+span.textContent.length*fontSize*.7<=1200,`${context}: horizontal note overflow`);
          assert.ok(baseline-fontSize>=0 && baseline+fontSize*.25<=345,`${context}: note crosses formula rail`);
        }
        previousBottom=baseline+fontSize*.25;
      }
      longNotes+=notes.filter(line=>line.value?.length>150).length;
    }
  }
  assert.ok(longNotes>0);
});

test('a valid frozen conditional scene holds its opening during 300ms of leading silence', {skip:!catalogue}, () => {
  const {item,plan}=owned.find(entry=>entry.item.id==='normal-bivariante--media-y-varianza-condicional');
  const original=JSON.stringify(item);
  assert.equal(item.animation.steps.length,1);
  const step=item.animation.steps[0];
  const mp3=Buffer.from('fixture-only, never rendered or published');
  const audio={id:item.id,model:MODEL,voice:VOICE,cueTiming:'measured',canonicalSha256:item.canonicalSha256,
    mp3Sha256:sha256(mp3),mp3Bytes:mp3.length,duration:step.duration+.3,
    scenes:[{start:0,end:step.duration+.3,cues:step.cues.map(cue=>({...cue,start:cue.start+.3,end:cue.end+.3}))}]};
  const storyboard=prepareCourseItem(item,audio,mp3,{native:true});
  assert.equal(storyboard.audio.scenes[0].start,0);
  assert.equal(storyboard.audio.scenes[0].cues[0].start,.3);
  const marks=document=>Array.from(document.querySelectorAll('[data-native-mark]'),node=>node.outerHTML);
  const frameDocument=frame=>{
    const state=courseFrame(storyboard,frame);
    const timing=storyboard.audio.scenes[state.index];
    const cue=timing.cues[state.cueIndex];
    const seconds=frame/storyboard.fps;
    const cueDuration=Math.max(1/storyboard.fps,(cue?.end ?? timing.end)-(cue?.start ?? timing.start));
    const cueElapsed=Math.max(0,seconds-(cue?.start ?? timing.start));
    const markup=renderToStaticMarkup(React.createElement(MultivariateScene,{plan:plan.scenes[state.index],
      state:{...state,seconds,cueDuration,cueElapsed,sceneElapsed:seconds-timing.start,progress:Math.min(1,cueElapsed/cueDuration)}}));
    return {state,document:parseHTML(markup).document};
  };
  const opening=frameDocument(0);
  assert.equal(opening.state.cueIndex,-1);
  assert.equal(opening.state.caption,'');
  assert.ok(marks(opening.document).length>0);
  for (const frame of [0,4,8]) {
    const {state,document}=frameDocument(frame);
    assert.equal(state.cueIndex,-1);
    assert.equal(state.caption,'');
    assert.deepEqual(marks(document),marks(opening.document));
    assert.equal(document.querySelector('[data-native-math]'),null);
  }
  const firstCue=frameDocument(9);
  assert.equal(firstCue.state.cueIndex,0);
  assert.equal(firstCue.state.caption,step.cues[0].text);
  assert.deepEqual(marks(firstCue.document),marks(opening.document));
  assert.deepEqual(Array.from(firstCue.document.querySelectorAll('[data-native-math]'),node=>node.getAttribute('data-native-math')),['40-30=10']);
  assert.ok(JSON.stringify(marks(frameDocument(30).document))!==JSON.stringify(marks(firstCue.document)));
  for (const cueIndex of [-2,plan.scenes[0].cues.length]) assert.throws(()=>render(plan.scenes[0],step,0,cueIndex,0),/Unknown multivariate cue/);
  assert.equal(JSON.stringify(item),original);
});

test('each family has changing mathematical geometry within an explanatory cue', {skip:!catalogue}, () => {
  const animated = new Set();
  const families = new Set();
  for (const {item, plan} of owned) for (const [index, scene] of plan.scenes.entries()) {
    families.add(scene.family);
    if (animated.has(scene.family)) continue;
    for (const [cueIndex, cue] of scene.cues.entries()) {
      if (cue.action.startsWith('establish-')) continue;
      const first = parseHTML(render(scene, item.animation.steps[index], index, cueIndex, 0.15)).document;
      const last = parseHTML(render(scene, item.animation.steps[index], index, cueIndex, 0.85)).document;
      const marks = document => Array.from(document.querySelectorAll('[data-native-mark]'), node => node.outerHTML).join('');
      if (marks(first) !== marks(last)) {animated.add(scene.family); break;}
    }
  }
  assert.deepEqual([...animated].sort(), [...families].sort());
});