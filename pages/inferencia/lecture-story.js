const sentenceSegmenter = new Intl.Segmenter('es', {granularity:'sentence'});

export function storyScene(title, chapter, beats) {
  if (!beats?.length) throw new TypeError('Una escena necesita una explicación.');
  const cues = [];
  const lines = [];
  let time = 0;
  for (const beat of beats) {
    if (!beat.say?.trim()) throw new TypeError('Cada paso necesita una frase hablada.');
    const cue = cues.length;
    const speech = beat.say.trim();
    const sentenceInput = speech.replace(/!(?=\s*[/=+*-])/g, ',');
    const phrases = [];
    for (const item of Array.from(sentenceSegmenter.segment(sentenceInput))) {
      const part = speech.slice(item.index,item.index+item.segment.length);
      if (phrases.length && !/\s$/.test(phrases.at(-1))) phrases[phrases.length-1] += part;
      else phrases.push(part);
    }
    for (const phrase of phrases) {
      const text = phrase.trim();
      const duration = Math.max(2,text.split(/\s+/).length/2.5+0.6);
      cues.push({text,start:time,end:time+duration});
      time += duration;
    }
    for (const item of beat.show || []) lines.push({...item,cue});
  }
  return {title,kind:'lesson',data:{chapter},caption:beats.map(beat=>beat.say.trim()).join(' '),cues,duration:time,visual:{label:title,lines,process:[]},story:true};
}

export function storyLines(step, cueIndex) {
  return (step.visual?.lines || []).filter(item=>!Number.isInteger(item.cue) || item.cue<=cueIndex);
}

const beat = (say,...show) => ({say,show});
const note = (label,value) => ({label,value});
const equation = tex => ({tex});
const quantity = (label,part,total) => ({label,value:`${part} de ${total}`,bar:{part,total}});

