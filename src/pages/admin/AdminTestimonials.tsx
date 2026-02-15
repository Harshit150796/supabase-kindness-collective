import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCMSTestimonials, uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  const handleDelete = async (id: string) => {
    await supabase.from('cms_testimonials').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_testimonials').update({ is_published: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-testimonials'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-foreground">Testimonials</h1><p className="text-muted-foreground">Manage community quotes</p></div>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add Testimonial</Button>
        </div>
        {isLoading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (testimonials || []).length === 0 ? <div className="text-center py-12 text-muted-foreground">No testimonials yet.</div> : (
          <div className="grid gap-4">
            {(testimonials || []).map((t: any) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  {t.image_url && <img src={t.image_url} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{t.name}</div>
                    <div className="text-sm text-muted-foreground truncate">"{t.quote}"</div>
                    <div className="text-xs text-muted-foreground">{t.role_label} · {t.location}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch checked={t.is_published} onCheckedChange={() => togglePublish(t.id, t.is_published)} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
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
