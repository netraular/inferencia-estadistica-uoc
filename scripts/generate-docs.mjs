import {mkdir, writeFile, readFile, cp, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import path from 'node:path';
import {COURSE} from '../pages/inferencia/course.js';
import {generateExercise, scopeExercise} from '../pages/inferencia/exercises.js';
import {createLessonSections} from '../pages/inferencia/lesson-sections.js';
import {inlineMathToMdx} from '../src/lib/inline-math.js';
import {CAPSTONE} from '../pages/inferencia/capstone.js';

const require = createRequire(import.meta.url);
globalThis.jStat = require('jstat').jStat;

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = path.join(root, 'docs');
const formula = item => `<Formula tex={${JSON.stringify(item.tex)}}${item.meaning ? ` meaning={${JSON.stringify(item.meaning)}}` : ''}${item.reading ? ` reading={${JSON.stringify(item.reading)}}` : ''} />`;
const bullets = values => values.map(value => `- ${value}`).join('\n');
const plainText = value => String(value).replace(/[&<>{}]/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '{':'&#123;', '}':'&#125;'}[character]));
const section = (item, level = '##') => `${level} ${item.title}\n\n${inlineMathToMdx(item.body)}`;

const formulaSections = {
  proporciones:['porcentaje-y-exposicion', 'unidades-y-cotas'],
  algebra:['balanza', 'deshacer-exponencial'],
  funciones:['sumar-salidas', 'seleccionar-valores'],
  calculo:['primitiva', 'pendiente-acumulada'],
  'regiones-matrices':['recorrer-triangulo', 'orden-de-matriz'],
  sucesos:['traducir-conjuntos', 'observabilidad'],
  axiomas:['solapamiento', 'frecuencia'],
  combinatoria:['posiciones', 'multiplicidades'],
  condicionada:['grupo-conocido', 'ruta-condicionada'],
  'independencia-sucesos':['producto', 'independencia-mutua'],
  'bayes-diagnostico':['posterior', 'negativos-y-prevalencia'],
  'variable-cdf':['regla-observable', 'intervalos-y-saltos'],
  masa:['agrupar-y-normalizar', 'interruptores'],
  densidad:['densidad-creciente', 'acumulada-por-tramos'],
  esperanza:['transformar-valores', 'linealidad-y-colas'],
  varianza:['segundo-momento', 'estirar-y-desplazar'],
  'momentos-transformaciones':['ordinarios-y-centrales', 'cambio-de-distribucion'],
  'bernoulli-binomial':['masa-y-cola', 'masa-y-cola'],
  poisson:['masa-y-complemento', 'aproximar-y-sumar'],
  hipergeometrica:['masa-finita', 'soporte-y-correccion'],
  'geometrica-negativa':['primera-deteccion', 'varios-exitos'],
  'uniforme-montecarlo':['dos-uniformes', 'cuantiles', 'dos-uniformes'],
  exponencial:['escala-y-supervivencia', 'espera-adicional'],
  normal:['densidad-normal', 'colas-e-intervalos'],
  gamma:['densidad-y-area', 'funcion-gamma'],
  'cauchy-weibull':['centro-sin-media', 'weibull-supervivencia', 'riesgo-y-momentos'],
  'calculo-modelos':['operacion-correcta', 'consulta-con-unidades'],
  'familia-exponencial':['piezas-poisson', 'enlaces-glm', 'datos-fijos-y-maximo'],
  'conjunta-discreta':['parejas', 'rectangulo-acumulado'],
  multinomial:['categorias-y-secuencias', 'momentos-con-indicadores'],
  marginales:['sumar-la-otra', 'integrar-cortes'],
  'conjunta-condicional':['normalizar-region', 'normalizar-corte'],
  'normal-bivariante':['densidad-bivariante', 'media-y-varianza-condicional'],
  'independencia-variables':['factorizar-tabla', 'soporte-completo', 'transformar-y-seleccionar'],
  'covarianza-matrices':['normalizar-covarianza', 'matrices-admisibles'],
  'combinaciones-incorrelacion':['suma-y-diferencia', 'forma-matricial', 'incorrelacion']
};

const exampleSections = {
  funciones:'seleccionar-valores',
  calculo:'franjas',
  'regiones-matrices':'recorrer-triangulo',
  sucesos:'resultados-y-sucesos',
  densidad:'densidad-creciente',
  varianza:'estirar-y-desplazar',
  'momentos-transformaciones':'cambio-de-distribucion',
  'geometrica-negativa':'primera-deteccion',
  'uniforme-montecarlo':'inversion-y-montecarlo',
  'cauchy-weibull':'weibull-supervivencia',
  'familia-exponencial':'enlaces-glm',
  marginales:'integrar-cortes',
  'conjunta-condicional':'normalizar-corte',
  'covarianza-matrices':'normalizar-covarianza'
};

function workedExample(lesson, questionIds) {
  const worked = scopeExercise(lesson, generateExercise(lesson.exerciseTypes[0], 1));
  const questions = worked.questions.filter(question => questionIds.includes(question.id)).map(question => `### ${plainText(question.prompt)}\n\n${question.steps.map(step => `**${plainText(step.title)}**\n\n${plainText(step.explanation)}${step.tex ? `\n\n${formula(step)}` : ''}`).join('\n\n')}\n\n${plainText(question.interpretation)}`);
  return `${plainText(worked.prompt)}\n\n${worked.type === lesson.id ? '' : `<Notation topic=${JSON.stringify(worked.type)} />\n\n`}### Datos y supuestos\n\n${bullets([...worked.given, ...worked.assumptions].map(plainText))}\n\n${questions.join('\n\n')}`;
}

