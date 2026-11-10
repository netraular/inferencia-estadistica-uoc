import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire, Module} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {foundationTopics, planFoundations} from './native-foundations.mjs';
import {validateNativePlan} from './native-plan.mjs';

const frozen = process.env.COURSE_VIDEO_CATALOGUE;
const catalogue = frozen ? JSON.parse(fs.readFileSync(frozen)) : null;
const owned = catalogue?.items.filter(item => ['section','recap'].includes(item.kind) && foundationTopics.includes(item.parentLesson || item.id)) || [];
const fullCatalogue = {skip:frozen ? false : 'Set COURSE_VIDEO_CATALOGUE to check the frozen catalogue'};

function seedFixture() {
  return {
    id:'proporciones--parte-y-total', parentLesson:'proporciones', kind:'section', canonicalSha256:'seed-fixture',
    animation:{steps:[{title:'Comparar semillas', cues:[
      'Hola.',
      'Comparemos dos bandejas: en una germinan dieciocho semillas y en otra treinta.',
      'Parece que gana la segunda, pero faltan los totales.',
      'Sin ese dato la comparacion queda abierta.',
      'En la primera sembramos setenta y dos.',
      'Dentro de ese total buscamos las dieciocho germinadas.',
      'No anadimos dieciocho a setenta y dos: ya estan incluidas.',
      'Llamemos pe a la proporcion observada.',
      'Asi podemos comparar bandejas de distinto tamano.',
      'Setenta y dos contiene cuatro grupos de dieciocho.',
      'Germino una de cada cuatro.',
      'La segunda tenia doscientas semillas.',
      'Sus treinta germinadas representan quince centesimas del total.',
      'Treinta supera dieciocho, pero quince centesimas es menos que un cuarto.',
      'La pregunta es: de que total sale esta parte?',
      'Hemos descrito observaciones.',
    ], visual:{lines:[
      {label:'Primera bandeja',bar:{part:18,total:72},cue:4},
      {tex:'p=\\frac{18}{72}',cue:7},
      {label:'Parte del total',bar:{part:1,total:4},cue:9},
      {label:'Segunda bandeja',bar:{part:30,total:200},cue:11},
    ]}}]},
  };
}

test('all frozen foundations sections and recaps preserve every cue and reveal', fullCatalogue, () => {
  const counts = {items:0, scenes:0, cues:0};
  for (const item of catalogue.items) {
    const plan = planFoundations(item);
    assert.equal(Boolean(plan), owned.includes(item), item.id);
    if (!plan) continue;
    validateNativePlan(item, plan);
    counts.items++;
    counts.scenes += plan.scenes.length;
    for (const scene of plan.scenes) {
      counts.cues += scene.cues.length;
      for (const [cueIndex,cue] of scene.cues.entries()) {
        assert.equal(cue.sourceCue,cueIndex);
        assert.equal(cue.anchor,cue.text);
        assert.deepEqual(cue.visible,scene.sourceLines.flatMap((line,index)=>(line.cue ?? 0)<=cueIndex ? [index] : []));
        assert.deepEqual(cue.reveal,scene.sourceLines.flatMap((line,index)=>(line.cue ?? 0)===cueIndex ? [index] : []));
      }
    }
  }
  assert.deepEqual(counts,{items:45,scenes:396,cues:1638});
});

test('unknown sections and malformed denominators fail rather than falling back', () => {
  const item=seedFixture();
  item.id='proporciones--unknown';
  assert.throws(()=>planFoundations(item),/Unmapped/);
  item.id='proporciones--parte-y-total';
  item.animation.steps[0].visual.lines[0].bar.total=0;
  assert.throws(()=>planFoundations(item),/denominator/);
  assert.equal(planFoundations({...item,kind:'exercise'}),null);
});

