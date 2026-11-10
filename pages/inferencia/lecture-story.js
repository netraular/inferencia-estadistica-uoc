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
      const duration = Math.max(3,text.split(/\s+/).length/2+1);
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
      beat('Hola. Hoy vamos a comparar dos ensayos de germinación sin dejarnos engañar por sus tamaños. En uno germinan dieciocho semillas y en otro treinta. ¿Cuál tiene mayor proporción de germinaciones? Todavía no podemos responder: nos faltan los totales.'),
      beat('Una proporción divide la parte que nos interesa por el total del que procede. Ese total debe ser positivo y contener la parte. En el primer ensayo sembramos setenta y dos semillas; las dieciocho germinadas están dentro de esas setenta y dos.',equation(String.raw`p=\frac{\text{parte}}{\text{total}},\quad\text{total}>0`),quantity('Primer ensayo',18,72)),
      beat('Dividimos dieciocho entre setenta y dos: queda un cuarto. Para expresarlo como porcentaje multiplicamos por cien, sin cambiar la cantidad observada. Cero coma veinticinco y veinticinco por ciento describen la misma fracción.',equation(String.raw`18/72=0{,}25=25\%`)),
      beat('En el segundo ensayo sembramos doscientas. Treinta entre doscientas es cero coma quince: quince por ciento. Hay más semillas germinadas, pero una proporción menor. Estamos describiendo estos ensayos, no demostrando aún que un tratamiento sea mejor.',quantity('Segundo ensayo',30,200),equation(String.raw`30/200=0{,}15=15\%`))
    ]],
    ['El denominador y las unidades',[
      beat('Si juntamos los ensayos, debemos juntar primero las partes y sus totales. Son cuarenta y ocho germinaciones entre doscientas setenta y dos semillas. Promediar veinticinco y quince por ciento daría veinte por ciento, pero daría el mismo peso a dos ensayos de tamaños distintos.',equation(String.raw`p_{\text{conjunto}}=\frac{18+30}{72+200}\approx0{,}1765`)),
      beat('No todos los cocientes son proporciones. Seis llegadas en tres horas dan dos llegadas por hora: una tasa. Puede superar uno porque el denominador mide exposición, no un conjunto que contiene las llegadas.',equation(String.raw`6\ \text{llegadas}/3\ \text{h}=2\ \text{llegadas/h}`)),
      beat('Cambiar la unidad tampoco cambia la sustancia. Cada miligramo contiene mil microgramos; por eso dos miligramos son dos mil microgramos. El número crece porque la unidad es más pequeña.',note('Una misma masa','2 mg = 2000 μg')),
      beat('La media se convierte con ese factor mil, pero la varianza usa distancias al cuadrado y se convierte con un millón. Al revisar una respuesta, conserva unidades y decimales: una probabilidad pequeña redondeada a cero no se ha vuelto imposible.',equation(String.raw`E[1000X]=1000E[X],\quad V(1000X)=10^6V(X)`))
    ]],
  ],
  algebra:[
    ['Buscamos un factor común',[
      beat('Hola. Vamos a despejar una constante entendiendo cada operación. Tres estados de un cultivo tienen pesos dos, tres y cinco. Buscamos probabilidades que mantengan esa relación y completen un total de uno.',note('Pesos de los estados','2, 3 y 5')),
      beat('Multiplicamos los tres pesos por la misma constante, ce. La suma de las probabilidades debe ser uno; podemos sacar ese factor común y sumar primero los pesos. Los paréntesis indican que ce multiplica la suma completa.',equation(String.raw`2c+3c+5c=c(2+3+5)=1`)),
      beat('Los pesos suman diez. Dividimos ambos miembros de la igualdad entre diez, que no es cero. Así conservamos la igualdad y obtenemos una décima para ce. No hemos distribuido el inverso entre los tres sumandos.',equation(String.raw`10c=1\quad\Rightarrow\quad c=1/10`)),
      beat('Sustituimos para comprobarlo: las masas son dos décimas, tres décimas y una mitad. Son no negativas y suman uno. Resolver la suma no bastaría si apareciera una masa negativa; normalizar exige ambas condiciones.',equation(String.raw`(2c,3c,5c)=(0{,}2,0{,}3,0{,}5)`))
    ]],
    ['Deshacer una operación',[
      beat('Ahora la incógnita está en un exponente. Un modelo deja una proporción restante igual a la exponencial de menos el tiempo dividido entre seis horas. Queremos el tiempo en que queda la mitad.',equation(String.raw`S(t)=e^{-t/6},\quad t\geq0\ \text{horas}`)),
      beat('El logaritmo natural deshace la exponencial. Podemos tomarlo en ambos miembros porque son positivos. El logaritmo de la mitad es negativo; conservar ese signo será importante al despejar.',equation(String.raw`e^{-t/6}=1/2\quad\Rightarrow\quad -t/6=\log(1/2)`)),
      beat('Multiplicamos por menos seis. Como el logaritmo de la mitad es menos el logaritmo de dos, el tiempo sale positivo: unas cuatro coma dieciséis horas. Al sustituirlo, el exponente vuelve a dar el logaritmo de la mitad.',equation(String.raw`t=6\log2\approx4{,}16`)),
      beat('En general, una escala positiva y una proporción entre cero excluido y uno incluido dan un tiempo no negativo. Una proporción cero se alcanza solo como límite al crecer el tiempo; no podemos tomar su logaritmo y obtener un tiempo finito.',equation(String.raw`t=-\alpha\log s,\quad\alpha>0,\quad0<s\leq1`))
    ]],
  ],
  funciones:[
    ['Una regla que recibe un número',[
      beat('Hola. Hoy vamos a leer funciones, intervalos y sumatorios como instrucciones concretas. Una función recibe una entrada permitida y le asigna una salida. Nuestra regla ge multiplica la entrada por dos y después suma uno.',equation(String.raw`g(x)=2x+1`)),
      beat('Para la entrada tres sustituimos equis por tres en la regla completa: dos por tres más uno da siete. Ge de tres no significa ge multiplicado por tres. En el dibujo cada entrada se empareja con su salida.',equation(String.raw`g(3)=2\cdot3+1=7`)),
      beat('El sumatorio indica qué términos recorrer y reunir. Si el índice va de cero a dos, calculamos ge de cero, ge de uno y ge de dos: uno, tres y cinco. Sumamos las salidas y obtenemos nueve, no la suma de los índices.',equation(String.raw`\sum_{i=0}^2g(i)=1+3+5=9`)),
      beat('El dominio decide qué entradas admite la regla. Una función por tramos exige localizar primero la entrada y elegir después su fórmula. Una densidad que vale cero fuera de un intervalo no se prolonga usando sin más la fórmula interior.',note('Orden de lectura','Entrada → tramo permitido → salida'))
    ]],
    ['Decidir qué valores entran',[
      beat('Una medida de brotes solo toma cero, dos o cinco, con masas una décima, seis décimas y tres décimas. Esos valores forman su soporte. El segundo renglón corresponde al valor dos; su posición en la tabla no es un resultado nuevo.',note('Valores y probabilidades','0: 0,1 · 2: 0,6 · 5: 0,3')),
      beat('Para calcular la probabilidad de un conjunto sumamos las masas de los valores que lo cumplen. Menos de tres admite cero y dos. Primero seleccionamos esos valores; después sumamos una décima y seis décimas.',equation(String.raw`P(X<3)=0{,}1+0{,}6=0{,}7`)),
      beat('Menos de dos excluye el dos, de modo que solo queda la masa del cero. Como máximo dos lo incluye y vuelve a dar siete décimas. Los extremos abiertos y cerrados sí importan cuando allí hay masa.',equation(String.raw`P(X<2)=0{,}1,\quad P(X\leq2)=0{,}7`)),
      beat('Al menos dos significa dos o cinco, no exactamente dos. Su probabilidad es nueve décimas. Antes de automatizar un sumatorio, escribe los valores que entran: así compruebas a la vez el soporte y la desigualdad.',equation(String.raw`P(X\geq2)=0{,}6+0{,}3=0{,}9`))
    ]],
  ],
  calculo:[
    ['La probabilidad ocupa un área',[
      beat('Hola. Vamos a entender una integral antes de usarla para calcular probabilidades. Imagina una duración entre cero y dos minutos, con densidad constante de medio por minuto. El rectángulo completo tiene área uno: hemos normalizado el modelo.',note('Rectángulo completo','Anchura 2 min · altura 0,5 por min')),
      beat('La probabilidad de un intervalo es el área sobre él. Si la altura es constante, usamos altura por anchura. Entre cero coma cuatro y uno coma dos la anchura es cero coma ocho minutos; las unidades de tiempo se cancelan.',equation(String.raw`P(a<T<b)=\int_a^b f(t)\,dt`)),
      beat('Multiplicamos medio por cero coma ocho y obtenemos cero coma cuatro. La zona sombreada representa esa probabilidad; la altura medio por minuto no era la respuesta por sí sola.',equation(String.raw`0{,}5\,(1{,}2-0{,}4)=0{,}4`)),
      beat('Cuando cambia la altura, dividimos el intervalo en franjas estrechas y sumamos altura por anchura. La integral es el límite de esas sumas. Si el intervalo cruza un cambio de fórmula, separamos los tramos antes de acumular.',note('Integral','Acumular pequeñas áreas dentro del soporte'))
    ]],
    ['Cuando la altura cambia',[
      beat('Cambiamos a una densidad que vale te dividido entre dos desde cero hasta dos, y cero fuera. Las franjas derechas son más altas. Su área total sigue siendo uno, pero no podemos multiplicar cualquier altura por toda la anchura.',equation(String.raw`f(t)=t/2\quad(0\leq t\leq2)`)),
      beat('Una primitiva es una función cuya derivada devuelve la densidad. La derivada de te al cuadrado dividido entre cuatro es te dividido entre dos. El teorema fundamental del cálculo permite restar los valores de esa primitiva en los dos extremos.',equation(String.raw`G(t)=t^2/4,\quad G'(t)=t/2`)),
      beat('Hasta un minuto evaluamos la primitiva en uno y en cero. Un cuarto menos cero da un cuarto. Hasta dos minutos obtendríamos uno, que comprueba la normalización.',equation(String.raw`\int_0^1t/2\,dt=[t^2/4]_0^1=1/4`)),
      beat('Dentro del soporte, la acumulada es esa primitiva y su pendiente es la densidad. En un minuto la pendiente vale medio por minuto, pero el área acumulada vale un cuarto. Una pendiente, un área y la probabilidad cero de un instante son tres cantidades diferentes.',equation(String.raw`F'(t)=f(t)\quad\text{donde exista la derivada}`))
    ]],
  ],
  'regiones-matrices':[
    ['Dos cultivos comparten un recurso',[
      beat('Hola. Hoy vamos a convertir un dibujo en límites de integración y a ordenar medidas en una matriz. Dos cultivos comparten una unidad de recurso. Equis representa lo que recibe el primero; i griega, lo que recibe el segundo.',note('Coordenadas','x: primer cultivo · y: segundo cultivo')),
      beat('Ambas cantidades son no negativas y su suma no supera uno. La frontera inclinada une los puntos uno, cero y cero, uno. Los repartos permitidos forman un triángulo, no todo el cuadrado de lado uno.',equation(String.raw`x\geq0,\quad y\geq0,\quad x+y\leq1`)),
      beat('Fijamos equis en cero coma tres y despejamos la otra coordenada: i griega no puede superar uno menos cero coma tres. El corte vertical va de cero a cero coma siete. Ese límite cambia al mover el corte.',equation(String.raw`x=0{,}3\quad\Rightarrow\quad0\leq y\leq0{,}7`)),
      beat('Para recorrer todo el triángulo dejamos equis entre cero y uno y, para cada equis, recorremos i griega entre cero y uno menos equis. Integrar uno da su área, una mitad; integrar una densidad constante dos daría probabilidad uno.',equation(String.raw`\int_0^1\int_0^{1-x}1\,dy\,dx=1/2`))
    ]],
    ['Leer una lista y una tabla',[
      beat('Un vector reúne medidas en un orden acordado. Si la primera entrada corresponde al primer cultivo, no puede pasar a significar el segundo sin cambiar también las etiquetas. Las coordenadas del dibujo siguen esa misma disciplina.',note('Vector','(medida del cultivo 1, medida del cultivo 2)')),
      beat('Una matriz organiza entradas por filas y columnas. En esta matriz, fila primera y columna segunda contienen uno. La diagonal contiene cuatro y nueve. Estos números no son probabilidades ni tienen por qué sumar uno.',equation(String.raw`M=\begin{pmatrix}4&1\\1&9\end{pmatrix},\quad M_{1,2}=1`)),
      beat('El producto de una matriz por un vector usa sumas de productos: cada fila combina sus entradas con las del vector. Si el vector es uno, dos, la primera fila produce seis y la segunda diecinueve. No multiplicamos solo las entradas de la diagonal.',equation(String.raw`M\begin{pmatrix}1\\2\end{pmatrix}=\begin{pmatrix}4\cdot1+1\cdot2\\1\cdot1+9\cdot2\end{pmatrix}=\begin{pmatrix}6\\19\end{pmatrix}`)),
      beat('Más adelante una matriz de covarianzas pondrá varianzas en la diagonal y covarianzas fuera. Sus etiquetas y unidades explicarán cada entrada. Igual que con los límites del triángulo, la organización debe representar el problema antes de empezar a operar.',note('Comprobación','Orden, etiquetas, dimensiones y unidades compatibles'))
    ]],
  ],
  sucesos:[
    ['Elegimos una bacteria',[
      beat('Hola. Vamos a pasar de una frase a un conjunto de resultados, y de ese conjunto a una probabilidad. Elegimos una bacteria de una colección de cien: treinta llevan solo a, veinte solo be, diez ambos y cuarenta ninguno.',note('Colección','Solo A: 30 · solo B: 20 · ambos: 10 · ninguno: 40')),
      beat('El espacio muestral contiene las cien bacterias identificadas. Un resultado elemental es la bacteria elegida. El suceso a reúne todas las que llevan a, incluidas las diez dobles. Por eso contiene cuarenta resultados, no treinta.',quantity('Con marcador A',40,100)),
      beat('Suponemos que las cien bacterias son equiprobables. Solo con esa condición podemos dividir casos favorables entre posibles. A tiene probabilidad cuatro décimas y su complemento, no tener a, ocupa las seis décimas restantes.',equation(String.raw`P(A)=0{,}4,\quad P(A^c)=0{,}6`)),
      beat('El detalle observable importa: registrar solo el color de un marcador puede impedir distinguir bacterias individuales. El espacio, los sucesos observables y la regla de probabilidad son piezas diferentes; conocer los nombres de las categorías no fija sus probabilidades.',equation(String.raw`(\Omega,\mathcal A,P)`))
    ]],
    ['Ambos no significa cualquiera',[
      beat('La intersección exige ambos marcadores a la vez: solo las diez dobles. La unión acepta al menos uno, también ambos. En probabilidad, la palabra o no excluye la coincidencia salvo que el enunciado lo diga.',note('Intersección','Ambos marcadores: 10')),
      beat('Para sumar a y be sin duplicar resultados usamos inclusión y exclusión: sumamos sus probabilidades y restamos la intersección. Las diez dobles estaban una vez en cada grupo; retiramos una de esas dos copias.',equation(String.raw`P(A\cup B)=P(A)+P(B)-P(A\cap B)`)),
      beat('Sustituimos cuatro décimas más tres décimas menos una décima. La unión vale seis décimas, igual que contar treinta, veinte y diez. Ningún marcador es su complemento y tiene probabilidad cuatro décimas.',equation(String.raw`P(A\cup B)=0{,}4+0{,}3-0{,}1=0{,}6`)),
      beat('Solo a significa a y no be; ninguno significa no a y no be. Estas traducciones deciden qué resultados entran antes de asignarles números. Negar que ocurra alguno obliga a negar ambos: esa es una ley de De Morgan.',equation(String.raw`A\setminus B=A\cap B^c,\quad(A\cup B)^c=A^c\cap B^c`))
    ]],
  ],
  axiomas:[
    ['Que las cuentas sean coherentes',[
      beat('Hola. Vamos a deducir reglas de cálculo de tres exigencias de coherencia. Una probabilidad no es negativa, el suceso seguro vale uno y la probabilidad de una unión de sucesos disjuntos es la suma de sus probabilidades.',equation(String.raw`P(A)\geq0,\quad P(\Omega)=1`)),
      beat('La suma sirve incluso para una lista numerable de sucesos, siempre que sean disjuntos dos a dos. Tres estados excluyentes con probabilidades dos, tres y cinco décimas permiten reunir los dos primeros sumando: una mitad.',equation(String.raw`P\left(\bigcup_i A_i\right)=\sum_iP(A_i)\quad(A_i\cap A_j=\varnothing,\ i\ne j)`)),
      beat('Si se solapan, hay que corregir. Para dos sucesos restamos una copia de la intersección. Con tres, restamos cada intersección por parejas y añadimos la triple, que habíamos eliminado demasiado.',equation(String.raw`P(A\cup B)=P(A)+P(B)-P(A\cap B)`)),
      beat('El complemento completa el espacio, por lo que su probabilidad es uno menos la original. Además, si un suceso está contenido en otro no puede tener más probabilidad: el grupo mayor incluye todo el menor y quizá algo más.',equation(String.raw`P(A^c)=1-P(A),\quad A\subseteq B\Rightarrow P(A)\leq P(B)`))
    ]],
    ['Cotas y frecuencias no son garantías',[
      beat('Aunque no conozcamos los solapamientos, una unión no supera la suma de probabilidades individuales. Aplicado a los fallos de tres controles, cada uno con probabilidad una décima, el riesgo de algún fallo no supera tres décimas.',equation(String.raw`P\left(\bigcup_i A_i\right)\leq\sum_iP(A_i)`)),
      beat('Por complemento, la probabilidad de pasar los tres controles es al menos siete décimas. Es una cota de Bonferroni, no una igualdad. Multiplicar nueve décimas tres veces pediría independencia mutua, que no hemos supuesto.',equation(String.raw`P(\text{pasar todos})\geq1-3(0{,}1)=0{,}7`)),
      beat('La frecuencia relativa es otra cosa: éxitos observados divididos por repeticiones. Bajo ensayos independientes de probabilidad estable se concentra alrededor de esa probabilidad al aumentar el tamaño, pero sigue fluctuando y no necesita acercarse en cada paso.',equation(String.raw`\widehat p_n=\frac1n\sum_{i=1}^n I_A^{(i)}`)),
      beat('Una racha no obliga al siguiente ensayo a compensar nada. Tampoco una simulación demuestra que el mecanismo real cumpla el modelo. Si una cuenta de probabilidad supera uno, revisa el denominador y los solapamientos: no recortes el resultado para ocultar el error.',note('Separar','Probabilidad del modelo · frecuencia observada · cota'))
    ]],
  ],
  combinatoria:[
    ['¿Importa quién va primero?',[
      beat('Hola. Hoy vamos a elegir una cuenta a partir del experimento, no del aspecto de una fórmula. Hay cinco muestras distintas y necesitamos dos. Primero decidimos si importa el orden y si podemos repetir una muestra.',note('Elección','2 muestras distintas de un total de 5')),
      beat('Para dos posiciones etiquetadas sin repetición hay cinco opciones y después cuatro. El principio del producto da veinte asignaciones. Si usamos todos los elementos, ese producto decreciente se llama factorial; cero factorial vale uno.',equation(String.raw`V_{n,r}=\frac{n!}{(n-r)!},\quad n!=n(n-1)\cdots1`)),
      beat('Para analizar un par conjunto, a seguida de be y be seguida de a son la misma selección. Cada par aparece dos factorial veces entre las asignaciones. Las combinaciones dividen por esas reordenaciones que ya no distinguimos.',equation(String.raw`\binom nr=\frac{n!}{r!(n-r)!}`)),
      beat('Con cinco muestras y grupos de dos, veinte dividido entre dos da diez pares. El símbolo cinco sobre dos cuenta selecciones; no significa dividir cinco entre dos.',equation(String.raw`\binom52=\frac{5\cdot4}{2\cdot1}=10`))
    ]],
    ['Cambiar el experimento cambia la cuenta',[
      beat('Si una muestra recibe tratamiento y otra es control, intercambiarlas sí cambia el diseño. Ya no quitamos los dos órdenes: conservamos veinte asignaciones. No se divide por un factorial solo porque estamos eligiendo dos elementos.',equation(String.raw`5\cdot4=20`)),
      beat('Si devolvemos la primera antes de la segunda elección, hay cinco posibilidades de nuevo. Dos posiciones con repetición producen cinco al cuadrado, veinticinco secuencias. El espacio producto enumera rutas, pero todavía no les asigna probabilidades.',equation(String.raw`VR_{n,r}=n^r,\quad5^2=25`)),
      beat('Otro problema es ordenar etiquetas repetidas. Dos etiquetas a y dos be permiten cuatro factorial órdenes si las distinguiéramos. Dividir por dos factorial para cada letra elimina los intercambios invisibles y deja seis secuencias diferentes.',equation(String.raw`\frac{4!}{2!2!}=6`)),
      beat('Para convertir recuentos en probabilidades necesitamos equiprobabilidad de los resultados contados. Que existan diez pares no garantiza que cada uno se elija con probabilidad una décima: un mecanismo de selección sesgado conserva la cuenta pero cambia las probabilidades.',note('Antes del cociente','Justificar equiprobabilidad de los casos contados'))
    ]],
  ],
  condicionada:[
    ['La información cambia el grupo',[
      beat('Hola. Vamos a calcular qué cambia cuando recibimos información. De cien bacterias equiprobables, cuarenta tienen a y diez tienen a y be. Sin más información, ambas características aparecen en una décima de la colección.',quantity('Grupo conocido: A',40,100)),
      beat('Ahora sabemos que la bacteria elegida tiene a. Eliminamos las sesenta incompatibles con esa información. Las diez dobles siguen siendo favorables, pero el grupo de referencia contiene cuarenta, no cien.',quantity('Con B dentro de A',10,40)),
      beat('La probabilidad condicional divide la intersección por la probabilidad del grupo conocido. Exigimos que esta última sea positiva. La barra se lee dado que; indica qué información estamos utilizando.',equation(String.raw`P(B\mid A)=\frac{P(A\cap B)}{P(A)},\quad P(A)>0`)),
      beat('Sustituir una décima entre cuatro décimas equivale a diez entre cuarenta: un cuarto. No ha cambiado el marcador de ninguna bacteria; ha cambiado la colección sobre la que respondemos.',equation(String.raw`P(B\mid A)=10/40=0{,}25`))
    ]],
    ['El denominador no se elige por costumbre',[
      beat('La condicional sigue siendo una probabilidad: dentro de a, be y no be completan el total. Por eso sus probabilidades suman uno. Renormalizar no consiste solo en quitar casos: también hay que ajustar su peso al nuevo total.',equation(String.raw`P(B\mid A)+P(B^c\mid A)=1`)),
      beat('Podemos deshacer el cociente para obtener la regla del producto. La probabilidad de ambas es la de llegar al grupo a multiplicada por la fracción de ese grupo que cumple be. No necesitamos independencia para usar esta regla.',equation(String.raw`P(A\cap B)=P(A)P(B\mid A)`)),
      beat('Si invertimos y pedimos a dado be, cambia el denominador. En la colección hay treinta con be: diez entre treinta es un tercio, no un cuarto. Infectados entre positivos y positivos entre infectados son preguntas distintas por la misma razón.',equation(String.raw`P(A\mid B)=10/30=1/3`)),
      beat('Si la condición tiene probabilidad cero, este cociente no está definido. No lo convertimos en cero ni dividimos entre cero. Más adelante, las condiciones sobre puntos continuos se construirán con densidades bajo supuestos específicos.',note('Límite del cociente','El suceso condicionante debe tener probabilidad positiva'))
    ]],
  ],
  'independencia-sucesos':[
    ['Saber una cosa, ¿cambia la otra?',[
      beat('Hola. Vamos a distinguir independencia de incompatibilidad usando una comprobación concreta. Independencia significa que saber si ocurre un suceso no cambia la probabilidad del otro; no significa que nunca coincidan.',note('Independencia','La información de A no cambia la probabilidad de B')),
      beat('La definición que no necesita dividir es que la probabilidad de la intersección coincide con el producto de las marginales. Cuando a tiene probabilidad positiva, equivale a que la condicional de be dado a sea la probabilidad original de be.',equation(String.raw`P(A\cap B)=P(A)P(B)`)),
      beat('Con probabilidades cuatro décimas y tres décimas, el producto es doce centésimas. Si el modelo asigna diez centésimas a ambas, la igualdad falla: hay dependencia. Para probabilidades exactas del modelo, parecerse no es coincidir.',equation(String.raw`P(A)P(B)=0{,}4\cdot0{,}3=0{,}12`)),
      beat('La misma diferencia aparece al condicionar: diez centésimas entre cuatro décimas da un cuarto. Saber a cambia be desde tres décimas a un cuarto. Esta comparación interpreta la discrepancia del producto.',equation(String.raw`P(B\mid A)=0{,}10/0{,}40=0{,}25\ne0{,}3`))
    ]],
    ['Independiente no es incompatible',[
      beat('Incompatibilidad significa intersección vacía. Si a y be tienen probabilidades positivas, el producto es positivo y no puede igualar esa intersección de probabilidad cero. Por tanto, dos sucesos incompatibles de probabilidad positiva no son independientes.',equation(String.raw`A\cap B=\varnothing\Rightarrow P(A\cap B)=0`)),
      beat('La salvedad es un suceso de probabilidad cero: su intersección con cualquier otro también vale cero, y cumple el criterio del producto. Esa definición sigue funcionando aunque alguna probabilidad condicional no pueda calcularse.',note('Caso límite','La definición por producto no exige denominadores positivos')),
      beat('La independencia también se conserva al complementar. Si be no cambia al conocer a, tampoco cambia al conocer no a cuando esa condición tiene probabilidad positiva. Se puede verificar restando la intersección a la probabilidad de be.',equation(String.raw`P(A^c\cap B)=P(B)-P(A\cap B)=(1-P(A))P(B)`)),
      beat('Con varios sucesos, comprobar solo parejas no garantiza independencia mutua: también hacen falta los productos de las intersecciones de grupos mayores. Y en un experimento real la independencia depende del mecanismo, no de que escribamos los resultados en filas distintas.',note('Diseño experimental','Separación de etiquetas no garantiza independencia'))
    ]],
  ],
  'bayes-diagnostico':[
    ['Sigamos a los animales, no solo a la fórmula',[
      beat('Hola. Hoy vamos a interpretar un test positivo sin invertir por error sus probabilidades. La sensibilidad es noventa por ciento: positivos entre infectados. Queremos la pregunta inversa, infectados entre positivos, que necesita también prevalencia y falsos positivos.'),
      beat('En mil animales del modelo esperamos cien infectados y novecientos sanos. La prevalencia es una décima. La especificidad es noventa y cinco por ciento, de modo que cinco por ciento de los sanos da positivo.',note('Datos del test','Prevalencia 0,10 · sensibilidad 0,90 · especificidad 0,95')),
      beat('Infectado y sano forman una partición: grupos separados que completan la población. Por la regla del producto calculamos los positivos que vienen de cada ruta; por probabilidad total los reunimos sin duplicarlos.',equation(String.raw`P(+)=P(+\mid E)P(E)+P(+\mid E^c)P(E^c)`)),
      beat('Nueve décimas de cien producen noventa positivos verdaderos; cinco centésimas de novecientos producen cuarenta y cinco falsos. Son recuentos esperados, no un diagnóstico de animales identificados. En total esperamos ciento treinta y cinco positivos.',note('Positivos esperados','Infectados: 90 · sanos: 45'),equation(String.raw`P(+)=0{,}90(0{,}10)+0{,}05(0{,}90)=0{,}135`))
    ]],
    ['Qué está haciendo Bayes',[
      beat('La definición condicional pide infectados positivos divididos por todos los positivos. Bayes escribe el numerador como sensibilidad por prevalencia. El denominador debe ser positivo e incluir todas las rutas que pueden producir un positivo.',equation(String.raw`P(E\mid+)=\frac{P(+\mid E)P(E)}{P(+)}`)),
      beat('De los ciento treinta y cinco positivos esperados, noventa están infectados. Dividimos noventa entre ciento treinta y cinco y obtenemos dos tercios. No es la sensibilidad: estamos usando otro grupo de referencia.',equation(String.raw`P(E\mid +)=\frac{90}{90+45}=\frac23`)),
      beat('Si la prevalencia baja al uno por ciento y el test no cambia, esperamos nueve verdaderos positivos y cuarenta y nueve coma cinco falsos entre mil animales. La posterior baja aproximadamente al quince coma treinta y ocho por ciento. Las fracciones son admisibles porque contamos expectativas.',equation(String.raw`\frac{0{,}9(0{,}01)}{0{,}9(0{,}01)+0{,}05(0{,}99)}\approx0{,}1538`)),
      beat('El mismo test puede tener distinto valor predictivo en poblaciones diferentes. Antes de comunicar la respuesta, identifica la población a la que corresponde la prevalencia y comprueba que las características del test sean aplicables allí. Bayes actualiza información bajo esos supuestos; no los demuestra.',note('Lectura final','Posterior condicionada a población y características del test'))
    ]],
  ],
  'variable-cdf':[
    ['Una medida y sus resultados',[
      beat('Hola. Vamos a definir una variable aleatoria y a leer su acumulada. Equis mayúscula es una regla que asigna un número a cada resultado del experimento; equis minúscula puede ser un valor observado o un umbral. La regla no cambia cuando observamos el resultado.',equation(String.raw`X:\Omega\longrightarrow\mathbb R`)),
      beat('Podemos contar brotes y obtener cero, dos o cinco. Resultados biológicos distintos pueden dar el mismo recuento: para hallar su probabilidad reunimos todos los resultados originales que producen ese número. El recorrido no es el espacio muestral original.',note('Probabilidades','0: 0,1 · 2: 0,6 · 5: 0,3')),
      beat('La función de distribución, efe, pregunta por la probabilidad de no superar un umbral, incluyéndolo. Está definida para cualquier umbral real, aunque la variable no pueda tomar ese valor. Los sucesos que construye deben ser observables.',equation(String.raw`F_X(x)=P(X\leq x)`)),
      beat('Con umbral tres entran cero y dos, pero no cinco. Sumamos sus masas y obtenemos siete décimas. No significa que equis pueda valer tres, ni que la probabilidad puntual en tres sea siete décimas.',equation(String.raw`F_X(3)=P(X\leq3)=0{,}7`))
    ]],
    ['Los saltos tienen una razón',[
      beat('Al llegar a dos, efe incluye su masa y vale siete décimas. Entre dos y cinco permanece plana porque no encuentra resultados nuevos. En cinco incorpora las tres décimas restantes y llega a uno.',equation(String.raw`F_X(2)=0{,}7,\quad F_X(5)=1`)),
      beat('El salto es la altura después de incorporar el punto menos el límite anterior. En dos vale seis décimas. La acumulada es continua por la derecha: en el salto toma el valor que ya incluye la masa del punto.',equation(String.raw`P(X=2)=F_X(2)-F_X(2^-)=0{,}6`)),
      beat('Toda acumulada está entre cero y uno, no desciende y tiende a cero y uno en los extremos de la recta. Si desciende no es una acumulada válida. La definición sirve también para distribuciones continuas y mixtas.',note('Propiedades','No decreciente · continua por la derecha · límites 0 y 1')),
      beat('Para un intervalo abierto por la izquierda y cerrado por la derecha restamos acumuladas. Y para un cuantil buscamos el primer umbral que alcanza el nivel pedido. El cuantil del ochenta por ciento es cinco: el salto pasa de siete décimas a uno sin detenerse en ocho décimas.',equation(String.raw`P(a<X\leq b)=F_X(b)-F_X(a),\quad Q(u)=\inf\{x:F_X(x)\geq u\}`))
    ]]
  ],
  masa:[
    ['Del peso a la probabilidad',[
      beat('Hola. Hoy vamos a construir una función de masa y comprobar que realmente asigna probabilidades. Una variable discreta tiene un conjunto finito o numerable de valores. A cada uno le corresponde la probabilidad de obtener exactamente ese valor.',equation(String.raw`p_X(x)=P(X=x)`)),
      beat('Si varios resultados del experimento producen la misma medida, sumamos sus probabilidades. No damos el mismo peso a cada valor nuevo solo porque tenga su propia fila. Agrupar resultados transporta sus probabilidades, no las reinventa.',note('Construcción','Reunir los resultados que producen un mismo valor')),
      beat('Para tres estados nos dan pesos dos, tres y cinco. Buscamos una constante común: ce por la suma de los pesos debe valer uno. La suma es diez, así que ce es una décima y las masas son dos, tres y cinco décimas.',equation(String.raw`c(2+3+5)=1,\quad p=(0{,}2,\,0{,}3,\,0{,}5)`)),
      beat('Comprobamos no negatividad y suma uno; fuera del soporte la masa es cero. Los pesos iniciales cumplían la proporción entre estados, pero no eran probabilidades porque sumaban diez. Normalizar cambia la escala, no esas relaciones.',equation(String.raw`p_X(x)\geq0,\quad\sum_xp_X(x)=1`))
    ]],
    ['Reunir los valores que nos interesan',[
      beat('La probabilidad de un conjunto se calcula sumando las masas de sus valores. Cualquiera de los dos primeros estados tiene probabilidad dos décimas más tres décimas, una mitad. Se suman probabilidades, no las etiquetas de los estados.',equation(String.raw`P(X\in A)=\sum_{x\in A}p_X(x)`)),
      beat('La acumulada elige todos los valores hasta un umbral. En cambio, la masa elige un solo valor. Una desigualdad estricta puede excluir una masa positiva, por lo que debemos decidir los extremos antes de sumar.',equation(String.raw`F_X(a)=\sum_{x\leq a}p_X(x),\quad P(X<a)=F_X(a)-p_X(a)`)),
      beat('Un indicador es una variable que vale uno si ocurre un suceso y cero si no. Su masa en uno es la probabilidad del suceso; su masa en cero es el complemento. No son dos categorías equiprobables por definición.',equation(String.raw`P(I_A=1)=P(A),\quad P(I_A=0)=1-P(A)`)),
      beat('Cuando una fórmula lleva un indicador del soporte, ese interruptor impide asignar masa a valores imposibles. Para una lista infinita, la normalización exige sumar toda la serie, no solo el tramo que muestra el gráfico.',note('Límite del dibujo','Una cola no dibujada puede conservar probabilidad positiva'))
    ]]
  ],
  densidad:[
    ['La altura no es una probabilidad',[
      beat('Hola. Vamos a interpretar una densidad sin confundir su altura con una probabilidad. Trabajaremos con distribuciones absolutamente continuas: sus probabilidades se obtienen integrando una función no negativa cuya área total es uno.',equation(String.raw`f(x)\geq0,\quad\int_{-\infty}^{\infty}f(x)\,dx=1`)),
      beat('Un tiempo uniforme entre cero y dos minutos tiene altura medio por minuto dentro del soporte y cero fuera. Dos minutos por medio por minuto dan área uno. La densidad tiene unidades inversas al tiempo; el área de probabilidad no tiene unidades.',note('Densidad uniforme','Altura 0,5 · anchura 2')),
      beat('Para un intervalo acumulamos altura por anchura; si la curva cambia, lo hacemos con una integral. Desde cero hasta medio minuto la anchura es medio y la altura también medio: obtenemos un cuarto.',equation(String.raw`P(0<T<0{,}5)=0{,}5\cdot0{,}5=0{,}25`)),
      beat('Un instante exacto no tiene anchura, por eso su probabilidad es cero. Esto no hace imposible observar un tiempo: cualquier intervalo de medida con anchura positiva puede tener probabilidad positiva. Los extremos no cambian la probabilidad si no hay masas puntuales.',equation(String.raw`P(T=t)=0`))
    ]],
    ['Una densidad puede superar uno',[
      beat('Si concentramos toda la probabilidad entre cero y medio minuto, la altura debe ser dos por minuto. Dos por medio vuelve a dar uno. Una densidad mayor que uno es válida porque el límite de uno corresponde a probabilidades, no a alturas.',equation(String.raw`2\cdot0{,}5=1`)),
      beat('Una franja de una décima de minuto bajo esa densidad aporta dos décimas de probabilidad. Si la franja saliera del soporte, solo contaríamos la intersección: fuera la densidad es cero.',equation(String.raw`2\cdot0{,}1=0{,}2`)),
      beat('La acumulada reúne el área desde menos infinito. Restar su valor en el límite inferior al del superior deja exactamente el área intermedia. Donde efe es derivable, su pendiente recupera la densidad.',equation(String.raw`P(a<X\leq b)=F_X(b)-F_X(a)`),equation(String.raw`F'_X(x)=f_X(x)`)),
      beat('No toda acumulada continua admite densidad; por eso hemos precisado el supuesto de continuidad absoluta. En una distribución mixta, con masa puntual y parte continua, los puntos con masa vuelven a exigir atención al incluir o excluir extremos.',note('Alcance','Usar áreas requiere una distribución con densidad'))
    ]]
  ],
  esperanza:[
    ['Un promedio antes de observar',[
      beat('Hola. Vamos a calcular una esperanza como promedio ponderado, y después a transformar lo que promediamos. Un recuento vale cero, uno o dos con probabilidades un cuarto, una mitad y un cuarto. No debemos tratar los tres valores como equiprobables.',note('Tabla del modelo','0: 1/4 · 1: 1/2 · 2: 1/4')),
      beat('La esperanza discreta suma cada valor multiplicado por su probabilidad. Los pesos ya suman uno; no dividimos otra vez entre el número de valores. Para una densidad, la misma idea usa una integral de valor por densidad.',equation(String.raw`E[X]=\sum_xxp_X(x),\quad E[X]=\int_{-\infty}^{\infty}xf_X(x)\,dx`)),
      beat('Cero aporta cero; uno, una mitad; dos, otra mitad. La suma es uno. Es el centro del modelo, no una promesa de que la siguiente observación valga uno. Bajo repeticiones independientes e idénticas con esperanza finita, la media observada se aproxima a ese centro.',equation(String.raw`E[X]=0\cdot\tfrac14+1\cdot\tfrac12+2\cdot\tfrac14=1`)),
      beat('La condición de esperanza finita es que el promedio del valor absoluto sea finito. Si las colas son demasiado pesadas no podemos cancelar infinitos positivos y negativos para inventar una media. Una variable no negativa también puede tener esperanza infinita.',equation(String.raw`E[|X|]<\infty\quad\text{para una esperanza finita}`))
    ]],
    ['Primero transformar, después promediar',[
      beat('Para la esperanza de una función no hace falta hallar primero toda su distribución: transformamos cada valor y conservamos su peso original. Al cuadrar el recuento obtenemos cero, uno y cuatro, con las mismas probabilidades.',equation(String.raw`E[g(X)]=\sum_xg(x)p_X(x)`)),
      beat('La nueva cuenta da cero más una mitad más uno: uno coma cinco. Cuadrar la media original daba uno. La operación cuadrado no atraviesa la esperanza porque no es lineal.',equation(String.raw`E[X^2]=1{,}5\ne(E[X])^2=1`)),
      beat('En cambio, multiplicar por una constante y sumar otra sí respeta la linealidad. Para dos veces el recuento más tres, la esperanza es cinco. También se suman esperanzas de variables dependientes cuando las esperanzas implicadas son finitas.',equation(String.raw`E[aX+b]=aE[X]+b,\quad E[X+Y]=E[X]+E[Y]`)),
      beat('No extendamos esa regla a un producto de variables. La independencia permite separar la esperanza del producto bajo integrabilidad, pero la linealidad de una suma no la necesita. Distinguir ambas evita introducir supuestos innecesarios.',note('Condiciones','Suma: linealidad · producto: comprobar antes la separación'))
    ]]
  ],
  varianza:[
    ['Dos promedios iguales pueden esconder cosas distintas',[
      beat('Hola. Hoy vamos a medir la dispersión y a distinguir varianza de desviación típica. Un recuento vale cero, uno o dos con probabilidades un cuarto, una mitad y un cuarto. Su media es uno, igual que la de una variable que valiera siempre uno; necesitamos distinguirlas.',note('Punto de referencia','Media μ = 1; masas 1/4, 1/2, 1/4')),
      beat('La varianza es el promedio de las desviaciones al cuadrado respecto a la media. Requiere segundo momento finito para ser finita. Cuadrar evita que signos opuestos se compensen y hace que el resultado no sea negativo.',equation(String.raw`V(X)=E[(X-\mu)^2],\quad\mu=E[X]`)),
      beat('Con cero, uno y dos, las desviaciones son menos uno, cero y uno. Si las promediáramos con sus probabilidades se cancelarían. Sus cuadrados son uno, cero y uno; ahora ponderamos esas cantidades, no las desviaciones con signo.',equation(String.raw`(0-1)^2=1,\quad(1-1)^2=0,\quad(2-1)^2=1`)),
      beat('Un cuarto por uno, más una mitad por cero, más un cuarto por uno, da una mitad. La variable que siempre vale uno tendría varianza cero. La media era la misma, pero no la variabilidad.',equation(String.raw`\operatorname{Var}(X)=\tfrac14+0+\tfrac14=0{,}5`))
    ]],
    ['Volver a las unidades originales',[
      beat('La varianza tiene unidades cuadradas. Su raíz no negativa devuelve una medida de dispersión en las unidades originales: la desviación típica. Aquí es raíz de una mitad, aproximadamente cero coma setecientos siete.',equation(String.raw`\sigma=\sqrt{0{,}5}\approx0{,}707`)),
      beat('Al desarrollar el cuadrado y usar que la esperanza de equis es la media obtenemos una fórmula equivalente: segundo momento menos cuadrado de la media. Uno coma cinco menos uno vuelve a dar una mitad; no invertimos esa resta.',equation(String.raw`\operatorname{Var}(X)=E[X^2]-(E[X])^2`)),
      beat('Sumar una constante desplaza también la media y deja iguales las desviaciones. Multiplicar por dos duplica las desviaciones y cuadruplica sus cuadrados. En general la varianza se multiplica por el cuadrado del factor; la desviación, por su valor absoluto.',equation(String.raw`V(aX+b)=a^2V(X),\quad\sigma_{aX+b}=|a|\sigma_X`)),
      beat('Estos son resúmenes de un modelo, no una varianza calculada sobre una muestra de tres etiquetas. Para sumar varianzas de variables distintas tendremos que considerar la covarianza; no basta con copiar la regla de linealidad de la esperanza.',note('No intercambiar','Varianza del modelo · estimador muestral · desviación típica'))
    ]]
  ],
  'momentos-transformaciones':[
    ['Resumir con potencias',[
      beat('Hola. Vamos a distinguir momentos ordinarios y centrales, y a seguir qué ocurre al transformar una variable. Un momento ordinario de orden ka promedia la potencia ka del valor; uno central promedia la potencia de su desviación respecto a la media.',equation(String.raw`m_k=E[X^k],\quad\mu_k=E[(X-E[X])^k]`)),
      beat('El primer momento ordinario es la media. El segundo central es la varianza; el primero central vale cero cuando la media es finita. La palabra central cambia lo que elevamos a la potencia, no solo el nombre.',equation(String.raw`\mu_1=0,\quad\mu_2=V(X)`)),
      beat('Con cero y dos equiprobables, la media es uno y el promedio de los cuadrados es dos. Restar uno al segundo momento deja varianza uno. No debemos llamar varianza al promedio de cuadrados sin centrar.',equation(String.raw`E[X]=1,\quad E[X^2]=2,\quad\operatorname{Var}(X)=1`)),
      beat('Antes de dar un momento por finito comprobamos la esperanza del valor absoluto de esa potencia. Una distribución con colas pesadas puede tener media y no segundo momento, o ni siquiera media. Una fórmula simbólica no elimina una divergencia.',equation(String.raw`E[|X|^k]<\infty\quad\text{para un momento finito de orden }k`))
    ]],
    ['Qué ocurre al cambiar la medida',[
      beat('Para la distribución de i griega igual a equis al cuadrado, seguimos qué entradas producen cada salida. En discreto, menos dos y dos llegan ambos a cuatro: sumamos sus masas. No podemos elegir solo una de esas dos entradas.',note('Transformación','Y = X²; reunir todas las preimágenes')),
      beat('En continuo podemos empezar por la acumulada. Si equis es no negativa, para un umbral no negativo pedimos equis menor o igual que su raíz. Para umbrales negativos la probabilidad es cero porque un cuadrado no es negativo.',equation(String.raw`F_Y(y)=P(X\leq\sqrt y)\quad(y\geq0,\ X\geq0)`)),
      beat('Si equis admite ambos signos, la condición correcta es estar entre menos la raíz y más la raíz. Así contamos los dos caminos. Con una densidad continua restamos acumuladas en esos extremos; no usamos una sola inversa global.',equation(String.raw`F_Y(y)=F_X(\sqrt y)-F_X(-\sqrt y)\quad(y\geq0)`)),
      beat('En un tramo monótono con inversa diferenciable, la densidad transformada multiplica la densidad original por el valor absoluto de la derivada de la inversa. Ese factor ajusta la anchura para conservar probabilidad. Si hay varias ramas válidas, se suman sus aportes.',equation(String.raw`f_Y(y)=f_X(g^{-1}(y))\left|\frac{d}{dy}g^{-1}(y)\right|`))
    ]]
  ],
  'bernoulli-binomial':[
    ['De una semilla a un lote',[
      beat('Hola. Vamos a construir la binomial desde una semilla hasta un lote. Para una semilla, germinar vale uno y no germinar vale cero. Una Bernoulli asigna probabilidad pe al uno y uno menos pe al cero, con pe entre cero y uno.',equation(String.raw`P(I=1)=p,\quad P(I=0)=1-p`)),
      beat('Para contar germinaciones sumamos ene indicadores. El modelo binomial exige ene fijado, independencia mutua y la misma probabilidad pe en todos los ensayos. Bajo esas condiciones, una secuencia con ka éxitos pesa pe elevado a ka por uno menos pe elevado a ene menos ka.',equation(String.raw`X=\sum_{i=1}^n I_i,\quad P(X=k)=\binom nk p^k(1-p)^{n-k}`)),
      beat('La combinación cuenta cuántas secuencias tienen ese número de éxitos. Con tres semillas y exactamente dos germinadas, los patrones son uno uno cero, uno cero uno y cero uno uno. Son resultados separados y podemos sumar sus probabilidades.',note('Tres patrones','110, 101 y 011')),
      beat('Si pe es una mitad, cada patrón pesa un octavo. Tres patrones dan tres octavos. La variable solo puede valer cero, uno, dos o tres; pedir cuatro germinaciones en este lote tendría probabilidad cero.',equation(String.raw`P(X=2)=3(1/2)^3=3/8`))
    ]],
    ['Cuándo sirve este modelo',[
      beat('Cada indicador tiene media pe y varianza pe por uno menos pe. Al sumar, la media es ene por pe. La independencia permite sumar también las varianzas sin términos de covarianza.',equation(String.raw`E[X]=np,\quad V(X)=np(1-p)`)),
      beat('Con tres semillas y una mitad obtenemos media uno coma cinco y varianza tres cuartos. La media puede no ser un resultado posible: describe el promedio entre muchas placas, no media semilla observada en una sola.',equation(String.raw`E[X]=1{,}5,\quad V(X)=0{,}75`)),
      beat('Para al menos una germinación conviene el complemento: solo falla si las tres semillas no germinan. Una menos un octavo da siete octavos. El complemento mantiene el número fijo de ensayos y los mismos supuestos.',equation(String.raw`P(X\geq1)=1-(1-p)^n=7/8`)),
      beat('Si una semilla cambia el entorno de otra, o sus probabilidades son distintas, la suma no es automáticamente binomial. En los extremos pe cero o uno el resultado es constante y la varianza cero. Elegir el nombre del modelo nunca sustituye comprobar el diseño.',note('Condiciones','n fijo · p común · independencia mutua'))
    ]]
  ],
  poisson:[
    ['Contamos llegadas durante un tiempo',[
      beat('Hola. Vamos a distinguir una tasa de la media de un recuento Poisson. Un sensor registra llegadas de bacterias con tasa ideal de dos por minuto. Observar tres minutos da seis llegadas esperadas, no dos. La exposición forma parte del parámetro.',note('Exposición','2 llegadas/min × 3 min = 6 llegadas esperadas')),
      beat('Llamamos lambda a la media en la ventana elegida: tasa por exposición. Lambda es positiva y no está limitada por uno. El recuento tiene valores enteros no negativos, sin un máximo fijo de llegadas.',equation(String.raw`\lambda=rt=2\cdot3=6`)),
      beat('La función de masa combina una exponencial, una potencia de lambda y el factorial del recuento. La fórmula da la probabilidad de exactamente ka llegadas; no es una densidad de tiempos.',equation(String.raw`P(X=k)=e^{-\lambda}\frac{\lambda^k}{k!},\quad k=0,1,2,\ldots`)),
      beat('Para cero llegadas, lambda a la potencia cero y cero factorial valen uno. Queda e elevado a menos seis, aproximadamente cero coma cero cero dos cuarenta y ocho. Una media seis no hace imposible observar cero.',equation(String.raw`P(X=0)=e^{-6}\approx0{,}00248`))
    ]],
    ['La ventana y los supuestos importan',[
      beat('Más de dos empieza en tres. Podemos restar de uno la suma de las masas de cero, uno y dos; al menos dos dejaría fuera solo cero y uno. La diferencia es una masa positiva, por lo que no intercambiamos ambas preguntas.',equation(String.raw`P(X>2)=1-P(X\leq2)`)),
      beat('En Poisson coinciden numéricamente media y varianza: seis en esta ventana. Los recuentos de ventanas independientes se suman y sus lambdas también. La suma requiere independencia; no basta con que ambos recuentos tengan marginales Poisson.',equation(String.raw`E[X]=V(X)=\lambda,\quad X_1+X_2\sim\operatorname{Pois}(\lambda_1+\lambda_2)\quad(X_1\perp X_2)`)),
      beat('El mecanismo homogéneo supone tasa constante, independencia de incrementos y ausencia de llegadas agrupadas simultáneas. Si las bacterias se agregan, puede haber más dispersión de la prevista. Una ventana distinta cambia lambda aunque conserve la misma tasa.',note('Supuestos del proceso','Tasa estable · incrementos independientes · llegadas individuales')),
      beat('Poisson también aproxima una binomial cuando hay muchos ensayos con probabilidad pequeña y media ene por pe moderada. Conservamos esa media como lambda, pero la aproximación no es una identidad: Poisson admite recuentos mayores que ene, imposibles en la binomial.',equation(String.raw`\operatorname{Bin}(n,p)\approx\operatorname{Pois}(np)\quad(n\text{ grande},\ p\text{ pequeño})`))
    ]]
  ],
  hipergeometrica:[
    ['La colección se va agotando',[
      beat('Hola. Hoy vamos a contar portadores en una muestra sin reemplazo. Hay ocho organismos, tres portadores y cinco no portadores. Elegimos cuatro y suponemos que todas las muestras de ese tamaño son equiprobables. Retirar un organismo cambia lo disponible para la siguiente extracción.',note('Diseño','N = 8 · portadores K = 3 · muestra n = 4')),
      beat('La hipergeométrica cuenta muestras favorables sobre todas las muestras. Para ka portadores elegimos ka entre los portadores y ene menos ka entre los demás. Multiplicamos esas dos elecciones porque juntas forman una muestra completa.',equation(String.raw`P(X=k)=\frac{\binom Kk\binom{N-K}{n-k}}{\binom Nn}`)),
      beat('Para exactamente dos portadores hay tres maneras de elegir dos entre tres. Para completarlos con dos no portadores hay diez maneras de elegir dos entre cinco. El producto da treinta muestras favorables.',equation(String.raw`\binom32=3,\quad\binom52=10`)),
      beat('En total elegimos cuatro entre ocho de setenta maneras. Treinta entre setenta es tres séptimos, aproximadamente cero coma cuatrocientos veintinueve. No hemos multiplicado cuatro ensayos de probabilidad constante: las extracciones son dependientes.',equation(String.raw`P(X=2)=\frac{3\cdot10}{\binom84}=\frac{30}{70}`))
    ]],
    ['No es una binomial por defecto',[
      beat('El soporte exige suficientes organismos de cada grupo. El mínimo es cero o lo que no podamos cubrir con no portadores; el máximo es el menor entre portadores disponibles y tamaño de muestra. Aquí podemos obtener cero, uno, dos o tres.',equation(String.raw`\max(0,n-(N-K))\leq X\leq\min(n,K)`)),
      beat('La media es ene por la fracción portadora de la población: uno coma cinco. La varianza incorpora una corrección finita que reduce la binomial. Para estos datos vale quince veintiochoavos, no quince dieciseisavos.',equation(String.raw`E[X]=nK/N=1{,}5,\quad V(X)=n\frac KN\left(1-\frac KN\right)\frac{N-n}{N-1}=\frac{15}{28}`)),
      beat('Si extraemos los ocho, el número de portadores es exactamente tres y la corrección hace cero la varianza. Si extraemos seis, las cinco no portadoras no bastan: el mínimo pasa a uno. Son comprobaciones del soporte, no excepciones arbitrarias.',note('Casos límite','Muestra completa: sin variabilidad · seis extraídos: al menos un portador')),
      beat('Con reemplazo e independencia sí tendríamos una binomial, aunque la población siguiera siendo finita. Sin reemplazo puede aproximarla si la fracción extraída es pequeña; extraer aquí la mitad no permite ignorar alegremente el agotamiento.',note('Elegir el modelo','Reemplazo, equiprobabilidad y fracción de muestreo'))
    ]]
  ],
  'geometrica-negativa':[
    ['Seguimos buscando hasta encontrar',[
      beat('Hola. Vamos a contar hasta una parada, en lugar de fijar de antemano el número de pruebas. Buscamos la primera colonia que expresa un marcador. Suponemos pruebas independientes y probabilidad de éxito pe constante y positiva.',note('Regla de parada','Detenerse en el primer éxito')),
      beat('Llamamos efe a los fallos anteriores al primer éxito. Puede valer cero, porque acertar a la primera no exige ningún fallo. Para ka fallos, el orden está fijado: ka fallos y después éxito. Por eso no aparece una combinación de posiciones.',equation(String.raw`P(F=k)=(1-p)^kp,\quad k=0,1,2,\ldots`)),
      beat('Si te cuenta todas las pruebas, te es efe más uno y empieza en uno. Con probabilidad una mitad, primer éxito en la tercera prueba significa dos fallos y un éxito. Multiplicamos sus probabilidades y obtenemos un octavo.',equation(String.raw`P(T=3)=(1/2)^2(1/2)=1/8`)),
      beat('La media de fallos es uno menos pe dividido entre pe; la media de ensayos es uno entre pe. Para una mitad son uno y dos. La espera geométrica no tiene memoria mientras se mantengan independencia y probabilidad constante: los fallos previos no mejoran el siguiente intento.',equation(String.raw`E[F]=(1-p)/p,\quad E[T]=1/p`))
    ]],
    ['Esperar varios éxitos',[
      beat('La binomial negativa cuenta fallos antes del éxito número erre, con erre entero positivo en esta interpretación. El último ensayo debe ser éxito; entre las posiciones anteriores colocamos erre menos uno éxitos y ka fallos.',equation(String.raw`P(F=k)=\binom{k+r-1}{r-1}p^r(1-p)^k`)),
      beat('Con un fallo antes del segundo éxito hay tres ensayos. El fallo puede estar en cualquiera de las dos primeras posiciones; el último éxito permanece fijo. Para pe una mitad, dos patrones de un octavo dan un cuarto.',equation(String.raw`P(F=1)=2(1/2)^3=1/4`)),
      beat('La media de fallos es erre por uno menos pe entre pe, y la varianza divide de nuevo por pe. Con dos éxitos y probabilidad una mitad, esperamos dos fallos, con varianza cuatro; el total de ensayos tiene media cuatro.',equation(String.raw`E[F]=r(1-p)/p=2,\quad V(F)=r(1-p)/p^2=4`)),
      beat('Antes de usar una función de cálculo, averigua si recibe fallos o ensayos totales. La conversión suma erre, no siempre uno. Si pe fuera cero nunca llegaríamos al éxito; si fuera uno no habría fallos. Cambiar la regla de parada cambia la variable, no solo su etiqueta.',equation(String.raw`T=F+r,\quad E[T]=r/p`))
    ]]
  ],
  'uniforme-montecarlo':[
    ['Igual longitud, igual probabilidad',[
      beat('Hola. Hoy vamos a distinguir dos uniformes y a generar valores mediante cuantiles. Una uniforme continua entre dos y seis minutos asigna igual probabilidad a intervalos de igual longitud dentro de esa ventana; no asigna masa positiva a cada instante.',note('Ventana','De 2 a 6 minutos')),
      beat('Su densidad es uno dividido entre la longitud del soporte y cero fuera. La acumulada interior mide la fracción recorrida desde el extremo izquierdo. Invertir esa fracción da el cuantil: extremo izquierdo más nivel por anchura.',equation(String.raw`f(x)=\frac1{b-a},\quad F(x)=\frac{x-a}{b-a},\quad Q(u)=a+u(b-a)`)),
      beat('Entre tres y cinco hay dos minutos de los cuatro disponibles, por lo que la probabilidad es una mitad. Si el intervalo solicitado sale de la ventana, medimos solo la intersección con el soporte.',equation(String.raw`P(3<X<5)=\frac{5-3}{6-2}=1/2`)),
      beat('El centro es cuatro y la varianza es anchura al cuadrado dividida entre doce, cuatro tercios. El cuantil del setenta y cinco por ciento es cinco: hemos recorrido tres cuartos de los cuatro minutos desde dos.',equation(String.raw`E[X]=4,\quad V(X)=16/12,\quad Q(0{,}75)=5`))
    ]],
    ['Usar el azar para aproximar',[
      beat('Para simular una distribución, generamos primero un nivel uniforme entre cero y uno y aplicamos su cuantil. Si la acumulada tiene saltos, elegimos el primer valor que alcance el nivel: la igualdad exacta con ese nivel quizá no tenga solución.',equation(String.raw`U\sim U(0,1),\quad X=Q(U),\quad Q(u)=\inf\{x:F(x)\geq u\}`)),
      beat('Una uniforme discreta es distinta: elegir uno de ene enteros equiprobables asigna masa uno entre ene a cada entero. Para los enteros del uno al ene, la media es ene más uno entre dos y la varianza ene al cuadrado menos uno entre doce.',equation(String.raw`p(k)=1/n,\quad E[X]=(n+1)/2,\quad V(X)=(n^2-1)/12`)),
      beat('Monte Carlo repite el mecanismo para aproximar probabilidades o promedios. Para nuestro intervalo contamos valores entre tres y cinco y dividimos por repeticiones. Bajo simulaciones independientes, el error estándar de esa fracción cae como uno entre raíz del número de repeticiones.',equation(String.raw`\widehat p=m/N,\quad\operatorname{SE}(\widehat p)=\sqrt{p(1-p)/N}`)),
      beat('Ningún lote tiene que dar exactamente una mitad. Cuadruplicar repeticiones reduce a la mitad el error estándar, no elimina el azar. Tampoco arregla un soporte mal elegido ni demuestra que el mecanismo simulado sea el de la población real.',note('Alcance','Más repeticiones reducen error Monte Carlo, no error de modelo'))
    ]]
  ],
  exponencial:[
    ['Del número de llegadas al tiempo de espera',[
      beat('Hola. Vamos a calcular tiempos de espera y a entender cuándo es razonable la falta de memoria. En un proceso de llegadas homogéneo de Poisson, la espera hasta la siguiente llegada es exponencial. Aquí la espera media es cinco minutos: su escala.',note('Escala y tasa','Media 5 min · tasa 0,2 por min')),
      beat('La tasa es la inversa de la escala: cero coma dos por minuto. La densidad multiplica la tasa por la exponencial de menos tasa por tiempo. La supervivencia omite el factor inicial y mide el área que queda por esperar.',equation(String.raw`f_T(t)=r e^{-rt},\quad S(t)=P(T>t)=e^{-rt},\quad t\geq0`)),
      beat('Para seguir esperando después de cinco minutos sustituimos tasa cero coma dos y tiempo cinco. El producto del exponente vale uno y no tiene unidades. La supervivencia es e elevado a menos uno, aproximadamente cero coma trescientos sesenta y ocho.',equation(String.raw`P(T>5)=e^{-0{,}2\cdot5}\approx0{,}368`)),
      beat('Terminar antes de cinco es el complemento, aproximadamente cero coma seiscientos treinta y dos. La media es cinco y la varianza veinticinco minutos cuadrados; la desviación típica vuelve a ser cinco minutos. No confundimos densidad, supervivencia y acumulada.',equation(String.raw`F(t)=1-S(t),\quad E[T]=1/r,\quad V(T)=1/r^2`))
    ]],
    ['Qué significa no tener memoria',[
      beat('Ya llevamos tres minutos sin llegada y preguntamos por esperar dos minutos adicionales. En términos del tiempo total pedimos superar cinco, sabiendo que ya se superaron tres. No es simplemente la probabilidad incondicional de superar cinco.',equation(String.raw`P(T>5\mid T>3)=\frac{S(5)}{S(3)}`)),
      beat('Dividimos las supervivencias: los exponentes se restan y desaparecen los tres minutos transcurridos. Queda la supervivencia de dos minutos, aproximadamente cero coma seiscientos setenta. Esa cancelación demuestra la falta de memoria del modelo.',equation(String.raw`e^{-0{,}2\cdot5}/e^{-0{,}2\cdot3}=e^{-0{,}2\cdot2}`)),
      beat('El riesgo instantáneo es densidad dividida por supervivencia y aquí vale siempre la tasa. Por eso la espera restante conserva la misma ley. Un mecanismo que envejece o acumula daño no cumple automáticamente esa propiedad.',equation(String.raw`h(t)=f_T(t)/S(t)=r`)),
      beat('Si buscamos un percentil, invertimos la acumulada: menos escala por logaritmo de uno menos el nivel. La mediana es cinco por logaritmo de dos, unos tres coma cuarenta y siete minutos; no coincide con la media porque la distribución es asimétrica.',equation(String.raw`Q(u)=-\frac1r\log(1-u),\quad Q(0{,}5)=5\log2`))
    ]]
  ],
  normal:[
    ['Hablar en desviaciones',[
      beat('Hola. Vamos a pasar de longitudes a desviaciones típicas para calcular áreas normales y percentiles. Proponemos una normal de media cuarenta micrómetros y desviación cuatro. Es un supuesto ilustrativo, no una ley universal de las medidas biológicas.',note('Modelo','Media μ = 40 μm · desviación σ = 4 μm')),
      beat('La normal es simétrica alrededor de su media; su densidad combina la distancia al centro con la escala. Escribimos ene de mu y sigma al cuadrado: el segundo parámetro es la varianza, aunque muchas funciones de cálculo reciben la desviación.',equation(String.raw`X\sim N(\mu,\sigma^2),\quad f(x)=\frac{e^{-(x-\mu)^2/(2\sigma^2)}}{\sigma\sqrt{2\pi}},\quad\sigma>0`)),
      beat('Tipificar resta la media y divide por la desviación positiva. Así conservamos el orden y expresamos la distancia sin unidades. Cuarenta y ocho menos cuarenta, dividido entre cuatro, son dos desviaciones sobre el centro.',equation(String.raw`Z=(X-\mu)/\sigma\sim N(0,1)`),equation(String.raw`z=(48-40)/4=2`)),
      beat('Fi es la acumulada estándar: área a la izquierda de zeta, no altura de la campana. En zeta dos vale aproximadamente cero coma novecientos setenta y siete. La curva dibujada termina, pero la normal del modelo continúa por toda la recta.',note('Φ(z)','Área a la izquierda en la normal estándar'))
    ]],
    ['Pedir un intervalo o un percentil',[
      beat('Para un intervalo tipificamos ambos extremos y restamos acumuladas. Treinta y seis está a menos una desviación y cuarenta y ocho a más dos. Esa traducción conserva el área aunque cambie la escala del eje.',equation(String.raw`P(a<X<b)=\Phi((b-\mu)/\sigma)-\Phi((a-\mu)/\sigma)`)),
      beat('Fi de dos menos fi de menos uno da aproximadamente cero coma ochocientos dieciocho seis. Es probabilidad del intervalo, no de sus extremos. Para la cola superior usaríamos uno menos fi del umbral tipificado.',equation(String.raw`P(36<X<48)=\Phi(2)-\Phi(-1)\approx0{,}8186`)),
      beat('Un percentil invierte la pregunta: recibimos una probabilidad y buscamos una longitud. El nivel noventa y cinco por ciento corresponde al cuantil estándar uno coma seis cuatro cuatro ocho cinco. Deshacemos la tipificación multiplicando por cuatro y sumando cuarenta.',equation(String.raw`Q_X(u)=\mu+\sigma\Phi^{-1}(u)`),equation(String.raw`q_{0{,}95}=40+4(1{,}64485)\approx46{,}58`)),
      beat('Esta normal asigna una cola a longitudes negativas, aunque aquí sea diminuta. Esa es una limitación del modelo para una magnitud física positiva. Tipificar una variable cualquiera no la convierte en normal: solo cambia centro y escala.',note('Alcance','Comprobar normalidad y rango de aplicación, no solo media y varianza'))
    ]]
  ],
  gamma:[
    ['Esperar varias etapas',[
      beat('Hola. Vamos a modelar una espera que requiere completar varias etapas. Una detección necesita tres llegadas de un proceso homogéneo. Sus esperas son exponenciales independientes, todas con media dos minutos. La espera total suma esas tres duraciones.',note('Etapas','3 esperas independientes · escala 2 min')),
      beat('Esa suma es gamma con forma tres y escala dos. La escala conserva unidades de tiempo; la forma cuenta etapas en este ejemplo entero. La tasa equivalente es una mitad por minuto. Forma y escala deben ser positivas.',equation(String.raw`T\sim\Gamma(k=3,\alpha=2),\quad r=1/\alpha=0{,}5`)),
      beat('La densidad contiene una potencia del tiempo y una exponencial decreciente. La función gamma mayúscula normaliza su área. Para forma entera ka, gamma de ka es ka menos uno factorial; no es una variable aleatoria adicional.',equation(String.raw`f_T(t)=\frac{t^{k-1}e^{-t/\alpha}}{\alpha^k\Gamma(k)},\quad t>0`)),
      beat('La media suma tres esperas medias de dos minutos: seis. La varianza suma tres varianzas de cuatro porque las etapas son independientes: doce minutos cuadrados. En general son forma por escala y forma por escala al cuadrado.',equation(String.raw`E[T]=k\alpha=6,\quad\operatorname{Var}(T)=k\alpha^2=12`))
    ]],
    ['Probabilidad de completar las etapas',[
      beat('Para forma tres, gamma de tres es dos factorial, igual a dos. Sustituimos los parámetros y queda tiempo al cuadrado por exponencial de menos tiempo entre dos, dividido entre dieciséis. La altura sigue siendo densidad, no probabilidad de terminar exactamente ahí.',equation(String.raw`\Gamma(3)=2,\quad f_T(t)=t^2e^{-t/2}/16`)),
      beat('Terminar antes de seis minutos requiere acumular de cero a seis. Para tres etapas podemos usar la cola finita: uno menos la exponencial por uno más el tiempo relativo más su cuadrado entre dos. En seis da aproximadamente cero coma quinientos setenta y siete.',equation(String.raw`F_T(t)=1-e^{-t/2}\left(1+t/2+(t/2)^2/2\right)`),equation(String.raw`F_T(6)=1-8{,}5e^{-3}\approx0{,}5768`)),
      beat('Con forma uno recuperamos la exponencial. Sumar gammas independientes conserva la escala común y suma las formas; si sus escalas son distintas, esa simplificación no vale en general. No confundimos sumar etapas con multiplicar su duración.',equation(String.raw`\Gamma(k_1,\alpha)+\Gamma(k_2,\alpha)\sim\Gamma(k_1+k_2,\alpha)\quad\text{con independencia}`)),
      beat('La gamma matemática admite forma real positiva, aunque ya no cuente literalmente etapas enteras. En software revisamos si el segundo parámetro es escala o tasa. Y, salvo el caso exponencial, no trasladamos automáticamente la falta de memoria a toda la familia gamma.',note('Comprobación','Forma positiva · escala positiva · parametrización · mecanismo'))
    ]]
  ],
  'cauchy-weibull':[
    ['La simetría no garantiza una media',[
      beat('Hola. Hoy compararemos dos límites de nuestra intuición: una distribución simétrica sin media y una espera cuyo riesgo puede cambiar. La Cauchy tiene localización equis sub cero y escala gamma positiva. Su centro es mediana y moda, pero no esperanza.',note('Cauchy','Localización x₀ · escala γ > 0')),
      beat('Su acumulada usa arco tangente, la inversa de la tangente en su rama principal. Restar acumuladas permite calcular intervalos aunque los momentos no existan. La fórmula incluye el cociente de distancia al centro entre escala.',equation(String.raw`F(x)=\tfrac12+\tfrac1\pi\arctan((x-x_0)/\gamma)`)),
      beat('A una escala por debajo y por encima del centro, la arco tangente vale menos y más pi entre cuatro. Las acumuladas son un cuarto y tres cuartos; el intervalo contiene una mitad de probabilidad. El centro sigue siendo un umbral válido.',equation(String.raw`P(x_0-\gamma<X<x_0+\gamma)=3/4-1/4=1/2`)),
      beat('En la Cauchy estándar, la integral positiva de valor por densidad crece como un logaritmo sin límite. La negativa también diverge en valor absoluto. No pueden cancelarse para dar esperanza cero; sin esperanza, tampoco definimos su varianza.',equation(String.raw`\int_0^b\frac{x}{\pi(1+x^2)}\,dx=\frac{\log(1+b^2)}{2\pi}\longrightarrow\infty`))
    ]],
    ['Un modelo distinto para tiempos',[
      beat('Weibull describe tiempos no negativos con escala alfa y forma beta positivas. Su supervivencia eleva el tiempo relativo a beta antes de aplicar la exponencial negativa. El cociente tiempo entre escala no tiene unidades.',equation(String.raw`S(t)=e^{-(t/\alpha)^\beta},\quad t\geq0`)),
      beat('Con escala dos y forma dos, a tiempo dos el cociente es uno y su cuadrado también uno. La supervivencia es e elevado a menos uno. Que dos sea la escala no lo convierte en media: la media depende también de la forma.',equation(String.raw`S(2)=e^{-(2/2)^2}=e^{-1}`),equation(String.raw`E[T]=\alpha\Gamma(1+1/\beta)`)),
      beat('El riesgo divide densidad por supervivencia. Su potencia del tiempo crece si beta supera uno, decrece si está entre cero y uno y es constante si beta vale uno. Solo en ese último caso recuperamos la exponencial y su falta de memoria.',equation(String.raw`h(t)=\frac\beta\alpha(t/\alpha)^{\beta-1}`)),
      beat('Un percentil se obtiene deshaciendo la exponencial y después la potencia. Elegir Weibull exige pensar si ese riesgo creciente o decreciente representa el mecanismo. Una curva flexible no demuestra envejecimiento ni causalidad por sí sola.',equation(String.raw`Q(u)=\alpha[-\log(1-u)]^{1/\beta},\quad0<u<1`))
    ]]
  ],
  'calculo-modelos':[
    ['Primero traducimos la pregunta',[
      beat('Hola. Vamos a decidir qué operación pedir a una calculadora y cómo comprobar su respuesta. Primero definimos la variable, su soporte y sus unidades. Después distinguimos valor exacto, acumulación hasta un umbral y umbral para una probabilidad dada.',note('Operaciones','Masa o densidad · acumulada · cuantil · generación')),
      beat('En un recuento, una masa responde exactamente dos. La acumulada hasta dos reúne cero, uno y dos. Son preguntas diferentes aunque reciban el mismo número dos como argumento.',equation(String.raw`P(X\leq2)=P(X=0)+P(X=1)+P(X=2)`)),
      beat('Para una variable con densidad, evaluar la densidad da altura por unidad, no probabilidad puntual. Un intervalo requiere integrar o restar acumuladas. La forma de la pregunta decide la operación antes de que el software calcule nada.',equation(String.raw`P(a<X<b)=F(b)-F(a)`)),
      beat('En la convención habitual de R, la letra de pide masa o densidad, pe acumulada, cu cuantil y erre simulación. El mismo prefijo de puede devolver objetos con interpretación distinta en discreto y continuo; no basta con copiar su salida.',note('Convención de cálculo','d: masa/densidad · p: acumulada · q: cuantil · r: simulación'))
    ]],
    ['Comprobar límites y parámetros',[
      beat('Más de dos empieza en tres y su complemento incluye dos. Al menos dos empieza en dos y su complemento acaba en uno. Esa diferencia se pierde si usamos la misma cola para ambas expresiones.',equation(String.raw`P(X>2)=1-F(2),\quad P(X\geq2)=1-F(1)`)),
      beat('Para una cola muy pequeña conviene una función de cola superior, si existe, en lugar de restar de uno una acumulada ya redondeada a uno. La estabilidad numérica no cambia el suceso, pero evita perder cifras significativas.',note('Precisión','Conservar decimales · usar cola directa cuando sea posible')),
      beat('Traducimos también los parámetros: normal recibe a menudo desviación aunque escribamos varianza en el modelo; gamma distingue forma, escala y tasa. Si la escala es dos, la tasa es una mitad, no dos. Verificamos además los supuestos que justifican la familia elegida.',equation(String.raw`\sigma=\sqrt{V(X)},\quad r=1/\alpha`)),
      beat('Comprobamos finalmente rango, unidades y dirección del efecto. Una probabilidad queda entre cero y uno; un cuantil de tiempo vuelve a minutos. Podemos calcular el complemento o sustituir un cuantil en la acumulada para comprobar la respuesta, recordando que una acumulada discreta puede saltar sobre el nivel.',note('Cierre','Soporte · parámetros · operación · plausibilidad contextual'))
    ]]
  ],
  'familia-exponencial':[
    ['Los datos se quedan quietos',[
      beat('Hola. Vamos a reconocer una estructura común de distribuciones y a conectarla con estimación. Observamos dos, cuatro y tres colonias en placas de igual exposición. Suponemos recuentos Poisson independientes con una misma media desconocida. Los datos quedan fijos; compararemos medias candidatas.',note('Datos observados','2, 4 y 3; suma 9; media 3')),
      beat('La verosimilitud es el producto de las masas de los datos visto como función del parámetro. Reunimos tres exponenciales y sumamos los exponentes de lambda: queda exponencial de menos tres lambda por lambda a la novena, entre los factoriales observados.',equation(String.raw`L(\lambda)=\prod_{i=1}^3p_\lambda(x_i)=e^{-3\lambda}\lambda^9/(2!4!3!)`)),
      beat('El logaritmo, creciente, conserva el máximo y convierte productos en sumas. Su derivada es nueve entre lambda menos tres. Se anula en tres; la segunda derivada es negativa para lambda positiva, de modo que allí hay un máximo.',equation(String.raw`\ell'(\lambda)=9/\lambda-3,\quad\ell''(\lambda)=-9/\lambda^2<0`)),
      beat('La estimación de máxima verosimilitud es la media observada, tres. No es una probabilidad posterior sobre lambda ni demuestra que el modelo sea correcto. Con tamaño fijo, la suma nueve contiene toda la dependencia en lambda; los factoriales dependen solo de los datos.',equation(String.raw`\widehat\lambda=\overline x=3,\quad T(\boldsymbol x)=\sum_i x_i`))
    ]],
    ['Una familia, no solo una distribución',[
      beat('Familia exponencial no significa distribución exponencial de esperas. En la forma de un parámetro con soporte fijo separamos hache, que depende del dato; te, el resumen; eta, el parámetro natural; y a, que ajusta la normalización.',equation(String.raw`p(x)=h(x)\exp\{\eta T(x)-A(\eta)\}`)),
      beat('Para Poisson, hache es uno entre el factorial, te es el recuento, eta es logaritmo de lambda y a es exponencial de eta. Al sustituir recuperamos exactamente la masa Poisson. El soporte de enteros no negativos no depende de lambda positiva.',equation(String.raw`h(x)=1/x!,\quad T(x)=x,\quad\eta=\log\lambda,\quad A(\eta)=e^\eta`)),
      beat('La binomial con ene fijo también pertenece a esta familia, con parámetro natural logaritmo de pe entre uno menos pe, para probabilidades interiores. En una normal uniparamétrica debemos fijar media o varianza; dejar ambas libres requiere la extensión multiparamétrica.',equation(String.raw`\eta_{\text{binomial}}=\log\frac p{1-p},\quad0<p<1`)),
      beat('Como ampliación, un modelo lineal generalizado Poisson puede relacionar el logaritmo de la media con una dosis. Volver mediante exponencial asegura media positiva. No hemos ajustado esos coeficientes con las tres placas, ni elegido el enlace para probar independencia o dispersión Poisson.',equation(String.raw`\log\mu=\beta_0+\beta_1d\quad\Rightarrow\quad\mu=e^{\beta_0+\beta_1d}`))
    ]]
  ],
  'conjunta-discreta':[
    ['Dos medidas del mismo organismo',[
      beat('Hola. Vamos a describir dos medidas simultáneas sin perder qué parejas pueden ocurrir. Equis indica un marcador e i griega una respuesta del mismo organismo. La masa conjunta asigna una probabilidad a cada pareja, no dos probabilidades separadas.',note('Tabla conjunta','Filas: X; columnas: Y')),
      beat('Una masa conjunta válida no tiene celdas negativas y suma uno sobre todo el soporte. Usamos cero coma dos y cero coma tres en la fila equis cero, y cero coma uno y cero coma cuatro en la fila equis uno. Todas las parejas llevan su peso explícito.',equation(String.raw`p_{X,Y}(x,y)=P(X=x,Y=y),\quad\sum_x\sum_y p_{X,Y}(x,y)=1`),note('Masas por filas','X=0: (0,2; 0,3) · X=1: (0,1; 0,4)')),
      beat('La coma dentro de pe exige ambas condiciones a la vez. Para equis uno e i griega uno seleccionamos solo la última celda: cero coma cuatro. No sumamos toda su fila ni multiplicamos marginales sin justificar independencia.',equation(String.raw`P(X=1,Y=1)=0{,}4`)),
      beat('La suma de la fila equis cero, en cambio, reúne las dos respuestas posibles de ese marcador. Vale una mitad. La distinción entre celda y fila traduce dos sucesos diferentes, no dos maneras intercambiables de operar.',equation(String.raw`P(X=0)=0{,}2+0{,}3=0{,}5`))
    ]],
    ['Pasar de una celda a una región',[
      beat('La acumulada conjunta reúne parejas que no superan ninguno de dos umbrales. Deben cumplirse simultáneamente ambas desigualdades. Se suman las celdas del rectángulo inferior izquierdo, incluidos sus límites.',equation(String.raw`F_{X,Y}(x,y)=P(X\leq x,Y\leq y)`)),
      beat('Con ambos umbrales cero entra solo la primera celda y obtenemos cero coma dos. Con equis cero e i griega uno entra toda la primera fila y obtenemos una mitad. La acumulada está definida aunque usemos umbrales que no sean valores observables.',equation(String.raw`F(0,0)=0{,}2,\quad F(0,1)=0{,}5`)),
      beat('Para la región donde la suma de las dos variables es al menos uno, seleccionamos cero uno, uno cero y uno uno. Sus masas suman cero coma ocho. La última celda satisface ambas alternativas, pero la contamos una sola vez.',equation(String.raw`P(X+Y\geq1)=0{,}3+0{,}1+0{,}4=0{,}8`)),
      beat('Una pareja imposible lleva masa cero aunque aparezca un hueco en la tabla. Y conocer las marginales no reconstruye en general qué valores se emparejan: distintas conjuntas pueden compartir las mismas sumas de filas y columnas.',note('Antes de operar','Soporte · región solicitada · pesos de las parejas'))
    ]]
  ],
  multinomial:[
    ['Más de dos categorías, un total fijo',[
      beat('Hola. Vamos a repartir un número fijo de observaciones entre varias categorías. Clasificamos tres células como en reposo, activadas o dañadas: categorías excluyentes y exhaustivas. Suponemos independencia entre células y probabilidades comunes una mitad, un cuarto y un cuarto.',note('Probabilidades','Reposo 1/2 · activada 1/4 · dañada 1/4')),
      beat('La masa multinomial multiplica el peso de una secuencia por cuántas secuencias producen los mismos recuentos. El numerador factorial ordena todos los ensayos y los factoriales del denominador eliminan intercambios dentro de cada categoría.',equation(String.raw`P(\boldsymbol X=\boldsymbol x)=\frac{n!}{\prod_i x_i!}\prod_i p_i^{x_i},\quad\sum_i x_i=n`)),
      beat('Para una célula de cada categoría, un orden concreto pesa una mitad por un cuarto por un cuarto: un treintaidosavo. Hay seis órdenes, porque tres factorial dividido entre tres factoriales de uno es seis. Obtenemos tres dieciseisavos.',equation(String.raw`P(1,1,1)=\frac{3!}{1!1!1!}(1/2)(1/4)(1/4)=3/16`)),
      beat('Los recuentos deben ser enteros no negativos y sumar tres. Una terna como dos, dos, cero es imposible, aunque cada componente por separado parezca admisible. El soporte conjunto es parte del modelo, no una comprobación opcional.',equation(String.raw`R+A+D=3`))
    ]],
    ['Los recuentos comparten el total',[
      beat('Si miramos solo activadas, las otras dos categorías se agrupan como no activada. Cada célula aporta un indicador Bernoulli, así que el recuento marginal es binomial con tres ensayos y probabilidad un cuarto. Su media es tres cuartos y su varianza nueve dieciseisavos.',equation(String.raw`A\sim\operatorname{Bin}(3,1/4),\quad E[A]=3/4,\quad V(A)=9/16`)),
      beat('Entre células los indicadores son independientes. Dentro de una misma célula, reposo y activación no pueden ocurrir juntos: su producto vale cero. Su covarianza es por tanto cero menos el producto de sus probabilidades.',equation(String.raw`\operatorname{Cov}(I_R,I_A)=0-p_Rp_A`)),
      beat('Al sumar tres células, las covarianzas entre ensayos distintos desaparecen y quedan tres aportes negativos. Entre reposo y activadas obtenemos menos tres octavos. El total fijo genera dependencia entre recuentos aunque los ensayos sean independientes.',equation(String.raw`\operatorname{Cov}(R,A)=-3(1/2)(1/4)=-3/8`)),
      beat('Si agrupamos categorías, sumamos sus probabilidades y conservamos una multinomial con menos categorías. Si las probabilidades cambian entre células o las observaciones se influyen, el modelo multinomial común deja de estar justificado. La covarianza negativa de sus recuentos no demuestra causalidad biológica.',note('Distinguir','Independencia entre ensayos ≠ independencia entre recuentos'))
    ]]
  ],
  marginales:[
    ['Mirar solo una de las medidas',[
      beat('Hola. Vamos a obtener la distribución de una sola medida a partir de dos medidas conjuntas. Usamos filas cero coma dos, cero coma tres, y cero coma uno, cero coma cuatro. Ahora preguntamos solo por i griega; no se ha observado ni fijado equis.',note('Tabla conjunta','X=0: (0,2; 0,3) · X=1: (0,1; 0,4)')),
      beat('La marginal suma la masa conjunta sobre todos los valores de la coordenada que descartamos. Las posibilidades de equis son excluyentes y cubren todos los casos; por eso sumarlas no duplica ni pierde organismos.',equation(String.raw`p_Y(y)=\sum_xp_{X,Y}(x,y)`)),
      beat('Para i griega uno sumamos su columna: cero coma tres más cero coma cuatro, igual a cero coma siete. Para i griega cero obtenemos cero coma tres. Ambas marginales suman uno, como debe hacer cualquier masa válida.',equation(String.raw`P(Y=1)=0{,}3+0{,}4=0{,}7`)),
      beat('No dividimos por una fila: eso condicionaría en un valor conocido de equis. Marginalizar borra esa distinción, mientras que condicionar conserva una parte de los casos y vuelve a normalizarla. Ninguna de las dos operaciones presupone independencia.',note('Distinción','Marginal: todos los X · condicional: X fijada'))
    ]],
    ['Hacer lo mismo con una densidad',[
      beat('En continuo sustituimos la suma por integral. Tomamos densidad una mitad sobre el triángulo no negativo de capacidad dos. Su área es dos y altura por área da uno: la conjunta está normalizada.',note('Soporte','x ≥ 0; y ≥ 0; x+y ≤ 2; densidad 0,5')),
      beat('La fórmula marginal integra sobre toda la otra coordenada, pero fuera del triángulo la conjunta es cero. Con equis entre cero y dos, i griega recorre de cero a dos menos equis. Integrar la altura constante da longitud del corte entre dos.',equation(String.raw`f_X(x)=\int_{-\infty}^{\infty}f_{X,Y}(x,y)\,dy=\int_0^{2-x}0{,}5\,dy=(2-x)/2`)),
      beat('Fuera de cero a dos la marginal es cero. Dentro disminuye porque al aumentar equis queda menos espacio para i griega. Su integral vuelve a ser uno; una conjunta constante no implica marginal uniforme cuando cambia la longitud del corte.',equation(String.raw`\int_0^2(2-x)/2\,dx=[x-x^2/4]_0^2=1`)),
      beat('Si buscamos una probabilidad de equis, todavía hay que integrar esta marginal sobre el intervalo pedido. Su valor en un punto sigue siendo densidad. Las marginales permiten responder sobre una coordenada, pero no recuperan por sí solas la relación entre ambas.',note('Comprobación','Límites del corte · cero fuera · integral uno · unidades'))
    ]]
  ],
  'conjunta-condicional':[
    ['Dentro de una fila',[
      beat('Hola. Vamos a actualizar una distribución al conocer otra medida. En la tabla conjunta nos dicen que equis vale uno. Su fila contiene cero coma uno y cero coma cuatro y suma una mitad. Solo esa fila es compatible con la información.',note('Fila X=1','Y=0: 0,1 · Y=1: 0,4; total 0,5')),
      beat('La masa condicional divide cada celda de la fila por su marginal positiva. El numerador exige las dos condiciones; el denominador reúne todo el grupo conocido. Dividir por cero no definiría esta distribución.',equation(String.raw`p_{Y\mid X}(y\mid x)=p_{X,Y}(x,y)/p_X(x),\quad p_X(x)>0`)),
      beat('Para i griega uno dividimos cero coma cuatro entre cero coma cinco: cero coma ocho. Para i griega cero dividimos cero coma uno entre cero coma cinco: cero coma dos. La fila condicionada vuelve a sumar uno.',equation(String.raw`P(Y=1\mid X=1)=0{,}4/0{,}5=0{,}8`),equation(String.raw`P(Y=0\mid X=1)=0{,}1/0{,}5=0{,}2`)),
      beat('La marginal de i griega uno era cero coma siete y la condicional es cero coma ocho: conocer equis cambia esa probabilidad. Eso refuta independencia. Invertir la condición exigiría dividir por otra marginal y respondería a una pregunta distinta.',note('Interpretación','Cambió la referencia: todos los organismos → fila X=1'))
    ]],
    ['Un corte continuo también se normaliza',[
      beat('En continuo, la probabilidad de equis igual a un punto es cero: no dividimos por ella. Una conjunta con densidad permite construir la densidad condicional como cociente por la densidad marginal, allí donde esta es positiva.',equation(String.raw`f_{Y\mid X}(y\mid x)=f_{X,Y}(x,y)/f_X(x),\quad f_X(x)>0`)),
      beat('En el triángulo de capacidad dos, la conjunta vale una mitad. Fijar equis cero coma cinco deja i griega entre cero y uno coma cinco. La marginal es una mitad por esa longitud: tres cuartos. Dividir da dos tercios dentro del corte y cero fuera.',equation(String.raw`f_{Y\mid X}(y\mid0{,}5)=\frac{0{,}5}{0{,}75}=2/3`)),
      beat('La integral del corte condicionado es dos tercios por uno coma cinco: uno. Para i griega menor que cero coma siete cinco, integramos la mitad de ese intervalo y obtenemos una mitad. La altura dos tercios no era directamente esa probabilidad.',equation(String.raw`\int_0^{1{,}5}(2/3)\,dy=1,\quad P(Y<0{,}75\mid X=0{,}5)=1/2`)),
      beat('En este modelo la condicional es uniforme entre cero y dos menos equis para cada equis interior. Su soporte cambia al conocer equis, lo que vuelve a mostrar dependencia. En el extremo donde la marginal se anula no extendemos el cociente dividiendo por cero.',equation(String.raw`Y\mid X=x\sim U(0,2-x),\quad0<x<2`))
    ]]
  ],
  'normal-bivariante':[
    ['Conocer una señal ayuda con la otra',[
      beat('Hola. Vamos a usar una señal para actualizar otra bajo normalidad conjunta. Sus medias son doce y treinta, sus desviaciones dos y cuatro, y su correlación cero coma seis. Que ambas marginales sean normales no basta para garantizar una normal bivariante.',note('Modelo conjunto','μX=12; μY=30; σX=2; σY=4; ρ=0,6')),
      beat('La condicional es normal. Su media parte del centro de i griega y añade la desviación observada de equis, traducida mediante correlación y razón de desviaciones. Así las unidades del desplazamiento vuelven a ser las de i griega.',equation(String.raw`\mu_{Y\mid x}=\mu_Y+\rho\frac{\sigma_Y}{\sigma_X}(x-\mu_X)`)),
      beat('Observamos equis catorce, una desviación por encima de doce. I griega se desplaza cero coma seis de sus desviaciones: dos coma cuatro. Su media condicional pasa de treinta a treinta y dos coma cuatro, no necesariamente al valor que observaremos.',equation(String.raw`E[Y\mid X=14]=30+0{,}6(4/2)(14-12)=32{,}4`)),
      beat('La varianza condicional es la marginal por uno menos el cuadrado de la correlación. De dieciséis queda diez coma veinticuatro. Su raíz es tres coma dos: esa será la desviación para tipificar, no diez coma veinticuatro.',equation(String.raw`\sigma^2_{Y\mid x}=\sigma_Y^2(1-\rho^2)`),equation(String.raw`\operatorname{Var}(Y\mid X)=16(1-0{,}6^2)=10{,}24`))
    ]],
    ['Calcular con la curva condicionada',[
      beat('Queremos superar treinta y cinco coma seis una vez conocido equis catorce. La distribución apropiada es normal de media treinta y dos coma cuatro y varianza diez coma veinticuatro. Tipificamos usando su desviación tres coma dos y obtenemos zeta uno.',equation(String.raw`Y\mid X=14\sim N(32{,}4,10{,}24)`),equation(String.raw`z=(35{,}6-32{,}4)/3{,}2=1`)),
      beat('Fi de uno mide el área izquierda y necesitamos la derecha: uno menos fi de uno, aproximadamente cero coma quince ochenta y siete. Usar la media y desviación marginales respondería antes de conocer equis, no a esta pregunta condicionada.',equation(String.raw`P(Y>35{,}6\mid X=14)=1-\Phi(1)\approx0{,}1587`)),
      beat('Cambiar el valor observado de equis cambia la media condicional, pero no esta varianza residual del modelo. Si la correlación fuera cero, recuperaríamos la marginal y habría independencia gracias a la normalidad conjunta. No generalizamos esa conclusión a otras familias.',note('Normal conjunta','Covarianza cero implica independencia solo con la hipótesis adecuada')),
      beat('Para la densidad bivariante ordinaria exigimos desviaciones positivas y correlación estrictamente entre menos uno y uno. En los extremos la pareja queda sobre una recta y no tiene esa densidad sobre el plano. Una predicción condicionada tampoco demuestra que una señal cause la otra.',equation(String.raw`\sigma_X,\sigma_Y>0,\quad|\rho|<1`))
    ]]
  ],
  'independencia-variables':[
    ['Una tabla que se puede separar',[
      beat('Hola. Vamos a comprobar independencia de variables a partir de su distribución completa. Conocer una no debe cambiar la ley de la otra. La caracterización general exige que la acumulada conjunta se separe en las dos acumuladas marginales para todos los umbrales.',equation(String.raw`F_{X,Y}(x,y)=F_X(x)F_Y(y)\quad\text{para todo }(x,y)`)),
      beat('En una tabla discreta esto equivale a factorizar cada masa en el producto de sus marginales. Consideremos dos filas iguales: cero coma dos y cero coma tres. Las marginales de equis son una mitad y una mitad; las de i griega, cero coma cuatro y cero coma seis.',equation(String.raw`p_{X,Y}(x,y)=p_X(x)p_Y(y)`)),
      beat('La primera celda es una mitad por cero coma cuatro, igual a cero coma dos. La segunda es una mitad por cero coma seis, igual a cero coma tres. La otra fila verifica los mismos productos, así que aquí sí factoriza toda la tabla.',equation(String.raw`0{,}2=0{,}5\cdot0{,}4,\quad0{,}3=0{,}5\cdot0{,}6`)),
      beat('Una coincidencia aislada no demuestra independencia; una discrepancia basta para refutarla. Tampoco basta comparar medias ni obtener correlación cero. El criterio habla de todos los sucesos de ambas variables, no solo de un resumen numérico.',note('Criterio completo','Todas las celdas, incluidos ceros y soporte'))
    ]],
    ['El soporte también cuenta',[
      beat('Con densidad conjunta, la factorización debe valer casi por todas partes en todo el plano, incluyendo donde la conjunta es cero. Casi por todas partes permite diferencias en conjuntos de área cero; no permite ignorar una región entera fuera del soporte.',equation(String.raw`f_{X,Y}(x,y)=f_X(x)f_Y(y)\quad\text{casi por todas partes en }\mathbb R^2`)),
      beat('En el triángulo de capacidad dos, cada marginal es positiva entre cero y dos. Sin embargo, cerca de la pareja uno coma cinco, uno coma cinco, la conjunta vale cero porque se supera la capacidad. El producto marginal es positivo en esa región: no hay independencia.',note('Contraejemplo','X + Y ≤ 2 impide combinar libremente valores marginales')),
      beat('Con independencia podemos separar la esperanza del producto de funciones de ambas variables, siempre que sean integrables. Las transformaciones por separado conservan independencia. Esta es una consecuencia de la factorización, no una sustitución de su comprobación.',equation(String.raw`E[g(X)h(Y)]=E[g(X)]E[h(Y)]\quad\text{si son integrables}`)),
      beat('Para decidir en un problema distinguimos independencia justificada por el experimento, independencia impuesta como modelo e independencia demostrada desde la conjunta. Una forma rectangular del soporte por sí sola tampoco basta: aún deben factorizar los pesos.',note('Revisión','Mecanismo · conjunta completa · soporte · no solo covarianza'))
    ]]
  ],
  'covarianza-matrices':[
    ['¿Se apartan juntas de sus medias?',[
      beat('Hola. Vamos a medir variación lineal compartida y a organizarla en matrices. Con segundos momentos finitos, la covarianza promedia productos de desviaciones respecto a las propias medias. Desviaciones del mismo signo aportan positivo; signos contrarios aportan negativo.',equation(String.raw`\operatorname{Cov}(X,Y)=E[(X-\mu_X)(Y-\mu_Y)]`)),
      beat('Tomemos dos parejas equiprobables: cero con uno y uno con tres. La media de equis es una mitad y la de i griega dos. En la primera pareja las desviaciones son menos una mitad y menos uno; en la segunda, una mitad y uno.',note('Dos parejas','(0,1) y (1,3), cada una con probabilidad 1/2')),
      beat('Ambos productos de desviaciones son una mitad, por lo que su promedio también lo es. Podemos comprobarlo con esperanza del producto menos producto de medias: cero más tres, entre dos, menos una mitad por dos, vuelve a dar una mitad.',equation(String.raw`\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]=1{,}5-0{,}5\cdot2=0{,}5`)),
      beat('El signo es positivo, pero su magnitud depende de las unidades. Cambiar una medida de gramos a miligramos multiplica la covarianza por mil. Para comparar intensidad lineal necesitamos estandarizar, no declarar grande cualquier número positivo.',note('Unidades','Covarianza: unidades de X por unidades de Y'))
    ]],
    ['Organizar y comparar',[
      beat('La correlación divide por el producto de desviaciones finitas y positivas. Aquí las varianzas son un cuarto y uno, así que las desviaciones son una mitad y uno. Una mitad entre su producto da uno: las parejas cumplen exactamente i griega igual a dos equis más uno.',equation(String.raw`\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}=\frac{1/2}{(1/2)\cdot1}=1`)),
      beat('En la matriz de covarianzas ponemos las varianzas en diagonal y las covarianzas cruzadas fuera. Es simétrica porque intercambiar el orden del producto no cambia su esperanza. Debemos mantener el mismo orden de variables en filas, columnas y vector de medias.',equation(String.raw`\Sigma=\begin{pmatrix}1/4&1/2\\1/2&1\end{pmatrix}`)),
      beat('La matriz de correlaciones divide cada entrada por sus dos desviaciones. La diagonal queda en uno si las varianzas son positivas. La desigualdad de Cauchy y Schwarz asegura que una correlación válida queda entre menos uno y uno; una variable constante no tiene correlación definida por este cociente.',equation(String.raw`R=\begin{pmatrix}1&1\\1&1\end{pmatrix},\quad|\operatorname{Cov}(X,Y)|\leq\sigma_X\sigma_Y`)),
      beat('Toda matriz de covarianzas debe producir varianza no negativa para cualquier combinación lineal. La nuestra es singular porque las dos variables guardan una relación afín exacta. Esa relación estadística perfecta no demuestra qué causa qué.',equation(String.raw`\boldsymbol a^{\mathsf T}\Sigma\boldsymbol a\geq0`))
    ]]
  ],
  'combinaciones-incorrelacion':[
    ['Sumar y restar medidas',[
      beat('Hola. Vamos a combinar medidas conservando la contribución de su dependencia. Para variables integrables, la esperanza es lineal sin exigir independencia. La media de dos veces equis menos i griega es dos medias de equis menos una de i griega.',equation(String.raw`E[aX+bY+c]=aE[X]+bE[Y]+c`)),
      beat('Con medias diez y tres, obtenemos veinte menos tres: diecisiete. Añadir una constante desplazaría ese centro, pero no cambiaría la dispersión. No necesitamos conocer toda la conjunta para calcular esta esperanza.',equation(String.raw`E[2X-Y]=2\cdot10-3=17`)),
      beat('Con segundos momentos finitos, la varianza eleva los coeficientes al cuadrado y añade dos veces su producto por la covarianza. El coeficiente negativo afecta al término cruzado; no hace negativa una varianza individual.',equation(String.raw`V(aX+bY+c)=a^2V(X)+b^2V(Y)+2ab\operatorname{Cov}(X,Y)`)),
      beat('Con varianzas cuatro y uno y covarianza una mitad, para dos equis menos i griega queda cuatro por cuatro más uno menos cuatro por una mitad: quince. Omitir el término cruzado daría diecisiete y describiría otra dispersión.',equation(String.raw`\operatorname{Var}(2X-Y)=4(4)+1-4(0{,}5)=15`))
    ]],
    ['Covarianza cero no significa independencia',[
      beat('Toma equis menos uno, cero y uno con igual probabilidad y define i griega como su cuadrado. La media de equis y su tercer momento son cero por simetría. La covarianza entre equis y su cuadrado es por tanto cero: son incorreladas.',equation(String.raw`E[X]=E[X^3]=0\quad\Rightarrow\quad\operatorname{Cov}(X,X^2)=0`)),
      beat('Pero son dependientes. Saber equis cero obliga a i griega cero, mientras que sin esa información i griega cero solo tiene probabilidad un tercio. La covarianza se anuló por compensación de signos, no porque desapareciera la relación.',equation(String.raw`P(Y=0\mid X=0)=1\ne P(Y=0)=1/3`)),
      beat('La independencia implica covarianza cero con los momentos necesarios finitos, pero la recíproca falla. En el caso especial de normalidad conjunta, una matriz diagonal sí permite concluir independencia. Dos marginales normales por separado no justifican usar esa excepción.',note('Excepción precisa','Normalidad conjunta + covarianza cero ⇒ independencia')),
      beat('Para la varianza de una combinación basta incorrelación para borrar los términos cruzados; independencia es más fuerte de lo necesario. Tampoco hemos demostrado que la combinación sea normal: conocer media y varianza no determina en general su distribución.',equation(String.raw`V\!\left(\sum_i a_iX_i\right)=\sum_i a_i^2V(X_i)\quad\text{si son incorreladas}`))
    ]]
  ]
};

