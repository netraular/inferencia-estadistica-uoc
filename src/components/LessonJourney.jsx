import React, {useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';
import {createLessonSections} from '../../pages/inferencia/lesson-sections.js';
import LessonSectionPlayer from './LessonSectionPlayer';

export default function LessonJourney({lessonId}) {
  const lesson=COURSE.units.flatMap(unit=>unit.lessons).find(item=>item.id===lessonId);
  const sections=lesson ? createLessonSections(lesson) : [];
  const [selected,setSelected]=useState('');
  const index=Math.max(0,sections.findIndex(section=>section.id===selected));
  const section=sections[index];
  if(!section)return null;
  return <section className="lesson-journey" aria-label="Recorrido de la lección">
    <nav className="lesson-section-navigation" aria-label="Apartados de la lección">
      <ol>{sections.map((item,position)=><li key={item.id}><button type="button" aria-current={position===index?'step':undefined} onClick={()=>setSelected(item.id)}><span className="lesson-section-number">{position+1}</span><span>{item.title}{item.optional && <small>Opcional</small>}</span></button></li>)}</ol>
    </nav>
    <section data-lesson-section={section.id} aria-labelledby="lesson-section-title">
      <p className="lesson-section-position">Apartado {index+1} de {sections.length}</p>
      <h2 id="lesson-section-title">{section.title}</h2>
      <LessonSectionPlayer key={`${lessonId}/${section.id}`} lessonId={lessonId} section={section} />
    </section>
    <div className="lesson-section-transport">
      <button type="button" disabled={index===0} onClick={()=>setSelected(sections[index-1].id)}><ChevronLeft size={18} aria-hidden="true" />Apartado anterior</button>
      <button type="button" disabled={index===sections.length-1} onClick={()=>setSelected(sections[index+1].id)}>Siguiente apartado<ChevronRight size={18} aria-hidden="true" /></button>
    </div>
  </section>;
}