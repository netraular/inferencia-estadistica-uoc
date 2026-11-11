import React from 'react';
import jstat from 'jstat';
import {PALETTE as C, ease, mix, SceneSurface, MathFormula, SvgText} from './native-primitives.jsx';
import {normalStandardizationState} from './native-univariate.mjs';

const {jStat} = jstat;
const X0 = 70;
const X1 = 740;
const TOP = 65;
const BASE = 365;
const px = value => X0 + value * (X1 - X0);
const py = value => BASE - value * 260;
const clamp = value => Math.max(0, Math.min(1, value));
const norm = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const pathFor = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
const pointsFor = (fn, low, high, count = 100) => Array.from({length:count + 1}, (_, index) => {
  const value = low + (high - low) * index / count;
  return [px(index / count), py(fn(value))];
});

function Label({x, y, text, width = 300, size = 21, color = C.ink, anchor = 'start', ...props}) {
  return <SvgText x={x} y={y} text={text} width={width} fontSize={size} fill={color} anchor={anchor} {...props} />;
}

function Axis({xLabel = 'x', yLabel = '', mid = false}) {
  return <g>
    <path data-native-mark data-native-bound d={`M${X0},${TOP}V${BASE}H${X1 + 20}`} fill="none" stroke={C.muted} strokeWidth="4" />
    {mid && <path d={`M${px(0.5)},${TOP}V${BASE}`} stroke={C.line} strokeWidth="2" strokeDasharray="5 7" />}
    <Label x={X1} y={BASE + 34} text={xLabel} anchor="end" width={300} />
    {yLabel && <Label x={X0} y={TOP - 15} text={yLabel} width={500} />}
  </g>;
}

function Curve({fn, low = 0, high = 1, color = C.green, shade = null, sweep = 1, scale = 1}) {
  const points = pointsFor(value => Math.min(1.05, Math.max(0, fn(value) * scale)), low, high);
  const until = Math.max(1, Math.round(clamp(sweep) * (points.length - 1)));
  const partial = points.slice(0, until + 1);
  const area = shade && points.filter((_, index) => index / (points.length - 1) >= shade[0] && index / (points.length - 1) <= shade[1]);
  return <g>
    {area?.length > 1 && <path data-native-mark data-native-bound d={`${pathFor(area)}L${area.at(-1)[0]},${BASE}L${area[0][0]},${BASE}Z`} fill={color} fillOpacity="0.18" />}
    <path data-native-mark data-native-bound d={pathFor(partial)} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <circle data-native-mark data-native-bound cx={partial.at(-1)[0]} cy={partial.at(-1)[1]} r="5" fill={color} />
  </g>;
}

function sourcePlot(lines) {
  return [...lines].reverse().find(line => line.plot?.points?.length > 1)?.plot;
}

function AuthoredCurve({plot, phase}) {
  const source = plot.points.filter(point => point.every(Number.isFinite));
  if (source.length < 2) throw new RangeError('Invalid authored univariate coordinates');
  const low = Math.min(...source.map(point => point[0]));
  const high = Math.max(...source.map(point => point[0]));
  const top = Math.max(...source.map(point => point[1]), Number.EPSILON) * 1.12;
  const x = value => px((value - low) / (high - low || 1));
  const y = value => py(value / top);
  const points = source.map(point => [x(point[0]), y(point[1])]);
  const shade = plot.shade;
  const end = shade ? mix(shade[0], shade[1], phase) : mix(low, high, phase);
  const selected = source.filter(point => point[0] >= (shade?.[0] ?? low) && point[0] <= end).map(point => [x(point[0]), y(point[1])]);
  return <g>
    <Axis xLabel={plot.xLabel || 'x'} yLabel={plot.yLabel || 'Densidad'} />
    <path data-native-bound d={pathFor(points)} fill="none" stroke={C.green} strokeWidth="4" />
    {selected.length > 1 && <path data-native-mark data-native-bound d={`${pathFor(selected)}L${selected.at(-1)[0]},${BASE}L${selected[0][0]},${BASE}Z`} fill={C.coral} fillOpacity="0.24" />}
    <path data-native-mark data-native-bound d={`M${x(end)},${BASE}V${TOP + 10}`} stroke={C.coral} strokeWidth="2" strokeDasharray="5 5" />
    <Label x={X0} y={BASE + 75} text={String(low)} width={90} />
    <Label x={X1} y={BASE + 75} text={String(high)} width={90} anchor="end" />
  </g>;
}

function Marker({at, height = 1, label, color = C.coral}) {
  return <g>
    <path data-native-mark data-native-bound d={`M${px(at)},${BASE}V${py(height)}`} stroke={color} strokeWidth="3" strokeDasharray="6 5" />
    {label && <Label x={px(at) + 10} y={BASE - 14} text={label} width={160} color={color} />}
  </g>;
}

function parseTable(lines) {
  for (const line of [...lines].reverse()) {
    if (!line.value) continue;
    const cells = String(line.value).trim().replace(/\.$/, '').split(/[;\u00b7]/u).map(cell => {
      const text = cell.trim();
      return text.match(/^(-?\d+(?:[.,]\d+)?)\s*:\s*(-?\d+(?:[.,]\d+)?)$/)
        || text.match(/^P\(\s*X\s*=\s*(-?\d+(?:[.,]\d+)?)\s*\)\s*=\s*(-?\d+(?:[.,]\d+)?)$/);
    });
    if (cells.length > 1 && cells.every(Boolean)) {
      const entries = cells.map(cell => ({value:Number(cell[1].replace(',', '.')), weight:Number(cell[2].replace(',', '.'))}));
      const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
      if (!entries.every(entry => Number.isFinite(entry.value) && Number.isFinite(entry.weight) && entry.weight >= 0) || !Number.isFinite(total) || total <= 0 || new Set(entries.map(entry => entry.value)).size !== entries.length) return null;
      return entries.sort((left, right) => left.value - right.value);
    }
  }
  return null;
}

