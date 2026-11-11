import React from 'react';
import jstat from 'jstat';
import {PALETTE as C, ease, mix, SceneSurface, MathFormula, SvgText} from './native-primitives.jsx';

const {jStat} = jstat;
const COLORS = [C.green, C.coral, C.blue];
const bounded = value => Math.max(0, Math.min(1, value));
const pathOf = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
const mark = {'data-native-bound':true, 'data-native-mark':true};
const number = value => Number(String(value).replace(',', '.'));

function Axes({x = 70, y = 300, width = 620, height = 260, xLabel = 'X', yLabel = 'Y'}) {
  return <g><path {...mark} d={`M${x},${y - height}V${y}H${x + width}`} fill="none" stroke={C.muted} strokeWidth="2" />
    <SvgText text={xLabel} x={x + width - 8} y={y + 28} width={120} anchor="end" fontSize={20} />
    <SvgText text={yLabel} x={x - 18} y={y - height + 12} width={100} anchor="end" fontSize={20} /></g>;
}

function SourceNotes({lines}) {
  const notes = lines.filter(line => !line.tex && (line.value || line.label)).slice(-2);
  const fields = notes.flatMap((line,index) => [
    ...(line.label ? [{text:line.label, label:true, key:`${index}-label`}] : []),
    ...(line.value ? [{text:line.value, label:false, key:`${index}-value`}] : []),
  ]);
  let fontSize = 18, layout = [];
  while (fontSize > 1) {
    let top = 16;
    layout = fields.map(field => {
      const size = fontSize+(field.label ? 1 : 0);
      const words = field.text.split(/\s+/u);
      const limit = Math.max(4,Math.floor(264/(size*.56)));
      let rows = 1, length = 0;
      for (const word of words) {
        if (length && length+1+word.length > limit) {rows++; length=word.length;}
        else length += (length ? 1 : 0)+word.length;
      }
      const entry = {...field, size, y:top+size, fits:words.every(word=>word.length*size*.7<=330)};
      top += rows*size*1.25+8;
      return entry;
    });
    if (top <= 329 && layout.every(field=>field.fits)) break;
    fontSize -= .5;
  }
  return <g data-native-notes>{layout.map(field => <SvgText key={field.key} text={field.text} x={820} y={field.y}
    width={264} fontSize={field.size} fill={field.label ? C.green : C.ink} />)}</g>;
}

function FormulaRail({lines, cueIndex, progress}) {
  const formulas = lines.filter(line => line.tex).slice(-2);
  return <>{formulas.map((line, index) => <MathFormula key={`${line.tex}/${index}`} tex={line.tex}
    x={34} y={350 + index * 62} width={1130} fontSize={line.tex.length > 155 ? 17 : line.tex.length > 95 ? 21 : 26}
    opacity={(line.cue ?? 0) === cueIndex ? mix(0.35, 1, progress) : 1} />)}</>;
}

