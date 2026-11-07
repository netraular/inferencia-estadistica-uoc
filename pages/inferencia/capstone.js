const SOURCE_FILE = 'UOC-MU-IE-2026-27-S1-PEC1-enunciado-1.pdf';
const fmt = value => Number(value.toPrecision(10)).toString();
const beat = (title, comment, tex, diagram, evidence) => ({
  title, comment, ...(tex ? {tex} : {}), ...(diagram ? {diagram} : {}), ...(evidence ? {evidence} : {})
});
const bars = (labels, values, highlight = []) => ({kind:'bars', labels, values, highlight});
const normal = (mean, sd, bounds = {}) => ({kind:'normal', mean, sd, ...bounds});

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const CAPSTONE = freeze({
  id:'culminacion-pec1', number:5, title:'Culminación: PEC 1 resuelta',
  description:'Del mecanismo de observación a las distribuciones conjuntas: soluciones razonadas de los tres ejercicios.',
  prerequisiteLessonIds:['sucesos','combinatoria','condicionada','independencia-sucesos','bayes-diagnostico','poisson','normal','multinomial','normal-bivariante','independencia-variables','covarianza-matrices'],
  source:{file:SOURCE_FILE, url:`/materiales/${SOURCE_FILE}`, kind:'statement', title:'UOC MU IE 2026-27 S1: PEC 1, enunciado'},
  sections:[
    {id:'pec1-seleccion', title:'1. Descendientes: información existencial y selección', exerciseId:'capstone-pec1-1', lessonIds:['sucesos','combinatoria','condicionada','independencia-sucesos']},
    {id:'pec1-placas', title:'2. Placas: Poisson, Bayes y predicción', exerciseId:'capstone-pec1-2', lessonIds:['poisson','condicionada','bayes-diagnostico']},
    {id:'pec1-normal', title:'3. Normal bivariante, categorías y recuentos', exerciseId:'capstone-pec1-3', lessonIds:['normal','multinomial','normal-bivariante','independencia-variables','covarianza-matrices']}
  ]
});

function question(id, prompt, answer, tutorSteps, interpretation, options = {}) {
  const qualitative = answer === null;
  return {
    id, part:options.part ?? id, prompt, answer,
    tolerance:qualitative ? null : (options.tolerance ?? 0.000005),
    unit:qualitative ? 'respuesta razonada' : (options.unit ?? 'probabilidad entre 0 y 1'),
    grading:{kind:qualitative ? 'qualitative' : 'numeric', mode:qualitative ? 'review' : 'exact', ...options.grading},
    answerTex:options.answerTex, answerText:options.answerText ?? interpretation,
    hint:tutorSteps[0].comment, interpretation,
    steps:tutorSteps.map(({title, comment, tex}) => ({title, explanation:comment, ...(tex ? {tex} : {})})),
    tutorSteps, ...(options.reference ? {reference:options.reference} : {})
  };
}

function exercise(sectionIndex, prompt, given, assumptions, questions, extra = {}) {
  const section = CAPSTONE.sections[sectionIndex];
  return {
    id:section.exerciseId, type:'pdf', title:section.title, chapterId:CAPSTONE.id,
    source:{...CAPSTONE.source, number:String(sectionIndex+1)}, lessonIds:[...section.lessonIds],
    prompt, given, assumptions, questions, visual:{type:'pdf', params:{}}, ...extra
  };
}

function offspringExperiment(selectedFirst) {
  const weekdays = ['L','Ma','Mi','J','V'];
  const outcomes = [false,true].flatMap(carrier => weekdays.map(weekday => ({carrier, weekday})));
  const labels = outcomes.map(outcome => `${outcome.carrier ? 'C' : 'N'}-${outcome.weekday}`);
  const columns = selectedFirst ? [0,1].flatMap(selected => labels.map(label => `S${selected+1}:${label}`)) : labels;
  const states = [];
  for (const [row,first] of outcomes.entries()) for (const [secondIndex,second] of outcomes.entries()) {
    for (const selected of selectedFirst ? [0,1] : [null]) {
      const offspring = [{...first},{...second}];
      const observed = selectedFirst ? offspring[selected].carrier && offspring[selected].weekday === 'L'
        : offspring.some(child => child.carrier && child.weekday === 'L');
      states.push({id:`${row}-${secondIndex}${selectedFirst ? `-${selected}` : ''}`, row,
        column:selectedFirst ? selected*10+secondIndex : secondIndex, offspring, selected,
        observed, bothCarriers:first.carrier && second.carrier, probability:1/(selectedFirst ? 200 : 100)});
    }
  }
  return {kind:'elementary-states', denominator:states.length, states,
    eventCount:states.filter(state => state.observed).length,
    jointCount:states.filter(state => state.observed && state.bothCarriers).length,
    table:{kind:'matrix', rows:labels, columns, values:labels.map(() => columns.map(() => 1)), highlight:[]}};
}

function stateTable(experiment, joint = false) {
  return {...experiment.table, values:experiment.table.values.map(row => [...row]),
    highlight:experiment.states.filter(state => state.observed && (!joint || state.bothCarriers)).map(state => [state.row,state.column])};
}

