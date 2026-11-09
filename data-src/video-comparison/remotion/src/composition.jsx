import React, {useEffect, useState} from 'react';
import katex from 'katex';
import {AbsoluteFill, Audio, Composition, Sequence, continueRender, delayRender, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import script from '../public/script.json';
import {captionLines, frameAt} from './timing.mjs';
import 'katex/dist/katex.min.css';
import './style.css';

const colors = {ink: '#173c33', green: '#008b70', gold: '#b87911', coral: '#bf5547', grid: '#dce5df'};
const baseline = 346;
const x = time => 74 + time * 294;
const y = density => baseline - density * 280;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const progress = (frame, from, to) => interpolate(frame, [from, to], [0, 1], clamp);
const uniformEnd = frameAt(script.models[1].start);
const increasingEnd = frameAt(script.models[2].start);

function MathText({formula, size = 31, className = '', style = {}}) {
  return <div className={`formula ${className}`} style={{fontSize: size, ...style}}
    dangerouslySetInnerHTML={{__html: katex.renderToString(formula, {throwOnError: true, displayMode: true, output: 'html'})}} />;
}

function FontGate() {
  const [handle] = useState(() => delayRender('Load local typography'));
  useEffect(() => {
    let active = true;
    Promise.all([
      document.fonts.load('30px VideoSans'),
      document.fonts.load('36px VideoSerif'),
      document.fonts.load('30px KaTeX_Main'),
      document.fonts.load('italic 30px KaTeX_Math'),
      document.fonts.load('30px KaTeX_Size1'),
      document.fonts.load('30px KaTeX_Size2'),
      document.fonts.load('30px KaTeX_Size3'),
      document.fonts.load('30px KaTeX_Size4'),
    ]).then(() => document.fonts.ready).then(() => {if (active) continueRender(handle);});
    return () => {active = false;};
  }, [handle]);
  return null;
}

function Axes({model, interval, boundary = false, children}) {
  return <svg className="chart" viewBox="0 0 790 446" aria-label={`Densidad ${model}`}>
    <defs>
      <pattern id="selected-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(30)">
        <line x1="0" y1="0" x2="0" y2="12" stroke={colors.green} strokeOpacity=".13" strokeWidth="3" />
      </pattern>
    </defs>
    <text x="74" y="28" className="axis-title">Densidad f(t) [min<tspan baselineShift="super" fontSize="14">-1</tspan>]</text>
    <text x="344" y="28" className="support-note">Soporte [0, 2] min; f(t) = 0 fuera.</text>
    {[0.25, 0.5, 0.75, 1].map(value => <g key={value}>
      <line x1={x(0)} x2={x(2.16)} y1={y(value)} y2={y(value)} stroke={colors.grid} strokeWidth="1" />
      <text x="59" y={y(value) + 6} textAnchor="end" className="tick">{value}</text>
    </g>)}
    {children}
    <path d={`M${x(-0.13)},${baseline} H${x(2.18)} M${x(0)},${baseline + 6} V${y(1.08)}`} fill="none" stroke={colors.ink} strokeWidth="2" />
    <path d={`M${x(2.18)-8},${baseline-5} L${x(2.18)},${baseline} L${x(2.18)-8},${baseline+5}`} fill="none" stroke={colors.ink} strokeWidth="2" />
    {[0, 2].map(value => <g key={value}>
      <line x1={x(value)} x2={x(value)} y1={baseline} y2={baseline + 7} stroke={colors.ink} strokeWidth="2" />
      <text x={x(value)} y={baseline + 29} textAnchor="middle" className="tick">{value}</text>
    </g>)}
    {interval && [0.4, 1.2].map(value => <g key={value}>
      <line x1={x(value)} x2={x(value)} y1={y(model === 'uniform' ? 0.5 : model === 'increasing' ? value / 2 : value < 1 ? 0.25 : 0.75)} y2={baseline + 9}
        stroke={colors.green} strokeWidth="2" strokeDasharray="5 5" />
      <text x={x(value)} y={baseline + 31} textAnchor="middle" className="interval-tick">{value}</text>
    </g>)}
    {boundary && <g>
      <line x1={x(1)} x2={x(1)} y1={y(0.9)} y2={baseline + 8} stroke={colors.gold} strokeWidth="2" strokeDasharray="6 5" />
      <text x={x(1)} y={y(0.93)} textAnchor="middle" className="boundary-label">Frontera t = 1</text>
      <text x={x(1)} y={baseline + 31} textAnchor="middle" className="tick">1</text>
    </g>}
    <text x={x(2.15)} y={baseline + 64} textAnchor="end" className="axis-title">Tiempo t [min]</text>
  </svg>;
}

function ModelHeading({number, label, title}) {
  return <>
    <div className="model-heading"><span className="model-number">{number} / 03</span><span>{label}</span></div>
    <h2 className="model-title">{title}</h2>
  </>;
}

function WidthBracket({opacity = 1, label = '0.8 min'}) {
  return <g opacity={opacity}>
    <path d={`M${x(0.4)},${baseline+42} v8 H${x(1.2)} v-8`} stroke={colors.green} strokeWidth="2" fill="none" />
    <text x={x(0.8)} y={baseline + 75} textAnchor="middle" className="width-label">{label}</text>
  </g>;
}

function Uniform() {
  const frame = useCurrentFrame();
  const time = frame / script.fps;
  const interval = time >= script.cues[1].start;
  const selected = progress(frame, frameAt(11.9), frameAt(14.8));
  const whole = progress(frame, 0, 48);
  let panel;
  if (time < 4.7) panel = <>
    <p className="panel-label">Toda el area</p>
    <MathText formula="f(t)=0.5\;\mathrm{min}^{-1}" size={30} />
    <MathText formula="2\;\mathrm{min}\times 0.5\;\mathrm{min}^{-1}=1" size={27} />
    <p className="panel-note">Toda la probabilidad vive entre 0 y 2.</p>
  </>;
  else if (time < 8.8) panel = <>
    <p className="panel-label">Elegimos un intervalo</p>
    <MathText formula="0.4\leq T\leq 1.2" />
    <p className="panel-note">Solo cuenta el area comprendida entre estos dos limites.</p>
  </>;
  else if (time < 11.9) panel = <>
    <p className="panel-label">01 / Anchura</p>
    <MathText formula="1.2-0.4=0.8" size={36} />
    <p className="panel-note">0.8 minutos de tiempo.</p>
  </>;
  else if (time < 15.9) panel = <>
    <p className="panel-label">02 / Altura por anchura</p>
    <MathText formula="\underbrace{0.5}_{\text{altura}}\times\underbrace{0.8}_{\text{anchura}}" size={34} />
    <div className="area-product"><span style={{width: `${selected * 100}%`}} /></div>
    <p className="panel-note">El rectangulo acumula el area elegida.</p>
  </>;
  else if (time < 19.4) panel = <>
    <p className="panel-label">03 / Probabilidad, no densidad</p>
    <MathText formula="P(0.4\leq T\leq 1.2)" size={29} />
    <MathText formula="=\color{#008b70}{0.4}" size={58} />
    <p className="panel-note">La densidad es 0.5 por minuto.<br />El area elegida es 0.4.</p>
  </>;
  else panel = <>
    <p className="panel-label">04 / Las unidades se cancelan</p>
    <MathText formula="\frac{0.5}{\cancel{\mathrm{min}}}\times 0.8\,\cancel{\mathrm{min}}" size={34} />
    <MathText formula="=0.4" size={48} />
    <p className="panel-note">Probabilidad sin unidades.<br />Tiempo por tiempo inverso.</p>
  </>;
  return <AbsoluteFill>
    <ModelHeading number="01" label="MODELO 1 / DENSIDAD CONSTANTE" title="Un rectangulo, una probabilidad" />
    <Axes model="uniform" interval={interval}>
      <rect x={x(0)} y={y(0.5)} width={x(2 * whole)-x(0)} height={baseline-y(0.5)} fill="#dcebe4" />
      {interval && <rect x={x(0.4)} y={y(0.5)} width={x(1.2)-x(0.4)} height={baseline-y(0.5)} fill="url(#selected-hatch)" />}
      {selected > 0 && <rect x={x(0.4)} y={y(0.5)} width={(x(1.2)-x(0.4))*selected} height={baseline-y(0.5)} fill={colors.green} opacity=".64" />}
      <path d={`M${x(0)},${baseline} V${y(0.5)} H${x(2)} V${baseline}`} fill="none" stroke={colors.ink} strokeWidth="4" />
      <text x={x(1.6)} y={y(0.5)-19} textAnchor="middle" className="plot-label">f(t) = 0.5</text>
      {!interval && <text x={x(1)} y={y(0.25)} textAnchor="middle" className="area-label">Area total = 1</text>}
      {time >= 8.8 && <WidthBracket opacity={progress(frame, frameAt(8.8), frameAt(9.4))} />}
      {time >= 11.9 && <g>
        <path d={`M${x(0.4)-20},${baseline} h-8 V${y(0.5)} h8`} fill="none" stroke={colors.green} strokeWidth="2" />
        <text x={x(0.4)-37} y={y(0.25)+6} textAnchor="end" className="width-label">0.5</text>
      </g>}
    </Axes>
    <aside className="work-panel">{panel}</aside>
  </AbsoluteFill>;
}

function Increasing() {
  const frame = useCurrentFrame();
  const integralStart = frameAt(26.3 - script.models[1].start);
  const accumulated = progress(frame, integralStart, frameAt(30.2 - script.models[1].start));
  const strips = Math.round(interpolate(frame, [0, integralStart], [7, 24], clamp));
  const right = 0.4 + accumulated * 0.8;
  return <AbsoluteFill>
    <ModelHeading number="02" label="OTRO MODELO / DENSIDAD CRECIENTE" title="La altura ahora depende del tiempo" />
    <Axes model="increasing" interval>
      <path d={`M${x(0)},${baseline} L${x(2)},${y(1)} V${baseline} Z`} fill="#e5ece7" />
      {Array.from({length: strips}, (_, index) => {
        const left = 0.4 + index * 0.8 / strips;
        const width = 0.8 / strips;
        return <rect key={index} x={x(left)} y={y((left + width / 2)/2)} width={294*width-1} height={baseline-y((left+width/2)/2)}
          fill={colors.green} opacity={frame < integralStart ? 0.45 : 0.17} />;
      })}
      {accumulated > 0 && <path d={`M${x(0.4)},${baseline} V${y(0.2)} L${x(right)},${y(right/2)} V${baseline} Z`} fill={colors.green} opacity=".72" />}
      <path d={`M${x(0)},${baseline} L${x(2)},${y(1)} V${baseline}`} fill="none" stroke={colors.ink} strokeWidth="4" />
      <text x={x(1.6)} y={y(0.92)-35} textAnchor="middle" className="plot-label">f(t) = t / 2</text>
      {frame >= integralStart && <circle cx={x(right)} cy={y(right/2)} r="6" fill={colors.green} stroke="#fff" strokeWidth="2" />}
      <WidthBracket label={frame < integralStart ? 'Muchas franjas pequenas' : 'dt: recorremos el tiempo'} />
    </Axes>
    <aside className="work-panel">
      <p className="panel-label">Nueva densidad, nuevo resultado</p>
      {frame < integralStart ? <>
        <MathText formula="f(t)=\frac{t}{2}" size={39} />
        <MathText formula="\text{area de cada franja}\approx f(t)\,dt" size={23} />
        <p className="panel-note">Al estrechar las franjas, su suma se acerca al area exacta.</p>
      </> : <>
        <MathText formula="\int_{0.4}^{1.2}\frac{t}{2}\,\color{#008b70}{dt}" size={39} />
        <MathText formula="=\left[\frac{t^2}{4}\right]_{0.4}^{1.2}" size={31} />
        <MathText formula="=\color{#008b70}{0.32}" size={49} style={{opacity: progress(frame, integralStart+55, integralStart+78)}} />
        <p className="panel-note">dt identifica la variable de tiempo.</p>
      </>}
    </aside>
  </AbsoluteFill>;
}

function Piecewise() {
  const frame = useCurrentFrame();
  const calculation = frame >= frameAt(36.7 - script.models[2].start);
  const first = progress(frame, 12, 52);
  const second = progress(frame, 48, 86);
  return <AbsoluteFill>
    <ModelHeading number="03" label="TERCER MODELO / OTRA DENSIDAD, POR TRAMOS" title="En la frontera, dividimos el calculo" />
    <Axes model="piecewise" interval boundary>
      <rect x={x(0)} y={y(0.25)} width={294} height={baseline-y(0.25)} fill="#ede8dd" />
      <rect x={x(1)} y={y(0.75)} width={294} height={baseline-y(0.75)} fill="#f0e5df" />
      <rect x={x(0.4)} y={y(0.25)} width={(x(1)-x(0.4))*first} height={baseline-y(0.25)} fill={colors.gold} opacity=".75" />
      <rect x={x(1)} y={y(0.75)} width={(x(1.2)-x(1))*second} height={baseline-y(0.75)} fill={colors.coral} opacity=".76" />
      <path d={`M${x(0)},${baseline} V${y(0.25)} H${x(1)} V${y(0.75)} H${x(2)} V${baseline}`} fill="none" stroke={colors.ink} strokeWidth="4" />
      <circle cx={x(1)} cy={y(0.25)} r="5" fill="#f8faf9" stroke={colors.ink} strokeWidth="2" />
      <circle cx={x(1)} cy={y(0.75)} r="5" fill={colors.ink} />
      <text x={x(0.45)} y={y(0.25)-19} textAnchor="middle" className="plot-label">0.25 por min</text>
      <text x={x(1.6)} y={y(0.75)-19} textAnchor="middle" className="plot-label">0.75 por min</text>
      <WidthBracket label={calculation ? '0.15 + 0.15 = 0.30' : 'Dos tramos dentro de [0.4, 1.2]'} />
    </Axes>
    <aside className="work-panel piecewise-panel">
      <MathText formula="f(t)=\begin{cases}0.25,&0\leq t<1\\0.75,&1\leq t\leq2\end{cases}" size={24} />
      <p className="panel-label">Una regla en cada tramo</p>
      {!calculation ? <>
        <MathText formula="\color{#b87911}{\int_{0.4}^{1}0.25\,dt}" size={37} />
        <MathText formula="+\color{#bf5547}{\int_{1}^{1.2}0.75\,dt}" size={37} />
      </> : <>
        <MathText formula="\color{#b87911}{0.25(1-0.4)}" size={31} />
        <MathText formula="+\color{#bf5547}{0.75(1.2-1)}" size={31} />
        <MathText formula="=\color{#008b70}{0.30}" size={48} />
      </>}
    </aside>
  </AbsoluteFill>;
}

function Caption({cue}) {
  return <div className="caption" data-cue-start={cue.start}>
    {captionLines(cue.text).map((line, index) => <div key={index}>{line}</div>)}
  </div>;
}

function ProbabilityVideo() {
  return <AbsoluteFill className="video-stage">
    <FontGate />
    <Audio src={staticFile(script.audio)} />
    <header className="masthead"><h1>{'Probabilidad como \u00e1rea'}</h1><span>INFERENCIA / ESTADISTICA</span></header>
    <Sequence from={0} durationInFrames={uniformEnd}><Uniform /></Sequence>
    <Sequence from={uniformEnd} durationInFrames={increasingEnd-uniformEnd}><Increasing /></Sequence>
    <Sequence from={increasingEnd} durationInFrames={script.frames-increasingEnd}><Piecewise /></Sequence>
    <footer className="caption-band">
      {script.cues.map((cue, index) => <Sequence key={index} from={frameAt(cue.start)} durationInFrames={frameAt(cue.end)-frameAt(cue.start)} layout="none"><Caption cue={cue} /></Sequence>)}
    </footer>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="ProbabilityArea" component={ProbabilityVideo} width={script.width} height={script.height} fps={script.fps} durationInFrames={script.frames} />);