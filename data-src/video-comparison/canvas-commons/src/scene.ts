import {Latex, Line, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {createSignal, linear, type SignalValue} from '@canvas-commons/core';

interface Cue {start: number; end: number; text: string}
interface Storyboard {
  width: number; height: number; fps: number; frames: number; duration: number;
  cues: Cue[]; models: {id: string; start: number; probability: number}[];
}
declare const FROZEN_STORYBOARD: Storyboard;
const script = FROZEN_STORYBOARD;
const color = {
  paper: '#f6f8fb', ink: '#17232b', muted: '#53626c', grid: '#d8e1e6',
  teal: '#167d8d', pale: '#d8edf0', gold: '#d78915', blue: '#345fba', band: '#17232b',
};
const position = (x: number, y: number): [number, number] => [x - 640, y - 360];
const plotX = (time: number) => 145 + 285 * time;
const plotY = (density: number) => 465 - 270 * density;
const ramp = (time: number, start: number, length: number) => Math.max(0, Math.min(1, (time - start) / length));

export const renderChecks = {captions: [] as {start: number; end: number; lines: string[]; widths: number[]}[], formulas: [] as {tex: string; width: number; height: number}[]};

function captionLines(text: string) {
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = '400 30px Plex';
  if (context.measureText(text).width <= 1120) return [text];
  const words = text.split(' ');
  let best: string[] = [];
  let score = Infinity;
  for (let split = 1; split < words.length; split++) {
    const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
    const widths = lines.map(line => context.measureText(line).width);
    const candidate = Math.max(...widths) + Math.abs(widths[0] - widths[1]) * 0.1;
    if (Math.max(...widths) <= 1120 && candidate < score) {best = lines; score = candidate;}
  }
  if (!best.length) throw new Error(`Caption cannot fit: ${text}`);
  return best;
}

export default makeScene2D(function* (view) {
  renderChecks.captions = [];
  renderChecks.formulas = [];
  const clock = createSignal(0);
  const uniform = () => clock() < 22.8 ? 1 : 0;
  const increasing = () => clock() >= 22.8 && clock() < 32 ? 1 : 0;
  const piecewise = () => clock() >= 32 ? 1 : 0;
  const within = (start: number, end: number) => () => clock() >= start && clock() < end ? 1 : 0;

  const text = (parent: Node, value: SignalValue<string>, x: number, y: number,
    width = 420, fontSize = 28, fill = color.ink, align: 'left' | 'center' | 'right' = 'center', weight = 400) => {
    const label = new Txt({text: value, position: position(x, y), width, height: fontSize * 1.5,
      fontFamily: 'Plex', fontSize, fontWeight: weight, textAlign: align, textWrap: false,
      verticalAlign: 'middle', lineHeight: '120%', letterSpacing: 0, fill});
    parent.add(label);
    return label;
  };
  const line = (parent: Node, points: number[][], stroke = color.ink, width = 3, dashed = false) => {
    const shape = new Line({points: points.map(([x, y]) => position(x, y)), stroke, lineWidth: width,
      lineCap: 'round', lineDash: dashed ? [7, 7] : []});
    parent.add(shape);
    return shape;
  };
  const formula = (parent: Node, tex: string, x: number, y: number, width = 402, fontSize = 35, fill = color.ink) => {
    const node = new Latex({tex, position: position(x, y), fontSize, fill});
    parent.add(node);
    const size = node.size();
    const scale = Math.min(1, width / size.x);
    node.scale(scale);
    renderChecks.formulas.push({tex, width: size.x * scale, height: size.y * scale});
    return node;
  };
  const phase = (start: number, end: number) => {
    const group = new Node({opacity: within(start, end)});
    view.add(group);
    return group;
  };

  view.add(new Rect({size: [1280, 720], fill: color.paper}));
  line(view, [[64, 12], [1216, 12]], color.teal, 6);
  text(view, 'Probabilidad como area', 640, 56, 1152, 42, color.ink, 'left', 600);
  text(view, () => ['01', '02', '03'][clock() < 22.8 ? 0 : clock() < 32 ? 1 : 2], 1178, 56, 76, 38, color.muted, 'right', 600);
  text(view, () => clock() < 22.8 ? 'MODELO 1  /  DENSIDAD CONSTANTE' : clock() < 32
    ? 'OTRO MODELO 2  /  DENSIDAD CRECIENTE' : 'OTRO MODELO 3  /  DENSIDAD POR TRAMOS',
    640, 112, 1152, 23, color.teal, 'left', 600);
  line(view, [[785, 154], [785, 589]], color.grid, 2);

  text(view, 'Densidad f(t)  (1/min)', 335, 157, 460, 25, color.muted, 'left');
  for (const density of [0.25, 0.5, 0.75, 1]) {
    line(view, [[145, plotY(density)], [730, plotY(density)]], color.grid, 1, true);
    const tick = text(view, String(density), 100, plotY(density), 58, 22, color.muted, 'right');
    if (density === 0.25 || density === 0.75) tick.opacity(piecewise);
  }
  line(view, [[145, 477], [145, 186]], color.ink, 3);
  line(view, [[145, 186], [140, 199], [150, 199], [145, 186]], color.ink, 2);
  line(view, [[122, 465], [754, 465]], color.ink, 3);
  line(view, [[754, 465], [741, 460], [741, 470], [754, 465]], color.ink, 2);
  for (const endpoint of [0, 2]) {
    line(view, [[plotX(endpoint), 465], [plotX(endpoint), 474]], color.ink, 2);
    text(view, String(endpoint), plotX(endpoint), 494, 48, 25);
  }
  text(view, 't (min)', 713, 549, 115, 24, color.muted, 'right');
  formula(view, 'f(t)=0\\;\\text{ fuera de }[0,2],\\qquad \\text{area total}=1', 429, 594, 680, 24, color.muted);

  const uniformPlot = new Node({opacity: uniform});
  view.add(uniformPlot);
  uniformPlot.add(new Rect({position: position(430, plotY(0.25)), size: [570, 135], fill: color.pale}));
  line(uniformPlot, [[145, 465], [145, 330], [715, 330], [715, 465]], color.teal, 4);
  const selected = new Rect({position: () => position(plotX(0.4) + 114, 465 - 67.5 * ramp(clock(), 11.9, 2)),
    width: 228, height: () => 135 * ramp(clock(), 11.9, 2), fill: color.teal});
  uniformPlot.add(new Rect({position: position(373, 397.5), size: [228, 135], fill: color.teal,
    opacity: () => 0.17 * ramp(clock(), 4.7, 0.8)}));
  uniformPlot.add(selected);
  text(uniformPlot, 'altura 0.5', 356, 304, 215, 25, color.teal, 'center', 600);

  const interval = new Node({opacity: () => ramp(clock(), 4.7, 0.6)});
  view.add(interval);
  for (const endpoint of [0.4, 1.2]) {
    line(interval, [[plotX(endpoint), 286], [plotX(endpoint), 465]], color.teal, 2, true);
    line(interval, [[plotX(endpoint), 465], [plotX(endpoint), 475]], color.teal, 3);
    text(interval, String(endpoint), plotX(endpoint), 494, 70, 25, color.teal, 'center', 600);
  }
  const widthMeasure = new Node({opacity: within(8.8, 22.8)});
  view.add(widthMeasure);
  line(widthMeasure, [[259, 514], [259, 524], [487, 524], [487, 514]], color.gold, 3);
  text(widthMeasure, 'anchura 0.8 min', 373, 553, 330, 25, color.gold, 'center', 600);
  const heightMeasure = new Node({opacity: within(11.9, 22.8)});
  view.add(heightMeasure);
  line(heightMeasure, [[220, 330], [210, 330], [210, 465], [220, 465]], color.gold, 3);

  const first = phase(0, 4.7);
  text(first, 'Todo el soporte', 1012, 205, 402, 27, color.muted, 'left');
  formula(first, 'f(t)=0.5\\;\\mathrm{min}^{-1}', 1015, 280);
  formula(first, '(2\\;\\mathrm{min})(0.5\\;\\mathrm{min}^{-1})', 1015, 365, 402, 30);
  formula(first, '\\text{Area}=1', 1015, 459, 402, 48, color.teal);
  const limits = phase(4.7, 8.8);
  text(limits, 'Solo el intervalo elegido', 1012, 205, 402, 27, color.muted, 'left');
  formula(limits, '0.4\\le T\\le 1.2', 1015, 293, 402, 41);
  formula(limits, 'P(0.4\\le T\\le1.2)=?', 1015, 414, 402, 34, color.teal);
  const width = phase(8.8, 11.9);
  text(width, 'Restar los limites', 1012, 205, 402, 27, color.muted, 'left');
  formula(width, '1.2-0.4=0.8', 1015, 310, 402, 42, color.gold);
  formula(width, '\\text{Anchura}=0.8\\;\\mathrm{min}', 1015, 417, 402, 32);
  const multiply = phase(11.9, 15.9);
  text(multiply, 'Altura por anchura', 1012, 205, 402, 27, color.muted, 'left');
  formula(multiply, '0.5\\times0.8', 1015, 315, 402, 54, color.teal);
  formula(multiply, '=0.4', 1015, 436, 402, 56, color.teal).opacity(() => ramp(clock(), 13.5, 1));
  const result = phase(15.9, 19.4);
  text(result, 'Area = probabilidad', 1012, 205, 402, 27, color.muted, 'left');
  formula(result, 'P(0.4\\le T\\le1.2)', 1015, 320, 402, 37);
  formula(result, '=0.4', 1015, 434, 402, 60, color.teal);
  const units = phase(19.4, 22.8);
  text(units, 'Las unidades se cancelan', 1012, 205, 402, 27, color.muted, 'left');
  formula(units, '\\underbrace{0.5\\;\\mathrm{min}^{-1}}_{\\text{altura}}\\;\\times\\;\\underbrace{0.8\\;\\mathrm{min}}_{\\text{anchura}}', 1015, 315, 402, 32);
  formula(units, '\\mathrm{min}^{-1}\\,\\mathrm{min}=1', 1015, 415, 402, 35, color.gold);
  text(units, '0.4  /  sin unidades', 1015, 512, 402, 30, color.teal, 'center', 600);

  const slopePlot = new Node({opacity: increasing});
  view.add(slopePlot);
  slopePlot.add(new Line({points: [position(145, 465), position(715, 195), position(715, 465)], closed: true, fill: color.pale}));
  line(slopePlot, [[145, 465], [715, 195], [715, 465]], color.teal, 4);
  const selectedSlope = new Line({points: () => {
    const end = 0.4 + 0.8 * ramp(clock(), 26.3, 3.3);
    return [position(plotX(0.4), 465), position(plotX(0.4), plotY(0.2)),
      position(plotX(end), plotY(end / 2)), position(plotX(end), 465)];
  }, closed: true, fill: color.teal, opacity: () => clock() >= 26.3 ? 0.8 : 0});
  slopePlot.add(selectedSlope);
  const strips = new Node({opacity: () => clock() < 26.3 ? 1 : 0.35});
  slopePlot.add(strips);
  for (let strip = 0; strip < 24; strip++) {
    const left = 0.4 + strip * 0.8 / 24;
    const right = left + 0.8 / 24;
    const midHeight = (left + right) / 4;
    const bar = new Rect({position: position((plotX(left) + plotX(right)) / 2, 465 - 135 * midHeight),
      size: [285 * 0.8 / 24 - 1, 270 * midHeight], fill: color.teal,
      opacity: () => ramp(clock(), 22.8 + strip * 0.055, 0.4)});
    strips.add(bar);
  }
  const subdivisions = phase(22.8, 26.3);
  text(subdivisions, 'La altura ahora cambia', 1012, 205, 402, 27, color.muted, 'left');
  formula(subdivisions, 'f(t)=\\frac{t}{2}', 1015, 297, 402, 46);
  formula(subdivisions, '\\Delta P\\approx f(t)\\,\\Delta t', 1015, 422, 402, 31, color.teal);
  text(subdivisions, 'Nueva densidad, nueva area', 1015, 522, 402, 25, color.muted);
  const integral = phase(26.3, 32);
  text(integral, 'Acumular cada aportacion', 1012, 205, 402, 27, color.muted, 'left');
  formula(integral, '\\int_{0.4}^{1.2}\\frac{t}{2}\\,dt', 1015, 296, 402, 48, color.teal);
  formula(integral, '=\\left[\\frac{t^2}{4}\\right]_{0.4}^{1.2}=0.32', 1015, 426, 402, 36);
  text(integral, 'dt: recorre el tiempo t', 1015, 536, 402, 26, color.muted);
  const differential = new Node({opacity: within(26.3, 32)});
  view.add(differential);
  const cursorTime = () => 0.4 + 0.8 * ramp(clock(), 26.3, 3.3);
  const cursor = new Line({points: () => [position(plotX(cursorTime()), plotY(cursorTime() / 2)), position(plotX(cursorTime()), 465)], stroke: color.gold, lineWidth: 4});
  differential.add(cursor);
  line(differential, [[335, 524], [335, 534], [344.5, 534], [344.5, 524]], color.gold, 3);
  formula(differential, 'dt', 339.75, 558, 60, 29, color.gold);

  const piecePlot = new Node({opacity: piecewise});
  view.add(piecePlot);
  piecePlot.add(new Rect({position: position(287.5, plotY(0.125)), size: [285, 67.5], fill: color.pale}));
  piecePlot.add(new Rect({position: position(572.5, plotY(0.375)), size: [285, 202.5], fill: '#e3eafb'}));
  line(piecePlot, [[145, 465], [145, 397.5], [430, 397.5]], color.teal, 4);
  line(piecePlot, [[430, 262.5], [715, 262.5], [715, 465]], color.blue, 4);
  piecePlot.add(new Rect({position: position(344.5, 431.25), size: [171, 67.5], fill: color.teal, opacity: () => ramp(clock(), 32.2, 1)}));
  piecePlot.add(new Rect({position: position(458.5, 363.75), size: [57, 202.5], fill: color.blue, opacity: () => ramp(clock(), 33.1, 1)}));
  line(piecePlot, [[430, 230], [430, 476]], color.gold, 3, true);
  text(piecePlot, '1', 430, 494, 44, 25, color.gold, 'center', 600);
  text(piecePlot, 'frontera: t = 1', 582, 223, 262, 25, color.gold, 'left', 600);
  line(piecePlot, [[259, 514], [259, 524], [430, 524], [430, 514]], color.teal, 3);
  line(piecePlot, [[430, 514], [430, 524], [487, 524], [487, 514]], color.blue, 3);
  formula(piecePlot, '0.6', 344.5, 556, 120, 25, color.teal);
  formula(piecePlot, '0.2', 458.5, 556, 70, 25, color.blue);
  const split = phase(32, 36.7);
  text(split, 'Una regla en cada tramo', 1012, 202, 402, 27, color.muted, 'left');
  formula(split, 'f(t)=\\begin{cases}0.25,&0\\le t<1\\\\0.75,&1\\le t\\le2\\end{cases}', 1015, 288, 402, 31);
  formula(split, '\\int_{0.4}^{1}0.25\\,dt', 1015, 409, 402, 36, color.teal);
  formula(split, '+\\int_{1}^{1.2}0.75\\,dt', 1015, 510, 402, 36, color.blue);
  const final = phase(36.7, 40);
  text(final, 'No extender una regla', 1012, 202, 402, 27, color.muted, 'left');
  formula(final, '0.25(1-0.4)=0.15', 1015, 285, 402, 32, color.teal);
  formula(final, '0.75(1.2-1)=0.15', 1015, 358, 402, 32, color.blue);
  formula(final, 'P=0.15+0.15=0.30', 1015, 458, 402, 39);
  text(final, 'Dos tramos, una probabilidad', 1015, 555, 402, 24, color.muted);

  view.add(new Rect({position: position(640, 670), size: [1280, 100], fill: color.band}));
  for (const [index, cue] of script.cues.entries()) {
    const lines = captionLines(cue.text);
    const measuring = document.createElement('canvas').getContext('2d')!;
    measuring.font = '400 30px Plex';
    renderChecks.captions.push({...cue, lines, widths: lines.map(value => measuring.measureText(value).width)});
    const group = new Node({opacity: within(cue.start, script.cues[index + 1]?.start ?? 40)});
    view.add(group);
    for (const [lineIndex, content] of lines.entries()) {
      text(group, content, 640, lines.length === 1 ? 670 : 650 + 39 * lineIndex, 1120, 30, '#ffffff');
    }
  }
  yield* clock(script.duration, script.duration, linear);
});