import {useEffect, useState} from 'react';
import {COURSE} from '../../pages/inferencia/course.js';
import {STORAGE_KEY, PROGRESS_EVENT, freshProgress, loadProgress, saveProgress} from '../../pages/inferencia/progress.js';

const unavailable = 'Este navegador no permite guardar el progreso. Los cambios no se conservaran al salir.';

function readProgress() {
  try {return loadProgress(window.localStorage, COURSE);}
  catch {return {progress:freshProgress(COURSE), warning:unavailable};}
}

function storeProgress(progress) {
  try {return saveProgress(window.localStorage, progress);}
  catch {return false;}
}

export default function useCourseProgress(lessonId) {
  const [progress, setProgress] = useState(null);
  const [warning, setWarning] = useState('');
  useEffect(() => {
    const refresh = () => {
      const loaded = readProgress();
      setProgress(loaded.progress);
      setWarning(loaded.warning);
    };
    const storageChanged = event => {if (!event.key || event.key === STORAGE_KEY) refresh();};
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', storageChanged);
    window.addEventListener('focus', refresh);
    const loaded = readProgress();
    if (lessonId) {
      loaded.progress.lastLesson = lessonId;
      if (!storeProgress(loaded.progress)) loaded.warning = unavailable;
    }
    setProgress(loaded.progress);
    setWarning(loaded.warning);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener('focus', refresh);
    };
  }, [lessonId]);
  const setStudied = studied => {
    if (!lessonId) return;
    const next = readProgress().progress;
    next.lastLesson = lessonId;
    next.studied = studied ? Array.from(new Set([...next.studied, lessonId])) : next.studied.filter(id => id !== lessonId);
    const saved = storeProgress(next);
    setProgress(next);
    setWarning(saved ? '' : unavailable);
  };
  return {progress, warning, setStudied};
}