test('seed events are anchored uniquely and populations come from structured bars', () => {
  const item=seedFixture();
  const original=structuredClone(item);
  const scene=planFoundations(item).scenes[0];
  assert.deepEqual(scene.data.seed.events,{
    parts:1,question:2,unknown:3,firstTotal:4,highlight:5,containment:6,firstFraction:7,quarter:9,
    oneGroup:10,secondTotal:11,secondFraction:12,compare:13,reference:14,observation:15,
  });
  assert.deepEqual(item,original);
  Object.assign(item.animation.steps[0].visual.lines[0].bar,{part:12,total:48});
  Object.assign(item.animation.steps[0].visual.lines[3].bar,{part:21,total:140});
  const derived=planFoundations(item).scenes[0].data.seed;
  assert.deepEqual(derived.trays.map(({part,total})=>({part,total})),[{part:12,total:48},{part:21,total:140}]);
  assert.equal(derived.groups,4);
  item.animation.steps[0].cues[4]='An unrelated sentence.';
  assert.throws(()=>planFoundations(item),/anchor: firstTotal/);
  item.animation.steps[0].cues[4]=original.animation.steps[0].cues[4];
  item.animation.steps[0].cues[8]=item.animation.steps[0].cues[4];
  assert.throws(()=>planFoundations(item),/ambiguous seed narration anchor/);
});

function withRenderer(check) {
  const require=createRequire(new URL('../../package.json',import.meta.url));
  const babel=require('@babel/core');
  const originalJsx=Module._extensions['.jsx'];
  const originalCss=Module._extensions['.css'];
  Module._extensions['.css']=()=>{};
  Module._extensions['.jsx']=(module,file)=>{
    assert.ok(/native-(?:foundations|primitives)\.jsx$/.test(file));
    const result=babel.transformFileSync(file,{
      babelrc:false,configFile:false,
      presets:[[require.resolve('@babel/preset-react'),{runtime:'automatic'}]],
      plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')],
    });
    module._compile(result.code,file);
  };
  try {
    const React=require('react');
    const {renderToStaticMarkup}=require('react-dom/server');
    const {parseHTML}=require('linkedom');
    const {FoundationsScene}=require(fileURLToPath(new URL('./native-foundations.jsx',import.meta.url)));
    const render=(scene,cueIndex,progress=.8)=>renderToStaticMarkup(React.createElement(FoundationsScene,{
      plan:scene,state:{cueIndex,progress,seconds:0,cueElapsed:progress,cueDuration:1,sceneElapsed:cueIndex+progress},
    }));
    check({render,document:(scene,cueIndex,progress)=>parseHTML(render(scene,cueIndex,progress)).document});
  } finally {
    if (originalJsx) Module._extensions['.jsx']=originalJsx;
    else delete Module._extensions['.jsx'];
    if (originalCss) Module._extensions['.css']=originalCss;
    else delete Module._extensions['.css'];
  }
}

test('Babel compiles the helper and every fixture cue without an external catalogue', () => withRenderer(({render}) => {
  const scene=planFoundations(seedFixture()).scenes[0];
  for (const [cueIndex] of scene.cues.entries()) {
    const html=render(scene,cueIndex);
    assert.ok(!/NaN|Infinity|undefined/.test(html));
    assert.ok(html.includes('data-native-mark'));
    assert.ok(html.includes('<svg'));
  }
}));

