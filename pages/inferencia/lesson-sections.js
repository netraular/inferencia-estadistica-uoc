import {storyScene} from './lecture-story.js';

const beat = (say, ...show) => ({say, show});
const note = (label, value) => ({label, value});
const math = (strings, ...values) => ({tex:String.raw(strings, ...values)});
const quantity = (label, part, total) => ({label, value:`${part} de ${total}`, bar:{part, total}});
const plot = (label, points, xLabel, yLabel, extra = {}) => ({label, value:'', plot:{points, xLabel, yLabel, ...extra}});
const curve = (from, to, evaluate, count = 81) => Array.from({length:count}, (_, index) => {
  const position = from + (to - from) * index / (count - 1);
  return [position, evaluate(position)];
});
const triangle = (cut, limit = 1) => plot('Repartos permitidos', [[0,limit],[limit,0]], 'Recurso x', 'Recurso y', {shade:[0,limit], ...(cut === undefined ? {} : {cut})});
const standardNormal = () => curve(-4, 4, position => Math.exp(-(position ** 2) / 2) / Math.sqrt(2 * Math.PI));
const block = (id, title, covers, questionIds, beats) => ({id, title, covers, questionIds, beats});

const SECTIONS = {
  proporciones:[
    block('parte-y-total', 'Comparar semillas, no solo recuentos', [0,'El denominador cuenta una historia'], ['proportion'], [
      beat('En una bandeja germinan dieciocho semillas y en otra treinta. ¿Cuál ha germinado mejor? Todavía no podemos contestar.'),
      beat('En la primera sembramos setenta y dos. La parte son las dieciocho germinadas; el total son todas las sembradas en esa misma bandeja.', quantity('Primera bandeja',18,72)),
      beat('Una proporción divide la parte entre su propio total. Aquí dividimos dieciocho entre setenta y dos.', math`p=\frac{18}{72}`),
      beat('El cociente es cero coma veinticinco. Esa proporción representa una de cada cuatro semillas.', quantity('Parte del total',1,4)),
      beat('En la segunda bandeja sembramos doscientas. Treinta entre doscientas da cero coma quince. Hay más germinaciones, pero una proporción menor.', quantity('Segunda bandeja',30,200)),
      beat('No hemos supuesto que las semillas sean independientes. Estamos describiendo las dos bandejas observadas, no ajustando todavía un modelo de germinación.')
    ]),
    block('porcentaje-y-exposicion', 'Porcentaje, tasa y concentración', [1], null, [
      beat('¿Cómo contaríamos la primera proporción por cada cien semillas? El porcentaje cambia la escala, no el experimento.'),
      beat('Multiplicamos cero coma veinticinco por cien.', math`100\cdot0{,}25=25`),
      beat('Decimos veinticinco por ciento. Seguimos hablando de dieciocho entre setenta y dos, no de cien semillas nuevas.', note('Primera bandeja','25 %')),
      beat('Ahora un sensor registra seis llegadas en tres horas. El denominador mide exposición, no individuos. Seis dividido entre tres da dos llegadas por hora.', note('Tasa observada','2 llegadas/h')),
      beat('Una concentración divide una cantidad entre un volumen. Dos colonias por mililitro no es una probabilidad de dos: un mililitro puede contener varias colonias.', note('Concentración','Colonias por mililitro')),
      beat('Si juntamos bandejas de tamaños distintos, sumamos primero sus partes y sus totales. No promediamos sus porcentajes como si ambas aportasen las mismas semillas.')
    ]),
    block('unidades-y-cotas', 'Conservar la cantidad al cambiar unidades', ['Cambiar de escala con sentido'], ['micrograms'], [
      beat('¿Tres miligramos se vuelven más sustancia cuando los expresamos en microgramos? No. Solo usamos una unidad más pequeña.'),
      beat('Un miligramo contiene mil microgramos. Diez elevado a tres es la potencia que escribe ese factor mil.', math`1\,\mathrm{mg}=10^3\,\mathrm{\mu g}`),
      beat('Multiplicamos el número tres por mil.', math`3\cdot1000=3000`),
      beat('La misma cantidad pesa tres mil microgramos. Una media cambia con ese mismo factor; las distancias al cuadrado de una varianza cambian con el factor al cuadrado.', note('Misma cantidad','3 mg; 3000 microgramos')),
      beat('Antes de aceptar un cálculo, comprobamos la unidad y una cota. Una probabilidad está entre cero y uno. Un tiempo esperado se expresa en tiempo.'),
      beat('Con probabilidades pequeñas conservamos los decimales durante la cuenta. Redondear a cero antes de terminar convertiría un evento raro en un evento imposible por accidente.')
    ])
  ],
  algebra:[
    block('balanza', 'Encontrar el factor que completa el total', [0,'Una igualdad es un equilibrio'], ['constant'], [
      beat('Tres estados tienen pesos dos, tres y cinco. ¿Qué factor común los convierte en probabilidades? Los pesos solo indican importancia relativa.', note('Pesos','2; 3; 5')),
      beat('Primero sumamos los tres pesos. El resultado es diez.', math`2+3+5=10`),
      beat('Llamamos ce al factor buscado. Diez por ce debe valer uno, porque todas las probabilidades juntas completan el total.', math`10c=1`),
      beat('Dividimos ambos miembros por diez. Hacer la misma operación conserva la igualdad.', math`c=\frac1{10}`),
      beat('Una décima es positiva y está definida. Si la suma de pesos fuese cero, no podríamos normalizar mediante esta división.'),
      beat('El denominador completo es un bloque. El inverso de una suma no es la suma de sus inversos; eso también importará al reunir rutas en Bayes.')
    ]),
    block('comprobar-el-factor', 'Volver a la igualdad inicial', [1], ['last-share'], [
      beat('Ya tenemos el factor. ¿Qué proporción corresponde al último estado? Multiplicamos su peso cinco por una décima.', math`p_3=5\cdot\frac1{10}`),
      beat('Obtenemos una mitad. Del mismo modo, los otros dos estados reciben dos décimas y tres décimas.', quantity('Último estado',5,10)),
      beat('Ahora comprobamos el total sumando las tres proporciones.', math`0{,}2+0{,}3+0{,}5=1`),
      beat('Si alguna proporción fuese negativa, el despeje no bastaría para salvar el modelo. La solución también debe respetar las condiciones de una probabilidad.'),
      beat('Una potencia repite multiplicaciones. Tres al cuadrado significa tres por tres.', math`3^2=9`),
      beat('La raíz no negativa deshace ese cuadrado: la raíz de nueve es tres. No elegimos una raíz negativa para una desviación típica.', math`\sqrt9=3`)
    ]),
    block('deshacer-exponencial', 'Despejar un tiempo con un logaritmo', ['Potencias, raíces y logaritmos'], null, [
      beat('Una proporción restante sigue una exponencial con escala de seis horas. ¿Cuándo queda la mitad? Te será el tiempo y alfa la escala positiva.', math`e^{-t/6}=\frac12`),
      beat('El logaritmo natural deshace la exponencial de base e. Lo aplicamos a los dos lados; su argumento, una mitad, es positivo.', math`-t/6=\log(1/2)`),
      beat('Multiplicamos los dos miembros por menos seis para dejar solo el tiempo.', math`t=-6\log(1/2)`),
      beat('El logaritmo de una mitad es negativo. El tiempo resulta positivo: unas cuatro coma dieciséis horas.', note('Tiempo aproximado','4,16 h')),
      beat('Sustituir ese tiempo en la expresión inicial devuelve aproximadamente una mitad. Esa comprobación detecta un signo equivocado.'),
      beat('El logaritmo real necesita argumentos positivos y no podemos dividir por cero. Un parámetro que incumple el dominio indica que el planteamiento debe revisarse.')
    ])
  ],
  funciones:[
    block('entrada-y-salida', 'Seguir una entrada por la regla', [0,'Una función no es solo una curva'], ['value'], [
      beat('Una señal duplica la entrada y añade una unidad de base. ¿Qué salida produce la entrada tres? Llamamos ge a esa regla y equis a su entrada.', note('Regla','Duplicar; después añadir 1')),
      beat('Primero multiplicamos dos por tres.', math`2\cdot3=6`),
      beat('Después añadimos una unidad.', math`6+1=7`),
      beat('Ge de tres nombra esa salida siete. Los paréntesis no significan ge multiplicada por tres.', plot('Entradas y salidas',[[0,1],[1,3],[2,5],[3,7]],'Entrada x','Salida g(x)')),
      beat('El dominio dice qué entradas admitimos. Una regla por tramos cambia según la región; primero localizamos la entrada y después elegimos la fórmula.'),
      beat('El soporte de una variable señala dónde puede tener masa o densidad. Una fórmula que describe tiempos positivos no se extrapola sin permiso a tiempos negativos.')
    ]),
    block('sumar-salidas', 'El índice etiqueta términos', [1], ['sum'], [
      beat('¿Cuánto suman las salidas de cero, uno y dos con la misma regla? Calculamos antes cada salida.', note('Salidas de g','g(0): 1; g(1): 3; g(2): 5')),
      beat('Sumamos uno, tres y cinco. Obtenemos nueve.', math`1+3+5=9`),
      beat('El sumatorio, una sigma grande, abrevia esa suma. El índice i recorre las tres etiquetas; no es el valor que debemos añadir.', math`\sum_{i=1}^{3}a_i=a_1+a_2+a_3`),
      beat('Si una tabla etiqueta brotes cero, dos y cinco, la segunda fila representa dos brotes, no el índice dos por casualidad. Los índices y los valores cumplen trabajos distintos.'),
      beat('Los intervalos con paréntesis excluyen el extremo y los de corchetes lo incluyen. Necesitamos fijar esa decisión antes de seleccionar términos.')
    ]),
    block('seleccionar-valores', 'Menos de no es como máximo', ['Leer cada símbolo en voz alta'], null, [
      beat('Una planta puede tener cero, dos o cinco brotes. Sus masas son una décima, seis décimas y tres décimas. ¿Qué entra en menos de tres?', note('Modelo de brotes','0: 0,1; 2: 0,6; 5: 0,3')),
      beat('Entran cero y dos. Sumamos sus masas, no las etiquetas de brotes.', math`0{,}1+0{,}6=0{,}7`),
      beat('Menos de dos excluye el dos. Solo entra la masa en cero.', quantity('Menos de 2',1,10)),
      beat('Como máximo dos sí incluye el dos. Al menos dos incluye dos y cinco. Una palabra decide qué filas se reúnen.'),
      beat('En una variable con densidad un extremo aislado no añade área. En una discreta sí puede añadir masa, como los seis décimos de esta tabla.')
    ])
  ],
  calculo:[
    block('franjas', 'Acumular áreas de pequeñas franjas', [0,'De pequeñas franjas a un área'], null, [
      beat('Un tiempo está entre cero y dos minutos con densidad constante de medio por minuto. ¿Qué probabilidad queda entre cero coma cuatro y uno coma dos?', plot('Densidad del tiempo',[[0,0.5],[2,0.5]],'Tiempo (min)','Densidad (1/min)')),
      beat('Primero restamos los límites para obtener la anchura.', math`1{,}2-0{,}4=0{,}8`),
      beat('Ahora multiplicamos la altura medio por la anchura cero coma ocho.', math`0{,}5\cdot0{,}8=0{,}4`),
      beat('La franja sombreada tiene probabilidad cuatro décimas. Las unidades de tiempo y de tiempo inverso se cancelan.', plot('Intervalo solicitado',[[0,0.5],[2,0.5]],'Tiempo (min)','Densidad (1/min)',{shade:[0.4,1.2]})),
      beat('Si la altura cambia, usamos franjas más estrechas. La integral acumula sus aportaciones; el diferencial de te identifica la variable que recorre el tiempo.'),
      beat('Si la regla cambia dentro del intervalo, separamos las integrales en esa frontera. No usamos una sola fórmula fuera de su tramo.')
    ]),
    block('primitiva', 'Evaluar los dos extremos', [1], ['normalizer','below'], [
      beat('Probemos otra altura: te dividido entre dos, de cero a dos. ¿Cómo acumulamos hasta un minuto? Ahora la derecha aporta franjas más altas.', plot('Altura creciente',[[0,0],[1,0.5],[2,1]],'Tiempo (min)','Densidad (1/min)',{shade:[0,1]})),
      beat('Una primitiva, ge, debe devolver la altura cuando la derivamos. Te al cuadrado dividido entre cuatro cumple eso.', math`G(t)=t^2/4`),
      beat('Evaluamos ge en el límite superior, uno. Obtenemos un cuarto.', math`G(1)=1/4`),
      beat('Evaluamos ge en el límite inferior, cero. Obtenemos cero.', math`G(0)=0`),
      beat('Restamos el valor inferior al superior. El área es un cuarto.', math`1/4-0=1/4`),
      beat('El teorema fundamental del cálculo permite esa resta cuando ge es una primitiva del integrando bajo las condiciones habituales. Antes comprobamos signo, soporte y área total uno.')
    ]),
    block('pendiente-acumulada', 'Altura y acumulación son funciones distintas', ['La pendiente de lo acumulado'], ['point'], [
      beat('¿Qué cambia cuando avanzamos un poco el umbral? Efe mayúscula acumula áreas. Efe minúscula es la altura local de la densidad.'),
      beat('Para la altura anterior, la acumulada dentro del soporte es te al cuadrado dividido entre cuatro.', plot('Área ya acumulada',curve(0,2,time=>time*time/4),'Tiempo (min)','F(t)')),
      beat('La derivada de esa acumulada devuelve te dividido entre dos, donde existe la derivada.', math`F'(t)=t/2`),
      beat('En un minuto, la pendiente vale medio por minuto. La altura no es la probabilidad de ese instante.', note('En t = 1','Densidad: 0,5 por minuto; área hasta 1: 0,25')),
      beat('Un punto tiene anchura cero y no aporta área. Una acumulada no puede bajar ni superar uno. Una densidad negativa o un área total incorrecta son errores del modelo o de la cuenta.')
    ])
  ],
  'regiones-matrices':[
    block('frontera', 'Un reparto es un punto del plano', [0,'Dos medidas necesitan dos coordenadas'], ['remaining'], [
      beat('Repartimos una unidad de recurso entre dos cultivos. ¿Puede cada uno recibir ocho décimas? Equis es el primero e i griega el segundo.', note('Coordenadas','x: primer cultivo; y: segundo cultivo')),
      beat('Ambas cantidades son no negativas. La frontera equis más i griega igual a uno impide gastar más recurso del disponible.', triangle()),
      beat('El punto de ocho décimas en cada cultivo queda fuera: su suma supera uno. El cuadrado completo añadiría repartos imposibles.'),
      beat('Fijemos equis en tres décimas. Restamos esa cantidad al recurso total.', math`1-0{,}3=0{,}7`),
      beat('El corte permite a i griega recorrer de cero a siete décimas.', triangle(0.3)),
      beat('Ese límite cambia cuando movemos equis. Una frontera inclinada pide límites interiores variables, no un rectángulo de límites constantes.')
    ]),
    block('recorrer-triangulo', 'De los cortes a la integral doble', [1], ['area'], [
      beat('¿Qué tamaño tiene la región completa? El triángulo ocupa la mitad del cuadrado de lado uno.', math`\text{área}=\frac{1\cdot1}{2}`),
      beat('Su área es una mitad. Para integrar una función ge, recorremos primero i griega de cero a uno menos equis.', math`\int_0^{1-x}g(x,y)\,dy`),
      beat('Después movemos equis desde cero hasta uno y reunimos todos los cortes.', math`\int_0^1\left[\int_0^{1-x}g(x,y)\,dy\right]dx`),
      beat('Si más adelante usamos una densidad constante, su altura debe completar volumen uno. Dividimos uno entre el área de una mitad.', math`c=\frac1{1/2}`),
      beat('La altura sería dos. No es una probabilidad de dos: la probabilidad resulta de multiplicar densidad por área.')
    ]),
    block('orden-de-matriz', 'Etiquetar filas y columnas', ['Ordenar varias cantidades'], null, [
      beat('Medimos dos biomarcadores de una misma muestra. ¿Cómo evitamos intercambiarlos al guardar sus resúmenes? Un vector conserva un orden acordado.', math`\boldsymbol\mu=\begin{pmatrix}\mu_1\\\mu_2\end{pmatrix}`),
      beat('Mu uno nombra la primera media y mu dos la segunda. Una matriz añade filas y columnas. En la diagonal colocamos las varianzas cuatro y nueve.', math`\Sigma=\begin{pmatrix}4&1\\1&9\end{pmatrix}`),
      beat('La fila primera y columna segunda contienen uno, la covarianza de las dos medidas. La otra entrada cruzada es igual por simetría.', note('Entrada (1,2)','Covarianza: 1')),
      beat('Para multiplicar una matriz por un vector, combinamos una fila con la columna mediante productos y después los sumamos. La primera fila aplicada a dos y tres produce ocho más tres.', math`4\cdot2+1\cdot3=11`),
      beat('Si cambia el orden de los biomarcadores, cambian el vector y ambas etiquetas de la matriz. Una covarianza tiene producto de unidades; no comparamos todas las entradas como si fueran probabilidades.')
    ])
  ],
  sucesos:[
    block('resultados-y-sucesos', 'Conservar la identidad de dos semillas', [0,'Definir qué se observa'], null, [
      beat('Observamos dos semillas etiquetadas. ¿Es lo mismo que germine la primera que que germine exactamente una? Necesitamos conservar quién es quién.'),
      beat('Escribimos cuatro resultados: ninguna, solo primera, solo segunda y ambas. Omega nombra ese espacio de resultados, sin suponer equiprobabilidad.', note('Omega','Ninguna; primera; segunda; ambas')),
      beat('A será germina la primera. Reúne solo primera y ambas. Un suceso es un conjunto de resultados, no necesariamente uno solo.', note('Suceso A','Primera; ambas')),
      beat('Exactamente una reúne primera y segunda. Se solapa con a, pero no es el mismo conjunto.', note('Exactamente una','Primera; segunda')),
      beat('Un experimento determinista fija el resultado mediante sus condiciones en el modelo. El aleatorio admite varias posibilidades antes de realizarse. Cambiar a un recuento borra parte de la identidad, no elimina el azar.')
    ]),
    block('traducir-conjuntos', 'Ambos, cualquiera, solo uno y ninguno', [1,'El lenguaje de los conjuntos'], ['union','neither'], [
      beat('En cien células hay treinta solo con a, veinte solo con be, diez con ambos y cuarenta con ninguno. ¿Qué selecciona cada frase?', note('Células','Solo A: 30; solo B: 20; ambos: 10; ninguno: 40')),
      beat('Intersección se lee ambas condiciones. A intersección be selecciona las diez dobles.', quantity('Ambos',10,100)),
      beat('Unión se lee al menos una, incluidos ambos. Reunimos las treinta, las veinte y las diez, obteniendo sesenta.', quantity('Al menos uno',60,100)),
      beat('Complemento se lee no ocurre dentro de omega. Solo a pide a y no be; el superíndice ce señala el complemento.', math`A\setminus B=A\cap B^c`),
      beat('Ni a ni be exige los dos complementos. La ley de De Morgan selecciona los mismos cuarenta por dos caminos.', math`(A\cup B)^c=A^c\cap B^c`),
      beat('Todo omega es el suceso seguro. El conjunto vacío es el imposible. La unión no significa exclusivamente uno salvo que la frase lo exija.')
    ]),
    block('observabilidad', 'Qué preguntas admiten probabilidad', ['Qué exige la observabilidad'], null, [
      beat('¿Podemos asignar probabilidad a cualquier pregunta que inventemos? En este espacio finito sí elegimos todos los subconjuntos. En un continuo necesitamos declarar una colección observable.'),
      beat('A caligráfica nombra la sigma álgebra. Contiene omega y, con cada suceso, su complemento.', math`\Omega\in\mathcal A`),
      beat('También contiene la unión de una lista numerable de sucesos observables. Numerable significa que podemos etiquetarlos primero, segundo y así sucesivamente.', math`\bigcup_{i=1}^{\infty}A_i\in\mathcal A`),
      beat('De Morgan obtiene las intersecciones mediante complementos y uniones. Así las operaciones vuelven a producir preguntas a las que podemos asignar probabilidad.'),
      beat('El espacio de probabilidad reúne tres piezas: resultados omega, sucesos observables a caligráfica y regla pe.', math`(\Omega,\mathcal A,P)`),
      beat('Esta condición formal no dice que todas las posibilidades tengan el mismo peso ni que debamos conocer el resultado antes de observarlo.')
    ])
  ],
  axiomas:[
    block('probabilidades-coherentes', 'Una escala que debe completar uno', [0,'Reglas que cualquier modelo debe respetar'], null, [
      beat('Un cultivo puede estar en tres estados excluyentes. ¿Qué exige cualquier reparto de probabilidades coherente?'),
      beat('Cada probabilidad es no negativa y todo el espacio tiene probabilidad uno.', math`P(\Omega)=1`),
      beat('Con masas dos décimas, tres décimas y cinco décimas, los dos primeros estados se reúnen sumando porque no pueden coexistir.', math`0{,}2+0{,}3=0{,}5`),
      beat('La aditividad numerable permite sumar también una lista infinita de sucesos disjuntos. La condición disjuntos evita contar un resultado varias veces.', math`P\!\left(\bigcup_i A_i\right)=\sum_iP(A_i)`),
      beat('Si hay solapamientos, esa suma directa deja de servir. Con tres sucesos, restamos las tres intersecciones por parejas y volvemos a añadir la triple, retirada demasiadas veces.', note('Tres sucesos','Sumar individuales; restar parejas; añadir triple')),
      beat('Las regiones de un dibujo indican qué se solapa. Su tamaño dibujado no determina las probabilidades del modelo.')
    ]),
    block('solapamiento', 'Corregir una copia de las células dobles', [1], ['union','neither'], [
      beat('En un modelo de marcadores, a tiene probabilidad cuarenta y cinco centésimas; be, treinta; ambos, quince. ¿Cuánto pesa al menos uno?'),
      beat('Sumamos primero las dos probabilidades individuales.', math`0{,}45+0{,}30=0{,}75`),
      beat('Las células dobles entraron dos veces. Restamos una copia de quince centésimas.', math`0{,}75-0{,}15=0{,}60`),
      beat('La unión pesa seis décimas. El complemento de esa unión, ninguno, ocupa lo que falta hasta uno.', math`1-0{,}60=0{,}40`),
      beat('La fórmula resume esta corrección, con intersección para las dobles y unión para al menos uno.', math`P(A\cup B)=P(A)+P(B)-P(A\cap B)`)
    ]),
    block('deducir-propiedades', 'Vacío, complemento e inclusión', ['De los axiomas a las propiedades'], null, [
      beat('¿Son el complemento y la inclusión reglas nuevas que memorizar? Podemos deducirlas del mismo total uno.'),
      beat('Omega y vacío son disjuntos; añadir el vacío no cambia omega. Su probabilidad tiene que ser cero.', math`P(\varnothing)=0`),
      beat('Un suceso y su complemento completan omega sin solaparse. Restar el suceso del total deja el complemento.', math`P(A^c)=1-P(A)`),
      beat('Si a está contenido en be, be se divide en a y la parte de be fuera de a.', math`P(B)=P(A)+P(B\setminus A)`),
      beat('La segunda parte es no negativa. Por eso a no puede tener más probabilidad que be.', math`P(A)\leq P(B)`)
    ]),
    block('frecuencia', 'El modelo no obliga a compensar una racha', ['Una frecuencia no es una garantía'], null, [
      beat('¿Seis observaciones positivas de diez demuestran que la probabilidad es exactamente seis décimas? Describen una frecuencia de esa muestra.', quantity('Frecuencia observada',6,10)),
      beat('Un indicador vale uno si ocurre a y cero si no. Pe con sombrero suma esos indicadores y divide por el número de ensayos ene.', math`\widehat p_n=\frac1n\sum_{i=1}^n I_A^{(i)}`),
      beat('Con ensayos independientes y probabilidad estable, esa frecuencia se estabiliza al aumentar las repeticiones. Todavía fluctúa en muestras finitas.'),
      beat('Una racha no cambia la probabilidad del siguiente ensayo independiente. El azar no tiene una deuda que deba compensar.'),
      beat('Casos favorables entre casos posibles exige equiprobabilidad. Poner nombres a tres estados no demuestra que pesen un tercio cada uno.'),
      beat('Una simulación describe cómo fluctúan las frecuencias bajo el modelo elegido. No demuestra que ese modelo represente un sistema vivo.')
    ])
  ],
  combinatoria:[
    block('posiciones', 'Contar elecciones ordenadas', [0,'Dos preguntas antes de contar'], ['ordered','with-repetition','all-ordered'], [
      beat('Cinco tubos deben ocupar dos posiciones etiquetadas. ¿Intercambiarlos cambia el resultado? Sí, porque izquierda y derecha cumplen funciones distintas.'),
      beat('Sin repetir tubo hay cinco opciones primero y cuatro después. El principio del producto cuenta las rutas.', math`5\cdot4=20`),
      beat('Con repetición cada posición mantiene cinco opciones. Este experimento diferente tiene veinticinco secuencias.', math`5^2=25`),
      beat('Para ordenar todos los tubos distintos usamos un factorial. Ene factorial multiplica las opciones descendentes; cero factorial vale uno.', math`0!=1`),
      beat('Para ordenar solo erre tubos entre ene sin repetición, la variación divide dos factoriales.', math`V_{n,r}=\frac{n!}{(n-r)!}`),
      beat('Con repetición usamos ene elevado a erre. Estas cuentas no asignan todavía probabilidades: las rutas podrían tener pesos distintos.')
    ]),
    block('quitar-orden', 'Elegir un grupo sin etiquetar posiciones', [1,'Quitar las etiquetas que no importan'], ['unordered'], [
      beat('Ahora analizaremos dos tubos juntos, sin distinguir izquierda y derecha. ¿Son a be y be a grupos distintos? No.'),
      beat('Las veinte asignaciones anteriores contienen dos copias de cada pareja. Dividimos por las dos reordenaciones.', math`20/2=10`),
      beat('Para un grupo de erre elementos hay erre factorial reordenaciones. La combinación las elimina del recuento ordenado.', math`\binom nr=\frac{n!}{r!(n-r)!}`),
      beat('El símbolo vertical ene sobre erre cuenta combinaciones; no divide ene entre erre. En cinco tubos, elegir dos da diez grupos.', note('Resultado','10 parejas sin orden')),
      beat('Sin reemplazo, el contenido disponible cambia después de extraer. Con reemplazo puede sostenerse independencia si el mecanismo se repite de manera estable.')
    ]),
    block('multiplicidades', 'No distinguir etiquetas iguales', ['Quitar las etiquetas que no importan'], ['repeated-labels'], [
      beat('Tres etiquetas de especie a y dos de especie be ocupan cinco posiciones. ¿Intercambiar las dos be crea una secuencia nueva? No.'),
      beat('Si fueran distintas tendríamos cinco factorial ordenaciones. Ese factorial vale ciento veinte.', math`5!=120`),
      beat('Las tres a se reordenan de seis maneras y las dos be de dos. El denominador tiene doce duplicaciones por secuencia.', math`3!\cdot2!=12`),
      beat('Dividimos ciento veinte entre doce. Quedan diez secuencias distintas.', math`120/12=10`),
      beat('En general dividimos ene factorial por los factoriales de todas las multiplicidades. Esta idea reaparecerá en la multinomial.', math`\frac{n!}{n_1!\cdots n_k!}`),
      beat('Antes de convertir la cuenta en una probabilidad, comprobamos que las secuencias elementales consideradas sean equiprobables.')
    ])
  ],
  condicionada:[
    block('grupo-conocido', 'El filtro cambia el denominador', [0,'Mirar solo dentro de un grupo'], ['recovery-given-treatment'], [
      beat('De doscientas muestras, ochenta pasan un filtro y veinticuatro de esas ochenta llevan un marcador. ¿Qué parte del grupo filtrado tiene el marcador?', quantity('Pasan el filtro',80,200)),
      beat('La información conocida descarta las otras ciento veinte. Ahora el total relevante es ochenta.', quantity('Marcador dentro del filtro',24,80)),
      beat('Dividimos veinticuatro entre ochenta y obtenemos tres décimas.', math`24/80=0{,}30`),
      beat('A será el marcador y be el filtro. La barra se lee dado be. El numerador usa ambos y el denominador todo be.', math`P(A\mid B)=\frac{P(A\cap B)}{P(B)}`),
      beat('El cociente define una probabilidad dentro de be solo cuando be tiene probabilidad positiva. Su total vuelve a ser uno y respeta complementos y uniones.'),
      beat('Si be es imposible bajo el modelo, dividir por cero no produce una probabilidad cero. Necesitamos otro planteamiento de la condición.')
    ]),
    block('invertir-grupo', 'La misma intersección, otra pregunta', [1], ['treatment-given-recovery'], [
      beat('¿Qué cambia si preguntamos por superar el filtro entre quienes tienen marcador? Conservamos los veinticuatro comunes, pero necesitamos conocer todos los marcadores.'),
      beat('Supongamos sesenta muestras con marcador en la población completa. Ahora veinticuatro se comparan con sesenta.', quantity('Filtro dentro del marcador',24,60)),
      beat('El cociente vale cuatro décimas, no las tres décimas anteriores.', math`24/60=0{,}40`),
      beat('La conjunta en toda la población es otra pregunta. Dividimos los veinticuatro comunes entre doscientas.', math`24/200=0{,}12`),
      beat('Pe de a dado be y pe de be dado a usan la misma intersección, pero normalizan grupos diferentes. Escribir el grupo con palabras permite detectar una inversión.')
    ]),
    block('ruta-condicionada', 'Cada etapa conserva la información anterior', ['Recorrer un árbol en el orden correcto'], null, [
      beat('Una ruta requiere pasar el filtro, conservar viabilidad y expresar una señal. ¿Podemos multiplicar tres probabilidades de toda la población? No si el filtro selecciona un grupo diferente.'),
      beat('Pasar el filtro tiene probabilidad cuatro décimas. Dentro de quienes lo pasan, conservar viabilidad tiene probabilidad una mitad.', math`0{,}4\cdot0{,}5=0{,}2`),
      beat('Dentro de quienes cumplen las dos primeras condiciones, la señal aparece con probabilidad tres cuartos. Multiplicamos la ruta ya reunida por esa probabilidad.', math`0{,}2\cdot0{,}75=0{,}15`),
      beat('La tercera condición se basa en toda la información acumulada, no solo en la primera. A, be y ce nombran las tres etapas.', math`P(A\cap B\cap C)=P(A)P(B\mid A)P(C\mid A\cap B)`),
      beat('Esta ruta tiene probabilidad quince centésimas. Eliminar los condicionamientos requiere independencia justificada, no comodidad algebraica.')
    ])
  ],
  'independencia-sucesos':[
    block('producto', 'Saber un fallo no cambia el otro', [0,'No coexistir y no informar son ideas distintas'], ['product'], [
      beat('Dos controles fallan con probabilidades dos décimas y tres décimas. ¿Pueden fallar juntos siendo independientes? Sí: independencia no significa excluirse.'),
      beat('Si son independientes, el fallo conjunto coincide con el producto de sus probabilidades.', math`0{,}2\cdot0{,}3=0{,}06`),
      beat('Necesitamos comparar seis centésimas con la conjunta del modelo. La igualdad, no el parecido, decide independencia.', math`P(A\cap B)=P(A)P(B)`),
      beat('Esta definición no divide por probabilidades y funciona también con sucesos de probabilidad cero.'),
      beat('Incompatibilidad significa conjunta cero. Si ambas probabilidades son positivas, el producto no es cero: conocer un fallo descarta el otro y crea dependencia.'),
      beat('Sin reemplazo cambia el contenido disponible. Con reemplazo y mecanismo estable puede justificarse independencia, pero el nombre del muestreo no sustituye el mecanismo.')
    ]),
    block('comprobar-informacion', 'Comparar antes y después de conocer', [1], ['given'], [
      beat('Supongamos ahora que el fallo conjunto pesa una décima, manteniendo a en dos décimas y be en tres. ¿Saber be cambia a?'),
      beat('Dividimos la conjunta una décima entre la condición be, tres décimas.', math`P(A\mid B)=0{,}1/0{,}3`),
      beat('Obtenemos un tercio. Es diferente de las dos décimas de a antes de conocer be.', note('Comparación','Antes: 0,2; dado B: 1/3')),
      beat('Hay dependencia. Esta forma condicionada exige que la probabilidad de be sea positiva.'),
      beat('Células del mismo cultivo comparten medio y tratamiento. No las convertimos en réplicas independientes por escribirlas en filas diferentes.')
    ]),
    block('independencia-mutua', 'Las parejas no cuentan toda la historia', ['Más de dos sucesos'], null, [
      beat('Lanzamos dos bits independientes y equiprobables. A dice primero uno, be dice segundo uno y ce dice que difieren. ¿Basta verificar cada pareja?', note('Cuatro resultados','00; 01; 10; 11')),
      beat('Cada suceso pesa una mitad. La intersección de cualquier pareja pesa un cuarto, como el producto de sus marginales.', quantity('Una pareja',1,4)),
      beat('Pero a y be simultáneos obligan a dos unos. Entonces ce, difieren, no puede ocurrir. La triple tiene probabilidad cero.', math`P(A\cap B\cap C)=0`),
      beat('El producto de las tres mitades daría un octavo, no cero.', math`(1/2)^3=1/8`),
      beat('Hay independencia por parejas, pero no mutua. Para la mutua comprobamos toda subcolección jota, también las triples y las mayores.', math`P\!\left(\bigcap_{i\in J}A_i\right)=\prod_{i\in J}P(A_i)`)
    ])
  ],
  'bayes-diagnostico':[
    block('rutas-positivas', 'Reunir los positivos de dos grupos', [0,'Sumar rutas y después invertir la pregunta'], ['positive'], [
      beat('Una prueba tiene sensibilidad ocho décimas y especificidad nueve décimas. ¿Un positivo significa ocho décimas de probabilidad de infección? Sigamos primero los grupos.'),
      beat('En mil plantas imaginarias hay cien infectadas y novecientas sin infección. Forman una partición: no se solapan y cubren todas las plantas.', quantity('Infectadas',100,1000)),
      beat('Sensibilidad, ese, cuenta positivos entre infectadas. Ocho décimas de cien producen ochenta positivos esperados.', math`0{,}8\cdot100=80`),
      beat('Especificidad, ce, cuenta negativos entre no infectadas. Su complemento deja una décima de falsos positivos.', math`1-0{,}9=0{,}1`),
      beat('Una décima de las novecientas no infectadas produce noventa positivos esperados.', math`0{,}1\cdot900=90`),
      beat('Sumamos ochenta y noventa. Hay ciento setenta positivos esperados; la probabilidad total reúne ambas rutas ponderadas.', quantity('Todos los positivos',170,1000))
    ]),
    block('posterior', 'Invertir la pregunta dentro de los positivos', [1], ['posterior'], [
      beat('Ahora conocemos un positivo. ¿Qué parte de ese grupo procede de las infectadas? Ochenta de los ciento setenta positivos esperados.', quantity('Infectadas entre positivos',80,170)),
      beat('Dividimos ochenta entre ciento setenta. Obtenemos aproximadamente cero coma cuatrocientos setenta y uno.', math`\mathrm{VPP}=80/170`),
      beat('Ese es el valor predictivo positivo, no la sensibilidad. Bayes divide la ruta del grupo de interés entre todas las rutas compatibles con la observación.', math`P(A_j\mid B)=\frac{P(B\mid A_j)P(A_j)}{P(B)}`),
      beat('La previa pesa el grupo antes de la prueba. La verosimilitud pesa el positivo dentro del grupo. La posterior pesa el grupo después del positivo; no son intercambiables.'),
      beat('El denominador debe ser positivo. Con más grupos, la probabilidad total suma sus rutas, nunca una media simple sin ponderar.', math`P(B)=\sum_iP(B\mid A_i)P(A_i)`)
    ]),
    block('negativos-y-prevalencia', 'Cambiar el signo o la población cambia el total', ['Por qué importa la prevalencia'], null, [
      beat('¿Y si la prueba sale negativa? Entre las no infectadas esperamos ochocientos diez negativos. Entre las infectadas hay veinte falsos negativos.', note('Negativos esperados','No infectadas: 810; infectadas: 20')),
      beat('Sumamos ambas rutas negativas para obtener ochocientos treinta.', math`810+20=830`),
      beat('El valor predictivo negativo compara los ochocientos diez no infectados con todos los negativos.', math`\mathrm{VPN}=810/830`),
      beat('El cociente es aproximadamente novecientas setenta y seis milésimas. No reutilizamos el denominador ciento setenta de los positivos.'),
      beat('Pi nombra la prevalencia, aquí una décima. Si bajamos a una centésima con la misma prueba, se esperan ocho positivos verdaderos y noventa y nueve falsos.', note('Otra población de 1000','Prevalencia 1 %; verdaderos positivos 8; falsos positivos 99')),
      beat('Ahora el valor predictivo positivo es ocho entre ciento siete: mucho menor. Una prueba con falsos positivos cambia su valor predictivo al cambiar la prevalencia. Son ejemplos ficticios, no recomendaciones diagnósticas.', math`\mathrm{VPP}=8/107`)
    ])
  ],
  'variable-cdf':[
    block('regla-observable', 'Del resultado a una medida', [0,'Una regla antes de observar, un valor después'], null, [
      beat('Un campo contiene una o varias larvas. ¿Qué es aleatorio antes de mirar: la regla de contar o el valor que obtendremos? La regla está fijada; desconocemos el resultado.'),
      beat('Equis mayúscula asigna un número a cada resultado omega. Equis minúscula será una realización o un umbral, según la pregunta.', math`X:\Omega\longrightarrow\mathbb R`),
      beat('Varios resultados detallados pueden producir el mismo recuento. Contar dos larvas no conserva la identidad de cada larva.'),
      beat('La medibilidad exige que preguntar si equis no supera cualquier umbral forme un suceso observable. A caligráfica nombra la colección de esos sucesos.', math`\{\omega:X(\omega)\leq x\}\in\mathcal A`),
      beat('La condición vale para todo umbral real. No exige resultados equiprobables ni adivinar qué valor saldrá.')
    ]),
    block('escalones', 'Acumular hasta un umbral, incluido', [1], ['cdf','strict'], [
      beat('Un modelo asigna cero, una y dos larvas con masas dos décimas, cinco décimas y tres décimas. ¿Cuánta probabilidad llevamos reunida hasta una?', note('Tabla','0: 0,2; 1: 0,5; 2: 0,3')),
      beat('Efe mayúscula sub equis se lee acumulada de equis. Hasta uno incluye las masas de cero y uno.', math`0{,}2+0{,}5=0{,}7`),
      beat('Entre uno y dos no entra un valor nuevo. Efe de uno coma cinco también vale siete décimas, aunque la variable no pueda valer uno coma cinco.', plot('Acumulada de larvas',[[-0.5,0],[0,0],[0,0.2],[1,0.2],[1,0.7],[2,0.7],[2,1],[2.5,1]],'Umbral de larvas','F(x)')),
      beat('Al llegar a dos incorporamos tres décimas y alcanzamos uno. La acumulada nunca baja y es continua por la derecha: en el salto usa el valor que ya incluyó ese punto.'),
      beat('Menos de uno excluye la larva única. Como máximo uno la incluye. Para intervalos con extremos discretos comprobamos exactamente qué masas entran.')
    ]),
    block('intervalos-y-saltos', 'Una altura acumulada no es una masa', ['La acumulada como lenguaje común'], null, [
      beat('¿Qué parte queda entre cero excluido y dos incluido? Restamos lo que ya habíamos acumulado hasta cero de lo acumulado hasta dos.', math`1-0{,}2=0{,}8`),
      beat('La regla general resta efe de a de efe de be para el intervalo abierto a la izquierda y cerrado a la derecha.', math`P(a<X\leq b)=F_X(b)-F_X(a)`),
      beat('Pe sub equis de uno nombra la masa en uno: el salto, no las siete décimas de altura. Efe de uno menos indica el límite al acercarnos por la izquierda.', math`p_X(1)=F_X(1)-F_X(1^-)`),
      beat('Ese salto vale cinco décimas. La acumulada tiende a cero y uno en los extremos de la recta, y existe para cualquier variable real.'),
      beat('Una absolutamente continua acumula una densidad sin saltos. Pero una acumulada continua no garantiza por sí sola que exista densidad: también hay continuas singulares, que aquí no desarrollamos.')
    ])
  ],
  masa:[
    block('agrupar-y-normalizar', 'Pesos sobre valores separados', [0,'La probabilidad que vive en puntos'], ['normalizer'], [
      beat('Los brotes posibles son cero, dos y cuatro, con pesos uno, tres y uno. ¿Son ya probabilidades? Todavía no, porque suman cinco.', note('Valores y pesos','0: 1; 2: 3; 4: 1')),
      beat('Sumamos todos los pesos del soporte.', math`1+3+1=5`),
      beat('Ce será el factor común. Para total uno dividimos uno entre cinco.', math`c=1/5`),
      beat('Multiplicamos cada peso por ce. Las masas quedan dos décimas, seis décimas y dos décimas.', note('Masas normalizadas','0: 0,2; 2: 0,6; 4: 0,2')),
      beat('Pe sub equis de un valor es la probabilidad de ese valor exacto. Si varios resultados producen dos brotes, sus probabilidades se reúnen en la misma fila.'),
      beat('Cada masa debe ser no negativa y la suma total uno. El soporte puede ser finito o numerable; no necesita valores consecutivos. Añadir un valor nuevo obliga a revisar la normalización.')
    ]),
    block('intervalos-discretos', 'Elegir las masas que cumplen la frase', [1], null, [
      beat('Con la tabla normalizada, ¿qué diferencia hay entre al menos dos brotes y más de dos?'),
      beat('Al menos dos incluye dos y cuatro. Sumamos seis décimas y dos décimas.', math`0{,}6+0{,}2=0{,}8`),
      beat('Más de dos solo incluye cuatro, con masa dos décimas.', quantity('Más de 2 brotes',2,10)),
      beat('En uno o tres no hay masa. No llenamos los huecos del soporte porque el umbral sea un número real.'),
      beat('Al menos una aparición suele resolverse excluyendo ninguna. La acumulada permite otras sumas, pero la desigualdad decide si el extremo se incluye.')
    ]),
    block('interruptores', 'Un indicador sigue valiendo cero o uno', ['Indicadores y frases de recuento'], null, [
      beat('¿Podemos convertir tener marcador en un número? El indicador de a vale uno si ocurre a y cero si no.', math`I_A\in\{0,1\}`),
      beat('Para ambos marcadores multiplicamos sus indicadores. El producto solo vale uno si los dos valen uno.', math`I_{A\cap B}=I_AI_B`),
      beat('Para al menos uno, sumar directamente daría dos cuando hay ambos. Primero sumamos los indicadores.', note('Con ambos presentes','1 + 1 produce 2')),
      beat('Restamos una copia del producto para devolver ese caso al valor uno.', math`I_{A\cup B}=I_A+I_B-I_AI_B`),
      beat('El indicador de una unión no cuenta cuántos marcadores hay: solo registra si ocurre la condición. Su esperanza es la probabilidad de esa condición.')
    ])
  ],
  densidad:[
    block('altura-y-area', 'Un intervalo tiene anchura; un punto no', [0,'El punto no tiene anchura'], ['point'], [
      beat('Una reacción dura entre cero y medio minuto con densidad constante dos por minuto. ¿Puede ser una densidad válida aunque dos supere uno?', plot('Densidad constante',[[0,2],[0.5,2]],'Tiempo (min)','Densidad (1/min)')),
      beat('La altura por la anchura completa debe dar uno.', math`2\cdot0{,}5=1`),
      beat('Entre una décima y tres décimas hay anchura dos décimas. Multiplicarla por altura dos da probabilidad cuatro décimas.', plot('Probabilidad del intervalo',[[0,2],[0.5,2]],'Tiempo (min)','Densidad (1/min)',{shade:[0.1,0.3]})),
      beat('Un punto exacto no tiene anchura; su probabilidad es cero. Las llaves contienen un único instante te, no un intervalo. Esto no impide que cada realización concreta tenga un valor.', math`P(T\in\{t\})=0`),
      beat('La densidad tiene unidades inversas de tiempo; la probabilidad de intervalo no tiene unidades. Un instrumento que redondea registra un intervalo de resolución, no un punto de precisión infinita.')
    ]),
    block('densidad-creciente', 'Normalizar antes de preguntar por una zona', [1], ['normalizer','below'], [
      beat('Otro modelo usa densidad ce por equis entre cero y uno. ¿Qué ce completa área uno? Su gráfica es un triángulo.'),
      beat('La base mide uno y la altura final ce. El área total es ce dividido entre dos.', math`c/2=1`),
      beat('Multiplicamos los dos lados por dos. La constante es dos.', math`c=2`),
      beat('La densidad dos por equis aumenta dentro del soporte. A la derecha de medio el área es mayor que una mitad.', plot('Densidad f(x) = 2x',[[0,0],[1,2]],'Fracción x','Densidad f(x)',{shade:[0.5,1]})),
      beat('Una primitiva es equis al cuadrado. Hasta medio, su valor acumulado es un cuarto.', math`F(0{,}5)=0{,}25`),
      beat('La zona restante pesa tres cuartos. Una altura en ocho décimas valdría uno coma seis, pero no sería la probabilidad de exactamente ocho décimas.')
    ]),
    block('acumulada-por-tramos', 'La acumulada completa el soporte', ['Construir la acumulada por tramos'], null, [
      beat('¿Qué vale la acumulada antes de cero y después de uno? No extrapolamos el cuadrado fuera del soporte.'),
      beat('Antes de cero no hemos acumulado área; dentro integramos dos por equis; después de uno ya reunimos todo.', math`F(x)=\begin{cases}0&x<0\\x^2&0\leq x\leq1\\1&x>1\end{cases}`),
      beat('La curva muestra esas tres regiones, incluida la parte plana después del soporte.', plot('Acumulada completa',[[-0.25,0],...curve(0,1,value=>value*value),[1.25,1]],'Umbral x','Acumulada F(x)')),
      beat('Donde existe la derivada correspondiente, la pendiente de efe mayúscula devuelve la densidad. En general basta que ocurra casi en todas partes.'),
      beat('Cambiar la densidad en un solo punto no cambia áreas. Incluir o excluir los extremos del intervalo no altera la probabilidad de este modelo absolutamente continuo.'),
      beat('Comprobamos signo, soporte y total uno; después podemos comparar la integral de un intervalo con la diferencia de acumuladas.')
    ])
  ],
  esperanza:[
    block('promedio-ponderado', 'Un centro que no tiene que observarse', [0,'Un centro de equilibrio, no una promesa'], ['normalizer','mean'], [
      beat('Un campo contiene cero o cuatro células activadas, cada posibilidad con una mitad de probabilidad. ¿Qué centro resume el modelo?', note('Modelo','0: 0,5; 4: 0,5')),
      beat('La esperanza multiplica cada valor por su probabilidad. Cero por una mitad aporta cero.', math`0\cdot0{,}5=0`),
      beat('Cuatro por una mitad aporta dos.', math`4\cdot0{,}5=2`),
      beat('Sumamos las aportaciones; la media del modelo es dos.', math`E[X]=2`),
      beat('Ningún campo de este modelo tiene exactamente dos. La esperanza no es una promesa individual ni necesariamente el valor más frecuente.'),
      beat('En continuo sustituimos la suma por una integral de valor por densidad. Si hay colas infinitas, una esperanza finita necesita integrabilidad absoluta.', math`E[X]=\int_{-\infty}^{\infty}xf_X(x)\,dx`)
    ]),
    block('transformar-valores', 'Promediar los cuadrados es otra pregunta', [1,'Transformar antes de promediar'], null, [
      beat('¿Y si la señal depende del cuadrado del recuento? Primero transformamos cero y cuatro en cero y dieciséis.', note('Valores transformados','0; 16')),
      beat('Las probabilidades no cambian. Dieciséis por una mitad aporta ocho.', math`16\cdot0{,}5=8`),
      beat('La esperanza del cuadrado es ocho. Elevar la media dos al cuadrado, en cambio, produce cuatro.', math`E[X^2]=8`),
      beat('No son la misma operación. Ge nombra una transformación: ponderamos ge de cada valor usando la distribución original.', math`E[g(X)]=\sum_i g(x_i)p_X(x_i)`),
      beat('En continuo integramos ge de equis por su densidad. No necesitamos reconstruir primero toda la distribución transformada si solo buscamos esta esperanza.')
    ]),
    block('linealidad-y-colas', 'Qué puede salir del promedio', ['Transformar antes de promediar','Un centro de equilibrio, no una promesa'], null, [
      beat('Cada célula aporta tres unidades de señal y el aparato añade una unidad fija. ¿Cómo cambia la media dos? Primero la multiplicamos por tres.', math`3\cdot2=6`),
      beat('Después añadimos la unidad fija; la señal esperada es siete.', math`6+1=7`),
      beat('La esperanza es lineal para sumas y desplazamientos cuando existen las esperanzas utilizadas. No exige independencia.', math`E[aX+bY+c]=aE[X]+bE[Y]+c`),
      beat('La esperanza de un producto no se separa en general. La independencia sí permite separarla bajo las condiciones de integrabilidad.'),
      beat('Una variable no negativa puede tener esperanza infinita. Con colas a ambos lados, dos contribuciones divergentes no se cancelan para crear una media. Comprobamos existencia antes de aplicar estas propiedades.')
    ])
  ],
  varianza:[
    block('distancias', 'No dejar que las desviaciones se cancelen', [0,'Distancias al centro'], null, [
      beat('Dos modelos pueden tener media uno y dispersión distinta. ¿Cómo medimos las distancias al centro sin que los signos se cancelen?'),
      beat('Equis toma cero, uno y dos con masas un cuarto, una mitad y un cuarto. Su media es uno. Las desviaciones son menos uno, cero y uno.', note('Desviaciones','-1; 0; 1')),
      beat('Elevamos esas desviaciones al cuadrado. Quedan uno, cero y uno.', note('Cuadrados','1; 0; 1')),
      beat('Ponderamos con las masas originales y sumamos. La varianza es una mitad.', math`1\cdot\tfrac14+0\cdot\tfrac12+1\cdot\tfrac14=\tfrac12`),
      beat('Varianza nombra la esperanza de la distancia cuadrada a la media. Sigma será su raíz no negativa, la desviación típica.', math`\sigma=\sqrt{1/2}`),
      beat('La raíz vale aproximadamente cero coma setecientos siete, en unidades originales. La varianza tiene esas unidades al cuadrado.')
    ]),
    block('segundo-momento', 'Calcular con momentos finitos', [1,'Distancias al centro'], ['normalizer','mean','variance'], [
      beat('¿Hay una cuenta equivalente? Podemos promediar primero los cuadrados originales, pero antes necesitamos momentos finitos.'),
      beat('Los valores al cuadrado son cero, uno y cuatro. Su promedio ponderado es uno coma cinco.', math`E[X^2]=1{,}5`),
      beat('El cuadrado de la media uno vale uno.', math`E[X]^2=1`),
      beat('Restamos ese cuadrado al segundo momento. Volvemos a obtener una mitad.', math`1{,}5-1=0{,}5`),
      beat('La identidad reúne esas dos cantidades.', math`\operatorname{Var}(X)=E[X^2]-E[X]^2`),
      beat('Una varianza negativa indica error. Con números grandes y variación pequeña, esta resta puede perder precisión; el cálculo centrado suele ser más estable.')
    ]),
    block('estirar-y-desplazar', 'La dispersión conserva sus unidades', ['Desplazar y estirar'], null, [
      beat('Una longitud tiene media dos milímetros y desviación tres décimas. ¿Qué cambia al expresarla en micrómetros?'),
      beat('Multiplicar por mil lleva la media a dos mil y la desviación a trescientos micrómetros.', note('Cambio de unidad','Media 2000 micrómetros; desviación 300 micrómetros')),
      beat('La varianza original es nueve centésimas de milímetro cuadrado. El factor mil se eleva al cuadrado; el nuevo valor es noventa mil micrómetros cuadrados.', math`\operatorname{Var}(1000X)=1000^2\operatorname{Var}(X)`),
      beat('Añadir una constante mueve el centro sin cambiar distancias. Un factor negativo invierte el eje, pero su cuadrado mantiene la varianza no negativa.', math`\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)`),
      beat('Sumar varianzas exige cuidado: si dos lecturas comparten variación, aparece una covarianza. La independencia con varianzas finitas elimina ese término; no la suponemos en medidas emparejadas.')
    ])
  ],
  'momentos-transformaciones':[
    block('ordinarios-y-centrales', 'Cada potencia conserva información distinta', [0,'Qué resumen conserva cada momento'], ['transformed-mean'], [
      beat('¿Qué cambia si una longitud se convierte en área? Promediar sus cuadrados no es elevar al cuadrado su promedio. Llamamos momento a una esperanza de una potencia.'),
      beat('Eme sub ka es el momento ordinario de orden ka: usamos los valores originales elevados a esa potencia.', math`m_k=E[X^k]`),
      beat('Mu sub ka es el central: restamos la media antes de elevar a la potencia.', math`\mu_k=E[(X-E[X])^k]`),
      beat('Con cero y dos equiprobables, la media es uno. El segundo momento ordinario vale dos y el segundo central vale uno.', note('Dos momentos diferentes','m2: 2; mu2: 1')),
      beat('El primero ordinario es esperanza; el primero central es cero. El segundo central es varianza, siempre que existan los momentos correspondientes.')
    ]),
    block('ejemplo-area', 'Cambiar unidades no es elevar la media', [1], ['jensen-gap'], [
      beat('Una longitud uniforme entre cero y uno tiene media una mitad. ¿Cuál es la media de su cuadrado? Usamos su densidad original, que vale uno.'),
      beat('La integral de equis al cuadrado acumula los valores de área ponderados.', math`E[X^2]=\int_0^1 x^2\,dx`),
      beat('Una primitiva es equis al cubo dividido entre tres. La evaluación deja un tercio.', math`E[X^2]=1/3`),
      beat('El cuadrado de la media una mitad es un cuarto.', math`E[X]^2=1/4`),
      beat('Un tercio y un cuarto son distintos. Con momentos finitos, su diferencia es la varianza. No hemos usado independencia ni supuesto que el área sea uniforme.')
    ]),
    block('estandarizacion-y-existencia', 'La forma y las colas necesitan condiciones', ['Qué resumen conserva cada momento'], null, [
      beat('¿Podemos comparar formas medidas en unidades diferentes?'),
      beat('Mu sub ka nombra el momento central de orden ka.'),
      beat('Si existe y la desviación sigma es positiva y finita, lo dividimos por la potencia correspondiente de sigma.', math`\frac{\mu_k}{\sigma^k}`),
      beat('Estiremos el ejemplo anterior: cero y cuatro son equiprobables. La media es dos; las desviaciones son menos dos y dos. Su varianza es cuatro y la desviación sigma es dos.', note('Ejemplo equiprobable','X: 0 o 4; media: 2; desviaciones: -2 y 2; sigma: 2')),
      beat('Para el tercer momento central promediamos los cubos de esas desviaciones. Menos ocho y ocho se cancelan, dando cero.', math`\frac{(-2)^3+2^3}{2}=0`),
      beat('Dividimos ese tercer momento cero entre sigma al cubo, dos al cubo. El tercero estandarizado vale cero y describe la asimetría; este ejemplo es simétrico.', math`\frac{\mu_3}{\sigma^3}=\frac0{2^3}`),
      beat('Para el cuarto momento central usamos las cuartas potencias. Ambas valen dieciséis y su promedio también es dieciséis.', math`\frac{(-2)^4+2^4}{2}=16`),
      beat('Ahora dividimos ese cuarto momento dieciséis entre sigma a la cuarta, dos a la cuarta. El denominador también vale dieciséis.', math`\frac{\mu_4}{\sigma^4}=\frac{16}{2^4}`),
      beat('Dieciséis dividido entre dieciséis da uno. Ese es el cuarto estandarizado, no el exceso de curtosis, que restaría tres. Ayuda a describir el peso de las colas, pero estos momentos no describen una distribución completa.', math`16/16=1`),
      beat('Si todas las lecturas valen dos, sigma es cero y no hacemos esa división. Cada momento necesita existir: una muestra finita con extremos moderados no demuestra que la integral poblacional converja.', note('Desviación nula','X siempre vale 2; sigma: 0; estandarización no definida')),
      beat('Incluso una distribución simétrica puede carecer de media. Cancelar colas divergentes en un intervalo simétrico no define una esperanza.'),
      beat('Por eso nombramos siempre el resumen concreto y las condiciones que permiten usarlo; no damos por supuesta la existencia de todos los órdenes.')
    ]),
    block('cambio-de-distribucion', 'Ampliación opcional: seguir el nuevo soporte', ['Cambiar la variable cambia su distribución'], null, [
      beat('Como ampliación opcional, obtengamos la distribución de i griega, el cuadrado de la longitud uniforme entre cero y uno. ¿Qué valores puede tomar? El soporte sigue entre cero y uno.', math`Y=X^2`),
      beat('En ese soporte equis no es negativa y el cuadrado crece. No superar i griega equivale a que equis no supere su raíz.', math`F_Y(y)=P(X\leq\sqrt y)`),
      beat('La acumulada de equis uniforme devuelve el umbral. La de i griega es la raíz, no el propio umbral.', plot('Acumulada del cuadrado',curve(0,1,value=>Math.sqrt(value)),'Umbral y','F de Y')),
      beat('Para densidades necesitamos conservar anchuras. La derivada absoluta de la inversa es el factor jacobiano.', math`f_Y(y)=f_X(g^{-1}(y))\left|\frac{d}{dy}g^{-1}(y)\right|`),
      beat('Esta fórmula requiere un cambio invertible y diferenciable en el tramo. Si decrece, invertimos la desigualdad al construir la acumulada; si hay varias ramas, reunimos todas las regiones de origen.'),
      beat('Elevar al cuadrado una equis con valores negativos crea dos ramas para salidas positivas. Sustituir una letra sin contar ambas perdería probabilidad.')
    ])
  ],
  'bernoulli-binomial':[
    block('ensayos', 'De un indicador a un recuento fijo', [0,'De un ensayo a varios'], null, [
      beat('Sembramos tres semillas. ¿Estamos midiendo un ensayo o contando germinaciones de un lote? Para una semilla usamos un indicador: uno si germina y cero si no.', math`I\in\{0,1\}`),
      beat('Pe será la probabilidad de germinar. Ese indicador sigue una Bernoulli. Éxito solo nombra el resultado contado; no es una valoración de lo que ocurre.'),
      beat('Equis suma los tres indicadores y cuenta germinaciones. Para usar una binomial necesitamos número de ensayos fijo, independencia y la misma pe.', math`X=I_1+I_2+I_3`),
      beat('Con pe igual a una mitad, exactamente dos germinaciones permiten tres patrones: uno uno cero, uno cero uno y cero uno uno.', note('Patrones','110; 101; 011')),
      beat('Cada patrón tiene probabilidad un octavo por independencia. Reunir los tres da tres octavos.', math`3\cdot\frac18=\frac38`)
    ]),
    block('masa-y-cola', 'Contar posiciones y ponderar patrones', [1,'De un ensayo a varios'], ['exact','at-most'], [
      beat('¿Cómo repetimos la cuenta para ene semillas y ka germinadas? La combinación cuenta las posiciones de los éxitos.', math`\binom nk`),
      beat('Pe elevado a ka pondera los éxitos de un patrón. Uno menos pe elevado a ene menos ka pondera sus fracasos.', math`p^k(1-p)^{n-k}`),
      beat('Multiplicamos el número de patrones por la probabilidad de cada uno. Pe sub equis de ka nombra la masa binomial, para ka de cero a ene.', math`p_X(k)=\binom nk p^k(1-p)^{n-k}`),
      beat('Como máximo ka suma todas las masas hasta ka incluido. Al menos ka empieza en ka; su complemento acaba en ka menos uno.', math`P(X\geq k)=1-F(k-1)`),
      beat('Al menos una germinación excluye ninguna. Con tres semillas y una mitad, ninguna pesa un octavo y el resto siete octavos.', quantity('Al menos una',7,8))
    ]),
    block('momentos-y-diseno', 'El promedio del lote no garantiza su resultado', ['Qué puede romper el modelo'], null, [
      beat('¿Cuántas germinaciones esperamos en promedio? Cada indicador tiene esperanza pe; sumar ene indicadores da ene por pe.', math`E[X]=np`),
      beat('Para tres semillas con pe una mitad, la esperanza es una coma cinco. No describe una media semilla en una bandeja concreta.'),
      beat('La varianza suma las varianzas de los indicadores independientes: ene por pe por uno menos pe.', math`\operatorname{Var}(X)=np(1-p)`),
      beat('En este ejemplo vale tres cuartos. Compartir una maceta puede romper independencia; mezclar probabilidades distintas puede romper la pe común.'),
      beat('Una extracción importante sin reemplazo de un lote finito cambia la composición y pide hipergeométrica. Una fórmula binomial no resuelve un problema de diseño.')
    ])
  ],
  poisson:[
    block('exposicion', 'La media pertenece a una ventana', [0,'Un intervalo, un recuento'], null, [
      beat('Un sensor recibe una coma cinco apariciones por hora. ¿Qué media usamos si observa dos horas? La tasa no es todavía el recuento esperado de esa ventana.', note('Exposición','Tasa 1,5/h; duración 2 h')),
      beat('Lambda nombra la media de la ventana. Multiplicamos tasa por duración.', math`\lambda=1{,}5\cdot2`),
      beat('Obtenemos tres apariciones esperadas. Lambda puede superar uno porque es una media de recuento, no una probabilidad.', note('Media de la ventana','3 apariciones')),
      beat('Un proceso homogéneo supone tasa estable, incrementos independientes y probabilidad despreciable de múltiples eventos en un intervalo muy pequeño.'),
      beat('Duplicar la exposición duplica lambda solo si la tasa permanece estable. Brotes o llegadas en grupos pueden producir mucha más dispersión.')
    ]),
    block('masa-y-complemento', 'Ninguna aparición y la cola de un recuento', [1,'Un intervalo, un recuento'], ['exact','strict-tail'], [
      beat('¿Qué probabilidad tiene ninguna aparición con lambda tres? La masa Poisson usa la exponencial de menos lambda, la potencia lambda a la ka y ka factorial.'),
      beat('Ka factorial cuenta el producto de enteros hasta ka; cero factorial vale uno. Pe sub equis de cero nombra la masa en cero: solo queda la exponencial.', math`p_X(0)=e^{-3}`),
      beat('E elevado a menos tres da aproximadamente cinco por ciento. Es una probabilidad de recuento cero, no una tasa.', note('Ninguna aparición','Aproximadamente 0,0498')),
      beat('Para cualquier entero ka no negativo, reunimos las tres piezas en su masa, pe sub equis de ka.', math`p_X(k)=e^{-\lambda}\frac{\lambda^k}{k!}`),
      beat('Más de dos comienza en tres. Complementamos la suma de cero, uno y dos, sin quitar el dos de ese complemento.', math`P(X>2)=1-P(X\leq2)`),
      beat('Poisson tiene media y varianza lambda. Esa igualdad restringe el modelo; no es una ley general de recuentos biológicos.')
    ]),
    block('aproximar-y-sumar', 'Eventos raros no significa igualdad exacta', ['Una aproximación, no una identidad'], null, [
      beat('Cien ensayos independientes tienen probabilidad una centésima de evento. ¿Podemos aproximar su binomial por Poisson? El producto ene por pe vale uno.'),
      beat('La masa binomial exacta en cero es noventa y nueve centésimas elevado a cien. Pe con subíndice bin identifica ese modelo.', math`p_{\mathrm{Bin}}(0)=0{,}99^{100}`),
      beat('La masa Poisson aproximada en cero usa exponencial de menos uno. Su subíndice distingue la aproximación del modelo exacto.', math`p_{\mathrm{Pois}}(0)=e^{-1}`),
      beat('El exacto es aproximadamente cero coma trescientos sesenta y seis y el aproximado cero coma trescientos sesenta y ocho. Son cercanos, pero no iguales.', note('Comparación','Binomial: 0,36603; Poisson: 0,36788')),
      beat('El límite conserva ene por pe cuando pe se hace pequeña y ene crece. Revisamos el error para la cola concreta; no hay un umbral universal que lo garantice todo.'),
      beat('Sumar dos Poisson independientes da otra Poisson con la suma de parámetros. Independientes es la condición que autoriza esa propiedad.', math`\lambda_{X+Y}=\lambda_X+\lambda_Y`)
    ])
  ],
  hipergeometrica:[
    block('sin-reemplazo', 'Contar muestras de un lote finito', [0,'El contenido disponible cambia'], null, [
      beat('Un lote contiene doce semillas, cuatro de una variedad. Elegimos tres sin devolverlas. ¿Podemos tratar cada extracción como si la composición no cambiara?', note('Diseño','N: 12; K: 4; n: 3; sin reemplazo')),
      beat('Ene mayúscula es población, ka mayúscula existencias de la variedad y ene minúscula muestra. La hipergeométrica supone que todos los subconjuntos de tres son equiprobables.'),
      beat('Para exactamente una de la variedad elegimos una entre cuatro. Hay cuatro maneras.', math`\binom41=4`),
      beat('Completamos con dos entre las ocho restantes. Hay veintiocho maneras.', math`\binom82=28`),
      beat('Multiplicamos ambas elecciones para reunir ciento doce muestras favorables.', math`4\cdot28=112`),
      beat('La muestra bien mezclada no hace independientes las extracciones: retirar una semilla cambia lo que queda disponible.')
    ]),
    block('masa-finita', 'Dividir por todas las muestras posibles', [1,'El contenido disponible cambia'], ['exact','at-least'], [
      beat('¿Con qué total comparamos las ciento doce muestras favorables? Elegir tres entre doce tiene doscientas veinte posibilidades.', math`\binom{12}3=220`),
      beat('Dividimos favorables entre ese total equiprobable. Pe sub equis de uno nombra la masa de exactamente una semilla de la variedad.', math`p_X(1)=112/220`),
      beat('El resultado es aproximadamente quinientas nueve milésimas. Para la masa en ka, la fórmula conserva elegir categoría, elegir restantes y dividir por todas.', math`p_X(k)=\frac{\binom Kk\binom{N-K}{n-k}}{\binom Nn}`),
      beat('Antes de evaluar ka comprobamos existencias y muestra. No puede superar ni ene minúscula ni ka mayúscula.'),
      beat('Al menos ka incluye ese ka. Si complementamos una acumulada, terminamos el complemento en ka menos uno, no en ka.')
    ]),
    block('soporte-y-correccion', 'Las existencias ponen mínimos y máximos', ['Los límites también contienen información'], null, [
      beat('Otro lote tiene siete elementos de interés y solo dos restantes. Si elegimos cinco, ¿podemos obtener cero de interés? No: los restantes solo cubren dos plazas.', note('Mínimo obligado','5 seleccionados; solo 2 restantes')),
      beat('El mínimo de interés es cinco menos dos, es decir, tres.', math`5-2=3`),
      beat('En general el soporte comienza en el máximo entre cero y ene menos ene mayúscula más ka mayúscula; termina en el mínimo entre muestra y existencias.', math`\max(0,n-N+K)\leq k\leq\min(n,K)`),
      beat('La media es tamaño de muestra por proporción de la categoría. La varianza añade una corrección por población finita.', math`\frac{N-n}{N-1}`),
      beat('Para población mayor que uno, ese factor reduce la dispersión frente a una binomial con la misma proporción. La varianza completa usa además el factor binomial.', math`\operatorname{Var}(X)=n\frac KN\left(1-\frac KN\right)\frac{N-n}{N-1}`),
      beat('Si extraemos una fracción muy pequeña, podemos declarar una aproximación binomial. Si la población vale uno, el caso es determinista y no usamos esa fracción indeterminada.')
    ])
  ],
  'geometrica-negativa':[
    block('primera-deteccion', 'La condición de parada define qué contamos', [0,'La condición de parada define la variable'], null, [
      beat('Probamos colonias hasta detectar una señal. ¿Cuántos ensayos están fijados antes de empezar? Ninguno: paramos en el primer éxito.'),
      beat('Cada ensayo es independiente y tiene pe igual a cuatro décimas. El documento cuenta fallos previos, equis; otra convención cuenta todos los ensayos, te.', note('Convenciones','X: fallos desde 0; T: ensayos desde 1')),
      beat('Si el primer ensayo detecta, equis vale cero y te uno. Son dos variables, no dos respuestas contradictorias.'),
      beat('Para dos fallos previos necesitamos fallo, fallo y éxito, en ese orden. La masa pe sub equis de dos es seis décimas al cuadrado por cuatro décimas.', math`p_X(2)=0{,}6^2\cdot0{,}4`),
      beat('Obtenemos ciento cuarenta y cuatro milésimas. En general la masa geométrica pe sub equis de ka usa uno menos pe elevado a ka y luego pe.', math`p_X(k)=(1-p)^kp`),
      beat('Su esperanza de fallos es uno menos pe entre pe. Con cuatro décimas son uno coma cinco fallos; para ensayos añadimos uno.')
    ]),
    block('varios-exitos', 'Fijar el éxito final de la meta', [1,'La condición de parada define la variable'], ['exact','at-most'], [
      beat('Ahora paramos en el segundo éxito, con pe una mitad. ¿Qué patrones producen un fallo antes de completar la meta? El último ensayo debe ser éxito.'),
      beat('Los patrones son fallo, éxito, éxito y éxito, fallo, éxito. Hay dos posiciones posibles para el fallo anterior.', note('Patrones','FEE; EFE')),
      beat('Cada patrón pesa un octavo. Reunimos los dos y obtenemos un cuarto.', math`2\cdot\frac18=\frac14`),
      beat('Erre es la meta entera de éxitos y ka los fallos anteriores. La combinación cuenta posiciones libres de los erre menos uno éxitos previos.', math`\binom{k+r-1}{k}`),
      beat('Multiplicamos ese recuento por pe a la erre y uno menos pe a la ka. Pe sub efe de ka nombra la masa de ka fallos antes de completar la meta.', math`p_F(k)=\binom{k+r-1}{k}p^r(1-p)^k`),
      beat('La acumulada suma fallos desde cero hasta ka incluido. No desplazamos el soporte por confundir fallos con ensayos.')
    ]),
    block('memoria-y-momentos', 'Una espera adicional bajo el mismo mecanismo', ['Memoria y heterogeneidad'], ['mean-failures','variance'], [
      beat('¿Tres intentos fallidos hacen más probable acertar en el siguiente? No bajo independencia y pe constante. La geométrica carece de memoria.'),
      beat('Con intentos que alteran la colonia o producen aprendizaje, ese supuesto deja de ser razonable.'),
      beat('Para erre éxitos, la media de fallos suma erre esperas geométricas. Dividimos erre por el factor de éxito y ponderamos los fallos.', math`E[F]=\frac{r(1-p)}p`),
      beat('Para erre dos y pe una mitad, esperamos dos fallos. Los ensayos totales añaden los dos éxitos: cuatro de media.', note('Promedios diferentes','Fallos: 2; ensayos: 4')),
      beat('La varianza de fallos usa pe al cuadrado en el denominador. En este ejemplo vale cuatro.', math`\operatorname{Var}(F)=\frac{r(1-p)}{p^2}`)
    ]),
    block('forma-real', 'Una extensión de recuentos, no una meta literal', ['Memoria y heterogeneidad'], null, [
      beat('¿Puede erre valer dos coma cinco? En la familia binomial negativa sí, mediante una extensión del coeficiente; ya no significa esperar literalmente dos coma cinco éxitos.'),
      beat('La función gamma permite sustituir los factoriales y extender el coeficiente a erre real positivo.', math`\frac{\Gamma(k+r)}{\Gamma(r)\Gamma(k+1)}`, note('Forma real','r > 0; no es una meta literal de éxitos')),
      beat('Se mantiene ka entero no negativo y pe entre cero y uno, con éxito posible. La varianza supera la media cuando hay fallos con probabilidad positiva.', note('Soporte y probabilidad','k: entero >= 0; p: probabilidad de éxito, 0 < p <= 1')),
      beat('Ese comportamiento sirve para recuentos sobredispersos. Probemos erre dos coma cinco y pe una mitad. La causa biológica necesita evidencia por separado.', note('Ejemplo sobredisperso','r = 2,5; p = 0,5')),
      beat('La esperanza pondera erre por la probabilidad de fracaso y divide entre la de éxito.', math`E[F]=\frac{2{,}5(1-0{,}5)}{0{,}5}`),
      beat('El cociente resulta dos coma cinco fallos de media.', note('Media de fallos','2,5')),
      beat('La varianza conserva el mismo numerador y usa pe al cuadrado en el denominador.', math`\operatorname{Var}(F)=\frac{2{,}5(1-0{,}5)}{0{,}5^2}`),
      beat('La varianza vale cinco, mayor que la media dos coma cinco. Esa desigualdad describe la sobredispersión.', note('Comparación','Varianza: 5; media: 2,5')),
      beat('Una extensión matemática no demuestra que el mecanismo observado sea una secuencia de ensayos con una meta entera.')
    ])
  ],
  'uniforme-montecarlo':[
    block('dos-uniformes', 'Igual masa no es igual altura', [0,'Dos maneras de ser uniforme'], ['interval'], [
      beat('Elegimos un instante entre dos y seis minutos sin preferencia por zonas. ¿Qué probabilidad queda entre tres y cinco? En continuo comparamos longitudes.'),
      beat('El soporte completo mide cuatro minutos. La densidad constante tiene altura un cuarto por minuto.', plot('Uniforme continua',[[2,0.25],[6,0.25]],'Tiempo (min)','Densidad (1/min)',{shade:[3,5]})),
      beat('El intervalo solicitado mide dos minutos; lo dividimos entre cuatro.', math`2/4=1/2`),
      beat('Cada punto tiene probabilidad cero. Lo uniforme es la densidad, no una probabilidad positiva común a infinitos puntos.'),
      beat('En una lista discreta uno, dos, tres y cuatro, cada valor sí tiene masa un cuarto. Su media es dos coma cinco y su varianza uno coma veinticinco.', note('Uniforme discreta','Valores 1, 2, 3, 4; masas 1/4')),
      beat('La fórmula de varianza discreta usa enteros consecutivos de a a be. Para una lista arbitraria promediamos sus valores reales.', math`\operatorname{Var}(D)=\frac{(b-a+1)^2-1}{12}`)
    ]),
    block('cuantiles', 'Buscar el primer umbral que alcanza una proporción', [1,'De números uniformes a otros modelos'], ['mean'], [
      beat('¿Dónde queda el setenta y cinco por ciento de la uniforme de dos a seis? Recorremos tres cuartos de su anchura cuatro.'),
      beat('Tres cuartos de cuatro son tres minutos.', math`0{,}75\cdot4=3`),
      beat('Añadimos el comienzo dos y obtenemos el cuantil cinco.', math`2+3=5`),
      beat('La media queda en el punto medio cuatro. La varianza continua es la anchura al cuadrado dividida entre doce.', math`\operatorname{Var}(X)=\frac{(b-a)^2}{12}`),
      beat('Con saltos, una acumulada no tiene inversa ordinaria para todas las proporciones. Para u entre cero y uno usamos el ínfimo: el primer umbral donde efe alcanza u.', math`Q(u)=\inf\{x:F(x)\geq u\}`),
      beat('El cuantil devuelve unidades de la variable. Puede alcanzar una masa que haga superar u, sin interpolar valores que el soporte no contiene.')
    ]),
    block('inversion-y-montecarlo', 'Asignar tramos uniformes a valores del modelo', ['De números uniformes a otros modelos'], null, [
      beat('Queremos generar estados cero, uno y dos con masas dos décimas, cinco décimas y tres décimas. ¿Qué tramos de una uniforme entre cero y uno les corresponden?', note('Cortes acumulados','0,2; 0,7; 1')),
      beat('Una uniforme de una décima cae en el primer tramo y produce cero. Una de cincuenta y cinco centésimas produce uno; una de noventa y una produce dos.', note('Tres asignaciones','0,10 -> 0; 0,55 -> 1; 0,91 -> 2')),
      beat('Los tramos tienen longitudes iguales a las masas. Transformar la uniforme por el cuantil generalizado reproduce la distribución.', math`X=Q(U)`),
      beat('Montecarlo repite esa generación para aproximar probabilidades o esperanzas. La frecuencia de estados dos fluctúa alrededor de tres décimas, no tiene que igualarla en cada lote.'),
      beat('Más simulaciones reducen fluctuación bajo el modelo; no corrigen un modelo falso. Guardar una semilla reproduce un cálculo, no valida el mecanismo.'),
      beat('Este método no desarrolla el teorema central del límite ni convierte la variable individual en normal.')
    ])
  ],
  exponencial:[
    block('escala-y-supervivencia', 'Preguntar cuánto tardará el siguiente evento', [0,'Tiempo hasta un evento'], ['survival'], [
      beat('Un mecanismo tiene espera media cinco minutos. ¿Qué probabilidad tiene seguir esperando después de diez? Alfa nombra la escala temporal positiva.'),
      beat('La tasa es la inversa de cinco: dos décimas por minuto.', math`r=1/5`),
      beat('Ese de te es supervivencia, la probabilidad de seguir sin evento. Primero dividimos diez minutos entre escala cinco.', math`10/5=2`),
      beat('Después evaluamos la exponencial de menos dos.', math`S(10)=e^{-2}`),
      beat('La probabilidad es aproximadamente ciento treinta y cinco milésimas. La curva muestra cómo disminuye la espera restante.', plot('Supervivencia, escala 5',curve(0,20,time=>Math.exp(-time/5)),'Tiempo (min)','S(t)')),
      beat('En un proceso Poisson homogéneo, el tiempo al siguiente evento es exponencial con su tasa. Esa relación necesita incrementos independientes y tasa estable.')
    ]),
    block('densidad-y-acumulada', 'La altura, el área y el parámetro', [1,'Tiempo hasta un evento'], null, [
      beat('¿La supervivencia es también una densidad? No. La densidad añade el factor inverso de escala y tiene unidades por minuto.'),
      beat('Para te no negativo, la densidad es uno entre alfa por la exponencial de menos te entre alfa; para te negativo vale cero.', math`f(t)=\frac1\alpha e^{-t/\alpha}`),
      beat('La acumulada responde a que el evento ya ocurrió. Restamos la supervivencia de uno.', math`F(t)=1-S(t)`),
      beat('La media es alfa y la varianza alfa al cuadrado. Aquí son cinco minutos y veinticinco minutos cuadrados, respectivamente.', note('Momentos','Media 5 min; varianza 25 min cuadrados')),
      beat('En una biblioteca comprobamos si el argumento es escala o tasa. Pasar cinco donde pide tasa describe un mecanismo muy distinto.')
    ]),
    block('espera-adicional', 'Esperar no descuenta un plazo fijo', ['La hipótesis de no envejecimiento'], ['memoryless'], [
      beat('Ya pasaron diez minutos sin señal. ¿Qué probabilidad tiene esperar otros cinco? Bajo este modelo es la misma que al iniciar una espera de cinco.'),
      beat('La regla divide la supervivencia hasta quince entre la supervivencia hasta diez.', math`P(T>15\mid T>10)=S(15)/S(10)`),
      beat('La exponencial cancela la parte ya transcurrida y deja exponencial de menos uno.', math`S(15)/S(10)=e^{-1}`),
      beat('Eso equivale a la supervivencia de cinco minutos, aproximadamente trescientas sesenta y ocho milésimas. Es carencia de memoria, no que el tiempo individual sea fijo.'),
      beat('La propiedad supone riesgo constante. Envejecimiento, adaptación y fases pueden hacer inadecuada la exponencial.'),
      beat('Si termina la observación sin ver el evento, el tiempo está censurado, no necesariamente es igual al final observado. Aquí señalamos la cautela sin desarrollar métodos de supervivencia.')
    ])
  ],
  normal:[
    block('centro-y-escala', 'Medir una distancia en desviaciones', [0,'Centro y escala de una campana'], null, [
      beat('Una longitud se aproxima por una normal de media cuarenta y desviación cuatro milímetros. ¿A cuántas desviaciones queda el valor cuarenta y ocho?', note('Modelo de longitud','Media 40 mm; desviación 4 mm')),
      beat('Mu es la media y sigma la desviación positiva. La notación normal escribe sigma al cuadrado, la varianza, como segundo parámetro.', math`X\sim N(40,16)`),
      beat('Primero restamos el centro al valor observado.', math`48-40=8`),
      beat('Dividimos la distancia ocho entre desviación cuatro.', math`8/4=2`),
      beat('Zeta vale dos: dos desviaciones por encima. Tipificar cambia unidades, no añade datos.', math`Z=\frac{X-\mu}{\sigma}`),
      beat('La normal tiene soporte en toda la recta y es simétrica; media, mediana y moda coinciden. Si la medida debe ser positiva, comprobamos si la masa negativa es despreciable.')
    ]),
    block('densidad-normal', 'Construir una campana, no leerla como probabilidad', ['Centro y escala de una campana'], null, [
      beat('¿Qué representa la altura de la campana tipificada? Es una densidad. Para obtener probabilidad necesitamos un área.'),
      beat('Primero elevamos zeta al cuadrado y formamos la exponencial de menos ese cuadrado entre dos. Esto da la forma simétrica.', math`e^{-z^2/2}`),
      beat('Dividir entre raíz de dos pi normaliza el área estándar a uno. Pi aquí es la constante circular, no prevalencia.', math`\phi(z)=\frac{e^{-z^2/2}}{\sqrt{2\pi}}`),
      beat('El dibujo muestra solo de menos cuatro a cuatro desviaciones; el soporte real continúa por ambos lados.', plot('Densidad estándar',standardNormal(),'Desviaciones z','Densidad estándar')),
      beat('Para volver a la variable original dividimos además por sigma, que ajusta la anchura.', math`f_X(x)=\frac1\sigma\phi\!\left(\frac{x-\mu}{\sigma}\right)`),
      beat('No usamos la densidad en cuarenta y ocho como cola superior. La acumulada fi mayúscula hace esa pregunta de área.')
    ]),
    block('colas-e-intervalos', 'Reunir el área entre dos umbrales', [1,'Acumuladas y umbrales'], ['interval'], [
      beat('¿Qué probabilidad queda entre treinta y seis y cuarenta y ocho milímetros? Sus distancias tipificadas son menos uno y dos.', note('Límites tipificados','Inferior -1; superior 2')),
      beat('Fi mayúscula acumula la normal estándar a la izquierda. Hasta dos tenemos algo más del noventa y siete coma siete por ciento.', note('Acumulada superior','Phi(2): aproximadamente 0,97725')),
      beat('Hasta menos uno tenemos algo menos del dieciséis por ciento. Restamos esa parte ya acumulada.', math`P(-1<Z<2)=\Phi(2)-\Phi(-1)`),
      beat('El intervalo sombreado contiene aproximadamente ochenta y uno coma nueve por ciento de la probabilidad.', plot('Área entre -1 y 2',standardNormal(),'Desviaciones z','Densidad estándar',{shade:[-1,2]})),
      beat('La cola derecha de dos es uno menos fi de dos: aproximadamente dos coma veintiocho por ciento.', math`P(Z>2)=1-\Phi(2)`),
      beat('La acumulada no tiene una primitiva elemental sencilla. Para evaluar sus números usamos tablas o una biblioteca estadística; las cifras aquí son aproximaciones de referencia.')
    ]),
    block('cuantiles-y-combinaciones', 'Volver del porcentaje a la longitud', ['Acumuladas y umbrales'], ['quantile'], [
      beat('¿Qué longitud deja el noventa por ciento por debajo? Fi inversa busca primero ese umbral en la normal estándar.', note('Cuantil estándar del 90 %','Aproximadamente 1,28155')),
      beat('Multiplicamos uno coma doscientos ochenta y dos por desviación cuatro. El desplazamiento es aproximadamente cinco coma trece milímetros.', math`4\cdot1{,}28155\approx5{,}1262`),
      beat('Añadimos el centro cuarenta. El percentil queda aproximadamente en cuarenta y cinco coma trece milímetros.', math`40+5{,}1262=45{,}1262`),
      beat('La regla general usa media más sigma por fi inversa de u. Si piden cinco por ciento por encima, buscamos noventa y cinco por debajo.', math`q_u=\mu+\sigma\Phi^{-1}(u)`),
      beat('Una transformación lineal de una normal sigue siendo normal salvo el caso constante. Una combinación de normales independientes también es normal, con las medias y varianzas apropiadas.'),
      beat('Muchas observaciones no hacen normal a cualquier variable individual. Aquí usamos un modelo normal supuesto; no una justificación automática por el teorema central del límite.')
    ])
  ],
  gamma:[
    block('etapas-y-parametros', 'Sumar esperas compatibles', [0,'Una familia de tiempos positivos'], ['mean'], [
      beat('Una reacción necesita tres etapas. Cada espera es exponencial, independiente, con escala dos minutos. ¿Cómo describimos el tiempo total?', note('Mecanismo supuesto','3 etapas independientes; escala común 2 min')),
      beat('La suma es gamma con forma ka tres y escala alfa dos. La forma cuenta etapas solo en esta interpretación entera; no es una probabilidad.', math`T\sim\operatorname{Gamma}(3,2)`),
      beat('La media suma tres esperas de dos minutos.', math`E[T]=3\cdot2`),
      beat('Resultan seis minutos. La varianza suma tres varianzas de cuatro minutos cuadrados.', math`\operatorname{Var}(T)=3\cdot4`),
      beat('Resultan doce minutos cuadrados. No confundimos escala dos con tasa: su inversa es una mitad por minuto.')
    ]),
    block('funcion-gamma', 'Extender el factorial para normalizar', ['Una familia de tiempos positivos'], null, [
      beat('La forma también puede ser real positiva. ¿Qué sustituye al factorial cuando no es entera? La función gamma mayúscula, distinta de la distribución.'),
      beat('Gamma de ka acumula u a la ka menos uno por la exponencial de menos u, de cero a infinito. U es solo la variable de integración.', math`\Gamma(k)=\int_0^\infty u^{k-1}e^{-u}\,du`),
      beat('Para un entero positivo eme, devuelve eme menos uno factorial.', math`\Gamma(m)=(m-1)!`),
      beat('Gamma de tres es dos factorial, que vale dos. Esa constante ajusta el total de la densidad, no crea una cuarta etapa.', math`\Gamma(3)=2`),
      beat('Con forma real usamos esta función para normalizar, pero no afirmamos que existan literalmente fracciones de etapas observadas.')
    ]),
    block('densidad-y-area', 'La probabilidad de completar la reacción', [1,'Una familia de tiempos positivos'], ['before'], [
      beat('¿Qué probabilidad tiene acabar antes de cuatro minutos? Necesitamos el área de la densidad gamma, no su altura en cuatro.'),
      beat('La forma aporta te elevado a ka menos uno; la escala aporta la exponencial de menos te entre alfa.', math`t^{k-1}e^{-t/\alpha}`),
      beat('Dividimos por gamma de ka y alfa a la ka. Ambos parámetros deben ser positivos y te pertenece al soporte positivo.', math`f(t)=\frac{t^{k-1}e^{-t/\alpha}}{\Gamma(k)\alpha^k}`),
      beat('Para forma tres y escala dos, el denominador vale dieciséis. El sombreado muestra el área hasta cuatro, en la curva de ese mismo modelo.', plot('Gamma de tres etapas',curve(0,18,time=>time*time*Math.exp(-time/2)/16),'Tiempo (min)','Densidad (1/min)',{shade:[0,4]})),
      beat('La acumulada gamma integra esa área. Una biblioteca debe recibir forma tres y escala dos, o tasa una mitad si usa esa otra convención.'),
      beat('Fuera del soporte positivo la densidad vale cero. El dibujo truncado en dieciocho minutos no declara un máximo posible de duración.')
    ]),
    block('sumas-y-variacion', 'La escala común es una condición', ['Sumar con una condición importante'], null, [
      beat('Sumamos dos gammas independientes, de formas dos y tres, ambas escala dos. ¿Qué parámetro se suma? Las formas, no las escalas.', math`2+3=5`),
      beat('La suma tiene forma cinco y conserva escala dos. Con escalas distintas esa regla simple no vale en general.', note('Gamma de la suma','Forma 5; escala 2')),
      beat('La media general es ka por alfa; la varianza es ka por alfa al cuadrado.', math`\operatorname{Var}(T)=k\alpha^2`),
      beat('Al aumentar etapas independientes, crece la variabilidad absoluta pero baja la relativa. La desviación entre media vale uno entre raíz de ka.', math`\frac{\sigma_T}{E[T]}=\frac1{\sqrt k}`),
      beat('Forma uno recupera la exponencial. Formas reales ofrecen un modelo flexible de cantidades positivas, no una prueba de que exista una secuencia literal de etapas.')
    ])
  ],
  'cauchy-weibull':[
    block('centro-sin-media', 'Una simetría que no permite promediar las colas', [0,'Cauchy: un centro sin media'], null, [
      beat('Una señal tiene una curva simétrica alrededor de cero. ¿Podemos afirmar que su esperanza es cero? Con Cauchy, no.'),
      beat('La Cauchy estándar tiene densidad uno entre pi por uno más equis al cuadrado. Pi es la constante circular.', math`f_C(x)=\frac1{\pi(1+x^2)}`),
      beat('El dibujo muestra la región central; las colas continúan mucho más allá.', plot('Cauchy estándar',curve(-8,8,value=>1/(Math.PI*(1+value*value))),'Señal x','Densidad Cauchy')),
      beat('Su mediana y moda son cero. Pero las contribuciones positiva y negativa de la esperanza divergen: no las cancelamos para inventar un promedio.'),
      beat('El valor principal simétrico es otra operación. La esperanza no existe, la varianza no está definida y sus momentos enteros positivos no son finitos.'),
      beat('Una muestra finita siempre tiene un promedio numérico. Eso no crea una esperanza poblacional. Cocientes con denominadores cerca de cero motivan cautela sobre colas, no demuestran automáticamente Cauchy.')
    ]),
    block('intervalos-cauchy', 'Calcular probabilidad sin una esperanza', [1,'Cauchy: un centro sin media'], ['interval','median'], [
      beat('¿Podemos calcular intervalos aunque no haya media? Sí. La acumulada Cauchy usa arco tangente, la inversa de la tangente en su tramo principal.'),
      beat('Equis sub cero es localización y gamma minúscula una escala positiva. No es gamma mayúscula del factorial.', math`F(x)=\frac12+\frac1\pi\arctan\!\left(\frac{x-x_0}{\gamma}\right)`),
      beat('En la estándar, arco tangente de uno es pi entre cuatro. La acumulada en uno es tres cuartos.', math`F(1)=3/4`),
      beat('En menos uno es un cuarto. Restar ambas acumuladas da probabilidad una mitad entre menos uno y uno.', math`3/4-1/4=1/2`),
      beat('La mediana resuelve acumulada una mitad y coincide con la localización. No usamos una desviación típica inexistente para tipificar este modelo.')
    ]),
    block('weibull-supervivencia', 'Permitir que el riesgo cambie', ['Weibull: no todos los sistemas carecen de memoria'], null, [
      beat('Un sensor envejece. ¿Necesitamos que el riesgo sea constante? Weibull permite cambiarlo con forma beta y escala alfa, ambas positivas.'),
      beat('Con escala diez horas y forma dos, primero dividimos tiempo diez por escala diez.', math`10/10=1`),
      beat('Elevamos ese uno a la forma dos; sigue siendo uno. Después aplicamos la exponencial negativa.', math`S(10)=e^{-1}`),
      beat('La probabilidad de superar diez horas es aproximadamente trescientas sesenta y ocho milésimas. El gráfico usa esos mismos parámetros.', plot('Weibull: escala 10, forma 2',curve(0,25,time=>Math.exp(-((time/10)**2))),'Tiempo (h)','S(t)')),
      beat('La supervivencia general aplica esa potencia al tiempo relativo a la escala.', math`S(t)=e^{-(t/\alpha)^\beta}`),
      beat('La densidad multiplica la supervivencia por el factor beta entre alfa y el tiempo relativo a la beta menos uno.', math`f(t)=\frac\beta\alpha\left(\frac t\alpha\right)^{\beta-1}S(t)`)
    ]),
    block('riesgo-y-momentos', 'Interpretar la forma sin inventar una causa', ['Weibull: no todos los sistemas carecen de memoria'], null, [
      beat('¿Cómo obtenemos el riesgo instantáneo? Dividimos densidad por supervivencia, que es positiva para tiempos finitos.', math`h(t)=f(t)/S(t)`),
      beat('En Weibull se cancela la exponencial y queda el factor de potencia.', math`h(t)=\frac\beta\alpha\left(\frac t\alpha\right)^{\beta-1}`),
      beat('Forma uno da riesgo constante y recupera exponencial. Menor que uno da riesgo decreciente; mayor que uno, creciente. Esta lectura amplía la fórmula, no identifica por sí sola envejecimiento o selección.'),
      beat('La media finita usa gamma de uno más el inverso de beta, multiplicada por escala alfa.', math`E[W]=\alpha\Gamma(1+1/\beta)`),
      beat('El segundo momento usa alfa al cuadrado y gamma de uno más dos entre beta.', math`E[W^2]=\alpha^2\Gamma(1+2/\beta)`),
      beat('Restar el cuadrado de la media da la varianza. Weibull tiene estos momentos finitos; Cauchy no. No trasladamos las propiedades de una familia a la otra.', math`\operatorname{Var}(W)=E[W^2]-E[W]^2`)
    ])
  ],
  'calculo-modelos':[
    block('operacion-correcta', 'La calculadora responde a la pregunta que recibe', [0,'Cuatro operaciones diferentes'], null, [
      beat('Un modelo normal tiene media veinte y desviación tres. ¿La densidad en veintiséis responde a superar veintiséis? No: una altura y una cola son operaciones distintas.'),
      beat('Masa o densidad evalúan un punto; acumulada reúne hasta un umbral; cuantil busca un umbral; generación produce realizaciones.', note('Operaciones','Masa/densidad; acumulada; cuantil; generación')),
      beat('En R esas familias suelen empezar por de, pe, cu y erre. En Python se distinguen masa o densidad, acumulada, inversa acumulada y generación.', note('Nombres de funciones','R: d, p, q, r; Python: pmf/pdf, cdf, ppf, rvs')),
      beat('Una densidad tiene unidades inversas de la medida. Un cuantil devuelve las unidades de la medida. La probabilidad de una cola no tiene unidades.'),
      beat('La normal puede escribirse con varianza y el programa pedir desviación. Las esperas pueden usar escala o tasa. Un argumento aceptado no garantiza que elegimos el modelo correcto.')
    ]),
    block('consulta-con-unidades', 'Resolver una consulta normal reproducible', [1,'Una consulta reproducible, con unidades'], ['interval','quantile'], [
      beat('Para superar veintiséis, primero restamos media veinte. La distancia es seis.', math`26-20=6`),
      beat('Dividimos seis entre desviación tres: dos desviaciones por encima.', math`6/3=2`),
      beat('Consultamos la cola estándar uno menos fi de dos. Resulta aproximadamente dos coma veintiocho por ciento.', math`P(X>26)=1-\Phi(2)`),
      beat('Una consulta de cola superior en R o de supervivencia en SciPy devuelve esa probabilidad, no una densidad.', note('Consultas equivalentes','pnorm(26, mean=20, sd=3, lower.tail=FALSE); norm.sf(26, loc=20, scale=3)')),
      beat('El percentil noventa, en cambio, devuelve aproximadamente veintitrés coma ochenta y cuatro en unidades de la medida.', note('Cuantil, no probabilidad','qnorm(0.9, mean=20, sd=3); norm.ppf(0.9, loc=20, scale=3)')),
      beat('En recuentos, al menos ka complementa la acumulada hasta ka menos uno. En continuo un punto no aporta masa, pero en discreto sí.')
    ]),
    block('elegir-mecanismo', 'Soporte, diseño y comprobación', ['Un itinerario para elegir'], null, [
      beat('¿Qué distribución merece un recuento biológico? Empezamos por qué contamos y cómo obtenemos los datos, no por una curva que nos guste.'),
      beat('Un ensayo binario pide Bernoulli; un número fijo de ensayos independientes con pe común, binomial; extracción finita sin reemplazo, hipergeométrica.', note('Ensayo binario','Indicador -> Bernoulli'), note('Ensayos fijos','Independientes y p común -> binomial'), note('Extracción finita','Sin reemplazo -> hipergeométrica')),
      beat('Una parada al lograr éxitos lleva a geométrica o binomial negativa. Recuentos por exposición estable pueden llevar a Poisson; duraciones necesitan soporte y un riesgo coherentes.', note('Condición de parada','Primer éxito -> geométrica; meta entera de éxitos -> binomial negativa'), note('Exposición o duración','Exposición estable -> posible Poisson; duración -> comprobar soporte y riesgo')),
      beat('Comprobamos independencia, homogeneidad, resolución y parámetros. Después contrastamos los resúmenes y las colas que implica el modelo con lo observado, sin exigir coincidencia exacta en una muestra pequeña.', note('Comprobar el mecanismo','Independencia; homogeneidad; resolución; parámetros; resúmenes y colas')),
      beat('Simular ayuda a descubrir errores de implementación. Una semilla permite reproducirlos, pero ni la semilla ni muchas repeticiones prueban que la población siga el modelo.'),
      beat('Los ejemplos aquí son originales y no reproducen respuestas de una evaluación. Una consulta numérica debe volver siempre a la pregunta y a sus unidades.')
    ])
  ],
  'familia-exponencial':[
    block('piezas-poisson', 'Una estructura compartida por varios modelos', [0,'Una estructura compartida, no una sola distribución','Poisson y binomial: identificar las cuatro piezas'], null, [
      beat('¿Familia exponencial significa esperar tiempos exponenciales? No. Es una forma de separar datos y parámetros en masas o densidades, con soporte y dominio declarados.'),
      beat('Para Poisson, equis es un recuento no negativo y lambda una media positiva. Hache contiene solo el factorial del dato.', math`h(x)=1/x!`),
      beat('Te de equis es el estadístico que interactúa con el parámetro. Aquí es el propio recuento.', math`T(x)=x`),
      beat('Eta es el parámetro natural: el logaritmo de lambda.', math`\eta=\log\lambda`),
      beat('A de eta normaliza el total. En Poisson es e elevado a eta, equivalente a lambda.', math`A(\eta)=e^\eta`),
      beat('Ahora podemos reunir las piezas: hache por exponencial de eta por te menos a.', math`f(x;\eta)=h(x)\exp\{\eta T(x)-A(\eta)\}`)
    ]),
    block('binomial-natural', 'Las odds ofrecen otro parámetro natural', ['Una estructura compartida, no una sola distribución','Poisson y binomial: identificar las cuatro piezas'], null, [
      beat('Con una binomial de tamaño ene fijo, ¿cómo escribimos la misma estructura? Primero exigimos pe estrictamente entre cero y uno.'),
      beat('Hache es la combinación y te el recuento. El soporte sigue siendo los enteros de cero a ene.', math`h(x)=\binom nx`),
      beat('Las odds dividen pe entre uno menos pe. Su logaritmo es eta, llamado logit.', math`\eta=\log\frac p{1-p}`),
      beat('El normalizador es ene por el logaritmo de uno más e elevado a eta.', math`A(\eta)=n\log(1+e^\eta)`),
      beat('Para pe tres cuartos, las odds son tres y eta logaritmo de tres. No se exige que eta sea una probabilidad.', note('Ejemplo','p: 3/4; odds: 3; eta: log(3)')),
      beat('Pe cero o uno da modelos degenerados como límites, no un logit finito. Cambiar soporte o dominio sin declararlo puede invalidar esta representación.')
    ]),
    block('normales-uniparametricas', 'Fijar la varianza no es fijar la media', ['Una estructura compartida, no una sola distribución','Normal: qué parámetro se mantiene fijo'], null, [
      beat('Una normal también pertenece a esta estructura, pero ¿qué parámetro dejamos variar? Hay dos familias distintas si solo variamos uno.'),
      beat('Con varianza conocida ve y media variable, te es equis. Al expandir el cuadrado, eta es mu entre ve.', math`\eta=\mu/v`),
      beat('Hache es la densidad centrada en cero con esa varianza conocida. A normaliza mediante ve por eta al cuadrado entre dos.', math`A(\eta)=v\eta^2/2`),
      beat('Con media conocida mu cero y varianza variable, te es ahora la distancia cuadrada respecto a esa media.', math`T(x)=(x-\mu_0)^2`),
      beat('Eta es menos uno entre dos veces la varianza. Su dominio es negativo, porque la varianza debe ser positiva.', math`\eta=-1/(2\sigma^2)`),
      beat('Podemos usar hache uno entre raíz de dos pi y este normalizador logarítmico; menos dos eta es positivo.', math`A(\eta)=-\tfrac12\log(-2\eta)`),
      beat('Si variamos media y varianza a la vez necesitamos una extensión con más parámetros. No mezclamos los estadísticos de estos dos casos uniparamétricos.')
    ]),
    block('datos-fijos-y-maximo', 'Comparar medias candidatas con la misma muestra', [1,'Qué anticipa el documento','Un máximo y un enlace, paso a paso'], ['sufficient-statistic','mle'], [
      beat('Observamos recuentos cero, uno y dos en ventanas independientes con la misma exposición. ¿Qué media Poisson sostiene mejor estos datos? Los datos quedan fijos.', note('Muestra','0; 1; 2; n: 3')),
      beat('La independencia permite multiplicar las tres masas. La suma te de los recuentos es tres y los factoriales forman un factor fijo.', math`T=0+1+2`),
      beat('El producto de masas, ele, es verosimilitud. No es una distribución posterior de lambda.', math`L(\lambda)=e^{-3\lambda}\lambda^3/2`),
      beat('Su logaritmo convierte el producto en suma. Al derivar respecto a lambda, con los datos fijos, queda tres entre lambda menos tres.', math`\ell'(\lambda)=3/\lambda-3`),
      beat('Igualar esa derivada a cero da lambda uno. La segunda derivada es negativa para lambda positiva: confirma el máximo.', math`\widehat\lambda=1`),
      beat('Para una muestra general con suma positiva, el estimador es la suma te entre el número ene de ventanas. Con todos los recuentos cero, el máximo está en el límite lambda cero, no en un punto interior.'),
      beat('La factorización concentra la parte de los datos que depende del parámetro en te, con ene fijo. No demuestra ni independencia ni que los recuentos realmente sean Poisson.')
    ]),
    block('log-verosimilitud', 'Incluir los términos constantes al evaluar', ['Un máximo y un enlace, paso a paso'], ['log-likelihood'], [
      beat('¿Cuánto vale la log verosimilitud en lambda uno para la misma muestra? Para evaluar su valor, incluimos los factoriales aunque no cambien el máximo.'),
      beat('El total tres multiplica logaritmo natural de uno, que es cero.', math`3\log1=0`),
      beat('Restamos tres ventanas por lambda uno.', math`0-3=-3`),
      beat('Después restamos logaritmo de dos, procedente de dos factorial. El resultado es aproximadamente menos tres coma seiscientos noventa y tres.', math`\ell(1)=-3-\log2`),
      beat('La expresión general conserva las tres aportaciones, con datos fijos.', math`\ell(\lambda)=T\log\lambda-n\lambda-\sum_i\log(x_i!)`),
      beat('Una log verosimilitud negativa no es una probabilidad negativa. Solo compara candidatos dentro del modelo; no garantiza estimadores insesgados, precisos o adecuados.')
    ]),
    block('enlaces-glm', 'Relacionar la media con predictores', ['Qué anticipa el documento','Un máximo y un enlace, paso a paso'], null, [
      beat('¿Cómo relacionamos una dosis con la media sin permitir medias Poisson negativas? Un modelo lineal generalizado usa una distribución de respuesta y una función de enlace.'),
      beat('Ge transforma la media mu de cada respuesta. Los predictores equis y los coeficientes beta forman su combinación lineal.', math`g(\mu_i)=\boldsymbol x_i^{\mathsf T}\boldsymbol\beta`),
      beat('Con enlace logarítmico, volver mediante la exponencial produce una media positiva. Coeficientes logaritmo de dos y logaritmo de uno coma cinco dan medias dos, tres y cuatro coma cinco para dosis cero, uno y dos.', plot('Medias propuestas, no ajustadas',[[0,2],[1,3],[2,4.5]],'Dosis d','Media Poisson')),
      beat('Estos coeficientes son ilustrativos, no estimados de las tres ventanas. Un enlace no prueba causalidad ni sustituye el diagnóstico del modelo.'),
      beat('Para una respuesta binaria, el logit vuelve a una probabilidad mediante exponencial entre uno más exponencial. Eta cero da una mitad y eta logaritmo de tres da tres cuartos.', math`p=\frac{e^\eta}{1+e^\eta}`),
      beat('Esto introduce GLM y estimación, no un curso completo de ajuste. Intervalos, contrastes y teorema central del límite quedan fuera del bloque suministrado.')
    ])
  ],
  'conjunta-discreta':[
    block('parejas', 'Dos medidas pertenecen al mismo resultado', [0,'Dos números del mismo resultado'], ['cell'], [
      beat('Medimos dos marcadores de una célula. ¿Basta guardar cuántas tienen cada marcador por separado? No: perderíamos qué combinaciones aparecen juntas.'),
      beat('Equis nombra filas e i griega columnas. Cada celda es una pareja simultánea, no una probabilidad dentro de una fila.', note('Tabla, columnas Y = 0 y 1','Fila X = 0: 0,35; 0,15. Fila X = 1: 0,25; 0,25')),
      beat('Pe sub equis e i griega nombra la masa conjunta de una pareja. En la celda equis uno, i griega cero vale un cuarto. La coma reúne ambos valores simultáneos.', math`p_{X,Y}(1,0)=0{,}25`),
      beat('Las cuatro celdas son no negativas y suman uno. Si transponemos la tabla, también debemos intercambiar las etiquetas.'),
      beat('Un vector aleatorio reúne varias medidas del mismo resultado. Dos marginales iguales pueden acompañarse de relaciones conjuntas distintas; no reconstruyen por sí solas las parejas.')
    ]),
    block('region-de-celdas', 'Seleccionar antes de sumar', [1,'Seleccionar una región antes de sumar'], ['region'], [
      beat('¿Qué probabilidad corresponde a equis como máximo cero e i griega como máximo uno? Elegimos las dos celdas de la primera fila.'),
      beat('Sumamos treinta y cinco centésimas y quince centésimas.', math`0{,}35+0{,}15=0{,}50`),
      beat('La acumulada bivariante usa dos umbrales y reúne la región inferior izquierda, incluidos ambos límites.', math`F_{X,Y}(a,b)=P(X\leq a,Y\leq b)`),
      beat('Para otra región comprobamos sus dos desigualdades en cada celda. Una frase con o puede reunir zonas solapadas; una con y exige ambas.'),
      beat('Una tabla rectangular puede contener celdas imposibles. Si dos recuentos comparten total fijo, su soporte ocupa solo ciertas combinaciones; el hueco dibujado no crea masa.')
    ]),
    block('rectangulo-acumulado', 'Restar franjas y devolver la esquina', ['Un rectángulo a partir de acumuladas'], null, [
      beat('¿Cómo aislamos un rectángulo abierto en sus límites inferiores y cerrado en los superiores? Empezamos con todo lo acumulado hasta be y de.', math`F(b,d)`),
      beat('Restamos la franja izquierda, hasta a y de.', math`F(b,d)-F(a,d)`),
      beat('Restamos también la franja inferior, hasta be y ce. Su esquina común ya se ha retirado dos veces.', math`F(b,d)-F(a,d)-F(b,c)`),
      beat('Añadimos la esquina acumulada hasta a y ce. Eso deja justo el rectángulo solicitado.', math`P(a<X\leq b,c<Y\leq d)=F(b,d)-F(a,d)-F(b,c)+F(a,c)`),
      beat('En nuestra tabla, para ambos indicadores uno, partimos de uno, restamos media fila y seis décimas de columna, y añadimos treinta y cinco centésimas de esquina. Queda un cuarto.', note('Rectángulo (0,1] por (0,1]','1 - 0,50 - 0,60 + 0,35: 0,25')),
      beat('Incluir los extremos inferiores sería otra pregunta si hay masa en ellos. Los límites no se cambian después de hacer la cuenta.')
    ])
  ],
  multinomial:[
    block('categorias-y-secuencias', 'Cada ensayo ocupa una sola categoría', [0,'Extender el recuento binomial'], ['exact'], [
      beat('Cuatro células se clasifican como a en reposo, be activada o ce dañada. ¿Cómo calculamos dos, una y una? Cada célula debe entrar en una categoría y las categorías cubrir todos sus resultados.', note('Probabilidades por célula','A: 0,5; B: 0,3; C: 0,2')),
      beat('Suponemos cuatro ensayos independientes con las mismas probabilidades. Los recuentos suman cuatro: el soporte no permite cualquier terna.'),
      beat('Un orden concreto tiene probabilidad una mitad al cuadrado por tres décimas por dos décimas.', math`p_{\mathrm{secuencia}}=0{,}5^2\cdot0{,}3\cdot0{,}2`),
      beat('El factorial multinomial cuenta órdenes distintos. Cuatro factorial dividido por dos factorial y los dos unos factorial da doce.', math`\frac{4!}{2!1!1!}=12`),
      beat('La secuencia pesa quince milésimas. Multiplicar por doce da dieciocho centésimas para la terna de recuentos.', math`12\cdot0{,}015=0{,}18`),
      beat('Pe sub equis vector nombra la masa de una terna de recuentos. En general el producto de probabilidades pondera secuencias y el coeficiente reúne las equivalentes.', math`p_{\boldsymbol X}(\boldsymbol x)=\frac{n!}{\prod_i x_i!}\prod_i p_i^{x_i}`)
    ]),
    block('marginales-y-total', 'Ensayos independientes, recuentos dependientes', [1,'Independencia entre ensayos, no entre categorías'], ['marginal-a'], [
      beat('¿El recuento de a es independiente del de be? No: ambos compiten por las cuatro células disponibles.', math`X_A+X_B+X_C=4`),
      beat('Si solo contamos a, reunimos be y ce como no a. Cada ensayo vuelve a tener dos resultados y el recuento marginal es binomial.', math`X_A\sim\operatorname{Bin}(4,0{,}5)`),
      beat('En una trinomial podemos guardar dos coordenadas y recuperar la tercera restándolas al total. Omitir una coordenada no hace independientes las otras dos.'),
      beat('El modelo exige categorías excluyentes, probabilidades constantes e independencia entre células. Dependencia entre posiciones o clasificación incierta pueden romperlo.'),
      beat('Que las frecuencias observadas sumen uno no demuestra multinomial. Esa suma solo comprueba una restricción del recuento.')
    ]),
    block('momentos-con-indicadores', 'La covarianza negativa sale del total compartido', ['Por qué aparecen las covarianzas negativas'], null, [
      beat('¿Por qué los recuentos de categorías tienen covarianza negativa? Escribimos cada uno como suma de indicadores de sus células.'),
      beat('En una misma célula, los indicadores de a y be no pueden valer uno a la vez. Su producto es cero.', math`I_AI_B=0`),
      beat('Restar el producto de sus medias da covarianza menos pe a por pe be. Los términos entre células distintas son cero por independencia.', math`\operatorname{Cov}(I_A,I_B)=-p_Ap_B`),
      beat('Sumar las cuatro contribuciones da menos cuatro por una mitad por tres décimas, es decir, menos seis décimas.', math`\operatorname{Cov}(X_A,X_B)=-4\cdot0{,}5\cdot0{,}3`),
      beat('Cada componente tiene esperanza ene por su pe y varianza ene por pe por uno menos pe.', math`\operatorname{Var}(X_i)=np_i(1-p_i)`),
      beat('Cada fila de la matriz de covarianzas suma cero porque el total de recuentos es constante. La matriz puede ser singular sin ser inválida. No interpretamos esta restricción como una causa biológica entre estados.')
    ])
  ],
  marginales:[
    block('sumar-la-otra', 'Conservar Y sin fijar X', [0,'Reunir todas las posibilidades del otro componente'], ['marginal-y'], [
      beat('En una tabla de marcadores, ¿qué probabilidad tiene i griega uno sin saber equis? Debemos reunir todas las filas de esa columna.', note('Tabla, columnas Y = 0 y 1','X = 0: 0,35; 0,15. X = 1: 0,25; 0,25')),
      beat('Sumamos quince centésimas y veinticinco centésimas.', math`0{,}15+0{,}25=0{,}40`),
      beat('Esa es la marginal de i griega en uno. No dividimos por una fila y no seleccionamos un valor conocido de equis.', math`p_Y(y)=\sum_x p_{X,Y}(x,y)`),
      beat('Para conservar equis sumaríamos todas las columnas. El resultado vuelve a sumar uno y permite preguntas sobre una sola medida.'),
      beat('La marginal olvida cómo se coordina esa medida con la otra, aunque conserve exactamente sus probabilidades univariantes.')
    ]),
    block('integrar-cortes', 'Una superficie uniforme puede tener marginal inclinada', [1,'Reunir todas las posibilidades del otro componente'], null, [
      beat('Ahora hay densidad conjunta dos sobre el triángulo positivo de capacidad uno. ¿La marginal de equis es uniforme? Su corte disponible cambia de longitud.', triangle(0.25)),
      beat('Fijando equis en un cuarto, i griega recorre tres cuartos. Multiplicamos densidad dos por esa longitud.', math`2\cdot0{,}75=1{,}5`),
      beat('Ese uno coma cinco es densidad marginal, no probabilidad puntual. Para cualquier equis interior integramos a lo largo de todos los i griega compatibles.', math`f_X(x)=\int_0^{1-x}2\,dy`),
      beat('La integral da dos por uno menos equis. El gráfico muestra cómo decrece al quedar menos recurso para la otra medida.', plot('Marginal del reparto',[[0,2],[1,0]],'Recurso x','Densidad marginal fX')),
      beat('La integral de esa marginal entre cero y uno es uno. Para la marginal de i griega haríamos lo mismo intercambiando coordenadas y etiquetas.')
    ]),
    block('proyeccion-y-corte', 'Olvidar no es conocer', ['Lo que se pierde al marginalizar'], null, [
      beat('¿Qué diferencia hay entre marginalizar y condicionar? Volvamos a la tabla: la marginal de i griega uno es cuatro décimas.'),
      beat('Si conocemos equis uno, su fila tiene total una mitad y la celda i griega uno un cuarto. Dividir dentro de la fila da una mitad: la masa condicional de i griega uno dado equis uno, pe sub i griega dado equis.', math`p_{Y\mid X}(1\mid1)=0{,}25/0{,}50`),
      beat('La marginal suma sin fijar equis; la condicional normaliza con equis conocido. Las dos respuestas difieren porque las preguntas difieren.', note('Dos distribuciones','P(Y = 1): 0,4; P(Y = 1 dado X = 1): 0,5')),
      beat('En continuo un corte muestra alturas conjuntas con una coordenada fija. La proyección por integración reúne todo el recorrido de esa coordenada.'),
      beat('No reconstruimos una conjunta multiplicando marginales salvo que haya independencia justificada. La información de coordinación se pierde al sumar o integrar.')
    ])
  ],
  'conjunta-condicional':[
    block('normalizar-region', 'La probabilidad es volumen sobre una región', [0,'Probabilidad en una región'], ['normalizer','sum-event'], [
      beat('Dos cultivos comparten capacidad uno y su reparto tiene altura constante ce sobre el triángulo. ¿Qué altura convierte ese volumen en probabilidad total uno?', triangle()),
      beat('El área de soporte es una mitad. Multiplicar por ce debe dar uno.', math`c/2=1`),
      beat('La altura es dos. Su unidad es la inversa del producto de unidades de las dos variables; el volumen integrado no tiene unidades.'),
      beat('El suceso suma como máximo una mitad ocupa un triángulo menor, dentro del soporte. Su área es un octavo.', math`(1/2)^2/2=1/8`),
      beat('Multiplicamos altura dos por ese área. Su probabilidad es un cuarto.', math`2\cdot\frac18=\frac14`),
      beat('Una probabilidad regional integra la conjunta sobre la intersección del suceso y su soporte. No añadimos zonas del rectángulo exterior.', math`P((X,Y)\in R)=\iint_R f_{X,Y}(x,y)\,dx\,dy`)
    ]),
    block('normalizar-corte', 'El denominador continuo es una densidad marginal', [1,'Normalizar un corte'], ['marginal-density','conditional-density'], [
      beat('Conocemos equis igual a dos décimas. ¿Cómo se distribuye i griega dentro del corte? Su recorrido va de cero a ocho décimas.', triangle(0.2)),
      beat('La marginal de equis integra altura dos por longitud ocho décimas.', math`f_X(0{,}2)=2\cdot0{,}8`),
      beat('Resulta uno coma seis, positivo. Dividimos la altura conjunta dos entre esa densidad marginal.', math`f_{Y\mid X}(y\mid0{,}2)=2/1{,}6`),
      beat('La densidad condicional es uno coma veinticinco por unidad de i griega. Su área en el corte es uno.', math`1{,}25\cdot0{,}8=1`),
      beat('Usamos cociente de densidades, no dividimos por la probabilidad de equis exactamente dos décimas, que es cero en este modelo.'),
      beat('En discreto sí dividimos masa conjunta por marginal puntual positiva. El tipo de medida decide el cociente correcto.', math`p_{Y\mid X}(y\mid x)=\frac{p_{X,Y}(x,y)}{p_X(x)}`)
    ]),
    block('interpretar-condicion', 'Un corte exacto no es un intervalo de lectura', ['Normalizar un corte'], ['conditional-tail'], [
      beat('En el corte anterior, ¿qué probabilidad tiene i griega superior a cuatro décimas? El tramo favorable mide cuatro décimas de las ocho disponibles.'),
      beat('Multiplicamos anchura cuatro décimas por densidad uno coma veinticinco.', math`0{,}4\cdot1{,}25=0{,}5`),
      beat('El gráfico muestra ese mismo corte ya normalizado; el área sombreada es una mitad.', plot('Condicional de Y dado X = 0,2',[[0,1.25],[0.8,1.25]],'Recurso y','Densidad condicional',{shade:[0.4,0.8]})),
      beat('No usamos solo la altura uno coma veinticinco como probabilidad. La condición define una distribución completa que integra uno.'),
      beat('Si un instrumento registra equis entre quince y veinticinco centésimas, condicionamos a una franja de área positiva, no al corte exacto. Es otra pregunta con otra normalización.')
    ])
  ],
  'normal-bivariante':[
    block('modelo-conjunto', 'Dos campanas marginales no bastan', [0,'Una campana sobre dos ejes'], null, [
      beat('Dos señales tienen medias treinta y setenta, desviaciones cinco y ocho, y correlación un cuarto. ¿Eso permite una normal conjunta? Debemos suponer normalidad conjunta, no solo marginal.'),
      beat('Las dos desviaciones deben ser positivas y ro, la correlación, estrictamente entre menos uno y uno.', note('Modelo no degenerado','muX: 30; muY: 70; sigmaX: 5; sigmaY: 8; rho: 0,25')),
      beat('Las marginales son normales con sus medias y varianzas. Ro orienta y alarga las elipses, pero no cambia por sí sola esos momentos marginales.'),
      beat('Tipificamos cada coordenada con su propio centro y desviación. Zeta equis corresponde a la primera y zeta i griega a la segunda.', math`z_x=\frac{x-\mu_X}{\sigma_X}`),
      beat('Para la segunda usamos sus parámetros, no los de equis.', math`z_y=\frac{y-\mu_Y}{\sigma_Y}`),
      beat('Ro uno o menos uno concentra el vector en una línea y no tiene la densidad bidimensional ordinaria. Esos casos degenerados necesitan otro tratamiento.')
    ]),
    block('densidad-bivariante', 'Separar forma conjunta y normalización', ['Una campana sobre dos ejes'], null, [
      beat('¿Cómo entra ro en la densidad sobre dos ejes? Primero formamos un término cuadrático con las coordenadas tipificadas.'),
      beat('Q reúne los dos cuadrados y el término cruzado menos dos ro zeta equis zeta i griega. Ese cruce orienta las elipses.', math`Q=z_x^2-2\rho z_xz_y+z_y^2`),
      beat('Uno menos ro al cuadrado es positivo en el modelo no degenerado. Divide el término cuadrático dentro de la exponencial.', math`K=\exp\!\left\{-\frac{Q}{2(1-\rho^2)}\right\}`),
      beat('La normalización usa dos pi, las dos desviaciones y la raíz de uno menos ro al cuadrado.', math`D=2\pi\sigma_X\sigma_Y\sqrt{1-\rho^2}`),
      beat('La densidad conjunta es el factor de forma ka dividido entre ese normalizador de. No es la probabilidad de una pareja exacta.', math`f(x,y)=K/D`),
      beat('Con ro cero el término cruzado desaparece y la densidad factoriza en las dos normales marginales. Esa conclusión de independencia pertenece al modelo conjuntamente normal.')
    ]),
    block('media-y-varianza-condicional', 'Actualizar la curva cuando conocemos X', [1,'Conocer una medida cambia la otra'], ['conditional-mean','conditional-sd'], [
      beat('Observamos equis cuarenta. ¿Qué media condicional tiene i griega? La distancia de equis a su media es diez.', math`40-30=10`),
      beat('La pendiente condicional combina ro con la razón de desviaciones. Un cuarto por ocho entre cinco da cuatro décimas.', math`\rho\sigma_Y/\sigma_X=0{,}4`),
      beat('Multiplicamos esa pendiente por la distancia diez; el desplazamiento esperado es cuatro.', math`0{,}4\cdot10=4`),
      beat('Sumamos cuatro a la media marginal setenta. La media condicional es setenta y cuatro.', math`\mu_{Y\mid40}=74`),
      beat('La varianza marginal sesenta y cuatro se multiplica por uno menos ro al cuadrado. El resultado es sesenta.', math`\sigma^2_{Y\mid40}=64(1-0{,}25^2)`),
      beat('Tomamos su raíz para tipificar: aproximadamente siete coma setecientos cuarenta y seis. La fórmula general reduce varianza, no desviación sin raíz.', math`\sigma_{Y\mid x}=\sigma_Y\sqrt{1-\rho^2}`)
    ]),
    block('cola-condicional', 'Usar la normal del corte, no la marginal', ['Conocer una medida cambia la otra'], ['conditional-tail'], [
      beat('¿Qué probabilidad tiene i griega superar ochenta y dos cuando equis vale cuarenta? La curva del corte es normal de media setenta y cuatro y varianza sesenta.'),
      beat('Restamos la nueva media al umbral. La distancia es ocho.', math`82-74=8`),
      beat('Dividimos ocho entre raíz de sesenta. Zeta es aproximadamente uno coma cero treinta y tres.', math`z=8/\sqrt{60}`),
      beat('La barra dice dado equis cuarenta. Esta probabilidad de superar ochenta y dos pertenece al corte conocido, no a la curva marginal.', math`P(Y>82\mid X=40)`),
      beat('La calculamos complementando fi de ese zeta. La cola es aproximadamente quince coma uno por ciento.', math`1-\Phi(8/\sqrt{60})`),
      beat('El sombreado representa la cola visible del corte. La normal sigue más allá del rango dibujado.', plot('Corte normal: media 74, varianza 60',curve(43,105,value=>Math.exp(-((value-74)**2)/120)/Math.sqrt(120*Math.PI)),'Señal Y','Densidad condicional',{shade:[82,105]})),
      beat('Otro valor de equis cambia la media pero no la varianza condicional de este modelo. Con ro cero ambas quedan como las marginales. Condicionar informa, no demuestra causalidad ni predice un valor exacto.')
    ])
  ],
  'independencia-variables':[
    block('factorizar-tabla', 'Comprobar todas las parejas', [0,'Una condición para todos los umbrales'], null, [
      beat('Una tabla contiene masas cuarenta y dos, veintiocho, dieciocho y doce centésimas. ¿Hay independencia? Necesitamos comparar todas las celdas con sus marginales.', note('Filas X, columnas Y','X = 0: 0,42; 0,28. X = 1: 0,18; 0,12')),
      beat('Las marginales de equis son siete décimas y tres décimas. Las de i griega son seis décimas y cuatro décimas.', note('Marginales','X: 0,7; 0,3. Y: 0,6; 0,4')),
      beat('Para cero cero, el producto es cuarenta y dos centésimas.', math`0{,}7\cdot0{,}6=0{,}42`),
      beat('Para cero uno, es veintiocho centésimas.', math`0{,}7\cdot0{,}4=0{,}28`),
      beat('La segunda fila da dieciocho y doce centésimas. Coinciden todas las masas; aquí hay independencia.', note('Segunda fila de productos','0,3 por 0,6: 0,18; 0,3 por 0,4: 0,12')),
      beat('Una sola discrepancia refuta independencia, pero una sola coincidencia no la demuestra. Equivalentemente, todas las acumuladas conjuntas deben factorizar para todos los umbrales.', math`F_{X,Y}(x,y)=F_X(x)F_Y(y)`)
    ]),
    block('soporte-completo', 'Los ceros de la región también cuentan', [1,'El soporte también decide'], null, [
      beat('Una densidad constante dos ocupa el triángulo de capacidad uno. ¿Parece separable? El soporte impide combinar libremente las marginales.', triangle(0.8)),
      beat('Si ambas coordenadas están entre tres cuartos y uno, la suma supera uno y la conjunta es cero en toda esa región.'),
      beat('Sin embargo, ambas marginales son positivas en ese rango. Su producto asignaría densidad positiva a combinaciones prohibidas.'),
      beat('La discrepancia ocupa área positiva, no solo un punto. Por eso refuta la independencia de estas variables continuas.'),
      beat('Para densidades exigimos factorizar casi en todas partes: diferencias de área nula no cambian probabilidades. Incluimos ceros y soporte, no solo la fórmula dentro del triángulo.', math`f_{X,Y}(x,y)=f_X(x)f_Y(y)\quad\text{casi en todas partes}`)
    ]),
    block('transformar-y-seleccionar', 'La independencia tiene un alcance', ['El soporte también decide'], ['factorization-gap'], [
      beat('¿Qué podemos hacer si equis e i griega son independientes? Transformar cada una por separado mediante funciones medibles conserva independencia.'),
      beat('La esperanza de un producto de transformaciones se separa cuando las condiciones de integrabilidad permiten usar esas esperanzas.', math`E[g(X)h(Y)]=E[g(X)]E[h(Y)]`),
      beat('Con varianzas finitas podemos sumar varianzas sin covarianza. Eso no convierte correlación cero en una definición de independencia.'),
      beat('Si seleccionamos un grupo por una condición sobre las dos, como suma menor que uno, podemos crear dependencia. Revisamos las hipótesis después de la selección.'),
      beat('Como contraste, equis toma menos uno, cero y uno equiprobables e i griega es su cuadrado. La pareja cero cero tiene masa un tercio y el producto de sus marginales un noveno.', note('Contraejemplo discreto','P(0,0): 1/3; producto: 1/9')),
      beat('Esas masas difieren, así que no hay independencia. Conocer equis determina i griega, aunque la covarianza pueda ser cero.')
    ])
  ],
  'covarianza-matrices':[
    block('desviaciones-compartidas', 'Promediar productos con signo', [0,'Desviarse juntas o en sentidos opuestos'], ['covariance'], [
      beat('Dos lecturas de una muestra suben y bajan juntas. ¿Qué resumen conserva ese movimiento compartido? Restamos cada media y multiplicamos las desviaciones.'),
      beat('Con parejas cero uno y uno tres equiprobables, la media de equis es una mitad y la de i griega dos.', note('Modelo de parejas','(0,1) y (1,3); cada una con masa 1/2')),
      beat('Los productos de desviaciones son una mitad en ambas parejas. Promediarlos da covarianza una mitad.', math`\operatorname{Cov}(X,Y)=0{,}5`),
      beat('Podemos calcularla también como esperanza del producto menos producto de esperanzas, con los momentos adecuados.', math`\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]`),
      beat('El signo positivo indica desviaciones del mismo signo en promedio. Uno negativo indica oposición. La unidad es producto de las unidades, no una probabilidad.')
    ]),
    block('normalizar-covarianza', 'La correlación elimina las unidades', [1,'Desviarse juntas o en sentidos opuestos'], ['correlation'], [
      beat('En otro modelo, las varianzas son nueve y dieciséis y la covarianza seis. ¿Cómo comparamos su asociación sin depender de unidades? Tomamos desviaciones tres y cuatro.'),
      beat('Multiplicamos las desviaciones para obtener doce.', math`3\cdot4=12`),
      beat('Dividimos covarianza seis entre doce. La correlación ro es una mitad.', math`\rho=6/12`),
      beat('Ro queda entre menos uno y uno cuando las desviaciones son positivas. Una variable constante tiene desviación cero y correlación no definida, aunque pueda tener covarianza cero.'),
      beat('Duplicar i griega multiplica su desviación por dos y la covarianza por dos. El cociente queda una mitad: la asociación no ha cambiado por cambiar de escala.'),
      beat('Correlación mide asociación lineal, no todas las dependencias y no causalidad. Independencia implica covarianza cero con momentos finitos; el recíproco falla en general.')
    ]),
    block('matrices-admisibles', 'Organizar varianzas y comprobar su coherencia', ['Organizar muchas medidas'], null, [
      beat('¿Cómo guardamos muchas relaciones sin perder el orden? El vector de medias enumera centros y sigma mayúscula organiza covarianzas.'),
      beat('Para varianzas nueve y dieciséis y covarianza seis, la diagonal guarda las varianzas y las dos entradas cruzadas son iguales.', math`\Sigma=\begin{pmatrix}9&6\\6&16\end{pmatrix}`),
      beat('De coloca desviaciones tres y cuatro en una diagonal. Su inversa requiere que ambas sean positivas.', math`D=\operatorname{diag}(3,4)`),
      beat('Multiplicar por de inversa a ambos lados divide cada entrada por sus dos desviaciones. Así obtenemos la matriz de correlaciones.', math`R=D^{-1}\Sigma D^{-1}`),
      beat('La diagonal de erre es uno y las entradas cruzadas una mitad.', math`R=\begin{pmatrix}1&1/2\\1/2&1\end{pmatrix}`),
      beat('Sigma debe ser semidefinida positiva: toda combinación lineal tiene varianza no negativa. Simetría y diagonal positiva no bastan; por ejemplo, diagonal uno y covarianza dos darían varianza negativa para la diferencia.'),
      beat('En nuestro caso, el determinante es ciento ocho, positivo. El ejemplo inválido se rechaza por incoherencia matemática, no por una asociación biológica extraña.')
    ])
  ],
  'combinaciones-incorrelacion':[
    block('suma-y-diferencia', 'La variación compartida entra con signo', [0,'La relación afecta a la dispersión'], ['covariance'], [
      beat('Dos lecturas emparejadas tienen varianzas cuatro y nueve y covarianza tres. ¿Cuánto varía su diferencia? Una parte del movimiento compartido se cancela.'),
      beat('Primero sumamos las dos varianzas individuales.', math`4+9=13`),
      beat('El término cruzado de la diferencia es menos dos veces la covarianza.', math`2\cdot3=6`),
      beat('Restamos seis a trece. La varianza de la diferencia es siete.', math`13-6=7`),
      beat('Suponer independencia sin motivo habría dado trece. En una suma, esa covarianza positiva aumentaría la varianza en lugar de reducirla.'),
      beat('Para coeficientes a y be, los cuadrados escalan las varianzas y dos a be da el signo y peso del término cruzado.', math`\operatorname{Var}(aX+bY)=a^2\sigma_X^2+b^2\sigma_Y^2+2ab\operatorname{Cov}(X,Y)`)
    ]),
    block('forma-matricial', 'La matriz organiza la misma cuenta', [1,'La relación afecta a la dispersión'], null, [
      beat('¿La notación matricial añade una hipótesis? No. Solo organiza la suma de coeficientes por medidas.'),
      beat('A transpuesta es una fila de coeficientes y equis un vector de medidas. Su producto es una combinación lineal.', math`\boldsymbol a^{\mathsf T}\boldsymbol X`),
      beat('La media aplica esos coeficientes al vector mu. La linealidad no requiere independencia, sí esperanzas utilizables.', math`E[\boldsymbol a^{\mathsf T}\boldsymbol X]=\boldsymbol a^{\mathsf T}\boldsymbol\mu`),
      beat('La varianza aplica los coeficientes a sigma por ambos lados. Eso reúne varianzas y todos los términos de covarianza.', math`\operatorname{Var}(\boldsymbol a^{\mathsf T}\boldsymbol X)=\boldsymbol a^{\mathsf T}\Sigma\boldsymbol a`),
      beat('La covarianza de una medida consigo misma es su varianza. Por eso la diagonal aparece en esta cuenta. El resultado debe ser no negativo para cualquier vector de coeficientes.')
    ]),
    block('incorrelacion', 'Una relación exacta puede no ser lineal', ['Un contraejemplo que conviene recordar'], ['correlation'], [
      beat('Equis es uniforme entre menos uno y uno e i griega su cuadrado. ¿Son independientes si la covarianza vale cero? Conocer equis determina completamente i griega.', math`Y=X^2`),
      beat('La simetría da esperanza de equis cero y esperanza del cubo cero. Además, la esperanza de i griega es un tercio.', note('Momentos del modelo','E[X]: 0; E[X al cubo]: 0; E[Y]: 1/3')),
      beat('El producto equis por i griega es equis al cubo. Restar el producto de medias deja covarianza cero.', math`\operatorname{Cov}(X,Y)=E[X^3]-E[X]E[X^2]`),
      beat('Sus varianzas son positivas y finitas, así que también tienen correlación cero. La dependencia exacta sigue presente: la covarianza solo detecta asociación lineal.'),
      beat('Solo bajo normalidad conjunta, covarianza cero sí implica independencia entre componentes. Tener marginales normales por separado no garantiza esa excepción.'),
      beat('En multinomial, las covarianzas negativas reflejan competencia por un total fijo. Distinguimos esa restricción de diseño, una asociación estadística y cualquier afirmación causal.')
    ])
  ]
};

