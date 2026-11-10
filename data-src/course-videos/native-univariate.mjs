import {findCue, makeNativePlan, visibleLines} from './native-plan.mjs';

const SECTIONS = {
  'variable-cdf': {'regla-observable':'observation-map', escalones:'step-cdf', 'intervalos-y-saltos':'cdf-difference'},
  masa: {'agrupar-y-normalizar':'mass-normalize', 'intervalos-discretos':'mass-select', interruptores:'indicator'},
  densidad: {'altura-y-area':'density-area', 'densidad-creciente':'density-triangle', 'acumulada-por-tramos':'density-cdf'},
  esperanza: {'promedio-ponderado':'expectation-balance', 'transformar-valores':'transform-average', 'linealidad-y-colas':'expectation-linear'},
  varianza: {distancias:'squared-deviations', 'segundo-momento':'variance-moments', 'estirar-y-desplazar':'variance-scale'},
  'momentos-transformaciones': {'ordinarios-y-centrales':'moment-powers', 'ejemplo-area':'moment-area', 'estandarizacion-y-existencia':'moment-standardize', 'cambio-de-distribucion':'transform-support'},
  'bernoulli-binomial': {ensayos:'binomial-trials', 'masa-y-cola':'binomial-counts', 'momentos-y-diseno':'binomial-design'},
  poisson: {exposicion:'poisson-exposure', 'masa-y-complemento':'poisson-counts', 'aproximar-y-sumar':'poisson-superpose'},
  hipergeometrica: {'sin-reemplazo':'finite-sampling', 'masa-finita':'finite-counts', 'soporte-y-correccion':'finite-support'},
  'geometrica-negativa': {'primera-deteccion':'geometric-stop', 'varios-exitos':'negative-stop', 'memoria-y-momentos':'geometric-memory', 'forma-real':'negative-shape'},
  'uniforme-montecarlo': {'dos-uniformes':'uniform-compare', cuantiles:'uniform-quantile', 'inversion-y-montecarlo':'uniform-invert'},
  exponencial: {'escala-y-supervivencia':'waiting-survival', 'densidad-y-acumulada':'waiting-area', 'espera-adicional':'waiting-memory'},
  normal: {'centro-y-escala':'normal-standardize', 'densidad-normal':'normal-density', 'colas-e-intervalos':'normal-tail', 'cuantiles-y-combinaciones':'normal-quantile'},
  gamma: {'etapas-y-parametros':'gamma-stages', 'funcion-gamma':'gamma-normalize', 'densidad-y-area':'gamma-area', 'sumas-y-variacion':'gamma-sum'},
  'cauchy-weibull': {'centro-sin-media':'cauchy-tails', 'intervalos-cauchy':'cauchy-area', 'weibull-supervivencia':'weibull-survival', 'riesgo-y-momentos':'weibull-risk'},
  'calculo-modelos': {'operacion-correcta':'model-operation', 'consulta-con-unidades':'model-normal', 'elegir-mecanismo':'model-mechanism'},
  'familia-exponencial': {'piezas-poisson':'family-poisson', 'binomial-natural':'family-binomial', 'normales-uniparametricas':'family-normal', 'datos-fijos-y-maximo':'likelihood-max', 'log-verosimilitud':'likelihood-log', 'enlaces-glm':'family-link'},
};

const RECAP = {
  'variable-cdf':'step-cdf', masa:'mass-select', densidad:'density-area', esperanza:'expectation-balance', varianza:'squared-deviations',
  'momentos-transformaciones':'moment-powers', 'bernoulli-binomial':'binomial-trials', poisson:'poisson-exposure', hipergeometrica:'finite-sampling',
  'geometrica-negativa':'geometric-stop', 'uniforme-montecarlo':'uniform-invert', exponencial:'waiting-survival', normal:'normal-standardize', gamma:'gamma-stages',
  'cauchy-weibull':'cauchy-tails', 'calculo-modelos':'model-operation', 'familia-exponencial':'likelihood-max',
};

