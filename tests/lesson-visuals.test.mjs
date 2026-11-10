import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {COURSE} from '../pages/inferencia/course.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import {createLessonAnimation} from '../pages/inferencia/animations.js';
import {generateExercise} from '../pages/inferencia/exercises.js';
import {enrichLessonAnimation,enrichGlobalAnimation} from '../pages/inferencia/lesson-visuals.js';
import {selectContextDiagram} from '../pages/inferencia/context-diagram.js';

const require = createRequire(import.meta.url);
const visualSource = readFileSync(new URL('../pages/inferencia/lesson-visuals.js',import.meta.url),'utf8');
const {SECTION_VISUALS,GLOBAL_STAGES,CONCEPTS} = await import(`data:text/javascript;base64,${Buffer.from(`${visualSource}\nexport {SECTION_VISUALS,GLOBAL_STAGES,CONCEPTS};`).toString('base64')}`);
const statistics = require('jstat').jStat;
const lessons = COURSE.units.flatMap(unit=>unit.lessons);
const {document} = parseHTML('<html><body></body></html>');
const paragraphs = html => {
  const node = document.createElement('div');
  node.innerHTML = html;
  return Array.from(node.querySelectorAll('p'),paragraph=>paragraph.textContent);
};

function withStatistics(run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis,'jStat');
  globalThis.jStat = statistics;
  try { return run(); }
  finally {
    if (previous) Object.defineProperty(globalThis,'jStat',previous);
    else delete globalThis.jStat;
  }
}

function freeze(value) {
  if (!value || typeof value !== 'object' || ArrayBuffer.isView(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

const sections = lessons.flatMap(lesson=>createLessonSections(lesson).map(section=>({lesson,section,animation:freeze(section.animation)})));
const lectures = withStatistics(()=>lessons.map(lesson=>freeze(createLessonAnimation(lesson,generateExercise,paragraphs))));
const enrichedSections = sections.map(({animation})=>enrichLessonAnimation(animation));
const enrichedLectures = lectures.map(animation=>enrichGlobalAnimation(animation));

function withoutDiagrams(animation) {
  const copy = structuredClone(animation);
  for (const scene of copy.steps || []) if (scene.visual) {
    delete scene.visual.context;
    delete scene.visual.phases;
  }
  return copy;
}

function finiteNumbers(value, path) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value),path);
  else if (value && typeof value === 'object') for (const [key,child] of Object.entries(value)) finiteNumbers(child,`${path}.${key}`);
}

function validIndices(indices, length, label) {
  assert.ok(Array.isArray(indices),label);
  assert.equal(new Set(indices).size,indices.length,label);
  for (const index of indices) assert.ok(Number.isInteger(index) && index>=0 && index<length,label);
}

function validPairs(points, label) {
  assert.ok(points.length>0,label);
  for (const point of points) assert.ok(Array.isArray(point) && point.length===2 && point.every(Number.isFinite),label);
}

function validDiagram(context, label) {
  assert.ok(context && typeof context === 'object',label);
  assert.ok(typeof context.label === 'string' && context.label.length>0,label);
  finiteNumbers(context,label);
  assert.equal(context.text,undefined,label);
  assert.equal(context.cues,undefined,label);
  switch (context.kind) {
    case 'bars':
      assert.ok(context.values.length>0,label);
      assert.equal(context.labels.length,context.values.length,label);
      validIndices(context.highlight,context.values.length,label);
      if (context.measure === 'mass') {
        assert.ok(context.values.every(value=>value>=0 && value<=1),label);
        assert.ok(Math.abs(context.values.reduce((sum,value)=>sum+value,0)+(context.tail || 0)-1)<1e-10,label);
      }
      break;
    case 'matrix':
      assert.equal(context.rows.length,context.values.length,label);
      for (const row of context.values) assert.equal(row.length,context.columns.length,label);
      for (const [row,column] of context.highlight) {
        assert.ok(Number.isInteger(row) && row>=0 && row<context.rows.length,label);
        assert.ok(Number.isInteger(column) && column>=0 && column<context.columns.length,label);
      }
      break;
    case 'trials':
      assert.ok(context.outcomes.length>0,label);
      validIndices(context.selected,context.outcomes.length,label);
      for (const group of context.groups) validIndices(group.indices,context.outcomes.length,label);
      break;
    case 'tree': {
      const walk = nodes => {
        assert.ok(Array.isArray(nodes),label);
        for (const node of nodes) {
          assert.ok(typeof node.label === 'string' && node.label.length>0,label);
          if (node.weight !== undefined) assert.ok(node.weight>=0 && node.weight<=1,label);
          if (node.children) walk(node.children);
        }
      };
      assert.ok(context.nodes.length>0,label);
      walk(context.nodes);
      break;
    }
    case 'number-line':
      assert.ok(context.min<context.max,label);
      for (const item of context.intervals) {
        assert.ok(context.min<=item.from && item.from<=item.to && item.to<=context.max,label);
        assert.equal(item.closed.length,2,label);
        assert.ok(item.closed.every(value=>typeof value === 'boolean'),label);
      }
      break;
    case 'scatter':
      validPairs(context.points,label);
      if (context.highlight) validIndices(context.highlight,context.points.length,label);
      break;
    case 'region':
      validPairs(context.points,label);
      assert.ok(context.points.length>=3,label);
      if (context.cut) validPairs(context.cut,label);
      if (context.polygons) for (const polygon of context.polygons) validPairs(polygon,label);
      break;
    case 'normal':
      assert.ok(Number.isFinite(context.mean) && context.sd>0,label);
      if (context.lower !== undefined && context.upper !== undefined) assert.ok(context.lower<=context.upper,label);
      break;
    case 'joint-normal':
      assert.ok(context.sdX>0 && context.sdY>0 && Math.abs(context.rho)<1,label);
      assert.ok((context.sdX*context.sdY)**2*(1-context.rho**2)>0,label);
      break;
    case 'curve':
      validPairs(context.points,label);
      assert.ok(['density','cdf','survival','function','likelihood','moment-integrand','normalizer-integrand'].includes(context.measure),label);
      assert.ok(context.points.every((point,index)=>!index || point[0]>=context.points[index-1][0]),label);
      if (context.measure !== 'function') assert.ok(context.points.every(point=>point[1]>=0),label);
      if (['cdf','survival'].includes(context.measure)) assert.ok(context.points.every(point=>point[1]<=1+1e-12),label);
      if (context.support) assert.ok(context.support[0]<context.support[1],label);
      if (context.shade) assert.ok(context.shade[0]<=context.shade[1],label);
      break;
    default: assert.fail(`${label}: unsupported diagram ${context.kind}`);
  }
}

