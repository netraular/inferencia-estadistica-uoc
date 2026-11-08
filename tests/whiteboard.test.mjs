import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createRequire} from 'node:module';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {setImmediate as yieldToEventLoop} from 'node:timers/promises';
import Konva from 'konva';
import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {drawTutorFigure,createTutorFrames} from '../pages/inferencia/exercise-tutor.js';

for (const weight of [400,700]) {
  assert.ok(GlobalFonts.registerFromPath(new URL(`../pages/inferencia/vendor/atkinson-latin-${weight}.woff2`,import.meta.url).pathname,'Atkinson'));
}

test('El tutor dibuja todos los tipos sin lienzos vacios y cambia el grafico al avanzar', () => {
  for (const width of [320,960]) for (const type of EXERCISE_TYPES) {
    const exercise=generateExercise(type.id,2);
    const height=Math.round(width*5/12);
    const canvas=createCanvas(width,height);
    const context=canvas.getContext('2d');
    const question=exercise.questions[0];
    const frames=createTutorFrames(exercise,question);
    drawTutorFigure(context,exercise,question,0,width,height);
    const initial=Buffer.from(context.getImageData(0,0,width,height).data);
    assert.ok(initial.some((value,index)=>index%4!==3&&value<100),type.id);
    drawTutorFigure(context,exercise,question,frames.length-1,width,height);
    const final=Buffer.from(context.getImageData(0,0,width,height).data);
    assert.notDeepEqual(final,initial,type.id);
    for (const frame of frames) if (frame.tex) assert.ok(!frame.tex.includes('NaN'),type.id);
  }
});
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonAnimation} from '../pages/inferencia/animations.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import {enrichLessonAnimation,enrichGlobalAnimation} from '../pages/inferencia/lesson-visuals.js';
import {drawContextDiagram,selectContextDiagram} from '../pages/inferencia/context-diagram.js';
import {EXERCISE_TYPES,generateExercise} from '../pages/inferencia/exercises.js';
import {exerciseCatalogue,exerciseAnimation} from '../pages/inferencia/exercise-solutions.js';
import {WHITEBOARD_LESSONS, planWhiteboardScene, integralGeometry, formulaVector, formulaGraphic, createWhiteboard,whiteboardFrameLines,whiteboardFormula} from '../src/classroom/whiteboard.mjs';

const require=createRequire(import.meta.url);
globalThis.jStat=require('jstat').jStat;
const {document}=parseHTML('<html><body></body></html>');
const paragraphs=html=>{const node=document.createElement('div');node.innerHTML=html;return Array.from(node.querySelectorAll('p'),paragraph=>paragraph.textContent);};
const lectures=COURSE.units[0].lessons.map(lesson=>createLessonAnimation(lesson,generateExercise,paragraphs));
const sectionAnimations=COURSE.units[0].lessons.flatMap(lesson=>createLessonSections(lesson).map(section=>section.animation));

