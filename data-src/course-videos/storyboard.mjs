import assert from 'node:assert/strict';

export const VIDEO_ID = 'proporciones--parte-y-total';
export const FPS = 30;
export const trays = Object.freeze([
  Object.freeze({id: 'A', germinated: 18, total: 72, columns: 12}),
  Object.freeze({id: 'B', germinated: 30, total: 200, columns: 20}),
]);

const eventCues = {
  question: 1,
  insufficient: 2,
  firstTotal: 3,
  partAndTotal: 4,
  definition: 5,
  firstFraction: 6,
  firstResult: 7,
  quarter: 8,
  secondTotal: 9,
  secondResult: 10,
  comparison: 11,
  independence: 12,
  conclusion: 13,
};

export function createStoryboard(track) {
  assert.equal(track.cueTiming, 'measured');
  assert.equal(track.parentLesson, 'proporciones');
  const cues = track.scenes.flatMap(scene => scene.cues);
  assert.equal(cues.length, 14);
  let previousEnd = 0;
  for (const cue of cues) {
    assert.ok(cue.start >= previousEnd && cue.end > cue.start);
    assert.ok(cue.end <= track.duration);
    previousEnd = cue.end;
  }
  assert.equal(previousEnd, track.duration);
  return {
    id: VIDEO_ID,
    title: track.title,
    fps: FPS,
    width: 1280,
    height: 720,
    duration: track.duration,
    frames: Math.round(track.duration * FPS),
    cues,
    events: Object.fromEntries(Object.entries(eventCues).map(([name, index]) => [name, cues[index].start])),
    trays,
  };
}