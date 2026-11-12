import React from 'react';
import statistics from 'jstat';
import {PALETTE, ease, mix, SceneSurface, MathFormula, SvgText} from './native-primitives.jsx';
import {selectedCount, layoutExerciseExplanation} from './native-exercises.mjs';

const COLORS = [PALETTE.green, PALETTE.coral, PALETTE.blue, PALETTE.gold];
const number = value => Number(value.toPrecision(4)).toLocaleString('es');
const sum = values => values.reduce((total,value) => total+value,0);
const phase = (plan,state) => (Math.max(0,state.cueIndex)+ease(state.progress))/Math.max(1,plan.cues.length);
const numeric = (plan,state) => {
  const last = plan.data.source.findLastIndex(step => step.title === 'Datos del enunciado');
  return plan.data.sceneIndex > last || plan.data.sceneIndex === last && state.cueIndex === plan.cues.length-1;
};
const solving = plan => plan.data.sceneIndex > plan.data.source.findIndex(step => step.title === 'Elegir el camino');

function Mark({children,...props}) {
  return <g data-native-mark data-native-bound {...props}>{children}</g>;
}

function Axes({x=65,y=365,width=650,height=280,xLabel='x',yLabel='f(x)'}) {
  return <g stroke={PALETTE.ink} strokeWidth={3}>
    <path d={`M${x},${y-height}V${y}H${x+width}`} fill="none" />
    <SvgText text={xLabel} x={x+width} y={y+62} fontSize={20} anchor="end" />
    <SvgText text={yLabel} x={x} y={y-height-15} fontSize={20} />
  </g>;
}

const extent = (values,zero=false) => {
  const minimum = Math.min(...values,...(zero ? [0] : []));
  const maximum = Math.max(...values,...(zero ? [0] : []));
  return minimum === maximum ? [minimum-1,maximum+1] : [minimum,maximum];
};
const plotPath = (points,x,y) => points.map(([first,second],index) => `${index ? 'L' : 'M'}${x(first)},${y(second)}`).join('');

function PlotAxes({domain,range,xLabel='x',yLabel='y',ticks}) {
  const x = value => 85+630*(value-domain[0])/(domain[1]-domain[0]);
  const y = value => 350-255*(value-range[0])/(range[1]-range[0]);
  const occupied = [];
  return <g>
    <Axes x={85} y={350} width={630} height={255} xLabel="" yLabel={yLabel} />
    {[range[0],(range[0]+range[1])/2,range[1]].map((value,index) => <g key={index}>
      <path d={`M80 ${y(value)}H715`} stroke={PALETTE.line} fill="none" />
      <SvgText text={number(value)} x={67} y={y(value)+6} width={65} fontSize={17} anchor="end" />
    </g>)}
    {(ticks || [domain[0],(domain[0]+domain[1])/2,domain[1]]).map((value,index) => {
      const width = Math.max(28,number(value).length*10);
      let lane = 0;
      while (occupied.some(box => box.lane === lane && Math.abs(box.x-x(value)) < (box.width+width)/2+8)) lane++;
      occupied.push({x:x(value),width,lane});
      return <g key={index}>
        <path d={`M${x(value)} 350v6`} stroke={PALETTE.muted} />
        <SvgText text={number(value)} x={x(value)} y={382+lane*25} width={width+10} fontSize={18} anchor="middle" />
      </g>;
    })}
    <SvgText text={xLabel} x={400} y={451} width={630} fontSize={20} anchor="middle" />
  </g>;
}

