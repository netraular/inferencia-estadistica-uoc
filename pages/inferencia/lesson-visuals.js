const clone = value => structuredClone(value);
const bars = (label, labels, values, highlight = []) => ({kind:'bars', label, caption:label, labels, values, highlight});
const stage = (quote, context) => ({quote, context});
const matrix = (label, values, highlight = [], rows = ['X = 0','X = 1'], columns = ['Y = 0','Y = 1']) => ({kind:'matrix', label, caption:label, rows, columns, values, highlight});
const trials = (label, outcomes, selected = [], groups = []) => ({kind:'trials', label, caption:label, outcomes, selected, groups});
const tree = (label, nodes) => ({kind:'tree', label, caption:label, nodes:nodes.map(node => typeof node === 'string' ? {label:node} : node)});
const branch = (label, children, weight) => ({label, ...(weight === undefined ? {} : {weight}), children:children.map(child => typeof child === 'string' ? {label:child} : child)});
const numberLine = (label, min, max, intervals = [], points = []) => ({kind:'number-line', label, caption:label, min, max, intervals, points});
const interval = (from, to, label, closed = [true,true]) => ({from, to, label, closed});
const scatter = (label, points, extra = {}) => ({kind:'scatter', label, caption:label, points, xLabel:'X', yLabel:'Y', ...extra});
const normal = (label, mean, sd, extra = {}) => ({kind:'normal', label, caption:label, mean, sd, ...extra});
const jointNormal = (label, extra = {}) => ({kind:'joint-normal', label, caption:label, meanX:30, meanY:70, sdX:5, sdY:8, rho:0.25, ...extra});
const curvePoints = (from, to, evaluate) => Array.from({length:81}, (_, index) => {
  const position = from + (to - from) * index / 80;
  return [position,evaluate(position)];
});
const curve = (label, points, measure, extra = {}) => ({kind:'curve', label, caption:label, points, measure, xLabel:'x', yLabel:measure, ...extra});
const density = (label, points, extra = {}) => curve(label, points, 'density', extra);
const triangle = (label, limit = 1, cut, polygons) => ({kind:'region', label, caption:label, points:[[0,0],[limit,0],[0,limit]], xLabel:'Recurso X', yLabel:'Recurso Y', ...(cut === undefined ? {} : {cut:[[cut,0],[cut,limit-cut]]}), ...(polygons ? {polygons} : {})});
const membership = (label, highlight = []) => matrix(label, [[0,0],[1,0],[0,1],[1,1]], highlight, ['Ninguna','Primera','Segunda','Ambas'], ['Germina 1','Germina 2']);
const jointTable = (highlight = []) => matrix('Masas conjuntas de los marcadores', [[0.35,0.15],[0.25,0.25]], highlight);
const brood = (highlight = []) => bars('Brotes posibles; las alturas son masas', ['0','2','5'], [0.1,0.6,0.3], highlight);
const mass = (highlight = []) => bars('Brotes: soporte separado', ['0','2','4'], [0.2,0.6,0.2], highlight);
const diagnostic = (highlight = []) => matrix('Plantas: origen y signo de la prueba', [[80,20],[90,810]], highlight, ['Infectadas','No infectadas'], ['Positivo','Negativo']);
const tubePairs = (ordered, repeat = false) => matrix(ordered ? 'Posiciones: izquierda y derecha' : 'Una celda por pareja sin orden', Array.from({length:5}, (_, row) => Array.from({length:5}, (_, column) => Number(repeat || (ordered ? row !== column : row < column)))), [], ['A','B','C','D','E'], ['A','B','C','D','E']);
const survival = (scale, extra = {}) => curve(`Supervivencia; escala ${scale}`, curvePoints(0,4*scale,time=>Math.exp(-time/scale)), 'survival', {xLabel:'Tiempo', yLabel:'S(t)', ...extra});
const gammaDensity = (shape, scale, extra = {}) => {
  let factorial = 1;
  for (let factor = 2; factor < shape; factor++) factorial *= factor;
  return density(`Gamma: forma ${shape}; escala ${scale}`, curvePoints(0,shape*scale*3,time=>time**(shape-1)*Math.exp(-time/scale)/(factorial*scale**shape)), {xLabel:'Tiempo (min)', yLabel:'Densidad (1/min)', ...extra});
};
const poissonMass = (rate, highlight = []) => {
  const values = [Math.exp(-rate)];
  for (let count = 1; count <= Math.ceil(rate+8*Math.sqrt(rate)); count++) values.push(values.at(-1)*rate/count);
  const tail = Math.max(0,1-values.reduce((total,value)=>total+value,0));
  return {...bars(`Poisson; media de ventana ${rate}; cola restante indicada`, values.map((_,index)=>String(index)), values, highlight), tail, measure:'mass'};
};
const binomialMass = (size, probability, highlight = []) => {
  const values = Array.from({length:size+1}, (_, count) => {
    let coefficient = 1;
    for (let factor = 1; factor <= count; factor++) coefficient *= (size-factor+1)/factor;
    return coefficient*probability**count*(1-probability)**(size-count);
  });
  return {...bars(`Germinaciones; n = ${size}, p = ${probability}`, values.map((_,index)=>String(index)), values, highlight), measure:'mass'};
};
const powerCurve = (label, power, extra = {}) => curve(label, curvePoints(0,1,value=>value**power), 'function', extra);
const covarianceMatrix = (highlight = []) => matrix('Varianzas y covarianzas; no masas', [[9,6],[6,16]], highlight, ['Medida X','Medida Y'], ['Medida X','Medida Y']);

