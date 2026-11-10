import {COURSE} from './course.js?v=2eb74cdf8fab';
import {EXERCISE_TYPES, generateExercise, gradeAnswer, scopeExercise} from './exercises.js?v=492ef5e92035';
import {notationHtml} from './teaching.js?v=251983817529';
import {createLessonAnimation, mountAnimation} from './animations.js?v=22184408abd2';
import {enrichLessonAnimation, enrichGlobalAnimation} from './lesson-visuals.js?v=00babaa724d9';
import {mountLab} from './labs.js?v=2f4aa757b74f';
import {mountExerciseTutor} from './exercise-tutor.js?v=f405affbef37';
import {getPdfExercises} from './pdf-exercises.js?v=c7879552421f';

export const LESSONS = COURSE.units.flatMap(unit => unit.lessons.map(lesson => ({...lesson, unit})));
export const VIEWS = ['theory', 'lab', 'practice', 'animation'];
export const LESSON_LAB_PRESETS = {
  proporciones:{mode:'proportions'},
  algebra:{mode:'weights'},
  funciones:{mode:'function'},
  'regiones-matrices':{mode:'region'},
  'variable-cdf':{display:'cdf'},
  hipergeometrica:{family:'hypergeometric'},
  'geometrica-negativa':{family:'negative-binomial', r:1},
  'uniforme-montecarlo':{family:'uniform'},
  exponencial:{family:'exponential', rate:0.2},
  normal:{mu:40, sigma:4, lower:36, upper:44},
  gamma:{family:'gamma', shape:3, scale:2},
  'cauchy-weibull':{family:'cauchy'},
  'familia-exponencial':{family:'poisson'}
};
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const FIRST_PRACTICE_SEED = 2;

export function readParagraphs(document, html) {
  const content = document.createElement('div');
  content.innerHTML = html;
  return Array.from(content.querySelectorAll('p'), paragraph => paragraph.textContent);
}

