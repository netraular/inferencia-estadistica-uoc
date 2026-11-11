# Generar audios del curso con Puck o Ming

## Produccion seleccionada: Gemini Puck y Remotion

La voz elegida para las narraciones es **Puck**, con
`gemini-3.8-flash-tts`. El lote incluye 118 apartados, 36 repasos y 387
soluciones de preguntas: 541 piezas y 17.872 frases. El exportador congela los
guiones y sus visuales; cada frase se genera por separado y se mide antes de
ensamblar el audio. No se asignan tiempos estimados a grabaciones reales.

La gestion online se realiza en https://tts.raular.com, desplegada desde
`proxmox-k8s/k8sprjs/tts-queue`: grupos, cola persistente, descarga, borrado y
esperas de cuota. Las seis claves de proyectos Free Tier se obtienen de
Bitwarden en Kubernetes, no desde este checkout. El 11 de noviembre de 2026
se importaron 17.740 frases pendientes en el grupo del curso, excluyendo 132
fragmentos Puck ya verificados. La siguiente ventana conocida empieza el
12 de noviembre a las 08:00 UTC (09:00 peninsular). La publicacion de los
audios de esa cola en el curso todavia es un paso separado.

El proyecto `/home/aquiluer/Scripts/TTS` queda reservado a Ming local. Los
materiales anteriores de Gemini, Remotion y depuracion se conservaron en
`/home/aquiluer/Scripts/TTS-archive/2026-11-11/`, sin borrar grabaciones.
El origen Gemini anterior permanece accesible por un enlace de compatibilidad
para las herramientas de lectura y verificacion:

```bash
SCRIPT=/home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs
BATCH=/home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1
node "$SCRIPT" --status "$BATCH"
```

No ejecutes `--generate` en el generador Gemini anterior ni programes otra
generacion online en WSL: duplicaria el trabajo y competiria por la cuota de
la web. Conserva el catalogo, los audios y sus checkpoints originales.

Cuando existan piezas completas, publicar sus audios compatibles y renderizar
solo los videos disponibles:

```bash
node "$SCRIPT" --publish "$BATCH"
node data-src/course-videos/render-course.mjs --batch "$BATCH" --ready --publish
```

La publicacion rechaza medios incompatibles, guiones cambiados y avances
parciales. El avance local de seis frases en `previews/` usa Puck real y
Remotion, pero **no es una leccion completa** ni se ha publicado. Las pruebas
con audio sintetico de tono tampoco producen material publicable.
Consulta [el flujo Gemini](scripts/tts/README.md) y
[el renderizador Remotion](data-src/course-videos/README.md).

## Verificacion Ming Local

El lote Ming actual se controla con
`inferencia-ming-temporary-20261111.service`. La generacion y reanudacion leen
su propio catalogo congelado y no necesitan acceder al servicio Gemini.

```bash
MING=/home/aquiluer/Scripts/TTS/outputs/ming-temporary-course-2026-11-10-v1
PYTHON=/home/aquiluer/Scripts/TTS/.venv/bin/python
"$PYTHON" scripts/tts/generate-ming-course.py --batch "$MING" --status
```

`--verify` mantiene el hash exacto de los originales y valida los fragmentos
locales. El `progress.json` del origen es mutable: debe conservar version,
catalogo e identificadores conocidos, pero puede avanzar sin invalidar el
lote Ming. No se reescriben la seleccion ni los checkpoints para actualizar
hashes. Ejecuta la auditoria con la generacion pausada o detenida, para no leer
un fragmento entre la escritura del WAV y la de sus metadatos.

## Produccion Temporal En Paralelo

La configuracion historica del 10 de noviembre de 2026 tenia dos trabajos
locales independientes para
las 538 explicaciones que no tienen un conjunto Puck completo. Ambos usan una
copia inmutable de las transcripciones actuales: 116 apartados, 36 repasos y
386 preguntas de ejercicios. No reescriben los textos ni modifican el lote
Gemini, sus 64 fragmentos o los tres conjuntos completos.

