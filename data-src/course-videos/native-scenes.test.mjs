import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createNativePlan} from './native-scenes.mjs';
import {validateNativePlan} from './native-plan.mjs';
import {nativeLayoutErrors} from './native-layout.mjs';

test('native scenes reject unowned topics instead of falling back to a whiteboard', () => {
  assert.throws(() => createNativePlan({id:'missing', kind:'section', animation:{steps:[]}}), /exactly one native scene/);
});

test('native scene plans retain every frozen narration cue and canonical identity', {skip:!process.env.COURSE_VIDEO_CATALOGUE}, () => {
  const source = process.env.COURSE_VIDEO_CATALOGUE;
  const catalogue = JSON.parse(fs.readFileSync(source, 'utf8'));
  const counts = {};
  for (const item of catalogue.items) {
    const plan = createNativePlan(item);
    assert.equal(validateNativePlan(item, plan), plan);
    counts[item.kind] = (counts[item.kind] || 0) + 1;
    const changed = structuredClone(item);
    const cue = changed.animation.steps[0].cues[0];
    if (typeof cue === 'string') changed.animation.steps[0].cues[0] += ' changed';
    else cue.text += ' changed';
    assert.throws(() => validateNativePlan(changed, plan), /stale native visual action/);
  }
  assert.deepEqual(counts, {section:118, recap:36, exercise:387});
});

test('native audit rejects clipped text, overlapping labels and overflowing paragraphs', () => {
  const first = {name:'text',kind:'label',text:'Title',x:70,y:40,width:220,height:24};
  assert.deepEqual(nativeLayoutErrors([first], []), []);
  const second = {...first,text:'8 / 4 = 2',x:100,y:48};
  assert.match(nativeLayoutErrors([first,second], []).join(' '), /Overlapping native labels/);
  assert.deepEqual(nativeLayoutErrors([first,{...second,y:90}], []), []);
  const clipped = {...first,clips:[{name:'svg',x:60,y:40,width:300,height:12}]};
  assert.match(nativeLayoutErrors([clipped], []).join(' '), /text clipped by svg/);
  assert.match(nativeLayoutErrors([], [{name:'explanation',scrollWidth:350,clientWidth:350,scrollHeight:120,clientHeight:98}]).join(' '), /explanation: text overflow/);
  assert.match(nativeLayoutErrors([{...first,x:1190}], []).join(' '), /outside native stage/);
});