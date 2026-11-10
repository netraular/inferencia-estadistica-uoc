import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Composition, continueRender, delayRender, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './video.css';

const colors = {green: '#16785a', coral: '#bc4553', muted: '#64736c', seed: '#dce4df'};
const smooth = value => {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
};
const reveal = (seconds, start, duration = 0.6) => smooth((seconds - start) / duration);
const decimal = value => String(value).replace('.', '{,}');

function Formula({tex}) {
  return <span dangerouslySetInnerHTML={{__html: katex.renderToString(tex, {throwOnError: true, output: 'html'})}} />;
}

function SeedGrid({tray, seconds, totalAt, color}) {
  const gap = 18;
  const left = (480 - tray.columns * gap) / 2 + gap / 2;
  return <svg className="seed-grid" viewBox="0 0 480 190" aria-hidden="true">
    {Array.from({length: tray.total}, (_, index) => {
      const germinated = index < tray.germinated;
      const opacity = germinated ? 1 : reveal(seconds, totalAt + (index - tray.germinated) / (tray.total - tray.germinated) * 0.6, 0.45);
      const horizontal = left + index % tray.columns * gap;
      const vertical = 13 + Math.floor(index / tray.columns) * gap;
      return <g key={index} opacity={opacity}>
        <ellipse cx={horizontal} cy={vertical} rx="5.4" ry="6.4" fill={germinated ? color : colors.seed} />
        {germinated && <path d={`M${horizontal},${vertical + 3} v-6 m0,2 l-3,-2 m3,3 l3,-2`} stroke="white" strokeWidth="1.15" fill="none" />}
      </g>;
    })}
  </svg>;
}

function Tray({tray, seconds, events, index}) {
  const first = index === 0;
  const color = first ? colors.green : colors.coral;
  const totalAt = first ? events.firstTotal : events.secondTotal;
  const resultAt = first ? events.firstResult : events.secondResult;
  const proportion = tray.germinated / tray.total;
  const totalVisible = reveal(seconds, totalAt);
  const resultVisible = reveal(seconds, resultAt);
  return <section className={`tray tray-${tray.id}`} style={{'--tray-color': color}}>
    <h2>Bandeja {tray.id}</h2>
    <div className="count"><strong>{tray.germinated}</strong><span>germinadas</span></div>
    <div className="total" style={{opacity: totalVisible}}>de <strong>{tray.total}</strong> sembradas</div>
    <SeedGrid tray={tray} seconds={seconds} totalAt={totalAt} color={color} />
    <div className="ratio" style={{opacity: resultVisible}}><Formula tex={`\\frac{${tray.germinated}}{${tray.total}}=${decimal(proportion)}`} /><strong>{Math.round(proportion * 100)} %</strong></div>
    <div className="bar" style={{opacity: resultVisible}}><div style={{width: `${proportion * 100 * resultVisible}%`}} /></div>
    <div className="bar-scale" style={{opacity: resultVisible}}><span>0 %</span><span>100 %</span></div>
  </section>;
}

function currentFormula(seconds, storyboard) {
  const {events, trays: [first, second]} = storyboard;
  const firstRatio = first.germinated / first.total;
  const secondRatio = second.germinated / second.total;
  if (seconds >= events.independence) return String.raw`\text{Describir estas bandejas no exige suponer independencia}`;
  if (seconds >= events.comparison) return `${decimal(firstRatio)}> ${decimal(secondRatio)}\\qquad\\text{La bandeja A tiene mayor proporci\\'on}`;
  if (seconds >= events.secondResult) return `\\frac{${second.germinated}}{${second.total}}=${decimal(secondRatio)}`;
  if (seconds >= events.secondTotal) return `\\frac{${second.germinated}}{${second.total}}`;
  if (seconds >= events.quarter) return `\\frac{${first.germinated}}{${first.total}}=${decimal(firstRatio)}=\\frac{1}{4}`;
  if (seconds >= events.firstResult) return `\\frac{${first.germinated}}{${first.total}}=${decimal(firstRatio)}`;
  if (seconds >= events.firstFraction) return `p=\\frac{${first.germinated}}{${first.total}}`;
  if (seconds >= events.definition) return String.raw`p=\frac{\text{parte}}{\text{su propio total}}`;
  if (seconds >= events.insufficient) return String.raw`\text{Falta conocer el total de cada bandeja}`;
  return String.raw`\text{Un recuento no basta para comparar}`;
}

export function Proportions({storyboard, audit = false}) {
  const frame = useCurrentFrame();
  const seconds = frame / storyboard.fps;
  const [fontGate] = useState(() => delayRender('Tipografia y formulas'));
  useEffect(() => {
    let active = true;
    Promise.all([document.fonts.load('30px Atkinson'), document.fonts.load('700 48px Atkinson'), document.fonts.load('32px KaTeX_Main'), document.fonts.load('32px KaTeX_Math')])
      .then(() => document.fonts.ready).then(() => {if (active) continueRender(fontGate);});
    return () => {active = false;};
  }, [fontGate]);
  useEffect(() => {
    if (!audit) return;
    const gate = delayRender('Encuadre');
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      const boxes = Array.from(document.querySelectorAll('[data-zone]')).map(element => {
        const box = element.getBoundingClientRect();
        return {name: element.dataset.zone, x: box.x, y: box.y, width: box.width, height: box.height, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight};
      });
      console.log(`COURSE_VIDEO_LAYOUT ${JSON.stringify({frame, boxes})}`);
      continueRender(gate);
    }));
  }, [audit, frame]);
  const caption = storyboard.cues.find(cue => seconds >= cue.start && seconds < cue.end)?.text || '';
  return <AbsoluteFill className="course-video">
    <style>{`@font-face{font-family:Atkinson;src:url('${staticFile('atkinson-latin-400.woff2')}')}@font-face{font-family:Atkinson;src:url('${staticFile('atkinson-latin-700.woff2')}');font-weight:700}`}</style>
    <header data-zone="header"><p>TEMA 0 / PROPORCIONES</p><h1>No bastan los recuentos</h1></header>
    <div className="question" data-zone="question">{seconds < storyboard.events.comparison ? '18 frente a 30. Falta una parte de la historia.' : 'Menos germinaciones, mayor proporci\u00f3n.'}</div>
    <div className="trays" data-zone="trays">{storyboard.trays.map((tray, index) => <Tray key={tray.id} tray={tray} index={index} seconds={seconds} events={storyboard.events} />)}</div>
    <div className="formula" data-zone="formula"><Formula tex={currentFormula(seconds, storyboard)} /></div>
    <div className="caption" data-zone="caption">{caption}</div>
    <div className="progress"><div style={{width: `${frame / (storyboard.frames - 1) * 100}%`}} /></div>
  </AbsoluteFill>;
}

function Root() {
  return <Composition id="Proportions" component={Proportions} width={1280} height={720} fps={30} durationInFrames={1362} calculateMetadata={({props}) => ({durationInFrames: props.storyboard.frames, fps: props.storyboard.fps, width: props.storyboard.width, height: props.storyboard.height})} />;
}

registerRoot(Root);