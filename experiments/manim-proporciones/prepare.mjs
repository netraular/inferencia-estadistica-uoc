import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = new URL('./', import.meta.url);
const id = 'proporciones--parte-y-total';
const manifest = JSON.parse(await readFile(new URL('../../static/audio/manifest.json', root)));
const track = manifest.lessons[id];
assert.equal(track.cueTiming, 'measured');
assert.equal(track.scenes.length, 1);
const cues = track.scenes.flatMap(scene => scene.cues).map(cue => ({
  ...cue, text:cue.text.replace(/\s+/g, ' ').trim()
}));
assert.equal(cues.length, 14);
assert.equal(cues[0].start, 0);
assert.equal(cues.at(-1).end, track.duration);
for (const [index, cue] of cues.entries()) {
  assert(cue.start < cue.end && cue.end <= track.duration);
  if (index) assert(cue.start >= cues[index - 1].end);
}
const phrases = {
  question:'¿Cuál ha germinado mejor?',
  missing_total:'Todavía no podemos contestar.',
  tray_a:'En la primera sembramos setenta y dos.',
  divide:'Una proporción divide la parte entre su propio total.',
  decimal_a:'El cociente es cero coma veinticinco.',
  quarter:'Esa proporción representa una de cada cuatro semillas.',
  tray_b:'En la segunda bandeja sembramos doscientas.',
  decimal_b:'Treinta entre doscientas da cero coma quince.',
  compare:'Hay más germinaciones, pero una proporción menor.',
  scope:'No hemos supuesto que las semillas sean independientes.'
};
const milestones = Object.fromEntries(Object.entries(phrases).map(([name, text]) => {
  const matches = cues.filter(cue => cue.text === text);
  assert.equal(matches.length, 1, `Narration changed at ${name}; review choreography`);
  return [name, matches[0].start];
}));
const audio = await readFile(new URL(`../../static/${track.src}`, root));
const story = {
  id, title:track.title, audioFile:track.src.split('/').at(-1),
  audioSha256:createHash('sha256').update(audio).digest('hex'),
  duration:track.duration, cueTiming:track.cueTiming, milestones, cues
};
const stamp = value => {
  const milliseconds = Math.round(value * 1000);
  return `${String(Math.floor(milliseconds / 3600000)).padStart(2, '0')}:${String(Math.floor(milliseconds / 60000) % 60).padStart(2, '0')}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}.${String(milliseconds % 1000).padStart(3, '0')}`;
};
const vtt = `WEBVTT\n\n${cues.map((cue, index) => `${index + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`).join('\n')}`;
await mkdir(new URL('artifacts/', root), {recursive:true});
await writeFile(new URL('artifacts/story.json', root), `${JSON.stringify(story, null, 2)}\n`);
await writeFile(new URL('artifacts/subtitles.vtt', root), vtt);
console.log(`Prepared ${id}: ${cues.length} measured cues, ${track.duration}s. ${fileURLToPath(new URL('artifacts/', root))}`);