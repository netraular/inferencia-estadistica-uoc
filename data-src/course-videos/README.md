# Course videos

Use `render-course.mjs --native` for the newly authored narration-specific
React/SVG scenes. The older `Course.jsx` pipeline records the existing Konva
whiteboard; it is retained for compatibility, not the native rewrite below.

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
routes have been removed. Native draft coverage is documented below separately
from published videos.

## Native Narration Scenes

`NativeCourse.jsx` renders mathematical mechanisms directly with React, SVG and
KaTeX using `useCurrentFrame()`. It does not import Konva, the existing
whiteboard, its context renderer or its `stageEquations` helper. Four authored
scene modules share a strict registry; unsupported content fails rather than
falling back to the old board. Their plans retain the frozen canonical identity,
every original cue, cue order and source data. Source animations are not enriched
through live lesson diagrams in this route.

| Domain | Frozen items | Scenes | Cues |
| --- | ---: | ---: | ---: |
| Foundations | 45 | 396 | 1638 |
| Univariate distributions | 76 | 753 | 3117 |
| Multivariate distributions | 33 | 339 | 1365 |
| Exercises | 387 | 5384 | 11752 |
| Total | 541 | 6872 | 17872 |

The 541 items are 118 sections, 36 recaps and 387 exercise questions. This is
**implementation and source-contract coverage**, not 541 finished videos or a
visual review of every scene. Diagrams include seed populations, balances,
sets, filtering, integrals, probability masses and tails, transformations,
joint tables, conditional slices and Gaussian contours. Some recap mechanisms
are schematic rather than numerical simulations. Exercise parameters are bound
to the frozen problem data; incompatible problem snapshots are rejected.

Install the isolated dependencies, including pinned jStat, after the root
dependencies. From the repository root:

```sh
npm ci
npm ci --ignore-scripts --prefix data-src/course-videos
COURSE_VIDEO_CATALOGUE=/absolute/frozen-batch/catalogue.json npm --prefix data-src/course-videos test
```

The real catalogue tests cover all 17872 cues. Without that environment variable,
catalogue-dependent cases explicitly skip; fixture, compilation and audit tests
still run. `npm test` includes the native suite. No speech API is called.

Create a **new** silent draft batch; native selection includes all 541 items,
including the three previously published videos, without overwriting them:

```sh
CATALOGUE=/absolute/frozen-batch/catalogue.json
BATCH=/absolute/new-native-batch
node data-src/course-videos/render-course.mjs --native --transcript --prepare --source "$CATALOGUE" --batch "$BATCH"
node data-src/course-videos/render-course.mjs --native --transcript --batch "$BATCH" --ids proporciones--parte-y-total,normal--centro-y-escala,normal-bivariante--media-y-varianza-condicional,ejercicio-pdf-u1-1--a --worker
node data-src/course-videos/render-course.mjs --native --transcript --batch "$BATCH" --status
```

Omit `--ids` to process the whole selection after validating pilots. Always keep
`--native` on preparation, status and resume. Renderer sources, fonts and the
isolated lockfile are fingerprinted independently of the legacy drawing modules;
changes require a new batch, not rewriting the old selection hashes. Run from
the repository root to reuse its CWD-relative Remotion Chromium installation.
Chromium is internal to encoding; no website server is required.

Native metadata includes `sceneEngine:'native-svg'` and `nativePlanSha256`.
Bounds, ancestor clipping, overlapping SVG labels, text-container overflow and
nonempty geometry are audited at sampled cue frames. These are sample-based
checks, not a proof of every possible frame or mathematical explanation.
FFprobe verifies exact frame counts, codecs and duration; FFmpeg decodes the
whole MP4 and checks sampled nonblank, changing scene pixels. Regression tests
also compare continuous geometry within cues and exact narrated reveal anchors.

Silent videos retain `narrationMode:'transcript'`, `cueTiming:'estimated'`,
`temporary:true`, `silent:true`, and no audio track. They cannot be published
as measured Puck narration. Explicitly publish verified complete native videos,
including their exact transcript, with:

```sh
node scripts/publish-course-videos.mjs --batch /absolute/native-transcript-batch
```

### Complete and Publish the Whole Course

Run the unattended coordinator from a clean, dedicated task-branch worktree.
First prepare a new native transcript batch with the current renderer. Preserve
older batches: their completed exports can be published without rerendering.

```bash
node scripts/complete-course-videos.mjs --batch /absolute/new-native-batch --previous /absolute/older-native-batch
```

The coordinator validates and publishes completed exports, then renders only the
missing current videos. Filesystem events trigger publication after each completed
item. Every publication runs the player regression tests and commits only
`static/videos/`. Both the task branch and `main` are pushed atomically without
force. A concurrent divergent `main` or unrelated worktree edits block publication
instead of overwriting them; rendering can continue with the error recorded.

