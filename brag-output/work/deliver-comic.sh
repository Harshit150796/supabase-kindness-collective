#!/usr/bin/env bash
# Render + deliver a comic film in one format.
#   ./deliver-comic.sh h            -> ../comic/coupon-level1-16x9.mp4 (+ .jpg poster)
#   ./deliver-comic.sh v            -> ../comic/coupon-level1-9x16.mp4
#   FILM=coop ./deliver-comic.sh h  -> ../comic/coupon-coop-16x9.mp4 (Co-op mode)
set -euo pipefail
cd "$(dirname "$0")"
FMT=${1:-h}
FILM=${FILM:-comic}                       # comic = Level 1 (index.html), coop = Co-op mode (coop.html)
if [ "$FILM" = coop ]; then PAGE=coop; SLUG=coupon-coop; DEF_POSTER=2.40; else PAGE=index; SLUG=coupon-level1; DEF_POSTER=20.40; fi
POSTER_T=${POSTER_T:-$DEF_POSTER}
NAME=$SLUG-$([ "$FMT" = v ] && echo 9x16 || echo 16x9)
OUT=../comic
STILLS=stills-$([ "$PAGE" = index ] || echo "$PAGE-")$FMT
mkdir -p "$OUT"
export PAGE

# 1. score (shared by both formats), loudness-normalised to -14 LUFS / -1.5 dBTP
[ -f "$FILM-score.wav" ] || FILM=$FILM python3 comic_music.py "$FILM-score.wav"
read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i "$FILM-score.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | python3 -c "import sys,json,re; d=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0)); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])")
ffmpeg -y -loglevel error -i "$FILM-score.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 "$FILM-score-norm-$FMT.wav"

# 2. picture: 60 fps master, then pairwise blend (180-degree shutter) to 30 fps
node render-comic.mjs "$FMT" video 60 "$FILM-$FMT-60.mp4"
ffmpeg -y -loglevel error -i "$FILM-$FMT-60.mp4" -vf "tmix=frames=2,fps=30" -c:v libx264 -preset medium -crf 8 -pix_fmt yuv444p "$FILM-$FMT-30.mp4"

# 3. poster: a settled frame straight from the composition
node render-comic.mjs "$FMT" stills "$POSTER_T" >/dev/null
POSTER="$STILLS/t-${POSTER_T}.png"
ffmpeg -y -loglevel error -i "$POSTER" -q:v 2 "$OUT/$NAME.jpg"

# 4. final encode with the poster as frame 0 (duration and sync unchanged)
ffmpeg -y -loglevel error -i "$FILM-$FMT-30.mp4" -loop 1 -i "$POSTER" -i "$FILM-score-norm-$FMT.wav" \
  -filter_complex "[1:v]format=yuv444p[p];[0:v][p]overlay=enable='eq(n\,0)':shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 -r 30 \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT/$NAME.mp4"

ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$OUT/$NAME.mp4"
ffmpeg -hide_banner -i "$OUT/$NAME.mp4" -af ebur128 -f null - 2>&1 | grep -A6 "Summary" | grep -E " I:|LRA:"
