import React, {useEffect, useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {Download, Upload, Trash2} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';
import {freshProgress, loadProgress, saveProgress, parseProgress, progressSummary} from '../../pages/inferencia/progress.js';

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const file = useRef(null);
  useEffect(() => {
    try {const loaded = loadProgress(window.localStorage, COURSE); setProgress(loaded.progress); setMessage(loaded.warning);}
    catch {setProgress(freshProgress(COURSE)); setMessage('Este navegador no permite guardar progreso.');}
  }, []);
  const summary = progress && progressSummary(progress);
  const exportProgress = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inferencia-progreso.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const importProgress = async event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      if (selected.size > 2000000) throw new Error('La copia supera el limite de 2 MB.');
      const imported = parseProgress(await selected.text(), COURSE);
      if (!saveProgress(window.localStorage, imported)) throw new Error('No se pudo guardar la copia en este navegador.');
      setProgress(imported);
      setMessage('Copia importada correctamente.');
    } catch (failure) {setMessage(failure.message);}
    event.target.value = '';
  };
  const reset = () => {
    const empty = freshProgress(COURSE);
    try {
      if (!saveProgress(window.localStorage, empty)) throw new Error('No se pudo borrar el progreso guardado.');
      setProgress(empty); setConfirm(false); setMessage('Progreso reiniciado.');
    } catch (failure) {setMessage(failure.message);}
  };
  return <Layout title="Mi progreso"><main className="container margin-vert--lg"><h1>Mi progreso</h1>
    <p>Guardado solo en este navegador. Las copias JSON del aula anterior son compatibles. Marcar una leccion como estudiada no certifica dominarla.</p>
    {summary ? <>
      <dl className="progress-metrics"><div><dt>Lecciones estudiadas</dt><dd>{summary.studied} / 36</dd></div><div><dt>Ideas comprobadas</dt><dd>{summary.checks}</dd></div><div><dt>Respuestas sin ayuda</dt><dd>{summary.independent}</dd></div><div><dt>Respuestas con ayuda</dt><dd>{summary.assisted}</dd></div></dl>
      <p><Link className="button button--primary" to={`/lecciones/${progress.lastLesson}/`}>Retomar el recorrido</Link></p>
      <div className="progress-actions"><button className="button button--secondary" onClick={exportProgress}><Download size={18} /> Exportar</button><button className="button button--secondary" onClick={() => file.current.click()}><Upload size={18} /> Importar</button><button className="button button--secondary" onClick={() => setConfirm(true)}><Trash2 size={18} /> Borrar progreso</button><input ref={file} type="file" accept="application/json,.json" onChange={importProgress} hidden /></div>
      {confirm && <div className="margin-vert--md"><p>Se borraran las marcas y el historial de este navegador.</p><button className="button button--danger margin-right--sm" onClick={reset}>Confirmar borrado</button><button className="button button--secondary" onClick={() => setConfirm(false)}>Cancelar</button></div>}
      {COURSE.units.map(unit => <section key={unit.id}><h2>{unit.title}</h2><ul>{unit.lessons.map(lesson => <li key={lesson.id}><Link to={`/lecciones/${lesson.id}/`}>{lesson.title}</Link>{progress.studied.includes(lesson.id) ? ' · Estudiada' : ''}</li>)}</ul></section>)}
    </> : <p role="status">Cargando progreso...</p>}
    <p role="status">{message}</p>
  </main></Layout>;
}