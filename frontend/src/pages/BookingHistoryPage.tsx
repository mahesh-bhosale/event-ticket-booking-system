import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBookingHistory } from '../hooks/useBookingHistory';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BookingHistoryList } from '../components/bookings/BookingHistoryList';
import { Search, CalendarDays, RefreshCw, ChevronLeft, ChevronRight, X, Ticket } from 'lucide-react';
import type { BookingHistoryQuery } from '../types/bookingHistory.types';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const TIME_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
] as const;

const LIMIT = 6; // Bookings per page

const selectClasses =
  'flex h-10 rounded-xl border border-border/40 bg-secondary/30 px-3.5 py-1.5 text-sm text-white focus-visible:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary/80 transition-all duration-200 appearance-none cursor-pointer';

// ─────────────────────────────────────────────────────────────
//  Loading Skeleton Component
// ─────────────────────────────────────────────────────────────
function BookingHistorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="border border-border/30 bg-card/20 rounded-xl p-5 space-y-4 animate-pulse"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-36 bg-muted/40" />
            <Skeleton className="h-5 w-20 rounded-full bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 bg-muted/40" />
            <Skeleton className="h-4 w-1/2 bg-muted/40" />
            <Skeleton className="h-4 w-1/3 bg-muted/40" />
          </div>
          <Separator className="bg-border/20" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-32 bg-muted/40" />
            <Skeleton className="h-4 w-12 bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function BookingHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Read filters from URL ───────────────────────────────────
  const urlSearch = searchParams.get('search') ?? '';
  const urlTimeRange = searchParams.get('timeRange') ?? 'all';
  const urlPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  // ── Local search input state + debounce ──────────────────────
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(localSearch, 500);

  // ── Memoize Filters ─────────────────────────────────────────
  const filters: BookingHistoryQuery = useMemo(
    () => ({
      page: urlPage,
      limit: LIMIT,
      search: debouncedSearch || undefined,
      timeRange: urlTimeRange as '30' | '90' | 'all',
    }),
    [urlPage, debouncedSearch, urlTimeRange]
  );

  // ── React Query ─────────────────────────────────────────────
  const { bookings, pagination, isLoading, isFetching, error, refetch } = useBookingHistory(filters);
  const isError = !!error;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.total ?? 0;

  // ── URL synchronization helper ──────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value && value !== 'all') {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        // Reset page to 1 on filter modification
        if (!('page' in updates)) {
          next.delete('page');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (!value) {
        updateParams({ search: '' });
      }
    },
    [updateParams]
  );

  const handleSearchClear = useCallback(() => {
    setLocalSearch('');
    updateParams({ search: '' });
  }, [updateParams]);

  const handleTimeRangeChange = useCallback(
    (value: string) => {
      updateParams({ timeRange: value });
    },
    [updateParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page: String(page) });
    },
    [updateParams]
  );

  const hasActiveFilters = !!(urlSearch || (urlTimeRange && urlTimeRange !== 'all'));

  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-140px)]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Ticket className="h-8 w-8 text-primary" />
            Booking History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage all your event seat bookings.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="rounded-xl border-border/40 hover:bg-secondary/40 font-semibold gap-1.5 h-10"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card/25 backdrop-blur-md border border-border/30 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ref or event name..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border/40 bg-secondary/20 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary/80 transition-all duration-200"
            />
            {localSearch && (
              <button
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white text-muted-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Time range selector */}
          <div className="relative min-w-[150px]">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={urlTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className={`${selectClasses} pl-9 pr-8 w-full`}
              aria-label="Filter by time range"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-card text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters CTA */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs hover:text-white text-muted-foreground rounded-xl self-start md:self-auto"
          >
            Clear Filters
          </Button>
        )}

        {/* Pagination Total Summary */}
        {!isLoading && !isError && totalItems > 0 && (
          <span className="text-xs text-muted-foreground font-medium self-end md:self-auto">
            Total Bookings: <span className="text-white font-semibold">{totalItems}</span>
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <BookingHistorySkeleton />
      ) : isError ? (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
          <AlertTitle>Failed to load booking history</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <span>{error || 'An unexpected error occurred. Please try again.'}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-transparent border-destructive-foreground/20 text-destructive-foreground hover:bg-destructive-foreground/10 self-start sm:self-auto"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <BookingHistoryList bookings={bookings} />
      )}

      {/* Pagination Controls */}
      {!isLoading && !isError && bookings.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(urlPage - 1, 1))}
            disabled={urlPage === 1}
            className="gap-1 font-semibold border-border/40 rounded-xl"
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
            className="gap-1 font-semibold border-border/40 rounded-xl"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
