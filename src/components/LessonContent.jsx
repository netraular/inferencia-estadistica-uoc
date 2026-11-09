import React, {useEffect} from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {useHistory, useLocation} from '@docusaurus/router';
import {BookOpen, Pencil, List} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';
import InteractiveLesson from './InteractiveLesson';
import LessonJourney from './LessonJourney';
import LessonSource from './LessonSource';
import {LessonSummary, LessonSectionNotes} from './LessonNotes';
import ExerciseCollection from './ExerciseCollection';

const sections = [
  {value:'lesson', title:'Lección', Icon:BookOpen},
  {value:'practice', title:'Ejercicios', Icon:Pencil},
  {value:'summary', title:'Resumen', Icon:List}
];

function containsAnchor(children, id) {
  return React.Children.toArray(children).some(child => React.isValidElement(child) &&
    (child.props.id === id || containsAnchor(child.props.children, id)));
}

export default function LessonContent({lessonId, children}) {
  const history = useHistory();
  const location = useLocation();
  const lesson = COURSE.units.flatMap(unit => unit.lessons).find(item => item.id === lessonId);
  const content = React.Children.toArray(children);
  const summary = content.filter(item => React.isValidElement(item) && item.type === LessonSummary);
  const notes = content.filter(item => React.isValidElement(item) && item.type === LessonSectionNotes);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const activity = query.get('actividad');
    if (!['theory', 'lab', 'animation'].includes(activity)) return;
    query.set('actividad', activity === 'animation' ? 'summary' : 'lesson');
    history.replace({...location, search:`?${query}`});
  }, [history, location]);
  useEffect(() => {
    if (!location.hash) return;
    let id = location.hash.slice(1);
    try {id = decodeURIComponent(id);} catch {}
    if (!containsAnchor(summary, id)) return;
    const query = new URLSearchParams(location.search);
    if (query.get('actividad') === 'summary') return;
    query.set('actividad', 'summary');
    history.replace({...location, search:`?${query}`});
  }, [history, location.hash, lessonId]);
  useEffect(() => {
    if (!location.hash) return;
    let id = location.hash.slice(1);
    try {id = decodeURIComponent(id);} catch {}
    const target = document.getElementById(id);
    if (target?.closest('.lesson-summary')) target.scrollIntoView({block:'start'});
  }, [location.hash, location.search]);
  const values = sections.map(({value, title, Icon}) => ({
    value,
    label:<><Icon size={18} aria-hidden="true" /><span>{title}</span></>,
    attributes:{'data-lesson-view':value}
  }));
  return <>
    <LessonSource lesson={lesson} />
    <Tabs defaultValue="lesson" queryString="actividad" lazy values={values} className="lesson-navigation">
    <TabItem value="lesson">
      <section className="lesson-objectives" aria-label="Objetivos de la lección">
        <h2>Objetivos de la lección</h2>
        <ul>{lesson.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul>
      </section>
      <LessonJourney lessonId={lessonId}>
        {notes}
      </LessonJourney>
    </TabItem>
    <TabItem value="practice">
      <section className="lesson-practice" aria-label="Práctica de la lección">
        <h2>Práctica de la lección</h2>
        <ExerciseCollection lessonId={lessonId} mode="practice" />
      </section>
      <h2>Ejercicios de los apuntes</h2>
      <ExerciseCollection lessonId={lessonId} />
    </TabItem>
    <TabItem value="summary">
      {summary}
      <h2>Repaso animado</h2>
      <InteractiveLesson lessonId={lessonId} view="animation" />
    </TabItem>
    </Tabs>
  </>;
}
