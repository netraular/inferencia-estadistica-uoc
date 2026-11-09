#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
root_dir=$(cd -- "$source_dir/../../.." && pwd)
media_dir="$root_dir/static/comparativa-videos/manim"
shared_dir="$root_dir/static/comparativa-videos/shared"
mode=${1:-probe}
image=manimcommunity/manim@sha256:ab5ad56cf685d89da96e5d459e0cde3743fbdf2141be4dcff6c26566b5ca3191

[[ "$mode" == probe || "$mode" == full || "$mode" == check ]] || { printf 'Expected: bash render.sh [probe|full|check]\n' >&2; exit 2; }
mkdir -p "$source_dir/.cache/home" "$source_dir/.cache/probe"
active=$(docker ps --filter "volume=$source_dir" --format '{{.ID}}')
[[ -z "$active" ]] || { printf 'An owned render is already active: %s\n' "$active" >&2; exit 3; }
container_id=$(docker run --detach --init --network none --cpus=1 --memory=2g \
  --label implementation=inferencia-comparison-manim \
  --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$source_dir,dst=/work" \
  --mount "type=bind,src=$media_dir,dst=/output" \
  --mount "type=bind,src=$shared_dir,dst=/shared,readonly" \
  --workdir /work --env HOME=/work/.cache/home \
  --env XDG_CACHE_HOME=/work/.cache --env OMP_NUM_THREADS=1 \
  --env RENDER_MODE="$mode" --entrypoint /bin/sh "$image" -c '
    exec > "/work/.cache/$RENDER_MODE-run.log" 2>&1
    trap '\''printf "%s\n" "$?" > "/work/.cache/$RENDER_MODE-exit-code"'\'' EXIT
    set -eu
    interpreter=$(command -v python3)
    "$interpreter" -m py_compile /work/scene.py /work/finish.py /work/inspect_media.py
    if test "$RENDER_MODE" = probe; then
      "$interpreter" -m manim --renderer cairo --disable_caching \
        -r 1280,720 --fps 30 -n 0,0 --media_dir /work/.cache/probe \
        /work/scene.py ProbabilityArea
      "$interpreter" /work/inspect_media.py \
        /work/.cache/probe/videos/scene/720p30/ProbabilityArea.mp4
    else
      if test "$RENDER_MODE" = full; then
        "$interpreter" -m manim --renderer cairo --disable_caching \
          -r 1280,720 --fps 30 --media_dir /work/.cache/full \
          /work/scene.py ProbabilityArea
      fi
      "$interpreter" /work/finish.py
      "$interpreter" /work/inspect_media.py /output/video.mp4
    fi
  ')
printf '%s\n' "$container_id" > "$source_dir/.cache/container-id"
exit_code=$(docker wait "$container_id")
docker rm "$container_id" > /dev/null
printf 'Manim %s completed with exit code %s. Log: %s\n' "$mode" "$exit_code" "$source_dir/.cache/$mode-run.log"
exit "$exit_code"