function SourceDiagram({diagram,phase:cuePhase}) {
  const selected = diagram.highlight || diagram.selected || cuePhase?.focus?.targets?.indices || [];
  const kind = diagram.kind;
  let content;
  if (kind === 'matrix') {
    const cellWidth = 570/diagram.columns.length;
    const dense = cellWidth < 70;
    const top = dense ? 150 : 80;
    const cellHeight = (dense ? 250 : 300)/diagram.rows.length;
    const labelSize = Math.min(20,cellHeight*0.65);
    content = <g>
      {diagram.columns.map((label,index) => {
        const left = 135+(index+0.5)*cellWidth;
        return <SvgText key={index} text={String(label)} x={left} y={dense ? 130 : 55} width={dense ? 240 : cellWidth-12} fontSize={dense ? 14 : 20} anchor={dense ? 'start' : 'middle'} transform={dense ? `rotate(-90 ${left} 130)` : undefined} />;
      })}
      {diagram.rows.map((label,row) => <g key={row}>
        <SvgText text={String(label)} x={115} y={top+(row+0.5)*cellHeight+6} width={105} fontSize={labelSize} anchor="end" />
        {diagram.values[row].map((value,column) => {
          const active = (diagram.highlight || cuePhase?.focus?.targets?.cells || []).some(([first,second]) => first === row && second === column);
          return <g key={column}>
            <rect x={135+column*cellWidth} y={top+row*cellHeight} width={cellWidth-3} height={cellHeight-3} fill={active ? PALETTE.green : PALETTE.soft} stroke={PALETTE.ink} strokeWidth={3} />
            <SvgText text={value === null ? '?' : number(value)} x={135+(column+0.5)*cellWidth} y={top+(row+0.5)*cellHeight+6} width={cellWidth-12} fontSize={Math.min(22,cellHeight*0.7)} anchor="middle" fill={active ? PALETTE.paper : PALETTE.ink} />
          </g>;
        })}
      </g>)}
    </g>;
  } else if (kind === 'trials') {
    const columns = Math.min(7,diagram.outcomes.length);
    const rows = Math.ceil(diagram.outcomes.length/columns);
    const width = 690/columns;
    const height = 370/rows;
    content = diagram.outcomes.map((outcome,index) => <g key={index}>
      <rect x={40+index%columns*width} y={35+Math.floor(index/columns)*height} width={width-8} height={height-8} fill={selected.includes(index) ? PALETTE.soft : PALETTE.paper} stroke={PALETTE.muted} />
      <SvgText text={outcome} x={45+index%columns*width} y={65+Math.floor(index/columns)*height} width={width-18} fontSize={20} />
      {(diagram.groups || []).filter(group => group.indices.includes(index)).map((group,groupIndex) => <path key={group.label} d={`M${45+index%columns*width} ${35+(Math.floor(index/columns)+1)*height-18-groupIndex*6}h${width-22}`} stroke={COLORS[groupIndex%4]} strokeWidth={3} />)}
    </g>);
  } else if (kind === 'tree') {
    const leaves = node => node.children?.length ? sum(node.children.map(leaves)) : 1;
    const depth = node => 1+Math.max(0,...(node.children || []).map(depth));
    const count = sum(diagram.nodes.map(leaves));
    const width = 690/Math.max(...diagram.nodes.map(depth));
    let offset = 0;
    const walk = (node,level,start,parent) => {
      const left = 40+level*width;
      const top = 40+(start+leaves(node)/2)*350/count;
      let next = start;
      return <g key={`${level}-${start}`}>
        {parent && <path d={`M${parent[0]} ${parent[1]}L${left} ${top}`} stroke={PALETTE.ink} strokeWidth={3} />}
        <circle cx={left} cy={top} r={5} fill={PALETTE.green} />
        <SvgText text={node.weight === undefined ? node.label : `${node.label}; p = ${number(node.weight)}`} x={left+10} y={top-12} width={width-20} fontSize={20} />
        {(node.children || []).map(child => {const result = walk(child,level+1,next,[left+width-10,top]); next += leaves(child); return result;})}
      </g>;
    };
    content = diagram.nodes.map(node => {const result = walk(node,0,offset); offset += leaves(node); return result;});
  } else if (kind === 'number-line') {
    const domain = [diagram.min,diagram.max];
    const x = value => 85+630*(value-domain[0])/(domain[1]-domain[0]);
    content = <g>
      <PlotAxes domain={domain} range={[0,1]} xLabel={diagram.xLabel || 'x'} yLabel="" ticks={[...new Set([diagram.min,...(diagram.points || []),diagram.max])]} />
      {(diagram.intervals || []).map((interval,index) => <g key={index}>
        <path d={`M${x(interval.from)} ${125+index*65}H${x(interval.to)}`} stroke={COLORS[index%4]} strokeWidth={4} />
        {[interval.from,interval.to].map((value,end) => <circle key={end} cx={x(value)} cy={125+index*65} r={6} fill={interval.closed?.[end] === false ? PALETTE.paper : COLORS[index%4]} stroke={COLORS[index%4]} strokeWidth={2} />)}
        <SvgText text={interval.label} x={400} y={155+index*65} width={630} anchor="middle" fontSize={18} />
      </g>)}
    </g>;
  } else {
    const curve = kind === 'curve' || kind === 'normal';
    const plane = ['scatter','region','joint-normal'].includes(kind);
    if (!curve && !plane && kind !== 'bars') throw new RangeError(`Unsupported source exercise diagram: ${kind}`);
    let points = diagram.points || [];
    let domain = diagram.domain;
    let range = diagram.range;
    if (kind === 'normal') {
      domain ||= [diagram.mean-4*diagram.sd,diagram.mean+4*diagram.sd];
      points = Array.from({length:161},(_,index) => {
        const value = domain[0]+(domain[1]-domain[0])*index/160;
        return [value,statistics.jStat.normal.pdf(value,diagram.mean,diagram.sd)];
      });
    } else if (kind === 'joint-normal') {
      domain ||= [diagram.meanX-3.6*diagram.sdX,diagram.meanX+3.6*diagram.sdX];
      range ||= [diagram.meanY-3.6*diagram.sdY,diagram.meanY+3.6*diagram.sdY];
    } else if (kind === 'bars') {
      domain ||= [0,diagram.values.length];
      const limits = extent(diagram.values,true);
      range ||= [Math.min(0,limits[0])*1.14,Math.max(0,limits[1])*1.18];
    }
    const all = [...points,...(plane ? [...(diagram.markers || []),...(diagram.cut || []),...(diagram.polygons || []).flat()] : [])];
    domain ||= extent(all.map(point => point[0]),kind === 'region');
    range ||= curve ? [Math.min(0,...points.map(point => point[1])),Math.max(0.000001,...points.map(point => point[1]))*1.12] : extent(all.map(point => point[1]),kind === 'region');
    const x = value => 85+630*(value-domain[0])/(domain[1]-domain[0]);
    const y = value => 350-255*(value-range[0])/(range[1]-range[0]);
    const path = values => plotPath(values,x,y);
    const clip = `exercise-source-${kind}`;
    const at = position => {
      const upper = points.findIndex(point => point[0] > position);
      if (upper < 0) return points.at(-1)[1];
      if (!upper) return points[0][1];
      const first = points[upper-1];
      const second = points[upper];
      return first[1]+(second[1]-first[1])*(position-first[0])/(second[0]-first[0]);
    };
    const shade = diagram.shade || (kind === 'normal' && (diagram.lower !== undefined || diagram.upper !== undefined) ? [diagram.lower ?? domain[0],diagram.upper ?? domain[1]] : null);
    content = <g>
      <defs><clipPath id={clip}><rect x={85} y={95} width={630} height={255} /></clipPath></defs>
      <PlotAxes domain={domain} range={range} ticks={kind === 'bars' ? [] : diagram.ticks} xLabel={diagram.xLabel || (plane ? 'X' : 'x')} yLabel={diagram.yLabel || (kind === 'normal' ? 'Densidad' : kind === 'bars' ? diagram.measure === 'mass' ? 'Masa' : 'Valor' : diagram.label || (plane ? 'Y' : 'y'))} />
      <g clipPath={`url(#${clip})`}>
        {curve && <g>
          {shade && <path d={`${path([[Math.max(domain[0],shade[0]),0],[Math.max(domain[0],shade[0]),at(Math.max(domain[0],shade[0]))],...points.filter(([value]) => value > shade[0] && value < shade[1]),[Math.min(domain[1],shade[1]),at(Math.min(domain[1],shade[1]))],[Math.min(domain[1],shade[1]),0]])}Z`} fill={PALETTE.soft} stroke={PALETTE.green} />}
          <path d={path(points)} fill="none" stroke={PALETTE.blue} strokeWidth={4} />
          {[...(diagram.markers || []),...(Number.isFinite(diagram.marker) ? [diagram.marker] : [])].map((marker,index) => <g key={index}>
            <path d={`M${x(marker)} ${y(0)}V${y(at(marker))}`} stroke={PALETTE.coral} strokeWidth={3} strokeDasharray="5 3" />
            <circle cx={x(marker)} cy={y(at(marker))} r={5} fill={PALETTE.coral} />
          </g>)}
          {kind !== 'normal' && Number.isFinite(diagram.level) && <path d={`M85 ${y(diagram.level)}H715`} stroke={PALETTE.gold} strokeWidth={3} />}
        </g>}
        {kind === 'region' && <g>
          <path d={`${path(points)}Z`} fill={PALETTE.soft} stroke={PALETTE.green} strokeWidth={3} />
          {(diagram.polygons || []).map((polygon,index) => <path key={index} d={`${path(polygon)}Z`} fill={PALETTE.green} fillOpacity={0.3} stroke={PALETTE.coral} strokeWidth={3} />)}
          {diagram.cut && <path d={path(diagram.cut)} fill="none" stroke={PALETTE.coral} strokeWidth={3} />}
          {(diagram.markers || []).map(([first,second],index) => <circle key={index} cx={x(first)} cy={y(second)} r={6} fill={PALETTE.coral} />)}
          {diagram.sweep && Array.from({length:9},(_,index) => {
            const value = diagram.sweep[0]+(diagram.sweep[1]-diagram.sweep[0])*(index+1)/10;
            const intersections = points.flatMap((first,pointIndex) => {
              const second = points[(pointIndex+1)%points.length];
              return first[0] !== second[0] && value >= Math.min(first[0],second[0]) && value <= Math.max(first[0],second[0]) ? [first[1]+(second[1]-first[1])*(value-first[0])/(second[0]-first[0])] : [];
            });
            return intersections.length > 1 ? <path key={index} d={`M${x(value)} ${y(Math.min(...intersections))}V${y(Math.max(...intersections))}`} stroke={PALETTE.green} /> : null;
          })}
        </g>}
        {kind === 'scatter' && <g>
          {diagram.line && <path d={path(domain.map(value => [value,diagram.line.slope*value+diagram.line.intercept]))} fill="none" stroke={PALETTE.muted} strokeWidth={2} />}
          {points.map(([first,second],index) => <circle key={index} cx={x(first)} cy={y(second)} r={6} fill={selected.includes(index) ? PALETTE.coral : PALETTE.green} />)}
        </g>}
        {kind === 'joint-normal' && <g>
          {[3,2,1].map(radius => <path key={radius} d={path(Array.from({length:97},(_,index) => {
            const angle = index*Math.PI/48;
            return [diagram.meanX+diagram.sdX*radius*Math.cos(angle),diagram.meanY+diagram.sdY*radius*(diagram.rho*Math.cos(angle)+Math.sqrt(1-diagram.rho**2)*Math.sin(angle))];
          }))} fill={PALETTE.soft} fillOpacity={0.3} stroke={PALETTE.green} strokeWidth={3} />)}
          {['x','both'].includes(diagram.highlightAxis) && <path d={`M85 ${y(diagram.meanY)}H715`} stroke={PALETTE.gold} strokeWidth={2} />}
          {['y','both'].includes(diagram.highlightAxis) && <path d={`M${x(diagram.meanX)} 95V350`} stroke={PALETTE.gold} strokeWidth={2} />}
          {Number.isFinite(diagram.cutX) && <path d={`M${x(diagram.cutX)} 95V350`} stroke={PALETTE.coral} strokeWidth={3} />}
        </g>}
        {kind === 'bars' && diagram.values.map((value,index) => <rect key={index} x={x(index+0.18)} y={y(Math.max(0,value))} width={630/diagram.values.length*0.64} height={Math.abs(y(value)-y(0))} fill={selected.includes(index) ? PALETTE.coral : PALETTE.green} />)}
      </g>
      {kind === 'bars' && diagram.labels.map((label,index) => <SvgText key={index} text={String(label)} x={x(index+0.5)} y={382+index%2*28} width={630/diagram.values.length-4} fontSize={Math.min(19,630/diagram.values.length/4)} anchor="middle" />)}
    </g>;
  }
  return <svg data-native-source-diagram={kind} width="780" height="480"><Mark>{content}</Mark></svg>;
}