const STORIES = {
  proporciones:[
    ['No basta con contar',[
      beat('Imagina que estamos comparando dos ensayos de germinación. En el primero germinan dieciocho semillas. ¿Dirías que ha funcionado mejor que otro en el que germinan treinta? Espera, nos falta un dato.'),
      beat('En el primer ensayo habíamos sembrado setenta y dos semillas. Ahora sí podemos comparar la parte que germina con todo lo que sembramos.',quantity('Primer ensayo',18,72)),
      beat('Dividimos dieciocho entre setenta y dos y obtenemos un cuarto. Es lo mismo que cero coma veinticinco, o el veinticinco por ciento. Hemos cambiado la forma de escribirlo, no las semillas.',equation(String.raw`18/72=0{,}25=25\%`))
    ]],
    ['Volvamos al segundo ensayo',[
      beat('Vamos ahora con las treinta semillas del segundo ensayo. Allí habíamos sembrado doscientas. Hay más germinaciones, sí, pero también había muchas más oportunidades de germinar.',quantity('Segundo ensayo',30,200)),
      beat('Treinta entre doscientas es cero coma quince: el quince por ciento. Al comparar proporciones, el primer ensayo queda por encima. Esa era la información que escondían los recuentos solos.',equation(String.raw`30/200=0{,}15=15\%`)),
      beat('La misma precaución sirve con las unidades. Dos miligramos son dos mil microgramos, no una cantidad de sustancia mayor. Antes de comparar dos números, pregunta siempre: ¿cuál es su total y en qué unidades están?',note('Una misma masa','2 mg = 2000 μg'))
    ]]
  ],
  algebra:[
    ['Buscamos un factor común',[
      beat('Tenemos tres estados de un cultivo y queremos repartir el total en la proporción dos, tres y cinco. Estos números son pesos: todavía no son probabilidades.',note('Pesos de los estados','2, 3 y 5')),
      beat('Sumémoslos primero. Dan diez. Si repartimos cada peso entre diez, el total pasa a ser uno y conservamos la relación entre los tres estados.',equation(String.raw`2+3+5=10`)),
      beat('A ese factor común lo llamamos ce. Diez por ce tiene que valer uno. Dividimos los dos lados entre diez y queda ce igual a una décima. No hemos movido una letra por arte de magia: hemos hecho lo mismo a ambos lados.',equation(String.raw`10c=1\quad\Rightarrow\quad c=1/10`))
    ]],
    ['Deshacer una operación',[
      beat('A veces la incógnita no multiplica, sino que aparece en un exponente. Supón que una proporción restante sigue e elevado a menos te dividido entre seis. Queremos saber cuándo queda la mitad.',note('Pregunta','¿Cuándo queda la mitad?')),
      beat('La exponencial y el logaritmo natural deshacen una la operación de la otra. Tomamos el logaritmo en los dos lados. Logaritmo natural no significa logaritmo en base diez.',equation(String.raw`e^{-t/6}=1/2\quad\Rightarrow\quad -t/6=\log(1/2)`)),
      beat('Al despejar, el tiempo es seis por el logaritmo de dos: unas cuatro coma dieciséis unidades de tiempo. Podemos comprobarlo sustituyéndolo en la expresión inicial. Esa comprobación vale más que memorizar una regla de signos.',equation(String.raw`t=6\log2\approx4{,}16`))
    ]]
  ],
  funciones:[
    ['Una regla que recibe un número',[
      beat('Piensa en una máquina muy sencilla: le damos un número, lo multiplica por dos y le suma uno. A esa regla la llamaremos ge. Ge de equis significa la salida que corresponde a la entrada equis.',note('Regla','Multiplicar por 2 y sumar 1')),
      beat('Si entra tres, primero hacemos dos por tres y después sumamos uno. Sale siete. Los paréntesis indican qué entra en la regla; no dicen que multipliquemos ge por tres.',equation(String.raw`g(3)=2\cdot3+1=7`)),
      beat('Si nos piden sumar las salidas de cero, uno y dos, calculamos cada una: uno, tres y cinco. Después las sumamos. El sumatorio es solo una manera corta de escribir ese trabajo.',equation(String.raw`\sum_{i=0}^2g(i)=1+3+5=9`))
    ]],
    ['Decidir qué valores entran',[
      beat('Ahora cambiamos de ejemplo. Una medida solo puede valer cero, dos o cinco. Sus probabilidades son una décima, seis décimas y tres décimas. No puede tomar cualquier decimal entre esos valores.',note('Valores y probabilidades','0: 0,1 · 2: 0,6 · 5: 0,3')),
      beat('Preguntar por valores menores que tres incluye cero y dos. Sumamos sus probabilidades, no los números cero y dos. Obtenemos cero coma siete.',equation(String.raw`P(X<3)=0{,}1+0{,}6=0{,}7`)),
      beat('En cambio, menores que dos excluye el propio dos. Solo queda cero. Fíjate en ese detalle antes de calcular: una palabra como incluido o excluido puede cambiar toda la respuesta.',equation(String.raw`P(X<2)=0{,}1`))
    ]]
  ],
  calculo:[
    ['La probabilidad ocupa un área',[
      beat('Vamos a imaginar un tiempo que puede caer entre cero y dos minutos, sin preferencia por ninguna zona. Dibujamos una densidad constante. Su altura es medio por minuto, para que el área total sea uno.',note('Rectángulo completo','Anchura 2 min · altura 0,5 por min')),
      beat('Queremos el tiempo entre cero coma cuatro y uno coma dos minutos. Esa franja mide cero coma ocho minutos. Multiplicar altura por anchura da cero coma cuatro de probabilidad.',equation(String.raw`0{,}5\,(1{,}2-0{,}4)=0{,}4`)),
      beat('La integral hace esta misma acumulación cuando la altura cambia. Puedes pensarla como muchas franjas estrechas: cada una aporta altura por anchura, y reunimos sus aportaciones.',note('Integral','Acumular pequeñas áreas'))
    ]],
    ['Cuando la altura cambia',[
      beat('Probemos con otra densidad: te dividido entre dos, desde cero hasta dos. Ahora las franjas de la derecha son más altas. No podemos usar una sola altura para todo el intervalo.',equation(String.raw`f(t)=t/2\quad(0\leq t\leq2)`)),
      beat('Una primitiva es una función cuya derivada devuelve esa altura. Aquí nos sirve te al cuadrado dividido entre cuatro. Para acumular entre cero y uno, evaluamos arriba y restamos lo que había abajo.',equation(String.raw`\int_0^1t/2\,dt=[t^2/4]_0^1=1/4`)),
      beat('Sale un cuarto. La derivada y la integral miran el mismo dibujo desde lados distintos: una habla del cambio local; la otra, de lo que se ha acumulado. Y un punto solo, sin anchura, no aporta área.',note('Resultado','Área 0,25; probabilidad de un punto: 0'))
    ]]
  ],
  'regiones-matrices':[
    ['Dos cultivos comparten un recurso',[
      beat('Tenemos una unidad de recurso para repartir entre dos cultivos. Llamemos equis a lo que recibe el primero e i griega a lo que recibe el segundo. Ninguno puede recibir una cantidad negativa.',note('Coordenadas','x: primer cultivo · y: segundo cultivo')),
      beat('Entre los dos no pueden gastar más de una unidad. Los repartos permitidos forman un triángulo entre los ejes y la línea equis más i griega igual a uno. De momento es geometría, no una probabilidad.',equation(String.raw`x\geq0,\quad y\geq0,\quad x+y\leq1`)),
      beat('Si el primero recibe cero coma tres, al segundo le quedan como máximo cero coma siete. Hemos fijado una coordenada y mirado qué valores siguen permitidos para la otra.',equation(String.raw`x=0{,}3\quad\Rightarrow\quad0\leq y\leq0{,}7`))
    ]],
    ['Leer una lista y una tabla',[
      beat('Cuando hay varias medidas, una lista ordenada nos ayuda a no mezclarlas. Eso es un vector. El orden importa: la primera entrada sigue correspondiendo a la primera medida.',note('Vector','(medida del cultivo 1, medida del cultivo 2)')),
      beat('Una matriz es una tabla con filas y columnas. Para leer una entrada, buscamos primero su fila y después su columna. Más adelante pondremos varianzas y covarianzas en estas posiciones; ahora solo necesitamos orientarnos.',equation(String.raw`M=\begin{pmatrix}4&1\\1&9\end{pmatrix},\quad M_{1,2}=1`)),
      beat('Con las regiones haremos algo parecido: elegir un orden para recorrerlas. En el triángulo, para cada equis, i griega va de cero a uno menos equis. Esos límites saldrán del dibujo, no de una fórmula que haya que adivinar.',equation(String.raw`0\leq x\leq1,\quad0\leq y\leq1-x`))
    ]]
  ],
  sucesos:[
    ['Elegimos una bacteria',[
      beat('Tenemos cien bacterias. Treinta llevan solo el marcador a, veinte solo el be, diez llevan ambos y cuarenta no llevan ninguno. Al elegir una, esos grupos nos dicen qué puede ocurrir.',note('Colección','Solo A: 30 · solo B: 20 · ambos: 10 · ninguno: 40')),
      beat('El suceso a significa que aparece el marcador a. Incluye las treinta que lo llevan solo y también las diez que llevan ambos. Por eso contamos cuarenta, no treinta.',quantity('Con marcador A',40,100)),
      beat('A su probabilidad la escribimos pe de a. Como cada bacteria tiene la misma posibilidad de ser elegida, dividimos cuarenta entre cien. Las otras sesenta forman el complemento: las que no cumplen a.',equation(String.raw`P(A)=0{,}4,\quad P(A^c)=0{,}6`))
    ]],
    ['Ambos no significa cualquiera',[
      beat('Si digo a y be a la vez, me quedo con las diez que llevan ambos. Eso es la intersección. Si digo a o be, incluyo las que llevan cualquiera de los dos, también las dobles.',note('Intersección','Ambos marcadores: 10')),
      beat('Para esa unión reunimos treinta, veinte y diez: sesenta. Otra manera es sumar cuarenta y treinta, pero entonces las diez dobles se cuentan dos veces. Las restamos una vez para corregirlo.',equation(String.raw`P(A\cup B)=0{,}4+0{,}3-0{,}1=0{,}6`)),
      beat('Antes de usar símbolos, intenta decir el grupo con palabras. ¿Pides ambos, al menos uno o ninguno? Esa frase es la que decide qué bacterias entran en la cuenta.',note('Pregunta clave','¿Qué resultados cumplen la condición?'))
    ]]
  ],
  axiomas:[
    ['Que las cuentas sean coherentes',[
      beat('Las reglas de probabilidad no añaden una colección de trucos: evitan que nuestras cuentas se contradigan. Una probabilidad no puede ser negativa y el conjunto de todos los resultados tiene probabilidad uno.',note('Escala de probabilidad','De 0 a 1; todos los resultados suman 1')),
      beat('Imagina tres estados excluyentes de un cultivo, con probabilidades cero coma dos, cero coma tres y cero coma cinco. Solo puede estar en uno. Reunir los dos primeros permite sumar sin corregir solapamientos.',equation(String.raw`0{,}2+0{,}3=0{,}5`)),
      beat('Si los grupos se solapan, ya no vale sumar a ciegas: contaríamos dos veces la zona común. La palabra excluyentes es una condición de la suma, no un adorno del enunciado.',note('Antes de sumar','Comprobar si los grupos se solapan'))
    ]],
    ['Aprovechar lo que queda fuera',[
      beat('A veces es más sencillo contar lo contrario de lo que nos piden. Si recuperar el cultivo tiene probabilidad cero coma ocho, no recuperarlo ocupa lo que falta hasta uno.',equation(String.raw`P(\text{no recuperar})=1-0{,}8=0{,}2`)),
      beat('Esta idea también funciona cuando reunimos muchos casos separados, incluso una lista sin último caso. Sumamos sus probabilidades sin perder resultados ni contarlos dos veces.',note('Misma regla','Casos separados → sumar probabilidades')),
      beat('Así que, si una cuenta da uno coma dos, no la recortes a uno. Es una señal de que has contado algo dos veces, usado otro total o planteado mal los grupos. Vuelve al significado antes de seguir.',note('Comprobación','Un valor fuera de [0,1] indica un error'))
    ]]
  ],
  combinatoria:[
    ['¿Importa quién va primero?',[
      beat('Tenemos cinco muestras y queremos elegir dos para analizarlas. Elegir la muestra a y después la be no crea una pareja distinta de elegir be y después a. Aquí el orden no importa.',note('Elección','2 muestras distintas de un total de 5')),
      beat('Si contáramos posiciones, tendríamos cinco opciones para la primera y cuatro para la segunda: veinte. Pero cada pareja aparece en dos órdenes. Dividimos entre dos y quedan diez parejas.',equation(String.raw`\binom52=\frac{5\cdot4}{2\cdot1}=10`)),
      beat('Ese símbolo se lee cinco sobre dos, o combinaciones de cinco tomadas de dos en dos. No es una división de cinco entre dos. El factorial abrevia productos: dos factorial es dos por uno.',note('Lectura','Combinaciones; 2! = 2 × 1'))
    ]],
    ['Cambiar el experimento cambia la cuenta',[
      beat('Ahora imagina que una muestra recibe un tratamiento y otra actúa como control. Intercambiarlas sí cambia el diseño. En ese caso mantenemos las veinte asignaciones ordenadas.',equation(String.raw`5\cdot4=20`)),
      beat('Si además devolviéramos la primera muestra antes de elegir la segunda, volvería a haber cinco opciones. Serían veinticinco selecciones ordenadas con repetición. No es el mismo experimento que antes.',equation(String.raw`5\cdot5=25`)),
      beat('Antes de buscar una fórmula, hazte estas dos preguntas: ¿importa el orden? ¿puede repetirse un elemento? Si puedes responderlas con el diseño biológico, la cuenta deja de ser un ejercicio de memoria.',note('Dos decisiones','Orden y repetición'))
    ]]
  ],
  condicionada:[
    ['La información cambia el grupo',[
      beat('Volvamos a las cien bacterias. Cuarenta llevan el marcador a y diez llevan a y be. Si elegimos entre todas, las dobles son diez de cien. Pero ahora nos dicen que la bacteria tiene a.',quantity('Grupo conocido: A',40,100)),
      beat('Esa información elimina las sesenta que no tienen a. Nuestra pregunta ya no vive en el grupo de cien, sino en el de cuarenta. Dentro de ese grupo, diez tienen también be.',quantity('Con B dentro de A',10,40)),
      beat('Diez entre cuarenta da un cuarto. Lo leemos probabilidad de be dado a. La barra significa dado que, no una independencia entre las letras.',equation(String.raw`P(B\mid A)=10/40=0{,}25`))
    ]],
    ['El denominador no se elige por costumbre',[
      beat('Podemos escribir la misma cuenta dividiendo la probabilidad de ambos entre la de la condición. La condición a es la que va en el denominador, porque define el nuevo grupo.',equation(String.raw`P(B\mid A)=\frac{P(A\cap B)}{P(A)}`)),
      beat('Si invierto la pregunta y digo a dado be, el denominador pasa a ser el grupo be. No hay motivo para obtener el mismo resultado. Preguntar por infectados entre positivos no es preguntar por positivos entre infectados.',note('Dos preguntas distintas','P(B dado A) no tiene por qué ser P(A dado B)')),
      beat('Y si el grupo conocido tiene probabilidad cero, este cociente no está definido. No lo resolvemos dividiendo entre cero: necesitaríamos otra forma de construir la condición.',note('Condición del cociente','P(A) debe ser positiva'))
    ]]
  ],
  'independencia-sucesos':[
    ['Saber una cosa, ¿cambia la otra?',[
      beat('Dos pruebas de germinación son independientes si conocer el resultado de una no cambia la probabilidad de la otra. No significa que nunca puedan germinar las dos a la vez.',note('Independencia','La información de A no cambia la probabilidad de B')),
      beat('Supón que a tiene probabilidad cero coma cuatro y be cero coma tres. Si son independientes, la probabilidad de ambas tiene que ser el producto: cero coma doce.',equation(String.raw`P(A)P(B)=0{,}4\cdot0{,}3=0{,}12`)),
      beat('Ahora compara eso con la probabilidad de ambas que dé el modelo. Si vale cero coma diez, ya no coincide: esos sucesos no son independientes. No basta con que las dos probabilidades se parezcan.',note('Comparación','0,10 no coincide con 0,12'))
    ]],
    ['Independiente no es incompatible',[
      beat('Podemos mirarlo condicionando. Si ambas valen cero coma diez, entre el grupo a la probabilidad de be es un cuarto, no cero coma tres. Conocer a sí ha cambiado la respuesta.',equation(String.raw`P(B\mid A)=0{,}10/0{,}40=0{,}25`)),
      beat('Incompatibles significa otra cosa: que no pueden ocurrir juntos. Si ambos tenían probabilidad positiva, saber que uno ha ocurrido descarta al otro; eso cambia mucho su probabilidad.',note('No confundir','Incompatibilidad: no pueden ocurrir juntos')),
      beat('En un experimento real no declares independencia porque las muestras estén en filas distintas de una tabla. Es un supuesto sobre cómo se obtienen los resultados, o una propiedad que debemos comprobar en el modelo.',note('Diseño experimental','Filas distintas no garantizan independencia'))
    ]]
  ],
  'bayes-diagnostico':[
    ['Sigamos a los animales, no solo a la fórmula',[
      beat('Un test detecta al noventa por ciento de los animales infectados. Si un animal da positivo, ¿tiene un noventa por ciento de probabilidad de estar infectado? Vamos a seguir los grupos para verlo.'),
      beat('Imagina mil animales: cien infectados y novecientos sanos. Entre los infectados esperamos noventa positivos. Entre los sanos, si el cinco por ciento da un falso positivo, esperamos cuarenta y cinco.',note('Positivos esperados','Infectados: 90 · sanos: 45')),
      beat('Los positivos forman ahora nuestro grupo de referencia: noventa más cuarenta y cinco, ciento treinta y cinco. De ellos, noventa están infectados. La respuesta es dos tercios, no noventa por ciento.',equation(String.raw`P(E\mid +)=\frac{90}{90+45}=\frac23`))
    ]],
    ['Qué está haciendo Bayes',[
      beat('Bayes invierte una pregunta usando esos caminos. La sensibilidad habla de positivos entre infectados; nosotros queríamos infectados entre positivos. El grupo que va abajo es distinto.',note('Inversión','De P(+ dado E) a P(E dado +)')),
      beat('La prevalencia nos dice qué parte estaba infectada antes del test. Si la infección es mucho más rara, habrá menos positivos verdaderos frente a los falsos positivos, aunque el test no haya cambiado.',equation(String.raw`P(E\mid+)=\frac{P(+\mid E)P(E)}{P(+)}`)),
      beat('No hace falta memorizar cuatro letras nuevas de golpe. Empieza por contar: cuántos positivos vienen del grupo infectado, cuántos del sano y qué parte del total corresponde al primero. La fórmula resume esas cuentas.',note('Ruta de cálculo','Positivos verdaderos / todos los positivos'))
    ]]
  ],
  'variable-cdf':[
    ['Una medida y sus resultados',[
      beat('Antes de medir, llamamos equis mayúscula a la cantidad que vamos a observar. Después puede salir un valor concreto, como cero, dos o cinco brotes. La letra no cambia: cambia la información que tenemos.',note('Valores posibles','0, 2 y 5 brotes')),
      beat('Supongamos probabilidades cero coma uno, cero coma seis y cero coma tres para esos tres valores. La acumulada pregunta cuánto llevamos reunido hasta un umbral, incluyéndolo.',note('Probabilidades','0: 0,1 · 2: 0,6 · 5: 0,3')),
      beat('Si el umbral es tres, entran cero y dos, pero no cinco. Sumamos sus probabilidades y obtenemos cero coma siete. Efe de tres se lee como la probabilidad de no superar tres.',equation(String.raw`F_X(3)=P(X\leq3)=0{,}7`))
    ]],
    ['Los saltos tienen una razón',[
      beat('Entre dos y cinco no hay ningún resultado nuevo que añadir. Por eso la acumulada se queda plana allí. Al llegar a cinco incorporamos su probabilidad y alcanzamos uno.',equation(String.raw`F_X(2)=0{,}7,\quad F_X(5)=1`)),
      beat('El salto en dos vale cero coma seis: justo la probabilidad de obtener dos. Pero la altura total en dos es cero coma siete, porque también arrastra lo que ya habíamos acumulado en cero.',note('No confundir','Salto: probabilidad del valor · altura: acumulado')),
      beat('Esta misma pregunta, no superar un umbral, sirve con tiempos continuos. Allí suele acumularse de forma suave, en vez de subir en escalones. La definición de acumulada sigue siendo la misma.',equation(String.raw`F_X(x)=P(X\leq x)`))
    ]]
  ],
  masa:[
    ['Del peso a la probabilidad',[
      beat('Nos dan tres estados posibles de una célula con pesos dos, tres y cinco. Esos pesos nos dicen qué estados son más frecuentes respecto a otros, pero todavía no suman uno.',note('Pesos','2, 3 y 5')),
      beat('El total es diez. Dividimos cada peso por diez y obtenemos cero coma dos, cero coma tres y cero coma cinco. Ahora sí tenemos una masa de probabilidad: una probabilidad para cada valor separado.',equation(String.raw`p=(0{,}2,\,0{,}3,\,0{,}5)`)),
      beat('Comprueba dos cosas antes de seguir: que ninguna sea negativa y que juntas sumen uno. Si falla alguna, la tabla no representa una distribución de probabilidad.',equation(String.raw`0{,}2+0{,}3+0{,}5=1`))
    ]],
    ['Reunir los valores que nos interesan',[
      beat('Si nos preguntan por cualquiera de los dos primeros estados, no necesitamos otra fórmula. Son dos resultados distintos: sumamos sus masas.',equation(String.raw`P(\text{estado 1 o 2})=0{,}2+0{,}3=0{,}5`)),
      beat('La acumulada hace eso mismo, pero eligiendo todos los valores hasta un umbral. La masa mira un valor exacto; la acumulada reúne varios. No sumamos los nombres o los números que etiquetan las categorías.',note('Dos preguntas','Valor exacto: masa · hasta un umbral: acumulada')),
      beat('Si ves un indicador en una expresión, solo está actuando como un interruptor: vale uno donde entra el estado y cero fuera. No añade probabilidad a valores que la tabla no permite.',note('Indicador','1 si se cumple la condición; 0 si no'))
    ]]
  ],
  densidad:[
    ['La altura no es una probabilidad',[
      beat('Piensa en un tiempo uniforme entre cero y dos minutos. Dibujamos un rectángulo de altura medio por minuto. La altura describe cómo se reparte la probabilidad; el área completa vale uno.',note('Densidad uniforme','Altura 0,5 · anchura 2')),
      beat('Para medio minuto de anchura, el área es medio por medio: un cuarto. Esa es una probabilidad. En cambio, preguntar por un instante exacto deja anchura cero y área cero.',equation(String.raw`P(0<T<0{,}5)=0{,}5\cdot0{,}5=0{,}25`)),
      beat('Que cada punto tenga probabilidad cero no impide que un intervalo tenga probabilidad positiva. En continuo acumulamos área: no estamos sumando una lista finita de puntos como hacíamos con una tabla.',note('En continuo','Probabilidad de intervalo = área'))
    ]],
    ['Una densidad puede superar uno',[
      beat('Hagamos el soporte más estrecho: de cero a medio minuto. Para mantener área uno, la altura tiene que subir a dos por minuto. No es una probabilidad de dos, sino una densidad.',equation(String.raw`2\cdot0{,}5=1`)),
      beat('En una franja de una décima de minuto, esa altura da probabilidad cero coma dos. El límite de uno se aplica al área de probabilidad, no a cada altura de la curva.',equation(String.raw`2\cdot0{,}1=0{,}2`)),
      beat('Si la curva ya no es plana, usamos una integral para acumularla. Y al restar dos valores de la acumulada obtenemos exactamente el área que queda entre esos dos límites.',equation(String.raw`P(a<X\leq b)=F_X(b)-F_X(a)`))
    ]]
  ],
  esperanza:[
    ['Un promedio antes de observar',[
      beat('Imagina que un recuento puede dar cero, uno o dos, con probabilidades un cuarto, una mitad y un cuarto. Si repitiéramos muchas veces el mismo mecanismo, ¿en torno a qué valor quedaría el promedio?',note('Tabla del modelo','0: 1/4 · 1: 1/2 · 2: 1/4')),
      beat('Multiplicamos cada resultado por su probabilidad. Cero aporta cero, uno aporta una mitad y dos aporta otra mitad. En total obtenemos uno. Eso es la esperanza del modelo.',equation(String.raw`E[X]=0\cdot\tfrac14+1\cdot\tfrac12+2\cdot\tfrac14=1`)),
      beat('No hemos dividido otra vez entre tres categorías. Los pesos ya sumaban uno. Y la esperanza no es una promesa sobre la siguiente observación: resume el promedio de muchas repeticiones bajo el mismo modelo.',note('Interpretación','Media del modelo, no predicción exacta del siguiente resultado'))
    ]],
    ['Primero transformar, después promediar',[
      beat('Ahora nos interesa el cuadrado del recuento. Los valores que promediamos pasan a ser cero, uno y cuatro, con las probabilidades anteriores. Fíjate: hemos transformado los resultados, no sus probabilidades.',note('Valores al cuadrado','0² = 0 · 1² = 1 · 2² = 4')),
      beat('La nueva esperanza es una mitad más uno: uno coma cinco. Elevar la media anterior al cuadrado daba uno. No son lo mismo: una transformación no lineal no se puede sacar del promedio sin más.',equation(String.raw`E[X^2]=1{,}5\ne(E[X])^2=1`)),
      beat('En continuo cambia la herramienta, no la idea: ponderamos cada valor por su densidad y acumulamos con una integral. También hay modelos cuyas colas no permiten una esperanza finita; no podemos darla por hecha.',equation(String.raw`E[X]=\int x f_X(x)\,dx`))
    ]]
  ],
  varianza:[
    ['Dos promedios iguales pueden esconder cosas distintas',[
      beat('Saber que la media de un recuento es uno no nos dice cuánto se dispersan sus resultados. Para medir esa dispersión miramos a qué distancia cae cada valor respecto a la media.',note('Punto de referencia','Media μ = 1')),
      beat('Con los valores cero, uno y dos, las distancias son menos uno, cero y uno. Si las sumáramos se cancelarían. Por eso las elevamos al cuadrado antes de promediarlas.',equation(String.raw`(0-1)^2=1,\quad(1-1)^2=0,\quad(2-1)^2=1`)),
      beat('Con probabilidades un cuarto, una mitad y un cuarto, el promedio de esas distancias cuadradas es una mitad. Esa es la varianza, en unidades al cuadrado.',equation(String.raw`\operatorname{Var}(X)=\tfrac14+0+\tfrac14=0{,}5`))
    ]],
    ['Volver a las unidades originales',[
      beat('Para expresar la dispersión en las mismas unidades que el recuento, tomamos la raíz de la varianza. Sale aproximadamente cero coma setenta y uno. A eso lo llamamos desviación típica.',equation(String.raw`\sigma=\sqrt{0{,}5}\approx0{,}707`)),
      beat('Otra forma de calcular la varianza es promediar primero los cuadrados y restar el cuadrado de la media. En este ejemplo, uno coma cinco menos uno vuelve a dar una mitad.',equation(String.raw`\operatorname{Var}(X)=E[X^2]-(E[X])^2`)),
      beat('Si multiplicas todas las medidas por dos, las distancias se duplican y sus cuadrados se multiplican por cuatro. La desviación se duplica, pero la varianza se cuadruplica. Por eso importa distinguirlas.',note('Cambio de escala','Var(2X) = 4 Var(X)'))
    ]]
  ],
  'momentos-transformaciones':[
    ['Resumir con potencias',[
      beat('La palabra momento puede sonar abstracta. Aquí significa algo bastante concreto: promediar una potencia de la variable. El primero es la media; el segundo ordinario promedia los cuadrados.',note('Momentos ordinarios','E[X], E[X²], E[X³]…')),
      beat('Si antes restamos la media, estamos midiendo potencias de las distancias al centro. El segundo momento central es la varianza. Ordinario y central no usan los mismos valores dentro de la potencia.',equation(String.raw`E[(X-\mu)^2]=\operatorname{Var}(X)`)),
      beat('Prueba con cero y dos, cada uno con probabilidad una mitad. La media es uno, pero el promedio de los cuadrados es dos. Esa diferencia es justo la que permite recuperar la varianza.',equation(String.raw`E[X]=1,\quad E[X^2]=2,\quad\operatorname{Var}(X)=1`))
    ]],
    ['Qué ocurre al cambiar la medida',[
      beat('Si nuestra nueva medida es el cuadrado de equis, preguntamos qué valores originales producen cada resultado nuevo. En una tabla agrupamos los que lleguen al mismo resultado y sumamos sus probabilidades.',note('Transformación','Y = X²: seguir qué entradas producen cada salida')),
      beat('En continuo podemos empezar por la acumulada. Si equis no es negativa, pedir equis al cuadrado menor o igual que i griega equivale a pedir equis menor o igual que su raíz. Así evitamos adivinar una densidad nueva.',equation(String.raw`P(X^2\leq y)=P(X\leq\sqrt y)\quad(X\geq0)`)),
      beat('Si la transformación tiene varios caminos hacia una misma salida, hay que contar todos. Y cuando usemos una inversa o su derivada, comprobaremos primero el tramo permitido. Esa es la razón de mirar siempre el soporte.',note('Antes de transformar','Comprobar soporte, monotonicidad y posibles caminos'))
    ]]
  ],
  'bernoulli-binomial':[
    ['De una semilla a un lote',[
      beat('Para una semilla codificamos germinar como uno y no germinar como cero. Llamamos pe a la probabilidad de germinar. Esa variable de dos valores sigue una Bernoulli.',note('Un ensayo','1: germina · 0: no germina')),
      beat('Ahora sembramos tres semillas independientes, con probabilidad una mitad para cada una. Si queremos exactamente dos germinaciones, hay tres posiciones posibles para la semilla que no germina.',note('Tres patrones','110, 101 y 011')),
      beat('Cada patrón tiene probabilidad un octavo. Los tres patrones son distintos, así que los reunimos sumando: tres octavos. La binomial generaliza esta cuenta a un número fijo de ensayos.',equation(String.raw`P(X=2)=3(1/2)^3=3/8`))
    ]],
    ['Cuándo sirve este modelo',[
      beat('En la fórmula, ene cuenta semillas, ka las germinadas y pe la probabilidad por semilla. La combinación cuenta posiciones; las potencias ponderan lo que ocurre en cada posición.',equation(String.raw`P(X=k)=\binom nk p^k(1-p)^{n-k}`)),
      beat('El número esperado de germinaciones es ene por pe. Con tres semillas y una mitad sale uno coma cinco. No esperamos media semilla en una placa: es el promedio del modelo entre muchas placas.',equation(String.raw`E[X]=np=1{,}5,\quad\operatorname{Var}(X)=np(1-p)=0{,}75`)),
      beat('La parte importante está en los supuestos. Necesitamos el número de ensayos fijado, la misma probabilidad y la independencia. Si una semilla modifica el entorno de otra, no basta con llamarlas ensayos para que sean independientes.',note('Comprobar el diseño','n fijo · p constante · independencia'))
    ]]
  ],
  poisson:[
    ['Contamos llegadas durante un tiempo',[
      beat('Un sensor recibe, por término medio, dos llegadas de bacterias por minuto. Vamos a observarlo tres minutos. La media para esa ventana no es dos, sino dos por tres: seis llegadas.',note('Exposición','2 llegadas/min × 3 min = 6 llegadas esperadas')),
      beat('Llamamos lambda a esa media de la ventana. Lambda no es una probabilidad. Puede ser seis, veinte o cualquier valor positivo, dependiendo de la exposición.',equation(String.raw`\lambda=6`)),
      beat('Para obtener la probabilidad de un recuento concreto, usamos la masa Poisson. Por ejemplo, ninguna llegada tiene probabilidad e elevado a menos seis, unas dos coma cinco milésimas. Una calculadora evalúa la exponencial.',equation(String.raw`P(X=0)=e^{-6}\approx0{,}00248`))
    ]],
    ['La ventana y los supuestos importan',[
      beat('Para otros recuentos aparece lambda elevado a ka y ka factorial. El factorial multiplica los enteros desde uno hasta ka; por convenio, cero factorial vale uno.',equation(String.raw`P(X=k)=e^{-\lambda}\lambda^k/k!`)),
      beat('Si preguntan por más de dos llegadas, suele ser cómodo reunir cero, una y dos y restarlo de uno. El dos se queda en el complemento, porque más de dos empieza en tres.',equation(String.raw`P(X>2)=1-P(X\leq2)`)),
      beat('El modelo supone una tasa estable y recuentos independientes en intervalos separados. Si las bacterias llegan en grupos o la tasa cambia con el tiempo, esa historia ya no encaja automáticamente. En Poisson, media y varianza coinciden.',note('Propiedad del modelo','E[X] = Var(X) = λ'))
    ]]
  ],
  hipergeometrica:[
    ['La colección se va agotando',[
      beat('Tenemos ocho organismos, tres portadores de una variante. Elegimos cuatro sin devolver ninguno. Esta vez las probabilidades cambian después de cada elección: la colección que queda ya es otra.',note('Diseño','N = 8 · portadores K = 3 · muestra n = 4')),
      beat('Queremos exactamente dos portadores. Podemos elegir dos de los tres portadores de tres maneras. Para completar la muestra elegimos dos de los cinco no portadores de diez maneras.',equation(String.raw`\binom32=3,\quad\binom52=10`)),
      beat('Cada elección del primer grupo puede combinarse con cada elección del segundo. Son treinta muestras favorables. En total hay setenta maneras de elegir cuatro de ocho. Dividir da tres séptimos, aproximadamente cero coma cuarenta y tres.',equation(String.raw`P(X=2)=\frac{3\cdot10}{\binom84}=\frac{30}{70}`))
    ]],
    ['No es una binomial por defecto',[
      beat('La fórmula hipergeométrica conserva esa idea: elegir portadores, elegir no portadores y dividir entre todas las muestras posibles. Se usa cuando las muestras del tamaño indicado son equiprobables.',equation(String.raw`P(X=k)=\frac{\binom Kk\binom{N-K}{n-k}}{\binom Nn}`)),
      beat('No podemos obtener más de tres portadores porque solo hay tres en la colección. Tampoco cualquier valor de ka es posible en cualquier diseño: el soporte sale de las existencias y del tamaño de la muestra.',note('Soporte en este ejemplo','X puede valer 0, 1, 2 o 3')),
      beat('La binomial puede aproximar algunos muestreos cuando retiramos una parte muy pequeña de una colección grande. Pero aquí extraemos la mitad: ignorar el agotamiento cambiaría el modelo de forma importante.',note('Pregunta para elegir modelo','¿Se devuelve lo que se extrae?'))
    ]]
  ],
  'geometrica-negativa':[
    ['Seguimos buscando hasta encontrar',[
      beat('Probamos colonias hasta encontrar la primera que expresa un marcador. Cada prueba tiene probabilidad una mitad de éxito y suponemos independencia. Ahora el número de pruebas no está fijado de antemano.',note('Regla de parada','Detenerse en el primer éxito')),
      beat('Para que el primer éxito llegue en la tercera prueba, las dos primeras deben fallar y la tercera acertar. Solo hay ese orden. Multiplicamos tres mitades y obtenemos un octavo.',equation(String.raw`P(T=3)=(1/2)^2(1/2)=1/8`)),
      beat('Aquí te cuenta todas las pruebas, incluida la del éxito. Si contáramos fallos, el mismo resultado sería dos. Esta diferencia de una unidad es una de las confusiones más frecuentes de la geométrica.',note('Dos recuentos','Ensayos T = fallos + 1'))
    ]],
    ['Esperar varios éxitos',[
      beat('Podemos seguir hasta el segundo éxito, o hasta el tercero. La binomial negativa cuenta los fallos anteriores al éxito número erre. El último ensayo es necesariamente un éxito.',note('Binomial negativa','F: fallos antes de r éxitos')),
      beat('Para tener un fallo antes del segundo éxito, hay tres ensayos en total. El fallo puede estar en una de las dos primeras posiciones; el último éxito está fijado. Dos patrones por un octavo dan un cuarto.',equation(String.raw`P(F=1)=2(1/2)^3=1/4`)),
      beat('Con pe igual a una mitad, cada tramo hasta un éxito aporta un fallo esperado. Hasta dos éxitos esperamos dos fallos, pero cuatro ensayos en total. Antes de aplicar una fórmula o usar software, decide cuál de esas dos cantidades te piden.',equation(String.raw`E[F]=r(1-p)/p=2,\quad E[T]=E[F]+r=4`))
    ]]
  ],
  'uniforme-montecarlo':[
    ['Igual longitud, igual probabilidad',[
      beat('Elegimos al azar un instante entre dos y seis minutos, sin preferencia por ninguna zona. El intervalo total mide cuatro minutos. Un tramo de dos minutos ocupa la mitad de la ventana.',note('Ventana','De 2 a 6 minutos')),
      beat('Por ejemplo, entre tres y cinco la probabilidad es dos entre cuatro: una mitad. Dividimos longitudes dentro del soporte. Si un tramo sale de la ventana, no contamos la parte exterior.',equation(String.raw`P(3<X<5)=\frac{5-3}{6-2}=1/2`)),
      beat('La media queda en el centro, cuatro. Y el cuantil del setenta y cinco por ciento está a tres cuartos del recorrido: dos más tres, cinco. Un cuantil busca un umbral a partir de un área.',equation(String.raw`E[X]=4,\quad Q(0{,}75)=2+0{,}75(6-2)=5`))
    ]],
    ['Usar el azar para aproximar',[
      beat('En Monte Carlo repetimos elecciones aleatorias para aproximar una cantidad. Si contamos qué fracción cae entre tres y cinco, esperamos que se acerque a una mitad al aumentar las repeticiones.',note('Estimación','Número dentro / número de repeticiones')),
      beat('No exigimos que cada lote dé exactamente una mitad. El error aleatorio forma parte del método. Más repeticiones suelen mejorar la precisión, pero no corrigen un modelo ni un intervalo mal planteados.',note('Más simulaciones','Reducen variabilidad; no arreglan un planteamiento incorrecto')),
      beat('Y no mezcles uniforme continua con elegir un entero de una lista. En continuo cada punto tiene probabilidad cero; en una lista finita, cada entero permitido puede tener una masa positiva.',note('Dos mecanismos','Instantes continuos frente a valores discretos'))
    ]]
  ],
  exponencial:[
    ['Del número de llegadas al tiempo de espera',[
      beat('Antes contábamos llegadas. Ahora preguntamos cuánto tardará la siguiente. Si la espera media es de cinco minutos, la tasa es una quinta parte por minuto: cero coma dos.',note('Escala y tasa','Media 5 min · tasa 0,2 por min')),
      beat('La supervivencia responde a seguir esperando más allá de un tiempo. No tiene por qué hablar de muerte. Después de cinco minutos, la probabilidad de que todavía no haya llegado nada es e elevado a menos uno.',equation(String.raw`P(T>5)=e^{-0{,}2\cdot5}\approx0{,}368`)),
      beat('En el exponente multiplicamos una tasa por un tiempo. Las unidades se cancelan. La escala y la tasa no son el mismo parámetro: una es la inversa de la otra.',equation(String.raw`\text{tasa}=1/\text{escala}`))
    ]],
    ['Qué significa no tener memoria',[
      beat('Supón que ya llevamos tres minutos esperando. Bajo este modelo, la probabilidad de esperar dos minutos más es la misma que al empezar una espera nueva de dos minutos. Esa es la falta de memoria.',equation(String.raw`P(T>5\mid T>3)=P(T>2)`)),
      beat('Podemos verlo dividiendo las supervivencias. Los tres minutos transcurridos se cancelan y solo quedan los dos adicionales. No estamos diciendo que cualquier sistema biológico olvide su edad.',equation(String.raw`e^{-0{,}2\cdot5}/e^{-0{,}2\cdot3}=e^{-0{,}2\cdot2}`)),
      beat('La propiedad depende de un riesgo constante. Si el mecanismo envejece o se acumula daño, otra distribución puede ser más razonable. En una exponencial, la desviación típica coincide con la media.',note('Comprobar el mecanismo','Riesgo constante; no cualquier tiempo de espera'))
    ]]
  ],
  normal:[
    ['Hablar en desviaciones',[
      beat('Imagina longitudes celulares centradas en cuarenta micrómetros, con desviación típica cuatro. Usaremos una normal como aproximación en el rango que nos interesa, no como una ley de toda medida biológica.',note('Modelo','Media μ = 40 μm · desviación σ = 4 μm')),
      beat('Una longitud de cuarenta y ocho está ocho unidades por encima del centro. Al dividir entre cuatro, vemos que está a dos desviaciones. A esa traducción la llamamos tipificar.',equation(String.raw`z=(48-40)/4=2`)),
      beat('La normal estándar tiene media cero y desviación uno. Su acumulada, fi, devuelve el área a la izquierda de un valor zeta. No devuelve la altura de la campana.',note('Φ(z)','Área a la izquierda en la normal estándar'))
    ]],
    ['Pedir un intervalo o un percentil',[
      beat('Entre treinta y seis y cuarenta y ocho pasamos de menos una desviación a más dos. El área del intervalo es fi de dos menos fi de menos uno, aproximadamente cero coma ochenta y dos.',equation(String.raw`P(36<X<48)=\Phi(2)-\Phi(-1)\approx0{,}8186`)),
      beat('Si la pregunta se invierte y nos piden el percentil noventa y cinco, buscamos primero el zeta que deja noventa y cinco por ciento a su izquierda. Es aproximadamente uno coma sesenta y cuatro.',note('Cuantil estándar','Φ⁻¹(0,95) ≈ 1,64485')),
      beat('Después volvemos a micrómetros: multiplicamos por la desviación cuatro y sumamos el centro cuarenta. Sale aproximadamente cuarenta y seis coma cincuenta y ocho. En el software, comprueba si te pide desviación o varianza: aquí no son intercambiables.',equation(String.raw`q_{0{,}95}=40+4(1{,}64485)\approx46{,}58`))
    ]]
  ],
  gamma:[
    ['Esperar varias etapas',[
      beat('Pensemos en una detección que requiere tres llegadas. Cada espera es exponencial, independiente, con tiempo medio de dos minutos. Para completar las tres etapas tenemos que sumar sus esperas.',note('Etapas','3 esperas independientes · escala 2 min')),
      beat('Esa suma sigue una gamma. Usaremos ka para la forma y alfa para la escala. En este ejemplo, ka vale tres y alfa dos. La tasa correspondiente es una mitad por minuto, no dos.',equation(String.raw`T\sim\Gamma(k=3,\alpha=2),\quad r=1/\alpha=0{,}5`)),
      beat('Como cada etapa dura dos minutos de media, las tres juntas duran seis de media. La varianza es tres por dos al cuadrado: doce minutos al cuadrado. Una etapa sola recuperaría la exponencial.',equation(String.raw`E[T]=k\alpha=6,\quad\operatorname{Var}(T)=k\alpha^2=12`))
    ]],
    ['Probabilidad de completar las etapas',[
      beat('Si queremos terminar antes de un tiempo dado, acumulamos el área de la densidad hasta ese tiempo. No basta con leer la altura de la curva en el punto final.',note('Pregunta','P(T ≤ t): área desde 0 hasta t')),
      beat('La acumulada gamma realiza esa integración. En una calculadora hay que indicar la forma y comprobar si el otro parámetro es escala o tasa. Confundirlos daría otro modelo aunque el nombre gamma fuese correcto.',note('Antes de calcular','Forma k; escala α; tasa 1/α')),
      beat('En la fórmula de densidad aparece también una función llamada gamma, con letra mayúscula. No es una nueva variable aleatoria. Para forma tres vale dos factorial, es decir, dos; ayuda a que el área total sea uno.',equation(String.raw`\Gamma(3)=(3-1)!=2`))
    ]]
  ],
  'cauchy-weibull':[
    ['La simetría no garantiza una media',[
      beat('Una curva simétrica nos invita a llamar media a su centro. Con Cauchy, esa intuición falla: sus colas son tan pesadas que la esperanza y la varianza no están definidas. El centro sí es una mediana.',note('Cauchy','Mediana definida; esperanza y varianza no definidas')),
      beat('Los parámetros son la localización, equis sub cero, y la escala, gamma minúscula. Podemos calcular probabilidades de intervalos con la acumulada, aunque no podamos dar una media.',equation(String.raw`F(x)=\tfrac12+\tfrac1\pi\arctan((x-x_0)/\gamma)`)),
      beat('Arco tangente es la función inversa de la tangente, y pi es la constante aproximadamente tres coma catorce. Una calculadora la evalúa. Lo importante aquí es no cancelar colas divergentes para inventar una esperanza cero.',note('Precaución','Simetría no equivale a esperanza existente'))
    ]],
    ['Un modelo distinto para tiempos',[
      beat('Pasemos a Weibull, que describe tiempos no negativos. Alfa marca la escala y beta cambia la forma. A diferencia de la exponencial, el riesgo puede crecer o disminuir con el tiempo.',note('Weibull','Escala α; forma β; tiempos no negativos')),
      beat('Con escala dos y forma dos, sobrevivir más de dos unidades de tiempo tiene probabilidad e elevado a menos uno, unas cero coma treinta y siete. Primero dividimos por la escala, después elevamos a la forma y finalmente aplicamos la exponencial.',equation(String.raw`S(2)=e^{-(2/2)^2}=e^{-1}`)),
      beat('Si beta vale uno recuperamos la exponencial, con riesgo constante. Por eso no elegimos solo una curva que se parezca al dibujo: pensamos qué evolución del riesgo tiene sentido para el mecanismo.',equation(String.raw`S(t)=e^{-(t/\alpha)^\beta}`))
    ]]
  ],
  'calculo-modelos':[
    ['Primero traducimos la pregunta',[
      beat('Antes de abrir una calculadora, di qué necesitas: una probabilidad de valor exacto, una probabilidad hasta un umbral o el umbral que corresponde a un porcentaje. Son tres preguntas diferentes.',note('Tres operaciones','Masa · acumulada · cuantil')),
      beat('En un recuento, pe de equis igual a dos se obtiene con una masa. Para no superar dos, la acumulada reúne cero, uno y dos. La letra efe mayúscula suele representar esa acumulada.',equation(String.raw`P(X\leq2)=P(X=0)+P(X=1)+P(X=2)`)),
      beat('En continuo, la función de densidad da una altura, no la probabilidad de un valor exacto. Para un intervalo usamos la diferencia de acumuladas. Así evitamos interpretar una salida numérica correcta como respuesta a otra pregunta.',equation(String.raw`P(a<X<b)=F(b)-F(a)`))
    ]],
    ['Comprobar límites y parámetros',[
      beat('Más de dos en un recuento empieza en tres. Su complemento incluye el dos. En cambio, al menos dos incluye el dos y el complemento termina en uno. Dibujar esos enteros evita muchos errores.',equation(String.raw`P(X>2)=1-F(2),\quad P(X\geq2)=1-F(1)`)),
      beat('Después revisamos los parámetros. Una normal puede escribirse con varianza, pero una función de cálculo puede pedir desviación. Una gamma puede pedir escala o su inversa, la tasa. Copiar números sin traducirlos no es suficiente.',note('Parámetros','Desviación ≠ varianza; escala ≠ tasa')),
      beat('Por último, vuelve al contexto. Una probabilidad debe estar entre cero y uno; un cuantil de tiempo debe estar en las unidades de tiempo. Si no encaja, no culpes primero al software: revisa qué le has pedido.',note('Cierre','Interpretar y comprobar unidades y soporte'))
    ]]
  ],
  'familia-exponencial':[
    ['Los datos se quedan quietos',[
      beat('Hemos observado dos, cuatro y tres colonias en tres placas con igual exposición. Ahora queremos comparar qué media Poisson podría explicar esos datos. Los recuentos se quedan fijos; lo que variamos es la media candidata.',note('Datos observados','2, 4 y 3; suma 9; media 3')),
      beat('La verosimilitud compara esas candidatas mediante el producto de las probabilidades de los datos. No es una distribución de probabilidades para la media desconocida y sus alturas no tienen que sumar uno.',equation(String.raw`L(\lambda)=e^{-3\lambda}\lambda^9/(2!4!3!)`)),
      beat('El logaritmo convierte el producto en una suma y facilita localizar el máximo. Aquí la mejor candidata es tres, la media observada. Maximizar no demuestra que las placas sean independientes ni que el modelo Poisson sea adecuado.',equation(String.raw`\ell'(\lambda)=9/\lambda-3=0\quad\Rightarrow\quad\hat\lambda=3`))
    ]],
    ['Una familia, no solo una distribución',[
      beat('Familia exponencial nombra una forma de organizar modelos, no la distribución exponencial de esperas. Separamos lo que depende de los datos, el resumen de esos datos y una manera de escribir el parámetro.',note('Poisson en esta familia','T(x)=x; parámetro natural η=log λ')),
      beat('El término de normalización ajusta el total a uno. Las letras hache, te, eta y a nombran esas piezas; no son cuatro mediciones nuevas. En Poisson, el parámetro natural es el logaritmo de lambda.',equation(String.raw`p(x)=h(x)\exp\{\eta T(x)-A(\eta)\}`)),
      beat('Esto conecta con los modelos lineales generalizados. Por ejemplo, podemos relacionar una dosis con el logaritmo de la media. Al volver con la exponencial, la media siempre es positiva. Elegir ese enlace no sustituye la comprobación del modelo.',equation(String.raw`\log\mu=\beta_0+\beta_1d\quad\Rightarrow\quad\mu=e^{\beta_0+\beta_1d}`))
    ]]
  ],
  'conjunta-discreta':[
    ['Dos medidas del mismo organismo',[
      beat('Ahora observamos dos características a la vez. Equis indica un marcador e i griega una respuesta. Cada organismo ocupa una celda de una tabla según la pareja que hayamos observado.',note('Tabla conjunta','Filas: X; columnas: Y')),
      beat('Tomemos las masas cero coma dos y cero coma tres en la primera fila, y cero coma uno y cero coma cuatro en la segunda. Las cuatro celdas suman uno: describen todas las parejas posibles.',note('Masas por filas','X=0: (0,2; 0,3) · X=1: (0,1; 0,4)')),
      beat('La celda equis uno, i griega uno vale cero coma cuatro. La coma dentro de pe significa que pedimos las dos condiciones a la vez. No sumamos esa celda con todas las que cumplen solo una de ellas.',equation(String.raw`P(X=1,Y=1)=0{,}4`))
    ]],
    ['Pasar de una celda a una región',[
      beat('Si nos piden equis cero e i griega como máximo uno, entran las dos celdas de la primera fila. Reunimos cero coma dos y cero coma tres: una mitad.',equation(String.raw`P(X=0,Y\leq1)=0{,}2+0{,}3=0{,}5`)),
      beat('La acumulada conjunta reúne las celdas a la izquierda y por debajo de dos umbrales, incluyendo los límites. Antes de sumar, señala exactamente cuáles entran.',equation(String.raw`F_{X,Y}(x,y)=P(X\leq x,Y\leq y)`)),
      beat('La idea de soporte sigue siendo importante: una celda imposible vale cero, aunque el dibujo rectangular tenga un hueco para ella. La forma de la tabla no convierte todas las parejas en posibles.',note('Primero seleccionar','Identificar las celdas permitidas y las solicitadas'))
    ]]
  ],
  multinomial:[
    ['Más de dos categorías, un total fijo',[
      beat('Clasificamos tres células como en reposo, activadas o dañadas. Cada célula entra en una sola categoría. Supongamos probabilidades una mitad, un cuarto y un cuarto, iguales para las tres células e independientes entre células.',note('Probabilidades','Reposo 1/2 · activada 1/4 · dañada 1/4')),
      beat('Queremos una de cada categoría. Un orden concreto tiene probabilidad una mitad por un cuarto por un cuarto. Hay seis órdenes posibles para colocar las tres categorías.',equation(String.raw`3!/(1!1!1!)=6`)),
      beat('Multiplicamos seis por la probabilidad de un orden y obtenemos tres dieciseisavos. El factorial cuenta posiciones; no añade un ensayo nuevo.',equation(String.raw`P(1,1,1)=6(1/2)(1/4)(1/4)=3/16`))
    ]],
    ['Los recuentos comparten el total',[
      beat('Los tres recuentos tienen que sumar tres. Si hay más células activadas, quedan menos plazas para las otras categorías. La independencia entre células no implica independencia entre estos recuentos.',equation(String.raw`R+A+D=3`)),
      beat('Si solo contamos activadas, podemos reunir reposo y daño como no activada. Recuperamos una binomial con tres ensayos y probabilidad un cuarto. Esa es una marginal del modelo multinomial.',equation(String.raw`A\sim\operatorname{Bin}(3,1/4)`)),
      beat('La covarianza entre dos recuentos distintos es negativa por ese total compartido. Aquí, entre reposo y activadas, vale menos tres octavos. Es una propiedad del diseño de conteo, no una evidencia de que una célula cause el estado de otra.',equation(String.raw`\operatorname{Cov}(R,A)=-3(1/2)(1/4)=-3/8`))
    ]]
  ],
  marginales:[
    ['Mirar solo una de las medidas',[
      beat('Tenemos una tabla conjunta con filas cero coma dos, cero coma tres, y cero coma uno, cero coma cuatro. Pero ahora solo nos preguntan por i griega. No conocemos equis ni la estamos fijando.',note('Tabla conjunta','X=0: (0,2; 0,3) · X=1: (0,1; 0,4)')),
      beat('Para i griega igual a uno reunimos la segunda columna: cero coma tres más cero coma cuatro. Da cero coma siete. Eso es una marginal: hemos dejado de distinguir los valores de la otra medida.',equation(String.raw`P(Y=1)=0{,}3+0{,}4=0{,}7`)),
      beat('No dividimos por una fila. Eso sería responder a una condición conocida, que es otra pregunta. Marginalizar significa reunir todos los valores de la variable que dejamos de mirar.',note('Marginalizar','Sumar sobre la otra variable'))
    ]],
    ['Hacer lo mismo con una densidad',[
      beat('En continuo sustituimos la suma por una integral. Imagina una densidad conjunta constante de una mitad sobre el triángulo equis más i griega como máximo dos, con ambas no negativas.',note('Soporte','x ≥ 0; y ≥ 0; x+y ≤ 2; densidad 0,5')),
      beat('Para cada equis, la altura del corte permitido para i griega es dos menos equis. Integrar una mitad a lo largo de ese corte da dos menos equis dividido entre dos.',equation(String.raw`f_X(x)=\int_0^{2-x}0{,}5\,dy=(2-x)/2`)),
      beat('La marginal disminuye: cuando equis crece queda menos espacio para la otra medida. Una conjunta constante sobre un triángulo no produce una marginal uniforme. El soporte también influye en la forma de la distribución.',note('Interpretación','Menos longitud de corte → menos densidad marginal'))
    ]]
  ],
  'conjunta-condicional':[
    ['Dentro de una fila',[
      beat('De la tabla conjunta nos dicen que equis vale uno. Su fila contiene masas cero coma uno y cero coma cuatro. Olvidamos por ahora la otra fila: esta es toda la población compatible con la información.',note('Fila X=1','Y=0: 0,1 · Y=1: 0,4; total 0,5')),
      beat('¿Qué parte de esa fila corresponde a i griega uno? Dividimos cero coma cuatro entre la suma de la fila, cero coma cinco. Sale cero coma ocho.',equation(String.raw`P(Y=1\mid X=1)=0{,}4/0{,}5=0{,}8`)),
      beat('La otra probabilidad condicional es cero coma dos. Las dos suman uno dentro del grupo conocido. Esa renormalización es la misma idea que usamos al condicionar sucesos.',equation(String.raw`P(Y=0\mid X=1)=0{,}1/0{,}5=0{,}2`))
    ]],
    ['Un corte continuo también se normaliza',[
      beat('En el triángulo de capacidad dos, si fijamos equis en cero coma cinco, i griega puede recorrer de cero a uno coma cinco. El corte tiene que transformarse en una densidad de área uno.',note('Corte','X=0,5; 0 ≤ Y ≤ 1,5')),
      beat('La conjunta vale una mitad y la marginal de equis en ese punto vale tres cuartos. Dividimos ambas densidades y obtenemos dos tercios, constante a lo largo del corte.',equation(String.raw`f_{Y\mid X}(y\mid0{,}5)=\frac{0{,}5}{0{,}75}=2/3`)),
      beat('Compruébalo: dos tercios por uno coma cinco da uno. No hemos dividido por la probabilidad de equis igual a un punto, que en este modelo es cero. El cociente continuo se construye con densidades.',equation(String.raw`(2/3)\cdot1{,}5=1`))
    ]]
  ],
  'normal-bivariante':[
    ['Conocer una señal ayuda con la otra',[
      beat('Dos señales tienen medias doce y treinta, desviaciones dos y cuatro y correlación cero coma seis. Vamos a suponer normalidad conjunta. Que cada señal por separado parezca normal no basta para justificar ese supuesto.',note('Modelo conjunto','μX=12; μY=30; σX=2; σY=4; ρ=0,6')),
      beat('Observamos equis igual a catorce: está una desviación por encima de su media. Con correlación positiva, esperamos que la otra señal también se desplace hacia arriba. Su media condicional pasa a treinta y dos coma cuatro.',equation(String.raw`E[Y\mid X=14]=30+0{,}6(4/2)(14-12)=32{,}4`)),
      beat('La información reduce la varianza de dieciséis a diez coma veinticuatro. Para obtener la desviación tomamos la raíz: tres coma dos. No usamos la varianza como si fuera una desviación.',equation(String.raw`\operatorname{Var}(Y\mid X)=16(1-0{,}6^2)=10{,}24`))
    ]],
    ['Calcular con la curva condicionada',[
      beat('Queremos que i griega supere treinta y cinco coma seis después de conocer equis. Ahora tipificamos con la media treinta y dos coma cuatro y la desviación tres coma dos, no con las marginales.',equation(String.raw`z=(35{,}6-32{,}4)/3{,}2=1`)),
      beat('La cola a la derecha de una desviación en la normal estándar vale aproximadamente cero coma dieciséis. Es la probabilidad condicionada que nos pedían.',equation(String.raw`P(Y>35{,}6\mid X=14)=1-\Phi(1)\approx0{,}1587`)),
      beat('Si observáramos otro valor de equis, cambiaría la media condicional, pero no esta varianza condicional del modelo. Y no hemos demostrado causalidad: estamos usando información de una señal para actualizar la distribución de la otra.',note('Interpretación','Condicionar cambia la distribución; no demuestra una causa'))
    ]]
  ],
  'independencia-variables':[
    ['Una tabla que se puede separar',[
      beat('Con dos variables, independencia significa que conocer una no cambia la distribución de la otra. Para comprobarla en una tabla, cada celda debe coincidir con el producto de sus dos marginales.',note('Criterio','Conjunta = marginal de X × marginal de Y')),
      beat('Mira una tabla con dos filas iguales: cero coma dos y cero coma tres. Las filas suman una mitad cada una; las columnas, cero coma cuatro y cero coma seis. La primera celda coincide con una mitad por cero coma cuatro.',equation(String.raw`0{,}2=0{,}5\cdot0{,}4`)),
      beat('Hay que comprobar también las otras celdas. Aquí coinciden todas. Una sola coincidencia no demostraría independencia; en cambio, una discrepancia sí bastaría para descartarla.',note('Comprobar','Todas las celdas, no una sola'))
    ]],
    ['El soporte también cuenta',[
      beat('En continuo buscamos la misma separación entre densidades, dentro de todo el soporte. Si los consumos comparten un máximo total, conocer uno limita lo que puede tomar el otro.',note('Ejemplo dependiente','X + Y ≤ 2 limita las parejas posibles')),
      beat('Una densidad constante dentro de un triángulo no basta para declarar independencia: el triángulo no permite combinar libremente los valores marginales. No podemos ignorar la zona exterior donde la conjunta vale cero.',equation(String.raw`f_{X,Y}(x,y)=f_X(x)f_Y(y)\quad\text{en todo el soporte}`)),
      beat('Cuando sí hay independencia, ciertas esperanzas de productos se separan. Pero comprobar solo la covarianza cero no demuestra que se cumpla toda esa separación. Lo veremos con un ejemplo no lineal.',equation(String.raw`E[g(X)h(Y)]=E[g(X)]E[h(Y)]`))
    ]]
  ],
  'covarianza-matrices':[
    ['¿Se apartan juntas de sus medias?',[
      beat('La covarianza mira si dos medidas se apartan juntas de sus medias. Si las desviaciones suelen tener el mismo signo, sus productos son positivos. Si suelen ir en sentidos contrarios, son negativos.',note('Idea','Promediar productos de desviaciones')),
      beat('Imagina dos parejas equiprobables: cero con uno, y uno con tres. La media de equis es una mitad y la de i griega dos. El promedio del producto es uno coma cinco.',note('Dos parejas','(0,1) y (1,3), cada una con probabilidad 1/2')),
      beat('Restamos el producto de las medias: uno coma cinco menos una mitad por dos. La covarianza es una mitad. Es positiva, pero todavía lleva unidades de ambas medidas.',equation(String.raw`\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]=0{,}5`))
    ]],
    ['Organizar y comparar',[
      beat('La correlación divide la covarianza por las dos desviaciones. Así queda sin unidades, entre menos uno y uno, siempre que las dos desviaciones sean positivas. En nuestro ejemplo las parejas están exactamente en una recta y la correlación es uno.',equation(String.raw`\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}`)),
      beat('Si reunimos muchas medidas, ponemos sus varianzas en la diagonal de una matriz y sus covarianzas fuera. En este ejemplo las varianzas son un cuarto y uno, y las entradas cruzadas una mitad.',equation(String.raw`\Sigma=\begin{pmatrix}1/4&1/2\\1/2&1\end{pmatrix}`)),
      beat('Cada entrada cruzada se convierte en correlación dividiendo por las dos desviaciones correspondientes. La matriz es simétrica. Y ni una covarianza ni una correlación, por altas que sean, nos autorizan a afirmar una causa.',note('Lectura de la matriz','Diagonal: varianzas · fuera: covarianzas'))
    ]]
  ],
  'combinaciones-incorrelacion':[
    ['Sumar y restar medidas',[
      beat('Queremos combinar dos lecturas, por ejemplo dos veces equis menos i griega. Para la media podemos combinar sus medias con los mismos coeficientes. No necesitamos independencia para dar ese paso.',equation(String.raw`E[2X-Y]=2E[X]-E[Y]`)),
      beat('Si sus medias son diez y tres, la media combinada es diecisiete. Con las varianzas hay que ir con más cuidado: los coeficientes se elevan al cuadrado y aparece la covarianza.',equation(String.raw`2\cdot10-3=17`)),
      beat('Con varianzas cuatro y uno, y covarianza una mitad, obtenemos dieciséis más uno menos dos: quince. El signo menos afecta al término cruzado, pero no convierte la varianza de i griega en negativa.',equation(String.raw`\operatorname{Var}(2X-Y)=4(4)+1-4(0{,}5)=15`))
    ]],
    ['Covarianza cero no significa independencia',[
      beat('Para ver la diferencia, toma equis con valores menos uno, cero y uno, equiprobables, y define i griega como su cuadrado. Si sabes equis, conoces exactamente i griega: hay dependencia.',note('Relación determinista','Y = X²')),
      beat('Sin embargo, la covarianza es cero. Los productos de las desviaciones se compensan por la simetría. La covarianza detecta asociación lineal, no cualquier relación posible.',equation(String.raw`E[X]=E[X^3]=0\quad\Rightarrow\quad\operatorname{Cov}(X,X^2)=0`)),
      beat('La independencia sí implica covarianza cero cuando los momentos necesarios existen, pero no al revés. La normalidad conjunta es un caso especial donde covarianza cero permite concluir independencia. Fuera de ese caso, necesitamos más información.',note('Conclusión','Incorrelación ≠ independencia en general'))
    ]]
  ]
};

