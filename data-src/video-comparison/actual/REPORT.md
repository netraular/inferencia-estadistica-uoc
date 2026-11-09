# Actual: probability as area

## Implementation

Independent composition using real Konva 10.9.1, GSAP 3.15.1 and MathJax 3.2.1.
No participant output or previous experiment was consulted. Only the frozen
brief/script/audio, original classroom vector-math primitives, root dependency
versions and existing Atkinson 400/700 font assets were used.

The three densities have explicit model labels. A fixed coordinate system keeps
the time axis, density axis and caption band stable. GSAP's paused timeline is
advanced exactly once for each frame; Konva renders every visible path, shape
and caption. MathJax creates formula SVG hierarchies converted to Konva Groups,
Paths and Rects, preserving transforms. No second composition engine is used.

All ten Spanish captions are copied verbatim from the frozen measured cues.
Each cue starts at its measured boundary. The previous caption remains visible
during the short inter-cue silences, ensuring permanent captions without moving
the bottom band. Atkinson is loaded before measuring text. Captions use 30px
type, at most two lines, within y=604..720. Equations and axes stay above it.

The audio is not synthesized, accelerated, trimmed or re-encoded. FFmpeg remuxes
the original MP3 packets into MP4. The validator compares all audio packet
SHA-256 values in order, as well as the frozen source file SHA-256.

## Organization

- `scene.mjs`: fresh graph choreography and actual GSAP timeline.
- `formulas.mjs`, `math-vectors.mjs`, `vector-konva.mjs`: mathematical content,
  MathJax conversion and the suitable classroom vector-math primitive.
- `render.mjs`: one Chromium page, one encoder, private 127.0.0.1:41741 server,
  deterministic frame export, poster and metadata.
- `probe.mjs`: first narrow one-second render/export check.
- `validate.mjs`: metadata, unchanged audio, numerical and decoded-pixel checks.
- `cleanup.mjs`: remove disposable probes/frames; confirm the render port closed.
- `worker.mjs`: optional isolated terminal worker used during concurrent work.
- `package.json`, `package-lock.json`: locally pinned rendering dependencies.
- `CHECKS.json`: machine-readable successful final verification evidence.
- `../../../static/comparativa-videos/actual/`: native player, MP4 and poster only.

`node_modules/` and `.cache/` are ignored by this folder's `.gitignore`.
The render server is closed in `finally`; only its encoder can be terminated on
failure. No Git/index/branch operations, root dependency edits, website browser
verification or production browsing are part of this implementation.

## Reproduce

Run these commands from any directory; none changes the terminal working directory:

```sh
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual ci --no-audit --no-fund
PLAYWRIGHT_BROWSERS_PATH=/home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/.cache/browsers node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/node_modules/playwright/cli.js install chromium
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/probe.mjs
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/render.mjs --probe
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/render.mjs
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/validate.mjs
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/actual/cleanup.mjs
```

Review the decoded PNGs in `.cache/` before the last command removes them.
The optional persistent worker initially installs dependencies and runs the
first probe. It then accepts `scene-probe`, `render`, `validate`, `probe`, `stop`.
It must be stopped explicitly after use. Direct commands above need no worker.

## Effort And Checks

Successful final export: 1280x720, 30/1 fps, exactly 1185 decoded frames,
39.500000 s video and 39.525000 s container (25 ms codec padding). H.264 High,
yuv420p, MP4 fast-start; video 916746 bytes; poster 89712 bytes.
The MP3 audio is mono 44100 Hz. All 1514 original encoded audio packets match
the MP4's packets exactly and in order. Source SHA-256:
`7dd0ce2c126d42cabc42f260c205b448e7cfd4ac0039b550176cb9e5d5cb32f5`.

Toolchain: Konva 10.9.1, GSAP 3.15.1, MathJax 3.2.1, Playwright 1.56.1 /
Chromium 141.0.7390.37 (build 1194), esbuild 0.25.0, ffmpeg-static 5.2.0
(FFmpeg 6.0-static), ffprobe-static 3.1.0 (FFprobe 4.0.2-static).

All ten decoded-frame comparisons passed: whole-frame mean absolute RGB error
1.627..1.739 / 255; caption-band error 1.872..2.049 / 255. All captions had
2702..6060 near-white decoded text pixels; graphs were nonblank. No render page
errors or external requests occurred. Model integrals normalized to one and
the requested probabilities matched 0.4, 0.32 and 0.30 within 1e-12.

Decoded MP4 frames at 17.5, 20.9667, 30.6 and 38.1 seconds were visually
inspected, confirming all three results, unit cancellation and readable
captions. The generated poster was also inspected. The exact successful render
and validation commands are the four direct `node` commands for `render.mjs
--probe`, `render.mjs`, `validate.mjs` and `cleanup.mjs` in Reproduce above.

One implementation agent; staged work comprised bootstrap/probe, choreography
and export, then verification. One observed defect in the first probe (flattened
formula transforms) was repaired and the same probe rerun successfully before
the full composition. A final-scene 30-frame probe verified all ten caption
layouts before the 1185-frame export. Elapsed effort was not instrumented.

Final numeric evidence and exact tool versions are in `CHECKS.json`. The checks
include all ten cue texts/boundaries and measured caption bounds, normalization
of all three densities, probabilities 0.4 / 0.32 / 0.30, video frame count/rate,
source audio hash and packet identity, native HTML player structure, ten decoded
video samples compared with their Konva source images and an additional decoded
frame at 30.6 seconds for the increasing model's result. Visual inspection is of
exported/decoded images only, not of a browser playing the website.

Exact delivered file paths, relative to the repository root:

```text
data-src/video-comparison/actual/.gitignore
data-src/video-comparison/actual/package.json
data-src/video-comparison/actual/package-lock.json
data-src/video-comparison/actual/formulas.mjs
data-src/video-comparison/actual/math-vectors.mjs
data-src/video-comparison/actual/vector-konva.mjs
data-src/video-comparison/actual/scene.mjs
data-src/video-comparison/actual/probe.mjs
data-src/video-comparison/actual/render.mjs
data-src/video-comparison/actual/validate.mjs
data-src/video-comparison/actual/cleanup.mjs
data-src/video-comparison/actual/worker.mjs
data-src/video-comparison/actual/REPORT.md
data-src/video-comparison/actual/CHECKS.json
static/comparativa-videos/actual/player.html
static/comparativa-videos/actual/video.mp4
static/comparativa-videos/actual/poster.jpg
```

No JSX route or shared/root file was changed. Disposable frame/probe files are
removed after inspection; installed dependencies/browser caches remain ignored
inside this owned source folder. Cleanup confirms the private render port is
closed. The isolated terminal worker is explicitly stopped after validation.

## Limitations

- Original MP3-in-MP4 audio is retained instead of AAC transcoding. Legacy
  players may support this less broadly; cross-browser playback was not tested.
- Audio was not listened to; its identity is verified cryptographically.
- Native HTML controls/responsive constraints were inspected structurally, not
  browser-verified, in accordance with the rendering-only browser permission.
- Source narration and course font files are read-only existing prerequisites.
- H.264 is lossy; decoded image comparisons use bounded mean pixel error, not
  bit-exact equality. The source text and encoded audio packet checks are exact.
- No integration, deployment or comparison with colleagues was performed.