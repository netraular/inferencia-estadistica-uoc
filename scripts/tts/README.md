# Course Audio With Ming

Optional offline tooling for all 36 global classroom lectures and, with
`--sections`, 118 section narrations keyed by `parentLesson--sectionId`. It shares
the existing curriculum and lecture exporters; it is not part of the website build or runtime.
Requires Linux/WSL, Python 3.12+ and Node.js 20+. Synthesis requires NVIDIA CUDA.

## Prepare And Test Without GPU

From the repository root, install the Node development dependencies and create
a separate Python environment:

```sh
npm ci --ignore-scripts
python3.12 -m venv .venv-tts
.venv-tts/bin/python -m pip install -r scripts/tts/requirements.txt
.venv-tts/bin/python scripts/tts/generate-course.py --prepare-only
.venv-tts/bin/python -m unittest discover -s scripts/tts -p 'test_*.py'
```

Preparation and tests do not import PyTorch or Ming. Tests cover the full course,
Spanish number/symbol readings, checksums, resume without live source, measured
scene subtitles, assembly and output locking. The synthesis loop is also tested
with CPU-only stubs; those tests do not verify GPU speed or voice quality.

The separate `validate-tts` GitHub Actions job runs these tests with Python 3.12
and only the CPU requirements plus the lecture exporter's Node dependencies.
It does not install PyTorch, download Ming or require a GPU. The web validation
job and container build remain independent of Python.

The default output is `data-src/inferencia-estadistica/_work/audio/`, ignored by
Git and the container build. Use `--output` to keep generated material outside
the checkout. Each lesson has its own numbered unit/lesson directory containing:

- `guion-original.txt`: the classroom narration.
- `guion.txt`: the Spanish narration prepared for synthesis.
- `fragmentos/`: WAV/JSON checkpoints for each scene.
- `audio.wav`, `audio.json`, `audio.vtt`: the completed lesson and measured scene timings.

At the output root, `curso.json` preserves the content snapshot, `progreso.json`
tracks the batch, and `voz-referencia.wav` is the shared synthetic voice.
The `fuente/` directory preserves the original exporter output; its subtitle
timings are estimates, unlike the measured scene timings in each `audio.vtt`.
There is no word-level alignment. Pronunciation needs listening review.

## External Ming Installation

Do not copy the Ming source checkout, weights or Python environment into this
repository. Use these tested upstream revisions:

| Component | Source | Revision |
| --- | --- | --- |
| Runtime | https://github.com/inclusionAI/Ming-3.0-tts | `a39b80660bdc5a4394d5e1d41af6dbfd9c443a54` |
| Weights | https://huggingface.co/inclusionAI/Ming-3.0-tts-0.5B | `7247f4c94a5b2e987404ed28a5cfec41b1a4ca61` |

The tested stack is Python 3.12, PyTorch/torchaudio 2.6.0+cu124 and Transformers
4.46.3. The weights file `model.safetensors` has SHA-256
`45c4d78d8ad6b1d942e3da86ba035fece02de569f7b2ca7e9d121dfaf18d674c`.
Ming code and weights use the MIT license; consult upstream LICENSE and LEGAL.md.

To set up an external checkout and environment, choose your own directories:

```sh
git clone https://github.com/inclusionAI/Ming-3.0-tts "$MING_CODE_DIR"
git -C "$MING_CODE_DIR" switch --detach a39b80660bdc5a4394d5e1d41af6dbfd9c443a54
.venv-tts/bin/python -m pip install --extra-index-url https://download.pytorch.org/whl/cu124 \
  torch==2.6.0+cu124 torchaudio==2.6.0+cu124
.venv-tts/bin/python -m pip install -r "$MING_CODE_DIR/requirements.txt"
.venv-tts/bin/python -m pip check
.venv-tts/bin/python -c 'from huggingface_hub import snapshot_download; import os; snapshot_download("inclusionAI/Ming-3.0-tts-0.5B", revision="7247f4c94a5b2e987404ed28a5cfec41b1a4ca61", local_dir=os.environ["MING_MODEL_DIR"])'
```

Export `MING_CODE_DIR` and `MING_MODEL_DIR` as external absolute directories
before running those commands. The first is the source checkout containing
`ming_tts.py`; the second is the downloaded model directory. Neither is fetched
automatically by the course generator. The optional Chinese/English normalizer
and Flash Attention are not required: Spanish uses the prepared text and SDPA.

## Generate And Resume

With an existing Ming-capable Python environment:

```sh
python scripts/tts/generate-course.py \
  --ming-code "$MING_CODE_DIR" --model "$MING_MODEL_DIR" \
  --output /path/outside/repository/course-audio
```