const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const ACTIONS = [
  ['quantile', /cuantil|percentil|inversa|inversion|primer umbral/],
  ['standardize', /estandar|tipificar|desviaciones|restar.*media|divid.*desviacion/],
  ['square', /cuadrad|potencia|segundo momento/],
  ['rescale', /escala|estirar|milimetro|unidades|desplaza/],
  ['condition', /condicion|memoria|adicional|ya.*esper/],
  ['tail', /cola|superviv|supera|mayor que|mas de|al menos|complement/],
  ['interval', /intervalo|entre|hasta|acumul|umbral/],
  ['normalize', /normaliz|suma.*uno|suman uno|integral|area total/],
  ['likelihood', /verosimil|candidata|maximo|derivada|datos fijos|muestra fija/],
  ['combine', /sumar|suma|producto|combina|reunir|ponder/],
  ['support', /soporte|posible|limite|agot|existencia/],
  ['compare', /compar|distint|difer|no es|no tiene/],
];

function recapFamily(topic, step, fallback) {
  const text = normalize(`${step.title} ${step.cues.map(cue => typeof cue === 'string' ? cue : cue.text).join(' ')}`);
  if (topic === 'cauchy-weibull' && /weibull|riesgo/.test(text)) return /riesgo/.test(text) ? 'weibull-risk' : 'weibull-survival';
  if (topic === 'geometrica-negativa' && /varios|binomial negativa|enesimo|r exitos/.test(text)) return 'negative-stop';
  if (topic === 'variable-cdf' && /salto|resta|intervalo/.test(text)) return 'cdf-difference';
  if (topic === 'densidad' && /creciente|triang|x al cuadrado|dos por/.test(text)) return 'density-triangle';
  if (topic === 'esperanza' && /transform|cuadrad/.test(text)) return 'transform-average';
  if (topic === 'varianza' && /escala|milimet|desplaz|unidades/.test(text)) return 'variance-scale';
  if (topic === 'momentos-transformaciones' && /transform|soporte/.test(text)) return 'transform-support';
  if (topic === 'uniforme-montecarlo' && /cuantil|percentil/.test(text)) return 'uniform-quantile';
  if (topic === 'uniforme-montecarlo' && /discreta|continua/.test(text)) return 'uniform-compare';
  if (topic === 'normal' && /cola|intervalo/.test(text)) return 'normal-tail';
  if (topic === 'normal' && /percentil|cuantil/.test(text)) return 'normal-quantile';
  if (topic === 'exponencial' && /memoria|condicion/.test(text)) return 'waiting-memory';
  if (topic === 'gamma' && /densidad|probabilidad|area/.test(text)) return 'gamma-area';
  if (topic === 'familia-exponencial' && /logarit|factorial/.test(text)) return 'likelihood-log';
  if (topic === 'calculo-modelos' && /normal|tipifica/.test(text)) return 'model-normal';
  return fallback;
}

function storyData(item, step, index) {
  const source = {mode:'symbolic', priorInputs:[]};
  if (item.kind === 'recap') {
    let start = 0;
    for (let previous = 0; previous <= index; previous++) {
      if (/^Ejercicio \d|^E\d+\.\d+.*(?:resolver|experimento)/u.test(item.animation.steps[previous].title)) start = previous;
    }
    source.priorInputs = item.animation.steps.slice(start, index).flatMap(previous => previous.visual?.lines || []).filter(line => /dato|modelo|muestra|diseno|observ|tabla|ventana|recuento|parametro/iu.test(normalize(line.label || '')) || line.plot).map(line => structuredClone(line));
  }
  if (item.id === 'uniforme-montecarlo--inversion-y-montecarlo') {
    source.mode = 'discrete-inversion';
    source.states = [0, 1, 2];
    source.masses = [0.2, 0.5, 0.3];
    source.cuts = [0.2, 0.7, 1];
    source.inputs = [
      {cue:findCue(step, 'una decima cae', {required:true}), value:0.1, output:0},
      {cue:findCue(step, 'cincuenta y cinco centesimas', {required:true}), value:0.55, output:1},
      {cue:findCue(step, 'noventa y una centesimas', {required:true}), value:0.91, output:2},
    ];
  }
  if (item.id === 'normal--centro-y-escala') {
    source.mode = 'normal-standardize';
    source.mean = 40;
    source.sd = 4;
    source.observation = 48;
    source.observationCue = findCue(step, 'Queremos situar', {required:true});
    source.centerCue = findCue(step, 'restamos la media', {required:true});
    source.scaleCue = findCue(step, 'dividimos esos ocho', {required:true});
  }
  if (item.id === 'varianza--distancias') {
    source.mode = 'weighted-deviations';
    source.values = [0, 1, 2];
    source.weights = [0.25, 0.5, 0.25];
    source.mean = 1;
    source.revealCue = findCue(step, 'Equis toma cero', {required:true});
    source.squareCue = findCue(step, 'Elevamos las desviaciones', {required:true});
  }
  if (item.id === 'esperanza--promedio-ponderado') {
    const reveals = ['0\\cdot0{,}5=0', '4\\cdot0{,}5=2', 'E[X]=2'].map(tex => {
      const line = step.visual.lines.find(candidate => candidate.tex === tex);
      if (!line) throw new RangeError(`Missing expectation source equation: ${tex}`);
      return line.cue;
    });
    source.mode = 'weighted-mean';
    source.values = [0, 4];
    source.weights = [0.5, 0.5];
    source.mean = 2;
    source.reveals = reveals;
  }
  return source;
}