const SECTION_VISUALS = {
  'proporciones/parte-y-total':[
    stage("Comparemos dos bandejas: en una germinan dieciocho semillas y en otra treinta.", bars('Semillas germinadas; faltan los totales', ['Bandeja 1','Bandeja 2'], [18,30], [0,1])),
    stage("En la primera sembramos setenta y dos.", {...bars('Primera bandeja: germinadas y restantes', ['Germinadas','Restantes'], [18,54], [0]), total:72}),
    stage("Llamemos pe a la proporción observada: dividir dieciocho entre setenta y dos expresa qué fracción del total germinó.", {...bars('Parte y total pertenecen a la misma bandeja', ['Germinadas','Restantes'], [18,54], [0,1]), total:72}),
    stage("Setenta y dos contiene cuatro grupos de dieciocho, de modo que el cociente es un cuarto, o cero coma veinticinco.", bars('Un cuarto del mismo total', ['Germina','No germina'], [0.25,0.75], [0])),
    stage("La segunda tenía doscientas semillas.", bars('Segunda bandeja: germinadas y restantes', ['Germinadas','Restantes'], [30,170], [0]))
  ],
  'proporciones/porcentaje-y-exposicion':[
    stage("Un cuarto de nuestras semillas germinó.", bars('Misma bandeja antes de cambiar la escala', ['Germinan','Resto'], [18,54], [0])),
    stage("Veinticinco por ciento sigue representando las dieciocho de setenta y dos.", bars('Misma proporción en escala de cien', ['Germinan','Resto'], [25,75], [0])),
    stage("Cambiemos de pregunta: un sensor ve seis llegadas en tres horas.", trials('Exposición: seis llegadas observadas en tres horas', ['Llegada','Llegada','Llegada','Llegada','Llegada','Llegada'], [0,1,2,3,4,5], [{label:'Ventana de 3 h',indices:[0,1,2,3,4,5]}])),
    stage("Si el denominador fuese volumen, hablaríamos de concentración.", tree('Cantidad y exposición no son probabilidades', [branch('Colonias por mililitro',['Colonias contadas','Volumen muestreado'])])),
    stage("Para reunir dos bandejas sumamos germinadas y sembradas antes de dividir.", bars('Sumar partes y totales antes de dividir', ['18 de 72','30 de 200'], [18/72,30/200], [0,1]))
  ],
  'proporciones/unidades-y-cotas':[
    stage("Tenemos tres miligramos de una sustancia y el aparato pide microgramos.", numberLine('Una misma masa, dos graduaciones', 0,3,[interval(0,3,'3 mg = 3000 microgramos')])),
    stage("En cada miligramo caben mil microgramos.", tree('Cada miligramo se subdivide sin añadir masa',[branch('1 mg',['1000 microgramos']),branch('3 mg',['3000 microgramos'])])),
    stage("Podemos detectar errores antes de repetir toda la cuenta: ¿la unidad responde a la pregunta?, ¿el valor cabe en su rango?", numberLine('Cota de una probabilidad',0,1,[interval(0,1,'Probabilidad admisible')]))
  ],
  'algebra/balanza':[
    stage("Tenemos tres estados con pesos dos, tres y cinco: el último pesa más, pero estos números aún no son probabilidades.", bars('Pesos relativos, no probabilidades', ['Estado 1','Estado 2','Estado 3'], [2,3,5], [0,1,2])),
    stage("Dos más tres más cinco suman diez; ese es el peso que debemos convertir en una unidad de probabilidad.", bars('Los tres pesos comparten un factor', ['Estado 1','Estado 2','Estado 3'], [2,3,5], [0,1,2])),
    stage("Para dejar ce sola dividimos ambos lados por diez y queda una décima.", bars('Mismas razones, ahora total uno', ['Estado 1','Estado 2','Estado 3'], [0.2,0.3,0.5], [0,1,2]))
  ],
  'algebra/comprobar-el-factor':[
    stage("Comprobemos el factor una décima en el estado de peso cinco: su probabilidad, pe sub tres, es cinco por una décima.", bars('Peso cinco del último estado', ['Estado 1','Estado 2','Estado 3'], [2,3,5], [2])),
    stage("Cinco de diez es una mitad: ese estado recibe la mitad de la probabilidad total.", bars('Proporciones normalizadas', ['Estado 1','Estado 2','Estado 3'], [0.2,0.3,0.5], [2])),
    stage("Dos décimas más tres décimas más cinco décimas completan uno; la comprobación satisface justo la condición que originó nuestra ecuación.", bars('Los estados completan el total', ['Estado 1','Estado 2','Estado 3'], [0.2,0.3,0.5], [0,1,2])),
    stage("Tres al cuadrado significa multiplicar tres por sí mismo y da nueve, no sumar tres dos veces.", numberLine('Cuadrado y raíz no negativa',0,9,[interval(0,3,'Raíz no negativa'),interval(0,9,'Cuadrado')],[3,9]))
  ],
  'algebra/deshacer-exponencial':[
    stage("Buscamos el tiempo te para que una proporción exponencial de escala seis horas baje a la mitad: la igualdad que debemos resolver es exponencial de menos te entre seis igual a una mitad.", survival(6)),
    stage("El logaritmo natural de ambos lados deja menos te entre seis igual al logaritmo de una mitad", survival(6,{level:0.5})),
    stage("Multiplicar ambos lados por menos seis deja te igual a menos seis por logaritmo de una mitad.", survival(6,{level:0.5,marker:6*Math.log(2)})),
    stage("Al sustituirlo, el exponente queda aproximadamente menos cero coma seiscientos noventa y tres, cuya exponencial es una mitad.", survival(6,{level:0.5,marker:6*Math.log(2)}))
  ],
  'funciones/entrada-y-salida':[
    stage("Una señal sigue esta regla: duplicar la entrada y añadir una unidad de base.", tree('La entrada recorre dos operaciones',[branch('Entrada x',[branch('Multiplicar por 2',['Sumar 1'])])])),
    stage("Duplicar tres da seis: sustituimos la entrada en la primera parte de la regla.", trials('Entrada 3: primero duplicar',['3','2 por 3','Sumar 1'],[1])),
    stage("A esos seis añadimos la unidad de base y sale siete.", trials('Entrada 3: ahora sumar la base',['3','6','7'],[2])),
    stage("En la gráfica la entrada tres se empareja con la salida siete, que llamamos ge de tres.", scatter('Regla g(x) = 2x + 1',[[0,1],[1,3],[2,5],[3,7]],{line:{slope:2,intercept:1},highlight:[3],xLabel:'Entrada x',yLabel:'Salida g(x)'}))
  ],
  'funciones/sumar-salidas':[
    stage("Apliquemos duplicar y añadir uno a las entradas cero, uno y dos: las salidas son uno, tres y cinco.", bars('Entradas etiquetadas, alturas de las salidas',['g(0)','g(1)','g(2)'],[1,3,5],[0,1,2])),
    stage("La sigma grande abrevia añadir a sub uno, a sub dos y a sub tres; el índice i indica qué término visitamos, desde uno hasta tres.", bars('El índice recorre términos, no los sustituye',['a1 = 1','a2 = 3','a3 = 5'],[1,3,5],[0,1,2])),
    stage("Una tabla con valores cero, dos y cinco puede etiquetarlos como primera, segunda y tercera fila.", numberLine('Etiquetas del soporte, no índices de fila',0,5,[],[0,2,5])),
    stage("Para sumar solo algunos términos necesitamos una condición de selección.", numberLine('Un extremo abierto excluye; uno cerrado incluye',0,5,[interval(0,2,'(0, 2]',[false,true])],[0,2,5]))
  ],
  'funciones/seleccionar-valores':[
    stage("Una planta tiene cero, dos o cinco brotes, con probabilidades una décima, seis décimas y tres décimas.", brood()),
    stage("Si piden menos de tres", brood([0,1])),
    stage("Menos de dos deja solo cero, cuya masa es una décima.", brood([0])),
    stage("Como máximo dos sí acepta el propio dos", brood([0,1])),
    stage("Antes de calcular conviene decir en voz alta qué filas entran", brood([1,2]))
  ],
  'calculo/franjas':[
    stage("Esta densidad vale medio por minuto entre cero y dos minutos: su área total es uno.", density('Densidad uniforme; soporte 0 a 2',[[0,0.5],[2,0.5]],{support:[0,2]})),
    stage("Busquemos la probabilidad entre cero coma cuatro y uno coma dos", density('Franja solicitada, sin resolver el área',[[0,0.5],[2,0.5]],{shade:[0.4,1.2],support:[0,2]})),
    stage("Primero restamos uno coma dos menos cero coma cuatro y obtenemos cero coma ocho minutos de anchura.", numberLine('Anchura entre los dos límites',0,2,[interval(0.4,1.2,'Intervalo solicitado')],[0.4,1.2])),
    stage("Ahora multiplicamos altura medio por anchura cero coma ocho y sale cero coma cuatro.", density('Altura por anchura de la franja',[[0,0.5],[2,0.5]],{shade:[0.4,1.2],support:[0,2]}))
  ],
  'calculo/primitiva':[
    stage("Ahora la densidad es te entre dos, de cero a dos, y buscamos el área hasta un minuto.", density('f(t) = t/2; franjas cada vez más altas',[[0,0],[2,1]],{shade:[0,1],support:[0,2]})),
    stage("Ge de te igual a te al cuadrado entre cuatro es una primitiva: su derivada es dos te entre cuatro, justamente te entre dos.", curve('Primitiva G(t) = t al cuadrado / 4',curvePoints(0,2,time=>time*time/4),'cdf',{marker:1})),
    stage("En el límite inferior cero, la primitiva da cero.", curve('Evaluar también el extremo inferior',curvePoints(0,2,time=>time*time/4),'cdf',{marker:0})),
    stage("Un cuarto menos cero deja un cuarto de probabilidad entre cero y uno.", density('Área entre ambos extremos',[[0,0],[2,1]],{shade:[0,1],support:[0,2]}))
  ],
  'calculo/pendiente-acumulada':[
    stage("Distingamos dos preguntas: ¿cuánta área llevamos hasta te?, y ¿a qué ritmo aumenta esa área aquí?", density('Altura local anterior: t/2',[[0,0],[2,1]],{marker:1,support:[0,2]})),
    stage("La curva acumulada te al cuadrado entre cuatro reúne el área de la densidad te entre dos dentro de cero a dos.", curve('Acumulada: t al cuadrado / 4',curvePoints(0,2,time=>time*time/4),'cdf',{marker:1})),
    stage("Derivar la acumulada da te entre dos en el interior del soporte: recuperamos la altura que determina cuánto aporta una franja pequeña.", density('Derivada: altura local de la densidad',[[0,0],[2,1]],{marker:1,support:[0,2]})),
    stage("Un instante solo tiene anchura cero, por lo que su área es cero aunque la altura sea positiva.", numberLine('Un instante no es una franja',0,2,[interval(1,1,'Anchura cero')],[1]))
  ],
  'regiones-matrices/frontera':[
    stage("Repartamos una unidad de recurso entre dos cultivos: equis mide lo asignado al primero e i griega al segundo.", triangle('Capacidad compartida: x + y no supera 1')),
    stage("Ocho décimas más ocho décimas excede la unidad, así que esa pareja queda fuera.", {...triangle('El reparto (0,8; 0,8) no es admisible'),markers:[[0.8,0.8]]}),
    stage("Si el primer cultivo recibe tres décimas, uno menos tres décimas deja siete décimas disponibles.", triangle('Fijar X deja un corte vertical',1,0.3)),
    stage("El corte en equis tres décimas permite desde cero hasta siete décimas para i griega.", triangle('Y recorre de 0 a 0,7',1,0.3))
  ],
  'regiones-matrices/recorrer-triangulo':[
    stage("El triángulo de capacidad uno tiene base uno y altura uno; la mitad de su producto da área una mitad.", triangle('Triángulo, no el cuadrado completo')),
    stage("La integral interior recorre i griega desde cero hasta uno menos equis, manteniendo equis fija.", triangle('Primero recorrer Y dentro de un corte',1,0.3)),
    stage("La integral exterior mueve equis de cero a uno y suma las aportaciones de todos los cortes.", {...triangle('Después reunir todos los cortes'),sweep:[0,1]}),
    stage("Para una densidad constante ce, altura por área debe ser uno; por eso ce es uno dividido entre una mitad.", {...triangle('Altura por área completa volumen uno'),density:2})
  ],
  'regiones-matrices/orden-de-matriz':[
    stage("El vector mu guarda las medias de dos biomarcadores en orden: mu uno para el primero y mu dos para el segundo.", tree('Un vector conserva el orden',[branch('Muestra',['Biomarcador 1: mu1','Biomarcador 2: mu2'])])),
    stage("La matriz sigma coloca las varianzas cuatro y nueve en la diagonal, y la covarianza uno en las dos posiciones cruzadas.", matrix('Diagonal: varianzas',[[4,1],[1,9]],[[0,0],[1,1]])),
    stage("En fila uno, columna dos, el uno resume cómo varían juntas las medidas primera y segunda.", matrix('Entradas cruzadas: covarianzas',[[4,1],[1,9]],[[0,1],[1,0]])),
    stage("La primera fila multiplicada por la columna dos, tres da cuatro por dos más uno por tres: ocho más tres, once.", matrix('Combinar la primera fila con (2, 3)',[[4,1],[1,9]],[[0,0],[0,1]]))
  ],
  'sucesos/resultados-y-sucesos':[
    stage("Vamos a observar dos semillas, conservando cuál es la primera y cuál la segunda.", membership('Dos semillas distintas: pertenencia, no equiprobabilidad')),
    stage("Llamemos a al suceso germina la primera.", membership('A selecciona primera y ambas',[[1,0],[3,0]])),
    stage("Exactamente una selecciona solo primera y solo segunda.", membership('Exactamente una no es el mismo conjunto A',[[1,0],[2,1]]))
  ],
  'sucesos/traducir-conjuntos':[
    stage("Clasifiquemos cien células: treinta tienen solo el marcador a, veinte solo be, diez ambos y cuarenta ninguno.", bars('Cuatro regiones disjuntas de las células',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40])),
    stage("La intersección se lee a y be: exige los dos marcadores en la misma célula.", bars('Intersección: conservar ambas',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[2])),
    stage("La unión se lee a o be, con una o inclusiva: también acepta ambas condiciones juntas.", bars('Unión: incluir también las dobles',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0,1,2])),
    stage("Solo a exige estar en a y fuera de be.", bars('Solo A excluye las dobles',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0])),
    stage("Ninguno exige no a y no be a la vez.", bars('De Morgan: ninguno de los dos',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[3]))
  ],
  'sucesos/observabilidad':[
    stage("Veamos qué significa que una pregunta sea observable dentro del modelo.", tree('Resultados y preguntas observables',[branch('Omega',[branch('Suceso A',['Resultados en A']),branch('Complemento de A',['Resultados fuera de A'])])])),
    stage("Además, reunir una lista numerable de sucesos admitidos debe producir otro suceso admitido.", tree('Cierre bajo unión numerable',[branch('Unión observable',['A1','A2','A3','...'])])),
    stage("También podemos formar intersecciones: negar la unión de los complementos equivale a exigir todos los sucesos, por De Morgan.", tree('Intersección mediante complementos',[branch('Complemento de la unión',['Complemento de A','Complemento de B'])])),
    stage("El espacio de probabilidad reúne tres piezas.", tree('Espacio de probabilidad',[branch('(Omega, A, P)',['Resultados','Sucesos observables','Medida de probabilidad'])]))
  ],
  'axiomas/probabilidades-coherentes':[
    stage("Un cultivo puede estar en uno de tres estados excluyentes.", trials('El cultivo ocupa un solo estado',['Estado 1','Estado 2','Estado 3'])),
    stage("La primera regla es no asignar probabilidades negativas.", numberLine('Toda probabilidad está entre cero y uno',0,1,[interval(0,1,'Escala de probabilidad')])),
    stage("Si dos estados distintos pesan dos décimas y tres décimas, reunirlos da cinco décimas.", bars('Estados excluyentes: reunir sin duplicar',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1])),
    stage("Si tres sucesos se solapan, usamos inclusión y exclusión: sumamos individuales, restamos intersecciones por parejas y añadimos la triple.", tree('Inclusión y exclusión, sin áreas proporcionales',[branch('Unión de A, B y C',['Sumar A, B y C','Restar AB, AC y BC','Reponer ABC'])]))
  ],
  'axiomas/solapamiento':[
    stage("Un marcador a aparece con probabilidad cuarenta y cinco centésimas, be con treinta centésimas y ambos con quince centésimas.", bars('Regiones disjuntas implícitas en A, B y ambos',['Solo A','Solo B','Ambos','Ninguno'],[0.3,0.15,0.15,0.4],[0,1,2])),
    stage("Restamos las quince centésimas de la intersección para quitar una copia de las dobles.", bars('Retirar una copia de la intersección',['Solo A','Solo B','Ambos','Ninguno'],[0.3,0.15,0.15,0.4],[2])),
    stage("Ninguno es el complemento de al menos uno.", bars('Lo que queda fuera de la unión',['Solo A','Solo B','Ambos','Ninguno'],[0.3,0.15,0.15,0.4],[3]))
  ],
  'axiomas/deducir-propiedades':[
    stage("Deduciremos vacío, complemento e inclusión con una misma idea: separar un conjunto en piezas disjuntas y sumar sus pesos no negativos.", tree('Un total repartido sin solapamientos',[branch('Omega',['A','Complemento de A'])])),
    stage("Unir omega con vacío deja exactamente omega, y ambos son disjuntos.", tree('El vacío no añade resultados',[branch('Omega',['Todos los resultados']),branch('Vacío',[])])),
    stage("Si a está contenido en be, podemos reconstruir be con todo a y la parte de be que queda fuera de a.", tree('B contiene A y el resto disjunto',[branch('B',['A','B fuera de A'])])),
    stage("La pieza adicional no puede tener peso negativo, así que pe de a nunca supera pe de be.", tree('La inclusión impide que A pese más que B',[branch('B',['A','Resto de masa no negativa'])]))
  ],
  'axiomas/frecuencia':[
    stage("Hemos observado seis positivos en diez ensayos: la frecuencia es seis entre diez, seis décimas.", bars('Muestra observada, no secuencia inventada',['Positivas','Restantes'],[6,4],[0])),
    stage("Pe con sombrero nombra la frecuencia calculada con ene ensayos.", trials('Codificación de cada observación',['No ocurre A: 0','Ocurre A: 1'],[1])),
    stage("Una racha no crea una deuda de resultados.", tree('Ensayo independiente: no existe compensación',[branch('Próximo ensayo',['Ocurre A','No ocurre A'])])),
    stage("Otra vía, dividir casos favorables entre posibles, requiere un espacio finito con resultados elementales equiprobables.", trials('Nombres de estados no fijan sus pesos',['Estado 1','Estado 2','Estado 3']))
  ],
  'combinatoria/posiciones':[
    stage("Tenemos cinco tubos distintos para ocupar izquierda y derecha en un ensayo.", tubePairs(true)),
    stage("Si el procedimiento permite repetir la identidad del tubo, elegir la primera ya no elimina una opción de la segunda.", tubePairs(true,true)),
    stage("Para ordenar todos los elementos distintos sin repetir usamos el factorial: opciones descendentes hasta agotar los disponibles.", trials('Cinco posiciones, etiquetas diferentes',['A','B','C','D','E'],[0,1,2,3,4]))
  ],
  'combinatoria/quitar-orden':[
    stage("Elegimos dos de los cinco tubos distintos para analizarlos juntos, sin asignar posiciones.", tubePairs(false)),
    stage("La cuenta ordenada daba veinte.", tubePairs(true)),
    stage("Cada grupo de dos tubos distintos aparece dos veces", tubePairs(false)),
    stage("Orden y reemplazo son decisiones diferentes.", tree('Sin devolución disminuyen las opciones',[branch('Primer tubo: 5 opciones',['Segundo tubo: 4 opciones'])]))
  ],
  'combinatoria/multiplicidades':[
    stage("Coloquemos tres etiquetas a y dos be en cinco posiciones.", trials('Etiquetas iguales no crean nuevas secuencias',['A','A','A','B','B'],[],[{label:'A indistinguibles',indices:[0,1,2]},{label:'B indistinguibles',indices:[3,4]}])),
    stage("Dentro de una misma secuencia visible podemos permutar las tres a de seis maneras y las dos be de dos maneras sin cambiar lo que vemos.", trials('Reordenar dentro de una especie conserva el resultado',['A','A','A','B','B'],[0,1,2])),
    stage("Dividimos ciento veinte entre doce y quedan diez secuencias visibles.", trials('Diez secuencias diferentes de las mismas etiquetas',['AAABB','AABAB','AABBA','ABAAB','ABABA','ABBAA','BAAAB','BAABA','BABAA','BBAAA'],[0,1,2,3,4,5,6,7,8,9]))
  ],
  'condicionada/grupo-conocido':[
    stage("De doscientas muestras, ochenta pasan un filtro; veinticuatro de esas ochenta tienen marcador.", bars('El filtro divide la población',['Pasan','No pasan'],[80,120],[0])),
    stage("Las veinticuatro que cumplen ambas condiciones están dentro de las ochenta filtradas.", bars('Solo el grupo conocido: 80 muestras',['Marcador','Sin marcador'],[24,56],[0,1])),
    stage("Dividimos veinticuatro entre ochenta y obtenemos tres décimas: tres de cada diez filtradas tienen marcador en este reparto.", bars('Numerador dentro del nuevo universo',['Marcador','Sin marcador'],[24,56],[0]))
  ],
  'condicionada/invertir-grupo':[
    stage("Ahora sabemos que una muestra tiene marcador y preguntamos si pasó el filtro.", tree('La intersección se conserva; el grupo de referencia cambia',[branch('Marcador',['Supera filtro: 24','Resto de marcadores: desconocido'])])),
    stage("En las doscientas muestras hay sesenta con marcador.", bars('Ahora el universo son los 60 marcadores',['Pasan filtro','No pasan'],[24,36],[0])),
    stage("Si no conocemos ninguna condición y preguntamos por cumplir las dos en toda la población, volvemos al denominador doscientas.", bars('Conjunta: volver al total de 200',['Ambos','Resto de la población'],[24,176],[0]))
  ],
  'condicionada/ruta-condicionada':[
    stage("Sigamos una muestra que debe pasar un filtro, conservar viabilidad y expresar una señal.", tree('Cada etapa conserva las condiciones anteriores',[branch('Filtro',[branch('Viabilidad',['Señal'])])])),
    stage("Cuatro décimas pasan el filtro.", tree('Probabilidades condicionadas a lo ya recorrido',[branch('Filtro',[branch('Viabilidad',['Señal todavía no ponderada'],0.5)],0.4)])),
    stage("Entre quienes pasaron el filtro y conservaron viabilidad, tres cuartos expresan señal.", tree('La señal usa toda la información previa',[branch('Filtro',[branch('Viabilidad',[{label:'Señal',weight:0.75}],0.5)],0.4)]))
  ],
  'independencia-sucesos/producto':[
    stage("Dos controles, a y be, fallan con probabilidades dos décimas y tres décimas.", tree('Fallos de dos controles; se permite coincidencia',[branch('Control A',['Falla','No falla']),branch('Control B',['Falla','No falla'])])),
    stage("Si fueran independientes, dentro de los fallos de a seguiría fallando be con probabilidad tres décimas.", matrix('Modelo independiente: cuatro masas',[[0.56,0.24],[0.14,0.06]],[[1,1]],['No A','A'],['No B','B'])),
    stage("Incompatibilidad significa intersección vacía: ambos no pueden ocurrir juntos.", matrix('Incompatibles con las mismas marginales',[[0.5,0.3],[0.2,0]],[[1,1]],['No A','A'],['No B','B']))
  ],
  'independencia-sucesos/comprobar-informacion':[
    stage("Comprobemos independencia con datos del modelo: a pesa dos décimas, be tres décimas y el fallo conjunto una décima.", matrix('Modelo dependiente; conservar marginales',[[0.6,0.2],[0.1,0.1]],[[1,1]],['No A','A'],['No B','B'])),
    stage("Dentro del grupo be, los resultados que también cumplen a pesan una décima del total original.", bars('Dentro de B; masas sin normalizar',['A y B','No A y B'],[0.1,0.2],[0])),
    stage("Una décima entre tres décimas da un tercio, mayor que las dos décimas de a antes de conocer be.", bars('Comparar P(A) con P(A dado B)',['Antes','Dado B'],[0.2,1/3],[0,1]))
  ],
  'independencia-sucesos/independencia-mutua':[
    stage("Con tres sucesos, comprobar todas las parejas puede no bastar.", matrix('Pertenencia de cada resultado a A, B y C',[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],[],['00','01','10','11'],['Primero 1','Segundo 1','Difieren'])),
    stage("Cada suceso acepta dos de los cuatro resultados y pesa una mitad.", matrix('A y B coinciden solo en 11',[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],[[3,0],[3,1]],['00','01','10','11'],['A','B','C'])),
    stage("Pero ocurrir a y be obliga a que ambos bits sean uno.", matrix('En 11, C es falso: no existe la triple',[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],[[3,2]],['00','01','10','11'],['A','B','C']))
  ],
  'bayes-diagnostico/rutas-positivas':[
    stage("Una prueba tiene sensibilidad ocho décimas, positivos entre infectadas, y especificidad nueve décimas, negativos entre no infectadas.", tree('Las dos probabilidades usan grupos distintos',[branch('Infectadas',[{label:'Positivo',weight:0.8}]),branch('No infectadas',[{label:'Negativo',weight:0.9}])])),
    stage("Imaginemos mil plantas: cien infectadas y novecientas sin infección, una prevalencia de una décima.", bars('Partición previa de las mil plantas',['Infectadas','No infectadas'],[100,900],[0,1])),
    stage("Dentro de las cien infectadas, la sensibilidad ocho décimas indica qué parte da positivo.", bars('Positivos dentro de las cien infectadas',['Positivas','Grupo infectado'],[80,100],[0])),
    stage("Entre las no infectadas conocemos la probabilidad de negativo, nueve décimas.", bars('Dentro de no infectadas: especificidad y complemento',['Negativo','Positivo falso'],[0.9,0.1],[1])),
    stage("Aplicamos esa décima de falsos positivos a las novecientas no infectadas.", bars('Positivos de los dos orígenes, sin sumar aún',['Infectadas +','No infectadas +'],[80,90],[1])),
    stage("Sumamos ochenta verdaderos y noventa falsos: ciento setenta positivos esperados de mil, una probabilidad total de diecisiete centésimas.", bars('Reunir los dos orígenes de positivos',['Infectadas +','No infectadas +'],[80,90],[0,1]))
  ],
  'bayes-diagnostico/posterior':[
    stage("Ahora sabemos que el resultado fue positivo.", bars('Universo positivo: orígenes distintos',['Infectadas +','No infectadas +'],[80,90],[0,1])),
    stage("El valor predictivo positivo, abreviado uve pe pe, divide ochenta entre ciento setenta: aproximadamente cero coma cuatrocientos setenta y uno, cerca del cuarenta y siete coma uno por ciento.", bars('Numerador infectado dentro del grupo positivo',['Infectadas +','No infectadas +'],[80,90],[0])),
    stage("La previa es el peso del grupo antes de conocer el resultado.", tree('Direcciones de la información',[branch('Grupo previo',['Prueba dentro del grupo']),branch('Prueba observada',['Grupo dentro de positivos'])]))
  ],
  'bayes-diagnostico/negativos-y-prevalencia':[
    stage("Repitamos la inversión con un resultado negativo.", diagnostic([[0,1],[1,1]])),
    stage("El valor predictivo negativo, uve pe ene, pregunta por no infección dado negativo.", bars('Solo negativos: denominador 830',['No infectadas -','Infectadas -'],[810,20],[0])),
    stage("Cambiemos solo la prevalencia, del diez al uno por ciento.", bars('Nueva población: prevalencia 1 %',['Verdaderos +','Falsos +'],[8,99],[0,1])),
    stage("El nuevo total positivo es ocho más noventa y nueve, ciento siete; ocho entre ciento siete da cerca del siete coma cinco por ciento de infección entre positivas.", bars('Positivos de la nueva población',['Verdaderos +','Falsos +'],[8,99],[0]))
  ],
  'variable-cdf/regla-observable':[
    stage("Queremos describir un campo contando sus larvas, en lugar de guardar todos sus detalles.", tree('Contar agrupa resultados sin asignar pesos',[branch('Identidades observadas',['Recuento de larvas X'])])),
    stage("Dos campos distintos pueden contener dos larvas: sus resultados originales son diferentes, pero la regla les asigna el mismo número.", tree('Distintos resultados pueden compartir recuento',[branch('Dos larvas, identidades distintas',['X = 2']),branch('Otras dos larvas',['X = 2'])])),
    stage("Para calcular la probabilidad de no superar un umbral, reunimos los resultados omega cuyo recuento no lo supera.", tree('El umbral define un suceso observable',[branch('Resultados de Omega',['X no supera x','X supera x'])]))
  ],
  'variable-cdf/escalones':[
    stage("Construyamos una acumulada con este modelo: cero, una y dos larvas tienen probabilidades dos décimas, cinco décimas y tres décimas.", bars('Masas de las larvas',['0','1','2'],[0.2,0.5,0.3])),
    stage("Efe mayúscula sub equis, evaluada en un umbral, significa probabilidad de que equis sea menor o igual que él.", bars('Acumular hasta uno, incluido',['0','1','2'],[0.2,0.5,0.3],[0,1])),
    stage("En la gráfica el eje horizontal contiene umbrales, no solo realizaciones posibles.", curve('CDF constante entre saltos',[[-0.5,0],[0,0],[0,0.2],[1,0.2],[1,0.7],[2,0.7],[2,1],[2.5,1]],'cdf',{marker:1.5})),
    stage("Al llegar a dos añadimos sus tres décimas y alcanzamos uno: ya aceptamos todos los valores posibles.", bars('El último valor completa la masa',['0','1','2'],[0.2,0.5,0.3],[2]))
  ],
  'variable-cdf/intervalos-y-saltos':[
    stage("Usemos la acumulada de larvas para calcular un intervalo: mayor que cero y como máximo dos.", bars('Excluir cero; incluir uno y dos',['0','1','2'],[0.2,0.5,0.3],[1,2])),
    stage("Para aislar la masa en uno restamos dos acumulaciones casi iguales: la que ya incluye uno y la que se acerca a uno desde abajo.", bars('El salto en uno es su propia masa',['0','1','2'],[0.2,0.5,0.3],[1])),
    stage("La acumulada sirve para cualquier variable real.", tree('No confundir categorías de distribuciones',[branch('Acumulada continua',['Absolutamente continua: integra densidad','Continua singular: no se desarrolla aquí'])]))
  ],
  'masa/agrupar-y-normalizar':[
    stage("Un modelo permite cero, dos o cuatro brotes y les asigna pesos uno, tres y uno.", bars('Pesos sobre brotes, no probabilidades',['0','2','4'],[1,3,1])),
    stage("Al multiplicar cada peso por un quinto obtenemos dos décimas, seis décimas y dos décimas.", mass([0,1,2])),
    stage("Pe sub equis de dos significa probabilidad de exactamente dos brotes: aquí seis décimas.", mass([1]))
  ],
  'masa/intervalos-discretos':[
    stage("Volvamos a cero, dos y cuatro brotes, con masas dos, seis y dos décimas.", mass()),
    stage("Al menos dos acepta el propio dos y también cuatro.", mass([1,2])),
    stage("Más de dos excluye la frontera dos y solo conserva cuatro, cuya probabilidad es dos décimas.", mass([2])),
    stage("Uno y tres son números que podemos escribir como umbrales, pero no son realizaciones de este modelo y tienen masa cero.", numberLine('No llenar los huecos del soporte',0,4,[],[0,2,4]))
  ],
  'masa/interruptores':[
    stage("Traduzcamos tener el marcador a a un número que pueda promediarse.", matrix('Indicadores para los cuatro estados',[[0,0],[1,0],[0,1],[1,1]],[],['Ninguno','Solo A','Solo B','Ambos'],['IA','IB'])),
    stage("Para registrar ambos marcadores multiplicamos i sub a por i sub be.", matrix('Producto: solo ambos activan el indicador',[[0],[0],[0],[1]],[[3,0]],['Ninguno','Solo A','Solo B','Ambos'],['IA por IB'])),
    stage("Restamos el producto porque solo se activa cuando están ambos.", matrix('Unión: ambos siguen contando una vez',[[0],[1],[1],[1]],[[1,0],[2,0],[3,0]],['Ninguno','Solo A','Solo B','Ambos'],['Indicador de unión']))
  ],
  'densidad/altura-y-area':[
    stage("Una reacción dura entre cero y medio minuto.", density('Altura 2; soporte de anchura 0,5',[[0,2],[0.5,2]],{support:[0,0.5]})),
    stage("Entre una décima y tres décimas de minuto, restar los extremos da dos décimas de anchura.", density('El área pertenece al intervalo',[[0,2],[0.5,2]],{shade:[0.1,0.3],support:[0,0.5]})),
    stage("En cambio, un instante exacto tiene anchura cero y aporta área cero.", density('Punto: altura sin área',[[0,2],[0.5,2]],{marker:0.2,support:[0,0.5]}))
  ],
  'densidad/densidad-creciente':[
    stage("Consideremos una fracción equis con densidad ce por equis entre cero y uno, y cero fuera.", tree('Triángulo de altura aún desconocida',[branch('Soporte de 0 a 1',['f(0) = 0','f(1) = c','Área total requerida: 1'])])),
    stage("Multiplicamos ambos lados por dos para dejar ce sola y obtenemos dos.", density('Modelo normalizado f(x) = 2x',[[0,0],[1,2]],{support:[0,1]})),
    stage("La zona sombreada va de medio a uno.", density('Mitad derecha del soporte',[[0,0],[1,2]],{shade:[0.5,1],support:[0,1]})),
    stage("Para conocer el área hasta medio usamos la primitiva equis al cuadrado, cuya derivada es dos por equis.", density('Área a la izquierda de medio',[[0,0],[1,2]],{shade:[0,0.5],support:[0,1]}))
  ],
  'densidad/acumulada-por-tramos':[
    stage("Ya sabemos acumular la densidad dos por equis dentro de cero a uno.", numberLine('Tres regiones del umbral',-0.25,1.25,[interval(-0.25,0,'Antes del soporte'),interval(0,1,'Dentro'),interval(1,1.25,'Después')])),
    stage("Antes de cero no entra área y efe vale cero.", curve('CDF completa, sin extrapolar el cuadrado',[[-0.25,0],...curvePoints(0,1,value=>value*value),[1.25,1]],'cdf',{support:[0,1]})),
    stage("En el interior, derivar el cuadrado devuelve dos por equis: la pendiente de lo acumulado recupera la densidad que aporta cada franja.", density('Pendiente de la CDF: 2x dentro del soporte',[[0,0],[1,2]],{support:[0,1]}))
  ],
  'esperanza/promedio-ponderado':[
    stage("Un campo tiene cero o cuatro células activadas, cada posibilidad con una mitad de probabilidad.", bars('Resultados del modelo, no su centro',['0','4'],[0.5,0.5])),
    stage("La esperanza es un promedio ponderado: cada valor aporta su tamaño multiplicado por la probabilidad con que aparece.", bars('Ponderar el resultado cero',['0','4'],[0.5,0.5],[0])),
    stage("El valor cuatro también tiene peso una mitad.", bars('Ponderar el resultado cuatro',['0','4'],[0.5,0.5],[1])),
    stage("Reunimos las aportaciones cero y dos y obtenemos esperanza dos.", numberLine('El centro no tiene por qué ser un resultado',0,4,[interval(0,4,'Soporte separado: solo extremos')],[0,2,4]))
  ],
  'esperanza/transformar-valores':[
    stage("El recuento equis vale cero o cuatro con probabilidades iguales, pero ahora la señal depende de su cuadrado.", tree('Transformar los valores manteniendo sus masas',[branch('0; masa 1/2',['0 al cuadrado: 0']),branch('4; masa 1/2',['4 al cuadrado: 16'])])),
    stage("La realización que producía cuatro ahora produce dieciséis, pero sigue teniendo probabilidad una mitad.", bars('Mismas masas, nuevas etiquetas',['0','16'],[0.5,0.5],[1])),
    stage("Al sumar ambas aportaciones obtenemos esperanza del cuadrado ocho.", numberLine('Dos operaciones con centros diferentes',0,16,[interval(0,4,'Cuadrado de la media'),interval(0,8,'Media del cuadrado')],[4,8]))
  ],
  'esperanza/linealidad-y-colas':[
    stage("Cada célula aporta tres unidades de señal y el aparato añade una unidad fija.", tree('Señal: escalar y desplazar',[branch('X: 0 o 4',[branch('Multiplicar por 3',['Añadir base 1'])])])),
    stage("La unidad fija aparece en todas las realizaciones, así que también añade uno al promedio, no una fracción de uno.", bars('Señales posibles; mismas probabilidades',['1','13'],[0.5,0.5],[0,1])),
    stage("Para un producto la regla cambia: la esperanza de equis por i griega depende de cómo coincidan sus valores.", tree('La operación necesita sus condiciones',[branch('Suma de esperanzas',['Linealidad']),branch('Producto de esperanzas',['Independencia e integrabilidad'])]))
  ],
  'varianza/distancias':[
    stage("Saber que la media es uno no dice cuánto se separan las observaciones de ese centro.", tree('Mismo centro no significa mismas distancias',[branch('Media 1',['Resultados a la izquierda','Resultados a la derecha'])])),
    stage("Equis toma cero, uno y dos con masas un cuarto, una mitad y un cuarto; su media es uno.", bars('Modelo con media 1',['0','1','2'],[0.25,0.5,0.25])),
    stage("Restamos esa media a cada valor", bars('Desviaciones con signo; no son masas',['X=0','X=1','X=2'],[-1,0,1],[0,2])),
    stage("Elevamos las desviaciones al cuadrado: menos uno y uno pasan ambos a uno, mientras cero sigue en cero.", bars('Distancias cuadradas al centro',['X=0','X=1','X=2'],[1,0,1],[0,2])),
    stage("Ahora ponderamos: el primer cuadrado uno aparece con un cuarto de probabilidad, cero con una mitad y el último uno con otro cuarto.", bars('Aportaciones a la varianza',['X=0','X=1','X=2'],[0.25,0,0.25],[0,2]))
  ],
  'varianza/segundo-momento':[
    stage("Calculemos la misma dispersión de cero, uno y dos por otro camino.", bars('Mismo modelo: masas sobre 0, 1 y 2',['0','1','2'],[0.25,0.5,0.25])),
    stage("Los cuadrados originales son cero, uno y cuatro.", bars('Cuadrados antes de ponderar',['0 al cuadrado','1 al cuadrado','2 al cuadrado'],[0,1,4],[0,1,2])),
    stage("Restamos uno a uno coma cinco y queda una mitad, igual que con las distancias centradas.", bars('Momentos que se restan, no probabilidades',['E[X al cuadrado]','Cuadrado de E[X]'],[1.5,1],[0,1]))
  ],
  'varianza/estirar-y-desplazar':[
    stage("Una longitud tiene media dos milímetros y desviación típica tres décimas de milímetro.", numberLine('Centro 2 mm y una desviación a cada lado',1.4,2.6,[interval(1.7,2.3,'Una desviación: 0,3 mm')],[2])),
    stage("Un milímetro contiene mil micrómetros, así que cada lectura y cada distancia se multiplican por mil.", numberLine('Mismo tramo en micrómetros',1400,2600,[interval(1700,2300,'Una desviación: 300 micrómetros')],[2000])),
    stage("En general, a estira las lecturas y be las desplaza.", tree('Efectos sobre las distancias',[branch('Desplazar',['Centro cambia','Distancias no cambian']),branch('Escalar por a',['Distancias por |a|','Cuadrados por a al cuadrado'])]))
  ],
  'momentos-transformaciones/ordinarios-y-centrales':[
    stage("Un momento es el promedio de una potencia de la variable.", tree('Potencias de valores o de desviaciones',[branch('Valor X',['Potencia ordinaria']),branch('X menos su media',['Potencia central'])])),
    stage("Con cero y dos equiprobables la media es uno.", bars('Dos resultados, masas iguales',['0','2'],[0.5,0.5],[0,1])),
    stage("Por eso el segundo ordinario y el segundo central son diferentes.", bars('Resúmenes diferentes de los mismos datos',['Ordinario segundo','Central segundo'],[2,1],[0,1]))
  ],
  'momentos-transformaciones/ejemplo-area':[
    stage("Una longitud equis es uniforme entre cero y uno y su media es una mitad.", density('Longitud uniforme; altura 1',[[0,1],[1,1]],{support:[0,1]})),
    stage("La densidad de la longitud vale uno en ese soporte.", curve('Integrando para E[X al cuadrado]',curvePoints(0,1,value=>value*value),'moment-integrand',{shade:[0,1]})),
    stage("Si en cambio usamos solo la longitud media, una mitad, su cuadrado es un cuarto.", numberLine('Media del cuadrado frente al cuadrado de la media',0,0.5,[],[0.25,1/3]))
  ],
  'momentos-transformaciones/estandarizacion-y-existencia':[
    stage("Comparemos formas sin que medir en milímetros o micrómetros cambie el resumen.", tree('Centrar y dividir por una escala compatible',[branch('Desviación a la media',[branch('Potencia k',['Dividir por sigma a la k'])])])),
    stage("Tomemos cero y cuatro equiprobables: su media es dos y las desviaciones son menos dos y dos.", bars('Dos valores equiprobables',['0','4'],[0.5,0.5],[0,1])),
    stage("Ambos cuadrados valen cuatro", bars('Desviaciones al centro 2',['X=0','X=4'],[-2,2],[0,1])),
    stage("Para el tercer momento central promediamos los cubos de las desviaciones, no de los valores originales.", bars('Cubos de las desviaciones; signos opuestos',['(-2) al cubo','2 al cubo'],[-8,8],[0,1])),
    stage("Dividimos ese tercer momento cero entre sigma al cubo, dos al cubo, para eliminar las unidades cúbicas.", bars('Desviaciones estandarizadas por sigma 2',['Izquierda','Derecha'],[-1,1],[0,1])),
    stage("Para el cuarto momento central usamos las cuartas potencias de las mismas desviaciones.", bars('Cuartas potencias, ahora ambas positivas',['(-2) a la cuarta','2 a la cuarta'],[16,16],[0,1])),
    stage("Ahora dividimos ese cuarto momento dieciséis entre sigma a la cuarta, dos a la cuarta.", bars('Cuartas potencias divididas por sigma a la cuarta',['Izquierda','Derecha'],[1,1],[0,1])),
    stage("Si todas las lecturas valen dos, no hay separación del centro: varianza y sigma son cero.", numberLine('Sin dispersión no se puede estandarizar',1,3,[],[2]))
  ],
  'momentos-transformaciones/cambio-de-distribucion':[
    stage("Esta es una ampliación opcional: en vez de calcular solo un promedio, obtendremos la distribución del cuadrado de una longitud uniforme entre cero y uno.", powerCurve('Transformación Y = X al cuadrado',2,{xLabel:'Longitud X',yLabel:'Área Y'})),
    stage("Para un umbral i griega entre cero y uno preguntamos qué longitudes producen cuadrados que no lo superen.", powerCurve('Preimagen: el umbral de Y vuelve por la raíz',0.5,{xLabel:'Umbral y',yLabel:'Umbral de X'})),
    stage("La acumulada uniforme en cero a uno devuelve el propio umbral de longitud; aquí ese umbral es la raíz de i griega.", curve('CDF del cuadrado de la uniforme',curvePoints(0,1,value=>Math.sqrt(value)),'cdf')),
    stage("Habría que reunir las aportaciones de ambas ramas que pertenezcan al soporte original.", tree('Reunir todas las preimágenes',[branch('Salida positiva y',['Rama negativa de X','Rama positiva de X'])]))
  ],
  'bernoulli-binomial/ensayos':[
    stage("Vamos a distinguir ese resultado individual del recuento de un lote de tres.", trials('Tres ensayos con identidad',['Semilla 1','Semilla 2','Semilla 3'])),
    stage("El indicador registra qué ocurrió en una semilla", trials('Indicador de germinación',['No germina: 0','Germina: 1'])),
    stage("Tomemos pe una mitad y pidamos exactamente dos germinaciones.", trials('Patrones de exactamente dos germinaciones',['110','101','011'],[0,1,2])),
    stage("La independencia permite multiplicar tres probabilidades de una mitad, por eso cada patrón pesa un octavo.", binomialMass(3,0.5,[2]))
  ],
  'bernoulli-binomial/masa-y-cola':[
    stage("Hola, la combinación ene sobre ka cuenta qué ka posiciones del lote serán germinaciones, sin ordenar otra vez las semillas elegidas.", tree('Masa binomial: posiciones y peso de cada patrón',[branch('Patrones con k éxitos',['Elegir sus posiciones','Ponderar éxitos y fracasos'])])),
    stage("Una cola reúne varios recuentos, no solo una masa.", tree('Las desigualdades seleccionan masas',[branch('Como máximo k',['0 hasta k, incluido']),branch('Al menos k',['k hasta n, incluido'])])),
    stage("Con tres semillas y pe una mitad, al menos una es lo contrario de ninguna.", binomialMass(3,0.5,[1,2,3]))
  ],
  'bernoulli-binomial/momentos-y-diseno':[
    stage("Hola, la esperanza de germinaciones del lote es ene por pe porque sumamos ene indicadores, cada uno de media pe.", tree('Sumar indicadores, no prometer un resultado',[branch('Lote',['Indicador 1','Indicador 2','Indicador 3'])])),
    stage("Con tres semillas y pe una mitad, la esperanza es una coma cinco germinaciones por lote.", binomialMass(3,0.5)),
    stage("En nuestro ejemplo la varianza es tres por una mitad por una mitad: tres cuartos, en unidades de recuento al cuadrado.", tree('Una fuente común no son tres réplicas',[branch('Maceta compartida',['Semilla 1','Semilla 2','Semilla 3'])]))
  ],
  'poisson/exposicion':[
    stage("Hola, un sensor registra por término medio una coma cinco apariciones por hora y lo observaremos dos horas: tasa y duración definen nuestra exposición.", numberLine('Tasa 1,5 por hora; ventana observada 2 h',0,2,[interval(0,2,'Exposición, no recuento realizado')])),
    stage("Lambda vale tres.", poissonMass(3)),
    stage("Si duplicamos la duración con tasa estable, duplicamos lambda porque añadimos la misma exposición.", tree('La ventana escala la media bajo tasa estable',[branch('Tasa estable',['Media = tasa por duración'])]))
  ],
  'poisson/masa-y-complemento':[
    stage("Con lambda tres, ¿qué probabilidad hay de no observar ninguna aparición?", poissonMass(3,[0])),
    stage("Para un entero ka no negativo, la masa es lambda a la ka dividida entre ka factorial, multiplicada por la exponencial de menos lambda.", poissonMass(3)),
    stage("Más de dos pide los recuentos tres, cuatro y siguientes.", {...poissonMass(3),highlight:Array.from({length:poissonMass(3).values.length-3},(_,index)=>index+3)}),
    stage("Es más cómodo reunir los que no sirven", poissonMass(3,[0,1,2]))
  ],
  'poisson/aproximar-y-sumar':[
    stage("Tenemos cien ensayos independientes con la misma probabilidad de evento, una centésima.", tree('Dos modelos de una misma pregunta',[branch('Exacto',['Binomial n = 100, p = 0,01']),branch('Aproximado',['Poisson lambda = 1'])])),
    stage("En la binomial, ningún evento exige que fallen los cien ensayos.", bars('Probabilidad exacta de ningún evento',['Binomial: cero'],[0.99**100],[0])),
    stage("En la Poisson de media uno, la masa en cero se reduce a exponencial de menos uno.", bars('No confundir cercanía con igualdad',['Binomial: cero','Poisson: cero'],[0.99**100,Math.exp(-1)],[1])),
    stage("Hay además una propiedad exacta distinta: si equis e i griega son Poisson independientes, su suma es Poisson.", tree('Sumar solo con independencia',[branch('Suma de recuentos',['Lambda X','Lambda Y','Lambda total = suma'])]))
  ],
  'hipergeometrica/sin-reemplazo':[
    stage("Hola, elegimos tres semillas sin reemplazo de un lote de doce, con cuatro de la variedad de interés y ocho restantes: esos son los tamaños del diseño.", bars('Existencias antes de extraer sin devolución',['Variedad','Restantes'],[4,8])),
    stage("Para obtener exactamente una semilla de interés, primero elegimos cuál de las cuatro será.", tree('Selección de tres, no secuencia ordenada',[branch('Muestra de tamaño 3',['Elegir 1 de 4 de la variedad','Elegir 2 de 8 restantes'])])),
    stage("Todavía tenemos un número de muestras, no una probabilidad: falta compararlo con todas las muestras equiprobables.", bars('Después de retirar una de la variedad',['Variedad','Restantes'],[3,8],[0]))
  ],
  'hipergeometrica/masa-finita':[
    stage("Hola, la combinación doce sobre tres cuenta todos los grupos de tres semillas del lote, sin distinguir órdenes, y da doscientas veinte muestras posibles.", tree('Partición de todas las muestras equiprobables',[branch('Elegir 3 de 12',['Muestras con exactamente 1 de la variedad','Las demás muestras'])])),
    stage("Como las doscientas veinte muestras tienen el mismo peso, las ciento doce favorables representan ciento doce dividido entre doscientas veinte de la probabilidad total.", bars('Muestras, no semillas',['Favorables','Resto'],[112,108],[0])),
    stage("Ka debe ser un entero realizable: no podemos elegir más semillas de interés que sus existencias ni más que las plazas de la muestra.", numberLine('Soporte de K=4 en muestra n=3',0,3,[],[0,1,2,3]))
  ],
  'hipergeometrica/soporte-y-correccion':[
    stage("Hola, cinco plazas de muestra y solo dos elementos restantes nos obligan a incluir parte de la categoría de interés.", bars('Lote nuevo, sin reutilizar el anterior',['Interés','Restantes'],[7,2],[1])),
    stage("Usamos los dos restantes para reducir todo lo posible los de interés.", numberLine('Cinco plazas: al menos tres de interés',0,5,[interval(3,5,'Soporte posible')],[3,4,5])),
    stage("Cada posición de la muestra tiene proporción de interés ka mayúscula entre ene mayúscula, de modo que la esperanza es ene veces esa proporción.", tree('Retirar sin reemplazo reduce la dispersión',[branch('Varianza hipergeométrica',['Factor binomial','Corrección (N-n)/(N-1)'])]))
  ],
  'geometrica-negativa/primera-deteccion':[
    stage("Probamos colonias hasta detectar una señal por primera vez.", tree('Parar en el primer éxito',[branch('Ensayo',['Éxito: parar',branch('Fallo',['Nuevo ensayo'])])])),
    stage("Si detectamos en el primer intento, equis vale cero y te uno: no hubo fallos, pero sí un ensayo.", trials('Mismo resultado: cero fallos, un ensayo',['Éxito'],[0])),
    stage("Exactamente dos fallos previos exige fallo, fallo y éxito en ese orden; cualquier éxito anterior habría detenido el experimento.", trials('El éxito final no se puede mover',['Fallo','Fallo','Éxito'],[2])),
    stage("La media teórica de fallos es uno menos pe entre pe.", tree('Convenciones distintas',[branch('Fallos X',['Empieza en 0']),branch('Ensayos T = X+1',['Empieza en 1'])]))
  ],
  'geometrica-negativa/varios-exitos':[
    stage("Ampliemos la parada: seguimos hasta el segundo éxito con ensayos independientes y pe una mitad.", tree('Meta: segundo éxito, no número fijo de intentos',[branch('Antes de la meta',['Primer éxito','Fallos posibles']),branch('Último ensayo',['Segundo éxito'])])),
    stage("Quedan dos posiciones anteriores para un fallo y el primer éxito.", trials('Un fallo antes del segundo éxito',['FEE','EFE'],[0,1])),
    stage("Para una meta entera positiva erre y ka fallos, reservamos el último ensayo al éxito final.", trials('El último éxito permanece fijado',['Posiciones previas','Éxito final'],[0])),
    stage("Como máximo ka fallos suma las masas desde cero hasta ka incluido.", numberLine('Soporte de fallos: empieza en cero',0,4,[interval(0,4,'Enteros; continúa más allá')],[0,1,2,3,4]))
  ],
  'geometrica-negativa/memoria-y-momentos':[
    stage("¿Después de tres fallos toca acertar?", trials('Historia conocida; siguiente ensayo sin deuda',['Fallo','Fallo','Fallo','Próximo'],[3])),
    stage("Para completar erre éxitos, separamos los fallos de antes del primero, entre el primero y el segundo, y así hasta el último.", tree('Sumar esperas geométricas compatibles',[branch('Meta r',['Espera al éxito 1','...','Espera al éxito r'])])),
    stage("Con erre dos y pe una mitad, la media es dos por una mitad dividido entre una mitad: dos fallos.", bars('Unidades distintas: fallos y ensayos',['Fallos medios','Ensayos medios'],[2,4],[0,1]))
  ],
  'geometrica-negativa/forma-real':[
    stage("Veamos una extensión de la binomial negativa, separada de la espera literal.", tree('Forma real no es una parada literal',[branch('Binomial negativa',['Forma r real positiva','Recuento k entero no negativo'])])),
    stage("Tomemos forma dos coma cinco y pe una mitad.", tree('Parámetros del ejemplo sobredisperso',[branch('r = 2,5; p = 0,5',['Fallos enteros desde cero','Sin meta literal de 2,5 éxitos'])])),
    stage("Una mitad dividida entre una mitad vale uno, así que queda dos coma cinco como media del recuento.", bars('Media de fallos del ejemplo',['Media'],[2.5],[0])),
    stage("El numerador vale uno coma veinticinco y al dividir entre un cuarto obtenemos cinco.", bars('Sobredispersión; no son dos masas',['Media','Varianza'],[2.5,5],[1]))
  ],
  'uniforme-montecarlo/dos-uniformes':[
    stage("Elegimos un instante entre dos y seis minutos sin preferir ninguna zona.", density('Uniforme continua de 2 a 6',[[2,0.25],[6,0.25]],{support:[2,6]})),
    stage("Para preguntar por estar entre tres y cinco", density('Comparar longitudes dentro del soporte',[[2,0.25],[6,0.25]],{support:[2,6],shade:[3,5]})),
    stage("En cambio, si elegimos entre uno, dos, tres y cuatro con la misma probabilidad, sí hay cuatro masas de un cuarto.", bars('Uniforme discreta: cada punto sí tiene masa',['1','2','3','4'],[0.25,0.25,0.25,0.25],[0,1,2,3]))
  ],
  'uniforme-montecarlo/cuantiles':[
    stage("Ahora sabemos una proporción y buscamos un tiempo: ¿qué umbral deja el setenta y cinco por ciento de la uniforme de dos a seis por debajo?", numberLine('Uniforme de 2 a 6: buscar el umbral',2,6,[interval(2,6,'Soporte')],[2,6])),
    stage("La anchura completa es cuatro minutos.", numberLine('Recorrer tres cuartos de la anchura',2,6,[interval(2,5,'75 % del recorrido')],[2,5,6])),
    stage("La media de esta uniforme está en su punto medio, cuatro, por simetría.", numberLine('Centro y cuantil son preguntas distintas',2,6,[interval(2,5,'Cuantil del 75 %')],[4,5])),
    stage("En una acumulada con saltos puede no haber un valor cuya acumulada sea exactamente la proporción u.", tree('Inversa generalizada',[branch('Nivel u',['Primer umbral cuya acumulada alcanza u'])]))
  ],
  'uniforme-montecarlo/inversion-y-montecarlo':[
    stage("Hola, para generar estados con masas dos décimas, cinco décimas y tres décimas, sus sumas acumuladas fijan cortes en dos décimas, siete décimas y uno.", numberLine('Partición de U; primer umbral cuya CDF alcanza U',0,1,[interval(0,0.2,'X = 0',[false,true]),interval(0.2,0.7,'X = 1',[false,true]),interval(0.7,1,'X = 2',[false,true])])),
    stage("Una entrada de una décima cae antes del primer corte y devuelve cero.", numberLine('U = 0,10 pertenece al primer tramo',0,1,[interval(0,0.2,'X = 0',[false,true])],[0.1])),
    stage("Cincuenta y cinco centésimas cae entre dos y siete décimas", numberLine('La misma frase asigna U = 0,55 y U = 0,91',0,1,[interval(0.2,0.7,'X = 1',[false,true]),interval(0.7,1,'X = 2',[false,true])],[0.55,0.91])),
    stage("Llamamos u a la variable uniforme y cu a la función cuantil del modelo objetivo.", bars('Distribución objetivo, no una simulación realizada',['0','1','2'],[0.2,0.5,0.3],[0,1,2]))
  ],
  'exponencial/escala-y-supervivencia':[
    stage("Supongamos una espera exponencial de media cinco minutos y preguntemos por seguir esperando después de diez.", survival(5)),
    stage("El tiempo te es no negativo", survival(5,{marker:10})),
    stage("En la exponencial, seguir sin evento hasta ese tiempo tiene probabilidad exponencial de menos tiempo entre escala.", survival(5,{marker:10,level:Math.exp(-2)}))
  ],
  'exponencial/densidad-y-acumulada':[
    stage("Distingamos las tres funciones de una espera exponencial: supervivencia, acumulada y densidad.", survival(5)),
    stage("La supervivencia pregunta si seguimos esperando", density('Densidad exponencial; escala 5; cola fuera del marco',curvePoints(0,20,time=>Math.exp(-time/5)/5),{domain:[0,20],supportStart:0,xLabel:'Tiempo (min)'})),
    stage("La acumulada efe de te es la probabilidad de que el evento haya ocurrido hasta te, incluido.", curve('Acumulada, complemento de la supervivencia',curvePoints(0,20,time=>1-Math.exp(-time/5)),'cdf'))
  ],
  'exponencial/espera-adicional':[
    stage("Ya llevamos diez minutos sin señal y queremos la probabilidad de esperar otros cinco.", numberLine('Condición conocida y espera adicional',0,15,[interval(0,10,'Ya transcurrido'),interval(10,15,'Otros cinco minutos')],[10,15])),
    stage("Superar quince implica haber superado diez.", survival(5,{markers:[10,15]})),
    stage("El resultado es aproximadamente cero coma tres seis ocho, igual a la supervivencia de cinco minutos desde el comienzo.", survival(5,{marker:5})),
    stage("Como cautela adicional, si dejamos de observar sin ver el evento, solo sabemos que la espera supera ese final.", tree('Censura: no confundir límite observado con evento',[branch('Fin de observación',['Evento todavía no observado','Tiempo real sigue desconocido'])]))
  ],
  'normal/centro-y-escala':[
    stage("Hola, una longitud se modela como normal de media cuarenta milímetros y desviación típica cuatro: son su centro y su escala de dispersión.", normal('Longitudes; media 40, desviación 4',40,4)),
    stage("Queremos situar cuarenta y ocho respecto de esos valores.", normal('Umbral 48 frente al centro 40',40,4,{marker:48})),
    stage("La regla general zeta igual a equis menos mu dividido entre sigma realiza esos dos cambios: centra y expresa distancias en desviaciones.", normal('La misma distancia en unidades estándar',0,1,{marker:2}))
  ],
  'normal/densidad-normal':[
    stage("Vamos a entender la fórmula de la campana estándar antes de calcular probabilidades.", normal('Densidad estándar; altura no es probabilidad',0,1)),
    stage("La integral de esa silueta sobre toda la recta es raíz de dos pi.", normal('Campana estándar de área total uno',0,1,{lower:-4,upper:4})),
    stage("Para una media mu y desviación sigma evaluamos la forma estándar en la distancia tipificada.", normal('Escala de la longitud original',40,4))
  ],
  'normal/colas-e-intervalos':[
    stage("Hola, al tipificar los límites treinta y seis y cuarenta y ocho con media cuarenta y desviación cuatro obtenemos menos uno y dos.", normal('Intervalo en las unidades de longitud',40,4,{lower:36,upper:48})),
    stage("Esos serán los extremos del intervalo en la normal estándar.", normal('Misma área, límites estándar',0,1,{lower:-1,upper:2})),
    stage("Fi mayúscula de un umbral es toda el área estándar a su izquierda, desde menos infinito.", normal('Acumulada hasta dos',0,1,{upper:2})),
    stage("La acumulada hasta menos uno vale aproximadamente cero coma ciento cincuenta y nueve.", normal('Retirar el área hasta menos uno',0,1,{lower:-1,upper:2})),
    stage("Si preguntamos solo por superar dos desviaciones, la zona deseada es la derecha.", normal('Cola superior, no altura en dos',0,1,{lower:2}))
  ],
  'normal/cuantiles-y-combinaciones':[
    stage("Hola, el cuantil estándar que deja noventa por ciento por debajo es aproximadamente uno coma dos ocho uno cinco cinco desviaciones, obtenido al invertir fi mayúscula.", normal('Buscar un umbral de área, no su altura',0,1,{level:0.9})),
    stage("Para volver a milímetros deshacemos la división de la tipificación.", numberLine('Desplazamiento desde el centro',40,48,[interval(40,45.1262,'4 por 1,28155')],[40,45.1262])),
    stage("Deshacemos ahora el centrado añadiendo la media cuarenta.", normal('Percentil 90 en las unidades originales',40,4,{upper:45.1262})),
    stage("Una transformación afín de una normal no constante sigue siendo normal: el coeficiente multiplica la media, su cuadrado multiplica la varianza y el desplazamiento solo mueve el centro.", tree('Condiciones para combinar normales',[branch('Normales independientes',['Combinar medias','Combinar varianzas con coeficientes cuadrados'])]))
  ],
  'gamma/etapas-y-parametros':[
    stage("Hola, supongamos tres etapas sucesivas con esperas exponenciales independientes y escala común dos minutos: ese será nuestro mecanismo de reacción.", trials('Tres esperas independientes; escala común 2 min',['Etapa 1','Etapa 2','Etapa 3'],[0,1,2])),
    stage("La suma sigue una gamma de forma ka tres y escala alfa dos.", gammaDensity(3,2)),
    stage("La esperanza del total suma las esperanzas porque estamos sumando tiempos.", trials('Sumar tiempos medios, no cambiar la escala',['Media 2 min','Media 2 min','Media 2 min'],[0,1,2]))
  ],
  'gamma/funcion-gamma':[
    stage("La forma de la distribución gamma puede ser cualquier real positivo, aunque una cuenta literal de etapas sea entera.", tree('Gamma función y gamma distribución no son lo mismo',[branch('Forma real positiva',['Constante Gamma(k)','Densidad normalizada'])])),
    stage("Gamma de ka integra u a la ka menos uno por exponencial de menos u sobre los positivos.", curve('Integrando de Gamma(3), no densidad de T',curvePoints(0,15,value=>value*value*Math.exp(-value)),'normalizer-integrand')),
    stage("Para forma tres, gamma de tres es dos factorial y vale dos.", tree('Normalizador del ejemplo de tres etapas',[branch('Gamma(3)',['2 factorial','Valor 2, sin nueva etapa'])]))
  ],
  'gamma/densidad-y-area':[
    stage("En la reacción de tres etapas y escala dos minutos, queremos terminar antes de cuatro.", gammaDensity(3,2,{shade:[0,4]})),
    stage("La forma ka controla la potencia del tiempo, te a la ka menos uno.", tree('La densidad requiere ambas piezas',[branch('Forma k = 3',['Potencia t al cuadrado']),branch('Escala 2',['Exponencial de -t/2'])])),
    stage("Con forma tres, gamma de tres vale dos, y escala dos elevada a tres vale ocho: el denominador es dieciséis.", gammaDensity(3,2,{shade:[0,4]}))
  ],
  'gamma/sumas-y-variacion':[
    stage("Hola, al sumar gammas independientes con escala común, sus formas dos y tres se suman y dan cinco.", tree('Sumar formas solo con escala común',[branch('Gamma forma 2, escala 2',['Suma']),branch('Gamma forma 3, escala 2',['Suma'])])),
    stage("El total sigue una gamma de forma cinco y conserva escala dos.", gammaDensity(5,2)),
    stage("La desviación típica es alfa por raíz de ka.", curve('Variación relativa: uno entre raíz de k',curvePoints(1,9,value=>1/Math.sqrt(value)),'function',{xLabel:'Forma k',yLabel:'Desviación / media'}))
  ],
  'cauchy-weibull/centro-sin-media':[
    stage("Una curva simétrica alrededor de cero invita a decir que su media es cero.", density('Cauchy estándar: mediana, no esperanza',curvePoints(-8,8,value=>1/(Math.PI*(1+value*value))),{xLabel:'Señal x'})),
    stage("Cero es mediana porque deja la mitad de la probabilidad a cada lado y es moda porque allí la densidad es máxima.", numberLine('Centro de simetría: no se declara media',-8,8,[],[0])),
    stage("La contribución del lado positivo diverge", tree('Las colas no se cancelan para definir esperanza',[branch('Cola negativa',['Integral divergente']),branch('Cola positiva',['Integral divergente'])]))
  ],
  'cauchy-weibull/intervalos-cauchy':[
    stage("Que Cauchy no tenga esperanza no impide calcular la probabilidad de un intervalo.", density('Cauchy: los intervalos sí tienen probabilidad',curvePoints(-8,8,value=>1/(Math.PI*(1+value*value))))),
    stage("En la Cauchy estándar, la localización es cero y la escala uno.", curve('CDF Cauchy estándar',curvePoints(-8,8,value=>0.5+Math.atan(value)/Math.PI),'cdf',{marker:1})),
    stage("En menos uno, arco tangente vale menos pi entre cuatro y la acumulada queda un cuarto.", density('Intervalo central [-1, 1]',curvePoints(-8,8,value=>1/(Math.PI*(1+value*value))),{shade:[-1,1]}))
  ],
  'cauchy-weibull/weibull-supervivencia':[
    stage("Para un sensor cuyo comportamiento cambia con el tiempo, el riesgo constante de la exponencial puede ser demasiado restrictivo.", tree('Weibull separa escala y evolución del riesgo',[branch('Tiempo relativo a escala',['Elevar a forma beta','Exponencial negativa'])])),
    stage("Tomemos escala diez horas, forma dos y preguntemos por superar diez horas.", curve('Supervivencia Weibull: escala 10, forma 2',curvePoints(0,25,time=>Math.exp(-((time/10)**2))),'survival',{marker:10,xLabel:'Tiempo (h)'})),
    stage("Para obtener densidad derivamos la supervivencia con signo contrario.", density('Densidad Weibull con esos mismos parámetros',curvePoints(0,25,time=>time/50*Math.exp(-((time/10)**2))),{xLabel:'Tiempo (h)'}))
  ],
  'cauchy-weibull/riesgo-y-momentos':[
    stage("Hola, como ampliación, el riesgo instantáneo hache de te divide densidad entre supervivencia positiva para referir la tasa de fallo solo a quienes siguen sin fallar.", tree('Riesgo: altura entre probabilidad de seguir',[branch('h(t)',['Densidad f(t)','Supervivencia S(t) positiva'])])),
    stage("Si beta vale uno, la potencia es cero y el riesgo constante recupera la exponencial.", tree('La forma determina la dirección del riesgo',[branch('Beta menor que 1',['Riesgo decreciente']),branch('Beta igual a 1',['Riesgo constante']),branch('Beta mayor que 1',['Riesgo creciente'])])),
    stage("La media de la duración doble u se obtiene integrando tiempo por densidad.", tree('Momentos de Weibull, no de Cauchy',[branch('Media',['Escala por Gamma(1+1/beta)']),branch('Segundo momento',['Escala al cuadrado por Gamma(1+2/beta)'])]))
  ],
  'calculo-modelos/operacion-correcta':[
    stage("Un programa puede devolver un número correcto para una pregunta equivocada.", normal('Modelo de consulta: media 20, desviación 3',20,3,{marker:26})),
    stage("Hay cuatro operaciones distintas.", tree('Entradas y salidas diferentes',[branch('Masa o densidad',['Valor -> altura']),branch('Acumulada',['Umbral -> probabilidad']),branch('Cuantil',['Probabilidad -> umbral']),branch('Generación',['Modelo -> realización'])])),
    stage("Las unidades permiten detectar una confusión: densidad tiene unidades inversas de la medida; cuantil y realizaciones tienen las unidades originales; una probabilidad de cola no tiene unidades y queda entre cero y uno.", normal('La cola requiere un área',20,3,{lower:26}))
  ],
  'calculo-modelos/consulta-con-unidades':[
    stage("Hola, restar la media veinte al umbral veintiséis da distancia seis al centro: ese es el primer paso para calcular su cola normal.", normal('Superar 26 con media 20 y desviación 3',20,3,{lower:26})),
    stage("Dividimos la distancia seis entre la desviación tres para expresarla en unidades estándar.", normal('Dos desviaciones por encima del centro',0,1,{lower:2})),
    stage("Para el percentil noventa invertimos la acumulada, no consultamos una cola.", normal('Cuantil 90: umbral en unidades originales',20,3,{upper:23.84465})),
    stage("En recuentos, al menos ka se calcula complementando hasta ka menos uno, porque ka sí aporta masa y debe quedarse.", tree('Discreto: el extremo puede tener masa',[branch('Al menos k',['Complemento hasta k-1']),branch('Más de k',['Complemento hasta k'])]))
  ],
  'calculo-modelos/elegir-mecanismo':[
    stage("Cerremos la elección de modelos con un itinerario: definir qué mide equis, qué valores puede tomar y cómo se obtienen.", tree('El mecanismo decide el modelo',[branch('Recuento',['Ensayos binarios','Extracción de un lote','Eventos por exposición'])])),
    stage("Para un indicador con dos resultados usamos Bernoulli.", tree('Diseños diferentes',[branch('Un ensayo binario',['Bernoulli']),branch('n fijo, p común, independencia',['Binomial']),branch('Lote finito sin reemplazo',['Hipergeométrica'])])),
    stage("Si paramos en el primer éxito, la geométrica cuenta fallos previos; para una meta entera de éxitos, la binomial negativa.", tree('Parada, exposición o duración',[branch('Parar en éxitos',['Geométrica o negativa']),branch('Exposición estable',['Posible Poisson']),branch('Tiempo',['Soporte y riesgo'])]))
  ],
  'familia-exponencial/piezas-poisson':[
    stage("Familia exponencial no es otro nombre para tiempos de espera exponenciales.", tree('Datos y parámetros cumplen papeles distintos',[branch('Masa Poisson',['h(x): dato','T(x): resumen','eta: parámetro','A(eta): normaliza'])])),
    stage("En la masa Poisson, uno entre equis factorial depende del recuento observado, pero no de lambda.", tree('Parte que no depende de lambda',[branch('Dato x',['h(x) = 1/x factorial'])])),
    stage("La potencia lambda a la equis puede escribirse como exponencial de equis por logaritmo de lambda.", tree('Resumen que interactúa con el parámetro',[branch('Dato x',['T(x) = x'])])),
    stage("Llamamos eta al logaritmo de lambda para escribir esa interacción como eta por te.", tree('Reparametrizar una media positiva',[branch('Lambda positiva',['eta = log lambda','A(eta) = exp eta'])]))
  ],
  'familia-exponencial/binomial-natural':[
    stage("Reconozcamos ahora la misma estructura en la binomial.", tree('Soporte fijo y probabilidad interior',[branch('Binomial n fijo',['Recuento de 0 a n','0 < p < 1'])])),
    stage("Al tomar logaritmos de las potencias, equis multiplica logaritmo de pe menos logaritmo de uno menos pe.", tree('De probabilidad a parámetro natural',[branch('p',['Odds p/(1-p)','Log odds: eta'])])),
    stage("Si pe vale tres cuartos, su complemento es un cuarto y las odds son tres.", bars('Probabilidad frente a su complemento',['Éxito','Fracaso'],[0.75,0.25],[0,1])),
    stage("En pe cero o uno, el recuento es determinista y el logit no tiene valor finito: son límites de la familia interior.", numberLine('El logit finito exige extremos excluidos',0,1,[interval(0,1,'0 < p < 1',[false,false])]))
  ],
  'familia-exponencial/normales-uniparametricas':[
    stage("Una normal tiene media y varianza, así que para hablar de una familia con un solo parámetro debemos decidir cuál fijamos.", tree('Dos familias uniparamétricas distintas',[branch('Varianza conocida',['Media variable','T(x) = x']),branch('Media conocida',['Varianza variable','T(x) = distancia cuadrada'])])),
    stage("Primero fijamos una varianza positiva ve.", tree('Varianza fija v positiva',[branch('Media mu variable',['eta = mu/v','T(x) = x'])])),
    stage("En el segundo caso fijamos la media mu sub cero y dejamos variar la varianza.", tree('Centro fijo mu0',[branch('Varianza positiva variable',['T(x) = (x-mu0) al cuadrado','eta = -1/(2 sigma al cuadrado)'])]))
  ],
  'familia-exponencial/datos-fijos-y-maximo':[
    stage("Hola, observamos cero, uno y dos eventos en tres ventanas independientes de igual exposición: esos tres recuentos forman la muestra que usaremos para introducir la estimación.", bars('Datos fijos de ventanas con igual exposición',['Ventana 1','Ventana 2','Ventana 3'],[0,1,2],[0,1,2])),
    stage("Cada ventana aporta además exponencial de menos lambda, y tres ventanas dan exponencial de menos tres lambda.", curve('Verosimilitud para los datos 0, 1, 2',curvePoints(0,4,rate=>Math.exp(-3*rate)*rate**3/2),'likelihood',{xLabel:'Lambda candidata',yLabel:'L(lambda)'})),
    stage("Igualar la derivada a cero exige tres entre lambda igual a tres, así que lambda estimada es uno, la media de los recuentos.", curve('Máximo de verosimilitud, no posterior',curvePoints(0,4,rate=>Math.exp(-3*rate)*rate**3/2),'likelihood',{marker:1,xLabel:'Lambda candidata'}))
  ],
  'familia-exponencial/log-verosimilitud':[
    stage("Evaluemos la log verosimilitud en lambda uno para los recuentos cero, uno y dos.", bars('La misma muestra: 0, 1, 2',['Ventana 1','Ventana 2','Ventana 3'],[0,1,2],[0,1,2])),
    stage("La suma de los recuentos es tres y multiplica logaritmo natural de lambda.", bars('Primera aportación a log L(1), no masa',['T log lambda'],[0],[0])),
    stage("Cada una de las tres ventanas aporta menos lambda al logaritmo de la masa.", bars('Contribución de las tres exposiciones',['T log lambda','-n lambda'],[0,-3],[1])),
    stage("Falta el producto de factoriales: cero factorial y uno factorial valen uno, y dos factorial vale dos.", bars('Constante necesaria al evaluar el valor',['T log lambda','-n lambda','-log factoriales'],[0,-3,-Math.log(2)],[2]))
  ],
  'familia-exponencial/enlaces-glm':[
    stage("Presentemos una aplicación de esta estructura: relacionar una dosis con la media de una respuesta sin permitir valores imposibles.", tree('El enlace mantiene el dominio de la respuesta',[branch('Dosis y coeficientes',[branch('Predictor lineal',['Exponencial: media Poisson positiva'])])])),
    stage("Con Poisson y enlace logarítmico, proponemos logaritmo de la media igual a logaritmo de dos más dosis por logaritmo de uno coma cinco.", scatter('Medias ilustrativas, no ajustadas',[[0,2],[1,3],[2,4.5]],{xLabel:'Dosis d',yLabel:'Media Poisson'})),
    stage("Para una respuesta binaria podemos usar logit como enlace.", tree('Logit y su inversa',[branch('eta = 0',['p = 1/2']),branch('eta = log 3',['p = 3/4'])]))
  ],
  'conjunta-discreta/parejas':[
    stage("Medimos dos marcadores en cada célula y codificamos cada uno como cero o uno.", tree('Conservar qué dos medidas pertenecen a la misma célula',[branch('Célula',['Valor de X','Valor de Y'])])),
    stage("En la tabla equis identifica filas e i griega columnas.", jointTable()),
    stage("Pe sub equis, i griega es la masa conjunta.", jointTable([[1,0]]))
  ],
  'conjunta-discreta/region-de-celdas':[
    stage("Calculemos equis como máximo cero e i griega como máximo uno en la tabla de indicadores.", jointTable([[0,0],[0,1]])),
    stage("La acumulada conjunta efe de a, be hace esta selección con dos umbrales: exige equis como máximo a e i griega como máximo be al mismo tiempo.", jointTable([[0,0],[0,1]])),
    stage("Para otro suceso comprobamos sus desigualdades en cada pareja antes de sumar.", jointTable())
  ],
  'conjunta-discreta/rectangulo-acumulado':[
    stage("Hola, efe de be, de acumula todo hasta los dos límites superiores: será la región inicial de la que retiraremos lo que sobra.", jointTable()),
    stage("Queremos el rectángulo con equis mayor que a", {...jointTable([[0,0],[0,1],[1,0],[1,1]]),caption:'Ejemplo de la tabla: comenzar con las cuatro celdas'}),
    stage("Quitamos efe de a, de porque reúne lo que tiene equis como máximo a y, por tanto, incumple el límite inferior de equis.", jointTable([[0,0],[0,1]])),
    stage("Quitamos también efe de be, ce para eliminar lo que queda hasta ce en i griega.", jointTable([[0,0],[1,0]])),
    stage("Devolvemos una vez esa esquina mediante efe de a, ce.", jointTable([[0,0]])),
    stage("Para quedarnos con ambos indicadores uno usamos el rectángulo entre cero y uno, excluyendo cero.", jointTable([[1,1]]))
  ],
  'multinomial/categorias-y-secuencias':[
    stage("Hola, cada célula se clasifica en a, reposo, con probabilidad una mitad; be, activada, con tres décimas; o ce, dañada, con dos décimas.", bars('Categorías de una célula; total de cuatro ensayos',['Reposo A','Activada B','Dañada C'],[0.5,0.3,0.2])),
    stage("Clasificamos cuatro células", trials('Un patrón compatible con los recuentos pedidos',['A','A','B','C'],[0,1,2,3])),
    stage("Cuatro factorial ordenaría cuatro etiquetas distinguibles, pero intercambiar las dos a no produce una secuencia nueva.", trials('Doce órdenes del mismo recuento 2, 1, 1',['AABC','AACB','ABAC','ABCA','ACAB','ACBA','BAAC','BACA','BCAA','CAAB','CABA','CBAA'],[0,1,2,3,4,5,6,7,8,9,10,11]))
  ],
  'multinomial/marginales-y-total':[
    stage("Hola, los recuentos de a, be y ce suman cuatro porque clasificamos cuatro células y cada una ocupa una sola categoría.", trials('Cuatro plazas compartidas entre categorías',['Plaza 1','Plaza 2','Plaza 3','Plaza 4'],[],[{label:'Total fijo: A + B + C = 4',indices:[0,1,2,3]}])),
    stage("Si solo nos interesa a, juntamos be y ce como no a.", bars('Reunir B y C como no A',['A','No A'],[0.5,0.5],[0])),
    stage("Por eso el recuento marginal de a es binomial", binomialMass(4,0.5))
  ],
  'multinomial/momentos-con-indicadores':[
    stage("Dediquemos una derivación a la covarianza entre categorías.", trials('Cada célula ocupa solo una categoría',['A','B','C'])),
    stage("En una misma célula no pueden ocurrir a y be simultáneamente, porque las categorías se excluyen.", matrix('Indicadores incompatibles en la misma célula',[[1,0],[0,1],[0,0]],[],['A','B','C'],['IA','IB'])),
    stage("Al pasar a los recuentos sumamos una contribución por cada una de las cuatro células.", matrix('Covarianzas del total de cuatro células',[[1,-0.6,-0.4],[-0.6,0.84,-0.24],[-0.4,-0.24,0.64]],[[0,1],[1,0]],['A','B','C'],['A','B','C'])),
    stage("La suma de todos los recuentos es constante, por lo que su covarianza con cualquier componente es cero.", matrix('El total fijo produce una matriz singular',[[1,-0.6,-0.4],[-0.6,0.84,-0.24],[-0.4,-0.24,0.64]],[[0,0],[0,1],[0,2]],['A','B','C'],['A','B','C']))
  ],
  'marginales/sumar-la-otra':[
    stage("Hola, en esta tabla de marcadores equis ocupa las filas e i griega las columnas, y cada celda representa una pareja simultánea.", jointTable([[0,1],[1,1]])),
    stage("La regla general mantiene fijo el valor i griega que nos interesa y suma la conjunta sobre todos los equis posibles.", bars('Marginal Y: sumar sin fijar X',['Y=0','Y=1'],[0.6,0.4],[1])),
    stage("Para conservar equis haríamos lo contrario: sumar las columnas de cada fila.", jointTable([[0,0],[0,1]]))
  ],
  'marginales/integrar-cortes':[
    stage("Hola, el triángulo representa dos recursos positivos cuya suma no supera la capacidad uno; el corte señalado fija equis en un cuarto.", {...triangle('Densidad 2 sobre capacidad 1',1,0.25),density:2}),
    stage("En equis un cuarto, i griega puede ir de cero a tres cuartos.", triangle('El corte de Y mide tres cuartos',1,0.25)),
    stage("La integral da dos por uno menos equis: altura dos multiplicada por la longitud compatible.", density('Marginal X: longitud del corte por altura',[[0,2],[1,0]],{support:[0,1],marker:0.25}))
  ],
  'marginales/proyeccion-y-corte':[
    stage("Marginalizar significa no distinguir la otra medida; condicionar significa conocer algo de ella.", jointTable([[0,1],[1,1]])),
    stage("Al conocer equis uno restringimos el universo a su fila, cuya masa total es una mitad.", jointTable([[1,0],[1,1]])),
    stage("Sin fijar equis la respuesta era cuatro décimas; fijando equis uno es una mitad.", bars('Dos preguntas; no dos partes de un total',['P(Y=1)','P(Y=1 dado X=1)'],[0.4,0.5],[0,1])),
    stage("En continuo se conserva la diferencia conceptual.", tree('Corte frente a proyección',[branch('X conocido',['Normalizar un corte']),branch('X olvidado',['Integrar todos sus valores'])]))
  ],
  'conjunta-condicional/normalizar-region':[
    stage("Hola, el triángulo reúne los repartos de dos recursos positivos, equis e i griega, cuya suma no puede superar la capacidad uno de los cultivos.", triangle('Soporte triangular; altura c aún por determinar')),
    stage("Multiplicar ambos lados por dos da ce dos.", {...triangle('Volumen total uno con altura 2'),density:2}),
    stage("Preguntemos ahora por equis más i griega como máximo una mitad.", triangle('El suceso es un triángulo dentro del soporte',1,undefined,[[[0,0],[0.5,0],[0,0.5]]]))
  ],
  'conjunta-condicional/normalizar-corte':[
    stage("Hola, el corte señalado fija equis en dos décimas dentro del reparto triangular y deja a i griega entre cero y ocho décimas por la capacidad restante.", triangle('Fijar X = 0,2 deja Y de 0 a 0,8',1,0.2)),
    stage("La integral del corte es la densidad marginal de equis en dos décimas.", {...triangle('Marginal: integrar el corte completo',1,0.2),density:2}),
    stage("Comprobemos la normalización: altura uno coma veinticinco por anchura cero coma ocho da uno.", density('Corte normalizado; área uno',[[0,1.25],[0.8,1.25]],{support:[0,0.8]}))
  ],
  'conjunta-condicional/interpretar-condicion':[
    stage("Con equis dos décimas, i griega es uniforme entre cero y ocho décimas y tiene densidad uno coma veinticinco.", density('Y dado X = 0,2; mismo soporte del corte',[[0,1.25],[0.8,1.25]],{support:[0,0.8],shade:[0.4,0.8]})),
    stage("Como la densidad condicional es constante, su área favorable es anchura por altura: cero coma cuatro por uno coma veinticinco.", numberLine('Tramo favorable dentro de las ocho décimas',0,0.8,[interval(0.4,0.8,'Y superior a 0,4',[false,true])],[0.4,0.8])),
    stage("Si el instrumento solo informa equis entre quince y veinticinco centésimas, conocemos una franja, no una coordenada exacta.", triangle('Una franja no es el corte exacto',1,undefined,[[[0.15,0],[0.25,0],[0.25,0.75],[0.15,0.85]]]))
  ],
  'normal-bivariante/modelo-conjunto':[
    stage("Modelemos dos señales medidas juntas: medias treinta y setenta, desviaciones cinco y ocho y correlación un cuarto.", jointNormal('Contornos del modelo conjunto supuesto')),
    stage("Para comparar las dos direcciones quitamos a cada coordenada su centro y dividimos por su propia desviación.", jointNormal('Cada eje se centra y escala por separado',{highlightAxis:'x'})),
    stage("En la otra coordenada usamos i griega menos setenta dividido entre ocho, según esta fórmula general.", jointNormal('Y usa media 70 y desviación 8',{highlightAxis:'y'}))
  ],
  'normal-bivariante/densidad-bivariante':[
    stage("Construyamos la densidad normal conjunta por piezas para ver dónde entra la relación.", jointNormal('El término cruzado orienta los contornos')),
    stage("Cu nombra la suma de los dos cuadrados menos dos ro por el producto de las coordenadas tipificadas.", jointNormal('Correlación 0,25: contornos inclinados',{highlightAxis:'both'})),
    stage("Con ro cero desaparece el término cruzado y uno menos ro al cuadrado vale uno: la expresión se separa en el producto de las dos densidades normales marginales.", jointNormal('Comparación explícita: rho = 0',{rho:0}))
  ],
  'normal-bivariante/media-y-varianza-condicional':[
    stage("Hola, la lectura equis cuarenta está diez unidades sobre su media treinta: restamos cuarenta menos treinta para medir esa desviación.", jointNormal('Corte vertical en X = 40',{cutX:40})),
    stage("El cuadrado completado centra el corte tipificado de i griega en ro veces zeta equis.", jointNormal('Desplazamiento de X informa sobre Y',{cutX:40,highlightAxis:'x'})),
    stage("El desplazamiento se aplica a la media marginal de i griega, setenta.", tree('Actualizar el centro sin adelantar la desviación',[branch('Centro marginal: 70',[branch('Desplazamiento: 4',['Centro condicional: 74'])])])),
    stage("Para medir distancias necesitamos la desviación, raíz de sesenta, aproximadamente siete coma setecientos cuarenta y seis.", normal('Desviación del corte: raíz de 60',74,Math.sqrt(60)))
  ],
  'normal-bivariante/cola-condicional':[
    stage("Ahora preguntamos por i griega mayor que ochenta y dos sabiendo que equis vale cuarenta.", jointNormal('La pregunta pertenece al corte X = 40',{cutX:40})),
    stage("El total de referencia es la distribución condicional del corte", normal('Y dado X = 40: media 74, varianza 60',74,Math.sqrt(60),{lower:82})),
    stage("Dividimos ocho entre la desviación del corte, raíz de sesenta, y no entre su varianza sesenta.", normal('La misma cola en desviaciones condicionales',0,1,{lower:8/Math.sqrt(60)})),
    stage("En el gráfico, la curva completa del corte tiene área uno y el sombreado comienza en ochenta y dos.", normal('Volver a la escala de la señal Y',74,Math.sqrt(60),{lower:82}))
  ],
  'independencia-variables/factorizar-tabla':[
    stage("Hola, en esta tabla equis ocupa filas e i griega columnas, con masas conjuntas cuarenta y dos, veintiocho, dieciocho y doce centésimas.", matrix('Tabla a comprobar, no una sola celda',[[0.42,0.28],[0.18,0.12]])),
    stage("Para la pareja cero, cero, la factorización exigiría siete décimas por seis décimas: cuarenta y dos centésimas.", matrix('Producto de sus dos marginales',[[0.42,0.28],[0.18,0.12]],[[0,0]])),
    stage("Para cero, uno usamos la misma marginal de equis cero, siete décimas, pero la marginal de i griega uno, cuatro décimas.", matrix('Comprobar también la siguiente celda',[[0.42,0.28],[0.18,0.12]],[[0,1]])),
    stage("Para la segunda fila, tres décimas por seis décimas da dieciocho centésimas y tres por cuatro décimas da doce.", matrix('Verificar el resto de parejas',[[0.42,0.28],[0.18,0.12]],[[1,0],[1,1]]))
  ],
  'independencia-variables/soporte-completo':[
    stage("Hola, el triángulo limita las parejas positivas a suma como máximo uno; en el corte equis ocho décimas, solo quedan dos décimas para i griega.", triangle('El soporte prohíbe combinar libremente X e Y',1,0.8)),
    stage("Si ambas coordenadas están entre tres cuartos y uno, su suma supera uno.", triangle('Región exterior de área positiva',1,undefined,[[[0.75,0.75],[1,0.75],[1,1],[0.75,1]]])),
    stage("Las marginales son dos por uno menos su coordenada y resultan positivas en ese rango abierto.", density('Marginal positiva para x entre 0,75 y 1',[[0,2],[1,0]],{shade:[0.75,1],support:[0,1]}))
  ],
  'independencia-variables/transformar-y-seleccionar':[
    stage("La independencia tiene consecuencias útiles, pero también un alcance que debemos respetar.", tree('Transformaciones separadas conservan independencia',[branch('X',['g(X)']),branch('Y',['h(Y)'])])),
    stage("Seleccionar un grupo con una condición sobre ambas variables es distinto de transformarlas por separado.", tree('Seleccionar sobre ambas puede crear dependencia',[branch('Grupo seleccionado por X + Y',['X limita Y','Y limita X'])])),
    stage("Como contraste concreto, equis toma menos uno, cero y uno con igual masa e i griega es su cuadrado.", scatter('Contraejemplo discreto equiprobable: Y = X al cuadrado',[[-1,1],[0,0],[1,1]],{xLabel:'X',yLabel:'Y = X al cuadrado',highlight:[1]}))
  ],
  'covarianza-matrices/desviaciones-compartidas':[
    stage("Para resumir si dos lecturas se alejan juntas de sus centros, mediremos sus desviaciones respecto de sus propias medias.", tree('Centrar cada lectura antes de multiplicar',[branch('Pareja de lecturas',['X menos media X','Y menos media Y'])])),
    stage("Tomemos un modelo con dos parejas equiprobables: cero, uno y uno, tres.", scatter('Parejas equiprobables del modelo',[[0,1],[1,3]],{line:{slope:2,intercept:1}})),
    stage("Menos una mitad por menos uno da una mitad, y una mitad por uno también da una mitad.", scatter('Desviaciones del mismo signo',[[-0.5,-1],[0.5,1]],{xLabel:'X menos 0,5',yLabel:'Y menos 2',line:{slope:2,intercept:0}}))
  ],
  'covarianza-matrices/normalizar-covarianza':[
    stage("En otro modelo tenemos varianzas nueve y dieciséis y covarianza seis.", covarianceMatrix([[0,0],[1,1]])),
    stage("Dividimos covarianza seis entre doce y obtenemos ro una mitad, la correlación.", matrix('Correlaciones tras dividir por desviaciones',[[1,0.5],[0.5,1]],[[0,1],[1,0]])),
    stage("Si duplicamos i griega, su desviación pasa de cuatro a ocho y la covarianza de seis a doce.", matrix('Escalar Y: varianza por 4, covarianza por 2',[[9,12],[12,64]],[[0,1],[1,0],[1,1]]))
  ],
  'covarianza-matrices/matrices-admisibles':[
    stage("Con varias medidas guardamos primero sus centros en un vector de medias, manteniendo el orden de las componentes.", tree('El mismo orden en centros, filas y columnas',[branch('Medidas ordenadas',['Vector de medias','Matriz de covarianzas'])])),
    stage("En nuestro modelo, la primera entrada diagonal es la varianza nueve y la segunda dieciséis.", covarianceMatrix([[0,0],[1,1]])),
    stage("La matriz de diagonal coloca las desviaciones tres y cuatro en el mismo orden y ceros fuera.", matrix('D: desviaciones en la diagonal',[[3,0],[0,4]],[[0,0],[1,1]])),
    stage("En la diagonal obtenemos nueve entre tres al cuadrado y dieciséis entre cuatro al cuadrado: ambos uno.", matrix('Matriz de correlaciones válida',[[1,0.5],[0.5,1]],[[0,1],[1,0]])),
    stage("Una matriz de covarianzas debe ser semidefinida positiva: cualquier combinación lineal de las medidas debe tener varianza no negativa.", covarianceMatrix([[0,1],[1,0]]))
  ],
  'combinaciones-incorrelacion/suma-y-diferencia':[
    stage("Dos lecturas emparejadas, en unidades compatibles, tienen varianzas cuatro y nueve y covarianza tres.", matrix('Covarianza de lecturas emparejadas',[[4,3],[3,9]],[],['X','Y'],['X','Y'])),
    stage("Al centrar la diferencia y elevarla al cuadrado aparecen los cuadrados de las dos desviaciones individuales.", bars('Aportaciones a la varianza de X menos Y',['Var X','Var Y'],[4,9],[0,1])),
    stage("El cuadrado de una resta contiene menos dos veces el producto de las desviaciones centradas.", bars('El término cruzado tiene signo negativo',['Var X','Var Y','-2 Cov'],[4,9,-6],[2])),
    stage("Restamos la corrección seis a las varianzas individuales trece y obtenemos siete.", bars('Comparar suma y diferencia, misma covarianza',['Diferencia','Suma'],[7,19],[0]))
  ],
  'combinaciones-incorrelacion/forma-matricial':[
    stage("La notación matricial organizará la misma cuenta cuando combinemos muchas medidas.", tree('Coeficientes conservan la identidad de las medidas',[branch('Combinación lineal',['a por X','b por Y'])])),
    stage("Con segundos momentos finitos, la varianza coloca sigma entre la fila y la columna de coeficientes.", matrix('Misma matriz, coeficientes a ambos lados',[[4,3],[3,9]],[[0,0],[0,1],[1,0],[1,1]],['X','Y'],['X','Y'])),
    stage("La diagonal interviene porque la covarianza de una variable consigo misma es su varianza.", matrix('La diagonal contiene las varianzas',[[4,3],[3,9]],[[0,0],[1,1]],['X','Y'],['X','Y']))
  ],
  'combinaciones-incorrelacion/incorrelacion':[
    stage("Hola, i griega es el cuadrado de equis: conocer equis fija su valor sin azar adicional, aunque veremos que la covarianza es cero.", scatter('Relación exacta; soporte continuo, no observaciones',curvePoints(-1,1,value=>value*value),{xLabel:'X uniforme en [-1, 1]',yLabel:'Y = X al cuadrado',connected:true})),
    stage("La simetría de la uniforme cancela los valores positivos y negativos de equis, y también los de su cubo: sus esperanzas son cero.", scatter('Simetría de la relación respecto al eje vertical',curvePoints(-1,1,value=>value*value),{xLabel:'X',yLabel:'Y = X al cuadrado',connected:true,highlight:[0,80]})),
    stage("Decimos que son incorreladas porque la covarianza es cero; eso no elimina la dependencia no lineal.", tree('No extender una excepción a cualquier modelo',[branch('Covarianza cero',['Normalidad conjunta: independencia','En general: no basta'])]))
  ]
};

