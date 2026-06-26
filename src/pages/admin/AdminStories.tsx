import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { useCMSStories, uploadCMSImage } from '@/hooks/useCMSContent';
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
  const queryClient = useQueryClient();
  const { data: stories, isLoading } = useCMSStories(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = (stories || []).filter((s: any) => {
    const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const publishedCount = (stories || []).filter((s: any) => s.is_published).length;
  const draftCount = (stories || []).filter((s: any) => !s.is_published).length;
  const featuredStory = (stories || []).find((s: any) => s.is_published && s.display_order === 1);

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

  const setAsFeatured = async (id: string) => {
    const sorted = [...(stories || [])].filter((s: any) => s.is_published).sort((a: any, b: any) => a.display_order - b.display_order);
    const updates = sorted.map((s: any, idx: number) => {
      const newOrder = s.id === id ? 1 : (idx + 2);
      return supabase.from('cms_stories').update({ display_order: newOrder }).eq('id', s.id);
    });
    await Promise.all(updates);
    toast({ title: 'Featured story updated!', description: 'This story will now appear in the hero section.' });
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

  const progressPercent = (raised: number, goal: number) => goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Impact Stories
            </h1>
            <p className="text-muted-foreground mt-1">Manage stories shown on the website and hero section</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/stories', '_blank')}>
              <ExternalLink className="w-3.5 h-3.5" />Preview Site
            </Button>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Add Story</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{(stories || []).length}</p>
                <p className="text-xs text-muted-foreground">Total Stories</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{publishedCount} <span className="text-sm font-normal text-muted-foreground">/ {draftCount} drafts</span></p>
                <p className="text-xs text-muted-foreground">Published Stories</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">{featuredStory?.name || 'None set'}</p>
                <p className="text-xs text-muted-foreground">Featured Story</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Category Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, location, or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
            <TabsList className="w-full sm:w-auto">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="capitalize text-xs">
                  {cat === 'all' ? `All (${(stories || []).length})` : cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium text-primary">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkPublish(true)}>Publish All</Button>
            <Button size="sm" variant="outline" onClick={() => bulkPublish(false)}>Unpublish All</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {/* Story List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading stories...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{search || categoryFilter !== 'all' ? 'No stories match your filters' : 'No stories yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{search ? 'Try a different search term' : 'Create your first impact story'}</p>
            {!search && categoryFilter === 'all' && <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Create First Story</Button>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">Select all ({filtered.length})</span>
            </div>
            {filtered.map((story: any) => {
              const isFeatured = story.is_published && story.display_order === 1;
              const pct = progressPercent(story.amount_raised, story.goal);
              return (
                <Card key={story.id} className={`transition-all duration-200 ${isFeatured ? 'ring-2 ring-gold/50 shadow-md' : 'hover:shadow-md'}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Checkbox checked={selected.has(story.id)} onCheckedChange={() => toggleSelect(story.id)} className="mt-1" />
                      
                      {/* Thumbnail */}
                      {story.image_url ? (
                        <img src={story.image_url} alt={story.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{story.name}</h3>
                              {isFeatured && (
                                <Badge className="bg-gold/15 text-gold border-gold/30 gap-1 text-[10px]">
                                  <Star className="w-3 h-3 fill-current" />Featured
                                </Badge>
                              )}
                              <Badge variant={story.is_published ? 'default' : 'secondary'} className={`text-[10px] ${story.is_published ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' : ''}`}>
                                {story.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{story.short_story}</p>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 capitalize">
                            <Badge variant="outline" className="text-[10px] font-normal">{story.category}</Badge>
                          </span>
                          {story.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{story.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />{story.donors_count} donors
                          </span>
                          {story.impact && (
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-gold" />{story.impact}
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        {story.goal > 0 && (
                          <div className="flex items-center gap-3 max-w-md">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">
                              ${story.amount_raised.toLocaleString()} / ${story.goal.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="icon"
                          variant={isFeatured ? 'default' : 'ghost'}
                          className={`h-8 w-8 ${isFeatured ? 'bg-gold hover:bg-gold/90 text-white' : 'text-muted-foreground hover:text-gold'}`}
                          onClick={() => setAsFeatured(story.id)}
                          title="Set as featured story"
                          aria-label="Set as featured story"
                          disabled={!story.is_published}
                        >
                          <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => togglePublish(story.id, story.is_published)} title={story.is_published ? 'Unpublish' : 'Publish'} aria-label={story.is_published ? 'Unpublish story' : 'Publish story'}>
                          {story.is_published ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(story)} aria-label="Edit story">
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => setDeleteId(story.id)} aria-label="Delete story">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                  <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Port-au-Prince, Haiti" />
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
