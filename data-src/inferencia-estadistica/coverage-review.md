# Revision de cobertura PDF

Fecha: 2026-11-06. Rama: feat/course-pdf-capstone-review.

## Alcance y evidencia

- Fuentes locales: cuatro PDF de teoria (13 + 24 + 22 + 19 = 79 paginas) y tres solucionarios (7 + 25 + 18 = 50 paginas). Numeracion fisica de pagina, desde 1, no la numeracion impresa del libro.
- Extraccion con pypdf del python3 del sistema, por pagina y en memoria. Se extrajeron los encabezados de toda la teoria y se contrastaron los cuerpos formales relevantes y los enunciados/apartados de los solucionarios. Esto no es una revision de los pixeles ni de todas las figuras de los PDF.
- Curso: 36 lecciones conservadas, 5 de puente original y 31 vinculadas a los cuatro temas: 6 + 6 + 11 + 8. Ninguna familia requerida esta ausente: 7 discretas, 6 continuas, multinomial y normal bivariante; familia exponencial se trata como estructura, no como una distribucion adicional.
- Banco: 22 problemas numerados, 87 entradas numericas: U1 5/18, U2 9/47, U3 8/22. Un problema puede reunir varios apartados y una entrada puede comprobar una celda de una construccion completa. Estos recuentos NO demuestran por si solos completitud semantica.
- PEC: dos paginas del enunciado contrastadas y tres problemas completos incorporados al tema 5. Trece preguntas numericas y tres cualitativas, con derivaciones, interpretaciones y visualizaciones adicionales.
- La revision inicial fue estatica. La integracion posterior ejecuto las pruebas Node, incluida aritmetica independiente, montaje real con DOM simulado y canvas real a 320/960 pixeles. No se ha realizado una comprobacion en navegador ni una escucha de todos los audios.

## Matriz de teoria

Cada fila agrupa los subepigrafes del intervalo indicado, incluidos ejemplos y propiedades. "Cubierto" significa competencia y definicion presentes, no transcripcion de todos los ejemplos, codigo o demostraciones. Los casos con limitaciones se explicitan al final.

### Tema 1

Fuente: [FundamentosInferencia_Tema1.pdf](../../static/materiales/FundamentosInferencia_Tema1.pdf).

| Seccion PDF | Paginas | Leccion | Contraste y notas necesarias |
| --- | --- | --- | --- |
| 1.1, 1.1.1, 1.1.2, 1.1.2.1 | 1-2 | sucesos | Experimento, resultado, suceso, seguro/imposible y operaciones de conjuntos. |
| 1.2, 1.2.1 | 2-3 | axiomas | Tres axiomas, aditividad numerable; mecanismo y eleccion de medida. |
| 1.3, 1.4 | 3 | axiomas, sucesos | Equiprobabilidad no automatica; sucesos observables y sigma-algebra, tambien en suplemento existente. |
| 1.5.1-1.5.6 | 4-5 | axiomas, condicionada | Complemento, inclusion, union, inclusion-exclusion general, producto y Bonferroni. Completadas la alternancia general y la cota sin independencia. |
| 1.6, 1.6.1 | 5-6 | condicionada | Condicion de probabilidad positiva; medida condicionada y regla del producto. |
| 1.6.2, 1.6.3 | 6 | independencia-sucesos | Factorizacion, casos nulos e incompatibilidad. Completada independencia al tomar complementos con justificacion. |
| 1.7, 1.7.1, 1.7.2 | 6-7 | bayes-diagnostico, condicionada | Particion, ponderacion de rutas, probabilidad total y Bayes; denominadores positivos. |
| 1.8, 1.9, 1.9.1-1.9.5 | 7-9 | combinatoria | Producto; las cinco reglas segun orden, repeticion e indistinguibilidad. |
| 1.10, 1.10.1 | 9-10 | axiomas | Frecuencia frente a probabilidad, estabilidad del mecanismo y simulacion. No port literal del codigo R. |
| 1.11, 1.11.1, 1.11.2 | 11-13 | bayes-diagnostico | Sensibilidad, especificidad, prevalencia, VPP y VPN con ejemplo propio. |

