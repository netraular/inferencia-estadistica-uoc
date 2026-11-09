# Independent video comparison brief

All four implementations receive this brief before development. Implement from
scratch within your assigned directory. Do not inspect, import, copy or compare
another participant's code, page, output or report. Do not inspect the previous
experiments/manim-proporciones example. The coordinator integrates the results
after all participants finish.

## Deliverable

A real 1280 x 720, 30 fps MP4 explaining probability as area under a density.
Use the frozen narration and all ten measured captions in
static/comparativa-videos/shared/script.json. The source audio is shared/audio.mp3
and must not be synthesized again, edited, accelerated or replaced. Duration:
39.5 seconds, with at most 150 ms of codec padding. Render all 1185 frames.

Each participant owns only data-src/video-comparison/TECHNOLOGY/ and
static/comparativa-videos/TECHNOLOGY/, plus its one pre-created JSX route in
src/pages/comparativa-videos/. Replace the placeholder static index.html with a
clean native HTML5 video player referencing video.mp4 and poster.jpg. No CDN,
autoplay, remote assets, marketing, cards around the main video or dependency
changes at the repository root. The rendered clip has permanent subtitles, at
most two readable lines, in a stable bottom band, clear of formulas and axes.
The native player provides play/pause, seek, volume and fullscreen. Use playsinline.

Write source code, a reproducible render command, pinned dependencies and their
lockfile where applicable, and a concise REPORT.md: technology and versions,
organization, implementation effort, known limitations, checks actually run.
Use the real assigned technology to compose frames, not a hand-written substitute.
Keep source, render dependencies and intermediate artifacts in your assigned
data-src directory; keep static assets limited to the final player and its media.
Ignore node_modules, temporary frames, caches and intermediate movies.

## Explanation script

The narration is already recorded; script.json is the authority for caption
boundaries. Do not rewrite it. The following storyboard fixes concepts and
timing, but not layout, colors, animation style, camera moves or source structure.

| Start | Narration concept | Required visual |
| --- | --- | --- |
| 0.0 | Time from 0 to 2 minutes, density 0.5 per minute | Axes with units, support [0,2], flat density f(t)=0.5; whole area is 1. |
| 4.7 | Probability from 0.4 to 1.2 | Mark both limits and distinguish this interval from the whole support. |
| 8.8 | Subtract limits for width | Show 1.2 - 0.4 = 0.8 minutes, visually linked to the interval. |
| 11.9 | Height times width | Show height 0.5 and width 0.8; build the selected area. |
| 15.9 | Shaded strip has probability 0.4 | State P(0.4 <= T <= 1.2)=0.4, not density equals probability. |
| 19.4 | Time and inverse-time units cancel | Demonstrate (1/min) x min -> dimensionless probability. |
| 22.8 | If height changes, narrower strips | Switch explicitly to ANOTHER MODEL, f(t)=t/2 on [0,2], and subdivide [0.4,1.2]. The previous 0.4 is not this model's result. |
| 26.3 | Integral accumulates strips; dt is the variable | Show integral from 0.4 to 1.2 of (t/2) dt = 0.32, with progressive area accumulation. |
| 32.0 | Split integrals at a rule boundary | Switch explicitly to a THIRD MODEL: f(t)=0.25 for 0<=t<1, f(t)=0.75 for 1<=t<=2. Mark the boundary at 1; split the requested interval there. |
| 36.7 | Do not apply one rule outside its piece | Show 0.25(1-0.4)+0.75(1.2-1)=0.30 and distinguish the two pieces. |

All three densities are zero outside [0,2] and integrate to one. The changing
models are illustrative, not a claim that one probability changes without its
density changing. Display a clear "Otro modelo" or equivalent educational label
at each model transition. Do not add another voice or change the common audio.

## Isolation and execution rules

- Do not read siblings under data-src/video-comparison/ or static/comparativa-videos/.
- Shared brief, frozen shared assets and your assigned route are allowed.
- Read root package.json/configuration only for integration, never edit them.
- The current-technology participant may inspect the original classroom engine;
  the other participants must not inspect that animation implementation.
- Do not commit, push, create branches/worktrees, alter Git index, or edit shared files.
- Commands must use absolute paths and explicit per-process cwd, not change the
  shared terminal cwd. Never kill terminals/servers owned by another participant.
- The user authorizes Chromium only to export these videos. No website browser
  verification, screenshots of the app or production browsing. A private temporary
  server is allowed if your render needs one; bind to loopback and a unique port,
  close it in finally/trap and remove disposable frames/probes after validation.
- Limit render concurrency to one worker and avoid excessive memory usage.
- Do not change system Python or install global/system packages. Use project-local
  dependencies or isolated Docker. No sudo, privilege escalation or secrets.
- Validate a narrow first probe immediately, then the full render. Report actual
  metadata and sampled frames. Do not claim listening/browser checks not performed.

## Assigned implementations

1. actual: Konva + GSAP + MathJax, the technology of the current classroom.
2. manim: Manim Community, Python mathematical scene engine.
3. remotion: Remotion with React, frame-based composition and real audio.
4. canvas-commons: Canvas Commons TypeScript/generator scenes, not the original
   Motion Canvas package or a custom Canvas stand-in.