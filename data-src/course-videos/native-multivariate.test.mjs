import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
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