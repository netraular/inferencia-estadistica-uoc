import {stageEquations,createTutorFrames} from './exercise-tutor.js?v=f405affbef37';

const number=value=>Number(value.toPrecision(7)).toString().replace('.', ',');
const strategies=new Map([
  [['union'],['Queremos que ocurra al menos uno de los sucesos, incluidos los resultados compartidos.','La suma cuenta dos veces la intersección; retirarla una vez conserva cada resultado una sola vez.']],
  [['neither'],['Queremos que no ocurra ninguno de los dos sucesos.','Primero reunimos todo lo que cumple A o B y después conservamos su complemento.']],
  [['proportion','last-share'],['Queremos comparar una parte con su propio total, no dar un recuento absoluto.','Dividir por el total conserva la importancia relativa de esa parte.']],
  [['micrograms'],['Queremos expresar la misma masa en una unidad más pequeña.','El factor de conversión multiplica el número de unidades, no la cantidad de nutriente.']],
  [['constant','normalizer','f-constant'],['Queremos encontrar la constante que hace válida la distribución.','Exigimos probabilidad total uno sobre todo el soporte y comprobamos además que no haya valores negativos.']],
  [['value'],['Queremos la salida de la función en la entrada indicada.','Sustituimos la entrada en la regla; la salida no tiene por qué coincidir con ella.']],
  [['sum'],['Queremos sumar varias salidas de la función.','Evaluamos cada entrada antes de sumar; evaluar solo la suma de entradas sería otra operación.']],
  [['cdf','b-cdf','f-cdf'],['Queremos acumular todos los valores que no superan el límite, incluyendo el propio límite.','La acumulada se construye con el soporte completo; si se pide por tramos, el valor de comprobación no sustituye a la función.']],
  [['strict'],['Queremos los valores estrictamente menores que el umbral.','Excluimos su masa si la variable es discreta: cambiar menor por menor o igual puede cambiar la respuesta.']],
  [['below','before','under-120','d-under-six','f-under-six'],['Queremos el área que queda por debajo del umbral.','Acumulamos desde el inicio del soporte y mantenemos las mismas unidades al introducir el límite.']],
  [['point','c-point','f-point'],['Queremos la probabilidad de un único valor de una variable con densidad.','Un punto tiene anchura cero; una altura positiva no le proporciona área.']],
  [['c-height','f-height','marginal-density','conditional-density'],['Queremos una altura de densidad, no una probabilidad puntual.','Evaluar la función da densidad por unidad; solo su integral sobre una región da probabilidad.']],
  [['interval','90-to-120','d-six-to-twelve','f-six-to-twelve'],['Queremos la probabilidad entre dos límites.','Restar las dos acumuladas elimina lo anterior al límite inferior y conserva solo el intervalo.']],
  [['mean','e-mean','f-mean','mean-failures'],['Queremos el valor medio teórico al repetir el experimento.','Ponderamos los valores por su probabilidad; el resultado no tiene por qué ser un valor observable.']],
  [['variance','e-variance','f-variance'],['Queremos medir la dispersión alrededor de la media.','El segundo momento incluye la posición del centro; restar el cuadrado de la media deja solo dispersión.']],
  [['remaining'],['Queremos el máximo de la segunda cantidad una vez fijada la primera.','La capacidad es compartida: lo asignado al primer cultivo ya no está disponible para el segundo.']],
  [['area'],['Queremos medir toda la región de repartos permitidos.','El triángulo ocupa la mitad del rectángulo de la misma base y altura; todavía no es una probabilidad.']],
  [['unordered'],['Queremos contar grupos, sin distinguir posiciones ni repetir elementos.','Dividimos las secuencias por las reordenaciones que describen el mismo grupo.']],
  [['ordered'],['Queremos contar asignaciones a posiciones identificadas, sin repetir elementos.','Cada elección reduce las opciones de la posición siguiente; intercambiar posiciones sí crea otra asignación.']],
  [['with-repetition'],['Queremos contar secuencias que pueden repetir etiquetas.','Todas las posiciones conservan el mismo número de opciones porque no se retiran etiquetas.']],
  [['all-ordered'],['Queremos ordenar todos los elementos distintos.','Queda una opción menos tras cada posición; el producto de esas opciones es el factorial.']],
  [['repeated-labels'],['Queremos ordenar etiquetas que incluyen copias indistinguibles.','El factorial total cuenta intercambios invisibles; dividimos por el factorial de cada multiplicidad.']],
  [['recovery-given-treatment','treatment-given-recovery','given'],['Queremos una proporción dentro del grupo que ya sabemos que se ha seleccionado.','El denominador es ese grupo, no la población original; invertir la condición cambia el denominador.']],
  [['product'],['Queremos la intersección que predeciría la independencia.','Comparamos el producto con el dato observado; no suponemos independencia para demostrarla.']],
  [['positive'],['Queremos todos los resultados positivos antes de conocer su origen.','Sumamos las rutas verdaderas y falsas, ponderadas por la frecuencia de cada grupo.']],
  [['posterior','vpp','vpp-20','vpp-80'],['Queremos saber qué proporción de los positivos tiene realmente la condición.','La sensibilidad condiciona en el sentido contrario; Bayes cambia la referencia a todos los positivos.']],
  [['vpn','vpn-20','vpn-80'],['Queremos saber qué proporción de los negativos está libre de la condición.','El denominador incluye negativos verdaderos y falsos; la especificidad sola no responde esta pregunta.']],
  [['transformed-mean','jensen-gap'],['Queremos distinguir promediar cuadrados de elevar el promedio al cuadrado.','Una transformación no lineal no se intercambia con la esperanza; conservamos las probabilidades de los valores originales.']],
  [['exact','exact-three','exact-ten','approximate-ten'],['Queremos un recuento exacto, no una acumulada.','Conservamos solo el entero pedido; las condiciones del modelo determinan qué masa utilizar.']],
  [['at-most','at-most-two','at-most-ten'],['Queremos todos los recuentos hasta el límite, incluido ese límite.','Las masas de recuentos distintos son disjuntas y se suman sin volver a normalizar.']],
  [['strict-tail'],['Queremos superar estrictamente el recuento indicado.','El complemento termina en el propio umbral; la cola comienza en el siguiente entero.']],
  [['at-least','at-least-one','at-least-fifteen','survivors'],['Queremos alcanzar o superar el recuento indicado.','El complemento acaba un entero antes del límite para no perder la masa del propio límite.']],
  [['first-success'],['Queremos el primer éxito precisamente en el ensayo indicado.','Los ensayos anteriores deben ser fracasos y el último un éxito; no hay que elegir la posición de ese último éxito.']],
  [['more-trials'],['Queremos necesitar más ensayos para lograr el primer éxito.','Hasta el umbral todos los ensayos deben haber fracasado.']],
  [['survival','d-over-two','f-over-two','c-gt','f-gt','c-ge','f-ge','upper-tail','variance-tail'],['Queremos la probabilidad que queda a la derecha del umbral.','La acumulada mide lo que queda a la izquierda; la cola pedida es su complemento.']],
  [['memoryless'],['Queremos seguir esperando, después de haber esperado ya un tiempo sin evento.','Dividimos dos supervivencias: con tasa constante se cancela la espera ya transcurrida.']],
  [['quantile','median','p25','cutoff','critical'],['Queremos el umbral que deja a su izquierda la probabilidad indicada.','Aquí la probabilidad es el dato y el valor de la variable es la incógnita; invertimos la acumulada.']],
  [['sufficient-statistic'],['Queremos resumir la información de la muestra sobre el parámetro.','Con el tamaño fijo, factorizamos la verosimilitud para ver qué combinación de los datos contiene su dependencia del parámetro.']],
  [['mle'],['Queremos el parámetro que hace más verosímiles los datos observados.','Dejamos la muestra fija y variamos el parámetro; comprobamos un máximo, no solo una derivada nula.']],
  [['log-likelihood'],['Queremos evaluar la log-verosimilitud en el candidato indicado.','El logaritmo convierte productos en sumas y conserva los máximos; para evaluar su valor absoluto no descartamos los términos constantes.']],
  [['cell'],['Queremos una pareja exacta de valores simultáneos.','Seleccionamos una celda de la tabla, sin sumar toda su fila o columna.']],
  [['region'],['Queremos todas las parejas que satisfacen simultáneamente las restricciones.','Seleccionamos primero las celdas admisibles y después sumamos sus masas.']],
  [['marginal-a','marginal-y','marginal','marginal-tail'],['Queremos describir una variable sin fijar la otra.','Sumar o integrar sobre la coordenada descartada conserva todas sus posibilidades; no es condicionar.']],
  [['conditional-y','conditional-tail'],['Queremos una probabilidad después de fijar información sobre otra variable.','Normalizamos dentro de la condición; una marginal no incorpora esa información.']],
  [['sum-event','reduction'],['Queremos el área del suceso dentro del soporte conjunto.','La desigualdad recorta la región antes de integrar; integrar el soporte entero respondería otra pregunta.']],
  [['conditional-mean'],['Queremos el centro de la distribución después de observar la otra coordenada.','La normalidad conjunta permite desplazar la media usando la correlación y la razón de desviaciones.']],
  [['conditional-sd'],['Queremos la desviación típica de la distribución condicional.','Primero reducimos la varianza por el factor residual y después tomamos su raíz para recuperar las unidades originales.']],
  [['factorization-gap','independence-check'],['Queremos comparar una masa conjunta con el producto de sus marginales.','Una discrepancia en una sola pareja refuta la independencia, aunque la covarianza sea nula.']],
  [['covariance','covariance-ab'],['Queremos cuantificar la variación lineal compartida.','Restamos el producto de medias a la esperanza del producto; no confundimos esas dos operaciones.']],
  [['correlation','impossible-rho'],['Queremos expresar la asociación lineal sin unidades.','Dividimos por el producto de desviaciones positivas y contrastamos el resultado con el intervalo de menos uno a uno.']],
  [['pmf','joint'],['Queremos construir la distribución completa, no solo su valor de comprobación.','Agrupamos los resultados elementales que producen cada valor o pareja, sumando sus probabilidades sin perder multiplicidades.']],
  [['joint-counts'],['Queremos la probabilidad de los tres recuentos indicados simultáneamente.','Los recuentos deben sumar el total fijo; sumamos los pesos de todas las secuencias con esa misma terna, no las probabilidades de cada recuento por separado.']],
  [['a-area'],['Queremos comprobar que la función puede ser una densidad.','Necesitamos tanto signo no negativo como área total uno; ninguna de las dos condiciones sustituye a la otra.']],
  [['approximation-error','binomial-check'],['Queremos comparar probabilidades de dos descripciones del mismo suceso.','La diferencia absoluta mide el desacuerdo sin cancelación de signos; si se piden varios valores, los contrastamos todos.']],
  [['false-positive','healthy-count-factor'],['Queremos cuantificar errores entre las personas sanas.','La regla positiva selecciona la cola superior de los sanos; un recuento esperado exige multiplicar esa proporción por su tamaño de población.']],
  [['six-and-six'],['Queremos una muestra con los recuentos indicados de ambos grupos.','Sin reemplazo las extracciones no son independientes; contamos subconjuntos favorables y los dividimos por todos los subconjuntos posibles.']],
  [['self'],['Queremos la covarianza de una variable consigo misma.','El producto de sus dos desviaciones es el cuadrado de la desviación; su esperanza es la varianza.']],
  [['maximum'],['Queremos la mayor covarianza compatible con las dos varianzas.','La desigualdad de Cauchy y Schwarz limita su magnitud al producto de las desviaciones.']],
  [['perfect-relation'],['Queremos la relación afín que alcanza la covarianza máxima.','Correlación uno hace proporcionales las variables centradas; las desviaciones fijan la pendiente y las medias el término independiente.']],
  [['difference-mean'],['Queremos la media de la diferencia para cualquier tamaño del experimento.','La linealidad permite restar las medias sin exigir independencia de los recuentos.']],
  [['difference-variance'],['Queremos la varianza de la diferencia conservando el tamaño general.','Al restar variables aparece menos dos veces la covarianza; si es negativa, aumenta la dispersión de la diferencia.']],
  [['mean-variance'],['Queremos la varianza de una media de observaciones independientes.','Cada coeficiente uno entre n se eleva al cuadrado al calcular la varianza; sumar n aportes deja la varianza poblacional dividida entre n.']],
  [['observed-unbiased','observed-divisor-n'],['Queremos medir la dispersión de la muestra observada con el divisor solicitado.','Centramos con la media de esa misma muestra; dividir por n menos uno corrige el sesgo y dividir por n describe otra cantidad.']],
  [['two-sided'],['Queremos una probabilidad en las dos colas de Student.','La simetría permite duplicar la cola por encima del valor absoluto del estadístico, no la acumulada izquierda.']],
  [['margin'],['Queremos el margen de un intervalo bilateral para la media.','Repartimos el error entre ambas colas y multiplicamos el cuantil de Student por el error estándar estimado.']]
].flatMap(([ids,[objective,why]])=>ids.map(id=>[id,{objective,why}])));

