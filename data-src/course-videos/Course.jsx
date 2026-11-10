import React, {useLayoutEffect, useRef} from 'react';
import Konva from 'konva';
import {AbsoluteFill, Composition, cancelRender, continueRender, delayRender, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {createWhiteboard, planWhiteboardScene, whiteboardFrameLines} from '../../src/classroom/whiteboard.mjs';
import {drawContextDiagram, selectContextDiagram} from '../../pages/inferencia/context-diagram.js';
import {authoredSceneContent, courseFrame, VIDEO} from './course-frame.mjs';

Konva.pixelRatio = 1;

async function auditBoard(host, state, frame, animation) {
  const stage = Konva.stages.find(candidate => candidate.container() === host);
  const root = stage.getLayers()[0].getChildren()[0];
  const boxes = [];
  const errors = [];
  const add = (name, box) => {
    if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) errors.push(`${name}: nonfinite bounds`);
    if (box.x < -1 || box.y < -1 || box.x + box.width > 1281 || box.y + box.height > 565) errors.push(`${name}: outside whiteboard`);
    boxes.push({name, ...box});
  };
  for (const [index, node] of root.getChildren().entries()) {
    if (!node.isVisible() || node.getAbsoluteOpacity() < 0.02) continue;
    if (node.getClassName() === 'Text' || node.getClassName() === 'Group') {
      add(`${node.getClassName()}-${index}`, node.getClientRect());
    }
  }
  const plan = planWhiteboardScene(animation.id, state.step);
  const {diagram, phase} = selectContextDiagram(plan, state.cueIndex);
  const lines = plan.kind === 'story' ? whiteboardFrameLines(plan, state.cueIndex) : [];
  const content = authoredSceneContent(state, lines);
  const canvas = stage.getLayers()[0].getCanvas()._canvas;
  const drawing = canvas.getContext('2d');
  const groups = root.getChildren().filter(node => node.getClassName() === 'Group');
  const authored = content.lines.map(line => {
    const node = groups[lines.indexOf(line)];
    if (!node?.isVisible() || node.getAbsoluteOpacity() < 0.02) {
      errors.push('Authored problem or equation is not visible');
      return {cue:line.cue, inkPixels:0};
    }
    const bounds = node.getClientRect();
    const left = Math.max(0, Math.floor(bounds.x));
    const top = Math.max(0, Math.floor(bounds.y));
    const width = Math.min(canvas.width - left, Math.ceil(bounds.width));
    const height = Math.min(canvas.height - top, Math.ceil(bounds.height));
    let inkPixels = 0;
    if (width > 0 && height > 0) {
      const pixels = drawing.getImageData(left, top, width, height).data;
      for (let offset = 0; offset < pixels.length; offset += 4) if (pixels[offset + 3] && Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) < 190) inkPixels++;
    }
    const equationPaths = node.find('Path').filter(part => part.isVisible()).length;
    if (!inkPixels) errors.push('Authored problem or equation has no ink');
    if (line.tex && !equationPaths) errors.push('Authored TeX has no equation paths');
    if (!line.tex && !node.find('Text').some(part => part.isVisible() && part.text() === line.value)) errors.push('Authored problem text is missing');
    return {cue:line.cue, ...(line.tex ? {tex:line.tex} : {value:line.value}), inkPixels, equationPaths};
  });
  let geometry;
  if (!diagram && !authored.length && !content.opening) errors.push('Missing visible authored problem, equation or context diagram');
  if (diagram) {
    if (!root.getChildren().some(node => node.getClassName() === 'Shape' && node.isVisible())) errors.push('Context diagram is not bound to the whiteboard');
    const heading = root.getChildren().find(node => node.getClassName() === 'Text');
    const top = heading.y() + heading.height() + 12;
    const height = 564 * 960 / 1280 - top - 24;
    const canvas = document.createElement('canvas');
    canvas.width = 520;
    canvas.height = Math.ceil(height);
    const context = canvas.getContext('2d');
    geometry = drawContextDiagram(context, diagram, 520, height, {phase, compact:true});
    if (!geometry?.marks) errors.push('Context diagram has no marks');
    for (const [index, label] of geometry.labels.entries()) {
      context.font = label.font;
      if (label.rows.some(row => context.measureText(row).width > label.width + 0.1)) errors.push(`Context label ${index}: overflow`);
      add(`context-${index}`, {x:label.x * 4 / 3, y:(label.y + top) * 4 / 3, width:label.width * 4 / 3, height:label.height * 4 / 3});
    }
  }
  for (const [index, box] of boxes.entries()) for (const other of boxes.slice(index + 1)) {
    const overlapX = Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x);
    const overlapY = Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y);
    if (overlapX > 1 && overlapY > 1) errors.push(`Overlap: ${box.name} / ${other.name}`);
  }
  for (const element of Array.from(document.querySelectorAll('[data-course-zone]'))) {
    const rect = element.getBoundingClientRect();
    const content = element.firstElementChild.getBoundingClientRect();
    if (content.height > rect.height + 1 || content.width > rect.width + 1 || element.scrollWidth > rect.width + 1) errors.push(`${element.dataset.courseZone}: text overflow`);
  }
  const rgba = drawing.getImageData(0, 0, canvas.width, canvas.height).data;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', rgba));
  const canvasSha256 = Array.from(digest, value => value.toString(16).padStart(2, '0')).join('');
  console.log(`REMOTION_COURSE_LAYOUT ${JSON.stringify({frame, scene:state.index, cue:state.cueIndex, boxes, errors, diagram:geometry?.kind, marks:geometry?.marks, authored, opening:content.opening, canvasSha256})}`);
}

