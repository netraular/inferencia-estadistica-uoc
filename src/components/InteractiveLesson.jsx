import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import shell from '../generated/aula-shell.json';

export default function InteractiveLesson({lessonId}) {
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
      import('../../pages/inferencia/vendor/lucide.min.js')
    ]).then(([engine, stats, math, icons]) => {
      if (!active) return;
      globalThis.jStat = stats.default?.jStat || stats.jStat || stats.default;
      window.katex = math.default || math;
      window.lucide = icons.default || icons;
      const requested = new URLSearchParams(window.location.search).get('actividad');
      const view = ['theory', 'lab', 'practice', 'animation'].includes(requested) ? requested : 'lab';
      mounted = engine.mountEmbeddedClassroom(host.current, {shell, baseUrl, lessonId, view});
      setReady(true);
    }).catch(failure => {if (active) setError(failure.message);});
    return () => {active = false; mounted?.dispose();};
  }, [lessonId, baseUrl]);
  return <section className="course-activities" aria-label="Actividades de la leccion">
    {!ready && !error && <p role="status">Cargando actividades...</p>}
    {error && <p role="alert">No se pudieron cargar las actividades: {error}. Recarga la pagina para reintentarlo.</p>}
    <div ref={host} />
  </section>;
}