function SymbolicDistribution({family, phase}) {
  const cdf = family === 'step-cdf' || family === 'cdf-difference';
  const inverse = family === 'uniform-invert';
  return <g data-native-distribution="symbolic">
    <Label x={80} y={80} text={inverse ? 'Q(u) = primer x con F(x) >= u' : cdf ? 'F(x) = P(X <= x)' : 'p_i = P(X = x_i)'} width={660} size={27} />
    <Label x={80} y={155} text={inverse ? 'Acumular p_i hasta alcanzar u' : cdf ? 'Sumar p_i para los valores x_i <= x' : family === 'mass-normalize' ? 'p_i = w_i / suma de w_j' : 'p_i >= 0; suma de p_i = 1'} width={660} />
    <path data-native-mark data-native-bound d={`M80,205H${mix(100, 730, phase)}`} stroke={C.green} strokeWidth="3" />
    <Label x={110} y={270} text="p_i" width={130} />
    <Label x={410} y={270} text="..." anchor="middle" width={130} />
    <Label x={710} y={270} text="p_j" anchor="end" width={130} />
    <path data-native-mark data-native-bound data-native-symbolic="sum" d="M110,290V340H710V290M410,340V375" fill="none" stroke={C.green} strokeWidth="3" />
    <Label x={410} y={415} text={inverse ? 'Suma acumulada hasta u' : cdf ? 'Suma sobre x_i <= x' : 'Suma de masas simbolicas'} anchor="middle" width={600} />
  </g>;
}

function Mass({lines, phase, action, family}) {
  const values = parseTable(lines);
  if (!values) return <SymbolicDistribution {...{family, phase}} />;
  const total = values.reduce((sum, entry) => sum + entry.weight, 0);
  if (family !== 'mass-normalize' && Math.abs(total - 1) > 1e-9) return <SymbolicDistribution {...{family, phase}} />;
  const max = Math.max(...values.map(entry => entry.weight));
  const normalized = family !== 'mass-normalize' || Math.abs(total - 1) < 1e-9;
  const threshold = phase;
  let cumulative = 0;
  const cdf = family === 'step-cdf' || family === 'cdf-difference';
  const cdfPoints = [[px(0.08), BASE]];
  return <g data-native-distribution="numeric">
    <Axis xLabel={cdf ? 'Umbral x' : 'Valores de X'} yLabel={cdf ? 'F(x)' : normalized ? 'Masa' : 'Peso relativo'} />
    {values.map((entry, index) => {
      const position = 0.18 + index * 0.64 / Math.max(1, values.length - 1);
      const weight = entry.weight / (normalized || cdf ? total : max);
      const selected = position <= threshold;
      const previous = cumulative;
      cumulative += entry.weight / total;
      cdfPoints.push([px(position), py(previous)], [px(position), py(cumulative)]);
      return <g key={index} data-native-value={entry.value} data-native-weight={entry.weight}>
        {!cdf && <>
          <rect data-native-bound x={px(position) - 25} y={py(weight * 0.85)} width="50" height={BASE - py(weight * 0.85)} fill={C.green} />
          <circle data-native-mark data-native-bound cx={px(position)} cy={mix(BASE, py(weight * 0.85), phase)} r="7" fill={selected ? C.coral : C.gold} />
        </>}
        {cdf && <>
          <circle data-native-mark data-native-bound cx={px(position)} cy={py(previous)} r="5" fill={C.paper} stroke={C.green} strokeWidth="2" />
          <circle data-native-bound cx={px(position)} cy={py(cumulative)} r="5" fill={C.green} />
        </>}
        <Label x={px(position)} y={BASE + 34} text={String(entry.value)} anchor="middle" width={100} />
      </g>;
    })}
    {cdf && <path data-native-mark data-native-bound d={pathFor([...cdfPoints, [px(0.95), py(1)]])} pathLength="1" strokeDasharray={`${phase} 1`} fill="none" stroke={C.green} strokeWidth="4" />}
    <Marker at={threshold} height={0.95} label={cdf ? 'x' : ''} />
  </g>;
}

function Mapping({phase, indicator = false}) {
  return <g>
    <Label x={105} y={65} text="Resultados observables" />
    <Label x={530} y={65} text={indicator ? 'Indicador del suceso' : 'Valor de la variable'} width={260} />
    {[0, 1, 2, 3, 4, 5].map(index => {
      const origin = {x:130 + (index % 2) * 90, y:120 + Math.floor(index / 2) * 95};
      const target = {x:600, y:indicator ? 150 + (index % 2) * 150 : 120 + (index % 3) * 95};
      return <g key={index}>
        <path data-native-bound d={`M${origin.x},${origin.y}Q420,${origin.y} ${target.x},${target.y}`} stroke={C.line} strokeWidth="2" fill="none" />
        <circle data-native-mark data-native-bound cx={mix(origin.x, target.x, phase)} cy={mix(origin.y, target.y, phase)} r="13" fill={index % 2 ? C.coral : C.green} />
        <circle cx={origin.x} cy={origin.y} r="5" fill={C.muted} />
      </g>;
    })}
    {[0, 1, ...(indicator ? [] : [2])].map(index => <Label key={index} x={640} y={indicator ? 157 + index * 150 : 127 + index * 95} text={indicator ? String(index) : `x${index + 1}`} width={100} />)}
  </g>;
}

