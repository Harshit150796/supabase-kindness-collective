import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { sb, rpc } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const ROLES = [
  { v: 'admin', d: 'Everything, including roles, settings and permanent deletion' },
  { v: 'staff', d: 'Operations: approve, edit, pause, archive, tasks. No roles, settings or permanent deletion' },
  { v: 'viewer', d: 'Read-only access to the portal' },
];

export default function AdminTeam() {
  const { isAdmin } = useTeamRole();
  const team = useQuery({ queryKey: ['adm-team'], queryFn: () => rpc<any[]>('admin_list_team') });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [pending, setPending] = useState<null | { user: string; role: string; grant: boolean; label: string }>(null);

  const apply = async () => {
    if (!pending) return;
    try { await rpc('admin_set_role', { _user: pending.user, _role: pending.role, _grant: pending.grant }); toast({ title: 'Access updated' }); team.refetch(); }
    catch (e) { toast({ title: 'Not changed', description: (e as Error).message, variant: 'destructive' }); }
    setPending(null);
  };
  const add = async () => {
    const { data } = await sb.from('profiles').select('user_id,email').ilike('email', email.trim()).maybeSingle();
    if (!data) return toast({ title: 'No account with that email', description: 'They need to sign up first.', variant: 'destructive' });
    setPending({ user: data.user_id, role, grant: true, label: `Give ${data.email} the ${role} role?` });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Team & access" description="Roles are enforced on the server for every action, not only by hiding buttons." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left font-medium">Member</th><th className="px-3 py-2 text-left font-medium">Roles</th><th /></tr></thead>
            <tbody className="divide-y divide-border">
              {team.isLoading && <tr><td colSpan={3} className="p-4 text-muted-foreground">Loading…</td></tr>}
              {team.error && <tr><td colSpan={3} className="p-4 text-destructive">{(team.error as Error).message}</td></tr>}
              {(team.data ?? []).map((m) => (
                <tr key={m.user_id}>
                  <td className="px-3 py-2"><p className="font-medium text-foreground">{m.full_name || '—'}</p><p className="text-xs text-muted-foreground">{m.email}</p></td>
                  <td className="px-3 py-2 capitalize">{m.roles.join(', ')}</td>
                  <td className="px-3 py-2 text-right">{isAdmin && m.roles.map((r: string) => (
                    <Button key={r} size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => setPending({ user: m.user_id, role: r, grant: false, label: `Remove ${r} from ${m.email}?` })}>Remove {r}</Button>))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="space-y-4">
          {isAdmin && (
            <div className="rounded-lg bg-background p-4">
              <p className="mb-2 text-sm font-medium">Add a team member</p>
              <Input placeholder="Their account email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2" />
              <Select value={role} onValueChange={setRole}><SelectTrigger className="mb-2"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r.v} value={r.v} className="capitalize">{r.v}</SelectItem>)}</SelectContent></Select>
              <Button size="sm" onClick={add} disabled={!email.includes('@')}>Grant access</Button>
            </div>
          )}
          <div className="rounded-lg bg-muted/50 p-4 text-sm">{ROLES.map((r) => <p key={r.v} className="mb-2"><span className="font-medium capitalize">{r.v}:</span> <span className="text-muted-foreground">{r.d}</span></p>)}</div>
        </aside>
      </div>
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Change access</AlertDialogTitle><AlertDialogDescription>{pending?.label} This is recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={apply}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
