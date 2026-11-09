# Guiones docentes y realización visual

Propuesta editorial para sustituir las locuciones de los vídeos del curso.
No modifica el texto de estudio, el reproductor ni los audios publicados.
Los identificadores corresponden a los apartados de `lesson-sections.js`.

## Criterio de producción

- La locución entre comillas es el texto que se debe grabar. Las indicaciones
  visuales no se leen ni se incorporan a los subtítulos.
- Cada intervención introduce una idea. Se presenta primero la situación,
  después el razonamiento y solo entonces la notación que lo resume.
- Ritmo de referencia: 120–135 palabras por minuto. Dejar unos dos segundos
  tras una pregunta, dos o tres para leer una cuenta y tres o cuatro ante un
  gráfico nuevo. Son decisiones de dirección, no marcas de audio medidas.
- No leer comandos de LaTeX. Nombrar las letras solo cuando ayude a relacionar
  la frase con una expresión visible; no deletrear fórmulas completas.
- Mantener a la vista los datos necesarios para la operación actual. Revelar
  un término cada vez, conservar el significado de los colores y retirar los
  cálculos anteriores cuando compitan con el dibujo que se está explicando.
- Subtítulos debajo del gráfico, nunca encima de ejes o cuentas. Una pausa
  debe permitir inspeccionar la figura sin adelantar la siguiente respuesta.
- Los ejemplos son didácticos. Diferenciar observaciones, supuestos del modelo,
  probabilidades exactas, aproximaciones y recuentos esperados.
- Cada apartado funciona de forma independiente. Para el repaso global de
  una lección, encadenar sus apartados en el orden indicado, conservar solo la
  primera bienvenida y sustituir las restantes por una transición breve.
  No acelerar la explicación para recuperar el tiempo de esas transiciones.

## Puente matemático

### proporciones / parte-y-total

**Locución**

1. «Hola. Vamos a comparar dos bandejas de semillas. En una germinan dieciocho
   y en otra treinta. A primera vista parece que gana la segunda. Pero espera:
   ¿habíamos sembrado la misma cantidad en las dos?»
2. «En la primera sembramos setenta y dos. Las dieciocho germinadas son la
   parte que nos interesa; las setenta y dos sembradas son el total con el que
   debemos compararla. Dividimos y sale un cuarto: germinó una de cada cuatro.»
3. «En la segunda sembramos doscientas. Treinta entre doscientas da quince
   centésimas. Tiene más semillas germinadas, pero una fracción menor del total.
   Por eso el recuento, por sí solo, nos estaba contando una historia incompleta.»
4. «Quédate con esta pregunta: ¿de qué total sale cada parte? Aquí solo estamos
   describiendo lo observado. Todavía no hemos supuesto cómo germinan las
   semillas ni si sus resultados son independientes.»

**Realización**

1. Dos bandejas identificadas; primero mostrar solo «18 germinadas» y «30
   germinadas». Mantener la comparación abierta durante la pregunta.
2. Incorporar «72 sembradas» a la primera. Destacar 18 dentro de 72, no junto a
   otras 72. Construir $18/72=0{,}25$ y un reparto en cuatro partes iguales.
3. Incorporar el segundo total y construir $30/200=0{,}15$. Comparar barras
   proporcionales con la misma escala de cero a uno; no usar áreas de bandejas
   como si fueran probabilidades.
4. Dejar visibles ambas partes y sus propios totales. Cierre: «Comparar parte
   con su total». No añadir un modelo binomial a este ejemplo descriptivo.

### proporciones / porcentaje-y-exposicion

**Locución**

1. «Hola. Hoy vamos a distinguir tres números que se parecen, pero cuentan cosas distintas. Empecemos con nuestra bandeja: germinó una de cada cuatro semillas. ¿Cómo lo diríamos usando porcentajes?»
2. «Imagina repartir el total en cien partes iguales. Una cuarta parte ocupa veinticinco: decimos veinticinco por ciento. No hemos sembrado cien semillas nuevas; solo hemos cambiado la escala de la comparación.»
3. «Ahora un sensor registra seis llegadas durante tres horas. Dividir da dos llegadas por hora. Aquí el denominador no cuenta semillas: cuenta tiempo de observación. Es una tasa y puede superar uno.»
4. «Con colonias por mililitro hablamos de concentración. Antes de interpretar cualquier cociente, mira qué se está dividiendo. Y para juntar bandejas de distinto tamaño, reúne las germinaciones y las semillas sembradas antes de dividir; no promedies sus porcentajes sin tener en cuenta sus tamaños.»

**Realización**

1. Recuperar la barra de un cuarto de la primera bandeja.
2. Cambiar las marcas de la escala, no su longitud: $0{,}25\times100=25\%$.
3. Línea temporal de tres horas, seis llegadas; revelar $6/3=2$ llegadas/h.
4. Volumen de 1 ml con varias colonias; después mostrar $(18+30)/(72+200)$ frente al promedio simple tachado. Etiquetar cada denominador.

### proporciones / unidades-y-cotas

**Locución**

1. «Hola. Vamos a comprobar un resultado antes de darlo por bueno. Tenemos tres miligramos de una sustancia. Si los escribimos en microgramos, ¿habrá cambiado la cantidad?»
2. «No. El microgramo es una unidad más pequeña: en cada miligramo caben mil. Por eso el número pasa de tres a tres mil, pero la sustancia sigue siendo la misma.»
3. «Este cambio también afecta a nuestros resúmenes. La media se multiplica por mil; la varianza, que utiliza distancias al cuadrado, se multiplica por un millón. No podemos convertirlas con el mismo factor.»
4. «Al terminar una cuenta, pregunta qué unidades debería tener y qué valores son posibles. Una probabilidad no puede superar uno; una espera media se expresa en tiempo. Conserva los decimales durante el cálculo: redondear muy pronto una probabilidad pequeña a cero haría desaparecer un evento que sigue siendo posible.»

**Realización**

