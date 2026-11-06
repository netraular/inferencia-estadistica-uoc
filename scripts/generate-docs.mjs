import {mkdir, writeFile, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {COURSE} from '../pages/inferencia/course.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = path.join(root, 'docs');
const formula = item => `<Formula tex={${JSON.stringify(item.tex)}}${item.meaning ? ` meaning={${JSON.stringify(item.meaning)}}` : ''} />`;
const bullets = values => values.map(value => `- ${value}`).join('\n');
await rm(docs, {recursive: true, force: true});
await mkdir(docs, {recursive: true});
let count = 0;
const map = [];
for (const [unitIndex, unit] of COURSE.units.entries()) {
  const folder = path.join(docs, unit.id);
  await mkdir(folder, {recursive: true});
  await writeFile(path.join(folder, '_category_.json'), JSON.stringify({label: unit.number === 0 ? 'Apoyo: puente matematico' : `Tema ${unit.number}: ${unit.title}`, position: unitIndex + 1}, null, 2));
  map.push(`## ${unit.number === 0 ? 'Puente matematico opcional' : `Tema ${unit.number}: ${unit.title}`}\n\n${unit.description}\n\n${unit.lessons.map(lesson => `- [${lesson.title}](./${unit.id}/${lesson.id}.mdx)`).join('\n')}`);
  for (const [lessonIndex, lesson] of unit.lessons.entries()) {
    const text = `---\ntitle: ${JSON.stringify(lesson.title)}\nsidebar_position: ${lessonIndex + 1}\nslug: /lecciones/${lesson.id}\ncustom_edit_url: https://github.com/netraular/inferencia-estadistica-uoc/edit/main/pages/inferencia/course.js\n---\n\nimport Formula from '@site/src/components/Formula';\n\n${lesson.objectives[0]} Tiempo orientativo de lectura y practica: ${lesson.duration} min.\n\n## Al terminar esta leccion\n\n${bullets(lesson.objectives)}\n\n${lesson.sections.map(section => `## ${section.title}\n\n${section.body}`).join('\n\n')}\n\n## La idea en simbolos\n\n${lesson.formulas.map(formula).join('\n\n')}\n\n## Como razonar y calcular\n\n${lesson.method.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n## ${lesson.example.title}\n\n${lesson.example.body}\n\n## Errores que conviene evitar\n\n${bullets(lesson.pitfalls)}\n\n<p className="course-reference">Referencia: ${lesson.source.document} · ${lesson.source.section}. Ejemplos ficticios y explicaciones originales de apoyo.</p>\n`;
    await writeFile(path.join(folder, `${lesson.id}.mdx`), text);
    count++;
  }
}
await writeFile(path.join(docs, 'index.mdx'), `---\ntitle: Inferencia estadistica\nslug: /\nsidebar_position: 0\ncustom_edit_url: null\n---\n\nDe los sucesos a las distribuciones de varias variables, con ejemplos de biologia y las matematicas explicadas desde su significado.\n\nEste material de apoyo desarrolla los cuatro temas de los apuntes. El puente matematico es opcional, no un quinto tema. Las referencias senalan secciones, no paginas de los PDF.\n\n${map.join('\n\n')}\n\n## Materiales y limites\n\nLas explicaciones y los ejercicios son originales. No se publican los PDF docentes ni las respuestas de la evaluacion vigente. Los ejemplos no son resultados experimentales ni recomendaciones clinicas. Esta web es independiente y no esta afiliada a la UOC.\n`);
console.log(`Generated ${count} lessons and the course map.`);