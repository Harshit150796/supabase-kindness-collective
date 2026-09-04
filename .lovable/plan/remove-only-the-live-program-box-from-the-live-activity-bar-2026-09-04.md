# Remove only the "Live program" box from the Live Activity bar

## Change

In the Live Activity bar under the hero, remove just the small box that shows the Zap icon and the words "Live program". Keep everything else in the bar exactly as it is — the live donation feed pill, the donations count, the "raised to date" figure, and the scrolling brand logos all stay.

## Technical notes

- Edit `src/components/landing/LiveActivityBar.tsx`: delete the single block that renders the Zap icon + "Live program" text (the `<div className="flex items-center gap-1.5 md:gap-2">` containing `<Zap ... />`).
- Remove the now-unused `Zap` import from the lucide-react import line at the top of the file.
- No other changes to the bar, the page, or any other file.