1. Una misma muestra sobre la balanza, sin cambiar su tamaño.
2. Descomponer 1 mg en 1000 µg; construir $3\times1000=3000$ µg y $10^3=1000$.
3. Dos conversiones separadas: media $\times10^3$, varianza $\times10^6$.
4. Escala [0,1], etiqueta «minutos» para una espera y ejemplo $0{,}0004\ne0$. Mantener los decimales hasta el resultado final.

### algebra / balanza

**Locución**

1. «Hola. Vamos a repartir un total respetando tres pesos: dos, tres y cinco. Estos números dicen cuánto corresponde a cada estado en relación con los demás. Todavía no son probabilidades: juntos suman diez.»
2. «Queremos que juntos sumen uno sin cambiar sus proporciones. Buscamos un mismo factor para los tres y lo llamamos ce. Si el total pesa diez, diez veces ese factor tiene que dar uno.»
3. «Para averiguar el factor dividimos ambos lados entre diez. Queda una décima. Hacer la misma operación a los dos lados mantiene el equilibrio de la igualdad.»
4. «Fíjate en que hemos dividido por la suma completa, no por cada peso por separado. Si el total de pesos fuera cero, esta división no tendría sentido. Despejar una letra siempre exige comprobar que la operación está permitida.»

**Realización**

1. Tres montones de tamaños 2, 3 y 5; revelar su suma 10.
2. Vincular el mismo $c$ a los tres y construir $10c=1$.
3. Balanza que divide ambos miembros por 10: $c=1/10$.
4. Enmarcar el denominador $2+3+5$; contrastar $1/(2+3+5)$ con $1/2+1/3+1/5$, sin equipararlos.

### algebra / comprobar-el-factor

**Locución**

1. «Hola. Ya encontramos un factor de una décima para los pesos dos, tres y cinco. Vamos a comprobar que realmente hace el reparto que queríamos.»
2. «El último estado tenía peso cinco. Multiplicarlo por una décima le asigna una mitad del total. Los otros dos reciben dos décimas y tres décimas. Al sumarlas obtenemos uno: el reparto completa el total.»
3. «Esta comprobación no es un trámite. También miraríamos si alguna probabilidad fuese negativa: resolver la igualdad no bastaría para que el modelo fuera válido.»
4. «Aprovechemos para recordar dos operaciones que aparecerán después. Tres al cuadrado es tres por tres: nueve. La raíz no negativa de nueve vuelve a dar tres. Para una desviación típica usamos esa raíz no negativa, porque estamos describiendo un tamaño de dispersión, no una dirección.»

**Realización**

1. Recuperar los pesos y el factor, sin repetir el despeje.
2. Construir $5/10=1/2$ y después $0{,}2+0{,}3+0{,}5=1$ sobre una barra completa.
3. Comprobaciones visuales: «total 1», «ninguna negativa».
4. Cuadrado 3 por 3 con nueve casillas; flecha de vuelta $\sqrt9=3$. No presentar $-3$ como desviación típica.

### algebra / deshacer-exponencial

**Locución**

1. «Hola. Vamos a buscar un tiempo, no a memorizar una regla de signos. Un modelo describe una proporción que va disminuyendo, con escala de seis horas. Queremos saber cuándo queda la mitad.»
2. «Ahora el tiempo está dentro de un exponente. Para sacarlo usamos el logaritmo natural: deshace la exponencial de base e. Lo aplicamos a ambos lados de la igualdad.»
3. «Nos queda menos el tiempo dividido entre seis. Multiplicamos los dos lados por menos seis y obtenemos unas cuatro coma dieciséis horas. El resultado es positivo porque el logaritmo de una mitad es negativo.»
4. «Volvamos al modelo inicial y sustituyamos ese tiempo. Debe devolver aproximadamente una mitad. Así comprobamos el razonamiento. Los logaritmos reales necesitan argumentos positivos y las divisiones, denominadores no nulos; fuera de esas condiciones hay que revisar el planteamiento.»

**Realización**

1. Curva decreciente y línea objetivo $1/2$, con escala «6 h».
2. Revelar $e^{-t/6}=1/2$ y después $-t/6=\log(1/2)$.
3. Separar el despeje $t=-6\log(1/2)$ del resultado $t\approx4{,}16$ h.
4. Mover el marcador a ese tiempo y verificar la altura. El símbolo $\log$ debe quedar identificado como logaritmo natural.

### funciones / entrada-y-salida

**Locución**

1. «Hola. Vamos a seguir un número por una regla muy sencilla: duplicarlo y añadir uno. Si entra tres, ¿qué sale? Primero nos interesa entender el recorrido.»
2. «Duplicar tres da seis. Después añadimos uno y llegamos a siete. A esta regla la llamamos ge. Cuando escribimos ge de tres, estamos nombrando la salida para esa entrada, no multiplicando una letra por tres.»
3. «Podemos dibujar varias entradas con sus salidas y aparece una recta. Pero una función no tiene por qué ser una única curva sencilla: puede cambiar de regla según el tramo.»
4. «Antes de sustituir un número, comprueba que sea una entrada permitida y elige su tramo. El dominio dice qué entradas admite la regla. El soporte de una variable aleatoria indica dónde vive su masa o densidad. Una fórmula pensada para tiempos positivos no nos autoriza a inventar tiempos negativos.»

**Realización**

1. Flujo $3\to\times2\to+1$; ocultar inicialmente la salida.
2. Revelar 6 y luego 7; asociar $g(3)=7$ al recorrido.
3. Puntos $(0,1),(1,3),(2,5),(3,7)$ con ejes «entrada» y «salida».
4. Ejemplo de dos tramos identificados y un eje de tiempo con la zona negativa excluida. No llamar probabilidades a las salidas.

### funciones / sumar-salidas

**Locución**

