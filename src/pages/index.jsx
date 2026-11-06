import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {ArrowRight, BookOpen, Circle, CircleCheck} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';
import {progressSummary} from '../../pages/inferencia/progress.js';
import useCourseProgress from '../classroom/useCourseProgress';
import LegacyRoute from '../components/LegacyRoute';

const lessons = COURSE.units.flatMap(unit => unit.lessons);

export default function HomePage() {
  const {progress, warning} = useCourseProgress();
  const summary = progress && progressSummary(progress);
  const lastLesson = lessons.find(lesson => lesson.id === progress?.lastLesson) || lessons[0];
  return <Layout title="Mi progreso" description="Aula de inferencia estadística con ejemplos de biología y seguimiento personal del estudio.">
    <LegacyRoute />
    <main className="container margin-vert--lg progress-page">
      <header className="progress-intro">
        <h1>Inferencia estadística</h1>
        <p>Un recorrido de estudio desde la probabilidad hasta los modelos multivariantes, con ejemplos de biología. El tema 0 es un puente matemático opcional.</p>
        <Link className="progress-curriculum" to="/temario/"><BookOpen size={18} aria-hidden="true" /> Ver temario completo</Link>
      </header>
      <section className="progress-overview" aria-labelledby="progress-heading">
        <div className="progress-heading">
          <h2 id="progress-heading">Mi progreso</h2>
          <Link className="button button--primary progress-continue" to={`/lecciones/${lastLesson.id}/`}><ArrowRight size={18} aria-hidden="true" /><span>Continuar: {lastLesson.title}</span></Link>
        </div>
        <dl className="progress-metrics" aria-busy={!progress}>
          <div><dt>Lecciones estudiadas</dt><dd>{summary ? `${summary.studied} / ${lessons.length}` : '-'}</dd></div>
          <div><dt>Ideas comprobadas</dt><dd>{summary?.checks ?? '-'}</dd></div>
          <div><dt>Respuestas sin ayuda</dt><dd>{summary?.independent ?? '-'}</dd></div>
          <div><dt>Respuestas con ayuda</dt><dd>{summary?.assisted ?? '-'}</dd></div>
        </dl>
        <p className="progress-note">Guardado automáticamente en este navegador, sin cuenta ni sincronización entre dispositivos. La marca «Estudiada» es personal; no certifica el dominio del tema.</p>
        {!progress && <p role="status">Cargando progreso...</p>}
        {warning && <p role="status" className="course-warning">{warning}</p>}
      </section>
      {COURSE.units.map(unit => {
        const studied = unit.lessons.filter(lesson => progress?.studied.includes(lesson.id)).length;
        return <section className="progress-unit" key={unit.id} aria-labelledby={`unit-${unit.id}`}>
          <div className="progress-unit-heading"><span className="unit-number">Tema {unit.number}</span><h2 id={`unit-${unit.id}`}>{unit.title}</h2></div>
          <p className="progress-unit-description">{unit.description}</p>
          <p className="progress-unit-summary">{progress ? `${studied} de ${unit.lessons.length} lecciones estudiadas` : `${unit.lessons.length} lecciones`}{unit.number === 0 ? ' · Apoyo opcional' : ''}</p>
          <ol className="progress-lessons">
            {unit.lessons.map((lesson, index) => {
              const complete = progress?.studied.includes(lesson.id);
              const checked = progress?.checks[lesson.id];
              const Icon = complete || checked ? CircleCheck : Circle;
              return <li key={lesson.id}>
                <Link className={`progress-lesson${complete ? ' is-studied' : ''}`} to={`/lecciones/${lesson.id}/`}>
                  <span className="lesson-index">{unit.number}.{index + 1}</span>
                  <span className="lesson-name">{lesson.title}</span>
                  <span className="lesson-state"><Icon size={18} aria-hidden="true" /><span>{complete ? 'Estudiada' : checked ? 'Idea comprobada' : progress ? 'Pendiente' : '-'}</span></span>
                </Link>
              </li>;
            })}
          </ol>
        </section>;
      })}
    </main>
  </Layout>;
}