import React, {useEffect, useLayoutEffect, useState} from 'react';
import {AbsoluteFill, Composition, continueRender, delayRender, registerRoot, useCurrentFrame} from 'remotion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './style.css';
import {parameters, conditionalMean, conditionalVariance, conditionalSd, jointPdf, conditionalPdf, marginalY, marginalX, jStat, range, progress, tail, z} from './model.mjs';

const color = {ink: '#223932', muted: '#687670', grid: '#dbe5df', coral: '#c83e50', green: '#147f66', gold: '#ca8c11', paper: '#fafcf9'};
const joint = {left: 84, right: 502, top: 216, bottom: 486};
const curve = {left: 680, right: 1194, top: 234, bottom: 486};
const jointX = (value) => joint.left + (value - 18) / 28 * (joint.right - joint.left);
const jointY = (value) => joint.bottom - (value - 48) / 48 * (joint.bottom - joint.top);
const curveX = (value) => curve.left + (value - 48) / 54 * (curve.right - curve.left);
const curveY = (density) => curve.bottom - density / 0.06 * (curve.bottom - curve.top);
const sampleY = range(48, 102, 241);
const pathOf = (values, position) => values.map((value, index) => `${index ? 'L' : 'M'}${position(value).map((coordinate) => coordinate.toFixed(3)).join(',')}`).join(' ');
const densityPath = (pdf) => pathOf(sampleY, (value) => [curveX(value), curveY(pdf(value))]);
const conditionalPath = densityPath(conditionalPdf);
const marginalPath = densityPath(marginalY);
const cutPath = pathOf(range(48, 96, 201), (value) => [jointX(40) + 52 * jointPdf(40, value) / jointPdf(40, 74), jointY(value)]);
const rawPath = densityPath((value) => jointPdf(40, value));
const contours = [0.7, 1.2, 1.7, 2.2, 2.7].map((radius) => pathOf(range(0, Math.PI * 2, 161), (angle) => [jointX(30 + 5 * radius * Math.cos(angle)), jointY(70 + 8 * radius * (0.25 * Math.cos(angle) + Math.sqrt(1 - 0.25 ** 2) * Math.sin(angle)))]));
const maximumJoint = jointPdf(30, 70);
const heatmap = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="418" height="270" viewBox="0 0 418 270">${range(0, 47, 48).flatMap((column) => range(0, 35, 36).map((row) => {
  const weight = jointPdf(18 + (column + 0.5) / 48 * 28, 96 - (row + 0.5) / 36 * 48) / maximumJoint;
  const rgb = [244, 249, 242].map((value, index) => Math.round(value + ([35, 137, 109][index] - value) * weight));
  return `<rect x="${column * 418 / 48}" y="${row * 7.5}" width="8.75" height="7.55" fill="rgb(${rgb.join(',')})"/>`;
})).join('')}</svg>`)}`;
const mathHtml = new Map();
function MathText({tex, className = '', style, zone}) {
  if (!mathHtml.has(tex)) mathHtml.set(tex, katex.renderToString(tex, {throwOnError: true, displayMode: false, strict: 'error', output: 'html'}));
  return <span className={`math ${className}`} style={style} data-zone={zone} dangerouslySetInnerHTML={{__html: mathHtml.get(tex)}} />;
}
const decimal = (value, digits = 2) => value.toFixed(digits).replace('.', ',');

