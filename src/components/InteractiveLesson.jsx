import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import shell from '../generated/aula-shell.json';
import audio from '../../static/audio/manifest.json';
import {COURSE} from '../../pages/inferencia/course.js';

export default function InteractiveLesson({lessonId, view = 'lab', animation, example}) {
  const illustration = view === 'figure' ? COURSE.units.flatMap(unit=>unit.lessons).find(lesson=>lesson.id===lessonId)?.illustration : null;
  const host = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const baseUrl = useBaseUrl('/');
  useEffect(() => {
    let active = true;
    let mounted;
    setReady(false);
    setError('');
    Promise.all([
      view === 'figure' ? import('../../pages/inferencia/labs.js') : import('../classroom/embed.mjs'),
      import('jstat'),
      import('katex'),
      import('../../pages/inferencia/vendor/lucide.min.js'),
      view === 'animation' && ['proporciones', 'algebra', 'funciones', 'calculo', 'regiones-matrices'].includes(lessonId)
        ? import('../classroom/whiteboard.mjs') : Promise.resolve(null)
    ]).then(([engine, stats, math, icons, whiteboard]) => {
      if (!active) return;
      globalThis.jStat = stats.default?.jStat || stats.jStat || stats.default;
      window.katex = math.default || math;
      window.lucide = icons.default || icons;
      if (view === 'example') {
        mounted = engine.mountSectionExample(host.current, {descriptor:example, baseUrl});
      } else if (view === 'figure') {
        const lesson = COURSE.units.flatMap(unit=>unit.lessons).find(item=>item.id===lessonId);
        if (!lesson?.illustration) throw new Error('Esta lección no tiene una ilustración definida');
        mounted = {dispose:engine.mountLab(host.current, lesson.visual, {params:lesson.illustration.params, compact:true})};
      } else {
        mounted = engine.mountEmbeddedClassroom(host.current, {shell, baseUrl, lessonId, view, showNavigation:false, audio, animation, createWhiteboard:whiteboard?.createWhiteboard});
      }
      setReady(true);
    }).catch(failure => {if (active) setError(failure.message);});
    return () => {active = false; mounted?.dispose();};
  }, [lessonId, baseUrl, view, animation?.id, example?.type, example?.seed, example?.questionIds.join('|')]);
  return <section className="course-activities" aria-label={illustration?.title || 'Actividades de la lección'}>
    {illustration && <p>{illustration.question}</p>}
    {view === 'animation' && audio.lessons[animation?.id || lessonId]?.cueTiming === 'scene-measured-cues-estimated' && <p className="audio-timing">Audio sincronizado por diapositiva; resaltado de frases aproximado.</p>}
    {!ready && !error && <p role="status">Cargando actividades...</p>}
    {error && <p role="alert">No se pudieron cargar las actividades: {error}. Recarga la página para reintentarlo.</p>}
    <div ref={host} />
    {illustration && <p>{illustration.explanation}</p>}
  </section>;
}