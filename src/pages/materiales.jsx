import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {Download, FileText} from 'lucide-react';
import manifest from '@site/static/materiales/manifest.json';

function fileSize(size) {
  const megabytes = size >= 1024 * 1024;
  return `${new Intl.NumberFormat('es', {maximumFractionDigits:1}).format(size / (megabytes ? 1024 * 1024 : 1024))} ${megabytes ? 'MiB' : 'KiB'}`;
}

export default function MaterialsPage() {
  const materialsUrl = useBaseUrl('/materiales/');
  const categories = Array.from(new Set(manifest.documents.map(document => document.category)));
  return <Layout title="Materiales">
    <main className="container margin-vert--lg materials-page">
      <h1>Materiales</h1>
      {categories.map((category, index) => <section key={category} className="materials-section" aria-labelledby={`materials-${index}`}>
        <h2 id={`materials-${index}`}>{category}</h2>
        <ul className="materials-list">
          {manifest.documents.filter(document => document.category === category).map(document => <li key={document.filename}>
            <FileText size={22} aria-hidden="true" />
            <div className="material-details">
              <span className="material-title">{document.title}</span>
              <span className="material-filename">{document.filename}</span>
              <span className="material-size">PDF &middot; {fileSize(document.size)}</span>
            </div>
            <a className="material-download" href={`${materialsUrl}${encodeURIComponent(document.filename)}`} download={document.filename} aria-label={`Descargar ${document.title} (PDF)`}>
              <Download size={18} aria-hidden="true" /><span>Descargar</span>
            </a>
          </li>)}
        </ul>
      </section>)}
    </main>
  </Layout>;
}