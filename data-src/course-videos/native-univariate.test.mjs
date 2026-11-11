import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {normalStandardizationState, planUnivariate} from './native-univariate.mjs';
import {validateNativePlan} from './native-plan.mjs';
import {createNativePlan} from './native-scenes.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('package.json', root));
const babel = require('@babel/core');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const cataloguePath = process.env.COURSE_VIDEO_CATALOGUE;
const topics = new Set('variable-cdf masa densidad esperanza varianza momentos-transformaciones bernoulli-binomial poisson hipergeometrica geometrica-negativa uniforme-montecarlo exponencial normal gamma cauchy-weibull calculo-modelos familia-exponencial'.split(' '));
const catalogue = cataloguePath ? JSON.parse(fs.readFileSync(cataloguePath, 'utf8')) : null;
const owned = catalogue?.items.filter(item => ['section', 'recap'].includes(item.kind) && topics.has(item.parentLesson || item.id)) || [];
const compiled = new Map();

function loadJsx(name) {
  if (compiled.has(name)) return compiled.get(name);
  const filename = fileURLToPath(new URL(name, import.meta.url));
  const {code} = babel.transformFileSync(filename, {
    configFile:false,
    babelrc:false,
    presets:[[require.resolve('@babel/preset-react'), {runtime:'automatic'}]],
    plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const module = {exports:{}};
  const localRequire = id => id === './native-univariate.mjs' ? {normalStandardizationState} : id.endsWith('.css') ? {} : id.startsWith('./') && id.endsWith('.jsx') ? loadJsx(id) : id.startsWith('./') ? require(fileURLToPath(new URL(id, import.meta.url))) : require(id);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  compiled.set(name, module.exports);
  return module.exports;
}

const {UnivariateScene} = loadJsx('native-univariate.jsx');
function render(scene, cueIndex, progress) {
  return renderToStaticMarkup(React.createElement(UnivariateScene, {plan:scene, state:{index:0, cueIndex, progress, seconds:progress, cueElapsed:progress, cueDuration:1, sceneElapsed:cueIndex + progress, step:{}}}));
}

test('frozen CDF scene 0 uses the authored decimal-comma masses, not equal thirds', {skip:!catalogue}, () => {
  const {parseHTML} = require('linkedom');
  const item = owned.find(item => item.id === 'variable-cdf');
  const scene = validateNativePlan(item, planUnivariate(item)).scenes[0];
  assert.equal(scene.sourceLines.find(line => line.label === 'Probabilidades').value, '0: 0,1 \u00b7 2: 0,6 \u00b7 5: 0,3');
  const {document} = parseHTML(render(scene, scene.cues.length - 1, 1));
  const levels = Array.from(document.querySelectorAll('circle[fill="#117568"]'), circle => (365 - Number(circle.getAttribute('cy'))) / 260);
  assert.deepEqual(levels, [0.1, 0.7, 1]);
  assert.deepEqual(scene.sourceLines, item.animation.steps[0].visual.lines);
});

test('symbolic CDF opening has persistent two-dimensional sum geometry without numeric masses', {skip:!catalogue}, () => {
  const {parseHTML} = require('linkedom');
  const scene = planUnivariate(owned.find(item => item.id === 'variable-cdf')).scenes[0];
  for (const cueIndex of [0]) {
    const {document} = parseHTML(render(scene, cueIndex, 0));
    const geometry = document.querySelector('[data-native-distribution="symbolic"]');
    assert.ok(geometry);
    const sum = geometry.querySelector('[data-native-symbolic="sum"][data-native-mark][data-native-bound]');
    assert.equal(sum.getAttribute('d'), 'M110,290V340H710V290M410,340V375');
    assert.equal(sum.getAttribute('stroke-width'), '3');
    assert.equal(geometry.querySelectorAll('rect, circle, [data-native-value], [data-native-weight]').length, 0);
    assert.deepEqual(Array.from(document.querySelectorAll('[data-native-math]'), element => element.getAttribute('data-native-math')), scene.sourceLines.filter(line => line.tex && (line.cue ?? 0) <= cueIndex).map(line => line.tex));
  }
});

test('frozen density, arrival, stage, risk and link openings retain mathematical axes at progress zero', {skip:!catalogue}, () => {
  const {parseHTML} = require('linkedom');
  for (const id of ['densidad--altura-y-area', 'densidad--acumulada-por-tramos', 'poisson--exposicion', 'poisson--masa-y-complemento', 'poisson--aproximar-y-sumar', 'gamma--etapas-y-parametros', 'gamma--sumas-y-variacion', 'cauchy-weibull', 'familia-exponencial--binomial-natural', 'familia-exponencial--enlaces-glm']) {
    const scene = planUnivariate(owned.find(item => item.id === id)).scenes[0];
    const {document} = parseHTML(render(scene, 0, 0));
    const axis = Array.from(document.querySelectorAll('path[data-native-mark][data-native-bound]')).find(path => path.getAttribute('d') === 'M70,65V365H760');
    assert.ok(axis, id);
    assert.equal(axis.getAttribute('stroke-width'), '4', id);
  }
  const density = planUnivariate(owned.find(item => item.id === 'densidad--altura-y-area')).scenes[0];
  const {document} = parseHTML(render(density, 0, 0));
  assert.equal(document.querySelector('text[x="740"][y="440"]').textContent, '0.5');
});

test('frozen CDF scene 10 preserves its complete 348-character visual note', {skip:!catalogue}, () => {
  const {parseHTML} = require('linkedom');
  const item = owned.find(item => item.id === 'variable-cdf');
  const scene = validateNativePlan(item, planUnivariate(item)).scenes[10];
  const note = scene.sourceLines.find(line => line.value);
  assert.equal(note.value.length, 348);
  const {document} = parseHTML(render(scene, scene.cues.length - 1, 1));
  const text = Array.from(document.querySelectorAll('text[x="830"]')).at(-1);
  assert.equal(Array.from(text.querySelectorAll('tspan'), row => row.textContent).join(' '), note.value);
  assert.deepEqual(scene.sourceLines, item.animation.steps[10].visual.lines);
});

test('all frozen mass scenes use exact visible tables or symbolic geometry, including every former fallback', {skip:!catalogue}, context => {
  const {parseHTML} = require('linkedom');
  const tables = new Map([
    ['0: 0,2; 1: 0,5; 2: 0,3', [[0, 0.2], [1, 0.5], [2, 0.3]]],
    ['0: 0,1 \u00b7 2: 0,6 \u00b7 5: 0,3', [[0, 0.1], [2, 0.6], [5, 0.3]]],
    ['P(X = 0) = 0,1; P(X = 2) = 0,4; P(X = 5) = 0,5.', [[0, 0.1], [2, 0.4], [5, 0.5]]],
    ['0: 1; 2: 3; 4: 1', [[0, 1], [2, 3], [4, 1]]],
    ['0: 0,2; 2: 0,6; 4: 0,2', [[0, 0.2], [2, 0.6], [4, 0.2]]],
  ]);
  let scenes = 0;
  let formerFallbacks = 0;
  let numeric = 0;
  let symbolic = 0;
  for (const item of owned) {
    const original = JSON.stringify(item);
    for (const [stepIndex, scene] of validateNativePlan(item, planUnivariate(item)).scenes.entries()) {
      if (!/^(step-cdf|cdf-difference|mass-)/.test(scene.family)) continue;
      scenes++;
      for (let cueIndex = 0; cueIndex < scene.cues.length; cueIndex++) {
        const name = `${item.id}/${stepIndex}/${cueIndex}`;
        const lines = [...scene.data.story.priorInputs, ...scene.sourceLines.filter(line => (line.cue ?? 0) <= cueIndex)];
        const source = [...lines].reverse().find(line => tables.has(line.value));
        const {document} = parseHTML(render(scene, cueIndex, 1));
        const geometry = document.querySelector('[data-native-distribution]');
        assert.ok(geometry, name);
        if (source) {
          numeric++;
          const expected = tables.get(source.value);
          assert.equal(geometry.getAttribute('data-native-distribution'), 'numeric', name);
          const entries = Array.from(geometry.querySelectorAll('[data-native-value]'));
          assert.deepEqual(entries.map(entry => [Number(entry.getAttribute('data-native-value')), Number(entry.getAttribute('data-native-weight'))]), expected, name);
          if (/cdf/.test(scene.family)) {
            let cumulative = 0;
            for (const [index, entry] of entries.entries()) {
              const circles = entry.querySelectorAll('circle');
              assert.ok(Math.abs(Number(circles[0].getAttribute('cy')) - (365 - cumulative * 260)) < 1e-9, name);
              cumulative += expected[index][1];
              assert.ok(Math.abs(Number(circles[1].getAttribute('cy')) - (365 - cumulative * 260)) < 1e-9, name);
            }
            const path = Array.from(geometry.querySelectorAll('path')).find(path => path.getAttribute('pathLength') === '1');
            assert.ok(path, `${name}: missing cumulative path`);
            const heights = Array.from(path.getAttribute('d').matchAll(/[ML][^,]+,([^ ]+)/g), match => Number(match[1]));
            const expectedHeights = [365];
            cumulative = 0;
            for (const [, weight] of expected) {expectedHeights.push(365 - cumulative * 260); cumulative += weight; expectedHeights.push(365 - cumulative * 260);}
            expectedHeights.push(105);
            assert.deepEqual(heights, expectedHeights.map(height => Number(height.toFixed(3))), name);
          }
        } else {
          symbolic++;
          assert.equal(geometry.getAttribute('data-native-distribution'), 'symbolic', name);
          assert.equal(geometry.querySelectorAll('rect, circle, [data-native-value]').length, 0, name);
        }
        if (cueIndex === scene.cues.length - 1 && !lines.some(line => {
          const cells = String(line.value || '').split(';').map(cell => cell.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*:\s*(-?\d+(?:[.,]\d+)?)$/));
          return cells.length > 1 && cells.every(Boolean);
        })) formerFallbacks++;
      }
      assert.deepEqual(scene.sourceLines, item.animation.steps[stepIndex].visual?.lines || []);
    }
    assert.equal(JSON.stringify(item), original);
  }
  assert.equal(scenes, 48);
  assert.equal(formerFallbacks, 46);
  assert.ok(numeric > 0 && symbolic > 0);
  context.diagnostic(`${scenes} mass scenes, ${formerFallbacks} former last-cue fallbacks; ${numeric} numeric and ${symbolic} symbolic cue states`);
});

test('invalid or incomplete probability tables never invent or renormalize masses', {skip:!catalogue}, () => {
  const {parseHTML} = require('linkedom');
  const source = owned.find(item => item.id === 'variable-cdf');
  for (const value of ['0: 0; 2: 0', '0: -0,1; 2: 1,1', '0: 0,1; 2: 0,4', '0: 0,5; 0: 0,5', '0: 0,1 \u00b7 2: desconocido \u00b7 5: 0,9']) {
    const item = structuredClone(source);
    item.animation.steps[0].visual.lines.find(line => line.label === 'Probabilidades').value = value;
    const scene = validateNativePlan(item, planUnivariate(item)).scenes[0];
    const {document} = parseHTML(render(scene, scene.cues.length - 1, 1));
    assert.equal(document.querySelector('[data-native-distribution]').getAttribute('data-native-distribution'), 'symbolic', value);
    assert.equal(document.querySelectorAll('rect, circle').length, 0, value);
  }
  const item = structuredClone(source);
  item.animation.steps[0].visual.lines.find(line => line.label === 'Probabilidades').value = '5: 0,3 \u00b7 0: 0,1 \u00b7 2: 0,6';
  const scene = validateNativePlan(item, planUnivariate(item)).scenes[0];
  const {document} = parseHTML(render(scene, scene.cues.length - 1, 1));
  assert.deepEqual(Array.from(document.querySelectorAll('[data-native-value]'), entry => Number(entry.getAttribute('data-native-value'))), [0, 2, 5]);
});

test('frozen symbolic inversion scenes do not assign invented equal-width probability intervals', {skip:!catalogue}, () => {
  const {parseHTML} = require('linkedom');
  const scene = planUnivariate(owned.find(item => item.id === 'uniforme-montecarlo')).scenes.find(scene => scene.family === 'uniform-invert' && scene.data.story.mode === 'symbolic');
  assert.ok(scene);
  const {document} = parseHTML(render(scene, 0, 1));
  assert.equal(document.querySelector('[data-native-distribution]').getAttribute('data-native-distribution'), 'symbolic');
  assert.equal(document.querySelectorAll('rect, circle').length, 0);
});

test('all 158 frozen long notes retain their complete text inside the stage and above formulas', {skip:!catalogue}, context => {
  const {parseHTML} = require('linkedom');
  const {createCanvas, GlobalFonts} = require('@napi-rs/canvas');
  assert.ok(GlobalFonts.registerFromPath(fileURLToPath(new URL('pages/inferencia/vendor/atkinson-latin-400.woff2', root)), 'Atkinson'));
  const canvas = createCanvas(1, 1);
  const metricsContext = canvas.getContext('2d');
  let notes = 0;
  let minSize = 19;
  for (const item of owned) for (const [stepIndex, scene] of planUnivariate(item).scenes.entries()) for (const line of scene.sourceLines) {
    if (line.tex || String(line.value || '').length <= 110) continue;
    const cueIndex = line.cue ?? 0;
    const name = `${item.id}/${stepIndex}/${cueIndex}`;
    const visible = scene.sourceLines.filter(candidate => (candidate.cue ?? 0) <= cueIndex);
    assert.equal(visible.filter(candidate => !candidate.tex && (candidate.value || candidate.label)).at(-1), line, name);
    const {document} = parseHTML(render(scene, cueIndex, 1));
    const text = Array.from(document.querySelectorAll('[data-native-note] text'));
    assert.equal(Array.from(text.at(-1).querySelectorAll('tspan'), row => row.textContent).join(' '), String(line.value), name);
    const bottom = visible.some(candidate => candidate.tex) ? 205 : 450;
    const boxes = [];
    for (const element of text) {
      const size = Number(element.getAttribute('font-size'));
      minSize = Math.min(minSize, size);
      assert.ok(size >= 12, `${name}: unreadable note size ${size}`);
      metricsContext.font = `${size}px Atkinson`;
      let baseline = Number(element.getAttribute('y'));
      for (const row of element.querySelectorAll('tspan')) {
        baseline += Number(row.getAttribute('dy') || 0);
        const metrics = metricsContext.measureText(row.textContent);
        const x = Number(row.getAttribute('x'));
        const box = {left:x - metrics.actualBoundingBoxLeft, right:x + metrics.actualBoundingBoxRight, top:baseline - metrics.actualBoundingBoxAscent, bottom:baseline + metrics.actualBoundingBoxDescent};
        assert.ok(box.left >= 820 && box.right <= 1185, `${name}: horizontal note overflow: ${row.textContent}`);
        assert.ok(box.top >= 30 && box.bottom <= bottom, `${name}: vertical note or formula overflow`);
        for (const previous of boxes) assert.ok(!(box.left < previous.right && box.right > previous.left && box.top < previous.bottom && box.bottom > previous.top), `${name}: overlapping note rows`);
        boxes.push(box);
      }
    }
    assert.deepEqual(scene.sourceLines, item.animation.steps[stepIndex].visual.lines);
    notes++;
  }
  assert.equal(notes, 158);
  context.diagnostic(`${notes} complete frozen notes measured with Atkinson; minimum font size ${minSize}px`);
});

test('all owned frozen sections and recaps preserve every original cue', {skip:!catalogue}, () => {
  assert.equal(owned.length, 76);
  let scenes = 0;
  let cues = 0;
  const familySet = new Set();
  for (const item of owned) {
    const plan = validateNativePlan(item, planUnivariate(item));
    scenes += plan.scenes.length;
    for (const [stepIndex, scene] of plan.scenes.entries()) {
      familySet.add(scene.family);
      cues += scene.cues.length;
      assert.deepEqual(scene.sourceLines, item.animation.steps[stepIndex].visual?.lines || []);
      for (const [cueIndex, cue] of scene.cues.entries()) {
        assert.equal(cue.sourceCue, cueIndex);
        assert.equal(cue.anchor, cue.text);
        assert.ok(cue.visibleSource.every(line => (line.cue ?? 0) <= cueIndex));
      }
    }
  }
  assert.equal(scenes, 753);
  assert.equal(cues, 3117);
  assert.equal(familySet.size, 59);
});

test('foreign topics and exercise kinds are not claimed; unknown owned sections fail', {skip:!catalogue}, () => {
  assert.equal(planUnivariate({kind:'exercise', parentLesson:'normal'}), null);
  assert.equal(planUnivariate({kind:'section', parentLesson:'joint', id:'joint--unknown'}), null);
  const unknown = {...owned[0], sectionId:'unknown', id:'variable-cdf--unknown'};
  assert.throws(() => planUnivariate(unknown), /Unsupported/);
});

test('invalid reveals fail and plans do not alias the frozen catalogue', {skip:!catalogue}, () => {
  const item = structuredClone(owned[0]);
  const plan = planUnivariate(item);
  plan.scenes[0].sourceLines[0].label = 'Changed';
  assert.notEqual(item.animation.steps[0].visual.lines[0].label, 'Changed');
  item.animation.steps[0].visual.lines[0].cue = 99999;
  assert.throws(() => planUnivariate(item), /invalid reveal/);
});

test('all 59 families compile and have moving native mathematical geometry', {skip:!catalogue}, () => {
  const seen = new Set();
  for (const item of owned) for (const scene of planUnivariate(item).scenes) {
    if (seen.has(scene.family)) continue;
    seen.add(scene.family);
    const early = render(scene, 0, 0.25);
    const late = render(scene, 0, 0.75);
    assert.match(early, /data-native-mark/);
    assert.match(early, /data-native-bound/);
    assert.match(early, /width="1200" height="480"/);
    assert.doesNotMatch(early, /<canvas|konva|NaN|Infinity/);
    assert.notEqual(early, late, scene.family);
  }
  assert.equal(seen.size, 59);
});

test('all 541 frozen item openings and every scene family render at progress zero', {skip:!catalogue}, context => {
  assert.equal(catalogue.items.length, 541);
  const renderers = Object.fromEntries(['foundations', 'univariate', 'multivariate', 'exercises'].map(name => {
    const exports = loadJsx(`native-${name}.jsx`);
    return [name === 'exercises' ? 'exercise' : name, exports[`${name === 'exercises' ? 'Exercise' : name[0].toUpperCase() + name.slice(1)}Scene`]];
  }));
  const families = new Set();
  let scenes = 0;
  let cues = 0;
  for (const item of catalogue.items) {
    const original = JSON.stringify(item);
    const plan = createNativePlan(item);
    for (const [index, scene] of plan.scenes.entries()) {
      const name = `${item.id}/${index}/${plan.domain}/${scene.family}`;
      const html = renderToStaticMarkup(React.createElement(renderers[plan.domain], {plan:scene, state:{index, cueIndex:0, progress:0, seconds:0, cueElapsed:0, cueDuration:1, sceneElapsed:0, step:item.animation.steps[index]}}));
      assert.match(html, /data-native-mark/, name);
      assert.match(html, /data-native-bound/, name);
      assert.doesNotMatch(html, /(?:cx|cy|d|height|width|x|y|transform)="[^"]*(?:NaN|Infinity|undefined)/, name);
      families.add(`${plan.domain}:${scene.family}`);
      cues += scene.cues.length;
      scenes++;
    }
    assert.equal(JSON.stringify(item), original, item.id);
  }
  assert.equal(cues, 17872);
  assert.ok(families.size > 100);
  context.diagnostic(`541 item openings, ${scenes} scene openings, ${families.size} domain/families at progress zero; all 17872 cues and source items preserved`);
});

