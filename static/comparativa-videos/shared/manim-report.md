# Manim Community implementation

## Deliverables and organization

- `scene.py`: original native Manim `Scene`, Cairo axes, density plots,
  polygons, braces, LaTeX formulas, mathematical transforms and staggered strips.
  Frame-counted actions consume the frozen shared storyboard, not wall-clock time.
- `render.sh`: single-worker, offline Docker runner. Only this source directory,
  its final-media directory and read-only shared assets are mounted. Host UID/GID
  is preserved. Detached execution prevents interference from the shared terminal;
  the runner waits for its exact container and removes it after completion.
- `finish.py`: interleaved PyAV packet muxing of the Manim H.264 stream and the
  original shared MP3. No audio synthesis, encoding, speed change or trimming.
- `inspect_media.py`: streaming full-film decode, timing/pixel/caption checks,
  source-audio packet and PCM identity, poster extraction and native-player parsing.
- `environment.lock.json`: immutable official image digest, verified core versions,
  system/font dependency boundary and resource limits. `requirements.txt` lists
  direct versions; `requirements.lock.txt` records every installed Python package.
- `CAPTIONS.json`: measured native Text line widths, exact shared texts/timings,
  stable band geometry and gap-holding policy. `VALIDATION.json`: actual final result.
- Final static directory contains `player.html`, `video.mp4`, `poster.jpg` and the
  coordinator's downloadable source archive. The static player name avoids a
  collision with the Docusaurus route's index.html.
  The existing JSX route was not changed.

The design reserves pixels 588-720 for permanent captions, with at most two lines
and 1120 px usable width. Captions change at the ten frozen cue starts and remain
visible during short narration gaps. Their original measured end times are recorded
without modifying the shared script. Explanation lines are measured for an 8 px
minimum separation and kept clear of this band. Models 2 and 3 explicitly announce
the changed density; their results are 0.32 and 0.30, not the first model's 0.4.
Previous-model calculations are removed immediately at each model change.

## Reproduce

Docker is the render dependency; no host Python packages or root dependencies
are installed. The cached official image is addressed by immutable digest.

```sh
bash /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/render.sh probe
bash /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/manim/render.sh full
```

The probe exports and immediately decodes the actual scene's first 30 frames.
`full` renders every frame, muxes audio, validates the MP4, creates the poster and
regenerates both evidence JSON files and the complete Python lock. `check` repeats
only muxing/validation when the full intermediate movie is still in `.cache`.
All subprocesses have explicit paths; the shared terminal working directory is
not changed. Logs and exit markers are under `.cache`; future render caches,
compiled Python files and intermediate movies are ignored.

## Actual checks and effort

Implemented from scratch in one implementation session. Completed a one-second
native-text/axes/LaTeX probe, then a 30-frame probe of the actual composition.
The first full decode passed; sampled images exposed a stale whole-area label and
overlapping integral formulas. These were corrected, text crossfades made sequential,
and previous-model formulas cleared at model transitions before final rendering.
Shared-terminal output mixing
interrupted one attempt; isolated detached Docker execution completed with exit 0.

Successful commands: `render.sh probe`, `render.sh full`, `render.sh check`,
`bash -n render.sh`, and container-side `python3 -m py_compile` on all three sources.
The container interpreter is Python 3.11.11; verified
Manim 0.19.0, PyAV 13.1.0, NumPy 2.2.2, Pillow 11.1.0 and manimpango 0.6.0.

- All 1185 frames decoded, each with the expected consecutive 1/30-second PTS.
- H.264 / yuv420p, 1280 x 720, 30 fps, video duration exactly 39.5 s.
- MP4 duration 39.549388 s; original MP3 mono 44100 Hz, 1514 packets unchanged.
- Every one of the 1,741,950 narration samples is exactly identical after accounting
  for container gapless padding: 1105 leading samples and 1073 trailing samples.
- All ten shared captions retained literally; longest measured line 1052.719 px.
  Every decoded frame contains at least 4658 light caption pixels in the fixed band.
- Reviewed 12 decoded frame samples spanning all cues/models, including full-size
  integral and final-piecewise frames after the corrections. Poster is extracted
  from frame 528 (17.6 s), showing the uniform probability result.
- Native HTML parser confirms controls, playsinline, poster, local MP4 and no
  autoplay, remote dependencies, scripts or iframe.

## Limitations and cleanup

The audio is deliberately MP3 in MP4 to preserve the exact original packet payload;
AAC would require re-encoding. Browser codec compatibility, native control behavior
and responsive page appearance were not browser-tested. No listening check,
website browser verification, production request or server was performed.
The 49.4 ms container padding includes about 25 ms before narration; it is within
the brief's 150 ms tolerance and no narration samples were edited.

Pylance facts for the Docker interpreter were unavailable; imports/API versions,
Python syntax and behavior were checked inside the pinned runtime instead.
No colleague implementation, previous experiment, root configuration/dependencies,
shared assets, coordinator files, navigation, tests, Git/index/branches or worktrees
were used or changed. Integration remains the coordinator's responsibility.

Own Docker containers are removed; no server or browser was started. Disposable
probe images, contact sheet, intermediate movies and caches are removed after final
validation; only source, locks, evidence JSON and the three final static assets remain.