function slowScene(title, beats) {
  const scene = storyScene(title, title, beats);
  scene.visual.lines = scene.visual.lines.map(line => ({
    ...line,
    ...(line.bar ? {bar:{...line.bar}} : {}),
    ...(line.plot ? {plot:{
      ...line.plot,
      points:line.plot.points.map(point => [...point]),
      ...(line.plot.shade ? {shade:[...line.plot.shade]} : {})
    }} : {})
  }));
  let elapsed = 0;
  scene.cues = scene.cues.map(cue => {
    const duration = Math.max(3, cue.text.split(/\s+/).length / 1.8 + 1.2);
    const result = {...cue, start:elapsed, end:elapsed + duration};
    elapsed += duration;
    return result;
  });
  scene.duration = elapsed;
  return scene;
}

export function createLessonSections(lesson) {
  if (!lesson?.id || !Array.isArray(lesson.sections) || !lesson.exerciseTypes?.length) {
    throw new TypeError('Se necesita una lección con secciones y tipos de ejercicio.');
  }
  const definitions = SECTIONS[lesson.id];
  if (!definitions) throw new RangeError(`Faltan las secciones habladas de ${lesson.id}.`);
  const covered = new Set();
  const ids = new Set();
  const sections = definitions.map(definition => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.id) || ids.has(definition.id)) {
      throw new RangeError(`Identificador de sección inválido en ${lesson.id}.`);
    }
    ids.add(definition.id);
    const sources = definition.covers.map(reference => {
      const source = typeof reference === 'number' ? lesson.sections[reference] : lesson.sections.find(section => section.title === reference);
      if (!source || (typeof reference === 'number' && !source.introductory)) {
        throw new RangeError(`Sección de origen incompatible en ${lesson.id}: ${reference}.`);
      }
      covered.add(source.title);
      return source;
    });
    const optional = sources.length > 0 && sources.every(source => Boolean(source.optional));
    if (!optional && sources.some(source => source.optional)) throw new RangeError('Una ampliación debe mantenerse separada.');
    const type = lesson.exerciseTypes[0];
    const allowed = lesson.exerciseQuestions?.[type];
    const questionIds = definition.questionIds;
    if (questionIds?.some(id => allowed && !allowed.includes(id))) {
      throw new RangeError(`Práctica fuera del alcance de ${lesson.id}.`);
    }
    return {
      id:definition.id,
      title:definition.title,
      sourceSections:sources.map(source => source.title),
      optional,
      animation:{id:`${lesson.id}--${definition.id}`, title:definition.title, kind:'lecture', source:{...lesson.source}, steps:[slowScene(definition.title, definition.beats)]},
      exercise:questionIds?.length ? {type, seed:1, questionIds:[...questionIds]} : null
    };
  });
  for (const source of lesson.sections) {
    if (!covered.has(source.title)) throw new RangeError(`Sección sin guion en ${lesson.id}: ${source.title}.`);
  }
  return sections;
}