1. «Hola. Vamos a sumar varias salidas de la misma regla, duplicar y añadir uno. Queremos las que corresponden a cero, uno y dos. Lo primero es calcularlas, no sumar las entradas.»
2. «Las salidas son uno, tres y cinco. Ahora sí las reunimos: dan nueve. El símbolo grande de sigma, el sumatorio, solo abrevia esa suma.»
3. «El índice funciona como una etiqueta que nos lleva de un término al siguiente. No es necesariamente el valor que estamos observando. Si una tabla contiene cero, dos y cinco brotes, la tercera fila sigue representando cinco brotes, no tres.»
4. «Antes de reunir términos, decide cuáles entran. Los corchetes incluyen un extremo y los paréntesis lo excluyen. Leer esas marcas con calma evita sumar una salida que la pregunta no permite.»

**Realización**

1. Tabla entrada/salida con tres filas y sustituciones sucesivas.
2. Construir $1+3+5=9$; reemplazarlo por $\sum_{i=0}^2g(i)$ sin cambiar términos.
3. Tabla con columnas «índice» y «valor»: 1/0, 2/2, 3/5.
4. Rectas de intervalos con puntos abiertos/cerrados; seleccionar filas antes de mostrar la suma.

### funciones / seleccionar-valores

**Locución**

1. «Hola. Vamos a ver cómo una palabra cambia una probabilidad. Una planta puede tener cero, dos o cinco brotes, con probabilidades una décima, seis décimas y tres décimas.»
2. «Si pedimos menos de tres brotes, entran cero y dos. Sumamos sus probabilidades y obtenemos siete décimas. No estamos sumando cuántos brotes hay: estamos reuniendo la probabilidad de los casos permitidos.»
3. «Ahora cambia la pregunta a menos de dos. El propio dos queda fuera y solo entra cero: una décima. En cambio, como máximo dos sí lo incluye. Al menos dos reúne dos y cinco.»
4. «En esta tabla, incluir un extremo puede añadir una masa grande. Cuando tengamos una densidad continua, un punto aislado no añade área. Conviene saber qué tipo de variable tenemos antes de tratar las desigualdades como si fueran intercambiables.»

**Realización**

1. Tres barras en las posiciones reales 0, 2 y 5.
2. Umbral 3; iluminar 0 y 2 y mostrar $0{,}1+0{,}6=0{,}7$.
3. Mover el umbral a 2, alternar $<$ y $\leq$; después seleccionar $\geq2$.
4. Contrastar una barra puntual con una línea sin anchura sobre una densidad. Mantener las escalas y etiquetas diferenciadas.

### calculo / franjas

**Locución**

1. «Hola. Vamos a calcular una probabilidad mirando un área. El tiempo puede estar entre cero y dos minutos, con densidad constante de medio por minuto. Queremos la franja entre cero coma cuatro y uno coma dos.»
2. «Primero averiguamos cuánto mide esa franja: restamos los extremos y da cero coma ocho minutos. Como la altura es constante, multiplicamos anchura por altura.»
3. «El resultado es cuatro décimas de probabilidad. Fíjate en las unidades: minutos por uno entre minutos deja un número sin unidades. La probabilidad pertenece al área, no a la altura.»
4. «Si la altura cambiara, una sola multiplicación ya no serviría. Dividiríamos en franjas más estrechas y reuniríamos sus áreas: esa es la idea de la integral. Si la fórmula cambia dentro del intervalo, separamos el cálculo en esa frontera para no usar una regla donde no corresponde.»

**Realización**

1. Rectángulo completo: base 2 min y altura 0,5/min; marcar los límites pedidos.
2. Cota de anchura y cuenta $1{,}2-0{,}4=0{,}8$; después $0{,}5\times0{,}8=0{,}4$.
3. Sombrear únicamente la franja; animar la cancelación de unidades.
4. Convertir la altura en variable, mostrar franjas y $\int_a^b f(t)\,dt$. Identificar $dt$ como recorrido del tiempo y separar dos tramos si cambia la regla.

### calculo / primitiva

**Locución**

1. «Hola. Ahora la densidad aumenta con el tiempo: vale el tiempo dividido entre dos, entre cero y dos minutos. Queremos acumular hasta un minuto. Las franjas de la derecha son más altas, así que buscamos otra manera de sumarlas.»
2. «Una primitiva es una función cuya derivada devuelve la altura que estamos integrando. Aquí sirve el tiempo al cuadrado dividido entre cuatro. Nos permite calcular lo acumulado sin sumar cada franja por separado.»
3. «La evaluamos en el extremo superior, uno: sale un cuarto. En el inferior, cero, sale cero. Restamos lo que ya había al comienzo y queda un cuarto de probabilidad.»
4. «Esta es la idea del teorema fundamental del cálculo, bajo sus condiciones habituales. Antes de interpretar el resultado, comprobamos que la densidad no sea negativa, que usemos su soporte y que el área completa sea uno.»

**Realización**

1. Recta $f(t)=t/2$, soporte [0,2], sombreado [0,1].
2. Introducir $G(t)=t^2/4$ y comprobar $G'(t)=t/2$ en un paso separado.
3. Revelar $G(1)=1/4$, $G(0)=0$ y su resta sucesivamente.
4. Ampliar el sombreado hasta 2 para comprobar $G(2)-G(0)=1$. No confundir altura final 1 con probabilidad puntual.

### calculo / pendiente-acumulada

**Locución**

1. «Hola. Vamos a distinguir dos curvas que hablan del mismo tiempo. La densidad muestra la altura local; la acumulada muestra cuánta probabilidad llevamos reunida hasta cada instante.»
2. «Para la densidad anterior, la acumulada dentro del soporte es el tiempo al cuadrado dividido entre cuatro. Al llegar a un minuto hemos reunido un cuarto del área total.»
3. «¿Y cuánto cambia lo acumulado si avanzamos un poco? Eso lo describe la pendiente. Derivar la acumulada nos devuelve el tiempo dividido entre dos: la densidad. En un minuto, la pendiente es medio por minuto.»
4. «Una pendiente de medio no significa probabilidad de medio para ese instante. El instante no tiene anchura y no aporta área. La acumulada no puede bajar ni superar uno; si nuestro dibujo lo hace, hay que revisar el modelo o el cálculo.»

**Realización**

