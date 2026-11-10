import {makeNativePlan} from './native-plan.mjs';

const TOPICS = Object.freeze({
  proporciones:'quantity', algebra:'balance', funciones:'function', calculo:'integral',
  'regiones-matrices':'region', sucesos:'sets', axiomas:'probability', combinatoria:'allocation',
  condicionada:'filter', 'independencia-sucesos':'independence', 'bayes-diagnostico':'bayes',
});

const SECTIONS = Object.freeze({
  proporciones:{'parte-y-total':'seed-trays', 'porcentaje-y-exposicion':'percent-rate', 'unidades-y-cotas':'unit-conversion'},
  algebra:{balanza:'normalise-weights', 'comprobar-el-factor':'substitution', 'deshacer-exponencial':'inverse-exponential'},
  funciones:{'entrada-y-salida':'input-output', 'sumar-salidas':'sum-outputs', 'seleccionar-valores':'select-values'},
  calculo:{franjas:'moving-strips', primitiva:'endpoint-area', 'pendiente-acumulada':'tangent-area'},
  'regiones-matrices':{frontera:'triangle-cut', 'recorrer-triangulo':'triangle-sweep', 'orden-de-matriz':'matrix-order'},
  sucesos:{'resultados-y-sucesos':'seed-outcomes', 'traducir-conjuntos':'set-operation', observabilidad:'observable-events'},
  axiomas:{'probabilidades-coherentes':'disjoint-mass', solapamiento:'remove-overlap', 'deducir-propiedades':'nested-events', frecuencia:'empirical-frequency'},
  combinatoria:{posiciones:'ordered-slots', 'quitar-orden':'unordered-pairs', multiplicidades:'repeated-labels'},
  condicionada:{'grupo-conocido':'filter-population', 'invertir-grupo':'reverse-filter', 'ruta-condicionada':'conditional-route'},
  'independencia-sucesos':{producto:'product-area', 'comprobar-informacion':'compare-conditional', 'independencia-mutua':'pairwise-not-mutual'},
  'bayes-diagnostico':{'rutas-positivas':'positive-routes', posterior:'posterior-filter', 'negativos-y-prevalencia':'negative-prevalence'},
});

export const foundationTopics = Object.freeze(Object.keys(TOPICS));
const normalized = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function recapMode(topic, step) {
  const text = normalized(`${step.title} ${(step.visual?.lines || []).map(line => `${line.label || ''} ${line.tex || ''} ${line.value || ''}`).join(' ')}`);
  if (topic === 'regiones-matrices') return /matri|covarian|sigma|mu_/.test(text) ? 'matrix-order' : 'triangle-cut';
  if (topic === 'calculo') return /deriv|pendiente|acumul/.test(text) ? 'tangent-area' : /primit|extrem/.test(text) ? 'endpoint-area' : 'moving-strips';
  if (topic === 'funciones') return /sum|indice|sigma/.test(text) ? 'sum-outputs' : /menos|selecc|probabil/.test(text) ? 'select-values' : 'input-output';
  if (topic === 'algebra') return /log|exponen|tiempo/.test(text) ? 'inverse-exponential' : /comprob|sustit|raiz/.test(text) ? 'substitution' : 'normalise-weights';
  if (topic === 'proporciones') return /unidad|micro|milig|conversion/.test(text) ? 'unit-conversion' : /porcent|tasa|concentr/.test(text) ? 'percent-rate' : 'seed-trays';
  if (topic === 'combinatoria') return /repet|iguale|multiplic/.test(text) ? 'repeated-labels' : /sin orden|combin|grupo/.test(text) ? 'unordered-pairs' : 'ordered-slots';
  if (topic === 'bayes-diagnostico') return /negativ|vpn/.test(text) ? 'negative-prevalence' : /posterior|invert|dado|entre/.test(text) ? 'posterior-filter' : 'positive-routes';
  if (topic === 'condicionada') return /ruta|etapa|producto/.test(text) ? 'conditional-route' : /invert/.test(text) ? 'reverse-filter' : 'filter-population';
  if (topic === 'independencia-sucesos') return /mutua|pareja|triple/.test(text) ? 'pairwise-not-mutual' : /compar|condicion|informacion/.test(text) ? 'compare-conditional' : 'product-area';
  if (topic === 'axiomas') return /solap|intersec|duplic|union/.test(text) ? 'remove-overlap' : /frecuenc|racha/.test(text) ? 'empirical-frequency' : /comple|inclusion|vacio/.test(text) ? 'nested-events' : 'disjoint-mass';
  return /semilla|resultado|omega/.test(text) ? 'seed-outcomes' : /observ|sigma/.test(text) ? 'observable-events' : 'set-operation';
}

