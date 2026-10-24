#!/usr/bin/env bash
# Render the launch film and deliver ../brag.mp4 (+ ../brag.jpg poster baked in as frame 0).
#   POSTER_T=43.0 ./deliver.sh
set -euo pipefail
cd "$(dirname "$0")"
# a fresh dev server with HMR and file watching off, so no edit anywhere can reload a page mid-render
SP=/tmp/claude-0/-home-user-supabase-kindness-collective/9ba5aa8e-8f06-5c81-9b81-3ecd1b2b25b5/scratchpad
PORT=5175
( cd /home/user/supabase-kindness-collective && sed 's/port: 5174/port: '$PORT'/' $SP/vite.capture.config.mjs > $SP/vite.render.config.mjs && nohup npx vite --config $SP/vite.render.config.mjs > $SP/vite-render.log 2>&1 & echo $! > $SP/vite-render.pid )
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:$PORT/ && break; sleep 0.5; done
export ORIGIN=http://127.0.0.1:$PORT
trap 'pkill -P $(cat $SP/vite-render.pid) 2>/dev/null; kill $(cat $SP/vite-render.pid) 2>/dev/null || true' EXIT
POSTER_T=${POSTER_T:-41.80}
OUT=..

# 1. score: re-synthesize from the film's exported cue table, then -14 LUFS / -1.5 dBTP (two-pass)
node dump-cues.mjs
python3 music.py score.wav
read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i score.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | python3 -c "import sys,json,re; d=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0)); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])")
ffmpeg -y -loglevel error -i score.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 score-norm.wav

# 2. picture: 60 fps master, then pairwise blend (180-degree shutter) to 30 fps
node render.mjs video 60 video-60.mp4
ffmpeg -y -loglevel error -i video-60.mp4 -vf "tmix=frames=2,fps=30" -c:v libx264 -preset medium -crf 8 -pix_fmt yuv444p video-30.mp4

# 3. poster: a settled frame straight from the composition
node render.mjs stills "$POSTER_T" >/dev/null
POSTER="stills/t-${POSTER_T}.png"
ffmpeg -y -loglevel error -i "$POSTER" -q:v 2 "$OUT/brag.jpg"

# 4. final encode: the poster replaces frame 0 (same duration, audio stays in sync)
ffmpeg -y -loglevel error -i video-30.mp4 -loop 1 -i "$POSTER" -i score-norm.wav \
  -filter_complex "[1:v]format=yuv444p[p];[0:v][p]overlay=enable='eq(n\,0)':shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 -r 30 \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT/brag.mp4"

ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$OUT/brag.mp4"
ffmpeg -hide_banner -i "$OUT/brag.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E " I:|Peak:|LRA:"
