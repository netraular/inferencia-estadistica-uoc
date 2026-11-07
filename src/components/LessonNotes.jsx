import React, {useEffect, useRef} from 'react';
import {useLocation} from '@docusaurus/router';

export function LessonSummary({children}) {
  return <section className="lesson-summary" aria-label="Resumen de la lección">{children}</section>;
}

export function LessonNotes({children}) {
  const location = useLocation();
  const notes = useRef(null);
  useEffect(() => {
    if (!location.hash || !notes.current) return;
    let id = location.hash.slice(1);
    try {id = decodeURIComponent(id);} catch {}
    const target = document.getElementById(id);
    if (target && notes.current.contains(target)) {
      notes.current.open = true;
      target.scrollIntoView({block:'start'});
    }
  }, [location.hash]);
  return <details ref={notes} className="lesson-reference-notes">
    <summary>Apuntes completos: explicación, ejemplos y ampliación</summary>
    {children}
  </details>;
}
