# Fragmento exigente: de la normal conjunta a la condicional

## Seleccion

Normal bivariante, seccion media-y-varianza-condicional completa (41.4 s), seguida
de los primeros 33.7 s de cola-condicional. Son 75.1 s y 2253 frames a 30 fps.
La comparacion no altera las lecciones. El archivo congelado script.json y
audio.m4a en static/comparativa-videos/bivariante/shared son el contrato comun.
El audio original se recorta por limites de frases y se concatena/recodifica una
sola vez a AAC; ambas versiones deben reutilizar ese mismo audio.

Entre las escenas examinadas, esta exige coordinar una distribucion en dos
variables, sus contornos o superficie, un corte exacto y una curva normalizada
univariante, mas transformaciones de formulas y un area de cola. Regiones e
integrales dobles tambien son candidatas complejas; se eligio la normal conjunta
por el cambio de representacion, parametros y escalas que deben ser coherentes.

## Contenido obligatorio, implementacion libre

Parametros: muX=30, muY=70, sigmaX=5, sigmaY=8, rho=0.25; se observa X=40.
Hay que hacer visible que el corte pertenece a la conjunta, no a una marginal.
Mostrar muCond=70+0.25*(8/5)*(40-30)=74, varCond=64*(1-0.25^2)=60,
sdCond=sqrt(60), z=(82-74)/sqrt(60) y P(Y>82 | X=40)=1-Phi(z), cerca de0.151.

Representar geometria conjunta y el corte, transportar/relacionar ese corte con
la curva condicional normalizada, diferenciar marginal y condicional, y sombrear
la cola correcta. Debe haber movimiento matematicamente significativo, no solo
diapositivas con formulas. Los valores de densidad no son probabilidades. Para
un corte conjunto, fXY(40,y)=fX(40)*fYgivenX(y|40); su area es fX(40), no uno.

Cada agente decide composicion, 2D/perspectiva/3D, movimiento, estructura del
codigo, librerias adecuadas y tratamiento de formulas. No se prescribe codigo,
coordenadas, paleta ni una coreografia comun. Deben respetar la narracion y los
cues; los parametros iniciales han de ser visibles al comenzar. Formulas y
subtitulos deben ser legibles, no solaparse ni quedar recortados.

## Independencia

Un agente para Manim y otro para Remotion, mismo brief y recursos congelados.
No consultar, importar, copiar ni comparar escenas, scripts, paginas o informes
de otros ejemplos o del otro participante. Solo el coordinador lee entregas
despues de terminar. Se permiten los recursos comunes y documentacion/codigo de
las bibliotecas instaladas, no fuentes anteriores. Los agentes implementan sus
propias escenas y runners en carpetas exclusivas; no hay aislamiento de sistema
operativo verificable, por lo que se declara esta limitacion.

El coordinador solo empaqueta fuentes, verifica integridad y publica videos
nativos. No homogeneiza la coreografia ni la escena de un participante a partir
del otro. La generacion de Chromium se permite para la exportacion, no para
abrir/revisar la web. Procesos aislados desde el principio evitan SIGINT del
terminal compartido; no se pretende medir tiempo puro de programacion.