const ACTIONS = Object.freeze({
  quantity:'rescale-quantity', balance:'balance-both-sides', function:'trace-input-output', integral:'sweep-area-strip',
  region:'sweep-admissible-cut', sets:'select-set-region', probability:'conserve-probability-mass',
  allocation:'move-choice-to-slot', filter:'filter-reference-population', independence:'compare-product-area', bayes:'weight-observed-routes',
});

function seedScene(lines, cues, recap) {
  const populations = lines.filter(line => line.bar && line.bar.total > 4);
  if (populations.length !== 2) throw new RangeError('Seed comparison needs two structured populations');
  const anchors = recap ? {
    parts:'En uno germinan dieciocho semillas y en otro treinta.',
    question:'Cual tiene mayor proporcion de germinaciones',
    unknown:'Todavia no podemos responder: nos faltan los totales.',
    definition:'Una proporcion divide la parte que nos interesa',
    containment:'Ese total debe ser positivo y contener la parte.',
    firstTotal:'En el primer ensayo sembramos setenta y dos semillas',
    firstFraction:'Dividimos dieciocho entre setenta y dos: queda un cuarto.',
    quarter:'Dividimos dieciocho entre setenta y dos: queda un cuarto.',
    percent:'Cero coma veinticinco y veinticinco por ciento',
    secondTotal:'En el segundo ensayo sembramos doscientas.',
    secondFraction:'Treinta entre doscientas es cero coma quince',
    compare:'Hay mas semillas germinadas, pero una proporcion menor.',
    observation:'Estamos describiendo estos ensayos',
  } : {
    parts:'Comparemos dos bandejas: en una germinan dieciocho semillas y en otra treinta.',
    question:'Parece que gana la segunda',
    unknown:'Sin ese dato la comparacion queda abierta.',
    firstTotal:'En la primera sembramos setenta y dos.',
    highlight:'Dentro de ese total buscamos las dieciocho germinadas.',
    containment:'No anadimos dieciocho a setenta y dos',
    firstFraction:'Llamemos pe a la proporcion observada',
    quarter:'Setenta y dos contiene cuatro grupos de dieciocho',
    oneGroup:'Germino una de cada cuatro',
    secondTotal:'La segunda tenia doscientas semillas.',
    secondFraction:'Sus treinta germinadas representan quince centesimas del total.',
    compare:'Treinta supera dieciocho, pero quince centesimas es menos que un cuarto',
    reference:'de que total sale esta parte',
    observation:'Hemos descrito observaciones',
  };
  const events = Object.fromEntries(Object.entries(anchors).map(([name, fragment]) => {
    const matches = cues.flatMap((text, index) => normalized(text).includes(normalized(fragment)) ? [index] : []);
    if (matches.length !== 1) throw new RangeError(`Missing or ambiguous seed narration anchor: ${name}`);
    return [name, matches[0]];
  }));
  if (!(events.parts < events.firstTotal && events.firstTotal <= events.firstFraction && events.firstFraction <= events.quarter
      && events.quarter < events.secondTotal && events.secondTotal <= events.secondFraction && events.secondFraction < events.compare)) {
    throw new RangeError('Seed narration events are out of order');
  }
  const trays = populations.map((line, index) => ({...line.bar, title:line.label,
    totalCue:index ? events.secondTotal : events.firstTotal,
    fractionCue:index ? events.secondFraction : events.firstFraction}));
  if (trays.some(tray => !Number.isInteger(tray.part) || !Number.isInteger(tray.total) || tray.total > 1000)) throw new RangeError('Seed artwork needs countable populations');
  const groups = trays[0].total / trays[0].part;
  if (!Number.isInteger(groups) || groups < 2) throw new RangeError('Seed quarter needs equal whole groups');
  return {trays, groups, events, regroup:!recap};
}

