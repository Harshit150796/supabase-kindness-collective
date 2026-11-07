# CouponDonation video ads: script

Four illustrated, voiced dramatizations for YouTube and Google Ads. Every film carries the on-screen line
"Dramatization · illustrated characters · synthetic voices". Characters are drawn in code; they are not real
people and are never presented as real beneficiaries. The spoken lines and timings below are the same data the
build uses (`versions/<name>.timeline.js`), so editing a line there changes the film.

**Emotional arc in all four:** a small, everyday moment of going without (recognition), a child or parent
quietly protecting the other (empathy), the viewer handed the means to fix it (agency), the same moment
resolved (relief), then one clear ask.

**Claims used, all true per `AGENTS.md`:** families can ask for help on CouponDonation; donors choose what's
needed and give from $10; 100% of the gift reaches families; no platform fee; a gift becomes gift cards for the
stores chosen; you get a receipt. Not used: tax-deductible, nonprofit or charity, "verified families", retailer
names or partnerships, coupon counts or sizes, statistics.

---

## 1. "Checkout": 30 s (hero)

*Cast: Mom (af_heart), Her son, about 8 (af_sarah, raised 30%), Cashier, off-screen (am_puck), Narrator (af_bella).*

**INT. GROCERY STORE, CHECKOUT – DAY**

Close on the card reader: PROCESSING… then DECLINED, with a low buzz.

> **CASHIER** *(O.S., gently)*: Sorry… it's declined.

Mom freezes. Her son, chin barely over the counter, looks up at her.

> **MOM** *(quiet, to the cashier)*: Okay… let's take a few things off.

She hands back the apples. Her hand hovers over the diapers, trembling.

> **MOM** *(whisper, to herself)*: Not the diapers.

She hands back the eggs instead. The boy looks at the cereal box under his hand, then up at her.

> **SON** *(small)*: Mom… I don't need the cereal.

He slides it over to the things going back. A tear runs down her cheek; she puts a hand on his shoulder.

> **MOM** *(breaking)*: Thank you, baby.

Close on her face, eyes shut, as the music thins to one note.

> **NARRATOR** *(V.O.)*: For a lot of families, this moment is real.

**INT. APARTMENT – MORNING.** A young man at his kitchen island reads his phone; concern turns to resolve.

> **NARRATOR**: On CouponDonation, families can ask for help.

Phone close-up: Fundraisers open now → Food & groceries → Donate → Your gift: $10 → Give $10 → "Thank you for giving."

> **NARRATOR**: Choose what's needed, and give from ten dollars.

**INT. GROCERY STORE, CHECKOUT – ANOTHER DAY.** Mom holds her phone's gift card barcode to the reader. PROCESSING…
APPROVED, with a bright chime. She exhales, eyes closed.

> **CASHIER** *(O.S.)*: You're all set!
>
> **SON** *(jumping, cereal held high)*: We get to keep the cereal?
>
> **MOM** *(laughing through tears)*: We keep everything.

**END CARD:** logo, wordmark, "Be the reason it says approved.", coupondonation.com, "Give from $10 · 100% reaches families · No platform fee".

> **NARRATOR**: Be the reason it says approved.

---

## 2. "The List": 20 s

*Cast: Dad (am_fenrir), His daughter, about 7 (af_aoede, raised 35%), Narrator (af_bella).*

**INT. KITCHEN TABLE – NIGHT.** Top-down: a handwritten grocery list under a lamp. A pen crosses out *apples*.

> **DAD** *(under his breath)*: Apples… not this week.

The pen crosses out *cereal*, then *chicken*.

> **DAD**: Cereal… next time.

Wide: Dad, head in his hand. His daughter pads in wearing pajamas.

> **DAUGHTER** *(sleepy)*: Daddy? Is everything okay?

He slides the list off the table before she can see it, and finds a smile.

> **DAD**: Everything's fine, sweetheart.

**INT. HOME – DAY.** An older woman in glasses reads her phone and softens.

> **NARRATOR**: You can make the list longer again.

Phone close-up: Food & groceries → $10 → Give.

> **NARRATOR**: Choose what's needed, from ten dollars.

Top-down, daylight: the same list, every item checked.

> **NARRATOR**: A hundred percent reaches families.

Kitchen, morning: groceries on the table, the girl holding up a green apple.

> **DAUGHTER**: Apples!
>
> **DAD** *(laughing)*: All of it, sweetheart.

**END CARD:** "Make someone's list longer."

> **NARRATOR**: Make someone's list longer.

---

## 3. "One Pencil": 15 s (School & learning)

*Cast: Her daughter, about 8 (af_heart, raised 28%), Mom (af_sarah), Narrator (af_bella).*

**INT. BEDROOM – NIGHT.** A girl unzips her empty school backpack under a desk lamp and finds a single pencil.

> **GIRL** *(to herself, brave)*: It's okay… one is enough.

Her mom stands in the lit doorway, hand on the frame. She heard.

> **MOM** *(barely)*: Oh, baby…

A young woman picks **School & learning** on her phone and gives $10.

> **NARRATOR**: You can pick School and learning, and give from ten dollars.

**EXT. SCHOOL – MORNING.** The girl walks toward camera with a full backpack, waving.

> **MOM** *(O.S.)*: Have a great day, baby!
>
> **GIRL**: I'm ready!

**END CARD:** "Help a kid walk in ready."

> **NARRATOR**: Help a kid walk in ready.

---

## 4. "Milk or Diapers?": 6 s (YouTube bumper)

*Cast: Mom (af_nicole), Narrator (af_bella).*

**INT. GROCERY AISLE.** A mother behind a cart holds milk in one hand and diapers in the other, looking from one to the other.

> **MOM** *(whisper)*: Milk… or diapers?
>
> **NARRATOR**: No one should have to choose.

**END CARD:** "Help a family today." coupondonation.com

> **NARRATOR**: CouponDonation dot com.

---

## Recording real voices instead

The synthetic voices can be replaced line by line: record each line as `out/voice/<version>/<line id>.wav`
(ids are in the timeline files), keep the timings, and run `./build.sh`. The lips follow whatever audio is there
once `voice.py` timings are refreshed. Anyone who voices a line must agree in writing, and staff or relatives must
be disclosed, as for testimonials.
