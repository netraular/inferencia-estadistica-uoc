import {mkdir, writeFile, readFile, cp, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import path from 'node:path';
import {COURSE} from '../pages/inferencia/course.js';
import {generateExercise} from '../pages/inferencia/exercises.js';

const require = createRequire(import.meta.url);
globalThis.jStat = require('jstat').jStat;

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = path.join(root, 'docs');
const formula = item => `<Formula tex={${JSON.stringify(item.tex)}}${item.meaning ? ` meaning={${JSON.stringify(item.meaning)}}` : ''} />`;
const bullets = values => values.map(value => `- ${value}`).join('\n');
const plainText = value => String(value).replace(/[&<>{}]/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '{':'&#123;', '}':'&#125;'}[character]));
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
  map.push(`## Tema ${unit.number}: ${unit.title}${unit.number === 0 ? ' (opcional)' : ''}\n\n${unit.description}\n\n${unit.lessons.map((lesson, index) => `- [${unit.number}.${index + 1} ${lesson.title}](./${unit.id}/${lesson.id}.mdx)`).join('\n')}`);
  for (const [lessonIndex, lesson] of unit.lessons.entries()) {
    const text = `---\ntitle: ${JSON.stringify(lesson.title)}\nsidebar_position: ${lessonIndex + 1}\nslug: /lecciones/${lesson.id}\ncustom_edit_url: https://github.com/netraular/inferencia-estadistica-uoc/edit/main/pages/inferencia/course.js\n---\n\nimport Formula from '@site/src/components/Formula';\n\n${lesson.objectives[0]} Tiempo orientativo de lectura y practica: ${lesson.duration} min.\n\n## Al terminar esta leccion\n\n${bullets(lesson.objectives)}\n\n${lesson.sections.map(section => `## ${section.title}\n\n${section.body}`).join('\n\n')}\n\n## La idea en simbolos\n\n${lesson.formulas.map(formula).join('\n\n')}\n\n## Como razonar y calcular\n\n${lesson.method.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n## ${lesson.example.title}\n\n${lesson.example.body}\n\n## Errores que conviene evitar\n\n${bullets(lesson.pitfalls)}\n\n<p className="course-reference">Referencia: ${lesson.source.document} · ${lesson.source.section}. Ejemplos ficticios y explicaciones originales de apoyo.</p>\n`;
    const worked = generateExercise(lesson.exerciseTypes[0], 1);
    const workedText = `## Ejemplo resuelto con el metodo\n\n${plainText(worked.prompt)}\n\n### Datos y supuestos\n\n${bullets([...worked.given, ...worked.assumptions].map(plainText))}\n\n${worked.questions.map(question => `### ${plainText(question.prompt)}\n\n${question.steps.map(step => `**${plainText(step.title)}**\n\n${plainText(step.explanation)}${step.tex ? `\n\n${formula(step)}` : ''}`).join('\n\n')}\n\n${plainText(question.interpretation)}`).join('\n\n')}`;
    const complete = text.replace('sidebar_position:', `sidebar_label: ${JSON.stringify(`${unit.number}.${lessonIndex + 1} ${lesson.title}`)}\nsidebar_position:`).replace("import Formula from '@site/src/components/Formula';", `import Formula from '@site/src/components/Formula';\nimport LessonContent from '@site/src/components/LessonContent';\n\n<LessonContent lessonId=${JSON.stringify(lesson.id)}>\n`).replace('## Errores que conviene evitar', `${workedText}\n\n## Errores que conviene evitar`);
    await writeFile(path.join(folder, `${lesson.id}.mdx`), `${complete}\n</LessonContent>\n`);
    count++;
  }
}
await writeFile(path.join(docs, 'index.mdx'), `---\ntitle: Temario\nslug: /temario\nsidebar_position: 0\ncustom_edit_url: null\n---\n\nDe los sucesos a las distribuciones de varias variables, con ejemplos de biologia y las matematicas explicadas desde su significado.\n\nEl tema 0 es un puente matematico opcional. Los temas 1 a 4 desarrollan los cuatro documentos de los apuntes. Las referencias senalan secciones, no paginas de los PDF.\n\n${map.join('\n\n')}\n\n## Materiales y limites\n\nLas explicaciones y los ejercicios son originales. No se publican los PDF docentes ni las respuestas de la evaluacion vigente. Los ejemplos no son resultados experimentales ni recomendaciones clinicas. Esta web es independiente y no esta afiliada a la UOC.\n`);
console.log(`Generated ${count} lessons and the course map.`);