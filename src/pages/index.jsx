import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {ArrowRight, BookOpen, Files} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';
import {CAPSTONE} from '../../pages/inferencia/capstone.js';
import LegacyRoute from '../components/LegacyRoute';

export default function HomePage() {
  return <Layout title="Inferencia estadística" description="Probabilidad, distribuciones y modelos multivariantes con ejemplos de biología.">
    <LegacyRoute />
    <main className="container margin-vert--lg course-home">
      <header className="course-home-intro">
        <h1>Inferencia estadística</h1>
        <p>Un recorrido de estudio desde la probabilidad hasta los modelos multivariantes, con ejemplos de biología. El tema 0 es un puente matemático opcional.</p>
        <div className="course-home-actions">
          <Link className="course-home-access" to="/temario/"><BookOpen size={28} aria-hidden="true" /><span>Temario completo</span><ArrowRight size={22} aria-hidden="true" /></Link>
          <Link className="course-home-access" to="/materiales/"><Files size={28} aria-hidden="true" /><span>Apuntes y materiales</span><ArrowRight size={22} aria-hidden="true" /></Link>
        </div>
      </header>
      <section className="course-home-topics" aria-labelledby="course-topics-heading">
        <h2 id="course-topics-heading">El recorrido</h2>
        <div className="course-topic-grid">
          {COURSE.units.map(unit => <Link className="course-topic" key={unit.id} to={`/lecciones/${unit.lessons[0].id}/`}>
            <span className="unit-number">Tema {unit.number}{unit.number === 0 ? ' · Opcional' : ''}</span>
            <h3>{unit.title}</h3>
            <p>{unit.description}</p>
            <span className="course-topic-entry">{unit.lessons.length} lecciones <ArrowRight size={18} aria-hidden="true" /></span>
          </Link>)}
          <Link className="course-topic" to={`/lecciones/${CAPSTONE.sections[0].id}/`}>
            <span className="unit-number">Tema {CAPSTONE.number}</span>
            <h3>{CAPSTONE.title}</h3><p>{CAPSTONE.description}</p>
            <span className="course-topic-entry">3 ejercicios resueltos <ArrowRight size={18} aria-hidden="true" /></span>
          </Link>
        </div>
      </section>
    </main>
  </Layout>;
}