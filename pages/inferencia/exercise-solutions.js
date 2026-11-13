import {COURSE} from './course.js';
import {generateExercise, scopeExercise} from './exercises.js';
import {getPdfExercises} from './pdf-exercises.js';
import {getCapstoneExercises} from './capstone.js';
import {exerciseNarration} from './exercise-narration.js';
import {storyScene} from './lecture-story.js';
import {mountAnimation} from './animations.js';
import {gradeAnswer} from './exercises.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const speechOwners=new WeakMap();

const writtenObjectives=new Map([
  [['union'], 'Buscamos la probabilidad de que ocurra al menos uno de los dos sucesos. También cuentan los casos en que ocurren ambos, pero cada resultado debe contarse una sola vez.'],
  [['neither'], 'Buscamos los resultados en los que no ocurre ninguno de los dos sucesos. No basta con que falte uno: deben faltar los dos a la vez.'],
  [['proportion','last-share'], 'Se pide qué parte del total representa el grupo indicado. La respuesta es una proporción, no el número de elementos de ese grupo.'],
  [['micrograms'], 'Se pide expresar la misma cantidad de nutriente en microgramos. Cambiamos la unidad de medida, no la cantidad física.'],
  [['constant','normalizer','f-constant'], 'Buscamos la constante que convierte los pesos o la función del enunciado en una distribución válida. La probabilidad total debe ser uno y las probabilidades o la densidad deben ser no negativas.'],
  [['value'], 'Se pide la salida de la función para la entrada indicada. Hay que distinguir el valor que introducimos del valor que devuelve la regla.'],
  [['sum'], 'Se pide sumar las salidas de la función en las entradas indicadas. No se suman las entradas ni se evalúa la función en la suma de ellas.'],
  [['cdf','b-cdf','f-cdf'], 'Se pide la probabilidad acumulada: reúne los valores que no superan los límites indicados, incluyendo esos límites. Si se solicita la función completa, hay que describirla también fuera del soporte y por tramos; el valor pedido es solo una comprobación.'],
  [['strict'], 'Se pide la probabilidad de los valores estrictamente menores que el umbral. El propio umbral no forma parte del suceso.'],
  [['below','before'], 'Buscamos la probabilidad de que la variable no supere el umbral del enunciado. La respuesta describe todos los valores hasta ese límite, no solo el valor del límite.'],
  [['point','c-point','f-point'], 'Se pregunta por un valor exacto de una variable continua, no por un intervalo a su alrededor. Es importante distinguir esa probabilidad de la altura de la densidad en el mismo punto.'],
  [['c-height','f-height','marginal-density'], 'Se pide el valor de una densidad en el punto indicado. Es una altura de la función, no una probabilidad puntual ni el área de un intervalo.'],
  [['interval','90-to-120','d-six-to-twelve','f-six-to-twelve'], 'Buscamos la probabilidad de que la variable quede entre los dos límites indicados. En un modelo continuo corresponde al área de ese intervalo dentro del soporte, no a la altura de la curva.'],
  [['mean','e-mean','f-mean','mean-failures'], 'Se pide la esperanza: el valor medio que obtendríamos al repetir muchas veces el experimento. No tiene por qué coincidir con un resultado posible ni con el valor más frecuente.'],
  [['variance','e-variance','f-variance'], 'Se pide medir cuánto se dispersa la variable alrededor de su esperanza. La varianza se expresa en unidades al cuadrado y no es lo mismo que la desviación típica.'],
  [['remaining'], 'Con la primera coordenada ya fijada, se pide el mayor valor permitido para la segunda. Buscamos el límite del reparto compatible con la capacidad total.'],
  [['area'], 'Se pide el área de todos los repartos permitidos, representados como una región del plano. No se pide la longitud de su frontera ni el área del rectángulo que la contiene.'],
  [['unordered'], 'Se pide contar grupos distintos sin repetir elementos. Elegir los mismos elementos en otro orden no crea un grupo nuevo.'],
  [['ordered'], 'Se pide contar asignaciones de elementos distintos a posiciones identificadas. Ahora intercambiar dos posiciones sí produce una asignación diferente.'],
  [['with-repetition'], 'Se pide contar secuencias de etiquetas en posiciones identificadas. Una misma etiqueta puede aparecer varias veces, por lo que elegirla no la elimina de las opciones siguientes.'],
  [['all-ordered'], 'Se pide contar las ordenaciones de todos los elementos distintos del lote. Se utiliza cada elemento exactamente una vez y el orden sí importa.'],
  [['repeated-labels'], 'Se pide contar secuencias usando todas las etiquetas, incluidas las repetidas. Intercambiar etiquetas idénticas no genera una secuencia diferente.'],
  [['recovery-given-treatment'], 'Buscamos la proporción de recuperados dentro del grupo tratado. La información de haber recibido tratamiento restringe el total de referencia a ese grupo.'],
  [['treatment-given-recovery'], 'Buscamos la proporción de tratados dentro del grupo recuperado. Invertir la condición cambia el grupo de referencia: no es la misma pregunta que recuperarse tras recibir tratamiento.'],
  [['product'], 'Se pide la probabilidad que tendrían ambos sucesos a la vez si fueran independientes. Es una predicción bajo ese supuesto, que luego puede compararse con la intersección observada.'],
  [['given'], 'Se pide la probabilidad de A sabiendo que ocurre B. Solo se consideran los resultados de B y, dentro de ellos, los que también cumplen A.'],
  [['positive'], 'Buscamos la probabilidad de obtener un positivo antes de conocer el estado real. Deben contar tanto los positivos verdaderos como los falsos positivos.'],
  [['posterior'], 'Se pide la probabilidad de la condición real después de observar el resultado de la prueba. El grupo de referencia son quienes obtienen ese resultado, no quienes ya tienen la condición.'],
  [['vpp','vpp-20','vpp-80'], 'El valor predictivo positivo responde qué proporción de los resultados positivos corresponde a personas con la condición. No pregunta por la sensibilidad, que condiciona en el sentido contrario.'],
  [['vpn','vpn-20','vpn-80'], 'El valor predictivo negativo responde qué proporción de los resultados negativos corresponde a personas sin la condición. No pregunta por la especificidad, que parte de saber que no tienen la condición.'],
  [['transformed-mean'], 'Se pide la esperanza de la variable transformada: primero se eleva cada valor al cuadrado y después se calcula su promedio ponderado. No se pide elevar al cuadrado la esperanza original.'],
  [['jensen-gap'], 'Se pide comparar la esperanza del cuadrado con el cuadrado de la esperanza. La diferencia permite ver cuánto cambia el resultado al intercambiar una transformación no lineal y un promedio.'],
  [['exact','exact-three','exact-ten','approximate-ten'], 'Buscamos la probabilidad de un recuento exacto. Solo cuenta el número indicado, no todos los recuentos menores ni todos los mayores.'],
  [['at-most','at-most-two','at-most-ten'], 'Buscamos la probabilidad de un recuento como máximo igual al límite. Se incluyen todos los recuentos permitidos hasta ese límite y también el propio límite.'],
  [['strict-tail'], 'Buscamos la probabilidad de superar estrictamente el recuento indicado. El valor del límite queda excluido: la suma empieza en el siguiente recuento posible.'],
  [['at-least','at-least-one','at-least-fifteen','survivors'], 'Buscamos la probabilidad de alcanzar o superar el recuento indicado. El límite también cuenta; no se pide solamente la probabilidad de obtenerlo exactamente.'],
  [['first-success'], 'Se pide que el primer éxito ocurra precisamente en el ensayo indicado. Todos los ensayos anteriores deben ser fracasos y el último debe ser un éxito.'],
  [['more-trials'], 'Se pide necesitar más ensayos que el número indicado para obtener el primer éxito. Eso significa que al terminar esos ensayos aún no ha ocurrido ningún éxito.'],
  [['survival','d-over-two','f-over-two','c-gt','f-gt'], 'Buscamos la probabilidad de que el tiempo o la medida supere el umbral. Es la parte que queda a la derecha del límite, no la probabilidad acumulada a su izquierda.'],
  [['c-ge','f-ge'], 'Buscamos la probabilidad de que la variable alcance o supere el umbral. El enunciado incluye la igualdad; en un modelo continuo, incluir un punto aislado no cambia el área.'],
  [['under-120','d-under-six','f-under-six'], 'Buscamos la proporción de valores por debajo del umbral. Si el enunciado utiliza otra unidad de tiempo o pide un porcentaje, hay que conservar el mismo suceso al cambiar su expresión.'],
  [['memoryless'], 'Se pide la probabilidad de seguir esperando un tiempo adicional, sabiendo que el evento todavía no ha ocurrido. La condición es la espera ya transcurrida; no se trata de una espera nueva sin información.'],
  [['quantile','median','p25','cutoff'], 'Se pide un valor de la variable que deje la proporción indicada a su izquierda. La probabilidad es el dato de partida y el umbral es la incógnita, al contrario que en un cálculo de área.'],
  [['sufficient-statistic'], 'Se pide resumir la muestra mediante el estadístico que conserva la información sobre el parámetro cuando el tamaño muestral es fijo. No se pide todavía estimar el parámetro.'],
  [['mle'], 'Se pide el valor del parámetro que hace más verosímil la muestra observada. Los datos permanecen fijos mientras se comparan los posibles valores del parámetro.'],
  [['log-likelihood'], 'Se pide evaluar la log-verosimilitud en el parámetro indicado, usando logaritmos naturales y todos los términos solicitados. Es el valor de una función, no una probabilidad ni un nuevo estimador.'],
  [['cell'], 'Buscamos la probabilidad de una pareja exacta de valores simultáneos. En la tabla conjunta corresponde a una sola celda, no a toda su fila ni a toda su columna.'],
  [['region'], 'Buscamos la probabilidad de todas las parejas que cumplen a la vez los límites indicados. La región puede reunir varias celdas de la tabla; no basta con elegir una sola.'],
  [['marginal-a','marginal-y','marginal','marginal-tail'], 'Se pregunta por una sola variable sin imponer un valor a la otra. Hay que reunir todos los resultados de la variable que no se restringe para obtener la marginal.'],
  [['conditional-y','conditional-tail'], 'Se pregunta por una variable después de fijar información sobre la otra. La distribución relevante es la condicional: cambia la referencia y no puede sustituirse sin más por la marginal.'],
  [['sum-event','reduction'], 'Buscamos la probabilidad de todas las parejas de valores que cumplen la desigualdad indicada. Primero hay que reconocer esa región dentro del soporte conjunto, no integrar todo el soporte.'],
  [['conditional-density'], 'Se pide la altura de la densidad condicional en el punto dado, fijando la otra coordenada. No es una probabilidad puntual; el corte debe normalizarse con la marginal de la condición.'],
  [['conditional-mean'], 'Se pide el centro de la distribución de una variable cuando conocemos el valor de la otra. Es una esperanza condicional, que puede diferir de la media sin esa información.'],
  [['conditional-sd'], 'Se pide la desviación típica de la distribución condicional. Mide dispersión en las unidades originales; si se obtiene primero una varianza, todavía hay que tomar su raíz cuadrada.'],
  [['factorization-gap','independence-check'], 'Se pide comparar una probabilidad conjunta con el producto de sus marginales. Una discrepancia refuta la independencia; una coincidencia en una sola pareja no basta para demostrarla.'],
  [['covariance'], 'Se pide medir cómo varían conjuntamente las dos variables mediante su covarianza. Su signo describe asociación lineal, pero una covarianza nula no demuestra independencia en general.'],
  [['correlation','impossible-rho'], 'Se pide la correlación, que expresa la asociación lineal sin unidades. Debe quedar entre menos uno y uno; un valor fuera de ese rango señala datos incompatibles.'],
  [['pmf'], 'Se pide construir la distribución completa de los valores posibles de X. El valor puntual solicitado sirve para comprobar una entrada, pero no sustituye a la tabla de probabilidades.'],
  [['joint'], 'Se pide construir la masa conjunta completa: asignar una probabilidad a cada pareja posible. La celda indicada sirve como comprobación, no como sustituto de toda la tabla.'],
  [['a-area'], 'Se pide verificar que la función puede ser una densidad: debe ser no negativa y tener área total uno. Calcular el área por sí solo no comprueba la condición de signo.'],
  [['approximation-error','binomial-check'], 'Se pide comparar dos modelos calculando la diferencia absoluta entre las probabilidades correspondientes. Si se solicitan varios valores, hay que compararlos todos antes de informar la mayor diferencia.'],
  [['false-positive'], 'Se pide la proporción de personas sanas que la regla clasifica como diabéticas. El grupo de referencia son los sanos, no todos los clasificados como diabéticos.'],
  [['healthy-count-factor'], 'Se pide expresar un recuento como función del número total de sanos. La incógnita es la proporción que multiplica ese total, no un número de personas para un tamaño de población inventado.'],
  [['six-and-six'], 'Se pide la probabilidad de una selección con seis elementos de cada grupo. El muestreo es sin reemplazo: se cuentan grupos posibles, no ensayos con probabilidad constante.'],
  [['self'], 'Se pide la covarianza de una variable consigo misma. Hay que reconocer que mide su propia dispersión, en lugar de la asociación entre dos medidas distintas.'],
  [['maximum'], 'Se pide la mayor covarianza compatible con las dispersiones dadas. No cualquier número es posible: la correlación limita la intensidad de la asociación lineal.'],
  [['perfect-relation'], 'Se pide la relación lineal exacta que corresponde a la covarianza máxima. Deben determinarse pendiente y término independiente; el número introducido solo comprueba este último.'],
  [['difference-mean'], 'Se pide la esperanza de la diferencia de dos recuentos para un tamaño general y después su valor en el caso indicado. No se pide la esperanza de cada recuento por separado.'],
  [['difference-variance'], 'Se pide la dispersión de la diferencia de dos recuentos para un tamaño general y después su valor en el caso indicado. Como comparten un total, no se puede ignorar su covarianza.']
].flatMap(([ids,explanation])=>ids.map(id=>[id,explanation])));

