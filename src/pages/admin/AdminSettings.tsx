import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { PaymentProcessorsCard } from '@/components/admin/PaymentProcessorsCard';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { isAdmin } = useTeamRole();
  const s = useQuery({ queryKey: ['adm-settings'], queryFn: async () => { const { data, error } = await sb.from('admin_settings').select('*').eq('id', 1).single(); if (error) throw error; return data; } });
  const [recips, setRecips] = useState('');
  useEffect(() => { if (s.data) setRecips((s.data.notification_recipients ?? []).join('\n')); }, [s.data]);

  const save = async (patch: Record<string, unknown>) => {
    try { await rpc('admin_update_settings', { _patch: patch }); toast({ title: 'Settings saved' }); s.refetch(); }
    catch (e) { toast({ title: 'Not saved', description: (e as Error).message, variant: 'destructive' }); }
  };

  const Row = ({ k, title, desc }: { k: string; title: string; desc: string }) => (
    <div className="flex items-start justify-between gap-4 py-4">
      <div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
      <Switch disabled={!isAdmin || !s.data} checked={!!s.data?.[k]} onCheckedChange={(v) => save({ [k]: v })} aria-label={title} />
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader title="Settings" description={isAdmin ? 'Only admins can change these settings. Every change is recorded in the audit log.' : 'Read-only: only admins can change settings.'} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-background p-5">
          <h2 className="text-base font-medium">Fundraiser approval</h2>
          <div className="divide-y divide-border">
            <Row k="require_fundraiser_approval" title="Require approval before new fundraisers go live" desc="When on, new fundraisers start as pending and appear in the approval queue. Off keeps today's behaviour." />
          </div>
        </section>
        <section className="rounded-lg bg-background p-5">
          <h2 className="text-base font-medium">Email notifications</h2>
          <div className="divide-y divide-border">
            <Row k="email_new_fundraiser" title="New fundraiser created" desc="Checked every 5 minutes; several events are combined into one digest." />
            <Row k="email_new_donation" title="Donation completed" desc="Shows donor display name (or Anonymous), amount, fundraiser or retailer and time. No contact or payment details." />
          </div>
          <div className="mt-3">
            <Label className="text-xs">Recipients (one per line)</Label>
            <Textarea rows={3} disabled={!isAdmin} value={recips} onChange={(e) => setRecips(e.target.value)} />
            {isAdmin && <Button size="sm" className="mt-2" onClick={() => save({ notification_recipients: recips.split(/[\s,]+/).filter(Boolean) })}>Save recipients</Button>}
          </div>
          {s.data?.updated_at && <p className="mt-3 text-xs text-muted-foreground">Last changed {fmtDate(s.data.updated_at)}</p>}
        </section>
        {isAdmin && <div className="lg:col-span-2"><PaymentProcessorsCard /></div>}
      </div>
    </DashboardLayout>
  );
}