function TableScene({plan, state, p, action, lines}) {
  const table = plan.data.table.find(entry => entry.cue <= state.cueIndex);
  const masses = table?.masses;
  const conditional = plan.family === 'discrete-conditional';
  const marginal = plan.family === 'marginal-table';
  const factor = plan.family === 'factorization-table';
  const cdf = plan.family === 'cdf-rectangle';
  const rows = masses ? [masses[0] + masses[1], masses[2] + masses[3]] : null;
  const columns = masses ? [masses[0] + masses[2], masses[1] + masses[3]] : null;
  const collapsing = marginal && /collapse|sum/.test(action);
  const alongRows = action !== 'collapse-columns';
  const reference = lines.map(line => `${line.tex || ''} ${line.value || ''}`).join(' ');
  const cellMatch = reference.match(/p_\{X,Y\}\(([01]),([01])\)|P\(X=([01]),Y=([01])\)/);
  const selected = cellMatch ? Number(cellMatch[1] ?? cellMatch[3]) * 2 + Number(cellMatch[2] ?? cellMatch[4]) : null;
  const regionX = /X=0|X\\leq 0|X\\le0/.test(reference) ? 0 : null;
  return <g>
    <path {...mark} data-native-table-frame d="M170,70H520V300H170ZM170,185H520M345,70V300" fill="none" stroke={C.ink} strokeWidth={4} />
    <SvgText text="X" x={85} y={105} width={60} fontSize={22} />
    <SvgText text="Y" x={370} y={30} width={60} fontSize={22} />
    {[0, 1].map(index => <g key={index}><SvgText text={index} x={110} y={126 + index * 115} width={40} fontSize={20} />
      <SvgText text={index} x={250 + index * 175} y={60} width={40} fontSize={20} /></g>)}
    {[0, 1, 2, 3].map(index => {
      const row = Math.floor(index / 2), column = index % 2;
      const originalX = 180 + column * 175, originalY = 80 + row * 115;
      const targetX = alongRows ? originalX : 570;
      const targetY = alongRows ? 275 : originalY;
      const collapse = collapsing ? p : 0;
      const x = mix(originalX, targetX, collapse), y = mix(originalY, targetY, collapse);
      const focus = plan.family === 'joint-region' ? regionX === null || row === regionX : index === selected;
      return <g key={index} opacity={conditional && row === 0 ? 0.2 : 1}>
        <rect {...mark} data-cell={`${row},${column}`} x={x} y={y} width={mix(155, alongRows ? 155 : 105, collapse)} height={mix(95, alongRows ? 28 : 95, collapse)}
          fill={focus ? C.soft : C.paper} stroke={focus ? C.green : C.line} strokeWidth={focus ? 3 : 2} />
        {masses && <SvgText text={String(masses[index]).replace('.', ',')} x={x + 77} y={y + 57} width={120} anchor="middle" fontSize={27} opacity={1 - collapse} />}
      </g>;
    })}
    {conditional && <g><path {...mark} d={`M545,208H${mix(570, 700, p)}`} stroke={C.coral} strokeWidth={4} />
      <SvgText text="Y | X" x={590} y={175} width={180} fontSize={23} /></g>}
    {plan.family === 'joint-table' && action === 'locate-cell' && <g>
      <path {...mark} d={`M135,${127 + Math.floor((selected ?? 0) / 2) * 115}H${mix(150, 257 + ((selected ?? 0) % 2) * 175, p)}`} stroke={C.coral} strokeWidth={3} />
      <circle {...mark} cx={mix(150, 257 + ((selected ?? 0) % 2) * 175, p)} cy={127 + Math.floor((selected ?? 0) / 2) * 115} r={6} fill={C.coral} />
    </g>}
    {plan.family === 'joint-region' && <rect {...mark} x={175} y={75} width={mix(4, 340, p)} height={regionX === 0 ? 105 : 225} fill={C.blue} opacity={0.14} stroke={C.blue} strokeWidth={3} />}
    {collapsing && <g opacity={p}><SvgText text={alongRows ? 'Y' : 'X'} x={alongRows ? 540 : 635} y={alongRows ? 302 : 60} width={80} fontSize={23} />
      {(alongRows ? columns : rows)?.map((value, index) => <rect {...mark} key={index} x={alongRows ? 180 + index * 175 : 570} y={alongRows ? 275 - value * 100 : 80 + index * 115}
        width={alongRows ? 155 : value * 150} height={alongRows ? value * 100 : 95} fill={C.green} opacity={0.65} />)}</g>}
    {factor && <g><path {...mark} d={`M540,95Q${mix(580, 665, p)},190 540,295`} stroke={C.coral} fill="none" strokeWidth={3} />
      <SvgText text="pX" x={570} y={110} width={90} fontSize={23} /><SvgText text="pY" x={660} y={290} width={90} fontSize={23} /></g>}
    {cdf && <g>
      <rect {...mark} x={mix(165, 310, action === 'subtract-strip' ? p : 0)} y={70} width={mix(350, 205, action === 'subtract-strip' ? p : 0)} height={230}
        fill={action === 'restore-overlap' ? C.green : C.blue} opacity={0.13} stroke={C.blue} strokeWidth={3} />
      <rect {...mark} x={165} y={70} width={mix(12, 145, p)} height={110} fill={C.coral} opacity={action === 'restore-overlap' ? 0.4 : 0.15} />
      <SvgText text="(a,b]" x={550} y={130} width={180} fontSize={24} /><SvgText text="(c,d]" x={550} y={190} width={180} fontSize={24} />
    </g>}
  </g>;
}

