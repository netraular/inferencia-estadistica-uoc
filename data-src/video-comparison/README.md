# Comparativa de cuatro tecnologias

Apartado Docusaurus: `/inferencia/comparativa-videos/`, enlazado desde el menu
Comparativa. Cuatro paginas independientes: actual, manim, remotion y
canvas-commons. Los reproductores estaticos `player.html` se pueden abrir tambien
sin servidor; este nombre evita colisiones con el `index.html` de cada ruta.

## Proceso e independencia

Primero se redacto [BRIEF.md](BRIEF.md), se congelaron audio, texto y tiempos en
el manifiesto comun, se crearon cuatro paginas vacias y se valido esa base.
Despues se encargaron las cuatro implementaciones a cuatro subagentes distintos,
en paralelo. Cada uno recibio exclusivamente su tecnologia y carpeta, el mismo
guion y la prohibicion expresa de consultar/importar/copiar codigo, paginas o
resultados de sus companeros, o la prueba anterior de proporciones.

Solo el coordinador leyo las entregas una vez terminadas. El cuarto participante
entrego la escena Canvas Commons y el probe; el coordinador completo su exportacion,
reproductor e informe usando esa escena, sin copiar otra composicion. La integracion
uniformiza solo el contenedor HTML; conserva los cuatro videos independientes.
Las restricciones no son un aislamiento de sistema operativo verificable, pero
se fijaron rutas de propiedad, prompts separados y prohibiciones explicitas.

## Explicacion comun

Audio original `calculo--franjas`, de 39,5 segundos y diez frases con tiempos
medidos. Todas las versiones muestran probabilidades como areas en el intervalo
[0.4,1.2] y distinguen expresamente tres modelos, cada uno normalizado en [0,2]:

1. Densidad constante 0.5: area 0.40.
2. Otro modelo, densidad t/2: integral y area 0.32.
3. Otro modelo por tramos, alturas 0.25 y 0.75 separadas en t=1: area 0.30.

No se ha cambiado la narracion. El orden conceptual y las condiciones se fijaron
antes de delegar; colores, composicion, codigo y coreografia eran libres.

## Entregas

| Tecnologia | Composicion | Video | Audio |
| --- | --- | ---: | --- |
| Konva + GSAP + MathJax | Escena de pizarra, timeline y vectores matematicos | 0.92 MB | MP3 original, mismos paquetes |
| Manim Community | Escena Python, objetos matematicos y transformaciones | 2.16 MB | MP3 original, mismos paquetes |
| Remotion | Componentes React, secuencias y fotogramas | 0.99 MB | MP3 original, mismos paquetes |
| Canvas Commons | Generadores, senales, Latex y Renderer nativo | 1.17 MB | AAC del mismo MP3 sin editar |

Todos: H.264, 1280x720, 30 fps, 1185 fotogramas, diez subtitulos permanentes.
El peso no es un benchmark: los disenos y ajustes de codificacion son distintos.
La web incluye el informe de organizacion y el codigo descargable de cada version.
Las carpetas contienen dependencias fijadas, comandos de render y comprobaciones.

## Reproduccion

Desde la raiz del repositorio, seguir el REPORT.md de la tecnologia elegida para
renderizarla. Las dependencias se instalan solo en su carpeta. Manim utiliza una
imagen Docker fijada; los otros motores exportan con Chromium aislado.

Los recursos comunes se prepararon antes de los renders con:

```sh
node scripts/prepare-video-comparison.mjs
```

No volver a ejecutar esa preparacion para comparar una captura historica: lee el
manifiesto del curso actual. Los recursos ya versionados son la fuente congelada
que recibieron los cuatro participantes.

Verificar los cuatro MP4 existentes y publicar informes/codigo:

```sh
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD:/course" -w /course manimcommunity/manim:v0.19.0 python data-src/video-comparison/verify.py
node scripts/publish-video-comparison.mjs
node --test tests/video-comparison.test.mjs
npm run build
```

El verificador comun usa PyAV para decodificar todos los fotogramas, verificar
PTS/duracion/resolucion y comparar la senal de audio. Revisa dieciseis fotogramas
por tecnologia, cubriendo todos los cues y cambios de modelo, y guarda resultados
en el JSON publico comun. Las laminas de revision se guardan en `.cache/review`,
ignorada por Git. Las pruebas de cada participante aportan ademas sus comprobaciones
de texto literal, medidas y estructura matematica.

El script de publicacion empaqueta solo fuentes e informes. No incluye node_modules,
browsers, bundles, frames ni caches. Las paginas, posters y videos son recursos
finales intencionados, no capturas temporales de navegador.

## Alcance verificado y limites

Pasaron la validacion focalizada, las pruebas generales del curso, la compilacion
Docusaurus y la auditoria del proyecto raiz. La auditoria mantiene cinco avisos
bajos preexistentes. Se inspecciono el HTML compilado de las cuatro rutas y su
iframe a player.html, ademas de los fotogramas exportados de los tres modelos.

Las correlaciones de audio son mayores que 0.99 para las cuatro versiones; los
paquetes de audio son exactamente iguales en actual, Manim y Remotion. Canvas
Commons recodifica a AAC y conserva la senal con correlacion 0.999993. No confundir
igualdad de la narracion con identidad del contenedor o del codec.

Chromium se uso solo para exportar los videos, conforme al permiso del usuario.
No se han escuchado los audios, abierto la web en navegador, comprobado controles
o compatibilidad movil ni desplegado la rama. MP3 dentro de MP4 puede ser menos
compatible que AAC con algunos reproductores. Todos los subtitulos estan grabados
en la imagen, no son una pista conmutable. Los procesos de exportacion se cerraron.

Rama de entrega: `feature/comparativa-cuatro-videos`; no se cambio ni fusiono la
rama activa del trabajo paralelo. Tampoco se editaron los otros ejercicios o CSS
del curso que estaban en desarrollo.