const CONCEPTS = {
  proporciones:tree('Una parte pertenece a su propio total',[branch('Semillas sembradas',['Germinadas','No germinadas'])]),
  algebra:tree('Un factor común conserva las razones',[branch('Pesos de estados',['Mismo factor para cada estado','Total requerido: uno'])]),
  funciones:tree('Una entrada recorre la regla',[branch('Entrada permitida',[branch('Aplicar g',['Salida'])])]),
  calculo:tree('Franjas dentro del intervalo solicitado',[branch('Área entre límites',['Altura de densidad','Anchura de franja'])]),
  'regiones-matrices':tree('Un recurso compartido limita las parejas',[branch('Capacidad total',['Recurso X','Recurso Y','Resto sin asignar'])]),
  sucesos:matrix('Pertenencia a dos marcadores; sin suponer pesos',[[0,0],[1,0],[0,1],[1,1]],[],['Ninguno','Solo A','Solo B','Ambos'],['Marcador A','Marcador B']),
  axiomas:tree('Sucesos disjuntos completan el espacio',[branch('Omega',['A','Complemento de A'])]),
  combinatoria:tree('Posiciones frente a grupos',[branch('Posiciones etiquetadas',['AB distinto de BA']),branch('Grupo sin orden',['AB y BA son el mismo grupo'])]),
  condicionada:tree('El grupo conocido se convierte en el universo',[branch('Condición B',['A dentro de B','No A dentro de B'])]),
  'independencia-sucesos':tree('Conocer B: comparar la distribución de A',[branch('Antes de conocer B',['A','No A']),branch('Dentro de B',['A y B','No A y B'])]),
  'bayes-diagnostico':tree('El signo de la prueba puede venir de dos grupos',[branch('Infección',['Positivo verdadero','Negativo falso']),branch('Sin infección',['Positivo falso','Negativo verdadero'])]),
  'variable-cdf':tree('Una regla agrupa resultados y una CDF los acumula',[branch('Resultados de Omega',['Valor X']),branch('Umbral x',['Valores que no superan x'])]),
  masa:trials('El soporte tiene valores separados; no se rellenan los huecos',['Valor posible','Otro valor posible','Fuera del soporte: sin masa']),
  densidad:tree('Una probabilidad continua necesita anchura',[branch('Intervalo',['Área de densidad']),branch('Punto aislado',['Anchura cero'])]),
  esperanza:tree('El centro pondera los resultados por sus masas',[branch('Resultados posibles',['Valor por masa','Reunir aportaciones'])]),
  varianza:tree('Las distancias al centro se cuadran antes de ponderar',[branch('Media',['Desviación negativa','Desviación positiva']),branch('Cuadrados',['Contribuciones no negativas'])]),
  'momentos-transformaciones':tree('Transformar los valores, no sus probabilidades',[branch('Valor original y masa',['Valor transformado con la misma masa'])]),
  'bernoulli-binomial':trials('Un ensayo Bernoulli tiene dos resultados',['No germina: 0','Germina: 1']),
  poisson:tree('La media de un recuento pertenece a una exposición',[branch('Ventana observada',['Tasa estable','Duración o volumen'])]),
  hipergeometrica:tree('La colección se agota al extraer sin devolver',[branch('Lote finito',['Elementos de interés','Restantes']),branch('Muestra',['Retirados sin reemplazo'])]),
  'geometrica-negativa':tree('La condición de parada fija el último ensayo',[branch('Seguir observando',['Fallos','Éxitos aún insuficientes']),branch('Meta de éxitos',['Parar'])]),
  'uniforme-montecarlo':tree('Una uniforme asigna probabilidad por longitud',[branch('Ventana completa',['Intervalo solicitado','Resto de la ventana'])]),
  exponencial:tree('Una espera con riesgo constante no tiene plazo fijo',[branch('Tiempo ya esperado',['Espera adicional con el mismo mecanismo'])]),
  normal:tree('Centro, escala y área cumplen funciones distintas',[branch('Normal',['Centro mu','Desviación sigma positiva','Umbrales de área'])]),
  gamma:tree('Sumar esperas independientes de escala común',[branch('Tiempo total',['Espera de etapa','Otra etapa compatible'])]),
  'cauchy-weibull':tree('Dos modelos con soportes y momentos distintos',[branch('Cauchy',['Señal real','Centro sin esperanza']),branch('Weibull',['Tiempo no negativo','Riesgo según forma'])]),
  'calculo-modelos':tree('La consulta debe devolver el tipo de cantidad pedido',[branch('Valor',['Masa o altura']),branch('Umbral',['Área acumulada']),branch('Área',['Cuantil'])]),
  'familia-exponencial':tree('Datos fijos y parámetro candidato',[branch('Muestra',['Estadístico T']),branch('Candidatos',['Verosimilitud, no posterior'])]),
  'conjunta-discreta':tree('Dos medidas del mismo resultado',[branch('Una célula',['Fila de X','Columna de Y','Celda simultánea'])]),
  multinomial:tree('Un ensayo ocupa una sola categoría',[branch('Célula',['Reposo','Activada','Dañada']),branch('Lote',['Recuentos comparten un total fijo'])]),
  marginales:tree('Marginalizar reúne, no fija la otra medida',[branch('Y conservada',['Todos los X compatibles'])]),
  'conjunta-condicional':tree('La condición restringe y después normaliza',[branch('X conocida',['Valores compatibles de Y','Normalizar dentro del grupo o corte'])]),
  'normal-bivariante':tree('Un modelo conjunto contiene más que dos marginales',[branch('Misma célula',['Señal X','Señal Y','Coordinación rho'])]),
  'independencia-variables':tree('Comprobar todas las parejas, también las imposibles',[branch('Pareja (x, y)',['Masa conjunta','Producto de marginales'])]),
  'covarianza-matrices':tree('Centrar cada coordenada conserva la pareja',[branch('Una pareja',['Desviación de X','Desviación de Y','Producto con signo'])]),
  'combinaciones-incorrelacion':tree('Una relación puede ser exacta sin ser lineal',[branch('X',['Y = X al cuadrado']),branch('Covarianza',['Solo asociación lineal'])])
};

