# Manim: del plano conjunto a una cola condicional

## Entregables y ejecucion

- `scene.py`: escena independiente Manim Community 0.19.0 / Cairo; formulas MathTex nativas.
- `render.mjs`: CLI Node sin instalaciones, con worker y procesos hijos en grupos separados.
- `.gitignore`: ignora exclusivamente `.cache/` de este participante.
- `static/comparativa-videos/bivariante/manim/video.mp4`: exportacion nativa con AAC comun copiado.
- `static/comparativa-videos/bivariante/manim/poster.jpg`: fotograma del video final, no una ilustracion separada.
- `.cache/`: logs, estado persistente, matematica, geometria, media intermedia y stills de revision; no se publican.

Desde cualquier directorio, sin cambiar el directorio del terminal:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/bivariate/render.mjs --probe
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/bivariate/render.mjs --preview
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/bivariate/render.mjs --render
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/bivariate/render.mjs --verify
```

`--preview` recorre los 22 cues y comprueba encuadre/formulas, pero solo guarda el ultimo PNG en la cache propia. `--render` renderiza, multiplexa por copia, comprueba formato y payload AAC, y genera poster/stills. Si el terminal compartido se interrumpe, el worker continua: `--wait` espera cambios del estado mediante `fs.watch`, sin polling; `--status` consulta su estado. No iniciar una segunda exportacion mientras el worker propio figure como activo. El runner espera el cierre de cada hijo; no inicia servidores ni cancela procesos ajenos.

Imagen Docker fijada:

```text
manimcommunity/manim@sha256:ab5ad56cf685d89da96e5d459e0cde3743fbdf2141be4dcff6c26566b5ca3191
```

`docker run --rm --network none --cpus=1 --memory=2g --user uid:gid`; fuente y recursos comunes son montajes de solo lectura. HOME, TEX_DIR, matplotlib y media viven en la cache propia escribible. Python real verificado: 3.11.11. No se selecciono ni modifico el interprete del editor; se aplico el skill fact-grounded mediante importacion, SciPy, compilacion MathTex y ejecucion real del contenedor, sin afirmar diagnosticos Pylance no disponibles. FFmpeg y FFprobe se resuelven exclusivamente como bibliotecas instaladas mediante `createRequire` del package autorizado, sin consultar su codigo de aplicacion.

## Decisiones visuales autonomas

Composicion 2D enlazada, no una superficie 3D: a la izquierda, contornos exactos de Mahalanobis de la normal conjunta; a la derecha, el perfil del corte y su condicional. La matriz de covarianza se calcula a partir de los parametros comunes y su descomposicion espectral genera los contornos, en coordenadas fisicas X/Y. El corte permanece exactamente en X=40, nunca se presenta como una marginal.

Paleta propia: conjunta turquesa, corte/condicional/cola dorados, recta de esperanza y umbral coral, marginal gris y curva de construccion blanca. Parametros visibles desde el primer frame. Matematica separada de los graficos y subtitulos en una banda inferior sin tarjetas. Formulas, ejes y cifras matematicas se componen con LaTeX/MathTex; texto y subtitulos, con Pango/DejaVu Sans.

Dos puntos enlazados recorren el corte y su perfil para relacionar `(40,y)` con `fXY(40,y)`. La pendiente 0.4 se convierte en una recta de esperanza condicional y un punto se desplaza de (30,70) a (40,74). Al normalizar, la escala de densidad cambia de 0.00065 a 0.06: la curva no gana altura arbitrariamente; su densidad real se divide por fX(40), y el eje cambia con ella. La integral rotulada pasa de fX(40) a uno.

Una curva blanca, expresamente rotulada como construccion, traslada la marginal de centro 70 a 74 y luego reduce su desviacion de 8 a sqrt(60). No se etiqueta como la condicional durante sus estados intermedios: la condicional exacta dorada permanece como objetivo. La guia movil lleva mu, no una cifra falsa durante el movimiento. Tras converger, la curva de construccion desaparece.

El umbral recorre valores altos hasta 82, y la region sombreada se recalcula con su posicion real. La transformacion Y -> Z aparece como un segundo eje afine: z=0 se alinea con Y=74 y z=8/sqrt(60) con Y=82. Al comparar, la marginal gris aparece identificada y su cola se resalta brevemente, sin sustituir a la cola condicional dorada.

## Coordinacion con los 22 cues

| Cue | Intervalo (s) | Representacion o calculo |
| --- | --- | --- |
| 1 | 0-1.6 | Parametros, X=40, recorrido del corte y perfil conjunto |
| 2 | 1.9-3.9 | Formula de la media condicional; continua el recorrido |
| 3 | 4.2-6.7 | Distancia horizontal 40-30=10 |
| 4 | 7-10.7 | Pendiente general y recta de esperanza |
| 5 | 11-13.8 | Pendiente calculada 0.25*(8/5)=0.4 |
| 6 | 14.1-19.1 | Desplazamiento geometrico (30,70) -> (40,74), incremento +4 |
| 7 | 19.4-22.2 | Normalizacion del corte, area 1 y traslado blanco 70 -> 74 |
| 8 | 22.5-25 | Centro 74; la guia se fija en su resultado |
| 9 | 25.3-29.7 | 64*(1-rho^2); estrechamiento real de la curva blanca |
| 10 | 30-31.6 | Varianza 60 y convergencia con la condicional exacta |
| 11 | 31.9-37.3 | Segmento horizontal de longitud sqrt(60); desviacion 7.746 |
| 12 | 37.6-41.4 | Contraste entre formula de varianza y desviacion con raiz |
| 13 | 41.4-45.8 | Umbral movil y cola hasta Y=82 |
| 14 | 46.1-50.2 | N(74,60), densidad condicional normalizada |
| 15 | 50.5-52.4 | Segmento entre 74 y 82 |
| 16 | 52.7-53.9 | Longitud 8 |
| 17 | 54.2-56.4 | Division por sqrt(60); segundo eje Z |
| 18 | 56.7-60.1 | Valor z=1.03279556... y umbral alineado |
| 19 | 60.4-62.6 | Se destaca el corte X=40 y la condicion |
| 20 | 62.9-68.5 | Marginal gris identificada y contraste de colas |
| 21 | 68.8-71.6 | Complemento 1-Phi(8/sqrt(60)); refuerzo del sombreado |
| 22 | 71.9-75.1 | Resultado 0.15084979..., 15.1% |

Cada cue se convierte a frames mediante redondeo a 30 fps; esperas y animaciones se contabilizan como enteros, incluyendo pausas. El ultimo cue acaba en el frame 2253.

## Evidencia matematica ya ejecutada

- Media condicional: 74.0.
- Varianza: 60.0; desviacion: 7.745966692414834.
- z: 1.0327955589886444.
- Cola calculada con `scipy.stats.norm.sf`: 0.1508497912391739.
- `quad` del corte conjunto: 0.010798193302637756.
- Densidad marginal X=40: 0.010798193302637612.
- `quad` de la condicional: 1.000000000000011.
- Identidad fXY(40,y)=fX(40)*fYgivenX(y|40) comprobada sobre 301 valores de y.
- Resultados comunes contrastados con tolerancia absoluta 1e-12; integrales con 1e-10.
- Las 22 formulas y los 22 subtitulos pasan comprobaciones de limites y separacion vertical en la previsualizacion completa.

## Verificacion de exportacion

Exportacion terminada y verificada por el runner propio. Evidencia estructurada: `.cache/state.json`, `.cache/validation.json`, `.cache/ffprobe-native.json`, `.cache/ffprobe-final.json`, `.cache/probe.json` y `.cache/geometry.json`.

- Video nativo y final: H.264, yuv420p, 1280x720, `avg_frame_rate=30/1`, 2253 frames contados con FFprobe y duracion de stream 75.100000 s. No se recortaron, duplicaron o recodificaron frames despues de Manim.
- Contenedor MP4: duracion 75.100000 s, sin padding adicional observado.
- Audio: AAC mono, 48000 Hz, duracion 75.100000 s; se multiplexo con `-c:v copy -c:a copy`, sin regeneracion ni cambios al audio comun.
- SHA-256 del archivo comun: `6b7b201b97d2b0b6fda788888a2a8a9135d7919a6727f9b9aab7a252f76ffc54`.
- SHA-256 de AAC extraido por copia a ADTS, tanto fuente como exportacion: `d17d29a28903589ae241c00871928820f9f1df9d670c7bced954a026d030b87d`. El payload completo es identico, no solamente codec y duracion.
- SHA-256 video.mp4: `3dde4b64be12c375dd7b6a799d81663b4f45f0afd125a118a3265974c402bcd5`.
- SHA-256 poster.jpg: `a544ade1f6cce22046590a56f4a3cf93dc927cf33481106b3fadfb40f479b8d3`.
- Poster: frame del video a 47.2 s, 1280x720; muestra N(74,60), area uno y el umbral Y=82.
- Se generaron 13 stills exclusivamente en `.cache/review/`: 0, 3.1, 15.8, 20.8, 23.5, 28, 33.5, 42.8, 47.2, 55.5, 59, 65.4 y 73.8 s.
- Se inspeccionaron visualmente 12: todos los anteriores excepto 59 s; el de 47.2 s se reviso como poster. Verificados parametros iniciales, perfil conjunto de area 0.01080, normalizacion a uno, traslado/estrechamiento, segmento sqrt(60), movimiento del umbral y su sombreado, eje Z y marginal gris identificada. Sin recortes ni solapamientos incoherentes entre los bloques de texto en esas muestras. Las transiciones MathTex interpolan sus glifos, por lo que un still intermedio no siempre muestra una cifra ya asentada.
- Tiempo medido del proceso de render Docker a calidad final: 143.467359901 s. La ejecucion completa con copia de audio, FFprobe y stills fue de aproximadamente 150.24 s. Estos tiempos NO son tiempo de programacion ni una comparacion de productividad con el otro participante.

El worker y todos sus hijos terminaron; no queda un render propio en segundo plano. El aviso de pydub por falta del ejecutable FFmpeg dentro del contenedor es esperado: Manim codifica el video con PyAV y el audio se copia con el FFmpeg autorizado del host. No se considera evidencia la salida de otros procesos en el terminal compartido.

## Limitaciones y aislamiento

Las curvas se muestrean en 201 puntos y el sombreado en 151, con densidades evaluadas por SciPy. La ventana visible de Y es [48,100], por lo que las colas fuera de esa ventana no se dibujan; las integrales y la probabilidad rotuladas son las completas sobre la recta real, no la suma de pixeles ni una probabilidad truncada. La conjunta muestra seis niveles de Mahalanobis, no todo el plano infinito. No se representa altura 3D, y los ejes de densidad no son ejes de probabilidad.

El skill Python y los tres recursos comunes se leyeron. Se buscaron nombres concretos de instrucciones aplicables; no aparecieron archivos de instrucciones. Se resolvieron exclusivamente FFmpeg/FFprobe instalados desde el package autorizado. No se leyeron escenas, runners, CSS, paginas o informes anteriores o del otro participante. Una llamada al terminal compartido devolvio espontaneamente salida ajena; se descarto y se consulto solamente el estado/log propio. El aislamiento es por rutas, montajes y procesos, no una garantia de aislamiento del sistema operativo.

No se instalaron paquetes, cambiaron dependencias, abrieron navegadores, iniciaron servidores ni usaron subagentes. No se modificaron HEAD, indice, configuracion o refs Git, y no se hicieron commits/push. Toda escritura manual se hizo con apply_patch en las dos rutas autorizadas; archivos multimedia, logs y cache son salidas generadas por este runner.