function offspringExercise() {
  const existential = offspringExperiment(false);
  const selected = offspringExperiment(true);
  return exercise(0,
    'Dos descendientes identificados pueden ser portadores y se genotipan en días laborables. Compara dos mecanismos de información, sin cambiar el significado de lunes entre apartados.',
    ['Cada descendiente es portador con probabilidad 1/2, independientemente del otro.',
      'Cada día de genotipado es uniforme entre cinco días laborables, independiente del genotipo y del día del otro descendiente.',
      'En a basta con que alguno sea portador y haya sido genotipado el lunes. En b se elige primero un descendiente al azar y se observa eso en el elegido.'],
    ['C_i indica que el descendiente i es portador; L_i, que se genotipa el lunes.',
      'Las identidades 1 y 2 se conservan; lunes puede corresponder a cualquiera de los dos.',
      'La elección S del técnico es uniforme e independiente, anterior a observar genotipo y día.'], [
      question('a','Sabiendo que al menos uno es portador y fue genotipado el lunes, calcula la probabilidad de que ambos sean portadores.',9/19,[
        beat('Nombrar la información recibida','Llamo E a que se cumpla la pareja portador y lunes en el primero o en el segundo. La palabra o permite que se cumpla en ambos.',String.raw`E=(C_1\cap L_1)\cup(C_2\cap L_2)`),
        beat('Enumerar resultados identificados','Cada descendiente tiene diez estados: dos genotipos por cinco días. Al conservar su identidad hay cien parejas equiprobables. Cada celda es un resultado, no un porcentaje.',String.raw`|\Omega|=10\cdot10`,stateTable({...existential, states:[]}),{kind:'state-space', denominator:100, cellWeight:1/100}),
        beat('Ponderar una celda','La independencia y las dos uniformidades dan el mismo peso a cada pareja de estados.',String.raw`P(\{\omega\})=\frac1{100}`),
        beat('Una ruta hacia el aviso','En cada descendiente la probabilidad de ser portador y lunes es un medio por un quinto.',String.raw`P(C_i\cap L_i)=\frac12\cdot\frac15`),
        beat('La ruta duplicada','Si ambos son portadores y ambos fueron genotipados el lunes, las dos rutas se cumplen. Esa celda se debe contar solo una vez.',String.raw`P(C_1\cap L_1\cap C_2\cap L_2)=\frac1{100}`),
        beat('Contar el aviso existencial','Diez celdas vienen del primer descendiente y diez del segundo. Quito la única celda común. Quedan diecinueve, resaltadas en la tabla.',String.raw`|E|=10+10-1`,stateTable(existential)),
        beat('Medir la probabilidad del aviso','Divido las diecinueve celdas por los cien resultados posibles.',String.raw`P(E)=\frac{19}{100}`),
        beat('Imponer que ambos sean portadores','Entre las veinticinco parejas de días con ambos portadores, cinco tienen lunes en el primero y cinco en el segundo. Resto el lunes compartido.',String.raw`|(C_1\cap C_2)\cap E|=5+5-1`,stateTable(existential,true)),
        beat('Medir la intersección','Nueve resultados de los cien cumplen tanto el aviso como que ambos son portadores.',String.raw`P(C_1\cap C_2\cap E)=\frac9{100}`),
        beat('Cambiar el universo de referencia','Ahora el denominador es el aviso recibido. Divido la intersección por la probabilidad del aviso, sin incluir familias que no podrian producirlo.',String.raw`P(C_1\cap C_2\mid E)=\frac{9/100}{19/100}`),
        beat('Simplificar el cociente','El factor cien se cancela. La probabilidad es nueve de las diecinueve celdas compatibles, aproximadamente cero coma cuatro siete cuatro.',String.raw`P(C_1\cap C_2\mid E)=\frac9{19}`)
      ],'La información existencial selecciona 19 resultados, de los que 9 tienen ambos portadores. No identifica que descendiente origino el aviso.',{answerTex:String.raw`\frac9{19}`}),
      question('b','El técnico elige primero uno de los dos descendientes uniformemente y observa que el elegido es portador y lunes. Calcula la probabilidad de que el otro sea portador.',1/2,[
        beat('Incluir la selección en el experimento','S indica el descendiente elegido. A cada pareja de estados le corresponden dos elecciones, aunque las observaciones finales puedan coincidir.',String.raw`|\Omega_S|=100\cdot2`,stateTable({...selected, states:[]})),
        beat('Ponderar el resultado ampliado','La selección uniforme e independiente divide cada estado anterior en dos estados del mismo peso.',String.raw`P(\{\omega_S\})=\frac1{200}`),
        beat('Nombrar el aviso del técnico','Ahora F dice que el descendiente elegido, no uno cualquiera, es portador y lunes.',String.raw`F=C_S\cap L_S`),
        beat('Contar los avisos posibles','Si se elige al primero, este queda fijado y el segundo tiene diez estados. Si se elige al segundo sucede lo simétrico. Las elecciones son disjuntas.',String.raw`|F|=10+10`,stateTable(selected)),
        beat('Medir el aviso seleccionado','Hay veinte resultados ampliados compatibles entre doscientos posibles.',String.raw`P(F)=\frac{20}{200}`),
        beat('Contar al otro portador','Para cada selección, el otro descendiente puede ser portador en cualquiera de sus cinco días. Obtengo diez resultados favorables.',String.raw`|F\cap C_{3-S}|=5+5`,stateTable(selected,true)),
        beat('Condicionar al aviso seleccionado','Divido los diez resultados favorables por los veinte compatibles. No reutilizo las diecinueve celdas del apartado a.',String.raw`P(C_{3-S}\mid F)=\frac{10}{20}`),
        beat('Conservar la independencia del otro','La observación del elegido no informa del genotipo independiente del otro. La probabilidad sigue siendo un medio.',String.raw`P(C_{3-S}\mid F)=\frac12`)
      ],'Elegir antes de observar conserva el peso del genotipo del otro. Una pareja con dos portadores de lunes puede producir el aviso por dos elecciones distintas.',{answerTex:String.raw`\frac12`}),
      question('c','Explica por qué a y b no condicionan a la misma información, aunque ambos avisos mencionen un portador del lunes.',null,[
        beat('Separar suceso y mecanismo','En a recibo una afirmación existencial sobre la pareja completa. En b conozco el resultado de una selección previa. Lunes puede ser cualquiera de los dos descendientes en ambos apartados; esa no es la diferencia.',String.raw`E=(C_1\cap L_1)\cup(C_2\cap L_2)`),
        beat('Pesar cada familia por sus avisos','Sea m el número de descendientes portadores de lunes de una pareja fija. El aviso existencial se cumple una vez si m es positivo; no cuenta dos veces una pareja con m igual a dos.',String.raw`P(E\mid\omega)=\mathbf1_{\{m(\omega)>0\}}`,undefined,{kind:'selection-weights', qualifyingOffspring:[0,1,2], existentialWeights:[0,1,1], selectedWeights:[0,0.5,1]}),
        beat('Pesar la selección previa','El técnico acierta con probabilidad m entre dos. Una pareja con dos candidatos produce el aviso el doble de veces que una con uno. En el espacio de doscientos estados eso se representa conservando S.',String.raw`P(F\mid\omega)=\frac{m(\omega)}2`),
        beat('Comparar sin mezclar denominadores','El apartado a usa nueve entre diecinueve. El b usa diez entre veinte. No es una contradicción: los avisos ponderan de forma distinta las mismas parejas.',String.raw`\frac9{19}\ne\frac12`),
        beat('Precisar que haría falta para otro protocolo','Buscar primero un portador y después comunicar su día sería otro mecanismo, y habría que especificarlo. Aquí no sustituyo la unión de a por un descendiente fijado ni elijo después de mirar.',String.raw`P(\omega\mid\text{aviso})\propto P(\text{aviso}\mid\omega)P(\omega)`)
      ],'La diferencia está en la regla que produce el aviso, no en reservar lunes a un descendiente ni en cambiar los supuestos de independencia.',{
        answerTex:String.raw`P(E\mid\omega)=\mathbf1_{\{m(\omega)>0\}},\qquad P(F\mid\omega)=m(\omega)/2`,
        answerText:'El aviso existencial conserva una vez cada pareja con algún portador de lunes; la selección previa la pondera por m/2. Una pareja con dos candidatos tiene multiplicidad dos en los 200 estados seleccionados, pero solo una en los 100 estados existenciales. Por eso las posteriores son 9/19 y 1/2.'})
    ],{sampleSpaces:{existential, selected}});
}