1. Densidad y acumulada en ejes separados con el mismo eje temporal.
2. Vincular área hasta 1 con el punto $(1,0{,}25)$ de $F$.
3. Tangente local y fórmula $F'(t)=t/2$; distinguir $F(1)=0{,}25$ de $f(1)=0{,}5$/min.
4. Reducir una franja hasta anchura cero; dejar visible $P(T=1)=0$ y cotas de $F$ entre 0 y 1.

### regiones-matrices / frontera

**Locución**

1. «Hola. Repartimos una unidad de recurso entre dos cultivos. Vamos a dibujar qué repartos son posibles antes de hacer ninguna integral. Una coordenada dice lo que recibe el primero y la otra, el segundo.»
2. «Ninguno recibe cantidades negativas y entre ambos no pueden gastar más de una unidad. Por eso el dibujo permitido es un triángulo. Dar ocho décimas a cada uno quedaría fuera: habríamos gastado uno coma seis.»
3. «Fijemos ahora tres décimas para el primero. Al segundo le queda como máximo siete décimas. Ese segmento vertical reúne sus opciones cuando la primera coordenada ya está elegida.»
4. «Si el primero recibe más, el segmento se acorta. Esa frontera inclinada explica por qué el límite interior de una integral cambiará con la otra coordenada. Un rectángulo completo incluiría repartos que nunca pueden ocurrir.»

**Realización**

1. Dos depósitos que comparten capacidad 1; pasar a ejes $x,y$.
2. Construir $x\geq0$, $y\geq0$, $x+y\leq1$; marcar $(0{,}8,0{,}8)$ fuera.
3. Corte $x=0{,}3$ y cota $1-0{,}3=0{,}7$.
4. Desplazar el corte y revelar $0\leq y\leq1-x$. El triángulo representa soporte, no tres observaciones.

### regiones-matrices / recorrer-triangulo

**Locución**

1. «Hola. Vamos a recorrer el triángulo de repartos sin salirnos de él. Su área es una mitad: ocupa la mitad de un cuadrado de lado uno. Pero ahora queremos sumar también lo que aporte una función en cada punto.»
2. «Elegimos primero una posición horizontal. En ese corte recorremos la coordenada vertical desde cero hasta uno menos la horizontal. Esa es nuestra integral interior.»
3. «Después movemos el corte desde cero hasta uno y reunimos todos los segmentos. La integral exterior recoge lo que produjo cada recorrido interior. Los límites se leen en el dibujo.»
4. «Si la función fuese una densidad constante, necesitaríamos volumen total uno. Como la base tiene área una mitad, la altura debería ser dos. Una densidad de dos no es una probabilidad de dos: la probabilidad aparece al integrar altura sobre área.»

**Realización**

1. Dividir el cuadrado en dos triángulos: área $1/2$.
2. Corte vertical y $\int_0^{1-x}g(x,y)\,dy$.
3. Barrido horizontal y $\int_0^1[\int_0^{1-x}g(x,y)\,dy]dx$; señalar cada variable mientras se recorre.
4. Superficie plana de altura 2 sobre el triángulo, o vista en planta con etiqueta de altura: $2\times1/2=1$.

### regiones-matrices / orden-de-matriz

**Locución**

1. «Hola. Medimos dos biomarcadores de una misma muestra. Vamos a ordenar sus resúmenes para no intercambiarlos. En un vector, la primera entrada corresponde siempre a la primera medida; la segunda, a la segunda.»
2. «La matriz añade filas y columnas. En la diagonal colocamos las varianzas cuatro y nueve. Fuera de ella aparece la covarianza uno, que habla de la variación compartida. Las dos posiciones cruzadas coinciden.»
3. «Para multiplicar esta matriz por un vector, trabajamos fila a fila. Si el vector contiene dos y tres, la primera fila da cuatro por dos más uno por tres: once. Primero los productos; después la suma.»
4. «Si cambiamos el orden de los biomarcadores, debemos cambiar el vector y las filas y columnas de la matriz. Y sus entradas no son probabilidades: las varianzas tienen unidades cuadradas y las covarianzas, productos de unidades.»

**Realización**

1. Etiquetas de los dos biomarcadores y vector $\boldsymbol\mu$ con orden explícito.
2. Revelar $\Sigma=\begin{pmatrix}4&1\\1&9\end{pmatrix}$: primero diagonal, después entradas cruzadas.
3. Resaltar fila 1 y vector $(2,3)^{\mathsf T}$; construir $4\times2+1\times3=11$ por etapas.
4. Intercambio simultáneo de etiquetas, filas y columnas. Mantener una leyenda de las unidades de cada entrada.

## Probabilidad

### sucesos / resultados-y-sucesos

**Locución**

1. «Hola. Vamos a observar dos semillas, pero conservando cuál es la primera y cuál la segunda. ¿Que germine la primera significa lo mismo que que germine exactamente una? Dibujemos las posibilidades para decidirlo.»
2. «Puede no germinar ninguna, germinar solo la primera, solo la segunda o las dos. Ese conjunto de resultados es nuestro espacio de posibilidades. Enumerarlos no significa que todos sean igual de probables.»
3. «El suceso germina la primera reúne dos resultados: solo la primera y ambas. Exactamente una reúne otros dos: solo la primera y solo la segunda. Comparten un resultado, pero no son la misma pregunta.»
4. «Un suceso puede reunir varios resultados. Si solo guardamos el número de germinaciones, perdemos parte de la identidad. Y distinguir un experimento aleatorio de uno determinista depende del modelo: si antes de realizarlo admite varias posibilidades, no hemos fijado su resultado.»

**Realización**

1. Semillas 1 y 2 con etiquetas persistentes.
2. Cuatro parejas de estados; agruparlas bajo $\Omega$ sin asignar pesos iguales.
3. Seleccionar «primera germina» y «exactamente una» en dos pasadas; destacar la diferencia en «ambas» y «solo segunda».
4. Transformar las parejas en recuentos 0,1,1,2 y mostrar la identidad que se pierde.

### sucesos / traducir-conjuntos

**Locución**

