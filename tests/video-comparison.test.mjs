import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {parseHTML} from 'linkedom';
import {runInNewContext} from 'node:vm';

const root = new URL('../', import.meta.url);
const require = createRequire(import.meta.url);
const ids = ['actual','manim','remotion','canvas-commons'];

test('comparison freezes measured narration and correct probabilities for the three models', () => {
  const script = JSON.parse(readFileSync(new URL('static/comparativa-videos/shared/script.json',root)));
  const source = JSON.parse(readFileSync(new URL('static/audio/manifest.json',root))).lessons['calculo--franjas'];
  assert.equal(script.duration,source.duration);
  assert.equal(script.frames,1185);
  assert.equal(script.cueTiming,'measured');
  assert.equal(script.cues.length,10);
  assert.deepEqual(script.cues,source.scenes[0].cues.map(cue=>({...cue,text:cue.text.replace(/\s+/g,' ').trim()})));
  const audio = readFileSync(new URL('static/comparativa-videos/shared/audio.mp3',root));
  assert.equal(createHash('sha256').update(audio).digest('hex'),script.audioSha256);
  assert.deepEqual(audio,readFileSync(new URL(`static/${source.src}`,root)));
  const [uniform,increasing,piecewise] = script.models;
  assert(Math.abs(uniform.height*0.8-uniform.probability)<1e-12);
  assert(Math.abs(increasing.slope*(1.2**2-0.4**2)/2-increasing.probability)<1e-12);
  assert(Math.abs(piecewise.heights[0]*0.6+piecewise.heights[1]*0.2-piecewise.probability)<1e-12);
});

test('four independent routes compile and the comparison is linked from navigation', () => {
  const babel = require('@babel/core');
  const files = ['src/pages/comparativa-videos/index.jsx','src/components/VideoComparisonExample.jsx',
    ...ids.map(id=>`src/pages/comparativa-videos/${id}.jsx`)];
  for (const file of files) {
    assert.doesNotThrow(()=>babel.transformSync(readFileSync(new URL(file,root),'utf8'),{
      filename:file,babelrc:false,configFile:false,presets:[require.resolve('@docusaurus/core/lib/babel/preset')]
    }));
  }
  for (const id of ids) {
    assert(existsSync(new URL(`static/comparativa-videos/${id}/player.html`,root)));
    assert(!existsSync(new URL(`static/comparativa-videos/${id}/index.html`,root)),`Static player collides with Docusaurus route: ${id}`);
  }
  const config = readFileSync(new URL('docusaurus.config.js',root),'utf8');
  assert.match(config,/to: '\/comparativa-videos\/'/);
  const brief = readFileSync(new URL('data-src/video-comparison/BRIEF.md',root),'utf8');
  assert.match(brief,/Do not inspect, import, copy or compare/);
});

test('all four finished players have local media and published source, and no recursive frame', () => {
  const results = JSON.parse(readFileSync(new URL('static/comparativa-videos/shared/results.json',root)));
  assert.deepEqual(results.map(item=>item.id),ids);
  for (const id of ids) {
    const folder = new URL(`static/comparativa-videos/${id}/`,root);
    const {document} = parseHTML(readFileSync(new URL('player.html',folder),'utf8'));
    const player = document.querySelector('video');
    assert(player.hasAttribute('controls'));
    assert(player.hasAttribute('playsinline'));
    assert(!player.hasAttribute('autoplay'));
    assert.equal(document.querySelectorAll('iframe').length,0);
    assert(existsSync(new URL(player.getAttribute('poster'),folder)));
    assert(existsSync(new URL(player.querySelector('source').getAttribute('src'),folder)));
    assert(existsSync(new URL('source.tar.gz',folder)));
    assert(existsSync(new URL(`static/comparativa-videos/shared/${id}-report.md`,root)));
    const result = results.find(item=>item.id===id);
    assert.equal(result.frames,1185);
    assert.equal(result.measuredCaptions,10);
    assert(result.audioCorrelation>0.99);
  }
  const wrapper = readFileSync(new URL('src/components/VideoComparisonExample.jsx',root),'utf8');
  assert.doesNotMatch(wrapper,/<iframe|\/player\.html/);
});

