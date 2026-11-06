import {useEffect} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {COURSE} from '../../pages/inferencia/course.js';

export default function LegacyRoute() {
  const baseUrl = useBaseUrl('/');
  useEffect(() => {
    const [lessonId, view] = window.location.hash.replace(/^#\/?/, '').split('/');
    if (!COURSE.units.some(unit => unit.lessons.some(lesson => lesson.id === lessonId))) return;
    const query = ['theory', 'lab', 'practice', 'animation'].includes(view) ? `?actividad=${view}` : '';
    window.location.replace(`${baseUrl}lecciones/${lessonId}/${query}`);
  }, [baseUrl]);
  return null;
}