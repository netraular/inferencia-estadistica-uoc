import React, {useEffect} from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {useHistory, useLocation} from '@docusaurus/router';
import {BookOpen, CircleCheck, FlaskConical, Pencil, Play} from 'lucide-react';
import InteractiveLesson from './InteractiveLesson';
import useCourseProgress from '../classroom/useCourseProgress';

const sections = [
  {value:'lesson', title:'Lección', Icon:BookOpen},
  {value:'lab', title:'Laboratorio', Icon:FlaskConical},
  {value:'practice', title:'Ejercicios', Icon:Pencil},
  {value:'animation', title:'Lectura animada', Icon:Play}
];

export default function LessonContent({lessonId, children}) {
  const {progress, warning, setStudied} = useCourseProgress(lessonId);
  const history = useHistory();
  const location = useLocation();
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('actividad') !== 'theory') return;
    query.set('actividad', 'lesson');
    history.replace({...location, search:`?${query}`});
  }, [history, location]);
  const values = sections.map(({value, title, Icon}) => ({
    value,
    label:<><Icon size={18} aria-hidden="true" /><span>{title}</span></>,
    attributes:{'data-lesson-view':value}
  }));
  return <>
    <Tabs defaultValue="lesson" queryString="actividad" lazy values={values} className="lesson-navigation">
    <TabItem value="lesson">
      {children}
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