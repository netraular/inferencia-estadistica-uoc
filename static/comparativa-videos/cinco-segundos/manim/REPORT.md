# Manim five-second delivery

Fresh implementation using native Manim 0.19.0 Text, MathTex, Rectangle,
VGroup and method animations. No earlier example or peer source was consulted.

## Files and reproduction

- [scene.py](scene.py): reads the shared brief inside the container.
- [render.mjs](render.mjs): absolute-path orchestration, independent of caller cwd.
- [video.mp4](../../../../static/comparativa-videos/cinco-segundos/manim/video.mp4)
- [poster.jpg](../../../../static/comparativa-videos/cinco-segundos/manim/poster.jpg)

```sh
node --check /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/five-seconds/render.mjs
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/five-seconds/render.mjs --check
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/five-seconds/render.mjs
```

The measured runner requires an active, unfinished recorder entry. After finish,
do not rerun against this completed timing record. A new experiment requires
coordinator-managed measurement setup; the runner never resets the clock.

Docker uses the supplied immutable image, no network, no pulls, one CPU, 2 GiB,
host UID/GID, read-only owned source/shared brief mounts and writable owned cache.
HOME and media are in .cache. MP4 encoding is native Manim/PyAV; installed static
FFmpeg is used only for the poster and decoded-frame validation. Nothing was
installed. No git, web integration, browser or background server operations.

## Scene and checks

The title, footer and labeled 30/70 bar remain visible. Formulas switch at frames
30 and 90. Two 15-frame native transitions move the complement segment; its final
outline emphasizes the complement without changing segment widths. Timeline:
30 + 15 + 45 + 15 + 45 = 150 frames, with all durations expressed as frames / 30.

Passed Python AST/import/API checks in the pinned image and Node syntax checking.
Editor diagnostics reported no errors for either source file. FFprobe confirmed
150 decoded frames, 1280x720, 30/1 fps, exactly 5 seconds and no audio. Decoded
frames at 0.5, 1.5 and 3.5 seconds confirmed green/coral pixels and differing
formula regions. The final-phase JPEG was visually inspected with no clipping or
overlap. Structured output checks are saved in .cache/validation.json.

## Obstacles and limits

One actual render attempt, successful; zero failed render attempts. Two initial
API preflight failures came from inspecting Manim's override-wrapped Animation
class rather than Animation.__init__; the final check passed. Another preflight
was interrupted in the shared terminal during NumPy import and was rerun without
stopping unrelated processes. Manim emitted a pydub missing-FFmpeg warning, which
did not prevent native silent MP4 generation.

The first render started with a fresh owned scene/TeX cache; later reruns could
reuse only this delivery's own TeX cache. No OCR, full playback or browser check
was performed. This is one elapsed task observation, not a statistical benchmark;
host load, terminal interruption and tool latency are included. Total minus render
is preparation-and-checks time, not pure typing time. Recorder timing.json is the
measurement authority and is never manually edited; finish independently checks
the MP4 before stopping the task clock.