function CategoricalScene({plan, state, p, action, lines}) {
  const text = lines.map(line => `${line.tex || ''} ${line.value || ''}`).join(' ');
  const section = plan.data.mode === 'section';
  const established = section || /R\+A\+D=3|3!|tres|3,1\/4/.test(text);
  const count = section ? 4 : established ? 3 : null;
  const categories = section ? ['A', 'B', 'C'] : ['R', 'A', 'D'];
  const sequence = count === 4 ? [0, 0, 1, 2] : [0, 1, 2];
  const collect = /collect|collapse|lock/.test(action);
  const permute = action === 'permute-sequence';
  return <g>
    {categories.map((category, index) => <g key={category}>
      <SvgText text={category} x={220 + index * 210} y={65} width={100} anchor="middle" fontSize={27} fill={COLORS[index]} />
      <path {...mark} d={`M${155 + index * 210},285h130`} stroke={COLORS[index]} strokeWidth={4} />
    </g>)}
    {(count ? sequence : [0, 1, 2]).map((category, index) => {
      const originalX = 140 + index * 140;
      const swappedX = permute ? 140 + ((index + 1) % sequence.length) * 140 : originalX;
      const x = collect ? mix(originalX, 220 + category * 210, p) : mix(originalX, swappedX, p);
      const y = collect ? mix(140, 250 - (index === 1 && count === 4 ? 55 : 0), p) : 140 - (permute ? Math.sin(p * Math.PI) * 55 : 0);
      return <g key={index}><circle {...mark} cx={x} cy={y} r={25} fill={COLORS[category]} />
        <SvgText text={categories[category]} x={x} y={y + 8} width={50} anchor="middle" fill={C.paper} fontSize={21} /></g>;
    })}
    {plan.family === 'multinomial-indicators' && <g>
      <path {...mark} d={`M180,195L${mix(180, 640, p)},195`} stroke={C.coral} strokeWidth={4} strokeDasharray="8 5" />
      <path {...mark} d="M380,175l35,40m0,-40l-35,40" stroke={C.coral} strokeWidth={4} />
      <SvgText text="IA" x={180} y={240} width={90} fontSize={24} /><SvgText text="IB" x={610} y={240} width={90} fontSize={24} />
    </g>}
    {action === 'lock-total' && <path {...mark} d={`M100,290v25h${mix(40, 630, p)}v-25`} stroke={C.ink} fill="none" strokeWidth={3} />}
  </g>;
}

function TriangleScene({plan, p, action, lines}) {
  const currentPlot = lines.filter(line => line.plot).at(-1)?.plot;
  const geometry = plan.data.geometry;
  const sourceCut = currentPlot?.cut ?? geometry.cut;
  const symbolicCut = sourceCut === null ? 0.5 : bounded(sourceCut / (geometry.capacity || 1));
  const moving = /move|sweep|collapse/.test(action);
  const cut = moving ? mix(0.08, symbolicCut, p) : symbolicCut;
  const left = 85, bottom = 300, size = 250;
  const x = left + cut * size, top = bottom - (1 - cut) * size;
  const normalized = /normalize|shade/.test(action);
  const exclusion = plan.family === 'support-exclusion';
  const conditional = /conditional/.test(plan.family);
  const shadeLeft = lines.some(line => /Y\s*</.test(line.tex || ''));
  return <g><Axes x={left} y={bottom} width={285} height={280} />
    <path {...mark} d={`M${left},${bottom}V${bottom - size}L${left + size},${bottom}Z`} fill={C.soft} stroke={C.green} strokeWidth={3} />
    <path {...mark} d={`M${x},${bottom}V${top}`} stroke={C.coral} strokeWidth={5} />
    {action === 'shrink-region' && <path {...mark} d={`M${left},${bottom}V${bottom - mix(size, size / 2, p)}L${left + mix(size, size / 2, p)},${bottom}Z`} fill={C.blue} opacity={0.3} />}
    {exclusion && <g><rect {...mark} x={left + size * 0.75} y={bottom - size} width={size / 4} height={size / 4} fill={C.coral} opacity={mix(0.15, 0.55, p)} />
      <path {...mark} d={`M${left + 190},${bottom - 250}l60,60m0,-60l-60,60`} stroke={C.coral} strokeWidth={3} />
      <SvgText text="fXY = 0" x={435} y={95} width={250} fill={C.coral} fontSize={25} />
      {action === 'compare-support' && <SvgText text="fX fY > 0" x={435} y={160} width={250} fill={C.green} fontSize={25} />}</g>}
    {!exclusion && <g><Axes x={450} y={bottom} width={270} height={245} xLabel={conditional ? 'Y | X' : 'X'} yLabel="f" />
      {conditional ? <g><path {...mark} d={`M465,300V${mix(220, 100, normalized ? p : 0)}H${465 + (1 - cut) * 230}V300`} fill={C.blue} fillOpacity={0.12} stroke={C.blue} strokeWidth={3} />
        {action === 'shade-cut-area' && <rect {...mark} x={465 + (shadeLeft ? 0 : (1 - cut) * 115)} y={100} width={mix(0, (1 - cut) * 115, p)} height={200} fill={C.coral} opacity={0.35} />}
        <path {...mark} d={`M${x + 12},${(top + bottom) / 2}Q400,${mix(200, 125, p)} 455,${mix(220, 100, normalized ? p : 0)}`} fill="none" stroke={C.coral} strokeWidth={2} strokeDasharray="6 5" />
      </g> : <g><path {...mark} d="M465,65L710,300" fill="none" stroke={C.blue} strokeWidth={4} />
        <rect {...mark} x={465} y={65} width={mix(0, 245, p)} height={235} fill={C.blue} opacity={0.06} />
        <circle {...mark} cx={465 + cut * 245} cy={65 + cut * 235} r={6} fill={C.coral} /></g>}
    </g>}
  </g>;
}

