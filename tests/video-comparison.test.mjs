import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {parseHTML} from 'linkedom';

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
  assert.match(wrapper,/\$\{technology\}\/player\.html/);
});