function equationAt(seconds) {
  if (seconds < 4.2) return {label: 'OBSERVACION', tex: String.raw`X=40\qquad Y\mid X=40\;?`};
  if (seconds < 7) return {label: 'DISTANCIA', tex: String.raw`x-\mu_X=40-30=\color{#c83e50}{10}`};
  if (seconds < 11) return {label: 'PENDIENTE', tex: String.raw`\beta=\rho\,\frac{\sigma_Y}{\sigma_X}`};
  if (seconds < 14.1) return {label: 'PENDIENTE', tex: String.raw`\beta=0{,}25\cdot\frac{8}{5}=\color{#c83e50}{0{,}4}`};
  if (seconds < 19.4) return {label: 'DESPLAZAMIENTO', tex: String.raw`\Delta\mu_Y=0{,}4\cdot10=\color{#c83e50}{4}`};
  if (seconds < 25.3) return {label: 'MEDIA CONDICIONAL', tex: String.raw`\mu_{Y\mid40}=70+0{,}25\frac{8}{5}(40-30)=\color{#c83e50}{74}`};
  if (seconds < 30) return {label: 'VARIANZA', tex: String.raw`\sigma^2_{Y\mid40}=64(1-0{,}25^2)\longrightarrow60`};
  if (seconds < 31.9) return {label: 'VARIANZA CONDICIONAL', tex: String.raw`\sigma^2_{Y\mid40}=\color{#c83e50}{60}\quad(<64)`};
  if (seconds < 37.6) return {label: 'DESVIACION CONDICIONAL', tex: String.raw`\sigma_{Y\mid40}=\sqrt{60}\approx\color{#c83e50}{7{,}746}`};
  if (seconds < 41.4) return {label: 'LA RAIZ ES NECESARIA', tex: String.raw`\sigma^2_{Y\mid x}=\sigma_Y^2(1-\rho^2)\qquad \sigma_{Y\mid x}=\sigma_Y\sqrt{1-\rho^2}`};
  if (seconds < 46.1) return {label: 'NORMALIZACION DEL CORTE', tex: String.raw`f_{Y\mid X}(y\mid40)=\frac{f_{XY}(40,y)}{f_X(40)}\qquad\int f_{Y\mid X}(y\mid40)\,dy=1`};
  if (seconds < 50.5) return {label: 'DISTRIBUCION CONOCIDA', tex: String.raw`Y\mid X=40\sim\mathcal{N}(74,60)\qquad P(Y>82\mid X=40)`};
  if (seconds < 54.2) return {label: 'DEL UMBRAL A LA DISTANCIA', tex: String.raw`82-\mu_{Y\mid40}=82-74=\color{#c83e50}{8}`};
  if (seconds < 60.4) return {label: 'COORDENADAS ESTANDAR', tex: String.raw`z=\frac{82-74}{\sqrt{60}}=\frac{8}{\sqrt{60}}\approx\color{#c83e50}{1{,}033}`};
  if (seconds < 62.9) return {label: 'CONDICION, NO MARGINAL', tex: String.raw`P\big(Y>82\;\color{#c83e50}{\mid X=40}\big)`};
  if (seconds < 68.8) return {label: 'DOS PREGUNTAS DISTINTAS', tex: String.raw`P(Y>82\mid X=40)\ne P(Y>82)`};
  if (seconds < 71.9) return {label: 'COMPLEMENTO', tex: String.raw`P(Y>82\mid X=40)=1-\Phi\!\left(\frac{8}{\sqrt{60}}\right)`};
  return {label: 'AREA, NO ALTURA', tex: String.raw`P(Y>82\mid X=40)=1-\Phi(1{,}0328)=\color{#c83e50}{0{,}15085\approx15{,}1\%}`};
}

function JointPlot({seconds, meanProgress}) {
  const tracedX = 30 + 10 * progress(seconds, 14.1, 19.1);
  const tracedY = conditionalMean(tracedX);
  return <svg className="geometry" viewBox="0 0 1280 720">
    <defs><clipPath id="jointClip"><rect x={joint.left} y={joint.top} width={joint.right - joint.left} height={joint.bottom - joint.top} /></clipPath></defs>
    <g clipPath="url(#jointClip)">
      <image href={heatmap} x={joint.left} y={joint.top} width={418} height={270} />
      {contours.map((contour, index) => <path key={index} d={contour} fill="none" stroke={color.green} strokeWidth="1.2" opacity="0.6" />)}
      <path d={`M${jointX(18)},${jointY(65.2)} L${jointX(46)},${jointY(76.4)}`} stroke={color.green} strokeWidth="2" strokeDasharray="5 4" />
      <line x1={jointX(40)} x2={jointX(40)} y1={joint.top} y2={joint.bottom} stroke={color.coral} strokeWidth="3" />
      <path d={`${cutPath} L${jointX(40)},${jointY(96)} Z`} fill={color.coral} fillOpacity="0.14" stroke={color.coral} strokeWidth="2" />
      <line x1={jointX(30)} x2={jointX(40)} y1={jointY(70)} y2={jointY(70)} stroke={color.ink} strokeWidth="2" opacity={progress(seconds, 4.2, 5)} />
      <line x1={jointX(40)} x2={jointX(40)} y1={jointY(70)} y2={jointY(74)} stroke={color.gold} strokeWidth="6" opacity={progress(seconds, 14.1, 15.1)} />
      <circle cx={jointX(30)} cy={jointY(70)} r="5" fill={color.paper} stroke={color.ink} strokeWidth="2" />
      <circle cx={jointX(tracedX)} cy={jointY(tracedY)} r="6.5" fill={color.gold} stroke={color.ink} strokeWidth="1.5" />
      {seconds >= 22.5 ? <circle cx={jointX(40)} cy={jointY(74)} r="5" fill={color.coral} /> : null}
    </g>
    {[20, 30, 40].map((value) => <g key={value}><line x1={jointX(value)} x2={jointX(value)} y1={486} y2={493} stroke={color.ink} /><text x={jointX(value)} y="514" textAnchor="middle" className={value === 40 ? 'svg-coral' : ''}>{value}</text></g>)}
    {[50, 60, 70, 80, 90].map((value) => <g key={value}><line x1={77} x2={84} y1={jointY(value)} y2={jointY(value)} stroke={color.ink} /><text x="68" y={jointY(value) + 6} textAnchor="end">{value}</text></g>)}
    <path d={`M84,216 V486 H502`} fill="none" stroke={color.ink} strokeWidth="1.5" />
    <text x="522" y="494" className="axis-letter">X</text><text x="62" y="202" className="axis-letter">Y</text>
    <text x={jointX(40)} y="204" textAnchor="middle" className="svg-coral">X = 40</text>
    {seconds >= 4.2 && seconds < 25.3 ? <text x={jointX(35)} y={jointY(70) + 27} textAnchor="middle" className="svg-ink">10</text> : null}
    {seconds >= 14.1 && seconds < 25.3 ? <text x={jointX(40) - 16} y={jointY(72) - 3} textAnchor="end" className="svg-gold">+4</text> : null}
  </svg>;
}