test('all source equations are cue gated and every narrated cue renders without invalid geometry', {skip:!catalogue}, () => {
  let rendered = 0;
  for (const item of owned) for (const scene of planUnivariate(item).scenes) for (let cueIndex = 0; cueIndex < scene.cues.length; cueIndex++) {
    const html = render(scene, cueIndex, 0.5);
    assert.doesNotMatch(html, /(?:cx|cy|d|height|width|x|y)="[^"]*(?:NaN|Infinity)/, `${item.id}/${cueIndex}`);
    const expected = scene.sourceLines.filter(line => line.tex && (line.cue ?? 0) <= cueIndex).slice(-3).map(line => line.tex);
    const actual = [...html.matchAll(/data-native-math="([^"]*)"/g)].map(match => match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'"));
    assert.deepEqual(actual, expected, `${item.id}/${cueIndex}`);
    rendered++;
  }
  assert.equal(rendered, 3117);
});

test('unsupported rendering families cannot silently fall back to a generic plot', () => {
  assert.throws(() => render({family:'unsupported', cues:[{action:'observe'}], sourceLines:[]}, 0, 0.5), /Unsupported/);
});

test('discrete inversion uses the exact narrated masses and source input reveals', {skip:!catalogue}, () => {
  const scene = planUnivariate(owned.find(item => item.id === 'uniforme-montecarlo--inversion-y-montecarlo')).scenes[0];
  assert.deepEqual(scene.data.story.masses, [0.2, 0.5, 0.3]);
  assert.deepEqual(scene.data.story.cuts, [0.2, 0.7, 1]);
  assert.deepEqual(scene.data.story.inputs.map(input => [input.value, input.output]), [[0.1, 0], [0.55, 1], [0.91, 2]]);
  for (const input of scene.data.story.inputs) {
    assert.doesNotMatch(render(scene, input.cue - 1, 0.5), new RegExp(`Q\\(${input.value}\\)`));
    assert.ok(render(scene, input.cue, 0.5).includes(`Q(${input.value}) = ${input.output}`));
  }
});