export function normalStandardizationState(story, cueIndex) {
  const {mean, sd, observation} = story;
  if (![mean, sd, observation].every(Number.isFinite) || sd <= 0) throw new RangeError('Invalid normal center or scale');
  const centered = cueIndex >= story.centerCue;
  const standardized = cueIndex >= story.scaleCue;
  const transform = value => standardized ? (value - mean) / sd : centered ? value - mean : value;
  const low = transform(mean - 4 * sd);
  const high = transform(mean + 4 * sd);
  const position = value => (transform(value) - low) / (high - low);
  return {
    domain:[low, high],
    center:transform(mean),
    unit:transform(mean + sd),
    value:transform(observation),
    z:(observation - mean) / sd,
    centerAt:position(mean),
    unitAt:position(mean + sd),
    observationAt:position(observation),
    observationVisible:cueIndex >= story.observationCue,
    units:standardized ? '' : ' mm',
    title:standardized ? 'Dividir por la desviacion' : centered ? 'Restar la media' : 'Centro y escala de la longitud',
    operation:standardized ? `${observation - mean} / ${sd} = ${(observation - mean) / sd}` : centered ? `${observation} - ${mean} = ${observation - mean} mm` : null,
    axis:standardized ? 'Z' : centered ? 'X - mu (mm)' : 'X (mm)',
  };
}

export function planUnivariate(item) {
  if (!['section', 'recap'].includes(item.kind)) return null;
  const topic = item.parentLesson || item.id;
  if (!Object.hasOwn(SECTIONS, topic)) return null;
  const section = item.sectionId || item.id.split('--')[1];
  const family = item.kind === 'recap' ? RECAP[topic] : SECTIONS[topic][section];
  if (!family) throw new RangeError(`Unsupported univariate section: ${item.id}`);
  return makeNativePlan(item, 'univariate', ({step, cues, index}) => {
    const sceneFamily = item.kind === 'recap' ? recapFamily(topic, step, family) : family;
    const lines = step.visual?.lines || [];
    for (const line of lines) if (line.cue != null && (!Number.isInteger(line.cue) || line.cue < 0 || line.cue >= cues.length)) throw new RangeError(`${item.id}/${index}: invalid reveal index`);
    return {
      family:sceneFamily,
      data:{topic, section:section || null, kind:item.kind, stepIndex:index, input:structuredClone(step.data || {}), context:structuredClone(step.visual?.context || null), schematic:true, story:storyData(item, step, index)},
      beats:cues.map((text, cueIndex) => {
        const anchor = normalize(text);
        const action = ACTIONS.find(([, pattern]) => pattern.test(anchor))?.[0] || sceneFamily;
        return {action, anchor:text, sourceCue:cueIndex, reveals:lines.map((line, lineIndex) => ({line, lineIndex})).filter(({line}) => (line.cue ?? 0) === cueIndex).map(({lineIndex}) => lineIndex), visibleSource:structuredClone(visibleLines(step, cueIndex))};
      }),
    };
  });
}