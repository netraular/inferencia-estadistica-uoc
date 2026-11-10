# Course videos

Remotion is the production renderer for narrated course videos. The retained
historical first render is topic 0, Proporciones, section `parte-y-total`.
It uses the original measured narration: 45.4 seconds, 14 cues, 1362 frames
at 30 fps and 1280 x 720. Its source MP3 has been retired, so it is not selected
for the revised lesson. Use the general frozen-batch renderer below for new
Puck narration; the historical commands require their original audio.

From the repository root:

```sh
npm ci --prefix data-src/course-videos
npm run video:render
npm run video:verify
```

`storyboard.mjs` derives named animation events from the measured audio manifest
instead of duplicating cue timings. `Proportions.jsx` renders the two observed
seed trays, reveals their own denominators, and compares 18/72 = 0.25 against
30/200 = 0.15 without assuming independent seeds.

The renderer checks 16 exported frames for text overflow and viewport bounds,
then exports H.264 with AAC narration. FFprobe verifies dimensions, duration
and all 1362 frames; FFmpeg decodes the complete output. It records source
audio and output hashes in `static/videos/manifest.json`. Intermediates and
validation evidence remain under ignored `.cache/`.

The video component uses the manifest's section animation ID. Sections not
yet rendered retain their existing animation. A media loading failure also
falls back to that animation. Comparison projects and public comparison
routes have been removed; no other course sections have been migrated yet.

## General Frozen-Batch Renderer

`render-course.mjs` supports sections, global recaps and individual exercise
question explanations through one native Remotion composition, `Course.jsx`.
It consumes a frozen catalogue and its local audio files. It does not
generate narration, read credentials, call Gemini, or rebuild lesson content.
For sections and recaps frozen without context figures, a renderer-only overlay
uses the existing authored diagrams in `lesson-visuals.js`. Exact spoken anchors
must match; missing or changed anchors fail instead of substituting a generic
figure. The overlay is checked against the frozen animation to preserve every
original cue, formula, line, datum and source reference. The input catalogue and
canonical audio identity remain unchanged. The diagram source is included in
the renderer hash, so changes invalidate completed output reuse.
The original proportions renderer above is unchanged.

Install the isolated, locked dependencies:

```sh
npm --prefix /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos ci
```

Render the completed compatible audio in a batch while the audio pipeline is
still generating other items:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --batch /absolute/path/to/batch --ready
```

Add `--limit N` to render at most N ready items, rather than the first N catalogue
positions. `COURSE_PENDING <id> missing ...` identifies skipped inputs;
`COURSE_READY` reports selected, ready, pending and rendering counts. An entirely
pending batch succeeds without starting Chromium or creating video outputs.
Rerun the command as the audio pipeline completes more items.

Without `--ready`, every selected item must have complete compatible audio.
Explicit `--ids` are always strict, including when combined with `--ready`:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --batch /absolute/path/to/batch --ids proporciones--parte-y-total --limit 1
```

The batch contract is `catalogue.json` with `{version:1,
model:'gemini-3.8-flash-tts', voice:'Puck', style, items}`. Each item contains
`id`, `kind` (`section`, `recap`, `exercise`), `title`, optional `parentLesson`,
`canonicalSha256`, and the complete original `animation` including every step,
cue, formula, context, phase, plot, and source reference. IDs are safe filename
slugs following `[a-z0-9]+(?:(?:-{1,2}|\.)[a-z0-9]+)*`, including dotted question
IDs such as `c.i` and `c.ii`, but never path traversal. No live lesson or narration
import is used to prepare a render; only the guarded authored diagram overlay
is added when the frozen section or recap lacks it.

For each item, `items/<id>/audio.mp3` and `audio.json` must exist. WAV is retained
by the audio pipeline but is not needed by this renderer. Audio metadata must
include `id`, `title`, `model`, `voice`, `duration`, `cueTiming:'measured'`,
`canonicalSha256`, `mp3Sha256`, `mp3Bytes`, and `scenes`. Scene and cue times are
absolute seconds in that MP3, not offsets relative to their containing scene.
Each scene has `{start,end,cues:[{text,start,end}]}` matching the frozen original
step's cues exactly and in order. Missing, stale, unmeasured, mismatched-model
or mismatched-voice audio is rejected before Chromium starts. `--ready` skips
only missing inputs: any present metadata is checked even when its MP3 is still
missing, and any present MP3 is probed even when its metadata is missing. Broken
JSON, stale metadata, incompatible narration, corrupt bytes and nonregular input
files remain errors, never silently skipped. Every candidate is validated before
the ready-item limit is applied.