function validScene(scene, label) {
  const {context,phases} = scene.visual;
  validDiagram(context,label);
  assert.equal(phases.length,scene.cues.length,label);
  for (const [index,phase] of phases.entries()) {
    const cue = scene.cues[index];
    assert.deepEqual([phase.cue,phase.text,phase.start,phase.end],[index,cue.text,cue.start,cue.end],label);
    assert.equal(phase.focus.source,'cue',label);
    assert.equal(phase.focus.cue,index,label);
    assert.equal(phase.focus.text,cue.text,label);
    assert.ok(phase.focus.anchorCue>=-1 && phase.focus.anchorCue<=index,label);
    if (phase.focus.anchorCue===-1) {
      assert.equal(phase.focus.conceptual,true,label);
      assert.equal(phase.focus.quote,'',label);
      assert.deepEqual(phase.context,CONCEPTS[label.split('--')[0]],`${label}: only a qualitative concept may precede its anchor`);
    } else {
      assert.ok(phase.focus.quote.length>0,label);
      assert.ok(scene.cues[phase.focus.anchorCue].text.includes(phase.focus.quote),label);
    }
    assert.deepEqual(phase.focus.lineIndices,scene.visual.lines.flatMap((line,lineIndex)=>line.cue===index ? [lineIndex] : []),label);
    validDiagram(phase.context,label);
    const targets = phase.focus.targets;
    if (targets.indices) {
      validIndices(targets.indices,(phase.context.values || phase.context.points || phase.context.outcomes).length,label);
      assert.ok(targets.indices.length>0,`${label}: active objects must be selectable`);
    }
    if (targets.cells) for (const [row,column] of targets.cells) assert.ok(row>=0 && row<phase.context.rows.length && column>=0 && column<phase.context.columns.length,label);
    if (targets.nodes) validIndices(targets.nodes,phase.context.nodes.length,label);
    if (targets.intervals) validIndices(targets.intervals,phase.context.intervals.length,label);
    if (targets.part) assert.ok(['cut','polygons','support','contours','density','area','curve','marker'].includes(targets.part),label);
  }
}

function diagramSignature(context) {
  const {label,caption,...structure} = context;
  return JSON.stringify(structure);
}

function sectionScene(lessonId, sectionId) {
  const animation = enrichedSections.find(item=>item.id===`${lessonId}--${sectionId}`);
  assert.ok(animation,`${lessonId}/${sectionId}`);
  return animation.steps[0];
}

function lecture(lessonId) {
  const animation = enrichedLectures.find(item=>item.id===lessonId);
  assert.ok(animation,lessonId);
  return animation;
}

function atSpeech(animation, quote) {
  for (const scene of animation.steps) {
    const index = scene.cues.findIndex(cue=>cue.text.includes(quote));
    if (index>=0) return scene.visual.phases[index];
  }
  assert.fail(`${animation.id}: missing speech ${quote}`);
}

function sectionAt(lessonId, sectionId, quote) {
  return atSpeech({id:`${lessonId}/${sectionId}`,steps:[sectionScene(lessonId,sectionId)]},quote).context;
}

function sectionInitial(lessonId, sectionId) {
  return sectionScene(lessonId,sectionId).visual.phases.find(phase=>phase.focus.anchorCue>=0).context;
}

function questionDataPhase(animation, prompt) {
  const objective = animation.steps.find(scene=>scene.visual.lines.some(line=>line.label==='Objetivo' && line.value===prompt));
  assert.ok(objective,`${animation.id}: missing objective ${prompt}`);
  const prefix = `${objective.title.split(' · ')[0]} · `;
  const data = animation.steps.filter(scene=>scene.title.startsWith(prefix) && scene.visual.lines.some(line=>line.label==='Dato original')).at(-1);
  assert.ok(data,`${animation.id}: missing question data ${prompt}`);
  return data.visual.phases.at(-1);
}

