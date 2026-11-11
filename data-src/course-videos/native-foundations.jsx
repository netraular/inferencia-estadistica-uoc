import React from 'react';
import {PALETTE, ease, mix, SceneSurface, MathFormula, SvgText} from './native-primitives.jsx';

const colors = [PALETTE.green, PALETTE.coral, PALETTE.blue, PALETTE.gold];
const plain = value => String(value || '').replace(/\{,\}/g, '.').replace(/(\d),(\d)/g, '$1.$2');
const numbers = value => (plain(value).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const label = (text, x, y, width = 300, extra = {}) => <SvgText text={text} x={x} y={y} width={width} fontSize={21} {...extra}/>;
const bound = {'data-native-bound':true};
const mark = name => ({...bound, 'data-native-mark':name});

function Arrow({from, to, color = PALETTE.green, progress = 1, width = 5}) {
  const end = [mix(from[0], to[0], progress), mix(from[1], to[1], progress)];
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  return <g {...mark('route')}><line x1={from[0]} y1={from[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={width}/><path d={`M${end[0]-13*Math.cos(angle-.45)},${end[1]-13*Math.sin(angle-.45)} L${end[0]},${end[1]} L${end[0]-13*Math.cos(angle+.45)},${end[1]-13*Math.sin(angle+.45)}`} fill="none" stroke={color} strokeWidth={width}/></g>;
}

function SourceNotes({lines, cueIndex, progress}) {
  const formulas = lines.filter(line => line.tex).slice(-2);
  const descriptions = lines.filter(line => !line.tex && line.value && !line.bar && !line.plot).slice(-1);
  const top = formulas.length ? 190+(formulas.length-1)*125 : 80;
  return <>
    {formulas.map((line, index) => <MathFormula key={`${line.cue}-${line.tex}`} tex={line.tex} x={820} y={90+index*125} width={350} fontSize={line.tex.length > 95 ? 17 : line.tex.length > 55 ? 21 : 29} opacity={line.cue === cueIndex ? .25+.75*ease(progress) : 1}/>)}
    {descriptions.map(line => {
      const words = line.value.split(/\s+/u);
      let fontSize = 18;
      while (fontSize > 1) {
        const limit = Math.max(4,Math.floor(256/(fontSize*.56)));
        let rows = 1, length = 0;
        for (const word of words) {
          if (length && length+1+word.length > limit) {rows++; length=word.length;}
          else length += (length ? 1 : 0)+word.length;
        }
        if (rows*fontSize*1.25 <= 464-top && words.every(word=>word.length*fontSize*.7<=320)) break;
        fontSize -= .5;
      }
      return <svg key={`${line.cue}-${line.value}`} width="1200" height="480" style={{position:'absolute',inset:0,pointerEvents:'none'}}>{label(line.value,835,top+fontSize,256,{fontSize})}</svg>;
    })}
  </>;
}

function Tray({part, total, x, y, width, height, progress, title}) {
  if (!(total > 0) || part < 0 || part > total) throw new RangeError('Invalid native population');
  const count = Number.isInteger(total) && total <= 1000 ? total : 0;
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * width / height)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const cell = Math.min(width/columns, height/rows);
  const inspected = Math.min(count-1,Math.floor(progress*Math.max(1,part || total)));
  return <g {...mark('population')}>
    <rect {...bound} x={x-8} y={y-10} width={width+16} height={height+20} rx={5} fill={PALETTE.soft} stroke={PALETTE.line}/>
    {count ? Array.from({length:count}, (_, index) => <ellipse key={index} cx={x+(index%columns+.5)*width/columns} cy={y+(Math.floor(index/columns)+.5)*height/rows} rx={Math.max(1,cell*.3)} ry={Math.max(1,cell*.4)} fill={index < part ? PALETTE.green : PALETTE.line} opacity={index < part ? .4+.6*progress : .9} transform={index < part ? `translate(0 ${-5*Math.sin(Math.PI*progress)})` : undefined}/>) : <><rect x={x} y={y} width={width} height={height} fill={PALETTE.line}/><rect x={x} y={y} width={width*part/total*progress} height={height} fill={PALETTE.green}/></>}
    {count > 0 && <ellipse {...mark('inspected-member')} cx={x+(inspected%columns+.5)*width/columns} cy={y+(Math.floor(inspected/columns)+.5)*height/rows} rx={cell*.45} ry={cell*.48} fill="none" stroke={PALETTE.coral} strokeWidth={2}/>}
    {label(`${part} / ${total}`,x,y+height+40,width,{fontSize:25})}
    {title && label(title,x,y-28,width,{fontSize:20})}
  </g>;
}

const eventProgress = (cueIndex, progress, anchor) => anchor === undefined || cueIndex < anchor ? 0 : cueIndex === anchor ? progress : 1;
const decimal = value => String(Number(value.toFixed(6))).replace('.', '{,}');

function Seed({x, y, scale, germinated, selected, opacity}) {
  return <g {...mark(germinated ? 'germinated-seed' : 'dormant-seed')} transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <ellipse cx={0} cy={2} rx={4} ry={5.5} fill={germinated ? PALETTE.gold : PALETTE.line} stroke={germinated ? PALETTE.green : PALETTE.muted} strokeWidth={.8}/>
    {germinated && <><path d="M0 1C-2 -3 2 -7 0 -12" fill="none" stroke={PALETTE.green} strokeWidth={1.8}/><path d="M0 -7C-8 -15 -10 -5 0 -5C8 -15 10 -7 0 -7Z" fill={PALETTE.green}/></>}
    {selected > 0 && <ellipse cx={0} cy={-3} rx={9} ry={13} fill="none" stroke={PALETTE.coral} strokeWidth={1.8} opacity={selected}/>}
  </g>;
}

function SeedComparison({seed, cueIndex, progress}) {
  const {events, trays, groups} = seed;
  const arrival = eventProgress(cueIndex, progress, events.parts);
  const grouped = seed.regroup ? eventProgress(cueIndex, progress, events.quarter) : 0;
  const currentEvents = Object.entries(events).filter(([,anchor]) => anchor === cueIndex).map(([name]) => name);
  return <g {...mark('authored-seed-comparison')} data-native-events={currentEvents.join(' ')}>
    {trays.map((tray, trayIndex) => {
      const x = 56+trayIndex*374, y = 122, width = 300, height = 190;
      const knownPart = cueIndex >= events.parts;
      const knownTotal = cueIndex >= tray.totalCue;
      const totalProgress = eventProgress(cueIndex, progress, tray.totalCue);
      const columns = Math.ceil(Math.sqrt(tray.total*width/height));
      const rows = Math.ceil(tray.total/columns);
      const partColumns = Math.ceil(Math.sqrt(tray.part*width/height));
      const partRows = Math.ceil(tray.part/partColumns);
      const groupColumns = Math.ceil(Math.sqrt(tray.part*1.6));
      const groupRows = Math.ceil(tray.part/groupColumns);
      const groupWidth = width/2, groupHeight = height/Math.ceil(groups/2);
      const focus = eventProgress(cueIndex, progress, events.highlight ?? events.firstTotal);
      const asking = currentEvents.some(name => ['question','unknown','containment','reference','observation'].includes(name));
      return <g key={trayIndex} {...mark(`seed-tray-${trayIndex+1}`)} data-native-part={knownPart ? tray.part : undefined} data-native-total={knownTotal ? tray.total : undefined}>
        {label(tray.title,x-4,48,325,{fontSize:21})}
        {knownPart && label(`${tray.part} germinadas`,x-4,82,325,{fontSize:24,opacity:arrival})}
        <rect {...bound} x={x-10} y={101} width={width+20} height={240} rx={5} fill={PALETTE.soft} stroke={trayIndex ? PALETTE.coral : PALETTE.green} strokeWidth={2}/>
        {asking && <rect {...mark('reference-total-focus')} x={x-15} y={96} width={width+30} height={250} rx={7} fill="none" stroke={PALETTE.gold} strokeWidth={3} pathLength={1} strokeDasharray={`${.1+.9*progress} 1`}/>}
        {trayIndex === 0 && grouped > 0 && Array.from({length:groups},(_,index) => <g key={index} {...mark('equal-seed-group')} data-native-group-size={tray.part} opacity={grouped}>
          <rect x={x+index%2*groupWidth} y={y+Math.floor(index/2)*groupHeight-5} width={groupWidth-8} height={groupHeight-1} rx={3} fill="none" stroke={index ? PALETTE.muted : PALETTE.green} strokeWidth={index ? 1 : 3}/>
          {label(String(tray.part),x+index%2*groupWidth+groupWidth-30,y+Math.floor(index/2)*groupHeight+groupHeight-10,30,{fontSize:13})}
        </g>)}
        {knownPart && Array.from({length:knownTotal ? tray.total : tray.part},(_,index) => {
          const germinated = index < tray.part;
          const startX = x+(index%partColumns+.5)*width/partColumns;
          const startY = y+(Math.floor(index/partColumns)+.5)*height/partRows;
          const totalX = x+(index%columns+.5)*width/columns;
          const totalY = y+(Math.floor(index/columns)+.5)*height/rows;
          const groupIndex = Math.floor(index/tray.part), member = index%tray.part;
          const groupX = x+groupIndex%2*groupWidth+(member%groupColumns+.5)*(groupWidth-10)/groupColumns;
          const groupY = y+Math.floor(groupIndex/2)*groupHeight+(Math.floor(member/groupColumns)+.5)*(groupHeight-20)/groupRows;
          const regroup = trayIndex === 0 ? grouped : 0;
          const scale = Math.min(1.05,Math.min(width/columns,height/rows)/24);
          const selected = trayIndex === 0 && germinated && cueIndex >= (events.highlight ?? events.firstTotal) ? focus : 0;
          return <Seed key={index} x={mix(germinated ? mix(startX,totalX,totalProgress) : totalX,groupX,regroup)}
            y={mix(germinated ? mix(startY,totalY,totalProgress)-12*(1-arrival) : totalY,groupY,regroup)}
            scale={germinated ? mix(1.05,scale,totalProgress) : scale} germinated={germinated} selected={selected}
            opacity={germinated ? arrival : totalProgress}/>;
        })}
        {knownPart && label(knownTotal ? `Total: ${tray.total}` : 'Total: ?',x-4,373,325,{fontSize:23})}
        {trayIndex === 0 && cueIndex >= events.quarter && label(`1 / ${groups}`,x+215,373,100,{fontSize:23,opacity:eventProgress(cueIndex,progress,events.quarter)})}
      </g>;
    })}
    {cueIndex >= events.compare && <g {...mark('normalised-seed-comparison')}>
      {trays.map((tray,index) => <g key={index} data-native-ratio={tray.part/tray.total}>
        <rect {...bound} x={70} y={401+index*39} width={625} height={18} fill={PALETTE.soft} stroke={PALETTE.line}/>
        <rect {...mark('observed-proportion')} x={70} y={401+index*39} width={625*tray.part/tray.total} height={18} fill={index ? PALETTE.coral : PALETTE.green}/>
        <rect x={70} y={401+index*39} width={625*tray.part/tray.total*eventProgress(cueIndex,progress,events.compare)} height={18} fill={PALETTE.gold} opacity={.35}/>
        {label(String(tray.part/tray.total),710,418+index*39,85,{fontSize:20})}
      </g>)}
    </g>}
  </g>;
}

function SeedNotes({seed, cueIndex, progress}) {
  const {events, trays, groups} = seed;
  const first = trays[0], second = trays[1];
  let firstTex = `p_1=\\frac{${first.part}}{${first.total}}`;
  if (cueIndex >= events.quarter) firstTex += `=\\frac{1}{${groups}}=${decimal(first.part/first.total)}`;
  if (events.percent !== undefined && cueIndex >= events.percent) firstTex += `=${first.part/first.total*100}\\%`;
  const secondTex = `p_2=\\frac{${second.part}}{${second.total}}=${decimal(second.part/second.total)}${events.percent === undefined ? '' : `=${second.part/second.total*100}\\%`}`;
  const noteOpacity = anchor => .25+.75*eventProgress(cueIndex,progress,anchor);
  return <>
    {events.definition !== undefined && cueIndex >= events.definition && cueIndex < events.firstFraction && <MathFormula tex="p=\\frac{\\text{parte}}{\\text{total}}" x={820} y={95} width={350} fontSize={29} opacity={noteOpacity(events.definition)}/>}
    {cueIndex >= events.firstFraction && <MathFormula tex={firstTex} x={820} y={95} width={350} fontSize={firstTex.length > 45 ? 23 : 29} opacity={noteOpacity(cueIndex >= events.quarter ? events.quarter : events.firstFraction)}/>}
    {cueIndex >= events.secondFraction && <MathFormula tex={secondTex} x={820} y={225} width={350} fontSize={25} opacity={noteOpacity(events.secondFraction)}/>}
    {cueIndex >= events.compare && <MathFormula tex={`${decimal(first.part/first.total)}>${decimal(second.part/second.total)}`} x={820} y={350} width={350} fontSize={30} opacity={noteOpacity(events.compare)}/>}
    {cueIndex >= events.observation && <svg width="1200" height="480" style={{position:'absolute',inset:0,pointerEvents:'none'}}>{label('Observaciones de estos ensayos',835,462,325,{fontSize:16,opacity:noteOpacity(events.observation)})}</svg>}
  </>;
}

function Quantity({lines, progress, mode, cueIndex}) {
  const bars = lines.filter(line => line.bar).slice(-2);
  if (bars.length) return <>{bars.map((line,index) => <Tray key={`${line.cue}-${index}`} {...line.bar} title={line.label} x={45+index*375} y={115} width={320} height={245} progress={progress}/>)}</>;
  if (mode === 'unit-conversion') {
    const equation = lines.find(line => line.tex && /1000=3000/.test(line.tex));
    const conversion = lines.find(line => /mg.*10\^3/.test(line.tex || ''));
    return <g {...mark('unit-rescaling')}>
      {Array.from({length:equation ? 3 : 1},(_,group) => <g key={group} transform={`translate(${65+group*230} 95)`}><rect width={170} height={220} fill={PALETTE.green} opacity={.12}/>{Array.from({length:conversion ? 1000 : 1},(_,index) => <rect key={index} x={conversion ? index%25*6.6 : 0} y={conversion ? Math.floor(index/25)*5.4 : 0} width={conversion ? mix(6.6,4.7,progress) : 170} height={conversion ? 4.1 : 220} fill={PALETTE.green}/>)}</g>)}
      <Arrow from={[95,365]} to={[690,365]} progress={progress}/>
    </g>;
  }
  const conversion = lines.find(line => /100\\cdot/.test(line.tex || ''));
  const amount = conversion ? numbers(conversion.tex)[1] : null;
  return <g {...mark('quantity-scale')}>
    <rect {...bound} x={65} y={140} width={650} height={150} fill={PALETTE.soft} stroke={PALETTE.green} strokeWidth={3}/>
    {Array.from({length:100},(_,index) => <rect key={index} x={70+index%20*32} y={145+Math.floor(index/20)*28} width={26} height={22} fill={amount !== null && index < amount*100 ? PALETTE.green : PALETTE.line} opacity={.5+.5*progress}/>)}
    <Arrow from={[80,350]} to={[700,350]} progress={progress}/>
  </g>;
}

function Balance({lines, progress, mode}) {
  const bar = lines.filter(line=>line.bar).at(-1);
  if (bar) return <><Tray {...bar.bar} title={bar.label} x={80} y={105} width={600} height={250} progress={progress}/><Arrow from={[100,425]} to={[700,425]} progress={progress}/></>;
  if (mode === 'inverse-exponential' && lines.some(line => /e\^\{?-t\//.test(line.tex || ''))) {
    const expression = lines.find(line => /e\^\{?-t\//.test(line.tex || ''));
    const scale = expression ? Number(expression.tex.match(/-t\/(\d+)/)?.[1]) : null;
    const points = scale ? Array.from({length:81},(_,index) => [70+index*8,350-250*Math.exp(-index*scale/40/scale)]) : [];
    return <g {...mark('inverse-function')}><path d="M65 70V355H745" fill="none" stroke={PALETTE.muted} strokeWidth={2}/>{points.length > 0 && <><polyline points={points.map(point=>point.join(',')).join(' ')} fill="none" stroke={PALETTE.green} strokeWidth={5}/><line x1={70} y1={225} x2={710} y2={225} stroke={PALETTE.coral} strokeDasharray="8 7"/><circle cx={70+640*progress} cy={350-250*Math.exp(-2*progress)} r={10} fill={PALETTE.coral}/></>}<Arrow from={[380,400]} to={[120+500*(1-progress),400]} progress={progress}/></g>;
  }
  const weightsLine = lines.find(line => /pesos/i.test(`${line.label || ''} ${line.value || ''}`));
  const weights = weightsLine ? numbers(weightsLine.value) : [];
  const total = weights.reduce((sum,value)=>sum+value,0);
  const knownFactor = lines.some(line => /c=/.test(line.tex || ''));
  const tilt = Math.sin(progress*Math.PI)*5;
  return <g {...mark('balanced-equation')}>
    <path d="M420 245L370 365H470Z" fill={PALETTE.muted}/>
    <g transform={`rotate(${tilt} 420 245)`}><line x1={90} y1={220} x2={750} y2={220} stroke={PALETTE.ink} strokeWidth={8}/>
      {[170,665].map(center => <g key={center}><path d={`M${center} 220L${center-110} 290H${center+110}Z`} fill="none" stroke={PALETTE.muted} strokeWidth={3}/><line x1={center-110} y1={290} x2={center+110} y2={290} stroke={PALETTE.green} strokeWidth={8}/></g>)}
      {(weights.length ? weights : [null]).map((weight,index) => <g key={index}><rect {...bound} x={90+index*65} y={290-(weight === null ? 80 : weight/total*170)} width={55} height={weight === null ? 80 : weight/total*170} fill={colors[index%4]}/>{weight !== null && label(`${weight}${knownFactor ? 'c' : ''}`,100+index*65,270-(weight/total*170),70)}</g>)}
      <rect x={625} y={210} width={80} height={80} fill={PALETTE.gold}/>
    </g>
    <Arrow from={[150,405]} to={[680,405]} progress={progress}/>
  </g>;
}

function Plot({plot, progress, mode}) {
  const points = plot.points;
  if (!points?.length || points.some(point=>!point.every(Number.isFinite))) throw new RangeError('Missing source plot points');
  const xMin = Math.min(0,...points.map(point=>point[0]));
  const xMax = Math.max(...points.map(point=>point[0]));
  const yMin = Math.min(0,...points.map(point=>point[1]));
  const yMax = Math.max(...points.map(point=>point[1]));
  const sx = value => 85+(value-xMin)/(xMax-xMin || 1)*620;
  const sy = value => 365-(value-yMin)/(yMax-yMin || 1)*260;
  const at = x => {
    const upper = points.findIndex(point=>point[0]>=x);
    if (upper <= 0) return points[0][1];
    const left=points[upper-1],right=points[upper];
    return left[1]+(right[1]-left[1])*(x-left[0])/(right[0]-left[0] || 1);
  };
  const interval = plot.shade || [xMin,xMax];
  const cursor = interval[0]+(interval[1]-interval[0])*progress;
  const integral = ['moving-strips','endpoint-area','tangent-area','triangle-cut','triangle-sweep'].includes(mode);
  const stripWidth = (xMax-xMin)/36;
  const shadePoints = Array.from({length:37},(_,index) => {const x=interval[0]+(cursor-interval[0])*index/36;return `${sx(x)},${sy(at(x))}`;}).join(' ');
  const slope = (at(Math.min(xMax,cursor+stripWidth))-at(Math.max(xMin,cursor-stripWidth)))/(Math.min(xMax,cursor+stripWidth)-Math.max(xMin,cursor-stripWidth) || 1);
  return <g {...mark('source-plot')}>
    <path d="M80 80V370H745" fill="none" stroke={PALETTE.muted} strokeWidth={2}/>
    {integral && mode !== 'tangent-area' && <><polygon points={`${sx(interval[0])},365 ${shadePoints} ${sx(cursor)},365`} fill={PALETTE.green} opacity={.18}/><rect x={sx(cursor)} y={sy(at(cursor))} width={Math.max(3,sx(xMin+stripWidth)-sx(xMin))} height={Math.max(1,365-sy(at(cursor)))} fill={PALETTE.gold} opacity={.8}/></>}
    <polyline points={points.map(point=>`${sx(point[0])},${sy(point[1])}`).join(' ')} fill="none" stroke={PALETTE.green} strokeWidth={5}/>
    {mode === 'tangent-area' && <line {...mark('moving-tangent')} x1={sx(cursor-stripWidth*4)} y1={sy(at(cursor)-slope*stripWidth*4)} x2={sx(cursor+stripWidth*4)} y2={sy(at(cursor)+slope*stripWidth*4)} stroke={PALETTE.coral} strokeWidth={5}/>}
    <circle cx={sx(cursor)} cy={sy(at(cursor))} r={9} fill={PALETTE.coral}/>
    {points.length < 10 && points.map(([x,y],index)=><g key={index}><circle cx={sx(x)} cy={sy(y)} r={6} fill={PALETTE.green}/>{label(String(x),sx(x),397,70,{fontSize:17})}{label(String(y),sx(x)+8,sy(y)-10,70,{fontSize:17})}</g>)}
    {label(plot.xLabel || 'x',535,440,230,{fontSize:19})}{label(plot.yLabel || 'y',90,50,550,{fontSize:19})}
  </g>;
}

function FunctionScene({lines, progress, mode}) {
  const plot = lines.filter(line=>line.plot).at(-1)?.plot;
  if (plot) return <Plot plot={plot} progress={progress} mode={mode}/>;
  const distribution = lines.find(line=>/Modelo de brotes/.test(line.label || ''));
  if (distribution) {
    const points=Array.from(plain(distribution.value).matchAll(/(\d+)\s*:\s*(\d+(?:\.\d+)?)/g),match=>[Number(match[1]),Number(match[2])]);
    return <g {...mark('discrete-selection')}><path d="M80 80V370H745" fill="none" stroke={PALETTE.muted} strokeWidth={2}/>{points.map(([value,mass],index)=><g key={index}><rect {...bound} x={130+index*210} y={365-mass*400} width={75} height={mass*400} fill={colors[index%4]} opacity={.45+.55*progress}/>{label(String(value),150+index*210,410,80)}{label(String(mass),140+index*210,345-mass*400,110)}</g>)}</g>;
  }
  const source = lines.find(line=>/g\(0\)/.test(line.value || ''));
  const sums = source ? Array.from(source.value.matchAll(/g\((\d+)\)\s*:\s*(\d+)/g),match=>({input:Number(match[1]),output:Number(match[2])})) : [];
  const equation = lines.filter(line=>line.tex).at(-1)?.tex;
  const output = equation && /^\d+\\cdot\d+=\d+$|^\d+\+\d+=\d+$/.test(equation) ? numbers(equation) : [];
  return <g {...mark('function-machine')}>
    {sums.length ? sums.map(({input,output:value},index)=><g key={index} transform={`translate(${90+index*220} 90)`}><rect {...bound} width={140} height={270} fill={PALETTE.soft} stroke={colors[index%4]} strokeWidth={3}/><rect y={270-value/Math.max(...sums.map(entry=>entry.output))*230*progress} width={140} height={value/Math.max(...sums.map(entry=>entry.output))*230*progress} fill={colors[index%4]}/>{label(`g(${input})`,15,315,150)}{label(String(value),50,250,100)}</g>) : <><rect {...bound} x={270} y={130} width={270} height={180} rx={5} fill={PALETTE.soft} stroke={PALETTE.green} strokeWidth={3}/><Arrow from={[70,220]} to={[265,220]} progress={progress}/><Arrow from={[545,220]} to={[755,220]} progress={progress}/><circle cx={mix(100,700,progress)} cy={220} r={16} fill={PALETTE.coral}/>{label('g',390,230,100,{fontSize:48})}{output.length > 0 && label(String(output[0]),80,175,130)}{output.length > 0 && label(String(output.at(-1)),660,175,130)}</>}
  </g>;
}

function Region({lines, progress, mode}) {
  if (mode === 'matrix-order') {
    const matrix = lines.find(line=>/Sigma=.*pmatrix/.test(line.tex || ''));
    const entries = matrix ? matrix.tex.split('pmatrix}')[1]?.split('\\end')[0].split(/&|\\\\/).map(entry=>entry.trim()).filter(Boolean) : [];
    return <g {...mark('matrix-order')}>
      {entries.map((entry,index)=><g key={index}><rect {...bound} x={175+index%2*180} y={100+Math.floor(index/2)*140} width={155} height={115} fill={index === Math.floor(progress*3.999) ? PALETTE.soft : PALETTE.paper} stroke={colors[index%4]} strokeWidth={3}/>{label(entry,245+index%2*180,170+Math.floor(index/2)*140,100,{fontSize:36})}</g>)}
      {!entries.length && <><path {...bound} d="M150 120V350M250 120H650" fill="none" stroke={PALETTE.green} strokeWidth={4}/><Arrow from={[150,120]} to={[150,350]} progress={progress}/><Arrow from={[250,120]} to={[650,120]} progress={progress}/>{label('x',110,90,100)}{label('y',675,130,100)}</>}
      <Arrow from={[100,410]} to={[650,410]} progress={progress}/>
    </g>;
  }
  const source = lines.filter(line=>line.plot).at(-1)?.plot;
  const formula = lines.some(line=>/1-x|1\\cdot1/.test(line.tex || ''));
  const points = source?.points || (formula ? [[0,1],[1,0]] : null);
  if (!points) return <g {...mark('coordinate-motion')}><path d="M100 80V370H720" stroke={PALETTE.muted} strokeWidth={4} fill="none"/><circle cx={mix(130,650,progress)} cy={mix(330,120,progress)} r={14} fill={PALETTE.green}/>{label('x',720,400,60)}{label('y',70,70,60)}</g>;
  const limit = Math.max(...points.flat());
  const cut = source?.cut ?? progress*limit;
  return <g {...mark('triangular-support')}>
    <path d="M100 80V370H720" stroke={PALETTE.muted} strokeWidth={3} fill="none"/>
    <polygon {...bound} points="100,370 100,90 700,370" fill={PALETTE.soft} stroke={PALETTE.green} strokeWidth={3}/>
    {Array.from({length:24},(_,index)=>{const fraction=index/24;return <line key={index} x1={100+fraction*600} y1={370} x2={100+fraction*600} y2={90+fraction*280} stroke={PALETTE.green} opacity={fraction <= progress ? .4 : .05}/>;})}
    <line {...mark('vertical-region-cut')} x1={100+cut/limit*600} x2={100+cut/limit*600} y1={370} y2={90+cut/limit*280} stroke={PALETTE.coral} strokeWidth={7}/>
    <circle cx={100+cut/limit*600} cy={mix(370,90+cut/limit*280,progress)} r={10} fill={PALETTE.gold}/>
    {label(String(limit),90,65,90)}{label(String(limit),700,407,90)}{label('x',735,375,50)}{label('y',65,70,50)}
  </g>;
}

function Sets({lines, progress, operation, mode, anchor = ''}) {
  const outcomes = lines.find(line=>/Omega|Cuatro resultados/.test(line.label || ''));
  const counts = lines.find(line=>/Solo A:/.test(line.value || ''));
  const values = counts ? numbers(counts.value) : [];
  if (outcomes || mode === 'seed-outcomes' || mode === 'pairwise-not-mutual') {
    const entries = outcomes ? outcomes.value.split(/;\s*/) : ['A','B'];
    return <g {...mark('sample-space')}>
      {entries.map((entry,index)=><g key={index} transform={`translate(${70+index%2*350} ${95+Math.floor(index/2)*165})`}><rect {...bound} width={290} height={125} fill={PALETTE.soft} stroke={PALETTE.line}/>{Array.from({length:2},(_,seed)=><ellipse key={seed} cx={75+seed*100} cy={45+Math.sin(progress*Math.PI)*(index%2 ? 10 : -10)} rx={16} ry={23} fill={index & (1<<seed) ? PALETTE.green : PALETTE.line}/>)}{label(entry,20,105,260,{fontSize:19})}</g>)}
    </g>;
  }
  const intersection = operation === 'intersection' || operation === 'condition';
  const complement = operation === 'complement';
  const complementUnion = /ningun/i.test(anchor) || /\(A\\cup B\)\^c/.test(lines.filter(line=>line.tex).at(-1)?.tex || '');
  const union = operation === 'union';
  if (mode === 'nested-events') return <g {...mark('nested-events')}><rect {...bound} x={65} y={45} width={690} height={390} fill={complement ? PALETTE.soft : PALETTE.paper} stroke={PALETTE.muted}/><ellipse cx={420} cy={245} rx={260} ry={165} fill={PALETTE.soft} stroke={PALETTE.blue} strokeWidth={3}/><circle cx={mix(345,385,progress)} cy={245} r={90} fill={complement ? PALETTE.paper : PALETTE.green} fillOpacity={complement ? 1 : .25} stroke={PALETTE.green} strokeWidth={3}/>{label('A',350,250,80)}{label('B',600,250,80)}</g>;
  const centerA = mix(300,330,progress), centerB = mix(520,490,progress);
  const radius = 145, middle=(centerA+centerB)/2;
  const halfDistance=(centerB-centerA)/2, halfHeight=Math.sqrt(radius*radius-halfDistance*halfDistance);
  const lens = `M${middle},${235-halfHeight} A${radius},${radius} 0 0 1 ${middle},${235+halfHeight} A${radius},${radius} 0 0 1 ${middle},${235-halfHeight}`;
  return <g {...mark('set-regions')}>
    <rect {...bound} x={55} y={45} width={700} height={380} rx={5} fill={complement ? PALETTE.soft : PALETTE.paper} stroke={PALETTE.muted}/>
    <circle cx={centerA} cy={235} r={radius} fill={intersection || complement ? PALETTE.paper : PALETTE.green} fillOpacity={intersection || complement ? 1 : .22} stroke={PALETTE.green} strokeWidth={3}/>
    <circle cx={centerB} cy={235} r={radius} fill={union ? PALETTE.blue : complement && !complementUnion ? PALETTE.soft : PALETTE.paper} fillOpacity={union ? .22 : complement ? 1 : .8} stroke={PALETTE.blue} strokeWidth={3}/>
    <path d={lens} fill={intersection || union ? PALETTE.coral : PALETTE.paper} opacity={.35+.3*progress}/>
    {label('A',centerA-65,145,80)}{label('B',centerB+45,145,80)}
    {values.length === 4 && <>{label(String(values[0]),centerA-80,255,90)}{label(String(values[1]),centerB+50,255,90)}{label(String(values[2]),middle-10,255,90)}{label(String(values[3]),680,390,90)}</>}
  </g>;
}

function Probability({lines, progress, mode, operation, cueIndex, anchor}) {
  if (mode === 'empirical-frequency') return <Quantity lines={lines} progress={progress} mode={mode} cueIndex={cueIndex}/>;
  if (mode !== 'disjoint-mass' || lines.some(line => /\\(?:cup|cap)/.test(line.tex || ''))) return <Sets lines={lines} progress={progress} mode={mode} operation={operation} anchor={anchor}/>;
  const equation=lines.find(line=>/^0\{,\}\d+\+0\{,\}\d+=/.test(line.tex || ''));
  const weights=equation ? numbers(equation.tex).slice(0,2) : [];
  return <g {...mark('disjoint-probability-mass')}>
    <rect {...bound} x={80} y={110} width={640} height={210} fill={PALETTE.soft} stroke={PALETTE.muted}/>
    {weights.length ? weights.map((weight,index)=><g key={index}><rect x={80+640*weights.slice(0,index).reduce((sum,value)=>sum+value,0)} y={110} width={640*weight} height={210*progress} fill={colors[index]}/>{label(String(weight),100+640*weights.slice(0,index).reduce((sum,value)=>sum+value,0),360,150)}</g>) : <><rect x={110} y={140} width={180} height={150} fill={PALETTE.green} opacity={.2+.4*progress}/><rect x={510} y={140} width={180} height={150} fill={PALETTE.coral} opacity={.6-.4*progress}/></>}
    <Arrow from={[100,415]} to={[700,415]} progress={progress}/>
  </g>;
}

function Allocation({lines, progress, mode}) {
  const equation = lines.find(line=>/^(\d+)\\cdot(\d+)=/.test(line.tex || ''));
  const factorial = lines.find(line=>/^(\d+)!/.test(line.tex || ''));
  const total = equation ? numbers(equation.tex)[0] : factorial ? numbers(factorial.tex)[0] : null;
  const count = total && total <= 24 ? total : 0;
  const swapped = mode === 'unordered-pairs' ? progress : 0;
  return <g {...mark('counting-allocation')}>
    {Array.from({length:count},(_,index)=><g key={index}><circle {...bound} cx={70+index*650/count} cy={85} r={22} fill={colors[index%4]}/>{label(String.fromCharCode(65+index),60+index*650/count,92,55,{fontSize:18,fill:PALETTE.paper})}</g>)}
    {[0,1].map(index=><g key={index}><rect {...bound} x={180+index*270} y={240} width={170} height={120} rx={4} fill={PALETTE.soft} stroke={PALETTE.muted} strokeWidth={3}/>{label(mode === 'unordered-pairs' ? 'Grupo' : index === 0 ? 'Primera' : 'Segunda',185+index*270,405,210,{fontSize:20})}</g>)}
    <circle cx={mix(90,265+270*swapped,progress)} cy={mix(110,300,progress)} r={28} fill={PALETTE.green}/>
    <circle cx={mix(700,535-270*swapped,progress)} cy={mix(110,300,progress)} r={28} fill={mode === 'repeated-labels' ? PALETTE.green : PALETTE.coral}/>
    {mode === 'unordered-pairs' && <path d={`M265 220Q400 ${mix(80,185,progress)} 535 220`} fill="none" stroke={PALETTE.gold} strokeWidth={4}/>}
  </g>;
}

function Population({lines, progress, mode, cueIndex}) {
  const bars = lines.filter(line=>line.bar);
  if (bars.length) {
    const latest=bars.at(-1), first=bars[0];
    return <><Tray {...first.bar} title={first.label} x={45} y={100} width={310} height={260} progress={progress}/><Arrow from={[380,230]} to={[435,230]} progress={progress}/><Tray {...latest.bar} title={latest.label} x={465} y={100} width={310} height={260} progress={progress}/></>;
  }
  const products = lines.filter(line=>line.tex && /\\cdot/.test(line.tex)).map(line=>numbers(line.tex)).filter(values=>values.length>=2 && values[0]>=0 && values[0]<=1 && values[1]>=0 && values[1]<=1);
  const factors = products.at(-1);
  return <g {...mark('conditional-area')}>
    <rect {...bound} x={100} y={75} width={600} height={320} fill={PALETTE.soft} stroke={PALETTE.muted} strokeWidth={3}/>
    {factors ? <><rect x={100} y={75} width={600*factors[0]} height={320} fill={PALETTE.green} opacity={.25}/><rect x={100} y={75} width={600*factors[0]} height={320*factors[1]*progress} fill={PALETTE.coral} opacity={.7}/>{label(String(factors[0]),100,435,160)}{label(String(factors[1]),710,160,100)}</> : <><path d={`M${mix(180,620,progress)} 75V395`} stroke={PALETTE.coral} strokeWidth={5}/>{label(mode === 'compare-conditional' ? 'A | B' : 'A',210,245,200)}{label('B',590,245,100)}</>}
  </g>;
}

function Bayes({lines, progress, mode}) {
  const products = lines.filter(line=>line.tex).map(line=>({tex:line.tex,values:numbers(line.tex)})).filter(({tex,values})=>/^[\d{,}.]+\\cdot[\d{,}.]+=/.test(tex) && values.length===3);
  const explicit = lines.findLast(line=>/Positivos esperados|Negativos esperados/.test(line.label || ''));
  const changedPopulation = lines.findLast(line=>/Otra poblaci/.test(line.label || ''));
  const observed = lines.findLast(line=>/Infectadas entre positivos/.test(line.label || '') && line.bar);
  const weights = changedPopulation ? numbers(changedPopulation.value).slice(-2) : explicit ? numbers(explicit.value).slice(0,2) : observed ? [observed.bar.part,observed.bar.total-observed.bar.part] : products.map(entry=>entry.values.at(-1)).slice(-2);
  const sum = weights.reduce((total,value)=>total+value,0);
  const posterior = mode === 'posterior-filter';
  return <g {...mark('bayes-weighted-routes')}>
    <circle {...bound} cx={90} cy={235} r={33} fill={PALETTE.soft} stroke={PALETTE.muted}/>
    {[0,1].map(index=><g key={index}><Arrow from={[125,235]} to={[315,110+index*240]} color={colors[index]} width={weights[index] ? 4+18*weights[index]/sum : 6} progress={progress}/><rect {...bound} x={320} y={65+index*240} width={150} height={90} fill={colors[index]} opacity={.18}/>{label(index === 0 ? 'A' : 'A^c',380,120+index*240,100)}<Arrow from={[475,110+index*240]} to={[660,235]} color={colors[index]} width={weights[index] ? 4+18*weights[index]/sum : 6} progress={progress}/>{weights[index] !== undefined && label(String(weights[index]),495,95+index*240,150,{fontSize:23})}</g>)}
    <circle {...bound} cx={700} cy={235} r={posterior ? mix(44,72,progress) : 44} fill={PALETTE.soft} stroke={PALETTE.green} strokeWidth={4}/>{label(mode === 'negative-prevalence' && !changedPopulation ? '-' : '+',687,245,80,{fontSize:32})}
    <circle cx={mix(125,650,progress)} cy={235-125*Math.sin(Math.PI*progress)} r={11} fill={PALETTE.green}/>
    <circle cx={mix(125,650,progress)} cy={235+125*Math.sin(Math.PI*progress)} r={11} fill={PALETTE.coral}/>
  </g>;
}

export function FoundationsScene({plan, state}) {
  if (!plan?.data || !plan.cues?.length) throw new TypeError('Missing native foundations scene');
  const cueIndex = Math.max(-1, Math.min(plan.cues.length-1, state.cueIndex));
  const cue = plan.cues[cueIndex];
  const progress = cueIndex < 0 ? 0 : ease(Math.max(0,Math.min(1,state.progress)));
  const lines = plan.data.lines.filter(line=>(line.cue ?? 0)<=cueIndex);
  const modelLines = [...(plan.data.history || []),...lines];
  const props = {lines:modelLines, progress, mode:plan.data.mode, cueIndex, operation:cue?.operation, anchor:cue?.anchor || ''};
  let geometry;
  switch (plan.family) {
    case 'quantity': geometry=plan.data.seed ? <SeedComparison seed={plan.data.seed} cueIndex={cueIndex} progress={progress}/> : <Quantity {...props}/>; break;
    case 'balance': geometry=<Balance {...props}/>; break;
    case 'function': geometry=<FunctionScene {...props}/>; break;
    case 'integral': {
      const plot=modelLines.filter(line=>line.plot).at(-1)?.plot;
      geometry=plot ? <Plot plot={plot} progress={progress} mode={plan.data.mode}/> : <g {...mark('integration-sweep')}><path d="M90 90V365H720" stroke={PALETTE.muted} fill="none" strokeWidth={3}/><line x1={mix(120,690,progress)} x2={mix(120,690,progress)} y1={140} y2={365} stroke={PALETTE.gold} strokeWidth={12}/><Arrow from={[110,410]} to={[700,410]} progress={progress}/></g>;
      break;
    }
    case 'region': geometry=<Region {...props}/>; break;
    case 'sets': geometry=<Sets {...props}/>; break;
    case 'probability': geometry=<Probability {...props}/>; break;
    case 'allocation': geometry=<Allocation {...props}/>; break;
    case 'filter': case 'independence': geometry=<Population {...props}/>; break;
    case 'bayes': geometry=<Bayes {...props}/>; break;
    default: throw new RangeError(`Unsupported foundations scene family: ${plan.family}`);
  }
  return <SceneSurface label={`foundations:${plan.data.sourceId}:${plan.data.stepIndex}:${plan.data.mode}`}>
    <svg viewBox="0 0 1200 480" width={1200} height={480} style={{position:'absolute',inset:0}}>{geometry}</svg>
    {plan.data.seed ? <SeedNotes seed={plan.data.seed} cueIndex={cueIndex} progress={progress}/> : <SourceNotes lines={lines} cueIndex={cueIndex} progress={progress}/>}
  </SceneSurface>;
}