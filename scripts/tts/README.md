# Course Audio With Ming

Optional offline tooling for all 36 classroom lectures. It shares the existing
curriculum and lecture exporter; it is not part of the website build or runtime.
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
explicitly refreshes the snapshot; use another output directory for a new course
revision. `--max-scenes` includes reused scenes in its limit.

```sh
python scripts/tts/generate-course.py --status --output /path/to/course-audio
python scripts/tts/generate-course.py --lesson proporciones --max-scenes 1
```

The batch already running from the separate local TTS installation is not
changed by this tooling. Do not start a second generator against its output.
Only switch its entry point after that service finishes or is explicitly stopped.