function CurvePlot({seconds, meanProgress, varianceProgress}) {
  const mean = 70 + 4 * meanProgress;
  const variance = 64 - 4 * varianceProgress;
  const sd = Math.sqrt(variance);
  const transform = progress(seconds, 54.2, 56.7);
  const normalization = seconds >= 41.4 && seconds < 46.1 ? progress(seconds, 42, 45.8) : 1;
  const amplitude = seconds >= 41.4 && seconds < 46.1 ? marginalX(40) + (1 - marginalX(40)) * normalization : 1;
  const pdf = (value) => jStat.normal.pdf(value, mean, sd) * amplitude;
  const path = densityPath(pdf);
  const tailValues = range(82, 102, 121);
  const tailPath = `${pathOf(tailValues, (value) => [curveX(value), curveY(pdf(value))])} L${curveX(102)},486 L${curveX(82)},486 Z`;
  const thresholdOpacity = progress(seconds, 41.4, 43);
  const bracketOpacity = seconds < 41.4 ? progress(seconds, 25.3, 26.4) : 0;
  const initialTicks = [50, 60, 70, 80, 90, 100];
  const finalTicks = [-3, -2, -1, 0, 1, 2];
  return <svg className="geometry" viewBox="0 0 1280 720">
    {[0.02, 0.04].map((value) => <g key={value}><line x1={curve.left} x2={curve.right} y1={curveY(value)} y2={curveY(value)} stroke={color.grid} /><text x="665" y={curveY(value) + 6} textAnchor="end" className="small-tick">{decimal(value * conditionalSd ** transform, transform > 0 ? 3 : 2)}</text></g>)}
    <path d={marginalPath} fill="none" stroke={color.muted} strokeDasharray="7 6" strokeWidth="2" opacity={seconds >= 62.9 && seconds < 68.8 ? 1 : 0.55} />
    {seconds >= 41.4 ? <path d={conditionalPath} fill="none" stroke={color.coral} strokeWidth="1.5" opacity="0.3" /> : null}
    <path d={`${path} L${curve.right},486 L${curve.left},486 Z`} fill={color.coral} fillOpacity="0.06" />
    <path d={tailPath} fill={color.coral} fillOpacity={0.45 * thresholdOpacity} />
    <path d={path} fill="none" stroke={color.coral} strokeWidth="3.5" />
    {seconds >= 41.4 && seconds < 50.5 ? <path d={rawPath} fill="none" stroke={color.gold} strokeWidth="3" /> : null}
    <line x1={curveX(70)} x2={curveX(70)} y1={curveY(marginalY(70))} y2="486" stroke={color.muted} strokeDasharray="4 5" opacity={1 - transform} />
    <line x1={curveX(mean)} x2={curveX(mean)} y1={curveY(pdf(mean))} y2="486" stroke={color.coral} strokeDasharray="4 5" />
    <circle cx={curveX(mean)} cy={curveY(pdf(mean))} r="5" fill={color.coral} />
    <line x1={curveX(82)} x2={curveX(82)} y1="270" y2="486" stroke={color.coral} strokeWidth="2" opacity={thresholdOpacity} />
    <g opacity={thresholdOpacity}><text x={curveX(82) + 9} y="259" className="svg-coral">{transform === 1 ? `z = ${decimal(z, 3)}` : transform === 0 ? 'Y > 82' : 'Y → Z'}</text></g>
    <path d={`M680,234 V486 H1194`} fill="none" stroke={color.ink} strokeWidth="1.5" />
    {initialTicks.map((value, index) => {
      const target = 74 + finalTicks[index] * conditionalSd;
      const position = curveX(value + (target - value) * transform);
      const currentY = value + (target - value) * transform;
      const label = transform === 0 ? value : transform === 1 ? finalTicks[index] : decimal((currentY - 74 * transform) / conditionalSd ** transform, 1);
      return <g key={value}><line x1={position} x2={position} y1="486" y2="493" stroke={color.ink} /><text x={position} y="514" textAnchor="middle">{label}</text></g>;
    })}
    {transform > 0 ? <g opacity={transform}><line x1={curveX(74 + 3 * conditionalSd)} x2={curveX(74 + 3 * conditionalSd)} y1="486" y2="493" stroke={color.ink} /><text x={curveX(74 + 3 * conditionalSd)} y="514" textAnchor="middle">3</text></g> : null}
    <text x="1213" y="493" className="axis-letter">{transform === 1 ? 'Z' : transform === 0 ? 'Y' : 'W'}</text>
    <g opacity={bracketOpacity}><path d={`M${curveX(mean - sd)},447 v9 H${curveX(mean + sd)} v-9`} fill="none" stroke={color.green} strokeWidth="2.5" /><text x={curveX(mean)} y="438" textAnchor="middle" className="svg-green">σ = {decimal(sd, varianceProgress === 1 ? 3 : 2)}</text></g>
    {seconds >= 19.4 && seconds < 25.3 ? <g><path d={`M${curveX(70)},540 H${curveX(74)} m-5,-4 l5,4 l-5,4`} stroke={color.coral} strokeWidth="2.5" fill="none" /><text x={curveX(70) - 8} y="546" textAnchor="end" className="svg-muted">70</text><text x={curveX(74) + 8} y="546" className="svg-coral">74</text></g> : null}
    {seconds >= 50.5 && seconds < 60.4 ? <g><path d={`M${curveX(74)},537 v-7 H${curveX(82)} v7`} stroke={color.coral} strokeWidth="2.5" fill="none" /><text x={(curveX(74) + curveX(82)) / 2} y="556" textAnchor="middle" className="svg-coral">{transform === 1 ? '8 / √60' : transform === 0 ? '8' : decimal(8 / conditionalSd ** transform, 3)}</text></g> : null}
  </svg>;
}