const specialStrategies={
  'pdf-u1-1':{a:'union',b:['Queremos los resultados en que no ocurre A, sin imponer ninguna condición a B.','A y su complemento son disjuntos y completan probabilidad uno.'],c:['Queremos B sin la parte que comparte con A.','Retiramos de B la intersección, no todo A.'],d:['Queremos A sin la parte que comparte con B.','Retiramos de A la intersección, no todo B.'],e:'neither'},
  'pdf-u1-2':{a:'union',b:['Queremos solo A: ni B ni C pueden ocurrir.','Al restar las intersecciones de A con B y con C quitamos dos veces la triple y debemos devolver una copia.'],c:['Queremos B o C, permitiendo ambas, pero excluyendo A.','De la unión de B y C retiramos solo la parte que coincide con A.'],d:['Queremos A o la ausencia simultánea de B y C.','Esas alternativas comparten solo A; corregimos esa coincidencia para no duplicarla.']},
  'pdf-u1-3':{a:['Queremos la probabilidad global de un resultado negativo.','Ponderamos cada tasa negativa por la frecuencia de su diagnóstico antes de sumar.'],'b-A':'posterior','b-B':'posterior'},
  'pdf-u3-8':{joint:'joint-counts'},
  multinomial:{exact:'joint-counts'},
  'capstone-pec1-1':{a:['Queremos ambos portadores dentro de las parejas compatibles con el aviso existencial.','El aviso permite que el portador de lunes sea cualquiera de los dos; no fija su identidad.'],b:['Queremos que el otro descendiente sea portador después de observar al elegido.','La selección previa forma parte del experimento y no depende de los genotipos que aún no se han observado.'],c:['Queremos explicar por qué los dos avisos dan posteriores distintas.','Una pareja con dos candidatos pesa una vez bajo el aviso existencial, pero tiene dos elecciones favorables bajo la selección previa.']},
  'capstone-pec1-2':{a:'exact','a-tail':'at-least',b:['Queremos que la suma de cinco placas no supere cinco colonias.','La restricción afecta al total, no por separado a cada placa; la independencia permite sumar parámetros Poisson.'],'c.i':'posterior','c.ii':['Queremos predecir cero colonias en una nueva placa de la misma incubadora desconocida.','La primera placa actualiza la procedencia común; promediamos las dos probabilidades de cero con pesos posteriores, no con las previas.']},
  'capstone-pec1-3':{'a-distribution':['Queremos toda la ley de Y al fijar X, no solo una probabilidad.','La normalidad conjunta garantiza una normal condicional; calculamos por separado su media, varianza y desviación.'],a:'conditional-tail',b:['Queremos la ley de la diferencia Y menos X y su probabilidad de ser positiva.','Una combinación lineal de una normal conjunta es normal; su varianza conserva el término de covarianza.'],'c-covariance':'covariance',c:['Queremos el coeficiente que hace independientes X e Y menos a por X.','Anulamos su covarianza; aquí basta porque la transformación conserva la normalidad conjunta.'],'c-reason':['Queremos justificar dependencia e independencia bajo el modelo normal conjunto.','La covarianza no nula refuta independencia; la covarianza nula la demuestra aquí por normalidad conjunta, no como regla universal.'],d:['Queremos los tres recuentos de categorías simultáneamente.','Los individuos son independientes, pero los tres recuentos suman diez y requieren una masa multinomial.'],e:['Queremos aproximar una cola binomial desde setenta y cinco individuos.','La aproximación normal necesita varianza binomial y corrección de continuidad en setenta y cuatro coma cinco, porque se incluye el setenta y cinco.']}
};

