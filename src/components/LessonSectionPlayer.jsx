import React from 'react';
import {useLocation} from '@docusaurus/router';
import {Pencil} from 'lucide-react';
import InteractiveLesson from './InteractiveLesson';

export default function LessonSectionPlayer({lessonId, section}) {
  const location = useLocation();
  return <>
    <InteractiveLesson lessonId={lessonId} view="animation" animation={section.animation} />
    {section.exercise && <section className="lesson-worked-example" aria-label="Ejemplo resuelto">
      <h3>Ejemplo resuelto</h3>
      <InteractiveLesson lessonId={lessonId} view="example" example={section.exercise} />
      <a className="lesson-example-link" href={`${location.pathname}?actividad=practice`}>
        <Pencil size={18} aria-hidden="true" />Ejercicios
      </a>
    </section>}
  </>;
}