function poissonExercise(core) {
  const zero = core.poisson.pdf(0,1.5);
  const one = core.poisson.pdf(1,1.5);
  const two = core.poisson.pdf(2,1.5);
  const tail = 1-core.poisson.cdf(2,1.5);
  const five = core.poisson.cdf(5,7.5);
  const likelihoods = [core.poisson.pdf(4,1.5),core.poisson.pdf(4,3)];
  const joints = [0.6*likelihoods[0],0.4*likelihoods[1]];
  const evidence = joints[0]+joints[1];
  const posterior = joints[1]/evidence;
  const posteriorWeights = [joints[0]/evidence,posterior];
  const zeroByIncubator = [Math.exp(-1.5),Math.exp(-3)];
  const prediction = posteriorWeights[0]*zeroByIncubator[0]+posteriorWeights[1]*zeroByIncubator[1];
  return exercise(1,'Modela los recuentos de colonias por placa, suma placas independientes y actualiza la incubadora de origen antes de predecir otra placa.',
    ['Una placa tiene un recuento Poisson con media 1,5 colonias.',
      'En b se suman cinco placas independientes, todas con media 1,5.',
      'En c la incubadora I1 tiene probabilidad previa 0,6 y media 1,5; I2 tiene previa 0,4 y media 3. La primera placa tiene cuatro colonias.',
      'La siguiente placa procede de la misma incubadora desconocida que la primera.'],
    ['Las medias Poisson corresponden a una placa con la misma exposición, no a una tasa sin unidad experimental.',
      'En c los recuentos son independientes condicionados a la incubadora; no se supone independencia marginal tras ocultar su identidad.'],[
      question('a','Calcula la probabilidad de que una placa no tenga ninguna colonia.',zero,[
        beat('Fijar la unidad experimental','N cuenta colonias en una placa. Lambda vale uno coma cinco colonias por placa; el parámetro es la media en esa exposición.',String.raw`N\sim\operatorname{Pois}(1.5)`),
        beat('Aplicar la masa de Poisson','Para cero colonias uso lambda a la potencia cero y el factorial de cero.',String.raw`P(N{=}0)=e^{-1.5}\frac{1.5^0}{0!}`),
        beat('Evaluar la potencia','Toda base positiva elevada a cero vale uno.',String.raw`1.5^0=1`),
        beat('Evaluar el factorial','Por definición, el factorial de cero vale uno.',String.raw`0!=1`),
        beat('Evaluar la exponencial','Queda la exponencial de menos uno coma cinco. No es imposible obtener cero aunque la media sea positiva.',String.raw`P(N{=}0)=${fmt(zero)}`,bars(['0','Al menos 1'],[zero,1-zero],[0]))
      ],'Aproximadamente el 22,31 % de las placas quedaría sin colonias bajo este modelo.',{part:'a',answerTex:String.raw`e^{-1.5}`}),
      question('a-tail','En el mismo apartado a, calcula la probabilidad de al menos tres colonias.',tail,[
        beat('Traducir al menos tres','Al menos tres incluye tres, cuatro y todos los enteros superiores. Su complemento contiene cero, uno y dos.',String.raw`P(N\ge3)=1-P(N\le2)`),
        beat('La masa de cero','Empiezo con la probabilidad de ninguna colonia, sin redondear para los pasos siguientes.',String.raw`P(N{=}0)=e^{-1.5}`),
        beat('La masa de una colonia','La masa de uno multiplica la exponencial por la media.',String.raw`P(N{=}1)=1.5e^{-1.5}`),
        beat('La masa de dos colonias','Divido la potencia de lambda por dos factorial.',String.raw`P(N{=}2)=\frac{1.5^2}{2}e^{-1.5}`),
        beat('Sumar el complemento','Las tres masas son disjuntas. Las sumo, sin incluir el tres.',String.raw`P(N\le2)=${fmt(zero)}+${fmt(one)}+${fmt(two)}`,bars(['0','1','2'],[zero,one,two])),
        beat('Conservar la cola pedida','Resto la acumulada de dos a uno. La respuesta es aproximadamente cero coma uno nueve uno.',String.raw`P(N\ge3)=${fmt(tail)}`,bars(['Menos de 3','Al menos 3'],[1-tail,tail],[1]))
      ],'Al menos tres no significa exactamente tres, ni más de tres.',{part:'a',answerTex:String.raw`1-e^{-1.5}\left(1+1.5+\frac{1.5^2}{2}\right)`}),
      question('b','Calcula la probabilidad de como máximo cinco colonias en el total de cinco placas independientes.',five,[
        beat('Definir el total','T suma los recuentos de las cinco placas; no es la media de esas placas.',String.raw`T=\sum_{j=1}^{5}N_j`),
        beat('Sumar parámetros','La suma de Poisson independientes es Poisson. Sumo cinco medias de uno coma cinco colonias.',String.raw`\lambda_T=5\cdot1.5`),
        beat('Identificar la ley del total','El parámetro siete coma cinco expresa colonias por conjunto de cinco placas.',String.raw`T\sim\operatorname{Pois}(7.5)`),
        beat('Incluir el extremo cinco','Como máximo cinco suma las masas desde cero hasta cinco, ambas incluidas.',String.raw`P(T\le5)=e^{-7.5}\sum_{k=0}^{5}\frac{7.5^k}{k!}`),
        beat('Evaluar las seis masas','Evaluo cada masa y sumo. Las barras representan solo los seis recuentos incluidos, no una distribución renormalizada.',String.raw`P(T\le5)=${fmt(five)}`,bars(['0','1','2','3','4','5'],Array.from({length:6},(_,count) => core.poisson.pdf(count,7.5)),[0,1,2,3,4,5]))
      ],'La independencia permite sumar los parámetros. Una media de 1,5 para el total describiría otra exposición.',{answerTex:String.raw`e^{-7.5}\sum_{k=0}^{5}\frac{7.5^k}{k!}`}),
      question('c.i','Dadas cuatro colonias en la primera placa, calcula la probabilidad posterior de que proceda de I2.',posterior,[
        beat('Conservar las probabilidades previas','Antes de contar colonias, I1 tiene peso cero coma seis e I2 cero coma cuatro.',String.raw`P(I_2)=0.4`,bars(['I1','I2'],[0.6,0.4])),
        beat('Verosimilitud de I1','Si conozco I1, cuatro colonias tienen masa Poisson con parámetro uno coma cinco. Esto no es la posterior de I1.',String.raw`P(N_1{=}4\mid I_1)=\frac{1.5^4e^{-1.5}}{4!}`),
        beat('Verosimilitud de I2','La otra incubadora usa lambda tres, conservando el mismo recuento observado.',String.raw`P(N_1{=}4\mid I_2)=\frac{3^4e^{-3}}{4!}`),
        beat('Ponderar la primera ruta','Multiplico la previa de I1 por su verosimilitud. La barra mide una probabilidad conjunta.',String.raw`P(I_1\cap\{N_1{=}4\})=0.6\frac{1.5^4e^{-1.5}}{4!}`),
        beat('Ponderar la segunda ruta','Hago lo mismo con I2. Solo ahora dibujo ambas rutas conjuntas, sin normalizarlas todavía.',String.raw`P(I_2\cap\{N_1{=}4\})=0.4\frac{3^4e^{-3}}{4!}`,bars(['I1 y 4','I2 y 4'],joints),{kind:'bayes-tree', observedCount:4, branches:[{incubator:'I1',prior:0.6,rate:1.5,likelihood:likelihoods[0],joint:joints[0]},{incubator:'I2',prior:0.4,rate:3,likelihood:likelihoods[1],joint:joints[1]}]}),
        beat('Sumar todas las rutas observadas','El denominador de Bayes es la probabilidad de cuatro colonias, sumando los dos origenes posibles.',String.raw`P(N_1{=}4)=${fmt(joints[0])}+${fmt(joints[1])}`),
        beat('Normalizar la ruta de I2','Divido la ruta de I2 por la evidencia total, sin redondear ninguna ruta.',String.raw`P(I_2\mid N_1{=}4)=\frac{0.4\,3^4e^{-3}}{0.6\,1.5^4e^{-1.5}+0.4\,3^4e^{-3}}`),
        beat('Leer la posterior','Cuatro colonias favorecen la incubadora con media tres. La posterior supera su previa cero coma cuatro, pero no llega a uno.',String.raw`P(I_2\mid N_1{=}4)=${fmt(posterior)}`,bars(['I1 dado 4','I2 dado 4'],posteriorWeights,[1]))
      ],'La verosimilitud no es una posterior. Los pesos 0,6 y 0,4 y las dos rutas deben figurar en Bayes.',{answerTex:String.raw`\frac{32}{32+3e^{1.5}}`}),
      question('c.ii','La siguiente placa procede de la misma incubadora desconocida. Dadas cuatro colonias en la primera, calcula la probabilidad de cero en la siguiente.',prediction,[
        beat('Reutilizar la incubadora, no la previa','La identidad de la incubadora se conserva. Por eso reutilizo los pesos posteriores obtenidos al observar cuatro colonias.',String.raw`w_i=P(I_i\mid N_1{=}4)`,bars(['I1 dado 4','I2 dado 4'],posteriorWeights)),
        beat('Usar independencia condicionada','Conocida la incubadora, la primera placa no modifica el recuento de la siguiente. Ocultar la incubadora no permite afirmar esa independencia.',String.raw`P(N_2{=}0\mid I_i,N_1{=}4)=P(N_2{=}0\mid I_i)`),
        beat('Ninguna colonia en I1','La probabilidad de cero con parámetro uno coma cinco es su exponencial negativa.',String.raw`P(N_2{=}0\mid I_1)=e^{-1.5}`),
        beat('Ninguna colonia en I2','Para la incubadora con media tres uso la exponencial de menos tres.',String.raw`P(N_2{=}0\mid I_2)=e^{-3}`),
        beat('Ponderar el primer futuro','La primera contribución predictiva combina el peso posterior de I1 con la probabilidad de cero dentro de I1.',String.raw`r_1=${fmt(posteriorWeights[0])}e^{-1.5}`),
        beat('Ponderar el segundo futuro','La segunda contribución usa el peso posterior de I2, no su previa cero coma cuatro.',String.raw`r_2=${fmt(posterior)}e^{-3}`,bars(['Ruta I1 a 0','Ruta I2 a 0'],posteriorWeights.map((weight,index) => weight*zeroByIncubator[index]))),
        beat('Sumar los futuros posibles','La probabilidad total posterior promedia ambas exponenciales con los pesos actualizados.',String.raw`P(N_2{=}0\mid N_1{=}4)=w_1e^{-1.5}+w_2e^{-3}`),
        beat('Evaluar la predicción','El resultado queda entre las probabilidades de cero de las dos incubadoras. No equivale a usar una nueva selección independiente de incubadora.',String.raw`P(N_2{=}0\mid N_1{=}4)=${fmt(prediction)}`),
        beat('Explicar la dependencia marginal','Ambas placas comparten una causa aleatoria. Sin condicionar, su covarianza es la varianza de la media de la incubadora y es positiva.',String.raw`\operatorname{Cov}(N_1,N_2)=0.6\cdot0.4\cdot(3-1.5)^2`)
      ],'La predicción usa la misma incubadora oculta: independencia dado I no implica independencia marginal de las placas.',{answerTex:String.raw`(1-w_2)e^{-1.5}+w_2e^{-3},\quad w_2=\frac{32}{32+3e^{1.5}}`})
    ]);
}

