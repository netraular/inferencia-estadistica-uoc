import {makeNativePlan} from './native-plan.mjs';
import statistics from 'jstat';

const {jStat} = statistics;

const SNAPSHOTS = {
  proportions:[['c6434e37',{total:60,part:15,milligrams:3}],['b45ebf82',{total:40,part:20,milligrams:2}]],
  normalization:[['e10574',{weights:[2,3,7]}],['be0c01ee',{weights:[2,3,4]}]],
  'function-values':[['a09ca431',{factor:4,base:5,input:1}],['35cc78a7',{factor:3,base:5,input:2}]],
  'cdf-table':[['61561abe',{values:[0,2,5],probabilities:[0.2,0.4,0.4]}],['1b28d840',{values:[0,2,5],probabilities:[0.1,0.4,0.5]}]],
  continuous:[['f8bc7380',{upper:3,threshold:0.75}],['7bafa1fe',{upper:3,threshold:1.5}]],
  uniform:[['a195ebe3',{lower:6,upper:16,from:8.5,to:13.5}],['1079a878',{lower:4,upper:10,from:5.5,to:8.5}]],
  'plane-regions':[['9fdad3cc',{capacity:8,first:1}],['5248bae5',{capacity:4,first:2}]],
  events:[['63aacf4c',{total:100,countA:50,countB:30,both:10}],['b6207a25',{total:160,countA:96,countB:48,both:32}]],
  combinatorics:[['fb512fe6',{n:8,r:3,multiplicities:[3,2,1]}],['82a19b5',{n:7,r:3,multiplicities:[3,3,2]}]],
  conditional:[['194b11b',{total:100,treated:40,recoveredTreated:20,recoveredUntreated:18}],['f5651770',{total:100,treated:40,recoveredTreated:32,recoveredUntreated:18}]],
  'event-independence':[['8ee61cfa',{probabilityA:0.4,probabilityB:0.5,both:0.15}],['8caeef0b',{probabilityA:0.4,probabilityB:0.5,both:0.25}]],
  bayes:[['2f25ab71',{prevalence:0.01,sensitivity:0.95,falsePositive:0.05}],['6477d418',{prevalence:0.02,sensitivity:0.95,falsePositive:0.05}]],
  discrete:[['3d175477',{values:[0,1,2],weights:[1,3,2]}],['47e934db',{values:[0,1,2],weights:[1,3,6]}]],
  transform:[['e3bebda1',{values:[6,10],probabilities:[0.5,0.5]}],['8457d98c',{values:[1,7],probabilities:[0.5,0.5]}]],
  binomial:[['42016848',{n:12,p:0.2,k:3}],['2666d773',{n:10,p:0.3,k:3}]],
  poisson:[['75920d1a',{rate:2,duration:3,lambda:6,k:3}],['8abf9691',{rate:3,duration:2,lambda:6,k:4}]],
  hypergeometric:[['73d2bb87',{population:30,successes:6,draws:6,k:3}],['1134be66',{population:30,successes:8,draws:6,k:2}]],
  'negative-binomial':[['b15697d6',{r:4,p:0.25,k:2}],['2db445b8',{r:4,p:0.25,k:0}]],
  geometric:[['60e63a62',{p:0.4,trials:2,k:2}],['3a2ff9c5',{p:0.2,trials:5,k:5}]],
  exponential:[['447e2231',{rate:0.5,elapsed:4,extra:1}],['dd998949',{rate:0.25,elapsed:4,extra:3}]],
  normal:[['287cf8aa',{mean:12,sd:3,lower:6,upper:16.5,quantileProbability:0.5}],['b09a5c21',{mean:24,sd:4,lower:20,upper:32,quantileProbability:0.95}]],
  gamma:[['abf51702',{shape:4,scale:4,time:16}],['e86f8885',{shape:2,scale:4,time:8}]],
  cauchy:[['911b4194',{location:0,scale:0.5,lower:-0.5,upper:1.5}],['581f93bf',{location:-2,scale:1,lower:-3,upper:-1}]],
  weibull:[['37f2f3e4',{shape:3,scale:6,time:3,quantileProbability:0.8}],['7f71d2c7',{shape:1,scale:6,time:6,quantileProbability:0.8}]],
  'exponential-family':[['8046dd48',{values:[1,0,2,1,3],candidate:4}],['7f3c9995',{values:[3,2,4,1,5],candidate:1}]],
  'joint-basic':[['4362209e',{valuesX:[0,1],valuesY:[0,1],probabilities:[[0.2,0.3],[0.1,0.4]]}],['14c807ee',{valuesX:[0,1],valuesY:[0,1],probabilities:[[0.2,0.3],[0.3,0.2]]}]],
  multinomial:[['6a0bf748',{n:6,probabilities:[0.2,0.5,0.3],counts:[3,0,3]}],['ae3da562',{n:6,probabilities:[0.2,0.5,0.3],counts:[2,2,2]}]],
  joint:[['3c5cbed7',{valuesX:[0,1],valuesY:[0,1],probabilities:[[0.2,0.3],[0.1,0.4]]}],['49e907c5',{valuesX:[0,1],valuesY:[0,1],probabilities:[[0.2,0.3],[0.2,0.3]]}]],
  'continuous-joint':[['61336478',{a:7,x:1.4,b:4.9,d:1.75}],['5810a024',{a:5,x:2,b:2.5,d:1.25}]],
  'bivariate-normal':[['30e8867c',{meanX:65,meanY:150,sdX:4,sdY:10,rho:0.8,x:73,threshold:155}],['add9a72e',{meanX:55,meanY:110,sdX:4,sdY:6,rho:0.6,x:63,threshold:116}]],
  independence:[['94f67845',{valuesX:[-2,0,2],valuesY:[0,4],probabilities:[[0,0.2],[0.6,0],[0,0.2]]}],['11773bee',{valuesX:[-1,0,1],valuesY:[0,1],probabilities:[[0,1/3],[1/3,0],[0,1/3]]}]],
  covariance:[['25874ac6',{valuesX:[0,1],valuesY:[0,1],probabilities:[[0.2,0.3],[0.3,0.2]]}],['92e957e',{valuesX:[0,1],valuesY:[0,1],probabilities:[[0.3,0.2],[0.2,0.3]]}]]
};