function SetAllocation({plan,state}) {
  const {model,questionId:question,context} = plan.data;
  const progress = phase(plan,state);
  let labels = model.labels || context?.labels || ['Solo A','Ambos','Solo B','Ninguno'];
  let values = model.values || context?.values;
  if (!values) {
    const total = model.total ?? 1;
    const first = model.countA ?? model.probabilityA;
    const second = model.countB ?? model.probabilityB;
    values = [(first-model.both)/total,model.both/total,(second-model.both)/total,(total-first-second+model.both)/total];
  }
  const selected = index => {
    if (context?.highlight?.length) return context.highlight.includes(index);
    const label = labels[index];
    if (plan.data.exerciseId === 'pdf-u1-1') {
      if (question === 'b') return ['Solo B','Ninguno'].includes(label);
      if (question === 'c') return label === 'Solo B';
      if (question === 'd') return label === 'Solo A';
    }
    if (plan.data.exerciseId === 'pdf-u1-2') {
      if (question === 'b') return index === 0;
      if (question === 'c') return [1,2,5].includes(index);
      if (question === 'd') return [0,3,4,6,7].includes(index);
    }
    if (question === 'neither' || question === 'e') return index === values.length-1;
    if (question === 'product' || question === 'given') return labels[index] === 'Ambos';
    return index < values.length-1;
  };
  const known = numeric(plan,state);
  let offset = 0;
  return <svg width="780" height="480">
    <SvgText text={plan.family === 'event-independence' ? 'A ∩ B frente a P(A)P(B)' : 'Resultados del experimento'} x={45} y={45} width={680} />
    {values.map((value,index) => {
      const start = offset; offset += value;
      const width = 670*value;
      const color = COLORS[index%4];
      return <Mark key={index}>
        <rect x={45+670*start} y={100} width={Math.max(0,width-2)} height={170} fill={color} opacity={selected(index) ? mix(0.45,0.9,progress) : 0.22} />
        <SvgText text={labels[index]} x={45+670*(start+value/2)} y={300+index%2*34} width={Math.max(80,width)} fontSize={Math.min(20,Math.max(12,width/5))} anchor="middle" />
        {known && <SvgText text={number(value)} x={45+670*(start+value/2)} y={180} fontSize={Math.min(24,Math.max(12,width/3))} anchor="middle" fill={PALETTE.paper} />}
      </Mark>;
    })}
    <Mark><line x1={45+670*progress} x2={45+670*progress} y1={88} y2={280} stroke={PALETTE.ink} strokeWidth={2} /></Mark>
    {plan.family === 'event-independence' && known && <g>
      <rect x={45} y={377} width={670*model.both} height={15} fill={PALETTE.coral} />
      <rect x={45} y={405} width={670*model.probabilityA*model.probabilityB} height={15} fill={PALETTE.green} />
      <SvgText text="P(A ∩ B)" x={740} y={390} fontSize={16} anchor="end" />
      <SvgText text="P(A)P(B)" x={740} y={420} fontSize={16} anchor="end" />
    </g>}
  </svg>;
}

function ProbabilityTree({plan,state}) {
  const {model,questionId:question} = plan.data;
  const priors = model.priors || [model.prevalence,1-model.prevalence];
  const rates = model.rates || [model.sensitivity,model.falsePositive];
  const labels = model.labels || ['I','no I'];
  const negative = question.startsWith('vpn') || question === 'a' && plan.data.exerciseId === 'pdf-u1-3';
  const progress = phase(plan,state);
  const known = numeric(plan,state);
  const selectedRates = rates.map(rate => negative ? 1-rate : rate);
  const weights = priors.map((prior,index) => prior*selectedRates[index]);
  const total = sum(weights);
  return <svg width="780" height="480">
    <SvgText text={negative ? 'Rutas compatibles con negativo' : 'Del origen a la observación'} x={35} y={35} width={700} />
    <circle cx={65} cy={230} r={13} fill={PALETTE.ink} />
    {priors.map((prior,index) => {
      const middleY = 120+index*220;
      return <Mark key={index}>
        <path d={`M80 230L310 ${middleY}`} stroke={COLORS[index]} strokeWidth={3+22*prior} fill="none" opacity={0.45} />
        <SvgText text={known ? `${labels[index]} · ${number(prior)}` : `P(${labels[index]})`} x={200} y={middleY-20} width={180} fontSize={22} />
        {[0,1].map(result => {
          const endY = middleY-45+90*result;
          const rate = result === 0 ? rates[index] : 1-rates[index];
          const active = negative ? result === 1 : result === 0;
          return <g key={result}>
            <path d={`M330 ${middleY}L630 ${endY}`} stroke={COLORS[index]} strokeWidth={3+24*prior*rate} opacity={active ? 0.8 : 0.16} fill="none" />
            <circle cx={mix(330,630,progress)} cy={mix(middleY,endY,progress)} r={5+8*prior*rate} fill={COLORS[index]} />
            <SvgText text={model.observation ? result === 0 ? model.observation : '≠0' : plan.data.exerciseId === 'capstone-pec1-2' ? result === 0 ? '4' : '≠4' : result === 0 ? '+' : '−'} x={660} y={endY+5} width={110} fontSize={model.observation ? 16 : 28} fill={active ? COLORS[index] : PALETTE.muted} />
            {known && <SvgText text={number(rate)} x={480} y={endY-16} fontSize={18} fill={COLORS[index]} />}
          </g>;
        })}
        <circle cx={320} cy={middleY} r={11} fill={COLORS[index]} />
      </Mark>;
    })}
    {solving(plan) && <Mark>
      <rect x={65} y={435} width={650*weights[0]/total} height={18} fill={PALETTE.green} opacity={progress} />
      <rect x={65+650*weights[0]/total} y={435} width={650*weights[1]/total} height={18} fill={PALETTE.coral} opacity={progress} />
    </Mark>}
  </svg>;
}