test('weighted expectation and standardization retain their original numerical examples', {skip:!catalogue}, () => {
  const expectation = planUnivariate(owned.find(item => item.id === 'esperanza--promedio-ponderado')).scenes[0];
  assert.deepEqual(expectation.data.story.values, [0, 4]);
  assert.deepEqual(expectation.data.story.weights, [0.5, 0.5]);
  assert.doesNotMatch(render(expectation, expectation.data.story.reveals[2] - 1, 0.5), />E\[X\] = 2</);
  assert.match(render(expectation, expectation.data.story.reveals[2], 0.5), />E\[X\] = 2</);
  const normal = planUnivariate(owned.find(item => item.id === 'normal--centro-y-escala')).scenes[0];
  assert.equal(normal.data.story.mean, 40);
  assert.equal(normal.data.story.sd, 4);
  assert.equal(normal.data.story.observation, 48);
});

test('normal standardization keeps the narrated observation two standard deviations from the center in every domain', {skip:!catalogue}, () => {
  const item = owned.find(item => item.id === 'normal--centro-y-escala');
  const scene = planUnivariate(item).scenes[0];
  const story = scene.data.story;
  for (const [cueIndex, cue] of scene.cues.entries()) {
    const model = normalStandardizationState(story, cueIndex);
    const centered = cueIndex >= story.centerCue;
    const standardized = cueIndex >= story.scaleCue;
    assert.deepEqual(model.domain, standardized ? [-4, 4] : centered ? [-16, 16] : [24, 56]);
    assert.equal(model.value, standardized ? 2 : centered ? 8 : 48);
    assert.equal((model.value - model.center) / (model.unit - model.center), 2);
    assert.equal(model.observationAt, 0.75);
    assert.equal(model.observationVisible, cueIndex >= story.observationCue);
    assert.equal(cue.text, item.animation.steps[0].cues[cueIndex].text);
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const html = render(scene, cueIndex, progress);
      const marker = html.match(/data-normal-observation="true"[^>]* d="M([^,]+),365V([^"]+)"/);
      if (model.observationVisible) {
        assert.ok(marker, `missing observation at cue ${cueIndex}`);
        assert.equal(Number(marker[1]), 70 + 0.75 * 670);
        assert.ok(Number(marker[2]) > 330 && Number(marker[2]) < 340);
      } else assert.equal(marker, null);
      assert.doesNotMatch(html, /Area bajo la normal|De X a Z:|\(x - mu\) \/ sigma/);
    }
  }
  const resultCue = scene.cues.findIndex(cue => cue.text.startsWith('El resultado es dos:'));
  assert.equal(resultCue, 10);
  assert.equal(normalStandardizationState(story, resultCue).value, 2);
});

