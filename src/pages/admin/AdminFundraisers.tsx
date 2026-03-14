import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, Search, ExternalLink, MapPin, Users,
  DollarSign, Eye, Megaphone, Pause, CheckCircle, Clock, TrendingUp,
  Globe, ArrowUpDown, Upload, Star, X, Loader2, ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface FundraiserImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean | null;
}

interface FundraiserWithProfile {
  id: string;
  title: string;
  story: string;
  category: string;
  beneficiary_type: string;
  monthly_goal: number;
  amount_raised: number | null;
  donors_count: number | null;
  unique_slug: string | null;
  cover_photo_url: string | null;
  country: string | null;
  zip_code: string | null;
  status: string | null;
  is_long_term: boolean | null;
  created_at: string | null;
  user_id: string;
  profiles: { email: string; full_name: string | null } | null;
}

interface FundraiserForm {
  title: string;
  story: string;
  category: string;
  beneficiary_type: string;
  monthly_goal: number;
  amount_raised: number;
  donors_count: number;
  country: string;
  zip_code: string;
  cover_photo_url: string;
  status: string;
  is_long_term: boolean;
}

const emptyForm: FundraiserForm = {
  title: '', story: '', category: 'food', beneficiary_type: 'myself',
  monthly_goal: 0, amount_raised: 0, donors_count: 0, country: '', zip_code: '',
  cover_photo_url: '', status: 'active', is_long_term: false,
};

const statuses = ['all', 'active', 'pending', 'paused', 'completed'] as const;
const categoryOptions = ['food', 'household', 'health', 'childcare', 'education', 'utilities', 'other'] as const;

type SortField = 'created_at' | 'amount_raised' | 'monthly_goal' | 'donors_count';