export function Course({storyboard, audit = false}) {
  const frame = useCurrentFrame();
  const host = useRef(null);
  const board = useRef(null);
  const state = courseFrame(storyboard, frame);
  const animation = storyboard.animation ?? storyboard.item.animation;
  useLayoutEffect(() => {
    const gate = delayRender('Measured whiteboard frame and bundled fonts');
    let active = true;
    Promise.all([document.fonts.load('28px Atkinson'), document.fonts.load('bold 26px Atkinson')]).then(() => document.fonts.ready).then(async () => {
      if (!active) return;
      for (const element of Array.from(document.querySelectorAll('[data-course-zone]'))) {
        const content = element.firstElementChild;
        let size = Number(element.dataset.fontSize);
        element.style.fontSize = `${size}px`;
        while ((content.getBoundingClientRect().height > element.clientHeight - 4 || content.scrollWidth > element.clientWidth) && size > 14) element.style.fontSize = `${--size}px`;
      }
      if (!board.current) {
        board.current = createWhiteboard(host.current, {animation});
        board.current.resize(1280);
      }
      board.current.render(state);
      if (audit) await auditBoard(host.current, state, frame, animation);
      continueRender(gate);
    }).catch(cancelRender);
    return () => {active = false; continueRender(gate);};
  }, [frame, storyboard, audit]);
  useLayoutEffect(() => () => {board.current?.dispose(); board.current = null;}, []);
  return <AbsoluteFill style={{background:'#fcfefd', color:'#253330', fontFamily:'Atkinson', letterSpacing:0}}>
    <style>{`@font-face{font-family:Atkinson;src:url('${staticFile('atkinson-latin-400.woff2')}')}@font-face{font-family:Atkinson;src:url('${staticFile('atkinson-latin-700.woff2')}');font-weight:700}`}</style>
    <header data-course-zone="title" data-font-size="22" style={{position:'absolute', left:32, top:12, width:1216, height:52, display:'flex', alignItems:'center', borderBottom:'1px solid #dce7e1', fontSize:22, fontWeight:700}}><span style={{width:'100%', overflowWrap:'anywhere'}}>{storyboard.item.title}</span></header>
    <div ref={host} style={{position:'absolute', top:68, width:1280, height:564}} />
    <footer data-course-zone="caption" data-font-size="23" style={{position:'absolute', left:32, top:640, width:1216, height:72, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', fontSize:23, lineHeight:1.25, borderTop:'1px solid #dce7e1'}}><span style={{width:'100%', overflowWrap:'anywhere'}}>{state.caption}</span></footer>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="Course" component={Course} {...VIDEO} durationInFrames={30} calculateMetadata={({props}) => ({durationInFrames:props.storyboard.frames})} />);