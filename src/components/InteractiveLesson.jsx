import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import shell from '../generated/aula-shell.json';
import audio from '../../static/audio/manifest.json';

export default function InteractiveLesson({lessonId, view = 'lab'}) {
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
      import('../classroom/embed.mjs'),
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
      mounted = engine.mountEmbeddedClassroom(host.current, {shell, baseUrl, lessonId, view, showNavigation:false, audio, createWhiteboard:whiteboard?.createWhiteboard});
      setReady(true);
    }).catch(failure => {if (active) setError(failure.message);});
    return () => {active = false; mounted?.dispose();};
  }, [lessonId, baseUrl, view]);
  return <section className="course-activities" aria-label="Actividades de la leccion">
    {view === 'animation' && audio.lessons[lessonId]?.cueTiming === 'scene-measured-cues-estimated' && <p className="audio-timing">Audio sincronizado por diapositiva; resaltado de frases aproximado.</p>}
    {!ready && !error && <p role="status">Cargando actividades...</p>}
    {error && <p role="alert">No se pudieron cargar las actividades: {error}. Recarga la pagina para reintentarlo.</p>}
    <div ref={host} />
  </section>;
}