The two environment variables are also defaults for their corresponding flags.
`--source` defaults to this repository, independent of the current directory.
The model is loaded once and the synthetic voice prompt is cached. Run one
generation at a time; a file lock rejects concurrent writers to the same output.

Rerun the same command after an interruption. Text/settings signatures and WAV
checksums validate completed fragments before reuse. Existing local TTS
checkpoints use the same signature format. Do not delete `fragmentos` or the
synthetic voice while a batch is running or before resuming it.

Resume reads the saved `curso.json`, not the live curriculum, so moving or
changing the website cannot silently mix course revisions. `--prepare-only`
also reuses an existing snapshot. Only `--prepare-only --refresh` explicitly
replaces a same-mode snapshot; prefer another output directory for a new course
revision. `--refresh` cannot be used with `--status`. `--max-scenes` includes
reused scenes in its limit.

```sh
python scripts/tts/generate-course.py --status --output /path/to/course-audio
python scripts/tts/generate-course.py --lesson proporciones --max-scenes 1
```

If another batch is running from the separate local TTS installation, do not
start a second generator against its output. Only switch its entry point after
that service finishes or is explicitly stopped. The [Spanish local guide](../../TTS.md)
explains how to prepare a new batch for updated lesson texts without restarting
the old course snapshot.

## Section Narration And Publication

Use a new output directory, separate from the frozen global batch. The default
section output is also separate. Preparing a global output with `--sections`,
or resuming section output without that flag, is rejected; `--refresh` does not
convert modes. Leave the old global batch and its checkpoints unchanged.

```sh
python scripts/tts/generate-course.py --sections --prepare-only \
  --output /path/outside/repository/section-audio
python scripts/tts/generate-course.py --sections \
  --ming-code "$MING_CODE_DIR" --model "$MING_MODEL_DIR" \
  --output /path/outside/repository/section-audio
python scripts/tts/generate-course.py --sections --status \
  --output /path/outside/repository/section-audio
```

Repeat the generation command with `--sections` and the exact same output to
resume. Both generation and preparation reuse `curso.json` and `fuente/` even
when live sources are unavailable. Sections synthesize individual natural-text
cues, then assemble their measured boundaries into one complete scene; cue
speech stays equal to the canonical cue text. Keep cue/scene checkpoints and
the synthetic reference voice. Only an intentional same-mode refresh replaces
the snapshot, and it must not target a batch that needs to remain frozen:

```sh
python scripts/tts/generate-course.py --sections --prepare-only --refresh \
  --output /path/outside/repository/section-audio
```

Publish completed sections separately from generation:

```sh
node scripts/tts/prepare-sections.mjs \
  --audio-root /path/outside/repository/section-audio --out static/audio
```

`--audio-root` is required; `--out` defaults to `static/audio`. The publisher
reads, never refreshes, the snapshot. It checks `mode: "sections"`, all 118 IDs
and the recorded lesson, parent, scene and cue counts against the current canon.
Only `status: "complete"` sections with matching frozen/exported/aggregate
metadata, full WAV/JSON cue and scene fragments, signatures, checksums and scene
VTT boundaries are encoded. `audio.json` must declare `cue_timing: "measured"`,
44100 Hz frames consistent with duration, and complete canonical `scenes[].cues`
with global, ordered, non-overlapping times inside the scene. Estimated cues
and MP3s ending before the measured timeline are rejected.

The public contract is:

- `manifest.json`: `version: 1`, `lessons["parentLesson--sectionId"]` containing
  `title`, `parentLesson`, `parentTitle`, `sectionId`, `sourceSections`, `optional`,
  `src: "audio/parentLesson--sectionId.mp3"`, encoded `duration`,
  `cueTiming: "measured"`, and complete measured `scenes`/`cues`.
- `provenance.json`: `version: 1`, `sectionExporter: "scripts/tts/export-narration.mjs"`
  and the same section keys with `sourceSignature`, `wavSha256`,
  `canonicalSha256` (including canonical source metadata), `mp3Sha256`,
  `mp3Bytes`, `sourceDuration`, `timing: "measured"`, and
  `encoding: {codec: "mp3", channels: 1, bitrate: 48000}`. Existing global
  exporter metadata remains separate.
- `prepare-sections-report.json`: `version: 1`, `mode: "sections"`, with
  `published`, `retained`, and `skipped` IDs/reasons; it contains no private paths.

Rerunning the section publisher can retain valid public sections without the
original batch or re-encoding. Global publication through
`scripts/prepare-media.mjs --audio-root /path/to/global-batch` also preserves
these section entries, provenance and MP3 bytes, including when global input is
absent. Retention validates the exact canonical key, section metadata, exporter,
measured timeline, signatures, byte count and MP3 checksum. Invalid canonical
sections are removed from the manifest/provenance and their MP3 is deleted;
global publication never synthesizes or republishes sections from partial input.
Unknown IDs are not retained by global publication. The versioned audio gate
allows the 36 global and 118 section IDs plus the 387 canonical exercise-question
IDs in their separate manifest, rejects unknown/orphan assets, and requires no
external batch for a build. Legacy global scene-measured audio
with estimated cues keeps its existing contract; sections always require
measured cues.

