# Guiones docentes y realización visual

Propuesta editorial para sustituir las locuciones de los vídeos del curso.
No modifica el texto de estudio, el reproductor ni los audios publicados.
Contiene los 118 apartados de las 36 lecciones del temario: 472 intervenciones
con sus correspondientes indicaciones visuales. Los identificadores corresponden
a los apartados de [lesson-sections.js](../../pages/inferencia/lesson-sections.js).
Las dos listas numeradas de cada apartado se corresponden: realización 2 acompaña
a locución 2, por ejemplo. Si una intervención contiene varias cuentas, se revelan
en el orden de las frases, no todas al comenzar la intervención.

## Índice de producción

Cada fila identifica una lección y su primer apartado. Los demás apartados de
esa lección aparecen inmediatamente después, en orden de montaje. El repaso
global de la teoría se compone encadenándolos, con el tratamiento de bienvenida
y transiciones indicado a continuación; no se intercala una segunda versión
del mismo concepto tomada de los apuntes. Este documento no sustituye los
enunciados ni las soluciones dependientes de datos del banco de ejercicios.

| Lección | Apartados | Comienzo del guion |
| --- | ---: | --- |
| Proporciones, unidades y órdenes de magnitud | 3 | [Parte y total](#proporciones--parte-y-total) |
| Despejar parámetros sin cambiar el problema | 3 | [Balanza](#algebra--balanza) |
| Funciones, intervalos y sumatorios | 3 | [Entrada y salida](#funciones--entrada-y-salida) |
| Derivadas, integrales y área acumulada | 3 | [Franjas](#calculo--franjas) |
| Regiones del plano y matrices | 3 | [Frontera](#regiones-matrices--frontera) |
| Experimentos, sucesos y conjuntos observables | 3 | [Resultados y sucesos](#sucesos--resultados-y-sucesos) |
| Axiomas, solapamientos y frecuencia relativa | 4 | [Probabilidades coherentes](#axiomas--probabilidades-coherentes) |
| Contar resultados: orden y repetición | 3 | [Posiciones](#combinatoria--posiciones) |
| Condicionar es cambiar el universo relevante | 3 | [Grupo conocido](#condicionada--grupo-conocido) |
| Independencia no significa incompatibilidad | 3 | [Producto](#independencia-sucesos--producto) |
| Probabilidad total, Bayes y pruebas diagnósticas | 3 | [Rutas positivas](#bayes-diagnostico--rutas-positivas) |
| De resultados a variables y acumuladas | 3 | [Regla observable](#variable-cdf--regla-observable) |
| Masas discretas, indicadores y normalización | 3 | [Agrupar y normalizar](#masa--agrupar-y-normalizar) |
| Densidad continua y probabilidad por áreas | 3 | [Altura y área](#densidad--altura-y-area) |
| Esperanza y funciones de una variable | 3 | [Promedio ponderado](#esperanza--promedio-ponderado) |
| Varianza, desviación y cambios de escala | 3 | [Distancias](#varianza--distancias) |
| Momentos, colas y transformaciones | 4 | [Ordinarios y centrales](#momentos-transformaciones--ordinarios-y-centrales) |
| Bernoulli y binomial: ensayos con dos resultados | 3 | [Ensayos](#bernoulli-binomial--ensayos) |
| Poisson: recuentos por exposición y eventos raros | 3 | [Exposición](#poisson--exposicion) |
| Hipergeométrica: muestrear sin reemplazo | 3 | [Sin reemplazo](#hipergeometrica--sin-reemplazo) |
| Geométrica y binomial negativa: esperar éxitos | 4 | [Primera detección](#geometrica-negativa--primera-deteccion) |
| Uniformes y simulación por cuantiles | 3 | [Dos uniformes](#uniforme-montecarlo--dos-uniformes) |
| Exponencial: tiempos y carencia de memoria | 3 | [Escala y supervivencia](#exponencial--escala-y-supervivencia) |
| Normal: tipificación, colas y cuantiles | 4 | [Centro y escala](#normal--centro-y-escala) |
| Gamma: sumar esperas y separar forma de escala | 4 | [Etapas y parámetros](#gamma--etapas-y-parametros) |
| Cauchy y Weibull: colas y riesgo cambiante | 4 | [Centro sin media](#cauchy-weibull--centro-sin-media) |
| Calcular con distribuciones y comprobar supuestos | 3 | [Operación correcta](#calculo-modelos--operacion-correcta) |
| Familia exponencial, GLM e introducción a estimación | 6 | [Piezas Poisson](#familia-exponencial--piezas-poisson) |
| Vectores y tablas de probabilidad conjunta | 3 | [Parejas](#conjunta-discreta--parejas) |
| Multinomial: varias categorías con total fijo | 3 | [Categorías y secuencias](#multinomial--categorias-y-secuencias) |
| Marginales: conservar una medida y olvidar otra | 3 | [Sumar la otra](#marginales--sumar-la-otra) |
| Densidades conjuntas y distribuciones condicionales | 3 | [Normalizar región](#conjunta-condicional--normalizar-region) |
| Normal bivariante: marginales y predicción condicionada | 4 | [Modelo conjunto](#normal-bivariante--modelo-conjunto) |
| Independencia de variables y factorización | 3 | [Factorizar tabla](#independencia-variables--factorizar-tabla) |
| Covarianza, correlación y matrices | 3 | [Desviaciones compartidas](#covarianza-matrices--desviaciones-compartidas) |
| Combinaciones lineales e incorrelación | 3 | [Suma y diferencia](#combinaciones-incorrelacion--suma-y-diferencia) |

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
   primera bienvenida y omitir el «Hola» de los siguientes. El resto del primer
   párrafo ya introduce el nuevo paso o ejemplo y actúa como transición.
  No acelerar la explicación para recuperar el tiempo de esas transiciones.
- En el repaso global, colocar la ampliación opcional como capítulo separado
   e identificado. No hacerla un requisito para entender el cierre de la teoría.
- Como presupuesto inicial de duración, dividir las palabras por el ritmo
   elegido y añadir las pausas de pregunta, lectura y cambio de figura. Medir
   después la locución real: no repartir el audio uniformemente entre pantallas.
- Mantener una figura de contexto durante la presentación. La pregunta puede
   estar visible, pero no su respuesta. Un cambio de escena debe preservar los
   datos y la selección que siguen siendo necesarios para el siguiente paso.
- Las fórmulas largas pueden ocupar planos sucesivos: recuperar los términos
   ya definidos antes de reunirlos. Nunca reducirlos hasta volverlos ilegibles
   ni obligar a leer una pantalla densa mientras la voz introduce otra idea.
- Antes de producir un lote completo, revisar una locución breve, una cuenta
   con varios pasos y una explicación de gráfico. Escuchar dicción, silencios y
   ritmo de comprensión; una prueba de texto no valida esas cualidades.
- Entregar por apartado locución, subtítulos del texto realmente grabado,
   correspondencia entre intervenciones y planos y marcas medidas en el nuevo
   audio. No reutilizar las marcas, los fragmentos ni la firma de un lote anterior.

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

## Variables aleatorias y resúmenes

### variable-cdf / regla-observable

**Locución**

1. «Hola. Antes de mirar un campo de larvas, vamos a fijar qué mediremos: su número. La regla de contar ya está decidida. Lo que desconocemos es el valor que saldrá.»
2. «Llamamos equis mayúscula a esa regla. A cada resultado detallado le asigna un número. Distintos campos pueden contener dos larvas y producir el mismo recuento, aunque las larvas no sean las mismas.»
3. «Después de observar obtenemos una realización concreta. Equis minúscula también puede servir como umbral en una pregunta: por ejemplo, no superar dos larvas. El contexto nos dice si hablamos de un dato o de un límite.»
4. «La condición de medibilidad exige que esas preguntas, para cualquier umbral real, sean sucesos a los que podamos asignar probabilidad. No exige resultados equiprobables ni conocer la respuesta. Permite llevar la incertidumbre del experimento a una medida numérica bien definida.»

**Realización**

1. Campos diferentes y regla fija «contar larvas».
2. Flechas de resultados a recuentos; $X:\Omega\to\mathbb R$.
3. Separar «regla X», «realización» y «umbral x»; seleccionar campos con recuento $\leq2$.
4. Mostrar $\{\omega:X(\omega)\leq x\}\in\mathcal A$ por piezas, vinculadas al dibujo.

### variable-cdf / escalones

**Locución**

1. «Hola. Nuestro modelo permite cero, una o dos larvas, con probabilidades dos décimas, cinco décimas y tres décimas. Vamos a preguntar cuánto llevamos reunido hasta un umbral.»
2. «Hasta una larva entran cero y una. Sus probabilidades suman siete décimas. Esa es la acumulada en uno. No es la probabilidad de exactamente una: también incluye el cero.»
3. «Si movemos el umbral a uno coma cinco, no aparece ningún resultado nuevo. La acumulada sigue en siete décimas. Al llegar a dos añadimos las tres décimas restantes y alcanzamos uno.»
4. «Por eso el dibujo tiene escalones. En cada salto, el valor de la acumulada ya incluye el punto y coincide con el tramo de su derecha. Nunca baja. Menos de uno excluye el uno; como máximo uno lo incluye. Leer esa diferencia viene antes que la suma.»

**Realización**

1. Masas en 0,1,2; eje con huecos sin masa.
2. Selección hasta 1: $0{,}2+0{,}5=0{,}7$.
3. Mover umbral 1→1,5→2; construir los escalones y mantener $F(1{,}5)=0{,}7$.
4. Círculos abiertos/cerrados correctos en los saltos; contrastar $P(X<1)=0{,}2$ y $P(X\leq1)=0{,}7$.

### variable-cdf / intervalos-y-saltos

**Locución**

1. «Hola. Vamos a obtener un intervalo a partir de lo acumulado. Queremos más de cero y como máximo dos larvas. Hasta dos llevamos todo; debemos quitar lo que ya estaba incluido hasta cero.»
2. «Restamos dos décimas de uno y quedan ocho décimas. La regla general resta la acumulada en el extremo inferior de la del superior, para un intervalo abierto abajo y cerrado arriba.»
3. «Para una probabilidad puntual miramos el salto. En uno, la acumulada sube de dos a siete décimas: la diferencia, cinco décimas, es la masa en uno. La altura total arrastra también lo anterior.»
4. «La acumulada sirve para cualquier variable real y tiende a cero y uno en los extremos de la recta. Una variable con densidad acumula sin saltos. Pero no toda acumulada continua tiene densidad: existen modelos continuos singulares. Aquí basta con no confundir esas afirmaciones.»

**Realización**

1. Seleccionar las masas 1 y 2 y marcar cero como excluido.
2. $1-0{,}2=0{,}8$; después $P(a<X\leq b)=F(b)-F(a)$.
3. Ampliar el salto en 1: $p_X(1)=F(1)-F(1^-)=0{,}5$.
4. Flechas hacia límites 0 y 1; distinguir «con densidad» de «acumulada continua» sin introducir una falsa equivalencia.

### masa / agrupar-y-normalizar

**Locución**

1. «Hola. Tenemos cero, dos o cuatro brotes, con pesos uno, tres y uno. Vamos a convertir esos pesos relativos en probabilidades. No tienen que ser valores consecutivos.»
2. «Los pesos suman cinco. Dividir cada uno por cinco conserva sus relaciones y hace que el total sea uno. Obtenemos dos décimas, seis décimas y dos décimas.»
3. «Cada fila asigna probabilidad a un valor exacto. Si varios resultados detallados producen dos brotes, sus probabilidades se reúnen en esa misma fila. Eso es una función de masa.»
4. «Comprueba que ninguna masa sea negativa y que todas sumen uno. El soporte recoge los valores con masa positiva; puede ser finito o numerable y tener huecos. Si añadimos un estado con un peso nuevo, debemos volver a normalizar todo el conjunto, no pegar una probabilidad extra al reparto anterior.»

**Realización**

1. Tabla valor/peso con filas 0/1,2/3,4/1.
2. $1+3+1=5$, $c=1/5$ y columna de masas revelada fila a fila.
3. Agrupar varios resultados que llegan a la fila 2; identificar $p_X(2)=0{,}6$.
4. Barra total 1 y soporte {0,2,4}; dejar 1 y 3 sin barras.

### masa / intervalos-discretos

**Locución**

1. «Hola. Vamos a usar la tabla de cero, dos y cuatro brotes para distinguir al menos dos de más de dos. Las palabras deciden qué filas sumaremos.»
2. «Al menos dos incluye dos y cuatro. Sus masas, seis décimas y dos décimas, suman ocho décimas. Más de dos excluye el dos y solo deja cuatro: dos décimas.»
3. «Uno y tres no tienen masa. Aunque el umbral pueda ser cualquier número real, eso no crea resultados nuevos entre las filas de la tabla.»
4. «Para al menos una aparición suele ser más fácil quitar el caso ninguna del total. La acumulada también ayuda a reunir filas, pero siempre comprueba dónde acaba el grupo que estás excluyendo. En una variable discreta, desplazar un extremo puede cambiar la respuesta.»

**Realización**

1. Tabla con masas 0,2;0,6;0,2.
2. Selecciones $X\geq2$ y $X>2$ en pasadas separadas; revelar 0,8 y 0,2.
3. Umbral móvil entre filas, sin interpolar barras.
4. Resaltar $P(X\geq1)=1-P(X=0)$ en este soporte; mostrar qué fila se excluye.

### masa / interruptores

**Locución**

1. «Hola. Podemos convertir una condición en una variable muy simple: un indicador. Vale uno cuando la condición se cumple y cero cuando no. Pensemos en tener un marcador.»
2. «Para registrar ambos marcadores multiplicamos sus indicadores. Solo cuando los dos valen uno el producto vale uno. Si alguno vale cero, el producto se apaga.»
3. «Para al menos uno, sumar sin más falla: con ambos presentes obtendríamos dos. Restamos una copia del producto y ese caso vuelve a valer uno. Los demás casos siguen siendo correctos.»
4. «El indicador responde sí o no a una condición. No cuenta cuántos marcadores hay. Por eso su esperanza es la probabilidad de que ocurra esa condición: ponderar el valor uno deja exactamente su probabilidad. Entender el interruptor ayuda a construir después recuentos y fórmulas de unión.»

**Realización**

1. Tabla de cuatro casos con $I_A,I_B$ en 0/1.
2. Añadir columna $I_AI_B$ y asociarla a $A\cap B$.
3. Columna de suma 0,1,1,2; corregir con $I_{A\cup B}=I_A+I_B-I_AI_B$.
4. Dejar la tabla final binaria y $E[I_A]=P(A)$. No dibujar un indicador de unión con valor 2.

### densidad / altura-y-area

**Locución**

1. «Hola. Una reacción dura entre cero y medio minuto. Su densidad constante tiene altura dos por minuto. ¿Eso es inválido porque dos supera uno? Vamos a mirar el área.»
2. «La base mide medio minuto. Altura por base da uno: toda la probabilidad queda en el intervalo permitido. Entre una y tres décimas de minuto la anchura es dos décimas; el área vale cuatro décimas.»
3. «Un instante exacto tiene anchura cero y no aporta área. Su probabilidad es cero aunque la densidad sea positiva. Cada observación concreta sigue produciendo un tiempo; no hay contradicción.»
4. «La densidad tiene unidades inversas de tiempo y la probabilidad no tiene unidades. Si un aparato redondea, su lectura representa un pequeño intervalo de resolución, no un punto de precisión infinita. Ese intervalo sí puede tener probabilidad positiva.»

**Realización**

1. Rectángulo [0,0,5] de altura 2/min.
2. $2\times0{,}5=1$; sombrear [0,1;0,3] y calcular $2\times0{,}2=0{,}4$.
3. Contraer una franja hasta una línea; $P(T=t)=0$ separado de $f(t)=2$.
4. Mostrar una lectura redondeada como intervalo estrecho; etiquetar sus límites y resolución.

### densidad / densidad-creciente

**Locución**

1. «Hola. La densidad de una fracción es una constante por el valor de esa fracción, entre cero y uno. Antes de preguntar por una zona, tenemos que conseguir área total uno.»
2. «El dibujo es un triángulo de base uno y altura final ce. Su área es ce dividido entre dos. Para que valga uno, ce debe ser dos.»
3. «La densidad queda dos por equis. A medida que avanzamos a la derecha hay más altura y, por la misma anchura, más área. Una primitiva es equis al cuadrado: hasta medio acumulamos un cuarto.»
4. «Por tanto, a la derecha de medio queda tres cuartos, no una mitad. La altura en ocho décimas sería uno coma seis, pero no es la probabilidad de ese punto. Como siempre en una densidad, interpretamos áreas de intervalos.»

**Realización**

1. Triángulo con altura desconocida c y base 1.
2. $c/2=1$; despejar $c=2$ antes de mostrar probabilidades parciales.
3. Recta $f(x)=2x$ y sombreado [0,0,5]; $F(0{,}5)=0{,}25$.
4. Cambiar sombreado a [0,5;1] y revelar 0,75; distinguir altura $f(0{,}8)=1{,}6$ de área.

### densidad / acumulada-por-tramos

**Locución**

1. «Hola. Ya sabemos que, dentro de cero a uno, la acumulada de nuestra densidad es equis al cuadrado. Vamos a completar el dibujo fuera de ese soporte.»
2. «Antes de cero no hemos reunido probabilidad: la acumulada vale cero. Dentro del soporte crece como el cuadrado. Después de uno ya hemos reunido todo y permanece en uno.»
3. «No podemos seguir usando el cuadrado fuera del tramo: acabaría dando probabilidades mayores que uno. Donde corresponde derivar la acumulada, su pendiente devuelve la densidad. En general esta relación se exige casi en todas partes, no necesariamente en cada punto aislado.»
4. «Cambiar la altura de una densidad en un solo punto no modifica ninguna área. Tampoco incluir o excluir los extremos cambia la probabilidad de este modelo con densidad. Comprueba soporte, signo y total; después contrasta un intervalo integrando o restando acumuladas.»

**Realización**

1. Eje que se extiende antes de 0 y después de 1.
2. Revelar $F(x)=\begin{cases}0&x<0\\x^2&0\leq x\leq1\\1&x>1\end{cases}$ junto a sus tres tramos.
3. Tangente dentro del soporte; fuera, horizontales. No prolongar la parábola.
4. Comparar área [a,b] con $F(b)-F(a)$; dejar visible la cota [0,1].

### esperanza / promedio-ponderado

**Locución**

1. «Hola. Un campo puede tener cero o cuatro células activadas, cada caso con probabilidad una mitad. ¿Qué número resume el promedio del modelo? No buscamos adivinar el próximo campo.»
2. «Multiplicamos cada resultado por su probabilidad. Cero aporta cero; cuatro por una mitad aporta dos. Sumamos las aportaciones y obtenemos una esperanza de dos.»
3. «Ningún campo de este modelo contiene dos. La esperanza puede quedar entre resultados posibles y no tiene por qué ser el más frecuente. Resume el promedio bajo el mecanismo, no promete una observación concreta.»
4. «Con una densidad seguimos ponderando valores, pero acumulamos con una integral. Y si las colas son infinitas, debemos comprobar que la esperanza finita existe: integrar el valor absoluto ponderado debe dar un total finito. No todas las distribuciones permiten ese resumen.»

**Realización**

1. Barras en 0 y 4, ambas de altura 1/2.
2. Tabla valor, probabilidad, aportación; $0\times0{,}5=0$ y $4\times0{,}5=2$.
3. Marcar el centro $E[X]=2$ sin dibujar masa en 2.
4. Presentar $E[X]=\int x f_X(x)\,dx$ y condición $E[|X|]<\infty$ para esperanza finita.

### esperanza / transformar-valores

**Locución**

1. «Hola. La señal ahora depende del cuadrado del recuento. ¿Podemos cuadrar directamente la media? Vamos a seguir cada resultado antes de promediar.»
2. «Los valores cero y cuatro se transforman en cero y dieciséis. Conservan sus probabilidades, una mitad cada uno. El promedio de los cuadrados es ocho.»
3. «En cambio, la media original era dos y su cuadrado es cuatro. Ocho y cuatro responden a operaciones distintas: transformar cada resultado y después promediar no es transformar el promedio.»
4. «Si llamamos ge a una transformación, ponderamos ge de cada valor con las probabilidades originales. En continuo usamos la densidad original y una integral. Para calcular esta esperanza no necesitamos reconstruir antes toda la distribución de la señal: nos basta con saber qué salida produce cada entrada y comprobar que el promedio exista.»

**Realización**

1. Dos ramas de transformación $X\to X^2$.
2. Tabla 0→0 y 4→16 con pesos 1/2; revelar $E[X^2]=8$.
3. Columna separada $(E[X])^2=4$; contraste sin signo de igualdad.
4. $E[g(X)]=\sum_i g(x_i)p_X(x_i)$; para continuo, $\int g(x)f_X(x)\,dx$.

### esperanza / linealidad-y-colas

**Locución**

1. «Hola. Cada célula aporta tres unidades de señal y el aparato añade una fija. Si el recuento medio es dos, vamos a averiguar la señal media sin recalcular todos los resultados.»
2. «Triplicar el recuento triplica su promedio: pasa a seis. Añadir una unidad a cada lectura añade una al promedio: queda siete. Esta es la linealidad de la esperanza.»
3. «La regla se extiende a sumas de variables y no necesita independencia, siempre que las esperanzas utilizadas existan. Pero no funciona igual con productos. Separar el promedio de un producto exige condiciones adicionales, como independencia e integrabilidad.»
4. «Las colas importan. Una variable no negativa puede tener esperanza infinita. Y si las contribuciones positiva y negativa divergen, no podemos cancelarlas para fabricar una media finita. Antes de aplicar una propiedad, comprobamos que los resúmenes que usa estén definidos.»

**Realización**

1. Flujo de señal $X\to3X\to3X+1$.
2. Recorrido de medias 2→6→7.
3. $E[aX+bY+c]=aE[X]+bE[Y]+c$; separar de $E[XY]=E[X]E[Y]$ bajo independencia e integrabilidad.
4. Dos colas con aportaciones separadas; no animar «infinito menos infinito» como cero.

### varianza / distancias

**Locución**

1. «Hola. Dos modelos pueden tener la misma media y resultados muy distintos. Vamos a medir cuánto se alejan del centro, sin dejar que las distancias positivas y negativas se cancelen.»
2. «Con cero, uno y dos, de probabilidades un cuarto, una mitad y un cuarto, la media es uno. Las desviaciones son menos uno, cero y uno. Al cuadrarlas quedan uno, cero y uno.»
3. «Ponderamos esos cuadrados con las probabilidades originales. Los extremos aportan un cuarto cada uno y el centro aporta cero. La varianza es una mitad: el promedio de las desviaciones cuadradas.»
4. «La varianza usa unidades al cuadrado. Para volver a las unidades originales tomamos su raíz no negativa: aproximadamente cero coma setenta y uno. Esa es la desviación típica. No es otra media ni una garantía sobre cuánto se alejará cada observación.»

**Realización**

1. Distribuciones con igual centro y anchuras distintas.
2. Tabla valor/desviación/cuadrado, columnas reveladas sucesivamente.
3. Añadir pesos; $1\times1/4+0\times1/2+1\times1/4=1/2$.
4. $\sigma=\sqrt{1/2}\approx0{,}707$; distinguir unidades originales y cuadradas.

### varianza / segundo-momento

**Locución**

1. «Hola. Vamos a calcular la misma varianza por otro camino. Esta identidad necesita momentos finitos y nos permite usar el promedio de los cuadrados originales.»
2. «Los valores cero, uno y dos al cuadrado son cero, uno y cuatro. Con sus pesos anteriores, el promedio da uno coma cinco. Ese es el segundo momento, no todavía la varianza.»
3. «La media vale uno y su cuadrado también uno. Lo restamos del segundo momento: uno coma cinco menos uno da una mitad. Coincide con el cálculo de las desviaciones respecto al centro.»
4. «Una varianza negativa no tiene interpretación: señala un error. Además, restar números grandes y casi iguales puede perder precisión en una calculadora. Si ocurre, conviene volver al cálculo centrado. Las dos fórmulas son equivalentes matemáticamente, pero no siempre se comportan igual al redondear.»

**Realización**

1. Recuperar la tabla anterior sin anticipar su resultado.
2. $E[X^2]=1{,}5$ con aportaciones visibles.
3. $(E[X])^2=1$; luego $1{,}5-1=0{,}5$ y $\operatorname{Var}(X)=E[X^2]-(E[X])^2$.
4. Comparación conceptual «resta de números cercanos» frente a «desviaciones pequeñas»; no aceptar un valor negativo como redondeo inocuo.

### varianza / estirar-y-desplazar

**Locución**

1. «Hola. Una longitud tiene media dos milímetros y desviación tres décimas. Vamos a expresarla en micrómetros sin cambiar físicamente la medida.»
2. «Cada milímetro son mil micrómetros. La media pasa a dos mil y la desviación a trescientos. Las distancias se multiplican por mil, igual que las medidas.»
3. «La varianza original es nueve centésimas de milímetro cuadrado. Como usa distancias cuadradas, su factor es un millón: pasa a noventa mil micrómetros cuadrados. Añadir una constante, en cambio, solo mueve el centro; no cambia la dispersión.»
4. «Un factor negativo invierte la dirección del eje, pero su cuadrado mantiene la varianza no negativa. Y al sumar dos lecturas hay que contar su variación compartida. Solo con condiciones como independencia y varianzas finitas podemos omitir la covarianza; en medidas emparejadas no la damos por supuesta.»

**Realización**

1. Eje en mm con centro 2 y desviación 0,3.
2. Reetiquetar el mismo eje en µm: centro 2000 y desviación 300.
3. $0{,}09\times1000^2=90000$; desplazamiento del eje sin estirar distancias.
4. $\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)$ y mención separada del término de covarianza en sumas.

### momentos-transformaciones / ordinarios-y-centrales

**Locución**

1. «Hola. La palabra momento puede sonar abstracta. Aquí significa promediar una potencia de la variable. Vamos a distinguir usar los valores originales de usar sus distancias al centro.»
2. «El momento ordinario de orden ka promedia los valores elevados a ka. El primero es la esperanza. Para un momento central restamos antes la media y después elevamos esa desviación a la potencia.»
3. «Con cero y dos equiprobables, la media es uno. El promedio de los cuadrados originales es dos. Pero las desviaciones son menos uno y uno: el promedio de sus cuadrados es uno. Son dos resúmenes diferentes.»
4. «El primer momento central vale cero, porque las desviaciones se equilibran. El segundo central es la varianza. Siempre precisamos qué potencia y qué referencia usamos, y comprobamos que el momento exista; no todos los órdenes están disponibles en todos los modelos.»

**Realización**

1. Valores 0,2 con pesos 1/2 y centro 1.
2. $m_k=E[X^k]$ frente a $\mu_k=E[(X-E[X])^k]$.
3. Dos tablas paralelas: cuadrados 0,4 y cuadrados centrados 1,1; resultados 2 y 1.
4. Relacionar $m_1$, $\mu_1$ y $\mu_2$ con esperanza, cero y varianza; evitar leer una lista de símbolos sin referencia.

### momentos-transformaciones / ejemplo-area

**Locución**

1. «Hola. Una longitud es uniforme entre cero y uno y queremos el promedio de su cuadrado, como medida de área. Que la longitud sea uniforme no significa que el área también lo sea.»
2. «La densidad original vale uno. Ponderamos el cuadrado de cada longitud con esa densidad e integramos entre cero y uno. Una primitiva es el cubo dividido entre tres.»
3. «Evaluar en uno y restar el valor en cero deja un tercio. En cambio, la longitud media es una mitad y cuadrarla da un cuarto. El promedio del área no coincide con el área calculada a partir de la longitud media.»
4. «La diferencia, un doceavo, es la varianza de la longitud. No hemos supuesto independencia ni construido una nueva densidad uniforme. Hemos seguido la transformación de cada valor antes de promediar: ese orden es la idea que conviene conservar.»

**Realización**

1. Segmentos de distintas longitudes y sus cuadrados; pesos desde la uniforme original.
2. $E[X^2]=\int_0^1x^2\,dx$ y primitiva $x^3/3$.
3. Revelar $E[X^2]=1/3$ y, aparte, $(E[X])^2=1/4$.
4. $1/3-1/4=1/12$; identificar unidades de longitud al cuadrado.

### momentos-transformaciones / estandarizacion-y-existencia

**Locución**

1. «Hola. Vamos a comparar formas sin que las unidades cambien el resumen. Para ello dividimos cada momento central por la potencia correspondiente de la desviación. Necesitamos que el momento exista y que la desviación sea positiva y finita.»
2. «Con cero y cuatro equiprobables, la media es dos y las desviaciones son menos dos y dos. Sus cubos se cancelan: el tercer momento central es cero. Dividirlo por dos al cubo sigue dando cero, coherente con la simetría del ejemplo.»
3. «Las cuartas potencias valen dieciséis en ambos casos. Su promedio es dieciséis; dividir por dos a la cuarta da uno. Es el cuarto momento estandarizado. El exceso de curtosis sería ese valor menos tres, no el mismo número.»
4. «Estos resúmenes no describen toda la distribución. Si todas las lecturas fueran dos, la desviación sería cero y no podríamos estandarizar. Y una curva simétrica puede carecer de media: cancelar colas divergentes no define una esperanza. La existencia se comprueba en el modelo, no solo mirando una muestra finita.»

**Realización**

1. $\mu_k/\sigma^k$ con explicación de numerador, denominador y condiciones.
2. Tabla X:0,4; desviaciones:-2,2; cubos:-8,8. Revelar promedio 0 y cociente $0/2^3$ en pasos separados.
3. Cuartas potencias 16,16; promedio 16; después $16/2^4=1$. Separar «curtosis 1» de «exceso -2».
4. Distribución constante con $\sigma=0$ y división no definida; advertencia de colas. Dejar pausas adicionales entre las dos cuentas de momentos.

### momentos-transformaciones / cambio-de-distribucion

**Locución**

1. «Hola. Esta es una ampliación opcional. Vamos a obtener la distribución del cuadrado de una longitud uniforme entre cero y uno. Primero mira qué valores puede alcanzar la nueva variable: también de cero a uno.»
2. «En ese tramo el cuadrado crece. Para que el cuadrado no supere un umbral, la longitud no debe superar su raíz. La acumulada original devuelve esa raíz, así que la nueva acumulada es la raíz del umbral.»
3. «Para obtener una densidad debemos conservar las probabilidades al cambiar las anchuras. La derivada absoluta de la inversa, el jacobiano, ajusta ese cambio. No basta sustituir una letra.»
4. «Si la transformación decrece, cambia el sentido de la desigualdad. Si varias entradas producen una salida, hay que reunir todas las ramas. Cuadrar valores negativos y positivos crea dos caminos. Comprobar soporte y monotonicidad antes de aplicar la fórmula evita perder probabilidad.»

**Realización**

1. Marca «ampliación opcional» y mapa $Y=X^2$ sobre [0,1].
2. $F_Y(y)=P(X\leq\sqrt y)=\sqrt y$ dentro del soporte; completar con 0 y 1 fuera.
3. $f_Y(y)=f_X(g^{-1}(y))|(g^{-1})'(y)|$; para el ejemplo, $1/(2\sqrt y)$ en $0<y<1$.
4. Mostrar una transformación decreciente y las dos ramas de un cuadrado con entradas de ambos signos. No aplicar la fórmula de una sola rama a ese caso.

## Modelos de distribución

### bernoulli-binomial / ensayos

**Locución**

1. «Hola. Vamos a pasar de observar una semilla a contar germinaciones de un lote. Para una semilla basta un indicador: uno si germina, cero si no. Esta variable sigue una Bernoulli.»
2. «La probabilidad de germinar se llama pe. Éxito solo significa el resultado que decidimos contar; no implica que sea bueno. Para tres semillas, sumamos los tres indicadores y obtenemos el número de germinaciones.»
3. «Supongamos independencia y la misma probabilidad, una mitad, para cada semilla. Exactamente dos germinaciones permiten tres patrones: falla la primera, la segunda o la tercera. Cada patrón pesa un octavo; juntos pesan tres octavos.»
4. «La binomial describe este recuento cuando el número de ensayos está fijado, comparten probabilidad y son independientes. Los supuestos explican por qué podemos hacer la cuenta: no vienen garantizados por escribir tres indicadores.»

**Realización**

1. Una semilla con estados 0/1 y etiqueta Bernoulli.
2. Tres semillas; $X=I_1+I_2+I_3$.
3. Patrones 110,101,011, cada uno con 1/8; revelar $3\times1/8=3/8$.
4. Condiciones separadas «n fijo», «p común», «independencia»; no adelantar la fórmula general.

### bernoulli-binomial / masa-y-cola

**Locución**

1. «Hola. Vamos a generalizar la cuenta de germinaciones. Para exactamente ka éxitos entre ene semillas, primero contamos dónde pueden colocarse esos éxitos. De eso se encarga la combinación.»
2. «Cada patrón tiene ka éxitos y ene menos ka fracasos. Sus potencias ponderan lo ocurrido en cada posición. Multiplicar la probabilidad de un patrón por el número de patrones da la masa binomial.»
3. «Como máximo ka suma desde cero hasta ka incluido. Al menos ka empieza en ka. Si usamos el complemento para esta segunda pregunta, quitamos solo hasta ka menos uno.»
4. «Con tres semillas y probabilidad una mitad, al menos una germinación es todo menos ninguna. Ninguna pesa un octavo; el resto, siete octavos. Elegir bien el grupo puede ahorrarnos muchas cuentas sin cambiar el razonamiento.»

**Realización**

1. Elegir k posiciones entre n: $\binom nk$.
2. Revelar $p^k(1-p)^{n-k}$ y después $p_X(k)=\binom nk p^k(1-p)^{n-k}$.
3. Barras de 0 a n con selección $X\leq k$ y $X\geq k$; $P(X\geq k)=1-F(k-1)$.
4. Seleccionar la barra cero y su complemento; $1-1/8=7/8$.

### bernoulli-binomial / momentos-y-diseno

**Locución**

1. «Hola. ¿Cuántas germinaciones esperamos, en promedio, en un lote? Cada semilla aporta una esperanza pe. Sumar ene semillas da ene por pe.»
2. «Con tres semillas y probabilidad una mitad, la media es una coma cinco. No significa que una bandeja tenga media semilla germinada: es un promedio entre repeticiones del mismo modelo.»
3. «La independencia permite sumar las varianzas de los indicadores. Resulta ene por pe por uno menos pe; en este ejemplo, tres cuartos.»
4. «Antes de aplicarlo a un cultivo real, revisa el diseño. Compartir entorno puede crear dependencia y mezclar semillas distintas puede romper la probabilidad común. Una muestra importante sin reemplazo de un lote finito necesita hipergeométrica. Un resultado numérico correcto dentro de la binomial no arregla un mecanismo que no es binomial.»

**Realización**

1. Esperanzas de los indicadores que se suman: $E[X]=np$.
2. Centro 1,5 sobre las barras 0–3, sin masa ficticia en 1,5.
3. $\operatorname{Var}(X)=np(1-p)=3/4$ para el ejemplo.
4. Tres contrastes de diseño: entorno compartido, p distintas, extracción sin devolución.

### poisson / exposicion

**Locución**

1. «Hola. Un sensor registra, por término medio, una coma cinco apariciones por hora. Vamos a observar durante dos horas. ¿La media de esa ventana sigue siendo una coma cinco?»
2. «No: tenemos el doble de tiempo para que aparezcan eventos. Multiplicamos tasa por duración y obtenemos tres apariciones esperadas. A esa media de la ventana la llamamos lambda. No es una probabilidad y puede superar uno.»
3. «Un proceso Poisson homogéneo supone tasa estable e incrementos independientes. En intervalos muy pequeños, la posibilidad de varios eventos debe ser despreciable frente a la de uno.»
4. «Duplicar el tiempo duplica lambda solo mientras la tasa se mantenga estable. Si aparecen eventos en grupos o cambia el entorno, el recuento puede variar mucho más de lo que permite este modelo. Primero identificamos la exposición; luego decidimos si Poisson es razonable.»

**Realización**

1. Línea temporal y tasa 1,5/h.
2. Ventana de 2 h; $\lambda=1{,}5\times2=3$, cancelando horas.
3. Ventanas disjuntas y eventos individuales; etiquetar «supuestos del proceso».
4. Contraste entre tasa estable y ráfagas, sin presentar la simulación como datos reales.

### poisson / masa-y-complemento

**Locución**

1. «Hola. Con una media de tres apariciones, ¿es posible no observar ninguna? Sí. La media no obliga a cada ventana a tener tres eventos.»
2. «Para cero, la masa Poisson se reduce a la exponencial de menos tres: aproximadamente cinco por ciento. Las otras piezas valen uno; recuerda que cero factorial es uno.»
3. «Para un recuento ka, la fórmula combina la exponencial, lambda a la ka y ka factorial. Solo admite enteros no negativos. Más de dos comienza en tres: podemos calcularlo quitando las masas de cero, uno y dos del total.»
4. «Poisson tiene media y varianza iguales a lambda. Esa igualdad es una restricción, no una ley de todos los recuentos biológicos. Si los datos presentan agrupamiento o heterogeneidad, conviene revisar el modelo antes de confiar en sus colas.»

**Realización**

1. Barras Poisson de parámetro 3; marcar la cola fuera del marco si se trunca.
2. $p_X(0)=e^{-3}\approx0{,}0498$ y $0!=1$.
3. $p_X(k)=e^{-\lambda}\lambda^k/k!$; selección complementaria $P(X>2)=1-P(X\leq2)$.
4. Resúmenes «media 3», «varianza 3», con unidades de recuento y recuento al cuadrado diferenciadas.

### poisson / aproximar-y-sumar

**Locución**

1. «Hola. Cien ensayos independientes tienen probabilidad una centésima de evento. Su recuento es binomial, pero podemos explorar una aproximación Poisson de media uno.»
2. «La probabilidad exacta de cero es noventa y nueve centésimas elevado a cien: aproximadamente treinta y seis coma seis por ciento. La aproximación usa exponencial de menos uno: aproximadamente treinta y seis coma ocho por ciento.»
3. «Son cercanas, no iguales. La aproximación se apoya en muchos ensayos de probabilidad pequeña, conservando su producto. Debemos mirar el error de la pregunta concreta; una buena coincidencia en cero no garantiza todas las colas.»
4. «Hay otra propiedad, esta vez exacta: sumar dos Poisson independientes da una Poisson con las medias sumadas. Aquí la palabra independiente autoriza la regla. Distinguir propiedad exacta y aproximación evita atribuir a un modelo lo que pertenece a otro.»

**Realización**

1. Binomial $n=100,p=0{,}01$ y Poisson $\lambda=np=1$.
2. Cuentas en columnas: $0{,}99^{100}\approx0{,}36603$ y $e^{-1}\approx0{,}36788$.
3. Comparación con signo aproximado, no igualdad entre modelos; marcar error absoluto en cero.
4. Dos ventanas independientes y $\lambda_{X+Y}=\lambda_X+\lambda_Y$.

### hipergeometrica / sin-reemplazo

**Locución**

1. «Hola. Un lote tiene doce semillas, cuatro de una variedad y ocho restantes. Elegimos tres sin devolverlas. Vamos a contar muestras, porque después de cada extracción cambia lo disponible.»
2. «La hipergeométrica supone que todos los grupos de tres son equiprobables. Para obtener exactamente una de la variedad, elegimos una entre las cuatro: hay cuatro opciones.»
3. «Necesitamos completar las otras dos plazas con semillas de las ocho restantes. Hay veintiocho parejas posibles. Cada elección del primer grupo puede acompañarse de cualquiera de esas parejas: multiplicamos y obtenemos ciento doce muestras favorables.»
4. «Mezclar bien el lote puede justificar una selección uniforme, pero no independencia entre extracciones. Retirar una semilla cambia la composición. Las letras de la fórmula solo resumirán población total, existencias de la categoría y tamaño de muestra.»

**Realización**

1. Doce semillas, cuatro marcadas; extracción sin devolución.
2. Etiquetas $N=12,K=4,n=3$; $\binom41=4$.
3. Elegir dos de ocho: $\binom82=28$; después $4\times28=112$.
4. Actualizar existencias tras una extracción y mantener «muestras equiprobables» separado de «extracciones independientes».

### hipergeometrica / masa-finita

**Locución**

1. «Hola. Ya contamos ciento doce muestras con exactamente una semilla de la variedad. Ahora necesitamos el total con el que compararlas: todos los grupos de tres entre doce.»
2. «La combinación da doscientas veinte muestras posibles. Como el diseño les asigna el mismo peso, dividimos ciento doce entre doscientas veinte. La probabilidad es aproximadamente cincuenta coma nueve por ciento.»
3. «La fórmula general conserva tres pasos: elegir las semillas de interés, completar con las restantes y dividir por todas las muestras. No crea posibilidades donde faltan existencias.»
4. «Antes de calcular comprueba el soporte: no podemos seleccionar más semillas de interés de las que tiene el lote ni más de las plazas de la muestra. Al menos ka incluye ka; si usamos el complemento de una acumulada, este termina en ka menos uno. También aquí los extremos importan.»

**Realización**

1. $\binom{12}3=220$ como total, no como nuevas favorables.
2. $p_X(1)=112/220\approx0{,}5091$.
3. $p_X(k)=\binom Kk\binom{N-K}{n-k}/\binom Nn$, revelando numerador y denominador por separado.
4. Barras únicamente en valores posibles; selección de cola con extremo k incluido.

### hipergeometrica / soporte-y-correccion

**Locución**

1. «Hola. Un lote contiene siete elementos de interés y solo dos restantes. Si elegimos cinco, ¿podemos evitar todos los de interés? No: los dos restantes solo llenan dos plazas.»
2. «Estamos obligados a incluir al menos tres de interés. El mínimo se obtiene por lo que falta para completar la muestra; el máximo, por las plazas y las existencias. El soporte contiene información del diseño.»
3. «La media es tamaño de muestra por proporción de interés. La varianza añade al factor binomial una corrección por población finita. Retirar elementos reduce la variación del total frente a ensayos independientes con la misma proporción.»
4. «Si la muestra es una fracción muy pequeña del lote, podemos valorar una aproximación binomial, declarándola. La fórmula de corrección requiere población mayor que uno. Con una población de un elemento tratamos el caso determinista directamente, no una división indeterminada.»

**Realización**

1. Nueve elementos, siete de interés; cinco plazas y dos restantes.
2. $5-2=3$; después $\max(0,n-N+K)\leq k\leq\min(n,K)$.
3. $E[X]=nK/N$; construir $\operatorname{Var}(X)=n(K/N)(1-K/N)(N-n)/(N-1)$, destacando la corrección.
4. Mostrar que el factor se acerca a 1 con fracción de muestreo pequeña; excluir N=1 de esa fórmula.

### geometrica-negativa / primera-deteccion

**Locución**

1. «Hola. Probamos colonias hasta detectar una señal. Aquí no fijamos el número de ensayos: paramos en el primer éxito. Antes de contar, decidamos si queremos fallos previos o ensayos totales.»
2. «Si detectamos a la primera, hay cero fallos y un ensayo. Las dos convenciones difieren en uno. Suponemos intentos independientes y probabilidad de éxito cuatro décimas, constante.»
3. «Dos fallos antes de detectar requieren fallo, fallo y éxito, exactamente en ese orden. Multiplicar seis décimas, seis décimas y cuatro décimas da ciento cuarenta y cuatro milésimas. El éxito no se coloca libremente: termina la observación.»
4. «La geométrica generaliza esta cuenta. La media de fallos es uno menos pe dividido entre pe: una coma cinco en este ejemplo. Para la media de ensayos añadimos uno. Un soporte que empieza en cero o en uno puede indicar una convención distinta, no un error.»

**Realización**

1. Intentos que se detienen al primer éxito.
2. Contadores X de fallos y T de ensayos; $T=X+1$.
3. Secuencia FFE y $p_X(2)=0{,}6^2\times0{,}4=0{,}144$.
4. $p_X(k)=(1-p)^kp$, $k\geq0$; $E[X]=(1-p)/p=1{,}5$ y $E[T]=2{,}5$.

### geometrica-negativa / varios-exitos

**Locución**

1. «Hola. Ahora seguimos hasta el segundo éxito, con probabilidad una mitad por intento. Queremos exactamente un fallo antes de completar la meta. El último ensayo debe ser éxito.»
2. «Los patrones posibles son fallo, éxito, éxito y éxito, fallo, éxito. Cada uno pesa un octavo. Como son dos, la probabilidad total es un cuarto.»
3. «En general, fijamos el éxito final y contamos cómo se colocan los fallos y los éxitos anteriores. Esa combinación, multiplicada por las potencias de éxito y fracaso, produce la masa binomial negativa.»
4. «Erre es la meta de éxitos; ka, los fallos antes de alcanzarla. Para una acumulada de fallos empezamos en cero y sumamos hasta el límite incluido. No cambiamos el soporte por confundir esta variable con el número total de ensayos.»

**Realización**

1. Meta r=2 y último éxito fijo.
2. FEE y EFE con 1/8 cada una; $2\times1/8=1/4$.
3. $\binom{k+r-1}{k}$ sobre las posiciones libres; luego $p_F(k)=\binom{k+r-1}{k}p^r(1-p)^k$.
4. Eje de fallos desde 0 y eje de ensayos desplazado r; no superponerlos sin etiquetas.

### geometrica-negativa / memoria-y-momentos

**Locución**

1. «Hola. ¿Varios fallos hacen más probable acertar a continuación? No si los intentos son independientes y la probabilidad se mantiene. La geométrica no guarda memoria de los fallos anteriores.»
2. «Eso es un supuesto del mecanismo. Si los intentos alteran la colonia, o hay aprendizaje o deterioro, no podemos aplicarlo por costumbre.»
3. «Para esperar hasta erre éxitos podemos sumar erre esperas geométricas. Con dos éxitos y probabilidad una mitad, la media es dos fallos. Los ensayos totales añaden los dos éxitos y tienen media cuatro.»
4. «La varianza de fallos divide por pe al cuadrado y aquí vale cuatro. Añadir los éxitos fijados no cambia la varianza. Guarda juntas la definición de la variable y la fórmula: así sabrás si un resultado habla de fallos o de ensayos.»

**Realización**

1. Secuencia de fallos y siguiente intento con p sin cambiar.
2. Contraste con un mecanismo que sí cambia tras intentar.
3. $E[F]=r(1-p)/p=2$; $E[T]=E[F]+r=4$.
4. $\operatorname{Var}(F)=r(1-p)/p^2=4$; unidades de fallos al cuadrado, no probabilidades.

### geometrica-negativa / forma-real

**Locución**

1. «Hola. La binomial negativa también admite una forma real positiva, como dos coma cinco. En ese caso ya no significa esperar literalmente dos coma cinco éxitos; es una extensión matemática del modelo de recuentos.»
2. «La función gamma extiende el coeficiente que antes escribíamos con factoriales. El recuento sigue siendo entero no negativo y la probabilidad de éxito debe permitir alcanzar un éxito.»
3. «Con forma dos coma cinco y probabilidad una mitad, la media de fallos es dos coma cinco. La varianza vale cinco, mayor que la media. A esa mayor variación la llamamos sobredispersión frente a Poisson.»
4. «La extensión resulta útil para describir recuentos, pero no demuestra un mecanismo biológico concreto ni una meta fraccionaria de éxitos. Separar la interpretación literal de la familia matemática evita inventar una historia a partir de un parámetro.»

**Realización**

1. Etiquetas «r real positivo» y «no es una meta literal».
2. Coeficiente $\Gamma(k+r)/[\Gamma(r)\Gamma(k+1)]$, con $k\geq0$, $0<p\leq1$.
3. Construir media $2{,}5(1-0{,}5)/0{,}5=2{,}5$ y varianza $2{,}5(1-0{,}5)/0{,}5^2=5$ en dos pasos.
4. Comparación «varianza 5 > media 2,5»; no dibujar una parada en medio éxito.

### uniforme-montecarlo / dos-uniformes

**Locución**

1. «Hola. Elegimos un instante entre dos y seis minutos sin preferencia por zonas. Para estar entre tres y cinco comparamos longitudes: dos minutos favorables dentro de cuatro posibles. La probabilidad es una mitad.»
2. «La densidad constante vale un cuarto por minuto. Cada punto aislado tiene probabilidad cero: uniforme significa misma altura y misma probabilidad para intervalos de igual longitud.»
3. «En una lista discreta de uno, dos, tres y cuatro, en cambio, cada valor tiene masa un cuarto. El promedio es dos coma cinco y la varianza uno coma veinticinco.»
4. «No mezcles esas dos formas de ser uniforme. La fórmula discreta habitual de varianza supone enteros consecutivos. Para una lista arbitraria con pesos iguales, promediamos sus valores reales y sus desviaciones cuadradas. Igual probabilidad no significa que las etiquetas estén igualmente espaciadas.»

**Realización**

1. Intervalo [2,6] y sombreado [3,5]; $2/4=1/2$.
2. Densidad 1/4 por minuto y punto sin área.
3. Cuatro barras en 1,2,3,4 con altura 1/4; centro 2,5.
4. $\operatorname{Var}(D)=[(b-a+1)^2-1]/12$ únicamente para enteros consecutivos a,…,b.

### uniforme-montecarlo / cuantiles

**Locución**

1. «Hola. ¿Qué tiempo deja el setenta y cinco por ciento de la uniforme de dos a seis por debajo? Vamos a recorrer tres cuartos del intervalo desde su comienzo.»
2. «La anchura es cuatro. Tres cuartos de cuatro son tres minutos. Sumarlos al comienzo, dos, da cinco. Ese es el cuantil, y su unidad sigue siendo minutos.»
3. «La media está en el punto medio, cuatro; la varianza continua es la anchura al cuadrado dividida entre doce. Son resúmenes distintos de la misma distribución.»
4. «Con una acumulada de escalones no siempre existe una inversa ordinaria. Buscamos el primer umbral donde se alcanza la proporción pedida. Puede superarla de golpe al incorporar una masa. No interpolamos resultados que la variable no puede tomar para forzar una igualdad.»

**Realización**

1. Barra [2,6] y nivel u=0,75.
2. $0{,}75\times4=3$; después $2+3=5$.
3. Centro 4 y $\operatorname{Var}(X)=(b-a)^2/12$.
4. CDF discreta y $Q(u)=\inf\{x:F(x)\geq u\}$, para $0<u<1$; marcar el primer alcance, no un punto interpolado.

### uniforme-montecarlo / inversion-y-montecarlo

**Locución**

1. «Hola. Queremos simular cero, uno y dos con probabilidades dos décimas, cinco décimas y tres décimas. Vamos a repartir un intervalo uniforme según esos pesos.»
2. «Hasta dos décimas asignamos cero; desde ahí hasta siete décimas, uno; el resto, dos. Un valor uniforme de una décima produce cero, de cincuenta y cinco centésimas produce uno y de noventa y una centésimas produce dos.»
3. «Las longitudes de los tramos coinciden con las masas. Aplicar el cuantil a una uniforme reproduce esa distribución. Montecarlo repite esta generación para aproximar probabilidades o promedios.»
4. «La frecuencia de doses fluctuará alrededor de tres décimas; no tiene que igualarla en cada lote. Más simulaciones reducen fluctuación bajo el modelo, no corrigen un modelo falso. Guardar una semilla permite reproducir el cálculo, no valida el mecanismo ni convierte la variable individual en normal.»

**Realización**

1. Intervalo [0,1] dividido en tramos de longitudes 0,2;0,5;0,3.
2. Marcadores 0,10→0, 0,55→1, 0,91→2.
3. $X=Q(U)$ y sucesivas realizaciones; histograma de frecuencias con escala correcta.
4. Línea de referencia 0,3 y varias tandas fluctuantes; etiqueta «simulación», semilla visible en la documentación técnica, no como garantía de validez.

### exponencial / escala-y-supervivencia

**Locución**

1. «Hola. Un mecanismo tiene espera media de cinco minutos. Queremos saber la probabilidad de seguir esperando después de diez. Una media de cinco no significa que el evento llegue exactamente a los cinco.»
2. «Usamos escala cinco minutos; la tasa correspondiente es su inversa, dos décimas por minuto. Para la supervivencia comparamos tiempo con escala: diez entre cinco da dos.»
3. «La exponencial de menos dos da aproximadamente trece coma cinco por ciento. Esa es la probabilidad de que todavía no haya ocurrido el evento a los diez minutos. La supervivencia disminuye al avanzar el tiempo.»
4. «En un proceso Poisson homogéneo, el tiempo hasta el siguiente evento tiene esta distribución con la tasa del proceso. La relación necesita tasa estable e incrementos independientes. No cualquier tiempo positivo es exponencial.»

**Realización**

1. Línea de espera y pregunta $P(T>10)$.
2. Escala $\alpha=5$ min; tasa $r=1/5$ por minuto; $10/5=2$.
3. $S(10)=e^{-2}\approx0{,}1353$ y curva de supervivencia con marcador en 10.
4. Eventos de un proceso homogéneo y tiempo al siguiente; identificar las condiciones.

### exponencial / densidad-y-acumulada

**Locución**

1. «Hola. Vamos a distinguir tres curvas de una espera exponencial: densidad, acumulada y supervivencia. No responden a la misma pregunta.»
2. «La densidad describe alturas y lleva el factor inverso de la escala. Sus unidades son por minuto. Para una probabilidad debemos integrar una franja bajo ella.»
3. «La supervivencia dice que seguimos esperando; la acumulada, que el evento ya ocurrió. Por eso suman uno. La media es la escala y la varianza su cuadrado: aquí cinco minutos y veinticinco minutos cuadrados.»
4. «Al usar una biblioteca, mira si pide escala o tasa. Cinco minutos de escala corresponde a una tasa de una quinta parte por minuto, no a una tasa cinco. Los tiempos negativos están fuera del soporte; allí la densidad y la acumulada valen cero.»

**Realización**

1. Tres gráficos separados con preguntas y ejes correctos.
2. $f(t)=\alpha^{-1}e^{-t/\alpha}$ para $t\geq0$, cero fuera; sombreado de un intervalo.
3. $F(t)=1-S(t)$, $E[T]=\alpha$, $\operatorname{Var}(T)=\alpha^2$.
4. Ficha «escala 5 min / tasa 0,2 por min»; no reutilizar una curva de supervivencia con eje «densidad».

### exponencial / espera-adicional

**Locución**

1. «Hola. Ya llevamos diez minutos esperando sin señal. ¿La espera pendiente es más corta por haber esperado tanto? Bajo el modelo exponencial, no: el riesgo se mantiene constante.»
2. «La probabilidad de esperar otros cinco se obtiene comparando supervivencia hasta quince con supervivencia hasta diez. La parte ya transcurrida se cancela en el cociente.»
3. «Queda exponencial de menos uno: aproximadamente treinta y seis coma ocho por ciento. Es la misma probabilidad de superar cinco minutos al iniciar una espera nueva. Esto es carencia de memoria, no un plazo individual fijo.»
4. «Envejecimiento, adaptación o fases pueden romper esa hipótesis. Y si acaba la observación sin ver el evento, sabemos que la espera supera lo observado; no que terminó justo ahí. Ese dato está censurado. Aquí señalamos la diferencia sin desarrollar técnicas de supervivencia.»

**Realización**

1. Línea de tiempo con 10 minutos transcurridos y tramo adicional de 5.
2. $P(T>15\mid T>10)=S(15)/S(10)$.
3. Cancelar factores y revelar $e^{-1}\approx0{,}3679$; comparar con $S(5)$.
4. Marca de fin de observación con flecha «evento aún no observado»; no dibujar un evento ficticio al censurar.

### normal / centro-y-escala

**Locución**

1. «Hola. Una longitud se modela con media cuarenta milímetros y desviación cuatro. Vamos a interpretar cuarenta y ocho comparándolo con el centro y con la escala de variación.»
2. «La distancia al centro es ocho milímetros. Dividirla entre la desviación, cuatro, da dos. El valor está dos desviaciones por encima de la media. Tipificar hace esa comparación y elimina las unidades.»
3. «En la notación de este curso, el segundo parámetro de la normal es la varianza: dieciséis, no la desviación cuatro. La curva es simétrica y su media, mediana y moda coinciden.»
4. «La normal se extiende por toda la recta. Para una medida necesariamente positiva debemos comprobar que la probabilidad de valores negativos sea despreciable. Una campana bonita no basta para justificar el modelo: primero declaramos el supuesto y luego interpretamos sus consecuencias.»

**Realización**

1. Campana con centro 40 mm y marcas separadas 4 mm.
2. $48-40=8$ y $8/4=2$; cambiar eje a $Z=(X-\mu)/\sigma$ conservando las áreas.
3. $X\sim N(40,16)$ con «media / varianza»; no enviar 16 a una biblioteca que pide desviación.
4. Flechas en ambas colas y advertencia de soporte real, aunque el marco visible sea finito.

### normal / densidad-normal

**Locución**

1. «Hola. Vamos a entender cómo se construye la campana estándar. Su altura es densidad; para una probabilidad seguiremos necesitando un área.»
2. «El cuadrado de la distancia al centro hace que izquierda y derecha se traten igual. La exponencial de menos ese cuadrado entre dos da la forma de la campana.»
3. «Dividir por la raíz de dos pi ajusta el área completa a uno. Pi aquí es la constante circular. Para otra desviación, el factor inverso de sigma compensa el cambio de anchura: una campana más ancha tiene menos altura.»
4. «El dibujo puede mostrar solo cuatro desviaciones a cada lado, pero las colas continúan. La altura en un valor no responde a la probabilidad de superarlo. La densidad y la acumulada tienen nombres parecidos; distinguir su pregunta evita usar la curva equivocada.»

**Realización**

1. Campana estándar con ejes z y densidad.
2. Revelar $e^{-z^2/2}$ y señalar su simetría.
3. $\phi(z)=e^{-z^2/2}/\sqrt{2\pi}$; después $f_X(x)=\phi((x-\mu)/\sigma)/\sigma$, con áreas iguales al cambiar anchura.
4. Marco [-4,4] con colas indicadas; altura puntual frente a área de cola, sin superponer sus etiquetas.

### normal / colas-e-intervalos

**Locución**

1. «Hola. Queremos la probabilidad entre treinta y seis y cuarenta y ocho milímetros para una normal de media cuarenta y desviación cuatro. Primero llevamos ambos extremos a la escala estándar.»
2. «El inferior está una desviación por debajo; el superior, dos por encima. La acumulada estándar da todo lo que hay a la izquierda de cada límite.»
3. «Hasta dos llevamos aproximadamente noventa y siete coma siete por ciento. Quitamos lo acumulado hasta menos uno, aproximadamente quince coma nueve por ciento. Queda alrededor de ochenta y uno coma nueve por ciento entre ambos.»
4. «Para la cola derecha de dos tomamos lo que falta hasta uno: cerca de dos coma veintiocho por ciento. Estos valores se consultan en tablas o una biblioteca: la acumulada no tiene una primitiva elemental sencilla. La cuenta debe corresponder al área que hemos seleccionado, no a su altura.»

**Realización**

1. Límites originales 36 y 48 con media 40 y desviación 4.
2. Transformar extremos a -1 y 2.
3. Sombreado entre ambos; $P(-1<Z<2)=\Phi(2)-\Phi(-1)\approx0{,}8186$.
4. Cambiar a cola derecha: $P(Z>2)=1-\Phi(2)\approx0{,}02275$. Indicar colas fuera del marco.

### normal / cuantiles-y-combinaciones

**Locución**

1. «Hola. Ahora conocemos una proporción y queremos una longitud: la que deja el noventa por ciento por debajo. Es la pregunta inversa de calcular una probabilidad.»
2. «Buscamos el umbral estándar: aproximadamente uno coma veintiocho desviaciones por encima del centro. Multiplicamos por cuatro milímetros y obtenemos un desplazamiento de unos cinco coma trece.»
3. «Añadimos la media cuarenta. El percentil es aproximadamente cuarenta y cinco coma trece milímetros. Si pidieran cinco por ciento por encima, buscaríamos noventa y cinco por debajo; no cinco.»
4. «Una transformación lineal de una normal sigue siendo normal, salvo el caso constante. También una combinación de normales independientes, usando medias y varianzas apropiadas. Pero observar muchos datos no vuelve normal a cualquier variable individual. Aquí estamos trabajando con un modelo normal supuesto, no justificándolo por el tamaño de la muestra.»

**Realización**

1. Área objetivo 0,90 con umbral aún desconocido.
2. $\Phi^{-1}(0{,}90)\approx1{,}28155$; $4\times1{,}28155\approx5{,}1262$.
3. $40+5{,}1262=45{,}1262$; después $q_u=\mu+\sigma\Phi^{-1}(u)$.
4. Para suma independiente, medias sumadas y varianzas sumadas, no desviaciones; mantener explícitos los supuestos.

### gamma / etapas-y-parametros

**Locución**

1. «Hola. Una reacción necesita completar tres etapas. Supongamos que cada espera es exponencial, independiente, con escala de dos minutos. Queremos describir el tiempo total.»
2. «La suma sigue una gamma de forma tres y escala dos. En esta interpretación, la forma cuenta etapas. La escala expresa tiempo; no es una probabilidad ni debe sumarse como si fuera otra etapa.»
3. «La media suma tres esperas de dos minutos: seis. Cada espera tiene varianza cuatro; la independencia permite sumarlas y obtenemos doce minutos cuadrados. Media y varianza no usan las mismas unidades.»
4. «Comprueba la convención del programa: escala dos minutos corresponde a tasa una mitad por minuto. La historia de etapas necesita independencia y escala común. Una gamma también puede servir como modelo flexible, pero no demuestra por sí sola que la reacción siga estas tres fases.»

**Realización**

1. Tres etapas consecutivas con esperas independientes y escala común.
2. $T\sim\operatorname{Gamma}(3,2)$ con parámetros etiquetados.
3. $E[T]=3\times2=6$ min; $\operatorname{Var}(T)=3\times4=12$ min².
4. Ficha «forma 3 / escala 2 / tasa 0,5» sin intercambiar argumentos.

### gamma / funcion-gamma

**Locución**

1. «Hola. La forma de una distribución gamma también puede ser un número real positivo. ¿Qué hacemos con un factorial cuando no hay un entero? Necesitamos una función que lo extienda.»
2. «La función gamma, con letra mayúscula, se define mediante una integral. Es distinta de la distribución gamma: aquí nos da una constante para normalizar su densidad.»
3. «Para un entero positivo, gamma de ese entero devuelve el factorial del entero anterior. Gamma de tres vale dos factorial: dos. No está contando una etapa nueva; está ajustando el total de probabilidad.»
4. «La variable dentro de la integral solo sirve para recorrer el cálculo. Si la forma es real, la función sigue estando definida, pero ya no interpretamos literalmente el parámetro como un número fraccionario de etapas observadas. Una extensión matemática no obliga a extender la historia biológica de la misma manera.»

**Realización**

1. Contrastar forma entera 3 y forma real positiva.
2. $\Gamma(k)=\int_0^\infty u^{k-1}e^{-u}\,du$, identificando u como variable auxiliar.
3. $\Gamma(m)=(m-1)!$; caso $\Gamma(3)=2$.
4. Conectar Γ con el denominador normalizador de la densidad, sin dibujar fracciones de etapa.

### gamma / densidad-y-area

**Locución**

1. «Hola. Para las tres etapas de escala dos, queremos acabar antes de cuatro minutos. Primero debemos elegir el área bajo la densidad, no la altura en cuatro.»
2. «La densidad combina una potencia del tiempo y una exponencial decreciente. La forma controla la potencia; la escala, la velocidad de decaimiento. El denominador, con la función gamma y la escala elevada a la forma, normaliza el total.»
3. «En nuestro ejemplo el denominador vale dieciséis. El área desde cero hasta cuatro da aproximadamente treinta y dos coma tres por ciento. Podemos evaluarla con la acumulada gamma de una biblioteca.»
4. «Enviamos forma tres y escala dos, o tasa una mitad si utiliza esa convención. Los parámetros son positivos y fuera de tiempos positivos la densidad es cero. La cola continúa más allá del marco del dibujo: el borde de la pantalla no es un máximo de duración.»

**Realización**

1. Curva gamma k=3, α=2; marcar 4 sin responder aún.
2. Revelar $t^{k-1}e^{-t/\alpha}$ y después $f(t)=t^{k-1}e^{-t/\alpha}/[\Gamma(k)\alpha^k]$.
3. $f(t)=t^2e^{-t/2}/16$; sombrear [0,4] y mostrar $F(4)\approx0{,}3233$.
4. Ejes min y 1/min, parámetros de consulta y cola no dibujada indicada.

### gamma / sumas-y-variacion

**Locución**

1. «Hola. Sumamos dos tiempos gamma independientes, de formas dos y tres y escala común dos. ¿Qué parámetro se suma? Las formas. La escala se conserva.»
2. «El tiempo total tiene forma cinco y escala dos. Con escalas distintas, esta regla simple no vale en general. Las condiciones forman parte del resultado.»
3. «La media general es forma por escala; la varianza, forma por escala al cuadrado. Al aumentar etapas independientes, la variación absoluta crece, pero la desviación comparada con la media disminuye como uno entre la raíz de la forma.»
4. «Forma uno recupera la exponencial. Con formas reales tenemos una familia flexible de cantidades positivas. No confundas ajustar una gamma con demostrar una cadena literal de etapas. Primero declaramos el mecanismo supuesto y después comprobamos si sus consecuencias son compatibles con los datos.»

**Realización**

1. Dos grupos de etapas independientes y α=2 compartida.
2. $2+3=5$; salida Gamma(5,2), no Gamma(5,4).
3. $E[T]=k\alpha$, $\operatorname{Var}(T)=k\alpha^2$ y $\sigma_T/E[T]=1/\sqrt k$.
4. Curvas de distintas formas etiquetadas; mantener separados «interpretación de etapas» y «modelo flexible».

### cauchy-weibull / centro-sin-media

**Locución**

1. «Hola. Una curva es simétrica alrededor de cero. ¿Su esperanza tiene que ser cero? La distribución Cauchy nos muestra por qué no podemos afirmarlo.»
2. «Su densidad estándar tiene una campana central y colas muy persistentes. El dibujo de la zona central puede parecer familiar, pero fuera de él queda una parte importante de la historia.»
3. «La mediana y la moda son cero. Sin embargo, las aportaciones positiva y negativa al promedio divergen. No podemos cancelarlas para fabricar una esperanza: la media no existe y la varianza no está definida.»
4. «Una muestra finita sí tiene promedio numérico. Eso no crea una esperanza poblacional. Integrar simétricamente y obtener un valor principal es otra operación. Los cocientes con denominadores cerca de cero pueden motivar cautela sobre colas, pero no demuestran automáticamente que el modelo correcto sea Cauchy.»

**Realización**

1. Curva simétrica con centro 0, sin etiqueta «media».
2. $f_C(x)=1/[\pi(1+x^2)]$ y ampliación de colas al ensanchar el marco.
3. Separar aportaciones de ambos lados; etiquetas «mediana 0», «esperanza no existe», «varianza no definida».
4. Promedios de muestras finitas frente al resumen poblacional; no mostrar cancelación de infinitos como una esperanza.

### cauchy-weibull / intervalos-cauchy

**Locución**

1. «Hola. Aunque Cauchy no tenga esperanza, podemos calcular probabilidades de intervalos. La acumulada sigue siendo una función perfectamente definida.»
2. «Utiliza arco tangente, la inversa de la tangente en su tramo principal. La localización indica el centro y gamma minúscula una escala positiva. No es la función gamma mayúscula que extiende factoriales.»
3. «En la Cauchy estándar, la acumulada en uno vale tres cuartos y en menos uno, un cuarto. Restarlas da una mitad de probabilidad entre menos uno y uno.»
4. «La mediana es la localización porque allí la acumulada alcanza una mitad. Esa escala no es una desviación típica: no podemos tipificar usando una desviación inexistente. La falta de un resumen no impide usar otros que sí están definidos.»

**Realización**

1. Curva Cauchy y límites -1,1.
2. $F(x)=1/2+\arctan((x-x_0)/\gamma)/\pi$, con $\gamma>0$.
3. $F(1)=3/4$, $F(-1)=1/4$ y $3/4-1/4=1/2$ sobre el sombreado.
4. $F(x_0)=1/2$; etiquetar localización y escala, nunca media y desviación típica.

### cauchy-weibull / weibull-supervivencia

**Locución**

1. «Hola. Si un sensor cambia con el tiempo, una espera de riesgo constante puede no servir. Weibull permite variar ese comportamiento mediante una forma y una escala positivas.»
2. «Con escala diez horas y forma dos, preguntamos por superar diez horas. Primero dividimos tiempo por escala: da uno. Después elevamos a la forma dos; sigue siendo uno.»
3. «La exponencial de menos uno da aproximadamente treinta y seis coma ocho por ciento. Esa es la supervivencia. La densidad es otra curva: multiplica la supervivencia por un factor que depende del tiempo y la forma.»
4. «No interpretes la escala como una media automática: en Weibull la media depende también de la forma. El modelo permite describir riesgos crecientes o decrecientes, pero la explicación física de ese patrón necesita evidencia adicional.»

**Realización**

1. Parámetros α=10 h, β=2 y eje temporal positivo.
2. $10/10=1$; elevar a 2 antes de aplicar la exponencial.
3. $S(t)=e^{-(t/\alpha)^\beta}$ y $S(10)=e^{-1}$; después $f(t)=(\beta/\alpha)(t/\alpha)^{\beta-1}S(t)$.
4. Curvas de supervivencia etiquetadas; no marcar α como media sin calcularla.

### cauchy-weibull / riesgo-y-momentos

**Locución**

1. «Hola. Vamos a interpretar la forma de Weibull a través del riesgo instantáneo. Este se obtiene dividiendo densidad por supervivencia: habla de la intensidad del evento entre quienes siguen esperando.»
2. «Al dividir se cancela la exponencial. Si la forma vale uno, el riesgo es constante y recuperamos exponencial. Por debajo de uno disminuye; por encima aumenta.»
3. «Eso describe un patrón, no demuestra envejecimiento, selección ni otra causa. La media de Weibull utiliza la escala y la función gamma. El segundo momento tiene otra potencia de escala; al restar el cuadrado de la media obtenemos la varianza.»
4. «Estos momentos son finitos para los parámetros positivos de Weibull. Cauchy, aunque también tenga un centro y una escala, no comparte esa propiedad. Una familia no hereda los resúmenes de otra porque sus curvas se parezcan.»

**Realización**

1. $h(t)=f(t)/S(t)$ con unidades 1/tiempo, no etiqueta de probabilidad.
2. $h(t)=(\beta/\alpha)(t/\alpha)^{\beta-1}$; tres curvas β<1, β=1, β>1.
3. Revelar $E[W]=\alpha\Gamma(1+1/\beta)$, después $E[W^2]=\alpha^2\Gamma(1+2/\beta)$ y su resta centrada.
4. Tabla comparativa Weibull/Cauchy de existencia de momentos; no atribuir causa biológica al parámetro β.

### calculo-modelos / operacion-correcta

**Locución**

1. «Hola. Una calculadora responde a la operación que le pedimos, no a la que teníamos en mente. Vamos a elegir bien antes de introducir números.»
2. «Masa o densidad evalúan un punto. La acumulada reúne hasta un umbral. El cuantil busca un umbral a partir de una proporción. Generar produce realizaciones. Son cuatro preguntas diferentes.»
3. «En R suelen identificarse con las letras de, pe, cu y erre. En Python se distinguen masa o densidad, acumulada, inversa y generación. Las unidades nos ayudan: un cuantil devuelve unidades de la variable; una probabilidad no tiene unidades; una densidad usa unidades inversas.»
4. «También revisa parámetros. La notación de la normal puede mostrar varianza y la función pedir desviación. Una espera puede parametrizarse con escala o tasa. Que el programa acepte un argumento no demuestra que hayamos planteado la pregunta correctamente.»

**Realización**

1. Pregunta de cola «superar 26» frente a un marcador de altura puntual.
2. Cuatro esquemas separados: punto, área acumulada, umbral inverso, muestra.
3. Tabla R d/p/q/r y Python pmf/pdf, cdf, ppf, rvs, con unidades de salida.
4. Ficha normal media20/desviación3/varianza9 y ficha escala/tasa; no anticipar llamadas incompatibles.

### calculo-modelos / consulta-con-unidades

**Locución**

1. «Hola. Queremos superar veintiséis en una normal de media veinte y desviación tres. Primero dejamos clara la pregunta: una cola derecha, no una altura.»
2. «Restar la media da seis; dividir por la desviación da dos. Consultamos la probabilidad estándar a la derecha de dos: aproximadamente dos coma veintiocho por ciento.»
3. «Una función de supervivencia o una acumulada con cola superior responde directamente a esa pregunta. Si en cambio pedimos el percentil noventa, la salida es aproximadamente veintitrés coma ochenta y cuatro, en unidades de la medida.»
4. «Guarda pregunta, parámetros, unidades y operación para reproducir la consulta. En recuentos, al menos ka complementa hasta ka menos uno. En continuo un punto no añade masa, pero en discreto puede hacerlo: la misma desigualdad no autoriza siempre la misma llamada.»

**Realización**

1. Campana N(20,9), umbral26 y cola derecha.
2. $26-20=6$, $6/3=2$ y $1-\Phi(2)\approx0{,}02275$.
3. Mostrar `pnorm(26, mean=20, sd=3, lower.tail=FALSE)` y `norm.sf(26, loc=20, scale=3)`; después, en otro plano, `qnorm(0.9, mean=20, sd=3)` y `norm.ppf(0.9, loc=20, scale=3)`.
4. Anotar resultado y unidades; para discreta marcar el desplazamiento del límite del complemento.

### calculo-modelos / elegir-mecanismo

**Locución**

1. «Hola. Vamos a elegir una distribución empezando por el experimento. ¿Qué contamos? ¿Cómo se obtiene? ¿Qué valores son posibles? Esas preguntas van antes que la fórmula.»
2. «Un ensayo binario lleva a Bernoulli. Un número fijo de ensayos independientes con probabilidad común, a binomial. Una extracción finita sin reemplazo, a hipergeométrica.»
3. «Parar en el primer éxito lleva a geométrica; en una meta de éxitos, a binomial negativa. Recuentos por exposición estable pueden llevar a Poisson. Las duraciones necesitan soporte positivo y un patrón de riesgo coherente.»
4. «Después comprobamos independencia, homogeneidad, resolución y parámetros, y contrastamos resúmenes y colas con lo observado. Una muestra pequeña puede fluctuar; tampoco cualquier coincidencia valida el modelo. Simular ayuda a detectar errores de implementación y una semilla permite reproducirlos. Al terminar, vuelve a la pregunta biológica y a sus unidades.»

**Realización**

1. Itinerario «medida → soporte → diseño → modelo → comprobación».
2. Dibujos de los tres mecanismos discretos, con condiciones junto a cada nombre.
3. Parada, exposición y duración en recorridos separados; no mostrar una fórmula única para todos.
4. Contraste modelo/datos con resúmenes y colas, más un ejemplo de interpretación verbal del resultado.

## Familia exponencial y modelos lineales generalizados

### familia-exponencial / piezas-poisson

**Locución**

1. «Hola. Familia exponencial no significa que todos sus modelos sean tiempos de espera exponenciales. Es una manera de organizar masas y densidades separando datos y parámetros. Vamos a reconocerla en Poisson.»
2. «El dato es un recuento y lambda su media positiva. El factorial del dato no depende de lambda: lo dejamos en una pieza que llamamos hache. El recuento que se combina con el parámetro será nuestro estadístico te.»
3. «Reescribimos la potencia de lambda usando su logaritmo. Ese logaritmo es el parámetro natural, eta; no tiene por qué ser una probabilidad. La pieza que normaliza el total se llama a de eta y, aquí, es la exponencial de eta.»
4. «Ahora reunimos las cuatro piezas en una sola expresión. No hemos cambiado Poisson: hemos reordenado su fórmula para ver qué depende del dato y qué del parámetro. El soporte y el dominio siguen siendo parte del modelo; esta forma compartida no hace iguales todas las distribuciones.»

**Realización**

1. Masa Poisson original y etiqueta «misma distribución, otra organización».
2. Extraer $h(x)=1/x!$ y $T(x)=x$ en posiciones separadas.
3. Revelar $\eta=\log\lambda$ y $A(\eta)=e^\eta$, con $\lambda>0$ y $\eta\in\mathbb R$.
4. Construir $f(x;\eta)=h(x)\exp\{\eta T(x)-A(\eta)\}$, señalando cada pieza al incorporarla. Mantener $x\in\{0,1,\ldots\}$.

### familia-exponencial / binomial-natural

**Locución**

1. «Hola. Vamos a reconocer la misma estructura en una binomial con tamaño fijado. La probabilidad de éxito debe estar estrictamente entre cero y uno para usar un parámetro natural finito.»
2. «La combinación depende del dato y del tamaño fijo: será hache. El estadístico te vuelve a ser el recuento. Para el parámetro usamos las odds: probabilidad de éxito dividida entre la de fracaso.»
3. «Tomar el logaritmo de esas odds da el logit, eta. Si la probabilidad es tres cuartos, las odds son tres y eta es logaritmo de tres. Eta no es una probabilidad: puede ser negativo o superar uno.»
4. «El normalizador completa la expresión con tamaño por logaritmo de uno más exponencial de eta. Probabilidades cero o uno producen casos degenerados como límites; no un logit finito. Antes de reorganizar una fórmula, dejamos claros qué parámetros varían y qué soporte estamos manteniendo.»

**Realización**

1. Binomial con n fijo, soporte 0,…,n y $0<p<1$.
2. $h(x)=\binom nx$, $T(x)=x$; odds $p/(1-p)$.
3. $\eta=\log[p/(1-p)]$; ejemplo p=3/4→odds3→η=log3.
4. $A(\eta)=n\log(1+e^\eta)$ y composición final; extremos p=0,1 como límites, no valores de logit finito.

### familia-exponencial / normales-uniparametricas

**Locución**

1. «Hola. Una normal también puede escribirse como familia exponencial, pero primero decidamos qué dejamos variar. Fijar la varianza y variar la media no es lo mismo que fijar la media y variar la varianza.»
2. «Con varianza conocida ve, el estadístico es el valor observado. El parámetro natural es la media dividida entre ve. Al expandir el cuadrado de la densidad, la parte restante que depende del parámetro forma el normalizador.»
3. «Con media conocida y varianza variable, el estadístico cambia: ahora es la distancia cuadrada a esa media. El parámetro natural es negativo, menos uno entre dos varianzas. Su dominio garantiza que la varianza sea positiva.»
4. «Las dos representaciones describen familias distintas porque fijan cosas distintas. Si queremos variar media y varianza simultáneamente, necesitamos más de un parámetro natural. No intercambiamos los estadísticos de estos dos casos ni declaramos que la media era conocida después de estimarla.»

**Realización**

1. Dos paneles alternativos, con el parámetro fijo destacado en cada uno.
2. Caso v fija: $T(x)=x$, $\eta=\mu/v$, $A(\eta)=v\eta^2/2$; h es la densidad N(0,v).
3. Caso media $\mu_0$ fija: $T(x)=(x-\mu_0)^2$, $\eta=-1/(2\sigma^2)<0$, $A(\eta)=-\tfrac12\log(-2\eta)$ y $h(x)=1/\sqrt{2\pi}$.
4. Mostrar los dos recorridos completos por separado. No mezclar sus piezas en una única fórmula.

### familia-exponencial / datos-fijos-y-maximo

**Locución**

1. «Hola. Observamos cero, uno y dos eventos en tres ventanas independientes de igual exposición. Vamos a comparar medias Poisson candidatas. Durante esta comparación los datos no cambian: cambia lambda.»
2. «La independencia permite multiplicar las masas de los tres datos. La suma de recuentos es tres y los factoriales forman un factor fijo. El producto se llama verosimilitud: valora candidatos para estos datos, no es una posterior de lambda.»
3. «Tomar logaritmos convierte el producto en suma. Derivamos respecto al parámetro, igualamos a cero y obtenemos lambda uno, la media de los datos. La segunda derivada negativa confirma que es un máximo.»
4. «Con una muestra general y suma positiva, el estimador es suma entre número de ventanas. Si todos los datos son cero, el máximo está en el límite cero, no en el interior positivo. La factorización concentra la información sobre el parámetro, pero no demuestra que el proceso sea Poisson ni que las ventanas sean independientes.»

**Realización**

1. Fijar muestra 0,1,2 y deslizador de lambda; no mover los datos.
2. $T=0+1+2=3$; luego $L(\lambda)=e^{-3\lambda}\lambda^3/2$.
3. $\ell'(\lambda)=3/\lambda-3$; raíz λ=1 y $\ell''(\lambda)=-3/\lambda^2<0$.
4. Curva de verosimilitud con máximo 1; ejemplo de todos ceros con máximo de frontera. Etiquetar «comparación de parámetros», no «probabilidad de λ».

### familia-exponencial / log-verosimilitud

**Locución**

1. «Hola. Ya encontramos lambda uno para los datos cero, uno y dos. Vamos a calcular el valor de la log verosimilitud. Para evaluarla no debemos olvidar los términos constantes que antes no afectaban al máximo.»
2. «La suma de datos, tres, multiplica el logaritmo de uno, que vale cero. Después restamos tres ventanas por lambda uno: queda menos tres.»
3. «Todavía falta el factorial del dato dos. Restamos logaritmo de dos y obtenemos aproximadamente menos tres coma sesenta y nueve. Ese término no movía el máximo, pero sí cambia el valor que estamos informando.»
4. «Una log verosimilitud negativa no es una probabilidad negativa: es un logaritmo usado para comparar candidatos dentro del modelo. Maximizarla tampoco garantiza precisión, ausencia de sesgo ni adecuación biológica. Guarda el modelo, los datos y la expresión evaluada para que la cifra pueda interpretarse y reproducirse.»

**Realización**

1. Muestra fija y λ=1; recuperar la verosimilitud anterior.
2. Revelar $3\log1=0$ y después $0-3=-3$.
3. Añadir $-\log2$; $\ell(1)=-3-\log2\approx-3{,}6931$.
4. $\ell(\lambda)=T\log\lambda-n\lambda-\sum_i\log(x_i!)$; señalar términos constantes sin eliminarlos al informar el valor.

### familia-exponencial / enlaces-glm

**Locución**

1. «Hola. Queremos relacionar dosis con una media de recuentos, pero una recta sin restricciones podría producir medias negativas. Un modelo lineal generalizado separa la distribución de respuesta y el enlace de su media.»
2. «Con Poisson y enlace logarítmico, hacemos lineal el logaritmo de la media. Volver mediante la exponencial garantiza una media positiva. Un ejemplo de coeficientes produce medias dos, tres y cuatro coma cinco para dosis cero, uno y dos.»
3. «Para una respuesta binaria, el logit cumple otra función: al invertirlo obtenemos una probabilidad entre cero y uno. Eta cero da una mitad; eta logaritmo de tres da tres cuartos.»
4. «Los coeficientes del ejemplo son propuestos, no ajustados a las ventanas anteriores. Un enlace no demuestra causalidad ni sustituye revisar el modelo. Aquí presentamos la estructura de GLM; no estamos desarrollando un curso completo de ajuste, intervalos o contrastes.»

**Realización**

1. Esquema respuesta/distribución/enlace/predictores.
2. $g(\mu_i)=\boldsymbol x_i^{\mathsf T}\boldsymbol\beta$; caso $\log\mu=\log2+d\log1{,}5$ y puntos (dosis; media): (0; 2), (1; 3), (2; 4,5).
3. $p=e^\eta/(1+e^\eta)$; mostrar η=0→1/2 y η=log3→3/4.
4. Etiquetar «coeficientes ilustrativos, no ajustados». No dibujar una banda de confianza que no se ha estimado.

## Distribuciones multivariantes

### conjunta-discreta / parejas

**Locución**

1. «Hola. Medimos dos marcadores en cada célula. Si guardamos solo cuántas tienen cada uno, perdemos qué combinaciones aparecen juntas. Vamos a conservar esas parejas en una tabla.»
2. «Equis identifica filas; i griega, columnas. Las cuatro masas son treinta y cinco, quince, veinticinco y veinticinco centésimas. Cada celda habla de las dos medidas simultáneamente.»
3. «La celda equis uno, i griega cero tiene probabilidad un cuarto. No es una probabilidad dentro de la fila: está referida a toda la población del modelo. Las cuatro celdas, no cada fila, completan uno.»
4. «Un vector aleatorio reúne medidas del mismo resultado. Sus marginales describen cada componente, pero no reconstruyen cómo aparecen juntas. Si transponemos la tabla, debemos intercambiar también las etiquetas: cambiar la orientación no debe cambiar la pregunta sin avisar.»

**Realización**

1. Células con dos marcadores y paso a parejas (X,Y).
2. Tabla: X=0→0,35;0,15 y X=1→0,25;0,25, columnas Y=0,1.
3. Resaltar $p_{X,Y}(1,0)=0{,}25$ y total de las cuatro celdas 1.
4. Proyectar a marginales mostrando la información que se pierde; transponer solo si se cambian ambos ejes.

### conjunta-discreta / region-de-celdas

**Locución**

1. «Hola. Queremos que equis sea como máximo cero e i griega como máximo uno. Antes de sumar, seleccionemos las celdas que cumplen las dos condiciones.»
2. «En nuestra tabla entran las dos celdas de la primera fila. Treinta y cinco más quince centésimas da una mitad. La acumulada bivariante hace esta selección usando dos umbrales.»
3. «La región queda abajo y a la izquierda de ambos límites, incluidos. Para otro suceso revisamos sus desigualdades en cada pareja: y exige las dos; o puede reunir zonas que se solapan.»
4. «No toda tabla rectangular representa un soporte rectangular. Si dos recuentos comparten un total fijo, algunas combinaciones son imposibles. Que haya un hueco donde dibujar una celda no le asigna probabilidad. El soporte decide qué parejas podemos reunir.»

**Realización**

1. Recuperar la tabla anterior; marcadores de umbral en ambos ejes.
2. Seleccionar primera fila y $0{,}35+0{,}15=0{,}50$.
3. $F_{X,Y}(a,b)=P(X\leq a,Y\leq b)$ sobre una región inferior izquierda.
4. Ejemplo de recuentos con total fijo: celdas imposibles en blanco o con 0, nunca rellenadas por interpolación.

### conjunta-discreta / rectangulo-acumulado

**Locución**

1. «Hola. Vamos a aislar un rectángulo usando acumuladas. Empezamos con toda la región hasta sus dos límites superiores. Incluye más de lo que queremos.»
2. «Quitamos la franja que queda a la izquierda del límite inferior horizontal. Después quitamos la franja que queda por debajo del límite inferior vertical. Ahora la esquina común se ha quitado dos veces.»
3. «La devolvemos una vez. Así queda el rectángulo abierto en los límites inferiores y cerrado en los superiores. La fórmula registra esos cuatro movimientos, no un truco de signos.»
4. «En la tabla de indicadores, para quedarnos con ambos unos partimos de uno, restamos una mitad y seis décimas y añadimos treinta y cinco centésimas: queda un cuarto. Incluir los extremos inferiores sería otra pregunta si allí hay masa. Decide los límites antes de empezar.»

**Realización**

1. Región $F(b,d)$ con rectángulo objetivo marcado.
2. Restar $F(a,d)$ y $F(b,c)$, manteniendo un contador de copias en la esquina.
3. Añadir $F(a,c)$; revelar $P(a<X\leq b,c<Y\leq d)=F(b,d)-F(a,d)-F(b,c)+F(a,c)$ al final, no toda al inicio.
4. Aplicación $1-0{,}50-0{,}60+0{,}35=0{,}25$, resaltando la celda (1,1).

### multinomial / categorias-y-secuencias

**Locución**

1. «Hola. Clasificamos cuatro células en reposo, activadas o dañadas. Cada célula entra en una sola categoría, con probabilidades una mitad, tres décimas y dos décimas. Queremos dos, una y una.»
2. «Suponemos células independientes y las mismas probabilidades para todas. Un orden concreto tiene probabilidad una mitad al cuadrado por tres décimas por dos décimas: quince milésimas.»
3. «Pero no queremos un orden concreto. Hay doce maneras de colocar esas categorías. El coeficiente multinomial las cuenta, corrigiendo las dos células indistinguibles de reposo. Multiplicar doce por quince milésimas da dieciocho centésimas.»
4. «La fórmula general combina el número de secuencias con el peso de cada una. Los recuentos siempre suman cuatro; no podemos elegir cualquier terna. Las categorías deben ser excluyentes y cubrir todos los resultados de cada ensayo.»

**Realización**

1. Cuatro posiciones y categorías A/B/C con probabilidades 0,5/0,3/0,2.
2. Secuencia AABC y $0{,}5^2\times0{,}3\times0{,}2=0{,}015$.
3. Reordenaciones únicas; $4!/(2!1!1!)=12$ y $12\times0{,}015=0{,}18$.
4. $p_{\boldsymbol X}(\boldsymbol x)=n!\prod_i p_i^{x_i}/\prod_i x_i!$; condición $\sum_i x_i=n$.

### multinomial / marginales-y-total

**Locución**

1. «Hola. Las células se clasifican independientemente, pero ¿los recuentos de categorías también son independientes? No: compiten por las mismas cuatro plazas.»
2. «Si las cuatro están en reposo, no queda ninguna para las otras categorías. La suma de recuentos es fija. Conocer uno limita las posibilidades de los demás.»
3. «Si solo nos interesa reposo, reunimos activada y dañada como no reposo. Cada ensayo vuelve a tener dos resultados y el recuento marginal sigue una binomial. En una trinomial bastan dos coordenadas: la tercera se obtiene restándolas al total.»
4. «Guardar menos coordenadas no elimina la dependencia. Y que las frecuencias sumen uno no demuestra multinomial: necesitamos categorías excluyentes, probabilidades constantes e independencia entre ensayos. Clasificación incierta o dependencia entre células pueden invalidar el modelo.»

**Realización**

1. Cuatro plazas compartidas por tres categorías.
2. $X_A+X_B+X_C=4$; ocupar plazas y reducir las restantes.
3. Agrupar B y C; $X_A\sim\operatorname{Bin}(4,0{,}5)$ y $X_C=4-X_A-X_B$.
4. Separar visualmente «independencia entre ensayos» de «dependencia entre recuentos».

### multinomial / momentos-con-indicadores

**Locución**

1. «Hola. Vamos a entender de dónde sale la covarianza negativa entre categorías. Para una misma célula, los indicadores de reposo y activación nunca pueden valer uno a la vez.»
2. «Su producto es cero. Al restar el producto de sus medias, queda menos la probabilidad de una categoría por la de la otra. Entre células distintas, la independencia hace cero las covarianzas cruzadas.»
3. «Sumamos las cuatro contribuciones de la misma célula: menos cuatro por una mitad por tres décimas da menos seis décimas. Cada recuento conserva su media y varianza binomiales.»
4. «La matriz de covarianzas tiene filas que suman cero porque el total de recuentos es constante. Puede ser singular sin ser inválida. Esta relación negativa refleja una restricción de las plazas disponibles; no demuestra que un estado cause biológicamente la desaparición de otro.»

**Realización**

1. Indicadores de una célula con $I_AI_B=0$.
2. $\operatorname{Cov}(I_A,I_B)=-p_Ap_B$; términos entre células distintas marcados como 0 bajo independencia.
3. $\operatorname{Cov}(X_A,X_B)=-4\times0{,}5\times0{,}3=-0{,}6$; $E[X_i]=np_i$, $\operatorname{Var}(X_i)=np_i(1-p_i)$.
4. Matriz con sumas de filas 0 y total fijo; no etiquetar singularidad como error.

### marginales / sumar-la-otra

**Locución**

1. «Hola. Queremos la probabilidad de i griega uno sin conocer equis. Vamos a reunir todas las maneras en que puede ocurrir, no a elegir una fila.»
2. «En la columna i griega uno hay quince centésimas en la primera fila y veinticinco en la segunda. Sumarlas da cuatro décimas. Esa es la marginal de i griega en uno.»
3. «Para conservar i griega sumamos sobre todos los valores de equis. Si quisiéramos conservar equis, sumaríamos las columnas de cada fila. No dividimos por el grupo de una condición, porque no estamos diciendo que equis sea conocido.»
4. «La marginal vuelve a ser una distribución que suma uno. Describe perfectamente las preguntas sobre ese componente, pero olvida cómo se coordina con el otro. Dos tablas distintas pueden tener los mismos totales y asociaciones muy diferentes.»

**Realización**

1. Tabla 0,35/0,15 y 0,25/0,25, con ejes explícitos.
2. Resaltar la columna Y=1; $0{,}15+0{,}25=0{,}40$.
3. $p_Y(y)=\sum_xp_{X,Y}(x,y)$ con flechas desde todas las filas; mostrar operación inversa para X.
4. Dos tablas de iguales marginales y celdas distintas, sin sugerir reconstrucción única.

### marginales / integrar-cortes

**Locución**

1. «Hola. Una densidad conjunta constante dos ocupa el triángulo de capacidad uno. ¿La marginal de equis será uniforme? Vamos a mirar cuánto espacio queda para la otra coordenada.»
2. «Con equis un cuarto, el corte vertical mide tres cuartos. Integrar la altura dos sobre ese recorrido da uno coma cinco. Es una densidad marginal, no una probabilidad puntual.»
3. «Cuando equis aumenta, el corte se acorta. Por eso la marginal es dos por uno menos equis: disminuye aunque la superficie conjunta tenga altura constante.»
4. «Su área entre cero y uno debe ser uno. Para la marginal de i griega repetimos el proceso intercambiando coordenadas. La forma de la región influye tanto como la fórmula de altura; no podemos ignorarla al integrar la otra variable.»

**Realización**

1. Triángulo con densidad 2 y corte móvil.
2. $x=0{,}25$, longitud0,75 y $2\times0{,}75=1{,}5$.
3. $f_X(x)=\int_0^{1-x}2\,dy=2(1-x)$ para $0<x<1$; gráfico marginal en ejes propios.
4. Sombrear toda la marginal para verificar área1; no dibujar la altura1,5 como masa en x=0,25.

### marginales / proyeccion-y-corte

**Locución**

1. «Hola. Vamos a separar olvidar una variable de conocer su valor. Para la marginal de i griega uno, sumamos todas las filas y obtenemos cuatro décimas.»
2. «Ahora sabemos equis uno. Su fila pesa una mitad y la celda i griega uno un cuarto. Dividir dentro de esa fila da una mitad. La información conocida ha cambiado el grupo.»
3. «La marginal suma sin fijar equis; la condicional normaliza con equis conocido. En continuo, proyectar por integración reúne todos los cortes. Un corte concreto todavía necesita normalizarse para convertirse en densidad condicional.»
4. «No reconstruyas una conjunta multiplicando marginales salvo que haya independencia justificada. Al marginalizar se pierde la coordinación, aunque cada distribución individual quede bien descrita. Antes de operar, di con palabras qué sabes y qué estás ignorando.»

**Realización**

1. Columna completa Y=1: 0,4.
2. Cambiar a fila X=1; $p_{Y\mid X}(1\mid1)=0{,}25/0{,}50=0{,}5$.
3. Animación de proyección de todos los cortes frente a un corte seleccionado y normalizado.
4. Dos preguntas visibles «sin fijar X» / «dado X=1», con operaciones suma / división separadas.

### conjunta-condicional / normalizar-region

**Locución**

1. «Hola. Dos cultivos comparten capacidad uno. Queremos una densidad constante sobre su triángulo de repartos. Primero elegimos la altura que da probabilidad total uno.»
2. «El triángulo tiene área una mitad, así que la altura debe ser dos. El volumen bajo la superficie es uno. La densidad tiene unidades inversas del producto de las dos medidas; la probabilidad no tiene unidades.»
3. «Ahora pedimos que la suma de recursos no supere una mitad. La región favorable es otro triángulo, de lados una mitad. Su área es un octavo. Multiplicar por la altura dos da un cuarto de probabilidad.»
4. «La probabilidad regional integra la conjunta sobre la zona solicitada dentro del soporte. Un rectángulo exterior incluiría repartos imposibles. Primero dibujamos la intersección de las condiciones; después escribimos los límites.»

**Realización**

1. Soporte $x,y\geq0$, $x+y\leq1$ y altura c desconocida.
2. $c/2=1$ y c=2; separar área de soporte y volumen de probabilidad.
3. Triángulo $x+y\leq1/2$; área $\frac12(1/2)^2=1/8$ y $2\times1/8=1/4$.
4. $P((X,Y)\in R)=\iint_Rf_{X,Y}(x,y)\,dx\,dy$, con R siempre recortada al soporte.

### conjunta-condicional / normalizar-corte

**Locución**

1. «Hola. Ahora conocemos equis dos décimas y queremos la distribución de i griega. En el triángulo de capacidad uno, su recorrido termina en ocho décimas.»
2. «El corte de la densidad conjunta tiene altura dos. Para normalizarlo calculamos la marginal de equis: dos por ocho décimas da uno coma seis. Dividir dos entre uno coma seis deja altura uno coma veinticinco.»
3. «Esa altura por la anchura ocho décimas da uno. Ya tenemos una densidad condicional válida. No dividimos por la probabilidad de equis exactamente dos décimas, que es cero en este modelo continuo: usamos su densidad marginal positiva.»
4. «En discreto sí dividimos masa conjunta por masa marginal positiva. La idea de normalizar es la misma, pero la medida utilizada cambia. Comprueba qué tipo de variable tienes antes de escribir el denominador.»

**Realización**

1. Corte x=0,2 y rango y∈[0,0,8].
2. $f_X(0{,}2)=2\times0{,}8=1{,}6$; $f_{Y\mid X}(y\mid0{,}2)=2/1{,}6=1{,}25$ dentro del corte.
3. $1{,}25\times0{,}8=1$ y distinción entre $f_X(0{,}2)$ y $P(X=0{,}2)=0$.
4. Contraste con $p_{Y\mid X}(y\mid x)=p_{X,Y}(x,y)/p_X(x)$ en una tabla discreta.

### conjunta-condicional / interpretar-condicion

**Locución**

1. «Hola. Con equis dos décimas, i griega queda entre cero y ocho décimas con densidad uno coma veinticinco. Vamos a preguntar por superar cuatro décimas.»
2. «El tramo favorable mide cuatro décimas. Multiplicarlo por la densidad da una mitad. No respondemos uno coma veinticinco: eso era altura, no área.»
3. «La condición define una distribución completa. Podríamos repetir con otros intervalos, pero siempre dentro del corte y con la misma normalización.»
4. «Ahora imagina que el instrumento solo informa equis entre quince y veinticinco centésimas. Eso selecciona una franja, no una línea exacta. La probabilidad se calcularía reuniendo y normalizando esa región de área positiva. No sustituyas automáticamente un rango de medición por su punto medio: cambia la pregunta y, en general, la respuesta.»

**Realización**

1. Gráfico condicional de altura1,25 sobre [0,0,8].
2. Sombreado [0,4;0,8]; $0{,}4\times1{,}25=0{,}5$.
3. Mostrar que el área completa del corte vale1.
4. Volver al plano y engrosar la condición hasta $0{,}15\leq X\leq0{,}25$; etiquetar «otra condición», sin reutilizar el resultado anterior.

### normal-bivariante / modelo-conjunto

**Locución**

1. «Hola. Dos señales tienen medias treinta y setenta, desviaciones cinco y ocho y correlación un cuarto. Vamos a describirlas mediante una normal conjunta. Tener dos marginales normales, por sí solo, no garantiza esta hipótesis.»
2. «La superficie tiene curvas de nivel elípticas. La correlación orienta y alarga las elipses sin cambiar por sí sola las medias y desviaciones marginales. Cada eje conserva sus propias unidades.»
3. «Para tipificar restamos a cada coordenada su centro y dividimos por su desviación. No usamos la desviación de una señal para transformar la otra.»
4. «El modelo con densidad bidimensional requiere desviaciones positivas y correlación estrictamente entre menos uno y uno. En los extremos la distribución se concentra en una línea: son casos degenerados que no admiten esta misma densidad sobre un área. Declarar el modelo conjunto es parte esencial del cálculo.»

**Realización**

1. Parámetros μX=30,μY=70,σX=5,σY=8,ρ=0,25 y etiqueta «normalidad conjunta supuesta».
2. Elipses sobre ejes X/Y con marginales en gráficos separados.
3. $z_x=(x-\mu_X)/\sigma_X$ y $z_y=(y-\mu_Y)/\sigma_Y$ en pasos sucesivos.
4. Contrastar elipses no degeneradas con una línea cuando |ρ|=1; no renderizar la fórmula singular.

### normal-bivariante / densidad-bivariante

**Locución**

1. «Hola. Vamos a construir la densidad normal de dos señales sin presentar toda la fórmula de golpe. Empezamos con sus coordenadas tipificadas.»
2. «Sumamos sus cuadrados y añadimos un término cruzado que depende de la correlación. Ese término orienta las elipses. Dividimos por un factor positivo, uno menos correlación al cuadrado, y aplicamos la exponencial negativa.»
3. «Falta normalizar. El denominador combina dos pi, las dos desviaciones y la raíz de ese mismo factor. Dividir la forma por el normalizador da la densidad conjunta, no la probabilidad de una pareja exacta.»
4. «Si la correlación es cero, desaparece el término cruzado y la expresión se separa en dos densidades normales. Bajo normalidad conjunta, eso demuestra independencia. Sin ese supuesto no podemos convertir covarianza cero en independencia solo porque la cuenta resulte cómoda.»

**Realización**

1. Mantener $z_x,z_y$ visibles con su significado.
2. $Q=z_x^2-2\rho z_xz_y+z_y^2$; después $K=\exp[-Q/(2(1-\rho^2))]$.
3. $D=2\pi\sigma_X\sigma_Y\sqrt{1-\rho^2}$; finalmente $f(x,y)=K/D$.
4. Mover ρ a0 y separar los dos factores marginales; etiqueta «conjuntamente normal». Dar pausa antes de cada nueva pieza.

### normal-bivariante / media-y-varianza-condicional

**Locución**

1. «Hola. Con las medias treinta y setenta, desviaciones cinco y ocho y correlación un cuarto, observamos equis cuarenta. Vamos a actualizar la curva de la otra señal, no a predecirla exactamente.»
2. «Equis quedó diez por encima de su media. La pendiente condicional es correlación por la razón de desviaciones: da cuatro décimas. Multiplicar por diez desplaza cuatro unidades la media de i griega.»
3. «Su media condicional pasa de setenta a setenta y cuatro. La varianza también cambia: multiplicamos la marginal sesenta y cuatro por uno menos correlación al cuadrado y obtenemos sesenta.»
4. «Para la desviación tomamos raíz de sesenta, aproximadamente siete coma setenta y cinco. No confundas multiplicar una varianza con multiplicar directamente una desviación. Todo esto depende del modelo conjuntamente normal y de sus parámetros, no solo de conocer un dato.»

**Realización**

1. Elipse y corte X=40; mantener tabla de parámetros originales.
2. $40-30=10$; $0{,}25\times8/5=0{,}4$; $0{,}4\times10=4$.
3. $\mu_{Y\mid40}=70+4=74$; $\sigma^2_{Y\mid40}=64(1-0{,}25^2)=60$.
4. $\sigma_{Y\mid40}=\sqrt{60}\approx7{,}746$; fórmula general $\sigma_{Y\mid x}=\sigma_Y\sqrt{1-\rho^2}$ y media $\mu_Y+\rho(\sigma_Y/\sigma_X)(x-\mu_X)$.

### normal-bivariante / cola-condicional

**Locución**

1. «Hola. Queremos que i griega supere ochenta y dos sabiendo que equis vale cuarenta. La curva que necesitamos es la condicional: media setenta y cuatro, varianza sesenta.»
2. «Restamos la nueva media al umbral y queda ocho. Dividir por raíz de sesenta da aproximadamente uno coma cero tres desviaciones. No usamos la media y desviación marginales.»
3. «La cola derecha estándar es alrededor de quince coma uno por ciento. El sombreado representa esa probabilidad sobre la curva del corte; las colas siguen fuera del marco visible.»
4. «Si conocemos otro valor de equis, la media condicional cambia pero su varianza permanece igual en este modelo. Con correlación cero, la condicional coincide con la marginal. Condicionar usa información; no prueba que una señal cause la otra ni elimina la incertidumbre de la observación individual.»

**Realización**

1. Distribución $Y\mid X=40\sim N(74,60)$ y umbral82.
2. $82-74=8$; $z=8/\sqrt{60}\approx1{,}033$.
3. $P(Y>82\mid X=40)=1-\Phi(8/\sqrt{60})\approx0{,}1508$, cola sombreada y colas exteriores indicadas.
4. Mover X para desplazar el centro sin variar la anchura; contraste con ρ=0, manteniendo visibles las condiciones del modelo.

### independencia-variables / factorizar-tabla

**Locución**

1. «Hola. Vamos a comprobar si dos variables son independientes usando toda su tabla, no una celda escogida. Las masas son cuarenta y dos, veintiocho, dieciocho y doce centésimas.»
2. «Sumando obtenemos marginales de equis siete y tres décimas; de i griega, seis y cuatro décimas. La primera celda debería pesar siete por seis décimas: cuarenta y dos centésimas. Coincide.»
3. «Hacemos lo mismo con las otras tres celdas y también coinciden sus productos. Aquí sí hay independencia. Una discrepancia bastaría para refutarla, pero una coincidencia aislada no la habría demostrado.»
4. «La idea general exige que las preguntas sobre ambas variables se separen en productos. También puede expresarse con acumuladas para todos los umbrales, no solo para un par favorable. Independencia es una propiedad de toda la distribución conjunta.»

**Realización**

1. Tabla X=0→0,42;0,28 y X=1→0,18;0,12, columnas Y=0,1.
2. Añadir marginales y comprobar $0{,}7\times0{,}6=0{,}42$.
3. Verificar las otras tres celdas en orden; no mostrar el veredicto antes de terminar.
4. $p_{X,Y}(x,y)=p_X(x)p_Y(y)$; después $F_{X,Y}(x,y)=F_X(x)F_Y(y)$ para todos los umbrales.

### independencia-variables / soporte-completo

**Locución**

1. «Hola. Una densidad constante dos ocupa un triángulo. ¿Podemos declarar independencia porque la altura parece fácil de separar? Tenemos que mirar también dónde la densidad es cero.»
2. «Si ambas coordenadas están entre tres cuartos y uno, su suma supera la capacidad uno. Toda esa región está prohibida: la conjunta vale cero.»
3. «Sin embargo, cada marginal es positiva en ese rango. Multiplicarlas daría densidad positiva a combinaciones imposibles. Esa discrepancia ocurre en una región con área, así que las variables no son independientes.»
4. «Para densidades la factorización se exige casi en todas partes: cambiar valores en conjuntos de área nula no cambia probabilidades. Por eso no basta encontrar un punto aislado distinto. Soporte, ceros y fórmula interior forman juntos la distribución que debemos comprobar.»

**Realización**

1. Triángulo x+y≤1 y altura2.
2. Cuadrado abierto $(3/4,1)\times(3/4,1)$ completamente fuera del soporte.
3. Marginales $2(1-x)$ y $2(1-y)$ positivas allí; contraste conjunta0/producto positivo sobre todo el cuadrado.
4. $f_{X,Y}(x,y)=f_X(x)f_Y(y)$ «casi en todas partes»; distinguir región de área positiva y punto aislado.

### independencia-variables / transformar-y-seleccionar

**Locución**

1. «Hola. Si dos variables son independientes, transformar cada una por separado mediante funciones medibles conserva esa independencia. Pero seleccionar un grupo con una condición sobre ambas puede cambiarla.»
2. «Por ejemplo, conservar solo parejas cuya suma es pequeña hace que un valor grande de una deje menos margen para la otra. Después de seleccionar, hay que revisar las hipótesis.»
3. «La independencia permite separar esperanzas de productos cuando las condiciones de integrabilidad lo autorizan. Con varianzas finitas elimina las covarianzas al sumar. El camino inverso no vale: covarianza cero no demuestra independencia.»
4. «Como contraste, equis toma menos uno, cero y uno equiprobables e i griega es su cuadrado. La pareja cero, cero pesa un tercio, pero el producto de sus marginales es un noveno. No son independientes: conocer equis determina i griega. Una comprobación concreta nos permite ver el fallo sin adivinarlo por la forma del gráfico.»

**Realización**

1. Transformaciones separadas g(X),h(Y); no usar una misma variable para ambas.
2. Seleccionar una región $X+Y\leq1$ y mostrar las combinaciones descartadas.
3. $E[g(X)h(Y)]=E[g(X)]E[h(Y)]$ con independencia e integrabilidad explícitas.
4. Tabla de (-1,1),(0,0),(1,1); $P(X=0,Y=0)=1/3$ frente a $P(X=0)P(Y=0)=1/9$.

### covarianza-matrices / desviaciones-compartidas

**Locución**

1. «Hola. Queremos resumir si dos lecturas se alejan de sus centros en la misma dirección. Vamos a restar sus medias y multiplicar las desviaciones, conservando el signo.»
2. «Las parejas cero, uno y uno, tres tienen probabilidad una mitad cada una. La media de equis es una mitad y la de i griega, dos. En la primera pareja ambas desviaciones son negativas; en la segunda, positivas.»
3. «Los dos productos valen una mitad. Promediarlos da covarianza una mitad. También podemos calcularla como esperanza del producto menos producto de esperanzas, si disponemos de los momentos necesarios.»
4. «El signo positivo indica movimiento compartido en promedio; el negativo, oposición. Su magnitud depende de las unidades: tiene producto de unidades de ambas variables. No es una probabilidad ni una medida causal. Primero interpretamos qué se está multiplicando, después usamos el resumen.»

**Realización**

1. Pares conectados a sus centros respectivos.
2. Tabla (0,1),(1,3), medias (0,5;2), desviaciones (-0,5;-1) y (0,5;1).
3. Productos 0,5 y 0,5 con pesos1/2; $\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]=0{,}5$.
4. Cuadrantes respecto a las medias y signos de productos; unidades visibles en cada eje.

### covarianza-matrices / normalizar-covarianza

**Locución**

1. «Hola. Tenemos varianzas nueve y dieciséis y covarianza seis. Vamos a comparar la asociación sin que cambiar las unidades cambie el número.»
2. «Las desviaciones son tres y cuatro. Su producto es doce. Dividir la covarianza seis entre doce da una correlación de una mitad. La normalización elimina las unidades.»
3. «Si duplicamos una variable, se duplican su desviación y la covarianza; el cociente se conserva. La correlación queda entre menos uno y uno cuando las desviaciones son positivas. Para una variable constante el denominador es cero y la correlación no está definida.»
4. «Este resumen mide asociación lineal. Puede pasar por alto una relación curva y no demuestra causalidad. La independencia implica covarianza cero con los momentos adecuados, pero la ausencia de correlación no devuelve automáticamente independencia. Esa distinción importa más que memorizar la escala del coeficiente.»

**Realización**

1. Ficha varianzas9,16/covarianza6.
2. Raíces3,4; $3\times4=12$; $\rho=6/12=1/2$.
3. Escalar Y por2; covarianza12, desviaciones3 y8 y mismo cociente. Caso constante con «no definida», no ρ=0.
4. Fórmula $\rho=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)$ y gráfico de dependencia curva como contraste.

### covarianza-matrices / matrices-admisibles

**Locución**

1. «Hola. Vamos a organizar las varianzas y covarianzas sin perder el orden de las medidas. Sigma mayúscula guarda nueve y dieciséis en la diagonal y seis en las dos posiciones cruzadas.»
2. «Para obtener correlaciones dividimos cada entrada por las desviaciones de su fila y columna. La nueva diagonal vale uno; fuera de ella aparece una mitad. Una matriz diagonal con tres y cuatro organiza esa conversión.»
3. «Una matriz de covarianzas debe dar varianza no negativa para cualquier combinación lineal. Esa condición se llama semidefinida positiva. Ser simétrica y tener diagonal positiva no basta.»
4. «En nuestro ejemplo el determinante es ciento ocho, positivo. Pero una matriz con varianzas uno y covarianza dos daría varianza negativa para la diferencia: es imposible. Revisar la coherencia matemática viene antes de interpretar una supuesta relación biológica.»

**Realización**

1. $\Sigma=\begin{pmatrix}9&6\\6&16\end{pmatrix}$ con etiquetas de variables persistentes.
2. $D=\operatorname{diag}(3,4)$; $R=D^{-1}\Sigma D^{-1}=\begin{pmatrix}1&1/2\\1/2&1\end{pmatrix}$, dividiendo entradas progresivamente.
3. $\boldsymbol a^{\mathsf T}\Sigma\boldsymbol a\geq0$ para toda combinación, sin exigir invertibilidad.
4. Determinante $9\times16-6^2=108$; contraejemplo $\begin{pmatrix}1&2\\2&1\end{pmatrix}$ y $\operatorname{Var}(X-Y)=1+1-4=-2$, etiquetado «matriz imposible».

### combinaciones-incorrelacion / suma-y-diferencia

**Locución**

1. «Hola. Dos lecturas emparejadas tienen varianzas cuatro y nueve y covarianza tres. Queremos saber cuánto varía su diferencia. Parte del movimiento compartido se cancela al restarlas.»
2. «Sumamos primero las varianzas: trece. El término cruzado de la diferencia resta dos veces la covarianza: seis. Quedan siete unidades cuadradas.»
3. «Si hubiéramos supuesto independencia sin motivo, habríamos obtenido trece. En una suma, esa misma covarianza positiva aumentaría la varianza, porque los movimientos compartidos se refuerzan.»
4. «La fórmula general pone los coeficientes al cuadrado en las varianzas y conserva el signo de su producto en el término cruzado. No sumamos desviaciones directamente. El efecto de relacionar las medidas depende de la operación que queremos hacer con ellas.»

**Realización**

1. Lecturas emparejadas y diferencia, con unidades compatibles.
2. $4+9=13$, $2\times3=6$, $13-6=7$ en pasos sucesivos.
3. Comparación con suma, varianza19, y caso hipotético independiente, varianza13; etiquetar cada supuesto.
4. $\operatorname{Var}(aX+bY)=a^2\sigma_X^2+b^2\sigma_Y^2+2ab\operatorname{Cov}(X,Y)$, revelando el término cruzado al final.

### combinaciones-incorrelacion / forma-matricial

**Locución**

1. «Hola. Con varias medidas, la notación matricial organiza la misma cuenta de una combinación lineal. No añade una hipótesis nueva de independencia.»
2. «El vector de coeficientes indica cuánto pesa cada medida. Multiplicarlo por el vector de medias da la media de la combinación, siempre que las esperanzas existan. Es la misma linealidad que ya conocemos.»
3. «Para la varianza ponemos la matriz de covarianzas entre los coeficientes. Al desarrollar el producto aparecen las varianzas de la diagonal y todos los términos cruzados. La covarianza de una variable consigo misma es precisamente su varianza.»
4. «El resultado debe ser no negativo para cualquier elección de coeficientes. Puedes comprobarlo desarrollando primero un caso de dos variables y reconociendo cada término. La matriz hace más compacta la escritura; no sustituye comprender qué medidas estamos sumando y con qué unidades.»

**Realización**

1. Vector de medidas y fila de coeficientes; expandir $\boldsymbol a^{\mathsf T}\boldsymbol X=\sum_i a_iX_i$.
2. $E[\boldsymbol a^{\mathsf T}\boldsymbol X]=\boldsymbol a^{\mathsf T}\boldsymbol\mu$ con correspondencia de colores.
3. $\operatorname{Var}(\boldsymbol a^{\mathsf T}\boldsymbol X)=\boldsymbol a^{\mathsf T}\Sigma\boldsymbol a$; desarrollar un ejemplo de dos componentes.
4. Destacar diagonal y dos copias simétricas del término cruzado; verificar el resultado no negativo.

### combinaciones-incorrelacion / incorrelacion

**Locución**

1. «Hola. Vamos a cerrar con un contraejemplo que conviene recordar. Equis es uniforme entre menos uno y uno e i griega es su cuadrado. Conocer equis determina por completo i griega.»
2. «La simetría da media de equis cero y promedio de su cubo cero. El producto de equis por i griega es justamente ese cubo. Al calcular la covarianza queda cero.»
3. «Las dos varianzas son positivas y finitas, así que la correlación también es cero. Sin embargo, la relación exacta sigue ahí: tiene forma de curva, no de recta. Incorrelación no significa independencia.»
4. «Bajo normalidad conjunta sí existe la excepción: covarianza cero implica independencia. Dos marginales normales, sin más, no bastan. Al interpretar relaciones, separa siempre restricción de diseño, asociación estadística y causalidad. Los números ayudan a describir; no cuentan por sí solos toda la historia.»

**Realización**

1. Parábola $Y=X^2$ para X∈[-1,1], sin dispersión aleatoria alrededor.
2. $E[X]=0$, $E[X^3]=0$, $E[X^2]=1/3$; después $\operatorname{Cov}(X,Y)=E[X^3]-E[X]E[X^2]=0$.
3. Etiquetas «correlación 0», «dependencia exacta» junto a la curva; mantener ambas simultáneamente.
4. Contraste con normal conjunta de covarianza0 y dos componentes independientes; cierre «incorrelación no basta en general».