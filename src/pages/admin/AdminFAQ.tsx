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
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface FAQForm { question: string; answer: string; category: string; display_order: number; is_published: boolean; }
const emptyForm: FAQForm = { question: '', answer: '', category: 'general', display_order: 0, is_published: true };

export default function AdminFAQ() {
  const qc = useQueryClient();
  const { canWrite, isAdmin } = useTeamRole();
  const t = useAdminPaged({ table: 'cms_faq', searchCols: ['question', 'category', 'answer'], defaultSort: { key: 'display_order', dir: 'asc' } });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-paged', 'cms_faq'] }); qc.invalidateQueries({ queryKey: ['cms-faq'] }); };
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast({ title: ok }); refresh(); return true; }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); return false; }
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (f: any) => { setForm({ question: f.question, answer: f.answer, category: f.category, display_order: f.display_order, is_published: f.is_published }); setEditId(f.id); setDialogOpen(true); };
  const handleSave = async () => {
    if (!form.question || !form.answer) { toast({ title: 'Question and answer required', variant: 'destructive' }); return; }
    if (await run(() => editId ? adminWrite('cms_faq', 'update', [editId], form as any) : adminWrite('cms_faq', 'insert', null, form as any), editId ? 'Updated' : 'Created')) setDialogOpen(false);
  };
  const moveOrder = async (f: any, dir: -1 | 1) => run(() => adminWrite('cms_faq', 'update', [f.id], { display_order: Math.max(0, f.display_order + dir) }));
  const bulk = async (publish: boolean) => { await run(() => adminWrite('cms_faq', 'update', [...selected], { is_published: publish }), `${selected.size} FAQs ${publish ? 'published' : 'unpublished'}`); setSelected(new Set()); };

  const rows = t.rows ?? [];
  const cols: Column<any>[] = [
    ...(canWrite ? [{ key: 'sel', header: '', cell: (f: any) => <Checkbox checked={selected.has(f.id)} onCheckedChange={() => setSelected((p) => { const n = new Set(p); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; })} onClick={(e) => e.stopPropagation()} aria-label="Select" /> }] : []),
    { key: 'question', header: 'Question', sortable: true, cell: (f) => <div className="max-w-[420px]"><p className="font-medium text-foreground">{f.question}</p><p className="line-clamp-1 text-xs text-muted-foreground">{f.answer}</p></div> },
    { key: 'category', header: 'Category', sortable: true, cell: (f) => <span className="capitalize">{f.category}</span> },
    { key: 'display_order', header: 'Order', sortable: true, align: 'right', cell: (f) => f.display_order },
    { key: 'is_published', header: 'Status', sortable: true, cell: (f) => <StatusBadge value={f.is_published ? 'active' : 'paused'} /> },
    ...(canWrite ? [{ key: 'actions', header: '', align: 'right' as const, cell: (f: any) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => moveOrder(f, -1)} aria-label="Move up">↑</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => moveOrder(f, 1)} aria-label="Move down">↓</Button>
        <Switch checked={f.is_published} onCheckedChange={() => run(() => adminWrite('cms_faq', 'update', [f.id], { is_published: !f.is_published }))} aria-label="Published" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(f)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(f.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>) }] : []),
  ];

  return (
    <DashboardLayout>
      <PageHeader title="FAQ" description="Questions shown on the public FAQ page."
        actions={<><Button variant="outline" size="sm" onClick={() => window.open('/faq', '_blank')}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview</Button>{canWrite && <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" />Add FAQ</Button>}</>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search question, answer or category" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        {selected.size > 0 && <><span className="text-sm">{selected.size} selected</span><Button size="sm" variant="outline" onClick={() => bulk(true)}>Publish</Button><Button size="sm" variant="outline" onClick={() => bulk(false)}>Unpublish</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button></>}
        {canWrite && rows.length > 0 && <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(rows.map((r: any) => r.id)))}>Select page</Button>}
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={canWrite ? openEdit : undefined} empty="No FAQs yet." />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete FAQ</AlertDialogTitle><AlertDialogDescription>This permanently deletes the FAQ item. The change is recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { await run(() => adminWrite('cms_faq', 'delete', [deleteId!]), 'Deleted'); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'New'} FAQ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Question *</label><Input value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} /></div>
            <div><div className="flex justify-between"><label className="text-sm font-medium">Answer *</label><span className="text-xs text-muted-foreground">{form.answer.length} chars</span></div>
              <Textarea value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} rows={4} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-medium">Category</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="general">General</option><option value="donation">Donation</option><option value="recipient">Recipient</option><option value="partner">Partner</option>
                </select></div>
              <div><label className="text-sm font-medium">Display order</label><Input type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))} /><span className="text-sm">Published</span></div>
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