## Gemini Puck Pipeline (CPU)

Requires Node 22.14+ (`node:util` `parseEnv`), root dependencies, FFmpeg and
ffprobe; no Python/CUDA. Freezes all 118 sections, 36 full recaps and 387
question animations from 157 PDF/PEC/fixed/section-example exercises: 541 items,
17,872 cues (2,069 section, 4,051 recap, 11,752 exercise). The current estimate
is 1,907 minutes, about 32 hours; this is not measured synthesized duration. Original
IDs, full visuals, math, context, source metadata and exact cue text survive in
version-1 `catalogue.json`; no narration rewriting or estimated audio timings.
Create the final snapshot only after source wiring and asset versions are stable.
Existing prepared batches are immutable; a new source snapshot must use a new
directory.

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs --prepare /absolute/new-final-batch
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs --status /absolute/new-final-batch
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs --generate /absolute/new-final-batch --ids proporciones--parte-y-total --max-requests 10 --min-interval-ms 15000 --free-tier-confirmed
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs --publish /absolute/new-final-batch --out /absolute/public-staging
node --test /home/aquiluer/Scripts/inferencia-estadistica-uoc/tests/gemini-course.test.mjs
```

Only generation reads `~/.config/inferencia-tts/gemini.env` through `parseEnv`,
selecting **only** `GEMINI_API_KEY_1`. No key rotation, automatic retries, raw response
storage or credential logging. Both network flags are mandatory; confirmation
does not verify billing/free-tier quotas or zero cost. The request bound counts
all new attempts across selected items per invocation, including any explicitly
resumed quota rejection. It does not reset per item. No billing switches are
changed; Free Tier may block completion of the full production batch. Each cue calls `POST
https://generativelanguage.googleapis.com/v1beta/interactions` with
`gemini-3.8-flash-tts`, `Puck`, `store: false` and PCM16/24 kHz mono WAV.
`STYLE`, `speechRequest(text)`, `prepareBatch`, `batchStatus`, `generateBatch`
and `publishBatch` are exported; generation accepts injected `fetchImpl`,
`readKey`, `run`, `now` (epoch milliseconds) and `scheduler` (async milliseconds)
for offline tests. Fake schedulers advance the injected clock without actual
waiting; they do not lower the production interval. Other modes never read keys
or use network.

Generation defaults to **15,000 ms between network request starts (4 RPM)**,
not an extra 15 seconds after each response. Generation-only `--min-interval-ms`
(API: `minIntervalMs`) accepts integers from 15,000 to 2,147,483,647; shorter,
zero, fractional and unsafe values fail before credentials or requests.
Pacing covers all selected items and later invocations against the same batch,
including historical `startedAt` values in version-1 ledgers without pacing
metadata. `progress.json` records `pacing.minIntervalMs`, `lastRequestStartedAt`
and `nextRequestAt`; the next eligible call is saved before waiting. Waiting
does not increment attempts or requests. Slow responses consume the interval,
and completed WAVs are checked and reused without scheduling network calls.
Independent batches/processes sharing a key are not coordinated: run only one
generator for that key. Pacing does not guarantee daily quota availability.

Optional `--ids id1,id2` is generation-only; the API equivalent is
`generateBatch(batch, {ids: ['id1', 'id2'], maxRequests, freeTierConfirmed: true})`.
Use exact animation IDs from the frozen catalogue, including the question ID
for exercises, not a parent exercise ID. IDs must be known, unique, nonempty
and safe; malformed/unknown selections fail before credentials or requests.
Omitting the filter selects all items. Selected items retain catalogue order,
but unselected recaps are skipped, so a first section and a later exercise can
be generated separately or together. Completing a subset leaves batch status
`pending` unless every catalogue item is complete. `request-limit` still means
the invocation bound was reached; completed item/cue counts remain batch-wide.