const contextualObjectives={
  'pdf-u1-1':{
    a:writtenObjectives.get('union'),
    b:'Se pide la probabilidad de que no ocurra A, independientemente de si ocurre B. El complemento reúne todos los resultados que quedan fuera de A.',
    c:'Se pide que ocurra B pero no A. Los casos en que ocurren ambos quedan excluidos, aunque sí pertenezcan a B.',
    d:'Se pide que ocurra A pero no B. Es la parte exclusiva de A, no toda la probabilidad de A ni el complemento de B completo.',
    e:writtenObjectives.get('neither')
  },
  'pdf-u1-2':{
    a:'Se pide la probabilidad de tener una o más de las tres enfermedades. Las combinaciones con varias enfermedades cuentan, pero ninguna persona debe contarse más de una vez.',
    b:'Se pide tener A y no tener ninguna de las otras dos enfermedades. La palabra solo excluye tanto los solapamientos dobles como el triple.',
    c:'Se pide tener B o C, o ambas, pero en ningún caso A. Hay que conservar el solapamiento entre B y C cuando no pertenece a A.',
    d:'Se pide cumplir al menos una de dos condiciones: tener A, o no tener ni B ni C. Estas condiciones pueden coincidir, por lo que sus probabilidades no se suman sin revisar el solapamiento.'
  },
  'pdf-u1-3':{
    a:'Se pide la probabilidad global de un resultado negativo, sin conocer el diagnóstico. Hay que considerar las distintas situaciones diagnósticas y su peso en la población.',
    'b-A':'Se pide la probabilidad del diagnóstico A entre quienes obtienen un positivo. No se pregunta por la probabilidad de un positivo entre quienes tienen A.',
    'b-B':'Se pide la probabilidad del diagnóstico B entre quienes obtienen un positivo. La referencia incluye todos los positivos, también los debidos a otros diagnósticos.'
  },
  'pdf-u3-8':{
    joint:'Se pide la probabilidad de tres recuentos simultáneos con total fijo. Cada recorrido pertenece a una sola categoría, por lo que los recuentos no pueden tratarse como tres variables independientes.'
  },
  'capstone-pec1-1':{
    a:'Se pide la probabilidad de que ambos descendientes sean portadores entre las parejas compatibles con el aviso existencial. Saber que al menos uno es portador de lunes no identifica de antemano a un descendiente concreto.',
    b:'Se pide la probabilidad de que sea portador el descendiente no elegido, después de observar al elegido. La selección ocurre antes de mirar los resultados y forma parte del mecanismo de información.',
    c:'Se pide explicar por qué los dos mecanismos de aviso seleccionan y ponderan las parejas de forma distinta. La respuesta debe comparar la información recibida, no limitarse a repetir las dos probabilidades.'
  },
  'capstone-pec1-2':{
    a:'Se pide la probabilidad de una placa sin colonias. Es un recuento exacto de cero, no la probabilidad de un recuento próximo al promedio.',
    'a-tail':writtenObjectives.get('at-least'),
    b:'Se pide que el total de colonias de cinco placas no supere cinco. El límite afecta a la suma, no a cada placa por separado.',
    'c.i':'Se pide actualizar la probabilidad de procedencia de la primera placa al observar cuatro colonias. Deben compararse las dos incubadoras, ponderando su frecuencia previa y lo compatible que es ese recuento con cada una.',
    'c.ii':'Se pide predecir cero colonias en una placa nueva de la misma incubadora desconocida. La primera observación informa sobre esa procedencia compartida y debe incorporarse antes de hacer la predicción.'
  },
  'capstone-pec1-3':{
    'a-distribution':'Se pide describir toda la distribución de Y al fijar X, no solo una probabilidad. La respuesta debe identificar su familia, media, varianza y desviación típica, distinguiendo estas dos últimas.',
    a:'Se pide la probabilidad de que Y supere el umbral después de fijar X en el valor indicado. Hay que usar el centro y la dispersión de la normal condicional, no los de la marginal de Y.',
    b:'Se pide obtener la distribución de la diferencia entre las medidas y usarla para saber cuándo Y supera a X. La desigualdad equivale a una diferencia positiva y su dispersión depende de la covarianza.',
    'c-covariance':'Se pide calcular la covarianza de las medidas originales para valorar su independencia. En este modelo conjuntamente normal, la relación entre covarianza e independencia sí permite una conclusión específica.',
    c:'Se pide elegir el coeficiente que elimina de Y su asociación con X en la nueva variable. La independencia se justifica con la normalidad conjunta, no solo con una regla válida para cualquier distribución.',
    'c-reason':'Se pide justificar la dependencia de las medidas originales y la independencia tras la transformación. La explicación debe vincular la covarianza con la normalidad conjunta; una covarianza nula no bastaría en un modelo general.',
    d:'Se pide la probabilidad de obtener simultáneamente los tres recuentos de individuos en categorías excluyentes. Los individuos son independientes, pero los recuentos comparten el total de diez.',
    e:'Se pide aproximar la probabilidad de alcanzar al menos el recuento indicado en una muestra de cuatrocientos individuos. La respuesta solicitada es una aproximación normal con corrección de continuidad, no la masa de un recuento exacto.'
  },
  multinomial:{exact:'Se pide la probabilidad de obtener simultáneamente los recuentos indicados en las tres categorías. Los ensayos son independientes, pero los recuentos comparten un total fijo.'}
};