function normalParameters(plan, lines) {
  const text = lines.map(line => line.value || '').join(' ');
  const match = text.match(/(?:rho|\u03c1)\s*[:=]\s*(-?\d+(?:[,.]\d+)?)/i);
  if (match) return {rho:number(match[1]), known:true};
  if (plan.data.geometry.gaussian.rho !== null) return {rho:plan.data.geometry.gaussian.rho, known:true};
  return {rho:0, known:false};
}

function GaussianScene({plan, p, action, lines}) {
  const {rho} = normalParameters(plan, lines);
  const model = plan.data.geometry.gaussian;
  const conditional = /conditional|tail/.test(plan.family);
  const shifting = /mean|cut/.test(action);
  const narrowing = action === 'narrow-variance';
  const sourceCut = model.conditionX !== null && model.meanX !== null && model.sdX > 0 ? (model.conditionX - model.meanX) / model.sdX : 0;
  const cut = shifting ? mix(0, sourceCut, p) : conditional ? sourceCut : 0;
  const center = conditional ? rho * cut : 0;
  const deviation = conditional ? mix(1, Math.sqrt(1 - rho * rho), narrowing ? p : 1) : 1;
  const curve = Array.from({length:101}, (_, index) => {
    const value = -3.5 + index * 0.07;
    return [470 + index * 2.65, 305 - jStat.normal.pdf(value, center, deviation) * 480];
  });
  const threshold = model.threshold !== null && model.meanY !== null && model.sdY > 0 ? (model.threshold - model.meanY) / model.sdY : null;
  const tail = threshold !== null ? Array.from({length:51}, (_, index) => {
    const value = threshold + (3.5 - threshold) * index / 50;
    return [470 + (value + 3.5) / 7 * 265, 305 - jStat.normal.pdf(value, center, deviation) * 480];
  }) : [];
  return <g><Axes x={55} y={305} width={345} height={275} />
    {[0.7, 1.3, 1.9, 2.5].map((radius, index) => {
      const points = Array.from({length:97}, (_, point) => {
        const angle = point / 96 * Math.PI * 2;
        const first = radius * Math.cos(angle), second = radius * Math.sin(angle);
        const correlation = action === 'tilt-contours' ? mix(0, rho, p) : rho;
        return [225 + first * 54, 170 - (correlation * first + Math.sqrt(1 - correlation * correlation) * second) * 50];
      });
      return <path {...mark} key={radius} d={`${pathOf(points)}Z`} fill={C.green} fillOpacity={0.035 + index * 0.012} stroke={C.green} strokeWidth={2} />;
    })}
    {plan.family === 'gaussian-density' && <g>
      <circle {...mark} cx={225 + 81 * Math.cos(p * Math.PI * 2)} cy={170 - 75 * (rho * Math.cos(p * Math.PI * 2) + Math.sqrt(1 - rho * rho) * Math.sin(p * Math.PI * 2))} r={7} fill={C.coral} />
      <path {...mark} d={`M${mix(470, 735, p)},305V${curve[Math.round(p * 100)][1]}`} stroke={C.coral} strokeWidth={3} />
    </g>}
    {conditional && <path {...mark} d={`M${225 + cut * 54},40V305`} stroke={C.coral} strokeWidth={3} />}
    <circle {...mark} cx={225 + cut * 54} cy={170 - rho * cut * 50} r={6} fill={C.coral} />
    <Axes x={455} y={305} width={285} height={250} xLabel={conditional ? 'Y | X' : 'Y'} yLabel="f" />
    <path {...mark} d={pathOf(curve)} stroke={C.blue} strokeWidth={4} fill="none" />
    {conditional && <path {...mark} d={`M${602 + center * 38},305V${305 - jStat.normal.pdf(center, center, deviation) * 480}`} stroke={C.coral} strokeWidth={2} strokeDasharray="5 5" />}
    {action === 'shade-normal-tail' && tail.length > 0 && <path {...mark} d={`M${tail[0][0]},305 ${pathOf(tail).replace(/^M/, 'L')} L${tail.at(-1)[0]},305Z`} fill={C.coral} opacity={mix(0, 0.4, p)} />}
    {action === 'standardize-tail' && <path {...mark} d={`M${mix(602, 645, p)},300v-205`} stroke={C.coral} strokeWidth={3} />}
  </g>;
}

