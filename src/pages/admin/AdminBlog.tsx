import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCMSPosts, uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Search, ExternalLink, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, parseISO } from 'date-fns';

interface PostForm {
  title: string; slug: string; excerpt: string; content: string; cover_image_url: string;
  category: string; tags: string; is_published: boolean; meta_title: string; meta_description: string;
}

const emptyForm: PostForm = {
  title: '', slug: '', excerpt: '', content: '', cover_image_url: '',
  category: 'news', tags: '', is_published: false, meta_title: '', meta_description: '',
};

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function CharCount({ value, recommended }: { value: string; recommended?: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {value.length} chars{recommended && <span className="ml-1">· {recommended}</span>}
    </span>
  );
}

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useCMSPosts(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = (posts || []).filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p: any) => p.id)));
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || '', content: p.content, cover_image_url: p.cover_image_url || '', category: p.category, tags: (p.tags || []).join(', '), is_published: p.is_published, meta_title: p.meta_title || '', meta_description: p.meta_description || '' });
    setEditId(p.id); setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCMSImage(file, `blog/${Date.now()}-${file.name}`);
      setForm(prev => ({ ...prev, cover_image_url: url }));
    } catch (err: any) { toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { toast({ title: 'Title and content required', variant: 'destructive' }); return; }
    const slug = form.slug || slugify(form.title);
    const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload: any = {
      title: form.title, slug, excerpt: form.excerpt, content: form.content,
      cover_image_url: form.cover_image_url || null, category: form.category, tags: tagsArr,
      is_published: form.is_published, published_at: form.is_published ? new Date().toISOString() : null,
      meta_title: form.meta_title || null, meta_description: form.meta_description || null,
    };
    const op = editId
      ? supabase.from('cms_posts').update(payload).eq('id', editId)
      : supabase.from('cms_posts').insert(payload);
    const { error } = await op;
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editId ? 'Post updated!' : 'Post created!' });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['cms-posts'] });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('cms_posts').delete().eq('id', deleteId);
    toast({ title: 'Deleted' });
    queryClient.invalidateQueries({ queryKey: ['cms-posts'] });
    setDeleteId(null);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_posts').update({ is_published: !current, published_at: !current ? new Date().toISOString() : null }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-posts'] });
  };

  const bulkPublish = async (publish: boolean) => {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map(id =>
      supabase.from('cms_posts').update({ is_published: publish, published_at: publish ? new Date().toISOString() : null }).eq('id', id)
    ));
    toast({ title: `${selected.size} posts ${publish ? 'published' : 'unpublished'}` });
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['cms-posts'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="text-3xl font-bold text-foreground">Blog Posts</h1><p className="text-muted-foreground">Create and manage articles</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/blog', '_blank')}>
              <ExternalLink className="w-3 h-3" />Preview
            </Button>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />New Post</Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, category, or tags..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{search ? 'No posts match your search' : 'No posts yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{search ? 'Try a different search term' : 'Write your first blog article'}</p>
            {!search && <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Write First Post</Button>}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">Select all ({filtered.length})</span>
            </div>
            {filtered.map((p: any) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                  {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{p.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{p.excerpt || p.content.substring(0, 100)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{p.category}</Badge>
                      <span className="text-xs text-muted-foreground">{format(parseISO(p.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch checked={p.is_published} onCheckedChange={() => togglePublish(p.id, p.is_published)} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3 h-3" /></Button>
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
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this blog post. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between"><label className="text-sm font-medium">Title *</label><CharCount value={form.title} recommended="50-60 chars for SEO" /></div>
              <Input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); if (!editId) setForm(p => ({ ...p, slug: slugify(e.target.value) })); }} />
            </div>
            <div><label className="text-sm font-medium">Slug</label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated-from-title" /></div>
            <div>
              <div className="flex justify-between"><label className="text-sm font-medium">Excerpt</label><CharCount value={form.excerpt} /></div>
              <Textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="Short summary for cards" />
            </div>

            {/* Content with preview tabs */}
            <div>
              <label className="text-sm font-medium">Content * (Markdown supported)</label>
              <Tabs defaultValue="write" className="mt-1">
                <TabsList className="mb-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={12} />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[200px] p-4 rounded-md border bg-muted/30 prose prose-sm max-w-none">
                    {form.content ? (
                      form.content.split('\n').map((line, i) => {
                        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-1">{line.slice(3)}</h2>;
                        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                        if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.slice(2)}</li>;
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="mb-1">{line}</p>;
                      })
                    ) : <p className="text-muted-foreground italic">Nothing to preview</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Category</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="news">News</option><option value="update">Update</option><option value="guide">Guide</option><option value="story">Story</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">Tags (comma separated)</label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="donation, community" /></div>
            </div>

            {/* SEO Fields */}
            <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">SEO Settings</h4>
              <div>
                <div className="flex justify-between"><label className="text-sm font-medium">Meta Title</label><CharCount value={form.meta_title} recommended="50-60 chars" /></div>
                <Input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))} placeholder={form.title || 'Defaults to post title'} />
              </div>
              <div>
                <div className="flex justify-between"><label className="text-sm font-medium">Meta Description</label><CharCount value={form.meta_description} recommended="150-160 chars" /></div>
                <Textarea value={form.meta_description} onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))} rows={2} placeholder="SEO description for search engines" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Cover Image</label>
              <div className="flex items-center gap-3 mt-1">
                {form.cover_image_url && <img src={form.cover_image_url} alt="" className="w-24 h-16 rounded-lg object-cover" />}
                <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /><Button variant="outline" size="sm" asChild><span><Upload className="w-3 h-3 mr-1" />{uploading ? 'Uploading...' : 'Upload'}</span></Button></label>
              </div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} /><span className="text-sm">Publish immediately</span></div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editId ? 'Update' : 'Create'} Post</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