test('all 36 lessons and 118 real sections have a diagram before the first cue and source-bound phases',()=>{
  assert.equal(lessons.length,36);
  assert.equal(sections.length,118);
  assert.equal(new Set(sections.map(item=>item.animation.id)).size,118);
  assert.equal(new Set(sections.map(item=>item.lesson.id)).size,36);
  const kinds = new Set();
  for (const animation of enrichedSections) {
    assert.equal(animation.steps.length,1,animation.id);
    validScene(animation.steps[0],animation.id);
    const phases = animation.steps[0].visual.phases;
    const first = phases.find(phase=>phase.focus.anchorCue>=0);
    assert.ok(first,animation.id);
    if (animation.steps[0].cues[0].text==='Hola.') {
      assert.equal(phases[0].focus.anchorCue,-1,animation.id);
      assert.deepEqual(phases[0].context,CONCEPTS[animation.id.split('--')[0]],animation.id);
    }
    assert.ok(new Set(phases.map(phase=>diagramSignature(phase.context))).size>1,`${animation.id}: diagram must evolve, not just its caption`);
    for (const phase of phases) kinds.add(phase.context.kind);
  }
  assert.ok(kinds.size>=9);
});

test('all real global scenes have initial figures, cue-linked focus and separate exercise/recap modes',()=>{
  assert.equal(enrichedLectures.length,36);
  assert.equal(enrichedLectures.reduce((sum,animation)=>sum+animation.steps.length,0),lectures.reduce((sum,animation)=>sum+animation.steps.length,0));
  for (const animation of enrichedLectures) {
    const signatures = new Set();
    for (const [sceneIndex,scene] of animation.steps.entries()) {
      validScene(scene,`${animation.id}/${scene.title}`);
      for (const phase of scene.visual.phases) {
        assert.equal(phase.focus.scene,sceneIndex);
        assert.equal(phase.focus.mode,scene.data.chapter==='Ejercicios resueltos' ? 'exercise' : 'recap');
        signatures.add(diagramSignature(phase.context));
      }
    }
    assert.ok(signatures.size>1,`${animation.id}: not a single generic placeholder`);
  }
});

test('all narration, captions, timings, duration, IDs, givens and mathematical lines are unchanged',()=>{
  for (const [index,{animation}] of sections.entries()) assert.deepEqual(withoutDiagrams(enrichedSections[index]),animation,animation.id);
  for (const [index,animation] of lectures.entries()) assert.deepEqual(withoutDiagrams(enrichedLectures[index]),animation,animation.id);
  const animation = structuredClone(lectures[0]);
  animation.audio = {src:'unchanged-course-audio.ogg',bytes:new Uint8Array([0,31,255,128,64])};
  animation.steps[0].audio = {src:'unchanged-fragment.ogg',duration:12.75,bytes:new Uint8Array([255,0,128])};
  assert.deepEqual(withoutDiagrams(enrichLessonAnimation(freeze(animation))),animation);
});

test('enrichment is deterministic, independent of call order, clone-safe and does not mutate frozen course input',()=>{
  for (const {animation} of [...sections].reverse()) {
    const before = JSON.stringify(animation);
    const first = enrichLessonAnimation(animation);
    assert.deepEqual(first,enrichLessonAnimation(animation));
    first.steps[0].visual.phases[0].context.label = 'changed result only';
    assert.notEqual(enrichLessonAnimation(animation).steps[0].visual.context.label,'changed result only');
    assert.equal(JSON.stringify(animation),before);
  }
  for (const animation of [...lectures].reverse()) assert.deepEqual(enrichLessonAnimation(animation),enrichGlobalAnimation(animation));
  const original = enrichedLectures[0].steps[0].visual.phases[0].context.label;
  const copy = enrichGlobalAnimation(lectures[0]);
  copy.steps[0].visual.context.label = 'initial diagram only';
  assert.equal(copy.steps[0].visual.phases[0].context.label,original);
});

test('unknown, mismatched and prototype-name IDs stay unchanged without guessed drawings',()=>{
  for (const id of ['unknown','__proto__','constructor','toString','unknown--balanza','algebra--unknown']) {
    const animation = {...structuredClone(lectures[0]),id};
    assert.deepEqual(enrichLessonAnimation(animation),animation,id);
    assert.deepEqual(enrichGlobalAnimation(animation),animation,id);
  }
  const animation = sections[0].animation;
  assert.deepEqual(enrichLessonAnimation(animation,{lessonId:'algebra',sectionId:'balanza'}),animation);
  assert.deepEqual(enrichGlobalAnimation(lectures[0],{lessonId:'normal'}),lectures[0]);
  const unrelated = {...structuredClone(animation),id:'proporciones--parte-y-total',steps:[{title:'Another story',cues:[{text:'Logaritmo, semillas, normal, matriz.',start:0,end:4}],visual:{lines:[]}}]};
  assert.deepEqual(enrichLessonAnimation(unrelated),unrelated);
});

test('authored section focus changes the actual selected set, and strict inequalities exclude atoms',()=>{
  const selected = sectionAt('funciones','seleccionar-valores',"Si piden menos de tres");
  const strict = sectionAt('funciones','seleccionar-valores',"Menos de dos deja solo cero, cuya masa es una décima.");
  const inclusive = sectionAt('funciones','seleccionar-valores',"Como máximo dos sí acepta el propio dos");
  assert.deepEqual(selected.highlight,[0,1]);
  assert.deepEqual(strict.highlight,[0]);
  assert.deepEqual(inclusive.highlight,[0,1]);
  assert.deepEqual(strict.labels,['0','2','5']);
  assert.deepEqual(strict.values,[0.1,0.6,0.3]);
  const phases = sectionScene('uniforme-montecarlo','inversion-y-montecarlo').visual.phases;
  const partition = phases.find(phase=>phase.context.intervals?.length===3).context.intervals;
  assert.deepEqual(partition.map(item=>[item.from,item.to,item.closed]),[[0,0.2,[false,true]],[0.2,0.7,[false,true]],[0.7,1,[false,true]]]);
});

