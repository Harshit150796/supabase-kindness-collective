import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCMSContent } from '@/hooks/useCMSContent';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Search, ExternalLink, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const SECTIONS = ['hero', 'cta', 'how_it_works', 'impact', 'general'];

export default function AdminContent() {
  const queryClient = useQueryClient();
  const { data: allContent, isLoading } = useCMSContent();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newSection, setNewSection] = useState('general');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (allContent) {
      const vals: Record<string, string> = {};
      allContent.forEach((c: any) => { vals[c.id] = c.content_value; });
      setEditValues(vals);
    }
  }, [allContent]);

  const handleSave = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('cms_content').update({ content_value: editValues[id] }).eq('id', id);
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved!' }); queryClient.invalidateQueries({ queryKey: ['cms-content'] }); }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    const { error } = await supabase.from('cms_content').insert({ content_key: newKey.trim(), content_value: newValue, section: newSection, content_type: 'text' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Content added!' }); setNewKey(''); setNewValue(''); queryClient.invalidateQueries({ queryKey: ['cms-content'] }); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('cms_content').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); queryClient.invalidateQueries({ queryKey: ['cms-content'] }); }
    setDeleteId(null);
  };

  const filteredContent = (allContent || []).filter((c: any) =>
    !search || c.content_key?.toLowerCase().includes(search.toLowerCase()) ||
    c.content_value?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = SECTIONS.map(section => ({
    section,
    items: filteredContent.filter((c: any) => c.section === section),
  })).filter(g => g.items.length > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Site Content</h1>
            <p className="text-muted-foreground">Edit text, headlines, and descriptions across the website</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="w-3 h-3" />Preview Site
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search content by key or value..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Add new content */}
        <Card>
          <CardHeader><CardTitle className="text-base">Add New Content</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input placeholder="Content key (e.g. hero_title)" value={newKey} onChange={e => setNewKey(e.target.value)} />
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newSection} onChange={e => setNewSection(e.target.value)}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" />Add</Button>
            </div>
            <Textarea placeholder="Content value" value={newValue} onChange={e => setNewValue(e.target.value)} />
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{search ? 'No content matches your search' : 'No content yet'}</h3>
            <p className="text-sm text-muted-foreground">{search ? 'Try a different search term' : 'Add your first content item above'}</p>
          </div>
        ) : (
          grouped.map(({ section, items }) => (
            <Card key={section}>
              <CardHeader><CardTitle className="text-base capitalize">{section.replace(/_/g, ' ')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">{item.content_key}</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(item.id)}><Trash2 className="w-3 h-3" /></Button>
                        <Button size="sm" onClick={() => handleSave(item.id)} disabled={saving} className="gap-1"><Save className="w-3 h-3" />Save</Button>
                      </div>
                    </div>
                    <Textarea
                      value={editValues[item.id] || ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                      rows={2}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this content item. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
