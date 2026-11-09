import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import results from '@site/static/comparativa-videos/shared/results.json';
import styles from './VideoComparison.module.css';

export default function VideoComparisonExample({technology, title}) {
  const source = useBaseUrl(`/comparativa-videos/${technology}/player.html`);
  const media = useBaseUrl(`/comparativa-videos/${technology}/`);
  const report = useBaseUrl(`/comparativa-videos/shared/${technology}-report.md`);
  const example = results.find(item=>item.id===technology);
  return <Layout title={`${title} | Comparativa de videos`}>
    <main className={`container margin-vert--lg ${styles.page}`}>
      <nav className={styles.back}><Link to="/comparativa-videos/">Comparativa de videos</Link></nav>
      <h1>{title}</h1>
      <p className={styles.subtitle}>Probabilidad como area</p>
      <iframe className={styles.player} src={source} title={`Probabilidad como area con ${title}`} allow="fullscreen" allowFullScreen loading="lazy" />
      <p className={styles.meta}>39,5 s &middot; 1280 &times; 720 &middot; 30 fps &middot; {new Intl.NumberFormat('es',{maximumFractionDigits:2}).format(example.bytes/1000000)} MB</p>
      <p className={styles.meta}>{example.versions}</p>
      <nav className={styles.resources} aria-label="Archivos de la creacion">
        <a href={`${media}video.mp4`} download>MP4</a>
        <a href={`${media}source.tar.gz`} download>Codigo fuente</a>
        <a href={report}>Organizacion y verificacion</a>
      </nav>
    </main>
  </Layout>;
}