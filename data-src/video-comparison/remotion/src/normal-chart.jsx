import React from 'react';
import jStat from 'jstat';

const green = '#008b70';
const coral = '#bf5547';
const baseline = 220;
const ordinate = density => baseline - density * 400;

export function NormalChart({mean, sigma, selected, shade, tail, draw = 1, standard = false, showPoint = false, showWidth = false}) {
  const domain = standard ? [-4, 4] : [2, 18];
  const abscissa = value => 52 + (value - domain[0]) / (domain[1] - domain[0]) * 470;
  const density = value => jStat.normal.pdf(value, mean, sigma);
  const points = (start, end) => Array.from({length: 81}, (_, index) => {
    const value = start + (end - start) * index / 80;
    return `${abscissa(value)},${ordinate(density(value))}`;
  }).join(' L');
  const area = (start, end) => `M${abscissa(start)},${baseline} L${points(start, end)} L${abscissa(end)},${baseline} Z`;
  const edge = Math.max(domain[0], Math.min(domain[1], mean + sigma * shade));
  const threshold = standard ? 1 : 12;
  return <svg viewBox="0 0 550 295" width="550" height="295" aria-label={standard ? 'Normal estandar' : 'Normal original'}>
    <text x="52" y="24" fontSize="19" fill="#596860">Densidad</text>
    {[0.1, 0.2, 0.3, 0.4].map(value => <line key={value} x1="52" x2="522" y1={ordinate(value)} y2={ordinate(value)} stroke="#e3e9e5" />)}
    {shade > -4 && <path d={area(domain[0], edge)} fill={green} opacity={0.3 * (1 - tail)} />}
    {tail > 0 && <path d={area(threshold, domain[1])} fill={coral} opacity={0.3 * tail} />}
    <path d={`M${points(...domain)}`} fill="none" stroke={green} strokeWidth="4" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
    <path d={`M52,${ordinate(0.45)} V${baseline} H530`} fill="none" stroke="#596860" strokeWidth="2" />
    {[domain[0], mean, domain[1]].map(value => <g key={value}>
      <line x1={abscissa(value)} x2={abscissa(value)} y1={baseline} y2={baseline + 7} stroke="#596860" />
      <text x={abscissa(value)} y={baseline + 29} textAnchor="middle" fontSize="20" fill="#182d28">{value}</text>
    </g>)}
    {showPoint && <g>
      <line x1={abscissa(selected)} x2={abscissa(selected)} y1={baseline} y2={ordinate(density(selected))} stroke={coral} strokeWidth="2" />
      <circle cx={abscissa(selected)} cy={ordinate(density(selected))} r="6" fill={coral} />
      <text x="475" y="24" textAnchor="end" fontSize="26" fill={coral}>{standard ? 'z' : 'x'} = {selected.toFixed(2)}</text>
    </g>}
    {showWidth && <path d={`M${abscissa(mean-sigma)},263 v7 H${abscissa(mean+sigma)} v-7`} fill="none" stroke={green} strokeWidth="2" />}
    <text x="527" y="274" textAnchor="end" fontSize="24" fill="#182d28">{standard ? 'Z' : 'X'}</text>
  </svg>;
}