const GLOBAL_STAGES = {
  proporciones:[
    stage("En uno germinan dieciocho semillas y en otro treinta.", bars('Germinaciones conocidas; falta su total',['Primer ensayo','Segundo ensayo'],[18,30],[0,1])),
    stage("En el primer ensayo sembramos setenta y dos semillas; las dieciocho germinadas están dentro de esas setenta y dos.", bars('Primera bandeja global: 18 de 72',['Germinan','Resto'],[18,54],[0])),
    stage("En el segundo ensayo sembramos doscientas.", bars('Segunda bandeja global: 30 de 200',['Germinan','Resto'],[30,170],[0])),
    stage("Cada miligramo contiene mil microgramos; por eso dos miligramos son dos mil microgramos.", tree('Relato global: misma masa, no tres miligramos',[branch('2 mg',['2000 microgramos'])]))
  ],
  algebra:[
    stage("Tres estados de un cultivo tienen pesos dos, tres y cinco.", bars('Pesos de este relato global',['Estado 1','Estado 2','Estado 3'],[2,3,5])),
    stage("Sustituimos para comprobarlo: las masas son dos décimas, tres décimas y una mitad.", bars('Mismas razones con total uno',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1,2])),
    stage("Un modelo deja una proporción restante igual a la exponencial de menos el tiempo dividido entre seis horas.", survival(6)),
    stage("Queremos el tiempo en que queda la mitad.", survival(6,{level:0.5}))
  ],
  funciones:[
    stage("Nuestra regla ge multiplica la entrada por dos y después suma uno.", tree('Regla global: dos operaciones',[branch('Entrada X',[branch('Multiplicar por 2',['Sumar 1'])])])),
    stage("Para la entrada tres sustituimos equis por tres en la regla completa: dos por tres más uno da siete.", scatter('Entradas y salidas de g(x) = 2x + 1',[[0,1],[1,3],[2,5],[3,7]],{highlight:[3],xLabel:'Entrada',yLabel:'Salida'})),
    stage("Una medida de brotes solo toma cero, dos o cinco, con masas una décima, seis décimas y tres décimas.", numberLine('Soporte separado del relato global',0,5,[],[0,2,5])),
    stage("Esos valores forman su soporte.", brood()),
    stage("Menos de tres admite cero y dos.", brood([0,1])),
    stage("Menos de dos excluye el dos, de modo que solo queda la masa del cero.", brood([0]))
  ],
  calculo:[
    stage("Imagina una duración entre cero y dos minutos, con densidad constante de medio por minuto.", density('Uniforme global entre 0 y 2',[[0,0.5],[2,0.5]],{support:[0,2]})),
    stage("Entre cero coma cuatro y uno coma dos la anchura es cero coma ocho minutos; las unidades de tiempo se cancelan.", density('Intervalo pedido',[[0,0.5],[2,0.5]],{shade:[0.4,1.2],support:[0,2]})),
    stage("Cambiamos a una densidad que vale te dividido entre dos desde cero hasta dos, y cero fuera.", density('Otro modelo global: t/2',[[0,0],[2,1]],{support:[0,2]}))
  ],
  'regiones-matrices':[
    stage("Dos cultivos comparten una unidad de recurso.", triangle('Capacidad 1 del relato, no de los ejercicios')),
    stage("Fijamos equis en cero coma tres y despejamos la otra coordenada: i griega no puede superar uno menos cero coma tres.", triangle('Corte de X = 0,3',1,0.3)),
    stage("Una matriz organiza entradas por filas y columnas.", matrix('Matriz del relato global',[[4,1],[1,9]],[[0,1]]))
  ],
  sucesos:[
    stage("Elegimos una bacteria de una colección de cien: treinta llevan solo a, veinte solo be, diez ambos y cuarenta ninguno.", bars('Colección de este relato',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40])),
    stage("El suceso a reúne todas las que llevan a, incluidas las diez dobles.", bars('A incluye solo A y ambas',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0,2])),
    stage("La intersección exige ambos marcadores a la vez: solo las diez dobles.", bars('Intersección: ambas',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[2])),
    stage("La unión acepta al menos uno, también ambos.", bars('Unión: al menos una',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0,1,2]))
  ],
  axiomas:[
    stage("Tres estados excluyentes con probabilidades dos, tres y cinco décimas permiten reunir los dos primeros sumando: una mitad.", bars('Estados excluyentes del relato global',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1])),
    stage("Por complemento, la probabilidad de pasar los tres controles es al menos siete décimas.", bars('Cotas complementarias; no son probabilidades exactas',['Pasan: cota inferior','Algún fallo: cota superior'],[0.7,0.3],[0,1]))
  ],
  combinatoria:[
    stage("Hay cinco muestras distintas y necesitamos dos.", tubePairs(false)),
    stage("Para dos posiciones etiquetadas sin repetición hay cinco opciones y después cuatro.", tubePairs(true)),
    stage("Con cinco muestras y grupos de dos, veinte dividido entre dos da diez pares.", tubePairs(false)),
    stage("Si una muestra recibe tratamiento y otra es control, intercambiarlas sí cambia el diseño.", tubePairs(true)),
    stage("Si devolvemos la primera antes de la segunda elección, hay cinco posibilidades de nuevo.", tubePairs(true,true))
  ],
  condicionada:[
    stage("Eliminamos las sesenta incompatibles con esa información.", bars('Grupo A del relato: no es el filtro de 200 muestras',['A y B','A sin B'],[10,30],[0])),
    stage("Si invertimos y pedimos a dado be, cambia el denominador.", CONCEPTS.condicionada)
  ],
  'independencia-sucesos':[
    stage("La definición que no necesita dividir es que la probabilidad de la intersección coincide con el producto de las marginales.", tree('Criterio de independencia; todavía sin valores',[branch('Intersección',['Probabilidad conjunta']),branch('Marginales',['Producto de probabilidades'])])),
    stage("Con probabilidades cuatro décimas y tres décimas, el producto es doce centésimas.", matrix('Modelo independiente del relato',[[0.42,0.18],[0.28,0.12]],[[1,1]],['No A','A'],['No B','B'])),
    stage("Si el modelo asigna diez centésimas a ambas, la igualdad falla: hay dependencia.", matrix('Conjunta 0,10 con marginales 0,4 y 0,3',[[0.4,0.2],[0.3,0.1]],[[1,1]],['No A','A'],['No B','B'])),
    stage("La misma diferencia aparece al condicionar: diez centésimas entre cuatro décimas da un cuarto.", bars('Universo A para P(B dado A)',['A y B','A sin B'],[0.1,0.3],[0]))
  ],
  'bayes-diagnostico':[
    stage("En mil animales del modelo esperamos cien infectados y novecientos sanos.", bars('Previa del relato global',['Infectados','Sanos'],[100,900],[0,1])),
    stage("Nueve décimas de cien producen noventa positivos verdaderos; cinco centésimas de novecientos producen cuarenta y cinco falsos.", bars('Sensibilidad del relato: 90 de 100',['Positivos infectados','Infectados totales'],[90,100],[0])),
    stage("Son recuentos esperados, no un diagnóstico de animales identificados.", bars('Positivos globales, no los 80 y 90 de secciones',['Infectados +','Sanos +'],[90,45],[1])),
    stage("En total esperamos ciento treinta y cinco positivos.", bars('Universo positivo: 135 esperados',['Infectados +','Sanos +'],[90,45],[0,1]))
  ],
  'variable-cdf':[
    stage("Podemos contar brotes y obtener cero, dos o cinco.", numberLine('Valores del relato global; no 0, 1, 2 larvas',0,5,[],[0,2,5])),
    stage("Resultados biológicos distintos pueden dar el mismo recuento: para hallar su probabilidad reunimos todos los resultados originales que producen ese número.", brood()),
    stage("Con umbral tres entran cero y dos, pero no cinco.", brood([0,1])),
    stage("En cinco incorpora las tres décimas restantes y llega a uno.", brood([0,1,2])),
    stage("En dos vale seis décimas.", brood([1]))
  ],
  masa:[
    stage("Para tres estados nos dan pesos dos, tres y cinco.", bars('Pesos globales; no brotes 0, 2, 4',['Estado 1','Estado 2','Estado 3'],[2,3,5])),
    stage("La suma es diez, así que ce es una décima y las masas son dos, tres y cinco décimas.", bars('Masas de los tres estados globales',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5])),
    stage("Cualquiera de los dos primeros estados tiene probabilidad dos décimas más tres décimas, una mitad.", bars('Seleccionar los dos primeros',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1]))
  ],
  densidad:[
    stage("Un tiempo uniforme entre cero y dos minutos tiene altura medio por minuto dentro del soporte y cero fuera.", density('Relato: uniforme de altura 0,5',[[0,0.5],[2,0.5]],{support:[0,2]})),
    stage("Desde cero hasta medio minuto la anchura es medio y la altura también medio: obtenemos un cuarto.", density('Franja de medio minuto',[[0,0.5],[2,0.5]],{support:[0,2],shade:[0,0.5]})),
    stage("Si concentramos toda la probabilidad entre cero y medio minuto, la altura debe ser dos por minuto.", density('Nuevo soporte; altura 2',[[0,2],[0.5,2]],{support:[0,0.5]}))
  ],
  esperanza:[
    stage("Un recuento vale cero, uno o dos con probabilidades un cuarto, una mitad y un cuarto.", bars('Masas del relato global; no el ejemplo 0 o 4',['0','1','2'],[0.25,0.5,0.25])),
    stage("Al cuadrar el recuento obtenemos cero, uno y cuatro, con las mismas probabilidades.", bars('Cuadrados con las mismas masas',['0','1','4'],[0.25,0.5,0.25]))
  ],
  varianza:[
    stage("Su media es uno, igual que la de una variable que valiera siempre uno; necesitamos distinguirlas.", numberLine('Centro de referencia del relato',0,2,[],[1])),
    stage("Con cero, uno y dos, las desviaciones son menos uno, cero y uno.", bars('Desviaciones al centro uno',['X=0','X=1','X=2'],[-1,0,1])),
    stage("Sus cuadrados son uno, cero y uno; ahora ponderamos esas cantidades, no las desviaciones con signo.", bars('Distancias cuadradas',['X=0','X=1','X=2'],[1,0,1])),
    stage("Multiplicar por dos duplica las desviaciones y cuadruplica sus cuadrados.", bars('Distancias duplicadas; cuadrados por cuatro',['X=0','X=1','X=2'],[4,0,4]))
  ],
  'momentos-transformaciones':[
    stage("Con cero y dos equiprobables, la media es uno y el promedio de los cuadrados es dos.", bars('Modelo de este relato global',['0','2'],[0.5,0.5])),
    stage("Para la distribución de i griega igual a equis al cuadrado, seguimos qué entradas producen cada salida.", CONCEPTS['momentos-transformaciones'])
  ],
  'bernoulli-binomial':[
    stage("Si pe es una mitad, cada patrón pesa un octavo.", binomialMass(3,0.5)),
    stage("Tres patrones dan tres octavos.", trials('Los tres patrones son resultados diferentes',['110','101','011'],[0,1,2]))
  ],
  poisson:[
    stage("Un sensor registra llegadas de bacterias con tasa ideal de dos por minuto.", tree('Tasa del relato global',[branch('Sensor',['Dos llegadas esperadas por minuto'])])),
    stage("Observar tres minutos da seis llegadas esperadas, no dos.", poissonMass(6)),
    stage("Más de dos empieza en tres.", {...poissonMass(6),highlight:poissonMass(6).values.flatMap((_,index)=>index>2 ? [index] : [])})
  ],
  hipergeometrica:[
    stage("Hay ocho organismos, tres portadores y cinco no portadores.", bars('Lote global: N=8, K=3; no el lote de 12',['Portadores','No portadores'],[3,5])),
    stage("Para exactamente dos portadores hay tres maneras de elegir dos entre tres.", tree('Muestra global de cuatro',[branch('Seleccionar 4',['2 entre 3 portadores','2 entre 5 restantes'])])),
    stage("El soporte exige suficientes organismos de cada grupo.", numberLine('Soporte global limitado por las existencias',0,3,[],[0,1,2,3]))
  ],
  'geometrica-negativa':[
    stage("Con probabilidad una mitad, primer éxito en la tercera prueba significa dos fallos y un éxito.", trials('Primer éxito al final del tercer ensayo',['Fallo','Fallo','Éxito'],[2])),
    stage("Con un fallo antes del segundo éxito hay tres ensayos.", trials('Dos patrones; el éxito final está fijado',['FEE','EFE'],[0,1]))
  ],
  'uniforme-montecarlo':[
    stage("Una uniforme continua entre dos y seis minutos asigna igual probabilidad a intervalos de igual longitud dentro de esa ventana; no asigna masa positiva a cada instante.", density('Ventana global de 2 a 6',[[2,0.25],[6,0.25]],{support:[2,6]})),
    stage("Entre tres y cinco hay dos minutos de los cuatro disponibles, por lo que la probabilidad es una mitad.", density('Intervalo global de 3 a 5',[[2,0.25],[6,0.25]],{support:[2,6],shade:[3,5]})),
    stage("Una uniforme discreta es distinta: elegir uno de ene enteros equiprobables asigna masa uno entre ene a cada entero.", CONCEPTS['uniforme-montecarlo'])
  ],
  exponencial:[
    stage("En un proceso de llegadas homogéneo de Poisson, la espera hasta la siguiente llegada es exponencial.", survival(5)),
    stage("Para seguir esperando después de cinco minutos sustituimos tasa cero coma dos y tiempo cinco.", survival(5,{marker:5})),
    stage("Ya llevamos tres minutos sin llegada y preguntamos por esperar dos minutos adicionales.", numberLine('Tres conocidos y dos adicionales; no 10 y 5',0,5,[interval(0,3,'Ya esperado'),interval(3,5,'Espera adicional')],[3,5]))
  ],
  normal:[
    stage("Proponemos una normal de media cuarenta micrómetros y desviación cuatro.", normal('Media 40 y desviación 4 del relato',40,4)),
    stage("Cuarenta y ocho menos cuarenta, dividido entre cuatro, son dos desviaciones sobre el centro.", normal('Umbral 48',40,4,{marker:48})),
    stage("Treinta y seis está a menos una desviación y cuarenta y ocho a más dos.", normal('Intervalo del relato en unidades originales',40,4,{lower:36,upper:48})),
    stage("Un percentil invierte la pregunta: recibimos una probabilidad y buscamos una longitud.", normal('Percentil 95: buscar un umbral de área izquierda',40,4,{level:0.95})),
    stage("El nivel noventa y cinco por ciento corresponde al cuantil estándar uno coma seis cuatro cuatro ocho cinco.", normal('Cuantil estándar del 95 por ciento',0,1,{upper:1.64485,marker:1.64485,level:0.95})),
    stage("Deshacemos la tipificación multiplicando por cuatro y sumando cuarenta.", normal('Percentil 95: 46,58 micrómetros; área izquierda 0,95',40,4,{upper:40+4*1.64485,marker:40+4*1.64485,level:0.95}))
  ],
  gamma:[
    stage("Una detección necesita tres llegadas de un proceso homogéneo.", trials('Tres etapas globales; aún no es un plazo',['Espera 1','Espera 2','Espera 3'])),
    stage("Esa suma es gamma con forma tres y escala dos.", gammaDensity(3,2))
  ],
  'cauchy-weibull':[
    stage("Weibull describe tiempos no negativos con escala alfa y forma beta positivas.", tree('Nuevo modelo: tiempo no negativo y riesgo variable',[branch('Weibull',['Escala alfa','Forma beta'])])),
    stage("Con escala dos y forma dos, a tiempo dos el cociente es uno y su cuadrado también uno.", curve('Weibull global: escala 2, no escala 10',curvePoints(0,5,time=>Math.exp(-((time/2)**2))),'survival',{marker:2}))
  ],
  'calculo-modelos':[
    stage("En un recuento, una masa responde exactamente dos.", numberLine('Recuentos de la pregunta; sin masas inventadas',0,3,[],[0,1,2,3])),
    stage("La acumulada hasta dos reúne cero, uno y dos.", numberLine('No superar dos incluye el dos',0,3,[interval(0,2,'X como máximo 2')],[0,1,2,3])),
    stage("Más de dos empieza en tres y su complemento incluye dos.", numberLine('Más de dos excluye el dos',0,4,[interval(2,4,'X mayor que 2',[false,true])],[0,1,2,3,4]))
  ],
  'familia-exponencial':[
    stage("Observamos dos, cuatro y tres colonias en placas de igual exposición.", bars('Datos globales fijos; no los 0, 1, 2 de secciones',['Placa 1','Placa 2','Placa 3'],[2,4,3])),
    stage("La verosimilitud es el producto de las masas de los datos visto como función del parámetro.", curve('Verosimilitud de la muestra 2, 4, 3',curvePoints(0,7,rate=>Math.exp(-3*rate)*rate**9/288),'likelihood',{xLabel:'Lambda candidata'})),
    stage("La estimación de máxima verosimilitud es la media observada, tres.", curve('Máximo de esta muestra global',curvePoints(0,7,rate=>Math.exp(-3*rate)*rate**9/288),'likelihood',{marker:3,xLabel:'Lambda candidata'})),
    stage("Como ampliación, un modelo lineal generalizado Poisson puede relacionar el logaritmo de la media con una dosis.", CONCEPTS['familia-exponencial'])
  ],
  'conjunta-discreta':[
    stage("Usamos cero coma dos y cero coma tres en la fila equis cero, y cero coma uno y cero coma cuatro en la fila equis uno.", matrix('Tabla global, distinta de la tabla de secciones',[[0.2,0.3],[0.1,0.4]])),
    stage("Para equis uno e i griega uno seleccionamos solo la última celda: cero coma cuatro.", matrix('Celda simultánea',[[0.2,0.3],[0.1,0.4]],[[1,1]])),
    stage("La suma de la fila equis cero, en cambio, reúne las dos respuestas posibles de ese marcador.", matrix('Seleccionar la primera fila',[[0.2,0.3],[0.1,0.4]],[[0,0],[0,1]]))
  ],
  multinomial:[
    stage("Suponemos independencia entre células y probabilidades comunes una mitad, un cuarto y un cuarto.", bars('Probabilidades por célula del relato global',['Reposo','Activada','Dañada'],[0.5,0.25,0.25])),
    stage("Hay seis órdenes, porque tres factorial dividido entre tres factoriales de uno es seis.", trials('Seis secuencias del recuento 1, 1, 1',['RAD','RDA','ARD','ADR','DRA','DAR'],[0,1,2,3,4,5])),
    stage("Los recuentos deben ser enteros no negativos y sumar tres.", trials('Tres plazas globales, no cuatro',['Célula 1','Célula 2','Célula 3']))
  ],
  marginales:[
    stage("Usamos filas cero coma dos, cero coma tres, y cero coma uno, cero coma cuatro.", matrix('Tabla global: marginalizar sin fijar X',[[0.2,0.3],[0.1,0.4]],[[0,1],[1,1]])),
    stage("Tomamos densidad una mitad sobre el triángulo no negativo de capacidad dos.", {...triangle('Triángulo global: capacidad 2, densidad 0,5',2),density:0.5}),
    stage("Con equis entre cero y dos, i griega recorre de cero a dos menos equis.", density('Marginal global: (2-x)/2',[[0,1],[2,0]],{support:[0,2]}))
  ],
  'conjunta-condicional':[
    stage("Su fila contiene cero coma uno y cero coma cuatro y suma una mitad.", bars('Fila X=1 global, todavía sin normalizar',['Y=0','Y=1'],[0.1,0.4])),
    stage("Para i griega uno dividimos cero coma cuatro entre cero coma cinco: cero coma ocho.", bars('Probabilidades dentro de X=1',['Y=0','Y=1'],[0.2,0.8],[1])),
    stage("Fijar equis cero coma cinco deja i griega entre cero y uno coma cinco.", triangle('Corte global en X=0,5',2,0.5)),
    stage("La marginal es una mitad por esa longitud: tres cuartos.", density('Corte global normalizado de longitud 1,5',[[0,2/3],[1.5,2/3]],{support:[0,1.5]}))
  ],
  'normal-bivariante':[
    stage("Sus medias son doce y treinta, sus desviaciones dos y cuatro, y su correlación cero coma seis.", jointNormal('Modelo del relato global; no el de secciones',{meanX:12,meanY:30,sdX:2,sdY:4,rho:0.6})),
    stage("Observamos equis catorce, una desviación por encima de doce.", jointNormal('Corte global en X=14',{meanX:12,meanY:30,sdX:2,sdY:4,rho:0.6,cutX:14})),
    stage("Queremos superar treinta y cinco coma seis una vez conocido equis catorce.", normal('Normal del corte global: media 32,4; sd 3,2',32.4,3.2,{lower:35.6}))
  ],
  'independencia-variables':[
    stage("Consideremos dos filas iguales: cero coma dos y cero coma tres.", matrix('Tabla global independiente',[[0.2,0.3],[0.2,0.3]],[[0,0]])),
    stage("Con densidad conjunta, la factorización debe valer casi por todas partes en todo el plano, incluyendo donde la conjunta es cero.", CONCEPTS['independencia-variables']),
    stage("En el triángulo de capacidad dos, cada marginal es positiva entre cero y dos.", triangle('Soporte triangular global: capacidad 2',2))
  ],
  'covarianza-matrices':[
    stage("Tomemos dos parejas equiprobables: cero con uno y uno con tres.", scatter('Parejas equiprobables globales',[[0,1],[1,3]],{line:{slope:2,intercept:1}})),
    stage("Una mitad entre su producto da uno: las parejas cumplen exactamente i griega igual a dos equis más uno.", scatter('Asociación lineal exacta del relato',[[0,1],[1,3]],{line:{slope:2,intercept:1}})),
    stage("En la matriz de covarianzas ponemos las varianzas en diagonal y las covarianzas cruzadas fuera.", matrix('Covarianzas del relato; no [[9,6],[6,16]]',[[0.25,0.5],[0.5,1]],[[0,0],[1,1]]))
  ],
  'combinaciones-incorrelacion':[
    stage("La media de dos veces equis menos i griega es dos medias de equis menos una de i griega.", tree('Combinación del relato global',[branch('2X menos Y',['Coeficiente de X: 2','Coeficiente de Y: -1'])])),
    stage("Con varianzas cuatro y uno y covarianza una mitad, para dos equis menos i griega queda cuatro por cuatro más uno menos cuatro por una mitad: quince.", matrix('Covarianzas del ejemplo global',[[4,0.5],[0.5,1]])),
    stage("Toma equis menos uno, cero y uno con igual probabilidad y define i griega como su cuadrado.", scatter('Contraejemplo global discreto; no uniforme continua',[[-1,1],[0,0],[1,1]],{xLabel:'X',yLabel:'Y = X al cuadrado'}))
  ]
};

