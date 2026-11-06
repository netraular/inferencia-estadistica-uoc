import Konva from 'konva';
import {gsap} from 'gsap';
import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages.js';

export const WHITEBOARD_LESSONS = ['proporciones', 'algebra', 'funciones', 'calculo', 'regiones-matrices'];
const palette = {ink:'#253330', muted:'#64736e', teal:'#117568', rose:'#ad3459', gold:'#b47c16', line:'#dce7e1', paper:'#fcfefd'};
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const mathDocument = mathjax.document('', {InputJax:new TeX({packages:AllPackages}), OutputJax:new SVG({fontCache:'none'})});
const formulaCache = new Map();
const decimal = value => new Intl.NumberFormat('es', {maximumFractionDigits:3}).format(value);

export function formulaVector(tex) {
  if (formulaCache.has(tex)) return formulaCache.get(tex);
  const result = mathDocument.convert(tex, {display:true});
  const svg = adaptor.tags(result, 'svg')[0];
  if (!svg || adaptor.tags(result, 'merror').length || adaptor.outerHTML(result).includes('data-mjx-error')) throw new Error('Fórmula de pizarra no válida');
  const viewBox = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
  const describe = node => ({
    kind:adaptor.kind(node),
    attributes:Object.fromEntries(adaptor.allAttributes(node).map(attribute=>[attribute.name, attribute.value])),
    children:adaptor.childNodes(node).filter(child=>adaptor.kind(child)!=='#text').map(describe)
  });
  const vector = {viewBox, children:adaptor.childNodes(svg).filter(node=>adaptor.kind(node)==='g').map(describe)};
  if (formulaCache.size >= 64) formulaCache.delete(formulaCache.keys().next().value);
  formulaCache.set(tex, vector);
  return vector;
}