test('normal labels reveal only the current source operation in separate title, tick and operation rows', {skip:!catalogue}, () => {
  const scene = planUnivariate(owned.find(item => item.id === 'normal--centro-y-escala')).scenes[0];
  const {story} = scene.data;
  assert.doesNotMatch(render(scene, story.observationCue - 1, 0.5), /data-normal-tick="observation"/);
  assert.doesNotMatch(render(scene, story.centerCue - 1, 0.5), /48 - 40 = 8 mm/);
  assert.doesNotMatch(render(scene, story.scaleCue - 1, 0.5), /8 \/ 4 = 2/);
  assert.match(render(scene, story.centerCue, 0.5), /y="452"[^>]*><tspan[^>]*>48 - 40 = 8 mm/);
  assert.match(render(scene, story.scaleCue, 0.5), /y="452"[^>]*><tspan[^>]*>8 \/ 4 = 2/);
  for (let cueIndex = 0; cueIndex < scene.cues.length; cueIndex++) {
    const html = render(scene, cueIndex, 0.5);
    const geometry = html.slice(html.indexOf('<g data-normal-domain='), html.indexOf('<path d="M800,30V450"'));
    const labels = [...geometry.matchAll(/<text[^>]* x="([^"]+)" y="([^"]+)"[^>]*>(.*?)<\/text>/g)];
    assert.ok(labels.length >= 4);
    for (const [, x, y, text] of labels) {
      assert.ok(Number(x) <= 800 && Number(x) >= 0);
      assert.ok([45, 99, 394, 452].includes(Number(y)));
      assert.equal([...text.matchAll(/<tspan\b/g)].length, 1);
    }
    assert.equal((geometry.match(/y="45"/g) || []).length, 1);
    assert.equal((geometry.match(/y="452"/g) || []).length, cueIndex >= story.centerCue ? 1 : 0);
  }
});