test('section examples keep their own support, table masses, capacities and covariance parameters',()=>{
  assert.deepEqual(sectionInitial('regiones-matrices','frontera').points,[[0,0],[1,0],[0,1]]);
  assert.deepEqual(sectionAt('regiones-matrices','frontera',"Si el primer cultivo recibe tres décimas, uno menos tres décimas deja siete décimas disponibles.").cut,[[0.3,0],[0.3,0.7]]);
  assert.deepEqual(sectionAt('conjunta-discreta','parejas',"En la tabla equis identifica filas e i griega columnas.").values,[[0.35,0.15],[0.25,0.25]]);
  const covariance = sectionInitial('covarianza-matrices','normalizar-covarianza').values;
  assert.deepEqual(covariance,[[9,6],[6,16]]);
  assert.ok(covariance[0][0]*covariance[1][1]-covariance[0][1]**2>0);
  const joint = sectionInitial('normal-bivariante','modelo-conjunto');
  assert.deepEqual([joint.meanX,joint.meanY,joint.sdX,joint.sdY,joint.rho],[30,70,5,8,0.25]);
  const tail = sectionAt('normal-bivariante','cola-condicional',"El total de referencia es la distribución condicional del corte");
  assert.deepEqual([tail.mean,tail.sd,tail.lower],[74,Math.sqrt(60),82]);
  assert.deepEqual(sectionInitial('combinaciones-incorrelacion','suma-y-diferencia').values,[[4,3],[3,9]]);
  const continuous = sectionInitial('combinaciones-incorrelacion','incorrelacion');
  assert.equal(continuous.connected,true);
  assert.equal(continuous.points.length,81);
});

test('global stories use their own numbers rather than section demonstrations',()=>{
  assert.deepEqual(atSpeech(lecture('bayes-diagnostico'),"En total esperamos ciento treinta y cinco positivos.").context.values,[90,45]);
  assert.deepEqual(atSpeech(lecture('condicionada'),"Eliminamos las sesenta incompatibles con esa información.").context.values,[10,30]);
  assert.deepEqual(atSpeech(lecture('conjunta-discreta'),"Usamos cero coma dos y cero coma tres en la fila equis cero, y cero coma uno y cero coma cuatro en la fila equis uno.").context.values,[[0.2,0.3],[0.1,0.4]]);
  const global = atSpeech(lecture('normal-bivariante'),"Sus medias son doce y treinta, sus desviaciones dos y cuatro, y su correlación cero coma seis.").context;
  assert.deepEqual([global.meanX,global.meanY,global.sdX,global.sdY,global.rho],[12,30,2,4,0.6]);
  const tail = atSpeech(lecture('normal-bivariante'),"Queremos superar treinta y cinco coma seis una vez conocido equis catorce.").context;
  assert.deepEqual([tail.mean,tail.sd,tail.lower],[32.4,3.2,35.6]);
  assert.deepEqual(atSpeech(lecture('familia-exponencial'),"Observamos dos, cuatro y tres colonias en placas de igual exposición.").context.values,[2,4,3]);
  const discrete = atSpeech(lecture('combinaciones-incorrelacion'),"Toma equis menos uno, cero y uno con igual probabilidad y define i griega como su cuadrado.").context;
  assert.deepEqual(discrete.points,[[-1,1],[0,0],[1,1]]);
  assert.equal(discrete.connected,undefined);
});

test('figures do not reveal later normalization or log-likelihood terms before their authored cue',()=>{
  const percentages = sectionScene('proporciones','porcentaje-y-exposicion');
  assert.deepEqual(percentages.visual.context,CONCEPTS.proporciones);
  assert.deepEqual(sectionInitial('proporciones','porcentaje-y-exposicion').values,[18,54]);
  assert.deepEqual(sectionAt('proporciones','porcentaje-y-exposicion',"Veinticinco por ciento sigue representando las dieciocho de setenta y dos.").values,[25,75]);
  const logs = sectionScene('familia-exponencial','log-verosimilitud');
  assert.deepEqual(logs.visual.context,CONCEPTS['familia-exponencial']);
  assert.deepEqual(sectionInitial('familia-exponencial','log-verosimilitud').values,[0,1,2]);
  assert.deepEqual(sectionAt('familia-exponencial','log-verosimilitud',"La suma de los recuentos es tres y multiplica logaritmo natural de lambda.").values,[0]);
  assert.deepEqual(sectionAt('familia-exponencial','log-verosimilitud',"Cada una de las tres ventanas aporta menos lambda al logaritmo de la masa.").values,[0,-3]);
  assert.equal(sectionAt('normal-bivariante','media-y-varianza-condicional',"El desplazamiento se aplica a la media marginal de i griega, setenta.").kind,'tree');
  const spread = sectionAt('normal-bivariante','media-y-varianza-condicional',"Para medir distancias necesitamos la desviación, raíz de sesenta, aproximadamente siete coma setecientos cuarenta y seis.");
  assert.deepEqual([spread.mean,spread.sd],[74,Math.sqrt(60)]);
  const animation = lecture('algebra');
  const intro = animation.steps.find(scene=>scene.title.startsWith('E1.1 · ') && scene.visual.lines.some(line=>line.value?.startsWith('Pesos:')));
  assert.ok(intro);
  const weightsLine = intro.visual.lines.find(line=>line.value?.startsWith('Pesos:'));
  const weights = weightsLine.value.match(/\d+/g).map(Number);
  assert.deepEqual(intro.visual.phases[weightsLine.cue].context.values,weights);
  const normalized = animation.steps.find(scene=>scene.title==='E1.1 · Hacer lo mismo en ambos lados');
  assert.ok(normalized);
  assert.ok(Math.abs(normalized.visual.phases.at(-1).context.values.reduce((sum,value)=>sum+value,0)-1)<1e-12);
});

