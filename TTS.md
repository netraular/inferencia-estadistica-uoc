# Generar audios del curso con Ming

El generador usa Ming-3.0-tts-0.5B en CUDA para narrar las lecturas del aula.
El codigo esta en `scripts/tts/`; los pesos, el entorno Python y los resultados
se mantienen fuera del repositorio. Generar los audios no los publica en la web.

## Textos nuevos: empezar otro lote

Cada lote guarda una copia del curso en `curso.json`. Al reanudar, el generador
lee esa copia, no los textos actuales del repositorio. Por eso repetir el comando
anterior no incorpora los cambios del curso.

La opcion recomendada tras cambiar los textos es usar otra carpeta de salida.
El lote antiguo permanece en `/home/aquiluer/Scripts/TTS/outputs/inferencia-estadistica/`;
su servicio `tts-inferencia-20261106.service` se ha detenido sin borrar resultados.
No lo reinicies para generar los textos nuevos: usa el script de este repositorio.

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

Este paso utiliza los textos actuales del repositorio y no usa la GPU:

```bash
"$TTS_PYTHON" scripts/tts/generate-course.py --prepare-only --output "$AUDIO_OUTPUT"
```

Revisa `guion-original.txt` y `guion.txt` en las carpetas de las lecciones.
El segundo adapta cifras y simbolos para leerlos en castellano. El generador
utiliza el contenido preparado en `curso.json`: editar solo los TXT exportados
no cambia el audio. Para corregir contenido, modifica la fuente del aula y vuelve
a preparar el lote antes de generar.

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
No uses `--prepare-only` al reanudar el mismo lote salvo que quieras actualizar
su copia del curso. Con textos nuevos, es preferible otra carpeta de salida.

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