test('all 118 sections and 521 recap scenes render every context phase as finite, bounded real Canvas pixels at 320 and 960',async()=>{
  const lessons=COURSE.units.flatMap(unit=>unit.lessons);
  const sections=lessons.flatMap(lesson=>createLessonSections(lesson).map(section=>enrichLessonAnimation(section.animation)));
  const recaps=lessons.map(lesson=>enrichGlobalAnimation(createLessonAnimation(lesson,generateExercise,paragraphs)));
  assert.equal(sections.length,118);
  assert.equal(recaps.reduce((sum,animation)=>sum+animation.steps.length,0),521);
  const kinds=new Set();
  for (const width of [320,960]) {
    const height=Math.max(360,Math.round(width*5/12));
    const canvas=createCanvas(width,height);
    const drawing=canvas.getContext('2d');
    const context=new Proxy(drawing,{
      get(target,key) {
        const value=Reflect.get(target,key,target);
        if (typeof value!=='function') return value;
        return (...args)=>{
          for (const argument of args.flat()) if (typeof argument==='number') assert.ok(Number.isFinite(argument),`${String(key)}: finite coordinates`);
          return value.apply(target,args);
        };
      },
      set(target,key,value) {return Reflect.set(target,key,value,target);}
    });
    const pixels=()=>Buffer.from(drawing.getImageData(0,0,width,height).data);
    const render=(diagram,phase,label)=>{
      const geometry=drawContextDiagram(context,diagram,width,height,{phase});
      kinds.add(geometry.kind);
      assert.ok(geometry.marks>0,label);
      for (const box of geometry.labels) {
        assert.ok([box.x,box.y,box.width,box.height].every(Number.isFinite),label);
        assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=width+0.01 && box.y+box.height<=height+0.01,`${label}: ${JSON.stringify(box)}`);
        drawing.font=box.font;
        for (const row of box.rows) assert.ok(drawing.measureText(row).width<=box.width+0.01,`${label}: text exceeds its box: ${row}`);
      }
      for (const [index,box] of geometry.labels.entries()) for (const other of geometry.labels.slice(index+1)) {
        const overlapX=Math.min(box.x+box.width,other.x+other.width)-Math.max(box.x,other.x);
        const overlapY=Math.min(box.y+box.height,other.y+other.height)-Math.max(box.y,other.y);
        assert.ok(overlapX<=0.01 || overlapY<=0.01,`${label}: overlapping labels ${box.text} / ${other.text}`);
      }
      const ink=drawing.getImageData(16,74,width-32,height-130).data;
      assert.ok(ink.some((value,index)=>index%4!==3 && value<160),`${label}: graph ink below the title`);
      return geometry;
    };
    for (const animation of [...sections,...recaps]) for (const scene of animation.steps) {
      const label=`${width}/${animation.id}/${scene.title}`;
      const before=JSON.stringify(scene.visual);
      const initial=selectContextDiagram(scene.visual,-1);
      assert.equal(initial.diagram,scene.visual.context,label);
      assert.equal(initial.phase,undefined,label);
      render(initial.diagram,initial.phase,label);
      const first=pixels();
      for (const [cueIndex,phase] of scene.visual.phases.entries()) {
        const selected=selectContextDiagram(scene.visual,cueIndex);
        assert.equal(selected.diagram,phase.context,label);
        assert.equal(selected.phase,phase,label);
        assert.equal(render(selected.diagram,selected.phase,`${label}/${cueIndex}`).cue,cueIndex,label);
      }
      render(initial.diagram,initial.phase,label);
      assert.deepEqual(pixels(),first,`${label}: exact reverse seek before cue zero`);
      assert.equal(JSON.stringify(scene.visual),before,`${label}: no mutation`);
      await yieldToEventLoop();
    }
  }
  assert.deepEqual([...kinds].sort(),['bars','matrix','trials','tree','number-line','scatter','region','normal','joint-normal','curve'].sort());
});