function CovarianceScene({plan, p, action, lines}) {
  const standardizing = plan.family === 'standardized-correlation';
  if (standardizing) {
    const rescaling = action === 'rescale-deviations';
    const width = mix(180, 160, rescaling ? p : 0), height = mix(240, 160, rescaling ? p : 0);
    const ratio = lines.map(line => line.tex || '').join(' ').match(/\\rho\s*=\s*(\d+)\/(\d+)/);
    return <g><Axes x={105} y={305} width={600} height={280} xLabel="X" yLabel="Y" />
      <rect {...mark} x={180} y={305 - height} width={width} height={height} fill={C.soft} stroke={C.green} strokeWidth={3} />
      <path {...mark} d={`M180,${305 - height - 12}h${width}M${192 + width},${305 - height}v${height}`} fill="none" stroke={C.blue} strokeWidth={3} />
      {ratio && <rect {...mark} x={180} y={305 - height} width={width * bounded(Number(ratio[1]) / Number(ratio[2])) * p} height={height} fill={C.coral} opacity={0.4} />}
      <SvgText text="\u03c3X" x={180 + width / 2} y={335} width={100} anchor="middle" fontSize={23} />
      <SvgText text="\u03c3Y" x={210 + width} y={305 - height / 2} width={100} fontSize={23} />
      <path {...mark} d={`M${250 + width},180H${mix(450, 670, p)}`} stroke={C.coral} strokeWidth={4} />
    </g>;
  }
  const centered = /center|signed|average/.test(action);
  const scale = standardizing ? mix(1, 0.62, p) : 1;
  return <g><Axes x={80} y={305} width={620} height={270} />
    <path {...mark} d="M370,45V305M90,175H700" stroke={C.muted} strokeDasharray="6 5" />
    {[[-1, -1], [1, 1]].map(([horizontal, vertical], index) => {
      const x = 370 + horizontal * 175 * scale, y = 175 - vertical * 105 * scale;
      const reveal = centered ? p : 1;
      return <g key={index}><rect {...mark} x={Math.min(370, x)} y={Math.min(175, y)} width={Math.abs(x - 370) * reveal} height={Math.abs(y - 175) * reveal} fill={COLORS[index]} opacity={0.18} />
        <path {...mark} d={`M370,175H${mix(370, x, p)}V${y}`} fill="none" stroke={COLORS[index]} strokeWidth={3} />
        <circle {...mark} cx={x} cy={y} r={10} fill={COLORS[index]} /></g>;
    })}
    <SvgText text={standardizing ? 'ZX' : 'X - E[X]'} x={510} y={330} width={240} fontSize={21} />
    <SvgText text={standardizing ? 'ZY' : 'Y - E[Y]'} x={95} y={45} width={210} fontSize={21} />
    {action === 'average-products' && <path {...mark} d={`M190,260Q370,${mix(260, 70, p)} 550,90`} fill="none" stroke={C.coral} strokeWidth={4} />}
  </g>;
}