- `inferencia-remotion-transcripts-v1.service` exporta los videos sin audio,
  con tiempos estimados y metadatos `transcript`, `estimated`, `temporary` y
  `silent`. Cada pieza conserva el plan por frase para su futura sincronizacion.
- `inferencia-ming-temporary-v1.service` sintetiza con la instalacion local de
  Ming en CUDA. Conserva cada frase y sus tiempos medidos, usando una identidad
  de voz temporal distinta de Puck. No mezcla voces dentro de una explicacion.

Los lotes estan fuera del repositorio:

```bash
VIDEOS=/home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1
MING=/home/aquiluer/Scripts/TTS/outputs/ming-temporary-course-2026-11-10-v1
PYTHON=/home/aquiluer/Scripts/TTS/.venv/bin/python
```

Consultar el progreso y los procesos, desde la raiz del repositorio:

```bash
node data-src/course-videos/render-course.mjs --batch "$VIDEOS" --transcript --status
"$PYTHON" scripts/tts/generate-ming-course.py --batch "$MING" --status
systemctl --user show inferencia-remotion-transcripts-v1.service inferencia-ming-temporary-v1.service \
  --property=Id --property=ActiveState --property=SubState --property=MainPID --property=ExecMainStatus
```

Cada video completo queda en `videos/<id>/` con MP4, poster, metadatos y
`transcript.json`. Cada audio completo queda en `items/<id>/` con WAV, MP3 y
metadatos medidos. Los primeros siete audios Ming se incorporaron a la web
como temporales, conservando las tres grabaciones Puck. Los nuevos resultados
se guardan automaticamente en el lote; su publicacion en la web es explicita:

```bash
node scripts/tts/prepare-ming-course.mjs --batch "$MING"
```

Este publicador valida solo piezas completas, comprueba los guiones actuales
y nunca sustituye un audio Puck existente. Los videos silenciosos no se
publican como videos finales ni se combinan con los MP3 sin sincronizar. Cuando
exista el audio elegido, hay que renderizar de nuevo con sus tiempos medidos;
anadirle una pista al MP4 no ajustaria los revelados de formulas y figuras.

Los pilotos apuntan a varios dias de trabajo, no a una finalizacion inmediata.
El equipo y WSL deben permanecer encendidos. Los servicios sobreviven al cierre
del terminal, pero son transitorios: tras reiniciar WSL hay que volver a
lanzarlos. Un fallo detiene el trabajo sin borrar fragmentos completos. Mientras
la unidad exista, reanudar despues de resolver la causa reutiliza lo valido:

```bash
systemctl --user restart inferencia-ming-temporary-v1.service
systemctl --user restart inferencia-remotion-transcripts-v1.service
```

No reinicies una unidad activa ni borres un lock con propietario vivo. Los
registros estan en `generation.log` y `production.log` de sus respectivos
lotes. Consulta [el respaldo Ming](scripts/tts/README.md) y
[la produccion Remotion](data-src/course-videos/README.md) para los comandos de
arranque tras un reinicio y las comprobaciones tecnicas. No se ha auditado la
pronunciacion mediante escucha.

## Generador Ming Anterior

El generador usa Ming-3.0-tts-0.5B en CUDA para narrar las lecturas del aula.
El codigo esta en `scripts/tts/`; los pesos, el entorno Python y los resultados
se mantienen fuera del repositorio. Generar los audios no los publica en la web.

## Textos nuevos: empezar otro lote

Cada lote guarda una copia del curso en `curso.json`. Al reanudar, el generador
lee esa copia, no los textos actuales del repositorio. Por eso repetir el comando
anterior no incorpora los cambios del curso.

La opcion recomendada tras cambiar los textos es usar otra carpeta de salida.
Conserva el lote anterior para reanudar su guion original; no sobrescribas su copia
del curso con textos nuevos.