function fingerprint(value) {
  let hash = 2166136261;
  for (const character of JSON.stringify(value)) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return hash.toString(16);
}

function frozenParameters(item, family) {
  if (SNAPSHOTS[family] && !item.exerciseId.startsWith('pdf-') && !item.exerciseId.startsWith('capstone-')) {
    const given = item.animation.steps.filter(step => step.title === 'Datos del enunciado')
      .map(step => step.visual.lines.find(line => line.label === 'Dato original')?.value);
    const snapshot = SNAPSHOTS[family].find(([key]) => key === fingerprint(given));
    if (!snapshot) throw new RangeError(`${item.id}: unrecognized frozen parameters`);
    return structuredClone(snapshot[1]);
  }
  const {exerciseId:id, questionId:question} = item;
  const fixed = {
    'pdf-u1-1':{total:1,countA:0.3,countB:0.6,both:0.1},
    'pdf-u1-3':{priors:[1/3,2/3],rates:[0.99,0.06],labels:['A','B']},
    'pdf-u1-4':{prevalence:question.endsWith('80') ? 0.8 : 0.2,sensitivity:0.95,falsePositive:0.25},
    'pdf-u1-5':{prevalence:0.0021,sensitivity:0.68,falsePositive:0.18},
    'pdf-u2-2.1':{values:[0,1,2],probabilities:[0.3,0.2,0.5]},
    'pdf-u2-2.2':{values:[0,1,2,3,4,5],weights:[1/2,1/3,1/4,1/5,1/6,1/7],k:3},
    'pdf-u2-2.3':{upper:2,threshold:1,rate:1},
    'pdf-u2-2.4':{n:10,p:0.8,k:8}, 'pdf-u2-2.5':{lambda:12,k:question.includes('fifteen') ? 15 : 10},
    'pdf-u2-2.6':{n:150,p:0.1,lambda:15,k:10},
    'pdf-u2-2.7':{mean:106,sd:8,lower:question==='90-to-120' ? 90 : undefined,upper:120,quantileProbability:0.25},
    'pdf-u2-2.8':{mean:80,sd:10,diseaseMean:160,diseaseSd:31.4,quantileProbability:0.02,prevalence:0.1,sensitivity:0.98,falsePositive:1-jStat.normal.cdf(jStat.normal.inv(0.02,160,31.4),80,10)},
    'pdf-u2-2.9':{population:20,successes:10,draws:12,k:6},
    'pdf-u3-3':{valuesX:[0,1,2],valuesY:[0,1,2],probabilities:[[1/9,2/9,1/9],[2/9,2/9,0],[1/9,0,0]]},
    'pdf-u3-4':{points:[[0,0],[2,0],[2,1]],cutSlope:1/3},
    'pdf-u3-5':{points:[[0,0],[2,0],[2,1]],conditionY:0.5,threshold:1.5},
    'pdf-u3-6':{valuesX:[0,1,2],valuesY:[0,1,2],probabilities:[[1/9,2/9,1/9],[2/9,2/9,0],[1/9,0,0]]},
    'pdf-u3-7':{meanX:4,meanY:-1,sdX:Math.sqrt(2),sdY:Math.sqrt(8),rho:1,proposed:7},
    'pdf-u3-8':{n:6,probabilities:[1/3,1/3,1/3],counts:[3,1,2]},
    'capstone-pec1-1':{weekdays:['L','Ma','Mi','J','V'],selectedFirst:question==='b'},
    'capstone-pec1-2':{lambda:question==='b' ? 7.5 : 1.5,k:question==='b' ? 5 : 4,priors:[0.6,0.4],rates:[jStat.poisson.pdf(4,1.5),jStat.poisson.pdf(4,3)],labels:['I1','I2']},
    'capstone-pec1-3':{meanX:100,meanY:120,sdX:15,sdY:20,rho:0.6,x:110,threshold:140,n:question==='e' ? 400 : 10,probabilities:[jStat.normal.cdf(100,120,20),jStat.normal.cdf(140,120,20)-jStat.normal.cdf(100,120,20),1-jStat.normal.cdf(140,120,20)],counts:[2,6,2]}
  };
  if (id === 'capstone-pec1-2' && question === 'c.ii') {
    const weights = [0.6*jStat.poisson.pdf(4,1.5),0.4*jStat.poisson.pdf(4,3)];
    return {...fixed[id],priors:weights.map(value => value/(weights[0]+weights[1])),rates:[jStat.poisson.pdf(0,1.5),jStat.poisson.pdf(0,3)],observation:'0 colonias'};
  }
  if (fixed[id]) return fixed[id];
  if (id === 'pdf-u1-2') return {labels:['Solo A','Solo B','Solo C','AB sin C','AC sin B','BC sin A','ABC','Ninguno'],values:[0.12,0.05,0.03,0.09,0.06,0.03,0.03,0.49]};
  if (id === 'pdf-u3-1' || id === 'pdf-u3-2') return {};
  throw new RangeError(`${item.id}: no mathematical parameter schema`);
}