function Indicator({phase, action}) {
  const overlap = action === 'combine' || action === 'interval';
  const pointX = mix(205, 535, phase);
  const inA = Math.abs(pointX - 320) <= 135;
  const inB = Math.abs(pointX - 470) <= 135;
  return <g>
    <Label x={80} y={60} text="Dos sucesos: contar la interseccion una sola vez" width={660} />
    <circle data-native-bound cx={320} cy={230} r="135" fill={C.green} fillOpacity="0.16" stroke={C.green} strokeWidth="3" />
    <circle data-native-bound cx={470} cy={230} r="135" fill={C.blue} fillOpacity="0.16" stroke={C.blue} strokeWidth="3" />
    <Label x={235} y={145} text="A" width={100} color={C.green} />
    <Label x={530} y={145} text="B" width={100} color={C.blue} />
    <circle data-native-mark data-native-bound cx={pointX} cy={230} r="12" fill={overlap && inA && inB ? C.gold : C.coral} />
    <Label x={220} y={410} text={`I_A = ${inA ? 1 : 0}`} width={190} />
    <Label x={450} y={410} text={`I_B = ${inB ? 1 : 0}`} width={190} />
    {overlap && <path data-native-mark data-native-bound d={`M395,280V${mix(285, 365, phase)}`} stroke={C.gold} strokeWidth="7" />}
  </g>;
}

function Moments({phase, family, lines}) {
  const source = lines.map(line => `${line.tex || ''} ${line.value || ''}`).join(' ');
  const fourth = /\^4|mu_4|mu\{4\}/.test(source);
  const third = !fourth && /\^3|mu_3|mu\{3\}/.test(source);
  const exponent = fourth ? '4' : third ? '3' : 'k';
  const even = fourth || !third;
  const centered = family === 'moment-standardize';
  return <g>
    <Label x={80} y={60} text={centered ? 'Centrar, elevar y dividir por la escala' : 'Potencias ordinarias y potencias centradas'} width={660} />
    <path data-native-bound d="M90,245H745M405,105V385" stroke={C.muted} strokeWidth="2" />
    {[-1, 1].map((sign, index) => {
      const startX = 405 + sign * 230;
      const targetY = even ? 150 : 245 - sign * 95;
      return <g key={sign}>
        <path data-native-mark data-native-bound d={`M${startX},245V${mix(245, targetY, phase)}`} stroke={index ? C.blue : C.coral} strokeWidth="45" opacity="0.65" />
        <circle data-native-mark data-native-bound cx={mix(startX, 405 + sign * 115, phase)} cy={mix(340, targetY, phase)} r="12" fill={index ? C.blue : C.coral} />
        <Label x={startX} y={425} text={`${sign < 0 ? '(-d)' : 'd'}^${exponent}`} width={160} anchor="middle" />
      </g>;
    })}
    <Label x={405} y={465} text={centered ? `mu_${exponent} / sigma^${exponent}` : `E[X^${exponent}]   /   E[(X - mu)^${exponent}]`} width={650} anchor="middle" size={21} />
  </g>;
}

function Density({family, phase, action, lines}) {
  const plot = sourcePlot(lines);
  if (plot) return <AuthoredCurve plot={plot} phase={phase} />;
  const triangle = /triangle|moment-area/.test(family);
  const cumulative = family === 'density-cdf';
  const limit = /tail/.test(action) ? [phase, 1] : [0, phase];
  return <g>
    <Axis xLabel="x" yLabel={cumulative ? 'F(x)' : 'Densidad: el area mide probabilidad'} />
    <Curve fn={value => cumulative ? value * value : triangle ? value * 0.9 : 0.65} shade={cumulative ? null : limit} sweep={cumulative ? phase : 1} />
    <Marker at={phase} height={cumulative ? phase * phase : triangle ? phase * 0.9 : 0.65} label="x" />
    {!cumulative && <rect data-native-mark data-native-bound x={px(phase)} y={py(triangle ? phase * 0.9 : 0.65)} width={mix(60, 1, phase)} height={260 * (triangle ? phase * 0.9 : 0.65)} fill={C.coral} fillOpacity="0.35" />}
  </g>;
}

