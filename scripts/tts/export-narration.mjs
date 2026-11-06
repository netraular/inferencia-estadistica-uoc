import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export async function exportNarration(output, {source = projectRoot, sections = false} = {}) {
  source = resolve(source);
  const {COURSE} = await import(pathToFileURL(join(source, 'pages/inferencia/course.js')).href);
  const course = {
    title: COURSE.title,
    units: COURSE.units.map(unit => ({
      id: unit.id, number: unit.number, title: unit.title,
      lessons: unit.lessons.map(lesson => ({id: lesson.id, title: lesson.title}))
    }))
  };
  if (!sections) {
    const {exportLectures} = await import(pathToFileURL(join(source, 'data-src/inferencia-estadistica/export-lecturas.mjs')).href);
    return {...exportLectures(output), course};
  }
  const {createLessonSections} = await import(pathToFileURL(join(source, 'pages/inferencia/lesson-sections.js')).href);
  const {animationDuration, buildVtt} = await import(pathToFileURL(join(source, 'pages/inferencia/animations.js')).href);
  const destination = resolve(output || join(source, 'data-src/inferencia-estadistica/_work/lecturas-secciones'));
  const lectures = [];
  course.units.forEach((unit, unitIndex) => {
    unit.lessons = COURSE.units[unitIndex].lessons.flatMap(lesson => createLessonSections(lesson).map(section => {
      const animation = section.animation;
      if (animation.id !== `${lesson.id}--${section.id}` || animation.steps.length !== 1 || !animation.steps[0].story) {
        throw new TypeError(`Invalid section narration: ${animation.id}`);
      }
      const metadata = {
        id: animation.id, title: section.title,
        parentLesson: lesson.id, parentTitle: lesson.title, sectionId: section.id,
        sourceSections: [...section.sourceSections], optional: section.optional
      };
      let start = 0;
      lectures.push({
        ...metadata, source: {...animation.source}, duration: animationDuration(animation),
        timing: 'Estimated narration; synthesize individual cues for measured audio boundaries.',
        subtitles: `${animation.id}.vtt`, transcript: `${animation.id}.txt`,
        scenes: animation.steps.map(step => {
          const scene = {
            title: step.title, caption: step.caption, start, duration: step.duration,
            kind: step.kind, chapter: step.data.chapter, story: step.story,
            cues: step.cues.map(cue => ({...cue, start: start + cue.start, end: start + cue.end}))
          };
          start += step.duration;
          return scene;
        })
      });
      return metadata;
    }));
  });
  if (new Set(lectures.map(lecture => lecture.id)).size !== lectures.length) {
    throw new TypeError('Duplicate section animation IDs');
  }
  mkdirSync(destination, {recursive: true});
  for (const lecture of lectures) {
    const animation = {id: lecture.id, kind: 'lecture', steps: lecture.scenes};
    writeFileSync(join(destination, lecture.subtitles), buildVtt(animation), 'utf8');
    writeFileSync(join(destination, lecture.transcript), lecture.scenes.map(scene => scene.caption).join('\n\n'), 'utf8');
  }
  writeFileSync(join(destination, 'lecturas.json'), `${JSON.stringify(lectures, null, 2)}\n`, 'utf8');
  return {
    destination, mode: 'sections', parent_lesson_count: COURSE.units.reduce((count, unit) => count + unit.lessons.length, 0),
    lectures: lectures.length, scenes: lectures.reduce((count, lecture) => count + lecture.scenes.length, 0),
    cues: lectures.reduce((count, lecture) => count + lecture.scenes.reduce((total, scene) => total + scene.cues.length, 0), 0),
    files: lectures.length * 2 + 1, course
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const options = {};
  let output;
  try {
    const args = process.argv.slice(2);
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '--sections') options.sections = true;
      else if (['--out', '--source'].includes(arg) && args[index + 1] && !args[index + 1].startsWith('--')) {
        const value = args[++index];
        if (arg === '--out') output = value;
        else options.source = value;
      } else throw new TypeError('Usage: node scripts/tts/export-narration.mjs [--sections] [--source directory] [--out directory]');
    }
    const {course, ...summary} = await exportNarration(output, options);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}