Outputs are local to `batch/videos/<id>/`:

- `video.mp4`: H.264/AAC, 1280 x 720, 30 fps.
- `poster.jpg`: an audited sample from the last cue with a visible figure or
	authored problem/equation,
  not the median sample or an end-of-video hold. Its frame is recorded in metadata.
- `metadata.json`: player-compatible fields, provenance, input and renderer
	hashes, decoded sample pixel hashes, context label/formula bounds, and timings.

`useCurrentFrame()` selects the measured scene/cue and explicitly seeks the
existing whiteboard geometry. There is no wall-clock playback, screenshot
sequence, or independently authored slide catalogue. The shared renderer draws
MathJax vector paths, all original context phases, plots, shaded regions,
matrices, probability trees, and cue-paged derivations. The webpack adapter
defines MathJax `PACKAGE_VERSION` so browser bundles do not enter its Node eval
fallback. Both bundled Atkinson faces are copied into the Remotion bundle.

Each measured cue midpoint (or up to 0.7 seconds after its start), the first
frame, and the final frame receive layout audits. Bounds, overlaps, wrapped text
widths, caption overflow, and real canvas evolution are checked before encoding.
Where a context diagram is authored, audits require its actual shape bound to
the whiteboard, nonzero marks and the original label/bounds checks. Diagram-free
exercise scenes instead require cue-visible original problem text or TeX,
matching rendered text or equation vector paths, and nonzero ink inside the
content bounds. Labels and headings alone do not count. Only the exact opening
greeting may remain title-only, and only if the immediately next cue reveals
authored content. No diagrams, quantities, mathematical values or future answers
are invented. Existing figures are visible from the first frame. Authored phases change at cue
boundaries; a figure can intentionally remain unchanged across adjacent cues.
Different canvas hashes alone do not prove continuous geometric animation.
FFprobe counts every frame and checks codecs, dimensions, fps and duration;
FFmpeg decodes the complete MP4 and independently checks sampled nonblank,
changing whiteboard pixels. Container duration is rounded up to a frame; AAC
is padded only to that boundary, at most 1/30 second beyond measured narration.

Rerunning the same command validates and reuses completed matching output.
Changed catalogue items, audio metadata/bytes, renderer sources, fonts, or lockfile
invalidate reuse. Stale completed outputs are refused: retain the old batch and
use a new one, or deliberately remove only that item's outputs before rerendering.
Live lesson, narration and unrelated exercise-tutor edits do not invalidate a
frozen batch. The renderer parses and snapshots only the tutor's self-contained
`stageEquations` export, hashes that math dependency, and bundles the snapshot
instead of the live tutor module. New external references in that function are
rejected until explicitly supported. Whiteboard, context geometry, fonts, renderer
sources and the isolated lockfile remain guarded, as do the frozen catalogue and
each item's exact audio bytes and measured timing.
Metadata also records a `sourceSnapshot`: frozen catalogue, item, canonical,
rendered-animation and audio-metadata hashes, source references, batch provenance,
and the individual guarded renderer dependency hashes. Resume rejects snapshot
tampering as well as incompatible input/renderer hashes. Structured item,
animation and audio hashes use their JSON serialization.
Interrupted incomplete output can be rendered again. One exclusive lock protects
each batch; an abandoned lock requires checking its recorded PID before removal.

Publication is explicit, after the audio owner has published matching MP3 bytes:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --batch /absolute/path/to/batch --ids proporciones--parte-y-total --publish
```

This copies only selected video/poster/metadata files and merges their entries
into `static/videos/manifest.json`, preserving unrelated lessons. Entries include
`engine`, title, src, poster, duration, frames, fps, width, height, audioSource,
audioSha256, videoSha256, posterSha256, canonicalSha256, voice, and model. Audio
publication itself is not this renderer's responsibility. A catalogue or audio
record marked `testFixture:true` cannot be published.

### Partial Real-Audio Previews

When narration is incomplete, `preview-course.mjs` copies only the first six
completed cues of `proporciones--parte-y-total` into a fresh batch under the
original batch's `previews/` directory:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/preview-course.mjs /absolute/source-batch /absolute/source-batch/previews/first-six
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --batch /absolute/source-batch/previews/first-six --ids proporciones--parte-y-total--avance --worker
```