function writtenObjective(exercise,question) {
  const objective=question.objective || contextualObjectives[exercise.id]?.[question.id] || contextualObjectives[exercise.type]?.[question.id] || writtenObjectives.get(question.id);
  if(!objective)throw new Error(`Falta explicar el objetivo de ${exercise.id}/${question.id}.`);
  return objective;
}

function writtenResult(question) {
  return question.answerText || (Number.isFinite(question.answer) ? `${Number(question.answer.toPrecision(7)).toString().replace('.', ',')} ${question.unit}` : question.interpretation);
}

export function compatibleCourseRecording(animation, recording, {aligned = false} = {}) {
  if (!animation?.steps?.length || !recording || recording.cueTiming !== (aligned ? 'forced-aligned' : 'measured')
    || recording.src !== `audio/${aligned ? 'aligned/' : ''}${animation.id}.mp3` || !Number.isFinite(recording.duration) || recording.duration <= 0
    || !Array.isArray(recording.scenes) || recording.scenes.length !== animation.steps.length) return false;
  if (aligned && (recording.temporary !== true || recording.listened !== false
    || typeof recording.needsReview !== 'boolean' || !/^[a-f0-9]{64}$/.test(recording.alignmentSha256))) return false;
  let previous = 0;
  return recording.scenes.every((scene, index) => {
    const step = animation.steps[index];
    const expected = step?.cues || [{text:step?.caption}];
    if (!Array.isArray(expected) || !expected.length || !scene || !Number.isFinite(scene.start) || !Number.isFinite(scene.end)
      || scene.start < previous || scene.end <= scene.start || scene.end > recording.duration
      || !Array.isArray(scene.cues) || scene.cues.length !== expected.length) return false;
    if (typeof step?.caption === 'string' && step.caption !== scene.cues.map(cue => cue?.text).join(' ')) return false;
    previous = scene.end;
    let cueEnd = scene.start;
    return scene.cues.every((cue, cueIndex) => {
      if (!cue || typeof cue.text !== 'string' || !cue.text.trim() || cue.text !== expected[cueIndex]?.text
        || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.start < cueEnd
        || cue.end <= cue.start || cue.end > scene.end) return false;
      cueEnd = cue.end;
      return true;
    });
  });
}