test('normal text ink stays separated inside the geometry and notes columns with the actual Remotion font', {skip:!catalogue}, () => {
  const {createCanvas, GlobalFonts} = require('@napi-rs/canvas');
  assert.ok(GlobalFonts.registerFromPath(fileURLToPath(new URL('pages/inferencia/vendor/atkinson-latin-400.woff2', root)), 'Atkinson'));
  const context = createCanvas(1, 1).getContext('2d');
  const scene = planUnivariate(owned.find(item => item.id === 'normal--centro-y-escala')).scenes[0];
  for (let cueIndex = 0; cueIndex < scene.cues.length; cueIndex++) {
    const html = render(scene, cueIndex, 0.5);
    const boxes = [];
    for (const [, attributes, rows] of html.matchAll(/<text\b([^>]*)>(.*?)<\/text>/g)) {
      const attribute = name => attributes.match(new RegExp(`(?:^| )${name}="([^"]*)"`))?.[1];
      const x = Number(attribute('x'));
      let baseline = Number(attribute('y'));
      const size = Number(attribute('font-size'));
      context.font = `${size}px Atkinson`;
      for (const [, rowAttributes, text] of rows.matchAll(/<tspan\b([^>]*)>(.*?)<\/tspan>/g)) {
        baseline += Number(rowAttributes.match(/dy="([^"]+)"/)?.[1] || 0);
        const metrics = context.measureText(text);
        const start = x - (attribute('text-anchor') === 'middle' ? metrics.width / 2 : attribute('text-anchor') === 'end' ? metrics.width : 0);
        const box = {text, left:start - metrics.actualBoundingBoxLeft, right:start + metrics.actualBoundingBoxRight, top:baseline - metrics.actualBoundingBoxAscent, bottom:baseline + metrics.actualBoundingBoxDescent};
        assert.ok(box.top >= 0 && box.bottom <= 480, `${cueIndex}: ${text} outside stage`);
        assert.ok(x < 800 ? box.left >= 0 && box.right < 800 : box.left >= 820 && box.right <= 1200, `${cueIndex}: ${text} crosses column boundary`);
        for (const previous of boxes) {
          const overlaps = box.left < previous.right + 6 && box.right + 6 > previous.left && box.top < previous.bottom + 6 && box.bottom + 6 > previous.top;
          assert.ok(!overlaps, `${cueIndex}: ${previous.text} overlaps ${text}`);
        }
        boxes.push(box);
      }
    }
    assert.ok(boxes.length >= 6);
    const scale = html.match(/data-normal-scale="true"[^>]* d="M([^,]+),106v8H([^v]+)v-8"/);
    const observation = html.match(/data-normal-observation="true"[^>]* d="M([^,]+),365V([^"]+)"/);
    assert.ok(scale);
    if (observation) {
      assert.equal(Number(observation[1]) - Number(scale[1]), 2 * (Number(scale[2]) - Number(scale[1])));
      const densityAtTwo = Math.exp(-2) / Math.sqrt(2 * Math.PI);
      assert.ok(Math.abs(Number(observation[2]) - (365 - 260 * 2.2 * densityAtTwo)) < 1e-10);
    }
  }
});