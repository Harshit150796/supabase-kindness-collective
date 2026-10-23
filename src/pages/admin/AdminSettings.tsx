import { useEffect, useState } from 'react';
import { useAdminDirtyGuard } from '@/hooks/useAdminDirtyGuard';
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
  const [busy, setBusy] = useState(false);
  const dirty = !!s.data && recips !== (s.data.notification_recipients ?? []).join('\n');
  useAdminDirtyGuard(dirty);
  useEffect(() => { if (s.data) setRecips((s.data.notification_recipients ?? []).join('\n')); }, [s.data]);

  const save = async (patch: Record<string, unknown>) => {
    setBusy(true);
    try { await rpc('admin_update_settings', { _patch: patch }); toast({ title: 'Settings saved' }); s.refetch(); }
    catch (e) { toast({ title: 'Not saved', description: (e as Error).message, variant: 'destructive' }); } finally { setBusy(false); }
  };

  const Row = ({ k, title, desc }: { k: string; title: string; desc: string }) => (
    <div className="flex items-start justify-between gap-4 py-4">
      <div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
      <Switch disabled={!isAdmin || !s.data || busy} checked={!!s.data?.[k]} onCheckedChange={(v) => save({ [k]: v })} aria-label={title} />
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader title="Settings" description={isAdmin ? 'Only admins can change these settings. Every change is recorded in the audit log.' : 'Read-only: only admins can change settings.'} />
      {s.error && <Button variant="outline" onClick={() => s.refetch()}>Retry settings</Button>}
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
            {isAdmin && <Button size="sm" className="mt-2" disabled={busy || !dirty} onClick={() => { const recipients = recips.split(/[\s,]+/).filter(Boolean); if (recipients.some((email) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) { toast({ title: 'Enter valid recipient email addresses', variant: 'destructive' }); return; } void save({ notification_recipients: recipients }); }}>Save recipients</Button>}
          </div>
          {s.data?.updated_at && <p className="mt-3 text-xs text-muted-foreground">Last changed {fmtDate(s.data.updated_at)}</p>}
        </section>
        <section className="rounded-lg bg-background p-5">
          <h2 className="text-base font-medium">Homepage figures</h2>
          <div className="divide-y divide-border">
            <Row k="include_trial_stats" title="Include trial coupons on the homepage" desc="Adds the separate trial coupons to the public issued, received and used figures. Turn off before publishing to show real coupons only." />
          </div>
        </section>
        {isAdmin && <div className="lg:col-span-2"><PaymentProcessorsCard /></div>}
      </div>
    </DashboardLayout>
  );
}