export function planFoundations(item) {
  const topic = item.parentLesson || item.id;
  if (!['section', 'recap'].includes(item.kind) || !Object.hasOwn(TOPICS, topic)) return null;
  const section = item.kind === 'section' ? item.id.slice(topic.length + 2) : null;
  if (section !== null && !SECTIONS[topic]?.[section]) throw new RangeError(`Unmapped foundations section: ${item.id}`);
  return makeNativePlan(item, 'foundations', ({step, index, cues}) => {
    const family = TOPICS[topic];
    const lines = structuredClone(step.visual?.lines || []);
    if (!cues.length || !step.title || !lines.length) throw new RangeError(`${item.id}/${index}: missing authored scene anchors`);
    for (const line of lines) {
      if (line.cue !== undefined && (!Number.isInteger(line.cue) || line.cue < 0 || line.cue >= cues.length)) throw new RangeError(`${item.id}/${index}: invalid source reveal`);
      if (line.bar && (!(line.bar.total > 0) || line.bar.part < 0 || line.bar.part > line.bar.total)) throw new RangeError(`${item.id}/${index}: invalid source denominator`);
    }
    const mode = section === null ? recapMode(topic, step) : SECTIONS[topic][section];
    const seed = topic === 'proporciones' && (section === 'parte-y-total' || (item.kind === 'recap' && lines.filter(line => line.bar && line.bar.total > 4).length === 2))
      ? seedScene(lines, cues, item.kind === 'recap') : null;
    const group = step.title.match(/^E\d+\.\d+/)?.[0];
    const history = [];
    if (item.kind === 'recap' && group) {
      for (let previous = index - 1; previous >= 0; previous--) {
        const earlier = item.animation.steps[previous];
        if (!earlier.title.startsWith(group)) break;
        history.unshift(...structuredClone(earlier.visual?.lines || []));
      }
    }
    return {
      family,
      data:{topic, section, mode:seed ? 'seed-trays' : mode, stepIndex:index, sourceId:item.id, lines, history, seed, plot:structuredClone(step.visual?.plot || null)},
      beats:cues.map((text, cueIndex) => {
        const anchor = normalized(text);
        const operation = /complement|ningun|no pertenece/.test(anchor) ? 'complement'
          : /intersecc|ambos|a la vez/.test(anchor) ? 'intersection'
          : /union|al menos|cualquiera/.test(anchor) ? 'union'
          : /solo|diferencia/.test(anchor) ? 'difference'
          : /divid|denomin|entre|filtro|condicion/.test(anchor) ? 'condition'
          : /sum|anad|acumul/.test(anchor) ? 'accumulate'
          : /rest|quit|deshac/.test(anchor) ? 'remove'
          : /multiplic|producto|ponder/.test(anchor) ? 'multiply' : 'trace';
        return {action:ACTIONS[family], operation, anchor:text, sourceCue:cueIndex,
          reveal:lines.flatMap((line, lineIndex) => (line.cue ?? 0) === cueIndex ? [lineIndex] : []),
          visible:lines.flatMap((line, lineIndex) => (line.cue ?? 0) <= cueIndex ? [lineIndex] : [])};
      }),
    };
  });
}