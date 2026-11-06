import {mkdir, writeFile, readFile, cp, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import path from 'node:path';
import {COURSE} from '../pages/inferencia/course.js';
import {generateExercise, scopeExercise} from '../pages/inferencia/exercises.js';
import {CAPSTONE} from '../pages/inferencia/capstone.js';

const require = createRequire(import.meta.url);
globalThis.jStat = require('jstat').jStat;

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = path.join(root, 'docs');
const formula = item => `<Formula tex={${JSON.stringify(item.tex)}}${item.meaning ? ` meaning={${JSON.stringify(item.meaning)}}` : ''}${item.reading ? ` reading={${JSON.stringify(item.reading)}}` : ''} />`;
const bullets = values => values.map(value => `- ${value}`).join('\n');
const plainText = value => String(value).replace(/[&<>{}]/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '{':'&#123;', '}':'&#125;'}[character]));
const mdxBody = value => value.replace(/[{}]/g, character => character === '{' ? '&#123;' : '&#125;');
await rm(docs, {recursive: true, force: true});
await mkdir(docs, {recursive: true});
await mkdir(path.join(root, 'src/generated'), {recursive: true});
await mkdir(path.join(root, 'static/vendor'), {recursive: true});
await mkdir(path.join(root, 'static/katex'), {recursive: true});
await writeFile(path.join(root, 'src/generated/aula-shell.json'), JSON.stringify(await readFile(path.join(root, 'pages/inferencia-estadistica.html'), 'utf8')));
await cp(path.join(root, 'pages/inferencia/aula.css'), path.join(root, 'static/aula.css'));
for (const name of ['atkinson-latin-400.woff2', 'atkinson-latin-700.woff2']) await cp(path.join(root, 'pages/inferencia/vendor', name), path.join(root, 'static/vendor', name));
await cp(path.join(root, 'node_modules/katex/dist/katex.min.css'), path.join(root, 'static/katex/katex.min.css'));
await cp(path.join(root, 'node_modules/katex/dist/fonts'), path.join(root, 'static/katex/fonts'), {recursive: true});
let count = 0;
const map = [];
for (const [unitIndex, unit] of COURSE.units.entries()) {
  const folder = path.join(docs, unit.id);
  await mkdir(folder, {recursive: true});
  await writeFile(path.join(folder, '_category_.json'), JSON.stringify({label: `Tema ${unit.number}: ${unit.title}${unit.number === 0 ? ' (opcional)' : ''}`, position: unitIndex + 1}, null, 2));
  map.push(`<details className="curriculum-topic"${unit.number === 1 ? ' open' : ''}>\n<summary>Tema ${unit.number}: ${unit.title}${unit.number === 0 ? ' (opcional)' : ''}</summary>\n\n${unit.description}\n\n${unit.lessons.map((lesson, index) => `- [${unit.number}.${index + 1} ${lesson.title}](./${unit.id}/${lesson.id}.mdx)`).join('\n')}\n\n</details>`);
  for (const [lessonIndex, lesson] of unit.lessons.entries()) {
    const text = `---\ntitle: ${JSON.stringify(lesson.title)}\nsidebar_position: ${lessonIndex + 1}\nslug: /lecciones/${lesson.id}\ncustom_edit_url: https://github.com/netraular/inferencia-estadistica-uoc/edit/main/pages/inferencia/course.js\n---\n\nimport Formula from '@site/src/components/Formula';\n\n${lesson.objectives[0]} Tiempo orientativo de lectura y practica: ${lesson.duration} min.\n\n## Al terminar esta leccion\n\n${bullets(lesson.objectives)}\n\n${lesson.sections.map(section => `## ${section.title}\n\n${mdxBody(section.body)}`).join('\n\n')}\n\n## La idea en simbolos\n\n${lesson.formulas.map(formula).join('\n\n')}\n\n## Como razonar y calcular\n\n${lesson.method.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n## ${lesson.example.title}\n\n${mdxBody(lesson.example.body)}\n\n## Errores que conviene evitar\n\n${bullets(lesson.pitfalls)}\n\n<p className="course-reference">Referencia: ${lesson.source.document} · ${lesson.source.section}. Ejemplos ficticios y explicaciones originales de apoyo.</p>\n`;
    const worked = scopeExercise(lesson, generateExercise(lesson.exerciseTypes[0], 1));
    const workedText = `## Ejemplo resuelto con el metodo\n\n${plainText(worked.prompt)}\n\n### Datos y supuestos\n\n${bullets([...worked.given, ...worked.assumptions].map(plainText))}\n\n${worked.questions.map(question => `### ${plainText(question.prompt)}\n\n${question.steps.map(step => `**${plainText(step.title)}**\n\n${plainText(step.explanation)}${step.tex ? `\n\n${formula(step)}` : ''}`).join('\n\n')}\n\n${plainText(question.interpretation)}`).join('\n\n')}`;
    const complete = text.replace('sidebar_position:', `sidebar_label: ${JSON.stringify(`${unit.number}.${lessonIndex + 1} ${lesson.title}`)}\nsidebar_position:`).replace("import Formula from '@site/src/components/Formula';", `import Formula from '@site/src/components/Formula';\nimport LessonContent from '@site/src/components/LessonContent';\n\n<LessonContent lessonId=${JSON.stringify(lesson.id)}>\n`).replace('## Errores que conviene evitar', `${workedText}\n\n## Errores que conviene evitar`);
    const notation = `## Palabras y símbolos de esta lección\n\n<Notation topic=${JSON.stringify(lesson.id)} />\n\n`;
    const basicSections = lesson.sections.filter(section => section.introductory).map(section => `## ${section.title}\n\n${mdxBody(section.body)}`).join('\n\n');
    const illustration = lesson.illustration ? `\n\n## ${lesson.illustration.title}\n\n<InteractiveLesson lessonId=${JSON.stringify(lesson.id)} view="figure" />` : '';
    const development = lesson.sections.filter(section => !section.introductory && !section.optional).map(section => `## ${section.title}\n\n${mdxBody(section.body)}`).join('\n\n');
    const allSections = lesson.sections.map(section => `## ${section.title}\n\n${mdxBody(section.body)}`).join('\n\n');
    const depth = lesson.sections.some(section => section.optional) || lesson.formulas.some(item => item.optional) ? `<details className="lesson-depth">\n<summary>Ampliación opcional</summary>\n\n${lesson.sections.filter(section => section.optional).map(section => `### ${section.title}\n\n${mdxBody(section.body)}`).join('\n\n')}\n\n${lesson.formulas.filter(item => item.optional).map(formula).join('\n\n')}\n\n</details>\n\n` : '';
    const guided = complete
      .replace("import Formula from '@site/src/components/Formula';", `import Formula, {Notation} from '@site/src/components/Formula';${lesson.illustration ? "\nimport InteractiveLesson from '@site/src/components/InteractiveLesson';" : ''}`)
      .replace(allSections, `${basicSections}${illustration}`)
      .replace('## La idea en simbolos', `${notation}${development}\n\n## La idea en simbolos`)
      .replace(lesson.formulas.map(formula).join('\n\n'), lesson.formulas.filter(item => !item.optional).map(formula).join('\n\n'))
      .replace('### Datos y supuestos', `<Notation topic=${JSON.stringify(worked.type)} />\n\n### Datos y supuestos`)
      .replace('## Errores que conviene evitar', `${depth}## Errores que conviene evitar`);
    await writeFile(path.join(folder, `${lesson.id}.mdx`), `${guided}\n</LessonContent>\n`);
    count++;
  }
}
const capstoneFolder = path.join(docs, CAPSTONE.id);
await mkdir(capstoneFolder, {recursive: true});
await writeFile(path.join(capstoneFolder, '_category_.json'), JSON.stringify({label: `Tema ${CAPSTONE.number}: ${CAPSTONE.title}`, position: COURSE.units.length + 1}, null, 2));
const lessons = new Map(COURSE.units.flatMap(unit => unit.lessons.map(lesson => [lesson.id, lesson])));
map.push(`<details className="curriculum-topic">\n<summary>Tema ${CAPSTONE.number}: ${CAPSTONE.title}</summary>\n\n${CAPSTONE.description}\n\n${CAPSTONE.sections.map((section, index) => `- [${CAPSTONE.number}.${index + 1} ${section.title}](./${CAPSTONE.id}/${section.id}.mdx)`).join('\n')}\n\n</details>`);
for (const [index, section] of CAPSTONE.sections.entries()) {
  const prerequisites = section.lessonIds.map(id => `- [${lessons.get(id).title}](/lecciones/${id})`).join('\n');
  await writeFile(path.join(capstoneFolder, `${section.id}.mdx`), `---\ntitle: ${JSON.stringify(section.title)}\nsidebar_label: ${JSON.stringify(`${CAPSTONE.number}.${index + 1} ${section.title}`)}\nsidebar_position: ${index + 1}\nslug: /lecciones/${section.id}\ncustom_edit_url: https://github.com/netraular/inferencia-estadistica-uoc/edit/main/pages/inferencia/capstone.js\n---\n\nimport CapstoneExercises from '@site/src/components/CapstoneExercises';\n\n${CAPSTONE.description}\n\n## Conocimientos que se ponen en juego\n\n${prerequisites}\n\n<CapstoneExercises exerciseId=${JSON.stringify(section.exerciseId)} />\n`);
}
await writeFile(path.join(docs, 'index.mdx'), `---\ntitle: Temario\nslug: /temario\nsidebar_position: 0\ncustom_edit_url: null\n---\n\nDe los sucesos a las distribuciones de varias variables, con ejemplos de biologia y las matematicas explicadas desde su significado.\n\nEl tema 0 es un puente matematico opcional. Los temas 1 a 4 desarrollan los cuatro documentos de los apuntes. El tema 5 resuelve los tres ejercicios de la PEC 1 como culminacion del recorrido. Las referencias de las lecciones senalan secciones de los PDF; cada problema enlaza su fuente.\n\n${map.join('\n\n')}\n\n## Referencias y ejemplos\n\nLas explicaciones son originales. El banco resuelve los ejercicios de los tres solucionarios y el tema 5 desarrolla todos los apartados de la PEC 1, con sus supuestos, razonamientos y figuras. Los ejemplos no son resultados experimentales ni recomendaciones clinicas.\n`);
console.log(`Generated ${count} lessons, ${CAPSTONE.sections.length} capstone pages and the course map.`);