Batches must be outside Git. Preparation saves input revision/hashes and an
immutable full-animation checksum; no refresh. Resume needs no live course
modules. Atomic/fsync `progress.json` checkpoints store states and numeric
usage, including `total_tokens`, `total_input_tokens`, `total_output_tokens`.
Completed fragments survive local encoding failures without new calls.
Every HTTP 429 immediately stops the current invocation, even with quota
resumption enabled. An ordinary rerun remains blocked. Only a deliberate later
`--generate ... --resume-quota` (API: `resumeQuota: true`) may resume a selected
cue recorded as `quota-limit` with `httpStatus: 429` and no WAV. This represents
a known rejected call, not an ambiguous generation. It uses the same selected
key, still requires `--max-requests` and `--free-tier-confirmed`, and never
retries automatically. The 429 is saved before attempting to parse its body;
invalid/unreadable JSON still leaves a durable rejection. Optional
`providerRateLimit` stores only numeric `retryAfterSeconds` from `Retry-After`,
`retryDelaySeconds` from structured `google.rpc.RetryInfo.retryDelay`, and
allowlisted `google.rpc.QuotaFailure.violations`: `quotaMetric`, `quotaId`,
and `quotaDimensions` keys `model`, `location`, `quota_limit`, `unit`. Values
must be bounded ASCII identifiers, exclude the selected credential and
recognizable API-key strings; numeric delays are bounded to one year.
No raw body, message, description, arbitrary dimensions or exception text is
saved. A violation's `requestLimit` is `RPD`/`RPM` only when `quotaMetric`
explicitly identifies requests per day/minute; neither its ID, description nor
dimensions determines that classification or a billing tier. Unknown stays
unknown, including historic HTTP-only rejections. Provider retry delays extend
`nextRequestAt`; only a later explicit resumption waits for that eligibility,
and a new 429 still stops immediately. Prior rejection records, timestamps and
signatures are appended to that cue's `attemptHistory`; `attempts` and batch
`requests` include all historical calls. Existing one-attempt ledgers remain
valid without migration. No ledger is cleared or requests subtracted.

For the existing `gemini-puck-course-2026-11-10-v1` batch, the first section has
7 completed cues and 9 remaining, including the rejected eighth cue. The latest
HTTP 429 recorded eligibility at 2026-11-11 08:00 UTC. No process is waiting or
scheduled. The first exercise has 18 cues. Run these commands after that time,
in order; run the exercise only after the section finishes successfully and
quota permits:

```sh
node /home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs \
  --generate /home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1 \
  --ids proporciones--parte-y-total --resume-quota --max-requests 9 \
  --min-interval-ms 15000 --free-tier-confirmed

node /home/aquiluer/Scripts/inferencia-estadistica-uoc/scripts/tts/gemini-course.mjs \
  --generate /home/aquiluer/Scripts/TTS/outputs/gemini-puck-course-2026-11-10-v1 \
  --ids ejercicio-pdf-u1-1--a --max-requests 18 \
  --min-interval-ms 15000 --free-tier-confirmed
```

Do not regenerate the catalogue or reset progress. Pipeline implementation,
tests and this guide are not among `sourceFiles`, so these tooling changes do
not invalidate the frozen v1 snapshot. Elapsed minutes and confirmed Free Tier
status do not establish whether the old 429 was RPM or RPD or whether it has reset.

Unresolved calls anywhere in the batch still block generation, including when
outside `--ids`. Network errors, invalid responses, other HTTP errors and
started/received requests without durable WAVs require manual reconciliation;
`--resume-quota` cannot bypass them. A valid durable WAV can be recovered without
another API call. A quota rejection with unexpected audio is also blocked.
There is no automated reconciliation API: never delete history or use a new
batch to bypass an ambiguous call without determining its outcome first.
Stale `.lock` files require manual inspection/removal only after confirming no
writer remains. Preparation/checkpoints stay private (0600).

Each `items/<id>/` has cue WAVs plus `audio.wav`, `audio.mp3`, `audio.json`.
ffprobe measures new/recovered cues; PCM frames determine true global boundaries
with exactly 300 ms inter-cue silence, no trailing padding. MP3: CPU, mono,
48 kbps. `duration` is PCM duration; `mp3Duration` includes encoder padding.
Estimates use 140 words/minute plus silence. Listening and word alignment are
not verified. Completed files match the renderer catalogue/audio contract.

Publish only complete, checksum-valid items matching live hashes/animations;
preserve unrelated entries. Default destination: `static/audio`. Entries use
`manifest.json`/`provenance.json` for sections/recaps and
`exercises-manifest.json`/`exercises-provenance.json` for exercises, all
`{version: 1, lessons: {...}}`. Every published track includes `model`, `voice`,
`canonicalSha256`, `mp3Sha256`, encoded `duration`, PCM `sourceDuration` and
measured `scenes`/`cues`. Hashes agree with provenance and the actual MP3 bytes;
scene boundaries use `sourceDuration`, not encoder padding. Public files are 0644. Genuine Gemini signatures,
WAV/MP3/canonical hashes and encoding pass existing provenance/section retention
guards, without claiming Ming. Legacy retention strips extra provider fields.
The versioned-media gate validates exercise MP3s against their separate manifest,
canonical narration, measured cues and provenance, and rejects corrupt or orphaned
recordings. Publication is atomic per file, not per directory; never run
simultaneous publishers. New sources need a new batch, not an implicit refresh.