export function compatibleCourseVideo(animation, recording, video) {
  if (video?.silent === true) {
    if (!animation?.steps?.length || video.engine !== 'remotion' || video.sceneEngine !== 'native-svg'
      || video.complete !== true || video.narrationMode !== 'transcript' || video.cueTiming !== 'estimated'
      || video.id !== animation.id || video.src !== `videos/${animation.id}/video.mp4`
      || video.poster !== `videos/${animation.id}/poster.jpg` || video.fps !== 30
      || video.width !== 1280 || video.height !== 720 || !Number.isInteger(video.frames) || video.frames <= 0
      || !Number.isFinite(video.duration) || video.duration <= 0
      || Math.abs(video.frames / video.fps - video.duration) > 1 / video.fps + 1e-6
      || !Array.isArray(video.transcript?.scenes) || video.transcript.scenes.length !== animation.steps.length
      || video.audioSource || video.audioSha256 || video.voice || video.model) return false;
    const timeline = {...video.transcript, src:`audio/${animation.id}.mp3`, duration:video.duration, cueTiming:'measured'};
    return compatibleCourseRecording(animation, timeline);
  }
  const aligned = video?.publication === 'provisional-aligned';
  if (aligned) {
    if (video.complete !== true || video.sceneEngine !== 'native-svg' || video.narrationMode !== 'forced-aligned'
      || video.cueTiming !== 'forced-aligned' || video.temporary !== true || video.listened !== false
      || typeof video.needsReview !== 'boolean' || video.id !== animation?.id
      || video.alignmentSha256 !== video.alignment?.alignmentSha256
      || video.needsReview !== video.alignment?.needsReview) return false;
    recording = {...video.alignment, src:video.audioSource, sha256:video.alignment?.mp3Sha256};
  }
  if (!compatibleCourseRecording(animation, recording, {aligned}) || !video || video.engine !== 'remotion'
    || video.voice !== 'Puck' || video.model !== 'gemini-3.8-flash-tts'
    || video.audioSource !== recording.src || video.src !== `videos/${animation.id}/video.mp4`
    || video.poster !== `videos/${animation.id}/poster.jpg` || video.fps !== 30
    || video.width !== 1280 || video.height !== 720 || !Number.isInteger(video.frames) || video.frames <= 0
    || !Number.isFinite(video.duration) || video.duration <= 0 || Math.abs(video.duration - recording.duration) > 1 / video.fps + 1e-6
    || Math.abs(video.frames / video.fps - video.duration) > 1 / video.fps + 1e-6
    || !/^[a-f0-9]{64}$/.test(video.audioSha256)) return false;
  return ['audioSha256', 'canonicalSha256', 'voice', 'model'].every(key => recording[key] == null || recording[key] === video[key])
    && (recording.sha256 == null || recording.sha256 === video.audioSha256);
}

