import {COURSE} from './course.js';
import {generateExercise, scopeExercise} from './exercises.js';
import {getPdfExercises} from './pdf-exercises.js';
import {getCapstoneExercises} from './capstone.js';
import {stageEquations,createTutorFrames} from './exercise-tutor.js';
import {storyScene} from './lecture-story.js';
import {mountAnimation} from './animations.js';
import {gradeAnswer} from './exercises.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const speechOwners=new WeakMap();

export function createExerciseSpeech(owner,animation) {
  const view=owner.defaultView;
  const synthesis=view.speechSynthesis;
  if(!synthesis || !view.SpeechSynthesisUtterance)return null;
  const clock=owner.createElement('span');
  let offset=0;
  const cues=animation.steps.flatMap(step=>{
    const start=offset;offset+=step.duration;
    return step.cues.map(cue=>({...cue,start:start+cue.start,end:start+cue.end}));
  });
  let cursor=0;
  let paused=true;
  let utterance=null;
  let generation=0;
  const emit=type=>clock.dispatchEvent(new view.Event(type));
  const halt=()=>{
    generation++;utterance=null;
    if(speechOwners.get(synthesis)===clock){synthesis.cancel();speechOwners.delete(synthesis);}
    const wasPlaying=!paused;paused=true;if(wasPlaying)emit('pause');
  };
  const speak=()=>{
    if(paused)return;
    const cue=cues.find(item=>cursor>=item.start && cursor<item.end);
    if(!cue){cursor=offset;paused=true;utterance=null;emit('ended');return;}
    const token=++generation;
    utterance=new view.SpeechSynthesisUtterance(cue.text);
    utterance.lang='es-ES';utterance.rate=0.95;
    const voices=synthesis.getVoices();
    utterance.voice=voices.find(voice=>voice.lang==='es-ES' && /alvaro|álvaro|pablo|jorge|diego|microsoft|google/i.test(voice.name)) || voices.find(voice=>voice.lang.startsWith('es')) || null;
    utterance.onboundary=event=>{
      if(token!==generation || paused)return;
      cursor=cue.start+Math.min(0.98,event.charIndex/cue.text.length)*(cue.end-cue.start);emit('timeupdate');
    };
    utterance.onend=()=>{
      if(token!==generation || paused)return;
      const next=cues[cues.indexOf(cue)+1];cursor=next?.start ?? offset;utterance=null;emit('timeupdate');speak();
    };
    utterance.onerror=event=>{if(token===generation && !['canceled','interrupted'].includes(event.error)){halt();emit('error');}};
    synthesis.speak(utterance);
  };
  Object.defineProperties(clock,{
    currentTime:{get:()=>cursor,set:value=>{
      const wasPlaying=!paused;
      generation++;utterance=null;
      if(speechOwners.get(synthesis)===clock)synthesis.cancel();
      cursor=Math.max(0,Math.min(offset,Number(value)||0));
      const cue=cues.find(item=>cursor>=item.start && cursor<item.end);
      if(cue)cursor=cue.start;
      emit('seeking');
      if(wasPlaying){synthesis.resume();speak();}
    }},
    duration:{get:()=>offset},paused:{get:()=>paused}
  });
  clock.play=()=>{
    const other=speechOwners.get(synthesis);
    if(other && other!==clock)other.halt();
    speechOwners.set(synthesis,clock);
    paused=false;
    if(utterance)synthesis.resume();else {synthesis.cancel();synthesis.resume();speak();}
    emit('play');return Promise.resolve();
  };
  clock.pause=()=>{if(paused)return;paused=true;if(speechOwners.get(synthesis)===clock)synthesis.pause();emit('pause');};
  clock.halt=halt;
  const remove=clock.remove.bind(clock);
  clock.remove=()=>{halt();remove();};
  return clock;
}

export function lessonPractice(lesson) {
  return lesson.exerciseTypes.map(type => {
    const content = exercise => JSON.stringify([exercise.prompt, exercise.given, exercise.questions.map(question => question.prompt)]);
    const worked = content(scopeExercise(lesson, generateExercise(type, 1)));
    let seed = 2;
    let exercise = scopeExercise(lesson, generateExercise(type, seed));
    while (content(exercise) === worked && seed < 34) exercise = scopeExercise(lesson, generateExercise(type, ++seed));
    if (content(exercise) === worked) throw new Error(`No hay una práctica distinta para ${lesson.id}/${type}`);
    return {...exercise, id:`practica-${lesson.id}-${type}`, lessonIds:[lesson.id]};
  });
}

