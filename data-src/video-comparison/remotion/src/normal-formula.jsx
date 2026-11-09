import React, {useEffect, useState} from 'react';
import katex from 'katex';
import {cancelRender, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const render = tex => katex.renderToString(tex, {throwOnError: true, output: 'html'});

function tokens(parts, widths) {
  const occurrences = new Map();
  let cursor = -parts.reduce((sum, tex) => sum + widths[tex] + 15, 0) / 2;
  return parts.map(tex => {
    const occurrence = occurrences.get(tex) ?? 0;
    occurrences.set(tex, occurrence + 1);
    const token = {id: `${tex}:${occurrence}`, tex, center: cursor + widths[tex] / 2};
    cursor += widths[tex] + 15;
    return token;
  });
}

export function FormulaTransition({story}) {
  const frame = useCurrentFrame();
  const [widths, setWidths] = useState(null);
  const [handle] = useState(() => delayRender('Measure formula tokens'));
  useEffect(() => {
    let active = true;
    const fonts = ['VideoSans', 'VideoSerif', 'KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4'];
    Promise.all(fonts.map(font => document.fonts.load(`40px ${font}`)))
      .then(() => document.fonts.load('italic 40px KaTeX_Math'))
      .then(() => document.fonts.ready).then(() => {
        const element = document.createElement('div');
        element.className = 'formula';
        Object.assign(element.style, {position: 'fixed', visibility: 'hidden', display: 'inline-block', fontSize: '40px'});
        document.body.appendChild(element);
        const measured = {};
        try {
          for (const tex of new Set(Object.values(story.formulas).flat())) {
            element.innerHTML = render(tex);
            measured[tex] = element.getBoundingClientRect().width;
          }
        } finally {element.remove();}
        if (active) {setWidths(measured); continueRender(handle);}
      }).catch(cancelRender);
    return () => {active = false;};
  }, [handle, story]);
  if (!widths) return null;
  const changes = Object.keys(story.formulas).filter(name => name in story.events);
  const index = changes.findLastIndex(name => frame >= story.events[name][0] * story.fps);
  const current = index < 0 ? 'density' : changes[index];
  const previous = index < 1 ? 'density' : changes[index - 1];
  const progress = index < 0 ? 1 : interpolate(frame, story.events[current].map(time => time * story.fps), [0, 1], clamp);
  const before = new Map(tokens(story.formulas[previous], widths).map(token => [token.id, token]));
  const after = new Map(tokens(story.formulas[current], widths).map(token => [token.id, token]));
  const totalWidth = Math.max(...[previous, current].map(name => story.formulas[name].reduce((sum, tex) => sum + widths[tex] + 15, 0)));
  const scale = Math.min(1, 1140 / totalWidth);
  return <div className="formula" style={{position: 'absolute', left: '50%', top: 134, width: 0, fontSize: 40, transform: `scale(${scale})`}}>
    {Array.from(new Set([...before.keys(), ...after.keys()])).map(id => {
      const from = before.get(id);
      const to = after.get(id);
      const token = to ?? from;
      const center = from && to ? from.center + (to.center - from.center) * progress : token.center;
      const opacity = from && to ? 1 : to ? progress : 1 - progress;
      const offset = from && to ? 0 : to ? 20 * (1 - progress) : -20 * progress;
      return <span key={id} style={{position: 'absolute', left: center, top: offset, opacity, whiteSpace: 'nowrap', transform: 'translate(-50%, -50%)'}}
        dangerouslySetInnerHTML={{__html: render(token.tex)}} />;
    })}
  </div>;
}