export function selectedCount(question, value, threshold) {
  if (['at-most','at-most-two','at-most-ten','b'].includes(question)) return value <= threshold;
  if (['strict','strict-tail'].includes(question)) return question === 'strict' ? value < threshold : value > threshold;
  if (['at-least','at-least-one','at-least-fifteen','a-tail','survivors'].includes(question)) return value >= threshold;
  if (['cdf','pmf','joint'].includes(question)) return question === 'cdf' ? value <= threshold : true;
  return value === threshold;
}

function massModel(family, model) {
  if (model.values && !Array.isArray(model.probabilities?.[0])) {
    const weights = model.weights || model.probabilities;
    if (!weights) return null;
    const total = weights.reduce((sum, value) => sum + value, 0);
    return {values:model.values,weights,probabilities:weights.map(value => value / total)};
  }
  let minimum = 0;
  let maximum;
  let density;
  if (family === 'binomial' || family === 'binomial-approximation') {
    maximum = model.n; density = value => jStat.binomial.pdf(value,model.n,model.p);
  } else if (family === 'poisson') {
    maximum = Math.ceil(model.lambda + 5*Math.sqrt(model.lambda)+8); density = value => jStat.poisson.pdf(value,model.lambda);
  } else if (family === 'hypergeometric') {
    minimum = Math.max(0,model.draws-(model.population-model.successes)); maximum = Math.min(model.draws,model.successes);
    density = value => jStat.hypgeom.pdf(value,model.population,model.successes,model.draws);
  } else if (family === 'geometric') {
    minimum = 1; maximum = Math.ceil(Math.log(0.001)/Math.log(1-model.p)); density = value => (1-model.p)**(value-1)*model.p;
  } else if (family === 'negative-binomial') {
    maximum = Math.ceil(model.r*(1-model.p)/model.p+5*Math.sqrt(model.r*(1-model.p)/model.p**2));
    density = value => jStat.negbin.pdf(value,model.r,model.p);
  } else return null;
  const values = Array.from({length:maximum-minimum+1},(_,index) => minimum+index);
  return {values,probabilities:values.map(density),
    ...(family === 'binomial-approximation' ? {approximate:values.map(value => jStat.poisson.pdf(value,model.lambda))} : {})};
}

