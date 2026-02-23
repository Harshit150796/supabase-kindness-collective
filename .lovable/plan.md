

## Add Harshit Agrawal's Photo to About Page

### What Will Change

The About page currently shows placeholder initials "HA" in a gradient circle for Harshit Agrawal's founder card. This will be replaced with the uploaded photo, properly cropped and sized to look professional.

### Image Handling

- Copy the uploaded image to `src/assets/harshit-agrawal.png`
- Import it as an ES6 module in the About page component for proper bundling

### Cropping and Styling Strategy

The uploaded photo is a full-body shot on stage. To make it work as a founder headshot in the circular frame:

- Use `object-cover` with `object-position: top` to focus on the face and upper body, cropping out the lower body and audience
- Increase the circle size from `w-32 h-32` (128px) to `w-40 h-40` (160px) to give the photo more presence
- Add a subtle border (`ring-4 ring-primary/10`) around the circle for polish
- Keep the existing hover scale effect

### Code Change

**File: `src/pages/About.tsx`**

Replace lines 176-178 (the initials placeholder):
```tsx
<div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
  <span className="text-4xl font-bold text-primary">HA</span>
</div>
```

With an actual image:
```tsx
<div className="w-40 h-40 rounded-full overflow-hidden mb-6 group-hover:scale-105 transition-transform ring-4 ring-primary/10">
  <img 
    src={harshitPhoto} 
    alt="Harshit Agrawal" 
    className="w-full h-full object-cover object-top"
  />
</div>
```

And add the import at the top of the file:
```tsx
import harshitPhoto from '@/assets/harshit-agrawal.png';
```

