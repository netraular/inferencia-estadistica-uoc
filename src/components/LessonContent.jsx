import React, {useEffect} from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {useHistory, useLocation} from '@docusaurus/router';
import {BookOpen, Pencil, Play} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';
import InteractiveLesson from './InteractiveLesson';
import LessonJourney from './LessonJourney';
import LessonSource from './LessonSource';
import ExerciseCollection from './ExerciseCollection';

const sections = [
  {value:'lesson', title:'Lección', Icon:BookOpen},
  {value:'practice', title:'Ejercicios', Icon:Pencil},
  {value:'animation', title:'Repaso animado', Icon:Play}
];

export default function LessonContent({lessonId, children}) {
  const history = useHistory();
  const location = useLocation();
  const lesson = COURSE.units.flatMap(unit => unit.lessons).find(item => item.id === lessonId);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('actividad') !== 'theory' && query.get('actividad') !== 'lab') return;
    query.set('actividad', 'lesson');
    history.replace({...location, search:`?${query}`});
  }, [history, location]);
  const values = sections.map(({value, title, Icon}) => ({
    value,
    label:<><Icon size={18} aria-hidden="true" /><span>{title}</span></>,
    attributes:{'data-lesson-view':value}
  }));
  return <>
    <LessonSource lesson={lesson} />
    <Tabs defaultValue="lesson" queryString="actividad" lazy values={values} className="lesson-navigation">
    <TabItem value="lesson">
      <LessonJourney lessonId={lessonId}>
        {children}
        <section className="lesson-practice" aria-label="Práctica de la lección">
          <h2>Práctica de la lección</h2>
          <ExerciseCollection lessonId={lessonId} mode="practice" />
        </section>
        <section className="lesson-knowledge-check" aria-label="Comprueba la idea">
          <h2>Comprueba la idea</h2>
          <InteractiveLesson lessonId={lessonId} view="theory" />
        </section>
      </LessonJourney>
    </TabItem>
    {sections.filter(section => section.value !== 'lesson').map(section =>
      <TabItem key={section.value} value={section.value}>
        {section.value === 'practice' ? <ExerciseCollection lessonId={lessonId} /> : <InteractiveLesson lessonId={lessonId} view={section.value} />}
      </TabItem>
    )}
    </Tabs>
  </>;
}
