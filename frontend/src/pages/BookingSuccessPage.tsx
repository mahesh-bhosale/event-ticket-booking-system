import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { BookingConfirmResult } from '../types/event.types';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Calendar, MapPin, Armchair, Ticket } from 'lucide-react';

export default function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract booking info from routing state
  const state = location.state as { booking?: BookingConfirmResult } | null;
  const booking = state?.booking;

  // If accessed directly without booking state, redirect back to home page
  if (!booking) {
    return <Navigate to="/" replace />;
  }

  const formattedDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedBookedTime = new Date(booking.bookedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Visual Success Indicator */}
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900 shadow-md">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Booking Confirmed!</h1>
        <p className="text-sm text-muted-foreground">
          Your ticket reservation has been successfully confirmed. See your details below.
        </p>
      </div>

      {/* Ticket Details Card */}
      <Card className="border-border/40 shadow-lg overflow-hidden relative">
        {/* Ticket Header Graphic */}
        <div className="bg-primary text-primary-foreground p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            <span className="text-xs uppercase font-black tracking-widest opacity-90">Official Admission Ticket</span>
          </div>
          <span className="text-sm font-mono font-bold tracking-wider">{booking.bookingReference}</span>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Event Name */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Event Name</span>
            <h2 className="text-2xl font-bold text-foreground">{booking.eventName}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Event Time */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date & Time</span>
              <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Venue Location</span>
              <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{booking.venue}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Seat Numbers */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Confirmed Seats</span>
              <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
                <Armchair className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {booking.seatNumbers.map((seat) => (
                    <span
                      key={seat}
                      className="px-1.5 py-0.5 rounded bg-muted text-xs font-bold border"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booked At */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Transaction Time</span>
              <div className="text-sm text-foreground font-semibold">
                {formattedBookedTime}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Ticket Footer Tear-off Line */}
        <div className="border-t-2 border-dashed border-muted py-4 px-6 bg-accent/15 flex items-center justify-between text-xs text-muted-foreground">
          <span>Show this reference at entry gate</span>
          <span className="font-mono font-bold text-foreground">{booking.bookingId}</span>
        </div>
      </Card>

      {/* Button Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => navigate('/')} className="font-bold">
          View More Events
        </Button>
      </div>
    </div>
  );
}
