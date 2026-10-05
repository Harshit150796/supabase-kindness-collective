#!/usr/bin/env bash
# Mux picture + score into brag.mp4, bake the poster in as frame 0, write brag.jpg.
set -euo pipefail
cd "$(dirname "$0")"
POSTER_T=${POSTER_T:-5.80}
OUT=..

# 1. poster: a settled frame rendered straight from the composition
node render.mjs stills "$POSTER_T" >/dev/null
POSTER="stills/t-${POSTER_T}.png"
ffmpeg -y -loglevel error -i "$POSTER" -q:v 2 "$OUT/brag.jpg"

# 2. loudness: two-pass EBU R128 to -14 LUFS / -1.5 dBTP (web + social standard)
read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i score.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | python3 -c "import sys,json,re; d=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0)); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])")
ffmpeg -y -loglevel error -i score.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 score-norm.wav

# 3. motion blur: average each pair of 60fps samples (180° shutter), keep 30fps
ffmpeg -y -loglevel error -i video-60.mp4 -vf "tmix=frames=2,fps=30" -c:v libx264 -preset medium -crf 8 -pix_fmt yuv444p video-raw.mp4

# 4. final encode: poster replaces frame 0 (same duration, audio stays in sync)
ffmpeg -y -loglevel error -i video-raw.mp4 -loop 1 -i "$POSTER" -i score-norm.wav \
  -filter_complex "[1:v]format=yuv444p[p];[0:v][p]overlay=enable='eq(n\,0)':shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -r 30 \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT/brag.mp4"

ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$OUT/brag.mp4"
ffmpeg -hide_banner -i "$OUT/brag.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E "I:|Peak:|LRA:"