export function planWhiteboardScene(lessonId, step) {
  if (!WHITEBOARD_LESSONS.includes(lessonId)) return null;
  const chapter = step.data?.chapter;
  const common = {label:step.title.replace(/^Demostración · /, ''), equation:step.tex || ''};
  if (step.story) return {...common,kind:'story',lines:step.visual.lines};
  if (chapter === 'Ejercicios resueltos') {
    const lines = step.visual?.lines || [];
    return {...common, kind:'working', equations:lines.filter(line=>line.tex).map(line=>line.tex).slice(-2), givens:lines.filter(line=>line.value && !line.label).map(line=>line.value).slice(0,3)};
  }
  if (step.kind === 'bars') return {...common, kind:'bars', ...step.data};
  if (step.kind === 'curve' && ['linear', 'linear-cdf', 'uniform'].includes(step.data?.family)) return {...common, kind:'integral', ...step.data};
  if (step.kind === 'scatter' && step.data?.region) return {...common, kind:'region', bound:Math.max(...step.data.points.flat()), ...step.data};
  if (step.kind !== 'lesson') return {...common, kind:'working', equations:step.tex ? [step.tex] : [], givens:[step.data?.legend].filter(Boolean)};
  const text = step.caption;
  if (lessonId === 'proporciones') {
    if (chapter === 'Ejemplo de la lección') return {...common, kind:'proportion', groups:[[18,72],[30,200]], equation:String.raw`\frac{18}{72}=25\%\qquad\frac{30}{200}=15\%`};
    if (/miligramos|microgramos|potencias de diez/.test(text) || /mg|mu g/.test(step.tex || '')) return {...common, kind:'units', equation:String.raw`1\,\mathrm{mg}=1000\,\mathrm{\mu g}`};
    if (/Una tasa|colonias por mililitro/.test(text)) return {...common, kind:'rate', equation:String.raw`\frac{2\text{ colonias}}{1\,\mathrm{mL}}=2\,\mathrm{colonias/mL}`};
    if (chapter === 'Repaso') return {...common, kind:'proportion', groups:[[4,100]], equation:String.raw`\frac{4}{100}=0{,}04=4\%`};
    return {...common, kind:'proportion', groups:[[12,60]], equation:step.tex || String.raw`\frac{12}{60}=0{,}20=20\%`};
  }
  if (lessonId === 'algebra') {
    if (step.title === 'Comprueba que puedes explicarlo') return {...common, kind:'normalize', values:[1,2,7], equation:String.raw`c(1+2+7)=1\quad\Longrightarrow\quad c=\frac1{10}`};
    if (/logaritmo|exponencial|e\^/.test(`${text} ${step.tex || ''}`) && chapter !== 'Ejemplo de la lección') return {...common, kind:'exponential', scale:6, equation:step.tex || String.raw`e^{-t/6}=\frac12\quad\Longrightarrow\quad t=6\log2`};
    return {...common, kind:'normalize', values:[2,3,5], equation:step.tex || String.raw`c(2+3+5)=1\quad\Longrightarrow\quad c=\frac1{10}`};
  }
  if (lessonId === 'funciones') {
    if (step.title === 'Comprueba que puedes explicarlo') return {...common, kind:'interval', threshold:2, equation:String.raw`X<2\quad\Longrightarrow\quad X\in\{0,1\}`};
    if (/tramos|dominio|soporte/.test(text) && chapter === 'Teoría') return {...common, kind:'support', equation:String.raw`f(x)=\begin{cases}\frac12&0\leq x\leq2\\0&\text{fuera}\end{cases}`};
    return {...common, kind:'discrete', values:[0,2,5], masses:[0.1,0.6,0.3], threshold:3, mean:/media/.test(text), equation:step.tex || (/media/.test(text) ? String.raw`E(X)=0\cdot0{,}1+2\cdot0{,}6+5\cdot0{,}3=2{,}7` : String.raw`P(X<3)=0{,}1+0{,}6=0{,}7`)};
  }
  if (lessonId === 'calculo') {
    if (chapter === 'Ejemplo de la lección') return {...common, kind:'integral', family:'uniform', interval:[0.4,1.2], equation:String.raw`P(0{,}4<T<1{,}2)=0{,}5\cdot0{,}8=0{,}4`};
    if (chapter === 'Repaso') return {...common, kind:'integral', family:'uniform', height:2, support:[0,0.5], interval:[0,0.1], equation:String.raw`2\cdot0{,}1=0{,}2`};
    return {...common, kind:'integral', family:/pendiente|derivada/.test(text) ? 'linear-cdf' : 'linear', interval:[0,1], rectangles:/franjas/.test(text) ? {lower:0,upper:1,count:8} : undefined, equation:step.tex || String.raw`\int_0^1\frac{t}{2}\,dt=\frac14`};
  }
  if (/vector|matriz|covarianza|filas|columnas/.test(text) && chapter !== 'Ejemplo de la lección') return {...common, kind:'matrix', equation:step.tex || String.raw`\Sigma=\begin{pmatrix}\sigma_1^2&c\\c&\sigma_2^2\end{pmatrix}`};
  return {...common, kind:'region', bound:1, slice:chapter === 'Repaso' ? 0.4 : 0.3, equation:step.tex || String.raw`0\leq y\leq1-x`};
}

export function integralGeometry(plan) {
  const upper = plan.support?.[1] || 2;
  const density = position => plan.family === 'uniform' ? (plan.height ?? plan.density ?? 0.5) : (plan.descending ? upper-position : position) / 2;
  const interval = plan.interval || [plan.rectangles?.lower ?? 0, plan.rectangles?.upper ?? 1];
  const ascendingArea=(interval[1]**2-interval[0]**2)/4;
  const area = plan.family === 'uniform' ? density(0) * (interval[1]-interval[0]) : plan.descending ? upper*(interval[1]-interval[0])/2-ascendingArea : ascendingArea;
  const rectangles = plan.rectangles ? Array.from({length:plan.rectangles.count}, (_,index)=>{
    const width = (plan.rectangles.upper-plan.rectangles.lower)/plan.rectangles.count;
    const left = plan.rectangles.lower+index*width;
    return {left,width,height:density(left)};
  }) : [];
  return {upper,interval,area,rectangles,density};
}

function svgTransform(value = '') {
  const transform = new Konva.Transform();
  for (const match of value.matchAll(/(translate|scale|matrix|rotate)\(([^)]+)\)/g)) {
    const values = match[2].trim().split(/[\s,]+/).map(Number);
    if (match[1] === 'translate') transform.translate(values[0],values[1] || 0);
    if (match[1] === 'scale') transform.scale(values[0],values[1] ?? values[0]);
    if (match[1] === 'matrix') transform.multiply(new Konva.Transform(values));
    if (match[1] === 'rotate') transform.rotate(values[0]*Math.PI/180);
  }
  return transform.decompose();
}

