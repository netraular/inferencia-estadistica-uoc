import React, {useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import videos from '../../static/videos/manifest.json';
import audio from '../../static/audio/manifest.json';
import styles from './LessonVideo.module.css';

export default function LessonVideo({animation, fallback}) {
  const [failed, setFailed] = useState(false);
  const baseUrl = useBaseUrl('/');
  const video = videos.lessons[animation.id];
  if (!video || failed) return fallback;
  const cues = audio.lessons[animation.id]?.scenes.flatMap(scene => scene.cues) || [];
  return <section className={styles.lesson} aria-label={video.title}>
    <video key={video.src} className={styles.player} controls playsInline preload="metadata" poster={`${baseUrl}${video.poster}`} aria-label={video.title} onError={() => setFailed(true)}>
      <source src={`${baseUrl}${video.src}`} type="video/mp4" onError={() => setFailed(true)} />
    </video>
    <details className={styles.transcript}>
      <summary>{'Transcripci\u00f3n'}</summary>
      {cues.map(cue => <p key={cue.start}>{cue.text}</p>)}
    </details>
  </section>;
}