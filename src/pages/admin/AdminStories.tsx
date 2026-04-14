import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useCMSStories, uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Search, ExternalLink, ChevronUp, ChevronDown, FileText } from 'lucide-react';
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

export default function AdminStories() {
  const queryClient = useQueryClient();
  const { data: stories, isLoading } = useCMSStories(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = (stories || []).filter((s: any) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s: any) => s.id)));
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (story: any) => {
    setForm({ name: story.name, location: story.location || '', image_url: story.image_url || '', short_story: story.short_story, full_story: story.full_story || '', impact: story.impact || '', category: story.category, donors_count: story.donors_count, amount_raised: story.amount_raised, goal: story.goal, is_published: story.is_published, display_order: story.display_order });
    setEditId(story.id); setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCMSImage(file, `stories/${Date.now()}-${file.name}`);
      setForm(prev => ({ ...prev, image_url: url }));
    } catch (err: any) { toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.short_story) { toast({ title: 'Name and short story are required', variant: 'destructive' }); return; }
    const op = editId
      ? supabase.from('cms_stories').update(form).eq('id', editId)
      : supabase.from('cms_stories').insert(form);
    const { error } = await op;
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editId ? 'Story updated!' : 'Story created!' });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['cms-stories'] });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('cms_stories').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); queryClient.invalidateQueries({ queryKey: ['cms-stories'] }); }
    setDeleteId(null);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_stories').update({ is_published: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-stories'] });
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...(stories || [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const idx = sorted.findIndex((s: any) => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('cms_stories').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('cms_stories').update({ display_order: a.display_order }).eq('id', b.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ['cms-stories'] });
  };

  const bulkPublish = async (publish: boolean) => {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map(id =>
      supabase.from('cms_stories').update({ is_published: publish }).eq('id', id)
    ));
    toast({ title: `${selected.size} stories ${publish ? 'published' : 'unpublished'}` });
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['cms-stories'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Impact Stories</h1>
            <p className="text-muted-foreground">Manage stories shown on the website</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/stories', '_blank')}>
              <ExternalLink className="w-3 h-3" />Preview
            </Button>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add Story</Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, location, or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkPublish(true)}>Publish All</Button>
            <Button size="sm" variant="outline" onClick={() => bulkPublish(false)}>Unpublish All</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{search ? 'No stories match your search' : 'No stories yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{search ? 'Try a different search term' : 'Create your first impact story to show on the website'}</p>
            {!search && <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Create First Story</Button>}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">Select all ({filtered.length})</span>
            </div>
            {filtered.map((story: any, idx: number) => (
              <Card key={story.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox checked={selected.has(story.id)} onCheckedChange={() => toggleSelect(story.id)} />
                  {story.image_url && <img src={story.image_url} alt={story.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{story.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{story.short_story}</div>
                    <div className="text-xs text-muted-foreground mt-1">{story.category} · {story.location} · Order: {story.display_order}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(story.id, 'up')} disabled={idx === 0}><ChevronUp className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(story.id, 'down')} disabled={idx === filtered.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{story.is_published ? 'Published' : 'Draft'}</span>
                      <Switch checked={story.is_published} onCheckedChange={() => togglePublish(story.id, story.is_published)} />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openEdit(story)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(story.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="text-sm font-medium">Location</label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <div>
              <div className="flex justify-between"><label className="text-sm font-medium">Short Story *</label><span className="text-xs text-muted-foreground">{form.short_story.length} chars</span></div>
              <Textarea value={form.short_story} onChange={e => setForm(p => ({ ...p, short_story: e.target.value }))} rows={3} />
            </div>
            <div>
              <div className="flex justify-between"><label className="text-sm font-medium">Full Story</label><span className="text-xs text-muted-foreground">{form.full_story.length} chars</span></div>
              <Textarea value={form.full_story} onChange={e => setForm(p => ({ ...p, full_story: e.target.value }))} rows={6} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Impact Badge</label><Input value={form.impact} onChange={e => setForm(p => ({ ...p, impact: e.target.value }))} placeholder="e.g. 3 months of groceries" /></div>
              <div><label className="text-sm font-medium">Category</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="family">Family</option><option value="child">Child</option><option value="emergency">Emergency</option><option value="community">Community</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Donors Count</label><Input type="number" value={form.donors_count} onChange={e => setForm(p => ({ ...p, donors_count: parseInt(e.target.value) || 0 }))} /></div>
              <div><label className="text-sm font-medium">Amount Raised</label><Input type="number" value={form.amount_raised} onChange={e => setForm(p => ({ ...p, amount_raised: parseFloat(e.target.value) || 0 }))} /></div>
              <div><label className="text-sm font-medium">Goal</label><Input type="number" value={form.goal} onChange={e => setForm(p => ({ ...p, goal: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div>
              <label className="text-sm font-medium">Image</label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && <img src={form.image_url} alt="" className="w-20 h-20 rounded-lg object-cover" />}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" className="gap-2" asChild><span><Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload Image'}</span></Button>
                </label>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Display Order</label><Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} /><span className="text-sm">Published</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editId ? 'Update' : 'Create'} Story</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