function strategy(exercise,question) {
  const selected=specialStrategies[exercise.id]?.[question.id] || specialStrategies[exercise.type]?.[question.id] || question.id;
  const result=Array.isArray(selected) ? {objective:selected[0],why:selected[1]} : strategies.get(selected);
  if(!result)throw new Error(`Falta razonamiento para ${exercise.id}/${question.id}.`);
  return {...result,objective:question.objective || result.objective};
}

const theory={
  events:'A y B nombran sucesos, es decir, conjuntos de resultados. La unión admite cualquiera de ellos; la intersección exige ambos. Si partimos de recuentos, dividir por el total requiere selección equiprobable, no independencia entre A y B.',
  conditional:'La barra de una probabilidad condicionada se lee sabiendo que. Solo conservamos los resultados compatibles con esa información. Dividimos la intersección por la probabilidad positiva de la condición, de modo que el grupo seleccionado vuelva a tener total uno.',
  bayes:'Una probabilidad previa describe el grupo antes de observar la prueba; una verosimilitud describe la prueba dentro de ese grupo. Multiplicar ambas da una ruta conjunta. Los orígenes son excluyentes y exhaustivos: sumamos sus rutas para normalizar la posterior.',
  discrete:'La masa asigna probabilidad a cada valor posible de X. Los pesos iniciales se convierten en masas dividiendo por su suma positiva. Una esperanza suma valores ponderados; para un segundo momento se elevan los valores al cuadrado antes de ponderarlos.',
  continuous:'Una densidad es probabilidad por unidad, no probabilidad de un punto. Su integral suma pequeñas áreas de altura por anchura. El soporte fija los límites permitidos y la normalización exige área uno y altura no negativa.',
  binomial:'X cuenta éxitos en n ensayos independientes con probabilidad común p. Para k éxitos, cada secuencia tiene k factores p y n menos k factores uno menos p. El coeficiente binomial cuenta sus posiciones. Esto explica por qué multiplicamos posiciones por el peso de una secuencia.',
  poisson:'X cuenta eventos en una exposición fija y lambda es su recuento esperado en esa exposición, no una probabilidad. La masa de k combina e elevado a menos lambda, lambda a k y k factorial; el factorial corrige las permutaciones de los mismos eventos. La exponencial normaliza todas las masas.',
  normal:'Mu es la media y sigma la desviación típica, no la varianza. Restar mu centra la medida y dividir por sigma expresa la distancia en desviaciones. La normal estándar tiene media cero y desviación uno; su acumulada Phi permite comparar áreas sin cambiar su probabilidad.',
  uniform:'En el intervalo de soporte la densidad es constante: cada subintervalo de igual longitud tiene la misma probabilidad. Para que el área total sea uno, su altura es uno dividido por la longitud total. Fuera del soporte la densidad vale cero.',
  exponential:'La tasa lambda mide eventos por unidad de tiempo; su inversa es la espera media. La supervivencia es e elevado a menos tasa por tiempo. Su riesgo constante permite cancelar el tiempo ya esperado al condicionar en que todavía no ha ocurrido el evento.',
  geometric:'T cuenta ensayos hasta el primer éxito, incluido ese último ensayo: su soporte empieza en uno. Con probabilidad de éxito p constante e independencia, k ensayos significan k menos uno fracasos y un éxito final. F cuenta los fracasos desde cero y vale T menos uno.',
  hypergeometric:'Se extrae sin reemplazo de una población finita. N es el tamaño poblacional, K, también llamado M, el número de elementos de interés y n el tamaño de muestra. Las extracciones son dependientes, pero los subconjuntos de tamaño n son equiprobables. Las combinaciones cuentan esos subconjuntos sin distinguir su orden.',
  gamma:'La espera es una suma de etapas exponenciales independientes con escala común. La forma k cuenta las etapas de este ejemplo; la escala alfa es el inverso de la tasa. La media es forma por escala, y la acumulada integra la densidad, no su altura en el tiempo pedido.',
  'chi-square':'La muestra es normal e independiente. Al estimar su propia media se pierde un grado de libertad: quedan n menos uno. El pivote multiplica la varianza muestral por esos grados y divide por la varianza poblacional; así sigue una chi cuadrado conocida.',
  student:'La desviación poblacional no se conoce y se estima con S en una muestra normal independiente. Dividir S por raíz de n da el error estándar de la media. Al usar esa estimación, el pivote sigue Student con n menos uno grados, no una normal estándar exacta.',
  fisher:'Dos muestras normales independientes producen dos varianzas muestrales. El cociente de cada varianza por su varianza poblacional sigue Fisher. Los grados de libertad del numerador y denominador permanecen en ese orden; bajo igualdad de varianzas poblacionales se cancelan sus escalas.',
  joint:'Cada celda de la conjunta representa dos valores del mismo resultado. Sumar sobre la coordenada que descartamos produce una marginal. Si fijamos una coordenada, dividimos por su marginal positiva para normalizar la condicional. No suponemos independencia de las coordenadas.',
  covariance:'La covarianza es la esperanza del producto de las desviaciones respecto a las medias. Desarrollar ese producto da esperanza del producto menos producto de medias. La correlación divide por ambas desviaciones positivas y elimina las unidades; no demuestra causalidad.',
  independence:'Independencia exige factorizar toda la distribución conjunta en marginales. La covarianza solo mide asociación lineal: puede anularse por simetría aunque una variable determine a la otra. Una única celda incompatible con la factorización basta para demostrar dependencia.',
  transform:'Conservamos las probabilidades originales y transformamos cada valor antes de promediarlo. Para el cuadrado, la diferencia entre esperanza del cuadrado y cuadrado de la esperanza es la varianza, que no puede ser negativa. Por eso la convexidad no autoriza intercambiar esas operaciones.',
  sample:'Iid significa observaciones independientes con la misma distribución. La media es una suma con coeficientes uno entre n; las varianzas usan coeficientes al cuadrado. La dispersión de una muestra observada es otra pregunta: se centra en su propio promedio y se usa el divisor solicitado.',
  combinatorics:'Contar requiere decidir si el orden se distingue, si se permite repetir y si hay etiquetas idénticas. El producto cuenta decisiones sucesivas. Dividir por factoriales elimina solo reordenaciones que el experimento considera indistinguibles, no elecciones distintas.',
  'negative-binomial':'Aquí F cuenta fracasos antes del éxito número r, así que puede valer cero. Los ensayos son independientes con probabilidad de éxito p constante. El último ensayo es necesariamente un éxito; elegimos dónde colocar los otros r menos uno éxitos entre los ensayos anteriores.',
  cauchy:'La localización es el centro de simetría y la escala es positiva. La acumulada de Cauchy usa la arco tangente y permite calcular áreas y mediana. Sus colas no tienen esperanza ni varianza: el centro de simetría no puede llamarse media poblacional.',
  weibull:'La escala tiene unidades de tiempo y la forma es adimensional. La supervivencia es la exponencial negativa del tiempo relativo a la escala elevado a la forma. Para recuperar un cuantil deshacemos la exponencial con un logaritmo y luego la potencia con una raíz.',
  multinomial:'Cada ensayo independiente acaba en una sola de las categorías, cuyas probabilidades suman uno. Los recuentos comparten el total fijo y no son independientes entre sí. El factorial multinomial cuenta ordenaciones de esos recuentos y el producto de potencias da el peso de cada ordenación.',
  'bivariate-normal':'La normalidad conjunta, no solo la de las marginales, garantiza una normal condicional. Su media desplaza el centro de Y según la correlación y la razón de desviaciones. Su varianza es la marginal por uno menos rho al cuadrado; la raíz es su desviación residual.',
  'continuous-joint':'El soporte conjunto delimita qué parejas son posibles. Al fijar una coordenada, la frontera determina el intervalo de la otra. Integramos solo esos cortes. Una densidad condicional divide por una marginal positiva, nunca por la probabilidad nula de un punto continuo.',
  'exponential-family':'La muestra Poisson independiente da un producto de masas. Para tamaño fijo, toda la dependencia en lambda usa la suma de recuentos; los factoriales dependen solo de los datos. El logaritmo convierte el producto en suma y conserva dónde se alcanza el máximo.',
  proportions:'Una proporción divide la parte por el total al que pertenece. El porcentaje multiplica esa proporción por cien. Para cambiar unidades multiplicamos por una equivalencia que vale uno físicamente, conservando la cantidad medida.',
  normalization:'Los pesos describen importancia relativa, no probabilidades todavía. Multiplicar todos por la misma constante conserva sus razones. Despejamos esa constante haciendo la misma operación en ambos lados de la igualdad.',
  'function-values':'La función asigna una salida a cada entrada del dominio. Los paréntesis indican dónde sustituir la entrada. Multiplicamos antes de sumar y respetamos los extremos del dominio; sumar salidas es distinto de evaluar la suma de entradas.',
  'plane-regions':'Las coordenadas son cantidades para dos cultivos y no pueden ser negativas. La desigualdad de capacidad es compartida, de modo que la frontera es inclinada. Su área se expresa en unidades al cuadrado; sin densidad todavía no es una probabilidad.',
  'event-independence':'A y B pueden ocurrir juntos en un mismo resultado. Independencia significa que saber B no modifica la probabilidad de A. Con probabilidad de B positiva, esto equivale a que la intersección sea el producto de las probabilidades; no significa que sean incompatibles.',
  'cdf-table':'La tabla da masas en los únicos valores posibles. La acumulada F de t suma los valores menores o iguales que t y está definida aunque t no pueda observarse. Entre dos valores posibles no aparece masa nueva; en un valor con masa la acumulada da un salto.',
  'joint-basic':'Una fila fija X y una columna fija Y. La celda es la probabilidad de cumplir las dos condiciones a la vez. Para una región seleccionamos todas las celdas compatibles sin duplicarlas; las etiquetas de filas y columnas no son probabilidades.',
  'survival-triangle':'El tiempo se mide en años y el soporte inicial termina en dos años. La densidad decrece linealmente; su integral da una acumulada por tramos, cero antes del soporte y uno después. Este límite superior es una hipótesis del modelo, no una consecuencia biológica demostrada.',
  'survival-exponential':'La propuesta es e elevado a menos k por x, sin el factor k habitual delante. Su área es uno entre k cuando k es positivo: exigir área uno fija k en uno. No podemos elegir cualquier tasa sin cambiar también la normalización. El soporte no tiene un máximo finito.',
  'binomial-approximation':'Con total fijo, el modelo exacto es binomial. La Poisson con lambda igual a n por p conserva su media, pero permite recuentos mayores que n y no conserva exactamente su varianza. Por eso aquí la llamamos aproximación y medimos su error, sin convertirla en otra respuesta exacta.',
  'selection':'El experimento conserva las identidades de los dos descendientes y el mecanismo que produce el aviso. La independencia de genotipo y día da diez estados equiprobables por descendiente. Una selección previa añade otra coordenada al espacio de resultados; no equivale a preguntar si existe algún candidato.',
  'gaussian-difference':'Una transformación lineal conserva la normalidad conjunta. La esperanza de la diferencia resta medias, pero su varianza suma varianzas y resta dos veces la covarianza. Para independencia, anular covarianza basta únicamente gracias a la normalidad conjunta de las variables transformadas.',
  'normal-approximation':'El número de individuos de la categoría alta es binomial porque los individuos son independientes y comparten probabilidad. La normal aproximada usa media n por p y varianza n por p por uno menos p. Comprobamos suficientes éxitos y fracasos esperados y desplazamos medio entero el límite para representar la cola discreta.'
};