test('seed trays reveal only narrated populations, conserve members, and hold between transfers', () => withRenderer(({document}) => {
  const scene=planFoundations(seedFixture()).scenes[0];
  const selector=name=>`[data-native-mark="${name}"]`;
  const seeds=(dom,name)=>dom.querySelectorAll(selector(name)).length;
  const tray=(dom,index)=>dom.querySelector(selector(`seed-tray-${index}`));
  const maths=dom=>Array.from(dom.querySelectorAll('[data-native-math]'),node=>node.getAttribute('data-native-math'));
  const opening=document(scene,0,0);
  for (const index of [1,2]) assert.equal(tray(opening,index).querySelector('rect').getAttribute('opacity'),null);
  assert.equal(opening.querySelector('[data-native-total]'),null);
  assert.equal(opening.querySelector('[data-native-math]'),null);
  for (let cueIndex=0;cueIndex<scene.cues.length;cueIndex++) {
    const dom=document(scene,cueIndex);
    assert.equal(seeds(dom,'germinated-seed'),cueIndex < 1 ? 0 : 48);
    assert.equal(seeds(dom,'dormant-seed'),cueIndex < 4 ? 0 : cueIndex < 11 ? 54 : 224);
    assert.equal(tray(dom,1).getAttribute('data-native-total'),cueIndex < 4 ? null : '72');
    assert.equal(tray(dom,2).getAttribute('data-native-total'),cueIndex < 11 ? null : '200');
    assert.equal(seeds(dom,'equal-seed-group'),cueIndex < 9 ? 0 : 4);
    assert.equal(seeds(dom,'normalised-seed-comparison'),cueIndex < 13 ? 0 : 1);
    assert.equal(maths(dom).length,cueIndex < 7 ? 0 : cueIndex < 12 ? 1 : cueIndex < 13 ? 2 : 3);
    if (cueIndex < 9) assert.ok(maths(dom).every(tex=>!tex.includes('0{,}25')));
    if (cueIndex < 12) assert.ok(maths(dom).every(tex=>!tex.includes('200') && !tex.includes('0{,}15')));
    if (cueIndex < 4) assert.ok(!Array.from(dom.querySelectorAll('text'),node=>node.textContent).join(' ').includes('72'));
    if (cueIndex < 11) assert.ok(!Array.from(dom.querySelectorAll('text'),node=>node.textContent).join(' ').includes('200'));
  }
  const grouped=document(scene,9,1);
  for (const group of grouped.querySelectorAll(selector('equal-seed-group'))) assert.equal(group.getAttribute('data-native-group-size'),'18');
  const positions=(cueIndex,progress)=>Array.from(document(scene,cueIndex,progress).querySelectorAll(`${selector('germinated-seed')},${selector('dormant-seed')}`),node=>node.getAttribute('transform'));
  for (const [previous,next] of [[1,2],[4,5],[5,6],[9,10],[11,12],[12,13]]) {
    assert.deepEqual(positions(previous,1),positions(next,0),`tray members reset at cue ${next}`);
  }
  for (const cueIndex of [1,4,9,11]) assert.ok(JSON.stringify(positions(cueIndex,.2))!==JSON.stringify(positions(cueIndex,.8)),`missing transfer at cue ${cueIndex}`);
  assert.equal(document(scene,13).querySelectorAll('[data-native-ratio="0.25"]').length,1);
  assert.equal(document(scene,13).querySelectorAll('[data-native-ratio="0.15"]').length,1);
}));

test('frozen recap gates early source lines by narration instead of source reveal indices', fullCatalogue, () => withRenderer(({document}) => {
  const item=owned.find(entry=>entry.id==='proporciones');
  const scene=planFoundations(item).scenes.find(entry=>entry.data.seed);
  assert.ok(scene);
  assert.equal(scene.data.seed.regroup,false);
  assert.deepEqual(scene.data.seed.trays.map(tray=>[tray.totalCue,tray.fractionCue]),[[7,8],[11,12]]);
  for (const cueIndex of [5,6]) {
    const dom=document(scene,cueIndex);
    assert.equal(dom.querySelector('[data-native-total]'),null);
    assert.ok(!Array.from(dom.querySelectorAll('[data-native-math]'),node=>node.getAttribute('data-native-math')).join(' ').includes('72'));
  }
  for (const cueIndex of [8,9]) assert.ok(!document(scene,cueIndex).querySelector('[data-native-math]').getAttribute('data-native-math').includes('25\\%'));
  assert.ok(document(scene,10).querySelector('[data-native-math]').getAttribute('data-native-math').includes('25\\%'));
  assert.equal(document(scene,11).querySelectorAll('[data-native-math]').length,1);
  assert.equal(document(scene,12).querySelectorAll('[data-native-math]').length,2);
}));

