import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Lock } from 'lucide-react';

const RATIO = 16 / 10;
const MIN_EDGE = 800;

export function PhotoGuidance({ className = '' }: { className?: string }) {
  return (
    <ul className={`grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2 ${className}`}>
      <li>Natural light, no heavy filters.</li>
      <li>Show the person or the need clearly.</li>
      <li>Nothing private: no IDs, documents or addresses.</li>
      <li>Ask everyone pictured for their consent.</li>
    </ul>
  );
}

type Pending = { file: File; resolve: (f: File | null) => void };

/** Returns `cropFile(file)` which opens a 16:10 crop dialog and resolves to the cropped File (or null if cancelled). */
export function usePhotoCropper(): { cropFile: (file: File) => Promise<File | null>; dialog: ReactNode } {
  const [pending, setPending] = useState<Pending | null>(null);
  const cropFile = useCallback((file: File) => new Promise<File | null>((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return resolve(file);
    setPending({ file, resolve });
  }), []);
  const close = (f: File | null) => { pending?.resolve(f); setPending(null); };
  return { cropFile, dialog: pending ? <CropDialog file={pending.file} onDone={close} /> : null };
}

function CropDialog({ file, onDone }: { file: File; onDone: (f: File | null) => void }) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  useEffect(() => { const i = new Image(); i.onload = () => setImg(i); i.src = url; return () => URL.revokeObjectURL(url); }, [url]);

  // Crop rectangle in source pixels.
  const rect = (() => {
    if (!img) return null;
    const w0 = img.naturalWidth, h0 = img.naturalHeight;
    let cw = w0, ch = w0 / RATIO;
    if (ch > h0) { ch = h0; cw = h0 * RATIO; }
    cw /= zoom; ch /= zoom;
    return { sx: (w0 - cw) * pos.x, sy: (h0 - ch) * pos.y, cw, ch };
  })();
  const lowRes = rect ? Math.min(rect.cw, rect.ch) < MIN_EDGE : false;
  const style = img && rect ? (() => {
    const scale = 100 / rect.cw; // percent of frame width per source px
    return { width: `${img.naturalWidth * scale}%`, left: `${-rect.sx * scale}%`, top: `${-rect.sy * scale * RATIO}%` };
  })() : {};

  const onPointerDown = (e: React.PointerEvent) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !frame.current || !img || !rect) return;
    const fw = frame.current.clientWidth; const k = rect.cw / fw;
    const spareX = img.naturalWidth - rect.cw, spareY = img.naturalHeight - rect.ch;
    const nx = spareX > 0 ? drag.current.px - ((e.clientX - drag.current.x) * k) / spareX : 0.5;
    const ny = spareY > 0 ? drag.current.py - ((e.clientY - drag.current.y) * k) / spareY : 0.5;
    setPos({ x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) });
  };

  const save = async () => {
    if (!img || !rect) return;
    const outW = Math.min(1600, Math.round(rect.cw));
    const c = document.createElement('canvas'); c.width = outW; c.height = Math.round(outW / RATIO);
    c.getContext('2d')?.drawImage(img, rect.sx, rect.sy, rect.cw, rect.ch, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.92));
    onDone(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Frame your photo</DialogTitle>
          <DialogDescription>Drag to position and use the slider to zoom. This is exactly how your card will look.</DialogDescription>
        </DialogHeader>
        <div ref={frame} className="relative aspect-[16/10] w-full cursor-grab touch-none overflow-hidden bg-muted active:cursor-grabbing" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => (drag.current = null)}>
          {img && <img src={url} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={style} />}
        </div>
        <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={([z]) => setZoom(z)} aria-label="Zoom" />
        {lowRes && (
          <p className="flex items-start gap-2 text-sm text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />This photo is a little small and may look blurry on large screens. A sharper photo (at least {MIN_EDGE}px on its short side) helps donors connect. You can still use it.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
          <div className="overflow-hidden bg-background">
            <div className="aspect-[16/10] overflow-hidden bg-muted">{img && rect && <canvas className="h-full w-full" ref={(c) => { if (c) { c.width = 320; c.height = 200; c.getContext('2d')?.drawImage(img, rect.sx, rect.sy, rect.cw, rect.ch, 0, 0, 320, 200); } }} />}</div>
            <div className="pt-2"><div className="h-1 bg-primary/10"><div className="h-full w-1/3 bg-primary" /></div><p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3 text-accent" />Coupon-locked</p></div>
          </div>
          <PhotoGuidance className="sm:grid-cols-1" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onDone(null)}>Cancel</Button>
          <Button onClick={save} disabled={!img}>Use this photo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
