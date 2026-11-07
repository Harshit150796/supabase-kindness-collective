# CouponDonation video ads

Four illustrated, voiced story ads (and the earlier receipt-only ad), built entirely in code: characters are
drawn in SVG, voices are synthesised offline, music and sound effects are synthesised in numpy. Nothing needs a
license and no real person's likeness or voice is used. Every story film says on screen
"Dramatization · illustrated characters · synthetic voices". The screenplay is in [SCRIPT.md](SCRIPT.md).

| Version | Length | Story | Best placement |
|---|---|---|---|
| `checkout` | 30 s | Card declined; Mom puts things back; her son gives up his cereal. Next time: approved. | YouTube in-stream, Demand Gen (hero) |
| `list` | 20 s | Dad crosses things off the grocery list at night and hides it from his daughter. Then every item is checked. | In-stream, Shorts |
| `pencil` | 15 s | The night before school a girl has one pencil. In the morning she walks in ready. Pushes School & learning. | Shorts, in-stream (non-skippable max is 15 s) |
| `bumper` | 6 s | "Milk… or diapers?" | YouTube bumper (6 s max) |

Each comes as `out/<version>-9x16.mp4` (Shorts, phone placements), `-16x9.mp4` (in-stream) and `-1x1.mp4`
(Demand Gen, feeds). Captions and spoken-line subtitles are burned in, so the ads work muted.

The older receipt-only ad ("What do you put back?") is `ad.html` with `soundtrack.py`; its files are
`out/coupondonation-ad-9x16.mp4` and `out/coupondonation-ad-16x9.mp4`.

## Claims

Only claims `AGENTS.md` states as true are used: families can ask for help; you choose what's needed and give from
$10; 100% of the gift reaches families; no platform fee; a gift becomes gift cards for the stores chosen; you get a
receipt. No tax-deductible, nonprofit/charity, "verified families", retailer names, coupon counts or statistics.

## How it is built

- `versions/<name>.timeline.js`: shots, spoken lines (who, text, start time), sound cues, end card. The single
  source of timing for picture, voices and score.
- `versions/<name>.html`: the choreography (poses, expressions, props, camera) for each shot.
- `lib/`: `stage.js` (camera, captions and subtitles, end card), `cast.js` (characters with lip sync and props),
  `sets.js` (store, kitchen, bedroom, street, phone close-up of the donate flow), `shots.js` (shared donor/phone
  shots), `stage.css`.
- `voice.py`: makes each spoken line with the open Kokoro-82M voice model (Apache-2.0) on onnxruntime, and writes
  `versions/<name>.voice.js` (real line timings plus a 30 fps mouth envelope the characters lip-sync to).
- `score.py`: piano/pad/bell score, foley (card reader, heartbeat, clock, pencil, birds…), ambience, the voices,
  and ducking of the music under speech.
- `render.mjs`: headless Chromium renders every frame and pipes it to ffmpeg.
- `build.sh`: all of the above for every version and aspect ratio (loudness normalised to -16 LUFS).

```bash
./build.sh                 # all versions, using the voice files in out/voice/
./build.sh pencil bumper   # just these
```

Stills for checking a change: `node render.mjs versions/checkout.html 540 960 --stills /tmp/stills 3 12 24`.

### Changing a line of dialogue

Edit the line in `versions/<name>.timeline.js`, then re-synthesise it. That needs the voice model files, which are
not in the repo (88 MB):

- `kokoro-q8.onnx`: the six `kokoro-q8.part*.bin` files from the npm package `kokoro-q8-shards@1.0.0` joined in
  order (sha256 `fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478`).
- `voices/`: the `voices/*.bin` files from the npm package `kokoro-js@1.2.1`.
- `data/`: `config.json` from the `kokoro-onnx` wheel and `us_gold.json`, `us_silver.json` from the `misaki`
  wheel (pronunciation dictionaries; `voice.py` reads them as data and does its own lookup).

```bash
KOKORO=/path/to/that/folder ./build.sh checkout
```

`onnxruntime` and `numpy` must be installed. Words missing from the dictionaries stop the build with a message;
add them to `OVERRIDES` in `voice.py`.

### Using recorded voices instead

Record each line as `out/voice/<version>/<line id>.wav` (ids are in the timeline files) and run `./build.sh`
without `KOKORO`: timings and lip sync are refreshed from the recordings. Anyone recorded must agree in writing;
staff or relatives must be disclosed.

## Running them on Google Ads

Google Ads plays video from YouTube: upload the files to the CouponDonation channel (unlisted is fine), link the
channel in Google Ads, and create a Video or Demand Gen campaign. Suggested landing URL:
`https://coupondonation.com/donate?utm_source=youtube&utm_medium=video&utm_campaign=<version>`
(`pencil` can land on `/donate?…` too; donors then pick School & learning). The characters are animated, so
YouTube's altered-content label is not required, but the on-screen "Dramatization" line stays.