La revision de guiones de 2026-11-10 cambia los 118 apartados, los 36 repasos y
las soluciones narradas. Se han eliminado los 118 MP3 publicados y los seis
audios historicos archivados para regenerarlos todos. Los manifiestos de audio
y su procedencia se vaciaron, sin los informes de preparacion anteriores;
la produccion Puck publica incrementalmente solo las piezas completas nuevas.
Los lotes locales fuera del repositorio no se han borrado ni modificado.
El video pregrabado conserva la locucion anterior y no se usa sin una grabacion
compatible. Para producir esta revision hay que preparar otro lote y medir de
nuevo sus fragmentos; no reutilices las marcas temporales antiguas.

## Preparar el entorno local

En esta maquina Ming y sus dependencias ya estan instalados. Ejecuta los bloques
siguientes en el mismo terminal, desde la raiz del repositorio:

```bash
cd /home/aquiluer/Scripts/inferencia-estadistica-uoc
export TTS_PYTHON=/home/aquiluer/Scripts/TTS/.venv/bin/python
export MING_CODE_DIR=/home/aquiluer/Scripts/TTS/Ming-3.0-tts
export MING_MODEL_DIR=/home/aquiluer/Scripts/TTS/models/Ming-3.0-tts-0.5B
export AUDIO_OUTPUT="/home/aquiluer/Scripts/TTS/outputs/inferencia-estadistica-$(date +%Y%m%d-%H%M%S)"
```

Si es un checkout nuevo, instala las dependencias del exportador de lecturas:

```bash
npm ci --ignore-scripts --prefix data-src/inferencia-estadistica
```

Para otra maquina, consulta [la instalacion de Ming](scripts/tts/README.md).
Las rutas anteriores son configuracion local, no requisitos del repositorio.

## Exportar y revisar los guiones

Las lecturas usan un guion hablado propio para las 36 lecciones en
`pages/inferencia/lecture-story.js`, no una lectura literal de los apartados
de la web. Cada ejemplo avanza en intervenciones conectadas; cada dato, formula
o grafico se asocia a la intervencion que lo introduce. La practica resuelta se
incorpora desde `pages/inferencia/animations.js`, usando el mismo guion de
`pages/inferencia/exercise-narration.js` que las soluciones individuales y
conservando los datos del generador. Los 118 apartados usan
`pages/inferencia/lesson-sections.js`. Para cambiar lo que se dice y cuando aparece, modifica esas fuentes,
no los TXT del lote.

Sin audio, los tiempos de frase son estimados. El reproductor puede usar los
tiempos de los fragmentos del audio compatible cuando existan; esto no supone
alineacion palabra por palabra. El movimiento reducido mantiene la aparicion
progresiva de los datos: elimina movimiento, no adelanta las respuestas.

Los botones anterior y siguiente y el texto resaltado siguen frases completas,
no bloques de 26 palabras. Cambiar esos limites no cambia las palabras del guion
ni el texto que se adapta para TTS, pero si las marcas de subtitulos y sus tiempos
estimados. Los metadatos de un lote con los cortes antiguos no son intercambiables
con los actuales: el preparador de medios rechaza esa mezcla. No edites la copia
congelada de un lote ni reinicies su generacion por este ajuste; revisa y realinea
sus marcas antes de publicar, o prepara un lote nuevo con el exportador actual.

Este paso utiliza los textos actuales del repositorio y no usa la GPU:

```bash
"$TTS_PYTHON" scripts/tts/generate-course.py --prepare-only --output "$AUDIO_OUTPUT"
```

Revisa `guion-original.txt` y `guion.txt` en las carpetas de las lecciones.
El segundo adapta cifras y simbolos para leerlos en castellano. El generador
utiliza el contenido preparado en `curso.json`: editar solo los TXT exportados
no cambia el audio. Para corregir contenido, modifica la fuente del aula y vuelve
a preparar en otra salida antes de generar. `--prepare-only` reutiliza una copia
existente; sustituirla exige `--prepare-only --refresh` de forma explicita.

## Probar y generar

