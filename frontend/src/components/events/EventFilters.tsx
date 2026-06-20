import { MapPin, ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventSortOption } from '../../types/event.types';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
export const CITY_OPTIONS = [
  { value: '', label: 'All Cities' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Pune', label: 'Pune' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Bangalore', label: 'Bangalore' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Kolkata', label: 'Kolkata' },
] as const;

export const SORT_OPTIONS: { value: EventSortOption; label: string }[] = [
  { value: 'date_asc', label: 'Date (Oldest First)' },
  { value: 'date_desc', label: 'Date (Newest First)' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
];

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
interface EventFiltersProps {
  city: string;
  date: string;
  sort: EventSortOption;
  totalItems: number | null;
  onCityChange: (city: string) => void;
  onDateChange: (date: string) => void;
  onSortChange: (sort: EventSortOption) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const selectClasses =
  'flex h-10 rounded-xl border border-border/40 bg-secondary/30 px-3.5 py-1.5 text-sm text-white focus-visible:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary/80 transition-all duration-200 appearance-none cursor-pointer';

export function EventFilters({
  city,
  date,
  sort,
  totalItems,
  onCityChange,
  onDateChange,
  onSortChange,
  onClearAll,
  hasActiveFilters,
}: EventFiltersProps) {
  return (
    <div className="hidden md:flex items-center gap-3 flex-wrap">
      {/* City Filter */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className={`${selectClasses} pl-9 pr-8 min-w-[140px]`}
          aria-label="Filter by city"
          id="city-filter"
        >
          {CITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Filter */}
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className={`${selectClasses} min-w-[150px]`}
        aria-label="Filter events by date"
        id="date-filter"
      />

      {/* Sort */}
      <div className="relative">
        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as EventSortOption)}
          className={`${selectClasses} pl-9 pr-8 min-w-[170px]`}
          aria-label="Sort events"
          id="sort-filter"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="rounded-xl border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Clear All
        </Button>
      )}

      {/* Result Count */}
      {totalItems != null && (
        <span className="ml-auto text-xs text-muted-foreground font-medium tabular-nums">
          Showing{' '}
          <span className="text-white font-semibold">{totalItems}</span>{' '}
          event{totalItems !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

export default EventFilters;
