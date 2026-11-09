# Normal bivariante: corte y cola condicional

Se eligio el fragmento media-y-varianza-condicional completo y el inicio de
cola-condicional de normal-bivariante. Son 75.1 s de narracion original medida,
22 frases y 2253 fotogramas. El contraste entre regiones triangulares,
marginalizacion, transformaciones y escenas de normales llevo a elegir este
paso por la coordinacion conjunta/corte/curva normalizada y el cambio de escala.
Es una valoracion de dificultad visual, no una clasificacion objetiva de motores.

## Dos decisiones independientes

Manim eligio contornos mediante descomposicion espectral de la covarianza,
puntos enlazados entre el corte y su perfil, normalizacion con cambio del eje
de densidad y un segundo eje Z. Sus formulas son MathTex nativas.

Remotion eligio contornos mediante factorizacion de la covarianza, mapa de
densidad, particulas de transporte, montaje de media/varianza y un cambio afine
de coordenadas con Jacobiano. Sus formulas usan KaTeX y sus densidades jStat.

Ambos escogieron un plano conjunto a la izquierda y una curva a la derecha.
Se compartieron solo el contenido matematico, audio y restricciones de salida;
esa coincidencia no fue una coreografia prescrita. Los agentes recibieron la
prohibicion de consultar el trabajo previo o ajeno y declararon respetarla.
No hubo aislamiento de sistema operativo demostrable: el terminal compartido
devolvio alguna salida ajena, descartada segun sus informes. Los procesos de
exportacion se aislaron desde el comienzo. El coordinador no edito sus escenas.

## Verificacion y limites

muCond=74; varCond=60; sdCond=sqrt(60); z=1.032795559;
P(Y>82 | X=40)=0.1508497912. La integral del corte conjunto es
fX(40)=0.0107981933, mientras que la condicional integra uno. Se asume
normalidad conjunta; normales marginales por si solas no la justifican.

El coordinador comprueba el numero de frames, dimensiones, fps, duracion,
decodificacion completa y que el payload AAC sea identico al recurso comun.
Tambien revisa fuentes y muestras visuales de las transiciones. Los informes
de cada agente conservan sus verificaciones propias. No se hizo reproduccion
interactiva de la web ni escucha independiente: no se afirma esa verificacion.

Los graficos recortan extremos de distribuciones infinitas. Las probabilidades
se calculan con la distribucion completa, no por pixeles del area dibujada.
El fragmento no reproduce toda la leccion ni sus avisos finales sobre
causalidad. La construccion intermedia de curvas es pedagogica, no una nueva
observacion. Los tiempos de render en los informes no miden programacion.

## Fuentes y reproduccion

Cada archivo source.tar.gz contiene solo el participante correspondiente, el
brief y recursos comunes, y el package.json/lock del runtime aislado. No
contiene las caches ni el codigo del otro agente. Las carpetas conservan la
estructura del repositorio; los MP4/posters son entregables separados.

Con las dependencias del runtime instaladas y la imagen Docker cacheada:

```sh
node data-src/video-comparison/manim/bivariate/render.mjs --render
node data-src/video-comparison/remotion/bivariate/render.mjs
node data-src/video-comparison/bivariate/publish.mjs
node --test tests/video-comparison.test.mjs
```

prepare.mjs lee las fuentes actuales y reconstruye los recursos comunes: NO
ejecutarlo para reproducir esta comparacion historica. Usar script.json y
audio.m4a congelados. results.json y sources.json se generan al publicar y
contienen hashes y cuentas separadas de escena, auxiliares, CSS y exportacion.