function family(exercise,question) {
  if(exercise.type!=='pdf')return exercise.type;
  const id=exercise.id;
  if(id==='capstone-pec1-1')return 'selection';
  if(id==='capstone-pec1-2')return question.id.startsWith('c') ? 'bayes' : 'poisson';
  if(id==='capstone-pec1-3')return question.id==='d' ? 'multinomial' : question.id==='e' ? 'normal-approximation' : /^(b|c|c-reason|c-covariance)$/.test(question.id) ? 'gaussian-difference' : 'bivariate-normal';
  const families={'pdf-u1-1':'events','pdf-u1-2':'events','pdf-u1-3':'bayes','pdf-u1-4':'bayes','pdf-u1-5':'bayes',
    'pdf-u2-2.1':'discrete','pdf-u2-2.2':'discrete','pdf-u2-2.4':'binomial','pdf-u2-2.5':'poisson','pdf-u2-2.6':'binomial-approximation',
    'pdf-u2-2.7':'normal','pdf-u2-2.8':question.id==='posterior' ? 'bayes':'normal','pdf-u2-2.9':'hypergeometric',
    'pdf-u3-1':'joint','pdf-u3-2':'joint','pdf-u3-3':'joint','pdf-u3-4':'continuous-joint','pdf-u3-5':'continuous-joint',
    'pdf-u3-6':'covariance','pdf-u3-7':'covariance','pdf-u3-8':'multinomial'};
  return id==='pdf-u2-2.3' ? (question.id.startsWith('f-') ? 'survival-exponential':'survival-triangle') : families[id];
}

