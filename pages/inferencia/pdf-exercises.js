const FILES = {
  1: 'Ejercicios_Unidad_1-Soluciones.pdf',
  2: 'Ejercicios_Unidad_2-Soluciones.pdf',
  3: 'Ejercicios_U3-Distribuciones_multivariantes-SOLUCIONES.pdf'
};

const fmt = value => Number(value.toPrecision(9)).toString().replace('.', ',');
const beat = (title, comment, tex, diagram) => ({title, comment, ...(tex ? {tex} : {}), ...(diagram ? {diagram} : {})});
const bars = (labels, values, highlight = []) => ({kind:'bars', labels:labels.map(String), values, highlight});
const matrix = (rows, columns, values, highlight = []) => ({kind:'matrix', rows:rows.map(String), columns:columns.map(String), values, highlight});
const region = (points, cut) => ({kind:'region', points, ...(cut ? {cut} : {})});
const normal = (mean, sd, lower, upper) => ({kind:'normal', mean, sd, ...(lower === undefined ? {} : {lower}), ...(upper === undefined ? {} : {upper})});

function statistics() {
  if (!globalThis.jStat) throw new Error('Carga globalThis.jStat antes de solicitar los ejercicios PDF con distribuciones notables.');
  return globalThis.jStat;
}

function combination(total, selected) {
  return statistics().combination(total, selected);
}

function binomialQuestion(id, prompt, total, probability, selected) {
  const coefficient = combination(total, selected);
  const failures = total-selected;
  const answer = statistics().binomial.pdf(selected,total,probability);
  return question(id,prompt,answer,[
    beat('Contar las posiciones',`Hay ${total} ensayos y quiero ${selected} éxitos. El coeficiente binomial cuenta en qué posiciones pueden aparecer.`,String.raw`\binom{${total}}{${selected}}=\frac{${total}!}{${selected}!${failures}!}=${coefficient}`),
    beat('Ponderar los éxitos',`Cada éxito tiene probabilidad ${fmt(probability)}. La independencia permite multiplicar esas probabilidades.`,String.raw`${probability}^{${selected}}=${probability**selected}`),
    beat('La probabilidad de fracaso','Resto la probabilidad de éxito de uno para obtener la probabilidad del otro resultado.',String.raw`1-${probability}=${1-probability}`),
    beat('Ponderar los fracasos',`Quedan ${failures} fracasos, cada uno con probabilidad uno menos ${fmt(probability)}.`,String.raw`${1-probability}^{${failures}}=${(1-probability)**failures}`),
    beat('Combinar posiciones y pesos','Multiplico el número de secuencias por la probabilidad de cada secuencia, sin redondear los factores.',String.raw`P(X=${selected})=\binom{${total}}{${selected}}${probability}^{${selected}}${1-probability}^{${failures}}`,bars([selected,`Distinto de ${selected}`],[answer,1-answer],[0]))
  ],'La binomial exige ensayos independientes y probabilidad constante.');
}

function poissonQuestion(id, prompt, rate, selected) {
  const answer = statistics().poisson.pdf(selected,rate);
  return question(id,prompt,answer,[
    beat('Identificar la exposición',`Lambda, la media de eventos en la exposición del enunciado, vale ${rate}. No cambio esa exposición.`,String.raw`\lambda=${rate}`),
    beat('Elevar la media',`Para exactamente ${selected} eventos, la masa contiene lambda elevada a ese recuento.`,String.raw`${rate}^{${selected}}=${rate**selected}`),
    beat('La atenuación exponencial','La masa de Poisson incluye el factor e elevado a menos lambda.',String.raw`e^{-${rate}}=${Math.exp(-rate)}`),
    beat('Contar reordenaciones','El factorial del recuento corrige las ordenaciones del mismo conjunto de eventos.',String.raw`${selected}!=${statistics().factorial(selected)}`),
    beat('Combinar los factores','Multiplico la potencia por la exponencial y divido por el factorial.',String.raw`P(X=${selected})=\frac{${rate}^{${selected}}e^{-${rate}}}{${selected}!}`,bars([selected,`Distinto de ${selected}`],[answer,1-answer],[0]))
  ],'Esta es una masa puntual, no una probabilidad acumulada.');
}

function normalIntervalQuestion(id, prompt, mean, sd, lower, upper, percent = false) {
  const cdf = value => statistics().normal.cdf(value,0,1);
  const lowerZ = lower === undefined ? undefined : (lower-mean)/sd;
  const upperZ = upper === undefined ? undefined : (upper-mean)/sd;
  const lowerCdf = lowerZ === undefined ? 0 : cdf(lowerZ);
  const upperCdf = upperZ === undefined ? 1 : cdf(upperZ);
  const probability = upperCdf-lowerCdf;
  const steps = [];
  for (const [name,value,zValue] of [['inferior',lower,lowerZ],['superior',upper,upperZ]]) {
    if (value === undefined) continue;
    steps.push(beat(`Centrar el límite ${name}`,`Mu es la media, ${mean}. Resto la media al umbral ${value} para medir su desplazamiento.`,String.raw`${value}-${mean}=${value-mean}`));
    steps.push(beat(`Tipificar el límite ${name}`,`Sigma es la desviación típica, ${sd}. Divido el desplazamiento entre sigma para obtener z, medido en desviaciones.`,String.raw`z_{${name}}=\frac{${value-mean}}{${sd}}=${zValue}`,normal(mean,sd,lower,upper)));
    steps.push(beat(`Consultar la acumulada ${name}`,'Phi, la acumulada de la normal estándar, mide el área a la izquierda de z.',String.raw`\Phi(${zValue})=${cdf(zValue)}`));
  }
  steps.push(beat(lower === undefined ? 'Conservar la acumulada' : upper === undefined ? 'La cola derecha' : 'Restar las áreas',
    lower === undefined ? 'Desde menos infinito no hay área previa que restar.' : upper === undefined ? 'Hasta más infinito la acumulada vale uno. Le resto el área que queda a la izquierda.' : 'El área entre límites es la acumulada superior menos la inferior.',
    String.raw`P=${upperCdf}-${lowerCdf}=${probability}`,normal(mean,sd,lower,upper)));
  if (percent) steps.push(beat('Expresar el porcentaje','Multiplico la probabilidad por cien para responder en porcentaje.',String.raw`100\cdot ${probability}=${100*probability}\%`));
  return question(id,prompt,probability,steps,'Los extremos aislados no alteran un área normal. Puedes responder con la proporción o con un porcentaje explícito.');
}

function normalQuantileQuestion(id, prompt, mean, sd, probability, unit) {
  const standardized = statistics().normal.inv(probability,0,1);
  const answer = mean+sd*standardized;
  return question(id,prompt,answer,[
    beat('Plantear la acumulada','Un percentil fija un área a la izquierda, no una altura de la densidad.',String.raw`P(X\leq c)=${probability}`),
    beat('Buscar el cuantil estándar','Phi inversa devuelve z, el número de desviaciones que deja esa área a la izquierda.',String.raw`z=\Phi^{-1}(${probability})=${standardized}`),
    beat('Recuperar la escala','Multiplico z por sigma, la desviación típica, para volver a las unidades originales.',String.raw`${sd}\cdot ${standardized}=${sd*standardized}`),
    beat('Recuperar el centro','Sumo mu, la media, al desplazamiento obtenido.',String.raw`c=${mean}+(${sd*standardized})=${answer}`,normal(mean,sd,undefined,answer))
  ],'La normal invierte una probabilidad acumulada; no se busca el cuantil de la cola contraria.',unit,0.0005);
}

function question(id, prompt, answer, tutorSteps, interpretation, unit = 'probabilidad entre 0 y 1', tolerance = 0.00005) {
  if (!Number.isFinite(answer) || !Number.isFinite(tolerance) || tolerance < 0) throw new RangeError(`Respuesta o tolerancia no válida en ${id}.`);
  if (unit === 'probabilidad entre 0 y 1' && (answer < 0 || answer > 1)) throw new RangeError(`Probabilidad fuera del intervalo unidad en ${id}.`);
  return {id, prompt, answer, tolerance, unit, hint:tutorSteps[0].comment,
    steps:tutorSteps.map(({title, comment, tex}) => ({title, explanation:comment, ...(tex ? {tex} : {})})),
    interpretation, tutorSteps};
}

function define(unit, number, page, title, lessonIds, factory) {
  return {id:`pdf-u${unit}-${number}`, type:'pdf', title, source:{file:FILES[unit], number:String(number), page}, lessonIds, factory};
}

function content(prompt, given, questions, diagram, assumptions = []) {
  return {prompt, given, assumptions, questions, visual:{type:'pdf', params:{diagram}}};
}

function momentQuestions(values, probabilities, unit, prefix = '') {
  const mean = values.reduce((total,value,index) => total + value * probabilities[index],0);
  const second = values.reduce((total,value,index) => total + value ** 2 * probabilities[index],0);
  const diagram = bars(values, probabilities);
  const meanBeats = values.map((value,index) => beat(`Ponderar el valor ${value}`,
    `X vale ${value} con probabilidad ${fmt(probabilities[index])}. Multiplico el valor por su masa para obtener su aporte a la esperanza.`,
    String.raw`${value}\cdot ${probabilities[index]}=${value*probabilities[index]}`, {...diagram,highlight:[index]}));
  meanBeats.push(beat('Sumar las contribuciones','E de X, la esperanza de X, suma todos esos aportes; no suma solo los valores posibles.',
    String.raw`E[X]=${values.map((value,index) => value*probabilities[index]).join('+')}=${mean}`));
  const squareBeats = values.flatMap((value,index) => [
    beat(`Elevar ${value} al cuadrado`,'Para el segundo momento ordinario transformo primero el valor, antes de ponderarlo.',String.raw`${value}^2=${value**2}`),
    beat(`Ponderar el cuadrado de ${value}`,'Conservo la probabilidad original de ese valor.',String.raw`${value**2}\cdot ${probabilities[index]}=${value**2*probabilities[index]}`,{...diagram,highlight:[index]})
  ]);
  squareBeats.push(
    beat('El segundo momento','Sumo los cuadrados ponderados. E de X al cuadrado no es aún la varianza.',String.raw`E[X^2]=${values.map((value,index) => value**2*probabilities[index]).join('+')}=${second}`),
    beat('El cuadrado de la media','La media se obtuvo sumando los valores ponderados. Ahora elevo esa media al cuadrado.',String.raw`E[X]=${mean},\qquad E[X]^2=${mean**2}`),
    beat('Restar para obtener la varianza','Var de X mide dispersión: al segundo momento le resto el cuadrado de la media.',String.raw`\operatorname{Var}(X)=${second}-${mean**2}=${second-mean**2}`)
  );
  return [question(`${prefix}mean`,'¿Cuál es E(X)?',mean,meanBeats,'La esperanza puede no ser un valor realizable.',unit),
    question(`${prefix}variance`,'¿Cuál es Var(X)?',second-mean**2,squareBeats,'La varianza tiene unidades al cuadrado.',`${unit} al cuadrado`)];
}

