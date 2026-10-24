#!/bin/bash
# After the opening capture ends start day (butterfly moment); after the night capture ends start the orbit.
cd /home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/captures/hero/scripts
( while kill -0 6106 2>/dev/null; do sleep 5; done; node capture-hero.mjs day 225 1.0 7 - hide 1 butterfly > ../day.log 2>&1 ) &
( while kill -0 6893 2>/dev/null; do sleep 5; done; node capture-orbit.mjs day 120 7 > ../orbit.log 2>&1 ) &
wait
