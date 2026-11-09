# Remotion: five-second complement clip

Fresh React/Remotion composition, using only the shared brief and installed
libraries. KaTeX renders the three formulas and footer. The composition waits
for local KaTeX fonts before capture. No previous scenes, peer sources or styles
are imported. The green/coral bar stays precisely 30/70; a growing coral
underline emphasizes the complement. Formula scale settles over 12 frames at
each phase boundary. The title and sum remain visible throughout.

## Reproduction

From any working directory, with the supplied dependencies and cached Chromium:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion/five-seconds/render.mjs --check
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion/five-seconds/render.mjs
```

The shared clock must already have an unfinished `start remotion` record for
the export command. It records a paired interval around cache creation,
bundling, browser launch, composition/font setup, rendering/encoding and browser
closure, including failed attempts. After delivery has been finished, use a
new coordinator-approved measurement location rather than overwriting timing.

Outputs: `static/comparativa-videos/cinco-segundos/remotion/video.mp4` and
`poster.jpg` (extracted at second 4). Source-owned `.cache/bundle` is rebuilt
without bundler caching on every export. The renderer manages temporary servers;
the owned browser is explicitly closed in `finally`. Concurrency is 1.

The first export was interrupted by a Ctrl+C arriving through the concurrently
shared terminal. It left no completed MP4 or attempt result. Its render-end
was subsequently recorded with the shared recorder, without resetting start
or editing timing data. Consequently that failed interval includes the delay
until the interruption was identified and closed, not just active rendering.
The runner now launches its export worker in an isolated process group and
waits for it, so unrelated terminal interrupts do not stop the export worker.
The second attempt starts with a fresh source-owned bundle cache.

## Checks and limits

The cheap check parses JSX with the bundler's installed esbuild, checks actual
Remotion exports and KaTeX parsing, and verifies the frame contract. The export
checks selected composition dimensions and rate, then independently uses
ffprobe to check 150 decoded frames, 1280x720, 30/1 fps, exactly 5 seconds and no
audio. Four decoded-frame hashes at frames 0, 30, 90 and 102 must differ,
covering the three phases and the settling transition. Detailed metadata lives
in `.cache/validation.json`; attempt outcome in `render-attempt.json`.

Delivery checks passed: JSX/API/KaTeX check, selected composition contract,
decoded MP4 metadata and all four distinct frame hashes. The intended JPEG
poster was visually inspected: final formula, title, exact 30/70 split and
footer are legible with no clipping or overlap. There were two render attempts:
one externally interrupted, then one successful after process isolation.

The coordinator's final `clock.mjs finish remotion` performs its own MP4
validation and writes authoritative measurements to `timing.json`. No times
are hand-edited. Total minus rendering includes reading, coding, preparation,
tool latency and checks; it is not pure typing time. Concurrent host load and
existing runtime/browser caches limit comparisons. No website browser review,
integration, dependencies, git operations or broad test suite are involved.