function Balance({phase, squared = false, transform = false, scale = false, action, story, cueIndex}) {
  const weightedMean = story?.mode === 'weighted-mean';
  const spreading = scale ? 0.5 + phase * 0.7 : 1;
  const center = scale && action === 'rescale' ? 350 + phase * 90 : 400;
  return <g>
    <Label x={90} y={62} text={squared ? 'Distancias al centro' : transform ? 'Transformar valores, conservar pesos' : 'Centro de masas'} width={640} />
    <path data-native-bound d={`M${center - 23},390L${center},350L${center + 23},390Z`} fill={C.muted} />
    <path data-native-mark data-native-bound d={`M${center - 280},350L${center + 280},350`} stroke={C.green} strokeWidth="6" transform={`rotate(${(1 - phase) * 8},${center},350)`} />
    {(weightedMean ? [-1, 1] : [-1, 0, 1]).map((distance, index) => {
      const x = center + distance * 190 * spreading;
      const size = squared ? Math.abs(distance) * mix(25, 100, phase) : 34;
      const y = transform ? mix(275, 275 - distance * distance * 100, phase) : 295;
      return <g key={distance}>
        <path data-native-mark data-native-bound d={`M${center},205H${x}V${y}`} stroke={C.coral} strokeWidth="3" fill="none" />
        {squared ? <rect data-native-mark data-native-bound x={x - size / 2} y={295 - size} width={Math.max(3, size)} height={Math.max(3, size)} fill={C.coral} fillOpacity="0.32" stroke={C.coral} /> : <circle data-native-mark data-native-bound cx={x} cy={y} r={weightedMean ? 23 : index === 1 ? 26 : 20} fill={C.green} />}
        <Label x={x} y={430} text={weightedMean && cueIndex >= story.reveals[index] ? String(story.values[index]) : story?.mode === 'weighted-deviations' && cueIndex >= story.revealCue ? String(cueIndex >= story.squareCue ? distance * distance : story.values[index]) : squared ? distance ? 'd' : '0' : `x${index + 1}`} width={100} anchor="middle" />
        {weightedMean && cueIndex >= story.reveals[index] && <Label x={x} y={465} text={String(story.weights[index])} width={110} anchor="middle" size={18} color={C.muted} />}
        {story?.mode === 'weighted-deviations' && cueIndex >= story.revealCue && <Label x={x} y={465} text={String(story.weights[index])} width={110} anchor="middle" size={18} color={C.muted} />}
      </g>;
    })}
    <Label x={center} y={170} text={weightedMean && cueIndex >= story.reveals[2] ? `E[X] = ${story.mean}` : squared ? 'E[X]' : 'Centro ponderado'} anchor="middle" width={250} />
  </g>;
}

function Transform({family, phase, action, story, cueIndex, lines}) {
  if (family === 'uniform-invert') return <Inversion {...{phase, story, cueIndex, lines}} />;
  if (family === 'uniform-compare') return <UniformComparison phase={phase} />;
  const quantile = /quantile|invert/.test(family) || action === 'quantile';
  const power = /moment|transform/.test(family);
  return <g>
    <Axis xLabel={quantile ? 'Q(u): umbral' : 'x'} yLabel={quantile ? 'u: probabilidad acumulada' : 'g(x)'} />
    <Curve fn={value => power ? value * value : value} sweep={1} />
    <path data-native-mark data-native-bound d={`M${X0},${py(phase)}H${px(power ? Math.sqrt(phase) : phase)}V${BASE}`} fill="none" stroke={C.coral} strokeWidth="3" strokeDasharray="7 5" />
    <circle data-native-mark data-native-bound cx={px(power ? Math.sqrt(phase) : phase)} cy={py(phase)} r="8" fill={C.coral} />
  </g>;
}

function UniformComparison({phase}) {
  return <g>
    <Label x={80} y={60} text="Discreta: masas iguales" width={660} />
    {[0.1, 0.3, 0.5, 0.7, 0.9].map((position, index) => <g key={position}>
      <path data-native-bound d={`M${px(position)},180v-60`} stroke={C.green} strokeWidth="28" />
      <circle data-native-mark data-native-bound cx={px(position)} cy={mix(180, 120, phase)} r="7" fill={C.coral} />
      <Label x={px(position)} y={215} text={index === 4 ? 'b' : index === 0 ? 'a' : '...'} width={80} anchor="middle" />
    </g>)}
    <Label x={80} y={280} text="Continua: areas iguales a igual longitud" width={660} />
    <rect data-native-bound x={X0} y={315} width={X1 - X0} height="70" fill={C.soft} stroke={C.green} strokeWidth="3" />
    <rect data-native-mark data-native-bound x={mix(X0, X1 - 130, phase)} y={315} width="130" height="70" fill={C.coral} fillOpacity="0.4" />
  </g>;
}

function Inversion({phase, story, cueIndex, lines}) {
  const concrete = story?.mode === 'discrete-inversion';
  const entries = concrete ? story.states.map((value, index) => ({value, weight:story.masses[index]})) : parseTable(lines);
  if (!entries) return <SymbolicDistribution family="uniform-invert" phase={phase} />;
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (Math.abs(total - 1) > 1e-9) return <SymbolicDistribution family="uniform-invert" phase={phase} />;
  const visibleInputs = concrete ? story.inputs.filter(input => input.cue <= cueIndex) : [];
  const input = visibleInputs.at(-1);
  const value = input ? input.value : phase;
  let left = 0;
  return <g>
    <Label x={80} y={65} text="Invertir: buscar el primer acumulado que alcanza U" width={650} />
    {entries.map((entry, index) => {
      const start = left;
      left += entry.weight / total;
      return <g key={index}>
        <rect data-native-bound x={px(start)} y={120} width={(X1 - X0) * entry.weight / total} height="65" fill={[C.green, C.blue, C.coral][index % 3]} fillOpacity="0.3" />
        <path data-native-bound d={`M${px(left)},110V200`} stroke={C.muted} strokeWidth="2" />
        <Label x={px((start + left) / 2)} y={160} text={String(entry.value)} width={100} anchor="middle" />
        {concrete && <Label x={px(left)} y={220} text={String(story.cuts[index])} width={110} anchor="middle" size={18} />}
        <path data-native-mark data-native-bound d={`M${px((start + left) / 2)},245L${px(index / Math.max(1, entries.length - 1) * 0.8 + 0.1)},${mix(245, 350, phase)}`} stroke={[C.green, C.blue, C.coral][index % 3]} strokeWidth="3" />
        <Label x={px(index / Math.max(1, entries.length - 1) * 0.8 + 0.1)} y={390} text={String(entry.value)} width={110} anchor="middle" />
      </g>;
    })}
    <circle data-native-mark data-native-bound cx={px(value)} cy={mix(110, 120, phase)} r="10" fill={C.gold} />
    {input && <Label x={px(value)} y={98} text={`U=${input.value}`} width={130} anchor="middle" color={C.gold} />}
    {input && <Label x={90} y={450} text={`Q(${input.value}) = ${input.output}`} width={640} />}
  </g>;
}