test('global exercise and final-recap boundaries discard the preceding example',()=>{
  for (const animation of enrichedLectures) {
    const final = animation.steps.at(-1);
    const intros = animation.steps.filter(item=>/^Ejercicio \d+:/.test(item.title));
    assert.ok(intros.length>0,animation.id);
    for (const scene of intros) {
      assert.deepEqual(scene.visual.context,final.visual.context,`${animation.id}/${scene.title}: stale example at reset`);
      assert.equal(scene.visual.phases[0].focus.mode,'exercise');
    }
    assert.equal(final.visual.phases[0].focus.mode,'recap');
  }
});

test('changing actual exercise seeds retains givens and binds diagrams to their own numeric values',()=>withStatistics(()=>{
  for (const seed of [1,17,29]) for (const lessonId of ['proporciones','algebra','normal-bivariante','conjunta-discreta','calculo-modelos','cauchy-weibull']) {
    const lesson = lessons.find(item=>item.id===lessonId);
    const source = createLessonAnimation(lesson,type=>generateExercise(type,seed),paragraphs);
    const enriched = enrichGlobalAnimation(freeze(source));
    assert.deepEqual(withoutDiagrams(enriched),source,`${lessonId}/${seed}`);
    const dataScenes = enriched.steps.filter(scene=>scene.data.chapter==='Ejercicios resueltos' && scene.visual.lines.some(line=>line.label==='Dato original'));
    assert.ok(dataScenes.length>0,`${lessonId}/${seed}`);
    for (const intro of dataScenes) {
      for (const line of intro.visual.lines) {
        const context = intro.visual.phases[line.cue].context;
        if (line.value?.startsWith('Se siembran ')) {
          const [total,part] = line.value.match(/\d+/g).map(Number);
          assert.deepEqual(context.values,[part,total-part]);
        }
        if (line.value?.startsWith('Pesos: ')) assert.deepEqual(context.values,line.value.match(/\d+/g).map(Number));
        if (line.value?.startsWith('Medias μ_X=')) {
          const [meanX,meanY,sdX,sdY,rho] = line.value.match(/-?\d+(?:,\d+)?/g).map(value=>Number(value.replace(',','.')));
          assert.deepEqual([context.meanX,context.meanY,context.sdX,context.sdY,context.rho],[meanX,meanY,sdX,sdY,rho]);
        }
        if (line.value?.startsWith('Media μ = ')) {
          const [mean,sd] = line.value.match(/\d+(?:,\d+)?/g).map(value=>Number(value.replace(',','.')));
          assert.deepEqual([context.mean,context.sd],[mean,sd]);
        }
      }
      for (const phase of intro.visual.phases) validDiagram(phase.context,`${lessonId}/${seed}`);
    }
  }
}));

test('a later marginal question does not inherit the previous conditional-row diagram',()=>withStatistics(()=>{
  const lesson = {...lessons.find(item=>item.id==='marginales'),exerciseQuestions:{}};
  const source = createLessonAnimation(lesson,type=>{
    const exercise = generateExercise(type,17);
    return type==='joint' ? {...exercise,questions:[...exercise.questions].reverse()} : exercise;
  },paragraphs);
  const enriched = enrichGlobalAnimation(freeze(source));
  const conditional = questionDataPhase(enriched,'Calcula P(Y=1 | X=1).');
  const marginal = questionDataPhase(enriched,'Calcula P(Y=1).');
  assert.deepEqual(conditional.context.highlight,[[1,0],[1,1]]);
  assert.equal(marginal.context.kind,'matrix');
  assert.deepEqual(marginal.context.highlight,[[0,1],[1,1]]);
  const division = enriched.steps.find(scene=>scene.title==='E1.1 · Dividir la celda por la fila');
  assert.ok(division);
  assert.equal(division.visual.phases.at(-1).context.kind,'bars');
  assert.ok(Math.abs(division.visual.phases.at(-1).context.values.reduce((sum,value)=>sum+value,0)-1)<1e-12);
  assert.deepEqual(withoutDiagrams(enriched),source);
}));

test('conditional areas and singular multinomial covariances preserve their mathematical constraints',()=>{
  const density = sectionAt('conjunta-condicional','normalizar-corte',"Comprobemos la normalización: altura uno coma veinticinco por anchura cero coma ocho da uno.");
  assert.deepEqual(density.support,[0,0.8]);
  assert.equal((density.support[1]-density.support[0])*density.points[0][1],1);
  const covariance = sectionAt('multinomial','momentos-con-indicadores',"Al pasar a los recuentos sumamos una contribución por cada una de las cuatro células.").values;
  assert.deepEqual(covariance,[[1,-0.6,-0.4],[-0.6,0.84,-0.24],[-0.4,-0.24,0.64]]);
  for (const [rowIndex,row] of covariance.entries()) {
    assert.ok(Math.abs(row.reduce((sum,value)=>sum+value,0))<1e-12);
    for (const [columnIndex,value] of row.entries()) {
      assert.equal(value,covariance[columnIndex][rowIndex]);
      assert.ok(covariance[rowIndex][rowIndex]*covariance[columnIndex][columnIndex]-value**2>=-1e-12);
    }
  }
  const poisson = sectionInitial('poisson','masa-y-complemento');
  assert.equal(poisson.labels[0],'0');
  assert.ok(Math.abs(poisson.values[0]-Math.exp(-3))<1e-12);
  assert.ok(Math.abs(poisson.values.reduce((sum,value)=>sum+value,0)+poisson.tail-1)<1e-12);
});

