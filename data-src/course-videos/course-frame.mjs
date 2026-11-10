export const VIDEO = Object.freeze({fps:30, width:1280, height:720});

export function courseTimeline(storyboard) {
  return storyboard.narrationMode === 'transcript' ? storyboard.transcript : storyboard.audio;
}

export function courseFrame(storyboard, frame) {
  const seconds = Math.max(0, Math.min(storyboard.frames - 1, frame)) / storyboard.fps;
  const timeline = courseTimeline(storyboard);
  let index = 0;
  for (const [position, scene] of timeline.scenes.entries()) if (seconds >= scene.start) index = position;
  const scene = timeline.scenes[index];
  let cueIndex = -1;
  for (const [position, cue] of scene.cues.entries()) if (seconds >= cue.start) cueIndex = position;
  const cue = scene.cues[cueIndex];
  const origin = cue?.start ?? scene.start;
  const end = cue?.end ?? scene.cues[0].start;
  return {index, step:(storyboard.animation ?? storyboard.item.animation).steps[index], cueIndex,
    progress:Math.max(0, Math.min(1, (seconds - origin) / Math.max(1 / storyboard.fps, Math.min(0.65, end - origin)))),
    caption:cue && seconds < cue.end ? cue.text : '', reducedMotion:false};
}

export function sampleFrames(storyboard) {
  return [...new Set([0, ...courseTimeline(storyboard).scenes.flatMap(scene => scene.cues.map(cue => Math.min(storyboard.frames - 1, Math.floor((cue.start + Math.min(cue.end, cue.start + 1.4)) / 2 * storyboard.fps)))), storyboard.frames - 1])];
}

export function authoredSceneContent(state, lines = state.step.visual?.lines || []) {
  const meaningful = line => [line.value, line.tex].some(value => typeof value === 'string' && value.trim());
  const visible = lines.filter(line => (!Number.isInteger(line.cue) || line.cue <= state.cueIndex) && meaningful(line));
  const cues = state.step.cues;
  const opening = !visible.length && state.index === 0 && state.cueIndex >= -1 && state.cueIndex <= 0
    && (cues?.[0]?.text ?? cues?.[0]) === 'Vamos a resolver este apartado juntos.'
    && Boolean((cues?.[1]?.text ?? cues?.[1])?.trim())
    && (state.step.visual?.lines || []).some(line => line.cue === Math.max(0, state.cueIndex + 1) && meaningful(line));
  return {lines:visible, opening};
}

export function representativeFrame(layout) {
  const visible = layout.filter(entry => entry.cue >= 0 && !entry.errors.length && ((entry.diagram && entry.marks > 0) || entry.authored?.some(line => line.inkPixels > 0 && (line.tex ? line.equationPaths > 0 : line.value?.trim()))));
  if (!visible.length) throw new Error('No representative cue with visible authored context');
  const last = visible.at(-1);
  return visible.find(entry => entry.scene === last.scene && entry.cue === last.cue).frame;
}