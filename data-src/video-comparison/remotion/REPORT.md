# Remotion comparison: probability as area

Participant 3. Independent implementation of the frozen shared storyboard.
Only the assigned Remotion source and static directories were changed. No sibling
implementation, original classroom engine or Manim experiment was inspected.
No Git/index/branch/commit/push action, root dependency change, paid service or
upload was performed. The optional JSX route is unchanged for coordinator integration.

## Technology and Versions

Real React frame composition with Remotion `useCurrentFrame`, `interpolate`,
`Sequence`, `Composition` and `Audio`. Inline SVG is the chart artwork, not a
replacement video engine. KaTeX renders the actual mathematical notation and
supplies local bundled fonts. No CDN or remote runtime asset.

| Component | Verified version |
| --- | --- |
| Node used for export | 22.14.0 |
| Remotion, renderer, bundler, CLI | 4.0.542 |
| React / React DOM | 18.3.1 |
| KaTeX | 0.16.22 |
| ffmpeg-static npm package / binary | 5.3.0 / FFmpeg 7.0.2 |
| ffprobe-static npm package / binary | 3.1.0 / FFprobe 4.0.2 |
| Chromium Headless Shell downloaded by pinned Remotion | 158.0.8127.2 |

Direct dependencies are exact-pinned in the local package. The npm lockfile pins
the transitive dependency tree. This example uses Remotion's free personal /
noncommercial evaluation arrangement; no paid rendering service was used.

## Organization and Changed Paths

All paths below are relative to the repository root:

- `data-src/video-comparison/remotion/.gitignore`
- `data-src/video-comparison/remotion/package.json`
- `data-src/video-comparison/remotion/package-lock.json`
- `data-src/video-comparison/remotion/render.mjs`
- `data-src/video-comparison/remotion/check.mjs`
- `data-src/video-comparison/remotion/REPORT.md`
- `data-src/video-comparison/remotion/src/probe.jsx`
- `data-src/video-comparison/remotion/src/composition.jsx`
- `data-src/video-comparison/remotion/src/style.css`
- `data-src/video-comparison/remotion/src/timing.mjs`
- `static/comparativa-videos/remotion/player.html`
- `static/comparativa-videos/remotion/video.mp4`
- `static/comparativa-videos/remotion/poster.jpg`

`render.mjs` checks the original audio SHA-256, stages exact shared assets into
ignored `public/`, bundles React locally, serves only that bundle at
`127.0.0.1:41743`, opens Chromium solely for video export, and closes its browser
and loopback server in nested `finally` blocks. Render concurrency is exactly 1;
parallel encoding is disabled. It exports silent visual frames with Remotion,
then stream-copies the original MP3 packets, without synthesis, trimming,
acceleration or audio recoding, into the final fast-start MP4. The composition
also contains Remotion's real `Audio` component referencing that same asset.

The chart occupies the upper area; its axes have minutes and inverse-minute
units. All densities have support [0,2], with zero density outside. Every cue is
taken literally from the frozen JSON and deterministically split into at most
two lines. Captions are burned into a fixed 100-pixel bottom band. The band stays
present during the measured silent cue gaps, without extending caption timings.
Models switch at frames 684 and 960 with explicit new-model labels. Values
0.4, 0.32 and 0.30 belong to their respective displayed densities.

The static HTML is a responsive native HTML5 player with controls, playsinline,
metadata preload and the real decoded poster. No autoplay, decorative card,
JavaScript player dependency or shared navigation change.

## Reproduce

Run from any working directory; npm executes scripts in this owned package:

```sh
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion ci --no-audit --no-fund
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion run probe
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion run check -- --source
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion run render -- --sample
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion run render
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/video-comparison/remotion run check
```

The first installation performed here was local `npm install --no-audit
--no-fund --progress=false`, which generated the lockfile. An occupied 41743
fails safely rather than taking over another participant's port. Initial npm
installation and Chromium download require network access; runtime visuals and
the player require no remote asset. No system/global installation or sudo.

## Effort and Checks Actually Performed

One independent implementation pass and one rendered-layout correction. Work
included dependency bootstrap, a 30-frame moving-bar probe, two eleven-frame
composition sample exports, visual inspection of decoded samples, the complete
single-worker export, and source/media regression checks. The sample review
identified an overlapping progress line and an overly tall integral panel;
both were fixed before the full export. Two validation heuristics were refined:
the actual full-range pixel format and small within-glyph subtitle row gaps.
No listening, website browsing, application screenshot or production check.

Successful commands: `npm run probe`, `npm run check -- --source`,
`npm run render -- --sample`, `npm run render`, `npm run check`, all via the
absolute local npm prefix above. Editor diagnostics on the modified composition,
CSS, render script and HTML found no errors.

| Final measurement | Result |
| --- | --- |
| Video codec / pixel format | H.264 / yuvj420p, full-range 4:2:0 |
| Dimensions / frame rate | 1280 x 720 / 30 fps |
| Decoded frame count | 1185 |
| Video duration | 39.500000 s |
| Container duration | 39.525000 s, 25 ms padding |
| Audio | Original MP3, 44100 Hz, mono |
| MP4 size | 989290 bytes |
| Poster | JPEG, 1280 x 720, decoded frame 510 |
| Literal caption cues | 10, at most two lines |
| Decoded frames checked | 16 |
| Audio packet equality | Byte-for-byte identical, PASS |

Original MP3 file SHA-256:
`7dd0ce2c126d42cabc42f260c205b448e7cfd4ac0039b550176cb9e5d5cb32f5`.
Copied MP3 packet payload SHA-256, identical for source and export:
`d6b7beb78d4a5836a84d50aafd907bae8f2eb266e7a03cfc1a20d581bc072ac6`.
These hashes describe different representations: the original file includes
container metadata, whereas the second compares the compressed audio packets.

Decoded samples: frames 0, 66, 198, 306, 413, 525, 629, 683, 684, 732, 870,
959, 960, 1026, 1143 and 1184. Checks cover each measured cue's midpoint,
both sides of both model transitions, the first/last frames, nonblank graph
pixels, caption presence and margins, one/two text lines and measured cue gaps.
Mathematical source checks independently verify normalization of all three
densities and the requested probabilities. Source inspection verifies native
controls, playsinline, media URLs and absence of autoplay/CDN references.

`check.mjs` writes detailed machine-readable results into ignored
`.cache/validation/metadata.json`. Temporary decoded review images and probe
movies were removed after inspection. All intermediates, local dependencies,
bundles and browser caches remain confined to the ignored source directory;
the static directory contains only the three final deliverables.

## Limitations and Cleanup

- MP3 is intentionally preserved inside MP4 to honor the exact-audio requirement;
  browser codec support can differ. No AAC compatibility derivative was created.
- Captions are permanently burned in, not selectable or switchable. Source
  cue gaps remain blank by design. Pixel checks are not OCR or proof of every
  intermediate layout; sampled decoded frames were also visually reviewed.
- No playback/listening test, mobile website check or production browser test
  was performed. The coordinator handles shared route integration independently.
- Every export's own browser and server were explicitly closed in `finally`.
  A subsequent `ss -ltn 'sport = :41743'` check showed no listener. No terminal
  or process belonging to another participant was killed.