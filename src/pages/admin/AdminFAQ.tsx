import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useCMSFAQ } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, ExternalLink, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface FAQForm { question: string; answer: string; category: string; display_order: number; is_published: boolean; }
const emptyForm: FAQForm = { question: '', answer: '', category: 'general', display_order: 0, is_published: true };

export default function AdminFAQ() {
  const queryClient = useQueryClient();
  const { data: faqs, isLoading } = useCMSFAQ(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = (faqs || []).filter((f: any) =>
    !search || f.question?.toLowerCase().includes(search.toLowerCase()) ||
    f.category?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((f: any) => f.id)));
  };

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

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('cms_faq').delete().eq('id', deleteId);
    toast({ title: 'Deleted' });
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
    setDeleteId(null);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_faq').update({ is_published: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...(faqs || [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const idx = sorted.findIndex((f: any) => f.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('cms_faq').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('cms_faq').update({ display_order: a.display_order }).eq('id', b.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
  };

  const bulkPublish = async (publish: boolean) => {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map(id =>
      supabase.from('cms_faq').update({ is_published: publish }).eq('id', id)
    ));
    toast({ title: `${selected.size} FAQs ${publish ? 'published' : 'unpublished'}` });
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['cms-faq'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="text-3xl font-bold text-foreground">FAQ Management</h1><p className="text-muted-foreground">Manage frequently asked questions</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/faq', '_blank')}>
              <ExternalLink className="w-3 h-3" />Preview
            </Button>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add FAQ</Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by question or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{search ? 'No FAQs match your search' : 'No FAQs yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{search ? 'Try a different search term' : 'Add your first frequently asked question'}</p>
            {!search && <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add First FAQ</Button>}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">Select all ({filtered.length})</span>
            </div>
            {filtered.map((f: any, idx: number) => (
              <Card key={f.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-4">
                  <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggleSelect(f.id)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{f.question}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.answer}</div>
                    <div className="text-xs text-muted-foreground mt-1">Category: {f.category} · Order: {f.display_order}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(f.id, 'up')} disabled={idx === 0} aria-label="Move up"><ChevronUp className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(f.id, 'down')} disabled={idx === filtered.length - 1} aria-label="Move down"><ChevronDown className="w-3 h-3" /></Button>
                    </div>
                    <Switch checked={f.is_published} onCheckedChange={() => togglePublish(f.id, f.is_published)} aria-label={f.is_published ? 'Unpublish FAQ' : 'Publish FAQ'} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(f)} aria-label="Edit FAQ"><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(f.id)} aria-label="Delete FAQ"><Trash2 className="w-3 h-3" /></Button>
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
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this FAQ item. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'New'} FAQ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Question *</label><Input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} /></div>
            <div>
              <div className="flex justify-between"><label className="text-sm font-medium">Answer *</label><span className="text-xs text-muted-foreground">{form.answer.length} chars</span></div>
              <Textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={4} />
            </div>
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