export function lessonStory(lesson) {
  const scenes = STORIES[lesson.id];
  if (!scenes) throw new RangeError(`Falta el guion hablado de ${lesson.id}.`);
  const steps = scenes.map(([title,beats],index)=>storyScene(title,index ? 'Vamos a razonarlo' : 'Una situación concreta',beats));
  const attach = (sceneIndex,lineIndex,plot) => {steps[sceneIndex].visual.lines[lineIndex].plot=plot;};
  if (lesson.id==='funciones') attach(0,1,{points:[[0,1],[1,3],[2,5],[3,7]],xLabel:'Entrada x',yLabel:'Salida g(x)'});
  if (lesson.id==='calculo') {
    attach(0,1,{points:[[0,0.5],[2,0.5]],shade:[0.4,1.2],xLabel:'Tiempo (min)',yLabel:'Densidad (1/min)'});
    attach(1,1,{points:[[0,0],[1,0.5],[2,1]],shade:[0,1],xLabel:'Tiempo (min)',yLabel:'Densidad (1/min)'});
  }
  if (lesson.id==='regiones-matrices') attach(0,2,{points:[[0,1],[1,0]],shade:[0,1],cut:0.3,xLabel:'Recurso x',yLabel:'Recurso y'});
  if (lesson.id==='exponencial') attach(0,1,{points:Array.from({length:61},(_,index)=>[index/4,Math.exp(-0.2*index/4)]),xLabel:'Tiempo (min)',yLabel:'S(t): seguir esperando'});
  if (lesson.id==='normal') {
    const points=Array.from({length:81},(_,index)=>{const position=-4+index/10;return [position,globalThis.jStat.normal.pdf(position,0,1)];});
    attach(0,2,{points,shade:[-4,2],xLabel:'Desviaciones z',yLabel:'Densidad estándar'});
    attach(1,0,{points,shade:[-1,2],xLabel:'Desviaciones z',yLabel:'Área entre −1 y 2'});
  }
  return steps;
}