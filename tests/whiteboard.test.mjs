import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createRequire} from 'node:module';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import Konva from 'konva';
import {createCanvas} from '@napi-rs/canvas';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonAnimation} from '../pages/inferencia/animations.js';
import {generateExercise} from '../pages/inferencia/exercises.js';
import {WHITEBOARD_LESSONS, planWhiteboardScene, integralGeometry, formulaVector, formulaGraphic, createWhiteboard} from '../src/classroom/whiteboard.mjs';

const require=createRequire(import.meta.url);
globalThis.jStat=require('jstat').jStat;
const {document}=parseHTML('<html><body></body></html>');
const paragraphs=html=>{const node=document.createElement('div');node.innerHTML=html;return Array.from(node.querySelectorAll('p'),paragraph=>paragraph.textContent);};
const lectures=COURSE.units[0].lessons.map(lesson=>createLessonAnimation(lesson,generateExercise,paragraphs));

test('storyboards use explicit scene items instead of inferring unrelated examples from words',()=>{
  const step={title:'Miramos las semillas',story:true,visual:{lines:[{cue:1,label:'Sembradas',value:'60'},{cue:2,tex:'12/60'}]}};
  const plan=planWhiteboardScene('proporciones',step);
  assert.equal(plan.kind,'story');
  assert.deepEqual(plan.lines,step.visual.lines);
  assert.equal(plan.groups,undefined);
});

test('all five topic zero lessons have a whiteboard plan for every unchanged narration scene',()=>{
  assert.deepEqual(WHITEBOARD_LESSONS,COURSE.units[0].lessons.map(lesson=>lesson.id));
  let count=0;
  for(const lecture of lectures) for(const step of lecture.steps){
    const before=JSON.stringify(step);
    const plan=planWhiteboardScene(lecture.id,step);
    assert.ok(plan?.kind,`${lecture.id}: ${step.title}`);
    assert.equal(JSON.stringify(step),before);
    count++;
  }
  assert.equal(count,lectures.reduce((total,lecture)=>total+lecture.steps.length,0));
  assert.equal(planWhiteboardScene('sucesos',lectures[0].steps[0]),null);
});

test('worked examples keep their real inputs and current equations instead of unrelated sample values',()=>{
  for(const lecture of lectures) for(const step of lecture.steps.filter(step=>step.data.chapter==='Ejercicios resueltos')){
    const plan=planWhiteboardScene(lecture.id,step);
    assert.equal(plan.kind,'story');
    assert.deepEqual(plan.lines,step.visual.lines);
    assert.ok(plan.lines.every(item=>Number.isInteger(item.cue)));
  }
});

test('the seed comparison preserves counts and demonstrates why more successes need not mean a higher proportion',()=>{
  const lecture=lectures[0];
  const groups=lecture.steps.slice(0,2).flatMap(step=>planWhiteboardScene(lecture.id,step).lines.filter(line=>line.bar).map(line=>[line.bar.part,line.bar.total]));
  assert.deepEqual(groups,[[18,72],[30,200]]);
  assert.ok(18/72>30/200);
  assert.match(lecture.steps[0].visual.lines.at(-1).tex,/25/);
});

test('spoken integral examples preserve their exact shaded intervals and densities',()=>{
  const plots=lectures.find(lecture=>lecture.id==='calculo').steps.slice(0,2).map(step=>step.visual.lines.find(item=>item.plot).plot);
  assert.deepEqual(plots[0].shade,[0.4,1.2]);
  assert.ok(Math.abs((1.2-0.4)*plots[0].points[0][1]-0.4)<1e-12);
  assert.deepEqual(plots[1].shade,[0,1]);
  assert.equal(plots[1].points.find(point=>point[0]===1)[1]/2,0.25);
});

test('every scene equation converts to actual vector paths with finite bounds',()=>{
  const equations=new Set();
  for(const lecture of lectures) for(const step of lecture.steps){
    const plan=planWhiteboardScene(lecture.id,step);
    for(const tex of [plan.equation,...(plan.equations || []),...(plan.lines || []).map(line=>line.tex)].filter(Boolean)) equations.add(tex);
  }
  for(const tex of equations){
    const vector=formulaVector(tex);
    assert.ok(vector.viewBox.every(Number.isFinite),tex);
    assert.ok(vector.viewBox[2]>0 && vector.viewBox[3]>0,tex);
    assert.ok(JSON.stringify(vector.children).includes('"kind":"path"'),tex);
    const graphic=formulaGraphic(tex,{x:32,y:300,width:576,height:70});
    assert.ok(graphic.find('Path').length>0,tex);
    const bounds=graphic.getClientRect();
    assert.ok(Object.values(bounds).every(Number.isFinite),tex);
    assert.ok(bounds.width<=577 && bounds.height<=71,tex);
    graphic.destroy();
  }
});

test('final checks use their own weights and strict integer boundary',()=>{
  for(const lecture of lectures){
    const lesson=COURSE.units[0].lessons.find(item=>item.id===lecture.id);
    const plan=planWhiteboardScene(lecture.id,lecture.steps.at(-1));
    assert.equal(plan.lines[0].value,lesson.check.options[lesson.check.answer]);
    assert.ok(plan.lines[0].cue>0,'la pregunta no revela su respuesta');
  }
});

test('resource diagram preserves the triangle and the cut mentioned in speech',()=>{
  const lecture=lectures.find(lecture=>lecture.id==='regiones-matrices');
  const plot=lecture.steps[0].visual.lines.find(item=>item.plot).plot;
  assert.deepEqual(plot.points,[[0,1],[1,0]]);
  assert.equal(plot.cut,0.3);
  assert.deepEqual(plot.shade,[0,1]);
});