export default function AdminFundraisers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FundraiserForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: fundraisers, isLoading } = useQuery({
    queryKey: ['admin-fundraisers'],
    queryFn: async () => {
      // Fetch fundraisers
      const { data: fundraiserData, error } = await supabase
        .from('fundraisers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profiles for organizer info
      const userIds = [...new Set((fundraiserData || []).map(f => f.user_id))];
      let profileMap: Record<string, { email: string; full_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
        (profiles || []).forEach(p => { profileMap[p.user_id] = { email: p.email, full_name: p.full_name }; });
      }
      
      return (fundraiserData || []).map(f => ({
        ...f,
        profiles: profileMap[f.user_id] || null,
      })) as FundraiserWithProfile[];
    },
  });

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [search, statusFilter, categoryFilter]);

  const filtered = (fundraisers || [])
    .filter(f => {
      const matchesSearch = !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.story.toLowerCase().includes(search.toLowerCase()) ||
        f.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        f.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      const av = (a as any)[sortField] ?? 0;
      const bv = (b as any)[sortField] ?? 0;
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Stats
  const all = fundraisers || [];
  const activeCount = all.filter(f => f.status === 'active').length;
  const pendingCount = all.filter(f => f.status === 'pending').length;
  const totalRaised = all.reduce((s, f) => s + (f.amount_raised || 0), 0);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(f => f.id)));
  };

  const openEdit = (f: FundraiserWithProfile) => {
    setForm({
      title: f.title, story: f.story, category: f.category,
      beneficiary_type: f.beneficiary_type, monthly_goal: f.monthly_goal,
      amount_raised: f.amount_raised || 0, donors_count: f.donors_count || 0,
      country: f.country || '', zip_code: f.zip_code || '',
      cover_photo_url: f.cover_photo_url || '', status: f.status || 'active',
      is_long_term: f.is_long_term || false,
    });
    setEditId(f.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.story) {
      toast({ title: 'Title and story are required', variant: 'destructive' });
      return;
    }
    if (!editId) return;
    const { error } = await supabase.from('fundraisers').update({
      title: form.title, story: form.story, category: form.category,
      beneficiary_type: form.beneficiary_type, monthly_goal: form.monthly_goal,
      amount_raised: form.amount_raised, donors_count: form.donors_count,
      country: form.country || null, zip_code: form.zip_code || null,
      cover_photo_url: form.cover_photo_url || null, status: form.status,
      is_long_term: form.is_long_term,
    }).eq('id', editId);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Fundraiser updated!' });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-fundraisers'] });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('fundraisers').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Fundraiser deleted' }); queryClient.invalidateQueries({ queryKey: ['admin-fundraisers'] }); }
    setDeleteId(null);
  };

  const bulkAction = async (action: 'activate' | 'pause' | 'delete') => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (action === 'delete') {
      setBulkDeleteOpen(true);
      return;
    }
    const status = action === 'activate' ? 'active' : 'paused';
    await Promise.all(ids.map(id => supabase.from('fundraisers').update({ status }).eq('id', id)));
    toast({ title: `${ids.length} fundraisers ${action === 'activate' ? 'activated' : 'paused'}` });
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-fundraisers'] });
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selected);
    await Promise.all(ids.map(id => supabase.from('fundraisers').delete().eq('id', id)));
    toast({ title: `${ids.length} fundraisers deleted` });
    setSelected(new Set());
    setBulkDeleteOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-fundraisers'] });
  };

  const changeStatus = async (id: string, status: string) => {
    await supabase.from('fundraisers').update({ status }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-fundraisers'] });
    toast({ title: `Status changed to ${status}` });
  };

  const progressPercent = (raised: number | null, goal: number) =>
    goal > 0 ? Math.min(100, Math.round(((raised || 0) / goal) * 100)) : 0;

  const statusBadge = (status: string | null) => {
    const s = status || 'pending';
    const map: Record<string, { class: string; icon: typeof Eye }> = {
      active: { class: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', icon: Eye },
      pending: { class: 'bg-amber-500/15 text-amber-700 border-amber-500/30', icon: Clock },
      paused: { class: 'bg-orange-500/15 text-orange-700 border-orange-500/30', icon: Pause },
      completed: { class: 'bg-primary/15 text-primary border-primary/30', icon: CheckCircle },
    };
    const cfg = map[s] || map.pending;
    const Icon = cfg.icon;
    return (
      <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.class}`}>
        <Icon className="w-3 h-3" />{s}
      </Badge>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-8 h-8 text-primary" />
              Fundraiser Management
            </h1>
            <p className="text-muted-foreground mt-1">Moderate and manage all user-created fundraiser campaigns</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: all.length, icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Active', value: activeCount, icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'Total Raised', value: `$${totalRaised.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by title, story, or organizer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              {statuses.map(s => (
                <TabsTrigger key={s} value={s} className="capitalize text-xs">
                  {s === 'all' ? `All (${all.length})` : `${s} (${all.filter(f => f.status === s).length})`}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          {([
            ['created_at', 'Date'],
            ['amount_raised', 'Raised'],
            ['monthly_goal', 'Goal'],
            ['donors_count', 'Donors'],
          ] as [SortField, string][]).map(([field, label]) => (
            <Button
              key={field}
              size="sm"
              variant={sortField === field ? 'default' : 'outline'}
              className="text-xs gap-1 h-7"
              onClick={() => handleSort(field)}
            >
              {label}
              <ArrowUpDown className="w-3 h-3" />
            </Button>
          ))}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium text-primary">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkAction('activate')}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('pause')}>Pause</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => bulkAction('delete')}>Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading fundraisers...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {search || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No fundraisers match your filters' : 'No fundraisers yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Fundraisers created by users will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Checkbox checked={selected.size === paginated.length && paginated.length > 0} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">Select all ({paginated.length})</span>
            </div>
            {paginated.map(f => {
              const pct = progressPercent(f.amount_raised, f.monthly_goal);
              return (
                <Card key={f.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggleSelect(f.id)} className="mt-1" />

                      {/* Thumbnail */}
                      {f.cover_photo_url ? (
                        <img src={f.cover_photo_url} alt={f.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{f.title}</h3>
                              {statusBadge(f.status)}
                              <Badge variant="outline" className="text-[10px] font-normal capitalize">{f.category}</Badge>
                              {f.is_long_term && <Badge variant="outline" className="text-[10px] font-normal">Long-term</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{f.story}</p>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />{f.donors_count || 0} donors
                          </span>
                          {f.country && (
                            <span className="inline-flex items-center gap-1">
                              <Globe className="w-3 h-3" />{f.country}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDate(f.created_at)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-muted-foreground/70">
                            by {f.profiles?.full_name || f.profiles?.email || 'Unknown'}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-3 max-w-md">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs font-medium text-foreground whitespace-nowrap">
                            ${(f.amount_raised || 0).toLocaleString()} / ${f.monthly_goal.toLocaleString()}
                            <span className="text-muted-foreground"> ({pct}%)</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {f.unique_slug && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(`/f/${f.unique_slug}`, '_blank')} title="View public page">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Select value={f.status || 'pending'} onValueChange={v => changeStatus(f.id, v)}>
                          <SelectTrigger className="h-8 w-[100px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(f)}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => setDeleteId(f.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fundraiser?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The fundraiser and all its data will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} fundraisers?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. All selected fundraisers will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fundraiser</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Story</Label>
              <Textarea value={form.story} onChange={e => setForm(p => ({ ...p, story: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Beneficiary Type</Label>
                <Select value={form.beneficiary_type} onValueChange={v => setForm(p => ({ ...p, beneficiary_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="myself">Myself</SelectItem>
                    <SelectItem value="family">Family Member</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Monthly Goal ($)</Label>
                <Input type="number" value={form.monthly_goal} onChange={e => setForm(p => ({ ...p, monthly_goal: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Amount Raised ($)</Label>
                <Input type="number" value={form.amount_raised} onChange={e => setForm(p => ({ ...p, amount_raised: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Donors Count</Label>
                <Input type="number" value={form.donors_count} onChange={e => setForm(p => ({ ...p, donors_count: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div>
                <Label>Zip Code</Label>
                <Input value={form.zip_code} onChange={e => setForm(p => ({ ...p, zip_code: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Cover Photo URL</Label>
              <Input value={form.cover_photo_url} onChange={e => setForm(p => ({ ...p, cover_photo_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_long_term} onCheckedChange={v => setForm(p => ({ ...p, is_long_term: v }))} />
                <Label>Long-term campaign</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
