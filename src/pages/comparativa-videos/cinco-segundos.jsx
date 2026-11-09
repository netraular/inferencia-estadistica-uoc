import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import results from '@site/static/comparativa-videos/cinco-segundos/results.json';
import styles from '../../components/VideoComparison.module.css';

const duration = milliseconds => `${Math.floor(milliseconds / 60000)} min ${new Intl.NumberFormat('es', {maximumFractionDigits: 1}).format(milliseconds % 60000 / 1000)} s`;
const title = id => id === 'manim' ? 'Manim' : 'Remotion';

export default function FiveSecondComparisonPage() {
  const media = useBaseUrl('/comparativa-videos/cinco-segundos/');
  return <Layout title="Probabilidad y complemento | Comparativa">
    <main className={`container margin-vert--lg ${styles.page}`}>
      <nav className={styles.back}><Link to="/comparativa-videos/">Comparativa de v&iacute;deos</Link></nav>
      <h1>Probabilidad y complemento</h1>
      <p className={styles.subtitle}>Dos agentes &middot; 5 s &middot; Sin audio</p>
      <table>
        <thead><tr><th>Motor</th><th>Tarea completa</th><th>Preparaci&oacute;n y comprobaciones</th><th>Render final</th></tr></thead>
        <tbody>{results.map(result => <tr key={result.id}>
          <th>{title(result.id)}</th><td>{duration(result.totalMs)}</td>
          <td>{duration(result.preparationAndChecksMs)}</td><td>{duration(result.finalRenderMs)}</td>
        </tr>)}</tbody>
      </table>
      <p>Manim entreg&oacute; primero. Una interrupci&oacute;n del terminal afect&oacute; al primer render de Remotion; el total incluye ese intento y la espera. Preparaci&oacute;n y comprobaciones no equivale a tiempo puro de programaci&oacute;n.</p>
      <ul className={styles.list}>
        {results.map(result => <li key={result.id}>
          <h2>{title(result.id)}</h2>
          <video className={styles.player} controls playsInline preload="metadata" poster={`${media}${result.id}/poster.jpg`} aria-label={`Probabilidad y complemento con ${title(result.id)}`}>
            <source src={`${media}${result.id}/video.mp4`} type="video/mp4" />
            <a href={`${media}${result.id}/video.mp4`}>MP4</a>
          </video>
          <nav className={styles.resources} aria-label={`Archivos ${title(result.id)}`}>
            <a href={`${media}${result.id}/video.mp4`} download>MP4</a>
            <a href={`${media}${result.id}/timing.json`}>Tiempos</a>
            <a href={`${media}${result.id}/REPORT.md`}>Informe</a>
          </nav>
        </li>)}
      </ul>
    </main>
  </Layout>;
}