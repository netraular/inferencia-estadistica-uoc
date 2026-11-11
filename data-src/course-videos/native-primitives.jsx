import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const PALETTE = Object.freeze({ink:'#253330', muted:'#63716c', green:'#117568', coral:'#b33c60', blue:'#286f9b', gold:'#c39826', paper:'#fcfefd', line:'#dce7e1', soft:'#e7f2ec'});
export const ease = value => {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
};
export const mix = (from, to, progress) => from + (to - from) * ease(progress);

export function SceneSurface({children, label}) {
  return <div data-native-scene={label} style={{position:'relative', width:1200, height:480, overflow:'hidden'}}>{children}</div>;
}

export class MathFormula extends React.Component {
  componentDidMount() {this.fit();}

  componentDidUpdate(previous) {
    if (['tex', 'width', 'fontSize'].some(key => previous[key] !== this.props[key])) this.fit();
  }

  componentWillUnmount() {this.release?.();}

  fit() {
    const {cancelRender, continueRender, delayRender} = require('remotion');
    this.release?.();
    const element = this.element;
    const {fontSize = 28} = this.props;
    const gate = delayRender('Fit native mathematical content');
    let active = true;
    this.release = () => {if (active) {active = false; continueRender(gate);}};
    element.style.fontSize = `${fontSize}px`;
    element.getBoundingClientRect();
    document.fonts.ready.then(() => {
      if (!active) return;
      const available = element.getBoundingClientRect().width;
      const natural = element.firstElementChild.getBoundingClientRect().width;
      if (natural > available) element.style.fontSize = `${fontSize * Math.max(0, available - 1) / natural}px`;
      this.release();
    }).catch(error => {if (active) {this.release(); cancelRender(error);}});
  }

  render() {
    const {tex, x = 0, y = 0, width = 1200, fontSize = 28, opacity = 1} = this.props;
    return <div ref={element => {this.element = element;}} data-native-math={tex} data-native-bound style={{position:'absolute', left:x, top:y, width, fontSize, opacity, textAlign:'center', color:PALETTE.ink}}>
      <div style={{display:'flow-root', width:'max-content', margin:'0 auto'}} dangerouslySetInnerHTML={{__html:katex.renderToString(tex, {throwOnError:true, output:'html', displayMode:true, trust:false})}} />
    </div>;
  }
}

export function SvgText({text, children, x, y, width = 400, fontSize = 24, fill = PALETTE.ink, anchor = 'start', ...props}) {
  const words = String(text ?? children ?? '').split(/\s+/u);
  const rows = [];
  let row = '';
  const limit = Math.max(4, Math.floor(width / (fontSize * 0.56)));
  for (const word of words) {
    if (row && `${row} ${word}`.length > limit) {rows.push(row); row = word;}
    else row = row ? `${row} ${word}` : word;
  }
  if (row) rows.push(row);
  return <text data-native-bound x={x} y={y} fill={fill} fontFamily="Atkinson" fontSize={fontSize} textAnchor={anchor} {...props}>
    {rows.map((value, index) => <tspan key={index} x={x} dy={index ? fontSize * 1.25 : 0}>{value}</tspan>)}
  </text>;
}