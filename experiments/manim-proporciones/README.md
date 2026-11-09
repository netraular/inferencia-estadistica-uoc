# Comparativa de animaciones: pizarra web y Manim

Investigacion y prueba realizadas el 2026-11-09. Este experimento no cambia el
reproductor, las lecciones, el audio ni las dependencias del curso.

## Ver el ejemplo

Abrir [index.html](index.html) directamente en un navegador, sin servidor. El
video tiene 45,4 segundos, 1280 x 720 pixeles y 30 fps. Tambien estan disponibles
[artifacts/proporciones.mp4](artifacts/proporciones.mp4) y
[artifacts/contact-sheet.jpg](artifacts/contact-sheet.jpg).

Comparar con la seccion **Comparar semillas, no solo recuentos** de la
[leccion actual de proporciones](https://webs.raular.com/inferencia/lecciones/proporciones/).
La version publicada puede diferir del reproductor local en desarrollo.

Se reutilizan el MP3 original, sus 14 subtitulos medidos y las mismas cantidades:
18 de 72 semillas frente a 30 de 200. La voz no se ha generado de nuevo.
La nueva coreografia muestra primero los recuentos, despues las semillas y sus
denominadores, la fraccion, el cociente y finalmente barras de igual escala.
Cada punto de las bandejas representa exactamente una semilla.

## Tecnologia actual

No son videos prerenderizados. Son escenas dibujadas en el navegador:

| Responsabilidad | Tecnologia |
| --- | --- |
| Aplicacion y componentes | Docusaurus 3 + React 19; aula embebida con Shadow DOM |
| Pizarra | Konva 10, sobre Canvas 2D |
| Interpolacion de animaciones | GSAP 3, con una timeline pausada que se posiciona desde el reproductor |
| Formulas | MathJax 3 convierte TeX en vectores SVG; la pizarra los dibuja como formas Konva |
| Narracion | MP3 pregenerados; el reloj del audio gobierna la posicion |
| Subtitulos | Cues del manifiesto de audio y exportacion WebVTT |

El codigo que decide el dibujo esta en
[../../src/classroom/whiteboard.mjs](../../src/classroom/whiteboard.mjs).
La reproduccion y sincronizacion estan en
[../../pages/inferencia/animations.js](../../pages/inferencia/animations.js),
y el contenido declarativo de esta seccion en
[../../pages/inferencia/lesson-sections.js](../../pages/inferencia/lesson-sections.js).
Las versiones de las librerias estan fijadas en
[../../package.json](../../package.json).

Importante: algunos ejercicios usan Web Speech del navegador si no tienen una
pista MP3 compatible. Eso no equivale a disponer de narracion pregenerada para
todos los ejercicios. Este ejemplo si utiliza un MP3 con tiempos medidos.

## Alternativas investigadas

| Opcion | Encaje | Coste o limitacion |
| --- | --- | --- |
| Mantener Konva + GSAP | Interactividad, cambios de datos y ejercicios generados al instante. Aprovecha todo lo existente. | Hay que implementar geometria, composicion y transformaciones matematicas en el motor propio. |
| Manim Community | Animacion matematica: formulas, ejes, funciones, regiones y transformaciones. Python y API especifica del dominio. | Python, Cairo/Pango y LaTeX; render previo. Cada variante produce otro archivo. |
| Remotion | Videos con componentes React, CSS, datos, audio y subtitulos; buena continuidad con Docusaurus. | La coreografia matematica no viene resuelta como en Manim. Render basado en navegador y licencia especial. |
| Motion Canvas / Canvas Commons | TypeScript, generadores y editor de previsualizacion; orientado a animaciones vectoriales sincronizadas con voz. | Revisar mantenimiento y escoger conscientemente el proyecto original o el fork. Menor comunidad del fork. |

Popularidad observada directamente en la API de GitHub, a fecha de la prueba:

| Repositorio | Estrellas | Ultimo push observado |
| --- | ---: | --- |
| remotion-dev/remotion | 71.866 | 2026-11-09 |
| ManimCommunity/manim | 42.357 | 2026-11-05 |
| motion-canvas/motion-canvas | 19.735 | 2026-07-02 |
| canvas-commons/canvas-commons | 298 | 2026-11-01 |

Son indicadores de interes y actividad, no usuarios activos ni una medida de
calidad pedagogica. No constituyen un ranking de adecuacion para este curso.
El repositorio original de Motion Canvas no estaba archivado. Una fuente
secundaria afirma que dejo de mantenerse; el README oficial de Canvas Commons
confirma que es un fork comunitario, pero no basta para declarar abandonado el
original. Antes de adoptarlo conviene revisar sus releases e incidencias.

Manim Community y Canvas Commons tienen licencia MIT. Remotion permite el uso
gratuito a individuos, equipos de hasta tres personas, entidades sin fines de
lucro y evaluaciones no comerciales, segun su FAQ actual. Otros usos requieren
revisar sus condiciones; no es equivalente a una licencia MIT.

## Organizacion y facilidad de implementacion

La implementacion actual separa contenido declarativo y motor generico: una
leccion describe lo que se dice y se muestra; el motor elige la representacion.
Esto es eficiente para muchas lecciones y ejercicios de estructura parecida.

El experimento separa exportacion, coreografia, render y verificacion:

| Archivo | Responsabilidad |
| --- | --- |
| [prepare.mjs](prepare.mjs) | Extrae tiempos reales y subtitulos; fija el SHA-256 del MP3 y comprueba que el guion esperado sigue vigente. |
| [artifacts/story.json](artifacts/story.json) | Datos y puntos de sincronizacion exportados, sin estimar tiempos de lectura. |
| [scene.py](scene.py) | Objetos matematicos y secuencia de animaciones; `at()` espera a hitos de la narracion. |
| [render.sh](render.sh) | Render reproducible con Docker; el audio del curso se monta solo para lectura. |
| [verify.py](verify.py) | Verifica el MP4, correlaciona la narracion y genera poster, fotogramas e informe. |
| [index.html](index.html) | Reproductor HTML5 local, sin dependencias de JavaScript ni servidor. |

Por ejemplo, pasar de una fraccion a su cociente conserva los terminos comunes:

```python
equation_a = formula((r"p_A", "=", r"\frac{18}{72}"), (-3.5, -0.85, 0))
decimal_a = formula((r"p_A", "=", r"\frac{18}{72}", "=", r"0{,}25"), (-3.5, -0.85, 0))
self.at("decimal_a", TransformMatchingTex(equation_a, decimal_a))
```

Manim ahorra implementar primitivas y transformaciones matematicas, pero sigue
siendo necesario disenar la secuencia, los espacios, los colores y los tiempos.
El prototipo necesito corregir una ruta de audio dentro de Docker y el orden de
capas de subtitulos reemplazados. El coste inicial de herramientas es mayor que
continuar en el motor web ya instalado. La coreografia es deliberadamente
especifica de esta seccion; no es todavia un generador de todo el curso.

No seria una comparacion justa enfrentar el numero de lineas de este unico clip
al del motor actual, que resuelve muchas lecciones y ejercicios. Tampoco se ha
hecho un benchmark entre motores. Buena parte de la mejora visual procede del
diseno de la explicacion, y podria implementarse tambien con Konva y GSAP.

## Reproducir y verificar

Requisitos del anfitrion: Node.js, Docker accesible por el usuario y conexion
para la primera descarga de la imagen. No hace falta instalar LaTeX ni FFmpeg
en el sistema, ni modificar su Python.

Desde la raiz del repositorio:

```bash
bash experiments/manim-proporciones/render.sh
```

Se ha probado y fijado `manimcommunity/manim:v0.19.0`. La documentacion oficial
consultada anuncia 0.22.1; este ejemplo no se ha validado con esa version.
Los renders completos tardaron aproximadamente un minuto en este equipo tras
la descarga inicial; es una observacion local, no una comparacion de rendimiento.
El render usa Cairo, no navegador. PyAV decodifica el MP3 sin un ejecutable FFmpeg.
Los archivos intermedios quedan ignorados por Git.

Resultado comprobado en
[artifacts/verification.json](artifacts/verification.json): 1.362 fotogramas,
video H.264, audio AAC, contenedor de 45,44 segundos, unos 1,79 MB, 14 cues
medidos y correlacion de audio de 0,993183 tras compensar aproximadamente 21 ms
de retardo del codificador. Se decodifica todo el video, se comprueban cambios de
escena y de subtitulos, y se inspeccionan fotogramas a 2, 12, 25 y 35 segundos.

Se han revisado los fotogramas generados, pero no se ha abierto un navegador ni
escuchado el audio. El reproductor HTML se ha comprobado estructuralmente, no
con pruebas de interaccion o capturas de navegador. No se ha desplegado la prueba.

Los subtitulos estan grabados en la imagen y no se pueden desactivar en este
MP4. [artifacts/subtitles.vtt](artifacts/subtitles.vtt) conserva una version
independiente para una futura integracion con pistas conmutables. El video se
escala como un bloque 16:9: no recompone textos y diagramas para cada pantalla
como puede hacerlo una pizarra interactiva.

## Recomendacion

Mantener el motor actual para ejercicios variables e interactividad. Probar
Manim en lecciones donde transformar visualmente una formula, una region o una
distribucion aporte valor; integrar sus MP4 con un reproductor HTML5 si el
resultado convence. Si la prioridad es conservar un unico ecosistema React y
producir videos de forma automatizada, evaluar Remotion como segunda opcion.
No migrar todo el curso solo por popularidad ni por este unico ejemplo sencillo.

## Fuentes

- [Manim Community: proposito y diferencias respecto a 3Blue1Brown](https://github.com/ManimCommunity/manim).
- [Manim: documentacion e instalacion con Docker](https://docs.manim.community/en/stable/installation/docker.html).
- [Remotion: proyecto React y documentacion](https://github.com/remotion-dev/remotion).
- [Remotion: FAQ oficial de licencias](https://www.remotion.dev/docs/license/faq).
- [Canvas Commons: proposito, TypeScript y licencia](https://github.com/canvas-commons/canvas-commons).
- [Motion Canvas a Canvas Commons: experiencia de migracion y aviso de mantenimiento, fuente secundaria](https://slama.dev/motion-canvas/introduction).
- [API GitHub: Manim](https://api.github.com/repos/ManimCommunity/manim), [Remotion](https://api.github.com/repos/remotion-dev/remotion), [Motion Canvas](https://api.github.com/repos/motion-canvas/motion-canvas), [Canvas Commons](https://api.github.com/repos/canvas-commons/canvas-commons).