test('literal authored cue binding does not guess replacements from nearby topic keywords',()=>{
  const original = sections.find(item=>item.animation.id==='funciones--seleccionar-valores').animation;
  const changed = structuredClone(original);
  const index = changed.steps[0].cues.findIndex(cue=>cue.text==="Menos de dos deja solo cero, cuya masa es una décima.");
  assert.ok(index>=0);
  changed.steps[0].cues[index].text='Funciones, brotes, menos de, logaritmo y normal.';
  assert.throws(()=>enrichLessonAnimation(freeze(changed)),/visual anchor must match exactly once/);
});

test('invalid or incomplete numeric givens keep finite qualitative figures instead of fabricated parameters',()=>{
  const cases = [
    ['normal','Media μ = 40 micrómetros; desviación típica σ = 0 micrómetros.'],
    ['normal',`Media μ = ${'9'.repeat(400)} micrómetros; desviación típica σ = 4 micrómetros.`],
    ['bernoulli-binomial','n = 3 semillas, probabilidad de germinación p = 1,5, k = 2.'],
    ['variable-cdf','P(X = 0) = 0,7; P(X = 2) = 0,6; P(X = 5) = 0,3.'],
    ['independencia-sucesos','P(A) = 1,5; P(B) = 0,3.'],
    ['normal-bivariante','Se fija X=x=40; umbral de Y: c=82.'],
    ['momentos-transformaciones',`X=${'9'.repeat(400)} o X=2 unidades, cada uno con probabilidad 1/2.`],
    ['gamma',`Forma k = 3; escala α = ${'1'+'0'.repeat(307)} minutos; tasa r = 1/α = 1 por minuto.`]
  ];
  for (const [id,text] of cases) {
    const source = freeze({id,steps:[{title:'Ejercicio 1: cambiamos los datos',cues:[{text,start:0,end:5}],visual:{lines:[]}}]});
    const enriched = enrichGlobalAnimation(source);
    const context = enriched.steps[0].visual.context;
    assert.ok(['tree','trials'].includes(context.kind),`${id}: unsafe inferred parameters`);
    validScene(enriched.steps[0],id);
    assert.deepEqual(withoutDiagrams(enriched),source);
  }
});

test('geometric stopping and strict tails select different real trial outcomes',()=>withStatistics(()=>{
  const lesson = {...lessons.find(item=>item.id==='geometrica-negativa'),exerciseTypes:['geometric'],exerciseQuestions:{}};
  const exercise = generateExercise('geometric',17);
  const source = createLessonAnimation(lesson,()=>exercise,paragraphs);
  const enriched = enrichGlobalAnimation(freeze(source));
  const exact = questionDataPhase(enriched,'Calcula P(T = k).').context;
  const tail = questionDataPhase(enriched,'Calcula P(T > k).').context;
  assert.equal(exact.outcomes.length,exercise.visual.params.trials);
  assert.equal(exact.outcomes.at(-1),'Éxito');
  assert.ok(exact.outcomes.slice(0,-1).every(outcome=>outcome==='Fallo'));
  assert.equal(tail.outcomes.length,exercise.visual.params.trials);
  assert.ok(tail.outcomes.every(outcome=>outcome==='Fallo'));
  assert.notDeepEqual(exact,tail);
  assert.deepEqual(withoutDiagrams(enriched),source);
}));

test('the explained memoryless reduction remains on additional time in subsequent cues',()=>withStatistics(()=>{
  const lesson = {...lessons.find(item=>item.id==='exponencial'),exerciseQuestions:{}};
  const exercise = generateExercise('exponential',17);
  const source = createLessonAnimation(lesson,()=>exercise,paragraphs);
  const enriched = enrichGlobalAnimation(freeze(source));
  const question = questionDataPhase(enriched,'Calcula P(T > t+s | T > t).');
  assert.equal(question.context.kind,'number-line');
  assert.equal(question.context.max,exercise.visual.params.elapsed+exercise.visual.params.extra);
  const reductionIndex = enriched.steps.findIndex(scene=>scene.title==='E1.2 · Cancelar el tiempo transcurrido');
  assert.ok(reductionIndex>=0);
  const reduction = enriched.steps[reductionIndex];
  const anchor = reduction.visual.lines.find(line=>line.label==='Cancelar el tiempo transcurrido').cue;
  for (const phase of reduction.visual.phases.slice(anchor)) {
    assert.equal(phase.context.kind,'curve');
    assert.equal(phase.context.measure,'survival');
    assert.equal(phase.context.marker,exercise.visual.params.extra);
  }
  for (const phase of enriched.steps[reductionIndex+1].visual.phases) assert.equal(phase.context.marker,exercise.visual.params.extra);
  assert.deepEqual(withoutDiagrams(enriched),source);
}));