### Tema 2

Fuente: [FundamentosInferencia_Tema2.pdf](../../static/materiales/FundamentosInferencia_Tema2.pdf).

| Seccion PDF | Paginas | Leccion | Contraste y notas necesarias |
| --- | --- | --- | --- |
| 2.1, 2.2 | 1-2 | variable-cdf | Regla numerica sobre resultados, realizacion y agrupacion de resultados. |
| 2.3, 2.4 | 2-4 | variable-cdf | CDF, limites, monotonia, continuidad derecha, intervalos y saltos. |
| 2.5, 2.5.1, 2.5.2 | 4-5 | variable-cdf, densidad | Discreta, continua, absolutamente continua y singular. Completada la mencion de distribucion mixta con masa y componente exponencial. |
| 2.6, 2.6.0.1, 2.6.0.1.1 | 5-6 | masa | Cuatro indicadores pedidos: interseccion, union, complemento y espacio completo. Completados los dos ultimos; tambien se explica el vacio. |
| 2.6.1, 2.6.2, 2.6.3 | 6-8 | masa, variable-cdf | Masa no negativa, normalizacion, soporte, acumulacion e intervalos discretos. |
| 2.7, 2.7.1, 2.7.2, 2.7.2.1 | 9-11 | densidad | Areas, normalizacion, CDF por tramos, derivada donde corresponde y puntos de probabilidad cero. |
| 2.8 | 11 | esperanza, varianza | Parametros de localizacion y dispersion. Completado que media y varianza no identifican una distribucion sin fijar familia. |
| 2.9, 2.10 | 12 | esperanza | Media ponderada discreta/continua, existencia e integrabilidad. |
| 2.11, 2.11.1, 2.11.2 | 13 | esperanza | E de una funcion, linealidad sin independencia y producto con condiciones. |
| 2.12, 2.12.1 | 13-14 | varianza | Definicion centrada, segundo momento, escala, desplazamiento y suma con covarianza. |
| 2.13 | 14-15 | momentos-transformaciones | Momentos ordinarios y centrales; comprobar existencia. Estandarizacion y cambio de distribucion siguen identificados como ampliaciones. |
| 2.14 | 15 | variable-cdf | Medibilidad ya incluida; el PDF llama opcional a este epigrafe. |
| 2.15.1-2.15.7 | 16-21 | variable-cdf, masa | Espacio de pares de dados, suma y minimo: masas, acumuladas, momentos y probabilidades desarrolladas. |
| 2.15.8-2.15.12 | 22-24 | esperanza, varianza | Juego, series de esperanza finita e infinita, existencia absoluta y diferencia con Cauchy; desarrollos propios de los ejemplos contrastados. |

### Tema 3

Fuente: [FundamentosInferencia_Tema3.pdf](../../static/materiales/FundamentosInferencia_Tema3.pdf).

