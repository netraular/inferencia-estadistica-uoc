# Ensayo cronometrado: clip de cinco segundos

Dos agentes del mismo modelo, lanzados juntos. Cada uno implementa exclusivamente
un motor y entrega un MP4 nuevo a partir de brief.json, sin consultar escenas,
scripts ni resultados de otros ejemplos o del otro participante.

El encargo incluye titulo, tres formulas en los intervalos indicados, una barra
30/70, texto final y al menos una transicion visible. 1280x720, 30 fps, 150 frames,
cinco segundos, sin audio. El estilo y las formulas estan fijados en brief.json.

Las dependencias ya estan instaladas. Manim puede usar la imagen Docker fijada y
Remotion el paquete aislado existente, pero ambos escriben codigo nuevo. No se
instalan paquetes ni se modifica el checkout, el indice o las ramas compartidas.
Solo el coordinador publica las entregas y hace commit/push de los incrementos.

Primera accion de cada agente: `node .../five-seconds/clock.mjs start <motor>`.
Debe registrar render-start y render-end alrededor de cada intento de render.
finish verifica el MP4 antes de detener el reloj. El tiempo total comprende
programacion, lectura, preparacion, herramientas, esperas y verificacion.
Total menos render NO es una medida exacta de escritura de codigo.

No hay repeticiones estadisticas; carga del host, caches y latencia de herramientas
pueden influir. Se informa quien entrego primero y cuanto tardo cada tarea, no un
benchmark universal entre tecnologias. La integracion posterior en la web queda
fuera del tiempo de los agentes.