function MatrixScene({plan, p, action}) {
  const weighted = /weighted/.test(plan.family);
  const symbols = weighted ? ['a\u00b2 Var X', 'ab Cov XY', 'ab Cov YX', 'b\u00b2 Var Y'] : ['Var X', 'Cov XY', 'Cov YX', 'Var Y'];
  return <g>
    {[0, 1, 2, 3].map(index => {
      const diagonal = index === 0 || index === 3;
      const active = action === 'matrix-diagonal' ? diagonal : action === 'matrix-cross' ? !diagonal : true;
      return <g key={index}><rect {...mark} x={125 + index % 2 * 205} y={50 + Math.floor(index / 2) * 120} width={185} height={100}
        stroke={diagonal ? C.green : C.coral} strokeWidth={active ? mix(2, 5, p) : 2} fill={diagonal ? C.soft : C.paper} />
        <SvgText text={symbols[index]} x={217 + index % 2 * 205} y={110 + Math.floor(index / 2) * 120} width={180} anchor="middle" fontSize={23} /></g>;
    })}
    {weighted ? <g><path {...mark} d={`M550,85L${mix(550, 690, p)},${mix(85, 270, p)}`} stroke={C.blue} strokeWidth={5} />
      <circle {...mark} cx={mix(550, 690, p)} cy={mix(85, 270, p)} r={7} fill={C.blue} /><SvgText text="a" x={650} y={75} width={70} fontSize={26} /></g> : <g>
      <ellipse {...mark} cx={635} cy={165} rx={68} ry={mix(68, action === 'test-admissibility' ? 15 : 45, p)} transform="rotate(-30 635 165)" fill={C.blue} fillOpacity={0.08} stroke={C.blue} strokeWidth={3} />
      <path {...mark} d="M555,285H715M635,45V300" stroke={C.muted} strokeWidth={1} />
    </g>}
    {action === 'matrix-normalize' && <path {...mark} d={`M105,300H${mix(105, 520, p)}`} stroke={C.gold} strokeWidth={6} />}
  </g>;
}

function WeightedScene({p, action}) {
  const reverse = action === 'reverse-weight';
  return <g>
    <rect {...mark} x={115} y={80} width={180} height={180} fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={3} />
    <rect {...mark} x={295} y={80} width={240} height={180} fill={C.blue} opacity={0.15} stroke={C.blue} strokeWidth={3} />
    <SvgText text="a² Var X" x={205} y={180} anchor="middle" width={175} fontSize={24} />
    <SvgText text="b² Var Y" x={415} y={180} anchor="middle" width={230} fontSize={24} />
    {[0, 1].map(index => <g key={index} transform={`translate(${mix(0, reverse ? -35 : 35, p)},0)`}>
      <rect {...mark} x={115 + index * 210} y={275} width={mix(8, 205, p)} height={40} fill={C.coral} opacity={0.35} />
    </g>)}
    <SvgText text="ab Cov(X,Y)" x={325} y={305} width={400} anchor="middle" fontSize={22} />
    <path {...mark} d={`M570,170H${mix(590, 720, p)}`} stroke={reverse ? C.coral : C.green} strokeWidth={5} />
    {action === 'cross-term' && <path {...mark} d="M560,155l30,30m0,-30l-30,30" stroke={C.coral} strokeWidth={3} />}
  </g>;
}