const decimal = text => Number(text.replace(',', '.'));
const numericList = text => text.split(/;\s*|,\s+/).map(decimal);

function readExplicitGiven(text, previous) {
  let match;
  const next = {...previous};
  if ((match = text.match(/^Se siembran (\d+) semillas y germinan (\d+)\./))) {
    next.model = 'part'; next.total = Number(match[1]); next.part = Number(match[2]);
  } else if ((match = text.match(/^Pesos: ([\d, ]+)\./))) {
    next.model = 'weights'; next.labels = ['Estado 1','Estado 2','Estado 3']; next.values = numericList(match[1]);
  } else if ((match = text.match(/^g\(x\) = (\d+) × x \+ (\d+)\./))) {
    next.model = 'function'; next.factor = Number(match[1]); next.base = Number(match[2]);
  } else if ((match = text.match(/^Capacidad total: (\d+) mg;/))) {
    next.model = 'region'; next.limit = Number(match[1]);
  } else if ((match = text.match(/^Se fija x = (\d+) mg\./))) {
    next.cut = Number(match[1]);
  } else if ((match = text.match(/^P\(A\) = ([\d,]+); P\(B\) = ([\d,]+)\./))) {
    next.model = 'events'; next.probabilityA = decimal(match[1]); next.probabilityB = decimal(match[2]);
  } else if ((match = text.match(/^P\(A ∩ B\), la probabilidad de ambos, vale ([\d,]+)\./))) {
    next.both = decimal(match[1]);
  } else if ((match = text.match(/^P\(X = 0\) = ([\d,]+); P\(X = 2\) = ([\d,]+); P\(X = 5\) = ([\d,]+)\./))) {
    next.model = 'mass'; next.labels = ['0','2','5']; next.values = match.slice(1).map(decimal);
  } else if ((match = text.match(/^Filas X = 0, 1; columnas Y = 0, 1\. Tabla: \[([\d,]+); ([\d,]+)\] y \[([\d,]+); ([\d,]+)\]\./))) {
    next.model = 'matrix'; next.values = [match.slice(1,3).map(decimal),match.slice(3).map(decimal)];
  } else if ((match = text.match(/^(\d+) células en total\./))) {
    next.model = 'event-counts'; next.total = Number(match[1]);
  } else if ((match = text.match(/^(\d+) presentan A, (\d+) presentan B y (\d+) presentan ambos marcadores\./))) {
    next.countA = Number(match[1]); next.countB = Number(match[2]); next.both = Number(match[3]);
  } else if ((match = text.match(/^(\d+) plantas; (\d+) tratadas\./))) {
    next.model = 'treatment'; next.total = Number(match[1]); next.treated = Number(match[2]);
  } else if ((match = text.match(/^([\d,]+) tratadas se recuperan; ([\d,]+) no tratadas se recuperan\./))) {
    next.recoveredTreated = decimal(match[1]); next.recoveredUntreated = decimal(match[2]);
  } else if ((match = text.match(/^Prevalencia P\(I\) = ([\d,]+)\./))) {
    next.model = 'bayes'; next.prevalence = decimal(match[1]);
  } else if ((match = text.match(/^Sensibilidad P\(\+ \| I\) = ([\d,]+)\./))) {
    next.sensitivity = decimal(match[1]);
  } else if ((match = text.match(/^Tasa de falsos positivos P\(\+ \| no I\) = ([\d,]+); especificidad = ([\d,]+)\./))) {
    next.falsePositive = decimal(match[1]); next.specificity = decimal(match[2]);
  } else if ((match = text.match(/^P\(X=0\)=c, P\(X=1\)=(\d+)c, P\(X=2\)=(\d+)c\./))) {
    next.model = 'weights'; next.labels = ['0','1','2']; next.values = [1,...match.slice(1).map(Number)];
  } else if ((match = text.match(/^b = (\d+); umbral t = ([\d,]+)\./))) {
    next.model = 'linear-density'; next.limit = Number(match[1]); next.threshold = decimal(match[2]);
  } else if ((match = text.match(/^n = (\d+) semillas, probabilidad de germinación p = ([\d,]+), k = (\d+)\./))) {
    next.model = 'binomial'; next.size = Number(match[1]); next.probability = decimal(match[2]); next.count = Number(match[3]);
  } else if ((match = text.match(/^Tasa: (\d+) llegadas por minuto; ventana: (\d+) minutos\./))) {
    next.model = 'poisson'; next.rate = Number(match[1]); next.duration = Number(match[2]);
  } else if ((match = text.match(/^k = (\d+); soporte X/))) {
    next.count = Number(match[1]);
  } else if ((match = text.match(/^Media μ = ([\d,]+) micrómetros; desviación típica σ = ([\d,]+) micrómetros/))) {
    next.model = 'normal'; next.mean = decimal(match[1]); next.sd = decimal(match[2]);
  } else if ((match = text.match(/^Intervalo: \[([\d,]+), ([\d,]+)\]; soporte teórico/))) {
    next.lower = decimal(match[1]); next.upper = decimal(match[2]);
  } else if ((match = text.match(/^Ventana \[([\d,]+), ([\d,]+)\] minutos; intervalo solicitado \[([\d,]+), ([\d,]+)\]\./))) {
    next.model = 'uniform'; [next.lower,next.upper,next.from,next.to] = match.slice(1).map(decimal);
  } else if ((match = text.match(/^Tasa λ = ([\d,]+) por minuto; espera media = ([\d,]+) minutos\./))) {
    next.model = 'exponential'; next.rate = decimal(match[1]); next.scale = decimal(match[2]);
  } else if ((match = text.match(/^Tiempo ya transcurrido t = (\d+); espera adicional s = (\d+) minutos/))) {
    next.elapsed = Number(match[1]); next.extra = Number(match[2]);
  } else if ((match = text.match(/^Probabilidad de éxito p = ([\d,]+); k = (\d+) ensayos\./))) {
    next.model = 'waiting-trials'; next.probability = decimal(match[1]); next.size = Number(match[2]);
  } else if ((match = text.match(/^N=(\d+) organismos, K=(\d+) portadores, n=(\d+) extracciones, k=(\d+)\./))) {
    next.model = 'finite'; next.population = Number(match[1]); next.marked = Number(match[2]); next.size = Number(match[3]); next.count = Number(match[4]);
  } else if ((match = text.match(/^Forma k = (\d+); escala α = ([\d,]+) minutos; tasa r = 1\/α = ([\d,]+) por minuto\./))) {
    next.model = 'gamma'; next.shape = Number(match[1]); next.scale = decimal(match[2]);
  } else if ((match = text.match(/^Umbral t = ([\d,]+) minutos; soporte T/))) {
    next.threshold = decimal(match[1]);
  } else if ((match = text.match(/^Tabla de recuentos: X=0: \[(\d+),(\d+)\]; X=1: \[(\d+),(\d+)\]\./))) {
    next.model = 'matrix'; next.values = [match.slice(1,3).map(Number),match.slice(3).map(Number)];
  } else if ((match = text.match(/^Tabla de probabilidades, filas X=0,1 y columnas Y=0,1: \[([\d,]+), ([\d,]+)\]; \[([\d,]+), ([\d,]+)\]\./))) {
    next.model = 'matrix'; next.values = [match.slice(1,3).map(decimal),match.slice(3).map(decimal)];
  } else if ((match = text.match(/^X toma −(\d+), 0, (\d+) con probabilidades ([\d,]+), ([\d,]+), ([\d,]+)\./))) {
    next.model = 'square'; next.inputs = [-Number(match[1]),0,Number(match[2])]; next.values = match.slice(3).map(decimal);
  } else if ((match = text.match(/^X=(-?[\d,]+) o X=(-?[\d,]+) unidades, cada uno con probabilidad 1\/2\./))) {
    next.model = 'transform'; next.inputs = match.slice(1).map(decimal);
  } else if ((match = text.match(/^Hay n=(\d+) aislados distintos y se seleccionan r=(\d+)\./))) {
    next.model = 'combinatorics'; next.size = Number(match[1]); next.selected = Number(match[2]);
  } else if ((match = text.match(/^En otro lote hay (\d+) etiquetas: (\d+) de especie A, (\d+) de B y (\d+) de C;/))) {
    next.multiplicities = match.slice(2).map(Number);
  } else if ((match = text.match(/^r=(\d+) éxitos, p=([\d,]+), k=(\d+) fallos\./))) {
    next.model = 'negative'; next.successes = Number(match[1]); next.probability = decimal(match[2]); next.failures = Number(match[3]);
  } else if ((match = text.match(/^Localización x₀=(-?[\d,]+) y escala γ=([\d,]+),/))) {
    next.model = 'cauchy'; next.location = decimal(match[1]); next.scale = decimal(match[2]);
  } else if ((match = text.match(/^Intervalo \[(-?[\d,]+),(-?[\d,]+)\]\./))) {
    next.lower = decimal(match[1]); next.upper = decimal(match[2]);
  } else if ((match = text.match(/^Escala α=(\d+) horas; forma β=([\d,]+),/))) {
    next.model = 'weibull'; next.scale = Number(match[1]); next.shape = decimal(match[2]);
  } else if ((match = text.match(/^Umbral t=([\d,]+) horas; cuantil solicitado u=([\d,]+)\./))) {
    next.threshold = decimal(match[1]); next.level = decimal(match[2]);
  } else if ((match = text.match(/^n=(\d+); \(p_A,p_B,p_C\)=\(([\d,]+); ([\d,]+); ([\d,]+)\),/))) {
    next.model = 'multinomial'; next.size = Number(match[1]); next.values = match.slice(2).map(decimal);
  } else if ((match = text.match(/^Recuentos observados \(x_A,x_B,x_C\)=\((\d+), (\d+), (\d+)\),/))) {
    next.counts = match.slice(1).map(Number);
  } else if ((match = text.match(/^Medias μ_X=(\d+), μ_Y=(\d+); desviaciones σ_X=(\d+), σ_Y=(\d+), en unidades de señal; ρ=(-?[\d,]+)\./))) {
    next.model = 'joint-normal'; [next.meanX,next.meanY,next.sdX,next.sdY,next.rho] = match.slice(1).map(decimal);
  } else if ((match = text.match(/^Se fija X=x=(\d+); umbral de Y: c=([\d,]+)\./))) {
    next.cutX = Number(match[1]); next.threshold = decimal(match[2]);
  } else if ((match = text.match(/^Soporte: x≥0, y≥0, x\+y≤a=(\d+) mg;/))) {
    next.model = 'region'; next.limit = Number(match[1]);
  } else if ((match = text.match(/^Se fija x=([\d,]+) mg; b=([\d,]+) mg para el evento X\+Y≤b; d=([\d,]+) mg para el corte Y>d\./))) {
    [next.cut,next.subset,next.threshold] = match.slice(1).map(decimal);
  } else if ((match = text.match(/^Recuentos observados enteros: \[([\d, ]+)\]; n=(\d+) ventanas\./))) {
    next.model = 'sample'; next.values = numericList(match[1]); next.size = Number(match[2]);
  }
  return match ? next : previous;
}