| Seccion PDF | Paginas | Leccion | Contraste y notas necesarias |
| --- | --- | --- | --- |
| 3.1.1, 3.1.1.1, 3.1.2, 3.1.2.1, 3.1.2.2 | 1-6 | bernoulli-binomial | Indicador, n ensayos independientes con p comun, masa y momentos; Bernoulli como un ensayo. |
| 3.1.3, 3.1.3.1 | 6-7 | poisson | Media por exposicion, masa, momentos y suma independiente. Aproximacion binomial declarada como tal. |
| 3.1.4, 3.1.4.1-3.1.4.3 | 7-8 | uniforme-montecarlo | Masa equiprobable; media y varianza para enteros consecutivos, no lista arbitraria. |
| 3.1.5, 3.1.5.1 | 8-9 | hipergeometrica | Muestreo uniforme sin reemplazo, soporte y correccion finita con N mayor que uno. |
| 3.1.6, 3.1.6.1, 3.1.6.2 | 9-10 | geometrica-negativa | Fracasos desde cero frente a ensayos desde uno. Completado 0 < p <= 1 y los casos frontera. |
| 3.1.7, 3.1.7.1 | 10-11 | geometrica-negativa | Fracasos hasta r exitos, momentos, r entero en espera y forma real positiva en extension. |
| 3.1.8 | 11 | calculo-modelos y lecciones de cada modelo | Tabla comparativa de las 13 familias univariantes, soporte, parametros, momentos y criterio de eleccion. |
| 3.2.1, 3.2.1.1-3.2.1.3 | 11-13 | uniforme-montecarlo | Densidad, momentos, cuantiles generalizados, Montecarlo e inversion discreta. |
| 3.2.2, 3.2.2.1 | 14 | exponencial | Escala frente a tasa, supervivencia, momentos, carencia de memoria y Poisson. |
| 3.2.3, 3.2.3.1, 3.2.4 | 15-16 | normal | Densidad, soporte, varianza frente a desviacion, tipificacion, colas, cuantiles y combinaciones normales independientes. |
| 3.2.5, 3.2.5.1 | 16-17 | gamma | Forma y escala positivas, normalizador gamma, momentos y sumas independientes con escala comun. |
| 3.2.6, 3.2.6.1 | 17-18 | cauchy-weibull | Cauchy sin esperanza ni varianza; completada su CDF por arco tangente y un intervalo propio. |
| 3.2.7, 3.2.7.1 | 18 | cauchy-weibull | Weibull, supervivencia y momentos; forma uno recupera exponencial. Riesgo identificado como ampliacion. |
| 3.2.8, 3.3 | 18-19 | calculo-modelos | Masa/densidad, CDF, cuantil y simulacion; ejemplos existentes R/SciPy. No se portan todos los programas o enlaces externos. |
| 3.4, 3.4.1, 3.4.1.1 | 19-20 | familia-exponencial | Soporte fijo, h/T/eta/A y correspondencia con Q/C del PDF; Poisson explicita. |
| 3.4.1.2, 3.4.1.2.1, 3.4.1.2.2 | 20-21 | familia-exponencial | Dos normales uniparametricas, parametro fijo, estadistico lineal/cuadratico y dominio natural, en suplemento existente. |
| 3.4.2 | 21-22 | familia-exponencial | Binomial con n fijo y 0 < p < 1; h, logit, normalizador y limites degenerados. |
| 3.4.3, 3.4.4, 3.4.5 | 22 | familia-exponencial | Alcance de resultados comunes, GLM y estimacion introductoria. No promete insesgadez ni desarrolla IC/contrastes. |

### Tema 4

Fuente: [FundamentosInferencia_Tema4.pdf](../../static/materiales/FundamentosInferencia_Tema4.pdf).