test('seed geometry stays in its stage column and formula slots do not overlap', () => withRenderer(({document}) => {
  const scenes=[planFoundations(seedFixture()).scenes[0],...owned.flatMap(item=>planFoundations(item).scenes.filter(scene=>scene.data.seed))];
  const visit=(node,transform={x:0,y:0,scaleX:1,scaleY:1})=>{
    const matrix={...transform};
    for (const match of (node.getAttribute('transform') || '').matchAll(/(translate|scale)\(([^)]+)\)/g)) {
      const values=match[2].trim().split(/[\s,]+/).map(Number);
      if (match[1]==='translate') {matrix.x+=values[0]*matrix.scaleX;matrix.y+=(values[1] || 0)*matrix.scaleY;}
      else {matrix.scaleX*=values[0];matrix.scaleY*=values[1] ?? values[0];}
    }
    const value=name=>Number(node.getAttribute(name) || 0);
    let points=[];
    if (node.localName==='rect') points=[[value('x'),value('y')],[value('x')+value('width'),value('y')+value('height')]];
    if (node.localName==='ellipse') points=[[value('cx')-value('rx'),value('cy')-value('ry')],[value('cx')+value('rx'),value('cy')+value('ry')]];
    if (node.localName==='path') {
      const coordinates=(node.getAttribute('d').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      points=Array.from({length:coordinates.length/2},(_,index)=>coordinates.slice(index*2,index*2+2));
    }
    if (node.localName==='text') {
      const fontSize=value('font-size');
      let baseline=value('y');
      for (const span of node.children) {
        baseline+=Number(span.getAttribute('dy') || 0);
        points.push([value('x'),baseline-fontSize],[value('x')+span.textContent.length*fontSize*.7,baseline+fontSize*.25]);
      }
    }
    const padding=value('stroke-width')/2;
    for (const [x,y] of points) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(matrix.x+(x-padding)*matrix.scaleX>=0 && matrix.x+(x+padding)*matrix.scaleX<=800,`${node.localName}: tray column overflow`);
      assert.ok(matrix.y+(y-padding)*matrix.scaleY>=0 && matrix.y+(y+padding)*matrix.scaleY<=480,`${node.localName}: stage overflow`);
    }
    for (const child of node.children) visit(child,matrix);
  };
  for (const scene of scenes) for (const [cueIndex] of scene.cues.entries()) for (const progress of [0,.25,.5,.75,1]) {
    const dom=document(scene,cueIndex,progress);
    visit(dom.querySelector('[data-native-mark="authored-seed-comparison"]'));
    let previousBottom=0;
    for (const formula of dom.querySelectorAll('[data-native-math]')) {
      const left=parseFloat(formula.style.left),top=parseFloat(formula.style.top),width=parseFloat(formula.style.width);
      const estimatedHeight=parseFloat(formula.style.fontSize)*3;
      assert.ok(left>=820 && left+width<=1200);
      assert.ok(top>=previousBottom && top+estimatedHeight<=440);
      previousBottom=top+estimatedHeight;
    }
    assert.ok(dom.querySelector('[data-native-mark][data-native-bound]'));
  }
}));

test('every frozen cue produces native SVG without future math; other families retain motion', fullCatalogue, () => withRenderer(({render}) => {
    let checks=0;
    for (const item of owned) {
      for (const [index,scene] of planFoundations(item).scenes.entries()) {
        for (const [cueIndex] of scene.cues.entries()) {
          const samples=[.2,.8].map(progress=>render(scene,cueIndex,progress));
          for (const html of samples) {
            assert.ok(!/NaN|Infinity|undefined/.test(html),`${item.id}/${index}/${cueIndex}`);
            assert.ok(html.includes('data-native-mark'));
            assert.ok(html.includes('<svg'));
            for (const line of scene.sourceLines.filter(line=>line.tex&&(line.cue ?? 0)>cueIndex)) {
              const encoded=line.tex.replaceAll('&','&amp;').replaceAll('"','&quot;');
              assert.ok(!html.includes(`data-native-math="${encoded}"`),`${item.id}: premature formula`);
            }
            checks++;
          }
          if (!scene.data.seed) assert.ok(samples[0]!==samples[1],`${item.id}/${index}/${cueIndex}: static cue`);
        }
      }
    }
    assert.equal(checks,3276);
}));