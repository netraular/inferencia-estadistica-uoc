export const EXERCISE_TYPES = [
  {id:'events', title:'Sucesos', description:'Unión, intersección y complemento en un cultivo.'},
  {id:'conditional', title:'Probabilidad condicionada', description:'Cambiar el denominador al seleccionar un subgrupo.'},
  {id:'bayes', title:'Teorema de Bayes', description:'Interpretar una prueba diagnóstica con su prevalencia.'},
  {id:'discrete', title:'Variable discreta', description:'Normalizar una masa de probabilidad y calcular momentos.'},
  {id:'continuous', title:'Variable continua', description:'Normalizar una densidad y distinguir altura de probabilidad.'},
  {id:'binomial', title:'Binomial', description:'Contar éxitos en ensayos independientes.'},
  {id:'poisson', title:'Poisson', description:'Contar eventos con una tasa constante.'},
  {id:'normal', title:'Normal', description:'Tipificar mediciones y calcular intervalos y cuantiles.'},
  {id:'uniform', title:'Uniforme', description:'Relacionar probabilidad con longitud de intervalos.'},
  {id:'exponential', title:'Exponencial', description:'Calcular esperas y aplicar la falta de memoria.'},
  {id:'geometric', title:'Geométrica', description:'Contar ensayos hasta el primer éxito, incluido ese ensayo.'},
  {id:'hypergeometric', title:'Hipergeométrica', description:'Muestrear una población finita sin reemplazo.'},
  {id:'gamma', title:'Gamma', description:'Sumar esperas exponenciales distinguiendo tasa y escala.'},
  {id:'chi-square', title:'Chi-cuadrado', description:'Estudiar la varianza de una muestra normal.'},
  {id:'student', title:'t de Student', description:'Estimar una media normal con desviación desconocida.'},
  {id:'fisher', title:'F de Fisher', description:'Comparar varianzas normales independientes.'},
  {id:'joint', title:'Distribución conjunta', description:'Obtener marginales y condicionales de una tabla.'},
  {id:'covariance', title:'Covarianza', description:'Medir asociación lineal sin confundirla con causalidad.'},
  {id:'independence', title:'Independencia', description:'Contrastar la factorización de probabilidades.'},
  {id:'transform', title:'Transformaciones', description:'Calcular una esperanza no lineal y entender Jensen.'},
  {id:'sample', title:'Muestreo iid', description:'Distinguir varianza poblacional, de la media y muestral.'},
  {id:'combinatorics', title:'Combinatoria', description:'Contar selecciones y ordenaciones con y sin repetición.'},
  {id:'negative-binomial', title:'Binomial negativa', description:'Contar fallos antes de alcanzar r éxitos, desde cero.'},
  {id:'cauchy', title:'Cauchy', description:'Calcular intervalos y mediana sin atribuir una media inexistente.'},
  {id:'weibull', title:'Weibull', description:'Distinguir forma y escala al calcular supervivencia y cuantiles.'},
  {id:'multinomial', title:'Multinomial', description:'Relacionar tres recuentos con total fijo, marginales y covarianza.'},
  {id:'bivariate-normal', title:'Normal bivariante', description:'Obtener media, desviación y cola de una normal condicional.'},
  {id:'continuous-joint', title:'Conjunta continua', description:'Normalizar un triángulo y calcular marginales, áreas y cortes condicionales.'},
  {id:'exponential-family', title:'Familia exponencial', description:'Factorizar una muestra Poisson y estimar su media por verosimilitud.'},
  {id:'proportions', title:'Proporciones y unidades', description:'Dividir una parte entre su total y convertir miligramos a microgramos.'},
  {id:'normalization', title:'Despejar una constante', description:'Aplicar la misma operación a ambos lados de una igualdad.'},
  {id:'function-values', title:'Leer una función', description:'Sustituir una entrada, sumar salidas y respetar los extremos.'},
  {id:'plane-regions', title:'Coordenadas y regiones', description:'Encontrar el límite de una coordenada y el área de un triángulo.'},
  {id:'event-independence', title:'Independencia de sucesos', description:'Comparar la probabilidad de ambos sucesos con el producto de sus probabilidades.'},
  {id:'cdf-table', title:'Tabla y probabilidad acumulada', description:'Sumar las probabilidades de los valores que no superan un umbral.'},
  {id:'joint-basic', title:'Leer una tabla conjunta', description:'Distinguir una celda de una región de una tabla de dos medidas.'}
];

const DECIMAL = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i;

export function parseAnswer(rawAnswer) {
  if (typeof rawAnswer === 'number') return Number.isFinite(rawAnswer) ? rawAnswer : null;
  if (typeof rawAnswer !== 'string') return null;
  let text = rawAnswer.trim();
  const percent = text.endsWith('%');
  if (percent) text = text.slice(0, -1).trim();
  const parts = text.split('/').map(part => part.trim());
  if (parts.length > 2 || !parts.every(part => DECIMAL.test(part))) return null;
  const numerator = Number(parts[0].replace(',', '.'));
  const denominator = parts.length === 2 ? Number(parts[1].replace(',', '.')) : 1;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const value = numerator / denominator / (percent ? 100 : 1);
  return Number.isFinite(value) ? value : null;
}

export function gradeAnswer(question, rawAnswer) {
  if (!question || !Number.isFinite(question.answer) || !Number.isFinite(question.tolerance) || question.tolerance < 0) {
    throw new TypeError('La pregunta necesita una respuesta finita y una tolerancia absoluta no negativa.');
  }
  const value = parseAnswer(rawAnswer);
  if (value === null) return {correct:false, feedback:'Introduce un número, una fracción simple o un porcentaje explícito; por ejemplo 0,25, 1/4 o 25%.', value:null};
  const rounding = question.tolerance === 0 ? 0 : Number.EPSILON * Math.max(Math.abs(value), Math.abs(question.answer), question.tolerance) * 4;
  const correct = Math.abs(value - question.answer) <= question.tolerance + rounding;
  return {correct, feedback:correct ? 'Correcto: el resultado está dentro de la tolerancia absoluta.' : `Revisa el cálculo. ${question.hint} Tolerancia absoluta: ${format(question.tolerance)} ${question.unit}.`, value};
}

function format(value) {
  return Number(value.toPrecision(7)).toString().replace('.', ',');
}