Primero puedes generar dos escenas de una leccion para escuchar la voz y revisar
la lectura de numeros y formulas:

```bash
env HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 \
  "$TTS_PYTHON" -u scripts/tts/generate-course.py \
  --output "$AUDIO_OUTPUT" --lesson proporciones --max-scenes 2
```

Para generar todas las lecciones, reutilizando lo que ya se haya completado:

```bash
env HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 \
  "$TTS_PYTHON" -u scripts/tts/generate-course.py --output "$AUDIO_OUTPUT"
```

Ming se carga una sola vez y se usa una referencia de voz sintetica comun.
Ejecuta un solo lote en GPU a la vez. El curso completo puede requerir varias
horas; manten el equipo y WSL encendidos. Revisa una muestra escuchandola antes
de dedicar horas a un lote completo: los controles de senal no validan diccion.

## Progreso, parada y reanudacion

En otro terminal puedes consultar el progreso indicando la misma salida:

```bash
"$TTS_PYTHON" scripts/tts/generate-course.py --status --output "$AUDIO_OUTPUT"
```

Si abres otro terminal, define de nuevo `TTS_PYTHON` y asigna a `AUDIO_OUTPUT`
la ruta exacta del lote existente. No uses otra fecha si quieres reanudarlo.

Para parar una ejecucion en primer plano, pulsa Ctrl+C. Se guardan los fragmentos
completados; el fragmento interrumpido se vuelve a generar. Repite el comando
completo de generacion con la misma salida para continuar. No borres
`fragmentos/`, `curso.json` ni `voz-referencia.wav`.

`--max-scenes` cuenta tambien los fragmentos reutilizados, no solo los nuevos.
`--prepare-only` no actualiza una copia existente. No uses `--prepare-only --refresh`
para reanudar: sustituye la copia del curso y solo admite el mismo modo.
`--refresh` no se puede combinar con `--status`. Con textos nuevos, usa otra salida.

## Ejecucion independiente del terminal

Opcionalmente, despues de preparar la salida y terminar la prueba corta, puedes
iniciar el lote con systemd en lugar del comando de primer plano:

```bash
export TTS_UNIT="tts-inferencia-$(date +%Y%m%d-%H%M%S)"
systemd-run --user --unit="$TTS_UNIT" \
  --property=Type=exec --property="WorkingDirectory=$PWD" \
  --property=Nice=5 --property=KillSignal=SIGINT \
  --property="StandardOutput=append:$AUDIO_OUTPUT/generacion.log" \
  --property=StandardError=inherit --setenv="PATH=$PATH" \
  --setenv="MING_CODE_DIR=$MING_CODE_DIR" --setenv="MING_MODEL_DIR=$MING_MODEL_DIR" \
  --setenv=HF_HUB_OFFLINE=1 --setenv=TRANSFORMERS_OFFLINE=1 \
  "$TTS_PYTHON" -u "$PWD/scripts/tts/generate-course.py" --output "$AUDIO_OUTPUT"
```

Conserva el nombre de la unidad y la ruta de salida. Para consultar o parar ese
lote, sin borrar archivos:

```bash
systemctl --user status --no-pager "$TTS_UNIT.service"
systemctl --user stop "$TTS_UNIT.service"
```

## Archivos resultantes y publicacion

Cada unidad contiene carpetas numeradas por leccion. Dentro hay un `audio.wav`
completo, un `audio.json` con tiempos, un `audio.vtt` con limites reales de escenas,
los guiones y los fragmentos reanudables. Los subtitulos no tienen alineacion
palabra por palabra. `progreso.json` resume el estado del lote.

