import {makeNativePlan} from './native-plan.mjs';

const TOPICS = new Set(['conjunta-discreta', 'multinomial', 'marginales', 'conjunta-condicional', 'normal-bivariante', 'independencia-variables', 'covarianza-matrices', 'combinaciones-incorrelacion']);
const SECTIONS = Object.freeze({
  'conjunta-discreta--parejas':'joint-table',
  'conjunta-discreta--region-de-celdas':'joint-region',
  'conjunta-discreta--rectangulo-acumulado':'cdf-rectangle',
  'multinomial--categorias-y-secuencias':'multinomial-sequence',
  'multinomial--marginales-y-total':'multinomial-counts',
  'multinomial--momentos-con-indicadores':'multinomial-indicators',
  'marginales--sumar-la-otra':'marginal-table',
  'marginales--integrar-cortes':'triangle-marginal',
  'marginales--proyeccion-y-corte':'discrete-conditional',
  'conjunta-condicional--normalizar-region':'triangle-region',
  'conjunta-condicional--normalizar-corte':'conditional-cut',
  'conjunta-condicional--interpretar-condicion':'conditional-area',
  'normal-bivariante--modelo-conjunto':'gaussian-contours',
  'normal-bivariante--densidad-bivariante':'gaussian-density',
  'normal-bivariante--media-y-varianza-condicional':'gaussian-conditional',
  'normal-bivariante--cola-condicional':'gaussian-tail',
  'independencia-variables--factorizar-tabla':'factorization-table',
  'independencia-variables--soporte-completo':'support-exclusion',
  'independencia-variables--transformar-y-seleccionar':'independence-transforms',
  'covarianza-matrices--desviaciones-compartidas':'covariance-deviations',
  'covarianza-matrices--normalizar-covarianza':'standardized-correlation',
  'covarianza-matrices--matrices-admisibles':'covariance-matrix',
  'combinaciones-incorrelacion--suma-y-diferencia':'weighted-variance',
  'combinaciones-incorrelacion--forma-matricial':'weighted-matrix',
  'combinaciones-incorrelacion--incorrelacion':'uncorrelated-dependent',
});

const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const sourceText = step => [step.title, ...(step.visual?.lines || []).map(line => [line.label, line.value, line.tex].filter(Boolean).join(' ')), ...step.cues.map(cue => typeof cue === 'string' ? cue : cue.text)].join(' ');