export function formulaGraphic(tex, {x,y,width,height,color = palette.ink}) {
  const vector = formulaVector(tex);
  const [left,top,originalWidth,originalHeight] = vector.viewBox;
  const scale = Math.min(width/originalWidth,height/originalHeight);
  const outer = new Konva.Group({x:x+(width-originalWidth*scale)/2-left*scale,y:y+(height-originalHeight*scale)/2-top*scale,scaleX:scale,scaleY:scale,listening:false});
  const append = (parent, description, fill) => {
    const attributes = description.attributes;
    const tone = attributes.fill && attributes.fill !== 'currentColor' ? attributes.fill : fill;
    const group = new Konva.Group({...svgTransform(attributes.transform),listening:false});
    parent.add(group);
    if (description.kind === 'path') group.add(new Konva.Path({data:attributes.d,fill:tone,listening:false}));
    if (description.kind === 'rect') group.add(new Konva.Rect({x:Number(attributes.x || 0),y:Number(attributes.y || 0),width:Number(attributes.width),height:Number(attributes.height),fill:tone,listening:false}));
    for (const child of description.children) append(group,child,tone);
  };
  for (const child of vector.children) append(outer,child,color);
  return outer;
}

export function createWhiteboard(host, {animation}) {
  if (!WHITEBOARD_LESSONS.includes(animation.id)) return null;
  const owner = host.ownerDocument;
  const view = owner.defaultView;
  const stage = new Konva.Stage({container:host,width:960,height:576});
  const layer = new Konva.Layer({listening:false});
  stage.add(layer);
  let sceneRoot;
  let timeline;
  let actors = [];
  let lastFrame;
  let lastIndex = -1;
  let portrait = false;
  let disposed = false;
  let width = 960;
  let height = 576;
  const logical = () => portrait ? {width:640,height:640} : {width:960,height:576};
  const text = (value,x,y,options={}) => {
    const node = new Konva.Text({text:value,x,y,fontFamily:'Atkinson, Trebuchet MS, sans-serif',fontSize:28,fill:palette.ink,width:logical().width-x-24,wrap:'word',lineHeight:1.2,listening:false,...options});
    sceneRoot.add(node);
    return node;
  };
  const line = (points,options={}) => {
    const node = new Konva.Line({points,stroke:palette.line,strokeWidth:3,lineCap:'round',lineJoin:'round',listening:false,...options});
    sceneRoot.add(node);
    return node;
  };
  const reveal = (node,start=0,end=0.25) => {
    const actor = {amount:0};
    actors.push(()=>node.opacity(actor.amount));
    timeline.to(actor,{amount:1,duration:end-start,ease:'power1.out'},start);
    return node;
  };
  const formula = (tex,y=logical().height-94,start=0.58,options={}) => {
    if (!tex) return;
    const expression=tex.includes('\\qquad') ? `\\begin{gathered}${tex.replace(/\\qquad/g,'\\\\')}\\end{gathered}` : tex;
    try {const node=formulaGraphic(expression,{x:32,y,width:logical().width-64,height:70,...options});sceneRoot.add(node);reveal(node,start,start+0.2);}
    catch {reveal(text(tex,32,y,{fontSize:25}),start,start+0.2);}
  };
  const axes = (maxX,maxY,yLabel='f(t)',xLabel='t') => {
    const bottom = logical().height-144;
    const right = logical().width-70;
    const top = 120;
    const mapX = value=>90+value/maxX*(right-90);
    const mapY = value=>bottom-value/maxY*(bottom-top);
    reveal(line([90,top-12,90,bottom,right+18,bottom],{stroke:palette.ink}),0,0.12);
    const axisLabel=text(yLabel,32,75,{fontSize:27});
    text(xLabel,right,bottom+20,{width:65,fontSize:26});
    text('0',59,bottom+12,{width:28,fontSize:24});
    return {mapX,mapY,bottom,right,top,axisLabel};
  };

  function build(plan) {
    timeline?.kill();
    layer.destroyChildren();
    actors = [];
    sceneRoot = new Konva.Group({listening:false});
    layer.add(sceneRoot);
    timeline = gsap.timeline({paused:true});
    const size = logical();
    sceneRoot.add(new Konva.Rect({width:size.width,height:size.height,fill:palette.paper,listening:false}));
    for (let gridY=72;gridY<size.height;gridY+=40) line([24,gridY,size.width-24,gridY],{stroke:'#eef3f0',strokeWidth:1});
    const label = text(plan.label,32,22,{fontSize:26,fontStyle:'bold',width:size.width-64});
    if (label.height()>64) label.fontSize(22);
    const state = {reveal:0,focus:0,resolve:0};
    timeline.to(state,{reveal:1,duration:0.3,ease:'power1.inOut'},0.05).to(state,{focus:1,duration:0.28,ease:'power2.inOut'},0.28).to(state,{resolve:1,duration:0.22,ease:'power2.inOut'},0.65);
    if (plan.kind === 'story') {
      const weights=plan.lines.reduce((total,item)=>total+(item.plot ? 2 : 1),0);
      const slot = Math.min(128,(size.height-100)/Math.max(1,weights));
      let nextTop=94;
      plan.lines.forEach((item,position)=>{
        const group = new Konva.Group({listening:false});
        sceneRoot.add(group);
        const top = nextTop;
        const itemHeight=slot*(item.plot ? 2 : 1);
        nextTop+=itemHeight;
        if (item.label) group.add(new Konva.Text({text:item.label,x:40,y:top,width:size.width-80,fontFamily:'Atkinson, Trebuchet MS, sans-serif',fontSize:21,fill:palette.muted,lineHeight:1.2,listening:false}));
        if (item.tex) group.add(formulaGraphic(item.tex,{x:40,y:top+22,width:size.width-80,height:Math.min(62,slot-26),color:palette.teal}));
        else {
          const value = new Konva.Text({text:item.value || '',x:40,y:top+26,width:size.width-80,fontFamily:'Atkinson, Trebuchet MS, sans-serif',fontSize:28,fill:palette.ink,lineHeight:1.2,listening:false});
          while(value.height()>slot-30 && value.fontSize()>16)value.fontSize(value.fontSize()-1);
          group.add(value);
        }
        if (item.bar) {
          const barWidth=size.width-80;
          group.add(new Konva.Rect({x:40,y:top+slot-14,width:barWidth,height:8,fill:palette.line,listening:false}));
          group.add(new Konva.Rect({x:40,y:top+slot-14,width:barWidth*item.bar.part/item.bar.total,height:8,fill:palette.teal,listening:false}));
        }
        if(item.plot){
          const plot=item.plot;
          const minX=plot.points[0][0];
          const maxX=plot.points.at(-1)[0];
          const maxY=Math.max(...plot.points.map(point=>point[1]))*1.15;
          const bottom=top+itemHeight-25;
          const mapX=value=>65+(value-minX)/(maxX-minX)*(size.width-110);
          const mapY=value=>bottom-value/maxY*(itemHeight-108);
          group.add(new Konva.Line({points:[65,top+80,65,bottom,size.width-45,bottom],stroke:palette.muted,strokeWidth:2,listening:false}));
          if(plot.shade){
            const [from,to]=plot.shade;
            const interpolate=value=>{
              const upper=plot.points.findIndex(point=>point[0]>=value);
              if(upper<=0)return plot.points[0][1];
              const [left,right]=[plot.points[upper-1],plot.points[upper]];
              return left[1]+(right[1]-left[1])*(value-left[0])/(right[0]-left[0]);
            };
            const selected=[[from,interpolate(from)],...plot.points.filter(point=>point[0]>from && point[0]<to),[to,interpolate(to)]];
            group.add(new Konva.Line({points:[mapX(from),mapY(0),...selected.flatMap(point=>[mapX(point[0]),mapY(point[1])]),mapX(to),mapY(0)],closed:true,fill:'#d5ebe2',listening:false}));
          }
          group.add(new Konva.Line({points:plot.points.flatMap(point=>[mapX(point[0]),mapY(point[1])]),stroke:palette.teal,strokeWidth:3,listening:false}));
          if(Number.isFinite(plot.cut))group.add(new Konva.Line({points:[mapX(plot.cut),bottom,mapX(plot.cut),mapY(plot.points[0][1]-plot.cut)],stroke:palette.rose,strokeWidth:3,listening:false}));
          group.add(new Konva.Text({text:plot.yLabel,x:65,y:top+59,width:size.width-110,fontSize:17,fill:palette.muted,listening:false}));
          group.add(new Konva.Text({text:plot.xLabel,x:65,y:bottom+6,width:size.width-110,align:'center',fontSize:17,fill:palette.muted,listening:false}));
        }
        actors.push(()=>group.visible((lastFrame?.cueIndex ?? -1)>=item.cue));
      });
    } else if (plan.kind === 'proportion') {
      const gap = 24;
      const panelWidth = (size.width-64-gap*(plan.groups.length-1))/plan.groups.length;
      for (const [groupIndex,[selected,total]] of plan.groups.entries()) {
        const startX = 32+groupIndex*(panelWidth+gap);
        const columns = plan.groups.length===1 ? (portrait ? 10 : 15) : (portrait ? 8 : 15);
        const rows = Math.ceil(total/columns);
        const cell = Math.min((panelWidth-20)/columns,(size.height-250)/rows,34);
        const offsetX = startX+(panelWidth-columns*cell)/2;
        for (let pointIndex=0;pointIndex<total;pointIndex++) {
          const point = new Konva.Circle({x:offsetX+(pointIndex%columns+0.5)*cell,y:125+(Math.floor(pointIndex/columns)+0.5)*cell,radius:cell*0.3,fill:pointIndex<selected ? palette.teal : '#d8e4de',listening:false});
          sceneRoot.add(point);
          actors.push(()=>{point.opacity(0.25+0.75*Math.min(1,Math.max(0,state.reveal*total-pointIndex))); point.scaleX(0.65+state.focus*0.35); point.scaleY(point.scaleX());});
        }
        const count = text('',startX,size.height-192,{width:panelWidth,align:'center',fontSize:36,fontStyle:'bold',fill:palette.teal});
        actors.push(()=>count.text(`${Math.round(selected*state.focus)} / ${total}`));
      }
      formula(plan.equation);
    } else if (['bars','normalize'].includes(plan.kind)) {
      const values = plan.values;
      const sum = values.reduce((total,value)=>total+value,0);
      const maximum = Math.max(...values)*1.12 || 1;
      const chart = axes(values.length,maximum,plan.yTitle || 'Peso','');
      if(plan.kind==='normalize') {
        const total=text('',size.width-240,78,{width:200,align:'right',fontSize:28,fill:palette.teal});
        actors.push(()=>{chart.axisLabel.text(state.resolve>0 ? 'Probabilidad' : 'Peso');total.text(`Σ = ${decimal(sum*(1-state.resolve)+state.resolve)}`);});
      }
      const unit = (chart.right-90)/values.length;
      values.forEach((value,position)=>{
        const bar = new Konva.Rect({x:90+unit*(position+0.2),y:chart.bottom,width:unit*0.6,height:0,fill:[palette.teal,palette.rose,palette.gold][position%3],cornerRadius:3,listening:false});
        sceneRoot.add(bar);
        const label = text('',bar.x()-unit*0.1,100,{width:unit*0.8,align:'center',fontSize:30,fontStyle:'bold'});
        text(plan.labels?.[position] || String(position+1),90+unit*position,chart.bottom+12,{width:unit,align:'center',fontSize:24});
        actors.push(()=>{
          const barHeight=(chart.bottom-chart.mapY(value))*state.reveal;
          bar.height(barHeight); bar.y(chart.bottom-barHeight); label.y(Math.max(100,bar.y()-38));
          label.text(decimal(plan.kind==='normalize' ? value*(1-state.resolve+state.resolve/sum) : value));
          label.opacity(state.reveal);
        });
      });
      if (plan.horizontal !== undefined) reveal(line([90,chart.mapY(plan.horizontal),chart.right,chart.mapY(plan.horizontal)],{stroke:palette.rose,dash:[8,8]}),0.45,0.65);
      formula(plan.equation);
    } else if (plan.kind === 'units' || plan.kind === 'rate') {
      const isUnits = plan.kind === 'units';
      const centers = portrait ? [190,450] : [250,710];
      centers.forEach((center,position)=>{
        const vessel = new Konva.Group({x:center-65,y:150,listening:false});
        vessel.add(new Konva.Rect({width:130,height:180,stroke:palette.ink,strokeWidth:3,cornerRadius:[0,0,20,20]}));
        const liquid = new Konva.Rect({x:4,y:65,width:122,height:110,fill:position ? '#f4dce4' : '#cce9df',cornerRadius:[0,0,16,16]});
        vessel.add(liquid); sceneRoot.add(vessel); reveal(vessel,position*0.2,0.3+position*0.2);
        text(isUnits ? (position ? '1000 μg' : '1 mg') : (position ? '2 colonias' : '1 mL'),center-105,354,{width:210,align:'center',fontSize:32,fontStyle:'bold'});
        if (!isUnits && position) for (const offset of [35,87]) vessel.add(new Konva.Circle({x:offset,y:115,radius:12,fill:palette.rose}));
      });
      reveal(text(isUnits ? '=' : '→',size.width/2-35,220,{width:70,align:'center',fontSize:50,fill:palette.teal}),0.35,0.55);
      formula(plan.equation);
    } else if (plan.kind === 'discrete') {
      const chart = axes(6,1,'p(x)','x');
      for (const [position,value] of plan.values.entries()) {
        const probability = plan.masses[position];
        const selected = plan.mean || value<plan.threshold;
        const stem = line([chart.mapX(value),chart.bottom,chart.mapX(value),chart.bottom],{stroke:selected ? palette.teal : '#b4c3bb',strokeWidth:5});
        const point = new Konva.Circle({x:chart.mapX(value),y:chart.bottom,radius:9,fill:selected ? palette.teal : '#b4c3bb',listening:false});
        sceneRoot.add(point);
        text(String(value),chart.mapX(value)-20,chart.bottom+15,{width:40,align:'center'});
        const label = text(decimal(probability),chart.mapX(value)-40,chart.mapY(probability)-42,{width:80,align:'center',fontSize:27,fill:selected ? palette.teal : palette.muted});
        actors.push(()=>{const vertical=chart.mapY(probability*state.reveal); stem.points([chart.mapX(value),chart.bottom,chart.mapX(value),vertical]); point.y(vertical);label.opacity(state.reveal);});
      }
      if(!plan.mean) {
        reveal(line([chart.mapX(plan.threshold),chart.top,chart.mapX(plan.threshold),chart.bottom],{stroke:palette.rose,dash:[8,8]}),0.35,0.5);
        reveal(text('x < 3',chart.mapX(plan.threshold)-58,78,{width:116,align:'center',fill:palette.rose}),0.35,0.5);
      }
      formula(plan.equation);
    } else if(plan.kind==='interval') {
      const stepWidth=(size.width-180)/3;
      reveal(line([75,300,size.width-65,300],{stroke:palette.ink}),0,0.15);
      for(let value=0;value<=3;value++) {
        const selected=value<plan.threshold;
        const point=new Konva.Circle({x:90+value*stepWidth,y:300,radius:14,fill:selected ? palette.teal : palette.paper,stroke:selected ? palette.teal : palette.rose,strokeWidth:4,listening:false});
        sceneRoot.add(point);reveal(point,value*0.1,0.25+value*0.1);
        text(String(value),point.x()-25,330,{width:50,align:'center',fontSize:36});
      }
      formula(plan.equation);
    } else if (plan.kind === 'integral' || plan.kind === 'support') {
      const graph = integralGeometry(plan.kind==='support' ? {family:'uniform',interval:[0,2]} : plan);
      const maximum = plan.family==='linear-cdf' ? 1.15 : Math.max(1.15,plan.height || plan.density || 0);
      const chart = axes(graph.upper,maximum,plan.family==='linear-cdf' ? 'F(t)' : plan.knownX!==undefined ? 'f(y | x)' : plan.descending ? 'fₓ(x)' : 'f(t)',plan.knownX!==undefined ? 'y' : plan.descending ? 'x' : 't');
      const isCdf = plan.family==='linear-cdf';
      const valueAt = position=>isCdf ? position**2/4 : graph.density(position);
      const curve = line([],{stroke:palette.teal,strokeWidth:5});
      actors.push(()=>{
        const points=[];
        for (let sample=0;sample<=80;sample++) {const position=graph.upper*sample/80*state.reveal;points.push(chart.mapX(position),chart.mapY(valueAt(position)));}
        curve.points(points);
      });
      for (const tick of [graph.upper/2,graph.upper]) text(decimal(tick),chart.mapX(tick)-20,chart.bottom+15,{width:40,align:'center',fontSize:24});
      if (graph.rectangles.length) {
        graph.rectangles.forEach((rectangle,position)=>{
          const block = new Konva.Rect({x:chart.mapX(rectangle.left),y:chart.bottom,width:chart.mapX(rectangle.width)-90,height:0,fill:'#cbe6dd',stroke:palette.teal,strokeWidth:2,listening:false});
          sceneRoot.add(block); curve.moveToTop();
          actors.push(()=>{const amount=Math.max(0,Math.min(1,state.focus*graph.rectangles.length-position)); const blockHeight=chart.bottom-chart.mapY(rectangle.height*amount);block.height(blockHeight);block.y(chart.bottom-blockHeight);});
        });
      } else if (!isCdf) {
        const area = new Konva.Line({points:[],closed:true,fill:'#b9ded0',opacity:0.7,listening:false});
        sceneRoot.add(area); curve.moveToTop();
        actors.push(()=>{
          const end=graph.interval[0]+(graph.interval[1]-graph.interval[0])*state.focus;
          const points=[chart.mapX(graph.interval[0]),chart.bottom];
          for(let sample=0;sample<=40;sample++){const position=graph.interval[0]+(end-graph.interval[0])*sample/40;points.push(chart.mapX(position),chart.mapY(graph.density(position)));}
          points.push(chart.mapX(end),chart.bottom);area.points(points);
        });
        reveal(text(`Área = ${decimal(graph.area)}`,chart.right-240,82,{width:240,align:'right',fontSize:32,fill:palette.teal}),0.68,0.85);
      } else {
        const marker = plan.marker ?? 1;
        const point = new Konva.Circle({x:chart.mapX(marker),y:chart.mapY(valueAt(marker)),radius:9,fill:palette.rose,listening:false});
        sceneRoot.add(point); reveal(point,0.4,0.6);
        const slope=marker/2;
        reveal(line([chart.mapX(marker-0.45),chart.mapY(valueAt(marker)-slope*0.45),chart.mapX(marker+0.45),chart.mapY(valueAt(marker)+slope*0.45)],{stroke:palette.rose,strokeWidth:4}),0.5,0.7);
        reveal(text(`Pendiente = ${decimal(slope)}`,chart.right-280,82,{width:280,align:'right',fontSize:28,fill:palette.rose}),0.6,0.8);
      }
      if (plan.kind==='support') reveal(text('0 fuera del intervalo',140,95,{width:size.width-200,align:'center',fontSize:27,fill:palette.muted}),0.4,0.6);
      formula(plan.equation);
    } else if (plan.kind === 'region') {
      const bound = plan.bound;
      const slice = plan.slice ?? bound*0.3;
      const chart = axes(bound,bound,'y','x');
      const region = new Konva.Line({points:[90,chart.bottom,chart.mapX(bound),chart.bottom,90,chart.mapY(bound)],closed:true,fill:'#d5ebe2',stroke:palette.teal,strokeWidth:3,listening:false});
      sceneRoot.add(region);reveal(region,0.08,0.3);
      if(plan.subset) {
        const subset=new Konva.Line({points:plan.subset.flatMap(([coordX,coordY])=>[chart.mapX(coordX),chart.mapY(coordY)]),closed:true,fill:'#83b99f',stroke:palette.teal,strokeWidth:3,listening:false});
        sceneRoot.add(subset);reveal(subset,0.35,0.6);
      }
      if(plan.chapter!=='Demostración visual') {
        const cut = line([],{stroke:palette.rose,strokeWidth:6});
        const point = new Konva.Circle({radius:8,fill:palette.rose,listening:false});sceneRoot.add(point);
        const label = text('',160,90,{width:size.width-220,align:'center',fontSize:28,fill:palette.rose});
        actors.push(()=>{const position=slice*state.focus;cut.points([chart.mapX(position),chart.bottom,chart.mapX(position),chart.mapY(bound-position)]);point.position({x:chart.mapX(position),y:chart.mapY(bound-position)});label.text(`x = ${decimal(position)}    →    y ≤ ${decimal(bound-position)}`);cut.opacity(state.focus);point.opacity(state.focus);label.opacity(state.focus);});
      } else if(plan.probability!==undefined) reveal(text(`P = ${decimal(plan.probability)}`,160,90,{width:size.width-220,align:'center',fontSize:30,fill:palette.teal}),0.6,0.8);
      text(decimal(bound),chart.mapX(bound)-20,chart.bottom+15,{width:40,align:'center'});
      text(decimal(bound),40,chart.mapY(bound)-12,{width:40});
      formula(plan.equation);
    } else if (plan.kind === 'matrix') {
      const cell = portrait ? 125 : 145;
      const left = (size.width-cell*2)/2;
      const symbols = [['σ₁²','c'],['c','σ₂²']];
      symbols.forEach((row,rowIndex)=>row.forEach((value,columnIndex)=>{
        const diagonal=rowIndex===columnIndex;
        const cellNode=new Konva.Rect({x:left+columnIndex*cell,y:150+rowIndex*cell,width:cell-5,height:cell-5,fill:diagonal ? '#d0e9df' : '#f3dfe6',cornerRadius:4,listening:false});sceneRoot.add(cellNode);reveal(cellNode,(rowIndex+columnIndex)*0.1,0.3+(rowIndex+columnIndex)*0.1);
        reveal(text(value,left+columnIndex*cell,184+rowIndex*cell,{width:cell-5,align:'center',fontSize:42,fill:diagonal ? palette.teal : palette.rose}),0.2,0.45);
      }));
      text('Varianzas',32,145,{width:left-45,fontSize:25,fill:palette.teal});
      text('Covarianza',left+cell*2+12,145,{width:size.width-left-cell*2-30,fontSize:25,fill:palette.rose});
      formula(plan.equation);
    } else if (plan.kind === 'exponential') {
      const chart=axes(6,1.1,'S(t)','h');
      const curve=line([],{stroke:palette.teal,strokeWidth:5});
      actors.push(()=>{const points=[];for(let sample=0;sample<=80;sample++){const position=6*sample/80*state.reveal;points.push(chart.mapX(position),chart.mapY(Math.exp(-position/plan.scale)));}curve.points(points);});
      const target=plan.scale*Math.log(2);
      reveal(line([90,chart.mapY(0.5),chart.mapX(target),chart.mapY(0.5),chart.mapX(target),chart.bottom],{stroke:palette.rose,dash:[8,8],strokeWidth:3}),0.4,0.6);
      text('½',42,chart.mapY(0.5)-14,{width:36,fontSize:28});
      reveal(text(`${decimal(target)} h`,chart.mapX(target)-65,chart.bottom+12,{width:130,align:'center',fontSize:27,fill:palette.rose}),0.6,0.8);
      formula(plan.equation);
    } else {
      let givenY=110;
      plan.givens.slice(0,2).forEach((given,position)=>{const node=text(given,48,givenY,{width:size.width-96,fontSize:27,fill:palette.muted});while(node.height()>80 && node.fontSize()>19)node.fontSize(node.fontSize()-1);givenY+=node.height()+14;reveal(node,position*0.06,0.2+position*0.06);});
      const equations=plan.equations.length ? plan.equations : (plan.equation ? [plan.equation] : []);
      equations.forEach((equation,position)=>formula(equation,320+position*100,0.3+position*0.3,{height:80,color:position===equations.length-1 ? palette.teal : palette.muted}));
      if (equations.length>1) reveal(line([size.width/2,407,size.width/2,422],{stroke:palette.teal,strokeWidth:4}),0.5,0.65);
    }
    timeline.to({}, {duration:0.01},0.99);
    fit();
  }

  function fit() {
    const size=logical();
    const scale=Math.min(width/size.width,height/size.height);
    sceneRoot?.scale({x:scale,y:scale});
    sceneRoot?.position({x:(width-size.width*scale)/2,y:(height-size.height*scale)/2});
  }
  function render(frame) {
    if (disposed) return;
    lastFrame=frame;
    if (lastIndex!==frame.index) {build(planWhiteboardScene(animation.id,frame.step));lastIndex=frame.index;}
    timeline.seek(frame.reducedMotion ? 1 : Math.max(0,Math.min(1,frame.progress)),false);
    for (const apply of actors) apply();
    layer.draw();
  }
  function resize(requestedWidth) {
    if (disposed) return;
    const rect=host.getBoundingClientRect();
    width=Math.max(1,rect.width || requestedWidth || 960);
    height=Math.max(1,rect.height || width*(width<600 ? 1 : 0.6));
    const nextPortrait=width<600;
    stage.size({width,height});
    if(nextPortrait!==portrait){portrait=nextPortrait;lastIndex=-1;}
    fit();
    if(lastFrame) render(lastFrame);
  }
  const observer=typeof view.ResizeObserver==='function' ? new view.ResizeObserver(()=>resize(width)) : null;
  observer?.observe(host);
  owner.fonts?.ready.then(()=>{if(!disposed && lastFrame){lastIndex=-1;render(lastFrame);}});
  return {render,resize,dispose(){if(disposed)return;disposed=true;observer?.disconnect();timeline?.kill();stage.destroy();actors=[];lastFrame=null;}};
}