1. «Hola. Vamos a traducir frases a grupos de células. De cien, treinta tienen solo a, veinte solo be, diez ambos y cuarenta ninguno. Primero seleccionaremos el grupo; luego vendrá la cuenta.»
2. «Ambos exige cumplir las dos condiciones: son las diez dobles. Al menos uno acepta solo a, solo be y también ambos. Reúne sesenta. La palabra o, en esta unión, no excluye a quienes cumplen las dos.»
3. «Solo a pide a y, además, no be. El complemento significa que no ocurre una condición, siempre dentro del conjunto de resultados que hemos definido. Ninguno exige no a y no be.»
4. «Podemos obtener ninguno tomando el complemento de al menos uno. Esa equivalencia es una ley de De Morgan: dos maneras de seleccionar las mismas cuarenta células. Todo el espacio representa el suceso seguro; el conjunto vacío, el imposible.»

**Realización**

1. Cuatro grupos disjuntos de 30,20,10,40, con leyenda.
2. Iluminar intersección $A\cap B$ y después unión $A\cup B$.
3. Seleccionar $A\setminus B=A\cap B^c$ sin mover las células.
4. Comparar $(A\cup B)^c$ y $A^c\cap B^c$ sobre la misma selección; identificar $\Omega$ y $\varnothing$.

### sucesos / observabilidad

**Locución**

1. «Hola. Vamos a entender para qué sirve una condición formal: que las preguntas a las que asignamos probabilidad sigan teniendo sentido cuando las combinamos. Con pocas posibilidades podemos tomar cualquier grupo; en un continuo necesitamos declarar qué sucesos admitimos.»
2. «Esa colección se llama sigma álgebra. Incluye el conjunto de todos los resultados y, si admite una pregunta, también admite su negación. Así podemos pasar de ocurre a no ocurre.»
3. «También admite reunir una lista numerable de sucesos: una lista que podemos etiquetar como primero, segundo y así sucesivamente. Con complementos y uniones obtenemos también intersecciones.»
4. «El espacio de probabilidad reúne tres piezas: los resultados, los sucesos admitidos y la regla que les asigna probabilidades. Esto no exige que todos pesen lo mismo ni que conozcamos el resultado antes de observarlo. Solo garantiza una estructura coherente para nuestras preguntas.»

**Realización**

1. Pasar de un conjunto finito a una recta continua; texto «sucesos admitidos».
2. Presentar $\mathcal A$, $\Omega\in\mathcal A$ y un suceso junto a su complemento.
3. Añadir $\bigcup_{i=1}^{\infty}A_i\in\mathcal A$ por partes; no representar «numerable» como «finito».
4. Tres piezas etiquetadas $(\Omega,\mathcal A,P)$ y flechas entre preguntas y probabilidades.

### axiomas / probabilidades-coherentes

**Locución**

1. «Hola. Vamos a ver qué reglas evitan que una cuenta de probabilidad se contradiga. Si un cultivo solo puede estar en uno de tres estados, las probabilidades deben repartir un total completo.»
2. «Ninguna puede ser negativa y todas las posibilidades juntas tienen probabilidad uno. Por ejemplo, dos décimas, tres décimas y cinco décimas completan ese total.»
3. «Si reunimos los dos primeros estados, sumamos sus probabilidades: no pueden ocurrir a la vez. La misma regla sirve para una lista numerable de sucesos separados. La condición importante es no contar un resultado varias veces.»
4. «Cuando hay solapamientos necesitamos corregirlos. Con tres sucesos sumamos los individuales, restamos las intersecciones por parejas y devolvemos la triple, que habíamos quitado demasiado. El dibujo ayuda a seguir las copias; el tamaño dibujado de una región no establece por sí solo su probabilidad.»

**Realización**

1. Tres estados excluyentes sobre una barra total.
2. $P(\Omega)=1$ y masas 0,2;0,3;0,5 sin valores negativos.
3. Seleccionar los dos primeros y revelar $0{,}2+0{,}3=0{,}5$; luego la aditividad para disjuntos.
4. Diagrama de tres conjuntos con contadores de copias: individuales, parejas, triple. Mantener «esquema, no escala de probabilidad».

### axiomas / solapamiento

**Locución**

1. «Hola. Queremos la probabilidad de tener al menos uno de dos marcadores. A aparece con cuarenta y cinco centésimas, be con treinta y ambos con quince. Vamos a seguir qué se cuenta dos veces.»
2. «Sumar a y be da setenta y cinco centésimas. Pero las células con ambos entraron en la cuenta de a y otra vez en la de be. No son dos grupos nuevos.»
3. «Quitamos una copia de esas quince centésimas. Queda sesenta por ciento para al menos uno. Si queremos ninguno, tomamos lo que falta hasta el total: cuarenta por ciento.»
4. «La fórmula de la unión resume exactamente esta corrección. Antes de usarla, asegúrate de que la pregunta incluye a quienes tienen ambos. Si pide exclusivamente uno, tendremos que seleccionar otro grupo.»

**Realización**

1. Grupos con $P(A)=0{,}45$, $P(B)=0{,}30$, $P(A\cap B)=0{,}15$.
2. Dos copias visuales de la zona común; cuenta $0{,}45+0{,}30=0{,}75$.
3. Retirar una copia: $0{,}75-0{,}15=0{,}60$; después $1-0{,}60=0{,}40$.
4. Revelar $P(A\cup B)=P(A)+P(B)-P(A\cap B)$ tras la explicación.

### axiomas / deducir-propiedades

**Locución**

1. «Hola. Vamos a deducir unas reglas conocidas en lugar de aprenderlas como trucos separados. Partimos de un total de probabilidad uno y de que las probabilidades no son negativas.»
2. «Añadir el conjunto vacío no añade ningún resultado. Su probabilidad tiene que ser cero. Un suceso y su complemento, en cambio, sí completan todo el espacio sin solaparse.»
3. «Por eso la probabilidad del complemento es lo que falta hasta uno. Ahora imagina que a está completamente dentro de be. Be contiene todo a y, quizá, algunos resultados más.»
4. «Podemos separar be en a y la parte que queda fuera de a. Como esa parte adicional no tiene probabilidad negativa, a no puede tener más probabilidad que be. Las propiedades salen del significado de los conjuntos; las fórmulas solo hacen más corta la explicación.»

