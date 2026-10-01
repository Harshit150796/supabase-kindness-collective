import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  total?: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  empty?: string;
  rowClassName?: (row: T) => string | undefined;
}

/** Server-paginated table: callers fetch only the current page and pass `total`. */
export function DataTable<T>({ columns, rows, loading, error, onRetry, total = 0, page, pageSize, onPage, sort, onSort, onRowClick, rowKey, empty = 'Nothing here yet.', rowClassName }: Props<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="max-h-[70vh] overflow-auto">
        <Table className="tabular-nums text-sm">
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={cn('h-10 whitespace-nowrap text-xs font-medium', c.align === 'right' && 'text-right', c.className)}>
                  {c.sortable && onSort ? (
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort(c.key)}>
                      {c.header}
                      {sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>{columns.map((c) => <TableCell key={c.key}><Skeleton className="h-4 w-full max-w-[160px]" /></TableCell>)}</TableRow>
              ))
            ) : error ? (
              <TableRow><TableCell colSpan={columns.length} className="py-12 text-center">
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
                <p className="text-sm text-foreground">Couldn't load this list.</p>
                <p className="mb-3 text-xs text-muted-foreground">{error}</p>
                {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>}
              </TableCell></TableRow>
            ) : !rows?.length ? (
              <TableRow><TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-6 w-6" />{empty}
              </TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn(onRowClick && 'cursor-pointer', rowClassName?.(r))}>
                  {columns.map((c) => <TableCell key={c.key} className={cn('py-2.5', c.align === 'right' && 'text-right', c.className)}>{c.cell(r)}</TableCell>)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span>{total.toLocaleString()} record{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <span>Page {page + 1} of {pages}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  active: 'bg-primary/10 text-primary', completed: 'bg-primary/10 text-primary', succeeded: 'bg-primary/10 text-primary', done: 'bg-primary/10 text-primary', approved: 'bg-primary/10 text-primary', resolved: 'bg-primary/10 text-primary',
  pending: 'bg-verify/10 text-verify', todo: 'bg-muted text-foreground', in_progress: 'bg-verify/10 text-verify', open: 'bg-verify/10 text-verify',
  paused: 'bg-muted text-muted-foreground', archived: 'bg-muted text-muted-foreground', expired: 'bg-muted text-muted-foreground', dismissed: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive', failed: 'bg-destructive/10 text-destructive', blocked: 'bg-destructive/10 text-destructive', urgent: 'bg-destructive/10 text-destructive',
  high: 'bg-ink text-ink-foreground', medium: 'bg-muted text-foreground', low: 'bg-muted text-muted-foreground',
};
export function StatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'unknown';
  return <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize', TONES[v] ?? 'bg-muted text-muted-foreground')}>{v.replace('_', ' ')}</span>;
}
