import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, Composition, cancelRender, continueRender, delayRender, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {courseFrame, courseTimeline, VIDEO} from './course-frame.mjs';
import {nativeLayoutErrors} from './native-layout.mjs';
import {FoundationsScene} from './native-foundations.jsx';
import {UnivariateScene} from './native-univariate.jsx';
import {MultivariateScene} from './native-multivariate.jsx';
import {ExerciseScene} from './native-exercises.jsx';

const renderers = {foundations:FoundationsScene, univariate:UnivariateScene, multivariate:MultivariateScene, exercise:ExerciseScene};

function fitContent(element, minimum) {
  let size = Number.parseFloat(element.style.fontSize);
  while (element.scrollWidth > element.clientWidth + 1 && size > minimum) element.style.fontSize = `${--size}px`;
}

async function auditScene(frame, scene, state) {
  const stage = document.querySelector('[data-native-stage]');
  const origin = stage.getBoundingClientRect();
  const boxes = [];
  for (const element of Array.from(stage.querySelectorAll('[data-native-bound]'))) {
    const style = getComputedStyle(element);
    if (style.display === 'none' || Number(style.opacity) < 0.02) continue;
    const bounds = element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) continue;
    const box = {name:element.tagName, x:bounds.x - origin.x, y:bounds.y - origin.y, width:bounds.width, height:bounds.height};
    if (element.tagName.toLowerCase() === 'text' || element.hasAttribute('data-native-math')) {
      box.kind = element.tagName.toLowerCase() === 'text' ? 'label' : 'formula';
      box.text = element.textContent;
      box.clips = [];
      for (let parent = element.parentElement; parent && parent !== stage; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.overflowX === 'hidden' || style.overflowY === 'hidden' || style.overflow === 'clip') {
          const clip = parent.getBoundingClientRect();
          box.clips.push({name:parent.tagName, x:clip.x - origin.x, y:clip.y - origin.y, width:clip.width, height:clip.height});
        }
      }
    }
    boxes.push(box);
  }
  const zones = Array.from(document.querySelectorAll('[data-native-zone], [data-native-text], [data-native-math]'), element => ({
    name:element.dataset.nativeZone || 'native text', scrollWidth:element.scrollWidth, clientWidth:element.clientWidth,
    scrollHeight:element.scrollHeight, clientHeight:element.clientHeight,
  }));
  const errors = nativeLayoutErrors(boxes, zones);
  const marks = Array.from(stage.querySelectorAll('[data-native-mark]')).filter(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && Number(getComputedStyle(element).opacity) >= 0.02;
  });
  if (!marks.length) errors.push('Missing explanatory native geometry');
  const bytes = new TextEncoder().encode(stage.innerHTML);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const geometrySha256 = Array.from(digest, value => value.toString(16).padStart(2, '0')).join('');
  console.log(`REMOTION_NATIVE_LAYOUT ${JSON.stringify({frame, scene:state.index, cue:state.cueIndex, family:scene.family, domain:document.querySelector('[data-native-domain]').dataset.nativeDomain, boxes, errors, marks:marks.length, geometrySha256})}`);
}

export function NativeCourse({storyboard, audit = false}) {
  const frame = useCurrentFrame();
  const original = courseFrame(storyboard, frame);
  const timeline = courseTimeline(storyboard);
  const timing = timeline.scenes[original.index];
  const cue = timing.cues[original.cueIndex];
  const seconds = frame / storyboard.fps;
  const cueDuration = Math.max(1 / storyboard.fps, (cue?.end ?? timing.end) - (cue?.start ?? timing.start));
  const cueElapsed = Math.max(0, seconds - (cue?.start ?? timing.start));
  const state = {...original, seconds, cueDuration, cueElapsed, sceneElapsed:seconds - timing.start, progress:Math.min(1, cueElapsed / cueDuration)};
  const plan = storyboard.nativePlan;
  const scene = plan?.scenes[original.index];
  const Scene = renderers[plan?.domain];
  if (!Scene || !scene) throw new RangeError('Missing narration-specific native Remotion scene');
  useLayoutEffect(() => {
    const gate = delayRender('Native scene fonts and mathematical layout');
    let active = true;
    Promise.all([document.fonts.load('24px Atkinson'), document.fonts.load('bold 26px Atkinson'), document.fonts.load('24px KaTeX_Main')])
      .then(() => document.fonts.ready).then(async () => {
        if (!active) return;
        for (const element of Array.from(document.querySelectorAll('[data-native-math]'))) fitContent(element, 14);
        if (audit) await auditScene(frame, scene, state);
        continueRender(gate);
      }).catch(cancelRender);
    return () => {active = false; continueRender(gate);};
  }, [frame, storyboard, audit]);
  return <AbsoluteFill data-native-domain={plan.domain} style={{background:'#fcfefd', color:'#253330', fontFamily:'Atkinson', letterSpacing:0}}>
    <style>{`@font-face{font-family:Atkinson;src:url('${staticFile('atkinson-latin-400.woff2')}')}@font-face{font-family:Atkinson;src:url('${staticFile('atkinson-latin-700.woff2')}');font-weight:700}.katex-display{margin:.5em 0}`}</style>
    <header data-native-zone="title" style={{position:'absolute', left:40, top:16, width:1200, height:62, display:'flex', alignItems:'center', fontSize:24, lineHeight:1.2, fontWeight:700, borderBottom:'1px solid #dce7e1'}}>{scene.title}</header>
    <main data-native-stage style={{position:'absolute', left:40, top:92, width:1200, height:480}}><Scene plan={scene} state={state}/></main>
    <footer data-native-zone="caption" style={{position:'absolute', left:40, top:590, width:1200, height:110, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', fontSize:23, lineHeight:1.3, borderTop:'1px solid #dce7e1'}}>{state.caption}</footer>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="Course" component={NativeCourse} {...VIDEO} durationInFrames={30} calculateMetadata={({props}) => ({durationInFrames:props.storyboard.frames})}/>);