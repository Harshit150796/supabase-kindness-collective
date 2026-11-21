#!/usr/bin/env bash
# Join the shared clip (Real-ESRGAN upscaled, nothing cut or changed) and the CouponDonation ending.
#   SR_DIR=<upscaled 1080-wide frames, 30 fps>  SRC=<original clip, for its audio>  ./assemble.sh <out.mp4> <poster.jpg>
# The clip keeps its full frame (1080x1784), with black bars to 1080x1920 (9:16). Its audio is unchanged apart from
# loudness (-14 LUFS, like the ending). The ending wipes up over the clip's last 0.4 s and the audio crossfades.
set -euo pipefail
cd "$(dirname "$0")"
OUT=$1 POSTER=$2
N=$(ls "$SR_DIR"/f-*.png | wc -l)
D=$(python3 -c "print(f'{$N/30:.6f}')")
X=0.4
# 1. the clip: upscaled frames at 30 fps, a light temporal smoothing against frame-to-frame shimmer, padded to 9:16
ffmpeg -y -loglevel error -framerate 30 -i "$SR_DIR/f-%05d.png" -vf "hqdn3d=0:0:3:3,pad=1080:1920:0:68:black,format=yuv444p" \
  -c:v libx264 -preset medium -crf 10 clip-hd.mp4
# 2. its audio: the original track, two-pass loudness to -14 LUFS / -1.5 dBTP, padded or trimmed to the picture
read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i "$SRC" -vn -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | python3 -c "import sys,json,re; d=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0)); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])")
ffmpeg -y -loglevel error -i "$SRC" -vn -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true,aresample=48000,apad,atrim=0:$D" -ac 2 clip-audio.wav
# 3. join: the ending wipes up over the clip; audio crossfades over the same 0.4 s
OFFS=$(python3 -c "print(f'{$D-$X:.6f}')")
ffmpeg -y -loglevel error -i clip-hd.mp4 -i video-main-30.mp4 -i clip-audio.wav -i ending-audio-norm.wav \
  -filter_complex "[0:v]settb=1/30,setpts=N/30/TB[a];[1:v]settb=1/30,setpts=N/30/TB[b];[a][b]xfade=transition=wipeup:duration=$X:offset=$OFFS,format=yuv420p[v];[2:a][3:a]acrossfade=d=$X:c1=tri:c2=tri[au]" \
  -map "[v]" -map "[au]" -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 -r 30 -maxrate 14M -bufsize 28M \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$OUT"
# 4. a cover image: the clip's title card, upscaled
ffmpeg -y -loglevel error -ss 1.5 -i clip-hd.mp4 -frames:v 1 -q:v 2 "$POSTER"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E " I:|Peak:|LRA:"
echo ASSEMBLED
