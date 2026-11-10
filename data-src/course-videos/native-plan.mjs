export const cueText = cue => typeof cue === 'string' ? cue : cue.text;
export const cueTexts = step => step.cues.map(cueText);

export function visibleLines(step, cueIndex) {
  return (step.visual?.lines || step.sourceLines || []).filter(line => !Number.isInteger(line.cue) || line.cue <= cueIndex);
}

export function findCue(step, fragment, {required = false} = {}) {
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const index = cueTexts(step).findIndex(text => normalize(text).includes(normalize(fragment)));
  if (required && index < 0) throw new RangeError(`Missing narration anchor: ${fragment}`);
  return index;
}

export function makeNativePlan(item, domain, describeScene) {
  if (!item.id || !item.canonicalSha256 || !item.animation?.steps?.length) throw new TypeError('Missing frozen narration');
  const scenes = item.animation.steps.map((step, index) => {
    const texts = cueTexts(step);
    const description = describeScene({item, step, index, cues:texts});
    if (!description?.family || description.beats?.length !== texts.length) throw new RangeError(`${item.id}/${index}: incomplete native scene`);
    const {beats, ...details} = description;
    const cues = texts.map((text, cueIndex) => {
      const beat = beats[cueIndex];
      if (!text?.trim() || !beat?.action) throw new RangeError(`${item.id}/${index}/${cueIndex}: missing visual action`);
      return {...beat, text};
    });
    return {...details, title:step.title, cues, sourceLines:structuredClone(step.visual?.lines || []), context:structuredClone(step.visual?.context || null)};
  });
  return {version:1, id:item.id, domain, canonicalSha256:item.canonicalSha256, scenes};
}

export function validateNativePlan(item, plan) {
  if (plan?.id !== item.id || plan.canonicalSha256 !== item.canonicalSha256 || plan.scenes?.length !== item.animation.steps.length) throw new RangeError(`${item.id}: incompatible native scene plan`);
  for (const [index, scene] of plan.scenes.entries()) {
    const texts = cueTexts(item.animation.steps[index]);
    if (!scene.family || scene.cues?.length !== texts.length) throw new RangeError(`${item.id}/${index}: incomplete native scene`);
    for (const [cueIndex, cue] of scene.cues.entries()) {
      if (cue.text !== texts[cueIndex] || !cue.action) throw new RangeError(`${item.id}/${index}/${cueIndex}: stale native visual action`);
    }
  }
  return plan;
}