export function exerciseCatalogue() {
  return [...getPdfExercises(), ...getCapstoneExercises(), ...COURSE.units.flatMap(unit => unit.lessons.flatMap(lesson=>[
    ...lessonPractice(lesson),
    ...lesson.exerciseTypes.map(type=>({...scopeExercise(lesson,generateExercise(type,1)),id:`ejemplo-${lesson.id}-${type}-1`,lessonIds:[lesson.id]}))
  ]))];
}

export function exerciseAnimation(exercise, question) {
  const slug = question.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const parentLesson = `ejercicio-${exercise.id}`;
  const frames=createTutorFrames(exercise,question);
  const initial=frames[0].diagram;
  let context=initial;
  const beats = [
    {context:initial,say:`Vamos a resolver este apartado juntos. ${question.prompt} Antes de calcular, vamos a distinguir los datos de lo que nos están pidiendo.`, show:[{label:'Objetivo',value:question.prompt}]},
    ...exercise.given.map(value => ({context:initial,say:`El enunciado nos da este dato: ${value}`, show:[{label:'Dato',value}]})),
    ...exercise.assumptions.map(value => ({context:initial,say:`Para razonar correctamente, tenemos en cuenta este supuesto: ${value}`, show:[{label:'Supuesto',value}]})),
    ...question.steps.flatMap(step => stageEquations(step).map((part,index) => {
      context=(part.tex ? frames.find(frame=>frame.tex===part.tex)?.diagram : null) || context;
      return {context,
        say:index === 0 ? `${step.title}. ${step.explanation}` : `Continuamos el cálculo de este mismo paso sin cambiar los datos ni el significado de la expresión.`,
        show:[part.tex ? {label:part.title,tex:part.tex} : {label:part.title,value:part.explanation}]
      };
    })),
    {context:frames.at(-1).diagram,say:`Volvemos ahora a la pregunta inicial para interpretar lo que hemos obtenido. ${question.interpretation || question.answerText}`, show:[{label:'Interpretación',value:question.interpretation || question.answerText}]}
  ];
  return {
    id:`${parentLesson}--${slug}`, kind:'lecture', title:question.prompt,
    parentLesson, parentTitle:exercise.title, sectionId:slug, sourceSections:[question.prompt], optional:false,
    source:exercise.source || {document:'Práctica didáctica de la lección',section:exercise.title},
    steps:beats.map((beat,index) => {
      const scene=storyScene(index === 0 ? 'Planteamiento' : index === beats.length-1 ? 'Interpretación' : `Paso ${index}`, 'Resolución razonada', [beat]);
      if(beat.context)scene.visual.context=beat.context;
      return scene;
    })
  };
}