function laboratoryExperiment() {
  return ['A','B','C'].flatMap(first => ['A','B','C'].map(second => {
    const label = first+second;
    return {label, row:Array.from(label).filter(letter => letter === 'A').length,
      column:Array.from(label).filter(letter => letter === 'B').length, probability:1/9};
  }));
}

function coinExperiment() {
  return Array.from({length:8},(_,index) => {
    const sequence = Array.from({length:3},(_,position) => index & (1 << (2-position)) ? 'C':'X');
    const firstHead = sequence.indexOf('C');
    return {label:sequence.join(''), row:sequence.filter(face => face === 'C').length,
      column:firstHead === -1 ? -1:firstHead+1, probability:1/8};
  });
}

function jointTable(rows, columns, outcomes) {
  const values = rows.map(() => columns.map(() => 0));
  for (const outcome of outcomes) values[rows.indexOf(outcome.row)][columns.indexOf(outcome.column)] += outcome.probability;
  return matrix(rows,columns,values);
}

function jointConstructionQuestion(rows, columns, outcomes, checkedRow, checkedColumn, comment) {
  const partial = rows.map(() => columns.map(() => 0));
  const tutorSteps = [beat('Definir las dos coordenadas',comment),
    beat('Probabilidad elemental','El experimento independiente y equiprobable asigna la misma probabilidad a cada secuencia.',String.raw`P(\text{secuencia})=1/${outcomes.length}`)];
  for (const outcome of outcomes) {
    const rowIndex = rows.indexOf(outcome.row);
    const columnIndex = columns.indexOf(outcome.column);
    tutorSteps.push(beat(`Leer ${outcome.label}`,`La secuencia ${outcome.label} produce el par de valores ${outcome.row} y ${outcome.column}. No confundo una secuencia con su pareja de variables.`,String.raw`${outcome.label}\ \longmapsto\ (Y_1,Y_2)=(${outcome.row},${outcome.column})`));
    const previous = partial[rowIndex][columnIndex];
    partial[rowIndex][columnIndex] += outcome.probability;
    tutorSteps.push(beat(`Acumular ${outcome.label}`,`Añado la probabilidad de esta secuencia a la celda de su pareja. Si otra secuencia llega a la misma celda, sus probabilidades se suman.`,
      String.raw`p(${outcome.row},${outcome.column})=${previous}+1/${outcomes.length}=${partial[rowIndex][columnIndex]}`,
      matrix(rows,columns,partial.map(row => [...row]),[[rowIndex,columnIndex]])));
  }
  tutorSteps.push(beat('La tabla conjunta completa','Cada fila fija Y uno y cada columna fija Y dos. Las celdas no alcanzadas tienen masa cero; fuera de los valores de esta tabla la masa también es cero.',
    String.raw`p_{Y_1,Y_2}=\begin{pmatrix}${partial.map(row => row.map(value => Number(value.toPrecision(9))).join('&')).join('\\\\')}\end{pmatrix}`,
    matrix(rows,columns,partial.map(row => [...row]))));
  tutorSteps.push(beat('Comprobar el total','Cada secuencia elemental aparece exactamente una vez en la tabla, así que la masa completa suma uno.',String.raw`${outcomes.length}\cdot\frac1{${outcomes.length}}=1`));
  return question('joint',`Construye toda la masa conjunta. Introduce como comprobación p(${checkedRow},${checkedColumn}).`,
    partial[rows.indexOf(checkedRow)][columns.indexOf(checkedColumn)],tutorSteps,'El agrupamiento conserva toda la probabilidad sin suponer independencia entre los dos recuentos.');
}

function predictiveQuestions(sensitivity, specificity, prevalence, suffix = '') {
  const sickPositive = sensitivity * prevalence;
  const healthyPositive = (1 - specificity) * (1 - prevalence);
  const sickNegative = (1 - sensitivity) * prevalence;
  const healthyNegative = specificity * (1 - prevalence);
  const table = matrix(['Condición', 'Sin condición'], ['Positivo', 'Negativo'], [[sickPositive, sickNegative], [healthyPositive, healthyNegative]]);
  return [
    question(`vpp${suffix}`, `Con prevalencia ${fmt(100 * prevalence)} %, ¿cuál es el valor predictivo positivo?`, sickPositive / (sickPositive + healthyPositive), [
      beat('La ruta positiva verdadera', 'Llamo D a tener la condición y más al resultado positivo. Multiplico la sensibilidad por la prevalencia para medir su intersección.', String.raw`P(D\cap +)=${sensitivity}\cdot ${prevalence}=${sickPositive}`, {...table, highlight:[[0,0]]}),
      beat('La tasa de falsos positivos', 'La especificidad describe negativos sin condición. Su complemento es la tasa de positivos sin condición.', String.raw`P(+\mid D^c)=1-${specificity}=${1-specificity}`),
      beat('La ruta positiva falsa', 'Multiplico esa tasa por la proporción sin condición; esta ruta también termina en positivo.', String.raw`P(D^c\cap +)=${1-specificity}\cdot ${1-prevalence}=${healthyPositive}`, {...table, highlight:[[1,0]]}),
      beat('Todos los positivos', 'Sumo ambas rutas de la columna positiva. Este es el denominador, no la sensibilidad.', String.raw`P(+)=${sickPositive}+${healthyPositive}=${sickPositive+healthyPositive}`, {...table, highlight:[[0,0],[1,0]]}),
      beat('Invertir la condición', 'Ahora divido los positivos verdaderos entre todos los positivos: eso responde por la condición dado el resultado.', String.raw`P(D\mid +)=\frac{${sickPositive}}{${sickPositive+healthyPositive}}`)
    ], 'El valor predictivo cambia con la prevalencia aunque la sensibilidad y la especificidad se mantengan.'),
    question(`vpn${suffix}`, `Con prevalencia ${fmt(100 * prevalence)} %, ¿cuál es el valor predictivo negativo?`, healthyNegative / (healthyNegative + sickNegative), [
      beat('La ruta negativa verdadera', 'D complemento significa no tener la condición. Multiplico su proporción por la especificidad.', String.raw`P(D^c\cap -)=${specificity}\cdot ${1-prevalence}=${healthyNegative}`, {...table, highlight:[[1,1]]}),
      beat('La tasa de falsos negativos', 'Resto la sensibilidad de uno porque buscamos un negativo entre quienes sí tienen la condición.', String.raw`P(-\mid D)=1-${sensitivity}=${1-sensitivity}`),
      beat('La ruta negativa falsa', 'Pondero esa tasa por la prevalencia para obtener la otra entrada de la columna negativa.', String.raw`P(D\cap -)=${1-sensitivity}\cdot ${prevalence}=${sickNegative}`, {...table, highlight:[[0,1]]}),
      beat('Todos los negativos', 'Sumo los negativos verdaderos y falsos antes de condicionar.', String.raw`P(-)=${healthyNegative}+${sickNegative}=${healthyNegative+sickNegative}`, {...table, highlight:[[0,1],[1,1]]}),
      beat('La proporción sin condición', 'Divido los negativos sin condición entre todos los negativos.', String.raw`P(D^c\mid -)=\frac{${healthyNegative}}{${healthyNegative+sickNegative}}`)
    ], 'Un negativo no elimina toda incertidumbre. Estas cifras son un modelo docente, no una recomendación clínica.')
  ];
}

