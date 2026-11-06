import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
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
  assert.ok(count>100);
  assert.equal(planWhiteboardScene('sucesos',lectures[0].steps[0]),null);
});

test('worked examples keep their real inputs and current equations instead of unrelated sample values',()=>{
  for(const lecture of lectures) for(const step of lecture.steps.filter(step=>step.data.chapter==='Ejercicios resueltos')){
    const plan=planWhiteboardScene(lecture.id,step);
    assert.equal(plan.kind,'working');
    assert.deepEqual(plan.equations,step.visual.lines.filter(line=>line.tex).map(line=>line.tex).slice(-2));
    assert.ok(plan.givens.every(value=>step.visual.lines.some(line=>line.value===value)));
  }
});

test('the seed comparison preserves counts and demonstrates why more successes need not mean a higher proportion',()=>{
  const lecture=lectures[0];
  const plan=planWhiteboardScene(lecture.id,lecture.steps.find(step=>step.data.chapter==='Ejemplo de la lección'));
  assert.deepEqual(plan.groups,[[18,72],[30,200]]);
  assert.ok(18/72>30/200);
  assert.match(plan.equation,/25/);
});

test('integral scenes preserve exact areas and left rectangle approximations',()=>{
  for(const step of lectures.find(lecture=>lecture.id==='calculo').steps.filter(step=>step.kind==='curve')){
    const plan=planWhiteboardScene('calculo',step);
    const geometry=integralGeometry(plan);
    assert.equal(geometry.area,0.25);
    if(step.data.rectangles){
      const area=geometry.rectangles.reduce((sum,rectangle)=>sum+rectangle.width*rectangle.height,0);
      assert.equal(area,step.data.approximation);
      assert.equal(geometry.rectangles.length,step.data.rectangles.count);
    }
  }
  const example=lectures.find(lecture=>lecture.id==='calculo').steps.find(step=>step.data.chapter==='Ejemplo de la lección');
  assert.ok(Math.abs(integralGeometry(planWhiteboardScene('calculo',example)).area-0.4)<1e-12);
});

test('every scene equation converts to actual vector paths with finite bounds',()=>{
  const equations=new Set();
  for(const lecture of lectures) for(const step of lecture.steps){
    const plan=planWhiteboardScene(lecture.id,step);
    for(const tex of [plan.equation,...(plan.equations || [])].filter(Boolean)) equations.add(tex);
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
  const algebra=lectures.find(lecture=>lecture.id==='algebra');
  assert.deepEqual(planWhiteboardScene('algebra',algebra.steps.at(-1)).values,[1,2,7]);
  const functions=lectures.find(lecture=>lecture.id==='funciones');
  const plan=planWhiteboardScene('funciones',functions.steps.at(-1));
  assert.equal(plan.kind,'interval');
  assert.equal(plan.threshold,2);
  assert.match(plan.equation,/0,1/);
});

test('joint demonstration preserves descending marginal and conditional density areas',()=>{
  const lecture=lectures.find(lecture=>lecture.id==='regiones-matrices');
  for(const step of lecture.steps.filter(step=>step.kind==='curve')) {
    const plan=planWhiteboardScene(lecture.id,step);
    assert.equal(plan.kind,'integral');
    const geometry=integralGeometry(plan);
    assert.ok(Math.abs(geometry.area-step.data.probability)<1e-12);
    if(step.data.descending){assert.equal(geometry.density(0),1);assert.equal(geometry.density(2),0);}
    else assert.equal(geometry.density(0),step.data.density);
  }
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
          board.render({index,step,progress:1,time:index,reducedMotion:true});
          const scene=stage.getLayers()[0].getChildren()[0];
          for(const node of scene.find('Text')) {
            const rect=node.getClientRect({relativeTo:scene});
            const logicalWidth=width<600 ? 640 : 960;
            const logicalHeight=width<600 ? 640 : 576;
            assert.ok(rect.x>=-1 && rect.y>=-1 && rect.x+rect.width<=logicalWidth+1 && rect.y+rect.height<=logicalHeight+1,`${lecture.id}: ${step.title}: ${node.text()}: ${JSON.stringify(rect)}`);
          }
        }
        const frame={index:0,step:lecture.steps[0],time:0,reducedMotion:false};
        board.render({...frame,progress:0.15}); const before=pixels();
        board.render({...frame,progress:1}); const after=pixels();
        assert.notDeepEqual(before,after,lecture.id);
        assert.ok(after.some((value,position)=>position%4===0 && value<180),'actual ink pixels');
        board.render({...frame,progress:0.15}); assert.deepEqual(pixels(),before,`${lecture.id}: reverse seek`);
        board.render({...frame,progress:0.15,reducedMotion:true}); assert.deepEqual(pixels(),after,`${lecture.id}: reduced motion`);
      } finally {board.dispose();board.dispose();}
    }
    assert.equal(Konva.stages.length,stageCount);
  } finally {Konva.Util.createCanvasElement=createElement;}
});