function Trials({phase, family}) {
  const stop = /stop|memory/.test(family);
  const multiple = family === 'negative-stop';
  const positions = [0.08, 0.29, 0.71, 0.92];
  return <g>
    <Label x={80} y={68} text={stop ? 'Seguir ensayando hasta la meta' : 'Ensayos fijos; despues contar exitos'} width={650} />
    {positions.map((position, index) => {
      const final = index === positions.length - 1;
      const local = clamp(phase * positions.length - index);
      const reached = local > 0;
      return <g key={index} opacity={reached ? 1 : 0.18}>
        <circle data-native-mark data-native-bound cx={px(position)} cy={180} r={mix(17, 26, local)} fill={stop && !final ? C.coral : C.green} />
        <Label x={px(position)} y={240} text={stop ? final ? multiple ? 'Exito r' : 'Exito' : 'Fallo' : final ? 'I_n' : `I_${index + 1}`} anchor="middle" width={110} size={19} />
        {reached && <path data-native-mark data-native-bound d={`M${px(position)},270L${stop ? px(0.92) : 420},345`} stroke={C.green} strokeWidth="2" />}
      </g>;
    })}
    <Label x={px(0.5)} y={188} text="..." anchor="middle" width={100} size={32} />
    <Label x={420} y={390} text={stop ? 'Parada: exito final' : 'X = suma de indicadores'} anchor="middle" width={500} />
  </g>;
}

function Exposure({phase, family}) {
  const combine = family === 'poisson-superpose';
  return <g>
    <Axis xLabel="Exposicion / tiempo" yLabel={combine ? 'Superponer procesos independientes' : 'Contar llegadas dentro de la ventana'} />
    <rect data-native-mark data-native-bound x={X0} y={120} width={(X1 - X0) * phase} height="215" fill={C.soft} stroke={C.green} strokeWidth="2" />
    {[0.08, 0.24, 0.31, 0.61, 0.84].map((time, index) => <g key={time}>
      <path data-native-mark data-native-bound d={`M${px(time)},${combine && index % 2 ? 270 : 190}v60`} stroke={time <= phase ? C.coral : C.line} strokeWidth="5" />
      {combine && <path data-native-mark data-native-bound d={`M${px(time)},${mix(index % 2 ? 270 : 190, 310, phase)}v12`} stroke={C.blue} strokeWidth="4" />}
    </g>)}
    <Label x={80} y={425} text="Media de la ventana = tasa por exposicion" width={660} />
  </g>;
}

function Finite({phase, family, lines}) {
  const source = lines.map(line => line.value || '').join(' ');
  const design = source.match(/N:\s*(\d+);\s*K:\s*(\d+);\s*n:\s*(\d+)/);
  if (!design) return <g>
    <Label x={80} y={65} text="Sin reemplazo: cambia la composicion" width={650} />
    <rect data-native-bound x={90} y={105} width="280" height="240" fill={C.soft} stroke={C.green} strokeWidth="3" />
    <Label x={230} y={175} text="N elementos" anchor="middle" width={260} />
    <Label x={230} y={235} text="K de interes" anchor="middle" width={260} />
    <circle data-native-mark data-native-bound cx={mix(300, 610, phase)} cy={mix(270, 320, phase)} r="24" fill={C.coral} />
    <path data-native-bound d="M480,275V375H740V275" fill="none" stroke={C.muted} strokeWidth="3" />
    <Label x={610} y={425} text="Muestra n" anchor="middle" width={260} />
  </g>;
  const total = Number(design[1]);
  const special = Number(design[2]);
  const sample = Number(design[3]);
  const drawn = Math.min(sample, Math.floor(phase * (sample + 1)));
  const cap = Math.min(total, 40);
  return <g>
    <Label x={75} y={65} text="Poblacion finita: sin reemplazo" width={630} />
    {Array.from({length:cap}, (_, index) => {
      const selected = index < drawn;
      const local = clamp(phase * (sample + 1) - index);
      const startX = 105 + (index % 8) * 72;
      const startY = 135 + Math.floor(index / 8) * 70;
      return <circle key={index} data-native-mark data-native-bound cx={selected ? mix(startX, 230 + index * 95, local) : startX} cy={selected ? mix(startY, 350, local) : startY} r="20" fill={index < special ? C.green : C.gold} opacity={!selected && index < drawn ? 0 : 1} />;
    })}
    <path data-native-bound d="M150,320V395H680V320" fill="none" stroke={C.muted} strokeWidth="3" />
    <Label x={170} y={435} text={family === 'finite-support' ? 'El soporte esta limitado por las existencias' : 'Muestra: lo retirado ya no esta disponible'} width={590} />
  </g>;
}

function Waiting({family, phase, action}) {
  const memory = /memory/.test(family) || action === 'condition';
  const offset = memory ? phase * 0.4 : 0;
  const waiting = memory ? 0.35 + phase * 0.4 : phase;
  return <g>
    <Axis xLabel="Tiempo de espera t" yLabel={family === 'waiting-area' ? 'Densidad y area acumulada' : 'Supervivencia S(t)'} />
    <Curve fn={value => jStat.exponential.pdf(value, 1)} low={0} high={5} shade={family === 'waiting-area' ? [0, phase] : [waiting, 1]} />
    <Marker at={waiting} height={Math.exp(-5 * waiting)} label={memory ? 's + t' : 't'} />
    {memory && <>
      <Curve fn={value => value < 5 * offset ? 0 : jStat.exponential.pdf(value, 1) / Math.exp(-5 * offset)} low={0} high={5} color={C.blue} />
      <path data-native-mark data-native-bound d={`M${px(offset)},420H${px(waiting)}`} stroke={C.blue} strokeWidth="6" />
      <Marker at={offset} height={0.9} label="s" color={C.blue} />
      <Label x={100} y={460} text="Condicionar: conservar la cola y renormalizar" width={650} size={20} />
    </>}
  </g>;
}

