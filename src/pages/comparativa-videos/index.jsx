import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from '../../components/VideoComparison.module.css';

const examples = [
  ['actual', 'Tecnologia actual', 'Konva + GSAP + MathJax'],
  ['manim', 'Manim Community', 'Python y animacion matematica'],
  ['remotion', 'Remotion', 'React y composicion por fotogramas'],
  ['canvas-commons', 'Canvas Commons', 'TypeScript y escenas con generadores']
];

export default function VideoComparisonPage() {
  const brief = useBaseUrl('/comparativa-videos/shared/BRIEF.md');
  const captions = useBaseUrl('/comparativa-videos/shared/subtitles.vtt');
  return <Layout title="Comparativa de videos">
    <main className={`container margin-vert--lg ${styles.page}`}>
      <h1>Comparativa de videos</h1>
      <p className={styles.subtitle}>Probabilidad como area</p>
      <ul className={styles.list}>
        {examples.map(([id, title, detail]) => <li key={id}>
          <h2><Link to={`/comparativa-videos/${id}/`}>{title}</Link></h2>
          <p>{detail}</p>
        </li>)}
      </ul>
      <nav className={styles.resources} aria-label="Material comun">
        <a href={brief}>Guion comun</a><a href={captions}>Subtitulos</a>
      </nav>
    </main>
  </Layout>;
}