#!/usr/bin/env bash
# Render both cuts of "Hope vs. Know" and deliver ../hope-vs-know-full-9x16.mp4 and ../hope-vs-know-30s-9x16.mp4 (+ .jpg posters,
# each poster baked in as frame 0).   POSTER_T=2.6 ./deliver.sh
set -euo pipefail
cd "$(dirname "$0")"
WORK=$(pwd)
REPO=/home/user/supabase-kindness-collective
PORT=5175
# a fresh dev server with HMR and file watching off, so no edit anywhere can reload a page mid-render
( cd "$REPO" && PORT=$PORT nohup npx vite --config "$WORK/vite.render.config.mjs" > "$WORK/vite-render.log" 2>&1 & echo $! > "$WORK/vite-render.pid" )
for i in $(seq 1 120); do curl -s -o /dev/null http://127.0.0.1:$PORT/ && break; sleep 0.5; done
export ORIGIN=http://127.0.0.1:$PORT
trap 'pkill -P $(cat "$WORK/vite-render.pid") 2>/dev/null; kill $(cat "$WORK/vite-render.pid") 2>/dev/null || true' EXIT
POSTER_T=${POSTER_T:-2.6}
OUT=..

deliver() {
  local CUT=$1 NAME=$2
  export CUT
  # 1. score: re-synthesize from the film's exported cues, then -14 LUFS / -1.5 dBTP (two-pass)
  node dump-cues.mjs
  python3 music.py "score-$CUT.wav"
  read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i "score-$CUT.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
    | python3 -c "import sys,json,re; d=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0)); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])")
  ffmpeg -y -loglevel error -i "score-$CUT.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 "score-$CUT-norm.wav"
  # 2. picture: 60 fps master, then pairwise blend (180-degree shutter) to 30 fps
  node render.mjs video 60 "video-$CUT-60.mp4"
  ffmpeg -y -loglevel error -i "video-$CUT-60.mp4" -vf "tmix=frames=2,fps=30" -c:v libx264 -preset medium -crf 8 -pix_fmt yuv444p "video-$CUT-30.mp4"
  # 3. poster: a settled frame straight from the composition
  node render.mjs stills "$POSTER_T" >/dev/null
  local POSTER="stills-$CUT/t-$(printf '%.2f' "$POSTER_T").png"
  ffmpeg -y -loglevel error -i "$POSTER" -q:v 2 "$OUT/$NAME.jpg"
  # 4. final encode: the poster replaces frame 0 (same duration, audio stays in sync)
  ffmpeg -y -loglevel error -i "video-$CUT-30.mp4" -loop 1 -i "$POSTER" -i "score-$CUT-norm.wav" \
    -filter_complex "[1:v]format=yuv444p[p];[0:v][p]overlay=enable='eq(n\,0)':shortest=1,format=yuv420p[v]" \
    -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 -r 30 \
    -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT/$NAME.mp4"
  ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$OUT/$NAME.mp4"
  ffmpeg -hide_banner -i "$OUT/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E " I:|Peak:|LRA:"
}
deliver short hope-vs-know-30s-9x16
deliver full hope-vs-know-full-9x16
echo ALL-DONE
