

## Add Paul Savluc's Photo to About Page

### What Will Change

Paul Savluc's founder card currently shows placeholder initials "PS" in a gradient circle (line 210). This will be replaced with the uploaded photo, processed into a passport-style headshot.

### Image Processing

The uploaded photo shows Paul outdoors with a castle/buildings in the background. To create a professional passport-style headshot:

- Use the AI image editing API to crop tightly to face and shoulders, removing the castle background, and upscale the resolution
- Save the processed image to `src/assets/paul-savluc.png`

### Code Changes

**File: `src/pages/About.tsx`**

1. Add import at the top:
```tsx
import paulPhoto from '@/assets/paul-savluc.png';
```

2. Replace the placeholder (lines 210-212) from:
```tsx
<div className="w-32 h-32 rounded-full bg-gradient-to-br from-gold/20 to-primary/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
  <span className="text-4xl font-bold text-gold">PS</span>
</div>
```

To match Harshit's styling:
```tsx
<div className="w-40 h-40 rounded-full overflow-hidden mb-6 group-hover:scale-105 transition-transform ring-4 ring-primary/10">
  <img 
    src={paulPhoto} 
    alt="Paul Savluc" 
    className="w-full h-full object-cover object-top"
  />
</div>
```

This makes both founder cards consistent in size (160px) and styling, with professional headshot photos.