const glossary=[
  [/\\(?:d?frac)\b/,'fracción','Una fracción divide el numerador entre el denominador. Los paréntesis conservan juntos los términos de cada parte.'],
  [/\\int\b/,'integral','El signo integral indica acumulación continua. La letra que acompaña a la d es la variable que recorremos; los límites recortan el área o el momento que buscamos.'],
  [/\\sum\b/,'sumatorio','El sumatorio abrevia sumar un término para cada índice entre los límites. El índice recorre valores; no se suma su etiqueta en lugar de la probabilidad.'],
  [/E\[/,'esperanza','E entre corchetes significa esperanza. Si dentro hay un producto o un cuadrado, se realiza esa operación en cada resultado antes de ponderar.'],
  [/\\Phi\b/,'Phi','Phi es la probabilidad acumulada a la izquierda en la normal estándar. Su inversa recibe una probabilidad y devuelve el umbral estandarizado.'],
  [/\\rho\b/,'rho','Rho es la correlación: covarianza dividida por el producto de desviaciones positivas. Está entre menos uno y uno.'],
  [/\\(?:mu|sigma)\b/,'mu y sigma','Mu nombra una media; sigma una desviación típica. Sigma al cuadrado es la varianza: al tipificar dividimos por sigma, no por su cuadrado.'],
  [/\\lambda\b/,'lambda','Lambda es el parámetro del modelo. En Poisson es el recuento esperado en la exposición fijada; en una exponencial parametrizada por tasa mide eventos por unidad de tiempo.'],
  [/\\binom\b/,'coeficiente binomial','El coeficiente binomial cuenta subconjuntos o posiciones sin orden. Se calcula con factoriales, no multiplicando los dos números que aparecen en él.']
];

function spokenText(value,math=false,kind='') {
  const letters={B:'be',C:'ce',D:'de',F:'efe',G:'ge',H:'hache',I:'i',J:'jota',K:'ka',L:'ele',M:'eme',N:'ene',P:'pe',Q:'cu',R:'erre',S:'ese',T:'te',U:'u',V:'uve',W:'uve doble',X:'equis',Y:'i griega',Z:'zeta'};
  const greek={α:'alfa',β:'beta',γ:'gamma',Γ:'gamma mayúscula',λ:'lambda',μ:'mu',ν:'nu',π:'pi',ρ:'rho',σ:'sigma',Φ:'Phi',χ:'ji',ω:'omega',Ω:'omega mayúscula',θ:'theta',η:'eta',ℓ:'ele minúscula'};
  let text=String(value ?? '').replace(/μg|µg/g,' microgramos ').replace(/H₀/gu,'hipótesis nula')
    .replace(/(\[[^\[\]]+\])²/g,'producto cartesiano de dos copias del $1')
    .replace(/\bintervalo\s*\(\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*[,;]\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*\)/gi,'intervalo abierto desde $1 hasta $2')
    .replace(/\[\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*[,;]\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*\]/gi,'intervalo cerrado desde $1 hasta $2')
    .replace(/\[\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*[,;]\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*\)/gi,'intervalo desde $1 incluido hasta $2 excluido')
    .replace(/\(\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*[,;]\s*([+-]?\d+(?:[.,]\d+)?|[a-z])\s*\]/gi,'intervalo desde $1 excluido hasta $2 incluido')
    .replace(/\bN\(([^,;()]+)[,;]([^()]*)\)/g,'normal de media ($1) y varianza ($2)')
    .replace(/\bBin(?:omial)?\(([^,;()]+)[,;]([^()]*)\)/g,'binomial con ($1) ensayos y probabilidad de éxito ($2)')
    .replace(/(\d+(?:[.,]\d+)?)[eE]([+-]?\d+)\b/g,'$1 por diez elevado a $2')
    .replace(/([a-zA-Z])([ᵢⱼ])/gu,(_,base,index)=>`${base}_{${index==='ᵢ' ? 'i' : 'j'}}`)
    .replace(/(σ)([XY])/g,'$1_{$2}')
    .replace(/(?<![\p{L}\p{N}])(?:np|kx|rt|ca|cx|xp|aX|bY|XY)(?!\p{L})/gu,product=>Array.from(product).join(' por '))
    .replace(/([α-ω])(?=[α-ωA-Za-z0-9([])/gu,'$1 por ')
    .replace(/(\d|[)\]])(?=\()|([)\]])(?=[PE])/g,'$1$2 por ')
    .replace(/!(?=[A-Za-z])/g,'! por ')
    .replace(/(?<![\p{L}\p{N}])([A-Za-zα-ω](?:_\{[^{}]*\}|_[A-Za-z])?)\s*-\s*(?=[\p{L}\p{N}(])/gu,'$1 menos ')
    .replace(/(?<=[\d)\]}])\s*-\s*(?=[\d\p{L}(])|(?<![\p{L}\p{N}])-(?=[\d\p{L}(])/gu,' menos ')
    .replace(/\bR²/gu,'plano de dos coordenadas reales').replace(/X̄/gu,'media muestral de X')
    .replace(/\biid\b/g,'independientes e idénticamente distribuidas')
    .replace(/\bVPP\b/g,'valor predictivo positivo').replace(/\bVPN\b/g,'valor predictivo negativo')
    .replace(/([a-z])∫₀ᵃ/g,'$1 por integral desde 0 hasta a de ')
    .replace(/∫₀ᵃ/g,'integral desde 0 hasta a de ')
    .replace(/([a-zA-Zα-ωΑ-Ω])([₀-₉]+)/gu,(_,base,index)=>`${base}_{${Array.from(index,digit=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(digit)).join('')}}`)
    .replace(/([XYxyp])([123])\b/g,'$1_{$2}')
    .replace(/([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/gu,exponent=>`^(${Array.from(exponent,digit=>digit==='⁻' ? '-' : '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(digit)).join('')})`)
    .replace(/Σ/g,'suma de ')
    .replace(/\b([CV])\(([^,()]+),([^()]+)\)/g,(_,operation,total,selected)=>operation==='C' ? `combinaciones de ${total} elementos tomados de ${selected} en ${selected}` : `variaciones de ${total} elementos tomados de ${selected} en ${selected}`)
    .replace(/\bP\(([ABC]{2,3})\)/g,(_,events)=>`P(${Array.from(events).join(' intersección ')})`)
    .replace(/\bP\(\s*([+-])\s*\)/g,(_,sign)=>`probabilidad de un resultado ${sign==='+' ? 'positivo' : 'negativo'}`)
    .replace(/\bP\(([+-])\s*\|/g,(_,sign)=>`P(resultado ${sign==='+' ? 'positivo' : 'negativo'} sabiendo que `)
    .replace(/(\bP\([^()]*(?:\||sabiendo que)\s*)([+-])(?=\s*\))/g,(_,prefix,sign)=>`${prefix}resultado ${sign==='+' ? 'positivo' : 'negativo'}`)
    .replace(/\b(E|P|Var|Cov)[([]([^()[\]]*)[)\]]/g,(_,operation,argument)=>`${{E:'esperanza de',P:'probabilidad de',Var:'varianza de',Cov:'covarianza de'}[operation]} ${argument.replace(/\bXY\b/g,'X por Y').replace(/,(?=\s*[A-Za-z])/g,' y ')}`)
    .replace(/\b(E|P|Var|Cov)(?=[([])/g,operation=>({E:'esperanza de',P:'probabilidad de',Var:'varianza de',Cov:'covarianza de'}[operation]))
    .replace(/\b(exp|log|ln|arctan|tan)(?=\()/g,operation=>({exp:'exponencial de',log:'logaritmo natural de',ln:'logaritmo natural de',arctan:'arco tangente de',tan:'tangente de'}[operation]))
    .replace(/\b([pfF])\(([^()]*)\)/g,(_,operation,argument)=>`${operation} (${argument.replace(/,/g,match=>math || operation==='p' || ['joint','joint-basic'].includes(kind) ? ' y ' : match)})`)
    .replace(/([a-zA-Zα-ωΑ-Ω])_\{([^{}]*)\}/gu,(_,base,index)=>`${base} subíndice ${/^[\p{L}\d]$/u.test(index) ? index : `(${index})`} `)
    .replace(/([a-zA-Zα-ωΑ-Ω])_([a-zA-Z0-9α-ωΑ-Ω]+)/gu,(_,base,index)=>`${base} subíndice ${index.length===1 ? index : `(${index})`} `)
    .replace(/\b([fFgSpLQ])(?=\s*\()/g,letter=>`${{f:'efe minúscula',F:'efe mayúscula',g:'ge',S:'supervivencia',p:'pe',L:'verosimilitud',Q:'cuantil'}[letter]} `)
    .replace(/\|([α-ωA-Za-z]+|[+-]?\d+(?:[.,]\d+)?)\|/gu,'valor absoluto de ($1)')
    .replace(/([A-C])ᶜ/gu,'complemento de $1')
    .replace(/([α-ωΑ-Ωℓ])/gu,symbol=>` ${greek[symbol] || symbol} `)
    .replace(/\b([a-zA-Z])\s*\^\s*\(2\)/g,'$1 al cuadrado ')
    .replace(/\b([a-zA-Z])\s*\^\s*\(3\)/g,'$1 al cubo ');
  if(!math)text=text.replace(/\b[1-9]\d{0,2}(?:\.\d{3})+\b/g,integer=>integer.replace(/\./g,''));
  text=text.replace(/\d+(?:,\d+){2,}/g,values=>values.replace(/,/g,', '))
    .replace(/\b[XYF]=0,1(?!\d)/g,match=>match.replace(',',' y '))
    .replace(/\b(\d+)\.\.(\d+)\b/g,'desde $1 hasta $2')
    .replace(/(\d)[.,](\d+)/g,(_,integer,fraction)=>`${integer} coma ${Array.from(fraction).join(' ')}`)
    .replace(/<=|≤/g,' menor o igual que ').replace(/>=|≥/g,' mayor o igual que ').replace(/\s!=\s|≠/g,' distinto de ')
    .replace(/\^\(?-1\)?(?=\s*\()/g,' inversa ')
    .replace(/\^2\b/g,' al cuadrado ').replace(/\^3\b/g,' al cubo ')
    .replace(/-(?=\d)/g,' menos ')
    .replace(/(?<!\p{L})y(?=\s*(?:[=<>+*/−-]|menor|mayor))|(?<=[,(])y(?!\p{L})/gu,'i griega minúscula')
    .replace(/([0-9])(?=[a-zA-Zα-ωΑ-Ω])/gu,'$1 por ')
    .replace(/\bd([xyut])\b/g,'respecto de $1')
    .replace(/(?<![\p{L}\p{N}])([b-df-hj-np-xzB-Z])(?![\p{L}\p{N}])/gu,letter=>`${letters[letter.toUpperCase()] || letter}${['x','t'].includes(letter) ? ' minúscula' : ['K','N'].includes(letter) ? ' mayúscula' : ''}`)
    .replace(/([=+*/<>^!%|∪∩∈×·−√∞∑∫])/gu,symbol=>` ${{'=':'igual a','+':'más','*':'por','/':'dividido entre','<':'menor que','>':'mayor que','^':'elevado a','!':'factorial','%':'por ciento','|':'sabiendo que','∪':'unión','∩':'intersección','∈':'pertenece a','×':'por','·':'por','−':'menos','√':'raíz cuadrada de','∞':'infinito','∑':'suma de','∫':'integral de'}[symbol]} `)
    .replace(/\(/g,' abre paréntesis, ').replace(/\)/g,', cierra paréntesis ')
    .replace(/\[/g,' abre corchete, ').replace(/\]/g,', cierra corchete ')
    .replace(/\{/g,' conjunto de ').replace(/\}/g,' fin del conjunto ')
    .replace(/\s+/g,' ').replace(/\s+([.;?])/g,'$1').trim();
  return text;
}

function expandFractions(tex) {
  const argument=(source,start)=>{
    let index=start;
    while(source[index]===' ')index++;
    if(source[index]!=='{')return source[index] ? {value:source[index],end:index+1} : null;
    const beginning=++index;
    let depth=1;
    while(index<source.length && depth) {
      if(source[index]==='{')depth++;
      if(source[index]==='}')depth--;
      index++;
    }
    return depth ? null : {value:source.slice(beginning,index-1),end:index};
  };
  return tex.split(/(?=\\(?:d?frac|binom)\b)/).reduceRight((tail,head)=>{
    const source=head+tail;
    const command=source.match(/^\\(d?frac|binom)\b/);
    if(!command)return source;
    const top=argument(source,command[0].length);
    const bottom=top && argument(source,top.end);
    if(!bottom)return source;
    const expression=command[1]==='binom' ? `combinaciones de (${top.value}) elementos tomados de (${bottom.value}) en (${bottom.value})` : `(${top.value}) dividido entre (${bottom.value})`;
    return expression+source.slice(bottom.end);
  },'');
}

function formulaReading(tex) {
  if(!tex || /\\begin|\\longmapsto|\\propto/.test(tex))return '';
  let text=expandFractions(tex.replace(/\{,\}/g,'.')).replace(/\\(?:operatorname|mathrm|mathcal|text|mathbf|boldsymbol)\{([^{}]*)\}/g,' $1 ')
    .replace(/\b([A-C])\^\{?c\}?/g,'complemento de $1')
    .replace(/\\(?:left|right|big|Big)\b/g,'').replace(/\\(?:quad|qquad|,|;|!| )/g,' ')
    .replace(/\\Phi\^\{-1\}/g,'Phi inversa ')
    .replace(/\\(int|sum|prod)_(\{[^{}]*\}|\\[a-zA-Z]+|[a-zA-Z0-9])\^(\{[^{}]*\}|\\[a-zA-Z]+|[a-zA-Z0-9])/g,(_,operation,lower,upper)=>`${{int:'integral',sum:'suma',prod:'producto'}[operation]} desde ${lower.replace(/[{}]/g,'')} hasta ${upper.replace(/[{}]/g,'')} de `)
    .replace(/\\(sum|prod)_(\{[^{}]*\}|[a-zA-Z0-9])/g,(_,operation,index)=>`${operation==='sum' ? 'suma' : 'producto'} para el índice (${index.replace(/[{}]/g,'')}) de `)
    .replace(/\[([^\[\]]+)\]_(\{[^{}]*\}|[a-zA-Z0-9])\^(\{[^{}]*\}|[a-zA-Z0-9])/g,(_,expression,lower,upper)=>`[${expression}] evaluado desde ${lower.replace(/[{}]/g,'')} hasta ${upper.replace(/[{}]/g,'')}`)
    .replace(/\^\{([^{}]*)\}/g,' elevado a ($1) ').replace(/_\{([^{}]*)\}/g,' subíndice ($1) ')
    .replace(/\\(?:d?frac)\s*([0-9a-zA-Z])\s*([0-9a-zA-Z])/g,'\\frac{$1}{$2}');
  for(let depth=0;depth<8;depth++) {
    const previous=text;
    text=text.replace(/\\sqrt\{([^{}]*)\}/g,' raíz de ($1) ')
      .replace(/\\(?:d?frac)\s*(?:\{([^{}]*)\}|([0-9a-zA-Z]))\s*(?:\{([^{}]*)\}|([0-9a-zA-Z]))/g,(_,top,shortTop,bottom,shortBottom)=>` (${top ?? shortTop}) dividido entre (${bottom ?? shortBottom}) `)
      .replace(/\\binom\s*(?:\{([^{}]*)\}|([0-9a-zA-Z]))\s*(?:\{([^{}]*)\}|([0-9a-zA-Z]))/g,(_,total,shortTotal,selected,shortSelected)=>` combinaciones de ${total ?? shortTotal} elementos tomados de ${selected ?? shortSelected} en ${selected ?? shortSelected} `);
    if(text===previous)break;
  }
  const words={Phi:'Phi',mu:'mu',sigma:'sigma',rho:'rho',lambda:'lambda',alpha:'alfa',beta:'beta',theta:'theta',nu:'nu',pi:'pi',gamma:'gamma',Gamma:'gamma',chi:'ji',infty:'infinito',
    ell:'ele minúscula',omega:'omega',Omega:'omega mayúscula',in:'pertenece a',iff:'equivale a',cdot:'por',times:'por',cap:'intersección',cup:'unión',mid:'sabiendo que',leq:'menor o igual que',le:'menor o igual que',geq:'mayor o igual que',ge:'mayor o igual que',
    ne:'distinto de',neq:'distinto de',approx:'aproximadamente',sim:'sigue la distribución',perp:'independiente de',Longrightarrow:'por tanto',Longleftrightarrow:'equivale a',
    exp:'exponencial',log:'logaritmo natural',ln:'logaritmo natural',arctan:'arco tangente',tan:'tangente',sum:'suma',int:'integral',prod:'producto',pm:'más o menos',ldots:'y así sucesivamente',max:'máximo',bar:'promedio de',hat:'estimador de',overline:'complemento de'};
  text=text.replace(/\\([A-Za-z]+)/g,(match,command)=>words[command] ? ` ${words[command]} ` : match);
  if(/\\|[{}].*\\/.test(text))return '';
  return spokenText(text.replace(/_/g,' subíndice ').replace(/[{}]/g,' ').replace(/,/g,' y '),true);
}

function assumptionReason(value,kind) {
  const reasons={
    sample:[[/^No hace falta normalidad/, 'La independencia y la varianza finita bastan para esa identidad; la forma de la distribución no entra en su demostración.']],
    combinatorics:[[/estos recuentos no presuponen equiprobabilidad/, 'Contar resultados no les asigna por sí solo el mismo peso; para pasar de estos recuentos a probabilidades haría falta especificar un mecanismo de selección.']],
    hypergeometric:[[/[Ss]in reemplazo|no hay reemplazo/, 'Cada extracción modifica la composición restante: contamos muestras equiprobables, no ensayos con probabilidad fija.']],
    bayes:[[/forman una partición|mutuamente excluyentes y exhaustivos/, 'Cada resultado tiene un único origen entre los considerados: las rutas se pueden sumar sin omisiones ni duplicados.']],
    'continuous-joint':[[/condición continua X=x/, 'Fijamos una sección del soporte y dividimos su densidad conjunta por la marginal positiva. Esto no exige independencia entre las coordenadas.']],
    'bivariate-normal':[[/^Se supone normalidad conjunta/, 'La normalidad conjunta permite obtener la ley condicional; dos marginales normales por sí solas no bastan.']]
  };
  return reasons[kind]?.find(([pattern])=>pattern.test(value))?.[1] || '';
}

function equalityReading(step,part,previous,first) {
  const extension=previous ? part.tex.slice(previous.tex.length).replace(/^\s*=\s*/,'') : part.tex;
  const reading=formulaReading(extension);
  if(!reading)return step.reading || '';
  if(!previous)return `${reading}.`;
  let depth=0;
  let end=first.tex.length;
  for(const [index,character] of Array.from(first.tex).entries()) {
    if('({['.includes(character))depth++;
    else if(')}]'.includes(character))depth--;
    else if(character==='=' && depth===0){end=index;break;}
  }
  const subject=formulaReading(first.tex.slice(0,end));
  return `${subject || step.title} queda igual a ${reading}.`;
}

export function exerciseNarration(exercise, question) {
  const frames=createTutorFrames(exercise,question);
  const kind=family(exercise,question);
  if(!theory[kind])throw new Error(`Falta teoría para ${exercise.id}/${question.id}.`);
  const {objective,why}=strategy(exercise,question);
  let context=frames[0].diagram;
  const beats=[{title:'Qué vamos a resolver',context,
    say:`Vamos a resolver este apartado juntos. ${question.prompt} ${objective}`,
    show:[{label:'Objetivo',value:question.prompt}]},
    {title:'Por qué sirve este método',context,say:theory[kind],show:[{label:'Modelo y significado',tex:({
      events:String.raw`P(A\cup B)=P(A)+P(B)-P(A\cap B)`,
      conditional:String.raw`P(A\mid B)=\frac{P(A\cap B)}{P(B)},\quad P(B)>0`,
      bayes:String.raw`P(H_i\mid D)=\frac{P(D\mid H_i)P(H_i)}{\sum_j P(D\mid H_j)P(H_j)}`,
      discrete:String.raw`\sum_x p(x)=1,\quad E[X]=\sum_x xp(x)`,
      continuous:String.raw`f(x)\ge0,\quad\int f(x)\,dx=1`,
      binomial:String.raw`P(X=k)=\binom nk p^k(1-p)^{n-k}`,
      poisson:String.raw`\lambda=r t,\quad P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!}`,
      normal:String.raw`Z=\frac{X-\mu}{\sigma}\sim N(0,1)`,
      uniform:String.raw`f(x)=\frac1{b-a},\quad a\le x\le b`,
      exponential:String.raw`S(t)=e^{-\lambda t},\quad E[T]=1/\lambda`,
      geometric:String.raw`P(T=k)=(1-p)^{k-1}p,\quad F=T-1`,
      hypergeometric:String.raw`P(X=k)=\frac{\binom Kk\binom{N-K}{n-k}}{\binom Nn}`,
      gamma:String.raw`T=\sum_{i=1}^k T_i,\quad E[T]=k\alpha`,
      'chi-square':String.raw`\frac{(n-1)S^2}{\sigma^2}\sim\chi^2_{n-1}`,
      student:String.raw`\frac{\bar X-\mu}{S/\sqrt n}\sim t_{n-1}`,
      fisher:String.raw`\frac{S_1^2/\sigma_1^2}{S_2^2/\sigma_2^2}\sim F_{n_1-1,n_2-1}`,
      joint:String.raw`p_X(x)=\sum_y p(x,y),\quad p(y\mid x)=\frac{p(x,y)}{p_X(x)}`,
      covariance:String.raw`\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]`,
      independence:String.raw`X\perp Y\iff p(x,y)=p_X(x)p_Y(y)`,
      transform:String.raw`E[g(X)]=\sum_x g(x)p(x)`,
      sample:String.raw`\operatorname{Var}(\bar X)=\sigma^2/n`,
      combinatorics:String.raw`V(n,r)=\frac{n!}{(n-r)!},\quad C(n,r)=\frac{n!}{r!(n-r)!}`,
      'negative-binomial':String.raw`P(F=k)=\binom{k+r-1}{r-1}(1-p)^k p^r`,
      cauchy:String.raw`F(x)=\frac12+\frac1\pi\arctan\frac{x-x_0}{\gamma}`,
      weibull:String.raw`S(t)=e^{-(t/\alpha)^k}`,
      multinomial:String.raw`P(\mathbf X=\mathbf x)=\frac{n!}{\prod_i x_i!}\prod_i p_i^{x_i},\quad\sum_i x_i=n`,
      'bivariate-normal':String.raw`\mu_{Y\mid x}=\mu_Y+\rho\frac{\sigma_Y}{\sigma_X}(x-\mu_X),\quad\sigma^2_{Y\mid x}=\sigma_Y^2(1-\rho^2)`,
      'continuous-joint':String.raw`f_{Y\mid X}(y\mid x)=\frac{f_{X,Y}(x,y)}{f_X(x)},\quad f_X(x)>0`,
      'exponential-family':String.raw`L(\lambda)=\frac{e^{-n\lambda}\lambda^{\sum_i x_i}}{\prod_i x_i!}`,
      proportions:String.raw`p=\frac{\text{parte}}{\text{total}},\quad\%=100p`,
      normalization:String.raw`c\sum_i w_i=1`,
      'function-values':String.raw`x\longmapsto g(x),\quad\sum_i g(x_i)`,
      'plane-regions':String.raw`x\ge0,\quad y\ge0,\quad x+y\le L`,
      'event-independence':String.raw`A\perp B\iff P(A\cap B)=P(A)P(B)`,
      'cdf-table':String.raw`F(t)=\sum_{x\le t}p(x)`,
      'joint-basic':String.raw`P((X,Y)\in R)=\sum_{(x,y)\in R}p(x,y)`,
      'survival-triangle':String.raw`F(t)=\int_0^t f(x)\,dx,\quad0\le t\le2`,
      'survival-exponential':String.raw`\int_0^\infty e^{-kx}\,dx=1/k,\quad k>0`,
      'binomial-approximation':String.raw`\operatorname{Bin}(n,p)\approx\operatorname{Pois}(np)`,
      selection:String.raw`P(B\mid A)=\frac{P(B\cap A)}{P(A)}`,
      'gaussian-difference':String.raw`\operatorname{Var}(Y-X)=\sigma_Y^2+\sigma_X^2-2\operatorname{Cov}(X,Y)`,
      'normal-approximation':String.raw`X\approx N(np,np(1-p)),\quad P(X\ge k)\approx P(Y>k-0.5)`
    })[kind]}]}];
  for(const value of exercise.given)beats.push({title:'Datos del enunciado',context,say:value,show:[{label:'Dato original',value},{label:'Datos del diagrama',value:context?.caption || context?.label || exercise.title}]});
  for(const value of exercise.assumptions) {
    const reason=assumptionReason(value,kind);
    beats.push({title:'Condiciones del razonamiento',context,say:`${value} ${reason}`.trim(),show:[{label:'Condición original',value}]});
  }
  beats.push({title:'Elegir el camino',context,say:`${question.hint} ${why}`,show:[{label:'Apartado',value:question.prompt},{label:'Pista original',value:question.hint}]});
  const introduced=new Set();
  let frameIndex=1;
  for(const step of question.steps) {
    const parts=stageEquations(step);
    for(const [pattern,label,meaning] of glossary)if(step.tex && pattern.test(step.tex) && !introduced.has(label)) {
      introduced.add(label);
      const poissonParameter=kind==='poisson' || kind==='exponential-family' || exercise.id==='capstone-pec1-2';
      const contextualMeaning=label==='lambda' ? (poissonParameter ? 'En este modelo Poisson, lambda es el recuento esperado por unidad de exposición del enunciado, no una probabilidad ni la inversa de una escala temporal.' : 'En esta espera exponencial, lambda es la tasa por unidad de tiempo; su inversa es la escala o espera media.') : label==='mu y sigma' && kind==='student' ? 'Mu es la media poblacional. Sigma es la desviación poblacional desconocida; la estimamos con la desviación muestral para formar el pivote de Student.' : meaning;
      beats.push({title:`Significado: ${label}`,context,say:contextualMeaning,show:[{label,tex:({
        'fracción':String.raw`\frac{a}{b}=a/b,\quad b\ne0`,
        integral:String.raw`\int_a^b f(x)\,dx`,
        sumatorio:String.raw`\sum_{i=1}^n a_i=a_1+\cdots+a_n`,
        esperanza:String.raw`E[g(X)]=\sum_x g(x)p(x)`,
        Phi:String.raw`\Phi(z)=P(Z\le z),\quad z=\Phi^{-1}(p)`,
        rho:String.raw`\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y},\quad-1\le\rho\le1`,
        'mu y sigma':String.raw`\mu=E[X],\quad\sigma=\sqrt{\operatorname{Var}(X)}`,
        lambda:poissonParameter ? String.raw`\lambda=\text{tasa}\cdot\text{exposición}` : String.raw`\lambda=1/\text{escala}`,
        'coeficiente binomial':String.raw`\binom nr=\frac{n!}{r!(n-r)!}`
      })[label]}]});
    }
    for(const [index,part] of parts.entries()) {
      context=(question.tutorSteps ? frames[frameIndex++]?.diagram : part.diagram || (part.tex ? frames.find(frame=>frame.tex===part.tex)?.diagram : null)) || context;
      const calculation=equalityReading(step,part,parts[index-1],parts[0]);
      const say=index===0 ? `${step.title}. ${step.reason || ''} ${step.explanation} ${calculation}` : step.narration?.[index] || calculation;
      if(!say?.trim())throw new Error(`Falta lectura del cálculo ${exercise.id}/${question.id}/${step.title}/${index}.`);
      const show=part.tex ? [{label:part.title,tex:part.tex}] : (part.explanation.match(/[−-]?(?:\d|\()[\d\s.,()+−\-×·*/^²³√!]*=\s*[−-]?(?:\d|\()[\d\s.,()+−\-×·*/^²³√!=]*/gu) || [])
          .map(value=>value.trim().replace(/[.,]+$/,''))
          .filter(value=>Array.from(value).filter(character=>character==='(').length===Array.from(value).filter(character=>character===')').length)
          .map(value=>({label:part.title,value}));
      if(index===0)show.push({label:'Razonamiento original',value:step.explanation});
      beats.push({title:step.title,context,say:say.replace(/\s+/g,' ').trim(),show});
    }
  }
  const qualitative=question.grading?.kind==='qualitative' || !Number.isFinite(question.answer);
  const result=qualitative ? question.answerText || question.interpretation : `${number(question.answer)} ${question.unit}`;
  beats.push({title:'Resultado e interpretación',context:frames.at(-1).diagram,
    say:`${qualitative ? 'La respuesta razonada es' : 'El resultado es'} ${result}. ${question.interpretation || ''}`,
    show:[{label:'Resultado',...(question.answerTex ? {tex:question.answerTex} : {value:result})},
        {label:'Unidad',value:question.unit || (qualitative ? 'Conclusión cualitativa' : 'Sin unidades')},
          {label:'Interpretación',value:question.interpretation || ''},
          ...(qualitative ? [{label:'Respuesta razonada',value:result}] : [])]});
        return beats.map(beat=>({...beat,say:spokenText(beat.say,false,kind)}));
}