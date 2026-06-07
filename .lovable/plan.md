Root cause findings:

1. The live tracking bar itself is no longer lazy-loaded or remounted, but it still contains mobile-running blink animations: `animate-pulse`, `animate-ping`, and a pulsing heart.
2. The hero above it uses `h-[62vh]`. On mobile Safari/Chrome, the browser URL bar changes viewport height while swiping. The session replay confirms repeated viewport height changes and hero height recalculation, which makes the live tracking bar jump in and out of view and look like it disappears.
3. The tree canvas is still rendering continuously on mobile while the user scrolls, so when the hero height changes it forces canvas/layout work right above the live tracking bar.
4. The live tracking text updates every 3 seconds, which is acceptable on desktop, but on mobile during scroll it adds extra DOM text changes in the exact area the user is watching.

Plan to fix:

1. Stabilize the hero height on mobile
   - Replace mobile `vh` sizing with stable mobile viewport sizing (`svh`) plus a max-height clamp so browser chrome hide/show does not resize the tree area during swipes.
   - Keep desktop hero height unchanged.

2. Make the live tracking bar visually stable on mobile
   - Remove `animate-ping` and `animate-pulse` from the live dot and heart on mobile.
   - Keep a static live indicator on mobile; keep subtle animation only on desktop if needed.
   - Give the live tracking row a stable min-height so text changes cannot cause vertical movement.

3. Pause live text rotation while the user is actively scrolling on mobile
   - Add a small mobile scroll guard in `LiveActivityBar`: when scroll/touch movement is happening, keep the current donation text fixed.
   - Resume updates shortly after scrolling stops.
   - This prevents the text from changing mid-swipe and appearing like a blink/disappear.

4. Reduce tree work while scrolling on mobile
   - Detect mobile scroll activity in `Tree3DScene` and switch the canvas frameloop to `demand` while scrolling, then resume after scroll settles.
   - This reduces visual jank directly above the live bar without removing the tree.

5. Verify on mobile viewport
   - Test the `/` route at mobile size.
   - Swipe around the bottom of the tree/live tracking boundary and confirm the bar stays present, stable, and non-blinking.