function NormalStandardization({story, cueIndex, phase}) {
  const model = normalStandardizationState(story, cueIndex);
  const markerX = px(model.observationAt);
  const markerY = py(2.2 * jStat.normal.pdf(model.z, 0, 1));
  const ticks = [
    {key:'center', at:model.centerAt, value:model.center, color:C.green},
    ...(model.observationVisible ? [{key:'observation', at:model.observationAt, value:model.value, color:C.coral}] : []),
  ];
  return <g data-normal-domain={model.domain.join(',')} data-normal-axis={model.axis}>
    <Label x={70} y={45} text={model.title} width={660} size={22} />
    <path data-native-bound d={`M${X0},${TOP}V${BASE}H${X1 + 20}`} fill="none" stroke={C.muted} strokeWidth="2" />
    <path data-native-bound d={`M${px(model.centerAt)},${TOP}V${BASE}`} stroke={C.line} strokeWidth="2" strokeDasharray="5 7" />
    <path data-normal-scale data-native-bound d={`M${px(model.centerAt)},106v8H${px(model.unitAt)}v-8`} fill="none" stroke={C.muted} strokeWidth="2" />
    <Label x={px((model.centerAt + model.unitAt) / 2)} y={99} text={model.units ? `${story.sd} mm` : '1 desviacion'} width={180} anchor="middle" size={18} color={C.muted} />
    <Curve fn={value => jStat.normal.pdf(value, 0, 1)} low={-4} high={4} scale={2.2} />
    {model.observationVisible && <>
      <path data-normal-observation data-native-mark data-native-bound d={`M${markerX},${BASE}V${markerY}`} stroke={C.coral} strokeWidth="3" strokeDasharray="6 5" />
      <circle data-native-mark data-native-bound cx={markerX} cy={markerY} r={5 + 2 * phase} fill={C.coral} />
    </>}
    {ticks.map(tick => <g key={tick.key} data-normal-tick={tick.key} data-normal-value={tick.value}>
      <path data-native-bound d={`M${px(tick.at)},${BASE}v8`} stroke={tick.color} strokeWidth="2" />
      <Label x={px(tick.at)} y={394} text={`${tick.value}${model.units}`} anchor="middle" width={78} size={18} color={tick.color} />
    </g>)}
    <Label x={755} y={394} text={model.axis} width={150} anchor="end" size={18} color={C.muted} />
    {model.observationVisible && model.operation && <>
      <path data-native-mark data-native-bound d={`M${px(model.centerAt)},410v8H${markerX}v-8`} fill="none" stroke={C.blue} strokeWidth="3" />
      <Label x={px((model.centerAt + model.observationAt) / 2)} y={452} text={model.operation} width={330} anchor="middle" size={22} color={C.blue} />
    </>}
  </g>;
}

function Normal({family, phase, action, lines, story, cueIndex}) {
  if (story?.mode === 'normal-standardize') return <NormalStandardization {...{story, cueIndex, phase}} />;
  const plot = sourcePlot(lines);
  if (plot) return <AuthoredCurve plot={plot} phase={phase} />;
  const standardized = /standardize|model-normal/.test(family) || action === 'standardize';
  const quantile = /quantile/.test(family) || action === 'quantile';
  const threshold = quantile ? jStat.normal.inv(0.05 + 0.9 * phase, 0, 1) : mix(-1, 2, phase);
  const at = (threshold + 4) / 8;
  const shade = action === 'tail' || family === 'normal-tail' ? [at, 1] : quantile ? [0, at] : null;
  return <g>
    <Axis xLabel={standardized ? 'De X a Z: centrar y dividir por sigma' : 'z'} yLabel="Area bajo la normal" mid />
    <Curve fn={value => jStat.normal.pdf(value, 0, 1)} low={-4} high={4} scale={2.2} shade={shade} />
    <Marker at={at} height={2.2 * jStat.normal.pdf(threshold, 0, 1)} label={quantile ? 'q' : 'z'} />
    {standardized && <>
      <path data-native-mark data-native-bound d={`M${px(0.5)},415H${px(mix(0.8, 0.65, phase))}`} stroke={C.blue} strokeWidth="5" />
      <Label x={105} y={458} text="x - mu                         (x - mu) / sigma" width={650} size={20} />
    </>}
  </g>;
}

function Gamma({family, phase, lines}) {
  const plot = sourcePlot(lines);
  if (plot) return <AuthoredCurve plot={plot} phase={phase} />;
  const area = /area|normalize/.test(family);
  return <g>
    <Axis xLabel="Tiempo total" yLabel={area ? 'Acumular area de la densidad gamma' : 'Sumar etapas con una escala comun'} />
    {area ? <Curve fn={value => jStat.gamma.pdf(value, 3, 1)} low={0} high={10} scale={3.5} shade={[0, phase]} /> : <>
      {[0, 1, 2].map(index => <g key={index}>
        <rect data-native-mark data-native-bound x={px(index * 0.29)} y={130 + index * 65} width={(X1 - X0) * 0.26 * clamp(phase * 3 - index)} height="40" fill={[C.green, C.blue, C.coral][index]} />
        <path data-native-mark data-native-bound d={`M${px(index * 0.29)},${130 + index * 65}V330`} stroke={C.line} strokeWidth="2" />
      </g>)}
      <rect data-native-mark data-native-bound x={X0} y={330} width={(X1 - X0) * phase * 0.84} height="22" fill={C.gold} />
    </>}
    {area && <Marker at={phase} height={0.9} label="t" />}
  </g>;
}