function ConditionalPopulation({plan,state}) {
  const model = plan.data.model;
  const recovered = plan.data.questionId === 'treatment-given-recovery';
  const progress = phase(plan,state);
  const cells = [model.recoveredTreated,model.treated-model.recoveredTreated,model.recoveredUntreated,model.total-model.treated-model.recoveredUntreated];
  let offset = 0;
  return <svg width="780" height="480">
    <SvgText text={recovered ? 'Referencia: recuperadas' : 'Referencia: tratadas'} x={40} y={40} width={700} />
    {cells.flatMap((count,category) => {
      const start = offset; offset += count;
      return Array.from({length:count},(_,local) => {
        const index = start+local;
        const selected = recovered ? category === 0 || category === 2 : category < 2;
        const x = 70+(index%20)*32;
        const y = 110+Math.floor(index/20)*48;
        return <Mark key={index} opacity={selected ? 1 : mix(0.8,0.12,progress)}>
          <circle cx={x} cy={y-mix(0,selected ? 6 : 0,progress)} r={10} fill={category%2===0 ? PALETTE.green : PALETTE.coral} />
        </Mark>;
      });
    })}
    <SvgText text="Recuperadas" x={70} y={410} fill={PALETTE.green} />
    <SvgText text="No recuperadas" x={390} y={410} fill={PALETTE.coral} />
  </svg>;
}

function CountDistribution({plan,state}) {
  const {mass,questionId:question,model} = plan.data;
  const progress = phase(plan,state);
  const threshold = question === 'at-least-one' ? 1 : question === 'at-most-two' ? 2 : model.k ?? 2;
  const maximum = Math.max(...mass.probabilities);
  const pitch = 650/mass.values.length;
  const supportMinimum = mass.values[0];
  const supportMaximum = mass.values.at(-1);
  const padding = (supportMaximum-supportMinimum)/Math.max(1,mass.values.length-1)/2 || 0.5;
  const position = value => 65+650*(value-supportMinimum+padding)/(supportMaximum-supportMinimum+2*padding);
  const known = numeric(plan,state);
  const cumulative = plan.family === 'cdf-table' || question === 'cdf';
  const mean = sum(mass.values.map((value,index) => value*mass.probabilities[index]));
  const moment = ['mean','variance','e-mean','e-variance','f-mean','f-variance'].includes(question) && solving(plan);
  const trialCount = model.n ?? model.draws ?? (model.r ? model.r+model.k : model.trials ?? 0);
  let accumulated = 0;
  return <svg width="780" height="480">
    <Axes yLabel={cumulative ? 'F(t)' : model.weights ? 'peso relativo' : 'p(x)'} />
    {mass.values.map((value,index) => {
      const probability = mass.probabilities[index];
      const selected = selectedCount(question,value,threshold);
      accumulated += probability;
      const height = 245*probability/maximum;
      const x = position(value);
      return <Mark key={value}>
        <rect x={x-pitch*0.35} y={365-height} width={Math.max(1,pitch*0.7)} height={height} fill={selected ? PALETTE.green : PALETTE.blue} opacity={selected ? 0.55+0.4*ease(state.progress) : 0.22} />
        {mass.values.length <= 18 && <SvgText text={number(value)} x={x} y={395} fontSize={18} anchor="middle" />}
        {known && mass.values.length <= 8 && <SvgText text={number(model.weights ? model.weights[index] : probability)} x={x} y={355-height} fontSize={18} anchor="middle" />}
        {cumulative && <g>
          <path d={`M${x},${365-245*(accumulated-probability)}V${365-245*accumulated}H${index === mass.values.length-1 ? 715 : position(mass.values[index+1])}`} stroke={PALETTE.coral} strokeWidth={3} fill="none" />
          <circle cx={x} cy={365-245*accumulated} r={4} fill={PALETTE.coral} />
          <circle cx={x} cy={365-245*(accumulated-probability)} r={4} fill={PALETTE.paper} stroke={PALETTE.coral} />
        </g>}
        {moment && <rect x={Math.min(x,position(mean))} y={365-height*progress} width={Math.abs(x-position(mean))} height={height*progress} fill={COLORS[index%4]} opacity={0.15} />}
      </Mark>;
    })}
    {mass.approximate && <path data-native-bound d={mass.approximate.map((value,index) => `${index ? 'L' : 'M'}${65+pitch*(index+0.5)},${365-245*value/maximum}`).join('')} stroke={PALETTE.coral} strokeWidth={2} fill="none" />}
    <Mark><line x1={65+650*progress} x2={65+650*progress} y1={75} y2={365} stroke={PALETTE.gold} strokeWidth={3} /></Mark>
    {['binomial','geometric','negative-binomial','hypergeometric'].includes(plan.family) && <g>
      {Array.from({length:Math.min(40,model.population ?? trialCount)},(_,index) => <Mark key={index}>
        <circle cx={70+index*16} cy={435} r={5} fill={plan.family === 'geometric' ? index === model.trials-1 ? PALETTE.green : PALETTE.coral : index < (model.successes ?? model.k) ? PALETTE.green : PALETTE.coral} opacity={model.population ? index < trialCount*progress ? 0.12 : 0.9 : index/Math.max(1,trialCount) < progress ? 0.9 : 0.2} />
      </Mark>)}
    </g>}
  </svg>;
}

function DensityArea({plan,state}) {
  const {density} = plan.data;
  const progress = phase(plan,state);
  const [minimum,maximum] = density.domain;
  const momentPower = solving(plan) && ['mean','e-mean','f-mean','variance','e-variance','f-variance'].includes(plan.data.questionId) ? plan.data.questionId.includes('variance') ? 2 : 1 : 0;
  const displayPoints = density.points.map(([value,height]) => [value,height*value**momentPower]);
  const x = value => 65+650*(value-minimum)/(maximum-minimum);
  const ceiling = Math.max(...displayPoints.map(point => point[1]));
  const y = value => 365-260*value/ceiling;
  const boundary = mix(momentPower ? minimum : density.lower,momentPower ? maximum : density.upper,progress);
  const selected = displayPoints.filter(([value]) => value >= (momentPower ? minimum : density.lower) && value <= boundary);
  const line = displayPoints.map(([value,height],index) => `${index ? 'L' : 'M'}${x(value)},${y(height)}`).join('');
  const area = selected.length ? `M${x(selected[0][0])},365${selected.map(([value,height]) => `L${x(value)},${y(height)}`).join('')}L${x(selected.at(-1)[0])},365Z` : '';
  if (['b-cdf','f-cdf'].includes(plan.data.questionId)) {
    const at = minimum+(maximum-minimum)*progress;
    const cdf = plan.data.context?.kind === 'curve' ? plan.data.context.points : density.cdfPoints;
    const cdfDomain = plan.data.context?.kind === 'curve' ? plan.data.context.domain : density.domain;
    const cdfX = value => 430+300*(value-cdfDomain[0])/(cdfDomain[1]-cdfDomain[0]);
    return <svg width="780" height="480">
      <Mark>
      <Axes x={50} width={310} yLabel="f(x)" /><Axes x={430} width={300} yLabel="F(x)" />
      <path data-native-bound d={density.points.map(([value,height],index) => `${index ? 'L' : 'M'}${50+310*(value-minimum)/(maximum-minimum)},${y(height)}`).join('')} stroke={PALETTE.blue} strokeWidth={3} fill="none" />
      <path data-native-bound d={cdf.map(([value,height],index) => `${index ? 'L' : 'M'}${cdfX(value)},${365-260*height}`).join('')} stroke={PALETTE.coral} strokeWidth={3} fill="none" />
      </Mark>
      <Mark><path d={`M50 365${density.points.filter(([value]) => value <= at).map(([value,height]) => `L${50+310*(value-minimum)/(maximum-minimum)} ${y(height)}`).join('')}L${50+310*progress} 365Z`} fill={PALETTE.green} opacity={0.3} /></Mark>
      <Mark><line x1={cdfX(at)} x2={cdfX(at)} y1={80} y2={365} stroke={PALETTE.gold} strokeWidth={2} /></Mark>
    </svg>;
  }
  return <svg width="780" height="480">
    <Mark>
    <Axes yLabel={momentPower === 2 ? 'x² f(x)' : momentPower === 1 ? 'x f(x)' : 'f(x)'} />
    <path data-native-bound d={line} fill="none" stroke={PALETTE.blue} strokeWidth={4} />
    </Mark>
    {!density.point && <Mark><path d={area} fill={PALETTE.green} opacity={0.3} /></Mark>}
    {plan.data.questionId === 'memoryless' && <Mark><path d={density.points.filter(([value]) => value >= plan.data.model.elapsed).map(([value,height],index) => `${index ? 'L' : 'M'}${x(value-plan.data.model.elapsed*progress)},${y(height*Math.exp(plan.data.model.rate*plan.data.model.elapsed*progress))}`).join('')} stroke={PALETTE.coral} strokeWidth={3} fill="none" /></Mark>}
    <Mark><line x1={x(density.point ? plan.data.model.threshold ?? 1 : boundary)} x2={x(density.point ? plan.data.model.threshold ?? 1 : boundary)} y1={90} y2={365} stroke={density.point ? PALETTE.coral : PALETTE.gold} strokeWidth={density.point ? mix(8,1,progress) : 2} /></Mark>
    {[minimum,maximum].map(value => <SvgText key={value} text={number(value)} x={x(value)} y={395} fontSize={20} anchor="middle" />)}
    {numeric(plan,state) && <SvgText text={density.point ? 'Anchura = 0' : momentPower ? momentPower === 1 ? '∫ x f(x) dx = E[X]' : '∫ x² f(x) dx = E[X²]' : `${number(density.lower)} ≤ x ≤ ${number(density.upper)}`} x={380} y={445} width={650} anchor="middle" fontSize={22} />}
  </svg>;
}