function finiteState(state) {
  if (typeof state === 'number') return Number.isFinite(state);
  return !state || typeof state !== 'object' || Object.values(state).every(finiteState);
}

function figureFromGiven(state) {
  if (!finiteState(state)) return null;
  switch (state.model) {
    case 'part': return state.total > 0 && state.part >= 0 && state.part <= state.total ? bars('Semillas de este ejercicio; parte dentro del total',['Germinadas','Restantes'],[state.part,state.total-state.part],[0]) : null;
    case 'weights':
    case 'mass': {
      if (!state.values?.every(value=>Number.isFinite(value) && value>=0)) return null;
      const total = state.values.reduce((sum,value)=>sum+value,0);
      if (!(total>0) || state.model === 'mass' && Math.abs(total-1)>1e-10) return null;
      return state.normalized ? bars('Masas ya normalizadas del ejercicio',state.labels,state.values.map(value=>value/total)) : bars(state.model === 'weights' ? 'Pesos del ejercicio; aún sin normalizar' : 'Masas sobre el soporte del ejercicio',state.labels,state.values);
    }
    case 'function': return tree('Regla del ejercicio, sin anticipar la salida',[branch('Entrada permitida',[branch(`Multiplicar por ${state.factor}`,[`Sumar ${state.base}`])])]);
    case 'region': return state.limit > 0 && (state.cut === undefined || state.cut>=0 && state.cut<=state.limit) ? triangle('Capacidad de este ejercicio',state.limit,state.cut,state.subset === undefined ? undefined : [[[0,0],[state.subset,0],[0,state.subset]]]) : null;
    case 'events': {
      const {probabilityA:probabilityA,probabilityB:probabilityB,both} = state;
      if (!(probabilityA>=0 && probabilityA<=1 && probabilityB>=0 && probabilityB<=1)) return null;
      if (both === undefined) return tree('Probabilidades dadas, sin suponer independencia',[branch(`P(A) = ${probabilityA}`,[]),branch(`P(B) = ${probabilityB}`,[])]);
      const values = [1-probabilityA-probabilityB+both,probabilityB-both,probabilityA-both,both];
      return values.every(value=>value>=-1e-12 && value<=1) ? matrix('Masas del ejercicio: intersección y marginales',[[values[0],values[1]],[values[2],values[3]]],[],['No A','A'],['No B','B']) : null;
    }
    case 'event-counts': {
      if (state.countA === undefined) return tree('Cultivo de este ejercicio',[branch(`Total ${state.total}`,['A y no A','B y no B'])]);
      const values = [state.countA-state.both,state.countB-state.both,state.both,state.total-state.countA-state.countB+state.both];
      return values.every(value=>Number.isFinite(value) && value>=0) ? bars('Regiones disjuntas de este cultivo',['Solo A','Solo B','Ambos','Ninguno'],values) : null;
    }
    case 'treatment': return state.recoveredTreated === undefined ? bars('Grupos del estudio, sin causalidad supuesta',['Tratadas','No tratadas'],[state.treated,state.total-state.treated]) : matrix('Tratamiento y recuperación del ejercicio',[[state.recoveredTreated,state.treated-state.recoveredTreated],[state.recoveredUntreated,state.total-state.treated-state.recoveredUntreated]],[],['Tratadas','No tratadas'],['Recuperadas','No recuperadas']);
    case 'bayes': return state.sensitivity === undefined || state.falsePositive === undefined ? tree('Partición previa del ejercicio',[branch(`P(I) = ${state.prevalence}`,['Prueba dentro de infectados']),branch(`P(no I) = ${1-state.prevalence}`,['Prueba dentro de no infectados'])]) : matrix('Rutas ponderadas de este ejercicio',[[state.prevalence*state.sensitivity,state.prevalence*(1-state.sensitivity)],[(1-state.prevalence)*state.falsePositive,(1-state.prevalence)*(1-state.falsePositive)]],[],['Infección','Sin infección'],['Positivo','Negativo']);
    case 'matrix': return state.values.flat().every(value=>Number.isFinite(value) && value>=0) ? matrix('Tabla dada en este ejercicio',state.values) : null;
    case 'linear-density': return state.limit > 0 ? tree('Densidad creciente aún por normalizar',[branch(`Soporte [0, ${state.limit}]`,['f(x) = c por x',`Umbral ${state.threshold}`])]) : null;
    case 'binomial': return Number.isInteger(state.size) && state.size>0 && state.size<=200 && state.probability>=0 && state.probability<=1 ? binomialMass(state.size,state.probability) : null;
    case 'poisson': return state.rate>0 && state.duration>0 && state.rate*state.duration<=200 ? poissonMass(state.rate*state.duration) : null;
    case 'normal': return state.sd>0 ? normal('Modelo normal dado en este ejercicio',state.mean,state.sd,{...(state.lower === undefined ? {} : {lower:state.lower,upper:state.upper})}) : null;
    case 'uniform': return state.upper>state.lower ? density('Uniforme de la ventana de este ejercicio',[[state.lower,1/(state.upper-state.lower)],[state.upper,1/(state.upper-state.lower)]],{support:[state.lower,state.upper],shade:[state.from,state.to]}) : null;
    case 'exponential': return state.scale>0 ? survival(state.scale,state.elapsed === undefined ? {} : {marker:state.elapsed}) : null;
    case 'waiting-trials': return Number.isInteger(state.size) && state.size>0 && state.size<=100 && state.probability>0 && state.probability<=1 ? trials('k ensayos de referencia; resultados aún sin seleccionar',Array.from({length:state.size},(_,index)=>`Ensayo ${index+1}`)) : null;
    case 'finite': return state.population>=state.marked && state.marked>=0 && state.size<=state.population ? bars(`Lote del ejercicio: muestra ${state.size}, sin devolución`,['Portadores','Restantes'],[state.marked,state.population-state.marked]) : null;
    case 'gamma': return Number.isInteger(state.shape) && state.shape>0 && state.shape<=10 && state.scale>0 ? gammaDensity(state.shape,state.scale,state.threshold === undefined ? {} : {shade:[0,state.threshold]}) : null;
    case 'square': return scatter('Relación determinista de este ejercicio',state.inputs.map(value=>[value,value*value]),{xLabel:'X',yLabel:'Y = X al cuadrado'});
    case 'transform': return bars('Valores originales equiprobables del ejercicio',state.inputs.map(String),[0.5,0.5]);
    case 'combinatorics': return Number.isInteger(state.size) && state.size>0 && state.size<=100 ? trials(`Elegir ${state.selected} aislados: las posiciones importan solo si se etiquetan`,Array.from({length:state.size},(_,index)=>`Aislado ${index+1}`)) : null;
    case 'negative': return state.successes>0 && state.successes<=100 ? tree('Meta entera de este ejercicio',[branch(`${state.successes} éxitos; p = ${state.probability}`,['Último ensayo: éxito',`Fallos pedidos: ${state.failures}`])]) : null;
    case 'cauchy': return state.scale>0 ? density('Cauchy del ejercicio; sin media ni varianza',curvePoints(state.location-8*state.scale,state.location+8*state.scale,value=>1/(Math.PI*state.scale*(1+((value-state.location)/state.scale)**2))),state.lower === undefined ? {} : {shade:[state.lower,state.upper]}) : null;
    case 'weibull': return state.scale>0 && state.shape>0 ? curve('Supervivencia Weibull de este ejercicio',curvePoints(0,3*state.scale,time=>Math.exp(-((time/state.scale)**state.shape))),'survival',state.threshold === undefined ? {} : {marker:state.threshold}) : null;
    case 'multinomial': return state.values?.every(value=>value>=0) ? bars(`Probabilidades por célula; total de ${state.size} ensayos`,['A','B','C'],state.values) : null;
    case 'joint-normal': return state.sdX>0 && state.sdY>0 && Math.abs(state.rho)<1 ? jointNormal('Contornos de la normal conjunta de este ejercicio',{meanX:state.meanX,meanY:state.meanY,sdX:state.sdX,sdY:state.sdY,rho:state.rho,...(state.cutX === undefined ? {} : {cutX:state.cutX})}) : null;
    case 'sample': return state.values?.every(value=>Number.isInteger(value) && value>=0) ? bars('Datos Poisson fijos del ejercicio; no una posterior',state.values.map((_,index)=>`Ventana ${index+1}`),state.values) : null;
    default: return null;
  }
}

