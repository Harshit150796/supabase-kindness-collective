import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, Send } from 'lucide-react';
import { callFn } from '@/lib/serverActions';
import { fmtDate } from '@/lib/adminApi';
import { EMAIL_CATALOG, type AutomationState, type CatalogEmail } from '@/lib/emailCatalog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

type Preview = { subject: string; html: string };

/**
 * Admin > Emails > Automatic emails: every email the site sends on its own, when it goes out, how many
 * went out in the last 30 days, a preview with sample data, a test to your own inbox, and an on/off
 * switch for the ones that are optional.
 */
export function AutomaticEmails({ canWrite }: { canWrite: boolean }) {
  const qc = useQueryClient();
  const state = useQuery({
    queryKey: ['adm-email-automations'],
    queryFn: async () => {
      const r = await callFn<AutomationState>('admin-contact', { action: 'automations' });
      if (r.error || !r.data) throw new Error(r.error ?? 'Could not load the automatic emails.');
      return r.data;
    },
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState<CatalogEmail | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const enabled = (key?: string) => (key ? state.data?.switches.find((s) => s.key === key)?.enabled ?? false : true);

  const toggle = async (email: CatalogEmail, on: boolean) => {
    if (!email.switchKey) return;
    setSaving(email.switchKey);
    const r = await callFn('admin-contact', { action: 'set_automation', key: email.switchKey, enabled: on });
    setSaving(null);
    if (r.error) return toast({ title: 'Could not save', description: r.error, variant: 'destructive' });
    toast({ title: on ? `“${email.name}” is on` : `“${email.name}” is off`, description: on ? 'It starts with what happens from now on. Nothing earlier is emailed late.' : 'No more of these go out until you turn it back on.' });
    qc.invalidateQueries({ queryKey: ['adm-email-automations'] });
  };

  const show = async (email: CatalogEmail) => {
    setOpen(email); setPreview(null); setPreviewError(null);
    const r = await callFn<Preview>('admin-contact', { action: 'preview', key: email.sample });
    if (r.error || !r.data) setPreviewError(r.error ?? 'Could not load the preview.');
    else setPreview(r.data);
  };

  const test = async () => {
    if (!open) return;
    setTesting(true);
    const r = await callFn<{ to: string }>('admin-contact', { action: 'test', key: open.sample });
    setTesting(false);
    if (r.error) return toast({ title: 'Test not sent', description: r.error, variant: 'destructive' });
    toast({ title: 'Test sent', description: `Check ${r.data?.to}. The subject starts with [Test].` });
  };

  return (
    <div className="max-w-4xl space-y-8">
      {state.error && <p className="text-sm text-destructive">{(state.error as Error).message}</p>}
      {EMAIL_CATALOG.map((group) => (
        <section key={group.title}>
          <h2 className="text-base font-medium">{group.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{group.note}</p>
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {group.emails.map((email) => {
              const count = email.countKey ? state.data?.counts[email.countKey] : undefined;
              const on = enabled(email.switchKey);
              return (
                <li key={email.sample} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="font-medium">{email.name}{email.optional && <span className="ml-2 text-xs font-normal text-muted-foreground">Tip, with a “stop these tips” link</span>}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{email.when}</p>
                    {email.countKey && state.data && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {count?.sent ? `${count.sent.toLocaleString()} sent in the last 30 days${count.last ? `, the latest ${fmtDate(count.last)}` : ''}` : 'None sent in the last 30 days'}
                        {count?.failed ? ` · ${count.failed} failed` : ''}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => show(email)}><Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />Preview</Button>
                  {email.switchKey ? (
                    <label className="flex w-20 items-center gap-2 text-sm">
                      <Switch checked={on} disabled={!canWrite || state.isLoading || saving === email.switchKey} onCheckedChange={(v) => toggle(email, v)} aria-label={`${email.name}: ${on ? 'on' : 'off'}`} />
                      {on ? 'On' : 'Off'}
                    </label>
                  ) : <span className="w-20 text-sm text-muted-foreground">Always on</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">Codes, card details and PINs are never put in an email. Previews use sample names and amounts.</p>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle className="break-words pr-6 text-left">{preview?.subject ?? open?.name}</DialogTitle>
            <DialogDescription className="text-left">Subject line above. Sample names and amounts below.</DialogDescription>
          </DialogHeader>
          {previewError ? <p className="text-sm text-destructive">{previewError}</p>
            : !preview ? <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading the preview…</p>
            : <iframe title={`Preview: ${open?.name ?? 'email'}`} sandbox="" srcDoc={preview.html} className="h-[60vh] w-full rounded-md border border-border bg-white" />}
          <div className="flex justify-end">
            <Button onClick={test} disabled={!preview || testing}>{testing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />}Send me a test</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