test('shared renderer retains selected cells, signed bars, open endpoints and supplied PDF curve ticks',()=>{
  const width=320;
  const height=360;
  const canvas=createCanvas(width,height);
  const context=canvas.getContext('2d');
  const visual={context:{kind:'bars',label:'Desviaciones',labels:['Izquierda','Derecha'],values:[-2,2],highlight:[]},phases:[
    {cue:0,context:{kind:'bars',label:'Desviaciones',labels:['Izquierda','Derecha'],values:[-2,2],highlight:[1]}},
    {cue:1,context:{kind:'bars',label:'Cuadrados',labels:['Izquierda','Derecha'],values:[4,4],highlight:[0,1]}}
  ]};
  const paint=cue=>{
    const {diagram,phase}=selectContextDiagram(visual,cue);
    drawContextDiagram(context,diagram,width,height,{phase});
    return Buffer.from(context.getImageData(0,0,width,height).data);
  };
  const initial=paint(-1);
  const first=paint(0);
  assert.notDeepEqual(first,initial);
  assert.notDeepEqual(paint(1),first);
  assert.deepEqual(paint(0),first);
  assert.deepEqual(paint(-1),initial);
  drawContextDiagram(context,{kind:'matrix',label:'Celdas',rows:['A','B'],columns:['X','Y'],values:[[0.1,0.2],[0.3,0.4]],highlight:[[1,0]]},width,height);
  const pixel=(positionX,positionY)=>Array.from(context.getImageData(positionX,positionY,1,1).data);
  assert.deepEqual(pixel(120,130),[213,235,226,255],'unselected table cell');
  assert.deepEqual(pixel(120,225),[173,52,89,255],'only the specified cell is selected');
  drawContextDiagram(context,{kind:'number-line',label:'Extremos',min:0,max:1,intervals:[{from:0,to:1,label:'Intervalo',closed:[false,true]}],points:[]},width,height);
  assert.deepEqual(pixel(28,111),[252,254,253,255],'open endpoint stays hollow');
  assert.deepEqual(pixel(292,111),[17,117,104,255],'closed endpoint stays filled');
  const normal=drawContextDiagram(context,{kind:'normal',label:'Cuantil por determinar',mean:0,sd:1,level:0.9},width,height);
  assert.ok(normal.labels.some(box=>box.text.includes('umbral por determinar')));
  assert.ok(!normal.labels.some(box=>box.text.includes('1,282')),'no computed quantile answer');
  const graph={kind:'curve',label:'F(x)',domain:[-1,4],range:[0,1],ticks:[-1,0,1,2,3,4],points:[[-1,0],[0,0],[1,0.75],[2,1],[4,1]]};
  const geometry=drawContextDiagram(context,graph,width,height);
  for (const tick of graph.ticks) assert.ok(geometry.labels.some(box=>box.text===String(tick)),`PDF tick ${tick}`);
  assert.ok(!geometry.labels.some(box=>box.text.includes('undefined')));
  assert.throws(()=>drawContextDiagram(context,graph,NaN,height),RangeError);
});

test('Konva uses the same context pixels and phase when seeking backward, resizing or reducing motion',()=>{
  const createElement=Konva.Util.createCanvasElement;
  const stageCount=Konva.stages.length;
  Konva.Util.createCanvasElement=()=>{const canvas=createCanvas(1,1);canvas.style={};return canvas;};
  try {
    for (const lecture of [...lectures,...sectionAnimations].map(animation=>enrichLessonAnimation(animation))) {
      let width=320;
      let height=360;
      const host={ownerDocument:{defaultView:{}},getBoundingClientRect:()=>({width,height})};
      const board=createWhiteboard(host,{animation:lecture});
      try {
        const stage=Konva.stages.at(-1);
        for (const dimensions of [[320,360],[960,400],[720,400],[320,360]]) {
          [width,height]=dimensions;
          board.resize(width);
          const frame={index:0,step:lecture.steps[0],time:0,progress:0,cueIndex:-1,reducedMotion:false};
          board.render(frame);
          const pixels=()=>Buffer.from(stage.getLayers()[0].getCanvas().getContext().getImageData(0,0,width,height).data);
          const first=pixels();
          const expected=createCanvas(width,height);
          const logicalHeight=Math.max(300,height*960/width);
          const scale=Math.min(width/960,height/logicalHeight);
          const origin={x:(width-960*scale)/2,y:0};
          const expectedContext=expected.getContext('2d');
          const actualContext=stage.getLayers()[0].getCanvas().getContext();
          const checkDiagram=(diagram,phase)=>{
            const label=stage.getLayers()[0].getChildren()[0].find('Text')[0];
            const top=label.y()+label.height()+12;
            const diagramHeight=logicalHeight-top-24;
            const region={x:Math.ceil(origin.x)+1,y:Math.ceil(origin.y+top*scale)+1,width:Math.floor(520*scale)-2,height:Math.floor(diagramHeight*scale)-2};
            expectedContext.setTransform(scale,0,0,scale,origin.x,origin.y);
            expectedContext.translate(0,top);
            drawContextDiagram(expectedContext,diagram,520,diagramHeight,{phase,compact:true});
            const diagramPixels=drawing=>Buffer.from(drawing.getImageData(region.x,region.y,region.width,region.height).data);
            const actual=diagramPixels(actualContext);
            const reference=diagramPixels(expectedContext);
            assert.equal(actual.equals(reference),true,`${lecture.id}/${width}/${height}: common renderer within unified board`);
          };
          checkDiagram(frame.step.visual.context);
          for (const cueIndex of [0,frame.step.cues.length-1,0,-1]) {
            board.render({...frame,cueIndex,progress:1,reducedMotion:true});
            const {diagram,phase}=selectContextDiagram(frame.step.visual,cueIndex);
            checkDiagram(diagram,phase);
          }
          assert.equal(pixels().equals(first),true,`${lecture.id}: reversible`);
        }
      } finally {board.dispose();}
    }
    assert.equal(Konva.stages.length,stageCount);
  } finally {Konva.Util.createCanvasElement=createElement;}
});

