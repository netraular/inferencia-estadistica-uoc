# Canvas Commons: independent probability animation

Participant four developed the composition independently from the frozen common
brief. No other participant implementation or previous experiment was inspected.
The coordinator completed its full export, native player and final verification
after the participant returned at the probe stage. No composition was copied or
replaced by another engine.

## Technology and organization

Real @canvas-commons/core 0.4.0 and @canvas-commons/2d 0.4.0. `scene.ts` uses
makeScene2D, generator sequencing, signals, native Line/Rect/Txt and Latex nodes.
`project.ts` builds the actual Project/Renderer and a serial PNG CaptureExporter.
The custom exporter transfers the Canvas Commons rendered canvas to the encoder;
it does not compose or animate the scene itself.

`build.mjs` bundles the project with esbuild and local IBM Plex fonts.
`render.mjs` starts only a private loopback render server on port 41744, opens
Chromium for export, serially captures 1185 frames and closes browser/encoder/server
in finally. Dependencies are exact-pinned in package.json and package-lock.json.
`validate.mjs` checks final MP4 metadata and recorded caption layouts.
The coordinator's common `../verify.py` separately decodes every frame and compares
the output audio signal with the source.

## Reproduce

Use Node >=20.19.0 and local dependencies, not global installs:

```sh
npm --prefix data-src/video-comparison/canvas-commons ci --no-audit --no-fund
PLAYWRIGHT_BROWSERS_PATH="$PWD/data-src/video-comparison/canvas-commons/.cache/chromium" node data-src/video-comparison/canvas-commons/node_modules/playwright/cli.js install chromium
npm --prefix data-src/video-comparison/canvas-commons run build
PLAYWRIGHT_BROWSERS_PATH="$PWD/data-src/video-comparison/canvas-commons/.cache/chromium" npm --prefix data-src/video-comparison/canvas-commons run probe
PLAYWRIGHT_BROWSERS_PATH="$PWD/data-src/video-comparison/canvas-commons/.cache/chromium" npm --prefix data-src/video-comparison/canvas-commons run render
npm --prefix data-src/video-comparison/canvas-commons run check
```

Run from the repository root. Rendering needs only the shared frozen assets and
this implementation's dependencies; it never reads another participant's source.
Local package versions: TypeScript 5.8.3, esbuild 0.25.5, Playwright 1.65.0,
@fontsource/ibm-plex-sans 5.3.0 and ffmpeg-static 5.3.0.

## Effort and checks

Work included probing the actual Canvas Commons Project/Renderer exporter API,
font and formula layout, a short export, then the full film. The full render
reported success, 1185 captures, all ten measured captions and 27 formulas.
Four engine warnings concerned empty MathJax paths for spaces; they did not abort
rendering. The MP4 is H.264/yuv420p, 1280x720 at 30fps. Detailed common metadata,
caption presence and audio correlation are in VALIDATION.json.

The three models are explicit and their respective probabilities are 0.4, 0.32
and 0.30. Formulas/axes remain above a fixed subtitle region and measured caption
lines are at most 1120 pixels wide, with a maximum of two lines.

## Limitations

Audio is AAC re-encoded from the same unedited frozen MP3, unlike the other
participants' MP3 packet-preserving mux. Its signal correspondence is checked by
the common verifier; encoded packets are not expected to be identical. Captions
are burned into the video. Export used Chromium, but website playback/mobile
layout/browser compatibility and listening were not tested. No deployment.

Source dependencies, browser caches, build output, probe files and temporary
render evidence are ignored. No owned browser/server remains after the export.