**Realización**

1. Barra de total 1 y conjuntos sin pesos negativos.
2. $P(\varnothing)=0$ y partición $A,A^c$.
3. $P(A^c)=1-P(A)$; después dibujo $A\subseteq B$.
4. Separar $B$ en $A$ y $B\setminus A$; revelar $P(B)=P(A)+P(B\setminus A)$ y finalmente $P(A)\leq P(B)$.

### axiomas / frecuencia

**Locución**

1. «Hola. Si observamos seis positivos en diez ensayos, ¿la probabilidad verdadera tiene que ser seis décimas? Esa cifra describe nuestra muestra. Otra tanda podría dar un resultado distinto.»
2. «Para calcular la frecuencia marcamos uno cuando ocurre el suceso y cero cuando no. Sumamos esos indicadores y dividimos por el número de ensayos.»
3. «Con ensayos independientes y probabilidad estable, al repetir mucho la frecuencia tiende a estabilizarse alrededor de la probabilidad del modelo. En una muestra finita sigue fluctuando. Una racha no obliga al siguiente ensayo independiente a compensar nada.»
4. «Y contar casos favorables entre posibles solo sirve si las posibilidades tienen el mismo peso. Una simulación nos enseña cómo fluctúa la frecuencia bajo el modelo que elegimos; no demuestra que ese modelo describa la realidad. Separar observación y supuesto es parte de interpretar la cuenta.»

**Realización**

1. Diez ensayos con seis indicadores positivos; etiqueta «frecuencia observada».
2. $\widehat p_n=\frac1n\sum_{i=1}^n I_A^{(i)}$ tras mostrar la suma concreta.
3. Trayectorias de frecuencia simuladas y línea de probabilidad, sin imponer coincidencia exacta ni compensar rachas.
4. Comparar posibilidades equiprobables y no equiprobables; leyenda «simulación del modelo».

### combinatoria / posiciones

**Locución**

1. «Hola. Tenemos cinco tubos para ocupar dos posiciones distintas. Antes de contar, pregunta si intercambiarlos cambia el resultado. Aquí sí: la posición izquierda no cumple la misma función que la derecha.»
2. «Sin repetir tubo tenemos cinco opciones para la primera posición y cuatro para la segunda. Cada primera elección abre cuatro caminos: en total, veinte. Si permitimos repetir, habría cinco opciones en ambas y veinticinco caminos.»
3. «Para ordenar todos los elementos aparece el factorial, que reúne las opciones descendentes. Para ordenar solo una parte usamos las variaciones: quitamos del factorial los factores que no necesitamos. Cero factorial vale uno.»
4. «Estos números cuentan elecciones. Todavía no les hemos asignado probabilidades: un mecanismo puede favorecer unos caminos más que otros. Orden y repetición describen el experimento; no se deciden mirando qué fórmula parece más cómoda.»

**Realización**

1. Tubos A–E y posiciones izquierda/derecha.
2. Árbol 5 por 4; después permitir diagonal y mostrar $5^2=25$.
3. Expandir $n!$; presentar $0!=1$ y $V_{n,r}=n!/(n-r)!$ con factores cancelados.
4. Comparación $n^r$ con repetición; no etiquetar los caminos con probabilidades sin un mecanismo uniforme.

### combinatoria / quitar-orden

**Locución**

1. «Hola. Ahora elegimos dos tubos para analizarlos juntos, sin darles posiciones distintas. ¿A be y be a representan grupos nuevos? No: contienen los mismos dos tubos.»
2. «La cuenta ordenada daba veinte, pero cada pareja aparece dos veces. Dividir entre esas dos ordenaciones deja diez grupos distintos.»
3. «Si elegimos un grupo más grande, cada grupo aparece tantas veces como maneras hay de ordenar sus elementos: su factorial. El símbolo de combinaciones elimina esas copias. Cinco sobre dos se lee elegir dos entre cinco, no cinco dividido entre dos.»
4. «No confundir orden con reemplazo. Si no devolvemos un tubo, cambia el contenido disponible para la siguiente extracción. Si lo devolvemos y repetimos un mecanismo estable, podemos justificar independencia. Siempre volvemos al procedimiento de selección.»

**Realización**

1. Emparejar AB con BA usando las mismas etiquetas.
2. Agrupar los veinte caminos en diez parejas; $20/2=10$.
3. Revelar $\binom nr=n!/[r!(n-r)!]$, destacando $r!$ como copias por grupo.
4. Dos procedimientos de extracción, con y sin devolución; mantenerlos separados del cambio de orden.

### combinatoria / multiplicidades

**Locución**

1. «Hola. Queremos ordenar tres etiquetas a y dos etiquetas be. Pero las a son indistinguibles entre sí, y también las be. Vamos a contar sin inventar diferencias que no vemos.»
2. «Si las cinco etiquetas fueran distintas, habría ciento veinte ordenaciones. Sin embargo, intercambiar las tres a no cambia la secuencia visible. Eso produce seis copias. Intercambiar las dos be produce otras dos.»
3. «Cada secuencia visible se repite doce veces en aquella cuenta. Dividimos ciento veinte entre doce y quedan diez secuencias distintas. El denominador corrige las reordenaciones internas de cada grupo de etiquetas iguales.»
4. «La misma idea se extiende a cualquier conjunto de multiplicidades. Reaparecerá al contar categorías en la multinomial. Y si queremos convertir el recuento en probabilidad, todavía debemos comprobar que las secuencias elementales consideradas sean equiprobables.»

**Realización**

1. Tres A y dos B, inicialmente con identificadores pequeños para mostrar las copias.
2. $5!=120$; intercambios invisibles dentro de A y dentro de B.
3. Construir $3!\times2!=12$ y después $120/12=10$.
4. Generalizar $n!/(n_1!\cdots n_k!)$; conservar el vínculo entre cada factorial y su multiplicidad.

### condicionada / grupo-conocido

**Locución**

