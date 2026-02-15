import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCMSFAQ } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FAQForm { question: string; answer: string; category: string; display_order: number; is_published: boolean; }

const emptyForm: FAQForm = { question: '', answer: '', category: 'general', display_order: 0, is_published: true };

export default function AdminFAQ() {
  const queryClient = useQueryClient();
  const { data: faqs, isLoading } = useCMSFAQ(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (f: any) => {
    setForm({ question: f.question, answer: f.answer, category: f.category, display_order: f.display_order, is_published: f.is_published });
    setEditId(f.id); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question || !form.answer) { toast({ title: 'Question and answer required', variant: 'destructive' }); return; }
    const op = editId
      ? supabase.from('cms_faq').update(form).eq('id', editId)
      : supabase.from('cms_faq').insert(form);
    const { error } = await op;
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editId ? 'Updated!' : 'Created!' });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cms_faq').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_faq').update({ is_published: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-foreground">FAQ Management</h1><p className="text-muted-foreground">Manage frequently asked questions</p></div>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add FAQ</Button>
        </div>
        {isLoading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (faqs || []).length === 0 ? <div className="text-center py-12 text-muted-foreground">No FAQs yet.</div> : (
          <div className="grid gap-4">
            {(faqs || []).map((f: any) => (
              <Card key={f.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{f.question}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.answer}</div>
                    <div className="text-xs text-muted-foreground mt-1">Category: {f.category} · Order: {f.display_order}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch checked={f.is_published} onCheckedChange={() => togglePublish(f.id, f.is_published)} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(f)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(f.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'New'} FAQ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Question *</label><Input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} /></div>
            <div><label className="text-sm font-medium">Answer *</label><Textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={4} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Category</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="general">General</option><option value="donation">Donation</option><option value="recipient">Recipient</option><option value="partner">Partner</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">Display Order</label><Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} /><span className="text-sm">Published</span></div>
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
