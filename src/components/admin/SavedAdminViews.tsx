import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Plus, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { rpc } from '@/lib/adminApi';
import { safeViewParams } from '@/lib/adminWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';

export function SavedAdminViews() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(''); }, [user?.id]);
  const q = useQuery({ queryKey: ['adm-views', user?.id, location.pathname], enabled: !!user,
    queryFn: () => rpc<any[]>('admin_personal_view', { _op: 'list', _module: location.pathname }) });
  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { await rpc('admin_personal_view', { _op: 'save', _module: location.pathname, _name: name.trim(), _state: { params: safeViewParams(new URLSearchParams(location.search)) } }); setName(''); await q.refetch(); toast({ title: 'Personal view saved' }); }
    catch (e) { toast({ title: 'Could not save view', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    try { await rpc('admin_personal_view', { _op: 'delete', _module: location.pathname, _id: id }); await q.refetch(); }
    catch (e) { toast({ title: 'Could not remove view', description: (e as Error).message, variant: 'destructive' }); }
  };
  const setDefault = async (v: any) => { try { await rpc('admin_personal_view', { _op: 'save', _module: location.pathname, _name: 'Default view', _state: { params: v.state?.params ?? '', default: true } }); await q.refetch(); toast({ title: 'Default view saved' }); } catch (e) { toast({ title: 'Could not set default', description: (e as Error).message, variant: 'destructive' }); } };
  return <Popover><PopoverTrigger asChild><Button size="icon" variant="ghost" aria-label="My saved views" title="My saved views"><Bookmark className="h-4 w-4" /></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-72 space-y-3"><h2 className="text-sm font-medium">My views</h2>
      {q.error ? <Button size="sm" variant="outline" onClick={() => q.refetch()}>Retry</Button> : !q.data?.length ? <p className="text-xs text-muted-foreground">No saved views for this page.</p> : q.data.map((v) => <div key={v.id} className="flex items-center gap-1"><Button variant="ghost" size="sm" className="min-w-0 flex-1 justify-start truncate" onClick={() => window.location.assign(location.pathname + '?' + safeViewParams(new URLSearchParams(v.state?.params ?? '')))}>{v.name}</Button><Button size="icon" variant="ghost" aria-label={`Use ${v.name} as default`} title="Set default view" onClick={() => setDefault(v)}><Star className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" aria-label={`Remove ${v.name}`} onClick={() => remove(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>)}
      <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); void save(); }}><Input aria-label="View name" placeholder="Name this view" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /><Button type="submit" size="icon" disabled={busy || !name.trim()} aria-label="Save current view"><Plus className="h-4 w-4" /></Button></form>
    </PopoverContent></Popover>;
}