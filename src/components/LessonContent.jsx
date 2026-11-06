import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {BookOpen, CircleCheck, FlaskConical, Pencil, Play} from 'lucide-react';
import InteractiveLesson from './InteractiveLesson';

const sections = [
  {value:'lesson', title:'Lección', Icon:BookOpen},
  {value:'theory', title:'Comprueba la idea', Icon:CircleCheck},
  {value:'lab', title:'Laboratorio', Icon:FlaskConical},
  {value:'practice', title:'Ejercicios', Icon:Pencil},
  {value:'animation', title:'Lectura animada', Icon:Play}
];

export default function LessonContent({lessonId, children}) {
  const values = sections.map(({value, title, Icon}) => ({
    value,
    label:<><Icon size={18} aria-hidden="true" /><span>{title}</span></>,
    attributes:{'data-lesson-view':value}
  }));
  return <Tabs defaultValue="lesson" queryString="actividad" lazy values={values} className="lesson-navigation">
    <TabItem value="lesson">{children}</TabItem>
    {sections.filter(section => section.value !== 'lesson').map(section =>
      <TabItem key={section.value} value={section.value}>
        <InteractiveLesson lessonId={lessonId} view={section.value} />
      </TabItem>
    )}
  </Tabs>;
}