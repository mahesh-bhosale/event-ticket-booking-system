import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { BookingHistoryCard } from './BookingHistoryCard';
import { CalendarDays } from 'lucide-react';
import type { BookingHistoryItem } from '../../types/bookingHistory.types';

interface BookingHistoryListProps {
  bookings: BookingHistoryItem[];
}

export function BookingHistoryList({ bookings }: BookingHistoryListProps) {
  const navigate = useNavigate();

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-border bg-card/10 rounded-xl max-w-md mx-auto my-8">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <CalendarDays className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No bookings found</h3>
        <p className="text-sm text-muted-foreground mb-6">
          You haven't purchased tickets for any events yet. Check out what's happening around you!
        </p>
        <Button onClick={() => navigate('/')} className="bg-brand-gradient hover:bg-brand-gradient-hover text-white shadow-brand-glow-sm">
          Browse Events
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {bookings.map((booking) => (
        <BookingHistoryCard
          key={booking.bookingReference}
          booking={booking}
        />
      ))}
    </div>
  );
}

export default BookingHistoryList;
