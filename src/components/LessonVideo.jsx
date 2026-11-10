import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import videos from '../../static/videos/manifest.json';
import audio from '../../static/audio/manifest.json';
import {compatibleCourseVideo, courseMediaUrl} from '../../pages/inferencia/exercise-solutions.js';
import styles from './LessonVideo.module.css';

export default function LessonVideo({animation, fallback}) {
  const baseUrl = useBaseUrl('/');
  const video = videos.lessons?.[animation?.id];
  const recording = audio.lessons?.[animation?.id];
  if (!compatibleCourseVideo(animation, recording, video)) return fallback;
  const identity = JSON.stringify([animation.id, video, recording, baseUrl]);
  return <NativeLessonVideo key={identity} video={video} recording={recording} baseUrl={baseUrl} fallback={fallback} />;
}

function NativeLessonVideo({video, recording, baseUrl, fallback}) {
  const [failed, setFailed] = useState(false);
  const media = useRef(null);
  useEffect(() => {
    const player = media.current;
    if (!player) return;
    const source = player.querySelector('source');
    if (source && !source.hasAttribute('src')) {
      source.setAttribute('src', courseMediaUrl(baseUrl, video.src));
      player.load();
    }
    const owner = player.ownerDocument;
    const onHidden = () => {if (owner.hidden) player.pause();};
    owner.addEventListener('visibilitychange', onHidden);
    return () => {
      owner.removeEventListener('visibilitychange', onHidden);
      player.pause();
      player.querySelector('source')?.removeAttribute('src');
      player.removeAttribute('src');
      player.load();
    };
  }, [failed, baseUrl, video.src]);
  if (failed) return fallback;
  const cues = recording.scenes.flatMap(scene => scene.cues);
  return <section className={styles.lesson} aria-label={video.title}>
    <video ref={media} className={styles.player} controls playsInline preload="metadata" poster={courseMediaUrl(baseUrl, video.poster)} aria-label={video.title} onError={() => setFailed(true)}>
      <source src={courseMediaUrl(baseUrl, video.src)} type="video/mp4" onError={() => setFailed(true)} />
    </video>
    <details className={styles.transcript}>
      <summary>{'Transcripci\u00f3n'}</summary>
      {cues.map((cue, index) => <p key={index}>{cue.text}</p>)}
    </details>
  </section>;
}