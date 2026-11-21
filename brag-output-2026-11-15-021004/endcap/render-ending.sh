#!/usr/bin/env bash
# Render the 15-second ending: picture (60 fps master blended to 30) and its score (-14 LUFS / -1.5 dBTP, two-pass).
# assemble.sh then joins it to the upscaled clip.
set -euo pipefail
cd "$(dirname "$0")"
WORK=$(pwd)
REPO=/home/user/supabase-kindness-collective
PORT=5177
( cd "$REPO" && PORT=$PORT nohup npx vite --config "$WORK/vite.render.config.mjs" > "$WORK/vite-render.log" 2>&1 & echo $! > "$WORK/vite-render.pid" )
for i in $(seq 1 120); do curl -s -o /dev/null http://127.0.0.1:$PORT/ && break; sleep 0.5; done
export ORIGIN=http://127.0.0.1:$PORT CUT=main
trap 'pkill -P $(cat "$WORK/vite-render.pid") 2>/dev/null; kill $(cat "$WORK/vite-render.pid") 2>/dev/null || true' EXIT
node dump-cues.mjs
python3 music.py score-main.wav
read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i score-main.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | python3 -c "import sys,json,re; d=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0)); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])")
ffmpeg -y -loglevel error -i score-main.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 score-main-norm.wav
node render.mjs video 60 video-main-60.mp4
ffmpeg -y -loglevel error -i video-main-60.mp4 -vf "tmix=frames=2,fps=30" -c:v libx264 -preset medium -crf 8 -pix_fmt yuv444p video-main-30.mp4
echo ENDING-DONE
