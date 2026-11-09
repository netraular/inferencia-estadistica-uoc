# Resultado del ensayo de dos agentes

Ambos agentes empezaron con una diferencia de 0.321 segundos y entregaron un
clip nuevo, silencioso, de cinco segundos: 150 frames, 1280x720 y 30 fps.
El coordinador volvio a verificar los MP4 y las medidas del reloj compartido.

| Medida | Manim | Remotion |
| --- | ---: | ---: |
| Tarea completa hasta MP4 verificado | 597.514 s | 714.321 s |
| Preparacion y comprobaciones, excluyendo intervalos de render | 586.689 s | 246.926 s |
| Intervalos de render acumulados | 10.825 s | 467.395 s |
| Ultimo render satisfactorio | 10.825 s | 58.136 s |
| Intentos de render | 1 | 2 |

Manim entrego primero a las 13:56:56.376 UTC; Remotion a las 13:58:52.862 UTC.
Diferencia de entrega: 116.486 segundos.

## Incidencia y limites

Una interrupcion externa en el terminal compartido afecto al primer render de
Remotion. Ese intervalo de 409.259 segundos incluye el tiempo hasta detectar y
cerrar el intento interrumpido. El agente aislo su proceso para repetirlo.
Manim tambien registro una interrupcion de preflight y dos comprobaciones de API
fallidas dentro de su tiempo de preparacion, no de render.

Los tiempos son observados y no se han corregido o descontado a posteriori.
Total menos render incluye lectura, escritura, espera, herramientas y checks:
no equivale a tiempo exacto de programacion. La prueba NO permite atribuir el
orden de entrega al motor, ni concluir cual requiere menos tiempo de programar.
Solo se midio una tarea por motor, con dependencias instaladas, caches propias
nuevas y carga/terminal concurrentes. La publicacion y el build del coordinador
estan fuera de esos relojes.

Los registros originales se conservan en cada carpeta five-seconds/timing.json.
No se modificaron las escenas de los agentes despues de marcar finish.