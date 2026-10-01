import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { adminWrite } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Search, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TestimonialForm {
  quote: string; name: string; role: string; role_label: string; location: string;
  image_url: string; verified: boolean; is_published: boolean; display_order: number;
}

const emptyForm: TestimonialForm = {
  quote: '', name: '', role: 'donor', role_label: 'Verified Donor', location: '',
  image_url: '', verified: true, is_published: false, display_order: 0,
};


export default function AdminTestimonials() {
  const qc = useQueryClient();
  const { canWrite, isAdmin } = useTeamRole();
  const t = useAdminPaged({ table: 'cms_testimonials', searchCols: ['name', 'quote', 'location'], defaultSort: { key: 'display_order', dir: 'asc' } });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-paged', 'cms_testimonials'] }); qc.invalidateQueries({ queryKey: ['cms-testimonials'] }); };
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast({ title: ok }); refresh(); return true; }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); return false; }
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (x: any) => {
    setForm({ quote: x.quote, name: x.name, role: x.role, role_label: x.role_label, location: x.location || '', image_url: x.image_url || '', verified: x.verified, is_published: x.is_published, display_order: x.display_order });
    setEditId(x.id); setDialogOpen(true);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const url = await uploadCMSImage(file, `testimonials/${Date.now()}-${file.name}`); setForm((p) => ({ ...p, image_url: url })); }
    catch (err: any) { toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }); }
    setUploading(false);
  };
  const handleSave = async () => {
    if (!form.quote || !form.name) { toast({ title: 'Quote and name required', variant: 'destructive' }); return; }
    if (await run(() => editId ? adminWrite('cms_testimonials', 'update', [editId], form as any) : adminWrite('cms_testimonials', 'insert', null, form as any), editId ? 'Updated' : 'Created')) setDialogOpen(false);
  };
  const confirmDelete = async () => { if (deleteId) await run(() => adminWrite('cms_testimonials', 'delete', [deleteId]), 'Deleted'); setDeleteId(null); };
  const bulk = async (publish: boolean) => { await run(() => adminWrite('cms_testimonials', 'update', [...selected], { is_published: publish }), `${selected.size} testimonials ${publish ? 'published' : 'unpublished'}`); setSelected(new Set()); };

  const cols: Column<any>[] = [
    ...(canWrite ? [{ key: 'sel', header: '', cell: (x: any) => <Checkbox checked={selected.has(x.id)} onClick={(e) => e.stopPropagation()} onCheckedChange={() => setSelected((p) => { const n = new Set(p); n.has(x.id) ? n.delete(x.id) : n.add(x.id); return n; })} aria-label="Select" /> }] : []),
    { key: 'name', header: 'Person', sortable: true, cell: (x) => <div className="flex items-center gap-3">{x.image_url && <img src={x.image_url} alt="" className="h-8 w-8 rounded-full object-cover" />}<div><p className="font-medium text-foreground">{x.name}</p><p className="text-xs text-muted-foreground">{x.role_label}{x.location ? ` · ${x.location}` : ''}</p></div></div> },
    { key: 'quote', header: 'Quote', cell: (x) => <span className="line-clamp-2 max-w-[380px] text-xs">“{x.quote}”</span> },
    { key: 'display_order', header: 'Order', sortable: true, align: 'right', cell: (x) => x.display_order },
    { key: 'is_published', header: 'Status', sortable: true, cell: (x) => <StatusBadge value={x.is_published ? 'active' : 'paused'} /> },
    ...(canWrite ? [{ key: 'a', header: '', align: 'right' as const, cell: (x: any) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => run(() => adminWrite('cms_testimonials', 'update', [x.id], { display_order: Math.max(0, x.display_order - 1) }))} aria-label="Move up">↑</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => run(() => adminWrite('cms_testimonials', 'update', [x.id], { display_order: x.display_order + 1 }))} aria-label="Move down">↓</Button>
        <Switch checked={x.is_published} onCheckedChange={() => run(() => adminWrite('cms_testimonials', 'update', [x.id], { is_published: !x.is_published }))} aria-label="Published" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(x)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(x.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>) }] : []),
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Testimonials" description="Community quotes shown on the site."
        actions={<><Button variant="outline" size="sm" onClick={() => window.open('/#testimonials', '_blank')}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview</Button>{canWrite && <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" />Add testimonial</Button>}</>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search name, quote or location" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        {selected.size > 0 && <><span className="text-sm">{selected.size} selected</span><Button size="sm" variant="outline" onClick={() => bulk(true)}>Publish</Button><Button size="sm" variant="outline" onClick={() => bulk(false)}>Unpublish</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button></>}
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={canWrite ? openEdit : undefined} empty="No testimonials yet." />
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this testimonial. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'New'} Testimonial</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Quote *</label><Textarea value={form.quote} onChange={e => setForm(p => ({ ...p, quote: e.target.value }))} rows={3} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="text-sm font-medium">Location</label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Role</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="donor">Donor</option><option value="recipient">Recipient</option><option value="partner">Partner</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">Role Label</label><Input value={form.role_label} onChange={e => setForm(p => ({ ...p, role_label: e.target.value }))} placeholder="e.g. Verified Donor" /></div>
            </div>
            <div>
              <label className="text-sm font-medium">Avatar</label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && <img src={form.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />}
                <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /><Button variant="outline" size="sm" asChild><span><Upload className="w-3 h-3 mr-1" />{uploading ? 'Uploading...' : 'Upload'}</span></Button></label>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} /><span className="text-sm">Published</span></div>
              <div><label className="text-sm font-medium">Order</label><Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} className="w-20" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