function JointTable({plan,state}) {
  const {model,context,questionId:question} = plan.data;
  const rows = context?.kind === 'matrix' ? context.rows : model.valuesX;
  const columns = context?.kind === 'matrix' ? context.columns : model.valuesY;
  const values = context?.kind === 'matrix' ? context.values : model.probabilities;
  const progress = phase(plan,state);
  const cellWidth = Math.min(140,530/columns.length);
  const cellHeight = Math.min(100,280/rows.length);
  const width = cellWidth*columns.length;
  const rowSums = values.map(sum);
  const columnSums = columns.map((_,column) => sum(values.map(row => row[column])));
  const marginal = question.includes('marginal');
  const conditional = question.includes('conditional');
  const factorization = plan.family === 'independence';
  return <svg width="780" height="480">
    <SvgText text={factorization ? 'Conjunta frente al producto de marginales' : conditional ? 'Corte y normalización de la condición' : 'Parejas simultáneas'} x={35} y={35} width={700} fontSize={23} />
    {columns.map((label,column) => <SvgText key={column} text={`Y=${label}`} x={140+cellWidth*(column+0.5)} y={83} width={cellWidth} anchor="middle" fontSize={18} />)}
    {values.map((row,rowIndex) => <g key={rowIndex}>
      <SvgText text={`X=${rows[rowIndex]}`} x={120} y={115+cellHeight*(rowIndex+0.5)} width={110} anchor="end" fontSize={18} />
      {row.map((value,columnIndex) => {
        const highlighted = context?.highlight?.some(([row,column]) => row === rowIndex && column === columnIndex);
        const focusColumn = columns.findIndex(value => Number(value) === 1);
        const selected = highlighted || (marginal ? columnIndex === focusColumn : conditional ? rowIndex === rows.length-1 : question === 'region' ? rowIndex === 0 : rowIndex === rows.length-1 && columnIndex === 0);
        const left = 140+cellWidth*columnIndex;
        const top = 100+cellHeight*rowIndex;
        return <Mark key={columnIndex}>
          <rect x={left} y={top} width={cellWidth-3} height={cellHeight-3} fill={selected ? PALETTE.green : PALETTE.blue} opacity={selected ? mix(0.25,0.55,progress) : 0.1} />
          <circle cx={left+cellWidth/2} cy={top+cellHeight/2} r={Math.sqrt(value)*Math.min(cellHeight,cellWidth)*0.4} fill={PALETTE.green} />
          {numeric(plan,state) && <SvgText text={value === null ? '?' : number(value)} x={left+cellWidth/2} y={top+cellHeight/2+6} fontSize={Math.min(20,cellWidth/4)} anchor="middle" />}
          {factorization && <rect x={left+cellWidth*0.25} y={top+cellHeight*0.25} width={cellWidth*0.5} height={Math.min(cellHeight*0.7,rowSums[rowIndex]*columnSums[columnIndex]*cellHeight*2)} fill="none" stroke={PALETTE.coral} strokeWidth={2} />}
        </Mark>;
      })}
      <Mark><rect x={150+width} y={110+cellHeight*rowIndex} width={70*rowSums[rowIndex]*progress} height={cellHeight-25} fill={PALETTE.coral} opacity={0.5} /></Mark>
    </g>)}
    {columnSums.map((value,column) => <Mark key={column}>
      <rect x={145+column*cellWidth} y={115+rows.length*cellHeight} width={cellWidth-15} height={55*value*progress} fill={PALETTE.gold} />
    </Mark>)}
  </svg>;
}

function RegionSlice({plan,state}) {
  const {model,context,questionId:question} = plan.data;
  const points = context?.kind === 'region' ? context.points : model.points || [[0,0],[model.capacity ?? model.a,0],[0,model.capacity ?? model.a]];
  const maximumX = Math.max(...points.map(point => point[0]));
  const maximumY = Math.max(...points.map(point => point[1]));
  const x = value => 85+580*value/maximumX;
  const y = value => 370-290*value/maximumY;
  const progress = phase(plan,state);
  const clip = `exercise-region-${plan.data.exerciseId}-${plan.data.sceneIndex}`;
  const vertical = !model.conditionY;
  const at = vertical ? model.first ?? model.x ?? maximumX*progress : model.conditionY;
  const intersections = [];
  for (let index=0;index<points.length;index++) {
    const first = points[index];
    const second = points[(index+1)%points.length];
    const axis = vertical ? 0 : 1;
    if (first[axis] === second[axis] || at < Math.min(first[axis],second[axis]) || at > Math.max(first[axis],second[axis])) continue;
    const fraction = (at-first[axis])/(second[axis]-first[axis]);
    intersections.push([first[0]+fraction*(second[0]-first[0]),first[1]+fraction*(second[1]-first[1])]);
  }
  return <svg width="780" height="480">
    <defs><clipPath id={clip}><polygon points={points.map(([first,second]) => `${x(first)},${y(second)}`).join(' ')} /></clipPath></defs>
    <Axes x={85} y={370} width={580} height={290} yLabel="y" />
    <polygon data-native-bound points={points.map(([first,second]) => `${x(first)},${y(second)}`).join(' ')} fill={PALETTE.blue} fillOpacity={0.15} stroke={PALETTE.blue} strokeWidth={3} />
    <Mark clipPath={`url(#${clip})`}>
      {question === 'reduction' && model.cutSlope ? <path d={`M${x(0)} ${y(0)}L${x(maximumX*progress)} ${y(0)}L${x(maximumX*progress)} ${y(maximumX*progress*model.cutSlope)}Z`} fill={PALETTE.green} opacity={0.35} /> : question === 'marginal-tail' ? <rect x={85} y={80} width={580*progress} height={y(model.conditionY)-80} fill={PALETTE.green} opacity={0.35} /> : <rect x={85} y={80} width={580*progress} height={290} fill={PALETTE.green} opacity={0.15} />}
    </Mark>
    {intersections.length >= 2 && <Mark>
      <line x1={x(intersections[0][0])} y1={y(intersections[0][1])} x2={x(intersections[1][0])} y2={y(intersections[1][1])} stroke={PALETTE.coral} strokeWidth={mix(3,10,progress)} />
      <circle cx={mix(x(intersections[0][0]),x(intersections[1][0]),progress)} cy={mix(y(intersections[0][1]),y(intersections[1][1]),progress)} r={7} fill={PALETTE.gold} />
      {question === 'conditional-tail' && (vertical ? <line x1={x(at)} x2={x(at)} y1={y(model.d)} y2={y(Math.max(...intersections.map(point => point[1])))} stroke={PALETTE.green} strokeWidth={10} opacity={progress} /> : <line x1={x(model.threshold)} x2={x(Math.max(...intersections.map(point => point[0])))} y1={y(at)} y2={y(at)} stroke={PALETTE.green} strokeWidth={10} opacity={progress} />)}
    </Mark>}
    {question === 'sum-event' && <Mark clipPath={`url(#${clip})`}><path d={`M${x(0)} ${y(model.b)}L${x(model.b)} ${y(0)}L${x(0)} ${y(0)}Z`} fill={PALETTE.green} opacity={0.2+progress*0.2} /></Mark>}
    {model.cutSlope && <Mark><path d={`M${x(0)},${y(0)}L${x(maximumX)},${y(maximumX*model.cutSlope)}`} stroke={PALETTE.coral} strokeWidth={3} strokeDasharray="8 5" /></Mark>}
    <SvgText text={number(maximumX)} x={x(maximumX)} y={405} fontSize={22} />
    <SvgText text={number(maximumY)} x={55} y={y(maximumY)} fontSize={22} />
  </svg>;
}

