import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Calendar, MapPin, Ticket, Clock } from 'lucide-react';
import type { BookingHistoryItem } from '../../types/bookingHistory.types';

interface BookingHistoryCardProps {
  booking: BookingHistoryItem;
}

export function BookingHistoryCard({ booking }: BookingHistoryCardProps) {
  const {
    bookingReference,
    bookedAt,
    eventName,
    venue,
    eventDate,
    seatNumbers,
    totalSeats,
    bookingStatus,
  } = booking;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-brand-glow-sm">
      {/* Top Banner: Booking Reference & Status */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
            Booking Ref
          </span>
          <span className="text-sm font-mono font-bold tracking-wider text-foreground">
            {bookingReference}
          </span>
        </div>
        <Badge variant={bookingStatus === 'COMPLETED' ? 'success' : 'secondary'} className="capitalize">
          {bookingStatus.toLowerCase()}
        </Badge>
      </div>

      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-lg md:text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {eventName}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 pb-4 space-y-4">
        {/* Event Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="truncate">{venue}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
            <span>
              {formatDate(eventDate)} at {formatTime(eventDate)}
            </span>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Seat Allocation details */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Seats Booked</span>
            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
              {seatNumbers.map((seat) => (
                <span
                  key={seat}
                  className="inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-accent/30 border border-accent-foreground/20 text-accent-foreground rounded"
                >
                  {seat}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Quantity</span>
              <span className="text-sm font-bold text-foreground">
                {totalSeats} {totalSeats === 1 ? 'Seat' : 'Seats'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Booking Timestamp */}
      <div className="px-5 py-3 bg-muted/10 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span>Booked on {formatDate(bookedAt)}</span>
      </div>
    </Card>
  );
}

export default BookingHistoryCard;