export function densityModel(family, model, question) {
  let domain;
  let density;
  let cumulative;
  let lower = model.lower;
  let upper = model.upper ?? model.threshold ?? model.time;
  if (family === 'continuous') {
    domain = [0,model.upper]; density = value => 2*value/model.upper**2; cumulative = value => (value/model.upper)**2; lower = 0; upper = model.threshold;
  } else if (family === 'survival-triangle') {
    domain = [0,2]; density = value => 1-value/2; cumulative = value => value-value**2/4; lower = 0; upper = 1;
  } else if (family === 'survival-exponential' || family === 'exponential') {
    domain = [0,7/model.rate]; density = value => jStat.exponential.pdf(value,model.rate); cumulative = value => jStat.exponential.cdf(value,model.rate); lower = model.elapsed ?? 1; upper = domain[1];
  } else if (family === 'uniform') {
    domain = [model.lower,model.upper]; density = () => 1/(model.upper-model.lower); cumulative = value => (value-model.lower)/(model.upper-model.lower); lower = model.from; upper = model.to;
  } else if (family === 'normal' || family === 'normal-approximation') {
    let mean = model.mean;
    let sd = model.sd;
    if (family === 'normal-approximation') {mean = model.n*model.probabilities[2]; sd = Math.sqrt(mean*(1-model.probabilities[2])); lower = 74.5; upper = mean+4*sd;}
    domain = [mean-4*sd,mean+4*sd]; density = value => jStat.normal.pdf(value,mean,sd);
    lower = lower ?? domain[0]; upper = upper ?? domain[1];
    if (question === 'quantile' || question === 'p25') {lower = domain[0]; upper = jStat.normal.inv(model.quantileProbability,mean,sd);}
    if (question === 'cutoff') {
      mean = model.diseaseMean; sd = model.diseaseSd;
      domain = [mean-4*sd,mean+4*sd]; density = value => jStat.normal.pdf(value,mean,sd);
      lower = domain[0]; upper = jStat.normal.inv(0.02,mean,sd);
    }
    if (question === 'false-positive' || question === 'healthy-count-factor') {lower = jStat.normal.inv(0.02,model.diseaseMean,model.diseaseSd); upper = domain[1];}
    cumulative = value => jStat.normal.cdf(value,mean,sd);
  } else if (family === 'gamma') {
    domain = [0,model.shape*model.scale+5*Math.sqrt(model.shape)*model.scale]; density = value => jStat.gamma.pdf(value,model.shape,model.scale); cumulative = value => jStat.gamma.cdf(value,model.shape,model.scale); lower = 0;
  } else if (family === 'cauchy') {
    domain = [model.location-6*model.scale,model.location+6*model.scale]; density = value => jStat.cauchy.pdf(value,model.location,model.scale); cumulative = value => jStat.cauchy.cdf(value,model.location,model.scale);
    if (question === 'median') {lower = domain[0]; upper = model.location;}
  } else if (family === 'weibull') {
    domain = [0,model.scale*3]; density = value => jStat.weibull.pdf(value,model.scale,model.shape); cumulative = value => jStat.weibull.cdf(value,model.scale,model.shape); lower = model.time; upper = domain[1];
    if (question === 'quantile') {lower = 0; upper = model.scale*(-Math.log(1-model.quantileProbability))**(1/model.shape);}
  } else return null;
  if (['d-under-six','f-under-six'].includes(question)) {lower = 0; upper = 0.5;}
  if (['d-six-to-twelve','f-six-to-twelve'].includes(question)) {lower = 0.5; upper = 1;}
  if (['d-over-two','f-over-two'].includes(question)) {lower = 2; upper = domain[1];}
  if (['c-ge','c-gt','f-ge','f-gt'].includes(question)) {lower = 1; upper = domain[1];}
  if (['b-cdf','f-cdf'].includes(question)) {lower = 0; upper = 1;}
  if (['normalizer','constant','a-area','f-constant'].includes(question)) {lower = domain[0]; upper = domain[1];}
  return {domain,lower,upper,point:['point','c-point','f-point'].includes(question),
    cdfPoints:Array.from({length:161},(_,index) => {const value=domain[0]+(domain[1]-domain[0])*index/160; return [value,cumulative(value)];}),
    points:Array.from({length:161},(_,index) => {const value=domain[0]+(domain[1]-domain[0])*index/160; return [value,density(value)];})};
}