function CombinatorialGroups({plan,state}) {
  const {model,questionId:question} = plan.data;
  const progress = phase(plan,state);
  const repeated = question === 'repeated-labels';
  const all = question === 'all-ordered';
  const count = repeated ? sum(model.multiplicities) : model.n;
  const selected = all || repeated ? count : model.r;
  const selectedIndex = Math.floor(progress*Math.max(1,count-selected+1));
  return <svg width="780" height="480">
    <SvgText text={question === 'unordered' ? 'Un grupo, varias ordenaciones' : question === 'with-repetition' ? 'Las opciones vuelven a estar disponibles' : 'Decisiones sucesivas'} x={40} y={45} width={700} />
    {Array.from({length:count},(_,index) => {
      const category = repeated ? model.multiplicities.findIndex((_,categoryIndex) => index < sum(model.multiplicities.slice(0,categoryIndex+1))) : index;
      const chosen = index >= selectedIndex && index < selectedIndex+selected;
      const slot = index-selectedIndex;
      return <Mark key={index}>
        <circle cx={65+index*650/count} cy={120} r={Math.min(24,240/count)} fill={COLORS[category%4]} opacity={chosen ? 1 : 0.25} />
        <SvgText text={repeated ? String.fromCharCode(65+category) : String(index+1)} x={65+index*650/count} y={127} fontSize={20} anchor="middle" fill={PALETTE.paper} />
        {chosen && <g>
          <path d={`M${65+index*650/count} 150Q${65+index*650/count} 240 ${95+slot*570/selected} 310`} fill="none" stroke={COLORS[category%4]} strokeWidth={2} opacity={0.5} />
          <circle cx={mix(65+index*650/count,95+slot*570/selected,progress)} cy={mix(150,310,progress)} r={10} fill={COLORS[category%4]} />
        </g>}
      </Mark>;
    })}
    {Array.from({length:selected},(_,index) => <Mark key={index}>
      <rect x={70+index*570/selected} y={300} width={Math.min(70,490/selected)} height={65} fill="none" stroke={PALETTE.ink} strokeWidth={2} />
      {question !== 'unordered' && <SvgText text={String(index+1)} x={95+index*570/selected} y={405} anchor="middle" fontSize={20} />}
    </Mark>)}
  </svg>;
}

function LabelledSelection({plan,state}) {
  const selectedFirst = plan.data.model.selectedFirst;
  const progress = phase(plan,state);
  const solving = plan.data.sceneIndex > plan.data.source.findIndex(step => step.title === 'Elegir el camino');
  return <svg width="780" height="480">
    <SvgText text={selectedFirst ? 'Selección previa: se conserva S' : 'Aviso existencial: cualquiera de los dos'} x={35} y={35} width={700} fontSize={22} />
    {Array.from({length:selectedFirst ? 200 : 100},(_,index) => {
      const first = Math.floor((index%100)/10);
      const second = index%10;
      const selected = Math.floor(index/100);
      const observed = selectedFirst ? (selected === 0 ? first === 5 : second === 5) : first === 5 || second === 5;
      const both = first >= 5 && second >= 5;
      const left = 90+second*27+(selectedFirst ? selected*310 : 130);
      const top = 80+first*30;
      return <Mark key={index}>
        <rect x={left} y={top} width={23} height={25} fill={observed && solving ? both ? PALETTE.green : PALETTE.gold : PALETTE.blue} fillOpacity={solving ? observed ? 0.9 : mix(0.3,0.06,progress) : 0.3} stroke={PALETTE.ink} strokeWidth={3} />
        {first === Math.floor(progress*10)%10 && <rect x={left} y={top} width={23} height={25} fill="none" stroke={PALETTE.coral} />}
      </Mark>;
    })}
    {selectedFirst ? <g><SvgText text="S = 1" x={220} y={425} anchor="middle" width={270} fontSize={22} /><SvgText text="S = 2" x={530} y={425} anchor="middle" width={270} fontSize={22} /></g> : <SvgText text="10 estados × 10 estados" x={390} y={425} anchor="middle" width={680} fontSize={22} />}
  </svg>;
}

function Transformation({plan,state}) {
  const {model} = plan.data;
  const values = model.values;
  const progress = phase(plan,state);
  const maximum = Math.max(...values.map(value => value**2),1);
  return <svg width="780" height="480">
    <SvgText text="Transformar cada valor, conservar su probabilidad" x={40} y={40} width={690} fontSize={23} />
    {values.map((value,index) => {
      const left = 100+index*480/Math.max(1,values.length-1);
      return <Mark key={index}>
        <circle cx={left} cy={110} r={26} fill={COLORS[index%4]} />
        <SvgText text={number(value)} x={left} y={118} anchor="middle" fill={PALETTE.paper} />
        <path d={`M${left},150V260`} stroke={COLORS[index%4]} strokeWidth={2} strokeDasharray="6 5" />
        <circle cx={left} cy={mix(155,260,progress)} r={8} fill={COLORS[index%4]} />
        <rect x={left-35} y={390-150*value**2/maximum} width={70} height={150*value**2/maximum} fill={COLORS[index%4]} opacity={0.6} />
        <SvgText text={`${number(value)}²`} x={left} y={425} anchor="middle" fontSize={22} />
      </Mark>;
    })}
  </svg>;
}

