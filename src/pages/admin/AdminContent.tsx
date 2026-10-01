import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { adminWrite, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, ExternalLink, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const SECTIONS = ['hero', 'cta', 'how_it_works', 'impact', 'general'];

export default function AdminContent() {
  const qc = useQueryClient();
  const { canWrite, isAdmin } = useTeamRole();
  const [section, setSection] = useState('all');
  const t = useAdminPaged({ table: 'cms_content', searchCols: ['content_key', 'content_value'], defaultSort: { key: 'content_key', dir: 'asc' }, filter: (b) => (section === 'all' ? b : b.eq('section', section)), deps: [section] });
  const [edit, setEdit] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-paged', 'cms_content'] }); qc.invalidateQueries({ queryKey: ['cms-content'] }); };
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast({ title: ok }); refresh(); return true; } catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); return false; }
  };
  const save = async () => {
    if (!edit.content_key?.trim()) { toast({ title: 'Key required', variant: 'destructive' }); return; }
    const ok = edit.id
      ? await run(() => adminWrite('cms_content', 'update', [edit.id], { content_value: edit.content_value, section: edit.section }), 'Saved')
      : await run(() => adminWrite('cms_content', 'insert', null, { content_key: edit.content_key.trim(), content_value: edit.content_value ?? '', section: edit.section, content_type: 'text' }), 'Content added');
    if (ok) setEdit(null);
  };

  const cols: Column<any>[] = [
    { key: 'content_key', header: 'Key', sortable: true, cell: (r) => <span className="font-mono text-xs text-foreground">{r.content_key}</span> },
    { key: 'section', header: 'Section', sortable: true, cell: (r) => <span className="capitalize">{r.section.replace(/_/g, ' ')}</span> },
    { key: 'content_value', header: 'Value', cell: (r) => <span className="line-clamp-2 max-w-[460px] text-xs">{r.content_value}</span> },
    { key: 'updated_at', header: 'Updated', sortable: true, cell: (r) => <span className="text-xs">{fmtDate(r.updated_at)}</span> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Site content" description="Text, headlines and descriptions used across the website."
        actions={<><Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview site</Button>{canWrite && <Button size="sm" onClick={() => setEdit({ content_key: '', content_value: '', section: 'general' })}><Plus className="mr-1.5 h-4 w-4" />Add content</Button>}</>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search key or value" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        <Select value={section} onValueChange={setSection}><SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sections</SelectItem>{SECTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select>
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={(r) => setEdit({ ...r })} empty="No content items match." />

      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {edit && <div className="space-y-4">
            <SheetHeader><SheetTitle className="text-left font-serif text-2xl font-normal">{edit.id ? edit.content_key : 'New content'}</SheetTitle></SheetHeader>
            {!edit.id && <Input placeholder="Content key (e.g. hero_title)" value={edit.content_key} onChange={(e) => setEdit({ ...edit, content_key: e.target.value })} />}
            <Select value={edit.section} onValueChange={(v) => setEdit({ ...edit, section: v })} disabled={!canWrite}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Textarea rows={10} value={edit.content_value ?? ''} readOnly={!canWrite} onChange={(e) => setEdit({ ...edit, content_value: e.target.value })} />
            {canWrite && <div className="flex justify-between">
              {isAdmin && edit.id ? <Button variant="ghost" className="text-destructive" onClick={() => setDeleteId(edit.id)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={save}>Save</Button></div>}
          </div>}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete content</AlertDialogTitle><AlertDialogDescription>This permanently deletes the content item and is recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { if (await run(() => adminWrite('cms_content', 'delete', [deleteId!]), 'Deleted')) setEdit(null); setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