test('section IDs retain their audio identity and use the parent topic whiteboard',()=>{
  for(const animation of sectionAnimations){
    assert.ok(animation.id.includes('--'));
    const plan=planWhiteboardScene(animation.id,animation.steps[0]);
    assert.equal(plan.kind,'story',animation.id);
    assert.deepEqual(plan.lines,animation.steps[0].visual.lines);
  }
});

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
  assert.equal(planWhiteboardScene('sucesos',lectures[0].steps[0]).kind,'story');
});

test('a single whiteboard pages accumulated operations by cue without losing simultaneously introduced lines',()=>{
  const lines=Array.from({length:12},(_,cue)=>({cue,tex:`x=${cue}`}));
  const plan={context:{kind:'bars'},lines};
  assert.deepEqual(whiteboardFrameLines(plan,-1),[]);
  assert.deepEqual(whiteboardFrameLines(plan,11),lines.slice(-3));
  assert.deepEqual(whiteboardFrameLines(plan,0),lines.slice(0,1));
  const simultaneous=Array.from({length:4},()=>({cue:12,value:'Datos nuevos'}));
  assert.deepEqual(whiteboardFrameLines({...plan,lines:[...lines,...simultaneous]},12),simultaneous);
  for(const line of lines)assert.ok(whiteboardFrameLines(plan,line.cue).includes(line));
  const tex='p=1/2=0.5';
  assert.equal(whiteboardFormula(tex),'\\begin{gathered}p=1/2\\\\=0.5\\end{gathered}');
  assert.ok(formulaVector(whiteboardFormula(tex)).viewBox.every(Number.isFinite));
});

test('scenes without explicit graphics never invent examples from lesson names or narration',()=>{
  for(const id of WHITEBOARD_LESSONS){
    const plan=planWhiteboardScene(id,{title:'Una explicación',caption:'Semillas, logaritmos, soporte, derivadas y matrices.',kind:'lesson',data:{chapter:'Teoría'}});
    assert.equal(plan.kind,'working');
    assert.deepEqual(plan.givens,[]);
    assert.deepEqual(plan.equations,[]);
  }
  const plan=planWhiteboardScene('proporciones',{title:'Nuestro cultivo',kind:'lesson',visual:{lines:[{label:'Sembradas',value:'80'},{label:'Cálculo',tex:'16/80=0.2'}]}});
  assert.deepEqual(plan.givens,['80']);
  assert.deepEqual(plan.equations,['16/80=0.2']);
});

test('worked examples keep their real inputs and current equations instead of unrelated sample values',()=>{
  for(const lecture of lectures) for(const step of lecture.steps.filter(step=>step.data.chapter==='Ejercicios resueltos')){
    const plan=planWhiteboardScene(lecture.id,step);
    assert.equal(plan.kind,'story');
    assert.deepEqual(plan.lines,step.visual.lines);
    assert.ok(plan.lines.every(item=>Number.isInteger(item.cue)));
  }
});