function ArithmeticMechanism({plan,state}) {
  const {model} = plan.data;
  const progress = phase(plan,state);
  if (plan.family === 'proportions' && plan.data.questionId === 'micrograms') return <svg width="780" height="480">
    <SvgText text="La misma cantidad de nutriente" x={45} y={45} width={700} />
    {Array.from({length:model.milligrams},(_,block) => <Mark key={block}>
      <rect x={70+block*200} y={110} width={160} height={240} fill={COLORS[block%4]} opacity={mix(0.8,0.12,progress)} />
      {Array.from({length:1000},(_,index) => <rect key={index} x={70+block*200+(index%25)*6.4} y={110+Math.floor(index/25)*6} width={5} height={5} fill={COLORS[block%4]} opacity={progress} />)}
      <SvgText text="1 mg = 1000 µg" x={150+block*200} y={400} width={190} fontSize={20} anchor="middle" />
    </Mark>)}
  </svg>;
  if (plan.family === 'function-values') {
    const input = model.input;
    return <svg width="780" height="480">
      <SvgText text="Entrada" x={75} y={80} /><SvgText text="Salida" x={640} y={80} />
      <Mark><circle cx={mix(100,650,progress)} cy={230} r={30} fill={PALETTE.green} /></Mark>
      <path d="M130 230H280M480 230H620" stroke={PALETTE.ink} strokeWidth={3} />
      <rect data-native-bound x={280} y={140} width={200} height={180} fill={PALETTE.soft} stroke={PALETTE.green} />
      <SvgText text={`× ${model.factor}`} x={380} y={200} anchor="middle" />
      <SvgText text={`+ ${model.base}`} x={380} y={260} anchor="middle" />
      <SvgText text={String(input)} x={100} y={370} anchor="middle" />
      {numeric(plan,state) && <SvgText text={`${model.factor} × ${input} + ${model.base}`} x={610} y={370} width={240} anchor="middle" fontSize={22} />}
    </svg>;
  }
  const weights = model.weights || [model.part,model.total-model.part];
  const total = sum(weights);
  let offset = 0;
  return <svg width="780" height="480">
    <SvgText text={plan.family === 'normalization' ? 'La misma escala para cada peso' : 'La parte pertenece al total'} x={45} y={45} width={690} />
    {weights.map((value,index) => {
      const left = offset; offset += value/total;
      return <Mark key={index}>
        <rect x={60+650*left} y={120} width={650*value/total-3} height={110} fill={COLORS[index%4]} opacity={0.8} />
        <rect x={60+650*left} y={310} width={650*value/total-3} height={mix(110,55,progress)} fill={COLORS[index%4]} opacity={0.4} />
        {numeric(plan,state) && <SvgText text={String(value)} x={60+650*(left+value/total/2)} y={180} anchor="middle" fill={PALETTE.paper} />}
      </Mark>;
    })}
    <SvgText text={plan.family === 'normalization' ? 'c × (suma de pesos) = 1' : plan.data.questionId === 'micrograms' ? `${model.milligrams} mg × 1000 µg/mg` : 'parte / total'} x={385} y={435} anchor="middle" width={700} />
  </svg>;
}

function Likelihood({plan,state}) {
  const {model} = plan.data;
  const progress = phase(plan,state);
  const total = sum(model.values);
  const estimate = total/model.values.length;
  const maximum = Math.max(model.candidate*1.5,estimate*3);
  const log = value => total*Math.log(value)-model.values.length*value;
  const peak = log(estimate);
  const path = Array.from({length:150},(_,index) => {
    const value = maximum*(index+1)/150;
    return `${index ? 'L' : 'M'}${65+650*value/maximum},${365-250*Math.exp(log(value)-peak)}`;
  }).join('');
  const candidate = mix(maximum*0.02,maximum,progress);
  return <svg width="780" height="480">
    <Axes yLabel="L(λ) / máx L" xLabel="λ" />
    <path data-native-bound d={path} fill="none" stroke={PALETTE.green} strokeWidth={4} />
    <Mark><line x1={65+650*candidate/maximum} x2={65+650*candidate/maximum} y1={365} y2={365-250*Math.exp(log(candidate)-peak)} stroke={PALETTE.coral} strokeWidth={3} />
      <circle cx={65+650*candidate/maximum} cy={365-250*Math.exp(log(candidate)-peak)} r={8} fill={PALETTE.coral} />
    </Mark>
    {model.values.map((value,index) => <Mark key={index}><circle cx={110+index*115} cy={435} r={20} fill={COLORS[index%4]} /><SvgText text={String(value)} x={110+index*115} y={442} fontSize={20} anchor="middle" fill={PALETTE.paper} /></Mark>)}
  </svg>;
}

function CovarianceGeometry({plan,state}) {
  const {model,context} = plan.data;
  const progress = phase(plan,state);
  if (model.valuesX || context?.kind === 'matrix' && context.rows.every(value => Number.isFinite(Number(value))) && context.columns.every(value => Number.isFinite(Number(value)))) {
    const valuesX = model.valuesX || context.rows.map(Number);
    const valuesY = model.valuesY || context.columns.map(Number);
    const probabilities = model.probabilities || context.values;
    const meanX = sum(valuesX.map((value,index) => value*sum(probabilities[index])));
    const meanY = sum(valuesY.map((value,index) => value*sum(probabilities.map(row => row[index]))));
    const extentX = Math.max(...valuesX)-Math.min(...valuesX) || 1;
    const extentY = Math.max(...valuesY)-Math.min(...valuesY) || 1;
    const x = value => 110+500*(value-Math.min(...valuesX))/extentX;
    const y = value => 350-250*(value-Math.min(...valuesY))/extentY;
    return <svg width="780" height="480">
      <SvgText text="Desviaciones respecto a cada media" x={40} y={40} width={700} />
      <path d={`M${x(meanX)} 70V385M70 ${y(meanY)}H690`} stroke={PALETTE.muted} strokeWidth={2} />
      {probabilities.flatMap((row,rowIndex) => row.map((probability,columnIndex) => {
        const first = valuesX[rowIndex];
        const second = valuesY[columnIndex];
        const positive = (first-meanX)*(second-meanY) >= 0;
        return <Mark key={`${rowIndex}-${columnIndex}`}>
          <rect x={Math.min(x(first),x(meanX))} y={Math.min(y(second),y(meanY))} width={Math.abs(x(first)-x(meanX))*progress} height={Math.abs(y(second)-y(meanY))} fill={positive ? PALETTE.green : PALETTE.coral} opacity={probability*0.8} />
          <circle cx={x(first)} cy={y(second)} r={Math.sqrt(probability)*28} fill={positive ? PALETTE.green : PALETTE.coral} />
        </Mark>;
      }))}
      <SvgText text="(x − E[X])(y − E[Y]), ponderado por p(x,y)" x={380} y={440} anchor="middle" width={700} fontSize={22} />
    </svg>;
  }
  if (plan.family === 'covariance') {
    const bound = model.sdX*model.sdY;
    const coordinate = value => 360+180*value/bound;
    const impossible = plan.data.questionId === 'impossible-rho';
    const target = impossible ? model.proposed : bound;
    return <svg width="780" height="480">
      <SvgText text="Cota de covarianza, sin suponer normalidad" x={35} y={45} width={700} fontSize={23} />
      <rect x={180} y={180} width={360} height={90} fill={PALETTE.soft} />
      <path d="M80 225H740M180 170V280M540 170V280" stroke={PALETTE.ink} strokeWidth={2} />
      <Mark><circle cx={coordinate(mix(0,target,progress))} cy={225} r={13} fill={impossible ? PALETTE.coral : PALETTE.green} /></Mark>
      <SvgText text="−σX σY" x={180} y={320} anchor="middle" /><SvgText text="σX σY" x={540} y={320} anchor="middle" />
      {numeric(plan,state) && <SvgText text={`σX σY = ${number(bound)}`} x={390} y={410} anchor="middle" />}
    </svg>;
  }
  const conditional = plan.family === 'bivariate-normal';
  const {sdX,sdY,rho,meanX,meanY} = model;
  const difference = plan.family === 'gaussian-difference' && plan.data.questionId === 'b';
  const residual = plan.family === 'gaussian-difference' && ['c','c-reason'].includes(plan.data.questionId);
  const coefficient = difference ? progress : residual ? rho*sdY/sdX*progress : 0;
  const transformedMeanY = meanY-coefficient*meanX;
  const transformedSdY = Math.sqrt(sdY**2+coefficient**2*sdX**2-2*coefficient*rho*sdX*sdY);
  const x = value => 90+570*(value-meanX+3*sdX)/(6*sdX);
  const y = value => 365-280*(value-transformedMeanY+3*transformedSdY)/(6*transformedSdY);
  const conditionalMean = meanY+rho*sdY/sdX*(model.x-meanX);
  const conditionalSd = sdY*Math.sqrt(1-rho*rho);
  return <svg width="780" height="480">
    <Axes x={90} width={570} yLabel={conditional ? 'Y | X=x' : difference ? 'D = Y − X' : residual ? 'V = Y − aX' : 'Y'} xLabel="X" />
    {[1,2,3].map(scale => <Mark key={scale}><path d={Array.from({length:121},(_,index) => {
      const angle = 2*Math.PI*index/120;
      const first = meanX+scale*sdX*Math.cos(angle);
      const second = meanY+scale*sdY*(rho*Math.cos(angle)+Math.sqrt(1-rho*rho)*Math.sin(angle));
      return `${index ? 'L' : 'M'}${x(first)},${y(second-coefficient*first)}`;
    }).join('')} fill="none" stroke={PALETTE.blue} strokeWidth={2} opacity={0.8/scale} /></Mark>)}
    {conditional && <g>
      <line data-native-bound x1={x(model.x)} x2={x(model.x)} y1={80} y2={365} stroke={PALETTE.coral} strokeWidth={2} />
      {Array.from({length:81},(_,index) => {
        const standardized = -3+6*index/80;
        const value = conditionalMean+standardized*conditionalSd;
        return <Mark key={index}><line x1={x(model.x)} x2={x(model.x)+65*Math.exp(-(standardized**2)/2)} y1={y(value)} y2={y(value)} stroke={value > model.threshold ? PALETTE.green : PALETTE.gold} strokeWidth={3} opacity={index/80 <= progress ? 0.8 : 0.12} /></Mark>;
      })}
    </g>}
    {numeric(plan,state) && <SvgText text={`μX=${model.meanX}; μY=${model.meanY}; σX=${number(sdX)}; σY=${number(sdY)}`} x={385} y={435} width={700} anchor="middle" fontSize={20} />}
  </svg>;
}

