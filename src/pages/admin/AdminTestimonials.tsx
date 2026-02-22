import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useCMSTestimonials, uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Search, ExternalLink, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const { data: testimonials, isLoading } = useCMSTestimonials(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = (testimonials || []).filter((t: any) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.quote?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t: any) => t.id)));
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setForm({ quote: t.quote, name: t.name, role: t.role, role_label: t.role_label, location: t.location || '', image_url: t.image_url || '', verified: t.verified, is_published: t.is_published, display_order: t.display_order });
    setEditId(t.id); setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCMSImage(file, `testimonials/${Date.now()}-${file.name}`);
      setForm(prev => ({ ...prev, image_url: url }));
    } catch (err: any) { toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.quote || !form.name) { toast({ title: 'Quote and name required', variant: 'destructive' }); return; }
    const op = editId
      ? supabase.from('cms_testimonials').update(form).eq('id', editId)
      : supabase.from('cms_testimonials').insert(form);
    const { error } = await op;
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editId ? 'Updated!' : 'Created!' });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('cms_testimonials').delete().eq('id', deleteId);
    toast({ title: 'Deleted' });
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
    setDeleteId(null);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_testimonials').update({ is_published: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...(testimonials || [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const idx = sorted.findIndex((t: any) => t.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('cms_testimonials').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('cms_testimonials').update({ display_order: a.display_order }).eq('id', b.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
  };

  const bulkPublish = async (publish: boolean) => {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map(id =>
      supabase.from('cms_testimonials').update({ is_published: publish }).eq('id', id)
    ));
    toast({ title: `${selected.size} testimonials ${publish ? 'published' : 'unpublished'}` });
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="text-3xl font-bold text-foreground">Testimonials</h1><p className="text-muted-foreground">Manage community quotes</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/#testimonials', '_blank')}>
              <ExternalLink className="w-3 h-3" />Preview
            </Button>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add Testimonial</Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or quote..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkPublish(true)}>Publish All</Button>
            <Button size="sm" variant="outline" onClick={() => bulkPublish(false)}>Unpublish All</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {isLoading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{search ? 'No testimonials match your search' : 'No testimonials yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{search ? 'Try a different search term' : 'Add your first community testimonial'}</p>
            {!search && <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add First Testimonial</Button>}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">Select all ({filtered.length})</span>
            </div>
            {filtered.map((t: any, idx: number) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                  {t.image_url && <img src={t.image_url} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{t.name}</div>
                    <div className="text-sm text-muted-foreground truncate">"{t.quote}"</div>
                    <div className="text-xs text-muted-foreground">{t.role_label} · {t.location}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(t.id, 'up')} disabled={idx === 0}><ChevronUp className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(t.id, 'down')} disabled={idx === filtered.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                    </div>
                    <Switch checked={t.is_published} onCheckedChange={() => togglePublish(t.id, t.is_published)} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