function DependenceScene({plan, state, p, action}) {
  const continuous = plan.data.continuous;
  const curve = Array.from({length:81}, (_, index) => {
    const x = -1 + index / 40;
    return [385 + x * 260, 300 - x * x * 235];
  });
  const travel = mix(-1, 1, p);
  return <g><Axes x={85} y={300} width={650} height={275} />
    {continuous ? <path {...mark} d={pathOf(curve)} stroke={C.green} strokeWidth={4} fill="none" /> : [-1, 0, 1].map(value =>
      <circle {...mark} key={value} cx={385 + value * 260} cy={300 - value * value * 235} r={11} fill={C.green} />)}
    <path {...mark} d={`M${385 + travel * 260},300V${300 - travel * travel * 235}`} stroke={C.coral} strokeWidth={3} />
    <circle {...mark} cx={385 + travel * 260} cy={300 - travel * travel * 235} r={7} fill={C.coral} />
    {action === 'cancel-products' && <g><rect {...mark} x={150} y={165} width={mix(0, 150, p)} height={55} fill={C.coral} opacity={0.25} />
      <rect {...mark} x={470} y={165} width={mix(0, 150, p)} height={55} fill={C.blue} opacity={0.25} />
      <path {...mark} d={`M300,193H${mix(300, 470, p)}`} stroke={C.muted} strokeWidth={2} /></g>}
    {action === 'exclude-pairs' && <g><circle {...mark} cx={385} cy={65} r={19} fill="none" stroke={C.coral} strokeWidth={2} />
      <path {...mark} d="M370,50l30,30" stroke={C.coral} strokeWidth={3} /></g>}
    {state.cueIndex > 0 && <SvgText text="X" x={700} y={330} width={45} fontSize={22} />}
  </g>;
}

function TransformScene({p, action}) {
  return <g>{['X', 'Y'].map((label, index) => <g key={label}>
    <SvgText text={label} x={110} y={105 + index * 145} width={100} fontSize={29} />
    <path {...mark} d={`M170,${95 + index * 145}H${mix(190, 545, p)}`} stroke={COLORS[index]} strokeWidth={4} />
    <circle {...mark} cx={mix(190, 545, p)} cy={95 + index * 145} r={8} fill={COLORS[index]} />
    <SvgText text={index ? 'h(Y)' : 'g(X)'} x={590} y={105 + index * 145} width={160} fontSize={29} />
  </g>)}{action === 'select-support' && <path {...mark} d={`M375,95L${mix(375, 545, p)},240`} stroke={C.coral} strokeWidth={4} strokeDasharray="8 5" />}</g>;
}

export function MultivariateScene({plan, state}) {
  if (!plan?.data || !Array.isArray(plan.cues) || !Number.isInteger(state?.cueIndex)) throw new TypeError('Missing multivariate scene state');
  const cue = plan.cues[state.cueIndex === -1 ? 0 : state.cueIndex];
  if (!cue || state.cueIndex < -1) throw new RangeError(`Unknown multivariate cue: ${state.cueIndex}`);
  const p = state.cueIndex === -1 ? 0 : ease(bounded(state.cueDuration > 0 ? state.cueElapsed / state.cueDuration : state.progress || 0));
  const lines = plan.sourceLines.filter(line => (line.cue ?? 0) <= state.cueIndex);
  const props = {plan, state, p, action:cue.action, lines};
  let diagram;
  if (['joint-table', 'joint-region', 'cdf-rectangle', 'marginal-table', 'discrete-conditional', 'factorization-table'].includes(plan.family)) diagram = <TableScene {...props} />;
  else if (plan.family.startsWith('multinomial-')) diagram = <CategoricalScene {...props} />;
  else if (['triangle-marginal', 'triangle-region', 'conditional-cut', 'conditional-area', 'support-exclusion'].includes(plan.family)) diagram = <TriangleScene {...props} />;
  else if (plan.family.startsWith('gaussian-')) diagram = <GaussianScene {...props} />;
  else if (['covariance-deviations', 'standardized-correlation'].includes(plan.family)) diagram = <CovarianceScene {...props} />;
  else if (['covariance-matrix', 'weighted-matrix'].includes(plan.family)) diagram = <MatrixScene {...props} />;
  else if (plan.family === 'weighted-variance') diagram = <WeightedScene {...props} />;
  else if (plan.family === 'uncorrelated-dependent') diagram = <DependenceScene {...props} />;
  else if (plan.family === 'independence-transforms') diagram = <TransformScene {...props} />;
  else throw new RangeError(`Unsupported multivariate visual family: ${plan.family}`);
  return <SceneSurface label={plan.family}>
    <svg data-native-bound data-native-family={plan.family} data-native-action={cue.action} width={1200} height={345} viewBox="0 0 1200 345">
      {diagram}<SourceNotes lines={lines} />
    </svg>
    <FormulaRail lines={lines} cueIndex={state.cueIndex} progress={p} />
  </SceneSurface>;
}