function lessonPage(unit, lesson, lessonIndex) {
  const sections = createLessonSections(lesson);
  const exampleSection = exampleSections[lesson.id] || sections.find(item => item.exercise)?.id || sections[0].id;
  if (!sections.some(item => item.id === exampleSection)) throw new RangeError(`Ejemplo sin apartado en ${lesson.id}.`);
  const formulaSectionIds = formulaSections[lesson.id];
  if (formulaSectionIds?.length !== lesson.formulas.length || formulaSectionIds.some((id, index) => {
    const destination = sections.find(item => item.id === id);
    return !destination || destination.optional !== Boolean(lesson.formulas[index].optional);
  })) throw new RangeError(`Fórmulas sin apartado compatible en ${lesson.id}.`);
  const illustration = lesson.illustration ? `### ${lesson.illustration.title}\n\n<InteractiveLesson lessonId=${JSON.stringify(lesson.id)} view="figure" />` : '';
  const imports = [
    "import Formula, {InlineFormula, Notation} from '@site/src/components/Formula';",
    "import LessonContent from '@site/src/components/LessonContent';",
    "import {LessonNotes, LessonSummary, LessonSectionNotes} from '@site/src/components/LessonNotes';",
    lesson.illustration ? "import InteractiveLesson from '@site/src/components/InteractiveLesson';" : ''
  ].filter(Boolean).join('\n');
  const summary = [
    '<h2 id="ideas-clave">Ideas clave</h2>', bullets(lesson.sections.filter(item => !item.optional && !item.introductory).map(item => item.title)),
    '<h3 id="fórmulas-clave">Fórmulas clave</h3>', lesson.formulas.filter(item => !item.optional).map(formula).join('\n\n'),
    '<h3 id="cómo-resolverlo">Cómo resolverlo</h3>', lesson.method.map((step, index) => `${index + 1}. ${step}`).join('\n'),
    '<h3 id="errores-que-conviene-evitar">Errores que conviene evitar</h3>', bullets(lesson.pitfalls),
    `<p className="lesson-duration">Tiempo orientativo de estudio y práctica: ${lesson.duration} min.</p>`
  ].join('\n\n');
  const notes = sections.map((item, index) => {
    const body = item.sourceSections.map(title => section(lesson.sections.find(source => source.title === title), '###'));
    if (index === 0) body.unshift(illustration, `### Palabras y símbolos de esta lección\n\n<Notation topic=${JSON.stringify(lesson.id)} />`);
    const formulas = lesson.formulas.filter((entry, formulaIndex) => formulaSectionIds[formulaIndex] === item.id);
    if (formulas.length) body.push('### Fórmulas del apartado', ...formulas.map(formula));
    if (item.id === exampleSection) body.push(section(lesson.example, '###'));
    if (item.exercise) body.push(`<LessonNotes title="Desarrollo escrito del ejemplo">\n\n${workedExample(lesson, item.exercise.questionIds)}\n\n</LessonNotes>`);
    const content = body.filter(Boolean).join('\n\n');
    return `<LessonSectionNotes sectionId=${JSON.stringify(item.id)}>\n\n${item.optional ? `<LessonNotes title="Ampliación opcional">\n\n${content}\n\n</LessonNotes>` : content}\n\n</LessonSectionNotes>`;
  }).join('\n\n');
  return `---\ntitle: ${JSON.stringify(lesson.title)}\nsidebar_label: ${JSON.stringify(`${unit.number}.${lessonIndex + 1} ${lesson.title}`)}\nsidebar_position: ${lessonIndex + 1}\nslug: /lecciones/${lesson.id}\ncustom_edit_url: https://github.com/netraular/inferencia-estadistica-uoc/edit/main/pages/inferencia/course.js\n---\n\n${imports}\n\n<LessonContent lessonId=${JSON.stringify(lesson.id)}>\n\n<LessonSummary>\n\n${summary}\n\n</LessonSummary>\n\n${notes}\n\n</LessonContent>\n`;
}

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
  map.push(`<details className="curriculum-topic">\n<summary>Tema ${unit.number}: ${unit.title}${unit.number === 0 ? ' (opcional)' : ''}</summary>\n\n${unit.description}\n\n${unit.lessons.map((lesson, index) => `- [${unit.number}.${index + 1} ${lesson.title}](./${unit.id}/${lesson.id}.mdx)`).join('\n')}\n\n</details>`);
  for (const [lessonIndex, lesson] of unit.lessons.entries()) {
    await writeFile(path.join(folder, `${lesson.id}.mdx`), lessonPage(unit, lesson, lessonIndex));
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
await writeFile(path.join(docs, 'index.mdx'), `---\ntitle: Temario\nslug: /temario\nsidebar_position: 0\ncustom_edit_url: null\n---\n\nDe los sucesos a las distribuciones de varias variables, con ejemplos de biología y las matemáticas explicadas desde su significado.\n\nEl tema 0 es un puente matemático opcional. Los temas 1 a 4 desarrollan los cuatro documentos de los apuntes. El tema 5 resuelve los tres ejercicios de la PEC 1 como culminación del recorrido. Cada lección indica su apartado y enlaza a la página correspondiente del PDF; cada problema enlaza su fuente.\n\n${map.join('\n\n')}\n\n## Referencias y ejemplos\n\nLas explicaciones son originales. El banco resuelve los ejercicios de los tres solucionarios y el tema 5 desarrolla todos los apartados de la PEC 1, con sus supuestos, razonamientos y figuras. Los ejemplos no son resultados experimentales ni recomendaciones clínicas.\n`);
console.log(`Generated ${count} lessons, ${CAPSTONE.sections.length} capstone pages and the course map.`);
