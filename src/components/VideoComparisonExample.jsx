import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './VideoComparison.module.css';

export default function VideoComparisonExample({technology, title}) {
  const source = useBaseUrl(`/comparativa-videos/${technology}/index.html`);
  return <Layout title={`${title} | Comparativa de videos`}>
    <main className={`container margin-vert--lg ${styles.page}`}>
      <nav className={styles.back}><Link to="/comparativa-videos/">Comparativa de videos</Link></nav>
      <h1>{title}</h1>
      <p className={styles.subtitle}>Probabilidad como area</p>
      <iframe className={styles.player} src={source} title={`Probabilidad como area con ${title}`} allow="fullscreen" allowFullScreen loading="lazy" />
      <p className={styles.meta}>39,5 s &middot; Misma narracion y guion</p>
    </main>
  </Layout>;
}