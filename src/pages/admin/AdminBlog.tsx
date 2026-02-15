import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCMSPosts, uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface PostForm {
  title: string; slug: string; excerpt: string; content: string; cover_image_url: string;
  category: string; tags: string; is_published: boolean;
}

const emptyForm: PostForm = {
  title: '', slug: '', excerpt: '', content: '', cover_image_url: '',
  category: 'news', tags: '', is_published: false,
};

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useCMSPosts(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || '', content: p.content, cover_image_url: p.cover_image_url || '', category: p.category, tags: (p.tags || []).join(', '), is_published: p.is_published });
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
    const payload = {
      title: form.title, slug, excerpt: form.excerpt, content: form.content,
      cover_image_url: form.cover_image_url || null, category: form.category, tags: tagsArr,
      is_published: form.is_published, published_at: form.is_published ? new Date().toISOString() : null,
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

  const handleDelete = async (id: string) => {
    await supabase.from('cms_posts').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-posts'] });
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('cms_posts').update({ is_published: !current, published_at: !current ? new Date().toISOString() : null }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['cms-posts'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-foreground">Blog Posts</h1><p className="text-muted-foreground">Create and manage articles</p></div>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />New Post</Button>
        </div>
        {isLoading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (posts || []).length === 0 ? <div className="text-center py-12 text-muted-foreground">No posts yet. Write your first article.</div> : (
          <div className="grid gap-4">
            {(posts || []).map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center gap-4">
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
                    <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Title *</label><Input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); if (!editId) setForm(p => ({ ...p, slug: slugify(e.target.value) })); }} /></div>
            <div><label className="text-sm font-medium">Slug</label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated-from-title" /></div>
            <div><label className="text-sm font-medium">Excerpt</label><Textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="Short summary for cards" /></div>
            <div><label className="text-sm font-medium">Content * (Markdown supported)</label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={12} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Category</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="news">News</option><option value="update">Update</option><option value="guide">Guide</option><option value="story">Story</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">Tags (comma separated)</label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="donation, community" /></div>
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
