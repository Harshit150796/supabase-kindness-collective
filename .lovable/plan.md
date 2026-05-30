
## Goal
Make the coupon fruits ~1.5× bigger so they're readable on the grass (and while hanging/falling).

## Change
Single file: `src/components/landing/tree3d/CouponFruit.tsx`.

Bump the three coupon dimension constants by 1.5×:
- `COUPON_W` `1.15` → `1.725`
- `COUPON_H` `0.74` → `1.11`
- `COUPON_D` `0.05` → `0.075`

These constants drive the rounded geometry, the glow box, the back face, and the HTML overlay scale (`COUPON_W / 920`), so a single change scales the whole coupon consistently in hanging, falling, and landed states.

## Side effects to handle
- `HANG_DROP` stays at `1.0` — coupons will sit slightly lower below the branch (still fine).
- Ground-collision check `posRef.current.y <= groundY + COUPON_H / 2` already uses `COUPON_H`, so it auto-adjusts.
- Tiny floating donor-name badge stays the same size (it uses `distanceFactor`, not coupon dims).
- More coupons may now overlap on the grass; the existing 2.0–9.5 m scatter ring still gives enough space, no change needed.

## Not changed
- Coupon design, colors, brand stripe, fonts.
- Fall physics, sparkle, plant spawning, regrow timing.
- Scatter ring radii, mobile cap, label badge.
