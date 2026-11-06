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
    stage('En una bandeja germinan dieciocho', bars('Semillas germinadas; faltan los totales', ['Bandeja 1','Bandeja 2'], [18,30], [0,1])),
    stage('En la primera sembramos setenta y dos.', {...bars('Primera bandeja: germinadas y restantes', ['Germinadas','Restantes'], [18,54], [0]), total:72}),
    stage('Una proporción divide la parte entre su propio total.', {...bars('Parte y total pertenecen a la misma bandeja', ['Germinadas','Restantes'], [18,54], [0,1]), total:72}),
    stage('Esa proporción representa una de cada cuatro semillas.', bars('Un cuarto del mismo total', ['Germina','No germina'], [0.25,0.75], [0])),
    stage('En la segunda bandeja sembramos doscientas.', bars('Segunda bandeja: germinadas y restantes', ['Germinadas','Restantes'], [30,170], [0]))
  ],
  'proporciones/porcentaje-y-exposicion':[
    stage('¿Cómo contaríamos la primera proporción', bars('Misma bandeja antes de cambiar la escala', ['Germinan','Resto'], [18,54], [0])),
    stage('Decimos veinticinco por ciento.', bars('Misma proporción en escala de cien', ['Germinan','Resto'], [25,75], [0])),
    stage('Ahora un sensor registra seis llegadas en tres horas.', trials('Exposición: seis llegadas observadas en tres horas', ['Llegada','Llegada','Llegada','Llegada','Llegada','Llegada'], [0,1,2,3,4,5], [{label:'Ventana de 3 h',indices:[0,1,2,3,4,5]}])),
    stage('Una concentración divide una cantidad entre un volumen.', tree('Cantidad y exposición no son probabilidades', [branch('Colonias por mililitro',['Colonias contadas','Volumen muestreado'])])),
    stage('Si juntamos bandejas de tamaños distintos', bars('Sumar partes y totales antes de dividir', ['18 de 72','30 de 200'], [18/72,30/200], [0,1]))
  ],
  'proporciones/unidades-y-cotas':[
    stage('¿Tres miligramos se vuelven más sustancia', numberLine('Una misma masa, dos graduaciones', 0,3,[interval(0,3,'3 mg = 3000 microgramos')])),
    stage('Un miligramo contiene mil microgramos.', tree('Cada miligramo se subdivide sin añadir masa',[branch('1 mg',['1000 microgramos']),branch('3 mg',['3000 microgramos'])])),
    stage('Antes de aceptar un cálculo', numberLine('Cota de una probabilidad',0,1,[interval(0,1,'Probabilidad admisible')]))
  ],
  'algebra/balanza':[
    stage('Tres estados tienen pesos dos, tres y cinco.', bars('Pesos relativos, no probabilidades', ['Estado 1','Estado 2','Estado 3'], [2,3,5], [0,1,2])),
    stage('Primero sumamos los tres pesos.', bars('Los tres pesos comparten un factor', ['Estado 1','Estado 2','Estado 3'], [2,3,5], [0,1,2])),
    stage('Dividimos ambos miembros por diez.', bars('Mismas razones, ahora total uno', ['Estado 1','Estado 2','Estado 3'], [0.2,0.3,0.5], [0,1,2]))
  ],
  'algebra/comprobar-el-factor':[
    stage('Ya tenemos el factor.', bars('Peso cinco del último estado', ['Estado 1','Estado 2','Estado 3'], [2,3,5], [2])),
    stage('Obtenemos una mitad.', bars('Proporciones normalizadas', ['Estado 1','Estado 2','Estado 3'], [0.2,0.3,0.5], [2])),
    stage('Ahora comprobamos el total', bars('Los estados completan el total', ['Estado 1','Estado 2','Estado 3'], [0.2,0.3,0.5], [0,1,2])),
    stage('Una potencia repite multiplicaciones.', numberLine('Cuadrado y raíz no negativa',0,9,[interval(0,3,'Raíz no negativa'),interval(0,9,'Cuadrado')],[3,9]))
  ],
  'algebra/deshacer-exponencial':[
    stage('Una proporción restante sigue una exponencial', survival(6)),
    stage('¿Cuándo queda la mitad?', survival(6,{level:0.5})),
    stage('Multiplicamos los dos miembros por menos seis', survival(6,{level:0.5,marker:6*Math.log(2)})),
    stage('Sustituir ese tiempo', survival(6,{level:0.5,marker:6*Math.log(2)}))
  ],
  'funciones/entrada-y-salida':[
    stage('Una señal duplica la entrada', tree('La entrada recorre dos operaciones',[branch('Entrada x',[branch('Multiplicar por 2',['Sumar 1'])])])),
    stage('Primero multiplicamos dos por tres.', trials('Entrada 3: primero duplicar',['3','2 por 3','Sumar 1'],[1])),
    stage('Después añadimos una unidad.', trials('Entrada 3: ahora sumar la base',['3','6','7'],[2])),
    stage('Ge de tres nombra esa salida siete.', scatter('Regla g(x) = 2x + 1',[[0,1],[1,3],[2,5],[3,7]],{line:{slope:2,intercept:1},highlight:[3],xLabel:'Entrada x',yLabel:'Salida g(x)'}))
  ],
  'funciones/sumar-salidas':[
    stage('¿Cuánto suman las salidas de cero, uno y dos', bars('Entradas etiquetadas, alturas de las salidas',['g(0)','g(1)','g(2)'],[1,3,5],[0,1,2])),
    stage('El sumatorio, una sigma grande', bars('El índice recorre términos, no los sustituye',['a1 = 1','a2 = 3','a3 = 5'],[1,3,5],[0,1,2])),
    stage('Si una tabla etiqueta brotes cero, dos y cinco', numberLine('Etiquetas del soporte, no índices de fila',0,5,[],[0,2,5])),
    stage('Los intervalos con paréntesis', numberLine('Un extremo abierto excluye; uno cerrado incluye',0,5,[interval(0,2,'(0, 2]',[false,true])],[0,2,5]))
  ],
  'funciones/seleccionar-valores':[
    stage('Una planta puede tener cero, dos o cinco brotes.', brood()),
    stage('¿Qué entra en menos de tres?', brood([0,1])),
    stage('Menos de dos excluye el dos.', brood([0])),
    stage('Como máximo dos sí incluye el dos.', brood([0,1])),
    stage('Al menos dos incluye dos y cinco.', brood([1,2]))
  ],
  'calculo/franjas':[
    stage('Un tiempo está entre cero y dos minutos', density('Densidad uniforme; soporte 0 a 2',[[0,0.5],[2,0.5]],{support:[0,2]})),
    stage('¿Qué probabilidad queda entre cero coma cuatro y uno coma dos?', density('Franja solicitada, sin resolver el área',[[0,0.5],[2,0.5]],{shade:[0.4,1.2],support:[0,2]})),
    stage('Primero restamos los límites', numberLine('Anchura entre los dos límites',0,2,[interval(0.4,1.2,'Intervalo solicitado')],[0.4,1.2])),
    stage('Ahora multiplicamos la altura', density('Altura por anchura de la franja',[[0,0.5],[2,0.5]],{shade:[0.4,1.2],support:[0,2]}))
  ],
  'calculo/primitiva':[
    stage('Probemos otra altura:', density('f(t) = t/2; franjas cada vez más altas',[[0,0],[2,1]],{shade:[0,1],support:[0,2]})),
    stage('Una primitiva, ge,', curve('Primitiva G(t) = t al cuadrado / 4',curvePoints(0,2,time=>time*time/4),'cdf',{marker:1})),
    stage('Evaluamos ge en el límite inferior', curve('Evaluar también el extremo inferior',curvePoints(0,2,time=>time*time/4),'cdf',{marker:0})),
    stage('Restamos el valor inferior', density('Área entre ambos extremos',[[0,0],[2,1]],{shade:[0,1],support:[0,2]}))
  ],
  'calculo/pendiente-acumulada':[
    stage('¿Qué cambia cuando avanzamos un poco el umbral?', density('Altura local anterior: t/2',[[0,0],[2,1]],{marker:1,support:[0,2]})),
    stage('Para la altura anterior,', curve('Acumulada: t al cuadrado / 4',curvePoints(0,2,time=>time*time/4),'cdf',{marker:1})),
    stage('La derivada de esa acumulada', density('Derivada: altura local de la densidad',[[0,0],[2,1]],{marker:1,support:[0,2]})),
    stage('Un punto tiene anchura cero', numberLine('Un instante no es una franja',0,2,[interval(1,1,'Anchura cero')],[1]))
  ],
  'regiones-matrices/frontera':[
    stage('Repartimos una unidad de recurso', triangle('Capacidad compartida: x + y no supera 1')),
    stage('El punto de ocho décimas en cada cultivo queda fuera', {...triangle('El reparto (0,8; 0,8) no es admisible'),markers:[[0.8,0.8]]}),
    stage('Fijemos equis en tres décimas.', triangle('Fijar X deja un corte vertical',1,0.3)),
    stage('El corte permite a i griega', triangle('Y recorre de 0 a 0,7',1,0.3))
  ],
  'regiones-matrices/recorrer-triangulo':[
    stage('¿Qué tamaño tiene la región completa?', triangle('Triángulo, no el cuadrado completo')),
    stage('recorremos primero i griega', triangle('Primero recorrer Y dentro de un corte',1,0.3)),
    stage('Después movemos equis', {...triangle('Después reunir todos los cortes'),sweep:[0,1]}),
    stage('Si más adelante usamos una densidad constante', {...triangle('Altura por área completa volumen uno'),density:2})
  ],
  'regiones-matrices/orden-de-matriz':[
    stage('Medimos dos biomarcadores', tree('Un vector conserva el orden',[branch('Muestra',['Biomarcador 1: mu1','Biomarcador 2: mu2'])])),
    stage('En la diagonal colocamos las varianzas cuatro y nueve.', matrix('Diagonal: varianzas',[[4,1],[1,9]],[[0,0],[1,1]])),
    stage('La fila primera y columna segunda', matrix('Entradas cruzadas: covarianzas',[[4,1],[1,9]],[[0,1],[1,0]])),
    stage('Para multiplicar una matriz por un vector', matrix('Combinar la primera fila con (2, 3)',[[4,1],[1,9]],[[0,0],[0,1]]))
  ],
  'sucesos/resultados-y-sucesos':[
    stage('Observamos dos semillas etiquetadas.', membership('Dos semillas distintas: pertenencia, no equiprobabilidad')),
    stage('A será germina la primera.', membership('A selecciona primera y ambas',[[1,0],[3,0]])),
    stage('Exactamente una reúne primera y segunda.', membership('Exactamente una no es el mismo conjunto A',[[1,0],[2,1]]))
  ],
  'sucesos/traducir-conjuntos':[
    stage('En cien células hay treinta solo con a', bars('Cuatro regiones disjuntas de las células',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40])),
    stage('Intersección se lee ambas condiciones.', bars('Intersección: conservar ambas',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[2])),
    stage('Unión se lee al menos una', bars('Unión: incluir también las dobles',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0,1,2])),
    stage('Solo a pide a y no be', bars('Solo A excluye las dobles',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0])),
    stage('Ni a ni be exige los dos complementos.', bars('De Morgan: ninguno de los dos',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[3]))
  ],
  'sucesos/observabilidad':[
    stage('¿Podemos asignar probabilidad a cualquier pregunta', tree('Resultados y preguntas observables',[branch('Omega',[branch('Suceso A',['Resultados en A']),branch('Complemento de A',['Resultados fuera de A'])])])),
    stage('También contiene la unión de una lista numerable', tree('Cierre bajo unión numerable',[branch('Unión observable',['A1','A2','A3','...'])])),
    stage('De Morgan obtiene las intersecciones', tree('Intersección mediante complementos',[branch('Complemento de la unión',['Complemento de A','Complemento de B'])])),
    stage('El espacio de probabilidad reúne tres piezas', tree('Espacio de probabilidad',[branch('(Omega, A, P)',['Resultados','Sucesos observables','Medida de probabilidad'])]))
  ],
  'axiomas/probabilidades-coherentes':[
    stage('Un cultivo puede estar en tres estados excluyentes.', trials('El cultivo ocupa un solo estado',['Estado 1','Estado 2','Estado 3'])),
    stage('Cada probabilidad es no negativa', numberLine('Toda probabilidad está entre cero y uno',0,1,[interval(0,1,'Escala de probabilidad')])),
    stage('Con masas dos décimas, tres décimas y cinco décimas', bars('Estados excluyentes: reunir sin duplicar',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1])),
    stage('Si hay solapamientos', tree('Inclusión y exclusión, sin áreas proporcionales',[branch('Unión de A, B y C',['Sumar A, B y C','Restar AB, AC y BC','Reponer ABC'])]))
  ],
  'axiomas/solapamiento':[
    stage('En un modelo de marcadores,', bars('Regiones disjuntas implícitas en A, B y ambos',['Solo A','Solo B','Ambos','Ninguno'],[0.3,0.15,0.15,0.4],[0,1,2])),
    stage('Las células dobles entraron dos veces.', bars('Retirar una copia de la intersección',['Solo A','Solo B','Ambos','Ninguno'],[0.3,0.15,0.15,0.4],[2])),
    stage('El complemento de esa unión', bars('Lo que queda fuera de la unión',['Solo A','Solo B','Ambos','Ninguno'],[0.3,0.15,0.15,0.4],[3]))
  ],
  'axiomas/deducir-propiedades':[
    stage('¿Son el complemento y la inclusión reglas nuevas', tree('Un total repartido sin solapamientos',[branch('Omega',['A','Complemento de A'])])),
    stage('Omega y vacío son disjuntos', tree('El vacío no añade resultados',[branch('Omega',['Todos los resultados']),branch('Vacío',[])])),
    stage('Si a está contenido en be', tree('B contiene A y el resto disjunto',[branch('B',['A','B fuera de A'])])),
    stage('La segunda parte es no negativa.', tree('La inclusión impide que A pese más que B',[branch('B',['A','Resto de masa no negativa'])]))
  ],
  'axiomas/frecuencia':[
    stage('¿Seis observaciones positivas de diez', bars('Muestra observada, no secuencia inventada',['Positivas','Restantes'],[6,4],[0])),
    stage('Un indicador vale uno', trials('Codificación de cada observación',['No ocurre A: 0','Ocurre A: 1'],[1])),
    stage('Una racha no cambia la probabilidad', tree('Ensayo independiente: no existe compensación',[branch('Próximo ensayo',['Ocurre A','No ocurre A'])])),
    stage('Casos favorables entre casos posibles exige equiprobabilidad.', trials('Nombres de estados no fijan sus pesos',['Estado 1','Estado 2','Estado 3']))
  ],
  'combinatoria/posiciones':[
    stage('Cinco tubos deben ocupar dos posiciones etiquetadas.', tubePairs(true)),
    stage('Con repetición cada posición mantiene cinco opciones.', tubePairs(true,true)),
    stage('Para ordenar todos los tubos distintos', trials('Cinco posiciones, etiquetas diferentes',['A','B','C','D','E'],[0,1,2,3,4]))
  ],
  'combinatoria/quitar-orden':[
    stage('Ahora analizaremos dos tubos juntos', tubePairs(false)),
    stage('Las veinte asignaciones anteriores', tubePairs(true)),
    stage('Dividimos por las dos reordenaciones.', tubePairs(false)),
    stage('Sin reemplazo, el contenido disponible cambia', tree('Sin devolución disminuyen las opciones',[branch('Primer tubo: 5 opciones',['Segundo tubo: 4 opciones'])]))
  ],
  'combinatoria/multiplicidades':[
    stage('Tres etiquetas de especie a y dos de especie be', trials('Etiquetas iguales no crean nuevas secuencias',['A','A','A','B','B'],[],[{label:'A indistinguibles',indices:[0,1,2]},{label:'B indistinguibles',indices:[3,4]}])),
    stage('Las tres a se reordenan de seis maneras', trials('Reordenar dentro de una especie conserva el resultado',['A','A','A','B','B'],[0,1,2])),
    stage('Dividimos ciento veinte entre doce.', trials('Diez secuencias diferentes de las mismas etiquetas',['AAABB','AABAB','AABBA','ABAAB','ABABA','ABBAA','BAAAB','BAABA','BABAA','BBAAA'],[0,1,2,3,4,5,6,7,8,9]))
  ],
  'condicionada/grupo-conocido':[
    stage('De doscientas muestras, ochenta pasan un filtro', bars('El filtro divide la población',['Pasan','No pasan'],[80,120],[0])),
    stage('La información conocida descarta las otras ciento veinte.', bars('Solo el grupo conocido: 80 muestras',['Marcador','Sin marcador'],[24,56],[0,1])),
    stage('Dividimos veinticuatro entre ochenta', bars('Numerador dentro del nuevo universo',['Marcador','Sin marcador'],[24,56],[0]))
  ],
  'condicionada/invertir-grupo':[
    stage('¿Qué cambia si preguntamos por superar el filtro', tree('La intersección se conserva; el grupo de referencia cambia',[branch('Marcador',['Supera filtro: 24','Resto de marcadores: desconocido'])])),
    stage('Supongamos sesenta muestras con marcador', bars('Ahora el universo son los 60 marcadores',['Pasan filtro','No pasan'],[24,36],[0])),
    stage('La conjunta en toda la población', bars('Conjunta: volver al total de 200',['Ambos','Resto de la población'],[24,176],[0]))
  ],
  'condicionada/ruta-condicionada':[
    stage('Una ruta requiere pasar el filtro', tree('Cada etapa conserva las condiciones anteriores',[branch('Filtro',[branch('Viabilidad',['Señal'])])])),
    stage('Pasar el filtro tiene probabilidad cuatro décimas.', tree('Probabilidades condicionadas a lo ya recorrido',[branch('Filtro',[branch('Viabilidad',['Señal todavía no ponderada'],0.5)],0.4)])),
    stage('Dentro de quienes cumplen las dos primeras condiciones', tree('La señal usa toda la información previa',[branch('Filtro',[branch('Viabilidad',[{label:'Señal',weight:0.75}],0.5)],0.4)]))
  ],
  'independencia-sucesos/producto':[
    stage('Dos controles fallan con probabilidades', tree('Fallos de dos controles; se permite coincidencia',[branch('Control A',['Falla','No falla']),branch('Control B',['Falla','No falla'])])),
    stage('Si son independientes,', matrix('Modelo independiente: cuatro masas',[[0.56,0.24],[0.14,0.06]],[[1,1]],['No A','A'],['No B','B'])),
    stage('Incompatibilidad significa conjunta cero.', matrix('Incompatibles con las mismas marginales',[[0.5,0.3],[0.2,0]],[[1,1]],['No A','A'],['No B','B']))
  ],
  'independencia-sucesos/comprobar-informacion':[
    stage('Supongamos ahora que el fallo conjunto pesa una décima', matrix('Modelo dependiente; conservar marginales',[[0.6,0.2],[0.1,0.1]],[[1,1]],['No A','A'],['No B','B'])),
    stage('Dividimos la conjunta una décima', bars('Dentro de B; masas sin normalizar',['A y B','No A y B'],[0.1,0.2],[0])),
    stage('Obtenemos un tercio.', bars('Comparar P(A) con P(A dado B)',['Antes','Dado B'],[0.2,1/3],[0,1]))
  ],
  'independencia-sucesos/independencia-mutua':[
    stage('Lanzamos dos bits independientes y equiprobables.', matrix('Pertenencia de cada resultado a A, B y C',[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],[],['00','01','10','11'],['Primero 1','Segundo 1','Difieren'])),
    stage('La intersección de cualquier pareja pesa un cuarto', matrix('A y B coinciden solo en 11',[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],[[3,0],[3,1]],['00','01','10','11'],['A','B','C'])),
    stage('Entonces ce, difieren, no puede ocurrir.', matrix('En 11, C es falso: no existe la triple',[[0,0,0],[0,1,1],[1,0,1],[1,1,0]],[[3,2]],['00','01','10','11'],['A','B','C']))
  ],
  'bayes-diagnostico/rutas-positivas':[
    stage('Una prueba tiene sensibilidad ocho décimas', tree('Las dos probabilidades usan grupos distintos',[branch('Infectadas',[{label:'Positivo',weight:0.8}]),branch('No infectadas',[{label:'Negativo',weight:0.9}])])),
    stage('En mil plantas imaginarias', bars('Partición previa de las mil plantas',['Infectadas','No infectadas'],[100,900],[0,1])),
    stage('Sensibilidad, ese,', bars('Positivos dentro de las cien infectadas',['Positivas','Grupo infectado'],[80,100],[0])),
    stage('Especificidad, ce,', bars('Dentro de no infectadas: especificidad y complemento',['Negativo','Positivo falso'],[0.9,0.1],[1])),
    stage('Una décima de las novecientas', bars('Positivos de los dos orígenes, sin sumar aún',['Infectadas +','No infectadas +'],[80,90],[1])),
    stage('Sumamos ochenta y noventa.', bars('Reunir los dos orígenes de positivos',['Infectadas +','No infectadas +'],[80,90],[0,1]))
  ],
  'bayes-diagnostico/posterior':[
    stage('Ahora conocemos un positivo.', bars('Universo positivo: orígenes distintos',['Infectadas +','No infectadas +'],[80,90],[0,1])),
    stage('Dividimos ochenta entre ciento setenta.', bars('Numerador infectado dentro del grupo positivo',['Infectadas +','No infectadas +'],[80,90],[0])),
    stage('La previa pesa el grupo antes de la prueba.', tree('Direcciones de la información',[branch('Grupo previo',['Prueba dentro del grupo']),branch('Prueba observada',['Grupo dentro de positivos'])]))
  ],
  'bayes-diagnostico/negativos-y-prevalencia':[
    stage('¿Y si la prueba sale negativa?', diagnostic([[0,1],[1,1]])),
    stage('El valor predictivo negativo compara', bars('Solo negativos: denominador 830',['No infectadas -','Infectadas -'],[810,20],[0])),
    stage('Si bajamos a una centésima con la misma prueba', bars('Nueva población: prevalencia 1 %',['Verdaderos +','Falsos +'],[8,99],[0,1])),
    stage('Ahora el valor predictivo positivo es ocho entre ciento siete', bars('Positivos de la nueva población',['Verdaderos +','Falsos +'],[8,99],[0]))
  ],
  'variable-cdf/regla-observable':[
    stage('Un campo contiene una o varias larvas.', tree('Contar agrupa resultados sin asignar pesos',[branch('Identidades observadas',['Recuento de larvas X'])])),
    stage('Varios resultados detallados pueden producir el mismo recuento.', tree('Distintos resultados pueden compartir recuento',[branch('Dos larvas, identidades distintas',['X = 2']),branch('Otras dos larvas',['X = 2'])])),
    stage('La medibilidad exige', tree('El umbral define un suceso observable',[branch('Resultados de Omega',['X no supera x','X supera x'])]))
  ],
  'variable-cdf/escalones':[
    stage('Un modelo asigna cero, una y dos larvas', bars('Masas de las larvas',['0','1','2'],[0.2,0.5,0.3])),
    stage('Hasta uno incluye las masas de cero y uno.', bars('Acumular hasta uno, incluido',['0','1','2'],[0.2,0.5,0.3],[0,1])),
    stage('Entre uno y dos no entra un valor nuevo.', curve('CDF constante entre saltos',[[-0.5,0],[0,0],[0,0.2],[1,0.2],[1,0.7],[2,0.7],[2,1],[2.5,1]],'cdf',{marker:1.5})),
    stage('Al llegar a dos incorporamos tres décimas', bars('El último valor completa la masa',['0','1','2'],[0.2,0.5,0.3],[2]))
  ],
  'variable-cdf/intervalos-y-saltos':[
    stage('¿Qué parte queda entre cero excluido y dos incluido?', bars('Excluir cero; incluir uno y dos',['0','1','2'],[0.2,0.5,0.3],[1,2])),
    stage('Pe sub equis de uno nombra la masa en uno', bars('El salto en uno es su propia masa',['0','1','2'],[0.2,0.5,0.3],[1])),
    stage('Una absolutamente continua acumula una densidad sin saltos.', tree('No confundir categorías de distribuciones',[branch('Acumulada continua',['Absolutamente continua: integra densidad','Continua singular: no se desarrolla aquí'])]))
  ],
  'masa/agrupar-y-normalizar':[
    stage('Los brotes posibles son cero, dos y cuatro', bars('Pesos sobre brotes, no probabilidades',['0','2','4'],[1,3,1])),
    stage('Multiplicamos cada peso por ce.', mass([0,1,2])),
    stage('Si varios resultados producen dos brotes', mass([1]))
  ],
  'masa/intervalos-discretos':[
    stage('Con la tabla normalizada,', mass()),
    stage('Al menos dos incluye dos y cuatro.', mass([1,2])),
    stage('Más de dos solo incluye cuatro', mass([2])),
    stage('En uno o tres no hay masa.', numberLine('No llenar los huecos del soporte',0,4,[],[0,2,4]))
  ],
  'masa/interruptores':[
    stage('¿Podemos convertir tener marcador en un número?', matrix('Indicadores para los cuatro estados',[[0,0],[1,0],[0,1],[1,1]],[],['Ninguno','Solo A','Solo B','Ambos'],['IA','IB'])),
    stage('Para ambos marcadores multiplicamos sus indicadores.', matrix('Producto: solo ambos activan el indicador',[[0],[0],[0],[1]],[[3,0]],['Ninguno','Solo A','Solo B','Ambos'],['IA por IB'])),
    stage('Restamos una copia del producto', matrix('Unión: ambos siguen contando una vez',[[0],[1],[1],[1]],[[1,0],[2,0],[3,0]],['Ninguno','Solo A','Solo B','Ambos'],['Indicador de unión']))
  ],
  'densidad/altura-y-area':[
    stage('Una reacción dura entre cero y medio minuto', density('Altura 2; soporte de anchura 0,5',[[0,2],[0.5,2]],{support:[0,0.5]})),
    stage('Entre una décima y tres décimas', density('El área pertenece al intervalo',[[0,2],[0.5,2]],{shade:[0.1,0.3],support:[0,0.5]})),
    stage('Un punto exacto no tiene anchura', density('Punto: altura sin área',[[0,2],[0.5,2]],{marker:0.2,support:[0,0.5]}))
  ],
  'densidad/densidad-creciente':[
    stage('Otro modelo usa densidad ce por equis', tree('Triángulo de altura aún desconocida',[branch('Soporte de 0 a 1',['f(0) = 0','f(1) = c','Área total requerida: 1'])])),
    stage('La constante es dos.', density('Modelo normalizado f(x) = 2x',[[0,0],[1,2]],{support:[0,1]})),
    stage('A la derecha de medio', density('Mitad derecha del soporte',[[0,0],[1,2]],{shade:[0.5,1],support:[0,1]})),
    stage('Hasta medio, su valor acumulado', density('Área a la izquierda de medio',[[0,0],[1,2]],{shade:[0,0.5],support:[0,1]}))
  ],
  'densidad/acumulada-por-tramos':[
    stage('¿Qué vale la acumulada antes de cero y después de uno?', numberLine('Tres regiones del umbral',-0.25,1.25,[interval(-0.25,0,'Antes del soporte'),interval(0,1,'Dentro'),interval(1,1.25,'Después')])),
    stage('Antes de cero no hemos acumulado área;', curve('CDF completa, sin extrapolar el cuadrado',[[-0.25,0],...curvePoints(0,1,value=>value*value),[1.25,1]],'cdf',{support:[0,1]})),
    stage('Donde existe la derivada', density('Pendiente de la CDF: 2x dentro del soporte',[[0,0],[1,2]],{support:[0,1]}))
  ],
  'esperanza/promedio-ponderado':[
    stage('Un campo contiene cero o cuatro células activadas', bars('Resultados del modelo, no su centro',['0','4'],[0.5,0.5])),
    stage('Cero por una mitad aporta cero.', bars('Ponderar el resultado cero',['0','4'],[0.5,0.5],[0])),
    stage('Cuatro por una mitad aporta dos.', bars('Ponderar el resultado cuatro',['0','4'],[0.5,0.5],[1])),
    stage('la media del modelo es dos.', numberLine('El centro no tiene por qué ser un resultado',0,4,[interval(0,4,'Soporte separado: solo extremos')],[0,2,4]))
  ],
  'esperanza/transformar-valores':[
    stage('¿Y si la señal depende del cuadrado del recuento?', tree('Transformar los valores manteniendo sus masas',[branch('0; masa 1/2',['0 al cuadrado: 0']),branch('4; masa 1/2',['4 al cuadrado: 16'])])),
    stage('Las probabilidades no cambian.', bars('Mismas masas, nuevas etiquetas',['0','16'],[0.5,0.5],[1])),
    stage('Elevar la media dos al cuadrado', numberLine('Dos operaciones con centros diferentes',0,16,[interval(0,4,'Cuadrado de la media'),interval(0,8,'Media del cuadrado')],[4,8]))
  ],
  'esperanza/linealidad-y-colas':[
    stage('Cada célula aporta tres unidades de señal', tree('Señal: escalar y desplazar',[branch('X: 0 o 4',[branch('Multiplicar por 3',['Añadir base 1'])])])),
    stage('Después añadimos la unidad fija', bars('Señales posibles; mismas probabilidades',['1','13'],[0.5,0.5],[0,1])),
    stage('La esperanza de un producto no se separa en general.', tree('La operación necesita sus condiciones',[branch('Suma de esperanzas',['Linealidad']),branch('Producto de esperanzas',['Independencia e integrabilidad'])]))
  ],
  'varianza/distancias':[
    stage('Dos modelos pueden tener media uno', tree('Mismo centro no significa mismas distancias',[branch('Media 1',['Resultados a la izquierda','Resultados a la derecha'])])),
    stage('Equis toma cero, uno y dos', bars('Modelo con media 1',['0','1','2'],[0.25,0.5,0.25])),
    stage('Las desviaciones son menos uno, cero y uno.', bars('Desviaciones con signo; no son masas',['X=0','X=1','X=2'],[-1,0,1],[0,2])),
    stage('Elevamos esas desviaciones al cuadrado.', bars('Distancias cuadradas al centro',['X=0','X=1','X=2'],[1,0,1],[0,2])),
    stage('Ponderamos con las masas originales', bars('Aportaciones a la varianza',['X=0','X=1','X=2'],[0.25,0,0.25],[0,2]))
  ],
  'varianza/segundo-momento':[
    stage('¿Hay una cuenta equivalente?', bars('Mismo modelo: masas sobre 0, 1 y 2',['0','1','2'],[0.25,0.5,0.25])),
    stage('Los valores al cuadrado son cero, uno y cuatro.', bars('Cuadrados antes de ponderar',['0 al cuadrado','1 al cuadrado','2 al cuadrado'],[0,1,4],[0,1,2])),
    stage('Restamos ese cuadrado al segundo momento.', bars('Momentos que se restan, no probabilidades',['E[X al cuadrado]','Cuadrado de E[X]'],[1.5,1],[0,1]))
  ],
  'varianza/estirar-y-desplazar':[
    stage('Una longitud tiene media dos milímetros', numberLine('Centro 2 mm y una desviación a cada lado',1.4,2.6,[interval(1.7,2.3,'Una desviación: 0,3 mm')],[2])),
    stage('Multiplicar por mil', numberLine('Mismo tramo en micrómetros',1400,2600,[interval(1700,2300,'Una desviación: 300 micrómetros')],[2000])),
    stage('Añadir una constante mueve el centro', tree('Efectos sobre las distancias',[branch('Desplazar',['Centro cambia','Distancias no cambian']),branch('Escalar por a',['Distancias por |a|','Cuadrados por a al cuadrado'])]))
  ],
  'momentos-transformaciones/ordinarios-y-centrales':[
    stage('¿Qué cambia si una longitud se convierte en área?', tree('Potencias de valores o de desviaciones',[branch('Valor X',['Potencia ordinaria']),branch('X menos su media',['Potencia central'])])),
    stage('Con cero y dos equiprobables', bars('Dos resultados, masas iguales',['0','2'],[0.5,0.5],[0,1])),
    stage('El segundo momento ordinario vale dos', bars('Resúmenes diferentes de los mismos datos',['Ordinario segundo','Central segundo'],[2,1],[0,1]))
  ],
  'momentos-transformaciones/ejemplo-area':[
    stage('Una longitud uniforme entre cero y uno', density('Longitud uniforme; altura 1',[[0,1],[1,1]],{support:[0,1]})),
    stage('La integral de equis al cuadrado', curve('Integrando para E[X al cuadrado]',curvePoints(0,1,value=>value*value),'moment-integrand',{shade:[0,1]})),
    stage('El cuadrado de la media una mitad', numberLine('Media del cuadrado frente al cuadrado de la media',0,0.5,[],[0.25,1/3]))
  ],
  'momentos-transformaciones/estandarizacion-y-existencia':[
    stage('¿Podemos comparar formas medidas en unidades diferentes?', tree('Centrar y dividir por una escala compatible',[branch('Desviación a la media',[branch('Potencia k',['Dividir por sigma a la k'])])])),
    stage('Estiremos el ejemplo anterior:', bars('Dos valores equiprobables',['0','4'],[0.5,0.5],[0,1])),
    stage('las desviaciones son menos dos y dos.', bars('Desviaciones al centro 2',['X=0','X=4'],[-2,2],[0,1])),
    stage('Para el tercer momento central', bars('Cubos de las desviaciones; signos opuestos',['(-2) al cubo','2 al cubo'],[-8,8],[0,1])),
    stage('Dividimos ese tercer momento cero', bars('Desviaciones estandarizadas por sigma 2',['Izquierda','Derecha'],[-1,1],[0,1])),
    stage('Para el cuarto momento central', bars('Cuartas potencias, ahora ambas positivas',['(-2) a la cuarta','2 a la cuarta'],[16,16],[0,1])),
    stage('Ahora dividimos ese cuarto momento dieciséis', bars('Cuartas potencias divididas por sigma a la cuarta',['Izquierda','Derecha'],[1,1],[0,1])),
    stage('Si todas las lecturas valen dos', numberLine('Sin dispersión no se puede estandarizar',1,3,[],[2]))
  ],
  'momentos-transformaciones/cambio-de-distribucion':[
    stage('Como ampliación opcional,', powerCurve('Transformación Y = X al cuadrado',2,{xLabel:'Longitud X',yLabel:'Área Y'})),
    stage('No superar i griega equivale', powerCurve('Preimagen: el umbral de Y vuelve por la raíz',0.5,{xLabel:'Umbral y',yLabel:'Umbral de X'})),
    stage('La acumulada de equis uniforme', curve('CDF del cuadrado de la uniforme',curvePoints(0,1,value=>Math.sqrt(value)),'cdf')),
    stage('Si hay varias ramas', tree('Reunir todas las preimágenes',[branch('Salida positiva y',['Rama negativa de X','Rama positiva de X'])]))
  ],
  'bernoulli-binomial/ensayos':[
    stage('Sembramos tres semillas.', trials('Tres ensayos con identidad',['Semilla 1','Semilla 2','Semilla 3'])),
    stage('Para una semilla usamos un indicador', trials('Indicador de germinación',['No germina: 0','Germina: 1'])),
    stage('Con pe igual a una mitad,', trials('Patrones de exactamente dos germinaciones',['110','101','011'],[0,1,2])),
    stage('Reunir los tres da tres octavos.', binomialMass(3,0.5,[2]))
  ],
  'bernoulli-binomial/masa-y-cola':[
    stage('¿Cómo repetimos la cuenta para ene semillas', tree('Masa binomial: posiciones y peso de cada patrón',[branch('Patrones con k éxitos',['Elegir sus posiciones','Ponderar éxitos y fracasos'])])),
    stage('Como máximo ka suma todas las masas', tree('Las desigualdades seleccionan masas',[branch('Como máximo k',['0 hasta k, incluido']),branch('Al menos k',['k hasta n, incluido'])])),
    stage('Con tres semillas y una mitad,', binomialMass(3,0.5,[1,2,3]))
  ],
  'bernoulli-binomial/momentos-y-diseno':[
    stage('¿Cuántas germinaciones esperamos en promedio?', tree('Sumar indicadores, no prometer un resultado',[branch('Lote',['Indicador 1','Indicador 2','Indicador 3'])])),
    stage('Para tres semillas con pe una mitad', binomialMass(3,0.5)),
    stage('Compartir una maceta puede romper independencia', tree('Una fuente común no son tres réplicas',[branch('Maceta compartida',['Semilla 1','Semilla 2','Semilla 3'])]))
  ],
  'poisson/exposicion':[
    stage('Un sensor recibe una coma cinco apariciones por hora.', numberLine('Tasa 1,5 por hora; ventana observada 2 h',0,2,[interval(0,2,'Exposición, no recuento realizado')])),
    stage('Obtenemos tres apariciones esperadas.', poissonMass(3)),
    stage('Duplicar la exposición duplica lambda', tree('La ventana escala la media bajo tasa estable',[branch('Tasa estable',['Media = tasa por duración'])]))
  ],
  'poisson/masa-y-complemento':[
    stage('¿Qué probabilidad tiene ninguna aparición con lambda tres?', poissonMass(3,[0])),
    stage('Para cualquier entero ka no negativo', poissonMass(3)),
    stage('Más de dos comienza en tres.', {...poissonMass(3),highlight:Array.from({length:poissonMass(3).values.length-3},(_,index)=>index+3)}),
    stage('Complementamos la suma de cero, uno y dos', poissonMass(3,[0,1,2]))
  ],
  'poisson/aproximar-y-sumar':[
    stage('Cien ensayos independientes tienen probabilidad una centésima', tree('Dos modelos de una misma pregunta',[branch('Exacto',['Binomial n = 100, p = 0,01']),branch('Aproximado',['Poisson lambda = 1'])])),
    stage('La masa binomial exacta en cero', bars('Probabilidad exacta de ningún evento',['Binomial: cero'],[0.99**100],[0])),
    stage('La masa Poisson aproximada en cero', bars('No confundir cercanía con igualdad',['Binomial: cero','Poisson: cero'],[0.99**100,Math.exp(-1)],[1])),
    stage('Sumar dos Poisson independientes', tree('Sumar solo con independencia',[branch('Suma de recuentos',['Lambda X','Lambda Y','Lambda total = suma'])]))
  ],
  'hipergeometrica/sin-reemplazo':[
    stage('Un lote contiene doce semillas, cuatro de una variedad.', bars('Existencias antes de extraer sin devolución',['Variedad','Restantes'],[4,8])),
    stage('Para exactamente una de la variedad', tree('Selección de tres, no secuencia ordenada',[branch('Muestra de tamaño 3',['Elegir 1 de 4 de la variedad','Elegir 2 de 8 restantes'])])),
    stage('retirar una semilla cambia lo que queda disponible.', bars('Después de retirar una de la variedad',['Variedad','Restantes'],[3,8],[0]))
  ],
  'hipergeometrica/masa-finita':[
    stage('¿Con qué total comparamos las ciento doce muestras favorables?', tree('Partición de todas las muestras equiprobables',[branch('Elegir 3 de 12',['Muestras con exactamente 1 de la variedad','Las demás muestras'])])),
    stage('Dividimos favorables entre ese total', bars('Muestras, no semillas',['Favorables','Resto'],[112,108],[0])),
    stage('Antes de evaluar ka comprobamos existencias', numberLine('Soporte de K=4 en muestra n=3',0,3,[],[0,1,2,3]))
  ],
  'hipergeometrica/soporte-y-correccion':[
    stage('Otro lote tiene siete elementos de interés y solo dos restantes.', bars('Lote nuevo, sin reutilizar el anterior',['Interés','Restantes'],[7,2],[1])),
    stage('El mínimo de interés es cinco menos dos', numberLine('Cinco plazas: al menos tres de interés',0,5,[interval(3,5,'Soporte posible')],[3,4,5])),
    stage('La varianza añade una corrección por población finita.', tree('Retirar sin reemplazo reduce la dispersión',[branch('Varianza hipergeométrica',['Factor binomial','Corrección (N-n)/(N-1)'])]))
  ],
  'geometrica-negativa/primera-deteccion':[
    stage('Probamos colonias hasta detectar una señal.', tree('Parar en el primer éxito',[branch('Ensayo',['Éxito: parar',branch('Fallo',['Nuevo ensayo'])])])),
    stage('Si el primer ensayo detecta,', trials('Mismo resultado: cero fallos, un ensayo',['Éxito'],[0])),
    stage('Para dos fallos previos necesitamos', trials('El éxito final no se puede mover',['Fallo','Fallo','Éxito'],[2])),
    stage('Su esperanza de fallos', tree('Convenciones distintas',[branch('Fallos X',['Empieza en 0']),branch('Ensayos T = X+1',['Empieza en 1'])]))
  ],
  'geometrica-negativa/varios-exitos':[
    stage('Ahora paramos en el segundo éxito', tree('Meta: segundo éxito, no número fijo de intentos',[branch('Antes de la meta',['Primer éxito','Fallos posibles']),branch('Último ensayo',['Segundo éxito'])])),
    stage('Los patrones son fallo, éxito, éxito', trials('Un fallo antes del segundo éxito',['FEE','EFE'],[0,1])),
    stage('La combinación cuenta posiciones libres', trials('El último éxito permanece fijado',['Posiciones previas','Éxito final'],[0])),
    stage('La acumulada suma fallos desde cero', numberLine('Soporte de fallos: empieza en cero',0,4,[interval(0,4,'Enteros; continúa más allá')],[0,1,2,3,4]))
  ],
  'geometrica-negativa/memoria-y-momentos':[
    stage('¿Tres intentos fallidos hacen más probable acertar', trials('Historia conocida; siguiente ensayo sin deuda',['Fallo','Fallo','Fallo','Próximo'],[3])),
    stage('Para erre éxitos, la media de fallos', tree('Sumar esperas geométricas compatibles',[branch('Meta r',['Espera al éxito 1','...','Espera al éxito r'])])),
    stage('Para erre dos y pe una mitad', bars('Unidades distintas: fallos y ensayos',['Fallos medios','Ensayos medios'],[2,4],[0,1]))
  ],
  'geometrica-negativa/forma-real':[
    stage('¿Puede erre valer dos coma cinco?', tree('Forma real no es una parada literal',[branch('Binomial negativa',['Forma r real positiva','Recuento k entero no negativo'])])),
    stage('Probemos erre dos coma cinco y pe una mitad.', tree('Parámetros del ejemplo sobredisperso',[branch('r = 2,5; p = 0,5',['Fallos enteros desde cero','Sin meta literal de 2,5 éxitos'])])),
    stage('El cociente resulta dos coma cinco', bars('Media de fallos del ejemplo',['Media'],[2.5],[0])),
    stage('La varianza vale cinco,', bars('Sobredispersión; no son dos masas',['Media','Varianza'],[2.5,5],[1]))
  ],
  'uniforme-montecarlo/dos-uniformes':[
    stage('Elegimos un instante entre dos y seis minutos', density('Uniforme continua de 2 a 6',[[2,0.25],[6,0.25]],{support:[2,6]})),
    stage('¿Qué probabilidad queda entre tres y cinco?', density('Comparar longitudes dentro del soporte',[[2,0.25],[6,0.25]],{support:[2,6],shade:[3,5]})),
    stage('En una lista discreta uno, dos, tres y cuatro', bars('Uniforme discreta: cada punto sí tiene masa',['1','2','3','4'],[0.25,0.25,0.25,0.25],[0,1,2,3]))
  ],
  'uniforme-montecarlo/cuantiles':[
    stage('¿Dónde queda el setenta y cinco por ciento', numberLine('Uniforme de 2 a 6: buscar el umbral',2,6,[interval(2,6,'Soporte')],[2,6])),
    stage('Tres cuartos de cuatro son tres minutos.', numberLine('Recorrer tres cuartos de la anchura',2,6,[interval(2,5,'75 % del recorrido')],[2,5,6])),
    stage('La media queda en el punto medio cuatro.', numberLine('Centro y cuantil son preguntas distintas',2,6,[interval(2,5,'Cuantil del 75 %')],[4,5])),
    stage('Con saltos, una acumulada no tiene inversa ordinaria', tree('Inversa generalizada',[branch('Nivel u',['Primer umbral cuya acumulada alcanza u'])]))
  ],
  'uniforme-montecarlo/inversion-y-montecarlo':[
    stage('Queremos generar estados cero, uno y dos', numberLine('Partición de U; primer umbral cuya CDF alcanza U',0,1,[interval(0,0.2,'X = 0',[false,true]),interval(0.2,0.7,'X = 1',[false,true]),interval(0.7,1,'X = 2',[false,true])])),
    stage('Una uniforme de una décima', numberLine('U = 0,10 pertenece al primer tramo',0,1,[interval(0,0.2,'X = 0',[false,true])],[0.1])),
    stage('Una de cincuenta y cinco centésimas', numberLine('La misma frase asigna U = 0,55 y U = 0,91',0,1,[interval(0.2,0.7,'X = 1',[false,true]),interval(0.7,1,'X = 2',[false,true])],[0.55,0.91])),
    stage('Los tramos tienen longitudes iguales a las masas.', bars('Distribución objetivo, no una simulación realizada',['0','1','2'],[0.2,0.5,0.3],[0,1,2]))
  ],
  'exponencial/escala-y-supervivencia':[
    stage('Un mecanismo tiene espera media cinco minutos.', survival(5)),
    stage('¿Qué probabilidad tiene seguir esperando después de diez?', survival(5,{marker:10})),
    stage('Después evaluamos la exponencial de menos dos.', survival(5,{marker:10,level:Math.exp(-2)}))
  ],
  'exponencial/densidad-y-acumulada':[
    stage('¿La supervivencia es también una densidad?', survival(5)),
    stage('La densidad añade el factor inverso de escala', density('Densidad exponencial; escala 5; cola fuera del marco',curvePoints(0,20,time=>Math.exp(-time/5)/5),{domain:[0,20],supportStart:0,xLabel:'Tiempo (min)'})),
    stage('La acumulada responde a que el evento ya ocurrió.', curve('Acumulada, complemento de la supervivencia',curvePoints(0,20,time=>1-Math.exp(-time/5)),'cdf'))
  ],
  'exponencial/espera-adicional':[
    stage('Ya pasaron diez minutos sin señal.', numberLine('Condición conocida y espera adicional',0,15,[interval(0,10,'Ya transcurrido'),interval(10,15,'Otros cinco minutos')],[10,15])),
    stage('La regla divide la supervivencia hasta quince', survival(5,{markers:[10,15]})),
    stage('Eso equivale a la supervivencia de cinco minutos', survival(5,{marker:5})),
    stage('Si termina la observación sin ver el evento', tree('Censura: no confundir límite observado con evento',[branch('Fin de observación',['Evento todavía no observado','Tiempo real sigue desconocido'])]))
  ],
  'normal/centro-y-escala':[
    stage('Una longitud se aproxima por una normal', normal('Longitudes; media 40, desviación 4',40,4)),
    stage('¿A cuántas desviaciones queda el valor cuarenta y ocho?', normal('Umbral 48 frente al centro 40',40,4,{marker:48})),
    stage('Zeta vale dos:', normal('La misma distancia en unidades estándar',0,1,{marker:2}))
  ],
  'normal/densidad-normal':[
    stage('¿Qué representa la altura de la campana tipificada?', normal('Densidad estándar; altura no es probabilidad',0,1)),
    stage('Dividir entre raíz de dos pi', normal('Campana estándar de área total uno',0,1,{lower:-4,upper:4})),
    stage('Para volver a la variable original', normal('Escala de la longitud original',40,4))
  ],
  'normal/colas-e-intervalos':[
    stage('¿Qué probabilidad queda entre treinta y seis y cuarenta y ocho', normal('Intervalo en las unidades de longitud',40,4,{lower:36,upper:48})),
    stage('Sus distancias tipificadas son menos uno y dos.', normal('Misma área, límites estándar',0,1,{lower:-1,upper:2})),
    stage('Fi mayúscula acumula la normal estándar a la izquierda.', normal('Acumulada hasta dos',0,1,{upper:2})),
    stage('Restamos esa parte ya acumulada.', normal('Retirar el área hasta menos uno',0,1,{lower:-1,upper:2})),
    stage('La cola derecha de dos', normal('Cola superior, no altura en dos',0,1,{lower:2}))
  ],
  'normal/cuantiles-y-combinaciones':[
    stage('¿Qué longitud deja el noventa por ciento por debajo?', normal('Buscar un umbral de área, no su altura',0,1,{level:0.9})),
    stage('Multiplicamos uno coma doscientos ochenta y dos', numberLine('Desplazamiento desde el centro',40,48,[interval(40,45.1262,'4 por 1,28155')],[40,45.1262])),
    stage('Añadimos el centro cuarenta.', normal('Percentil 90 en las unidades originales',40,4,{upper:45.1262})),
    stage('Una combinación de normales independientes', tree('Condiciones para combinar normales',[branch('Normales independientes',['Combinar medias','Combinar varianzas con coeficientes cuadrados'])]))
  ],
  'gamma/etapas-y-parametros':[
    stage('Una reacción necesita tres etapas.', trials('Tres esperas independientes; escala común 2 min',['Etapa 1','Etapa 2','Etapa 3'],[0,1,2])),
    stage('La suma es gamma', gammaDensity(3,2)),
    stage('La media suma tres esperas', trials('Sumar tiempos medios, no cambiar la escala',['Media 2 min','Media 2 min','Media 2 min'],[0,1,2]))
  ],
  'gamma/funcion-gamma':[
    stage('La forma también puede ser real positiva.', tree('Gamma función y gamma distribución no son lo mismo',[branch('Forma real positiva',['Constante Gamma(k)','Densidad normalizada'])])),
    stage('Gamma de ka acumula u', curve('Integrando de Gamma(3), no densidad de T',curvePoints(0,15,value=>value*value*Math.exp(-value)),'normalizer-integrand')),
    stage('Gamma de tres es dos factorial', tree('Normalizador del ejemplo de tres etapas',[branch('Gamma(3)',['2 factorial','Valor 2, sin nueva etapa'])]))
  ],
  'gamma/densidad-y-area':[
    stage('¿Qué probabilidad tiene acabar antes de cuatro minutos?', gammaDensity(3,2,{shade:[0,4]})),
    stage('La forma aporta te elevado', tree('La densidad requiere ambas piezas',[branch('Forma k = 3',['Potencia t al cuadrado']),branch('Escala 2',['Exponencial de -t/2'])])),
    stage('Para forma tres y escala dos', gammaDensity(3,2,{shade:[0,4]}))
  ],
  'gamma/sumas-y-variacion':[
    stage('Sumamos dos gammas independientes,', tree('Sumar formas solo con escala común',[branch('Gamma forma 2, escala 2',['Suma']),branch('Gamma forma 3, escala 2',['Suma'])])),
    stage('La suma tiene forma cinco', gammaDensity(5,2)),
    stage('La desviación entre media vale', curve('Variación relativa: uno entre raíz de k',curvePoints(1,9,value=>1/Math.sqrt(value)),'function',{xLabel:'Forma k',yLabel:'Desviación / media'}))
  ],
  'cauchy-weibull/centro-sin-media':[
    stage('Una señal tiene una curva simétrica alrededor de cero.', density('Cauchy estándar: mediana, no esperanza',curvePoints(-8,8,value=>1/(Math.PI*(1+value*value))),{xLabel:'Señal x'})),
    stage('Su mediana y moda son cero.', numberLine('Centro de simetría: no se declara media',-8,8,[],[0])),
    stage('Pero las contribuciones positiva y negativa', tree('Las colas no se cancelan para definir esperanza',[branch('Cola negativa',['Integral divergente']),branch('Cola positiva',['Integral divergente'])]))
  ],
  'cauchy-weibull/intervalos-cauchy':[
    stage('¿Podemos calcular intervalos aunque no haya media?', density('Cauchy: los intervalos sí tienen probabilidad',curvePoints(-8,8,value=>1/(Math.PI*(1+value*value))))),
    stage('En la estándar,', curve('CDF Cauchy estándar',curvePoints(-8,8,value=>0.5+Math.atan(value)/Math.PI),'cdf',{marker:1})),
    stage('En menos uno es un cuarto.', density('Intervalo central [-1, 1]',curvePoints(-8,8,value=>1/(Math.PI*(1+value*value))),{shade:[-1,1]}))
  ],
  'cauchy-weibull/weibull-supervivencia':[
    stage('Un sensor envejece.', tree('Weibull separa escala y evolución del riesgo',[branch('Tiempo relativo a escala',['Elevar a forma beta','Exponencial negativa'])])),
    stage('Con escala diez horas y forma dos', curve('Supervivencia Weibull: escala 10, forma 2',curvePoints(0,25,time=>Math.exp(-((time/10)**2))),'survival',{marker:10,xLabel:'Tiempo (h)'})),
    stage('La densidad multiplica la supervivencia', density('Densidad Weibull con esos mismos parámetros',curvePoints(0,25,time=>time/50*Math.exp(-((time/10)**2))),{xLabel:'Tiempo (h)'}))
  ],
  'cauchy-weibull/riesgo-y-momentos':[
    stage('¿Cómo obtenemos el riesgo instantáneo?', tree('Riesgo: altura entre probabilidad de seguir',[branch('h(t)',['Densidad f(t)','Supervivencia S(t) positiva'])])),
    stage('Forma uno da riesgo constante', tree('La forma determina la dirección del riesgo',[branch('Beta menor que 1',['Riesgo decreciente']),branch('Beta igual a 1',['Riesgo constante']),branch('Beta mayor que 1',['Riesgo creciente'])])),
    stage('La media finita usa gamma', tree('Momentos de Weibull, no de Cauchy',[branch('Media',['Escala por Gamma(1+1/beta)']),branch('Segundo momento',['Escala al cuadrado por Gamma(1+2/beta)'])]))
  ],
  'calculo-modelos/operacion-correcta':[
    stage('Un modelo normal tiene media veinte y desviación tres.', normal('Modelo de consulta: media 20, desviación 3',20,3,{marker:26})),
    stage('Masa o densidad evalúan un punto;', tree('Entradas y salidas diferentes',[branch('Masa o densidad',['Valor -> altura']),branch('Acumulada',['Umbral -> probabilidad']),branch('Cuantil',['Probabilidad -> umbral']),branch('Generación',['Modelo -> realización'])])),
    stage('Una densidad tiene unidades inversas', normal('La cola requiere un área',20,3,{lower:26}))
  ],
  'calculo-modelos/consulta-con-unidades':[
    stage('Para superar veintiséis,', normal('Superar 26 con media 20 y desviación 3',20,3,{lower:26})),
    stage('Dividimos seis entre desviación tres:', normal('Dos desviaciones por encima del centro',0,1,{lower:2})),
    stage('El percentil noventa, en cambio,', normal('Cuantil 90: umbral en unidades originales',20,3,{upper:23.84465})),
    stage('En recuentos, al menos ka', tree('Discreto: el extremo puede tener masa',[branch('Al menos k',['Complemento hasta k-1']),branch('Más de k',['Complemento hasta k'])]))
  ],
  'calculo-modelos/elegir-mecanismo':[
    stage('¿Qué distribución merece un recuento biológico?', tree('El mecanismo decide el modelo',[branch('Recuento',['Ensayos binarios','Extracción de un lote','Eventos por exposición'])])),
    stage('Un ensayo binario pide Bernoulli;', tree('Diseños diferentes',[branch('Un ensayo binario',['Bernoulli']),branch('n fijo, p común, independencia',['Binomial']),branch('Lote finito sin reemplazo',['Hipergeométrica'])])),
    stage('Una parada al lograr éxitos', tree('Parada, exposición o duración',[branch('Parar en éxitos',['Geométrica o negativa']),branch('Exposición estable',['Posible Poisson']),branch('Tiempo',['Soporte y riesgo'])]))
  ],
  'familia-exponencial/piezas-poisson':[
    stage('¿Familia exponencial significa esperar tiempos exponenciales?', tree('Datos y parámetros cumplen papeles distintos',[branch('Masa Poisson',['h(x): dato','T(x): resumen','eta: parámetro','A(eta): normaliza'])])),
    stage('Hache contiene solo el factorial del dato.', tree('Parte que no depende de lambda',[branch('Dato x',['h(x) = 1/x factorial'])])),
    stage('Te de equis es el estadístico', tree('Resumen que interactúa con el parámetro',[branch('Dato x',['T(x) = x'])])),
    stage('Eta es el parámetro natural:', tree('Reparametrizar una media positiva',[branch('Lambda positiva',['eta = log lambda','A(eta) = exp eta'])]))
  ],
  'familia-exponencial/binomial-natural':[
    stage('Con una binomial de tamaño ene fijo,', tree('Soporte fijo y probabilidad interior',[branch('Binomial n fijo',['Recuento de 0 a n','0 < p < 1'])])),
    stage('Las odds dividen pe entre uno menos pe.', tree('De probabilidad a parámetro natural',[branch('p',['Odds p/(1-p)','Log odds: eta'])])),
    stage('Para pe tres cuartos,', bars('Probabilidad frente a su complemento',['Éxito','Fracaso'],[0.75,0.25],[0,1])),
    stage('Pe cero o uno da modelos degenerados', numberLine('El logit finito exige extremos excluidos',0,1,[interval(0,1,'0 < p < 1',[false,false])]))
  ],
  'familia-exponencial/normales-uniparametricas':[
    stage('Una normal también pertenece a esta estructura,', tree('Dos familias uniparamétricas distintas',[branch('Varianza conocida',['Media variable','T(x) = x']),branch('Media conocida',['Varianza variable','T(x) = distancia cuadrada'])])),
    stage('Con varianza conocida ve', tree('Varianza fija v positiva',[branch('Media mu variable',['eta = mu/v','T(x) = x'])])),
    stage('Con media conocida mu cero', tree('Centro fijo mu0',[branch('Varianza positiva variable',['T(x) = (x-mu0) al cuadrado','eta = -1/(2 sigma al cuadrado)'])]))
  ],
  'familia-exponencial/datos-fijos-y-maximo':[
    stage('Observamos recuentos cero, uno y dos', bars('Datos fijos de ventanas con igual exposición',['Ventana 1','Ventana 2','Ventana 3'],[0,1,2],[0,1,2])),
    stage('El producto de masas, ele,', curve('Verosimilitud para los datos 0, 1, 2',curvePoints(0,4,rate=>Math.exp(-3*rate)*rate**3/2),'likelihood',{xLabel:'Lambda candidata',yLabel:'L(lambda)'})),
    stage('Igualar esa derivada a cero da lambda uno.', curve('Máximo de verosimilitud, no posterior',curvePoints(0,4,rate=>Math.exp(-3*rate)*rate**3/2),'likelihood',{marker:1,xLabel:'Lambda candidata'}))
  ],
  'familia-exponencial/log-verosimilitud':[
    stage('¿Cuánto vale la log verosimilitud en lambda uno', bars('La misma muestra: 0, 1, 2',['Ventana 1','Ventana 2','Ventana 3'],[0,1,2],[0,1,2])),
    stage('El total tres multiplica logaritmo natural de uno', bars('Primera aportación a log L(1), no masa',['T log lambda'],[0],[0])),
    stage('Restamos tres ventanas por lambda uno.', bars('Contribución de las tres exposiciones',['T log lambda','-n lambda'],[0,-3],[1])),
    stage('Después restamos logaritmo de dos', bars('Constante necesaria al evaluar el valor',['T log lambda','-n lambda','-log factoriales'],[0,-3,-Math.log(2)],[2]))
  ],
  'familia-exponencial/enlaces-glm':[
    stage('¿Cómo relacionamos una dosis con la media', tree('El enlace mantiene el dominio de la respuesta',[branch('Dosis y coeficientes',[branch('Predictor lineal',['Exponencial: media Poisson positiva'])])])),
    stage('Coeficientes logaritmo de dos', scatter('Medias ilustrativas, no ajustadas',[[0,2],[1,3],[2,4.5]],{xLabel:'Dosis d',yLabel:'Media Poisson'})),
    stage('Para una respuesta binaria,', tree('Logit y su inversa',[branch('eta = 0',['p = 1/2']),branch('eta = log 3',['p = 3/4'])]))
  ],
  'conjunta-discreta/parejas':[
    stage('Medimos dos marcadores de una célula.', tree('Conservar qué dos medidas pertenecen a la misma célula',[branch('Célula',['Valor de X','Valor de Y'])])),
    stage('Equis nombra filas e i griega columnas.', jointTable()),
    stage('En la celda equis uno, i griega cero', jointTable([[1,0]]))
  ],
  'conjunta-discreta/region-de-celdas':[
    stage('¿Qué probabilidad corresponde a equis como máximo cero', jointTable([[0,0],[0,1]])),
    stage('La acumulada bivariante usa dos umbrales', jointTable([[0,0],[0,1]])),
    stage('Para otra región comprobamos sus dos desigualdades', jointTable())
  ],
  'conjunta-discreta/rectangulo-acumulado':[
    stage('¿Cómo aislamos un rectángulo abierto', jointTable()),
    stage('Empezamos con todo lo acumulado', {...jointTable([[0,0],[0,1],[1,0],[1,1]]),caption:'Ejemplo de la tabla: comenzar con las cuatro celdas'}),
    stage('Restamos la franja izquierda', jointTable([[0,0],[0,1]])),
    stage('Restamos también la franja inferior', jointTable([[0,0],[1,0]])),
    stage('Añadimos la esquina acumulada', jointTable([[0,0]])),
    stage('En nuestra tabla, para ambos indicadores uno,', jointTable([[1,1]]))
  ],
  'multinomial/categorias-y-secuencias':[
    stage('Cuatro células se clasifican como a', bars('Categorías de una célula; total de cuatro ensayos',['Reposo A','Activada B','Dañada C'],[0.5,0.3,0.2])),
    stage('¿Cómo calculamos dos, una y una?', trials('Un patrón compatible con los recuentos pedidos',['A','A','B','C'],[0,1,2,3])),
    stage('El factorial multinomial cuenta órdenes distintos.', trials('Doce órdenes del mismo recuento 2, 1, 1',['AABC','AACB','ABAC','ABCA','ACAB','ACBA','BAAC','BACA','BCAA','CAAB','CABA','CBAA'],[0,1,2,3,4,5,6,7,8,9,10,11]))
  ],
  'multinomial/marginales-y-total':[
    stage('¿El recuento de a es independiente del de be?', trials('Cuatro plazas compartidas entre categorías',['Plaza 1','Plaza 2','Plaza 3','Plaza 4'],[],[{label:'Total fijo: A + B + C = 4',indices:[0,1,2,3]}])),
    stage('Si solo contamos a,', bars('Reunir B y C como no A',['A','No A'],[0.5,0.5],[0])),
    stage('el recuento marginal es binomial.', binomialMass(4,0.5))
  ],
  'multinomial/momentos-con-indicadores':[
    stage('¿Por qué los recuentos de categorías tienen covarianza negativa?', trials('Cada célula ocupa solo una categoría',['A','B','C'])),
    stage('En una misma célula,', matrix('Indicadores incompatibles en la misma célula',[[1,0],[0,1],[0,0]],[],['A','B','C'],['IA','IB'])),
    stage('Sumar las cuatro contribuciones', matrix('Covarianzas del total de cuatro células',[[1,-0.6,-0.4],[-0.6,0.84,-0.24],[-0.4,-0.24,0.64]],[[0,1],[1,0]],['A','B','C'],['A','B','C'])),
    stage('Cada fila de la matriz de covarianzas suma cero', matrix('El total fijo produce una matriz singular',[[1,-0.6,-0.4],[-0.6,0.84,-0.24],[-0.4,-0.24,0.64]],[[0,0],[0,1],[0,2]],['A','B','C'],['A','B','C']))
  ],
  'marginales/sumar-la-otra':[
    stage('En una tabla de marcadores,', jointTable([[0,1],[1,1]])),
    stage('Esa es la marginal de i griega en uno.', bars('Marginal Y: sumar sin fijar X',['Y=0','Y=1'],[0.6,0.4],[1])),
    stage('Para conservar equis sumaríamos todas las columnas.', jointTable([[0,0],[0,1]]))
  ],
  'marginales/integrar-cortes':[
    stage('Ahora hay densidad conjunta dos', {...triangle('Densidad 2 sobre capacidad 1',1,0.25),density:2}),
    stage('Fijando equis en un cuarto', triangle('El corte de Y mide tres cuartos',1,0.25)),
    stage('La integral da dos por uno menos equis.', density('Marginal X: longitud del corte por altura',[[0,2],[1,0]],{support:[0,1],marker:0.25}))
  ],
  'marginales/proyeccion-y-corte':[
    stage('¿Qué diferencia hay entre marginalizar y condicionar?', jointTable([[0,1],[1,1]])),
    stage('Si conocemos equis uno,', jointTable([[1,0],[1,1]])),
    stage('La marginal suma sin fijar equis;', bars('Dos preguntas; no dos partes de un total',['P(Y=1)','P(Y=1 dado X=1)'],[0.4,0.5],[0,1])),
    stage('En continuo un corte', tree('Corte frente a proyección',[branch('X conocido',['Normalizar un corte']),branch('X olvidado',['Integrar todos sus valores'])]))
  ],
  'conjunta-condicional/normalizar-region':[
    stage('Dos cultivos comparten capacidad uno', triangle('Soporte triangular; altura c aún por determinar')),
    stage('La altura es dos.', {...triangle('Volumen total uno con altura 2'),density:2}),
    stage('El suceso suma como máximo una mitad', triangle('El suceso es un triángulo dentro del soporte',1,undefined,[[[0,0],[0.5,0],[0,0.5]]]))
  ],
  'conjunta-condicional/normalizar-corte':[
    stage('Conocemos equis igual a dos décimas.', triangle('Fijar X = 0,2 deja Y de 0 a 0,8',1,0.2)),
    stage('La marginal de equis integra altura dos', {...triangle('Marginal: integrar el corte completo',1,0.2),density:2}),
    stage('La densidad condicional es uno coma veinticinco', density('Corte normalizado; área uno',[[0,1.25],[0.8,1.25]],{support:[0,0.8]}))
  ],
  'conjunta-condicional/interpretar-condicion':[
    stage('En el corte anterior,', density('Y dado X = 0,2; mismo soporte del corte',[[0,1.25],[0.8,1.25]],{support:[0,0.8],shade:[0.4,0.8]})),
    stage('Multiplicamos anchura cuatro décimas', numberLine('Tramo favorable dentro de las ocho décimas',0,0.8,[interval(0.4,0.8,'Y superior a 0,4',[false,true])],[0.4,0.8])),
    stage('Si un instrumento registra equis entre quince y veinticinco', triangle('Una franja no es el corte exacto',1,undefined,[[[0.15,0],[0.25,0],[0.25,0.75],[0.15,0.85]]]))
  ],
  'normal-bivariante/modelo-conjunto':[
    stage('Dos señales tienen medias treinta y setenta,', jointNormal('Contornos del modelo conjunto supuesto')),
    stage('Tipificamos cada coordenada', jointNormal('Cada eje se centra y escala por separado',{highlightAxis:'x'})),
    stage('Para la segunda usamos sus parámetros', jointNormal('Y usa media 70 y desviación 8',{highlightAxis:'y'}))
  ],
  'normal-bivariante/densidad-bivariante':[
    stage('¿Cómo entra ro en la densidad sobre dos ejes?', jointNormal('El término cruzado orienta los contornos')),
    stage('Q reúne los dos cuadrados', jointNormal('Correlación 0,25: contornos inclinados',{highlightAxis:'both'})),
    stage('Con ro cero el término cruzado desaparece', jointNormal('Comparación explícita: rho = 0',{rho:0}))
  ],
  'normal-bivariante/media-y-varianza-condicional':[
    stage('Observamos equis cuarenta.', jointNormal('Corte vertical en X = 40',{cutX:40})),
    stage('La pendiente condicional combina', jointNormal('Desplazamiento de X informa sobre Y',{cutX:40,highlightAxis:'x'})),
    stage('La media condicional es setenta y cuatro.', tree('Actualizar el centro sin adelantar la desviación',[branch('Centro marginal: 70',[branch('Desplazamiento: 4',['Centro condicional: 74'])])])),
    stage('Tomamos su raíz para tipificar:', normal('Desviación del corte: raíz de 60',74,Math.sqrt(60)))
  ],
  'normal-bivariante/cola-condicional':[
    stage('¿Qué probabilidad tiene i griega superar ochenta y dos', jointNormal('La pregunta pertenece al corte X = 40',{cutX:40})),
    stage('La curva del corte es normal', normal('Y dado X = 40: media 74, varianza 60',74,Math.sqrt(60),{lower:82})),
    stage('Dividimos ocho entre raíz de sesenta.', normal('La misma cola en desviaciones condicionales',0,1,{lower:8/Math.sqrt(60)})),
    stage('El sombreado representa la cola visible del corte.', normal('Volver a la escala de la señal Y',74,Math.sqrt(60),{lower:82}))
  ],
  'independencia-variables/factorizar-tabla':[
    stage('Una tabla contiene masas cuarenta y dos,', matrix('Tabla a comprobar, no una sola celda',[[0.42,0.28],[0.18,0.12]])),
    stage('Para cero cero,', matrix('Producto de sus dos marginales',[[0.42,0.28],[0.18,0.12]],[[0,0]])),
    stage('Para cero uno,', matrix('Comprobar también la siguiente celda',[[0.42,0.28],[0.18,0.12]],[[0,1]])),
    stage('La segunda fila da', matrix('Verificar el resto de parejas',[[0.42,0.28],[0.18,0.12]],[[1,0],[1,1]]))
  ],
  'independencia-variables/soporte-completo':[
    stage('Una densidad constante dos ocupa el triángulo', triangle('El soporte prohíbe combinar libremente X e Y',1,0.8)),
    stage('Si ambas coordenadas están entre tres cuartos y uno', triangle('Región exterior de área positiva',1,undefined,[[[0.75,0.75],[1,0.75],[1,1],[0.75,1]]])),
    stage('Sin embargo, ambas marginales son positivas', density('Marginal positiva para x entre 0,75 y 1',[[0,2],[1,0]],{shade:[0.75,1],support:[0,1]}))
  ],
  'independencia-variables/transformar-y-seleccionar':[
    stage('¿Qué podemos hacer si equis e i griega son independientes?', tree('Transformaciones separadas conservan independencia',[branch('X',['g(X)']),branch('Y',['h(Y)'])])),
    stage('Si seleccionamos un grupo por una condición sobre las dos', tree('Seleccionar sobre ambas puede crear dependencia',[branch('Grupo seleccionado por X + Y',['X limita Y','Y limita X'])])),
    stage('Como contraste, equis toma menos uno, cero y uno', scatter('Contraejemplo discreto equiprobable: Y = X al cuadrado',[[-1,1],[0,0],[1,1]],{xLabel:'X',yLabel:'Y = X al cuadrado',highlight:[1]}))
  ],
  'covarianza-matrices/desviaciones-compartidas':[
    stage('Dos lecturas de una muestra suben y bajan juntas.', tree('Centrar cada lectura antes de multiplicar',[branch('Pareja de lecturas',['X menos media X','Y menos media Y'])])),
    stage('Con parejas cero uno y uno tres equiprobables,', scatter('Parejas equiprobables del modelo',[[0,1],[1,3]],{line:{slope:2,intercept:1}})),
    stage('Los productos de desviaciones son una mitad', scatter('Desviaciones del mismo signo',[[-0.5,-1],[0.5,1]],{xLabel:'X menos 0,5',yLabel:'Y menos 2',line:{slope:2,intercept:0}}))
  ],
  'covarianza-matrices/normalizar-covarianza':[
    stage('En otro modelo, las varianzas son nueve y dieciséis', covarianceMatrix([[0,0],[1,1]])),
    stage('Dividimos covarianza seis entre doce.', matrix('Correlaciones tras dividir por desviaciones',[[1,0.5],[0.5,1]],[[0,1],[1,0]])),
    stage('Duplicar i griega', matrix('Escalar Y: varianza por 4, covarianza por 2',[[9,12],[12,64]],[[0,1],[1,0],[1,1]]))
  ],
  'covarianza-matrices/matrices-admisibles':[
    stage('¿Cómo guardamos muchas relaciones sin perder el orden?', tree('El mismo orden en centros, filas y columnas',[branch('Medidas ordenadas',['Vector de medias','Matriz de covarianzas'])])),
    stage('Para varianzas nueve y dieciséis y covarianza seis', covarianceMatrix([[0,0],[1,1]])),
    stage('De coloca desviaciones tres y cuatro', matrix('D: desviaciones en la diagonal',[[3,0],[0,4]],[[0,0],[1,1]])),
    stage('La diagonal de erre es uno', matrix('Matriz de correlaciones válida',[[1,0.5],[0.5,1]],[[0,1],[1,0]])),
    stage('Sigma debe ser semidefinida positiva:', covarianceMatrix([[0,1],[1,0]]))
  ],
  'combinaciones-incorrelacion/suma-y-diferencia':[
    stage('Dos lecturas emparejadas tienen varianzas cuatro y nueve', matrix('Covarianza de lecturas emparejadas',[[4,3],[3,9]],[],['X','Y'],['X','Y'])),
    stage('Primero sumamos las dos varianzas individuales.', bars('Aportaciones a la varianza de X menos Y',['Var X','Var Y'],[4,9],[0,1])),
    stage('El término cruzado de la diferencia', bars('El término cruzado tiene signo negativo',['Var X','Var Y','-2 Cov'],[4,9,-6],[2])),
    stage('Restamos seis a trece.', bars('Comparar suma y diferencia, misma covarianza',['Diferencia','Suma'],[7,19],[0]))
  ],
  'combinaciones-incorrelacion/forma-matricial':[
    stage('¿La notación matricial añade una hipótesis?', tree('Coeficientes conservan la identidad de las medidas',[branch('Combinación lineal',['a por X','b por Y'])])),
    stage('La varianza aplica los coeficientes a sigma', matrix('Misma matriz, coeficientes a ambos lados',[[4,3],[3,9]],[[0,0],[0,1],[1,0],[1,1]],['X','Y'],['X','Y'])),
    stage('La covarianza de una medida consigo misma', matrix('La diagonal contiene las varianzas',[[4,3],[3,9]],[[0,0],[1,1]],['X','Y'],['X','Y']))
  ],
  'combinaciones-incorrelacion/incorrelacion':[
    stage('Equis es uniforme entre menos uno y uno', scatter('Relación exacta; soporte continuo, no observaciones',curvePoints(-1,1,value=>value*value),{xLabel:'X uniforme en [-1, 1]',yLabel:'Y = X al cuadrado',connected:true})),
    stage('La simetría da esperanza de equis cero', scatter('Simetría de la relación respecto al eje vertical',curvePoints(-1,1,value=>value*value),{xLabel:'X',yLabel:'Y = X al cuadrado',connected:true,highlight:[0,80]})),
    stage('Solo bajo normalidad conjunta,', tree('No extender una excepción a cualquier modelo',[branch('Covarianza cero',['Normalidad conjunta: independencia','En general: no basta'])]))
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
    stage('En el primero germinan dieciocho semillas.', bars('Germinaciones conocidas; falta su total',['Primer ensayo','Segundo ensayo'],[18,30],[0,1])),
    stage('En el primer ensayo habíamos sembrado setenta y dos semillas.', bars('Primera bandeja global: 18 de 72',['Germinan','Resto'],[18,54],[0])),
    stage('Allí habíamos sembrado doscientas.', bars('Segunda bandeja global: 30 de 200',['Germinan','Resto'],[30,170],[0])),
    stage('Dos miligramos son dos mil microgramos', tree('Relato global: misma masa, no tres miligramos',[branch('2 mg',['2000 microgramos'])]))
  ],
  algebra:[
    stage('Tenemos tres estados de un cultivo y queremos repartir el total en la proporción dos, tres y cinco.', bars('Pesos de este relato global',['Estado 1','Estado 2','Estado 3'],[2,3,5])),
    stage('Si repartimos cada peso entre diez', bars('Mismas razones con total uno',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1,2])),
    stage('Supón que una proporción restante sigue e elevado a menos te dividido entre seis.', survival(6)),
    stage('Queremos saber cuándo queda la mitad.', survival(6,{level:0.5}))
  ],
  funciones:[
    stage('Piensa en una máquina muy sencilla:', tree('Regla global: dos operaciones',[branch('Entrada X',[branch('Multiplicar por 2',['Sumar 1'])])])),
    stage('Si entra tres,', scatter('Entradas y salidas de g(x) = 2x + 1',[[0,1],[1,3],[2,5],[3,7]],{highlight:[3],xLabel:'Entrada',yLabel:'Salida'})),
    stage('Una medida solo puede valer cero, dos o cinco.', numberLine('Soporte separado del relato global',0,5,[],[0,2,5])),
    stage('Sus probabilidades son una décima, seis décimas y tres décimas.', brood()),
    stage('Preguntar por valores menores que tres', brood([0,1])),
    stage('En cambio, menores que dos', brood([0]))
  ],
  calculo:[
    stage('Vamos a imaginar un tiempo que puede caer entre cero y dos minutos', density('Uniforme global entre 0 y 2',[[0,0.5],[2,0.5]],{support:[0,2]})),
    stage('Queremos el tiempo entre cero coma cuatro y uno coma dos minutos.', density('Intervalo pedido',[[0,0.5],[2,0.5]],{shade:[0.4,1.2],support:[0,2]})),
    stage('Probemos con otra densidad:', density('Otro modelo global: t/2',[[0,0],[2,1]],{support:[0,2]}))
  ],
  'regiones-matrices':[
    stage('Tenemos una unidad de recurso para repartir', triangle('Capacidad 1 del relato, no de los ejercicios')),
    stage('Si el primero recibe cero coma tres,', triangle('Corte de X = 0,3',1,0.3)),
    stage('Una matriz es una tabla con filas y columnas.', matrix('Matriz del relato global',[[4,1],[1,9]],[[0,1]]))
  ],
  sucesos:[
    stage('Tenemos cien bacterias.', bars('Colección de este relato',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40])),
    stage('El suceso a significa', bars('A incluye solo A y ambas',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0,2])),
    stage('Si digo a y be a la vez', bars('Intersección: ambas',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[2])),
    stage('Para esa unión reunimos', bars('Unión: al menos una',['Solo A','Solo B','Ambos','Ninguno'],[30,20,10,40],[0,1,2]))
  ],
  axiomas:[
    stage('Imagina tres estados excluyentes de un cultivo,', bars('Estados excluyentes del relato global',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1])),
    stage('Si recuperar el cultivo tiene probabilidad cero coma ocho', bars('Un suceso y su complemento',['Recupera','No recupera'],[0.8,0.2],[1]))
  ],
  combinatoria:[
    stage('Tenemos cinco muestras y queremos elegir dos', tubePairs(false)),
    stage('Si contáramos posiciones,', tubePairs(true)),
    stage('Dividimos entre dos y quedan diez parejas.', tubePairs(false)),
    stage('Ahora imagina que una muestra recibe un tratamiento', tubePairs(true)),
    stage('Si además devolviéramos la primera muestra', tubePairs(true,true))
  ],
  condicionada:[
    stage('Cuarenta llevan el marcador a y diez llevan a y be.', bars('Grupo A del relato: no es el filtro de 200 muestras',['A y B','A sin B'],[10,30],[0])),
    stage('Si invierto la pregunta', CONCEPTS.condicionada)
  ],
  'independencia-sucesos':[
    stage('Supón que a tiene probabilidad cero coma cuatro y be cero coma tres.', tree('Marginales del relato; aún no conocemos la conjunta',[branch('A',[{label:'Probabilidad 0,4'}]),branch('B',[{label:'Probabilidad 0,3'}])])),
    stage('Si son independientes,', matrix('Modelo independiente del relato',[[0.42,0.18],[0.28,0.12]],[[1,1]],['No A','A'],['No B','B'])),
    stage('Si vale cero coma diez,', matrix('Conjunta 0,10 con marginales 0,4 y 0,3',[[0.4,0.2],[0.3,0.1]],[[1,1]],['No A','A'],['No B','B'])),
    stage('Si ambas valen cero coma diez,', bars('Universo A para P(B dado A)',['A y B','A sin B'],[0.1,0.3],[0]))
  ],
  'bayes-diagnostico':[
    stage('Imagina mil animales:', bars('Previa del relato global',['Infectados','Sanos'],[100,900],[0,1])),
    stage('Entre los infectados esperamos noventa positivos.', bars('Sensibilidad del relato: 90 de 100',['Positivos infectados','Infectados totales'],[90,100],[0])),
    stage('Entre los sanos, si el cinco por ciento', bars('Positivos globales, no los 80 y 90 de secciones',['Infectados +','Sanos +'],[90,45],[1])),
    stage('Los positivos forman ahora nuestro grupo de referencia:', bars('Universo positivo: 135 esperados',['Infectados +','Sanos +'],[90,45],[0,1]))
  ],
  'variable-cdf':[
    stage('como cero, dos o cinco brotes.', numberLine('Valores del relato global; no 0, 1, 2 larvas',0,5,[],[0,2,5])),
    stage('Supongamos probabilidades cero coma uno, cero coma seis y cero coma tres', brood()),
    stage('Si el umbral es tres,', brood([0,1])),
    stage('Al llegar a cinco incorporamos su probabilidad', brood([0,1,2])),
    stage('El salto en dos vale cero coma seis:', brood([1]))
  ],
  masa:[
    stage('Nos dan tres estados posibles de una célula con pesos dos, tres y cinco.', bars('Pesos globales; no brotes 0, 2, 4',['Estado 1','Estado 2','Estado 3'],[2,3,5])),
    stage('Dividimos cada peso por diez', bars('Masas de los tres estados globales',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5])),
    stage('Si nos preguntan por cualquiera de los dos primeros estados', bars('Seleccionar los dos primeros',['Estado 1','Estado 2','Estado 3'],[0.2,0.3,0.5],[0,1]))
  ],
  densidad:[
    stage('Piensa en un tiempo uniforme entre cero y dos minutos.', density('Relato: uniforme de altura 0,5',[[0,0.5],[2,0.5]],{support:[0,2]})),
    stage('Para medio minuto de anchura', density('Franja de medio minuto',[[0,0.5],[2,0.5]],{support:[0,2],shade:[0,0.5]})),
    stage('Hagamos el soporte más estrecho:', density('Nuevo soporte; altura 2',[[0,2],[0.5,2]],{support:[0,0.5]}))
  ],
  esperanza:[
    stage('Imagina que un recuento puede dar cero, uno o dos,', bars('Masas del relato global; no el ejemplo 0 o 4',['0','1','2'],[0.25,0.5,0.25])),
    stage('Los valores que promediamos pasan a ser cero, uno y cuatro,', bars('Cuadrados con las mismas masas',['0','1','4'],[0.25,0.5,0.25]))
  ],
  varianza:[
    stage('Saber que la media de un recuento es uno', numberLine('Centro de referencia del relato',0,2,[],[1])),
    stage('Con los valores cero, uno y dos,', bars('Desviaciones al centro uno',['X=0','X=1','X=2'],[-1,0,1])),
    stage('Por eso las elevamos al cuadrado', bars('Distancias cuadradas',['X=0','X=1','X=2'],[1,0,1])),
    stage('Si multiplicas todas las medidas por dos', bars('Distancias duplicadas; cuadrados por cuatro',['X=0','X=1','X=2'],[4,0,4]))
  ],
  'momentos-transformaciones':[
    stage('Prueba con cero y dos, cada uno con probabilidad una mitad.', bars('Modelo de este relato global',['0','2'],[0.5,0.5])),
    stage('Si nuestra nueva medida es el cuadrado de equis,', CONCEPTS['momentos-transformaciones'])
  ],
  'bernoulli-binomial':[
    stage('Ahora sembramos tres semillas independientes, con probabilidad una mitad', binomialMass(3,0.5)),
    stage('hay tres posiciones posibles para la semilla que no germina.', trials('Los tres patrones son resultados diferentes',['110','101','011'],[0,1,2]))
  ],
  poisson:[
    stage('Un sensor recibe, por término medio, dos llegadas de bacterias por minuto.', tree('Tasa del relato global',[branch('Sensor',['Dos llegadas esperadas por minuto'])])),
    stage('La media para esa ventana no es dos, sino dos por tres:', poissonMass(6)),
    stage('Si preguntan por más de dos llegadas,', {...poissonMass(6),highlight:poissonMass(6).values.flatMap((_,index)=>index>2 ? [index] : [])})
  ],
  hipergeometrica:[
    stage('Tenemos ocho organismos, tres portadores de una variante.', bars('Lote global: N=8, K=3; no el lote de 12',['Portadores','No portadores'],[3,5])),
    stage('Queremos exactamente dos portadores.', tree('Muestra global de cuatro',[branch('Seleccionar 4',['2 entre 3 portadores','2 entre 5 restantes'])])),
    stage('No podemos obtener más de tres portadores', numberLine('Soporte global limitado por las existencias',0,3,[],[0,1,2,3]))
  ],
  'geometrica-negativa':[
    stage('Para que el primer éxito llegue en la tercera prueba,', trials('Primer éxito al final del tercer ensayo',['Fallo','Fallo','Éxito'],[2])),
    stage('Para tener un fallo antes del segundo éxito,', trials('Dos patrones; el éxito final está fijado',['FEE','EFE'],[0,1]))
  ],
  'uniforme-montecarlo':[
    stage('Elegimos al azar un instante entre dos y seis minutos,', density('Ventana global de 2 a 6',[[2,0.25],[6,0.25]],{support:[2,6]})),
    stage('Por ejemplo, entre tres y cinco', density('Intervalo global de 3 a 5',[[2,0.25],[6,0.25]],{support:[2,6],shade:[3,5]})),
    stage('Y no mezcles uniforme continua con elegir un entero de una lista.', CONCEPTS['uniforme-montecarlo'])
  ],
  exponencial:[
    stage('Si la espera media es de cinco minutos,', survival(5)),
    stage('Después de cinco minutos,', survival(5,{marker:5})),
    stage('Supón que ya llevamos tres minutos esperando.', numberLine('Tres conocidos y dos adicionales; no 10 y 5',0,5,[interval(0,3,'Ya esperado'),interval(3,5,'Espera adicional')],[3,5]))
  ],
  normal:[
    stage('Imagina longitudes celulares centradas en cuarenta micrómetros,', normal('Media 40 y desviación 4 del relato',40,4)),
    stage('Una longitud de cuarenta y ocho', normal('Umbral 48',40,4,{marker:48})),
    stage('Entre treinta y seis y cuarenta y ocho', normal('Intervalo del relato en unidades originales',40,4,{lower:36,upper:48})),
    stage('Después volvemos a micrómetros:', normal('Percentil 95 global, no el 90 de secciones',40,4,{upper:40+4*1.64485}))
  ],
  gamma:[
    stage('Pensemos en una detección que requiere tres llegadas.', trials('Tres etapas globales; aún no es un plazo',['Espera 1','Espera 2','Espera 3'])),
    stage('En este ejemplo, ka vale tres y alfa dos.', gammaDensity(3,2))
  ],
  'cauchy-weibull':[
    stage('Pasemos a Weibull,', tree('Nuevo modelo: tiempo no negativo y riesgo variable',[branch('Weibull',['Escala alfa','Forma beta'])])),
    stage('Con escala dos y forma dos,', curve('Weibull global: escala 2, no escala 10',curvePoints(0,5,time=>Math.exp(-((time/2)**2))),'survival',{marker:2}))
  ],
  'calculo-modelos':[
    stage('En un recuento, pe de equis igual a dos', numberLine('Recuentos de la pregunta; sin masas inventadas',0,3,[],[0,1,2,3])),
    stage('Para no superar dos,', numberLine('No superar dos incluye el dos',0,3,[interval(0,2,'X como máximo 2')],[0,1,2,3])),
    stage('Más de dos en un recuento empieza en tres.', numberLine('Más de dos excluye el dos',0,4,[interval(2,4,'X mayor que 2',[false,true])],[0,1,2,3,4]))
  ],
  'familia-exponencial':[
    stage('Hemos observado dos, cuatro y tres colonias', bars('Datos globales fijos; no los 0, 1, 2 de secciones',['Placa 1','Placa 2','Placa 3'],[2,4,3])),
    stage('La verosimilitud compara esas candidatas', curve('Verosimilitud de la muestra 2, 4, 3',curvePoints(0,7,rate=>Math.exp(-3*rate)*rate**9/288),'likelihood',{xLabel:'Lambda candidata'})),
    stage('Aquí la mejor candidata es tres,', curve('Máximo de esta muestra global',curvePoints(0,7,rate=>Math.exp(-3*rate)*rate**9/288),'likelihood',{marker:3,xLabel:'Lambda candidata'})),
    stage('Esto conecta con los modelos lineales generalizados.', CONCEPTS['familia-exponencial'])
  ],
  'conjunta-discreta':[
    stage('Tomemos las masas cero coma dos y cero coma tres', matrix('Tabla global, distinta de la tabla de secciones',[[0.2,0.3],[0.1,0.4]])),
    stage('La celda equis uno, i griega uno', matrix('Celda simultánea',[[0.2,0.3],[0.1,0.4]],[[1,1]])),
    stage('Si nos piden equis cero', matrix('Seleccionar la primera fila',[[0.2,0.3],[0.1,0.4]],[[0,0],[0,1]]))
  ],
  multinomial:[
    stage('Supongamos probabilidades una mitad, un cuarto y un cuarto,', bars('Probabilidades por célula del relato global',['Reposo','Activada','Dañada'],[0.5,0.25,0.25])),
    stage('Queremos una de cada categoría.', trials('Seis secuencias del recuento 1, 1, 1',['RAD','RDA','ARD','ADR','DRA','DAR'],[0,1,2,3,4,5])),
    stage('Los tres recuentos tienen que sumar tres.', trials('Tres plazas globales, no cuatro',['Célula 1','Célula 2','Célula 3']))
  ],
  marginales:[
    stage('Tenemos una tabla conjunta con filas cero coma dos, cero coma tres,', matrix('Tabla global: marginalizar sin fijar X',[[0.2,0.3],[0.1,0.4]],[[0,1],[1,1]])),
    stage('Imagina una densidad conjunta constante de una mitad', {...triangle('Triángulo global: capacidad 2, densidad 0,5',2),density:0.5}),
    stage('Para cada equis,', density('Marginal global: (2-x)/2',[[0,1],[2,0]],{support:[0,2]}))
  ],
  'conjunta-condicional':[
    stage('Su fila contiene masas cero coma uno y cero coma cuatro.', bars('Fila X=1 global, todavía sin normalizar',['Y=0','Y=1'],[0.1,0.4])),
    stage('Sale cero coma ocho.', bars('Probabilidades dentro de X=1',['Y=0','Y=1'],[0.2,0.8],[1])),
    stage('En el triángulo de capacidad dos,', triangle('Corte global en X=0,5',2,0.5)),
    stage('Dividimos ambas densidades y obtenemos dos tercios,', density('Corte global normalizado de longitud 1,5',[[0,2/3],[1.5,2/3]],{support:[0,1.5]}))
  ],
  'normal-bivariante':[
    stage('Dos señales tienen medias doce y treinta,', jointNormal('Modelo del relato global; no el de secciones',{meanX:12,meanY:30,sdX:2,sdY:4,rho:0.6})),
    stage('Observamos equis igual a catorce:', jointNormal('Corte global en X=14',{meanX:12,meanY:30,sdX:2,sdY:4,rho:0.6,cutX:14})),
    stage('Queremos que i griega supere treinta y cinco coma seis', normal('Normal del corte global: media 32,4; sd 3,2',32.4,3.2,{lower:35.6}))
  ],
  'independencia-variables':[
    stage('Mira una tabla con dos filas iguales:', matrix('Tabla global independiente',[[0.2,0.3],[0.2,0.3]],[[0,0]])),
    stage('Si los consumos comparten un máximo total,', CONCEPTS['independencia-variables']),
    stage('Una densidad constante dentro de un triángulo', triangle('Soporte triangular global: capacidad 2',2))
  ],
  'covarianza-matrices':[
    stage('Imagina dos parejas equiprobables:', scatter('Parejas equiprobables globales',[[0,1],[1,3]],{line:{slope:2,intercept:1}})),
    stage('En nuestro ejemplo las parejas están exactamente en una recta', scatter('Asociación lineal exacta del relato',[[0,1],[1,3]],{line:{slope:2,intercept:1}})),
    stage('En este ejemplo las varianzas son un cuarto y uno,', matrix('Covarianzas del relato; no [[9,6],[6,16]]',[[0.25,0.5],[0.5,1]],[[0,0],[1,1]]))
  ],
  'combinaciones-incorrelacion':[
    stage('Queremos combinar dos lecturas,', tree('Combinación del relato global',[branch('2X menos Y',['Coeficiente de X: 2','Coeficiente de Y: -1'])])),
    stage('Con varianzas cuatro y uno, y covarianza una mitad,', matrix('Covarianzas del ejemplo global',[[4,0.5],[0.5,1]])),
    stage('toma equis con valores menos uno, cero y uno, equiprobables,', scatter('Contraejemplo global discreto; no uniforme continua',[[-1,1],[0,0],[1,1]],{xLabel:'X',yLabel:'Y = X al cuadrado'}))
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

function enrichScene(scene, stages) {
  if (!stages?.length || !scene.cues?.length) return scene;
  const checkpoints = stages.flatMap(entry => {
    const cue = scene.cues.findIndex(item => item.text.includes(entry.quote));
    return cue < 0 ? [] : [{...entry, cue}];
  }).sort((left, right) => left.cue - right.cue);
  if (!checkpoints.length || checkpoints[0].cue !== 0) return scene;
  const phases = scene.cues.map((cue, index) => {
    const checkpoint = checkpoints.filter(entry => entry.cue <= index).at(-1);
    return phaseFor(scene,index,checkpoint.context,{anchorCue:checkpoint.cue,quote:checkpoint.quote});
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
  result.steps = result.steps.map(scene => enrichScene(scene, stages));
  return result;
}

export function enrichGlobalAnimation(animation, {lessonId = animation?.id} = {}) {
  if (!Object.hasOwn(CONCEPTS,lessonId) || !Array.isArray(animation?.steps) || animation.id && animation.id !== lessonId) return animation;
  const result = clone(animation);
  let state = {};
  let context = clone(CONCEPTS[lessonId]);
  let inExercise = false;
  let question = '';
  result.steps = result.steps.map((scene,sceneIndex) => {
    if (!scene.cues?.length) return scene;
    if (/^Ejercicio \d+: cambiamos los datos$/.test(scene.title)) {
      state = {}; question = ''; inExercise = true; context = clone(CONCEPTS[lessonId]);
    }
    if (scene.title === 'Qué nos llevamos de esta lección') {
      state = {}; question = ''; inExercise = false; context = clone(CONCEPTS[lessonId]);
    }
    const phases = scene.cues.map((cue,index) => {
      if (!inExercise) for (const checkpoint of GLOBAL_STAGES[lessonId] || []) {
        if (cue.text.includes(checkpoint.quote)) context = clone(checkpoint.context);
      }
      if (inExercise) {
        const givenLines = (scene.visual?.lines || []).filter(line=>line.cue===index && line.label==='Dato del problema');
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
      for (const line of scene.visual?.lines || []) if (line.cue === index && line.plot) {
        const authored = fromAuthoredPlot(line);
        if (authored) context = authored;
      }
      if (!finiteState(context)) {
        state.validModel = false;
        context = clone(CONCEPTS[lessonId]);
      }
      return phaseFor(scene,index,context,{anchorCue:index,quote:cue.text,scene:sceneIndex,mode:inExercise ? 'exercise' : 'recap'});
    });
    return {...scene,visual:{...scene.visual,context:clone(phases[0].context),phases}};
  });
  return result;
}