export const EXERCISE_FAMILIES = Object.freeze([
  'events', 'conditional', 'bayes', 'discrete', 'continuous', 'binomial', 'poisson',
  'normal', 'uniform', 'exponential', 'geometric', 'hypergeometric', 'gamma',
  'joint', 'covariance', 'independence',
  'transform', 'combinatorics', 'negative-binomial', 'cauchy', 'weibull',
  'multinomial', 'bivariate-normal', 'continuous-joint', 'exponential-family',
  'proportions', 'normalization', 'function-values', 'plane-regions',
  'event-independence', 'cdf-table', 'joint-basic', 'selection',
  'survival-triangle', 'survival-exponential', 'binomial-approximation',
  'gaussian-difference', 'normal-approximation'
]);

const PDF_FAMILIES = Object.freeze({
  'pdf-u1-1':'events', 'pdf-u1-2':'events', 'pdf-u1-3':'bayes', 'pdf-u1-4':'bayes', 'pdf-u1-5':'bayes',
  'pdf-u2-2.1':'discrete', 'pdf-u2-2.2':'discrete', 'pdf-u2-2.4':'binomial', 'pdf-u2-2.5':'poisson',
  'pdf-u2-2.6':'binomial-approximation', 'pdf-u2-2.7':'normal', 'pdf-u2-2.9':'hypergeometric',
  'pdf-u3-1':'joint', 'pdf-u3-2':'joint', 'pdf-u3-3':'joint', 'pdf-u3-4':'continuous-joint',
  'pdf-u3-5':'continuous-joint', 'pdf-u3-6':'covariance', 'pdf-u3-7':'covariance', 'pdf-u3-8':'multinomial'
});

