import { useEffect, useRef, useState } from 'react';
import { Undo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Box } from '@/lib/receiptImage';

/** Draw black boxes over private details. Boxes are stored as fractions of the image. */
export function ReceiptRedactor({ bitmap, boxes, onChange }: { bitmap: ImageBitmap; boxes: Box[]; onChange: (b: Box[]) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const w = Math.min(560, bitmap.width), h = Math.round((w / bitmap.width) * bitmap.height);
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    ctx.fillStyle = '#000';
    for (const b of [...boxes, ...(draft ? [draft] : [])]) ctx.fillRect(b.x * w, b.y * h, b.w * w, b.h * h);
  }, [bitmap, boxes, draft]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const toBox = (a: { x: number; y: number }, b: { x: number; y: number }): Box => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Drag to cover your <strong>address, card numbers, phone number and names</strong>. Black boxes are permanent in the saved copy. Location data in the photo is removed automatically.</p>
      <canvas
        ref={ref}
        className="w-full touch-none rounded-md bg-muted cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); start.current = pos(e); }}
        onPointerMove={(e) => { if (start.current) setDraft(toBox(start.current, pos(e))); }}
        onPointerUp={(e) => {
          if (start.current) { const b = toBox(start.current, pos(e)); if (b.w > 0.01 && b.h > 0.01) onChange([...boxes, b]); }
          start.current = null; setDraft(null);
        }}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!boxes.length} onClick={() => onChange(boxes.slice(0, -1))}><Undo2 className="mr-1 h-3.5 w-3.5" />Undo</Button>
        <Button type="button" size="sm" variant="ghost" disabled={!boxes.length} onClick={() => onChange([])}><Trash2 className="mr-1 h-3.5 w-3.5" />Clear boxes</Button>
      </div>
    </div>
  );
}