`publication-progress.json` in the new batch records the last successfully pushed
revision, published coverage and errors. Completion requires all 541 canonical
items, compatible transcripts, present assets and matching final file hashes.
Recoverable render failures remain explicit; they are not counted as complete.
There are no automatic retry loops. A systemd user unit can keep the coordinator
running after terminal disconnection, but the computer and user manager must stay
running. After a reboot, inspect the recorded renderer PID and lock before manual
resumption; never remove a live lock or run a second coordinator for the batch.

Publication verifies live canonical content, source hashes, layout evidence,
all decoded frames and media hashes. Failed or incomplete items are not copied.
Existing compatible narrated videos take precedence. For compatible Puck audio,
use a measured frozen batch instead:

```sh
node data-src/course-videos/render-course.mjs --native --batch /absolute/measured-batch --ready
```

Measured timing, exact cue text, MP3 hashes and publication guards remain strict.
Replacing estimates with real narration requires a fresh render, not just muxing
audio onto the silent draft. No new audio has been generated by this rewrite.

### Native Pilot Evidence

Four full silent pilots in external `remotion-native-scenes-2026-11-10-v3`
passed encoding, nonblank/motion checks, full decode and source/hash checks:

| Item | Seconds | Frames |
| --- | ---: | ---: |
| `proporciones--parte-y-total` | 81.2 | 2436 |
| `normal--centro-y-escala` | 124.333 | 3730 |
| `normal-bivariante--media-y-varianza-condicional` | 143.933 | 4318 |
| `ejercicio-pdf-u1-1--a` | 99 | 2970 |

Image review found overlapping normal labels and a clipped exercise paragraph.
Both were fixed; the normal observation now remains exactly two standard
deviations from its center through standardization. The two corrected videos
were fully rerendered in `remotion-native-scenes-2026-11-10-v4`: 6700 frames,
40 audited samples, no layout errors, zero audio tracks, complete FFmpeg decode
and matching output hashes. Twelve additional real stills across all four
domains passed the stronger clipping/label checks and were visually inspected.
This verifies these pilots only, not the remaining queue. Dependency fingerprints
also include the final isolated jStat lockfile; preserve older batches as evidence
rather than changing their hashes to resume them after a dependency change.

The old whiteboard transcript process was deliberately stopped after six
completions; its interrupted `algebra` entry is recorded as failed. Its existing
outputs are preserved. Do not restart the historical unit below for native work.

## Legacy Frozen-Batch Renderer

`render-course.mjs` supports sections, global recaps and individual exercise
question explanations through the whiteboard-backed composition, `Course.jsx`.
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

## Legacy Silent Transcript Production

This is a separate, explicit draft mode, not Puck narration. It never needs,
reads, generates or fabricates audio. The existing measured-audio `--ready` and
`--publish` paths remain strict. `--transcript --publish` and
`--transcript --ready` fail before opening a batch. Publication also rejects
transcript/estimated/temporary/silent markers in catalogue, audio or resumed
video metadata. Nothing from this production is copied to `static/`.

The immutable source is
`/home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1/catalogue.json`.
Preparation copies all 541 items byte for byte to the separate external batch
`/home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1`.
`selection.json` fixes 538 target IDs (116 sections, 36 recaps, 386 exercises),
explicitly excluding the already published real Puck videos:

- `proporciones--parte-y-total`
- `proporciones--porcentaje-y-exposicion`
- `ejercicio-pdf-u1-1--a`

