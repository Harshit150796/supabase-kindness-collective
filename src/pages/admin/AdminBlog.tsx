import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { adminWrite, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadCMSImage } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Search, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const qc = useQueryClient();
  const { canWrite, isAdmin } = useTeamRole();
  const t = useAdminPaged({ table: 'cms_posts', select: 'id,title,slug,excerpt,content,cover_image_url,category,tags,is_published,published_at,created_at,meta_title,meta_description', searchCols: ['title', 'category', 'excerpt'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [wasPublished, setWasPublished] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-paged', 'cms_posts'] }); qc.invalidateQueries({ queryKey: ['cms-posts'] }); };
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast({ title: ok }); refresh(); return true; }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); return false; }
  };
  const pub = (p: boolean) => ({ is_published: p, published_at: p ? new Date().toISOString() : null });

  const openNew = () => { setForm(emptyForm); setEditId(null); setWasPublished(false); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || '', content: p.content, cover_image_url: p.cover_image_url || '', category: p.category, tags: (p.tags || []).join(', '), is_published: p.is_published, meta_title: p.meta_title || '', meta_description: p.meta_description || '' });
    setEditId(p.id); setWasPublished(p.is_published); setDialogOpen(true);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const url = await uploadCMSImage(file, `blog/${Date.now()}-${file.name}`); setForm((prev) => ({ ...prev, cover_image_url: url })); }
    catch (err: any) { toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }); }
    setUploading(false);
  };
  const handleSave = async () => {
    if (!form.title || !form.content) { toast({ title: 'Title and content required', variant: 'destructive' }); return; }
    const payload: any = {
      title: form.title, slug: form.slug || slugify(form.title), excerpt: form.excerpt, content: form.content,
      cover_image_url: form.cover_image_url || null, category: form.category, tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean),
      meta_title: form.meta_title || null, meta_description: form.meta_description || null,
      // Keep the original publish date when only the content changes.
      ...(!editId || form.is_published !== wasPublished ? pub(form.is_published) : { is_published: form.is_published }),
    };
    if (await run(() => editId ? adminWrite('cms_posts', 'update', [editId], payload) : adminWrite('cms_posts', 'insert', null, payload), editId ? 'Post updated' : 'Post created')) setDialogOpen(false);
  };
  const confirmDelete = async () => { if (deleteId) await run(() => adminWrite('cms_posts', 'delete', [deleteId]), 'Deleted'); setDeleteId(null); };
  const bulk = async (p: boolean) => { await run(() => adminWrite('cms_posts', 'update', [...selected], pub(p)), `${selected.size} posts ${p ? 'published' : 'unpublished'}`); setSelected(new Set()); };

  const cols: Column<any>[] = [
    ...(canWrite ? [{ key: 'sel', header: '', cell: (p: any) => <Checkbox checked={selected.has(p.id)} onClick={(e) => e.stopPropagation()} onCheckedChange={() => setSelected((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })} aria-label="Select" /> }] : []),
    { key: 'title', header: 'Post', sortable: true, cell: (p) => <div className="flex items-center gap-3">{p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-9 w-14 rounded object-cover" />}<div className="max-w-[380px]"><p className="truncate font-medium text-foreground">{p.title}</p><p className="truncate text-xs text-muted-foreground">/{p.slug}</p></div></div> },
    { key: 'category', header: 'Category', sortable: true, cell: (p) => <span className="capitalize">{p.category}</span> },
    { key: 'is_published', header: 'Status', sortable: true, cell: (p) => <StatusBadge value={p.is_published ? 'active' : 'paused'} /> },
    { key: 'published_at', header: 'Published', sortable: true, cell: (p) => <span className="text-xs">{fmtDate(p.published_at)}</span> },
    { key: 'created_at', header: 'Created', sortable: true, cell: (p) => <span className="text-xs">{fmtDate(p.created_at)}</span> },
    ...(canWrite ? [{ key: 'a', header: '', align: 'right' as const, cell: (p: any) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Switch checked={p.is_published} onCheckedChange={() => run(() => adminWrite('cms_posts', 'update', [p.id], pub(!p.is_published)))} aria-label="Published" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(p.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>) }] : []),
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Blog" description="Articles published at /blog."
        actions={<><Button variant="outline" size="sm" onClick={() => window.open('/blog', '_blank')}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview</Button>{canWrite && <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" />New post</Button>}</>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search title, excerpt or category" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        {selected.size > 0 && <><span className="text-sm">{selected.size} selected</span><Button size="sm" variant="outline" onClick={() => bulk(true)}>Publish</Button><Button size="sm" variant="outline" onClick={() => bulk(false)}>Unpublish</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button></>}
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={canWrite ? openEdit : undefined} empty="No posts yet." />
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
