# Aula de inferencia estadística

## Estado actual

Repositorio independiente publicado en https://webs.raular.com/inferencia/.
La documentación operativa está en el [README principal](../../README.md).
Las instrucciones históricas de alojamiento de este documento ya no se aplican.

Hay 36 lecciones, 118 apartados con audio medido y 521 escenas de lectura global
sin audio publicado. Todos disponen de una figura contextual desde el inicio y
revelaciones ligadas a la frase actual. El banco resuelve 22 problemas de los tres
solucionarios; el tema 5 añade los tres ejercicios completos de la PEC 1,
con 16 preguntas y visualizaciones adicionales. Los ocho PDF son públicos.
La [matriz de revisión](coverage-review.md) detalla cobertura, ejemplos y erratas.

Desde la raíz, ejecuta `npm test`, `npm run build` y `npm run audit:security`.
Tras modificar módulos del aula, ejecuta `node data-src/inferencia-estadistica/version-assets.mjs`.
El versionador propaga las huellas a los imports del reproductor y del tutor,
después al aula y al HTML de la fixture; es idempotente.

## Archivo histórico

Lo que sigue describe la versión anterior integrada en simple-webs y sus
verificaciones de aquella fecha, no el estado ni las comprobaciones actuales.

Página: [aula de inferencia](../../pages/inferencia-estadistica.html).
Contenido y módulos: [pages/inferencia/](../../pages/inferencia/).
Fuentes y correspondencia con los apuntes: [inferencia.SOURCES.md](inferencia.SOURCES.md).

## Alcance

- 36 lecciones: puente matemático y los cuatro temas suministrados, incluidos familia exponencial/GLM, multinomial y normal bivariante.
- Portada de orientación y mapa de las 36 lecciones con sus secciones de procedencia: cuatro temas y un puente opcional, sin inventar un quinto PDF. El orden es pedagógico, no una transcripción del índice.
- 17 laboratorios y un explorador de 16 familias de distribuciones. Cada uno explica propósito, exploración, predicción, interpretación y límites. Multinomial, soporte triangular y normal bivariante tienen cálculos y gráficos propios; los controles conservan el último estado válido ante entradas incompatibles.
- 22 problemas de los tres PDF de ejercicios, con 87 respuestas y soluciones desarrolladas en las lecciones correspondientes. La pestaña Ejercicios muestra los enunciados, datos, supuestos, pasos, resultados e interpretaciones, junto con el tutor animado y la procedencia por archivo, número y página. Las erratas de los solucionarios se explican sin reproducir sus resultados incorrectos.
- Práctica extra con 29 generadores de ejercicios con semillas reproducibles, datos, supuestos, pistas, corrección y resolución desarrollada. El banco completo incluye apoyos adicionales de muestreo, chi-cuadrado, Student y Fisher: no se presentan como temas incluidos en los PDF.
- 36 clases animadas propias: toda la teoría, significados de fórmulas, métodos, ejemplos de la lección, demostraciones y ejercicios resueltos. 1.224 escenas y 4.050 fragmentos de subtítulos; unas 8 a 17 min por clase a velocidad normal estimada, sin reproducción automática ni audio. Pausa, navegación por partes, velocidad, transcripción, descargas y vista ampliada; diapositivas y narración se muestran juntas. La clase se abre integrada en la página, también en móvil. La vista ampliada se activa solo con su botón y se puede cerrar con el mismo control o Escape.
- Glosario de 40 símbolos, búsqueda sin acentos, enlaces directos por fragmento de URL y progreso local compartido entre las vistas. No hay controles de importar, exportar ni borrar progreso.

La corrección admite coma decimal, fracciones simples, notación científica y porcentajes explícitos, sin evaluar código. Una pista o solución consultada antes de acertar distingue la respuesta como asistida. Abrir una lección no la marca como estudiada.

Consultar los problemas resueltos de los PDF no registra intentos ni respuestas asistidas. Los ejercicios multivariantes de U3 corresponden al Tema 4 de teoría. El ejercicio 2.3 incluye curvas continuas de las dos acumuladas, no barras de masas discretas.

Los ejemplos son ficticios, no resultados experimentales ni recomendaciones clínicas. Las gráficas y sus textos señalan colas truncadas, probabilidades indefinidas, frecuencias esperadas y las hipótesis necesarias.

## Pruebas

Desde este directorio:

```sh
npm ci --ignore-scripts
npm test
```

Las dependencias de desarrollo son `linkedom` y `css-tree`; no forman parte de la aplicación publicada. Las 151 pruebas cubren cálculos de referencia, semillas, soportes, respuestas, fórmulas con KaTeX, CSS, recursos locales, todas las vistas, ayudas, progreso y ciclo de vida del reproductor. Se comprueba que ninguna clase omita párrafos, métodos o soluciones, que los subtítulos preserven el texto y tengan tiempos contiguos, y que avancen también con movimiento reducido. El DOM simulado verifica comportamiento, no la presentación real en navegador.