function randomSource(seed, typeId) {
  let state = seed >>> 0;
  for (const character of typeId) state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function step(title, explanation, tex) {
  return tex ? {title, explanation, tex} : {title, explanation};
}

function question(id, prompt, answer, unit, hint, steps, interpretation, tolerance = 0.005) {
  if (!Number.isFinite(answer)) throw new RangeError(`Respuesta no finita: ${id}. Comprueba jStat y los parámetros.`);
  return {id, prompt, answer, tolerance, unit, hint, steps, interpretation};
}

function probability(id, prompt, answer, hint, steps, interpretation) {
  if (answer < 0 || answer > 1) throw new RangeError(`Probabilidad fuera de [0,1]: ${id}.`);
  return question(id, prompt, answer, 'probabilidad entre 0 y 1', hint, steps, interpretation, 0.0005);
}

const METHODS = {
  events: 'El experimento elige una célula equiprobablemente. Por eso podemos convertir recuentos en probabilidades dividiendo entre el total; antes hay que corregir los solapamientos para contar cada célula una sola vez.',
  conditional: 'La información dada selecciona un subgrupo. La intersección indica los casos que cumplen las dos condiciones y el denominador reúne todos los casos de la condición conocida, no toda la población.',
  bayes: 'Infección y ausencia de infección son grupos disjuntos y exhaustivos. Primero ponderamos las probabilidades de la prueba por el tamaño de cada grupo. Para invertir la pregunta, dividimos la ruta de interés entre todas las rutas compatibles con lo observado.',
  discrete: 'Un peso expresa importancia relativa, no una probabilidad todavía. Sumamos los pesos y dividimos cada uno por ese total para obtener probabilidades que suman uno. Una masa es la probabilidad de un valor exacto.',
  continuous: 'La probabilidad continua es un área. Una integral suma altura por anchura y una primitiva permite evaluar esa acumulación entre dos límites. Normalizamos sobre todo el soporte antes de integrar la región solicitada.',
  binomial: 'Hay un número fijo de ensayos independientes con la misma probabilidad. Una secuencia con k éxitos tiene un producto de k factores p y n menos k factores de fracaso; el coeficiente binomial cuenta las posiciones equivalentes.',
  poisson: 'El parámetro lambda cuenta eventos esperados en la exposición especificada. La masa combina la exponencial negativa, la potencia de lambda y el factorial del recuento. Para una cola sumamos masas o usamos el complemento de la acumulada.',
  normal: 'Restar la media y dividir por la desviación típica traduce el umbral a desviaciones respecto al centro. Phi acumula la normal estándar; un intervalo resta dos acumuladas y una cola derecha usa el complemento. Un cuantil invierte esta operación.',
  uniform: 'La densidad es constante y el área total es uno. Por ello una probabilidad de intervalo es su longitud dentro del soporte dividida entre la longitud total. No incluimos partes exteriores al soporte.',
  exponential: 'La tasa es el inverso del tiempo medio. La supervivencia es la exponencial negativa de tasa por tiempo; la acumulada es su complemento. La carencia de memoria procede de un riesgo constante, no de una fecha fija para el evento.',
  geometric: 'La variable cuenta ensayos hasta el primer éxito, incluido el último. Para obtener k ensayos necesitamos k menos uno fracasos y un éxito final. No hay posiciones libres para ese último éxito; el soporte empieza en uno.',
  hypergeometric: 'La selección es uniforme y sin reemplazo. Contamos por separado los elementos de interés y los restantes con combinaciones, multiplicamos ambas elecciones y dividimos por todas las selecciones del tamaño solicitado.',
  gamma: 'Una suma de etapas exponenciales independientes con escala común es gamma. La forma cuenta las etapas enteras en este ejemplo; la escala estira sus tiempos. Una probabilidad requiere integrar la densidad mediante la acumulada, no evaluar su altura.',
  'chi-square': 'Este es un apoyo adicional de muestreo normal. El pivote de la varianza usa n menos uno grados de libertad porque la media se estima de la misma muestra; al reescalar los límites se puede consultar la acumulada chi-cuadrado.',
  student: 'Este es un apoyo adicional de muestreo normal con desviación desconocida. Dividimos la diferencia de medias por el error estándar estimado. El pivote sigue Student con n menos uno grados de libertad, no una normal estándar exacta.',
  fisher: 'Este es un apoyo adicional para muestras normales independientes. El cociente de varianzas normalizadas usa los grados de libertad de cada muestra por separado. Intercambiar numerador y denominador cambia la distribución y la cola.',
  joint: 'Cada celda es una pareja simultánea. Sumar una fila o columna elimina una variable y produce una marginal; dividir la celda por la marginal de la condición normaliza el subgrupo seleccionado.',
  covariance: 'La covarianza compara variación compartida: calculamos la esperanza del producto y restamos el producto de medias. La correlación divide además por las dos desviaciones, siempre que sean positivas; ninguna de las dos implica causalidad.',
  independence: 'La independencia exige que todas las masas conjuntas coincidan con productos de marginales. Una sola discrepancia basta para refutarla; una sola coincidencia no basta para demostrarla.',
  transform: 'Primero transformamos cada resultado y después ponderamos por su probabilidad original. Una operación no lineal, como elevar al cuadrado, no se puede aplicar simplemente a la media; se necesita calcular la esperanza de los valores transformados.',
  sample: 'Este es un apoyo adicional de muestreo iid. La media suma n observaciones con coeficiente uno entre n: la linealidad conserva la media y la independencia permite sumar varianzas escaladas por el cuadrado de ese coeficiente.',
  combinatorics: 'Antes de contar decidimos si importan las posiciones y si hay reemplazo. Multiplicar opciones cuenta secuencias; dividir por las reordenaciones de los elementos seleccionados elimina únicamente el orden que el experimento no distingue.',
  'negative-binomial': 'Contamos fracasos antes del éxito número r. El último ensayo es necesariamente un éxito; el coeficiente cuenta cómo colocar los r menos uno éxitos anteriores. El total de ensayos varía, a diferencia del diseño binomial.',
  cauchy: 'La acumulada de Cauchy se expresa mediante arctangentes y permite calcular intervalos y mediana. Sus colas impiden definir esperanza y varianza: la simetría no autoriza cancelar dos integrales divergentes.',
  weibull: 'La supervivencia eleva el tiempo relativo a la escala a la potencia de forma. Para un cuantil, deshacemos primero la exponencial con el logaritmo y después la potencia con una raíz. La escala tiene unidades de tiempo; la forma no.',
  multinomial: 'Las categorías son excluyentes y cubren cada ensayo. El factorial multinomial cuenta secuencias con esos recuentos y el producto de potencias pondera cada secuencia. Los ensayos son independientes, pero los recuentos comparten un total fijo.',
  'bivariate-normal': 'La normalidad conjunta permite obtener una normal condicional. Su media incorpora el desplazamiento de la medida conocida y su varianza se reduce por uno menos rho al cuadrado. Para tipificar usamos la raíz de esa varianza, no la varianza misma.',
  'continuous-joint': 'El soporte es un triángulo, no su rectángulo exterior. Un corte fija una coordenada y determina los límites de la otra; la integral doble normaliza todo el soporte. Una condicional divide el corte por su marginal positiva.',
  'exponential-family': 'Las observaciones Poisson independientes producen un producto de probabilidades. Su logaritmo convierte el producto en suma. Dejamos fijos los recuentos y buscamos qué media candidata da el mayor valor; derivar es una herramienta para localizar ese máximo.',
  proportions: 'Una proporción compara una parte con su propio total. Dividir conserva la comparación; multiplicar por cien solo cambia su escritura a porcentaje. En una conversión de unidades conservamos la cantidad física.',
  normalization: 'La igualdad funciona como una balanza: hacemos la misma operación en ambos lados. Primero sumamos los pesos y después dividimos ambos lados por esa suma para dejar sola la constante.',
  'function-values': 'Una función es una regla de entrada y salida. Primero localizamos la entrada permitida; después la sustituimos en la regla. Un sumatorio solo abrevia sumar varias de esas salidas.',
  'plane-regions': 'Las coordenadas describen un punto mediante dos números. Fijar la primera cantidad deja un máximo para la segunda. La frontera del triángulo expresa la capacidad total disponible.',
  'event-independence': 'A y B son dos condiciones que pueden cumplirse en el mismo resultado. Si fueran independientes, la probabilidad de ambas sería P(A) por P(B). Comparamos ese producto con la probabilidad de ambas que da el enunciado.',
  'cdf-table': 'La tabla da la probabilidad de cada valor exacto. La acumulada F(t) pregunta por todos los valores menores o iguales que t. Elegimos esas filas y sumamos sus probabilidades, sin sumar las etiquetas de las filas.',
  'joint-basic': 'Cada celda describe dos valores simultáneos. Antes de sumar, identificamos la fila de X, la columna de Y y las celdas que cumplen la condición. La coma dentro de P significa y, no o.'
};

function exercise(type, seed, prompt, given, assumptions, questions, visualType, params) {
  const developed = questions.map(item => ({...item, steps:[
    step('Identificar la pregunta y justificar el método', `${item.prompt} ${METHODS[type]} Para este apartado: ${item.hint}`),
    ...item.steps,
    step('Comprobar e interpretar', `El resultado es ${format(item.answer)} ${item.unit}. ${item.unit === 'probabilidad entre 0 y 1' ? 'Está entre cero y uno; si lo expresamos como porcentaje multiplicamos por cien, sin cambiar el suceso. ' : 'Revisamos que la respuesta use la unidad pedida y tenga sentido en el contexto. '}${item.interpretation}`)
  ]}));
  return {id:`${type}-${seed}`, type, title:EXERCISE_TYPES.find(item => item.id === type).title, prompt, given, assumptions, questions:developed, visual:{type:visualType, params}};
}

function statistics() {
  if (!globalThis.jStat) throw new Error('Se necesita globalThis.jStat (jStat 1.9.6), cargado antes de generar distribuciones.');
  return globalThis.jStat;
}

const generators = {
  proportions(seed, choose) {
    const total = choose([40, 60, 80]);
    const part = total * choose([0.1, 0.25, 0.5]);
    const milligrams = choose([2, 3, 5]);
    return exercise('proportions', seed, 'Un ensayo de germinación registra cuántas semillas germinan. Por separado, se prepara una cantidad de nutriente.',
      [`Se siembran ${total} semillas y germinan ${part}.`, `Se pesan ${milligrams} miligramos de nutriente; un miligramo contiene 1.000 microgramos.`],
      ['Las semillas germinadas forman parte de las sembradas.', 'Cambiar la unidad de masa no cambia la cantidad de nutriente.'], [
        probability('proportion', '¿Qué proporción de las semillas germinó?', part / total, 'El total son todas las semillas sembradas.', [
          step('Nombrar parte y total', `La parte son ${part} semillas germinadas y el total son ${total} sembradas.`),
          step('Dividir', `${part}/${total} = ${format(part / total)}. De cada cien semillas, la misma proporción equivale a ${100 * part / total}: ${100 * part / total} %.`)
        ], 'La proporción permite comparar ensayos con distinto número de semillas.'),
        question('micrograms', '¿Cuántos microgramos son la cantidad de nutriente indicada?', milligrams * 1000, 'microgramos', 'Cada miligramo equivale a mil microgramos.', [
          step('Elegir el factor', 'Pasamos a una unidad mil veces más pequeña: necesitamos mil veces más unidades.'),
          step('Multiplicar conservando la cantidad', `${milligrams} × 1.000 = ${milligrams * 1000} microgramos.`)
        ], 'El número aumenta, pero no hemos añadido nutriente.', 0)
      ], 'math', {total, part, milligrams});
  },

  normalization(seed, choose) {
    const weights = [2, 3, choose([4, 5, 7])];
    const total = weights.reduce((sum, value) => sum + value, 0);
    return exercise('normalization', seed, 'Tres estados de una muestra tienen pesos relativos. Multiplicamos cada peso por la misma constante c para que el total sea uno.',
      [`Pesos: ${weights.join(', ')}.`, `La igualdad es (${weights.join(' + ')}) × c = 1.`],
      ['Los pesos son positivos y no son aún proporciones.', 'La misma constante multiplica todos los pesos.'], [
        question('constant', '¿Cuánto debe valer c?', 1 / total, 'constante', 'Suma los pesos y divide ambos lados por ese total.', [
          step('Sumar primero', `${weights.join(' + ')} = ${total}, por lo que ${total} × c = 1.`),
          step('Hacer lo mismo en ambos lados', `Dividimos ambos lados entre ${total}: c = 1/${total} = ${format(1 / total)}. Si multiplicas por ${total}, recuperas uno.`)
        ], 'Despejar significa dejar sola la cantidad buscada sin alterar la igualdad.', 0.0005),
        probability('last-share', '¿Qué proporción corresponde al último estado?', weights[2] / total, 'Multiplica el último peso por c.', [
          step('Escalar el peso', `${weights[2]} × (1/${total}) = ${format(weights[2] / total)}.`),
          step('Revisar el total', `Las tres proporciones son ${weights.map(value => format(value / total)).join(', ')}. Sin redondear, suman ${total}/${total} = 1.`)
        ], 'Dividir todos los pesos por el mismo total conserva su importancia relativa.')
      ], 'math', {weights, total});
  },

  'function-values'(seed, choose) {
    const factor = choose([2, 3, 4]);
    const base = choose([1, 2, 5]);
    const input = choose([1, 2, 3]);
    return exercise('function-values', seed, 'Una regla didáctica transforma una dosis x en una señal g(x). No es una probabilidad ni un ajuste a datos reales.',
      [`g(x) = ${factor} × x + ${base}.`, `Se permiten entradas x entre 0 y 3, incluidos ambos extremos; entrada pedida: x = ${input}.`],
      ['Los paréntesis indican la entrada de la función.', 'Sumar salidas no significa sumar únicamente sus entradas.'], [
        question('value', '¿Qué salida produce la entrada indicada?', factor * input + base, 'unidades de señal', 'Sustituye x por la entrada y multiplica antes de sumar.', [
          step('Sustituir', `g(${input}) = ${factor} × ${input} + ${base}.`),
          step('Respetar el orden de operaciones', `Primero ${factor} × ${input} = ${factor * input}; después sumamos ${base}: ${factor * input + base}.`)
        ], 'La salida g(x) no es x: es el resultado de aplicar la regla.', 0),
        question('sum', '¿Cuánto vale g(0) + g(1) + g(2)?', 3 * factor + 3 * base, 'unidades de señal', 'Calcula las tres salidas por separado.', [
          step('Abrir la suma', `g(0) = ${base}; g(1) = ${factor + base}; g(2) = ${2 * factor + base}.`),
          step('Sumar los resultados', `${base} + ${factor + base} + ${2 * factor + base} = ${3 * factor + 3 * base}. Un sumatorio con índices 0, 1 y 2 abreviaría esta misma cuenta.`)
        ], 'El índice indica qué entrada usar en cada término.', 0)
      ], 'math', {factor, base, input});
  },

  'plane-regions'(seed, choose) {
    const capacity = choose([4, 6, 8]);
    const first = choose([1, 2, 3]);
    return exercise('plane-regions', seed, 'Se reparten miligramos de nutriente entre dos cultivos. x es la cantidad del primero e y la del segundo. Se permite dejar nutriente sin repartir.',
      [`Capacidad total: ${capacity} mg; x ≥ 0, y ≥ 0 y x + y ≤ ${capacity}.`, `Se fija x = ${first} mg. Los ejes del dibujo representan miligramos.`],
      ['No se pueden asignar cantidades negativas.', 'El límite es compartido: no se dispone de una capacidad completa para cada cultivo.'], [
        question('remaining', 'Con x fijado, ¿cuál es el máximo permitido de y?', capacity - first, 'miligramos', 'Resta lo que recibe el primer cultivo a la capacidad total.', [
          step('Usar la capacidad compartida', `${first} + y ≤ ${capacity}.`),
          step('Restar en ambos lados', `y ≤ ${capacity} − ${first} = ${capacity - first}. El segundo cultivo puede recibir entre cero y ${capacity - first} mg.`)
        ], 'El máximo de y cambia al cambiar x.', 0),
        question('area', '¿Qué área tiene la región triangular de todos los repartos permitidos?', capacity ** 2 / 2, 'miligramos al cuadrado', 'Un triángulo rectángulo tiene la mitad del área de su rectángulo.', [
          step('Identificar base y altura', `Sobre cada eje se puede llegar a ${capacity} mg. El rectángulo exterior tiene área ${capacity} × ${capacity} = ${capacity ** 2}.`),
          step('Tomar la mitad', `Área del triángulo: ${capacity ** 2}/2 = ${capacity ** 2 / 2}. Aún no hemos asignado probabilidades a esa región.`)
        ], 'Una región y su área se pueden entender antes de introducir una densidad.', 0)
      ], 'math', {capacity, first});
  },

  'event-independence'(seed, choose) {
    const probabilityA = choose([0.4, 0.5, 0.6]);
    const probabilityB = 0.5;
    const both = probabilityA * probabilityB + choose([0, 0.05, -0.05]);
    return exercise('event-independence', seed, 'A significa que una célula tiene marcador verde y B que tiene marcador rojo. Se conocen las probabilidades del modelo.',
      [`P(A) = ${format(probabilityA)}; P(B) = ${format(probabilityB)}.`, `P(A ∩ B), la probabilidad de ambos, vale ${format(both)}.`],
      ['Ambos marcadores pueden aparecer en la misma célula.', 'No se supone independencia: hay que comprobarla.'], [
        probability('product', 'Si A y B fueran independientes, ¿qué probabilidad tendrían ambos?', probabilityA * probabilityB, 'Multiplica las dos probabilidades individuales.', [
          step('Aplicar la condición de independencia', `El producto sería ${format(probabilityA)} × ${format(probabilityB)} = ${format(probabilityA * probabilityB)}.`),
          step('Comparar con el dato real', `El enunciado da ${format(both)} para ambos. ${Math.abs(both - probabilityA * probabilityB) < 1e-12 ? 'Coincide con el producto: estos dos sucesos son independientes en el modelo.' : 'No coincide con el producto: estos dos sucesos no son independientes.'}`)
        ], 'Independencia no significa que la probabilidad de ambos sea cero.'),
        probability('given', 'Entre las células con B, ¿qué probabilidad tiene A?', both / probabilityB, 'El grupo conocido es B: divide la probabilidad de ambos entre P(B).', [
          step('Cambiar el grupo de referencia', `P(A dado B) = ${format(both)}/${format(probabilityB)} = ${format(both / probabilityB)}.`),
          step('Relacionar las dos comprobaciones', `Sin conocer B, P(A) vale ${format(probabilityA)}. Si conocer B no cambia esa probabilidad, hay independencia.`)
        ], 'Esta comprobación usa solo sucesos y probabilidades, sin covarianzas.')
      ], 'events', {probabilityA, probabilityB, both});
  },

  'cdf-table'(seed, choose) {
    const first = choose([0.1, 0.2, 0.3]);
    const second = 0.4;
    const last = 1 - first - second;
    return exercise('cdf-table', seed, 'X cuenta brotes de una planta y solo puede valer 0, 2 o 5. Una tabla describe sus probabilidades.',
      [`P(X = 0) = ${format(first)}; P(X = 2) = 0,4; P(X = 5) = ${format(last)}.`, 'F(t) significa probabilidad de que X sea menor o igual que el umbral t.'],
      ['Las tres probabilidades son no negativas y suman uno.', 'Un umbral puede estar entre dos valores posibles sin ser una observación posible.'], [
        probability('cdf', '¿Cuánto vale F(3), la probabilidad de como máximo tres brotes?', first + second, 'Incluye las filas de cero y dos; excluye la de cinco.', [
          step('Elegir las filas', 'Cero y dos son menores o iguales que tres. Cinco no lo es.'),
          step('Sumar sus probabilidades', `${format(first)} + 0,4 = ${format(first + second)}. No añadimos una fila para tres: no es un resultado posible en este modelo.`)
        ], 'F(3) está definida aunque nunca se observen exactamente tres brotes.'),
        probability('strict', '¿Qué probabilidad hay de menos de dos brotes, sin incluir dos?', first, 'La condición estricta X < 2 solo admite cero en esta tabla.', [
          step('Leer el extremo', 'Menos de dos no incluye dos. El único valor permitido inferior a dos es cero.'),
          step('Tomar la masa correspondiente', `P(X < 2) = P(X = 0) = ${format(first)}.`)
        ], 'Incluir dos daría otra pregunta y otra probabilidad.')
      ], 'variable', {values:[0, 2, 5], probabilities:[first, second, last]});
  },

  'joint-basic'(seed, choose) {
    const cell = choose([0.1, 0.2, 0.3]);
    return exercise('joint-basic', seed, 'Se observan dos marcadores en la misma célula. X indica marcador verde e Y marcador rojo: uno significa presencia y cero ausencia.',
      [`Filas X = 0, 1; columnas Y = 0, 1. Tabla: [0,2; 0,3] y [${format(cell)}; ${format(0.5 - cell)}].`, 'Cada entrada es una probabilidad de dos valores simultáneos; las cuatro entradas suman uno.'],
      ['Las filas y las columnas tienen etiquetas distintas.', 'No se supone independencia entre los marcadores.'], [
        probability('cell', '¿Cuál es P(X = 1, Y = 0), verde presente y rojo ausente?', cell, 'Busca la fila X = 1 y la columna Y = 0.', [
          step('Localizar la celda', `La segunda fila es X = 1 y la primera columna es Y = 0: su entrada es ${format(cell)}.`),
          step('Leer la condición simultánea', 'La coma pide que se cumplan ambas condiciones en la misma célula. No sumamos una fila ni cambiamos el denominador.')
        ], 'Una celda conjunta no es una probabilidad condicionada.'),
        probability('region', '¿Cuál es P(X ≤ 0, Y ≤ 1), la acumulada en (0,1)?', 0.5, 'Marca las dos celdas de la primera fila.', [
          step('Traducir los umbrales', 'X ≤ 0 admite solo X = 0. Y ≤ 1 admite Y = 0 e Y = 1.'),
          step('Sumar las celdas elegidas', 'La primera fila suma 0,2 + 0,3 = 0,5.')
        ], 'Una acumulada conjunta reúne una región de celdas, no una única celda.')
      ], 'joint', {valuesX:[0, 1], valuesY:[0, 1], probabilities:[[0.2, 0.3], [cell, 0.5 - cell]]});
  },

  events(seed, choose) {
    const total = choose([100, 120, 160]);
    const countA = total * choose([0.4, 0.5, 0.6]);
    const countB = total * 0.3;
    const both = total * choose([0.1, 0.2]);
    const union = (countA + countB - both) / total;
    return exercise('events', seed, 'En un cultivo, A indica fluorescencia verde y B fluorescencia roja. Se elige una célula al azar.',
      [`${total} células en total.`, `${countA} presentan A, ${countB} presentan B y ${both} presentan ambos marcadores.`],
      ['Cada célula tiene la misma probabilidad de ser elegida.', 'Los grupos A y B pueden solaparse; no se supone independencia.'], [
        probability('union', '¿Cuál es P(A ∪ B), la probabilidad de presentar al menos un marcador?', union, 'Las células con ambos marcadores se han contado dos veces.', [
          step('Contar sin duplicar', `Sumamos los dos grupos y restamos el solapamiento: ${countA} + ${countB} - ${both} = ${countA + countB - both}.`, String.raw`|A\cup B|=|A|+|B|-|A\cap B|`),
          step('Convertir en probabilidad', `Dividimos por todas las células: ${countA + countB - both}/${total} = ${format(union)}.`)
        ], 'Incluye las células con uno o con los dos marcadores.'),
        probability('neither', '¿Cuál es la probabilidad de no presentar ninguno de los dos marcadores?', 1 - union, 'El complemento de al menos uno es ninguno.', [
          step('Tomar el complemento', `Los grupos con algún marcador y sin marcadores cubren todo el cultivo: 1 - ${format(union)} = ${format(1 - union)}.`, String.raw`P((A\cup B)^c)=1-P(A\cup B)`)
        ], 'No tener ninguno no es lo mismo que no tener ambos simultáneamente.')
      ], 'events', {total, countA, countB, both});
  },

  conditional(seed, choose) {
    const total = choose([100, 200, 300]);
    const treated = total * 0.4;
    const recoveredTreated = treated * choose([0.5, 0.6, 0.8]);
    const recoveredUntreated = total * 0.6 * 0.3;
    const recovered = recoveredTreated + recoveredUntreated;
    return exercise('conditional', seed, 'Un estudio registra tratamiento T y recuperación R en plantas afectadas por un hongo.',
      [`${total} plantas; ${treated} tratadas.`, `${recoveredTreated} tratadas se recuperan; ${recoveredUntreated} no tratadas se recuperan.`],
      ['Se selecciona una planta equiprobablemente.', 'Son frecuencias observadas: no se presupone asignación aleatoria ni efecto causal.'], [
        probability('recovery-given-treatment', 'Calcula P(R | T).', recoveredTreated / treated, 'Una vez condicionado a T, solo cuentan las plantas tratadas.', [
          step('Restringir el universo', `El grupo condicionado contiene ${treated} plantas, de las cuales ${recoveredTreated} se recuperan.`),
          step('Dividir dentro del grupo', `${recoveredTreated}/${treated} = ${format(recoveredTreated / treated)}.`, String.raw`P(R\mid T)=\frac{P(R\cap T)}{P(T)}`)
        ], 'Es la proporción de recuperación entre las tratadas, no entre todas las plantas.'),
        probability('treatment-given-recovery', 'Calcula P(T | R).', recoveredTreated / recovered, 'Ahora el denominador son todas las plantas recuperadas.', [
          step('Contar las recuperadas', `${recoveredTreated} + ${recoveredUntreated} = ${recovered}.`),
          step('Invertir la condición, no la fracción', `Entre las ${recovered} recuperadas, ${recoveredTreated} recibieron tratamiento: ${recoveredTreated}/${recovered} = ${format(recoveredTreated / recovered)}.`)
        ], 'P(T | R) responde a una selección distinta de P(R | T).')
      ], 'events', {total, treated, recoveredTreated, recoveredUntreated});
  },

  bayes(seed, choose) {
    const prevalence = choose([0.01, 0.02, 0.05]);
    const sensitivity = choose([0.9, 0.95]);
    const falsePositive = choose([0.02, 0.05, 0.1]);
    const truePositiveMass = prevalence * sensitivity;
    const falsePositiveMass = (1 - prevalence) * falsePositive;
    const positive = truePositiveMass + falsePositiveMass;
    const posterior = truePositiveMass / positive;
    return exercise('bayes', seed, 'Se usa una prueba para detectar una infección en animales de una población de cribado.',
      [`Prevalencia P(I) = ${format(prevalence)}.`, `Sensibilidad P(+ | I) = ${format(sensitivity)}.`, `Tasa de falsos positivos P(+ | no I) = ${format(falsePositive)}; especificidad = ${format(1 - falsePositive)}.`],
      ['Infección y no infección forman una partición.', 'Las características de la prueba son aplicables a esta población; no se supone independencia entre prueba e infección.'], [
        probability('positive', '¿Qué probabilidad tiene un resultado positivo P(+)?', positive, 'Pondera positivos verdaderos y falsos por el tamaño de cada grupo.', [
          step('Separar los dos orígenes', `Positivos verdaderos: ${format(prevalence)} × ${format(sensitivity)} = ${format(truePositiveMass)}. Falsos: ${format(1 - prevalence)} × ${format(falsePositive)} = ${format(falsePositiveMass)}.`),
          step('Sumar probabilidades totales', `${format(truePositiveMass)} + ${format(falsePositiveMass)} = ${format(positive)}.`, String.raw`P(+)=P(+\mid I)P(I)+P(+\mid I^c)P(I^c)`)
        ], 'Un positivo no implica necesariamente infección.'),
        probability('posterior', 'Tras un positivo, ¿cuál es P(I | +)?', posterior, 'Divide la probabilidad conjunta de infección y positivo por todos los positivos.', [
          step('Seleccionar los positivos verdaderos', `El numerador es ${format(truePositiveMass)}, no la sensibilidad sola.`),
          step('Aplicar Bayes', `${format(truePositiveMass)}/${format(positive)} = ${format(posterior)}.`, String.raw`P(I\mid +)=\frac{P(+\mid I)P(I)}{P(+)}`)
        ], 'La prevalencia modifica el valor predictivo positivo incluso con una prueba sensible.')
      ], 'bayes', {prevalence, sensitivity, specificity:1 - falsePositive, falsePositive});
  },

  discrete(seed, choose) {
    const weights = [1, choose([2, 3, 4]), choose([2, 4, 6])];
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const probabilities = weights.map(weight => weight / total);
    const mean = probabilities[1] + 2 * probabilities[2];
    const secondMoment = probabilities[1] + 4 * probabilities[2];
    const variance = secondMoment - mean ** 2;
    return exercise('discrete', seed, 'X es el número de colonias resistentes en una microplaca que solo puede producir 0, 1 o 2 colonias.',
      [`P(X=0)=c, P(X=1)=${weights[1]}c, P(X=2)=${weights[2]}c.`, 'Fuera de {0,1,2} la probabilidad es cero.'],
      ['Los tres resultados son excluyentes y cubren todos los casos.', 'Los pesos son no negativos.'], [
        question('normalizer', 'Calcula la constante c.', 1 / total, 'constante de normalización', 'La suma de todas las masas debe ser uno.', [
          step('Normalizar la masa', `(1 + ${weights[1]} + ${weights[2]})c = 1; c = 1/${total} = ${format(1 / total)}.`, String.raw`\sum_x P(X=x)=1`)
        ], 'Cada masa queda entre cero y uno.', 0.0005),
        question('mean', 'Calcula E[X].', mean, 'número de colonias', 'Pondera cada valor por su probabilidad, no por su peso sin normalizar.', [
          step('Promediar con los pesos normalizados', `(0 × 1 + 1 × ${weights[1]} + 2 × ${weights[2]})/${total} = ${format(mean)}.`, String.raw`E[X]=\sum_x xP(X=x)`)
        ], 'La esperanza puede no ser entera aunque cada observación sí lo sea.'),
        question('variance', 'Calcula Var(X).', variance, 'colonias al cuadrado', 'Primero calcula E[X²] y después resta (E[X])².', [
          step('Segundo momento', `(0² × 1 + 1² × ${weights[1]} + 2² × ${weights[2]})/${total} = ${format(secondMoment)}.`),
          step('Restar el cuadrado de la media', `${format(secondMoment)} - (${format(mean)})² = ${format(variance)}.`, String.raw`\operatorname{Var}(X)=E[X^2]-(E[X])^2`)
        ], 'La varianza mide dispersión y tiene unidades al cuadrado.')
      ], 'variable', {values:[0, 1, 2], weights, probabilities});
  },

  continuous(seed, choose) {
    const upper = choose([2, 3, 4]);
    const threshold = upper * choose([0.25, 0.5, 0.75]);
    const constant = 2 / upper ** 2;
    const chance = statistics().beta.cdf(threshold / upper, 2, 1);
    return exercise('continuous', seed, 'X mide una longitud celular, en unidades calibradas, con densidad creciente f(x)=c x para 0 ≤ x ≤ b y cero fuera.',
      [`b = ${upper}; umbral t = ${format(threshold)}.`, 'La densidad no es una probabilidad puntual.'],
      ['X es continua y su soporte es [0,b].', 'La integral de la densidad sobre el soporte debe ser uno.'], [
        question('normalizer', 'Calcula c para que f sea una densidad.', constant, 'unidades de longitud a la potencia -2', 'Integra c x desde cero hasta b.', [
          step('Área total igual a uno', `La integral es c b²/2; por tanto c = 2/${upper}² = ${format(constant)}.`, String.raw`\int_0^b cx\,dx=\frac{cb^2}{2}=1`)
        ], 'La altura de una densidad puede superar uno; el área total no.'),
        probability('below', 'Calcula P(X ≤ t).', chance, 'La probabilidad es el área desde cero hasta t.', [
          step('Integrar en el intervalo pedido', `c t²/2 = ${format(constant)} × ${format(threshold)}²/2 = ${format(chance)}.`, String.raw`P(X\le t)=\int_0^t cx\,dx`),
          step('Comprobar el área', `La primitiva de c por x es c por x al cuadrado dividido entre dos: su derivada vuelve a ser c por x. En cero vale cero; en ${format(threshold)} vale ${format(chance)}. Restamos el valor inicial y obtenemos ${format(chance)}, una probabilidad entre cero y uno.`)
        ], 'Al ser continua, P(X < t) es la misma; P(X=t)=0.'),
        probability('point', 'Calcula P(X = t), exactamente en el umbral.', 0, 'Un único punto tiene longitud cero.', [
          step('Distinguir altura y área', `Aunque f(t) = ${format(constant * threshold)}, el intervalo [t,t] tiene área cero.`)
        ], 'P(X=t) no se obtiene sustituyendo t en la densidad.')
      ], 'density', {distribution:'scaled-beta', upper, threshold, constant, alpha:2, beta:1});
  },

  binomial(seed, choose) {
    const trials = choose([10, 12, 15]);
    const successProbability = choose([0.1, 0.2, 0.3]);
    const count = choose([2, 3, 4]);
    const core = statistics();
    const exact = core.binomial.pdf(count, trials, successProbability);
    const cumulative = core.binomial.cdf(count, trials, successProbability);
    return exercise('binomial', seed, 'X cuenta semillas que germinan en un lote de ensayos controlados.',
      [`n = ${trials} semillas, probabilidad de germinación p = ${format(successProbability)}, k = ${count}.`, 'X toma valores enteros de 0 a n.'],
      ['Número de ensayos fijo, dos resultados por ensayo.', 'Ensayos independientes con la misma probabilidad p.'], [
        probability('exact', 'Calcula P(X = k).', exact, 'Además de la probabilidad de un patrón, cuenta las posiciones posibles de los éxitos.', [
          step('Elegir el modelo', `X sigue una binomial con ${trials} ensayos: cada semilla germina con probabilidad ${format(successProbability)}, independientemente de las demás.`),
          step('Contar posiciones', `Elegimos qué ${count} de las ${trials} semillas germinan. La combinación C(${trials},${count}) cuenta ${core.combination(trials,count)} grupos distintos, sin distinguir el orden dentro de cada grupo.`),
          step('Ponderar un patrón', `Un patrón concreto tiene ${count} germinaciones y ${trials-count} fallos. Su probabilidad es ${format(successProbability)}^${count} × ${format(1-successProbability)}^${trials-count} = ${format(successProbability**count*(1-successProbability)**(trials-count))}.`),
          step('Reunir los patrones', `Los ${core.combination(trials,count)} patrones no pueden ocurrir a la vez. Sumamos sus probabilidades multiplicando el número de patrones por la de uno: obtenemos ${format(exact)}.`, String.raw`P(X=k)=\binom nk p^k(1-p)^{n-k}`)
        ], `Es la probabilidad de exactamente ${count} germinaciones.`),
        probability('at-most', 'Calcula P(X ≤ k), incluyendo k.', cumulative, 'Incluye todos los enteros desde cero hasta k.', [
          step('Elegir los recuentos incluidos', `Como se permite k, incluimos ${Array.from({length:count+1},(_,value)=>value).join(', ')} germinaciones. Son resultados distintos, por lo que sumamos sus probabilidades.`),
          step('Sumar las masas', `Las probabilidades son, aproximadamente, ${Array.from({length:count+1},(_,value)=>format(core.binomial.pdf(value,trials,successProbability))).join(' + ')}. Su suma es ${format(cumulative)}. Una calculadora de acumuladas binomiales realiza esta misma suma.`, String.raw`P(X\le k)=\sum_{r=0}^k P(X=r)`)
        ], 'Para P(X < k) habría que evaluar la CDF en k−1.')
      ], 'binomial', {n:trials, p:successProbability, k:count});
  },

  poisson(seed, choose) {
    const rate = choose([1, 2, 3]);
    const duration = choose([2, 3]);
    const lambda = rate * duration;
    const count = choose([2, 3, 4]);
    const core = statistics();
    const exact = core.poisson.pdf(count, lambda);
    const tail = 1 - core.poisson.cdf(count, lambda);
    return exercise('poisson', seed, 'X cuenta llegadas de bacterias a un sensor durante una ventana de observación.',
      [`Tasa: ${rate} llegadas por minuto; ventana: ${duration} minutos.`, `k = ${count}; soporte X = 0,1,2,...`],
      ['Proceso de Poisson homogéneo: tasa constante e incrementos independientes.', 'La probabilidad de dos llegadas en un intervalo muy breve es despreciable frente a su duración.'], [
        probability('exact', 'Calcula P(X = k).', exact, 'La media de la ventana es tasa por duración.', [
          step('Ajustar la ventana', `λ = ${rate} × ${duration} = ${lambda} llegadas esperadas.`),
          step('Sustituir y calcular', `Lambda vale ${lambda} y k vale ${count}. El factorial ${count}! significa multiplicar los enteros desde 1 hasta ${count}: vale ${core.factorial(count)}. La potencia ${lambda} elevada a ${count} vale ${lambda ** count}. La exponencial de menos ${lambda} vale aproximadamente ${format(Math.exp(-lambda))}. Multiplicamos esa exponencial por ${lambda ** count} y dividimos entre ${core.factorial(count)}: obtenemos ${format(exact)}.`, String.raw`P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!}`)
        ], 'λ es un número esperado de llegadas, no una probabilidad.'),
        probability('strict-tail', 'Calcula P(X > k), sin incluir k.', tail, 'El complemento de X > k es X ≤ k.', [
          step('Identificar lo que queda fuera', `Más de ${count} excluye los recuentos desde cero hasta ${count}. Es más corto sumar esos recuentos y restar su probabilidad de uno.`),
          step('Sumar y complementar', `Las masas excluidas son, aproximadamente, ${Array.from({length:count+1},(_,value)=>format(core.poisson.pdf(value,lambda))).join(' + ')}. Suman ${format(1-tail)}; al restarlas de uno queda ${format(tail)}.`, String.raw`P(X>k)=1-P(X\le k)`)
        ], `La cola empieza en ${count + 1}, no en ${count}.`)
      ], 'poisson', {rate, duration, lambda, k:count});
  },

  normal(seed, choose) {
    const mean = choose([12, 18, 24]);
    const sd = choose([2, 3, 4]);
    const left = seed === 1 ? -1 : choose([-2,-1.5,-1,-0.5,0]);
    const right = seed === 1 ? 2 : choose([0.5,1,1.5,2,2.5]);
    const quantileProbability = seed === 1 ? 0.95 : choose([0.1,0.25,0.5,0.75,0.9,0.95]);
    const lower = mean + left * sd;
    const upper = mean + right * sd;
    const core = statistics();
    const chance = core.normal.cdf(upper, mean, sd) - core.normal.cdf(lower, mean, sd);
    const quantile = core.normal.inv(quantileProbability, mean, sd);
    const standardQuantile = core.normal.inv(quantileProbability,0,1);
    const percent = quantileProbability * 100;
    const leftText = format(left).replace('-','−');
    return exercise('normal', seed, 'La longitud X de un tipo de célula se modeliza con una distribución normal.',
      [`Media μ = ${mean} micrómetros; desviación típica σ = ${sd} micrómetros (no varianza).`, `Intervalo: [${lower}, ${upper}]; soporte teórico: toda la recta real.`],
      ['El modelo normal es una aproximación adecuada en el rango de interés.', 'No se está afirmando que todas las longitudes biológicas sigan una normal.'], [
        probability('interval', seed === 1 ? 'Calcula P(μ−σ ≤ X ≤ μ+2σ).' : 'Calcula la probabilidad del intervalo indicado.', chance, 'Tipifica los extremos y resta las acumuladas.', [
          step('Tipificar', `(${lower} - ${mean})/${sd} = ${format(left)}; (${upper} - ${mean})/${sd} = ${format(right)}.`, String.raw`Z=\frac{X-\mu}{\sigma}`),
          step('Consultar las dos áreas', `Φ se lee fi y da el área a la izquierda. Una tabla o calculadora normal da Φ(${format(right)}) = ${format(core.normal.cdf(right,0,1))} y Φ(${leftText}) = ${format(core.normal.cdf(left,0,1))}.`),
          step('Restar las áreas', `La primera área incluye también todo lo que queda a la izquierda de ${leftText}. Lo quitamos: ${format(core.normal.cdf(right,0,1))} − ${format(core.normal.cdf(left,0,1))} = ${format(chance)}. Queda solo el intervalo entre ambos umbrales.`)
        ], 'Los límites abiertos o cerrados no cambian la probabilidad continua.'),
        question('quantile', `Calcula el percentil ${percent} de X.`, quantile, 'micrómetros', `Busca primero z con Φ(z)=${format(quantileProbability)} y deshaz la tipificación.`, [
          step('Buscar un área, no una altura', `Buscamos en una tabla o calculadora el z que deja el ${percent} % del área a su izquierda: Φ(z)=${format(quantileProbability)}. Ese z es aproximadamente ${format(standardQuantile)}; Φ inversa deshace la acumulación.`),
          step('Volver a la escala original', `${mean} + ${sd} × ${format(standardQuantile)} = ${format(quantile)} micrómetros. Multiplicamos por la desviación para recuperar unidades y sumamos la media para recuperar el centro.`, String.raw`x_{${quantileProbability}}=\mu+\sigma\Phi^{-1}(${quantileProbability})`)
        ], `Bajo el modelo, el ${percent}% de las longitudes no supera ese valor.`)
      ], 'normal', {mean, sd, lower, upper, quantileProbability});
  },

  uniform(seed, choose) {
    const lower = choose([2, 4, 6]);
    const upper = lower + choose([6, 8, 10]);
    const from = lower + (upper - lower) / 4;
    const to = lower + 3 * (upper - lower) / 4;
    const core = statistics();
    const chance = core.uniform.cdf(to, lower, upper) - core.uniform.cdf(from, lower, upper);
    const mean = core.uniform.mean(lower, upper);
    return exercise('uniform', seed, 'El instante X de inspección se elige uniformemente dentro de una ventana experimental.',
      [`Ventana [${lower}, ${upper}] minutos; intervalo solicitado [${format(from)}, ${format(to)}].`, 'La densidad es 1/(b−a) dentro de la ventana y cero fuera.'],
      ['Todos los intervalos de igual longitud dentro de la ventana tienen igual probabilidad.', 'X es continua; los extremos individuales tienen probabilidad cero.'], [
        probability('interval', 'Calcula la probabilidad de caer en el intervalo solicitado.', chance, 'Divide la longitud del intervalo por la longitud total.', [
          step('Comparar longitudes', `(${format(to)} - ${format(from)})/(${upper} - ${lower}) = ${format(chance)}.`, String.raw`P(c\le X\le d)=\frac{d-c}{b-a}`),
          step('Comprobar el área', `La altura es 1/${upper-lower} y la anchura es ${format(to-from)}. Altura por anchura vuelve a dar ${format(chance)}. La acumulada en el extremo superior menos la del inferior calcula ese mismo rectángulo.`)
        ], 'Uniforme significa densidad constante, no probabilidad positiva de cada instante exacto.'),
        question('mean', 'Calcula E[X].', mean, 'minutos', 'Por simetría, la esperanza está en el punto medio.', [
          step('Usar la simetría del soporte', `(${lower} + ${upper})/2 = ${format(mean)}.`, String.raw`E[X]=\frac{a+b}{2}`)
        ], 'Es el promedio de muchas inspecciones realizadas con este mecanismo.')
      ], 'density', {distribution:'uniform', lower, upper, from, to});
  },

  exponential(seed, choose) {
    const rate = choose([0.2, 0.25, 0.5]);
    const elapsed = choose([2, 3, 4]);
    const extra = choose([1, 2, 3]);
    const core = statistics();
    const survival = 1 - core.exponential.cdf(elapsed, rate);
    const conditional = 1 - core.exponential.cdf(extra, rate);
    return exercise('exponential', seed, 'T es el tiempo hasta la siguiente llegada a un detector en un proceso de Poisson homogéneo.',
      [`Tasa λ = ${format(rate)} por minuto; espera media = ${format(1 / rate)} minutos.`, `Tiempo ya transcurrido t = ${elapsed}; espera adicional s = ${extra} minutos; soporte T ≥ 0.`],
      ['Tasa constante e incrementos independientes.', 'λ es la tasa por minuto; su inversa es la escala o espera media en minutos.'], [
        probability('survival', 'Calcula P(T > t).', survival, 'La supervivencia es uno menos la CDF.', [
          step('Formar un exponente sin unidades', `Multiplicamos la tasa ${format(rate)} por minuto por ${elapsed} minutos: obtenemos ${format(rate*elapsed)}. Los minutos se cancelan. El exponente de la supervivencia es el negativo de ese producto.`),
          step('Evaluar la exponencial', `La tecla exp de una calculadora evalúa e elevado a un número. exp(−${format(rate*elapsed)}) = ${format(survival)}. Es el área a la derecha del tiempo indicado, no la altura de la densidad.`, String.raw`P(T>t)=e^{-\lambda t}`)
        ], 'Es la probabilidad de que no haya llegado ningún evento durante t minutos.'),
        probability('memoryless', 'Calcula P(T > t+s | T > t).', conditional, 'La condición indica que la espera ya ha superado t.', [
          step('Escribir el cociente condicionado', `P(T>${elapsed + extra})/P(T>${elapsed}) = exp(-λ(${elapsed}+${extra}))/exp(-λ${elapsed}).`),
          step('Cancelar el tiempo transcurrido', `Al dividir exponenciales de la misma base restamos exponentes. El término del tiempo ya transcurrido se cancela: queda exp(−${format(rate)} × ${extra}) = ${format(conditional)}. Solo interviene la espera adicional.`, String.raw`P(T>t+s\mid T>t)=P(T>s)`)
        ], 'La falta de memoria es una propiedad de este modelo, no de cualquier tiempo biológico.')
      ], 'density', {distribution:'exponential', rate, elapsed, extra});
  },

  geometric(seed, choose) {
    const successProbability = choose([0.2, 0.25, 0.4]);
    const trials = choose([2, 3, 4, 5]);
    const core = statistics();
    const exact = core.negbin.pdf(trials - 1, 1, successProbability);
    const survival = 1 - core.negbin.cdf(trials - 1, 1, successProbability);
    return exercise('geometric', seed, 'Se prueban colonias independientes hasta encontrar la primera que expresa un marcador. T cuenta ensayos, incluido el primer éxito.',
      [`Probabilidad de éxito p = ${format(successProbability)}; k = ${trials} ensayos.`, 'Soporte T = 1,2,3,...; F = T−1 cuenta fallos y tiene soporte 0,1,2,...'],
      ['Ensayos Bernoulli independientes con p constante.', 'F cuenta los fallos anteriores al primer éxito; T añade el ensayo del éxito final.'], [
        probability('first-success', 'Calcula P(T = k).', exact, 'Se necesitan k−1 fallos y después un éxito.', [
          step('Traducir ensayos a fallos', `T=${trials} significa ${trials-1} fallos seguidos de un éxito. Solo hay una posición posible para el éxito: la última, porque antes debemos seguir buscando.`),
          step('Ponderar la secuencia', `(${format(1 - successProbability)})^${trials - 1} × ${format(successProbability)} = ${format(exact)}.`, String.raw`P(T=k)=(1-p)^{k-1}p`)
        ], 'El éxito final sí se incluye en el número de ensayos.'),
        probability('more-trials', 'Calcula P(T > k).', survival, 'T > k significa que los primeros k ensayos han fallado.', [
          step('Usar el límite correcto en fallos', `T>${trials} equivale a F≥${trials}; por eso se resta la CDF de F en ${trials - 1}.`),
          step('Multiplicar los fallos', `Cada ensayo falla con probabilidad ${format(1-successProbability)}. Para seguir esperando tras ${trials} ensayos deben fallar todos: (${format(1-successProbability)})^${trials} = ${format(survival)}. La potencia abrevia multiplicar esa probabilidad ${trials} veces.`)
        ], 'Usar la CDF en k en vez de k−1 introduciría un ensayo adicional.')
      ], 'variable', {distribution:'geometric', p:successProbability, trials, counts:'trials', failures:trials - 1});
  },

  hypergeometric(seed, choose) {
    const population = choose([20, 24, 30]);
    const successes = choose([6, 8, 10]);
    const draws = choose([4, 5, 6]);
    const count = choose([1, 2, 3]);
    const minimum = Math.max(0, draws - (population - successes));
    const maximum = Math.min(draws, successes);
    const core = statistics();
    const exact = core.hypgeom.pdf(count, population, successes, draws);
    const atLeast = 1 - core.hypgeom.cdf(count - 1, population, successes, draws);
    return exercise('hypergeometric', seed, 'Se extraen organismos de una colección finita sin reemplazo y X cuenta los portadores de una variante.',
      [`N=${population} organismos, K=${successes} portadores, n=${draws} extracciones, k=${count}.`, `Soporte entero: ${minimum} ≤ X ≤ ${maximum}.`],
      ['Todas las muestras de n organismos son equiprobables.', 'Sin reemplazo: las extracciones no son ensayos Bernoulli independientes.'], [
        probability('exact', 'Calcula P(X = k).', exact, 'Cuenta las formas de elegir portadores y no portadores, y divide por todas las muestras.', [
          step('Contar muestras favorables', `Elegir ${count} de ${successes} portadores da ${core.combination(successes,count)} grupos. Elegir ${draws-count} de los ${population-successes} restantes da ${core.combination(population-successes,draws-count)}. Multiplicamos porque cada elección del primer grupo puede combinarse con cada elección del segundo.`),
          step('Contar todas las muestras', `Elegimos ${draws} organismos de ${population} sin atender al marcador: C(${population},${draws}) = ${core.combination(population,draws)} muestras posibles, todas con la misma probabilidad.`, String.raw`\binom{${population}}{${draws}}=${core.combination(population,draws)}`),
          step('Dividir favorables entre posibles', `${core.combination(successes,count)} × ${core.combination(population-successes,draws-count)} / ${core.combination(population,draws)} = ${format(exact)}. Hemos contado grupos, no secuencias de extracción.`, String.raw`P(X=k)=\frac{\binom Kk\binom{N-K}{n-k}}{\binom Nn}`)
        ], 'La dependencia por agotamiento de la colección impide sustituir automáticamente este modelo por una binomial.'),
        probability('at-least', 'Calcula P(X ≥ k), incluyendo k.', atLeast, 'El complemento termina en k−1.', [
          step('Elegir el complemento', `Al menos ${count} incluye ${count}. Lo contrario es observar menos de ${count}, es decir, los recuentos del soporte hasta ${count-1}.`),
          step('Sumar lo excluido y restarlo', `La acumulada hipergeométrica suma esas masas y da ${format(1-atLeast)}. Una tabla o calculadora permite obtener esa suma. Restamos de uno: 1 − ${format(1-atLeast)} = ${format(atLeast)}.`, String.raw`P(X\ge k)=1-P(X\le k-1)`)
        ], 'Esta cola incluye exactamente k portadores y todos los valores superiores del soporte.')
      ], 'variable', {distribution:'hypergeometric', population, successes, draws, k:count, minimum, maximum});
  },

  gamma(seed, choose) {
    const shape = choose([2, 3, 4]);
    const rate = choose([0.25, 0.5, 1]);
    const scale = 1 / rate;
    const time = shape * scale;
    const core = statistics();
    const chance = core.gamma.cdf(time, shape, scale);
    const mean = core.gamma.mean(shape, scale);
    return exercise('gamma', seed, 'T es el tiempo hasta la llegada número k a un detector Poisson; suma k esperas exponenciales independientes.',
      [`Forma k = ${shape}; escala α = ${format(scale)} minutos; tasa r = 1/α = ${format(rate)} por minuto.`, `Umbral t = ${format(time)} minutos; soporte T ≥ 0.`],
      ['Proceso de Poisson homogéneo y esperas independientes con la misma tasa.', 'Como en la teoría, k es forma y α escala. La biblioteca recibe forma y escala, no tasa.'], [
        question('mean', 'Calcula E[T].', mean, 'minutos', 'La media es forma dividida por tasa, o forma por escala.', [
          step('Sumar las medias de las esperas', `Cada espera tiene media ${format(scale)} minutos; ${shape} × ${format(scale)} = ${format(mean)}.`, String.raw`E[T]=k\alpha=k/r`)
        ], 'La tasa tiene unidades inversas al tiempo; la escala tiene unidades de tiempo.'),
        probability('before', 'Calcula P(T ≤ t).', chance, 'Acumula el área de la densidad gamma desde cero hasta t; conserva k como forma y α como escala.', [
          step('Identificar el área', `Queremos el tiempo total de ${shape} esperas menor o igual que ${format(time)} minutos. Usamos forma ${shape} y escala ${format(scale)}, como en la teoría.`),
          step('Consultar la acumulada', `La acumulada gamma integra la densidad desde cero hasta ${format(time)} minutos. Con forma ${shape} y escala ${format(scale)}, una calculadora estadística da aproximadamente ${format(chance)}. Este valor mide el área acumulada, no la altura de la curva en el umbral.`, String.raw`P(T\le t)=F_{\Gamma(k,\alpha)}(t)`)
        ], `Es la probabilidad de observar al menos ${shape} llegadas antes del umbral.`)
      ], 'density', {distribution:'gamma', shape, rate, scale, time});
  },

  'chi-square'(seed, choose) {
    const sampleSize = choose([6, 9, 12]);
    const df = sampleSize - 1;
    const populationVariance = choose([4, 9, 16]);
    const thresholdVariance = populationVariance * choose([1, 1.5, 2]);
    const cutoff = df * thresholdVariance / populationVariance;
    const core = statistics();
    const chance = 1 - core.chisquare.cdf(cutoff, df);
    const critical = core.chisquare.inv(0.95, df);
    return exercise('chi-square', seed, 'Se mide una característica celular en una muestra normal y se estudia la dispersión S².',
      [`n=${sampleSize}; varianza poblacional σ²=${populationVariance}; umbral v=${format(thresholdVariance)}, en unidades al cuadrado.`, 'S² = Σ(Xᵢ−X̄)²/(n−1); Q=(n−1)S²/σ² tiene soporte Q≥0.'],
      ['Observaciones iid normales.', 'Se usa la varianza muestral con corrección de Bessel, no el divisor n.'], [
        probability('variance-tail', 'Calcula P(S² > v).', chance, 'Transforma el umbral de varianza en un umbral chi-cuadrado.', [
          step('Identificar grados de libertad', `Tras estimar la media, las desviaciones respecto a ella suman cero: fijadas ${df}, la última queda determinada. Por eso ν=n−1=${df} grados de libertad.`),
          step('Transformar el umbral', `q=${df} × ${format(thresholdVariance)}/${populationVariance}=${format(cutoff)}. Dividir dos varianzas cancela sus unidades. Q sigue una chi-cuadrado, que se lee ji al cuadrado, con ${df} grados de libertad.`, String.raw`\frac{(n-1)S^2}{\sigma^2}\sim\chi^2_{n-1}`),
          step('Calcular el área derecha', `Una calculadora chi-cuadrado con ${df} grados de libertad da ${format(1-chance)} de área hasta ${format(cutoff)}. La pregunta pide superar ese umbral: 1 − ${format(1-chance)} = ${format(chance)}.`)
        ], 'La distribución exacta depende de la normalidad, no solo de que la muestra sea iid.'),
        question('critical', 'Calcula el percentil 95 de Q.', critical, 'valor chi-cuadrado sin unidades', 'Invierte la acumulada con n−1 grados de libertad.', [
          step('Elegir el área acumulada', 'El percentil 95 deja 0,95 del área a su izquierda y 0,05 a su derecha. Buscamos un umbral de la variable Q sin unidades, no una varianza.'),
          step('Consultar el cuantil', `En una calculadora chi-cuadrado indicamos área izquierda 0,95 y ${df} grados de libertad: el umbral es ${format(critical)}. Usar otro número de grados de libertad cambiaría la curva y el resultado.`)
        ], 'Este es un umbral de Q, no directamente de S².')
      ], 'sampling', {distribution:'chi-square', n:sampleSize, df, populationVariance, thresholdVariance, cutoff});
  },

  student(seed, choose) {
    const sampleSize = choose([8, 12, 16]);
    const df = sampleSize - 1;
    const sampleMean = choose([14, 18, 22]);
    const sampleSd = choose([2, 3, 4]);
    const nullMean = sampleMean - sampleSd / Math.sqrt(sampleSize);
    const statistic = (sampleMean - nullMean) / (sampleSd / Math.sqrt(sampleSize));
    const core = statistics();
    const pValue = 2 * (1 - core.studentt.cdf(Math.abs(statistic), df));
    const critical = core.studentt.inv(0.975, df);
    const margin = critical * sampleSd / Math.sqrt(sampleSize);
    return exercise('student', seed, 'Un laboratorio contrasta una media de concentración con desviación poblacional desconocida.',
      [`n=${sampleSize}, media muestral=${sampleMean}, desviación muestral s=${sampleSd} mg/L (divisor n−1 en s²).`, `H₀: μ=μ₀=${format(nullMean)} mg/L; μ₀ se define exactamente como ${sampleMean}−${sampleSd}/√${sampleSize}.`, 'Alternativa bilateral; confianza del intervalo: 95%.'],
      ['Muestra iid de una población normal.', 'σ es desconocida y se estima con s; T tiene soporte en toda la recta real.'], [
        probability('two-sided', 'Calcula el p-valor bilateral para H₀.', pValue, 'Divide la diferencia de medias por s/√n y suma las dos colas.', [
          step('Usar el error estándar', `s/√n=${format(sampleSd / Math.sqrt(sampleSize))} mg/L estima cuánto varía la media entre muestras, no cuánto varían las observaciones individuales. t=(${sampleMean}−μ₀)/(s/√n)=${format(statistic)} indica cuántos errores estándar separan la media de H₀.`),
          step('Obtener una cola Student', `Con ${df} grados de libertad, una tabla o calculadora Student da ${format(pValue/2)} de área por encima de |t|=${format(Math.abs(statistic))}. Las barras aquí significan valor absoluto: la distancia a cero, sin signo.`, String.raw`T=\frac{\bar X-\mu_0}{S/\sqrt n}\sim t_{n-1}`),
          step('Incluir ambos sentidos', `La alternativa admite desviaciones positivas y negativas. Por simetría, la cola izquierda aporta la misma área: 2 × ${format(pValue/2)} = ${format(pValue)}. No multiplicaríamos por dos en cualquier contraste unilateral.`)
        ], 'Es una probabilidad bajo H₀ de un estadístico al menos tan extremo; no la probabilidad de que H₀ sea cierta.'),
        question('margin', 'Calcula el margen de error del intervalo bilateral del 95% para μ.', margin, 'mg/L', 'Usa el percentil 97,5, porque hay dos colas de 2,5%.', [
          step('Elegir el cuantil bilateral', `El 5 % exterior se divide en dos colas del 2,5 %. El límite positivo deja 97,5 % a su izquierda: una calculadora Student con ${df} grados de libertad devuelve t₀,₉₇₅=${format(critical)}.`),
          step('Multiplicar por el error estándar', `${format(critical)} × ${sampleSd}/√${sampleSize} = ${format(margin)}.`, String.raw`\bar x\pm t_{0.975,n-1}\frac{s}{\sqrt n}`)
        ], 'El 95% describe la cobertura del procedimiento en muestras repetidas, no una probabilidad posterior de μ.')
      ], 'sampling', {distribution:'student', n:sampleSize, df, sampleMean, sampleSd, nullMean, statistic, confidence:0.95});
  },

  fisher(seed, choose) {
    const n1 = choose([8, 10, 12]);
    const n2 = choose([9, 13, 17]);
    const variance1 = choose([4, 6, 8]);
    const variance2 = choose([2, 3, 4]);
    const df1 = n1 - 1;
    const df2 = n2 - 1;
    const ratio = variance1 / variance2;
    const core = statistics();
    const chance = 1 - core.centralF.cdf(ratio, df1, df2);
    const critical = core.centralF.inv(0.95, df1, df2);
    return exercise('fisher', seed, 'Se comparan las varianzas de concentración de dos cultivos independientes bajo H₀: σ₁²=σ₂².',
      [`n₁=${n1}, n₂=${n2}; varianzas muestrales s₁²=${variance1}, s₂²=${variance2}, con divisor nᵢ−1.`, 'F=S₁²/S₂²; se pide la cola superior, no un p-valor bilateral; soporte F≥0.'],
      ['Ambas muestras son iid normales y son independientes entre sí.', 'Bajo H₀ la razón de varianzas poblacionales es uno.', 'El orden de los grados de libertad corresponde al numerador y al denominador.'], [
        probability('upper-tail', 'Bajo H₀, calcula P(F ≥ s₁²/s₂²).', chance, 'No intercambies los grados de libertad ni ordenes las varianzas por tamaño.', [
          step('Construir la razón', `f=${variance1}/${variance2}=${format(ratio)}, ν₁=${df1}, ν₂=${df2}.`, String.raw`\frac{S_1^2/\sigma_1^2}{S_2^2/\sigma_2^2}\sim F_{n_1-1,n_2-1}`),
          step('Consultar el área izquierda', `La calculadora F recibe ${df1} grados de libertad del numerador y ${df2} del denominador, en ese orden. Acumula ${format(1-chance)} hasta la razón ${format(ratio)}.`),
          step('Restar para obtener la cola superior', `El área total es uno. Por tanto, el área a la derecha de la razón observada es 1 − ${format(1-chance)} = ${format(chance)}. Incluir el punto límite no cambia el área de esta distribución continua.`)
        ], 'La F no es simétrica; una cola superior no equivale automáticamente a una prueba bilateral.'),
        question('critical', 'Calcula el umbral con un 5% de área a la derecha.', critical, 'razón de varianzas sin unidades', 'El cuantil buscado acumula 0,95 a la izquierda.', [
          step('Cambiar la pregunta a un área izquierda', 'Dejar un 5 % a la derecha equivale a acumular 95 % a la izquierda. Buscamos qué razón de varianzas marca ese punto.'),
          step('Invertir con el orden correcto', `Una calculadora de cuantiles F con área izquierda 0,95 y grados de libertad (${df1}, ${df2}) devuelve ${format(critical)}. Conservamos el orden de las muestras, sin colocar automáticamente la varianza mayor arriba.`)
        ], 'Cambiar numerador y denominador cambia la distribución y el umbral.')
      ], 'sampling', {distribution:'fisher', n1, n2, df1, df2, variance1, variance2, ratio});
  },

  joint(seed, choose) {
    const total = 100;
    const count10 = choose([10, 20, 30]);
    const counts = [[20, 30], [count10, 50 - count10]];
    const probabilities = counts.map(row => row.map(count => count / total));
    const marginalY = (counts[0][1] + counts[1][1]) / total;
    const conditional = counts[1][1] / 50;
    return exercise('joint', seed, 'X indica presencia de un alelo (0/1) e Y respuesta a un estímulo (0/1). Se elige un organismo de una tabla de frecuencias.',
      ['Filas X=0,1; columnas Y=0,1; total 100 organismos.', `Tabla de recuentos: X=0: [20,30]; X=1: [${count10},${50 - count10}].`],
      ['Cada organismo se selecciona con la misma probabilidad.', 'No se supone independencia entre X e Y.'], [
        probability('marginal-y', 'Calcula P(Y=1).', marginalY, 'Suma toda la columna Y=1 y divide por el total.', [
          step('Eliminar X sumando', `(30 + ${50 - count10})/100 = ${format(marginalY)}.`, String.raw`P(Y=1)=\sum_x P(X=x,Y=1)`)
        ], 'Una marginal ignora cuál de los dos valores de X ocurrió.'),
        probability('conditional-y', 'Calcula P(Y=1 | X=1).', conditional, 'El denominador es el total de la fila X=1.', [
          step('Restringir a la fila', `La fila X=1 suma ${count10} + ${50 - count10} = 50.`),
          step('Dividir la celda por la fila', `${50 - count10}/50 = ${format(conditional)}.`, String.raw`P(Y=1\mid X=1)=\frac{P(X=1,Y=1)}{P(X=1)}`)
        ], 'No se divide por el total general una vez que se condiciona.')
      ], 'joint', {valuesX:[0, 1], valuesY:[0, 1], counts, probabilities, total});
  },

  covariance(seed, choose) {
    const both = choose([0.1, 0.2, 0.3, 0.4]);
    const probabilities = [[both, 0.5 - both], [0.5 - both, both]];
    const covariance = both - 0.25;
    const correlation = covariance / 0.25;
    return exercise('covariance', seed, 'X e Y son indicadores 0/1 de dos marcadores moleculares medidos en el mismo organismo.',
      [`Tabla de probabilidades, filas X=0,1 y columnas Y=0,1: [${format(both)}, ${format(0.5 - both)}]; [${format(0.5 - both)}, ${format(both)}].`, 'Ambas marginales tienen probabilidad 0,5 de valer uno.'],
      ['La tabla es una distribución conjunta: entradas no negativas y suma uno.', 'Los indicadores no se presuponen independientes.'], [
        question('covariance', 'Calcula Cov(X,Y).', covariance, 'producto de unidades de los indicadores', 'XY solo vale uno en la celda X=1,Y=1.', [
          step('Obtener los momentos', `E[X]=E[Y]=0,5 y E[XY]=P(X=1,Y=1)=${format(both)}.`),
          step('Centrar el producto', `${format(both)} - 0,5 × 0,5 = ${format(covariance)}.`, String.raw`\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]`)
        ], covariance > 0 ? 'Los valores altos tienden a coincidir más de lo esperado bajo independencia; no prueba causalidad.' : 'Los valores altos coinciden menos de lo esperado bajo independencia; no prueba causalidad.'),
        question('correlation', 'Calcula la correlación ρ(X,Y).', correlation, 'correlación sin unidades', 'Cada indicador tiene varianza 0,5(1−0,5)=0,25.', [
          step('Calcular las desviaciones', 'σX=σY=√0,25=0,5; el producto de desviaciones es 0,25.'),
          step('Normalizar la covarianza', `${format(covariance)}/0,25 = ${format(correlation)}.`, String.raw`\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}`)
        ], 'La correlación mide asociación lineal y debe estar entre −1 y 1.')
      ], 'covariance', {valuesX:[0, 1], valuesY:[0, 1], probabilities, meanX:0.5, meanY:0.5});
  },

  independence(seed, choose) {
    const amplitude = choose([1, 2, 3]);
    const outerMass = choose([0.2, 0.25, 1 / 3]);
    const centerMass = 1 - 2 * outerMass;
    const difference = centerMass - centerMass ** 2;
    return exercise('independence', seed, 'X es una desviación simétrica respecto a una referencia biológica y Y=X² es su desviación cuadrática.',
      [`X toma −${amplitude}, 0, ${amplitude} con probabilidades ${format(outerMass)}, ${format(centerMass)}, ${format(outerMass)}.`, 'Y solo toma 0 y a², donde a es la amplitud; Y queda determinado por X.'],
      ['Distribución discreta con momentos finitos.', 'Covarianza cero no implica independencia en general.'], [
        question('covariance', 'Calcula Cov(X,Y).', 0, 'unidades de X al cubo', 'E[X]=0 y E[XY]=E[X³]=0 por simetría.', [
          step('Cancelar valores opuestos', `E[X]=−${amplitude} × ${format(outerMass)} + ${amplitude} × ${format(outerMass)}=0; los términos de E[X³] también se cancelan.`),
          step('Centrar', 'Cov(X,Y)=E[X³]−E[X]E[X²]=0−0×E[X²]=0.', String.raw`\operatorname{Cov}(X,X^2)=E[X^3]-E[X]E[X^2]`)
        ], 'No hay asociación lineal, pero sí dependencia determinista.'),
        question('factorization-gap', 'Calcula P(X=0,Y=0) − P(X=0)P(Y=0).', difference, 'diferencia de probabilidades', 'Si X=0 entonces Y=0; ambos sucesos tienen probabilidad p₀.', [
          step('Calcular la conjunta real', `P(X=0,Y=0)=p₀=${format(centerMass)}.`),
          step('Comparar con la factorización', `p₀−p₀²=${format(centerMass)}−(${format(centerMass)})²=${format(difference)}.`, String.raw`X\perp Y\ \Longrightarrow\ P(X=x,Y=y)=P(X=x)P(Y=y)`)
        ], 'La diferencia positiva en una sola celda basta para refutar independencia, aunque la covarianza sea cero.', 0.0005)
      ], 'independence', {valuesX:[-amplitude, 0, amplitude], valuesY:[0, amplitude ** 2], probabilities:[[0, outerMass], [centerMass, 0], [0, outerMass]], independent:false, amplitude, outerMass, centerMass});
  },

  transform(seed, choose) {
    const center = choose([4, 6, 8]);
    const spread = choose([1, 2, 3]);
    const values = [center - spread, center + spread];
    const secondMoment = (values[0] ** 2 + values[1] ** 2) / 2;
    const gap = secondMoment - center ** 2;
    return exercise('transform', seed, 'Una señal de concentración X toma dos valores equiprobables. El instrumento transforma la señal en Y=X².',
      [`X=${values[0]} o X=${values[1]} unidades, cada uno con probabilidad 1/2.`, 'Y se expresa en unidades al cuadrado.'],
      ['La transformación es no lineal y convexa.', 'Los momentos son finitos; no se intercambia esperanza y función sin justificación.'], [
        question('transformed-mean', 'Calcula E[Y]=E[X²].', secondMoment, 'unidades al cuadrado', 'Transforma cada resultado antes de promediar.', [
          step('Transformar los resultados', `Y toma ${values[0] ** 2} y ${values[1] ** 2}.`),
          step('Promediar las transformaciones', `(${values[0] ** 2}+${values[1] ** 2})/2=${secondMoment}.`, String.raw`E[g(X)]=\sum_x g(x)P(X=x)`)
        ], `Elevar la media ${center} al cuadrado daría ${center ** 2}, que no es E[X²].`),
        question('jensen-gap', 'Calcula E[X²] − (E[X])².', gap, 'unidades al cuadrado', 'La diferencia es exactamente Var(X) para la función cuadrado.', [
          step('Promediar sin transformar', `E[X]=(${values[0]}+${values[1]})/2=${center}.`),
          step('Comparar los dos órdenes', `${secondMoment}−${center}²=${gap}>0.`, String.raw`E[X^2]\ge (E[X])^2`)
        ], 'Jensen predice esta desigualdad para funciones convexas; aquí es estricta porque X no es constante.')
      ], 'expectation', {transformation:'square', values, probabilities:[0.5, 0.5], center, spread});
  },

  sample(seed, choose) {
    const sampleSize = choose([5, 8, 10]);
    const mean = choose([12, 16, 20]);
    const populationVariance = choose([4, 9, 16]);
    const values = [mean - 2, mean - 1, mean, mean + 1, mean + 2];
    const core = statistics();
    const sampleMean = core.mean(values);
    const varianceUnbiased = core.variance(values, true);
    const varianceDivisorN = core.variance(values, false);
    return exercise('sample', seed, 'Se toman mediciones iid de una población para estudiar la media muestral y distinguir dos estimadores de varianza.',
      [`Población: E[X]=${mean}, Var(X)=${populationVariance}; tamaño de la muestra aleatoria para X̄: n=${sampleSize}.`, `Por separado, una muestra observada de tamaño m=5 contiene [${values.join(', ')}].`, 'S² usa divisor m−1; Vₘ usa divisor m. La muestra observada es una realización, no la población.'],
      ['Observaciones iid y varianza poblacional finita.', 'No hace falta normalidad para Var(X̄)=σ²/n ni para la insesgadez de S².', 'No se identifica S² de una realización con su esperanza sobre muestras repetidas.'], [
        question('mean-variance', 'Calcula Var(X̄) para la muestra aleatoria de tamaño n.', populationVariance / sampleSize, 'unidades al cuadrado', 'La independencia anula las covarianzas de observaciones distintas.', [
          step('Escalar la suma', `Var((X₁+...+Xₙ)/n)=nσ²/n²=σ²/n.`),
          step('Sustituir', `${populationVariance}/${sampleSize}=${format(populationVariance / sampleSize)}.`, String.raw`\operatorname{Var}(\bar X)=\frac{\sigma^2}{n}`)
        ], 'La varianza de una observación sigue siendo σ²; la de la media se reduce por n.'),
        question('observed-unbiased', 'Calcula S² en la muestra observada de cinco valores, con divisor m−1.', varianceUnbiased, 'unidades al cuadrado', 'Primero centra en la media de los cinco valores y suma los cuadrados.', [
          step('Calcular la media observada', `x̄=${sampleMean}; desviaciones: −2,−1,0,1,2; suma de cuadrados: 4+1+0+1+4=10.`),
          step('Aplicar la corrección de Bessel', `Las cinco desviaciones suman cero porque hemos estimado la media con ellas: solo cuatro pueden variar libremente. Dividimos la suma de cuadrados, diez, entre cinco menos uno y obtenemos ${format(varianceUnbiased)}. Esta corrección elimina el sesgo en muestras repetidas.`, String.raw`S^2=\frac{1}{m-1}\sum_{i=1}^m(X_i-\bar X)^2`)
        ], 'S² es insesgada: E[S²]=σ², pero esta realización no tiene por qué coincidir con σ².'),
        question('observed-divisor-n', 'Calcula Vₘ para los mismos cinco valores usando divisor m.', varianceDivisorN, 'unidades al cuadrado', 'La suma de cuadrados no cambia; solo cambia el divisor.', [
          step('Cambiar el divisor', `Aquí se pide el promedio de las cinco desviaciones cuadradas: diez dividido entre cinco da ${format(varianceDivisorN)}. Los datos no cambian; cambia la definición del resumen que calculamos.`),
          step('Explicar el sesgo', `En muestras iid de tamaño m=5, E[Vₘ]=(4/5)σ²; no se interpreta este valor observado como la varianza poblacional.`, String.raw`E[V_m]=\frac{m-1}{m}\sigma^2`)
        ], 'Con divisor m la varianza alrededor de la media estimada subestima la varianza poblacional en promedio.')
      ], 'sampling', {n:sampleSize, mean, populationVariance, values, observedSize:values.length});
  },

  combinatorics(seed, choose) {
    const total = choose([6, 7, 8]);
    const selected = choose([2, 3]);
    const multiplicities = choose([[2, 2, 2], [3, 2, 1], [3, 3, 2]]);
    const labelTotal = multiplicities.reduce((sum, count) => sum + count, 0);
    const core = statistics();
    const combinations = core.combination(total, selected);
    const ordered = core.factorial(total) / core.factorial(total - selected);
    const repeated = total ** selected;
    const permutations = core.factorial(total);
    const repeatedPermutations = core.factorial(labelTotal) / multiplicities.reduce((product, count) => product * core.factorial(count), 1);
    return exercise('combinatorics', seed, 'Un laboratorio diseña selecciones de aislados y secuencias de etiquetas para tubos; cada apartado cambia qué resultados se distinguen.',
      [`Hay n=${total} aislados distintos y se seleccionan r=${selected}.`, `En otro lote hay ${labelTotal} etiquetas: ${multiplicities[0]} de especie A, ${multiplicities[1]} de B y ${multiplicities[2]} de C; las de una misma especie son indistinguibles.`],
      ['Sin reemplazo no se puede seleccionar dos veces un mismo aislado.', 'El orden solo importa en posiciones etiquetadas; estos recuentos no presuponen equiprobabilidad.'], [
        question('unordered', '¿Cuántos grupos de r aislados sin orden y sin reemplazo hay?', combinations, 'grupos', 'Cuenta primero selecciones ordenadas y elimina los r! órdenes de cada grupo.', [
          step('Contar con orden', `n!/(n-r)! = ${total}!/${total - selected}! = ${ordered}.`, String.raw`V_{n,r}=\frac{n!}{(n-r)!}`),
          step('Eliminar las reordenaciones', `${ordered}/${selected}! = ${combinations}.`, String.raw`\binom nr=\frac{n!}{r!(n-r)!}`)
        ], 'Un grupo no cambia si se intercambia el orden de sus aislados.', 0),
        question('ordered', '¿Cuántas asignaciones de r aislados distintos a r posiciones etiquetadas hay?', ordered, 'asignaciones', 'Las opciones disminuyen al ocupar cada posición sin reemplazo.', [
          step('Aplicar el producto', `Las primeras posiciones tienen ${total}, ${total - 1}${selected === 3 ? ` y ${total - 2}` : ''} opciones; se multiplican.`),
          step('Expresar con factoriales', `${total}!/${total - selected}! = ${ordered}; también ${combinations} × ${selected}!.`, String.raw`V_{n,r}=\binom nr r!`)
        ], 'Cambiar de posición dos aislados produce otra asignación.', 0),
        question('with-repetition', 'Si cada posición recibe una etiqueta de cualquiera de los n aislados y se permiten repeticiones, ¿cuántas secuencias hay?', repeated, 'secuencias', 'Ahora cada posición conserva las n opciones.', [
          step('Cambiar el mecanismo', `Se asignan etiquetas, no se extraen aislados; cada una de las ${selected} posiciones admite las ${total} etiquetas.`),
          step('Multiplicar opciones constantes', `${total}^${selected} = ${repeated}.`, String.raw`VR_{n,r}=n^r`)
        ], 'Repetir una etiqueta está permitido en este apartado, no en los anteriores.', 0),
        question('all-ordered', '¿De cuántas maneras se pueden ordenar todos los n aislados distintos?', permutations, 'ordenaciones', 'Se usan todos, una vez cada uno.', [
          step('Agotar las opciones', `Hay ${total} opciones al principio y una menos en cada posición, hasta quedar una.`),
          step('Evaluar el factorial', `${total}! = ${permutations}.`, String.raw`P_n=n!`)
        ], 'Es el caso r=n de las variaciones sin repetición.', 0),
        question('repeated-labels', '¿Cuántas secuencias distintas se forman usando todas las etiquetas del otro lote?', repeatedPermutations, 'secuencias', 'Intercambiar etiquetas de la misma especie no crea una secuencia nueva.', [
          step('Contar como si todas fueran distintas', `Inicialmente habría ${labelTotal}! ordenaciones.`),
          step('Quitar duplicaciones internas', `Dividimos por ${multiplicities.map(count => `${count}!`).join(' × ')}: resultado ${repeatedPermutations}.`, String.raw`\frac{m!}{m_A!m_B!m_C!}`)
        ], 'Las multiplicidades fijan cuántas veces aparece cada especie, no una probabilidad.', 0)
      ], 'math', {distribution:'combinatorics', n:total, r:selected, multiplicities, labelTotal});
  },

  'negative-binomial'(seed, choose) {
    const successes = choose([2, 3, 4]);
    const successProbability = choose([0.25, 0.4, 0.5]);
    const failures = choose([0, 2, 4, 6]);
    const core = statistics();
    const exact = core.negbin.pdf(failures, successes, successProbability);
    const cumulative = core.negbin.cdf(failures, successes, successProbability);
    const mean = successes * (1 - successProbability) / successProbability;
    const variance = successes * (1 - successProbability) / successProbability ** 2;
    return exercise('negative-binomial', seed, 'Se examinan colonias independientes hasta encontrar r que expresan un marcador. F cuenta solo los fallos anteriores al éxito número r.',
      [`r=${successes} éxitos, p=${format(successProbability)}, k=${failures} fallos.`, 'Soporte F=0,1,2,...; el total de ensayos es T=F+r. F=0 significa r éxitos iniciales consecutivos.'],
      ['Ensayos Bernoulli independientes con probabilidad de éxito constante.', 'El objetivo r es un número entero positivo de éxitos. La variable F cuenta los fallos anteriores, no el total de ensayos; para contar ensayos añadiríamos r.'], [
        probability('exact', 'Calcula P(F=k).', exact, 'El último ensayo es un éxito; distribuye los otros r−1 éxitos entre los k+r−1 anteriores.', [
          step('Fijar la parada', `Hay ${failures + successes} ensayos, con el último éxito fijado; quedan ${successes - 1} éxitos y ${failures} fallos por ordenar.`),
          step('Ponderar los patrones', `C(${failures + successes - 1},${failures}) × ${format(successProbability)}^${successes} × ${format(1 - successProbability)}^${failures} = ${format(exact)}.`, String.raw`P(F=k)=\binom{k+r-1}{k}p^r(1-p)^k`)
        ], 'No es una binomial con un número de ensayos fijado de antemano.'),
        probability('at-most', 'Calcula P(F≤k), incluyendo cero y k.', cumulative, 'Suma las masas desde cero hasta k, sin desplazar el soporte.', [
          step('Delimitar los fallos', `Los valores incluidos son los enteros de 0 a ${failures}; no se suman r ensayos al argumento de la CDF.`),
          step('Sumar las masas', `Aplicamos la fórmula anterior a cada número de fallos. Las probabilidades son, aproximadamente, ${Array.from({length:failures+1},(_,value)=>format(core.negbin.pdf(value,successes,successProbability))).join(' + ')}. Suman ${format(cumulative)}; la función de acumulada calcula esa misma suma.`, String.raw`P(F\le k)=\sum_{j=0}^k\binom{j+r-1}{j}p^r(1-p)^j`)
        ], 'Con k=0, la acumulada coincide con la masa p^r de no observar ningún fallo.'),
        question('mean-failures', 'Calcula E[F], el número esperado de fallos.', mean, 'fallos esperados', 'Suma las esperanzas de las r esperas geométricas que cuentan fallos.', [
          step('Separar las esperas', `Cada tramo hasta un éxito aporta (1-p)/p = ${format((1 - successProbability) / successProbability)} fallos esperados.`),
          step('Sumar r tramos', `${successes} × ${format(1 - successProbability)}/${format(successProbability)} = ${format(mean)}.`, String.raw`E[F]=\frac{r(1-p)}p`)
        ], `Es una esperanza, posiblemente fraccionaria; E[T]=E[F]+r=${format(mean + successes)}, pero cada recuento observado es entero.`),
        question('variance', 'Calcula Var(F).', variance, 'fallos al cuadrado', 'Las r esperas geométricas son independientes.', [
          step('Usar la varianza de un tramo', `Un tramo tiene varianza (1-p)/p² = ${format((1 - successProbability) / successProbability ** 2)}.`),
          step('Sumar las varianzas', `${successes} × ${format(1 - successProbability)}/${format(successProbability)}² = ${format(variance)}.`, String.raw`\operatorname{Var}(F)=\frac{r(1-p)}{p^2}`)
        ], 'La varianza supera la media; añadir la constante r para contar ensayos no cambia la varianza.')
      ], 'math', {distribution:'negative-binomial', r:successes, p:successProbability, k:failures, minimum:0, counts:'failures'});
  },

  cauchy(seed, choose) {
    const location = choose([-2, 0, 3]);
    const scale = choose([0.5, 1, 2]);
    const upperFactor = choose([1, 2, 3]);
    const lower = location - scale;
    const upper = location + upperFactor * scale;
    const core = statistics();
    const chance = core.cauchy.cdf(upper, location, scale) - core.cauchy.cdf(lower, location, scale);
    const median = core.cauchy.inv(0.5, location, scale);
    return exercise('cauchy', seed, 'La desviación de una señal de biosensor respecto a una referencia se modeliza, de forma ficticia, con una Cauchy de colas pesadas.',
      [`Localización x₀=${format(location)} y escala γ=${format(scale)}, en unidades de señal; soporte toda la recta real.`, `Intervalo [${format(lower)},${format(upper)}]. La localización es mediana, no media: E[X] no existe y la varianza no está definida.`],
      ['Se supone este modelo para una señal con signo, no para un recuento ni para toda señal biológica.', 'La simetría no permite cancelar integrales divergentes para definir una esperanza finita.'], [
        probability('interval', 'Calcula la probabilidad de que X caiga en el intervalo indicado.', chance, 'Resta las CDF de los extremos; no uses una media ni una desviación típica inexistentes.', [
          step('Cambiar a la escala estándar', `(l-x₀)/γ=-1 y (u-x₀)/γ=${upperFactor}.`),
          step('Escribir la acumulada', 'F(x)=1/2+arctan((x-x₀)/γ)/π.', String.raw`F(x)=\frac12+\frac1\pi\arctan\!\left(\frac{x-x_0}{\gamma}\right)`),
          step('Restar las áreas', `Al restar las acumuladas se cancelan las dos mitades. Queda la diferencia entre arco tangente de ${upperFactor} y arco tangente de menos uno, dividida entre pi: aproximadamente ${format(chance)}. Es el área entre los límites estandarizados.`)
        ], 'Los extremos individuales tienen probabilidad cero; las colas no impiden calcular probabilidades de intervalos.'),
        question('median', 'Calcula la mediana de X, el cuantil 0,5.', median, 'unidades de señal', 'Impón F(m)=1/2, no E[X]=x₀.', [
          step('Resolver la acumulada central', 'F(m)=1/2 implica arctan((m-x₀)/γ)=0, luego m=x₀.', String.raw`Q(u)=x_0+\gamma\tan\!\left(\pi(u-1/2)\right)`),
          step('Sustituir el cuantil', `Para la probabilidad una mitad, el argumento de la tangente es cero y su valor también. La corrección de escala desaparece: la mediana coincide con la localización, ${format(median)}, aunque no exista una esperanza.`)
        ], 'La mediana existe aunque la esperanza no exista; una media muestral finita no crea una media poblacional.')
      ], 'math', {distribution:'cauchy', location, scale, lower, upper});
  },

  weibull(seed, choose) {
    const shape = choose([0.75, 1, 2, 3]);
    const scale = choose([6, 9, 12]);
    const time = scale * choose([0.5, 1, 1.5]);
    const quantileProbability = choose([0.5, 0.8, 0.9]);
    const core = statistics();
    const survival = 1 - core.weibull.cdf(time, scale, shape);
    const quantile = core.weibull.inv(quantileProbability, scale, shape);
    return exercise('weibull', seed, 'T es el tiempo hasta que un biosensor pierde su actividad, bajo un modelo Weibull ficticio.',
      [`Escala α=${scale} horas; forma β=${format(shape)}, sin unidades; soporte T≥0.`, `Umbral t=${format(time)} horas; cuantil solicitado u=${format(quantileProbability)}.`],
      ['Forma y escala son positivas; el modelo describe el tiempo completo, sin censura en este ejercicio.', 'La supervivencia es la exponencial de menos el tiempo relativo a la escala elevado a la forma. Dividimos por la escala antes de elevar: el exponente debe ser adimensional.'], [
        probability('survival', 'Calcula P(T>t).', survival, 'Primero divide el tiempo por la escala y después eleva a la forma.', [
          step('Formar una razón sin unidades', `t/α = ${format(time)}/${scale} = ${format(time / scale)}.`),
          step('Aplicar la potencia y la exponencial', `exp(-(${format(time / scale)})^${format(shape)}) = ${format(survival)}.`, String.raw`S(t)=e^{-(t/\alpha)^\beta}`),
          step('Relacionar supervivencia y CDF', `Haber perdido actividad antes del umbral y conservarla después son sucesos complementarios en este modelo continuo. Restar a uno la acumulada en ${format(time)} horas da la misma supervivencia, ${format(survival)}.`)
        ], shape === 1 ? 'Con forma uno se recupera una exponencial de escala α y tasa 1/α.' : 'Con forma distinta de uno no se presupone falta de memoria ni riesgo constante.'),
        question('quantile', 'Calcula q tal que P(T≤q)=u.', quantile, 'horas', 'El cuantil usa 1−u como supervivencia, no u.', [
          step('Pasar a supervivencia', `exp(-(q/α)^β) = 1-u = ${format(1 - quantileProbability)}.`),
          step('Despejar con logaritmos', `(q/α)^β = -log(1-u); q=α[-log(1-u)]^(1/β).`, String.raw`q_u=\alpha[-\log(1-u)]^{1/\beta}`),
          step('Sustituir forma y escala', `La supervivencia buscada es ${format(1 - quantileProbability)}. Tomamos menos su logaritmo, elevamos a uno dividido entre la forma ${format(shape)} y multiplicamos por la escala ${scale} horas. El tiempo resultante es aproximadamente ${format(quantile)} horas.`)
        ], `Bajo el modelo, la proporción ${format(quantileProbability)} pierde su actividad antes de este tiempo; no es una vida útil idéntica para todos.`)
      ], 'math', {distribution:'weibull', shape, scale, time, quantileProbability});
  },

  multinomial(seed, choose) {
    const total = choose([6, 8, 10]);
    const probabilities = choose([[0.5, 0.3, 0.2], [0.2, 0.5, 0.3], [0.25, 0.25, 0.5]]);
    const first = choose([0, 1, 2, 3]);
    const second = choose([0, 1, 2]);
    const counts = [first, second, total - first - second];
    const core = statistics();
    const logCoefficient = core.gammaln(total + 1) - counts.reduce((sum, count) => sum + core.gammaln(count + 1), 0);
    const coefficient = Math.round(Math.exp(logCoefficient));
    const sequenceProbability = counts.reduce((product,count,index)=>product*probabilities[index]**count,1);
    const exact = Math.exp(logCoefficient + counts.reduce((sum, count, index) => sum + count * Math.log(probabilities[index]), 0));
    const marginal = core.binomial.pdf(first, total, probabilities[0]);
    const covariance = -total * probabilities[0] * probabilities[1];
    return exercise('multinomial', seed, 'Cada célula de un lote se clasifica en una sola categoría: A en reposo, B activada o C dañada. X_A, X_B y X_C cuentan las tres categorías.',
      [`n=${total}; (p_A,p_B,p_C)=(${probabilities.map(format).join('; ')}), con suma uno.`, `Recuentos observados (x_A,x_B,x_C)=(${counts.join(', ')}), con suma ${total}; el soporte son ternas enteras no negativas que suman n.`],
      ['Categorías mutuamente excluyentes y exhaustivas para cada célula.', 'Células independientes con probabilidades constantes; los recuentos de categorías no son independientes.'], [
        probability('exact', 'Calcula P(X_A=x_A, X_B=x_B, X_C=x_C).', exact, 'Una secuencia tiene probabilidad producto; el coeficiente reúne todas las secuencias con esos recuentos.', [
          step('Contar las secuencias', `Coeficiente n!/(x_A!x_B!x_C!); Γ(m+1)=m!, incluido 0!=1.`, String.raw`\log C=\log\Gamma(n+1)-\sum_{i=A,B,C}\log\Gamma(x_i+1)`),
          step('Evaluar el coeficiente', `El factorial de ${total} se divide por los factoriales de ${counts.join(', ')}. El numerador es ${core.factorial(total)} y el denominador es ${counts.map(count=>core.factorial(count)).join(' por ')}; obtenemos ${coefficient} secuencias diferentes.`),
          step('Ponderar una secuencia', `Multiplicamos ${probabilities.map((chance,index)=>`${format(chance)} elevado a ${counts[index]}`).join(' por ')}. La probabilidad de una secuencia concreta es ${format(sequenceProbability)}; cualquier factor con exponente cero vale uno.`),
          step('Reunir todas las secuencias', `Las ${coefficient} secuencias son excluyentes y tienen la misma probabilidad. Multiplicamos ${coefficient} por ${format(sequenceProbability)} y obtenemos ${format(exact)}. Para números grandes, el software calcula la misma expresión con logaritmos de factoriales y una exponencial final.`, String.raw`P(\boldsymbol X=\boldsymbol x)=\frac{n!}{\prod_i x_i!}\prod_i p_i^{x_i}`),
          step('Comprobar la restricción', `${counts.join(' + ')} = ${total}; omitir una categoría sin ajustar su recuento rompería el total.`)
        ], 'La masa corresponde a una terna de recuentos, no a una secuencia particular de células.'),
        probability('marginal-a', 'Calcula P(X_A=x_A), sin fijar X_B ni X_C.', marginal, 'Agrupa B y C como no A y usa una binomial.', [
          step('Reducir a dos resultados', `A tiene probabilidad ${format(probabilities[0])}; no A tiene ${format(probabilities[1])}+${format(probabilities[2])}=${format(1 - probabilities[0])}.`),
          step('Evaluar la masa marginal', `Para contar la categoría A reunimos las otras dos como no A. Elegimos ${first} posiciones entre ${total} y ponderamos: C(${total},${first}) × ${format(probabilities[0])}^${first} × ${format(1-probabilities[0])}^${total-first} = ${format(marginal)}. Es la binomial ya estudiada.`, String.raw`X_A\sim\operatorname{Bin}(n,p_A)`)
        ], 'La marginal suma todas las maneras compatibles de repartir las otras células entre B y C.'),
        question('covariance-ab', 'Calcula Cov(X_A,X_B).', covariance, 'células al cuadrado', 'Una misma célula no puede pertenecer a A y B; células distintas son independientes.', [
          step('Usar indicadores por célula', 'En una célula I_A I_B=0, así que Cov(I_A,I_B)=0-p_A p_B; los términos entre células distintas son cero.'),
          step('Sumar n contribuciones', `-${total} × ${format(probabilities[0])} × ${format(probabilities[1])} = ${format(covariance)}.`, String.raw`\operatorname{Cov}(X_A,X_B)=-np_Ap_B`)
        ], 'La covarianza negativa surge del total compartido, no de una interacción causal entre estados celulares.')
      ], 'math', {distribution:'multinomial', n:total, probabilities, counts, logCoefficient});
  },

  'bivariate-normal'(seed, choose) {
    const meanX = choose([40, 55, 65]);
    const meanY = choose([110, 135, 150]);
    const sdX = choose([4, 6, 8]);
    const sdY = choose([6, 10, 12]);
    const rho = choose([-0.8, -0.6, 0, 0.6, 0.8]);
    const observedX = meanX + sdX * choose([-1, 1, 2]);
    const threshold = meanY + sdY * choose([-0.5, 0.5, 1]);
    const conditionalMean = meanY + rho * sdY / sdX * (observedX - meanX);
    const conditionalSd = sdY * Math.sqrt(1 - rho ** 2);
    const tail = 1 - statistics().normal.cdf(threshold, conditionalMean, conditionalSd);
    return exercise('bivariate-normal', seed, 'X e Y son dos intensidades de expresión medidas en la misma célula. Se supone una normal conjunta bivariante no degenerada como modelo ficticio.',
      [`Medias μ_X=${meanX}, μ_Y=${meanY}; desviaciones σ_X=${sdX}, σ_Y=${sdY}, en unidades de señal; ρ=${format(rho)}.`, `Se fija X=x=${observedX}; umbral de Y: c=${format(threshold)}. El segundo parámetro de la notación normal es la varianza; al tipificar dividiremos por su raíz, la desviación típica.`],
      ['Se supone normalidad conjunta, no solo dos marginales normales; σ_X,σ_Y>0 y |ρ|<1.', 'El soporte teórico es R²; condicionar en un valor continuo se define mediante densidades y no implica causalidad.'], [
        question('conditional-mean', 'Calcula E[Y | X=x].', conditionalMean, 'unidades de señal', 'Desplaza μ_Y por ρ(σ_Y/σ_X)(x−μ_X).', [
          step('Medir la desviación de X', `x-μ_X=${observedX}-${meanX}=${observedX - meanX}; pendiente ρσ_Y/σ_X=${format(rho * sdY / sdX)}.`),
          step('Desplazar la media marginal', `${meanY} + (${format(rho)}) × ${sdY}/${sdX} × (${observedX - meanX}) = ${format(conditionalMean)}.`, String.raw`\mu_{Y\mid x}=\mu_Y+\rho\frac{\sigma_Y}{\sigma_X}(x-\mu_X)`)
        ], 'Es una media de posibles señales Y al fijar X, no el valor exacto de cada célula.'),
        question('conditional-sd', 'Calcula la desviación típica de Y | X=x, no su varianza.', conditionalSd, 'unidades de señal', 'Primero reduce la varianza por 1−ρ² y después toma su raíz.', [
          step('Obtener la varianza condicional', `${sdY}² × (1-(${format(rho)})²) = ${format(sdY ** 2 * (1 - rho ** 2))}.`, String.raw`\sigma^2_{Y\mid x}=\sigma_Y^2(1-\rho^2)`),
          step('Recuperar las unidades de señal', `${sdY} × √(1-(${format(rho)})²) = ${format(conditionalSd)}.`, String.raw`\sigma_{Y\mid x}=\sigma_Y\sqrt{1-\rho^2}`)
        ], 'La reducción depende de ρ² y no del signo de ρ ni del valor particular de x.'),
        probability('conditional-tail', 'Calcula P(Y>c | X=x).', tail, 'Usa la media y la desviación condicionales, no las marginales.', [
          step('Identificar la normal del corte', `Y | X=${observedX} sigue N(${format(conditionalMean)}, ${format(conditionalSd ** 2)}), con el segundo parámetro como varianza.`),
          step('Tipificar el umbral', `z=(${format(threshold)}-${format(conditionalMean)})/${format(conditionalSd)}=${format((threshold - conditionalMean) / conditionalSd)}.`, String.raw`P(Y>c\mid X=x)=1-\Phi\!\left(\frac{c-\mu_{Y\mid x}}{\sigma_{Y\mid x}}\right)`),
          step('Tipificar el umbral condicionado', `Restamos la nueva media y dividimos por la nueva desviación: (${format(threshold)} − ${format(conditionalMean)})/${format(conditionalSd)} = ${format((threshold-conditionalMean)/conditionalSd)}.`),
          step('Evaluar la cola correcta', `La acumulada normal da el área a la izquierda: ${format(1-tail)}. La pregunta pide valores mayores, así que restamos de uno: 1 − ${format(1-tail)} = ${format(tail)}.`)
        ], 'La probabilidad es condicional en este modelo conjunto; dos marginales normales solas no justifican esta fórmula.')
      ], 'math', {distribution:'bivariate-normal', meanX, meanY, sdX, sdY, rho, x:observedX, threshold, conditionalMean, conditionalSd});
  },

  'continuous-joint'(seed, choose) {
    const upper = choose([3, 5, 7]);
    const observedX = upper * choose([0.2, 0.4, 0.6]);
    const sumLimit = upper * choose([0.3, 0.5, 0.7]);
    const thresholdY = upper * choose([0.1, 0.25]);
    const constant = 2 / upper ** 2;
    const width = upper - observedX;
    const marginal = constant * width;
    const event = (sumLimit / upper) ** 2;
    const conditionalDensity = 1 / width;
    const conditionalTail = (width - thresholdY) / width;
    return exercise('continuous-joint', seed, 'X e Y son miligramos de nutriente asignados a dos microcultivos; puede quedar una parte sin asignar. El reparto se modeliza uniformemente sobre un triángulo.',
      [`Soporte: x≥0, y≥0, x+y≤a=${upper} mg; densidad conjunta f(x,y)=c dentro y cero fuera.`, `Se fija x=${format(observedX)} mg; b=${format(sumLimit)} mg para el evento X+Y≤b; d=${format(thresholdY)} mg para el corte Y>d.`],
      ['Uniforme sobre el área triangular, no sobre el cuadrado [0,a]²; X e Y no son independientes.', '0<x<a y 0<d<a-x; la condición continua X=x usa el cociente de densidades donde f_X(x)>0.'], [
        question('normalizer', 'Calcula c para normalizar la densidad conjunta.', constant, 'mg a la potencia -2', 'Para cada x, y recorre desde cero hasta a−x.', [
          step('Integrar sobre el soporte', 'El corte vertical tiene longitud a-x; la integral total es c∫₀ᵃ(a-x)dx=c a²/2.', String.raw`\int_0^a\int_0^{a-x}c\,dy\,dx=\frac{ca^2}{2}=1`),
          step('Despejar la altura', `c=2/${upper}²=${format(constant)}; tiene unidades mg⁻², no unidades de probabilidad.`)
        ], 'La probabilidad es densidad por área; la altura de la superficie no es una probabilidad puntual.', 0.0005),
        question('marginal-density', 'Calcula f_X(x) en el valor interior dado.', marginal, 'mg a la potencia -1', 'Integra la conjunta a lo largo de todos los y compatibles con x.', [
          step('Medir el corte vertical', `a-x=${upper}-${format(observedX)}=${format(width)} mg.`),
          step('Integrar su altura', `f_X(x)=c(a-x)=${format(constant)} × ${format(width)}=${format(marginal)} mg⁻¹.`, String.raw`f_X(x)=\int_0^{a-x}c\,dy=\frac{2(a-x)}{a^2},\quad 0<x<a`)
        ], 'Es una densidad marginal decreciente, no P(X=x), que vale cero.', 0.0005),
        probability('sum-event', 'Calcula P(X+Y≤b).', event, 'El evento es un triángulo más pequeño dentro del soporte.', [
          step('Delimitar la región', `Como b=${format(sumLimit)}<a=${upper}, sus cortes van de y=0 a y=b-x con 0≤x≤b; el área es b²/2.`),
          step('Multiplicar densidad por área', `c b²/2 = (${format(sumLimit)}/${upper})² = ${format(event)}.`, String.raw`P(X+Y\le b)=\int_0^b\int_0^{b-x}\frac{2}{a^2}\,dy\,dx=\frac{b^2}{a^2}`)
        ], 'El resultado no tiene unidades; integrar el cuadrado que contiene la región daría otra respuesta.'),
        question('conditional-density', 'Calcula f_{Y|X}(d | x) en el corte indicado.', conditionalDensity, 'mg a la potencia -1', 'Divide la altura conjunta por f_X(x), no por P(X=x).', [
          step('Normalizar el corte', `c/[c(a-x)]=1/(a-x); el soporte condicionado es 0≤y≤${format(width)}.`, String.raw`f_{Y\mid X}(y\mid x)=\frac{f_{X,Y}(x,y)}{f_X(x)}=\frac1{a-x}`),
          step('Sustituir y comprobar el área', `1/${format(width)}=${format(conditionalDensity)} mg⁻¹; altura por longitud = (1/${format(width)}) × ${format(width)} = 1.`)
        ], 'La densidad condicional es uniforme en el corte; evaluarla en d no da P(Y=d | X=x).', 0.0005),
        probability('conditional-tail', 'Calcula P(Y>d | X=x).', conditionalTail, 'Compara la longitud por encima de d con la longitud total del corte.', [
          step('Delimitar el intervalo favorable', `En este corte Y va de 0 a ${format(width)}; por encima de d quedan ${format(width - thresholdY)} mg.`),
          step('Integrar la densidad condicional', `(${format(width)}-${format(thresholdY)})/${format(width)}=${format(conditionalTail)}.`, String.raw`P(Y>d\mid X=x)=\int_d^{a-x}\frac{dy}{a-x}=\frac{a-x-d}{a-x}`)
        ], 'Es una probabilidad sin unidades obtenida de una longitud; no se divide por la probabilidad puntual nula de X=x.')
      ], 'math', {distribution:'uniform-triangle', a:upper, x:observedX, b:sumLimit, d:thresholdY, constant, width});
  },

  'exponential-family'(seed, choose) {
    const values = choose([[1, 0, 2, 1, 3], [2, 4, 1, 3, 2], [0, 1, 0, 2], [3, 2, 4, 1, 5]]);
    const sampleSize = values.length;
    const total = values.reduce((sum, count) => sum + count, 0);
    const candidate = choose([1, 2, 3, 4]);
    const mean = total / sampleSize;
    const logFactorials = values.reduce((sum, count) => sum + statistics().gammaln(count + 1), 0);
    const logLikelihood = total * Math.log(candidate) - sampleSize * candidate - logFactorials;
    return exercise('exponential-family', seed, 'Un laboratorio registra detecciones bacterianas en ventanas de un minuto de igual exposición. Se supone una muestra iid Poisson con media λ común desconocida.',
      [`Recuentos observados enteros: [${values.join(', ')}]; n=${sampleSize} ventanas.`, `λ>0 se mide en detecciones esperadas por ventana; para evaluar la log-verosimilitud se propone λ₀=${candidate}.`],
      ['Las ventanas son independientes y tienen la misma exposición y media Poisson.', 'Se mantienen fijos los datos y n al comparar λ; la suma observada es positiva y el máximo es interior.'], [
        question('sufficient-statistic', 'Calcula T=Σx_i, el estadístico suficiente para λ con n fijo.', total, 'detecciones', 'Agrupa los exponentes de λ en el producto de masas Poisson.', [
          step('Factorizar la muestra', 'La independencia permite multiplicar las masas de todas las ventanas. Cada masa aporta una exponencial de menos lambda, una potencia de lambda con su recuento y un factorial en el denominador. Agrupar las potencias concentra los datos en su suma; los factoriales son constantes cuando comparamos parámetros.', String.raw`L(\lambda;\boldsymbol x)=h(\boldsymbol x)\exp\{T\log\lambda-n\lambda\},\quad h=\frac1{\prod_i x_i!}`),
          step('Identificar la información del parámetro', `Sumamos los recuentos ${values.join(', ')} y obtenemos T igual a ${total}. El parámetro natural es el logaritmo de lambda; para una observación, el normalizador es la exponencial del parámetro natural, es decir, lambda.`)
        ], 'Con n fijo, la parte de la verosimilitud que depende de λ usa los datos solo mediante T; no se afirma que el modelo sea verdadero.', 0),
        question('mle', 'Calcula el estimador de máxima verosimilitud de λ.', mean, 'detecciones esperadas por ventana', 'Deriva la log-verosimilitud respecto a λ con los datos fijos.', [
          step('Derivar e igualar a cero', 'Al tomar logaritmos, el producto se convierte en suma. La derivada del total por log lambda es el total dividido entre lambda; la del término menos n por lambda es menos n. Los factoriales no varían con lambda. Igualar la derivada a cero y despejar da el total dividido entre n.', String.raw`\ell'(\lambda)=T/\lambda-n=0\quad\Longrightarrow\quad\hat\lambda=T/n`),
          step('Sustituir la muestra', `Dividimos el total ${total} entre las ${sampleSize} ventanas: la media estimada es ${format(mean)} detecciones por ventana.`),
          step('Comprobar que es máximo', `La segunda derivada es menos el total dividido entre lambda al cuadrado. Como el total es ${total}, positivo, y lambda también es positivo, esa derivada es negativa. La log-verosimilitud es cóncava y el punto calculado es su máximo único.`)
        ], 'La media estimada puede ser fraccionaria aunque todas las observaciones sean enteras; no es una probabilidad posterior de λ.'),
        question('log-likelihood', 'Calcula ℓ(λ₀), incluyendo el término de los factoriales y usando logaritmos naturales.', logLikelihood, 'log-verosimilitud sin unidades', 'Incluye −Σlog(x_i!), aunque ese término no cambie el máximo.', [
          step('Convertir el producto en suma', 'La log-verosimilitud suma tres contribuciones: el total observado por el logaritmo natural de la media candidata, menos el número de ventanas por esa media, menos la suma de logaritmos de los factoriales observados. Para cero, el factorial es uno y su logaritmo es cero. La biblioteca usa la función gamma para evaluar esos mismos factoriales sin desbordamiento.', String.raw`\ell(\lambda_0)=T\log\lambda_0-n\lambda_0-\sum_i\log\Gamma(x_i+1)`),
          step('Sustituir todos los términos', `El primer término es ${total} por el logaritmo natural de ${candidate}, que vale ${format(total*Math.log(candidate))}. Restamos ${sampleSize} por ${candidate}, es decir, ${sampleSize*candidate}, y después ${format(logFactorials)} por los factoriales. El resultado es ${format(logLikelihood)}. No es una probabilidad y puede ser negativo.`)
        ], 'La familia exponencial es una estructura de modelos; este ejemplo trata recuentos Poisson, no tiempos exponenciales.')
      ], 'math', {distribution:'poisson-sample', values, n:sampleSize, total, candidate});
  }
};

export function generateExercise(typeId, seed = 1) {
  if (typeof typeId !== 'string' || !EXERCISE_TYPES.some(item => item.id === typeId)) throw new RangeError('Tipo de ejercicio desconocido.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new RangeError('La semilla debe ser un entero entre 0 y 4294967295.');
  const random = randomSource(seed, typeId);
  const choose = values => values[Math.floor(random() * values.length)];
  return generators[typeId](seed, choose);
}

export function scopeExercise(lesson, generated) {
  const allowed = lesson.exerciseQuestions?.[generated.type];
  if (!allowed) return generated;
  const questions = generated.questions.filter(item => allowed.includes(item.id));
  if (questions.length !== allowed.length) throw new RangeError(`Preguntas incompatibles con ${lesson.id}.`);
  return {...generated, questions};
}