| Seccion PDF | Paginas | Leccion | Contraste y notas necesarias |
| --- | --- | --- | --- |
| 4.1, 4.1.1, 4.1.2, 4.1.2.1, 4.1.2.2 | 1-3 | conjunta-discreta | Vector del mismo resultado, CDF bivariante, celdas y sucesos; ejemplo propio. |
| 4.2, 4.2.1, 4.2.2, 4.2.2.1 | 3-4 | conjunta-discreta | Masa no negativa, suma uno, regiones y distincion CDF/masa; rectangulos en suplemento existente. |
| 4.2.3, 4.2.3.1, 4.2.3.2 | 4-6 | conjunta-discreta | Metodo de tabla y regiones; no replica literal de su tabla biologica, codigo R y figura. |
| 4.3, 4.3.1-4.3.4 | 6-8 | multinomial | Categorias exhaustivas/excluyentes, ensayos independientes, masa y soporte restringido; trinomial con dos coordenadas libres no independientes. |
| 4.4, 4.4.1-4.4.3 | 8-9 | marginales, multinomial | Sumas sobre la variable descartada y marginales binomiales. |
| 4.5, 4.5.1, 4.5.2 | 9 | conjunta-condicional, multinomial | Cociente con marginal positiva. Completado el caso condicional binomial con n-m ensayos y p_i/(1-p_j), ejemplo propio. |
| 4.6, 4.6.1-4.6.3 | 9-10 | conjunta-condicional, marginales | Volumen uno, regiones, marginales y condicionales continuas sin dividir por probabilidad puntual cero. |
| 4.6.4, 4.6.4.1, 4.6.4.2, 4.6.5 | 11-13 | normal-bivariante | Densidad no degenerada, marginales y condicionales: completar el cuadrado, integrar la gaussiana, unidades y ejemplo de cola con R/SciPy. |
| 4.7, 4.7.1, 4.7.1.1, 4.7.2, 4.7.3 | 13-14 | independencia-variables | Factorizacion de CDF/masa/densidad, todos los umbrales, casi por todas partes y soporte completo. |
| 4.8, 4.8.1-4.8.3 | 14-16 | covarianza-matrices | Vector de medias, covarianza con momentos y correlacion con varianzas positivas. |
| 4.8.4, 4.8.5, 4.8.5.1 | 16-17 | covarianza-matrices | Matrices, simetria, normalizacion y ejemplo propio; semidefinicion positiva explicada. |
| 4.8.6, 4.8.7 | 17-18 | independencia-variables, combinaciones-incorrelacion | Producto integrable, linealidad, covarianzas en sumas/diferencias y forma matricial. |
| 4.8.8 | 18 | multinomial, combinaciones-incorrelacion | Momentos y derivacion de covarianza mediante indicadores en suplemento existente. |
| 4.8.9 | 18-19 | combinaciones-incorrelacion | Contraejemplo no lineal propio y excepcion de normalidad conjunta, no solo marginal. |

## Matriz de ejercicios

Las preguntas numericas conservan sus IDs y orden. Los nombres de pregunta son los del banco, no una renumeracion de los PDF. Los textos explicativos, tablas completas y formulas generales cuentan como razonamiento, no como una nueva respuesta escalar.

