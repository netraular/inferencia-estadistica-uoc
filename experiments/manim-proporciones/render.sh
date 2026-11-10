#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
node "$project/prepare.mjs"
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -e COURSE_AUDIO=/audio \
  -v "$project:/manim" -v "$project/../../static/audio:/audio:ro" -w /manim \
  manimcommunity/manim:v0.19.0 \
  manim --resolution 1280,720 --fps 30 --disable_caching --progress_bar none \
  --media_dir .cache/media --output_file proporciones scene.py Proporciones
install -m 644 "$project/.cache/media/videos/scene/720p30/proporciones.mp4" \
  "$project/artifacts/proporciones.mp4"
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -e COURSE_AUDIO=/audio \
  -v "$project:/manim" -v "$project/../../static/audio:/audio:ro" -w /manim \
  manimcommunity/manim:v0.19.0 python verify.py