1. «Hola. De doscientas muestras, ochenta pasan un filtro. Veinticuatro de esas ochenta tienen un marcador. Si sabemos que una muestra pasó el filtro, ¿con qué total debemos compararla?»
2. «La información descarta las ciento veinte que no lo pasaron. Nuestra pregunta vive ahora dentro del grupo de ochenta. De ellas, veinticuatro tienen el marcador: dividir da tres décimas.»
3. «La probabilidad condicionada hace justamente ese cambio de grupo. Arriba ponemos quienes cumplen marcador y filtro; abajo, todos los que cumplen la condición conocida. La barra se lee dado que.»
4. «Dentro del grupo seleccionado, las probabilidades vuelven a completar uno y respetan las mismas reglas. Pero el grupo conocido debe tener probabilidad positiva. Si no puede ocurrir bajo el modelo, este cociente no está definido: dividir por cero no significa responder cero.»

**Realización**

1. Población 200 y grupo filtrado 80.
2. Atenuar los 120 descartados; ampliar 24 dentro de 80 y revelar $24/80=0{,}30$.
3. Asociar $A$ al marcador y $B$ al filtro; $P(A\mid B)=P(A\cap B)/P(B)$.
4. Barra total del grupo B igual a 1 y condición $P(B)>0$.

### condicionada / invertir-grupo

**Locución**

1. «Hola. Vamos a invertir la pregunta anterior. Ahora sabemos que hay marcador y preguntamos qué parte pasó el filtro. Las veinticuatro muestras comunes siguen siendo las mismas, pero el grupo de referencia cambia.»
2. «En toda la población hay sesenta con marcador. Comparar veinticuatro con sesenta da cuatro décimas. Antes comparábamos con ochenta y obteníamos tres décimas. No hay contradicción: hemos hecho dos preguntas distintas.»
3. «Si preguntamos por cumplir ambas condiciones entre todas las muestras, el total es doscientas. El cociente da doce centésimas: es la probabilidad conjunta, no ninguna de las dos condicionadas.»
4. «Antes de calcular, completa esta frase: entre quienes sabemos que cumplen esto, cuántos cumplen aquello. Esa frase identifica el denominador y evita invertir una condición sin darnos cuenta.»

**Realización**

1. Mantener fija la intersección 24; cambiar el contorno del grupo conocido.
2. Comparar $24/60=0{,}40$ y $24/80=0{,}30$, cada uno con su pregunta.
3. Volver al marco 200: $24/200=0{,}12$.
4. Mostrar $P(B\mid A)$, $P(A\mid B)$ y $P(A\cap B)$ por separado, sin tratarlos como equivalentes.

### condicionada / ruta-condicionada

**Locución**

1. «Hola. Una muestra debe pasar un filtro, conservar viabilidad y expresar una señal. Vamos a seguir esa ruta sin olvidar lo que sabemos en cada etapa.»
2. «Cuatro de cada diez pasan el filtro. Entre quienes lo pasan, la mitad conserva viabilidad. Multiplicar da dos de cada diez que cumplen ambas condiciones. La segunda probabilidad pertenece al grupo filtrado, no a todas las muestras.»
3. «Dentro de quienes cumplen esas dos condiciones, tres cuartas partes expresan la señal. Multiplicamos el resultado anterior por tres cuartos y obtenemos quince centésimas para completar la ruta.»
4. «En cada paso usamos toda la información acumulada. La fórmula encadena esas probabilidades condicionadas. Solo podríamos borrar las condiciones si justificáramos independencia; no basta con que resulte más sencillo escribir el producto.»

**Realización**

1. Árbol de tres etapas, con la ruta objetivo destacada.
2. Etiquetas 0,4 y 0,5 dentro de sus grupos; $0{,}4\times0{,}5=0{,}2$.
3. Añadir 0,75 al último grupo y $0{,}2\times0{,}75=0{,}15$.
4. Construir $P(A\cap B\cap C)=P(A)P(B\mid A)P(C\mid A\cap B)$ siguiendo el árbol.

### independencia-sucesos / producto

**Locución**

1. «Hola. Dos controles pueden fallar. Vamos a distinguir no poder fallar juntos de no informarnos uno sobre el otro. Lo segundo es independencia.»
2. «El primero falla con probabilidad dos décimas y el segundo con tres décimas. Si son independientes, fallar ambos tiene probabilidad seis centésimas: el producto de las dos. Sí pueden ocurrir juntos.»
3. «Para comprobar independencia comparamos ese producto con la probabilidad conjunta del modelo. Tiene que coincidir exactamente. Esta definición no divide y sirve también cuando algún suceso tiene probabilidad cero.»
4. «Si los fallos fueran incompatibles, su conjunta sería cero. Con probabilidades individuales positivas, eso no coincide con el producto. Conocer un fallo descartaría el otro. La independencia debe venir del mecanismo o de una comprobación; sin reemplazo, por ejemplo, lo disponible cambia después de seleccionar.»

**Realización**

1. Dos controles con estados fallo/no fallo.
2. Producto $0{,}2\times0{,}3=0{,}06$ y casilla «ambos» no vacía.
3. $P(A\cap B)=P(A)P(B)$ con conjunta y producto en columnas distintas.
4. Contrastar incompatibilidad con producto positivo; esquema de extracción sin devolución, sin declararla independiente.

### independencia-sucesos / comprobar-informacion

**Locución**

1. «Hola. Vamos a comprobar independencia preguntando si una información cambia la probabilidad. Mantengamos los fallos individuales en dos y tres décimas, pero supongamos que ambos fallan con una décima.»
2. «Si sabemos que falló be, nos quedamos dentro de ese grupo. La probabilidad de fallo a pasa a ser una décima dividida entre tres décimas: un tercio.»
3. «Antes de conocer be era dos décimas. Después es un tercio. La respuesta ha cambiado, así que hay dependencia. Esta comprobación condicionada requiere que el grupo conocido tenga probabilidad positiva.»
4. «En datos reales, escribir una célula por fila no la convierte en réplica independiente. Las células de un mismo cultivo pueden compartir medio, tratamiento y otras fuentes de variación. La independencia habla de cómo se generan los resultados, no de cómo los colocamos en una tabla.»