export function exerciseFamily(item) {
  const {exerciseId:id, questionId:question} = item;
  if (id === 'capstone-pec1-1') return 'selection';
  if (id === 'capstone-pec1-2') return question.startsWith('c') ? 'bayes' : 'poisson';
  if (id === 'capstone-pec1-3') {
    if (question === 'd') return 'multinomial';
    if (question === 'e') return 'normal-approximation';
    return ['b', 'c', 'c-reason', 'c-covariance'].includes(question) ? 'gaussian-difference' : 'bivariate-normal';
  }
  if (id === 'pdf-u2-2.3') return question.startsWith('f-') ? 'survival-exponential' : 'survival-triangle';
  if (id === 'pdf-u2-2.8') return question === 'posterior' ? 'bayes' : 'normal';
  if (PDF_FAMILIES[id]) return PDF_FAMILIES[id];
  const family = EXERCISE_FAMILIES.filter(value => id?.endsWith(`-${value}`) || id?.endsWith(`-${value}-1`))
    .sort((left, right) => right.length - left.length)[0];
  if (!family) throw new RangeError(`${item.id}: unsupported exercise family`);
  return family;
}

const actions = Object.freeze({
  events:'allocate-set', conditional:'filter-condition', bayes:'flow-probability',
  selection:'filter-labelled-outcomes', combinatorics:'assign-position',
  'plane-regions':'sweep-feasible-region', 'continuous-joint':'integrate-slice',
  joint:'select-cell', 'joint-basic':'select-cell', independence:'compare-factorization',
  covariance:'center-pair', 'bivariate-normal':'move-conditional-cut',
  'gaussian-difference':'project-difference', 'exponential-family':'scan-likelihood',
  transform:'map-support', normalization:'scale-weights', proportions:'partition-total',
  'function-values':'map-input', 'event-independence':'compare-set-product',
  'cdf-table':'accumulate-mass', discrete:'weight-support', multinomial:'allocate-categories',
  binomial:'select-success-count', poisson:'count-exposure', geometric:'stop-at-success',
  hypergeometric:'draw-without-replacement', 'negative-binomial':'stop-at-r-successes',
  sample:'center-sample'
});

export function layoutExerciseExplanation(sourceLines, cueIndex) {
  const lines = sourceLines.filter(line => (line.cue ?? 0) <= cueIndex);
  const width = 375;
  const height = 430;
  const mathHeight = 100;
  const gap = 12;
  for (let fontSize = 23; fontSize >= 14; fontSize--) {
    const limit = Math.max(1,Math.floor(width/(fontSize*0.75)));
    const estimatedHeight = lines.reduce((total,line) => {
      if (line.tex) return total+mathHeight;
      const words = String(line.value || line.label || '').trim().split(/\s+/u);
      let rows = 1;
      let used = 0;
      for (const word of words) {
        const length = Array.from(word).length;
        if (used && used+1+length > limit) {rows++; used = 0;}
        const occupied = used+Number(used > 0)+length;
        rows += Math.max(0,Math.ceil(occupied/limit)-1);
        used = occupied ? (occupied-1)%limit+1 : 0;
      }
      return total+rows*fontSize*1.35;
    },Math.max(0,lines.length-1)*gap);
    if (estimatedHeight <= height) return {lines,width,height,mathHeight,gap,fontSize,estimatedHeight};
  }
  throw new RangeError(`Exercise explanation exceeds ${width}x${height}; author explicit pages before rendering`);
}

export function planExercise(item) {
  if (item.kind !== 'exercise') return null;
  const family = exerciseFamily(item);
  const model = frozenParameters(item, family);
  const mass = massModel(family, model);
  const density = densityModel(family, model, item.questionId);
  const source = item.animation.steps.map(step => ({
    title:step.title, lines:structuredClone(step.visual?.lines || []),
    context:structuredClone(step.visual?.context || null)
  }));
  return makeNativePlan(item, 'exercise', ({step, index, cues}) => ({
    family,
    data:{
      exerciseId:item.exerciseId, questionId:item.questionId, objective:item.title,
      source, sceneIndex:index, model, mass, density,
      phases:structuredClone(step.visual?.phases || []),
      context:structuredClone(step.visual?.context || null)
    },
    beats:cues.map((text, cueIndex) => ({
      action:actions[family] || 'sweep-density-area',
      focus:cueIndex, phase:step.title,
      lineIndices:(step.visual?.lines || []).flatMap((line, lineIndex) =>
        (line.cue ?? 0) <= cueIndex ? [lineIndex] : [])
    }))
  }));
}