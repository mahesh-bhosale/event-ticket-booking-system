import { useState } from 'react';
import { useEventList } from '../hooks/useEventList';

import { Button } from '@/components/ui/button';
import { SkeletonGrid } from '../components/common/SkeletonGrid';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Armchair, ChevronLeft, ChevronRight, RefreshCw, Ticket } from 'lucide-react';

export default function EventListPage() {
  const [page, setPage] = useState<number>(1);
  const limit = 6;
  const [dateFilter, setDateFilter] = useState<string>('');

  const { events, pagination, isLoading, error, refetch } = useEventList(
    page,
    limit,
    dateFilter || undefined
  );

  const isError = !!error;
  const totalPages = pagination?.totalPages ?? 1;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleClearFilter = () => {
    setDateFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header and Filter Controls */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/20 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Upcoming Events</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Choose from a wide variety of live shows and secure your tickets instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1.5 text-left">
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="flex h-10 rounded-xl border border-border/40 bg-secondary/30 px-3.5 py-1.5 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary/80 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              aria-label="Filter events by date"
            />
          </div>
          {dateFilter && (
            <Button variant="outline" size="sm" onClick={handleClearFilter} className="rounded-xl border-border/60 hover:bg-secondary/40 font-semibold">
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh list"
            aria-label="Refresh list"
            className="rounded-xl hover:bg-secondary/40"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SkeletonGrid count={limit} />
      ) : isError ? (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
          <AlertTitle className="font-bold">Error Loading Events</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border border-border/20 rounded-2xl bg-card/10">
          <p className="text-lg text-muted-foreground">No upcoming events found.</p>
          {dateFilter && (
            <Button className="mt-4 font-bold rounded-xl" variant="outline" onClick={handleClearFilter}>
              View All Events
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
                {/* Event Cover Banner Visual */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-brand-pink/20 via-brand-purple/15 to-black border border-border/30 flex items-center justify-center transition-all duration-300 group-hover:border-brand-pink/50 group-hover:shadow-brand-glow-sm">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <Ticket className="h-10 w-10 text-primary/45 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                  
                  {/* Date Badge Overlay */}
                  <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-extrabold text-primary tracking-widest uppercase">
                    {new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>

                  {/* Available seats pill */}
                  <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/5 text-[10px] font-bold text-white">
                    <Armchair className="h-3.5 w-3.5 text-primary" />
                    <span>{event.availableSeats} / {event.totalSeats} Available</span>
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
                      <span className="truncate">{event.venue}</span>
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
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="gap-1 font-semibold"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="gap-1 font-semibold"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
