import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {CAPSTONE, getCapstoneExercises} from '../../pages/inferencia/capstone.js';
import ExerciseCollection from './ExerciseCollection';

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const sourcePages = [[1],[1,2],[2]];
const probability = value => new Intl.NumberFormat('es', {style:'percent',maximumFractionDigits:4}).format(value);
const asset = (baseUrl, path) => `${baseUrl.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
const shadowStyles = `:host{display:block;font:17px/1.55 Atkinson,'Trebuchet MS',sans-serif;color:#253330;--paper:#fff;--ink:#253330;--muted:#63716c;--line:#dae3df;--teal:#117568;--teal-soft:#e8f3ef;--rose:#a93458;--rose-soft:#fbecf0;--gold:#d7a534;--gold-soft:#fff7dd}
.capstone{min-width:0;overflow-wrap:anywhere;letter-spacing:0}.capstone .tutor-heading label{min-width:0;flex:1}.capstone .tutor-heading select{width:100%;max-width:100%;text-overflow:ellipsis}.capstone .tutor-surface>*{min-width:0}.capstone .tutor-figure canvas{display:block;width:100%;height:auto;aspect-ratio:auto}.capstone .tutor-equation{max-width:100%;overflow-x:auto}.capstone .tutor-controls{flex-wrap:wrap}.capstone-matrix-note,.capstone-source{font-size:.85rem;color:#63716c}.capstone-statement{padding:16px 0;border-bottom:1px solid #dae3df}.capstone-statement h3,.capstone-solutions h3{font-size:1.2rem}.capstone-solution{margin:0;padding:16px 0;border:0;border-bottom:1px solid #dae3df;border-radius:0;background:none;box-shadow:none}.capstone-solution>summary,.capstone-sample-space>summary{cursor:pointer;line-height:1.6}.capstone-solution>summary:focus-visible,.capstone-sample-space>summary:focus-visible{outline:2px solid #117568;outline-offset:4px}.capstone-solution-content{padding-top:16px}.capstone-solution-content li{margin-bottom:16px}.capstone-math{max-width:100%;overflow-x:auto;overflow-y:hidden}.capstone-sample-space{margin:20px 0}.capstone-table-scroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}.capstone-table-scroll:focus-visible{outline:2px solid #117568;outline-offset:2px}.capstone-table{border-collapse:collapse;font-size:.85rem;line-height:1.5}.capstone-table caption{text-align:left;padding:12px 0;white-space:normal;max-width:640px}.capstone-table th,.capstone-table td{min-width:9rem;padding:8px;border:1px solid #dae3df;text-align:left;vertical-align:top}.capstone-table td[data-observed="true"]{background:#e8f3ef}.capstone-table td[data-joint="true"]{background:#fbecf0;color:#7e2542}.capstone-posterior{margin:20px 0}.capstone-posterior>div{display:grid;grid-template-columns:3rem minmax(0,1fr);gap:8px;margin:12px 0}.capstone-posterior label{display:grid;grid-template-columns:minmax(0,1fr) minmax(70px,1fr);gap:8px;align-items:center}.capstone-posterior meter{width:100%;height:20px;accent-color:#117568}.capstone-posterior label+label{grid-column:2}.capstone-predictive{margin:20px 0}.capstone-predictive canvas{display:block;width:100%;height:auto}.capstone-tree{padding-left:24px}.capstone-tree>li{border-left:3px solid #117568;padding:8px 0 8px 16px}.capstone-reference{border-left:3px solid #a93458;padding-left:16px}.capstone [hidden]{display:none!important}`;

function sourceMarkup(exercise, baseUrl) {
  const index = CAPSTONE.sections.findIndex(section => section.exerciseId === exercise.id);
  return `Fuente: ${escape(exercise.source.file)}; ejercicio ${escape(exercise.source.number)}; ${sourcePages[index].map(page => `<a href="${escape(asset(baseUrl,exercise.source.url))}#page=${page}">página ${page}</a>`).join(' y ')}.`;
}

function sampleSpaceMarkup(sample, selected) {
  const days = {L:'lunes',Ma:'martes',Mi:'miércoles',J:'jueves',V:'viernes'};
  const outcome = label => {
    const [genotype,day] = label.split('-');
    return `${genotype === 'C' ? 'portador' : 'no portador'}, ${days[day]}`;
  };
  const columnLabel = label => {
    if (!selected) return `Descendiente 2: ${outcome(label)}`;
    const [selection,state] = label.split(':');
    return `Selección del descendiente ${selection.slice(1)}; descendiente 2: ${outcome(state)}`;
  };
  const states = new Map(sample.states.map(state => [`${state.row}/${state.column}`,state]));
  const caption = `${sample.denominator} resultados equiprobables, peso 1/${sample.denominator} por celda. Las filas identifican genotipo y día del descendiente 1; las columnas, los del descendiente 2${selected ? ' y la elección previa S del técnico (S1 o S2)' : ''}. C significa portador; N, no portador. El aviso exige portador y lunes${selected ? ' en el elegido' : ' en al menos uno'}. Hay ${sample.eventCount} avisos y ${sample.jointCount} avisos con ambos portadores. Cada celda es un resultado completo; los colores no sustituyen su descripción.`;
  return `<details class="capstone-sample-space"><summary>Espacio muestral completo: ${sample.denominator} resultados (${sample.table.rows.length} × ${sample.table.columns.length})</summary><div class="capstone-table-scroll" role="region" tabindex="0" aria-label="Tabla completa de ${sample.denominator} resultados"><table class="capstone-table"><caption>${escape(caption)}</caption><thead><tr><th scope="col">Descendiente 1 / descendiente 2${selected ? ' y elección' : ''}</th>${sample.table.columns.map(label => `<th scope="col">${escape(columnLabel(label))}</th>`).join('')}</tr></thead><tbody>${sample.table.rows.map((label,row) => `<tr><th scope="row">Descendiente 1: ${escape(outcome(label))}</th>${sample.table.columns.map((_,column) => {
    const state = states.get(`${row}/${column}`);
    return `<td data-observed="${state.observed}" data-joint="${state.observed && state.bothCarriers}">${state.observed ? 'Aviso' : 'Sin aviso'}; ${state.bothCarriers ? 'ambos portadores' : 'no ambos portadores'}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

function posteriorMarkup(branches) {
  const total = branches.reduce((sum,branch) => sum+branch.joint,0);
  return `<figure class="capstone-posterior"><figcaption>Antes y después de observar cuatro colonias</figcaption>${branches.map(branch => `<div><strong>${escape(branch.incubator)}</strong><label>Previa ${probability(branch.prior)}<meter min="0" max="1" value="${branch.prior}" aria-label="Previa ${escape(branch.incubator)}">${probability(branch.prior)}</meter></label><label>Posterior ${probability(branch.joint/total)}<meter min="0" max="1" value="${branch.joint/total}" aria-label="Posterior ${escape(branch.incubator)}">${probability(branch.joint/total)}</meter></label></div>`).join('')}</figure>`;
}

function predictiveEvidence(branches, includeCanvas=true) {
  const total = branches.reduce((sum,branch) => sum+branch.joint,0);
  const routes = branches.map(branch => ({...branch,weight:branch.joint/total,zero:Math.exp(-branch.rate)}));
  return {
    diagram:{kind:'tree',label:'Una misma incubadora oculta para las dos placas',nodes:routes.map(route => ({label:route.incubator,weight:route.weight,children:[{label:`N₂=0; aporte ${probability(route.weight*route.zero)}`,weight:route.zero}]}))},
    markup:`<figure class="capstone-predictive"><figcaption>Predicción tras observar N₁=4: se conserva la incubadora</figcaption>${includeCanvas ? '<canvas width="720" height="360" role="img" aria-label="Árbol predictivo: posterior de cada incubadora por probabilidad de cero colonias dentro de ella"></canvas>' : ''}<ul class="capstone-tree">${routes.map(route => `<li><strong>${escape(route.incubator)}</strong>: posterior ${probability(route.weight)} → cero colonias ${probability(route.zero)} → aporte conjunto ${probability(route.weight*route.zero)}.</li>`).join('')}</ul><p>Las rutas se suman: ${probability(routes.reduce((sum,route) => sum+route.weight*route.zero,0))}. No se vuelve a sortear la incubadora ni se recuperan las probabilidades previas.</p></figure>`
  };
}

export function mountCapstoneExercise(host, {exerciseId, baseUrl = '/', mountTutor, drawDiagram, math, icons}) {
  const exercise = getCapstoneExercises().find(item => item.id === exerciseId);
  if (!exercise) throw new Error(`Ejercicio de culminación desconocido: ${exerciseId}`);
  const sectionIndex = CAPSTONE.sections.findIndex(section => section.exerciseId === exerciseId);
  exercise.source = {...exercise.source,page:sourcePages[sectionIndex].join('–')};
  const owner = host.ownerDocument;
  const root = host.shadowRoot || host.attachShadow({mode:'open'});
  const fragment = owner.createDocumentFragment();
  for (const path of ['aula.css','katex/katex.min.css']) {
    const link = owner.createElement('link');
    link.rel = 'stylesheet';
    link.href = asset(baseUrl,path);
    fragment.append(link);
  }
  const style = owner.createElement('style');
  style.textContent = shadowStyles;
  const content = owner.createElement('div');
  content.className = 'capstone';
  content.innerHTML = `<section class="capstone-statement" aria-label="Enunciado y supuestos"><p>${escape(exercise.prompt)}</p><h3>Datos</h3><ul>${exercise.given.map(value => `<li>${escape(value)}</li>`).join('')}</ul><h3>Supuestos y notación</h3><ul>${exercise.assumptions.map(value => `<li>${escape(value)}</li>`).join('')}</ul></section><div data-exercise-tutor></div><section class="capstone-solutions" aria-label="Soluciones escritas"><h3>Soluciones razonadas</h3>${exercise.questions.map((question,index) => `<details class="capstone-solution" data-capstone-question="${index}"><summary>${escape(question.prompt)}</summary><div class="capstone-solution-content"></div></details>`).join('')}</section><p class="capstone-source">${sourceMarkup(exercise,baseUrl)}</p>`;
  fragment.append(style,content);
  root.replaceChildren(fragment);
  const formatMath = tex => `<div class="capstone-math">${math.renderToString(tex,{displayMode:true,throwOnError:false})}</div>`;
  let disposeTutor;
  const cleanups = [];
  const figures = new Map();
  const draw = () => {
    for (const [canvas,diagram] of figures) {
      if (!canvas.closest('details').hasAttribute('open')) continue;
      const context = canvas.getContext('2d');
      if (!context) continue;
      const width = Math.max(260,Math.round(canvas.getBoundingClientRect().width || 720));
      const height = 360;
      const ratio = owner.defaultView.devicePixelRatio || 1;
      canvas.width = Math.round(width*ratio);
      canvas.height = Math.round(height*ratio);
      context.setTransform(ratio,0,0,ratio,0,0);
      drawDiagram(context,diagram,width,height);
    }
  };
  const dispose = () => {
    disposeTutor?.();
    cleanups.forEach(cleanup => cleanup());
    figures.clear();
    root.replaceChildren();
  };
  try {
    disposeTutor = mountTutor(content.querySelector('[data-exercise-tutor]'),exercise,{formatMath,onHelp() {}});
    if (icons?.createElement && icons.icons) {
      const normalize = name => name.replace(/-/g,'').toLowerCase();
      const available = new Map(Object.entries(icons.icons).map(([name,node]) => [normalize(name),node]));
      for (const placeholder of Array.from(root.querySelectorAll('i[data-lucide]'))) {
        const node = available.get(normalize(placeholder.getAttribute('data-lucide')));
        if (!node) continue;
        const icon = icons.createElement(node);
        for (const attribute of Array.from(placeholder.attributes)) icon.setAttribute(attribute.name,attribute.value);
        icon.classList.add('lucide');
        placeholder.replaceWith(icon);
      }
    }
    const branches = exercise.questions.flatMap(question => question.tutorSteps).find(step => step.evidence?.kind === 'bayes-tree')?.evidence.branches;
    for (const details of Array.from(root.querySelectorAll('[data-capstone-question]'))) {
      const question = exercise.questions[Number(details.getAttribute('data-capstone-question'))];
      const reveal = () => {
        if (!details.hasAttribute('open')) return;
        const body = details.querySelector('.capstone-solution-content');
        if (!body.hasChildNodes()) {
          const sample = exercise.sampleSpaces?.[question.id === 'a' ? 'existential' : question.id === 'b' ? 'selected' : ''];
          const prediction = branches && question.id === 'c.ii' ? predictiveEvidence(branches) : null;
          body.innerHTML = `<ol>${question.steps.map(step => `<li><strong>${escape(step.title)}</strong><p>${escape(step.explanation)}</p>${step.tex ? formatMath(step.tex) : ''}</li>`).join('')}</ol>${question.answerTex ? formatMath(question.answerTex) : ''}<p>${escape(question.answerText)}</p><p>${escape(question.interpretation)}</p>${sample ? sampleSpaceMarkup(sample,question.id === 'b') : ''}${branches && question.id === 'c.i' ? posteriorMarkup(branches) : ''}${prediction?.markup || ''}${question.reference ? `<aside class="capstone-reference"><p>${escape(question.reference.interpretation)}</p>${formatMath(question.reference.tex)}<p>Valor exacto: ${probability(question.reference.answer)}. La respuesta solicitada usa aproximación normal y frontera 74,5.</p></aside>` : ''}<p class="capstone-source">${sourceMarkup(exercise,baseUrl)}</p>`;
          if (prediction) figures.set(body.querySelector('canvas'),prediction.diagram);
        }
        draw();
      };
      details.addEventListener('toggle',reveal);
      cleanups.push(() => details.removeEventListener('toggle',reveal));
    }
    owner.defaultView.addEventListener('resize',draw);
    cleanups.push(() => owner.defaultView.removeEventListener('resize',draw));
  } catch (failure) {
    dispose();
    throw failure;
  }
  return {exercise,root,dispose};
}

export function capstoneExtraMarkup(exercise,question,formatMath) {
  const sample=exercise.sampleSpaces?.[question.id === 'a' ? 'existential' : question.id === 'b' ? 'selected' : ''];
  const branches=exercise.questions.flatMap(item=>item.tutorSteps).find(step=>step.evidence?.kind === 'bayes-tree')?.evidence.branches;
  return `${sample ? sampleSpaceMarkup(sample,question.id === 'b') : ''}${branches && question.id === 'c.i' ? posteriorMarkup(branches) : ''}${branches && question.id === 'c.ii' ? predictiveEvidence(branches,false).markup : ''}${question.reference ? `<aside class="capstone-reference"><p>${escape(question.reference.interpretation)}</p>${formatMath(question.reference.tex)}<p>Valor exacto: ${probability(question.reference.answer)}. La respuesta solicitada usa aproximación normal y frontera 74,5.</p></aside>` : ''}`;
}

export default function CapstoneExercises({exerciseId}) {
  const baseUrl=useBaseUrl('/');
  const index=CAPSTONE.sections.findIndex(section=>section.exerciseId===exerciseId);
  if(index<0)return <p role="alert">Ejercicio de culminación desconocido: {exerciseId}.</p>;
  return <section className="capstone" aria-label={CAPSTONE.sections[index].title}>
    <p className="capstone-source">Enunciado: {CAPSTONE.source.file},{' '}{sourcePages[index].map((page,position)=><React.Fragment key={page}>{position>0 && ' y '}<a href={`${asset(baseUrl,CAPSTONE.source.url)}#page=${page}`}>página {page}</a></React.Fragment>)}.</p>
    <ExerciseCollection exerciseId={exerciseId} lessonId={CAPSTONE.sections[index].lessonIds[0]} renderExtra={capstoneExtraMarkup} extraStyles={shadowStyles} />
  </section>;
}
