import {useEffect} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {COURSE} from '../../pages/inferencia/course.js';

export default function LegacyRoute() {
  const baseUrl = useBaseUrl('/');
  useEffect(() => {
    const [lessonId, view] = window.location.hash.replace(/^#\/?/, '').split('/');
    if (!COURSE.units.some(unit => unit.lessons.some(lesson => lesson.id === lessonId))) return;
    const activity = view === 'theory' ? 'lesson' : view;
    const query = ['lesson', 'lab', 'practice', 'animation'].includes(activity) ? `?actividad=${activity}` : '';
    window.location.replace(`${baseUrl}lecciones/${lessonId}/${query}`);
  }, [baseUrl]);
  return null;
}