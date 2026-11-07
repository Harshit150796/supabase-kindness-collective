#!/usr/bin/env bash
# Rebuild every video ad: voices (optional), score, and MP4s in 9:16, 16:9 and 1:1.
#   KOKORO=<dir> ./build.sh [version ...]
# KOKORO, if set, holds kokoro-q8.onnx, voices/ (from kokoro-js) and data/ (config.json, us_gold.json,
# us_silver.json); see README.md. Without it the WAVs already in out/voice/<version>/ are used
# (synthetic or recorded) and only the timings and lip sync are refreshed.
set -euo pipefail
cd "$(dirname "$0")"
versions=("$@")
[ ${#versions[@]} -eq 0 ] && versions=(checkout list pencil bumper)
mkdir -p out/voice out/audio
for v in "${versions[@]}"; do
  if [ -n "${KOKORO:-}" ]; then
    python3 -I voice.py --model "$KOKORO/kokoro-q8.onnx" --voices "$KOKORO/voices" --data "$KOKORO/data" \
      "versions/$v.timeline.js" "out/voice/$v"
  else
    python3 -I voice.py --from-wavs "versions/$v.timeline.js" "out/voice/$v"
  fi
  python3 -I score.py "versions/$v.timeline.js" "out/audio/$v-raw.wav" "out/voice/$v"
  ffmpeg -loglevel error -y -i "out/audio/$v-raw.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 "out/audio/$v.wav"
  node render.mjs "versions/$v.html" 1080 1920 "out/$v-9x16.mp4" "out/audio/$v.wav" &
  node render.mjs "versions/$v.html" 1920 1080 "out/$v-16x9.mp4" "out/audio/$v.wav" &
  node render.mjs "versions/$v.html" 1080 1080 "out/$v-1x1.mp4" "out/audio/$v.wav" &
  wait
  echo "built $v"
done
