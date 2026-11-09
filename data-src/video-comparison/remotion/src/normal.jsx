import React from 'react';
import jStat from 'jstat';
import {AbsoluteFill, Composition, interpolate, registerRoot, useCurrentFrame} from 'remotion';
import story from '../../normal/storyboard.json';
import {NormalChart} from './normal-chart.jsx';
import {FormulaTransition} from './normal-formula.jsx';
import 'katex/dist/katex.min.css';
import './style.css';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

export function NormalStandardization() {
  const frame = useCurrentFrame();
  const time = frame / story.fps;
  const progress = event => interpolate(frame, story.events[event].map(time => time * story.fps), [0, 1], clamp);
  const phase = story.phases.find(phase => time >= phase.start && time < phase.end) ?? story.phases.at(-1);
  const sigma = story.sigma - progress('narrow') + 1.6 * progress('widen') - 0.6 * progress('restore');
  const selected = 6 + 8 * progress('scan') - 2 * progress('settle');
  const standardized = (selected - story.mean) / story.sigma;
  const shade = -4 + 5 * progress('shade');
  const tail = progress('tail');
  const showPoint = time >= story.events.scan[0];
  return <AbsoluteFill className="video-stage" style={{background: '#fcfcfd', color: '#182d28'}}>
    <header style={{position: 'absolute', inset: '0 64px auto', height: 78, borderBottom: '1px solid #dce5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <h1 style={{fontFamily: 'VideoSerif', fontSize: 38, fontWeight: 400, margin: 0}}>La normal: de X a Z</h1>
      <span style={{fontSize: 19, color: '#596860'}}>REMOTION</span>
    </header>
    <FormulaTransition story={story} />
    <div style={{position: 'absolute', top: 190, width: '100%', textAlign: 'center', fontSize: 23, color: '#596860'}}>{phase.title}</div>
    <div style={{position: 'absolute', top: 235, left: 60}}>
      <NormalChart mean={story.mean} sigma={sigma} selected={selected} shade={shade} tail={tail} draw={progress('draw')} showPoint={showPoint} showWidth={phase.id==='width'} />
    </div>
    <div style={{position: 'absolute', top: 235, left: 670, opacity: progress('standardize')}}>
      <NormalChart mean={0} sigma={1} selected={standardized} shade={shade} tail={tail} standard showPoint={showPoint} />
    </div>
    <div style={{position: 'absolute', left: 640, top: 239, height: 274, borderLeft: '1px solid #dce5df'}} />
    {[{left: 60, mean: story.mean, sigma}, {left: 670, mean: 0, sigma: 1}].map((parameters, index) => <div key={index}
      style={{position: 'absolute', left: parameters.left, top: 539, width: 550, textAlign: 'center', fontSize: 23, color: '#596860', opacity: index ? progress('standardize') : 1}}>
      <div>media = {parameters.mean} &nbsp; sigma = {parameters.sigma.toFixed(2)}</div>
      <div style={{fontSize: 22, marginTop: 12}}>Area total = 1</div>
    </div>)}
    {time >= story.events.shade[0] && <div style={{position: 'absolute', top: 568, left: 510, width: 260, textAlign: 'center', fontSize: 26, color: tail ? '#bf5547' : '#008b70'}}>
      {tail ? '0.8413 + 0.1587 = 1' : jStat.normal.cdf(shade, 0, 1).toFixed(4)}
    </div>}
    <footer className="caption-band" style={{background: '#182d28', borderTop: 0}}>
      <div className="caption" style={{fontSize: 25}}>{phase.caption}</div>
    </footer>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="NormalStandardization" component={NormalStandardization}
  width={story.width} height={story.height} fps={story.fps} durationInFrames={story.frames} />);