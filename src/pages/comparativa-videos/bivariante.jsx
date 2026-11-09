import React from 'react';
import Layout from '@theme/Layout';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import results from '@site/static/comparativa-videos/bivariante/results.json';
import sources from '@site/static/comparativa-videos/bivariante/sources.json';
import styles from '../../components/VideoComparison.module.css';

const technologies = [{value: 'manim', label: 'Manim'}, {value: 'remotion', label: 'Remotion'}];

export default function BivariateComparisonPage() {
  const media = useBaseUrl('/comparativa-videos/bivariante/');
  return <Layout title="Normal bivariante | Comparativa">
    <main className={`container margin-vert--lg ${styles.page}`}>
      <nav className={styles.back}><Link to="/comparativa-videos/">Comparativa de v&iacute;deos</Link></nav>
      <h1>Del plano conjunto a la cola condicional</h1>
      <p className={styles.subtitle}>Normal bivariante &middot; 75,1 s &middot; Narraci&oacute;n original</p>
      <ul className={styles.list}>
        {technologies.map(({value,label}) => <li key={value}>
          <h2>{label}</h2>
          <video className={styles.player} controls playsInline preload="metadata" poster={`${media}${value}/poster.jpg`}
            aria-label={`Normal bivariante con ${label}`}>
            <source src={`${media}${value}/video.mp4`} type="video/mp4" />
            <a href={`${media}${value}/video.mp4`}>MP4</a>
          </video>
          <nav className={styles.resources} aria-label={`Archivos ${label}`}>
            <a href={`${media}${value}/video.mp4`} download>MP4</a>
            <a href={`${media}${value}/source.tar.gz`} download>Fuentes completas</a>
            <a href={`${media}${value}/REPORT.md`}>Informe</a>
          </nav>
        </li>)}
      </ul>
      <nav className={styles.resources} aria-label="Material com&uacute;n">
        <a href={`${media}shared/BRIEF.md`}>Fragmento seleccionado</a>
        <a href={`${media}shared/script.json`}>Guion y tiempos</a>
        <a href={`${media}README.md`}>Comparaci&oacute;n t&eacute;cnica</a>
      </nav>
      <h2 className="margin-top--lg">C&oacute;digo</h2>
      <Tabs defaultValue="manim" values={technologies} lazy>
        {technologies.map(({value}) => {
          const result = results.find(item=>item.id === value);
          return <TabItem key={value} value={value}>
            <p className={styles.meta}>{result.sceneLines} l&iacute;neas de escena &middot; {result.sceneAndHelperLines} con auxiliares &middot; {result.allCodeLines} incluyendo CSS, exportaci&oacute;n y validaci&oacute;n</p>
            {sources[value].map((file,index) => index === 0 ?
              <CodeBlock key={file.name} language={file.language} title={file.name} showLineNumbers>{file.content}</CodeBlock> :
              <details key={file.name} className="margin-top--md"><summary>{file.name} &middot; {file.lines} l&iacute;neas</summary>
                <CodeBlock language={file.language} title={file.name} showLineNumbers>{file.content}</CodeBlock>
              </details>)}
          </TabItem>;
        })}
      </Tabs>
    </main>
  </Layout>;
}