Los WAV y fragmentos son archivos locales, no deben subirse a Git. La preparacion
de MP3 y su publicacion son pasos separados: consulta
[Published materials and audio](README.md#published-materials-and-audio).

## Audio por seccion: lote independiente

`--sections` prepara las 118 narraciones naturales de apartados de las 36
lecciones, con ID `parentLesson--sectionId`. Cada apartado tiene una escena y
se sintetiza frase a frase para medir sus cues. No convierte ni modifica el
lote global antiguo: conserva su salida, snapshot y fragmentos tal como estan.

Define otra salida y prepara sin GPU:

```bash
export SECTION_AUDIO_OUTPUT="/home/aquiluer/Scripts/TTS/outputs/inferencia-secciones-$(date +%Y%m%d-%H%M%S)"
"$TTS_PYTHON" scripts/tts/generate-course.py --sections --prepare-only \
  --output "$SECTION_AUDIO_OUTPUT"
```

Genera y consulta ese lote indicando siempre `--sections` y la misma salida:

```bash
env HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 \
  "$TTS_PYTHON" -u scripts/tts/generate-course.py --sections \
  --output "$SECTION_AUDIO_OUTPUT"
"$TTS_PYTHON" scripts/tts/generate-course.py --sections --status \
  --output "$SECTION_AUDIO_OUTPUT"
```

Repite el comando de generacion para reanudar. Se lee `curso.json`, no la fuente
viva, y se verifican firmas y checksums de los fragmentos reutilizados. Tambien
`--prepare-only` conserva el snapshot existente. No borres `fuente/`,
`fragmentos/` ni `voz-referencia.wav`. Cambiar de modo sobre la misma salida se
rechaza. Si necesitas reemplazar intencionadamente un snapshot del mismo modo,
solo sobre una salida que no quieras conservar congelada:

```bash
"$TTS_PYTHON" scripts/tts/generate-course.py --sections --prepare-only --refresh \
  --output "$SECTION_AUDIO_OUTPUT"
```

Publica las secciones completas con su preparador especifico:

```bash
node scripts/tts/prepare-sections.mjs --audio-root "$SECTION_AUDIO_OUTPUT" \
  --out static/audio
```

`--audio-root` es obligatorio; `--out` es opcional y por defecto es `static/audio`.
El publicador no modifica ni refresca `curso.json` o `fuente/`. Verifica el modo,
los 118 IDs y los recuentos del lote frente al canon actual. Solo publica
apartados `status: "complete"` con narracion canonica, metadatos coincidentes,
WAV/JSON completos, firmas y checksums de cada cue y escena, y VTT medido.
`audio.json` debe declarar `cue_timing: "measured"`, frames a 44100 Hz coherentes
con la duracion y todas las cues con tiempos globales ordenados dentro de la
escena. No estima cues ni publica MP3 que terminen antes de la escena medida.

En `manifest.json` version 1, cada clave `parentLesson--sectionId` conserva
`title`, `parentLesson`, `parentTitle`, `sectionId`, `sourceSections`, `optional`,
`src: "audio/parentLesson--sectionId.mp3"`, `duration`, `cueTiming: "measured"`
y `scenes`/`cues` completas. En `provenance.json` version 1 se declara
`sectionExporter: "scripts/tts/export-narration.mjs"`; cada apartado lleva
`sourceSignature`, `wavSha256`, `canonicalSha256` (incluida la procedencia
canonica), `mp3Sha256`, `mp3Bytes`, `sourceDuration`, `timing: "measured"` y
`encoding: {codec: "mp3", channels: 1, bitrate: 48000}`. El resumen queda en
`prepare-sections-report.json`, sin rutas privadas.

Una nueva ejecucion puede conservar secciones publicadas validas sin el lote
original ni recodificacion. Publicar despues un lote global con
`scripts/prepare-media.mjs --audio-root /ruta/lote-global` tambien conserva sus
entradas, procedencia y bytes, incluso sin entrada global disponible. Comprueba
ID, metadatos, exportador, firmas, checksum, tamano y timeline medido contra el
canon; una seccion invalida se elimina del manifiesto, de la procedencia y del
disco. Los IDs desconocidos no se conservan. El gate versionado permite solo
los 36 IDs globales y 118 de seccion, y el build no necesita los lotes locales.
El contrato del audio global antiguo con cues estimadas permanece independiente;
las secciones siempre exigen cues medidas.