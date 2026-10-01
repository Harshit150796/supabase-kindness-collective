import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sb, cleanSearch } from '@/lib/adminApi';

interface Opts {
  table: string;
  select?: string;
  searchCols?: string[];
  defaultSort: { key: string; dir: 'asc' | 'desc' };
  pageSize?: number;
  /** Extra server-side filters applied to the PostgREST builder. */
  filter?: (b: any) => any;
  deps?: unknown[];
}

/** Server-side paginated, sorted, searchable list for admin tables (never loads whole tables). */
export function useAdminPaged<T = any>({ table, select = '*', searchCols = [], defaultSort, pageSize = 25, filter, deps = [] }: Opts) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [dq, setDq] = useState('');
  const [sort, setSort] = useState(defaultSort);
  useEffect(() => { const t = setTimeout(() => { setDq(search); setPage(0); }, 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(0); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  const q = useQuery({
    queryKey: ['adm-paged', table, select, dq, page, sort, pageSize, ...deps],
    queryFn: async () => {
      let b = sb.from(table).select(select, { count: 'exact' });
      if (filter) b = filter(b);
      const s = cleanSearch(dq);
      if (s && searchCols.length) b = b.or(searchCols.map((c) => `${c}.ilike.%${s}%`).join(','));
      const { data, error, count } = await b.order(sort.key, { ascending: sort.dir === 'asc' }).range(page * pageSize, page * pageSize + pageSize - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as T[], total: count ?? 0 };
    },
  });
  const onSort = (k: string) => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));
  return {
    q, rows: q.data?.rows, total: q.data?.total ?? 0, page, setPage, search, setSearch, sort, onSort, pageSize,
    tableProps: { rows: q.data?.rows, total: q.data?.total ?? 0, loading: q.isLoading, error: q.error ? (q.error as Error).message : null, onRetry: () => q.refetch(), page, pageSize, onPage: setPage, sort, onSort },
  };
}