export function courseMediaUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/?$/, '/')}${path.replace(/^\/+/, '')}`;
}

export function createExerciseSpeech(owner,animation) {
  const view=owner.defaultView;
  const synthesis=view.speechSynthesis;
  if(!synthesis || !view.SpeechSynthesisUtterance)return null;
  const clock=owner.createElement('span');
  let offset=0;
  const cues=animation.steps.flatMap(step=>{
    const start=offset;offset+=step.duration;
    return step.cues.map(cue=>({...cue,start:start+cue.start,end:start+cue.end}));
  });
  let cursor=0;
  let paused=true;
  let utterance=null;
  let generation=0;
  const emit=type=>clock.dispatchEvent(new view.Event(type));
  const halt=()=>{
    generation++;utterance=null;
    if(speechOwners.get(synthesis)===clock){synthesis.cancel();speechOwners.delete(synthesis);}
    const wasPlaying=!paused;paused=true;if(wasPlaying)emit('pause');
  };
  const speak=()=>{
    if(paused)return;
    const cue=cues.find(item=>cursor>=item.start && cursor<item.end);
    if(!cue){cursor=offset;paused=true;utterance=null;emit('ended');return;}
    const token=++generation;
    utterance=new view.SpeechSynthesisUtterance(cue.text);
    utterance.lang='es-ES';utterance.rate=0.95;
    const voices=synthesis.getVoices();
    utterance.voice=voices.find(voice=>voice.lang==='es-ES' && /alvaro|álvaro|pablo|jorge|diego|microsoft|google/i.test(voice.name)) || voices.find(voice=>voice.lang.startsWith('es')) || null;
    utterance.onboundary=event=>{
      if(token!==generation || paused)return;
      cursor=cue.start+Math.min(0.98,event.charIndex/cue.text.length)*(cue.end-cue.start);emit('timeupdate');
    };
    utterance.onend=()=>{
      if(token!==generation || paused)return;
      const next=cues[cues.indexOf(cue)+1];cursor=next?.start ?? offset;utterance=null;emit('timeupdate');speak();
    };
    utterance.onerror=event=>{if(token===generation && !['canceled','interrupted'].includes(event.error)){halt();emit('error');}};
    synthesis.speak(utterance);
  };
  Object.defineProperties(clock,{
    currentTime:{get:()=>cursor,set:value=>{
      const wasPlaying=!paused;
      generation++;utterance=null;
      if(speechOwners.get(synthesis)===clock)synthesis.cancel();
      cursor=Math.max(0,Math.min(offset,Number(value)||0));
      const cue=cues.find(item=>cursor>=item.start && cursor<item.end);
      if(cue)cursor=cue.start;
      emit('seeking');
      if(wasPlaying){synthesis.resume();speak();}
    }},
    duration:{get:()=>offset},paused:{get:()=>paused}
  });
  clock.play=()=>{
    const other=speechOwners.get(synthesis);
    if(other && other!==clock)other.halt();
    speechOwners.set(synthesis,clock);
    paused=false;
    if(utterance)synthesis.resume();else {synthesis.cancel();synthesis.resume();speak();}
    emit('play');return Promise.resolve();
  };
  clock.pause=()=>{if(paused)return;paused=true;if(speechOwners.get(synthesis)===clock)synthesis.pause();emit('pause');};
  clock.halt=halt;
  const remove=clock.remove.bind(clock);
  clock.remove=()=>{halt();remove();};
  return clock;
}

export function lessonPractice(lesson) {
  return lesson.exerciseTypes.map(type => {
    const content = exercise => JSON.stringify([exercise.prompt, exercise.given, exercise.questions.map(question => question.prompt)]);
    const worked = content(scopeExercise(lesson, generateExercise(type, 1)));
    let seed = 2;
    let exercise = scopeExercise(lesson, generateExercise(type, seed));
    while (content(exercise) === worked && seed < 34) exercise = scopeExercise(lesson, generateExercise(type, ++seed));
    if (content(exercise) === worked) throw new Error(`No hay una práctica distinta para ${lesson.id}/${type}`);
    return {...exercise, id:`practica-${lesson.id}-${type}`, lessonIds:[lesson.id]};
  });
}

export function exerciseCatalogue() {
  return [...getPdfExercises(), ...getCapstoneExercises(), ...COURSE.units.flatMap(unit => unit.lessons.flatMap(lesson=>[
    ...lessonPractice(lesson),
    ...lesson.exerciseTypes.map(type=>({...scopeExercise(lesson,generateExercise(type,1)),id:`ejemplo-${lesson.id}-${type}-1`,lessonIds:[lesson.id]}))
  ]))];
}

export function exerciseAnimation(exercise, question) {
  const slug = question.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const parentLesson = `ejercicio-${exercise.id}`;
  const beats=exerciseNarration(exercise,question);
  return {
    id:`${parentLesson}--${slug}`, kind:'lecture', title:question.prompt,
    parentLesson, parentTitle:exercise.title, sectionId:slug, sourceSections:[question.prompt], optional:false,
    source:exercise.source || {document:'Práctica didáctica de la lección',section:exercise.title},
    steps:beats.map((beat,index) => {
      const scene=storyScene(beat.title || (index === 0 ? 'Planteamiento' : index === beats.length-1 ? 'Interpretación' : `Paso ${index}`), 'Resolución razonada', [beat]);
      if(beat.context)scene.visual.context=beat.context;
      return scene;
    })
  };
}

export function mountExercises(root, {exercises, lessonId, formatMath, audio, videos, createWhiteboard, baseUrl='/', renderExtra:extraMarkup=()=>'', renderIcons=()=>{}}) {
  const owner=root.ownerDocument;
  const renderExtra=(exercise,question)=>extraMarkup(exercise,question,formatMath);
  const lesson=COURSE.units.flatMap(unit=>unit.lessons).find(item=>item.id===lessonId);
  const listeners=[];
  const players=new Map();
  const failedVideos=new Set();
  let disposed=false;
  const listen=(target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
  const source=exercise=>{
    if(!exercise.source)return '';
    const {file,document,number,page,url}=exercise.source;
    const path=url || (file ? `materiales/${encodeURIComponent(file)}` : '');
    return `<p class="source-note">${path ? `<a href="${escape(baseUrl+path.replace(/^\//,'')+(page ? `#page=${page}` : ''))}">` : ''}${escape(file || document)} · Problema ${escape(number || '')}${page ? ` · Página ${escape(page)}` : ''}${path ? '</a>' : ''}</p>`;
  };
  root.classList.add('exercise-list');
  root.innerHTML=exercises.length ? exercises.map((exercise,exerciseIndex)=>`<article data-exercise="${escape(exercise.id)}"><h2>${exercise.source ? `Problema ${escape(exercise.source.number)} · ` : ''}${escape(exercise.title)}</h2>${source(exercise)}<p>${escape(exercise.prompt)}</p><ul class="exercise-givens">${exercise.given.map(value=>`<li>${escape(value)}</li>`).join('')}</ul>${exercise.questions.map((question,questionIndex)=>`<section class="exercise-question" data-exercise-question="${exerciseIndex}/${questionIndex}"><h3>${questionIndex+1}. ${escape(question.prompt)}</h3>${question.grading?.kind !== 'qualitative' && Number.isFinite(question.answer) ? `<form data-exercise-answer><label>Tu respuesta · ${escape(question.unit)}<input type="text" inputmode="decimal" autocomplete="off" required></label><button type="submit" class="text-button"><i data-lucide="check" aria-hidden="true"></i>Comprobar</button><p role="status" data-answer-feedback></p></form>` : ''}<details class="exercise-help"><summary>Ayudas, fórmulas y teoría</summary><p>${escape(question.hint)}</p>${exercise.assumptions.length ? `<h4>Supuestos</h4><ul>${exercise.assumptions.map(value=>`<li>${escape(value)}</li>`).join('')}</ul>` : ''}${lesson ? `<h4>${escape(lesson.title)}</h4>${lesson.formulas.filter(formula=>!formula.optional).map(formula=>`<div class="math">${formatMath(formula.tex)}</div><p>${escape(formula.reading)}. ${escape(formula.meaning)}</p>`).join('')}<p>${escape(lesson.source.document)} · ${escape(lesson.source.section)}</p>` : ''}</details><details data-animated-solution><summary>Resolución animada con narración</summary><div data-exercise-player></div></details><details data-written-solution><summary>Resolución escrita paso a paso</summary><div data-written-introduction><h4>Qué pide este apartado</h4><p>${escape(writtenObjective(exercise,question))}</p></div><ol class="written-solution-steps">${question.steps.map((step,index)=>`<li data-written-step><h4>${index+1}. ${escape(step.title)}</h4><p>${escape(step.explanation)}</p>${step.tex ? `<div class="math">${formatMath(step.tex)}</div>` : ''}</li>`).join('')}</ol><div data-written-conclusion><h4>Resultado e interpretación</h4><p>${escape(writtenResult(question))}</p>${question.interpretation && question.interpretation !== question.answerText ? `<p>${escape(question.interpretation)}</p>` : ''}${renderExtra(exercise,question)}</div></details></section>`).join('')}</article>`).join('') : '<p class="exercise-empty">No hay problemas del PDF asociados a esta lección.</p>';
  for(const section of Array.from(root.querySelectorAll('[data-exercise-question]'))) {
    const [exerciseIndex,questionIndex]=section.dataset.exerciseQuestion.split('/').map(Number);
    const exercise=exercises[exerciseIndex];
    const question=exercise.questions[questionIndex];
    const animated=section.querySelector('[data-animated-solution]');
    listen(animated,'toggle',()=>{
      if(disposed)return;
      if(!animated.hasAttribute('open')){players.get(animated)?.();players.delete(animated);return;}
      if(players.has(animated))return;
      const animation=exerciseAnimation(exercise,question);
      const recording=audio?.lessons?.[animation.id];
      const track=compatibleCourseRecording(animation,recording) ? recording : undefined;
      const video=videos?.lessons?.[animation.id];
      const host=animated.querySelector('[data-exercise-player]');
      const mountFallback=()=>{
        const narrator=track ? undefined : createExerciseSpeech(owner,animation);
        const cleanup=mountAnimation(host,animation,{formatMath,audio:track ? {...track,src:courseMediaUrl(baseUrl,track.src)} : undefined,narrator,createWhiteboard});
        if(!track && !narrator){const notice=owner.createElement('p');notice.className='animation-audio-error';notice.setAttribute('role','status');notice.textContent='La síntesis de voz española no está disponible en este navegador.';host.prepend(notice);}
        return cleanup;
      };
      let cleanup;
      let active=true;
      const identity=JSON.stringify([animation.id,video,track]);
      if(compatibleCourseVideo(animation,track,video) && !failedVideos.has(identity)) {
        const player=owner.createElement('video');
        player.setAttribute('controls','');player.setAttribute('playsinline','');player.setAttribute('preload','metadata');
        player.setAttribute('poster',courseMediaUrl(baseUrl,video.poster));player.setAttribute('aria-label',video.title || animation.title);
        player.setAttribute('width',String(video.width));player.setAttribute('height',String(video.height));
        player.style.cssText='display:block;width:100%;height:auto;aspect-ratio:16/9;background:#000';
        const source=owner.createElement('source');
        source.setAttribute('src',courseMediaUrl(baseUrl,video.src));source.setAttribute('type','video/mp4');
        player.append(source);
        const transcript=owner.createElement('details');
        transcript.className='animation-transcript';
        const summary=owner.createElement('summary');summary.textContent='Transcripci\u00f3n';transcript.append(summary);
        for(const cue of (video.silent ? video.transcript : track).scenes.flatMap(scene=>scene.cues)) {
          const paragraph=owner.createElement('p');paragraph.textContent=cue.text;transcript.append(paragraph);
        }
        let native=true;
        const pause=()=>player.pause?.();
        const onHidden=()=>{if(owner.hidden)pause();};
        const fail=()=>{
          if(!active || !native)return;
          native=false;failedVideos.add(identity);cleanup();cleanup=mountFallback();renderIcons();
        };
        cleanup=()=>{
          player.removeEventListener('error',fail);source.removeEventListener('error',fail);owner.removeEventListener('visibilitychange',onHidden);
          pause();source.removeAttribute('src');player.removeAttribute('src');player.load?.();host.replaceChildren();
        };
        player.addEventListener('error',fail);source.addEventListener('error',fail);owner.addEventListener('visibilitychange',onHidden);
        host.replaceChildren(player,transcript);
      } else cleanup=mountFallback();
      players.set(animated,()=>{active=false;cleanup();});
      renderIcons();
    });
    const form=section.querySelector('[data-exercise-answer]');
    if(form)listen(form,'submit',event=>{
      event.preventDefault();
      const result=gradeAnswer(question,form.querySelector('input').value);
      const feedback=form.querySelector('[data-answer-feedback]');
      feedback.textContent=result.feedback;
      feedback.className=`feedback ${result.correct ? 'correct' : 'incorrect'}`;
    });
  }
  return ()=>{if(disposed)return;disposed=true;for(const dispose of players.values())dispose();players.clear();listeners.forEach(remove=>remove());root.replaceChildren();};
}