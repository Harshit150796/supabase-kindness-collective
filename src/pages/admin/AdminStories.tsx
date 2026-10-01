import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { sb, adminWrite, usd } from '@/lib/adminApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Search, ExternalLink, Star, MapPin, Users, DollarSign, Eye, EyeOff, BookOpen, FileText, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface StoryForm {
  name: string; location: string; image_url: string; short_story: string; full_story: string;
  impact: string; category: string; donors_count: number; amount_raised: number; goal: number;
  is_published: boolean; display_order: number;
}

const emptyForm: StoryForm = {
  name: '', location: '', image_url: '', short_story: '', full_story: '',
  impact: '', category: 'family', donors_count: 0, amount_raised: 0, goal: 0,
  is_published: false, display_order: 0,
};

const categories = ['all', 'family', 'child', 'emergency', 'community'] as const;

export default function AdminStories() {
  const qc = useQueryClient();
  const { canWrite, isAdmin } = useTeamRole();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const t = useAdminPaged({ table: 'cms_stories', searchCols: ['name', 'location', 'category'], defaultSort: { key: 'display_order', dir: 'asc' }, filter: (b) => (categoryFilter === 'all' ? b : b.eq('category', categoryFilter)), deps: [categoryFilter] });
  const stats = useQuery({
    queryKey: ['adm-story-stats'],
    queryFn: async () => {
      const [all, pub, feat] = await Promise.all([
        sb.from('cms_stories').select('id', { count: 'exact', head: true }),
        sb.from('cms_stories').select('id', { count: 'exact', head: true }).eq('is_published', true),
        sb.from('cms_stories').select('id,name').eq('is_published', true).eq('display_order', 1).limit(1),
      ]);
      return { total: all.count ?? 0, published: pub.count ?? 0, featured: feat.data?.[0] as any };
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-paged', 'cms_stories'] }); qc.invalidateQueries({ queryKey: ['cms-stories'] }); stats.refetch(); };
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast({ title: ok }); refresh(); return true; }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); return false; }
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (story: any) => {
    setForm({ name: story.name, location: story.location || '', image_url: story.image_url || '', short_story: story.short_story, full_story: story.full_story || '', impact: story.impact || '', category: story.category, donors_count: story.donors_count, amount_raised: story.amount_raised, goal: story.goal, is_published: story.is_published, display_order: story.display_order });
    setEditId(story.id); setDialogOpen(true);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const url = await uploadCMSImage(file, `stories/${Date.now()}-${file.name}`); setForm((prev) => ({ ...prev, image_url: url })); }
    catch (err: any) { toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }); }
    setUploading(false);
  };
  const handleSave = async () => {
    if (!form.name || !form.short_story) { toast({ title: 'Name and short story are required', variant: 'destructive' }); return; }
    if (await run(() => editId ? adminWrite('cms_stories', 'update', [editId], form as any) : adminWrite('cms_stories', 'insert', null, form as any), editId ? 'Story updated' : 'Story created')) setDialogOpen(false);
  };
  const confirmDelete = async () => { if (deleteId) await run(() => adminWrite('cms_stories', 'delete', [deleteId]), 'Deleted'); setDeleteId(null); };
  const setAsFeatured = async (id: string) => {
    await run(async () => {
      const { data, error } = await sb.from('cms_stories').select('id,display_order').eq('is_published', true).order('display_order').range(0, 999);
      if (error) throw new Error(error.message);
      const others = (data ?? []).filter((s: any) => s.id !== id);
      await adminWrite('cms_stories', 'update', [id], { display_order: 1 });
      for (let i = 0; i < others.length; i++) if (others[i].display_order !== i + 2) await adminWrite('cms_stories', 'update', [others[i].id], { display_order: i + 2 });
    }, 'Featured story updated — it now appears in the hero section.');
  };
  const bulk = async (p: boolean) => { await run(() => adminWrite('cms_stories', 'update', [...selected], { is_published: p }), `${selected.size} stories ${p ? 'published' : 'unpublished'}`); setSelected(new Set()); };
  const pct = (raised: number, goal: number) => (goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0);

  const cols: Column<any>[] = [
    ...(canWrite ? [{ key: 'sel', header: '', cell: (s: any) => <Checkbox checked={selected.has(s.id)} onClick={(e) => e.stopPropagation()} onCheckedChange={() => setSelected((p) => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} aria-label="Select" /> }] : []),
    { key: 'name', header: 'Story', sortable: true, cell: (s) => <div className="flex items-center gap-3">{s.image_url ? <img src={s.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}<div className="max-w-[320px]"><p className="truncate font-medium text-foreground">{s.name}{s.is_published && s.display_order === 1 && <span className="ml-2 rounded bg-ink px-1.5 py-0.5 text-[10px] text-ink-foreground">Featured</span>}</p><p className="truncate text-xs text-muted-foreground">{s.location || '—'}</p></div></div> },
    { key: 'category', header: 'Category', sortable: true, cell: (s) => <span className="capitalize">{s.category}</span> },
    { key: 'amount_raised', header: 'Raised / goal', align: 'right', sortable: true, cell: (s) => <div className="text-right"><p>{usd(s.amount_raised)} / {usd(s.goal)}</p><div className="ml-auto mt-1 h-1 w-24 rounded bg-muted"><div className="h-1 rounded bg-primary" style={{ width: `${pct(s.amount_raised, s.goal)}%` }} /></div></div> },
    { key: 'display_order', header: 'Order', sortable: true, align: 'right', cell: (s) => s.display_order },
    { key: 'is_published', header: 'Status', sortable: true, cell: (s) => <StatusBadge value={s.is_published ? 'active' : 'paused'} /> },
    ...(canWrite ? [{ key: 'a', header: '', align: 'right' as const, cell: (s: any) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {s.is_published && s.display_order !== 1 && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAsFeatured(s.id)}><Star className="mr-1 h-3 w-3" />Feature</Button>}
        <Switch checked={s.is_published} onCheckedChange={() => run(() => adminWrite('cms_stories', 'update', [s.id], { is_published: !s.is_published }))} aria-label="Published" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(s.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>) }] : []),
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Stories" description="Impact stories shown on the website and the hero section. These are editorial CMS stories, separate from live fundraisers."
        actions={<><Button variant="outline" size="sm" onClick={() => window.open('/stories', '_blank')}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview</Button>{canWrite && <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" />Add story</Button>}</>} />
      <div className="mb-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 tabular-nums">
        <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Total stories</p><p className="text-2xl font-semibold">{stats.data?.total ?? '—'}</p></div>
        <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Published / drafts</p><p className="text-2xl font-semibold">{stats.data ? `${stats.data.published} / ${stats.data.total - stats.data.published}` : '—'}</p></div>
        <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Featured in hero</p><p className="truncate text-base font-medium">{stats.data?.featured?.name ?? 'None set'}</p></div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search name, location or category" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}><TabsList>{categories.map((c) => <TabsTrigger key={c} value={c} className="text-xs capitalize">{c}</TabsTrigger>)}</TabsList></Tabs>
        {selected.size > 0 && <><span className="text-sm">{selected.size} selected</span><Button size="sm" variant="outline" onClick={() => bulk(true)}>Publish</Button><Button size="sm" variant="outline" onClick={() => bulk(false)}>Unpublish</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button></>}
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={canWrite ? openEdit : undefined} empty="No stories match." />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this story. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Story' : 'New Story'}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Basic Info</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name *</label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Maria's Family" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Syracuse, NY" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Story Content */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Story Content</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Short Story *</label>
                  <span className="text-xs text-muted-foreground">{form.short_story.length} chars</span>
                </div>
                <Textarea value={form.short_story} onChange={e => setForm(p => ({ ...p, short_story: e.target.value }))} rows={3} placeholder="A brief summary shown on story cards (1-2 sentences)" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Full Story</label>
                  <span className="text-xs text-muted-foreground">{form.full_story.length} chars</span>
                </div>
                <Textarea value={form.full_story} onChange={e => setForm(p => ({ ...p, full_story: e.target.value }))} rows={6} placeholder="The complete story shown on the detail page" />
              </div>
            </div>

            {/* Fundraising Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Fundraising Stats</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount Raised ($)</label>
                  <Input type="number" value={form.amount_raised} onChange={e => setForm(p => ({ ...p, amount_raised: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Goal ($)</label>
                  <Input type="number" value={form.goal} onChange={e => setForm(p => ({ ...p, goal: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Donors Count</label>
                  <Input type="number" value={form.donors_count} onChange={e => setForm(p => ({ ...p, donors_count: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              {form.goal > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress preview</span>
                    <span className="font-medium">${form.amount_raised.toLocaleString()} / ${form.goal.toLocaleString()} ({progressPercent(form.amount_raised, form.goal)}%)</span>
                  </div>
                  <Progress value={progressPercent(form.amount_raised, form.goal)} className="h-2" />
                </div>
              )}
            </div>

            {/* Media */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><Upload className="w-4 h-4 text-primary" />Media</h4>
              <div className="flex items-center gap-4">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-24 h-24 rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                    <FileText className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button variant="outline" size="sm" className="gap-2" asChild><span><Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload Image'}</span></Button>
                  </label>
                  {form.image_url && (
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => setForm(p => ({ ...p, image_url: '' }))}>Remove</Button>
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Settings</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Impact Badge</label>
                  <Input value={form.impact} onChange={e => setForm(p => ({ ...p, impact: e.target.value }))} placeholder="e.g. 3 months of groceries" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Display Order</label>
                  <Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} />
                <span className="text-sm font-medium">{form.is_published ? 'Published' : 'Draft'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editId ? 'Update' : 'Create'} Story</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
