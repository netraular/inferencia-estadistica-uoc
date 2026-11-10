import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {COURSE} from '../../pages/inferencia/course.js';
import audio from '../../static/audio/exercises-manifest.json';
import videos from '../../static/videos/manifest.json';

export default function ExerciseCollection({lessonId, mode='pdf', descriptor, exerciseId, renderExtra, extraStyles=''}) {
  const host=useRef(null);
  const [error,setError]=useState('');
  const [ready,setReady]=useState(false);
  const baseUrl=useBaseUrl('/');
  useEffect(()=>{
    let active=true;
    let dispose;
    setReady(false);setError('');
    Promise.all([
      import('../../pages/inferencia/exercise-solutions.js'),
      import('../../pages/inferencia/pdf-exercises.js'),
      import('../../pages/inferencia/capstone.js'),
      import('../../pages/inferencia/exercises.js'),
      import('../classroom/embed.mjs'),
      import('../classroom/whiteboard.mjs'),
      import('jstat'),import('katex'),import('../../pages/inferencia/vendor/lucide.min.js')
    ]).then(([engine,pdf,capstone,generators,embed,whiteboard,stats,math,icons])=>{
      if(!active)return;
      globalThis.jStat=stats.default?.jStat || stats.jStat || stats.default;
      const library=math.default || math;
      const lesson=COURSE.units.flatMap(unit=>unit.lessons).find(item=>item.id===lessonId);
      let exercises;
      if(exerciseId)exercises=capstone.getCapstoneExercises().filter(exercise=>exercise.id===exerciseId);
      else if(descriptor){
        const exercise=generators.generateExercise(descriptor.type,descriptor.seed);
        exercises=[{...exercise,id:`ejemplo-${lessonId}-${descriptor.type}-${descriptor.seed}`,questions:exercise.questions.filter(question=>descriptor.questionIds.includes(question.id))}];
      } else exercises=mode === 'pdf' ? pdf.getPdfExercises(lessonId) : engine.lessonPractice(lesson);
      const owner=host.current.ownerDocument;
      const root=host.current.shadowRoot || host.current.attachShadow({mode:'open'});
      const content=owner.createElement('div');
      if(exerciseId)content.className='capstone';
      const style=owner.createElement('style');
      style.textContent=":host{display:block;font:17px/1.55 Atkinson,'Trebuchet MS',sans-serif;color:#253330;--paper:#fff;--bg:#f6f9f8;--ink:#253330;--muted:#63716c;--line:#dae3df;--teal:#117568;--teal-soft:#e8f3ef;--rose:#a93458;--rose-soft:#fbecf0;--gold:#d7a534;--gold-soft:#fff7dd}";
      style.textContent+=extraStyles;
      const links=['aula.css','katex/katex.min.css'].map(path=>{const link=owner.createElement('link');link.rel='stylesheet';link.href=baseUrl+path;return link;});
      root.replaceChildren(...links,style,content);
      dispose=()=>root.replaceChildren();
      const cleanup=engine.mountExercises(content,{exercises,lessonId,baseUrl,audio,videos,createWhiteboard:whiteboard.createWhiteboard,formatMath:tex=>library.renderToString(tex,{displayMode:true,throwOnError:false,trust:false}),renderExtra,renderIcons:()=>embed.renderScopedIcons(root,icons.default || icons)});
      dispose=()=>{cleanup();root.replaceChildren();};
      embed.renderScopedIcons(root,icons.default || icons);
      setReady(true);
    }).catch(failure=>{dispose?.();if(active)setError(failure.message);});
    return ()=>{active=false;dispose?.();};
  },[lessonId,mode,exerciseId,baseUrl,descriptor?.type,descriptor?.seed,descriptor?.questionIds.join('|'),renderExtra,extraStyles]);
  return <section className="course-exercises" aria-label={mode === 'pdf' ? 'Problemas del PDF' : 'Práctica de la lección'}>
    {!ready && !error && <p role="status">Cargando ejercicios...</p>}
    {error && <p role="alert">No se pudieron cargar los ejercicios: {error}.</p>}
    <div ref={host} />
  </section>;
}