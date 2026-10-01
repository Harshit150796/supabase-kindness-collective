import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { sb, adminWrite, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Search, Upload, Star, Trash2, ExternalLink } from 'lucide-react';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Fundraiser photo manager. Status, edits, archive and deletion live in Admin → Fundraisers;
 * this page only manages gallery images, and every change goes through the audited admin_write action.
 */
export default function AdminFundraisersLegacy() {
  const { canWrite, isAdmin } = useTeamRole();
  const t = useAdminPaged({ table: 'fundraisers', select: 'id,title,unique_slug,status,created_at,cover_photo_url', searchCols: ['title', 'unique_slug'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const [open, setOpen] = useState<any | null>(null);
  const cols: Column<any>[] = [
    { key: 'title', header: 'Fundraiser', sortable: true, cell: (f) => <div className="max-w-[420px]"><p className="truncate font-medium text-foreground">{f.title}</p><p className="truncate text-xs text-muted-foreground">/f/{f.unique_slug}</p></div> },
    { key: 'status', header: 'Status', sortable: true, cell: (f) => <StatusBadge value={f.status} /> },
    { key: 'created_at', header: 'Created', sortable: true, cell: (f) => fmtDate(f.created_at) },
  ];
  return (
    <DashboardLayout>
      <PageHeader title="Fundraiser photos" description="Manage gallery images (up to three per fundraiser). Status, edits and archiving are in Fundraisers."
        actions={<Button size="sm" variant="outline" asChild><Link to="/admin/fundraisers">Open Fundraisers</Link></Button>} />
      <div className="relative mb-3 w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search title or link" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={setOpen} empty="No fundraisers match." />
      <ImagesDrawer f={open} onClose={() => setOpen(null)} canWrite={canWrite} isAdmin={isAdmin} />
    </DashboardLayout>
  );
}

function ImagesDrawer({ f, onClose, canWrite, isAdmin }: { f: any | null; onClose: () => void; canWrite: boolean; isAdmin: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<any | null>(null);
  const q = useQuery({
    queryKey: ['adm-fr-images', f?.id], enabled: !!f,
    queryFn: async () => {
      const { data, error } = await sb.from('fundraiser_images').select('*').eq('fundraiser_id', f.id).order('display_order').range(0, 49);
      if (error) throw new Error(error.message);
      return data as any[];
    },
  });
  const imgs = q.data ?? [];
  const fail = (e: unknown) => toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' });

  const upload = async (files: FileList | null) => {
    if (!files || !f) return;
    setBusy(true);
    let count = imgs.length;
    for (const file of Array.from(files).slice(0, MAX_IMAGES - imgs.length)) {
      if (!file.type.startsWith('image/')) { toast({ title: 'Invalid file type', variant: 'destructive' }); continue; }
      if (file.size > MAX_FILE_SIZE) { toast({ title: 'Image must be under 5MB', variant: 'destructive' }); continue; }
      try {
        const name = `${f.id}/${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('fundraiser-covers').upload(name, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('fundraiser-covers').getPublicUrl(name);
        await adminWrite('fundraiser_images', 'insert', null, { fundraiser_id: f.id, image_url: publicUrl, display_order: count, is_primary: count === 0 });
        count++;
      } catch (e) { fail(e); }
    }
    setBusy(false); q.refetch();
  };
  const makePrimary = async (id: string) => {
    try {
      const others = imgs.filter((i) => i.id !== id && i.is_primary).map((i) => i.id);
      if (others.length) await adminWrite('fundraiser_images', 'update', others, { is_primary: false });
      await adminWrite('fundraiser_images', 'update', [id], { is_primary: true });
      toast({ title: 'Cover photo updated' }); q.refetch();
    } catch (e) { fail(e); }
  };
  const remove = async () => {
    const img = del; setDel(null);
    try {
      await adminWrite('fundraiser_images', 'delete', [img.id]);
      const path = img.image_url.split('/fundraiser-covers/')[1];
      if (path) await supabase.storage.from('fundraiser-covers').remove([path]);
      const rest = imgs.filter((i) => i.id !== img.id);
      if (img.is_primary && rest[0]) await adminWrite('fundraiser_images', 'update', [rest[0].id], { is_primary: true });
      toast({ title: 'Image removed' }); q.refetch();
    } catch (e) { fail(e); }
  };

  return (
    <Sheet open={!!f} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {f && <div className="space-y-4">
          <SheetHeader><SheetTitle className="text-left font-serif text-2xl font-normal">{f.title}</SheetTitle></SheetHeader>
          <a className="inline-flex items-center gap-1 text-sm text-primary" href={`/f/${f.unique_slug}`} target="_blank" rel="noreferrer">Public page <ExternalLink className="h-3 w-3" /></a>
          {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : q.error ? <div className="text-sm">Couldn't load images. <Button size="sm" variant="outline" onClick={() => q.refetch()}>Try again</Button></div> : (
            <div className="grid grid-cols-3 gap-2">
              {imgs.map((i) => (
                <div key={i.id} className="space-y-1">
                  <div className="relative aspect-[4/3] overflow-hidden rounded bg-muted/30"><img src={i.image_url} alt="" className="h-full w-full object-contain" />{i.is_primary && <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] text-ink-foreground">Cover</span>}</div>
                  {canWrite && <div className="flex gap-1">
                    {!i.is_primary && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => makePrimary(i.id)}><Star className="mr-1 h-3 w-3" />Cover</Button>}
                    {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDel(i)} aria-label="Remove image"><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>}
                </div>))}
              {!imgs.length && <p className="col-span-3 text-sm text-muted-foreground">No gallery images yet.</p>}
            </div>
          )}
          {canWrite && imgs.length < MAX_IMAGES && <>
            <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}><Upload className="mr-1.5 h-4 w-4" />{busy ? 'Uploading…' : `Add images (${MAX_IMAGES - imgs.length} left)`}</Button>
          </>}
        </div>}
        <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Remove this image?</AlertDialogTitle><AlertDialogDescription>The image is removed from the fundraiser and storage. The change is recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