function focusQuestion(context, question, state) {
  if (state.model === 'waiting-trials' && context.kind === 'trials') {
    if (question === 'Calcula P(T = k).') return trials('El primer éxito ocurre en el último ensayo',Array.from({length:state.size},(_,index)=>index===state.size-1 ? 'Éxito' : 'Fallo'),[state.size-1]);
    if (question === 'Calcula P(T > k).') return trials('Seguir esperando exige k fallos, sin éxito aún',Array.from({length:state.size},()=>'Fallo'),Array.from({length:state.size},(_,index)=>index));
  }
  if (state.model === 'normal' && context.kind === 'normal') {
    const percentile = question.match(/^Calcula el percentil (\d+(?:[.,]\d+)?) de X\.$/);
    if (percentile) return normal('Buscar un umbral del área indicada en este ejercicio',state.mean,state.sd,{level:decimal(percentile[1])/100});
  }
  if (state.model === 'uniform' && question === 'Calcula E[X].' && context.kind === 'curve') {
    const {shade,...unshaded} = context;
    return unshaded;
  }
  if (state.model === 'exponential' && question === 'Calcula P(T > t+s | T > t).' && state.elapsed>0 && state.extra>0) return state.waitingReduced ? survival(state.scale,{marker:state.extra}) : numberLine('Condición transcurrida y espera adicional del ejercicio',0,state.elapsed+state.extra,[interval(0,state.elapsed,'Ya esperado'),interval(state.elapsed,state.elapsed+state.extra,'Espera adicional')],[state.elapsed,state.elapsed+state.extra]);
  if (context.kind === 'bars' && ['binomial','poisson'].includes(state.model) && Number.isInteger(state.count)) {
    let predicate;
    if (question === 'Calcula P(X = k).') predicate = index=>index===state.count;
    if (question === 'Calcula P(X ≤ k), incluyendo k.') predicate = index=>index<=state.count;
    if (question === 'Calcula P(X > k), sin incluir k.') predicate = index=>index>state.count;
    if (predicate) return {...context,highlight:context.values.flatMap((_,index)=>predicate(index) ? [index] : [])};
  }
  if (context.kind === 'matrix') {
    const selections = {
      'Calcula P(Y=1).':[[0,1],[1,1]],
      'Calcula P(Y=1 | X=1).':[[1,0],[1,1]],
      '¿Cuál es P(X = 1, Y = 0), verde presente y rojo ausente?':[[1,0]],
      '¿Cuál es P(X ≤ 0, Y ≤ 1), la acumulada en (0,1)?':[[0,0],[0,1]],
      '¿Qué probabilidad tiene un resultado positivo P(+)?':[[0,0],[1,0]],
      'Tras un positivo, ¿cuál es P(I | +)?':[[0,0],[1,0]],
      'Calcula P(R | T).':[[0,0],[0,1]],
      'Calcula P(T | R).':[[0,0],[1,0]]
    };
    if (selections[question]) return {...context,highlight:selections[question]};
  }
  if (state.model === 'mass') {
    if (question === '¿Cuánto vale F(3), la probabilidad de como máximo tres brotes?') return {...context,highlight:[0,1]};
    if (question === '¿Qué probabilidad hay de menos de dos brotes, sin incluir dos?') return {...context,highlight:[0]};
  }
  if (state.model === 'region' && question === 'Calcula P(Y>d | X=x).' && state.limit>state.cut) return density('Normalizar el corte del ejercicio antes de medir la cola',[[0,1/(state.limit-state.cut)],[state.limit-state.cut,1/(state.limit-state.cut)]],{support:[0,state.limit-state.cut],shade:[state.threshold,state.limit-state.cut]});
  if (state.model === 'joint-normal' && state.cutX !== undefined && question === 'Calcula P(Y>c | X=x).') return normal('Curva condicional del ejercicio, no la marginal',state.meanY+state.rho*state.sdY/state.sdX*(state.cutX-state.meanX),state.sdY*Math.sqrt(1-state.rho**2),{lower:state.threshold});
  return context;
}