| PDF / pagina inicial | Apartados originales | Problema del banco / preguntas | Cobertura y particularidades |
| --- | --- | --- | --- |
| U1 p.1 | 1 a-e | [pdf-u1-1](../../pages/inferencia/pdf-exercises.js#L187), 5 | Union, complemento, dos diferencias y ninguno; regiones disjuntas. |
| U1 p.2 | 2, puntos 1-4 | [pdf-u1-2](../../pages/inferencia/pdf-exercises.js#L204), 4 | Al menos una, solo A, B o C sin A, A o ninguno de B/C; traduccion y solapamientos. |
| U1 p.4 | 3 a, b (A y B) | [pdf-u1-3](../../pages/inferencia/pdf-exercises.js#L232), 3 | Total negativo y dos posteriores positivas, no solo una. |
| U1 p.5 | 4 a, b, c (ambos valores) | [pdf-u1-4](../../pages/inferencia/pdf-exercises.js#L251), 4 | VPP/VPN a prevalencias 0,2 y 0,8; dependencia de prevalencia. |
| U1 p.6 | 5 VPP y VPN | [pdf-u1-5](../../pages/inferencia/pdf-exercises.js#L256), 2 | Conversion 0,21 % a 0,0021 y efecto de condicion rara. |
| U2 p.2 | 2.1, 1 (distribucion/grafica), 2 (media/varianza) | [pdf-u2-2.1](../../pages/inferencia/pdf-exercises.js#L261), 3 | Seis variantes agrupadas en tres masas; funcion completa y barras. |
| U2 p.5 | 2.2, 1, 2 (dos momentos), 3 (tres sucesos) | [pdf-u2-2.2](../../pages/inferencia/pdf-exercises.js#L276), 6 | K, masa completa, media/varianza y tres probabilidades. |
| U2 p.8 | 2.3 a, b, c (4), d (3), e (2), f (K y repetir b-e; discutir adecuacion) | [pdf-u2-2.3](../../pages/inferencia/pdf-exercises.js#L302), 22 | Ambos modelos, funciones por tramos, 0,5 anos, momentos y adecuacion. Densidades y ambas CDF continuas con dominios, tramos y coordenadas reales, comprobadas tambien al retroceder. |
| U2 p.13 | 2.4 | [pdf-u2-2.4](../../pages/inferencia/pdf-exercises.js#L387), 1 | Definir supervivencia 0,8, justificar Bin(10,0,8), sumar 8-10 o complementar F(7). |
| U2 p.15 | 2.5, 1-3 | [pdf-u2-2.5](../../pages/inferencia/pdf-exercises.js#L402), 3 | Masa en 10, cola desde 15 y acumulada hasta 10 con exposicion anual. |
| U2 p.17 | 2.6, 1-2; justificaciones del solucionario | [pdf-u2-2.6](../../pages/inferencia/pdf-exercises.js#L417), 4 | Media, binomial exacta, Poisson aproximada y diferencia absoluta; no declara ambas exactas. |
| U2 p.20 | 2.7, 1-3 | [pdf-u2-2.7](../../pages/inferencia/pdf-exercises.js#L434), 3 | Dos porcentajes y percentil 25; tipificacion con sigma=8. |
| U2 p.22 | 2.8, 1 (umbral y sanos), 2 (posterior) | [pdf-u2-2.8](../../pages/inferencia/pdf-exercises.js#L441), 4 | Umbral, tasa de falsos positivos, N por esa tasa y Bayes. No inventa N ni un recuento observado. |
| U2 p.24 | 2.9 | [pdf-u2-2.9](../../pages/inferencia/pdf-exercises.js#L463), 1 | Combinaciones favorables/totales, seis de cada grupo sin reemplazo. |
| U3 p.2 | 1 a-b | [pdf-u3-1](../../pages/inferencia/pdf-exercises.js#L477), 2 | Nueve asignaciones, toda la masa y F(1,0); comprobador escalar no sustituye la tabla. |
| U3 p.3 | 2, 1-2 | [pdf-u3-2](../../pages/inferencia/pdf-exercises.js#L491), 2 | Ocho secuencias, siete celdas no nulas, masa completa y F(2,1), incluida perdida. |
| U3 p.5 | 3 a-b | [pdf-u3-3](../../pages/inferencia/pdf-exercises.js#L505), 2 | Marginal completa y comprobacion de sus tres valores con Bin(2,1/3); explica que no hay conflicto. |
| U3 p.7 | 4, 1-2; contradiccion verbal | [pdf-u3-4](../../pages/inferencia/pdf-exercises.js#L522), 2 | K=1 y desigualdad escrita: 2/3. Completada la lectura verbal alternativa: probabilidad 1; vuelve a la figura de la pregunta evaluada. |
| U3 p.9 | 5 a-b | [pdf-u3-5](../../pages/inferencia/pdf-exercises.js#L543), 2 | Marginal continua y corte condicional, con limites y normalizacion. |
| U3 p.11 | 6 a-b (b cualitativo) | [pdf-u3-6](../../pages/inferencia/pdf-exercises.js#L562), 2 | Covarianza y explicacion de signo negativo por total fijo; celda imposible adicional refuta independencia. La repeticion de 5 en pp.13-15 no es otro problema. |
| U3 p.15 | 7, 1-3 (maximo y relacion) | [pdf-u3-7](../../pages/inferencia/pdf-exercises.js#L580), 4 | Autocovarianza, imposibilidad de 7, maximo 4 y relacion afin exacta Y2=2Y1-9 casi seguramente. |
| U3 p.17 | 8, 1, 2 (media/varianza), 3, 4 (media/varianza) | [pdf-u3-8](../../pages/inferencia/pdf-exercises.js#L604), 6 | Masa con n=6 y cinco formulas para n general; n=6 se usa solo como comprobacion numerica, no para borrar lo simbolico. |

Fuentes de la tabla: [U1](../../static/materiales/Ejercicios_Unidad_1-Soluciones.pdf), [U2](../../static/materiales/Ejercicios_Unidad_2-Soluciones.pdf), [U3](../../static/materiales/Ejercicios_U3-Distribuciones_multivariantes-SOLUCIONES.pdf). U3 de ejercicios corresponde al Tema 4 de teoria.

## Errores y ambiguedades de las fuentes

Ya estaban corregidos en el banco antes de esta revision, salvo la ampliacion indicada en U3-4:

- U2 2.3, p.11: F(0,5)=7/16=0,4375 y P(0,5<X<1)=5/16=0,3125; no 0,375 en ambos casos.
- U2 2.6, pp.17-20: con total observado fijo, Poisson no es un segundo modelo exacto del mismo recuento; es aproximacion de Bin(150,0,1). p=0,1 no garantiza precision universal.
- U2 2.7, p.21: el resultado R de 0,9371907 es coherente con Phi(1,75)-Phi(-2); la conclusion 0,9575/95,75 % es incorrecta. El percentil 25 es aproximadamente 100,60408: la frase 100,61 tampoco es el redondeo usual a dos decimales (100,60); el banco conserva precision.
- U2 2.8, p.22: se requiere el 2 % inferior de diabeticos, aunque la explicacion diga superior. En p.24 se usa la acumulada de sanos donde hace falta su cola derecha; posterior correcta aproximadamente 0,6431, no 0,1038555. Sin N solo cabe expresar un numero esperado, no asegurar un recuento.
- U3 1, p.2: BC produce (0,1), no (1,0); la tabla agregada posterior si recoge el resultado correcto.
- U3 2, p.4: la formula resumida da 1/8 a todas las celdas; (2,1) requiere 2/8, como indica su enumeracion previa.
- U3 4, p.7: Y1 >= 3Y2 significa dejar como maximo un tercio, es decir, reducir al menos dos tercios. Reducir al menos un tercio significaria Y2 <= 2Y1/3; todo el soporte ya satisface Y2 <= Y1/2, por lo que esa lectura tiene probabilidad 1. Se documentan ambas, sin cambiar la respuesta 2/3 de la desigualdad escrita.
- U3 pp.13-15: se repite solucion del ejercicio 5 dentro de 6; no se cuenta como ejercicio nuevo.

## Cambios realizados

Ocho cuerpos teoricos existentes, sin cambiar titulos ni anadir secciones:

| Archivo / linea | Contenido incorporado |
| --- | --- |
| [course.js L99](../../pages/inferencia/course.js#L99) | Inclusion-exclusion general y Bonferroni; derivacion por complementos, truncacion en cero y ejemplo 0,7 sin independencia. |
| [course.js L138](../../pages/inferencia/course.js#L138) | Independencia conservada al complementar uno o ambos sucesos, con justificacion. |
| [course.js L171](../../pages/inferencia/course.js#L171) | Variable mixta: masa 0,3 y componente exponencial de peso 0,7; acumulada y normalizacion. |
| [course.js L184](../../pages/inferencia/course.js#L184) | Indicadores del complemento, espacio completo y vacio. |
| [course.js L209](../../pages/inferencia/course.js#L209) | Media y varianza no determinan una distribucion sin fijar familia. |
| [course.js L293](../../pages/inferencia/course.js#L293) | Dominio de p, casos 0 y 1, r entero positivo frente a forma real positiva. |
| [course.js L358](../../pages/inferencia/course.js#L358) | CDF de Cauchy, origen de la constante 1/2 y probabilidad de (-1,1)=1/2. |
| [course.js L417](../../pages/inferencia/course.js#L417) | Condicional multinomial/binomial y condiciones; ejemplo propio Bin(3,5/8), masa en 3 igual a 125/512. |

Banco: [pdf-exercises.js L327](../../pages/inferencia/pdf-exercises.js#L327) explica las dos curvas CDF de 2.3 y distingue sus muestras en barras de masas discretas. [pdf-exercises.js L537](../../pages/inferencia/pdf-exercises.js#L537) resuelve ambas lecturas de U3-4 y devuelve la figura final a la pregunta numerica. Son cinco beats nuevos entre tres preguntas; ningun nuevo problema ni respuesta.

Pruebas: dos regresiones anadidas a [pdf-exercises.test.mjs L278](../../tests/pdf-exercises.test.mjs#L278) y [L297](../../tests/pdf-exercises.test.mjs#L297): explicaciones graficas, contradiccion verbal, figura final correcta, ocho cuerpos requeridos no opcionales y aritmetica de los nuevos ejemplos.

## Tema 5: PEC 1 resuelta

Fuente: [enunciado de PEC 1](../../static/materiales/UOC-MU-IE-2026-27-S1-PEC1-enunciado-1.pdf). Datos y resoluciones: [capstone.js](../../pages/inferencia/capstone.js).

| Problema / pagina | Apartados | Contenido y comprobacion |
| --- | --- | --- |
| 1 / 1 | a, b, c | Informacion existencial frente a seleccion uniforme previa. Enumeracion completa de 100 y 200 estados; 9/19 frente a 1/2 y explicacion de los pesos de seleccion. |
| 2 / 1-2 | a, b, c.i, c.ii | Poisson, suma independiente, Bayes con cuatro colonias y prediccion de una segunda placa de la misma incubadora desconocida; no se supone independencia marginal. |
| 3 / 2 | a, b, c.i, c.ii, d.i-d.iii, e | Condicional normal, diferencia y covarianza, independencia bajo normalidad conjunta, multinomial y aproximacion binomial con correccion 74,5. Referencia binomial exacta separada de la aproximacion solicitada. |

## Comprobaciones y limites

- Las 87 respuestas pasan las referencias independientes de [la prueba numerica](../../tests/pdf-exercises.test.mjs): aritmetica racional, integrales elementales, recurrencias binomial/Poisson y normal por cuadratura/inversion independientes de jStat. Ninguna respuesta o tolerancia del banco anterior se cambio.
- Los ejemplos nuevos usan referencias exactas 7/10, salto 3/10, total 1, 125/512 y 1/2, incluidas en la nueva regresion. La interpretacion verbal de U3-4 se prueba por inclusion de toda la region convexa; la pregunta evaluada sigue rechazando 1.
- KaTeX, DOM, tutor, graficas y contratos numericos se ejecutaron con resultado correcto. Las respuestas cualitativas no se convierten en ceros ni registran aciertos ficticios.
- Todas las escenas y apartados tienen una figura inicial, y las operaciones aparecen en su frase, no en la siguiente. La geometria y las fases se prueban con canvas real, sin afirmar una inspeccion visual en navegador.
- Los ejemplos y demostraciones tienen redaccion propia. Se cubren conceptos, familias y apartados de ejercicios, no una copia literal de cada parrafo, figura, programa R o enlace externo. La tabla comparativa, los dados, las series y las deducciones gaussianas se ampliaron despues de la primera revision.
- Los 118 guiones hablados conservan su texto para mantener compatibles sus audios medidos. Las nuevas derivaciones formales estan en los apuntes completos, no se afirma que todas se hayan grabado. La lectura global tiene 521 escenas y usa reloj estimado: no hay audio global publicado.
- El versionador comprueba las dependencias del reproductor y del tutor y propaga las huellas al aula y al HTML. Las tres paginas del tema 5 se generan desde su fuente; las 36 lecciones conservan IDs y progreso.