test('a normal percentile asks for an area level, not the previous interval',()=>withStatistics(()=>{
  const lesson = {...lessons.find(item=>item.id==='normal'),exerciseQuestions:{}};
  const source = createLessonAnimation(lesson,generateExercise,paragraphs);
  const enriched = enrichGlobalAnimation(freeze(source));
  const quantile = questionDataPhase(enriched,'Calcula el percentil 95 de X.').context;
  assert.equal(quantile.kind,'normal');
  assert.equal(quantile.level,0.95);
  assert.equal(quantile.lower,undefined);
  assert.equal(quantile.upper,undefined);
  assert.deepEqual(withoutDiagrams(enriched),source);
}));

test('every one of the 420 section and 118 global checkpoints reaches its exact intended diagram',()=>{
  assert.equal(Object.keys(SECTION_VISUALS).length,118);
  assert.equal(Object.keys(GLOBAL_STAGES).length,36);
  assert.equal(Object.values(SECTION_VISUALS).flat().length,420);
  assert.equal(Object.values(GLOBAL_STAGES).flat().length,118);
  const counts = {
    proporciones:[5,5,3],algebra:[3,4,4],funciones:[4,4,5],calculo:[4,4,4],'regiones-matrices':[4,4,4],sucesos:[3,5,4],axiomas:[4,3,4,4],combinatoria:[3,4,3],condicionada:[3,3,3],
    'independencia-sucesos':[3,3,3],'bayes-diagnostico':[6,3,4],'variable-cdf':[3,4,3],masa:[3,4,3],densidad:[3,4,3],esperanza:[4,3,3],varianza:[5,3,3],
    'momentos-transformaciones':[3,3,8,4],'bernoulli-binomial':[4,3,3],poisson:[3,4,4],hipergeometrica:[3,3,3],'geometrica-negativa':[4,4,3,4],'uniforme-montecarlo':[3,4,4],exponencial:[3,3,4],normal:[3,3,5,4],gamma:[3,3,3,3],
    'cauchy-weibull':[3,3,3,3],'calculo-modelos':[3,4,3],'familia-exponencial':[4,4,3,3,4,3],'conjunta-discreta':[3,3,6],multinomial:[3,3,4],marginales:[3,3,4],'conjunta-condicional':[3,3,3],
    'normal-bivariante':[3,3,4,4],'independencia-variables':[4,3,3],'covarianza-matrices':[3,3,5],'combinaciones-incorrelacion':[4,3,3]
  };
  for (const [lessonId,expected] of Object.entries(counts)) assert.deepEqual(Object.entries(SECTION_VISUALS).filter(([id])=>id.startsWith(`${lessonId}/`)).map(([,stages])=>stages.length),expected,`${lessonId}: preserve every intended phase`);
  assert.deepEqual(Object.fromEntries(Object.entries(GLOBAL_STAGES).map(([id,stages])=>[id,stages.length])),{
    proporciones:4,algebra:4,funciones:6,calculo:3,'regiones-matrices':3,sucesos:4,axiomas:2,combinatoria:5,condicionada:2,'independencia-sucesos':4,'bayes-diagnostico':4,'variable-cdf':5,masa:3,densidad:3,esperanza:2,varianza:4,
    'momentos-transformaciones':2,'bernoulli-binomial':2,poisson:3,hipergeometrica:3,'geometrica-negativa':2,'uniforme-montecarlo':3,exponencial:3,normal:6,gamma:2,'cauchy-weibull':2,'calculo-modelos':3,'familia-exponencial':4,'conjunta-discreta':3,multinomial:3,marginales:3,'conjunta-condicional':4,'normal-bivariante':3,'independencia-variables':3,'covarianza-matrices':3,'combinaciones-incorrelacion':3
  });
  for (const [id,stages] of Object.entries(SECTION_VISUALS)) {
    const [lessonId,sectionId] = id.split('/');
    const scene = sectionScene(lessonId,sectionId);
    assert.ok(new Set(stages.map(entry=>diagramSignature(entry.context))).size>1,`${id}: evolution must not rely on the conceptual greeting`);
    const anchors = stages.map(entry=>{
      const matches = scene.cues.flatMap((cue,index)=>cue.text.includes(entry.quote) ? [index] : []);
      assert.equal(matches.length,1,`${id}: ${entry.quote}`);
      const cue = matches[0];
      const phase = scene.visual.phases[cue];
      assert.equal(phase.focus.anchorCue,cue,`${id}: discarded checkpoint`);
      assert.equal(phase.focus.quote,entry.quote,id);
      assert.deepEqual(phase.context,entry.context,`${id}: overwritten checkpoint`);
      return cue;
    });
    assert.equal(new Set(anchors).size,stages.length,`${id}: phases must not overwrite each other in one cue`);
    assert.deepEqual(anchors,[...anchors].sort((left,right)=>left-right),`${id}: authored progression`);
    for (const phase of scene.visual.phases) {
      const active = anchors.findLastIndex(cue=>cue<=phase.cue);
      assert.deepEqual(phase.context,active<0 ? CONCEPTS[lessonId] : stages[active].context,`${id}/${phase.cue}: hold only the last spoken checkpoint`);
      assert.equal(phase.focus.anchorCue,active<0 ? -1 : anchors[active],id);
    }
  }
  for (const [id,stages] of Object.entries(GLOBAL_STAGES)) {
    const animation = lecture(id);
    assert.ok(new Set(stages.map(entry=>diagramSignature(entry.context))).size>1,`${id}: diagrams must change structurally`);
    const story = animation.steps.flatMap((scene,sceneIndex)=>['Una situación concreta','Vamos a razonarlo'].includes(scene.data.chapter) ? [{scene,sceneIndex}] : []);
    const anchors = stages.map(entry=>{
      const matches = story.flatMap(({scene,sceneIndex})=>scene.cues.flatMap((cue,index)=>cue.text.includes(entry.quote) ? [{scene:sceneIndex,cue:index}] : []));
      assert.equal(matches.length,1,`${id}: ${entry.quote}`);
      const anchor = matches[0];
      const phase = animation.steps[anchor.scene].visual.phases[anchor.cue];
      assert.deepEqual(phase.focus.checkpoint,{...anchor,quote:entry.quote},`${id}: discarded checkpoint`);
      assert.deepEqual(phase.context,entry.context,`${id}: overwritten checkpoint`);
      return anchor.scene*10000+anchor.cue;
    });
    assert.equal(new Set(anchors).size,stages.length,id);
    assert.deepEqual(anchors,[...anchors].sort((left,right)=>left-right),`${id}: authored progression`);
    for (const scene of animation.steps) for (const phase of scene.visual.phases) if (phase.focus.checkpoint) {
      const checkpoint = phase.focus.checkpoint;
      assert.ok(animation.steps[checkpoint.scene].cues[checkpoint.cue].text.includes(checkpoint.quote),id);
      assert.deepEqual(phase.context,stages.find(entry=>entry.quote===checkpoint.quote).context,`${id}: stale provenance`);
    }
  }
});