const definitions = [
  define(1, 1, 1, 'Dos sucesos y sus complementos', ['sucesos','axiomas'], () => {
    const diagram = bars(['Solo A','Solo B','Ambos','Ninguno'], [0.2,0.5,0.1,0.2]);
    return content('A y B pueden coincidir. Calcula las cinco regiones pedidas a partir de sus probabilidades.',
      ['P(A)=0,3; P(B)=0,6; P(A∩B)=0,1.'], [
        question('a','¿Cuánto vale P(A∪B)?',0.8,[
          beat('Sumar los dos sucesos','P de A es la probabilidad del primer suceso; P de B, la del segundo. Empiezo sumándolas.',String.raw`0.3+0.6=0.9`),
          beat('Quitar el duplicado','La intersección, los resultados que cumplen ambos, se contó dos veces. Resto una copia.',String.raw`P(A\cup B)=0.9-0.1=0.8`,{...diagram,highlight:[0,1,2]})
        ],'La unión incluye el caso en que ocurren ambos.'),
        question('b','¿Cuánto vale P(Aᶜ)?',0.7,[beat('Completar el total','A complemento reúne todo lo que no es A. El espacio completo tiene probabilidad uno.',String.raw`P(A^c)=1-0.3=0.7`,{...diagram,highlight:[1,3]})],'A y su complemento forman una partición.'),
        question('c','¿Cuánto vale P(Aᶜ∩B)?',0.5,[beat('Conservar solo B','De B elimino la parte que también es A. Intersección significa cumplir ambas condiciones.',String.raw`P(A^c\cap B)=0.6-0.1=0.5`,{...diagram,highlight:[1]})],'No A y sí B es la región exclusiva de B.'),
        question('d','¿Cuánto vale P(A∩Bᶜ)?',0.2,[beat('Conservar solo A','Ahora retiro de A la parte que comparte con B.',String.raw`P(A\cap B^c)=0.3-0.1=0.2`,{...diagram,highlight:[0]})],'La región exclusiva de A no incluye la intersección.'),
        question('e','¿Cuánto vale P(Aᶜ∩Bᶜ)?',0.2,[
          beat('Recuperar la unión','Al menos uno ocupa la suma de A y B menos la intersección.',String.raw`P(A\cup B)=0.3+0.6-0.1=0.8`),
          beat('Ninguno de los dos','Por De Morgan, no A y no B es el complemento de esa unión.',String.raw`P(A^c\cap B^c)=1-0.8=0.2`,{...diagram,highlight:[3]})
        ],'Las cuatro regiones disjuntas del dibujo suman uno.')
      ], diagram);
  }),
  define(1, 2, 2, 'Tres enfermedades y regiones disjuntas', ['sucesos','axiomas'], () => {
    const diagram = bars(['Ninguna','Solo A','Solo B','Solo C','AB sin C','AC sin B','BC sin A','ABC'],[0.59,0.12,0.05,0.03,0.09,0.06,0.03,0.03]);
    return content('Una persona puede presentar más de una de las enfermedades A, B y C. Traduce cada condición y calcula su probabilidad.',
      ['P(A)=0,30; P(B)=0,20; P(C)=0,15.','P(AB)=0,12; P(AC)=0,09; P(BC)=0,06; P(ABC)=0,03.'],[
        question('a','¿Qué probabilidad tiene al menos una enfermedad?',0.41,[
          beat('Sumar las individuales','Sumo las probabilidades de A, B y C. De momento hay regiones repetidas.',String.raw`0.30+0.20+0.15=0.65`),
          beat('Sumar las parejas','Cada intersección por parejas representa un solapamiento que debo quitar.',String.raw`0.12+0.09+0.06=0.27`),
          beat('Retirar los solapamientos','Resto la suma de las tres parejas.',String.raw`0.65-0.27=0.38`),
          beat('Restituir la triple','La triple intersección quedó eliminada por las restas. La añado una vez.',String.raw`P(A\cup B\cup C)=0.38+0.03=0.41`,{...diagram,highlight:[1,2,3,4,5,6,7]})
        ],'Incluir y excluir regiones evita contar varias veces a la misma persona.'),
        question('b','¿Qué probabilidad tiene solo A?',0.12,[
          beat('Quitar A con B','Parto de A y retiro su intersección con B.',String.raw`0.30-0.12=0.18`),
          beat('Quitar A con C','Retiro también la intersección con C.',String.raw`0.18-0.09=0.09`),
          beat('Corregir la doble resta','ABC se retiró dos veces. Devuelvo una copia para excluirla solo una vez.',String.raw`P(A\cap B^c\cap C^c)=0.09+0.03=0.12`,{...diagram,highlight:[1]})
        ],'Solo A excluye tanto B como C.'),
        question('c','¿Qué probabilidad tiene B o C, pero no A?',0.11,[
          beat('Unir B y C','B unión C incluye ambas posibilidades y corrige su intersección.',String.raw`P(B\cup C)=0.20+0.15-0.06=0.29`),
          beat('La parte de esa unión con A','AB y AC comparten ABC. Resto esa triple para no duplicarla.',String.raw`P(A\cap(B\cup C))=0.12+0.09-0.03=0.18`),
          beat('Excluir A','Resto de la unión la parte que tiene A.',String.raw`P(A^c\cap(B\cup C))=0.29-0.18=0.11`,{...diagram,highlight:[2,3,6]})
        ],'El o es inclusivo: permite B y C simultáneamente.'),
        question('d','¿Qué probabilidad tiene A o no tiene ni B ni C?',0.89,[
          beat('Unir B y C','Primero necesito el suceso contrario a no tener ninguna de estas dos.',String.raw`P(B\cup C)=0.20+0.15-0.06=0.29`),
          beat('Ni B ni C','Tomo el complemento de esa unión.',String.raw`P(B^c\cap C^c)=1-0.29=0.71`),
          beat('Sumar las alternativas','Sumo A y el suceso ni B ni C.',String.raw`0.30+0.71=1.01`),
          beat('Eliminar la coincidencia','Solo A pertenece a las dos alternativas. Retiro su probabilidad una vez.',String.raw`P(A\cup(B^c\cap C^c))=1.01-0.12=0.89`,{...diagram,highlight:[0,1,4,5,7]})
        ],'El resultado también es uno menos el apartado anterior.')
      ],diagram);
  }),
  define(1, 3, 4, 'Dos diagnósticos y un resultado analítico', ['condicionada','bayes-diagnostico'], () => {
    const diagram = matrix(['A','B'],['Positivo','Negativo'],[[0.33,0.01/3],[0.04,0.94*2/3]]);
    return content('Solo se consideran los diagnósticos A y B. Un análisis adicional puede ser positivo o negativo.',
      ['P(A)=1/3; P(B)=2/3.','P(+|A)=0,99; P(+|B)=0,06.'],[
        question('a','¿Qué probabilidad tiene un resultado negativo?',0.63,[
          beat('Negativo en A','El complemento de la positividad en A es uno menos 0,99.',String.raw`P(-\mid A)=1-0.99=0.01`),
          beat('La ruta A negativa','Pondero por la probabilidad previa de A.',String.raw`P(A\cap -)=0.01\cdot\frac13=\frac{0.01}{3}`,{...diagram,highlight:[[0,1]]}),
          beat('Negativo en B','Obtengo el complemento de la positividad en B.',String.raw`P(-\mid B)=1-0.06=0.94`),
          beat('La ruta B negativa','Pondero por la probabilidad previa de B.',String.raw`P(B\cap -)=0.94\cdot\frac23=\frac{1.88}{3}`,{...diagram,highlight:[[1,1]]}),
          beat('Sumar las rutas','A y B son disjuntos y cubren las posibilidades. Sumo sus contribuciones negativas.',String.raw`P(-)=\frac{0.01+1.88}{3}=0.63`,{...diagram,highlight:[[0,1],[1,1]]})
        ],'No se promedian sin ponderación las dos tasas negativas.'),
        ...['A','B'].map((diagnosis,index) => question(index ? 'b-B':'b-A',`Tras un positivo, ¿qué probabilidad tiene el diagnóstico ${diagnosis}?`,(index ? 0.04:0.33)/0.37,[
          beat('Positivo desde A','La sensibilidad en A se pondera por un tercio.',String.raw`P(A\cap +)=0.99\cdot\frac13=0.33`,{...diagram,highlight:[[0,0]]}),
          beat('Positivo desde B','La positividad en B se pondera por dos tercios.',String.raw`P(B\cap +)=0.06\cdot\frac23=0.04`,{...diagram,highlight:[[1,0]]}),
          beat('Todos los positivos','El denominador suma las dos rutas que explican un positivo.',String.raw`P(+)=0.33+0.04=0.37`,{...diagram,highlight:[[0,0],[1,0]]}),
          beat('Condicionar al positivo',`Divido la ruta del diagnóstico ${diagnosis} entre la columna positiva completa.`,String.raw`P(${diagnosis}\mid +)=\frac{${index ? 0.04:0.33}}{0.37}`)
        ],'Las dos probabilidades posteriores suman uno.'))
      ],diagram,['A y B son diagnósticos mutuamente excluyentes y exhaustivos en este modelo.']);
  }),
  define(1, 4, 5, 'Valores predictivos del criterio de presión arterial', ['bayes-diagnostico','condicionada'], () => content(
    'Se estudia como criterio de embolismo pulmonar una presión arterial inferior a 90 mmHg. Compara los valores predictivos en dos poblaciones.',
    ['Sensibilidad=95 %; especificidad=75 %.','Prevalencia inicial=20 %; segunda prevalencia=80 %; criterio positivo: presión <90 mmHg.'],
    [...predictiveQuestions(0.95,0.75,0.2,'-20'),...predictiveQuestions(0.95,0.75,0.8,'-80')],
    matrix(['Condición','Sin condición'],['Positivo','Negativo'],[[0.19,0.01],[0.2,0.6]]),['Sensibilidad y especificidad se mantienen al cambiar la prevalencia.','Los datos son los del ejercicio, no una validación del criterio clínico.'])),
  define(1, 5, 6, 'Cribado de una condición poco frecuente', ['bayes-diagnostico','proporciones'], () => content(
    'Un índice de riesgo de síndrome de muerte súbita se aplica a una población de nacimientos. Calcula qué informa cada signo del índice.',
    ['Sensibilidad=68 %; especificidad=82 %; prevalencia=0,21 %=0,0021.'],
    predictiveQuestions(0.68,0.82,0.0021),matrix(['Condición','Sin condición'],['Positivo','Negativo'],[[0.001428,0.000672],[0.179622,0.818278]]),
    ['El 0,21 % no es una proporción de 0,21: hay que dividir por cien.','Uso exclusivamente docente de los parámetros suministrados.'])),
  define(2, '2.1', 2, 'De variantes genómicas a una masa de probabilidad', ['variable-cdf','masa','esperanza','varianza'], () => {
    const probabilities = [0.3,0.2,0.5];
    const diagram = bars([0,1,2],probabilities);
    return content('Seis variantes distintas producen cero, uno o dos genes sobreexpresados. Agrupa los resultados que dan el mismo valor de X y calcula sus momentos.',
      ['Estudio de 300 pacientes; cada individuo presenta una única variante.','e1: probabilidad 0,15, X=0; e2: 0,13, X=1; e3: 0,07, X=1.','e4: 0,30, X=2; e5: 0,20, X=2; e6: 0,15, X=0.'],[
        question('pmf','Construye toda la masa de X. Introduce como comprobación P(X=2).',0.5,[
          beat('Agrupar las variantes con cero genes','Las variantes e uno y e seis son resultados distintos, pero ambas producen X igual a cero. Sumo sus probabilidades.',String.raw`p_X(0)=0.15+0.15=0.30`,{...diagram,highlight:[0]}),
          beat('Agrupar las variantes con un gen','Las variantes e dos y e tres producen X igual a uno.',String.raw`p_X(1)=0.13+0.07=0.20`,{...diagram,highlight:[1]}),
          beat('Agrupar las variantes con dos genes','Las variantes e cuatro y e cinco producen X igual a dos.',String.raw`p_X(2)=0.30+0.20=0.50`,{...diagram,highlight:[2]}),
          beat('Comprobar toda la masa','Las tres barras representan valores de X, no las seis variantes originales. Fuera de cero, uno y dos la masa es cero.',String.raw`p_X(x)=\begin{cases}0.30&x=0\\0.20&x=1\\0.50&x=2\\0&\text{resto}\end{cases}`),
          beat('Comprobar el total','Sumo las tres masas no negativas para comprobar la normalización.',String.raw`0.30+0.20+0.50=1`)
        ],'Se construye la distribución desde el experimento, sin imponer una binomial.'),
        ...momentQuestions([0,1,2],probabilities,'genes')
      ],diagram,['Las probabilidades de las variantes son las estimaciones suministradas; no se supone que sean equiprobables.']);
  }),
  define(2, '2.2', 5, 'Normalización de una masa de mutaciones', ['masa','algebra','variable-cdf','esperanza','varianza'], () => {
    const values = [0,1,2,3,4,5];
    const constant = 140/223;
    const probabilities = values.map(value => constant/(2+value));
    const diagram = bars(values,probabilities);
    return content('El número de mutaciones en un volumen estándar tiene masa proporcional al inverso de dos más el recuento. Determina la constante y describe el modelo.',
      ['p(x)=K/(2+x), para x=0,1,2,3,4,5; p(x)=0 fuera de ese soporte.'],[
        question('constant','¿Qué K hace válida la masa?',constant,[
          beat('Abrir la normalización','K multiplica todos los pesos. La suma de las masas debe ser uno.',String.raw`K\left(\frac12+\frac13+\frac14+\frac15+\frac16+\frac17\right)=1`),
          beat('Sumar los pesos','Pongo las seis fracciones sobre denominador 420 y sumo sus numeradores.',String.raw`\frac{210+140+105+84+70+60}{420}=\frac{223}{140}`),
          beat('Despejar K','Divido por la suma de pesos, que es positiva. Así todos los valores de la masa son no negativos.',String.raw`K=\frac{1}{223/140}=\frac{140}{223}`,diagram),
          beat('Escribir la masa completa','Sustituyo K en cada valor del soporte; no extiendo la fórmula a otros recuentos.',String.raw`p_X(x)=\begin{cases}\dfrac{140}{223(2+x)}&x\in\{0,1,2,3,4,5\}\\0&\text{resto}\end{cases}`)
        ],'Los pesos originales no eran probabilidades.', 'constante'),
        ...momentQuestions(values,probabilities,'mutaciones'),
        question('exact-three','¿Qué probabilidad tiene exactamente tres mutaciones?',constant/5,[beat('Evaluar la masa','Exactamente tres pide una sola barra: sustituyo x por tres.',String.raw`P(X=3)=\frac{140}{223(2+3)}=\frac{28}{223}`,{...diagram,highlight:[3]})],'No hay que sumar una cola.'),
        question('at-least-one','¿Qué probabilidad tiene al menos una mutación?',1-constant/2,[
          beat('La masa en cero','El caso contrario a al menos una es ninguna.',String.raw`P(X=0)=\frac{140}{223\cdot2}=\frac{70}{223}`,{...diagram,highlight:[0]}),
          beat('Usar el complemento','Retiro de uno la masa en cero.',String.raw`P(X\geq1)=1-\frac{70}{223}=\frac{153}{223}`,{...diagram,highlight:[1,2,3,4,5]})
        ],'Al menos una incluye todos los valores de uno a cinco.'),
        question('at-most-two','¿Qué probabilidad tiene como máximo dos mutaciones?',constant*(1/2+1/3+1/4),[
          beat('Seleccionar las barras','Como máximo dos incluye cero, uno y dos.',String.raw`P(X\leq2)=K\left(\frac12+\frac13+\frac14\right)`,{...diagram,highlight:[0,1,2]}),
          beat('Sumar los pesos seleccionados','Sumo las tres fracciones antes de multiplicar por K.',String.raw`\frac12+\frac13+\frac14=\frac{13}{12}`),
          beat('Aplicar la constante','Uso la misma constante del modelo completo; no vuelvo a normalizar este subgrupo.',String.raw`P(X\leq2)=\frac{140}{223}\cdot\frac{13}{12}=\frac{455}{669}`)
        ],'Una probabilidad parcial no debe renormalizarse a uno.')
      ],diagram);
  }),
  define(2, '2.3', 8, 'Supervivencia: densidad triangular y alternativa exponencial', ['densidad','variable-cdf','esperanza','varianza','exponencial','calculo'], () => {
    const diagram = region([[0,0],[0,1],[2,0]]);
    const triangularCdf = value => value < 0 ? 0 : value > 2 ? 1 : value-value**2/4;
    const exponentialCdf = value => value < 0 ? 0 : -Math.expm1(-value);
    const intervalQuestion = (id,prompt,lower,upper,alternative) => {
      const cdf = alternative ? exponentialCdf : triangularCdf;
      const name = alternative ? 'G' : 'F';
      const answer = upper === Infinity ? 1-cdf(lower) : cdf(upper)-cdf(lower);
      const steps = [];
      if (lower === 0.5 || upper === 0.5) steps.push(beat('Pasar meses a años','La variable se mide en años: seis meses son medio año.',String.raw`6/12=0.5\ \text{años}`));
      steps.push(beat('Acumular hasta el extremo inferior',`${name} de x significa probabilidad hasta x. Evalúo la acumulada en el límite inferior.`,String.raw`${name}(${lower})=${cdf(lower)}`));
      if (upper === Infinity) steps.push(beat('Conservar la cola derecha','Resto de uno lo que ya se ha acumulado hasta el umbral.',String.raw`P(X>${lower})=1-${cdf(lower)}`,alternative ? bars([`Hasta ${lower}`,`Más de ${lower}`],[cdf(lower),answer],[1]) : {...diagram,cut:[[lower,0],[lower,Math.max(0,1-lower/2)]]}));
      else {
        steps.push(beat('Acumular hasta el extremo superior','Evalúo la misma acumulada en el otro límite.',String.raw`${name}(${upper})=${cdf(upper)}`));
        steps.push(beat('Restar las acumuladas','La probabilidad del intervalo es la acumulada superior menos la inferior.',String.raw`P(${lower}<X<${upper})=${cdf(upper)}-${cdf(lower)}`,alternative ? bars(['Intervalo','Resto'],[answer,1-answer],[0]) : diagram));
      }
      return question(id,prompt,answer,steps,'En un modelo con densidad, incluir extremos no cambia la probabilidad.');
    };
    const cdfQuestion = alternative => {
      const cdf = alternative ? exponentialCdf : triangularCdf;
      const name = alternative ? 'G' : 'F';
      return question(alternative ? 'f-cdf':'b-cdf',`Obtén la acumulada ${name} por tramos y representa sus valores. Introduce ${name}(1).`,cdf(1),[
        beat('Antes del soporte','El tiempo no puede ser negativo, así que antes de cero no hay probabilidad acumulada.',String.raw`${name}(x)=0\quad(x<0)`),
        beat('Integrar en el soporte','La acumulada integra la densidad desde cero hasta x. Uso t como variable de integración para no confundirla con el límite x.',alternative ? String.raw`\int_0^x e^{-t}\,dt=[-e^{-t}]_0^x=1-e^{-x}` : String.raw`\int_0^x(1-t/2)\,dt=[t-t^2/4]_0^x=x-x^2/4`),
        beat('Completar la definición',alternative ? 'El soporte no tiene extremo superior finito; la acumulada tiende a uno sin alcanzarlo a tiempo finito.' : 'Después de dos años, ya se acumuló toda la probabilidad.',alternative ? String.raw`G(x)=\begin{cases}0&x<0\\1-e^{-x}&x\geq0\end{cases}` : String.raw`F(x)=\begin{cases}0&x<0\\x-x^2/4&0\leq x\leq2\\1&x>2\end{cases}`,bars([-1,0,0.5,1,1.5,2,3],[-1,0,0.5,1,1.5,2,3].map(cdf))),
        beat('Evaluar en un año','Sustituyo el umbral por un año en el tramo que le corresponde.',alternative ? String.raw`G(1)=1-e^{-1}` : String.raw`F(1)=1-1/4=3/4`)
      ],'La fórmula por tramos describe la gráfica completa; las barras muestran valores de esa acumulada.');
    };
    const pointQuestions = alternative => [
      question(alternative ? 'f-point':'c-point','¿Qué probabilidad tiene exactamente un año?',0,[beat('Un punto no tiene anchura','La probabilidad es una integral sobre un intervalo de longitud cero, no la altura de la densidad.',String.raw`P(X=1)=\int_1^1 f(x)\,dx=0`)],'Esto vale en los dos modelos continuos.'),
      question(alternative ? 'f-height':'c-height',`¿Cuánto vale la densidad ${alternative ? 'g':'f'}(1)?`,alternative ? Math.exp(-1):0.5,[beat('Evaluar la altura','La letra minúscula representa densidad por año. Sustituyo x por uno, sin confundir el resultado con una probabilidad puntual.',alternative ? String.raw`g(1)=e^{-1}` : String.raw`f(1)=1-1/2=1/2`)],'La altura tiene unidades de años inversos.','años inversos')
    ];
    return content('Compara dos modelos simplificados del tiempo de supervivencia tras diagnosticar una variante de leucemia. Resuelve normalización, acumulada, probabilidades y momentos en ambos.',
      ['X se mide en años. Modelo inicial: f(x)=1−x/2 para 0≤x≤2, y cero fuera.','Alternativa: g(x)=exp(−kx) para x≥0, y cero fuera; no hay un factor k delante de la exponencial.'],[
        question('a-area','Comprueba signo y normalización de f. ¿Cuál es su área total?',1,[
          beat('La altura inicial','En cero la densidad vale uno.',String.raw`f(0)=1`),
          beat('La altura final','En dos la recta llega a cero; por ser decreciente, no es negativa entre ambos extremos.',String.raw`f(2)=1-2/2=0`,diagram),
          beat('Integrar la recta','Escribo una primitiva cuya derivada devuelve uno menos x entre dos.',String.raw`\int_0^2(1-x/2)\,dx=[x-x^2/4]_0^2`),
          beat('Evaluar los extremos','El valor en dos menos el valor en cero da el área total.',String.raw`(2-4/4)-0=1`)
        ],'La densidad es válida: no negativa y con área uno.','área de probabilidad'),
        cdfQuestion(false),
        intervalQuestion('c-ge','¿Cuál es P(X≥1) en el modelo inicial?',1,Infinity,false),
        intervalQuestion('c-gt','¿Cuál es P(X>1) en el modelo inicial?',1,Infinity,false),
        ...pointQuestions(false),
        intervalQuestion('d-under-six','¿Qué probabilidad tiene menos de seis meses en el modelo inicial?',0,0.5,false),
        intervalQuestion('d-six-to-twelve','¿Qué probabilidad tiene entre seis meses y un año en el modelo inicial?',0.5,1,false),
        intervalQuestion('d-over-two','¿Qué probabilidad tiene más de dos años en el modelo inicial?',2,Infinity,false),
        question('e-mean','¿Cuál es la esperanza del modelo inicial?',2/3,[
          beat('Ponderar el tiempo','E de X integra cada tiempo por su densidad.',String.raw`E[X]=\int_0^2 x(1-x/2)\,dx`),
          beat('Integrar','La primitiva de x menos x al cuadrado entre dos es x al cuadrado entre dos menos x al cubo entre seis.',String.raw`E[X]=[x^2/2-x^3/6]_0^2`),
          beat('Evaluar','Resto el valor en cero al de dos.',String.raw`E[X]=2-8/6=2/3`)
        ],'El soporte limita cualquier supervivencia a dos años.','años'),
        question('e-variance','¿Cuál es la varianza del modelo inicial?',2/9,[
          beat('Ponderar cuadrados','El segundo momento integra el tiempo al cuadrado por la densidad.',String.raw`E[X^2]=\int_0^2 x^2(1-x/2)\,dx`),
          beat('Integrar el segundo momento','Integro término a término.',String.raw`E[X^2]=[x^3/3-x^4/8]_0^2`),
          beat('Evaluar','El segundo momento vale dos tercios.',String.raw`E[X^2]=8/3-2=2/3`),
          beat('Cuadrar la media','La media es dos tercios; su cuadrado es cuatro novenos.',String.raw`E[X]^2=(2/3)^2=4/9`),
          beat('Obtener la varianza','Resto el cuadrado de la media al segundo momento.',String.raw`\operatorname{Var}(X)=2/3-4/9=2/9`)
        ],'Varianza y segundo momento son cantidades distintas.','años al cuadrado'),
        question('f-constant','¿Qué k normaliza la alternativa exp(−kx)?',1,[
          beat('Exigir integrabilidad','Una tasa k positiva hace que la exponencial decrezca y sea integrable.',String.raw`k>0`),
          beat('Integrar la propuesta','Sin un factor k delante, el área es uno entre k.',String.raw`\int_0^\infty e^{-kx}\,dx=[-e^{-kx}/k]_0^\infty=1/k`),
          beat('Normalizar','Igualo el área a uno y despejo k.',String.raw`1/k=1\ \Longrightarrow\ k=1`)
        ],'No se puede elegir libremente k en esta propuesta sin añadir un factor de normalización.','años inversos',0),
        cdfQuestion(true),
        intervalQuestion('f-ge','En la alternativa, ¿cuál es P(X≥1)?',1,Infinity,true),
        intervalQuestion('f-gt','En la alternativa, ¿cuál es P(X>1)?',1,Infinity,true),
        ...pointQuestions(true),
        intervalQuestion('f-under-six','En la alternativa, ¿qué probabilidad tiene menos de seis meses?',0,0.5,true),
        intervalQuestion('f-six-to-twelve','En la alternativa, ¿qué probabilidad tiene entre seis meses y un año?',0.5,1,true),
        intervalQuestion('f-over-two','En la alternativa, ¿qué probabilidad tiene más de dos años?',2,Infinity,true),
        question('f-mean','¿Cuál es la esperanza de la alternativa?',1,[
          beat('Integrar el tiempo ponderado','Con k igual a uno, la densidad es e elevado a menos x.',String.raw`E[X]=\int_0^\infty xe^{-x}\,dx`),
          beat('Integrar por partes','Tomo x como factor a derivar y e elevado a menos x como factor a integrar.',String.raw`E[X]=[-xe^{-x}]_0^\infty+\int_0^\infty e^{-x}\,dx`),
          beat('Evaluar','El término de frontera es cero y la integral restante es uno.',String.raw`E[X]=0+1=1`)
        ],'La alternativa permite superar dos años, pero su riesgo constante también debe contrastarse con datos.','años',0),
        question('f-variance','¿Cuál es la varianza de la alternativa?',1,[
          beat('El segundo momento','Para los cuadrados, una integración por partes reduce la potencia.',String.raw`E[X^2]=[-x^2e^{-x}]_0^\infty+2\int_0^\infty xe^{-x}\,dx`),
          beat('Evaluar','La frontera es cero y la integral que queda es la media, que vale uno.',String.raw`E[X^2]=2\cdot1=2`),
          beat('Cuadrar la media','Elevo a dos la media de un año.',String.raw`E[X]^2=1^2=1`),
          beat('Restar','Obtengo la dispersión, sin confundirla con el segundo momento.',String.raw`\operatorname{Var}(X)=2-1=1`)
        ],'El primer modelo impone una duración máxima artificial; el segundo no, pero supone riesgo constante. Ninguno queda validado solo por normalizarlo.','años al cuadrado',0)
      ],diagram,['Los dos modelos son continuos y se consideran solo como propuestas docentes.','Corrección del PDF: F(0,5)=0,4375; P(0,5<X<1)=0,3125, no 0,375 en ambos casos.']);
  }),
  define(2, '2.4', 13, 'Supervivientes al finalizar un experimento', ['bernoulli-binomial','calculo-modelos'], () => {
    const masses = [8,9,10].map(value => statistics().binomial.pdf(value,10,0.8));
    const diagram = bars(Array.from({length:11},(_,index) => index),Array.from({length:11},(_,index) => statistics().binomial.pdf(index,10,0.8)),[8,9,10]);
    return content('Se administra un inhibidor de síntesis proteica a diez ratas. Calcula la probabilidad de que sobrevivan al menos ocho hasta el final.',
      ['Mueren 4 de cada 20 animales; se tratan n=10.'],[
        question('survivors','¿Qué probabilidad tiene al menos ocho supervivientes?',masses.reduce((total,value) => total+value,0),[
          beat('La probabilidad de morir','Convierto el recuento de muertes en proporción.',String.raw`P(\text{morir})=4/20=0.2`),
          beat('La probabilidad de sobrevivir','El éxito que cuenta X es sobrevivir, por eso tomo el complemento.',String.raw`p=1-0.2=0.8`),
          beat('Identificar el modelo','El total es fijo y cada animal tiene dos resultados. Bajo independencia y probabilidad común, X es binomial.',String.raw`X\sim\operatorname{Bin}(10,0.8)`),
          ...[8,9,10].flatMap(value => binomialQuestion(`mass-${value}`,`Exactamente ${value} supervivientes`,10,0.8,value).tutorSteps.map(item => ({...item,title:`${value} supervivientes: ${item.title}`}))),
          beat('Sumar los resultados compatibles','Al menos ocho incluye ocho, nueve y diez; no solo ocho.',String.raw`P(X\geq8)=${masses.join('+')}`),
          beat('Comprobar por el complemento','El caso contrario acaba en siete. Escribo la forma equivalente para no cometer un desfase de una unidad.',String.raw`P(X\geq8)=1-F_X(7)`,diagram)
        ],'La cifra depende de la independencia y de mantener la misma probabilidad de supervivencia.')
      ],diagram,['Animales independientes y probabilidad de supervivencia común en el modelo.']);
  }),
  define(2, '2.5', 15, 'Recuento anual de muertes: Poisson', ['poisson','calculo-modelos','variable-cdf'], () => {
    const cdf = selected => Array.from({length:selected+1},(_,index) => statistics().poisson.pdf(index,12)).reduce((total,value) => total+value,0);
    const values = Array.from({length:31},(_,index) => index);
    const diagram = bars(values,values.map(value => statistics().poisson.pdf(value,12)));
    const accumulatedQuestion = (id,selected,right) => question(id,right ? '¿Qué probabilidad tiene quince o más muertes este año?' : '¿Qué probabilidad tiene diez o menos muertes este año?',right ? 1-cdf(selected):cdf(selected),[
      beat('Traducir el límite',right ? 'El contrario de quince o más es como máximo catorce. Incluyo cero entre los recuentos posibles.' : 'Diez o menos incluye todos los enteros desde cero hasta diez.',right ? String.raw`\{X\geq15\}^c=\{X\leq14\}` : String.raw`X\leq10\ \Longleftrightarrow\ X\in\{0,1,\ldots,10\}`),
      ...Array.from({length:selected+1},(_,index) => beat(`Añadir la masa ${index}`,`Incorporo solo la probabilidad de ${index} eventos a la suma acumulada.`,String.raw`S_{${index}}=${index ? cdf(index-1):0}+${statistics().poisson.pdf(index,12)}=${cdf(index)}`,{...diagram,highlight:[index]})),
      beat(right ? 'Tomar el complemento':'Conservar la suma',right ? 'La suma calculada es la cola contraria. La retiro de uno.' : 'La suma ya representa el suceso pedido.',right ? String.raw`P(X\geq15)=1-${cdf(selected)}` : String.raw`P(X\leq10)=${cdf(selected)}`)
    ],'No confundas una masa con una acumulada; lambda sigue siendo doce por año.');
    return content('El número anual de muertes por cáncer de pulmón se modela mediante Poisson. Resuelve un valor exacto y dos colas.',
      ['Media anual λ=12; exposición: un año.'],[
        poissonQuestion('exact-ten','¿Qué probabilidad tiene exactamente diez muertes?',12,10),
        accumulatedQuestion('at-least-fifteen',14,true),accumulatedQuestion('at-most-ten',10,false)
      ],diagram,['Se adopta el modelo Poisson indicado; la media anual no garantiza un recuento de doce.']);
  }),
  define(2, '2.6', 17, 'Mutaciones por radiación: exacta y aproximada', ['bernoulli-binomial','poisson','calculo-modelos','esperanza'], () => {
    const exact = statistics().binomial.pdf(10,150,0.1);
    const approximate = statistics().poisson.pdf(10,15);
    return content('De 150 mutaciones detectadas, cada una se atribuye a radiación con probabilidad 0,10. Calcula el recuento esperado y la masa en diez.',
      ['n=150; p=0,10; otras causas: probabilidad 0,90.'],[
        question('mean','¿Cuántas mutaciones se esperan por radiación?',15,[
          beat('Definir el recuento','X cuenta atribuciones a radiación dentro de las 150 mutaciones, no el número total de mutaciones detectadas.',String.raw`X\sim\operatorname{Bin}(150,0.1)`),
          beat('Aplicar la esperanza','La media binomial es n por p.',String.raw`E[X]=150\cdot0.1=15`)
        ],'La media no obliga a observar exactamente quince.','mutaciones',0),
        binomialQuestion('exact-ten','Según la binomial, ¿qué probabilidad tiene exactamente diez mutaciones por radiación?',150,0.1,10),
        poissonQuestion('approximate-ten','Como comparación, ¿qué probabilidad da la aproximación Poisson para exactamente diez?',15,10),
        question('approximation-error','¿Cuál es la diferencia absoluta entre la aproximación y la masa binomial exacta?',Math.abs(approximate-exact),[
          beat('Fijar la media de la aproximación','Lambda se obtiene de n por p, manteniendo la misma esperanza.',String.raw`\lambda=150\cdot0.1=15`),
          beat('Comparar las masas','La Poisson no es el modelo exacto al condicionar en 150 mutaciones. Resto las dos masas calculadas.',String.raw`\left|${approximate}-${exact}\right|`,bars(['Binomial exacta','Poisson aproximada'],[exact,approximate]))
        ],'Con p=0,10 no se debe declarar una aproximación perfecta; los datos permiten usar directamente la binomial.','diferencia de probabilidades')
      ],bars(['Radiación esperada','Otras causas esperadas'],[15,135]),['La binomial supone atribuciones independientes y probabilidad común.','La Poisson se incluye solo como aproximación, no como un segundo modelo exacto del total fijo.']);
  }),
  define(2, '2.7', 20, 'Glucosa normal: porcentajes y percentil 25', ['normal','calculo-modelos','variable-cdf'], () => content(
    'En el modelo docente de glucosa de personas diabéticas, calcula dos porcentajes y el percentil 25.',
    ['Media μ=106 mg/100 ml; desviación típica σ=8 mg/100 ml; varianza=64.'],[
      normalIntervalQuestion('under-120','¿Qué proporción tiene glucosa inferior a 120 mg/100 ml y a qué porcentaje equivale?',106,8,undefined,120,true),
      normalIntervalQuestion('90-to-120','¿Qué proporción tiene glucosa entre 90 y 120 mg/100 ml y a qué porcentaje equivale?',106,8,90,120,true),
      normalQuantileQuestion('p25','¿Cuál es el nivel de glucosa del percentil 25?',106,8,0.25,'mg/100 ml')
    ],normal(106,8,90,120),['Modelo aproximadamente normal, suministrado para practicar cálculos.','Corrección del texto del PDF: el área 90..120 es 0,9371907, equivalente a 93,71907 %, no 0,9575.'])),
  define(2, '2.8', 22, 'Umbral normal y Bayes entre sanos y diabéticos', ['normal','bayes-diagnostico','condicionada','calculo-modelos'], () => {
    const cutoff = 160+31.4*statistics().normal.inv(0.02,0,1);
    const falsePositive = 1-statistics().normal.cdf(cutoff,80,10);
    const positive = 0.98*0.1+falsePositive*0.9;
    const diagram = matrix(['Diabetes','Sano'],['Clasificado diabético','Clasificado sano'],[[0.098,0.002],[0.9*falsePositive,0.9*(1-falsePositive)]]);
    return content('Se clasifica como sano a quien queda por debajo de un umbral de glucosa. Se fija ese umbral para que el 2 % de los diabéticos se clasifique como sano.',
      ['Sanos: normal con μ=80 y σ=10. Diabéticos: normal con μ=160 y σ=31,4.','Regla: sano si X<c; diabético si X≥c. P(X<c|D)=0,02.','Prevalencia de diabetes en el segundo apartado: P(D)=0,10; P(S)=0,90.'],[
        normalQuantileQuestion('cutoff','¿Por debajo de qué glucosa se clasifica como sano?',160,31.4,0.02,'unidades de glucemia'),
        normalIntervalQuestion('false-positive','¿Qué proporción de los sanos se clasifica erróneamente como diabética?',80,10,cutoff,undefined),
        question('healthy-count-factor','Expresa el número de sanos mal clasificados como función de N sanos. Introduce el factor que multiplica N.',falsePositive,[
          beat('La probabilidad de error en sanos','La clasificación errónea cae por encima del umbral. No uso la acumulada izquierda.',String.raw`q=P(X_S\geq c)=1-\Phi\left(\frac{${cutoff}-80}{10}\right)`),
          beat('El número esperado','Si hay N sanos, el número esperado de falsos positivos es N por q. El enunciado no da N, así que no invento un recuento absoluto.',String.raw`E[\text{falsos positivos entre }N\text{ sanos}]=N\cdot ${falsePositive}`)
        ],'En porcentaje es aproximadamente 6,04 % de los sanos; el número absoluto exige conocer cuántos sanos hay.','factor de recuento'),
        question('posterior','Entre los clasificados como diabéticos, ¿qué probabilidad tiene diabetes real?',0.098/positive,[
          beat('La sensibilidad de la regla','El 2 % de los diabéticos queda debajo del umbral. El resto queda en la clasificación positiva.',String.raw`P(+\mid D)=1-0.02=0.98`,normal(160,31.4,cutoff,undefined)),
          beat('La ruta positiva verdadera','Multiplico la sensibilidad por la prevalencia de diabetes.',String.raw`P(D\cap +)=0.98\cdot0.10=0.098`,{...diagram,highlight:[[0,0]]}),
          beat('La ruta positiva falsa','Para los sanos uso la cola derecha q y la pondero por 0,90. La acumulada izquierda sería la especificidad, no esta tasa.',String.raw`P(S\cap +)=${falsePositive}\cdot0.90=${falsePositive*0.9}`,{...diagram,highlight:[[1,0]]}),
          beat('Reunir todos los positivos','Sumo las rutas verdadera y falsa para formar el denominador de Bayes.',String.raw`P(+) = 0.098+${falsePositive*0.9}=${positive}`,{...diagram,highlight:[[0,0],[1,0]]}),
          beat('La posterior','Divido solo la ruta diabética entre el total positivo.',String.raw`P(D\mid +)=\frac{0.098}{${positive}}`)
        ],'La posterior es aproximadamente 0,6431, no 0,1038555. El error impreso usa P(XS≤c) donde corresponde P(XS>c).')
      ],diagram,['Los grupos sano y diabético forman una partición.','El 2 % es la cola inferior de diabéticos, no la superior.','No se proporciona tamaño poblacional para un número absoluto de falsos positivos.']);
  }),
  define(2, '2.9', 24, 'Doce ratas extraídas sin reemplazo', ['hipergeometrica','combinatoria','calculo-modelos'], () => {
    const favorable = combination(10,6)**2;
    const total = combination(20,12);
    return content('Diez de veinte ratas recibieron anticoagulante. Tras mezclarlas sin marcas, se extraen doce al azar y sin reemplazo.',
      ['Población N=20; tratadas M=10; no tratadas=10.','Muestra n=12; se piden 6 tratadas y 6 no tratadas.'],[
        question('six-and-six','¿Qué probabilidad tiene una selección de seis tratadas y seis no tratadas?',favorable/total,[
          beat('Elegir seis tratadas','La selección no distingue el orden. Cuento combinaciones de seis entre diez.',String.raw`\binom{10}{6}=210`),
          beat('Elegir seis no tratadas','Las otras seis se eligen entre las diez no tratadas.',String.raw`\binom{10}{12-6}=\binom{10}{6}=210`),
          beat('Contar muestras favorables','Combino ambas elecciones independientes como recuentos de subconjuntos, no como ensayos probabilísticos independientes.',String.raw`210\cdot210=44100`),
          beat('Contar todas las muestras','El denominador reúne cada subconjunto de doce entre veinte.',String.raw`\binom{20}{12}=125970`),
          beat('Dividir recuentos','Todas las muestras sin orden son equiprobables. La masa hipergeométrica es favorables entre posibles.',String.raw`P(X=6)=\frac{44100}{125970}`,bars(['6 tratadas, 6 no','Otras selecciones'],[favorable,total-favorable],[0]))
        ],'Sin reemplazo, las extracciones son dependientes; una binomial no describe exactamente este experimento.')
      ],bars(['Tratadas','No tratadas'],[10,10]),['Selección uniforme de subconjuntos de doce; no hay reemplazo.']);
  }),
  define(3, 1, 2, 'Asignar dos estudios a tres laboratorios', ['conjunta-discreta','multinomial','sucesos','combinatoria'], () => {
    const outcomes = laboratoryExperiment();
    const diagram = jointTable([0,1,2],[0,1,2],outcomes);
    return content('Cada uno de dos estudios identificados se asigna a A, B o C. Construye la distribución del número de estudios recibidos por A y por B.',
      ['Y1 cuenta estudios en A; Y2 cuenta estudios en B.','Asignaciones elementales: AA, AB, AC, BA, BB, BC, CA, CB, CC; cada una tiene probabilidad 1/9.'],[
        jointConstructionQuestion([0,1,2],[0,1,2],outcomes,1,1,'Y uno cuenta las letras A y Y dos cuenta las letras B en la asignación de los dos estudios. C recibe los estudios restantes.'),
        question('cdf','¿Cuál es F(1,0)=P(Y1≤1,Y2≤0)?',1/3,[
          beat('Seleccionar la región acumulada','Como Y dos no es negativo, Y dos menor o igual a cero obliga a que B no reciba estudios. Y uno admite cero o uno.',String.raw`F(1,0)=p(0,0)+p(1,0)`,{...diagram,highlight:[[0,0],[1,0]]}),
          beat('La celda sin estudios en A ni B','Solo CC produce cero y cero.',String.raw`p(0,0)=1/9`,{...diagram,highlight:[[0,0]]}),
          beat('La celda de uno en A y ninguno en B','AC y CA producen uno y cero.',String.raw`p(1,0)=2/9`,{...diagram,highlight:[[1,0]]}),
          beat('Sumar las celdas','Las dos parejas son disjuntas y ambas cumplen los límites de la acumulada.',String.raw`F(1,0)=1/9+2/9=1/3`)
        ],'La acumulada conjunta selecciona simultáneamente una región en las dos coordenadas.')
      ],diagram,['Asignaciones independientes y uniformes entre tres laboratorios.','Corrección de la enumeración del PDF: BC produce (0,1), no (1,0).']);
  }),
  define(3, 2, 3, 'Tres monedas: número de caras y ganancia', ['conjunta-discreta','variable-cdf','combinatoria'], () => {
    const outcomes = coinExperiment();
    const diagram = jointTable([0,1,2,3],[-1,1,2,3],outcomes);
    return content('Se lanzan tres monedas equilibradas en orden. La ganancia depende del lugar de la primera cara, mientras que Y1 cuenta todas las caras.',
      ['C= cara; X=cruz. Tres lanzamientos independientes, cada cara con probabilidad 1/2.','Y1=número de caras. Y2=1, 2 o 3 euros si la primera cara sale en el lanzamiento 1, 2 o 3; Y2=−1 euro si no sale ninguna.'],[
        jointConstructionQuestion([0,1,2,3],[-1,1,2,3],outcomes,2,1,'Y uno cuenta todas las caras. Y dos es la ganancia: busco solo la primera cara; si no aparece ninguna, la ganancia es menos un euro.'),
        question('cdf','¿Cuál es F(2,1), la probabilidad de menos de tres caras y ganancia de un euro o menos?',0.5,[
          beat('Seleccionar las dos condiciones','Y uno no supera dos y Y dos no supera uno. Incluyo la pérdida de un euro, porque también cumple el segundo límite.',String.raw`F(2,1)=p(0,-1)+p(1,1)+p(2,1)`,{...diagram,highlight:[[0,0],[1,1],[2,1]]}),
          beat('Añadir la pérdida','XXX aporta una secuencia de las ocho posibles.',String.raw`S_1=1/8`,{...diagram,highlight:[[0,0]]}),
          beat('Añadir una cara con ganancia uno','CXX es compatible y añade una octava parte.',String.raw`S_2=1/8+1/8=2/8`,{...diagram,highlight:[[1,1]]}),
          beat('Añadir dos caras con ganancia uno','CCX y CXC son dos secuencias distintas para la misma pareja. Añado dos octavas partes.',String.raw`F(2,1)=2/8+2/8=4/8=1/2`,{...diagram,highlight:[[2,1]]})
        ],'No se excluye la pérdida ni se asigna una sola octava parte a una celda alcanzada por dos secuencias.')
      ],diagram,['Las ocho secuencias son equiprobables.','Corrección de la fórmula resumida del PDF: p(2,1)=2/8; las otras seis celdas no nulas tienen masa 1/8.']);
  }),
  define(3, 3, 5, 'Marginal de las asignaciones y contraste binomial', ['marginales','conjunta-discreta','bernoulli-binomial'], () => {
    const diagram = jointTable([0,1,2],[0,1,2],laboratoryExperiment());
    return content('Retoma la asignación de dos estudios entre A, B y C. Obtén la marginal de Y1 y compárala con una binomial.',
      ['Filas Y1=0,1,2; columnas Y2=0,1,2.','Masa conjunta por filas: (1,2,1)/9; (2,2,0)/9; (1,0,0)/9.'],[
        question('marginal','Construye la marginal completa de Y1. Introduce P(Y1=1).',4/9,[
          ...[0,1,2].map((value,index) => beat(`Sumar la fila ${value}`,'Para conservar Y uno y olvidar Y dos sumo la fila completa, no una sola celda.',String.raw`p_{Y_1}(${value})=${diagram.values[index].map(mass => `${Math.round(9*mass)}/9`).join('+')}=${[4,4,1][index]}/9`,{...diagram,highlight:[[index,0],[index,1],[index,2]]})),
          beat('Escribir la marginal','La tabla marginal tiene tres valores; fuera de cero, uno y dos la masa es cero.',String.raw`p_{Y_1}(y)=\begin{cases}4/9&y=0\\4/9&y=1\\1/9&y=2\\0&\text{resto}\end{cases}`,bars([0,1,2],[4/9,4/9,1/9]))
        ],'La marginal se obtiene sumando sobre la coordenada descartada.'),
        question('binomial-check','Comprueba los tres valores frente a Bin(2,1/3). Introduce la mayor diferencia absoluta entre ambas masas.',0,[
          beat('Identificar los ensayos','Cada estudio se asigna a A con probabilidad un tercio, de forma independiente del otro. El recuento en A es binomial.',String.raw`Y_1\sim\operatorname{Bin}(2,1/3)`),
          beat('Comprobar cero','Cero asignaciones a A requiere dos elecciones de B o C.',String.raw`\binom20(1/3)^0(2/3)^2=4/9`),
          beat('Comprobar uno','Hay dos posiciones para la única asignación a A.',String.raw`\binom21(1/3)(2/3)=4/9`),
          beat('Comprobar dos','Ambos estudios se asignan a A.',String.raw`\binom22(1/3)^2=1/9`),
          beat('Comparar las tres masas','Cada valor coincide con la marginal de la conjunta; no hay conflicto entre las dos descripciones.',String.raw`\max_y|p_{\mathrm{marginal}}(y)-p_{\mathrm{binomial}}(y)|=0`,bars([0,1,2],[4/9,4/9,1/9]))
        ],'La independencia de las asignaciones no significa que los recuentos de A y B sean independientes.','diferencia de probabilidades',0)
      ],diagram,['Se conserva el mismo experimento independiente y uniforme del ejercicio 1.']);
  }),
  define(3, 4, 7, 'Contaminación en un soporte triangular', ['conjunta-condicional','marginales','regiones-matrices','densidad'], () => {
    const diagram = region([[0,0],[2,0],[2,1]]);
    return content('Y1 mide contaminante en la chimenea sin limpiador y Y2 en la chimenea con limpiador. La densidad conjunta es constante en un triángulo.',
      ['f(y1,y2)=k si 0≤y1≤2, 0≤y2≤1 y 2y2≤y1; cero fuera.','Fronteras: y1=2, y2=0, y2=y1/2. Se pide el suceso Y1≥3Y2.'],[
        question('constant','¿Qué k normaliza la densidad conjunta?',1,[
          beat('Leer la frontera inclinada','Fijo y uno. Y dos va desde cero hasta la mitad de y uno; no integraremos el rectángulo exterior.',String.raw`0\leq y_2\leq y_1/2,\qquad0\leq y_1\leq2`,diagram),
          beat('Integrar el corte','Al integrar una constante k respecto de y dos, multiplico k por la longitud del corte.',String.raw`\int_0^{y_1/2}k\,dy_2=k y_1/2`),
          beat('Integrar todos los cortes','Integro respecto de y uno para obtener el área ponderada completa.',String.raw`\int_0^2 ky_1/2\,dy_1=k[y_1^2/4]_0^2=k`),
          beat('Normalizar','El área de este triángulo es uno, de modo que el valor de k debe ser uno.',String.raw`k\cdot1=1\ \Longrightarrow\ k=1`)
        ],'La densidad es constante dentro del triángulo, no dentro de un rectángulo.','densidad conjunta',0),
        question('reduction','¿Cuál es P(Y1≥3Y2)?',2/3,[
          beat('Traducir el suceso','Divido la desigualdad entre tres para delimitar y dos a cada y uno.',String.raw`y_2\leq y_1/3`,{...diagram,cut:[[0,0],[2,2/3]]}),
          beat('Comparar las fronteras','Y uno entre tres es menor que y uno entre dos en este soporte positivo; la región pedida queda dentro del soporte.',String.raw`0\leq y_1/3\leq y_1/2`),
          beat('Integrar el corte pedido','Con k igual a uno, la probabilidad por corte es su longitud.',String.raw`\int_0^{y_1/3}1\,dy_2=y_1/3`),
          beat('Sumar los cortes','Integro desde cero hasta dos sin añadir puntos imposibles.',String.raw`P(Y_1\geq3Y_2)=\int_0^2y_1/3\,dy_1=[y_1^2/6]_0^2=2/3`,region([[0,0],[2,0],[2,2/3]]))
        ],'El suceso escrito deja como máximo un tercio del contaminante inicial: representa reducción de al menos dos tercios, no de un tercio.')
      ],diagram,['Se interpreta el objetivo matemático explícito Y1≥3Y2.','La descripción verbal del PDF de reducción de un tercio no equivale a esa desigualdad.']);
  }),
  define(3, 5, 9, 'Probabilidad marginal y un corte condicional del triángulo', ['conjunta-condicional','marginales','regiones-matrices'], () => {
    const diagram = region([[0,0],[2,0],[2,1]]);
    return content('En el modelo de contaminación del ejercicio 4, calcula una cola de Y2 y una probabilidad de Y1 al fijar Y2.',
      ['f(y1,y2)=1 en 0≤y2≤1, 2y2≤y1≤2; cero fuera.','Se pide P(Y2>0,5) y P(Y1>1,5|Y2=0,5).'],[
        question('marginal-tail','¿Qué probabilidad tiene Y2>0,5?',0.25,[
          beat('Fijar la altura','Para un valor y dos entre cero y uno, el corte horizontal de y uno comienza en dos por y dos y termina en dos.',String.raw`2y_2\leq y_1\leq2`,{...diagram,cut:[[1,0.5],[2,0.5]]}),
          beat('Integrar y uno','La marginal de Y dos es la longitud del corte, porque la densidad vale uno.',String.raw`f_{Y_2}(y_2)=\int_{2y_2}^2 1\,dy_1=2-2y_2`),
          beat('Completar la marginal','Fuera de cero a uno no hay soporte.',String.raw`f_{Y_2}(y)=\begin{cases}2-2y&0\leq y\leq1\\0&\text{resto}\end{cases}`),
          beat('Integrar la cola','Y dos mayor que medio selecciona la parte alta del triángulo.',String.raw`P(Y_2>0.5)=\int_{0.5}^1(2-2y_2)\,dy_2=[2y_2-y_2^2]_{0.5}^1`,region([[1,0.5],[2,0.5],[2,1]])),
          beat('Evaluar','El valor superior es uno y el inferior es tres cuartos.',String.raw`P(Y_2>0.5)=1-(1-0.25)=0.25`)
        ],'Integrar solo la altura de la marginal en 0,5 no daría esta probabilidad.'),
        question('conditional-tail','¿Cuál es P(Y1>1,5|Y2=0,5)?',0.5,[
          beat('Fijar el corte condicional','Sustituyo y dos por medio. La frontera inclinada obliga a y uno entre uno y dos.',String.raw`2\cdot0.5=1\ \Longrightarrow\ 1\leq y_1\leq2`,{...diagram,cut:[[1,0.5],[2,0.5]]}),
          beat('La marginal en el corte','La marginal de Y dos en medio es la longitud total del corte.',String.raw`f_{Y_2}(0.5)=2-2\cdot0.5=1`),
          beat('Normalizar la densidad condicional','Divido la densidad conjunta del corte por la marginal positiva. Es un cociente de densidades, no de probabilidades de puntos.',String.raw`f_{Y_1\mid Y_2}(y_1\mid0.5)=\frac1{1}=1\quad(1\leq y_1\leq2)`),
          beat('Integrar la parte pedida','De ese corte uniforme solo conservo desde uno y medio hasta dos.',String.raw`P(Y_1>1.5\mid Y_2=0.5)=\int_{1.5}^2 1\,dy_1=0.5`,{...diagram,cut:[[1.5,0.5],[2,0.5]]})
        ],'La condición continua se describe con una densidad condicional; P(Y2=0,5) es cero y no sirve de denominador.')
      ],diagram,['Se usa k=1 obtenido en el ejercicio 4.']);
  }),
  define(3, 6, 11, 'Covarianza de los recuentos de laboratorios', ['covarianza-matrices','combinaciones-incorrelacion','independencia-variables','multinomial'], () => {
    const diagram = jointTable([0,1,2],[0,1,2],laboratoryExperiment());
    return content('Retoma Y1, el número de estudios en A, y Y2, el número en B, cuando se asignan dos estudios a tres laboratorios.',
      ['Filas Y1=0,1,2; columnas Y2=0,1,2.','Masa conjunta por filas: (1,2,1)/9; (2,2,0)/9; (1,0,0)/9.'],[
        question('covariance','¿Cuál es Cov(Y1,Y2)?',-2/9,[
          beat('La primera media','La marginal de Y uno tiene masas cuatro novenos, cuatro novenos y un noveno. Pondero sus valores.',String.raw`E[Y_1]=0\cdot4/9+1\cdot4/9+2\cdot1/9=2/3`),
          beat('La segunda media','La simetría entre A y B da la misma marginal para Y dos.',String.raw`E[Y_2]=0\cdot4/9+1\cdot4/9+2\cdot1/9=2/3`),
          beat('Localizar productos no nulos','Solo la pareja uno y uno tiene ambos valores positivos y masa positiva; los demás productos se anulan.',String.raw`E[Y_1Y_2]=1\cdot1\cdot p(1,1)=2/9`,{...diagram,highlight:[[1,1]]}),
          beat('El producto de medias','Multiplico las dos medias, que no es lo mismo que promediar el producto.',String.raw`E[Y_1]E[Y_2]=(2/3)(2/3)=4/9`),
          beat('Restar','La covarianza compara el producto observado en promedio con el producto de las medias.',String.raw`\operatorname{Cov}(Y_1,Y_2)=2/9-4/9=-2/9`)
        ],'No sorprende el signo negativo: los recuentos compiten por un total de dos estudios. Aumentar uno deja menos disponibles para el otro.','estudios al cuadrado'),
        question('independence-check','Para explicar la dependencia, ¿cuánto vale P(Y1=2,Y2=2) menos P(Y1=2)P(Y2=2)?',-1/81,[
          beat('El par imposible','Dos estudios en A y dos en B exigirían cuatro estudios, pero solo hay dos.',String.raw`p(2,2)=0`,{...diagram,highlight:[[2,2]]}),
          beat('El producto marginal','Cada laboratorio tiene probabilidad un noveno de recibir los dos estudios.',String.raw`p_{Y_1}(2)p_{Y_2}(2)=(1/9)(1/9)=1/81`),
          beat('Comparar','La celda conjunta no coincide con el producto; una discrepancia basta para refutar independencia.',String.raw`0-1/81=-1/81`)
        ],'Las asignaciones individuales son independientes, pero los recuentos del total fijo no.','diferencia de probabilidades')
      ],diagram,['La repetición de la solución del ejercicio 5 en las páginas 13–15 del PDF no introduce un problema nuevo.']);
  }),
  define(3, 7, 15, 'Covarianzas posibles y correlación perfecta', ['covarianza-matrices','combinaciones-incorrelacion'], () => {
    const diagram = matrix(['Y1','Y2'],['Y1','Y2'],[[2,4],[4,8]]);
    return content('Dos variables tienen medias y varianzas conocidas. Determina una autocovarianza, rechaza una covarianza imposible y estudia el máximo admisible.',
      ['E(Y1)=4; E(Y2)=−1; Var(Y1)=2; Var(Y2)=8.','Se propone Cov(Y1,Y2)=7 y se pide también la mayor covarianza posible.'],[
        question('self','¿Cuánto vale Cov(Y1,Y1)?',2,[beat('Una variable consigo misma','El producto centrado consigo misma es un cuadrado. Su esperanza es precisamente la varianza.',String.raw`\operatorname{Cov}(Y_1,Y_1)=E[(Y_1-4)^2]=2`,{...diagram,highlight:[[0,0]]})],'La diagonal de una matriz de covarianzas contiene varianzas.','unidades de Y1 al cuadrado',0),
        question('impossible-rho','¿Qué correlación implicaría una covarianza de 7?',1.75,[
          beat('Multiplicar las varianzas','Para normalizar la covarianza necesito el producto de desviaciones; primero multiplico sus cuadrados.',String.raw`2\cdot8=16`),
          beat('Tomar la raíz','La raíz del producto de varianzas es el producto de desviaciones.',String.raw`\sigma_1\sigma_2=\sqrt{16}=4`),
          beat('Calcular rho','Rho, la correlación, divide la covarianza entre el producto de desviaciones.',String.raw`\rho=7/4=1.75`),
          beat('Comprobar la cota','Una correlación debe estar entre menos uno y uno. Uno coma setenta y cinco lo supera, por lo que la propuesta es imposible.',String.raw`|\rho|\leq1\quad\text{pero}\quad1.75>1`,matrix(['Y1','Y2'],['Y1','Y2'],[[2,7],[7,8]],[[0,1],[1,0]]))
        ],'Las medias no pueden arreglar una matriz de covarianzas incompatible.','correlación propuesta',0),
        question('maximum','¿Cuál es la mayor covarianza posible?',4,[
          beat('Aplicar la cota','Cauchy y Schwarz limitan la magnitud de la covarianza al producto de las desviaciones.',String.raw`|\operatorname{Cov}(Y_1,Y_2)|\leq\sqrt{2\cdot8}`),
          beat('Evaluar el máximo','El extremo positivo corresponde a rho igual a uno.',String.raw`\max\operatorname{Cov}(Y_1,Y_2)=4`,{...diagram,highlight:[[0,1],[1,0]]})
        ],'El mínimo es −4; el máximo es +4 y se alcanza con una relación lineal positiva exacta casi seguramente.','unidades de Y1 por unidades de Y2',0),
        question('perfect-relation','En el máximo, escribe la relación lineal exacta. Introduce el término independiente en Y2=aY1+b.',-9,[
          beat('Relacionar variables centradas','Rho igual a uno significa que los valores centrados son proporcionales en el mismo sentido.',String.raw`Y_2-E[Y_2]=\frac{\sigma_2}{\sigma_1}(Y_1-E[Y_1])\quad\text{casi seguramente}`),
          beat('Encontrar la pendiente','El cociente de desviaciones es la raíz del cociente de varianzas.',String.raw`a=\sqrt{8/2}=2`),
          beat('Sustituir las medias','La media de Y dos es menos uno y la de Y uno es cuatro.',String.raw`Y_2+1=2(Y_1-4)`),
          beat('Distribuir la pendiente','Multiplico dos por los dos términos del paréntesis.',String.raw`Y_2+1=2Y_1-8`),
          beat('Despejar Y dos','Resto uno a ambos lados para obtener la relación final.',String.raw`Y_2=2Y_1-9`)
        ],'Correlación perfecta positiva significa relación afín, no necesariamente Y2=Y1.','unidades de Y2',0)
      ],diagram,['Se suponen momentos finitos y las dos varianzas positivas dadas.']);
  }),
  define(3, 8, 17, 'Laberinto: multinomial y diferencia de recuentos', ['multinomial','covarianza-matrices','combinaciones-incorrelacion','bernoulli-binomial','esperanza'], () => {
    const diagram = matrix(['Y1','Y2','Y3'],['Y1','Y2','Y3'],[[4/3,-2/3,-2/3],[-2/3,4/3,-2/3],[-2/3,-2/3,4/3]]);
    return content('Una rata elige una de tres salidas en cada recorrido. La primera ofrece alimento, pero aquí se estudia la hipótesis de elección aleatoria, sin aprendizaje.',
      ['Y1,Y2,Y3 cuentan elecciones de cada salida; p1=p2=p3=1/3.','Para la probabilidad conjunta: n=6 y recuentos (3,1,2).','Para los demás apartados se pide una fórmula para n general; el comprobador usa el n=6 original como representante numérico.'],[
        question('joint','¿Qué probabilidad tiene (Y1,Y2,Y3)=(3,1,2) en seis recorridos?',60/729,[
          beat('Comprobar el total','Los tres recuentos deben sumar el número de recorridos.',String.raw`3+1+2=6`,bars(['Salida 1','Salida 2','Salida 3'],[3,1,2])),
          beat('Ordenar los recorridos','El factorial de seis cuenta todas las posiciones antes de eliminar reordenaciones de elecciones iguales.',String.raw`6!=720`),
          beat('Eliminar reordenaciones internas','Los recorridos dentro de una misma salida son indistinguibles para el recuento.',String.raw`3!\,1!\,2!=6\cdot1\cdot2=12`),
          beat('Contar secuencias compatibles','Divido las ordenaciones totales entre las reordenaciones internas.',String.raw`\frac{6!}{3!1!2!}=720/12=60`),
          beat('Ponderar una secuencia','Cada recorrido aporta un tercio y hay seis recorridos independientes.',String.raw`(1/3)^3(1/3)^1(1/3)^2=(1/3)^6=1/729`),
          beat('La masa multinomial','Multiplico las sesenta secuencias compatibles por la probabilidad de cada secuencia.',String.raw`P(3,1,2)=60/729=20/243`)
        ],'Los recorridos son independientes; los recuentos de salidas comparten el total fijo.'),
        question('mean','Obtén E(Y1) para n general. Introduce su valor para n=6.',2,[
          beat('La marginal de una salida','Cada recorrido registra uno si se elige la salida uno. La suma de esos indicadores es binomial.',String.raw`Y_1\sim\operatorname{Bin}(n,1/3)`),
          beat('La esperanza general','La media es el número de recorridos por la probabilidad de esta salida.',String.raw`E[Y_1]=n\cdot1/3=n/3`),
          beat('Comprobar con seis','Sustituyo n por seis sin sustituir la fórmula general por un caso inventado.',String.raw`E[Y_1]_{n=6}=6/3=2`,bars(['Salida 1','Salida 2','Salida 3'],[2,2,2]))
        ],'La hipótesis aleatoria predice igual recuento esperado en las tres salidas.','recorridos',0),
        question('variance','Obtén Var(Y1) para n general. Introduce su valor para n=6.',4/3,[
          beat('Varianza del indicador','Un indicador de probabilidad un tercio tiene varianza p por uno menos p.',String.raw`\operatorname{Var}(I_1)=(1/3)(2/3)=2/9`),
          beat('Sumar recorridos independientes','La varianza de la suma de n indicadores independientes es n veces la varianza de uno.',String.raw`\operatorname{Var}(Y_1)=2n/9`),
          beat('El caso de seis','Sustituyo el número de recorridos original.',String.raw`\operatorname{Var}(Y_1)_{n=6}=12/9=4/3`,{...diagram,highlight:[[0,0]]})
        ],'La varianza no se obtiene de los recuentos observados (3,1,2), sino del modelo.','recorridos al cuadrado'),
        question('covariance','Obtén Cov(Y2,Y3) para n general. Introduce su valor para n=6.',-2/3,[
          beat('Productos dentro de un recorrido','Las salidas dos y tres son excluyentes. Sus dos indicadores no pueden valer uno a la vez.',String.raw`E[I_2I_3]=0`),
          beat('La covarianza de un recorrido','Resto el producto de las medias de los indicadores.',String.raw`\operatorname{Cov}(I_2,I_3)=0-(1/3)(1/3)=-1/9`),
          beat('Sumar recorridos','Entre recorridos distintos hay independencia; solo se acumula la covarianza dentro de cada recorrido.',String.raw`\operatorname{Cov}(Y_2,Y_3)=-n/9`),
          beat('El caso de seis','Evalúo la fórmula general en n igual a seis.',String.raw`\operatorname{Cov}(Y_2,Y_3)_{n=6}=-6/9=-2/3`,{...diagram,highlight:[[1,2],[2,1]]})
        ],'La covarianza negativa procede de categorías excluyentes y total fijo.','recorridos al cuadrado'),
        question('difference-mean','Obtén E(Y2−Y3) para n general. Introduce su valor para n=6.',0,[
          beat('Aplicar linealidad','La esperanza de una diferencia es la diferencia de esperanzas; no necesito independencia de los recuentos.',String.raw`E[Y_2-Y_3]=E[Y_2]-E[Y_3]`),
          beat('Usar las dos medias iguales','Cada salida tiene probabilidad un tercio, por lo que ambos recuentos tienen media n entre tres.',String.raw`E[Y_2-Y_3]=n/3-n/3=0`)
        ],'El modelo aleatorio no predice preferencia media por la salida dos frente a la tres.','recorridos',0),
        question('difference-variance','Obtén Var(Y2−Y3) para n general. Introduce su valor para n=6.',4,[
          beat('La varianza de una diferencia','El signo menos de la diferencia cambia el término de covarianza, pero no el signo de las dos varianzas.',String.raw`\operatorname{Var}(Y_2-Y_3)=\operatorname{Var}(Y_2)+\operatorname{Var}(Y_3)-2\operatorname{Cov}(Y_2,Y_3)`),
          beat('Sumar las dos varianzas','Cada marginal tiene varianza dos n entre nueve.',String.raw`2n/9+2n/9=4n/9`),
          beat('Aplicar el término compartido','La covarianza es negativa; menos dos por esa cantidad añade variación.',String.raw`-2(-n/9)=2n/9`),
          beat('Sumar todo','Obtengo la fórmula general para la diferencia.',String.raw`4n/9+2n/9=6n/9=2n/3`),
          beat('El caso de seis','Sustituyo n por seis.',String.raw`\operatorname{Var}(Y_2-Y_3)_{n=6}=2\cdot6/3=4`)
        ],'Ignorar la covarianza daría 4n/9 en lugar de 2n/3.','recorridos al cuadrado',0)
      ],diagram,['Recorridos independientes, probabilidades constantes y tres salidas equiprobables.','La recompensa no modifica las probabilidades bajo la hipótesis solicitada.']);
  })
];

export const PDF_EXERCISE_CATALOGUE = definitions.map(({factory, ...metadata}) => metadata);

export function getPdfExercises(lessonId) {
  return definitions.filter(definition => lessonId === undefined || definition.lessonIds.includes(lessonId)).map(({factory, ...metadata}) => ({...metadata, ...factory()}));
}