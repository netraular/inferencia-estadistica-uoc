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
allows only the 36 global and 118 section IDs, rejects unknown/orphan assets,
and requires no external batch for a build. Legacy global scene-measured audio
with estimated cues keeps its existing contract; sections always require
measured cues.