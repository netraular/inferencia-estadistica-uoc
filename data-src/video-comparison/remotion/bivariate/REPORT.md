# Remotion: del plano al corte

## Decisiones independientes

Composicion 2D a 1280 x 720, 30 fps, 2253 frames (75.1 s). El plano conjunto
permanece a la izquierda y la curva univariante a la derecha. Verde para la
conjunta, rojo para el corte y la condicional, gris para la marginal y ocre para
el transporte y la pendiente. Tipografia y formulas locales de KaTeX; no hay
imagenes externas, escenas importadas, CSS reutilizado ni geometria 3D.

Los contornos se construyen con la factorizacion de la covarianza; el mapa de
densidad, el perfil, todas las curvas y las colas usan PDF/CDF de jStat. El
perfil rojo adosado a X=40 tiene la amplitud visual ampliada y no representa
otros valores de X. Su integral real es fX(40), no uno.

## Coreografia y contrato

- Desde el primer frame: muX=30, muY=70, sigmaX=5, sigmaY=8, rho=0.25, X=40.
- 4.2-19.1 s: distancia 10, pendiente 0.4 y punto que recorre la recta de
  esperanza condicional entre (30,70) y (40,74).
- 19.4-22.5 s: el centro de la curva en construccion se desplaza 70 -> 74.
- 25.3-30 s: varianza 64 -> 60; se estrecha la curva conservando area uno.
  La curva intermedia se identifica como N(m,v), no como condicional terminada.
- 31.9-41.4 s: sqrt(60) y formula general con raiz, con marca de desviacion.
- 41.4-46.1 s: transporte del perfil al grafico de densidad; crecimiento por
  division entre fX(40). La curva de destino tenue conserva la referencia.
  El perfil conjunto integra 0.0107981933; la condicional integra uno.
- 50.5-60.4 s: distancia 82-74=8 y cambio de coordenadas a z=8/sqrt(60).
  Durante la transicion W=(Y-74t)/sqrt(60)^t, con Jacobiano coherente en la
  escala de densidad. La geometria de la cola no cambia; cambian sus unidades.
- 60.4-75.1 s: condicion explicitada, contraste marginal/condicional y
  complemento 1-Phi(z)=0.1508497912, aproximadamente 15.1 por ciento.

Los 22 subtitulos son el texto exacto de los cues, visibles en sus intervalos
originales; los huecos entre cues no se rellenan. Las formulas acompanian los
intervalos sin modificar el script comun.

## Reproduccion

Desde cualquier directorio, sin instalar dependencias:

```bash
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion/bivariate/render.mjs --probe
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion/bivariate/render.mjs --stills
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion/bivariate/render.mjs
```

El launcher inicia siempre un worker Node con detached:true, stdio a archivos
propios y cwd propio, y espera su salida. Solo el worker usa el bundler y
Chromium. Entry, bundle y public vacio son exclusivos de esta entrega. Se pasa
el bundle local como serveUrl al renderer, que administra su servidor interno.
El browser se cierra en finally; no hay servidor HTTP manual ni Playwright.
Los stills de revision y la evidencia persistente quedan en .cache, ignorada
mediante el .gitignore local. Solo video.mp4 y poster.jpg van a la salida static.

El video silencioso H264 se multiplexa con el AAC comun usando -c:v copy y
-c:a copy. Se comparan hashes de paquetes AAC, frames, formato y hashes de los
recursos comunes antes y despues. No se recorta ni recodifica el audio.

## Evidencia

La primera edicion se valido inmediatamente mediante el probe matematico.
El probe de ocho stills verifico fuentes cargadas, ancho de formulas, limites
de viewport y ausencia de solapamientos entre regiones de texto. Se revisaron
visualmente los frames 0, 1140, 1290, 1640 y 2249. El export completo repitio
la auditoria en 28 stills: inicio, los 22 cues y puntos de transicion. Tambien
se revisaron los frames finales 797 y 1650 y el poster. Resultados y metadatos
se registran en .cache/validation.json; .cache/exit.json confirma salida cero.

Resultados finales comprobados:

- Video H264, yuv420p, 1280 x 720, avg_frame_rate=30/1, nb_read_frames=2253,
  duration=75.100000 s. Tamano: 2,853,780 bytes.
- Audio AAC-LC original, mono, 48000 Hz, duration=75.100000 s. Hash SHA256 de
  paquetes AAC identico antes y despues:
  0b09fa60ea15be2c53156cf767049664b80e4492379b527cfa4d6f9f16cfdd46.
- SHA256 del audio fuente sin cambios:
  6b7b201b97d2b0b6fda788888a2a8a9135d7919a6727f9b9aab7a252f76ffc54.
- SHA256 del script comun sin cambios:
  20a9ae9db3f84f0805b549e07e0e864a88cd65ad9cf3f596797933e9ad3040b4.
- SHA256 video.mp4:
  ef4817efdf3c9a49332bd5db6b686264d7ef7f2daf03308913af4c386631a398.
- Poster JPEG, 1280 x 720, frame 2249, 162,910 bytes. SHA256:
  e53449882bbbbeac95c37b57dc0a3dd69835cfa881d4527d3f7b46000f75835c.
- Media 74; varianza 60; sd=7.745966692414834; z=1.0327955589886444;
  cola=0.15084979123917397. Integracion numerica del corte:
  0.010798193302637552; condicional: 0.9999999999999991.
- Cinco transformaciones afines, entre t=0 y t=1, conservan area y cola
  mediante el Jacobiano. Error absoluto de la cola integrada menor que 1e-7.
- renderMedia tardo 76.233 s; solo duracion del render, no tiempo de
  programacion, ni de bundle, stills o multiplexado.
- Worker PID 2494087 finalizo con codigo 0; browserClosed=true. Inspeccion
  posterior con ps: ningun proceso vivo en su grupo exclusivo. No quedan
  servidores propios; no se iniciaron servidores manuales.

## Limites e independencia

El grafico muestra Y entre 48 y 102 y X entre 18 y 46; las integrales y el
resultado numerico usan la distribucion completa, no el recorte visible. Masa
condicional omitida por encima de 102: 0.00015029880372030568; por debajo de
48: 0.00039455649450781394. El rotulo area=1 corresponde a la normal completa.
Las alturas del perfil izquierdo estan ampliadas; las curvas derechas
comparten una escala de densidad cuantitativa.

El montaje de parametros es una homotopia pedagogica, no una secuencia de
observaciones aleatorias. La normalizacion tiene una amplitud intermedia
animada, no debe interpretarse como probabilidad hasta llegar a area uno.
La comprobacion visual usa stills exportados, no reproduccion interactiva ni
escucha independiente del audio. No se afirma tiempo puro de programacion.

Lecturas explicitas: solo BRIEF.md, script.json y audio.m4a comunes, package.json
del runtime Remotion, declaraciones/codigo de bibliotecas instaladas, y fuentes
y evidencia propias. No se consultaron escenas, runners, paginas, CSS ni
informes anteriores ni del otro participante. No se ejecutaron operaciones
Git, no se instalaron paquetes y no se cambiaron recursos comunes. El terminal
compartido devolvio algunas salidas ajenas; se ignoraron y se uso evidencia
persistente propia. No existe aislamiento de sistema operativo demostrable.