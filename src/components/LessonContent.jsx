import React, {useEffect, useRef} from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {useHistory, useLocation} from '@docusaurus/router';
import {BookOpen, CircleCheck, Pencil, Play} from 'lucide-react';
import InteractiveLesson from './InteractiveLesson';
import LessonJourney from './LessonJourney';
import useCourseProgress from '../classroom/useCourseProgress';

const sections = [
  {value:'lesson', title:'Lección', Icon:BookOpen},
  {value:'practice', title:'Ejercicios', Icon:Pencil},
  {value:'animation', title:'Lectura animada', Icon:Play}
];

export default function LessonContent({lessonId, children}) {
  const {progress, warning, setStudied} = useCourseProgress(lessonId);
  const history = useHistory();
  const location = useLocation();
  const notes = useRef(null);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('actividad') !== 'theory' && query.get('actividad') !== 'lab') return;
    query.set('actividad', 'lesson');
    history.replace({...location, search:`?${query}`});
  }, [history, location]);
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
  const values = sections.map(({value, title, Icon}) => ({
    value,
    label:<><Icon size={18} aria-hidden="true" /><span>{title}</span></>,
    attributes:{'data-lesson-view':value}
  }));
  return <>
    <Tabs defaultValue="lesson" queryString="actividad" lazy values={values} className="lesson-navigation">
    <TabItem value="lesson">
      <LessonJourney lessonId={lessonId} />
      <details ref={notes} className="lesson-reference-notes">
        <summary>Apuntes completos y referencias</summary>
        {children}
      </details>
      <section className="lesson-knowledge-check" aria-label="Comprueba la idea">
        <h2>Comprueba la idea</h2>
        <InteractiveLesson lessonId={lessonId} view="theory" />
      </section>
      <div className="lesson-progress">
        <label><input type="checkbox" checked={progress?.studied.includes(lessonId) || false} disabled={!progress} onChange={event => setStudied(event.target.checked)} /><CircleCheck size={18} aria-hidden="true" /> Estudiada</label>
      </div>
      {warning && <p role="status" className="course-warning">{warning}</p>}
    </TabItem>
    {sections.filter(section => section.value !== 'lesson').map(section =>
      <TabItem key={section.value} value={section.value}>
        <InteractiveLesson lessonId={lessonId} view={section.value} />
      </TabItem>
    )}
    </Tabs>
  </>;
}