test('comparison renders native video with base-aware media URLs instead of an embedded HTML route', () => {
  const React = require('react');
  const {renderToStaticMarkup} = require('react-dom/server');
  const source = readFileSync(new URL('src/components/VideoComparisonExample.jsx',root),'utf8');
  const compiled = require('@babel/core').transformSync(source,{
    filename:'VideoComparisonExample.jsx',babelrc:false,configFile:false,
    presets:[require.resolve('@docusaurus/core/lib/babel/preset')],
    plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')]
  }).code;
  const module = {exports:{}};
  const mocks = {
    '@theme/Layout':({children})=>React.createElement('main',null,children),
    '@docusaurus/Link':({children,to})=>React.createElement('a',{href:to},children),
    '@docusaurus/useBaseUrl':value=>`/inferencia${value}`,
    '@site/static/comparativa-videos/shared/results.json':JSON.parse(readFileSync(new URL('static/comparativa-videos/shared/results.json',root))),
    './VideoComparison.module.css':{page:'page',player:'player'}
  };
  runInNewContext(compiled,{module,exports:module.exports,require:name=>name in mocks ? mocks[name] : require(name)});
  for (const id of ids) {
    const html = renderToStaticMarkup(React.createElement(module.exports.default,{technology:id,title:id}));
    const {document} = parseHTML(html);
    const video = document.querySelector('video');
    assert.equal(document.querySelectorAll('iframe').length,0);
    assert(video.hasAttribute('controls'));
    assert(video.getAttributeNames().some(name=>name.toLowerCase()==='playsinline'));
    assert.equal(video.getAttribute('poster'),`/inferencia/comparativa-videos/${id}/poster.jpg`);
    assert.equal(video.querySelector('source').getAttribute('src'),`/inferencia/comparativa-videos/${id}/video.mp4`);
    assert(!video.hasAttribute('autoplay'));
  }
});

test('second comparison uses a named shared timeline and consistent normal probabilities', () => {
  const storyboard = JSON.parse(readFileSync(new URL('data-src/video-comparison/normal/storyboard.json',root)));
  assert.equal(storyboard.frames,storyboard.duration*storyboard.fps);
  assert.equal((storyboard.threshold-storyboard.mean)/storyboard.sigma,storyboard.z);
  assert(Math.abs(storyboard.probability-0.8413447460685429)<1e-12);
  assert.equal(storyboard.audio,false);
  assert.deepEqual(storyboard.phases.map(phase=>phase.id),['density','width','substitution','mapping','probability','complement']);
  let end = 0;
  for (const phase of storyboard.phases) {
    assert.equal(phase.start,end);
    assert(phase.end>phase.start);
    end = phase.end;
  }
  assert.equal(end,storyboard.duration);
  for (const [start,end] of Object.values(storyboard.events)) {
    assert(start>=0 && end>start && end<=storyboard.duration);
  }
});

test('second Remotion example compiles, validates TeX and uses a real normal distribution', () => {
  const engine = createRequire(new URL('data-src/video-comparison/remotion/package.json',root));
  const statistics = engine('jstat');
  const katex = engine('katex');
  const storyboard = JSON.parse(readFileSync(new URL('data-src/video-comparison/normal/storyboard.json',root)));
  assert(Math.abs(statistics.normal.cdf(storyboard.z,0,1)-storyboard.probability)<1e-12);
  for (const tokens of Object.values(storyboard.formulas)) {
    assert.doesNotThrow(()=>katex.renderToString(tokens.join(' '),{throwOnError:true}));
  }
  for (const file of ['normal.jsx','normal-chart.jsx','normal-formula.jsx']) {
    assert.doesNotThrow(()=>require('@babel/core').transformSync(readFileSync(new URL(`data-src/video-comparison/remotion/src/${file}`,root),'utf8'),{
      filename:file,babelrc:false,configFile:false,presets:[require.resolve('@docusaurus/core/lib/babel/preset')]
    }));
  }
});

