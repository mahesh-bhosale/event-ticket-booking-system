import { useState } from 'react';
import { useEventList } from '../hooks/useEventList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonGrid } from '../components/common/SkeletonGrid';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Armchair, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Upcoming Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose from a wide variety of live shows and secure your tickets instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1.5 text-left">
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Filter events by date"
            />
          </div>
          {dateFilter && (
            <Button variant="outline" size="sm" onClick={handleClearFilter}>
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
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SkeletonGrid count={limit} />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle className="font-bold">Error Loading Events</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card/50">
          <p className="text-lg text-muted-foreground">No upcoming events found.</p>
          {dateFilter && (
            <Button className="mt-4 font-semibold" variant="outline" onClick={handleClearFilter}>
              View All Events
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Card key={event._id} className="flex flex-col border-border/40 hover:border-border/90 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold line-clamp-1">{event.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs truncate">{formattedDate}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-4 border-t bg-accent/10">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Armchair className="h-4 w-4 text-primary" />
                    <span>{event.availableSeats} of {event.totalSeats} seats</span>
                  </div>
                  <Button asChild size="sm" className="font-bold">
                    <Link to={`/events/${event._id}`}>
                      Book Seats
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
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
