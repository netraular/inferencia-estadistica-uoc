import {useEffect, useState} from 'react';
import {COURSE} from '../../pages/inferencia/course.js';
import {STORAGE_KEY, PROGRESS_EVENT, freshProgress, loadProgress, saveProgress} from '../../pages/inferencia/progress.js';

const unavailable = 'Este navegador no permite guardar el progreso. Los cambios no se conservaran al salir.';
let sessionProgress = null;
let pendingSave = false;
const pendingStudied = new Map();

function readProgress() {
  let loaded;
  try {loaded = loadProgress(window.localStorage, COURSE);}
  catch {loaded = {progress:freshProgress(COURSE), warning:unavailable};}
  if (pendingSave && sessionProgress && !loaded.warning) {
    const studied = new Set(loaded.progress.studied);
    pendingStudied.forEach((marked, lessonId) => {
      if (marked) studied.add(lessonId);
      else studied.delete(lessonId);
    });
    sessionProgress = {...loaded.progress, studied:Array.from(studied), lastLesson:sessionProgress.lastLesson};
    return {progress:sessionProgress, warning:unavailable};
  }
  if ((loaded.warning || pendingSave) && sessionProgress) return {progress:sessionProgress, warning:unavailable};
  sessionProgress = loaded.progress;
  return loaded;
}

function storeProgress(progress) {
  sessionProgress = progress;
  pendingSave = false;
  try {
    const saved = saveProgress(window.localStorage, progress);
    pendingSave = !saved;
    if (saved) pendingStudied.clear();
    return saved;
  } catch {
    pendingSave = true;
    return false;
  }
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
    const current = readProgress().progress;
    const next = {...current, lastLesson:lessonId, studied:studied ? Array.from(new Set([...current.studied, lessonId])) : current.studied.filter(id => id !== lessonId)};
    pendingStudied.set(lessonId, Boolean(studied));
    const saved = storeProgress(next);
    setProgress(next);
    setWarning(saved ? '' : unavailable);
  };
  return {progress, warning, setStudied};
}