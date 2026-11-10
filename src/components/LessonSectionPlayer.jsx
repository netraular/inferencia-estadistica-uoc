import React from 'react';
import {useLocation} from '@docusaurus/router';
import {Pencil} from 'lucide-react';
import InteractiveLesson from './InteractiveLesson';
import ExerciseCollection from './ExerciseCollection';
import LessonVideo from './LessonVideo';

export default function LessonSectionPlayer({lessonId, section, children}) {
  const location = useLocation();
  return <>
    <LessonVideo animation={section.animation} fallback={<InteractiveLesson lessonId={lessonId} view="animation" animation={section.animation} />} />
    {children}
    {section.exercise && <section className="lesson-worked-example" aria-label="Ejemplo resuelto">
      <h3>Ejemplo resuelto</h3>
      <ExerciseCollection lessonId={lessonId} mode="example" descriptor={section.exercise} />
      <a className="lesson-example-link" href={`${location.pathname}?actividad=practice`}>
        <Pencil size={18} aria-hidden="true" />Ejercicios
      </a>
    </section>}
  </>;
}