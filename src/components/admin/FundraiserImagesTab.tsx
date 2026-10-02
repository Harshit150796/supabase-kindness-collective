import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sb, adminWrite, rpc } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Upload, Star, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BUCKET = 'fundraiser-covers';

/** Gallery manager inside the admin fundraiser drawer; all writes are role-checked and audited server-side. */
export function FundraiserImagesTab({ fundraiser, canWrite }: { fundraiser: any; canWrite: boolean }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<any | null>(null);
  const id = fundraiser.id;
  const q = useQuery({
    queryKey: ['adm-fr-images', id],
    queryFn: async () => {
      const { data, error } = await sb.from('fundraiser_images').select('*').eq('fundraiser_id', id).order('display_order').range(0, 49);
      if (error) throw new Error(error.message);
      return data as any[];
    },
  });
  const imgs = q.data ?? [];
  const refresh = () => { q.refetch(); qc.invalidateQueries({ queryKey: ['adm-fr-detail', id] }); };
  const fail = (e: unknown) => toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' });
  const setCover = (url: string | null) => rpc('admin_update_fundraiser', { _id: id, _patch: { cover_photo_url: url } });

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    let count = imgs.length;
    for (const file of Array.from(files).slice(0, MAX_IMAGES - imgs.length)) {
      if (!file.type.startsWith('image/')) { toast({ title: 'Only image files are allowed', variant: 'destructive' }); continue; }
      if (file.size > MAX_FILE_SIZE) { toast({ title: 'Image must be under 5MB', variant: 'destructive' }); continue; }
      try {
        const name = `${id}/${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from(BUCKET).upload(name, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(name);
        await adminWrite('fundraiser_images', 'insert', null, { fundraiser_id: id, image_url: publicUrl, display_order: count, is_primary: count === 0 });
        if (count === 0 && !fundraiser.cover_photo_url) await setCover(publicUrl);
        count++;
      } catch (e) { fail(e); }
    }
    if (input.current) input.current.value = '';
    setBusy(false); refresh();
  };

  const makePrimary = async (img: any) => {
    setBusy(true);
    try {
      const others = imgs.filter((i) => i.id !== img.id && i.is_primary).map((i) => i.id);
      if (others.length) await adminWrite('fundraiser_images', 'update', others, { is_primary: false });
      await adminWrite('fundraiser_images', 'update', [img.id], { is_primary: true });
      await setCover(img.image_url);
      toast({ title: 'Cover photo updated' });
    } catch (e) { fail(e); }
    setBusy(false); refresh();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = imgs[idx], b = imgs[idx + dir];
    if (!a || !b) return;
    setBusy(true);
    try {
      await adminWrite('fundraiser_images', 'update', [a.id], { display_order: idx + dir });
      await adminWrite('fundraiser_images', 'update', [b.id], { display_order: idx });
    } catch (e) { fail(e); }
    setBusy(false); refresh();
  };

  const remove = async () => {
    const img = del; setDel(null); setBusy(true);
    try {
      await adminWrite('fundraiser_images', 'delete', [img.id]);
      const path = img.image_url.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      const rest = imgs.filter((i) => i.id !== img.id);
      if (img.is_primary && rest[0]) await adminWrite('fundraiser_images', 'update', [rest[0].id], { is_primary: true });
      if (fundraiser.cover_photo_url === img.image_url) await setCover(rest[0]?.image_url ?? null);
      toast({ title: 'Image removed' });
    } catch (e) { fail(e); }
    setBusy(false); refresh();
  };

  if (q.isLoading) return <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded bg-muted" />)}</div>;
  if (q.error) return <div className="flex items-center gap-2 py-6 text-sm">Couldn't load images. <Button size="sm" variant="outline" onClick={() => q.refetch()}>Try again</Button></div>;

  return (
    <div className="space-y-4">
      {fundraiser.cover_photo_url && !imgs.some((i) => i.image_url === fundraiser.cover_photo_url) && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Current cover photo (not in gallery)</p>
          <div className="flex items-end gap-2">
            <div className="aspect-[4/3] w-40 overflow-hidden rounded bg-muted/30"><img src={fundraiser.cover_photo_url} alt="" className="h-full w-full object-contain" /></div>
            {canWrite && <Button size="sm" variant="ghost" disabled={busy} onClick={async () => { try { await setCover(imgs[0]?.image_url ?? null); toast({ title: 'Cover photo removed' }); } catch (e) { fail(e); } refresh(); }}><Trash2 className="mr-1 h-3.5 w-3.5" />Remove cover</Button>}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {imgs.map((i, idx) => (
          <div key={i.id} className="space-y-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded bg-muted/30">
              <img src={i.image_url} alt="" className="h-full w-full object-contain" />
              {i.is_primary && <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] text-ink-foreground">Cover</span>}
            </div>
            {canWrite && (
              <div className="flex flex-wrap items-center gap-1">
                {!i.is_primary && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={busy} onClick={() => makePrimary(i)}><Star className="mr-1 h-3 w-3" />Make cover</Button>}
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy || idx === 0} onClick={() => move(idx, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy || idx === imgs.length - 1} onClick={() => move(idx, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={busy} onClick={() => setDel(i)} aria-label="Remove image"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        ))}
        {!imgs.length && <p className="col-span-3 py-6 text-center text-sm text-muted-foreground">No gallery photos yet.</p>}
      </div>
      {canWrite && imgs.length < MAX_IMAGES && (
        <>
          <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}><Upload className="mr-1.5 h-4 w-4" />{busy ? 'Saving…' : `Upload photos (${MAX_IMAGES - imgs.length} left)`}</Button>
        </>
      )}
      {!canWrite && <p className="text-xs text-muted-foreground">You have view-only access.</p>}
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this photo?</AlertDialogTitle><AlertDialogDescription>The photo is removed from the fundraiser and from storage. The change is recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