function MultinomialAllocation({plan,state}) {
  const {model} = plan.data;
  const progress = phase(plan,state);
  let start = 0;
  const counts = model.counts;
  return <svg width="780" height="480">
    <SvgText text="Un total fijo, categorías excluyentes" x={40} y={45} width={700} />
    {counts.map((count,category) => {
      const first = start; start += count;
      return <Mark key={category}>
        <rect x={60+category*230} y={210} width={200} height={175} fill={COLORS[category]} opacity={0.1} />
        <SvgText text={String.fromCharCode(65+category)} x={160+category*230} y={425} anchor="middle" fill={COLORS[category]} />
        {Array.from({length:count},(_,local) => <circle key={local} cx={mix(85+(first+local)*600/model.n,85+category*230+(local%5)*30,progress)} cy={mix(110,250+Math.floor(local/5)*35,progress)} r={12} fill={COLORS[category]} />)}
        {numeric(plan,state) && <SvgText text={`p=${number(model.probabilities[category])}`} x={160+category*230} y={180} fontSize={20} anchor="middle" />}
      </Mark>;
    })}
  </svg>;
}

function Geometry({plan,state}) {
  const family = plan.family;
  if (['events','event-independence'].includes(family)) return <SetAllocation plan={plan} state={state} />;
  if (family === 'bayes') return <ProbabilityTree plan={plan} state={state} />;
  if (family === 'conditional') return <ConditionalPopulation plan={plan} state={state} />;
  if (family === 'selection') return <LabelledSelection plan={plan} state={state} />;
  if (family === 'combinatorics') return <CombinatorialGroups plan={plan} state={state} />;
  if (['plane-regions','continuous-joint'].includes(family)) return <RegionSlice plan={plan} state={state} />;
  if (['joint','joint-basic','independence'].includes(family)) return <JointTable plan={plan} state={state} />;
  if (['covariance','gaussian-difference','bivariate-normal'].includes(family)) return <CovarianceGeometry plan={plan} state={state} />;
  if (family === 'multinomial') return <MultinomialAllocation plan={plan} state={state} />;
  if (family === 'transform') return <Transformation plan={plan} state={state} />;
  if (['normalization','proportions','function-values'].includes(family)) return <ArithmeticMechanism plan={plan} state={state} />;
  if (family === 'exponential-family') return <Likelihood plan={plan} state={state} />;
  if (plan.data.mass) return <CountDistribution plan={plan} state={state} />;
  if (plan.data.density) return <DensityArea plan={plan} state={state} />;
  throw new RangeError(`${plan.family}: no native mathematical geometry`);
}

export function ExerciseScene({plan,state}) {
  if (!plan?.data || !Number.isInteger(state?.cueIndex)) throw new TypeError('ExerciseScene requires one native scene and its cue state');
  const layout = layoutExerciseExplanation(plan.sourceLines,state.cueIndex);
  const cuePhase = state.cueIndex >= 0 ? plan.data.phases?.[state.cueIndex] : null;
  const diagram = state.cueIndex >= 0 ? cuePhase?.context || plan.data.context : null;
  if (!diagram && (state.cueIndex < 0 || !numeric(plan,state))) return <SceneSurface label={`exercise:${plan.family}`}>
    <div data-native-zone="exercise-explanation" style={{position:'absolute',left:65,top:40,width:1080,height:390,display:'flex',flexDirection:'column',gap:layout.gap,color:PALETTE.ink}}>
      {layout.lines.map((line,index) => line.tex ? <div key={index} data-native-mark data-native-bound style={{position:'relative',height:layout.lines.length === 1 ? 300 : layout.mathHeight,flexShrink:0}}>
        <MathFormula tex={line.tex} x={0} y={0} width={1080} height={layout.lines.length === 1 ? 300 : layout.mathHeight} fontSize={layout.lines.length === 1 ? 64 : 42} />
      </div> : <div key={index} data-native-mark data-native-text data-native-bound style={{fontSize:layout.lines.length === 1 && (line.value || line.label || '').length < 80 ? 32 : 28,lineHeight:1.35,overflowWrap:'anywhere',flexShrink:0}}>{line.value || line.label || ''}</div>)}
    </div>
  </SceneSurface>;
  return <SceneSurface label={`exercise:${plan.family}`}>
    {diagram ? <SourceDiagram diagram={diagram} phase={cuePhase} /> : <Geometry plan={plan} state={state} />}
    <div style={{position:'absolute',left:785,top:15,width:1,height:445,background:PALETTE.line}} />
    <div data-native-zone="exercise-explanation" data-native-bound style={{position:'absolute',left:805,top:20,width:layout.width,height:layout.height,display:'flex',flexDirection:'column',gap:layout.gap,color:PALETTE.ink}}>
    {layout.lines.map((line,index) => {
      const text = line.value || line.label || '';
      const opacity = line.cue === state.cueIndex ? mix(0.35,1,state.progress) : 1;
      if (line.tex) return <div key={index} style={{position:'relative',height:layout.mathHeight,flexShrink:0}}>
        <MathFormula tex={line.tex} x={0} y={0} width={layout.width} height={layout.mathHeight} fontSize={26} opacity={opacity} />
      </div>;
      return <div key={index} data-native-text data-native-bound style={{fontFamily:'Atkinson',fontSize:layout.fontSize,lineHeight:1.35,overflowWrap:'anywhere',flexShrink:0,opacity}}>{text}</div>;
    })}
    </div>
  </SceneSurface>;
}