test('second comparison publishes both native players and complete matching source', () => {
  const results = JSON.parse(readFileSync(new URL('static/comparativa-videos/normal/results.json',root)));
  const sources = JSON.parse(readFileSync(new URL('static/comparativa-videos/normal/sources.json',root)));
  assert.deepEqual(results.map(item=>item.id),['manim','remotion']);
  for (const result of results) {
    const movie = readFileSync(new URL(`static/comparativa-videos/normal/${result.id}/video.mp4`,root));
    assert.equal(movie.length,result.bytes);
    assert.equal(createHash('sha256').update(movie).digest('hex'),result.sha256);
    assert.equal(result.frames,1440);
    assert.equal(result.duration,48);
    assert.equal(result.audio,false);
  }
  for (const files of Object.values(sources)) for (const file of files) {
    assert.equal(file.content,readFileSync(new URL(`data-src/video-comparison/${file.name}`,root),'utf8'));
  }
  assert(existsSync(new URL('static/comparativa-videos/normal/source.tar.gz',root)));
  const source = readFileSync(new URL('src/pages/comparativa-videos/normal.jsx',root),'utf8');
  assert.doesNotMatch(source,/<iframe|player\.html/);
  assert.match(source,/<Tabs/);
  assert.match(source,/<SourceFile file=\{scene\}/);
  assert.match(readFileSync(new URL('src/pages/comparativa-videos/index.jsx',root),'utf8'),/\/comparativa-videos\/normal\//);
  assert.doesNotThrow(()=>require('@babel/core').transformSync(source,{
    filename:'normal.jsx',babelrc:false,configFile:false,presets:[require.resolve('@docusaurus/core/lib/babel/preset')]
  }));
});

test('five-second timing separates all render attempts from preparation without claiming pure coding time', async () => {
  const {summarizeTiming} = await import('../data-src/video-comparison/five-seconds/clock.mjs');
  const measurements = summarizeTiming({startedAtMs: 1000, finishedAtMs: 10000, events: [
    {type: 'render-start', atMs: 3000}, {type: 'render-end', atMs: 4000},
    {type: 'render-start', atMs: 5000}, {type: 'render-end', atMs: 7000}
  ]});
  assert.deepEqual(measurements,{totalMs: 9000, renderMs: 3000, preparationAndChecksMs: 6000});
  assert.throws(()=>summarizeTiming({startedAtMs: 0, finishedAtMs: 1000, events: [{type: 'render-start', atMs: 100}]}));
  const brief = JSON.parse(readFileSync(new URL('data-src/video-comparison/five-seconds/brief.json',root)));
  assert.equal(brief.frames,brief.fps*brief.duration);
  assert.equal(brief.probability+brief.complement,1);
  assert.deepEqual(brief.phases.map(phase=>[phase.start,phase.end]),[[0,1],[1,3],[3,5]]);
});

test('bivariate shared fragment computes the conditional law and preserves measured cues', () => {
  const script = JSON.parse(readFileSync(new URL('static/comparativa-videos/bivariante/shared/script.json',root)));
  const {meanX,meanY,sigmaX,sigmaY,rho,observedX,thresholdY} = script.parameters;
  assert.equal(script.frames,Math.round(script.duration*script.fps));
  assert.equal(meanY+rho*sigmaY/sigmaX*(observedX-meanX),script.expected.mean);
  assert.equal(sigmaY**2*(1-rho**2),script.expected.variance);
  assert.equal(script.expected.mean,74);
  assert.equal(script.expected.variance,60);
  const runtime = createRequire(new URL('data-src/video-comparison/remotion/package.json',root));
  assert(Math.abs(script.expected.tail-(1-runtime('jstat').normal.cdf((thresholdY-74)/Math.sqrt(60),0,1)))<1e-12);
  const manifest = JSON.parse(readFileSync(new URL('static/audio/manifest.json',root)));
  let offset = 0;
  let expectedCues = [];
  for (const source of script.sources) {
    const original = manifest.lessons[source.id];
    const audio = readFileSync(new URL(`static/${original.src}`,root));
    assert.equal(createHash('sha256').update(audio).digest('hex'),source.originalSha256);
    expectedCues.push(...original.scenes[0].cues.filter(cue=>cue.end<=source.selectedDuration+0.001)
      .map(cue=>({...cue,start:cue.start+offset,end:cue.end+offset,sectionId:source.id})));
    offset += source.selectedDuration;
  }
  assert.deepEqual(script.cues,expectedCues);
  assert.equal(offset,script.duration);
  assert.equal(createHash('sha256').update(readFileSync(new URL('static/comparativa-videos/bivariante/shared/audio.m4a',root))).digest('hex'),script.audioSha256);
});

test('five-second agent delivery preserves original timing records and verified clips', () => {
  const results = JSON.parse(readFileSync(new URL('static/comparativa-videos/cinco-segundos/results.json',root)));
  assert.deepEqual(results.map(result=>result.id),['manim','remotion']);
  for (const result of results) {
    const original = readFileSync(new URL(`data-src/video-comparison/${result.id}/five-seconds/timing.json`,root),'utf8');
    assert.equal(readFileSync(new URL(`static/comparativa-videos/cinco-segundos/${result.id}/timing.json`,root),'utf8'),original);
    const timing = JSON.parse(original);
    assert.equal(result.totalMs,timing.finishedAtMs-timing.startedAtMs);
    assert.equal(result.totalMs,result.renderMs+result.preparationAndChecksMs);
    assert.equal(result.validation.frames,150);
    assert.equal(result.validation.duration,5);
    assert.equal(result.validation.audio,false);
    const movie = readFileSync(new URL(`static/comparativa-videos/cinco-segundos/${result.id}/video.mp4`,root));
    assert.equal(createHash('sha256').update(movie).digest('hex'),result.sha256);
  }
  const page = readFileSync(new URL('src/pages/comparativa-videos/cinco-segundos.jsx',root),'utf8');
  assert.doesNotMatch(page,/<iframe|player\.html/);
  assert.match(page,/preparationAndChecksMs/);
  assert.match(page,/interrupci/);
  assert.doesNotThrow(()=>require('@babel/core').transformSync(page,{
    filename:'cinco-segundos.jsx',babelrc:false,configFile:false,presets:[require.resolve('@docusaurus/core/lib/babel/preset')]
  }));
});