function fromAuthoredStep(line, context, state, question) {
  if (state.model === 'uniform' && line.label === 'Usar la simetría del soporte') return density('Centro de la ventana de este ejercicio',[[state.lower,1/(state.upper-state.lower)],[state.upper,1/(state.upper-state.lower)]],{support:[state.lower,state.upper],marker:(state.lower+state.upper)/2});
  if (state.model === 'exponential' && line.label === 'Cancelar el tiempo transcurrido') {
    state.waitingReduced = true;
    return survival(state.scale,{marker:state.extra});
  }
  if (state.model === 'linear-density' && line.label === 'Área total igual a uno') state.normalized = true;
  if (state.model === 'linear-density' && state.normalized) {
    return density('Densidad creciente de este ejercicio, ya normalizada',[[0,0],[state.limit,2/state.limit]],{support:[0,state.limit],...(question === 'Calcula P(X = t), exactamente en el umbral.' ? {marker:state.threshold} : question === 'Calcula P(X ≤ t).' ? {shade:[0,state.threshold]} : {})});
  }
  if (state.model === 'weights' && ['Normalizar la masa','Hacer lo mismo en ambos lados','Escalar el peso','Revisar el total'].includes(line.label)) {
    const total = state.values.reduce((sum,value)=>sum+value,0);
    state.normalized = total>0;
    return total>0 ? bars('Masas normalizadas durante su explicación',state.labels,state.values.map(value=>value/total)) : context;
  }
  if (state.model === 'weights' && ['Promediar con los pesos normalizados','Segundo momento'].includes(line.label)) {
    const total = state.values.reduce((sum,value)=>sum+value,0);
    const power = line.label === 'Segundo momento' ? 2 : 1;
    return total>0 ? bars(power === 1 ? 'Aportaciones a la esperanza' : 'Aportaciones al segundo momento',state.labels,state.values.map((weight,index)=>Number(state.labels[index])**power*weight/total)) : context;
  }
  if (state.model === 'transform' && line.label === 'Transformar los resultados') return bars('Valores transformados; las masas se conservan',state.inputs.map(value=>String(value*value)),[0.5,0.5]);
  if (state.model === 'region' && line.label === 'Despejar la altura') return {...context,density:2/state.limit**2};
  if (state.model === 'region' && ['Normalizar el corte','Sustituir y comprobar el área','Integrar la densidad condicional'].includes(line.label) && state.limit>state.cut) {
    const width = state.limit-state.cut;
    return density('Densidad del corte de este ejercicio',[[0,1/width],[width,1/width]],{support:[0,width],...(question === 'Calcula P(Y>d | X=x).' ? {shade:[state.threshold,width]} : {})});
  }
  if (state.model === 'matrix' && line.label === 'Dividir la celda por la fila') {
    const total = state.values[1].reduce((sum,value)=>sum+value,0);
    return total>0 ? bars('Distribución dentro de la fila conocida',['Y=0','Y=1'],state.values[1].map(value=>value/total),[1]) : context;
  }
  if (state.model === 'sample' && line.label === 'Sustituir la muestra') {
    const total = state.values.reduce((sum,value)=>sum+value,0);
    const maximum = Math.max(1,2*total/state.size);
    let logFactorials = 0;
    for (const value of state.values) for (let factor=2;factor<=value;factor++) logFactorials += Math.log(factor);
    return curve('Verosimilitud para la misma muestra fija',curvePoints(0,maximum,rate=>rate === 0 ? total === 0 ? Math.exp(-logFactorials) : 0 : Math.exp(total*Math.log(rate)-state.size*rate-logFactorials)),'likelihood',{marker:total/state.size,xLabel:'Lambda candidata'});
  }
  if (state.model === 'cauchy' && line.label === 'Resolver la acumulada central') return {...context,marker:state.location};
  return context;
}

function fromAuthoredPlot(line) {
  const plot = line.plot;
  if (!plot?.points?.length || !plot.points.every(point=>point.length===2 && point.every(Number.isFinite))) return null;
  if (plot.xLabel === 'Recurso x' && plot.yLabel === 'Recurso y' && plot.points.length === 2) {
    const limit = Math.max(...plot.points.flat());
    return triangle(line.label || 'Región dada por la fuente',limit,plot.cut);
  }
  const measures = {'Densidad (1/min)':'density','Densidad estándar':'density','Área entre −1 y 2':'density','S(t): seguir esperando':'survival','Salida g(x)':'function'};
  return curve(line.label || 'Curva de la escena',clone(plot.points),measures[plot.yLabel] || 'function',{xLabel:plot.xLabel || 'x',yLabel:plot.yLabel || 'y',...(plot.shade ? {shade:clone(plot.shade)} : {}),...(plot.marker === undefined ? {} : {marker:plot.marker})});
}

function diagramTargets(context) {
  if (context.kind === 'matrix') return {cells:context.highlight.length ? context.highlight : context.values.flatMap((row,rowIndex)=>row.map((_,columnIndex)=>[rowIndex,columnIndex]))};
  if (context.kind === 'bars' || context.kind === 'scatter') return {indices:context.highlight?.length ? context.highlight : (context.values || context.points).map((_,index)=>index)};
  if (context.kind === 'trials') return {indices:context.selected.length ? context.selected : context.outcomes.map((_,index)=>index)};
  if (context.kind === 'number-line') return {intervals:context.intervals.map((_,index)=>index), points:context.points};
  if (context.kind === 'region') return {part:context.cut ? 'cut' : context.polygons ? 'polygons' : 'support'};
  if (context.kind === 'joint-normal') return {part:context.cutX === undefined ? 'contours' : 'cut',...(context.highlightAxis ? {axis:context.highlightAxis} : {})};
  if (context.kind === 'normal') return {part:context.lower === undefined && context.upper === undefined ? 'density' : 'area'};
  if (context.kind === 'curve') return {part:context.shade ? 'area' : context.marker === undefined ? 'curve' : 'marker'};
  return {nodes:context.nodes.map((_,index)=>index)};
}

function phaseFor(scene, index, context, anchor) {
  const cue = scene.cues[index];
  const lineIndices = (scene.visual?.lines || []).flatMap((line,lineIndex)=>line.cue === index ? [lineIndex] : []);
  return {
    cue:index, text:cue.text, start:cue.start, end:cue.end,
    focus:{source:'cue', cue:index, text:cue.text, lineIndices, ...anchor, targets:diagramTargets(context)},
    context:clone(context)
  };
}

function resolveStages(scenes, stages) {
  return stages.map(entry => {
    const matches = scenes.flatMap(({scene,sceneIndex})=>scene.cues.flatMap((cue,index)=>cue.text.includes(entry.quote) ? [{scene:sceneIndex,cue:index}] : []));
    if (!entry.quote || matches.length !== 1) throw new Error(`${scenes[0].scene.title}: visual anchor must match exactly once: ${entry.quote}`);
    return {...entry,...matches[0]};
  });
}

function enrichScene(scene, stages, initialContext) {
  if (!stages?.length || !scene.cues?.length) return scene;
  if (!scene.story && !stages.some(entry=>scene.cues.some(cue=>cue.text.includes(entry.quote)))) return scene;
  const checkpoints = resolveStages([{scene,sceneIndex:0}],stages).sort((left, right) => left.cue - right.cue);
  if (new Set(checkpoints.map(entry=>entry.cue)).size !== checkpoints.length) throw new Error(`${scene.title}: visual anchors must use distinct cues`);
  if (checkpoints[0]?.cue !== 0) {
    if (!initialContext) return scene;
    checkpoints.unshift({cue:-1,quote:'',context:initialContext});
  }
  const phases = scene.cues.map((cue, index) => {
    const checkpoint = checkpoints.filter(entry => entry.cue <= index).at(-1);
    return phaseFor(scene,index,checkpoint.context,{anchorCue:checkpoint.cue,quote:checkpoint.quote,...(checkpoint.cue<0 ? {conceptual:true} : {})});
  });
  return {...scene, visual:{...scene.visual, context:clone(phases[0].context), phases}};
}

export function enrichLessonAnimation(animation, {lessonId, sectionId} = {}) {
  const result = clone(animation);
  const [parent,section] = typeof animation?.id === 'string' ? animation.id.split('--') : [];
  const resolvedLesson = lessonId || parent;
  const resolvedSection = sectionId || section;
  if (!resolvedSection) return enrichGlobalAnimation(animation,{lessonId:resolvedLesson});
  if (parent && parent !== resolvedLesson || section && section !== resolvedSection) return result;
  const stages = SECTION_VISUALS[`${resolvedLesson}/${resolvedSection}`];
  if (!stages || !Array.isArray(result?.steps)) return result;
  result.steps = result.steps.map(scene => enrichScene(scene, stages,scene.visual?.context || CONCEPTS[resolvedLesson]));
  return result;
}

export function enrichGlobalAnimation(animation, {lessonId = animation?.id} = {}) {
  if (!Object.hasOwn(CONCEPTS,lessonId) || !Array.isArray(animation?.steps) || animation.id && animation.id !== lessonId) return animation;
  const result = clone(animation);
  const storyScenes = result.steps.flatMap((scene,sceneIndex)=>['Una situación concreta','Vamos a razonarlo'].includes(scene.data?.chapter) ? [{scene,sceneIndex}] : []);
  const checkpoints = storyScenes.length ? resolveStages(storyScenes,GLOBAL_STAGES[lessonId] || []) : [];
  if (new Set(checkpoints.map(entry=>`${entry.scene}/${entry.cue}`)).size !== checkpoints.length) throw new Error(`${lessonId}: visual anchors must use distinct cues`);
  let state = {};
  let context = clone(CONCEPTS[lessonId]);
  let inExercise = false;
  let question = '';
  let activeCheckpoint;
  result.steps = result.steps.map((scene,sceneIndex) => {
    if (!scene.cues?.length) return scene;
    if (scene.data?.chapter === 'Ejercicios resueltos' && !inExercise || /^Ejercicio \d+:/.test(scene.title)) {
      state = {}; question = ''; inExercise = true; context = clone(CONCEPTS[lessonId]);
      activeCheckpoint = undefined;
    }
    if (scene.title === 'Qué nos llevamos de esta lección') {
      state = {}; question = ''; inExercise = false; context = clone(CONCEPTS[lessonId]);
      activeCheckpoint = undefined;
    }
    const authoredContext = scene.visual?.context;
    if (authoredContext) context = clone(authoredContext);
    const initialContext = clone(context);
    const phases = scene.cues.map((cue,index) => {
      const checkpoint = !inExercise && checkpoints.find(entry=>entry.scene===sceneIndex && entry.cue===index);
      if (checkpoint) {
        context = clone(checkpoint.context);
        activeCheckpoint = {scene:sceneIndex,cue:index,quote:checkpoint.quote};
      }
      if (inExercise && !authoredContext) {
        const objective = (scene.visual?.lines || []).find(line=>line.cue===index && line.label==='Objetivo');
        if (objective) {
          state = {};
          question = objective.value;
          context = clone(CONCEPTS[lessonId]);
        }
        const givenLines = (scene.visual?.lines || []).filter(line=>line.cue===index && ['Dato del problema','Dato original'].includes(line.label));
        for (const text of [cue.text,...givenLines.map(line=>line.value)]) {
          const next = readExplicitGiven(text || '',state);
          if (next !== state) {
            state = next;
            const inferred = figureFromGiven(state);
            state.validModel = Boolean(inferred);
            context = inferred || clone(CONCEPTS[lessonId]);
          }
        }
        if (cue.text.startsWith('Ahora la pregunta es esta: ')) {
          question = cue.text.slice('Ahora la pregunta es esta: '.length);
          delete state.waitingReduced;
          const base = figureFromGiven(state);
          if (base) context = base;
        }
        if (state.validModel) {
          context = focusQuestion(context,question,state);
          for (const line of scene.visual?.lines || []) if (line.cue === index) context = fromAuthoredStep(line,context,state,question);
        }
      }
      for (const line of scene.visual?.lines || []) if (!checkpoint && line.cue === index && line.plot) {
        const authored = fromAuthoredPlot(line);
        if (authored) {context = authored; activeCheckpoint = undefined;}
      }
      if (!finiteState(context)) {
        state.validModel = false;
        context = clone(CONCEPTS[lessonId]);
      }
      return phaseFor(scene,index,context,{anchorCue:index,quote:cue.text,scene:sceneIndex,mode:inExercise ? 'exercise' : 'recap',...(activeCheckpoint ? {checkpoint:{...activeCheckpoint}} : {})});
    });
    return {...scene,visual:{...scene.visual,context:initialContext,phases}};
  });
  return result;
}