function normalExercise(core) {
  const cdf = value => core.normal.cdf(value,0,1);
  const covariance = 0.6*15*20;
  const coefficient = covariance/15**2;
  const conditionalMean = 120+coefficient*(110-100);
  const conditionalVariance = 20**2*(1-0.6**2);
  const conditionalSd = Math.sqrt(conditionalVariance);
  const conditionalTail = 1-cdf((140-conditionalMean)/conditionalSd);
  const differenceVariance = 20**2+15**2-2*covariance;
  const differenceSd = Math.sqrt(differenceVariance);
  const differenceTail = 1-cdf(-20/differenceSd);
  const low = cdf(-1);
  const high = 1-cdf(1);
  const middle = cdf(1)-cdf(-1);
  const multinomial = 1260*low**2*middle**6*high**2;
  const countMean = 400*high;
  const countVariance = 400*high*(1-high);
  const countSd = Math.sqrt(countVariance);
  const countZ = (74.5-countMean)/countSd;
  const approximation = 1-cdf(countZ);
  const exactCountTail = 1-core.binomial.cdf(74,400,high);
  return exercise(2,'Parte de una normal bivariante para condicionar, comparar medidas, eliminar covarianza y pasar de observaciones individuales a recuentos de una muestra.',
    ['(X,Y) tiene distribución normal bivariante: media de X 100, desviación 15; media de Y 120, desviación 20; correlación 0,6.',
      'En a se observa X=110 y se pide la distribución condicional de Y y su probabilidad de superar 140.',
      'En d se toman 10 individuos; las categorías son Y<100, 100<=Y<=140 e Y>140. Se piden exactamente 2, 6 y 2.',
      'En e se toman 400 individuos y se aproxima la probabilidad de que al menos 75 tengan Y>140.'],
    ['La notación N(media,varianza) usa varianza como segundo parámetro; el diagrama normal usa desviación típica.',
      'Las unidades de X e Y son las unidades de medida del enunciado; no se atribuyen unidades físicas que no se han especificado.',
      'Las muestras de d y e contienen individuos independientes e identicamente distribuidos. Las medidas X e Y del mismo individuo no son independientes.',
      'Y tiene densidad continua: incluir los extremos 100 y 140 no cambia las probabilidades. Condicionar a X=x se entiende mediante la distribución condicional regular de la normal.'],[
      question('a-distribution','Determina toda la distribución de Y condicionada a X=x, con su media, varianza y desviación típica.',null,[
        beat('Usar normalidad conjunta','Una sección condicional de una normal bivariante sigue siendo normal. Su centro puede cambiar con x, pero su varianza no depende de x.',String.raw`Y\mid X{=}x\sim\mathcal N\left(\mu_{Y\mid x},\sigma^2_{Y\mid x}\right)`),
        beat('Calcular la pendiente condicional','Multiplico la correlación por la razón de desviaciones. No uso la razón de varianzas.',String.raw`\beta=0.6\frac{20}{15}`),
        beat('Evaluar la pendiente','La pendiente es cero coma ocho unidades de Y por unidad de X.',String.raw`\beta=0.8`),
        beat('Desplazar el centro de Y','A la media marginal de Y le sumo la pendiente por el desplazamiento de x respecto a la media de X.',String.raw`\mu_{Y\mid x}=120+0.8(x-100)`),
        beat('Obtener la varianza residual','La correlación reduce la varianza de Y por el factor uno menos rho al cuadrado.',String.raw`\sigma^2_{Y\mid x}=20^2(1-0.6^2)`),
        beat('Evaluar la varianza','La varianza condicional vale doscientos cincuenta y seis, en unidades de Y al cuadrado.',String.raw`\sigma^2_{Y\mid x}=256`),
        beat('Recuperar la desviación','Tomo la raiz positiva para recuperar las unidades de Y.',String.raw`\sigma_{Y\mid x}=16`),
        beat('Escribir la ley completa','El segundo parámetro de esta normal es la varianza doscientos cincuenta y seis, no la desviación dieciseis.',String.raw`Y\mid X{=}x\sim\mathcal N\left(120+0.8(x-100),256\right)`)
      ],'La normalidad conjunta justifica la ley condicional completa; una correlación conocida sin ese supuesto no bastaría.',{part:'a',answerTex:String.raw`Y\mid X{=}x\sim\mathcal N\left(120+0.8(x-100),256\right)`,answerText:'La media condicional es 120+0,8(x-100), la varianza es 256 y la desviación típica es 16. Para X=110 la ley es N(128,256).'}),
      question('a','Calcula P(Y>140 | X=110).',conditionalTail,[
        beat('Sustituir el valor observado','El desplazamiento de X respecto a cien es diez. Aplico la pendiente condicional, no la media marginal de Y.',String.raw`\mu_{Y\mid110}=120+0.8(110-100)`),
        beat('Situar la normal condicional','La media es ciento veintiocho y la desviación dieciseis. Todavía no sombreamos la cola.',String.raw`\mu_{Y\mid110}=128`,normal(conditionalMean,conditionalSd)),
        beat('Centrar el umbral','Resto la media condicional al umbral ciento cuarenta.',String.raw`140-128=12`),
        beat('Tipificar el umbral','Divido doce por la desviación dieciseis. No divido por la varianza doscientos cincuenta y seis.',String.raw`z=\frac{12}{16}`),
        beat('Localizar la cola derecha','El umbral está a cero coma setenta y cinco desviaciones del centro. Ahora marco el área por encima de ciento cuarenta.',String.raw`z=0.75`,normal(128,16,{lower:140})),
        beat('Restar la acumulada','Phi mide el área a la izquierda; el enunciado pide la cola derecha.',String.raw`P(Y>140\mid X{=}110)=1-\Phi(0.75)`),
        beat('Evaluar la cola condicional','La probabilidad es aproximadamente cero coma dos dos siete. Es mayor que la cola marginal porque X igual a ciento diez desplaza Y hacia arriba.',String.raw`P(Y>140\mid X{=}110)=${fmt(conditionalTail)}`)
      ],'Esta probabilidad es condicional. No se debe sustituir por la cola marginal 1-Phi(1).',{answerTex:String.raw`1-\Phi(0.75)`}),
      question('b','Sea D=Y-X. Determina su distribución y calcula P(Y>X), es decir P(D>0).',differenceTail,[
        beat('Usar una transformación lineal','Una combinación lineal de una normal conjunta es normal. La diferencia conserva la covarianza de las dos medidas.',String.raw`D=Y-X`),
        beat('Restar medias','La linealidad de la esperanza no requiere independencia.',String.raw`E[D]=120-100`),
        beat('Calcular la covarianza original','Multiplico la correlación por ambas desviaciones. Sus unidades son unidades de X por unidades de Y.',String.raw`\operatorname{Cov}(X,Y)=0.6\cdot15\cdot20`),
        beat('Incluir la covarianza en la diferencia','Restar variables resta dos veces la covarianza a la suma de varianzas. Omitirla produciría una dispersión incorrecta.',String.raw`\operatorname{Var}(D)=400+225-2\cdot180`),
        beat('Evaluar la varianza de D','La varianza es doscientos sesenta y cinco en unidades de diferencia al cuadrado.',String.raw`\operatorname{Var}(D)=265`),
        beat('Escribir la ley de D','D tiene media veinte y desviación raiz de doscientos sesenta y cinco.',String.raw`D\sim\mathcal N(20,265)`,normal(20,differenceSd)),
        beat('Tipificar el punto cero','El umbral cero está por debajo de la media veinte.',String.raw`z_0=\frac{0-20}{\sqrt{265}}`),
        beat('Conservar diferencias positivas','Y supera X exactamente cuando D es positiva. Marco la cola derecha del punto cero.',String.raw`P(D>0)=1-\Phi\left(-\frac{20}{\sqrt{265}}\right)`,normal(20,differenceSd,{lower:0})),
        beat('Evaluar la comparación','La probabilidad supera un medio porque la diferencia normal está centrada en veinte, por encima de cero.',String.raw`P(Y>X)=${fmt(differenceTail)}`)
      ],'La ley de D es exacta bajo normalidad conjunta; no se ha supuesto independencia entre X e Y.',{answerTex:String.raw`\Phi\left(\frac{20}{\sqrt{265}}\right)`}),
      question('c-covariance','Calcula Cov(X,Y) para decidir si las dos medidas originales pueden ser independientes.',covariance,[
        beat('Recuperar la covarianza','La correlación es adimensional. Para recuperar covarianza la multiplico por las dos desviaciones típicas.',String.raw`\operatorname{Cov}(X,Y)=0.6\cdot15\cdot20`),
        beat('Evaluar y conservar unidades','La covarianza vale ciento ochenta en unidades de X por unidades de Y. No es una probabilidad.',String.raw`\operatorname{Cov}(X,Y)=180`)
      ],'Una covarianza no nula descarta independencia cuando existen estos momentos finitos.',{part:'c',unit:'unidades de X por unidades de Y',tolerance:0,answerTex:'180'}),
      question('c','Encuentra a para que X y V=Y-aX sean independientes.',coefficient,[
        beat('Definir la nueva medida','V elimina de Y una componente lineal de X. Busco una pendiente que deje covarianza cero.',String.raw`V=Y-aX`),
        beat('Expandir la covarianza','La bilinealidad resta a veces la varianza de X.',String.raw`\operatorname{Cov}(X,V)=180-a\cdot225`),
        beat('Imponer covarianza cero','Igualo esa expresión a cero. La independencia se justificara con la normalidad conjunta, no solo con este despeje.',String.raw`180-225a=0`),
        beat('Despejar la pendiente','Divido la covarianza por la varianza de X, que es positiva.',String.raw`a=\frac{180}{225}`),
        beat('Evaluar a','Obtengo la misma pendiente cero coma ocho que aparece en la media condicional.',String.raw`a=0.8`),
        beat('Comprobar el resultado','Al sustituir, las dos contribuciones de la covarianza se cancelan.',String.raw`\operatorname{Cov}(X,V)=180-0.8\cdot225`)
      ],'El coeficiente es 0,8 unidades de Y por unidad de X. La independencia exige además el argumento de normalidad conjunta.',{part:'c',unit:'unidades de Y por unidad de X',tolerance:0.00000001,answerTex:'0.8'}),
      question('c-reason','Justifica por qué X e Y no son independientes, pero X y V=Y-0,8X sí lo son.',null,[
        beat('Descartar independencia original','La independencia con segundos momentos finitos implicaría covarianza cero. Ciento ochenta es distinto de cero, así que X e Y son dependientes.',String.raw`\operatorname{Cov}(X,Y)=180`),
        beat('Conservar normalidad conjunta','El par X y V es una transformación lineal del par normal X e Y. Por tanto, también es conjuntamente normal, no solo normal en cada marginal.',String.raw`\begin{pmatrix}X\\V\end{pmatrix}=\begin{pmatrix}1&0\\-0.8&1\end{pmatrix}\begin{pmatrix}X\\Y\end{pmatrix}`),
        beat('Verificar covarianza nula','Con la pendiente encontrada la covarianza entre X y V es cero.',String.raw`\operatorname{Cov}(X,V)=0`),
        beat('Usar el criterio gaussiano','En una distribución conjuntamente normal, covarianza nula implica independencia. Fuera de ese modelo, incorrelación no bastaría.',String.raw`X\perp V`),
        beat('Obtener el centro de V','Resto cero coma ocho veces la media de X a la media de Y. V no tiene media cero, porque no se ha restado la ordenada del ajuste.',String.raw`E[V]=120-0.8\cdot100`),
        beat('Obtener la varianza de V','Aplico la regla de varianza de una combinación lineal, incluyendo la covarianza original.',String.raw`\operatorname{Var}(V)=400+0.8^2\cdot225-2\cdot0.8\cdot180`),
        beat('Identificar la ley residual','V es normal con media cuarenta y varianza doscientos cincuenta y seis. Su independencia de X explica la dispersión condicional constante de a.',String.raw`V\sim\mathcal N(40,256)`,normal(40,16))
      ],'Covarianza nula basta aquí porque el par transformado es conjuntamente normal. No se está afirmando ese criterio para variables arbitrarias.',{part:'c',answerTex:String.raw`X\not\perp Y,\qquad X\perp V,\qquad V\sim\mathcal N(40,256)`}),
      question('d','En 10 individuos independientes, calcula la probabilidad de exactamente 2 con Y<100, 6 con 100<=Y<=140 y 2 con Y>140.',multinomial,[
        beat('Usar la marginal de Y','Esta muestra no está condicionada a X igual a ciento diez. Uso media ciento veinte y desviación veinte.',String.raw`Y\sim\mathcal N(120,400)`,normal(120,20)),
        beat('Tipificar el límite inferior','Cien está una desviación por debajo de la media.',String.raw`z_L=\frac{100-120}{20}`),
        beat('Medir la categoría baja','La probabilidad baja es Phi de menos uno.',String.raw`p_L=\Phi(-1)`,normal(120,20,{upper:100})),
        beat('Tipificar el límite superior','Ciento cuarenta está una desviación por encima del centro.',String.raw`z_H=\frac{140-120}{20}`),
        beat('Medir la categoría alta','La probabilidad alta es la cola derecha de uno. Por simetría coincide con la baja.',String.raw`p_H=1-\Phi(1)`,normal(120,20,{lower:140})),
        beat('Medir la categoría central','Resto la acumulada de menos uno a la de uno. Las tres categorías son disjuntas y cubren todos los valores.',String.raw`p_M=\Phi(1)-\Phi(-1)`,bars(['Y<100','100 a 140','Y>140'],[low,middle,high])),
        beat('Modelar el vector de recuentos','Cada individuo cae en exactamente una categoría con probabilidades constantes. Los recuentos suman diez y no son independientes entre sí.',String.raw`(K_L,K_M,K_H)\sim\operatorname{Mult}(10;p_L,p_M,p_H)`),
        beat('Contar las asignaciones','El coeficiente multinomial cuenta que individuos ocupan cada categoría, sin ordenar dentro de una misma categoría.',String.raw`M=\frac{10!}{2!\,6!\,2!}`),
        beat('Evaluar el coeficiente','El número de asignaciones es mil doscientas sesenta, no un coeficiente binomial para una sola categoría.',String.raw`M=1260`),
        beat('Ponderar una asignación','La independencia entre individuos permite multiplicar dos factores bajos, seis centrales y dos altos.',String.raw`p_{\text{asignacion}}=p_L^2p_M^6p_H^2`),
        beat('Reunir asignaciones disjuntas','Multiplico el peso de una asignación por el número de asignaciones posibles.',String.raw`P(K_L{=}2,K_M{=}6,K_H{=}2)=1260p_L^2p_M^6p_H^2`),
        beat('Evaluar sin redondear categorías','Utilizo las probabilidades normales completas para no acumular error en las potencias.',String.raw`P(K_L{=}2,K_M{=}6,K_H{=}2)=${fmt(multinomial)}`)
      ],'La independencia corresponde a los individuos; no a los tres recuentos multinomiales con total fijo.',{answerTex:String.raw`1260\,\Phi(-1)^2[\Phi(1)-\Phi(-1)]^6[1-\Phi(1)]^2`}),
      question('e','En 400 individuos independientes, aproxima por una normal la probabilidad de que al menos 75 tengan Y>140, aplicando corrección de continuidad.',approximation,[
        beat('Definir éxito individual','Éxito significa que Y supera ciento cuarenta. Es la categoría marginal alta, no la probabilidad condicionada de a.',String.raw`p=1-\Phi(1)`),
        beat('Definir el recuento binomial','K cuenta éxitos en cuatrocientos individuos independientes con la misma probabilidad p. Esta ley es exacta.',String.raw`K\sim\operatorname{Bin}(400,p)`),
        beat('Comprobar éxitos esperados','Cuatrocientos por p es aproximadamente sesenta y tres coma cuatro seis, muy por encima de diez.',String.raw`np=${fmt(countMean)}`),
        beat('Comprobar fracasos esperados','El número esperado de fracasos también supera diez. Ambas condiciones apoyan la aproximación, pero no la vuelven una identidad.',String.raw`n(1-p)=${fmt(400*(1-high))}`),
        beat('Centrar la normal aproximada','La media normal coincide con la media binomial.',String.raw`\mu_K=400p`),
        beat('Calcular la varianza binomial','La varianza es cuatrocientos por p por uno menos p, no cuatrocientos por p solamente.',String.raw`\sigma_K^2=400p(1-p)`),
        beat('Recuperar la desviación del recuento','Tomo la raiz de la varianza. La desviación se expresa en individuos.',String.raw`\sigma_K=${fmt(countSd)}`,normal(countMean,countSd)),
        beat('Corregir la frontera discreta','Al menos setenta y cinco incluye la barra centrada en setenta y cinco, que empieza en setenta y cuatro coma cinco. Marco esa frontera, no setenta y cinco coma cinco.',String.raw`P(K\ge75)\approx P(W>74.5)`,normal(countMean,countSd,{lower:74.5}),{kind:'continuity-correction', discrete:{distribution:'binomial',n:400,p:high,minimum:75},continuous:{distribution:'normal',mean:countMean,sd:countSd,lower:74.5}}),
        beat('Tipificar la frontera corregida','Resto la media y divido por la desviación, manteniendo todos los decimales internos.',String.raw`z=\frac{74.5-400p}{\sqrt{400p(1-p)}}`),
        beat('Evaluar el umbral estándar','El umbral corregido queda por encima de la media.',String.raw`z=${fmt(countZ)}`),
        beat('Aproximar la cola derecha','Resto a uno la acumulada normal del umbral corregido. Este es el resultado solicitado por aproximación normal.',String.raw`P(K\ge75)\approx1-\Phi(${fmt(countZ)})`),
        beat('Expresar la aproximación','Conservo la etiqueta de aproximación: la binomial exacta y esta área normal no tienen por qué coincidir.',String.raw`P(K\ge75)\approx${fmt(approximation)}`)
      ],'La respuesta evaluada es la aproximación normal con frontera 74,5. El valor binomial exacto se conserva aparte como referencia, no se confunde con ella.',{
        grading:{mode:'approximate',method:'normal-with-continuity-correction'},
        answerTex:String.raw`1-\Phi\left(\frac{74.5-400p}{\sqrt{400p(1-p)}}\right),\quad p=1-\Phi(1)`,
        reference:{method:'exact-binomial',answer:exactCountTail,tex:String.raw`P(K\ge75)=\sum_{k=75}^{400}\binom{400}{k}p^k(1-p)^{400-k}`,interpretation:'Referencia binomial exacta, distinta de la aproximación normal solicitada.'}})
    ]);
}

export function getCapstoneExercises() {
  const core = globalThis.jStat;
  if (!core) throw new Error('Carga globalThis.jStat antes de solicitar los ejercicios de culminación PEC 1.');
  return [offspringExercise(),poissonExercise(core),normalExercise(core)];
}