test('explicit demonstration data retains bars, areas and supported regions',()=>{
  const bars=planWhiteboardScene('algebra',{title:'Pesos',kind:'bars',data:{values:[1,4,5],labels:['A','B','C']}});
  assert.equal(bars.kind,'bars');
  assert.deepEqual(bars.values,[1,4,5]);
  const integral=planWhiteboardScene('calculo',{title:'Área',kind:'curve',data:{family:'uniform',height:2,support:[0,0.5],interval:[0,0.1]}});
  assert.equal(integral.kind,'integral');
  assert.equal(integralGeometry(integral).area,0.2);
  const region=planWhiteboardScene('regiones-matrices',{title:'Recurso',kind:'scatter',data:{region:true,points:[[0,0],[2,0],[0,2]]}});
  assert.equal(region.kind,'region');
  assert.equal(region.bound,2);
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

test('real Konva canvas draws every lesson and exercise scene, fits text at desktop and mobile sizes, seeks reversibly and cleans up',async()=>{
  const createElement=Konva.Util.createCanvasElement;
  const stageCount=Konva.stages.length;
  Konva.Util.createCanvasElement=()=>{const canvas=createCanvas(1,1);canvas.style={};return canvas;};
  try {
    const lessons=COURSE.units.flatMap(unit=>unit.lessons);
    const recaps=lessons.map(lesson=>enrichGlobalAnimation(createLessonAnimation(lesson,generateExercise,paragraphs)));
    const sections=lessons.flatMap(lesson=>createLessonSections(lesson).map(section=>enrichLessonAnimation(section.animation)));
    const solutions=exerciseCatalogue().flatMap(exercise=>exercise.questions.map(question=>exerciseAnimation(exercise,question)));
    for(const lecture of [...recaps,...sections,...solutions]) for(const [width,height,inset] of [[960,540,126],[320,180,76],[844,390,126]]) {
      const host={ownerDocument:{defaultView:{}},parentElement:{style:{getPropertyValue:()=>String(inset)}},getBoundingClientRect:()=>({width,height})};
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
            const logicalWidth=960;
            const logicalHeight=Math.max(300,(height-inset)*960/width);
            assert.ok(rect.x>=-1 && rect.y>=-1 && rect.x+rect.width<=logicalWidth+1 && rect.y+rect.height<=logicalHeight+1,`${lecture.id}: ${step.title}: ${node.text()}: ${JSON.stringify(rect)}`);
          }
          const bounds=scene.getClientRect();
          assert.ok(bounds.x>=-1 && bounds.y>=-1 && bounds.x+bounds.width<=width+1 && bounds.y+bounds.height<=height-inset+1,`${lecture.id}: ${step.title}: scene exceeds area above overlays`);
          await yieldToEventLoop();
        }
        const frame={index:0,step:lecture.steps[0],time:0,progress:1,reducedMotion:false};
        board.render({...frame,cueIndex:-1}); const before=pixels();
        board.render({...frame,cueIndex:frame.step.cues.length-1}); const after=pixels();
        assert.equal(before.equals(after),false,`${lecture.id}: initial and final frames must differ`);
        assert.ok(after.some((value,position)=>position%4===0 && value<180),'actual ink pixels');
        board.render({...frame,cueIndex:-1}); assert.equal(pixels().equals(before),true,`${lecture.id}: reverse seek`);
        board.render({...frame,cueIndex:-1,reducedMotion:true}); assert.equal(pixels().equals(before),true,`${lecture.id}: reduced motion must not reveal future phrases`);
        board.render({...frame,cueIndex:frame.step.cues.length-1,reducedMotion:true}); assert.equal(pixels().equals(after),true,`${lecture.id}: reduced motion final state`);
      } finally {board.dispose();board.dispose();}
    }
    assert.equal(Konva.stages.length,stageCount);
  } finally {Konva.Util.createCanvasElement=createElement;}
});