**Realización**

1. Tabla con marginales 0,2 y 0,3, conjunta 0,1.
2. Seleccionar B y mostrar $P(A\mid B)=0{,}1/0{,}3=1/3$.
3. Comparar «antes 0,2» y «dado B 1/3» sin redondear ambos al mismo valor.
4. Células agrupadas por cultivo con una fuente de entorno compartida.

### independencia-sucesos / independencia-mutua

**Locución**

1. «Hola. Con tres sucesos, comprobar cada pareja puede no bastar. Vamos a verlo con dos bits independientes: cada uno puede ser cero o uno con la misma probabilidad.»
2. «A significa primero uno; be, segundo uno; ce, que los bits difieren. Cada suceso tiene probabilidad una mitad. Cada pareja coincide en uno de los cuatro resultados: un cuarto, justo el producto de dos mitades.»
3. «Pero si ocurren a y be, los dos bits son uno. Entonces no pueden diferir: la intersección triple está vacía. Su probabilidad es cero, mientras que el producto de tres mitades sería un octavo.»
4. «Tenemos independencia por parejas, pero no independencia mutua. Para afirmar la segunda hay que comprobar también las triples y las demás subcolecciones. Las parejas no contienen toda la información de un conjunto de sucesos.»

**Realización**

1. Cuatro resultados 00,01,10,11 con masa 1/4.
2. Selecciones A, B, C; recorrer las tres intersecciones por parejas.
3. Intentar seleccionar la triple y contrastar $P(A\cap B\cap C)=0$ con $(1/2)^3=1/8$.
4. Revelar $P(\bigcap_{i\in J}A_i)=\prod_{i\in J}P(A_i)$; identificar J como cualquier subcolección requerida.

### bayes-diagnostico / rutas-positivas

**Locución**

1. «Hola. Una prueba detecta ocho de cada diez plantas infectadas. Si una planta da positivo, ¿podemos decir que tiene ocho décimas de probabilidad de infección? Vamos a contar de dónde vienen los positivos.»
2. «Imaginemos mil plantas: cien infectadas y novecientas sin infección. Entre las infectadas esperamos ochenta positivos. Esa es la sensibilidad: positivos dentro del grupo infectado.»
3. «La especificidad es nueve décimas: negativos entre quienes no tienen infección. Por tanto, una décima de las novecientas daría un falso positivo. Son noventa: más que los ochenta positivos verdaderos.»
4. «Reunimos los positivos de ambos grupos y obtenemos ciento setenta. Este será el total para la pregunta inversa. Son recuentos esperados de un ejemplo ficticio, no observaciones clínicas. Primero hemos seguido las rutas; la fórmula vendrá a resumirlas.»

**Realización**

1. Pregunta «¿infectada entre positivas?» sin respuesta anticipada.
2. Árbol 100/900; construir $0{,}8\times100=80$.
3. Especificidad y su complemento: $1-0{,}9=0{,}1$; $0{,}1\times900=90$.
4. Reunir únicamente las dos ramas positivas: $80+90=170$. Todas las etiquetas deben decir «esperados».

### bayes-diagnostico / posterior

**Locución**

1. «Hola. Ya reunimos ciento setenta positivos esperados: ochenta de plantas infectadas y noventa de plantas sin infección. Ahora sí, ¿qué parte de los positivos procede del grupo infectado?»
2. «Dividimos ochenta entre ciento setenta. Sale aproximadamente cuarenta y siete por ciento. No es la sensibilidad de ochenta por ciento: ahora el denominador contiene todos los positivos, también los falsos.»
3. «Bayes hace esta inversión. La probabilidad previa describe el grupo antes de la prueba. La probabilidad del positivo dentro de ese grupo pondera su ruta. La posterior describe el grupo después de conocer el positivo.»
4. «El denominador reúne todas las rutas compatibles con la observación y debe ser positivo. Si hubiera más grupos, sumaríamos sus aportaciones ponderadas. No haríamos una media simple: un grupo pequeño y uno grande no aportan el mismo número de positivos.»

**Realización**

1. Marco exclusivo para las 170 positivas, conservando su procedencia.
2. $80/170\approx0{,}4706$ y etiqueta «valor predictivo positivo».
3. Construir $P(A_j\mid B)=P(B\mid A_j)P(A_j)/P(B)$ con colores coherentes con las rutas.
4. Desplegar $P(B)=\sum_iP(B\mid A_i)P(A_i)$; distinguir previa, verosimilitud y posterior.

### bayes-diagnostico / negativos-y-prevalencia

**Locución**

1. «Hola. Vamos a hacer la misma pregunta con un resultado negativo. De las plantas sin infección esperamos ochocientos diez negativos; de las infectadas, veinte. El grupo negativo tiene ochocientos treinta en total.»
2. «La probabilidad de no tener infección dado un negativo compara ochocientos diez con ochocientos treinta: aproximadamente noventa y siete coma seis por ciento. No usamos el total anterior de los positivos.»
3. «Ahora cambia la población, no la prueba. Si solo una de cada cien plantas está infectada, en mil esperamos ocho positivos verdaderos y noventa y nueve falsos. Entre los ciento siete positivos, solo ocho proceden de infectadas.»
4. «El valor predictivo positivo cae a alrededor de siete coma cinco por ciento. La sensibilidad y la especificidad no cambiaron; cambió el tamaño de los grupos de partida. Por eso una prueba no tiene un valor predictivo universal para todas las poblaciones.»

**Realización**

1. Seleccionar ramas negativas 810 y 20; $810+20=830$.
2. $\mathrm{VPN}=810/830\approx0{,}9759$, con pregunta explícita.
3. Nueva población de prevalencia 1 %; cambiar ramas a 8 y 99 sin modificar parámetros de la prueba.
4. $\mathrm{VPP}=8/107\approx0{,}0748$; comparación de poblaciones. No presentar el ejemplo como recomendación diagnóstica.