export function lessonStory(lesson) {
  const scenes = STORIES[lesson.id];
  if (!scenes) throw new RangeError(`Falta el guion hablado de ${lesson.id}.`);
  const steps = scenes.map(([title,beats],index)=>storyScene(title,index ? 'Vamos a razonarlo' : 'Una situación concreta',beats));
  const attach = (owner,plot) => {
    const line = steps.flatMap(step=>step.visual.lines).find(item=>item.tex===owner || item.label===owner);
    if (!line) throw new RangeError(`Falta el elemento propietario del gráfico de ${lesson.id}: ${owner}`);
    line.plot=plot;
  };
  if (lesson.id==='funciones') attach(String.raw`g(3)=2\cdot3+1=7`,{points:[[0,1],[1,3],[2,5],[3,7]],xLabel:'Entrada x',yLabel:'Salida g(x)'});
  if (lesson.id==='calculo') {
    attach(String.raw`0{,}5\,(1{,}2-0{,}4)=0{,}4`,{points:[[0,0.5],[2,0.5]],shade:[0.4,1.2],xLabel:'Tiempo (min)',yLabel:'Densidad (1/min)'});
    attach(String.raw`\int_0^1t/2\,dt=[t^2/4]_0^1=1/4`,{points:[[0,0],[1,0.5],[2,1]],shade:[0,1],xLabel:'Tiempo (min)',yLabel:'Densidad (1/min)'});
  }
  if (lesson.id==='regiones-matrices') attach(String.raw`x=0{,}3\quad\Rightarrow\quad0\leq y\leq0{,}7`,{points:[[0,1],[1,0]],shade:[0,1],cut:0.3,xLabel:'Recurso x',yLabel:'Recurso y'});
  if (lesson.id==='exponencial') attach(String.raw`P(T>5)=e^{-0{,}2\cdot5}\approx0{,}368`,{points:Array.from({length:61},(_,index)=>[index/4,Math.exp(-0.2*index/4)]),xLabel:'Tiempo (min)',yLabel:'S(t): seguir esperando'});
  if (lesson.id==='normal') {
    const points=Array.from({length:81},(_,index)=>{const position=-4+index/10;return [position,globalThis.jStat.normal.pdf(position,0,1)];});
    attach('Φ(z)',{points,shade:[-4,2],xLabel:'Desviaciones z',yLabel:'Densidad estándar'});
    attach(String.raw`P(36<X<48)=\Phi(2)-\Phi(-1)\approx0{,}8186`,{points,shade:[-1,2],xLabel:'Desviaciones z',yLabel:'Área entre −1 y 2'});
  }
  return steps;
}