export function mountExercises(root, {exercises, lessonId, formatMath, audio, baseUrl='/', renderExtra:extraMarkup=()=>'', renderIcons=()=>{}}) {
  const owner=root.ownerDocument;
  const renderExtra=(exercise,question)=>extraMarkup(exercise,question,formatMath);
  const lesson=COURSE.units.flatMap(unit=>unit.lessons).find(item=>item.id===lessonId);
  const listeners=[];
  const players=new Map();
  let disposed=false;
  const listen=(target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
  const source=exercise=>{
    if(!exercise.source)return '';
    const {file,document,number,page,url}=exercise.source;
    const path=url || (file ? `materiales/${encodeURIComponent(file)}` : '');
    return `<p class="source-note">${path ? `<a href="${escape(baseUrl+path.replace(/^\//,'')+(page ? `#page=${page}` : ''))}">` : ''}${escape(file || document)} · Problema ${escape(number || '')}${page ? ` · Página ${escape(page)}` : ''}${path ? '</a>' : ''}</p>`;
  };
  root.classList.add('exercise-list');
  root.innerHTML=exercises.length ? exercises.map((exercise,exerciseIndex)=>`<article data-exercise="${escape(exercise.id)}"><h2>${exercise.source ? `Problema ${escape(exercise.source.number)} · ` : ''}${escape(exercise.title)}</h2>${source(exercise)}<p>${escape(exercise.prompt)}</p><ul class="exercise-givens">${exercise.given.map(value=>`<li>${escape(value)}</li>`).join('')}</ul>${exercise.questions.map((question,questionIndex)=>`<section class="exercise-question" data-exercise-question="${exerciseIndex}/${questionIndex}"><h3>${questionIndex+1}. ${escape(question.prompt)}</h3>${question.grading?.kind !== 'qualitative' && Number.isFinite(question.answer) ? `<form data-exercise-answer><label>Tu respuesta · ${escape(question.unit)}<input type="text" inputmode="decimal" autocomplete="off" required></label><button type="submit" class="text-button"><i data-lucide="check" aria-hidden="true"></i>Comprobar</button><p role="status" data-answer-feedback></p></form>` : ''}<details class="exercise-help"><summary>Ayudas, fórmulas y teoría</summary><p>${escape(question.hint)}</p>${exercise.assumptions.length ? `<h4>Supuestos</h4><ul>${exercise.assumptions.map(value=>`<li>${escape(value)}</li>`).join('')}</ul>` : ''}${lesson ? `<h4>${escape(lesson.title)}</h4>${lesson.formulas.filter(formula=>!formula.optional).map(formula=>`<div class="math">${formatMath(formula.tex)}</div><p>${escape(formula.reading)}. ${escape(formula.meaning)}</p>`).join('')}<p>${escape(lesson.source.document)} · ${escape(lesson.source.section)}</p>` : ''}</details><details data-animated-solution><summary>Resolución animada con narración</summary><div data-exercise-player></div></details><details data-written-solution><summary>Resolución escrita paso a paso</summary><div class="written-solution-tools"><button type="button" class="icon-button" data-open-steps aria-label="Mostrar todos los pasos" title="Mostrar todos los pasos"><i data-lucide="list-checks" aria-hidden="true"></i></button><button type="button" class="icon-button" data-copy-solution aria-label="Copiar resolución" title="Copiar resolución"><i data-lucide="copy" aria-hidden="true"></i></button><p role="status" data-copy-status></p></div><ol class="written-solution-steps">${question.steps.map((step,index)=>`<li><details data-written-step><summary>${index+1}. ${escape(step.title)}</summary><p>${escape(step.explanation)}</p>${step.tex ? `<div class="math">${formatMath(step.tex)}</div>` : ''}</details></li>`).join('')}</ol><details><summary>Interpretación y comprobación</summary><p>${escape(question.answerText || '')}</p><p>${escape(question.interpretation)}</p>${renderExtra(exercise,question)}</details></details></section>`).join('')}</article>`).join('') : '<p class="exercise-empty">No hay problemas del PDF asociados a esta lección.</p>';
  for(const section of Array.from(root.querySelectorAll('[data-exercise-question]'))) {
    const [exerciseIndex,questionIndex]=section.dataset.exerciseQuestion.split('/').map(Number);
    const exercise=exercises[exerciseIndex];
    const question=exercise.questions[questionIndex];
    const animated=section.querySelector('[data-animated-solution]');
    listen(animated,'toggle',()=>{
      if(disposed)return;
      if(!animated.hasAttribute('open')){players.get(animated)?.();players.delete(animated);return;}
      if(players.has(animated))return;
      const animation=exerciseAnimation(exercise,question);
      const track=audio?.lessons?.[animation.id];
      const narrator=track ? undefined : createExerciseSpeech(owner,animation);
      const host=animated.querySelector('[data-exercise-player]');
      players.set(animated,mountAnimation(host,animation,{formatMath,audio:track ? {...track,src:baseUrl+track.src} : undefined,narrator}));
      if(!track && !narrator){const notice=owner.createElement('p');notice.className='animation-audio-error';notice.setAttribute('role','status');notice.textContent='La síntesis de voz española no está disponible en este navegador.';host.prepend(notice);}
      renderIcons();
    });
    const form=section.querySelector('[data-exercise-answer]');
    if(form)listen(form,'submit',event=>{
      event.preventDefault();
      const result=gradeAnswer(question,form.querySelector('input').value);
      const feedback=form.querySelector('[data-answer-feedback]');
      feedback.textContent=result.feedback;
      feedback.className=`feedback ${result.correct ? 'correct' : 'incorrect'}`;
    });
    listen(section.querySelector('[data-open-steps]'),'click',event=>{
      const button=event.currentTarget;
      const steps=Array.from(section.querySelectorAll('[data-written-step]'));
      const open=!steps.every(step=>step.hasAttribute('open'));
      for(const step of steps)if(open)step.setAttribute('open','');else step.removeAttribute('open');
      button.setAttribute('aria-label',open ? 'Ocultar todos los pasos' : 'Mostrar todos los pasos');button.title=button.getAttribute('aria-label');
    });
    listen(section.querySelector('[data-copy-solution]'),'click',async()=>{
      const status=section.querySelector('[data-copy-status]');
      try {
        await owner.defaultView.navigator.clipboard.writeText([question.prompt,...question.steps.map(step=>`${step.title}\n${step.explanation}${step.tex ? `\n${step.tex}` : ''}`),question.answerText,question.interpretation].filter(Boolean).join('\n\n'));
        if(!disposed)status.textContent='Resolución copiada.';
      } catch {if(!disposed)status.textContent='No se pudo acceder al portapapeles. Puedes seleccionar el texto de los pasos.';}
    });
  }
  return ()=>{if(disposed)return;disposed=true;for(const dispose of players.values())dispose();players.clear();listeners.forEach(remove=>remove());root.replaceChildren();};
}