function HeavyTails({family, phase, lines}) {
  const plot = sourcePlot(lines);
  if (plot) return <AuthoredCurve plot={plot} phase={phase} />;
  const cauchy = family.startsWith('cauchy');
  const risk = family === 'weibull-risk';
  return <g>
    <Axis xLabel={cauchy ? 'x: las colas no terminan en la ventana' : 'Tiempo t'} yLabel={cauchy ? 'Simetria no implica esperanza finita' : risk ? 'Riesgo instantaneo' : 'Supervivencia'} mid={cauchy} />
    {cauchy ? <>
      <Curve fn={value => jStat.cauchy.pdf(value, 0, 1)} low={-8} high={8} scale={2.8} shade={family === 'cauchy-area' ? [0.5 - phase * 0.2, 0.5 + phase * 0.2] : [0.85 - phase * 0.15, 1]} />
      <path data-native-mark data-native-bound d={`M${px(0.5 - phase * 0.43)},400H${px(0.5 + phase * 0.43)}`} stroke={C.coral} strokeWidth="5" />
    </> : risk ? [0.6, 1, 2].map((shape, index) => <Curve key={shape} fn={value => shape * Math.pow(Math.max(0.08, value), shape - 1) / 3} low={0.08} high={1.5} sweep={phase} color={[C.blue, C.green, C.coral][index]} />) : <Curve fn={value => 1 - jStat.weibull.cdf(value, 1, mix(0.7, 2, phase))} low={0} high={3} shade={[phase, 1]} />}
  </g>;
}

function Likelihood({family, phase, lines}) {
  const link = family === 'family-link' || family === 'family-binomial';
  const sampleLine = [...lines].reverse().find(line => /muestra|datos observados|dato original/i.test(line.label || '') && typeof line.value === 'string' && (/\[[\d,\s]+\]|^\d+(?:\s*;\s*\d+)+|^\d+(?:,\s*\d+)+\s+y\s+\d+/.test(line.value)));
  const bracket = sampleLine?.value.match(/\[[\d,\s]+\]/)?.[0];
  const list = sampleLine?.value.split(';')[0];
  const sample = bracket ? JSON.parse(bracket) : list?.includes(' y ') ? list.split(/,|\s+y\s+/).map(Number) : sampleLine?.value.split(';').filter(cell => /^\s*\d+\s*$/.test(cell)).map(Number);
  const known = sample?.length > 0;
  const data = known ? sample : null;
  const count = data?.length;
  const total = data?.reduce((sum, value) => sum + value, 0);
  const candidate = 0.15 + phase * 3.5;
  const logL = value => total * Math.log(value) - count * value - data.reduce((sum, entry) => sum + jStat.gammaln(entry + 1), 0);
  const maximum = known ? logL(Math.max(0.001, total / count)) : 0;
  return <g>
    <Axis xLabel={link ? 'Predictor / parametro natural' : 'Parametro candidato'} yLabel={link ? 'Media del modelo' : family === 'likelihood-log' ? 'Log-verosimilitud: el maximo no cambia' : 'Comparacion de verosimilitudes'} />
    {link ? <Curve fn={value => 1 / (1 + Math.exp(-value))} low={-5} high={5} sweep={phase} /> : known ? <>
      <Curve fn={value => family === 'likelihood-log' ? Math.max(0, 0.9 + (logL(value) - maximum) / 10) : Math.exp(logL(value) - maximum) * 0.9} low={0.01} high={4} />
      <Marker at={candidate / 4} height={family === 'likelihood-log' ? Math.max(0, 0.9 + (logL(candidate) - maximum) / 10) : Math.exp(logL(candidate) - maximum) * 0.9} label="lambda" />
    </> : <>
      {[0, 1, 2].map(index => <g key={index}>
        <rect data-native-mark data-native-bound x={120 + index * 205} y={mix(220, 100 + index * 35, phase)} width="125" height="70" fill={[C.soft, '#e6eff6', '#f7e6ec'][index]} stroke={[C.green, C.blue, C.coral][index]} strokeWidth="2" />
        <Label x={182 + index * 205} y={mix(260, 140 + index * 35, phase)} text={['h(x)', 'T(x)', 'A(eta)'][index]} anchor="middle" width={125} />
        <path data-native-mark data-native-bound d={`M${182 + index * 205},285L405,330`} stroke={C.muted} strokeWidth="2" />
      </g>)}
      <Label x={400} y={450} text="Datos fijos; parametro variable" anchor="middle" width={500} />
    </>}
    {data && data.map((value, index) => <g key={index}>
      <circle data-native-bound cx={145 + index * 60} cy={420} r="17" fill={C.soft} stroke={C.green} />
      <Label x={145 + index * 60} y={427} text={String(value)} anchor="middle" width={50} size={19} />
    </g>)}
  </g>;
}

