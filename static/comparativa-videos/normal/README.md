# Segundo ejemplo: la normal, de X a Z

Dos videos de 48 segundos, 1280x720, 30 fps y 1440 fotogramas. Sin audio nuevo;
las explicaciones estan grabadas en una banda inferior. No sustituyen la primera
comparativa de probabilidad como area.

## Guion compartido

`storyboard.json` contiene las formulas, parametros, seis etapas y una tabla de
eventos con nombres. Ambas escenas parten de X normal con media 10 y sigma 2.
Estandarizar x=12 da z=1; Phi(1)=0.841344746..., y su complemento es 0.158655253...
Los ejes muestran X entre 2 y 18 y Z entre -4 y 4: cuatro desviaciones con los
parametros iniciales. Al ensanchar la curva X queda mas recortada. Los valores
numericos usan la distribucion completa, no una integral del dibujo recortado.

Se muestra el trazado de la densidad, cambio continuo de sigma y anchura,
sustitucion de parametros, simplificacion de una fraccion, dos marcadores
enlazados, acumulacion de area, integral y complemento.

## Implementaciones

- `manim/normal.py`: metodos por etapa, MathTex, TransformMatchingTex,
  TransformFromCopy para transportar la curva, ValueTracker, BraceBetweenPoints
  y areas calculadas por Manim. SciPy proporciona densidad y CDF. El reloj usa
  fotogramas enteros para evitar el redondeo observado en duraciones decimales.
- `remotion/src/normal.jsx`: escena que calcula parametros desde el fotograma y
  los eventos compartidos. `normal-chart.jsx` contiene la geometria SVG y usa
  jStat; `normal-formula.jsx` mide tokens de KaTeX, conserva y desplaza los iguales
  y funde los sustituidos. No realiza morph geometrico de contornos tipograficos.
- Se reutiliza el CSS y las dependencias fijadas del primer paquete Remotion.
  Los auxiliares se publican junto con la escena; su numero de lineas no incluye
  CSS, dependencias ni el renderizador comun. No es un benchmark entre motores.

## Reproducir

Desde la raiz del repositorio, o de la estructura extraida de source.tar.gz:

```sh
npm --prefix data-src/video-comparison/remotion ci
node data-src/video-comparison/normal/render.mjs manim --probe
node data-src/video-comparison/normal/render.mjs remotion --probe
node data-src/video-comparison/normal/render.mjs manim
node data-src/video-comparison/normal/render.mjs remotion
node data-src/video-comparison/normal/publish.mjs
```

Manim usa la imagen Docker fijada por digest del primer ejemplo; no instala
LaTeX o Cairo en el host. Remotion usa su renderer y servidor de bundle nativos.
La exportacion necesita Chromium; todos los procesos se cierran al terminar.
Las caches y PNG de revision viven en `.cache/`, ignorada y excluida del archivo.

## Verificacion y limites

El render y la publicacion exigen que ambos MP4 decodifiquen 1440 fotogramas,
midan 1280x720, tengan 30 fps y duren 48 segundos, sin pista de audio.
Las pruebas comprueban continuidad temporal, conversion a z, CDF real y TeX.
Pasaron tambien las pruebas generales y el build Docusaurus. Las auditorias
cumplen el umbral moderado; quedan cinco avisos bajos en el proyecto raiz y uno
en el KaTeX ya existente del paquete Remotion. No se forzaron actualizaciones.
Se revisaron visualmente las seis etapas exportadas de ambos motores y se
corrigieron los contrastes y solapamientos de Manim antes de publicar.
No se comprobo la nueva pagina en navegador ni en movil; las imagenes revisadas
proceden del render de los videos. No hay nueva narracion ni despliegue publico.

Pagina: `/inferencia/comparativa-videos/normal/`. Video nativo, sin iframe.