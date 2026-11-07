window.TL = {
  "name": "checkout",
  "duration": 30,
  "shots": {
    "reader": [0, 1.9], "wait": [1.9, 5.1], "putback": [5.1, 9.4], "cereal": [9.4, 13.0], "face": [13.0, 15.6],
    "donor": [15.6, 17.6], "phone": [17.6, 21.6], "approved": [21.6, 30.0]
  },
  "end": 26.6,
  "taps": { "chip": 0.45, "donate": 1.15, "give": 2.35 },
  "captions": [
    { "t0": 0.5, "t1": 1.88, "text": "Card declined." },
    { "t0": 1.95, "t1": 5.05, "text": "She already knows why." },
    { "t0": 5.15, "t1": 7.25, "text": "So she starts putting things back." },
    { "t0": 7.35, "t1": 9.35, "text": "Not the diapers." },
    { "t0": 9.45, "t1": 11.35, "text": "Then her son puts back his cereal." },
    { "t0": 11.45, "t1": 12.95, "text": "Without being asked." },
    { "t0": 13.05, "t1": 15.5, "text": "For a lot of families, this moment is real.", "theme": "dark" },
    { "t0": 15.65, "t1": 17.55, "text": "On CouponDonation, families can ask for help.", "hl": ["CouponDonation,"] },
    { "t0": 17.65, "t1": 19.55, "text": "Choose what's needed. Give from $10.", "hl": ["$10."] },
    { "t0": 19.65, "t1": 21.55, "text": "100% reaches families. No platform fee.", "hl": ["100%"] },
    { "t0": 21.65, "t1": 23.75, "text": "Your gift becomes gift cards for their stores.", "hl": ["gift", "cards"] },
    { "t0": 23.85, "t1": 26.55, "text": "This time, everything stays.", "hl": ["everything", "stays."] }
  ],
  "headline": "Be the reason it says approved.",
  "fine": "Give from $10 · 100% reaches families · No platform fee",
  "sfx": [
    [0.12, "tick"], [0.3, "tick"], [0.48, "tick"], [0.72, "decline"],
    [6.0, "slide"], [8.35, "slide"], [10.95, "place"],
    [15.6, "whoosh"], [17.6, "whoosh"],
    [18.05, "tap"], [18.75, "tap"], [19.95, "tap"], [20.45, "success"],
    [21.6, "whoosh"], [22.35, "tick"], [22.52, "tick"], [22.69, "tick"], [22.9, "approve"],
    [23.1, "cheer"], [26.6, "sparkle"]
  ],
  "ambience": [["store", 0, 15.6], ["home", 15.6, 21.6], ["store", 21.6, 26.9]],
  "heart": [3.0, 15.4, 0.95],
  "music": "checkout"
};