test('all contexts are reversible at every cue without fabricating time-percentage phases',()=>{
  for (const animation of [...enrichedSections,...enrichedLectures]) for (const scene of animation.steps) {
    const initial = structuredClone(scene.visual.context);
    const expected = scene.visual.phases.map(phase=>structuredClone(phase.context));
    for (const cue of [...expected.keys(),...Array.from(expected.keys()).reverse()]) {
      const selected = selectContextDiagram(scene.visual,cue);
      assert.deepEqual(selected.diagram,expected[cue],`${animation.id}/${scene.title}/${cue}`);
      assert.equal(selected.phase.cue,cue);
      assert.deepEqual([selected.phase.start,selected.phase.end],[scene.cues[cue].start,scene.cues[cue].end]);
    }
    assert.deepEqual(selectContextDiagram(scene.visual,-1).diagram,initial,animation.id);
  }
});

test('missing and ambiguous section/global quotes fail instead of leaving a convincing frozen figure',()=>{
  for (const {animation} of sections) {
    const stages = SECTION_VISUALS[animation.id.replace('--','/')];
    for (const entry of stages) {
      const changed = structuredClone(animation);
      const scene = changed.steps[0];
      const cue = scene.cues.find(cue=>cue.text.includes(entry.quote));
      assert.ok(cue);
      cue.text = 'Esta frase ya no contiene el anclaje.';
      assert.throws(()=>enrichLessonAnimation(changed),/visual anchor must match exactly once/,`${animation.id}: ${entry.quote}`);
    }
    const changed = structuredClone(animation);
    const cue = changed.steps[0].cues.find(cue=>cue.text.includes(stages[0].quote));
    changed.steps[0].cues.push({...cue});
    assert.throws(()=>enrichLessonAnimation(changed),/visual anchor must match exactly once/,animation.id);
  }
  for (const animation of lectures) for (const entry of GLOBAL_STAGES[animation.id]) {
    const changed = structuredClone(animation);
    const scene = changed.steps.find(scene=>['Una situación concreta','Vamos a razonarlo'].includes(scene.data.chapter) && scene.cues.some(cue=>cue.text.includes(entry.quote)));
    const cue = scene.cues.find(cue=>cue.text.includes(entry.quote));
    cue.text = 'La cita global ha cambiado.';
    assert.throws(()=>enrichGlobalAnimation(changed),/visual anchor must match exactly once/,`${animation.id}: ${entry.quote}`);
    cue.text = entry.quote;
    scene.cues.push({...cue});
    assert.throws(()=>enrichGlobalAnimation(changed),/visual anchor must match exactly once/,animation.id);
  }
});

test('global normal percentile clears the old interval, shades the left 95 percent and returns to micrometres',()=>{
  const animation = lecture('normal');
  const question = atSpeech(animation,'Un percentil invierte la pregunta').context;
  assert.equal(question.level,0.95);
  assert.equal(question.lower,undefined);
  assert.equal(question.upper,undefined);
  const standard = atSpeech(animation,'El nivel noventa y cinco por ciento').context;
  assert.deepEqual([standard.mean,standard.sd,standard.upper],[0,1,1.64485]);
  const result = atSpeech(animation,'Deshacemos la tipificación multiplicando por cuatro').context;
  assert.deepEqual([result.mean,result.sd,result.lower,result.upper],[40,4,undefined,46.5794]);
  assert.equal(result.marker,result.upper);
  assert.ok(Math.abs(statistics.normal.cdf(result.upper,result.mean,result.sd)-0.95)<1e-6);
  assert.equal(result.upper.toFixed(2),'46.58');
  const section = sectionAt('normal','cuantiles-y-combinaciones','Deshacemos ahora el centrado añadiendo la media cuarenta.');
  assert.ok(Math.abs(statistics.normal.cdf(section.upper,section.mean,section.sd)-0.9)<1e-5);
});