The helper verifies original signatures, WAV hashes and FFprobe measurements,
then reuses the real-audio assembler with 300 ms pauses and 48 kb/s mono MP3.
It freezes an exact spoken prefix, preserves reveal indices and source identity,
removes future lines, and recomputes the canonical hash. It never reads keys,
calls Gemini, changes original inputs or acquires the original batch's lock.
Missing context is enriched using the complete original before truncation, so
future anchors are validated without requiring them in the spoken prefix. The
preview's output ID is not used to look up lesson figures. The composition and
its audit both consume the same prepared animation and measured cue state.
The title visibly says `Avance parcial`; catalogue, audio and video metadata
carry `preview:true`, original identity and partial cue coverage. These are not
completed sections. Preview renders use one frame worker and retain all layout,
math and media guards. `--worker` keeps this run's outputs inside the preview
batch rather than creating a launcher log in the source checkout. `--publish`
rejects previews marked in either catalogue or audio, or resumed video metadata.

## Checks And Resources

```sh
node --test /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-course.test.mjs
env REMOTION_SMOKE=1 node --test /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-course.test.mjs
env REMOTION_SMOKE=1 REMOTION_FROZEN_CATALOGUE=/absolute/frozen-batch/catalogue.json node --test /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-course.test.mjs
env REMOTION_REAL_PREVIEW=/absolute/frozen-batch/previews/first-six node --test --test-name-pattern='opt-in real six-cue' /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-course.test.mjs
```

The normal check validates selection against the actual 541-item `buildCatalogue`
and checks every current explanation: 118 sections, 36 recaps, and 387 exercise
questions, preserving their complete original visual objects. It also checks
dotted IDs and traversal rejection, mixed ready/pending batches, strict explicit
IDs, CLI exit behavior, corrupt/stale present inputs, scoped source hashes and
the actual webpack math-module alias. Input fixtures are temporary contract bytes
with an injected media probe; the normal check does not synthesize audio or render
videos. The CLI pending-only check starts no browser and creates no video output.
Regression checks also require initial figures for all 118 raw catalogue
sections and 36 recaps, compare the six-cue proportions preview with its full
original, verify 18/30 changes to 18/54 with total 72 at cues five and six, and
reject changed visual anchors and blank poster candidates.
With `REMOTION_FROZEN_CATALOGUE`, all 541 frozen items pass the audio/animation
contract. All 387 frozen exercises are checked through the real scene planner
and cue paging; every distinct authored diagram phase is drawn to reject
unsupported types. The current snapshot includes 287 diagram-free exercises
and 174 distinct diagram phases across five kinds. This does not claim that all
541 videos have been encoded.

The opt-in smoke check creates explicitly marked synthetic tone cues measured
by FFprobe, never speech. It renders three clips: original joint-normal/matrix
scenes, the complete first frozen exercise, and the complete first diagram-free
exercise. Every cue receives actual combined layout/pixel/equation auditing.
Full MP4 decoding, resume, stale input and source-snapshot rejection, and
fixture-publication refusal are checked. The temporary batch is removed by
default; no static media is written. The real-preview check copies existing
six-cue inputs to a temporary directory, fully renders/decodes them, rejects
publication, and compares original batch, preview, publication and guarded
renderer source bytes before/after. No API calls or original-batch writes occur.
These are renderer tests, not narration or listening audits.

One local three-clip run produced 264, 216 and 540 frames, with 24, 20 and 47
layout samples respectively, in about 78 seconds including negative controls.
This is not a full-course runtime/size estimate. The isolated dependency/browser
installation occupied about 705 MiB here. The first run may download Remotion's
Chrome Headless Shell; an installed/cached browser avoids that download. Node,
npm, FFmpeg and FFprobe are required (bundled media binaries are preferred,
with `/usr/bin/ffmpeg` and `/usr/bin/ffprobe` fallback).

Items are rendered sequentially with two frame workers, not 541 simultaneous
jobs. Encoding temporarily requires a silent MP4, muxed MP4 and final copy;
allow roughly three times the current item's output size, plus the bundle and
sampled stills. Media pixel extraction uses about 130 KiB per sampled frame in
memory, in addition to Node/Chromium/MathJax. Cache directories are scoped to
batch/renderer/PID and removed on completion or failure. Detached worker logs
remain under the renderer's ignored `.cache/course-jobs/`; the batch's
`videos/remotion-run.json` records browser-close status and completed results.
The browser is closed in `finally`; no website browser/devserver is launched.

Chromium is used only by the media renderer. The export closes its browser;
no website preview server or browser playback check is started. Exported
frames and technical media checks do not constitute a full listening audit.