## Change — `src/components/landing/tree3d/Sky.tsx`

Update the `day` palette to a fresh blue sky instead of the current yellowish horizon:

```
day: { top: '#7FB5E6', mid: '#CFE6F5', bot: '#E8F1E0' }
```

- `top` — clear cerulean blue at zenith
- `mid` — soft pale blue at horizon (replaces `#FFF2D8` cream which caused the yellow cast)
- `bot` — very light cool green-grey for ground hemisphere (replaces warm beige)

Sunset and night palettes unchanged. Sun sphere color for `day` (`#FFF6D8`) unchanged — it stays a warm sun against the new blue sky.

## Out of scope
No changes to lighting, ground, fog, or any other scene element.
