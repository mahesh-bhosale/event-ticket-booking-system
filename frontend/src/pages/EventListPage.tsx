import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEventList } from '../hooks/useEventList';
import { useDebounce } from '../hooks/useDebounce';

import { Button } from '@/components/ui/button';
import { SkeletonGrid } from '../components/common/SkeletonGrid';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EventSearchBar } from '../components/events/EventSearchBar';
import { EventFilters } from '../components/events/EventFilters';
import { EventFilterSheet } from '../components/events/EventFilterSheet';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Armchair, ChevronLeft, ChevronRight, RefreshCw, SearchX } from 'lucide-react';
import type { EventSortOption, EventQueryFilters } from '../types/event.types';

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const VALID_SORTS: EventSortOption[] = ['date_asc', 'date_desc', 'name_asc', 'name_desc'];
const DEFAULT_SORT: EventSortOption = 'date_asc';
const LIMIT = 6;

function isValidSort(value: string | null): value is EventSortOption {
  return value != null && VALID_SORTS.includes(value as EventSortOption);
}

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
export default function EventListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Read filter state from URL ──────────────────────────────
  const urlSearch = searchParams.get('search') ?? '';
  const urlCity = searchParams.get('city') ?? '';
  const urlDate = searchParams.get('date') ?? '';
  const urlSort: EventSortOption = isValidSort(searchParams.get('sort'))
    ? (searchParams.get('sort') as EventSortOption)
    : DEFAULT_SORT;
  const urlPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  // ── Local search state + debounce ───────────────────────────
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(localSearch, 500);

  // ── Build filters from URL + debounced search ───────────────
  const filters: EventQueryFilters = useMemo(
    () => ({
      page: urlPage,
      limit: LIMIT,
      search: debouncedSearch || undefined,
      city: urlCity || undefined,
      date: urlDate || undefined,
      sort: urlSort,
    }),
    [urlPage, debouncedSearch, urlCity, urlDate, urlSort],
  );

  const { events, pagination, isLoading, error, refetch } = useEventList(filters);
  const isError = !!error;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? null;

  // ── URL update helper ───────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        // Reset to page 1 when filters change (unless page itself is being updated)
        if (!('page' in updates)) {
          next.delete('page');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  // ── Filter change handlers ──────────────────────────────────
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Sync empty value immediately so the URL clears
      if (!value) {
        updateParams({ search: '' });
      }
    },
    [updateParams],
  );

  const handleSearchCommit = useCallback(
    (value: string) => {
      updateParams({ search: value });
    },
    [updateParams],
  );

  const handleCityChange = useCallback(
    (city: string) => updateParams({ city }),
    [updateParams],
  );

  const handleDateChange = useCallback(
    (date: string) => updateParams({ date }),
    [updateParams],
  );

  const handleSortChange = useCallback(
    (sort: EventSortOption) => updateParams({ sort: sort === DEFAULT_SORT ? '' : sort }),
    [updateParams],
  );

  const handleClearAll = useCallback(() => {
    setLocalSearch('');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (newPage: number) => updateParams({ page: newPage === 1 ? '' : String(newPage) }),
    [updateParams],
  );

  // ── Derived state ───────────────────────────────────────────
  const hasActiveFilters = !!(urlSearch || urlCity || urlDate || urlSort !== DEFAULT_SORT);
  const activeFilterCount = [urlCity, urlDate, urlSort !== DEFAULT_SORT ? urlSort : ''].filter(Boolean).length;

  // Sync debounced search back to URL
  // (useEffect to push debounced value to URL after delay)
  // This is handled automatically: debouncedSearch feeds into filters → useEventList.
  // The URL gets the raw search immediately via handleSearchCommit on Enter,
  // or lazily via the debounced value comparison below.
  useMemo(() => {
    if (debouncedSearch !== urlSearch) {
      updateParams({ search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-border/20 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Upcoming Events</h1>
          <p className="text-sm text-muted-foreground">
            Choose from a wide variety of live shows and secure your tickets instantly.
          </p>
        </div>

        {/* Search + Mobile Filter Trigger + Refresh */}
        <div className="flex items-center gap-3">
          <EventSearchBar
            value={localSearch}
            onChange={handleSearchChange}
            onCommit={handleSearchCommit}
          />

          <EventFilterSheet
            city={urlCity}
            date={urlDate}
            sort={urlSort}
            onCityChange={handleCityChange}
            onDateChange={handleDateChange}
            onSortChange={handleSortChange}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh list"
            aria-label="Refresh list"
            className="rounded-xl hover:bg-secondary/40 flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Desktop Filters */}
        <EventFilters
          city={urlCity}
          date={urlDate}
          sort={urlSort}
          totalItems={!isLoading && !isError ? totalItems : null}
          onCityChange={handleCityChange}
          onDateChange={handleDateChange}
          onSortChange={handleSortChange}
          onClearAll={handleClearAll}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Mobile result count */}
        {!isLoading && !isError && totalItems != null && (
          <span className="md:hidden text-xs text-muted-foreground font-medium tabular-nums">
            Showing{' '}
            <span className="text-white font-semibold">{totalItems}</span>{' '}
            event{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SkeletonGrid count={LIMIT} />
      ) : isError ? (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
          <AlertTitle className="font-bold">Error Loading Events</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border border-border/20 rounded-2xl bg-card/10">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-secondary/40">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-semibold text-white mb-1">No events found</p>
          <p className="text-sm text-muted-foreground mb-5">
            {hasActiveFilters
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'No upcoming events are currently available.'}
          </p>
          {hasActiveFilters && (
            <Button
              className="font-bold rounded-xl"
              variant="outline"
              onClick={handleClearAll}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const formattedDate = new Date(event.dateTime).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={event._id}
                className="group flex flex-col space-y-3.5 bg-transparent border-0 shadow-none hover:translate-y-[-6px] transition-all duration-300"
              >
                {/* Event Cover Image */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-border/30 transition-all duration-300 group-hover:border-brand-pink/50 group-hover:shadow-brand-glow-sm">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Category Badge (top-left) */}
                  {event.category && (
                    <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-xl bg-brand-pink/90 backdrop-blur-md text-[10px] font-extrabold text-white tracking-widest uppercase shadow-md">
                      {event.category}
                    </div>
                  )}

                  {/* Date Badge Overlay (top-right) */}
                  <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-extrabold text-primary tracking-widest uppercase">
                    {new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>

                  {/* Price Badge (bottom-left) */}
                  {event.price != null && event.price > 0 && (
                    <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/5 text-xs font-bold text-white">
                      From <span className="text-primary">₹{event.price.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {/* Available seats pill (bottom-right) */}
                  <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/5 text-[10px] font-bold text-white">
                    <Armchair className="h-3.5 w-3.5 text-primary" />
                    <span>{event.availableSeats} / {event.totalSeats}</span>
                  </div>
                </div>

                {/* Event Meta Details */}
                <div className="space-y-2 px-1">
                  <h3 className="text-xl font-extrabold text-white line-clamp-1 group-hover:text-primary transition-colors duration-200">
                    {event.name}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                    {event.description}
                  </p>

                  <div className="flex flex-col gap-1.5 pt-2 text-xs text-muted-foreground border-t border-border/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="truncate">
                        {event.venue}{event.location ? `, ${event.location}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Button asChild size="sm" className="w-full mt-2 font-bold rounded-xl h-10 text-white shadow-md shadow-primary/10 group-hover:shadow-primary/25 transition-all duration-300">
                  <Link to={`/events/${event._id}`}>
                    Book Seats
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !isError && events.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(urlPage - 1, 1))}
            disabled={urlPage === 1}
            className="gap-1 font-semibold"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {urlPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(urlPage + 1, totalPages))}
            disabled={urlPage === totalPages}
            className="gap-1 font-semibold"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