### Verificación pública, 2026-11-05

Se comprobó la publicación en `webs.raular.com` y la aparición del aula en la portada. Los módulos publicados usan `.js`, porque el nginx actual entrega `.mjs` como `application/octet-stream`, que el navegador rechaza. Los scripts de desarrollo mantienen `.mjs`; los dos archivos de metadatos de paquete preservan ESM para las pruebas y CommonJS para las bibliotecas UMD, sin introducir un build.

La entrega de archivos estáticos tiene caché de 120 segundos. Las URLs de entrada y de los módulos incluyen una huella de contenido para no ejecutar una copia anterior tras publicar. Después de editar código, estilos o temario y antes de probar/commitear, ejecuta:

```sh
node version-assets.mjs
npm test
```

El script solo actualiza URLs en dos archivos y es idempotente. Las pruebas rechazan huellas desactualizadas. No se ejecuta en el pod ni necesita un proceso de compilación o una herramienta de bundling.

En navegador se comprobaron fórmulas, fuente local, iconos, gráficos no vacíos y ausencia de errores de carga. Se revisaron capturas y desbordamientos a 1440, 768, 390 y 320 píxeles, menú móvil, corrección de Bayes, pistas, persistencia al recargar y actualización del laboratorio al cambiar la prevalencia. La animación cambió sus píxeles con movimiento normal y respetó la preferencia de movimiento reducido. Las capturas son temporales y no se incluyen en Git.

Se validó el texto generado por la descarga del guion. El navegador integrado no notificó el evento de guardado del archivo; la transferencia a disco no se considera verificada. Las pruebas offline verifican todos los guiones y WebVTT. No se arrancaron servidores locales ni se modificó Kubernetes.

La ampliación autocontenida se comprobó también en producción: portada y mapa, recursos versionados sin errores JavaScript y PDF/PEC/dependencias privadas con 404. La vista ampliada mantiene diapositiva, subtítulos y controles visibles juntos a 1440, 768, 390 y 320 px; se recorrieron las 41 escenas de familia exponencial a 320 px sin desbordamiento de página. Las fórmulas largas usan desplazamiento dentro de su propia zona. Esta comprobación visual no es una auditoría matemática exhaustiva del material.

## Exportar lecturas

```sh
node export-lecturas.mjs
node export-lecturas.mjs --out /ruta/de/salida
```

Por defecto genera en `_work/lecturas/`, excluido de Git:

- Un `.vtt` y un `.txt` por cada una de las 36 lecciones: 72 archivos.
- Un manifiesto `lecturas.json` con procedencia, capítulos, títulos, fórmulas, tiempos de escena y tiempos absolutos de cada fragmento de subtítulo.

El texto de los `.txt` coincide con la narración completa del reproductor; el `.vtt` reparte ese mismo texto en frases completas, sin cortarlas cada 26 palabras. Aula y exportador comparten el constructor de clases y los ejemplos con semilla 1, sin mantener un segundo temario. Los tiempos estiman 2,5 palabras por segundo con pausas; no sincronizan audio inexistente. Para TTS, genera la voz a partir del guion y reajusta escenas y frases con la duración real. Cambiar solo los limites de frase no cambia las palabras narradas, pero requiere revisar sus marcas de tiempo antes de publicar audio anterior. Conserva las fórmulas del manifiesto para las diapositivas; revisa la pronunciación de símbolos y comandos en la herramienta de voz antes de generar el audio final.

## Publicación

No hay build ni backend. Se publica el HTML y su directorio de módulos en `simple-webs`; nginx y git-sync funcionan sin cambios. La portada detecta el HTML y usa su ficha en [webs.json](../../webs.json).

La URL tras integrar en `main` será `https://webs.raular.com/pages/inferencia-estadistica.html`. Los módulos necesitan HTTP, no `file://`. Para una previsualización manual sirve el comando del [README principal](../../README.md).

Los originales docentes de `Inferencia estadística/` permanecen locales e ignorados. No se distribuyen PDF, figuras originales ni respuestas de la PEC vigente.

## Bibliotecas Locales

| Biblioteca | Versión | Uso |
| --- | --- | --- |
| KaTeX | 0.16.25 | Fórmulas |
| jStat | 1.9.6 | PMF, CDF, cuantiles y funciones especiales |
| Lucide | 0.468.0 | Iconos |
| Atkinson Hyperlegible, Fontsource | 5.2.5 | Fuente local en pesos 400 y 700 |

Las licencias están junto a los archivos en [vendor/](../../pages/inferencia/vendor/). No se usan servicios remotos para cargar contenido, corregir ejercicios o guardar progreso.