The original catalogue's `model` and `voice` remain untouched as source identity,
not as claims about these silent videos. `selection.sha256.json` guards the
selection. Original and copied catalogue bytes, frozen `sourceFiles` dictionary,
`inputSha256`, every canonical animation and item hash, the timing policy and
renderer dependencies must match when resuming. No live narration is rebuilt.
Authored diagrams are overlaid only through `withCourseVisuals`, with its existing
unchanged-content assertion. Dotted PEC/question IDs remain supported; traversal
and excluded Puck IDs are rejected.

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --transcript --prepare --source /home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1/catalogue.json --batch /home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1
```

Preparation refuses an existing batch. To resume, omit `--prepare` and `--source`.
The deterministic timing policy is 140 whitespace-delimited words per minute,
at least 1.2 seconds per cue, rounded up to whole 30 fps frames, followed by a
9-frame (300 ms) pause after every cue, including the final one. These are
**estimates**, not measurements. Original text, cue objects, reveal indices,
mathematics and diagrams are never rewritten. The shared `courseFrame` and
`sampleFrames` use this explicit transcript timeline for forward/reverse seek.

Each completed target writes `videos/<id>/video.mp4`, `poster.jpg`,
`metadata.json` and `transcript.json` beneath the external batch. MP4 is
H.264/yuv420p, 1280 x 720, 30 fps with **zero audio tracks**, not silent AAC or
a silent WAV. The composition renders only the original board/captions; the
transcript branch skips the measured-audio mux. All existing per-cue layout,
MathJax equation paths, authored diagram geometry, canvas/pixel evolution,
source/font hashes, FFprobe frame/codec checks and full FFmpeg decode remain
mandatory. The transcript verifier rejects any audio track; the real-audio
verifier still requires AAC.

Metadata explicitly includes `narrationMode:'transcript'`,
`cueTiming:'estimated'`, `temporary:true`, `silent:true`, the timing policy,
canonical/source snapshot and hashes. It has no `voice`, `model`, `audioSource`
or `audioSha256`. `transcript.json` preserves each exact cue text, source-cue
hash, scene/cue index, word count, estimated seconds and integer frame bounds.
It is the auditable handoff for future measured narration. Replacing estimates
with measured cues requires **rerendering** the original animation with the
measured-audio contract: reveal times and captions change, so remux alone is not
sufficient. Keep this batch as a draft snapshot; use a different measured batch.

`progress.json` is atomically updated per item, with real `pending`, `rendering`,
`complete` and `failed` counts totalling 538, current ID, PID and errors.
Successful output reuse checks the complete source snapshot, input/renderer
hashes, exact transcript plan, MP4/poster hashes and full media verification.
Stale outputs fail without deleting or rerendering them automatically. Source
changes do not delete or rerender any of the three older Puck outputs. Their
older renderer fingerprints may require a deliberate new batch for future
rerendering; do not erase those working outputs merely to satisfy new hashes.

Production uses one frame worker and serial items. It does not use GPU or touch
the independent Ming job. The initial two-item pilot is a separate unit; start
the full production unit **only after the pilot has exited successfully**, so
the exclusive batch lock is not shared:

```sh
systemd-run --user --unit=inferencia-remotion-transcripts-v1 --property=WorkingDirectory=/home/aquiluer/Scripts/inferencia-estadistica-uoc --property=Nice=10 --property=CPUQuota=200% --property=MemoryHigh=2G --property=MemoryMax=3G --property=TasksMax=256 --property=StandardOutput=append:/home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1/production.log --property=StandardError=append:/home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1/production.log /usr/bin/env OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 "$(node -p 'process.execPath')" /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --batch /home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1 --transcript --worker
```

The shell resolves the absolute Node executable before submitting the unit;
the user manager's PATH need not contain Volta or another Node version manager.
No `--collect` is used: systemd retains failures. Log output is per item, not per
frame. These commands do not start a website server or browser verification;
Chromium is internal to Remotion encoding only.

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/data-src/course-videos/render-course.mjs --batch /home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1 --transcript --status
systemctl --user show inferencia-remotion-transcripts-v1.service --property=ActiveState --property=SubState --property=MainPID --property=ExecMainStatus
tail -n 25 /home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1/production.log
systemctl --user restart inferencia-remotion-transcripts-v1.service
```

Restart revalidates/reuses matching completed items, then continues pending ones.
Never remove `videos/.remotion.lock` while its recorded PID is alive. After an
unclean kill, inspect that PID and its command line first, then remove only a
confirmed abandoned lock before restarting. A successful process exception
cleans its own lock. After user-manager reboot, reissue the full `systemd-run`
command above (transient units survive terminal disconnect, not reboot).

Offline checks, including the real frozen catalogue (no audio generation):

```sh
env REMOTION_FROZEN_CATALOGUE=/home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1/catalogue.json node --test /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-transcript.test.mjs /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-course.test.mjs
env REMOTION_TRANSCRIPT_PILOT=/home/aquiluer/Scripts/TTS/outputs/remotion-transcripts-course-2026-11-10-v1 node --test --test-name-pattern='opt-in completed transcript pilot' /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/remotion-transcript.test.mjs
```

Temporary fixture catalogues in offline tests never count as production. The
production pilot uses full original items, not shortened or synthetic fixtures.
The opt-in resume check requires that completed pilot. It copies its original
section MP4/poster/metadata and frozen inputs into a temporary batch, verifies
full reuse without recoding or audio, then rejects changed output hashes,
canonical snapshot, phantom Puck voice, cue text and catalogue bytes. It removes
the temporary copy and never edits the production pilot.

### Verified Initial Pilot

The 2026-11-10 production pilot encoded two complete original items:

| ID | Timeline | Frames | Audited frames | Render/verification elapsed |
| --- | ---: | ---: | ---: | ---: |
| `proporciones--unidades-y-cotas` | 79.2 s | 2376 | 17 | 163.270 s |
| `ejercicio-practica-calculo-continuous--point` | 134.5 s | 4035 | 26 | 279.408 s |

Both passed zero-audio FFprobe checks, full FFmpeg decode (also repeated by an
independent post-render check), layout, nonblank/changing canvas and exact source
hash checks. The section includes authored tree/number-line diagrams; the exercise
is diagram-free and uses its original problem/equations. No website browser or
listening verification was performed. The completed section also passed the real
copy-only resume/stale-output regression test. The full queue then reused it and
started the original `proporciones` recap. This is not a claim of 538 completions.

At one frame worker, two-CPU quota and 3 GiB cap, the pilot took 442.678 s for
6411 frames. A simple same-rate extrapolation for the 3,441,763-frame target is
about 66 hours, not a guaranteed ETA: other diagrams, recaps and CPU contention
can change throughput. The 31.87-hour estimated *video timeline* is not a render
duration or measured speech length. Do not extrapolate production completion
from test fixtures.

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