function recapFamily(topic, step) {
  const text = normalize(sourceText(step));
  if (/y\s*=\s*x\^?2|cuadrado|no lineal|incorrelacion/.test(text) && /covarian|independ|simetri/.test(text)) return 'uncorrelated-dependent';
  if (topic === 'conjunta-discreta') return /rectangulo|inclusion|f\(b,d\)/.test(text) ? 'cdf-rectangle' : /acumulad|region|suceso/.test(text) ? 'joint-region' : 'joint-table';
  if (topic === 'multinomial') return /indicador|covarian|momentos/.test(text) ? 'multinomial-indicators' : /secuencia|factorial|coeficiente/.test(text) ? 'multinomial-sequence' : 'multinomial-counts';
  if (topic === 'marginales') return /triang|integr|densidad|continu/.test(text) ? 'triangle-marginal' : /condicion|dado/.test(text) ? 'discrete-conditional' : 'marginal-table';
  if (topic === 'conjunta-condicional') {
    if (/fila|tabla|p_\{y/.test(text) && !/continu|densidad|integr|triang/.test(text)) return 'discrete-conditional';
    return /condicion|corte|dado/.test(text) ? /probabilidad|area|super/.test(text) ? 'conditional-area' : 'conditional-cut' : 'triangle-region';
  }
  if (topic === 'normal-bivariante') return /cola|phi|tipifica|super|umbral/.test(text) ? 'gaussian-tail' : /condicion|corte|regres/.test(text) ? 'gaussian-conditional' : /densidad|exponencial/.test(text) ? 'gaussian-density' : 'gaussian-contours';
  if (topic === 'independencia-variables') return /triang|soporte|prohib|region/.test(text) ? 'support-exclusion' : /transform|seleccion|esperanza/.test(text) ? 'independence-transforms' : 'factorization-table';
  if (topic === 'covarianza-matrices') return /matriz|matrices|sigma|definida|autovalor|determinante/.test(text) ? 'covariance-matrix' : /correlacion|tipific|estandar|unidades/.test(text) ? 'standardized-correlation' : 'covariance-deviations';
  if (topic === 'combinaciones-incorrelacion') return /matriz|matricial|vector/.test(text) ? 'weighted-matrix' : 'weighted-variance';
  throw new RangeError(`Unsupported multivariate recap: ${topic}/${step.title}`);
}

const ACTIONS = {
  'joint-table':[['locate-cell', /pareja|celda|coordenad|marcador/], ['sum-region', /sum|total|uno|masa/]],
  'joint-region':[['select-region', /suceso|region|condicion|cumplen|celdas/], ['sum-region', /sum|acumul|umbral/]],
  'cdf-rectangle':[['restore-overlap', /anad|dos veces|sumamos|solap|interseccion/], ['subtract-strip', /rest|quit|exclu/], ['sweep-rectangle', /rectangulo|limite|umbrales|acumul/]],
  'multinomial-sequence':[['permute-sequence', /orden|secuencia|permut|factorial|coeficiente/], ['collect-counts', /recuent|cuenta|categor|veces/], ['weight-sequence', /probabilidad|producto|multiplic/]],
  'multinomial-counts':[['lock-total', /suma|total|cuatro|fija|restriccion/], ['collapse-category', /binomial|marginal|una categoria|resto/]],
  'multinomial-indicators':[['exclude-category', /excluy|simult|cero|misma celula/], ['cross-products', /covarian|producto|negativ/], ['collect-counts', /suma|recuent|indicador/]],
  'marginal-table':[['collapse-rows', /columna|sobre equis|sum_x|otra variable/], ['collapse-columns', /fila|sobre i griega|sum_y/], ['sum-region', /sum|marginal|total/]],
  'discrete-conditional':[['normalize-row', /divid|cociente|condicion|dado|denominador/], ['collapse-rows', /marginal|proyeccion|sum/]],
  'triangle-marginal':[['sweep-slice', /corte|fija|altura|longitud|limite/], ['collapse-slices', /integr|marginal|suma|area/]],
  'triangle-region':[['normalize-support', /normaliz|constante|uno|altura/], ['shrink-region', /mitad|medio|region|triang|probabilidad/]],
  'conditional-cut':[['normalize-cut', /divid|normaliz|cociente|uno|condicional/], ['move-cut', /corte|fij|ocho decimas|dos decimas/]],
  'conditional-area':[['shade-cut-area', /super|area|probabilidad|cuatro decimas|intervalo/], ['normalize-cut', /densidad|normaliz|condicion/]],
  'gaussian-contours':[['tilt-contours', /ro|correlacion|inclin|elips|asociacion/], ['standardize-axis', /tipif|desviacion|centra|z_/]],
  'gaussian-density':[['trace-contour', /cuadratic|expon|q=|densidad|altura/], ['normalize-gaussian', /denominador|normaliz|raiz|escala/]],
  'gaussian-conditional':[['move-conditional-mean', /media|centro|desplaz|cuatro|setenta y cuatro/], ['narrow-variance', /varianza|desviacion|dispersion|raiz/], ['move-gaussian-cut', /cuarenta|corte|fija|diferencia/]],
  'gaussian-tail':[['standardize-tail', /tipif|z=|raiz|rest|distancia/], ['shade-normal-tail', /cola|super|phi|probabilidad|area/]],
  'factorization-table':[['compare-products', /producto|multiplic|factor|coincid|discrep/], ['collapse-columns', /marginal|sumando|fila|columna/]],
  'support-exclusion':[['exclude-square', /cuadrado|prohib|fuera|cero|imposible/], ['compare-support', /producto|marginal|positivo|factor/], ['move-cut', /corte|triangulo|capacidad/]],
  'independence-transforms':[['separate-transform', /transform|funcion|por separado|esperanza/], ['select-support', /seleccion|suma|condicion|grupo/], ['compare-products', /producto|pareja|tercio|noveno/]],
  'covariance-deviations':[['center-deviations', /media|centra|desviacion/], ['signed-products', /producto|multiplic|signo|positiv|negativ/], ['average-products', /promedi|ponder|esperanza|covarian/]],
  'standardized-correlation':[['rescale-deviations', /escala|unidad|tipif|desviacion|duplic/], ['normalize-covariance', /divid|denominador|correlacion|ro|cociente/]],
  'covariance-matrix':[['matrix-diagonal', /diagonal|varianza|desviacion/], ['matrix-cross', /cruzad|simetric|covarian/], ['matrix-normalize', /correlacion|normaliz|inversa|estandar/], ['test-admissibility', /admis|negativ|determinante|autovalor|semidefin|coheren/]],
  'weighted-variance':[['cross-term', /cruzad|covarian|doble|dos veces|2ab/], ['reverse-weight', /diferencia|rest|negativo|menos/], ['sum-weighted', /varianza|suma|cuadrado|coeficiente/]],
  'weighted-matrix':[['matrix-cross', /covarian|cruzad|sigma/], ['project-weights', /vector|peso|combinacion|producto|lineal/]],
  'uncorrelated-dependent':[['trace-parabola', /cuadrado|determina|curva|dependencia|dependiente/], ['cancel-products', /simetri|cancela|cero|covarian|momento/], ['exclude-pairs', /pareja|producto|noveno|independ/]],
};

function sourceGeometry(item, step, index) {
  const lines = step.visual?.lines || [];
  const local = sourceText(step);
  const modelLines = item.kind === 'recap' && index < 2 ? item.animation.steps[0].visual?.lines || [] : lines;
  const model = modelLines.map(line => `${line.label || ''} ${line.value || ''}`).join(' ');
  const readNumber = pattern => {
    const match = model.match(pattern);
    return match ? Number(match[1].replace(',', '.')) : null;
  };
  const capacityMatch = local.match(/x\s*\+\s*y\s*(?:\u2264|<=|\\leq?|=)\s*(\d+(?:[,.]\d+)?)/i)
    || local.match(/capacidad(?:\s+total)?\s*:?\s*(\d+(?:[,.]\d+)?)/i);
  const capacityWord = normalize(local).match(/capacidad (uno|dos|cuatro)/)?.[1];
  const capacity = capacityMatch ? Number(capacityMatch[1].replace(',', '.')) : ({uno:1, dos:2, cuatro:4}[capacityWord] ?? null);
  const cut = lines.find(line => Number.isFinite(line.plot?.cut))?.plot.cut;
  const labelCut = lines.map(line => line.label || '').join(' ').match(/X\s*=\s*(\d+(?:[,.]\d+)?)/);
  const formulaCut = lines.map(line => line.tex || '').join(' ').match(/\\mid\s*(\d+(?:(?:\{,\}|[,.])\d+)?)/);
  const threshold = lines.map(line => line.tex || '').join(' ').match(/Y\s*>\s*(-?\d+(?:(?:\{,\}|[,.])\d+)?)/);
  const sectionNormal = item.kind === 'section' && item.parentLesson === 'normal-bivariante';
  const gaussian = sectionNormal ? {meanX:30, meanY:70, sdX:5, sdY:8, rho:0.25, conditionX:40} : {
    meanX:readNumber(/(?:muX|\u03bcX)\s*[:=]\s*(-?\d+(?:[,.]\d+)?)/i),
    meanY:readNumber(/(?:muY|\u03bcY)\s*[:=]\s*(-?\d+(?:[,.]\d+)?)/i),
    sdX:readNumber(/(?:sigmaX|\u03c3X)\s*[:=]\s*(\d+(?:[,.]\d+)?)/i),
    sdY:readNumber(/(?:sigmaY|\u03c3Y)\s*[:=]\s*(\d+(?:[,.]\d+)?)/i),
    rho:readNumber(/(?:rho|\u03c1)\s*[:=]\s*(-?\d+(?:[,.]\d+)?)/i),
    conditionX:null,
  };
  const condition = local.match(/X\s*=\s*(-?\d+(?:[,.]\d+)?)/);
  if (!sectionNormal && condition) gaussian.conditionX = Number(condition[1].replace(',', '.'));
  gaussian.threshold = threshold ? Number(threshold[1].replace('{,}', '.').replace(',', '.')) : null;
  if (gaussian.rho !== null && Math.abs(gaussian.rho) >= 1) gaussian.rho = null;
  return {capacity, cut:cut ?? (labelCut ? Number(labelCut[1].replace(',', '.')) : formulaCut ? Number(formulaCut[1].replace('{,}', '.').replace(',', '.')) : null), gaussian};
}

function sceneData(item, step, index, family) {
  const lines = structuredClone(step.visual?.lines || []);
  const plots = lines.flatMap((line, lineIndex) => line.plot ? [{...line.plot, cue:line.cue ?? 0, lineIndex}] : []);
  const text = sourceText(step);
  return {
    topic:item.parentLesson || item.id, section:item.sectionId || null, stepIndex:index,
    mode:item.kind, family, source:lines, plots, geometry:sourceGeometry(item, step, index),
    sourceIdentity:`${item.id}/${index}`,
    anchors:step.cues.map((cue, cueIndex) => ({cue:cueIndex, text:typeof cue === 'string' ? cue : cue.text})),
    table:lines.flatMap((line, lineIndex) => {
      if (!/tabla|fila|X\s*=|p00|p_\{00\}/i.test(`${line.label || ''} ${line.value || ''}`)) return [];
      const masses = (line.value || '').match(/0[,.]\d+/g)?.map(value => Number(value.replace(',', '.')));
      return masses?.length === 4 ? [{masses, cue:line.cue ?? 0, lineIndex}] : [];
    }),
    continuous:/continu|uniforme|\[-1,1\]|entre menos uno y uno/i.test(text),
    normalizedText:normalize(text),
  };
}

export function planMultivariate(item) {
  const topic = item?.parentLesson || item?.id;
  if (!TOPICS.has(topic) || !['section', 'recap'].includes(item.kind)) return null;
  return makeNativePlan(item, 'multivariate', ({item, step, index, cues}) => {
    const family = item.kind === 'section' ? SECTIONS[item.id] : recapFamily(topic, step);
    if (!family || !ACTIONS[family]) throw new RangeError(`Unsupported multivariate section: ${item.id}/${index}`);
    const data = sceneData(item, step, index, family);
    return {family, data, beats:cues.map((text, cueIndex) => {
      const anchor = normalize(text);
      const matching = ACTIONS[family].find(([, pattern]) => pattern.test(anchor));
      const action = matching?.[0] || `establish-${family}`;
      return {action, anchor:text, sourceCue:cueIndex,
        sourceLineIndices:data.source.flatMap((line, lineIndex) => (line.cue ?? 0) <= cueIndex ? [lineIndex] : []),
        newlyVisible:data.source.flatMap((line, lineIndex) => (line.cue ?? 0) === cueIndex ? [lineIndex] : []),
      };
    })};
  });
}