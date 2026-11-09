import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Composition, cancelRender, continueRender, delayRender, interpolate, registerRoot, useCurrentFrame} from 'remotion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import brief from '../../five-seconds/brief.json';

const formulaHtml = [...brief.phases.map(phase => phase.formula), brief.footer]
  .map(formula => katex.renderToString(formula, {throwOnError: true, output: 'html'}));

export function Scene() {
  const frame = useCurrentFrame();
  const [fontHandle] = useState(() => delayRender('KaTeX typography'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('bold 44px KaTeX_Main'),
      document.fonts.load('68px KaTeX_Main'),
      document.fonts.load('italic 68px KaTeX_Math'),
    ]).then(() => document.fonts.ready).then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);

  const phaseIndex = frame < 30 ? 0 : frame < 90 ? 1 : 2;
  const phaseStart = brief.phases[phaseIndex].start * brief.fps;
  const settle = interpolate(frame - phaseStart, [0, 12], [1.035, 1], {extrapolateRight: 'clamp'});
  const emphasis = interpolate(frame, [30, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const math = (index, style) => <div style={style} dangerouslySetInnerHTML={{__html: formulaHtml[index]}} />;

  return <AbsoluteFill style={{background: brief.background, color: brief.ink, fontFamily: 'KaTeX_Main, serif'}}>
    <div style={{position: 'absolute', left: 140, top: 76, fontSize: 44, fontWeight: 700}}>{brief.title}</div>
    {math(phaseIndex, {position: 'absolute', top: 210, width: '100%', textAlign: 'center', fontSize: 60, transform: `scale(${settle})`})}
    <div style={{position: 'absolute', left: 140, top: 406, width: 1000, height: 76, display: 'flex', color: '#ffffff', fontSize: 38, textAlign: 'center'}}>
      <div style={{width: `${brief.probability * 100}%`, background: brief.green, display: 'grid', placeItems: 'center'}}>0.30</div>
      <div style={{width: `${brief.complement * 100}%`, background: brief.coral, display: 'grid', placeItems: 'center'}}>0.70</div>
    </div>
    <div style={{position: 'absolute', left: 440, top: 492, width: 700, height: 5, background: brief.coral, opacity: emphasis, transform: `scaleX(${0.75 + emphasis * 0.25})`, transformOrigin: 'left'}} />
    <div style={{position: 'absolute', left: 140, top: 512, width: 300, textAlign: 'center', fontSize: 30, color: brief.green}}>A</div>
    <div style={{position: 'absolute', left: 440, top: 512, width: 700, textAlign: 'center', fontSize: 30, color: brief.coral}}>Complemento</div>
    {math(3, {position: 'absolute', top: 600, width: '100%', textAlign: 'center', fontSize: 32})}
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="Complement" component={Scene} width={brief.width} height={brief.height} fps={brief.fps} durationInFrames={brief.frames} />);