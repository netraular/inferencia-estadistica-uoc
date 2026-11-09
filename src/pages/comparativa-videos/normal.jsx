import React from 'react';
import Layout from '@theme/Layout';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import results from '@site/static/comparativa-videos/normal/results.json';
import sources from '@site/static/comparativa-videos/normal/sources.json';
import styles from '../../components/VideoComparison.module.css';

const technologies = [{value: 'manim', label: 'Manim'}, {value: 'remotion', label: 'Remotion'}];

function SourceFile({file}) {
  return <CodeBlock language={file.language} title={file.name} showLineNumbers>{file.content}</CodeBlock>;
}

export default function NormalComparisonPage() {
  const media = useBaseUrl('/comparativa-videos/normal/');
  return <Layout title="La normal: de X a Z | Comparativa">
    <main className={`container margin-vert--lg ${styles.page}`}>
      <nav className={styles.back}><Link to="/comparativa-videos/">Comparativa de v&iacute;deos</Link></nav>
      <h1>La normal: de X a Z</h1>
      <p className={styles.subtitle}>Estandarizaci&oacute;n y probabilidades</p>
      <Tabs defaultValue="manim" values={technologies} lazy>
        {technologies.map(({value, label}) => {
          const result = results.find(item => item.id === value);
          const [scene, ...helpers] = sources[value];
          return <TabItem key={value} value={value}>
            <video className={styles.player} controls playsInline preload="metadata" poster={`${media}${value}/poster.jpg`}
              aria-label={`La normal: de X a Z con ${label}`}>
              <source src={`${media}${value}/video.mp4`} type="video/mp4" />
              <a href={`${media}${value}/video.mp4`}>Video MP4</a>
            </video>
            <p className={styles.meta}>48 s &middot; 1280 &times; 720 &middot; 30 fps &middot; Sin audio &middot; {new Intl.NumberFormat('es', {maximumFractionDigits: 2}).format(result.bytes / 1000000)} MB</p>
            <nav className={styles.resources} aria-label="Archivos del ejemplo">
              <a href={`${media}${value}/video.mp4`} download>MP4</a>
              <a href={`${media}source.tar.gz`} download>C&oacute;digo fuente</a>
              <a href={`${media}README.md`}>Comparaci&oacute;n t&eacute;cnica</a>
            </nav>
            <h2 className="margin-top--lg">C&oacute;digo de la escena</h2>
            <p className={styles.meta}>{result.sceneLines} l&iacute;neas de escena &middot; {result.sourceLines} con auxiliares &middot; CSS y renderizador aparte</p>
            <SourceFile file={scene} />
            {helpers.map(file => <details key={file.name} className="margin-top--md">
              <summary>{file.name}</summary><SourceFile file={file} />
            </details>)}
          </TabItem>;
        })}
      </Tabs>
      <h2 className="margin-top--lg">Guion y renderizado compartidos</h2>
      {sources.shared.map(file => <details key={file.name} className="margin-top--md">
        <summary>{file.name}</summary><SourceFile file={file} />
      </details>)}
    </main>
  </Layout>;
}