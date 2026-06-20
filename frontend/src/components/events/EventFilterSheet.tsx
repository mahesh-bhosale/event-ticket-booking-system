import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CITY_OPTIONS, SORT_OPTIONS } from './EventFilters';
import type { EventSortOption } from '../../types/event.types';

// ─────────────────────────────────────────────────────────────
//  Mobile Filter Sheet (slide-up panel)
//  Uses the already-installed @radix-ui/react-dialog primitive.
// ─────────────────────────────────────────────────────────────

interface EventFilterSheetProps {
  city: string;
  date: string;
  sort: EventSortOption;
  onCityChange: (city: string) => void;
  onDateChange: (date: string) => void;
  onSortChange: (sort: EventSortOption) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  /** Number of active filter fields for the badge */
  activeFilterCount: number;
}

const selectClasses =
  'flex h-11 w-full rounded-xl border border-border/40 bg-secondary/30 px-3.5 py-2 text-sm text-white focus-visible:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary/80 transition-all duration-200 appearance-none cursor-pointer';

export function EventFilterSheet({
  city,
  date,
  sort,
  onCityChange,
  onDateChange,
  onSortChange,
  onClearAll,
  hasActiveFilters,
  activeFilterCount,
}: EventFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden relative rounded-xl border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-2xl border border-border/30 bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300 focus:outline-none"
          aria-describedby={undefined}
        >
          {/* Handle bar */}
          <div className="flex justify-center mb-4">
            <div className="h-1 w-10 rounded-full bg-border/60" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-bold text-white">
              Filter Events
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-white hover:bg-secondary/60 transition-colors duration-150"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Filter Controls */}
          <div className="space-y-4">
            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="mobile-city-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                City
              </label>
              <select
                id="mobile-city-filter"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                className={selectClasses}
              >
                {CITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label htmlFor="mobile-date-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </label>
              <input
                id="mobile-date-filter"
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className={selectClasses}
              />
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <label htmlFor="mobile-sort-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sort By
              </label>
              <select
                id="mobile-sort-filter"
                value={sort}
                onChange={(e) => onSortChange(e.target.value as EventSortOption)}
                className={selectClasses}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border/20">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  onClearAll();
                  setOpen(false);
                }}
                className="flex-1 rounded-xl font-semibold"
              >
                Clear All
              </Button>
            )}
            <Button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl font-bold text-white"
            >
              Apply Filters
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default EventFilterSheet;
