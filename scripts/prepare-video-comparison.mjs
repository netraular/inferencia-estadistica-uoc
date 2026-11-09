import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const target = new URL('static/comparativa-videos/shared/', root);
const manifest = JSON.parse(await readFile(new URL('static/audio/manifest.json', root)));
const id = 'calculo--franjas';
const track = manifest.lessons[id];
assert.equal(track.cueTiming, 'measured');
assert.equal(track.duration, 39.5);
assert.equal(track.scenes.length, 1);
const cues = track.scenes[0].cues.map(cue => ({...cue, text:cue.text.replace(/\s+/g, ' ').trim()}));
assert.equal(cues.length, 10);
for (const [index, cue] of cues.entries()) {
  assert(cue.start < cue.end && cue.end <= track.duration);
  if (index) assert(cue.start >= cues[index - 1].end);
}
const source = new URL(`static/${track.src}`, root);
const audio = await readFile(source);
const script = {
  id, title:'Probabilidad como area', language:'es', duration:39.5,
  width:1280, height:720, fps:30, frames:1185, cueTiming:'measured',
  audio:'audio.mp3', audioSha256:createHash('sha256').update(audio).digest('hex'),
  cues,
  models:[
    {id:'uniform', start:0, support:[0,2], interval:[0.4,1.2], height:0.5, probability:0.4},
    {id:'increasing', start:22.8, support:[0,2], interval:[0.4,1.2], slope:0.5, probability:0.32},
    {id:'piecewise', start:32, support:[0,2], interval:[0.4,1.2], boundary:1, heights:[0.25,0.75], probability:0.3}
  ]
};
const stamp = seconds => {
  const value = Math.round(seconds * 1000);
  return `00:${String(Math.floor(value / 60000)).padStart(2,'0')}:${String(Math.floor(value / 1000) % 60).padStart(2,'0')}.${String(value % 1000).padStart(3,'0')}`;
};
await mkdir(target, {recursive:true});
await copyFile(source, new URL('audio.mp3', target));
await writeFile(new URL('script.json', target), `${JSON.stringify(script,null,2)}\n`);
await writeFile(new URL('subtitles.vtt', target), `WEBVTT\n\n${cues.map((cue,index)=>`${index+1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`).join('\n')}`);
await copyFile(new URL('data-src/video-comparison/BRIEF.md', root), new URL('BRIEF.md', target));
console.log(`Frozen ${id}: ${script.frames} frames, ${cues.length} measured captions, SHA256 ${script.audioSha256}`);