function Transport({seconds}) {
  if (seconds < 42 || seconds > 46.1) return null;
  return <svg className="geometry" viewBox="0 0 1280 720">
    {range(58, 92, 15).map((value, index) => {
      const travel = progress(seconds, 42 + index * 0.04, 45.3 + index * 0.04);
      const start = [jointX(40) + 52 * jointPdf(40, value) / jointPdf(40, 74), jointY(value)];
      const target = [curveX(value), curveY(conditionalPdf(value))];
      return <circle key={value} cx={start[0] + (target[0] - start[0]) * travel} cy={start[1] + (target[1] - start[1]) * travel - 70 * Math.sin(Math.PI * travel)} r="3.5" fill={color.gold} opacity={Math.sin(Math.PI * travel)} />;
    })}
  </svg>;
}

export function Scene({script, audit = false}) {
  const frame = useCurrentFrame();
  const seconds = frame / 30;
  const [fontGate] = useState(() => delayRender('Fuentes KaTeX y tipografia local'));
  useEffect(() => {
    let active = true;
    Promise.all(['KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4', 'KaTeX_SansSerif'].map((font) => document.fonts.load(`24px ${font}`)))
      .then(() => document.fonts.ready).then(() => {
        if (active) continueRender(fontGate);
      }).catch((error) => {throw error;});
    return () => {active = false;};
  }, [fontGate]);
  useLayoutEffect(() => {
    if (!audit) return;
    const auditGate = delayRender(`Auditoria del frame ${frame}`);
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      const boxes = Array.from(document.querySelectorAll('[data-zone]')).map((element) => {
        const box = element.getBoundingClientRect();
        const math = element.querySelector('.katex');
        const mathBox = math?.getBoundingClientRect();
        return {name: element.dataset.zone, x: box.x, y: box.y, width: box.width, height: box.height, mathWidth: mathBox?.width ?? 0, mathHeight: mathBox?.height ?? 0};
      });
      console.log(`BIVARIATE_LAYOUT ${JSON.stringify({frame, fonts: document.fonts.status, boxes})}`);
      continueRender(auditGate);
    }));
  }, [frame, audit]);
  const meanProgress = progress(seconds, 19.4, 22.5);
  const varianceProgress = progress(seconds, 25.3, 30);
  const equation = equationAt(seconds);
  const cue = script.cues.find((entry) => seconds >= entry.start && seconds < entry.end);
  const phase = seconds < 25.3 ? '01 / MEDIA' : seconds < 41.4 ? '02 / VARIANZA' : '03 / COLA';
  const standardized = seconds >= 56.7;
  const normalized = seconds < 41.4 || seconds >= 45.8;
  const construction = seconds < 30;
  return <AbsoluteFill className="scene">
    <div className="header" data-zone="header"><h1>Del plano al corte</h1><span className="phase">{phase}</span></div>
    <div className="parameters" data-zone="parameters"><MathText tex={String.raw`\mu_X=30\quad\mu_Y=70\quad\sigma_X=5\quad\sigma_Y=8\quad\rho=0{,}25`} /><MathText tex="X=40" className="coral" /></div>
    <div className="left-title" data-zone="left-title"><span>Conjunta</span><MathText tex="f_{XY}(x,y)" /></div>
    <div className="right-title" data-zone="right-title"><span>{standardized ? 'Normal estandar' : construction ? 'Construccion condicional' : 'Condicional'}</span><MathText tex={standardized ? String.raw`Z\sim\mathcal{N}(0,1)` : construction ? String.raw`\mathcal{N}(m,v)` : String.raw`Y\mid X=40`} /></div>
    <div className="joint-note" data-zone="joint-note"><MathText tex={String.raw`E[Y\mid X=x]=70+0{,}4(x-30)`} /></div>
    <div className="curve-note" data-zone="curve-note"><MathText tex={seconds < 30 ? String.raw`\text{gris: }f_Y\quad\text{rojo: construccion}\;\to f_{Y\mid X}` : seconds < 41.4 ? String.raw`\text{gris: }f_Y\qquad\text{rojo: }f_{Y\mid X}` : standardized ? String.raw`z=(y-74)/\sqrt{60}\quad\text{gris: marginal transformada}` : seconds > 54.2 ? `w=(y-${decimal(74 * progress(seconds, 54.2, 56.7), 1).replace(',', '{,}')} )/${decimal(conditionalSd ** progress(seconds, 54.2, 56.7), 3).replace(',', '{,}')}` : String.raw`f_{XY}(40,y)=f_X(40)\,f_{Y\mid X}(y\mid40)`} /></div>
    <JointPlot seconds={seconds} meanProgress={meanProgress} />
    <CurvePlot seconds={seconds} meanProgress={meanProgress} varianceProgress={varianceProgress} />
    <Transport seconds={seconds} />
    <div className="cut-area" data-zone="cut-area"><span>Perfil del corte: altura ampliada; area conjunta</span><MathText tex={String.raw`\int f_{XY}(40,y)\,dy=f_X(40)\approx0{,}01080`} /></div>
    {seconds < 19.4 || (seconds >= 25.3 && seconds < 50.5) || seconds >= 60.4 ? <div className="curve-area" data-zone="curve-area"><MathText tex={normalized ? String.raw`\text{area}=1` : String.raw`\div f_X(40)\;:\;0{,}01080\longrightarrow1`} /><span style={seconds >= 62.9 && seconds < 68.8 ? {color: color.muted} : undefined}>{seconds < 25.3 ? `m = ${decimal(70 + 4 * meanProgress, 1)}` : seconds < 31.9 ? `v = ${decimal(64 - 4 * varianceProgress, 1)}` : seconds < 41.4 ? 'v = 60; σ = √60' : seconds >= 68.8 ? `Cola: ${decimal(tail, 5)}` : seconds >= 62.9 ? `Marginal: ${decimal(1 - jStat.normal.cdf(82, 70, 8), 5)}` : 'Densidad ≠ probabilidad'}</span></div> : null}
    <div className="equation-label" data-zone="equation-label">{equation.label}</div>
    <MathText tex={equation.tex} className={`equation ${seconds >= 37.6 && seconds < 46.1 ? 'compact' : ''}`} zone="equation" />
    <div className="subtitle" data-zone="subtitle">{cue?.text ?? ''}</div>
    <div className="timeline"><div style={{width: `${frame / 2252 * 100}%`}} /></div>
  </AbsoluteFill>;
}

function Root() {
  return <Composition id="BivariateRemotion" component={Scene} width={1280} height={720} fps={30} durationInFrames={2253} defaultProps={{script: {cues: []}}} />;
}
registerRoot(Root);