function ModelOperation({phase, action, family}) {
  const choose = family === 'model-mechanism';
  const labels = choose ? ['Soporte', 'Diseno', 'Modelo'] : ['Punto', 'Intervalo', 'Cuantil'];
  const selected = action === 'quantile' ? 2 : action === 'interval' || action === 'tail' ? 1 : 0;
  return <g>
    {labels.map((text, index) => <g key={text}>
      <rect data-native-bound x={90 + index * 225} y={70} width="185" height="64" fill={index === selected ? C.soft : C.paper} stroke={index === selected ? C.green : C.line} strokeWidth="2" />
      <Label x={182 + index * 225} y={110} text={text} anchor="middle" width={185} />
      <path data-native-mark data-native-bound d={`M${182 + index * 225},150V${mix(155, 215, phase)}`} stroke={index === selected ? C.coral : C.line} strokeWidth="4" />
    </g>)}
    <g transform="translate(0,100) scale(1,.65)">
      <Axis xLabel="Comprobar extremos y unidades" />
      <Curve fn={value => value} shade={action === 'tail' ? [phase, 1] : [0, phase]} />
      <Marker at={phase} label="x" />
    </g>
  </g>;
}

function Story({family, phase, action, lines, story, cueIndex}) {
  if (family === 'observation-map') return <Mapping phase={phase} />;
  if (family === 'indicator') return <Indicator {...{phase, action}} />;
  if (/^(step-cdf|cdf-difference|mass-)/.test(family)) return <Mass {...{family, phase, action, lines}} />;
  if (/^density-/.test(family) || family === 'moment-area') return <Density {...{family, phase, action, lines}} />;
  if (/^(expectation-|squared-deviations|variance-|transform-average)/.test(family)) return <Balance {...{phase, action, story, cueIndex}} squared={family.startsWith('variance-') || family === 'squared-deviations'} transform={family === 'transform-average'} scale={family === 'variance-scale'} />;
  if (family === 'moment-powers' || family === 'moment-standardize') return <Moments {...{family, phase, lines}} />;
  if (/^(transform-support|uniform-)/.test(family)) return <Transform {...{family, phase, action, story, cueIndex, lines}} />;
  if (/^(binomial-|geometric-|negative-)/.test(family)) return <Trials {...{family, phase}} />;
  if (/^poisson-/.test(family)) return <Exposure {...{family, phase}} />;
  if (/^finite-/.test(family)) return <Finite {...{family, phase, lines}} />;
  if (/^waiting-/.test(family)) return <Waiting {...{family, phase, action}} />;
  if (/^normal-/.test(family) || family === 'model-normal') return <Normal {...{family, phase, action, story, cueIndex, lines}} />;
  if (/^gamma-/.test(family)) return <Gamma {...{family, phase, lines}} />;
  if (/^(cauchy-|weibull-)/.test(family)) return <HeavyTails {...{family, phase, lines}} />;
  if (/^(family-|likelihood-)/.test(family)) return <Likelihood {...{family, phase, lines}} />;
  if (/^model-/.test(family)) return <ModelOperation {...{family, phase, action}} />;
  throw new RangeError(`Unsupported univariate scene family: ${family}`);
}

function Description({line, progress, cueIndex, hasEquations}) {
  const rowCount = (text, size) => {
    const limit = Math.max(4, Math.floor(340 / (size * 0.56)));
    let rows = 1;
    let length = 0;
    for (const word of String(text).split(/\s+/u)) {
      if (length && length + 1 + word.length > limit) {rows++; length = word.length;}
      else length += (length ? 1 : 0) + word.length;
    }
    return rows;
  };
  const label = line.label || '';
  const value = String(line.value ?? '');
  const valueY = 80 + (rowCount(label, 18) - 1) * 22.5;
  const bottom = hasEquations ? 205 : 450;
  let size = 19;
  while (size > 1 && valueY + (rowCount(value, size) - 1) * size * 1.25 + size * 0.3 > bottom) size -= 0.5;
  return <g data-native-note opacity={(line.cue ?? 0) === cueIndex ? mix(0.25, 1, progress) : 1}>
    <Label x={830} y={55} text={label} width={340} size={18} color={C.muted} />
    {value && <Label x={830} y={valueY} text={value} width={340} size={size} />}
  </g>;
}

export function UnivariateScene({plan, state}) {
  const cueIndex = Math.max(0, Math.min(plan.cues.length - 1, state.cueIndex));
  const cue = plan.cues[cueIndex];
  const progress = clamp(Number.isFinite(state.progress) ? state.progress : 0);
  const phase = ease(progress);
  const lines = plan.sourceLines.filter(line => (line.cue ?? 0) <= cueIndex);
  const story = plan.data?.story;
  const modelLines = [...(story?.priorInputs || []), ...lines];
  const equations = lines.filter(line => line.tex).slice(-3);
  const descriptions = lines.filter(line => !line.tex && (line.value || line.label)).slice(-1);
  return <SceneSurface label={plan.family}>
    <svg width="1200" height="480" viewBox="0 0 1200 480" style={{position:'absolute', inset:0}}>
      <Story family={plan.family} phase={phase} action={cue.action} lines={modelLines} story={story} cueIndex={cueIndex} />
      <path d="M800,30V450" stroke={C.line} strokeWidth="2" />
      {descriptions.map((line, index) => <Description key={`${line.cue}-${index}`} {...{line, progress, cueIndex}} hasEquations={equations.length > 0} />)}
    </svg>
    {equations.map((line, index) => <MathFormula key={`${line.cue}-${index}-${line.tex}`} tex={line.tex} x={815} y={225 + index * 76} width={370} fontSize={line.tex.length > 100 ? 14 : line.tex.length > 65 ? 17 : 22} opacity={(line.cue ?? 0) === cueIndex ? mix(0.15, 1, progress) : 1} />)}
  </SceneSurface>;
}