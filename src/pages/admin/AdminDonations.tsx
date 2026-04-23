import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Search, DollarSign, TrendingUp, Users, ExternalLink, Loader2,
  CreditCard, Mail, User as UserIcon, Megaphone, Link as LinkIcon, Check,
} from 'lucide-react';

interface DonationRow {
  id: string;
  amount: number;
  net_amount: number | null;
  stripe_fee: number | null;
  currency: string | null;
  status: string | null;
  donor_id: string | null;
  donor_email: string | null;
  donor_name: string | null;
  brand_partner: string | null;
  fundraiser_id: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  message: string | null;
  is_anonymous: boolean | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

interface FundraiserLite { id: string; title: string; unique_slug: string | null; }

const STATUSES = ['all', 'completed', 'pending', 'failed', 'refunded', 'expired'] as const;

export default function AdminDonations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fundraiserFilter, setFundraiserFilter] = useState<string>('all');
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [reassignFundraiserId, setReassignFundraiserId] = useState<string>('');
  const [backfilling, setBackfilling] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const { data: donations, isLoading } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DonationRow[];
    },
  });

  const { data: fundraisers } = useQuery({
    queryKey: ['admin-donations-fundraisers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fundraisers')
        .select('id, title, unique_slug')
        .order('title');
      if (error) throw error;
      return (data || []) as FundraiserLite[];
    },
  });

  const fundraiserMap = useMemo(() => {
    const m = new Map<string, FundraiserLite>();
    (fundraisers || []).forEach(f => m.set(f.id, f));
    return m;
  }, [fundraisers]);

  const filtered = useMemo(() => {
    const all = donations || [];
    return all.filter(d => {
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesFundraiser =
        fundraiserFilter === 'all' ||
        (fundraiserFilter === 'unattributed' && !d.fundraiser_id) ||
        d.fundraiser_id === fundraiserFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        d.donor_email?.toLowerCase().includes(q) ||
        d.donor_name?.toLowerCase().includes(q) ||
        d.brand_partner?.toLowerCase().includes(q) ||
        d.stripe_session_id?.toLowerCase().includes(q) ||
        d.stripe_payment_intent_id?.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q);
      return matchesStatus && matchesFundraiser && matchesSearch;
    });
  }, [donations, search, statusFilter, fundraiserFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Stats
  const all = donations || [];
  const completed = all.filter(d => d.status === 'completed');
  const totalRaised = completed.reduce((s, d) => s + (d.amount || 0), 0);
  const unattributed = completed.filter(d => !d.fundraiser_id).length;
  const uniqueDonors = new Set(completed.map(d => d.donor_id || d.donor_email).filter(Boolean)).size;

  const handleReassign = async () => {
    if (!selectedDonation) return;
    const newId = reassignFundraiserId === '__none__' ? null : reassignFundraiserId;
    const { error } = await supabase
      .from('donations')
      .update({ fundraiser_id: newId })
      .eq('id', selectedDonation.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    // Manually update fundraiser totals via RPC if reassigning to a new fundraiser
    if (newId && selectedDonation.status === 'completed') {
      await supabase.rpc('apply_donation_to_fundraiser', {
        _fundraiser_id: newId,
        _amount: selectedDonation.amount,
        _donor_email: selectedDonation.donor_email,
        _donor_id: selectedDonation.donor_id,
      });
    }
    toast({ title: 'Donation re-attributed' });
    qc.invalidateQueries({ queryKey: ['admin-donations'] });
    setSelectedDonation(null);
  };

  const runBackfill = async () => {
    setBackfilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-stripe-donations', {
        body: { limit: 100 },
      });
      if (error) throw error;
      toast({
        title: 'Backfill complete',
        description: `Processed ${data?.processed || 0}, skipped ${data?.skipped || 0}, failed ${data?.failed || 0}`,
      });
      qc.invalidateQueries({ queryKey: ['admin-donations'] });
    } catch (e: any) {
      toast({ title: 'Backfill failed', description: e.message, variant: 'destructive' });
    } finally {
      setBackfilling(false);
    }
  };

  const statusBadge = (status: string | null) => {
    const map: Record<string, string> = {
      completed: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
      pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
      failed: 'bg-red-500/15 text-red-700 border-red-500/30',
      refunded: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
      expired: 'bg-muted text-muted-foreground border-border',
    };
    return (
      <Badge variant="outline" className={`text-[10px] ${map[status || ''] || map.expired}`}>
        {status || 'unknown'}
      </Badge>
    );
  };

  const fundraiserCell = (d: DonationRow) => {
    if (!d.fundraiser_id) {
      return <span className="text-xs text-amber-600 font-medium">Unattributed</span>;
    }
    const f = fundraiserMap.get(d.fundraiser_id);
    if (!f) return <span className="text-xs text-muted-foreground">{d.fundraiser_id.slice(0, 8)}…</span>;
    return (
      <a
        href={f.unique_slug ? `/f/${f.unique_slug}` : `/fundraiser/${f.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
        title={f.title}
      >
        <LinkIcon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{f.title}</span>
      </a>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-primary" />
              Donations
            </h1>
            <p className="text-muted-foreground mt-1">All donor transactions and fundraiser attribution</p>
          </div>
          <Button onClick={runBackfill} disabled={backfilling} variant="outline">
            {backfilling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            Sync from Stripe
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Donations', value: all.length, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Total Raised', value: `$${totalRaised.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'Unique Donors', value: uniqueDonors, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Unattributed', value: unattributed, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          ].map(s => (
            <Card key={s.label} className="border-none shadow-sm bg-muted/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, brand, session id…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="pl-10"
              />
            </div>
            <Select value={fundraiserFilter} onValueChange={(v) => { setFundraiserFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Fundraiser" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fundraisers</SelectItem>
                <SelectItem value="unattributed">Unattributed only</SelectItem>
                {(fundraisers || []).map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <TabsList>
              {STATUSES.map(s => (
                <TabsTrigger key={s} value={s} className="capitalize text-xs">
                  {s === 'all' ? `All (${all.length})` : `${s} (${all.filter(d => d.status === s).length})`}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No donations match your filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fundraiser</TableHead>
                    <TableHead>Brand(s)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(d => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => { setSelectedDonation(d); setReassignFundraiserId(d.fundraiser_id || '__none__'); }}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString()}
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{d.donor_name || (d.is_anonymous ? 'Anonymous' : '—')}</div>
                        <div className="text-muted-foreground truncate max-w-[180px]">{d.donor_email || '—'}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        ${d.amount.toFixed(2)}
                        {d.net_amount != null && (
                          <div className="text-[10px] text-muted-foreground font-normal">net ${d.net_amount.toFixed(2)}</div>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell>{fundraiserCell(d)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate" title={d.brand_partner || ''}>
                        {d.brand_partner || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.receipt_url && (
                          <a href={d.receipt_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></Button>
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Donation Details
            </DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><UserIcon className="w-3 h-3" /> Donor name</p>
                  <p className="font-medium">{selectedDonation.donor_name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="font-medium break-all">{selectedDonation.donor_email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">${selectedDonation.amount.toFixed(2)} {selectedDonation.currency?.toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Net (after Stripe fee)</p>
                  <p className="font-medium">
                    ${selectedDonation.net_amount?.toFixed(2) ?? '—'}
                    {selectedDonation.stripe_fee != null && (
                      <span className="text-xs text-muted-foreground ml-1">(fee ${selectedDonation.stripe_fee.toFixed(2)})</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment method</p>
                  <p className="font-medium">{selectedDonation.payment_method || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div>{statusBadge(selectedDonation.status)}</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground">Brand allocation</p>
                  <p className="font-medium">{selectedDonation.brand_partner || 'No brand selected'}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground">Stripe session</p>
                  <p className="font-mono text-[11px] break-all">{selectedDonation.stripe_session_id || '—'}</p>
                </div>
              </div>

              {/* Reassign fundraiser */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fundraiser attribution</p>
                <div className="flex gap-2">
                  <Select value={reassignFundraiserId} onValueChange={setReassignFundraiserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select fundraiser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Unattributed —</SelectItem>
                      {(fundraisers || []).map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleReassign} size="sm">
                    <Check className="w-4 h-4 mr-1" /> Save
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Re-attributing a completed donation also adds its amount to the new fundraiser's totals.
                </p>
              </div>

              {selectedDonation.receipt_url && (
                <div className="border-t pt-4">
                  <a href={selectedDonation.receipt_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" /> View Stripe receipt
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
