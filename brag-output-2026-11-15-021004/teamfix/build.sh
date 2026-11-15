#!/usr/bin/env bash
# Patch the team's export (lv_0_20261113230237.mp4) into ../team-video-improved-9x16.mp4.
#   SRC=/path/to/team.mp4 HOOK=/path/to/hookplate.mp4 ./build.sh
# HOOK is the first 3 s of the Hope vs. Know composition (work: CUT=full node render.mjs video 30 hookplate.mp4 0 3).
set -euo pipefail
cd "$(dirname "$0")"
SRC=${SRC:?path to the team export}; HOOK=${HOOK:?path to hookplate.mp4}
OURS=../hope-vs-know-full-9x16.mp4; SCORE=../work/score-full-norm.wav; OUT=../team-video-improved-9x16.mp4
ffmpeg -y -loglevel error -i "$SRC" -i "$HOOK" -ss 35.5 -t 8.1 -i "$OURS" \
  -loop 1 -i ov/zeffy.png -loop 1 -i ov/campaigns.png -loop 1 -i ov/hoax.png -loop 1 -i ov/four.png -loop 1 -i ov/trail.png -loop 1 -i ov/end.png \
  -ss 50.9 -t 5.1 -i "$SCORE" -filter_complex "
  [0:v]scale=1080:1920:flags=lanczos,fps=30,split[b0][bb];
  [bb]crop=250:120:275:355,boxblur=22:2[blur];
  [1:v]trim=end=2.8,crop=857:470:111:420,scale=1080:578,tpad=stop_mode=clone:stop_duration=4[hook];
  [2:v]fps=30,crop=1080:598:0:284,setpts=(9.8/8.1)*(PTS-STARTPTS)+50.03/TB[prod];
  [b0][hook]overlay=0:0:enable='lt(t,5.73)':eof_action=pass[v1];
  [v1][blur]overlay=275:355:enable='between(t,38.37,40.43)'[v2];
  [v2][prod]overlay=0:0:enable='between(t,50.03,59.83)':eof_action=pass[v3];
  [v3][3:v]overlay=enable='between(t,3.2,5.7)'[v4];
  [v4][4:v]overlay=enable='between(t,11.1,14.8)'[v5];
  [v5][5:v]overlay=enable='between(t,14.8,17.03)'[v6];
  [v6][6:v]overlay=enable='between(t,19.6,23.5)'[v7];
  [v7][7:v]overlay=enable='between(t,50.4,59.83)'[v8];
  [v8][8:v]overlay=enable='gte(t,71.3)',trim=start=0.1:end=75.07,setpts=PTS-STARTPTS[v];
  [0:a]aresample=48000,atrim=start=0.1,asetpts=PTS-STARTPTS[a0];
  [9:a]aresample=48000,volume=0.7,adelay=70500:all=1[sting];
  [a0][sting]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-13:TP=-2:LRA=11,alimiter=limit=0.84:level=disabled,atrim=end=74.97[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size -of compact "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E " I:|Peak:"