test('production Babel preserves SVG translations and scales from MathJax',()=>{
  const babel=require('@babel/core');
  const source=readFileSync(new URL('../src/classroom/whiteboard.mjs',import.meta.url),'utf8');
  const ast=babel.parseSync(source,{sourceType:'module',babelrc:false,configFile:false});
  const declaration=ast.program.body.find(node=>node.type==='FunctionDeclaration' && node.id.name==='svgTransform');
  assert.ok(declaration);
  ast.program.body=[declaration];
  const compiled=babel.transformFromAstSync(ast,source,{filename:'whiteboard.mjs',babelrc:false,configFile:false,presets:[require.resolve('@docusaurus/core/lib/babel/preset')],plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
  const result=runInNewContext(`${compiled};svgTransform('translate(10 20) scale(2 -2)')`,{Konva,require,exports:{}});
  assert.equal(result.x,10);
  assert.equal(result.y,20);
  assert.equal(result.scaleX,2);
  assert.equal(result.scaleY,-2);
});

test('real webpack configuration loads MathJax version in a browser without require',async()=>{
  const babel=require('@babel/core');
  const source=readFileSync(new URL('../docusaurus.config.js',import.meta.url),'utf8');
  const compiled=babel.transformSync(source,{babelrc:false,configFile:false,plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
  const configuration={};
  runInNewContext(compiled,{require,exports:configuration});
  const plugin=configuration.default.plugins.find(factory=>factory().name==='mathjax-browser-version')();
  const directory=mkdtempSync(join(tmpdir(),'inferencia-mathjax-browser-'));
  const webpack=require('webpack');
  const bundle=async plugins=>{
    const compiler=webpack({mode:'production',target:'web',entry:require.resolve('mathjax-full/js/components/version.js'),output:{path:directory,filename:'version.js',library:{name:'MathJaxVersion',type:'var'}},plugins});
    await new Promise((resolve,reject)=>compiler.run((error,stats)=>compiler.close(closeError=>{
      if(error || closeError || stats?.hasErrors()) reject(error || closeError || new Error(stats.toString({all:false,errors:true})));
      else resolve();
    })));
    return readFileSync(join(directory,'version.js'),'utf8');
  };
  try {
    const broken=await bundle([]);
    assert.throws(()=>runInNewContext(broken,{}),/require is not defined/);
    const fixed=await bundle(plugin.configureWebpack().plugins);
    const browser={};
    runInNewContext(fixed,browser);
    assert.equal(browser.MathJaxVersion.VERSION,require('mathjax-full/package.json').version);
    assert.ok(!fixed.includes('eval("require")'));
  } finally {rmSync(directory,{recursive:true,force:true});}
});

test('real Konva canvas draws every scene, fits text at desktop and mobile sizes, seeks reversibly and cleans up',()=>{
  const createElement=Konva.Util.createCanvasElement;
  const stageCount=Konva.stages.length;
  Konva.Util.createCanvasElement=()=>{const canvas=createCanvas(1,1);canvas.style={};return canvas;};
  try {
    for(const lecture of lectures) for(const [width,height] of [[960,576],[360,360]]) {
      const host={ownerDocument:{defaultView:{}},getBoundingClientRect:()=>({width,height})};
      const board=createWhiteboard(host,{animation:lecture});
      try {
        board.resize(width);
        const stage=Konva.stages.at(-1);
        const context=stage.getLayers()[0].getCanvas().getContext();
        const pixels=()=>Buffer.from(context.getImageData(0,0,width,height).data);
        for(const [index,step] of lecture.steps.entries()) {
          board.render({index,step,progress:1,time:index,cueIndex:step.cues.length-1,reducedMotion:true});
          const scene=stage.getLayers()[0].getChildren()[0];
          for(const node of scene.find('Text')) {
            const rect=node.getClientRect({relativeTo:scene});
            const logicalWidth=width<600 ? 640 : 960;
            const logicalHeight=width<600 ? 640 : 576;
            assert.ok(rect.x>=-1 && rect.y>=-1 && rect.x+rect.width<=logicalWidth+1 && rect.y+rect.height<=logicalHeight+1,`${lecture.id}: ${step.title}: ${node.text()}: ${JSON.stringify(rect)}`);
          }
        }
        const frame={index:0,step:lecture.steps[0],time:0,progress:1,reducedMotion:false};
        board.render({...frame,cueIndex:-1}); const before=pixels();
        board.render({...frame,cueIndex:frame.step.cues.length-1}); const after=pixels();
        assert.notDeepEqual(before,after,lecture.id);
        assert.ok(after.some((value,position)=>position%4===0 && value<180),'actual ink pixels');
        board.render({...frame,cueIndex:-1}); assert.deepEqual(pixels(),before,`${lecture.id}: reverse seek`);
        board.render({...frame,cueIndex:-1,reducedMotion:true}); assert.deepEqual(pixels(),before,`${lecture.id}: reduced motion must not reveal future phrases`);
        board.render({...frame,cueIndex:frame.step.cues.length-1,reducedMotion:true}); assert.deepEqual(pixels(),after,`${lecture.id}: reduced motion final state`);
      } finally {board.dispose();board.dispose();}
    }
    assert.equal(Konva.stages.length,stageCount);
  } finally {Konva.Util.createCanvasElement=createElement;}
});