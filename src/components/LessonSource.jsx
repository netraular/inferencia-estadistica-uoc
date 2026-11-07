import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {FileText} from 'lucide-react';
import {pdfReference} from '../lib/pdf-pages.js';

export default function LessonSource({lesson}) {
  const materials = useBaseUrl('/materiales/');
  const reference = pdfReference(lesson);
  if (!reference) {
    return <p className="lesson-source"><FileText size={18} aria-hidden="true" /><span>Repaso previo: no corresponde a un apartado de los apuntes.</span></p>;
  }
  const href = `${materials}${encodeURIComponent(reference.file)}${reference.page ? `#page=${reference.page}` : ''}`;
  return <p className="lesson-source">
    <FileText size={18} aria-hidden="true" />
    <span><strong>Apuntes, tema {reference.topic}</strong> · {reference.section}</span>
    <a href={href} target="_blank" rel="noopener">{reference.page ? `Abrir el PDF en la página ${reference.page}` : 'Abrir el PDF'}</a>
  </p>;
}
