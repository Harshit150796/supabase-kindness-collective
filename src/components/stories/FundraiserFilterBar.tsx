import { useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import {
  Utensils,
  Stethoscope,
  GraduationCap,
  Plane,
  Home as HomeIcon,
  Zap,
  Baby,
  Siren,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { US_STATES } from '@/data/usStates';

export interface FundraiserFilters {
  category: string;
  state: string;
}

interface CategoryDef {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export const FUNDRAISER_CATEGORIES: CategoryDef[] = [
  { value: 'all', label: 'All causes', Icon: Sparkles },
  { value: 'food', label: 'Food', Icon: Utensils },
  { value: 'health', label: 'Medical', Icon: Stethoscope },
  { value: 'education', label: 'Education', Icon: GraduationCap },
  { value: 'household', label: 'Housing', Icon: HomeIcon },
  { value: 'utilities', label: 'Utilities', Icon: Zap },
  { value: 'childcare', label: 'Childcare', Icon: Baby },
  { value: 'emergency', label: 'Emergency', Icon: Siren },
  { value: 'travel', label: 'Travel', Icon: Plane },
  { value: 'other', label: 'Other', Icon: MoreHorizontal },
];


interface Props {
  filters: FundraiserFilters;
  onChange: (next: FundraiserFilters) => void;
  className?: string;
}

export function FundraiserFilterBar({ filters, onChange, className }: Props) {
  const [stateQuery, setStateQuery] = useState('');
  const activeCategory = FUNDRAISER_CATEGORIES.find((c) => c.value === filters.category) ?? FUNDRAISER_CATEGORIES[0];
  const activeState = filters.state === 'all'
    ? null
    : US_STATES.find((s) => s.code === filters.state);

  const filteredStates = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(stateQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(stateQuery.toLowerCase())
  );

  return (
    <div className={cn('w-full', className)}>
      <div className="flex max-w-full items-center gap-2 overflow-x-auto scrollbar-none pb-1 snap-x">
        {/* Category dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="touch-control min-h-11 shrink-0 snap-start inline-flex items-center gap-2 rounded-full border border-border bg-background hover:bg-muted transition-colors px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              <activeCategory.Icon className="w-4 h-4" />
              {activeCategory.label}
              <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-1 w-56">
            <div className="max-h-72 overflow-y-auto">
              {FUNDRAISER_CATEGORIES.map((c) => {
                const active = c.value === filters.category;
                return (
                  <button
                    key={c.value}
                    onClick={() => onChange({ ...filters, category: c.value })}
                    className={cn(
                      'touch-control min-h-11 w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-left transition-colors',
                      active ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <c.Icon className="w-4 h-4" />
                    <span className="flex-1">{c.label}</span>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* State dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="touch-control min-h-11 shrink-0 snap-start inline-flex items-center gap-2 rounded-full border border-border bg-background hover:bg-muted transition-colors px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              {activeState ? activeState.name : 'All states'}
              <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-2 w-64">
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={stateQuery}
                onChange={(e) => setStateQuery(e.target.value)}
                placeholder="Search state..."
                className="pl-8 h-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              <button
                onClick={() => onChange({ ...filters, state: 'all' })}
                className={cn(
                  'touch-control min-h-11 w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-left transition-colors',
                  filters.state === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                )}
              >
                <span className="flex-1">All states</span>
                {filters.state === 'all' && <Check className="w-4 h-4" />}
              </button>
              {filteredStates.map((s) => {
                const active = s.code === filters.state;
                return (
                  <button
                    key={s.code}
                    onClick={() => onChange({ ...filters, state: s.code })}
                    className={cn(
                      'touch-control min-h-11 w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-left transition-colors',
                      active ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <span className="text-xs font-mono text-muted-foreground w-6">{s.code}</span>
                    <span className="flex-1">{s.name}</span>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
              {filteredStates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">No matches</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        {/* Quick category pills */}
        {FUNDRAISER_CATEGORIES.slice(1, 7).map((c) => {
          const active = c.value === filters.category;
          return (
            <button
              key={c.value}
              onClick={() =>
                onChange({ ...filters, category: active ? 'all' : c.value })
              }
              className={cn(
                'touch-control min-h-11 shrink-0 snap-start inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/70'
              )}
            >
              <c.Icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