export function parseRoute(hash, fallback = LESSONS[0].id) {
  const [lessonId, view] = String(hash || '').replace(/^#\/?/, '').split('/');
  return {lessonId:LESSONS.some(lesson => lesson.id === lessonId) ? lessonId : fallback, view:VIEWS.includes(view) ? view : 'theory'};
}

export function mountAula(document, environment = {}) {
  const window = document.defaultView || globalThis;
  const location = environment.location || window.location || {hash:''};
  const history = environment.history || window.history;
  let route = parseRoute(location.hash);
  let overview = !location.hash || location.hash === '#inicio';
  let activeCleanup = null;
  let activeExercise = null;
  let practiceType = null;
  let practiceSource = null;
  let pdfExerciseId = null;
  let seed = FIRST_PRACTICE_SEED;
  let mode = 'observe';
  let entireBank = false;
  let disposed = false;
  const listeners = [];
  const element = id => document.getElementById(id);
  const lesson = () => LESSONS.find(item => item.id === route.lessonId);
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };
  const icons = () => {
    try {
      if (environment.renderIcons) environment.renderIcons();
      else window.lucide?.createIcons({root:document});
    } catch { }
  };
  const math = tex => {
    try {
      return window.katex ? window.katex.renderToString(tex, {displayMode:true, throwOnError:false, trust:false, strict:'ignore'}) : `<span>${escapeHtml(tex)}</span>`;
    } catch { return `<span>${escapeHtml(tex)}</span>`; }
  };
  function renderNav() {
    const query = normalize(element('courseSearch').value);
    const groups = COURSE.units.map(unit => {
      const matching = unit.lessons.filter(item => normalize([unit.title, item.title, ...item.objectives, ...item.formulas.map(formula => formula.meaning)].join(' ')).includes(query));
      if (!matching.length) return '';
      const open = query || matching.some(item => item.id === route.lessonId);
      return `<details class="unit-group"${open ? ' open' : ''}><summary><span class="unit-number">${unit.number || '+'}</span><span>${unit.number === 0 ? 'Apoyo opcional: ' : ''}${escapeHtml(unit.title)}</span></summary><p class="unit-description">${matching.length} lecciones${unit.number === 0 ? ' · No es un quinto tema' : ` · PDF Tema ${unit.number}`}</p>${matching.map(item => `<button type="button" class="lesson-link" data-lesson="${item.id}"${!overview && item.id === route.lessonId ? ' aria-current="page"' : ''}><span>${escapeHtml(item.title)}</span></button>`).join('')}</details>`;
    }).join('');
    element('courseNav').innerHTML = groups || '<p class="empty-state">No hay lecciones con ese concepto.</p>';
  }

  function renderTheory() {
    const original = lesson();
    const current = {...original,
      sections:[...original.sections.filter(section => section.introductory), {title:'Palabras y símbolos de esta lección', body:notationHtml(original.id)}, ...original.sections.filter(section => !section.introductory && !section.optional)],
      formulas:original.formulas.filter(formula => !formula.optional).map(formula => ({...formula, meaning:`Se lee: ${formula.reading} ${formula.meaning}`}))
    };
    const check = current.check;
    element('panel-theory').innerHTML = `<div class="theory-layout"><article class="theory-article"><div class="objectives"><h3>Al terminar esta lección</h3><ul>${current.objectives.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul></div>${current.sections.map(section => `<section><h2>${escapeHtml(section.title)}</h2>${section.body}</section>`).join('')}<section><h2>La idea en símbolos</h2>${current.formulas.map(formula => `<div class="formula"><div class="math">${math(formula.tex)}</div><p>${escapeHtml(formula.meaning)}</p></div>`).join('')}</section><section class="example"><h3>${escapeHtml(current.example.title)}</h3>${current.example.body}</section><section class="pitfalls"><h3>Errores que conviene evitar</h3><ul>${current.pitfalls.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul></section><section class="knowledge-check"><h3>Comprueba la idea</h3><p>${escapeHtml(check.question)}</p><form id="knowledgeForm"><div class="check-options">${check.options.map((option, index) => `<label class="check-option"><input type="radio" name="knowledge" value="${index}" required><span>${escapeHtml(option)}</span></label>`).join('')}</div><button type="submit" class="primary-button"><i data-lucide="check" aria-hidden="true"></i>Comprobar</button><p id="knowledgeFeedback" class="feedback" role="status" hidden></p></form></section><p class="source-note">Referencia: ${escapeHtml(current.source.document)} · ${escapeHtml(current.source.section)}. Explicación original de apoyo; los ejemplos son didácticos.</p></article><aside class="theory-visual"><h3>Una idea que puedes ver</h3><p>Ejemplo visual complementario</p><div id="theoryLab"></div><button type="button" class="text-button" data-open-view="lab"><i data-lucide="flask-conical" aria-hidden="true"></i>Abrir laboratorio</button></aside></div>`;
    activeCleanup = mountLab(element('theoryLab'), current.visual, {formatMath:math, params:LESSON_LAB_PRESETS[current.id] || {}});
    const method = document.createElement('section');
    method.className = 'lesson-method';
    method.innerHTML = `<h2>Cómo razonar y calcular</h2><ol>${current.method.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ol>`;
    element('panel-theory').querySelector('.example').before(method);
    const worked = scopeExercise(current, generateExercise(current.exerciseTypes[0], 1));
    const example = document.createElement('section');
    example.className = 'worked-example';
    example.innerHTML = `<h2>Ejemplo resuelto con el método</h2><p>${escapeHtml(worked.prompt)}</p><h3>Datos y supuestos</h3><ul>${[...worked.given,...worked.assumptions].map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>${worked.questions.map(question => `<details class="solution" open><summary>${escapeHtml(question.prompt)}</summary><ol>${question.steps.map(step => `<li><h4>${escapeHtml(step.title)}</h4><p>${escapeHtml(step.explanation)}</p>${step.tex ? `<div class="math">${math(step.tex)}</div>` : ''}</li>`).join('')}</ol></details>`).join('')}<button type="button" class="text-button" data-open-view="practice"><i data-lucide="shuffle" aria-hidden="true"></i>Practicar una variante</button>`;
    element('panel-theory').querySelector('.example').after(example);
    if (original.sections.some(section => section.optional) || original.formulas.some(formula => formula.optional)) {
      const depth = document.createElement('details');
      depth.className = 'lesson-depth';
      depth.innerHTML = `<summary>Ampliación opcional</summary>${original.sections.filter(section => section.optional).map(section => `<section><h3>${escapeHtml(section.title)}</h3>${section.body}</section>`).join('')}${original.formulas.filter(formula => formula.optional).map(formula => `<p>Se lee: ${escapeHtml(formula.reading)}</p><div class="math">${math(formula.tex)}</div><p>${escapeHtml(formula.meaning)}</p>`).join('')}`;
      element('panel-theory').querySelector('.pitfalls').before(depth);
    }
    const form = element('knowledgeForm');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input:checked');
      const correct = selected && Number(selected.value) === check.answer;
      const feedback = element('knowledgeFeedback');
      feedback.hidden = false;
      feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
      feedback.textContent = selected ? `${correct ? 'Correcto.' : 'Repasa esta idea.'} ${check.explanation}` : 'Selecciona una respuesta antes de comprobar.';
    });
  }

  function renderLab() {
    element('panel-lab').innerHTML = `<p class="section-intro">Pregunta de esta lección: ${escapeHtml(lesson().objectives.join(' '))} El laboratorio aísla un mecanismo con parámetros didácticos; no modifica el enunciado ni las soluciones de los ejercicios.</p><div id="lessonLab"></div>`;
    activeCleanup = mountLab(element('lessonLab'), lesson().visual, {formatMath:math, params:LESSON_LAB_PRESETS[lesson().id] || {}});
    const notation = document.createElement('section');
    notation.innerHTML = `<h3>Palabras y símbolos de esta lección</h3>${notationHtml(lesson().id)}`;
    element('lessonLab').before(notation);
  }

  function renderPractice(excludedContent = null) {
    activeCleanup?.();
    activeCleanup = null;
    const current = lesson();
    const available = entireBank ? EXERCISE_TYPES : current.exerciseTypes.map(id => EXERCISE_TYPES.find(type => type.id === id));
    if (!available.some(type => type.id === practiceType)) practiceType = available[0].id;
    const pdfExercises = entireBank ? [] : getPdfExercises(current.id);
    const usingPdf = mode === 'observe' && practiceSource !== 'synthetic' && pdfExercises.length > 0;
    if (usingPdf) {
      activeExercise = pdfExercises.find(exercise => exercise.id === pdfExerciseId) || pdfExercises[0];
      pdfExerciseId = activeExercise.id;
    } else activeExercise = entireBank ? generateExercise(practiceType, seed) : scopeExercise(current, generateExercise(practiceType, seed));
    if (!usingPdf && (!entireBank || excludedContent)) {
      const content = exercise=>JSON.stringify([exercise.prompt,exercise.given,exercise.questions.map(question=>question.prompt)]);
      const worked = entireBank ? null : content(scopeExercise(current,generateExercise(practiceType,1)));
      for (let attempt=0;content(activeExercise)===worked || content(activeExercise)===excludedContent;attempt++) {
        if (attempt===32) throw new Error('No se pudo generar una variante distinta del ejemplo resuelto.');
        seed = seed === 4294967295 ? FIRST_PRACTICE_SEED : seed+1;
        activeExercise = entireBank ? generateExercise(practiceType,seed) : scopeExercise(current,generateExercise(practiceType,seed));
      }
    }
    element('panel-practice').innerHTML = `<div class="practice-toolbar"><label class="control-field">Tipo de ejercicio<select id="exerciseType">${available.map(type => `<option value="${type.id}"${type.id === practiceType ? ' selected' : ''}>${escapeHtml(type.title)}</option>`).join('')}</select></label><label class="control-field">Modalidad<select id="practiceMode"><option value="practice"${mode === 'practice' ? ' selected' : ''}>Práctica</option><option value="guided"${mode === 'guided' ? ' selected' : ''}>Resolución guiada</option></select></label><button id="newExercise" type="button" class="text-button"><i data-lucide="shuffle" aria-hidden="true"></i>Nuevo ejemplo</button><label class="bank-toggle"><input id="entireBank" type="checkbox"${entireBank ? ' checked' : ''}>Banco completo</label></div><div class="exercise-prompt"><p class="eyebrow">EJEMPLO ${seed} · ${escapeHtml(activeExercise.title)}</p><h2>${escapeHtml(activeExercise.title)}</h2><p>${escapeHtml(activeExercise.prompt)}</p><div class="exercise-context"><section><h3>Datos del problema</h3><ul>${activeExercise.given.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul></section><section><h3>Supuestos</h3><ul>${activeExercise.assumptions.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul></section></div></div>${activeExercise.questions.map((question, index) => {
      return `<section class="exercise-question" data-question="${question.id}"><h3>${index + 1}. ${escapeHtml(question.prompt)}</h3><form data-grade-form="${question.id}"><div class="answer-row"><label for="answer-${question.id}">Tu respuesta · ${escapeHtml(question.unit)}<input id="answer-${question.id}" type="text" inputmode="decimal" autocomplete="off" placeholder="0,25 / 1/4 / 25%" aria-describedby="answer-help-${question.id}"></label><button type="submit" class="primary-button"><i data-lucide="check" aria-hidden="true"></i>Comprobar</button><button type="button" class="text-button" data-hint="${question.id}"><i data-lucide="lightbulb" aria-hidden="true"></i>Pista</button></div><p id="answer-help-${question.id}" class="answer-help">Tolerancia absoluta: ${question.tolerance.toString().replace('.', ',')}.</p><p id="feedback-${question.id}" class="feedback" role="status" hidden></p></form><p id="hint-${question.id}" class="hint"${mode === 'guided' ? '' : ' hidden'}>${escapeHtml(question.hint)}</p><details class="solution" data-solution="${question.id}"${mode === 'guided' ? ' open' : ''}><summary>Resolución paso a paso</summary><div class="worked-controls"><button type="button" class="icon-button" data-solution-step="-1" aria-label="Paso anterior" title="Paso anterior" disabled><i data-lucide="arrow-left" aria-hidden="true"></i></button><span data-step-position role="status">Paso 1 de ${question.steps.length}</span><button type="button" class="icon-button" data-solution-step="1" aria-label="Paso siguiente" title="Paso siguiente"${question.steps.length <= 1 ? ' disabled' : ''}><i data-lucide="arrow-right" aria-hidden="true"></i></button></div><ol>${question.steps.map((step, stepIndex) => `<li data-worked-step="${stepIndex}"${stepIndex ? ' hidden' : ' aria-current="step"'}><h4>${escapeHtml(step.title)}</h4><p>${escapeHtml(step.explanation)}</p>${step.tex ? `<div class="math worked-calculation">${math(step.tex)}</div>` : ''}</li>`).join('')}</ol><p class="interpretation"${question.steps.length > 1 ? ' hidden' : ''}><strong>Resultado: ${Number(question.answer.toPrecision(7)).toString().replace('.', ',')}.</strong> ${escapeHtml(question.interpretation)}</p></details></section>`;
    }).join('')}`;
    element('panel-practice').querySelector('.practice-toolbar').insertAdjacentHTML('afterbegin', `<label class="control-field">Origen<select id="exerciseSource">${pdfExercises.length ? `<option value="pdf"${usingPdf ? ' selected' : ''}>Ejercicios resueltos del PDF</option>` : ''}<option value="synthetic"${usingPdf ? '' : ' selected'}>Práctica extra</option></select></label>${usingPdf ? `<label class="control-field">Problema<select id="pdfExercise">${pdfExercises.map(exercise => `<option value="${escapeHtml(exercise.id)}"${exercise.id === pdfExerciseId ? ' selected' : ''}>${escapeHtml(exercise.source.number)}. ${escapeHtml(exercise.title)}</option>`).join('')}</select></label>` : ''}`);
    element('exerciseType').closest('label').hidden = usingPdf;
    if (usingPdf) {
      element('newExercise').innerHTML = '<i data-lucide="shuffle" aria-hidden="true"></i>Otro problema PDF';
      element('newExercise').disabled = pdfExercises.length < 2;
    }
    const selector = element('practiceMode');
    selector.insertAdjacentHTML('afterbegin',`<option value="observe"${mode === 'observe' ? ' selected' : ''}>Observar la resolucion</option>`);
    selector.value = mode;
    const attempt = document.createElement('div');
    attempt.id = 'practiceAttempt';
    attempt.hidden = mode === 'observe';
    element('panel-practice').querySelectorAll('.exercise-question').forEach(question=>attempt.append(question));
    element('panel-practice').append(attempt);
    element('panel-practice').querySelector('.exercise-prompt').hidden = mode === 'observe';
    if (mode === 'observe') {
      const tutor = document.createElement('section');
      tutor.setAttribute('data-exercise-tutor','');
      attempt.before(tutor);
      activeCleanup = mountExerciseTutor(tutor,activeExercise,{formatMath:math,onPractice:()=>{const excluded=JSON.stringify([activeExercise.prompt,activeExercise.given,activeExercise.questions.map(question=>question.prompt)]);mode='practice';practiceSource='synthetic';entireBank=false;seed=seed===4294967295?FIRST_PRACTICE_SEED:seed+1;renderPractice(excluded);icons();}});
    }
    if (usingPdf) {
      const solutions = document.createElement('section');
      solutions.setAttribute('data-pdf-solutions','');
      solutions.innerHTML = `<h2>Ejercicios resueltos del PDF</h2>${pdfExercises.map(exercise => `<details class="worked-example" data-pdf-exercise="${escapeHtml(exercise.id)}"${exercise.id === pdfExerciseId ? ' open' : ''}><summary>Problema ${escapeHtml(exercise.source.number)} · ${escapeHtml(exercise.title)}</summary><p class="source-note">${escapeHtml(exercise.source.file)} · Página ${exercise.source.page}</p><p>${escapeHtml(exercise.prompt)}</p><h3>Datos del problema</h3><ul>${exercise.given.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>${exercise.assumptions.length ? `<h3>Supuestos</h3><ul>${exercise.assumptions.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : ''}${exercise.questions.map((question,index) => `<section data-pdf-question="${escapeHtml(question.id)}"><h3>${index + 1}. ${escapeHtml(question.prompt)}</h3><ol>${question.steps.map(step => `<li><h4>${escapeHtml(step.title)}</h4><p>${escapeHtml(step.explanation)}</p>${step.tex ? `<div class="math">${math(step.tex)}</div>` : ''}</li>`).join('')}</ol><div class="math">${math(String.raw`\boxed{${Number(question.answer.toPrecision(9)).toString()}}`)}</div><p>${escapeHtml(question.unit)}</p><p class="interpretation">${escapeHtml(question.interpretation)}</p></section>`).join('')}</details>`).join('')}`;
      element('panel-practice').querySelector('[data-exercise-tutor]').before(solutions);
    }
    const notation = document.createElement('section');
    notation.className = 'exercise-notation';
    notation.innerHTML = `<h3>Cómo leer los símbolos de este ejercicio</h3>${notationHtml(activeExercise.type === 'pdf' ? current.id : activeExercise.type)}`;
    element('panel-practice').querySelector(usingPdf ? '[data-exercise-tutor]' : '.exercise-prompt').append(notation);
  }

  function renderAnimation() {
    const paragraphs = html => readParagraphs(document, html);
    const injected = environment.getAnimation?.(lesson().id);
    const animation = injected ? enrichLessonAnimation(injected) : enrichGlobalAnimation(createLessonAnimation(lesson(),generateExercise,paragraphs));
    activeCleanup = mountAnimation(element('panel-animation'), animation, {formatMath:math, audio:environment.getAudio?.(lesson().id), createWhiteboard:environment.createWhiteboard});
  }

  function renderView() {
    activeCleanup?.();
    activeCleanup = null;
    activeExercise = null;
    for (const view of VIEWS) {
      element(`panel-${view}`).hidden = view !== route.view;
      element(`panel-${view}`).replaceChildren();
      element(`tab-${view}`).setAttribute('aria-selected', String(view === route.view));
      element(`tab-${view}`).tabIndex = view === route.view ? 0 : -1;
    }
    ({theory:renderTheory, lab:renderLab, practice:renderPractice, animation:renderAnimation})[route.view]();
    icons();
  }

  function updateRoute() {
    const hash = overview ? '#inicio' : `#${route.lessonId}/${route.view}`;
    if (history?.replaceState) history.replaceState(null, '', hash);
    else location.hash = hash;
  }

  function navigate(lessonId, view = route.view, focus = true) {
    if (disposed || !LESSONS.some(item => item.id === lessonId) || !VIEWS.includes(view)) return false;
    overview = false;
    element('courseOverview').hidden = true;
    element('lessonContent').hidden = false;
    const changed = lessonId !== route.lessonId;
    route = {lessonId, view};
    if (changed) { practiceType = null; practiceSource = null; pdfExerciseId = null; seed = FIRST_PRACTICE_SEED; mode = 'observe'; }
    const current = lesson();
    element('unitLabel').textContent = `${current.unit.number === 0 ? 'Puente' : `Tema ${current.unit.number}`} · ${current.unit.title}`;
    element('lessonTitle').textContent = current.title;
    element('lessonSubtitle').textContent = `${current.objectives[0]} · Lectura y práctica orientativas: ${current.duration} min`;
    element('lessonReference').textContent = current.unit.number === 0 ? `Apoyo opcional: ${current.source.section}. No corresponde a un quinto PDF.` : `En tu PDF: ${current.source.document} · ${current.source.section}. Las referencias son secciones, no números de página.`;
    document.title = `${current.title} · Inferencia`;
    const index = LESSONS.findIndex(item => item.id === lessonId);
    element('previousLesson').disabled = index === 0;
    element('nextLesson').disabled = index === LESSONS.length - 1;
    element('lessonPosition').textContent = `Lección ${index + 1} de ${LESSONS.length}`;
    renderNav();
    renderView();
    updateRoute();
    if (focus) element('workspace').focus?.({preventScroll:true});
    element('sidebar').classList.remove('is-open');
    element('menuToggle').setAttribute('aria-expanded', 'false');
    return true;
  }

  function showOverview() {
    if (disposed) return;
    overview = true;
    activeCleanup?.();
    activeCleanup = null;
    activeExercise = null;
    element('lessonContent').hidden = true;
    const home = element('courseOverview');
    home.hidden = false;
    home.innerHTML = `<header class="course-introduction"><h1>Inferencia estadística</h1><p>De los sucesos a las distribuciones de varias variables, con ejemplos de biología.</p><p>El puente matemático es un apoyo opcional.</p><button type="button" class="primary-button" data-lesson="proporciones"><i data-lucide="book-open" aria-hidden="true"></i>Comenzar con las bases</button><button type="button" class="text-button" data-lesson="sucesos"><i data-lucide="arrow-right" aria-hidden="true"></i>Empezar el Tema 1</button></header><section class="course-orientation"><h2>Recorrido y correspondencia con los PDF</h2><p>El orden sigue las dependencias de aprendizaje, no página por página.</p>${COURSE.units.map(unit => `<details class="curriculum-unit"${unit.number === 1 ? ' open' : ''}><summary>${unit.number ? `Tema ${unit.number}` : 'Apoyo opcional'} · ${escapeHtml(unit.title)}</summary><p>${escapeHtml(unit.description)}</p><ol>${unit.lessons.map(item => `<li><button type="button" class="curriculum-link" data-lesson="${item.id}">${escapeHtml(item.title)}</button><span class="curriculum-reference">${escapeHtml(item.source.section)}</span></li>`).join('')}</ol></details>`).join('')}</section>`;
    document.title = 'Inferencia estadística · Inicio y mapa del curso';
    renderNav();
    icons();
    updateRoute();
    element('sidebar').classList.remove('is-open');
    element('menuToggle').setAttribute('aria-expanded', 'false');
  }

  function openDialog(title, content) {
    element('dialogTitle').textContent = title;
    element('dialogContent').innerHTML = content;
    const dialog = element('utilityDialog');
    if (!dialog.open) {
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    icons();
  }

  function closeDialog() {
    const dialog = element('utilityDialog');
    if (dialog.close) dialog.close();
    else dialog.removeAttribute('open');
  }

  listen(element('courseSearch'), 'input', renderNav);
  listen(element('courseNav'), 'click', event => {
    const button = event.target.closest('[data-lesson]');
    if (button) navigate(button.dataset.lesson, overview ? 'theory' : route.view);
  });
  listen(element('overviewToggle'), 'click', showOverview);
  listen(element('lessonTabs'), 'click', event => {
    const button = event.target.closest('[data-view]');
    if (button) navigate(route.lessonId, button.dataset.view, false);
  });
  listen(element('lessonTabs'), 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = VIEWS.indexOf(route.view);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? VIEWS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + VIEWS.length) % VIEWS.length;
    navigate(route.lessonId, VIEWS[nextIndex], false);
    element(`tab-${VIEWS[nextIndex]}`).focus?.();
  });
  listen(element('workspace'), 'click', event => {
    const lessonButton = event.target.closest('[data-lesson]');
    if (lessonButton) navigate(lessonButton.dataset.lesson, 'theory');
    const button = event.target.closest('[data-open-view]');
    if (button) navigate(route.lessonId, button.dataset.openView, false);
  });
  listen(element('previousLesson'), 'click', () => { const index = LESSONS.indexOf(lesson()); if (index > 0) navigate(LESSONS[index - 1].id); });
  listen(element('nextLesson'), 'click', () => { const index = LESSONS.indexOf(lesson()); if (index < LESSONS.length - 1) navigate(LESSONS[index + 1].id); });
  listen(element('menuToggle'), 'click', () => {
    const open = element('sidebar').classList.toggle('is-open');
    element('menuToggle').setAttribute('aria-expanded', String(open));
  });
  listen(element('dialogClose'), 'click', closeDialog);
  listen(element('utilityDialog'), 'click', event => {
    if (event.target === element('utilityDialog')) closeDialog();
  });
  listen(element('glossaryToggle'), 'click', () => openDialog('Diccionario de símbolos', `<table class="symbol-table"><thead><tr><th>Símbolo</th><th>Nombre</th><th>Significado</th></tr></thead><tbody>${COURSE.glossary.map(item => `<tr><td>${escapeHtml(item.symbol)}</td><td>${escapeHtml(item.term)}</td><td>${escapeHtml(item.definition)}</td></tr>`).join('')}</tbody></table>`));
  listen(element('sourcesToggle'), 'click', () => openDialog('Materiales y cobertura', `<p>36 lecciones originales organizadas a partir de los cuatro temas aportados. El puente matemático es material adicional. La numeración de los ejercicios de multivariantes no coincide con la del Tema 4.</p>${COURSE.coverage.map(item => `<section><h3>${escapeHtml(item.document)}</h3><ul class="coverage-list">${item.topics.map(topic => `<li>${escapeHtml(topic)}</li>`).join('')}</ul></section>`).join('')}<section><h3>Práctica y fuentes</h3><p>El banco resuelve los 22 problemas de los tres solucionarios. El tema 5 desarrolla los tres ejercicios de la PEC 1, con todos sus apartados y visualizaciones adicionales. La práctica extra ofrece variantes didácticas. Los documentos originales están disponibles en Materiales.</p><p>Las ampliaciones se distinguen del temario aportado. Las cifras de los ejemplos propios son ficticias y las visualizaciones no son evidencia experimental. Las probabilidades se calculan con jStat 1.9.6; las fórmulas se representan con KaTeX.</p></section>`));
  listen(element('panel-practice'), 'change', event => {
    if (event.target.id === 'exerciseSource') { practiceSource = event.target.value; if (practiceSource === 'pdf') { mode = 'observe'; entireBank = false; } renderPractice(); icons(); }
    if (event.target.id === 'pdfExercise') { pdfExerciseId = event.target.value; renderPractice(); icons(); }
    if (event.target.id === 'exerciseType') { practiceType = event.target.value; seed = FIRST_PRACTICE_SEED; renderPractice(); icons(); }
    if (event.target.id === 'practiceMode') { mode = event.target.value; renderPractice(); icons(); }
    if (event.target.id === 'entireBank') { entireBank = event.target.checked; renderPractice(); icons(); }
  });
  listen(element('panel-practice'), 'click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'newExercise') {
      if (activeExercise?.type === 'pdf') {
        const exercises = getPdfExercises(lesson().id);
        pdfExerciseId = exercises[(exercises.findIndex(exercise => exercise.id === pdfExerciseId)+1)%exercises.length].id;
      } else seed = seed === 4294967295 ? FIRST_PRACTICE_SEED : seed + 1;
      renderPractice(); icons();
    }
    if (button.dataset.solutionStep) {
      const solution = button.closest('[data-solution]');
      const steps = Array.from(solution.querySelectorAll('[data-worked-step]'));
      const next = Math.max(0, Math.min(steps.length - 1, Number(solution.dataset.step || 0) + Number(button.dataset.solutionStep)));
      solution.dataset.step = String(next);
      steps.forEach((step, index) => {
        step.hidden = index > next;
        if (index === next) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      solution.querySelector('[data-step-position]').textContent = `Paso ${next + 1} de ${steps.length}`;
      solution.querySelector('[data-solution-step="-1"]').disabled = next === 0;
      solution.querySelector('[data-solution-step="1"]').disabled = next === steps.length - 1;
      solution.querySelector('.interpretation').hidden = next < steps.length - 1;
    }
    if (button.dataset.hint) element(`hint-${button.dataset.hint}`).hidden = false;
  });
  listen(element('panel-practice'), 'submit', event => {
    const form = event.target.closest('[data-grade-form]');
    if (!form || !activeExercise) return;
    event.preventDefault();
    if (mode === 'observe' || activeExercise.type === 'pdf') return;
    const question = activeExercise.questions.find(item => item.id === form.dataset.gradeForm);
    const result = gradeAnswer(question, element(`answer-${question.id}`).value);
    const feedback = element(`feedback-${question.id}`);
    feedback.hidden = false;
    feedback.className = `feedback ${result.correct ? 'correct' : 'incorrect'}`;
    feedback.textContent = `${result.feedback}${result.correct ? ` ${question.interpretation}` : ''}`;
  });
  if (environment.manageHistory !== false) listen(window, 'hashchange', () => {
    if (!location.hash || location.hash === '#inicio') { showOverview(); return; }
    const next = parseRoute(location.hash);
    navigate(next.lessonId, next.view);
  });
  if (overview) showOverview();
  else navigate(route.lessonId, route.view, false);
  return {navigate, setView:view => navigate(route.lessonId, view, false), get route(){return {...route};}, get exercise(){return activeExercise;}, dispose(){
    if (disposed) return;
    disposed = true;
    activeCleanup?.();
    listeners.forEach(remove => remove());
    closeDialog();
  }};
}

if (typeof document !== 'undefined' && document.getElementById('courseNav')) {
  try { mountAula(document); }
  catch (error) {
    const status = document.getElementById('appStatus');
    if (status) status.textContent = `No se pudo iniciar el aula: ${error.message}. Recarga la página para volver a intentarlo.`;
  }
}