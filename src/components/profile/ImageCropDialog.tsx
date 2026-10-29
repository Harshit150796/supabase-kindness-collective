import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { IMAGE_SPECS, type ImageKind } from '@/lib/profiles';

/**
 * Lets a person position and zoom a photo inside the profile photo circle or the cover band, then
 * exports exactly that view as a WebP of fixed size (480x480 photo, 1500x500 cover).
 */
export function ImageCropDialog({ file, kind, onCancel, onDone }: {
  file: File | null; kind: ImageKind; onCancel: () => void; onDone: (blob: Blob) => Promise<void>;
}) {
  const spec = IMAGE_SPECS[kind];
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!file) { setImg(null); return; }
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => { setImg(el); setZoom(1); setPos({ x: 0, y: 0 }); };
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The image always covers the frame; position is an offset from centre in frame pixels.
  const geometry = useCallback(() => {
    // offsetWidth ignores the dialog's opening scale animation.
    const el = frame.current;
    if (!img || !el || !el.offsetWidth) return null;
    const box = { width: el.offsetWidth, height: el.offsetHeight };
    const base = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const scale = base * zoom;
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    const maxX = (w - box.width) / 2, maxY = (h - box.height) / 2;
    return { box, scale, w, h, maxX, maxY };
  }, [img, zoom]);

  const clamp = useCallback((p: { x: number; y: number }) => {
    const g = geometry();
    if (!g) return p;
    return { x: Math.max(-g.maxX, Math.min(g.maxX, p.x)), y: Math.max(-g.maxY, Math.min(g.maxY, p.y)) };
  }, [geometry]);

  useEffect(() => { setPos((p) => clamp(p)); }, [zoom, clamp]);
  // Re-measure once the frame has its size (and on resize), so the preview always fills it.
  const [, setTick] = useState(0);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  const down = (e: ReactPointerEvent) => { (e.target as Element).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; };
  const move = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    setPos(clamp({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }));
  };
  const up = () => { drag.current = null; };
  const nudge = (dx: number, dy: number) => setPos((p) => clamp({ x: p.x + dx, y: p.y + dy }));

  const save = async () => {
    const g = geometry();
    if (!img || !g) return;
    setSaving(true);
    const canvas = document.createElement('canvas');
    canvas.width = spec.width; canvas.height = spec.height;
    const ctx = canvas.getContext('2d')!;
    const k = spec.width / g.box.width;
    const left = (g.box.width - g.w) / 2 + pos.x, top = (g.box.height - g.h) / 2 + pos.y;
    ctx.drawImage(img, left * k, top * k, g.w * k, g.h * k);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
    if (blob) await onDone(blob);
    setSaving(false);
  };

  const g = img ? geometry() : null;
  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && !saving && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Position your {spec.label}</DialogTitle>
          <DialogDescription>Drag to move it, or use the arrow keys. Zoom with the slider.</DialogDescription>
        </DialogHeader>
        <div
          ref={frame}
          role="img"
          aria-label={`Preview of your ${spec.label}`}
          tabIndex={0}
          onKeyDown={(e) => {
            const d = e.shiftKey ? 24 : 6;
            if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-d, 0); }
            if (e.key === 'ArrowRight') { e.preventDefault(); nudge(d, 0); }
            if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -d); }
            if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, d); }
          }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          className={`relative mx-auto w-full touch-none select-none overflow-hidden bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${kind === 'avatar' ? 'aspect-square max-w-[320px] rounded-full' : 'aspect-[3/1] rounded-md'} cursor-grab active:cursor-grabbing`}
        >
          {img && g && (
            <img src={img.src} alt="" draggable={false} className="pointer-events-none absolute max-w-none"
              style={{ width: g.w, height: g.h, left: (g.box.width - g.w) / 2 + pos.x, top: (g.box.height - g.h) / 2 + pos.y }} />
          )}
          {!img && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /></span>}
        </div>
        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="shrink-0">Zoom</span>
          <Slider min={1} max={3} step={0.01} value={[zoom]} onValueChange={([z]) => setZoom(z)} aria-label="Zoom" />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="min-h-11">Cancel</Button>
          <Button onClick={save} disabled={!img || saving} className="min-h-11">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Save {kind === 'avatar' ? 'photo' : 'cover'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
