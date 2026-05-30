## Change — `src/components/landing/tree3d/Sky.tsx`

Apply the "Soft Dawn" palette to the `day` sky:

```
day: { top: '#7FB5E6', mid: '#F5D5A8', bot: '#FFE8C8' }
```

- `top` — clear sky blue at zenith
- `mid` — warm peach near horizon (yellow-blue gradient mix)
- `bot` — soft cream for ground hemisphere

Sunset and night palettes unchanged. Sun sphere color unchanged.

## Out of scope
No changes to lighting, ground, fog, or any other scene element.
